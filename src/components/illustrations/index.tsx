import type { CatId, Theme } from '../../data/categories';
import { Cairn, type DustMote } from './Cairn';
import { Fountain } from './Fountain';
import { Lotus } from './Lotus';
import { Plant } from './Plant';

interface Props {
  catId: CatId;
  /** Passage completion, 0–1, high-water-marked. */
  progress: number;
  done: boolean;
  started: boolean;
  th: Theme;
  dust: DustMote[];
  thuds: number;
  resetToken: number;
  /** Sizes and places the whole stack; the four layers fill it. */
  style?: React.CSSProperties;
}

const layer = (visible: boolean): React.CSSProperties => ({
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  overflow: 'visible',
  opacity: visible ? 1 : 0,
  transition: 'opacity .5s',
});

/**
 * All four illustrations stay mounted and cross-fade, so switching category
 * hands over softly and each keeps its own progress.
 */
export function Illustrations({ catId, progress, done, started, th, dust, thuds, resetToken, style }: Props) {
  return (
    <div style={{ pointerEvents: 'none', ...style }}>
      <svg viewBox="0 0 260 440" aria-hidden={catId !== 'kind'} style={layer(catId === 'kind')}>
        <Plant active={catId === 'kind'} progress={progress} done={done} />
      </svg>
      <svg viewBox="0 0 260 440" aria-hidden={catId !== 'pres'} style={layer(catId === 'pres')}>
        <Lotus active={catId === 'pres'} progress={progress} done={done} th={th} />
      </svg>
      <svg viewBox="0 0 260 440" aria-hidden={catId !== 'persp'} style={layer(catId === 'persp')}>
        <Cairn active={catId === 'persp'} progress={progress} done={done} started={started} th={th} dust={dust} thuds={thuds} />
      </svg>
      <Fountain active={catId === 'custom'} progress={progress} resetToken={resetToken} style={layer(catId === 'custom')} />
    </div>
  );
}

export type { DustMote };
