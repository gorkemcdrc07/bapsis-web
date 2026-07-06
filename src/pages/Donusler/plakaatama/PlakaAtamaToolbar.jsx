export default function PlakaAtamaToolbar({
    loading,
    rows,
    filteredRows,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    fetchRows,
    showColumnPanel,
    setShowColumnPanel,
    visibleColumns,
    exportExcel,
    fileInputRef,
    excelImporting,
    setShowIrsaliyePanel,
}) {
    return (
        <div className="dpa-modern-toolbar">
            <div className="dpa-search-wrap modern">
                <span className="dpa-search-icon">⌕</span>
                <input
                    className="dpa-search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Sefer, plaka, sürücü ara..."
                />
                {search && (
                    <button type="button" className="dpa-clear-search" onClick={() => setSearch("")}>
                        ×
                    </button>
                )}
            </div>

            <select
                className="dpa-filter modern"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
            >
                <option value="all">Tüm Durumlar</option>
                <option value="Plaka Bekliyor">Plaka Bekliyor</option>
                <option value="Plaka Atandı">Plaka Atandı</option>
                <option value="Yüklemeye Hazır">Yüklemeye Hazır</option>
                <option value="Beklemede">Beklemede</option>
                <option value="Yüklemede">Yüklemede</option>
                <option value="Yüklendi">Yüklendi</option>
                <option value="Çıkış Yaptı">Çıkış Yaptı</option>
            </select>

            <div className="dpa-modern-actions">
                <button type="button" className="dpa-icon-btn" onClick={() => setShowIrsaliyePanel(true)}>
                    <span>▣</span>
                    İrsaliye Oku
                </button>

                <button type="button" className="dpa-icon-btn green" onClick={() => fileInputRef.current?.click()} disabled={excelImporting}>
                    <span>▤</span>
                    {excelImporting ? "Alınıyor..." : "Excel Al"}
                </button>

                <button type="button" className="dpa-icon-btn green-soft" onClick={exportExcel}>
                    <span>▧</span>
                    Excel’e Aktar
                </button>

                <button
                    type="button"
                    className={showColumnPanel ? "dpa-icon-btn blue active" : "dpa-icon-btn blue"}
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowColumnPanel((prev) => !prev);
                    }}
                >
                    <span>▥</span>
                    Sütunlar
                    <b>{visibleColumns.length - 1}</b>
                </button>

                <button type="button" className="dpa-icon-btn" onClick={fetchRows} disabled={loading}>
                    <span className={loading ? "spin" : ""}>↻</span>
                    Yenile
                </button>
            </div>

            <div className="dpa-toolbar-count">
                {filteredRows.length}/{rows.length} kayıt
            </div>
        </div>
    );
}