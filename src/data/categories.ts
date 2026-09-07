import { PASSAGES } from './passages';
import type { Category } from './types';

export type { CatId, CuratedCatId, Category, Passage, Tag, Theme } from './types';
export { TAGS } from './types';

/**
 * The four categories. Palettes are the ones tuned in design — the Kindness and
 * Presence grounds are hue-matched to their accents, Perspective keeps the
 * Organic surface, and "Your own" sits on a pale lavender.
 *
 * The prose lives in `passages.json`; this file is the look and the labels.
 */
export const CATS: Category[] = [
  {
    id: 'kind',
    label: 'Kindness',
    purpose: 'Practice being gentler with yourself and others.',
    doneLine: 'Done.',
    doneSub: 'Sit with it a second.',
    th: {
      bg: 'oklch(0.95 0.022 125)',
      accent: 'var(--color-accent-2-500)',
      mid: 'var(--color-accent-2-300)',
      soft: 'oklch(0.885 0.05 125)',
      deep: 'var(--color-accent-2-800)',
      todo: 'var(--color-neutral-600)',
      bad: 'var(--color-accent-600)',
      badBg: 'oklch(0.92 0.06 70)',
      sparks: ['var(--color-accent-2-400)', 'var(--color-accent-2-300)', 'var(--color-accent-300)'],
    },
    passages: PASSAGES.kind,
  },
  {
    id: 'pres',
    label: 'Presence',
    purpose: 'Bring attention to this moment.',
    doneLine: 'Here.',
    doneSub: 'Notice the room.',
    th: {
      bg: 'oklch(0.95 0.018 225)',
      accent: 'oklch(0.63 0.06 225)',
      mid: 'oklch(0.83 0.045 225)',
      soft: 'oklch(0.89 0.04 225)',
      deep: 'oklch(0.40 0.06 225)',
      todo: 'var(--color-neutral-600)',
      bad: 'var(--color-accent-600)',
      badBg: 'oklch(0.94 0.045 70)',
      sparks: ['oklch(0.72 0.07 225)', 'oklch(0.85 0.05 225)', 'var(--color-accent-200)'],
    },
    passages: PASSAGES.pres,
  },
  {
    id: 'persp',
    label: 'Perspective',
    purpose: 'Step back, weigh what matters, accept what you cannot control.',
    doneLine: 'Balanced.',
    doneSub: 'Set the rest down.',
    th: {
      bg: 'var(--color-surface)',
      accent: 'oklch(0.72 0.10 80)',
      mid: 'oklch(0.86 0.07 82)',
      soft: 'oklch(0.94 0.035 85)',
      deep: 'oklch(0.42 0.08 78)',
      todo: 'var(--color-neutral-600)',
      bad: 'var(--color-accent-600)',
      badBg: 'oklch(0.94 0.045 70)',
      sparks: ['oklch(0.80 0.10 80)', 'oklch(0.88 0.07 82)', 'var(--color-neutral-400)'],
    },
    passages: PASSAGES.persp,
  },
  {
    id: 'custom',
    label: 'Your own',
    purpose: 'Write the passage you want to sit with today.',
    doneLine: 'Written.',
    doneSub: 'Carry it with you today.',
    custom: true,
    th: {
      bg: 'oklch(0.955 0.014 300)',
      accent: 'oklch(0.58 0.08 290)',
      mid: 'oklch(0.82 0.05 290)',
      soft: 'oklch(0.935 0.025 290)',
      deep: 'oklch(0.36 0.07 290)',
      todo: 'var(--color-neutral-600)',
      bad: 'var(--color-accent-600)',
      badBg: 'oklch(0.94 0.045 70)',
      sparks: ['oklch(0.72 0.09 295)', 'oklch(0.82 0.10 85)', 'oklch(0.88 0.04 300)'],
    },
    passages: [],
  },
];

/** Ordinals for the repeat line in the summary card ("Third time with these words."). */
export const ORD: Record<number, string> = {
  2: 'second',
  3: 'third',
  4: 'fourth',
  5: 'fifth',
  6: 'sixth',
  7: 'seventh',
  8: 'eighth',
  9: 'ninth',
  10: 'tenth',
};

/** A custom passage is capped to the length of the longest curated one. */
export const MAX_CHARS = 250;

/** Whole days since the epoch — picks each category's passage of the day. */
export function today(): number {
  return Math.floor(Date.now() / 864e5);
}
