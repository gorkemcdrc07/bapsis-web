import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContext";
import "./TamamlananSeferler.css";

const PAGE_KEY = "donus_tamamlanan";

const COLUMNS = {
    TAMAMLANMA: "Tamamlanma Tarihi",
    SEFER_NO: "Sefer No",
    SEVK_TARIHI: "Sevk Tarihi",
    CEKICI: "Çekici",
    DORSE: "Dorse",
    SURUCU: "Sürücü",
    TELEFON: "Telefon",
    IRSALIYE: "İrsaliye",
    NAVLUN: "Navlun",
    TAMAMLAYAN: "Tamamlayan",
};

const BUTTONS = {
    REFRESH: "refresh",
};

export default function TamamlananSeferler() {
    const { canPage, canButton, canColumn } = useAuth();

    const canViewPage = canPage(PAGE_KEY);
    const canRefresh = canButton(PAGE_KEY, BUTTONS.REFRESH);

    const visibleColumns = useMemo(() => {
        return [
            { key: "tamamlanma", label: "Tamamlanma", visible: canColumn(PAGE_KEY, COLUMNS.TAMAMLANMA) },
            { key: "seferNo", label: "Sefer No", visible: canColumn(PAGE_KEY, COLUMNS.SEFER_NO) },
            { key: "sevkTarihi", label: "Sevk Tarihi", visible: canColumn(PAGE_KEY, COLUMNS.SEVK_TARIHI) },
            { key: "cekici", label: "Çekici", visible: canColumn(PAGE_KEY, COLUMNS.CEKICI) },
            { key: "dorse", label: "Dorse", visible: canColumn(PAGE_KEY, COLUMNS.DORSE) },
            { key: "surucu", label: "Sürücü", visible: canColumn(PAGE_KEY, COLUMNS.SURUCU) },
            { key: "telefon", label: "Telefon", visible: canColumn(PAGE_KEY, COLUMNS.TELEFON) },
            { key: "irsaliyeNo", label: "İrsaliye", visible: canColumn(PAGE_KEY, COLUMNS.IRSALIYE) },
            { key: "navlun", label: "Navlun", visible: canColumn(PAGE_KEY, COLUMNS.NAVLUN) },
            { key: "tamamlayan", label: "Tamamlayan", visible: canColumn(PAGE_KEY, COLUMNS.TAMAMLAYAN) },
        ].filter((column) => column.visible);
    }, [canColumn]);

    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");

    useEffect(() => {
        if (canViewPage) fetchRows();
    }, [canViewPage]);

    async function fetchRows() {
        setLoading(true);

        const { data, error } = await supabase
            .from("tamamlananDonusSeferleri")
            .select("*")
            .order("created_at", { ascending: false });

        setLoading(false);

        if (error) {
            console.error("Tamamlanan seferler alınamadı:", error);
            return;
        }

        setRows(data || []);
    }

    function formatDate(value) {
        if (!value) return "—";

        try {
            return new Date(value).toLocaleString("tr-TR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            });
        } catch {
            return value;
        }
    }

    function getCellValue(item, key) {
        const row = item.sefer_verisi || {};

        const values = {
            tamamlanma: formatDate(item.created_at),
            seferNo: row.seferNo || "—",
            sevkTarihi: row.sevkTarihi || "—",
            cekici: row.cekici || "—",
            dorse: row.dorse || "—",
            surucu: row.surucu || "—",
            telefon: row.telefon || "—",
            irsaliyeNo: row.irsaliyeNo || "—",
            navlun: row.navlun || "—",
            tamamlayan: item.tamamlayan_kullanici_adi || "—",
        };

        return values[key] || "—";
    }

    const filteredRows = useMemo(() => {
        const q = search.trim().toLowerCase();

        if (!q) return rows;

        return rows.filter((item) => {
            const row = item.sefer_verisi || {};

            const text = [
                row.seferNo,
                row.sevkTarihi,
                row.cekici,
                row.dorse,
                row.surucu,
                row.telefon,
                row.irsaliyeNo,
                row.navlun,
                item.tamamlayan_kullanici_adi,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            return text.includes(q);
        });
    }, [rows, search]);

    const toplamKayit = rows.length;
    const gorunenKayit = filteredRows.length;
    const colSpan = Math.max(visibleColumns.length, 1);

    if (!canViewPage) {
        return (
            <div className="dpa-page">
                <div className="dpa-card">
                    <div className="dpa-empty">
                        <strong>Erişim kısıtlı</strong>
                        <p>Bu sayfayı görüntüleme yetkiniz yok.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="dpa-page">
            <div className="dpa-hero">
                <div>
                    <span className="dpa-eyebrow">Dönüş Yönetimi</span>
                    <h1>Tamamlanan Dönüş Seferleri</h1>
                    <p>
                        Tamamlanan dönüş seferlerini, plaka ve sürücü bilgileriyle
                        birlikte buradan takip edebilirsin.
                    </p>
                </div>

                {canRefresh && (
                    <button className="dpa-refresh-btn" onClick={fetchRows} disabled={loading}>
                        {loading ? "Yükleniyor..." : "Yenile"}
                    </button>
                )}
            </div>

            <div className="dpa-stats-grid">
                <div className="dpa-stat-card">
                    <span>Toplam Kayıt</span>
                    <strong>{toplamKayit}</strong>
                </div>

                <div className="dpa-stat-card">
                    <span>Görünen Kayıt</span>
                    <strong>{gorunenKayit}</strong>
                </div>

                <div className="dpa-stat-card">
                    <span>Son Kayıt</span>
                    <strong>{rows[0]?.created_at ? formatDate(rows[0].created_at) : "—"}</strong>
                </div>
            </div>

            <div className="dpa-card">
                <div className="dpa-toolbar">
                    <div>
                        <h2>Sefer Listesi</h2>
                        <p>{gorunenKayit} kayıt listeleniyor</p>
                    </div>

                    <div className="dpa-search-box">
                        <span>⌕</span>
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Sefer no, plaka, sürücü, irsaliye ara..."
                        />
                    </div>
                </div>

                <div className="dpa-table-wrap">
                    <table className="dpa-table">
                        <thead>
                            <tr>
                                {visibleColumns.map((column) => (
                                    <th key={column.key}>{column.label}</th>
                                ))}
                            </tr>
                        </thead>

                        <tbody>
                            {loading && (
                                <tr>
                                    <td colSpan={colSpan}>
                                        <div className="dpa-empty">
                                            <div className="dpa-loader" />
                                            <strong>Kayıtlar yükleniyor...</strong>
                                        </div>
                                    </td>
                                </tr>
                            )}

                            {!loading &&
                                filteredRows.map((item) => (
                                    <tr key={item.id}>
                                        {visibleColumns.map((column) => (
                                            <td key={column.key}>
                                                {column.key === "seferNo" ? (
                                                    <span className="dpa-badge">
                                                        {getCellValue(item, column.key)}
                                                    </span>
                                                ) : (
                                                    getCellValue(item, column.key)
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                ))}

                            {!loading && filteredRows.length === 0 && (
                                <tr>
                                    <td colSpan={colSpan}>
                                        <div className="dpa-empty">
                                            <strong>Tamamlanan sefer bulunamadı.</strong>
                                            <p>Arama kriterini değiştirip tekrar deneyebilirsin.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}

                            {!loading && visibleColumns.length === 0 && (
                                <tr>
                                    <td colSpan={1}>
                                        <div className="dpa-empty">
                                            <strong>Görüntülenecek sütun yok.</strong>
                                            <p>Bu sayfa için sütun yetkisi verilmemiş.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}