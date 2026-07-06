import { useMemo } from "react";
import type { Dispatch, SetStateAction } from "react";

import type {
    AllRolPerms,
    AllUserPerms,
    Kullanici,
    RolKey,
    RolPerms,
    SayfaDef,
    SayfaPerm,
    UserRoles,
    PanelTab,
} from "../types";

import { PAGES, ROLES } from "../utils/constants";

import {
    buildDefaultAllRolPerms,
    cloneRolPerms,
    defaultRolePerm,
    mergeWithPageDefinitions,
    normalizeRole,
    normalizeUser,
} from "../utils/helpers";

import {
    getUsers,
    updateUserPermissions,
} from "../services/userService";

import {
    getRolePermissions,
    saveRolePermissions,
} from "../services/roleService";

type ToastType = "success" | "error" | "info";

interface UsePermissionsProps {
    users: Kullanici[];
    setUsers: Dispatch<SetStateAction<Kullanici[]>>;
    rolPerms: AllRolPerms;
    setRolPerms: Dispatch<SetStateAction<AllRolPerms>>;
    userPerms: AllUserPerms;
    setUserPerms: Dispatch<SetStateAction<AllUserPerms>>;
    userRoles: UserRoles;
    setUserRoles: Dispatch<SetStateAction<UserRoles>>;
    selectedRole: RolKey;
    setSelectedRole: Dispatch<SetStateAction<RolKey>>;
    setExpandedRole: Dispatch<SetStateAction<RolKey | null>>;
    selectedUserId: string;
    setSelectedUserId: Dispatch<SetStateAction<string>>;
    selectedUser: Kullanici | null;
    locked: boolean;
    pageSearch: string;
    pageFilter: "all" | "open" | "closed";
    groupFilter: string;
    pagesByGroup: Record<string, SayfaDef[]>;
    setActiveTab: Dispatch<SetStateAction<PanelTab>>;
    setLoading: Dispatch<SetStateAction<boolean>>;
    setSaving: Dispatch<SetStateAction<boolean>>;
    showToast: (msg: string, type?: ToastType) => void;
}

