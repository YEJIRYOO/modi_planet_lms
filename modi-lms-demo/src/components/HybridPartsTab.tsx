import { useEffect, useState, useSyncExternalStore } from 'react';
import type { HybridCurriculum } from '../data/hybridCurriculum';
import { moduleName } from '../lib/modules';
import { modiWebSerial, type ModiModuleType, type ModiSerialSnapshot } from '../lib/modiWebSerial';
import { ModuleIcon } from './ModuleIcon';
import { t } from '../styles/tokens';
import { Icon } from './icons';

/* HW+SW 준비물 탭 — 학습의 첫 단계. 브라우저가 USB 시리얼로 MODI+ Network
   Module에 직접 연결하고, 실제로 발견한 모듈과 커리큘럼 준비물을 대조한다. */

const ROLE_COLOR: Record<string, { bg: string; fg: string }> = {
  필수: { bg: t.coralSoft, fg: t.coralStrong },
  택1: { bg: t.blueSoft, fg: t.blue },
  선택: { bg: t.soft, fg: t.muted },
};

const sectionTitle = { fontSize: 13, fontWeight: 700, color: t.coralStrong, margin: '0 0 8px' } as const;

interface Status { tone: 'ok' | 'warn' | 'off'; title: string; detail: string }

const keyToType = (key: string): ModiModuleType =>
  (key === 'motor_a' || key === 'motor_b' ? 'motor' : key === 'environment' ? 'env' : key) as ModiModuleType;

function statusOf(device: ModiSerialSnapshot, missing: string[]): Status {
  if (device.status === 'unsupported') return { tone: 'off', title: '이 브라우저는 USB 연결을 지원하지 않습니다', detail: 'Chrome 또는 Edge 데스크톱 최신 버전에서 HTTPS(또는 localhost)로 열어 주세요.' };
  if (device.status === 'connecting') return { tone: 'warn', title: 'MODI 네트워크 모듈에 연결하는 중…', detail: '연결된 모듈 정보를 읽고 있습니다.' };
  if (device.status === 'error') return { tone: 'warn', title: 'MODI 연결에 실패했습니다', detail: device.error ?? '다른 프로그램이 장치를 사용 중인지 확인해 주세요.' };
  if (device.status !== 'connected') return { tone: 'off', title: 'MODI가 연결되지 않았습니다', detail: '네트워크 모듈을 USB로 연결한 뒤 아래 버튼을 눌러 장치를 선택하세요.' };
  if (missing.length) return { tone: 'warn', title: '네트워크 모듈 연결됨 · 필요한 모듈을 확인하세요', detail: `아직 찾지 못한 필수 모듈: ${missing.join(', ')}` };
  return { tone: 'ok', title: 'MODI 모듈 연결 완료', detail: '필수 모듈이 모두 확인되었습니다. 바이브 코딩을 시작해도 좋아요.' };
}

const TONE: Record<Status['tone'], { bg: string; fg: string; icon: 'check' | 'chip' }> = {
  ok: { bg: t.greenSoft, fg: t.green, icon: 'check' },
  warn: { bg: t.coralSoft, fg: t.coralStrong, icon: 'chip' },
  off: { bg: t.soft, fg: t.muted, icon: 'chip' },
};

