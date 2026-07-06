import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import "./tamamlananseferler.css";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const SORT_OPTIONS = [
    { value: "date_desc", label: "Tarih (Yeni → Eski)" },
    { value: "date_asc", label: "Tarih (Eski → Yeni)" },
    { value: "id_desc", label: "Eski ID (Azalan)" },
    { value: "id_asc", label: "Eski ID (Artan)" },
];

const BADGE_PALETTE = ["badge-green", "badge-teal", "badge-blue", "badge-amber", "badge-violet"];

export default function TamamlananSeferler() {
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
        fetchCompletedTrips();
    }, []);

    useEffect(() => {
        setPage(1);
    }, [search, reasonFilter, dateFrom, dateTo, sortBy, pageSize]);

    async function fetchCompletedTrips() {
        setLoading(true);

        const { data, error } = await supabase
            .from("tamamlanan_seferler")
            .select("*")
            .order("created_at", { ascending: false });

        setLoading(false);

        if (error) {
            alert(`Tamamlanan seferler alınamadı: ${error.message}`);
            return;
        }

        setRows(data || []);
    }

    // ---------- Türetilmiş veriler ----------

    const reasonOptions = useMemo(() => {
        const set = new Set();
        rows.forEach((item) => {
            if (item.tamamlanma_nedeni) set.add(item.tamamlanma_nedeni);
        });
        return Array.from(set).sort((a, b) => a.localeCompare(b, "tr"));
    }, [rows]);

    const stats = useMemo(() => {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);

        let today = 0;
        let thisMonth = 0;
        let last7Days = 0;
        const userCounts = {};

        rows.forEach((item) => {
            const created = item.created_at ? new Date(item.created_at) : null;

            if (created && created >= startOfToday) today += 1;
            if (created && created >= startOfMonth) thisMonth += 1;
            if (created && created >= weekAgo) last7Days += 1;

            const user = item.tamamlayan_kullanici_adi || "Belirtilmemiş";
            userCounts[user] = (userCounts[user] || 0) + 1;
        });

        let topUser = "-";
        let topUserCount = 0;

        Object.entries(userCounts).forEach(([user, count]) => {
            if (count > topUserCount) {
                topUser = user;
                topUserCount = count;
            }
        });

        return {
            total: rows.length,
            today,
            thisMonth,
            last7Days,
            topUser,
            topUserCount,
        };
    }, [rows]);

    const filteredRows = useMemo(() => {
        const value = search.toLowerCase().trim();
        const fromDate = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null;
        const toDate = dateTo ? new Date(`${dateTo}T23:59:59`) : null;

        return rows.filter((item) => {
            const sefer = item.sefer_verisi || {};

            if (reasonFilter !== "all" && item.tamamlanma_nedeni !== reasonFilter) {
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
                item.tamamlanma_nedeni,
                item.tamamlayan_kullanici_adi,
                sefer.seferNo,
                sefer.cekici,
                sefer.dorse,
                sefer.surucu,
                sefer.telefon,
                sefer.varis1,
                sefer.varis2,
                sefer.varis3,
                sefer.varis4,
                sefer.irsaliyeNo,
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
        if (!value) return "—";
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
            "Dorse",
            "Sürücü",
            "Telefon",
            "Varış",
            "İrsaliye",
            "Tamamlanma Nedeni",
            "Tamamlayan",
            "Tarih",
        ];

        const escape = (val) => {
            const str = String(val ?? "—").replace(/"/g, '""');
            return `"${str}"`;
        };

        const lines = sortedRows.map((item) => {
            const sefer = item.sefer_verisi || {};
            return [
                item.eski_sefer_id,
                sefer.seferNo,
                sefer.cekici,
                sefer.dorse,
                sefer.surucu,
                sefer.telefon,
                sefer.varis1,
                sefer.irsaliyeNo,
                item.tamamlanma_nedeni,
                item.tamamlayan_kullanici_adi,
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
        link.download = `tamamlanan_seferler_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    // ---------- Render ----------

    return (
        <div className="completed-trips-page">
            <div className="completed-trips-card">
                <div className="completed-trips-header">
                    <div>
                        <span className="completed-eyebrow">Tamamlanan</span>
                        <h2>Tamamlanan Seferler</h2>
                        <p>Aktif listeden tamamlanarak arşive alınan seferler.</p>
                    </div>

                    <div className="completed-actions">
                        <button
                            className="secondary-btn"
                            onClick={exportToCsv}
                            disabled={sortedRows.length === 0}
                        >
                            CSV Olarak İndir
                        </button>

                        <button onClick={fetchCompletedTrips} disabled={loading}>
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
                        <span className="stat-label">Bugün Tamamlanan</span>
                        <span className="stat-value">{stats.today}</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-label">Son 7 Gün</span>
                        <span className="stat-value">{stats.last7Days}</span>
                    </div>
                    <div className="stat-card stat-card-wide">
                        <span className="stat-label">En Çok Tamamlayan</span>
                        <span className="stat-value stat-value-text">
                            {stats.topUser}
                            {stats.topUserCount > 0 && (
                                <span className="stat-value-sub"> · {stats.topUserCount} kayıt</span>
                            )}
                        </span>
                    </div>
                </div>

                <div className="filter-bar">
                    <input
                        className="filter-search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Sefer, plaka, sürücü, irsaliye ara..."
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

                <div className="completed-count">
                    {sortedRows.length}/{rows.length} kayıt
                    {hasActiveFilters && " (filtrelenmiş)"}
                </div>

                <div className="completed-table-wrapper">
                    <table className="completed-table">
                        <thead>
                            <tr>
                                <th>Eski ID</th>
                                <th>Sefer No</th>
                                <th>Çekici</th>
                                <th>Dorse</th>
                                <th>Sürücü</th>
                                <th>Telefon</th>
                                <th>Varış</th>
                                <th>İrsaliye</th>
                                <th>Neden</th>
                                <th>Tamamlayan</th>
                                <th>Tarih</th>
                                <th>Detay</th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading &&
                                Array.from({ length: 6 }).map((_, i) => (
                                    <tr key={`skeleton-${i}`} className="skeleton-row">
                                        {Array.from({ length: 12 }).map((__, j) => (
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
                                                    className="completed-id"
                                                    onClick={() => copyToClipboard(String(item.eski_sefer_id), item.id)}
                                                    title="ID'yi kopyala"
                                                >
                                                    {copiedId === item.id ? "Kopyalandı ✓" : item.eski_sefer_id}
                                                </button>
                                            </td>
                                            <td>{sefer.seferNo || "—"}</td>
                                            <td>{sefer.cekici || "—"}</td>
                                            <td>{sefer.dorse || "—"}</td>
                                            <td>{sefer.surucu || "—"}</td>
                                            <td>{sefer.telefon || "—"}</td>
                                            <td>{sefer.varis1 || "—"}</td>
                                            <td>{sefer.irsaliyeNo || "—"}</td>
                                            <td>
                                                <span className={`reason-badge ${reasonBadgeClass(item.tamamlanma_nedeni)}`}>
                                                    {item.tamamlanma_nedeni || "Belirtilmemiş"}
                                                </span>
                                            </td>
                                            <td>{item.tamamlayan_kullanici_adi || "—"}</td>
                                            <td>{formatDate(item.created_at)}</td>
                                            <td>
                                                <button
                                                    className="completed-detail-btn"
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
                                    <td colSpan="12" className="empty-cell">
                                        <div className="empty-state">
                                            <strong>Kayıt bulunamadı</strong>
                                            <span>
                                                {hasActiveFilters
                                                    ? "Filtre kriterlerinize uyan tamamlanmış sefer yok. Filtreleri temizleyip tekrar deneyin."
                                                    : "Henüz tamamlanmış bir sefer kaydı yok."}
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
                <div className="completed-modal-overlay" onClick={() => setSelectedRow(null)}>
                    <div className="completed-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="completed-modal-header">
                            <div>
                                <span className="completed-eyebrow">Sefer Detayı</span>
                                <h3>{selectedRow.sefer_verisi?.seferNo || "Sefer No yok"}</h3>
                                <p>
                                    <span className={`reason-badge ${reasonBadgeClass(selectedRow.tamamlanma_nedeni)}`}>
                                        {selectedRow.tamamlanma_nedeni || "Tamamlandı"}
                                    </span>
                                    {" · "}
                                    {formatDate(selectedRow.created_at)}
                                </p>
                            </div>

                            <button onClick={() => setSelectedRow(null)}>×</button>
                        </div>

                        <div className="completed-summary">
                            <div>
                                <small>Çekici</small>
                                <strong>{selectedRow.sefer_verisi?.cekici || "—"}</strong>
                            </div>
                            <div>
                                <small>Sürücü</small>
                                <strong>{selectedRow.sefer_verisi?.surucu || "—"}</strong>
                            </div>
                            <div>
                                <small>Tamamlayan</small>
                                <strong>{selectedRow.tamamlayan_kullanici_adi || "—"}</strong>
                            </div>
                        </div>

                        <div className="completed-detail-grid">
                            {Object.entries(selectedRow.sefer_verisi || {}).map(([key, value]) => (
                                <div className="completed-detail-item" key={key}>
                                    <small>{key}</small>
                                    <strong>{String(value ?? "—")}</strong>
                                </div>
                            ))}
                        </div>

                        <div className="completed-modal-footer">
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