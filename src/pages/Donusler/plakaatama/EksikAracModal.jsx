export default function EksikAracModal({
    missingVehicles = [],
    setMissingVehicles,
    addMissingVehicle,
}) {
    if (!missingVehicles.length) return null;

    return (
        <div className="modal-overlay">
            <div className="modern-panel missing-vehicle-panel">
                <div className="modal-header">
                    <div>
                        <span className="modal-eyebrow">Araç listenizde bulunmuyor</span>
                        <strong>Yeni çekicileri eklemek ister misiniz?</strong>
                        <p>Excel’de gelen bazı çekiciler araçlar tablosunda yok.</p>
                    </div>

                    <button
                        type="button"
                        className="modal-close"
                        onClick={() => setMissingVehicles([])}
                    >
                        ×
                    </button>
                </div>

                <div className="missing-vehicle-list">
                    {missingVehicles.map((vehicle) => (
                        <div className="missing-vehicle-card" key={vehicle.cekici}>
                            <div>
                                <span className="vehicle-plate">{vehicle.cekici}</span>
                                <p>
                                    {vehicle.surucu || "Sürücü yok"} / {vehicle.dorse || "Dorse yok"}
                                </p>
                                <small>Araç listenizde bulunmuyor.</small>
                            </div>

                            <button
                                type="button"
                                onClick={() => addMissingVehicle(vehicle)}
                            >
                                Evet, tabloya kaydet
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}