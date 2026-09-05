// 난이도 바로가기 — 사이드바와 홈 히어로가 같은 목록을 쓴다(예전엔 각자 하드코딩).
// thumb 은 modi_planet_3.0 레포의 공식 코스 카드 썸네일(web/assets/brand/).
export const LEVELS = [
  { value: 'elementary', k: '초', name: '초급', sub: '초급 프로젝트', thumb: '/brand/beginner-thumbnail.png' },
  { value: 'middle', k: '중', name: '중급', sub: '중급 프로젝트', thumb: '/brand/intermediate-thumbnail.png' },
  { value: 'high', k: '고', name: '고급', sub: '고급 프로젝트', thumb: '/brand/advanced-thumbnail.png' },
] as const;

export type CourseLevel = typeof LEVELS[number]['value'];

export const LEVEL_NAME: Record<CourseLevel, string> = {
  elementary: '초급',
  middle: '중급',
  high: '고급',
};
