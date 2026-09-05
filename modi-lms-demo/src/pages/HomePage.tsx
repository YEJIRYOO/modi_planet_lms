import { useNavigate } from 'react-router-dom';
import { VISIBLE_COURSES } from '../data/courses';
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
  const resuming = VISIBLE_COURSES.filter((c) => progress[c.id] === 'in_progress');
  const untouched = VISIBLE_COURSES.filter((c) => !progress[c.id]);
  const featured = (untouched.length > 0 ? untouched : VISIBLE_COURSES).slice(0, 3);

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
        {/* 대표 이미지 — modi_planet_3.0 레포의 공식 제품 컷 */}
        <figure className="home-hero__figure">
          <img src="/visuals/modi-ecosystem.jpg" width={1600} height={1067}
            alt="MODI 마스터 키트와 모듈, 조립한 로봇, 태블릿과 스마트폰에서 실행 중인 MODI 앱" />
        </figure>
      </section>

      <section style={{ marginBottom: 44 }}>
        <Kicker>난이도별 바로가기</Kicker>
        <div className="grid-levels">
          {LEVELS.map((lv) => (
            <button key={lv.k} type="button" className="lift lift--card" onClick={() => nav(`/courses?level=${lv.value}`)}
              style={{ fontFamily: t.font, cursor: 'pointer', display: 'block', width: '100%', padding: 0, overflow: 'hidden', textAlign: 'left', background: t.surface, border: `1px solid ${t.line}`, borderRadius: t.rMd, boxShadow: t.shSm }}>
              <img src={lv.thumb} alt="" width={300} height={198}
                style={{ display: 'block', width: '100%', height: 'auto', aspectRatio: '300 / 198', objectFit: 'cover' }} />
              <span style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' }}>
                <span style={{ width: 34, height: 34, flex: '0 0 34px', display: 'grid', placeItems: 'center', borderRadius: 10, fontWeight: 800, fontSize: 15, color: t.coralStrong, background: t.coralSoft }}>{lv.k}</span>
                <span style={{ display: 'grid' }}>
                  <strong style={{ fontSize: 15, color: t.ink }}>{lv.name}</strong>
                  <span style={{ fontSize: 12, color: t.muted }}>{lv.sub}</span>
                </span>
                <span style={{ marginLeft: 'auto', color: t.muted, display: 'flex' }}><Icon name="chevronRight" size={17} /></span>
              </span>
            </button>
          ))}
        </div>
      </section>

      {resuming.length > 0 && (
        <section style={{ marginBottom: 44 }}>
          <Kicker>이어서 학습</Kicker>
          <div className="grid-cards">
            {resuming.map((c) => <CourseCard key={c.id} c={c} onClick={() => nav(`/learning/${c.id}`)} />)}
          </div>
        </section>
      )}

      <section>
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
