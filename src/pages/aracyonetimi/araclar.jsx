import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { supabase } from "../../lib/supabaseClient";

const emptyForm = {
    cekici: "",
    dorse: "",
    surucu: "",
    tc: "",
    telefon: "",
    vkn: "",
    datalogerNo: "",
};

const FETCH_SIZE = 1000;

function normalizePlate(value) {
    return String(value || "").toLocaleUpperCase("tr-TR").replace(/\s/g, "");
}

function initials(name) {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const AVATAR_COLORS = [
    { bg: "linear-gradient(135deg,#667eea,#764ba2)", text: "#fff" },
    { bg: "linear-gradient(135deg,#f093fb,#f5576c)", text: "#fff" },
    { bg: "linear-gradient(135deg,#4facfe,#00f2fe)", text: "#fff" },
    { bg: "linear-gradient(135deg,#43e97b,#38f9d7)", text: "#fff" },
    { bg: "linear-gradient(135deg,#fa709a,#fee140)", text: "#fff" },
];

function avatarColor(name) {
    if (!name) return AVATAR_COLORS[0];
    let code = 0;
    for (let i = 0; i < name.length; i++) code += name.charCodeAt(i);
    return AVATAR_COLORS[code % AVATAR_COLORS.length];
}

const TRPlate = ({ plate, type }) => {
    if (!plate) return null;
    const isCekici = type === "cekici";
    return (
        <div style={{
            display: "inline-flex",
            alignItems: "stretch",
            borderRadius: 8,
            overflow: "hidden",
            border: "1.5px solid",
            borderColor: isCekici ? "#c8d8ff" : "#b7f5d8",
            boxShadow: isCekici
                ? "0 2px 8px rgba(59,111,255,0.12)"
                : "0 2px 8px rgba(16,185,129,0.12)",
            fontSize: 13,
            fontWeight: 900,
            letterSpacing: "0.8px",
            fontFamily: "'JetBrains Mono','Fira Mono','Courier New',monospace",
        }}>
            <div style={{
                background: isCekici ? "#1a56db" : "#059669",
                color: "#fff",
                padding: "3px 7px",
                fontSize: 9,
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.6px",
                display: "flex",
                alignItems: "center",
                writingMode: "horizontal-tb",
                gap: 2,
            }}>
                <span style={{ fontSize: 10 }}>{isCekici ? "🚛" : "📦"}</span>
            </div>
            <div style={{
                background: isCekici ? "#eff6ff" : "#ecfdf5",
                color: isCekici ? "#1a3a8f" : "#065f46",
                padding: "4px 10px",
                display: "flex",
                alignItems: "center",
            }}>
                {plate}
            </div>
        </div>
    );
};

const IconSearch = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
    </svg>
);
const IconGrid = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
    </svg>
);
const IconList = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
);
const IconPlus = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);
const IconX = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);
const IconEdit = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
);
const IconTrash = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
);
const IconDownload = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
    </svg>
);
const IconTruck = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
);

const styles = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

.ar2-root {
    --bg: #F0F3FA;
    --surface: #FFFFFF;
    --surface2: #F8FAFD;
    --border: #E4E9F2;
    --border2: #D0D9EC;
    --text-primary: #0D1526;
    --text-secondary: #5A6480;
    --text-muted: #9CA3B8;
    --accent: #3B6FFF;
    --accent-light: #EBF0FF;
    --accent-dark: #2754D6;
    --green: #10B981;
    --green-light: #ECFDF5;
    --red: #EF4444;
    --red-light: #FEF2F2;
    --amber: #F59E0B;
    --radius-sm: 8px;
    --radius: 14px;
    --radius-lg: 20px;
    --shadow-sm: 0 1px 3px rgba(13,21,38,0.06), 0 1px 2px rgba(13,21,38,0.04);
    --shadow: 0 4px 16px rgba(13,21,38,0.08), 0 1px 4px rgba(13,21,38,0.04);
    --shadow-lg: 0 12px 40px rgba(13,21,38,0.12), 0 4px 12px rgba(13,21,38,0.06);
    font-family: 'Inter', 'Segoe UI', sans-serif;
    background: var(--bg);
    min-height: 100vh;
    padding: 20px;
    box-sizing: border-box;
}

