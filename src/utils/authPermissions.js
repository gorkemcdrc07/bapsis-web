// JavaScript source code
export function getPermissions() {
    try {
        const data = JSON.parse(localStorage.getItem("permissions") || "[]");
        return Array.isArray(data) ? data : [];
    } catch {
        return [];
    }
}

export function hasPermission(permissionKey) {
    const permissions = getPermissions();

    return permissions.some(
        (item) =>
            String(item).trim().toLowerCase() ===
            String(permissionKey).trim().toLowerCase()
    );
}

export function canPage(pageKey) {
    return hasPermission(`${pageKey}.page`);
}

export function canButton(pageKey, buttonKey) {
    return hasPermission(`${pageKey}.button.${buttonKey}`);
}

export function canColumn(pageKey, columnKey) {
    return hasPermission(`${pageKey}.column.${columnKey}`);
}

export function filterColumnsByPermission(pageKey, columns, hiddenColumns = []) {
    return columns.filter((column) => {
        if (hiddenColumns.includes(column.key)) return false;

        if (column.key === "actions") {
            return canButton(pageKey, "actions");
        }

        return canColumn(pageKey, column.key);
    });
}