import { useNavigate } from 'react-router-dom';
import { COURSES } from '../data/courses';

const TYPE_BADGE: Record<string, string> = { HW: 'HW', SW: 'SW', HW_SW: 'HW+SW' };

export default function CourseListPage() {
  const nav = useNavigate();
  return (
    <div style={{ padding: 40, fontFamily: 'system-ui' }}>
      <h2>강좌</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16, marginTop: 20 }}>
        {COURSES.map((c) => (
          <div key={c.id} onClick={() => nav(`/courses/${c.id}`)}
            style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 16, cursor: 'pointer' }}>
            <span style={{ fontSize: 12, background: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: 999 }}>
              {TYPE_BADGE[c.type]}
            </span>
            <h3 style={{ margin: '10px 0 4px' }}>{c.title}</h3>
            <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>{c.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
