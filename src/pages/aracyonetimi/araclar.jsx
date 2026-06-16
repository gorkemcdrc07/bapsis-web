import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { supabase } from "../../lib/supabaseClient";
import "./araclar.css";

const emptyForm = {
    cekici: "",
    dorse: "",
    surucu: "",
    tc: "",
    telefon: "",
    vkn: "",
};

const FETCH_SIZE = 1000;

function normalizePlate(value) {
    return String(value || "").toLocaleUpperCase("tr-TR").replace(/\s/g, "");
}

function initials(name) {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const AVATAR_COLORS = [
    { bg: "#eef2ff", text: "#4338ca" },
    { bg: "#f0fdf4", text: "#15803d" },
    { bg: "#fff7ed", text: "#c2410c" },
    { bg: "#fdf2f8", text: "#be185d" },
    { bg: "#f0f9ff", text: "#0369a1" },
];

function avatarColor(name) {
    if (!name) return AVATAR_COLORS[0];
    let code = 0;
    for (let i = 0; i < name.length; i++) code += name.charCodeAt(i);
    return AVATAR_COLORS[code % AVATAR_COLORS.length];
}

export default function Araclar() {
    const [araclar, setAraclar] = useState([]);
    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);

    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [view, setView] = useState("kart");
    const [formOpen, setFormOpen] = useState(false);
    const [toast, setToast] = useState(null);

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(50);

    const showToast = (msg, type = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchAraclar = async () => {
        setLoading(true);

        let from = 0;
        let allData = [];
        let hasMore = true;

        while (hasMore) {
            const to = from + FETCH_SIZE - 1;

            const { data, error } = await supabase
                .from("araclar")
                .select("*")
                .order("id", { ascending: false })
                .range(from, to);

            if (error) {
                showToast(`Araçlar alınamadı: ${error.message}`, "error");
                setLoading(false);
                return;
            }

            const rows = data || [];
            allData = [...allData, ...rows];

            if (rows.length < FETCH_SIZE) {
                hasMore = false;
            } else {
                from += FETCH_SIZE;
            }
        }

        setAraclar(allData);
        setPage(1);
        setLoading(false);
    };

    useEffect(() => {
        fetchAraclar();
    }, []);

    const filteredAraclar = useMemo(() => {
        const value = search.toLocaleLowerCase("tr-TR").trim();

        if (!value) return araclar;

        return araclar.filter((item) =>
            [item.cekici, item.dorse, item.surucu, item.tc, item.telefon, item.vkn]
                .join(" ")
                .toLocaleLowerCase("tr-TR")
                .includes(value)
        );
    }, [araclar, search]);

    const totalPages = Math.max(1, Math.ceil(filteredAraclar.length / pageSize));

    const pagedAraclar = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredAraclar.slice(start, start + pageSize);
    }, [filteredAraclar, page, pageSize]);

    useEffect(() => {
        setPage(1);
    }, [search, pageSize]);

    useEffect(() => {
        if (page > totalPages) setPage(totalPages);
    }, [page, totalPages]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: name === "cekici" || name === "dorse" ? normalizePlate(value) : value,
        }));
    };

    const resetForm = () => {
        setForm(emptyForm);
        setEditingId(null);
        setFormOpen(false);
    };

    const startEdit = (item) => {
        setEditingId(item.id);
        setForm({
            cekici: item.cekici || "",
            dorse: item.dorse || "",
            surucu: item.surucu || "",
            tc: item.tc || "",
            telefon: item.telefon || "",
            vkn: item.vkn || "",
        });
        setFormOpen(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.cekici && !form.dorse && !form.surucu) {
            showToast("En az çekici, dorse veya sürücü alanlarından biri dolu olmalı.", "warning");
            return;
        }

        setSaving(true);

        const payload = {
            cekici: form.cekici || null,
            dorse: form.dorse || null,
            surucu: form.surucu || null,
            tc: form.tc || null,
            telefon: form.telefon || null,
            vkn: form.vkn || null,
        };

        const { error } = editingId
            ? await supabase.from("araclar").update(payload).eq("id", editingId)
            : await supabase.from("araclar").insert([payload]);

        if (error) {
            showToast(
                editingId
                    ? `Araç güncellenemedi: ${error.message}`
                    : `Araç eklenemedi: ${error.message}`,
                "error"
            );
            setSaving(false);
            return;
        }

        resetForm();
        await fetchAraclar();
        setSaving(false);

        showToast(editingId ? "Araç bilgileri güncellendi." : "Araç başarıyla kaydedildi.");
    };

    const deleteArac = async (id) => {
        if (!confirm("Bu araç kaydı silinsin mi?")) return;

        const { error } = await supabase.from("araclar").delete().eq("id", id);

        if (error) {
            showToast(`Araç silinemedi: ${error.message}`, "error");
            return;
        }

        setAraclar((prev) => prev.filter((item) => item.id !== id));
        showToast("Araç silindi.", "warning");

        if (editingId === id) resetForm();
    };

    const exportExcel = () => {
        if (!filteredAraclar.length) {
            showToast("Aktarılacak kayıt bulunamadı.", "warning");
            return;
        }

        const rows = filteredAraclar.map((item) => ({
            "Sürücü": item.surucu || "",
            "Çekici Plaka": item.cekici || "",
            "Dorse Plaka": item.dorse || "",
            "TC No": item.tc || "",
            "Telefon": item.telefon || "",
            "VKN": item.vkn || "",
        }));

        const worksheet = XLSX.utils.json_to_sheet(rows);
        const workbook = XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(workbook, worksheet, "Araclar");

        worksheet["!cols"] = [
            { wch: 28 },
            { wch: 16 },
            { wch: 16 },
            { wch: 16 },
            { wch: 18 },
            { wch: 18 },
        ];

        const date = new Date().toISOString().slice(0, 10);
        XLSX.writeFile(workbook, `araclar-${date}.xlsx`);
    };

    const Pagination = () => (
        <div className="ar-pagination">
            <div className="ar-pagination-left">
                <span>
                    {filteredAraclar.length === 0
                        ? "0 kayıt"
                        : `${(page - 1) * pageSize + 1}-${Math.min(
                            page * pageSize,
                            filteredAraclar.length
                        )} / ${filteredAraclar.length}`}
                </span>

                <select
                    className="ar-page-size"
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={250}>250</option>
                </select>
            </div>

            <div className="ar-pagination-buttons">
                <button className="ar-page-btn" onClick={() => setPage(1)} disabled={page === 1}>
                    İlk
                </button>
                <button
                    className="ar-page-btn"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                >
                    Önceki
                </button>
                <span className="ar-page-current">
                    {page} / {totalPages}
                </span>
                <button
                    className="ar-page-btn"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                >
                    Sonraki
                </button>
                <button
                    className="ar-page-btn"
                    onClick={() => setPage(totalPages)}
                    disabled={page === totalPages}
                >
                    Son
                </button>
            </div>
        </div>
    );

    return (
        <div className="ar-root">
            {toast && (
                <div className={`ar-toast ar-toast-${toast.type}`}>
                    <span className="ar-toast-dot" />
                    {toast.msg}
                </div>
            )}

            <div className="ar-topbar">
                <div className="ar-topbar-left">
                    <div className="ar-topbar-icon" aria-hidden="true">
                        <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <rect x="1" y="3" width="15" height="13" rx="2" />
                            <path d="M16 8h4l3 5v3h-7V8z" />
                            <circle cx="5.5" cy="18.5" r="2.5" />
                            <circle cx="18.5" cy="18.5" r="2.5" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="ar-title">Araç Yönetimi</h1>
                        <p className="ar-subtitle">
                            {araclar.length} kayıt · Çekici, dorse ve sürücü bilgileri
                        </p>
                    </div>
                </div>

                <div className="ar-topbar-right">
                    <div className="ar-view-toggle">
                        <button
                            className={`ar-toggle-btn ${view === "kart" ? "ar-toggle-active" : ""}`}
                            onClick={() => setView("kart")}
                            type="button"
                        >
                            Kart
                        </button>
                        <button
                            className={`ar-toggle-btn ${view === "tablo" ? "ar-toggle-active" : ""}`}
                            onClick={() => setView("tablo")}
                            type="button"
                        >
                            Tablo
                        </button>
                    </div>

                    <button className="ar-btn ar-btn-excel" onClick={exportExcel} type="button">
                        Excel'e Aktar
                    </button>

                    <button
                        className="ar-btn ar-btn-primary"
                        onClick={() => {
                            if (formOpen && editingId) {
                                resetForm();
                            } else {
                                setFormOpen((v) => !v);
                            }
                        }}
                        type="button"
                    >
                        {formOpen ? "Kapat" : "Yeni Araç"}
                    </button>
                </div>
            </div>

            {formOpen && (
                <div className="ar-form-panel">
                    <form onSubmit={handleSubmit}>
                        <div className="ar-form-head">
                            <div>
                                <h2 className="ar-form-title">
                                    {editingId ? "Araç Bilgilerini Düzenle" : "Yeni Araç Ekle"}
                                </h2>
                                <p className="ar-form-desc">
                                    {editingId
                                        ? "Seçili araç kaydını güncelliyorsunuz."
                                        : "Çekici, dorse veya sürücü bilgilerinden en az birini girin."}
                                </p>
                            </div>
                        </div>

                        <div className="ar-form-grid">
                            <label className="ar-label">
                                <span>Çekici Plaka</span>
                                <input
                                    name="cekici"
                                    value={form.cekici}
                                    onChange={handleChange}
                                    placeholder="07AJY302"
                                    className="ar-input"
                                />
                            </label>

                            <label className="ar-label">
                                <span>Dorse Plaka</span>
                                <input
                                    name="dorse"
                                    value={form.dorse}
                                    onChange={handleChange}
                                    placeholder="59AHZ720"
                                    className="ar-input"
                                />
                            </label>

                            <label className="ar-label">
                                <span>Sürücü Adı</span>
                                <input
                                    name="surucu"
                                    value={form.surucu}
                                    onChange={handleChange}
                                    placeholder="Ad Soyad"
                                    className="ar-input"
                                />
                            </label>

                            <label className="ar-label">
                                <span>TC No</span>
                                <input
                                    name="tc"
                                    value={form.tc}
                                    onChange={handleChange}
                                    placeholder="12345678901"
                                    className="ar-input"
                                />
                            </label>

                            <label className="ar-label">
                                <span>Telefon</span>
                                <input
                                    name="telefon"
                                    value={form.telefon}
                                    onChange={handleChange}
                                    placeholder="05xx xxx xx xx"
                                    className="ar-input"
                                />
                            </label>

                            <label className="ar-label">
                                <span>VKN</span>
                                <input
                                    name="vkn"
                                    value={form.vkn}
                                    onChange={handleChange}
                                    placeholder="Vergi kimlik no"
                                    className="ar-input"
                                />
                            </label>
                        </div>

                        <div className="ar-form-footer">
                            <button type="button" className="ar-btn ar-btn-ghost" onClick={resetForm}>
                                İptal
                            </button>
                            <button type="submit" className="ar-btn ar-btn-primary" disabled={saving}>
                                {saving ? "Kaydediliyor..." : editingId ? "Güncelle" : "Kaydet"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="ar-search-row">
                <div className="ar-search-wrap">
                    <input
                        className="ar-search-input"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Plaka, sürücü, TC, telefon ara..."
                    />

                    {search && (
                        <button
                            className="ar-search-clear"
                            onClick={() => setSearch("")}
                            aria-label="Aramayı temizle"
                            type="button"
                        >
                            ×
                        </button>
                    )}
                </div>

                <span className="ar-result-count">{filteredAraclar.length} sonuç</span>
            </div>

            {loading && <div className="ar-loading">Tüm kayıtlar yükleniyor...</div>}

            {!loading && <Pagination />}

            {!loading && view === "kart" && (
                <div className="ar-card-grid">
                    {pagedAraclar.map((item) => {
                        const av = avatarColor(item.surucu);

                        return (
                            <article className="ar-card" key={item.id}>
                                <div className="ar-card-header">
                                    <div className="ar-plates">
                                        {item.cekici && (
                                            <div className="ar-plate-badge ar-plate-cekici">
                                                <span>Çekici</span>
                                                <strong>{item.cekici}</strong>
                                            </div>
                                        )}

                                        {item.dorse && (
                                            <div className="ar-plate-badge ar-plate-dorse">
                                                <span>Dorse</span>
                                                <strong>{item.dorse}</strong>
                                            </div>
                                        )}
                                    </div>

                                    <div className="ar-card-actions">
                                        <button
                                            className="ar-edit-icon"
                                            onClick={() => startEdit(item)}
                                            title="Düzenle"
                                            aria-label="Aracı düzenle"
                                            type="button"
                                        >
                                            Düzenle
                                        </button>

                                        <button
                                            className="ar-delete-icon"
                                            onClick={() => deleteArac(item.id)}
                                            title="Sil"
                                            aria-label="Aracı sil"
                                            type="button"
                                        >
                                            Sil
                                        </button>
                                    </div>
                                </div>

                                <div className="ar-card-driver">
                                    <div className="ar-avatar" style={{ background: av.bg, color: av.text }}>
                                        {initials(item.surucu)}
                                    </div>
                                    <div>
                                        <p className="ar-driver-name">{item.surucu || "—"}</p>
                                        <p className="ar-driver-tel">{item.telefon || "Telefon yok"}</p>
                                    </div>
                                </div>

                                <div className="ar-card-info">
                                    <div className="ar-info-item">
                                        <span>TC</span>
                                        <strong>{item.tc || "—"}</strong>
                                    </div>
                                    <div className="ar-info-item">
                                        <span>VKN</span>
                                        <strong>{item.vkn || "—"}</strong>
                                    </div>
                                </div>
                            </article>
                        );
                    })}

                    {filteredAraclar.length === 0 && (
                        <div className="ar-empty">
                            <strong>Kayıt bulunamadı</strong>
                            <p>Arama filtresini değiştirin veya yeni araç ekleyin.</p>
                        </div>
                    )}
                </div>
            )}

            {!loading && view === "tablo" && (
                <div className="ar-table-wrap">
                    <table className="ar-table">
                        <thead>
                            <tr>
                                <th>Sürücü</th>
                                <th>Çekici</th>
                                <th>Dorse</th>
                                <th>TC</th>
                                <th>Telefon</th>
                                <th>VKN</th>
                                <th></th>
                            </tr>
                        </thead>

                        <tbody>
                            {pagedAraclar.map((item) => {
                                const av = avatarColor(item.surucu);

                                return (
                                    <tr key={item.id} className="ar-table-row">
                                        <td>
                                            <div className="ar-table-driver">
                                                <div
                                                    className="ar-avatar ar-avatar-sm"
                                                    style={{ background: av.bg, color: av.text }}
                                                >
                                                    {initials(item.surucu)}
                                                </div>
                                                <span>{item.surucu || "—"}</span>
                                            </div>
                                        </td>
                                        <td>
                                            {item.cekici ? (
                                                <span className="ar-tbl-plate ar-tbl-cekici">{item.cekici}</span>
                                            ) : (
                                                <span className="ar-tbl-empty">—</span>
                                            )}
                                        </td>
                                        <td>
                                            {item.dorse ? (
                                                <span className="ar-tbl-plate ar-tbl-dorse">{item.dorse}</span>
                                            ) : (
                                                <span className="ar-tbl-empty">—</span>
                                            )}
                                        </td>
                                        <td className="ar-tbl-mono">
                                            {item.tc || <span className="ar-tbl-empty">—</span>}
                                        </td>
                                        <td>{item.telefon || <span className="ar-tbl-empty">—</span>}</td>
                                        <td className="ar-tbl-mono">
                                            {item.vkn || <span className="ar-tbl-empty">—</span>}
                                        </td>
                                        <td>
                                            <div className="ar-table-actions">
                                                <button
                                                    className="ar-edit-icon"
                                                    onClick={() => startEdit(item)}
                                                    title="Düzenle"
                                                    aria-label="Aracı düzenle"
                                                    type="button"
                                                >
                                                    Düzenle
                                                </button>

                                                <button
                                                    className="ar-delete-icon"
                                                    onClick={() => deleteArac(item.id)}
                                                    title="Sil"
                                                    aria-label="Aracı sil"
                                                    type="button"
                                                >
                                                    Sil
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {filteredAraclar.length === 0 && (
                        <div className="ar-empty">
                            <strong>Kayıt bulunamadı</strong>
                            <p>Arama filtresini değiştirin veya yeni araç ekleyin.</p>
                        </div>
                    )}
                </div>
            )}

            {!loading && filteredAraclar.length > 0 && <Pagination />}
        </div>
    );
}