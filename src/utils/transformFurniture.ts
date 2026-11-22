import type { TransformResponse, WorkshopSpec } from '../types';

const HF_KONTEXT_BASE = 'https://black-forest-labs-flux-1-kontext-dev.hf.space';
const POLLINATIONS_TEXT_URL = 'https://text.pollinations.ai/openai';
const POLLINATIONS_IMAGE_BASE = 'https://image.pollinations.ai/prompt';

interface TransformRequestParams {
  imageDataUrl: string;
  prompt: string;
  woodOption?: string;
  upholsteryOption?: string;
  forjaOption?: string;
  width: number;
  height: number;
}

interface PromptPlan {
  editPromptEn: string;
  fallbackScenePromptEn: string;
  workshopSpec: WorkshopSpec;
}

function clampDim(value: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  const rounded = Math.round(value / 16) * 16;
  return Math.max(512, Math.min(1024, rounded));
}

function buildDeterministicPlan(
  userPrompt: string,
  woodOption?: string,
  upholsteryOption?: string,
  forjaOption?: string
): PromptPlan {
  const combined = [userPrompt, woodOption, upholsteryOption, forjaOption]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const clauses = [
    'Keep the exact furniture silhouette, camera perspective, floor, wall, and ambient lighting unchanged.',
  ];
  const sceneClauses = [
    'Realistic workshop studio photograph of a handcrafted wooden furniture piece against a plain neutral plaster wall in soft natural daylight.',
  ];

  let maderaSpec = woodOption || 'Según diseño original de la pieza';
  if (combined.includes('nogal')) {
    clauses.push('Change all wooden frame parts, legs, and rails to rich dark walnut wood stain with visible natural grain.');
    sceneClauses.push('Dark walnut stained wood frame with satin grain.');
    maderaSpec = 'Nogal oscuro satinado (poro abierto)';
  } else if (combined.includes('roble') || combined.includes('miel')) {
    clauses.push('Change all wooden frame parts, legs, and rails to warm honey oak wood finish with natural grain.');
    sceneClauses.push('Warm honey oak wood frame.');
    maderaSpec = 'Roble miel natural con sellador mate';
  } else if (combined.includes('cedro')) {
    clauses.push('Change all wooden frame parts to warm reddish-brown colonial cedar wood.');
    sceneClauses.push('Rich reddish colonial cedar wood frame.');
    maderaSpec = 'Cedro rojo colonial con laca semimate';
  } else if (combined.includes('ébano') || combined.includes('ebano') || combined.includes('madera negra')) {
    clauses.push('Finish all wooden frame parts in matte ebony black wood stain preserving subtle wood grain.');
    sceneClauses.push('Matte ebony black stained wood frame.');
    maderaSpec = 'Ébano negro mate poro abierto';
  } else if (combined.includes('ceniza')) {
    clauses.push('Change all wooden frame parts to light ash gray washed oak wood.');
    sceneClauses.push('Light ash gray oak wood frame.');
    maderaSpec = 'Roble ceniza lavado claro';
  } else if (combined.includes('blanco') || combined.includes('decap') || combined.includes('hueso')) {
    clauses.push('Paint all wooden frame parts in artisanal distressed off-white chalk finish.');
    sceneClauses.push('Distressed warm off-white painted wood frame.');
    maderaSpec = 'Blanco hueso decapé artesanal';
  } else if (woodOption) {
    clauses.push(`Refinish the wooden frame in ${woodOption} showing natural wood grain.`);
    sceneClauses.push(`Wooden frame finished in ${woodOption}.`);
  }

  let tapizadoSpec = upholsteryOption || 'Según tapizado original';
  if (combined.includes('lino')) {
    clauses.push('Reupholster the cushion and padded surfaces in natural raw oatmeal linen fabric preserving realistic seams and folds.');
    sceneClauses.push('Upholstered seat cushion in natural oatmeal woven linen.');
    tapizadoSpec = 'Lino crudo natural de trama tapicera';
  } else if (combined.includes('esmeralda') || combined.includes('verde')) {
    clauses.push('Reupholster the cushion and padded surfaces in deep emerald green velvet fabric.');
    sceneClauses.push('Deep emerald green velvet upholstery.');
    tapizadoSpec = 'Terciopelo verde esmeralda';
  } else if (combined.includes('coñac') || combined.includes('cognac') || combined.includes('cuero')) {
    clauses.push('Reupholster the cushion and padded surfaces in warm cognac distressed genuine leather.');
    sceneClauses.push('Warm cognac leather upholstered cushion.');
    tapizadoSpec = 'Cuero natural tono coñac envejecido';
  } else if (combined.includes('marengo') || combined.includes('gris')) {
    clauses.push('Reupholster the cushion in durable charcoal gray woven upholstery canvas.');
    sceneClauses.push('Charcoal gray woven canvas seat cushion.');
    tapizadoSpec = 'Lona tapicera gris marengo';
  } else if (combined.includes('terracota')) {
    clauses.push('Reupholster the cushion in warm terracotta chenille fabric.');
    sceneClauses.push('Warm terracotta chenille seat cushion.');
    tapizadoSpec = 'Chenilla terracota cálida';
  } else if (combined.includes('ocre') || combined.includes('mostaza')) {
    clauses.push('Reupholster the cushion in muted antique mustard ochre velvet.');
    sceneClauses.push('Muted antique ochre velvet seat cushion.');
    tapizadoSpec = 'Terciopelo ocre antiguo';
  } else if (upholsteryOption) {
    clauses.push(`Reupholster the padded areas in ${upholsteryOption}.`);
  }

  let forjaSpec = forjaOption || 'Sin modificación de forja';
  let calibreSugerido = 'N/A (estructura en madera maciza)';
  let notasTaller = 'Respetar uniones originales, lijado fino grano 220 antes de aplicar sellador.';

  const wantsForja =
    combined.includes('forja') ||
    combined.includes('hierro') ||
    combined.includes('herrer') ||
    combined.includes('espaldar') ||
    Boolean(forjaOption);

  if (wantsForja) {
    if (
      combined.includes('planta') ||
      combined.includes('hoja') ||
      combined.includes('botán') ||
      combined.includes('botan') ||
      combined.includes('flor') ||
      combined.includes('rama')
    ) {
      clauses.push(
        'Replace only the wooden backrest slats with a realistic, simple hand-forged matte black wrought-iron panel featuring clean curved stems and forged metal leaves welded cleanly to the outer frame so a real blacksmith can build it.'
      );
      sceneClauses.push(
        'Backrest crafted in realistic matte black hand-forged wrought iron with simple welded botanical stems and metal leaves.'
      );
      forjaSpec =
        'Espaldar en hierro forjado negro mate con diseño botánico sencillo de tallos y hojas orgánicas';
      calibreSugerido =
        'Marco en platina 3/4" x 3/16", tallos en varilla cuadrada 3/8" o redonda 10mm, hojas forjadas en lámina calibre 14';
      notasTaller =
        'Curvar tallos en frío o fragua suave manteniendo simetría abierta; soldadura pulida y pintura electrostática negro forja mate.';
    } else if (combined.includes('voluta') || combined.includes('colonial') || combined.includes('rulo')) {
      clauses.push(
        'Replace only the wooden backrest slats with realistic matte black wrought-iron C-scrolls and vertical forged bars with clean riveted joints.'
      );
      sceneClauses.push(
        'Backrest in traditional matte black wrought iron with simple forged C-scrolls and vertical bars.'
      );
      forjaSpec = 'Espaldar en forja colonial con volutas en C/S y barrotes verticales';
      calibreSugerido = 'Platina 1/2" x 3/16" para volutas y varilla cuadrada 1/2" para parales';
      notasTaller = 'Terminales batidos en punta de cola de pescado, uniones con abrazadera o soldadura limpia.';
    } else {
      clauses.push(
        'Replace only the wooden backrest slats with a realistic, simple hand-forged matte black wrought-iron grille with clean vertical bars and a forged central motif.'
      );
      sceneClauses.push('Backrest in realistic matte black hand-forged wrought iron with clean buildable geometry.');
      forjaSpec = 'Espaldar en hierro forjado negro mate de líneas artesanales';
      calibreSugerido = 'Varilla cuadrada 1/2" y platina perimetral 3/4" x 3/16"';
      notasTaller = 'Ensamble rígido atornillado o espigado hacia los parales de madera con buje oculto.';
    }
  } else if (userPrompt.trim().length > 0) {
    clauses.push(`Apply this furniture customization faithfully and realistically: ${userPrompt.trim()}.`);
    sceneClauses.push(`Customized furniture detail: ${userPrompt.trim()}.`);
  }

  return {
    editPromptEn: clauses.join(' '),
    fallbackScenePromptEn: sceneClauses.join(' '),
    workshopSpec: {
      madera: maderaSpec,
      tapizado: tapizadoSpec,
      forja: forjaSpec,
      calibreSugerido,
      notasTaller,
    },
  };
}

