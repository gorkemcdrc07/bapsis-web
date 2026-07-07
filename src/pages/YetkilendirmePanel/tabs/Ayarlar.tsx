import { useEffect, useState } from "react";
import { useSettings } from "../../../context/SettingsContext";
import { supabase } from "../../../lib/supabaseClient";
import { logKaydet } from "../../../lib/logger";

type TabId =
    | "genel"
    | "arayuz"
    | "guvenlik"
    | "kullanicilar"
    | "bildirimler"
    | "entegrasyon"
    | "yedekleme"
    | "lisans"
    | "aktifOturumlar";

interface Tab {
    id: TabId;
    label: string;
    icon: string;
    group: string;
}

const TABS: Tab[] = [
    { id: "genel", label: "Genel", icon: "ti ti-building", group: "Genel" },
    { id: "arayuz", label: "Arayüz", icon: "ti ti-palette", group: "Genel" },
    { id: "guvenlik", label: "Güvenlik", icon: "ti ti-shield-lock", group: "Güvenlik ve Erişim" },
    { id: "kullanicilar", label: "Kullanıcı ve Roller", icon: "ti ti-users", group: "Güvenlik ve Erişim" },
    { id: "bildirimler", label: "Bildirimler", icon: "ti ti-bell", group: "Sistem" },
    { id: "entegrasyon", label: "Entegrasyonlar", icon: "ti ti-api", group: "Sistem" },
    { id: "yedekleme", label: "Yedekleme ve Veri", icon: "ti ti-database", group: "Sistem" },
    { id: "aktifOturumlar", label: "Aktif Oturumlar", icon: "ti ti-devices", group: "Sistem" },
    { id: "lisans", label: "Lisans ve Destek", icon: "ti ti-award", group: "Sistem" },
];

const GROUP_ORDER = ["Genel", "Güvenlik ve Erişim", "Sistem"];

