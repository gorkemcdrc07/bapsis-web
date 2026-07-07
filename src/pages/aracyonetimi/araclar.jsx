import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContext";
import "./araclar.css";

const emptyForm = {
    cekici: "",
    dorse: "",
    surucu: "",
    tc: "",
    telefon: "",
    vkn_id: "",
    datalogerNo: "",
};

const FETCH_SIZE = 1000;
const PAGE_KEY = "araclar";

const COLUMN_KEYS = {
    surucu: "Sürücü",
    cekici: "Çekici Plaka",
    dorse: "Dorse Plaka",
    tc: "TC",
    telefon: "Telefon",
    vkn: "VKN",
    datalogerNo: "Dataloger No",
};


function normalizePlate(value) {
    return String(value || "").toLocaleUpperCase("tr-TR").replace(/\s/g, "");
}

function initials(name) {
    if (!name) return "?";
    const parts = name.trim().split(" ").filter(Boolean);
    if (parts.length === 1) return parts[0][0].toLocaleUpperCase("tr-TR");
    return (parts[0][0] + parts[parts.length - 1][0]).toLocaleUpperCase("tr-TR");
}

function avatarClass(name) {
    if (!name) return "ar-avatar-c0";
    let code = 0;
    for (let i = 0; i < name.length; i++) code += name.charCodeAt(i);
    return `ar-avatar-c${code % 5}`;
}

function getVknText(item) {
    return item?.vknler?.vkn || item?.vkn || "";
}

const PlateBadge = ({ plate, type }) => {
    if (!plate) return null;

    return (
        <span className={`ar-plate-badge ${type === "cekici" ? "ar-plate-cekici" : "ar-plate-dorse"}`}>
            <span>{type === "cekici" ? "Çekici" : "Dorse"}</span>
            <strong>{plate}</strong>
        </span>
    );
};

const IconSearch = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
    </svg>
);

const IconGrid = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
    </svg>
);

const IconList = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="21" y2="6" />
        <line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6" x2="3.01" y2="6" />
        <line x1="3" y1="12" x2="3.01" y2="12" />
        <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
);

const IconPlus = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);

const IconX = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

const IconEdit = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
);

const IconTrash = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
        <path d="M10 11v6" />
        <path d="M14 11v6" />
        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
);

const IconDownload = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
);

const IconTruck = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="15" height="13" />
        <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
        <circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
);

