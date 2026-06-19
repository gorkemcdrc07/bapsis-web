import { normalizeText } from "./helpers";

function temizle(value) {
    return normalizeText(value || "")
        .replace(/[-_/.,]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function benzerlikPuani(a, b) {
    const x = temizle(a);
    const y = temizle(b);

    if (!x || !y) return 0;
    if (x === y) return 100;
    if (x.includes(y) || y.includes(x)) return 85;

    const xWords = x.split(" ").filter(Boolean);
    const yWords = y.split(" ").filter(Boolean);

    const ortak = xWords.filter((w) => yWords.includes(w)).length;
    const toplam = new Set([...xWords, ...yWords]).size;

    return toplam ? Math.round((ortak / toplam) * 100) : 0;
}

function varisListesi(row) {
    return [row.varis1, row.varis2, row.varis3]
        .map((v) => String(v || "").trim())
        .filter(Boolean);
}

function ayniIkizDepoMu(a, b) {
    const cleanA = temizle(a).replace(/\d+$/g, "").trim();
    const cleanB = temizle(b).replace(/\d+$/g, "").trim();

    return cleanA && cleanB && cleanA === cleanB;
}

function ugramaTutariHesapla(row, ugramaSartlari = []) {
    const vkn = String(row.faturaVkn || row.vkn || "").trim();

    const vknRule = ugramaSartlari.find(
        (item) =>
            item.tip === "vkn_ugrama" &&
            item.anahtar === vkn &&
            item.acik === true
    );

    const ikizDepoRule = ugramaSartlari.find(
        (item) =>
            item.tip === "ikiz_depo" &&
            item.anahtar === "guzelhisar" &&
            item.acik === true
    );

    const tutar = Number(vknRule?.tutar || 0);
    if (!tutar) return 0;

    const varisler = varisListesi(row);
    if (varisler.length <= 1) return 0;

    let ugramaSayisi = 0;

    for (let i = 1; i < varisler.length; i++) {
        const onceki = varisler[i - 1];
        const simdiki = varisler[i];

        if (ikizDepoRule && ayniIkizDepoMu(onceki, simdiki)) {
            continue;
        }

        ugramaSayisi += 1;
    }

    return ugramaSayisi * tutar;
}

export function navlunEslesmeleriBul(row, navlunlar = []) {
    const hedefler = varisListesi(row);

    if (!hedefler.length) return [];

    return (navlunlar || [])
        .filter((item) => item.aktif !== false)
        .map((item) => {
            const p1 = benzerlikPuani(hedefler[0], item.varis1);
            const p2 = hedefler[1]
                ? benzerlikPuani(hedefler[1], item.varis2)
                : 100;
            const p3 = hedefler[2]
                ? benzerlikPuani(hedefler[2], item.varis3)
                : 100;

            const puan = Math.round((p1 + p2 + p3) / 3);

            return {
                ...item,
                puan,
            };
        })
        .filter((item) => item.puan >= 35)
        .sort((a, b) => b.puan - a.puan)
        .slice(0, 20);
}

export function navlunDetayliHesapla(row, navlunlar = [], ugramaSartlari = []) {
    const eslesmeler = navlunEslesmeleriBul(row, navlunlar);
    const enIyi = eslesmeler[0];

    if (!enIyi || enIyi.puan < 70) {
        return {
            fiyat: null,
            bazFiyat: null,
            ugramaTutari: 0,
            eslesme: null,
            eslesmeler,
        };
    }

    const bazFiyat = Number(enIyi.fiyat || 0);
    const ugramaTutari = ugramaTutariHesapla(row, ugramaSartlari);

    return {
        fiyat: bazFiyat + ugramaTutari,
        bazFiyat,
        ugramaTutari,
        eslesme: enIyi,
        eslesmeler,
    };
}

export function navlunFiyatiBul(row, navlunlar, ugramaSartlari = []) {
    return navlunDetayliHesapla(row, navlunlar, ugramaSartlari).fiyat;
}