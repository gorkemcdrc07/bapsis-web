import { useAuth } from "../context/AuthContext";

export default function PermissionGate({
    pageKey,
    type = "button",
    name,
    fallback = null,
    children,
}) {
    const { canButton, canColumn, canTab, canPage } = useAuth();

    let allowed = false;

    if (type === "page") allowed = canPage(pageKey);
    if (type === "button") allowed = canButton(pageKey, name);
    if (type === "column") allowed = canColumn(pageKey, name);
    if (type === "tab") allowed = canTab(pageKey, name);

    return allowed ? children : fallback;
}