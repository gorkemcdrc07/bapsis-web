import { useEffect, useMemo, useRef, useState } from "react";
import "./PlakaAtama.css";

import {
    columnsData,
    defaultHiddenColumns,
    options,
} from "./plakaatama/constants";

import {
    getColumnLabel,
    mapSingleFieldToDb,
    normalizeCompare,
} from "./plakaatama/helpers";

import {
    plakaAtamaKayitlariniGetir,
    plakaAtamaKaydiGuncelle,
    plakaAtamaKaydiSil,
    plakaAtamaRealtimeBaslat,
    araclariGetir,
    degisiklikKaydiEkle,
    degisiklikleriGetir,
} from "./plakaatama/veriServisi";

import {
    plakaAtamaFiltrele,
    sutunlariFiltrele,
} from "./plakaatama/filtreIslemleri";

import { renderPlakaAtamaHucre } from "./plakaatama/hucreRender.jsx";
import PlakaAtamaToolbar from "./plakaatama/PlakaAtamaToolbar.jsx";
import PlakaAtamaTablosu from "./plakaatama/PlakaAtamaTablosu.jsx";
import SutunPaneli from "./plakaatama/SutunPaneli.jsx";
import SatirIslemMenusu from "./plakaatama/SatirIslemMenusu.jsx";

import ExcelRevizyonModal from "./plakaatama/ExcelRevizyonModal.jsx";
import ExcelSilmeKontrolModal from "./plakaatama/ExcelSilmeKontrolModal.jsx";
import EksikAracModal from "./plakaatama/EksikAracModal.jsx";
import IrsaliyeOkutModal from "./plakaatama/IrsaliyeOkutModal.jsx";

import { sutunGorunurlukDegistir } from "./plakaatama/sutunIslemleri";
import { excelDosyasiSecildi } from "./plakaatama/excelDosyaIslemleri";
import { exportPlakaAtamaExcel } from "./plakaatama/excelIslemleri";
import { plakaAtamaExcelDosyasiIsle } from "./plakaatama/excelImportIslemleri";
import { kayipAracEkle } from "./plakaatama/aracIslemleri";
import { eksikAracKaydet } from "./plakaatama/eksikAracIslemleri";
import { eksikPlakaAtamaSeferleriSil } from "./plakaatama/seferSilmeIslemleri";
import { supabase } from "../../lib/supabaseClient";
import { isTripReadyToComplete } from "./plakaatama/tamamlamaKontrol";
import SeferTamamlamaModal from "./plakaatama/seferTamamlamaModal.jsx";
import { plakaAtamaSeferTamamla } from "./plakaatama/seferTamamlamaIslemleri";
import {
    satirMenuKapat,
    satirMenuPozisyonuHesapla,
} from "./plakaatama/menuIslemleri";

import {
    kolonBirak,
    kolonBoyutlandir,
    kolonSuruklemeBaslat,
    kolonSuruklemeBitir,
    kolonUzerineSurukle,
} from "./plakaatama/kolonIslemleri";

import {
    sayfaDragEnter,
    sayfaDragLeave,
    sayfaDragOver,
    sayfaDrop,
} from "./plakaatama/dragDropIslemleri";

import AracSecme from "../bimafyon/aktifseferler/aracsecme";
import FleetMap from "../../components/Map/FleetMap";

async function saveChangeLogs(seferId, changes, islemTipi = "Güncelleme") {
    await degisiklikKaydiEkle(seferId, changes, islemTipi);
}

