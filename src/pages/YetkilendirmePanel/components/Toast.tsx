type ToastType = "success" | "error" | "info";

interface ToastProps {
    msg: string;
    type: ToastType;
}

export default function Toast({ msg, type }: ToastProps) {
    if (!msg) return null;

    return (
        <div className={`ypw-toast ${type}`}>
            <i
                className={`ti ${type === "success"
                        ? "ti-circle-check"
                        : type === "error"
                            ? "ti-circle-x"
                            : "ti-info-circle"
                    }`}
            />
            {msg}
        </div>
    );
}