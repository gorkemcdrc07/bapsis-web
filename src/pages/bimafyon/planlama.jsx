import { useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import "./planlama.css";
import { supabase } from "../../lib/supabaseClient";
import { usePagePermission } from "../../permissions/usePagePermission";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

function formatDate(date) {
    if (!date) return "";
    const [y, m, d] = String(date).split("-");
    return `${d}.${m}.${y}`;
}

function formatNumber(value, digits = 0) {
    const n = Number(value || 0);
    if (Number.isNaN(n)) return "0";
    return new Intl.NumberFormat("tr-TR", {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
    }).format(n);
}

function normalizeDate(value) {
    if (!value) return null;

    if (value instanceof Date && !Number.isNaN(value.getTime())) {
        const y = value.getFullYear();
        const m = String(value.getMonth() + 1).padStart(2, "0");
        const d = String(value.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
    }

    if (typeof value === "number") {
        const p = XLSX.SSF.parse_date_code(value);
        if (p) return `${p.y}-${String(p.m).padStart(2, "0")}-${String(p.d).padStart(2, "0")}`;
    }

    const str = String(value).trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0, 10);
    if (/^\d{2}\.\d{2}\.\d{4}$/.test(str)) {
        const [d, m, y] = str.split(".");
        return `${y}-${m}-${d}`;
    }
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
        const [d, m, y] = str.split("/");
        return `${y}-${m}-${d}`;
    }

    return null;
}

