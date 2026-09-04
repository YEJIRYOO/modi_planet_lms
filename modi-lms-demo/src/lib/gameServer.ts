/* 로컬에서 돌고 있는 게임 서버(1942 / Tilt Match / Loop Studio)를 확인하는 클라이언트.

   게임은 파이썬 http.server 로 127.0.0.1:<port> 에 떠 있고, MODI 하드웨어는
   pymodi-plus 가 파이썬 쪽에서 직접 잡는다. 브라우저는 하드웨어에 직접 접근하지 않는다.
   → LMS 가 할 일은 (1) 서버가 떠 있는지 확인 (2) iframe 으로 띄우기, 두 가지뿐이다.

   ⚠️ /api/health 의 JSON 을 읽으려면 게임 서버가 CORS 헤더를 보내야 한다.
      app.py 에 Access-Control-Allow-Origin 을 추가하지 않으면 reachable 판정만 가능하고
      모듈 연결 상태(connected/mode)는 읽을 수 없다. 자세한 내용은 인수인계 메모 참고. */

export type GameMode = 'real' | 'mock';

export interface GameHealth {
  /** 서버가 응답했는지 */
  reachable: boolean;
  /** health JSON 을 읽을 수 있었는지 (CORS 허용 여부) */
  readable: boolean;
  mode: GameMode | null;
  /** MODI 모듈이 실제로 붙었는지 */
  connected: boolean;
  error: string | null;
}

export const gameUrl = (port: number) => `http://127.0.0.1:${port}/`;
const healthUrl = (port: number) => `http://127.0.0.1:${port}/api/health`;

const OFFLINE: GameHealth = { reachable: false, readable: false, mode: null, connected: false, error: null };

/** 응답이 없거나 느리면 실패로 본다. 실행 안내를 빨리 띄우는 게 중요하다. */
const TIMEOUT_MS = 1200;

export async function probeGame(port: number): Promise<GameHealth> {
  // 1차: CORS 가 열려 있으면 JSON 까지 읽는다.
  try {
    const res = await fetch(healthUrl(port), { signal: AbortSignal.timeout(TIMEOUT_MS), cache: 'no-store' });
    if (res.ok) {
      const j = (await res.json()) as { mode?: string; connected?: boolean; error?: string | null };
      return {
        reachable: true,
        readable: true,
        mode: j.mode === 'real' ? 'real' : 'mock',
        connected: !!j.connected,
        error: j.error ?? null,
      };
    }
  } catch {
    // CORS 차단·타임아웃·미실행이 전부 여기로 온다 → 2차 확인으로 넘어간다.
  }

  // 2차: no-cors 로는 본문을 못 읽지만, 요청이 성공하면 서버는 떠 있다는 뜻이다.
  try {
    await fetch(healthUrl(port), { mode: 'no-cors', signal: AbortSignal.timeout(TIMEOUT_MS), cache: 'no-store' });
    return { ...OFFLINE, reachable: true };
  } catch {
    return OFFLINE;
  }
}
