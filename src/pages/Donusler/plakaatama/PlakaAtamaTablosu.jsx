export default function PlakaAtamaTablosu({
    loading,
    visibleColumns,
    filteredRows,
    renderCell,
    openMapForRow,

    draggingColumnKey,
    dropTargetColumnKey,
    setDropTargetColumnKey,
    onDragStart,
    onDragOverColumn,
    onColumnDragEnd,
    onDropColumn,
    startResize,
}) {
    return (
        <div className="dpa-table-wrap">
            <table className="dpa-table">
                <thead>
                    <tr>
                        {visibleColumns.map((column) => (
                            <th
                                key={column.key}
                                className={[
                                    column.key === "actions" ? "dpa-action-col" : "",
                                    draggingColumnKey === column.key ? "dpa-column-dragging" : "",
                                    dropTargetColumnKey === column.key ? "dpa-column-drop-target" : "",
                                ]
                                    .filter(Boolean)
                                    .join(" ")}
                                style={{
                                    width: column.width,
                                    minWidth: column.width,
                                    maxWidth: column.width,
                                }}
                                draggable={!column.fixed}
                                onDragStart={(event) => onDragStart?.(event, column.key)}
                                onDragOver={(event) => onDragOverColumn?.(event, column.key)}
                                onDragLeave={() => setDropTargetColumnKey?.(null)}
                                onDragEnd={onColumnDragEnd}
                                onDrop={(event) => onDropColumn?.(event, column.key)}
                            >
                                <div className="dpa-th-inner">
                                    <span>{column.label}</span>
                                    {!column.fixed && <b>⋮⋮</b>}
                                </div>

                                {!column.fixed && (
                                    <span
                                        className="dpa-resize-handle"
                                        onMouseDown={(event) => startResize?.(event, column.key)}
                                    />
                                )}
                            </th>
                        ))}
                    </tr>
                </thead>

                <tbody>
                    {filteredRows.map((row, rowIndex) => (
                        <tr key={row.id}>
                            {visibleColumns.map((column) => {
                                if (column.key === "actions") {
                                    return (
                                        <td
                                            key={column.key}
                                            className="dpa-action-col"
                                            style={{ overflow: "visible" }}
                                        >
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 6,
                                                }}
                                            >
                                                <button
                                                    type="button"
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        openMapForRow?.(row);
                                                    }}
                                                    style={{
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        gap: 5,
                                                        height: 28,
                                                        padding: "0 10px",
                                                        borderRadius: 8,
                                                        border: "0.5px solid #bfdbfe",
                                                        background: "#eff6ff",
                                                        color: "#1d4ed8",
                                                        fontSize: 11,
                                                        fontWeight: 600,
                                                        cursor: "pointer",
                                                        whiteSpace: "nowrap",
                                                    }}
                                                >
                                                    <svg
                                                        width="13"
                                                        height="13"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="2"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                    >
                                                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                                                        <circle cx="12" cy="9" r="2.5" />
                                                    </svg>
                                                    Harita
                                                </button>

                                                <div
                                                    style={{
                                                        width: "0.5px",
                                                        height: 18,
                                                        background: "#e5e7eb",
                                                        margin: "0 2px",
                                                    }}
                                                />

                                                {renderCell(row, rowIndex, column)}
                                            </div>
                                        </td>
                                    );
                                }

                                return (
                                    <td
                                        key={column.key}
                                        style={{
                                            width: column.width,
                                            minWidth: column.width,
                                            maxWidth: column.width,
                                        }}
                                    >
                                        {renderCell(row, rowIndex, column)}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}

                    {!loading && filteredRows.length === 0 && (
                        <tr>
                            <td className="dpa-empty" colSpan={visibleColumns.length}>
                                Kayıt bulunamadı.
                            </td>
                        </tr>
                    )}

                    {loading && (
                        <tr>
                            <td className="dpa-empty" colSpan={visibleColumns.length}>
                                Yükleniyor...
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}