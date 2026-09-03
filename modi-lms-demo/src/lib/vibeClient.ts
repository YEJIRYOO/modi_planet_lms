// modi_edu_agent /chat 스트리밍 클라이언트 (라이브 응답으로 검증된 계약)
// Vite 프록시(/agent → ai.modiplanet)를 거쳐 호출하므로 브라우저 CORS 문제가 없다.

export type VibeMode = 'quick' | 'design';    // 바로 만들기 | 설계부터
export type CodingType = 'blockly' | 'react'; // 하드웨어(MODI) | 소프트웨어(웹)

export interface CodeLangs {
  python?: string;
  javascript?: string;
  c?: string;
}

// ── done 이벤트가 실어오는 산출물들 (탭들이 읽는다) ──
export interface FlowNode {
  type: string;   // start | loop | condition | action | end ...
  label: string;
  children?: FlowNode[];
  branches?: { label: string; children?: FlowNode[] }[];
}
export interface LearningNote { title: string; what: string; why: string; where: string; }
export interface ModiModule { key: string; role: string; reason: string; count: number; }
export interface ModiModules {
  modules: ModiModule[];
  assembly?: string[];
  layout?: unknown[];
  title?: string;
  description?: string;
}
export interface DesignFeature { name: string; description?: string; priority?: string; }
export interface DesignDoc {
  project_name?: string;
  description?: string;
  users?: string[];
  features?: DesignFeature[];
  user_flows?: string[];
}

/** done 이벤트에서 뽑아 탭들에 공유하는 결과 묶음 */
export interface VibeResult {
  blockly_code_langs?: CodeLangs | null;
  blockly_xml?: string | null;
  blockly_flowchart?: FlowNode[] | null;
  blockly_detail?: string | null;
  learning_notes?: LearningNote[] | null;
  modi_modules?: ModiModules | null;
  design_doc?: DesignDoc | null;
  generated_code?: Record<string, string> | null;
}

// 스트림 이벤트 (다루는 것만)
export type VibeEvent =
  | { type: 'status'; message: string }
  | { type: 'token'; text: string }
  | { type: 'agent_step' }
  | { type: 'agent_step_update' }
  | { type: 'blockly_ready' }
  | ({ type: 'done' } & VibeResult);

export interface SendParams {
  sessionId: string;
  message: string;
  mode: VibeMode;
  codingType: CodingType;
  signal?: AbortSignal;
}

/** /chat SSE 스트림을 읽어 이벤트마다 onEvent 를 호출한다. */
export async function streamChat(
  p: SendParams,
  onEvent: (ev: VibeEvent) => void,
): Promise<void> {
  const res = await fetch('/agent/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: p.sessionId,
      message: p.message,
      mode: p.mode,
      coding_type: p.codingType,
      runtime_error: '',
    }),
    signal: p.signal,
  });
  if (!res.ok || !res.body) throw new Error(`chat 요청 실패: ${res.status}`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let sep = buffer.indexOf('\n\n');
    while (sep !== -1) {
      const raw = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);
      for (const line of raw.split('\n')) {
        const s = line.replace(/^\s+/, '');
        if (!s.startsWith('data:')) continue;
        const json = s.slice(5).trim();
        if (!json) continue;
        try {
          onEvent(JSON.parse(json) as VibeEvent);
        } catch {
          // 파싱 실패 라인 무시
        }
      }
      sep = buffer.indexOf('\n\n');
    }
  }
}