function createId(prefix = "id") {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return `${prefix}_${crypto.randomUUID()}`;
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function getUtilStatus(pct) {
    const v = Number(pct || 0);
    if (v > 100) return { key: "over", label: "Kapasite Aşıldı" };
    if (v >= 90) return { key: "good", label: "İyi Doluluk" };
    if (v >= 70) return { key: "mid", label: "Orta Doluluk" };
    return { key: "low", label: "Düşük Doluluk" };
}

function getFirstNumber(...values) {
    for (const value of values) {
        const n = Number(value);
        if (!Number.isNaN(n) && value !== null && value !== undefined && value !== "") return n;
    }
    return 0;
}

function findFirstArray(result) {
    const candidates = [
        result?.summary,
        result?.summary_table,
        result?.routes_summary,
        result?.plan_summary,
        result?.trucks,
        result?.vehicles,
        result?.routes,
        result?.assignments,
        result?.plan,
        result?.data,
        result?.rows,
        result?.items,
        result?.solution,
        result?.result,
        result?.result?.summary,
        result?.result?.routes,
        result?.result?.trucks,
        result?.result?.plan,
        result?.output,
        result?.output?.summary,
        result?.output?.routes,
    ];
    return candidates.find((item) => Array.isArray(item)) || [];
}

function parseRouteString(route) {
    return String(route || "")
        .split(/→|->|,/)
        .map((x) => x.trim())
        .filter(Boolean);
}

function normalizeStop(stop, index) {
    if (typeof stop === "string") {
        return {
            id: createId("stop"),
            location: stop,
            pallets: 0,
            demand_id: null,
            sequence: index + 1,
        };
    }

    return {
        id: stop?.id || stop?.demand_id || createId("stop"),
        location:
            stop?.location ||
            stop?.wh_name ||
            stop?.warehouse ||
            stop?.destination ||
            stop?.city ||
            stop?.name ||
            stop?.varis ||
            "",
        pallets: getFirstNumber(
            stop?.pallets,
            stop?.palet,
            stop?.demand_units,
            stop?.total_pallets,
            stop?.quantity,
            stop?.load
        ),
        demand_id: stop?.demand_id || null,
        sequence: Number(stop?.sequence || index + 1),
    };
}

function normalizePlanRows(result) {
    const rows = findFirstArray(result);

    if (rows.length > 0) {
        return rows.map((row, index) => {
            const rawStops =
                row?.route_details ||
                row?.stops ||
                row?.destinations ||
                row?.locations ||
                row?.warehouses ||
                row?.route_stops ||
                [];

            let details = [];
            if (Array.isArray(rawStops) && rawStops.length > 0) {
                details = rawStops.map((stop, i) => normalizeStop(stop, i));
            } else {
                const routeText = row?.route || row?.rota || row?.route_text || row?.path || row?.guzergah || "";
                details = parseRouteString(routeText).map((location, i) => normalizeStop(location, i));
            }

            const totalPalletsFromStops = details.reduce((sum, s) => sum + Number(s.pallets || 0), 0);

            return {
                id: row?.id || row?.truck_id || row?.vehicle_id || createId("truck"),
                truck:
                    row?.truck ||
                    row?.plaka ||
                    row?.vehicle ||
                    row?.vehicle_name ||
                    row?.truck_name ||
                    row?.arac ||
                    `Truck-${index + 1}`,
                total_pallets: getFirstNumber(row?.total_pallets, row?.pallets, row?.palet, row?.load, totalPalletsFromStops),
                utilization_pct: getFirstNumber(
                    row?.utilization_pct,
                    row?.["utilization_%"],
                    row?.utilization,
                    row?.doluluk,
                    row?.doluluk_orani
                ),
                total_cost: getFirstNumber(row?.total_cost, row?.cost, row?.maliyet, row?.route_cost),
                base_cost: getFirstNumber(row?.base_cost, row?.sabit_maliyet),
                add_stop_cost: getFirstNumber(row?.add_stop_cost, row?.durak_maliyeti),
                extra_km_cost: getFirstNumber(row?.extra_km_cost, row?.ek_km_maliyeti),
                route_km: getFirstNumber(row?.route_km, row?.km, row?.distance),
                route_details: details,
            };
        });
    }

    if (result?.plan && typeof result.plan === "object") {
        return Object.entries(result.plan).map(([truckName, stops], index) => ({
            id: createId("truck"),
            truck: truckName || `Truck-${index + 1}`,
            total_pallets: 0,
            utilization_pct: 0,
            total_cost: 0,
            base_cost: 0,
            add_stop_cost: 0,
            extra_km_cost: 0,
            route_km: 0,
            route_details: Array.isArray(stops) ? stops.map((l, i) => normalizeStop(l, i)) : [],
        }));
    }

    return [];
}

function calculateTruck(truck, truckCapacity, fixedCost) {
    const stops = (truck.route_details || []).map((stop, index) => ({
        ...stop,
        sequence: index + 1,
        pallets: Number(stop.pallets || 0),
    }));

    const totalPallets = stops.reduce((sum, stop) => sum + Number(stop.pallets || 0), 0);
    const capacity = Number(truckCapacity || 0);
    const utilizationPct = capacity > 0 ? (totalPallets / capacity) * 100 : Number(truck.utilization_pct || 0);
    const hasStops = stops.length > 0;
    const totalCost = Number(truck.total_cost || 0) || (hasStops ? Number(fixedCost || 0) : 0);

    return {
        ...truck,
        route_details: stops,
        stops: stops.length,
        total_pallets: totalPallets,
        utilization_pct: utilizationPct,
        total_cost: totalCost,
    };
}

function buildRouteText(truck, depotName) {
    const stops = truck.route_details || [];
    if (!stops.length) return "—";
    const depot = depotName || "DEPOT";
    return [depot, ...stops.map((s) => s.location || "Varış"), depot].join(" → ");
}

function UploadBox({ title, description, file, onChange }) {
    const inputRef = useRef(null);

    return (
        <button
            type="button"
            className={`upload-box ${file ? "selected" : ""}`}
            onClick={() => inputRef.current?.click()}
        >
            <div className="upload-icon">{file ? "✓" : "↑"}</div>
            <div className="upload-content">
                <h3>{title}</h3>
                <p>{description}</p>
                <span>{file ? file.name : "Excel dosyası seç"}</span>
            </div>
            <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls"
                hidden
                onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onChange(f);
                    e.target.value = "";
                }}
            />
        </button>
    );
}

