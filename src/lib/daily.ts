/**
 * Which passage a category shows on a given day.
 *
 * Each category shows one passage per day. Rather than walking the pool in
 * file order (which clumps traditions together), the pool is dealt out in a
 * shuffled order that lasts one full cycle of `pool.length` days, then
 * reshuffled for the next cycle. Every passage appears exactly once per cycle
 * and consecutive cycles differ. Growing the pool reshuffles — accepted.
 *
 * "Try another" advances `offset`; the sequence simply continues into the
 * following cycle, so extra reads today never make tomorrow a repeat.
 */

/** Whole days since the epoch, counted in local time so the passage turns over at local midnight. */
export function today(now: Date = new Date()): number {
  return Math.round(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 864e5);
}

/** mulberry32 — a small, fast seeded PRNG; plenty for dealing a pool of passages. */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A Fisher–Yates shuffle of `0..n-1`, deterministic for a given seed. */
function dealt(n: number, seed: number): number[] {
  const order = Array.from({ length: n }, (_, i) => i);
  const next = rng(seed);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

/**
 * Index into a pool of `n` for day `day`, `offset` steps past the day's own
 * passage. Pure: the same inputs always give the same index.
 */
export function dailyIndex(n: number, day: number, offset = 0): number {
  if (n <= 0) return 0;
  const step = day + offset;
  const cycle = Math.floor(step / n);
  const pos = ((step % n) + n) % n;
  // Mix the pool size into the seed so pools of equal length still differ.
  return dealt(n, cycle * 2654435761 + n * 40503)[pos];
}
