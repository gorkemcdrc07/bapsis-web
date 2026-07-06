import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import "./YetkilendirmePanel.css";

/* ─── TYPES ─────────────────────────────────────────────────── */
type RolKey = "admin" | "mudur" | "yonetici" | "kullanici";
type PanelTab = "kullanicilar" | "yetkilendirme" | "tumYetkiler" | "loglar" | "ayarlar";

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
    password: string;
    dept: string;
    role: RolKey;
    aktif: boolean;
    override: RolPerms | null;
}

type UserFormMode = "create" | "edit";

interface UserFormState {
    id: string;
    name: string;
    email: string;
    password: string;
    dept: string;
    role: RolKey;
    aktif: boolean;
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
    { key: "admin", label: "Admin", color: "#111827", bg: "#f8fafc", border: "#d1d5db", icon: "ti-shield-lock", desc: "" },
    { key: "mudur", label: "Müdür", color: "#111827", bg: "#f8fafc", border: "#d1d5db", icon: "ti-briefcase", desc: "" },
    { key: "yonetici", label: "Yönetici", color: "#111827", bg: "#f8fafc", border: "#d1d5db", icon: "ti-user-check", desc: "" },
    { key: "kullanici", label: "Kullanıcı", color: "#111827", bg: "#f8fafc", border: "#d1d5db", icon: "ti-user", desc: "" },
];

/* Sütun ve buton adları, gerçek ekran bileşenlerindeki (Planlama, ManuelSiparis,
   AktifSeferler, PlakaAtama, Araclar, Siparis, Navlunlar, VKN, UğramaŞart,
   NavlunŞart, Silinen/Tamamlanan Seferler) alanlar ve aksiyonlarla birebir
   eşleştirilmiştir. */
const PAGES: SayfaDef[] = [
    {
        key: "anasayfa",
        label: "Anasayfa",
        path: "/anasayfa",
        grup: "Genel",
        columns: ["Dashboard Kartları", "Toplam Sipariş", "Aktif Araçlar", "Tamamlanan Sefer"],
        buttons: ["Yeni Sipariş", "Planlama", "Manuel Sipariş", "Araçlar"],
    },
    {
        key: "bim_planlama",
        label: "Planlama",
        path: "/bimafyon/planlama",
        grup: "BİM AFYON",
        columns: [
            "Sefer No", "Sevk Tarihi", "Yükleyen Depo", "Kalkış Yeri", "Araç Cinsi",
            "Çekici", "Dorse", "Sürücü", "Telefon", "Varış 1", "Varış 2", "Varış 3",
            "Varış 4", "Palet", "Navlun", "Rota", "Durak Sayısı", "Doluluk %",
        ],
        buttons: [
            "Veri Dosyası Yükle", "Talep Dosyası Yükle", "Planlamayı Çalıştır",
            "Araç Ekle", "Aracı Sil", "+ Durak", "Durak Sil", "Başka Araca Taşı",
            "Başka Sefere Al", "Araca Geri Al", "Araç Maliyeti Düzenle",
            "Özeti Göster/Gizle", "JSON İndir", "Aktif Sefere Aktar",
        ],
    },
    {
        key: "bim_manuel",
        label: "Manuel Sipariş",
        path: "/bimafyon/manuelsiparis",
        grup: "BİM AFYON",
        columns: [
            "Sevk Tarihi", "Müşteri / Firma", "Varış 1", "Varış 2", "Varış 3",
            "Varış 4", "Palet", "Araç Cinsi", "Açıklama", "Kaynak",
        ],
        buttons: [
            "Excel Verisi Aktar", "Siparişi Listeye Ekle", "Sipariş Sil",
            "Listeyi Temizle", "Plaka Atamaya Geç",
        ],
    },
    {
        key: "bim_aktif",
        label: "Aktif Seferler",
        path: "/bimafyon/aktifseferler",
        grup: "BİM AFYON",
        columns: [
            "ID", "Sefer No", "Sevk Tarihi", "Yükleyen Depo", "Kalkış Yeri",
            "Araç Cinsi", "Çekici", "Dorse", "TC", "Sürücü", "Telefon", "VKN",
            "Varış 1", "Varış 2", "Varış 3", "Varış 4", "Palet", "İrsaliye",
            "Dataloger No", "Batarya", "Konum", "Son Veri", "Sıcaklık", "Navlun",
            "Araç Durumu", "Peron No",
        ],
        buttons: [
            "Excel İçe Aktar", "Excel Aktar", "İrsaliye Okut", "Sütun Ayarları",
            "Görünüm Kaydet", "Araç Seç", "Şoför Değiştir", "Sefer Sil",
            "Sefer Tamamla", "Toplu Sefer Tamamla", "Navlun Eşleştir",
            "Haritada Göster",
        ],
    },
    {
        key: "bim_silinen",
        label: "Silinen Seferler",
        path: "/bimafyon/silinenseferler",
        grup: "BİM AFYON",
        columns: [
            "Eski ID", "Sefer No", "Çekici", "Sürücü", "Varış", "Durum",
            "Silinme Nedeni", "Silen Kullanıcı", "Tarih",
        ],
        buttons: ["Yenile", "Detay Aç"],
    },
    {
        key: "bim_tamamlanan",
        label: "Tamamlanan",
        path: "/bimafyon/tamamlananseferler",
        grup: "BİM AFYON",
        columns: [
            "Eski ID", "Sefer No", "Çekici", "Dorse", "Sürücü", "Telefon",
            "Varış", "İrsaliye", "Tamamlayan", "Tarih",
        ],
        buttons: ["Yenile", "Detay Aç"],
    },
    {
        key: "araclar",
        label: "Araç Yönetimi",
        path: "/aracyonetimi/araclar",
        grup: "Araç Yönetimi",
        columns: ["Sürücü", "Çekici Plaka", "Dorse Plaka", "TC", "Telefon", "VKN", "Dataloger No"],
        buttons: ["Yeni Araç", "Düzenle", "Sil", "Excel Aktar", "Kart/Tablo Görünümü"],
    },
    {
        key: "donus_siparis",
        label: "Sipariş",
        path: "/donusler/siparis",
        grup: "Dönüşler",
        columns: ["Müşteri", "Yükleme Yeri", "Teslim Yeri", "Navlun", "Sevk Tarihi"],
        buttons: [
            "Yeni Değer Ekle", "Müşteri Seç", "Rota Seç",
            "Siparişi Önizlemeye Ekle", "Siparişleri Aç", "Yenile",
        ],
    },
    {
        key: "donus_plaka",
        label: "Plaka Atama",
        path: "/donusler/plakaatama",
        grup: "Dönüşler",
        columns: [
            "Sefer No", "Sevk Tarihi", "Yükleyen Depo", "Kalkış Yeri", "Çekici",
            "Dorse", "TC", "Sürücü", "Telefon", "VKN", "Varış 1", "Varış 2",
            "Varış 3", "Varış 4", "Palet", "İrsaliye", "Dataloger No", "Navlun",
            "Araç Durumu", "Peron No",
        ],
        buttons: [
            "Excel İçe Aktar", "Excel Aktar", "İrsaliye Okut", "Araç Seç",
            "Şoför Değiştir", "Sefer Sil", "Sefer Tamamla", "Haritada Göster",
        ],
    },
    {
        key: "donus_tamamlanan",
        label: "Tamamlanan",
        path: "/donusler/tamamlananseferler",
        grup: "Dönüşler",
        columns: [
            "Tamamlanma Tarihi", "Sefer No", "Sevk Tarihi", "Çekici", "Dorse",
            "Sürücü", "Telefon", "İrsaliye", "Navlun", "Tamamlayan",
        ],
        buttons: ["Yenile"],
    },
    {
        key: "donus_navlun",
        label: "Navlunlar",
        path: "/donusler/navlunlar",
        grup: "Dönüşler",
        columns: ["Müşteri Adı", "Yükleme Yeri", "Teslim Yeri", "Navlun"],
        buttons: ["Yeni Navlun Ekle", "Düzenle", "Güncelle", "Sil"],
    },
    {
        key: "ekkayit_vkn",
        label: "VKN",
        path: "/ekkayitlar/vkn",
        grup: "Ek Kayıtlar",
        columns: ["VKN", "Kullanım Sayısı"],
        buttons: ["Yeni VKN Ekle", "Düzenle", "Güncelle", "Sil"],
    },
    {
        key: "ekkayit_ugrama",
        label: "Uğrama",
        path: "/ekkayitlar/ugrama",
        grup: "Ek Kayıtlar",
        columns: ["VKN", "Müşteri / Tip", "Tutar", "Durum"],
        buttons: ["İkiz Depo Şartını Aç/Kapat", "Tutar Güncelle", "Durum Değiştir"],
    },
    {
        key: "ekkayit_navlun",
        label: "Navlun",
        path: "/ekkayitlar/navlun",
        grup: "Ek Kayıtlar",
        columns: ["ID", "Varış 1", "Varış 2", "Varış 3", "Fiyat", "Durum", "Kayıt"],
        buttons: ["Satırı Düzenle", "Kaydet", "Vazgeç", "Durum Değiştir", "Fiyat Güncelle"],
    },
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
        password: row.sifre || row.password || "",
        dept: "-",
        role: normalizeRole(row.rol),
        aktif: row.aktif !== false,
        override: row.yetki_override || row.ekran_gorunumleri || null,
    };
}
const EMPTY_USER_FORM: UserFormState = {
    id: "",
    name: "",
    email: "",
    password: "",
    dept: "",
    role: "kullanici",
    aktif: true,
};


