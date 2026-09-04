// 난이도 바로가기 — 사이드바와 홈 히어로가 같은 목록을 쓴다(예전엔 각자 하드코딩).
// thumb 은 modi_planet_3.0 레포의 공식 코스 카드 썸네일(web/assets/brand/).
export const LEVELS = [
  { k: '초', name: '초급 · 초등', sub: '5~6학년 · 실과', thumb: '/brand/beginner-thumbnail.png' },
  { k: '중', name: '중급 · 중등', sub: '1~3학년 · 정보', thumb: '/brand/intermediate-thumbnail.png' },
  { k: '고', name: '고급 · 고등', sub: '1~2학년 · 정보', thumb: '/brand/advanced-thumbnail.png' },
] as const;
