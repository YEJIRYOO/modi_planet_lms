import { useNavigate } from 'react-router-dom';
import { COURSES } from '../data/courses';
import { t } from '../styles/tokens';
import { Btn, Kicker, Page } from '../components/ui';
import { CourseCard } from '../components/CourseCard';

export default function HomePage() {
  const nav = useNavigate();
  const featured = COURSES.slice(0, 3);
  const LEVELS = [
    { k: '초', name: '초급 · 초등', sub: '5~6학년 · 실과' },
    { k: '중', name: '중급 · 중등', sub: '1~3학년 · 정보' },
    { k: '고', name: '고급 · 고등', sub: '1~2학년 · 정보' },
  ];
  return (
    <Page>
      <section style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'minmax(0,1.1fr) minmax(300px,.9fr)', gap: 48, alignItems: 'center', padding: '56px 0 40px', borderRadius: t.rLg, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(700px 340px at 12% 0%, ${t.coralPale}, transparent 70%)`, zIndex: 0 }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 12px', background: t.surface, border: `1px solid ${t.coralSoft}`, borderRadius: 999, fontSize: 13, fontWeight: 700, color: t.coralStrong, marginBottom: 18 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: t.coral }} /> 2022 개정 교육과정 연계
          </div>
          <h1 style={{ margin: 0, fontSize: 'clamp(38px, 5vw, 60px)', fontWeight: 800, letterSpacing: '-.045em', lineHeight: 1.08, color: t.ink }}>
            말로 시작해<br /><span style={{ color: t.coral }}>작품으로 끝나는</span> 수업
          </h1>
          <p style={{ maxWidth: 440, marginTop: 18, fontSize: 16, lineHeight: 1.7, color: t.inkSoft }}>
            바이브 코딩으로 AI에게 요청하고, 미리보기로 결과를 확인하고, MODI 하드웨어로 손끝까지 연결합니다.
          </p>
          <div style={{ display: 'flex', gap: 10, marginTop: 26 }}>
            <Btn onClick={() => nav('/courses')}>교육과정 둘러보기</Btn>
            <Btn variant="ghost" onClick={() => nav('/mypage')}>나의 학습</Btn>
          </div>
        </div>
        <div style={{ position: 'relative', zIndex: 1, display: 'grid', gap: 10 }}>
          {LEVELS.map((lv) => (
            <button key={lv.k} onClick={() => nav('/courses')} style={{ fontFamily: t.font, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14, padding: '18px 20px', background: t.surface, border: `1px solid ${t.line}`, borderRadius: t.rMd, boxShadow: t.shSm, textAlign: 'left' }}>
              <span style={{ width: 44, height: 44, display: 'grid', placeItems: 'center', borderRadius: 12, fontWeight: 800, fontSize: 17, color: t.coralStrong, background: t.coralSoft }}>{lv.k}</span>
              <span style={{ display: 'grid' }}>
                <strong style={{ fontSize: 16, color: t.ink }}>{lv.name}</strong>
                <span style={{ fontSize: 13, color: t.muted }}>{lv.sub}</span>
              </span>
              <span style={{ marginLeft: 'auto', color: t.muted }}>›</span>
            </button>
          ))}
        </div>
      </section>
      <section style={{ marginTop: 40 }}>
        <Kicker>지금 배워 볼 프로젝트</Kicker>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {featured.map((c) => <CourseCard key={c.id} c={c} onClick={() => nav(`/courses/${c.id}`)} />)}
        </div>
      </section>
    </Page>
  );
}
