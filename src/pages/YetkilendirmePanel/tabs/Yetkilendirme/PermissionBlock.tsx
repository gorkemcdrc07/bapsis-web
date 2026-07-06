interface PermissionBlockProps {
    title: string;
    icon: string;
    count: number;
    items: string[];
    values: Record<string, boolean>;
    locked: boolean;
    onToggle: (item: string) => void;
    onAll: (value: boolean) => void;
    chipClassName?: string;
}

export default function PermissionBlock({
    title,
    icon,
    count,
    items,
    values,
    locked,
    onToggle,
    onAll,
    chipClassName = "",
}: PermissionBlockProps) {
    return (
        <div className="ypw-perm-block">
            <div className="ypw-perm-block-head">
                <span>
                    <i className={`ti ${icon}`} /> {title} • {count} adet
                </span>
                <div>
                    <button
                        className="ypw-btn success-soft sm"
                        disabled={locked}
                        onClick={() => onAll(true)}
                        type="button"
                    >
                        <i className="ti ti-checks" />
                        Tümü
                    </button>
                    <button
                        className="ypw-btn danger-soft sm"
                        disabled={locked}
                        onClick={() => onAll(false)}
                        type="button"
                    >
                        <i className="ti ti-ban" />
                        Hiçbiri
                    </button>
                </div>
            </div>
            <div className="ypw-chip-grid">
                {items.map((item) => {
                    const on = Boolean(values[item]);
                    return (
                        <label
                            key={item}
                            className={`ypw-chip ${chipClassName} ${on ? "on" : ""} ${locked ? "disabled" : ""
                                }`}
                        >
                            <input
                                type="checkbox"
                                checked={on}
                                disabled={locked}
                                onChange={() => onToggle(item)}
                            />
                            <i
                                className={`ti ${on ? "ti-square-rounded-check" : "ti-square-rounded"
                                    }`}
                            />
                            {item}
                        </label>
                    );
                })}
            </div>
        </div>
    );
}