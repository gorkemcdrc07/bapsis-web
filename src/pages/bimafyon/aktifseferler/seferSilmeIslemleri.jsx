import { supabase } from "../../../lib/supabaseClient";

export async function aktifSeferSil({
    row,
    saveDeletedTripArchive,
    saveChangeLogs,
    setRows,
    fetchChangeLogs,
}) {
    if (!confirm("Bu sefer silinsin mi?")) return;

    const archived = await saveDeletedTripArchive(row, "Manuel silindi");
    if (!archived) return;

    await saveChangeLogs(
        row.id,
        [
            {
                field: "kayit",
                label: "Kayıt",
                oldValue: `Sefer No: ${row.seferNo || "-"} / Çekici: ${row.cekici || "-"}`,
                newValue: "Kayıt silindi",
            },
        ],
        "Silme"
    );

    const { error } = await supabase
        .from("aktif_seferler")
        .delete()
        .eq("id", row.id);

    if (error) {
        alert(`Sefer silinemedi: ${error.message}`);
        return;
    }

    setRows((prev) => prev.filter((item) => item.id !== row.id));
    await fetchChangeLogs();
}

export async function eksikAktifSeferleriSil({
    rowsToDelete,
    saveDeletedTripArchive,
    saveChangeLogs,
    setDeletedTripPrompt,
    fetchChangeLogs,
    fetchAktifSeferler,
}) {
    if (!rowsToDelete?.length) return;

    for (const row of rowsToDelete) {
        await saveChangeLogs(
            row.id,
            [
                {
                    field: "kayit",
                    label: "Kayıt",
                    oldValue: `Sefer No: ${row.seferNo || "-"} / Çekici: ${row.cekici || "-"}`,
                    newValue: "Excel listesinde olmadığı için silindi",
                },
            ],
            "Excel Silme"
        );

        const archived = await saveDeletedTripArchive(
            row,
            "Excel listesinde olmadığı için silindi"
        );

        if (!archived) return;

        const { error } = await supabase
            .from("aktif_seferler")
            .delete()
            .eq("id", row.id);

        if (error) {
            alert(`ID ${row.id} silinemedi: ${error.message}`);
            return;
        }
    }

    setDeletedTripPrompt(null);
    await fetchChangeLogs();
    await fetchAktifSeferler();
}