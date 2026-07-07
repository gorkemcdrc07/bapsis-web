import { supabase } from "./supabaseClient";

export type LogLevel = "bilgi" | "uyari" | "hata" | "kritik";

interface LogInput {
    seviye: LogLevel;
    kategori: string;
    mesaj: string;
    detay?: string;
}

interface AktifKullanici {
    id?: string | number;
    kullanici_adi?: string;
    ad?: string;
}

function getAktifKullanici(): AktifKullanici | null {
    try {
        const raw = localStorage.getItem("aktifKullanici");
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

export async function logKaydet({ seviye, kategori, mesaj, detay }: LogInput) {
    const kullanici = getAktifKullanici();

    try {
        const payload = {
            seviye,
            kategori,
            mesaj,
            detay: detay ?? null,

            // sistem_loglari.kullanici_id UUID beklediği için
            // sayı olan kullanıcı id değerini buraya göndermiyoruz.
            kullanici_id: null,

            kullanici_adi:
                kullanici?.kullanici_adi ||
                kullanici?.ad ||
                "sistem",

            sayfa: window.location.pathname,
            user_agent: navigator.userAgent,
        };

        const { error } = await supabase
            .from("sistem_loglari")
            .insert(payload);

        if (error) {
            console.error("Log kaydedilemedi:", error);
            console.error("Gönderilen log payload:", payload);
        }
    } catch (err) {
        console.error("Log kaydedilemedi:", err);
    }
}