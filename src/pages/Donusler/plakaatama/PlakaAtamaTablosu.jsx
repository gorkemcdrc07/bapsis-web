export default function PlakaAtamaTablosu({
    loading,
    visibleColumns = [],
    filteredRows = [],
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
    const hasMapPermission = typeof openMapForRow === "function";

    return (
        <div className="dpa-table-wrap premium">
            <table className="dpa-table premium-table">
                <thead>
                    <tr>
                        {visibleColumns.map((column) => (
                            <th
                                key={column.key}
                                className={[
                                    column.key === "actions" ? "dpa-action-col" : "",
                                    draggingColumnKey === column.key ? "dpa-column-dragging" : "",
                                    dropTargetColumnKey === column.key ? "dpa-column-drop-target" : "",
                                ].filter(Boolean).join(" ")}
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
                        <tr key={row.id} className="dpa-premium-row">
                            {visibleColumns.map((column) => {
                                if (column.key === "actions") {
                                    return (
                                        <td key={column.key} className="dpa-action-col">
                                            <div className="dpa-row-actions">
                                                {hasMapPermission && (
                                                    <>
                                                        <button
                                                            type="button"
                                                            className="dpa-map-btn modern-map"
                                                            onClick={(event) => {
                                                                event.stopPropagation();
                                                                openMapForRow(row);
                                                            }}
                                                        >
                                                            <span className="dpa-map-dot">⌖</span>
                                                            Harita
                                                        </button>

                                                        <span className="dpa-action-divider" />
                                                    </>
                                                )}

                                                {renderCell?.(row, rowIndex, column)}
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
                                        {renderCell?.(row, rowIndex, column)}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}

                    {!loading && filteredRows.length === 0 && (
                        <tr>
                            <td className="dpa-empty modern-empty" colSpan={visibleColumns.length || 1}>
                                <div className="dpa-empty-card">
                                    <div className="dpa-empty-icon">□</div>
                                    <strong>Kayıt bulunamadı</strong>
                                    <span>Arama veya filtre kriterlerine uygun kayıt yok.</span>
                                </div>
                            </td>
                        </tr>
                    )}

                    {loading && (
                        <tr>
                            <td className="dpa-empty modern-empty" colSpan={visibleColumns.length || 1}>
                                <div className="dpa-loading-card">
                                    <div className="dpa-loader" />
                                    <strong>Yükleniyor...</strong>
                                    <span>Lütfen bekleyin, veriler hazırlanıyor.</span>
                                </div>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}