import { supabase } from "../../../lib/supabaseClient";
import { getAktifKullanici, mapDbRow } from "./helpers";

const SEFER_TABLOSU = "donusler_aktif_seferler";
const DEGISIKLIK_TABLOSU = "donus_sefer_degisiklikleri";

export async function plakaAtamaKayitlariniGetir() {
    const { data, error } = await supabase
        .from(SEFER_TABLOSU)
        .select("*")
        .order("id", { ascending: false });

    if (error) {
        alert(`Plaka atama kayıtları alınamadı: ${error.message}`);
        return null;
    }

    return (data || []).map(mapDbRow);
}

export async function plakaAtamaKaydiGuncelle(rowId, payload) {
    const { error } = await supabase
        .from(SEFER_TABLOSU)
        .update(payload)
        .eq("id", rowId);

    return error || null;
}

export async function plakaAtamaKaydiSil(rowId) {
    const { error } = await supabase
        .from(SEFER_TABLOSU)
        .delete()
        .eq("id", rowId);

    return error || null;
}

export function plakaAtamaRealtimeBaslat(onRefresh) {
    let refreshTimer = null;

    function scheduleRefresh() {
        clearTimeout(refreshTimer);

        refreshTimer = setTimeout(() => {
            onRefresh();
        }, 500);
    }

    const channel = supabase
        .channel("donusler-plaka-atama-realtime")
        .on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: SEFER_TABLOSU,
            },
            scheduleRefresh
        )
        .subscribe();

    return () => {
        clearTimeout(refreshTimer);
        supabase.removeChannel(channel);
    };
}

export async function araclariGetir() {
    const pageSize = 1000;
    let from = 0;
    let allRows = [];

    while (true) {
        const { data, error } = await supabase
            .from("araclar")
            .select("*")
            .order("cekici", { ascending: true })
            .range(from, from + pageSize - 1);

        if (error) {
            alert(`Araçlar alınamadı: ${error.message}`);
            return null;
        }

        const pageRows = data || [];
        allRows = [...allRows, ...pageRows];

        if (pageRows.length < pageSize) break;
        from += pageSize;
    }

    return allRows;
}

export async function degisiklikKaydiEkle(
    seferId,
    changes,
    islemTipi = "Güncelleme"
) {
    if (!changes?.length) return;

    const aktifKullanici = getAktifKullanici();

    const logs = changes.map((change) => ({
        sefer_id: seferId,
        alan: change.label || change.field,
        eski_deger: String(change.oldValue ?? ""),
        yeni_deger: String(change.newValue ?? ""),
        kullanici_adi:
            aktifKullanici?.ad ||
            aktifKullanici?.kullanici_adi ||
            "Bilinmeyen Kullanıcı",
        kullanici_kodu: aktifKullanici?.kullanici_adi || "bilinmiyor",
        kullanici_rol: aktifKullanici?.rol || "bilinmiyor",
        islem_tipi: islemTipi,
    }));

    const { error } = await supabase
        .from(DEGISIKLIK_TABLOSU)
        .insert(logs);

    if (error) {
        console.error("Değişiklik kaydı tutulamadı:", error);
    }
}

export async function degisiklikleriGetir() {
    const { data, error } = await supabase
        .from(DEGISIKLIK_TABLOSU)
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Değişiklik geçmişi alınamadı:", error.message);
        return {};
    }

    const logsByCell = {};

    (data || []).forEach((log) => {
        const key = `${log.sefer_id}_${log.alan}`;
        if (!logsByCell[key]) logsByCell[key] = [];
        logsByCell[key].push(log);
    });

    return logsByCell;
}