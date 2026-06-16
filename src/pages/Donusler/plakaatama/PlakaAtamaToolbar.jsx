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
        <div className="dpa-topbar">
            <div>
                <h1 className="dpa-title">
                    {loading ? "Yükleniyor..." : "Dönüş Plaka Atama"}
                </h1>
                <p className="dpa-subtitle">
                    {filteredRows.length}/{rows.length} kayıt listeleniyor
                </p>
            </div>

            <div className="dpa-toolbar-actions">
                <div className="dpa-search-wrap">
                    <span>⌕</span>
                    <input
                        className="dpa-search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Sefer, plaka, sürücü ara..."
                    />
                </div>

                <select
                    className="dpa-filter"
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

                <button
                    type="button"
                    className="dpa-irsaliye-btn"
                    onClick={() => setShowIrsaliyePanel(true)}
                >
                    İrsaliye Oku
                </button>

                <button
                    type="button"
                    className="dpa-export-btn"
                    onClick={exportExcel}
                >
                    Excel’e Aktar
                </button>

                <button
                    type="button"
                    className="dpa-import-btn"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={excelImporting}
                >
                    {excelImporting ? "Alınıyor..." : "Excel Al"}
                </button>

                <button
                    type="button"
                    className={showColumnPanel ? "dpa-column-btn active" : "dpa-column-btn"}
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowColumnPanel((prev) => !prev);
                    }}
                >
                    Sütunlar <span>{visibleColumns.length - 1}</span>
                </button>

                <button
                    type="button"
                    className="dpa-refresh-btn"
                    onClick={fetchRows}
                    disabled={loading}
                >
                    Yenile
                </button>
            </div>
        </div>
    );
}