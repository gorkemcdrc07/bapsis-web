import type { Dispatch, SetStateAction } from "react";

import type {
    Kullanici,
    RolKey,
    RolMeta,
    SayfaDef,
    SayfaPerm,
    UserRoles,
} from "../../types";

import PageListItem from "./PageListItem";
import PagePreviewPanel from "./PagePreviewPanel";
import SubjectSwitcher from "./SubjectSwitcher";

interface YetkilendirmeTabProps {
    locked: boolean;
    selectedUser: Kullanici | null;
    subjectMeta: RolMeta;
    users: Kullanici[];
    userRoles: UserRoles;
    selectedRole: RolKey;
    selectedUserId: string;
    setSelectedRole: Dispatch<SetStateAction<RolKey>>;
    setSelectedUserId: Dispatch<SetStateAction<string>>;
    pageSearch: string;
    setPageSearch: Dispatch<SetStateAction<string>>;
    groupFilter: string;
    setGroupFilter: Dispatch<SetStateAction<string>>;
    groups: string[];
    pageFilter: "all" | "open" | "closed";
    setPageFilter: Dispatch<SetStateAction<"all" | "open" | "closed">>;
    filteredPagesByGroup: Record<string, SayfaDef[]>;
    expandedPageKey: string;
    setExpandedPageKey: Dispatch<SetStateAction<string>>;
    getCurrentPerm: (pageKey: string) => SayfaPerm;
    togglePageAccess: (pageKey: string) => void;
    toggleColumn: (pageKey: string, column: string) => void;
    toggleButton: (pageKey: string, button: string) => void;
    setAllColumns: (pageKey: string, value: boolean) => void;
    setAllButtons: (pageKey: string, value: boolean) => void;
    openAllPagesInGroup: (group: string, value: boolean) => void;
}