/* ─── COMPONENT ──────────────────────────────────────────────── */
interface YetkilendirmePanelProps {
    onClose?: () => void;
}

const TABS: { key: PanelTab; label: string; icon: string; desc: string }[] = [
    { key: "kullanicilar", label: "Kullanıcılar", icon: "ti-users", desc: "" },
    { key: "yetkilendirme", label: "Yetkilendirme", icon: "ti-shield-check", desc: "" },
    { key: "tumYetkiler", label: "Tüm Yetkiler", icon: "ti-list-check", desc: "" },
    { key: "loglar", label: "Loglar", icon: "ti-history", desc: "" },
    { key: "ayarlar", label: "Ayarlar", icon: "ti-settings", desc: "" },
];

type IconName = "users" | "plus" | "search" | "x" | "edit" | "lock" | "unlock" | "trash" | "eye" | "eyeOff" | "save" | "list";

function SvgIcon({ name }: { name: IconName }) {
    const common = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

    if (name === "users") return <svg {...common}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
    if (name === "plus") return <svg {...common}><path d="M12 5v14" /><path d="M5 12h14" /></svg>;
    if (name === "search") return <svg {...common}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>;
    if (name === "x") return <svg {...common}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>;
    if (name === "edit") return <svg {...common}><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>;
    if (name === "lock") return <svg {...common}><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>;
    if (name === "unlock") return <svg {...common}><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 7.5-2" /></svg>;
    if (name === "trash") return <svg {...common}><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v5" /><path d="M14 11v5" /></svg>;
    if (name === "eye") return <svg {...common}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></svg>;
    if (name === "eyeOff") return <svg {...common}><path d="M3 3l18 18" /><path d="M10.58 10.58A2 2 0 0 0 13.42 13.42" /><path d="M9.88 4.24A10.7 10.7 0 0 1 12 4c6.5 0 10 8 10 8a18.6 18.6 0 0 1-3.1 4.35" /><path d="M6.61 6.61C3.8 8.52 2 12 2 12s3.5 8 10 8a10.9 10.9 0 0 0 5.39-1.39" /></svg>;
    if (name === "save") return <svg {...common}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" /><path d="M17 21v-8H7v8" /><path d="M7 3v5h8" /></svg>;
    return <svg {...common}><path d="M8 6h13" /><path d="M8 12h13" /><path d="M8 18h13" /><path d="M3 6h.01" /><path d="M3 12h.01" /><path d="M3 18h.01" /></svg>;
}

function maskedPassword(value: string): string {
    if (!value) return "-";
    return "•".repeat(Math.max(4, Math.min(String(value).length, 8)));
}

