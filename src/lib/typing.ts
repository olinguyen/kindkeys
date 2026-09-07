import type { Theme } from '../data/categories';

/** One run of one passage. Runs are kept per passage, so switching category and back resumes. */
export interface Run {
  typed: string;
  /** Epoch ms of the first keystroke, 0 before it. */
  start: number;
  /** Epoch ms of the last character, 0 while in progress. */
  end: number;
  /** Backspaces — reported as "Corrections". */
  fix: number;
  /**
   * High-water mark of completion, 0–1, counting every character typed whether
   * or not it was right. Illustrations read this, so backspacing never undoes
   * growth.
   */
  hi: number;
}

export const emptyRun: Run = { typed: '', start: 0, end: 0, fix: 0, hi: 0 };

export interface CharCell {
  ch: string;
  color: string;
  bg: string;
  /** The character the caret sits on. */
  cur: boolean;
}

export interface WordCell {
  chars: CharCell[];
  /** Fully typed with no mistakes still standing — the word lifts. */
  done: boolean;
}

export interface Build {
  words: WordCell[];
  wpm: number;
  acc: number;
  /** Elapsed seconds, one decimal. */
  sec: string;
  doneAll: boolean;
  started: boolean;
  hi: number;
  doneWords: number;
}

/** Everything the passage view and the summary need, derived from one run. */
export function buildRun(text: string, run: Run, th: Theme, now: number): Build {
  const { typed, start, end } = run;
  const elapsed = start ? ((end || now) - start) / 1000 : 0;

  let correct = 0;
  for (let i = 0; i < typed.length; i++) if (typed[i] === text[i]) correct++;

  const wpm = elapsed > 0.5 ? Math.round(correct / 5 / (elapsed / 60)) : 0;
  const acc = typed.length ? Math.round((correct / typed.length) * 100) : 100;

  const parts = text.split(' ');
  let idx = 0;
  const words = parts.map((w, wi) => {
    const raw = wi < parts.length - 1 ? w + ' ' : w;
    const chars: CharCell[] = [];
    let allOk = true;
    for (const ch of raw) {
      const i = idx++;
      let color = th.todo;
      let bg = 'transparent';
      let cur = false;
      if (i < typed.length) {
        if (typed[i] === text[i]) color = 'var(--color-text)';
        else {
          color = th.bad;
          bg = th.badBg;
          allOk = false;
        }
      } else {
        allOk = false;
        if (i === typed.length) cur = true;
      }
      chars.push({ ch: ch === ' ' ? '\u00a0' : ch, color, bg, cur });
    }
    const done = allOk && typed.length >= idx - (wi < parts.length - 1 ? 1 : 0);
    if (done) chars.forEach((c) => (c.color = th.deep));
    return { chars, done };
  });

  return {
    words,
    wpm,
    acc,
    sec: Math.min(elapsed, 999).toFixed(1),
    doneAll: !!end,
    started: !!start,
    hi: end ? 1 : run.hi,
    doneWords: words.filter((w) => w.done).length,
  };
}
