// modi_edu_agent /chat 계약 타입 — 라이브 응답으로 검증됨

export type VibeMode = "quick" | "design";     // 바로 만들기 | 설계부터
export type CodingType = "blockly" | "react";  // 하드웨어(MODI 블록) | 소프트웨어(웹)

/** 코드 보기 3종 (하드웨어). done.blockly_code_langs 로 내려온다. */
export interface CodeLangs {
  python?: string;
  javascript?: string;
  c?: string;
}

/** 진행 단계 (agent_step / agent_step_update) */
export interface AgentStep {
  step: number;
  description: string;
  action: string;
  status: "running" | "success" | "error" | string;
}

/** 모디 준비물 (모디 탭용) */
export interface ModiModule { key: string; role: string; reason: string; count: number; }
export interface ModiModules {
  modules: ModiModule[];
  layout?: unknown[];
  assembly?: string[];
  title?: string;
  description?: string;
}

/** 학습 노트 (학습 노트 탭용) */
export interface LearningNote { title: string; what: string; why: string; where: string; }

/** done 이벤트 — 라이브 응답에서 확인된 필드 */
export interface DoneEvent {
  type: "done";
  phase?: string;
  diagram?: string;
  generated_code?: Record<string, string> | null; // 소프트웨어(react) 산출물. 하드웨어면 null
  blockly_xml?: string | null;                     // 모디 블록 에디터(moditor)로 주입 가능
  blockly_flowchart?: unknown[] | null;            // 흐름도 탭
  blockly_detail?: string | null;                  // 동작 설명
  blockly_code_langs?: CodeLangs | null;           // ★ 코드 보기 py/js/c
  modi_modules?: ModiModules | null;               // 모디 탭
  design_doc?: unknown;                            // 설계 문서 탭
  learning_notes?: LearningNote[] | null;          // 학습 노트 탭
  agent_steps?: unknown;
}

/** 스트림 이벤트 전체 */
export type VibeEvent =
  | { type: "status"; message: string }
  | { type: "token"; text: string }
  | { type: "agent_step"; step: number; description: string; action: string; status: string }
  | { type: "agent_step_update"; step: number; status: string }
  | { type: "blockly_ready"; blockly_xml?: string; modi_modules?: ModiModules; phase?: string }
  | { type: "tool_call"; name: string; description?: string }
  | { type: "tool_result"; name: string; result?: string }
  | DoneEvent
  | { type: string; [k: string]: unknown };
