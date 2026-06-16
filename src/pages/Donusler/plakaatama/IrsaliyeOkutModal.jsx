import QrOkutma from "./qrokutma.jsx";

export default function IrsaliyeOkutModal({
    showIrsaliyePanel,
    setShowIrsaliyePanel,
    fetchRows,
}) {
    if (!showIrsaliyePanel) return null;

    return (
        <div className="modal-overlay">
            <div className="modern-panel irsaliye-panel">
                <div className="modal-header">
                    <div>
                        <span className="modal-eyebrow">QR İşlemi</span>
                        <strong>İrsaliye Okut</strong>
                    </div>

                    <button
                        type="button"
                        className="modal-close"
                        onClick={() => setShowIrsaliyePanel(false)}
                    >
                        ×
                    </button>
                </div>

                <QrOkutma onSuccess={fetchRows} />
            </div>
        </div>
    );
}