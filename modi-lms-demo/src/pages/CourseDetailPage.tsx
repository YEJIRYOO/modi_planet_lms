import { useNavigate, useParams } from 'react-router-dom';
import { findCourse } from '../data/courses';
import { markStarted } from '../lib/progressStore';

const TYPE_BADGE: Record<string, string> = { HW: 'HW', SW: 'SW', HW_SW: 'HW+SW' };

export default function CourseDetailPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const course = findCourse(id);
  const role = localStorage.getItem('demo_role');

  if (!course) return <div style={{ padding: 40 }}>강좌를 찾을 수 없습니다. <button onClick={() => nav('/courses')}>목록으로</button></div>;

  const start = () => {
    markStarted(course.id);
    nav(`/learning/${course.id}`);
  };

  return (
    <div style={{ padding: 40, fontFamily: 'system-ui' }}>
      <button onClick={() => nav('/courses')} style={{ marginBottom: 16, background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer' }}>← 강좌 목록</button>
      <span style={{ fontSize: 12, background: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: 999 }}>{TYPE_BADGE[course.type]}</span>
      <h2 style={{ margin: '10px 0 4px' }}>{course.title}</h2>
      <p style={{ color: '#64748b' }}>{course.description}</p>
      <div style={{ marginTop: 16, padding: 16, background: '#f8fafc', borderRadius: 12 }}>
        <strong>완성물</strong>
        <p style={{ margin: '6px 0 0', color: '#475569' }}>{course.goal}</p>
      </div>
      <div style={{ marginTop: 24, display: 'flex', gap: 8 }}>
        {role === 'teacher' && (
          <button onClick={() => alert('교안 보기 (추후 구현)')} style={btnGhost}>교안 보기</button>
        )}
        <button onClick={start} style={btn}>
          {role === 'teacher' ? '수업 시작' : '수강 시작'}
        </button>
        <button onClick={() => nav('/mypage')} style={btnGhost}>마이페이지</button>
      </div>
    </div>
  );
}
const btn: React.CSSProperties = { padding: '10px 18px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' };
const btnGhost: React.CSSProperties = { padding: '10px 18px', background: '#e2e8f0', color: '#334155', border: 'none', borderRadius: 8, cursor: 'pointer' };
