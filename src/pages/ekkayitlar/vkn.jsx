import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContext";
import "./vkn.css";

const PAGE_KEY = "ekkayit_vkn";

const BUTTONS = {
    CREATE: "Yeni VKN Ekle",
    EDIT: "Düzenle",
    UPDATE: "Güncelle",
    DELETE: "Sil",
};

const COLUMNS = {
    VKN: "VKN",
    USAGE: "Kullanım Sayısı",
};

export default function Vkn() {
    const { canPage, canButton, canColumn } = useAuth();

    const canViewPage = canPage(PAGE_KEY);
    const canCreate = canButton(PAGE_KEY, BUTTONS.CREATE);
    const canEdit = canButton(PAGE_KEY, BUTTONS.EDIT);
    const canUpdate = canButton(PAGE_KEY, BUTTONS.UPDATE);
    const canDelete = canButton(PAGE_KEY, BUTTONS.DELETE);

    const showVkn = canColumn(PAGE_KEY, COLUMNS.VKN);
    const showUsage = canColumn(PAGE_KEY, COLUMNS.USAGE);
    const showActions = canEdit || canDelete;

    const [vknList, setVknList] = useState([]);
    const [vkn, setVkn] = useState("");
    const [editingItem, setEditingItem] = useState(null);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (canViewPage) fetchVknler();
    }, [canViewPage]);

    async function fetchVknler() {
        setLoading(true);

        const { data, error } = await supabase
            .from("vknler")
            .select(`
                id,
                vkn,
                araclar:araclar!araclar_vkn_id_fkey(id)
            `)
            .order("vkn", { ascending: true });

        setLoading(false);

        if (error) {
            console.error("VKN verileri alınamadı:", error);
            alert("VKN verileri alınamadı.");
            return;
        }

        setVknList(data || []);
    }

    function resetForm() {
        setVkn("");
        setEditingItem(null);
    }

    function startEdit(item) {
        if (!canEdit) {
            alert("Düzenleme yetkiniz yok.");
            return;
        }

        setEditingItem(item);
        setVkn(item.vkn);
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    async function saveVkn(e) {
        e.preventDefault();

        if (editingItem && !canUpdate) {
            alert("Güncelleme yetkiniz yok.");
            return;
        }

        if (!editingItem && !canCreate) {
            alert("Yeni VKN ekleme yetkiniz yok.");
            return;
        }

        const newVkn = vkn.trim();

        if (!newVkn) {
            alert("Lütfen VKN girin.");
            return;
        }

        setSaving(true);

        const result = editingItem
            ? await supabase
                .from("vknler")
                .update({ vkn: newVkn })
                .eq("id", editingItem.id)
            : await supabase
                .from("vknler")
                .insert({ vkn: newVkn });

        setSaving(false);

        if (result.error) {
            console.error("VKN kayıt hatası:", result.error);

            if (result.error.code === "23505") {
                alert("Bu VKN zaten kayıtlı.");
            } else {
                alert("Kayıt işlemi başarısız oldu.");
            }

            return;
        }

        resetForm();
        fetchVknler();
    }

    async function deleteVkn(item) {
        if (!canDelete) {
            alert("Silme yetkiniz yok.");
            return;
        }

        const count = item.araclar?.length || 0;

        if (count > 0) {
            alert(
                `Bu VKN ${count} araçta kullanılıyor. Önce araçlardan bu VKN bağlantısını kaldırmalısın.`
            );
            return;
        }

        const ok = window.confirm(`${item.vkn} VKN değeri silinsin mi?`);

        if (!ok) return;

        const { error } = await supabase
            .from("vknler")
            .delete()
            .eq("id", item.id);

        if (error) {
            console.error("VKN silme hatası:", error);
            alert("Silme işlemi başarısız oldu.");
            return;
        }

        fetchVknler();
    }

    const filteredVknList = useMemo(() => {
        const q = search.toLowerCase().trim();

        const list = vknList.map((item) => ({
            ...item,
            count: item.araclar?.length || 0,
        }));

        if (!q) return list;

        return list.filter((item) =>
            String(item.vkn || "").toLowerCase().includes(q)
        );
    }, [vknList, search]);

    const totalUsage = useMemo(
        () => filteredVknList.reduce((sum, item) => sum + item.count, 0),
        [filteredVknList]
    );

    const colSpan = [showVkn, showUsage, showActions].filter(Boolean).length || 1;

    if (!canViewPage) {
        return (
            <div className="vkn-page">
                <div className="vkn-shell">
                    <section className="vkn-card">
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
        <div className="vkn-page">
            <div className="vkn-shell">
                <header className="vkn-header">
                    <div className="vkn-header-text">
                        <span className="vkn-eyebrow">Operasyon · Tanım Kayıtları</span>
                        <h1>VKN Kayıtları</h1>
                        <p>{filteredVknList.length} VKN listeleniyor</p>
                    </div>

                    <div className="vkn-header-right">
                        <div className="vkn-header-meta">
                            <div className="meta-chip">
                                <span className="meta-chip-value">{filteredVknList.length}</span>
                                <span className="meta-chip-label">Toplam VKN</span>
                            </div>
                            <div className="meta-chip meta-chip-accent">
                                <span className="meta-chip-value">{totalUsage}</span>
                                <span className="meta-chip-label">Araç Bağlantısı</span>
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
                                placeholder="VKN ara..."
                                aria-label="VKN ara"
                            />
                        </div>
                    </div>
                </header>

                {(canCreate || editingItem) && (
                    <form className="vkn-form" onSubmit={saveVkn}>
                        <div className="form-title">
                            <div className="form-title-left">
                                <span className={editingItem ? "form-mode-dot edit" : "form-mode-dot"} aria-hidden="true" />
                                <strong>
                                    {editingItem ? "VKN Düzenle" : "Yeni VKN Ekle"}
                                </strong>
                            </div>

                            {editingItem && (
                                <span className="form-title-meta">
                                    Eski VKN: <code>{editingItem.vkn}</code>
                                </span>
                            )}
                        </div>

                        <div className="form-grid only-vkn">
                            <input
                                value={vkn}
                                onChange={(e) => setVkn(e.target.value)}
                                placeholder="VKN girin"
                                aria-label="VKN"
                            />

                            <div className="form-actions">
                                {editingItem && (
                                    <button
                                        type="button"
                                        className="btn-cancel"
                                        onClick={resetForm}
                                    >
                                        Vazgeç
                                    </button>
                                )}

                                <button
                                    type="submit"
                                    className="btn-save"
                                    disabled={saving}
                                >
                                    {saving
                                        ? "Kaydediliyor..."
                                        : editingItem
                                            ? "Güncelle"
                                            : "Ekle"}
                                </button>
                            </div>
                        </div>
                    </form>
                )}

                <section className="vkn-card">
                    <div className="vkn-table-wrap">
                        <table className="vkn-table">
                            <thead>
                                <tr>
                                    {showVkn && <th>VKN</th>}
                                    {showUsage && <th>Kullanım Sayısı</th>}
                                    {showActions && <th className="th-actions">İşlemler</th>}
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
                                ) : filteredVknList.length === 0 ? (
                                    <tr>
                                        <td colSpan={colSpan} className="empty-row">
                                            <span className="empty-state">Kayıt bulunamadı.</span>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredVknList.map((item) => (
                                        <tr key={item.id}>
                                            {showVkn && (
                                                <td>
                                                    <span className="vkn-pill">
                                                        {item.vkn}
                                                    </span>
                                                </td>
                                            )}

                                            {showUsage && (
                                                <td>
                                                    <span
                                                        className={
                                                            item.count > 0
                                                                ? "usage-badge active"
                                                                : "usage-badge"
                                                        }
                                                    >
                                                        {item.count} kayıt
                                                    </span>
                                                </td>
                                            )}

                                            {showActions && (
                                                <td>
                                                    <div className="row-actions">
                                                        {canEdit && (
                                                            <button
                                                                type="button"
                                                                className="edit-btn"
                                                                onClick={() => startEdit(item)}
                                                            >
                                                                Düzenle
                                                            </button>
                                                        )}

                                                        {canDelete && (
                                                            <button
                                                                type="button"
                                                                className="delete-btn"
                                                                onClick={() => deleteVkn(item)}
                                                            >
                                                                Sil
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </div>
    );
}