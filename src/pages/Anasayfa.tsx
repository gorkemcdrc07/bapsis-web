import { Link } from "react-router-dom";
import "./Anasayfa.css";

const surecAsamalari = [
    { kod: "SP", baslik: "Sipariş Alındı", deger: 124, durum: "nötr" },
    { kod: "PL", baslik: "Planlandı", deger: 41, durum: "bekliyor" },
    { kod: "YL", baslik: "Yolda / Sefer Halinde", deger: 18, durum: "aktif" },
    { kod: "TM", baslik: "Teslim Edildi", deger: 76, durum: "tamam" },
];

const modulKisayollari = [
    {
        kod: "PL",
        baslik: "Planlama",
        aciklama: "Sefer ve operasyon planlama ekranı",
        yol: "/bimafyon/planlama",
    },
    {
        kod: "MS",
        baslik: "Manuel Sipariş",
        aciklama: "Yeni sipariş kaydı oluşturma",
        yol: "/bimafyon/manuelsiparis",
    },
    {
        kod: "AS",
        baslik: "Aktif Seferler",
        aciklama: "Devam eden operasyon takibi",
        yol: "/bimafyon/aktifseferler",
    },
    {
        kod: "AY",
        baslik: "Araç Yönetimi",
        aciklama: "Araç, sürücü ve plaka yönetimi",
        yol: "/aracyonetimi/araclar",
    },
];

const sonHareketler = [
    { saat: "14:32", metin: "Sipariş #A-2291 planlamaya alındı", tur: "bekliyor" },
    { saat: "13:58", metin: "34 ABC 123 plakalı araç sefere çıktı", tur: "aktif" },
    { saat: "13:20", metin: "Sefer #S-1042 teslim edilerek kapatıldı", tur: "tamam" },
    { saat: "12:47", metin: "Yeni sipariş kaydı oluşturuldu (#A-2290)", tur: "notr" },
    { saat: "11:15", metin: "34 XYZ 456 için bakım kontrolü tamamlandı", tur: "tamam" },
];

function Anasayfa({ onOpenYetkiPanel }) {
    return (
        <div className="home-page">
            <main className="dashboard-content">
                <section className="home-hero">
                    <div className="hero-text">
                        <span className="home-label">BAPSİS WEB V2 — OPERASYON YÖNETİM MERKEZİ</span>
                        <h1>Sipariş, Filo ve Sefer Operasyonlarını Tek Merkezden Yönetin</h1>
                        <p>
                            Sipariş girişinden teslimata kadar tüm operasyon süreçlerinizi
                            tek ekrandan takip edin; planlama, araç yönetimi ve aktif sefer
                            akışlarını gerçek zamanlı kontrol altında tutun.
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
                    <div className="stat-card stat-notr">
                        <span>Toplam Sipariş</span>
                        <strong>124</strong>
                        <p>Bugünkü işlem sayısı</p>
                    </div>

                    <div className="stat-card stat-aktif">
                        <span>Aktif Araç</span>
                        <strong>18</strong>
                        <p>Operasyondaki araçlar</p>
                    </div>

                    <div className="stat-card stat-tamam">
                        <span>Tamamlanan Sefer</span>
                        <strong>76</strong>
                        <p>Başarıyla kapanan seferler</p>
                    </div>

                    <div className="stat-card stat-bekliyor">
                        <span>Bekleyen İşlem</span>
                        <strong>09</strong>
                        <p>Kontrol bekleyen kayıtlar</p>
                    </div>
                </section>

                <section className="dashboard-panel flow-panel">
                    <div className="panel-header">
                        <div>
                            <h2>Operasyon Akışı</h2>
                            <p>Siparişten teslimata kadar süreç durumu</p>
                        </div>
                    </div>

                    <div className="flow-track">
                        {surecAsamalari.map((asama) => (
                            <div className={`flow-node flow-${asama.durum}`} key={asama.kod}>
                                <div className="flow-node-top">
                                    <span className="flow-code">{asama.kod}</span>
                                    <span className="flow-value">{String(asama.deger).padStart(2, "0")}</span>
                                </div>
                                <span className="flow-label">{asama.baslik}</span>
                            </div>
                        ))}
                    </div>
                </section>

                <div className="dashboard-grid">
                    <section className="dashboard-panel modules-panel">
                        <div className="panel-header">
                            <div>
                                <h2>Modül Kısayolları</h2>
                                <p>Sık kullanılan ekranlara hızlı erişim sağlayın.</p>
                            </div>
                        </div>

                        <div className="module-list">
                            {modulKisayollari.map((modul) => (
                                <Link to={modul.yol} className="module-row" key={modul.kod}>
                                    <span className="module-code">{modul.kod}</span>
                                    <div className="module-row-text">
                                        <strong>{modul.baslik}</strong>
                                        <span>{modul.aciklama}</span>
                                    </div>
                                    <span className="module-arrow" aria-hidden="true">→</span>
                                </Link>
                            ))}
                        </div>
                    </section>

                    <section className="dashboard-panel activity-panel">
                        <div className="panel-header">
                            <div>
                                <h2>Son Hareketler</h2>
                                <p>Operasyon kayıtlarındaki güncel değişiklikler</p>
                            </div>
                        </div>

                        <ul className="activity-feed">
                            {sonHareketler.map((hareket, index) => (
                                <li className="activity-row" key={index}>
                                    <span className="ops-mono activity-time">{hareket.saat}</span>
                                    <span className={`activity-dot activity-${hareket.tur}`} aria-hidden="true" />
                                    <span className="activity-text">{hareket.metin}</span>
                                </li>
                            ))}
                        </ul>
                    </section>
                </div>
            </main>
        </div>
    );
}

export default Anasayfa;