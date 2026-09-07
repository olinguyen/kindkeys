/**
 * The bamboo fountain for "Your own", built imperatively because the water is
 * animated per frame rather than per render: each channel is a stroked path
 * revealed by a mask, and travelling highlights run along it. Water advances
 * with passage completion (high-water-marked upstream by the caller); when the
 * last stream lands the basin takes the water colour and ripples loop.
 */

const NS = 'http://www.w3.org/2000/svg';

const WATER = 'oklch(0.72 0.07 225)';
const WATER_HI = 'oklch(0.90 0.05 225)';
const DRY_BASIN = 'var(--color-neutral-600)';
const WET_BASIN = 'oklch(0.80 0.06 225)';

export interface Fountain {
  /** Completion, 0–100. */
  setProgress(p: number): void;
  reset(): void;
  destroy(): void;
}

interface Route {
  d: string;
  width: number;
  /** A vertical drop rather than a trough — thicker water, faster highlights. */
  fall: boolean;
  reveal: SVGPathElement;
  highlights: SVGPathElement;
  length: number;
  amount: number;
  /** Progress band this route covers, in percent. */
  a: number;
  b: number;
}

export function createBambooFountain(svg: SVGSVGElement): Fountain {
  svg.replaceChildren();
  const maskPrefix = 'bamboo-' + Math.random().toString(36).slice(2) + '-';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  const el = <K extends keyof SVGElementTagNameMap>(
    tag: K,
    attrs: Record<string, string | number>,
    parent: Element = svg,
  ): SVGElementTagNameMap[K] => {
    const n = document.createElementNS(NS, tag);
    Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, String(v)));
    parent.appendChild(n);
    return n;
  };

  // Bamboo posts, with a node ring every so often up the culm.
  for (const [x, top, bottom] of [
    [322, 86, 635],
    [150, 278, 620],
    [247, 480, 641],
  ]) {
    el('path', {
      d: `M${x} ${top}Q${x - 4} ${(top + bottom) / 2} ${x + 1} ${bottom}`,
      fill: 'none',
      stroke: 'var(--color-accent-2-500)',
      'stroke-width': 17,
      'stroke-linecap': 'round',
    });
    for (let y = top + 76; y < bottom; y += 123) {
      el('path', {
        d: `M${x - 9} ${y}q9 4 18 0`,
        fill: 'none',
        stroke: 'var(--color-accent-2-300)',
        'stroke-width': 5,
        'stroke-linecap': 'round',
      });
    }
  }

  // Leaves — the second pair grows from the support's edge.
  el('path', {
    d: 'M308 183Q348 129 376 146Q355 180 308 183 M307 196Q351 191 364 222Q331 223 307 196',
    fill: 'var(--color-accent-2-400)',
  });
  el('path', { d: 'M146 462Q96 433 86 451Q103 479 146 462', fill: 'var(--color-accent-2-300)' });

  // The three open troughs. Each is drawn along its own axis so the water inside stays visible.
  (
    [
      { start: [330, 140], end: [130, 175] },
      { start: [85, 307.265], end: [255, 338.265] },
      { start: [300, 471.25], end: [205, 495] },
    ] as { start: [number, number]; end: [number, number] }[]
  ).forEach(({ start: [x, y], end: [ex, ey] }) => {
    const l = Math.hypot(ex - x, ey - y);
    const ux = (ex - x) / l;
    const uy = (ey - y) / l;
    const dir = Math.sign(ux);
    const g = el('g', { transform: `matrix(${ux} ${uy} ${-uy * dir} ${ux * dir} ${x} ${y})` });
    el('path', { d: `M0 -17L${l} -17L${l} 13Q${l} 27 ${l - 13} 28H12Q0 26 0 12Z`, fill: 'var(--color-accent-2-600)' }, g);
    el('path', { d: `M1 -14H${l}V8H1Z`, fill: 'oklch(0.90 0.035 105)' }, g);
    el('path', { d: `M5 -9H${l}V3H5Z`, fill: 'oklch(0.78 0.06 105)' }, g);
    el('path', { d: `M0 -17H${l}`, stroke: 'oklch(0.93 0.04 100)', 'stroke-width': 5, 'stroke-linecap': 'round' }, g);
    el('path', { d: `M0 10H${l}`, stroke: 'oklch(0.72 0.06 105)', 'stroke-width': 5, 'stroke-linecap': 'round' }, g);
    el('path', { d: `M${l} -16V9Q${l} 25 ${l - 9} 25`, fill: 'none', stroke: 'oklch(0.88 0.04 105)', 'stroke-width': 4 }, g);
    el('path', { d: 'M4 -16V9Q4 24 13 25', fill: 'none', stroke: 'oklch(0.88 0.04 105)', 'stroke-width': 4 }, g);
  });

  // Stone basin, its pool, and two pebbles.
  el('path', { d: 'M62 609Q54 653 101 677Q180 710 262 678Q301 659 293 615Z', fill: 'var(--color-neutral-500)' });
  el('ellipse', { cx: 177, cy: 611, rx: 116, ry: 43, fill: 'var(--color-neutral-400)' });
  el('ellipse', { cx: 177, cy: 610, rx: 92, ry: 28, fill: 'var(--color-neutral-600)' });
  const pool = el('ellipse', {
    cx: 177,
    cy: 609,
    rx: 84,
    ry: 23,
    fill: DRY_BASIN,
    style: 'transition:fill .9s ease',
  });
  el('path', { d: 'M44 670Q25 649 42 632Q60 615 83 634Q105 654 94 669Z', fill: 'var(--color-neutral-400)' });
  el('path', { d: 'M269 687Q263 665 283 655Q314 644 331 674Q333 689 269 687Z', fill: 'var(--color-neutral-400)' });

  const defs = el('defs', {});
  const routes: Route[] = (
    [
      { d: 'M325 140.875L130 175', width: 9, fall: false },
      { d: 'M130 175Q100 180.25 100 310', width: 11, fall: true },
      { d: 'M100 310L255 338.265', width: 9, fall: false },
      { d: 'M255 338.265Q285 343.736 285 475', width: 11, fall: true },
      { d: 'M285 475L205 495', width: 9, fall: false },
      { d: 'M205 495Q177 502 177 609', width: 11, fall: true },
    ] as const
  ).map((r, i) => {
    const mask = el('mask', { id: maskPrefix + i, maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: 420, height: 720 }, defs);
    const reveal = el('path', { d: r.d, fill: 'none', stroke: 'white', 'stroke-width': 18, 'stroke-linecap': 'butt' }, mask);
    const group = el('g', { mask: `url(#${maskPrefix}${i})` });
    const base = el('path', { d: r.d, fill: 'none', stroke: WATER, 'stroke-width': r.width, 'stroke-linecap': 'round', opacity: 0.94 }, group);
    const length = base.getTotalLength();
    reveal.setAttribute('stroke-dasharray', length + ' ' + length);
    reveal.setAttribute('stroke-dashoffset', String(length));
    const highlights = el(
      'path',
      {
        d: r.d,
        fill: 'none',
        stroke: WATER_HI,
        'stroke-width': r.fall ? 3 : 2,
        'stroke-linecap': 'round',
        'stroke-dasharray': r.fall ? '17 27 7 39' : '13 39 6 29',
        opacity: 0.7,
      },
      group,
    );
    return { ...r, reveal, highlights, length, amount: 0, a: 0, b: 0 };
  });

  // Progress bands proportional to path length, so water advances at one visual rate throughout.
  const total = routes.reduce((s, r) => s + r.length, 0);
  let acc = 0;
  routes.forEach((r) => {
    r.a = (acc / total) * 100;
    acc += r.length;
    r.b = (acc / total) * 100;
  });

  const ripples = [0, 1, 2].map(() =>
    el('ellipse', { cx: 177, cy: 609, rx: 4, ry: 1, fill: 'none', stroke: 'oklch(0.93 0.04 225)', 'stroke-width': 1.8, opacity: 0 }),
  );
  const burst = el('ellipse', { cx: 177, cy: 609, rx: 4, ry: 1, fill: 'none', stroke: 'oklch(0.95 0.035 225)', 'stroke-width': 2.6, opacity: 0 });

  let wet = false;
  let landedAt = 0;
  let desired = 0;
  let visible = 0;
  let last = 0;
  let frameId = 0;
  let destroyed = false;

  function frame(now: number) {
    if (destroyed) return;
    const dt = Math.min(0.05, (now - (last || now)) / 1000);
    last = now;
    visible = reduced.matches ? desired : visible + (desired - visible) * Math.min(1, dt * 5);
    if (Math.abs(visible - desired) < 0.02) visible = desired;

    routes.forEach((r, i) => {
      r.amount = Math.max(0, Math.min(1, (visible - r.a) / (r.b - r.a)));
      if (i === 0 && desired > 0) r.amount = Math.max(r.amount, 0.07); // a trickle from the first keystroke
      r.reveal.setAttribute('stroke-dashoffset', String(r.length * (1 - r.amount)));
      r.highlights.setAttribute('stroke-dashoffset', String(reduced.matches ? 0 : -now * (r.fall ? 0.105 : 0.042)));
    });

    const landed = visible >= 99.95;
    if (landed !== wet) {
      wet = landed;
      landedAt = landed ? now : 0;
      pool.setAttribute('fill', wet ? WET_BASIN : DRY_BASIN);
    }

    // Completion beat: the last stream flashes bright and one large ring leaves the landing point.
    const t = landedAt ? (now - landedAt) / 1400 : 1;
    const lastR = routes[routes.length - 1];
    lastR.highlights.setAttribute('opacity', String(0.7 + (t < 1 ? (1 - t) * 0.3 : 0)));
    lastR.highlights.setAttribute('stroke-width', String((lastR.fall ? 3 : 2) + (t < 0.5 ? (1 - t * 2) * 3 : 0)));
    if (t < 1 && !reduced.matches) {
      const e = 1 - Math.pow(1 - t, 3);
      burst.setAttribute('rx', String(6 + e * 96));
      burst.setAttribute('ry', String(2 + e * 27));
      burst.setAttribute('opacity', String((1 - t) * 0.9));
    } else {
      burst.setAttribute('opacity', '0');
    }

    ripples.forEach((ring, i) => {
      const phase = reduced.matches ? (i + 1) / 4 : (now / 1800 + i / 3) % 1;
      ring.setAttribute('rx', String(4 + phase * 57));
      ring.setAttribute('ry', String(1 + phase * 15));
      ring.setAttribute('opacity', String(landed ? (1 - phase) * 0.65 : 0));
    });

    frameId = requestAnimationFrame(frame);
  }
  frameId = requestAnimationFrame(frame);

  return {
    setProgress(p) {
      const v = Number(p);
      desired = Number.isFinite(v) ? Math.max(0, Math.min(100, v)) : 0;
    },
    reset() {
      desired = 0;
      visible = 0;
    },
    destroy() {
      destroyed = true;
      cancelAnimationFrame(frameId);
      svg.replaceChildren();
    },
  };
}
