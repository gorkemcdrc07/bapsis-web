import { useState } from "react";
import {
    Navigate,
    Route,
    Routes,
    useLocation,
    useNavigate,
} from "react-router-dom";

import Login from "./pages/Login";
import Layout from "./components/Layout/Layout";
import Anasayfa from "./pages/Anasayfa";
import YetkilendirmePanel from "./pages/YetkilendirmePanel";

import Planlama from "./pages/bimafyon/planlama";
import ManuelSiparis from "./pages/bimafyon/manuelsiparis";
import AktifSeferler from "./pages/bimafyon/aktifseferler";
import SilinenSeferler from "./pages/bimafyon/silinenseferler";
import TamamlananSeferler from "./pages/bimafyon/tamamlananseferler";
import QrOkutma from "./pages/bimafyon/aktifseferler/qrokutma";

import Araclar from "./pages/aracyonetimi/araclar";

import DonusSiparis from "./pages/Donusler/Siparis";
import DonusPlakaAtama from "./pages/Donusler/PlakaAtama";
import DonusTamamlananSeferler from "./pages/Donusler/TamamlananSeferler";
import DonusNavlunlar from "./pages/Donusler/Navlunlar";

import Vkn from "./pages/ekkayitlar/vkn";
import UgramaSart from "./pages/ekkayitlar/ugramasart";
import NavlunSart from "./pages/ekkayitlar/navlunsart";

import { useAuth } from "./context/AuthContext";
import { useSettings } from "./context/SettingsContext";

const PAGE_KEYS: Record<string, string> = {
    anasayfa: "anasayfa",
    planlama: "bim_planlama",
    manuelSiparis: "bim_manuel",
    aktifSeferler: "bim_aktif",
    silinenSeferler: "bim_silinen",
    tamamlananSeferler: "bim_tamamlanan",
    araclar: "araclar",
    donusSiparis: "donus_siparis",
    donusPlaka: "donus_plaka",
    donusTamamlanan: "donus_tamamlanan",
    donusNavlun: "donus_navlun",
    vkn: "ekkayit_vkn",
    ugrama: "ekkayit_ugrama",
    navlun: "ekkayit_navlun",
};

const SCREEN_NAMES: Record<string, string> = {
    "/anasayfa": "Anasayfa",

    "/bimafyon/planlama": "BİM Afyon / Planlama",
    "/bimafyon/manuelsiparis": "BİM Afyon / Manuel Sipariş",
    "/bimafyon/aktifseferler": "BİM Afyon / Aktif Seferler",
    "/bimafyon/silinenseferler": "BİM Afyon / Silinen Seferler",
    "/bimafyon/tamamlananseferler": "BİM Afyon / Tamamlanan Seferler",

    "/donusler/siparis": "Dönüşler / Sipariş Oluştur",
    "/donusler/plakaatama": "Dönüşler / Plaka Atama",
    "/donusler/tamamlananseferler": "Dönüşler / Tamamlanan Seferler",
    "/donusler/navlunlar": "Dönüşler / Navlunlar",

    "/aracyonetimi/araclar": "Araç Yönetimi / Araçlar",

    "/ekkayitlar/vkn": "Ek Kayıtlar / VKN",
    "/ekkayitlar/ugrama": "Ek Kayıtlar / Uğrama Şartı",
    "/ekkayitlar/navlun": "Ek Kayıtlar / Navlun Şartı",
};

function AuthLoadingPage() {
    return <div style={{ padding: 24 }}>Yetkiler yükleniyor...</div>;
}

function NoAccessPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();

    const ekranAdi = SCREEN_NAMES[location.pathname] || location.pathname;

    const kullaniciAdi =
        user?.ad ||
        user?.kullanici_adi ||
        "Bilinmeyen kullanıcı";

    const rol = user?.rol || "kullanici";
    const tarih = new Date().toLocaleString("tr-TR");

    return (
        <div className="no-access-page">
            <div className="no-access-bg-orb orb-one" />
            <div className="no-access-bg-orb orb-two" />

            <section className="no-access-card">
                <div className="no-access-top">
                    <div className="no-access-icon">
                        <span>🔒</span>
                    </div>

                    <span className="no-access-badge">Erişim Kısıtlandı</span>
                </div>

                <h2>Bu sayfaya erişim yetkiniz bulunmuyor</h2>

                <p>
                    Bu kullanıcı hesabı ile aşağıdaki ekrana erişim izniniz
                    bulunmamaktadır. Yetki gerekiyorsa sistem yöneticinizle
                    iletişime geçebilirsiniz.
                </p>

                <div className="no-access-info">
                    <div>
                        <strong>Erişilmek İstenen Ekran</strong>
                        <span>{ekranAdi}</span>
                    </div>

                    <div>
                        <strong>Kullanıcı</strong>
                        <span>{kullaniciAdi}</span>
                    </div>

                    <div>
                        <strong>Rol</strong>
                        <span>{rol}</span>
                    </div>

                    <div>
                        <strong>Tarih</strong>
                        <span>{tarih}</span>
                    </div>

                    <div>
                        <strong>Durum</strong>
                        <span>Yetki bulunamadı</span>
                    </div>

                    <div>
                        <strong>Çözüm</strong>
                        <span>Sistem yöneticiniz ile iletişime geçiniz.</span>
                    </div>
                </div>

                <div className="no-access-actions">
                    <button
                        type="button"
                        className="no-access-primary"
                        onClick={() => navigate("/anasayfa")}
                    >
                        Anasayfaya Dön
                    </button>

                    <button
                        type="button"
                        className="no-access-secondary"
                        onClick={() => navigate(-1)}
                    >
                        Geri Git
                    </button>
                </div>
            </section>
        </div>
    );
}

