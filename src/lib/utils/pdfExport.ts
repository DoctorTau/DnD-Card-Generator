/**
 * PDF Export Utilities
 * Handles cropping images and generating PDF documents from card sheets
 */

interface CropDimensions {
    drawW: number;
    drawH: number;
    offsetX: number;
    offsetY: number;
}

/**
 * Calculates dimensions for cover fit mode (fills entire area, crops overflow).
 *
 * Cover logic:
 *   - Wide image (imgRatio > targetRatio): scale to fill height, center horizontally.
 *     The image overflows left/right; canvas clipping removes the excess.
 *   - Tall image (imgRatio <= targetRatio): scale to fill width, center vertically.
 *     The image overflows top/bottom; canvas clipping removes the excess.
 *
 * In both cases offsetX or offsetY is negative, which is intentional:
 * drawImage() with a negative offset starts drawing outside the canvas boundary,
 * and the canvas clips the part that falls outside. This is equivalent to CSS
 * object-fit: cover.
 */
function calculateCoverDimensions(
    imgRatio: number,
    targetRatio: number,
    targetW: number,
    targetH: number
): CropDimensions {
    if (imgRatio > targetRatio) {
        // Wide image: lock height, let width overflow, center horizontally
        const drawH = targetH;
        const drawW = drawH * imgRatio;
        return { drawW, drawH, offsetX: (targetW - drawW) / 2, offsetY: 0 };
    } else {
        // Tall image: lock width, let height overflow, center vertically
        const drawW = targetW;
        const drawH = drawW / imgRatio;
        return { drawW, drawH, offsetX: 0, offsetY: (targetH - drawH) / 2 };
    }
}

/**
 * Calculates dimensions for contain fit mode (fits entirely inside, letterboxes).
 *
 * Contain logic — inverse of cover:
 *   - Wide image (imgRatio > targetRatio): scale to fill width, pillarbox vertically.
 *   - Tall image (imgRatio <= targetRatio): scale to fill height, letterbox horizontally.
 *
 * offsetX / offsetY are always >= 0 for contain (image stays inside canvas).
 */
function calculateContainDimensions(
    imgRatio: number,
    targetRatio: number,
    targetW: number,
    targetH: number
): CropDimensions {
    if (imgRatio > targetRatio) {
        const drawW = targetW;
        const drawH = drawW / imgRatio;
        return { drawW, drawH, offsetX: 0, offsetY: (targetH - drawH) / 2 };
    } else {
        const drawH = targetH;
        const drawW = drawH * imgRatio;
        return { drawW, drawH, offsetX: (targetW - drawW) / 2, offsetY: 0 };
    }
}

/**
 * Calculates crop dimensions based on fit mode
 */
function calculateCropDimensions(
    imgWidth: number,
    imgHeight: number,
    targetW: number,
    targetH: number,
    fitMode: 'cover' | 'contain'
): CropDimensions {
    const imgRatio = imgWidth / imgHeight;
    const targetRatio = targetW / targetH;

    return fitMode === 'cover'
        ? calculateCoverDimensions(imgRatio, targetRatio, targetW, targetH)
        : calculateContainDimensions(imgRatio, targetRatio, targetW, targetH);
}

/**
 * Draws an image onto a canvas with the specified crop dimensions.
 * Uses clearRect instead of fillRect so the canvas is truly transparent
 * before drawing — important for PNG output with potential transparency.
 */
function drawImageToCanvas(
    canvas: HTMLCanvasElement,
    img: HTMLImageElement,
    dimensions: CropDimensions
): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, dimensions.offsetX, dimensions.offsetY, dimensions.drawW, dimensions.drawH);
}

/**
 * Converts a canvas to a Blob URL (PNG, lossless).
 * Explicit type prevents implementation-dependent behavior.
 */
async function canvasToBlobUrl(canvas: HTMLCanvasElement): Promise<string | null> {
    const blob: Blob | null = await new Promise((res) => canvas.toBlob(res, 'image/png'));
    if (!blob) return null;
    return URL.createObjectURL(blob);
}

/**
 * Crops an image to fit within target dimensions using cover or contain mode.
 * Returns a Blob URL that can be used as an image source.
 * Falls back to the original src if anything fails.
 */
export async function cropImageToBlobUrl(
    imgSrc: string,
    fitMode: 'cover' | 'contain',
    targetW: number,
    targetH: number
): Promise<string> {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = async () => {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = targetW;
                canvas.height = targetH;
                const ctx = canvas.getContext('2d');
                if (!ctx) return resolve(imgSrc);

                const dimensions = calculateCropDimensions(img.width, img.height, targetW, targetH, fitMode);
                drawImageToCanvas(canvas, img, dimensions);

                const blobUrl = await canvasToBlobUrl(canvas);
                resolve(blobUrl || imgSrc);
            } catch {
                resolve(imgSrc);
            }
        };
        img.onerror = () => resolve(imgSrc);
        img.src = imgSrc;
    });
}

export interface PdfExportOptions {
    cardW: number;
    cardH: number;
    fitMode: 'cover' | 'contain';
    printAreaSelector?: string;
    sheetSelector?: string;
    imageSelector?: string;
}

