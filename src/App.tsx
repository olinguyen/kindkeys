import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AboutDialog } from './components/AboutDialog';
import { CategoryPills } from './components/CategoryPills';
import { Compose } from './components/Compose';
import { InfoIcon, PencilIcon, RotateIcon, ShuffleIcon } from './components/Icons';
import { Illustrations, type DustMote } from './components/illustrations';
import { Passage } from './components/Passage';
import { ProgressRing } from './components/ProgressRing';
import { SourceRow } from './components/SourceRow';
import { Summary } from './components/Summary';
import { CATS, MAX_CHARS, ORD, today, type CatId, type Passage as PassageData } from './data/categories';
import { useMediaQuery } from './hooks/useMediaQuery';
import { loadReps, repKey, saveReps, type Reps } from './lib/reps';
import { ROCKS, rockGeom } from './lib/geometry';
import { buildRun, emptyRun, type Run } from './lib/typing';

/** Below this the phone layout takes over: illustration above the passage. */
const MOBILE = '(max-width: 860px)';

/** A real on-screen keyboard, as opposed to a narrow desktop window. */
const TOUCH = '(pointer: coarse)';

/** A passage longer than this drops a type size so the card still fits. */
const LONG_PASSAGE = 225;

interface Spark {
  id: number;
  x: number;
  y: number;
  s: number;
  dx: number;
  dur: number;
  delay: number;
  col: string;
}

