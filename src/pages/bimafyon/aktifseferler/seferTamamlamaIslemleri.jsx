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
}) {
    const archived = await saveCompletedTripArchive(
        row,
        "Tüm zorunlu bilgiler dolduruldu"
    );

    if (!archived) return;

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
        alert(`Sefer aktif tablodan silinemedi: ${error.message}`);
        return;
    }

    setCompletePromptRow(null);
    setCompleteDetailRow(null);
    setRows((prev) => prev.filter((item) => item.id !== row.id));

    await fetchChangeLogs();
    await fetchAktifSeferler();
}