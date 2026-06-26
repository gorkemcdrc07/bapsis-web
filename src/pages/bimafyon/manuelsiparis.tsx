import React, { useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import "./manuelsiparis.css";

const emptyForm = {
    tarih: "",
    musteri: "",
    varis1: "",
    varis2: "",
    varis3: "",
    varis4: "",
    palet: "",
    aracTipi: "",
    aciklama: "",
};

type ToastType = "success" | "error" | "warning" | "info";

type ToastState = {
    show: boolean;
    type: ToastType;
    title: string;
    message: string;
};

type ManuelSiparisOrder = typeof emptyForm & {
    id: string;
    kaynak?: string;
    durum?: string;
};

type ManuelSiparisProps = {
    onOnayla?: (payload: {
        batchId: string;
        orders: ManuelSiparisOrder[];
    }) => void;
};

function normalizeDate(value: string) {
    if (!value) return "";

    const text = String(value).trim();

    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;

    if (/^\d{2}\.\d{2}\.\d{4}$/.test(text)) {
        const [day, month, year] = text.split(".");
        return `${year}-${month}-${day}`;
    }

    if (/^\d{2}\/\d{2}\/\d{4}$/.test(text)) {
        const [day, month, year] = text.split("/");
        return `${year}-${month}-${day}`;
    }

    return text;
}

function formatDate(value: string) {
    if (!value) return "-";

    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const [year, month, day] = value.split("-");
        return `${day}.${month}.${year}`;
    }

    return value;
}

function splitBolgeToVaris(bolge: string) {
    const parts = String(bolge || "")
        .split("+")
        .map((item) => item.trim())
        .filter(Boolean);

    return {
        varis1: parts[0] || "",
        varis2: parts[1] || "",
        varis3: parts[2] || "",
        varis4: parts[3] || "",
    };
}

function getVarisArray(order: ManuelSiparisOrder) {
    return [order.varis1, order.varis2, order.varis3, order.varis4].filter(Boolean);
}

function createBatchId(prefix = "manuel") {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
        return crypto.randomUUID();
    }

    return `${prefix}_${Date.now()}`;
}

