import { useEffect, useMemo, useState } from 'react';
import { buildHybridSrcDoc, loadSdkSource } from '../lib/hybridPreview';
import { t } from '../styles/tokens';

export default function HybridPreview({ files }: { files: Record<string, string> | null }) {
  const [sdk, setSdk] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    loadSdkSource().then(setSdk).catch((e) => setErr(String(e)));
  }, []);

  const srcDoc = useMemo(
    () => (sdk != null ? buildHybridSrcDoc(files, sdk) : null),
    [files, sdk],
  );

  if (err) {
    return <div style={{ padding: 16, color: '#db2d2f', fontFamily: t.font }}>modi-sdk.js 로드 실패: {err} — public/hybrid/modi-sdk.js 확인</div>;
  }
  if (!files || Object.keys(files).length === 0) {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px dashed ${t.lineStrong}`, borderRadius: t.rMd, color: t.muted, fontFamily: t.font }}>
        바이브 코딩(HW+SW)에서 생성하면 미리보기가 여기 표시됩니다.
      </div>
    );
  }
  if (!srcDoc) {
    return <div style={{ padding: 16, color: t.muted, fontFamily: t.font }}>미리보기 준비 중…</div>;
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