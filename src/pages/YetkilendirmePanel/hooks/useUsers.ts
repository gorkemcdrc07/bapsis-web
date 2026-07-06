import { useMemo, useState } from "react";

import type {
    AllUserPerms,
    Kullanici,
    RolKey,
    UserFormMode,
    UserFormState,
    UserRoles,
} from "../types";

import { EMPTY_USER_FORM } from "../utils/constants";

import {
    mergeWithPageDefinitions,
    normalizeUser,
} from "../utils/helpers";

import {
    createUser,
    deleteUserById,
    updateUser,
    updateUserStatus,
} from "../services/userService";

interface UseUsersProps {
    userRoles: UserRoles;
    setUserRoles: React.Dispatch<React.SetStateAction<UserRoles>>;
    userPerms: AllUserPerms;
    setUserPerms: React.Dispatch<React.SetStateAction<AllUserPerms>>;
    setSelectedUserId: React.Dispatch<React.SetStateAction<string>>;
    setSelectedRole: React.Dispatch<React.SetStateAction<RolKey>>;
    setExpandedRole: React.Dispatch<React.SetStateAction<RolKey | null>>;
    showToast: (msg: string, type?: "success" | "error" | "info") => void;
}

export default function useUsers({
    userRoles,
    setUserRoles,
    userPerms,
    setUserPerms,
    setSelectedUserId,
    setSelectedRole,
    setExpandedRole,
    showToast,
}: UseUsersProps) {
    const [users, setUsers] = useState<Kullanici[]>([]);
    const [userSearch, setUserSearch] = useState("");
    const [userRoleFilter, setUserRoleFilter] = useState<"all" | RolKey>("all");
    const [userStatusFilter, setUserStatusFilter] =
        useState<"all" | "active" | "locked">("all");

    const [visiblePasswords, setVisiblePasswords] =
        useState<Record<string, boolean>>({});

    const [userFormOpen, setUserFormOpen] = useState(false);
    const [userFormMode, setUserFormMode] = useState<UserFormMode>("create");
    const [editingUserId, setEditingUserId] = useState("");
    const [userForm, setUserForm] = useState<UserFormState>(EMPTY_USER_FORM);
    const [deleteConfirmUser, setDeleteConfirmUser] =
        useState<Kullanici | null>(null);

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

    function updateUserForm<K extends keyof UserFormState>(
        key: K,
        value: UserFormState[K]
    ) {
        setUserForm((prev) => ({
            ...prev,
            [key]: value,
        }));
    }

    async function submitUserForm(setSaving: (value: boolean) => void) {
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

        const result =
            userFormMode === "create"
                ? await createUser(payload)
                : await updateUser(userForm.id, payload);

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

        setUsers((prev) =>
            userFormMode === "create"
                ? [normalized, ...prev]
                : prev.map((u) => (u.id === normalized.id ? normalized : u))
        );

        setUserRoles((prev) => ({
            ...prev,
            [normalized.id]: normalized.role,
        }));

        setUserPerms((prev) => ({
            ...prev,
            [normalized.id]: normalized.override
                ? mergeWithPageDefinitions(normalized.override, normalized.role)
                : null,
        }));

        setSelectedUserId(normalized.id);
        setSelectedRole(normalized.role);
        setExpandedRole(normalized.role);

        closeUserForm();

        showToast(
            userFormMode === "create"
                ? "Yeni kullanıcı eklendi."
                : "Kullanıcı güncellendi.",
            "success"
        );

        setSaving(false);
    }

    async function toggleUserLock(
        user: Kullanici,
        setSaving: (value: boolean) => void
    ) {
        setSaving(true);

        const nextAktif = !user.aktif;
        const { error } = await updateUserStatus(user.id, nextAktif);

        if (error) {
            console.error(error);
            alert(JSON.stringify(error, null, 2));

            showToast("Kullanıcı durumu değiştirilemedi.", "error");
            setSaving(false);
            return;
        }

        setUsers((prev) =>
            prev.map((u) =>
                u.id === user.id
                    ? {
                        ...u,
                        aktif: nextAktif,
                    }
                    : u
            )
        );

        showToast(
            nextAktif
                ? "Kullanıcı kilidi kaldırıldı."
                : "Kullanıcı kilitlendi.",
            "success"
        );

        setSaving(false);
    }

    function deleteUser(user: Kullanici) {
        setDeleteConfirmUser(user);
    }

    async function confirmDeleteUser(
        setSaving: (value: boolean) => void,
        selectedUserId: string
    ) {
        if (!deleteConfirmUser) return;

        setSaving(true);

        const user = deleteConfirmUser;
        const { error } = await deleteUserById(user.id);

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

        if (selectedUserId === user.id) {
            setSelectedUserId("");
        }

        setDeleteConfirmUser(null);
        showToast("Kullanıcı silindi.", "success");

        setSaving(false);
    }

    return {
        users,
        setUsers,

        userRows,
        userSearch,
        setUserSearch,

        userRoleFilter,
        setUserRoleFilter,

        userStatusFilter,
        setUserStatusFilter,

        visiblePasswords,
        setVisiblePasswords,

        userFormOpen,
        userFormMode,
        editingUserId,
        userForm,
        deleteConfirmUser,
        setDeleteConfirmUser,

        openCreateUserForm,
        openEditUserForm,
        closeUserForm,
        updateUserForm,
        submitUserForm,
        toggleUserLock,
        deleteUser,
        confirmDeleteUser,
    };
}