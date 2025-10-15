export function hexToRgb(hex: string): [number, number, number] {
  const s = hex.replace('#','');
  const n = parseInt(s.length === 3 ? s.split('').map(c=>c+c).join('') : s, 16);
  return [(n>>16)&255, (n>>8)&255, n&255];
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const im = new Image();
    im.crossOrigin = 'anonymous';
    im.onload = () => resolve(im);
    im.onerror = reject;
    im.src = src;
  });
}

export async function chromaKey(dataUrl: string, hex: string, tol: number): Promise<string> {
  const img = await loadImage(dataUrl);
  const canvas = document.createElement('canvas');
  canvas.width = img.width; canvas.height = img.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const [tr, tg, tb] = hexToRgb(hex);
  const t2 = tol * tol;
  for (let i = 0; i < imgData.data.length; i += 4) {
    const r = imgData.data[i], g = imgData.data[i+1], b = imgData.data[i+2];
    const dr = r - tr, dg = g - tg, db = b - tb;
    const dist2 = dr*dr + dg*dg + db*db;
    if (dist2 <= t2) imgData.data[i+3] = 0;
  }
  ctx.putImageData(imgData, 0, 0);
  return canvas.toDataURL('image/png');
}

export async function removeBgByApi(dataUrl: string, apiKey: string): Promise<string> {
  const res = await fetch('https://api.remove.bg/v1.0/removebg', {
    method: 'POST',
    headers: { 'X-Api-Key': apiKey },
    body: toFormData({ 'image_file_b64': dataUrl.split(',')[1], 'size': 'auto' }) as BodyInit
  });
  if (!res.ok) throw new Error(await res.text());
  const blob = await res.blob();
  return await blobToDataUrl(blob);
}

function toFormData(obj: Record<string, string>) {
  const fd = new FormData();
  for (const k in obj) fd.append(k, obj[k]);
  return fd;
}
function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.readAsDataURL(blob);
  });
}