export default function App() {
  const compact = useMediaQuery(MOBILE);
  const touch = useMediaQuery(TOUCH);
  const day = useMemo(today, []);

  const [catId, setCatId] = useState<CatId>('kind');
  const [passageIndex, setPassageIndex] = useState<Partial<Record<CatId, number>>>({});
  const [runs, setRuns] = useState<Record<string, Run>>({});
  const [about, setAbout] = useState(false);
  const [focused, setFocused] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [reps, setReps] = useState<Reps>(loadReps);

  // "Your own"
  const [draft, setDraft] = useState('');
  const [customText, setCustomText] = useState('');
  const [customVersion, setCustomVersion] = useState(0);
  const [composing, setComposing] = useState(true);

  // Transient motion
  const [sparks, setSparks] = useState<Spark[]>([]);
  const [dust, setDust] = useState<DustMote[]>([]);
  const [thuds, setThuds] = useState(0);
  const [resetToken, setResetToken] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const particleId = useRef(0);
  const prevDoneWords = useRef(0);
  const prevLanded = useRef(0);
  // A phone should not raise its keyboard on arrival, and iOS would refuse to
  // anyway — so on small screens the field takes focus only after a gesture.
  const interacted = useRef(false);

  const cat = CATS.find((c) => c.id === catId)!;
  const th = cat.th;
  const offset = passageIndex[catId] ?? 0;

  const passage: PassageData = cat.custom
    ? { text: customText, original: true, custom: true, tags: [] }
    : cat.passages[(day + offset) % cat.passages.length];
  const text = passage.text;

  // Runs are kept per passage, so leaving a category and coming back resumes it.
  const runKey = cat.custom ? `custom:${customVersion}` : `${catId}:${offset}`;
  const run = runs[runKey] ?? emptyRun;

  const build = buildRun(text, run, th, now);
  const reading = !cat.custom || !composing;
  const repeats = reps[repKey(text)] ?? 0;

  /* ── Clock ─────────────────────────────────────────────────────── */

  useEffect(() => {
    if (!run.start || run.end) return;
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, [run.start, run.end]);

  /* ── Focus ─────────────────────────────────────────────────────── */

  const focusInput = useCallback(() => {
    if (about || (cat.custom && composing) || run.end) return;
    const el = inputRef.current;
    if (el && document.activeElement !== el) el.focus({ preventScroll: true });
  }, [about, cat.custom, composing, run.end]);

  // On load, on category switch, after "Try another", after closing About and
  // after saving a custom passage — the caret is live without a click.
  useEffect(() => {
    if (compact && !interacted.current) return;
    focusInput();
  }, [compact, catId, runKey, about, composing, focusInput]);

  /* ── Word sparks ───────────────────────────────────────────────── */

  const spark = useCallback(
    (wordIndex: number) => {
      const stage = stageRef.current;
      const word = stage?.querySelector<HTMLElement>(`[data-word="${wordIndex}"]`);
      if (!stage || !word) return;
      const r = word.getBoundingClientRect();
      const s = stage.getBoundingClientRect();
      const cx = r.left - s.left + r.width / 2;
      const cy = r.top - s.top;
      const cols = th.sparks;
      const born: Spark[] = [];
      for (let k = 0; k < 3; k++) {
        const id = ++particleId.current;
        born.push({
          id,
          x: cx + (Math.random() - 0.5) * r.width * 0.8,
          y: cy + 6,
          s: 8 + Math.random() * 10,
          dx: (Math.random() - 0.5) * 60,
          dur: 1.1 + Math.random() * 0.6,
          delay: k * 0.08,
          col: cols[k],
        });
        setTimeout(() => setSparks((prev) => prev.filter((p) => p.id !== id)), 2000);
      }
      setSparks((prev) => [...prev, ...born]);
    },
    [th.sparks],
  );

  useEffect(() => {
    if (build.doneWords > prevDoneWords.current) spark(build.doneWords - 1);
    prevDoneWords.current = build.doneWords;
  });

  /* ── A stone touching down ─────────────────────────────────────── */

  const landed = catId === 'persp' ? (build.doneAll ? ROCKS.length : Math.min(ROCKS.length - 1, Math.floor(build.hi * ROCKS.length + 1e-6))) : 0;

  useEffect(() => {
    if (landed > prevLanded.current && prevLanded.current >= 0) {
      const r = rockGeom()[landed - 1];
      if (r) {
        const born: DustMote[] = [];
        for (let k = 0; k < 6; k++) {
          const id = ++particleId.current;
          const side = k % 2 ? 1 : -1;
          born.push({
            id,
            x: r.cx + side * (r.w / 2 - 6 + Math.random() * 8),
            y: r.cy + r.h / 2 - 3,
            s: 3 + Math.random() * 3.5,
            dx: side * (14 + Math.random() * 22),
            dy: -(6 + Math.random() * 16),
            dur: 0.7 + Math.random() * 0.4,
          });
          setTimeout(() => setDust((prev) => prev.filter((d) => d.id !== id)), 1300);
        }
        setDust((prev) => [...prev, ...born]);
        setThuds((t) => t + 1);
      }
    }
    prevLanded.current = landed;
  }, [landed]);

  /* ── Typing ────────────────────────────────────────────────────── */

  const bumpReps = useCallback(() => {
    const k = repKey(text);
    const next = { ...reps, [k]: (reps[k] ?? 0) + 1 };
    saveReps(next);
    setReps(next);
  }, [reps, text]);

  const onType = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (run.end) return;
    const value = e.target.value.slice(0, text.length);
    const finished = value.length >= text.length && text.length > 0;

    setRuns((prev) => ({
      ...prev,
      [runKey]: {
        typed: value,
        start: run.start || (value.length ? Date.now() : 0),
        end: finished ? Date.now() : 0,
        // A backspace is a correction, not a penalty.
        fix: value.length < run.typed.length ? run.fix + 1 : run.fix,
        // Completion counts every character typed, right or wrong, and never falls.
        hi: Math.max(run.hi, value.length / text.length),
      },
    }));
    setNow(Date.now());

    if (finished) {
      // Drop focus so a phone keyboard dismisses and the summary is visible.
      e.target.blur();
      bumpReps();
    }
  };

  /* ── Actions ───────────────────────────────────────────────────── */

  const onPickCategory = (id: CatId) => {
    interacted.current = true;
    prevDoneWords.current = 0;
    prevLanded.current = -1;
    setCatId(id);
  };

  const onNext = () => {
    interacted.current = true;
    prevDoneWords.current = 0;
    prevLanded.current = -1;
    setPassageIndex((prev) => ({ ...prev, [catId]: (prev[catId] ?? 0) + 1 }));
  };

  const onReset = () => {
    interacted.current = true;
    prevDoneWords.current = 0;
    prevLanded.current = 0;
    setRuns((prev) => ({ ...prev, [runKey]: { ...emptyRun } }));
    setThuds(0);
    setDust([]);
    setResetToken((t) => t + 1);
    setNow(Date.now());
    inputRef.current?.focus({ preventScroll: true });
  };

  const onDraft = (v: string) => {
    const t = v.replace(/\s+/g, ' ').trimStart();
    setDraft(t.length > MAX_CHARS ? t.slice(0, MAX_CHARS) : t);
  };

  const onSaveCustom = () => {
    const t = draft.trim();
    if (!t) return;
    interacted.current = true;
    prevDoneWords.current = 0;
    setCustomText(t);
    setCustomVersion((v) => v + 1);
    setComposing(false);
  };

  const onEditCustom = () => {
    setDraft(customText);
    setComposing(true);
  };

  /* ── Derived view state ────────────────────────────────────────── */

  // While the phone keyboard is up the illustration and text shrink so both
  // stay above the keys; on completion the input blurs and they grow back. A
  // narrow desktop window has no keyboard to make room for, so it keeps both.
  const keyboardUp = compact && touch && focused && !build.doneAll && reading;
  const longPassage = text.length > LONG_PASSAGE;
  const passageSize = compact
    ? keyboardUp
      ? longPassage
        ? '16px'
        : '17px'
      : longPassage
        ? '18px'
        : '20px'
    : longPassage
      ? '26px'
      : '30px';

  const canStartOver = run.typed.length > 0 && !build.doneAll && reading;
  const subline =
    build.doneAll && repeats > 1
      ? ORD[repeats]
        ? `${ORD[repeats][0].toUpperCase()}${ORD[repeats].slice(1)} time with these words.`
        : `${repeats} times with these words.`
      : cat.doneSub;

  useEffect(() => {
    document.body.style.background = th.bg;
  }, [th.bg]);

  /* ── Pieces shared by both layouts ─────────────────────────────── */

  const illustrations = (
    <Illustrations
      catId={catId}
      progress={build.hi}
      done={build.doneAll}
      started={build.started}
      th={th}
      dust={dust}
      thuds={thuds}
      resetToken={resetToken}
      style={
        compact
          ? { position: 'relative', height: '100%', aspectRatio: '118 / 200' }
          : { position: 'absolute', right: 60, bottom: 0, width: 260, height: 440 }
      }
    />
  );

  const passageBlock = reading ? (
    <Passage
      words={build.words}
      th={th}
      fontSize={passageSize}
      caretHeight={compact ? 28 : 40}
      typed={run.typed}
      focused={focused}
      started={build.started}
      hidden={false}
      inputRef={inputRef}
      onType={onType}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  ) : null;

  const startOver = (
    <button
      type="button"
      className="btn btn-ghost"
      onClick={(e) => {
        e.stopPropagation();
        onReset();
      }}
      tabIndex={canStartOver ? 0 : -1}
      aria-hidden={!canStartOver}
      style={{
        fontFamily: 'var(--font-body)',
        fontWeight: 600,
        fontSize: compact ? 12 : undefined,
        whiteSpace: 'nowrap',
        flex: 'none',
        color: th.deep,
        opacity: canStartOver ? 1 : 0,
        pointerEvents: canStartOver ? 'auto' : 'none',
        transition: 'opacity .25s,background .2s',
      }}
    >
      <RotateIcon size={compact ? 13 : 14} />
      Start over
    </button>
  );

  const sourceAction = cat.custom ? (
    <button
      type="button"
      className="btn btn-ghost"
      onClick={(e) => {
        e.stopPropagation();
        onEditCustom();
      }}
      style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12, padding: '3px 8px', color: th.deep, whiteSpace: 'nowrap' }}
    >
      <PencilIcon />
      Edit passage
    </button>
  ) : (
    <button
      type="button"
      className="btn btn-ghost"
      onClick={(e) => {
        e.stopPropagation();
        onNext();
      }}
      style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12, padding: '3px 8px', color: th.deep, whiteSpace: 'nowrap' }}
    >
      <ShuffleIcon />
      Try another
    </button>
  );

  const summary = (
    <Summary cat={cat} build={build} fix={run.fix} reps={repeats} subline={subline} onAgain={onReset} compact={compact} />
  );

  const onStageClick = () => {
    interacted.current = true;
    if (about || (cat.custom && composing)) return;
    inputRef.current?.focus();
  };

  const pageStyle = {
    background: th.bg,
    '--kk-accent': th.accent,
    '--kk-deep': th.deep,
  } as React.CSSProperties;

  /* ── Phone ─────────────────────────────────────────────────────── */

  if (compact) {
    return (
      <div className="kk-page" style={pageStyle}>
        <div ref={stageRef} className="kk-stage" onClick={onStageClick}>
          <div className="kk-sparks">
            {sparks.map((p) => (
              <SparkDot key={p.id} spark={p} />
            ))}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 'calc(env(safe-area-inset-top, 0px) + 18px) 20px 0',
            }}
          >
            <div className="kk-brand" style={{ fontSize: 20 }}>
              <span>Kind</span>
              <span style={{ color: `color-mix(in oklch, ${th.accent} 80%, var(--color-text))` }}>Keys</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                type="button"
                className="btn btn-ghost btn-icon"
                aria-label="Why type this?"
                onClick={(e) => {
                  e.stopPropagation();
                  setAbout(true);
                }}
                style={{ color: th.deep }}
              >
                <InfoIcon size={18} />
              </button>
              <ProgressRing progress={build.hi} th={th} size={40} />
            </div>
          </div>

          <CategoryPills active={catId} th={th} onPick={onPickCategory} compact />

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '8px 24px 0', position: 'relative', minHeight: 0, overflow: 'hidden' }}>
            {reading && (
              <div
                style={{
                  height: keyboardUp ? 104 : 200,
                  display: 'flex',
                  justifyContent: 'center',
                  pointerEvents: 'none',
                  transition: 'height .35s cubic-bezier(.2,.8,.2,1)',
                }}
              >
                {illustrations}
              </div>
            )}

            <div style={{ position: 'relative', marginTop: 14 }}>
              {!reading ? (
                <Compose draft={draft} onDraft={onDraft} onSave={onSaveCustom} th={th} compact />
              ) : (
                <>
                  {passageBlock}
                  <SourceRow passage={passage} th={th} isDaily={offset === 0} compact />
                </>
              )}
            </div>

            {reading && build.doneAll && (
              <div
                style={{
                  position: 'relative',
                  marginTop: 10,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  padding: '16px 18px',
                  borderRadius: 'var(--radius-lg)',
                  background: th.soft,
                  transition: 'opacity .45s,transform .45s cubic-bezier(.2,.8,.2,1),background .5s',
                }}
              >
                {summary}
              </div>
            )}
          </div>

          <div
            style={{
              display: keyboardUp ? 'none' : 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
              padding: '10px 20px calc(env(safe-area-inset-bottom, 0px) + 20px)',
              fontSize: 12,
              color: 'var(--color-neutral-700)',
              position: 'relative',
            }}
          >
            {reading ? sourceAction : <span />}
            {startOver}
          </div>
        </div>
        {about && <AboutDialog th={th} onClose={() => setAbout(false)} />}
      </div>
    );
  }

  /* ── Desktop ───────────────────────────────────────────────────── */

  return (
    <div className="kk-page" style={pageStyle}>
      <div ref={stageRef} className="kk-stage" onClick={onStageClick}>
        <div className="kk-sparks">
          {sparks.map((p) => (
            <SparkDot key={p.id} spark={p} />
          ))}
        </div>

        <div className="nav" style={{ padding: '22px 40px', position: 'relative', gap: 22 }}>
          <div className="kk-brand" style={{ fontSize: 22 }}>
            <span>Kind</span>
            <span style={{ color: `color-mix(in oklch, ${th.accent} 80%, var(--color-text))` }}>Keys</span>
          </div>
          <CategoryPills active={catId} th={th} onPick={onPickCategory} compact={false} />
          <button
            type="button"
            className="btn btn-ghost"
            onClick={(e) => {
              e.stopPropagation();
              setAbout(true);
            }}
            style={{ fontFamily: 'var(--font-body)', fontWeight: 600, whiteSpace: 'nowrap', flex: 'none', color: th.deep }}
          >
            <InfoIcon />
            Why type this?
          </button>
          <ProgressRing progress={build.hi} th={th} size={52} label={build.doneAll ? `${Math.round(parseFloat(build.sec))}s` : ''} />
        </div>

        {illustrations}

        <div style={{ flex: 1, display: 'grid', placeItems: 'center', padding: '40px 340px 0 100px', position: 'relative', minHeight: 0 }}>
          <div style={{ position: 'relative', width: '100%' }}>
            {!reading ? (
              <Compose draft={draft} onDraft={onDraft} onSave={onSaveCustom} th={th} compact={false} />
            ) : (
              <>
                {passageBlock}
                <SourceRow passage={passage} th={th} isDaily={offset === 0} compact={false} action={sourceAction} />
                <div style={{ position: 'relative', marginTop: 18, minHeight: 140, pointerEvents: 'none' }}>
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      right: 0,
                      zIndex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 14,
                      padding: '18px 22px 16px',
                      borderRadius: 'var(--radius-lg)',
                      background: th.soft,
                      opacity: build.doneAll ? 1 : 0,
                      transform: `translateY(${build.doneAll ? 0 : 10}px)`,
                      pointerEvents: build.doneAll ? 'auto' : 'none',
                      visibility: build.doneAll ? 'visible' : 'hidden',
                      transition: 'opacity .45s,transform .45s cubic-bezier(.2,.8,.2,1),background .5s,visibility .45s',
                    }}
                    aria-hidden={!build.doneAll}
                  >
                    {summary}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '0 40px 26px', fontSize: 13, color: 'var(--color-neutral-700)', position: 'relative' }}>
          <span>Backspace is allowed. There is no score to beat.</span>
          {startOver}
        </div>
      </div>
      {about && <AboutDialog th={th} onClose={() => setAbout(false)} />}
    </div>
  );
}

function SparkDot({ spark }: { spark: Spark }) {
  return (
    <span
      className="kk-spark"
      style={
        {
          left: spark.x - spark.s / 2,
          top: spark.y - spark.s / 2,
          width: spark.s,
          height: spark.s,
          background: spark.col,
          '--dx': `${spark.dx}px`,
          animation: `kk-rise ${spark.dur}s cubic-bezier(.2,.6,.3,1) ${spark.delay}s both`,
        } as React.CSSProperties
      }
    />
  );
}
