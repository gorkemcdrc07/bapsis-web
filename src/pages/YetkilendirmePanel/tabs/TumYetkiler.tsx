import type { Dispatch, SetStateAction } from "react";

import type {
    AllUserPerms,
    PanelTab,
    RolKey,
    AllRolPerms,
    SayfaPerm,
} from "../types";

import { PAGES, ROLES } from "../utils/constants";
import { getRoleMeta } from "../utils/helpers";

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
    selectRole: (role: RolKey) => void;
    setActiveTab: Dispatch<SetStateAction<PanelTab>>;
    setExpandedPageKey: Dispatch<SetStateAction<string>>;
}

export default function TumYetkiler({
    summary,
    rolPerms,
    userPerms,
    getCurrentPerm,
    selectRole,
    setActiveTab,
    setExpandedPageKey,
}: TumYetkilerProps) {
    return (
        <div className="ypw-tab-view">
            <div className="ypw-tab-head">
                <div>
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

            <div className="ypw-role-perm-grid">
                {ROLES.map((role) => {
                    const meta = getRoleMeta(role.key);
                    const opened = PAGES.filter(
                        (p) => rolPerms[role.key]?.[p.key]?.page
                    ).length;

                    const cols = PAGES.reduce(
                        (total, page) =>
                            total +
                            page.columns.filter(
                                (column) =>
                                    rolPerms[role.key]?.[page.key]?.cols?.[column]
                            ).length,
                        0
                    );

                    const btns = PAGES.reduce(
                        (total, page) =>
                            total +
                            page.buttons.filter(
                                (button) =>
                                    rolPerms[role.key]?.[page.key]?.btns?.[button]
                            ).length,
                        0
                    );

                    return (
                        <button
                            key={role.key}
                            className="ypw-role-perm-card"
                            onClick={() => selectRole(role.key)}
                            type="button"
                        >
                            <span
                                className="ypw-role-badge"
                                style={{
                                    background: meta.bg,
                                    color: meta.color,
                                    borderColor: meta.border,
                                }}
                            >
                                <i className={`ti ${meta.icon}`} /> {meta.label}
                            </span>

                            <strong>
                                {opened}/{PAGES.length} ekran
                            </strong>

                            <small>
                                {cols} sütun • {btns} buton aktif
                            </small>
                        </button>
                    );
                })}
            </div>

            <div className="ypw-summary-pages">
                <h3>Açık sayfalar</h3>

                <div className="ypw-summary-page-list">
                    {PAGES.filter((p) => getCurrentPerm(p.key).page).map((page) => {
                        const perm = getCurrentPerm(page.key);
                        const cols = page.columns.filter((c) => perm.cols[c]).length;
                        const btns = page.buttons.filter((b) => perm.btns[b]).length;

                        return (
                            <button
                                key={page.key}
                                className="ypw-summary-page-row"
                                type="button"
                                onClick={() => {
                                    setActiveTab("yetkilendirme");
                                    setExpandedPageKey(page.key);
                                }}
                            >
                                <div className="ypw-sprow-info">
                                    <strong>{page.label}</strong>
                                    <code>{page.path}</code>
                                </div>

                                <div className="ypw-sprow-badges">
                                    <em>
                                        <i className="ti ti-columns" />
                                        {cols}/{page.columns.length}
                                    </em>

                                    <em>
                                        <i className="ti ti-click" />
                                        {btns}/{page.buttons.length}
                                    </em>
                                </div>

                                <i className="ti ti-chevron-right ypw-sprow-go" />
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}