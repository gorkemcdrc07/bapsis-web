import { logKaydet } from "./logger";

let installed = false;

/**
 * Uygulama genelinde yakalanmayan hataları ve reddedilen promise'leri
 * otomatik olarak "sistem_loglari" tablosuna kaydeder.
 *
 * main.tsx içinde, uygulama render edilmeden önce BİR KEZ çağırın.
 */
export function setupGlobalErrorLogging() {
    if (installed) return;
    installed = true;

    window.addEventListener("error", (event) => {
        logKaydet({
            seviye: "hata",
            kategori: "Sistem",
            mesaj: event.message || "Bilinmeyen JavaScript hatası",
            detay: event.error?.stack || `${event.filename}:${event.lineno}:${event.colno}`,
        });
    });

    window.addEventListener("unhandledrejection", (event) => {
        const reason = event.reason;
        logKaydet({
            seviye: "hata",
            kategori: "Sistem",
            mesaj: "Yakalanmamış promise hatası",
            detay: reason?.stack || String(reason),
        });
    });
}