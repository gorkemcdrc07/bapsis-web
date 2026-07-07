import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContext";
import "./navlunsart.css";

const PAGE_KEY = "ekkayit_navlun";

const BUTTONS = {
    EDIT_ROW: "Satırı Düzenle",
    SAVE: "Kaydet",
    CANCEL: "Vazgeç",
    TOGGLE_STATUS: "Durum Değiştir",
    UPDATE_PRICE: "Fiyat Güncelle",
};

const COLUMNS = {
    ID: "ID",
    VARIS1: "Varış 1",
    VARIS2: "Varış 2",
    VARIS3: "Varış 3",
    FIYAT: "Fiyat",
    DURUM: "Durum",
    KAYIT: "Kayıt",
};

export default function NavlunSart() {
    const { canPage, canButton, canColumn } = useAuth();

    const canViewPage = canPage(PAGE_KEY);
    const canEditRow = canButton(PAGE_KEY, BUTTONS.EDIT_ROW);
    const canSave = canButton(PAGE_KEY, BUTTONS.SAVE);
    const canCancel = canButton(PAGE_KEY, BUTTONS.CANCEL);
    const canToggleStatus = canButton(PAGE_KEY, BUTTONS.TOGGLE_STATUS);
    const canUpdatePrice = canButton(PAGE_KEY, BUTTONS.UPDATE_PRICE);

    const showId = canColumn(PAGE_KEY, COLUMNS.ID);
    const showVaris1 = canColumn(PAGE_KEY, COLUMNS.VARIS1);
    const showVaris2 = canColumn(PAGE_KEY, COLUMNS.VARIS2);
    const showVaris3 = canColumn(PAGE_KEY, COLUMNS.VARIS3);
    const showFiyat = canColumn(PAGE_KEY, COLUMNS.FIYAT);
    const showDurum = canColumn(PAGE_KEY, COLUMNS.DURUM);
    const showKayit = canColumn(PAGE_KEY, COLUMNS.KAYIT);

    const [rows, setRows] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [savingId, setSavingId] = useState(null);
    const [editingRowId, setEditingRowId] = useState(null);
    const [editDraft, setEditDraft] = useState(null);

    useEffect(() => {
        if (canViewPage) fetchRows();
    }, [canViewPage]);

    async function fetchRows() {
        setLoading(true);

        const { data, error } = await supabase
            .from("navlunlar")
            .select("*")
            .order("id", { ascending: true });

        setLoading(false);

        if (error) {
            console.error(error);
            alert("Navlun verileri alınamadı.");
            return;
        }

        setRows(data || []);
    }

    async function updateRow(row, changes, permissionType = "default") {
        if (permissionType === "price" && !canUpdatePrice) {
            alert("Fiyat güncelleme yetkiniz yok.");
            return;
        }

        if (permissionType === "status" && !canToggleStatus) {
            alert("Durum değiştirme yetkiniz yok.");
            return;
        }

        if (permissionType === "edit" && !canSave) {
            alert("Kaydetme yetkiniz yok.");
            return;
        }

        const updatedRow = {
            ...row,
            ...changes,
            guncellendigi_alan: Object.keys(changes).join(", "),
            guncellenme_tarihi: new Date().toLocaleString("tr-TR"),
        };

        setRows((prev) =>
            prev.map((item) => (item.id === row.id ? updatedRow : item))
        );

        setSavingId(row.id);

        const { error } = await supabase
            .from("navlunlar")
            .update({
                ...changes,
                guncellendigi_alan: Object.keys(changes).join(", "),
                guncellenme_tarihi: new Date().toLocaleString("tr-TR"),
            })
            .eq("id", row.id);

        setSavingId(null);

        if (error) {
            console.error(error);
            alert("Güncelleme başarısız oldu.");
            fetchRows();
        }
    }

    function startRowEdit(row) {
        if (!canEditRow) {
            alert("Satır düzenleme yetkiniz yok.");
            return;
        }

        setEditingRowId(row.id);
        setEditDraft({
            varis1: row.varis1 || "",
            varis2: row.varis2 || "",
            varis3: row.varis3 || "",
        });
    }

    function cancelRowEdit() {
        if (!canCancel) {
            alert("Vazgeçme yetkiniz yok.");
            return;
        }

        setEditingRowId(null);
        setEditDraft(null);
    }

    function changeDraftField(field, value) {
        setEditDraft((prev) => ({
            ...prev,
            [field]: value,
        }));
    }

    async function saveRowEdit(row) {
        if (!canSave) {
            alert("Kaydetme yetkiniz yok.");
            return;
        }

        await updateRow(
            row,
            {
                varis1: editDraft.varis1.trim(),
                varis2: editDraft.varis2.trim(),
                varis3: editDraft.varis3.trim(),
            },
            "edit"
        );

        setEditingRowId(null);
        setEditDraft(null);
    }

    const filteredRows = useMemo(() => {
        const q = search.toLowerCase().trim();

        if (!q) return rows;

        return rows.filter((row) =>
            [
                row.id,
                row.varis1,
                row.varis2,
                row.varis3,
                row.fiyat,
                row.aktif ? "aktif açık" : "pasif kapalı",
            ]
                .join(" ")
                .toLowerCase()
                .includes(q)
        );
    }, [rows, search]);

    const aktifSayisi = useMemo(
        () => rows.filter((row) => row.aktif).length,
        [rows]
    );

    const canShowActions = canEditRow || canSave || canCancel;

    const colSpan =
        [
            showId,
            showVaris1,
            showVaris2,
            showVaris3,
            showFiyat,
            showDurum,
            showKayit,
            canShowActions,
        ].filter(Boolean).length || 1;

    if (!canViewPage) {
        return (
            <div className="navlun-sart-page">
                <div className="navlun-sart-shell">
                    <section className="navlun-sart-panel">
                        <div className="empty-row">
                            <span className="empty-state">
                                Bu sayfayı görüntüleme yetkiniz yok.
                            </span>
                        </div>
                    </section>
                </div>
            </div>
        );
    }

    return (
        <div className="navlun-sart-page">
            <div className="navlun-sart-shell">
                <header className="navlun-sart-header">
                    <div className="navlun-sart-header-text">
                        <span className="navlun-sart-eyebrow">Operasyon · Fiyat ve Durum</span>
                        <h1>Navlun Şartları</h1>
                        <p>{filteredRows.length} navlun kaydı listeleniyor</p>
                    </div>

                    <div className="navlun-sart-header-right">
                        <div className="navlun-sart-header-meta">
                            <div className="meta-chip">
                                <span className="meta-chip-value">{rows.length}</span>
                                <span className="meta-chip-label">Toplam Kayıt</span>
                            </div>

                            <div className="meta-chip meta-chip-accent">
                                <span className="meta-chip-value">{aktifSayisi}</span>
                                <span className="meta-chip-label">Aktif Navlun</span>
                            </div>
                        </div>

                        <div className="search-field">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.6" />
                                <path d="m20 20-3.2-3.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                            </svg>

                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Varış, fiyat veya durum ara..."
                                aria-label="Navlun kayıtlarında ara"
                            />
                        </div>
                    </div>
                </header>

                <section className="navlun-sart-panel">
                    <div className="panel-title">
                        <div>
                            <h2>Navlunlar Tablosu</h2>
                            <p>
                                Fiyat ve aktiflik değişiklikleri yetkiye göre yapılır.
                                Varışları düzenlemek için satırdaki düzenle butonunu kullanın.
                            </p>
                        </div>
                    </div>

                    <div className="navlun-table-wrap">
                        <table className="navlun-sart-table">
                            <thead>
                                <tr>
                                    {showId && <th>ID</th>}
                                    {showVaris1 && <th>Varış 1</th>}
                                    {showVaris2 && <th>Varış 2</th>}
                                    {showVaris3 && <th>Varış 3</th>}
                                    {showFiyat && <th>Fiyat</th>}
                                    {showDurum && <th>Durum</th>}
                                    {showKayit && <th>Kayıt</th>}
                                    {canShowActions && <th className="th-actions">Satır</th>}
                                </tr>
                            </thead>

                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={colSpan} className="empty-row">
                                            <span className="empty-state">
                                                <span className="spinner" aria-hidden="true" />
                                                Yükleniyor...
                                            </span>
                                        </td>
                                    </tr>
                                ) : filteredRows.length === 0 ? (
                                    <tr>
                                        <td colSpan={colSpan} className="empty-row">
                                            <span className="empty-state">Kayıt bulunamadı.</span>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredRows.map((row) => {
                                        const isEditing = editingRowId === row.id;
                                        const isSaving = savingId === row.id;

                                        return (
                                            <tr key={row.id} className={isEditing ? "row-editing" : ""}>
                                                {showId && <td className="id-cell">#{row.id}</td>}

                                                {showVaris1 && (
                                                    <td>
                                                        {isEditing ? (
                                                            <input
                                                                className="row-edit-input"
                                                                value={editDraft.varis1}
                                                                onChange={(e) =>
                                                                    changeDraftField("varis1", e.target.value)
                                                                }
                                                                aria-label="Varış 1"
                                                            />
                                                        ) : (
                                                            row.varis1 || "-"
                                                        )}
                                                    </td>
                                                )}

                                                {showVaris2 && (
                                                    <td>
                                                        {isEditing ? (
                                                            <input
                                                                className="row-edit-input"
                                                                value={editDraft.varis2}
                                                                onChange={(e) =>
                                                                    changeDraftField("varis2", e.target.value)
                                                                }
                                                                aria-label="Varış 2"
                                                            />
                                                        ) : (
                                                            row.varis2 || "-"
                                                        )}
                                                    </td>
                                                )}

                                                {showVaris3 && (
                                                    <td>
                                                        {isEditing ? (
                                                            <input
                                                                className="row-edit-input"
                                                                value={editDraft.varis3}
                                                                onChange={(e) =>
                                                                    changeDraftField("varis3", e.target.value)
                                                                }
                                                                aria-label="Varış 3"
                                                            />
                                                        ) : (
                                                            row.varis3 || "-"
                                                        )}
                                                    </td>
                                                )}

                                                {showFiyat && (
                                                    <td>
                                                        <div className="amount-input">
                                                            <input
                                                                value={row.fiyat || ""}
                                                                onChange={(e) =>
                                                                    updateRow(
                                                                        row,
                                                                        { fiyat: e.target.value },
                                                                        "price"
                                                                    )
                                                                }
                                                                inputMode="numeric"
                                                                aria-label={`#${row.id} fiyat`}
                                                                disabled={!canUpdatePrice || isSaving}
                                                            />
                                                            <span>₺</span>
                                                        </div>
                                                    </td>
                                                )}

                                                {showDurum && (
                                                    <td>
                                                        <button
                                                            type="button"
                                                            role="switch"
                                                            aria-checked={!!row.aktif}
                                                            className={row.aktif ? "switch on" : "switch"}
                                                            onClick={() =>
                                                                updateRow(
                                                                    row,
                                                                    { aktif: !row.aktif },
                                                                    "status"
                                                                )
                                                            }
                                                            disabled={!canToggleStatus || isSaving}
                                                        >
                                                            <span className="switch-track">
                                                                <span className="switch-thumb" />
                                                            </span>
                                                        </button>
                                                    </td>
                                                )}

                                                {showKayit && (
                                                    <td>
                                                        <span
                                                            className={
                                                                isSaving
                                                                    ? "save-status saving"
                                                                    : "save-status saved"
                                                            }
                                                        >
                                                            {isSaving ? "Kaydediliyor..." : "Kaydedildi"}
                                                        </span>
                                                    </td>
                                                )}

                                                {canShowActions && (
                                                    <td>
                                                        {isEditing ? (
                                                            <div className="row-edit-actions">
                                                                {canSave && (
                                                                    <button
                                                                        type="button"
                                                                        className="row-save-btn"
                                                                        onClick={() => saveRowEdit(row)}
                                                                        disabled={isSaving}
                                                                    >
                                                                        Kaydet
                                                                    </button>
                                                                )}

                                                                {canCancel && (
                                                                    <button
                                                                        type="button"
                                                                        className="row-cancel-btn"
                                                                        onClick={cancelRowEdit}
                                                                        disabled={isSaving}
                                                                    >
                                                                        Vazgeç
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            canEditRow && (
                                                                <button
                                                                    type="button"
                                                                    className="row-edit-btn"
                                                                    onClick={() => startRowEdit(row)}
                                                                    aria-label={`#${row.id} satırını düzenle`}
                                                                    title="Satırı düzenle"
                                                                >
                                                                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                                                        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                                                                    </svg>
                                                                    Düzenle
                                                                </button>
                                                            )
                                                        )}
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </div>
    );
}