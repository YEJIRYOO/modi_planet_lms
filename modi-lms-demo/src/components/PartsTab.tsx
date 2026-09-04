import type { VibeResult, ModiLayoutItem } from '../lib/vibeClient';
import type { ChecklistItem } from '../lib/coursePack';
import { moduleName } from '../lib/modules';
import { t } from '../styles/tokens';
import { EmptyState } from './ui';
import { ModuleIcon } from './ModuleIcon';

const ROLE_COLOR: Record<string, { bg: string; fg: string }> = {
  '필수': { bg: t.coralSoft, fg: t.coralStrong },
  '입력': { bg: t.blueSoft, fg: t.blue },
  '출력': { bg: t.greenSoft, fg: t.green },
  '부품': { bg: t.soft, fg: t.muted },
};

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

interface ChecklistProps {
  items: ChecklistItem[];
  checked: string[];
  onToggle: (id: string) => void;
  satisfied: boolean;
  allowSkip?: boolean;
  skipLabel?: string;
  onSkip?: () => void;
}

/* 실제 모듈 연결 여부로 막지 않는다. 교실에 모듈이 부족하거나 페어링이 안 되는
   학생이 한 명만 있어도 수업 전체가 멈추기 때문이다. 필수는 확인 항목뿐이고,
   나머지는 선택이며 언제든 건너뛸 수 있다. */
function PrepChecklist({ items, checked, onToggle, satisfied, allowSkip, skipLabel, onSkip }: ChecklistProps) {
  return (
    <div style={{ border: `1px solid ${t.line}`, borderRadius: t.rMd, padding: 14, marginBottom: 20, background: t.coralPale }}>
      <div style={{ ...sectionTitle, marginBottom: 10 }}>준비 확인</div>
      <div style={{ display: 'grid', gap: 6 }}>
        {items.map((item) => {
          const on = checked.includes(item.id);
          return (
            <label
              key={item.id}
              style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer', fontSize: 14, color: on ? t.ink : t.inkSoft }}
            >
              <input type="checkbox" checked={on} onChange={() => onToggle(item.id)} style={{ accentColor: t.coral, width: 16, height: 16 }} />
              <span>{item.label}</span>
              {item.required && (
                <span style={{ background: t.coralSoft, color: t.coralStrong, padding: '1px 7px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>필수</span>
              )}
            </label>
          );
        })}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: satisfied ? t.green : t.muted }}>
          {satisfied ? '다음 단계로 넘어갈 수 있어요.' : '필수 항목을 확인하면 바이브 코딩이 열립니다.'}
        </span>
        {allowSkip && !satisfied && onSkip && (
          <button
            type="button"
            onClick={onSkip}
            style={{ marginLeft: 'auto', background: 'none', border: `1px solid ${t.lineStrong}`, color: t.muted, borderRadius: t.rSm, padding: '6px 12px', cursor: 'pointer', fontFamily: t.font, fontSize: 13 }}
          >
            {skipLabel ?? '모듈 없이 진행하기'}
          </button>
        )}
      </div>
    </div>
  );
}

export default function PartsTab({ result, checklist }: { result: VibeResult | null; checklist?: ChecklistProps }) {
  const modi = result?.modi_modules;
  if (!modi || modi.modules.length === 0) return <EmptyState icon="parts" title="아직 준비물 목록이 없어요" hint="바이브 코딩에서 만들 것을 설명하면 필요한 MODI 모듈이 여기에 정리됩니다." />;

  return (
    <div style={{ height: '100%', overflow: 'auto', fontFamily: t.font, color: t.ink, padding: 4 }}>
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
          <ol style={{ margin: '0 0 20px', paddingLeft: 20, lineHeight: 1.8, color: t.inkSoft }}>
            {modi.assembly.map((step, i) => <li key={i}>{step}</li>)}
          </ol>
        </>
      )}

      {checklist && <PrepChecklist {...checklist} />}
    </div>
  );
}
