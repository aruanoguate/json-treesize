// src/webview/color.ts
// Pure color utilities — no DOM, no VS Code dependencies. Testable with Jest.

export interface Hsl { h: number; s: number; l: number; }

/**
 * Convert a 6-digit hex color string to HSL.
 * @param hex - Must be a valid 6-digit hex string beginning with '#' (e.g. "#4a9eda").
 *              Use resolveHexColor() to validate before calling.
 */
export function hexToHsl(hex: string): Hsl {
  const r = Number.parseInt(hex.slice(1, 3), 16) / 255;
  const g = Number.parseInt(hex.slice(3, 5), 16) / 255;
  const b = Number.parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === r)      h = ((g - b) / delta) % 6;
    else if (max === g) h = (b - r) / delta + 2;
    else                h = (r - g) / delta + 4;
    h = Math.round(h * 60);
    if (h < 0) h += 360;
  }

  const l = (max + min) / 2;
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

  return {
    h,
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Return an hsl(...) CSS string for a size ratio in [0,1].
 * ratio=1 always produces exactly the base color (h, s, baseL).
 * Dark theme: smaller nodes fade toward L=15% (near-black).
 * Light theme: smaller nodes fade toward L=90% (near-white).
 */
export function heatColor(ratio: number, h: number, s: number, baseL: number, isDark: boolean): string {
  const r = Math.min(1, Math.max(0, ratio));
  const fadeL = isDark ? 15 : 90;
  const l = Math.round(fadeL + r * (baseL - fadeL));
  return `hsl(${h},${s}%,${l}%)`;
}

/**
 * Return '#ffffff' or '#000000' — whichever has higher WCAG 2.1 contrast
 * against the given HSL background color.
 */
export function wcagTextColor(bg: Hsl): '#ffffff' | '#000000' {
  const lum = hslToLuminance(bg);
  const contrastWhite = 1.05 / (lum + 0.05);
  const contrastBlack = (lum + 0.05) / 0.05;
  return contrastWhite >= contrastBlack ? '#ffffff' : '#000000';
}

/**
 * Computes the WCAG 2.1 relative luminance of an HSL color.
 * Used internally by {@link wcagTextColor} for contrast ratio calculation.
 * @param hsl - The color in HSL representation.
 * @returns A luminance value between 0 (black) and 1 (white).
 */
function hslToLuminance(hsl: Hsl): number {
  const s = hsl.s / 100;
  const l = hsl.l / 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((hsl.h / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0, g = 0, b = 0;
  const h = hsl.h;
  if      (h < 60)  { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else              { r = c; b = x; }

  const linearise = (v: number): number => {
    const n = v + m;
    return n <= 0.04045 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4);
  };

  return 0.2126 * linearise(r) + 0.7152 * linearise(g) + 0.0722 * linearise(b);
}
