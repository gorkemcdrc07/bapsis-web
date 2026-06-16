export function validateRow(row) {
    const requiredFields = [
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
        "peronNo",
        "datalogerNo", // eklendi
    ];

    return requiredFields.filter(
        (field) => String(row[field] ?? "").trim() === ""
    );
}

export function isTripReadyToComplete(row) {
    return validateRow(row).length === 0;
}