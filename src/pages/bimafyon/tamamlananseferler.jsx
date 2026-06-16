import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import "./tamamlananseferler.css";

export default function TamamlananSeferler() {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [selectedRow, setSelectedRow] = useState(null);

    useEffect(() => {
        fetchCompletedTrips();
    }, []);

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

    const filteredRows = useMemo(() => {
        const value = search.toLowerCase().trim();
        if (!value) return rows;

        return rows.filter((item) => {
            const sefer = item.sefer_verisi || {};

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
    }, [rows, search]);

    function formatDate(value) {
        if (!value) return "—";
        return new Date(value).toLocaleString("tr-TR");
    }

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
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Sefer, plaka, sürücü, irsaliye ara..."
                        />

                        <button onClick={fetchCompletedTrips} disabled={loading}>
                            {loading ? "Yükleniyor..." : "Yenile"}
                        </button>
                    </div>
                </div>

                <div className="completed-count">
                    {filteredRows.length}/{rows.length} kayıt
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
                                <th>Tamamlayan</th>
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
                                            <span className="completed-id">
                                                {item.eski_sefer_id}
                                            </span>
                                        </td>
                                        <td>{sefer.seferNo || "—"}</td>
                                        <td>{sefer.cekici || "—"}</td>
                                        <td>{sefer.dorse || "—"}</td>
                                        <td>{sefer.surucu || "—"}</td>
                                        <td>{sefer.telefon || "—"}</td>
                                        <td>{sefer.varis1 || "—"}</td>
                                        <td>{sefer.irsaliyeNo || "—"}</td>
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
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedRow && (
                <div className="completed-modal-overlay">
                    <div className="completed-modal">
                        <div className="completed-modal-header">
                            <div>
                                <span className="completed-eyebrow">Sefer Detayı</span>
                                <h3>{selectedRow.sefer_verisi?.seferNo || "Sefer No yok"}</h3>
                                <p>
                                    {selectedRow.tamamlanma_nedeni || "Tamamlandı"} ·{" "}
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
                    </div>
                </div>
            )}
        </div>
    );
}