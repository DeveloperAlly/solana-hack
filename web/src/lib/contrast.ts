// WCAG 2.2 relative luminance and contrast ratio for hex colours. Definitions, including the 0.04045 sRGB threshold:
// https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum#dfn-relative-luminance
// https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum#dfn-contrast-ratio
// Translucent colours (eight-digit hex with alpha below ff) return null: their contrast depends on what
// is underneath, so callers report "Cannot check" instead of a false Pass.
export function parseHex(value: string): [number, number, number] | null {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(value.trim());
  if (!m) return null;
  let h = m[1];
  if (h.length === 8) {
    if (h.slice(6).toLowerCase() !== 'ff') return null;
    h = h.slice(0, 6);
  }
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
}

function luminance([r, g, b]: [number, number, number]): number {
  const ch = (c: number) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
}

export function contrastRatio(fg: string, bg: string): number | null {
  const a = parseHex(fg);
  const b = parseHex(bg);
  if (!a || !b) return null;
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

export const contrastThreshold = { text: 4.5, large: 3, ui: 3 } as const;
