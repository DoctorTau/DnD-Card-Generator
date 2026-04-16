/**
 * PDF Export Utilities
 *
 * Why we swap <img> for <canvas> before html2canvas:
 *   html2canvas does NOT support the CSS `object-fit` property — it always
 *   stretches images to fill the element's bounding box.  Setting objectFit
 *   via JS doesn't help because html2canvas re-reads the computed style and
 *   ignores the property.
 *
 *   The only reliable fix is to replace each <img class="art"> with a
 *   <canvas> element that already has the correct cover/contain crop painted
 *   on it.  html2canvas reads <canvas> pixel data natively (no objectFit
 *   involved) and renders it at the element's CSS size × exportScale.
 *
 *   After html2canvas finishes the canvases are removed and the original
 *   <img> elements are restored — the DOM returns to its normal state.
 */

// ---------------------------------------------------------------------------
// Crop math
// ---------------------------------------------------------------------------

interface CropDimensions {
    drawW: number;
    drawH: number;
    offsetX: number;
    offsetY: number;
}

/**
 * Cover: scale image to fill target, centre it, clip overflow.
 * Replicates CSS `object-fit: cover; object-position: 50% 50%`.
 */
function coverDims(ir: number, tr: number, tw: number, th: number): CropDimensions {
    if (ir > tr) {
        const drawH = th;
        const drawW = drawH * ir;
        return { drawW, drawH, offsetX: (tw - drawW) / 2, offsetY: 0 };
    }
    const drawW = tw;
    const drawH = drawW / ir;
    return { drawW, drawH, offsetX: 0, offsetY: (th - drawH) / 2 };
}

/**
 * Contain: scale image to fit entirely inside target (letterbox).
 * Replicates CSS `object-fit: contain; object-position: 50% 50%`.
 */
function containDims(ir: number, tr: number, tw: number, th: number): CropDimensions {
    if (ir > tr) {
        const drawW = tw;
        const drawH = drawW / ir;
        return { drawW, drawH, offsetX: 0, offsetY: (th - drawH) / 2 };
    }
    const drawH = th;
    const drawW = drawH * ir;
    return { drawW, drawH, offsetX: (tw - drawW) / 2, offsetY: 0 };
}

function cropDims(
    imgW: number,
    imgH: number,
    tw: number,
    th: number,
    mode: 'cover' | 'contain'
): CropDimensions {
    const ir = imgW / imgH;
    const tr = tw / th;
    return mode === 'cover' ? coverDims(ir, tr, tw, th) : containDims(ir, tr, tw, th);
}

// ---------------------------------------------------------------------------
// Public crop helper — kept for any external consumers
// ---------------------------------------------------------------------------

/**
 * Crops `imgSrc` to `targetW × targetH` using cover or contain mode and
 * returns the result as a PNG data URL.
 */
export function cropImageToDataUrl(
    imgSrc: string,
    mode: 'cover' | 'contain',
    targetW: number,
    targetH: number
): Promise<string> {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = targetW;
                canvas.height = targetH;
                const ctx = canvas.getContext('2d');
                if (!ctx) { resolve(imgSrc); return; }
                const d = cropDims(img.naturalWidth, img.naturalHeight, targetW, targetH, mode);
                ctx.clearRect(0, 0, targetW, targetH);
                ctx.drawImage(img, d.offsetX, d.offsetY, d.drawW, d.drawH);
                resolve(canvas.toDataURL('image/png'));
            } catch {
                resolve(imgSrc);
            }
        };
        img.onerror = () => resolve(imgSrc);
        img.src = imgSrc;
    });
}

// kept for any external consumers that used the old blob-based export
export { cropImageToDataUrl as cropImageToBlobUrl };

// ---------------------------------------------------------------------------
// Canvas-swap approach: replace each img.art with a <canvas> before capture
// ---------------------------------------------------------------------------

interface SwapEntry {
    img: HTMLImageElement;
    canvas: HTMLCanvasElement;
}

