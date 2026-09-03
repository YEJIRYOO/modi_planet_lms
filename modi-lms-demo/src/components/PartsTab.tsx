import type { VibeResult } from '../lib/vibeClient';
import { t } from '../styles/tokens';

function Empty({ label }: { label: string }) {
  return (
    <div style={{
      width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
      border: `1px dashed ${t.lineStrong}`, borderRadius: t.rMd, color: t.muted, fontFamily: t.font,
    }}>
      바이브 코딩에서 생성하면 {label}가 여기 표시됩니다.
    </div>
  );
}

const ROLE_COLOR: Record<string, { bg: string; fg: string }> = {
  '필수': { bg: t.coralSoft, fg: t.coralStrong },
  '입력': { bg: t.blueSoft, fg: t.blue },
  '출력': { bg: t.greenSoft, fg: t.green },
  '부품': { bg: t.soft, fg: t.muted },
};

export default function PartsTab({ result }: { result: VibeResult | null }) {
  const modi = result?.modi_modules;
  if (!modi || modi.modules.length === 0) return <Empty label="준비물" />;

  return (
    <div style={{ height: '100%', overflow: 'auto', textAlign: 'left', fontFamily: t.font, color: t.ink, padding: 4 }}>
      <div style={sectionTitle}>필요한 모듈 · 부품</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8, marginBottom: 20 }}>
        {modi.modules.map((m, i) => {
          const rc = ROLE_COLOR[m.role] ?? ROLE_COLOR['부품'];
          return (
            <div key={i} style={{ border: `1px solid ${t.line}`, borderRadius: t.rSm, padding: '10px 12px', background: t.surface }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <strong>{m.key}</strong>
                <span style={{ background: rc.bg, color: rc.fg, padding: '1px 8px', borderRadius: 999, fontSize: 12, fontWeight: 700 }}>{m.role}</span>
                <span style={{ marginLeft: 'auto', color: t.muted, fontSize: 13 }}>×{m.count}</span>
              </div>
              <div style={{ color: t.muted, fontSize: 13, lineHeight: 1.5 }}>{m.reason}</div>
            </div>
          );
        })}
      </div>

      {modi.assembly && modi.assembly.length > 0 && (
        <>
          <div style={sectionTitle}>조립 순서</div>
          <ol style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8, color: t.inkSoft }}>
            {modi.assembly.map((step, i) => <li key={i}>{step}</li>)}
          </ol>
        </>
      )}
    </div>
  );
}

const sectionTitle = { fontSize: 13, fontWeight: 700, color: t.coralStrong, margin: '0 0 8px' } as const;
