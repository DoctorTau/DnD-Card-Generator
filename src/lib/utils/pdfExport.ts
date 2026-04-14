/**
 * PDF Export Utilities
 * Handles cropping images and generating PDF documents from card sheets.
 *
 * Why we pre-crop:
 *   html2canvas does NOT support the CSS `object-fit` property.  It ignores
 *   it and stretches images to fill the element's bounding box.  To fix this
 *   we bake the cover/contain crop into a new image BEFORE html2canvas runs,
 *   then set that image as the src with objectFit='fill'.  Because the baked
 *   image already has the same aspect ratio as the card, html2canvas's naive
 *   fill produces a pixel-perfect result.
 *
 * Why data URLs instead of blob URLs:
 *   html2canvas maintains an internal image cache keyed by the src string.
 *   A blob URL is a new string every time, but html2canvas may re-fetch it
 *   using its own XHR which can race with the DOM update.  A data URL is
 *   self-contained in the attribute — html2canvas reads it synchronously and
 *   cannot use a stale cached copy of the original image.
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
 * Cover: scale the image so it fills the target, centre it, clip the overflow.
 *
 *   Wide image (imgRatio > targetRatio):
 *     Lock height to targetH → drawW = targetH × imgRatio (wider than target)
 *     offsetX = (targetW - drawW) / 2   ← negative → left edge starts outside canvas
 *     canvas.drawImage clips the overflow automatically.
 *
 *   Tall image (imgRatio ≤ targetRatio):
 *     Lock width to targetW → drawH = targetW / imgRatio (taller than target)
 *     offsetY = (targetH - drawH) / 2   ← negative → top edge starts outside canvas
 *
 * In both branches one of the offsets is negative.  That is intentional:
 * Canvas2D clips anything drawn outside its bounds, which is how the crop works.
 * The result is identical to CSS `object-fit: cover`.
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
 * Contain: scale the image so it fits entirely inside the target (letterbox).
 * All offsets are ≥ 0 — the image never overflows the canvas.
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
// Image cropping — returns a PNG data URL
// ---------------------------------------------------------------------------

/**
 * Loads `imgSrc`, draws it cropped to `targetW × targetH` using cover or
 * contain mode, and returns the result as a PNG data URL.
 *
 * Using a data URL (not a blob URL) guarantees html2canvas reads the value
 * directly from the src attribute and cannot use a cached copy of the
 * original image.
 *
 * Falls back to the original src on any error so the export still runs.
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
// DOM image preparation / restoration
// ---------------------------------------------------------------------------

interface ImageRestoreData {
    originalSrcs: Map<HTMLImageElement, string>;
    originalStyles: Map<HTMLImageElement, string | null>;
}

/**
 * For every `img.art` element:
 *   1. Save the current src and style attribute.
 *   2. Bake a cover/contain crop into a PNG data URL at export resolution.
 *   3. Replace the element's src with that data URL and set objectFit='fill'.
 *
 * After this every art image has the correct aspect ratio baked in, so
 * html2canvas's naive fill scaling produces no distortion.
 */
async function prepareImages(
    images: HTMLImageElement[],
    targetW: number,
    targetH: number,
    mode: 'cover' | 'contain'
): Promise<ImageRestoreData> {
    const originalSrcs = new Map<HTMLImageElement, string>();
    const originalStyles = new Map<HTMLImageElement, string | null>();

    for (const img of images) {
        // Skip elements that have no src or haven't decoded yet
        if (!img.src || !img.naturalWidth) continue;

        originalSrcs.set(img, img.src);
        originalStyles.set(img, img.getAttribute('style'));

        const dataUrl = await cropImageToDataUrl(img.src, mode, targetW, targetH);
        img.src = dataUrl;
        // Explicitly override objectFit so the browser does not apply any
        // additional scaling on top of the already-cropped image.
        img.style.objectFit = 'fill';
    }

    return { originalSrcs, originalStyles };
}

/**
 * Wait for every modified image to be fully decoded before html2canvas runs.
 * img.decode() resolves only when the image is ready to paint, which is the
 * earliest safe point to call html2canvas.
 */
async function waitForImages(images: HTMLImageElement[]): Promise<void> {
    await Promise.all(
        images.map((img) => img.decode().catch(() => { /* broken images are fine */ }))
    );
}

/**
 * Restore all elements exactly as they were before prepareImages().
 */
function restoreImages({ originalSrcs, originalStyles }: ImageRestoreData): void {
    for (const [img, src] of originalSrcs) img.src = src;
    for (const [img, style] of originalStyles) {
        if (style !== null) img.setAttribute('style', style);
        else img.removeAttribute('style');
    }
}

// ---------------------------------------------------------------------------
// PDF assembly
// ---------------------------------------------------------------------------

export interface PdfExportOptions {
    cardW: number;
    cardH: number;
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
 *  2. For each art image, bake a cover/contain crop (PNG data URL) at the
 *     exact pixel dimensions html2canvas will render the card at.
 *  3. Wait for all images to decode their new src.
 *  4. Capture each sheet with html2canvas → add to jsPDF.
 *  5. Restore original srcs and styles.
 */
export async function generatePdf(options: PdfExportOptions): Promise<void> {
    const {
        cardW,
        cardH,
        fitMode,
        printAreaSelector = '#print-area',
        sheetSelector = '.a4',
        imageSelector = 'img.art'
    } = options;

    const [{ jsPDF }, html2canvas] = await Promise.all([
        import('jspdf'),
        import('html2canvas')
    ]);

    // Minimum scale 2 to ensure the PDF is crisp on print (≥192 dpi).
    const exportScale = Math.max(2, window.devicePixelRatio || 1);

    // At 96 dpi, 1 mm = 96/25.4 ≈ 3.7795 CSS px.
    // Multiplied by exportScale gives the canvas pixels html2canvas uses per mm.
    const mmToPx = (96 / 25.4) * exportScale;
    const targetW = Math.round(cardW * mmToPx);
    const targetH = Math.round(cardH * mmToPx);

    document.documentElement.setAttribute('data-exporting', 'true');

    let restoreData: ImageRestoreData = { originalSrcs: new Map(), originalStyles: new Map() };

    try {
        const sheets = Array.from(
            document.querySelectorAll<HTMLElement>(`${printAreaSelector} ${sheetSelector}`)
        );
        if (!sheets.length) { alert('No sheets to export.'); return; }

        const images = Array.from(
            document.querySelectorAll<HTMLImageElement>(`${printAreaSelector} ${imageSelector}`)
        );

        restoreData = await prepareImages(images, targetW, targetH, fitMode);

        // Decode must complete before html2canvas reads the DOM.
        await waitForImages(images);

        const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

        for (let i = 0; i < sheets.length; i++) {
            const canvas = await html2canvas.default(sheets[i], {
                scale: exportScale,
                useCORS: true,
                allowTaint: false,
                backgroundColor: '#ffffff',
                logging: false
            });

            // JPEG at 0.95 is the only lossy step in the whole pipeline.
            // Everything before this (canvas crop → PNG data URL) is lossless.
            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            if (i > 0) pdf.addPage();
            pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
        }

        pdf.save('dnd-cards.pdf');
    } finally {
        restoreImages(restoreData);
        document.documentElement.removeAttribute('data-exporting');
    }
}
