import { useState } from "react";
import type { SayfaDef, SayfaPerm } from "../../types";
import { PERMISSION_LABELS } from "../../utils/constants";

interface PagePreviewPanelProps {
    page: SayfaDef;
    perm: SayfaPerm;
    locked: boolean;
    togglePageAccess: (pageKey: string) => void;
    toggleColumn: (pageKey: string, column: string) => void;
    toggleButton: (pageKey: string, button: string) => void;
    setAllColumns: (pageKey: string, value: boolean) => void;
    setAllButtons: (pageKey: string, value: boolean) => void;
}

const SAMPLE_ROW_COUNT = 5;

function getPermissionLabel(key: string) {
    return PERMISSION_LABELS[key] || key;
}

function sampleValue(column: string, rowIndex: number): string {
    const label = getPermissionLabel(column);
    const c = label.toLocaleLowerCase("tr-TR");

    if (c.includes("tarih")) {
        const days = ["12.04.2025", "13.04.2025", "13.04.2025", "14.04.2025", "15.04.2025"];
        return days[rowIndex % days.length];
    }
    if (c.includes("telefon")) {
        const phones = ["0532 111 22 33", "0533 222 44 55", "0505 333 66 77", "0544 111 88 99", "0552 777 22 11"];
        return phones[rowIndex % phones.length];
    }
    if (c.includes("tc")) return `1234567${890 + rowIndex}`;
    if (c.includes("vkn")) return `98765432${10 + rowIndex}`;
    if (c === "id" || c.endsWith(" id") || c.includes("no") || c.includes("dataloger")) {
        return String(1040 + rowIndex);
    }
    if (c.includes("çekici") || c.includes("dorse")) {
        const plates = ["34 TR 123", "06 AB 456", "35 KL 789", "41 CD 321", "16 MN 654"];
        return plates[rowIndex % plates.length];
    }
    if (c.includes("durum")) {
        const states = ["Aktif", "Beklemede", "Aktif", "Tamamlandı", "Aktif"];
        return states[rowIndex % states.length];
    }
    if (c.includes("%") || c.includes("doluluk")) return `${60 + rowIndex * 8}%`;
    if (c.includes("navlun") || c.includes("fiyat") || c.includes("tutar")) {
        return `${(1250 + rowIndex * 340).toLocaleString("tr-TR")} ₺`;
    }
    if (c.includes("palet")) return String(4 + rowIndex);
    if (c.includes("sürücü") || c.includes("şoför")) {
        const names = ["A. Yılmaz", "M. Kaya", "S. Demir", "E. Şahin", "B. Aydın"];
        return names[rowIndex % names.length];
    }
    if (c.includes("müşteri") || c.includes("firma")) {
        const names = ["Öz Nakliyat", "Bereket Ltd.", "Anadolu Lojistik", "Star Taşımacılık", "Doğuş A.Ş."];
        return names[rowIndex % names.length];
    }
    if (c.includes("araç cinsi")) {
        const types = ["Tır", "Kamyon", "Kırkayak", "Tır", "Kamyon"];
        return types[rowIndex % types.length];
    }
    if (c.includes("yer") || c.includes("varış") || c.includes("depo") || c.includes("rota")) {
        const places = ["İstanbul", "Ankara", "İzmir", "Bursa", "Antalya"];
        return places[rowIndex % places.length];
    }
    return "—";
}

interface PermSectionProps {
    title: string;
    icon: string;
    items: string[];
    values: Record<string, boolean>;
    locked: boolean;
    onToggle: (item: string) => void;
    onAll: (value: boolean) => void;
}

