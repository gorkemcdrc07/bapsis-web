import { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "../../../lib/supabaseClient";
import "../styles/Loglar.css";

type LogLevel = "bilgi" | "uyari" | "hata" | "kritik";

interface LogEntry {
    id: string;
    timestamp: string;
    level: LogLevel;
    category: string;
    user: string;
    message: string;
    ip: string;
    detail: string;
}

interface SistemLogSatiri {
    id: string;
    created_at: string;
    seviye: LogLevel;
    kategori: string;
    kullanici_adi: string | null;
    mesaj: string;
    detay: string | null;
    sayfa: string | null;
}

const LEVEL_META: Record<LogLevel, { label: string; icon: string }> = {
    bilgi: { label: "Bilgi", icon: "ti ti-info-circle" },
    uyari: { label: "Uyarı", icon: "ti ti-alert-triangle" },
    hata: { label: "Hata", icon: "ti ti-alert-circle" },
    kritik: { label: "Kritik", icon: "ti ti-flame" },
};

const LEVEL_OPTIONS: { id: "tumu" | LogLevel; label: string }[] = [
    { id: "tumu", label: "Tüm Seviyeler" },
    { id: "bilgi", label: "Bilgi" },
    { id: "uyari", label: "Uyarı" },
    { id: "hata", label: "Hata" },
    { id: "kritik", label: "Kritik" },
];

const CATEGORY_OPTIONS = [
    "Tüm Kategoriler",
    "Kullanıcı",
    "Sistem",
    "Güvenlik",
    "Entegrasyon",
    "Yedekleme",
];

const PAGE_SIZE = 8;
const FETCH_LIMIT = 500;

function formatTimestamp(iso: string) {
    const d = new Date(iso);
    return d.toLocaleString("tr-TR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function mapRow(row: SistemLogSatiri): LogEntry {
    return {
        id: row.id,
        timestamp: formatTimestamp(row.created_at),
        level: row.seviye,
        category: row.kategori,
        user: row.kullanici_adi || "sistem",
        message: row.mesaj,
        ip: row.sayfa || "—",
        detail: row.detay || "Ek detay bulunmuyor.",
    };
}

export default function Loglar() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    const [search, setSearch] = useState("");
    const [level, setLevel] = useState<"tumu" | LogLevel>("tumu");
    const [category, setCategory] = useState("Tüm Kategoriler");
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [page, setPage] = useState(1);

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        setLoadError(null);

        const { data, error } = await supabase
            .from("sistem_loglari")
            .select("id, created_at, seviye, kategori, kullanici_adi, mesaj, detay, sayfa")
            .order("created_at", { ascending: false })
            .limit(FETCH_LIMIT);

        if (error) {
            setLoadError("Loglar yüklenirken bir hata oluştu: " + error.message);
            setLogs([]);
        } else {
            setLogs((data || []).map(mapRow));
        }

        setLoading(false);
    }, []);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const filtered = useMemo(() => {
        return logs.filter((log) => {
            const matchesSearch =
                search.trim() === "" ||
                log.message.toLowerCase().includes(search.toLowerCase()) ||
                log.user.toLowerCase().includes(search.toLowerCase());
            const matchesLevel = level === "tumu" || log.level === level;
            const matchesCategory = category === "Tüm Kategoriler" || log.category === category;
            return matchesSearch && matchesLevel && matchesCategory;
        });
    }, [logs, search, level, category]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    const hasActiveFilters = search.trim() !== "" || level !== "tumu" || category !== "Tüm Kategoriler";

    function clearFilters() {
        setSearch("");
        setLevel("tumu");
        setCategory("Tüm Kategoriler");
        setPage(1);
    }

    function goToPage(next: number) {
        setPage(Math.min(Math.max(next, 1), totalPages));
        setExpandedId(null);
    }

    const summaryCounts = useMemo(() => {
        return (["bilgi", "uyari", "hata", "kritik"] as LogLevel[]).map((lvl) => ({
            level: lvl,
            count: logs.filter((l) => l.level === lvl).length,
        }));
    }, [logs]);

    return (
        <div className="ypw-tab-view">
            <div className="ypw-tab-head">
                <div>
                    <span className="log-eyebrow">Denetim ve İzleme</span>
                    <h2>Loglar</h2>
                    <p>Sistem, kullanıcı ve güvenlik olaylarının kronolojik kaydı.</p>
                </div>

                <div className="log-head-actions">
                    <button className="log-btn log-btn--ghost" onClick={fetchLogs} disabled={loading}>
                        <i className={loading ? "ti ti-loader-2 log-spin" : "ti ti-refresh"} />
                        Yenile
                    </button>
                    <button className="log-btn log-btn--primary" disabled={filtered.length === 0}>
                        <i className="ti ti-download" />
                        Dışa Aktar
                    </button>
                </div>
            </div>

            {loadError && (
                <div className="log-load-error">
                    <i className="ti ti-alert-circle" />
                    {loadError}
                </div>
            )}

            <div className="log-summary">
                {summaryCounts.map(({ level: lvl, count }) => (
                    <div className={"log-summary-card level-" + lvl} key={lvl}>
                        <i className={LEVEL_META[lvl].icon} />
                        <div>
                            <strong>{count}</strong>
                            <span>{LEVEL_META[lvl].label}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="log-filters">
                <div className="log-search">
                    <i className="ti ti-search" />
                    <input
                        type="text"
                        placeholder="Mesaj veya kullanıcı ara..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1);
                        }}
                    />
                </div>

                <select
                    className="log-select"
                    value={level}
                    onChange={(e) => {
                        setLevel(e.target.value as "tumu" | LogLevel);
                        setPage(1);
                    }}
                >
                    {LEVEL_OPTIONS.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                            {opt.label}
                        </option>
                    ))}
                </select>

                <select
                    className="log-select"
                    value={category}
                    onChange={(e) => {
                        setCategory(e.target.value);
                        setPage(1);
                    }}
                >
                    {CATEGORY_OPTIONS.map((opt) => (
                        <option key={opt}>{opt}</option>
                    ))}
                </select>

                {hasActiveFilters && (
                    <button className="log-clear-btn" onClick={clearFilters}>
                        <i className="ti ti-x" />
                        Filtreleri Temizle
                    </button>
                )}
            </div>

            {loading ? (
                <div className="ypw-empty-state">
                    <i className="ti ti-loader-2 log-spin" />
                    <strong>Loglar yükleniyor...</strong>
                </div>
            ) : pageItems.length === 0 ? (
                <div className="ypw-empty-state">
                    <i className="ti ti-history" />
                    <strong>Log kaydı bulunmuyor</strong>
                    {hasActiveFilters && (
                        <>
                            <span>Seçili filtrelerle eşleşen bir kayıt yok.</span>
                            <button className="log-btn log-btn--ghost" onClick={clearFilters}>
                                Filtreleri Temizle
                            </button>
                        </>
                    )}
                </div>
            ) : (
                <>
                    <div className="log-table">
                        <div className="log-row log-row--head">
                            <span>Seviye</span>
                            <span>Zaman</span>
                            <span>Kategori</span>
                            <span>Kullanıcı</span>
                            <span>Mesaj</span>
                            <span>Sayfa</span>
                            <span />
                        </div>

                        {pageItems.map((log) => {
                            const isOpen = expandedId === log.id;
                            return (
                                <div className={"log-row-wrap" + (isOpen ? " open" : "")} key={log.id}>
                                    <button
                                        className="log-row"
                                        onClick={() => setExpandedId(isOpen ? null : log.id)}
                                    >
                                        <span className={"log-badge level-" + log.level}>
                                            <i className={LEVEL_META[log.level].icon} />
                                            {LEVEL_META[log.level].label}
                                        </span>
                                        <span className="log-cell-muted">{log.timestamp}</span>
                                        <span>{log.category}</span>
                                        <span>{log.user}</span>
                                        <span className="log-cell-message">{log.message}</span>
                                        <span className="log-cell-muted">{log.ip}</span>
                                        <span className={"log-chevron" + (isOpen ? " open" : "")}>
                                            <i className="ti ti-chevron-down" />
                                        </span>
                                    </button>

                                    {isOpen && (
                                        <div className="log-detail">
                                            <div>
                                                <span className="log-detail-label">Kayıt No</span>
                                                <span>{log.id}</span>
                                            </div>
                                            <div className="log-detail-full">
                                                <span className="log-detail-label">Detay</span>
                                                <span>{log.detail}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div className="log-pagination">
                        <span>
                            Toplam {filtered.length} kayıttan {(currentPage - 1) * PAGE_SIZE + 1}
                            {"–"}
                            {Math.min(currentPage * PAGE_SIZE, filtered.length)} arası gösteriliyor
                        </span>
                        <div className="log-pagination-controls">
                            <button
                                className="log-page-btn"
                                onClick={() => goToPage(currentPage - 1)}
                                disabled={currentPage === 1}
                            >
                                <i className="ti ti-chevron-left" />
                            </button>
                            <span className="log-page-indicator">
                                {currentPage} / {totalPages}
                            </span>
                            <button
                                className="log-page-btn"
                                onClick={() => goToPage(currentPage + 1)}
                                disabled={currentPage === totalPages}
                            >
                                <i className="ti ti-chevron-right" />
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}