import { supabase } from "../../../lib/supabaseClient";
import { getColumnLabel, mapUiToDb, normalizeCompare } from "./helpers";

export async function hucreBlurKaydet({
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

    if (["varis1", "varis2", "varis3"].includes(key)) {
        const price = findNavlunPrice(updatedRow);
        if (price !== null) updatedRow.navlun = price;
    }

    setRows((prev) =>
        prev.map((row) => (row.id === rowId ? updatedRow : row))
    );

    rowsRef.current = rowsRef.current.map((row) =>
        row.id === rowId ? updatedRow : row
    );

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

    setChangedCells((prev) => ({
        ...prev,
        [String(rowId)]: {
            ...(prev[String(rowId)] || {}),
            [key]: true,
        },
    }));

    await fetchChangeLogs();

    askCompletionIfReady(updatedRow);
}