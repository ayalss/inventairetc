import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Material } from '../types';

interface QrScannerTabProps {
  materials: Material[];
  onSelectMaterial: (m: Material) => void;
}

// Matches the local encryptCodification in MaterialQrCard
function decryptQr(value: string): string {
  if (!value) return '';
  try {
    // Handle LUXESTILE prefix if present
    const PREFIX = 'LUXESTILE-SECURE-ERP://[CLASS-A]::';
    const payload = value.startsWith(PREFIX) ? value.replace(PREFIX, '') : value;
    return atob(payload);
  } catch {
    return value; // already plain text
  }
}

export default function QrScannerTab({ materials, onSelectMaterial }: QrScannerTabProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const activeRef = useRef(false);

  const [streaming, setStreaming] = useState(false);
  const [scannedMaterial, setScannedMaterial] = useState<Material | null>(null);
  const [error, setError] = useState('');
  const [scanStatus, setScanStatus] = useState('');

  const stopCamera = useCallback(() => {
    activeRef.current = false;
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setStreaming(false);
    setScanStatus('');
  }, []);

  const handleFound = useCallback((rawValue: string) => {
    stopCamera();
    const codification = decryptQr(rawValue);
    const found = materials.find(
      m => m.codification === codification || m.id === codification
    );
    if (found) {
      setScannedMaterial(found);
      onSelectMaterial(found);
    } else {
      setError(`No asset matched: "${codification}"`);
    }
  }, [materials, onSelectMaterial, stopCamera]);

  const tick = useCallback(() => {
    if (!activeRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || video.readyState < 2 || video.videoWidth === 0) {
      rafRef.current = requestAnimationFrame(tick);
      return;
    }

    const ctx = canvas!.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    canvas!.width = video.videoWidth;
    canvas!.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas!.width, canvas!.height);

    // @ts-ignore
    const jsQR = window.jsQR;
    if (typeof jsQR === 'function') {
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'attemptBoth'
      });
      if (code?.data) {
        setScanStatus('✓ QR detected!');
        handleFound(code.data);
        return;
      } else {
        setScanStatus('Scanning...');
      }
    } else {
      setScanStatus('jsQR not loaded — check index.html');
    }

    rafRef.current = requestAnimationFrame(tick);
  }, [handleFound]);

  const startCamera = async () => {
    setError('');
    setScannedMaterial(null);
    setScanStatus('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      const video = videoRef.current!;
      video.srcObject = stream;
      await video.play();
      activeRef.current = true;
      setStreaming(true);
      rafRef.current = requestAnimationFrame(tick);
    } catch {
      setError('Camera access denied or unavailable.');
    }
  };

  useEffect(() => () => stopCamera(), [stopCamera]);

  return (
    <div className="space-y-4 max-w-2xl mx-auto py-6">
      <div className="bg-white rounded-3xl border border-[#D2D2D7]/50 shadow-sm overflow-hidden">

        <div className="px-6 py-4 border-b border-[#D2D2D7]/40">
          <p className="text-xs font-black text-slate-950 uppercase tracking-widest">QR Scanner & Audit</p>
          <p className="text-[10px] text-[#86868B] mt-0.5">Point camera at asset QR code to identify</p>
        </div>

        <div className="relative bg-black w-full" style={{ aspectRatio: '4/3', maxHeight: '320px' }}>
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            style={{ display: streaming ? 'block' : 'none' }}
            playsInline
            muted
          />
          <canvas ref={canvasRef} style={{ display: 'none' }} />

          {!streaming && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-neutral-500">
              <div className="w-14 h-14 rounded-full bg-neutral-800 flex items-center justify-center text-3xl">📷</div>
              <span className="text-xs">Camera inactive</span>
            </div>
          )}

          {streaming && (
            <>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-48 border-2 border-red-500 rounded-2xl"
                  style={{ boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)' }} />
              </div>
              {scanStatus && (
                <div className="absolute bottom-3 left-0 right-0 flex justify-center">
                  <span className="bg-black/70 text-white text-[10px] px-3 py-1 rounded-full font-mono">
                    {scanStatus}
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        <div className="p-5 space-y-3">
          <button
            onClick={streaming ? stopCamera : startCamera}
            className={`w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              streaming
                ? 'bg-neutral-900 text-white hover:bg-neutral-700'
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}
          >
            {streaming ? '⏹ Stop Camera' : '📷 Start Camera'}
          </button>

          {error && <p className="text-[11px] text-red-500 text-center">{error}</p>}

          {scannedMaterial && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
              <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-1">✓ Asset identified</p>
              <p className="text-xs font-bold text-slate-900">{scannedMaterial.name}</p>
              <p className="text-[10px] font-mono text-slate-500 mt-0.5">{scannedMaterial.codification}</p>
            </div>
          )}

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-[#D2D2D7]/50" />
            <span className="text-[10px] text-[#86868B] uppercase tracking-wider">or select manually</span>
            <div className="flex-1 h-px bg-[#D2D2D7]/50" />
          </div>

          <select
            className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-[#D2D2D7]/60 rounded-xl cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#FF1E1E]"
            defaultValue=""
            onChange={(e) => {
              const mat = materials.find(m => m.id === e.target.value);
              if (mat) { setScannedMaterial(mat); onSelectMaterial(mat); }
            }}
          >
            <option value="" disabled>Choose a material...</option>
            {materials.map(m => (
              <option key={m.id} value={m.id}>{m.codification} — {m.name}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}