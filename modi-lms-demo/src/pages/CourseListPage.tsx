import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { COMPLETED_PROJECTS_DOWNLOAD_URL, VISIBLE_COURSES } from '../data/courses';
import type { CourseType } from '../types';
import { LEVELS, type CourseLevel } from '../data/levels';
import { t } from '../styles/tokens';
import { Chip, Kicker, Page, EmptyState } from '../components/ui';
import { CourseCard } from '../components/CourseCard';
import { Icon } from '../components/icons';

const FILTERS: { value: '전체' | CourseType; label: string }[] = [
  { value: '전체', label: '전체' },
  { value: 'HW', label: 'HW' },
  { value: 'SW', label: 'SW' },
  { value: 'HW_SW', label: 'HW+SW' },
];

export default function CourseListPage() {
  const nav = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [type, setType] = useState<'전체' | CourseType>('전체');
  const levelParam = searchParams.get('level');
  const level: '전체' | CourseLevel = levelParam === 'elementary' || levelParam === 'middle' ? levelParam : '전체';
  const list = VISIBLE_COURSES.filter((course) =>
    (type === '전체' || course.type === type) && (level === '전체' || course.level === level));
  const setLevel = (value: '전체' | CourseLevel) => {
    setSearchParams(value === '전체' ? {} : { level: value });
  };

  return (
    <Page>
      <div style={{ padding: '36px 0 8px' }}>
        <Kicker>교육과정</Kicker>
        <h1 style={{ margin: 0, fontSize: 'clamp(30px,4vw,44px)', fontWeight: 800, letterSpacing: '-.04em', color: t.ink }}>차시마다 새로운 작품</h1>
        <p style={{ marginTop: 10, fontSize: 15, color: t.muted }}>유형으로 골라 보세요. 하드웨어·소프트웨어·융합을 넘나듭니다.</p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '18px 0 26px', borderBottom: `1px solid ${t.line}`, flexWrap: 'wrap' }}>
        <span style={{ color: t.muted, fontSize: 12, fontWeight: 700 }}>학년</span>
        <Chip active={level === '전체'} onClick={() => setLevel('전체')}>전체</Chip>
        {LEVELS.map((item) => <Chip key={item.value} active={level === item.value} onClick={() => setLevel(item.value)}>{item.name}</Chip>)}
        <span style={{ width: 1, height: 20, margin: '0 4px', background: t.line }} />
        <span style={{ color: t.muted, fontSize: 12, fontWeight: 700 }}>유형</span>
        {FILTERS.map((f) => (
          <Chip key={f.value} active={type === f.value} onClick={() => setType(f.value)}>{f.label}</Chip>
        ))}
        <a href={COMPLETED_PROJECTS_DOWNLOAD_URL} download
          style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 13px', border: `1px solid ${t.lineStrong}`, borderRadius: 9, background: t.surface, color: t.inkSoft, textDecoration: 'none', fontSize: 12, fontWeight: 700 }}>
          <Icon name="download" size={14} /> 완성품 7종 전체 ZIP
        </a>
        {/* 몇 개가 걸렸는지 바로 보이면 필터 결과가 적을 때도 "비어 보이지" 않는다 */}
        <span style={{ fontSize: 13, color: t.muted }}>{list.length}개 강좌</span>
      </div>

      {list.length === 0 ? (
        <div style={{ marginTop: 26 }}>
          <EmptyState icon="course" title="조건에 맞는 강좌가 아직 없어요" hint="필터를 바꾸거나 ‘전체’로 돌아가 보세요." />
        </div>
      ) : (
        <div className="grid-cards" style={{ marginTop: 26 }}>
          {list.map((c) => <CourseCard key={c.id} c={c} onClick={() => nav(`/courses/${c.id}`)} />)}
        </div>
      )}
    </Page>
  );
}
