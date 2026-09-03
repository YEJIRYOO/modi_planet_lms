import {
  createContext, useContext, useCallback, useMemo, useRef, useState,
  type ReactNode,
} from "react";
import { streamChat } from "./vibeClient";
import type {
  AgentStep, CodeLangs, CodingType, DoneEvent, VibeMode, VibeEvent,
} from "./types";

interface ChatMessage { role: "user" | "assistant"; text: string; }

interface VibeState {
  messages: ChatMessage[];
  status: string;                     // 진행 상태(status 이벤트)
  steps: AgentStep[];                 // 진행 단계(에이전트 스텝 UI용)
  isStreaming: boolean;
  codeLangs: CodeLangs;               // 코드 보기(py/js/c)
  webFiles: Record<string, string>;  // 소프트웨어(react) 산출물
  result: DoneEvent | null;           // ★ 마지막 done 전체 — 흐름도/학습노트/모디/설계문서 탭이 여기서 읽음
  codingType: CodingType;
  setCodingType: (t: CodingType) => void;
  send: (message: string, mode: VibeMode) => Promise<void>;
}

const VibeCtx = createContext<VibeState | null>(null);

export function useVibe(): VibeState {
  const ctx = useContext(VibeCtx);
  if (!ctx) throw new Error("useVibe 는 <VibeProvider> 안에서만 사용하세요.");
  return ctx;
}

export function VibeProvider(
  { children, defaultCodingType = "blockly" }:
  { children: ReactNode; defaultCodingType?: CodingType },
) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState("");
  const [steps, setSteps] = useState<AgentStep[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [codeLangs, setCodeLangs] = useState<CodeLangs>({});
  const [webFiles, setWebFiles] = useState<Record<string, string>>({});
  const [result, setResult] = useState<DoneEvent | null>(null);
  const [codingType, setCodingType] = useState<CodingType>(defaultCodingType);

  // 세션 id 는 한 번만 생성해 유지 → "이거 수정해줘" 같은 수정 턴에도 맥락이 이어진다.
  const sessionIdRef = useRef<string>(
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `demo-${Date.now()}`,
  );

  // 재시도 중 흘러나오는 중간 토큰("음, 음...")을 최종 요약이 덮어쓰도록 하는 플래그.
  // agent_step 계열 이벤트 뒤 첫 토큰이 오면 assistant 버블을 리셋하고 새로 채운다.
  const pendingResetRef = useRef(false);

  const send = useCallback(async (message: string, mode: VibeMode) => {
    if (!message.trim() || isStreaming) return;
    setIsStreaming(true);
    setStatus("");
    setSteps([]);
    pendingResetRef.current = false;
    setMessages((m) => [...m, { role: "user", text: message }, { role: "assistant", text: "" }]);

    const onEvent = (ev: VibeEvent) => {
      switch (ev.type) {
        case "status":
          setStatus((ev as { message?: string }).message ?? "");
          break;

        case "agent_step": {
          const s = ev as { step: number; description: string; action: string; status: string };
          pendingResetRef.current = true;
          setSteps((prev) => {
            const others = prev.filter((p) => p.step !== s.step);
            return [...others, { step: s.step, description: s.description, action: s.action, status: s.status }]
              .sort((a, b) => a.step - b.step);
          });
          break;
        }

        case "agent_step_update": {
          const s = ev as { step: number; status: string };
          pendingResetRef.current = true;
          setSteps((prev) => prev.map((p) => (p.step === s.step ? { ...p, status: s.status } : p)));
          break;
        }

        case "blockly_ready":
          pendingResetRef.current = true; // 블록 준비 완료 → 다음 토큰은 최종 요약
          break;

        case "token": {
          const t = (ev as { text?: string }).text ?? "";
          const reset = pendingResetRef.current; // 동기적으로 캡처(비동기 updater 전에)
          pendingResetRef.current = false;
          setMessages((m) => {
            const copy = m.slice();
            const last = copy[copy.length - 1];
            if (last?.role === "assistant") {
              copy[copy.length - 1] = { ...last, text: (reset ? "" : last.text) + t };
            }
            return copy;
          });
          break;
        }

        case "done": {
          const d = ev as DoneEvent;
          setResult(d);                                          // 전체 산출물 보관(다른 탭용)
          if (d.blockly_code_langs) setCodeLangs(d.blockly_code_langs); // ★ 코드 보기
          if (d.generated_code) setWebFiles(d.generated_code);   // 소프트웨어 미리보기
          setStatus("");
          break;
        }

        default:
          break; // tool_call / tool_result 등은 데모에선 생략
      }
    };

    try {
      await streamChat({ sessionId: sessionIdRef.current, message, mode, codingType }, onEvent);
    } catch (e) {
      setMessages((m) => {
        const copy = m.slice();
        const last = copy[copy.length - 1];
        if (last?.role === "assistant") {
          copy[copy.length - 1] = { ...last, text: last.text || `오류: ${(e as Error).message}` };
        }
        return copy;
      });
    } finally {
      setIsStreaming(false);
    }
  }, [codingType, isStreaming]);

  const value = useMemo<VibeState>(() => ({
    messages, status, steps, isStreaming, codeLangs, webFiles, result,
    codingType, setCodingType, send,
  }), [messages, status, steps, isStreaming, codeLangs, webFiles, result, codingType, send]);

  return <VibeCtx.Provider value={value}>{children}</VibeCtx.Provider>;
}
