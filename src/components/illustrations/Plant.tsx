import { LEAF_TS, STEM_D, stemPt } from '../../lib/geometry';

interface Props {
  active: boolean;
  /** Passage completion, 0–1. */
  progress: number;
  done: boolean;
}

/**
 * Kindness — a stem that draws upward as the passage fills in, a sage leaf
 * unfurling roughly every seventh of the way, and a terracotta flower that
 * opens on the last character. Finished, the whole plant sways in a breeze.
 */
export function Plant({ active, progress, done }: Props) {
  const p = active ? progress : 0;
  const open = active && done;
  const tip = stemPt(1);

  return (
    <>
      <ellipse cx={130} cy={440} rx={70} ry={9} fill="var(--color-accent-2-300)" opacity={0.6} />
      <g
        style={{
          transformOrigin: '130px 440px',
          animation: open ? 'kk-breeze 4.2s ease-in-out .6s infinite' : 'none',
        }}
      >
        <path
          d={STEM_D}
          fill="none"
          stroke="var(--color-accent-2-600)"
          strokeWidth={5}
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={active ? 1 - p * 0.97 : 1}
          style={{ transition: 'stroke-dashoffset .5s ease-out' }}
        />
        {LEAF_TS.map((t, i) => {
          const q = stemPt(t);
          const on = active && p >= t + 0.04;
          return (
            <g
              key={t}
              style={{
                transform: `translate(${q.x.toFixed(1)}px,${q.y.toFixed(1)}px) rotate(${i % 2 ? -30 : -150}deg) scale(${on ? 1 : 0})`,
                transformOrigin: '0 0',
                transition: 'transform .55s cubic-bezier(.2,.9,.2,1.25)',
              }}
            >
              <g
                style={
                  {
                    transformOrigin: '0 0',
                    '--amp': `${(i % 2 ? 1 : -1) * (5 + i)}deg`,
                    animation: open ? `kk-lean ${3.6 + (i % 3) * 0.5}s ease-in-out ${i * 0.22}s infinite` : 'none',
                  } as React.CSSProperties
                }
              >
                <ellipse cx={34} cy={0} rx={26} ry={11} fill={i % 3 === 2 ? 'var(--color-accent-2-500)' : 'var(--color-accent-2-400)'} />
                <line x1={0} y1={0} x2={60} y2={0} stroke="var(--color-accent-2-600)" strokeWidth={1.5} opacity={0.5} />
              </g>
            </g>
          );
        })}
        <g
          style={{
            transform: `translate(${tip.x.toFixed(1)}px,${(tip.y - 10).toFixed(1)}px) scale(${open ? 1 : 0})`,
            transformOrigin: '0 0',
            transition: 'transform .7s cubic-bezier(.2,.9,.2,1.3)',
          }}
        >
          <g style={{ transformOrigin: '0 0', animation: open ? 'kk-flutter 3.4s ease-in-out 1s infinite' : 'none' }}>
            <circle cx={0} cy={-16} r={11} fill="var(--color-accent-400)" />
            <circle cx={15} cy={-5} r={11} fill="var(--color-accent-400)" />
            <circle cx={9} cy={13} r={11} fill="var(--color-accent-400)" />
            <circle cx={-9} cy={13} r={11} fill="var(--color-accent-400)" />
            <circle cx={-15} cy={-5} r={11} fill="var(--color-accent-400)" />
            <circle cx={0} cy={0} r={8} fill="var(--color-accent-2-300)" />
          </g>
        </g>
      </g>
    </>
  );
}
