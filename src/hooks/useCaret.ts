import { useLayoutEffect, useRef, type RefObject } from 'react';

interface Options {
  /** Characters typed so far — a change restarts the blink. */
  typedLen: number;
  /** The caret shows only while the input can actually receive keystrokes. */
  focused: boolean;
}

/**
 * Places the caret over the character it sits on. The passage is laid out by
 * the browser, so the caret follows measured geometry rather than a computed
 * offset: it slides between characters and wraps with the text. It blinks when
 * idle and stays solid while you type.
 */
export function useCaret(rootRef: RefObject<HTMLElement>, { typedLen, focused }: Options): void {
  const prevLen = useRef(-1);

  const place = () => {
    const root = rootRef.current;
    if (!root) return;
    const caret = root.querySelector<HTMLElement>('[data-caret]');
    if (!caret) return;
    const cur = root.querySelector<HTMLElement>('[data-cur="1"]');

    // Nothing left to type, or keystrokes would go nowhere.
    if (!cur || !focused) {
      caret.style.opacity = '0';
      return;
    }

    const r = cur.getBoundingClientRect();
    const pr = root.getBoundingClientRect();

    const restart = prevLen.current !== typedLen;
    prevLen.current = typedLen;
    if (restart || !caret.style.animation) {
      caret.style.animation = 'none';
      void caret.offsetWidth; // reflow, so the blink restarts from solid
      caret.style.animation = 'kk-blink 1.1s step-end .5s infinite';
    }

    caret.style.height = `${r.height * 0.82}px`;
    caret.style.opacity = '1';
    caret.style.transform = `translate(${r.left - pr.left - 2}px,${r.top - pr.top + r.height * 0.09}px)`;
  };

  // The listeners below outlive any one render, so they call through a ref
  // that always holds the latest `place` — never a stale focused/typedLen.
  const placeRef = useRef(place);
  placeRef.current = place;

  // After every render — the caret's target moves with each keystroke.
  useLayoutEffect(place);

  // And whenever the text reflows underneath it: a resize, or the web font
  // swapping in after first paint.
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const relayout = () => placeRef.current();
    const ro = new ResizeObserver(relayout);
    ro.observe(root);
    window.addEventListener('resize', relayout);
    document.fonts?.ready.then(relayout).catch(() => {});
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', relayout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
