export function plakaAtamaFiltrele(rows, search, statusFilter) {
    const searchValue = String(search || "").toLocaleLowerCase("tr-TR").trim();

    return rows.filter((row) => {
        const matchesSearch =
            !searchValue ||
            Object.values(row)
                .join(" ")
                .toLocaleLowerCase("tr-TR")
                .includes(searchValue);

        const matchesStatus =
            statusFilter === "all" || row.aracDurumu === statusFilter;

        return matchesSearch && matchesStatus;
    });
}

export function sutunlariFiltrele(hideableColumns, columnSearch) {
    const value = String(columnSearch || "")
        .toLocaleLowerCase("tr-TR")
        .trim();

    if (!value) return hideableColumns;

    return hideableColumns.filter((column) =>
        `${column.label} ${column.key}`
            .toLocaleLowerCase("tr-TR")
            .includes(value)
    );
}