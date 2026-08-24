import { CornerPoints, FilterPreset, Point } from '../types';

/**
 * Applies CamScanner-style filters to an HTML5 Canvas context
 */
export function applyDocumentFilter(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  filter: FilterPreset,
  options: {
    brightness?: number; // -50 to 50
    contrast?: number;   // -50 to 50
    threshold?: number;  // 0 to 255
  } = {}
) {
  const { brightness = 0, contrast = 0, threshold = 145 } = options;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const len = data.length;

  // Contrast factor
  const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));

  if (filter === 'magic_color') {
    // CamScanner "Magic Color" algorithm:
    // 1. Whitens background (anything above ~160 becomes pure white or near-white #FFFFFF)
    // 2. Deepens dark text pixels
    // 3. Preserves chromatic ink (e.g. blue pen signatures, red/purple notary stamps)
    for (let i = 0; i < len; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      // Detect color saturation (is this colored ink like a blue signature or red stamp?)
      const maxC = Math.max(r, g, b);
      const minC = Math.min(r, g, b);
      const saturation = maxC === 0 ? 0 : (maxC - minC) / maxC;
      const isColoredInk = saturation > 0.22 && maxC < 240;

      // Apply brightness adjustment
      r = Math.min(255, Math.max(0, r + brightness));
      g = Math.min(255, Math.max(0, g + brightness));
      b = Math.min(255, Math.max(0, b + brightness));

      if (isColoredInk) {
        // Boost vibrancy of stamps/signatures while flattening background around it
        const luma = 0.299 * r + 0.587 * g + 0.114 * b;
        if (luma > 200) {
          // Flatten paper background
          data[i] = 255;
          data[i + 1] = 255;
          data[i + 2] = 255;
        } else {
          // Keep rich ink color
          data[i] = Math.min(255, Math.max(0, Math.round(contrastFactor * (r - 128) + 128)));
          data[i + 1] = Math.min(255, Math.max(0, Math.round(contrastFactor * (g - 128) + 128)));
          data[i + 2] = Math.min(255, Math.max(0, Math.round(contrastFactor * (b - 128) + 128)));
        }
      } else {
        // Neutral / text / paper background
        const luma = 0.299 * r + 0.587 * g + 0.114 * b;

        // Magic color curve: S-curve with aggressive highlight whitening
        if (luma > 175) {
          // Pure white paper background (#FFFFFF)
          data[i] = 255;
          data[i + 1] = 255;
          data[i + 2] = 255;
        } else if (luma < 90) {
          // Deep crisp black text
          const darkened = Math.max(0, Math.round(luma * 0.45));
          data[i] = darkened;
          data[i + 1] = darkened;
          data[i + 2] = darkened;
        } else {
          // Transition zone: apply high contrast
          const normalized = (luma - 90) / (175 - 90);
          const val = Math.min(255, Math.max(0, Math.round(255 * Math.pow(normalized, 1.8))));
          data[i] = val;
          data[i + 1] = val;
          data[i + 2] = val;
        }
      }
    }
  } else if (filter === 'bw') {
    // Pure Black & White (Adaptive binary thresholding for OCR)
    const effectiveThreshold = threshold + brightness;
    for (let i = 0; i < len; i += 4) {
      const luma = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      const val = luma > effectiveThreshold ? 255 : 0;
      data[i] = val;
      data[i + 1] = val;
      data[i + 2] = val;
    }
  } else if (filter === 'grayscale') {
    // Studio Grayscale with contrast boost
    for (let i = 0; i < len; i += 4) {
      let luma = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      luma = Math.min(255, Math.max(0, luma + brightness));
      luma = Math.min(255, Math.max(0, contrastFactor * (luma - 128) + 128));

      // Gentle white clipping for clean scanner background
      if (luma > 215) luma = 255;

      data[i] = luma;
      data[i + 1] = luma;
      data[i + 2] = luma;
    }
  } else if (filter === 'sharp') {
    // High-definition sharpen filter
    for (let i = 0; i < len; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      r = Math.min(255, Math.max(0, r + brightness));
      g = Math.min(255, Math.max(0, g + brightness));
      b = Math.min(255, Math.max(0, b + brightness));

      r = Math.min(255, Math.max(0, contrastFactor * (r - 128) + 128));
      g = Math.min(255, Math.max(0, contrastFactor * (g - 128) + 128));
      b = Math.min(255, Math.max(0, contrastFactor * (b - 128) + 128));

      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
    }
  } else {
    // Original with optional basic adjustments
    if (brightness !== 0 || contrast !== 0) {
      for (let i = 0; i < len; i += 4) {
        data[i] = Math.min(255, Math.max(0, contrastFactor * (data[i] + brightness - 128) + 128));
        data[i + 1] = Math.min(255, Math.max(0, contrastFactor * (data[i + 1] + brightness - 128) + 128));
        data[i + 2] = Math.min(255, Math.max(0, contrastFactor * (data[i + 2] + brightness - 128) + 128));
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

/**
 * Performs a 4-point perspective warp on a canvas
 */
export function warpPerspectiveCanvas(
  sourceImage: HTMLImageElement | HTMLCanvasElement,
  corners: CornerPoints,
  targetWidth: number = 1000,
  targetHeight: number = 1414 // A4 aspect ratio ~ 1:1.414
): HTMLCanvasElement {
  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = targetWidth;
  outputCanvas.height = targetHeight;
  const outCtx = outputCanvas.getContext('2d');
  if (!outCtx) return outputCanvas;

  // Use subdivision mesh approximation for perspective transformation in standard canvas 2D
  const SUBDIVISIONS = 32;
  const src = [
    corners.topLeft,
    corners.topRight,
    corners.bottomRight,
    corners.bottomLeft,
  ];

  function getBilinearPoint(u: number, v: number): Point {
    const topX = src[0].x * (1 - u) + src[1].x * u;
    const topY = src[0].y * (1 - u) + src[1].y * u;
    const botX = src[3].x * (1 - u) + src[2].x * u;
    const botY = src[3].y * (1 - u) + src[2].y * u;
    return {
      x: topX * (1 - v) + botX * v,
      y: topY * (1 - v) + botY * v,
    };
  }

  const dx = targetWidth / SUBDIVISIONS;
  const dy = targetHeight / SUBDIVISIONS;

  for (let y = 0; y < SUBDIVISIONS; y++) {
    for (let x = 0; x < SUBDIVISIONS; x++) {
      const u0 = x / SUBDIVISIONS;
      const v0 = y / SUBDIVISIONS;
      const u1 = (x + 1) / SUBDIVISIONS;
      const v1 = (y + 1) / SUBDIVISIONS;

      const p00 = getBilinearPoint(u0, v0);
      const p10 = getBilinearPoint(u1, v0);
      const p11 = getBilinearPoint(u1, v1);
      const p01 = getBilinearPoint(u0, v1);

      const dstX = x * dx;
      const dstY = y * dy;

      outCtx.save();
      outCtx.beginPath();
      outCtx.rect(dstX, dstY, dx + 0.5, dy + 0.5);
      outCtx.clip();

      // Transform triangle approximation
      const sx = Math.min(p00.x, p01.x, p10.x, p11.x);
      const sy = Math.min(p00.y, p01.y, p10.y, p11.y);
      const sw = Math.max(p00.x, p10.x, p11.x, p01.x) - sx || 1;
      const sh = Math.max(p00.y, p10.y, p11.y, p01.y) - sy || 1;

      outCtx.drawImage(sourceImage, sx, sy, sw, sh, dstX, dstY, dx, dy);
      outCtx.restore();
    }
  }

  return outputCanvas;
}

/**
 * Creates default corner points for an image
 */
export function getDefaultCorners(width: number, height: number, insetRatio: number = 0.05): CornerPoints {
  const insetX = width * insetRatio;
  const insetY = height * insetRatio;
  return {
    topLeft: { x: insetX, y: insetY },
    topRight: { x: width - insetX, y: insetY },
    bottomRight: { x: width - insetX, y: height - insetY },
    bottomLeft: { x: insetX, y: height - insetY },
  };
}

/**
 * Rotates an image by 90-degree increments
 */
export function rotateCanvas(canvas: HTMLCanvasElement, degrees: number): HTMLCanvasElement {
  const normalized = ((degrees % 360) + 360) % 360;
  if (normalized === 0) return canvas;

  const newCanvas = document.createElement('canvas');
  const ctx = newCanvas.getContext('2d');
  if (!ctx) return canvas;

  if (normalized === 90 || normalized === 270) {
    newCanvas.width = canvas.height;
    newCanvas.height = canvas.width;
  } else {
    newCanvas.width = canvas.width;
    newCanvas.height = canvas.height;
  }

  ctx.translate(newCanvas.width / 2, newCanvas.height / 2);
  ctx.rotate((normalized * Math.PI) / 180);
  ctx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);

  return newCanvas;
}
