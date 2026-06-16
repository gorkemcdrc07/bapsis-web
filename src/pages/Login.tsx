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
            <section className="login-shell" aria-label="BAPSİS giriş ekranı">

                {/* Sol panel */}
                <aside className="brand-panel">
                    <div className="brand-topline">
                        <span className="brand-mark">B</span>
                        <span className="brand-label">BAPSİS WEB V2</span>
                    </div>

                    <div className="brand-body">
                        <h1>Başvuru ve Proje Süreçleri Yönetim Sistemi</h1>
                        <p>
                            Kurumsal kullanıcı hesabınızla giriş yaparak başvuru,
                            onay ve raporlama işlemlerinizi yönetin.
                        </p>

                        <div className="feature-grid">
                            <div className="feature-card">
                                <strong>7/24</strong>
                                <span>Kesintisiz Erişim</span>
                            </div>
                            <div className="feature-card">
                                <strong>Rol</strong>
                                <span>Bazlı Yetki</span>
                            </div>
                            <div className="feature-card">
                                <strong>Güvenli</strong>
                                <span>SSL Bağlantı</span>
                            </div>
                        </div>
                    </div>

                    <div className="brand-footer">
                        <span className="status-dot" />
                        Sistem aktif &nbsp;·&nbsp; v2.4.1
                    </div>
                </aside>

                {/* Sağ panel – form */}
                <section className="login-card">
                    <div className="mobile-brand">
                        <span className="brand-mark">B</span>
                        <span className="brand-label">BAPSİS WEB V2</span>
                    </div>

                    <div className="login-header">
                        <span className="eyebrow">Güvenli Giriş</span>
                        <h2>Hesabınıza giriş yapın</h2>
                        <p>Kullanıcı adı ve şifrenizi girerek devam edin.</p>
                    </div>

                    <form className="login-form" onSubmit={handleSubmit} noValidate>
                        <div className="form-group">
                            <label htmlFor="username">Kullanıcı Adı</label>
                            <div className="input-wrapper">
                                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round"
                                        d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.5 20.1a7.5 7.5 0 0 1 15 0" />
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
                                    <path strokeLinecap="round" strokeLinejoin="round"
                                        d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
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
                        <a href="mailto:destek@sirket.com.tr">BT Destek Masası</a>'na
                        başvurun.
                    </div>
                </section>
            </section>
        </main>
    );
}

export default Login;