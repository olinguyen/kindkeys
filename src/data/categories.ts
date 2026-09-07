/**
 * The four Kindkeys categories. Each carries its own palette, passage set and
 * illustration; the palette values are the ones tuned in design — the Kindness
 * and Presence grounds are hue-matched to their accents, Perspective keeps the
 * Organic surface, and "Your own" sits on a pale lavender.
 */

export type CatId = 'kind' | 'pres' | 'persp' | 'custom';

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

export interface Passage {
  text: string;
  author?: string;
  work?: string;
  /** Original, tradition-inspired writing rather than a sourced excerpt. */
  original?: boolean;
  /** Written by the reader in the "Your own" category. */
  custom?: boolean;
  tags: string[];
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
    passages: [
      {
        text: 'I am steady. I am allowed to take up space, and I trust the pace I am moving at today. I do not need to be finished to be worthy of rest. I can hold what is hard and still be gentle with myself.',
        original: true,
        tags: ['Self-compassion'],
      },
      {
        text: 'Wherever there is a human being, there is an opportunity for a kindness.',
        author: 'Seneca',
        work: 'On the Happy Life',
        tags: ['Stoicism'],
      },
      {
        text: 'You can be patient with yourself the way you are patient with a friend who is learning. You are allowed to go slowly. You are allowed to begin again, and the beginning still counts.',
        original: true,
        tags: ['Self-compassion', 'Buddhism'],
      },
    ],
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
    passages: [
      {
        text: 'Right now there is a breath moving through me. I notice the weight of my hands, the sound of the room, the light where it falls. Nothing needs solving in this moment. I am here, and here is enough.',
        original: true,
        tags: ['Mindfulness', 'Buddhism'],
      },
      {
        text: 'Do not disturb yourself by picturing your life as a whole. Ask yourself about each present difficulty: what is there in this that cannot be borne? You will be ashamed to confess it.',
        author: 'Marcus Aurelius',
        work: 'Meditations, 8.36',
        tags: ['Stoicism'],
      },
      {
        text: 'The kettle, the cold floor, the first light on the wall. Ordinary things are not waiting to become something else. I can meet them as they are, one at a time, and let that be the whole task.',
        original: true,
        tags: ['Mindfulness', 'Daoism'],
      },
    ],
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
    passages: [
      {
        text: 'Some things are within our power, while others are not. Within our power are opinion, motivation, desire, aversion, and in a word, whatever is of our own doing; not within our power are our body, our property, reputation, office.',
        author: 'Epictetus',
        work: 'Enchiridion, 1',
        tags: ['Stoicism'],
      },
      {
        text: 'Most of what worries me will not matter in a year. I can hold my plans loosely and let the day change them. What is mine to do, I will do. What is not mine, I can set down.',
        original: true,
        tags: ['Stoicism'],
      },
      {
        text: 'He who knows he has enough is rich. Water is soft and yields, yet nothing is better at wearing away what is hard. I can let go of the shape I planned and still arrive somewhere good.',
        original: true,
        tags: ['Daoism'],
      },
    ],
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