interface ImageRestoreData {
    originalSrcs: Map<HTMLImageElement, string>;
    originalStyles: Map<HTMLImageElement, string | null>;
    blobUrls: string[];
}

/**
 * Prepares images by cropping them to target dimensions.
 * Saves original src and style so they can be fully restored after export.
 */
async function prepareImagesForExport(
    images: HTMLImageElement[],
    targetW: number,
    targetH: number,
    fitMode: 'cover' | 'contain'
): Promise<ImageRestoreData> {
    const originalSrcs = new Map<HTMLImageElement, string>();
    const originalStyles = new Map<HTMLImageElement, string | null>();
    const blobUrls: string[] = [];

    for (const img of images) {
        if (!img.src || !img.complete) continue;
        originalSrcs.set(img, img.src);
        // Store null if no style attribute so we can removeAttribute on restore
        originalStyles.set(img, img.getAttribute('style'));

        const croppedUrl = await cropImageToBlobUrl(img.src, fitMode, targetW, targetH);
        if (croppedUrl.startsWith('blob:')) {
            blobUrls.push(croppedUrl);
        }
        img.src = croppedUrl;
        // Override object-fit so the pre-cropped image fills the element without
        // additional browser-side scaling (the crop already handled positioning)
        img.style.objectFit = 'fill';
    }

    return { originalSrcs, originalStyles, blobUrls };
}

/**
 * Waits for all modified images to fully decode their new blob sources.
 * This prevents html2canvas from capturing before images are painted.
 */
async function waitForImagesToLoad(images: HTMLImageElement[]): Promise<void> {
    await Promise.all(
        images.map((img) =>
            img.decode().catch(() => {
                // decode() rejects for broken/empty images — ignore safely
            })
        )
    );
}

/**
 * Restores original image sources and styles exactly as they were.
 */
function restoreImages(restoreData: ImageRestoreData): void {
    const { originalSrcs, originalStyles, blobUrls } = restoreData;

    for (const [img, originalSrc] of originalSrcs) {
        img.src = originalSrc;
    }
    for (const [img, originalStyle] of originalStyles) {
        if (originalStyle !== null) {
            img.setAttribute('style', originalStyle);
        } else {
            img.removeAttribute('style');
        }
    }

    for (const url of blobUrls) {
        URL.revokeObjectURL(url);
    }
}

/**
 * Captures a sheet as a canvas using html2canvas
 */
async function captureSheetToCanvas(
    sheet: HTMLElement,
    exportScale: number,
    html2canvas: any
): Promise<HTMLCanvasElement> {
    return await html2canvas.default(sheet, {
        scale: exportScale,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
    });
}

/**
 * Adds sheets to the PDF document.
 * Uses JPEG at 0.95 quality — balanced between file size and fidelity.
 * Pre-cropped images are stored as PNG blobs (lossless), so the only
 * quality loss is at this final JPEG encode step.
 */
async function addSheetsToPdf(
    pdf: any,
    sheets: HTMLElement[],
    exportScale: number,
    html2canvas: any
): Promise<void> {
    for (let i = 0; i < sheets.length; i++) {
        const canvas = await captureSheetToCanvas(sheets[i], exportScale, html2canvas);
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
    }
}

/**
 * Generates a PDF from card sheets in the DOM.
 *
 * Flow:
 *  1. Find all .a4 sheet elements and img.art images inside the print area
 *  2. Pre-crop each art image to card dimensions at export resolution (lossless PNG blob)
 *  3. Wait for all image elements to decode their new sources
 *  4. Capture each sheet with html2canvas, add to jsPDF
 *  5. Restore all original image sources and styles, revoke blob URLs
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

    const exportScale = Math.max(2, window.devicePixelRatio || 1);
    document.documentElement.setAttribute('data-exporting', 'true');

    const restoreData: ImageRestoreData = {
        originalSrcs: new Map(),
        originalStyles: new Map(),
        blobUrls: []
    };

    try {
        const sheets = Array.from(
            document.querySelectorAll<HTMLElement>(`${printAreaSelector} ${sheetSelector}`)
        );

        if (!sheets.length) {
            alert('No sheets to export.');
            return;
        }

        const images = Array.from(
            document.querySelectorAll<HTMLImageElement>(`${printAreaSelector} ${imageSelector}`)
        );

        // Compute target pixel dimensions for the crop at export resolution.
        // 3.7795 px/mm is the CSS pixel density at 96 dpi (96 / 25.4).
        // Multiplying by exportScale gives the canvas pixels html2canvas will render.
        const mmToPx = 3.7795 * exportScale;
        const targetW = Math.round(cardW * mmToPx);
        const targetH = Math.round(cardH * mmToPx);

        Object.assign(restoreData, await prepareImagesForExport(images, targetW, targetH, fitMode));

        // Wait for all image elements to finish decoding their new blob sources
        // before html2canvas captures the DOM. Without this, html2canvas may
        // render blank or stale images if the browser hasn't painted them yet.
        await waitForImagesToLoad(images);

        const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
        await addSheetsToPdf(pdf, sheets, exportScale, html2canvas);
        pdf.save('dnd-cards.pdf');
    } finally {
        restoreImages(restoreData);
        document.documentElement.removeAttribute('data-exporting');
    }
}
