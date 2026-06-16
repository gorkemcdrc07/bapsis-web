import { supabase } from "../../../lib/supabaseClient";
import {
    getColumnLabel,
    mapUiToDb,
    normalizePlate,
} from "./helpers";

const SEFER_TABLOSU = "donusler_aktif_seferler";

const FIELD_HEADERS = {
    seferNo: ["Sefer No", "seferNo", "sefer_no"],
    sevkTarihi: ["Sevk Tarihi", "Sevk Tarih", "sevkTarihi", "sevk_tarihi"],
    yukleyenDepo: ["Yükleyen Depo", "Yükleyen", "yukleyenDepo", "yukleyen_depo"],
    kalkisYeri: ["Kalkış Yeri", "kalkisYeri", "kalkis_yeri"],
    aracCinsi: ["Araç Cinsi", "aracCinsi", "arac_cinsi"],
    cekici: ["Çekici", "cekici"],
    dorse: ["Dorse", "dorse"],
    tc: ["TC", "tc"],
    surucu: ["Sürücü", "surucu"],
    telefon: ["Telefon", "telefon"],
    faturaVkn: ["VKN", "faturaVkn", "fatura_vkn"],
    varis1: ["Varış 1", "Varis 1", "VARIŞ 1", "VARIS 1", "varis1"],
    varis2: ["Varış 2", "Varis 2", "VARIŞ 2", "VARIS 2", "varis2"],
    varis3: ["Varış 3", "Varis 3", "VARIŞ 3", "VARIS 3", "varis3"],
    varis4: ["Varış 4", "Varis 4", "VARIŞ 4", "VARIS 4", "varis4"],
    palet: ["Palet", "palet"],
    irsaliyeNo: ["İrsaliye", "irsaliyeNo", "irsaliye_no"],
    datalogerNo: ["Dataloger", "datalogerNo", "dataloger_no"],
    navlun: ["Navlun", "navlun"],
    aracDurumu: ["Araç Durumu", "Araç Duru", "Durum", "aracDurumu", "arac_durumu"],
    peronNo: ["Peron", "peronNo", "peron_no"],
};

function isFilled(value) {
    return value !== undefined && value !== null && String(value).trim() !== "";
}

function normalizeHeader(value) {
    return String(value || "")
        .toLocaleUpperCase("tr-TR")
        .replace(/\s+/g, "")
        .replace(/İ/g, "I")
        .replace(/İ/g, "I")
        .trim();
}

function getFlexibleExcelValue(row, keys) {
    const normalizedKeys = keys.map(normalizeHeader);

    for (const [rowKey, rowValue] of Object.entries(row)) {
        if (
            rowValue !== undefined &&
            rowValue !== null &&
            rowValue !== "" &&
            normalizedKeys.includes(normalizeHeader(rowKey))
        ) {
            return rowValue;
        }
    }

    return "";
}

function readField(excelRow, field) {
    const value = getFlexibleExcelValue(excelRow, FIELD_HEADERS[field] || [field]);

    if (field === "cekici" || field === "dorse") {
        return normalizePlate(value);
    }

    return value;
}

function applyField(finalRow, changedFields, field, value) {
    if (!isFilled(value)) return;

    finalRow[field] = value;

    if (!changedFields.includes(field)) {
        changedFields.push(field);
    }
}

function vehicleExists(araclar, cekici) {
    if (!cekici) return true;

    return araclar.some(
        (arac) => normalizePlate(arac.cekici) === normalizePlate(cekici)
    );
}

function addMissingVehicleIfNeeded(missingVehicleMap, araclar, row) {
    if (!row.cekici) return;
    if (vehicleExists(araclar, row.cekici)) return;

    missingVehicleMap.set(normalizePlate(row.cekici), {
        cekici: row.cekici || "",
        dorse: row.dorse || "",
        surucu: row.surucu || "",
        tc: row.tc || "",
        telefon: row.telefon || "",
        vkn: row.faturaVkn || row.vkn || "",
    });
}

export async function plakaAtamaExcelDosyasiIsle({
    file,
    rows,
    araclar,
    saveChangeLogs,
}) {
    const XLSX = await import("xlsx");

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const excelRows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    const currentRowsById = new Map(rows.map((row) => [String(row.id), row]));

    const updates = [];
    const missingIdRows = [];
    const notFoundIds = [];
    const unchangedRows = [];
    const nextChangedCells = {};
    const missingVehicleMap = new Map();
    const excelIdSet = new Set();

    for (const [index, excelRow] of excelRows.entries()) {
        const excelId = String(getFlexibleExcelValue(excelRow, ["ID", "id", "Id"])).trim();

        if (!excelId) {
            missingIdRows.push(index + 2);
            continue;
        }

        excelIdSet.add(excelId);

        const currentRow = currentRowsById.get(excelId);

        if (!currentRow) {
            notFoundIds.push(excelId);
            continue;
        }

        const finalRow = { ...currentRow };
        const changedFields = [];

        Object.keys(FIELD_HEADERS).forEach((field) => {
            applyField(finalRow, changedFields, field, readField(excelRow, field));
        });

        if (
            changedFields.includes("cekici") ||
            changedFields.includes("dorse") ||
            changedFields.includes("aracDurumu")
        ) {
            finalRow.aracDurumu =
                finalRow.aracDurumu ||
                (finalRow.cekici || finalRow.dorse
                    ? "Plaka Atandı"
                    : "Plaka Bekliyor");

            if (!changedFields.includes("aracDurumu")) {
                changedFields.push("aracDurumu");
            }
        }

        addMissingVehicleIfNeeded(missingVehicleMap, araclar, finalRow);

        if (!changedFields.length) {
            unchangedRows.push(excelId);
            continue;
        }

        const changes = changedFields.map((field) => ({
            field,
            label: getColumnLabel(field),
            oldValue: currentRow[field] ?? "",
            newValue: finalRow[field] ?? "",
        }));

        updates.push({
            id: excelId,
            row: finalRow,
            fields: changedFields,
            changes,
        });

        nextChangedCells[excelId] = {};
        changedFields.forEach((field) => {
            nextChangedCells[excelId][field] = true;
        });
    }

    for (const item of updates) {
        const payload = mapUiToDb(item.row);

        console.log("UPDATE TABLE:", SEFER_TABLOSU);
        console.log("UPDATE ID:", item.id);
        console.log("UPDATE PAYLOAD:", payload);

        const { data, error } = await supabase
            .from(SEFER_TABLOSU)
            .update(payload)
            .eq("id", item.id)
            .select("*");

        console.log("SUPABASE UPDATE DATA:", data);
        console.log("SUPABASE UPDATE ERROR:", error);

        if (error) {
            alert(`ID ${item.id} güncellenemedi: ${error.message}`);
            return null;
        }

        if (!data || data.length === 0) {
            alert(`ID ${item.id} için Supabase satır döndürmedi.`);
            return null;
        }

        await saveChangeLogs(item.id, item.changes, "Excel Güncelleme");
    }

    console.log("EXCEL SATIRLARI:", excelRows);
    console.log("UPDATES:", updates);
    console.log("NOT FOUND IDS:", notFoundIds);
    console.log("UNCHANGED:", unchangedRows);
    console.log("MISSING VEHICLES:", [...missingVehicleMap.values()]);

    return {
        excelRows,
        excelIdSet,
        updates,
        unchangedRows,
        missingIdRows,
        notFoundIds,
        nextChangedCells,
        missingVehicles: [...missingVehicleMap.values()],
    };
}