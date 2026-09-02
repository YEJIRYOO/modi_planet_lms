import React from 'react';
import type { CourseType } from '../types';
import { t } from '../styles/tokens';
import { TYPE_META } from '../data/designDoc';

export function Kicker({ children }: { children: React.ReactNode }) {
  return <div style={{ color: t.coral, fontSize: 13, fontWeight: 800, marginBottom: 12, letterSpacing: '-.01em' }}>{children}</div>;
}

export function TypeBadge({ type, size = 'sm' }: { type: CourseType; size?: 'sm' | 'lg' }) {
  const c = TYPE_META[type];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: size === 'lg' ? '6px 12px' : '4px 9px', fontSize: size === 'lg' ? 13 : 12, fontWeight: 750, color: c.fg, background: c.bg, borderRadius: 999 }}>
      {c.label}
    </span>
  );
}

type BtnProps = { children: React.ReactNode; onClick?: () => void; variant?: 'primary' | 'ghost' | 'soft'; full?: boolean; disabled?: boolean };
export function Btn({ children, onClick, variant = 'primary', full, disabled }: BtnProps) {
  const base: React.CSSProperties = { fontFamily: t.font, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? .5 : 1, minHeight: 46, padding: '0 20px', borderRadius: t.rSm, fontWeight: 750, fontSize: 15, transition: 'transform .16s ease, box-shadow .16s ease, background .16s ease', width: full ? '100%' : 'auto', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, border: 0 };
  const styles: Record<string, React.CSSProperties> = {
    primary: { ...base, color: '#fff', background: t.coral, boxShadow: t.shCoral },
    ghost: { ...base, color: t.ink, background: t.surface, border: `1px solid ${t.lineStrong}` },
    soft: { ...base, color: t.coralStrong, background: t.coralSoft },
  };
  return (
    <button onClick={disabled ? undefined : onClick} style={styles[variant]}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}>
      {children}
    </button>
  );
}

export function Page({ children }: { children: React.ReactNode }) {
  return <div style={{ width: 'min(1200px, calc(100% - 48px))', margin: '0 auto', paddingBottom: 60 }}>{children}</div>;
}
