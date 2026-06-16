// Siparis.jsx
import React from "react";
import { supabase } from "../../lib/supabaseClient";
import "./Siparis.css";

const TABLES = {
    source: "donusler_musteri",
    activeReturns: "donusler_aktif_seferler",
};

const todayString = () =>
    new Date().toLocaleDateString("tr-TR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });

const normalizeText = (v) => String(v || "").trim();

const formatDateTime = (value) => {
    if (!value) return "-";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString("tr-TR");
};

export default function Siparis() {
    const [loading, setLoading] = React.useState(true);
    const [adding, setAdding] = React.useState(false);
    const [openingOrders, setOpeningOrders] = React.useState(false);

    const [sourceRows, setSourceRows] = React.useState([]);
    const [search, setSearch] = React.useState("");
    const [selectedCustomer, setSelectedCustomer] = React.useState(null);
    const [selectedRoute, setSelectedRoute] = React.useState(null);

    const [createdOrders, setCreatedOrders] = React.useState([]);
    const [previewOrder, setPreviewOrder] = React.useState(null);
    const [toast, setToast] = React.useState(null);

    const [dialogOpen, setDialogOpen] = React.useState(false);
    const [addMode, setAddMode] = React.useState("existing");

    const [newValues, setNewValues] = React.useState({
        musteri_adi: "",
        yukleme_yeri: "",
        teslim_yeri: "",
        navlun: "",
    });
    const showToast = (text, type = "success") => {
        setToast({ text, type });
        setTimeout(() => setToast(null), 2800);
    };

    const fetchSource = React.useCallback(async () => {
        setLoading(true);

        const { data, error } = await supabase
            .from(TABLES.source)
            .select("id, musteri_adi, yukleme_yeri, teslim_yeri, navlun")
            .order("id", { ascending: true });

        setLoading(false);

        if (error) {
            showToast("Veriler alınamadı.", "error");
            return;
        }

        setSourceRows(data || []);
    }, []);

    React.useEffect(() => {
        fetchSource();
    }, [fetchSource]);

    const allCustomers = React.useMemo(() => {
        const map = new Map();

        sourceRows.forEach((row) => {
            const key = normalizeText(row.musteri_adi);
            if (!key) return;

            if (!map.has(key)) map.set(key, 0);
            map.set(key, map.get(key) + 1);
        });

        return Array.from(map.entries())
            .sort((a, b) => a[0].localeCompare(b[0], "tr"))
            .map(([name, count]) => ({ name, count }));
    }, [sourceRows]);

    const filteredCustomers = React.useMemo(() => {
        const q = normalizeText(search).toLowerCase();
        if (!q) return allCustomers;

        return allCustomers.filter((c) =>
            c.name.toLowerCase().includes(q)
        );
    }, [allCustomers, search]);

    const routes = React.useMemo(() => {
        if (!selectedCustomer) return [];

        return sourceRows.filter(
            (row) => normalizeText(row.musteri_adi) === selectedCustomer
        );
    }, [sourceRows, selectedCustomer]);

    function selectCustomer(name) {
        setSelectedCustomer(name);
        setSelectedRoute(null);
        setPreviewOrder(null);
    }

    function handleSaveOrder() {
        if (!selectedCustomer || !selectedRoute) {
            showToast("Müşteri ve rota seçilmelidir.", "warning");
            return;
        }

        const preview = {
            id: Date.now(),
            sefer_no: "",
            sevk_tarihi: todayString(),
            musteri_adi: selectedCustomer,
            yukleme_yeri: selectedRoute.yukleme_yeri,
            cekici: "",
            dorse: "",
            tc: "",
            surucu: "",
            telefon: "",
            vkn: "",
            varis1: selectedRoute.teslim_yeri,
            varis2: "",
            irsaliyeno: "",
            navlun: selectedRoute.navlun ? String(selectedRoute.navlun) : "",
            arac_durumu: "",
            created_at: new Date().toISOString(),
        };

        setCreatedOrders((prev) => [preview, ...prev]);
        setPreviewOrder(preview);
        setSelectedRoute(null);
        showToast("Sipariş önizlemeye eklendi.");
    }

    async function handleOpenOrders() {
        if (createdOrders.length === 0) {
            showToast("Aktarılacak sipariş yok.", "warning");
            return;
        }

        const rows = createdOrders.map((order) => ({
            kaynak: "DÖNÜŞ",
            sefer_no: order.sefer_no || "",
            sevk_tarihi: new Date().toISOString().slice(0, 10),

            yukleyen_depo: order.musteri_adi || "",
            kalkis_yeri: order.yukleme_yeri || "",
            arac_cinsi: "",

            cekici: order.cekici || "",
            dorse: order.dorse || "",
            tc: order.tc || "",
            surucu: order.surucu || "",
            telefon: order.telefon || "",

            fatura_vkn: order.vkn || "",
            vkn: order.vkn || "",

            varis1: order.varis1 || "",
            varis2: order.varis2 || "",
            varis3: "",
            varis4: "",

            palet: 1,
            irsaliye_no: order.irsaliyeno || "",
            dataloger_no: "",

            navlun: order.navlun ? Number(order.navlun) : null,

            guncelleyen_kisi: "",
            guncelledigi_alan: "",
            guncelleme_saati: null,

            arac_durumu: "Plaka Bekliyor",

            peron_no: "",
            peron_giren_kullanici: "",
            peron_girilme_tarih: null,

            yuklemeden_cikis_saati: null,

            aciklama: order.musteri_adi || "",

            planlama_arac: "",
            planlama_truck_id: "",
            planlama_stop_id: "",

            batch_id: `DONUS-${Date.now()}`,
        }));

        setOpeningOrders(true);

        const { error } = await supabase
            .from(TABLES.activeReturns)
            .insert(rows);

        setOpeningOrders(false);

        if (error) {
            console.error(error);
            showToast("Siparişler aktif sefere aktarılamadı.", "error");
            return;
        }

        setCreatedOrders([]);
        setPreviewOrder(null);
        showToast("Siparişler aktif sefere aktarıldı.");
    }
    async function handleAddNew() {
        const p = {
            musteri_adi: newValues.musteri_adi.trim(),
            yukleme_yeri: newValues.yukleme_yeri.trim(),
            teslim_yeri: newValues.teslim_yeri.trim(),
            navlun: newValues.navlun.trim(),
        };

        if (!p.musteri_adi || !p.yukleme_yeri || !p.teslim_yeri) {
            showToast("Müşteri, yükleme ve teslim zorunlu.", "warning");
            return;
        }

        setAdding(true);

        const { error } = await supabase.from(TABLES.source).insert([p]);

        setAdding(false);

        if (error) {
            showToast("Kayıt eklenemedi.", "error");
            return;
        }

        await fetchSource();

        setSelectedCustomer(p.musteri_adi);
        setSelectedRoute(null);
        setDialogOpen(false);
        setAddMode("existing");

        setNewValues({
            musteri_adi: "",
            yukleme_yeri: "",
            teslim_yeri: "",
            navlun: "",
        });

        showToast(
            addMode === "existing"
                ? "Mevcut müşteriye yeni rota eklendi."
                : "Yeni müşteri ve rota eklendi."
        );
    }

    const canSave = selectedCustomer && selectedRoute;

    return (
        <div className="sp-page">
            {toast && (
                <div className={`sp-toast sp-toast--${toast.type}`}>
                    {toast.text}
                </div>
            )}

            <div className="sp-header">
                <div className="sp-header-left">
                    <div className="sp-avatar">↩</div>
                    <div>
                        <h1 className="sp-title">Dönüş sipariş oluştur</h1>
                        <p className="sp-subtitle">
                            Müşteri seç → rota seç → kaydet
                        </p>
                    </div>
                </div>

                <div className="sp-header-right">
                    <span className="sp-date-pill">📅 {todayString()}</span>

                    <button
                        className="sp-icon-btn"
                        onClick={fetchSource}
                        disabled={loading}
                        title="Yenile"
                    >
                        ↻
                    </button>

                    <button
                        className="sp-add-btn"
                        onClick={() => {
                            setAddMode(selectedCustomer ? "existing" : "new");
                            setNewValues((p) => ({
                                ...p,
                                musteri_adi: selectedCustomer || "",
                            }));
                            setDialogOpen(true);
                        }}
                    >
                        + Yeni değer
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="sp-loading">Yükleniyor...</div>
            ) : (
                <>
                    <div className="sp-body">
                        <div className="sp-col">
                            <div className="sp-search-wrap">
                                <span className="sp-search-icon">🔍</span>

                                <input
                                    className="sp-search"
                                    placeholder="Müşteri ara..."
                                    value={search}
                                    onChange={(e) => {
                                        setSearch(e.target.value);
                                        setSelectedCustomer(null);
                                        setSelectedRoute(null);
                                        setPreviewOrder(null);
                                    }}
                                />

                                {search && (
                                    <button
                                        className="sp-search-clear"
                                        onClick={() => setSearch("")}
                                    >
                                        ×
                                    </button>
                                )}
                            </div>

                            <div className="sp-section-label">
                                Müşteri
                                <span className="sp-count">
                                    {filteredCustomers.length}
                                </span>
                            </div>

                            <div className="sp-customer-list">
                                {filteredCustomers.length === 0 && (
                                    <div className="sp-empty">
                                        Sonuç bulunamadı.
                                    </div>
                                )}

                                {filteredCustomers.map((c) => (
                                    <button
                                        key={c.name}
                                        className={`sp-customer-card${selectedCustomer === c.name
                                                ? " sp-customer-card--active"
                                                : ""
                                            }`}
                                        onClick={() => selectCustomer(c.name)}
                                    >
                                        <div className="sp-customer-initial">
                                            {c.name[0]}
                                        </div>

                                        <div className="sp-customer-info">
                                            <div className="sp-customer-name">
                                                {c.name}
                                            </div>
                                            <div className="sp-customer-meta">
                                                {c.count} rota
                                            </div>
                                        </div>

                                        {selectedCustomer === c.name && (
                                            <span className="sp-check">✓</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="sp-col">
                            <div className="sp-section-label">
                                {selectedCustomer
                                    ? `${selectedCustomer} — rotalar`
                                    : "Rota"}

                                {selectedCustomer && (
                                    <span className="sp-count">
                                        {routes.length}
                                    </span>
                                )}
                            </div>

                            {!selectedCustomer ? (
                                <div className="sp-empty sp-empty--hint">
                                    Önce soldaki listeden bir müşteri seçin.
                                </div>
                            ) : routes.length === 0 ? (
                                <div className="sp-empty">
                                    Bu müşteri için rota yok.
                                </div>
                            ) : (
                                <div className="sp-route-list">
                                    {routes.map((row) => {
                                        const isActive =
                                            selectedRoute?.id === row.id;

                                        return (
                                            <button
                                                key={row.id}
                                                className={`sp-route-card${isActive
                                                        ? " sp-route-card--active"
                                                        : ""
                                                    }`}
                                                onClick={() =>
                                                    setSelectedRoute(
                                                        isActive ? null : row
                                                    )
                                                }
                                            >
                                                <div className="sp-route-dots">
                                                    <div className="sp-route-dot sp-route-dot--from" />
                                                    <div className="sp-route-line" />
                                                    <div className="sp-route-dot sp-route-dot--to" />
                                                </div>

                                                <div className="sp-route-info">
                                                    <div className="sp-route-from">
                                                        {row.yukleme_yeri}
                                                    </div>
                                                    <div className="sp-route-arrow">
                                                        →
                                                    </div>
                                                    <div className="sp-route-to">
                                                        {row.teslim_yeri}
                                                    </div>
                                                </div>

                                                <div className="sp-route-navlun">
                                                    {row.navlun
                                                        ? `₺${Number(
                                                            row.navlun
                                                        ).toLocaleString(
                                                            "tr-TR"
                                                        )}`
                                                        : "—"}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    <div
                        className={`sp-confirm-bar${canSave ? " sp-confirm-bar--ready" : ""
                            }`}
                    >
                        <div className="sp-confirm-chips">
                            <span className="sp-chip">
                                <span className="sp-chip-label">Müşteri</span>
                                {selectedCustomer || "—"}
                            </span>

                            <span className="sp-chip-sep">›</span>

                            <span className="sp-chip">
                                <span className="sp-chip-label">Yükleme</span>
                                {selectedRoute?.yukleme_yeri || "—"}
                            </span>

                            <span className="sp-chip-sep">›</span>

                            <span className="sp-chip">
                                <span className="sp-chip-label">Teslim</span>
                                {selectedRoute?.teslim_yeri || "—"}
                            </span>

                            {selectedRoute?.navlun && (
                                <>
                                    <span className="sp-chip-sep">›</span>
                                    <span className="sp-chip sp-chip--navlun">
                                        ₺
                                        {Number(
                                            selectedRoute.navlun
                                        ).toLocaleString("tr-TR")}
                                    </span>
                                </>
                            )}
                        </div>

                            <button
                                className="sp-save-btn"
                                onClick={handleSaveOrder}
                                disabled={!canSave}
                            >
                                Siparişi önizlemeye ekle →
                            </button>
                        </div>

                    {previewOrder && (
                        <div className="sp-preview">
                            <div className="sp-preview-header">
                                <div>
                                    <div className="sp-preview-eyebrow">
                                        Sipariş önizleme
                                    </div>
                                    <div className="sp-preview-title">
                                        {previewOrder.musteri_adi}
                                    </div>
                                </div>

                                <span className="sp-preview-status">
                                    Kaydedildi
                                </span>
                            </div>

                            <div className="sp-preview-grid">
                                <div className="sp-preview-item">
                                    <span>Sevk tarihi</span>
                                    <strong>{previewOrder.sevk_tarihi}</strong>
                                </div>

                                <div className="sp-preview-item">
                                    <span>Yükleme</span>
                                    <strong>{previewOrder.yukleme_yeri}</strong>
                                </div>

                                <div className="sp-preview-item">
                                    <span>Teslim</span>
                                    <strong>{previewOrder.varis1}</strong>
                                </div>

                                <div className="sp-preview-item">
                                    <span>Navlun</span>
                                    <strong>
                                        {previewOrder.navlun
                                            ? `₺${Number(
                                                previewOrder.navlun
                                            ).toLocaleString("tr-TR")}`
                                            : "—"}
                                    </strong>
                                </div>
                            </div>

                            <div className="sp-preview-footer">
                                Oluşturulma zamanı:{" "}
                                {formatDateTime(previewOrder.created_at)}
                            </div>
                        </div>
                    )}
                </>
            )}

            {createdOrders.length > 0 && (
                <div className="sp-orders">
                    <div className="sp-orders-header">
                        <span>Bu oturumda oluşturulan siparişler</span>

                        <div className="sp-orders-header-actions">
                            <span className="sp-count">
                                {createdOrders.length}
                            </span>

                            <button
                                className="sp-open-orders-btn"
                                onClick={handleOpenOrders}
                                disabled={openingOrders || createdOrders.length === 0}
                            >
                                {openingOrders ? "Aktarılıyor..." : "Siparişleri aç"}
                            </button>
                        </div>
                    </div>
                    <div className="sp-orders-list">
                        {createdOrders.map((order) => (
                            <div key={order.id} className="sp-order-row">
                                <div className="sp-order-badge">✓</div>

                                <div className="sp-order-info">
                                    <span className="sp-order-customer">
                                        {order.musteri_adi}
                                    </span>
                                    <span className="sp-order-route">
                                        {order.yukleme_yeri} → {order.varis1}
                                    </span>
                                </div>

                                <div className="sp-order-meta">
                                    {order.navlun && (
                                        <span className="sp-order-navlun">
                                            ₺
                                            {Number(
                                                order.navlun
                                            ).toLocaleString("tr-TR")}
                                        </span>
                                    )}

                                    <span className="sp-order-time">
                                        {formatDateTime(order.created_at)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {dialogOpen && (
                <div
                    className="sp-modal-backdrop"
                    onClick={() => setDialogOpen(false)}
                >
                    <div
                        className="sp-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="sp-modal-header">
                            <div>
                                <div className="sp-modal-eyebrow">
                                    Yeni kayıt
                                </div>
                                <div className="sp-modal-title">
                                    Müşteri / rota ekle
                                </div>
                            </div>

                            <button
                                className="sp-modal-close"
                                onClick={() => setDialogOpen(false)}
                            >
                                ×
                            </button>
                        </div>

                        <div className="sp-modal-body">
                            <div className="sp-add-mode">
                                <button
                                    type="button"
                                    className={`sp-add-mode-btn${addMode === "existing" ? " sp-add-mode-btn--active" : ""}`}
                                    onClick={() => {
                                        setAddMode("existing");
                                        setNewValues((p) => ({
                                            ...p,
                                            musteri_adi: selectedCustomer || allCustomers[0]?.name || "",
                                        }));
                                    }}
                                >
                                    Olan müşteriye ekle
                                </button>

                                <button
                                    type="button"
                                    className={`sp-add-mode-btn${addMode === "new" ? " sp-add-mode-btn--active" : ""}`}
                                    onClick={() => {
                                        setAddMode("new");
                                        setNewValues((p) => ({
                                            ...p,
                                            musteri_adi: "",
                                        }));
                                    }}
                                >
                                    Yeni müşteri ekle
                                </button>
                            </div>

                            <div className="sp-field">
                                <label className="sp-field-label">Müşteri adı</label>

                                {addMode === "existing" ? (
                                    <select
                                        className="sp-field-input"
                                        value={newValues.musteri_adi}
                                        onChange={(e) =>
                                            setNewValues((p) => ({
                                                ...p,
                                                musteri_adi: e.target.value,
                                            }))
                                        }
                                    >
                                        <option value="">Müşteri seçin</option>
                                        {allCustomers.map((c) => (
                                            <option key={c.name} value={c.name}>
                                                {c.name}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <input
                                        className="sp-field-input"
                                        placeholder="Örn: Arçelik A.Ş."
                                        value={newValues.musteri_adi}
                                        onChange={(e) =>
                                            setNewValues((p) => ({
                                                ...p,
                                                musteri_adi: e.target.value,
                                            }))
                                        }
                                    />
                                )}
                            </div>

                            {[
                                {
                                    field: "yukleme_yeri",
                                    label: "Yükleme yeri",
                                    placeholder: "Örn: Çayırova Fabrika",
                                },
                                {
                                    field: "teslim_yeri",
                                    label: "Teslim yeri",
                                    placeholder: "Örn: Ankara OSB",
                                },
                                {
                                    field: "navlun",
                                    label: "Navlun (₺)",
                                    placeholder: "Örn: 4200",
                                },
                            ].map(({ field, label, placeholder }) => (
                                <div key={field} className="sp-field">
                                    <label className="sp-field-label">{label}</label>

                                    <input
                                        className="sp-field-input"
                                        placeholder={placeholder}
                                        value={newValues[field]}
                                        onChange={(e) =>
                                            setNewValues((p) => ({
                                                ...p,
                                                [field]: e.target.value,
                                            }))
                                        }
                                    />
                                </div>
                            ))}
                        </div>
                        <div className="sp-modal-footer">
                            <button
                                className="sp-modal-cancel"
                                onClick={() => setDialogOpen(false)}
                                disabled={adding}
                            >
                                Vazgeç
                            </button>

                            <button
                                className="sp-modal-save"
                                onClick={handleAddNew}
                                disabled={adding}
                            >
                                {adding ? "Kaydediliyor..." : "Kaydet"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}