export default function YetkilendirmeTab({
    locked,
    selectedUser,
    subjectMeta,
    users,
    userRoles,
    selectedRole,
    selectedUserId,
    setSelectedRole,
    setSelectedUserId,
    pageSearch,
    setPageSearch,
    groupFilter,
    setGroupFilter,
    groups,
    pageFilter,
    setPageFilter,
    filteredPagesByGroup,
    expandedPageKey,
    setExpandedPageKey,
    getCurrentPerm,
    togglePageAccess,
    toggleColumn,
    toggleButton,
    setAllColumns,
    setAllButtons,
    openAllPagesInGroup,
}: YetkilendirmeTabProps) {
    const allPages = Object.values(filteredPagesByGroup).flat();
    const totalPageCount = allPages.length;

    const selectedPage =
        allPages.find((page) => page.key === expandedPageKey) ?? allPages[0];

    const selectedPerm = selectedPage ? getCurrentPerm(selectedPage.key) : null;

    return (
        <div className="ypw-tab-view ypw-permission-screen">
            <div className="ypw-permission-header">
                <div>
                    <span className="ypw-page-eyebrow">Yetki Yönetimi</span>
                    <h2>Yetkilendirme</h2>
                    <p>
                        Solda kişi/rol seç, ekranı seç; sağdaki önizlemede sütun ve
                        butonlara tıklayarak yetkiyi aç/kapat.
                    </p>
                </div>

                <div className="ypw-permission-subject">
                    <span className="ypw-subject-avatar">
                        {selectedUser ? (
                            selectedUser.name.substring(0, 1).toLocaleUpperCase("tr-TR")
                        ) : (
                            <i className={`ti ${subjectMeta.icon}`} />
                        )}
                    </span>

                    <div>
                        <strong>
                            {selectedUser ? selectedUser.name : `${subjectMeta.label} Rolü`}
                        </strong>
                        <small>{subjectMeta.label}</small>
                    </div>
                </div>
            </div>

            {locked && (
                <div className="ypw-permission-warning">
                    <i className="ti ti-lock" />
                    Admin yetkileri tam yetkilidir ve kapatılamaz.
                </div>
            )}

            <div className="ypw-permission-layout">
                <aside className="ypw-permission-sidebar">
                    <SubjectSwitcher
                        users={users}
                        userRoles={userRoles}
                        selectedRole={selectedRole}
                        selectedUserId={selectedUserId}
                        setSelectedRole={setSelectedRole}
                        setSelectedUserId={setSelectedUserId}
                    />

                    <div className="ypw-filter-card">
                        <strong>Filtreler</strong>

                        <label>
                            <span>Arama</span>
                            <div className="ypw-filter-input">
                                <i className="ti ti-search" />
                                <input
                                    value={pageSearch}
                                    onChange={(e) => setPageSearch(e.target.value)}
                                    placeholder="Sayfa veya yol ara"
                                />
                                {pageSearch && (
                                    <button type="button" onClick={() => setPageSearch("")}>
                                        <i className="ti ti-x" />
                                    </button>
                                )}
                            </div>
                        </label>

                        <label>
                            <span>Grup</span>
                            <select
                                value={groupFilter}
                                onChange={(e) => setGroupFilter(e.target.value)}
                            >
                                <option value="all">Tüm Gruplar</option>
                                {groups.map((group) => (
                                    <option key={group} value={group}>
                                        {group}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label>
                            <span>Durum</span>
                            <div className="ypw-filter-segments">
                                <button
                                    type="button"
                                    className={pageFilter === "all" ? "active" : ""}
                                    onClick={() => setPageFilter("all")}
                                >
                                    Tümü
                                </button>
                                <button
                                    type="button"
                                    className={pageFilter === "open" ? "active" : ""}
                                    onClick={() => setPageFilter("open")}
                                >
                                    Açık
                                </button>
                                <button
                                    type="button"
                                    className={pageFilter === "closed" ? "active" : ""}
                                    onClick={() => setPageFilter("closed")}
                                >
                                    Kapalı
                                </button>
                            </div>
                        </label>

                        <div className="ypw-filter-summary">
                            <b>{totalPageCount}</b>
                            <span>ekran listeleniyor</span>
                        </div>
                    </div>

                    <div className="ypw-permission-master">
                        {Object.entries(filteredPagesByGroup).map(([group, pages]) => (
                            <div key={group} className="ypw-permission-group">
                                <div className="ypw-permission-group-head">
                                    <div>
                                        <strong>{group}</strong>
                                        <span>{pages.length} ekran</span>
                                    </div>

                                    <div>
                                        <button
                                            type="button"
                                            disabled={locked}
                                            onClick={() => openAllPagesInGroup(group, true)}
                                        >
                                            Grubu Aç
                                        </button>
                                        <button
                                            type="button"
                                            disabled={locked}
                                            onClick={() => openAllPagesInGroup(group, false)}
                                        >
                                            Grubu Kapat
                                        </button>
                                    </div>
                                </div>

                                <div className="ypw-permission-page-list">
                                    {pages.map((page) => (
                                        <PageListItem
                                            key={page.key}
                                            page={page}
                                            perm={getCurrentPerm(page.key)}
                                            locked={locked}
                                            selected={page.key === selectedPage?.key}
                                            onSelect={() => setExpandedPageKey(page.key)}
                                            togglePageAccess={togglePageAccess}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </aside>

                <section className="ypw-permission-content">
                    {selectedPage && selectedPerm ? (
                        <PagePreviewPanel
                            page={selectedPage}
                            perm={selectedPerm}
                            locked={locked}
                            togglePageAccess={togglePageAccess}
                            toggleColumn={toggleColumn}
                            toggleButton={toggleButton}
                            setAllColumns={setAllColumns}
                            setAllButtons={setAllButtons}
                        />
                    ) : (
                        <div className="ypw-preview-empty">
                            <i className="ti ti-mouse" />
                            <p>Önizlemek için soldan bir ekran seç.</p>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}