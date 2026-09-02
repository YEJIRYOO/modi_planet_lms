import { NavLink, Outlet, useNavigate, Navigate } from 'react-router-dom';
import { t } from '../styles/tokens';
import { getRole, clearRole } from '../lib/session';

const LEVELS = [
  { k: '초', name: '초급 · 초등', sub: '5~6학년 · 실과' },
  { k: '중', name: '중급 · 중등', sub: '1~3학년 · 정보' },
  { k: '고', name: '고급 · 고등', sub: '1~2학년 · 정보' },
];

// 레일 없이 로그인만 요구 (학습화면처럼 풀스크린 페이지용)
export function RequireAuth() {
  return getRole() ? <Outlet /> : <Navigate to="/login" replace />;
}

// 레일 + 상단바 + 로그인 가드. 브라우징 페이지(홈/강좌/상세/마이) 감싸는 레이아웃.
export function AppShell() {
  const role = getRole();
  const nav = useNavigate();
  if (!role) return <Navigate to="/login" replace />; // ← 로그인 게이트(가드). 남은 작업 A 해결.

  const navItem = (to: string, label: string, icon: string, end?: boolean) => (
    <NavLink to={to} end={end} style={({ isActive }) => ({
      display: 'flex', alignItems: 'center', gap: 11, minHeight: 42, padding: '9px 12px', borderRadius: 11,
      fontWeight: 650, fontSize: 15, textDecoration: 'none',
      color: isActive ? t.ink : t.inkSoft, background: isActive ? '#fff' : 'transparent', boxShadow: isActive ? t.shSm : 'none',
    })}>
      <span style={{ width: 20, textAlign: 'center', fontSize: 16 }}>{icon}</span>{label}
    </NavLink>
  );

  return (
    <div style={{ fontFamily: t.font, color: t.ink, background: t.soft, minHeight: '100vh' }}>
      <aside style={{ position: 'fixed', inset: '0 auto 0 0', width: 244, display: 'flex', flexDirection: 'column', padding: '22px 16px 16px', background: t.soft, borderRight: `1px solid ${t.line}`, zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '2px 6px 18px' }}>
          <span style={{ fontWeight: 820, fontSize: 20, letterSpacing: '-.03em', color: t.ink }}>MODI Planet</span>
          <span style={{ fontSize: 11, fontWeight: 800, color: t.coralStrong, background: t.coralSoft, padding: '2px 7px', borderRadius: 999 }}>3.0</span>
        </div>
        <div style={{ display: 'grid', gap: 4 }}>
          {navItem('/', '홈', '⌂', true)}
          {navItem('/courses', '교육과정', '◫')}
          {navItem('/mypage', '마이페이지', '▤')}
        </div>
        <div style={{ marginTop: 22, marginBottom: 10, padding: '0 6px', fontSize: 12, fontWeight: 700, color: t.muted, display: 'flex', justifyContent: 'space-between' }}>
          <span>난이도 바로가기</span><span>3</span>
        </div>
        <nav style={{ display: 'grid', gap: 6 }}>
          {LEVELS.map((lv) => (
            <button key={lv.k} onClick={() => nav('/courses')} style={{ fontFamily: t.font, display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 11, border: `1px solid ${t.line}`, background: '#fff', cursor: 'pointer', textAlign: 'left' }}>
              <span style={{ width: 26, height: 26, display: 'grid', placeItems: 'center', borderRadius: 8, fontWeight: 800, fontSize: 13, color: t.coralStrong, background: t.coralSoft }}>{lv.k}</span>
              <span style={{ display: 'grid' }}>
                <strong style={{ fontSize: 13, color: t.ink }}>{lv.name}</strong>
                <span style={{ fontSize: 11, color: t.muted }}>{lv.sub}</span>
              </span>
            </button>
          ))}
        </nav>
        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 8, padding: '12px 6px 0', fontSize: 12, color: t.muted }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: t.green }} />
          {role === 'teacher' ? '학급 계정 (데모)' : '학생 계정 (데모)'}
        </div>
      </aside>

      <div style={{ marginLeft: 244, background: t.surface, minHeight: '100vh' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, padding: '14px 24px', borderBottom: `1px solid ${t.line}`, position: 'sticky', top: 0, background: 'rgba(255,255,255,.9)', backdropFilter: 'blur(8px)', zIndex: 10 }}>
          <span style={{ fontSize: 13, color: t.muted }}>{role === 'teacher' ? '학급 계정' : '학생 계정'} (데모)</span>
          <button onClick={() => { clearRole(); nav('/login'); }} style={{ fontFamily: t.font, cursor: 'pointer', border: `1px solid ${t.line}`, background: '#fff', borderRadius: 999, padding: '7px 14px', fontSize: 13, fontWeight: 700, color: t.inkSoft }}>역할 전환</button>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
