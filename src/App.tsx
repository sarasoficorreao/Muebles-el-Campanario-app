import { useEffect, useRef, useState } from 'react';
import {
  Camera,
  Check,
  Copy,
  Download,
  FileText,
  Hammer,
  ImagePlus,
  Layers,
  Loader2,
  RotateCcw,
  Share2,
  Trash2,
  Upload,
} from 'lucide-react';
import { BeforeAfterSlider } from './components/BeforeAfterSlider';
import { CameraModal } from './components/CameraModal';
import {
  FORJA_PRESETS,
  QUICK_PROMPT_EXAMPLES,
  SAMPLE_FURNITURE,
  UPHOLSTERY_PRESETS,
  WOOD_PRESETS,
} from './data/presets';
import type { HistoryVariation, MaterialPreset, WorkshopSpec } from './types';
import {
  buildWorkshopSheetDataUrl,
  downloadDataUrl,
  shareDesignImage,
} from './utils/imageExport';
import { resizeImageInput } from './utils/imageResize';
import { transformFurniture } from './utils/transformFurniture';

const HISTORY_STORAGE_KEY = 'campanario_studio_history_v1';

export default function App() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraFileInputRef = useRef<HTMLInputElement | null>(null);

  // Active furniture photo state
  const [originalDataUrl, setOriginalDataUrl] = useState<string | null>(null);
  const [imageDims, setImageDims] = useState<{ width: number; height: number }>({
    width: 896,
    height: 672,
  });
  const [activeSampleId, setActiveSampleId] = useState<string | null>(null);

  // Prompt & Swatch selection
  const [prompt, setPrompt] = useState<string>('');
  const [activeMaterialTab, setActiveMaterialTab] = useState<'wood' | 'upholstery' | 'forja'>(
    'wood'
  );
  const [selectedWood, setSelectedWood] = useState<MaterialPreset | null>(null);
  const [selectedUpholstery, setSelectedUpholstery] = useState<MaterialPreset | null>(null);
  const [selectedForja, setSelectedForja] = useState<MaterialPreset | null>(null);

  // Result & UI state
  const [resultDataUrl, setResultDataUrl] = useState<string | null>(null);
  const [workshopSpec, setWorkshopSpec] = useState<WorkshopSpec | null>(null);
  const [engineLabel, setEngineLabel] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'compare' | 'result' | 'original'>('compare');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExportingSheet, setIsExportingSheet] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [history, setHistory] = useState<HistoryVariation[]>(() => {
    try {
      const saved = localStorage.getItem(HISTORY_STORAGE_KEY);
      return saved ? (JSON.parse(saved) as HistoryVariation[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history.slice(0, 6)));
    } catch {
      // Ignore storage quota issues gracefully
    }
  }, [history]);

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => {
      setFeedbackToast((current) => (current === msg ? null : current));
    }, 3400);
  };

  const handleLoadImageFile = async (file: File) => {
    setErrorMsg(null);
    try {
      const resized = await resizeImageInput(file, 960);
      setOriginalDataUrl(resized.dataUrl);
      setImageDims({ width: resized.width, height: resized.height });
      setResultDataUrl(null);
      setWorkshopSpec(null);
      setEngineLabel(null);
      setActiveSampleId(null);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'No se pudo procesar la foto.');
    }
  };

  const handleSelectSample = async (sampleId: string, imageUrl: string, suggestedPrompt: string) => {
    setErrorMsg(null);
    try {
      const resized = await resizeImageInput(imageUrl, 960);
      setOriginalDataUrl(resized.dataUrl);
      setImageDims({ width: resized.width, height: resized.height });
      setResultDataUrl(null);
      setWorkshopSpec(null);
      setEngineLabel(null);
      setActiveSampleId(sampleId);
      setPrompt(suggestedPrompt);
      setSelectedWood(null);
      setSelectedUpholstery(null);
      setSelectedForja(null);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error cargando la muestra.');
    }
  };

  const handleCameraCapture = (dataUrl: string, width: number, height: number) => {
    setErrorMsg(null);
    setOriginalDataUrl(dataUrl);
    setImageDims({ width, height });
    setResultDataUrl(null);
    setWorkshopSpec(null);
    setEngineLabel(null);
    setActiveSampleId(null);
  };

  const togglePreset = (preset: MaterialPreset) => {
    if (preset.category === 'wood') {
      setSelectedWood((prev) => (prev?.id === preset.id ? null : preset));
    } else if (preset.category === 'upholstery') {
      setSelectedUpholstery((prev) => (prev?.id === preset.id ? null : preset));
    } else {
      setSelectedForja((prev) => (prev?.id === preset.id ? null : preset));
    }
  };

  const composeEffectivePrompt = () => {
    const parts: string[] = [];
    if (prompt.trim()) {
      parts.push(prompt.trim());
    }
    if (selectedWood) {
      parts.push(selectedWood.promptPhraseEs);
    }
    if (selectedUpholstery) {
      parts.push(selectedUpholstery.promptPhraseEs);
    }
    if (selectedForja) {
      parts.push(selectedForja.promptPhraseEs);
    }
    return parts.join(', ');
  };

  const handleTransform = async () => {
    if (!originalDataUrl) {
      setErrorMsg('Primero toma o sube una fotografía del mueble.');
      return;
    }

    const effectivePrompt = composeEffectivePrompt();
    if (!effectivePrompt) {
      setErrorMsg('Escribe una instrucción o selecciona un tono de madera, tapizado o forja.');
      return;
    }

    setErrorMsg(null);
    setIsProcessing(true);

    try {
      const data = await transformFurniture({
        imageDataUrl: originalDataUrl,
        prompt: prompt.trim() || effectivePrompt,
        woodOption: selectedWood?.name,
        upholsteryOption: selectedUpholstery?.name,
        forjaOption: selectedForja?.name,
        width: imageDims.width,
        height: imageDims.height,
      });

      setResultDataUrl(data.resultDataUrl);
      setWorkshopSpec(data.workshopSpec);
      setEngineLabel(data.engineLabel);
      setViewMode('compare');

      const newEntry: HistoryVariation = {
        id: `${Date.now()}`,
        createdAt: new Date().toLocaleTimeString('es-CO', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        originalDataUrl,
        resultDataUrl: data.resultDataUrl,
        prompt: prompt.trim() || effectivePrompt,
        woodLabel: selectedWood?.name,
        upholsteryLabel: selectedUpholstery?.name,
        forjaLabel: selectedForja?.name,
        engineUsed: data.engineUsed,
        engineLabel: data.engineLabel,
        workshopSpec: data.workshopSpec,
        seed: data.seed,
      };
      setHistory((prev) => [newEntry, ...prev].slice(0, 6));
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Error al conectar con el motor gratuito. Vuelve a intentar.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUseResultAsBase = async () => {
    if (!resultDataUrl) return;
    try {
      const resized = await resizeImageInput(resultDataUrl, 960);
      setOriginalDataUrl(resized.dataUrl);
      setImageDims({ width: resized.width, height: resized.height });
      setResultDataUrl(null);
      setWorkshopSpec(null);
      setPrompt('');
      setSelectedWood(null);
      setSelectedUpholstery(null);
      setSelectedForja(null);
      showToast('Resultado fijado como nueva base para seguir editando');
    } catch {
      setErrorMsg('No se pudo tomar este resultado como base.');
    }
  };

  const handleDownloadResult = () => {
    if (!resultDataUrl) return;
    downloadDataUrl(resultDataUrl, `el-campanario-diseno-${Date.now()}.png`);
    showToast('Imagen descargada en tu dispositivo');
  };

  const handleDownloadWorkshopSheet = async () => {
    if (!originalDataUrl || !resultDataUrl || !workshopSpec) return;
    setIsExportingSheet(true);
    try {
      const sheetUrl = await buildWorkshopSheetDataUrl({
        originalDataUrl,
        resultDataUrl,
        prompt: composeEffectivePrompt() || 'Personalización de taller',
        spec: workshopSpec,
      });
      downloadDataUrl(sheetUrl, `ficha-taller-campanario-${Date.now()}.png`);
      showToast('Ficha técnica para taller descargada');
    } catch {
      setErrorMsg('No se pudo generar la ficha descargable.');
    } finally {
      setIsExportingSheet(false);
    }
  };

  const handleShare = async () => {
    if (!resultDataUrl) return;
    try {
      const status = await shareDesignImage({
        dataUrl: resultDataUrl,
        prompt: composeEffectivePrompt(),
      });
      if (status === 'shared') {
        showToast('Imagen compartida');
      } else if (status === 'whatsapp-copied') {
        showToast('Imagen descargada y descripción copiada para pegar en WhatsApp');
      } else {
        showToast('Imagen descargada para compartir');
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      handleDownloadResult();
    }
  };

  const handleCopySpecText = async () => {
    if (!workshopSpec) return;
    const summary = [
      'Muebles El Campanario — Especificación de Taller',
      `Solicitud: ${composeEffectivePrompt()}`,
      `Madera: ${workshopSpec.madera}`,
      `Tapizado: ${workshopSpec.tapizado}`,
      `Forja / Espaldar: ${workshopSpec.forja}`,
      `Calibres sugeridos: ${workshopSpec.calibreSugerido}`,
      `Notas: ${workshopSpec.notasTaller}`,
    ].join('\n');

    try {
      await navigator.clipboard.writeText(summary);
      showToast('Especificación copiada al portapapeles');
    } catch {
      setErrorMsg('No se pudo copiar al portapapeles.');
    }
  };

  const handleLoadHistoryItem = (item: HistoryVariation) => {
    setOriginalDataUrl(item.originalDataUrl);
    setResultDataUrl(item.resultDataUrl);
    setPrompt(item.prompt);
    setWorkshopSpec(item.workshopSpec);
    setEngineLabel(item.engineLabel);
    setViewMode('compare');
    document.getElementById('estudio')?.scrollIntoView({ behavior: 'smooth' });
  };

  const activePresetList =
    activeMaterialTab === 'wood'
      ? WOOD_PRESETS
      : activeMaterialTab === 'upholstery'
      ? UPHOLSTERY_PRESETS
      : FORJA_PRESETS;

  const selectedLabels = [
    selectedWood?.name,
    selectedUpholstery?.name,
    selectedForja?.name,
  ].filter(Boolean) as string[];

  return (
    <div className="min-h-screen bg-[#F8F7F4] text-[#1C1917]">
      {/* Hidden native inputs for file & direct mobile camera capture */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleLoadImageFile(file);
          e.target.value = '';
        }}
      />
      <input
        ref={cameraFileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleLoadImageFile(file);
          e.target.value = '';
        }}
      />

      {/* Top Bar Contract: 3 exact zones separated by gap-8 */}
      <header className="sticky top-0 z-30 border-b border-stone-200/80 bg-[#F8F7F4]/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1320px] items-center justify-between gap-8 px-4 py-3.5 sm:px-6 lg:px-8">
          <a
            href="#estudio"
            className="font-serif text-xl font-semibold tracking-tight text-[#1C1917] sm:text-2xl whitespace-nowrap shrink-0"
          >
            Muebles El Campanario
          </a>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-stone-600">
            <a
              href="#estudio"
              className="transition-colors hover:text-[#1C1917] hover:underline underline-offset-4 whitespace-nowrap shrink-0"
            >
              Estudio
            </a>
            <a
              href="#muestrario"
              onClick={() => setActiveMaterialTab('wood')}
              className="transition-colors hover:text-[#1C1917] hover:underline underline-offset-4 whitespace-nowrap shrink-0"
            >
              Muestrario
            </a>
            <a
              href="#muestrario"
              onClick={() => setActiveMaterialTab('forja')}
              className="transition-colors hover:text-[#1C1917] hover:underline underline-offset-4 whitespace-nowrap shrink-0"
            >
              Forja
            </a>
            <a
              href="#historial"
              className="transition-colors hover:text-[#1C1917] hover:underline underline-offset-4 whitespace-nowrap shrink-0"
            >
              Historial
            </a>
          </nav>

          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => setIsCameraOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-[#1C1917] px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-stone-800 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#9A6B32]"
            >
              <Camera className="h-4 w-4" />
              <span>Tomar Foto</span>
            </button>
          </div>
        </div>
      </header>

      {/* Subtle feedback toast */}
      {feedbackToast && (
        <div
          role="status"
          className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-lg border border-stone-700 bg-[#1C1917] px-4 py-2.5 text-xs font-medium text-white shadow-lg"
        >
          <Check className="h-4 w-4 text-[#D9A76A]" />
          <span>{feedbackToast}</span>
        </div>
      )}

      <main className="mx-auto max-w-[1320px] px-4 pb-16 pt-6 sm:px-6 sm:pt-8 lg:px-8">
        {/* Intro Strip */}
        <section className="mb-6 flex flex-col gap-4 border-b border-stone-200/80 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-medium tracking-wide text-[#9A6B32]">
              Carpintería · Tapicería · Forja Artesanal
            </p>
            <h1 className="mt-1.5 font-serif text-3xl font-semibold leading-tight tracking-tight text-[#1C1917] sm:text-4xl">
              Visualiza cambios en tus muebles sobre fotografías reales
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-stone-600 sm:text-base">
              Toma o sube una foto del mueble, describe el acabado de madera, tapizado o espaldar en
              forja que imaginas, y descarga o comparte la propuesta con tu cliente o herrero.
            </p>
          </div>

          {/* Sample Pieces Quick Strip */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-stone-500">
              Piezas de prueba del taller
            </span>
            <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
              {SAMPLE_FURNITURE.map((sample) => {
                const isSelected = activeSampleId === sample.id;
                return (
                  <button
                    key={sample.id}
                    type="button"
                    onClick={() =>
                      handleSelectSample(sample.id, sample.imageUrl, sample.suggestedPrompt)
                    }
                    className={`group flex items-center gap-2.5 rounded-lg border bg-white p-1.5 pr-3 text-left transition-all shrink-0 ${
                      isSelected
                        ? 'border-[#9A6B32] ring-1 ring-[#9A6B32]'
                        : 'border-stone-200 hover:border-stone-400'
                    }`}
                  >
                    <img
                      src={sample.imageUrl}
                      alt={sample.title}
                      referrerPolicy="no-referrer"
                      className="h-11 w-14 rounded object-cover bg-stone-100"
                    />
                    <div>
                      <div className="text-xs font-semibold text-[#1C1917] whitespace-nowrap">
                        {sample.title}
                      </div>
                      <div className="text-[11px] text-stone-500 whitespace-nowrap">
                        {sample.category}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Main Studio Split */}
        <section id="estudio" className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
          {/* Left 7 cols: Visor del Mueble */}
          <div className="lg:col-span-7">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const file = e.dataTransfer.files?.[0];
                if (file) handleLoadImageFile(file);
              }}
              className={`relative aspect-[4/3] w-full overflow-hidden rounded-xl border bg-white transition-colors ${
                isDragging
                  ? 'border-[#9A6B32] bg-[#EFECE6]/50'
                  : 'border-stone-200'
              }`}
            >
              {!originalDataUrl ? (
                <div className="flex h-full flex-col items-center justify-center p-6 text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl border border-stone-200 bg-[#F8F7F4] text-stone-700">
                    <ImagePlus className="h-6 w-6" />
                  </div>
                  <h2 className="font-serif text-2xl font-semibold text-[#1C1917]">
                    Carga o fotografía un mueble
                  </h2>
                  <p className="mt-1.5 max-w-md text-sm text-stone-600">
                    Toma una foto directa desde tu teléfono o sube una imagen de tu catálogo para
                    probar colores de madera, telas o espaldares en hierro forjado.
                  </p>
                  <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => setIsCameraOpen(true)}
                      className="inline-flex items-center gap-2 rounded-lg bg-[#1C1917] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-stone-800 whitespace-nowrap shrink-0"
                    >
                      <Camera className="h-4 w-4" />
                      <span>Abrir Cámara</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-5 py-2.5 text-sm font-medium text-[#1C1917] transition-colors hover:bg-stone-50 whitespace-nowrap shrink-0"
                    >
                      <Upload className="h-4 w-4" />
                      <span>Subir Archivo</span>
                    </button>
                  </div>
                  <p className="mt-4 text-xs text-stone-400">
                    También puedes seleccionar una de las 3 piezas de prueba arriba.
                  </p>
                </div>
              ) : resultDataUrl ? (
                <BeforeAfterSlider
                  originalUrl={originalDataUrl}
                  resultUrl={resultDataUrl}
                  viewMode={viewMode}
                />
              ) : (
                <div className="relative h-full w-full bg-stone-100">
                  <img
                    src={originalDataUrl}
                    alt="Fotografía cargada del mueble"
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-contain"
                  />
                  <span className="pointer-events-none absolute left-4 top-4 rounded bg-black/65 px-2.5 py-1 text-xs font-medium text-white">
                    Foto Base Lista
                  </span>
                </div>
              )}

              {/* Processing overlay */}
              {isProcessing && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#F8F7F4]/88 px-6 text-center backdrop-blur-[2px]">
                  <Loader2 className="h-8 w-8 animate-spin text-[#9A6B32]" />
                  <p className="mt-3 font-serif text-xl font-semibold text-[#1C1917]">
                    Trabajando en tu diseño de taller...
                  </p>
                  <p className="mt-1 max-w-sm text-xs leading-relaxed text-stone-600">
                    Procesando con IA gratuita sin registro (FLUX.1 Kontext / Pollinations). Puede
                    tomar entre 10 y 30 segundos según la cola gratuita.
                  </p>
                </div>
              )}
            </div>

            {/* Visor Controls Bar */}
            {originalDataUrl && (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  {resultDataUrl && (
                    <div className="flex items-center gap-1 rounded-lg bg-[#EFECE6] p-1">
                      {(
                        [
                          { id: 'compare', label: 'Comparar' },
                          { id: 'result', label: 'Resultado' },
                          { id: 'original', label: 'Original' },
                        ] as const
                      ).map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setViewMode(tab.id)}
                          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                            viewMode === tab.id
                              ? 'bg-white text-[#1C1917] shadow-sm'
                              : 'text-stone-600 hover:text-[#1C1917]'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-700 transition-colors hover:border-stone-400 hover:text-[#1C1917] whitespace-nowrap shrink-0"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    <span>Cambiar Foto</span>
                  </button>

                  {resultDataUrl && (
                    <button
                      type="button"
                      onClick={handleUseResultAsBase}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-700 transition-colors hover:border-stone-400 hover:text-[#1C1917] whitespace-nowrap shrink-0"
                    >
                      <Layers className="h-3.5 w-3.5" />
                      <span>Editar sobre este resultado</span>
                    </button>
                  )}
                </div>

                {/* Export & Share actions */}
                {resultDataUrl && (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleDownloadResult}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3.5 py-2 text-xs font-medium text-[#1C1917] transition-colors hover:bg-stone-50 whitespace-nowrap shrink-0"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Descargar Foto</span>
                    </button>

                    <button
                      type="button"
                      disabled={isExportingSheet}
                      onClick={handleDownloadWorkshopSheet}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3.5 py-2 text-xs font-medium text-[#1C1917] transition-colors hover:bg-stone-50 disabled:opacity-50 whitespace-nowrap shrink-0"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      <span>{isExportingSheet ? 'Generando...' : 'Ficha Taller'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleShare}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#9A6B32] px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-[#825827] whitespace-nowrap shrink-0"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                      <span>Compartir</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Workshop Spec Sheet Card (shown after generation) */}
            {workshopSpec && resultDataUrl && (
              <div className="mt-6 rounded-xl border border-stone-200 bg-white p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-4">
                  <div>
                    <h3 className="font-serif text-xl font-semibold text-[#1C1917]">
                      Especificación para Carpintería y Forja
                    </h3>
                    {engineLabel && (
                      <p className="mt-0.5 text-xs text-stone-500">Motor usado: {engineLabel}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleCopySpecText}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-700 transition-colors hover:bg-stone-50 whitespace-nowrap shrink-0"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copiar Resumen</span>
                  </button>
                </div>

                <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs font-medium text-[#9A6B32]">Madera y acabado</dt>
                    <dd className="mt-1 text-sm text-[#1C1917]">{workshopSpec.madera}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-[#9A6B32]">Tapizado</dt>
                    <dd className="mt-1 text-sm text-[#1C1917]">{workshopSpec.tapizado}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-[#9A6B32]">Espaldar / Forja</dt>
                    <dd className="mt-1 text-sm text-[#1C1917]">{workshopSpec.forja}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-[#9A6B32]">Calibres sugeridos</dt>
                    <dd className="mt-1 font-mono text-xs leading-relaxed text-stone-700">
                      {workshopSpec.calibreSugerido}
                    </dd>
                  </div>
                </dl>

                <div className="mt-4 border-t border-stone-100 pt-3">
                  <p className="text-xs font-medium text-stone-500">Notas de fabricación</p>
                  <p className="mt-1 text-sm leading-relaxed text-stone-700">
                    {workshopSpec.notasTaller}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right 5 cols: Mesa de Diseño */}
          <aside
            id="muestrario"
            className="rounded-xl border border-stone-200 bg-white p-5 sm:p-6 lg:col-span-5"
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-serif text-2xl font-semibold text-[#1C1917]">
                Mesa de Diseño
              </h2>
              {(prompt || selectedLabels.length > 0) && (
                <button
                  type="button"
                  onClick={() => {
                    setPrompt('');
                    setSelectedWood(null);
                    setSelectedUpholstery(null);
                    setSelectedForja(null);
                    setErrorMsg(null);
                  }}
                  className="inline-flex items-center gap-1 text-xs font-medium text-stone-500 transition-colors hover:text-[#1C1917] whitespace-nowrap shrink-0"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Limpiar</span>
                </button>
              )}
            </div>

            {/* Prompt Input */}
            <div className="mt-4">
              <label
                htmlFor="furniture-prompt"
                className="block text-xs font-semibold text-stone-700"
              >
                Describe el cambio con tus palabras
              </label>
              <textarea
                id="furniture-prompt"
                rows={4}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ej: Pasa el espaldar de madera a forja con un diseño de plantas sencillo y realista que lo pueda hacer alguien que sabe forja, madera en nogal oscuro y cojín en lino crudo."
                className="mt-1.5 w-full rounded-lg border border-stone-200 bg-[#F8F7F4] px-3.5 py-2.5 text-sm leading-relaxed text-[#1C1917] placeholder:text-stone-400 focus:border-[#9A6B32] focus:bg-white focus:outline-none"
              />

              {/* Quick example prompts */}
              <div className="mt-2.5 flex flex-col gap-1.5">
                <span className="text-[11px] font-medium text-stone-500">
                  Pedidos frecuentes (toca para rellenar):
                </span>
                <div className="flex flex-col gap-1.5">
                  {QUICK_PROMPT_EXAMPLES.slice(0, 2).map((example, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPrompt(example)}
                      className="rounded-lg border border-stone-200/80 bg-[#F8F7F4] px-3 py-2 text-left text-xs leading-snug text-stone-700 transition-colors hover:border-[#9A6B32]/60 hover:bg-white"
                    >
                      “{example}”
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="my-5 border-t border-stone-100" />

            {/* Muestrario Rápido Tabs */}
            <div id="forja">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-700">
                  Muestrario rápido (opcional)
                </span>
                <span className="text-[11px] text-stone-500">Combina con tu texto</span>
              </div>

              <div className="mt-2.5 grid grid-cols-3 gap-1 rounded-lg bg-[#EFECE6] p-1">
                <button
                  type="button"
                  onClick={() => setActiveMaterialTab('wood')}
                  className={`rounded-md py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    activeMaterialTab === 'wood'
                      ? 'bg-white text-[#1C1917] shadow-sm'
                      : 'text-stone-600 hover:text-[#1C1917]'
                  }`}
                >
                  Madera
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMaterialTab('upholstery')}
                  className={`rounded-md py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    activeMaterialTab === 'upholstery'
                      ? 'bg-white text-[#1C1917] shadow-sm'
                      : 'text-stone-600 hover:text-[#1C1917]'
                  }`}
                >
                  Tapizado
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMaterialTab('forja')}
                  className={`rounded-md py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    activeMaterialTab === 'forja'
                      ? 'bg-white text-[#1C1917] shadow-sm'
                      : 'text-stone-600 hover:text-[#1C1917]'
                  }`}
                >
                  Forja
                </button>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2.5">
                {activePresetList.map((preset) => {
                  const isSelected =
                    selectedWood?.id === preset.id ||
                    selectedUpholstery?.id === preset.id ||
                    selectedForja?.id === preset.id;

                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => togglePreset(preset)}
                      className={`flex items-start gap-2.5 rounded-lg border p-2.5 text-left transition-all ${
                        isSelected
                          ? 'border-[#9A6B32] bg-[#9A6B32]/5 ring-1 ring-[#9A6B32]'
                          : 'border-stone-200 bg-white hover:border-stone-400'
                      }`}
                    >
                      <span
                        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded border border-black/10"
                        style={{
                          background: preset.swatchSecondary
                            ? `linear-gradient(135deg, ${preset.swatchColor} 0%, ${preset.swatchSecondary} 100%)`
                            : preset.swatchColor,
                        }}
                      >
                        {preset.category === 'forja' && (
                          <Hammer className="h-3.5 w-3.5 text-stone-200" />
                        )}
                      </span>
                      <div className="min-w-0">
                        <div className="truncate text-xs font-semibold text-[#1C1917]">
                          {preset.name}
                        </div>
                        <div className="mt-0.5 truncate text-[11px] text-stone-500">
                          {preset.shortSpec}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Selections Metadata Line (unboxed text with middot separators) */}
            {selectedLabels.length > 0 && (
              <div className="mt-4 border-t border-stone-100 pt-3 text-xs text-stone-600">
                <span className="font-medium text-[#1C1917]">Selección activa: </span>
                {selectedLabels.join(' · ')}
              </div>
            )}

            {/* Error state */}
            {errorMsg && (
              <div
                role="alert"
                className="mt-4 rounded-lg border border-red-200 bg-red-50/70 px-3.5 py-2.5 text-xs leading-relaxed text-red-900"
              >
                {errorMsg}
              </div>
            )}

            {/* Primary CTA */}
            <div className="mt-5 flex flex-col gap-2">
              <button
                type="button"
                disabled={isProcessing || !originalDataUrl}
                onClick={handleTransform}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#1C1917] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-45 whitespace-nowrap"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Generando Propuesta...</span>
                  </>
                ) : (
                  <span>Aplicar Cambio al Mueble</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => cameraFileInputRef.current?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white px-4 py-2 text-xs font-medium text-stone-700 transition-colors hover:bg-stone-50 sm:hidden"
              >
                <Camera className="h-3.5 w-3.5" />
                <span>Cámara Rápida del Teléfono</span>
              </button>

              <p className="mt-1 text-center text-[11px] leading-relaxed text-stone-500">
                100% gratuito y sin registro · Usa FLUX.1 Kontext y Pollinations.ai
              </p>
            </div>
          </aside>
        </section>

        {/* History Section */}
        <section id="historial" className="mt-14 border-t border-stone-200/80 pt-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-serif text-2xl font-semibold text-[#1C1917]">
                Historial de Propuestas
              </h2>
              <p className="mt-0.5 text-xs text-stone-500">
                Guarda tus últimas pruebas en este dispositivo para compararlas con el cliente.
              </p>
            </div>
            {history.length > 0 && (
              <button
                type="button"
                onClick={() => setHistory([])}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-500 transition-colors hover:text-red-700 whitespace-nowrap shrink-0"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Vaciar historial</span>
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <div className="mt-5 rounded-xl border border-dashed border-stone-300 bg-white/60 px-6 py-8 text-center">
              <p className="text-sm text-stone-600">
                Aún no has generado variaciones en esta sesión. Selecciona una pieza arriba y
                prueba tu primer cambio.
              </p>
            </div>
          ) : (
            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="group flex flex-col overflow-hidden rounded-xl border border-stone-200 bg-white transition-shadow hover:shadow-md"
                >
                  <button
                    type="button"
                    onClick={() => handleLoadHistoryItem(item)}
                    className="relative aspect-[4/3] w-full overflow-hidden bg-stone-100 text-left"
                  >
                    <img
                      src={item.resultDataUrl}
                      alt={item.prompt}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                  </button>
                  <div className="flex flex-1 flex-col justify-between p-4">
                    <div>
                      <div className="flex items-center gap-2 text-[11px] text-stone-500">
                        <span className="tabular-nums">{item.createdAt}</span>
                        <span aria-hidden="true">·</span>
                        <span className="truncate">
                          {item.engineUsed === 'flux-kontext'
                            ? 'Edición Directa'
                            : 'Vista Pollinations'}
                        </span>
                      </div>
                      <p className="mt-1.5 line-clamp-2 text-sm font-medium text-[#1C1917]">
                        {item.prompt}
                      </p>
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-stone-100 pt-3">
                      <button
                        type="button"
                        onClick={() => handleLoadHistoryItem(item)}
                        className="text-xs font-semibold text-[#9A6B32] hover:underline"
                      >
                        Abrir en visor
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          downloadDataUrl(item.resultDataUrl, `campanario-${item.id}.png`)
                        }
                        className="inline-flex items-center gap-1 text-xs font-medium text-stone-600 hover:text-[#1C1917]"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>Descargar</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="border-t border-stone-200/80 bg-[#F8F7F4] py-6">
        <div className="mx-auto flex max-w-[1320px] flex-col items-start justify-between gap-2 px-4 text-xs text-stone-500 sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <span>Muebles El Campanario · Estudio Visual de Carpintería, Tapicería y Forja</span>
          <span>Uso gratuito sin registro ni llaves de pago</span>
        </div>
      </footer>

      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCapture}
        onFallbackFilePick={() => cameraFileInputRef.current?.click()}
      />
    </div>
  );
}
