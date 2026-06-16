import { supabase } from "../../../lib/supabaseClient";
import { getAktifKullanici } from "./helpers";

export async function saveCompletedTripArchive(row, reason = "Dönüþ seferi yüklemeye hazýr yapýldý") {
    const aktifKullanici = getAktifKullanici();

    const { error } = await supabase
        .from("tamamlanan_seferler")
        .insert({
            eski_sefer_id: String(row.id),
            tamamlanma_nedeni: reason,
            tamamlayan_kullanici_adi:
                aktifKullanici?.ad ||
                aktifKullanici?.kullanici_adi ||
                "Bilinmeyen Kullanýcý",
            tamamlayan_kullanici_kodu: aktifKullanici?.kullanici_adi || "bilinmiyor",
            tamamlayan_kullanici_rol: aktifKullanici?.rol || "bilinmiyor",
            sefer_verisi: row,
        });

    if (error) {
        alert(`Tamamlanan sefer kaydedilemedi: ${error.message}`);
        return false;
    }

    return true;
}

export async function saveDeletedTripArchive(row, reason = "Dönüþ plaka atama kaydý silindi") {
    const aktifKullanici = getAktifKullanici();

    const { error } = await supabase
        .from("silinen_aktif_seferler")
        .insert({
            eski_sefer_id: String(row.id),
            silinme_nedeni: reason,
            silen_kullanici_adi:
                aktifKullanici?.ad ||
                aktifKullanici?.kullanici_adi ||
                "Bilinmeyen Kullanýcý",
            silen_kullanici_kodu: aktifKullanici?.kullanici_adi || "bilinmiyor",
            silen_kullanici_rol: aktifKullanici?.rol || "bilinmiyor",
            sefer_verisi: row,
        });

    if (error) {
        alert(`Silinen sefer arþive kaydedilemedi: ${error.message}`);
        return false;
    }

    return true;
}