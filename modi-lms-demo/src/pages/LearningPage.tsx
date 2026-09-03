import { useNavigate, useParams } from 'react-router-dom';
import { findCourse } from '../data/courses';
import LearningTabs from '../components/LearningTabs';
import { markDone, getStatus } from '../lib/progressStore';
import { useState } from 'react';
import { t } from '../styles/tokens';

export default function LearningPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const course = findCourse(id);
  const role = localStorage.getItem('demo_role') || 'student';
  const [done, setDone] = useState(() => (id ? getStatus(id) === 'done' : false));

  if (!course) return <div style={{ padding: 40, fontFamily: t.font, textAlign: 'left' }}>강좌를 찾을 수 없습니다.</div>;

  const complete = () => {
    markDone(course.id);
    setDone(true);
  };

  return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column', padding: 16, boxSizing: 'border-box',
      fontFamily: t.font, color: t.ink, textAlign: 'left', background: t.warm,
    }}>
      {/* 상단 바 */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12,
        background: t.surface, border: `1px solid ${t.line}`, borderRadius: t.rMd,
        padding: '10px 14px', boxShadow: t.shSm,
      }}>
        <button
          onClick={() => nav(`/courses/${course.id}`)}
          style={{ background: 'none', border: 'none', color: t.muted, cursor: 'pointer', fontFamily: t.font, fontSize: 14, padding: '6px 8px', borderRadius: 8 }}
        >
          ← 나가기
        </button>

        <strong style={{ color: t.ink, fontSize: 16 }}>{course.title}</strong>
        <span style={{
          fontSize: 12, color: t.coralStrong, background: t.coralSoft,
          padding: '2px 10px', borderRadius: 999, fontWeight: 600,
        }}>
          {course.type}
        </span>

        {/* 수강 완료: 학생만 (교사는 버튼 없음 — 유저플로우 규칙) */}
        {role === 'student' && (
          <div style={{ marginLeft: 'auto' }}>
            {done ? (
              <span style={{ color: t.green, fontWeight: 700, background: t.greenSoft, padding: '8px 14px', borderRadius: t.rSm }}>
                ✓ 수강 완료
              </span>
            ) : (
              <button
                onClick={complete}
                style={{ padding: '9px 18px', background: t.coral, color: '#fff', border: 'none', borderRadius: t.rSm, cursor: 'pointer', fontFamily: t.font, fontWeight: 700, boxShadow: t.shCoral }}
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
        <LearningTabs courseType={course.type} codeEditorMode="" locale="ko" />
      </div>
    </div>
  );
}
