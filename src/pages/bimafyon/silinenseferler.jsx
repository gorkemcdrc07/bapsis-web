import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import "./silinenseferler.css";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const SORT_OPTIONS = [
    { value: "date_desc", label: "Tarih (Yeni → Eski)" },
    { value: "date_asc", label: "Tarih (Eski → Yeni)" },
    { value: "id_desc", label: "Eski ID (Azalan)" },
    { value: "id_asc", label: "Eski ID (Artan)" },
];

const BADGE_PALETTE = ["badge-blue", "badge-violet", "badge-amber", "badge-rose", "badge-teal"];

export default function SilinenSeferler() {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [reasonFilter, setReasonFilter] = useState("all");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [sortBy, setSortBy] = useState("date_desc");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [selectedRow, setSelectedRow] = useState(null);
    const [copiedId, setCopiedId] = useState(null);

    useEffect(() => {
        fetchDeletedTrips();
    }, []);

    useEffect(() => {
        setPage(1);
    }, [search, reasonFilter, dateFrom, dateTo, sortBy, pageSize]);

    async function fetchDeletedTrips() {
        setLoading(true);

        const { data, error } = await supabase
            .from("silinen_aktif_seferler")
            .select("*")
            .order("created_at", { ascending: false });

        setLoading(false);

        if (error) {
            alert(`Silinen seferler alınamadı: ${error.message}`);
            return;
        }

        setRows(data || []);
    }

    // ---------- Türetilmiş veriler ----------

    const reasonOptions = useMemo(() => {
        const set = new Set();
        rows.forEach((item) => {
            if (item.silinme_nedeni) set.add(item.silinme_nedeni);
        });
        return Array.from(set).sort((a, b) => a.localeCompare(b, "tr"));
    }, [rows]);

    const stats = useMemo(() => {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        let today = 0;
        let thisMonth = 0;
        const reasonCounts = {};

        rows.forEach((item) => {
            const created = item.created_at ? new Date(item.created_at) : null;

            if (created && created >= startOfToday) today += 1;
            if (created && created >= startOfMonth) thisMonth += 1;

            const reason = item.silinme_nedeni || "Belirtilmemiş";
            reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
        });

        let topReason = "-";
        let topReasonCount = 0;

        Object.entries(reasonCounts).forEach(([reason, count]) => {
            if (count > topReasonCount) {
                topReason = reason;
                topReasonCount = count;
            }
        });

        return {
            total: rows.length,
            today,
            thisMonth,
            topReason,
            topReasonCount,
        };
    }, [rows]);

    const filteredRows = useMemo(() => {
        const value = search.toLowerCase().trim();
        const fromDate = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null;
        const toDate = dateTo ? new Date(`${dateTo}T23:59:59`) : null;

        return rows.filter((item) => {
            const sefer = item.sefer_verisi || {};

            if (reasonFilter !== "all" && item.silinme_nedeni !== reasonFilter) {
                return false;
            }

            if (item.created_at) {
                const created = new Date(item.created_at);
                if (fromDate && created < fromDate) return false;
                if (toDate && created > toDate) return false;
            }

            if (!value) return true;

            return [
                item.eski_sefer_id,
                item.silinme_nedeni,
                item.silen_kullanici_adi,
                sefer.seferNo,
                sefer.cekici,
                sefer.surucu,
                sefer.varis1,
                sefer.aracDurumu,
            ]
                .join(" ")
                .toLowerCase()
                .includes(value);
        });
    }, [rows, search, reasonFilter, dateFrom, dateTo]);

    const sortedRows = useMemo(() => {
        const copy = [...filteredRows];

        copy.sort((a, b) => {
            switch (sortBy) {
                case "date_asc":
                    return new Date(a.created_at || 0) - new Date(b.created_at || 0);
                case "id_asc":
                    return String(a.eski_sefer_id || "").localeCompare(String(b.eski_sefer_id || ""));
                case "id_desc":
                    return String(b.eski_sefer_id || "").localeCompare(String(a.eski_sefer_id || ""));
                case "date_desc":
                default:
                    return new Date(b.created_at || 0) - new Date(a.created_at || 0);
            }
        });

        return copy;
    }, [filteredRows, sortBy]);

    const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));
    const currentPage = Math.min(page, totalPages);

    const pagedRows = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return sortedRows.slice(start, start + pageSize);
    }, [sortedRows, currentPage, pageSize]);

    const hasActiveFilters =
        Boolean(search) || reasonFilter !== "all" || Boolean(dateFrom) || Boolean(dateTo);

    // ---------- Yardımcılar ----------

    function formatDate(value) {
        if (!value) return "-";
        return new Date(value).toLocaleString("tr-TR");
    }

    function resetFilters() {
        setSearch("");
        setReasonFilter("all");
        setDateFrom("");
        setDateTo("");
    }

    function reasonBadgeClass(reason) {
        const text = reason || "Belirtilmemiş";
        let hash = 0;
        for (let i = 0; i < text.length; i += 1) {
            hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
        }
        return BADGE_PALETTE[hash % BADGE_PALETTE.length];
    }

    async function copyToClipboard(text, id) {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 1500);
        } catch {
            alert("Kopyalanamadı, tarayıcı izni gerekiyor olabilir.");
        }
    }

    function exportToCsv() {
        if (sortedRows.length === 0) return;

        const headers = [
            "Eski ID",
            "Sefer No",
            "Çekici",
            "Sürücü",
            "Varış",
            "Durum",
            "Silinme Nedeni",
            "Silen Kullanıcı",
            "Tarih",
        ];

        const escape = (val) => {
            const str = String(val ?? "-").replace(/"/g, '""');
            return `"${str}"`;
        };

        const lines = sortedRows.map((item) => {
            const sefer = item.sefer_verisi || {};
            return [
                item.eski_sefer_id,
                sefer.seferNo,
                sefer.cekici,
                sefer.surucu,
                sefer.varis1,
                sefer.aracDurumu,
                item.silinme_nedeni,
                item.silen_kullanici_adi,
                formatDate(item.created_at),
            ]
                .map(escape)
                .join(",");
        });

        const csvContent = [headers.map(escape).join(","), ...lines].join("\n");
        const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = `silinen_seferler_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    // ---------- Render ----------

    return (
        <div className="deleted-trips-page">
            <div className="deleted-trips-card">
                <div className="deleted-trips-header">
                    <div>
                        <span className="deleted-eyebrow">Arşiv</span>
                        <h2>Silinen Seferler</h2>
                        <p>Manuel veya Excel aktarımıyla silinen seferlerin arşiv kayıtları.</p>
                    </div>

                    <div className="deleted-actions">
                        <button
                            className="secondary-btn"
                            onClick={exportToCsv}
                            disabled={sortedRows.length === 0}
                        >
                            CSV Olarak İndir
                        </button>

                        <button onClick={fetchDeletedTrips} disabled={loading}>
                            {loading ? "Yükleniyor..." : "Yenile"}
                        </button>
                    </div>
                </div>

                <div className="stats-grid">
                    <div className="stat-card">
                        <span className="stat-label">Toplam Kayıt</span>
                        <span className="stat-value">{stats.total}</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-label">Bugün Silinen</span>
                        <span className="stat-value">{stats.today}</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-label">Bu Ay Silinen</span>
                        <span className="stat-value">{stats.thisMonth}</span>
                    </div>
                    <div className="stat-card stat-card-wide">
                        <span className="stat-label">En Sık Silinme Nedeni</span>
                        <span className="stat-value stat-value-text">
                            {stats.topReason}
                            {stats.topReasonCount > 0 && (
                                <span className="stat-value-sub"> · {stats.topReasonCount} kayıt</span>
                            )}
                        </span>
                    </div>
                </div>

                <div className="filter-bar">
                    <input
                        className="filter-search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="ID, sefer, plaka, sürücü ara..."
                    />

                    <select value={reasonFilter} onChange={(e) => setReasonFilter(e.target.value)}>
                        <option value="all">Tüm Nedenler</option>
                        {reasonOptions.map((reason) => (
                            <option key={reason} value={reason}>
                                {reason}
                            </option>
                        ))}
                    </select>

                    <div className="filter-date-group">
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            aria-label="Başlangıç tarihi"
                        />
                        <span className="date-sep">–</span>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            aria-label="Bitiş tarihi"
                        />
                    </div>

                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                        {SORT_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>

                    {hasActiveFilters && (
                        <button className="ghost-btn" onClick={resetFilters}>
                            Filtreleri Temizle
                        </button>
                    )}
                </div>

                <div className="deleted-count">
                    {sortedRows.length}/{rows.length} kayıt
                    {hasActiveFilters && " (filtrelenmiş)"}
                </div>

                <div className="deleted-table-wrapper">
                    <table className="deleted-table">
                        <thead>
                            <tr>
                                <th>Eski ID</th>
                                <th>Sefer No</th>
                                <th>Çekici</th>
                                <th>Sürücü</th>
                                <th>Varış</th>
                                <th>Durum</th>
                                <th>Silinme Nedeni</th>
                                <th>Silen Kullanıcı</th>
                                <th>Tarih</th>
                                <th>Detay</th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading &&
                                Array.from({ length: 6 }).map((_, i) => (
                                    <tr key={`skeleton-${i}`} className="skeleton-row">
                                        {Array.from({ length: 10 }).map((__, j) => (
                                            <td key={j}>
                                                <span className="skeleton-bar" />
                                            </td>
                                        ))}
                                    </tr>
                                ))}

                            {!loading &&
                                pagedRows.map((item) => {
                                    const sefer = item.sefer_verisi || {};

                                    return (
                                        <tr key={item.id}>
                                            <td>
                                                <button
                                                    className="deleted-id"
                                                    onClick={() => copyToClipboard(String(item.eski_sefer_id), item.id)}
                                                    title="ID'yi kopyala"
                                                >
                                                    {copiedId === item.id ? "Kopyalandı ✓" : item.eski_sefer_id}
                                                </button>
                                            </td>
                                            <td>{sefer.seferNo || "-"}</td>
                                            <td>{sefer.cekici || "-"}</td>
                                            <td>{sefer.surucu || "-"}</td>
                                            <td>{sefer.varis1 || "-"}</td>
                                            <td>{sefer.aracDurumu || "-"}</td>
                                            <td>
                                                <span className={`reason-badge ${reasonBadgeClass(item.silinme_nedeni)}`}>
                                                    {item.silinme_nedeni || "Belirtilmemiş"}
                                                </span>
                                            </td>
                                            <td>{item.silen_kullanici_adi || "-"}</td>
                                            <td>{formatDate(item.created_at)}</td>
                                            <td>
                                                <button
                                                    className="detail-btn"
                                                    onClick={() => setSelectedRow(item)}
                                                >
                                                    Aç
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}

                            {!loading && sortedRows.length === 0 && (
                                <tr>
                                    <td colSpan="10" className="empty-cell">
                                        <div className="empty-state">
                                            <strong>Kayıt bulunamadı</strong>
                                            <span>
                                                {hasActiveFilters
                                                    ? "Filtre kriterlerinize uyan silinen sefer yok. Filtreleri temizleyip tekrar deneyin."
                                                    : "Henüz silinmiş bir sefer kaydı yok."}
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {sortedRows.length > 0 && (
                    <div className="pagination">
                        <div className="pagination-size">
                            <span>Sayfa başına:</span>
                            <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
                                {PAGE_SIZE_OPTIONS.map((size) => (
                                    <option key={size} value={size}>
                                        {size}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="pagination-controls">
                            <button
                                disabled={currentPage <= 1}
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                            >
                                ‹ Önceki
                            </button>
                            <span className="pagination-status">
                                Sayfa {currentPage} / {totalPages}
                            </span>
                            <button
                                disabled={currentPage >= totalPages}
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            >
                                Sonraki ›
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {selectedRow && (
                <div className="deleted-modal-overlay" onClick={() => setSelectedRow(null)}>
                    <div className="deleted-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="deleted-modal-header">
                            <div>
                                <span className="deleted-eyebrow">Silinen Sefer Detayı</span>
                                <h3>ID #{selectedRow.eski_sefer_id}</h3>
                                <p>
                                    <span className={`reason-badge ${reasonBadgeClass(selectedRow.silinme_nedeni)}`}>
                                        {selectedRow.silinme_nedeni || "Belirtilmemiş"}
                                    </span>
                                    {" · "}
                                    {formatDate(selectedRow.created_at)}
                                    {selectedRow.silen_kullanici_adi && (
                                        <> · {selectedRow.silen_kullanici_adi}</>
                                    )}
                                </p>
                            </div>

                            <button onClick={() => setSelectedRow(null)}>×</button>
                        </div>

                        <div className="deleted-detail-grid">
                            {Object.entries(selectedRow.sefer_verisi || {}).map(([key, value]) => (
                                <div className="deleted-detail-item" key={key}>
                                    <small>{key}</small>
                                    <strong>{String(value ?? "-")}</strong>
                                </div>
                            ))}
                        </div>

                        <div className="deleted-modal-footer">
                            <button
                                className="secondary-btn"
                                onClick={() =>
                                    copyToClipboard(JSON.stringify(selectedRow, null, 2), `modal-${selectedRow.id}`)
                                }
                            >
                                {copiedId === `modal-${selectedRow.id}` ? "Kopyalandı ✓" : "Kaydı JSON Olarak Kopyala"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}