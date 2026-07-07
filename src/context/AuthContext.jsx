import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { logKaydet } from "../lib/logger";
import { useSettings } from "./SettingsContext";

const AuthContext = createContext(null);

const WARNING_MS = 60 * 1000;
const SESSION_ID_KEY = "aktifSessionId";
const SESSION_USER_KEY = "aktifSessionUserId";

function getWarningMs(timeoutMs) {
    if (timeoutMs <= 60 * 1000) {
        return Math.max(10 * 1000, Math.floor(timeoutMs / 2));
    }

    return WARNING_MS;
}

function getOrCreateSessionId(userId) {
    const storedUserId = localStorage.getItem(SESSION_USER_KEY);
    let sessionId = localStorage.getItem(SESSION_ID_KEY);

    if (!sessionId || storedUserId !== String(userId)) {
        sessionId =
            crypto?.randomUUID?.() ||
            `session-${Date.now()}-${Math.random().toString(36).slice(2)}`;

        localStorage.setItem(SESSION_ID_KEY, sessionId);
        localStorage.setItem(SESSION_USER_KEY, String(userId));
    }

    return sessionId;
}
function getClientInfo() {
    const ua = navigator.userAgent || "";

    let tarayici = "Bilinmiyor";

    if (ua.includes("Edg")) tarayici = "Microsoft Edge";
    else if (ua.includes("Chrome")) tarayici = "Chrome";
    else if (ua.includes("Firefox")) tarayici = "Firefox";
    else if (ua.includes("Safari")) tarayici = "Safari";

    let platform = navigator.platform || "Bilinmiyor";

    let cihaz = "Masaüstü";
    if (/Mobi|Android/i.test(ua)) cihaz = "Mobil";
    if (/Tablet|iPad/i.test(ua)) cihaz = "Tablet";

    return {
        cihaz,
        tarayici,
        platform,
        user_agent: ua,
    };
}

