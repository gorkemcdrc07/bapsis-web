import type {
    AllRolPerms,
    Kullanici,
    RolKey,
    RolMeta,
    RolPerms,
} from "../types";

import { PAGES, ROLES } from "./constants";

export function normalizeRole(value: any): RolKey {
    const v = String(value || "").trim().toLocaleLowerCase("tr-TR");

    if (v === "admin") return "admin";
    if (v === "müdür" || v === "mudur") return "mudur";
    if (v === "yönetici" || v === "yonetici") return "yonetici";

    return "kullanici";
}

export function getRoleMeta(key: RolKey): RolMeta {
    return ROLES.find((r) => r.key === key) ?? ROLES[3];
}

export function initials(name: string): string {
    return String(name || "?")
        .split(" ")
        .filter(Boolean)
        .map((x) => x[0])
        .join("")
        .substring(0, 2)
        .toLocaleUpperCase("tr-TR");
}

export function defaultRolePerm(roleKey: RolKey): RolPerms {
    const isAdmin = roleKey === "admin";
    const isMudur = roleKey === "mudur";
    const isYon = roleKey === "yonetici";

    const perms: RolPerms = {};

    PAGES.forEach((p) => {
        const open = isAdmin || isMudur || isYon || p.key === "anasayfa";

        perms[p.key] = {
            page: isAdmin ? true : open,
            cols: Object.fromEntries(
                p.columns.map((c) => [c, isAdmin || isMudur || isYon])
            ),
            btns: Object.fromEntries(
                p.buttons.map((b) => [b, isAdmin || isMudur])
            ),
        };
    });

    return perms;
}

export function buildDefaultAllRolPerms(): AllRolPerms {
    return {
        admin: defaultRolePerm("admin"),
        mudur: defaultRolePerm("mudur"),
        yonetici: defaultRolePerm("yonetici"),
        kullanici: defaultRolePerm("kullanici"),
    };
}

export function cloneRolPerms(rp: RolPerms): RolPerms {
    const out: RolPerms = {};

    for (const [pageKey, perm] of Object.entries(rp || {})) {
        out[pageKey] = {
            page: Boolean(perm?.page),
            cols: { ...(perm?.cols ?? {}) },
            btns: { ...(perm?.btns ?? {}) },
        };
    }

    return out;
}

export function mergeWithPageDefinitions(
    perms: RolPerms | null | undefined,
    fallbackRole: RolKey
): RolPerms {
    const fallback = defaultRolePerm(fallbackRole);
    const merged: RolPerms = {};

    PAGES.forEach((page) => {
        const cur = perms?.[page.key];
        const fb = fallback[page.key];

        merged[page.key] = {
            page: cur?.page ?? fb.page,
            cols: Object.fromEntries(
                page.columns.map((c) => [
                    c,
                    cur?.cols?.[c] ?? fb.cols[c] ?? false,
                ])
            ),
            btns: Object.fromEntries(
                page.buttons.map((b) => [
                    b,
                    cur?.btns?.[b] ?? fb.btns[b] ?? false,
                ])
            ),
        };
    });

    return merged;
}

export function normalizeUser(row: any): Kullanici {
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

export function maskedPassword(value: string): string {
    if (!value) return "-";

    return "•".repeat(Math.max(4, Math.min(String(value).length, 8)));
}