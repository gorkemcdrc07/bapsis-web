export default function SutunPaneli({
    showColumnPanel,
    visibleColumns,
    columnSearch,
    setColumnSearch,
    filteredColumnList,
    hiddenColumns,
    toggleColumn,
}) {
    if (!showColumnPanel) return null;

    return (
        <div className="column-panel-modern" onClick={(e) => e.stopPropagation()}>
            <div className="column-panel-top">
                <div>
                    <strong>Sütun görünürlüğü</strong>
                    <span>{visibleColumns.length - 1} sütun açık</span>
                </div>
            </div>

            <input
                className="column-search"
                value={columnSearch}
                onChange={(e) => setColumnSearch(e.target.value)}
                placeholder="Sütun ara..."
            />

            <div className="column-chip-grid">
                {filteredColumnList.map((column) => {
                    const visible = !hiddenColumns.includes(column.key);

                    return (
                        <button
                            type="button"
                            key={column.key}
                            className={visible ? "column-chip visible" : "column-chip hidden"}
                            onClick={() => toggleColumn(column.key)}
                        >
                            <span className="column-toggle-dot" />
                            <span>{column.label}</span>
                            <small>{visible ? "Açık" : "Gizli"}</small>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}