import { useEffect, useRef, useState } from 'react';
import type { Course } from '../data/courses';
import { t } from '../styles/tokens';
import { Btn, TypeBadge } from './ui';
import { Icon } from './icons';

export function TeacherGuideViewer({ course, onClose, onStart }: {
  course: Course;
  onClose: () => void;
  onStart?: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const [loaded, setLoaded] = useState(false);
  const pdfUrl = course.guidePdfUrl;

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${course.title} 교안`}
      style={{
        position: 'fixed', inset: 0, zIndex: 80, padding: 14,
        display: 'grid', placeItems: 'center', background: 'rgba(31,29,29,.62)',
        backdropFilter: 'blur(6px)', fontFamily: t.font,
      }}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        style={{
          width: 'min(1540px, calc(100vw - 28px))', height: 'min(960px, calc(100dvh - 28px))',
          display: 'flex', flexDirection: 'column', overflow: 'hidden', background: t.surface,
          borderRadius: 22, boxShadow: '0 28px 90px rgba(22,21,21,.28)', color: t.ink,
        }}
      >
        <header style={{
          minHeight: 64, flex: '0 0 auto', padding: '10px 14px 10px 18px',
          display: 'flex', alignItems: 'center', gap: 12, borderBottom: `1px solid ${t.line}`,
        }}>
          <TypeBadge type={course.type} />
          <div style={{ minWidth: 0 }}>
            <div style={{ color: t.coralStrong, fontSize: 11, fontWeight: 800 }}>교안</div>
            <h2 style={{ margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 19, lineHeight: 1.35 }}>{course.title}</h2>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            {onStart && <Btn onClick={onStart}>이 차시 수업 시작</Btn>}
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label="교안 닫기"
              className="lift lift--sm"
              style={{
                width: 40, height: 40, padding: 0, display: 'grid', placeItems: 'center',
                border: 0, borderRadius: '50%', background: t.soft, color: t.muted, cursor: 'pointer',
              }}
            >
              <Icon name="close" size={18} />
            </button>
          </div>
        </header>

        <main style={{ position: 'relative', flex: 1, minHeight: 0, background: '#3f3f42' }}>
          {!loaded && pdfUrl && (
            <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: '#fff', fontSize: 14 }}>
              교안을 불러오는 중입니다
            </div>
          )}
          {pdfUrl ? (
            <iframe
              src={`${pdfUrl}#view=FitH&zoom=page-width&navpanes=0`}
              title={`${course.title} 교안 PDF`}
              onLoad={() => setLoaded(true)}
              style={{ position: 'relative', width: '100%', height: '100%', display: 'block', border: 0, background: '#3f3f42' }}
            />
          ) : (
            <div style={{ height: '100%', display: 'grid', placeItems: 'center', padding: 28, textAlign: 'center', color: '#fff' }}>
              <div>
                <strong style={{ display: 'block', marginBottom: 8, fontSize: 18 }}>등록된 교안이 없습니다</strong>
                <span style={{ color: '#d1d1d6', fontSize: 14 }}>이 차시의 PDF 교안을 준비하고 있습니다.</span>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
