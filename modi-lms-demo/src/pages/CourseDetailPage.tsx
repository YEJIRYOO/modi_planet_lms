import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { findCourse } from '../data/courses';
import { markStarted } from '../lib/progressStore';
import { getRole } from '../lib/session';
import { TABS, TYPE_META } from '../data/designDoc';
import { t, STICKY_TOP } from '../styles/tokens';
import { Btn, Kicker, TypeBadge, Page, EmptyState } from '../components/ui';
import { DesignDocViewer } from '../components/DesignDocViewer';
import { CourseThumb } from '../components/CourseThumb';
import { Icon, type IconName } from '../components/icons';
import { LEVEL_NAME } from '../data/levels';

// 학습 흐름 단계별 아이콘 — 탭 이름과 1:1 대응.
const STEP_ICON: Record<string, IconName> = {
  '바이브 코딩': 'sparkle',
  '코드 에디터': 'terminal',
  '코드 보기': 'terminal',
  '모디': 'blocks',
  '미리보기': 'preview',
  '준비물': 'parts',
  '흐름도': 'flow',
  '설계문서': 'doc',
  '학습 노트': 'note',
};

export default function CourseDetailPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const course = findCourse(id);
  const teacher = getRole() === 'teacher';
  const [doc, setDoc] = useState<'doc' | 'plan' | null>(null);

  if (!course) return (
    <Page>
      <div style={{ padding: '60px 0' }}>
        <EmptyState icon="course" title="강좌를 찾을 수 없습니다" hint="주소가 바뀌었거나 삭제된 차시일 수 있어요." />
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <Btn variant="ghost" onClick={() => nav('/courses')}>교육과정 목록으로</Btn>
        </div>
      </div>
    </Page>
  );

  // 수강/수업 시작 — 기존 로직 그대로 (진도 반영 후 학습화면).
  const start = () => { markStarted(course.id); nav(`/learning/${course.id}`); };
  const m = TYPE_META[course.type];

  return (
    <Page>
      <button type="button" onClick={() => nav('/courses')}
        style={{ fontFamily: t.font, display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'pointer', border: 0, background: 'transparent', color: t.muted, fontSize: 14, fontWeight: 600, padding: '22px 0 0' }}>
        <span style={{ display: 'flex', transform: 'rotate(180deg)' }}><Icon name="chevronRight" size={15} /></span> 교육과정으로
      </button>

      <section className="grid-detail" style={{ padding: '18px 0 36px' }}>
        <div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
            <TypeBadge type={course.type} size="lg" />
            <span style={{ fontSize: 13, color: t.coralStrong, fontWeight: 700 }}>{LEVEL_NAME[course.level]}</span>
            <span style={{ fontSize: 13, color: t.muted, fontWeight: 600 }}>{m.full}</span>
          </div>
          <h1 style={{ margin: 0, fontSize: 'clamp(28px,3.6vw,40px)', fontWeight: 800, letterSpacing: '-.035em', lineHeight: 1.15, color: t.ink }}>{course.title}</h1>
          <p style={{ marginTop: 16, fontSize: 16, lineHeight: 1.75, color: t.inkSoft, maxWidth: 620 }}>{course.description}</p>

          <div style={{ marginTop: 30 }}>
            <Kicker>학습 흐름</Kicker>
            <div style={{ display: 'grid', gap: 8 }}>
              {TABS[course.type].map((tab, i) => (
                <div key={tab} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: t.surface, border: `1px solid ${t.line}`, borderRadius: 12 }}>
                  <span style={{ width: 22, height: 22, flex: '0 0 22px', display: 'grid', placeItems: 'center', borderRadius: 7, fontSize: 12, fontWeight: 800, color: t.coralStrong, background: t.coralSoft }}>{i + 1}</span>
                  <span style={{ display: 'flex', color: t.muted }}><Icon name={STEP_ICON[tab] ?? 'doc'} size={17} /></span>
                  <strong style={{ fontSize: 14, color: t.ink }}>{tab}</strong>
                  {tab === '설계문서' && (
                    <button type="button" onClick={() => setDoc(teacher ? 'plan' : 'doc')}
                      style={{ fontFamily: t.font, marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 3, cursor: 'pointer', border: 0, background: 'transparent', color: t.coralStrong, fontWeight: 700, fontSize: 13 }}>
                      미리보기 <Icon name="chevronRight" size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 좁은 화면에서는 index.css 의 .detail-aside 규칙이 sticky 를 해제한다 */}
        <aside className="detail-aside" style={{ position: 'sticky', top: STICKY_TOP, background: t.surface, border: `1px solid ${t.line}`, borderRadius: t.rLg, boxShadow: t.shSm, padding: 24, display: 'grid', gap: 14 }}>
          <CourseThumb course={course} height={150} radius={t.rMd} />
          <div style={{ fontSize: 13, color: t.muted }}>완성물 · <strong style={{ color: t.inkSoft }}>{course.goal}</strong></div>
          {course.project?.downloadUrl && (
            <a href={course.project.downloadUrl} download
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 14px', border: `1px solid ${t.lineStrong}`, borderRadius: t.rSm, background: t.surface, color: t.inkSoft, textDecoration: 'none', fontSize: 13, fontWeight: 700 }}>
              <Icon name="download" size={15} /> 독립 실행 프로젝트 ZIP
            </a>
          )}
          {teacher ? (
            <>
              <Btn full onClick={() => setDoc('plan')}>교안 보기</Btn>
              <Btn full variant="soft" onClick={start}>수업 시작</Btn>
              <div style={{ fontSize: 12, color: t.muted, textAlign: 'center', lineHeight: 1.6 }}>학급 계정은 수강 완료 대신 수업용 흐름을 사용해요.</div>
            </>
          ) : (
            <>
              <Btn full onClick={start}>수강 시작</Btn>
              <Btn full variant="ghost" onClick={() => setDoc('doc')}>설계문서 미리보기</Btn>
              <div style={{ fontSize: 12, color: t.muted, textAlign: 'center', lineHeight: 1.6 }}>마지막 학습 노트에서 수강 완료를 누르면 이력에 남아요.</div>
            </>
          )}
          <button type="button" onClick={() => nav('/mypage')}
            style={{ fontFamily: t.font, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4, cursor: 'pointer', border: 0, background: 'transparent', color: t.muted, fontSize: 13, fontWeight: 600 }}>
            나의 학습으로 <Icon name="chevronRight" size={13} />
          </button>
        </aside>
      </section>

      {doc && <DesignDocViewer course={course} mode={doc} onClose={() => setDoc(null)} onStart={start} />}
    </Page>
  );
}
