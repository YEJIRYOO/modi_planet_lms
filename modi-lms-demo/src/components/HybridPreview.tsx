import { useMemo } from 'react';
import { buildHybridSrcDoc } from '../lib/hybridPreview';
import { t } from '../styles/tokens';

export default function HybridPreview({ files }: { files: Record<string, string> | null }) {
  const srcDoc = useMemo(() => buildHybridSrcDoc(files), [files]);

  if (!srcDoc) {
    return (
      <div style={{
        width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: `1px dashed ${t.lineStrong}`, borderRadius: t.rMd, color: t.muted, fontFamily: t.font,
      }}>
        바이브 코딩(HW+SW)에서 생성하면 미리보기가 여기 표시됩니다.
      </div>
    );
  }

  return (
    <iframe
      title="하이브리드 미리보기"
      srcDoc={srcDoc}
      sandbox="allow-scripts"
      style={{ width: '100%', height: '100%', border: 'none', borderRadius: t.rMd, background: '#fff' }}
    />
  );
}
