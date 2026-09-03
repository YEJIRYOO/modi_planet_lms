import { useState } from "react";
import { useVibe } from "./VibeContext";
import type { VibeMode } from "./types";

export function VibeCoding() {
  const { messages, status, isStreaming, send } = useVibe();
  const [mode, setMode] = useState<VibeMode>("quick"); // 기본: 바로 만들기
  const [input, setInput] = useState("");

  const submit = () => {
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput("");
    void send(text, mode);
  };

  return (
    <div className="vibe-panel">
      <div className="vibe-messages">
        {messages.map((m, i) => (
          <div key={i} className={`vibe-msg vibe-msg--${m.role}`}>
            {m.text || (isStreaming && i === messages.length - 1 ? "…" : "")}
          </div>
        ))}
        {status && <div className="vibe-status">… {status}</div>}
      </div>

      <div className="vibe-input">
        <div className="vibe-modes">
          <button
            type="button"
            className={mode === "quick" ? "active" : ""}
            onClick={() => setMode("quick")}
          >
            바로 만들기
          </button>
          <button
            type="button"
            className={mode === "design" ? "active" : ""}
            onClick={() => setMode("design")}
          >
            설계부터
          </button>
          <span className="vibe-mode-hint">
            {mode === "quick"
              ? "설명하면 바로 MODI 코드를 만들어요"
              : "설계부터 함께 잡아가요"}
          </span>
        </div>

        <div className="vibe-input-row">
          <textarea
            value={input}
            placeholder="만들고 싶은 동작을 설명해주세요"
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }
            }}
            disabled={isStreaming}
            rows={2}
          />
          <button type="button" onClick={submit} disabled={isStreaming || !input.trim()}>
            ↑
          </button>
        </div>
      </div>
    </div>
  );
}
