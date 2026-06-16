import { supabase } from "../../../lib/supabaseClient";
import { normalizePlate } from "./helpers";

export async function kayipAracEkle(vehicle) {
    const { error } = await supabase.from("araclar").insert({
        cekici: vehicle.cekici,
        dorse: vehicle.dorse || null,
        tc: vehicle.tc || null,
        surucu: vehicle.surucu || null,
        telefon: vehicle.telefon || null,
        vkn: vehicle.vkn || null,
    });

    if (error) {
        alert(`Araç eklenemedi: ${error.message}`);
        return false;
    }

    return true;
}

export function enrichRowFromVehicle(row, araclar) {
    const cekici = normalizePlate(row.cekici);

    if (!cekici) {
        return { row, arac: null };
    }

    const arac = araclar.find((item) => {
        const aracCekici = normalizePlate(item.cekici);
        return aracCekici && aracCekici === cekici;
    });

    if (!arac) return { row, arac: null };

    return {
        arac,
        row: {
            ...row,
            cekici: arac.cekici || row.cekici || "",
            dorse: arac.dorse || row.dorse || "",
            tc: arac.tc || row.tc || "",
            surucu: arac.surucu || row.surucu || "",
            telefon: arac.telefon || row.telefon || "",
            faturaVkn: arac.vkn || row.faturaVkn || "",
            vkn: arac.vkn || row.vkn || "",
        },
    };
}
