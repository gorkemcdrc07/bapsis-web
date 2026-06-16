export const columnsData = [
    { key: "actions", label: "İşlemler", width: 70, fixed: true },
    { key: "id", label: "ID", width: 80 },
    { key: "seferNo", label: "Sefer No", width: 100, editable: "input" },
    { key: "sevkTarihi", label: "Sevk Tarihi", width: 120, editable: "date" },
    { key: "yukleyenDepo", label: "Yükleyen Depo", width: 130, editable: "input" },
    { key: "kalkisYeri", label: "Kalkış Yeri", width: 120, editable: "input" },
    { key: "aracCinsi", label: "Araç Cinsi", width: 105, editable: "select" },
    { key: "cekici", label: "Çekici", width: 110, editable: "select" },
    { key: "dorse", label: "Dorse", width: 110, editable: "input" },
    { key: "tc", label: "TC", width: 120, editable: "input" },
    { key: "surucu", label: "Sürücü", width: 140, editable: "input" },
    { key: "telefon", label: "Telefon", width: 145, editable: "input" },
    { key: "faturaVkn", label: "VKN", width: 130, editable: "input" },
    { key: "varis1", label: "Varış 1", width: 130, editable: "input" },
    { key: "varis2", label: "Varış 2", width: 130, editable: "input" },
    { key: "varis3", label: "Varış 3", width: 130, editable: "input" },
    { key: "varis4", label: "Varış 4", width: 130, editable: "input" },
    { key: "palet", label: "Palet", width: 80, editable: "input" },
    { key: "irsaliyeNo", label: "İrsaliye", width: 130, editable: "input" },
    { key: "datalogerNo", label: "Dataloger", width: 120, editable: "input" },

    { key: "freshlianceBattery", label: "Batarya", width: 90 },
    { key: "freshlianceLocation", label: "Konum", width: 170 },
    { key: "freshlianceUpdatedAt", label: "Son Veri", width: 150 },
    { key: "freshlianceTemperature", label: "Sıcaklık", width: 110 },

    { key: "navlun", label: "Navlun", width: 100, editable: "input" },
    { key: "aracDurumu", label: "Durum", width: 160, editable: "select" },
    { key: "peronNo", label: "Peron", width: 80, editable: "input" },
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
    .filter((column) =>
        ![
            "actions",
            "id",
            "freshlianceBattery",
            "freshlianceLocation",
            "freshlianceUpdatedAt",
            "freshlianceTemperature",
        ].includes(column.key)
    )
    .map((column) => column.key);

export const options = {
    aracCinsi: ["TIR", "KAMYON", "KAMYONET", "PANELVAN"],
    aracDurumu: [
        "Beklemede",
        "Yüklemede",
        "Yüklendi",
        "Teslim Noktasına Gidiyor",
        "1. Teslim Noktasına Gidiyor",
        "Çıkış Yaptı",
        "Plaka Bekliyor",
    ],
};