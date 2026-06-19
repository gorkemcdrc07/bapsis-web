import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import "./Navlunlar.css";

const emptyForm = {
    musteri_adi: "",
    yukleme_yeri: "",
    teslim_yeri: "",
    navlun: "",
};

export default function Navlunlar() {
    const [rows, setRows] = useState([]);
    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchRows();
    }, []);

    async function fetchRows() {
        setLoading(true);

        const { data, error } = await supabase
            .from("donusler_musteri")
            .select("*")
            .order("musteri_adi", { ascending: true })
            .order("yukleme_yeri", { ascending: true });

        setLoading(false);

        if (error) {
            console.error(error);
            alert("Navlun kayıtları alınamadı.");
            return;
        }

        setRows(data || []);
    }

    function handleChange(e) {
        const { name, value } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    }

    function resetForm() {
        setForm(emptyForm);
        setEditingId(null);
    }

    function startEdit(row) {
        setEditingId(row.id);

        setForm({
            musteri_adi: row.musteri_adi || "",
            yukleme_yeri: row.yukleme_yeri || "",
            teslim_yeri: row.teslim_yeri || "",
            navlun: row.navlun || "",
        });

        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    async function saveRow(e) {
        e.preventDefault();

        if (
            !form.musteri_adi.trim() ||
            !form.yukleme_yeri.trim() ||
            !form.teslim_yeri.trim() ||
            !String(form.navlun).trim()
        ) {
            alert("Lütfen tüm alanları doldurun.");
            return;
        }

        setSaving(true);

        const payload = {
            musteri_adi: form.musteri_adi.trim().toUpperCase(),
            yukleme_yeri: form.yukleme_yeri.trim().toUpperCase(),
            teslim_yeri: form.teslim_yeri.trim().toUpperCase(),
            navlun: String(form.navlun).trim(),
        };

        const { error } = editingId
            ? await supabase
                .from("donusler_musteri")
                .update(payload)
                .eq("id", editingId)
            : await supabase.from("donusler_musteri").insert([payload]);

        setSaving(false);

        if (error) {
            console.error(error);
            alert("Kayıt işlemi başarısız oldu.");
            return;
        }

        resetForm();
        fetchRows();
    }

    async function deleteRow(row) {
        const ok = window.confirm(
            `${row.musteri_adi} - ${row.yukleme_yeri} kaydı silinsin mi?`
        );

        if (!ok) return;

        const { error } = await supabase
            .from("donusler_musteri")
            .delete()
            .eq("id", row.id);

        if (error) {
            console.error(error);
            alert("Silme işlemi başarısız oldu.");
            return;
        }

        fetchRows();
    }

    const filteredRows = useMemo(() => {
        const q = search.toLowerCase().trim();

        if (!q) return rows;

        return rows.filter((row) =>
            [
                row.id,
                row.musteri_adi,
                row.yukleme_yeri,
                row.teslim_yeri,
                row.navlun,
            ]
                .join(" ")
                .toLowerCase()
                .includes(q)
        );
    }, [rows, search]);

    const groupedRows = useMemo(() => {
        const groups = {};

        filteredRows.forEach((row) => {
            const key = row.musteri_adi || "MÜŞTERİ ADI YOK";

            if (!groups[key]) {
                groups[key] = [];
            }

            groups[key].push(row);
        });

        return Object.entries(groups).map(([musteriAdi, items]) => {
            const prices = items.map((item) => Number(item.navlun || 0));

            return {
                musteriAdi,
                items,
                count: items.length,
                minPrice: Math.min(...prices),
                maxPrice: Math.max(...prices),
            };
        });
    }, [filteredRows]);

    return (
        <div className="navlun-page">
            <div className="navlun-shell">
                <header className="navlun-header">
                    <div className="navlun-header-text">
                        <span className="navlun-eyebrow">Operasyon · Fiyat Tanımları</span>
                        <h1>Dönüş Navlunları</h1>
                        <p>{filteredRows.length} kayıt / {groupedRows.length} müşteri listeleniyor</p>
                    </div>

                    <div className="navlun-header-right">
                        <div className="navlun-header-meta">
                            <div className="meta-chip">
                                <span className="meta-chip-value">{groupedRows.length}</span>
                                <span className="meta-chip-label">Müşteri</span>
                            </div>
                            <div className="meta-chip meta-chip-accent">
                                <span className="meta-chip-value">{filteredRows.length}</span>
                                <span className="meta-chip-label">Navlun Kaydı</span>
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
                                placeholder="Müşteri, yükleme, teslim veya navlun ara..."
                                aria-label="Navlun kayıtlarında ara"
                            />
                        </div>
                    </div>
                </header>

                <form className="navlun-form" onSubmit={saveRow}>
                    <div className="form-title">
                        <div className="form-title-left">
                            <span className={editingId ? "form-mode-dot edit" : "form-mode-dot"} aria-hidden="true" />
                            <strong>{editingId ? "Navlun Kaydını Düzenle" : "Yeni Navlun Ekle"}</strong>
                        </div>
                        {editingId && (
                            <span className="form-title-meta">
                                Düzenlenen kayıt: <code>#{editingId}</code>
                            </span>
                        )}
                    </div>

                    <div className="form-grid">
                        <div className="field">
                            <label htmlFor="musteri_adi">Müşteri Adı</label>
                            <input
                                id="musteri_adi"
                                name="musteri_adi"
                                value={form.musteri_adi}
                                onChange={handleChange}
                                placeholder="Müşteri adı"
                            />
                        </div>

                        <div className="field">
                            <label htmlFor="yukleme_yeri">Yükleme Yeri</label>
                            <input
                                id="yukleme_yeri"
                                name="yukleme_yeri"
                                value={form.yukleme_yeri}
                                onChange={handleChange}
                                placeholder="Yükleme yeri"
                            />
                        </div>

                        <div className="field">
                            <label htmlFor="teslim_yeri">Teslim Yeri</label>
                            <input
                                id="teslim_yeri"
                                name="teslim_yeri"
                                value={form.teslim_yeri}
                                onChange={handleChange}
                                placeholder="Teslim yeri"
                            />
                        </div>

                        <div className="field field-amount">
                            <label htmlFor="navlun">Navlun</label>
                            <div className="amount-input">
                                <input
                                    id="navlun"
                                    name="navlun"
                                    value={form.navlun}
                                    onChange={handleChange}
                                    placeholder="0"
                                    inputMode="numeric"
                                />
                                <span>₺</span>
                            </div>
                        </div>

                        <div className="form-actions">
                            {editingId && (
                                <button type="button" className="btn-cancel" onClick={resetForm}>
                                    Vazgeç
                                </button>
                            )}

                            <button type="submit" className="btn-save" disabled={saving}>
                                {saving ? "Kaydediliyor..." : editingId ? "Güncelle" : "Ekle"}
                            </button>
                        </div>
                    </div>
                </form>

                {loading ? (
                    <div className="empty-box">
                        <span className="empty-state">
                            <span className="spinner" aria-hidden="true" />
                            Yükleniyor...
                        </span>
                    </div>
                ) : groupedRows.length === 0 ? (
                    <div className="empty-box">
                        <span className="empty-state">Kayıt bulunamadı.</span>
                    </div>
                ) : (
                    <div className="navlun-groups">
                        {groupedRows.map((group) => (
                            <section className="navlun-group-card" key={group.musteriAdi}>
                                <div className="group-header">
                                    <div className="group-title">
                                        <div className="customer-icon">
                                            {group.musteriAdi.charAt(0)}
                                        </div>

                                        <div>
                                            <h2>{group.musteriAdi}</h2>
                                            <p>{group.count} navlun tanımı</p>
                                        </div>
                                    </div>

                                    <div className="group-price-summary">
                                        <span>Fiyat Aralığı</span>
                                        <strong>
                                            {group.minPrice.toLocaleString("tr-TR")} ₺
                                            {group.minPrice !== group.maxPrice && (
                                                <>
                                                    {" "}–{" "}
                                                    {group.maxPrice.toLocaleString("tr-TR")} ₺
                                                </>
                                            )}
                                        </strong>
                                    </div>
                                </div>

                                <div className="group-table-wrap">
                                    <table className="group-table">
                                        <thead>
                                            <tr>
                                                <th>Yükleme Yeri</th>
                                                <th>Teslim Yeri</th>
                                                <th>Navlun</th>
                                                <th className="th-actions">İşlem</th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {group.items.map((row) => (
                                                <tr key={row.id}>
                                                    <td>{row.yukleme_yeri || "-"}</td>
                                                    <td>{row.teslim_yeri || "-"}</td>
                                                    <td className="price-cell">
                                                        {Number(row.navlun || 0).toLocaleString("tr-TR")} ₺
                                                    </td>
                                                    <td>
                                                        <div className="row-actions">
                                                            <button
                                                                type="button"
                                                                className="edit-btn"
                                                                onClick={() => startEdit(row)}
                                                            >
                                                                Düzenle
                                                            </button>

                                                            <button
                                                                type="button"
                                                                className="delete-btn"
                                                                onClick={() => deleteRow(row)}
                                                            >
                                                                Sil
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </section>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}