import { supabase } from "../../../lib/supabaseClient";

export async function aktifSeferTamamla({
    row,
    saveCompletedTripArchive,
    saveChangeLogs,
    setCompletePromptRow,
    setCompleteDetailRow,
    setRows,
    fetchChangeLogs,
    fetchAktifSeferler,
    silent = false,
    refetch = true,
}) {
    const archived = await saveCompletedTripArchive(
        row,
        "Tüm zorunlu bilgiler dolduruldu"
    );

    if (!archived) return { success: false, error: "Arşiv kaydı oluşturulamadı." };

    await saveChangeLogs(
        row.id,
        [
            {
                field: "kayit",
                label: "Kayıt",
                oldValue: `Sefer No: ${row.seferNo || "-"} / Çekici: ${row.cekici || "-"}`,
                newValue: "Sefer tamamlandı ve tamamlanan seferlere aktarıldı",
            },
        ],
        "Sefer Tamamlama"
    );

    const { error } = await supabase
        .from("aktif_seferler")
        .delete()
        .eq("id", row.id);

    if (error) {
        if (!silent) alert(`Sefer aktif tablodan silinemedi: ${error.message}`);
        return { success: false, error: error.message };
    }

    setCompletePromptRow?.(null);
    setCompleteDetailRow?.(null);

    setRows((prev) => prev.filter((item) => item.id !== row.id));

    if (refetch) {
        await fetchChangeLogs?.();
        await fetchAktifSeferler?.();
    }

    return { success: true };
}