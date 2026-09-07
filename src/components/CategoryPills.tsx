import { CATS, type CatId, type Theme } from '../data/categories';

interface Props {
  active: CatId;
  th: Theme;
  onPick: (id: CatId) => void;
  compact: boolean;
}

/** The category switch. Selecting one changes passage set, palette and illustration. */
export function CategoryPills({ active, th, onPick, compact }: Props) {
  return (
    <div
      className="kk-pills"
      role="tablist"
      aria-label="Category"
      style={{ background: th.soft, ...(compact ? { margin: '10px 20px 0' } : {}) }}
      onClick={(e) => e.stopPropagation()}
    >
      {CATS.map((c) => {
        const selected = c.id === active;
        return (
          <button
            key={c.id}
            type="button"
            role="tab"
            aria-selected={selected}
            className="kk-pill"
            onClick={() => onPick(c.id)}
            style={{
              // The selected pill takes the accent mixed toward the text colour,
              // so its cream label keeps contrast on every theme.
              background: selected ? `color-mix(in oklch, ${c.th.accent} 70%, var(--color-text))` : 'transparent',
              color: selected ? 'var(--color-neutral-100)' : 'var(--color-text)',
              ...(compact ? { fontSize: 12, padding: '8px 6px', flex: 1, minWidth: 0, justifyContent: 'center' } : {}),
            }}
          >
            {!compact && (
              <span className="kk-pill-dot" style={{ background: selected ? 'var(--color-neutral-100)' : c.th.accent }} />
            )}
            {c.label}
          </button>
        );
      })}
    </div>
  );
}
