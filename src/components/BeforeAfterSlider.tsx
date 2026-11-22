import { useState } from 'react';
import { MoveHorizontal } from 'lucide-react';

interface BeforeAfterSliderProps {
  originalUrl: string;
  resultUrl: string;
  viewMode: 'compare' | 'result' | 'original';
}

export function BeforeAfterSlider({
  originalUrl,
  resultUrl,
  viewMode,
}: BeforeAfterSliderProps) {
  const [splitPercent, setSplitPercent] = useState(52);
  const [resultError, setResultError] = useState(false);

  if (viewMode === 'original') {
    return (
      <div className="relative h-full w-full overflow-hidden bg-stone-100">
        <img
          src={originalUrl}
          alt="Fotografía original del mueble"
          referrerPolicy="no-referrer"
          className="h-full w-full object-contain"
        />
        <span className="pointer-events-none absolute left-4 top-4 bg-black/70 px-2.5 py-1 text-xs font-medium text-white rounded">
          Foto Original
        </span>
      </div>
    );
  }

  if (viewMode === 'result' || resultError) {
    return (
      <div className="relative h-full w-full overflow-hidden bg-stone-100">
        {resultError ? (
          <div className="flex h-full flex-col items-center justify-center p-6 text-center text-sm text-stone-600">
            No se pudo renderizar la imagen generada. Intenta nuevamente.
          </div>
        ) : (
          <img
            src={resultUrl}
            alt="Propuesta personalizada del mueble"
            referrerPolicy="no-referrer"
            onError={() => setResultError(true)}
            className="h-full w-full object-contain"
          />
        )}
        <span className="pointer-events-none absolute right-4 top-4 bg-[#1C1917]/80 px-2.5 py-1 text-xs font-medium text-white rounded">
          Propuesta Nueva
        </span>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full select-none overflow-hidden bg-stone-100">
      {/* Base layer: Result */}
      <img
        src={resultUrl}
        alt="Propuesta personalizada del mueble"
        referrerPolicy="no-referrer"
        onError={() => setResultError(true)}
        className="h-full w-full object-contain"
      />

      {/* Clipped overlay: Original */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - splitPercent}% 0 0)` }}
      >
        <img
          src={originalUrl}
          alt="Fotografía original del mueble"
          referrerPolicy="no-referrer"
          className="h-full w-full object-contain"
        />
      </div>

      {/* Labels */}
      <span className="pointer-events-none absolute left-4 top-4 bg-black/65 px-2.5 py-1 text-xs font-medium text-white rounded">
        Original
      </span>
      <span className="pointer-events-none absolute right-4 top-4 bg-[#1C1917]/80 px-2.5 py-1 text-xs font-medium text-white rounded">
        Nuevo Diseño
      </span>

      {/* Divider line and handle */}
      <div
        className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow-[0_0_8px_rgba(0,0,0,0.45)]"
        style={{ left: `${splitPercent}%` }}
      >
        <div className="absolute left-1/2 top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-stone-200 bg-white text-[#1C1917] shadow-md">
          <MoveHorizontal className="h-4 w-4" />
        </div>
      </div>

      {/* Interactive range control spanning the whole container */}
      <input
        type="range"
        min={2}
        max={98}
        value={splitPercent}
        onChange={(e) => setSplitPercent(Number(e.target.value))}
        aria-label="Comparar foto original y diseño nuevo"
        className="absolute inset-0 z-10 h-full w-full cursor-ew-resize opacity-0"
      />
    </div>
  );
}
