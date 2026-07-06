import type { Dispatch, SetStateAction } from "react";

import SvgIcon from "../components/SvgIcon";

import type {
    Kullanici,
    RolKey,
    UserFormMode,
    UserFormState,
    UserRoles,
} from "../types";

import { ROLES } from "../utils/constants";

import {
    getRoleMeta,
    initials,
    maskedPassword,
} from "../utils/helpers";

interface KullaniciProps {
    userRows: Kullanici[];
    userForm: UserFormState;
    userFormOpen: boolean;
    userFormMode: UserFormMode;
    editingUserId: string;
    selectedUserId: string;
    userSearch: string;
    userRoleFilter: "all" | RolKey;
    userStatusFilter: "all" | "active" | "locked";
    visiblePasswords: Record<string, boolean>;
    saving: boolean;
    deleteConfirmUser: Kullanici | null;
    userRoles: UserRoles;

    setSelectedUserId: Dispatch<SetStateAction<string>>;
    setSelectedRole: Dispatch<SetStateAction<RolKey>>;
    setExpandedRole: Dispatch<SetStateAction<RolKey | null>>;
    setUserSearch: Dispatch<SetStateAction<string>>;
    setUserRoleFilter: Dispatch<SetStateAction<"all" | RolKey>>;
    setUserStatusFilter: Dispatch<SetStateAction<"all" | "active" | "locked">>;
    setVisiblePasswords: Dispatch<SetStateAction<Record<string, boolean>>>;
    setDeleteConfirmUser: Dispatch<SetStateAction<Kullanici | null>>;

    updateUserForm: <K extends keyof UserFormState>(
        key: K,
        value: UserFormState[K]
    ) => void;

    submitUserForm: () => void;
    closeUserForm: () => void;
    openCreateUserForm: () => void;
    openEditUserForm: (user: Kullanici) => void;
    toggleUserLock: (user: Kullanici) => void;
    deleteUser: (user: Kullanici) => void;
    confirmDeleteUser: () => void;
}