function ProtectedPage({
    pageKey,
    children,
}: {
    pageKey: string;
    children: JSX.Element;
}) {
    const { loading, user, canPage } = useAuth();
    const { loadingSettings } = useSettings();

    if (loading || loadingSettings) {
        return <AuthLoadingPage />;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (!canPage(pageKey)) {
        return <NoAccessPage />;
    }

    return children;
}
function App() {
    const [yetkiPanelAcik, setYetkiPanelAcik] = useState(false);

    const openYetkiPanel = () => {
        setYetkiPanelAcik(true);
    };

    return (
        <>
            <Routes>
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<Login />} />

                <Route
                    path="/yetkilendirme-panel"
                    element={<Navigate to="/anasayfa" replace />}
                />

                <Route element={<Layout onOpenYetkiPanel={openYetkiPanel} />}>
                    <Route
                        path="/anasayfa"
                        element={
                            <ProtectedPage pageKey={PAGE_KEYS.anasayfa}>
                                <Anasayfa onOpenYetkiPanel={openYetkiPanel} />
                            </ProtectedPage>
                        }
                    />

                    <Route
                        path="/bimafyon/planlama"
                        element={
                            <ProtectedPage pageKey={PAGE_KEYS.planlama}>
                                <Planlama />
                            </ProtectedPage>
                        }
                    />

                    <Route
                        path="/bimafyon/manuelsiparis"
                        element={
                            <ProtectedPage pageKey={PAGE_KEYS.manuelSiparis}>
                                <ManuelSiparis />
                            </ProtectedPage>
                        }
                    />

                    <Route
                        path="/bimafyon/aktifseferler"
                        element={
                            <ProtectedPage pageKey={PAGE_KEYS.aktifSeferler}>
                                <AktifSeferler />
                            </ProtectedPage>
                        }
                    />

                    <Route
                        path="/bimafyon/silinenseferler"
                        element={
                            <ProtectedPage pageKey={PAGE_KEYS.silinenSeferler}>
                                <SilinenSeferler />
                            </ProtectedPage>
                        }
                    />

                    <Route
                        path="/bimafyon/tamamlananseferler"
                        element={
                            <ProtectedPage pageKey={PAGE_KEYS.tamamlananSeferler}>
                                <TamamlananSeferler />
                            </ProtectedPage>
                        }
                    />

                    <Route
                        path="/bimafyon/aktifseferler/qrokutma"
                        element={<QrOkutma onSuccess={() => { }} />}
                    />

                    <Route
                        path="/aracyonetimi/araclar"
                        element={
                            <ProtectedPage pageKey={PAGE_KEYS.araclar}>
                                <Araclar />
                            </ProtectedPage>
                        }
                    />

                    <Route
                        path="/donusler/siparis"
                        element={
                            <ProtectedPage pageKey={PAGE_KEYS.donusSiparis}>
                                <DonusSiparis />
                            </ProtectedPage>
                        }
                    />

                    <Route
                        path="/donusler/plakaatama"
                        element={
                            <ProtectedPage pageKey={PAGE_KEYS.donusPlaka}>
                                <DonusPlakaAtama />
                            </ProtectedPage>
                        }
                    />

                    <Route
                        path="/donusler/tamamlananseferler"
                        element={
                            <ProtectedPage pageKey={PAGE_KEYS.donusTamamlanan}>
                                <DonusTamamlananSeferler />
                            </ProtectedPage>
                        }
                    />

                    <Route
                        path="/donusler/navlunlar"
                        element={
                            <ProtectedPage pageKey={PAGE_KEYS.donusNavlun}>
                                <DonusNavlunlar />
                            </ProtectedPage>
                        }
                    />

                    <Route
                        path="/ekkayitlar/vkn"
                        element={
                            <ProtectedPage pageKey={PAGE_KEYS.vkn}>
                                <Vkn />
                            </ProtectedPage>
                        }
                    />

                    <Route
                        path="/ekkayitlar/ugrama"
                        element={
                            <ProtectedPage pageKey={PAGE_KEYS.ugrama}>
                                <UgramaSart />
                            </ProtectedPage>
                        }
                    />

                    <Route
                        path="/ekkayitlar/navlun"
                        element={
                            <ProtectedPage pageKey={PAGE_KEYS.navlun}>
                                <NavlunSart />
                            </ProtectedPage>
                        }
                    />
                </Route>
            </Routes>

            {yetkiPanelAcik && (
                <YetkilendirmePanel onClose={() => setYetkiPanelAcik(false)} />
            )}
        </>
    );
}

export default App;