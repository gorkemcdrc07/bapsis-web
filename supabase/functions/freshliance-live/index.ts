import "@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

const API_URL = "http://api.freshliance.com/api"
const APP_ID = Deno.env.get("FRESHLIANCE_APP_ID") || ""
const PRIVATE_KEY_RAW = Deno.env.get("FRESHLIANCE_PRIVATE_KEY") || ""

function jsonResponse(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: corsHeaders,
    })
}

function base64ToArrayBuffer(base64: string) {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)

    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i)
    }

    return bytes.buffer
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
    const bytes = new Uint8Array(buffer)
    let binary = ""

    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i])
    }

    return btoa(binary)
}

async function importPrivateKey(rawKey: string) {
    const cleanedKey = rawKey
        .replace(/-----BEGIN PRIVATE KEY-----/g, "")
        .replace(/-----END PRIVATE KEY-----/g, "")
        .replace(/\s/g, "")

    return await crypto.subtle.importKey(
        "pkcs8",
        base64ToArrayBuffer(cleanedKey),
        {
            name: "RSASSA-PKCS1-v1_5",
            hash: "SHA-256",
        },
        false,
        ["sign"],
    )
}

function buildSignText(params: Record<string, string>) {
    return Object.keys(params)
        .filter((key) => key !== "sign" && params[key] !== "")
        .sort()
        .map((key) => `${key}=${params[key]}`)
        .join("&")
}

async function createSign(params: Record<string, string>) {
    const privateKey = await importPrivateKey(PRIVATE_KEY_RAW)
    const signText = buildSignText(params)

    const signature = await crypto.subtle.sign(
        "RSASSA-PKCS1-v1_5",
        privateKey,
        new TextEncoder().encode(signText),
    )

    return arrayBufferToBase64(signature)
}

async function callFreshliance(method: string, bizContent: Record<string, unknown>) {
    const params: Record<string, string> = {
        appId: APP_ID,
        method,
        format: "json",
        charset: "utf-8",
        signType: "RSA2",
        timestamp: String(Date.now()),
        version: "1.0",
        bizContent: JSON.stringify(bizContent),
    }

    params.sign = await createSign(params)

    const response = await fetch(API_URL, {
        method: "POST",
        redirect: "manual",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
    })

    if (response.status >= 300 && response.status < 400) {
        return {
            redirect: true,
            status: response.status,
            location: response.headers.get("location"),
        }
    }
    const text = await response.text()

    try {
        return JSON.parse(text)
    } catch {
        return {
            parseError: true,
            rawText: text,
        }
    }
}

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders })
    }

    try {
        const result = await callFreshliance("tracker.userDevice.page", {
            pageNum: 1,
            pageSize: 50,
        })

        return jsonResponse({
            ok: true,
            debugStep: "freshliance-user-device-page",
            apiUrl: API_URL,
            result,
        })
    } catch (error) {
        return jsonResponse({
            ok: false,
            debugStep: "freshliance-user-device-page",
            error: String(error),
            stack: error instanceof Error ? error.stack : null,
        }, 500)
    }
})