import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import "./YetkilendirmePanel.css";

/* ─── TYPES ─────────────────────────────────────────────────── */
type RolKey = "admin" | "mudur" | "yonetici" | "kullanici";
type Step = 1 | 2 | 3 | 4 | 5;

interface RolMeta {
    key: RolKey;
    label: string;
    color: string;
    bg: string;
    border: string;
    icon: string;
    desc: string;
}

interface Kullanici {
    id: string;
    name: string;
    email: string;
    dept: string;
    role: RolKey;
    aktif: boolean;
    override: RolPerms | null;
}

interface SayfaDef {
    key: string;
    label: string;
    path: string;
    grup: string;
    columns: string[];
    buttons: string[];
}

interface SayfaPerm {
    page: boolean;
    cols: Record<string, boolean>;
    btns: Record<string, boolean>;
}

type RolPerms = Record<string, SayfaPerm>;
type AllRolPerms = Record<RolKey, RolPerms>;
type AllUserPerms = Record<string, RolPerms | null>;
type UserRoles = Record<string, RolKey>;

/* ─── CONSTANTS ─────────────────────────────────────────────── */
const ROLES: RolMeta[] = [
    { key: "admin", label: "Admin", color: "#1d4ed8", bg: "#eff6ff", border: "#bfdbfe", icon: "ti-shield-lock", desc: "Tüm ekran, sütun ve butonlara tam erişim." },
    { key: "mudur", label: "Müdür", color: "#0369a1", bg: "#e0f2fe", border: "#bae6fd", icon: "ti-briefcase", desc: "Yönetim ekranları ve operasyonel işlem yetkileri." },
    { key: "yonetici", label: "Yönetici", color: "#047857", bg: "#ecfdf5", border: "#a7f3d0", icon: "ti-user-check", desc: "Operasyon takibi ve sınırlı işlem yetkileri." },
    { key: "kullanici", label: "Kullanıcı", color: "#475569", bg: "#f8fafc", border: "#cbd5e1", icon: "ti-user", desc: "Standart kullanıcı erişimi." },
];

const PAGES: SayfaDef[] = [
    { key: "anasayfa", label: "Anasayfa", path: "/anasayfa", grup: "Genel", columns: ["Dashboard Kartları", "Toplam Sipariş", "Aktif Araçlar", "Tamamlanan Sefer"], buttons: ["Yeni Sipariş", "Planlama", "Manuel Sipariş", "Araçlar"] },
    { key: "bim_planlama", label: "Planlama", path: "/bimafyon/planlama", grup: "BİM AFYON", columns: ["Sefer No", "Sevk Tarihi", "Yükleyen Depo", "Kalkış Yeri", "Araç Cinsi", "Çekici", "Dorse", "Sürücü", "Teslim Yeri"], buttons: ["Kaydet", "Güncelle", "Sil", "Excel Aktar", "Mail Gönder", "Sefer Tamamla"] },
    { key: "bim_manuel", label: "Manuel Sipariş", path: "/bimafyon/manuelsiparis", grup: "BİM AFYON", columns: ["Sipariş No", "Müşteri", "Yükleme Noktası", "Teslim Noktası", "Tarih", "Ürün", "Miktar"], buttons: ["Sipariş Ekle", "Kaydet", "Temizle", "Excel Yükle"] },
    { key: "bim_aktif", label: "Aktif Seferler", path: "/bimafyon/aktifseferler", grup: "BİM AFYON", columns: ["Sefer No", "Çekici", "Dorse", "Sürücü", "Durum", "ETA", "Gecikme", "Konum"], buttons: ["Detay", "QR Okut", "Sefer Tamamla", "İkaz Gönder", "Haritada Göster"] },
    { key: "bim_silinen", label: "Silinen Seferler", path: "/bimafyon/silinenseferler", grup: "BİM AFYON", columns: ["Sefer No", "Silinme Tarihi", "Silinen Kullanıcı", "Açıklama"], buttons: ["Geri Al", "Kalıcı Sil", "Detay"] },
    { key: "bim_tamamlanan", label: "Tamamlanan", path: "/bimafyon/tamamlananseferler", grup: "BİM AFYON", columns: ["Sefer No", "Çekici", "Sürücü", "Tamamlanma Tarihi", "Teslim Durumu", "Navlun"], buttons: ["Detay", "Excel Aktar", "Mail Gönder"] },
    { key: "araclar", label: "Araç Yönetimi", path: "/aracyonetimi/araclar", grup: "Araç Yönetimi", columns: ["Plaka", "Sürücü", "Telefon", "Tedarikçi", "Muayene", "Sigorta", "Araç Tipi", "Durum"], buttons: ["Araç Ekle", "Düzenle", "Sil", "Excel Aktar", "Pasif Yap"] },
    { key: "donus_siparis", label: "Sipariş", path: "/donusler/siparis", grup: "Dönüşler", columns: ["Sipariş No", "Yükleme", "Teslim", "Müşteri", "Tarih", "Navlun"], buttons: ["Sipariş Oluştur", "Kaydet", "Sil", "Excel Aktar"] },
    { key: "donus_plaka", label: "Plaka Atama", path: "/donusler/plakaatama", grup: "Dönüşler", columns: ["Sefer No", "Plaka", "Sürücü", "Telefon", "Durum", "Navlun"], buttons: ["Plaka Ata", "Güncelle", "Tamamla", "Sil"] },
    { key: "donus_tamamlanan", label: "Tamamlanan", path: "/donusler/tamamlananseferler", grup: "Dönüşler", columns: ["Sefer No", "Plaka", "Sürücü", "Tamamlanma Tarihi", "Navlun"], buttons: ["Detay", "Excel Aktar"] },
    { key: "donus_navlun", label: "Navlunlar", path: "/donusler/navlunlar", grup: "Dönüşler", columns: ["Sefer No", "Müşteri", "Navlun", "Para Birimi", "Durum"], buttons: ["Navlun Güncelle", "Onayla", "Excel Aktar"] },
    { key: "ekkayit_vkn", label: "VKN", path: "/ekkayitlar/vkn", grup: "Ek Kayıtlar", columns: ["Firma", "VKN", "Adres", "Oluşturma Tarihi"], buttons: ["VKN Ekle", "Düzenle", "Sil"] },
    { key: "ekkayit_ugrama", label: "Uğrama", path: "/ekkayitlar/ugrama", grup: "Ek Kayıtlar", columns: ["Firma", "Şart", "Tutar", "Durum"], buttons: ["Şart Ekle", "Düzenle", "Sil"] },
    { key: "ekkayit_navlun", label: "Navlun", path: "/ekkayitlar/navlun", grup: "Ek Kayıtlar", columns: ["Firma", "Şart", "Navlun", "Durum"], buttons: ["Şart Ekle", "Düzenle", "Sil"] },
];

