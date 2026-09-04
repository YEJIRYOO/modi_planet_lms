import { useEffect, useRef, useSyncExternalStore } from 'react';
import { modiWebSerial } from '../lib/modiWebSerial';
import { t } from '../styles/tokens';
import { Icon } from './icons';

export default function StaticProjectPreview({ title, previewUrl, note, modiBridge = false }: {
  title: string;
  previewUrl: string;
  note?: string;
  modiBridge?: boolean;
}) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const device = useSyncExternalStore(modiWebSerial.subscribe, modiWebSerial.getSnapshot, modiWebSerial.getSnapshot);
  const sendDevice = () => {
    if (modiBridge) frameRef.current?.contentWindow?.postMessage({ type: 'modi-hardware-state', device }, location.origin);
  };

  useEffect(() => {
    if (modiBridge) frameRef.current?.contentWindow?.postMessage({ type: 'modi-hardware-state', device }, location.origin);
  }, [device, modiBridge]);

  useEffect(() => {
    if (!modiBridge) return;
    const receiveCommand = (event: MessageEvent) => {
      if (event.origin !== location.origin || event.source !== frameRef.current?.contentWindow || event.data?.type !== 'modi-command') return;
      const command = event.data as { action?: string; red?: number; green?: number; blue?: number; frequency?: number; volume?: number; speed?: number };
      if (command.action === 'led') void modiWebSerial.setLed(command.red ?? 0, command.green ?? 0, command.blue ?? 0);
      if (command.action === 'speaker') void modiWebSerial.setSpeaker(command.frequency ?? 0, command.volume ?? 0);
      if (command.action === 'motor') void modiWebSerial.setMotorSpeed(command.speed ?? 0);
    };
    window.addEventListener('message', receiveCommand);
    return () => {
      window.removeEventListener('message', receiveCommand);
      void modiWebSerial.setMotorSpeed(0);
      void modiWebSerial.setSpeaker(0, 0);
    };
  }, [modiBridge]);

  return (
    <div style={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 11px', borderRadius: 999, background: t.greenSoft, color: t.green, fontSize: 12, fontWeight: 750 }}>
          <Icon name="preview" size={13} /> 브라우저에서 바로 실행
        </span>
        {note && <span style={{ color: t.muted, fontSize: 12 }}>{note}</span>}
        <span style={{ marginLeft: 'auto', display: 'inline-flex', gap: 6 }}>
          <a href={previewUrl} target="_blank" rel="noreferrer" style={buttonStyle}>새 창</a>
        </span>
      </div>
      <iframe
        ref={frameRef}
        src={previewUrl}
        title={`${title} 미리보기`}
        allow="camera; fullscreen; autoplay; gamepad; clipboard-write"
        onLoad={sendDevice}
        style={{ flex: 1, minHeight: 340, width: '100%', border: `1px solid ${t.line}`, borderRadius: t.rMd, background: '#111827' }}
      />
    </div>
  );
}

const buttonStyle = {
  display: 'inline-flex', alignItems: 'center', padding: '6px 11px',
  border: `1px solid ${t.lineStrong}`, borderRadius: 9, background: t.surface,
  color: t.inkSoft, textDecoration: 'none', fontFamily: t.font, fontSize: 12, fontWeight: 700,
} as const;
