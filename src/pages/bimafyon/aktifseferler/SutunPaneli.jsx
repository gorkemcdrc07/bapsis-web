export default function SutunPaneli({
    showColumnPanel,
    visibleColumns,
    columnSearch,
    setColumnSearch,
    filteredColumnList,
    hiddenColumns,
    toggleColumn,

    viewName,
    setViewName,
    savedViews,
    activeViewId,
    setActiveViewId,
    saveCurrentView,
    applySavedView,
    deleteSavedView,
    resetColumnView,
}) {
    if (!showColumnPanel) return null;

    const acikSutunSayisi = Math.max(visibleColumns.length - 1, 0);
    const toplamSutunSayisi = filteredColumnList.length;

    return (
        <div className="column-panel-v2" onClick={(e) => e.stopPropagation()}>
            <div className="column-panel-top-v2">
                <div>
                    <strong>Sütun görünümü</strong>
                    <span>
                        {acikSutunSayisi} sütun açık / {toplamSutunSayisi} sütun
                    </span>
                </div>

                <div className="column-panel-badge-v2">
                    {acikSutunSayisi}
                </div>
            </div>

            <div className="column-view-manager">
                <div className="column-view-row">
                    <select
                        className="column-view-select"
                        value={activeViewId || ""}
                        onChange={(e) => {
                            const selectedId = e.target.value;
                            setActiveViewId(selectedId);

                            const selectedView = savedViews.find(
                                (view) => view.id === selectedId
                            );

                            if (selectedView) {
                                applySavedView(selectedView);
                            }
                        }}
                    >
                        <option value="">Kayıtlı görünüm seç</option>

                        {savedViews.map((view) => (
                            <option key={view.id} value={view.id}>
                                {view.name}
                            </option>
                        ))}
                    </select>

                    <button
                        type="button"
                        className="column-view-danger"
                        disabled={!activeViewId}
                        onClick={deleteSavedView}
                    >
                        Sil
                    </button>
                </div>

                <div className="column-view-row">
                    <input
                        className="column-view-input"
                        value={viewName}
                        onChange={(e) => setViewName(e.target.value)}
                        placeholder="Görünüm adı yaz..."
                    />

                    <button
                        type="button"
                        className="column-view-save"
                        onClick={saveCurrentView}
                    >
                        Görünümü Kaydet
                    </button>

                    <button
                        type="button"
                        className="column-view-reset"
                        onClick={resetColumnView}
                    >
                        Sıfırla
                    </button>
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

                            <small>{visible ? "Açık" : "Gizli"}</small>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}