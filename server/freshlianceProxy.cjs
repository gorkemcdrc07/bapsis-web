require("dotenv").config();

const https = require("https");
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const crypto = require("crypto");

const app = express();

app.use(cors());
app.use(express.json());

const APP_ID = process.env.FRESHLIANCE_APP_ID;
let PRIVATE_KEY = process.env.FRESHLIANCE_PRIVATE_KEY;

function normalizePrivateKey(key) {
    if (!key) return "";

    let clean = String(key)
        .replace(/\\n/g, "\n")
        .replace(/\r/g, "")
        .trim();

    clean = clean
        .replace("-----BEGIN PRIVATE KEY-----", "")
        .replace("-----END PRIVATE KEY-----", "")
        .replace("-----BEGIN RSA PRIVATE KEY-----", "")
        .replace("-----END RSA PRIVATE KEY-----", "")
        .replace(/\s+/g, "");

    const lines = clean.match(/.{1,64}/g)?.join("\n") || clean;

    return `-----BEGIN RSA PRIVATE KEY-----\n${lines}\n-----END RSA PRIVATE KEY-----`;
}

PRIVATE_KEY = normalizePrivateKey(PRIVATE_KEY);

if (!APP_ID) {
    throw new Error("FRESHLIANCE_APP_ID environment variable tanýmlý deðil.");
}

if (!PRIVATE_KEY) {
    throw new Error("FRESHLIANCE_PRIVATE_KEY environment variable tanýmlý deðil.");
}

const API_URL = "https://api.freshliance.com/api";
const locationCache = new Map();

function buildSignText(params) {
    return Object.keys(params)
        .filter((key) => key !== "sign" && params[key] !== "")
        .sort()
        .map((key) => `${key}=${params[key]}`)
        .join("&");
}

function createSign(params) {
    const signText = buildSignText(params);

    const privateKeyObject = crypto.createPrivateKey({
        key: PRIVATE_KEY,
        format: "pem",
        type: "pkcs1",
    });

    return crypto
        .sign("RSA-SHA256", Buffer.from(signText), privateKeyObject)
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

function getLastHoursRange(hours = 24) {
    const endTime = Date.now();
    const beginTime = endTime - hours * 60 * 60 * 1000;
    return { beginTime, endTime };
}

async function getLatestProbeData(userDeviceTripId) {
    if (!userDeviceTripId) return null;

    const { beginTime, endTime } = getLastHoursRange(24);

    const result = await callFreshliance("tracker.tripData.pageProbeData", {
        pageNum: 1,
        pageSize: 10,
        userDeviceTripId,
        beginTime,
        endTime,
    });

    if (result?.code !== "0") return null;

    const rows = result?.data?.rows || [];
    return rows[0] || null;
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
        const response = await axios.get(
            "https://nominatim.openstreetmap.org/reverse",
            {
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
            }
        );

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

        const locationText = [city, district].filter(Boolean).join(" / ");

        const value =
            locationText ||
            response.data?.display_name ||
            `${latitude}, ${longitude}`;

        locationCache.set(cacheKey, value);

        return value;
    } catch (error) {
        console.log("LOCATION ERROR:", latitude, longitude, error.message);
        return `${latitude}, ${longitude}`;
    }
}

app.get("/freshliance/devices", async (req, res) => {
    try {
        const requestedCodes = String(req.query.codes || "")
            .split(",")
            .map((code) => code.trim())
            .filter(Boolean);

        const requestedCodeSet = new Set(requestedCodes);

        const deviceResult = await getAllDevices();
        const devices = deviceResult.rows || [];

        const targetDevices = requestedCodeSet.size
            ? devices.filter((device) =>
                requestedCodeSet.has(String(device.deviceCode || "").trim())
            )
            : devices;

        const devicesWithExtra = [];

        for (const device of targetDevices) {
            let probe = null;
            let locationText = null;

            if (requestedCodeSet.size && device.userDeviceTripId) {
                try {
                    probe = await getLatestProbeData(device.userDeviceTripId);
                    await sleep(250);
                } catch (error) {
                    console.log(
                        "PROBE ERROR:",
                        device.deviceCode,
                        device.userDeviceTripId,
                        error.message
                    );
                }
            }

            if (device.latitude && device.longitude) {
                locationText = await reverseGeocode(
                    device.latitude,
                    device.longitude
                );
                await sleep(250);
            }

            devicesWithExtra.push({
                ...device,
                locationText,
                probe_raw: probe,
                temperature: extractTemperature(probe),
                humidity: extractHumidity(probe),
            });
        }

        res.json({
            ok: true,
            source: "freshliance",
            result: {
                code: "0",
                msg: "success",
                data: {
                    total: targetDevices.length,
                    rows: devicesWithExtra,
                },
            },
        });
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
    });
});

const PORT = process.env.PORT || 4001;

app.listen(PORT, () => {
    console.log(`Freshliance proxy running on http://localhost:${PORT}`);
});