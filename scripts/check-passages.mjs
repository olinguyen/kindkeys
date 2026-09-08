#!/usr/bin/env node
/**
 * Checks the curated passages and prints them as a review table.
 *
 * Errors fail the build — a passage that is mislabelled, over length, tagged
 * with a word that isn't in the vocabulary, or duplicated. Warnings don't fail;
 * they're the standing to-do list (an excerpt whose translation isn't yet
 * credited, a category whose pool is small enough that the day rotation
 * visibly loops).
 *
 * Run after any edit to passages.json:  npm run check:passages
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');

const PASSAGES = JSON.parse(read('src/data/passages.json'));

// The tag vocabulary lives in types.ts, where TypeScript derives the Tag union
// from it. Read it from there so there is exactly one list to keep current.
const typesSrc = read('src/data/types.ts');
const tagsBlock = typesSrc.match(/export const TAGS = \[([\s\S]*?)\] as const;/);
if (!tagsBlock) {
  console.error('check:passages — could not find `export const TAGS = [...] as const;` in src/data/types.ts');
  process.exit(2);
}
const TAGS = [...tagsBlock[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);

// The category ids live in types.ts too (`CuratedCatId`), derived from `CatId`.
// A key that isn't one of them passes the `as Record<...>` cast in passages.ts
// and then crashes the app on `cat.passages.length`, so check it here.
const catIdBlock = typesSrc.match(/export type CatId = ([^;]+);/);
if (!catIdBlock) {
  console.error('check:passages — could not find `export type CatId = ...;` in src/data/types.ts');
  process.exit(2);
}
const CAT_IDS = [...catIdBlock[1].matchAll(/'([^']+)'/g)].map((m) => m[1]).filter((id) => id !== 'custom');

// The length cap is `MAX_CHARS` in categories.ts — the same number caps a
// custom passage, so read it rather than keep a copy here.
const maxBlock = read('src/data/categories.ts').match(/export const MAX_CHARS = (\d+);/);
if (!maxBlock) {
  console.error('check:passages — could not find `export const MAX_CHARS = <n>;` in src/data/categories.ts');
  process.exit(2);
}

// Bounds. MAX is also the size at which the app drops the passage a font size;
// the target band is the 30–60s the app is designed around, at an unhurried
// 40wpm.
const MAX = Number(maxBlock[1]);
const MIN = 60;
const TARGET_MIN = 100;
const TARGET_MAX = 220;
const MIN_POOL = 30;
const WPM = 40;

// Authors who wrote in English, so an excerpt of theirs has no translator to credit.
const ENGLISH = ['Henry David Thoreau', 'Ralph Waldo Emerson'];

const errors = [];
const warnings = [];
const seen = new Map(); // text -> "cat #n"
const openings = new Map(); // first 40 chars -> "cat #n"

const secs = (chars) => (chars / 5 / WPM) * 60;

// Category keys: exactly the curated ids, in any order.
for (const id of CAT_IDS) if (!(id in PASSAGES)) errors.push(`${id}: category missing from passages.json`);
for (const key of Object.keys(PASSAGES)) {
  if (!CAT_IDS.includes(key)) errors.push(`${key}: not a category — expected one of ${CAT_IDS.join(', ')}`);
}

console.log(`\n${'category'.padEnd(11)} ${'#'.padEnd(2)} ${'chars'.padStart(5)} ${'~time'.padStart(6)}  ${'attribution'.padEnd(38)} tags`);
console.log('-'.repeat(104));

for (const [cat, list] of Object.entries(PASSAGES)) {
  if (!Array.isArray(list) || list.length === 0) {
    errors.push(`${cat}: no passages`);
    continue;
  }
  if (list.length < MIN_POOL) {
    warnings.push(
      `${cat}: ${list.length} passages — "Today's intention" repeats every ${list.length} days (want ${MIN_POOL}+)`,
    );
  }

  list.forEach((p, i) => {
    const at = `${cat} #${i + 1}`;
    const t = p.text ?? '';
    const isExcerpt = Boolean(p.author);
    const isOriginal = p.original === true;

    // Shape: exactly one of excerpt / original, each with its own fields.
    if (isExcerpt && isOriginal) errors.push(`${at}: has an author and is marked original — pick one`);
    if (!isExcerpt && !isOriginal) errors.push(`${at}: neither an excerpt (author + work) nor marked original`);
    if (isExcerpt && !p.work) errors.push(`${at}: excerpt from ${p.author} is missing \`work\``);
    if (isOriginal && (p.work || p.translator)) errors.push(`${at}: original writing must not carry work/translator`);
    if (isExcerpt && !p.translator && !ENGLISH.includes(p.author)) {
      warnings.push(`${at}: ${p.author} — no \`translator\`; confirm the edition and that it is out of copyright`);
    }

    // Text.
    if (!t) errors.push(`${at}: empty text`);
    if (t.length > MAX) errors.push(`${at}: ${t.length} chars, over the ${MAX} cap`);
    if (t && t.length < MIN) errors.push(`${at}: ${t.length} chars, under the ${MIN} floor`);
    if (t !== t.trim()) errors.push(`${at}: leading or trailing whitespace`);
    if (/\s{2,}/.test(t)) errors.push(`${at}: repeated whitespace`);
    // The typing engine compares characters exactly, so anything a plain
    // keyboard can't produce — curly quotes, em dashes, non-breaking spaces —
    // is a typo the reader can never fix.
    const odd = [...new Set(t.match(/[^\x20-\x7e]/g) ?? [])];
    if (odd.length) {
      const list = odd.map((c) => `"${c}" (U+${c.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')})`).join(', ');
      errors.push(`${at}: untypeable character${odd.length > 1 ? 's' : ''} ${list} — use plain ASCII punctuation`);
    }
    if (t.length >= MIN && t.length <= MAX && (t.length < TARGET_MIN || t.length > TARGET_MAX)) {
      warnings.push(`${at}: ${t.length} chars ≈ ${secs(t.length).toFixed(0)}s, outside the 30–60s band`);
    }

    // Duplicates, exact and near.
    if (seen.has(t)) errors.push(`${at}: identical text to ${seen.get(t)}`);
    else seen.set(t, at);
    const open = t.slice(0, 40).toLowerCase();
    if (open && openings.has(open)) warnings.push(`${at}: opens the same as ${openings.get(open)}`);
    else openings.set(open, at);

    // Tags.
    if (!Array.isArray(p.tags) || p.tags.length === 0) errors.push(`${at}: no tags`);
    else {
      for (const tag of p.tags) {
        if (!TAGS.includes(tag)) errors.push(`${at}: unknown tag "${tag}" — add it to TAGS in src/data/types.ts or fix the spelling`);
      }
      if (new Set(p.tags).size !== p.tags.length) errors.push(`${at}: duplicate tags`);
    }

    const src = isExcerpt
      ? `${p.author}, ${p.work}${p.translator ? ` (tr. ${p.translator})` : ''}`
      : '— original —';
    console.log(
      `${cat.padEnd(11)} ${String(i + 1).padEnd(2)} ${String(t.length).padStart(5)} ${`${secs(t.length).toFixed(0)}s`.padStart(6)}  ${src.padEnd(38)} ${(p.tags ?? []).join(', ')}`,
    );
  });
}

const total = Object.values(PASSAGES).reduce((n, l) => n + (Array.isArray(l) ? l.length : 0), 0);
console.log('-'.repeat(104));
console.log(`${total} passages across ${Object.keys(PASSAGES).length} categories\n`);

for (const w of warnings) console.log(`  warn   ${w}`);
for (const e of errors) console.log(`  ERROR  ${e}`);
if (warnings.length || errors.length) console.log('');

if (errors.length) {
  console.error(`check:passages failed — ${errors.length} error${errors.length > 1 ? 's' : ''}\n`);
  process.exit(1);
}
console.log(`check:passages passed${warnings.length ? ` (${warnings.length} warning${warnings.length > 1 ? 's' : ''})` : ''}\n`);
