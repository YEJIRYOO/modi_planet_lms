// MODI Planet 3.0 — 디자인 토큰 (초안 modi_planet_3.0/web :root 계승 + 리부트)
// ※ src/index.css 의 :root 커스텀 프로퍼티와 1:1 대응한다. 한쪽만 고치지 말 것.
export const t = {
  coral: '#ff4547', coralStrong: '#db2d2f', coralSoft: '#ffe8e3', coralPale: '#fff6f4',
  // 흰 글씨를 얹는 면(주 버튼·배지)용. coral(#ff4547)은 흰 글씨 대비가 3.4:1 이라
  // 15px 굵기 텍스트 기준 WCAG AA(4.5:1)에 못 미쳐, 4.7:1 인 coralStrong 을 쓴다.
  coralInk: '#db2d2f',
  ink: '#2b2929', inkSoft: '#4a4848', muted: '#6b6b70',
  line: '#ececef', lineStrong: '#dddddd',
  surface: '#ffffff', soft: '#f5f5f7', warm: '#fff6f4',
  blue: '#1a334e', blueSoft: '#edf3f8',
  green: '#207a45', greenSoft: '#e8f6ec',
  purple: '#7c3aed', purpleSoft: '#f5f3ff',
  rSm: 12, rMd: 18, rLg: 26,
  shSm: '0 1px 2px rgba(28,31,35,.03), 0 5px 18px rgba(28,31,35,.045)',
  shMd: '0 16px 42px rgba(32,35,38,.10)',
  shCoral: '0 10px 24px rgba(255,69,71,.28)',
  font: '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Malgun Gothic", system-ui, sans-serif',
  mono: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
  // 상단바 높이. 예전엔 88px(상세 aside) · 65px(도구 페이지)로 제각각이었다.
  topbar: 58,
} as const;

// 상단바 아래에 붙는 sticky 요소 / 전체높이 영역이 공통으로 쓰는 값.
export const BELOW_TOPBAR = `calc(100dvh - ${t.topbar}px)`;
export const STICKY_TOP = t.topbar + 20;
