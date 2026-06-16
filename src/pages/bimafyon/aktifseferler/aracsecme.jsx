import { useEffect, useMemo, useState } from "react";
import "./aracsecme.css";

const emptySelection = {
    type: null,
    scope: null,
};

export default function AracSecme({
    open,
    araclar = [],
    mevcutSatir = null,
    onClose,
    onSelect,
}) {
    const [search, setSearch] = useState("");
    const [step, setStep] = useState("decision");
    const [selection, setSelection] = useState(emptySelection);

    const satirDoluMu = useMemo(() => {
        if (!mevcutSatir) return false;

        return Boolean(
            mevcutSatir.cekici ||
            mevcutSatir.dorse ||
            mevcutSatir.surucu ||
            mevcutSatir.telefon ||
            mevcutSatir.tc
        );
    }, [mevcutSatir]);

    useEffect(() => {
        if (!open) return;

        setSearch("");
        setSelection(emptySelection);
        setStep(satirDoluMu ? "decision" : "list");
    }, [open, satirDoluMu]);

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
            ]
                .filter(Boolean)
                .join(" ")
                .toLocaleLowerCase("tr-TR")
                .includes(value)
        );
    }, [araclar, search]);

    const handleFullVehicleChange = () => {
        setSelection({
            type: "vehicle-change",
            scope: "row",
        });
        setStep("list");
    };

    const handleDriverChange = () => {
        setStep("scope");
    };

    const handleScopeSelect = (scope) => {
        setSelection({
            type: "driver-change",
            scope,
        });
        setStep("list");
    };

    const handleSelect = (arac) => {
        onSelect?.(arac, selection);
    };

    const handleBack = () => {
        setSearch("");

        if (step === "scope") {
            setStep("decision");
            return;
        }

        if (step === "list" && satirDoluMu) {
            if (selection.type === "driver-change") {
                setStep("scope");
            } else {
                setStep("decision");
            }

            setSelection(emptySelection);
        }
    };

    const handleOverlayMouseDown = (event) => {
        if (event.target === event.currentTarget) {
            onClose?.();
        }
    };

    const stopModalEvent = (event) => {
        event.stopPropagation();
    };

    const title =
        step === "decision"
            ? "Bu satırda araç bilgisi var"
            : step === "scope"
                ? "Şoför değişikliği nasıl olsun?"
                : selection.type === "driver-change"
                    ? "Yeni şoförü seç"
                    : "Çekici / Dorse seç";

    const description =
        step === "decision"
            ? "Devam etmeden önce yapmak istediğin işlemi seç."
            : step === "scope"
                ? "Temelli değişiklik tabloya kaydedilir, sefere özel değişiklik sadece bu satırda kalır."
                : selection.type === "driver-change"
                    ? "Seçeceğin kayıttaki şoför, TC ve telefon bilgileri kullanılacak."
                    : "Seçim yapınca çekici, dorse, sürücü, TC, telefon ve VKN otomatik doldurulur.";

    if (!open) return null;

    return (
        <div className="arac-modal-overlay" onMouseDown={handleOverlayMouseDown}>
            <div
                className="arac-modal"
                onMouseDown={stopModalEvent}
                onClick={stopModalEvent}
            >
                <div className="arac-modal-header">
                    <div className="arac-title-area">
                        <span className="arac-kicker">Araç Seçimi</span>
                        <h2>{title}</h2>
                        <p>{description}</p>
                    </div>

                    <button type="button" className="arac-close-btn" onClick={onClose}>
                        ×
                    </button>
                </div>

                {satirDoluMu && (
                    <div className="arac-current-box">
                        <span>Mevcut satır</span>

                        <div className="arac-current-grid">
                            <strong>{mevcutSatir?.cekici || "Çekici yok"}</strong>
                            <strong>{mevcutSatir?.dorse || "Dorse yok"}</strong>
                            <p>{mevcutSatir?.surucu || "Sürücü yok"}</p>
                            <p>{mevcutSatir?.telefon || "Telefon yok"}</p>
                            <p>TC: {mevcutSatir?.tc || "—"}</p>
                        </div>
                    </div>
                )}

                {step === "decision" && (
                    <div className="arac-choice-wrap">
                        <button
                            type="button"
                            className="arac-choice-card"
                            onClick={handleFullVehicleChange}
                        >
                            <div className="arac-choice-icon">🚛</div>
                            <div>
                                <strong>Komple araç değişikliği</strong>
                                <p>Çekici, dorse, sürücü, telefon ve TC alanları değişir.</p>
                            </div>
                        </button>

                        <button
                            type="button"
                            className="arac-choice-card"
                            onClick={handleDriverChange}
                        >
                            <div className="arac-choice-icon">👤</div>
                            <div>
                                <strong>Mevcut aracı başka şoföre ver</strong>
                                <p>Çekici ve dorse aynı kalır, sadece şoför bilgileri değişir.</p>
                            </div>
                        </button>
                    </div>
                )}

                {step === "scope" && (
                    <div className="arac-choice-wrap">
                        <button
                            type="button"
                            className="arac-choice-card"
                            onClick={() => handleScopeSelect("permanent")}
                        >
                            <div className="arac-choice-icon">📌</div>
                            <div>
                                <strong>Temelli değişiklik</strong>
                                <p>Bu şoför değişikliği tabloya da kaydedilir.</p>
                            </div>
                        </button>

                        <button
                            type="button"
                            className="arac-choice-card"
                            onClick={() => handleScopeSelect("trip-only")}
                        >
                            <div className="arac-choice-icon">🧾</div>
                            <div>
                                <strong>Sefere özel değişiklik</strong>
                                <p>Sadece bu satırda uygulanır, ana tabloya kaydedilmez.</p>
                            </div>
                        </button>

                        <button type="button" className="arac-back-btn" onClick={handleBack}>
                            Geri dön
                        </button>
                    </div>
                )}

                {step === "list" && (
                    <>
                        <div className="arac-toolbar">
                            {satirDoluMu && (
                                <button
                                    type="button"
                                    className="arac-back-mini"
                                    onClick={handleBack}
                                >
                                    ← Geri
                                </button>
                            )}

                            <div className="arac-search-wrap">
                                <span className="arac-search-icon">⌕</span>
                                <input
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Plaka, sürücü, TC, telefon veya VKN ara..."
                                    autoFocus
                                />
                            </div>

                            <div className="arac-count-badge">
                                <strong>{filteredAraclar.length}</strong>
                                <span>kayıt</span>
                            </div>
                        </div>

                        <div className="arac-grid-list">
                            {filteredAraclar.map((arac) => (
                                <button
                                    type="button"
                                    key={arac.id}
                                    className="arac-card"
                                    onClick={() => handleSelect(arac)}
                                >
                                    <div className="arac-card-top">
                                        <div className="arac-card-icon">
                                            {(arac.cekici || "?").slice(0, 1)}
                                        </div>

                                        <div className="arac-plates">
                                            <strong>{arac.cekici || "Çekici yok"}</strong>
                                            <span>{arac.dorse || "Dorse yok"}</span>
                                        </div>

                                        <div className="arac-select-pill">Seç</div>
                                    </div>

                                    <div className="arac-driver">
                                        <span>Sürücü</span>
                                        <strong>{arac.surucu || "Sürücü yok"}</strong>
                                    </div>

                                    <div className="arac-meta">
                                        <span>📞 {arac.telefon || "—"}</span>
                                        <span>TC: {arac.tc || "—"}</span>
                                        <span>VKN: {arac.vkn || "—"}</span>
                                    </div>
                                </button>
                            ))}

                            {filteredAraclar.length === 0 && (
                                <div className="arac-empty">
                                    <div>🚛</div>
                                    <strong>Kayıt bulunamadı</strong>
                                    <p>Arama kelimesini değiştirerek tekrar deneyin.</p>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}