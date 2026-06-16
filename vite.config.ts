import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
    plugins: [react()],

    build: {
        chunkSizeWarningLimit: 3000,
        rollupOptions: {
            output: {
                manualChunks: {
                    exceljs: ["exceljs"],
                    xlsx: ["xlsx"],
                    leaflet: ["leaflet", "react-leaflet"],
                    supabase: ["@supabase/supabase-js"],
                },
            },
        },
    },
});