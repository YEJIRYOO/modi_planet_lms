import { useNavigate } from 'react-router-dom';
import { COURSES } from '../data/courses';
import { LEVELS } from '../data/levels';
import { getAllProgress } from '../lib/progressStore';
import { t } from '../styles/tokens';
import { Btn, Kicker, Page } from '../components/ui';
import { CourseCard } from '../components/CourseCard';
import { Icon } from '../components/icons';

export default function HomePage() {
  const nav = useNavigate();

  /* 예전에는 COURSES.slice(0,3) 이 곧 전체라 홈과 교육과정 페이지가 똑같아 보였다.
     진행 중인 것을 위로 올리고, 아래 섹션은 아직 시작하지 않은 강좌를 먼저 보여
     "대시보드 → 목록" 으로 성격을 나눈다. */
  const progress = getAllProgress();
  const resuming = COURSES.filter((c) => progress[c.id] === 'in_progress');
  const untouched = COURSES.filter((c) => !progress[c.id]);
  const featured = (untouched.length > 0 ? untouched : COURSES).slice(0, 3);

  return (
    <Page>
      <section className="grid-hero" style={{ position: 'relative', padding: '56px 0 40px' }}>
        <div className="home-hero__gradient" style={{ position: 'absolute', top: 0, bottom: 0, background: `radial-gradient(700px 340px at 12% 0%, ${t.coralPale}, transparent 70%)`, zIndex: 0 }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 12px', background: t.surface, border: `1px solid ${t.coralSoft}`, borderRadius: 999, fontSize: 13, fontWeight: 700, color: t.coralStrong, marginBottom: 18 }}>
            <span style={{ width: 7, height: 7, flex: '0 0 7px', borderRadius: '50%', background: t.coral }} /> 2022 개정 교육과정 연계
          </div>
          <h1 style={{ margin: 0, fontSize: 'clamp(38px, 5vw, 60px)', fontWeight: 800, letterSpacing: '-.045em', lineHeight: 1.08, color: t.ink }}>
            말로 시작해<br /><span style={{ color: t.coral }}>작품으로 끝나는</span> 수업
          </h1>
          <p style={{ maxWidth: 440, marginTop: 18, fontSize: 16, lineHeight: 1.7, color: t.inkSoft }}>
            바이브 코딩으로 AI에게 요청하고, 미리보기로 결과를 확인하고, MODI 하드웨어로 연결합니다.
          </p>
          <div style={{ display: 'flex', gap: 10, marginTop: 26, flexWrap: 'wrap' }}>
            <Btn onClick={() => nav('/courses')}>교육과정 둘러보기</Btn>
            <Btn variant="ghost" onClick={() => nav('/mypage')}>나의 학습</Btn>
          </div>
        </div>
        <div style={{ position: 'relative', zIndex: 1, display: 'grid', gap: 10 }}>
          {LEVELS.map((lv) => (
            <button key={lv.k} type="button" className="lift lift--card" onClick={() => nav('/courses')}
              style={{ fontFamily: t.font, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14, padding: '18px 20px', background: t.surface, border: `1px solid ${t.line}`, borderRadius: t.rMd, boxShadow: t.shSm, textAlign: 'left' }}>
              <span style={{ width: 44, height: 44, flex: '0 0 44px', display: 'grid', placeItems: 'center', borderRadius: 12, fontWeight: 800, fontSize: 17, color: t.coralStrong, background: t.coralSoft }}>{lv.k}</span>
              <span style={{ display: 'grid' }}>
                <strong style={{ fontSize: 16, color: t.ink }}>{lv.name}</strong>
                <span style={{ fontSize: 13, color: t.muted }}>{lv.sub}</span>
              </span>
              <span style={{ marginLeft: 'auto', color: t.muted, display: 'flex' }}><Icon name="chevronRight" size={18} /></span>
            </button>
          ))}
        </div>
      </section>

      {resuming.length > 0 && (
        <section style={{ marginTop: 8, marginBottom: 40 }}>
          <Kicker>이어서 학습</Kicker>
          <div className="grid-cards">
            {resuming.map((c) => <CourseCard key={c.id} c={c} onClick={() => nav(`/learning/${c.id}`)} />)}
          </div>
        </section>
      )}

      <section style={{ marginTop: 40 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
          <Kicker>지금 배워 볼 프로젝트</Kicker>
          <button type="button" onClick={() => nav('/courses')}
            style={{ fontFamily: t.font, display: 'inline-flex', alignItems: 'center', gap: 4, border: 0, background: 'transparent', color: t.coralStrong, fontSize: 13, fontWeight: 700, cursor: 'pointer', padding: 0 }}>
            전체 보기 <Icon name="chevronRight" size={14} />
          </button>
        </div>
        <div className="grid-cards">
          {featured.map((c) => <CourseCard key={c.id} c={c} onClick={() => nav(`/courses/${c.id}`)} />)}
        </div>
      </section>
    </Page>
  );
}
