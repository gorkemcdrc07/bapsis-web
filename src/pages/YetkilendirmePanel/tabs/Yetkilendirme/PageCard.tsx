import type { Dispatch, SetStateAction } from "react";
import type { SayfaDef, SayfaPerm } from "../../types";
import PermissionBlock from "./PermissionBlock";

interface PageCardProps {
    page: SayfaDef;
    perm: SayfaPerm;
    locked: boolean;
    expandedPageKey: string;
    setExpandedPageKey: Dispatch<SetStateAction<string>>;
    togglePageAccess: (pageKey: string) => void;
    toggleColumn: (pageKey: string, column: string) => void;
    toggleButton: (pageKey: string, button: string) => void;
    setAllColumns: (pageKey: string, value: boolean) => void;
    setAllButtons: (pageKey: string, value: boolean) => void;
}

export default function PageCard({
    page,
    perm,
    locked,
    expandedPageKey,
    setExpandedPageKey,
    togglePageAccess,
    toggleColumn,
    toggleButton,
    setAllColumns,
    setAllButtons,
}: PageCardProps) {
    const isExpanded = expandedPageKey === page.key;
    const activeColumns = page.columns.filter((column) => perm.cols[column]).length;
    const activeButtons = page.buttons.filter((button) => perm.btns[button]).length;

    return (
        <article className={`ypw-permission-card ${perm.page ? "active" : ""}`}>
            <div className="ypw-permission-card-main">
                <button
                    type="button"
                    className="ypw-card-open"
                    onClick={() => setExpandedPageKey(isExpanded ? "" : page.key)}
                >
                    <i className={`ti ti-chevron-right ${isExpanded ? "open" : ""}`} />
                </button>
                <div className="ypw-card-info">
                    <strong>{page.label}</strong>
                    <code>{page.path}</code>
                </div>
                <div className="ypw-card-counts">
                    <span>{activeColumns}/{page.columns.length} sütun</span>
                    <span>{activeButtons}/{page.buttons.length} buton</span>
                </div>
                <button
                    type="button"
                    className={`ypw-access-switch ${perm.page ? "on" : ""}`}
                    disabled={locked}
                    onClick={() => togglePageAccess(page.key)}
                    aria-label="Sayfa erişimini değiştir"
                >
                    <span />
                </button>
            </div>
            {isExpanded && (
                <div className="ypw-card-permissions">
                    <PermissionBlock
                        title="Sütunlar"
                        icon="ti-columns"
                        count={page.columns.length}
                        items={page.columns}
                        values={perm.cols}
                        locked={locked}
                        onToggle={(column) => toggleColumn(page.key, column)}
                        onAll={(value) => setAllColumns(page.key, value)}
                    />
                    <PermissionBlock
                        title="Butonlar"
                        icon="ti-click"
                        count={page.buttons.length}
                        items={page.buttons}
                        values={perm.btns}
                        locked={locked}
                        onToggle={(button) => toggleButton(page.key, button)}
                        onAll={(value) => setAllButtons(page.key, value)}
                        chipClassName="btn-chip"
                    />
                </div>
            )}
        </article>
    );
}