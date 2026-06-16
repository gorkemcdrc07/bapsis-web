import { columnsData } from "./constants";

export function normalizeText(value) {
    return String(value || "").toLocaleUpperCase("tr-TR").trim();
}

export function normalizePlate(value) {
    return String(value || "")
        .toLocaleUpperCase("tr-TR")
        .replace(/\s/g, "")
        .trim();
}

export function normalizeCompare(value) {
    if (value === null || value === undefined) return "";
    return String(value).trim();
}

export function getAktifKullanici() {
    try {
        return JSON.parse(localStorage.getItem("aktifKullanici") || "null");
    } catch {
        return null;
    }
}

export function getExcelValue(row, keys) {
    for (const key of keys) {
        if (row[key] !== undefined && row[key] !== null && row[key] !== "") {
            return row[key];
        }
    }

    return "";
}

export function getColumnLabel(key) {
    return columnsData.find((column) => column.key === key)?.label || key;
}

export function mapDbRow(item) {
    const currentVkn = item.vkn || item.fatura_vkn || "";

    return {
        id: item.id,
        kaynak: item.kaynak || "",
        seferNo: item.sefer_no || "",
        sevkTarihi: item.sevk_tarihi || "",
        yukleyenDepo: item.yukleyen_depo || "",
        kalkisYeri: item.kalkis_yeri || "",
        aracCinsi: item.arac_cinsi || "",
        cekici: item.cekici || "",
        dorse: item.dorse || "",
        tc: item.tc || "",
        surucu: item.surucu || "",
        telefon: item.telefon || "",
        faturaVkn: currentVkn,
        vkn: currentVkn,

        varis1: item.varis1 || "",
        varis2: item.varis2 || "",
        varis3: item.varis3 || "",
        varis4: item.varis4 || "",

        palet: item.palet ?? "",
        irsaliyeNo: item.irsaliye_no || "",
        datalogerNo: item.dataloger_no || "",
        navlun: item.navlun ?? "",
        aracDurumu: item.arac_durumu || "",
        peronNo: item.peron_no || "",
    };
}

export function mapUiToDb(row) {
    const currentVkn = row.vkn || row.faturaVkn || null;

    return {
        kaynak: row.kaynak || "Manuel",
        sefer_no: row.seferNo || null,
        sevk_tarihi: row.sevkTarihi || null,
        yukleyen_depo: row.yukleyenDepo || null,
        kalkis_yeri: row.kalkisYeri || null,
        arac_cinsi: row.aracCinsi || null,
        cekici: row.cekici || null,
        dorse: row.dorse || null,
        tc: row.tc || null,
        surucu: row.surucu || null,
        telefon: row.telefon || null,
        fatura_vkn: currentVkn,
        vkn: currentVkn,

        varis1: row.varis1 || "",
        varis2: row.varis2 || "",
        varis3: row.varis3 || "",
        varis4: row.varis4 || "",

        palet: row.palet === "" ? null : Number(row.palet),
        irsaliye_no: row.irsaliyeNo || null,
        dataloger_no: row.datalogerNo || null,
        navlun:
            row.navlun === "" || row.navlun === null || row.navlun === undefined
                ? null
                : Number(String(row.navlun).replace(",", ".")),
        arac_durumu: row.aracDurumu || null,
        peron_no: row.peronNo || null,
        updated_at: new Date().toISOString(),
    };
}

export function mapSingleFieldToDb(key, value) {
    const updatedAt = new Date().toISOString();

    const map = {
        seferNo: "sefer_no",
        sevkTarihi: "sevk_tarihi",
        yukleyenDepo: "yukleyen_depo",
        kalkisYeri: "kalkis_yeri",
        aracCinsi: "arac_cinsi",
        cekici: "cekici",
        dorse: "dorse",
        tc: "tc",
        surucu: "surucu",
        telefon: "telefon",
        faturaVkn: "fatura_vkn",
        vkn: "vkn",
        palet: "palet",
        irsaliyeNo: "irsaliye_no",
        datalogerNo: "dataloger_no",
        navlun: "navlun",
        aracDurumu: "arac_durumu",
        peronNo: "peron_no",
    };

    if (key === "varis1") {
        return {
            varis1: value,
            updated_at: updatedAt,
        };
    }

    if (key === "varis2") {
        return {
            varis2: value,
            updated_at: updatedAt,
        };
    }

    if (key === "varis3") {
        return {
            varis3: value,
            updated_at: updatedAt,
        };
    }

    if (key === "varis4") {
        return {
            varis4: value,
            updated_at: updatedAt,
        };
    }

    const dbKey = map[key] || key;

    if (key === "palet") {
        return {
            [dbKey]: value === "" ? null : Number(value),
            updated_at: updatedAt,
        };
    }

    if (key === "navlun") {
        return {
            [dbKey]:
                value === "" || value === null || value === undefined
                    ? null
                    : Number(String(value).replace(",", ".")),
            updated_at: updatedAt,
        };
    }

    if (key === "faturaVkn" || key === "vkn") {
        return {
            fatura_vkn: value || null,
            vkn: value || null,
            updated_at: updatedAt,
        };
    }

    return {
        [dbKey]: value === "" ? null : value,
        updated_at: updatedAt,
    };
}