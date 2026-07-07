import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContext";
import "./ugramasart.css";

const PAGE_KEY = "ekkayit_ugrama";

const BUTTONS = {
    TOGGLE_IKIZ_DEPO: "toggle_ikiz_depo",
    UPDATE_AMOUNT: "update_amount",
    TOGGLE_STATUS: "toggle_status",
};

const COLUMNS = {
    VKN: "VKN",
    CUSTOMER: "Müşteri / Tip",
    AMOUNT: "Tutar",
    STATUS: "Durum",
    RECORD: "Kayıt",
};

const SPECIAL_RULES = {
    "24388338234": {
        label: "SİBEL ÖZTÜRK",
        defaultAmount: "500",
    },
    "4641134960": {
        label: "HOYRANTUR",
        defaultAmount: "700",
    },
};

const DEFAULT_AMOUNT = "900";

export default function UgramaSart() {
    const { canPage, canButton, canColumn } = useAuth();

    const canViewPage = canPage(PAGE_KEY);
    const canToggleIkizDepo = canButton(PAGE_KEY, BUTTONS.TOGGLE_IKIZ_DEPO);
    const canUpdateAmount = canButton(PAGE_KEY, BUTTONS.UPDATE_AMOUNT);
    const canToggleStatus = canButton(PAGE_KEY, BUTTONS.TOGGLE_STATUS);

    const showVkn = canColumn(PAGE_KEY, COLUMNS.VKN);
    const showCustomer = canColumn(PAGE_KEY, COLUMNS.CUSTOMER);
    const showAmount = canColumn(PAGE_KEY, COLUMNS.AMOUNT);
    const showStatus = canColumn(PAGE_KEY, COLUMNS.STATUS);
    const showRecord = canColumn(PAGE_KEY, COLUMNS.RECORD);

    const [vknler, setVknler] = useState([]);
    const [rules, setRules] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [savingKey, setSavingKey] = useState(null);
    const [activeTab, setActiveTab] = useState("ikizDepo");

    useEffect(() => {
        if (canViewPage) fetchAll();
    }, [canViewPage]);

    useEffect(() => {
        if (!canUpdateAmount) return;
        if (!rules.length) return;

        const timer = setTimeout(() => {
            const changedRules = rules.filter((rule) => rule._changed);

            changedRules.forEach((rule) => {
                saveRule({
                    tip: rule.tip,
                    anahtar: rule.anahtar,
                    tutar: rule.tutar,
                    acik: rule.acik,
                });
            });
        }, 600);

        return () => clearTimeout(timer);
    }, [rules, canUpdateAmount]);

    async function fetchAll() {
        setLoading(true);

        const [
            { data: vknData, error: vknError },
            { data: ruleData, error: ruleError },
        ] = await Promise.all([
            supabase
                .from("vknler")
                .select("*")
                .order("vkn", { ascending: true }),
            supabase.from("ugrama_sartlari").select("*"),
        ]);

        if (vknError) {
            setLoading(false);
            console.error(vknError);
            alert("VKN verileri alınamadı.");
            return;
        }

        if (ruleError) {
            setLoading(false);
            console.error(ruleError);
            alert("Uğrama şartları alınamadı.");
            return;
        }

        await eksikVknKurallariniOlustur(vknData || [], ruleData || []);

        const { data: refreshedRules, error: refreshedError } = await supabase
            .from("ugrama_sartlari")
            .select("*");

        setLoading(false);

        if (refreshedError) {
            console.error(refreshedError);
            alert("Güncel uğrama şartları alınamadı.");
            return;
        }

        setVknler(vknData || []);
        setRules(refreshedRules || []);
    }

    async function eksikVknKurallariniOlustur(vknData, ruleData) {
        const mevcutAnahtarlar = new Set(
            ruleData
                .filter((item) => item.tip === "vkn_ugrama")
                .map((item) => item.anahtar)
        );

        const eklenecekler = [];

        vknData.forEach((item) => {
            const vkn = String(item.vkn || "").trim();

            if (!vkn) return;
            if (mevcutAnahtarlar.has(vkn)) return;

            const special = SPECIAL_RULES[vkn];

            eklenecekler.push({
                tip: "vkn_ugrama",
                anahtar: vkn,
                tutar: special?.defaultAmount || DEFAULT_AMOUNT,
                acik: true,
            });
        });

        const ikizDepoVar = ruleData.some(
            (item) => item.tip === "ikiz_depo" && item.anahtar === "guzelhisar"
        );

        if (!ikizDepoVar) {
            eklenecekler.push({
                tip: "ikiz_depo",
                anahtar: "guzelhisar",
                tutar: null,
                acik: true,
            });
        }

        if (eklenecekler.length === 0) return;

        const { error } = await supabase
            .from("ugrama_sartlari")
            .upsert(eklenecekler, {
                onConflict: "tip,anahtar",
            });

        if (error) {
            console.error("Eksik uğrama şartları oluşturulamadı:", error);
        }
    }

    const uniqueVknList = useMemo(() => {
        const map = new Map();

        vknler.forEach((item) => {
            const value = String(item.vkn || "").trim();

            if (!value) return;

            if (!map.has(value)) {
                map.set(value, {
                    vkn: value,
                    musteriAdi:
                        item.musteri_adi ||
                        item.musteri ||
                        item.unvan ||
                        item.firma_adi ||
                        "",
                });
            }
        });

        return Array.from(map.values()).sort((a, b) =>
            a.vkn.localeCompare(b.vkn, "tr")
        );
    }, [vknler]);

    function getVknRule(item) {
        const dbRule = rules.find(
            (rule) => rule.tip === "vkn_ugrama" && rule.anahtar === item.vkn
        );

        const special = SPECIAL_RULES[item.vkn];

        return {
            tip: "vkn_ugrama",
            anahtar: item.vkn,
            label: special?.label || item.musteriAdi || "DİĞER",
            tutar: dbRule?.tutar || special?.defaultAmount || DEFAULT_AMOUNT,
            acik: dbRule?.acik ?? true,
            _changed: dbRule?._changed || false,
        };
    }

    const vknRules = useMemo(() => {
        return uniqueVknList.map((item) => getVknRule(item));
    }, [uniqueVknList, rules]);

    const filteredRules = useMemo(() => {
        const q = search.toLowerCase().trim();

        if (!q) return vknRules;

        return vknRules.filter((item) =>
            [item.anahtar, item.label, item.tutar]
                .join(" ")
                .toLowerCase()
                .includes(q)
        );
    }, [vknRules, search]);

    const ikizDepoRule = useMemo(() => {
        const dbRule = rules.find(
            (item) => item.tip === "ikiz_depo" && item.anahtar === "guzelhisar"
        );

        return {
            tip: "ikiz_depo",
            anahtar: "guzelhisar",
            acik: dbRule?.acik ?? true,
        };
    }, [rules]);

    const acikSayisi = useMemo(
        () => vknRules.filter((item) => item.acik).length,
        [vknRules]
    );

    async function saveRule(rule) {
        const key = `${rule.tip}-${rule.anahtar}`;
        setSavingKey(key);

        const { error } = await supabase.from("ugrama_sartlari").upsert(
            {
                tip: rule.tip,
                anahtar: rule.anahtar,
                tutar: rule.tutar || null,
                acik: rule.acik,
            },
            {
                onConflict: "tip,anahtar",
            }
        );

        setSavingKey(null);

        if (error) {
            console.error(error);
            alert("Şart kaydedilemedi.");
            return;
        }

        setRules((prev) =>
            prev.map((item) =>
                item.tip === rule.tip && item.anahtar === rule.anahtar
                    ? { ...item, ...rule, _changed: false }
                    : item
            )
        );
    }

    function updateLocalRule(rule, changed = true) {
        setRules((prev) => {
            const exists = prev.some(
                (item) => item.tip === rule.tip && item.anahtar === rule.anahtar
            );

            if (exists) {
                return prev.map((item) =>
                    item.tip === rule.tip && item.anahtar === rule.anahtar
                        ? { ...item, ...rule, _changed: changed }
                        : item
                );
            }

            return [{ ...rule, _changed: changed }, ...prev];
        });
    }

    async function toggleRule(rule) {
        if (!canToggleStatus) {
            alert("Durum değiştirme yetkiniz yok.");
            return;
        }

        const nextRule = {
            ...rule,
            acik: !rule.acik,
        };

        updateLocalRule(nextRule, false);
        await saveRule(nextRule);
    }

    function changeAmount(rule, value) {
        if (!canUpdateAmount) {
            alert("Tutar güncelleme yetkiniz yok.");
            return;
        }

        const nextRule = {
            ...rule,
            tutar: value,
        };

        updateLocalRule(nextRule, true);
    }

    async function toggleIkizDepo() {
        if (!canToggleIkizDepo) {
            alert("İkiz depo şartını değiştirme yetkiniz yok.");
            return;
        }

        const nextRule = {
            ...ikizDepoRule,
            acik: !ikizDepoRule.acik,
            tutar: null,
        };

        updateLocalRule(nextRule, false);
        await saveRule(nextRule);
    }

    const colSpan =
        [showVkn, showCustomer, showAmount, showStatus, showRecord].filter(Boolean).length || 1;

    if (!canViewPage) {
        return (
            <div className="ugrama-page">
                <div className="ugrama-shell">
                    <section className="rules-panel">
                        <div className="empty-row">
                            <span className="empty-state">
                                Bu sayfayı görüntüleme yetkiniz yok.
                            </span>
                        </div>
                    </section>
                </div>
            </div>
        );
    }

    return (
        <div className="ugrama-page">
            <div className="ugrama-shell">
                <header className="ugrama-header">
                    <div className="ugrama-header-text">
                        <span className="ugrama-eyebrow">Operasyon · Teslimat Kuralları</span>
                        <h1>Uğrama Şartları</h1>
                        <p>VKN bazlı uğrama tutarlarını ve ikiz depo kuralını buradan yönetin.</p>
                    </div>

                    <div className="ugrama-header-meta">
                        <div className="meta-chip">
                            <span className="meta-chip-value">{uniqueVknList.length}</span>
                            <span className="meta-chip-label">Toplam VKN</span>
                        </div>

                        <div className="meta-chip meta-chip-accent">
                            <span className="meta-chip-value">{acikSayisi}</span>
                            <span className="meta-chip-label">Aktif Kural</span>
                        </div>
                    </div>
                </header>

                <nav className="ugrama-tabs" role="tablist" aria-label="Uğrama şartları görünümleri">
                    <button
                        type="button"
                        role="tab"
                        aria-selected={activeTab === "ikizDepo"}
                        className={activeTab === "ikizDepo" ? "tab-btn active" : "tab-btn"}
                        onClick={() => setActiveTab("ikizDepo")}
                    >
                        İkiz Depo Şartı
                    </button>

                    <button
                        type="button"
                        role="tab"
                        aria-selected={activeTab === "vkn"}
                        className={activeTab === "vkn" ? "tab-btn active" : "tab-btn"}
                        onClick={() => setActiveTab("vkn")}
                    >
                        VKN Bazlı Uğrama Tutarları
                        <span className="tab-count">{filteredRules.length}</span>
                    </button>
                </nav>

                {activeTab === "ikizDepo" && (
                    <section className="rule-card">
                        <div className="rule-card-left">
                            <div className="rule-icon" aria-hidden="true">
                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M3 10.5 12 4l9 6.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M5 9.5V19a1 1 0 0 0 1 1h4v-5h4v5h4a1 1 0 0 0 1-1V9.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>

                            <div>
                                <h2>İkiz Depo Şartı</h2>
                                <p>
                                    Güzelhisar-1 ve Güzelhisar-2 gibi aynı depo ikiz
                                    varışlarda uğrama eklenmez.
                                </p>
                            </div>
                        </div>

                        <div className="rule-card-right">
                            <span className={ikizDepoRule.acik ? "status-pill on" : "status-pill"}>
                                {ikizDepoRule.acik ? "Kural Aktif" : "Kural Pasif"}
                            </span>

                            <button
                                type="button"
                                role="switch"
                                aria-checked={ikizDepoRule.acik}
                                className={ikizDepoRule.acik ? "switch on" : "switch"}
                                onClick={toggleIkizDepo}
                                disabled={!canToggleIkizDepo || savingKey === "ikiz_depo-guzelhisar"}
                            >
                                <span className="switch-track">
                                    <span className="switch-thumb" />
                                </span>
                            </button>
                        </div>
                    </section>
                )}

                {activeTab === "vkn" && (
                    <section className="rules-panel">
                        <div className="panel-title">
                            <div>
                                <h2>VKN Bazlı Uğrama Tutarları</h2>
                                <p>{filteredRules.length} benzersiz VKN listeleniyor</p>
                            </div>

                            <div className="search-field">
                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.6" />
                                    <path d="m20 20-3.2-3.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                                </svg>

                                <input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="VKN veya müşteri ara..."
                                    aria-label="VKN veya müşteri ara"
                                />
                            </div>
                        </div>

                        <div className="rules-table-wrap">
                            <table className="rules-table">
                                <thead>
                                    <tr>
                                        {showVkn && <th>VKN</th>}
                                        {showCustomer && <th>Müşteri / Tip</th>}
                                        {showAmount && <th>Tutar</th>}
                                        {showStatus && <th>Durum</th>}
                                        {showRecord && <th>Kayıt</th>}
                                    </tr>
                                </thead>

                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan={colSpan} className="empty-row">
                                                <span className="empty-state">
                                                    <span className="spinner" aria-hidden="true" />
                                                    Yükleniyor...
                                                </span>
                                            </td>
                                        </tr>
                                    ) : filteredRules.length === 0 ? (
                                        <tr>
                                            <td colSpan={colSpan} className="empty-row">
                                                <span className="empty-state">Kayıt bulunamadı.</span>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredRules.map((rule) => {
                                            const rowKey = `${rule.tip}-${rule.anahtar}`;

                                            return (
                                                <tr key={rule.anahtar}>
                                                    {showVkn && (
                                                        <td>
                                                            <span className="vkn-pill">
                                                                {rule.anahtar}
                                                            </span>
                                                        </td>
                                                    )}

                                                    {showCustomer && (
                                                        <td>
                                                            <strong className="customer-name">{rule.label}</strong>
                                                        </td>
                                                    )}

                                                    {showAmount && (
                                                        <td>
                                                            <div className="amount-input">
                                                                <input
                                                                    value={rule.tutar}
                                                                    onChange={(e) =>
                                                                        changeAmount(rule, e.target.value)
                                                                    }
                                                                    inputMode="numeric"
                                                                    aria-label={`${rule.label} uğrama tutarı`}
                                                                    disabled={!canUpdateAmount}
                                                                />
                                                                <span>₺</span>
                                                            </div>
                                                        </td>
                                                    )}

                                                    {showStatus && (
                                                        <td>
                                                            <button
                                                                type="button"
                                                                role="switch"
                                                                aria-checked={rule.acik}
                                                                className={rule.acik ? "switch on" : "switch"}
                                                                onClick={() => toggleRule(rule)}
                                                                disabled={!canToggleStatus || savingKey === rowKey}
                                                            >
                                                                <span className="switch-track">
                                                                    <span className="switch-thumb" />
                                                                </span>
                                                            </button>
                                                        </td>
                                                    )}

                                                    {showRecord && (
                                                        <td>
                                                            <span
                                                                className={
                                                                    savingKey === rowKey
                                                                        ? "save-status saving"
                                                                        : rule._changed
                                                                            ? "save-status pending"
                                                                            : "save-status saved"
                                                                }
                                                            >
                                                                {savingKey === rowKey
                                                                    ? "Kaydediliyor..."
                                                                    : rule._changed
                                                                        ? "Bekliyor"
                                                                        : "Kaydedildi"}
                                                            </span>
                                                        </td>
                                                    )}
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}