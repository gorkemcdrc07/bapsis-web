import { columnsData } from "../../pages/bimafyon/aktifseferler/constants";

export const PAGE_PERMISSIONS = ["aktif_seferler"];

export const COLUMN_PERMISSIONS = {
    aktif_seferler: columnsData
        .filter((column) => column.key !== "actions")
        .map((column) => column.key),
};

export const BUTTON_PERMISSIONS = {
    aktif_seferler: [
        "actions",
        "export_excel",
        "import_excel",
        "irsaliye",
        "bulk_complete",
        "view_settings",
        "delete",
        "select_vehicle",
        "update_vkn",
    ],
};

export function permissionKey(page, type, key) {
    if (type === "page") return `${page}.page`;
    return `${page}.${type}.${key}`;
}

export function hasPermission(permissions, key) {
    return permissions
        .map((p) => String(p).trim().toLowerCase())
        .includes(String(key).trim().toLowerCase());
}