function flattenPermissions(perms = {}) {
    const flat = [];

    Object.entries(perms || {}).forEach(([pageKey, perm]) => {
        if (perm?.page === true) flat.push(`${pageKey}.page`);

        Object.entries(perm?.cols || {}).forEach(([colKey, value]) => {
            if (value === true) flat.push(`${pageKey}.column.${colKey}`);
        });

        Object.entries(perm?.btns || {}).forEach(([btnKey, value]) => {
            if (value === true) flat.push(`${pageKey}.button.${btnKey}`);
        });

        Object.entries(perm?.tabs || {}).forEach(([tabKey, value]) => {
            if (value === true) flat.push(`${pageKey}.tab.${tabKey}`);
        });
    });

    return flat;
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(true);

    const [sessionWarningOpen, setSessionWarningOpen] = useState(false);
    const [remainingSeconds, setRemainingSeconds] = useState(60);

    const { sessionTimeoutMs, loadingSettings } = useSettings();

    const permissionChannelRef = useRef(null);
    const activeSessionChannelRef = useRef(null);

    const mountedRef = useRef(true);
    const warningTimerRef = useRef(null);
    const logoutTimerRef = useRef(null);
    const countdownRef = useRef(null);
    const lastActivityUpdateRef = useRef(0);

    async function refreshAuth() {
        setLoading(true);

        try {
            const localUser = JSON.parse(
                localStorage.getItem("aktifKullanici") || "null"
            );

            if (!localUser?.id) {
                setUser(null);
                setPermissions([]);
                setLoading(false);
                return null;
            }

            const { data: dbUser, error: userError } = await supabase
                .from("kullanicilar")
                .select("id, kullanici_adi, ad, rol, aktif, yetki_override")
                .eq("id", localUser.id)
                .eq("aktif", true)
                .maybeSingle();

            if (userError || !dbUser) {
                setUser(null);
                setPermissions([]);
                localStorage.removeItem("aktifKullanici");
                localStorage.removeItem("permissions");
                localStorage.removeItem(SESSION_ID_KEY);
                localStorage.removeItem(SESSION_USER_KEY);
                setLoading(false);
                return null;
            }

            const roleKey = String(dbUser.rol || "kullanici")
                .trim()
                .toLowerCase();

            if (roleKey === "admin") {
                setUser(dbUser);
                setPermissions(["*"]);
                localStorage.setItem("aktifKullanici", JSON.stringify(dbUser));
                localStorage.setItem("permissions", JSON.stringify(["*"]));
                setLoading(false);
                return dbUser;
            }

            let finalPerms = dbUser.yetki_override;

            if (!finalPerms) {
                const { data: roleData, error: roleError } = await supabase
                    .from("yetki_rolleri")
                    .select("perms")
                    .eq("role_key", roleKey)
                    .maybeSingle();

                if (roleError) {
                    console.error("Rol yetkileri alınamadı:", roleError);
                }

                finalPerms = roleData?.perms || {};
            }

            const flatPermissions = flattenPermissions(finalPerms);

            setUser(dbUser);
            setPermissions(flatPermissions);
            localStorage.setItem("aktifKullanici", JSON.stringify(dbUser));
            localStorage.setItem("permissions", JSON.stringify(flatPermissions));

            setLoading(false);
            return dbUser;
        } catch (err) {
            console.error("Auth yükleme hatası:", err);
            setUser(null);
            setPermissions([]);
            setLoading(false);
            return null;
        }
    }

    function clearSessionTimers() {
        if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
        if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
        if (countdownRef.current) clearInterval(countdownRef.current);

        warningTimerRef.current = null;
        logoutTimerRef.current = null;
        countdownRef.current = null;
    }

    async function registerActiveSession(dbUser) {
        if (!dbUser?.id) return;

        const sessionId = getOrCreateSessionId(dbUser.id);
        const clientInfo = getClientInfo();

        const { error } = await supabase
            .from("aktif_oturumlar")
            .upsert(
                {
                    session_id: sessionId,
                    kullanici_id: String(dbUser.id),
                    kullanici_adi: dbUser.kullanici_adi || null,
                    ad: dbUser.ad || null,
                    rol: dbUser.rol || "kullanici",
                    cihaz: clientInfo.cihaz,
                    tarayici: clientInfo.tarayici,
                    platform: clientInfo.platform,
                    user_agent: clientInfo.user_agent,
                    aktif: true,
                    force_logout: false,
                    son_islem_at: new Date().toISOString(),
                    terminated_at: null,
                    terminated_by: null,
                    terminate_reason: null,
                },
                { onConflict: "session_id" }
            );

        if (error) {
            console.error("Aktif oturum kaydı oluşturulamadı:", error);
        }
    }

    async function updateActiveSessionActivity(force = false) {
        const sessionId = localStorage.getItem(SESSION_ID_KEY);
        if (!sessionId) return;

        const now = Date.now();

        if (!force && now - lastActivityUpdateRef.current < 30 * 1000) {
            return;
        }

        lastActivityUpdateRef.current = now;

        const { error } = await supabase
            .from("aktif_oturumlar")
            .update({
                son_islem_at: new Date().toISOString(),
            })
            .eq("session_id", sessionId)
            .eq("aktif", true);

        if (error) {
            console.error("Aktif oturum son işlem zamanı güncellenemedi:", error);
        }
    }

    async function closeActiveSession(reason = "manual") {
        const sessionId = localStorage.getItem(SESSION_ID_KEY);
        if (!sessionId) return;

        const { error } = await supabase
            .from("aktif_oturumlar")
            .update({
                aktif: false,
                force_logout: false,
                terminated_at: new Date().toISOString(),
                terminate_reason: reason,
            })
            .eq("session_id", sessionId);

        if (error) {
            console.error("Aktif oturum kapatılamadı:", error);
        }
    }

    async function logout(reason = "manual", options = { markSession: true }) {
        clearSessionTimers();
        setSessionWarningOpen(false);

        if (options.markSession) {
            await closeActiveSession(reason);
        }

        if (reason === "manual" && user?.id) {
            await logKaydet({
                seviye: "bilgi",
                kategori: "Oturum",
                mesaj: "Kullanıcı çıkış yaptı",
                detay: "Manuel çıkış işlemi.",
            });
        }

        if (permissionChannelRef.current) {
            supabase.removeChannel(permissionChannelRef.current);
            permissionChannelRef.current = null;
        }

        if (activeSessionChannelRef.current) {
            supabase.removeChannel(activeSessionChannelRef.current);
            activeSessionChannelRef.current = null;
        }

        setUser(null);
        setPermissions([]);
        localStorage.removeItem("aktifKullanici");
        localStorage.removeItem("permissions");
        localStorage.removeItem(SESSION_ID_KEY);
        localStorage.removeItem(SESSION_USER_KEY);
    }

    function extendSession() {
        clearSessionTimers();
        setSessionWarningOpen(false);
        setRemainingSeconds(60);

        updateActiveSessionActivity(true);

        setTimeout(() => {
            startSessionTimers();
        }, 300);

        logKaydet({
            seviye: "bilgi",
            kategori: "Oturum",
            mesaj: "Kullanıcı oturum süresini uzattı",
            detay: "Oturum bitiş uyarısında Devam Et seçildi.",
        });
    }

    async function timeoutLogout() {
        await logKaydet({
            seviye: "uyari",
            kategori: "Oturum",
            mesaj: "Kullanıcı hareketsizlik nedeniyle sistemden çıkarıldı",
            detay: `Hareketsizlik süresi doldu. Süre: ${Math.round(
                sessionTimeoutMs / 60000
            )} dakika.`,
        });

        await logout("timeout");
        window.location.href = "/login";
    }

    function startCountdown(seconds = 60) {
        setRemainingSeconds(seconds);

        if (countdownRef.current) {
            clearInterval(countdownRef.current);
        }

        countdownRef.current = setInterval(() => {
            setRemainingSeconds((prev) => {
                if (prev <= 1) {
                    clearInterval(countdownRef.current);
                    countdownRef.current = null;
                    return 0;
                }

                return prev - 1;
            });
        }, 1000);
    }

    function startSessionTimers() {
        if (!user?.id || loadingSettings) return;

        clearSessionTimers();

        const safeTimeout = Math.max(sessionTimeoutMs, 10 * 1000);
        const currentWarningMs = getWarningMs(safeTimeout);
        const warningDelay = Math.max(safeTimeout - currentWarningMs, 1000);

        warningTimerRef.current = setTimeout(() => {
            setSessionWarningOpen(true);
            startCountdown(Math.ceil(currentWarningMs / 1000));
        }, warningDelay);

        logoutTimerRef.current = setTimeout(() => {
            timeoutLogout();
        }, safeTimeout);
    }

    function subscribeUserPermissions(dbUser) {
        if (!dbUser?.id) return;

        if (permissionChannelRef.current) {
            supabase.removeChannel(permissionChannelRef.current);
            permissionChannelRef.current = null;
        }

        const channel = supabase
            .channel(`user-permission-${dbUser.id}-${Date.now()}`)
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "kullanicilar",
                    filter: `id=eq.${dbUser.id}`,
                },
                async () => {
                    await refreshAuth();
                }
            );

        channel.subscribe((status) => {
            if (status === "SUBSCRIBED") {
                permissionChannelRef.current = channel;
            }
        });
    }

    function subscribeActiveSession() {
        const sessionId = localStorage.getItem(SESSION_ID_KEY);
        if (!sessionId) return;

        if (activeSessionChannelRef.current) {
            supabase.removeChannel(activeSessionChannelRef.current);
            activeSessionChannelRef.current = null;
        }

        const channel = supabase
            .channel(`active-session-${sessionId}-${Date.now()}`)
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "aktif_oturumlar",
                    filter: `session_id=eq.${sessionId}`,
                },
                async (payload) => {
                    console.log("AKTIF OTURUM UPDATE", payload);

                    const row = payload.new;

                    if (row && row.aktif === false) {
                        console.log("FORCE LOGOUT");

                        await logKaydet({
                            seviye: "uyari",
                            kategori: "Oturum",
                            mesaj: "Kullanıcı oturumu uzaktan sonlandırıldı",
                            detay: row.terminate_reason || "Admin tarafından sonlandırıldı.",
                        });

                        await logout("remote", { markSession: false });
                        window.location.href = "/login";
                    }
                }
            );

        channel.subscribe((status) => {
            console.log("ACTIVE SESSION STATUS:", status);

            if (status === "SUBSCRIBED") {
                activeSessionChannelRef.current = channel;
            }
        });
    }

    useEffect(() => {
        mountedRef.current = true;

        async function initAuth() {
            const dbUser = await refreshAuth();

            if (!mountedRef.current || !dbUser?.id) return;

            await registerActiveSession(dbUser);
            await updateActiveSessionActivity(true);

            subscribeUserPermissions(dbUser);
            subscribeActiveSession();
        }

        initAuth();

        return () => {
            mountedRef.current = false;
            clearSessionTimers();

            if (permissionChannelRef.current) {
                supabase.removeChannel(permissionChannelRef.current);
                permissionChannelRef.current = null;
            }

            if (activeSessionChannelRef.current) {
                supabase.removeChannel(activeSessionChannelRef.current);
                activeSessionChannelRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (!user?.id || loadingSettings) return;

        const activityEvents = [
            "mousemove",
            "mousedown",
            "keydown",
            "scroll",
            "touchstart",
            "click",
        ];

        const handleActivity = () => {
            if (sessionWarningOpen) return;

            updateActiveSessionActivity();
            startSessionTimers();
        };

        activityEvents.forEach((event) => {
            window.addEventListener(event, handleActivity);
        });

        startSessionTimers();
        updateActiveSessionActivity(true);

        return () => {
            clearSessionTimers();

            activityEvents.forEach((event) => {
                window.removeEventListener(event, handleActivity);
            });
        };
    }, [user?.id, sessionTimeoutMs, loadingSettings, sessionWarningOpen]);

    const value = useMemo(() => {
        const normalized = permissions.map((p) =>
            String(p).trim().toLowerCase()
        );

        const hasPermission = (key) => {
            if (normalized.includes("*")) return true;

            return normalized.includes(
                String(key).trim().toLowerCase()
            );
        };

        return {
            user,
            permissions,
            loading,
            refreshAuth,
            logout,

            hasPermission,

            canPage: (pageKey) => hasPermission(`${pageKey}.page`),
            canButton: (pageKey, buttonKey) =>
                hasPermission(`${pageKey}.button.${buttonKey}`),
            canColumn: (pageKey, columnKey) =>
                hasPermission(`${pageKey}.column.${columnKey}`),
            canTab: (pageKey, tabKey) =>
                hasPermission(`${pageKey}.tab.${tabKey}`),
        };
    }, [user, permissions, loading]);

    return (
        <AuthContext.Provider value={value}>
            {children}

            {sessionWarningOpen && user?.id && (
                <div className="session-warning-overlay">
                    <div className="session-warning-card">
                        <div className="session-warning-icon">
                            <i className="ti ti-clock-exclamation" />
                        </div>

                        <h3>Oturumunuz sona ermek üzere</h3>

                        <p>
                            Güvenliğiniz için işlem yapılmadığında oturumunuz
                            otomatik olarak kapatılacaktır.
                        </p>

                        <div className="session-warning-time">
                            00:{String(remainingSeconds).padStart(2, "0")}
                        </div>

                        <div className="session-warning-actions">
                            <button
                                type="button"
                                className="session-warning-secondary"
                                onClick={() => {
                                    logout("manual");
                                    window.location.href = "/login";
                                }}
                            >
                                Çıkış Yap
                            </button>

                            <button
                                type="button"
                                className="session-warning-primary"
                                onClick={extendSession}
                            >
                                Devam Et
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth AuthProvider içinde kullanılmalıdır.");
    }

    return context;
}