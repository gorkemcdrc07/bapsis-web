export type RolKey = "admin" | "mudur" | "yonetici" | "kullanici";

export type PanelTab =
    | "kullanicilar"
    | "yetkilendirme"
    | "tumYetkiler"
    | "loglar"
    | "ayarlar";

export interface RolMeta {
    key: RolKey;
    label: string;
    color: string;
    bg: string;
    border: string;
    icon: string;
    desc: string;
}

export interface Kullanici {
    id: string;
    name: string;
    email: string;
    password: string;
    dept: string;
    role: RolKey;
    aktif: boolean;
    override: RolPerms | null;
}

export type UserFormMode = "create" | "edit";

export interface UserFormState {
    id: string;
    name: string;
    email: string;
    password: string;
    dept: string;
    role: RolKey;
    aktif: boolean;
}

export interface SayfaDef {
    key: string;
    label: string;
    path: string;
    grup: string;
    columns: string[];
    buttons: string[];
}

export interface SayfaPerm {
    page: boolean;
    cols: Record<string, boolean>;
    btns: Record<string, boolean>;
}

export type RolPerms = Record<string, SayfaPerm>;
export type AllRolPerms = Record<RolKey, RolPerms>;
export type AllUserPerms = Record<string, RolPerms | null>;
export type UserRoles = Record<string, RolKey>;