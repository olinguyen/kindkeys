export const meta = {
  name: 'grow-passages',
  description: 'Source verified public-domain excerpts, or write original passages until they turn redundant, for Kindkeys',
  whenToUse: 'Run with args {mode: "excerpts"|"originals", existing: {kind:[...], pres:[...], persp:[...]}, round?: number}. Merge the result with scripts/merge-passages.mjs.',
  phases: [
    { title: 'Source', detail: 'one agent per source text, wording copied from an online public-domain edition' },
    { title: 'Write', detail: 'original passages, two angles per category per round' },
    { title: 'Check', detail: 'refetch every excerpt; score originals against the principles and all existing passages' },
  ],
}

// ---- inputs -------------------------------------------------------------
const mode = (args && args.mode) || 'excerpts'
const existing = (args && args.existing) || { kind: [], pres: [], persp: [] }
const startRound = (args && args.round) || 1
const MAX_ROUNDS = (args && args.maxRounds) || 3
// Stop writing originals when the editor keeps fewer than this share of a round.
const KEEP_FLOOR = 0.4

const CATS = [
  { id: 'kind', label: 'Kindness', brief: 'being gentler with yourself and others: self-worth, patience, rest, self-compassion, generosity, forgiveness', traditions: ['Stoicism', 'Buddhism', 'Self-compassion'] },
  { id: 'pres', label: 'Presence', brief: 'attention to this moment: breath, the body, noticing ordinary things, doing one thing at a time, not living in the future', traditions: ['Mindfulness', 'Buddhism', 'Daoism'] },
  { id: 'persp', label: 'Perspective', brief: 'stepping back, weighing what matters, accepting what you cannot control, letting plans change, wanting less', traditions: ['Stoicism', 'Daoism'] },
]
const TAGS = ['Self-compassion', 'Mindfulness', 'Stoicism', 'Buddhism', 'Daoism']

const existingBlock = (id) => (existing[id] || []).map((t) => `- ${t}`).join('\n') || '(none yet)'
const allExisting = CATS.map((c) => `${c.label}:\n${existingBlock(c.id)}`).join('\n\n')

const PRINCIPLES = `HOUSE PRINCIPLES
- Clear, simple, grounded language. Each sentence states one concrete, understandable idea.
- No "woo-woo", vague, overly poetic or wishy-washy phrasing. No mystical or cliched tradition-speak (no "the universe", "energy", "flow", "surrender", "the sacred", "let go and trust", no water-and-rock metaphors).
- End with a strong, practical thought the reader can act on today. Do NOT end with an abstract line about gentleness, softness, arriving, or holding difficult things.
- Typing app: plain printable ASCII only (straight quotes, hyphens, no em dashes, curly quotes or ellipsis characters). One space between sentences.
- Length 100-220 characters (about 30-60 seconds of unhurried typing). Hard cap 250.`

// Taste rules the first run applied by hand. Encoded so results merge without a manual pass.
const EXCERPT_RULES = `EXCERPT RULES
- Public domain only: translation (or English original) published before 1930. Never Robin Hard, Gregory Hays, Stephen Mitchell, Ursula Le Guin, Thomas Cleary, Martin Hammond, or any post-1930 translator.
- Copy the wording EXACTLY as printed at the url. Cut only at sentence boundaries. No ellipsis, no modernising, no silent fixes. The only permitted change is converting typographic quotes and dashes to plain ASCII.
- Reject archaic grammar: no "thee", "thou", "thy", "thine", "ye", "hath", "-eth" verb endings. (Long's Marcus Aurelius is full of these; take only his impersonal sentences, or use Gerald Rendall's 1898 translation, which uses "you".)
- Reject text containing parentheses, square brackets, or a quotation inside the quotation.
- Reject anything mystical, abstract, preachy, or that a modern reader could not act on. Prefer plain practical advice over famous lines.
- Length: 100-220 characters preferred; 60-100 only for a strong single sentence; hard cap 250.`

// ---- schemas ------------------------------------------------------------
const EXCERPT_SCHEMA = {
  type: 'object',
  properties: {
    excerpts: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          category: { type: 'string', enum: ['kind', 'pres', 'persp'] },
          text: { type: 'string' },
          author: { type: 'string' },
          work: { type: 'string', description: 'conventional English title plus book/section/verse, e.g. "Meditations, 4.3", "Letters to Lucilius, 15", "Tao Te Ching, 33"' },
          translator: { type: 'string', description: '"" for a work written in English' },
          year: { type: 'integer', description: 'year the translation or English original was published' },
          url: { type: 'string', description: 'the page the exact wording was read from' },
          tags: { type: 'array', items: { type: 'string', enum: TAGS } },
        },
        required: ['category', 'text', 'author', 'work', 'translator', 'year', 'url', 'tags'],
      },
    },
  },
  required: ['excerpts'],
}

