import { useNavigate } from 'react-router-dom';
import { t } from '../styles/tokens';
import { setRole, type Role } from '../lib/session';

// 데모용 역할 선택 게이트. 실제 인증 없음. 기존과 동일하게 'demo_role' 저장 후 진입.
export default function LoginPage() {
  const nav = useNavigate();
  const pick = (r: Role) => { setRole(r); nav('/'); };

  const card = (role: Role, title: string, desc: string, icon: string, note: string) => (
    <button key={role} onClick={() => pick(role)} style={{
      fontFamily: t.font, textAlign: 'left', cursor: 'pointer', flex: 1, minWidth: 240,
      padding: '30px 28px', background: t.surface, border: `1px solid ${t.line}`, borderRadius: t.rLg, boxShadow: t.shSm,
      transition: 'transform .18s ease, box-shadow .18s ease, border-color .18s ease', display: 'grid', gap: 14,
    }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = t.shMd; e.currentTarget.style.borderColor = t.coralSoft; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = t.shSm; e.currentTarget.style.borderColor = t.line; }}>
      <span style={{ width: 52, height: 52, display: 'grid', placeItems: 'center', borderRadius: 15, fontSize: 26, background: t.coralPale }}>{icon}</span>
      <div>
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-.02em', color: t.ink }}>{title}</div>
        <div style={{ marginTop: 6, fontSize: 14, color: t.muted, lineHeight: 1.6 }}>{desc}</div>
      </div>
      <div style={{ marginTop: 4, fontSize: 12, fontWeight: 700, color: t.coralStrong }}>{note} →</div>
    </button>
  );

  return (
    <div style={{ fontFamily: t.font, minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, color: t.ink, background: `radial-gradient(1200px 600px at 50% -10%, ${t.coralPale}, ${t.soft})` }}>
      <div style={{ width: 'min(760px, 100%)', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: t.surface, border: `1px solid ${t.coralSoft}`, borderRadius: 999, fontSize: 13, fontWeight: 700, color: t.coralStrong, marginBottom: 22 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: t.coral }} /> MODI Planet 3.0 · 리부트
        </div>
        <h1 style={{ margin: 0, fontSize: 'clamp(34px, 5vw, 52px)', fontWeight: 800, letterSpacing: '-.04em', lineHeight: 1.12 }}>
          AI와 함께 만들며 배우는<br /><span style={{ color: t.coral }}>MODI 학습 여정</span>
        </h1>
        <p style={{ maxWidth: 460, margin: '16px auto 0', fontSize: 15, lineHeight: 1.7, color: t.muted }}>데모에서는 가입 없이 역할만 선택해 바로 시작합니다.</p>
        <div style={{ display: 'flex', gap: 16, marginTop: 34, flexWrap: 'wrap' }}>
          {card('student', '학생으로 시작', '강좌를 수강하고, 바이브 코딩으로 작품을 만들고, 수강 완료를 학습 이력에 남겨요.', '🎒', '학생 화면 보기')}
          {card('teacher', '학급으로 시작', '교안(설계문서)을 살펴보고, 같은 학습 흐름을 수업용으로 시작해요.', '🏫', '학급 화면 보기')}
        </div>
        <div style={{ marginTop: 20, fontSize: 12, color: t.muted }}>정식 서비스에서는 학생 · 학급/단체 계정 로그인으로 전환됩니다.</div>
      </div>
    </div>
  );
}
