import { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export function PWAInstallButton() {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className="inline-flex items-center gap-2 rounded-lg border border-[#9A6B32] bg-[#9A6B32] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#825827] whitespace-nowrap shrink-0"
      >
        <Download className="h-3.5 w-3.5" />
        <span>Instalar App</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-3.5 py-2 text-xs font-medium text-[#1C1917] transition-colors hover:bg-stone-50 whitespace-nowrap shrink-0"
        >
          <Smartphone className="h-3.5 w-3.5 text-[#9A6B32]" />
          <span>Instalar en iPhone</span>
        </button>

        {showIOSGuide && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
            role="dialog"
            aria-modal="true"
            aria-label="Instalar en iPhone o iPad"
          >
            <div className="w-full max-w-sm rounded-xl border border-stone-200 bg-white p-6 shadow-xl">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-serif text-xl font-semibold text-[#1C1917]">
                  Instalar en iPhone / iPad
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="rounded-lg p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
                  aria-label="Cerrar"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-stone-600">
                1. Toca el botón <strong>Compartir</strong> en la barra inferior de Safari.
                <br />
                2. Desliza hacia abajo y elige <strong>Agregar a inicio</strong>.
              </p>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-lg bg-[#1C1917] py-2.5 text-xs font-semibold text-white transition-colors hover:bg-stone-800"
              >
                Entendido
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
}