const EXCERPT_VERDICTS = {
  type: 'object',
  properties: {
    verdicts: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          index: { type: 'integer' },
          exact: { type: 'boolean', description: 'true only if the text matches the fetched source word for word' },
          publicDomain: { type: 'boolean' },
          passesRules: { type: 'boolean', description: 'true only if every EXCERPT RULE and HOUSE PRINCIPLE holds' },
          correctedText: { type: 'string', description: 'if a one- or two-word fix makes it exact, the exact text; else ""' },
          note: { type: 'string' },
        },
        required: ['index', 'exact', 'publicDomain', 'passesRules', 'correctedText', 'note'],
      },
    },
  },
  required: ['verdicts'],
}

const ORIGINALS_SCHEMA = {
  type: 'object',
  properties: {
    passages: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          text: { type: 'string' },
          tags: { type: 'array', items: { type: 'string', enum: TAGS }, description: '1-2 traditions or practices the idea genuinely comes from' },
        },
        required: ['text', 'tags'],
      },
    },
  },
  required: ['passages'],
}

const ORIGINAL_VERDICTS = {
  type: 'object',
  properties: {
    verdicts: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          index: { type: 'integer' },
          keep: { type: 'boolean' },
          score: { type: 'integer', description: '1-5; keep only 4 or 5' },
          revised: { type: 'string', description: 'a light edit fixing one specific weakness, or "" to keep as written or reject' },
          note: { type: 'string', description: 'the specific weakness, quoting the offending words' },
        },
        required: ['index', 'keep', 'score', 'revised', 'note'],
      },
    },
  },
  required: ['verdicts'],
}

// ---- excerpts -----------------------------------------------------------
const SOURCES = [
  { key: 'marcus', where: 'Marcus Aurelius, Meditations. George Long (1862) at classics.mit.edu/Antoninus/meditations.N.book.html (one page per book, e.g. meditations.4.four.html) - most sentences use "thou", so take only impersonal ones. Also try Gerald Rendall, "Marcus Aurelius Antoninus to Himself" (1898), which uses "you", on wikisource or archive.org.' },
  { key: 'epictetus', where: 'Epictetus. Enchiridion tr. Elizabeth Carter (1758) at classics.mit.edu/Epictetus/epicench.html; Discourses tr. George Long (1877) at classics.mit.edu/Epictetus/discourses.html or Thomas Wentworth Higginson (1865) on wikisource.' },
  { key: 'seneca-letters', where: 'Seneca, Moral letters to Lucilius tr. Richard Mott Gummere (Loeb 1917-1925), on wikisource: en.wikisource.org/wiki/Moral_letters_to_Lucilius/Letter_N. Sweep widely: letters 1-30, 40-60, 70-90.' },
  { key: 'seneca-dialogues', where: 'Seneca, Minor Dialogues tr. Aubrey Stewart (1889), on wikisource: "Of Peace of Mind", "Of a Happy Life", "On the Shortness of Life", "Of Anger", "Of Consolation: To Helvia", "Of Benefits".' },
  { key: 'daoist', where: 'Tao Te Ching tr. James Legge (1891) at en.wikisource.org/wiki/Tao_Teh_King; Chuang Tzu (Zhuangzi) tr. James Legge (1891) at sacred-texts.com/tao/sbe39/ and sbe40/. Legge inserts parentheses often - skip those sentences.' },
  { key: 'buddhist', where: 'Dhammapada tr. F. Max Muller (1881) at gutenberg.org/cache/epub/2017/pg2017.txt; Sutta-Nipata tr. V. Fausboll (1881) at sacred-texts.com/bud/sbe10/; Buddhist Suttas tr. T. W. Rhys Davids (1881) at sacred-texts.com/bud/sbe11/.' },
  { key: 'american', where: 'Henry David Thoreau, Walden (1854) and journals, gutenberg.org/cache/epub/205/pg205.txt; Ralph Waldo Emerson, Essays (1841, 1844) and "Self-Reliance", on gutenberg or wikisource. English originals: translator is "".' },
  { key: 'other', where: 'Montaigne, Essays tr. Charles Cotton (1685, Hazlitt ed. 1877) on gutenberg; Epicurus, Principal Doctrines and Vatican Sayings tr. Cyril Bailey (1926) on wikisource or epicurus.net; Boethius, Consolation of Philosophy tr. H. R. James (1897) on gutenberg; Plutarch, Moralia (Goodwin ed. 1878) on perseus.tufts.edu.' },
]

