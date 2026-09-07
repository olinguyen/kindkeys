import type { Theme } from '../data/categories';
import { MAX_CHARS } from '../data/categories';
import { ArrowRightIcon } from './Icons';

interface Props {
  draft: string;
  onDraft: (v: string) => void;
  onSave: () => void;
  th: Theme;
  compact: boolean;
}

/** "Your own" — one box, one limit, one way forward. */
export function Compose({ draft, onDraft, onSave, th, compact }: Props) {
  const ready = draft.trim().length > 0;

  const meta = (
    <>
      <span>
        {draft.length} / {MAX_CHARS} characters
      </span>
      <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--color-neutral-500)', flex: 'none' }} />
      <span style={{ color: 'var(--color-neutral-600)' }}>{compact ? 'about a minute' : 'about a minute of typing'}</span>
    </>
  );

  const save = (
    <button
      type="button"
      className="btn btn-primary"
      onClick={onSave}
      disabled={!ready}
      style={{
        background: th.accent,
        color: 'var(--color-neutral-100)',
        opacity: ready ? 1 : 0.45,
        whiteSpace: 'nowrap',
        flex: 'none',
        marginLeft: compact ? undefined : 'auto',
        justifyContent: compact ? 'center' : undefined,
      }}
    >
      Type it <ArrowRightIcon />
    </button>
  );

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', gap: 12, cursor: 'default', marginTop: compact ? 0 : -70 }}
      onClick={(e) => e.stopPropagation()}
    >
      <textarea
        className="input"
        value={draft}
        onChange={(e) => onDraft(e.target.value)}
        placeholder="A few sentences you want to sit with today…"
        spellCheck={false}
        aria-label="Your own passage"
        style={{
          fontSize: compact ? 17 : 22,
          lineHeight: 1.45,
          minHeight: 150,
          padding: compact ? '14px 16px' : '18px 22px',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--color-neutral-100)',
          resize: 'none',
          fontFamily: 'var(--font-body)',
        }}
      />
      {compact ? (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--color-neutral-700)' }}>{meta}</div>
          {save}
        </>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--color-neutral-700)' }}>
          {meta}
          {save}
        </div>
      )}
    </div>
  );
}
