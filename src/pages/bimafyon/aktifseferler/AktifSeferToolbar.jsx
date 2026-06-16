export default function AktifSeferToolbar({
    loading,
    filteredRows,
    rows,
    search,
    setSearch,
    exportExcel,
    fileInputRef,
    excelImporting,
    setShowIrsaliyePanel,
    showColumnPanel,
    setShowColumnPanel,
    visibleColumns,
}) {
    return (
        <div className="active-table-header">
            <div className="active-title-group">
                <span className="count-pill">
                    {filteredRows.length}/{rows.length} sefer
                </span>
                <strong>{loading ? "Yükleniyor..." : "Aktif sefer listesi"}</strong>
            </div>

            <div className="toolbar">
                <input
                    className="search-input"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Sefer, plaka, sürücü ara..."
                />

                <button className="toolbar-btn export" onClick={exportExcel}>
                    Excel’e Aktar
                </button>

                <button
                    className="toolbar-btn import"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={excelImporting}
                >
                    {excelImporting ? "Alınıyor..." : "Excel Al"}
                </button>

                <button
                    className="toolbar-btn irsaliye"
                    onClick={() => setShowIrsaliyePanel(true)}
                >
                    İrsaliye Okut
                </button>

                <button
                    className={showColumnPanel ? "toolbar-btn active" : "toolbar-btn"}
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowColumnPanel(!showColumnPanel);
                    }}
                >
                    Sütunlar
                    <span className="toolbar-count">{visibleColumns.length - 1}</span>
                </button>
            </div>
        </div>
    );
}