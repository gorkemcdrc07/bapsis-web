export const PAGE_KEY = "silinen_seferler";

export const COLUMNS = [
    { key: "id", label: "Eski ID" },
    { key: "seferNo", label: "Sefer No" },
    { key: "cekici", label: "Çekici" },
    { key: "dorse", label: "Dorse" },
    { key: "surucu", label: "Sürücü" },
    { key: "telefon", label: "Telefon" },
    { key: "varis1", label: "Varýþ 1" },
    { key: "varis2", label: "Varýþ 2" },
    { key: "varis3", label: "Varýþ 3" },
    { key: "varis4", label: "Varýþ 4" },
    { key: "irsaliyeNo", label: "Ýrsaliye" },
    { key: "aracDurumu", label: "Araç Durumu" },
    { key: "silinme_nedeni", label: "Silinme Nedeni" },
    { key: "silen_kullanici_adi", label: "Silen Kullanýcý" },
    { key: "created_at", label: "Tarih" },
];

export const BUTTONS = {
    REFRESH: "refresh",
    EXPORT_EXCEL: "export_excel",
    COPY_JSON: "copy_json",
};