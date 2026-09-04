import type { Course } from '../data/courses';
import { t } from '../styles/tokens';
import { TYPE_META } from '../data/designDoc';
import { TypeBadge } from './ui';
import { CourseThumb } from './CourseThumb';
import { LEVEL_NAME } from '../data/levels';

export function CourseCard({ c, onClick }: { c: Course; onClick: () => void }) {
  const m = TYPE_META[c.type];
  return (
    // 호버 상승은 .lift(CSS)로 — 예전 onMouseEnter 방식은 키보드 포커스에 반응하지 않았다.
    <button type="button" onClick={onClick} className="lift lift--card" style={{
      fontFamily: t.font, cursor: 'pointer', textAlign: 'left', display: 'block', padding: 0,
      background: t.surface, border: `1px solid ${t.line}`, borderRadius: t.rMd, overflow: 'hidden',
      boxShadow: t.shSm, width: '100%',
    }}>
      <div style={{ position: 'relative' }}>
        <CourseThumb course={c} height={128} />
        <span style={{ position: 'absolute', top: 12, left: 12 }}><TypeBadge type={c.type} /></span>
      </div>
      <div style={{ padding: '16px 18px 18px', display: 'grid', gap: 8 }}>
        <div style={{ fontSize: 12, color: t.muted, fontWeight: 600 }}>{LEVEL_NAME[c.level]} · {m.full} · 완성물: {c.goal}</div>
        <div style={{ fontSize: 17, fontWeight: 750, letterSpacing: '-.02em', color: t.ink, lineHeight: 1.3 }}>{c.title}</div>
        <div style={{ fontSize: 13, color: t.muted, lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{c.description}</div>
      </div>
    </button>
  );
}