export default function Planlama() {
    const permission = usePagePermission("bim_planlama");
    const [dataFile, setDataFile] = useState(null);
    const [demandFile, setDemandFile] = useState(null);
    const [dates, setDates] = useState([]);
    const [selectedDate, setSelectedDate] = useState("");
    const [strategy, setStrategy] = useState("greedy");
    const [maxStops, setMaxStops] = useState(3);
    const [fixedCost, setFixedCost] = useState(0);
    const [truckCapacity, setTruckCapacity] = useState(33);
    const [depotName, setDepotName] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [planResult, setPlanResult] = useState(null);
    const [editablePlan, setEditablePlan] = useState([]);
    const [deferredStops, setDeferredStops] = useState([]);
    const [selectedTruckFilter, setSelectedTruckFilter] = useState("all");
    const [showVehicleSummary, setShowVehicleSummary] = useState(false);
    const [openMovePicker, setOpenMovePicker] = useState(null);

    const readyCount = useMemo(() => [dataFile, demandFile, selectedDate].filter(Boolean).length, [dataFile, demandFile, selectedDate]);
    const canRun = readyCount === 3 && !loading;

    const calculatedPlan = useMemo(
        () => editablePlan.map((truck) => calculateTruck(truck, truckCapacity, fixedCost)),
        [editablePlan, truckCapacity, fixedCost]
    );

    const filteredPlan = useMemo(() => {
        if (selectedTruckFilter === "all") return calculatedPlan;
        if (selectedTruckFilter === "over") return calculatedPlan.filter((t) => Number(t.utilization_pct || 0) > 100);
        if (selectedTruckFilter === "empty") return calculatedPlan.filter((t) => Number(t.stops || 0) === 0);
        return calculatedPlan.filter((t) => t.id === selectedTruckFilter);
    }, [calculatedPlan, selectedTruckFilter]);

    const totals = useMemo(() => {
        const truckCount = calculatedPlan.length;
        const activeTruckCount = calculatedPlan.filter((t) => Number(t.stops || 0) > 0).length;
        const totalStops = calculatedPlan.reduce((s, t) => s + Number(t.stops || 0), 0);
        const totalPallets = calculatedPlan.reduce((s, t) => s + Number(t.total_pallets || 0), 0);
        const totalCost = calculatedPlan.reduce((s, t) => s + Number(t.total_cost || 0), 0);
        const avgUtilization = activeTruckCount
            ? calculatedPlan.filter((t) => Number(t.stops || 0) > 0).reduce((s, t) => s + Number(t.utilization_pct || 0), 0) / activeTruckCount
            : 0;
        const fleetUtilization = truckCount && Number(truckCapacity || 0) > 0
            ? (totalPallets / (truckCount * Number(truckCapacity))) * 100
            : 0;
        const overCapacityCount = calculatedPlan.filter((t) => Number(t.utilization_pct || 0) > 100).length;
        const deferredPallets = deferredStops.reduce((s, st) => s + Number(st.pallets || 0), 0);
        return { truckCount, activeTruckCount, totalStops, totalPallets, totalCost, avgUtilization, fleetUtilization, overCapacityCount, deferredCount: deferredStops.length, deferredPallets };
    }, [calculatedPlan, truckCapacity, deferredStops]);

    const getMoveOptionInfo = (targetTruck, movingStop) => {
        const currentPallets = Number(targetTruck.total_pallets || 0);
        const movingPallets = Number(movingStop?.pallets || 0);
        const afterPallets = currentPallets + movingPallets;
        const capacity = Number(truckCapacity || 0);
        const afterUtil = capacity > 0 ? (afterPallets / capacity) * 100 : 0;
        const currentStops = Number(targetTruck.stops || 0);
        const afterStops = currentStops + 1;

        return {
            afterPallets,
            afterUtil,
            afterStops,
            isOver: afterUtil > 100,
            label: `${targetTruck.truck} | ${currentStops}→${afterStops} durak | ${currentPallets}+${movingPallets}=${afterPallets} palet | %${formatNumber(afterUtil, 1)}${afterUtil > 100 ? " ⚠ Kapasite aşar" : ""}`,
        };
    };

    const getMoveRiskInfo = (targetTruck, movingStop) => {
        const info = getMoveOptionInfo(targetTruck, movingStop);
        const remaining = Number(truckCapacity || 0) - Number(info.afterPallets || 0);

        if (info.afterUtil > 100) {
            return {
                ...info,
                key: "danger",
                title: "Kapasite aşar",
                text: `%${formatNumber(info.afterUtil, 1)} doluluk olur`,
                hint: `${Math.abs(remaining)} palet fazla kalır`,
            };
        }

        if (info.afterUtil >= 90) {
            return {
                ...info,
                key: "warning",
                title: "Sınıra yakın",
                text: `%${formatNumber(info.afterUtil, 1)} doluluk olur`,
                hint: `${remaining} palet boşluk kalır`,
            };
        }

        return {
            ...info,
            key: "safe",
            title: "Uygun",
            text: `%${formatNumber(info.afterUtil, 1)} doluluk olur`,
            hint: `${Math.max(remaining, 0)} palet boşluk kalır`,
        };
    };

    const resetResult = () => { setPlanResult(null); setEditablePlan([]); setDeferredStops([]); };

    const handleDemandFile = async (file) => {
        setDemandFile(file); setMessage(""); setError(""); resetResult();
        try {
            const buffer = await file.arrayBuffer();
            const wb = XLSX.read(buffer, { type: "array", cellDates: true });
            const sheet = wb.Sheets["Demands"];
            if (!sheet) { setDates([]); setSelectedDate(""); setError("'Demands' sayfası bulunamadı."); return; }
            const rows = XLSX.utils.sheet_to_json(sheet, { defval: null });
            const uniqueDates = Array.from(new Set(rows.map((r) => normalizeDate(r.date)).filter(Boolean))).sort();
            setDates(uniqueDates); setSelectedDate(uniqueDates[0] || "");
            setMessage(uniqueDates.length ? `${uniqueDates.length} tarih bulundu.` : "Talep dosyası okundu ama tarih bulunamadı.");
        } catch { setError("Talep dosyası okunamadı."); }
    };

    const handleRun = async () => {
        setMessage(""); setError(""); resetResult();
        if (!canRun) { setError("Lütfen veri dosyası, talep dosyası ve tarih seçimini tamamlayın."); return; }
        try {
            setLoading(true);
            const fd = new FormData();
            fd.append("data_file", dataFile); fd.append("demand_file", demandFile);
            fd.append("selected_date", selectedDate); fd.append("strategy", strategy);
            fd.append("max_stops", String(maxStops)); fd.append("fixed_cost", String(fixedCost));
            const res = await fetch(`${API_BASE_URL}/plan`, { method: "POST", body: fd });
            if (!res.ok) { const e = await res.json().catch(() => null); throw new Error(e?.error || "Backend hatası."); }
            const result = await res.json();
            console.log("PLAN RESULT:", result);
            if (result?.error) throw new Error(result.error);
            const rows = normalizePlanRows(result);
            setPlanResult(result); setEditablePlan(rows);
            setTruckCapacity(Number(result?.truck_capacity || result?.capacity || truckCapacity || 33));
            setDepotName(result?.depot_name || result?.depot || result?.warehouse || "");
            setMessage("Planlama başarıyla oluşturuldu. Artık araç/durak düzenlemesi yapabilirsiniz.");
        } catch (err) { setError(err.message || "Hata oluştu."); }
        finally { setLoading(false); }
    };

    const renumberStops = (stops) => (stops || []).map((s, i) => ({ ...s, sequence: i + 1 }));
    const updateTruckName = (id, v) => setEditablePlan((p) => p.map((t) => t.id === id ? { ...t, truck: v } : t));
    const updateTruckCost = (id, v) => setEditablePlan((p) => p.map((t) => t.id === id ? { ...t, total_cost: Number(v || 0) } : t));
    const updateStop = (tid, sid, key, v) => setEditablePlan((p) => p.map((t) => t.id !== tid ? t : { ...t, route_details: t.route_details.map((s) => s.id !== sid ? s : { ...s, [key]: key === "pallets" ? Number(v || 0) : v }) }));
    const addStop = (tid) => setEditablePlan((p) => p.map((t) => t.id !== tid ? t : { ...t, route_details: renumberStops([...t.route_details, { id: createId("stop"), location: "", pallets: 0, sequence: t.route_details.length + 1 }]) }));
    const deleteStop = (tid, sid) => setEditablePlan((p) => p.map((t) => t.id !== tid ? t : { ...t, route_details: renumberStops(t.route_details.filter((s) => s.id !== sid)) }));
    const deleteTruck = (id) => {
        const truck = editablePlan.find((t) => t.id === id);
        if (truck?.route_details?.length) {
            const moved = truck.route_details.map((s) => ({ ...s, id: createId("deferred"), source_truck: truck.truck, deferred_at: new Date().toISOString(), reason: "Araç silindi" }));
            setDeferredStops((p) => [...p, ...moved]);
        }
        setEditablePlan((p) => p.filter((t) => t.id !== id));
    };
    const addTruck = () => setEditablePlan((p) => [...p, { id: createId("truck"), truck: `Truck-${p.length + 1}`, total_cost: Number(fixedCost || 0), base_cost: 0, add_stop_cost: 0, extra_km_cost: 0, route_km: 0, route_details: [] }]);

    const moveStopToTruck = (fromTruckId, stopId, toTruckId) => {
        if (!toTruckId || fromTruckId === toTruckId) return;
        let movedStop = null;
        setEditablePlan((plan) => {
            const without = plan.map((t) => {
                if (t.id !== fromTruckId) return t;
                movedStop = t.route_details.find((s) => s.id === stopId) || null;
                return { ...t, route_details: renumberStops(t.route_details.filter((s) => s.id !== stopId)) };
            });
            if (!movedStop) return plan;
            return without.map((t) => t.id !== toTruckId ? t : { ...t, route_details: renumberStops([...t.route_details, { ...movedStop, id: createId("stop") }]) });
        });
    };

    const deferStop = (truckId, stopId) => {
        const truck = editablePlan.find((t) => t.id === truckId);
        const stop = truck?.route_details?.find((s) => s.id === stopId);
        if (!truck || !stop) return;
        setDeferredStops((p) => [...p, { ...stop, id: createId("deferred"), source_truck: truck.truck, source_truck_id: truck.id, deferred_at: new Date().toISOString(), reason: "Başka sefere taşındı" }]);
        deleteStop(truckId, stopId);
    };

    const restoreDeferredStop = (deferredId, truckId) => {
        const item = deferredStops.find((s) => s.id === deferredId);
        if (!item || !truckId) return;
        setEditablePlan((p) => p.map((t) => t.id !== truckId ? t : { ...t, route_details: renumberStops([...t.route_details, { ...item, id: createId("stop") }]) }));
        setDeferredStops((p) => p.filter((s) => s.id !== deferredId));
    };
    const deleteDeferredStop = (deferredId) => setDeferredStops((p) => p.filter((s) => s.id !== deferredId));

    const exportPlanJson = () => {
        const payload = { selected_date: selectedDate, depot_name: depotName, truck_capacity: truckCapacity, summary: totals, trucks: calculatedPlan.map((truck) => ({ plaka: truck.truck, stops: truck.stops, total_pallets: truck.total_pallets, utilization_pct: Number(truck.utilization_pct || 0).toFixed(2), total_cost: truck.total_cost, route: buildRouteText(truck, depotName), route_details: truck.route_details })), deferred_stops: deferredStops };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob); const a = document.createElement("a");
        a.href = url; a.download = `planlama_${selectedDate || "sonuc"}.json`; a.click(); URL.revokeObjectURL(url);
    };

    const createActiveTripsFromPlan = async () => {
        const batchId = crypto?.randomUUID?.() || `bim_${Date.now()}`;

        const rows = calculatedPlan
            .filter((truck) => (truck.route_details || []).length > 0)
            .map((truck) => {
                const stops = truck.route_details || [];

                return {
                    kaynak: "BİM",
                    sefer_no: null,
                    sevk_tarihi: selectedDate,
                    yukleyen_depo: "BİM AFYON",
                    kalkis_yeri: "AFYONKARAHİSAR",
                    arac_cinsi: "TIR",
                    cekici: null,
                    dorse: null,
                    tc: null,
                    surucu: null,
                    telefon: null,
                    fatura_vkn: null,

                    varis1: stops[0]?.location || null,
                    varis2: stops[1]?.location || null,
                    varis3: stops[2]?.location || null,
                    varis4: stops[3]?.location || null,

                    palet: stops.reduce(
                        (sum, stop) => sum + Number(stop.pallets || 0),
                        0
                    ),

                    irsaliye_no: null,
                    dataloger_no: null,
                    navlun: Number(truck.total_cost || 0),
                    guncelleyen_kisi: null,
                    guncelledigi_alan: "Planlama",
                    guncelleme_saati: null,
                    arac_durumu: "Plaka Bekliyor",
                    peron_no: null,
                    peron_giren_kullanici: null,
                    peron_girilme_tarih: null,
                    yuklemeden_cikis_saati: null,

                    aciklama: `Planlama ekranından oluşturuldu. Araç: ${truck.truck}`,
                    planlama_arac: truck.truck,
                    planlama_truck_id: truck.id,
                    planlama_stop_id: null,
                    batch_id: batchId,
                };
            });

        console.log("AKTIF SEFERE GIDECEK ROWS:", rows);

        if (!rows.length) {
            alert("Aktif sefere aktarılacak araç bulunamadı.");
            return;
        }

        const { error } = await supabase
            .from("aktif_seferler")
            .insert(rows);

        if (error) {
            console.error(error);
            alert(`Aktif sefer oluşturulamadı: ${error.message}`);
            return;
        }

        alert(`${rows.length} araç aktif seferlere aktarıldı.`);
    };
    return (
        <div className="planlama-page">
            {loading && <div className="top-progress" />}
            <section className="plan-header">
                <div><span className="page-badge">BİM AFYON</span><h1>Truck Routing Planlama</h1><p>Excel dosyalarını yükleyin, tarihi seçin ve rota planını oluşturun.</p></div>
                <div className="header-progress"><span>Hazırlık</span><strong>{readyCount}/3</strong><div className="progress-line"><i style={{ width: `${(readyCount / 3) * 100}%` }} /></div></div>
            </section>

            <section className="summary-row">
                {[{ label: "Veri Dosyası", value: dataFile ? "✓ Yüklendi" : "Bekleniyor" }, { label: "Talep Dosyası", value: demandFile ? "✓ Yüklendi" : "Bekleniyor" }, { label: "Seçili Tarih", value: selectedDate ? formatDate(selectedDate) : "—" }, { label: "Yöntem", value: strategy === "greedy" ? "Greedy" : "OR-Tools" }].map(({ label, value }) => <div className="summary-card" key={label}><span>{label}</span><strong>{value}</strong></div>)}
            </section>

            {(message || error) && <div className={`message-box ${error ? "error" : "success"}`}><div className="msg-icon">{error ? "!" : "✓"}</div>{error || message}</div>}

            <section className="plan-layout">
                <div className="main-card"><div className="card-head"><span className="step-num">01</span><div><h2>Dosyaları Yükle</h2><p>Ana veri ve talep Excel dosyalarını seçin.</p></div></div><div className="upload-grid">{permission.canButton("data_file_upload") && <UploadBox title="Veri Dosyası" description="Depolar, araçlar, mesafeler, tarifeler." file={dataFile} onChange={(f) => { setDataFile(f); setError(""); setMessage("Veri dosyası yüklendi."); }} />}{permission.canButton("demand_file_upload") && <UploadBox title="Talep Dosyası" description="'Demands' sayfası içeren talep dosyası." file={demandFile} onChange={handleDemandFile} />}</div></div>
                <div className="side-card"><div className="card-head compact"><span className="step-num">02</span><div><h2>Tarih Seç</h2><p>Talep dosyasından tarihi seçin.</p></div></div>{dates.length === 0 ? <div className="empty-state"><strong>Tarih bulunamadı</strong><p>Önce talep dosyasını yükleyin.</p></div> : <div className="date-list">{dates.map((d) => <button type="button" key={d} className={selectedDate === d ? "selected" : ""} onClick={() => setSelectedDate(d)}>{formatDate(d)}</button>)}</div>}</div>
                <div className="side-card"><div className="card-head compact"><span className="step-num">03</span><div><h2>Parametreler</h2><p>Planlama kurallarını belirleyin.</p></div></div><div className="params-grid"><label className="field full"><span>Yöntem</span><select value={strategy} onChange={(e) => setStrategy(e.target.value)}><option value="greedy">Greedy – Hızlı</option><option value="ortools">OR-Tools – Optimal</option></select></label><label className="field"><span>Max Durak / Araç</span><input type="number" value={maxStops} min="1" onChange={(e) => setMaxStops(Number(e.target.value || 1))} /></label><label className="field"><span>Sabit Araç Maliyeti</span><input type="number" value={fixedCost} min="0" onChange={(e) => setFixedCost(Number(e.target.value || 0))} /></label><label className="field"><span>Araç Kapasitesi / Palet</span><input type="number" value={truckCapacity} min="1" onChange={(e) => setTruckCapacity(Number(e.target.value || 1))} /></label></div></div>
            </section>

            <section className="run-card"><div><h3>Planlamayı Başlat</h3><p>Tüm seçimler tamamlandığında çalıştırabilirsiniz.</p></div>{permission.canButton("planla") && (
                <button type="button" disabled={!canRun} onClick={handleRun}>
                    {loading ? "Hesaplanıyor…" : "Planlamayı Çalıştır →"}
                </button>
            )}
            </section>

            {planResult && <section className="ops-dashboard"><div className="panel-header"><div><span className="panel-kicker">Özet Alanı</span><h2>Canlı Plan Özeti</h2><p>Araç, durak, palet, doluluk, maliyet ve başka sefere taşınan noktalar burada anlık izlenir.</p></div>{permission.canButton("json_export") && <button type="button" className="ghost-btn" onClick={exportPlanJson}>JSON İndir</button>}</div><div className="summary-metrics-grid ops">{[{ label: "Araç", value: totals.truckCount, hint: `${totals.activeTruckCount} aktif araç` }, { label: "Durak", value: totals.totalStops, hint: "Plandaki noktalar" }, { label: "Palet", value: totals.totalPallets, hint: `${truckCapacity} palet kapasite` }, { label: "Filo Doluluk", value: `%${formatNumber(totals.fleetUtilization, 1)}`, hint: "Toplam kapasiteye göre" }, { label: "Kapasite Aşımı", value: totals.overCapacityCount, hint: "Kontrol gereken araç" }, { label: "Başka Sefere", value: totals.deferredCount, hint: `${totals.deferredPallets} palet beklemede` }, { label: "Toplam Maliyet", value: `${formatNumber(totals.totalCost, 2)} ₺`, hint: "Araç maliyetleri" }].map((item) => <div className={`summary-metric ${item.label === "Kapasite Aşımı" && totals.overCapacityCount ? "danger" : ""}`} key={item.label}><span>{item.label}</span><strong>{item.value}</strong><small>{item.hint}</small></div>)}</div>{totals.overCapacityCount > 0 && <div className="capacity-warning">{totals.overCapacityCount} araç kapasiteyi aşıyor. Noktaları başka araca taşıyın, başka sefere alın veya yeni araç ekleyin.</div>}</section>}

            {calculatedPlan.length > 0 && <section className="plan-summary-panel"><div className="panel-header"><div><span className="panel-kicker">Araç Bazlı Özet</span><h2>Özet Tablosu</h2><p>Araç listesini ihtiyaç olduğunda açıp kapatabilirsiniz.</p></div><div className="summary-actions">{permission.canButton("ozet_goster") && <button type="button" className="ghost-btn" onClick={() => setShowVehicleSummary((v) => !v)}>{showVehicleSummary ? "Özeti Gizle" : "Özeti Göster"}</button>}{showVehicleSummary && <select className="filter-select" value={selectedTruckFilter} onChange={(e) => setSelectedTruckFilter(e.target.value)}><option value="all">Tüm araçlar</option><option value="over">Kapasite aşanlar</option><option value="empty">Boş araçlar</option>{calculatedPlan.map((t) => <option key={t.id} value={t.id}>{t.truck}</option>)}</select>}</div></div>{showVehicleSummary && <div className="summary-table-wrap"><table className="summary-table"><thead><tr><th>Araç</th><th>Durak</th><th>Palet</th><th>Doluluk</th><th>Durum</th><th>Maliyet</th><th>Rota</th></tr></thead><tbody>{filteredPlan.map((truck) => { const status = getUtilStatus(truck.utilization_pct); return <tr key={truck.id}><td><strong>{truck.truck}</strong></td><td>{truck.stops}</td><td>{truck.total_pallets}</td><td><div className="summary-util-cell"><span className={`util-badge ${status.key}`}>%{formatNumber(truck.utilization_pct, 1)}</span><div className="mini-util-bar"><i className={status.key} style={{ width: `${Math.min(Number(truck.utilization_pct || 0), 100)}%` }} /></div></div></td><td><span className={`status-chip ${status.key}`}>{status.label}</span></td><td>{formatNumber(truck.total_cost, 2)} ₺</td><td className="route-cell">{buildRouteText(truck, depotName)}</td></tr>; })}</tbody></table></div>}</section>}

            {calculatedPlan.length > 0 && <section className="operation-layout"><div className="editor-card clean"><div className="editor-header"><div><span className="panel-kicker">Düzenleme Alanı</span><h2>Plan Düzenleme</h2><p>Araç ekleyin, noktaları araçlar arasında taşıyın, başka sefere alın, silin veya güncelleyin.</p></div><div className="editor-actions">{permission.canButton("aktif_sefere_aktar") && <button type="button" className="success-btn" onClick={createActiveTripsFromPlan}>Aktif Sefere Aktar</button>}{permission.canButton("arac_ekle") && <button type="button" className="add-truck-btn" onClick={addTruck}>+ Araç Ekle</button>}</div></div><div className="truck-list">{calculatedPlan.map((truck, idx) => { const status = getUtilStatus(truck.utilization_pct); return <article className={`truck-card ${status.key}`} key={truck.id}><div className="truck-top"><div className="truck-title"><span className="truck-num">{String(idx + 1).padStart(2, "0")}</span><input value={truck.truck || ""} onChange={(e) => updateTruckName(truck.id, e.target.value)} /></div><div className="truck-actions"><span className="truck-pill">{truck.stops} Durak</span><span className="truck-pill green">{truck.total_pallets} Palet</span><span className={`truck-pill util ${status.key}`}>%{formatNumber(truck.utilization_pct, 1)}</span>{permission.canButton("durak_ekle") && <button type="button" className="small-btn" onClick={() => addStop(truck.id)}>+ Durak</button>}{permission.canButton("arac_sil") && <button type="button" className="danger-btn" onClick={() => deleteTruck(truck.id)}>Aracı Sil</button>}</div></div><div className="truck-metrics"><div><span>Doluluk</span><strong>%{formatNumber(truck.utilization_pct, 1)}</strong><div className="util-bar"><i className={status.key} style={{ width: `${Math.min(Number(truck.utilization_pct || 0), 100)}%` }} /></div><small>{status.label}</small></div><label><span>Araç Maliyeti</span><input type="number" min="0" value={truck.total_cost || 0} onChange={(e) => updateTruckCost(truck.id, e.target.value)} /></label><div><span>Rota</span><strong className="route-preview">{buildRouteText(truck, depotName)}</strong></div></div>{truck.route_details.length === 0 ? <div className="empty-stop">Bu araçta durak yok. Durak ekleyebilirsiniz.</div> : <div className="stop-list enhanced">{truck.route_details.map((stop, si) => <div className="stop-row enhanced" key={stop.id}><div className="stop-no">{si + 1}</div><label className="stop-location"><span>Varış Noktası</span><input value={stop.location || ""} onChange={(e) => updateStop(truck.id, stop.id, "location", e.target.value)} /></label><label className="stop-pallet"><span>Palet</span><input type="number" min="0" value={stop.pallets ?? 0} onChange={(e) => updateStop(truck.id, stop.id, "pallets", e.target.value)} /></label><div className="stop-move modern"><span>Başka Araca Taşı</span>{permission.canButton("baska_araca_tasi") && <button type="button" className="move-picker-btn" onClick={() => setOpenMovePicker(openMovePicker === stop.id ? null : stop.id)}><span>Araç seç</span><small>{stop.pallets || 0} palet taşınacak</small></button>}{openMovePicker === stop.id && <div className="move-picker-panel">{calculatedPlan.filter((t) => t.id !== truck.id).map((targetTruck) => { const risk = getMoveRiskInfo(targetTruck, stop); return <button type="button" key={targetTruck.id} className={`move-truck-option ${risk.key}`} onClick={() => { moveStopToTruck(truck.id, stop.id, targetTruck.id); setOpenMovePicker(null); }}><div className="move-truck-main"><strong>{targetTruck.truck}</strong><span>{risk.title}</span></div><div className="move-truck-progress"><i style={{ width: `${Math.min(Number(risk.afterUtil || 0), 100)}%` }} /></div><div className="move-truck-stats"><small>{targetTruck.stops} → {risk.afterStops} durak</small><small>{targetTruck.total_pallets} + {stop.pallets || 0} = {risk.afterPallets} palet</small><small>{risk.text}</small><small>{risk.hint}</small><div className="move-route-preview">{(targetTruck.route_details || []).length === 0 ? <span className="empty-route">Araç boş</span> : targetTruck.route_details.map((routeStop, routeIdx) => <span key={routeStop.id || routeIdx} className="route-chip">{routeStop.location || "Nokta"}</span>)}</div></div></button>; })}</div>}</div><div className="stop-actions">{permission.canButton("baska_sefere_al") && <button type="button" className="defer-stop" onClick={() => deferStop(truck.id, stop.id)}>Başka Sefere</button>}{permission.canButton("durak_sil") && <button type="button" className="delete-stop" onClick={() => deleteStop(truck.id, stop.id)}>Sil</button>}</div></div>)}</div>}</article>; })}</div></div><aside className="deferred-panel"><div className="deferred-head"><span className="panel-kicker">Bekleyen Noktalar</span><h2>Başka Sefere Taşınanlar</h2><p>Plandan çıkarılan noktalar burada bekler. İstersen tekrar araca geri alabilirsin.</p></div>{deferredStops.length === 0 ? <div className="empty-state"><strong>Bekleyen nokta yok</strong><p>Bir noktayı “Başka Sefere” alırsanız burada görünür.</p></div> : <div className="deferred-list">{deferredStops.map((stop) => <div className="deferred-item" key={stop.id}><div><strong>{stop.location || "Varış belirtilmedi"}</strong><span>{stop.pallets || 0} palet · Kaynak: {stop.source_truck || "—"}</span></div>{permission.canButton("araca_geri_al") && <select defaultValue="" onChange={(e) => restoreDeferredStop(stop.id, e.target.value)}><option value="">Araca geri al</option>{calculatedPlan.map((t) => { const info = getMoveOptionInfo(t, stop); return <option key={t.id} value={t.id}>{info.label}</option>; })}</select>}<button type="button" onClick={() => deleteDeferredStop(stop.id)}>Sil</button></div>)}</div>}</aside></section>}
        </div>
    );
}
