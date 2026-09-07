/**
 * Shapes shared by the illustrations. Everything here is deterministic — the
 * same passage always grows the same plant and stacks the same cairn.
 */

/** The stem, as two cubic segments; `STEM_D` is the same curve as a path. */
const SEG: [number, number][][] = [
  [
    [130, 440],
    [90, 340],
    [190, 290],
    [130, 220],
  ],
  [
    [130, 220],
    [80, 160],
    [170, 110],
    [135, 40],
  ],
];

export const STEM_D = 'M130 440 C90 340 190 290 130 220 C80 160 170 110 135 40';

/** Point at `t` (0 at the ground, 1 at the tip) along the stem. */
export function stemPt(t: number): { x: number; y: number } {
  const s = t < 0.5 ? SEG[0] : SEG[1];
  const u = t < 0.5 ? t * 2 : (t - 0.5) * 2;
  const m = 1 - u;
  const f = (i: number) =>
    m * m * m * s[0][i] + 3 * m * m * u * s[1][i] + 3 * m * u * u * s[2][i] + u * u * u * s[3][i];
  return { x: f(0), y: f(1) };
}

/** Where the six leaves sit along the stem. */
export const LEAF_TS = [0.16, 0.3, 0.44, 0.58, 0.72, 0.86];

export interface RockSpec {
  w: number;
  h: number;
  fill: string;
  /** Horizontal offset from the cairn's centre line. */
  dx: number;
  /** Seeds the outline's irregularity. */
  seed: number;
}

/** Ten stones, largest at the base; the capstone takes the category accent. */
export const ROCKS: RockSpec[] = [
  { w: 156, h: 50, fill: 'var(--color-neutral-500)', dx: 0, seed: 3 },
  { w: 138, h: 46, fill: 'var(--color-neutral-600)', dx: 6, seed: 11 },
  { w: 122, h: 42, fill: 'var(--color-neutral-400)', dx: -5, seed: 5 },
  { w: 106, h: 38, fill: 'var(--color-neutral-500)', dx: 4, seed: 8 },
  { w: 92, h: 35, fill: 'var(--color-neutral-600)', dx: -3, seed: 13 },
  { w: 78, h: 31, fill: 'var(--color-neutral-400)', dx: 5, seed: 7 },
  { w: 64, h: 28, fill: 'var(--color-neutral-500)', dx: -4, seed: 4 },
  { w: 52, h: 25, fill: 'var(--color-neutral-600)', dx: 3, seed: 9 },
  { w: 42, h: 22, fill: 'var(--color-neutral-400)', dx: -2, seed: 6 },
  { w: 32, h: 19, fill: 'oklch(0.74 0.10 80)', dx: 1, seed: 2 },
];

export interface RockGeom extends RockSpec {
  cx: number;
  cy: number;
}

/** Resting position of each stone, stacked from the ground up with a slight overlap. */
export function rockGeom(): RockGeom[] {
  let yTop = 436;
  return ROCKS.map((r) => {
    const cy = yTop - r.h / 2 + 3;
    yTop -= r.h - 6;
    return { ...r, cx: 130 + r.dx, cy };
  });
}

/**
 * An irregular stone outline: ten points around an ellipse, nudged by a
 * deterministic bump function and joined with smooth cubics.
 */
export function blobPath(
  cx: number,
  cy: number,
  w: number,
  h: number,
  seed: number,
  amp = 1,
  flatten = true,
): string {
  const n = 10;
  const pts: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const k = 1 + amp * (0.09 * Math.sin(seed * 1.7 + i * 2.3) + 0.06 * Math.cos(seed + i * 1.1));
    const flat = flatten && i > 3 && i < 7 ? 0.88 : 1; // sit flatter on the underside
    pts.push([cx + Math.cos(a) * (w / 2) * k, cy + Math.sin(a) * (h / 2) * k * flat]);
  }
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d + ' Z';
}

/** The lotus: three rings of petals, outermost first. */
export const LOTUS_LAYERS = [
  { angles: [-62, -31, 0, 31, 62], len: 92, wid: 26, fill: 'var(--color-accent-300)' },
  { angles: [-46, -15, 15, 46], len: 76, wid: 24, fill: 'var(--color-accent-200)' },
  { angles: [-24, 0, 24], len: 58, wid: 20, fill: 'var(--color-accent-100)' },
];

export const LOTUS_PETALS = LOTUS_LAYERS.reduce((n, l) => n + l.angles.length, 0);

export function petalPath(len: number, wid: number): string {
  return `M0 0 C${-wid} ${-len * 0.22} ${-wid * 0.9} ${-len * 0.72} 0 ${-len} C${wid * 0.9} ${-len * 0.72} ${wid} ${-len * 0.22} 0 0 Z`;
}