async function planDirectBrowser(
  prompt: string,
  woodOption?: string,
  upholsteryOption?: string,
  forjaOption?: string
): Promise<PromptPlan> {
  const fallback = buildDeterministicPlan(prompt, woodOption, upholsteryOption, forjaOption);
  const combinedInput = [
    prompt ? `Pedido del cliente: "${prompt}"` : '',
    woodOption ? `Madera seleccionada: ${woodOption}` : '',
    upholsteryOption ? `Tapizado seleccionado: ${upholsteryOption}` : '',
    forjaOption ? `Diseño de forja seleccionado: ${forjaOption}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  if (!combinedInput.trim()) return fallback;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 9000);
    const res = await fetch(POLLINATIONS_TEXT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model: 'openai',
        messages: [
          {
            role: 'system',
            content:
              'You translate Spanish furniture customization requests into concise English image-editing instructions for FLUX.1-Kontext. Return strict JSON without markdown with keys: "editPromptEn" (max 60 words), "fallbackScenePromptEn" (max 45 words), and "workshopSpec" (keys: madera, tapizado, forja, calibreSugerido, notasTaller in simple Spanish).',
          },
          { role: 'user', content: combinedInput },
        ],
      }),
    });
    clearTimeout(timer);
    if (!res.ok) return fallback;

    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const raw = json?.choices?.[0]?.message?.content?.trim();
    if (!raw) return fallback;

    const cleaned = raw
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```$/i, '')
      .trim();
    const parsed = JSON.parse(cleaned) as Partial<PromptPlan>;
    if (!parsed.editPromptEn) return fallback;

    return {
      editPromptEn: parsed.editPromptEn,
      fallbackScenePromptEn: parsed.fallbackScenePromptEn || fallback.fallbackScenePromptEn,
      workshopSpec: {
        madera: woodOption ? fallback.workshopSpec.madera : parsed.workshopSpec?.madera || fallback.workshopSpec.madera,
        tapizado: upholsteryOption ? fallback.workshopSpec.tapizado : parsed.workshopSpec?.tapizado || fallback.workshopSpec.tapizado,
        forja: forjaOption ? fallback.workshopSpec.forja : parsed.workshopSpec?.forja || fallback.workshopSpec.forja,
        calibreSugerido: forjaOption ? fallback.workshopSpec.calibreSugerido : parsed.workshopSpec?.calibreSugerido || fallback.workshopSpec.calibreSugerido,
        notasTaller: parsed.workshopSpec?.notasTaller || fallback.workshopSpec.notasTaller,
      },
    };
  } catch {
    return fallback;
  }
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('No se pudo leer la imagen resultante.'));
    };
    reader.onerror = () => reject(new Error('Error convirtiendo la imagen.'));
    reader.readAsDataURL(blob);
  });
}

