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
  const isMotor = mkey === 'motor_a' || mkey === 'motor_b';
  if (img && !failed) {
    return (
      <span style={{ position: 'relative', width: size, height: size, flex: `0 0 ${size}px`, overflow: 'hidden', display: 'block' }}>
        <img
          src={img}
          alt={name}
          onError={() => setFailed(true)}
          style={{
            position: 'absolute', left: '50%', top: '50%',
            width: isMotor ? '135%' : '185%', height: isMotor ? '135%' : '185%',
            maxWidth: 'none', objectFit: 'contain', transform: 'translate(-40%, -50%)', display: 'block',
          }}
        />
      </span>
    );
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
  const cell = 80;
  const width = (maxC - minC) * cell + cell;
  const height = (maxR - minR) * cell + cell;

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 12, borderRadius: t.rMd, marginBottom: 20, overflow: 'auto' }}>
      <div style={{ position: 'relative', width, height }}>
        {layout.map((l, i) => {
          const left = (l.pos[0] - minC) * cell;
          const top = (l.pos[1] - minR) * cell;
          return (
            <div
              key={i}
              title={`${moduleName(l.key)}${l.rotation ? ` · ${l.rotation}°` : ''}`}
              style={{ position: 'absolute', left, top, width: cell, height: cell, display: 'grid', placeItems: 'center' }}
            >
              <div style={{ transform: l.rotation ? `rotate(${l.rotation}deg)` : undefined }}>
                <ModuleIcon mkey={l.key} size={132} />
              </div>
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 8, marginBottom: 20 }}>
        {modi.modules.map((m, i) => {
          const rc = ROLE_COLOR[m.role] ?? ROLE_COLOR['부품'];
          return (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', border: `1px solid ${t.line}`, borderRadius: t.rSm, padding: '10px 12px', background: t.surface }}>
              <ModuleIcon mkey={m.key} size={72} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2, whiteSpace: 'nowrap' }}>
                  <strong style={{ whiteSpace: 'nowrap' }}>{moduleName(m.key)}</strong>
                  <span style={{ flex: '0 0 auto', whiteSpace: 'nowrap', background: rc.bg, color: rc.fg, padding: '1px 8px', borderRadius: 999, fontSize: 12, fontWeight: 700 }}>{m.role}</span>
                  <span style={{ flex: '0 0 auto', marginLeft: 'auto', color: t.muted, fontSize: 13 }}>×{m.count}</span>
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
