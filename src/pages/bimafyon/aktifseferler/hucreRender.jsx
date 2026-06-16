export function renderAktifSeferHucre({
    row,
    rowIndex,
    column,
    openActionRowId,
    toggleActionMenu,
    setAracPanelRow,
    editingStartValuesRef,
    updateCell,
    saveCellOnBlur,
    options,
}) {
    if (column.key === "actions") {
        return (
            <button
                className={openActionRowId === row.id ? "action-more active" : "action-more"}
                onClick={(event) => toggleActionMenu(event, row)}
            >
                ⋮
            </button>
        );
    }

    if (column.key === "id") {
        return <span className="id-cell">#{row.id}</span>;
    }

    if (column.key === "cekici") {
        return (
            <button className="table-select" onClick={() => setAracPanelRow(row)}>
                {row.cekici || "Çekici seç"}
            </button>
        );
    }

    if (column.key === "telefon") {
        const cleanPhone = String(row.telefon || "").replace(/\D/g, "");

        return (
            <div className="phone-cell">
                <input
                    className="table-edit-input"
                    value={row.telefon || ""}
                    onFocus={() => {
                        editingStartValuesRef.current[`${row.id}_telefon`] = row.telefon ?? "";
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

        return (
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
                {value && !list.includes(value) && <option value={value}>{value}</option>}
                {list.map((item) => (
                    <option key={item} value={item}>
                        {item}
                    </option>
                ))}
            </select>
        );
    }

    return (
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