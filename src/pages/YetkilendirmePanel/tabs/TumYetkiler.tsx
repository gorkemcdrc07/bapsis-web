import { useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";

import type {
    AllRolPerms,
    AllUserPerms,
    Kullanici,
    RolKey,
    RolMeta,
    SayfaDef,
    SayfaPerm,
    UserRoles,
} from "../types";

import { PAGES, ROLES, PERMISSION_LABELS } from "../utils/constants";
import { getRoleMeta } from "../utils/helpers";
import SubjectSwitcher from "./Yetkilendirme/SubjectSwitcher";

interface Summary {
    openedPages: number;
    activeColumns: number;
    activeButtons: number;
    totalColumns: number;
    totalButtons: number;
}

interface TumYetkilerProps {
    summary: Summary;
    rolPerms: AllRolPerms;
    userPerms: AllUserPerms;
    getCurrentPerm: (pageKey: string) => SayfaPerm;
    users: Kullanici[];
    userRoles: UserRoles;
    selectedRole: RolKey;
    selectedUserId: string;
    setSelectedRole: Dispatch<SetStateAction<RolKey>>;
    setSelectedUserId: Dispatch<SetStateAction<string>>;
    selectedUser: Kullanici | null;
    subjectMeta: RolMeta;
}

function getPermissionLabel(key: string) {
    return PERMISSION_LABELS[key] || key;
}

export default function TumYetkiler({
    summary,
    rolPerms,
    userPerms,
    getCurrentPerm,
    users,
    userRoles,
    selectedRole,
    selectedUserId,
    setSelectedRole,
    setSelectedUserId,
    selectedUser,
    subjectMeta,
}: TumYetkilerProps) {
    const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
    const [groupFilter, setGroupFilter] = useState<string>("all");

    const totalPossible = summary.totalColumns + summary.totalButtons;

    const pagesByGroup = useMemo(() => {
        const map: Record<string, SayfaDef[]> = {};
        PAGES.forEach((page) => {
            if (!map[page.grup]) map[page.grup] = [];
            map[page.grup].push(page);
        });
        return map;
    }, []);

    const groups = Object.keys(pagesByGroup);
    const visibleGroups = groupFilter === "all" ? groups : groups.filter((g) => g === groupFilter);

    function pickRole(role: RolKey) {
        setSelectedUserId("");
        setSelectedRole(role);
    }

    function toggleExpand(pageKey: string) {
        setExpandedKeys((prev) => {
            const next = new Set(prev);
            if (next.has(pageKey)) next.delete(pageKey);
            else next.add(pageKey);
            return next;
        });
    }

    return (
        <div className="ypw-tab-view">
            <div className="ypw-tab-head">
                <div>
                    <span className="ypw-page-eyebrow">Genel Bakış</span>
                    <h2>Tüm Yetkiler</h2>
                </div>
            </div>

            <div className="ypw-summary-stats">
                <div className="ypw-stat-card">
                    <i className="ti ti-layout-dashboard" />
                    <strong>{summary.openedPages}</strong>
                    <span>Açık sayfa</span>
                    <small>/ {PAGES.length} toplam</small>
                </div>
                <div className="ypw-stat-card">
                    <i className="ti ti-columns" />
                    <strong>{summary.activeColumns}</strong>
                    <span>Aktif sütun</span>
                    <small>/ {summary.totalColumns} toplam</small>
                </div>
                <div className="ypw-stat-card">
                    <i className="ti ti-click" />
                    <strong>{summary.activeButtons}</strong>
                    <span>Aktif buton</span>
                    <small>/ {summary.totalButtons} toplam</small>
                </div>
                <div className="ypw-stat-card">
                    <i className="ti ti-user-cog" />
                    <strong>{Object.values(userPerms).filter(Boolean).length}</strong>
                    <span>Özel yetkili</span>
                    <small>kullanıcı</small>
                </div>
            </div>

            <h3 className="ypw-section-title">Role Göre Yetki Dağılımı</h3>

            <div className="ypw-role-perm-grid">
                {ROLES.map((role) => {
                    const meta = getRoleMeta(role.key);
                    const opened = PAGES.filter((p) => rolPerms[role.key]?.[p.key]?.page).length;

                    const cols = PAGES.reduce(
                        (total, page) =>
                            total + page.columns.filter((c) => rolPerms[role.key]?.[page.key]?.cols?.[c]).length,
                        0
                    );
                    const btns = PAGES.reduce(
                        (total, page) =>
                            total + page.buttons.filter((b) => rolPerms[role.key]?.[page.key]?.btns?.[b]).length,
                        0
                    );

                    const percent = totalPossible ? Math.round(((cols + btns) / totalPossible) * 100) : 0;
                    const active = !selectedUserId && selectedRole === role.key;

                    return (
                        <button
                            key={role.key}
                            className={`ypw-role-perm-card ${active ? "selected" : ""}`}
                            onClick={() => pickRole(role.key)}
                            type="button"
                        >
                            <div className="ypw-role-perm-card-head">
                                <span className="ypw-role-badge">
                                    <i className={`ti ${meta.icon}`} /> {meta.label}
                                </span>
                                {active && <i className="ti ti-circle-check ypw-role-perm-card-active" />}
                            </div>

                            <strong>{opened}/{PAGES.length} ekran</strong>

                            <div className="ypw-role-perm-bar">
                                <div className="ypw-role-perm-bar-fill" style={{ width: `${percent}%` }} />
                            </div>

                            <small>{cols} sütun • {btns} buton aktif · %{percent}</small>
                        </button>
                    );
                })}
            </div>

            <div className="ypw-audit-section">
                <div className="ypw-audit-head">
                    <span className="ypw-page-eyebrow">Detaylı İnceleme</span>
                    <h3>Ekran Bazlı Yetkiler</h3>
                    <p>Bir rol veya kullanıcı seç, her ekranda neyin açık olduğunu burada gör — hiçbir yere yönlendirmez.</p>
                </div>

                <div className="ypw-audit-layout">
                    <SubjectSwitcher
                        users={users}
                        userRoles={userRoles}
                        selectedRole={selectedRole}
                        selectedUserId={selectedUserId}
                        setSelectedRole={setSelectedRole}
                        setSelectedUserId={setSelectedUserId}
                    />

                    <div className="ypw-audit-content">
                        <div className="ypw-audit-subject-bar">
                            <span className="ypw-subject-avatar">
                                {selectedUser ? (
                                    selectedUser.name.substring(0, 1).toLocaleUpperCase("tr-TR")
                                ) : (
                                    <i className={`ti ${subjectMeta.icon}`} />
                                )}
                            </span>

                            <div className="ypw-audit-subject-info">
                                <strong>{selectedUser ? selectedUser.name : `${subjectMeta.label} Rolü`}</strong>
                                <small>{subjectMeta.label} yetkileri gösteriliyor</small>
                            </div>

                            <select
                                className="ypw-audit-group-filter"
                                value={groupFilter}
                                onChange={(e) => setGroupFilter(e.target.value)}
                            >
                                <option value="all">Tüm Gruplar</option>
                                {groups.map((g) => (
                                    <option key={g} value={g}>{g}</option>
                                ))}
                            </select>
                        </div>

                        <div className="ypw-audit-list">
                            {visibleGroups.map((group) => (
                                <div key={group} className="ypw-audit-group">
                                    <div className="ypw-audit-group-head">
                                        <strong>{group}</strong>
                                        <span>{pagesByGroup[group].length} ekran</span>
                                    </div>

                                    {pagesByGroup[group].map((page) => {
                                        const perm = getCurrentPerm(page.key);
                                        const activeCols = page.columns.filter((c) => perm.cols[c]).length;
                                        const activeBtns = page.buttons.filter((b) => perm.btns[b]).length;
                                        const expanded = expandedKeys.has(page.key);

                                        return (
                                            <div key={page.key} className={`ypw-audit-row ${perm.page ? "open" : "closed"}`}>
                                                <button
                                                    type="button"
                                                    className="ypw-audit-row-head"
                                                    onClick={() => toggleExpand(page.key)}
                                                >
                                                    <span className={`ypw-dot ${perm.page ? "active" : "locked"}`} />

                                                    <span className="ypw-audit-row-info">
                                                        <strong>{page.label}</strong>
                                                        <code>{page.path}</code>
                                                    </span>

                                                    <span className="ypw-audit-row-counts">
                                                        {activeCols}/{page.columns.length} sütun · {activeBtns}/{page.buttons.length} buton
                                                    </span>

                                                    <i className={`ti ti-chevron-down ypw-audit-chevron ${expanded ? "open" : ""}`} />
                                                </button>

                                                {expanded && (
                                                    <div className="ypw-audit-row-body">
                                                        {!perm.page && (
                                                            <div className="ypw-preview-disabled-hint">
                                                                <i className="ti ti-eye-off" />
                                                                Bu ekran kapalı — aşağıdaki seçimler pasif durumda.
                                                            </div>
                                                        )}

                                                        <div className="ypw-audit-chip-block">
                                                            <span className="ypw-audit-chip-block-title">
                                                                <i className="ti ti-click" /> İşlem Butonları
                                                            </span>
                                                            <div className="ypw-perm-chip-grid">
                                                                {page.buttons.map((b) => (
                                                                    <span
                                                                        key={b}
                                                                        className={`ypw-perm-chip static ${perm.btns[b] ? "on" : ""}`}
                                                                    >
                                                                        <i className={`ti ${perm.btns[b] ? "ti-square-rounded-check" : "ti-square-rounded"}`} />
                                                                        {getPermissionLabel(b)}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        <div className="ypw-audit-chip-block">
                                                            <span className="ypw-audit-chip-block-title">
                                                                <i className="ti ti-columns" /> Görünür Sütunlar
                                                            </span>
                                                            <div className="ypw-perm-chip-grid">
                                                                {page.columns.map((c) => (
                                                                    <span
                                                                        key={c}
                                                                        className={`ypw-perm-chip static ${perm.cols[c] ? "on" : ""}`}
                                                                    >
                                                                        <i className={`ti ${perm.cols[c] ? "ti-square-rounded-check" : "ti-square-rounded"}`} />
                                                                        {getPermissionLabel(c)}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}