export default function Kullanici({
    userRows,
    userForm,
    userFormOpen,
    userFormMode,
    editingUserId,
    selectedUserId,
    userSearch,
    userRoleFilter,
    userStatusFilter,
    visiblePasswords,
    saving,
    deleteConfirmUser,
    userRoles,
    setSelectedUserId,
    setSelectedRole,
    setExpandedRole,
    setUserSearch,
    setUserRoleFilter,
    setUserStatusFilter,
    setVisiblePasswords,
    setDeleteConfirmUser,
    updateUserForm,
    submitUserForm,
    closeUserForm,
    openCreateUserForm,
    openEditUserForm,
    toggleUserLock,
    deleteUser,
    confirmDeleteUser,
}: KullaniciProps) {
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
                    <select
                        value={userForm.role}
                        onChange={(e) =>
                            updateUserForm("role", e.target.value as RolKey)
                        }
                    >
                        {ROLES.map((r) => (
                            <option key={r.key} value={r.key}>
                                {r.label}
                            </option>
                        ))}
                    </select>
                </label>
            </td>

            <td>
                <label className="ypw-inline-field">
                    <span>Durum</span>
                    <select
                        value={userForm.aktif ? "true" : "false"}
                        onChange={(e) =>
                            updateUserForm("aktif", e.target.value === "true")
                        }
                    >
                        <option value="true">Aktif</option>
                        <option value="false">Kilitli</option>
                    </select>
                </label>
            </td>

            <td className="right">
                <div
                    className="ypw-row-actions inline-edit-actions"
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        className="ypw-action-btn save"
                        type="button"
                        title={mode === "create" ? "Kullanıcı Ekle" : "Güncelle"}
                        onClick={submitUserForm}
                        disabled={saving}
                    >
                        <SvgIcon name="save" />
                    </button>

                    <button
                        className="ypw-action-btn cancel"
                        type="button"
                        title="Vazgeç"
                        onClick={closeUserForm}
                        disabled={saving}
                    >
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

                        <input
                            value={userSearch}
                            onChange={(e) => setUserSearch(e.target.value)}
                            placeholder="Ara..."
                        />

                        {userSearch && (
                            <button
                                className="ypw-clear-x"
                                onClick={() => setUserSearch("")}
                                type="button"
                                aria-label="Aramayı temizle"
                            >
                                <SvgIcon name="x" />
                            </button>
                        )}
                    </label>

                    <div className="ypw-users-filters">
                        <select
                            value={userRoleFilter}
                            onChange={(e) =>
                                setUserRoleFilter(e.target.value as "all" | RolKey)
                            }
                        >
                            <option value="all">Tüm Roller</option>
                            {ROLES.map((role) => (
                                <option key={role.key} value={role.key}>
                                    {role.label}
                                </option>
                            ))}
                        </select>

                        <select
                            value={userStatusFilter}
                            onChange={(e) =>
                                setUserStatusFilter(
                                    e.target.value as "all" | "active" | "locked"
                                )
                            }
                        >
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
                                <tr
                                    className="ypw-inline-edit-row ypw-new-row"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {renderUserFormCells("create")}
                                </tr>
                            )}

                            {userRows.map((user) => {
                                const role = userRoles[user.id] ?? user.role;
                                const meta = getRoleMeta(role);
                                const active = selectedUserId === user.id;
                                const passwordVisible = Boolean(
                                    visiblePasswords[user.id]
                                );
                                const isEditing =
                                    userFormOpen &&
                                    userFormMode === "edit" &&
                                    editingUserId === user.id;

                                if (isEditing) {
                                    return (
                                        <tr
                                            key={user.id}
                                            className="ypw-inline-edit-row"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            {renderUserFormCells("edit")}
                                        </tr>
                                    );
                                }

                                return (
                                    <tr
                                        key={user.id}
                                        className={`${active ? "selected" : ""} ${!user.aktif ? "locked" : ""
                                            }`}
                                        onClick={() => {
                                            setSelectedUserId(user.id);
                                            setSelectedRole(role);
                                            setExpandedRole(role);
                                        }}
                                    >
                                        <td>
                                            <div className="ypw-user-cell">
                                                <span
                                                    className="ypw-uitem-av colorful"
                                                    style={{
                                                        background: meta.bg,
                                                        color: meta.color,
                                                        border: `1px solid ${meta.border}`,
                                                    }}
                                                >
                                                    {initials(user.name)}
                                                </span>

                                                <div>
                                                    <strong>{user.name}</strong>
                                                    <small>
                                                        <span
                                                            className={
                                                                user.aktif
                                                                    ? "ypw-dot active"
                                                                    : "ypw-dot locked"
                                                            }
                                                        />{" "}
                                                        {user.aktif
                                                            ? "Aktif kullanıcı"
                                                            : "Kilitli kullanıcı"}
                                                    </small>
                                                </div>
                                            </div>
                                        </td>

                                        <td>{user.email || "-"}</td>

                                        <td>
                                            <div
                                                className="ypw-pass-wrap"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <code className="ypw-pass-code">
                                                    {passwordVisible
                                                        ? user.password || "-"
                                                        : maskedPassword(user.password)}
                                                </code>

                                                <button
                                                    className="ypw-pass-eye"
                                                    type="button"
                                                    aria-label={
                                                        passwordVisible
                                                            ? "Şifreyi gizle"
                                                            : "Şifreyi göster"
                                                    }
                                                    title={
                                                        passwordVisible
                                                            ? "Şifreyi gizle"
                                                            : "Şifreyi göster"
                                                    }
                                                    onClick={() =>
                                                        setVisiblePasswords((prev) => ({
                                                            ...prev,
                                                            [user.id]: !prev[user.id],
                                                        }))
                                                    }
                                                >
                                                    <SvgIcon
                                                        name={
                                                            passwordVisible
                                                                ? "eyeOff"
                                                                : "eye"
                                                        }
                                                    />
                                                </button>
                                            </div>
                                        </td>

                                        <td>
                                            <span
                                                className={`ypw-role-pill role-${role}`}
                                            >
                                                {meta.label}
                                            </span>
                                        </td>

                                        <td>
                                            <span
                                                className={`ypw-status-pill ${user.aktif ? "active" : "locked"
                                                    }`}
                                            >
                                                {user.aktif ? "Aktif" : "Kilitli"}
                                            </span>
                                        </td>

                                        <td className="right">
                                            <div
                                                className="ypw-row-actions icon-only"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <button
                                                    className="ypw-action-btn edit"
                                                    type="button"
                                                    aria-label="Düzenle"
                                                    title="Satır üzerinde düzenle"
                                                    onClick={() =>
                                                        openEditUserForm(user)
                                                    }
                                                >
                                                    <SvgIcon name="edit" />
                                                </button>

                                                <button
                                                    className="ypw-action-btn lock"
                                                    type="button"
                                                    aria-label={
                                                        user.aktif
                                                            ? "Kilitle"
                                                            : "Kilidi Aç"
                                                    }
                                                    title={
                                                        user.aktif
                                                            ? "Kilitle"
                                                            : "Kilidi Aç"
                                                    }
                                                    onClick={() =>
                                                        toggleUserLock(user)
                                                    }
                                                >
                                                    <SvgIcon
                                                        name={
                                                            user.aktif
                                                                ? "lock"
                                                                : "unlock"
                                                        }
                                                    />
                                                </button>

                                                <button
                                                    className="ypw-action-btn danger"
                                                    type="button"
                                                    aria-label="Sil"
                                                    title="Sil"
                                                    onClick={() => deleteUser(user)}
                                                >
                                                    <SvgIcon name="trash" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}

                            {userRows.length === 0 &&
                                !(userFormOpen && userFormMode === "create") && (
                                    <tr>
                                        <td colSpan={6}>
                                            <div className="ypw-user-empty">
                                                Kullanıcı bulunamadı.
                                            </div>
                                        </td>
                                    </tr>
                                )}
                        </tbody>
                    </table>
                </div>
            </div>

            {deleteConfirmUser && (
                <div
                    className="ypw-delete-modal-backdrop"
                    onClick={() => !saving && setDeleteConfirmUser(null)}
                >
                    <div
                        className="ypw-delete-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="ypw-delete-icon">
                            <SvgIcon name="trash" />
                        </div>

                        <div className="ypw-delete-content">
                            <strong>Kullanıcı silinsin mi?</strong>

                            <p>
                                <b>{deleteConfirmUser.name}</b> kullanıcısını silmek
                                üzeresiniz. Bu işlem geri alınamaz.
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