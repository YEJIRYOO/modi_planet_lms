import { VibeProvider } from "./VibeContext";
import { VibeCoding } from "./VibeCoding";
import { CodeView } from "./CodeView";
import type { CodingType } from "./types";
import "./vibe.css";

/**
 * S4 바이브 코딩 탭에 이걸 렌더한다.
 * content type 에 따라 codingType 을 내려주면 됨:
 *   하드웨어(HW) → "blockly"  (코드 보기 py/js/c 나옴)
 *   소프트웨어(SW) → "react"  (generated_code 웹 산출물)
 * HW+SW 는 상위에서 탭 전환에 맞춰 codingType 을 바꿔 넘기면 된다.
 */
export function VibeDemo({ codingType = "blockly" }: { codingType?: CodingType }) {
  return (
    <VibeProvider defaultCodingType={codingType}>
      <div className="vibe-demo">
        <section className="vibe-demo__left">
          <VibeCoding />
        </section>
        <section className="vibe-demo__right">
          <CodeView />
        </section>
      </div>
    </VibeProvider>
  );
}
