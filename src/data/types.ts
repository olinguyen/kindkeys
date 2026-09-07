/** Shared shapes for the category and passage data. */

export type CatId = 'kind' | 'pres' | 'persp' | 'custom';

/** Every category but "Your own", which has no curated passages. */
export type CuratedCatId = Exclude<CatId, 'custom'>;

/**
 * The traditions and practices a passage may be tagged with. Closed on purpose:
 * tags are rendered verbatim, so a typo would ship as a label. `check:passages`
 * reads this list, so adding a tag here is the only place to add one.
 */
export const TAGS = ['Self-compassion', 'Mindfulness', 'Stoicism', 'Buddhism', 'Daoism'] as const;

export type Tag = (typeof TAGS)[number];

export interface Passage {
  text: string;
  /** Set on an excerpt, together with `work`. Never set alongside `original`. */
  author?: string;
  work?: string;
  /**
   * The translation the excerpt is taken from, credited in the source row. Any
   * translation still in copyright needs permission; pre-1930 editions (Long,
   * Carter, Higginson, Stewart) are safe and citable.
   */
  translator?: string;
  /** Original, tradition-inspired writing rather than a sourced excerpt. */
  original?: boolean;
  /** Written by the reader in the "Your own" category. */
  custom?: boolean;
  tags: Tag[];
}

export interface Theme {
  /** Page ground. */
  bg: string;
  /** The category's voice — pills, ring, caret, illustration highlights. */
  accent: string;
  /** Mid step, used for the ring track and washed illustration fills. */
  mid: string;
  /** Tinted surface for the summary card, pill housing and tags. */
  soft: string;
  /** Deep step — readable text on `soft` and on the ground. */
  deep: string;
  /** Characters not yet typed. */
  todo: string;
  /** A mistyped character. */
  bad: string;
  /** The highlight behind a mistyped character. */
  badBg: string;
  /** Three colours for the sparks a finished word releases. */
  sparks: [string, string, string];
}

export interface Category {
  id: CatId;
  label: string;
  purpose: string;
  /** Headline in the summary card. */
  doneLine: string;
  /** Its second line, unless a repeat count replaces it. */
  doneSub: string;
  custom?: boolean;
  th: Theme;
  passages: Passage[];
}
