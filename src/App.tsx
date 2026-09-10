import { useCallback, useEffect, useRef, useState } from 'react';
import { AboutDialog } from './components/AboutDialog';
import { CategoryPills } from './components/CategoryPills';
import { Compose } from './components/Compose';
import { InfoIcon, PencilIcon, RotateIcon, ShuffleIcon } from './components/Icons';
import { Illustrations, type DustMote } from './components/illustrations';
import { Passage } from './components/Passage';
import { ProgressRing } from './components/ProgressRing';
import { SourceRow } from './components/SourceRow';
import { Summary } from './components/Summary';
import { CATS, MAX_CHARS, ORD, type CatId, type Passage as PassageData } from './data/categories';
import { dailyIndex, today } from './lib/daily';
import { useMediaQuery } from './hooks/useMediaQuery';
import { loadReps, repKey, saveReps, type Reps } from './lib/reps';
import { ROCKS, rockGeom } from './lib/geometry';
import { buildRun, emptyRun, type Run } from './lib/typing';

/** Below this the phone layout takes over: illustration above the passage. */
const MOBILE = '(max-width: 860px)';

/** A real on-screen keyboard, as opposed to a narrow desktop window. */
const TOUCH = '(pointer: coarse)';

/** Height kept under the source row on desktop for the summary card, so its arrival moves nothing. */
const SUMMARY_SLOT = 156;

