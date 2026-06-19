import { useMemo, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { navlunDetayliHesapla, navlunEslesmeleriBul } from "./navlunIslemleri";
import "./NavlunEslesmeModal.css";

const emptyForm = {
    id: null,
    varis1: "",
    varis2: "",
    varis3: "",
    fiyat: "",
};

export default function NavlunEslesmeModal({
    row,
    navlunlar,
    ugramaSartlari,
    onClose,
    onSelect,
    onCreated,
    onUpdated,
}) {
    const matches = useMemo(
        () => navlunEslesmeleriBul(row, navlunlar),
        [row, navlunlar]
    );

    const [form, setForm] = useState({
        id: null,
        varis1: row.varis1 || "",
        varis2: row.varis2 || "",
        varis3: row.varis3 || "",
        fiyat: row.navlun || "",
    });

    const [saving, setSaving] = useState(false);

    function handleChange(e) {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    }

    function editMatch(match) {
        setForm({
            id: match.id,
            varis1: match.varis1 || "",
            varis2: match.varis2 || "",
            varis3: match.varis3 || "",
            fiyat: match.fiyat || "",
        });
    }

    function resetForm() {
        setForm(emptyForm);
    }

    async function saveAsNew() {
        if (!form.varis1.trim() || !String(form.fiyat).trim()) {
            alert("1. varış ve navlun zorunludur.");
            return;
        }

        setSaving(true);

        const payload = {
            varis1: form.varis1.trim().toUpperCase(),
            varis2: form.varis2.trim().toUpperCase(),
            varis3: form.varis3.trim().toUpperCase(),
            fiyat: String(form.fiyat).trim(),
            aktif: true,
            guncellendigi_alan: "Yeni kayıt",
            guncellenme_tarihi: new Date().toLocaleString("tr-TR"),
        };

        const { data, error } = await supabase
            .from("navlunlar")
            .insert([payload])
            .select()
            .single();

        setSaving(false);

        if (error) {
            console.error(error);
            alert("Yeni navlun kaydı eklenemedi.");
            return;
        }

        onCreated?.(data);
        onSelect(data);
    }

    async function updateExisting() {
        if (!form.id) {
            alert("Güncellemek için önce aşağıdaki listeden bir navlun satırı seç.");
            return;
        }

        if (!form.varis1.trim() || !String(form.fiyat).trim()) {
            alert("1. varış ve navlun zorunludur.");
            return;
        }

        setSaving(true);

        const payload = {
            varis1: form.varis1.trim().toUpperCase(),
            varis2: form.varis2.trim().toUpperCase(),
            varis3: form.varis3.trim().toUpperCase(),
            fiyat: String(form.fiyat).trim(),
            aktif: true,
            guncellendigi_alan: "Navlun eşleştirme paneli",
            guncellenme_tarihi: new Date().toLocaleString("tr-TR"),
        };

        const { data, error } = await supabase
            .from("navlunlar")
            .update(payload)
            .eq("id", form.id)
            .select()
            .single();

        setSaving(false);

        if (error) {
            console.error(error);
            alert("Navlun kaydı güncellenemedi.");
            return;
        }

        onUpdated?.(data);
        onSelect(data);
    }

    return (
        <div className="navlun-modal-backdrop" onClick={onClose}>
            <div className="navlun-modal wide" onClick={(e) => e.stopPropagation()}>
                <div className="navlun-modal-header">
                    <div>
                        <h2>Navlun Eşleştir</h2>
                        <p>
                            Mevcut: {row.varis1 || "-"} / {row.varis2 || "-"} /{" "}
                            {row.varis3 || "-"}
                        </p>
                    </div>

                    <button type="button" onClick={onClose}>
                        ✕
                    </button>
                </div>

                <div className="navlun-edit-box">
                    <div className="navlun-edit-title">
                        <div>
                            <strong>
                                {form.id
                                    ? `Seçili Navlun Kaydı Düzenleniyor #${form.id}`
                                    : "Yeni Navlun Kaydı"}
                            </strong>
                            <span>
                                Listeden “Düzenle” ile mevcut kaydı değiştir veya yeni kayıt ekle.
                            </span>
                        </div>

                        {form.id && (
                            <button type="button" className="soft-btn" onClick={resetForm}>
                                Yeni kayıt moduna geç
                            </button>
                        )}
                    </div>

                    <div className="navlun-edit-grid">
                        <input
                            name="varis1"
                            value={form.varis1}
                            onChange={handleChange}
                            placeholder="1. Varış"
                        />

                        <input
                            name="varis2"
                            value={form.varis2}
                            onChange={handleChange}
                            placeholder="2. Varış"
                        />

                        <input
                            name="varis3"
                            value={form.varis3}
                            onChange={handleChange}
                            placeholder="3. Varış"
                        />

                        <input
                            name="fiyat"
                            value={form.fiyat}
                            onChange={handleChange}
                            placeholder="Navlun"
                            inputMode="numeric"
                        />

                        <div className="navlun-edit-actions">
                            {form.id && (
                                <button
                                    type="button"
                                    className="update-btn"
                                    onClick={updateExisting}
                                    disabled={saving}
                                >
                                    {saving ? "Güncelleniyor..." : "Güncelle ve Uygula"}
                                </button>
                            )}

                            <button
                                type="button"
                                className="create-btn"
                                onClick={saveAsNew}
                                disabled={saving}
                            >
                                {saving ? "Ekleniyor..." : "Yeni Ekle ve Uygula"}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="navlun-modal-section-title">
                    En Benzer Navlun Kayıtları
                </div>

                <div className="navlun-modal-table-wrap">
                    <table className="navlun-match-table">
                        <thead>
                            <tr>
                                <th>1. Varış</th>
                                <th>2. Varış</th>
                                <th>3. Varış</th>
                                <th>Navlun</th>
                                <th>Benzerlik</th>
                                <th>İşlem</th>
                            </tr>
                        </thead>

                        <tbody>
                            {matches.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="navlun-empty-match">
                                        Benzer navlun kaydı bulunamadı.
                                    </td>
                                </tr>
                            ) : (
                                matches.map((match) => {
                                    const hesap = navlunDetayliHesapla(
                                        {
                                            ...row,
                                            varis1: match.varis1,
                                            varis2: match.varis2,
                                            varis3: match.varis3,
                                        },
                                        navlunlar,
                                        ugramaSartlari
                                    );

                                    return (
                                        <tr key={match.id}>
                                            <td>{match.varis1 || "-"}</td>
                                            <td>{match.varis2 || "-"}</td>
                                            <td>{match.varis3 || "-"}</td>
                                            <td className="navlun-price-cell">
                                                {Number(
                                                    hesap.fiyat || match.fiyat || 0
                                                ).toLocaleString("tr-TR")}{" "}
                                                ₺
                                            </td>
                                            <td>
                                                <span className="score-pill">
                                                    %{match.puan}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="match-actions">
                                                    <button
                                                        type="button"
                                                        className="select-btn"
                                                        onClick={() => onSelect(match)}
                                                    >
                                                        Seç
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="edit-row-btn"
                                                        onClick={() => editMatch(match)}
                                                    >
                                                        Düzenle
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}