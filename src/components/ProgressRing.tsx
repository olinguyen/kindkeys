import type { Theme } from '../data/categories';

interface Props {
  /** Passage completion, 0–1. */
  progress: number;
  th: Theme;
  size: number;
  /** Elapsed seconds in the middle once the run is done; off on small rings. */
  label?: string;
}

const CIRCUMFERENCE = 138.2; // r = 22

/**
 * The header ring fills with passage completion rather than draining a clock —
 * there is no deadline here, and it is high-water-marked like the illustrations.
 */
export function ProgressRing({ progress, th, size, label }: Props) {
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 52 52" style={{ transform: 'rotate(-90deg)' }} aria-hidden>
        <circle cx={26} cy={26} r={22} fill="none" stroke={th.mid} strokeWidth={4} style={{ transition: 'stroke .5s' }} />
        <circle
          cx={26}
          cy={26}
          r={22}
          fill="none"
          stroke={th.accent}
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={(CIRCUMFERENCE * (1 - progress)).toFixed(1)}
          style={{ transition: 'stroke-dashoffset .35s cubic-bezier(.2,.8,.2,1),stroke .5s' }}
        />
      </svg>
      {label !== undefined && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            placeItems: 'center',
            fontSize: Math.round(size / 4),
            fontWeight: 600,
            opacity: label ? 1 : 0,
            transition: 'opacity .3s',
          }}
        >
          <span>{label || ' '}</span>
        </div>
      )}
    </div>
  );
}
