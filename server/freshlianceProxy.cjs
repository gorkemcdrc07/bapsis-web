require("dotenv").config();

const fs = require("fs");
const https = require("https");
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const crypto = require("crypto");

const app = express();

app.use(cors());
app.use(express.json());

const APP_ID = process.env.FRESHLIANCE_APP_ID;
const PRIVATE_KEY_RAW = (
    process.env.FRESHLIANCE_PRIVATE_KEY ||
    fs.readFileSync(require("path").join(__dirname, "freshliance_pkcs8.pem"), "utf8")
).replace(/\\n/g, "\n");
const API_URL = "https://api.freshliance.com/api";

const locationCache = new Map();

const liveDeviceCache = {
    key: null,
    data: null,
    expiresAt: 0,
};

const LIVE_CACHE_MS = 60 * 1000;



if (!APP_ID) {
    throw new Error("FRESHLIANCE_APP_ID environment variable tanýmlý deðil.");
}



function buildSignText(params) {
    return Object.keys(params)
        .filter((key) => key !== "sign" && params[key] !== "")
        .sort()
        .map((key) => `${key}=${params[key]}`)
        .join("&");
}

function createSign(params) {
    const signText = buildSignText(params);

    return crypto
        .sign("RSA-SHA256", Buffer.from(signText), PRIVATE_KEY_RAW)
        .toString("base64");
}

