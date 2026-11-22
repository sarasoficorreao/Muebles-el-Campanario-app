import type { WorkshopSpec } from '../types';

export function downloadDataUrl(dataUrl: string, filename: string): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('No se pudo renderizar la ficha de taller.'));
    img.src = src;
  });
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = 3
): number {
  const words = text.split(/\s+/);
  let line = '';
  let currentY = y;
  let linesCount = 0;

  for (let i = 0; i < words.length; i++) {
    const testLine = line ? `${line} ${words[i]}` : words[i];
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && line) {
      ctx.fillText(line, x, currentY);
      line = words[i];
      currentY += lineHeight;
      linesCount++;
      if (linesCount >= maxLines - 1) {
        const remaining = [line, ...words.slice(i + 1)].join(' ');
        const truncated =
          remaining.length > 68 ? `${remaining.slice(0, 65)}...` : remaining;
        ctx.fillText(truncated, x, currentY);
        return currentY + lineHeight;
      }
    } else {
      line = testLine;
    }
  }
  if (line) {
    ctx.fillText(line, x, currentY);
    currentY += lineHeight;
  }
  return currentY;
}

function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  dx: number,
  dy: number,
  dw: number,
  dh: number
) {
  const imgRatio = img.width / img.height;
  const boxRatio = dw / dh;
  let sx = 0;
  let sy = 0;
  let sw = img.width;
  let sh = img.height;

  if (imgRatio > boxRatio) {
    sw = img.height * boxRatio;
    sx = (img.width - sw) / 2;
  } else {
    sh = img.width / boxRatio;
    sy = (img.height - sh) / 2;
  }

  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
}

export async function buildWorkshopSheetDataUrl(params: {
  originalDataUrl: string;
  resultDataUrl: string;
  prompt: string;
  spec: WorkshopSpec;
}): Promise<string> {
  const [origImg, resImg] = await Promise.all([
    loadImage(params.originalDataUrl),
    loadImage(params.resultDataUrl),
  ]);

  const width = 1600;
  const height = 1080;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo generar la ficha.');

  // Warm alabaster background
  ctx.fillStyle = '#F8F7F4';
  ctx.fillRect(0, 0, width, height);

  // Header strip
  ctx.fillStyle = '#1C1917';
  ctx.font = '600 34px Georgia, serif';
  ctx.fillText('Muebles El Campanario', 64, 72);

  ctx.fillStyle = '#78716C';
  ctx.font = '500 18px system-ui, sans-serif';
  const dateStr = new Date().toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  ctx.fillText(`Ficha de Personalización para Taller · ${dateStr}`, 64, 104);

  // Hairline divider
  ctx.strokeStyle = 'rgba(28, 25, 23, 0.14)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(64, 128);
  ctx.lineTo(width - 64, 128);
  ctx.stroke();

  // Image frames: Antes (Left) & Propuesta (Right)
  const cardW = 708;
  const cardH = 520;
  const leftX = 64;
  const rightX = 828;
  const imgY = 168;

  ctx.fillStyle = '#57534E';
  ctx.font = '600 16px system-ui, sans-serif';
  ctx.fillText('PIEZA ORIGINAL', leftX, 154);
  ctx.fillStyle = '#9A6B32';
  ctx.fillText('PROPUESTA DE DISEÑO', rightX, 154);

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(leftX, imgY, cardW, cardH);
  ctx.fillRect(rightX, imgY, cardW, cardH);

  drawCoverImage(ctx, origImg, leftX, imgY, cardW, cardH);
  drawCoverImage(ctx, resImg, rightX, imgY, cardW, cardH);

  ctx.strokeStyle = 'rgba(28, 25, 23, 0.15)';
  ctx.strokeRect(leftX, imgY, cardW, cardH);
  ctx.strokeRect(rightX, imgY, cardW, cardH);

  // Spec panel
  const specY = 724;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(64, specY, width - 128, 296);
  ctx.strokeStyle = 'rgba(28, 25, 23, 0.12)';
  ctx.strokeRect(64, specY, width - 128, 296);

  ctx.fillStyle = '#78716C';
  ctx.font = '600 14px system-ui, sans-serif';
  ctx.fillText('SOLICITUD DEL CLIENTE', 96, specY + 38);

  ctx.fillStyle = '#1C1917';
  ctx.font = '500 20px system-ui, sans-serif';
  wrapText(ctx, params.prompt || 'Personalización de taller', 96, specY + 70, width - 192, 28, 2);

  // 4-column spec breakdown
  const colY = specY + 148;
  const cols = [
    { label: 'MADERA Y ACABADO', value: params.spec.madera },
    { label: 'TAPIZADO', value: params.spec.tapizado },
    { label: 'FORJA / ESPALDAR', value: params.spec.forja },
    { label: 'CALIBRES Y TALLER', value: `${params.spec.calibreSugerido}. ${params.spec.notasTaller}` },
  ];

  const colW = (width - 192 - 72) / 4;
  cols.forEach((col, idx) => {
    const cx = 96 + idx * (colW + 24);
    ctx.fillStyle = '#9A6B32';
    ctx.font = '600 13px system-ui, sans-serif';
    ctx.fillText(col.label, cx, colY);

    ctx.fillStyle = '#1C1917';
    ctx.font = '400 16px system-ui, sans-serif';
    wrapText(ctx, col.value, cx, colY + 26, colW, 22, 4);
  });

  return canvas.toDataURL('image/png');
}

export async function shareDesignImage(params: {
  dataUrl: string;
  prompt: string;
}): Promise<'shared' | 'whatsapp-copied' | 'downloaded'> {
  const response = await fetch(params.dataUrl);
  const blob = await response.blob();
  const ext = blob.type.includes('png') ? 'png' : 'jpg';
  const file = new File([blob], `muebles-el-campanario.${ext}`, {
    type: blob.type || 'image/png',
  });

  const shareText = `Propuesta de Muebles El Campanario: ${params.prompt}`;

  if (
    typeof navigator !== 'undefined' &&
    typeof navigator.share === 'function' &&
    typeof navigator.canShare === 'function' &&
    navigator.canShare({ files: [file] })
  ) {
    await navigator.share({
      title: 'Muebles El Campanario — Propuesta Visual',
      text: shareText,
      files: [file],
    });
    return 'shared';
  }

  // Fallback on desktop: download the image and copy description to clipboard
  downloadDataUrl(params.dataUrl, `muebles-el-campanario.${ext}`);
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(shareText);
      return 'whatsapp-copied';
    } catch {
      return 'downloaded';
    }
  }
  return 'downloaded';
}
