import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { supabase } from "./lib/supabaseClient";

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

function NoAccessPage() {
    const navigate = useNavigate();

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
                    Görüntülemek istediğiniz sayfa için hesabınıza tanımlı yetki yok.
                    Erişim talebi oluşturmak için sistem yöneticiniz veya panel admini ile
                    iletişime geçebilirsiniz.
                </p>

                <div className="no-access-info">
                    <div>
                        <strong>Durum</strong>
                        <span>Yetki reddedildi</span>
                    </div>

                    <div>
                        <strong>Önerilen işlem</strong>
                        <span>Admin ile iletişime geçin</span>
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
                        onClick={() => window.history.back()}
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
    const [loading, setLoading] = useState(true);
    const [allowed, setAllowed] = useState(false);

    useEffect(() => {
        async function checkPermission() {
            try {
                const aktifKullanici = JSON.parse(
                    localStorage.getItem("aktifKullanici") || "null"
                );

                if (!aktifKullanici?.id) {
                    setAllowed(false);
                    setLoading(false);
                    return;
                }

                if (aktifKullanici?.rol === "admin") {
                    setAllowed(true);
                    setLoading(false);
                    return;
                }

                const { data: userData, error: userError } = await supabase
                    .from("kullanicilar")
                    .select("rol, yetki_override")
                    .eq("id", aktifKullanici.id)
                    .single();

                if (userError || !userData) {
                    setAllowed(false);
                    setLoading(false);
                    return;
                }

                if (userData.yetki_override) {
                    setAllowed(userData.yetki_override?.[pageKey]?.page === true);
                    setLoading(false);
                    return;
                }

                const { data: roleData, error: roleError } = await supabase
                    .from("yetki_rolleri")
                    .select("perms")
                    .eq("role_key", userData.rol || "kullanici")
                    .single();

                if (roleError || !roleData) {
                    setAllowed(false);
                    setLoading(false);
                    return;
                }

                setAllowed(roleData.perms?.[pageKey]?.page === true);
                setLoading(false);
            } catch (err) {
                console.error("Yetki kontrol hatası:", err);
                setAllowed(false);
                setLoading(false);
            }
        }

        checkPermission();
    }, [pageKey]);

    if (loading) {
        return <div style={{ padding: 24 }}>Yetkiler kontrol ediliyor...</div>;
    }

    if (!allowed) {
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