import { normalizeText } from "./helpers";

export function navlunFiyatiBul(row, navlunlar) {
    const varis1 = normalizeText(row.varis1);
    const varis2 = normalizeText(row.varis2);
    const varis3 = normalizeText(row.varis3);

    if (!varis1) return null;

    const matched = navlunlar.find((item) => {
        if (normalizeText(item.varis1) !== varis1) return false;
        if (varis2 && normalizeText(item.varis2) !== varis2) return false;
        if (varis3 && normalizeText(item.varis3) !== varis3) return false;
        return true;
    });

    return matched?.fiyat ?? null;
}