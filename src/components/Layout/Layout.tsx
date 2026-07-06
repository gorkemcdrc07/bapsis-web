import { useMemo, useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import "./Layout.css";

type MenuKey = "bim" | "donus" | "arac" | "ek" | null;

interface LayoutProps {
    onOpenYetkiPanel: () => void;
}

const MENU_GROUPS = {
    bim: [
        { to: "/bimafyon/planlama", label: "Planlama" },
        { to: "/bimafyon/manuelsiparis", label: "Manuel Sipariş" },
        { to: "/bimafyon/aktifseferler", label: "Aktif Seferler" },
        { to: "/bimafyon/silinenseferler", label: "Silinen Seferler" },
        { to: "/bimafyon/tamamlananseferler", label: "Tamamlanan Seferler" },
    ],
    donus: [
        { to: "/donusler/siparis", label: "Sipariş Oluştur" },
        { to: "/donusler/plakaatama", label: "Plaka Atama" },
        { to: "/donusler/tamamlananseferler", label: "Tamamlanan Seferler" },
        { to: "/donusler/navlunlar", label: "Navlunlar" },
    ],
    arac: [{ to: "/aracyonetimi/araclar", label: "Araçlar" }],
    ek: [
        { to: "/ekkayitlar/vkn", label: "VKN Ekle" },
        { to: "/ekkayitlar/ugrama", label: "Uğrama Şartı Ekle" },
        { to: "/ekkayitlar/navlun", label: "Navlun Şartı Ekle" },
    ],
};

function Layout({ onOpenYetkiPanel }: LayoutProps) {
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

    const rol = String(aktifKullanici?.rol || "kullanici")
        .trim()
        .toLowerCase();

    const isAdmin = rol === "admin";

    const toggleMenu = (menu: MenuKey) => {
        setOpenMenu(openMenu === menu ? null : menu);
    };

    const closeMenu = () => {
        setOpenMenu(null);
    };

    const handleLogout = () => {
        localStorage.removeItem("aktifKullanici");
        navigate("/login");
    };

    const handleOpenYetkiPanel = () => {
        closeMenu();
        onOpenYetkiPanel();
    };

    return (
        <div className="layout-page" onClick={closeMenu}>
            <header className="app-topbar" onClick={(e) => e.stopPropagation()}>
                <Link to="/anasayfa" className="brand" onClick={closeMenu}>
                    <div className="brand-route" aria-hidden="true">
                        <span />
                        <i />
                        <span />
                    </div>

                    <h1>Odak Lojistik</h1>
                </Link>

                <nav className="app-navbar">
                    <div className="menu-item">
                        <button type="button" onClick={() => toggleMenu("bim")}>
                            BİM AFYON
                        </button>

                        {openMenu === "bim" && (
                            <div className="menu-dropdown">
                                {MENU_GROUPS.bim.map((item) => (
                                    <Link key={item.to} to={item.to} onClick={closeMenu}>
                                        {item.label}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="menu-item">
                        <button type="button" onClick={() => toggleMenu("donus")}>
                            DÖNÜŞLER
                        </button>

                        {openMenu === "donus" && (
                            <div className="menu-dropdown">
                                {MENU_GROUPS.donus.map((item) => (
                                    <Link key={item.to} to={item.to} onClick={closeMenu}>
                                        {item.label}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="menu-item">
                        <button type="button" onClick={() => toggleMenu("arac")}>
                            ARAÇ YÖNETİMİ
                        </button>

                        {openMenu === "arac" && (
                            <div className="menu-dropdown">
                                {MENU_GROUPS.arac.map((item) => (
                                    <Link key={item.to} to={item.to} onClick={closeMenu}>
                                        {item.label}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="menu-item">
                        <button type="button" onClick={() => toggleMenu("ek")}>
                            EK KAYITLAR
                        </button>

                        {openMenu === "ek" && (
                            <div className="menu-dropdown">
                                {MENU_GROUPS.ek.map((item) => (
                                    <Link key={item.to} to={item.to} onClick={closeMenu}>
                                        {item.label}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    {isAdmin && (
                        <button
                            type="button"
                            className="auth-panel-button"
                            onClick={handleOpenYetkiPanel}
                        >
                            <span className="auth-panel-icon">🔐</span>
                            <span>Yetkilendirme</span>
                        </button>
                    )}
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