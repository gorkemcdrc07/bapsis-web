import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { SettingsProvider } from "./context/SettingsContext";
import { setupGlobalErrorLogging } from "./lib/globalErrorHandler";
import { ErrorBoundary } from "./components/ErrorBoundary";
import "./index.css";

setupGlobalErrorLogging();

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <ErrorBoundary>
            <BrowserRouter>
                <SettingsProvider>
                    <AuthProvider>
                        <App />
                    </AuthProvider>
                </SettingsProvider>
            </BrowserRouter>
        </ErrorBoundary>
    </React.StrictMode>
);