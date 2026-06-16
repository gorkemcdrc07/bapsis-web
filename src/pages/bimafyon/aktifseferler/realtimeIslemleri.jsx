import { supabase } from "../../../lib/supabaseClient";

export function aktifSeferRealtimeBaslat(onRefresh) {
    let refreshTimer = null;

    function scheduleRefresh() {
        clearTimeout(refreshTimer);

        refreshTimer = setTimeout(() => {
            onRefresh();
        }, 500);
    }

    const channel = supabase
        .channel("aktif-seferler-realtime")
        .on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: "aktif_seferler",
            },
            scheduleRefresh
        )
        .on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: "aktif_sefer_degisiklikleri",
            },
            scheduleRefresh
        )
        .subscribe();

    return () => {
        clearTimeout(refreshTimer);
        supabase.removeChannel(channel);
    };
}