export default function ExcelRevizyonModal({
    revisionChanges = [],
    setRevisionChanges,
}) {
    if (!revisionChanges.length) return null;

    return (
        <div className="modal-overlay">
            <div className="modern-panel revision-panel">
                <div className="modal-header">
                    <div>
                        <span className="modal-eyebrow">Excel Revizyon Özeti</span>
                        <strong>Güncellenen sütunlar</strong>
                        <p>
                            Aşağıdaki kayıtlar ID ile eşleşti ve sadece değişen hücreler güncellendi.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="modal-close"
                        onClick={() => setRevisionChanges([])}
                    >
                        ×
                    </button>
                </div>

                <div className="revision-list">
                    {revisionChanges.map((item) => (
                        <div className="revision-card" key={item.id}>
                            <div className="revision-card-head">
                                <strong>ID #{item.id}</strong>
                                <span>
                                    {item.seferNo || "Sefer No yok"} · {item.cekici || "Plaka yok"}
                                </span>
                            </div>

                            <div className="revision-change-grid">
                                {item.changes.map((change) => (
                                    <div className="revision-change" key={change.field}>
                                        <b>{change.label}</b>
                                        <small>
                                            <span>{String(change.oldValue || "—")}</span>
                                            <em>→</em>
                                            <span>{String(change.newValue || "—")}</span>
                                        </small>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}