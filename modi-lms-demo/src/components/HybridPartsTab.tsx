import { useEffect, useRef, useState } from 'react';
import type { HybridCurriculum } from '../data/hybridCurriculum';
import { probeGame, type GameHealth } from '../lib/gameServer';
import { moduleName } from '../lib/modules';
import { ModuleIcon } from './ModuleIcon';
import { t } from '../styles/tokens';
import { Icon } from './icons';

/* HW+SW 준비물 탭 — 학습의 첫 단계.
   여기서 필요한 모듈을 확인하고, 게임 서버를 real 모드로 띄워 페어링까지 끝내야
   미리보기에서 실기기로 조작할 수 있다. */

const ROLE_COLOR: Record<string, { bg: string; fg: string }> = {
  필수: { bg: t.coralSoft, fg: t.coralStrong },
  선택: { bg: t.soft, fg: t.muted },
};

const sectionTitle = { fontSize: 13, fontWeight: 700, color: t.coralStrong, margin: '0 0 8px' } as const;

interface Status { tone: 'ok' | 'warn' | 'off'; title: string; detail: string }

function statusOf(h: GameHealth | null): Status {
  if (!h || !h.reachable) {
    return { tone: 'off', title: '게임 서버가 실행되지 않았습니다', detail: '아래 명령으로 게임을 먼저 실행하세요.' };
  }
  if (!h.readable) {
    return {
      tone: 'warn',
      title: '게임 서버 실행 중 · 모듈 상태는 확인할 수 없음',
      detail: '서버는 응답하지만 연결 정보를 읽을 수 없습니다. 모듈 연결 여부는 미리보기 화면 우측 상단 표시로 확인하세요.',
    };
  }
  if (h.mode === 'real' && h.connected) {
    return { tone: 'ok', title: 'MODI 모듈 연결 완료 · real 모드', detail: '미리보기에서 실제 모듈로 조작할 수 있습니다.' };
  }
  return {
    tone: 'warn',
    title: 'mock 모드로 실행 중 — 모듈이 잡히지 않았습니다',
    detail: h.error
      ? `서버 메시지: ${h.error}`
      : '모듈을 USB/전원에 연결한 뒤 게임을 --mode real 로 다시 실행하세요.',
  };
}

const TONE: Record<Status['tone'], { bg: string; fg: string; icon: 'check' | 'chip' }> = {
  ok: { bg: t.greenSoft, fg: t.green, icon: 'check' },
  warn: { bg: t.coralSoft, fg: t.coralStrong, icon: 'chip' },
  off: { bg: t.soft, fg: t.muted, icon: 'chip' },
};

export default function HybridPartsTab({ cur }: { cur: HybridCurriculum }) {
  const [health, setHealth] = useState<GameHealth | null>(null);
  const [copied, setCopied] = useState(false);
  const alive = useRef(true);

  /* 2.5초마다 상태를 다시 본다. 학생이 탭을 보고 있는 동안 게임을 켜는 경우가 많아
     한 번만 확인하면 계속 "미실행" 으로 남는다. */
  useEffect(() => {
    alive.current = true;
    let timer: number | undefined;
    const tick = async () => {
      const h = await probeGame(cur.port);
      if (!alive.current) return;
      setHealth(h);
      timer = window.setTimeout(tick, 2500);
    };
    void tick();
    return () => {
      alive.current = false;
      if (timer) window.clearTimeout(timer);
    };
  }, [cur.port]);

  const st = statusOf(health);
  const tone = TONE[st.tone];

  const copy = () => {
    void navigator.clipboard?.writeText(cur.runCommand).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    });
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

      <div style={sectionTitle}>게임 실행하기</div>
      <ol style={{ margin: '0 0 12px', paddingLeft: 20, lineHeight: 1.8, color: t.inkSoft, fontSize: 14 }}>
        <li>위의 <strong>필수</strong> 모듈을 모두 조립하고 전원을 켠 뒤 컴퓨터에 연결합니다.</li>
        <li><code style={codeInline}>{cur.folder}</code> 폴더에서 아래 명령을 실행합니다.</li>
        <li>아래 상태 표시가 <strong>real 모드</strong>로 바뀌면 준비가 끝났습니다.</li>
      </ol>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', borderRadius: t.rSm, background: '#0d1117', marginBottom: 22 }}>
        <code style={{ flex: 1, minWidth: 0, fontFamily: t.mono, fontSize: 13, color: '#c9d1d9', overflowX: 'auto', whiteSpace: 'pre' }}>{cur.runCommand}</code>
        <button type="button" onClick={copy}
          style={{ flex: '0 0 auto', border: '1px solid #30363d', background: '#161b22', color: copied ? '#7ee787' : '#c9d1d9', borderRadius: 8, padding: '6px 12px', fontFamily: t.font, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
          {copied ? '복사됨' : '복사'}
        </button>
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

      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.7, color: t.muted }}>{cur.mockNote}</p>
    </div>
  );
}

const codeInline = {
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
  background: '#f5f5f7', padding: '1px 6px', borderRadius: 5, fontSize: 13,
} as const;
