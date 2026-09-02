import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { COURSES } from '../data/courses';
import type { CourseType } from '../types';
import { t } from '../styles/tokens';
import { Kicker, Page } from '../components/ui';
import { CourseCard } from '../components/CourseCard';

export default function CourseListPage() {
  const nav = useNavigate();
  const [type, setType] = useState<'전체' | CourseType>('전체');
  const list = COURSES.filter((c) => type === '전체' || c.type === type);

  const chip = (val: '전체' | CourseType, label: string) => (
    <button key={val} onClick={() => setType(val)} style={{
      fontFamily: t.font, cursor: 'pointer', padding: '8px 14px', borderRadius: 999, fontSize: 13, fontWeight: 700,
      border: `1px solid ${type === val ? t.coral : t.line}`,
      color: type === val ? '#fff' : t.inkSoft, background: type === val ? t.coral : t.surface,
    }}>{label}</button>
  );

  return (
    <Page>
      <div style={{ padding: '36px 0 8px' }}>
        <Kicker>교육과정</Kicker>
        <h1 style={{ margin: 0, fontSize: 'clamp(30px,4vw,44px)', fontWeight: 800, letterSpacing: '-.04em', color: t.ink }}>차시마다 새로운 작품</h1>
        <p style={{ marginTop: 10, fontSize: 15, color: t.muted }}>유형으로 골라 보세요. 하드웨어·소프트웨어·융합을 넘나듭니다.</p>
      </div>
      <div style={{ display: 'flex', gap: 8, padding: '18px 0 26px', borderBottom: `1px solid ${t.line}`, flexWrap: 'wrap' }}>
        {chip('전체', '전체')}{chip('HW', 'HW')}{chip('SW', 'SW')}{chip('HW_SW', 'HW+SW')}
      </div>
      <div style={{ marginTop: 26, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
        {list.map((c) => <CourseCard key={c.id} c={c} onClick={() => nav(`/courses/${c.id}`)} />)}
      </div>
      {list.length === 0 && <div style={{ padding: 60, textAlign: 'center', color: t.muted }}>조건에 맞는 강좌가 아직 없어요. 필터를 바꿔 보세요.</div>}
    </Page>
  );
}