export default function Araclar() {
    const { canPage, canButton, canColumn } = useAuth();

    const canViewPage = canPage(PAGE_KEY);
    const canCreateVehicle = canButton(PAGE_KEY, "create_vehicle");
    const canEditVehicle = canButton(PAGE_KEY, "edit_vehicle");
    const canDeleteVehicle = canButton(PAGE_KEY, "delete");
    const canExportExcel = canButton(PAGE_KEY, "export_excel");
    const canCardView = canButton(PAGE_KEY, "card_view");

    const canShowColumn = (columnKey) => canColumn(PAGE_KEY, columnKey);

    const visibleTableColumns = [
        { key: "surucu", label: "Sürücü", allowed: canShowColumn(COLUMN_KEYS.surucu) },
        { key: "cekici", label: "Çekici", allowed: canShowColumn(COLUMN_KEYS.cekici) },
        { key: "dorse", label: "Dorse", allowed: canShowColumn(COLUMN_KEYS.dorse) },
        { key: "tc", label: "TC", allowed: canShowColumn(COLUMN_KEYS.tc) },
        { key: "telefon", label: "Telefon", allowed: canShowColumn(COLUMN_KEYS.telefon) },
        { key: "vkn", label: "VKN", allowed: canShowColumn(COLUMN_KEYS.vkn) },
        { key: "datalogerNo", label: "Dataloger", allowed: canShowColumn(COLUMN_KEYS.datalogerNo) },
    ].filter((column) => column.allowed);

    const [araclar, setAraclar] = useState([]);
    const [vknler, setVknler] = useState([]);
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
        setTimeout(() => setToast(null), 3500);
    };

    async function fetchVknler() {
        const { data, error } = await supabase
            .from("vknler")
            .select("id, vkn")
            .order("vkn", { ascending: true });

        if (error) {
            showToast(`VKN listesi alınamadı: ${error.message}`, "error");
            return;
        }

        setVknler(data || []);
    }

    async function fetchAraclar() {
        setLoading(true);

        let from = 0;
        let allData = [];
        let hasMore = true;

        while (hasMore) {
            const to = from + FETCH_SIZE - 1;

            const { data, error } = await supabase
                .from("araclar")
                .select(`
                    *,
                    vknler:vkn_id (
                        id,
                        vkn
                    )
                `)
                .order("id", { ascending: false })
                .range(from, to);

            if (error) {
                showToast(`Araçlar alınamadı: ${error.message}`, "error");
                setLoading(false);
                return;
            }

            const rows = data || [];
            allData = [...allData, ...rows];
            hasMore = rows.length === FETCH_SIZE;
            from += FETCH_SIZE;
        }

        setAraclar(allData);
        setPage(1);
        setLoading(false);
    }

    useEffect(() => {
        if (!canViewPage) return;
        fetchVknler();
        fetchAraclar();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [canViewPage]);

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
                getVknText(item),
                item.datalogerNo,
            ]
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

    function findPreviousVknIdByCekici(cekici, currentId = null) {
        const normalized = normalizePlate(cekici);
        if (!normalized) return "";

        const found = araclar.find(
            (item) =>
                item.id !== currentId &&
                normalizePlate(item.cekici) === normalized &&
                item.vkn_id
        );

        return found?.vkn_id || "";
    }

    function handleChange(e) {
        const { name, value } = e.target;

        setForm((prev) => {
            const nextValue = name === "cekici" || name === "dorse" ? normalizePlate(value) : value;
            const nextForm = { ...prev, [name]: nextValue };

            if (name === "cekici") {
                const matchedVknId = findPreviousVknIdByCekici(nextValue, editingId);
                if (matchedVknId) nextForm.vkn_id = matchedVknId;
            }

            return nextForm;
        });
    }

    function resetForm() {
        setForm(emptyForm);
        setEditingId(null);
        setFormOpen(false);
    }

    function startEdit(item) {
        if (!canEditVehicle) {
            showToast("Araç düzenleme yetkiniz yok.", "error");
            return;
        }

        setEditingId(item.id);
        setForm({
            cekici: item.cekici || "",
            dorse: item.dorse || "",
            surucu: item.surucu || "",
            tc: item.tc || "",
            telefon: item.telefon || "",
            vkn_id: item.vkn_id || item.vknler?.id || "",
            datalogerNo: item.datalogerNo || "",
        });
        setFormOpen(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    async function handleSubmit(e) {
        e.preventDefault();

        if (editingId && !canEditVehicle) {
            showToast("Araç güncelleme yetkiniz yok.", "error");
            return;
        }

        if (!editingId && !canCreateVehicle) {
            showToast("Yeni araç ekleme yetkiniz yok.", "error");
            return;
        }

        if (!form.cekici && !form.dorse && !form.surucu) {
            showToast("En az çekici, dorse veya sürücü alanlarından biri dolu olmalı.", "warning");
            return;
        }

        setSaving(true);

        const selectedVkn = vknler.find((item) => item.id === form.vkn_id);

        const payload = {
            cekici: form.cekici || null,
            dorse: form.dorse || null,
            surucu: form.surucu || null,
            tc: form.tc || null,
            telefon: form.telefon || null,
            vkn_id: form.vkn_id || null,
            vkn: selectedVkn?.vkn || null,
            datalogerNo: form.datalogerNo || null,
        };

        const { error } = editingId
            ? await supabase.from("araclar").update(payload).eq("id", editingId)
            : await supabase.from("araclar").insert([payload]);

        if (error) {
            showToast(editingId ? `Araç güncellenemedi: ${error.message}` : `Araç eklenemedi: ${error.message}`, "error");
            setSaving(false);
            return;
        }

        resetForm();
        await fetchAraclar();
        setSaving(false);
        showToast(editingId ? "Araç bilgileri güncellendi." : "Araç başarıyla kaydedildi.");
    }

    async function deleteArac(id) {
        if (!canDeleteVehicle) {
            showToast("Araç silme yetkiniz yok.", "error");
            return;
        }

        if (!confirm("Bu araç kaydı silinsin mi?")) return;

        const { error } = await supabase.from("araclar").delete().eq("id", id);

        if (error) {
            showToast(`Araç silinemedi: ${error.message}`, "error");
            return;
        }

        setAraclar((prev) => prev.filter((item) => item.id !== id));
        showToast("Araç silindi.", "warning");

        if (editingId === id) resetForm();
    }

    function exportExcel() {
        if (!canExportExcel) {
            showToast("Excel aktarım yetkiniz yok.", "error");
            return;
        }

        if (!filteredAraclar.length) {
            showToast("Aktarılacak kayıt bulunamadı.", "warning");
            return;
        }

        const rows = filteredAraclar.map((item) => ({
            Sürücü: item.surucu || "",
            "Çekici Plaka": item.cekici || "",
            "Dorse Plaka": item.dorse || "",
            "TC No": item.tc || "",
            Telefon: item.telefon || "",
            VKN: getVknText(item),
            "Dataloger No": item.datalogerNo || "",
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
            { wch: 18 },
        ];

        XLSX.writeFile(workbook, `araclar-${new Date().toISOString().slice(0, 10)}.xlsx`);
    }

    const totalCekici = araclar.filter((a) => a.cekici).length;
    const totalDorse = araclar.filter((a) => a.dorse).length;
    const totalSurucu = araclar.filter((a) => a.surucu).length;

    const effectiveView = canCardView ? view : "tablo";

    if (!canViewPage) {
        return (
            <div className="ar-root">
                <div className="ar-empty">
                    <strong>Bu sayfayı görüntüleme yetkiniz yok</strong>
                    <p>Erişim talep etmek için sistem yöneticinizle iletişime geçin.</p>
                </div>
            </div>
        );
    }

    const Pagination = () => (
        <div className="ar-pagination">
            <div className="ar-pagination-left">
                <span>
                    {filteredAraclar.length === 0
                        ? "0 kayıt"
                        : `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, filteredAraclar.length)} / ${filteredAraclar.length}`}
                </span>

                <select className="ar-page-size" value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
                    {[25, 50, 100, 250].map((n) => (
                        <option key={n} value={n}>
                            {n} / sayfa
                        </option>
                    ))}
                </select>
            </div>

            <div className="ar-pagination-buttons">
                <button className="ar-page-btn" onClick={() => setPage(1)} disabled={page === 1} type="button">
                    İlk
                </button>
                <button className="ar-page-btn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} type="button">
                    ‹ Önceki
                </button>
                <span className="ar-page-current">{page} / {totalPages}</span>
                <button className="ar-page-btn" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} type="button">
                    Sonraki ›
                </button>
                <button className="ar-page-btn" onClick={() => setPage(totalPages)} disabled={page === totalPages} type="button">
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
                    <div className="ar-topbar-icon">
                        <IconTruck />
                    </div>
                    <div>
                        <h1 className="ar-title">Araç Yönetimi</h1>
                        <p className="ar-subtitle">{araclar.length} kayıt · Çekici, dorse, sürücü ve VKN bilgileri</p>
                    </div>
                </div>

                <div className="ar-topbar-right">
                    {canCardView && (
                        <div className="ar-view-toggle">
                            <button className={`ar-toggle-btn ${view === "kart" ? "ar-toggle-active" : ""}`} onClick={() => setView("kart")} type="button">
                                <IconGrid /> Kart
                            </button>
                            <button className={`ar-toggle-btn ${view === "tablo" ? "ar-toggle-active" : ""}`} onClick={() => setView("tablo")} type="button">
                                <IconList /> Tablo
                            </button>
                        </div>
                    )}

                    {canExportExcel && (
                        <button className="ar-btn ar-btn-excel" onClick={exportExcel} type="button">
                            <IconDownload /> Excel
                        </button>
                    )}

                    {canCreateVehicle && (
                        <button
                            className="ar-btn ar-btn-primary"
                            onClick={() => {
                                if (formOpen && editingId) resetForm();
                                else setFormOpen((v) => !v);
                            }}
                            type="button"
                        >
                            {formOpen ? <><IconX /> Kapat</> : <><IconPlus /> Yeni Araç</>}
                        </button>
                    )}
                </div>
            </div>

            <div className="ar-stats">
                <div className="ar-stat-card">
                    <p>Toplam Kayıt</p>
                    <strong>{araclar.length}</strong>
                    <span>Tüm araçlar</span>
                </div>
                <div className="ar-stat-card ar-stat-blue">
                    <p>Çekici</p>
                    <strong>{totalCekici}</strong>
                    <span>Plakalı kayıt</span>
                </div>
                <div className="ar-stat-card ar-stat-green">
                    <p>Dorse</p>
                    <strong>{totalDorse}</strong>
                    <span>Plakalı kayıt</span>
                </div>
                <div className="ar-stat-card ar-stat-purple">
                    <p>Sürücü</p>
                    <strong>{totalSurucu}</strong>
                    <span>İsim kayıtlı</span>
                </div>
            </div>

            {formOpen && (editingId ? canEditVehicle : canCreateVehicle) && (
                <div className="ar-form-panel">
                    <form onSubmit={handleSubmit}>
                        <div className="ar-form-head">
                            <h2 className="ar-form-title">{editingId ? "Araç Bilgilerini Düzenle" : "Yeni Araç Ekle"}</h2>
                            <p className="ar-form-desc">
                                {editingId ? "Seçili araç kaydını güncelliyorsunuz." : "Çekici, dorse veya sürücü bilgilerinden en az birini girin."}
                            </p>
                        </div>

                        <div className="ar-form-grid">
                            <label className="ar-label">
                                <span>Çekici Plaka</span>
                                <input name="cekici" value={form.cekici} onChange={handleChange} placeholder="07AJY302" className="ar-input" />
                            </label>

                            <label className="ar-label">
                                <span>Dorse Plaka</span>
                                <input name="dorse" value={form.dorse} onChange={handleChange} placeholder="59AHZ720" className="ar-input" />
                            </label>

                            <label className="ar-label">
                                <span>Sürücü Adı</span>
                                <input name="surucu" value={form.surucu} onChange={handleChange} placeholder="Ad Soyad" className="ar-input" />
                            </label>

                            <label className="ar-label">
                                <span>TC No</span>
                                <input name="tc" value={form.tc} onChange={handleChange} placeholder="12345678901" className="ar-input" />
                            </label>

                            <label className="ar-label">
                                <span>Telefon</span>
                                <input name="telefon" value={form.telefon} onChange={handleChange} placeholder="05xx xxx xx xx" className="ar-input" />
                            </label>

                            <label className="ar-label">
                                <span>VKN</span>
                                <select name="vkn_id" value={form.vkn_id} onChange={handleChange} className="ar-input">
                                    <option value="">VKN seçin</option>
                                    {vknler.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {item.vkn}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label className="ar-label">
                                <span>Dataloger No</span>
                                <input name="datalogerNo" value={form.datalogerNo} onChange={handleChange} placeholder="Cihaz numarası" className="ar-input" />
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
                    <span className="ar-search-icon"><IconSearch /></span>
                    <input
                        className="ar-search-input"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Plaka, sürücü, TC, telefon, VKN, dataloger ara..."
                    />
                    {search && (
                        <button className="ar-search-clear" onClick={() => setSearch("")} aria-label="Aramayı temizle" type="button">
                            <IconX />
                        </button>
                    )}
                </div>
                {search && <span className="ar-result-count">{filteredAraclar.length} sonuç</span>}
            </div>

            {loading && <div className="ar-loading">Tüm kayıtlar yükleniyor...</div>}

            {!loading && <Pagination />}

            {!loading && effectiveView === "kart" && (
                <div className="ar-card-grid">
                    {pagedAraclar.map((item) => {
                        const avClass = avatarClass(item.surucu);
                        return (
                            <article className="ar-card" key={item.id}>
                                <div className="ar-card-header">
                                    <div className="ar-plates">
                                        {canShowColumn(COLUMN_KEYS.cekici) && <PlateBadge plate={item.cekici} type="cekici" />}
                                        {canShowColumn(COLUMN_KEYS.dorse) && <PlateBadge plate={item.dorse} type="dorse" />}
                                        {canShowColumn(COLUMN_KEYS.cekici) && canShowColumn(COLUMN_KEYS.dorse) && !item.cekici && !item.dorse && <span className="ar-no-plate">Plaka yok</span>}
                                    </div>

                                    {(canEditVehicle || canDeleteVehicle) && (
                                        <div className="ar-card-actions">
                                            {canEditVehicle && (
                                                <button className="ar-edit-icon" onClick={() => startEdit(item)} type="button" title="Düzenle">
                                                    <IconEdit />
                                                </button>
                                            )}
                                            {canDeleteVehicle && (
                                                <button className="ar-delete-icon" onClick={() => deleteArac(item.id)} type="button" title="Sil">
                                                    <IconTrash />
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {(canShowColumn(COLUMN_KEYS.surucu) || canShowColumn(COLUMN_KEYS.telefon)) && (
                                    <div className="ar-card-driver">
                                        {canShowColumn(COLUMN_KEYS.surucu) && <div className={`ar-avatar ${avClass}`}>{initials(item.surucu)}</div>}
                                        <div>
                                            {canShowColumn(COLUMN_KEYS.surucu) && <p className="ar-driver-name">{item.surucu || "—"}</p>}
                                            {canShowColumn(COLUMN_KEYS.telefon) && <p className="ar-driver-tel">{item.telefon || "Telefon yok"}</p>}
                                        </div>
                                    </div>
                                )}

                                <div className="ar-card-info">
                                    {canShowColumn(COLUMN_KEYS.tc) && (
                                        <div className="ar-info-item">
                                            <span>TC</span>
                                            <strong>{item.tc || "—"}</strong>
                                        </div>
                                    )}
                                    {canShowColumn(COLUMN_KEYS.vkn) && (
                                        <div className="ar-info-item">
                                            <span>VKN</span>
                                            <strong>{getVknText(item) || "—"}</strong>
                                        </div>
                                    )}
                                    {canShowColumn(COLUMN_KEYS.datalogerNo) && (
                                        <div className="ar-info-item ar-info-full">
                                            <span>Dataloger</span>
                                            <strong>{item.datalogerNo || "—"}</strong>
                                        </div>
                                    )}
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

            {!loading && effectiveView === "tablo" && (
                <div className="ar-table-wrap">
                    <table className="ar-table">
                        <thead>
                            <tr>
                                {visibleTableColumns.map((column) => (
                                    <th key={column.key}>{column.label}</th>
                                ))}
                                {(canEditVehicle || canDeleteVehicle) && <th></th>}
                            </tr>
                        </thead>
                        <tbody>
                            {pagedAraclar.map((item) => {
                                const avClass = avatarClass(item.surucu);
                                return (
                                    <tr key={item.id} className="ar-table-row">
                                        {visibleTableColumns.map((column) => {
                                            if (column.key === "surucu") {
                                                return (
                                                    <td key={column.key}>
                                                        <div className="ar-table-driver">
                                                            <div className={`ar-avatar ar-avatar-sm ${avClass}`}>{initials(item.surucu)}</div>
                                                            <span>{item.surucu || "—"}</span>
                                                        </div>
                                                    </td>
                                                );
                                            }

                                            if (column.key === "cekici") {
                                                return <td key={column.key}>{item.cekici ? <span className="ar-tbl-plate ar-tbl-cekici">{item.cekici}</span> : <span className="ar-tbl-empty">—</span>}</td>;
                                            }

                                            if (column.key === "dorse") {
                                                return <td key={column.key}>{item.dorse ? <span className="ar-tbl-plate ar-tbl-dorse">{item.dorse}</span> : <span className="ar-tbl-empty">—</span>}</td>;
                                            }

                                            if (column.key === "tc") {
                                                return <td key={column.key} className="ar-tbl-mono">{item.tc || <span className="ar-tbl-empty">—</span>}</td>;
                                            }

                                            if (column.key === "telefon") {
                                                return <td key={column.key}>{item.telefon || <span className="ar-tbl-empty">—</span>}</td>;
                                            }

                                            if (column.key === "vkn") {
                                                return <td key={column.key} className="ar-tbl-mono">{getVknText(item) || <span className="ar-tbl-empty">—</span>}</td>;
                                            }

                                            if (column.key === "datalogerNo") {
                                                return <td key={column.key} className="ar-tbl-mono">{item.datalogerNo || <span className="ar-tbl-empty">—</span>}</td>;
                                            }

                                            return null;
                                        })}

                                        {(canEditVehicle || canDeleteVehicle) && (
                                            <td>
                                                <div className="ar-table-actions">
                                                    {canEditVehicle && (
                                                        <button className="ar-edit-icon" onClick={() => startEdit(item)} type="button" title="Düzenle">
                                                            <IconEdit />
                                                        </button>
                                                    )}
                                                    {canDeleteVehicle && (
                                                        <button className="ar-delete-icon" onClick={() => deleteArac(item.id)} type="button" title="Sil">
                                                            <IconTrash />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        )}
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
