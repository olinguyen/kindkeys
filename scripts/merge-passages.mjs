#!/usr/bin/env node
/**
 * Appends the output of the grow-passages workflow to passages.json.
 *
 *   node scripts/merge-passages.mjs <result.json>
 *
 * The result is the workflow's return value: an array of
 * { id, excerpts: [{text, author, work, translator, tags}], originals: [{text, tags}] }.
 * Author and translator spellings are normalised, exact duplicates skipped,
 * and originals interleaved two-to-one with excerpts so the day rotation
 * alternates voices. Run check:passages afterwards.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const file = join(root, 'src/data/passages.json');
const input = process.argv[2];
if (!input) {
  console.error('usage: node scripts/merge-passages.mjs <result.json>');
  process.exit(2);
}

const AUTHOR = { 'Lao Tzu': 'Laozi', Buddha: 'The Buddha', 'Zhuang Zhou': 'Zhuangzi', 'Chuang Tzu': 'Zhuangzi', 'Marcus Aurelius Antoninus': 'Marcus Aurelius' };
const TRANSLATOR = { 'Richard Mott Gummere': 'Richard Gummere', 'F. Max Muller': 'Max Muller', 'Friedrich Max Muller': 'Max Muller', 'Charles Cotton': 'Charles Cotton' };

const passages = JSON.parse(readFileSync(file, 'utf8'));
let raw = JSON.parse(readFileSync(input, 'utf8'));
if (raw && !Array.isArray(raw) && raw.result) raw = raw.result;

const seen = new Set(Object.values(passages).flat().map((p) => p.text));
let added = 0;
let skipped = 0;

for (const cat of raw.filter(Boolean)) {
  const list = passages[cat.id];
  if (!list) {
    console.error(`unknown category ${cat.id}`);
    process.exit(1);
  }
  const take = (p) => {
    if (seen.has(p.text)) {
      skipped++;
      return false;
    }
    seen.add(p.text);
    return true;
  };
  const excerpts = (cat.excerpts ?? []).filter(take).map((e) => {
    const out = { text: e.text, author: AUTHOR[e.author] ?? e.author, work: e.work };
    if (e.translator) out.translator = TRANSLATOR[e.translator] ?? e.translator;
    out.tags = e.tags;
    return out;
  });
  const originals = (cat.originals ?? []).filter(take).map((o) => ({ text: o.text, original: true, tags: o.tags }));
  while (excerpts.length || originals.length) {
    if (originals.length) list.push(originals.shift());
    if (originals.length) list.push(originals.shift());
    if (excerpts.length) list.push(excerpts.shift());
  }
  added += excerpts.length + originals.length;
  console.log(`${cat.id}: now ${list.length}`);
}

writeFileSync(file, JSON.stringify(passages, null, 2) + '\n');
console.log(`${skipped ? `${skipped} duplicate${skipped > 1 ? 's' : ''} skipped, ` : ''}written — run npm run check:passages`);
