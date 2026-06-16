import { useEffect, useRef, useState, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// ── Sabitler ────────────────────────────────────────────────────────────────

const REFRESH_INTERVAL = 30_000; // 30 saniye

const STATUS_CONFIG = {
    OK: { color: "#16a34a", bg: "#dcfce7", text: "#15803d", label: "Normal" },
    ALARM: { color: "#ef4444", bg: "#fee2e2", text: "#dc2626", label: "Alarm" },
    OFFLINE: { color: "#6b7280", bg: "#f3f4f6", text: "#6b7280", label: "Offline" },
};

// Sıcaklığa göre renk (mavi → yeşil → sarı → kırmızı)
function tempToColor(temp) {
    if (temp == null) return "#6b7280";
    if (temp <= 0) return "#3b82f6";
    if (temp <= 5) return "#06b6d4";
    if (temp <= 10) return "#22c55e";
    if (temp <= 15) return "#eab308";
    if (temp <= 20) return "#f97316";
    return "#ef4444";
}

// ── SVG Marker ───────────────────────────────────────────────────────────────

function createMarkerIcon(color, pulse = false, label = "") {
    const ring = pulse
        ? `<circle cx="20" cy="20" r="17" fill="${color}" opacity="0.18"/>`
        : "";
    const badge = label
        ? `<rect x="6" y="38" width="28" height="13" rx="6" fill="${color}"/>
           <text x="20" y="48" text-anchor="middle" font-size="8" font-weight="700"
                 fill="white" font-family="system-ui">${label}</text>`
        : "";
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="54" viewBox="0 0 40 54">
            ${ring}
            <circle cx="20" cy="20" r="13" fill="${color}" stroke="white" stroke-width="2.5"/>
            <circle cx="20" cy="20" r="5" fill="white"/>
            <line x1="20" y1="33" x2="20" y2="50" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/>
            ${badge}
        </svg>`;
    return L.divIcon({
        html: svg,
        className: "",
        iconSize: [40, 54],
        iconAnchor: [20, 50],
        popupAnchor: [0, -52],
    });
}

// ── Haritayı cihazlara sığdıran yardımcı ────────────────────────────────────

function MapFitter({ devices }) {
    const map = useMap();
    useEffect(() => {
        const valid = devices.filter(
            d => !isNaN(Number(d.latitude)) && !isNaN(Number(d.longitude))
        );
        if (valid.length === 1) {
            map.setView([Number(valid[0].latitude), Number(valid[0].longitude)], 13);
        } else if (valid.length > 1) {
            const bounds = L.latLngBounds(
                valid.map(d => [Number(d.latitude), Number(d.longitude)])
            );
            map.fitBounds(bounds, { padding: [48, 48] });
        }
    }, [devices]);
    return null;
}

// ── Mini sıcaklık grafiği ────────────────────────────────────────────────────

function TempSparkline({ history = [] }) {
    if (!history.length) return (
        <div style={{ color: "#9ca3af", fontSize: 11, textAlign: "center", padding: "8px 0" }}>
            Sıcaklık geçmişi yok
        </div>
    );

    const W = 200, H = 48, pad = 6;
    const temps = history.map(h => h.temperature);
    const times = history.map(h => h.time);
    const minT = Math.min(...temps);
    const maxT = Math.max(...temps);
    const range = maxT - minT || 1;
    const step = (W - pad * 2) / Math.max(history.length - 1, 1);

    const points = temps.map((t, i) => [
        pad + i * step,
        H - pad - ((t - minT) / range) * (H - pad * 2),
    ]);

    const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
    const areaD = pathD + ` L${points.at(-1)[0]},${H - pad} L${pad},${H - pad} Z`;

    const lastColor = tempToColor(temps.at(-1));

    return (
        <svg width={W} height={H} style={{ display: "block", overflow: "visible" }}>
            <defs>
                <linearGradient id="tg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={lastColor} stopOpacity="0.25" />
                    <stop offset="100%" stopColor={lastColor} stopOpacity="0.02" />
                </linearGradient>
            </defs>
            <path d={areaD} fill="url(#tg)" />
            <path d={pathD} fill="none" stroke={lastColor} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
            {points.map((p, i) => (
                <circle key={i} cx={p[0]} cy={p[1]} r="2.5" fill={tempToColor(temps[i])} stroke="white" strokeWidth="1" />
            ))}
            <text x={pad} y={H - 1} fontSize="9" fill="#9ca3af" fontFamily="system-ui">
                {times[0]}
            </text>
            <text x={W - pad} y={H - 1} fontSize="9" fill="#9ca3af" fontFamily="system-ui" textAnchor="end">
                {times.at(-1)}
            </text>
        </svg>
    );
}

// ── Alarm geçmişi özeti ──────────────────────────────────────────────────────

function AlarmHistory({ alarms = [] }) {
    if (!alarms.length) return (
        <div style={{ color: "#9ca3af", fontSize: 11 }}>Son alarm kaydı yok</div>
    );
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {alarms.slice(0, 4).map((a, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}>
                    <span style={{
                        width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
                        background: a.level === "ALARM" ? "#ef4444" : "#6b7280",
                    }} />
                    <span style={{ color: "#374151", flex: 1 }}>{a.message || a.level}</span>
                    <span style={{ color: "#9ca3af", whiteSpace: "nowrap" }}>
                        {a.time ? new Date(a.time).toLocaleString("tr-TR", {
                            day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit"
                        }) : "-"}
                    </span>
                </div>
            ))}
        </div>
    );
}

// ── Kümeleme yardımcısı ──────────────────────────────────────────────────────

function clusterDevices(devices, zoomLevel) {
    if (zoomLevel >= 10 || devices.length <= 1) return devices.map(d => ({ ...d, _cluster: false }));

    const THRESH = zoomLevel < 6 ? 3.0 : 1.5;
    const used = new Set();
    const result = [];

    devices.forEach((d, i) => {
        if (used.has(i)) return;
        const group = [d];
        used.add(i);

        devices.forEach((d2, j) => {
            if (used.has(j)) return;
            const dLat = Math.abs(Number(d.latitude) - Number(d2.latitude));
            const dLng = Math.abs(Number(d.longitude) - Number(d2.longitude));
            if (dLat < THRESH && dLng < THRESH) {
                group.push(d2);
                used.add(j);
            }
        });

        if (group.length === 1) {
            result.push({ ...d, _cluster: false });
        } else {
            const lat = group.reduce((s, x) => s + Number(x.latitude), 0) / group.length;
            const lng = group.reduce((s, x) => s + Number(x.longitude), 0) / group.length;
            const hasAlarm = group.some(x => x.freshlianceAlarmLevel === "ALARM");
            result.push({
                ...group[0],
                latitude: lat,
                longitude: lng,
                _cluster: true,
                _clusterCount: group.length,
                freshlianceAlarmLevel: hasAlarm ? "ALARM" : group[0].freshlianceAlarmLevel,
                _members: group,
            });
        }
    });

    return result;
}

// ── Küme ikonu ───────────────────────────────────────────────────────────────

function createClusterIcon(count, color) {
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44">
            <circle cx="22" cy="22" r="20" fill="${color}" opacity="0.2"/>
            <circle cx="22" cy="22" r="15" fill="${color}" stroke="white" stroke-width="2.5"/>
            <text x="22" y="27" text-anchor="middle" font-size="13" font-weight="800"
                  fill="white" font-family="system-ui">${count}</text>
        </svg>`;
    return L.divIcon({
        html: svg,
        className: "",
        iconSize: [44, 44],
        iconAnchor: [22, 22],
        popupAnchor: [0, -24],
    });
}

// ── Zoom takibi ──────────────────────────────────────────────────────────────

function ZoomTracker({ onZoom }) {
    const map = useMap();
    useEffect(() => {
        const handle = () => onZoom(map.getZoom());
        map.on("zoomend", handle);
        return () => map.off("zoomend", handle);
    }, [map]);
    return null;
}

// ── Üst bilgi şeridi ─────────────────────────────────────────────────────────

function MapInfoBar({ devices, onRefresh, refreshing, lastRefresh }) {
    const total = devices.length;
    const alarms = devices.filter(d => d.freshlianceAlarmLevel === "ALARM").length;
    const offline = devices.filter(d => d.freshlianceAlarmLevel === "OFFLINE").length;
    const ok = total - alarms - offline;

    return (
        <div style={{
            display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
            padding: "8px 12px", background: "#fff",
            borderBottom: "1px solid #e5e7eb", fontSize: 12,
        }}>
            <span style={{ fontWeight: 700, color: "#111827" }}>
                {total} Cihaz
            </span>
            <span style={{ color: "#16a34a", fontWeight: 600 }}>✔ {ok} Normal</span>
            {alarms > 0 && <span style={{ color: "#ef4444", fontWeight: 700 }}>⚠ {alarms} Alarm</span>}
            {offline > 0 && <span style={{ color: "#6b7280" }}>● {offline} Offline</span>}

            <span style={{ marginLeft: "auto", color: "#9ca3af", fontSize: 11 }}>
                {lastRefresh ? `Son güncelleme: ${lastRefresh}` : ""}
            </span>

            <button
                onClick={onRefresh}
                disabled={refreshing}
                style={{
                    height: 28, padding: "0 12px", border: "1px solid #e5e7eb",
                    borderRadius: 6, background: "#fff", cursor: "pointer",
                    fontSize: 11, fontWeight: 700, color: "#374151",
                    display: "flex", alignItems: "center", gap: 5,
                    opacity: refreshing ? 0.6 : 1,
                }}
            >
                <span style={{
                    display: "inline-block",
                    animation: refreshing ? "spin 0.8s linear infinite" : "none",
                }}>↻</span>
                Yenile
            </button>
        </div>
    );
}

// ── Renk skalası göstergesi ──────────────────────────────────────────────────

function TempLegend() {
    const stops = [
        { label: "≤0°C", color: "#3b82f6" },
        { label: "≤5°C", color: "#06b6d4" },
        { label: "≤10°C", color: "#22c55e" },
        { label: "≤15°C", color: "#eab308" },
        { label: "≤20°C", color: "#f97316" },
        { label: ">20°C", color: "#ef4444" },
    ];
    return (
        <div style={{
            position: "absolute", bottom: 28, left: 12, zIndex: 1000,
            background: "rgba(255,255,255,0.95)",
            border: "1px solid #e5e7eb", borderRadius: 8,
            padding: "8px 10px", fontSize: 11,
        }}>
            <div style={{ fontWeight: 700, color: "#374151", marginBottom: 6 }}>
                Sıcaklık
            </div>
            {stops.map(s => (
                <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                    <span style={{ width: 10, height: 10, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
                    <span style={{ color: "#6b7280" }}>{s.label}</span>
                </div>
            ))}
        </div>
    );
}

// ── Ana bileşen ──────────────────────────────────────────────────────────────

export default function FleetMap({
    devices = [],
    onRefresh,           // dışarıdan gerçek zamanlı yenileme fonksiyonu
    autoRefresh = true,
}) {
    const [zoomLevel, setZoomLevel] = useState(6);
    const [refreshing, setRefreshing] = useState(false);
    const [lastRefresh, setLastRefresh] = useState("");
    const [selectedRoute, setSelectedRoute] = useState(null); // { deviceCode, points }
    const timerRef = useRef(null);

    // Kümelenmiş cihazlar
    const clustered = clusterDevices(
        devices.filter(d => !isNaN(Number(d.latitude)) && !isNaN(Number(d.longitude))),
        zoomLevel
    );

    // Gerçek zamanlı yenileme
    const doRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            if (onRefresh) await onRefresh();
        } finally {
            setRefreshing(false);
            setLastRefresh(new Date().toLocaleTimeString("tr-TR"));
        }
    }, [onRefresh]);

    useEffect(() => {
        if (!autoRefresh) return;
        timerRef.current = setInterval(doRefresh, REFRESH_INTERVAL);
        return () => clearInterval(timerRef.current);
    }, [doRefresh, autoRefresh]);

    // Rota noktaları: cihaz history dizisinden gelir
    const routePoints = selectedRoute?.points?.map(p => [Number(p.lat), Number(p.lng)]) || [];

    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100%", position: "relative" }}>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

            <MapInfoBar
                devices={devices}
                onRefresh={doRefresh}
                refreshing={refreshing}
                lastRefresh={lastRefresh}
            />

            <div style={{ flex: 1, position: "relative" }}>
                <MapContainer
                    center={[39.0, 35.0]}
                    zoom={6}
                    style={{ height: "100%", width: "100%" }}
                    zoomControl
                >
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution="© OpenStreetMap"
                    />

                    <MapFitter devices={devices} />
                    <ZoomTracker onZoom={setZoomLevel} />

                    {/* Rota çizgisi */}
                    {routePoints.length > 1 && (
                        <Polyline
                            positions={routePoints}
                            pathOptions={{ color: "#6366f1", weight: 3, dashArray: "6 4", opacity: 0.85 }}
                        />
                    )}

                    {clustered.map((d, idx) => {
                        const lat = Number(d.latitude);
                        const lng = Number(d.longitude);
                        const level = d.freshlianceAlarmLevel || "OFFLINE";
                        const cfg = STATUS_CONFIG[level] || STATUS_CONFIG.OFFLINE;
                        const temp = d.probe_raw?.temperature ?? d.temperature;
                        const markerColor = tempToColor(temp);

                        const icon = d._cluster
                            ? createClusterIcon(d._clusterCount, cfg.color)
                            : createMarkerIcon(markerColor, level === "ALARM", d.device_code?.slice(-4));

                        return (
                            <Marker key={idx} position={[lat, lng]} icon={icon}>
                                <Popup minWidth={260} maxWidth={300}>
                                    <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13 }}>

                                        {/* Başlık */}
                                        <div style={{
                                            display: "flex", alignItems: "center", gap: 8,
                                            marginBottom: 10, paddingBottom: 8,
                                            borderBottom: "1px solid #f1f5f9",
                                        }}>
                                            <div style={{
                                                width: 10, height: 10, borderRadius: "50%",
                                                background: cfg.color, flexShrink: 0,
                                                boxShadow: level === "ALARM" ? `0 0 0 4px ${cfg.bg}` : "none",
                                            }} />
                                            <strong style={{ fontSize: 14, color: "#111827" }}>
                                                {d._cluster ? `${d._clusterCount} Cihaz` : (d.device_code || "Cihaz")}
                                            </strong>
                                            <span style={{
                                                marginLeft: "auto", fontSize: 11, fontWeight: 700,
                                                padding: "2px 8px", borderRadius: 999,
                                                background: cfg.bg, color: cfg.text,
                                            }}>
                                                {cfg.label}
                                            </span>
                                        </div>

                                        {/* Küme içeriği */}
                                        {d._cluster ? (
                                            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                                {d._members.map((m, mi) => {
                                                    const mc = STATUS_CONFIG[m.freshlianceAlarmLevel || "OFFLINE"];
                                                    return (
                                                        <div key={mi} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                                                            <span style={{ width: 7, height: 7, borderRadius: "50%", background: mc.color, flexShrink: 0 }} />
                                                            <span style={{ color: "#111827", fontWeight: 600 }}>{m.device_code}</span>
                                                            <span style={{ color: "#6b7280", marginLeft: "auto" }}>
                                                                {m.probe_raw?.temperature ?? m.temperature ?? "-"}°C
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <>
                                                {/* Temel bilgiler */}
                                                <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 10 }}>
                                                    <tbody>
                                                        {[
                                                            ["🌡️", "Sıcaklık", temp != null ? `${temp}°C` : "-"],
                                                            ["🔋", "Batarya", d.battery != null ? `%${d.battery}` : "-"],
                                                            ["📍", "Konum", `${lat.toFixed(5)}, ${lng.toFixed(5)}`],
                                                            ["🕒", "Güncelleme", d.updated_at
                                                                ? new Date(d.updated_at).toLocaleString("tr-TR")
                                                                : "-"],
                                                        ].map(([icon, label, value]) => (
                                                            <tr key={label}>
                                                                <td style={{ padding: "3px 0", color: "#9ca3af", width: 20 }}>{icon}</td>
                                                                <td style={{ padding: "3px 6px", color: "#6b7280" }}>{label}</td>
                                                                <td style={{ padding: "3px 0", fontWeight: 600, textAlign: "right", color: "#111827" }}>{value}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>

                                                {/* Araç / şoför */}
                                                {(d.plate || d.driver) && (
                                                    <div style={{
                                                        background: "#f8fafc", borderRadius: 8, padding: "8px 10px",
                                                        marginBottom: 10, display: "flex", gap: 12,
                                                    }}>
                                                        {d.plate && (
                                                            <div>
                                                                <div style={{ fontSize: 10, color: "#9ca3af", fontWeight: 700, marginBottom: 2 }}>ARAÇ</div>
                                                                <div style={{ fontWeight: 800, color: "#111827", letterSpacing: "0.05em" }}>{d.plate}</div>
                                                            </div>
                                                        )}
                                                        {d.driver && (
                                                            <div>
                                                                <div style={{ fontSize: 10, color: "#9ca3af", fontWeight: 700, marginBottom: 2 }}>SÜRÜCÜ</div>
                                                                <div style={{ fontWeight: 600, color: "#374151" }}>{d.driver}</div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Sıcaklık mini grafiği */}
                                                {d.tempHistory?.length > 0 && (
                                                    <div style={{ marginBottom: 10 }}>
                                                        <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", marginBottom: 5 }}>
                                                            Sıcaklık Geçmişi
                                                        </div>
                                                        <TempSparkline history={d.tempHistory} />
                                                    </div>
                                                )}

                                                {/* Alarm geçmişi */}
                                                {d.alarmHistory?.length > 0 && (
                                                    <div style={{
                                                        borderTop: "1px solid #f1f5f9", paddingTop: 8, marginTop: 4,
                                                    }}>
                                                        <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", marginBottom: 5 }}>
                                                            Son Alarmlar
                                                        </div>
                                                        <AlarmHistory alarms={d.alarmHistory} />
                                                    </div>
                                                )}

                                                {/* Rota butonu */}
                                                {d.routeHistory?.length > 1 && (
                                                    <button
                                                        onClick={() => setSelectedRoute(
                                                            selectedRoute?.deviceCode === d.device_code
                                                                ? null
                                                                : { deviceCode: d.device_code, points: d.routeHistory }
                                                        )}
                                                        style={{
                                                            marginTop: 10, width: "100%", height: 30,
                                                            border: "1px solid #e0e7ff", borderRadius: 7,
                                                            background: selectedRoute?.deviceCode === d.device_code ? "#eef2ff" : "#fff",
                                                            color: "#6366f1", fontSize: 12, fontWeight: 700,
                                                            cursor: "pointer",
                                                        }}
                                                    >
                                                        {selectedRoute?.deviceCode === d.device_code ? "✕ Rotayı Kaldır" : "🗺 Rotayı Göster"}
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </Popup>
                            </Marker>
                        );
                    })}
                </MapContainer>

                <TempLegend />
            </div>
        </div>
    );
}