async function runFluxKontextDirect(
  imageDataUrl: string,
  editPromptEn: string,
  seed: number
): Promise<string> {
  const imageBlob = await (await fetch(imageDataUrl)).blob();
  const form = new FormData();
  form.append('files', imageBlob, 'furniture.jpg');

  const uploadRes = await fetch(`${HF_KONTEXT_BASE}/gradio_api/upload`, {
    method: 'POST',
    body: form,
  });
  if (!uploadRes.ok) throw new Error(`Upload failed (${uploadRes.status})`);

  const uploadedPaths = (await uploadRes.json()) as string[];
  const uploadedPath = uploadedPaths?.[0];
  if (!uploadedPath) throw new Error('Sin ruta de subida');

  const callRes = await fetch(`${HF_KONTEXT_BASE}/gradio_api/call/infer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      data: [
        { path: uploadedPath, meta: { _type: 'gradio.FileData' } },
        editPromptEn,
        seed,
        false,
        2.5,
        20,
      ],
    }),
  });
  if (!callRes.ok) throw new Error(`Cola ocupada (${callRes.status})`);

  const { event_id } = (await callRes.json()) as { event_id?: string };
  if (!event_id) throw new Error('Sin event_id');

  const streamRes = await fetch(`${HF_KONTEXT_BASE}/gradio_api/call/infer/${event_id}`);
  if (!streamRes.ok) throw new Error(`Error SSE (${streamRes.status})`);

  const sseText = await streamRes.text();
  let lastEvent = '';
  let resultUrl = '';

  for (const line of sseText.split('\n')) {
    if (line.startsWith('event:')) {
      lastEvent = line.slice(6).trim();
    } else if (line.startsWith('data:')) {
      const payloadStr = line.slice(5).trim();
      if (lastEvent === 'error') {
        throw new Error(`FLUX Kontext ocupado: ${payloadStr}`);
      }
      if (lastEvent === 'complete') {
        const parsed = JSON.parse(payloadStr) as Array<{ url?: string; path?: string } | number>;
        const first = parsed?.[0];
        if (first && typeof first === 'object') {
          if (first.url) resultUrl = first.url;
          else if (first.path) resultUrl = `${HF_KONTEXT_BASE}/gradio_api/file=${first.path}`;
        }
      }
    }
  }

  if (!resultUrl) throw new Error('Sin imagen generada');
  const imgBlob = await (await fetch(resultUrl)).blob();
  return blobToDataUrl(imgBlob);
}

async function runPollinationsDirect(
  fallbackScenePromptEn: string,
  width: number,
  height: number,
  seed: number
): Promise<string> {
  const url = `${POLLINATIONS_IMAGE_BASE}/${encodeURIComponent(
    fallbackScenePromptEn
  )}?width=${width}&height=${height}&seed=${seed}&nologo=true`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Pollinations error (${res.status})`);
  const blob = await res.blob();
  if (!blob.type.startsWith('image/')) {
    throw new Error('Pollinations no devolvió una imagen válida');
  }
  return blobToDataUrl(blob);
}

