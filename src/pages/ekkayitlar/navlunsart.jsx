import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import "./navlunsart.css";

export default function NavlunSart() {
    const [rows, setRows] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [savingId, setSavingId] = useState(null);
    const [editingRowId, setEditingRowId] = useState(null);
    const [editDraft, setEditDraft] = useState(null);

    useEffect(() => {
        fetchRows();
    }, []);

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

    async function updateRow(row, changes) {
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
        setEditingRowId(row.id);
        setEditDraft({
            varis1: row.varis1 || "",
            varis2: row.varis2 || "",
            varis3: row.varis3 || "",
        });
    }

    function cancelRowEdit() {
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
        await updateRow(row, {
            varis1: editDraft.varis1.trim(),
            varis2: editDraft.varis2.trim(),
            varis3: editDraft.varis3.trim(),
        });

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
                            <p>Fiyat ve aktiflik değişiklikleri otomatik kaydedilir. Varışları düzenlemek için satırdaki kalem simgesini kullanın.</p>
                        </div>
                    </div>

                    <div className="navlun-table-wrap">
                        <table className="navlun-sart-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Varış 1</th>
                                    <th>Varış 2</th>
                                    <th>Varış 3</th>
                                    <th>Fiyat</th>
                                    <th>Durum</th>
                                    <th>Kayıt</th>
                                    <th className="th-actions">Satır</th>
                                </tr>
                            </thead>

                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="8" className="empty-row">
                                            <span className="empty-state">
                                                <span className="spinner" aria-hidden="true" />
                                                Yükleniyor...
                                            </span>
                                        </td>
                                    </tr>
                                ) : filteredRows.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="empty-row">
                                            <span className="empty-state">Kayıt bulunamadı.</span>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredRows.map((row) => {
                                        const isEditing = editingRowId === row.id;
                                        const isSaving = savingId === row.id;

                                        return (
                                            <tr key={row.id} className={isEditing ? "row-editing" : ""}>
                                                <td className="id-cell">#{row.id}</td>

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

                                                <td>
                                                    <div className="amount-input">
                                                        <input
                                                            value={row.fiyat || ""}
                                                            onChange={(e) =>
                                                                updateRow(row, {
                                                                    fiyat: e.target.value,
                                                                })
                                                            }
                                                            inputMode="numeric"
                                                            aria-label={`#${row.id} fiyat`}
                                                        />
                                                        <span>₺</span>
                                                    </div>
                                                </td>

                                                <td>
                                                    <button
                                                        type="button"
                                                        role="switch"
                                                        aria-checked={!!row.aktif}
                                                        className={row.aktif ? "switch on" : "switch"}
                                                        onClick={() =>
                                                            updateRow(row, {
                                                                aktif: !row.aktif,
                                                            })
                                                        }
                                                        disabled={isSaving}
                                                    >
                                                        <span className="switch-track">
                                                            <span className="switch-thumb" />
                                                        </span>
                                                    </button>
                                                </td>

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

                                                <td>
                                                    {isEditing ? (
                                                        <div className="row-edit-actions">
                                                            <button
                                                                type="button"
                                                                className="row-save-btn"
                                                                onClick={() => saveRowEdit(row)}
                                                                disabled={isSaving}
                                                            >
                                                                Kaydet
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="row-cancel-btn"
                                                                onClick={cancelRowEdit}
                                                                disabled={isSaving}
                                                            >
                                                                Vazgeç
                                                            </button>
                                                        </div>
                                                    ) : (
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
                                                    )}
                                                </td>
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