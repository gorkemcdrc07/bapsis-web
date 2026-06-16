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

function normalizeDate(value) {
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

function formatDate(value) {
    if (!value) return "-";

    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const [year, month, day] = value.split("-");
        return `${day}.${month}.${year}`;
    }

    return value;
}

function splitBolgeToVaris(bolge) {
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

function getVarisArray(order) {
    return [order.varis1, order.varis2, order.varis3, order.varis4].filter(Boolean);
}

function createBatchId(prefix = "manuel") {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
        return crypto.randomUUID();
    }

    return `${prefix}_${Date.now()}`;
}

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

function ManuelSiparis({ onOnayla }: ManuelSiparisProps = {}) {
    const [orders, setOrders] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [search, setSearch] = useState("");
    const [dateFilter, setDateFilter] = useState("all");
    const [vehicleFilter, setVehicleFilter] = useState("all");
    const [saving, setSaving] = useState(false);

    const toplamPalet = useMemo(
        () => orders.reduce((sum, item) => sum + Number(item.palet || 0), 0),
        [orders]
    );

    const uniqueDates = useMemo(
        () => Array.from(new Set(orders.map((item) => item.tarih).filter(Boolean))).sort(),
        [orders]
    );

    const uniqueVehicles = useMemo(
        () => Array.from(new Set(orders.map((item) => item.aracTipi).filter(Boolean))).sort(),
        [orders]
    );

    const multiStopCount = useMemo(
        () => orders.filter((order) => getVarisArray(order).length > 1).length,
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
                order.kaynak,
            ]
                .join(" ")
                .toLocaleLowerCase("tr-TR");

            const matchesSearch = !keyword || text.includes(keyword);
            const matchesDate = dateFilter === "all" || order.tarih === dateFilter;
            const matchesVehicle = vehicleFilter === "all" || order.aracTipi === vehicleFilter;

            return matchesSearch && matchesDate && matchesVehicle;
        });
    }, [orders, search, dateFilter, vehicleFilter]);

    const parseExcelText = (text) => {
        const lines = text
            .split("\n")
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

                const tarih = normalizeDate(cols[0]);
                const bolge = cols[1] || "";
                const aracTipi = cols[2] || "";
                const varisler = splitBolgeToVaris(bolge);

                return {
                    id: `${Date.now()}_${index}`,
                    tarih,
                    musteri: "BİM AFYON",
                    ...varisler,
                    palet: 1,
                    aracTipi,
                    aciklama: "",
                    kaynak: "Manuel",
                    durum: "Bekliyor",
                };
            })
            .filter((item) => item && (item.tarih || item.varis1 || item.aracTipi));
    };

    const handleExcelText = (text) => {
        const parsedOrders = parseExcelText(text);

        if (!parsedOrders.length) {
            alert("Aktarılacak veri bulunamadı.");
            return;
        }

        setOrders((prev) => [...parsedOrders, ...prev]);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);

        const text = e.dataTransfer.getData("text/plain");

        if (!text) {
            alert("Excel’den alanı seçip sürükleyin veya kopyala-yapıştır yapın.");
            return;
        }

        handleExcelText(text);
    };

    const handlePaste = (e) => {
        const text = e.clipboardData.getData("text/plain");
        if (text) handleExcelText(text);
    };

    const handleChange = (e) => {
        setForm((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!form.tarih || !form.musteri || !form.varis1 || !form.palet) {
            alert("Sevk tarihi, müşteri, varış 1 ve palet sayısı zorunludur.");
            return;
        }

        setOrders((prev) => [
            {
                id: `${Date.now()}`,
                ...form,
                kaynak: "Manuel",
                durum: "Bekliyor",
            },
            ...prev,
        ]);

        setForm(emptyForm);
    };

    const handleDelete = (id) => {
        setOrders((prev) => prev.filter((item) => item.id !== id));
    };

    const handleClear = () => {
        setOrders([]);
        setSearch("");
        setDateFilter("all");
        setVehicleFilter("all");
    };

    const buildActiveTripRows = (batchId) =>
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
            alert("Plaka atamaya geçmek için en az bir sipariş oluşturun.");
            return;
        }

        const invalidOrder = orders.find((order) => !order.tarih || !order.varis1 || !order.palet);

        if (invalidOrder) {
            alert("Aktarmadan önce tüm siparişlerde tarih, varış 1 ve palet alanı dolu olmalı.");
            return;
        }

        try {
            setSaving(true);

            const batchId = createBatchId("manuel");
            const rows = buildActiveTripRows(batchId);

            const { error } = await supabase
                .from("aktif_seferler")
                .insert(rows);

            if (error) {
                console.error(error);
                alert(`Aktif sefer oluşturulamadı: ${error.message}`);
                return;
            }

            onOnayla?.({ batchId, orders });

            alert(`${rows.length} manuel kayıt aktif seferlere aktarıldı.`);
            handleClear();
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="manuel-page">
            <section className="top-bar">
                <div>
                    <h1>Manuel Sipariş</h1>
                    <p>Excel’den aktarın veya siparişi elle oluşturun.</p>
                </div>

                <div className="top-actions">
                    {orders.length > 0 && (
                        <button
                            type="button"
                            className="ghost-btn"
                            onClick={handleClear}
                            disabled={saving}
                        >
                            Listeyi Temizle
                        </button>
                    )}

                    <button
                        type="button"
                        className="success-btn"
                        onClick={handleOnayla}
                        disabled={saving}
                    >
                        {saving ? "Aktarılıyor…" : "Plaka Atamaya Geç"}
                    </button>
                </div>
            </section>

            <section className="summary-row">
                <div className="summary-card">
                    <span>Toplam Sipariş</span>
                    <strong>{orders.length}</strong>
                </div>

                <div className="summary-card">
                    <span>Toplam Palet</span>
                    <strong>{toplamPalet}</strong>
                </div>

                <div className="summary-card">
                    <span>Çoklu Varış</span>
                    <strong>{multiStopCount}</strong>
                </div>

                <div className="summary-card">
                    <span>Gösterilen</span>
                    <strong>{filteredOrders.length}</strong>
                </div>
            </section>

            <section className="content-grid">
                <div className="left-panel">
                    <div
                        className={`drop-zone ${isDragging ? "active" : ""}`}
                        tabIndex={0}
                        onPaste={handlePaste}
                        onDragOver={(e) => {
                            e.preventDefault();
                            setIsDragging(true);
                        }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                    >
                        <div className="drop-icon">↧</div>
                        <div>
                            <h2>Excel Verisini Sürükle-Bırak</h2>
                            <p>Yükleme Tarihi, Bölge, Araç Tipi</p>
                            <small>+ işaretli bölgeler otomatik varışlara ayrılır.</small>
                        </div>
                    </div>

                    <form className="panel order-form" onSubmit={handleSubmit}>
                        <div className="panel-title">
                            <h2>Yeni Sipariş</h2>
                            <p>Manuel sipariş oluştur.</p>
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

                            <label className="full">
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
                                <span>Araç Tipi</span>
                                <input
                                    type="text"
                                    name="aracTipi"
                                    placeholder="TIR"
                                    value={form.aracTipi}
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
                            Siparişi Ekle
                        </button>
                    </form>
                </div>

                <div className="right-panel">
                    <div className="filters-panel">
                        <div className="search-box">
                            <span>⌕</span>
                            <input
                                type="text"
                                placeholder="Bölge, müşteri veya araç tipi ara..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
                            <option value="all">Tüm tarihler</option>
                            {uniqueDates.map((date) => (
                                <option key={date} value={date}>
                                    {formatDate(date)}
                                </option>
                            ))}
                        </select>

                        <select
                            value={vehicleFilter}
                            onChange={(e) => setVehicleFilter(e.target.value)}
                        >
                            <option value="all">Tüm araçlar</option>
                            {uniqueVehicles.map((vehicle) => (
                                <option key={vehicle} value={vehicle}>
                                    {vehicle}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="panel orders-panel">
                        <div className="panel-title row">
                            <div>
                                <h2>Sipariş Listesi</h2>
                                <p>{filteredOrders.length} kayıt gösteriliyor.</p>
                            </div>
                        </div>

                        {orders.length === 0 ? (
                            <div className="empty-state">
                                <strong>Henüz sipariş yok</strong>
                                <p>Excel verisini sürükleyin veya manuel sipariş ekleyin.</p>
                            </div>
                        ) : filteredOrders.length === 0 ? (
                            <div className="empty-state">
                                <strong>Sonuç bulunamadı</strong>
                                <p>Arama veya filtreleri değiştirin.</p>
                            </div>
                        ) : (
                            <div className="orders-list">
                                {filteredOrders.map((order, index) => {
                                    const varisler = getVarisArray(order);

                                    return (
                                        <article className="order-item" key={order.id}>
                                            <div className="order-no">
                                                {String(index + 1).padStart(2, "0")}
                                            </div>

                                            <div className="order-main">
                                                <div className="route-line">
                                                    {varisler.map((varis, i) => (
                                                        <React.Fragment key={`${order.id}_${varis}_${i}`}>
                                                            <span>{varis}</span>
                                                            {i < varisler.length - 1 && <b>→</b>}
                                                        </React.Fragment>
                                                    ))}
                                                </div>

                                                <div className="order-meta-line">
                                                    <small>{order.musteri}</small>
                                                    <span className="source-badge manual">
                                                        Manuel
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="order-info">
                                                <strong>{order.aracTipi || "-"}</strong>
                                                <span>{formatDate(order.tarih)}</span>
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
                    </div>
                </div>
            </section>
        </div>
    );
}

export default ManuelSiparis;
