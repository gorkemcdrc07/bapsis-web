import { getColumnLabel, mapSingleFieldToDb, normalizeCompare } from "./helpers";

export async function hucreBlurKaydet({
    rowId,
    key,
    value,
    rowsRef,
    editingStartValuesRef,
    plakaAtamaKaydiGuncelle,
    setRows,
    saveChangeLogs,
    showToast,
    fetchRows,
}) {
    const editKey = `${rowId}_${key}`;
    const oldValue = editingStartValuesRef.current[editKey] ?? "";
    const newValue = value ?? "";

    delete editingStartValuesRef.current[editKey];

    if (normalizeCompare(oldValue) === normalizeCompare(newValue)) return;

    const currentRow = rowsRef.current.find((row) => row.id === rowId);
    if (!currentRow) return;

    let updatedRow = {
        ...currentRow,
        [key]: newValue,
    };

    if (key === "cekici" || key === "dorse") {
        const hasPlate = Boolean(updatedRow.cekici || updatedRow.dorse);
        updatedRow.aracDurumu = hasPlate ? "Plaka Atandý" : "Plaka Bekliyor";
    }

    const payload = mapSingleFieldToDb(key, newValue);

    if (key === "cekici" || key === "dorse") {
        payload.arac_durumu = updatedRow.aracDurumu;
    }

    setRows((prev) =>
        prev.map((row) => (row.id === rowId ? updatedRow : row))
    );

    rowsRef.current = rowsRef.current.map((row) =>
        row.id === rowId ? updatedRow : row
    );

    const error = await plakaAtamaKaydiGuncelle(rowId, payload);

    if (error) {
        showToast(`Güncelleme yapýlamadý: ${error.message}`, "error");
        fetchRows?.();
        return;
    }

    await saveChangeLogs(
        rowId,
        [
            {
                field: key,
                label: getColumnLabel(key),
                oldValue,
                newValue,
            },
        ],
        "Manuel Güncelleme"
    );

    showToast("Güncellendi.");
}