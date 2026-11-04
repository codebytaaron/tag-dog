// Shared helpers for ESPN data on a dark UI.

// ESPN serves dark-background versions of every team logo; use them everywhere.
export async function darkJson(r: Response) {
  return JSON.parse((await r.text()).replaceAll("/teamlogos/ncaa/500/", "/teamlogos/ncaa/500-dark/"));
}

// Team colors that are too dark to see on our background get lifted toward white (or swapped for the alternate color).
const lum = (h: string) => {
  const n = parseInt(h.replace("#", "").padEnd(6, "0").slice(0, 6), 16);
  return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
};
const mix = (h: string, w: number) => {
  const n = parseInt(h.replace("#", "").padEnd(6, "0").slice(0, 6), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(v + (255 - v) * w));
  return "#" + c.map((v) => v.toString(16).padStart(2, "0")).join("");
};
export function readable(hex: string, alt?: string) {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return "#d9d2c2";
  if (lum(hex) >= 0.22) return hex;
  if (alt && /^#[0-9a-f]{6}$/i.test(alt) && lum(alt) >= 0.22 && lum(alt) <= 0.9) return alt;
  return lum(hex) < 0.06 ? "#d9d2c2" : mix(hex, 0.45);
}
