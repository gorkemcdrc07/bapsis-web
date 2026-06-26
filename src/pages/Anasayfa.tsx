import { Link } from "react-router-dom";
import "./Anasayfa.css";

function Anasayfa({ onOpenYetkiPanel }) {
    return (
        <div className="home-page">
            <main className="dashboard-content">
                <section className="home-hero">
                    <div>
                        <span className="home-label">BAPSİS WEB V2</span>
                        <h1>Operasyon Yönetim Merkezi</h1>
                        <p>
                            Sipariş, planlama, araç yönetimi ve aktif sefer süreçlerinizi
                            tek ekrandan hızlı ve düzenli şekilde yönetin.
                        </p>
                    </div>

                    <div className="hero-actions">
                        <Link to="/bimafyon/manuelsiparis" className="primary-btn">
                            Yeni Sipariş Oluştur
                        </Link>

                        <button type="button" className="secondary-btn" onClick={onOpenYetkiPanel}>
                            Yetkilendirme Paneli
                        </button>
                    </div>
                </section>

                <section className="stats-grid">
                    <div className="stat-card">
                        <span>Toplam Sipariş</span>
                        <strong>124</strong>
                        <p>Bugünkü işlem sayısı</p>
                    </div>

                    <div className="stat-card">
                        <span>Aktif Araç</span>
                        <strong>18</strong>
                        <p>Operasyondaki araçlar</p>
                    </div>

                    <div className="stat-card">
                        <span>Tamamlanan Sefer</span>
                        <strong>76</strong>
                        <p>Başarıyla kapanan seferler</p>
                    </div>

                    <div className="stat-card">
                        <span>Bekleyen İşlem</span>
                        <strong>9</strong>
                        <p>Kontrol bekleyen kayıtlar</p>
                    </div>
                </section>

                <section className="dashboard-panel">
                    <div className="panel-header">
                        <div>
                            <h2>Modül Kısayolları</h2>
                            <p>Sık kullanılan ekranlara hızlı erişim sağlayın.</p>
                        </div>
                    </div>

                    <div className="module-grid">
                        <Link to="/bimafyon/planlama" className="module-card">
                            <div className="module-icon">01</div>
                            <div>
                                <strong>Planlama</strong>
                                <span>Sefer ve operasyon planlama ekranı</span>
                            </div>
                        </Link>

                        <Link to="/bimafyon/manuelsiparis" className="module-card">
                            <div className="module-icon">02</div>
                            <div>
                                <strong>Manuel Sipariş</strong>
                                <span>Yeni sipariş kaydı oluşturma</span>
                            </div>
                        </Link>

                        <Link to="/bimafyon/aktifseferler" className="module-card">
                            <div className="module-icon">03</div>
                            <div>
                                <strong>Aktif Seferler</strong>
                                <span>Devam eden operasyon takibi</span>
                            </div>
                        </Link>

                        <Link to="/aracyonetimi/araclar" className="module-card">
                            <div className="module-icon">04</div>
                            <div>
                                <strong>Araç Yönetimi</strong>
                                <span>Araç, sürücü ve plaka yönetimi</span>
                            </div>
                        </Link>
                    </div>
                </section>
            </main>
        </div>
    );
}

export default Anasayfa;