async function callFreshliance(method, bizContent) {
    const params = {
        appId: APP_ID,
        method,
        format: "json",
        charset: "utf-8",
        signType: "RSA2",
        timestamp: String(Date.now()),
        version: "1.0",
        bizContent: JSON.stringify(bizContent),
    };

    params.sign = createSign(params);

    const response = await axios.post(API_URL, params, {
        headers: { "Content-Type": "application/json" },
        httpsAgent: new https.Agent({ rejectUnauthorized: false }),
        timeout: 30000,
    });

    return response.data;
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function getDeviceCode(device) {
    return String(
        device.deviceCode ||
        device.deviceNo ||
        device.deviceSn ||
        device.sn ||
        device.imei ||
        device.code ||
        ""
    ).trim();
}

function getLocationCacheKey(latitude, longitude) {
    return `${Number(latitude).toFixed(4)},${Number(longitude).toFixed(4)}`;
}

async function reverseGeocode(latitude, longitude) {
    if (!latitude || !longitude) return null;

    const cacheKey = getLocationCacheKey(latitude, longitude);

    if (locationCache.has(cacheKey)) {
        return locationCache.get(cacheKey);
    }

    try {
        const response = await axios.get("https://nominatim.openstreetmap.org/reverse", {
            params: {
                format: "jsonv2",
                lat: latitude,
                lon: longitude,
                zoom: 10,
                addressdetails: 1,
                "accept-language": "tr",
            },
            headers: {
                "User-Agent": "bapsis-freshliance-proxy/1.0",
            },
            timeout: 10000,
        });

        const address = response.data?.address || {};

        const city =
            address.province ||
            address.city ||
            address.state ||
            address.region ||
            "";

        const district =
            address.town ||
            address.city_district ||
            address.county ||
            address.district ||
            address.village ||
            "";

        const value =
            [city, district].filter(Boolean).join(" / ") ||
            response.data?.display_name ||
            `${latitude}, ${longitude}`;

        locationCache.set(cacheKey, value);

        return value;
    } catch (error) {
        console.log("LOCATION ERROR:", latitude, longitude, error.message);
        return `${latitude}, ${longitude}`;
    }
}

async function getAllDevices() {
    const pageSize = 50;
    let pageNum = 1;
    let allRows = [];
    let total = 0;

    while (true) {
        const result = await callFreshliance("tracker.userDevice.page", {
            pageNum,
            pageSize,
        });

        if (result?.code !== "0") {
            throw new Error(
                `Freshliance cihaz listesi alýnamadý: ${result?.subMsg || result?.msg || "Bilinmeyen hata"
                }`
            );
        }

        const rows = result?.data?.rows || [];
        total = result?.data?.total || total;

        allRows = [...allRows, ...rows];

        if (!rows.length || allRows.length >= total) break;

        pageNum += 1;
    }

    return { total, rows: allRows };
}

async function getLatestProbeData(userDeviceTripId, device) {
    if (!userDeviceTripId) return null;

    const endTime = Date.now();

    const possibleBeginTimes = [
        device?.bindTime,
        device?.startTime,
        device?.beginTime,
        device?.tripStartTime,
        endTime - 30 * 24 * 60 * 60 * 1000,
    ].filter(Boolean);

    for (const beginTime of possibleBeginTimes) {
        for (const probeType of [0, 1]) {
            try {
                const result = await callFreshliance("tracker.tripData.pageProbeData", {
                    pageNum: 1,
                    pageSize: 10,
                    userDeviceTripId,
                    beginTime,
                    endTime,
                    probeType,
                });

                const rows = result?.data?.rows || [];

                if (result?.code === "0" && rows.length) {
                    return rows[0];
                }
            } catch (error) {
                console.log(
                    "PROBE ERROR:",
                    userDeviceTripId,
                    probeType,
                    error.response?.data || error.message
                );
            }
        }
    }

    return null;
}

function extractTemperature(probe) {
    if (!probe) return null;

    return (
        probe.temperature ??
        probe.temp ??
        probe.tem ??
        probe.value ??
        probe.propertyValue ??
        probe.temperatureValue ??
        null
    );
}

function extractHumidity(probe) {
    if (!probe) return null;

    return probe.humidity ?? probe.hum ?? probe.humidityValue ?? null;
}

function createPayload(rows) {
    return {
        ok: true,
        source: "freshliance",
        cached: false,
        result: {
            code: "0",
            msg: "success",
            data: {
                total: rows.length,
                rows,
            },
        },
    };
}

app.get("/freshliance/devices", async (req, res) => {
    try {
        const requestedCodes = String(req.query.codes || "")
            .split(",")
            .map((code) => code.trim())
            .filter(Boolean);

        const cacheKey = requestedCodes.length
            ? requestedCodes.sort().join(",")
            : "ALL";

        if (
            liveDeviceCache.data &&
            liveDeviceCache.key === cacheKey &&
            liveDeviceCache.expiresAt > Date.now()
        ) {
            return res.json({
                ...liveDeviceCache.data,
                cached: true,
            });
        }

        const requestedCodeSet = new Set(requestedCodes);

        const deviceResult = await getAllDevices();
        const devices = deviceResult.rows || [];

        const targetDevices = requestedCodeSet.size
            ? devices.filter((device) => requestedCodeSet.has(getDeviceCode(device)))
            : devices;

        const devicesWithExtra = [];

        for (const device of targetDevices) {
            let probe = null;
            let locationText = null;

            if (device.userDeviceTripId) {
                probe = await getLatestProbeData(device.userDeviceTripId, device);
                await sleep(50);
            }

            if (device.latitude && device.longitude) {
                locationText = await reverseGeocode(device.latitude, device.longitude);
                await sleep(50);
            }

            devicesWithExtra.push({
                ...device,
                deviceCode: getDeviceCode(device),
                locationText,
                probe_raw: probe,
                temperature: extractTemperature(probe),
                humidity: extractHumidity(probe),
            });
        }

        const payload = createPayload(devicesWithExtra);

        liveDeviceCache.key = cacheKey;
        liveDeviceCache.data = payload;
        liveDeviceCache.expiresAt = Date.now() + LIVE_CACHE_MS;

        res.json(payload);
    } catch (error) {
        console.error("FRESHLIANCE ERROR:", error.message);

        res.status(500).json({
            ok: false,
            error: error.message,
            response: error.response?.data || null,
        });
    }
});

app.get("/health", (req, res) => {
    res.json({
        ok: true,
        message: "Freshliance proxy çalýþýyor",
        cache: {
            key: liveDeviceCache.key,
            active: Boolean(liveDeviceCache.data && liveDeviceCache.expiresAt > Date.now()),
            expiresAt: liveDeviceCache.expiresAt,
        },
    });
});

const PORT = process.env.PORT || 4001;

app.listen(PORT, () => {
    console.log(`Freshliance proxy running on http://localhost:${PORT}`);
});