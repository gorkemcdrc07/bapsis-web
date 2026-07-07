import { Component, type ErrorInfo, type ReactNode } from "react";
import { logKaydet } from "../lib/logger";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false };

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        logKaydet({
            seviye: "kritik",
            kategori: "Sistem",
            mesaj: error.message || "Ekran render edilirken hata oluştu",
            detay: `${error.stack}\n\nComponent Stack:${info.componentStack}`,
        });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 12,
                        padding: 48,
                        textAlign: "center",
                        color: "#51607a",
                    }}
                >
                    <strong style={{ color: "#0b1220", fontSize: 16 }}>
                        Bir şeyler ters gitti
                    </strong>
                    <span style={{ fontSize: 13 }}>
                        Hata otomatik olarak kaydedildi. Sayfayı yenileyip tekrar deneyin.
                    </span>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            height: 38,
                            padding: "0 16px",
                            borderRadius: 10,
                            border: 0,
                            background: "#1d4ed8",
                            color: "#fff",
                            fontWeight: 700,
                            cursor: "pointer",
                        }}
                    >
                        Sayfayı Yenile
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}