import { NavLink, Outlet, useNavigate, Navigate } from 'react-router-dom';
import { t } from '../styles/tokens';
import { getRole, clearRole } from '../lib/session';
import { Icon, type IconName } from './icons';
import { BrandLogo } from './BrandLogo';
import { LEVELS } from '../data/levels';

// 레일 없이 로그인만 요구 (학습화면처럼 풀스크린 페이지용)
export function RequireAuth() {
  return getRole() ? <Outlet /> : <Navigate to="/login" replace />;
}

// 레일 + 상단바 + 로그인 가드. 브라우징 페이지(홈/강좌/상세/마이) 감싸는 레이아웃.
export function AppShell() {
  const role = getRole();
  const nav = useNavigate();
  if (!role) return <Navigate to="/login" replace />; // ← 로그인 게이트(가드). 남은 작업 A 해결.

  const navItem = (to: string, label: string, icon: IconName, end?: boolean) => (
    <NavLink className="app-shell__nav-item" to={to} end={end} title={label} style={({ isActive }) => ({
      display: 'flex', alignItems: 'center', gap: 11, minHeight: 42, padding: '9px 12px', borderRadius: 11,
      fontWeight: 650, fontSize: 15, textDecoration: 'none', transition: 'background .16s ease',
      color: isActive ? t.coralStrong : t.inkSoft, background: isActive ? '#fff' : 'transparent',
      boxShadow: isActive ? t.shSm : 'none',
    })}>
      <Icon name={icon} size={19} />
      <span className="app-shell__nav-label">{label}</span>
    </NavLink>
  );

  return (
    <div className="app-shell" style={{ fontFamily: t.font, color: t.ink, background: t.soft, minHeight: '100dvh' }}>
      <aside className="app-shell__sidebar" style={{ position: 'fixed', inset: '0 auto 0 0', display: 'flex', flexDirection: 'column', padding: '20px 16px 16px', background: t.soft, borderRight: `1px solid ${t.line}`, zIndex: 20 }}>
        {/* 공식 워드마크에 "MODI Planet" 글자가 이미 들어 있어 텍스트를 따로 두지 않는다 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 4px 20px' }}>
          <BrandLogo className="app-shell__logo" width={142} />
          <span className="app-shell__version" style={{ fontSize: 11, fontWeight: 800, color: t.coralStrong, background: t.coralSoft, padding: '2px 7px', borderRadius: 999 }}>3.0</span>
        </div>
        <div style={{ display: 'grid', gap: 4 }}>
          {navItem('/', '홈', 'home', true)}
          {navItem('/courses', '교육과정', 'course')}
          {navItem('/mypage', '마이페이지', 'user')}
          {navItem('/code-editor', '코드 에디터', 'terminal')}
          {navItem('/ai-lab', 'AI LAB', 'sparkle')}
        </div>
        <div className="app-shell__levels-heading" style={{ marginTop: 22, marginBottom: 10, padding: '0 6px', fontSize: 12, fontWeight: 700, color: t.muted, display: 'flex', justifyContent: 'space-between' }}>
          <span>학년 바로가기</span><span>{LEVELS.length}</span>
        </div>
        <nav className="app-shell__levels" style={{ display: 'grid', gap: 6 }}>
          {LEVELS.map((lv) => (
            <button key={lv.k} type="button" className="lift lift--sm lift--card" onClick={() => nav(`/courses?level=${lv.value}`)}
              style={{ fontFamily: t.font, display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 11, border: `1px solid ${t.line}`, background: '#fff', cursor: 'pointer', textAlign: 'left' }}>
              <span style={{ width: 26, height: 26, flex: '0 0 26px', display: 'grid', placeItems: 'center', borderRadius: 8, fontWeight: 800, fontSize: 13, color: t.coralStrong, background: t.coralSoft }}>{lv.k}</span>
              <span style={{ display: 'grid' }}>
                <strong style={{ fontSize: 13, color: t.ink }}>{lv.name}</strong>
                <span style={{ fontSize: 11, color: t.muted }}>{lv.sub}</span>
              </span>
            </button>
          ))}
        </nav>
        <div className="app-shell__account" style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 8, padding: '12px 6px 0', fontSize: 12, color: t.muted }}>
          <span style={{ width: 7, height: 7, flex: '0 0 7px', borderRadius: '50%', background: t.green }} />
          {role === 'teacher' ? '학급 계정 (데모)' : '학생 계정 (데모)'}
        </div>
      </aside>

      <div className="app-shell__main" style={{ background: t.surface, minHeight: '100dvh' }}>
        {/* 높이를 t.topbar 로 고정한다 — 아래 sticky/전체높이 계산이 모두 이 값을 참조한다. */}
        <div style={{ height: t.topbar, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, padding: '0 24px', borderBottom: `1px solid ${t.line}`, position: 'sticky', top: 0, background: 'rgba(255,255,255,.88)', backdropFilter: 'blur(8px)', zIndex: 10 }}>
          <span style={{ fontSize: 13, color: t.muted }}>{role === 'teacher' ? '학급 계정' : '학생 계정'} (데모)</span>
          <button type="button" className="lift lift--sm" onClick={() => { clearRole(); nav('/login'); }}
            style={{ fontFamily: t.font, cursor: 'pointer', border: `1px solid ${t.line}`, background: '#fff', borderRadius: 999, padding: '7px 14px', fontSize: 13, fontWeight: 700, color: t.inkSoft }}>역할 전환</button>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
