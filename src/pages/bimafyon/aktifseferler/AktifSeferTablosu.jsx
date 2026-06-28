import { getColumnLabel } from "./helpers";

export default function AktifSeferTablosu({
    loading,
    visibleColumns,
    filteredRows,
    changedCells,
    cellLogs,
    draggingColumnKey,
    dropTargetColumnKey,
    setDropTargetColumnKey,
    onDragStart,
    onDragOverColumn,
    onColumnDragEnd,
    onDropColumn,
    startResize,
    renderCell,
    closeActionMenu,
    onRowClick,

    selectedRowIds = [],
    onToggleRowSelection,
    allFilteredSelected = false,
    onToggleAllFilteredRows,

    isColumnHideDropActive = false,
    setIsColumnHideDropActive,
    onHideColumnByDrop,
}) {
    function handleColumnDragStart(event, column) {
        if (column.fixed || column.key === "actions") {
            event.preventDefault();
            return;
        }

        event.stopPropagation();

        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("columnKey", column.key);
        event.dataTransfer.setData("text/plain", column.key);

        setIsColumnHideDropActive?.(true);
        onDragStart?.(event, column.key);
    }

    function handleColumnDragOver(event, column) {
        if (column.fixed || column.key === "actions") return;

        event.preventDefault();
        event.stopPropagation();

        event.dataTransfer.dropEffect = "move";
        onDragOverColumn?.(event, column.key);
    }

    function handleColumnDrop(event, column) {
        if (column.fixed || column.key === "actions") {
            setDropTargetColumnKey?.(null);
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        onDropColumn?.(event, column.key);
        setIsColumnHideDropActive?.(false);
    }

    function handleColumnDragEnd() {
        setIsColumnHideDropActive?.(false);
        setDropTargetColumnKey?.(null);
        onColumnDragEnd?.();
    }

    return (
        <div className="active-table-zone">
            {isColumnHideDropActive && (
                <div
                    className="column-hide-dropzone"
                    onDragOver={(event) => {
                        event.preventDefault();
                        event.dataTransfer.dropEffect = "move";
                    }}
                    onDrop={(event) => {
                        event.preventDefault();
                        event.stopPropagation();

                        const columnKey =
                            event.dataTransfer.getData("columnKey") ||
                            event.dataTransfer.getData("text/plain");

                        if (columnKey) {
                            onHideColumnByDrop?.(columnKey);
                        }

                        setIsColumnHideDropActive?.(false);
                        setDropTargetColumnKey?.(null);
                    }}
                >
                    <div className="column-hide-dropzone-icon">🗑️</div>

                    <div>
                        <strong>Sütunu gizle</strong>
                        <span>Başlığı buraya bırakınca sütun gizlenir.</span>
                    </div>
                </div>
            )}

            <div className="active-table-wrapper" onScroll={closeActionMenu}>
                <table className="active-table">
                    <thead>
                        <tr>
                            <th className="selection-th">
                                <div className="selection-head">
                                    <label className="modern-check">
                                        <input
                                            type="checkbox"
                                            checked={allFilteredSelected}
                                            onChange={(e) =>
                                                onToggleAllFilteredRows?.(
                                                    e.target.checked
                                                )
                                            }
                                            disabled={filteredRows.length === 0}
                                        />
                                        <span />
                                    </label>

                                    <b>No</b>
                                </div>
                            </th>

                            {visibleColumns.map((column) => {
                                const canDrag =
                                    !column.fixed && column.key !== "actions";

                                return (
                                    <th
                                        key={column.key}
                                        style={{
                                            width: column.width,
                                            minWidth: column.width,
                                            maxWidth: column.width,
                                        }}
                                        draggable={false}
                                        className={[
                                            canDrag ? "draggable-column" : "",
                                            draggingColumnKey === column.key
                                                ? "column-dragging"
                                                : "",
                                            dropTargetColumnKey === column.key
                                                ? "column-drop-target"
                                                : "",
                                        ]
                                            .filter(Boolean)
                                            .join(" ")}
                                        onDragOver={(event) =>
                                            handleColumnDragOver(event, column)
                                        }
                                        onDragLeave={() =>
                                            setDropTargetColumnKey?.(null)
                                        }
                                        onDrop={(event) =>
                                            handleColumnDrop(event, column)
                                        }
                                    >
                                        <div className="th-content">
                                            <span>{column.label}</span>

                                            {canDrag && (
                                                <span
                                                    className="drag-hint"
                                                    draggable
                                                    title="Sürükle bırak ile yer değiştir veya gizle"
                                                    onDragStart={(event) =>
                                                        handleColumnDragStart(
                                                            event,
                                                            column
                                                        )
                                                    }
                                                    onDragEnd={
                                                        handleColumnDragEnd
                                                    }
                                                >
                                                    ⋮⋮
                                                </span>
                                            )}
                                        </div>

                                        <span
                                            className="resize-handle"
                                            onMouseDown={(event) =>
                                                startResize(event, column.key)
                                            }
                                        />
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>

                    <tbody>
                        {filteredRows.map((row, rowIndex) => {
                            const isSelected = selectedRowIds.includes(row.id);

                            return (
                                <tr
                                    key={row.id}
                                    className={[
                                        row.freshlianceAlarm
                                            ? "temp-danger"
                                            : "",
                                        isSelected ? "row-selected" : "",
                                    ]
                                        .filter(Boolean)
                                        .join(" ")}
                                    style={{ cursor: "default" }}
                                >
                                    <td className="selection-td">
                                        <div className="selection-cell">
                                            <label className="modern-check">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={(e) =>
                                                        onToggleRowSelection?.(
                                                            row.id,
                                                            e.target.checked
                                                        )
                                                    }
                                                />
                                                <span />
                                            </label>

                                            <strong>{rowIndex + 1}</strong>
                                        </div>
                                    </td>

                                    {visibleColumns.map((column) => {
                                        const isChanged =
                                            changedCells[String(row.id)]?.[
                                            column.key
                                            ];

                                        const logKey = `${row.id}_${getColumnLabel(
                                            column.key
                                        )}`;

                                        const logs = cellLogs[logKey] || [];
                                        const hasLog = logs.length > 0;

                                        if (column.key === "actions") {
                                            return (
                                                <td
                                                    key={column.key}
                                                    style={{
                                                        overflow: "visible",
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            alignItems:
                                                                "center",
                                                            gap: 6,
                                                        }}
                                                    >
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onRowClick?.(
                                                                    row
                                                                );
                                                            }}
                                                            style={{
                                                                display:
                                                                    "inline-flex",
                                                                alignItems:
                                                                    "center",
                                                                gap: 5,
                                                                height: 28,
                                                                padding:
                                                                    "0 10px",
                                                                borderRadius: 8,
                                                                border: "0.5px solid #bfdbfe",
                                                                background:
                                                                    "#eff6ff",
                                                                color: "#1d4ed8",
                                                                fontSize: 11,
                                                                fontWeight: 600,
                                                                cursor: "pointer",
                                                                whiteSpace:
                                                                    "nowrap",
                                                            }}
                                                        >
                                                            Harita
                                                        </button>

                                                        <div
                                                            style={{
                                                                width: "0.5px",
                                                                height: 18,
                                                                background:
                                                                    "#e5e7eb",
                                                                margin: "0 2px",
                                                            }}
                                                        />

                                                        {renderCell(
                                                            row,
                                                            rowIndex,
                                                            column
                                                        )}
                                                    </div>
                                                </td>
                                            );
                                        }

                                        return (
                                            <td
                                                key={column.key}
                                                className={
                                                    hasLog || isChanged
                                                        ? "excel-changed-cell change-cell-wrap"
                                                        : "change-cell-wrap"
                                                }
                                                style={{
                                                    width: column.width,
                                                    minWidth: column.width,
                                                    maxWidth: column.width,
                                                }}
                                                onMouseEnter={(e) => {
                                                    const rect =
                                                        e.currentTarget.getBoundingClientRect();

                                                    const popup =
                                                        e.currentTarget.querySelector(
                                                            ".change-popup"
                                                        );

                                                    if (!popup) return;

                                                    const popupWidth = 310;
                                                    const popupHeight = 340;
                                                    const margin = 12;

                                                    const left = Math.min(
                                                        Math.max(
                                                            rect.left +
                                                            rect.width / 2 -
                                                            popupWidth / 2,
                                                            margin
                                                        ),
                                                        window.innerWidth -
                                                        popupWidth -
                                                        margin
                                                    );

                                                    const top =
                                                        rect.top >
                                                            popupHeight + margin
                                                            ? rect.top -
                                                            popupHeight -
                                                            10
                                                            : rect.bottom + 10;

                                                    popup.style.left = `${left}px`;
                                                    popup.style.top = `${top}px`;
                                                }}
                                            >
                                                {renderCell(
                                                    row,
                                                    rowIndex,
                                                    column
                                                )}

                                                {hasLog && (
                                                    <div className="change-popup">
                                                        <div className="change-popup-head">
                                                            <span>
                                                                Değişiklik
                                                                Geçmişi
                                                            </span>
                                                            <b>
                                                                {logs.length}
                                                            </b>
                                                        </div>

                                                        <div className="change-popup-list">
                                                            {logs
                                                                .slice(0, 5)
                                                                .map((log) => (
                                                                    <div
                                                                        className="change-popup-item"
                                                                        key={
                                                                            log.id
                                                                        }
                                                                    >
                                                                        <div className="change-popup-meta">
                                                                            <strong>
                                                                                {log.kullanici_adi ||
                                                                                    "Bilinmeyen"}
                                                                            </strong>
                                                                            <small>
                                                                                {log.islem_tipi ||
                                                                                    "Güncelleme"}
                                                                            </small>
                                                                        </div>

                                                                        <div className="change-popup-values">
                                                                            <span>
                                                                                {log.eski_deger ||
                                                                                    "—"}
                                                                            </span>
                                                                            <em>
                                                                                →
                                                                            </em>
                                                                            <span>
                                                                                {log.yeni_deger ||
                                                                                    "—"}
                                                                            </span>
                                                                        </div>

                                                                        <div className="change-popup-date">
                                                                            {log.created_at
                                                                                ? new Date(
                                                                                    log.created_at
                                                                                ).toLocaleString(
                                                                                    "tr-TR"
                                                                                )
                                                                                : "—"}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}

                        {!loading && filteredRows.length === 0 && (
                            <tr>
                                <td colSpan={visibleColumns.length + 1}>
                                    Kayıt bulunamadı.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}