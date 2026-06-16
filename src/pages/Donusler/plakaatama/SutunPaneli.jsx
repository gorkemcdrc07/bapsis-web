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
        <div className="dpa-column-panel" onClick={(e) => e.stopPropagation()}>
            <div className="dpa-column-panel-head">
                <div>
                    <strong>Sütun görünürlüğü</strong>
                    <span>{visibleColumns.length - 1} sütun açık</span>
                </div>

                <small>
                    {hiddenColumns.length} gizli
                </small>
            </div>

            <input
                className="dpa-column-search"
                value={columnSearch}
                onChange={(e) => setColumnSearch(e.target.value)}
                placeholder="Sütun ara..."
            />

            <div className="dpa-column-chip-grid">
                {filteredColumnList.map((column) => {
                    const visible = !hiddenColumns.includes(column.key);

                    return (
                        <button
                            type="button"
                            key={column.key}
                            className={
                                visible
                                    ? "dpa-column-chip visible"
                                    : "dpa-column-chip hidden"
                            }
                            onClick={() => toggleColumn(column.key)}
                        >
                            <span className="dpa-column-dot" />
                            <span>{column.label}</span>
                            <small>{visible ? "Açık" : "Gizli"}</small>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
