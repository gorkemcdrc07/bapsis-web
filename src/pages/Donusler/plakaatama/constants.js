export const columnsData = [
    { key: "actions", label: "İşlemler", width: 90, fixed: true },
    { key: "id", label: "ID", width: 80 },
    { key: "seferNo", label: "Sefer No", width: 110, editable: "input" },
    { key: "sevkTarihi", label: "Sevk Tarihi", width: 130, editable: "date" },
    { key: "yukleyenDepo", label: "Yükleyen Depo", width: 140, editable: "input" },
    { key: "kalkisYeri", label: "Kalkış Yeri", width: 140, editable: "input" },
    { key: "aracCinsi", label: "Araç Cinsi", width: 120, editable: "select" },
    { key: "cekici", label: "Çekici", width: 120, editable: "vehicle" },
    { key: "dorse", label: "Dorse", width: 120, editable: "input" },
    { key: "tc", label: "TC", width: 130, editable: "input" },
    { key: "surucu", label: "Sürücü", width: 160, editable: "input" },
    { key: "telefon", label: "Telefon", width: 150, editable: "input" },
    { key: "faturaVkn", label: "VKN", width: 140, editable: "input" },
    { key: "varis1", label: "Varış 1", width: 140, editable: "input" },
    { key: "varis2", label: "Varış 2", width: 140, editable: "input" },
    { key: "varis3", label: "Varış 3", width: 140, editable: "input" },
    { key: "varis4", label: "Varış 4", width: 140, editable: "input" },
    { key: "palet", label: "Palet", width: 90, editable: "input" },
    { key: "irsaliyeNo", label: "İrsaliye", width: 140, editable: "input" },
    { key: "datalogerNo", label: "Dataloger", width: 130, editable: "input" },
    { key: "navlun", label: "Navlun", width: 110, editable: "input" },
    { key: "aracDurumu", label: "Araç Durumu", width: 170, editable: "select" },
    { key: "peronNo", label: "Peron", width: 90, editable: "input" },
];

export const REQUIRED_FIELDS = [
    "seferNo",
    "sevkTarihi",
    "yukleyenDepo",
    "kalkisYeri",
    "aracCinsi",
    "cekici",
    "dorse",
    "tc",
    "surucu",
    "telefon",
    "faturaVkn",
    "palet",
    "irsaliyeNo",
    "navlun",
    "aracDurumu",
    "peronNo",
];

export const EXCEL_UPDATE_FIELDS = columnsData
    .filter((column) => !["actions", "id"].includes(column.key))
    .map((column) => column.key);

export const options = {
    aracCinsi: ["TIR", "KAMYON", "KAMYONET", "PANELVAN"],
    aracDurumu: [
        "Plaka Bekliyor",
        "Plaka Atandı",
        "Yüklemeye Hazır",
        "Beklemede",
        "Yüklemede",
        "Yüklendi",
        "Teslim Noktasına Gidiyor",
        "Çıkış Yaptı",
    ],
};

export const defaultHiddenColumns = ["tc", "datalogerNo"];