import { useState } from 'react';
import VibeCodingTab from '../components/VibeCodingTab';
import type { CourseType } from '../types';
import { t } from '../styles/tokens';

type LabType = Extract<CourseType, 'HW' | 'SW'>;

export default function AiLabPage() {
  const [labType, setLabType] = useState<LabType>('HW');

  return (
    <main style={{ height: 'calc(100dvh - 65px)', minHeight: 620, padding: 20, display: 'flex', flexDirection: 'column', textAlign: 'left', background: t.warm, boxSizing: 'border-box' }}>
      <header style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginBottom: 14, flexWrap: 'wrap' }}>
        <div>
          <div style={{ color: t.coralStrong, fontSize: 12, fontWeight: 800, marginBottom: 4 }}>OPEN CREATIVE SPACE</div>
          <h1 style={{ margin: 0, color: t.ink, fontSize: 25, lineHeight: 1.3 }}>AI LAB</h1>
          <p style={{ marginTop: 5, color: t.muted, fontSize: 13 }}>정해진 강좌나 주제 없이 만들고 싶은 것을 자유롭게 이야기해 보세요.</p>
        </div>
        <div role="group" aria-label="만들기 유형" style={{ display: 'flex', gap: 4, padding: 4, border: `1px solid ${t.line}`, borderRadius: 12, background: t.surface }}>
          <button type="button" onClick={() => setLabType('HW')} style={typeButton(labType === 'HW')}>MODI 만들기</button>
          <button type="button" onClick={() => setLabType('SW')} style={typeButton(labType === 'SW')}>웹 만들기</button>
        </div>
      </header>
      <section style={{ flex: 1, minHeight: 0, overflow: 'hidden', padding: 12, border: `1px solid ${t.line}`, borderRadius: t.rLg, background: t.surface, boxShadow: t.shSm }}>
        <VibeCodingTab key={labType} courseType={labType} />
      </section>
    </main>
  );
}

function typeButton(active: boolean): React.CSSProperties {
  return {
    padding: '8px 13px', border: 0, borderRadius: 9, cursor: 'pointer', fontFamily: t.font,
    background: active ? t.coralSoft : 'transparent', color: active ? t.coralStrong : t.muted,
    fontWeight: active ? 750 : 500,
  };
}
