import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Material, SubNode } from '../types';

interface QrScannerTabProps {
  materials: Material[];
  subNodes: SubNode[];
  onSelectMaterial: (m: Material) => void;
}

function decryptQr(value: string): string {
  if (!value) return '';
  try {
    const PREFIX = 'LUXESTILE-SECURE-ERP://[CLASS-A]::';
    const payload = value.startsWith(PREFIX) ? value.replace(PREFIX, '') : value;
    return atob(payload);
  } catch {
    return value;
  }
}

function tryDecode(ctx: CanvasRenderingContext2D, w: number, h: number): string | null {
  // @ts-ignore
  const jsQR = window.jsQR;
  if (typeof jsQR !== 'function') return null;
  const imageData = ctx.getImageData(0, 0, w, h);
  const code = jsQR(imageData.data, imageData.width, imageData.height, {
    inversionAttempts: 'attemptBoth',
  });
  return code?.data ?? null;
}

function smartDecode(img: HTMLImageElement): string | null {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;

  for (const maxSide of [1024, 800, 600, 400, 1280]) {
    const ratio = Math.min(maxSide / img.width, maxSide / img.height, 1);
    const w = Math.round(img.width * ratio);
    const h = Math.round(img.height * ratio);
    canvas.width = w; canvas.height = h;
    ctx.drawImage(img, 0, 0, w, h);
    const r = tryDecode(ctx, w, h);
    if (r) return r;
  }

  for (const fraction of [0.6, 0.5, 0.7, 0.4]) {
    const cw = Math.round(img.width * fraction);
    const ch = Math.round(img.height * fraction);
    const cx = Math.round((img.width - cw) / 2);
    const cy = Math.round((img.height - ch) / 2);
    const ratio = Math.min(800 / cw, 800 / ch, 1);
    canvas.width = Math.round(cw * ratio);
    canvas.height = Math.round(ch * ratio);
    ctx.drawImage(img, cx, cy, cw, ch, 0, 0, canvas.width, canvas.height);
    const r = tryDecode(ctx, canvas.width, canvas.height);
    if (r) return r;
  }

  for (const [qx, qy] of [[0, 0], [0.5, 0], [0, 0.5], [0.5, 0.5]]) {
    const qw = Math.round(img.width * 0.55);
    const qh = Math.round(img.height * 0.55);
    canvas.width = 700; canvas.height = 700;
    ctx.drawImage(img, Math.round(img.width * qx), Math.round(img.height * qy), qw, qh, 0, 0, 700, 700);
    const r = tryDecode(ctx, 700, 700);
    if (r) return r;
  }

  return null;
}

export default function QrScannerTab({ materials, subNodes, onSelectMaterial }: QrScannerTabProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const activeRef = useRef(false);

  const [streaming, setStreaming] = useState(false);
  const [scannedMaterial, setScannedMaterial] = useState<Material | null>(null);
  const [error, setError] = useState('');
  const [scanStatus, setScanStatus] = useState('');
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploadScanStatus, setUploadScanStatus] = useState('');

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
        inversionAttempts: 'attemptBoth',
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
    setUploadPreview(null);
    setUploadScanStatus('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setScannedMaterial(null);
    setUploadScanStatus('Reading image...');
    stopCamera();
    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target?.result as string;
      setUploadPreview(src);
      const img = new Image();
      img.onload = () => {
        setUploadScanStatus('Scanning...');
        setTimeout(() => {
          const result = smartDecode(img);
          if (result) {
            setUploadScanStatus('✓ QR detected!');
            const codification = decryptQr(result);
            const found = materials.find(
              m => m.codification === codification || m.id === codification
            );
            if (found) {
              setScannedMaterial(found);
              onSelectMaterial(found);
            } else {
              setError(`No asset matched: "${codification}"`);
              setUploadScanStatus('QR found but no asset matched');
            }
          } else {
            setUploadScanStatus('No QR code found');
            setError('No QR detected. Try taking a closer photo of just the QR code.');
          }
        }, 50);
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  useEffect(() => () => stopCamera(), [stopCamera]);

  // Resolve assigned sub-node name for the scanned material
  const assignedNode = scannedMaterial
    ? subNodes.find(s => s.id === scannedMaterial.assignedNodeId)
    : null;

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

          {!streaming && uploadPreview && (
            <img src={uploadPreview} alt="Uploaded QR" className="w-full h-full object-contain" />
          )}

          {!streaming && !uploadPreview && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-neutral-500">
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

          {!streaming && uploadPreview && uploadScanStatus && (
            <div className="absolute bottom-3 left-0 right-0 flex justify-center">
              <span className={`text-[10px] px-3 py-1 rounded-full font-mono ${
                uploadScanStatus.startsWith('✓')
                  ? 'bg-emerald-600/80 text-white'
                  : uploadScanStatus === 'Scanning...' || uploadScanStatus === 'Reading image...'
                  ? 'bg-black/70 text-white'
                  : 'bg-red-600/80 text-white'
              }`}>
                {uploadScanStatus}
              </span>
            </div>
          )}
        </div>

        <div className="p-5 space-y-3">
          <div className="flex gap-2">
            <button
              onClick={streaming ? stopCamera : startCamera}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                streaming
                  ? 'bg-neutral-900 text-white hover:bg-neutral-700'
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              {streaming ? '⏹ Stop Camera' : 'Start Camera'}
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleImageUpload}
            />

            <button
              onClick={() => { stopCamera(); fileInputRef.current?.click(); }}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer bg-slate-100 text-slate-700 hover:bg-slate-200 border border-[#D2D2D7]/60"
            >
              Upload Photo
            </button>
          </div>

          {error && <p className="text-[11px] text-red-500 text-center">{error}</p>}

          {/* ── Asset result card ── */}
          {scannedMaterial && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1.5">
              <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">✓ Asset identified</p>
              <p className="text-xs font-bold text-slate-900">{scannedMaterial.name}</p>
              <p className="text-[10px] font-mono text-slate-500">{scannedMaterial.codification}</p>

              {/* Assigned user / sub-node */}
              <div className="pt-1 border-t border-emerald-200 flex items-center gap-1.5">
                <span className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wider">Assigned to</span>
                <span className="text-[10px] font-bold text-slate-800">
                  {assignedNode
                    ? `${assignedNode.name}${assignedNode.role ? ` — ${assignedNode.role}` : ''}`
                    : 'Unassigned'}
                </span>
              </div>
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