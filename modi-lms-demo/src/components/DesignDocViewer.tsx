import type { Course } from '../data/courses';
import { t } from '../styles/tokens';
import { TypeBadge, Btn, EmptyState } from './ui';
import { Icon } from './icons';
import { TeacherGuideViewer } from './TeacherGuideViewer';

function Section({ title, full, children }: { title: string; full?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ gridColumn: full ? '1 / -1' : 'auto', padding: 20, background: t.soft, border: `1px solid ${t.line}`, borderRadius: 17 }}>
      <h3 style={{ margin: '0 0 13px', fontSize: 15, color: t.ink, fontWeight: 750 }}>{title}</h3>
      {children}
    </div>
  );
}

// 설계문서 뷰어 — 스키마 기반 읽기 전용. CourseDetail 교안/설계문서 + (추후) 학습탭 공용.
export function DesignDocViewer({ course, mode = 'doc', onClose, onStart }: {
  course: Course; mode?: 'doc' | 'plan'; onClose: () => void; onStart?: () => void;
}) {
  const p = course.plan;
  const teacher = mode === 'plan';

  if (teacher) return <TeacherGuideViewer course={course} onClose={onClose} onStart={onStart} />;

  return (
    <div onClick={onClose} role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(31,29,29,.54)', backdropFilter: 'blur(5px)', display: 'grid', placeItems: 'center', padding: 15 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(940px, 100%)', maxHeight: 'calc(100dvh - 30px)', display: 'flex', flexDirection: 'column', background: '#fff', borderRadius: 24, boxShadow: '0 28px 90px rgba(22,21,21,.24)', overflow: 'hidden', fontFamily: t.font }}>
        <header style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, padding: '26px 30px 22px', borderBottom: `1px solid ${t.line}` }}>
          <div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
              <TypeBadge type={course.type} />
              <span style={{ fontSize: 13, color: t.coralStrong, fontWeight: 800 }}>{teacher ? '교안' : '설계문서'}</span>
            </div>
            <h2 style={{ margin: 0, fontSize: 28, letterSpacing: '-.03em', lineHeight: 1.25, color: t.ink }}>{course.title}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="닫기" className="lift lift--sm" style={{ width: 40, height: 40, display: 'grid', placeItems: 'center', border: 0, borderRadius: '50%', background: t.soft, color: t.muted, cursor: 'pointer', flex: '0 0 auto' }}><Icon name="close" size={18} /></button>
        </header>

        <div style={{ padding: '28px 30px 34px', overflowY: 'auto' }}>
          {!p ? (
            <div style={{ padding: '32px 0' }}>
              <EmptyState icon="doc" title="이 차시의 설계문서는 아직 준비 중이에요"
                hint="강의안 스키마가 연결되면 학습 목표 · 성취기준 · 평가가 여기에 자동으로 채워집니다." />
            </div>
          ) : (
            <>
              <p style={{ margin: '0 0 27px', color: t.inkSoft, fontSize: 15, lineHeight: 1.75 }}>{course.description}</p>
              <div className="grid-doc">
                <Section title="학습 목표">
                  <ul style={{ margin: 0, paddingLeft: 19, display: 'grid', gap: 8, color: t.inkSoft, fontSize: 13, lineHeight: 1.6 }}>
                    {p.objectives.map((o, i) => <li key={i}>{o}</li>)}
                  </ul>
                </Section>
                <Section title="준비물">
                  <ul style={{ margin: 0, paddingLeft: 19, display: 'grid', gap: 8, color: t.inkSoft, fontSize: 13, lineHeight: 1.6 }}>
                    {p.materials.map((m, i) => <li key={i}>{m}</li>)}
                  </ul>
                </Section>
                <Section title="성취기준" full>
                  <div style={{ display: 'grid', gap: 8 }}>
                    {p.standards.map((s, i) => (
                      <div key={i} style={{ padding: '12px 13px', background: '#fff', border: `1px solid ${t.line}`, borderRadius: 12, fontSize: 13, lineHeight: 1.6, color: t.inkSoft }}>
                        <strong style={{ display: 'block', marginBottom: 3, color: t.blue }}>{s.code}</strong>{s.text}
                      </div>
                    ))}
                  </div>
                </Section>
                <Section title="성공 기준" full>
                  <div style={{ display: 'grid', gap: 9 }}>
                    {p.successCriteria.map((s, i) => (
                      <div key={i} style={{ padding: '12px 13px', background: '#fff', borderLeft: `3px solid ${t.coral}`, borderRadius: '0 11px 11px 0', fontSize: 13, lineHeight: 1.6, color: t.inkSoft }}>{s}</div>
                    ))}
                  </div>
                </Section>
                {p.vocabulary && (
                  <Section title="핵심 어휘" full>
                    <div style={{ display: 'grid', gap: 8 }}>
                      {p.vocabulary.map((v, i) => (
                        <div key={i} style={{ padding: '12px 13px', background: '#fff', border: `1px solid ${t.line}`, borderRadius: 12, fontSize: 13, lineHeight: 1.6 }}>
                          <strong style={{ color: t.ink }}>{v.term}</strong><span style={{ color: t.inkSoft }}> — {v.meaning}</span>
                          <div style={{ color: t.muted, marginTop: 3, fontSize: 12 }}>예: {v.example}</div>
                        </div>
                      ))}
                    </div>
                  </Section>
                )}
                {p.rubric && (
                  <Section title="평가 루브릭" full>
                    <div style={{ display: 'grid', gap: 8, overflowX: 'auto' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr', gap: 8, minWidth: 460, fontSize: 11, fontWeight: 800, color: t.muted, padding: '0 4px' }}>
                        <span>평가 요소</span><span>기초</span><span>보통</span><span>우수</span>
                      </div>
                      {p.rubric.map((r, i) => (
                        <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr', gap: 8, minWidth: 460, padding: '12px 13px', background: '#fff', border: `1px solid ${t.line}`, borderRadius: 12, fontSize: 13, lineHeight: 1.55, color: t.inkSoft }}>
                          <strong style={{ color: t.ink }}>{r.criterion}</strong>
                          <span>{r.basic}</span><span>{r.proficient}</span><span style={{ color: t.green }}>{r.advanced}</span>
                        </div>
                      ))}
                    </div>
                  </Section>
                )}
              </div>
            </>
          )}
        </div>

        <footer style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '17px 30px 22px', background: '#fff', borderTop: `1px solid ${t.line}` }}>
          <Btn variant="ghost" onClick={onClose}>닫기</Btn>
          {onStart && <Btn onClick={onStart}>{teacher ? '이 차시 수업 시작' : '이 차시 학습 시작'}</Btn>}
        </footer>
      </div>
    </div>
  );
}
