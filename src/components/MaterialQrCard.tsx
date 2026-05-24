import React, { useState, useEffect } from 'react';
import { Material } from '../types';
import { Printer, Download, Tag, Grid, Loader2, FileText } from 'lucide-react';
// Local fallback encrypt function to avoid missing module import.
// Encodes codification to a URL-safe base64 string.
const encryptCodification = (value: string) => {
  try {
    // handle unicode
    const encoded = encodeURIComponent(value).replace(/%([0-9A-F]{2})/g, (_, p) => String.fromCharCode(parseInt(p, 16)));
    return btoa(encoded);
  } catch (e) {
    return btoa(value);
  }
};
import QRCode from 'qrcode';

interface MaterialQrCardProps {
  material: Material;
  onClose?: () => void;
}

export default function MaterialQrCard({ material, onClose }: MaterialQrCardProps) {
  const [qrUrl, setQrUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const generate = async () => {
      try {
        setLoading(true);
        const encryptedPayload = encryptCodification(material.codification);
        const dataUrl = await QRCode.toDataURL(encryptedPayload, {
          width: 300,
          margin: 1,
          color: {
            dark: '#0f172a',
            light: '#ffffff'
          }
        });
        if (active) {
          setQrUrl(dataUrl);
        }
      } catch (err) {
        console.error('Failed to generate local QR Code: ', err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    generate();
    return () => {
      active = false;
    };
  }, [material]);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Print Label - ${material.codification}</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
                padding: 20px;
                background: #fff;
              }
              .label-card {
                border: 2px solid #000;
                padding: 24px;
                border-radius: 12px;
                text-align: center;
                width: 320px;
                box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
              }
              .company {
                font-size: 14px;
                font-weight: 700;
                letter-spacing: 0.15em;
                text-transform: uppercase;
                color: #475569;
                margin-bottom: 4px;
              }
              .title {
                font-size: 18px;
                font-weight: 600;
                margin: 8px 0;
                color: #0f172a;
              }
              .qr-container {
                margin: 16px 0;
              }
              .code-badge {
                background: #f1f5f9;
                color: #0f172a;
                padding: 6px 12px;
                border-radius: 20px;
                font-weight: 700;
                font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
                letter-spacing: 0.05em;
                font-size: 15px;
                border: 1px solid #cbd5e1;
                display: inline-block;
              }
              .footer-label {
                font-size: 11px;
                color: #64748b;
                margin-top: 12px;
              }
            </style>
          </head>
          <body onload="window.print(); window.close();">
            <div class="label-card">
              <div class="company">${material.company} Group IT</div>
              <div class="title">${material.name}</div>
              <div class="qr-container">
                <img src="${qrUrl}" width="180" height="180" alt="QR Code" />
              </div>
              <div class="code-badge">${material.codification}</div>
              <div class="footer-label">SCAN TO AUDIT INVENTORY ELEMENT</div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden p-6 max-w-sm w-full mx-auto animate-in fade-in zoom-in-95 duration-250">
      <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">IT Asset Plate</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-50"
          >
            <Grid className="w-4 h-4 rotate-45" />
          </button>
        )}
      </div>

      <div className="flex flex-col items-center py-4 bg-slate-50/50 rounded-2xl border border-slate-100 mb-5 relative overflow-hidden group">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
          {material.company} CORPORATION
        </span>
        
        {/* QR Frame Container */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center relative mb-4 w-48 h-48">
          {loading ? (
            <Loader2 className="w-8 h-8 text-[#FF1E1E] animate-spin" />
          ) : (
            <img
              src={qrUrl}
              alt={`QR plate for ${material.codification}`}
              className="w-44 h-44 object-contain select-none"
              referrerPolicy="no-referrer"
            />
          )}
        </div>

        {/* Dynamic Codification Badge */}
        <div className="px-4 py-1.5 bg-slate-900 text-white rounded-full font-mono text-sm font-bold tracking-wider shadow-sm flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          {material.codification}
        </div>
      </div>

      {/* Asset Description Metadata */}
      <div className="space-y-2 mb-6 px-1">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Device Asset</span>
          <span className="text-sm font-medium text-slate-800 line-clamp-1">{material.name}</span>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-1">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Type</span>
            <span className="text-xs font-medium text-slate-600">{material.type}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Serial</span>
            <span className="text-xs font-mono text-slate-600 line-clamp-1">{material.serialNumber}</span>
          </div>
        </div>

        {/* Notes — only rendered when present */}
        {material.notes && material.notes.trim() !== '' && (
          <div className="mt-2 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-1.5 mb-1">
              <FileText className="w-3 h-3 text-slate-400" />
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Remarks</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 italic">
              {material.notes}
            </p>
          </div>
        )}
      </div>

      {/* Control Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={handlePrint}
          className="flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-900 border border-transparent hover:bg-slate-850 active:scale-98 transition-all rounded-xl text-xs font-medium text-white shadow-sm"
        >
          <Printer className="w-3.5 h-3.5" />
          Print Plate
        </button>
        <a
          href={qrUrl}
          target="_blank"
          download={`${material.codification}.png`}
          onClick={(e) => {
            // Downloading generated image
          }}
          className="flex items-center justify-center gap-2 py-2.5 px-4 bg-white border border-slate-200 hover:bg-slate-50 active:scale-98 transition-all rounded-xl text-xs font-semibold text-slate-700 shadow-sm"
        >
          <Download className="w-3.5 h-3.5" />
          Download QR
        </a>
      </div>
    </div>
  );
}
