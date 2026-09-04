import { useNavigate } from 'react-router-dom';
import { VISIBLE_COURSES, type Course } from '../data/courses';
import { getAllProgress, resetProgress } from '../lib/progressStore';
import { TYPE_META } from '../data/designDoc';
import { t } from '../styles/tokens';
import { Kicker, Page, TypeBadge, EmptyState } from '../components/ui';
import { CourseThumb } from '../components/CourseThumb';
import { Icon } from '../components/icons';

export default function MyPage() {
  const nav = useNavigate();
  const progress = getAllProgress();
  const teacher = localStorage.getItem('demo_role') === 'teacher';
  const inProgress = VISIBLE_COURSES.filter((course) => progress[course.id] === 'in_progress');
  const done = VISIBLE_COURSES.filter((course) => progress[course.id] === 'done');

  return (
    <Page>
      <header style={{ padding: '36px 0 24px' }}>
        <Kicker>마이페이지</Kicker>
        <h1 style={{ margin: 0, fontSize: 'clamp(30px,4vw,44px)', fontWeight: 800, letterSpacing: '-.04em', color: t.ink }}>
          {teacher ? '우리 학급의 수업 공간' : '나의 학습 공간'}
        </h1>
        <p style={{ marginTop: 10, color: t.muted, fontSize: 15 }}>
          {teacher ? '시작한 수업과 완료한 수업을 한곳에서 확인하세요.' : '진행 중인 프로젝트를 이어서 만들고, 완료한 작품을 다시 살펴보세요.'}
        </p>
      </header>

      <section className="grid-stats" style={{ marginBottom: 38 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 0, padding: '20px 22px', border: `1px solid ${t.coralSoft}`, borderRadius: t.rMd, background: `linear-gradient(135deg, ${t.coralPale}, ${t.surface})`, boxShadow: t.shSm }}>
          <div style={{ width: 54, height: 54, flex: '0 0 54px', display: 'grid', placeItems: 'center', borderRadius: 17, background: t.coralInk, color: '#fff', boxShadow: t.shCoral }}>
            <Icon name={teacher ? 'board' : 'backpack'} size={26} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: t.ink, fontSize: 18, fontWeight: 780 }}>{teacher ? '학급 계정' : '학생 계정'} <span style={{ color: t.muted, fontSize: 13, fontWeight: 600 }}>(데모)</span></div>
            <div style={{ marginTop: 5, color: t.muted, fontSize: 13 }}>{teacher ? '수업 운영 프로필' : '개인 학습 프로필'}</div>
          </div>
        </div>
        <StatCard label="수강 중" value={inProgress.length} color={t.coralStrong} background={t.coralPale} />
        <StatCard label="수강 완료" value={done.length} color={t.green} background={t.greenSoft} />
      </section>

      <CourseSection eyebrow="IN PROGRESS" title={`수강 중 (${inProgress.length})`} description="진행 중인 프로젝트를 마지막 단계부터 이어서 시작하세요."
        courses={inProgress} emptyTitle="아직 수강 중인 강좌가 없어요" emptyHint="교육과정에서 새로운 프로젝트를 시작해 보세요."
        onCourse={(id) => nav(`/learning/${id}`)} cta={teacher ? '수업 이어가기' : '이어서 학습'} />
      <CourseSection eyebrow="COMPLETED" title={`수강 완료 (${done.length})`} description="완료한 프로젝트와 학습 내용을 언제든 다시 확인할 수 있어요."
        courses={done} emptyTitle="완료한 강좌가 아직 없어요" emptyHint="진행 중인 프로젝트를 마무리해 보세요."
        onCourse={(id) => nav(`/courses/${id}`)} cta="다시 보기" />

      <div style={{ paddingTop: 4, borderTop: `1px solid ${t.line}`, textAlign: 'right' }}>
        <button type="button" className="lift lift--sm" onClick={() => { resetProgress(); window.location.reload(); }}
          style={{ marginTop: 18, padding: '8px 12px', border: `1px solid ${t.line}`, borderRadius: 9, background: t.surface, color: t.muted, cursor: 'pointer', fontFamily: t.font, fontSize: 12, fontWeight: 650 }}>
          데모 학습 기록 초기화
        </button>
      </div>
    </Page>
  );
}

function StatCard({ label, value, color, background }: { label: string; value: number; color: string; background: string }) {
  return <div style={{ padding: '18px 20px', border: `1px solid ${t.line}`, borderRadius: t.rMd, background, boxShadow: t.shSm }}>
    <div style={{ color: t.muted, fontSize: 12, fontWeight: 700 }}>{label}</div>
    <div style={{ marginTop: 7, color, fontSize: 28, lineHeight: 1, fontWeight: 820 }}>{value}<span style={{ marginLeft: 3, fontSize: 13, fontWeight: 650 }}>개</span></div>
  </div>;
}

function CourseSection({ eyebrow, title, description, courses, emptyTitle, emptyHint, onCourse, cta }: {
  eyebrow: string; title: string; description: string; courses: Course[];
  emptyTitle: string; emptyHint: string; onCourse: (id: string) => void; cta: string;
}) {
  return <section style={{ marginBottom: 38 }}>
    <div style={{ marginBottom: 15 }}>
      <div style={{ marginBottom: 5, color: t.coralStrong, fontSize: 11, fontWeight: 800, letterSpacing: '.08em' }}>{eyebrow}</div>
      <h2 style={{ margin: 0, color: t.ink, fontSize: 22, fontWeight: 780, letterSpacing: '-.025em' }}>{title}</h2>
      <p style={{ marginTop: 6, color: t.muted, fontSize: 13 }}>{description}</p>
    </div>
    {courses.length === 0 ? <EmptyState icon="course" title={emptyTitle} hint={emptyHint} /> :
      <div className="grid-cards">
        {courses.map((course) => <ProgressCard key={course.id} course={course} cta={cta} onClick={() => onCourse(course.id)} />)}
      </div>}
  </section>;
}

function ProgressCard({ course, cta, onClick }: { course: Course; cta: string; onClick: () => void }) {
  const meta = TYPE_META[course.type];
  return <article className="lift lift--card" style={{ overflow: 'hidden', border: `1px solid ${t.line}`, borderRadius: t.rMd, background: t.surface, boxShadow: t.shSm }}>
    <div style={{ position: 'relative' }}>
      <CourseThumb course={course} height={92} />
      <span style={{ position: 'absolute', top: 12, left: 12 }}><TypeBadge type={course.type} /></span>
    </div>
    <div style={{ padding: '16px 17px 17px' }}>
      <div style={{ color: t.muted, fontSize: 12, fontWeight: 650 }}>{meta.full} · {course.goal}</div>
      <h3 style={{ margin: '7px 0 5px', color: t.ink, fontSize: 17, lineHeight: 1.35, fontWeight: 760 }}>{course.title}</h3>
      <p style={{ minHeight: 42, color: t.muted, fontSize: 13, lineHeight: 1.6 }}>{course.description}</p>
      <button type="button" onClick={onClick}
        style={{ width: '100%', marginTop: 14, padding: '10px 13px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4, border: 0, borderRadius: 10, background: t.coralSoft, color: t.coralStrong, cursor: 'pointer', fontFamily: t.font, fontSize: 13, fontWeight: 750 }}>
        {cta} <Icon name="chevronRight" size={14} />
      </button>
    </div>
  </article>;
}
