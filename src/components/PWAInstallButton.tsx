import React, { useState } from 'react';
import { Download, Share, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  compact?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className="inline-flex items-center justify-center gap-2 min-h-[40px] rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-900 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
      >
        <Download className="w-4 h-4 text-slate-700" />
        <span>{compact ? 'Install' : 'Install Aplikasi'}</span>
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowGuide(true)}
        className="inline-flex items-center justify-center gap-2 min-h-[40px] rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
      >
        <Smartphone className="w-4 h-4 text-slate-600" />
        <span>{compact ? 'PWA HP' : 'Pasang di HP'}</span>
      </button>

      {showGuide && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/50 p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-guide-title"
        >
          <div className="w-full sm:max-w-md rounded-t-2xl sm:rounded-xl bg-white border border-slate-200 p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 id="pwa-guide-title" className="text-base font-semibold text-slate-900">
                  Pasang GudangKu di Layar Utama
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  Akses cepat mode layar penuh layaknya aplikasi native di ponsel gudang.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="min-h-[44px] min-w-[44px] -mr-2 -mt-2 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
                aria-label="Tutup panduan instalasi"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isIOS ? (
              <ol className="mt-4 space-y-2.5 text-sm text-slate-700 border-t border-slate-100 pt-4">
                <li className="flex items-start gap-2.5">
                  <span className="font-mono text-xs font-semibold text-slate-500 mt-0.5">01.</span>
                  <span>
                    Ketuk ikon <strong className="font-semibold text-slate-900 inline-flex items-center gap-1">Bagikan <Share className="w-3.5 h-3.5 inline" /></strong> pada bilah Safari di bagian bawah layar.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="font-mono text-xs font-semibold text-slate-500 mt-0.5">02.</span>
                  <span>
                    Gulir ke bawah dan pilih <strong className="font-semibold text-slate-900">Tambah ke Layar Utama</strong>.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="font-mono text-xs font-semibold text-slate-500 mt-0.5">03.</span>
                  <span>Ketuk <strong className="font-semibold text-slate-900">Tambah</strong> untuk memasang ikon aplikasi.</span>
                </li>
              </ol>
            ) : (
              <ol className="mt-4 space-y-2.5 text-sm text-slate-700 border-t border-slate-100 pt-4">
                <li className="flex items-start gap-2.5">
                  <span className="font-mono text-xs font-semibold text-slate-500 mt-0.5">01.</span>
                  <span>Buka menu browser Chrome atau Edge (ikon tiga titik di pojok kanan atas).</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="font-mono text-xs font-semibold text-slate-500 mt-0.5">02.</span>
                  <span>Pilih <strong className="font-semibold text-slate-900">Instal aplikasi</strong> atau <strong className="font-semibold text-slate-900">Tambahkan ke layar utama</strong>.</span>
                </li>
              </ol>
            )}

            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="mt-6 w-full min-h-[44px] rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  );
};
