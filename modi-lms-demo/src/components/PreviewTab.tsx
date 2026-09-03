import type { VibeResult } from '../lib/vibeClient';
import type { CourseType } from '../types';
import SandpackApp from './SandpackApp';
import HybridPreview from './HybridPreview';
import { t } from '../styles/tokens';

export default function PreviewTab({ result, courseType }: { result: VibeResult | null; courseType: CourseType }) {
  const files = result?.generated_code ?? null;

  if (!files || Object.keys(files).length === 0) {
    return (
      <div style={{
        width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: `1px dashed ${t.lineStrong}`, borderRadius: t.rMd, color: t.muted, fontFamily: t.font,
      }}>
        바이브 코딩에서 생성하면 미리보기가 여기 표시됩니다.
      </div>
    );
  }

  // HW+SW(하이브리드)는 전역 MODI SDK 단일파일 → 하이브리드 harness / 순수 SW는 Sandpack
  return courseType === 'HW_SW' ? <HybridPreview files={files} /> : <SandpackApp files={files} mode="full" />;
}