export default function PlakaAtama() {
    const [rows, setRows] = useState([]);
    const [columns, setColumns] = useState(columnsData);

    const [loading, setLoading] = useState(false);
    const [savingId, setSavingId] = useState(null);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [toast, setToast] = useState(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(50);

    const [hiddenColumns, setHiddenColumns] = useState(defaultHiddenColumns);
    const [showColumnPanel, setShowColumnPanel] = useState(false);
    const [columnSearch, setColumnSearch] = useState("");

    const [draggingColumnKey, setDraggingColumnKey] = useState(null);
    const [dropTargetColumnKey, setDropTargetColumnKey] = useState(null);
    const [isDragActive, setIsDragActive] = useState(false);

    const [araclar, setAraclar] = useState([]);
    const [aracPanelRow, setAracPanelRow] = useState(null);

    const [openActionRowId, setOpenActionRowId] = useState(null);
    const [actionMenuPosition, setActionMenuPosition] = useState(null);

    const [excelImporting, setExcelImporting] = useState(false);
    const [revisionChanges, setRevisionChanges] = useState([]);
    const [missingVehicles, setMissingVehicles] = useState([]);
    const [deletedTripPrompt, setDeletedTripPrompt] = useState(null);

    const [showIrsaliyePanel, setShowIrsaliyePanel] = useState(false);
    const [cellLogs, setCellLogs] = useState({});
    const [freshlianceDevices, setFreshlianceDevices] = useState([]);
    const [selectedDevice, setSelectedDevice] = useState(null);
    const [mapOpen, setMapOpen] = useState(false);
    const [completePromptRow, setCompletePromptRow] = useState(null);
    const [completeDetailRow, setCompleteDetailRow] = useState(null);
    const fileInputRef = useRef(null);
    const rowsRef = useRef([]);
    const editingStartValuesRef = useRef({});
    const fileDragDepthRef = useRef(0);

    const visibleColumns = useMemo(() => {
        return columns.filter((column) => !hiddenColumns.includes(column.key));
    }, [columns, hiddenColumns]);

    const hideableColumns = useMemo(() => {
        return columns.filter((column) => column.key !== "actions");
    }, [columns]);

    const filteredColumnList = useMemo(() => {
        return sutunlariFiltrele(hideableColumns, columnSearch);
    }, [hideableColumns, columnSearch]);

    const filteredRows = useMemo(() => {
        return plakaAtamaFiltrele(rows, search, statusFilter);
    }, [rows, search, statusFilter]);

    const selectedActionRow = useMemo(() => {
        return rows.find((row) => row.id === openActionRowId) || null;
    }, [rows, openActionRowId]);

    const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));

    const paginatedRows = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize;
        return filteredRows.slice(startIndex, startIndex + pageSize);
    }, [filteredRows, currentPage, pageSize]);

    useEffect(() => {
        setCurrentPage(1);
    }, [search, statusFilter, pageSize]);

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    useEffect(() => {
        fetchRows();
        fetchAraclar();
        fetchChangeLogs();
        fetchFreshlianceDevices();

        const cleanup = plakaAtamaRealtimeBaslat(() => {
            fetchRows();
            fetchChangeLogs();
            fetchFreshlianceDevices();
        });

        return cleanup;
    }, []);
    useEffect(() => {
        rowsRef.current = rows;
    }, [rows]);

    function showToast(text, type = "success") {
        setToast({ text, type });
        setTimeout(() => setToast(null), 2600);
    }

    async function fetchRows() {
        setLoading(true);
        const data = await plakaAtamaKayitlariniGetir();
        setLoading(false);

        if (!data) {
            showToast("Dönüş seferleri alınamadı.", "error");
            return;
        }

        setRows(data);
    }

    async function fetchAraclar() {
        const data = await araclariGetir();
        setAraclar(data || []);
    }

    async function fetchChangeLogs() {
        const logsByCell = await degisiklikleriGetir();
        if (!logsByCell) return;
        setCellLogs(logsByCell);
    }
    async function fetchFreshlianceDevices() {
        const { data, error } = await supabase
            .from("freshliance_devices")
            .select("*");

        if (error) {
            console.error("Freshliance cihazları alınamadı:", error);
            return;
        }

        setFreshlianceDevices(data || []);
    }

    function openMapForRow(row) {
        const device = freshlianceDevices.find(
            (item) =>
                String(item.device_code || "").trim() ===
                String(row.datalogerNo || "").trim()
        );

        if (device) {
            const temp = parseFloat(device.probe_raw?.temperature);
            const isTempAlarm = !isNaN(temp) && (temp > 25 || temp < 2);
            const lastUpdate = device.updated_at ? new Date(device.updated_at).getTime() : null;
            const isOffline = !lastUpdate || Date.now() - lastUpdate > 10 * 60 * 1000;

            setSelectedDevice({
                ...device,
                freshlianceAlarm: isTempAlarm,
                freshlianceAlarmLevel: isOffline ? "OFFLINE" : isTempAlarm ? "ALARM" : "OK",
            });
        } else {
            setSelectedDevice({
                latitude: 39.0,
                longitude: 35.0,
                device_code: row.datalogerNo || "UNKNOWN",
                freshlianceAlarmLevel: "OFFLINE",
                freshlianceAlarm: false,
            });
        }

        setMapOpen(true);
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

    function updateLocalRowVkn(rowId, vkn) {
        setRows((prev) =>
            prev.map((row) =>
                row.id === rowId ? { ...row, vkn, faturaVkn: vkn } : row
            )
        );

        rowsRef.current = rowsRef.current.map((row) =>
            row.id === rowId ? { ...row, vkn, faturaVkn: vkn } : row
        );
    }

    async function deleteTrip(row) {
        if (!confirm("Bu sefer silinsin mi?")) return;

        const aktifKullanici = JSON.parse(
            localStorage.getItem("aktifKullanici") || "null"
        );

        const { error: archiveError } = await supabase
            .from("silinen_aktif_seferler")
            .insert({
                eski_sefer_id: String(row.id),
                silinme_nedeni: "Kullanıcı tarafından silindi",
                silen_kullanici_adi:
                    aktifKullanici?.adSoyad ||
                    aktifKullanici?.ad_soyad ||
                    aktifKullanici?.ad ||
                    "",
                silen_kullanici_kodu:
                    aktifKullanici?.kullaniciKodu ||
                    aktifKullanici?.kullanici_kodu ||
                    aktifKullanici?.kod ||
                    "",
                silen_kullanici_rol: aktifKullanici?.rol || "",
                ekran_adi: "DÖNÜŞ SEFERİ",
                sefer_verisi: row,
            });

        if (archiveError) {
            showToast(`Silinen sefer arşivlenemedi: ${archiveError.message}`, "error");
            return;
        }

        const error = await plakaAtamaKaydiSil(row.id);

        if (error) {
            showToast(`Sefer silinemedi: ${error.message}`, "error");
            return;
        }

        setRows((prev) => prev.filter((item) => item.id !== row.id));
        closeActionMenu();
        showToast("Sefer silindi.");
        await fetchChangeLogs();
    }
    async function processExcelFile(file) {
        setExcelImporting(true);
        setRevisionChanges([]);
        setMissingVehicles([]);

        try {
            const result = await plakaAtamaExcelDosyasiIsle({
                file,
                rows: rowsRef.current,
                araclar,
                saveChangeLogs,
            });

            if (!result) return;

            setRows((prevRows) =>
                prevRows.map((row) => {
                    const updated = result.updates.find(
                        (item) => String(item.id) === String(row.id)
                    );

                    return updated ? updated.row : row;
                })
            );

            rowsRef.current = rowsRef.current.map((row) => {
                const updated = result.updates.find(
                    (item) => String(item.id) === String(row.id)
                );

                return updated ? updated.row : row;
            });

            const deletedCandidates = rowsRef.current.filter(
                (row) => !result.excelIdSet.has(String(row.id))
            );

            if (deletedCandidates.length > 0) {
                setDeletedTripPrompt({
                    count: deletedCandidates.length,
                    rows: deletedCandidates,
                });
            }

            setRevisionChanges(
                result.updates.map((item) => ({
                    id: item.id,
                    seferNo: item.row.seferNo,
                    cekici: item.row.cekici,
                    changes: item.changes,
                }))
            );

            setMissingVehicles(result.missingVehicles);

            await fetchChangeLogs();
            await fetchRows();
        } catch (error) {
            console.error(error);
            showToast("Excel okunamadı. Dosya formatını kontrol edin.", "error");
        } finally {
            setExcelImporting(false);
            setIsDragActive(false);
            fileDragDepthRef.current = 0;
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
        await exportPlakaAtamaExcel(rows);
    }

    async function addMissingVehicle(vehicle) {
        await eksikAracKaydet({
            vehicle,
            kayipAracEkle,
            setMissingVehicles,
            fetchAraclar,
        });
    }

    async function deleteMissingTrips(rowsToDelete) {
        await eksikPlakaAtamaSeferleriSil({
            rowsToDelete,
            plakaAtamaKaydiSil,
            saveChangeLogs,
            setDeletedTripPrompt,
            fetchRows,
            fetchChangeLogs,
            showToast,
        });

        await fetchChangeLogs();
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

    function updateCell(rowIndex, key, value) {
        const currentRow = paginatedRows[rowIndex];
        if (!currentRow?.id) return;

        setRows((prev) =>
            prev.map((row) =>
                row.id === currentRow.id ? { ...row, [key]: value } : row
            )
        );
    }

    async function saveCellOnBlur(rowId, key, value) {
        const currentRow = rowsRef.current.find((row) => row.id === rowId);
        if (!currentRow) return;

        const oldValue = editingStartValuesRef.current[`${rowId}_${key}`];
        if (normalizeCompare(oldValue) === normalizeCompare(value)) return;

        let updatedRow = { ...currentRow, [key]: value };

        if (key === "cekici" || key === "dorse") {
            const hasPlate = Boolean(updatedRow.cekici || updatedRow.dorse);
            updatedRow.aracDurumu = hasPlate ? "Plaka Atandı" : "Plaka Bekliyor";
        }

        const payload = mapSingleFieldToDb(key, value);

        if (key === "cekici" || key === "dorse") {
            payload.arac_durumu = updatedRow.aracDurumu;
        }

        setRows((prev) =>
            prev.map((row) => (row.id === rowId ? updatedRow : row))
        );

        rowsRef.current = rowsRef.current.map((row) =>
            row.id === rowId ? updatedRow : row
        );

        setSavingId(rowId);
        const error = await plakaAtamaKaydiGuncelle(rowId, payload);
        setSavingId(null);

        if (error) {
            showToast(`Güncelleme yapılamadı: ${error.message}`, "error");
            fetchRows();
            return;
        }

        await saveChangeLogs(
            rowId,
            [
                {
                    field: key,
                    label: getColumnLabel(key),
                    oldValue: oldValue ?? "",
                    newValue: value ?? "",
                },
            ],
            "Manuel Güncelleme"
        );

        await fetchChangeLogs();

        showToast("Güncellendi.");
        if (
            updatedRow.aracDurumu !== "Yüklemeye Hazır" &&
            isTripReadyToComplete(updatedRow)
        ) {
            setCompletePromptRow(updatedRow);
        }
    }

    async function selectArac(arac, selection) {
        if (!aracPanelRow?.id) return;

        const currentRow = rowsRef.current.find((row) => row.id === aracPanelRow.id);
        if (!currentRow) return;

        const secimTipi = selection?.type || "vehicle-change";

        const updatedRow =
            secimTipi === "driver-change"
                ? {
                    ...currentRow,
                    tc: arac.tc ?? "",
                    surucu: arac.surucu ?? "",
                    telefon: arac.telefon ?? "",
                    faturaVkn: arac.vkn ?? "",
                    vkn: arac.vkn ?? "",
                    aracDurumu: "Plaka Atandı",
                }
                : {
                    ...currentRow,
                    cekici: arac.cekici ?? "",
                    dorse: arac.dorse ?? "",
                    surucu: arac.surucu ?? "",
                    tc: arac.tc ?? "",
                    telefon: arac.telefon ?? "",
                    faturaVkn: arac.vkn ?? "",
                    vkn: arac.vkn ?? "",
                    aracDurumu: "Plaka Atandı",
                };

        const changedFields =
            secimTipi === "driver-change"
                ? ["tc", "surucu", "telefon", "faturaVkn"].filter(
                    (field) =>
                        normalizeCompare(currentRow[field]) !==
                        normalizeCompare(updatedRow[field])
                )
                : ["cekici", "dorse", "tc", "surucu", "telefon", "faturaVkn"].filter(
                    (field) =>
                        normalizeCompare(currentRow[field]) !==
                        normalizeCompare(updatedRow[field])
                );

        if (!changedFields.length) {
            setAracPanelRow(null);
            return;
        }

        setSavingId(aracPanelRow.id);

        const error = await plakaAtamaKaydiGuncelle(aracPanelRow.id, {
            cekici: updatedRow.cekici,
            dorse: updatedRow.dorse,
            surucu: updatedRow.surucu,
            tc: updatedRow.tc,
            telefon: updatedRow.telefon,
            fatura_vkn: updatedRow.faturaVkn,
            vkn: updatedRow.faturaVkn,
            arac_durumu: updatedRow.aracDurumu,
            updated_at: new Date().toISOString(),
        });

        setSavingId(null);

        if (error) {
            showToast(`Araç atanamadı: ${error.message}`, "error");
            fetchRows();
            return;
        }

        setRows((prev) =>
            prev.map((row) =>
                row.id === aracPanelRow.id ? updatedRow : row
            )
        );

        rowsRef.current = rowsRef.current.map((row) =>
            row.id === aracPanelRow.id ? updatedRow : row
        );

        await saveChangeLogs(
            updatedRow.id,
            changedFields.map((field) => ({
                field,
                label: getColumnLabel(field),
                oldValue: currentRow[field] ?? "",
                newValue: updatedRow[field] ?? "",
            })),
            secimTipi === "driver-change" ? "Şoför Değiştirme" : "Araç Değiştirme"
        );

        await fetchChangeLogs();

        setAracPanelRow(null);
        showToast("Araç bilgileri aktarıldı.");
        if (
            updatedRow.aracDurumu !== "Yüklemeye Hazır" &&
            isTripReadyToComplete(updatedRow)
        ) {
            setCompletePromptRow(updatedRow);
        }
    }


    async function completeTrip(row) {
        await plakaAtamaSeferTamamla({
            row,
            plakaAtamaKaydiSil,
            saveChangeLogs,
            setCompletePromptRow,
            setCompleteDetailRow,
            setRows,
            showToast,
        });

        await fetchChangeLogs();
    }

    function renderCell(row, rowIndex, column) {
        return renderPlakaAtamaHucre({
            row,
            rowIndex,
            column,
            editingStartValuesRef,
            updateCell,
            saveCellOnBlur,
            options,
            setAracPanelRow,
            openActionRowId,
            toggleActionMenu,
            cellLogs,
        });
    }

    return (
        <div
            className={isDragActive ? "dpa-page drag-active" : "dpa-page"}
            onClick={() => {
                setShowColumnPanel(false);
                closeActionMenu();
            }}
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

            {isDragActive && (
                <div className="drop-overlay">
                    <div className="drop-box">
                        <div className="drop-icon">⬆</div>
                        <strong>Excel dosyasını bırak</strong>
                        <span>Dosya otomatik okunacak ve dönüş seferleri güncellenecek.</span>
                    </div>
                </div>
            )}

            {toast && (
                <div className={`dpa-toast dpa-toast--${toast.type}`}>
                    {toast.text}
                </div>
            )}

            <div className="dpa-card">
                <PlakaAtamaToolbar
                    loading={loading}
                    rows={rows}
                    filteredRows={filteredRows}
                    search={search}
                    setSearch={setSearch}
                    statusFilter={statusFilter}
                    setStatusFilter={setStatusFilter}
                    fetchRows={fetchRows}
                    showColumnPanel={showColumnPanel}
                    setShowColumnPanel={setShowColumnPanel}
                    visibleColumns={visibleColumns}
                    exportExcel={exportExcel}
                    fileInputRef={fileInputRef}
                    excelImporting={excelImporting}
                    setShowIrsaliyePanel={setShowIrsaliyePanel}
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

                <PlakaAtamaTablosu
                    loading={loading}
                    visibleColumns={visibleColumns}
                    filteredRows={paginatedRows}
                    renderCell={renderCell}
                    openMapForRow={openMapForRow}
                    draggingColumnKey={draggingColumnKey}
                    dropTargetColumnKey={dropTargetColumnKey}
                    setDropTargetColumnKey={setDropTargetColumnKey}
                    onDragStart={onDragStart}
                    onDragOverColumn={onDragOverColumn}
                    onColumnDragEnd={onColumnDragEnd}
                    onDropColumn={onDropColumn}
                    startResize={startResize}
                />

                <div className="dpa-pagination">
                    <div className="dpa-pagination-info">
                        Sayfa {currentPage} / {totalPages} · {filteredRows.length} kayıt
                    </div>

                    <div className="dpa-pagination-actions">
                        <select
                            className="dpa-page-size"
                            value={pageSize}
                            onChange={(e) => setPageSize(Number(e.target.value))}
                        >
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                            <option value={200}>200</option>
                        </select>

                        <button disabled={currentPage === 1} onClick={() => setCurrentPage(1)}>
                            İlk
                        </button>

                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                        >
                            Önceki
                        </button>

                        <button
                            disabled={currentPage === totalPages}
                            onClick={() =>
                                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                            }
                        >
                            Sonraki
                        </button>

                        <button
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(totalPages)}
                        >
                            Son
                        </button>
                    </div>
                </div>
            </div>

            <SatirIslemMenusu
                openActionRowId={openActionRowId}
                actionMenuPosition={actionMenuPosition}
                selectedActionRow={selectedActionRow}
                setAracPanelRow={setAracPanelRow}
                deleteTrip={deleteTrip}
                araclar={araclar}
                fetchAraclar={fetchAraclar}
                updateLocalRowVkn={updateLocalRowVkn}
                openMapForRow={openMapForRow}
            />
            <ExcelRevizyonModal
                revisionChanges={revisionChanges}
                setRevisionChanges={setRevisionChanges}
            />

            <ExcelSilmeKontrolModal
                deletedTripPrompt={deletedTripPrompt}
                setDeletedTripPrompt={setDeletedTripPrompt}
                deleteMissingTrips={deleteMissingTrips}
            />

            <EksikAracModal
                missingVehicles={missingVehicles}
                setMissingVehicles={setMissingVehicles}
                addMissingVehicle={addMissingVehicle}
            />

            <IrsaliyeOkutModal
                showIrsaliyePanel={showIrsaliyePanel}
                setShowIrsaliyePanel={setShowIrsaliyePanel}
                fetchRows={fetchRows}
            />

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
                            type="button"
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
                        <FleetMap
                            devices={[selectedDevice]}
                            onRefresh={fetchFreshlianceDevices}
                            autoRefresh={true}
                        />
                    </div>

                    {/* BİLGİ KARTLARI */}
                    <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>

                        {/* Stat grid */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                            {[
                                {
                                    label: "Sıcaklık",
                                    value: selectedDevice.probe_raw?.temperature != null
                                        ? `${selectedDevice.probe_raw.temperature}°C`
                                        : selectedDevice.temperature != null
                                            ? `${selectedDevice.temperature}°C`
                                            : "-",
                                    icon: "🌡️",
                                    alert: selectedDevice.freshlianceAlarm,
                                },
                                {
                                    label: "Batarya",
                                    value: selectedDevice.battery != null ? `%${selectedDevice.battery}` : "-",
                                    icon: "🔋",
                                    alert: selectedDevice.battery != null && selectedDevice.battery < 20,
                                },
                                {
                                    label: "Enlem",
                                    value: selectedDevice.latitude ? Number(selectedDevice.latitude).toFixed(5) : "-",
                                    icon: "📍",
                                    alert: false,
                                },
                                {
                                    label: "Boylam",
                                    value: selectedDevice.longitude ? Number(selectedDevice.longitude).toFixed(5) : "-",
                                    icon: "📍",
                                    alert: false,
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

                        {/* Özel ad / Cihaz ID */}
                        {(selectedDevice.custom_name || selectedDevice.user_device_id) && (
                            <div style={{
                                padding: "12px 14px", borderRadius: 14,
                                border: "1px solid #e5e7eb", background: "#f9fafb",
                                display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8
                            }}>
                                {selectedDevice.custom_name && (
                                    <div>
                                        <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>Özel Ad</div>
                                        <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>
                                            {selectedDevice.custom_name}
                                        </div>
                                    </div>
                                )}
                                {selectedDevice.user_device_id && (
                                    <div>
                                        <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>Cihaz ID</div>
                                        <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>
                                            #{selectedDevice.user_device_id}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Ham sensör verisi */}
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
            <SeferTamamlamaModal
                completePromptRow={completePromptRow}
                completeDetailRow={completeDetailRow}
                setCompletePromptRow={setCompletePromptRow}
                setCompleteDetailRow={setCompleteDetailRow}
                completeTrip={completeTrip}
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
        </div>
    );
}