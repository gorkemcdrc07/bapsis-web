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
const PRIVATE_KEY = fs.readFileSync("../freshliance_pkcs8.pem", "utf8");

const API_URL = "https://api.freshliance.com/api";

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
        .sign("RSA-SHA256", Buffer.from(signText), PRIVATE_KEY)
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
        headers: {
            "Content-Type": "application/json",
        },
        httpsAgent: new https.Agent({
            rejectUnauthorized: false,
        }),
        timeout: 30000,
    });

    return response.data;
}

app.get("/freshliance/devices", async (req, res) => {
    try {
        const result = await callFreshliance("tracker.userDevice.page", {
            pageNum: 1,
            pageSize: 50,
        });

        res.json({
            ok: true,
            source: "freshliance",
            result,
        });
    } catch (error) {
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