function PermSection({ title, icon, items, values, locked, onToggle, onAll }: PermSectionProps) {
    const activeCount = items.filter((i) => values[i]).length;

    return (
        <div className="ypw-perm-section">
            <div className="ypw-perm-section-head">
                <span>
                    <i className={`ti ${icon}`} />
                    {title}
                    <em>{activeCount}/{items.length}</em>
                </span>

                <div className="ypw-perm-section-actions">
                    <button
                        type="button"
                        className="ypw-perm-section-action"
                        disabled={locked}
                        onClick={() => onAll(true)}
                    >
                        Tümünü Aç
                    </button>
                    <button
                        type="button"
                        className="ypw-perm-section-action"
                        disabled={locked}
                        onClick={() => onAll(false)}
                    >
                        Tümünü Kapat
                    </button>
                </div>
            </div>

            <div className="ypw-perm-chip-grid">
                {items.map((item) => {
                    const on = Boolean(values[item]);
                    return (
                        <label
                            key={item}
                            className={`ypw-perm-chip ${on ? "on" : ""} ${locked ? "disabled" : ""}`}
                        >
                            <input
                                type="checkbox"
                                checked={on}
                                disabled={locked}
                                onChange={() => onToggle(item)}
                            />
                            <i className={`ti ${on ? "ti-square-rounded-check" : "ti-square-rounded"}`} />
                            {getPermissionLabel(item)}
                        </label>
                    );
                })}
            </div>
        </div>
    );
}

export default function PagePreviewPanel({
    page,
    perm,
    locked,
    togglePageAccess,
    toggleColumn,
    toggleButton,
    setAllColumns,
    setAllButtons,
}: PagePreviewPanelProps) {
    const [previewOpen, setPreviewOpen] = useState(false);

    const activeColumns = page.columns.filter((column) => perm.cols[column]).length;
    const activeButtons = page.buttons.filter((button) => perm.btns[button]).length;

    return (
        <div className="ypw-preview-panel">
            <div className="ypw-preview-head">
                <div>
                    <strong>{page.label}</strong>
                    <code>{page.path}</code>
                </div>

                <div className="ypw-preview-head-right">
                    <span className="ypw-preview-head-counts">
                        {activeColumns}/{page.columns.length} sütun · {activeButtons}/{page.buttons.length} buton
                    </span>

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
            </div>

            {!perm.page && (
                <div className="ypw-preview-disabled-hint">
                    <i className="ti ti-eye-off" />
                    Bu sayfa şu an kapalı. Aşağıdaki seçimler sayfa açılınca geçerli olur.
                </div>
            )}

            <PermSection
                title="İşlem Butonları"
                icon="ti-click"
                items={page.buttons}
                values={perm.btns}
                locked={locked}
                onToggle={(button) => toggleButton(page.key, button)}
                onAll={(value) => setAllButtons(page.key, value)}
            />

            <PermSection
                title="Görünür Sütunlar"
                icon="ti-columns"
                items={page.columns}
                values={perm.cols}
                locked={locked}
                onToggle={(column) => toggleColumn(page.key, column)}
                onAll={(value) => setAllColumns(page.key, value)}
            />

            <div className="ypw-preview-collapse">
                <button
                    type="button"
                    className="ypw-preview-collapse-head"
                    onClick={() => setPreviewOpen((open) => !open)}
                >
                    <span>
                        <i className="ti ti-table" />
                        Canlı Önizleme
                        <small>Kullanıcının gerçek ekranda göreceği hal</small>
                    </span>
                    <i className={`ti ti-chevron-down ypw-preview-collapse-chevron ${previewOpen ? "open" : ""}`} />
                </button>

                {previewOpen && (
                    <div className="ypw-real-table-wrap">
                        <div className="ypw-real-table-scroll">
                            <table className="ypw-real-table">
                                <thead>
                                    <tr>
                                        <th className="ypw-real-th-check">
                                            <span className="ypw-real-checkbox" />
                                        </th>
                                        {page.columns.map((column) => {
                                            const on = Boolean(perm.cols[column]);
                                            return (
                                                <th key={column}>
                                                    <span className={`ypw-real-th-static ${on ? "on" : "off"}`}>
                                                        {getPermissionLabel(column)}
                                                        <i className={`ti ${on ? "ti-eye" : "ti-eye-off"}`} />
                                                    </span>
                                                </th>
                                            );
                                        })}
                                    </tr>
                                </thead>
                                <tbody>
                                    {Array.from({ length: SAMPLE_ROW_COUNT }).map((_, rowIndex) => (
                                        <tr key={rowIndex}>
                                            <td className="ypw-real-th-check">
                                                <span className="ypw-real-checkbox" />
                                            </td>
                                            {page.columns.map((column) => {
                                                const on = Boolean(perm.cols[column]);
                                                return (
                                                    <td key={column} className={on ? "" : "ypw-real-td-hidden"}>
                                                        {on ? sampleValue(column, rowIndex) : "•••"}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}