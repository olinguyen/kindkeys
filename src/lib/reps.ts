/**
 * How many times each passage has been typed. Keyed by the passage's opening
 * characters so a custom passage keeps its count across edits of unrelated
 * ones, and persisted so the tally is still there tomorrow.
 */

const STORE = 'kindkeys.reps';

export type Reps = Record<string, number>;

export function repKey(text: string): string {
  return text.slice(0, 80);
}

export function loadReps(): Reps {
  try {
    const raw = localStorage.getItem(STORE);
    return raw ? (JSON.parse(raw) as Reps) : {};
  } catch {
    return {};
  }
}

export function saveReps(reps: Reps): void {
  try {
    localStorage.setItem(STORE, JSON.stringify(reps));
  } catch {
    /* private mode, quota — the tally just won't persist */
  }
}
