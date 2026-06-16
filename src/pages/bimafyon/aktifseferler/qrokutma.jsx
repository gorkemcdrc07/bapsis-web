import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { supabase } from "../../../lib/supabaseClient";
import "./qrokutma.css";

function normalizePlate(value) {
    return String(value || "")
        .toUpperCase()
        .replace(/[^0-9A-ZÇĞİÖŞÜ]/g, "");
}

function extractQrInfo(qrText) {
    const text = String(qrText || "");
    const noMatch = text.match(/no[^A-Z0-9]*([A-Z]{2}\d{14})/i);
    const plakaMatch =
        text.match(/plaka[^0-9A-ZÇĞİÖŞÜ]*([0-9]{2}\s?[A-ZÇĞİÖŞÜ]{1,3}\s?[0-9]{2,5})/i) ||
        text.match(/([0-9]{2}\s?[A-ZÇĞİÖŞÜ]{1,3}\s?[0-9]{2,5})/i);
    return {
        irsaliyeNo: noMatch ? noMatch[1].trim().toUpperCase() : "",
        plaka: plakaMatch ? normalizePlate(plakaMatch[1]) : "",
    };
}

export default function QrOkutma({ onSuccess }) {
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("info"); // info | success | error | warning
    const [matches, setMatches] = useState([]);
    const [pendingIrsaliye, setPendingIrsaliye] = useState("");
    const [detectedPlaka, setDetectedPlaka] = useState("");
    const [detectedIrsaliye, setDetectedIrsaliye] = useState("");
    const [scannerActive, setScannerActive] = useState(false);
    const [successVisible, setSuccessVisible] = useState(false);
    const [successText, setSuccessText] = useState("");

    const rowsRef = useRef([]);
    const scannerRef = useRef(null);
    const lastQrRef = useRef("");
    const readerId = "qr-okutma-reader";

    const showMsg = (text, type = "info") => {
        setMessage(text);
        setMessageType(type);
    };

    const fetchRows = async () => {
        const { data, error } = await supabase
            .from("aktif_seferler")
            .select("*")
            .order("id", { ascending: false });
        if (error) {
            showMsg(`Aktif seferler alınamadı: ${error.message}`, "error");
            return;
        }
        rowsRef.current = data || [];
    };

    const stopScanner = async () => {
        if (!scannerRef.current) return;
        try {
            await scannerRef.current.stop();
            await scannerRef.current.clear();
        } catch { }
        scannerRef.current = null;
        setScannerActive(false);
    };

    useEffect(() => {
        fetchRows();
        return () => { stopScanner(); };
    }, []);

    const triggerSuccess = (irsaliyeNo) => {
        setSuccessText(irsaliyeNo);
        setSuccessVisible(true);
        setTimeout(() => {
            setSuccessVisible(false);
            setDetectedPlaka("");
            setDetectedIrsaliye("");
            setMatches([]);
            setPendingIrsaliye("");
            setMessage("");
            stopScanner();
        }, 2800);
    };

    const writeIrsaliye = async (rowId, irsaliyeNo) => {
        const mevcutRow = rowsRef.current.find((r) => r.id === rowId);
        const mevcutDeger = mevcutRow?.irsaliye_no || "";

        let yeniDeger;
        if (mevcutDeger) {
            const mevcutler = mevcutDeger.split("/").map((s) => s.trim());
            if (mevcutler.includes(irsaliyeNo.trim())) {
                showMsg(`Bu irsaliye zaten girilmiş: ${irsaliyeNo}`, "warning");
                return;
            }
            yeniDeger = `${mevcutDeger} / ${irsaliyeNo}`;
        } else {
            yeniDeger = irsaliyeNo;
        }

        const { error } = await supabase
            .from("aktif_seferler")
            .update({ irsaliye_no: yeniDeger })
            .eq("id", rowId);
        if (error) {
            showMsg(`İrsaliye yazılamadı: ${error.message}`, "error");
            return;
        }
        await fetchRows();
        await onSuccess?.();
        triggerSuccess(yeniDeger);
    };

    const handleQrRead = async (decodedText) => {
        if (!decodedText) return;
        if (lastQrRef.current === decodedText) return;
        lastQrRef.current = decodedText;

        const { plaka, irsaliyeNo } = extractQrInfo(decodedText);

        if (!plaka || !irsaliyeNo) {
            showMsg("QR içinde plaka veya irsaliye no bulunamadı.", "warning");
            return;
        }

        setDetectedPlaka(plaka);
        setDetectedIrsaliye(irsaliyeNo);

        const foundRows = rowsRef.current.filter(
            (row) => normalizePlate(row.cekici) === plaka
        );

        if (foundRows.length === 0) {
            showMsg(`${plaka} plakası çekici sütununda bulunamadı.`, "error");
            return;
        }

        if (foundRows.length === 1) {
            await writeIrsaliye(foundRows[0].id, irsaliyeNo);
            return;
        }

        setPendingIrsaliye(irsaliyeNo);
        setMatches(foundRows);
        showMsg(`${plaka} plakası birden fazla seferde bulundu.`, "warning");
    };

    const startScanner = async () => {
        showMsg("Kamera başlatılıyor...", "info");
        setMatches([]);
        setPendingIrsaliye("");
        setDetectedPlaka("");
        setDetectedIrsaliye("");
        lastQrRef.current = "";
        setSuccessVisible(false);
        await stopScanner();

        try {
            const scanner = new Html5Qrcode(readerId);
            scannerRef.current = scanner;
            await scanner.start(
                { facingMode: "environment" },
                { fps: 10, qrbox: { width: 240, height: 240 } },
                handleQrRead,
                () => { }
            );
            setScannerActive(true);
            showMsg("QR okutmaya hazır.", "info");
        } catch {
            showMsg("Kamera açılamadı. Tarayıcı kamera iznini kontrol edin.", "error");
        }
    };

    const handleBarcodeSubmit = (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const value = form.elements.qrText.value;
        handleQrRead(value);
        form.reset();
    };

    return (
        <div className="qro-root">

            {/* Başlık */}
            <div className="qro-header">
                <div className="qro-title-group">
                    <div className="qro-icon-wrap">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="7" height="7" rx="1" />
                            <rect x="14" y="3" width="7" height="7" rx="1" />
                            <rect x="3" y="14" width="7" height="7" rx="1" />
                            <path d="M14 14h2v2h-2z" />
                            <path d="M18 14h3" />
                            <path d="M14 18v3" />
                            <path d="M18 18h3v3h-3z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="qro-title">QR İrsaliye Okutma</h2>
                        <p className="qro-subtitle">Kamera veya barkod okuyucu ile okutabilirsiniz</p>
                    </div>
                </div>
                <div className="qro-actions">
                    <button className="qro-btn qro-btn-primary" onClick={startScanner} disabled={scannerActive}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                            <circle cx="12" cy="13" r="4" />
                        </svg>
                        Kamerayı Başlat
                    </button>
                    <button className="qro-btn qro-btn-ghost" onClick={stopScanner} disabled={!scannerActive}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                        </svg>
                        Durdur
                    </button>
                </div>
            </div>

            {/* Barkod form */}
            <form className="qro-barcode-form" onSubmit={handleBarcodeSubmit}>
                <div className="qro-input-wrap">
                    <svg className="qro-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <line x1="3" y1="5" x2="3" y2="19" /><line x1="7" y1="5" x2="7" y2="19" />
                        <line x1="11" y1="5" x2="11" y2="19" /><line x1="15" y1="5" x2="15" y2="19" />
                        <line x1="19" y1="5" x2="19" y2="19" /><line x1="21" y1="5" x2="21" y2="19" />
                    </svg>
                    <input
                        name="qrText"
                        className="qro-input"
                        placeholder="Barkod okuyucu ile okutun veya QR metnini yapıştırın..."
                        autoFocus
                    />
                </div>
                <button className="qro-btn qro-btn-primary" type="submit">İşle</button>
            </form>

            {/* Tespit edilen bilgiler */}
            {(detectedPlaka || detectedIrsaliye) && !successVisible && (
                <div className="qro-detected-row">
                    {detectedPlaka && (
                        <div className="qro-detected-chip qro-chip-plaka">
                            <span className="qro-chip-label">Plaka</span>
                            <span className="qro-chip-value">{detectedPlaka}</span>
                        </div>
                    )}
                    {detectedIrsaliye && (
                        <div className="qro-detected-chip qro-chip-irsaliye">
                            <span className="qro-chip-label">İrsaliye No</span>
                            <span className="qro-chip-value">{detectedIrsaliye}</span>
                        </div>
                    )}
                </div>
            )}

            {/* Mesaj */}
            {message && !successVisible && (
                <div className={`qro-message qro-msg-${messageType}`}>
                    <span className="qro-msg-dot" />
                    {message}
                </div>
            )}

            {/* Kamera kutusu */}
            <div
                className={`qro-camera-box ${scannerActive ? "qro-camera-active" : ""}`}
                id={readerId}
            />

            {/* Çoklu eşleşme */}
            {matches.length > 0 && !successVisible && (
                <div className="qro-duplicate-box">
                    <div className="qro-duplicate-header">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                        Hangi sefere atansın?
                    </div>
                    <div className="qro-duplicate-list">
                        {matches.map((row) => (
                            <button
                                key={row.id}
                                className="qro-duplicate-btn"
                                onClick={() => writeIrsaliye(row.id, pendingIrsaliye)}
                            >
                                <div className="qro-dup-sefer">
                                    <span className="qro-dup-no">{row.sefer_no || "Sefer No Yok"}</span>
                                    <span className="qro-dup-plaka">{row.cekici}</span>
                                </div>
                                <span className="qro-dup-surucu">{row.surucu || "Sürücü Yok"}</span>
                                <svg className="qro-dup-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Başarı overlay */}
            {successVisible && (
                <div className="qro-success-overlay">
                    <div className="qro-success-card">
                        <div className="qro-success-circle">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        </div>
                        <p className="qro-success-title">İrsaliye Girildi</p>
                        <p className="qro-success-no">{successText}</p>
                        <div className="qro-success-bar">
                            <div className="qro-success-bar-fill" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}