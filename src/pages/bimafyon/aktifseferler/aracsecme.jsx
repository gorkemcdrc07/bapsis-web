import { useEffect, useMemo, useState } from "react";
import "./aracsecme.css";

const emptySelection = {
    type: "vehicle-change",
    scope: "row",
};

export default function AracSecme({
    open,
    araclar = [],
    mevcutSatir = null,
    onClose,
    onSelect,
}) {
    const [search, setSearch] = useState("");
    const [selection, setSelection] = useState(emptySelection);

    const satirDoluMu = useMemo(() => {
        if (!mevcutSatir) return false;

        return Boolean(
            mevcutSatir.cekici ||
            mevcutSatir.dorse ||
            mevcutSatir.surucu ||
            mevcutSatir.telefon ||
            mevcutSatir.tc ||
            mevcutSatir.datalogerNo
        );
    }, [mevcutSatir]);

    useEffect(() => {
        if (!open) return;

        setSearch("");
        setSelection(emptySelection);
    }, [open]);

    useEffect(() => {
        if (!open) return;

        const handleKeyDown = (event) => {
            if (event.key === "Escape") onClose?.();
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [open, onClose]);

    const filteredAraclar = useMemo(() => {
        const value = search.toLocaleLowerCase("tr-TR").trim();

        if (!value) return araclar;

        return araclar.filter((item) =>
            [
                item.cekici,
                item.dorse,
                item.surucu,
                item.tc,
                item.telefon,
                item.vkn,
                item.datalogerNo,
            ]
                .filter(Boolean)
                .join(" ")
                .toLocaleLowerCase("tr-TR")
                .includes(value)
        );
    }, [araclar, search]);

    const handleOverlayMouseDown = (event) => {
        if (event.target === event.currentTarget) {
            onClose?.();
        }
    };

    if (!open) return null;

    return (
        <div className="modern-picker-overlay" onMouseDown={handleOverlayMouseDown}>
            <div className="modern-picker">

                {/* SOL PANEL */}
                <aside className="modern-picker-side">
                    <div className="modern-picker-brand">
                        <span className="modern-badge">Panel</span>
                        <h2>Araç Seçimi</h2>
                        <p>Aktif sefere uygulanacak değişiklik modunu belirleyin.</p>
                    </div>

                    {satirDoluMu && (
                        <div className="modern-current-box">
                            <div className="modern-box-header">
                                <span className="modern-pulse"></span>
                                <small>Şu Anki Seçili Satır</small>
                            </div>
                            <div className="modern-box-body">
                                <strong>{mevcutSatir?.cekici || "Plaka Belirtilmemiş"}</strong>
                                {mevcutSatir?.surucu && <span>👤 {mevcutSatir.surucu}</span>}
                            </div>
                        </div>
                    )}

                    <div className="modern-mode-list">
                        <button
                            type="button"
                            className={`modern-mode-btn ${selection.type === "vehicle-change" ? "active" : ""}`}
                            onClick={() => setSelection({ type: "vehicle-change", scope: "row" })}
                        >
                            <span className="mode-emoji">🚛</span>
                            <div className="mode-details">
                                <b>Komple Değişim</b>
                                <p>Tüm araç ve sürücü verileri sıfırlanıp yenilenir.</p>
                            </div>
                            <span className="mode-check">✓</span>
                        </button>

                        <button
                            type="button"
                            className={`modern-mode-btn ${selection.type === "driver-change" && selection.scope === "trip-only" ? "active" : ""}`}
                            onClick={() => setSelection({ type: "driver-change", scope: "trip-only" })}
                        >
                            <span className="mode-emoji">👤</span>
                            <div className="mode-details">
                                <b>Geçici Şoför</b>
                                <p>Sadece bu tura özel şoför atanır, araç kartı korunur.</p>
                            </div>
                            <span className="mode-check">✓</span>
                        </button>

                        <button
                            type="button"
                            className={`modern-mode-btn ${selection.type === "driver-change" && selection.scope === "permanent" ? "active" : ""}`}
                            onClick={() => setSelection({ type: "driver-change", scope: "permanent" })}
                        >
                            <span className="mode-emoji">📌</span>
                            <div className="mode-details">
                                <b>Kalıcı Şoför</b>
                                <p>Değişiklik sistemdeki ana araç kartına kalıcı işlenir.</p>
                            </div>
                            <span className="mode-check">✓</span>
                        </button>
                    </div>
                </aside>

                {/* SAĞ PANEL */}
                <section className="modern-picker-main">
                    <div className="modern-picker-header">
                        <div>
                            <h3>Uygun Araç Listesi</h3>
                            <p className="modern-counter">
                                Arama kriterlerine uyan <span>{filteredAraclar.length}</span> araç var
                            </p>
                        </div>
                        <button type="button" className="modern-close-btn" onClick={onClose} aria-label="Kapat">
                            ✕
                        </button>
                    </div>

                    <div className="modern-search-wrapper">
                        <div className="modern-search-box">
                            <span className="modern-search-icon">✨</span>
                            <input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Plaka, isim, telefon veya cihaz no yazın..."
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* SCROLL EDİLEBİLİR ALAN */}
                    <div className="modern-list-container">
                        {filteredAraclar.map((arac) => (
                            <div key={arac.id} className="modern-vehicle-card">
                                <div className="modern-plate-tag">
                                    <span className="plate-tr">TR</span>
                                    <strong>{arac.cekici || "—"}</strong>
                                    <small>{arac.dorse || "Dorse Yok"}</small>
                                </div>

                                <div className="modern-driver-info">
                                    <h4>{arac.surucu || "Sürücü Atanmamış"}</h4>
                                    <p>📱 {arac.telefon || "Telefon numarası yok"}</p>
                                </div>

                                <div className="modern-badges-group">
                                    {arac.tc && <span className="pastel-badge text-purple">🆔 {arac.tc}</span>}
                                    {arac.datalogerNo ? (
                                        <span className="pastel-badge text-green">📡 {arac.datalogerNo}</span>
                                    ) : (
                                        <span className="pastel-badge text-rose">📡 Cihaz Yok</span>
                                    )}
                                </div>

                                <div className="modern-action-area">
                                    <button
                                        type="button"
                                        className="modern-select-btn"
                                        onClick={() => onSelect?.(arac, selection)}
                                    >
                                        Seç
                                    </button>
                                </div>
                            </div>
                        ))}

                        {filteredAraclar.length === 0 && (
                            <div className="modern-empty-state">
                                <div className="modern-empty-illustration">🍃</div>
                                <h3>Sonuç Bulunamadı</h3>
                                <p>Farklı anahtar kelimelerle veya plakayla aramayı deneyebilirsiniz.</p>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}