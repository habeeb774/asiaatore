import React, { useEffect, useRef, useState } from 'react';

// BarcodeScanner uses the browser Barcode Detector API when available.
export default function BarcodeScanner() {
  const videoRef = useRef(null);
  const [supported, setSupported] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [lastCode, setLastCode] = useState(null);

  useEffect(() => {
    const isSupported = !!window.BarcodeDetector;
    setSupported(isSupported);
  }, []);

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) videoRef.current.srcObject = stream;
      setScanning(true);
      if (window.BarcodeDetector) {
        const detector = new window.BarcodeDetector({ formats: ['qr_code', 'code_128', 'ean_13'] });
        const loop = async () => {
          if (!scanning) return;
          try {
            const result = await detector.detect(videoRef.current);
            if (result && result.length) {
              setLastCode(result[0].rawValue);
            }
          } catch {}
          requestAnimationFrame(loop);
        };
        loop();
      }
    } catch (err) {
      console.warn('camera denied', err);
    }
  }

  function stopCamera() {
    setScanning(false);
    try {
      const s = videoRef.current?.srcObject;
      if (s && s.getTracks) s.getTracks().forEach((t) => t.stop());
      if (videoRef.current) videoRef.current.srcObject = null;
    } catch {}
  }

  return (
    <div>
      {!supported && (
        <div className="p-3 bg-yellow-50 rounded text-sm">ماسح الباركود غير مدعوم في هذا المتصفح. يمكنك تحميل صورة أو إدخال الرقم يدوياً.</div>
      )}
      <div className="mt-2">
        <video ref={videoRef} className="w-full h-48 bg-black rounded" autoPlay muted playsInline />
      </div>
      <div className="mt-2 flex gap-2">
        {!scanning ? (
          <button className="btn btn-primary" onClick={startCamera}>بدء المسح</button>
        ) : (
          <button className="btn" onClick={stopCamera}>إيقاف</button>
        )}
        <button className="btn" onClick={() => setLastCode(null)}>مسح</button>
      </div>
      <div className="mt-2 text-sm">الرمز: <strong>{lastCode ?? '-'}</strong></div>
    </div>
  );
}
