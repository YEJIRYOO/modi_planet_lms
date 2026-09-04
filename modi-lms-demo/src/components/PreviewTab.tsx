import type { VibeResult } from '../lib/vibeClient';
import type { CourseType } from '../types';
import SandpackApp from './SandpackApp';
import HybridPreview from './HybridPreview';
import { EmptyState } from './ui';

export default function PreviewTab({ result, courseType }: { result: VibeResult | null; courseType: CourseType }) {
  const files = result?.generated_code ?? null;

  if (!files || Object.keys(files).length === 0) {
    return <EmptyState icon="preview" title="아직 미리볼 결과가 없어요" hint="바이브 코딩에서 만들고 싶은 것을 설명하면 결과가 여기에서 실행됩니다." />;
  }

  // HW+SW(하이브리드)는 전역 MODI SDK 단일파일 → 하이브리드 harness / 순수 SW는 Sandpack
  return courseType === 'HW_SW' ? <HybridPreview files={files} /> : <SandpackApp files={files} mode="full" />;
}
