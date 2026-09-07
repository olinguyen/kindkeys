import { useEffect, useRef } from 'react';
import { createBambooFountain, type Fountain as FountainHandle } from '../../lib/fountain';

interface Props {
  active: boolean;
  progress: number;
  /** Changes whenever the run is cleared, so the water snaps back to dry. */
  resetToken: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * "Your own" — a shishi-odoshi in open bamboo, so the water stays visible the
 * whole way down. Driven imperatively: the SVG is built once and its water
 * level is pushed in as the passage advances.
 */
export function Fountain({ active, progress, resetToken, className, style }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const handle = useRef<FountainHandle | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    handle.current = createBambooFountain(svgRef.current);
    return () => {
      handle.current?.destroy();
      handle.current = null;
    };
  }, []);

  useEffect(() => {
    handle.current?.reset();
  }, [resetToken]);

  useEffect(() => {
    handle.current?.setProgress(active ? progress * 100 : 0);
  }, [active, progress]);

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 420 720"
      role="img"
      aria-label="Water cascading through bamboo channels into a stone basin"
      className={className}
      style={style}
    />
  );
}
