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

export default function DesignDocTab({ result }: { result: VibeResult | null }) {
  const doc = result?.design_doc;
  if (!doc) return <Empty label="설계 문서" />;

  return (
    <div style={{ height: '100%', overflow: 'auto', textAlign: 'left', fontFamily: t.font, color: t.ink, padding: 4 }}>
      <h3 style={{ fontSize: 20, fontWeight: 700, margin: '4px 0 6px' }}>{doc.project_name || '설계 문서'}</h3>
      {doc.description && <p style={{ color: t.inkSoft, margin: '0 0 16px', lineHeight: 1.6 }}>{doc.description}</p>}

      {doc.users && doc.users.length > 0 && (
        <section style={{ marginBottom: 16 }}>
          <div style={sectionTitle}>대상 사용자</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {doc.users.map((u, i) => (
              <span key={i} style={{ background: t.coralSoft, color: t.coralStrong, padding: '4px 12px', borderRadius: 999, fontSize: 13, fontWeight: 600 }}>{u}</span>
            ))}
          </div>
        </section>
      )}

      {doc.features && doc.features.length > 0 && (
        <section style={{ marginBottom: 16 }}>
          <div style={sectionTitle}>주요 기능</div>
          <div style={{ display: 'grid', gap: 8 }}>
            {doc.features.map((f, i) => (
              <div key={i} style={{ border: `1px solid ${t.line}`, borderRadius: t.rSm, padding: '10px 12px', background: t.surface }}>
                <div style={{ fontWeight: 700 }}>{f.name}</div>
                {f.description && <div style={{ color: t.muted, fontSize: 14, marginTop: 2 }}>{f.description}</div>}
              </div>
            ))}
          </div>
        </section>
      )}

      {doc.user_flows && doc.user_flows.length > 0 && (
        <section style={{ marginBottom: 8 }}>
          <div style={sectionTitle}>동작 흐름</div>
          <ol style={{ margin: 0, paddingLeft: 20, lineHeight: 1.7 }}>
            {doc.user_flows.map((fl, i) => <li key={i}>{fl}</li>)}
          </ol>
        </section>
      )}
    </div>
  );
}

const sectionTitle = { fontSize: 13, fontWeight: 700, color: t.coralStrong, margin: '0 0 8px' } as const;
