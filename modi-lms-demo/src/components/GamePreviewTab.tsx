import { useCallback, useEffect, useRef, useState } from 'react';
import type { HybridCurriculum } from '../data/hybridCurriculum';
import { gameUrl, probeGame, type GameHealth } from '../lib/gameServer';
import { t } from '../styles/tokens';
import { Icon } from './icons';

/* HW+SW 미리보기 — 로컬에서 real 모드로 돌고 있는 게임을 iframe 으로 띄운다.

   MODI 하드웨어는 게임의 파이썬 프로세스(pymodi-plus)가 직접 잡는다. 브라우저는
   화면만 보여 주므로, 서버가 안 떠 있으면 실행 안내를 대신 띄운다. */

/* 상위 페이지가 공개 도메인(https://…vercel.app 등)이면 크롬이 로컬 주소 접근에
   권한을 묻는다(Local Network Access). localhost 에서 열었을 때는 묻지 않는다. */
const isLocalHost = () =>
  typeof location !== 'undefined' && /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);

export default function GamePreviewTab({ cur }: { cur: HybridCurriculum }) {
  const [health, setHealth] = useState<GameHealth | null>(null);
  const [nonce, setNonce] = useState(0);
  const alive = useRef(true);

  const check = useCallback(async () => {
    const h = await probeGame(cur.port);
    if (alive.current) setHealth(h);
    return h;
  }, [cur.port]);

  useEffect(() => {
    alive.current = true;
    let timer: number | undefined;
    const tick = async () => {
      const h = await probeGame(cur.port);
      if (!alive.current) return;
      setHealth(h);
      // 떠 있으면 확인 간격을 늘린다 — 게임이 매 0.1초 폴링 중이라 부담을 줄인다.
      timer = window.setTimeout(tick, h.reachable ? 8000 : 2500);
    };
    void tick();
    return () => {
      alive.current = false;
      if (timer) window.clearTimeout(timer);
    };
  }, [cur.port]);

  if (!health) {
    return <Frame><span style={{ color: t.muted, fontSize: 14 }}>게임 서버를 확인하는 중…</span></Frame>;
  }

  if (!health.reachable) {
    return (
      <Frame>
        <div style={{ maxWidth: 460, textAlign: 'left' }}>
          <span style={{ display: 'grid', placeItems: 'center', width: 46, height: 46, marginBottom: 12, borderRadius: 14, background: t.surface, border: `1px solid ${t.line}`, color: t.coralStrong }}>
            <Icon name="preview" size={22} />
          </span>
          <strong style={{ display: 'block', fontSize: 16, fontWeight: 750, marginBottom: 6 }}>게임이 실행되지 않았습니다</strong>
          <p style={{ margin: '0 0 12px', fontSize: 13, lineHeight: 1.7, color: t.muted }}>
            준비물 탭의 안내대로 <code style={codeInline}>{cur.folder}</code> 폴더에서 게임을 실행하면 여기에 화면이 나타납니다.
          </p>
          <div style={{ padding: '11px 13px', borderRadius: t.rSm, background: '#0d1117', marginBottom: 12 }}>
            <code style={{ fontFamily: t.mono, fontSize: 13, color: '#c9d1d9' }}>{cur.runCommand}</code>
          </div>
          {!isLocalHost() && (
            <p style={{ margin: '0 0 12px', fontSize: 12, lineHeight: 1.7, color: t.muted }}>
              게임을 이미 실행했는데도 이 화면이 보이면, 브라우저가 로컬 주소 접근을 막고 있는 것일 수 있습니다.
              주소창의 권한 아이콘에서 로컬 네트워크 접근을 허용하거나, LMS를 <code style={codeInline}>localhost</code> 에서 열어 보세요.
            </p>
          )}
          <button type="button" onClick={() => void check()} style={btn}>다시 확인</button>
        </div>
      </Frame>
    );
  }

  const mockWarn = health.readable && health.mode === 'mock';

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0, gap: 8, textAlign: 'left' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 11px', borderRadius: 999, fontSize: 12, fontWeight: 750, background: mockWarn ? t.coralSoft : t.greenSoft, color: mockWarn ? t.coralStrong : t.green }}>
          <Icon name="chip" size={13} />
          {health.readable ? (health.mode === 'real' ? 'MODI 연결 · real 모드' : 'mock 모드 — 모듈 없음') : '실행 중'}
        </span>
        <span style={{ fontSize: 12, color: t.muted }}>127.0.0.1:{cur.port}</span>
        <span style={{ marginLeft: 'auto', display: 'inline-flex', gap: 6 }}>
          <button type="button" onClick={() => setNonce((n) => n + 1)} style={btnSm}>새로고침</button>
          <a href={gameUrl(cur.port)} target="_blank" rel="noreferrer" style={{ ...btnSm, textDecoration: 'none' }}>새 창</a>
        </span>
      </div>

      {mockWarn && (
        <div style={{ fontSize: 13, lineHeight: 1.6, color: t.coralStrong, background: t.coralPale, border: `1px solid ${t.coralSoft}`, borderRadius: t.rSm, padding: '9px 12px' }}>
          모듈이 잡히지 않아 화면 조작만 가능합니다. 준비물 탭에서 연결을 확인한 뒤 게임을 다시 실행하세요.
        </div>
      )}

      <iframe
        key={nonce}
        src={gameUrl(cur.port)}
        title={`${cur.folder} 미리보기`}
        /* local-network-access: 공개 도메인에서 로컬 주소를 여는 경우 크롬이 요구한다.
           gamepad/autoplay: 게임이 소리와 입력을 쓴다. */
        allow="local-network-access; gamepad; autoplay"
        style={{ flex: 1, minHeight: 0, width: '100%', border: `1px solid ${t.line}`, borderRadius: t.rMd, background: '#030711' }}
      />
    </div>
  );
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      width: '100%', height: '100%', minHeight: 260, display: 'grid', placeItems: 'center', padding: 24,
      border: `1px dashed ${t.lineStrong}`, borderRadius: t.rMd, background: t.soft,
      fontFamily: t.font, color: t.ink, textAlign: 'left',
    }}>
      {children}
    </div>
  );
}

const btn = {
  border: 0, borderRadius: t.rSm, background: t.coralInk, color: '#fff',
  padding: '10px 18px', fontFamily: t.font, fontSize: 14, fontWeight: 750, cursor: 'pointer',
} as const;

const btnSm = {
  border: `1px solid ${t.lineStrong}`, borderRadius: 9, background: t.surface, color: t.inkSoft,
  padding: '5px 11px', fontFamily: t.font, fontSize: 12, fontWeight: 700, cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center',
} as const;

const codeInline = {
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
  background: '#ececef', padding: '1px 6px', borderRadius: 5, fontSize: 12.5,
} as const;
