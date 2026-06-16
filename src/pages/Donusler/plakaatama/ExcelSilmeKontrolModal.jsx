export default function ExcelSilmeKontrolModal({
    deletedTripPrompt,
    setDeletedTripPrompt,
    deleteMissingTrips,
}) {
    if (!deletedTripPrompt) return null;

    return (
        <div className="modal-overlay">
            <div className="modern-panel revision-panel">
                <div className="modal-header">
                    <div>
                        <span className="modal-eyebrow">Excel Silme Kontrolü</span>
                        <strong>{deletedTripPrompt.count} sefer Excel’de yok</strong>
                        <p>
                            Bu seferler mevcut tabloda var ama içeri aktarılan Excel’de bulunmuyor.
                            Silmek ister misiniz?
                        </p>
                    </div>

                    <button
                        type="button"
                        className="modal-close"
                        onClick={() => setDeletedTripPrompt(null)}
                    >
                        ×
                    </button>
                </div>

                <div className="revision-list">
                    {deletedTripPrompt.rows.map((row) => (
                        <div className="revision-card" key={row.id}>
                            <div className="revision-card-head">
                                <strong>ID #{row.id}</strong>
                                <span>
                                    {row.seferNo || "Sefer No yok"} · {row.cekici || "Plaka yok"}
                                </span>
                            </div>

                            <small>
                                {row.surucu || "Sürücü yok"} / {row.varis1 || "Varış yok"} /{" "}
                                {row.aracDurumu || "Durum yok"}
                            </small>
                        </div>
                    ))}
                </div>

                <div className="complete-actions">
                    <button
                        type="button"
                        className="ghost-btn"
                        onClick={() => setDeletedTripPrompt(null)}
                    >
                        Hayır, Silme
                    </button>

                    <button
                        type="button"
                        className="complete-btn"
                        onClick={() => deleteMissingTrips(deletedTripPrompt.rows)}
                    >
                        Evet, Sil
                    </button>
                </div>
            </div>
        </div>
    );
}
