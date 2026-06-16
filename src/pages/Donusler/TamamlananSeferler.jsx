import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import "./TamamlananSeferler.css";

export default function TamamlananSeferler() {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");

    useEffect(() => {
        fetchRows();
    }, []);

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

                <button className="dpa-refresh-btn" onClick={fetchRows} disabled={loading}>
                    {loading ? "Yükleniyor..." : "Yenile"}
                </button>
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
                                <th>Tamamlanma</th>
                                <th>Sefer No</th>
                                <th>Sevk Tarihi</th>
                                <th>Çekici</th>
                                <th>Dorse</th>
                                <th>Sürücü</th>
                                <th>Telefon</th>
                                <th>İrsaliye</th>
                                <th>Navlun</th>
                                <th>Tamamlayan</th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading && (
                                <tr>
                                    <td colSpan={10}>
                                        <div className="dpa-empty">
                                            <div className="dpa-loader" />
                                            <strong>Kayıtlar yükleniyor...</strong>
                                        </div>
                                    </td>
                                </tr>
                            )}

                            {!loading &&
                                filteredRows.map((item) => {
                                    const row = item.sefer_verisi || {};

                                    return (
                                        <tr key={item.id}>
                                            <td>{formatDate(item.created_at)}</td>
                                            <td>
                                                <span className="dpa-badge">
                                                    {row.seferNo || "—"}
                                                </span>
                                            </td>
                                            <td>{row.sevkTarihi || "—"}</td>
                                            <td>{row.cekici || "—"}</td>
                                            <td>{row.dorse || "—"}</td>
                                            <td>{row.surucu || "—"}</td>
                                            <td>{row.telefon || "—"}</td>
                                            <td>{row.irsaliyeNo || "—"}</td>
                                            <td>{row.navlun || "—"}</td>
                                            <td>{item.tamamlayan_kullanici_adi || "—"}</td>
                                        </tr>
                                    );
                                })}

                            {!loading && filteredRows.length === 0 && (
                                <tr>
                                    <td colSpan={10}>
                                        <div className="dpa-empty">
                                            <strong>Tamamlanan sefer bulunamadı.</strong>
                                            <p>Arama kriterini değiştirip tekrar deneyebilirsin.</p>
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