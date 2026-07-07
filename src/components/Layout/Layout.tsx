import { useMemo, useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./Layout.css";

type MenuKey = "bim" | "donus" | "arac" | "ek" | null;

interface LayoutProps {
    onOpenYetkiPanel: () => void;
}

const MENU_GROUPS = {
    bim: [
        { to: "/bimafyon/planlama", label: "Planlama", pageKey: "bim_planlama" },
        { to: "/bimafyon/manuelsiparis", label: "Manuel Sipariş", pageKey: "bim_manuel" },
        { to: "/bimafyon/aktifseferler", label: "Aktif Seferler", pageKey: "bim_aktif" },
        { to: "/bimafyon/silinenseferler", label: "Silinen Seferler", pageKey: "bim_silinen" },
        { to: "/bimafyon/tamamlananseferler", label: "Tamamlanan Seferler", pageKey: "bim_tamamlanan" },
    ],
    donus: [
        { to: "/donusler/siparis", label: "Sipariş Oluştur", pageKey: "donus_siparis" },
        { to: "/donusler/plakaatama", label: "Plaka Atama", pageKey: "donus_plaka" },
        { to: "/donusler/tamamlananseferler", label: "Tamamlanan Seferler", pageKey: "donus_tamamlanan" },
        { to: "/donusler/navlunlar", label: "Navlunlar", pageKey: "donus_navlun" },
    ],
    arac: [
        { to: "/aracyonetimi/araclar", label: "Araçlar", pageKey: "araclar" },
    ],
    ek: [
        { to: "/ekkayitlar/vkn", label: "VKN Ekle", pageKey: "ekkayit_vkn" },
        { to: "/ekkayitlar/ugrama", label: "Uğrama Şartı Ekle", pageKey: "ekkayit_ugrama" },
        { to: "/ekkayitlar/navlun", label: "Navlun Şartı Ekle", pageKey: "ekkayit_navlun" },
    ],
};

function Layout({ onOpenYetkiPanel }: LayoutProps) {
    const navigate = useNavigate();
    const { user, canPage, logout } = useAuth();
    const [openMenu, setOpenMenu] = useState<MenuKey>(null);

    const visibleMenuGroups = useMemo(() => {
        return {
            bim: MENU_GROUPS.bim.filter((item) => canPage(item.pageKey)),
            donus: MENU_GROUPS.donus.filter((item) => canPage(item.pageKey)),
            arac: MENU_GROUPS.arac.filter((item) => canPage(item.pageKey)),
            ek: MENU_GROUPS.ek.filter((item) => canPage(item.pageKey)),
        };
    }, [canPage]);

    const kullaniciAdi =
        user?.ad || user?.kullanici_adi || "Kullanıcı";

    const kullaniciKodu = user?.kullanici_adi || "kullanici";

    const rol = String(user?.rol || "kullanici")
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
        logout();
        navigate("/login");
    };

    const handleOpenYetkiPanel = () => {
        closeMenu();
        onOpenYetkiPanel();
    };

    const renderMenuGroup = (
        key: Exclude<MenuKey, null>,
        title: string,
        items: typeof MENU_GROUPS.bim
    ) => {
        if (items.length === 0) return null;

        return (
            <div className="menu-item">
                <button type="button" onClick={() => toggleMenu(key)}>
                    {title}
                </button>

                {openMenu === key && (
                    <div className="menu-dropdown">
                        {items.map((item) => (
                            <Link key={item.to} to={item.to} onClick={closeMenu}>
                                {item.label}
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        );
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
                    {renderMenuGroup("bim", "BİM AFYON", visibleMenuGroups.bim)}
                    {renderMenuGroup("donus", "DÖNÜŞLER", visibleMenuGroups.donus)}
                    {renderMenuGroup("arac", "ARAÇ YÖNETİMİ", visibleMenuGroups.arac)}
                    {renderMenuGroup("ek", "EK KAYITLAR", visibleMenuGroups.ek)}

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