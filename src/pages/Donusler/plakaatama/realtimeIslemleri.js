import { supabase } from "../../../lib/supabaseClient";

export function plakaAtamaRealtimeBaslat(onRefresh) {
    let refreshTimer = null;

    function scheduleRefresh() {
        clearTimeout(refreshTimer);
        refreshTimer = setTimeout(() => {
            onRefresh();
        }, 500);
    }

    const channel = supabase
        .channel("donusler-aktif-seferler-realtime")
        .on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: "donusler_aktif_seferler",
            },
            scheduleRefresh
        )
        .subscribe();

    return () => {
        clearTimeout(refreshTimer);
        supabase.removeChannel(channel);
    };
}