/* TOAST */
.ar2-toast {
    position: fixed;
    top: 24px;
    right: 24px;
    z-index: 9999;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 13px 18px;
    border-radius: 14px;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: -0.1px;
    box-shadow: var(--shadow-lg);
    animation: ar2-slide-in 0.3s cubic-bezier(0.34,1.56,0.64,1);
    backdrop-filter: blur(12px);
}
.ar2-toast-success { background: #F0FDF4; color: #065F46; border: 1.5px solid #A7F3D0; }
.ar2-toast-warning { background: #FFFBEB; color: #92400E; border: 1.5px solid #FDE68A; }
.ar2-toast-error   { background: #FEF2F2; color: #991B1B; border: 1.5px solid #FECACA; }
.ar2-toast-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.ar2-toast-success .ar2-toast-dot { background: var(--green); }
.ar2-toast-warning .ar2-toast-dot { background: var(--amber); }
.ar2-toast-error   .ar2-toast-dot { background: var(--red); }

/* HEADER */
.ar2-header {
    background: var(--text-primary);
    border-radius: var(--radius-lg);
    padding: 20px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
    margin-bottom: 16px;
    box-shadow: var(--shadow-lg);
    position: relative;
    overflow: hidden;
}
.ar2-header::before {
    content:'';
    position:absolute;
    top:-40px; right:-40px;
    width:200px; height:200px;
    background: radial-gradient(circle, rgba(59,111,255,0.25) 0%, transparent 70%);
    pointer-events:none;
}
.ar2-header-brand {
    display: flex;
    align-items: center;
    gap: 14px;
}
.ar2-header-icon {
    width: 46px; height: 46px;
    background: rgba(59,111,255,0.2);
    border: 1.5px solid rgba(59,111,255,0.4);
    border-radius: 14px;
    display: flex; align-items: center; justify-content: center;
    color: #7BA7FF;
}
.ar2-header-title {
    font-size: 18px;
    font-weight: 900;
    color: #fff;
    margin: 0;
    letter-spacing: -0.5px;
}
.ar2-header-subtitle {
    font-size: 12px;
    font-weight: 500;
    color: rgba(255,255,255,0.45);
    margin: 3px 0 0;
    letter-spacing: 0.1px;
}
.ar2-header-actions {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
}

/* STATS STRIP */
.ar2-stats {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 12px;
    margin-bottom: 16px;
}
.ar2-stat-card {
    background: var(--surface);
    border: 1.5px solid var(--border);
    border-radius: var(--radius);
    padding: 16px 18px;
    box-shadow: var(--shadow-sm);
    transition: box-shadow 0.2s, transform 0.2s;
}
.ar2-stat-card:hover { box-shadow: var(--shadow); transform: translateY(-2px); }
.ar2-stat-label {
    font-size: 11px;
    font-weight: 700;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.6px;
    margin: 0 0 6px;
}
.ar2-stat-value {
    font-size: 26px;
    font-weight: 900;
    color: var(--text-primary);
    letter-spacing: -1px;
    line-height: 1;
}
.ar2-stat-sub {
    font-size: 11px;
    font-weight: 500;
    color: var(--text-muted);
    margin-top: 4px;
}

/* VIEW TOGGLE */
.ar2-view-toggle {
    display: flex;
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 10px;
    padding: 3px;
    gap: 2px;
}
.ar2-toggle-btn {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 6px 12px;
    border-radius: 8px;
    font-size: 12px; font-weight: 700;
    color: rgba(255,255,255,0.5);
    background: transparent; border: none; cursor: pointer;
    transition: all 0.15s;
}
.ar2-toggle-active {
    background: rgba(255,255,255,0.12);
    color: #fff;
}

/* BUTTONS */
.ar2-btn {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 0 18px; height: 40px;
    border-radius: 11px;
    font-size: 13px; font-weight: 700;
    cursor: pointer; border: none;
    transition: all 0.15s;
    white-space: nowrap;
    letter-spacing: -0.1px;
}
.ar2-btn:disabled { opacity: 0.45; cursor: not-allowed; }
.ar2-btn-primary {
    background: var(--accent);
    color: #fff;
    box-shadow: 0 4px 14px rgba(59,111,255,0.35);
}
.ar2-btn-primary:not(:disabled):hover {
    background: var(--accent-dark);
    box-shadow: 0 6px 20px rgba(59,111,255,0.45);
    transform: translateY(-1px);
}
.ar2-btn-ghost {
    background: rgba(255,255,255,0.08);
    color: rgba(255,255,255,0.75);
    border: 1px solid rgba(255,255,255,0.14);
}
.ar2-btn-ghost:hover { background: rgba(255,255,255,0.14); color: #fff; }
.ar2-btn-excel {
    background: rgba(16,185,129,0.15);
    color: #6EE7B7;
    border: 1px solid rgba(16,185,129,0.3);
}
.ar2-btn-excel:hover { background: rgba(16,185,129,0.22); color: #fff; }
.ar2-btn-cancel {
    background: var(--surface2);
    color: var(--text-secondary);
    border: 1.5px solid var(--border);
}
.ar2-btn-cancel:hover { background: var(--border); }
.ar2-btn-save {
    background: var(--accent);
    color: #fff;
    box-shadow: 0 4px 14px rgba(59,111,255,0.3);
}
.ar2-btn-save:not(:disabled):hover {
    background: var(--accent-dark);
    transform: translateY(-1px);
}

/* FORM PANEL */
.ar2-form-panel {
    background: var(--surface);
    border: 1.5px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 24px;
    margin-bottom: 16px;
    box-shadow: var(--shadow);
    animation: ar2-fade-up 0.2s ease;
}
.ar2-form-header {
    display: flex; align-items: flex-start; justify-content: space-between;
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1.5px solid var(--border);
}
.ar2-form-title {
    font-size: 16px; font-weight: 900; color: var(--text-primary);
    margin: 0; letter-spacing: -0.3px;
}
.ar2-form-desc {
    font-size: 12px; font-weight: 500; color: var(--text-muted); margin: 4px 0 0;
}
.ar2-form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
    gap: 14px;
}
.ar2-field { display: flex; flex-direction: column; gap: 6px; }
.ar2-field-label {
    font-size: 11px; font-weight: 800; color: var(--text-muted);
    text-transform: uppercase; letter-spacing: 0.6px;
}
.ar2-input {
    height: 40px; padding: 0 13px;
    border-radius: 10px;
    border: 1.5px solid var(--border);
    background: var(--surface2);
    font-size: 13px; font-weight: 600; color: var(--text-primary);
    outline: none; box-sizing: border-box;
    transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
    width: 100%;
    font-family: inherit;
}
.ar2-input::placeholder { color: var(--text-muted); font-weight: 500; }
.ar2-input:focus {
    border-color: var(--accent);
    background: #fff;
    box-shadow: 0 0 0 3px rgba(59,111,255,0.1);
}
.ar2-form-footer {
    display: flex; justify-content: flex-end; gap: 8px;
    margin-top: 20px; padding-top: 16px;
    border-top: 1.5px solid var(--border);
}

/* TOOLBAR */
.ar2-toolbar {
    background: var(--surface);
    border: 1.5px solid var(--border);
    border-radius: var(--radius);
    padding: 12px 16px;
    display: flex; align-items: center; gap: 10px;
    margin-bottom: 14px;
    box-shadow: var(--shadow-sm);
}
.ar2-search-wrap {
    position: relative; flex: 1;
    display: flex; align-items: center;
}
.ar2-search-icon {
    position: absolute; left: 11px;
    color: var(--text-muted); pointer-events: none;
    display: flex; align-items: center;
}
.ar2-search-input {
    width: 100%; height: 38px;
    padding: 0 36px 0 34px;
    border-radius: 10px;
    border: 1.5px solid var(--border);
    background: var(--surface2);
    font-size: 13px; font-weight: 600; color: var(--text-primary);
    outline: none; box-sizing: border-box;
    transition: border-color 0.15s, box-shadow 0.15s;
    font-family: inherit;
}
.ar2-search-input::placeholder { color: var(--text-muted); font-weight: 500; }
.ar2-search-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(59,111,255,0.08); }
.ar2-search-clear {
    position: absolute; right: 10px;
    background: var(--border); border: none; color: var(--text-muted);
    cursor: pointer; padding: 0; width: 20px; height: 20px;
    border-radius: 50%; display: flex; align-items: center; justify-content: center;
    transition: all 0.15s;
}
.ar2-search-clear:hover { background: var(--border2); color: var(--text-primary); }
.ar2-result-badge {
    background: var(--accent-light);
    color: var(--accent);
    font-size: 12px; font-weight: 800;
    padding: 4px 10px; border-radius: 8px;
    white-space: nowrap;
}

/* LOADING */
.ar2-loading {
    display: flex; align-items: center; justify-content: center; gap: 10px;
    padding: 48px; color: var(--text-muted); font-size: 13px; font-weight: 600;
}
.ar2-spinner {
    width: 20px; height: 20px;
    border: 2px solid var(--border);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: ar2-spin 0.7s linear infinite;
}

/* PAGINATION */
.ar2-pagination {
    background: var(--surface);
    border: 1.5px solid var(--border);
    border-radius: var(--radius);
    padding: 11px 16px;
    display: flex; align-items: center; justify-content: space-between;
    gap: 10px; flex-wrap: wrap;
    box-shadow: var(--shadow-sm);
    margin-bottom: 14px;
}
.ar2-pagination-info {
    display: flex; align-items: center; gap: 10px;
    font-size: 12px; font-weight: 700; color: var(--text-secondary);
}
.ar2-page-size {
    height: 32px; padding: 0 10px;
    border-radius: 9px; border: 1.5px solid var(--border);
    background: var(--surface2);
    font-size: 12px; font-weight: 700; color: var(--text-primary);
    outline: none; font-family: inherit; cursor: pointer;
}
.ar2-pagination-btns { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
.ar2-page-btn {
    height: 32px; padding: 0 12px;
    border-radius: 9px; border: 1.5px solid var(--border);
    background: var(--surface2); color: var(--text-secondary);
    font-size: 12px; font-weight: 800; cursor: pointer;
    transition: all 0.15s; font-family: inherit;
}
.ar2-page-btn:hover:not(:disabled) { background: var(--accent-light); color: var(--accent); border-color: #C7D7FF; }
.ar2-page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.ar2-page-current {
    min-width: 68px; text-align: center;
    font-size: 12px; font-weight: 900; color: var(--text-primary);
}

/* CARD GRID */
.ar2-card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
    gap: 14px;
    margin-bottom: 14px;
}
.ar2-card {
    background: var(--surface);
    border: 1.5px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 18px;
    display: flex; flex-direction: column; gap: 14px;
    box-shadow: var(--shadow-sm);
    transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
    animation: ar2-fade-up 0.2s ease;
    cursor: default;
}
.ar2-card:hover {
    border-color: #C7D7FF;
    box-shadow: 0 8px 32px rgba(59,111,255,0.1), 0 2px 8px rgba(13,21,38,0.06);
    transform: translateY(-3px);
}
.ar2-card-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
.ar2-plate-group { display: flex; flex-wrap: wrap; gap: 6px; }
.ar2-card-menu { display: flex; gap: 5px; }
.ar2-icon-btn {
    width: 32px; height: 32px; border-radius: 9px;
    border: 1.5px solid; display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: all 0.15s; flex-shrink: 0;
}
.ar2-icon-btn-edit {
    border-color: #C7D7FF; background: var(--accent-light); color: var(--accent);
}
.ar2-icon-btn-edit:hover { background: #D6E4FF; border-color: #93B4FF; }
.ar2-icon-btn-del {
    border-color: #FECDD3; background: #FFF1F2; color: #E11D48;
}
.ar2-icon-btn-del:hover { background: #FFE4E6; border-color: #FDA4AF; }

.ar2-driver-row {
    display: flex; align-items: center; gap: 12px;
    padding: 12px 14px;
    background: var(--surface2);
    border: 1.5px solid var(--border);
    border-radius: 12px;
}
.ar2-avatar {
    width: 42px; height: 42px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 14px; font-weight: 900; color: #fff; flex-shrink: 0;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}
.ar2-avatar-sm { width: 32px; height: 32px; font-size: 11px; }
.ar2-driver-name { font-size: 14px; font-weight: 800; color: var(--text-primary); margin: 0; }
.ar2-driver-tel { font-size: 12px; font-weight: 500; color: var(--text-muted); margin: 2px 0 0; }

.ar2-meta-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 8px;
}
.ar2-meta-item {
    padding: 9px 11px;
    border-radius: 10px;
    background: var(--surface2);
    border: 1px solid var(--border);
}
.ar2-meta-label { font-size: 10px; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
.ar2-meta-value { font-size: 12px; font-weight: 700; color: var(--text-secondary); margin-top: 3px; word-break: break-all; font-family: 'JetBrains Mono','Fira Mono',monospace; }

/* TABLE */
.ar2-table-wrap {
    background: var(--surface);
    border: 1.5px solid var(--border);
    border-radius: var(--radius-lg);
    overflow: hidden;
    box-shadow: var(--shadow-sm);
    margin-bottom: 14px;
    animation: ar2-fade-up 0.2s ease;
}
.ar2-table { width: 100%; border-collapse: collapse; font-size: 13px; table-layout: fixed; }
.ar2-table thead tr { background: var(--surface2); border-bottom: 1.5px solid var(--border); }
.ar2-table th {
    padding: 12px 16px;
    text-align: left; font-size: 11px; font-weight: 800;
    color: var(--text-muted); text-transform: uppercase;
    letter-spacing: 0.7px; white-space: nowrap;
}
.ar2-table td { padding: 13px 16px; color: var(--text-secondary); font-weight: 600; vertical-align: middle; }
.ar2-table-row { border-bottom: 1px solid var(--border); transition: background 0.1s; }
.ar2-table-row:last-child { border-bottom: none; }
.ar2-table-row:hover { background: var(--surface2); }
.ar2-table-driver { display: flex; align-items: center; gap: 9px; }
.ar2-table-driver span { font-size: 13px; font-weight: 700; color: var(--text-primary); }
.ar2-tbl-mono { font-family: 'JetBrains Mono','Fira Mono',monospace; font-size: 12px; letter-spacing: 0.3px; }
.ar2-tbl-empty { color: var(--border2); font-weight: 500; }
.ar2-table-actions { display: flex; gap: 5px; }

/* EMPTY */
.ar2-empty {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 8px; padding: 64px 24px; text-align: center; grid-column: 1 / -1;
}
.ar2-empty-icon { font-size: 36px; margin-bottom: 4px; }
.ar2-empty strong { font-size: 15px; font-weight: 900; color: var(--text-secondary); }
.ar2-empty p { font-size: 13px; font-weight: 500; color: var(--text-muted); margin: 0; }

/* ANIMATIONS */
@keyframes ar2-fade-up {
    from { opacity:0; transform: translateY(8px); }
    to   { opacity:1; transform: translateY(0); }
}
@keyframes ar2-slide-in {
    from { opacity:0; transform: translateX(24px); }
    to   { opacity:1; transform: translateX(0); }
}
@keyframes ar2-spin { to { transform: rotate(360deg); } }

/* RESPONSIVE */
@media (max-width:640px) {
    .ar2-root { padding: 12px; }
    .ar2-header { border-radius: 16px; }
    .ar2-card-grid { grid-template-columns: 1fr; }
    .ar2-form-grid { grid-template-columns: 1fr; }
    .ar2-table-wrap { overflow-x: auto; }
    .ar2-table { table-layout: auto; min-width: 600px; }
    .ar2-stats { grid-template-columns: repeat(2,1fr); }
    .ar2-pagination { align-items: stretch; }
    .ar2-pagination-info, .ar2-pagination-btns { width: 100%; justify-content: space-between; }
    .ar2-page-btn { flex: 1; }
}
`;

export default function Araclar() {
    const [araclar, setAraclar] = useState([]);
    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [view, setView] = useState("kart");
    const [formOpen, setFormOpen] = useState(false);
    const [toast, setToast] = useState(null);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(50);

    const showToast = (msg, type = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    const fetchAraclar = async () => {
        setLoading(true);
        let from = 0, allData = [], hasMore = true;
        while (hasMore) {
            const to = from + FETCH_SIZE - 1;
            const { data, error } = await supabase.from("araclar").select("*").order("id", { ascending: false }).range(from, to);
            if (error) { showToast(`Araçlar alınamadı: ${error.message}`, "error"); setLoading(false); return; }
            const rows = data || [];
            allData = [...allData, ...rows];
            if (rows.length < FETCH_SIZE) hasMore = false; else from += FETCH_SIZE;
        }
        setAraclar(allData);
        setPage(1);
        setLoading(false);
    };

    useEffect(() => { fetchAraclar(); }, []);

    const filteredAraclar = useMemo(() => {
        const value = search.toLocaleLowerCase("tr-TR").trim();
        if (!value) return araclar;
        return araclar.filter((item) =>
            [item.cekici, item.dorse, item.surucu, item.tc, item.telefon, item.vkn, item.datalogerNo]
                .join(" ").toLocaleLowerCase("tr-TR").includes(value)
        );
    }, [araclar, search]);

    const totalPages = Math.max(1, Math.ceil(filteredAraclar.length / pageSize));
    const pagedAraclar = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredAraclar.slice(start, start + pageSize);
    }, [filteredAraclar, page, pageSize]);

    useEffect(() => { setPage(1); }, [search, pageSize]);
    useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: name === "cekici" || name === "dorse" ? normalizePlate(value) : value,
        }));
    };

    const resetForm = () => { setForm(emptyForm); setEditingId(null); setFormOpen(false); };

    const startEdit = (item) => {
        setEditingId(item.id);
        setForm({ cekici: item.cekici || "", dorse: item.dorse || "", surucu: item.surucu || "", tc: item.tc || "", telefon: item.telefon || "", vkn: item.vkn || "", datalogerNo: item.datalogerNo || "" });
        setFormOpen(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.cekici && !form.dorse && !form.surucu) { showToast("En az çekici, dorse veya sürücü alanlarından biri dolu olmalı.", "warning"); return; }
        setSaving(true);
        const payload = { cekici: form.cekici || null, dorse: form.dorse || null, surucu: form.surucu || null, tc: form.tc || null, telefon: form.telefon || null, vkn: form.vkn || null, datalogerNo: form.datalogerNo || null };
        const { error } = editingId
            ? await supabase.from("araclar").update(payload).eq("id", editingId)
            : await supabase.from("araclar").insert([payload]);
        if (error) { showToast(editingId ? `Araç güncellenemedi: ${error.message}` : `Araç eklenemedi: ${error.message}`, "error"); setSaving(false); return; }
        resetForm();
        await fetchAraclar();
        setSaving(false);
        showToast(editingId ? "Araç bilgileri güncellendi." : "Araç başarıyla kaydedildi.");
    };

    const deleteArac = async (id) => {
        if (!confirm("Bu araç kaydı silinsin mi?")) return;
        const { error } = await supabase.from("araclar").delete().eq("id", id);
        if (error) { showToast(`Araç silinemedi: ${error.message}`, "error"); return; }
        setAraclar((prev) => prev.filter((item) => item.id !== id));
        showToast("Araç silindi.", "warning");
        if (editingId === id) resetForm();
    };

    const exportExcel = () => {
        if (!filteredAraclar.length) { showToast("Aktarılacak kayıt bulunamadı.", "warning"); return; }
        const rows = filteredAraclar.map((item) => ({ Sürücü: item.surucu || "", "Çekici Plaka": item.cekici || "", "Dorse Plaka": item.dorse || "", "TC No": item.tc || "", Telefon: item.telefon || "", VKN: item.vkn || "", "Dataloger No": item.datalogerNo || "" }));
        const worksheet = XLSX.utils.json_to_sheet(rows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Araclar");
        worksheet["!cols"] = [{ wch: 28 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 18 }, { wch: 18 }, { wch: 18 }];
        XLSX.writeFile(workbook, `araclar-${new Date().toISOString().slice(0, 10)}.xlsx`);
    };

    // Stats
    const totalCekici = araclar.filter(a => a.cekici).length;
    const totalDorse = araclar.filter(a => a.dorse).length;
    const totalSurucu = araclar.filter(a => a.surucu).length;

    const Pagination = () => (
        <div className="ar2-pagination">
            <div className="ar2-pagination-info">
                <span>
                    {filteredAraclar.length === 0
                        ? "0 kayıt"
                        : `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, filteredAraclar.length)} / ${filteredAraclar.length}`}
                </span>
                <select className="ar2-page-size" value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
                    {[25, 50, 100, 250].map(n => <option key={n} value={n}>{n} / sayfa</option>)}
                </select>
            </div>
            <div className="ar2-pagination-btns">
                <button className="ar2-page-btn" onClick={() => setPage(1)} disabled={page === 1}>İlk</button>
                <button className="ar2-page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>‹ Önceki</button>
                <span className="ar2-page-current">{page} / {totalPages}</span>
                <button className="ar2-page-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Sonraki ›</button>
                <button className="ar2-page-btn" onClick={() => setPage(totalPages)} disabled={page === totalPages}>Son</button>
            </div>
        </div>
    );

    return (
        <div className="ar2-root">
            <style>{styles}</style>

            {toast && (
                <div className={`ar2-toast ar2-toast-${toast.type}`}>
                    <span className="ar2-toast-dot" />
                    {toast.msg}
                </div>
            )}

            {/* HEADER */}
            <div className="ar2-header">
                <div className="ar2-header-brand">
                    <div className="ar2-header-icon"><IconTruck /></div>
                    <div>
                        <h1 className="ar2-header-title">Araç Yönetimi</h1>
                        <p className="ar2-header-subtitle">{araclar.length} kayıt · Çekici, dorse ve sürücü bilgileri</p>
                    </div>
                </div>
                <div className="ar2-header-actions">
                    <div className="ar2-view-toggle">
                        <button className={`ar2-toggle-btn ${view === "kart" ? "ar2-toggle-active" : ""}`} onClick={() => setView("kart")} type="button">
                            <IconGrid /> Kart
                        </button>
                        <button className={`ar2-toggle-btn ${view === "tablo" ? "ar2-toggle-active" : ""}`} onClick={() => setView("tablo")} type="button">
                            <IconList /> Tablo
                        </button>
                    </div>
                    <button className="ar2-btn ar2-btn-excel" onClick={exportExcel} type="button">
                        <IconDownload /> Excel
                    </button>
                    <button
                        className="ar2-btn ar2-btn-primary"
                        onClick={() => { if (formOpen && editingId) { resetForm(); } else { setFormOpen(v => !v); } }}
                        type="button"
                    >
                        {formOpen ? <><IconX /> Kapat</> : <><IconPlus /> Yeni Araç</>}
                    </button>
                </div>
            </div>

            {/* STATS */}
            <div className="ar2-stats">
                <div className="ar2-stat-card">
                    <p className="ar2-stat-label">Toplam Kayıt</p>
                    <div className="ar2-stat-value">{araclar.length}</div>
                    <p className="ar2-stat-sub">Tüm araçlar</p>
                </div>
                <div className="ar2-stat-card">
                    <p className="ar2-stat-label">Çekici</p>
                    <div className="ar2-stat-value" style={{ color: "#1a56db" }}>{totalCekici}</div>
                    <p className="ar2-stat-sub">Plakalı kayıt</p>
                </div>
                <div className="ar2-stat-card">
                    <p className="ar2-stat-label">Dorse</p>
                    <div className="ar2-stat-value" style={{ color: "#059669" }}>{totalDorse}</div>
                    <p className="ar2-stat-sub">Plakalı kayıt</p>
                </div>
                <div className="ar2-stat-card">
                    <p className="ar2-stat-label">Sürücü</p>
                    <div className="ar2-stat-value" style={{ color: "#7C3AED" }}>{totalSurucu}</div>
                    <p className="ar2-stat-sub">İsim kayıtlı</p>
                </div>
            </div>

            {/* FORM PANEL */}
            {formOpen && (
                <div className="ar2-form-panel">
                    <form onSubmit={handleSubmit}>
                        <div className="ar2-form-header">
                            <div>
                                <h2 className="ar2-form-title">{editingId ? "Araç Bilgilerini Düzenle" : "Yeni Araç Ekle"}</h2>
                                <p className="ar2-form-desc">{editingId ? "Seçili araç kaydını güncelliyorsunuz." : "Çekici, dorse veya sürücü bilgilerinden en az birini girin."}</p>
                            </div>
                        </div>
                        <div className="ar2-form-grid">
                            {[
                                { name: "cekici", label: "Çekici Plaka", placeholder: "07AJY302" },
                                { name: "dorse", label: "Dorse Plaka", placeholder: "59AHZ720" },
                                { name: "surucu", label: "Sürücü Adı", placeholder: "Ad Soyad" },
                                { name: "tc", label: "TC No", placeholder: "12345678901" },
                                { name: "telefon", label: "Telefon", placeholder: "05xx xxx xx xx" },
                                { name: "vkn", label: "VKN", placeholder: "Vergi kimlik no" },
                                { name: "datalogerNo", label: "Dataloger No", placeholder: "Cihaz numarası" },
                            ].map(f => (
                                <div className="ar2-field" key={f.name}>
                                    <span className="ar2-field-label">{f.label}</span>
                                    <input name={f.name} value={form[f.name]} onChange={handleChange} placeholder={f.placeholder} className="ar2-input" />
                                </div>
                            ))}
                        </div>
                        <div className="ar2-form-footer">
                            <button type="button" className="ar2-btn ar2-btn-cancel" onClick={resetForm}>İptal</button>
                            <button type="submit" className="ar2-btn ar2-btn-save" disabled={saving}>
                                {saving ? "Kaydediliyor..." : editingId ? "Güncelle" : "Kaydet"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* TOOLBAR */}
            <div className="ar2-toolbar">
                <div className="ar2-search-wrap">
                    <span className="ar2-search-icon"><IconSearch /></span>
                    <input
                        className="ar2-search-input"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Plaka, sürücü, TC, telefon, dataloger ara..."
                    />
                    {search && (
                        <button className="ar2-search-clear" onClick={() => setSearch("")} aria-label="Aramayı temizle" type="button">
                            <IconX />
                        </button>
                    )}
                </div>
                {search && <span className="ar2-result-badge">{filteredAraclar.length} sonuç</span>}
            </div>

            {/* LOADING */}
            {loading && (
                <div className="ar2-loading">
                    <div className="ar2-spinner" />
                    Tüm kayıtlar yükleniyor...
                </div>
            )}

            {/* PAGINATION TOP */}
            {!loading && <Pagination />}

            {/* CARD VIEW */}
            {!loading && view === "kart" && (
                <div className="ar2-card-grid">
                    {pagedAraclar.map((item) => {
                        const av = avatarColor(item.surucu);
                        return (
                            <article className="ar2-card" key={item.id}>
                                <div className="ar2-card-top">
                                    <div className="ar2-plate-group">
                                        <TRPlate plate={item.cekici} type="cekici" />
                                        <TRPlate plate={item.dorse} type="dorse" />
                                        {!item.cekici && !item.dorse && (
                                            <span style={{ fontSize: 12, color: "var(--text-muted)", fontStyle: "italic" }}>Plaka yok</span>
                                        )}
                                    </div>
                                    <div className="ar2-card-menu">
                                        <button className="ar2-icon-btn ar2-icon-btn-edit" onClick={() => startEdit(item)} type="button" title="Düzenle">
                                            <IconEdit />
                                        </button>
                                        <button className="ar2-icon-btn ar2-icon-btn-del" onClick={() => deleteArac(item.id)} type="button" title="Sil">
                                            <IconTrash />
                                        </button>
                                    </div>
                                </div>

                                <div className="ar2-driver-row">
                                    <div className="ar2-avatar" style={{ background: av.bg }}>
                                        {initials(item.surucu)}
                                    </div>
                                    <div>
                                        <p className="ar2-driver-name">{item.surucu || "—"}</p>
                                        <p className="ar2-driver-tel">{item.telefon || "Telefon yok"}</p>
                                    </div>
                                </div>

                                <div className="ar2-meta-grid">
                                    <div className="ar2-meta-item">
                                        <div className="ar2-meta-label">TC</div>
                                        <div className="ar2-meta-value">{item.tc || "—"}</div>
                                    </div>
                                    <div className="ar2-meta-item">
                                        <div className="ar2-meta-label">VKN</div>
                                        <div className="ar2-meta-value">{item.vkn || "—"}</div>
                                    </div>
                                    <div className="ar2-meta-item" style={{ gridColumn: "1 / -1" }}>
                                        <div className="ar2-meta-label">Dataloger</div>
                                        <div className="ar2-meta-value">{item.datalogerNo || "—"}</div>
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                    {filteredAraclar.length === 0 && (
                        <div className="ar2-empty">
                            <div className="ar2-empty-icon">🔍</div>
                            <strong>Kayıt bulunamadı</strong>
                            <p>Arama filtresini değiştirin veya yeni araç ekleyin.</p>
                        </div>
                    )}
                </div>
            )}

            {/* TABLE VIEW */}
            {!loading && view === "tablo" && (
                <div className="ar2-table-wrap">
                    <table className="ar2-table">
                        <thead>
                            <tr>
                                <th>Sürücü</th>
                                <th>Çekici</th>
                                <th>Dorse</th>
                                <th>TC</th>
                                <th>Telefon</th>
                                <th>VKN</th>
                                <th>Dataloger</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {pagedAraclar.map((item) => {
                                const av = avatarColor(item.surucu);
                                return (
                                    <tr key={item.id} className="ar2-table-row">
                                        <td>
                                            <div className="ar2-table-driver">
                                                <div className="ar2-avatar ar2-avatar-sm" style={{ background: av.bg }}>{initials(item.surucu)}</div>
                                                <span>{item.surucu || "—"}</span>
                                            </div>
                                        </td>
                                        <td><TRPlate plate={item.cekici} type="cekici" /></td>
                                        <td><TRPlate plate={item.dorse} type="dorse" /></td>
                                        <td className="ar2-tbl-mono">{item.tc || <span className="ar2-tbl-empty">—</span>}</td>
                                        <td>{item.telefon || <span className="ar2-tbl-empty">—</span>}</td>
                                        <td className="ar2-tbl-mono">{item.vkn || <span className="ar2-tbl-empty">—</span>}</td>
                                        <td className="ar2-tbl-mono">{item.datalogerNo || <span className="ar2-tbl-empty">—</span>}</td>
                                        <td>
                                            <div className="ar2-table-actions">
                                                <button className="ar2-icon-btn ar2-icon-btn-edit" onClick={() => startEdit(item)} type="button" title="Düzenle"><IconEdit /></button>
                                                <button className="ar2-icon-btn ar2-icon-btn-del" onClick={() => deleteArac(item.id)} type="button" title="Sil"><IconTrash /></button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {filteredAraclar.length === 0 && (
                        <div className="ar2-empty">
                            <div className="ar2-empty-icon">🔍</div>
                            <strong>Kayıt bulunamadı</strong>
                            <p>Arama filtresini değiştirin veya yeni araç ekleyin.</p>
                        </div>
                    )}
                </div>
            )}

            {/* PAGINATION BOTTOM */}
            {!loading && filteredAraclar.length > 0 && <Pagination />}
        </div>
    );
}