const sourcePrompt = (s) => `You are sourcing short excerpts for a calm typing app with three categories:
${CATS.map((c) => `- ${c.id} "${c.label}": ${c.brief}`).join('\n')}

Your source set: ${s.where}

Find as many excerpts as you can, up to 12, from THIS source set only, and assign each to the category it fits best. Use WebFetch to open the page and copy the wording exactly; never quote from memory. Sweep broadly rather than taking the most famous lines.

${EXCERPT_RULES}

${PRINCIPLES}

Exclude anything already used:
${allExisting}

Tag each with 1-2 of ${TAGS.join(', ')} for the tradition of the source (Thoreau, Emerson, Montaigne: use Mindfulness or Stoicism as fits). Return only excerpts you actually fetched and read, with the url you read them from.`

const verifyExcerptsPrompt = (c, list) => `Adversarially verify these candidate excerpts for the "${c.label}" category of a typing app. For EACH, use WebFetch on its url (or another reliable online edition of the same translator if that fails) and compare word for word. A changed word, dropped clause, modernised pronoun, or a cut mid-sentence means exact=false. Confirm the translator and year; publicDomain=true only for pre-1930 publication or an English original. passesRules=false if any rule below fails, including archaic pronouns, parentheses, nested quotes, or wording that is mystical or not actionable. If a one- or two-word fix makes the text exact, put the exact text in correctedText.

${EXCERPT_RULES}

${PRINCIPLES}

${JSON.stringify(list.map((e, i) => ({ index: i, ...e })), null, 2)}`

async function runExcerpts() {
  phase('Source')
  const found = (await parallel(SOURCES.map((s) => () => agent(sourcePrompt(s), { label: `source:${s.key}`, phase: 'Source', schema: EXCERPT_SCHEMA })))).filter(Boolean).flatMap((r) => r.excerpts || [])
  // Barrier is deliberate: dedup across sources by text before paying for verification.
  const seen = new Set(Object.values(existing).flat())
  const fresh = found.filter((e) => e && e.text && !seen.has(e.text) && (seen.add(e.text), true))
  log(`Source: ${found.length} candidates, ${fresh.length} after dedup`)

  return pipeline(
    CATS,
    (c) => {
      const list = fresh.filter((e) => e.category === c.id)
      return list.length ? agent(verifyExcerptsPrompt(c, list), { label: `verify:${c.id}`, phase: 'Check', schema: EXCERPT_VERDICTS }).then((v) => ({ list, v })) : { list, v: { verdicts: [] } }
    },
    ({ list, v }, c) => {
      const verdicts = (v && v.verdicts) || []
      const kept = list.map((e, i) => {
        const x = verdicts.find((y) => y.index === i)
        if (!x || !x.publicDomain || !x.passesRules) return null
        const text = x.exact ? e.text : x.correctedText || null
        return text ? { ...e, text } : null
      }).filter(Boolean)
      const rejected = list.map((e, i) => ({ e, x: verdicts.find((y) => y.index === i) }))
        .filter(({ e }) => !kept.some((k) => k.work === e.work && k.url === e.url))
        .map(({ e, x }) => ({ work: e.work, text: e.text, note: x ? x.note : 'no verdict' }))
      log(`${c.label}: kept ${kept.length}/${list.length} excerpts`)
      return { id: c.id, excerpts: kept, originals: [], rejected: { excerpts: rejected, originals: [] } }
    },
  )
}

// ---- originals ----------------------------------------------------------
const ANGLES = [
  'a workday: email, meetings, deadlines, colleagues',
  'home and family: chores, children, partners, ageing parents',
  'the body: tiredness, illness, exercise, food, sleep',
  'money and possessions: bills, buying, wanting, enough',
  'waiting and delays: queues, traffic, replies that have not come',
  'arguments and criticism: being blamed, being wrong, disagreeing',
  'evenings and weekends: rest, screens, boredom, unplanned time',
  'starting something hard: procrastination, first steps, practice',
  'other people: strangers, neighbours, service workers, small courtesies',
  'endings: finishing, quitting, losing, saying no',
  'comparison: other people\'s lives, social media, envy',
  'the mind itself: rumination, worry loops, replaying conversations',
]