export async function transformFurniture(
  params: TransformRequestParams
): Promise<TransformResponse> {
  // 1. Try local Express backend first (when running full-stack server.ts)
  let apiErrorMessage: string | null = null;
  try {
    const response = await fetch('/api/transform', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = (await response.json()) as TransformResponse & { error?: string };
      if (!response.ok || !data.resultDataUrl) {
        apiErrorMessage =
          data.error || 'No se pudo generar el diseño en este momento. Intenta de nuevo.';
      } else {
        return data;
      }
    }
    // If server returned 404 HTML (static hosting such as GitHub Pages), fall through to direct browser mode
  } catch {
    // Fall through to direct browser mode if backend route isn't present
  }

  if (apiErrorMessage) {
    throw new Error(apiErrorMessage);
  }

  // 2. Direct browser mode (for GitHub Pages / static hosting without Node backend)
  const seed = Math.floor(Math.random() * 1_000_000);
  const plan = await planDirectBrowser(
    params.prompt,
    params.woodOption,
    params.upholsteryOption,
    params.forjaOption
  );

  try {
    const resultDataUrl = await runFluxKontextDirect(
      params.imageDataUrl,
      plan.editPromptEn,
      seed
    );
    return {
      resultDataUrl,
      translatedPromptEn: plan.editPromptEn,
      engineUsed: 'flux-kontext',
      engineLabel: 'Edición directa sobre foto (FLUX.1 Kontext gratuito)',
      workshopSpec: plan.workshopSpec,
      seed,
    };
  } catch (kontextErr) {
    const fallbackReason =
      kontextErr instanceof Error ? kontextErr.message : 'Cola gratuita ocupada';
    const resultDataUrl = await runPollinationsDirect(
      plan.fallbackScenePromptEn,
      clampDim(params.width, 896),
      clampDim(params.height, 672),
      seed
    );
    return {
      resultDataUrl,
      translatedPromptEn: plan.editPromptEn,
      engineUsed: 'pollinations',
      engineLabel: 'Vista conceptual gratuita (Pollinations.ai)',
      fallbackReason,
      workshopSpec: plan.workshopSpec,
      seed,
    };
  }
}
