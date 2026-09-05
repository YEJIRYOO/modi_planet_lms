export const DEVELOPMENT_BASE_MS = 3 * 60 * 1000;
export const DEVELOPMENT_RANDOM_MIN_MS = 60 * 1000;
export const DEVELOPMENT_RANDOM_MAX_MS = 80 * 1000;

export type DevelopmentKind = 'software' | 'hybrid' | 'hardware';

export interface DevelopmentProgressState {
  progress: number;
  elapsedSeconds: number;
  remainingSeconds: number;
  totalSeconds: number;
  label: string;
  detail: string;
  logs: string[];
}

interface Phase {
  at: number;
  label: string;
  detail: string;
  log: string;
}

const COMMON_PHASES: Phase[] = [
  { at: 0, label: '요청을 분석하는 중', detail: '기능, 입력, 조건과 완료 기준을 작업 단위로 나누고 있습니다.', log: 'prompt/requirements.md 분석' },
  { at: .12, label: '프로젝트 구조를 설계하는 중', detail: '화면과 상태, 데이터 흐름 사이의 연결 관계를 정리하고 있습니다.', log: 'src/app 구조 및 상태 모델 설계' },
  { at: .28, label: '화면 코드를 작성하는 중', detail: '주요 화면, 컨트롤과 사용자 피드백 컴포넌트를 구성하고 있습니다.', log: 'src/components 인터페이스 구현' },
  { at: .46, label: '입력 동작을 연결하는 중', detail: '사용자 입력을 규칙과 화면 상태 변화에 연결하고 있습니다.', log: 'src/input 이벤트 매핑' },
  { at: .62, label: '핵심 로직을 구현하는 중', detail: '조건, 점수, 진행 상태와 예외 처리 코드를 작성하고 있습니다.', log: 'src/core 실행 로직 작성' },
  { at: .78, label: '오류 상황을 점검하는 중', detail: '중복 입력, 연결 해제와 경계값에서의 동작을 확인하고 있습니다.', log: 'tests/edge-cases 검증' },
  { at: .90, label: '코드를 빌드하는 중', detail: '작성한 파일의 타입과 실행 흐름을 검사하고 있습니다.', log: 'build/type-check 실행' },
  { at: .97, label: '미리보기를 준비하는 중', detail: '최종 결과와 학습 단계에서 사용할 산출물을 정리하고 있습니다.', log: 'preview 최종 번들 준비' },
];

const KIND_LOGS: Record<DevelopmentKind, Partial<Record<number, string>>> = {
  software: {
    2: 'src/components 화면 컴포넌트 작성',
    3: 'src/interactions 브라우저 입력 연결',
    4: 'src/features 애플리케이션 로직 구현',
  },
  hybrid: {
    1: 'src/hardware MODI 데이터 흐름 설계',
    3: 'src/hardware 센서·버튼 입력 연결',
    4: 'src/core 센서 조건과 게임 규칙 구현',
  },
  hardware: {
    1: 'src/modules MODI 구성 설계',
    3: 'src/modules 입출력 모듈 연결',
    4: 'src/control 모듈 제어 로직 구현',
  },
};

export function createDevelopmentDuration(random = Math.random): number {
  const extra = DEVELOPMENT_RANDOM_MIN_MS
    + Math.floor(random() * (DEVELOPMENT_RANDOM_MAX_MS - DEVELOPMENT_RANDOM_MIN_MS + 1));
  return DEVELOPMENT_BASE_MS + extra;
}

function snapshot(kind: DevelopmentKind, startedAt: number, durationMs: number): DevelopmentProgressState {
  const elapsedMs = Math.min(durationMs, Date.now() - startedAt);
  const ratio = durationMs === 0 ? 1 : elapsedMs / durationMs;
  let phaseIndex = 0;
  for (let index = 0; index < COMMON_PHASES.length; index += 1) {
    if (ratio >= COMMON_PHASES[index].at) phaseIndex = index;
  }
  const phase = COMMON_PHASES[phaseIndex];
  const logs = COMMON_PHASES.slice(0, phaseIndex + 1).map((item, index) => KIND_LOGS[kind][index] ?? item.log);
  return {
    progress: Math.min(100, Math.max(1, Math.round(ratio * 100))),
    elapsedSeconds: Math.floor(elapsedMs / 1000),
    remainingSeconds: Math.max(0, Math.ceil((durationMs - elapsedMs) / 1000)),
    totalSeconds: Math.ceil(durationMs / 1000),
    label: phase.label,
    detail: phase.detail,
    logs,
  };
}

export async function runDevelopmentTimeline(
  kind: DevelopmentKind,
  onProgress: (state: DevelopmentProgressState) => void,
  signal?: AbortSignal,
  durationMs = createDevelopmentDuration(),
): Promise<boolean> {
  const startedAt = Date.now();

  return new Promise((resolve) => {
    let timer = 0;
    const finish = (completed: boolean) => {
      window.clearInterval(timer);
      signal?.removeEventListener('abort', abort);
      resolve(completed);
    };
    const abort = () => finish(false);
    const update = () => {
      if (signal?.aborted) return finish(false);
      const state = snapshot(kind, startedAt, durationMs);
      onProgress(state);
      if (state.remainingSeconds === 0) finish(true);
    };

    signal?.addEventListener('abort', abort, { once: true });
    update();
    if (!signal?.aborted && durationMs > 0) timer = window.setInterval(update, 1000);
  });
}
