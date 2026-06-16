import { supabase } from "../../../lib/supabaseClient";
import { getColumnLabel, mapUiToDb, normalizeCompare } from "./helpers";

export async function aktifSefereAracSec({
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
    setAraclar,
    fetchAraclar,
}) {
    if (!aracPanelRow?.id) return;

    const currentRow = rowsRef.current.find((row) => row.id === aracPanelRow.id);
    if (!currentRow) return;

    const secimTipi = selection?.type || "vehicle-change";

    const updatedRow =
        secimTipi === "driver-change"
            ? {
                ...currentRow,
                tc: arac.tc || "",
                surucu: arac.surucu || "",
                telefon: arac.telefon || "",
                faturaVkn: arac.vkn || "",
            }
            : {
                ...currentRow,
                cekici: arac.cekici || "",
                dorse: arac.dorse || "",
                tc: arac.tc || "",
                surucu: arac.surucu || "",
                telefon: arac.telefon || "",
                faturaVkn: arac.vkn || "",
            };

    const kontrolEdilecekAlanlar =
        secimTipi === "driver-change"
            ? ["tc", "surucu", "telefon", "faturaVkn"]
            : ["cekici", "dorse", "tc", "surucu", "telefon", "faturaVkn"];

    const changedFields = kontrolEdilecekAlanlar.filter(
        (field) =>
            normalizeCompare(currentRow[field]) !== normalizeCompare(updatedRow[field])
    );

    if (changedFields.length === 0) {
        setAracPanelRow(null);
        return;
    }

    const { error } = await supabase
        .from("aktif_seferler")
        .update(mapUiToDb(updatedRow))
        .eq("id", updatedRow.id);

    if (error) {
        alert(`Araç bilgileri güncellenemedi: ${error.message}`);
        return;
    }

    setRows(rows.map((row) => (row.id === updatedRow.id ? updatedRow : row)));

    rowsRef.current = rowsRef.current.map((row) =>
        row.id === updatedRow.id ? updatedRow : row
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

    if (secimTipi === "driver-change" && selection?.scope === "permanent") {
        const eskiSofor = {
            tc: currentRow.tc || "",
            surucu: currentRow.surucu || "",
            telefon: currentRow.telefon || "",
            vkn: currentRow.faturaVkn || "",
        };

        const { error: mevcutAracError } = await supabase
            .from("araclar")
            .update({
                tc: arac.tc || "",
                surucu: arac.surucu || "",
                telefon: arac.telefon || "",
                vkn: arac.vkn || "",
            })
            .eq("cekici", currentRow.cekici)
            .eq("dorse", currentRow.dorse);

        if (mevcutAracError) {
            alert(`Mevcut araç güncellenemedi: ${mevcutAracError.message}`);
            return;
        }

        const { error: secilenAracError } = await supabase
            .from("araclar")
            .update({
                tc: eskiSofor.tc,
                surucu: eskiSofor.surucu,
                telefon: eskiSofor.telefon,
                vkn: eskiSofor.vkn,
            })
            .eq("id", arac.id);

        if (secilenAracError) {
            alert(`Seçilen araç güncellenemedi: ${secilenAracError.message}`);
            return;
        }

        setAraclar?.((prev) =>
            prev.map((item) => {
                if (item.cekici === currentRow.cekici && item.dorse === currentRow.dorse) {
                    return {
                        ...item,
                        tc: arac.tc || "",
                        surucu: arac.surucu || "",
                        telefon: arac.telefon || "",
                        vkn: arac.vkn || "",
                    };
                }

                if (item.id === arac.id) {
                    return {
                        ...item,
                        tc: eskiSofor.tc,
                        surucu: eskiSofor.surucu,
                        telefon: eskiSofor.telefon,
                        vkn: eskiSofor.vkn,
                    };
                }

                return item;
            })
        );

        await fetchAraclar?.();
    }

    setChangedCells((prev) => {
        const next = {
            ...prev,
            [String(updatedRow.id)]: {
                ...(prev[String(updatedRow.id)] || {}),
            },
        };

        changedFields.forEach((field) => {
            next[String(updatedRow.id)][field] = true;
        });

        return next;
    });

    await fetchChangeLogs();

    setAracPanelRow(null);
    askCompletionIfReady(updatedRow);
}