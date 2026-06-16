import { Link } from "react-router-dom";
import "./Anasayfa.css";

function Anasayfa() {
    return (
        <div className="home-page">
            <main className="dashboard-content">
                <section className="hero-card">
                    <div>
                        <span className="page-badge">
                            Dashboard
                        </span>

                        <h2>
                            Hoş Geldiniz 👋
                        </h2>

                        <p>
                            BAPSİS WEB V2 operasyon panelinden süreçlerinizi hızlıca yönetin.
                        </p>
                    </div>

                    <button className="primary-action" type="button">
                        Yeni Sipariş Oluştur
                    </button>
                </section>

                <section className="quick-actions">
                    <Link to="/bimafyon/planlama">
                        <button type="button">Planlama</button>
                    </Link>

                    <Link to="/bimafyon/manuelsiparis">
                        <button type="button">Manuel Sipariş</button>
                    </Link>

                    <Link to="/bimafyon/plakaatama">
                        <button type="button">Plaka Atama</button>
                    </Link>

                    <Link to="/aracyonetimi/araclar">
                        <button type="button">Araçlar</button>
                    </Link>
                </section>

                <section className="cards-grid">
                    <div className="dashboard-card">
                        <p>Toplam Sipariş</p>
                        <h3>124</h3>
                        <span>Bugünkü işlem sayısı</span>
                    </div>

                    <div className="dashboard-card">
                        <p>Aktif Araçlar</p>
                        <h3>18</h3>
                        <span>Operasyondaki araçlar</span>
                    </div>

                    <div className="dashboard-card">
                        <p>Tamamlanan Sefer</p>
                        <h3>76</h3>
                        <span>Başarıyla kapanan seferler</span>
                    </div>
                </section>
            </main>
        </div>
    );
}

export default Anasayfa;