function ManuelSiparis({ onOnayla }: ManuelSiparisProps = {}) {
    const [orders, setOrders] = useState<ManuelSiparisOrder[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [search, setSearch] = useState("");
    const [saving, setSaving] = useState(false);

    const [toast, setToast] = useState<ToastState>({
        show: false,
        type: "info",
        title: "",
        message: "",
    });

    const showToast = (type: ToastType, title: string, message: string) => {
        setToast({ show: true, type, title, message });

        window.clearTimeout((showToast as any).timer);
        (showToast as any).timer = window.setTimeout(() => {
            setToast((prev) => ({ ...prev, show: false }));
        }, 3200);
    };

    const toplamPalet = useMemo(
        () => orders.reduce((sum, item) => sum + Number(item.palet || 0), 0),
        [orders]
    );

    const filteredOrders = useMemo(() => {
        const keyword = search.trim().toLocaleLowerCase("tr-TR");

        return orders.filter((order) => {
            const text = [
                order.tarih,
                order.musteri,
                order.varis1,
                order.varis2,
                order.varis3,
                order.varis4,
                order.aracTipi,
                order.aciklama,
            ]
                .join(" ")
                .toLocaleLowerCase("tr-TR");

            return !keyword || text.includes(keyword);
        });
    }, [orders, search]);

    const parseExcelText = (text: string): ManuelSiparisOrder[] => {
        const lines = text
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean);

        return lines
            .map((line, index) => {
                const cols = line.split("\t").map((x) => x.trim());

                const firstCol = cols[0]?.toUpperCase();
                const secondCol = cols[1]?.toUpperCase();

                const isHeader =
                    firstCol?.includes("YÜKLEME") ||
                    firstCol?.includes("TARİH") ||
                    secondCol?.includes("BÖLGE");

                if (isHeader) return null;

                const tarih = normalizeDate(cols[0] || "");
                const bolge = cols[1] || "";
                const aracTipi = cols[2] || "";
                const varisler = splitBolgeToVaris(bolge);

                return {
                    id: `${Date.now()}_${index}`,
                    tarih,
                    musteri: "BİM AFYON",
                    ...varisler,
                    palet: "1",
                    aracTipi,
                    aciklama: "",
                    kaynak: "Manuel",
                    durum: "Bekliyor",
                };
            })
            .filter(Boolean) as ManuelSiparisOrder[];
    };

    const handleExcelText = (text: string) => {
        const parsedOrders = parseExcelText(text);

        if (!parsedOrders.length) {
            showToast("warning", "Veri bulunamadı", "Aktarılacak geçerli Excel verisi bulunamadı.");
            return;
        }

        setOrders((prev) => [...prev, ...parsedOrders]);
        showToast("success", "Excel verisi aktarıldı", `${parsedOrders.length} sipariş listeye eklendi.`);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);

        const text = e.dataTransfer.getData("text/plain");

        if (!text) {
            showToast("warning", "Excel verisi okunamadı", "Excel’den alanı seçip sürükleyin veya kopyala-yapıştır yapın.");
            return;
        }

        handleExcelText(text);
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
        const text = e.clipboardData.getData("text/plain");
        if (text) handleExcelText(text);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setForm((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!form.tarih || !form.musteri || !form.varis1 || !form.palet) {
            showToast("warning", "Eksik bilgi var", "Sevk tarihi, müşteri, varış 1 ve palet sayısı zorunludur.");
            return;
        }

        setOrders((prev) => [
            ...prev,
            {
                id: `${Date.now()}`,
                ...form,
                kaynak: "Manuel",
                durum: "Bekliyor",
            },
        ]);

        setForm(emptyForm);
        showToast("success", "Sipariş eklendi", "Manuel sipariş listeye başarıyla eklendi.");
    };

    const handleDelete = (id: string) => {
        setOrders((prev) => prev.filter((item) => item.id !== id));
        showToast("info", "Sipariş silindi", "Seçili sipariş listeden kaldırıldı.");
    };

    const handleClear = () => {
        setOrders([]);
        setSearch("");
        showToast("info", "Liste temizlendi", "Tüm manuel sipariş kayıtları temizlendi.");
    };

    const buildActiveTripRows = (batchId: string) =>
        orders.map((order) => ({
            kaynak: "Manuel",
            sefer_no: null,
            sevk_tarihi: order.tarih,
            yukleyen_depo: "BİM AFYON",
            kalkis_yeri: "AFYONKARAHİSAR",
            arac_cinsi: order.aracTipi || null,
            cekici: null,
            dorse: null,
            tc: null,
            surucu: null,
            telefon: null,
            fatura_vkn: null,
            varis1: order.varis1,
            varis2: order.varis2 || null,
            varis3: order.varis3 || null,
            varis4: order.varis4 || null,
            palet: Number(order.palet || 1),
            irsaliye_no: null,
            dataloger_no: null,
            navlun: null,
            guncelleyen_kisi: null,
            guncelledigi_alan: "Manuel Sipariş",
            guncelleme_saati: null,
            arac_durumu: "Plaka Bekliyor",
            peron_no: null,
            peron_giren_kullanici: null,
            peron_girilme_tarih: null,
            yuklemeden_cikis_saati: null,
            aciklama: order.aciklama || null,
            planlama_arac: null,
            planlama_truck_id: null,
            planlama_stop_id: null,
            batch_id: batchId,
        }));

    const handleOnayla = async () => {
        if (orders.length === 0) {
            showToast("warning", "Sipariş yok", "Plaka atamaya geçmek için en az bir sipariş oluşturun.");
            return;
        }

        const invalidOrder = orders.find((order) => !order.tarih || !order.varis1 || !order.palet);

        if (invalidOrder) {
            showToast("warning", "Eksik sipariş var", "Tüm siparişlerde tarih, varış 1 ve palet alanı dolu olmalı.");
            return;
        }

        try {
            setSaving(true);

            const batchId = createBatchId("manuel");
            const rows = buildActiveTripRows(batchId);

            const { error } = await supabase.from("aktif_seferler").insert(rows);

            if (error) {
                console.error(error);
                showToast("error", "Aktarım başarısız", error.message);
                return;
            }

            onOnayla?.({ batchId, orders });

            showToast("success", "Aktarım tamamlandı", `${rows.length} manuel kayıt aktif seferlere aktarıldı.`);

            setOrders([]);
            setSearch("");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="manuel-page">
            {toast.show && (
                <div className={`modern-toast ${toast.type}`}>
                    <div className="toast-icon">
                        {toast.type === "success" && "✓"}
                        {toast.type === "error" && "!"}
                        {toast.type === "warning" && "!"}
                        {toast.type === "info" && "i"}
                    </div>

                    <div className="toast-content">
                        <strong>{toast.title}</strong>
                        <p>{toast.message}</p>
                    </div>

                    <button
                        type="button"
                        className="toast-close"
                        onClick={() => setToast((prev) => ({ ...prev, show: false }))}
                    >
                        ×
                    </button>
                </div>
            )}

            <div className="manuel-shell">
                <section className="manuel-header">
                    <div>
                        <span>Manuel Sipariş İşlemi</span>
                        <h1>Sipariş Oluştur</h1>
                        <p>Excel’den hızlı aktarım yapın veya tekil siparişi manuel ekleyin.</p>
                    </div>

                    <div className="manuel-header-actions">
                        <button
                            type="button"
                            className="ghost-btn"
                            onClick={handleClear}
                            disabled={saving || orders.length === 0}
                        >
                            Temizle
                        </button>

                        <button
                            type="button"
                            className="success-btn"
                            onClick={handleOnayla}
                            disabled={saving || orders.length === 0}
                        >
                            {saving ? "Aktarılıyor..." : "Plaka Atamaya Geç"}
                        </button>
                    </div>
                </section>

                <section
                    className={`excel-drop ${isDragging ? "active" : ""}`}
                    tabIndex={0}
                    onPaste={handlePaste}
                    onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                >
                    <div className="excel-drop-icon">⇩</div>

                    <div>
                        <h2>Excel verisini buraya bırak</h2>
                        <p>Yükleme Tarihi, Bölge ve Araç Tipi kolonlarını destekler.</p>
                    </div>

                    <strong>{orders.length} Sipariş</strong>
                </section>

                <form className="order-form-card" onSubmit={handleSubmit}>
                    <div className="form-head">
                        <div>
                            <h2>Yeni Sipariş Bilgileri</h2>
                            <p>Zorunlu alanları doldurup siparişi listeye ekleyin.</p>
                        </div>

                        <div className="mini-stats">
                            <span>Toplam Palet</span>
                            <b>{toplamPalet}</b>
                        </div>
                    </div>

                    <div className="form-grid">
                        <label>
                            <span>Sevk Tarihi *</span>
                            <input
                                type="date"
                                name="tarih"
                                value={form.tarih}
                                onChange={handleChange}
                            />
                        </label>

                        <label>
                            <span>Palet *</span>
                            <input
                                type="number"
                                name="palet"
                                min="1"
                                placeholder="1"
                                value={form.palet}
                                onChange={handleChange}
                            />
                        </label>

                        <label>
                            <span>Müşteri / Firma *</span>
                            <input
                                type="text"
                                name="musteri"
                                placeholder="BİM AFYON"
                                value={form.musteri}
                                onChange={handleChange}
                            />
                        </label>

                        <label>
                            <span>Araç Tipi</span>
                            <input
                                type="text"
                                name="aracTipi"
                                placeholder="TIR"
                                value={form.aracTipi}
                                onChange={handleChange}
                            />
                        </label>

                        <label>
                            <span>Varış 1 *</span>
                            <input
                                type="text"
                                name="varis1"
                                placeholder="AFYON"
                                value={form.varis1}
                                onChange={handleChange}
                            />
                        </label>

                        <label>
                            <span>Varış 2</span>
                            <input
                                type="text"
                                name="varis2"
                                placeholder="Opsiyonel"
                                value={form.varis2}
                                onChange={handleChange}
                            />
                        </label>

                        <label>
                            <span>Varış 3</span>
                            <input
                                type="text"
                                name="varis3"
                                placeholder="Opsiyonel"
                                value={form.varis3}
                                onChange={handleChange}
                            />
                        </label>

                        <label>
                            <span>Varış 4</span>
                            <input
                                type="text"
                                name="varis4"
                                placeholder="Opsiyonel"
                                value={form.varis4}
                                onChange={handleChange}
                            />
                        </label>

                        <label className="full">
                            <span>Açıklama</span>
                            <textarea
                                name="aciklama"
                                placeholder="Sipariş notu..."
                                value={form.aciklama}
                                onChange={handleChange}
                            />
                        </label>
                    </div>

                    <button type="submit" className="primary-btn" disabled={saving}>
                        Siparişi Listeye Ekle
                    </button>
                </form>

                <section className="orders-area">
                    <div className="orders-toolbar">
                        <div>
                            <h2>Sipariş Listesi</h2>
                            <p>{filteredOrders.length} kayıt gösteriliyor</p>
                        </div>

                        <div className="search-box">
                            <span>⌕</span>
                            <input
                                type="text"
                                placeholder="Bölge, müşteri veya araç ara..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    {orders.length === 0 ? (
                        <div className="empty-state">
                            <strong>Henüz sipariş eklenmedi</strong>
                            <p>Excel verisini sürükleyin veya manuel sipariş oluşturun.</p>
                        </div>
                    ) : filteredOrders.length === 0 ? (
                        <div className="empty-state">
                            <strong>Sonuç bulunamadı</strong>
                            <p>Arama alanını değiştirerek tekrar deneyin.</p>
                        </div>
                    ) : (
                        <div className="orders-list">
                            {filteredOrders.map((order, index) => {
                                const varisler = getVarisArray(order);

                                return (
                                    <article className="order-item" key={order.id}>
                                        <div className="order-index">
                                            {String(index + 1).padStart(2, "0")}
                                        </div>

                                        <div className="order-content">
                                            <div className="route-line">
                                                {varisler.map((varis, i) => (
                                                    <React.Fragment key={`${order.id}_${varis}_${i}`}>
                                                        <span>{varis}</span>
                                                        {i < varisler.length - 1 && <b>→</b>}
                                                    </React.Fragment>
                                                ))}
                                            </div>

                                            <div className="order-meta">
                                                <small>{order.musteri}</small>
                                                <small>{formatDate(order.tarih)}</small>
                                                <small>{order.aracTipi || "Araç tipi yok"}</small>
                                            </div>
                                        </div>

                                        <div className="pallet-pill">{order.palet} Palet</div>

                                        <button
                                            type="button"
                                            className="delete-btn"
                                            onClick={() => handleDelete(order.id)}
                                            disabled={saving}
                                        >
                                            Sil
                                        </button>
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}

export default ManuelSiparis;