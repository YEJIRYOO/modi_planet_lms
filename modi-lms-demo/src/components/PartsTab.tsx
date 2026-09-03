import { useState } from 'react';
import type { VibeResult, ModiLayoutItem } from '../lib/vibeClient';
import { moduleName, moduleImg } from '../lib/modules';
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

function ModuleIcon({ mkey, size = 48 }: { mkey: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  const img = moduleImg(mkey);
  const name = moduleName(mkey);
  if (img && !failed) {
    return <img src={img} alt={name} onError={() => setFailed(true)} style={{ width: size, height: size, objectFit: 'contain', display: 'block' }} />;
  }
  return (
    <div style={{ width: size, height: size, borderRadius: 12, background: t.coralSoft, color: t.coralStrong, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: Math.round(size * 0.36) }}>
      {name.slice(0, 1)}
    </div>
  );
}

function AssemblyDiagram({ layout }: { layout: ModiLayoutItem[] }) {
  const cols = layout.map((l) => l.pos[0]);
  const rows = layout.map((l) => l.pos[1]);
  const minC = Math.min(...cols), maxC = Math.max(...cols);
  const minR = Math.min(...rows), maxR = Math.max(...rows);
  const cell = 84;
  const width = (maxC - minC) * cell + cell;
  const height = (maxR - minR) * cell + cell;

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 12, background: t.warm, borderRadius: t.rMd, marginBottom: 20, overflow: 'auto' }}>
      <div style={{ position: 'relative', width, height }}>
        {layout.map((l, i) => {
          const left = (l.pos[0] - minC) * cell;
          const top = (l.pos[1] - minR) * cell;
          const hasWheel = l.attachments && Object.values(l.attachments).includes('wheel');
          return (
            <div key={i} style={{ position: 'absolute', left, top, width: cell - 10, height: cell - 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, border: `1px solid ${t.line}`, borderRadius: 12, background: t.surface, boxShadow: t.shSm }}>
              <div style={{ transform: l.rotation ? `rotate(${l.rotation}deg)` : undefined }}>
                <ModuleIcon mkey={l.key} size={36} />
              </div>
              <span style={{ fontSize: 10, color: t.muted, textAlign: 'center', lineHeight: 1.1 }}>{moduleName(l.key)}</span>
              {(l.rotation || hasWheel) && (
                <span style={{ fontSize: 9, color: t.coralStrong }}>{l.rotation ? `${l.rotation}° ` : ''}{hasWheel ? '바퀴' : ''}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const sectionTitle = { fontSize: 13, fontWeight: 700, color: t.coralStrong, margin: '0 0 8px' } as const;

export default function PartsTab({ result }: { result: VibeResult | null }) {
  const modi = result?.modi_modules;
  if (!modi || modi.modules.length === 0) return <Empty label="준비물" />;

  return (
    <div style={{ height: '100%', overflow: 'auto', textAlign: 'left', fontFamily: t.font, color: t.ink, padding: 4 }}>
      {modi.layout && modi.layout.length > 0 && (
        <>
          <div style={sectionTitle}>완성 형태 (조립 배치)</div>
          <AssemblyDiagram layout={modi.layout} />
        </>
      )}

      <div style={sectionTitle}>필요한 모듈 · 부품</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8, marginBottom: 20 }}>
        {modi.modules.map((m, i) => {
          const rc = ROLE_COLOR[m.role] ?? ROLE_COLOR['부품'];
          return (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', border: `1px solid ${t.line}`, borderRadius: t.rSm, padding: '10px 12px', background: t.surface }}>
              <ModuleIcon mkey={m.key} size={44} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <strong>{moduleName(m.key)}</strong>
                  <span style={{ background: rc.bg, color: rc.fg, padding: '1px 8px', borderRadius: 999, fontSize: 12, fontWeight: 700 }}>{m.role}</span>
                  <span style={{ marginLeft: 'auto', color: t.muted, fontSize: 13 }}>×{m.count}</span>
                </div>
                <div style={{ color: t.muted, fontSize: 13, lineHeight: 1.5 }}>{m.reason}</div>
              </div>
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