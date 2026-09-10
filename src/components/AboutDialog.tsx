import { useEffect, useRef } from 'react';
import type { Theme } from '../data/categories';
import { BookIcon, CloseIcon, CompassIcon, WavesIcon } from './Icons';

interface Props {
  th: Theme;
  onClose: () => void;
}

const POINTS = [
  {
    icon: <WavesIcon />,
    ring: 'var(--color-accent-2-200)',
    ink: 'var(--color-accent-2-800)',
    title: 'Slow down.',
    body: 'Typing takes a little longer than reading, giving you time to notice the words instead of skimming past them.',
  },
  {
    icon: <CompassIcon />,
    ring: 'var(--color-accent-200)',
    ink: 'var(--color-accent-800)',
    title: 'Choose what matters.',
    body: 'Pick a passage that reflects something you want to practice, remember, or keep in mind.',
  },
  {
    icon: <BookIcon />,
    ring: 'var(--color-neutral-200)',
    ink: 'var(--color-neutral-800)',
    title: 'Stay with the words.',
    body: 'There’s no need to rush. Take your time, and let yourself actually think about what the words mean to you.',
  },
];

export function AboutDialog({ th, onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="dialog-backdrop" style={{ cursor: 'default', zIndex: 20 }} onClick={onClose}>
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="kk-about-title"
        style={{ width: 'min(540px, 100%)', gap: 18, padding: '30px 32px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div className="dialog-title" id="kk-about-title" style={{ fontSize: 28 }}>
            Why type this?
          </div>
          <button ref={closeRef} type="button" className="btn btn-ghost btn-icon" aria-label="Close" onClick={onClose} style={{ color: th.deep }}>
            <CloseIcon />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: 15, lineHeight: 1.5 }}>
          <p style={{ margin: 0 }}>KindKeys uses typing to give you a moment to slow down and really take in the words you’re writing.</p>
          {POINTS.map((p) => (
            <div key={p.title} style={{ display: 'flex', gap: 14 }}>
              <span
                style={{
                  flex: 'none',
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: p.ring,
                  display: 'grid',
                  placeItems: 'center',
                  color: p.ink,
                }}
              >
                {p.icon}
              </span>
              <div>
                <strong>{p.title}</strong> {p.body}
              </div>
            </div>
          ))}
        </div>

        <p style={{ margin: 0, fontSize: 13, color: 'var(--color-neutral-700)', lineHeight: 1.5 }}>
          Excerpts are credited to author and work. Original writing is marked as such and tagged with the tradition it draws on.
        </p>

        <div className="dialog-actions">
          <button type="button" className="btn btn-primary" onClick={onClose} style={{ background: th.accent, color: 'var(--color-neutral-100)' }}>
            Back to typing
          </button>
        </div>
      </div>
    </div>
  );
}
