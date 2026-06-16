import { supabase } from "../../../lib/supabaseClient";
import { EXCEL_UPDATE_FIELDS } from "./constants";
import { getColumnLabel, getExcelValue, mapUiToDb, normalizeCompare } from "./helpers";
import { buildBaseRowFromExcel } from "./excelIslemleri";
import { enrichRowFromVehicle } from "./aracIslemleri";

export async function aktifSeferExcelDosyasiIsle({
    file,
    rows,
    araclar,
    findNavlunPrice,
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
        const excelId = String(getExcelValue(excelRow, ["ID", "id", "Id"])).trim();

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

        let importedRow = buildBaseRowFromExcel(excelRow, currentRow);

        const enriched = enrichRowFromVehicle(importedRow, araclar);

        if (importedRow.cekici && !enriched.arac) {
            missingVehicleMap.set(importedRow.cekici, {
                cekici: importedRow.cekici,
                dorse: importedRow.dorse,
                tc: importedRow.tc,
                surucu: importedRow.surucu,
                telefon: importedRow.telefon,
                vkn: importedRow.faturaVkn,
            });
        }

        importedRow = enriched.row;

        const navlunPrice = findNavlunPrice(importedRow);
        if (navlunPrice !== null) {
            importedRow.navlun = navlunPrice;
        }

        const changedFields = EXCEL_UPDATE_FIELDS.filter((field) => {
            return normalizeCompare(currentRow[field]) !== normalizeCompare(importedRow[field]);
        });

        if (changedFields.length === 0) {
            unchangedRows.push(excelId);
            continue;
        }

        const finalRow = {
            ...currentRow,
            ...importedRow,
        };

        updates.push({
            id: excelId,
            row: finalRow,
            changes: changedFields.map((field) => ({
                field,
                label: getColumnLabel(field),
                oldValue: currentRow[field] ?? "",
                newValue: finalRow[field] ?? "",
            })),
        });

        nextChangedCells[excelId] = {};
        changedFields.forEach((field) => {
            nextChangedCells[excelId][field] = true;
        });
    }

    for (const item of updates) {
        const { error } = await supabase
            .from("aktif_seferler")
            .update(mapUiToDb(item.row))
            .eq("id", item.id);

        if (error) {
            alert(`ID ${item.id} güncellenemedi: ${error.message}`);
            return null;
        }

        await saveChangeLogs(item.id, item.changes, "Excel Güncelleme");
    }

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