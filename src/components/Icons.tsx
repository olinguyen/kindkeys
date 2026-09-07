/** Lucide icons, inlined at the system's stroke-width of 2.75. */

type P = { size?: number };

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
});

export const InfoIcon = ({ size = 15 }: P) => (
  <svg {...base(size)}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4" />
    <path d="M12 8h.01" />
  </svg>
);

export const RotateIcon = ({ size = 14 }: P) => (
  <svg {...base(size)}>
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
  </svg>
);

export const ShuffleIcon = ({ size = 13 }: P) => (
  <svg {...base(size)}>
    <path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.7-1.1 2-1.7 3.3-1.7H22" />
    <path d="m18 2 4 4-4 4" />
    <path d="M2 6h1.9c1.5 0 2.9.9 3.6 2.2" />
    <path d="M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8" />
    <path d="m18 14 4 4-4 4" />
  </svg>
);

export const PencilIcon = ({ size = 13 }: P) => (
  <svg {...base(size)}>
    <path d="M12 20h9" />
    <path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z" />
  </svg>
);

export const ArrowRightIcon = ({ size = 14 }: P) => (
  <svg {...base(size)}>
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
);

export const CloseIcon = ({ size = 16 }: P) => (
  <svg {...base(size)}>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

export const WavesIcon = ({ size = 16 }: P) => (
  <svg {...base(size)}>
    <path d="M2 12c2-3 5-4 8-4s5 2 7 2 4-1 5-2" />
    <path d="M2 18c2-3 5-4 8-4s5 2 7 2 4-1 5-2" />
    <path d="M2 6c2-3 5-4 8-4s5 2 7 2 4-1 5-2" />
  </svg>
);

export const CompassIcon = ({ size = 16 }: P) => (
  <svg {...base(size)}>
    <circle cx="12" cy="12" r="10" />
    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
  </svg>
);

export const BookIcon = ({ size = 16 }: P) => (
  <svg {...base(size)}>
    <path d="M12 7v14" />
    <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />
  </svg>
);
