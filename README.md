# Kindkeys

A one-minute typing practice built around a passage worth sitting with. There is
no score to beat — the illustration beside the text grows with how far through
the passage you are, and finishing it is the whole event.

Four categories, each with its own palette and its own illustration:

| Category | What it holds | What grows |
| --- | --- | --- |
| **Kindness** | Self-worth, patience, rest, self-compassion | A stem draws upward, leaves unfurl, a flower opens on the last character |
| **Presence** | Mindfulness, breath, noticing ordinary things | A lotus on a still pool, twelve petals unfolding outer-to-inner |
| **Perspective** | Balance, change, what is and isn't yours to control | Ten stones fall in slow motion and settle into a cairn |
| **Your own** | Up to 250 characters you write yourself | A bamboo shishi-odoshi fills and pours into a stone basin |

Excerpts carry their author and work (Seneca, Marcus Aurelius, Epictetus);
original tradition-inspired writing is labelled as such and tagged with the
tradition it draws on.

## Running it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + production bundle into dist/
npm run preview    # serve the built bundle
```

React 18 + TypeScript on Vite. No backend — the only thing that persists is how
many times you've typed each passage, kept in `localStorage`.

## Deploying

Pushing to `main` builds the site and publishes it to GitHub Pages via
`.github/workflows/deploy.yml`.

**Pages must be set to build from a workflow:** Settings → Pages → Source →
*GitHub Actions*. Pointing Pages at a branch instead publishes this repo's
source, where `index.html` still references the dev entry `/src/main.tsx` that
only Vite can resolve — the page loads blank.

The build uses a relative `base`, so asset URLs resolve against whatever path
the page is served from. That covers the project path this is published at
(`/kindkeys/`) and a domain root equally, with nothing to keep in sync.

## How it fits together

```
src/
  App.tsx                    state, focus and the two layouts (desktop / phone)
  data/passages.json         the curated passages — the file to edit
  data/types.ts              passage/category shapes and the tag vocabulary
  data/categories.ts         the four categories: palettes and labels
  lib/typing.ts              one run of one passage → coloured words + stats
  lib/geometry.ts            deterministic shapes: stem curve, stone outlines, petals
  lib/fountain.ts            the bamboo fountain, animated per frame rather than per render
  lib/reps.ts                the persisted repeat counts
  hooks/useCaret.ts          places the caret from measured geometry
  components/                header, passage, source row, summary, tally, about
  components/illustrations/  Plant, Lotus, Cairn, Fountain
  styles/organic.css         the Organic design system's tokens and components
  styles/app.css             layout, keyframes, theme-scoped interaction states
```

A few rules hold across all of it, and are worth knowing before changing
anything:

- **Progress is high-water-marked.** Completion counts every character typed,
  right or wrong, and never falls. Backspacing never shrinks the stem, folds a
  petal or topples a stone.
- **Progress drives the animations, not speed.** Nothing reads words-per-minute
  except the summary.
- **Typos are apricot, not red**, and a backspace is reported as a correction,
  not a penalty.
- **Colour comes from tokens.** Every value is either an Organic ramp step or
  the active category's `--kk-*` variables. The Presence, Perspective and
  "Your own" palettes are derived in OKLCH at the same lightness steps as the
  Organic ramps.
- **The whole run finishes on the last character**, even with a typo still
  standing, and the field blurs so a phone keyboard drops and the summary shows.

## The passages

The prose lives in `src/data/passages.json`, apart from the palettes, so
reviewing it is reading passages rather than scrolling past colour values.

```bash
npm run check:passages
```

prints every passage with its length and typing time, then reports problems.
It runs on every pull request (`ci.yml`) and again before publishing
(`deploy.yml`), so a bad entry is caught on the PR rather than after merge.

**Errors fail CI** — an entry that is neither a credited excerpt nor marked
original, an excerpt missing its work, a tag outside the vocabulary in
`types.ts`, a category key that isn't one of the three ids, a character a plain
keyboard can't type (curly quotes, em dashes), text outside 60–250 characters,
or a duplicate. **Warnings don't
fail**; they are the standing to-do list.

Each passage is one of two things, and the check enforces the difference:

- **An excerpt** — `author` and `work`, plus `translator`. Modern translations
  are under copyright; pre-1930 editions (Long, Carter, Higginson, Stewart) are
  safe to quote and worth citing. Seneca (Stewart, 1889) and Epictetus (Carter,
  1758) are credited; the Marcus Aurelius passage still warns because its
  wording matches no public-domain edition.
- **Original writing** — `original: true` and a tradition tag, no author. It
  renders as "Original writing, inspired by". Keep genuinely borrowed wording
  out of these: a passage here previously opened with a line from *Tao Te Ching*
  33 while claiming to be original, which is the mistake this check exists to
  catch.

To add a tag, add it to `TAGS` in `src/data/types.ts` — TypeScript derives the
`Tag` union from that list and the checker reads it, so there is one place to
edit.

The day index picks each category's starting passage, so a small pool visibly
repeats: with three passages, "Today's intention" comes round every third day.
The checker warns below thirty.

## Layouts

One breakpoint, at 860px.

Above it, the desktop layout: passage on the left, illustration anchored bottom
right, summary sliding in beneath the source row.

Below it, the phone layout: the illustration moves above the passage. While the
on-screen keyboard is up (focus, on a coarse pointer) it shrinks to 104px and
the text drops a size so both stay above the keys; on completion the field
blurs, the keyboard drops and everything grows back with the summary.

## Provenance

Built from a Claude Design handoff — three design sessions' worth of iteration,
exported as an HTML prototype plus transcripts. The prototype is not in this
repo; this is a reimplementation of its final state, not a port of its
structure.

Four things the design's own final review flagged are **deliberately kept as the
design left them**, since they were raised and not applied:

1. The Perspective card sits on `--color-surface` rather than a warm-stone tint,
   so it is the one category whose ground isn't derived from its own accent.
2. The desktop summary says "Corrections" where the phone says "Fixes".
3. "about a minute of typing" under the custom passage box is static rather than
   computed from length.
4. Speed leads the summary, which sits a little oddly against "no score to beat".

Each is a one-line change if you want it the other way.
