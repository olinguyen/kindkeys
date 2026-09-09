import { useRef } from 'react';
import type { Theme } from '../data/categories';
import { useCaret } from '../hooks/useCaret';
import type { WordCell } from '../lib/typing';

interface Props {
  words: WordCell[];
  th: Theme;
  fontSize: string;
  /** Resting caret height before the first measurement. */
  caretHeight: number;
  typed: string;
  focused: boolean;
  hidden: boolean;
  inputRef: React.RefObject<HTMLInputElement>;
  onType: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus: () => void;
  onBlur: () => void;
}

/**
 * The passage itself. Keystrokes go to an invisible input stretched over the
 * text; the visible characters are coloured by what has been typed. The input
 * sits below the source row in the stack so the links there stay clickable.
 */
export function Passage({ words, th, fontSize, caretHeight, typed, focused, hidden, inputRef, onType, onFocus, onBlur }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  useCaret(rootRef, { typedLen: typed.length, focused });

  return (
    <>
      <input
        ref={inputRef}
        className="kk-input"
        value={typed}
        onChange={onType}
        onFocus={onFocus}
        onBlur={onBlur}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        enterKeyHint="done"
        aria-label="Type the passage"
        style={{ display: hidden ? 'none' : undefined }}
      />
      <div ref={rootRef} className="kk-passage" style={{ fontSize, display: hidden ? 'none' : 'block' }}>
        <span className="kk-caret" data-caret style={{ height: caretHeight, background: th.accent }} />
        {words.map((w, wi) => (
          <span key={wi} data-word={wi} className={`kk-word${w.done ? ' kk-word-done' : ''}`}>
            {w.chars.map((c, ci) => (
              <span key={ci} data-cur={c.cur ? '1' : '0'} style={{ color: c.color, background: c.bg }}>
                {c.ch}
              </span>
            ))}
          </span>
        ))}
      </div>
    </>
  );
}
