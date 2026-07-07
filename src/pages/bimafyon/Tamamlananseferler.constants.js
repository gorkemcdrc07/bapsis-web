// Bu dosya, YetkilendirmePanel + Login.tsx ile ayný sözleþmeyi kullanýr:
// Sayfa   -> PAGE_KEY.page
// Sütun   -> PAGE_KEY.column.<col.key>
// Buton   -> PAGE_KEY.button.<BUTTONS.*>

export const PAGE_KEY = "bim_tamamlanan";

// key   : ekranda / veride kullanýlan sistemsel alan adý (hasPermission'a giden deðer)
// label : Yetki panelinde kullanýcýya gösterilen Türkçe ad (constants.ts -> PAGES[].columns)
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
    { key: "tamamlanma_nedeni", label: "Neden" },
    { key: "tamamlayan_kullanici_adi", label: "Tamamlayan" },
    { key: "created_at", label: "Tarih" },
];

export const BUTTONS = {
    REFRESH: "refresh",
    EXPORT_EXCEL: "export_excel", // CSV indirme de ayný buton ailesinden sayýlýr
    COPY_JSON: "copy_json",
};