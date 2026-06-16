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

    // 🆕 EKLİ
    onRowClick,
}) {
    return (
        <div className="active-table-wrapper" onScroll={closeActionMenu}>
            <table className="active-table">

                {/* ================= HEADER ================= */}
                <thead>
                    <tr>
                        {visibleColumns.map((column) => (
                            <th
                                key={column.key}
                                style={{
                                    width: column.width,
                                    minWidth: column.width,
                                    maxWidth: column.width,
                                }}
                                draggable={!column.fixed}
                                className={[
                                    draggingColumnKey === column.key ? "column-dragging" : "",
                                    dropTargetColumnKey === column.key ? "column-drop-target" : "",
                                ].filter(Boolean).join(" ")}
                                onDragStart={(event) => onDragStart(event, column.key)}
                                onDragOver={(event) => onDragOverColumn(event, column.key)}
                                onDragLeave={() => setDropTargetColumnKey(null)}
                                onDragEnd={onColumnDragEnd}
                                onDrop={(event) => onDropColumn(event, column.key)}
                            >
                                <div className="th-content">
                                    <span>{column.label}</span>
                                    {!column.fixed && (
                                        <span className="drag-hint">⋮⋮</span>
                                    )}
                                </div>

                                <span
                                    className="resize-handle"
                                    onMouseDown={(event) => startResize(event, column.key)}
                                />
                            </th>
                        ))}
                    </tr>
                </thead>

                {/* ================= BODY ================= */}
                <tbody>
                    {filteredRows.map((row, rowIndex) => (
                        <tr
                            key={row.id}
                            className={row.freshlianceAlarm ? "temp-danger" : ""}
                            style={{ cursor: "default" }}
                        >
                            {visibleColumns.map((column) => {
                                const isChanged =
                                    changedCells[String(row.id)]?.[column.key];

                                const logKey = `${row.id}_${getColumnLabel(column.key)}`;
                                const logs = cellLogs[logKey] || [];
                                const hasLog = logs.length > 0;

                                /* 🟢 DETAY BUTONU SADECE ACTIONS COLUMN */
                                if (column.key === "actions") {
                                    return (
                                        <td key={column.key} style={{ overflow: "visible" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>

                                                {/* 🔵 HARİTA / DETAY BUTONU */}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onRowClick?.(row);
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
                                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                                                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                                                        <circle cx="12" cy="9" r="2.5" />
                                                    </svg>
                                                    Harita
                                                </button>

                                                {/* AYRAÇ */}
                                                <div style={{ width: "0.5px", height: 18, background: "#e5e7eb", margin: "0 2px" }} />

                                                {/* ⋯ ÜÇ NOKTA — ESKİ renderCell ÇIKTI BURAYA */}
                                                {renderCell(row, rowIndex, column)}
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
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            const popup =
                                                e.currentTarget.querySelector(".change-popup");
                                            if (!popup) return;

                                            const popupWidth = 310;
                                            const popupHeight = 340;
                                            const margin = 12;

                                            const left = Math.min(
                                                Math.max(
                                                    rect.left + rect.width / 2 - popupWidth / 2,
                                                    margin
                                                ),
                                                window.innerWidth - popupWidth - margin
                                            );

                                            const top =
                                                rect.top > popupHeight + margin
                                                    ? rect.top - popupHeight - 10
                                                    : rect.bottom + 10;

                                            popup.style.left = `${left}px`;
                                            popup.style.top = `${top}px`;
                                        }}
                                    >
                                        {renderCell(row, rowIndex, column)}

                                        {/* 🔴 LOG POPUP (AYNEN KALIR) */}
                                        {hasLog && (
                                            <div className="change-popup">
                                                <div className="change-popup-head">
                                                    <span>Değişiklik Geçmişi</span>
                                                    <b>{logs.length}</b>
                                                </div>

                                                <div className="change-popup-list">
                                                    {logs.slice(0, 5).map((log) => (
                                                        <div className="change-popup-item" key={log.id}>
                                                            <div className="change-popup-meta">
                                                                <strong>{log.kullanici_adi || "Bilinmeyen"}</strong>
                                                                <small>{log.islem_tipi || "Güncelleme"}</small>
                                                            </div>

                                                            <div className="change-popup-values">
                                                                <span>{log.eski_deger || "—"}</span>
                                                                <em>→</em>
                                                                <span>{log.yeni_deger || "—"}</span>
                                                            </div>

                                                            <div className="change-popup-date">
                                                                {log.created_at
                                                                    ? new Date(log.created_at).toLocaleString("tr-TR")
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
                    ))}

                    {!loading && filteredRows.length === 0 && (
                        <tr>
                            <td colSpan={visibleColumns.length}>
                                Kayıt bulunamadı.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}