/** The small ghost buttons that share the source row. */
const ROW_BTN: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontWeight: 600,
  fontSize: 12,
  padding: '3px 8px',
  whiteSpace: 'nowrap',
};

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
  // The day turns over at local midnight. A tab left open is caught up on the
  // next focus or visibility change — but never under a run in progress.
  const [day, setDay] = useState(today);
  const [pendingDay, setPendingDay] = useState<number | null>(null);

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
    : cat.passages[dailyIndex(cat.passages.length, day, offset)];
  const text = passage.text;

  // Runs are kept per passage, so leaving a category and coming back resumes it.
  const runKey = cat.custom ? `custom:${customVersion}` : `${catId}:${day}:${offset}`;
  const run = runs[runKey] ?? emptyRun;

  const build = buildRun(text, run, th, now);

  useEffect(() => {
    const check = () => {
      const d = today();
      if (d !== day) setPendingDay(d);
    };
    document.addEventListener('visibilitychange', check);
    window.addEventListener('focus', check);
    return () => {
      document.removeEventListener('visibilitychange', check);
      window.removeEventListener('focus', check);
    };
  }, [day]);

  // Apply a new day once nothing has been typed on the current passage. A run
  // mid-way (or its summary) stays put; "Try another" then lands on today's.
  const runUntouched = run.typed.length === 0;
  useEffect(() => {
    if (pendingDay === null || !runUntouched) return;
    prevDoneWords.current = 0;
    prevLanded.current = -1;
    setDay(pendingDay);
    setPendingDay(null);
    setPassageIndex({});
  }, [pendingDay, runUntouched]);
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

  // On load, after closing About and after saving a custom passage — the caret
  // is live without a click. Buttons that change the passage also focus
  // synchronously inside their own click (see `refocus`), because iOS only
  // honours a programmatic focus while a gesture is still on the stack.
  useEffect(() => {
    if (compact && !interacted.current) return;
    focusInput();
  }, [compact, catId, runKey, about, composing, focusInput]);

  /**
   * Focus the input from inside a click handler. `id` is the category the
   * click is switching to, so the keyboard is not raised for a passage that
   * cannot be typed: a finished run, or a custom passage still being written.
   */
  const refocus = (id: CatId = catId, nextOffset = passageIndex[id] ?? 0) => {
    if (about) return;
    const target = CATS.find((c) => c.id === id)!;
    const key = target.custom ? `custom:${customVersion}` : `${id}:${day}:${nextOffset}`;
    if ((target.custom && composing) || runs[key]?.end) return;
    inputRef.current?.focus({ preventScroll: true });
  };

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
    refocus(id);
  };

  const onNext = () => {
    interacted.current = true;
    prevDoneWords.current = 0;
    prevLanded.current = -1;
    if (pendingDay !== null) {
      // The day turned over during this run: "another" is today's own passage.
      setDay(pendingDay);
      setPendingDay(null);
      setPassageIndex({});
      refocus(catId, 0);
      return;
    }
    setPassageIndex((prev) => ({ ...prev, [catId]: (prev[catId] ?? 0) + 1 }));
    refocus(catId, offset + 1);
  };

  const onReset = useCallback(() => {
    interacted.current = true;
    prevDoneWords.current = 0;
    prevLanded.current = 0;
    setRuns((prev) => ({ ...prev, [runKey]: { ...emptyRun } }));
    setThuds(0);
    setDust([]);
    setResetToken((t) => t + 1);
    setNow(Date.now());
    inputRef.current?.focus({ preventScroll: true });
  }, [runKey]);

  // Once the passage is done the field has blurred, so Enter has nowhere to
  // go — it becomes "Once more". Only then: mid-run the key is just a typo.
  const done = build.doneAll && reading;
  useEffect(() => {
    if (!done || about) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || e.repeat || e.defaultPrevented) return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
      // A focused button or link already acts on Enter; don't act twice.
      if ((e.target as HTMLElement | null)?.closest?.('button, a, input, textarea')) return;
      e.preventDefault();
      onReset();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [done, about, onReset]);

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
      ? 'clamp(22px, 2.4cqw, 26px)'
      : 'clamp(24px, 2.8cqw, 30px)';

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

  // Ghost buttons on the stage act on the passage without taking focus from
  // it, so the caret never flickers off while the reader clicks around.
  const keepFocus = (e: React.MouseEvent) => e.preventDefault();

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
      // On desktop the illustration hangs off the right of the passage block
      // (passage, source row and summary slot, or the compose box) with its
      // ground line on the block's bottom edge, so the finished art stands
      // beside the text and the card rather than towering over them. It
      // scales down on short windows so the crown never reaches the nav.
      style={
        compact
          ? { position: 'relative', height: '100%', aspectRatio: '118 / 200' }
          : { position: 'absolute', right: -280, bottom: 0, height: 'clamp(280px, 50vh - 10px, 440px)', aspectRatio: '260 / 440' }
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
      // Leaves the flow entirely when unavailable so it never holds a blank
      // wrapped line in the source row; kk-fade-in covers its arrival.
      className="btn btn-ghost kk-fade-in"
      hidden={!canStartOver}
      onMouseDown={keepFocus}
      onClick={(e) => {
        e.stopPropagation();
        onReset();
      }}
      style={{
        ...ROW_BTN,
        // The phone footer keeps the button's full tap height; the desktop
        // footer gives it a touch more presence than the source-row buttons.
        padding: compact ? undefined : '5px 12px',
        fontSize: compact ? ROW_BTN.fontSize : 13,
        flex: 'none',
        color: th.deep,
        transition: 'background .2s',
      }}
    >
      <RotateIcon size={compact ? 13 : 15} />
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
      style={{ ...ROW_BTN, color: th.deep }}
    >
      <PencilIcon />
      Edit passage
    </button>
  ) : (
    <button
      type="button"
      className="btn btn-ghost"
      onMouseDown={keepFocus}
      onClick={(e) => {
        e.stopPropagation();
        onNext();
      }}
      style={{ ...ROW_BTN, color: th.deep }}
    >
      <ShuffleIcon />
      Try another
    </button>
  );

  const summary = (
    <Summary cat={cat} build={build} fix={run.fix} reps={repeats} subline={subline} onAgain={onReset} compact={compact} keyHint={!touch} />
  );

  const onStageClick = () => {
    interacted.current = true;
    refocus();
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
                  // Sized so the summary card still lands above the fold on a
                  // small phone; the art is drawn to read at this height.
                  height: keyboardUp ? 104 : 150,
                  display: 'flex',
                  justifyContent: 'center',
                  pointerEvents: 'none',
                  transition: 'height .35s cubic-bezier(.2,.8,.2,1)',
                }}
              >
                {illustrations}
              </div>
            )}

            <div style={{ position: 'relative', marginTop: 10 }}>
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
                  gap: 10,
                  padding: '14px 16px',
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
          <ProgressRing progress={build.hi} th={th} size={44} label={build.doneAll ? `${Math.round(parseFloat(build.sec))}s` : ''} />
        </div>

        {/* The right gutter holds the illustration; both it and the measure
            give a little below the stage's full width so the passage keeps a
            readable line. Sizes are in cqw, so they track the stage, not the
            viewport. The summary slot is part of the centred block, which
            would leave the visible band high on tall windows; extra top
            padding brings the band down toward the middle, and ramps away
            on short windows. */}
        <div
          style={{
            flex: 1,
            display: 'grid',
            placeItems: 'center',
            padding: `calc(40px + clamp(0px, (100vh - 760px) * 0.65, ${(SUMMARY_SLOT + 18) / 2}px)) clamp(300px, 31cqw, 340px) 0 clamp(60px, 9cqw, 100px)`,
            position: 'relative',
            minHeight: 0,
          }}
        >
          <div style={{ position: 'relative', width: '100%' }}>
            {illustrations}
            <div>
              {!reading ? (
                <Compose draft={draft} onDraft={onDraft} onSave={onSaveCustom} th={th} compact={false} />
              ) : (
                <>
                  {passageBlock}
                  <SourceRow
                    passage={passage}
                    th={th}
                    isDaily={offset === 0}
                    compact={false}
                    action={sourceAction}
                  />
                </>
              )}
            </div>
            {reading && (
              <div style={{ position: 'relative', marginTop: 18, minHeight: SUMMARY_SLOT, pointerEvents: 'none' }}>
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
            )}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            // Reserve the button's ~28px row above the 26px bottom padding
            // (border-box), so the passage holds still when it appears.
            minHeight: 28 + 26,
            padding: '0 40px 26px',
            fontSize: 13,
            color: 'var(--color-neutral-700)',
            position: 'relative',
          }}
        >
          <span>Start typing. Backspace is allowed. There is no score to beat.</span>
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
