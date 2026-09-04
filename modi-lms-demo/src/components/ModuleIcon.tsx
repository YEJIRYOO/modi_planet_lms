import { useState } from 'react';
import { moduleName, moduleImg } from '../lib/modules';
import { t } from '../styles/tokens';

/* MODI 모듈 썸네일. public/modules/*.png 는 여백이 넓은 원본이라
   박스를 넘겨 확대한 뒤 잘라내야 모듈이 꽉 차 보인다(기존 PartsTab 처리 계승).
   준비물 탭과 강좌 카드가 같은 렌더링을 쓰도록 컴포넌트로 분리했다. */
export function ModuleIcon({ mkey, size = 48 }: { mkey: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  const img = moduleImg(mkey);
  const name = moduleName(mkey);
  const isMotor = mkey === 'motor_a' || mkey === 'motor_b';

  if (img && !failed) {
    return (
      <span style={{ position: 'relative', width: size, height: size, flex: `0 0 ${size}px`, overflow: 'hidden', display: 'block' }}>
        <img
          src={img}
          alt={name}
          loading="lazy"
          onError={() => setFailed(true)}
          style={{
            position: 'absolute', left: '50%', top: '50%',
            width: isMotor ? '135%' : '185%', height: isMotor ? '135%' : '185%',
            maxWidth: 'none', objectFit: 'contain', transform: 'translate(-40%, -50%)', display: 'block',
          }}
        />
      </span>
    );
  }
  return (
    <div style={{ width: size, height: size, flex: `0 0 ${size}px`, borderRadius: 12, background: t.coralSoft, color: t.coralStrong, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: Math.round(size * 0.36) }}>
      {name.slice(0, 1)}
    </div>
  );
}