const writePrompt = (c, angle, round, i) => `Write 8 original passages for "${c.label}", a category in a calm typing app people return to each morning. The category is about ${c.brief}. Situations for this batch: ${angle}.

${PRINCIPLES}

Voice: first person or plain second person, present tense, the tone of a level-headed friend. Vary sentence rhythm and structure across the eight; do not end every passage with "pick one thing" or "start there". Draw on ${c.traditions.join(', ')} as ideas, not as vocabulary. Tag each with 1-2 of those where the idea genuinely comes from that tradition.

Do not repeat the ideas, images, openings or endings of the passages already in this category:
${existingBlock(c.id)}

Round ${round}, batch ${i + 1}. Return only the passages.`

const critiquePrompt = (c, list) => `You are a strict editor for a calm typing app. Judge each new original passage for the "${c.label}" category (${c.brief}) against the principles; score 1-5 and keep only 4 or 5.

${PRINCIPLES}

Reject for: vague or wishy-washy sentences, poetic abstraction, tradition cliches, an ending that is not a concrete practical thought, wording that echoes a famous quotation, any non-ASCII character, length outside 100-220, or being too close to another passage - in this batch OR in the existing list below - in idea, image, opening, or ending. Redundancy with the existing list is the main thing to catch now; the pool is growing and sameness is the risk. Where one small edit fixes the only weakness, supply the full revised text. Quote the offending words in note.

Existing passages in this category:
${existingBlock(c.id)}

New passages:
${JSON.stringify(list.map((p, i) => ({ index: i, ...p })), null, 2)}`

async function runOriginals() {
  const out = Object.fromEntries(CATS.map((c) => [c.id, { id: c.id, excerpts: [], originals: [], rejected: { excerpts: [], originals: [] } }]))
  let round = startRound
  for (let r = 0; r < MAX_ROUNDS; r++, round++) {
    // Each category gets its own pair of angles. Sharing angles across
    // categories produced the same scene three times (the same bill, the same
    // dishwasher) with no critic in a position to notice.
    const anglesFor = (ci) => [0, 1].map((k) => ANGLES[(round * 6 - 6 + ci * 2 + k) % ANGLES.length])
    log(`Round ${round}: ${CATS.map((c, ci) => `${c.label}: ${anglesFor(ci).join(' / ')}`).join(' | ')}`)
    const results = await pipeline(
      CATS,
      (c) => parallel(anglesFor(CATS.indexOf(c)).map((a, i) => () => agent(writePrompt(c, a, round, i), { label: `write:${c.id}:r${round}${i ? 'b' : 'a'}`, phase: 'Write', schema: ORIGINALS_SCHEMA }))),
      (batches, c) => {
        const list = batches.filter(Boolean).flatMap((b) => b.passages || [])
        return list.length ? agent(critiquePrompt(c, list), { label: `critique:${c.id}:r${round}`, phase: 'Check', schema: ORIGINAL_VERDICTS }).then((v) => ({ list, v })) : { list, v: { verdicts: [] } }
      },
      ({ list, v }, c) => {
        const verdicts = (v && v.verdicts) || []
        const kept = []
        list.forEach((p, i) => {
          const x = verdicts.find((y) => y.index === i)
          if (x && x.keep) kept.push({ text: x.revised || p.text, tags: p.tags, score: x.score, note: x.note })
          else out[c.id].rejected.originals.push({ text: p.text, note: x ? x.note : 'no verdict' })
        })
        // Later rounds and later critics see these as existing.
        existing[c.id] = [...(existing[c.id] || []), ...kept.map((k) => k.text)]
        out[c.id].originals.push(...kept)
        log(`${c.label} round ${round}: kept ${kept.length}/${list.length}`)
        return { kept: kept.length, total: list.length }
      },
    )
    const kept = results.filter(Boolean).reduce((n, x) => n + x.kept, 0)
    const total = results.filter(Boolean).reduce((n, x) => n + x.total, 0)
    if (total && kept / total < KEEP_FLOOR) {
      log(`Round ${round} kept ${kept}/${total} (${Math.round((kept / total) * 100)}%), below the ${KEEP_FLOOR * 100}% floor - stopping: the pool is turning redundant`)
      break
    }
  }
  return Object.values(out)
}

return mode === 'originals' ? runOriginals() : runExcerpts()
