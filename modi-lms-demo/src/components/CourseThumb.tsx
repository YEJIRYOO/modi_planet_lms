import type { Course } from '../data/courses';
import { TYPE_META } from '../data/designDoc';
import { t } from '../styles/tokens';
import { Icon } from './icons';
import { ModuleIcon } from './ModuleIcon';

/* 강좌 썸네일.
   예전에는 카드·상세·마이페이지가 각각 "유형색 그라데이션 + 이모지 한 개"를 따로 그려서
   강좌 3개가 전부 비슷해 보였다. 여기로 모으고, 하드웨어가 있는 강좌는 실제 MODI 모듈
   이미지(public/modules/*.png)를 겹쳐 배치해 강좌마다 다른 그림이 나오게 한다.
   모듈이 없는 순수 SW 강좌는 유형 아이콘으로 대체한다. */
export function CourseThumb({ course, height = 128, radius = 0 }: { course: Course; height?: number; radius?: number }) {
  const m = TYPE_META[course.type];
  const mods = course.modules ?? [];
  const modSize = Math.round(height * 0.62);
  const iconSize = Math.round(height * 0.3);

  return (
    <div style={{
      position: 'relative', height, borderRadius: radius, overflow: 'hidden',
      display: 'grid', placeItems: 'center',
      background: `linear-gradient(135deg, ${m.bg} 0%, ${t.coralPale} 100%)`,
    }}>
      {/* 은은한 도트 그리드 — 단색 그라데이션만 있을 때의 밋밋함을 덜어 준다 */}
      <span aria-hidden="true" style={{
        position: 'absolute', inset: 0, opacity: 0.45,
        backgroundImage: `radial-gradient(${t.surface} 1px, transparent 1px)`,
        backgroundSize: '12px 12px',
      }} />

      {mods.length > 0 ? (
        <span style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {mods.slice(0, 3).map((key, i) => (
            <span key={key} style={{
              marginLeft: i === 0 ? 0 : -Math.round(modSize * 0.26),
              transform: `rotate(${(i - 1) * 7}deg) translateY(${i === 1 ? -4 : 0}px)`,
              filter: 'drop-shadow(0 6px 12px rgba(32,35,38,.18))',
              zIndex: i === 1 ? 2 : 1,
            }}>
              <ModuleIcon mkey={key} size={modSize} />
            </span>
          ))}
        </span>
      ) : (
        <span style={{
          position: 'relative', width: Math.round(height * 0.46), height: Math.round(height * 0.46),
          display: 'grid', placeItems: 'center', borderRadius: Math.round(height * 0.16),
          background: 'rgba(255,255,255,.72)', color: m.fg, boxShadow: t.shSm,
        }}>
          <Icon name={m.icon} size={iconSize} />
        </span>
      )}
    </div>
  );
}
