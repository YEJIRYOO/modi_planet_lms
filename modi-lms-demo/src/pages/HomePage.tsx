import { useNavigate } from 'react-router-dom';

export default function HomePage() {
  const nav = useNavigate();
  return (
    <div style={{ padding: 40, fontFamily: 'system-ui' }}>
      <h1>MODI SCHOOL (가제)</h1>
      <p style={{ color: '#64748b' }}>AI로 만들며 배우는 IoT 학습 플랫폼</p>
      <div style={{ marginTop: 24, display: 'flex', gap: 8 }}>
        <button onClick={() => nav('/login')} style={btn}>로그인 / 회원가입</button>
        <button onClick={() => nav('/courses')} style={btnGhost}>강좌 둘러보기</button>
      </div>
    </div>
  );
}
const btn: React.CSSProperties = { padding: '10px 18px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' };
const btnGhost: React.CSSProperties = { padding: '10px 18px', background: '#e2e8f0', color: '#334155', border: 'none', borderRadius: 8, cursor: 'pointer' };
