export function renderPlakaAtamaHucre({
    row,
    rowIndex,
    column,
    editingStartValuesRef,
    updateCell,
    saveCellOnBlur,
    options,
    setAracPanelRow,
    toggleActionMenu,
    cellLogs,
}) {
    function formatDate(value) {
        if (!value) return "-";

        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "-";

        return date.toLocaleString("tr-TR");
    }

    function withChangeHistory(cellContent) {
        const alan = column.label || column.title || column.key;
        const logs = cellLogs?.[`${row.id}_${alan}`] || [];

        if (!logs.length) {
            return cellContent;
        }

        return (
            <div className="change-cell-wrap">
                {cellContent}

                <div className="change-popup">
                    <div className="change-popup-head">
                        <span>Değişiklik Geçmişi</span>
                        <b>{logs.length}</b>
                    </div>

                    <div className="change-popup-list">
                        {logs.map((log) => (
                            <div key={log.id} className="change-popup-item">
                                <div className="change-popup-meta">
                                    <strong>{log.kullanici_adi || "Bilinmeyen"}</strong>
                                    <small>{log.islem_tipi || "Güncelleme"}</small>
                                </div>

                                <div className="change-popup-values">
                                    <span>{log.eski_deger || "-"}</span>
                                    <em>→</em>
                                    <span>{log.yeni_deger || "-"}</span>
                                </div>

                                <div className="change-popup-date">
                                    {formatDate(log.created_at)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (column.key === "actions") {
        return (
            <button
                type="button"
                className="dpa-action-menu-btn"
                onClick={(event) => toggleActionMenu(event, row)}
            >
                ⋯
            </button>
        );
    }

    if (column.key === "id") {
        return withChangeHistory(
            <span className="id-cell">#{row.id}</span>
        );
    }

    if (column.key === "cekici") {
        return withChangeHistory(
            <button
                type="button"
                className={row.cekici ? "table-vehicle-btn selected" : "table-vehicle-btn"}
                onClick={() => setAracPanelRow(row)}
            >
                {row.cekici || "Çekici seç"}
            </button>
        );
    }

    if (column.key === "telefon") {
        const cleanPhone = String(row.telefon || "").replace(/\D/g, "");

        return withChangeHistory(
            <div className="phone-cell">
                <input
                    className="table-edit-input"
                    value={row.telefon || ""}
                    onFocus={() => {
                        editingStartValuesRef.current[`${row.id}_telefon`] =
                            row.telefon ?? "";
                    }}
                    onChange={(e) => updateCell(rowIndex, "telefon", e.target.value)}
                    onBlur={(e) => saveCellOnBlur(row.id, "telefon", e.target.value)}
                />

                <a
                    className={cleanPhone ? "phone-call-btn" : "phone-call-btn disabled"}
                    href={cleanPhone ? `tel:${cleanPhone}` : undefined}
                    onClick={(e) => {
                        if (!cleanPhone) e.preventDefault();
                    }}
                >
                    📞
                </a>
            </div>
        );
    }

    if (column.editable === "select") {
        const list = options[column.key] || [];
        const value = row[column.key] || "";

        return withChangeHistory(
            <select
                className="table-select"
                value={value}
                onFocus={() => {
                    editingStartValuesRef.current[`${row.id}_${column.key}`] =
                        row[column.key] ?? "";
                }}
                onChange={(e) => {
                    updateCell(rowIndex, column.key, e.target.value);
                    saveCellOnBlur(row.id, column.key, e.target.value);
                }}
            >
                <option value="">Seçiniz</option>
                {value && !list.includes(value) && (
                    <option value={value}>{value}</option>
                )}
                {list.map((item) => (
                    <option key={item} value={item}>
                        {item}
                    </option>
                ))}
            </select>
        );
    }

    return withChangeHistory(
        <input
            className="table-edit-input"
            type={column.editable === "date" ? "date" : "text"}
            value={row[column.key] || ""}
            onFocus={() => {
                editingStartValuesRef.current[`${row.id}_${column.key}`] =
                    row[column.key] ?? "";
            }}
            onChange={(e) => updateCell(rowIndex, column.key, e.target.value)}
            onBlur={(e) => saveCellOnBlur(row.id, column.key, e.target.value)}
        />
    );
}