/* MODI Planet 공식 워드마크.
   web/assets/brand/SOURCES.md 의 브랜드 규정에 따라 원본 SVG 를 그대로 쓴다.
   재색상·왜곡·크롭·심볼 분리·재작도 금지이므로, 크기(가로폭)만 조절한다.
   접힌 레일(≤760px)에서는 .app-shell__logo 규칙이 숨긴다 —
   공식 favicon 이 16×16 뿐이라 확대하면 뭉개지고, 로고는 8.4:1 가로형이라 축소도 불가. */
export function BrandLogo({ width = 148, className }: { width?: number; className?: string }) {
  return (
    <img
      className={className}
      src="/brand/logo.svg"
      alt="MODI Planet"
      style={{ display: 'block', width, maxWidth: '100%', height: 'auto' }}
    />
  );
}
