const env = import.meta.env;

// 모디 블록 에디터 (test-moditor는 존재하지 않아 dev-moditor로 교정)
export const MODITOR_URL =
  env.VITE_MODITOR_URL || 'https://dev-moditor.modiplanet.com/';

// 코드 에디터 (Mockly)
export const MOCKLY_URL =
  env.VITE_MOCKLY_URL || 'https://dev-moditor.modiplanet.com/';

// 바이브 코딩 (수정 예정)
export const VIBE_CODING_URL =
  (env.VITE_VIBE_CODING_URL || 'https://ai.modiplanet.com').replace(/\/$/, '');
