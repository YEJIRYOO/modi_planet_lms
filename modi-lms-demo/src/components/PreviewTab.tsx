import { useMemo } from 'react';
import type { VibeResult } from '../lib/vibeClient';
import { buildPreviewSrcDoc, primaryFile } from '../lib/preview';
import { t } from '../styles/tokens';

function Empty({ label }: { label: string }) {
  return (
    <div style={{
      width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
      border: `1px dashed ${t.lineStrong}`, borderRadius: t.rMd, color: t.muted, fontFamily: t.font,
    }}>
      바이브 코딩(소프트웨어)에서 생성하면 {label}가 여기 표시됩니다.
    </div>
  );
}

export default function PreviewTab({ result }: { result: VibeResult | null }) {
  const files = result?.generated_code ?? null;
  const srcDoc = useMemo(() => buildPreviewSrcDoc(files), [files]);

  if (!files) return <Empty label="미리보기" />;

  if (!srcDoc) {
    const f = primaryFile(files);
    return (
      <div style={{ height: '100%', overflow: 'auto', background: '#0d1117', color: '#c9d1d9', borderRadius: t.rMd, padding: 16, fontFamily: 'ui-monospace, Consolas, monospace', fontSize: 13, textAlign: 'left' }}>
        <div style={{ color: '#8b949e', marginBottom: 8 }}>{f?.name}</div>
        <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{f?.code}</pre>
      </div>
    );
  }

  return (
    <iframe
      title="소프트웨어 미리보기"
      srcDoc={srcDoc}
      sandbox="allow-scripts"
      style={{ width: '100%', height: '100%', border: `1px solid ${t.line}`, borderRadius: t.rMd, background: '#fff' }}
    />
  );
}
