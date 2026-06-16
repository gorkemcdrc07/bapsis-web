export function aktifSeferleriFiltrele(rows, search) {
    return rows.filter((row) =>
        Object.values(row).join(" ").toLowerCase().includes(search.toLowerCase())
    );
}

export function sutunlariFiltrele(hideableColumns, columnSearch) {
    const value = columnSearch.toLowerCase().trim();

    if (!value) return hideableColumns;

    return hideableColumns.filter((column) =>
        `${column.label} ${column.key}`.toLowerCase().includes(value)
    );
}