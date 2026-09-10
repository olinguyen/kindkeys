# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Kindkeys is a one-minute typing practice: React 18 + TypeScript on Vite, no backend, deployed to GitHub Pages. The only persisted state is per-passage repeat counts in `localStorage` (`src/lib/reps.ts`). The README covers the product rules and provenance in depth; read it before changing behaviour.

## Commands

```bash
npm install
npm run dev              # Vite dev server on http://localhost:5173
npm run build            # tsc -b, then vite build into dist/
npm run typecheck        # tsc -b --noEmit
npm run check:passages   # validates src/data/passages.json (errors fail CI)
npm run test:caret       # Playwright e2e of the caret; starts its own Vite server on :5199
```

There is no unit-test runner and no linter. CI (`.github/workflows/ci.yml`, on pull requests) runs `check:passages` then `build`; `deploy.yml` runs the same on pushes to `main` before publishing `dist/` to Pages. Run both locally before pushing.

`test:caret` needs Chromium (`npx playwright install chromium` once) and is not run in CI. Set `KK_URL` to point it at an already-running server. It is the only automated behavioural test; if you touch `useCaret.ts`, `Passage.tsx`, focus handling in `App.tsx`, or the phone layout, run it.

## Architecture

**State lives in `src/App.tsx`** (one ~600-line component). It owns the active category, the per-category passage index, one `Run` per passage (so switching categories and back resumes), focus, the custom-passage draft, and the transient animation state (sparks, dust, thuds). It renders two layouts, desktop and phone, split at a single 860px breakpoint via `useMediaQuery`. It sets the active category's palette as `--kk-*` CSS variables on the page root.

**Data layer, `src/data/`:**
- `passages.json` is the prose and the file to edit for content. `passages.ts` casts it; the JSON has no literal types, so `scripts/check-passages.mjs` is what actually enforces the shape.
- `types.ts` holds `CatId`, `Passage`, `Theme`, and the closed `TAGS` list. The `Tag` union is derived from `TAGS`, and the checker parses `TAGS`, `CatId`, and `MAX_CHARS` (in `categories.ts`) out of the source with regexes. Keep those declarations in their exact `export const TAGS = [...] as const;` / `export type CatId = ...;` / `export const MAX_CHARS = <n>;` forms or the checker exits 2.
- `categories.ts` is the four categories' labels and palettes. `lib/daily.ts` picks each category's passage of the day: `today()` is whole local days since the epoch, and `dailyIndex()` deals the pool in a per-cycle shuffled order so every passage shows once per cycle.

**Pure logic, `src/lib/`:** `typing.ts` turns one `Run` into coloured word cells plus wpm/accuracy. `geometry.ts` holds deterministic shapes for the SVG illustrations. `fountain.ts` builds the "Your own" fountain imperatively (per-frame animation, not React renders). `reps.ts` persists repeat counts keyed by the passage's first 80 characters.

**Illustrations, `src/components/illustrations/`:** all four (Plant, Lotus, Cairn, Fountain) stay mounted and cross-fade via `index.tsx`. They read `progress`, which is `Run.hi`, a high-water mark.

**Caret:** `hooks/useCaret.ts` positions a `[data-caret]` element over the `[data-cur="1"]` character from measured DOM geometry in a layout effect, and restarts the blink on each keystroke.

**Styles:** `styles/organic.css` is the design-system tokens (Organic ramps, `--color-*`); `styles/app.css` is layout and the `.kk-*` classes, which reference `--kk-accent`, `--kk-deep`, etc. Colours must come from an Organic ramp step or a `--kk-*` variable, never a literal; new category palettes are derived in OKLCH at the same lightness steps.

## Invariants (from the README, enforced by design)

- Progress is high-water-marked: it counts every character typed, right or wrong, and never decreases. Backspace never reverses an illustration.
- Animations respond to progress, never speed. Only the summary reads wpm.
- Typos are apricot (`th.bad`), not red; backspaces are "Corrections".
- The run finishes on the last character even with a typo standing, then blurs the input so a phone keyboard drops.
- Four design-review items listed under "Provenance" in the README are intentionally left as-is; do not "fix" them unprompted.

## Passages

Every entry in `passages.json` is either an excerpt (`author` + `work`, plus `translator` for translated text and `url` where verified; pre-1930 translations only) or original writing (`original: true`, a tradition tag, no author). The checker fails on: mixed or missing attribution, tags outside `TAGS`, unknown category keys, non-ASCII typographic characters (curly quotes, em dashes), text outside 50–250 chars, gendered words, duplicates. Warnings (short passages, pools under 30) do not fail.

To add a tag, add it to `TAGS` in `types.ts` only. To add passages in bulk, the `grow-passages` workflow in `.claude/workflows/` produces a result JSON that `node scripts/merge-passages.mjs <result.json>` appends; run `check:passages` afterwards.

## Deployment notes

`vite.config.ts` uses `base: './'` so the same build works at `/kindkeys/` and a domain root. GitHub Pages must be set to deploy from GitHub Actions, not a branch; `index.html` references `/src/main.tsx` and only Vite can resolve it.
