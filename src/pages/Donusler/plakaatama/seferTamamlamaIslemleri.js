import { supabase } from "../../../lib/supabaseClient";
import { getAktifKullanici } from "./helpers";

export async function plakaAtamaSeferTamamla({
    row,
    plakaAtamaKaydiSil,
    saveChangeLogs,
    setCompletePromptRow,
    setCompleteDetailRow,
    setRows,
    showToast,
}) {
    const aktifKullanici = getAktifKullanici();

    const completedRow = {
        ...row,
        aracDurumu: "Tamamlandı",
        tamamlanmaTarihi: new Date().toISOString(),
    };

    const { error: archiveError } = await supabase
        .from("tamamlananDonusSeferleri")
        .insert({
            eski_sefer_id: String(row.id),
            tamamlanma_nedeni: "Dönüş seferi tamamlandı",
            tamamlayan_kullanici_adi:
                aktifKullanici?.ad ||
                aktifKullanici?.adSoyad ||
                aktifKullanici?.kullanici_adi ||
                "Bilinmeyen Kullanıcı",
            tamamlayan_kullanici_kodu:
                aktifKullanici?.kullaniciKodu ||
                aktifKullanici?.kullanici_adi ||
                "bilinmiyor",
            tamamlayan_kullanici_rol: aktifKullanici?.rol || "bilinmiyor",
            sefer_verisi: completedRow,
        });

    if (archiveError) {
        showToast(`Sefer arşivlenemedi: ${archiveError.message}`, "error");
        return;
    }

    const deleteError = await plakaAtamaKaydiSil(row.id);

    if (deleteError) {
        showToast(`Sefer arşivlendi ama aktif listeden silinemedi: ${deleteError.message}`, "error");
        return;
    }

    await saveChangeLogs(
        row.id,
        [
            {
                field: "aracDurumu",
                label: "Durum",
                oldValue: row.aracDurumu || "",
                newValue: "Tamamlandı",
            },
        ],
        "Sefer Tamamlama"
    );

    setRows((prev) => prev.filter((item) => item.id !== row.id));

    setCompletePromptRow(null);
    setCompleteDetailRow(null);

    showToast("Sefer tamamlandı ve aktif listeden kaldırıldı.");
}