export default function Ayarlar() {
    const [activeTab, setActiveTab] = useState<TabId>("genel");
    const [aktifOturumlar, setAktifOturumlar] = useState<any[]>([]);
    const [oturumlarLoading, setOturumlarLoading] = useState(false);

    const {
        settings,
        updateSetting,
        saveSettings,
        discardSettings,
        loadingSettings,
        savingSettings,
        isSettingsDirty,
        lastSavedAt,
    } = useSettings();

    useEffect(() => {
        if (activeTab === "aktifOturumlar") {
            aktifOturumlariYukle();
        }
    }, [activeTab]);

    async function handleSave() {
        const ok = await saveSettings();

        if (!ok) {
            alert("Ayarlar kaydedilirken hata oluştu.");
        }
    }

    async function aktifOturumlariYukle() {
        setOturumlarLoading(true);

        const { data, error } = await supabase
            .from("aktif_oturumlar")
            .select("*")
            .order("son_islem_at", { ascending: false });

        if (error) {
            console.error("Aktif oturumlar alınamadı:", error);
            setOturumlarLoading(false);
            return;
        }

        setAktifOturumlar(data || []);
        setOturumlarLoading(false);
    }

    async function oturumuSonlandir(sessionId: string, kullaniciAdi?: string) {
        const onay = window.confirm(
            `${kullaniciAdi || "Bu kullanıcı"} oturumunu sonlandırmak istiyor musunuz?`
        );

        if (!onay) return;

        const { error } = await supabase
            .from("aktif_oturumlar")
            .update({
                aktif: false,
                force_logout: true,
                terminated_at: new Date().toISOString(),
                terminated_by: "admin",
                terminate_reason: "Admin tarafından sonlandırıldı.",
            })
            .eq("session_id", sessionId);

        if (error) {
            console.error("Oturum sonlandırılamadı:", error);
            alert("Oturum sonlandırılırken hata oluştu.");
            return;
        }

        await logKaydet({
            seviye: "uyari",
            kategori: "Oturum",
            mesaj: "Admin kullanıcı oturumunu sonlandırdı",
            detay: `${kullaniciAdi || "Bilinmeyen kullanıcı"} oturumu sonlandırıldı.`,
        });

        await aktifOturumlariYukle();
    }



    if (loadingSettings) {
        return (
            <div className="settings-page">
                <div className="settings-loading">
                    <i className="ti ti-loader-2 settings-spin" />
                    Ayarlar yükleniyor...
                </div>
            </div>
        );
    }

    async function tumCihazlardanCikar(kullaniciId: string, kullaniciAdi?: string) {
        const onay = window.confirm(
            `${kullaniciAdi || "Bu kullanıcı"} tüm cihazlardan çıkarılsın mı?`
        );

        if (!onay) return;

        const { error } = await supabase
            .from("aktif_oturumlar")
            .update({
                aktif: false,
                force_logout: true,
                terminated_at: new Date().toISOString(),
                terminated_by: "admin",
                terminate_reason: "Admin tarafından tüm cihazlardan çıkarıldı.",
            })
            .eq("kullanici_id", String(kullaniciId))
            .eq("aktif", true);

        if (error) {
            console.error("Tüm cihazlardan çıkarılamadı:", error);
            alert("Tüm cihazlardan çıkarılırken hata oluştu.");
            return;
        }

        await logKaydet({
            seviye: "uyari",
            kategori: "Oturum",
            mesaj: "Admin kullanıcıyı tüm cihazlardan çıkardı",
            detay: `${kullaniciAdi || "Bilinmeyen kullanıcı"} tüm cihazlardan çıkarıldı.`,
        });

        await aktifOturumlariYukle();
    }



    return (
        <div className="settings-page">
            <div className="settings-top">
                <div className="settings-top-heading">
                    <span className="settings-eyebrow">Sistem Yönetimi</span>
                    <h2>Sistem Ayarları</h2>
                    <p>Kurum genelinde arayüz, güvenlik, bildirim ve entegrasyon tercihlerini yönetin.</p>
                </div>

                <div className="settings-top-actions">
                    {lastSavedAt && !isSettingsDirty && (
                        <span className="settings-saved-note">
                            <i className="ti ti-circle-check" />
                            Son kayıt: {lastSavedAt}
                        </span>
                    )}

                    {isSettingsDirty && (
                        <button className="settings-discard-btn" onClick={discardSettings} type="button">
                            Değişiklikleri Geri Al
                        </button>
                    )}

                    <button
                        className="settings-save-btn"
                        onClick={handleSave}
                        disabled={!isSettingsDirty || savingSettings}
                        data-state={savingSettings ? "saving" : isSettingsDirty ? "dirty" : "clean"}
                        type="button"
                    >
                        <i className={savingSettings ? "ti ti-loader-2 settings-spin" : "ti ti-device-floppy"} />
                        {savingSettings ? "Kaydediliyor..." : "Kaydet"}
                    </button>
                </div>
            </div>

            <div className="settings-body">
                <nav className="settings-nav">
                    {GROUP_ORDER.map((group) => (
                        <div className="settings-nav-group" key={group}>
                            <span className="settings-nav-group-label">{group}</span>

                            {TABS.filter((t) => t.group === group).map((tab) => (
                                <button
                                    key={tab.id}
                                    className={"settings-nav-item" + (activeTab === tab.id ? " active" : "")}
                                    onClick={() => setActiveTab(tab.id)}
                                    type="button"
                                >
                                    <i className={tab.icon} />
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    ))}
                </nav>

                <div className="settings-scroll">
                    {activeTab === "genel" && (
                        <Panel title="Genel Bilgiler" desc="Kurum kimliği, bölge ve biçim tercihlerini düzenleyin.">
                            <Input title="Şirket Adı" value={settings.companyName} onChange={(v) => updateSetting("companyName", v)} />
                            <Input title="Şirket / Vergi Kodu" value={settings.companyCode} onChange={(v) => updateSetting("companyCode", v)} />
                            <Select title="Sistem Dili" value={settings.language} options={["Türkçe", "English", "Deutsch"]} onChange={(v) => updateSetting("language", v)} />
                            <Select title="Saat Dilimi" value={settings.timezone} options={["İstanbul (UTC+03:00)", "Londra (UTC+00:00)", "New York (UTC-05:00)"]} onChange={(v) => updateSetting("timezone", v)} />
                            <Select title="Tarih Formatı" value={settings.dateFormat} options={["GG.AA.YYYY", "AA/GG/YYYY", "YYYY-AA-GG"]} onChange={(v) => updateSetting("dateFormat", v)} />
                            <Select title="Para Birimi" value={settings.currency} options={["₺ Türk Lirası", "$ Amerikan Doları", "€ Euro"]} onChange={(v) => updateSetting("currency", v)} />
                        </Panel>
                    )}

                    {activeTab === "arayuz" && (
                        <Panel title="Arayüz" desc="Görünüm, yoğunluk ve varsayılan sayfa tercihleri.">
                            <div className="setting-item setting-item--wide">
                                <div>
                                    <strong>Tema</strong>
                                    <span>Uygulama genelinde kullanılacak renk şeması.</span>
                                </div>

                                <div className="theme-options">
                                    <ThemeOption label="Aydınlık" icon="ti ti-sun" active={settings.theme === "light"} onClick={() => updateSetting("theme", "light")} />
                                    <ThemeOption label="Karanlık" icon="ti ti-moon" active={settings.theme === "dark"} onClick={() => updateSetting("theme", "dark")} />
                                    <ThemeOption label="Sistem" icon="ti ti-device-desktop" active={settings.theme === "system"} onClick={() => updateSetting("theme", "system")} />
                                </div>
                            </div>

                            <Toggle title="Kompakt Tablo" desc="Tablo satırlarını daha sıkı göster." checked={settings.compactTable} onChange={(v) => updateSetting("compactTable", v)} />
                            <Toggle title="Kenar Çubuğunu Daralt" desc="Sistem varsayılan olarak daraltılmış menü ile açılsın." checked={settings.collapsedSidebar} onChange={(v) => updateSetting("collapsedSidebar", v)} />
                            <Select title="Dashboard Varsayılanı" value={settings.defaultDashboard} options={["Ana Dashboard", "Tedarik Analiz", "Fatura Dashboard"]} onChange={(v) => updateSetting("defaultDashboard", v)} />
                            <Select title="Açılış Sayfası" value={settings.landingPage} options={["Dashboard", "Kullanıcılar", "Yetkilendirme", "Ayarlar"]} onChange={(v) => updateSetting("landingPage", v)} />
                            <Select title="Yazı Tipi Boyutu" value={settings.fontSize} options={["Küçük", "Orta", "Büyük"]} onChange={(v) => updateSetting("fontSize", v)} />
                        </Panel>
                    )}

                    {activeTab === "guvenlik" && (
                        <Panel title="Güvenlik" desc="Oturum, erişim ve kimlik doğrulama politikaları.">
                            <DurationInput
                                title="Oturum Süresi"
                                desc="Kullanıcı belirtilen süre boyunca işlem yapmazsa sistemden otomatik çıkış yapılır."
                                value={settings.sessionDurationValue}
                                unit={settings.sessionDurationUnit}
                                onValueChange={(v) => updateSetting("sessionDurationValue", v)}
                                onUnitChange={(v) => updateSetting("sessionDurationUnit", v)}
                            />
                            <Toggle title="Çoklu Giriş İzni" desc="Aynı hesap birden fazla cihazda açık kalabilir." checked={settings.multiLogin} onChange={(v) => updateSetting("multiLogin", v)} />
                            <Toggle title="İki Adımlı Doğrulama Zorunlu" desc="Tüm kullanıcılar için 2FA girişini zorunlu kıl." checked={settings.require2FA} onChange={(v) => updateSetting("require2FA", v)} />
                            <Select title="Şifre Süresi" value={settings.passwordExpiry} options={["30 Gün", "60 Gün", "90 Gün", "Süresiz"]} onChange={(v) => updateSetting("passwordExpiry", v)} />
                            <Select title="Başarısız Giriş Kilidi" value={settings.loginLockout} options={["3 Deneme", "5 Deneme", "10 Deneme"]} onChange={(v) => updateSetting("loginLockout", v)} />
                            <Toggle title="Admin Kilidi" desc="Kritik işlemlerde ek yönetici onayı gerekir." checked={settings.adminLock} onChange={(v) => updateSetting("adminLock", v)} />
                            <Input title="IP Kısıtlama" placeholder="192.168.1.0/24" value={settings.ipRestriction} onChange={(v) => updateSetting("ipRestriction", v)} />
                        </Panel>
                    )}

                    {activeTab === "kullanicilar" && (
                        <Panel title="Kullanıcı ve Roller" desc="Yeni üyelik, rol ve yetkilendirme kuralları.">
                            <Toggle title="Yeni Kullanıcılar İçin Onay Gerekli" desc="Kayıt olan kullanıcılar yönetici onayı olmadan sisteme giremez." checked={settings.userApprovalRequired} onChange={(v) => updateSetting("userApprovalRequired", v)} />
                            <Select title="Varsayılan Rol" value={settings.defaultRole} options={["Görüntüleyici", "Editör", "Yönetici"]} onChange={(v) => updateSetting("defaultRole", v)} />
                            <Toggle title="Rol Değişikliklerini Logla" desc="Rol ve yetki değişiklikleri denetim günlüğüne kaydedilir." checked={settings.logRoleChanges} onChange={(v) => updateSetting("logRoleChanges", v)} />
                            <Input title="Maksimum Kullanıcı Sayısı" placeholder="Sınırsız için boş bırakın" value={settings.maxUsers} onChange={(v) => updateSetting("maxUsers", v)} />
                        </Panel>
                    )}

                    {activeTab === "bildirimler" && (
                        <Panel title="Bildirimler" desc="Hangi olaylarda, hangi kanaldan bilgilendirileceğinizi seçin.">
                            <Toggle title="Mail Bildirimleri" desc="Önemli işlemlerde e-posta gönder." checked={settings.mailNotifications} onChange={(v) => updateSetting("mailNotifications", v)} />
                            <Toggle title="Sistem Bildirimleri" desc="Uygulama içi bildirimleri aktif et." checked={settings.systemNotifications} onChange={(v) => updateSetting("systemNotifications", v)} />
                            <Toggle title="Hata Bildirimleri" desc="Kritik hatalarda uyarı oluştur." checked={settings.errorNotifications} onChange={(v) => updateSetting("errorNotifications", v)} />
                            <Toggle title="Haftalık Özet Raporu" desc="Her hafta başında özet performans raporu gönder." checked={settings.weeklyDigest} onChange={(v) => updateSetting("weeklyDigest", v)} />
                            <Select title="Bildirim Sıklığı" value={settings.notificationFrequency} options={["Anlık", "Günlük Özet", "Haftalık Özet"]} onChange={(v) => updateSetting("notificationFrequency", v)} />
                            <Input title="Bildirim Alıcı E-postası" placeholder="bildirim@sirket.com" value={settings.notificationEmail} onChange={(v) => updateSetting("notificationEmail", v)} />
                        </Panel>
                    )}

                    {activeTab === "entegrasyon" && (
                        <Panel title="Entegrasyonlar" desc="Dış servis bağlantıları ve API erişim bilgileri.">
                            <Input title="API URL" placeholder="https://api.example.com" value={settings.apiUrl} onChange={(v) => updateSetting("apiUrl", v)} />
                            <Input title="API Anahtarı" placeholder="••••••••••••••••" type="password" value={settings.apiKey} onChange={(v) => updateSetting("apiKey", v)} />
                            <Input title="Webhook" placeholder="https://webhook.example.com" value={settings.webhook} onChange={(v) => updateSetting("webhook", v)} />
                            <Input title="SMTP Sunucusu" placeholder="smtp.domain.com" value={settings.smtpServer} onChange={(v) => updateSetting("smtpServer", v)} />
                            <Input title="SMTP Portu" placeholder="587" value={settings.smtpPort} onChange={(v) => updateSetting("smtpPort", v)} />
                            <Toggle title="Tek Oturum Açma (SSO)" desc="Google veya Microsoft hesabıyla girişe izin ver." checked={settings.ssoEnabled} onChange={(v) => updateSetting("ssoEnabled", v)} />
                        </Panel>
                    )}

                    {activeTab === "yedekleme" && (
                        <Panel title="Yedekleme ve Veri" desc="Otomatik yedekleme, saklama süresi ve dışa aktarma.">
                            <Select title="Otomatik Yedekleme Sıklığı" value={settings.backupFrequency} options={["Günlük", "Haftalık", "Aylık", "Kapalı"]} onChange={(v) => updateSetting("backupFrequency", v)} />
                            <Select title="Veri Saklama Süresi" value={settings.retentionPeriod} options={["30 Gün", "90 Gün", "1 Yıl", "Süresiz"]} onChange={(v) => updateSetting("retentionPeriod", v)} />
                            <Toggle title="Bulut Yedekleme" desc="Yedekler kurumsal bulut depolama alanına da kopyalanır." checked={settings.cloudBackup} onChange={(v) => updateSetting("cloudBackup", v)} />
                        </Panel>
                    )}

                    {activeTab === "aktifOturumlar" && (
                        <Panel
                            title="Aktif Oturumlar"
                            desc="Sisteme bağlı kullanıcı oturumlarını izleyin ve gerektiğinde sonlandırın."
                        >
                            <div className="session-dashboard">
                                <div className="session-summary-card">
                                    <strong>{aktifOturumlar.filter((x) => x.aktif).length}</strong>
                                    <span>Aktif Oturum</span>
                                </div>

                                <div className="session-summary-card">
                                    <strong>{aktifOturumlar.filter((x) => !x.aktif).length}</strong>
                                    <span>Kapalı Oturum</span>
                                </div>

                                <div className="session-summary-card">
                                    <strong>{aktifOturumlar.length}</strong>
                                    <span>Toplam Kayıt</span>
                                </div>
                            </div>

                            <div className="session-list-wrap">
                                {oturumlarLoading ? (
                                    <div className="settings-loading">Oturumlar yükleniyor...</div>
                                ) : aktifOturumlar.length === 0 ? (
                                    <div className="session-empty-state">
                                        <i className="ti ti-devices-off" />
                                        <strong>Aktif oturum bulunamadı</strong>
                                        <span>Henüz sisteme bağlı kullanıcı oturumu yok.</span>
                                    </div>
                                ) : (
                                    <div className="session-list">
                                        {aktifOturumlar.map((oturum) => (
                                            <div
                                                key={oturum.id || oturum.session_id}
                                                className={"session-card" + (oturum.aktif ? " active" : " passive")}
                                            >
                                                <div className="session-user">
                                                    <div className="session-avatar">
                                                        {(oturum.ad || oturum.kullanici_adi || "?")
                                                            .charAt(0)
                                                            .toUpperCase()}
                                                    </div>

                                                    <div>
                                                        <strong>{oturum.ad || oturum.kullanici_adi || "Bilinmeyen Kullanıcı"}</strong>
                                                        <span>{oturum.kullanici_adi || "-"}</span>
                                                    </div>
                                                </div>

                                                <div className="session-meta-grid">
                                                    <div>
                                                        <small>Rol</small>
                                                        <b>{oturum.rol || "-"}</b>
                                                    </div>

                                                    <div>
                                                        <small>Cihaz</small>
                                                        <b>{oturum.cihaz || "-"}</b>
                                                    </div>

                                                    <div>
                                                        <small>Tarayıcı</small>
                                                        <b>{oturum.tarayici || "-"}</b>
                                                    </div>

                                                    <div>
                                                        <small>Platform</small>
                                                        <b>{oturum.platform || "-"}</b>
                                                    </div>

                                                    <div>
                                                        <small>Son İşlem</small>
                                                        <b>
                                                            {oturum.son_islem_at
                                                                ? new Date(oturum.son_islem_at).toLocaleString("tr-TR")
                                                                : "-"}
                                                        </b>
                                                    </div>

                                                    <div>
                                                        <small>Durum</small>
                                                        <span className={oturum.aktif ? "session-pill active" : "session-pill passive"}>
                                                            {oturum.aktif ? "Aktif" : "Kapalı"}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="session-actions">
                                                    {oturum.aktif ? (
                                                        <div className="session-action-stack">
                                                            <button
                                                                type="button"
                                                                className="session-kill-modern"
                                                                onClick={() =>
                                                                    oturumuSonlandir(
                                                                        oturum.session_id,
                                                                        oturum.ad || oturum.kullanici_adi
                                                                    )
                                                                }
                                                            >
                                                                <i className="ti ti-logout" />
                                                                Oturumu Sonlandır
                                                            </button>

                                                            <button
                                                                type="button"
                                                                className="session-kill-all-modern"
                                                                onClick={() =>
                                                                    tumCihazlardanCikar(
                                                                        oturum.kullanici_id,
                                                                        oturum.ad || oturum.kullanici_adi
                                                                    )
                                                                }
                                                            >
                                                                <i className="ti ti-devices-x" />
                                                                Tüm Cihazlardan Çıkar
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className="session-ended-modern">
                                                            <i className="ti ti-circle-check" />
                                                            Oturum sonlandı
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </Panel>
                    )}
                    {activeTab === "lisans" && (
                        <Panel title="Lisans ve Destek" desc="Plan bilgileri, kullanım limitleri ve destek kanalları.">
                            <div className="license-card">
                                <div className="license-card-row">
                                    <span>Mevcut Plan</span>
                                    <strong>Kurumsal</strong>
                                </div>
                                <div className="license-card-row">
                                    <span>Yenileme Tarihi</span>
                                    <strong>01.01.2027</strong>
                                </div>
                                <div className="license-card-row">
                                    <span>Kullanıcı Limiti</span>
                                    <strong>250 Kullanıcı</strong>
                                </div>
                                <div className="license-card-row">
                                    <span>Depolama</span>
                                    <strong>500 GB / 1 TB kullanıldı</strong>
                                </div>
                            </div>
                        </Panel>
                    )}
                </div>
            </div>
        </div>
    );
}

function Panel({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
    return (
        <section className="settings-section">
            <div className="settings-section-title">
                <h3>{title}</h3>
                {desc && <p>{desc}</p>}
            </div>
            <div className="settings-grid">{children}</div>
        </section>
    );
}

function Toggle({ title, desc, checked, onChange }: any) {
    return (
        <div className="setting-item">
            <div>
                <strong>{title}</strong>
                {desc && <span>{desc}</span>}
            </div>

            <label className="setting-switch">
                <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
                <span />
            </label>
        </div>
    );
}

function Select({ title, value, options, onChange }: any) {
    return (
        <div className="setting-item">
            <div>
                <strong>{title}</strong>
                <span>Varsayılan tercih seçimi.</span>
            </div>

            <select className="setting-control" value={value} onChange={(e) => onChange(e.target.value)}>
                {options.map((item: string) => (
                    <option key={item}>{item}</option>
                ))}
            </select>
        </div>
    );
}

function Input({ title, placeholder, type = "text", value, onChange }: any) {
    return (
        <div className="setting-item">
            <div>
                <strong>{title}</strong>
                <span>Sistem bağlantı bilgisi.</span>
            </div>

            <input
                className="setting-control"
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
        </div>
    );
}

function ThemeOption({ label, icon, active, onClick }: any) {
    return (
        <button
            className={"theme-option" + (active ? " active" : "")}
            onClick={onClick}
            type="button"
        >
            <i className={icon} />
            <span>{label}</span>
        </button>
    );
}

function DurationInput({
    title,
    desc,
    value,
    unit,
    onValueChange,
    onUnitChange,
}: any) {
    return (
        <div className="setting-item">
            <div>
                <strong>{title}</strong>
                {desc && <span>{desc}</span>}
            </div>

            <div className="duration-control">
                <input
                    className="setting-control duration-input"
                    type="number"
                    min={1}
                    max={9999}
                    value={value}
                    onChange={(e) => onValueChange(Number(e.target.value))}
                />

                <select
                    className="setting-control duration-select"
                    value={unit}
                    onChange={(e) => onUnitChange(e.target.value)}
                >
                    <option value="minute">Dakika</option>
                    <option value="hour">Saat</option>
                </select>
            </div>
        </div>
    );
}