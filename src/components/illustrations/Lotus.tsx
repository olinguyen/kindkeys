import type { Theme } from '../../data/categories';
import { LOTUS_LAYERS, LOTUS_PETALS, petalPath } from '../../lib/geometry';

interface Props {
  active: boolean;
  progress: number;
  done: boolean;
  th: Theme;
}

/**
 * Presence — a lotus on a still pool. Twelve petals unfold outer-to-inner as
 * the passage advances; the last petal and the core open on completion, then
 * the flower drifts, the petals breathe and slow rings leave the pad.
 */
export function Lotus({ active, progress, done, th }: Props) {
  const p = active ? progress : 0;
  const open = active && done;
  let n = -1;

  return (
    <>
      <ellipse cx={130} cy={392} rx={124} ry={40} fill={th.mid} opacity={0.55} />
      <ellipse cx={130} cy={392} rx={104} ry={31} fill={th.soft} opacity={0.9} />
      <g style={{ transform: 'translate(130px,392px)' }}>
        <ellipse
          cx={0}
          cy={0}
          rx={40}
          ry={12}
          fill="none"
          stroke={th.accent}
          strokeWidth={1.5}
          style={{
            transform: `scale(${open ? 2.6 : 0.6})`,
            opacity: open ? 0.5 : 0,
            transformOrigin: '0 0',
            transition: 'transform 2.2s cubic-bezier(.2,.8,.2,1),opacity 1.6s',
          }}
        />
        {[1.2, 3.7].map((delay) => (
          <ellipse
            key={delay}
            cx={0}
            cy={0}
            rx={30}
            ry={9}
            fill="none"
            stroke={th.accent}
            strokeWidth={1.2}
            style={{
              transformOrigin: '0 0',
              opacity: 0,
              animation: open ? `kk-ripple-slow 5s cubic-bezier(.1,.6,.3,1) ${delay}s infinite` : 'none',
            }}
          />
        ))}
      </g>

      {/* The pad, with eight veins fanning from its centre. */}
      <path d="M130 384 m-46 0 a46 15 0 1 0 92 0 a46 15 0 1 0 -92 0" fill="var(--color-accent-2-400)" opacity={0.95} />
      <path
        d="M130 384 L106 376 M130 384 L96 384 M130 384 L106 392 M130 384 L154 376 M130 384 L164 384 M130 384 L154 392 M130 384 L130 373 M130 384 L130 395"
        stroke="var(--color-accent-2-500)"
        strokeWidth={1.2}
        opacity={0.6}
        strokeLinecap="round"
      />

      <g style={{ transform: 'translate(130px,380px)', animation: open ? 'kk-drift 5s ease-in-out infinite' : 'none' }}>
        <g style={{ transformOrigin: '0 0', animation: open ? 'kk-breath 4.4s ease-in-out infinite' : 'none' }}>
          {LOTUS_LAYERS.flatMap((layer) =>
            layer.angles.map((a) => {
              n += 1;
              const i = n;
              // The last petal waits for completion; the rest arrive on a twelfth each.
              const on = active && (i < LOTUS_PETALS - 1 ? p >= (i + 1) / LOTUS_PETALS : done);
              return (
                <path
                  key={i}
                  d={petalPath(layer.len, layer.wid)}
                  fill={layer.fill}
                  style={{
                    transform: on ? `rotate(${a}deg) scale(1)` : 'rotate(0deg) scale(.5,.15)',
                    opacity: on ? 1 : 0,
                    transformOrigin: '0 0',
                    transition: 'transform 1.1s cubic-bezier(.2,.85,.2,1.05),opacity .6s',
                  }}
                />
              );
            }),
          )}
          <circle
            cx={0}
            cy={-22}
            r={7}
            fill="var(--color-accent-400)"
            style={{
              transform: `scale(${open ? 1 : 0})`,
              transformOrigin: '0 -22px',
              transition: 'transform .8s cubic-bezier(.2,.9,.2,1.3)',
            }}
          />
        </g>
      </g>
    </>
  );
}
