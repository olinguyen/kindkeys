import { useId } from 'react';
import type { Theme } from '../../data/categories';
import { ROCKS, blobPath, rockGeom } from '../../lib/geometry';

export interface DustMote {
  id: number;
  x: number;
  y: number;
  s: number;
  dx: number;
  dy: number;
  dur: number;
}

interface Props {
  active: boolean;
  progress: number;
  done: boolean;
  started: boolean;
  th: Theme;
  dust: DustMote[];
  /** Bumped on each landing so the stack compresses with a soft thud. */
  thuds: number;
}

const N = ROCKS.length;

/**
 * Perspective — a cairn of ten stones, one per tenth of the passage. Each stone
 * is airborne for its own tenth (every keystroke lowers it) and touches down
 * exactly on its mark. Finished, wind crosses the stack and it leans into the
 * gust and settles back — nothing ever falls.
 */
export function Cairn({ active, progress, done, started, th, dust, thuds }: Props) {
  const p = active ? progress : 0;
  const settled = active && done;
  const geom = rockGeom();
  const clipId = useId().replace(/:/g, '');

  return (
    <>
      <ellipse cx={130} cy={436} rx={90} ry={9} fill="var(--color-neutral-500)" opacity={0.28} />

      <defs>
        <clipPath id={clipId}>
          <rect x={0} y={0} width={260} height={440} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`} style={{ opacity: settled ? 1 : 0, transition: 'opacity .8s' }}>
        {[
          { d: 'M-40 250 q18 -8 36 0 t36 0 t36 0', dur: 2.6, delay: 2.2 },
          { d: 'M-40 300 q14 -6 28 0 t28 0 t28 0 t28 0', dur: 3, delay: 2.7 },
          { d: 'M-40 200 q16 -7 32 0 t32 0', dur: 2.4, delay: 3.3 },
        ].map((w) => (
          <path
            key={w.d}
            d={w.d}
            fill="none"
            stroke={th.mid}
            strokeWidth={2}
            strokeLinecap="round"
            style={{ animation: settled ? `kk-wind ${w.dur}s ease-in-out ${w.delay}s infinite` : 'none' }}
          />
        ))}
      </g>

      <g
        style={{
          transformOrigin: '130px 436px',
          animation: settled ? 'kk-sway 2.4s ease-in-out 1 both, kk-gust 7s ease-in-out 2.4s infinite' : 'none',
        }}
      >
        <g
          style={{
            transformOrigin: '130px 436px',
            animation:
              active && thuds ? `${thuds % 2 ? 'kk-thud-a' : 'kk-thud-b'} .42s cubic-bezier(.2,.8,.3,1) 1 both` : 'none',
          }}
        >
          {geom.map((r, i) => {
            const side = i % 2 ? 1 : -1;
            const band0 = i / N;
            const u0 = active ? Math.max(0, Math.min(1, (p - band0) * N)) : 0;
            // The capstone hovers just above the pile until the passage is complete.
            const u = i === N - 1 && !done ? Math.min(u0, 0.92) : u0;
            const landed = u >= 1 - 1e-6;
            const fall = -(140 + i * 16) * (1 - u) * (1 - u * 0.15);
            const drift = side * 46 * (1 - u);
            const rot = side * 16 * (1 - u) + Math.sin(u * 7) * 5 * (1 - u);
            const visible = active && (i === 0 || p > band0 - 1e-6) && (started || i === 0);

            return (
              <g
                key={i}
                style={{
                  transform: landed ? 'translate(0,0) rotate(0)' : `translate(${drift.toFixed(1)}px,${fall.toFixed(1)}px) rotate(${rot.toFixed(1)}deg)`,
                  opacity: visible ? (landed ? 1 : 0.55 + 0.45 * u) : 0,
                  transformOrigin: `${r.cx}px ${r.cy}px`,
                  transition: 'transform .32s cubic-bezier(.25,.6,.3,1),opacity .3s',
                }}
              >
                <g
                  style={
                    {
                      transformOrigin: `${r.cx}px ${r.cy + r.h / 2}px`,
                      // Higher stones lean further into the gust, a beat later.
                      '--amp': `${-(0.6 + i * 0.35)}deg`,
                      animation: settled ? `kk-lean 7s ease-in-out ${2.4 + i * 0.09}s infinite` : 'none',
                    } as React.CSSProperties
                  }
                >
                  <ellipse
                    cx={r.cx}
                    cy={r.cy + r.h / 2 - 2}
                    rx={r.w * 0.42}
                    ry={4}
                    fill="var(--color-neutral-800)"
                    style={{ opacity: landed ? 0.18 : 0.06 * u, transition: 'opacity .3s' }}
                  />
                  <path d={blobPath(r.cx, r.cy, r.w, r.h, r.seed)} fill={r.fill} />
                  <path d={blobPath(r.cx, r.cy, r.w, r.h, r.seed)} fill="none" stroke="var(--color-neutral-800)" strokeWidth={1} opacity={0.12} />
                  <ellipse
                    cx={r.cx - r.w * 0.16}
                    cy={r.cy - r.h * 0.22}
                    rx={r.w * 0.2}
                    ry={r.h * 0.13}
                    fill="var(--color-neutral-100)"
                    opacity={0.28}
                    transform={`rotate(-14 ${r.cx - r.w * 0.16} ${r.cy - r.h * 0.22})`}
                  />
                </g>
              </g>
            );
          })}
        </g>
        <g>
          {dust.map((q) => (
            <circle
              key={q.id}
              cx={q.x}
              cy={q.y}
              r={q.s}
              fill="var(--color-neutral-400)"
              style={
                {
                  '--dx': `${q.dx}px`,
                  '--dy': `${q.dy}px`,
                  animation: `kk-puff ${q.dur}s cubic-bezier(.1,.6,.3,1) both`,
                  transformBox: 'fill-box',
                  transformOrigin: 'center',
                } as React.CSSProperties
              }
            />
          ))}
        </g>
      </g>
    </>
  );
}
