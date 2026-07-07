import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContext";
import { BUTTONS, COLUMNS, PAGE_KEY } from "./TamamlananSeferler.constants";
import "./tamamlananseferler.css";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const SORT_OPTIONS = [
    { value: "date_desc", label: "Tarih (Yeni → Eski)" },
    { value: "date_asc", label: "Tarih (Eski → Yeni)" },
    { value: "id_desc", label: "Eski ID (Azalan)" },
    { value: "id_asc", label: "Eski ID (Artan)" },
];

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
    const [copiedId, setCopiedId] = useState(null);

    // ---------- Yetki ----------
    const { canPage, canButton, canColumn } = useAuth();

    const canViewPage = canPage(PAGE_KEY);
    const canRefresh = canButton(PAGE_KEY, BUTTONS.REFRESH);
    const canExportCsv = canButton(PAGE_KEY, BUTTONS.EXPORT_EXCEL);
    const canCopyJson = canButton(PAGE_KEY, BUTTONS.COPY_JSON);

    // Sadece yetkili olunan sütunlar tabloya render edilir.
    const visibleColumns = useMemo(
        () => COLUMNS.filter((column) => canColumn(PAGE_KEY, column.key)),
        [canColumn]
    );

    useEffect(() => {
        if (!canViewPage) return;
        fetchCompletedTrips();
        // eslint-disable-next-line react-hooks/exhaustive-deps
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

    // Buton gizlense bile fonksiyon elle çağrılsa çalışmaz.
    function handleRefreshClick() {
        if (!canRefresh) {
            alert("Bu işlem için yetkiniz yok.");
            return;
        }
        fetchCompletedTrips();
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

    async function copyToClipboard(text, id) {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 1500);
        } catch {
            alert("Kopyalanamadı, tarayıcı izni gerekiyor olabilir.");
        }
    }

    // Satırdaki tüm veriyi JSON olarak kopyalar. Buton gizlense bile
    // elle çağrılırsa yetki kontrolünden geçemez.
    function handleCopyJson(item) {
        if (!canCopyJson) {
            alert("Bu işlem için yetkiniz yok.");
            return;
        }
        copyToClipboard(JSON.stringify(item, null, 2), `json-${item.id}`);
    }

    // Bir sütunun değerini, seçilen COLUMNS[].key'e göre üretir.
    function getColumnValue(item, key) {
        const sefer = item.sefer_verisi || {};

        switch (key) {
            case "id":
                return item.eski_sefer_id;
            case "tamamlanma_nedeni":
                return item.tamamlanma_nedeni || "Belirtilmemiş";
            case "tamamlayan_kullanici_adi":
                return item.tamamlayan_kullanici_adi || "—";
            case "created_at":
                return formatDate(item.created_at);
            default:
                return sefer[key] ?? "—";
        }
    }

    function renderColumnCell(item, column) {
        if (column.key === "id") {
            return (
                <button
                    className="ct-id-chip"
                    onClick={() => copyToClipboard(String(item.eski_sefer_id), item.id)}
                    title="ID'yi kopyala"
                >
                    {copiedId === item.id ? "Kopyalandı ✓" : item.eski_sefer_id}
                </button>
            );
        }

        if (column.key === "tamamlanma_nedeni") {
            return (
                <span className="ct-pill">
                    <span className="ct-pill-dot" />
                    {getColumnValue(item, column.key)}
                </span>
            );
        }

        return getColumnValue(item, column.key);
    }

    function exportToCsv() {
        if (!canExportCsv) {
            alert("Bu işlem için yetkiniz yok.");
            return;
        }

        if (sortedRows.length === 0) return;

        const headers = visibleColumns.map((column) => column.label);

        const escape = (val) => {
            const str = String(val ?? "—").replace(/"/g, '""');
            return `"${str}"`;
        };

        const lines = sortedRows.map((item) => {
            return visibleColumns
                .map((column) => escape(getColumnValue(item, column.key)))
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

    if (!canViewPage) {
        return (
            <div className="ct-page">
                <div className="ct-card ct-unauthorized">
                    <span className="ct-eyebrow">
                        <span className="ct-eyebrow-dot" />
                        Erişim Reddedildi
                    </span>
                    <h2>Bu sayfayı görüntüleme yetkiniz yok</h2>
                    <p>Erişim talep etmek için sistem yöneticinizle iletişime geçin.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="ct-page">
            <div className="ct-card">
                <div className="ct-header">
                    <div className="ct-header-text">
                        <span className="ct-eyebrow">
                            <span className="ct-eyebrow-dot" />
                            Arşiv · Tamamlanan
                        </span>
                        <h2>Tamamlanan Seferler</h2>
                        <p>Aktif listeden tamamlanarak arşive alınan seferlerin kaydı.</p>
                    </div>

                    <div className="ct-actions">
                        {canExportCsv && (
                            <button
                                className="ct-btn ct-btn-outline"
                                onClick={exportToCsv}
                                disabled={sortedRows.length === 0}
                            >
                                CSV Olarak İndir
                            </button>
                        )}

                        {canRefresh && (
                            <button className="ct-btn ct-btn-primary" onClick={handleRefreshClick} disabled={loading}>
                                {loading ? "Yükleniyor..." : "Yenile"}
                            </button>
                        )}
                    </div>
                </div>

                <div className="ct-stats">
                    <div className="ct-stat">
                        <span className="ct-stat-label">Toplam Kayıt</span>
                        <span className="ct-stat-value">{stats.total}</span>
                    </div>
                    <div className="ct-stat">
                        <span className="ct-stat-label">Bugün Tamamlanan</span>
                        <span className="ct-stat-value">{stats.today}</span>
                    </div>
                    <div className="ct-stat">
                        <span className="ct-stat-label">Son 7 Gün</span>
                        <span className="ct-stat-value">{stats.last7Days}</span>
                    </div>
                    <div className="ct-stat ct-stat-wide">
                        <span className="ct-stat-label">En Çok Tamamlayan</span>
                        <span className="ct-stat-value ct-stat-value-text">
                            {stats.topUser}
                            {stats.topUserCount > 0 && (
                                <span className="ct-stat-sub"> · {stats.topUserCount} kayıt</span>
                            )}
                        </span>
                    </div>
                </div>

                <div className="ct-filter-bar">
                    <input
                        className="ct-search"
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

                    <div className="ct-date-group">
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            aria-label="Başlangıç tarihi"
                        />
                        <span className="ct-date-sep">–</span>
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
                        <button className="ct-btn-ghost" onClick={resetFilters}>
                            Filtreleri Temizle
                        </button>
                    )}
                </div>

                <div className="ct-count-row">
                    <span className="ct-count-badge">
                        {sortedRows.length}/{rows.length} kayıt
                        {hasActiveFilters && " · filtrelenmiş"}
                    </span>
                </div>

                <div className="ct-table-wrapper">
                    <table className="ct-table">
                        <thead>
                            <tr>
                                {visibleColumns.map((column, index) => (
                                    <th
                                        key={column.key}
                                        className={index === 0 ? "ct-col-sticky" : undefined}
                                    >
                                        {column.label}
                                    </th>
                                ))}
                                {canCopyJson && <th>Kayıt</th>}
                            </tr>
                        </thead>

                        <tbody>
                            {loading &&
                                Array.from({ length: 6 }).map((_, i) => (
                                    <tr key={`skeleton-${i}`} className="ct-skeleton-row">
                                        {Array.from({ length: visibleColumns.length + (canCopyJson ? 1 : 0) }).map((__, j) => (
                                            <td key={j}>
                                                <span className="ct-skeleton-bar" />
                                            </td>
                                        ))}
                                    </tr>
                                ))}

                            {!loading &&
                                pagedRows.map((item) => (
                                    <tr key={item.id}>
                                        {visibleColumns.map((column, index) => (
                                            <td
                                                key={column.key}
                                                className={index === 0 ? "ct-col-sticky" : undefined}
                                            >
                                                {renderColumnCell(item, column)}
                                            </td>
                                        ))}

                                        {canCopyJson && (
                                            <td>
                                                <button
                                                    className="ct-json-btn"
                                                    onClick={() => handleCopyJson(item)}
                                                >
                                                    {copiedId === `json-${item.id}` ? "Kopyalandı ✓" : "JSON Kopyala"}
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))}

                            {!loading && sortedRows.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={visibleColumns.length + (canCopyJson ? 1 : 0)}
                                        className="ct-empty-cell"
                                    >
                                        <div className="ct-empty-state">
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
                    <div className="ct-pagination">
                        <div className="ct-page-size">
                            <span>Sayfa başına:</span>
                            <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
                                {PAGE_SIZE_OPTIONS.map((size) => (
                                    <option key={size} value={size}>
                                        {size}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="ct-page-controls">
                            <button
                                disabled={currentPage <= 1}
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                            >
                                ‹ Önceki
                            </button>
                            <span className="ct-page-status">
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
        </div>
    );
}