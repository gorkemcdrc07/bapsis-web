import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import IrsaliyeOkutModal from "./aktifseferler/IrsaliyeOkutModal";
import AracSecme from "./aktifseferler/aracsecme";
import SeferTamamlamaModal from "./aktifseferler/SeferTamamlamaModal";
import ExcelSilmeKontrolModal from "./aktifseferler/ExcelSilmeKontrolModal";
import EksikAracModal from "./aktifseferler/EksikAracModal";
import ExcelRevizyonModal from "./aktifseferler/ExcelRevizyonModal";
import SatirIslemMenusu from "./aktifseferler/SatirIslemMenusu";
import SutunPaneli from "./aktifseferler/SutunPaneli";
import AktifSeferTablosu from "./aktifseferler/AktifSeferTablosu";
import AktifSeferToolbar from "./aktifseferler/AktifSeferToolbar";
import NavlunEslesmeModal from "./aktifseferler/NavlunEslesmeModal";
import { renderAktifSeferHucre } from "./aktifseferler/hucreRender";
import { navlunFiyatiBul } from "./aktifseferler/navlunIslemleri";
import { isTripReadyToComplete } from "./aktifseferler/tamamlamaKontrol";
import { aktifSeferRealtimeBaslat } from "./aktifseferler/realtimeIslemleri";
import { aktifSeferExcelDosyasiIsle } from "./aktifseferler/excelImportIslemleri";
import { aktifSefereAracSec } from "./aktifseferler/aracSecimIslemleri";
import { aktifSeferTamamla } from "./aktifseferler/seferTamamlamaIslemleri";
import { eksikAracKaydet } from "./aktifseferler/eksikAracIslemleri";
import { hucreBlurKaydet } from "./aktifseferler/hucreGuncellemeIslemleri";
import { triggerFleetAlert } from "./aktifseferler/notificationEngine";
import FleetMap from "../../components/Map/FleetMap";

import {
    aktifSeferSil,
    eksikAktifSeferleriSil,
} from "./aktifseferler/seferSilmeIslemleri";
import {
    satirMenuKapat,
    satirMenuPozisyonuHesapla,
} from "./aktifseferler/menuIslemleri";
import { sutunGorunurlukDegistir } from "./aktifseferler/sutunIslemleri";
import { excelDosyasiSecildi } from "./aktifseferler/excelDosyaIslemleri";
import { kayipAracEkle } from "./aktifseferler/aracIslemleri";
import { exportAktifSeferExcel } from "./aktifseferler/excelIslemleri";

import "./aktifseferler.css";

import {
    columnsData,
    EXCEL_UPDATE_FIELDS,
    options,
} from "./aktifseferler/constants";
import {
    getColumnLabel,
    mapUiToDb,
    normalizeCompare,
} from "./aktifseferler/helpers";
import {
    saveCompletedTripArchive,
    saveDeletedTripArchive,
} from "./aktifseferler/seferIslemleri";

import {
    sayfaDragEnter,
    sayfaDragLeave,
    sayfaDragOver,
    sayfaDrop,
} from "./aktifseferler/dragDropIslemleri";
import {
    kolonBirak,
    kolonBoyutlandir,
    kolonSuruklemeBaslat,
    kolonSuruklemeBitir,
    kolonUzerineSurukle,
} from "./aktifseferler/kolonIslemleri";
import {
    aktifSeferleriGetir,
    araclariGetir,
    degisiklikKaydiEkle,
    degisiklikleriGetir,
    navlunlariGetir,
    ugramaSartlariGetir,
    freshlianceCihazlariGetir,
} from "./aktifseferler/veriServisi";
import {
    aktifSeferleriFiltrele,
    sutunlariFiltrele,
} from "./aktifseferler/filtreIslemleri";



