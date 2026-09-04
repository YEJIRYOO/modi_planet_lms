import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { modiWebSerial } from '../lib/modiWebSerial';
import { t } from '../styles/tokens';
import { Icon } from './icons';

export default function BrowserHardwarePreview() {
  const device = useSyncExternalStore(modiWebSerial.subscribe, modiWebSerial.getSnapshot, modiWebSerial.getSnapshot);
  const [shots, setShots] = useState<{ id: number; x: number }[]>([]);
  const lastButton = useRef(false);
  const hasImu = device.modules.some((module) => module.type === 'imu');
  const hasButton = device.modules.some((module) => module.type === 'button');
  const ready = device.status === 'connected' && hasImu && hasButton;
  const roll = device.imu?.roll ?? 0;
  const pitch = device.imu?.pitch ?? 0;
  const x = Math.max(8, Math.min(92, 50 + roll * .55));
  const y = Math.max(14, Math.min(82, 58 - pitch * .42));

  useEffect(() => {
    const pressed = device.buttonPressed === true;
    if (pressed && !lastButton.current) {
      const id = Date.now();
      setShots((current) => [...current.slice(-7), { id, x }]);
      window.setTimeout(() => setShots((current) => current.filter((shot) => shot.id !== id)), 900);
    }
    lastButton.current = pressed;
  }, [device.buttonPressed, x]);

  if (!ready) {
    return (
      <div style={{ height: '100%', minHeight: 300, display: 'grid', placeItems: 'center', padding: 24, border: `1px dashed ${t.lineStrong}`, borderRadius: t.rMd, background: t.soft, color: t.ink, textAlign: 'center' }}>
        <div style={{ maxWidth: 500 }}>
          <span style={{ width: 48, height: 48, margin: '0 auto 12px', display: 'grid', placeItems: 'center', borderRadius: 14, background: t.surface, color: t.coralStrong }}><Icon name="chip" size={22} /></span>
          <strong style={{ display: 'block', fontSize: 17, marginBottom: 7 }}>자이로와 버튼 연결이 필요합니다</strong>
          <p style={{ margin: 0, color: t.muted, fontSize: 13, lineHeight: 1.7 }}>준비물 탭에서 MODI 연결을 누르고 자이로와 버튼이 모두 표시되는지 확인하세요. Python 설치나 별도 서버 실행은 필요 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', minHeight: 340, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRadius: t.rMd, background: '#070b18', color: '#f8fafc' }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', padding: '12px 16px', borderBottom: '1px solid #28334d', background: '#10172a' }}>
        <strong style={{ marginRight: 4 }}>Tilt & Click</strong>
        <span style={{ padding: '5px 9px', borderRadius: 999, background: '#123a30', color: '#86efac', fontSize: 12, fontWeight: 750 }}>MODI 연결 · 브라우저 모드</span>
        <span style={valueStyle}>ROLL {roll.toFixed(1)}°</span>
        <span style={valueStyle}>PITCH {pitch.toFixed(1)}°</span>
        <span style={{ ...valueStyle, color: device.buttonPressed ? '#fda4af' : '#cbd5e1' }}>BUTTON {device.buttonPressed ? 'ON' : 'OFF'}</span>
      </div>
      <div style={{ position: 'relative', flex: 1, minHeight: 260, overflow: 'hidden', background: 'radial-gradient(circle at 50% 30%, #1c3158 0, #0a1020 50%, #050813 100%)' }}>
        <div style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, transform: `translate(-50%, -50%) rotate(${roll / 2}deg)`, transition: 'left 80ms linear, top 80ms linear, transform 80ms linear', fontSize: 44 }}>✈</div>
        {shots.map((shot) => <span key={shot.id} style={{ position: 'absolute', left: `${shot.x}%`, bottom: '40%', width: 4, height: 18, borderRadius: 4, background: '#fb7185', animation: 'modi-shot .9s linear forwards' }} />)}
        <style>{'@keyframes modi-shot{from{transform:translateY(0)}to{transform:translateY(-260px);opacity:0}}'}</style>
        <div style={{ position: 'absolute', left: 16, bottom: 14, fontSize: 12, color: '#aebbd3' }}>자이로: 비행기 이동 · 버튼: 누르는 순간 한 발 발사</div>
      </div>
    </div>
  );
}

const valueStyle = { padding: '5px 8px', borderRadius: 8, background: '#1b253b', color: '#cbd5e1', fontFamily: t.mono, fontSize: 12, marginLeft: 'auto' } as const;