export default function YetkilendirmePanel({ onClose }: YetkilendirmePanelProps) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<PanelTab>("kullanicilar");
    const [users, setUsers] = useState<Kullanici[]>([]);
    const [rolPerms, setRolPerms] = useState<AllRolPerms>(buildDefaultAllRolPerms());
    const [userPerms, setUserPerms] = useState<AllUserPerms>({});
    const [userRoles, setUserRoles] = useState<UserRoles>({});

    const [selectedRole, setSelectedRole] = useState<RolKey>("mudur");
    const [expandedRole, setExpandedRole] = useState<RolKey | null>("mudur");
    const [selectedUserId, setSelectedUserId] = useState<string>("");
    const [userSearch, setUserSearch] = useState("");
    const [userRoleFilter, setUserRoleFilter] = useState<"all" | RolKey>("all");
    const [userStatusFilter, setUserStatusFilter] = useState<"all" | "active" | "locked">("all");
    const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
    const [userFormOpen, setUserFormOpen] = useState(false);
    const [userFormMode, setUserFormMode] = useState<UserFormMode>("create");
    const [editingUserId, setEditingUserId] = useState<string>("");
    const [userForm, setUserForm] = useState<UserFormState>(EMPTY_USER_FORM);
    const [deleteConfirmUser, setDeleteConfirmUser] = useState<Kullanici | null>(null);

    const [expandedPageKey, setExpandedPageKey] = useState<string>("bim_planlama");
    const [pageSearch, setPageSearch] = useState("");
    const [pageFilter, setPageFilter] = useState<"all" | "open" | "closed">("all");
    const [groupFilter, setGroupFilter] = useState<string>("all");

    const [toast, setToast] = useState<{ msg: string; type: "success" | "error" | "info" }>({ msg: "", type: "info" });
    const toastRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const groups = useMemo(() => Array.from(new Set(PAGES.map((p) => p.grup))), []);
    const selectedUser = useMemo(() => users.find((u) => u.id === selectedUserId) ?? null, [users, selectedUserId]);
    const subjectRole = selectedUser ? userRoles[selectedUser.id] ?? selectedUser.role : selectedRole;
    const subjectMeta = getRoleMeta(subjectRole);
    const locked = subjectRole === "admin";

    const pagesByGroup = useMemo(() => {
        const map: Record<string, SayfaDef[]> = {};
        PAGES.forEach((p) => { if (!map[p.grup]) map[p.grup] = []; map[p.grup].push(p); });
        return map;
    }, []);

    useEffect(() => {
        function onKeyDown(e: KeyboardEvent) {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
                e.preventDefault();
                saveAll();
            }
            if (e.key === "Escape") onClose?.();
        }
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rolPerms, userPerms, userRoles, onClose]);

    function showToast(msg: string, type: "success" | "error" | "info" = "info") {
        setToast({ msg, type });
        if (toastRef.current) clearTimeout(toastRef.current);
        toastRef.current = setTimeout(() => setToast({ msg: "", type: "info" }), 2600);
    }

    async function fetchData() {
        setLoading(true);
        const defaultRoles = buildDefaultAllRolPerms();

        const { data: userData, error: userError } = await supabase
            .from("kullanicilar")
            .select("*")
            .order("created_at", { ascending: false });

        if (userError) {
            showToast("Kullanıcılar yüklenemedi.", "error");
            setLoading(false);
            return;
        }

        const activeUsers = (userData || []).map(normalizeUser);
        const rolesMap: UserRoles = {};
        const overrideMap: AllUserPerms = {};

        activeUsers.forEach((u) => {
            rolesMap[u.id] = u.role;
            overrideMap[u.id] = u.override ? mergeWithPageDefinitions(u.override, u.role) : null;
        });

        const { data: roleData, error: roleError } = await supabase
            .from("yetki_rolleri")
            .select("role_key, perms");

        let rolePermMap = defaultRoles;
        if (!roleError && roleData) {
            const next = { ...defaultRoles };
            roleData.forEach((row: any) => {
                const key = normalizeRole(row.role_key);
                next[key] = mergeWithPageDefinitions(row.perms, key);
            });
            rolePermMap = next;
        }

        setUsers(activeUsers);
        setUserRoles(rolesMap);
        setUserPerms(overrideMap);
        setRolPerms(rolePermMap);

        if (activeUsers.length > 0) {
            setSelectedUserId(activeUsers[0].id);
            const firstRole = rolesMap[activeUsers[0].id] ?? activeUsers[0].role;
            setSelectedRole(firstRole);
            setExpandedRole(firstRole);
        }

        showToast("Veriler başarıyla yüklendi.", "success");
        setLoading(false);
    }

    useEffect(() => { fetchData(); }, []);

    async function saveAll() {
        setSaving(true);

        const rolePayload = ROLES.map((r) => ({
            role_key: r.key,
            perms: rolPerms[r.key],
            updated_at: new Date().toISOString(),
        }));

        const { error: roleError } = await supabase
            .from("yetki_rolleri")
            .upsert(rolePayload, { onConflict: "role_key" });

        if (roleError) {
            showToast("Rol yetkileri kaydedilemedi.", "error");
            setSaving(false);
            return;
        }

        const results = await Promise.all(
            users.map((u) => supabase
                .from("kullanicilar")
                .update({
                    rol: userRoles[u.id] ?? u.role,
                    yetki_override: userPerms[u.id] ?? null,
                })
                .eq("id", u.id))
        );

        const userError = results.find((r) => r.error)?.error;

        if (userError) {
            console.error("SAVE ALL ERROR:", userError);
            alert(JSON.stringify(userError, null, 2));

            showToast("Kullanıcı yetkileri kaydedilemedi.", "error");
            setSaving(false);
            return;
        }
        showToast("Yetkiler başarıyla kaydedildi.", "success");
        setSaving(false);
    }

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
        if (locked) {
            showToast("Admin yetkileri kilitlidir, değiştirilemez.", "error");
            return;
        }

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

    function openAllPagesInGroup(group: string, value: boolean) {
        (pagesByGroup[group] ?? []).forEach((p) => {
            const cur = getCurrentPerm(p.key);
            if (cur.page !== value) updatePagePerm(p.key, { ...cur, page: value });
        });
    }

    function setSelectedUserRole(role: RolKey) {
        if (!selectedUser) return;
        setUserRoles((prev) => ({ ...prev, [selectedUser.id]: role }));
        setUserPerms((prev) => ({ ...prev, [selectedUser.id]: null }));
        setSelectedRole(role);
        setExpandedRole(role);
        showToast("Kullanıcı rolü değişti, özel yetkiler sıfırlandı.", "info");
    }

    function clearUserOverride(uid: string) {
        setUserPerms((prev) => ({ ...prev, [uid]: null }));
        showToast("Kullanıcı özel yetkileri kaldırıldı.", "success");
    }

    function selectRole(role: RolKey) {
        setSelectedRole(role);
        setSelectedUserId("");
        setExpandedRole(role);
        setActiveTab("yetkilendirme");
    }

    function openCreateUserForm() {
        setEditingUserId("");
        setUserFormMode("create");
        setUserForm(EMPTY_USER_FORM);
        setUserFormOpen(true);
    }

    function openEditUserForm(user: Kullanici) {
        const role = userRoles[user.id] ?? user.role;
        setSelectedUserId(user.id);
        setSelectedRole(role);
        setExpandedRole(role);
        setUserFormMode("edit");
        setEditingUserId(user.id);
        setUserForm({
            id: user.id,
            name: user.name,
            email: user.email,
            password: user.password,
            dept: user.dept === "-" ? "" : user.dept,
            role,
            aktif: user.aktif,
        });
        setUserFormOpen(true);
    }

    function closeUserForm() {
        setUserFormOpen(false);
        setEditingUserId("");
        setUserForm(EMPTY_USER_FORM);
        setUserFormMode("create");
    }

    function updateUserForm<K extends keyof UserFormState>(key: K, value: UserFormState[K]) {
        setUserForm((prev) => ({ ...prev, [key]: value }));
    }

    async function submitUserForm() {
        const name = userForm.name.trim();
        const email = userForm.email.trim();
        const password = userForm.password.trim();

        if (!name || !email || !password) {
            showToast("Ad, kullanıcı adı/e-posta ve şifre zorunludur.", "error");
            return;
        }

        setSaving(true);

        const payload = {
            ad: name,
            kullanici_adi: email,
            sifre: password,
            rol: userForm.role,
            aktif: userForm.aktif,
            yetki_override:
                userFormMode === "create"
                    ? null
                    : userPerms[userForm.id] ?? null,
        };
        const result = userFormMode === "create"
            ? await supabase.from("kullanicilar").insert(payload).select("*").single()
            : await supabase.from("kullanicilar").update(payload).eq("id", userForm.id).select("*").single();

        if (result.error) {
            console.error(result.error);
            alert(JSON.stringify(result.error, null, 2));

            showToast(
                userFormMode === "create"
                    ? "Kullanıcı eklenemedi."
                    : "Kullanıcı güncellenemedi.",
                "error"
            );
            setSaving(false);
            return;
        }
        const normalized = normalizeUser(result.data);
        setUsers((prev) => userFormMode === "create"
            ? [normalized, ...prev]
            : prev.map((u) => u.id === normalized.id ? normalized : u));
        setUserRoles((prev) => ({ ...prev, [normalized.id]: normalized.role }));
        setUserPerms((prev) => ({ ...prev, [normalized.id]: normalized.override ? mergeWithPageDefinitions(normalized.override, normalized.role) : null }));
        setSelectedUserId(normalized.id);
        setSelectedRole(normalized.role);
        setExpandedRole(normalized.role);
        closeUserForm();
        showToast(userFormMode === "create" ? "Yeni kullanıcı eklendi." : "Kullanıcı güncellendi.", "success");
        setSaving(false);
    }

    async function toggleUserLock(user: Kullanici) {
        setSaving(true);
        const nextAktif = !user.aktif;
        const { error } = await supabase.from("kullanicilar").update({ aktif: nextAktif }).eq("id", user.id);
        if (error) {
            console.error(error);
            alert(JSON.stringify(error, null, 2));

            showToast("Kullanıcı durumu değiştirilemedi.", "error");
            setSaving(false);
            return;
        }
        setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, aktif: nextAktif } : u));
        showToast(nextAktif ? "Kullanıcı kilidi kaldırıldı." : "Kullanıcı kilitlendi.", "success");
        setSaving(false);
    }

    function deleteUser(user: Kullanici) {
        setDeleteConfirmUser(user);
    }

    async function confirmDeleteUser() {
        if (!deleteConfirmUser) return;

        setSaving(true);

        const user = deleteConfirmUser;
        const { error } = await supabase
            .from("kullanicilar")
            .delete()
            .eq("id", user.id);

        if (error) {
            console.error(error);
            alert(JSON.stringify(error, null, 2));

            showToast("Kullanıcı silinemedi.", "error");
            setSaving(false);
            return;
        }

        setUsers((prev) => prev.filter((u) => u.id !== user.id));

        setUserRoles((prev) => {
            const next = { ...prev };
            delete next[user.id];
            return next;
        });

        setUserPerms((prev) => {
            const next = { ...prev };
            delete next[user.id];
            return next;
        });

        if (selectedUserId === user.id) setSelectedUserId("");

        setDeleteConfirmUser(null);
        showToast("Kullanıcı silindi.", "success");
        setSaving(false);
    }
    const currentUserRole = selectedUser ? userRoles[selectedUser.id] ?? selectedUser.role : selectedRole;

    const summary = useMemo(() => {
        const openedPages = PAGES.filter((p) => getCurrentPerm(p.key).page).length;
        const activeColumns = PAGES.reduce((t, p) => t + p.columns.filter((c) => getCurrentPerm(p.key).cols[c]).length, 0);
        const activeButtons = PAGES.reduce((t, p) => t + p.buttons.filter((b) => getCurrentPerm(p.key).btns[b]).length, 0);
        const totalColumns = PAGES.reduce((t, p) => t + p.columns.length, 0);
        const totalButtons = PAGES.reduce((t, p) => t + p.buttons.length, 0);
        return { openedPages, activeColumns, activeButtons, totalColumns, totalButtons };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedRole, selectedUserId, rolPerms, userPerms, userRoles]);

    const filteredPanelUsers = useMemo(() => {
        const q = userSearch.trim().toLocaleLowerCase("tr-TR");
        const byRole = users.filter((u) => (userRoles[u.id] ?? u.role) === (expandedRole ?? selectedRole));
        if (!q) return byRole;
        return byRole.filter((u) => [u.name, u.email, u.dept].join(" ").toLocaleLowerCase("tr-TR").includes(q));
    }, [users, userRoles, expandedRole, selectedRole, userSearch]);

    const filteredPages = useMemo(() => {
        const q = pageSearch.trim().toLocaleLowerCase("tr-TR");
        return PAGES.filter((p) => {
            if (groupFilter !== "all" && p.grup !== groupFilter) return false;
            const perm = getCurrentPerm(p.key);
            if (pageFilter === "open" && !perm.page) return false;
            if (pageFilter === "closed" && perm.page) return false;
            if (q && !`${p.label} ${p.path} ${p.grup}`.toLocaleLowerCase("tr-TR").includes(q)) return false;
            return true;
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pageSearch, pageFilter, groupFilter, selectedRole, selectedUserId, rolPerms, userPerms, userRoles]);

    const filteredPagesByGroup = useMemo(() => {
        const map: Record<string, SayfaDef[]> = {};
        filteredPages.forEach((p) => { if (!map[p.grup]) map[p.grup] = []; map[p.grup].push(p); });
        return map;
    }, [filteredPages]);

    const userRows = useMemo(() => {
        const q = userSearch.trim().toLocaleLowerCase("tr-TR");

        return users.filter((u) => {
            const role = userRoles[u.id] ?? u.role;

            if (userRoleFilter !== "all" && role !== userRoleFilter) return false;
            if (userStatusFilter === "active" && !u.aktif) return false;
            if (userStatusFilter === "locked" && u.aktif) return false;

            if (q) {
                return [u.name, u.email, role]
                    .join(" ")
                    .toLocaleLowerCase("tr-TR")
                    .includes(q);
            }

            return true;
        });
    }, [users, userRoles, userSearch, userRoleFilter, userStatusFilter]);

    function renderUsersTab() {
        const renderUserFormCells = (mode: UserFormMode) => (
            <>
                <td>
                    <div className="ypw-inline-user-grid">
                        <label>
                            <span>Kullanıcı</span>
                            <input
                                value={userForm.name}
                                onChange={(e) => updateUserForm("name", e.target.value)}
                                placeholder="Örn: Ahmet Yılmaz"
                                autoFocus
                            />
                        </label>
                    </div>
                </td>

                <td>
                    <label className="ypw-inline-field">
                        <span>Kullanıcı Adı</span>
                        <input
                            value={userForm.email}
                            onChange={(e) => updateUserForm("email", e.target.value)}
                            placeholder="ahmet@firma.com"
                        />
                    </label>
                </td>

                <td>
                    <label className="ypw-inline-field">
                        <span>Şifre</span>
                        <input
                            value={userForm.password}
                            onChange={(e) => updateUserForm("password", e.target.value)}
                            placeholder="Şifre"
                        />
                    </label>
                </td>

                <td>
                    <label className="ypw-inline-field">
                        <span>Rol</span>
                        <select value={userForm.role} onChange={(e) => updateUserForm("role", e.target.value as RolKey)}>
                            {ROLES.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
                        </select>
                    </label>
                </td>

                <td>
                    <label className="ypw-inline-field">
                        <span>Durum</span>
                        <select value={userForm.aktif ? "true" : "false"} onChange={(e) => updateUserForm("aktif", e.target.value === "true")}>
                            <option value="true">Aktif</option>
                            <option value="false">Kilitli</option>
                        </select>
                    </label>
                </td>

                <td className="right">
                    <div className="ypw-row-actions inline-edit-actions" onClick={(e) => e.stopPropagation()}>
                        <button className="ypw-action-btn save" type="button" title={mode === "create" ? "Kullanıcı Ekle" : "Güncelle"} onClick={submitUserForm} disabled={saving}>
                            <SvgIcon name="save" />
                        </button>
                        <button className="ypw-action-btn cancel" type="button" title="Vazgeç" onClick={closeUserForm} disabled={saving}>
                            <SvgIcon name="x" />
                        </button>
                    </div>
                </td>
            </>
        );

        return (
            <div className="ypw-tab-view ypw-users-modern-screen">
                <div className="ypw-users-toolbar">
                    <div className="ypw-users-title">
                        <strong>Kullanıcı Yönetimi</strong>
                        <span>{userRows.length} kayıt</span>
                    </div>

                    <button
                        className="ypw-btn primary ypw-new-user-btn"
                        onClick={openCreateUserForm}
                        disabled={saving || (userFormOpen && userFormMode === "create")}
                    >
                        <SvgIcon name="plus" /> Yeni Kullanıcı
                    </button>
                </div>

                <div className="ypw-user-table-card modern ypw-clean-user-card">
                    <div className="ypw-user-table-head modern ypw-clean-table-head">
                        <label className="ypw-matrix-search ypw-user-top-search ypw-clean-search">
                            <SvgIcon name="search" />
                            <input value={userSearch} onChange={(e) => setUserSearch(e.target.value)} placeholder="Ara..." />
                            {userSearch && (
                                <button className="ypw-clear-x" onClick={() => setUserSearch("")} type="button" aria-label="Aramayı temizle">
                                    <SvgIcon name="x" />
                                </button>
                            )}
                        </label>

                        <div className="ypw-users-filters">
                            <select value={userRoleFilter} onChange={(e) => setUserRoleFilter(e.target.value as "all" | RolKey)}>
                                <option value="all">Tüm Roller</option>
                                {ROLES.map((role) => <option key={role.key} value={role.key}>{role.label}</option>)}
                            </select>

                            <select value={userStatusFilter} onChange={(e) => setUserStatusFilter(e.target.value as "all" | "active" | "locked")}>
                                <option value="all">Tüm Durumlar</option>
                                <option value="active">Aktif</option>
                                <option value="locked">Kilitli</option>
                            </select>
                        </div>
                    </div>

                    <div className="ypw-user-data-table-wrap">
                        <table className="ypw-user-data-table compact-users ypw-clean-users-table">
                            <thead>
                                <tr>
                                    <th>Ad Soyad</th>
                                    <th>Kullanıcı</th>
                                    <th>Şifre</th>
                                    <th>Rol</th>
                                    <th>Durum</th>
                                    <th className="right">İşlemler</th>
                                </tr>
                            </thead>
                            <tbody>
                                {userFormOpen && userFormMode === "create" && (
                                    <tr className="ypw-inline-edit-row ypw-new-row" onClick={(e) => e.stopPropagation()}>
                                        {renderUserFormCells("create")}
                                    </tr>
                                )}

                                {userRows.map((user) => {
                                    const role = userRoles[user.id] ?? user.role;
                                    const meta = getRoleMeta(role);
                                    const active = selectedUserId === user.id;
                                    const passwordVisible = Boolean(visiblePasswords[user.id]);
                                    const isEditing = userFormOpen && userFormMode === "edit" && editingUserId === user.id;

                                    if (isEditing) {
                                        return (
                                            <tr key={user.id} className="ypw-inline-edit-row" onClick={(e) => e.stopPropagation()}>
                                                {renderUserFormCells("edit")}
                                            </tr>
                                        );
                                    }

                                    return (
                                        <tr key={user.id} className={`${active ? "selected" : ""} ${!user.aktif ? "locked" : ""}`} onClick={() => {
                                            setSelectedUserId(user.id);
                                            setSelectedRole(role);
                                            setExpandedRole(role);
                                        }}>
                                            <td>
                                                <div className="ypw-user-cell">
                                                    <span className="ypw-uitem-av colorful" style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}>{initials(user.name)}</span>
                                                    <div>
                                                        <strong>{user.name}</strong>
                                                        <small><span className={user.aktif ? "ypw-dot active" : "ypw-dot locked"} /> {user.aktif ? "Aktif kullanıcı" : "Kilitli kullanıcı"}</small>
                                                    </div>
                                                </div>
                                            </td>

                                            <td>{user.email || "-"}</td>

                                            <td>
                                                <div className="ypw-pass-wrap" onClick={(e) => e.stopPropagation()}>
                                                    <code className="ypw-pass-code">{passwordVisible ? (user.password || "-") : maskedPassword(user.password)}</code>
                                                    <button
                                                        className="ypw-pass-eye"
                                                        type="button"
                                                        aria-label={passwordVisible ? "Şifreyi gizle" : "Şifreyi göster"}
                                                        title={passwordVisible ? "Şifreyi gizle" : "Şifreyi göster"}
                                                        onClick={() => setVisiblePasswords((prev) => ({ ...prev, [user.id]: !prev[user.id] }))}
                                                    >
                                                        <SvgIcon name={passwordVisible ? "eyeOff" : "eye"} />
                                                    </button>
                                                </div>
                                            </td>

                                            <td>
                                                <span className={`ypw-role-pill role-${role}`}>{meta.label}</span>
                                            </td>

                                            <td>
                                                <span className={`ypw-status-pill ${user.aktif ? "active" : "locked"}`}>{user.aktif ? "Aktif" : "Kilitli"}</span>
                                            </td>

                                            <td className="right">
                                                <div className="ypw-row-actions icon-only" onClick={(e) => e.stopPropagation()}>
                                                    <button className="ypw-action-btn edit" type="button" aria-label="Düzenle" title="Satır üzerinde düzenle" onClick={() => openEditUserForm(user)}>
                                                        <SvgIcon name="edit" />
                                                    </button>
                                                    <button className="ypw-action-btn lock" type="button" aria-label={user.aktif ? "Kilitle" : "Kilidi Aç"} title={user.aktif ? "Kilitle" : "Kilidi Aç"} onClick={() => toggleUserLock(user)}>
                                                        <SvgIcon name={user.aktif ? "lock" : "unlock"} />
                                                    </button>
                                                    <button className="ypw-action-btn danger" type="button" aria-label="Sil" title="Sil" onClick={() => deleteUser(user)}>
                                                        <SvgIcon name="trash" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}

                                {userRows.length === 0 && !(userFormOpen && userFormMode === "create") && (
                                    <tr><td colSpan={6}><div className="ypw-user-empty">Kullanıcı bulunamadı.</div></td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {deleteConfirmUser && (
                    <div className="ypw-delete-modal-backdrop" onClick={() => !saving && setDeleteConfirmUser(null)}>
                        <div className="ypw-delete-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="ypw-delete-icon">
                                <SvgIcon name="trash" />
                            </div>

                            <div className="ypw-delete-content">
                                <strong>Kullanıcı silinsin mi?</strong>
                                <p>
                                    <b>{deleteConfirmUser.name}</b> kullanıcısını silmek üzeresiniz.
                                    Bu işlem geri alınamaz.
                                </p>
                            </div>

                            <div className="ypw-delete-actions">
                                <button
                                    type="button"
                                    className="ypw-btn ghost"
                                    onClick={() => setDeleteConfirmUser(null)}
                                    disabled={saving}
                                >
                                    Vazgeç
                                </button>

                                <button
                                    type="button"
                                    className="ypw-btn danger"
                                    onClick={confirmDeleteUser}
                                    disabled={saving}
                                >
                                    {saving ? "Siliniyor..." : "Evet, Sil"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    function renderPermissionTab() {
        return (
            <div className="ypw-tab-view">
                <div className="ypw-tab-head">
                    <div>
                        <h2>Yetkilendirme</h2>

                    </div>
                    <div className="ypw-selection-status slim">
                        <i className="ti ti-user-shield" />
                        <strong>{selectedUser ? selectedUser.name : `${subjectMeta.label} Rolü`}</strong>
                        <em>{subjectMeta.label}</em>
                    </div>
                </div>

                {locked && (
                    <div className="ypw-locked-banner">
                        <i className="ti ti-lock" /> Admin yetkileri tam yetkilidir ve bu ekrandan kapatılamaz.
                    </div>
                )}

                <div className="ypw-matrix-toolbar">
                    <label className="ypw-matrix-search">
                        <i className="ti ti-search" />
                        <input value={pageSearch} onChange={(e) => setPageSearch(e.target.value)} placeholder="Sayfa, yol veya grup ara…" />
                        {pageSearch && <button className="ypw-clear-x" onClick={() => setPageSearch("")} type="button"><i className="ti ti-x" /></button>}
                    </label>

                    <div className="ypw-matrix-filters">
                        <select value={groupFilter} onChange={(e) => setGroupFilter(e.target.value)}>
                            <option value="all">Tüm Gruplar</option>
                            {groups.map((g) => <option key={g} value={g}>{g}</option>)}
                        </select>

                        <div className="ypw-segmented">
                            <button className={pageFilter === "all" ? "on" : ""} onClick={() => setPageFilter("all")}>Tümü</button>
                            <button className={pageFilter === "open" ? "on" : ""} onClick={() => setPageFilter("open")}>Açık</button>
                            <button className={pageFilter === "closed" ? "on" : ""} onClick={() => setPageFilter("closed")}>Kapalı</button>
                        </div>
                    </div>
                </div>

                {Object.entries(filteredPagesByGroup).map(([group, pages]) => (
                    <div key={group} className="ypw-page-group">
                        <div className="ypw-page-group-head">
                            <i className="ti ti-folder" /> {group}
                            <span>{pages.length} ekran</span>
                            <div className="ypw-group-bulk">
                                <button disabled={locked} onClick={() => openAllPagesInGroup(group, true)}><i className="ti ti-eye" />Grubu Aç</button>
                                <button disabled={locked} onClick={() => openAllPagesInGroup(group, false)}><i className="ti ti-eye-off" />Grubu Kapat</button>
                            </div>
                        </div>

                        <div className="ypw-page-list">
                            {pages.map((page) => {
                                const perm = getCurrentPerm(page.key);
                                const isExpanded = expandedPageKey === page.key;
                                const colCount = page.columns.filter((c) => perm.cols[c]).length;
                                const btnCount = page.buttons.filter((b) => perm.btns[b]).length;

                                return (
                                    <div key={page.key} className={`ypw-page-card ${perm.page ? "on" : ""} ${isExpanded ? "expanded" : ""}`}>
                                        <div className="ypw-page-row" onClick={() => setExpandedPageKey(isExpanded ? "" : page.key)}>
                                            <i className={`ti ti-chevron-right ypw-page-caret ${isExpanded ? "open" : ""}`} />
                                            <div className="ypw-page-row-info">
                                                <strong>{page.label}</strong>
                                                <code>{page.path}</code>
                                            </div>
                                            <div className="ypw-page-row-stats">
                                                <span><i className="ti ti-columns" />{colCount}/{page.columns.length}</span>
                                                <span><i className="ti ti-click" />{btnCount}/{page.buttons.length}</span>
                                            </div>
                                            <button
                                                className={`ypw-toggle ${perm.page ? "on" : "off"}`}
                                                disabled={locked}
                                                onClick={(e) => { e.stopPropagation(); togglePageAccess(page.key); }}
                                            >
                                                <span />
                                            </button>
                                        </div>

                                        {isExpanded && (
                                            <div className="ypw-page-detail">
                                                <div className="ypw-perm-block">
                                                    <div className="ypw-perm-block-head">
                                                        <span><i className="ti ti-columns" /> Sütun Yetkileri • {page.columns.length} sütun</span>
                                                        <div>
                                                            <button className="ypw-btn success-soft sm" disabled={locked} onClick={() => setAllColumns(page.key, true)}><i className="ti ti-checks" />Tümü</button>
                                                            <button className="ypw-btn danger-soft sm" disabled={locked} onClick={() => setAllColumns(page.key, false)}><i className="ti ti-ban" />Hiçbiri</button>
                                                        </div>
                                                    </div>
                                                    <div className="ypw-chip-grid">
                                                        {page.columns.map((col) => {
                                                            const on = Boolean(perm.cols[col]);
                                                            return (
                                                                <label key={col} className={`ypw-chip ${on ? "on" : ""} ${locked ? "disabled" : ""}`}>
                                                                    <input type="checkbox" checked={on} disabled={locked} onChange={() => toggleColumn(page.key, col)} />
                                                                    <i className={`ti ${on ? "ti-square-rounded-check" : "ti-square-rounded"}`} />
                                                                    {col}
                                                                </label>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                <div className="ypw-perm-block">
                                                    <div className="ypw-perm-block-head">
                                                        <span><i className="ti ti-click" /> Buton Yetkileri • {page.buttons.length} buton</span>
                                                        <div>
                                                            <button className="ypw-btn success-soft sm" disabled={locked} onClick={() => setAllButtons(page.key, true)}><i className="ti ti-checks" />Tümü</button>
                                                            <button className="ypw-btn danger-soft sm" disabled={locked} onClick={() => setAllButtons(page.key, false)}><i className="ti ti-ban" />Hiçbiri</button>
                                                        </div>
                                                    </div>
                                                    <div className="ypw-chip-grid">
                                                        {page.buttons.map((btn) => {
                                                            const on = Boolean(perm.btns[btn]);
                                                            return (
                                                                <label key={btn} className={`ypw-chip btn-chip ${on ? "on" : ""} ${locked ? "disabled" : ""}`}>
                                                                    <input type="checkbox" checked={on} disabled={locked} onChange={() => toggleButton(page.key, btn)} />
                                                                    <i className={`ti ${on ? "ti-square-rounded-check" : "ti-square-rounded"}`} />
                                                                    {btn}
                                                                </label>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    function renderAllPermissionsTab() {
        return (
            <div className="ypw-tab-view">
                <div className="ypw-tab-head">
                    <div>
                        <h2>Tüm Yetkiler</h2>

                    </div>
                </div>

                <div className="ypw-summary-stats">
                    <div className="ypw-stat-card"><i className="ti ti-layout-dashboard" /><strong>{summary.openedPages}</strong><span>Açık sayfa</span><small>/ {PAGES.length} toplam</small></div>
                    <div className="ypw-stat-card"><i className="ti ti-columns" /><strong>{summary.activeColumns}</strong><span>Aktif sütun</span><small>/ {summary.totalColumns} toplam</small></div>
                    <div className="ypw-stat-card"><i className="ti ti-click" /><strong>{summary.activeButtons}</strong><span>Aktif buton</span><small>/ {summary.totalButtons} toplam</small></div>
                    <div className="ypw-stat-card"><i className="ti ti-user-cog" /><strong>{Object.values(userPerms).filter(Boolean).length}</strong><span>Özel yetkili</span><small>kullanıcı</small></div>
                </div>

                <div className="ypw-role-perm-grid">
                    {ROLES.map((role) => {
                        const meta = getRoleMeta(role.key);
                        const opened = PAGES.filter((p) => rolPerms[role.key]?.[p.key]?.page).length;
                        const cols = PAGES.reduce((t, p) => t + p.columns.filter((c) => rolPerms[role.key]?.[p.key]?.cols?.[c]).length, 0);
                        const btns = PAGES.reduce((t, p) => t + p.buttons.filter((b) => rolPerms[role.key]?.[p.key]?.btns?.[b]).length, 0);
                        return (
                            <button key={role.key} className="ypw-role-perm-card" onClick={() => selectRole(role.key)}>
                                <span className="ypw-role-badge" style={{ background: meta.bg, color: meta.color, borderColor: meta.border }}>
                                    <i className={`ti ${meta.icon}`} /> {meta.label}
                                </span>
                                <strong>{opened}/{PAGES.length} ekran</strong>
                                <small>{cols} sütun • {btns} buton aktif</small>
                            </button>
                        );
                    })}
                </div>

                <div className="ypw-summary-pages">
                    <h3>Açık sayfalar</h3>
                    <div className="ypw-summary-page-list">
                        {PAGES.filter((p) => getCurrentPerm(p.key).page).map((page) => {
                            const perm = getCurrentPerm(page.key);
                            const cols = page.columns.filter((c) => perm.cols[c]).length;
                            const btns = page.buttons.filter((b) => perm.btns[b]).length;
                            return (
                                <button key={page.key} className="ypw-summary-page-row" onClick={() => { setActiveTab("yetkilendirme"); setExpandedPageKey(page.key); }}>
                                    <div className="ypw-sprow-info">
                                        <strong>{page.label}</strong>
                                        <code>{page.path}</code>
                                    </div>
                                    <div className="ypw-sprow-badges">
                                        <em><i className="ti ti-columns" />{cols}/{page.columns.length}</em>
                                        <em><i className="ti ti-click" />{btns}/{page.buttons.length}</em>
                                    </div>
                                    <i className="ti ti-chevron-right ypw-sprow-go" />
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }

    function renderLogsTab() {
        return (
            <div className="ypw-tab-view">
                <div className="ypw-tab-head">
                    <div>
                        <h2>Loglar</h2>

                    </div>
                </div>
                <div className="ypw-empty-state">
                    <i className="ti ti-history" />
                    <strong>Log kaydı bulunmuyor</strong>
                </div>
            </div>
        );
    }

    function renderSettingsTab() {
        return (
            <div className="ypw-tab-view">
                <div className="ypw-tab-head">
                    <div>
                        <h2>Ayarlar</h2>

                    </div>
                </div>

                <div className="ypw-settings-grid">
                    <div className="ypw-setting-card">
                        <i className="ti ti-user-plus" />
                        <strong>Varsayılan kullanıcı rolü</strong>

                    </div>
                    <div className="ypw-setting-card">
                        <i className="ti ti-shield-half" />
                        <strong>Admin kilidi</strong>

                    </div>
                    <div className="ypw-setting-card">
                        <i className="ti ti-device-floppy" />
                        <strong>Kayıt kısayolu</strong>

                    </div>
                </div>
            </div>
        );
    }

    function renderActiveTab() {
        if (activeTab === "kullanicilar") return renderUsersTab();
        if (activeTab === "yetkilendirme") return renderPermissionTab();
        if (activeTab === "tumYetkiler") return renderAllPermissionsTab();
        if (activeTab === "loglar") return renderLogsTab();
        return renderSettingsTab();
    }

    return (
        <div className="ypw-backdrop" onMouseDown={onClose}>
            <div className="ypw-shell" onMouseDown={(e) => e.stopPropagation()}>
                <header className="ypw-header">
                    <div className="ypw-brand">
                        <div className="ypw-brand-icon"><i className="ti ti-shield-cog" /></div>
                        <div>
                            <h1>Yetkilendirme Paneli</h1>

                        </div>
                    </div>
                    <div className="ypw-header-right">
                        <div className="ypw-ctx-pill" style={{ borderColor: subjectMeta.border, background: subjectMeta.bg, color: subjectMeta.color }}>
                            <span className="ypw-ctx-avatar" style={{ background: subjectMeta.color, color: "#fff" }}>
                                {selectedUser ? initials(selectedUser.name) : <i className={`ti ${subjectMeta.icon}`} />}
                            </span>
                            <span className="ypw-ctx-name">{selectedUser ? selectedUser.name : subjectMeta.label}</span>
                            {locked && <i className="ti ti-lock ypw-ctx-lock" title="Admin yetkileri kilitli" />}
                        </div>
                        <button className="ypw-btn ghost icon" onClick={fetchData} disabled={loading || saving} title="Yenile"><i className="ti ti-refresh" /></button>
                        <button className="ypw-btn primary save" onClick={saveAll} disabled={saving || loading}>
                            <i className={`ti ${saving ? "ti-loader-2 ypw-spin" : "ti-device-floppy"}`} />
                            {saving ? "Kaydediliyor…" : "Kaydet"}
                        </button>
                        {onClose && <button className="ypw-btn ghost icon" onClick={onClose} title="Kapat (Esc)"><i className="ti ti-x" /></button>}
                    </div>
                </header>

                <nav className="ypw-tabs">
                    {TABS.map((tab) => (
                        <button key={tab.key} className={`ypw-tab ${activeTab === tab.key ? "active" : ""}`} onClick={() => setActiveTab(tab.key)}>
                            <i className={`ti ${tab.icon}`} />
                            <span>{tab.label}</span>

                        </button>
                    ))}
                </nav>

                {loading ? (
                    <div className="ypw-loader">
                        <i className="ti ti-loader-2 ypw-spin" />
                        <strong>Yetkiler yükleniyor</strong>

                    </div>
                ) : (
                    <main className="ypw-body">{renderActiveTab()}</main>
                )}

                {!loading && (
                    <footer className="ypw-footer compact-footer">
                        <span className="ypw-footer-step">
                            Aktif sekme: <strong>{TABS.find((t) => t.key === activeTab)?.label}</strong>
                        </span>
                        <button className="ypw-btn primary save" onClick={saveAll} disabled={saving}>
                            <i className={`ti ${saving ? "ti-loader-2 ypw-spin" : "ti-device-floppy"}`} />
                            {saving ? "Kaydediliyor…" : "Tümünü Kaydet"}
                        </button>
                    </footer>
                )}
            </div>

            {toast.msg && (
                <div className={`ypw-toast ${toast.type}`}>
                    <i className={`ti ${toast.type === "success" ? "ti-circle-check" : toast.type === "error" ? "ti-circle-x" : "ti-info-circle"}`} />
                    {toast.msg}
                </div>
            )}
        </div>
    );
}
