export interface ResizedImageResult {
  dataUrl: string;
  width: number;
  height: number;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('No se pudo cargar la fotografía seleccionada.'));
    img.src = src;
  });
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('No se pudo leer el archivo de imagen.'));
      }
    };
    reader.onerror = () => reject(new Error('Error leyendo el archivo seleccionado.'));
    reader.readAsDataURL(file);
  });
}

export async function resizeImageInput(
  input: File | string,
  maxDim = 960
): Promise<ResizedImageResult> {
  const src = typeof input === 'string' ? input : await readFileAsDataUrl(input);
  const img = await loadImage(src);

  const naturalWidth = img.naturalWidth || 960;
  const naturalHeight = img.naturalHeight || 720;

  let targetWidth = naturalWidth;
  let targetHeight = naturalHeight;

  if (naturalWidth > maxDim || naturalHeight > maxDim) {
    if (naturalWidth >= naturalHeight) {
      targetWidth = maxDim;
      targetHeight = Math.round((naturalHeight / naturalWidth) * maxDim);
    } else {
      targetHeight = maxDim;
      targetWidth = Math.round((naturalWidth / naturalHeight) * maxDim);
    }
  }

  // Round to multiples of 16 for clean AI image model alignment
  targetWidth = Math.max(256, Math.round(targetWidth / 16) * 16);
  targetHeight = Math.max(256, Math.round(targetHeight / 16) * 16);

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('No fue posible procesar la imagen en el navegador.');
  }

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, targetWidth, targetHeight);
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
  return {
    dataUrl,
    width: targetWidth,
    height: targetHeight,
  };
}