const STEPS: { step: Step; label: string; icon: string }[] = [
    { step: 1, label: "Kullanıcı", icon: "ti-user-circle" },
    { step: 2, label: "Sayfalar", icon: "ti-layout-list" },
    { step: 3, label: "Sütunlar", icon: "ti-columns" },
    { step: 4, label: "Butonlar", icon: "ti-click" },
    { step: 5, label: "Özet", icon: "ti-clipboard-check" },
];

/* ─── HELPERS ────────────────────────────────────────────────── */
function normalizeRole(value: any): RolKey {
    const v = String(value || "").trim().toLocaleLowerCase("tr-TR");
    if (v === "admin") return "admin";
    if (v === "müdür" || v === "mudur") return "mudur";
    if (v === "yönetici" || v === "yonetici") return "yonetici";
    return "kullanici";
}

function getRoleMeta(key: RolKey): RolMeta {
    return ROLES.find((r) => r.key === key) ?? ROLES[3];
}

function initials(name: string): string {
    return String(name || "?").split(" ").filter(Boolean).map((x) => x[0]).join("").substring(0, 2).toLocaleUpperCase("tr-TR");
}

function defaultRolePerm(roleKey: RolKey): RolPerms {
    const isAdmin = roleKey === "admin";
    const isMudur = roleKey === "mudur";
    const isYon = roleKey === "yonetici";
    const perms: RolPerms = {};
    PAGES.forEach((p) => {
        const open = isAdmin || isMudur || isYon || p.key === "anasayfa";
        perms[p.key] = {
            page: isAdmin ? true : open,
            cols: Object.fromEntries(p.columns.map((c) => [c, isAdmin || isMudur || isYon])),
            btns: Object.fromEntries(p.buttons.map((b) => [b, isAdmin || isMudur])),
        };
    });
    return perms;
}

function buildDefaultAllRolPerms(): AllRolPerms {
    return { admin: defaultRolePerm("admin"), mudur: defaultRolePerm("mudur"), yonetici: defaultRolePerm("yonetici"), kullanici: defaultRolePerm("kullanici") };
}

function cloneRolPerms(rp: RolPerms): RolPerms {
    const out: RolPerms = {};
    for (const [pageKey, perm] of Object.entries(rp || {})) {
        out[pageKey] = { page: Boolean(perm?.page), cols: { ...(perm?.cols ?? {}) }, btns: { ...(perm?.btns ?? {}) } };
    }
    return out;
}

function mergeWithPageDefinitions(perms: RolPerms | null | undefined, fallbackRole: RolKey): RolPerms {
    const fallback = defaultRolePerm(fallbackRole);
    const merged: RolPerms = {};
    PAGES.forEach((page) => {
        const cur = perms?.[page.key];
        const fb = fallback[page.key];
        merged[page.key] = {
            page: cur?.page ?? fb.page,
            cols: Object.fromEntries(page.columns.map((c) => [c, cur?.cols?.[c] ?? fb.cols[c] ?? false])),
            btns: Object.fromEntries(page.buttons.map((b) => [b, cur?.btns?.[b] ?? fb.btns[b] ?? false])),
        };
    });
    return merged;
}

