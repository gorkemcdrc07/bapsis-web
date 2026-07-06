import type { SayfaDef, SayfaPerm } from "../../types";

interface PageListItemProps {
    page: SayfaDef;
    perm: SayfaPerm;
    locked: boolean;
    selected: boolean;
    onSelect: () => void;
    togglePageAccess: (pageKey: string) => void;
}

export default function PageListItem({
    page,
    perm,
    locked,
    selected,
    onSelect,
    togglePageAccess,
}: PageListItemProps) {
    const activeColumns = page.columns.filter((column) => perm.cols[column]).length;
    const activeButtons = page.buttons.filter((button) => perm.btns[button]).length;

    return (
        <button
            type="button"
            className={`ypw-page-row ${selected ? "selected" : ""} ${perm.page ? "active" : ""}`}
            onClick={onSelect}
        >
            <span className="ypw-page-row-info">
                <strong>{page.label}</strong>
                <code>{page.path}</code>
            </span>

            <span className="ypw-page-row-counts">
                {activeColumns}/{page.columns.length} · {activeButtons}/{page.buttons.length}
            </span>

            <span
                className={`ypw-access-switch sm ${perm.page ? "on" : ""}`}
                onClick={(e) => {
                    e.stopPropagation();
                    if (!locked) togglePageAccess(page.key);
                }}
                role="switch"
                aria-checked={perm.page}
                aria-label="Sayfa erişimini değiştir"
            >
                <span />
            </span>
        </button>
    );
}