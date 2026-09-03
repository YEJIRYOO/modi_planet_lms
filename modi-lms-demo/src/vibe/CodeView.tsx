import { useState } from "react";
import { useVibe } from "./VibeContext";
import type { CodeLangs } from "./types";

type LangKey = keyof CodeLangs; // "python" | "javascript" | "c"

const TABS: { key: LangKey; label: string }[] = [
  { key: "python", label: "main.py" },
  { key: "javascript", label: "main.js" },
  { key: "c", label: "main.c" },
];

export function CodeView() {
  const { codeLangs } = useVibe();
  const [tab, setTab] = useState<LangKey>("python");
  const code = codeLangs[tab] ?? "";
  const lineCount = code ? code.split("\n").length : 0;

  return (
    <div className="codeview">
      <div className="codeview-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={tab === t.key ? "active" : ""}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <pre className="codeview-body">
        <code>{code || "// 바이브 코딩에서 코드를 생성하면 여기에 표시됩니다."}</code>
      </pre>

      <div className="codeview-foot">
        <span>{TABS.find((t) => t.key === tab)?.label}</span>
        <span>{lineCount} lines</span>
      </div>
    </div>
  );
}
