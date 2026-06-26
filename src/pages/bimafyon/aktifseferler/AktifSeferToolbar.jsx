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

    selectedCount = 0,
    bulkCompleting = false,
    onBulkComplete,
    resetColumnView,
}) {
    return (
        <div className="active-table-header">
            <div className="active-title-group">
                <span className="count-pill">
                    {filteredRows.length}/{rows.length} sefer
                </span>

                <strong>{loading ? "Yükleniyor..." : "Aktif sefer listesi"}</strong>

                {selectedCount > 0 && (
                    <span className="selected-count-pill">
                        {selectedCount} seçili
                    </span>
                )}
            </div>

            <div className="toolbar">
                <input
                    className="search-input"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Sefer, plaka, sürücü ara..."
                />

                <button
                    className="toolbar-btn bulk-complete"
                    onClick={onBulkComplete}
                    disabled={selectedCount === 0 || bulkCompleting}
                >
                    {bulkCompleting ? "Tamamlanıyor..." : "Seçilenleri Tamamla"}
                    {selectedCount > 0 && (
                        <span className="toolbar-count">{selectedCount}</span>
                    )}
                </button>

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
                    className={showColumnPanel ? "toolbar-btn view-btn active" : "toolbar-btn view-btn"}
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowColumnPanel(!showColumnPanel);
                    }}
                    title="Sütun görünümü ve tablo düzeni"
                >
                    <span className="view-btn-icon">⚙</span>
                    Görünüm
                    <span className="toolbar-count">{visibleColumns.length - 1}</span>
                </button>

                <button
                    className="toolbar-btn reset-view"
                    onClick={resetColumnView}
                    title="Sütun görünümünü varsayılana döndür"
                >
                    Sıfırla
                </button>
            </div>
        </div>
    );
}