export default function usePermissions({
    users,
    setUsers,
    rolPerms,
    setRolPerms,
    userPerms,
    setUserPerms,
    userRoles,
    setUserRoles,
    selectedRole,
    setSelectedRole,
    setExpandedRole,
    selectedUserId,
    setSelectedUserId,
    selectedUser,
    locked,
    pageSearch,
    pageFilter,
    groupFilter,
    pagesByGroup,
    setActiveTab,
    setLoading,
    setSaving,
    showToast,
}: UsePermissionsProps) {
    async function fetchData() {
        setLoading(true);
        const defaultRoles = buildDefaultAllRolPerms();

        const { data: userData, error: userError } = await getUsers();

        if (userError) {
            showToast("Kullanıcılar yüklenemedi.", "error");
            setLoading(false);
            return;
        }

        const activeUsers = (userData || []).map(normalizeUser);
        const rolesMap: UserRoles = {};
        const overrideMap: AllUserPerms = {};

        activeUsers.forEach((user) => {
            rolesMap[user.id] = user.role;
            overrideMap[user.id] = user.override
                ? mergeWithPageDefinitions(user.override, user.role)
                : null;
        });

        const { data: roleData, error: roleError } = await getRolePermissions();

        let rolePermMap = defaultRoles;

        if (!roleError && roleData) {
            const next = { ...defaultRoles };

            type RolePermissionRow = {
                role_key: string;
                perms: RolPerms;
            };

            roleData.forEach((row: RolePermissionRow) => {
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

    async function saveAll() {
        setSaving(true);

        const rolePayload = ROLES.map((role) => ({
            role_key: role.key,
            perms: rolPerms[role.key],
            updated_at: new Date().toISOString(),
        }));

        const { error: roleError } = await saveRolePermissions(rolePayload);

        if (roleError) {
            showToast("Rol yetkileri kaydedilemedi.", "error");
            setSaving(false);
            return;
        }

        const results = await Promise.all(
            users.map((user) =>
                updateUserPermissions(user.id, {
                    rol: userRoles[user.id] ?? user.role,
                    yetki_override: userPerms[user.id] ?? null,
                })
            )
        );

        const userError = results.find((result) => result.error)?.error;

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

        const user = users.find((item) => item.id === uid);
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

            setUserPerms((prev) => ({
                ...prev,
                [uid]: {
                    ...base,
                    [pageKey]: nextPerm,
                },
            }));
            return;
        }

        setRolPerms((prev) => ({
            ...prev,
            [selectedRole]: {
                ...prev[selectedRole],
                [pageKey]: nextPerm,
            },
        }));
    }

    function togglePageAccess(pageKey: string) {
        const current = getCurrentPerm(pageKey);
        updatePagePerm(pageKey, { ...current, page: !current.page });
    }

    function toggleColumn(pageKey: string, column: string) {
        const current = getCurrentPerm(pageKey);
        updatePagePerm(pageKey, {
            ...current,
            cols: {
                ...current.cols,
                [column]: !current.cols[column],
            },
        });
    }

    function toggleButton(pageKey: string, button: string) {
        const current = getCurrentPerm(pageKey);
        updatePagePerm(pageKey, {
            ...current,
            btns: {
                ...current.btns,
                [button]: !current.btns[button],
            },
        });
    }

    function setAllColumns(pageKey: string, value: boolean) {
        const page = PAGES.find((item) => item.key === pageKey);
        if (!page) return;

        const current = getCurrentPerm(pageKey);
        updatePagePerm(pageKey, {
            ...current,
            cols: Object.fromEntries(page.columns.map((column) => [column, value])),
        });
    }

    function setAllButtons(pageKey: string, value: boolean) {
        const page = PAGES.find((item) => item.key === pageKey);
        if (!page) return;

        const current = getCurrentPerm(pageKey);
        updatePagePerm(pageKey, {
            ...current,
            btns: Object.fromEntries(page.buttons.map((button) => [button, value])),
        });
    }

    function openAllPagesInGroup(group: string, value: boolean) {
        (pagesByGroup[group] ?? []).forEach((page) => {
            const current = getCurrentPerm(page.key);

            if (current.page !== value) {
                updatePagePerm(page.key, { ...current, page: value });
            }
        });
    }

    function selectRole(role: RolKey) {
        setSelectedRole(role);
        setSelectedUserId("");
        setExpandedRole(role);
        setActiveTab("yetkilendirme");
    }

    const summary = useMemo(() => {
        const openedPages = PAGES.filter((page) => getCurrentPerm(page.key).page).length;

        const activeColumns = PAGES.reduce(
            (total, page) =>
                total +
                page.columns.filter((column) => getCurrentPerm(page.key).cols[column])
                    .length,
            0
        );

        const activeButtons = PAGES.reduce(
            (total, page) =>
                total +
                page.buttons.filter((button) => getCurrentPerm(page.key).btns[button])
                    .length,
            0
        );

        const totalColumns = PAGES.reduce(
            (total, page) => total + page.columns.length,
            0
        );

        const totalButtons = PAGES.reduce(
            (total, page) => total + page.buttons.length,
            0
        );

        return {
            openedPages,
            activeColumns,
            activeButtons,
            totalColumns,
            totalButtons,
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedRole, selectedUserId, rolPerms, userPerms, userRoles]);

    const filteredPages = useMemo(() => {
        const query = pageSearch.trim().toLocaleLowerCase("tr-TR");

        return PAGES.filter((page) => {
            if (groupFilter !== "all" && page.grup !== groupFilter) return false;

            const perm = getCurrentPerm(page.key);

            if (pageFilter === "open" && !perm.page) return false;
            if (pageFilter === "closed" && perm.page) return false;

            if (
                query &&
                !`${page.label} ${page.path} ${page.grup}`
                    .toLocaleLowerCase("tr-TR")
                    .includes(query)
            ) {
                return false;
            }

            return true;
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pageSearch, pageFilter, groupFilter, selectedRole, selectedUserId, rolPerms, userPerms, userRoles]);

    const filteredPagesByGroup = useMemo(() => {
        const map: Record<string, SayfaDef[]> = {};

        filteredPages.forEach((page) => {
            if (!map[page.grup]) map[page.grup] = [];
            map[page.grup].push(page);
        });

        return map;
    }, [filteredPages]);

    return {
        fetchData,
        saveAll,
        getCurrentPerm,
        togglePageAccess,
        toggleColumn,
        toggleButton,
        setAllColumns,
        setAllButtons,
        openAllPagesInGroup,
        selectRole,
        summary,
        filteredPagesByGroup,
    };
}