import type { Course } from '../data/courses';
import { t } from '../styles/tokens';
import { TYPE_META } from '../data/designDoc';
import { TypeBadge } from './ui';

export function CourseCard({ c, onClick }: { c: Course; onClick: () => void }) {
  const m = TYPE_META[c.type];
  return (
    <button onClick={onClick} style={{
      fontFamily: t.font, cursor: 'pointer', textAlign: 'left', display: 'block', padding: 0,
      background: t.surface, border: `1px solid ${t.line}`, borderRadius: t.rMd, overflow: 'hidden',
      boxShadow: t.shSm, transition: 'transform .16s ease, box-shadow .16s ease', width: '100%',
    }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = t.shMd; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = t.shSm; }}>
      <div style={{ height: 128, background: `linear-gradient(135deg, ${m.bg}, ${t.coralPale})`, display: 'grid', placeItems: 'center', position: 'relative' }}>
        <span style={{ fontSize: 40, opacity: .85 }}>{m.icon}</span>
        <span style={{ position: 'absolute', top: 12, left: 12 }}><TypeBadge type={c.type} /></span>
      </div>
      <div style={{ padding: '16px 18px 18px', display: 'grid', gap: 8 }}>
        <div style={{ fontSize: 12, color: t.muted, fontWeight: 600 }}>{m.full} · 완성물: {c.goal}</div>
        <div style={{ fontSize: 17, fontWeight: 750, letterSpacing: '-.02em', color: t.ink, lineHeight: 1.3 }}>{c.title}</div>
        <div style={{ fontSize: 13, color: t.muted, lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{c.description}</div>
      </div>
    </button>
  );
}