async function saveChangeLogs(seferId, changes, islemTipi = "Güncelleme") {
    await degisiklikKaydiEkle(seferId, changes, islemTipi);
}
export default function AktifSeferler() {
    const [rows, setRows] = useState([]);
    const [araclar, setAraclar] = useState([]);
    const [navlunlar, setNavlunlar] = useState([]);
    const [ugramaSartlari, setUgramaSartlari] = useState([]);
    const [navlunMatchRow, setNavlunMatchRow] = useState(null);
    const [freshlianceDevices, setFreshlianceDevices] = useState([]);
    const [columns, setColumns] = useState(columnsData);

    const [loading, setLoading] = useState(false);
    const [excelImporting, setExcelImporting] = useState(false);
    const [isDragActive, setIsDragActive] = useState(false);
    const [draggingColumnKey, setDraggingColumnKey] = useState(null);
    const [dropTargetColumnKey, setDropTargetColumnKey] = useState(null);

    const [search, setSearch] = useState("");
    const [showColumnPanel, setShowColumnPanel] = useState(false);
    const [columnSearch, setColumnSearch] = useState("");

    const [aracPanelRow, setAracPanelRow] = useState(null);
    const [showIrsaliyePanel, setShowIrsaliyePanel] = useState(false);
    const [completePromptRow, setCompletePromptRow] = useState(null);
    const [completeDetailRow, setCompleteDetailRow] = useState(null);
    const [completionPromptedIds, setCompletionPromptedIds] = useState([]);

    const [openActionRowId, setOpenActionRowId] = useState(null);
    const [actionMenuPosition, setActionMenuPosition] = useState(null);

    const [hiddenColumns, setHiddenColumns] = useState([]);
    const [importSummary, setImportSummary] = useState(null);
    const [revisionChanges, setRevisionChanges] = useState([]);
    const [changedCells, setChangedCells] = useState({});
    const [missingVehicles, setMissingVehicles] = useState([]);
    const [cellLogs, setCellLogs] = useState({});
    const [deletedTripPrompt, setDeletedTripPrompt] = useState(null);

    const [selectedDevice, setSelectedDevice] = useState(null);
    const [mapOpen, setMapOpen] = useState(false);

    const fileInputRef = useRef(null);
    const rowsRef = useRef([]);
    const navlunlarRef = useRef([]);
    const ugramaSartlariRef = useRef([]);
    const fileDragDepthRef = useRef(0);
    const editingStartValuesRef = useRef({});

    const visibleColumns = columns.filter((c) => !hiddenColumns.includes(c.key));
    const hideableColumns = columns.filter((c) => c.key !== "actions");

    const filteredRows = useMemo(() => {
        const deviceMap = new Map(
            freshlianceDevices.map((device) => [
                String(device.device_code || device.deviceCode || "").trim(),
                device,
            ])
        );
        const TEMP_MIN = 2;
        const TEMP_MAX = 25;
        const OFFLINE_LIMIT_MIN = 10;

        const rowsWithFreshliance = rows.map((row) => {
            const device = deviceMap.get(String(row.datalogerNo || "").trim());

            const probe = device?.probe_raw;

            const temp = parseFloat(probe?.temperature);

            const isTempAlarm =
                !isNaN(temp) &&
                (temp > TEMP_MAX || temp < TEMP_MIN);

            const lastUpdate = device?.updated_at
                ? new Date(device.updated_at).getTime()
                : null;

            const isOffline =
                !lastUpdate ||
                Date.now() - lastUpdate > OFFLINE_LIMIT_MIN * 60 * 1000;

            console.log("--------------");
            console.log("DATALOGER:", row.datalogerNo);
            console.log(
                "DEVICE CODE:",
                device?.device_code || device?.deviceCode
            );
            console.log("UPDATED_AT:", device?.updated_at);
            console.log(
                "MINUTE DIFF:",
                device?.updated_at
                    ? (Date.now() - new Date(device.updated_at).getTime()) / 60000
                    : "NO DATE"
            );
            console.log("IS OFFLINE:", isOffline);

            const alarmLevel =
                isOffline ? "OFFLINE"
                    : isTempAlarm ? "ALARM"
                        : "OK";

            if (!device) {
                return {
                    ...row,
                    freshlianceBattery: "",
                    freshlianceLocation: "",
                    freshlianceUpdatedAt: "",
                    freshlianceTemperature: "",
                    freshlianceAlarm: false,
                    freshlianceOffline: true,
                    freshlianceAlarmLevel: "OFFLINE",
                };
            }

            return {
                ...row,

                freshlianceBattery:
                    device.battery !== null && device.battery !== undefined
                        ? `%${device.battery}`
                        : "",

                freshlianceLocation:
                    device.locationText ||
                    (device.latitude && device.longitude
                        ? `${device.latitude}, ${device.longitude}`
                        : ""),

                freshlianceUpdatedAt: device.updated_at
                    ? new Date(device.updated_at).toLocaleString("tr-TR")
                    : "",

                freshlianceTemperature:
                    probe?.temperature !== null && probe?.temperature !== undefined
                        ? `${probe.temperature}°C`
                        : "",

                freshlianceAlarm: isTempAlarm,
                freshlianceOffline: isOffline,
                freshlianceAlarmLevel: alarmLevel,
            };
        });

        return aktifSeferleriFiltrele(rowsWithFreshliance, search);
    }, [rows, search, freshlianceDevices]);

    const filteredColumnList = useMemo(() => {
        return sutunlariFiltrele(hideableColumns, columnSearch);
    }, [columnSearch, hideableColumns]);

    const selectedActionRow = useMemo(() => {
        return rows.find((row) => row.id === openActionRowId) || null;
    }, [rows, openActionRowId]);


    useEffect(() => {
        fetchAktifSeferler();
        fetchAraclar();
        fetchNavlunlar();
        fetchUgramaSartlari();
        fetchChangeLogs();

        const freshlianceInterval = setInterval(() => {
            fetchFreshlianceDevices();
        }, 10000);

        const cleanupRealtime = aktifSeferRealtimeBaslat(() => {
            fetchAktifSeferler();
            fetchChangeLogs();
        });
        return () => {
            clearInterval(freshlianceInterval);
            cleanupRealtime?.();
        };
    }, []);

    useEffect(() => {
        rowsRef.current = rows;
    }, [rows]);

    useEffect(() => {
        navlunlarRef.current = navlunlar;
    }, [navlunlar]);

    useEffect(() => {
        ugramaSartlariRef.current = ugramaSartlari;
    }, [ugramaSartlari]);

    useEffect(() => {
        if (!filteredRows?.length) return;

        filteredRows.forEach((row) => {
            triggerFleetAlert(row);
        });
    }, [filteredRows]);
    async function fetchAktifSeferler() {
        setLoading(true);

        const data = await aktifSeferleriGetir();

        setLoading(false);

        if (!data) return;

        setRows(data);

        rowsRef.current = data;

        await fetchFreshlianceDevices();
    }
    async function fetchChangeLogs() {
        const logsByCell = await degisiklikleriGetir();
        if (!logsByCell) return;
        setCellLogs(logsByCell);
    }

    async function fetchAraclar() {
        const data = await araclariGetir();
        if (!data) return;
        setAraclar(data);
    }

    async function fetchNavlunlar() {
        const data = await navlunlariGetir();
        setNavlunlar(data);
    }
    async function fetchUgramaSartlari() {
        const data = await ugramaSartlariGetir();
        setUgramaSartlari(data || []);
        ugramaSartlariRef.current = data || [];
    }
    async function fetchFreshlianceDevices() {
        const activeCodes = [
            ...new Set(
                rowsRef.current
                    .map((row) => String(row.datalogerNo || "").trim())
                    .filter(Boolean)
            ),
        ];

        const data = await freshlianceCihazlariGetir(activeCodes);
        setFreshlianceDevices((prevDevices) => {
            const prevMap = new Map(
                prevDevices.map((device) => [
                    String(device.device_code || device.deviceCode || "").trim(),
                    device,
                ])
            );

            return (data || []).map((device) => {
                const code = String(
                    device.device_code || device.deviceCode || ""
                ).trim();

                const oldDevice = prevMap.get(code);

                return {
                    ...oldDevice,
                    ...device,

                    temperature:
                        device.temperature !== null &&
                            device.temperature !== undefined
                            ? device.temperature
                            : oldDevice?.temperature ?? null,

                    humidity:
                        device.humidity !== null &&
                            device.humidity !== undefined
                            ? device.humidity
                            : oldDevice?.humidity ?? null,

                    probe_raw:
                        device.probe_raw?.temperature !== null &&
                            device.probe_raw?.temperature !== undefined
                            ? device.probe_raw
                            : oldDevice?.probe_raw ?? device.probe_raw,
                };
            });
        });
    }
    function findNavlunPrice(row) {
        return navlunFiyatiBul(
            row,
            navlunlarRef.current,
            ugramaSartlariRef.current
        );
    }

    function askCompletionIfReady(row) {
        if (!row?.id) return;
        if (!isTripReadyToComplete(row)) return;
        if (completionPromptedIds.includes(row.id)) return;

        setCompletionPromptedIds((prev) => [...prev, row.id]);
        setCompletePromptRow(row);
    }

    async function updateRowFieldById(rowId, key, value, shouldAskCompletion = true) {
        const currentRow = rowsRef.current.find((row) => row.id === rowId);
        if (!currentRow) return;

        let updatedRow = { ...currentRow, [key]: value };

        if (["varis1", "varis2", "varis3"].includes(key)) {
            const price = findNavlunPrice(updatedRow);
            if (price !== null) updatedRow.navlun = price;
        }

        const changedFields = EXCEL_UPDATE_FIELDS.filter((field) => {
            return normalizeCompare(currentRow[field]) !== normalizeCompare(updatedRow[field]);
        });

        setRows((prev) => prev.map((row) => (row.id === rowId ? updatedRow : row)));
        rowsRef.current = rowsRef.current.map((row) => (row.id === rowId ? updatedRow : row));

        const { error } = await supabase
            .from("aktif_seferler")
            .update(mapUiToDb(updatedRow))
            .eq("id", rowId);

        if (error) {
            alert(`Güncelleme yapılamadı: ${error.message}`);
            fetchAktifSeferler();
            return;
        }

        await saveChangeLogs(
            rowId,
            changedFields.map((field) => ({
                field,
                label: getColumnLabel(field),
                oldValue: currentRow[field] ?? "",
                newValue: updatedRow[field] ?? "",
            })),
            "Manuel Güncelleme"
        );

        await fetchChangeLogs();

        if (shouldAskCompletion) askCompletionIfReady(updatedRow);
    }
    function updateCell(rowIndex, key, value) {
        const currentRow = filteredRows[rowIndex];
        if (!currentRow?.id) return;

        setRows((prev) =>
            prev.map((row) =>
                row.id === currentRow.id ? { ...row, [key]: value } : row
            )
        );
    }
    function updateLocalRowVkn(rowId, vkn) {
        setRows((prev) =>
            prev.map((row) =>
                row.id === rowId
                    ? { ...row, vkn, faturaVkn: vkn }
                    : row
            )
        );

        rowsRef.current = rowsRef.current.map((row) =>
            row.id === rowId
                ? { ...row, vkn, faturaVkn: vkn }
                : row
        );
    }
    async function saveCellOnBlur(rowId, key, value) {
        await hucreBlurKaydet({
            rowId,
            key,
            value,
            rowsRef,
            editingStartValuesRef,
            findNavlunPrice,
            setRows,
            saveChangeLogs,
            setChangedCells,
            fetchChangeLogs,
            fetchAktifSeferler,
            askCompletionIfReady,
        });
    }
    async function selectArac(arac, selection) {
        await aktifSefereAracSec({
            arac,
            selection,
            aracPanelRow,
            rows,
            rowsRef,
            setRows,
            setAracPanelRow,
            setChangedCells,
            saveChangeLogs,
            fetchChangeLogs,
            askCompletionIfReady,

            araclar,
            setAraclar,
            fetchAraclar,
        });
    }
    async function completeTrip(row) {
        await aktifSeferTamamla({
            row,
            saveCompletedTripArchive,
            saveChangeLogs,
            setCompletePromptRow,
            setCompleteDetailRow,
            setRows,
            fetchChangeLogs,
            fetchAktifSeferler,
        });
    }
    async function deleteTrip(row) {
        await aktifSeferSil({
            row,
            saveDeletedTripArchive,
            saveChangeLogs,
            setRows,
            fetchChangeLogs,
        });
    }

    async function deleteMissingTrips(rowsToDelete) {
        await eksikAktifSeferleriSil({
            rowsToDelete,
            saveDeletedTripArchive,
            saveChangeLogs,
            setDeletedTripPrompt,
            fetchChangeLogs,
            fetchAktifSeferler,
        });
    }
    async function addMissingVehicle(vehicle) {
        await eksikAracKaydet({
            vehicle,
            kayipAracEkle,
            setMissingVehicles,
            fetchAraclar,
        });
    }
    async function processExcelFile(file) {
        setExcelImporting(true);
        setImportSummary(null);
        setRevisionChanges([]);
        setChangedCells({});
        setMissingVehicles([]);

        try {
            const result = await aktifSeferExcelDosyasiIsle({
                file,
                rows: rowsRef.current,
                araclar,
                findNavlunPrice,
                saveChangeLogs,
            });

            if (!result) return;

            const deletedCandidates = rowsRef.current.filter(
                (row) => !result.excelIdSet.has(String(row.id))
            );

            if (deletedCandidates.length > 0) {
                setDeletedTripPrompt({
                    count: deletedCandidates.length,
                    rows: deletedCandidates,
                });
            }

            await fetchChangeLogs();

            setImportSummary({
                total: result.excelRows.length,
                updated: result.updates.length,
                unchanged: result.unchangedRows.length,
                missingId: result.missingIdRows.length,
                notFound: result.notFoundIds.length,
            });

            setRevisionChanges(
                result.updates.map((item) => ({
                    id: item.id,
                    seferNo: item.row.seferNo,
                    cekici: item.row.cekici,
                    changes: item.changes,
                }))
            );

            setChangedCells(result.nextChangedCells);
            setMissingVehicles(result.missingVehicles);

            await fetchAktifSeferler();
        } catch (error) {
            console.error(error);
            alert("Excel okunamadı. Dosya formatını kontrol edin.");
        } finally {
            setExcelImporting(false);
            setIsDragActive(false);
        }
    }
    async function handleExcelImport(event) {
        await excelDosyasiSecildi(event, processExcelFile);
    }
    function handlePageDragEnter(event) {
        sayfaDragEnter(event, fileDragDepthRef, setIsDragActive);
    }

    function handlePageDragOver(event) {
        sayfaDragOver(event, setIsDragActive);
    }

    function handlePageDragLeave(event) {
        sayfaDragLeave(event, fileDragDepthRef, setIsDragActive);
    }

    async function handleDrop(event) {
        await sayfaDrop(event, fileDragDepthRef, setIsDragActive, processExcelFile);
    }
    async function exportExcel() {
        await exportAktifSeferExcel(rows, araclar);
    }
    function closeActionMenu() {
        satirMenuKapat(setOpenActionRowId, setActionMenuPosition);
    }
    function toggleActionMenu(event, row) {
        event.stopPropagation();

        if (openActionRowId === row.id) {
            closeActionMenu();
            return;
        }

        setOpenActionRowId(row.id);
        setActionMenuPosition(satirMenuPozisyonuHesapla(event.currentTarget));
    }
    function toggleColumn(key) {
        sutunGorunurlukDegistir(key, setHiddenColumns);
    }
    function startResize(event, key) {
        kolonBoyutlandir(event, key, columns, setColumns);
    }
    function onDragStart(event, key) {
        kolonSuruklemeBaslat(event, key, setDraggingColumnKey);
    }
    function onDragOverColumn(event, targetKey) {
        kolonUzerineSurukle(event, targetKey, setDropTargetColumnKey);
    }

    function onDropColumn(event, targetKey) {
        kolonBirak(
            event,
            targetKey,
            setDraggingColumnKey,
            setDropTargetColumnKey,
            setColumns
        );
    }
    function onColumnDragEnd() {
        kolonSuruklemeBitir(setDraggingColumnKey, setDropTargetColumnKey);
    }
    function renderCell(row, rowIndex, column) {
        return renderAktifSeferHucre({
            row,
            rowIndex,
            column,
            openActionRowId,
            toggleActionMenu,
            setAracPanelRow,
            setNavlunMatchRow,
            editingStartValuesRef,
            updateCell,
            saveCellOnBlur,
            options,
        });
    }
    return (
        <div
            className={isDragActive ? "aktif-seferler-page drag-active" : "aktif-seferler-page"}
            onClick={closeActionMenu}
            onDragEnter={handlePageDragEnter}
            onDragOver={handlePageDragOver}
            onDragLeave={handlePageDragLeave}
            onDrop={handleDrop}
        >
            <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleExcelImport}
                hidden
            />

            <div className="active-table-card">

                <AktifSeferToolbar
                    loading={loading}
                    filteredRows={filteredRows}
                    rows={rows}
                    search={search}
                    setSearch={setSearch}
                    exportExcel={exportExcel}
                    fileInputRef={fileInputRef}
                    excelImporting={excelImporting}
                    setShowIrsaliyePanel={setShowIrsaliyePanel}
                    showColumnPanel={showColumnPanel}
                    setShowColumnPanel={setShowColumnPanel}
                    visibleColumns={visibleColumns}
                />

                <SutunPaneli
                    showColumnPanel={showColumnPanel}
                    visibleColumns={visibleColumns}
                    columnSearch={columnSearch}
                    setColumnSearch={setColumnSearch}
                    filteredColumnList={filteredColumnList}
                    hiddenColumns={hiddenColumns}
                    toggleColumn={toggleColumn}
                />

                <AktifSeferTablosu
                    loading={loading}
                    visibleColumns={visibleColumns}
                    filteredRows={filteredRows}
                    changedCells={changedCells}
                    cellLogs={cellLogs}
                    draggingColumnKey={draggingColumnKey}
                    dropTargetColumnKey={dropTargetColumnKey}
                    setDropTargetColumnKey={setDropTargetColumnKey}
                    onDragStart={onDragStart}
                    onDragOverColumn={onDragOverColumn}
                    onColumnDragEnd={onColumnDragEnd}
                    onDropColumn={onDropColumn}
                    startResize={startResize}
                    renderCell={renderCell}
                    closeActionMenu={closeActionMenu}

                    // 🆕 DETAY BUTONU CLICK (GÜNCEL + SAFE VERSION)
                    onRowClick={(row) => {
                        const device = freshlianceDevices.find(
                            (d) =>
                                String(d.device_code || d.deviceCode || "").trim() ===
                                String(row.datalogerNo || "").trim()
                        );
                        console.log("ROW:", row);
                        console.log("DEVICE:", device);

                        setSelectedDevice({
                            ...(device || {
                                latitude: 39.0,
                                longitude: 35.0,
                                device_code: row.datalogerNo || "UNKNOWN",
                            }),

                            freshlianceAlarm: row.freshlianceAlarm,
                            freshlianceOffline: row.freshlianceOffline,
                            freshlianceAlarmLevel: row.freshlianceAlarmLevel,
                            freshlianceTemperature: row.freshlianceTemperature,
                        });

                        setMapOpen(true);
                    }}
                />
            </div>

            {mapOpen && selectedDevice && (
                <div className="map-drawer">
                    {/* HEADER */}
                    <div className="map-drawer-header">
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{
                                width: 10, height: 10, borderRadius: "50%", flexShrink: 0,
                                background:
                                    selectedDevice.freshlianceAlarmLevel === "OK" ? "#16a34a" :
                                        selectedDevice.freshlianceAlarmLevel === "ALARM" ? "#ef4444" : "#6b7280"
                            }} />
                            <span style={{ fontWeight: 700, fontSize: 14 }}>
                                {selectedDevice.device_code || "Cihaz"}
                            </span>
                            <span style={{
                                fontSize: 11, fontWeight: 700, padding: "2px 8px",
                                borderRadius: 999,
                                background:
                                    selectedDevice.freshlianceAlarmLevel === "OK" ? "#dcfce7" :
                                        selectedDevice.freshlianceAlarmLevel === "ALARM" ? "#fee2e2" : "#f3f4f6",
                                color:
                                    selectedDevice.freshlianceAlarmLevel === "OK" ? "#15803d" :
                                        selectedDevice.freshlianceAlarmLevel === "ALARM" ? "#dc2626" : "#6b7280"
                            }}>
                                {selectedDevice.freshlianceAlarmLevel === "OK" ? "Normal" :
                                    selectedDevice.freshlianceAlarmLevel === "ALARM" ? "Alarm" : "Offline"}
                            </span>
                        </div>
                        <button
                            onClick={() => setMapOpen(false)}
                            style={{
                                width: 32, height: 32, border: "1px solid #e5e7eb",
                                borderRadius: 8, background: "#fff", cursor: "pointer",
                                fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center"
                            }}
                        >✕</button>
                    </div>

                    {/* HARİTA */}
                    <div style={{ height: 280, flexShrink: 0 }}>
                        <FleetMap devices={[selectedDevice]} />
                    </div>

                    {/* BİLGİ KARTLARI */}
                    <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>

                        {/* Stat grid */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                            {[
                                {
                                    label: "Sıcaklık",
                                    value: selectedDevice.freshlianceTemperature || selectedDevice.probe_raw?.temperature != null
                                        ? `${selectedDevice.probe_raw?.temperature ?? selectedDevice.temperature}°C`
                                        : "-",
                                    icon: "🌡️",
                                    alert: selectedDevice.freshlianceAlarm
                                },
                                {
                                    label: "Batarya",
                                    value: selectedDevice.battery != null ? `%${selectedDevice.battery}` : "-",
                                    icon: "🔋",
                                    alert: selectedDevice.battery != null && selectedDevice.battery < 20
                                },
                                {
                                    label: "Enlem",
                                    value: selectedDevice.latitude ? Number(selectedDevice.latitude).toFixed(5) : "-",
                                    icon: "📍",
                                    alert: false
                                },
                                {
                                    label: "Boylam",
                                    value: selectedDevice.longitude ? Number(selectedDevice.longitude).toFixed(5) : "-",
                                    icon: "📍",
                                    alert: false
                                },
                            ].map(({ label, value, icon, alert }) => (
                                <div key={label} style={{
                                    padding: "12px 14px",
                                    borderRadius: 14,
                                    border: `1px solid ${alert ? "#fecaca" : "#e5e7eb"}`,
                                    background: alert ? "#fff5f5" : "#f9fafb",
                                }}>
                                    <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>
                                        {icon} {label}
                                    </div>
                                    <div style={{
                                        fontSize: 18, fontWeight: 700,
                                        color: alert ? "#dc2626" : "#111827"
                                    }}>
                                        {value}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Son güncelleme */}
                        <div style={{
                            padding: "12px 14px", borderRadius: 14,
                            border: "1px solid #e5e7eb", background: "#f9fafb"
                        }}>
                            <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>🕒 Son güncelleme</div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>
                                {selectedDevice.updated_at
                                    ? new Date(selectedDevice.updated_at).toLocaleString("tr-TR")
                                    : "-"}
                            </div>
                        </div>

                        {/* Özel ad / ID */}
                        {(selectedDevice.customName || selectedDevice.userDeviceId) && (
                            <div style={{
                                padding: "12px 14px", borderRadius: 14,
                                border: "1px solid #e5e7eb", background: "#f9fafb",
                                display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8
                            }}>
                                {selectedDevice.customName && (
                                    <div>
                                        <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>Özel Ad</div>
                                        <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>
                                            {selectedDevice.customName}
                                        </div>
                                    </div>
                                )}
                                {selectedDevice.userDeviceId && (
                                    <div>
                                        <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>Cihaz ID</div>
                                        <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>
                                            #{selectedDevice.userDeviceId}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Ham probe verisi (geliştirici için opsiyonel) */}
                        {selectedDevice.probe_raw && (
                            <details style={{ fontSize: 11, color: "#6b7280" }}>
                                <summary style={{ cursor: "pointer", marginBottom: 4 }}>Ham sensör verisi</summary>
                                <pre style={{
                                    background: "#f1f5f9", borderRadius: 8, padding: 10,
                                    overflow: "auto", fontSize: 10, color: "#334155", margin: 0
                                }}>
                                    {JSON.stringify(selectedDevice.probe_raw, null, 2)}
                                </pre>
                            </details>
                        )}
                    </div>
                </div>
            )}
            {navlunMatchRow && (
                <NavlunEslesmeModal
                    row={navlunMatchRow}
                    navlunlar={navlunlar}
                    ugramaSartlari={ugramaSartlari}
                    onClose={() => setNavlunMatchRow(null)}
                    onCreated={(newRecord) => {
                        setNavlunlar((prev) => [newRecord, ...prev]);
                        navlunlarRef.current = [newRecord, ...navlunlarRef.current];
                    }}
                    onUpdated={(updatedRecord) => {
                        setNavlunlar((prev) =>
                            prev.map((item) =>
                                item.id === updatedRecord.id ? updatedRecord : item
                            )
                        );

                        navlunlarRef.current = navlunlarRef.current.map((item) =>
                            item.id === updatedRecord.id ? updatedRecord : item
                        );
                    }}
                    onSelect={async (match) => {
                        await updateRowFieldById(
                            navlunMatchRow.id,
                            "varis1",
                            match.varis1 || "",
                            false
                        );

                        await updateRowFieldById(
                            navlunMatchRow.id,
                            "varis2",
                            match.varis2 || "",
                            false
                        );

                        await updateRowFieldById(
                            navlunMatchRow.id,
                            "varis3",
                            match.varis3 || "",
                            false
                        );

                        const updated = {
                            ...navlunMatchRow,
                            varis1: match.varis1 || "",
                            varis2: match.varis2 || "",
                            varis3: match.varis3 || "",
                        };

                        const price = findNavlunPrice(updated);

                        if (price !== null) {
                            await updateRowFieldById(
                                navlunMatchRow.id,
                                "navlun",
                                price,
                                true
                            );
                        }

                        setNavlunMatchRow(null);
                    }}
                />
            )}
            <ExcelRevizyonModal
                revisionChanges={revisionChanges}
                setRevisionChanges={setRevisionChanges}
            />
            <IrsaliyeOkutModal
                showIrsaliyePanel={showIrsaliyePanel}
                setShowIrsaliyePanel={setShowIrsaliyePanel}
                fetchAktifSeferler={fetchAktifSeferler}
            />
            {aracPanelRow && (
                <AracSecme
                    open
                    araclar={araclar}
                    mevcutSatir={aracPanelRow}
                    onClose={() => setAracPanelRow(null)}
                    onSelect={selectArac}
                />
            )}

            <EksikAracModal
                missingVehicles={missingVehicles}
                setMissingVehicles={setMissingVehicles}
                addMissingVehicle={addMissingVehicle}
            />
            <ExcelSilmeKontrolModal
                deletedTripPrompt={deletedTripPrompt}
                setDeletedTripPrompt={setDeletedTripPrompt}
                deleteMissingTrips={deleteMissingTrips}
            />
            <SeferTamamlamaModal
                completePromptRow={completePromptRow}
                completeDetailRow={completeDetailRow}
                setCompletePromptRow={setCompletePromptRow}
                setCompleteDetailRow={setCompleteDetailRow}
                completeTrip={completeTrip}
            />
            <SatirIslemMenusu
                openActionRowId={openActionRowId}
                actionMenuPosition={actionMenuPosition}
                selectedActionRow={selectedActionRow}
                setAracPanelRow={setAracPanelRow}
                deleteTrip={deleteTrip}
                araclar={araclar}
                fetchAraclar={fetchAraclar}
                updateLocalRowVkn={updateLocalRowVkn}
            />
        </div>
    );
}