import { useEffect, useMemo, useRef, useState } from "react";
import "./YetkilendirmePanel.css";

import Toast from "./components/Toast";
import KullaniciTab from "./tabs/Kullanici";
import LoglarTab from "./tabs/Loglar";
import AyarlarTab from "./tabs/Ayarlar";
import TumYetkilerTab from "./tabs/TumYetkiler";
import YetkilendirmeTab from "./tabs/Yetkilendirme";
import useUsers from "./hooks/useUsers";
import usePermissions from "./hooks/usePermissions";

import type {
    AllRolPerms,
    AllUserPerms,
    PanelTab,
    RolKey,
    SayfaDef,
    UserRoles,
} from "./types";

import { PAGES, TABS } from "./utils/constants";

import {
    buildDefaultAllRolPerms,
    getRoleMeta,
    initials,
} from "./utils/helpers";

interface YetkilendirmePanelProps {
    onClose?: () => void;
}

export default function YetkilendirmePanel({ onClose }: YetkilendirmePanelProps) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<PanelTab>("kullanicilar");

    const [rolPerms, setRolPerms] = useState<AllRolPerms>(
        buildDefaultAllRolPerms()
    );
    const [userPerms, setUserPerms] = useState<AllUserPerms>({});
    const [userRoles, setUserRoles] = useState<UserRoles>({});

    const [selectedRole, setSelectedRole] = useState<RolKey>("mudur");
    const [expandedRole, setExpandedRole] = useState<RolKey | null>("mudur");
    const [selectedUserId, setSelectedUserId] = useState<string>("");

    const [expandedPageKey, setExpandedPageKey] = useState<string>("bim_planlama");
    const [pageSearch, setPageSearch] = useState("");
    const [pageFilter, setPageFilter] = useState<"all" | "open" | "closed">("all");
    const [groupFilter, setGroupFilter] = useState<string>("all");

    const [toast, setToast] = useState<{
        msg: string;
        type: "success" | "error" | "info";
    }>({
        msg: "",
        type: "info",
    });

    const toastRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    function showToast(
        msg: string,
        type: "success" | "error" | "info" = "info"
    ) {
        setToast({ msg, type });

        if (toastRef.current) clearTimeout(toastRef.current);

        toastRef.current = setTimeout(
            () => setToast({ msg: "", type: "info" }),
            2600
        );
    }

    const {
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
    } = useUsers({
        userRoles,
        setUserRoles,
        userPerms,
        setUserPerms,
        setSelectedUserId,
        setSelectedRole,
        setExpandedRole,
        showToast,
    });

    const groups = useMemo(
        () => Array.from(new Set(PAGES.map((page) => page.grup))),
        []
    );

    const selectedUser = useMemo(
        () => users.find((user) => user.id === selectedUserId) ?? null,
        [users, selectedUserId]
    );

    const subjectRole = selectedUser
        ? userRoles[selectedUser.id] ?? selectedUser.role
        : selectedRole;

    const subjectMeta = getRoleMeta(subjectRole);
    const locked = subjectRole === "admin";

    const pagesByGroup = useMemo(() => {
        const map: Record<string, SayfaDef[]> = {};

        PAGES.forEach((page) => {
            if (!map[page.grup]) map[page.grup] = [];
            map[page.grup].push(page);
        });

        return map;
    }, []);

    const {
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
    } = usePermissions({
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
    });

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
    }, [rolPerms, userPerms, userRoles, users, onClose]);

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function renderActiveTab() {
        if (activeTab === "kullanicilar") {
            return (
                <KullaniciTab
                    userRows={userRows}
                    userForm={userForm}
                    userFormOpen={userFormOpen}
                    userFormMode={userFormMode}
                    editingUserId={editingUserId}
                    selectedUserId={selectedUserId}
                    userSearch={userSearch}
                    userRoleFilter={userRoleFilter}
                    userStatusFilter={userStatusFilter}
                    visiblePasswords={visiblePasswords}
                    saving={saving}
                    deleteConfirmUser={deleteConfirmUser}
                    userRoles={userRoles}
                    setSelectedUserId={setSelectedUserId}
                    setSelectedRole={setSelectedRole}
                    setExpandedRole={setExpandedRole}
                    setUserSearch={setUserSearch}
                    setUserRoleFilter={setUserRoleFilter}
                    setUserStatusFilter={setUserStatusFilter}
                    setVisiblePasswords={setVisiblePasswords}
                    setDeleteConfirmUser={setDeleteConfirmUser}
                    updateUserForm={updateUserForm}
                    submitUserForm={() => submitUserForm(setSaving)}
                    closeUserForm={closeUserForm}
                    openCreateUserForm={openCreateUserForm}
                    openEditUserForm={openEditUserForm}
                    toggleUserLock={(user) => toggleUserLock(user, setSaving)}
                    deleteUser={deleteUser}
                    confirmDeleteUser={() =>
                        confirmDeleteUser(setSaving, selectedUserId)
                    }
                />
            );
        }

        if (activeTab === "yetkilendirme") {
            return (
                <YetkilendirmeTab
                    locked={locked}
                    selectedUser={selectedUser}
                    subjectMeta={subjectMeta}
                    users={users}
                    userRoles={userRoles}
                    selectedRole={selectedRole}
                    selectedUserId={selectedUserId}
                    setSelectedRole={setSelectedRole}
                    setSelectedUserId={setSelectedUserId}
                    pageSearch={pageSearch}                    setPageSearch={setPageSearch}
                    groupFilter={groupFilter}
                    setGroupFilter={setGroupFilter}
                    groups={groups}
                    pageFilter={pageFilter}
                    setPageFilter={setPageFilter}
                    filteredPagesByGroup={filteredPagesByGroup}
                    expandedPageKey={expandedPageKey}
                    setExpandedPageKey={setExpandedPageKey}
                    getCurrentPerm={getCurrentPerm}
                    togglePageAccess={togglePageAccess}
                    toggleColumn={toggleColumn}
                    toggleButton={toggleButton}
                    setAllColumns={setAllColumns}
                    setAllButtons={setAllButtons}
                    openAllPagesInGroup={openAllPagesInGroup}
                />
            );
        }

        if (activeTab === "tumYetkiler") {
            return (
                <TumYetkilerTab
                    summary={summary}
                    rolPerms={rolPerms}
                    userPerms={userPerms}
                    getCurrentPerm={getCurrentPerm}
                    selectRole={selectRole}
                    setActiveTab={setActiveTab}
                    setExpandedPageKey={setExpandedPageKey}
                />
            );
        }

        if (activeTab === "loglar") return <LoglarTab />;

        return <AyarlarTab />;
    }

    return (
        <div className="ypw-backdrop" onMouseDown={onClose}>
            <div className="ypw-shell" onMouseDown={(e) => e.stopPropagation()}>
                <header className="ypw-header">
                    <div className="ypw-brand">
                        <div className="ypw-brand-icon">
                            <i className="ti ti-shield-cog" />
                        </div>

                        <div>
                            <h1>Yetkilendirme Paneli</h1>
                        </div>
                    </div>

                    <div className="ypw-header-right">
                        <div
                            className="ypw-ctx-pill"
                            style={{
                                borderColor: subjectMeta.border,
                                background: subjectMeta.bg,
                                color: subjectMeta.color,
                            }}
                        >
                            <span
                                className="ypw-ctx-avatar"
                                style={{
                                    background: subjectMeta.color,
                                    color: "#fff",
                                }}
                            >
                                {selectedUser ? (
                                    initials(selectedUser.name)
                                ) : (
                                    <i className={`ti ${subjectMeta.icon}`} />
                                )}
                            </span>

                            <span className="ypw-ctx-name">
                                {selectedUser ? selectedUser.name : subjectMeta.label}
                            </span>

                            {locked && (
                                <i
                                    className="ti ti-lock ypw-ctx-lock"
                                    title="Admin yetkileri kilitli"
                                />
                            )}
                        </div>

                        <button
                            className="ypw-btn ghost icon"
                            onClick={fetchData}
                            disabled={loading || saving}
                            title="Yenile"
                            type="button"
                        >
                            <i className="ti ti-refresh" />
                        </button>

                        <button
                            className="ypw-btn primary save"
                            onClick={saveAll}
                            disabled={saving || loading}
                            type="button"
                        >
                            <i
                                className={`ti ${saving
                                        ? "ti-loader-2 ypw-spin"
                                        : "ti-device-floppy"
                                    }`}
                            />
                            {saving ? "Kaydediliyor…" : "Kaydet"}
                        </button>

                        {onClose && (
                            <button
                                className="ypw-btn ghost icon"
                                onClick={onClose}
                                title="Kapat (Esc)"
                                type="button"
                            >
                                <i className="ti ti-x" />
                            </button>
                        )}
                    </div>
                </header>

                <nav className="ypw-tabs">
                    {TABS.map((tab) => (
                        <button
                            key={tab.key}
                            className={`ypw-tab ${activeTab === tab.key ? "active" : ""
                                }`}
                            onClick={() => setActiveTab(tab.key)}
                            type="button"
                        >
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
                            Aktif sekme:{" "}
                            <strong>
                                {TABS.find((tab) => tab.key === activeTab)?.label}
                            </strong>
                        </span>

                        <button
                            className="ypw-btn primary save"
                            onClick={saveAll}
                            disabled={saving}
                            type="button"
                        >
                            <i
                                className={`ti ${saving
                                        ? "ti-loader-2 ypw-spin"
                                        : "ti-device-floppy"
                                    }`}
                            />
                            {saving ? "Kaydediliyor…" : "Tümünü Kaydet"}
                        </button>
                    </footer>
                )}
            </div>

            <Toast msg={toast.msg} type={toast.type} />
        </div>
    );
}
