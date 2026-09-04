import { useNavigate, useParams } from 'react-router-dom';
import { findCourse } from '../data/courses';
import LearningTabs from '../components/LearningTabs';
import { markDone, getStatus } from '../lib/progressStore';
import { useState } from 'react';
import { t } from '../styles/tokens';
import { TypeBadge, EmptyState, Btn } from '../components/ui';
import { Icon } from '../components/icons';

export default function LearningPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const course = findCourse(id);
  const role = localStorage.getItem('demo_role') || 'student';
  const [done, setDone] = useState(() => (id ? getStatus(id) === 'done' : false));

  if (!course) return (
    <div style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', padding: 40, fontFamily: t.font, background: t.warm }}>
      <div style={{ width: 'min(420px, 100%)', display: 'grid', gap: 16, justifyItems: 'center' }}>
        <EmptyState icon="course" title="강좌를 찾을 수 없습니다" hint="주소가 바뀌었거나 삭제된 차시일 수 있어요." />
        <Btn variant="ghost" onClick={() => nav('/courses')}>교육과정 목록으로</Btn>
      </div>
    </div>
  );

  const complete = () => {
    markDone(course.id);
    setDone(true);
  };

  return (
    <div style={{
      height: '100dvh', display: 'flex', flexDirection: 'column', padding: 16, boxSizing: 'border-box',
      fontFamily: t.font, color: t.ink, background: t.warm,
    }}>
      {/* 상단 바 */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap',
        background: t.surface, border: `1px solid ${t.line}`, borderRadius: t.rMd,
        padding: '10px 14px', boxShadow: t.shSm,
      }}>
        <button
          type="button"
          onClick={() => nav(`/courses/${course.id}`)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', color: t.muted, cursor: 'pointer', fontFamily: t.font, fontSize: 14, padding: '6px 8px', borderRadius: 8 }}
        >
          <span style={{ display: 'flex', transform: 'rotate(180deg)' }}><Icon name="chevronRight" size={15} /></span> 나가기
        </button>

        <strong style={{ color: t.ink, fontSize: 16, letterSpacing: '-.02em' }}>{course.title}</strong>
        {/* 예전엔 course.type 을 그대로 찍어 융합 강좌가 "HW_SW" 로 보였다 → 배지로 통일 */}
        <TypeBadge type={course.type} />

        {/* 수강 완료: 학생만 (교사는 버튼 없음 — 유저플로우 규칙) */}
        {role === 'student' && (
          <div style={{ marginLeft: 'auto' }}>
            {done ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: t.green, fontWeight: 700, fontSize: 14, background: t.greenSoft, padding: '8px 14px', borderRadius: t.rSm }}>
                <Icon name="check" size={16} /> 수강 완료
              </span>
            ) : (
              <button
                type="button"
                className="lift lift--sm"
                onClick={complete}
                style={{ padding: '9px 18px', background: t.coralInk, color: '#fff', border: 'none', borderRadius: t.rSm, cursor: 'pointer', fontFamily: t.font, fontSize: 14, fontWeight: 700, boxShadow: t.shCoral }}
              >
                수강 완료
              </button>
            )}
          </div>
        )}
      </div>

      {/* 본문 (탭) */}
      <div style={{
        flex: 1, minHeight: 0, background: t.surface, border: `1px solid ${t.line}`,
        borderRadius: t.rLg, padding: 14, boxShadow: t.shSm, boxSizing: 'border-box',
      }}>
        <LearningTabs courseType={course.type} locale="ko" pack={course.pack} role={role} />
      </div>
    </div>
  );
}
