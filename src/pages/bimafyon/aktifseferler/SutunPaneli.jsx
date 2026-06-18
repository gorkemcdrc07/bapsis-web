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

    const acikSutunSayisi = Math.max(visibleColumns.length - 1, 0);
    const toplamSutunSayisi = filteredColumnList.length;

    return (
        <div className="column-panel-v2" onClick={(e) => e.stopPropagation()}>
            <div className="column-panel-top-v2">
                <div>
                    <strong>Sütun görünürlüğü</strong>
                    <span>
                        {acikSutunSayisi} sütun açık / {toplamSutunSayisi} sütun
                    </span>
                </div>

                <div className="column-panel-badge-v2">
                    {acikSutunSayisi}
                </div>
            </div>

            <input
                className="column-search-v2"
                value={columnSearch}
                onChange={(e) => setColumnSearch(e.target.value)}
                placeholder="Sütun ara..."
            />

            <div className="column-grid-v2">
                {filteredColumnList.map((column) => {
                    const visible = !hiddenColumns.includes(column.key);

                    return (
                        <button
                            type="button"
                            key={column.key}
                            className={
                                visible
                                    ? "column-card-v2 active"
                                    : "column-card-v2"
                            }
                            onClick={() => toggleColumn(column.key)}
                        >
                            <span className="column-dot-v2" />

                            <span className="column-label-v2">
                                {column.label}
                            </span>

                            <small>
                                {visible ? "Açık" : "Gizli"}
                            </small>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}