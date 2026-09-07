import raw from './passages.json';
import type { CuratedCatId, Passage } from './types';

/**
 * The curated passages, kept as plain data in `passages.json` so reviewing them
 * is reading prose rather than scrolling past palette values, and so a change
 * shows up as a readable diff.
 *
 * The cast is the boundary: JSON carries no literal types, so `check:passages`
 * is what actually enforces the shape — required fields, tag vocabulary, length
 * bounds, no duplicates. Run it after any edit; CI runs it before every deploy.
 */
export const PASSAGES = raw as Record<CuratedCatId, Passage[]>;
