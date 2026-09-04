import { useState } from 'react';
import VibeCodingTab from '../components/VibeCodingTab';
import type { CourseType } from '../types';
import { t, BELOW_TOPBAR } from '../styles/tokens';
import { Segmented } from '../components/ui';

type LabType = Extract<CourseType, 'HW' | 'SW'>;

const LAB_OPTIONS = [
  { value: 'HW' as LabType, label: 'MODI 만들기', icon: 'chip' as const },
  { value: 'SW' as LabType, label: '웹 만들기', icon: 'monitor' as const },
];

export default function AiLabPage() {
  const [labType, setLabType] = useState<LabType>('HW');

  return (
    // 높이는 t.topbar 기준(BELOW_TOPBAR) — 예전엔 65px 하드코딩이라 상단바와 어긋났다.
    <main style={{ height: BELOW_TOPBAR, minHeight: 620, padding: 20, display: 'flex', flexDirection: 'column', background: t.warm, boxSizing: 'border-box' }}>
      <header style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginBottom: 14, flexWrap: 'wrap' }}>
        <div>
          <div style={{ color: t.coralStrong, fontSize: 12, fontWeight: 800, marginBottom: 4, letterSpacing: '.06em' }}>OPEN CREATIVE SPACE</div>
          <h1 style={{ margin: 0, color: t.ink, fontSize: 25, fontWeight: 800, letterSpacing: '-.03em', lineHeight: 1.3 }}>AI LAB</h1>
          <p style={{ marginTop: 5, color: t.muted, fontSize: 13 }}>정해진 강좌나 주제 없이 만들고 싶은 것을 자유롭게 이야기해 보세요.</p>
        </div>
        <Segmented label="만들기 유형" value={labType} options={LAB_OPTIONS} onChange={setLabType} />
      </header>
      <section style={{ flex: 1, minHeight: 0, overflow: 'hidden', padding: 12, border: `1px solid ${t.line}`, borderRadius: t.rLg, background: t.surface, boxShadow: t.shSm }}>
        <VibeCodingTab key={labType} courseType={labType} />
      </section>
    </main>
  );
}
