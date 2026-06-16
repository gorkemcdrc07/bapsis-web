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
    const [messageType, setMessageType] = useState("info");
    const [matches, setMatches] = useState([]);
    const [pendingIrsaliye, setPendingIrsaliye] = useState("");
    const [detectedPlaka, setDetectedPlaka] = useState("");
    const [detectedIrsaliye, setDetectedIrsaliye] = useState("");
    const [scannerActive, setScannerActive] = useState(false);

    const rowsRef = useRef([]);
    const scannerRef = useRef(null);
    const lastQrRef = useRef("");
    const readerId = "donus-qr-okutma-reader";

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

        return () => {
            stopScanner();
        };
    }, []);

    const writeIrsaliye = async (rowId, irsaliyeNo) => {
        const mevcutRow = rowsRef.current.find((row) => row.id === rowId);
        const mevcutDeger = mevcutRow?.irsaliye_no || "";

        let yeniDeger;

        if (mevcutDeger) {
            const mevcutler = mevcutDeger.split("/").map((item) => item.trim());

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
            .update({
                irsaliye_no: yeniDeger,
                updated_at: new Date().toISOString(),
            })
            .eq("id", rowId);

        if (error) {
            showMsg(`İrsaliye yazılamadı: ${error.message}`, "error");
            return;
        }

        await fetchRows();
        await onSuccess?.();

        setMatches([]);
        setPendingIrsaliye("");
        setDetectedPlaka("");
        setDetectedIrsaliye("");
        showMsg(`İrsaliye kaydedildi: ${yeniDeger}`, "success");
        await stopScanner();
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
            <div className="qro-header">
                <div className="qro-title-group">
                    <div className="qro-icon-wrap">▦</div>
                    <div>
                        <h2 className="qro-title">QR İrsaliye Okutma</h2>
                        <p className="qro-subtitle">
                            Kamera veya barkod okuyucu ile okutabilirsiniz
                        </p>
                    </div>
                </div>

                <div className="qro-actions">
                    <button
                        type="button"
                        className="qro-btn qro-btn-primary"
                        onClick={startScanner}
                        disabled={scannerActive}
                    >
                        Kamerayı Aç
                    </button>

                    <button
                        type="button"
                        className="qro-btn qro-btn-ghost"
                        onClick={stopScanner}
                        disabled={!scannerActive}
                    >
                        Durdur
                    </button>
                </div>
            </div>

            <form className="qro-barcode-form" onSubmit={handleBarcodeSubmit}>
                <div className="qro-input-wrap">
                    <span className="qro-input-icon">⌕</span>
                    <input
                        name="qrText"
                        className="qro-input"
                        placeholder="Barkod/QR metnini okut veya yapıştır..."
                    />
                </div>

                <button type="submit" className="qro-btn qro-btn-primary">
                    İşle
                </button>
            </form>

            {(detectedPlaka || detectedIrsaliye) && (
                <div className="qro-detected-row">
                    {detectedPlaka && (
                        <div className="qro-detected-chip qro-chip-plaka">
                            <span className="qro-chip-label">Plaka</span>
                            <strong className="qro-chip-value">{detectedPlaka}</strong>
                        </div>
                    )}

                    {detectedIrsaliye && (
                        <div className="qro-detected-chip qro-chip-irsaliye">
                            <span className="qro-chip-label">İrsaliye</span>
                            <strong className="qro-chip-value">{detectedIrsaliye}</strong>
                        </div>
                    )}
                </div>
            )}

            {message && (
                <div className={`qro-message qro-msg-${messageType}`}>
                    <span className="qro-msg-dot" />
                    {message}
                </div>
            )}

            <div
                id={readerId}
                className={
                    scannerActive
                        ? "qro-camera-box qro-camera-active"
                        : "qro-camera-box"
                }
            />

            {matches.length > 0 && (
                <div className="qro-match-list">
                    <strong>Birden fazla sefer bulundu</strong>

                    {matches.map((row) => (
                        <button
                            type="button"
                            key={row.id}
                            className="qro-match-btn"
                            onClick={() => writeIrsaliye(row.id, pendingIrsaliye)}
                        >
                            <b>ID #{row.id}</b>
                            <span>
                                {row.sefer_no || "Sefer No yok"} · {row.cekici || "Plaka yok"}
                            </span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}