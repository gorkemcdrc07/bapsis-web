import { supabase } from "../../../lib/supabaseClient";
import { getColumnLabel, mapUiToDb, normalizeCompare } from "./helpers";

export async function plakaAtamayaAracSec({
    arac,
    selection,
    aracPanelRow,
    rows,
    rowsRef,
    setRows,
    setAracPanelRow,
    saveChangeLogs,
    fetchAraclar,
    setAraclar,
    showToast,
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
                vkn: arac.vkn || "",
                aracDurumu: "Plaka Atandý",
            }
            : {
                ...currentRow,
                cekici: arac.cekici || "",
                dorse: arac.dorse || "",
                tc: arac.tc || "",
                surucu: arac.surucu || "",
                telefon: arac.telefon || "",
                faturaVkn: arac.vkn || "",
                vkn: arac.vkn || "",
                aracDurumu: "Plaka Atandý",
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
        showToast?.(`Araç bilgileri güncellenemedi: ${error.message}`, "error");
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
        secimTipi === "driver-change" ? "Þoför Deðiþtirme" : "Araç Deðiþtirme"
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
            showToast?.(`Mevcut araç güncellenemedi: ${mevcutAracError.message}`, "error");
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
            showToast?.(`Seçilen araç güncellenemedi: ${secilenAracError.message}`, "error");
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

    setAracPanelRow(null);
    showToast?.("Araç bilgileri aktarýldý.");
}