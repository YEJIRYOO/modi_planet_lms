import React from 'react';
import type { CourseType } from '../types';
import { t } from '../styles/tokens';
import { TYPE_META } from '../data/designDoc';
import { Icon, type IconName } from './icons';

export function Kicker({ children }: { children: React.ReactNode }) {
  return <div style={{ color: t.coralStrong, fontSize: 13, fontWeight: 800, marginBottom: 12, letterSpacing: '-.01em' }}>{children}</div>;
}

export function TypeBadge({ type, size = 'sm' }: { type: CourseType; size?: 'sm' | 'lg' }) {
  const c = TYPE_META[type];
  const lg = size === 'lg';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: lg ? '6px 12px' : '4px 9px', fontSize: lg ? 13 : 12, fontWeight: 750, color: c.fg, background: c.bg, borderRadius: 999 }}>
      <Icon name={c.icon} size={lg ? 15 : 13} />
      {c.label}
    </span>
  );
}

type BtnProps = {
  children: React.ReactNode; onClick?: () => void;
  variant?: 'primary' | 'ghost' | 'soft'; full?: boolean; disabled?: boolean;
};
export function Btn({ children, onClick, variant = 'primary', full, disabled }: BtnProps) {
  const base: React.CSSProperties = {
    fontFamily: t.font, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? .5 : 1,
    minHeight: 46, padding: '0 20px', borderRadius: t.rSm, fontWeight: 750, fontSize: 15,
    width: full ? '100%' : 'auto', display: 'inline-flex', alignItems: 'center',
    justifyContent: 'center', gap: 8, border: 0,
  };
  const styles: Record<string, React.CSSProperties> = {
    // coral(#ff4547) 위 흰 글씨는 대비 3.4:1 로 AA 미달 → coralInk(4.7:1) 사용.
    primary: { ...base, color: '#fff', background: t.coralInk, boxShadow: t.shCoral },
    ghost: { ...base, color: t.ink, background: t.surface, border: `1px solid ${t.lineStrong}` },
    soft: { ...base, color: t.coralStrong, background: t.coralSoft },
  };
  return (
    // 호버 상승은 CSS(.lift)로 처리 — 예전 onMouseEnter 방식은 키보드 포커스에 반응하지 않았다.
    <button type="button" className="lift lift--sm" disabled={disabled}
      onClick={disabled ? undefined : onClick} style={styles[variant]}>
      {children}
    </button>
  );
}

export function Page({ children }: { children: React.ReactNode }) {
  return <div style={{ width: 'min(1200px, calc(100% - 48px))', margin: '0 auto', paddingBottom: 60 }}>{children}</div>;
}

/* 필터용 칩 — 목록에서 조건을 좁힐 때. */
export function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active} className="lift lift--sm"
      style={{
        fontFamily: t.font, cursor: 'pointer', padding: '8px 15px', borderRadius: 999, fontSize: 13, fontWeight: 700,
        border: `1px solid ${active ? t.coralInk : t.line}`,
        color: active ? '#fff' : t.inkSoft, background: active ? t.coralInk : t.surface,
      }}>
      {children}
    </button>
  );
}

/* 세그먼트 컨트롤 — 같은 화면의 모드를 바꿀 때(만들기 유형, 생성 모드).
   예전엔 화면마다 다른 모양(아웃라인 버튼 / 알약 / 언더라인)으로 흩어져 있었다. */
export function Segmented<T extends string>({ value, options, onChange, label }: {
  value: T; options: { value: T; label: string; icon?: IconName }[]; onChange: (v: T) => void; label: string;
}) {
  return (
    <div role="group" aria-label={label} style={{ display: 'inline-flex', gap: 3, padding: 3, border: `1px solid ${t.line}`, borderRadius: 11, background: t.soft }}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button key={o.value} type="button" onClick={() => onChange(o.value)} aria-pressed={on}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 13px', border: 0, borderRadius: 9,
              cursor: 'pointer', fontFamily: t.font, fontSize: 13, whiteSpace: 'nowrap',
              background: on ? t.surface : 'transparent', color: on ? t.ink : t.muted,
              fontWeight: on ? 750 : 550, boxShadow: on ? t.shSm : 'none',
              transition: 'background .16s ease, color .16s ease',
            }}>
            {o.icon && <Icon name={o.icon} size={15} />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* 빈 상태 — 예전에는 같은 dashed 박스가 네 개 탭에 복붙돼 있었다(문구까지 거의 동일).
   아이콘 + 제목 + 안내로 "왜 비었는지"와 "무엇을 하면 채워지는지"를 같이 보여준다. */
export function EmptyState({ icon, title, hint }: { icon: IconName; title: string; hint?: string }) {
  return (
    <div style={{
      width: '100%', height: '100%', minHeight: 220, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 4, textAlign: 'center', padding: 24,
      border: `1px dashed ${t.lineStrong}`, borderRadius: t.rMd, background: t.soft, fontFamily: t.font,
    }}>
      <span style={{ width: 46, height: 46, marginBottom: 8, display: 'grid', placeItems: 'center', borderRadius: 14, background: t.surface, border: `1px solid ${t.line}`, color: t.coralStrong }}>
        <Icon name={icon} size={22} />
      </span>
      <strong style={{ fontSize: 15, fontWeight: 750, color: t.inkSoft }}>{title}</strong>
      {hint && <span style={{ fontSize: 13, lineHeight: 1.6, color: t.muted, maxWidth: 320 }}>{hint}</span>}
    </div>
  );
}
