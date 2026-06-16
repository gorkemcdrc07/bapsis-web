export async function plakaAtamaSeferSil({
    row,
    plakaAtamaKaydiSil,
    saveChangeLogs,
    setRows,
    showToast,
    closeActionMenu,
}) {
    if (!confirm("Bu sefer silinsin mi?")) return;

    await saveChangeLogs(
        row.id,
        [
            {
                field: "kayit",
                label: "Kayýt",
                oldValue: `Sefer No: ${row.seferNo || "-"} / Çekici: ${row.cekici || "-"}`,
                newValue: "Kayýt silindi",
            },
        ],
        "Silme"
    );

    const error = await plakaAtamaKaydiSil(row.id);

    if (error) {
        showToast(`Sefer silinemedi: ${error.message}`, "error");
        return;
    }

    setRows((prev) => prev.filter((item) => item.id !== row.id));
    closeActionMenu?.();
    showToast("Sefer silindi.");
}

export async function eksikPlakaAtamaSeferleriSil({
    rowsToDelete,
    plakaAtamaKaydiSil,
    saveChangeLogs,
    setDeletedTripPrompt,
    fetchRows,
    showToast,
}) {
    if (!rowsToDelete?.length) return;

    for (const row of rowsToDelete) {
        await saveChangeLogs(
            row.id,
            [
                {
                    field: "kayit",
                    label: "Kayýt",
                    oldValue: `Sefer No: ${row.seferNo || "-"} / Çekici: ${row.cekici || "-"}`,
                    newValue: "Excel listesinde olmadýðý için silindi",
                },
            ],
            "Excel Silme"
        );

        const error = await plakaAtamaKaydiSil(row.id);

        if (error) {
            showToast(`ID ${row.id} silinemedi: ${error.message}`, "error");
            return;
        }
    }

    setDeletedTripPrompt(null);
    await fetchRows();
    showToast("Excel’de olmayan seferler silindi.");
}