import type { VibeEvent, VibeMode, CodingType } from "./types";

// ai.modiplanet 백엔드는 앱 경로가 /agent/* 다.
// Vite dev 프록시가 /agent → https://ai.modiplanet.com 로 넘겨서(같은 오리진처럼 보임)
// 브라우저 CORS/preflight 문제를 원천 차단한다. (vite.config.ts 참고)
const CHAT_URL = "/agent/chat";

export interface SendParams {
  sessionId: string;
  message: string;
  mode: VibeMode;         // "quick"(바로 만들기) | "design"(설계부터)
  codingType: CodingType; // "blockly"(하드웨어) | "react"(소프트웨어)
  runtimeError?: string;
  signal?: AbortSignal;
}

/**
 * /chat SSE 스트림을 읽어 이벤트마다 onEvent 를 호출한다.
 * 서버는 `data: {json}\n\n` 형식으로 status / token / tool_* / done 을 흘려보낸다.
 */
export async function streamChat(
  params: SendParams,
  onEvent: (ev: VibeEvent) => void,
): Promise<void> {
  const res = await fetch(CHAT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      session_id: params.sessionId,
      message: params.message,
      mode: params.mode,
      coding_type: params.codingType,
      runtime_error: params.runtimeError ?? "",
    }),
    signal: params.signal,
  });

  if (!res.ok || !res.body) {
    throw new Error(`chat 요청 실패: ${res.status} ${res.statusText}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  // SSE 이벤트는 빈 줄(\n\n)로 구분된다. 청크가 이벤트 중간에서 끊길 수 있어 버퍼링한다.
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let sep: number;
    while ((sep = buffer.indexOf("\n\n")) !== -1) {
      const rawEvent = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);

      for (const line of rawEvent.split("\n")) {
        const trimmed = line.replace(/^\s+/, "");
        if (!trimmed.startsWith("data:")) continue; // 주석(:)·event: 라인은 무시
        const jsonStr = trimmed.slice(5).trim();
        if (!jsonStr) continue;
        try {
          onEvent(JSON.parse(jsonStr) as VibeEvent);
        } catch {
          // 파싱 실패 라인은 스킵 (부분 청크는 위 버퍼링이 막아줌)
        }
      }
    }
  }
}
