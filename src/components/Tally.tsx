import type { Theme } from '../data/categories';

interface Props {
  reps: number;
  th: Theme;
}

interface Stroke {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  stroke: string;
  w: number;
  anim: string;
}

/** Beyond this the marks stop being legible; the count label still tells the truth. */
const MAX_STROKES = 200;

/**
 * A hand-drawn tally of how many times this passage has been typed: four
 * uprights and a crossing fifth per group, wrapping onto new rows so a long
 * record fills the card. Only the newest stroke draws itself in, so the
 * flourish reads as "this run".
 */
export function Tally({ reps, th }: Props) {
  const shown = Math.min(reps, MAX_STROKES);
  const groups: Stroke[][] = [];

  for (let i = 0; i < shown; i++) {
    const g = Math.floor(i / 5);
    const j = i % 5;
    const newest = i === shown - 1;
    if (!groups[g]) groups[g] = [];
    const anim = newest ? `kk-tally-last ${j < 4 ? '.9s' : '1.1s'} cubic-bezier(.3,.6,.2,1) .5s both` : 'none';
    groups[g].push(
      j < 4
        ? { x1: 3 + j * 6, y1: 2, x2: 3.6 + j * 6, y2: 18, stroke: th.deep, w: 2.2, anim }
        : { x1: -1, y1: 17, x2: 25, y2: 3, stroke: th.accent, w: 2.6, anim },
    );
  }

  const label = reps === 1 ? '1 time' : `${reps} times`;
  const title = reps === 1 ? 'You’ve typed this once' : `You’ve typed this ${reps} times`;

  return (
    <div
      title={title}
      aria-label={title}
      style={{ display: 'flex', alignItems: 'flex-start', gap: 7, marginLeft: 'auto', minWidth: 0, flex: 1, justifyContent: 'flex-end' }}
    >
      <span style={{ fontSize: 12, fontWeight: 600, color: th.deep, whiteSpace: 'nowrap', lineHeight: '20px' }}>{label}</span>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 8px', justifyContent: 'flex-end', minWidth: 0 }}>
        {groups.map((strokes, gi) => (
          <svg key={gi} width={26} height={20} viewBox="0 0 26 20" style={{ overflow: 'visible', display: 'block' }} aria-hidden>
            {strokes.map((s, si) => (
              <line
                key={si}
                x1={s.x1}
                y1={s.y1}
                x2={s.x2}
                y2={s.y2}
                stroke={s.stroke}
                strokeWidth={s.w}
                strokeLinecap="round"
                pathLength={1}
                strokeDasharray={1}
                style={{ animation: s.anim }}
              />
            ))}
          </svg>
        ))}
      </div>
    </div>
  );
}
