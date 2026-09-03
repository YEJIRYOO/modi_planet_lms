import type { VibeResult } from '../lib/vibeClient';
import SandpackApp from './SandpackApp';
import { t } from '../styles/tokens';

export default function PreviewTab({ result }: { result: VibeResult | null }) {
  const files = result?.generated_code ?? null;

  if (!files || Object.keys(files).length === 0) {
    return (
      <div style={{
        width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: `1px dashed ${t.lineStrong}`, borderRadius: t.rMd, color: t.muted, fontFamily: t.font,
      }}>
        바이브 코딩(소프트웨어)에서 생성하면 미리보기가 여기 표시됩니다.
      </div>
    );
  }

  return <SandpackApp files={files} mode="full" />;
}
