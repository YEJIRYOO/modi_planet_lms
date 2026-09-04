import type { VibeResult } from '../lib/vibeClient';
import type { CourseType } from '../types';
import SandpackApp from './SandpackApp';
import HybridPreview from './HybridPreview';
import { EmptyState } from './ui';
import { packPreviewUrl, type CoursePack } from '../lib/coursePack';
import { t } from '../styles/tokens';

interface Props {
  result: VibeResult | null;
  courseType: CourseType;
  /** 정적 코스 팩. 있으면 백엔드 결과를 기다리지 않고 바로 실행한다. */
  pack?: CoursePack | null;
}

export default function PreviewTab({ result, courseType, pack }: Props) {
  // 코스 팩이 있으면 그쪽이 우선이다. public/ 아래 정적 파일이라 설치도 빌드도 없고,
  // 같은 오리진이라 modi-sdk.js 를 인라인으로 심을 필요도 없다.
  if (pack?.preview) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
        <iframe
          title={`${pack.title} 미리보기`}
          src={packPreviewUrl(pack)}
          allow="serial; usb; bluetooth"
          style={{ flex: 1, width: '100%', border: 'none', borderRadius: t.rMd, background: '#fff', textAlign: 'left' }}
        />
        {pack.preview.note && (
          <div style={{ marginTop: 8, color: t.muted, fontFamily: t.font, fontSize: 13 }}>{pack.preview.note}</div>
        )}
      </div>
    );
  }

  const files = result?.generated_code ?? null;

  if (!files || Object.keys(files).length === 0) {
    return <EmptyState icon="preview" title="아직 미리볼 결과가 없어요" hint="바이브 코딩에서 만들고 싶은 것을 설명하면 결과가 여기에서 실행됩니다." />;
  }

  // HW+SW(하이브리드)는 전역 MODI SDK 단일파일 → 하이브리드 harness / 순수 SW는 Sandpack
  return courseType === 'HW_SW' ? <HybridPreview files={files} /> : <SandpackApp files={files} mode="full" />;
}
