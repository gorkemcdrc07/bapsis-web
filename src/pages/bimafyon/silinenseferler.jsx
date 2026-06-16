import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import "./silinenseferler.css";

export default function SilinenSeferler() {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [selectedRow, setSelectedRow] = useState(null);

    useEffect(() => {
        fetchDeletedTrips();
    }, []);

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

    const filteredRows = useMemo(() => {
        const value = search.toLowerCase().trim();

        if (!value) return rows;

        return rows.filter((item) => {
            const sefer = item.sefer_verisi || {};

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
    }, [rows, search]);

    function formatDate(value) {
        if (!value) return "-";
        return new Date(value).toLocaleString("tr-TR");
    }

    return (
        <div className="deleted-trips-page">
            <div className="deleted-trips-card">
                <div className="deleted-trips-header">
                    <div>
                        <span className="deleted-eyebrow">Arşiv</span>
                        <h2>Silinen Seferler</h2>
                        <p>
                            Manuel veya Excel aktarımıyla silinen seferlerin arşiv kayıtları.
                        </p>
                    </div>

                    <div className="deleted-actions">
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="ID, sefer, plaka, sürücü ara..."
                        />

                        <button onClick={fetchDeletedTrips} disabled={loading}>
                            {loading ? "Yükleniyor..." : "Yenile"}
                        </button>
                    </div>
                </div>

                <div className="deleted-count">
                    {filteredRows.length}/{rows.length} kayıt
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
                            {filteredRows.map((item) => {
                                const sefer = item.sefer_verisi || {};

                                return (
                                    <tr key={item.id}>
                                        <td>
                                            <span className="deleted-id">
                                                {item.eski_sefer_id}
                                            </span>
                                        </td>
                                        <td>{sefer.seferNo || "-"}</td>
                                        <td>{sefer.cekici || "-"}</td>
                                        <td>{sefer.surucu || "-"}</td>
                                        <td>{sefer.varis1 || "-"}</td>
                                        <td>{sefer.aracDurumu || "-"}</td>
                                        <td>{item.silinme_nedeni || "-"}</td>
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

                            {!loading && filteredRows.length === 0 && (
                                <tr>
                                    <td colSpan="10" className="empty-cell">
                                        Silinen sefer kaydı bulunamadı.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedRow && (
                <div className="deleted-modal-overlay">
                    <div className="deleted-modal">
                        <div className="deleted-modal-header">
                            <div>
                                <span className="deleted-eyebrow">Silinen Sefer Detayı</span>
                                <h3>ID #{selectedRow.eski_sefer_id}</h3>
                                <p>
                                    {selectedRow.silinme_nedeni || "-"} ·{" "}
                                    {formatDate(selectedRow.created_at)}
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
                    </div>
                </div>
            )}
        </div>
    );
}