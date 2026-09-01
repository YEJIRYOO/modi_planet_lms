import { useNavigate } from 'react-router-dom';

// 데모용 mock 로그인. 역할만 고르고 통과(실제 인증 없음).
export default function LoginPage() {
  const nav = useNavigate();
  const login = (role: 'student' | 'teacher') => {
    localStorage.setItem('demo_role', role);
    nav('/courses');
  };
  return (
    <div style={{ padding: 40, fontFamily: 'system-ui' }}>
      <h2>로그인 / 회원가입</h2>
      <p style={{ color: '#64748b' }}>데모: 역할을 선택하면 바로 진입합니다.</p>
      <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
        <button onClick={() => login('student')} style={card}>👩‍🎓 학생으로 시작</button>
        <button onClick={() => login('teacher')} style={card}>👩‍🏫 교사(학급/단체)로 시작</button>
      </div>
    </div>
  );
}
const card: React.CSSProperties = { padding: '24px 28px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 12, cursor: 'pointer', fontSize: 16 };
