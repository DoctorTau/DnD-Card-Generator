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
 * Calculates dimensions for cover fit mode (fills entire area, crops overflow)
 */
function calculateCoverDimensions(
    imgRatio: number,
    targetRatio: number,
    targetW: number,
    targetH: number
): CropDimensions {
    if (imgRatio > targetRatio) {
        const drawH = targetH;
        const drawW = drawH * imgRatio;
        return { drawW, drawH, offsetX: (targetW - drawW) / 2, offsetY: 0 };
    } else {
        const drawW = targetW;
        const drawH = drawW / imgRatio;
        return { drawW, drawH, offsetX: 0, offsetY: (targetH - drawH) / 2 };
    }
}

/**
 * Calculates dimensions for contain fit mode (fits inside, adds letterboxing)
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
 * Draws an image onto a canvas with the specified crop dimensions
 */
function drawImageToCanvas(
    canvas: HTMLCanvasElement,
    img: HTMLImageElement,
    dimensions: CropDimensions
): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = 'transparent';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, dimensions.offsetX, dimensions.offsetY, dimensions.drawW, dimensions.drawH);
}

/**
 * Converts a canvas to a Blob URL
 */
async function canvasToBlobUrl(canvas: HTMLCanvasElement): Promise<string | null> {
    const blob: Blob | null = await new Promise((res) => canvas.toBlob(res));
    if (!blob) return null;
    return URL.createObjectURL(blob);
}

/**
 * Crops an image to fit within target dimensions using cover or contain mode
 * Returns a Blob URL that can be used as an image source
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
            } catch (e) {
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
    originalStyles: Map<HTMLImageElement, string>;
    blobUrls: string[];
}

/**
 * Prepares images by cropping them to target dimensions
 */
async function prepareImagesForExport(
    images: HTMLImageElement[],
    targetW: number,
    targetH: number,
    fitMode: 'cover' | 'contain'
): Promise<ImageRestoreData> {
    const originalSrcs = new Map<HTMLImageElement, string>();
    const originalStyles = new Map<HTMLImageElement, string>();
    const blobUrls: string[] = [];

    for (const img of images) {
        if (!img.src || !img.complete) continue;
        originalSrcs.set(img, img.src);
        originalStyles.set(img, img.getAttribute('style') || '');

        const croppedUrl = await cropImageToBlobUrl(img.src, fitMode, targetW, targetH);
        if (croppedUrl.startsWith('blob:')) {
            blobUrls.push(croppedUrl);
        }
        img.src = croppedUrl;
        img.style.objectFit = 'fill';
    }

    return { originalSrcs, originalStyles, blobUrls };
}

/**
 * Restores original image sources and styles
 */
function restoreImages(restoreData: ImageRestoreData, fitMode: 'cover' | 'contain'): void {
    const { originalSrcs, originalStyles, blobUrls } = restoreData;

    for (const [img, originalSrc] of originalSrcs) {
        img.src = originalSrc;
    }
    for (const [img, originalStyle] of originalStyles) {
        if (originalStyle) {
            img.setAttribute('style', originalStyle);
        } else {
            img.style.objectFit = fitMode;
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
 * Adds sheets to the PDF document
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
        if (i > 0) pdf.addPage('a4', 'portrait');
        pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
    }
}

/**
 * Generates a PDF from card sheets in the DOM
 * Pre-crops all card images to match the card dimensions before capture
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

        const mmToPx = 3.7795 * exportScale;
        const targetW = Math.round(cardW * mmToPx);
        const targetH = Math.round(cardH * mmToPx);

        const restoreData = await prepareImagesForExport(images, targetW, targetH, fitMode);

        const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
        await addSheetsToPdf(pdf, sheets, exportScale, html2canvas);
        pdf.save('dnd-cards.pdf');

        restoreImages(restoreData, fitMode);
    } finally {
        document.documentElement.removeAttribute('data-exporting');
    }
}
