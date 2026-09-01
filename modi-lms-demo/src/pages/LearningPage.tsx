import { useNavigate, useParams } from 'react-router-dom';
import { findCourse } from '../data/courses';
import LearningTabs from '../components/LearningTabs';
import { markDone, getStatus } from '../lib/progressStore';
import { useState } from 'react';

export default function LearningPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const course = findCourse(id);
  const role = localStorage.getItem('demo_role') || 'student';
  const [done, setDone] = useState(() => (id ? getStatus(id) === 'done' : false));

  if (!course) return <div style={{ padding: 40 }}>강좌를 찾을 수 없습니다.</div>;

  const complete = () => {
    markDone(course.id);
    setDone(true);
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', padding: 16, boxSizing: 'border-box', fontFamily: 'system-ui' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <button onClick={() => nav(`/courses/${course.id}`)} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer' }}>← 나가기</button>
        <strong>{course.title}</strong>
        <span style={{ fontSize: 12, color: '#94a3b8' }}>({course.type})</span>

        {/* 수강 완료: 학생만. 교사는 버튼 없음(유저플로우 규칙) */}
        {role === 'student' && (
          <div style={{ marginLeft: 'auto' }}>
            {done ? (
              <span style={{ color: '#16a34a', fontWeight: 600 }}>✓ 수강 완료</span>
            ) : (
              <button onClick={complete} style={{ padding: '8px 16px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
                수강 완료
              </button>
            )}
          </div>
        )}
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <LearningTabs courseType={course.type} codeEditorMode="" locale="ko" />
      </div>
    </div>
  );
}
