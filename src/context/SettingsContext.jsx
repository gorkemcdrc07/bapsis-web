import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { logKaydet } from "../lib/logger";

const SettingsContext = createContext(null);

export const DEFAULT_SETTINGS = {
    companyName: "Acme Kurumsal A.Ş.",
    companyCode: "TR-0000000000",
    language: "Türkçe",
    timezone: "İstanbul (UTC+03:00)",
    dateFormat: "GG.AA.YYYY",
    currency: "₺ Türk Lirası",

    theme: "light",
    compactTable: false,
    collapsedSidebar: false,
    defaultDashboard: "Ana Dashboard",
    landingPage: "Dashboard",
    fontSize: "Orta",

    sessionDurationValue: 60,
    sessionDurationUnit: "minute",

    multiLogin: true,
    require2FA: false,
    passwordExpiry: "90 Gün",
    adminLock: true,
    ipRestriction: "",
    loginLockout: "5 Deneme",

    userApprovalRequired: true,
    defaultRole: "Görüntüleyici",
    logRoleChanges: true,
    maxUsers: "",

    mailNotifications: true,
    systemNotifications: true,
    errorNotifications: true,
    weeklyDigest: false,
    notificationFrequency: "Anlık",
    notificationEmail: "",

    apiUrl: "",
    apiKey: "",
    webhook: "",
    smtpServer: "",
    smtpPort: "587",
    ssoEnabled: false,

    backupFrequency: "Günlük",
    retentionPeriod: "90 Gün",
    cloudBackup: true,
};

export function parseSessionDuration(settings) {
    const value = Number(settings?.sessionDurationValue || 60);
    const unit = settings?.sessionDurationUnit || "minute";

    const safeValue = value > 0 ? value : 60;

    if (unit === "hour") {
        return safeValue * 60 * 60 * 1000;
    }

    return safeValue * 60 * 1000;
}

function migrateSettings(rawSettings = {}) {
    const migrated = {
        ...DEFAULT_SETTINGS,
        ...rawSettings,
    };

    if (
        !rawSettings.sessionDurationValue &&
        rawSettings.sessionDuration
    ) {
        switch (rawSettings.sessionDuration) {
            case "30 Dakika":
                migrated.sessionDurationValue = 30;
                migrated.sessionDurationUnit = "minute";
                break;
            case "1 Saat":
                migrated.sessionDurationValue = 1;
                migrated.sessionDurationUnit = "hour";
                break;
            case "4 Saat":
                migrated.sessionDurationValue = 4;
                migrated.sessionDurationUnit = "hour";
                break;
            case "8 Saat":
                migrated.sessionDurationValue = 8;
                migrated.sessionDurationUnit = "hour";
                break;
            default:
                migrated.sessionDurationValue = 60;
                migrated.sessionDurationUnit = "minute";
                break;
        }
    }

    delete migrated.sessionDuration;

    return migrated;
}

export function SettingsProvider({ children }) {
    const [settings, setSettings] = useState(DEFAULT_SETTINGS);
    const [savedSettings, setSavedSettings] = useState(DEFAULT_SETTINGS);
    const [loadingSettings, setLoadingSettings] = useState(true);
    const [savingSettings, setSavingSettings] = useState(false);
    const [lastSavedAt, setLastSavedAt] = useState(null);

    const isSettingsDirty = useMemo(
        () => JSON.stringify(settings) !== JSON.stringify(savedSettings),
        [settings, savedSettings]
    );

    useEffect(() => {
        loadSettings();
    }, []);

    async function loadSettings() {
        setLoadingSettings(true);

        const { data, error } = await supabase
            .from("system_settings")
            .select("settings, updated_at")
            .eq("id", "global")
            .maybeSingle();

        if (error) {
            console.error("Ayarlar yüklenemedi:", error);
            setLoadingSettings(false);
            return;
        }

        const merged = migrateSettings(data?.settings || {});

        setSettings(merged);
        setSavedSettings(merged);

        if (data?.updated_at) {
            setLastSavedAt(
                new Date(data.updated_at).toLocaleString("tr-TR", {
                    hour: "2-digit",
                    minute: "2-digit",
                    day: "2-digit",
                    month: "2-digit",
                })
            );
        }

        setLoadingSettings(false);
    }

    function updateSetting(key, value) {
        setSettings((prev) => ({
            ...prev,
            [key]: value,
        }));
    }

    function discardSettings() {
        setSettings(savedSettings);
    }

    async function saveSettings() {
        setSavingSettings(true);

        const cleanSettings = migrateSettings(settings);

        const { error } = await supabase
            .from("system_settings")
            .upsert(
                {
                    id: "global",
                    settings: cleanSettings,
                    updated_at: new Date().toISOString(),
                },
                { onConflict: "id" }
            );

        if (error) {
            await logKaydet({
                seviye: "hata",
                kategori: "Ayarlar",
                mesaj: "Sistem ayarları kaydedilemedi",
                detay: JSON.stringify(error),
            });

            console.error("Ayarlar kaydedilemedi:", error);
            setSavingSettings(false);
            return false;
        }

        setSettings(cleanSettings);
        setSavedSettings(cleanSettings);
        setSavingSettings(false);

        const now = new Date().toLocaleString("tr-TR", {
            hour: "2-digit",
            minute: "2-digit",
            day: "2-digit",
            month: "2-digit",
        });

        setLastSavedAt(now);

        await logKaydet({
            seviye: "bilgi",
            kategori: "Ayarlar",
            mesaj: "Sistem ayarları kaydedildi",
            detay: "system_settings tablosu güncellendi.",
        });

        return true;
    }

    return (
        <SettingsContext.Provider
            value={{
                settings,
                updateSetting,
                saveSettings,
                discardSettings,
                loadSettings,
                loadingSettings,
                savingSettings,
                isSettingsDirty,
                lastSavedAt,
                sessionTimeoutMs: parseSessionDuration(settings),
            }}
        >
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);

    if (!context) {
        throw new Error("useSettings SettingsProvider içinde kullanılmalıdır.");
    }

    return context;
}