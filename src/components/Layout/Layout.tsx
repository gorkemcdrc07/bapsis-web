import { useMemo, useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import "./Layout.css";

type MenuKey = "bim" | "donus" | "arac" | "ek" | null;

function Layout() {
    const navigate = useNavigate();
    const [openMenu, setOpenMenu] = useState<MenuKey>(null);

    const aktifKullanici = useMemo(() => {
        try {
            return JSON.parse(localStorage.getItem("aktifKullanici") || "null");
        } catch {
            return null;
        }
    }, []);

    const kullaniciAdi =
        aktifKullanici?.ad || aktifKullanici?.kullanici_adi || "Kullanıcı";

    const kullaniciKodu = aktifKullanici?.kullanici_adi || "kullanici";
    const rol = aktifKullanici?.rol || "personel";

    const toggleMenu = (menu: MenuKey) => {
        setOpenMenu(openMenu === menu ? null : menu);
    };

    const handleLogout = () => {
        localStorage.removeItem("aktifKullanici");
        navigate("/");
    };

    return (
        <div className="layout-page" onClick={() => setOpenMenu(null)}>
            <header className="app-topbar" onClick={(e) => e.stopPropagation()}>
                <Link to="/anasayfa" className="brand">
                    <div className="brand-logo">B</div>

                    <div>
                        <h1>BAPSİS WEB V2</h1>
                        <p>Operasyon Yönetim Paneli</p>
                    </div>
                </Link>

                <nav className="app-navbar">
                    <div className="menu-item">
                        <button type="button" onClick={() => toggleMenu("bim")}>
                            BİM AFYON
                        </button>

                        {openMenu === "bim" && (
                            <div className="menu-dropdown">
                                <Link to="/bimafyon/planlama">Planlama</Link>
                                <Link to="/bimafyon/manuelsiparis">Manuel Sipariş</Link>
                                <Link to="/bimafyon/aktifseferler">Aktif Seferler</Link>
                                <Link to="/bimafyon/silinenseferler">Silinen Seferler</Link>
                                <Link to="/bimafyon/tamamlananseferler">
                                    Tamamlanan Seferler
                                </Link>
                            </div>
                        )}
                    </div>

                    <div className="menu-item">
                        <button type="button" onClick={() => toggleMenu("donus")}>
                            DÖNÜŞLER
                        </button>

                        {openMenu === "donus" && (
                            <div className="menu-dropdown">
                                <Link to="/donusler/siparis">Sipariş Oluştur</Link>
                                <Link to="/donusler/plakaatama">Plaka Atama</Link>
                                <Link to="/donusler/tamamlananseferler">Tamamlanan Seferler</Link>
                                <Link to="/donusler/navlunlar">Navlunlar</Link>
                            </div>
                        )}
                    </div>

                    <div className="menu-item">
                        <button type="button" onClick={() => toggleMenu("arac")}>
                            ARAÇ YÖNETİMİ
                        </button>

                        {openMenu === "arac" && (
                            <div className="menu-dropdown">
                                <Link to="/aracyonetimi/araclar">Araçlar</Link>
                            </div>
                        )}
                    </div>

                    <div className="menu-item">
                        <button type="button" onClick={() => toggleMenu("ek")}>
                            EK KAYITLAR
                        </button>

                        {openMenu === "ek" && (
                            <div className="menu-dropdown">
                                <Link to="/ekkayitlar/vkn">VKN Ekle</Link>
                                <Link to="/ekkayitlar/ugrama">Uğrama Şartı Ekle</Link>
                                <Link to="/ekkayitlar/navlun">Navlun Şartı Ekle</Link>
                            </div>
                        )}
                    </div>
                </nav>

                <div className="user-box">
                    <div className="user-avatar">
                        {kullaniciAdi.charAt(0).toLocaleUpperCase("tr-TR")}
                    </div>

                    <div className="user-meta">
                        <strong>{kullaniciAdi}</strong>
                        <p>
                            @{kullaniciKodu} · {rol}
                        </p>
                    </div>

                    <button type="button" className="logout-button" onClick={handleLogout}>
                        Çıkış
                    </button>
                </div>
            </header>

            <main className="layout-content">
                <Outlet />
            </main>
        </div>
    );
}

export default Layout;