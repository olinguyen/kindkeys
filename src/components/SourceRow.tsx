import type { Passage, Theme } from '../data/categories';

interface Props {
  passage: Passage;
  th: Theme;
  /** True while this is the day's own passage — it drops after "Try another". */
  isDaily: boolean;
  compact: boolean;
  /** "Try another" on the curated categories, "Edit passage" on your own. */
  action?: React.ReactNode;
}

/** Where the words came from, and — on the day's passage — that it was chosen for today. */
export function SourceRow({ passage, th, isDaily, compact, action }: Props) {
  const source = passage.custom
    ? 'Your own words'
    : passage.original
      ? 'Original writing, inspired by'
      : `${passage.author}, ${passage.work}`;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: compact ? 8 : 10,
        marginTop: compact ? 8 : 18,
        fontSize: compact ? 12 : 13,
        color: 'var(--color-neutral-700)',
        flexWrap: 'wrap',
        position: 'relative',
        zIndex: 1,
      }}
    >
      {isDaily && (
        <>
          <span style={{ fontWeight: 600, color: th.deep }}>Today’s intention</span>
          <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--color-neutral-500)', flex: 'none' }} />
        </>
      )}
      <span>{source}</span>
      {passage.tags.map((t) => (
        <span
          key={t}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            fontSize: 11,
            letterSpacing: '.02em',
            padding: '3px 10px',
            borderRadius: 999,
            background: th.soft,
            color: th.deep,
          }}
        >
          {t}
        </span>
      ))}
      {action}
    </div>
  );
}
