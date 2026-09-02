import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { findCourse } from '../data/courses';
import { markStarted } from '../lib/progressStore';
import { getRole } from '../lib/session';
import { TABS, TYPE_META } from '../data/designDoc';
import { t } from '../styles/tokens';
import { Btn, Kicker, TypeBadge, Page } from '../components/ui';
import { DesignDocViewer } from '../components/DesignDocViewer';

export default function CourseDetailPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const course = findCourse(id);
  const teacher = getRole() === 'teacher';
  const [doc, setDoc] = useState<'doc' | 'plan' | null>(null);

  if (!course) return (
    <Page><div style={{ padding: '60px 0', color: t.muted }}>강좌를 찾을 수 없습니다. <button onClick={() => nav('/courses')} style={{ color: t.coralStrong, background: 'none', border: 0, cursor: 'pointer', fontWeight: 700 }}>목록으로</button></div></Page>
  );

  // 수강/수업 시작 — 기존 로직 그대로 (진도 반영 후 학습화면).
  const start = () => { markStarted(course.id); nav(`/learning/${course.id}`); };
  const m = TYPE_META[course.type];

  return (
    <Page>
      <button onClick={() => nav('/courses')} style={{ fontFamily: t.font, cursor: 'pointer', border: 0, background: 'transparent', color: t.muted, fontSize: 14, fontWeight: 600, padding: '22px 0 0' }}>← 교육과정으로</button>
      <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.3fr) minmax(280px,.7fr)', gap: 40, alignItems: 'start', padding: '18px 0 36px' }}>
        <div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 14 }}>
            <TypeBadge type={course.type} size="lg" />
            <span style={{ fontSize: 13, color: t.muted, fontWeight: 600 }}>{m.full}</span>
          </div>
          <h1 style={{ margin: 0, fontSize: 'clamp(28px,3.6vw,40px)', fontWeight: 800, letterSpacing: '-.035em', lineHeight: 1.15, color: t.ink }}>{course.title}</h1>
          <p style={{ marginTop: 16, fontSize: 16, lineHeight: 1.75, color: t.inkSoft, maxWidth: 620 }}>{course.description}</p>

          <div style={{ marginTop: 30 }}>
            <Kicker>학습 흐름</Kicker>
            <div style={{ display: 'grid', gap: 8 }}>
              {TABS[course.type].map((tab, i) => (
                <div key={tab} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: t.surface, border: `1px solid ${t.line}`, borderRadius: 12 }}>
                  <span style={{ width: 22, height: 22, display: 'grid', placeItems: 'center', borderRadius: 7, fontSize: 12, fontWeight: 800, color: t.coralStrong, background: t.coralSoft }}>{i + 1}</span>
                  <strong style={{ fontSize: 14, color: t.ink }}>{tab}</strong>
                  {tab === '설계문서' && <button onClick={() => setDoc(teacher ? 'plan' : 'doc')} style={{ fontFamily: t.font, marginLeft: 'auto', cursor: 'pointer', border: 0, background: 'transparent', color: t.coralStrong, fontWeight: 700, fontSize: 13 }}>미리보기 →</button>}
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside style={{ position: 'sticky', top: 88, background: t.surface, border: `1px solid ${t.line}`, borderRadius: t.rLg, boxShadow: t.shSm, padding: 24, display: 'grid', gap: 14 }}>
          <div style={{ height: 150, borderRadius: t.rMd, background: `linear-gradient(135deg, ${m.bg}, ${t.coralPale})`, display: 'grid', placeItems: 'center', fontSize: 46 }}>{m.icon}</div>
          <div style={{ fontSize: 13, color: t.muted }}>완성물 · <strong style={{ color: t.inkSoft }}>{course.goal}</strong></div>
          {teacher ? (
            <>
              <Btn full onClick={() => setDoc('plan')}>교안 보기</Btn>
              <Btn full variant="soft" onClick={start}>수업 시작</Btn>
              <div style={{ fontSize: 12, color: t.muted, textAlign: 'center' }}>학급 계정은 수강 완료 대신 수업용 흐름을 사용해요.</div>
            </>
          ) : (
            <>
              <Btn full onClick={start}>수강 시작</Btn>
              <Btn full variant="ghost" onClick={() => setDoc('doc')}>설계문서 미리보기</Btn>
              <div style={{ fontSize: 12, color: t.muted, textAlign: 'center' }}>마지막 학습 노트에서 수강 완료를 누르면 이력에 남아요.</div>
            </>
          )}
          <button onClick={() => nav('/mypage')} style={{ fontFamily: t.font, cursor: 'pointer', border: 0, background: 'transparent', color: t.muted, fontSize: 13, fontWeight: 600 }}>나의 학습으로 →</button>
        </aside>
      </section>

      {doc && <DesignDocViewer course={course} mode={doc} onClose={() => setDoc(null)} onStart={start} />}
    </Page>
  );
}
