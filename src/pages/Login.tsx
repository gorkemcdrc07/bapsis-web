import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import "./Login.css";

function Login() {
    const navigate = useNavigate();

    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        const cleanUsername = username.trim();
        const cleanPassword = password.trim();

        if (!cleanUsername || !cleanPassword) {
            setError("Kullanıcı adı ve şifre zorunludur.");
            return;
        }

        setIsLoading(true);

        const { data, error } = await supabase
            .from("kullanicilar")
            .select("id, kullanici_adi, ad, rol, ekran_gorunumleri, aktif")
            .eq("kullanici_adi", cleanUsername)
            .eq("sifre", cleanPassword)
            .eq("aktif", true)
            .maybeSingle();

        setIsLoading(false);

        if (error) {
            setError("Giriş sırasında bir hata oluştu. Lütfen tekrar deneyin.");
            return;
        }

        if (!data) {
            setError("Kullanıcı adı veya şifre hatalı.");
            return;
        }

        localStorage.setItem("aktifKullanici", JSON.stringify(data));
        navigate("/anasayfa");
    };

    return (
        <main className="login-page">
            <section className="login-shell" aria-label="ODAK LOJİSTİK giriş ekranı">
                <aside className="brand-panel">
                    <div className="brand-topline">
                        <span className="brand-mark">OL</span>
                        <div className="brand-textblock">
                            <span className="brand-label">ODAK LOJİSTİK</span>
                            <span className="brand-sublabel">Kurumsal Portal</span>
                        </div>
                    </div>

                    <div className="brand-body">
                        <span className="eyebrow eyebrow-dark">OPERASYON PANELİ</span>

                        <h1>
                            Lojistik süreçlerinizi<br />
                            tek ekrandan yönetin.
                        </h1>

                        <p>
                            Sevkiyat, planlama, filo ve raporlama süreçlerinizi
                            güvenli kurumsal panel üzerinden takip edin.
                        </p>

                        <div className="route-block">
                            <div className="route-head">
                                <span className="route-caption">Canlı Operasyon Akışı</span>
                                <span className="live-pill">Aktif</span>
                            </div>

                            <svg
                                className="route-line"
                                viewBox="0 0 460 44"
                                xmlns="http://www.w3.org/2000/svg"
                                aria-hidden="true"
                            >
                                <line x1="20" y1="22" x2="440" y2="22" className="route-track" />
                                <circle cx="20" cy="22" r="6" className="route-origin" />
                                <circle cx="230" cy="22" r="5" className="route-mid" />
                                <circle cx="440" cy="22" r="6" className="route-dest" />
                                <circle r="5" className="route-dot">
                                    <animateMotion
                                        dur="4.5s"
                                        repeatCount="indefinite"
                                        path="M20,22 L440,22"
                                    />
                                </circle>
                            </svg>

                            <div className="route-labels">
                                <span>PLANLAMA</span>
                                <span>SEVKİYAT</span>
                                <span>TESLİMAT</span>
                            </div>
                        </div>

                        <div className="operation-panel">
                            <div className="operation-card">
                                <span className="operation-icon">01</span>
                                <div>
                                    <strong>Planlama Kontrolü</strong>
                                    <p>Günlük operasyonlar merkezi panelden yönetilir.</p>
                                </div>
                            </div>

                            <div className="operation-card">
                                <span className="operation-icon">02</span>
                                <div>
                                    <strong>Sevkiyat Takibi</strong>
                                    <p>Rota, durum ve teslimat süreçleri takip edilir.</p>
                                </div>
                            </div>

                            <div className="operation-card">
                                <span className="operation-icon">03</span>
                                <div>
                                    <strong>Raporlama</strong>
                                    <p>Operasyon verileri anlık olarak raporlanır.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="brand-footer">
                        <span className="status-dot" />
                        Sistem aktif&nbsp;·&nbsp;v3.1
                    </div>
                </aside>

                <div className="seam" aria-hidden="true">
                    <span className="seam-text">ODAK LOJİSTİK · GİRİŞ</span>
                </div>

                <section className="login-card">
                    <div className="mobile-brand">
                        <span className="brand-mark">OL</span>
                        <div className="brand-textblock">
                            <span className="brand-label brand-label-light">ODAK LOJİSTİK</span>
                            <span className="brand-sublabel brand-sublabel-light">Kurumsal Portal</span>
                        </div>
                    </div>

                    <div className="login-header">
                        <span className="eyebrow">Güvenli Giriş</span>
                        <h2>Hesabınıza giriş yapın</h2>
                        <p>Kurumsal kullanıcı bilgilerinizle devam edin.</p>
                    </div>

                    <form className="login-form" onSubmit={handleSubmit} noValidate>
                        <div className="form-group">
                            <label htmlFor="username">Kullanıcı Adı</label>
                            <div className="input-wrapper">
                                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.5 20.1a7.5 7.5 0 0 1 15 0" />
                                </svg>

                                <input
                                    id="username"
                                    type="text"
                                    placeholder="Kullanıcı adınızı giriniz"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    autoComplete="username"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <div className="label-row">
                                <label htmlFor="password">Şifre</label>
                                <a href="#" tabIndex={-1}>Şifremi unuttum</a>
                            </div>

                            <div className="input-wrapper">
                                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                                </svg>

                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Şifrenizi giriniz"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    autoComplete="current-password"
                                    disabled={isLoading}
                                />

                                <button
                                    type="button"
                                    className="toggle-password"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
                                >
                                    {showPassword ? "Gizle" : "Göster"}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="error-message" role="alert">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            className={`login-btn${isLoading ? " loading" : ""}`}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <span className="spinner" aria-hidden="true" />
                                    Giriş yapılıyor...
                                </>
                            ) : (
                                "Giriş Yap"
                            )}
                        </button>
                    </form>

                    <div className="login-footer">
                        Yardım için{" "}
                        <a href="mailto:destek@odaklojistik.com.tr">BT Destek Masası</a>'na
                        başvurun.
                    </div>
                </section>
            </section>
        </main>
    );
}

export default Login;