export default function CompleteTripModal({
    completePromptRow,
    completeDetailRow,
    setCompletePromptRow,
    setCompleteDetailRow,
    completeTrip,
}) {
    if (!completePromptRow) return null;

    return (
        <div className="modal-overlay">
            <div className="modern-panel complete-panel">
                <div className="complete-icon">✓</div>

                {!completeDetailRow ? (
                    <>
                        <div className="complete-content">
                            <span className="modal-eyebrow">Sefer bilgileri dolduruldu</span>
                            <strong>Detayları görmek ister misin?</strong>
                            <p>
                                Zorunlu alanlar tamamlandı. Varış alanları ve dataloger zorunlu değildir.
                            </p>
                        </div>

                        <div className="complete-actions">
                            <button
                                className="ghost-btn"
                                onClick={() => {
                                    setCompletePromptRow(null);
                                    setCompleteDetailRow(null);
                                }}
                            >
                                Daha Sonra
                            </button>

                            <button
                                className="complete-btn"
                                onClick={() => setCompleteDetailRow(completePromptRow)}
                            >
                                Detayları Göster
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="complete-content">
                            <span className="modal-eyebrow">Sefer Detayı</span>
                            <strong>{completeDetailRow.seferNo || "Sefer No yok"}</strong>
                            <p>
                                {completeDetailRow.cekici || "Plaka yok"} ·{" "}
                                {completeDetailRow.surucu || "Sürücü yok"}
                            </p>
                        </div>

                        <div className="completion-detail-grid">
                            <div><small>Sevk Tarihi</small><b>{completeDetailRow.sevkTarihi || "—"}</b></div>
                            <div><small>Yükleyen Depo</small><b>{completeDetailRow.yukleyenDepo || "—"}</b></div>
                            <div><small>Kalkış Yeri</small><b>{completeDetailRow.kalkisYeri || "—"}</b></div>
                            <div><small>Araç Cinsi</small><b>{completeDetailRow.aracCinsi || "—"}</b></div>
                            <div><small>Çekici</small><b>{completeDetailRow.cekici || "—"}</b></div>
                            <div><small>Dorse</small><b>{completeDetailRow.dorse || "—"}</b></div>
                            <div><small>TC</small><b>{completeDetailRow.tc || "—"}</b></div>
                            <div><small>Sürücü</small><b>{completeDetailRow.surucu || "—"}</b></div>
                            <div><small>Telefon</small><b>{completeDetailRow.telefon || "—"}</b></div>
                            <div><small>VKN</small><b>{completeDetailRow.faturaVkn || "—"}</b></div>
                            <div><small>Palet</small><b>{completeDetailRow.palet || "—"}</b></div>
                            <div><small>İrsaliye</small><b>{completeDetailRow.irsaliyeNo || "—"}</b></div>
                            <div><small>Navlun</small><b>{completeDetailRow.navlun || "—"}</b></div>
                            <div><small>Peron</small><b>{completeDetailRow.peronNo || "—"}</b></div>
                            <div><small>Durum</small><b>{completeDetailRow.aracDurumu || "—"}</b></div>
                        </div>

                        <div className="complete-actions">
                            <button
                                className="ghost-btn"
                                onClick={() => {
                                    setCompletePromptRow(null);
                                    setCompleteDetailRow(null);
                                }}
                            >
                                Düzenlemek İstiyorum
                            </button>

                            <button
                                className="complete-btn"
                                onClick={() => completeTrip(completeDetailRow)}
                            >
                                Tamamla
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}