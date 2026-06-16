import { supabase } from "../../../lib/supabaseClient";
import { getAktifKullanici, mapDbRow } from "./helpers";

export async function aktifSeferleriGetir() {
    const { data, error } = await supabase
        .from("aktif_seferler")
        .select("*")
        .order("id", { ascending: false });

    if (error) {
        alert(`Aktif seferler alınamadı: ${error.message}`);
        return null;
    }

    return (data || []).map(mapDbRow);
}

export async function degisiklikleriGetir() {
    const { data, error } = await supabase
        .from("aktif_sefer_degisiklikleri")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Değişiklik geçmişi alınamadı:", error.message);
        return null;
    }

    const logsByCell = {};

    (data || []).forEach((log) => {
        const key = `${log.sefer_id}_${log.alan}`;
        if (!logsByCell[key]) logsByCell[key] = [];
        logsByCell[key].push(log);
    });

    return logsByCell;
}

export async function degisiklikKaydiEkle(
    seferId,
    changes,
    islemTipi = "Güncelleme"
) {
    if (!changes.length) return;

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
        .from("aktif_sefer_degisiklikleri")
        .insert(logs);

    if (error) {
        console.error("Değişiklik kaydı tutulamadı:", error);
        alert(`Değişiklik kaydı tutulamadı: ${error.message}`);
    }
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

export async function navlunlariGetir() {
    const { data, error } = await supabase
        .from("navlunlar")
        .select("fiyat, varis1, varis2, varis3");

    if (error) return [];
    return data || [];
}
export async function freshlianceCihazlariGetir() {
    try {
        const response = await fetch("http://localhost:4001/freshliance/devices");
        const data = await response.json();

        console.log("FRESHLIANCE LIVE DEVICES:", data);

        const rows = data?.result?.data?.rows || [];

        return rows.map((device) => ({
            device_code: device.deviceCode,
            deviceCode: device.deviceCode,
            updated_at: device.batteryTime
                ? new Date(device.batteryTime).toISOString()
                : new Date().toISOString(),
            latitude: device.latitude,
            longitude: device.longitude,
            battery: device.battery,
            userDeviceTripId: device.userDeviceTripId,
            customName: device.customName,
            raw: device,
        }));
    } catch (error) {
        console.error("Freshliance canlı cihazlar alınamadı:", error);
        return [];
    }
}