/**
 * 학습 진행 저장소 (localStorage 기반, 데모용).
 * 나중에 Firebase/백엔드로 교체 시 이 파일만 바꾸면 됨.
 *
 * 저장 구조: { [courseId]: 'in_progress' | 'done' }
 */
const KEY = 'modi_demo_progress';

export type ProgressStatus = 'in_progress' | 'done';
type ProgressMap = Record<string, ProgressStatus>;

function read(): ProgressMap {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}');
  } catch {
    return {};
  }
}

function write(map: ProgressMap) {
  localStorage.setItem(KEY, JSON.stringify(map));
}

/** 수강 시작 시 호출 (이미 완료면 유지) */
export function markStarted(courseId: string) {
  const m = read();
  if (m[courseId] !== 'done') m[courseId] = 'in_progress';
  write(m);
}

/** 수강 완료 버튼 */
export function markDone(courseId: string) {
  const m = read();
  m[courseId] = 'done';
  write(m);
}

export function getStatus(courseId: string): ProgressStatus | undefined {
  return read()[courseId];
}

export function getAllProgress(): ProgressMap {
  return read();
}

/** 데모 초기화(다음 체험자용) */
export function resetProgress() {
  localStorage.removeItem(KEY);
}
