import { useEffect, useRef, useState } from 'react';
import { Camera, RefreshCw, Upload, X } from 'lucide-react';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (dataUrl: string, width: number, height: number) => void;
  onFallbackFilePick: () => void;
}

export function CameraModal({
  isOpen,
  onClose,
  onCapture,
  onFallbackFilePick,
}: CameraModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      setIsReady(false);
      setErrorMsg(null);
      return;
    }

    let cancelled = false;

    async function startCamera() {
      setErrorMsg(null);
      setIsReady(false);

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setErrorMsg(
          'Tu navegador no permite abrir la cámara en directo aquí. Usa "Tomar / Elegir Foto" para usar la cámara nativa.'
        );
        return;
      }

      try {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1280 },
            height: { ideal: 960 },
          },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setIsReady(true);
        }
      } catch {
        if (!cancelled) {
          setErrorMsg(
            'No se pudo acceder a la cámara en vivo. Puedes tomar la foto directamente con el botón inferior de galería/cámara.'
          );
        }
      }
    }

    startCamera();

    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [isOpen, facingMode]);

  if (!isOpen) return null;

  const handleCapturePhoto = () => {
    const video = videoRef.current;
    if (!video || !isReady) return;

    const vw = video.videoWidth || 960;
    const vh = video.videoHeight || 720;
    const maxDim = 960;
    let tw = vw;
    let th = vh;

    if (vw > maxDim || vh > maxDim) {
      if (vw >= vh) {
        tw = maxDim;
        th = Math.round((vh / vw) * maxDim);
      } else {
        th = maxDim;
        tw = Math.round((vw / vh) * maxDim);
      }
    }

    tw = Math.max(256, Math.round(tw / 16) * 16);
    th = Math.max(256, Math.round(th / 16) * 16);

    const canvas = document.createElement('canvas');
    canvas.width = tw;
    canvas.height = th;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, tw, th);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    onCapture(dataUrl, tw, th);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Cámara de Muebles El Campanario"
    >
      <div className="w-full max-w-xl overflow-hidden rounded-xl border border-stone-800 bg-[#1C1917] text-stone-100 shadow-2xl">
        <div className="flex items-center justify-between border-b border-stone-800 px-5 py-3.5">
          <h3 className="font-serif text-xl font-semibold tracking-tight text-stone-100">
            Fotografiar Mueble
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-stone-400 transition-colors hover:bg-stone-800 hover:text-white focus-visible:outline-2 focus-visible:outline-[#9A6B32]"
            aria-label="Cerrar cámara"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="relative aspect-[4/3] w-full bg-black">
          {errorMsg ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
              <Camera className="h-10 w-10 text-stone-500" />
              <p className="max-w-sm text-sm leading-relaxed text-stone-300">{errorMsg}</p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onFallbackFilePick();
                }}
                className="inline-flex items-center gap-2 rounded-lg bg-[#9A6B32] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#825827] whitespace-nowrap shrink-0"
              >
                <Upload className="h-4 w-4" />
                <span>Tomar o Subir Foto</span>
              </button>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                playsInline
                muted
                className="h-full w-full object-cover"
              />
              {/* Subtle framing corner guides */}
              <div className="pointer-events-none absolute inset-6 border border-white/25 rounded-lg" />
            </>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-stone-800 px-5 py-4">
          <button
            type="button"
            onClick={() =>
              setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))
            }
            className="inline-flex items-center gap-2 rounded-lg border border-stone-700 px-3.5 py-2 text-xs font-medium text-stone-200 transition-colors hover:bg-stone-800 whitespace-nowrap shrink-0"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Voltear Cámara</span>
          </button>

          <button
            type="button"
            disabled={!isReady}
            onClick={handleCapturePhoto}
            className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-2.5 text-sm font-semibold text-[#1C1917] transition-colors hover:bg-stone-200 disabled:cursor-not-allowed disabled:opacity-40 whitespace-nowrap shrink-0"
          >
            <Camera className="h-4 w-4" />
            <span>Capturar Foto</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onFallbackFilePick();
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-stone-700 px-3.5 py-2 text-xs font-medium text-stone-200 transition-colors hover:bg-stone-800 whitespace-nowrap shrink-0"
          >
            <Upload className="h-4 w-4" />
            <span>Galería</span>
          </button>
        </div>
      </div>
    </div>
  );
}
