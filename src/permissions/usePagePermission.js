import { useAuth } from "../context/AuthContext";

export function usePagePermission(pageKey) {
    const auth = useAuth();

    return {
        pageKey,
        canPage: () => auth.canPage(pageKey),
        canButton: (buttonKey) => auth.canButton(pageKey, buttonKey),
        canColumn: (columnKey) => auth.canColumn(pageKey, columnKey),
        canTab: (tabKey) => auth.canTab(pageKey, tabKey),
        hasPermission: auth.hasPermission,
    };
}