/**
 * For every `img.art` element:
 *   1. Create an offscreen canvas ("tmp file") at the element's exact pixel
 *      dimensions (clientWidth/clientHeight × exportScale).
 *   2. Draw the cover/contain-cropped image directly onto that canvas.
 *   3. Insert the canvas in place of the img (same CSS position / size).
 *   4. Hide the img.
 *
 * html2canvas reads <canvas> pixel data natively, so the crop is rendered
 * exactly as drawn — no objectFit interpretation, no stretching.
 *
 * Returns a list of swaps so restoreImages() can undo everything.
 */
function prepareImages(
    images: HTMLImageElement[],
    exportScale: number,
    mode: 'cover' | 'contain'
): SwapEntry[] {
    const swaps: SwapEntry[] = [];

    for (const img of images) {
        if (!img.src || !img.naturalWidth) continue;

        const w = img.clientWidth;
        const h = img.clientHeight;
        if (!w || !h) continue;

        // ── "tmp file": canvas with the correctly cropped image ──────────
        const canvas = document.createElement('canvas');
        canvas.width  = Math.round(w * exportScale);
        canvas.height = Math.round(h * exportScale);

        const ctx = canvas.getContext('2d');
        if (ctx) {
            const d = cropDims(img.naturalWidth, img.naturalHeight, canvas.width, canvas.height, mode);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, d.offsetX, d.offsetY, d.drawW, d.drawH);
        }

        // Give the canvas the same CSS layout as the img it replaces.
        // Explicit px values are the safest choice: html2canvas won't have to
        // resolve percentage values or inherit anything.
        canvas.style.cssText = `
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            width: ${w}px;
            height: ${h}px;
            display: block;
        `;

        // Swap: insert canvas, hide img
        img.parentElement!.insertBefore(canvas, img);
        img.style.display = 'none';

        swaps.push({ img, canvas });
    }

    return swaps;
}

/**
 * Remove all temporary canvases and restore the original img elements.
 */
function restoreImages(swaps: SwapEntry[]): void {
    for (const { img, canvas } of swaps) {
        canvas.remove();
        img.style.removeProperty('display');
    }
}

// ---------------------------------------------------------------------------
// PDF assembly
// ---------------------------------------------------------------------------

export interface PdfExportOptions {
    fitMode: 'cover' | 'contain';
    printAreaSelector?: string;
    sheetSelector?: string;
    imageSelector?: string;
}

/**
 * Generates a PDF from card sheets in the DOM.
 *
 * Flow:
 *  1. Find all .a4 sheets and img.art images inside #print-area.
 *  2. For each img.art: create a correctly-cropped <canvas> ("tmp file") and
 *     swap it in, hiding the original img.
 *  3. Capture each sheet with html2canvas (canvases render pixel-perfectly).
 *  4. Remove the tmp canvases and restore the original imgs.
 */
export async function generatePdf(options: PdfExportOptions): Promise<void> {
    const {
        fitMode,
        printAreaSelector = '#print-area',
        sheetSelector = '.a4',
        imageSelector = 'img.art'
    } = options;

    const [{ jsPDF }, html2canvas] = await Promise.all([
        import('jspdf'),
        import('html2canvas')
    ]);

    // Minimum scale 2 → crisp output at ≥192 dpi.
    const exportScale = Math.max(2, window.devicePixelRatio || 1);

    document.documentElement.setAttribute('data-exporting', 'true');

    let swaps: SwapEntry[] = [];

    try {
        const sheets = Array.from(
            document.querySelectorAll<HTMLElement>(`${printAreaSelector} ${sheetSelector}`)
        );
        if (!sheets.length) { alert('No sheets to export.'); return; }

        const images = Array.from(
            document.querySelectorAll<HTMLImageElement>(`${printAreaSelector} ${imageSelector}`)
        );

        // Swap each img.art → cropped canvas (synchronous, no async needed)
        swaps = prepareImages(images, exportScale, fitMode);

        const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

        for (let i = 0; i < sheets.length; i++) {
            const canvas = await html2canvas.default(sheets[i], {
                scale: exportScale,
                useCORS: true,
                allowTaint: false,
                backgroundColor: '#ffffff',
                logging: false
            });

            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            if (i > 0) pdf.addPage();
            pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
        }

        pdf.save('dnd-cards.pdf');
    } finally {
        // ── "delete tmp files" ────────────────────────────────────────────
        restoreImages(swaps);
        document.documentElement.removeAttribute('data-exporting');
    }
}
