import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const API_URL = Deno.env.get("FRESHLIANCE_API_URL")!;
const APP_ID = Deno.env.get("FRESHLIANCE_APP_ID")!;
const PRIVATE_KEY_BASE64 = Deno.env.get("FRESHLIANCE_PRIVATE_KEY")!;

const PROJECT_URL = Deno.env.get("PROJECT_URL")!;
const PROJECT_SERVICE_ROLE_KEY = Deno.env.get("PROJECT_SERVICE_ROLE_KEY")!;

const supabase = createClient(PROJECT_URL, PROJECT_SERVICE_ROLE_KEY);

function toBase64(buffer: ArrayBuffer) {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary);
}

function encodeLength(length: number) {
    if (length < 128) return new Uint8Array([length]);

    const bytes: number[] = [];
    while (length > 0) {
        bytes.unshift(length & 0xff);
        length >>= 8;
    }

    return new Uint8Array([0x80 | bytes.length, ...bytes]);
}

function concatBytes(...arrays: Uint8Array[]) {
    const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
    const result = new Uint8Array(totalLength);

    let offset = 0;
    for (const arr of arrays) {
        result.set(arr, offset);
        offset += arr.length;
    }

    return result;
}

function derSequence(content: Uint8Array) {
    return concatBytes(new Uint8Array([0x30]), encodeLength(content.length), content);
}

function derOctetString(content: Uint8Array) {
    return concatBytes(new Uint8Array([0x04]), encodeLength(content.length), content);
}

function pkcs1ToPkcs8(pkcs1Der: Uint8Array) {
    const version = new Uint8Array([0x02, 0x01, 0x00]);

    const rsaEncryptionAlgorithm = derSequence(
        new Uint8Array([
            0x06, 0x09,
            0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01,
            0x05, 0x00,
        ])
    );

    const privateKey = derOctetString(pkcs1Der);

    return derSequence(concatBytes(version, rsaEncryptionAlgorithm, privateKey));
}

async function signText(text: string) {
    const pkcs1Der = Uint8Array.from(atob(PRIVATE_KEY_BASE64), (c) =>
        c.charCodeAt(0)
    );

    const pkcs8Der = pkcs1ToPkcs8(pkcs1Der);

    const cryptoKey = await crypto.subtle.importKey(
        "pkcs8",
        pkcs8Der.buffer,
        {
            name: "RSASSA-PKCS1-v1_5",
            hash: "SHA-256",
        },
        false,
        ["sign"]
    );

    const signature = await crypto.subtle.sign(
        "RSASSA-PKCS1-v1_5",
        cryptoKey,
        new TextEncoder().encode(text)
    );

    return toBase64(signature);
}

function buildSignContent(params: Record<string, string>) {
    return Object.keys(params)
        .filter((key) => key !== "sign" && params[key] !== "")
        .sort()
        .map((key) => `${key}=${params[key]}`)
        .join("&");
}

async function freshlianceRequest(method: string, bizContent = "{}") {
    const params: Record<string, string> = {
        appId: APP_ID,
        method,
        format: "JSON",
        charset: "UTF-8",
        signType: "RSA2",
        timestamp: Date.now().toString(),
        version: "1.0",
        bizContent,
    };

    const signContent = buildSignContent(params);
    const sign = await signText(signContent);

    const response = await fetch(API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            ...params,
            sign,
        }),
    });

    const text = await response.text();

    return {
        httpStatus: response.status,
        signContent,
        raw: text,
        parsed: JSON.parse(text),
    };
}

function msToIso(value: number | null | undefined) {
    if (!value) return null;
    return new Date(value).toISOString();
}

async function getLatestProbeData(userDeviceTripId: number) {
    const endTime = Date.now();
    const beginTime = endTime - 24 * 60 * 60 * 1000;

    const result = await freshlianceRequest(
        "tracker.tripData.pageProbeData",
        JSON.stringify({
            userDeviceTripId,
            beginTime,
            endTime,
            pageNum: 1,
            pageSize: 1,
        })
    );

    const rows = result.parsed?.data?.rows ?? [];
    return rows[0] || null;
}

async function syncDevices() {
    const result = await freshlianceRequest(
        "tracker.userDevice.page",
        JSON.stringify({
            pageNum: 1,
            pageSize: 50,
        })
    );

    const rows = result.parsed?.data?.rows ?? [];

    const mappedRows = await Promise.all(
        rows.map(async (device: any) => {
            const probe = device.userDeviceTripId
                ? await getLatestProbeData(device.userDeviceTripId)
                : null;

            return {
                user_device_id: device.userDeviceId,
                user_device_trip_id: device.userDeviceTripId,
                device_code: device.deviceCode,
                custom_name: device.customName,
                battery: device.battery,
                latitude: device.latitude,
                longitude: device.longitude,
                battery_time: msToIso(device.batteryTime),
                bind_time: msToIso(device.bindTime),
                temperature: probe?.temperature ?? probe?.temp ?? null,
                humidity: probe?.humidity ?? null,
                probe_time: msToIso(probe?.reportTime ?? probe?.createTime ?? probe?.time ?? probe?.ts),
                probe_raw: probe,
                raw: device,
                updated_at: new Date().toISOString(),
            };
        })
    );

    if (mappedRows.length === 0) {
        return {
            ok: true,
            message: "Freshliance cihaz bulunamadý",
            api: result.parsed,
            savedCount: 0,
        };
    }

    const { data, error } = await supabase
        .from("freshliance_devices")
        .upsert(mappedRows, {
            onConflict: "user_device_id",
        })
        .select();

    if (error) {
        throw new Error(error.message);
    }

    return {
        ok: true,
        message: "Freshliance cihazlarý ve sýcaklýk verileri senkronize edildi",
        savedCount: data?.length ?? 0,
        devices: data,
    };
}

Deno.serve(async () => {
    try {
        const result = await syncDevices();

        return new Response(JSON.stringify(result, null, 2), {
            headers: {
                "Content-Type": "application/json; charset=utf-8",
            },
        });
    } catch (error) {
        return new Response(
            JSON.stringify(
                {
                    ok: false,
                    error: error instanceof Error ? error.message : String(error),
                },
                null,
                2
            ),
            {
                status: 500,
                headers: {
                    "Content-Type": "application/json; charset=utf-8",
                },
            }
        );
    }
});