export default function HybridPartsTab({ cur }: { cur: HybridCurriculum }) {
  const device = useSyncExternalStore(modiWebSerial.subscribe, modiWebSerial.getSnapshot, modiWebSerial.getSnapshot);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void modiWebSerial.reconnectGranted();
  }, []);

  const missingRequired = cur.modules
    .filter((m) => m.role === '필수' && !device.modules.some((found) => found.type === keyToType(m.key)))
    .map((m) => moduleName(m.key));
  const choiceGroups = cur.modules
    .filter((m) => m.role === '택1')
    .reduce<Record<string, typeof cur.modules>>((groups, module) => {
      const key = module.choiceGroup ?? module.key;
      (groups[key] ??= []).push(module);
      return groups;
    }, {});
  const missingChoices = Object.values(choiceGroups)
    .filter((choices) => !choices.some((choice) => device.modules.some((found) => found.type === keyToType(choice.key))))
    .map((choices) => choices.map((choice) => moduleName(choice.key)).join(' 또는 '));
  const missing = [...missingRequired, ...missingChoices];
  const st = statusOf(device, missing);
  const tone = TONE[st.tone];

  const toggleConnection = async () => {
    setBusy(true);
    try {
      if (device.status === 'connected') await modiWebSerial.disconnect();
      else await modiWebSerial.connect();
    } finally { setBusy(false); }
  };

  return (
    <div style={{ height: '100%', overflow: 'auto', fontFamily: t.font, color: t.ink, padding: 4, textAlign: 'left' }}>
      <div style={sectionTitle}>필요한 MODI 모듈</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 8, marginBottom: 22 }}>
        {cur.modules.map((m) => {
          const rc = ROLE_COLOR[m.role];
          return (
            <div key={m.key} style={{ display: 'flex', gap: 10, alignItems: 'center', border: `1px solid ${t.line}`, borderRadius: t.rSm, padding: '10px 12px', background: t.surface }}>
              <ModuleIcon mkey={m.key} size={72} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <strong style={{ whiteSpace: 'nowrap' }}>{moduleName(m.key)}</strong>
                  <span style={{ flex: '0 0 auto', background: rc.bg, color: rc.fg, padding: '1px 8px', borderRadius: 999, fontSize: 12, fontWeight: 700 }}>{m.role}</span>
                  <span style={{ flex: '0 0 auto', marginLeft: 'auto', color: t.muted, fontSize: 13 }}>×{m.count}</span>
                </div>
                <div style={{ color: t.muted, fontSize: 13, lineHeight: 1.5 }}>{m.reason}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={sectionTitle}>브라우저에서 MODI 연결하기</div>
      <ol style={{ margin: '0 0 12px', paddingLeft: 20, lineHeight: 1.8, color: t.inkSoft, fontSize: 14 }}>
        <li>필수 모듈을 네트워크 모듈에 조립하고 전원을 켭니다.</li>
        <li>네트워크 모듈과 컴퓨터를 USB 케이블로 연결합니다.</li>
        <li><strong>MODI 연결</strong>을 누르고 목록에서 <strong>MODI+ Network Module</strong>을 선택합니다.</li>
      </ol>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
        <button type="button" disabled={busy || device.status === 'connecting' || device.status === 'unsupported'} onClick={() => void toggleConnection()}
          style={{ border: 0, borderRadius: t.rSm, background: device.status === 'connected' ? t.surface : t.coralInk, color: device.status === 'connected' ? t.inkSoft : '#fff', boxShadow: device.status === 'connected' ? `inset 0 0 0 1px ${t.lineStrong}` : 'none', padding: '10px 18px', fontFamily: t.font, fontSize: 14, fontWeight: 750, cursor: 'pointer', opacity: busy ? .6 : 1 }}>
          {device.status === 'connected' ? '연결 해제' : device.status === 'connecting' ? '연결 중…' : 'MODI 연결'}
        </button>
        <span style={{ color: t.muted, fontSize: 12 }}>USB 시리얼 · 921600 baud · 서버 설치 불필요</span>
      </div>

      <div style={sectionTitle}>연결 상태</div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', border: `1px solid ${t.line}`, borderLeft: `3px solid ${tone.fg}`, borderRadius: t.rSm, background: tone.bg, padding: '12px 14px', marginBottom: 16 }}>
        <span style={{ flex: '0 0 auto', display: 'grid', placeItems: 'center', width: 26, height: 26, borderRadius: 8, background: t.surface, color: tone.fg }}>
          <Icon name={tone.icon} size={15} />
        </span>
        <div style={{ minWidth: 0 }}>
          <strong style={{ display: 'block', fontSize: 14, color: tone.fg, marginBottom: 2 }}>{st.title}</strong>
          <span style={{ fontSize: 13, lineHeight: 1.6, color: t.inkSoft }}>{st.detail}</span>
        </div>
      </div>

      {device.status === 'connected' && device.modules.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          {device.modules.map((module) => <span key={module.id} style={{ padding: '4px 9px', borderRadius: 999, background: t.soft, border: `1px solid ${t.line}`, color: t.inkSoft, fontSize: 12, fontWeight: 650 }}>{moduleName(module.type === 'motor' ? 'motor_a' : module.type)} · #{module.id}</span>)}
        </div>
      )}
      <p style={{ margin: 0, fontSize: 12, lineHeight: 1.7, color: t.muted }}>장치 선택 창은 보안을 위해 버튼을 눌렀을 때만 열립니다. 다른 MODI 앱이나 Python 프로그램이 연결되어 있다면 먼저 종료해 주세요.</p>
    </div>
  );
}
