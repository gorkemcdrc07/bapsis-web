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
        <>
            <div className="dpa-column-drawer-backdrop" />

            <aside className="dpa-column-drawer" onClick={(e) => e.stopPropagation()}>
                <div className="dpa-column-drawer-head">
                    <div>
                        <strong>Sütun Ayarları</strong>
                        <span>Görünen sütunları düzenleyin.</span>
                    </div>

                    <div className="dpa-drawer-count">
                        {visibleColumns.length - 1} açık
                    </div>
                </div>

                <div className="dpa-drawer-search-wrap">
                    <input
                        className="dpa-column-search drawer"
                        value={columnSearch}
                        onChange={(e) => setColumnSearch(e.target.value)}
                        placeholder="Sütun ara..."
                    />
                    <span>⌕</span>
                </div>

                <div className="dpa-column-drawer-section-title">
                    Sütunlar
                    <small>{hiddenColumns.length} gizli</small>
                </div>

                <div className="dpa-column-drawer-list">
                    {filteredColumnList.map((column) => {
                        const visible = !hiddenColumns.includes(column.key);

                        return (
                            <button
                                type="button"
                                key={column.key}
                                className={visible ? "dpa-drawer-column visible" : "dpa-drawer-column hidden"}
                                onClick={() => toggleColumn(column.key)}
                            >
                                <span className="dpa-drag-mark">⋮⋮</span>
                                <span className="dpa-drawer-column-name">{column.label}</span>
                                <span className={visible ? "dpa-check on" : "dpa-check"}>
                                    {visible ? "✓" : ""}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </aside>
        </>
    );
}