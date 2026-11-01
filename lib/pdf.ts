'use client';

// Turns uploaded drawing files (PDF or images) into page images, and prepares
// the images Claude reads for each sheet: the whole sheet plus four quadrants,
// since a full 24x36 sheet shrunk to one image loses the small print.

export interface RenderedPage {
  fileName: string;
  page: number;
  image: Blob; // stored copy for viewing (JPEG, ~2400px long side)
  text: string; // PDF text layer, when the file has one
}

const VIEW_PX = 2400;
const AI_PX = 1568;

async function pdfjs() {
  const lib = await import('pdfjs-dist');
  if (!lib.GlobalWorkerOptions.workerSrc) {
    lib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
  }
  return lib;
}

function canvasToBlob(c: HTMLCanvasElement, quality = 0.82): Promise<Blob> {
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('Could not encode image'))), 'image/jpeg', quality));
}

function scaleCanvas(src: CanvasImageSource, sw: number, sh: number, sx: number, sy: number, sWidth: number, sHeight: number, maxPx: number) {
  const k = Math.min(1, maxPx / Math.max(sWidth, sHeight));
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(sWidth * k));
  c.height = Math.max(1, Math.round(sHeight * k));
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.drawImage(src, sx, sy, sWidth, sHeight, 0, 0, c.width, c.height);
  void sw; void sh;
  return c;
}

export async function renderFile(file: File, onPage?: (done: number, total: number) => void): Promise<RenderedPage[]> {
  const out: RenderedPage[] = [];
  if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
    const lib = await pdfjs();
    const doc = await lib.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
    for (let n = 1; n <= doc.numPages; n++) {
      const page = await doc.getPage(n);
      const base = page.getViewport({ scale: 1 });
      const scale = VIEW_PX / Math.max(base.width, base.height);
      const vp = page.getViewport({ scale });
      const c = document.createElement('canvas');
      c.width = Math.round(vp.width);
      c.height = Math.round(vp.height);
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, c.width, c.height);
      await page.render({ canvasContext: ctx, viewport: vp }).promise;
      let text = '';
      try {
        const tc = await page.getTextContent();
        text = tc.items.map((it) => ('str' in it ? it.str : '')).filter(Boolean).join(' ').replace(/\s+/g, ' ').slice(0, 8000);
      } catch { /* scanned sheet: no text layer */ }
      out.push({ fileName: file.name, page: n, image: await canvasToBlob(c), text });
      onPage?.(n, doc.numPages);
      page.cleanup();
    }
    await doc.destroy();
    return out;
  }
  const bmp = await createImageBitmap(file);
  const c = scaleCanvas(bmp, bmp.width, bmp.height, 0, 0, bmp.width, bmp.height, VIEW_PX);
  out.push({ fileName: file.name, page: 1, image: await canvasToBlob(c), text: '' });
  onPage?.(1, 1);
  return out;
}

/** Whole sheet + four overlapping quadrants, as base64 JPEG strings (no data: prefix). */
export async function analysisImages(src: Blob | string): Promise<string[]> {
  const img = await loadImage(src);
  const W = img.naturalWidth, H = img.naturalHeight;
  const crops: Array<[number, number, number, number]> = [[0, 0, W, H]];
  const ow = Math.round(W * 0.55), oh = Math.round(H * 0.55);
  for (const [x, y] of [[0, 0], [W - ow, 0], [0, H - oh], [W - ow, H - oh]]) crops.push([x, y, ow, oh]);
  const out: string[] = [];
  for (const [x, y, w, h] of crops) {
    const c = scaleCanvas(img, W, H, x, y, w, h, AI_PX);
    out.push(c.toDataURL('image/jpeg', 0.78).split(',')[1]);
  }
  return out;
}

function loadImage(src: Blob | string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const url = typeof src === 'string' ? src : URL.createObjectURL(src);
    img.onload = () => res(img);
    img.onerror = () => rej(new Error('Could not load the sheet image'));
    img.src = url;
  });
}
