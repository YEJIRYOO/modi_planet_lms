import type { SVGProps } from 'react';

/* MODI Planet 아이콘 세트.
   예전에는 사이드바가 텍스트 기호(⌂ ◫ ▤ ⌨ ✦), 카드·로그인이 이모지(🔌 🖥️ 🧩 🎒 🏫)로
   서로 다른 체계였다. 기호는 폰트마다 글리프와 베이스라인이 달라 Windows 에서 크기가
   제각각이었고, 이모지는 OS 별로 그림이 바뀐다. 전부 currentColor 스트로크 SVG 로 통일한다.
   size 만 주면 어디서든 같은 굵기·같은 광학 크기로 그려진다. */

export type IconName =
  | 'home' | 'course' | 'user' | 'terminal' | 'sparkle'
  | 'chip' | 'monitor' | 'layers'
  | 'backpack' | 'board'
  | 'chevronRight' | 'check' | 'close' | 'send'
  | 'note' | 'parts' | 'preview' | 'blocks' | 'doc' | 'flow';

type Props = Omit<SVGProps<SVGSVGElement>, 'name'> & { name: IconName; size?: number };

const PATHS: Record<IconName, React.ReactNode> = {
  home: (
    <>
      <path d="M3.4 10.3 12 3.4l8.6 6.9" />
      <path d="M5.9 9.2v10.2a1.1 1.1 0 0 0 1.1 1.1h3.4v-5.2h3.2v5.2h3.4a1.1 1.1 0 0 0 1.1-1.1V9.2" />
    </>
  ),
  course: (
    <>
      <path d="M3.8 5.4A1.7 1.7 0 0 1 5.5 3.7h4.2A2.3 2.3 0 0 1 12 5.1a2.3 2.3 0 0 1 2.3-1.4h4.2a1.7 1.7 0 0 1 1.7 1.7v11.9a1.7 1.7 0 0 1-1.7 1.7h-4.4A2 2 0 0 0 12 20.6a2 2 0 0 0-2.1-1.6H5.5a1.7 1.7 0 0 1-1.7-1.7z" />
      <path d="M12 5.9v14.7" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8.1" r="3.6" />
      <path d="M4.9 20.4a7.3 7.3 0 0 1 14.2 0" />
    </>
  ),
  terminal: (
    <>
      <rect x="3" y="4.6" width="18" height="14.8" rx="2.6" />
      <path d="m7.7 10.3 2.5 2.2-2.5 2.2" />
      <path d="M13 14.9h3.5" />
    </>
  ),
  sparkle: (
    <>
      <path d="m12 3.3 1.7 5.1 5.1 1.7-5.1 1.7L12 16.9l-1.7-5.1L5.2 10l5.1-1.7z" />
      <path d="m18.3 15.7.6 1.9 1.9.6-1.9.6-.6 1.9-.6-1.9-1.9-.6 1.9-.6z" />
    </>
  ),
  chip: (
    <>
      <rect x="7.2" y="7.2" width="9.6" height="9.6" rx="2.2" />
      <path d="M9.7 3.7v3.5M14.3 3.7v3.5M9.7 16.8v3.5M14.3 16.8v3.5M3.7 9.7h3.5M3.7 14.3h3.5M16.8 9.7h3.5M16.8 14.3h3.5" />
    </>
  ),
  monitor: (
    <>
      <rect x="2.9" y="4.5" width="18.2" height="12.2" rx="2.2" />
      <path d="M8.7 20.3h6.6M12 16.7v3.6" />
    </>
  ),
  layers: (
    <>
      <path d="m12 3.3 8.3 4.3-8.3 4.3-8.3-4.3z" />
      <path d="m3.7 12.1 8.3 4.3 8.3-4.3" />
      <path d="m3.7 16.4 8.3 4.3 8.3-4.3" />
    </>
  ),
  backpack: (
    <>
      <path d="M6.2 9.6a5.8 5.8 0 0 1 11.6 0v8.9a2 2 0 0 1-2 2H8.2a2 2 0 0 1-2-2z" />
      <path d="M9.4 8.3V6.6a2.6 2.6 0 0 1 5.2 0v1.7" />
      <path d="M9.3 13.5h5.4v3.4H9.3z" />
    </>
  ),
  board: (
    <>
      <rect x="3.2" y="3.9" width="17.6" height="11.7" rx="2.1" />
      <path d="M12 15.6v4.5M8.5 20.4 12 17.5l3.5 2.9" />
      <path d="m7.9 10.8 2.4 2.1 2-2.6 2.1 2.5 1.7-1.4" />
    </>
  ),
  chevronRight: <path d="m9.6 5.6 6.4 6.4-6.4 6.4" />,
  check: <path d="m5.2 12.6 4.5 4.4 9.1-9.6" />,
  close: <path d="m6.2 6.2 11.6 11.6M17.8 6.2 6.2 17.8" />,
  send: <path d="M12 19.6V5M5.7 11.3 12 5l6.3 6.3" />,
  note: (
    <>
      <path d="M5.4 4.6a1.7 1.7 0 0 1 1.7-1.7h6.4l4.9 4.9v11.6a1.7 1.7 0 0 1-1.7 1.7H7.1a1.7 1.7 0 0 1-1.7-1.7z" />
      <path d="M13.3 2.9v5.1h5.1M8.6 13h6.8M8.6 16.6h4.6" />
    </>
  ),
  parts: (
    <>
      <rect x="3.4" y="3.4" width="7.4" height="7.4" rx="2" />
      <rect x="13.2" y="3.4" width="7.4" height="7.4" rx="2" />
      <rect x="3.4" y="13.2" width="7.4" height="7.4" rx="2" />
      <path d="M17 13.4v7M13.5 16.9h7" />
    </>
  ),
  preview: (
    <>
      <path d="M2.6 12S6 5.6 12 5.6 21.4 12 21.4 12 18 18.4 12 18.4 2.6 12 2.6 12" />
      <circle cx="12" cy="12" r="3.1" />
    </>
  ),
  blocks: (
    <>
      <rect x="3.6" y="4.2" width="16.8" height="6.2" rx="2" />
      <rect x="6.4" y="13.6" width="14" height="6.2" rx="2" />
      <path d="M8.6 10.4v3.2" />
    </>
  ),
  doc: (
    <>
      <rect x="4.6" y="3.2" width="14.8" height="17.6" rx="2" />
      <path d="M8.4 8.2h7.2M8.4 12h7.2M8.4 15.8h4.4" />
    </>
  ),
  flow: (
    <>
      <rect x="8.8" y="2.9" width="6.4" height="4.6" rx="1.4" />
      <rect x="2.9" y="16.5" width="6.4" height="4.6" rx="1.4" />
      <rect x="14.7" y="16.5" width="6.4" height="4.6" rx="1.4" />
      <path d="M12 7.5v3.6M6.1 16.5v-2.7h11.8v2.7M6.1 13.8h11.8" />
    </>
  ),
};

export function Icon({ name, size = 20, ...rest }: Props) {
  return (
    <svg
      viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true" focusable="false" style={{ flex: `0 0 ${size}px`, display: 'block' }}
      {...rest}
    >
      {PATHS[name]}
    </svg>
  );
}

