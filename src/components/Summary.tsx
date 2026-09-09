import type { Category } from '../data/categories';
import type { Build } from '../lib/typing';
import { RotateIcon } from './Icons';
import { Tally } from './Tally';

interface Props {
  cat: Category;
  build: Build;
  /** Backspaces during the run. */
  fix: number;
  /** Times this passage has been completed, this run included. */
  reps: number;
  subline: string;
  onAgain: () => void;
  compact: boolean;
  /** Show the Enter key-cap on "Once more" — there is a real keyboard to press it on. */
  keyHint: boolean;
}

/**
 * The card that slides in on completion: how it went, then "Once more" with the
 * tally beside it — the two things the eye wants where it lands.
 */
export function Summary({ cat, build, fix, reps, subline, onAgain, compact, keyHint }: Props) {
  const th = cat.th;
  const stats = [
    { label: 'Speed', value: build.wpm, unit: 'wpm' },
    { label: 'Accuracy', value: build.acc, unit: '%' },
    { label: 'Time', value: build.sec, unit: 's' },
    { label: compact ? 'Fixes' : 'Corrections', value: fix, unit: '' },
  ];

  const heading = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? 2 : 3, whiteSpace: compact ? undefined : 'nowrap' }}>
      <div style={{ fontFamily: 'var(--font-heading)', fontSize: compact ? 20 : 22, lineHeight: 1.1, color: th.deep }}>{cat.doneLine}</div>
      <div style={{ fontSize: compact ? 13 : 14, lineHeight: 1.3, color: th.deep }}>{subline}</div>
    </div>
  );

  const figures = stats.map((s) => (
    <div key={s.label}>
      <span className="card-kicker" style={{ color: th.deep, fontSize: compact ? 10 : undefined }}>
        {s.label}
      </span>
      <div style={{ fontFamily: 'var(--font-heading)', fontSize: compact ? 22 : 30, lineHeight: 1.1 }}>
        {s.value}
        {s.unit && (
          <span style={{ fontFamily: 'var(--font-body)', fontSize: compact ? 11 : 12, marginLeft: s.unit === 'wpm' ? 3 : 2, color: 'var(--color-neutral-700)' }}>
            {s.unit}
          </span>
        )}
      </div>
    </div>
  ));

  return (
    <>
      {compact ? (
        <>
          {heading}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 8 }}>{figures}</div>
        </>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 30 }}>
          {heading}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 28 }}>{figures}</div>
        </div>
      )}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          paddingTop: compact ? 12 : 14,
          borderTop: `1px solid color-mix(in oklch, ${th.accent} 30%, transparent)`,
        }}
      >
        <button
          type="button"
          className="btn btn-primary"
          onClick={onAgain}
          aria-keyshortcuts={keyHint ? 'Enter' : undefined}
          style={{
            whiteSpace: 'nowrap',
            fontFamily: 'var(--font-body)',
            fontWeight: 600,
            fontSize: compact ? 12 : 14,
            padding: '8px 16px',
            background: `color-mix(in oklch, ${th.accent} 70%, var(--color-text))`,
            color: 'var(--color-neutral-100)',
          }}
        >
          <RotateIcon />
          Once more
          {keyHint && (
            <kbd className="kk-kbd" aria-hidden>
              ↵ Enter
            </kbd>
          )}
        </button>
        {reps > 0 && <Tally reps={reps} th={th} />}
      </div>
    </>
  );
}