function normalizeUser(row: any): Kullanici {
    return {
        id: String(row.id),
        name: row.ad || row.kullanici_adi || "İsimsiz Kullanıcı",
        email: row.kullanici_adi || "",
        dept: row.departman || "-",
        role: normalizeRole(row.rol),
        aktif: row.aktif !== false,
        override: row.yetki_override || row.ekran_gorunumleri || null,
    };
}

/* ─── COMPONENT ──────────────────────────────────────────────── */
interface YetkilendirmePanelProps {
    onClose?: () => void;
}

export default function YetkilendirmePanel({ onClose }: YetkilendirmePanelProps) {
    /* state */
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [step, setStep] = useState<Step>(1);
    const [users, setUsers] = useState<Kullanici[]>([]);
    const [rolPerms, setRolPerms] = useState<AllRolPerms>(buildDefaultAllRolPerms());
    const [userPerms, setUserPerms] = useState<AllUserPerms>({});
    const [userRoles, setUserRoles] = useState<UserRoles>({});

    /* step-1 selections */
    const [selectedRole, setSelectedRole] = useState<RolKey>("mudur");
    const [expandedRole, setExpandedRole] = useState<RolKey | null>(null);
    const [selectedUserId, setSelectedUserId] = useState<string>("");
    const [userSearch, setUserSearch] = useState("");

    /* step-2 */
    const [selectedPageKey, setSelectedPageKey] = useState<string>("bim_planlama");

    /* toast */
    const [toast, setToast] = useState<{ msg: string; type: "success" | "error" | "info" }>({ msg: "", type: "info" });
    const toastRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const groups = useMemo(() => Array.from(new Set(PAGES.map((p) => p.grup))), []);
    const selectedUser = useMemo(() => users.find((u) => u.id === selectedUserId) ?? null, [users, selectedUserId]);
    const selectedPage = useMemo(() => PAGES.find((p) => p.key === selectedPageKey) ?? PAGES[0], [selectedPageKey]);
    const subjectRole = selectedUser ? userRoles[selectedUser.id] ?? selectedUser.role : selectedRole;
    const subjectMeta = getRoleMeta(subjectRole);
    const locked = subjectRole === "admin";

    /* keyboard */
    useEffect(() => {
        function onKeyDown(e: KeyboardEvent) {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { e.preventDefault(); if (step === 5) saveAll(); }
            if (e.key === "Escape") onClose?.();
        }
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [step, rolPerms, userPerms, userRoles, onClose]);

    function showToast(msg: string, type: "success" | "error" | "info" = "info") {
        setToast({ msg, type });
        if (toastRef.current) clearTimeout(toastRef.current);
        toastRef.current = setTimeout(() => setToast({ msg: "", type: "info" }), 2600);
    }

    /* ── data ── */
    async function fetchData() {
        setLoading(true);
        const defaultRoles = buildDefaultAllRolPerms();

        const { data: userData, error: userError } = await supabase.from("kullanicilar").select("*").order("created_at", { ascending: false });
        if (userError) { showToast("Kullanıcılar yüklenemedi.", "error"); setLoading(false); return; }

        const activeUsers = (userData || []).map(normalizeUser).filter((u) => u.aktif);
        const rolesMap: UserRoles = {};
        const overrideMap: AllUserPerms = {};
        activeUsers.forEach((u) => {
            rolesMap[u.id] = u.role;
            overrideMap[u.id] = u.override ? mergeWithPageDefinitions(u.override, u.role) : null;
        });

        const { data: roleData, error: roleError } = await supabase.from("yetki_rolleri").select("role_key, perms");
        let rolePermMap = defaultRoles;
        if (!roleError && roleData) {
            const next = { ...defaultRoles };
            roleData.forEach((row: any) => { const key = normalizeRole(row.role_key); next[key] = mergeWithPageDefinitions(row.perms, key); });
            rolePermMap = next;
        }

        setUsers(activeUsers);
        setUserRoles(rolesMap);
        setUserPerms(overrideMap);
        setRolPerms(rolePermMap);
        if (activeUsers.length > 0) setSelectedUserId(activeUsers[0].id);
        showToast("Veriler başarıyla yüklendi.", "success");
        setLoading(false);
    }

    useEffect(() => { fetchData(); }, []);

    /* ── save ── */
    async function saveAll() {
        setSaving(true);
        const rolePayload = ROLES.map((r) => ({ role_key: r.key, perms: rolPerms[r.key], updated_at: new Date().toISOString() }));
        const { error: roleError } = await supabase.from("yetki_rolleri").upsert(rolePayload, { onConflict: "role_key" });
        if (roleError) { showToast("Rol yetkileri kaydedilemedi.", "error"); setSaving(false); return; }

        const results = await Promise.all(users.map((u) => supabase.from("kullanicilar").update({ rol: userRoles[u.id] ?? u.role, yetki_override: userPerms[u.id] ?? null }).eq("id", u.id)));
        const userError = results.find((r) => r.error)?.error;
        if (userError) { showToast("Kullanıcı yetkileri kaydedilemedi.", "error"); setSaving(false); return; }

        showToast("Yetkiler başarıyla kaydedildi.", "success");
        setSaving(false);
    }

    /* ── perm helpers ── */
    function getBaseUserPerms(uid: string): RolPerms {
        if (userPerms[uid]) return userPerms[uid]!;
        const user = users.find((u) => u.id === uid);
        const role = userRoles[uid] ?? user?.role ?? "kullanici";
        return cloneRolPerms(rolPerms[role] ?? defaultRolePerm(role));
    }

    function getCurrentPerm(pageKey: string): SayfaPerm {
        if (selectedUser) {
            const override = userPerms[selectedUser.id];
            if (override?.[pageKey]) return override[pageKey];
            const role = userRoles[selectedUser.id] ?? selectedUser.role;
            return rolPerms[role]?.[pageKey] ?? { page: false, cols: {}, btns: {} };
        }
        return rolPerms[selectedRole]?.[pageKey] ?? { page: false, cols: {}, btns: {} };
    }

    function updatePagePerm(pageKey: string, nextPerm: SayfaPerm) {
        if (locked) { showToast("Admin yetkileri kilitlidir, değiştirilemez.", "error"); return; }
        if (selectedUser) {
            const uid = selectedUser.id;
            const base = getBaseUserPerms(uid);
            setUserPerms((prev) => ({ ...prev, [uid]: { ...base, [pageKey]: nextPerm } }));
            return;
        }
        setRolPerms((prev) => ({ ...prev, [selectedRole]: { ...prev[selectedRole], [pageKey]: nextPerm } }));
    }

    function togglePageAccess(pageKey: string) {
        const cur = getCurrentPerm(pageKey);
        updatePagePerm(pageKey, { ...cur, page: !cur.page });
    }

    function toggleColumn(pageKey: string, column: string) {
        const cur = getCurrentPerm(pageKey);
        updatePagePerm(pageKey, { ...cur, cols: { ...cur.cols, [column]: !Boolean(cur.cols[column]) } });
    }

    function toggleButton(pageKey: string, button: string) {
        const cur = getCurrentPerm(pageKey);
        updatePagePerm(pageKey, { ...cur, btns: { ...cur.btns, [button]: !Boolean(cur.btns[button]) } });
    }

    function setAllColumns(pageKey: string, value: boolean) {
        const page = PAGES.find((p) => p.key === pageKey)!;
        const cur = getCurrentPerm(pageKey);
        updatePagePerm(pageKey, { ...cur, cols: Object.fromEntries(page.columns.map((c) => [c, value])) });
    }

    function setAllButtons(pageKey: string, value: boolean) {
        const page = PAGES.find((p) => p.key === pageKey)!;
        const cur = getCurrentPerm(pageKey);
        updatePagePerm(pageKey, { ...cur, btns: Object.fromEntries(page.buttons.map((b) => [b, value])) });
    }

    function setSelectedUserRole(role: RolKey) {
        if (!selectedUser) return;
        setUserRoles((prev) => ({ ...prev, [selectedUser.id]: role }));
        setUserPerms((prev) => ({ ...prev, [selectedUser.id]: null }));
        setSelectedRole(role);
        showToast("Kullanıcı rolü değişti, özel yetkiler sıfırlandı.", "info");
    }

    /* ── step-2 page for cols/btns ── */
    const currentPerm = getCurrentPerm(selectedPage.key);

    /* ── summary ── */
    const summary = useMemo(() => {
        const openedPages = PAGES.filter((p) => getCurrentPerm(p.key).page).length;
        const activeColumns = PAGES.reduce((t, p) => t + p.columns.filter((c) => getCurrentPerm(p.key).cols[c]).length, 0);
        const activeButtons = PAGES.reduce((t, p) => t + p.buttons.filter((b) => getCurrentPerm(p.key).btns[b]).length, 0);
        const totalColumns = PAGES.reduce((t, p) => t + p.columns.length, 0);
        const totalButtons = PAGES.reduce((t, p) => t + p.buttons.length, 0);
        return { openedPages, activeColumns, activeButtons, totalColumns, totalButtons };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedRole, selectedUserId, rolPerms, userPerms, userRoles]);

    /* ── filtered users for step-1 panel ── */
    const filteredPanelUsers = useMemo(() => {
        const q = userSearch.trim().toLocaleLowerCase("tr-TR");
        const byRole = users.filter((u) => (userRoles[u.id] ?? u.role) === (expandedRole ?? selectedRole));
        if (!q) return byRole;
        return byRole.filter((u) => [u.name, u.email, u.dept].join(" ").toLocaleLowerCase("tr-TR").includes(q));
    }, [users, userRoles, expandedRole, selectedRole, userSearch]);

    /* ── pages by group ── */
    const pagesByGroup = useMemo(() => {
        const map: Record<string, SayfaDef[]> = {};
        PAGES.forEach((p) => { if (!map[p.grup]) map[p.grup] = []; map[p.grup].push(p); });
        return map;
    }, []);

    /* ── navigation ── */
    function goNext() {
        if (step < 5) setStep((s) => (s + 1) as Step);
    }
    function goPrev() {
        if (step > 1) setStep((s) => (s - 1) as Step);
    }

    /* ═══════════════════════ RENDER ════════════════════════════ */
    return (
        <div className="ypw-backdrop" onMouseDown={onClose}>
            <div className="ypw-shell" onMouseDown={(e) => e.stopPropagation()}>

                {/* HEADER */}
                <header className="ypw-header">
                    <div className="ypw-brand">
                        <div className="ypw-brand-icon"><i className="ti ti-shield-cog" /></div>
                        <div>
                            <h1>Yetkilendirme Sihirbazı</h1>
                            <p>Kullanıcı, sayfa, sütun ve buton yetkilerini adım adım yapılandırın.</p>
                        </div>
                    </div>
                    <div className="ypw-header-right">
                        {/* context pill */}
                        <div className="ypw-ctx-pill" style={{ borderColor: subjectMeta.border, background: subjectMeta.bg, color: subjectMeta.color }}>
                            <span className="ypw-ctx-avatar" style={{ background: subjectMeta.color, color: "#fff" }}>
                                {selectedUser ? initials(selectedUser.name) : <i className={`ti ${subjectMeta.icon}`} />}
                            </span>
                            <span className="ypw-ctx-name">{selectedUser ? selectedUser.name : subjectMeta.label}</span>
                        </div>
                        <button className="ypw-btn ghost" onClick={fetchData} disabled={loading || saving}><i className="ti ti-refresh" /></button>
                        {onClose && <button className="ypw-btn icon" onClick={onClose}><i className="ti ti-x" /></button>}
                    </div>
                </header>

                {/* STEP RAIL */}
                <div className="ypw-rail">
                    {STEPS.map((s, i) => {
                        const state = step === s.step ? "active" : step > s.step ? "done" : "idle";
                        return (
                            <button key={s.step} className={`ypw-rail-step ${state}`} onClick={() => setStep(s.step)}>
                                <span className="ypw-rail-num">{state === "done" ? <i className="ti ti-check" /> : s.step}</span>
                                <i className={`ti ${s.icon} ypw-rail-icon`} />
                                <strong>{s.label}</strong>
                                {i < STEPS.length - 1 && <div className={`ypw-rail-line ${step > s.step ? "done" : ""}`} />}
                            </button>
                        );
                    })}
                </div>

                {/* BODY */}
                {loading ? (
                    <div className="ypw-loader">
                        <i className="ti ti-loader-2 ypw-spin" />
                        <strong>Yetkiler yükleniyor</strong>
                        <span>Kullanıcı ve rol bilgileri hazırlanıyor…</span>
                    </div>
                ) : (
                    <main className="ypw-body">

                        {/* ── STEP 1: KULLANICI ── */}
                        {step === 1 && (
                            <div className="ypw-step-view">
                                <div className="ypw-step-head">
                                    <h2>Kimi yetkilendiriyorsunuz?</h2>
                                    <p>Bir rol seçin — tüm rol için geçerli olur. Belirli bir kullanıcı için rolün üzerine tıklayın ve kullanıcıyı seçin.</p>
                                </div>

                                <div className="ypw-role-row">
                                    {ROLES.map((role) => {
                                        const count = users.filter((u) => (userRoles[u.id] ?? u.role) === role.key).length;
                                        const isSelected = selectedRole === role.key && !selectedUserId;
                                        const isExpanded = expandedRole === role.key;
                                        return (
                                            <div key={role.key} className="ypw-role-col">
                                                <button
                                                    className={`ypw-role-tile ${isSelected ? "selected" : ""} ${isExpanded ? "expanded" : ""}`}
                                                    style={{ "--role-color": role.color, "--role-bg": role.bg, "--role-border": role.border } as any}
                                                    onClick={() => {
                                                        setSelectedRole(role.key);
                                                        setSelectedUserId("");
                                                        setExpandedRole(isExpanded ? null : role.key);
                                                        setUserSearch("");
                                                    }}
                                                >
                                                    <span className="ypw-role-tile-icon"><i className={`ti ${role.icon}`} /></span>
                                                    <strong>{role.label}</strong>
                                                    <small>{role.desc}</small>
                                                    <em>{count} kullanıcı</em>
                                                    <div className="ypw-role-tile-indicator">
                                                        <i className={`ti ${isExpanded ? "ti-chevron-up" : "ti-users"}`} />
                                                        {isExpanded ? "Kapat" : "Kullanıcıları gör"}
                                                    </div>
                                                </button>

                                                {/* expanded user panel */}
                                                {isExpanded && (
                                                    <div className="ypw-user-panel">
                                                        <div className="ypw-user-search-bar">
                                                            <i className="ti ti-search" />
                                                            <input value={userSearch} onChange={(e) => setUserSearch(e.target.value)} placeholder="Kullanıcı ara…" />
                                                        </div>
                                                        <div className="ypw-user-list">
                                                            {/* rol geneli seçeneği */}
                                                            <button
                                                                className={`ypw-user-item ${selectedRole === role.key && !selectedUserId ? "active" : ""}`}
                                                                onClick={() => { setSelectedRole(role.key); setSelectedUserId(""); }}
                                                            >
                                                                <span className="ypw-uitem-av" style={{ background: role.color, color: "#fff" }}>
                                                                    <i className="ti ti-users-group" />
                                                                </span>
                                                                <div>
                                                                    <strong>Tüm {role.label}lar</strong>
                                                                    <small>Rol geneli yetki düzenle</small>
                                                                </div>
                                                                {selectedRole === role.key && !selectedUserId && <i className="ti ti-check ypw-uitem-check" />}
                                                            </button>

                                                            {filteredPanelUsers.length === 0 && (
                                                                <div className="ypw-user-empty">Bu role sahip kullanıcı bulunamadı.</div>
                                                            )}

                                                            {filteredPanelUsers.map((user) => (
                                                                <button
                                                                    key={user.id}
                                                                    className={`ypw-user-item ${selectedUserId === user.id ? "active" : ""}`}
                                                                    onClick={() => { setSelectedUserId(user.id); setSelectedRole(role.key); }}
                                                                >
                                                                    <span className="ypw-uitem-av" style={{ background: role.bg, color: role.color, border: `1px solid ${role.border}` }}>
                                                                        {initials(user.name)}
                                                                    </span>
                                                                    <div>
                                                                        <strong>{user.name}</strong>
                                                                        <small>{user.email || "Mail yok"}</small>
                                                                    </div>
                                                                    {userPerms[user.id] && <em className="ypw-uitem-special">Özel</em>}
                                                                    {selectedUserId === user.id && <i className="ti ti-check ypw-uitem-check" />}
                                                                </button>
                                                            ))}
                                                        </div>

                                                        {selectedUser && (
                                                            <div className="ypw-user-role-change">
                                                                <label>Kullanıcı rolünü değiştir</label>
                                                                <select
                                                                    value={subjectRole}
                                                                    disabled={subjectRole === "admin"}
                                                                    onChange={(e) => setSelectedUserRole(e.target.value as RolKey)}
                                                                >
                                                                    {ROLES.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
                                                                </select>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="ypw-selection-status">
                                    <i className={`ti ${selectedUser ? "ti-user-check" : "ti-users"}`} />
                                    {selectedUser
                                        ? <><strong>{selectedUser.name}</strong> için özel yetki düzenlenecek — rol: <em>{subjectMeta.label}</em></>
                                        : <><strong>{subjectMeta.label}</strong> rolündeki tüm kullanıcılar için geçerli olacak</>
                                    }
                                </div>
                            </div>
                        )}

                        {/* ── STEP 2: SAYFALAR ── */}
                        {step === 2 && (
                            <div className="ypw-step-view">
                                <div className="ypw-step-head">
                                    <h2>Hangi sayfalara erişebilsin?</h2>
                                    <p>Her sayfanın yanındaki anahtarı kullanarak erişimi açıp kapatın. Kapalı sayfalarda sütun ve buton ayarları geçersiz olur.</p>
                                </div>

                                {groups.map((group) => (
                                    <div key={group} className="ypw-page-group">
                                        <div className="ypw-page-group-head">
                                            <i className="ti ti-folder" />
                                            <strong>{group}</strong>
                                            <span>{pagesByGroup[group]?.filter((p) => getCurrentPerm(p.key).page).length}/{pagesByGroup[group]?.length} açık</span>
                                        </div>
                                        <div className="ypw-page-list">
                                            {(pagesByGroup[group] ?? []).map((page) => {
                                                const perm = getCurrentPerm(page.key);
                                                const activeCols = page.columns.filter((c) => perm.cols[c]).length;
                                                const activeBtns = page.buttons.filter((b) => perm.btns[b]).length;
                                                return (
                                                    <div
                                                        key={page.key}
                                                        className={`ypw-page-row ${selectedPageKey === page.key ? "focused" : ""} ${perm.page ? "on" : "off"}`}
                                                        onClick={() => setSelectedPageKey(page.key)}
                                                    >
                                                        <div className="ypw-page-row-info">
                                                            <strong>{page.label}</strong>
                                                            <code>{page.path}</code>
                                                        </div>
                                                        <div className="ypw-page-row-stats">
                                                            <span><i className="ti ti-columns" />{activeCols}/{page.columns.length} sütun</span>
                                                            <span><i className="ti ti-click" />{activeBtns}/{page.buttons.length} buton</span>
                                                        </div>
                                                        <button
                                                            className={`ypw-toggle ${perm.page ? "on" : "off"}`}
                                                            disabled={locked}
                                                            onClick={(e) => { e.stopPropagation(); togglePageAccess(page.key); }}
                                                            title={perm.page ? "Kapat" : "Aç"}
                                                        >
                                                            <span />
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* ── STEP 3: SÜTUNLAR ── */}
                        {step === 3 && (
                            <div className="ypw-step-view">
                                <div className="ypw-step-head-row">
                                    <div>
                                        <h2>Tablo sütunları</h2>
                                        <p>Seçilen sayfada tabloda hangi sütunların görüneceğini belirleyin.</p>
                                    </div>
                                    <div className="ypw-page-picker">
                                        <label>Sayfa</label>
                                        <select value={selectedPageKey} onChange={(e) => setSelectedPageKey(e.target.value)}>
                                            {PAGES.filter((p) => getCurrentPerm(p.key).page).map((p) => (
                                                <option key={p.key} value={p.key}>{p.label} ({p.grup})</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {!currentPerm.page ? (
                                    <div className="ypw-empty-notice">
                                        <i className="ti ti-lock" />
                                        <strong>Bu sayfa kapalı</strong>
                                        <span>Sütunları düzenlemek için önce 2. adımda bu sayfayı açın.</span>
                                    </div>
                                ) : (
                                    <>
                                        <div className="ypw-bulk-bar">
                                            <span>{selectedPage.columns.filter((c) => currentPerm.cols[c]).length}/{selectedPage.columns.length} sütun aktif</span>
                                            <div>
                                                <button className="ypw-btn success-soft sm" disabled={locked} onClick={() => setAllColumns(selectedPage.key, true)}><i className="ti ti-checks" />Tümünü Aç</button>
                                                <button className="ypw-btn danger-soft sm" disabled={locked} onClick={() => setAllColumns(selectedPage.key, false)}><i className="ti ti-ban" />Tümünü Kapat</button>
                                            </div>
                                        </div>
                                        <div className="ypw-perm-grid">
                                            {selectedPage.columns.map((col) => {
                                                const on = Boolean(currentPerm.cols[col]);
                                                return (
                                                    <label key={col} className={`ypw-perm-card ${on ? "on" : ""} ${locked ? "disabled" : ""}`}>
                                                        <input type="checkbox" checked={on} disabled={locked} onChange={() => toggleColumn(selectedPage.key, col)} />
                                                        <div className="ypw-perm-icon"><i className={`ti ${on ? "ti-check" : "ti-columns"}`} /></div>
                                                        <div className="ypw-perm-label">
                                                            <strong>{col}</strong>
                                                            <small>Sütun</small>
                                                        </div>
                                                        <div className={`ypw-perm-dot ${on ? "on" : ""}`} />
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* ── STEP 4: BUTONLAR ── */}
                        {step === 4 && (
                            <div className="ypw-step-view">
                                <div className="ypw-step-head-row">
                                    <div>
                                        <h2>İşlem butonları</h2>
                                        <p>Seçilen sayfada hangi butonların görüneceğini belirleyin.</p>
                                    </div>
                                    <div className="ypw-page-picker">
                                        <label>Sayfa</label>
                                        <select value={selectedPageKey} onChange={(e) => setSelectedPageKey(e.target.value)}>
                                            {PAGES.filter((p) => getCurrentPerm(p.key).page).map((p) => (
                                                <option key={p.key} value={p.key}>{p.label} ({p.grup})</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {!currentPerm.page ? (
                                    <div className="ypw-empty-notice">
                                        <i className="ti ti-lock" />
                                        <strong>Bu sayfa kapalı</strong>
                                        <span>Butonları düzenlemek için önce 2. adımda bu sayfayı açın.</span>
                                    </div>
                                ) : (
                                    <>
                                        <div className="ypw-bulk-bar">
                                            <span>{selectedPage.buttons.filter((b) => currentPerm.btns[b]).length}/{selectedPage.buttons.length} buton aktif</span>
                                            <div>
                                                <button className="ypw-btn success-soft sm" disabled={locked} onClick={() => setAllButtons(selectedPage.key, true)}><i className="ti ti-checks" />Tümünü Aç</button>
                                                <button className="ypw-btn danger-soft sm" disabled={locked} onClick={() => setAllButtons(selectedPage.key, false)}><i className="ti ti-ban" />Tümünü Kapat</button>
                                            </div>
                                        </div>
                                        <div className="ypw-perm-grid">
                                            {selectedPage.buttons.map((btn) => {
                                                const on = Boolean(currentPerm.btns[btn]);
                                                return (
                                                    <label key={btn} className={`ypw-perm-card btn-card ${on ? "on" : ""} ${locked ? "disabled" : ""}`}>
                                                        <input type="checkbox" checked={on} disabled={locked} onChange={() => toggleButton(selectedPage.key, btn)} />
                                                        <div className="ypw-perm-icon"><i className={`ti ${on ? "ti-check" : "ti-click"}`} /></div>
                                                        <div className="ypw-perm-label">
                                                            <strong>{btn}</strong>
                                                            <small>Buton</small>
                                                        </div>
                                                        <div className={`ypw-perm-dot ${on ? "on" : ""}`} />
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* ── STEP 5: ÖZET ── */}
                        {step === 5 && (
                            <div className="ypw-step-view">
                                <div className="ypw-step-head">
                                    <h2>Yetki özeti</h2>
                                    <p>Yapılandırmanızı kontrol edin. Onaylamak için <strong>Tamamla ve Kaydet</strong>'e basın.</p>
                                </div>

                                <div className="ypw-summary-who">
                                    <div className="ypw-summary-who-avatar" style={{ background: subjectMeta.bg, color: subjectMeta.color, borderColor: subjectMeta.border }}>
                                        {selectedUser ? initials(selectedUser.name) : <i className={`ti ${subjectMeta.icon}`} />}
                                    </div>
                                    <div>
                                        <strong>{selectedUser ? selectedUser.name : subjectMeta.label + " Rolü"}</strong>
                                        <span>{selectedUser ? selectedUser.email || "Mail bilgisi yok" : "Rol geneli yetki düzenlendi"}</span>
                                    </div>
                                    <div className="ypw-summary-role-badge" style={{ background: subjectMeta.bg, color: subjectMeta.color, borderColor: subjectMeta.border }}>
                                        {subjectMeta.label}
                                    </div>
                                </div>

                                <div className="ypw-summary-stats">
                                    <div className="ypw-stat-card">
                                        <i className="ti ti-layout-dashboard" />
                                        <strong>{summary.openedPages}</strong>
                                        <span>Açık sayfa</span>
                                        <small>/ {PAGES.length} toplam</small>
                                    </div>
                                    <div className="ypw-stat-card">
                                        <i className="ti ti-columns" />
                                        <strong>{summary.activeColumns}</strong>
                                        <span>Aktif sütun</span>
                                        <small>/ {summary.totalColumns} toplam</small>
                                    </div>
                                    <div className="ypw-stat-card">
                                        <i className="ti ti-click" />
                                        <strong>{summary.activeButtons}</strong>
                                        <span>Aktif buton</span>
                                        <small>/ {summary.totalButtons} toplam</small>
                                    </div>
                                    <div className="ypw-stat-card">
                                        <i className="ti ti-user-cog" />
                                        <strong>{Object.values(userPerms).filter(Boolean).length}</strong>
                                        <span>Özel yetkili</span>
                                        <small>kullanıcı</small>
                                    </div>
                                </div>

                                <div className="ypw-summary-pages">
                                    <h3>Açık sayfalar</h3>
                                    <div className="ypw-summary-page-list">
                                        {PAGES.filter((p) => getCurrentPerm(p.key).page).map((page) => {
                                            const perm = getCurrentPerm(page.key);
                                            const cols = page.columns.filter((c) => perm.cols[c]).length;
                                            const btns = page.buttons.filter((b) => perm.btns[b]).length;
                                            return (
                                                <div key={page.key} className="ypw-summary-page-row">
                                                    <div className="ypw-sprow-info">
                                                        <strong>{page.label}</strong>
                                                        <code>{page.path}</code>
                                                    </div>
                                                    <div className="ypw-sprow-badges">
                                                        <em><i className="ti ti-columns" />{cols}/{page.columns.length}</em>
                                                        <em><i className="ti ti-click" />{btns}/{page.buttons.length}</em>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {summary.openedPages === 0 && (
                                            <div className="ypw-user-empty">Hiç açık sayfa yok. 2. adımda sayfaları açın.</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                    </main>
                )}

                {/* FOOTER */}
                {!loading && (
                    <footer className="ypw-footer">
                        <button className="ypw-btn ghost" onClick={goPrev} disabled={step === 1}>
                            <i className="ti ti-arrow-left" /> Geri
                        </button>
                        <span className="ypw-footer-step">{step} / {STEPS.length}</span>
                        {step < 5 ? (
                            <button className="ypw-btn primary" onClick={goNext}>
                                Devam <i className="ti ti-arrow-right" />
                            </button>
                        ) : (
                            <button className="ypw-btn primary save" onClick={saveAll} disabled={saving}>
                                <i className={`ti ${saving ? "ti-loader-2 ypw-spin" : "ti-device-floppy"}`} />
                                {saving ? "Kaydediliyor…" : "Tamamla ve Kaydet"}
                            </button>
                        )}
                    </footer>
                )}

            </div>

            {/* TOAST */}
            {toast.msg && (
                <div className={`ypw-toast ${toast.type}`}>
                    <i className={`ti ${toast.type === "success" ? "ti-circle-check" : toast.type === "error" ? "ti-circle-x" : "ti-info-circle"}`} />
                    {toast.msg}
                </div>
            )}
        </div>
    );
}