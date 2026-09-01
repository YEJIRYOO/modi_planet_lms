import { useNavigate } from 'react-router-dom';
import { COURSES } from '../data/courses';
import { getAllProgress, resetProgress } from '../lib/progressStore';

const TYPE_BADGE: Record<string, string> = { HW: 'HW', SW: 'SW', HW_SW: 'HW+SW' };

export default function MyPage() {
  const nav = useNavigate();
  const progress = getAllProgress();
  const role = localStorage.getItem('demo_role') || 'student';

  const inProgress = COURSES.filter((c) => progress[c.id] === 'in_progress');
  const done = COURSES.filter((c) => progress[c.id] === 'done');

  return (
    <div style={{ padding: 40, fontFamily: 'system-ui' }}>
      <button onClick={() => nav('/courses')} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', marginBottom: 16 }}>← 강좌 목록</button>
      <h2>마이페이지</h2>

      {/* 프로필 요약 */}
      <div style={{ display: 'flex', gap: 24, padding: 20, background: '#f8fafc', borderRadius: 12, marginBottom: 24 }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#cbd5e1' }} />
        <div>
          <div style={{ fontWeight: 600 }}>{role === 'teacher' ? '선생님' : '학생'} (데모)</div>
          <div style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>
            완료 강좌 {done.length}개 · 수강 중 {inProgress.length}개
          </div>
        </div>
      </div>

      <Section title={`수강 중 (${inProgress.length})`} courses={inProgress} onClick={(id) => nav(`/learning/${id}`)} cta="이어서 학습" />
      <Section title={`수강 완료 (${done.length})`} courses={done} onClick={(id) => nav(`/courses/${id}`)} cta="다시 보기" />

      <button onClick={() => { resetProgress(); window.location.reload(); }}
        style={{ marginTop: 32, padding: '6px 12px', fontSize: 13, background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', color: '#64748b' }}>
        데모 초기화 (다음 체험자용)
      </button>
    </div>
  );
}

function Section({ title, courses, onClick, cta }: {
  title: string;
  courses: typeof COURSES;
  onClick: (id: string) => void;
  cta: string;
}) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h3 style={{ marginBottom: 12 }}>{title}</h3>
      {courses.length === 0 ? (
        <p style={{ color: '#94a3b8', fontSize: 14 }}>아직 없습니다.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
          {courses.map((c) => (
            <div key={c.id} style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 16 }}>
              <span style={{ fontSize: 12, background: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: 999 }}>{TYPE_BADGE[c.type]}</span>
              <h4 style={{ margin: '10px 0 4px' }}>{c.title}</h4>
              <button onClick={() => onClick(c.id)} style={{ marginTop: 8, padding: '6px 12px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>{cta}</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
