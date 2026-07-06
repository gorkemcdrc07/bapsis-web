import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { supabase } from "../../../lib/supabaseClient";

function PopRow({ iconBg, iconColor, icon, label, sublabel, onClick, danger }) {
    return (
        <button
            onClick={onClick}
            style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 12px",
                border: 0,
                background: "transparent",
                cursor: "pointer",
                textAlign: "left",
            }}
        >
            <span
                style={{
                    width: 30,
                    height: 30,
                    borderRadius: 8,
                    background: iconBg,
                    color: iconColor,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 15,
                    flexShrink: 0,
                }}
            >
                {icon}
            </span>

            <div style={{ minWidth: 0 }}>
                <div
                    style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: danger ? "#dc2626" : "#111827",
                        whiteSpace: "nowrap",
                    }}
                >
                    {label}
                </div>

                {sublabel && (
                    <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 1 }}>
                        {sublabel}
                    </div>
                )}
            </div>
        </button>
    );
}

export default function SatirIslemMenusu({
    openActionRowId,
    actionMenuPosition,
    selectedActionRow,
    setAracPanelRow,
    deleteTrip,
    araclar = [],
    fetchAraclar,
    updateLocalRowVkn,

    canSelectVehicle = false,
    canUpdateVkn = false,
    canDelete = false,
}) {
    const [showVknModal, setShowVknModal] = useState(false);
    const [modalRow, setModalRow] = useState(null);
    const [selectedVkn, setSelectedVkn] = useState("");

    const vknOptions = useMemo(() => {
        return [
            ...new Set(
                araclar
                    .map((arac) => String(arac.vkn ?? "").trim())
                    .filter(Boolean)
            ),
        ];
    }, [araclar]);

    if ((!openActionRowId || !actionMenuPosition || !selectedActionRow) && !showVknModal) {
        return null;
    }

    function openVknModal() {
        if (!canUpdateVkn) return;

        setModalRow(selectedActionRow);
        setSelectedVkn(selectedActionRow.vkn ?? "");
        setShowVknModal(true);
    }

    function closeVknModal() {
        setShowVknModal(false);
        setModalRow(null);
        setSelectedVkn("");
    }

    async function saveVknChange(isPermanent) {
        if (!canUpdateVkn) {
            alert("VKN değiştirme yetkiniz yok.");
            return;
        }

        if (!modalRow) return;

        if (!selectedVkn) {
            alert("Lütfen VKN seçin.");
            return;
        }

        if (isPermanent) {
            const { error: aracError } = await supabase
                .from("araclar")
                .update({ vkn: selectedVkn })
                .eq("cekici", modalRow.cekici);

            if (aracError) {
                alert(`Araç VKN güncellenemedi: ${aracError.message}`);
                return;
            }

            await fetchAraclar();
        }

        const { error: seferError } = await supabase
            .from("aktif_seferler")
            .update({ vkn: selectedVkn })
            .eq("id", modalRow.id);

        if (seferError) {
            alert(`Sefer VKN güncellenemedi: ${seferError.message}`);
            return;
        }

        if (updateLocalRowVkn) {
            updateLocalRowVkn(modalRow.id, selectedVkn);
        }

        closeVknModal();
    }

    return createPortal(
        <>
            {openActionRowId && actionMenuPosition && selectedActionRow && !showVknModal && (
                <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        position: "fixed",
                        top: actionMenuPosition.top,
                        left: actionMenuPosition.left,
                        zIndex: 99999,
                        width: 220,
                        borderRadius: 14,
                        background: "#ffffff",
                        border: "0.5px solid #e5e7eb",
                        boxShadow: "0 8px 32px rgba(15, 23, 42, 0.14)",
                        overflow: "hidden",
                        padding: "4px 0",
                        transform: "translateX(-50%)",
                    }}
                >
                    <div
                        style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: "#9ca3af",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            padding: "6px 12px 8px",
                        }}
                    >
                        İşlemler
                    </div>

                    {canSelectVehicle && (
                        <PopRow
                            iconBg="#eff6ff"
                            iconColor="#1d4ed8"
                            icon={
                                <svg
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <rect x="1" y="3" width="15" height="13" rx="2" />
                                    <path d="M16 8h4l3 5v3h-7V8z" />
                                    <circle cx="5.5" cy="18.5" r="2.5" />
                                    <circle cx="18.5" cy="18.5" r="2.5" />
                                </svg>
                            }
                            label="Araç değiştir"
                            sublabel="Çekici / dorse ata"
                            onClick={() => setAracPanelRow(selectedActionRow)}
                        />
                    )}

                    {canUpdateVkn && (
                        <PopRow
                            iconBg="#fffbeb"
                            iconColor="#b45309"
                            icon={
                                <svg
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                    <polyline points="14 2 14 8 20 8" />
                                    <line x1="16" y1="13" x2="8" y2="13" />
                                    <line x1="16" y1="17" x2="8" y2="17" />
                                    <line x1="10" y1="9" x2="8" y2="9" />
                                </svg>
                            }
                            label="VKN değiştir"
                            sublabel="Temelli veya sefere özel"
                            onClick={openVknModal}
                        />
                    )}

                    {(canSelectVehicle || canUpdateVkn) && canDelete && (
                        <div
                            style={{
                                height: "0.5px",
                                background: "#f1f5f9",
                                margin: "3px 0",
                            }}
                        />
                    )}

                    {canDelete && (
                        <PopRow
                            iconBg="#fef2f2"
                            iconColor="#dc2626"
                            icon={
                                <svg
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <polyline points="3 6 5 6 21 6" />
                                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                    <path d="M10 11v6" />
                                    <path d="M14 11v6" />
                                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                                </svg>
                            }
                            label="Seferi sil"
                            sublabel="Kaydı listeden kaldır"
                            danger
                            onClick={() => deleteTrip(selectedActionRow)}
                        />
                    )}

                    {!canSelectVehicle && !canUpdateVkn && !canDelete && (
                        <div style={{ padding: "10px 12px", fontSize: 12, color: "#9ca3af" }}>
                            Bu satır için işlem yetkiniz yok.
                        </div>
                    )}
                </div>
            )}

            {showVknModal && (
                <div
                    onClick={closeVknModal}
                    style={{
                        position: "fixed",
                        inset: 0,
                        zIndex: 999999,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 16,
                        background: "rgba(15, 23, 42, 0.45)",
                        backdropFilter: "blur(8px)",
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            width: "min(460px, 100%)",
                            borderRadius: 24,
                            background: "#ffffff",
                            border: "0.5px solid #e5e7eb",
                            boxShadow: "0 24px 64px rgba(15, 23, 42, 0.18)",
                            overflow: "hidden",
                        }}
                    >
                        <div
                            style={{
                                padding: "18px 20px 16px",
                                borderBottom: "0.5px solid #f1f5f9",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "flex-start",
                                    justifyContent: "space-between",
                                    gap: 12,
                                }}
                            >
                                <div>
                                    <div
                                        style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: 6,
                                            fontSize: 11,
                                            fontWeight: 700,
                                            color: "#b45309",
                                            background: "#fffbeb",
                                            border: "0.5px solid #fde68a",
                                            borderRadius: 6,
                                            padding: "3px 9px",
                                            marginBottom: 8,
                                            textTransform: "uppercase",
                                            letterSpacing: "0.04em",
                                        }}
                                    >
                                        VKN işlemi
                                    </div>

                                    <div
                                        style={{
                                            fontSize: 18,
                                            fontWeight: 700,
                                            color: "#0f172a",
                                            lineHeight: 1.2,
                                        }}
                                    >
                                        VKN Değiştir
                                    </div>

                                    <div
                                        style={{
                                            fontSize: 13,
                                            color: "#64748b",
                                            marginTop: 4,
                                        }}
                                    >
                                        Araç kartına mı kaydedilsin, yoksa sadece bu sefere özel mi olsun?
                                    </div>
                                </div>

                                <button
                                    onClick={closeVknModal}
                                    style={{
                                        width: 34,
                                        height: 34,
                                        borderRadius: 10,
                                        border: "0.5px solid #e5e7eb",
                                        background: "#f8fafc",
                                        color: "#6b7280",
                                        fontSize: 18,
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        flexShrink: 0,
                                    }}
                                >
                                    ×
                                </button>
                            </div>
                        </div>

                        <div style={{ padding: "16px 20px 20px" }}>
                            <div style={{ marginBottom: 16 }}>
                                <label
                                    style={{
                                        display: "block",
                                        fontSize: 11,
                                        fontWeight: 700,
                                        color: "#6b7280",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.04em",
                                        marginBottom: 6,
                                    }}
                                >
                                    VKN seç
                                </label>

                                <select
                                    value={selectedVkn}
                                    onChange={(e) => setSelectedVkn(e.target.value)}
                                    style={{
                                        width: "100%",
                                        height: 42,
                                        borderRadius: 10,
                                        border: "0.5px solid #d1d5db",
                                        background: "#f9fafb",
                                        color: "#111827",
                                        fontSize: 13,
                                        fontWeight: 600,
                                        padding: "0 12px",
                                        outline: "none",
                                        cursor: "pointer",
                                        boxSizing: "border-box",
                                    }}
                                >
                                    <option value="">— VKN seçin —</option>

                                    {vknOptions.map((vkn) => (
                                        <option key={vkn} value={vkn}>
                                            {vkn}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {selectedActionRow?.cekici && (
                                <div
                                    style={{
                                        padding: "10px 12px",
                                        borderRadius: 10,
                                        background: "#f8fafc",
                                        border: "0.5px solid #e5e7eb",
                                        marginBottom: 16,
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8,
                                    }}
                                >
                                    <div
                                        style={{
                                            width: 28,
                                            height: 28,
                                            borderRadius: 7,
                                            background: "#eff6ff",
                                            color: "#1d4ed8",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            fontSize: 14,
                                            flexShrink: 0,
                                        }}
                                    >
                                        🚛
                                    </div>

                                    <div>
                                        <div style={{ fontSize: 11, color: "#9ca3af" }}>
                                            Çekici
                                        </div>

                                        <div
                                            style={{
                                                fontSize: 13,
                                                fontWeight: 700,
                                                color: "#0f172a",
                                            }}
                                        >
                                            {selectedActionRow.cekici}
                                        </div>
                                    </div>

                                    {selectedActionRow.vkn && (
                                        <>
                                            <div
                                                style={{
                                                    width: "0.5px",
                                                    height: 28,
                                                    background: "#e5e7eb",
                                                    margin: "0 4px",
                                                }}
                                            />

                                            <div>
                                                <div style={{ fontSize: 11, color: "#9ca3af" }}>
                                                    Mevcut VKN
                                                </div>

                                                <div
                                                    style={{
                                                        fontSize: 13,
                                                        fontWeight: 700,
                                                        color: "#0f172a",
                                                    }}
                                                >
                                                    {selectedActionRow.vkn}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 1fr",
                                    gap: 8,
                                }}
                            >
                                <button
                                    onClick={() => saveVknChange(true)}
                                    style={{
                                        height: 44,
                                        borderRadius: 10,
                                        border: "0.5px solid #bfdbfe",
                                        background: "#eff6ff",
                                        color: "#1d4ed8",
                                        fontSize: 13,
                                        fontWeight: 700,
                                        cursor: "pointer",
                                    }}
                                >
                                    Temelli değiştir
                                </button>

                                <button
                                    onClick={() => saveVknChange(false)}
                                    style={{
                                        height: 44,
                                        borderRadius: 10,
                                        border: "0.5px solid #e5e7eb",
                                        background: "#f9fafb",
                                        color: "#374151",
                                        fontSize: 13,
                                        fontWeight: 700,
                                        cursor: "pointer",
                                    }}
                                >
                                    Sefere özel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>,
        document.body
    );
}