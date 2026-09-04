import { useCallback, useEffect, useRef, useState } from 'react';
import { MODITOR_URL } from '../config/urls';
import { t } from '../styles/tokens';

interface ModitorTabProps {
  locale?: string;
  debug?: boolean;
  blocklyXml?: string;   // 바이브 코딩 결과(result.blockly_xml) — 있으면 모디터에 주입
}

// 모디터가 이해하는 블록 로드 메시지 (docs/modi/modi_core.md 규약)
function buildLoadMessage(xmlCode: string): string {
  return JSON.stringify({ type: 'LOAD_BLOCK_FROM_FILE_REQUEST', data: { xmlCode } });
}

export default function ModitorTab({ locale = 'ko', debug = false, blocklyXml }: ModitorTabProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loaded, setLoaded] = useState(false);
  const src = `${MODITOR_URL}?locale=${locale}${debug ? '&debug=true' : ''}`;
  const origin = (() => { try { return new URL(MODITOR_URL).origin; } catch { return '*'; } })();

  // 블록 XML을 모디터 iframe으로 전송
  const postXml = useCallback(() => {
    const win = iframeRef.current?.contentWindow;
    if (!win || !blocklyXml) return;
    win.postMessage(buildLoadMessage(blocklyXml), origin);
  }, [blocklyXml, origin]);

  // iframe 로드 완료 + XML 준비되면 주입. 블록 캔버스 초기화 타이밍을 위해 몇 번 재시도.
  useEffect(() => {
    if (!loaded || !blocklyXml) return;
    postXml();
    const timers = [400, 1000, 2000].map((ms) => window.setTimeout(postXml, ms));
    return () => timers.forEach(window.clearTimeout);
  }, [loaded, blocklyXml, postXml]);

  // (디버그) 모디터가 보내는 메시지를 콘솔에 찍어 규약/방향 확인
  useEffect(() => {
    if (!debug) return;
    const onMsg = (e: MessageEvent) => {
      if (e.source === iframeRef.current?.contentWindow) console.log('[moditor→] ', e.data);
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [debug]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <iframe
        ref={iframeRef}
        src={src}
        title="모디 블록 에디터"
        allow="serial; usb; bluetooth; clipboard-write"
        onLoad={() => setLoaded(true)}
        style={{ width: '100%', height: '100%', border: 'none', borderRadius: 12 }}
      />
      {/* 자동 주입 타이밍이 어긋날 때를 대비한 수동 트리거 (데모 안정성) */}
      {blocklyXml && (
        <button
          type="button"
          className="lift lift--sm"
          onClick={postXml}
          style={{
            position: 'absolute', top: 12, right: 12, zIndex: 2,
            padding: '8px 14px', border: 'none', borderRadius: 10, cursor: 'pointer',
            background: t.coralInk, color: '#fff', fontFamily: t.font, fontSize: 14, fontWeight: 700, boxShadow: t.shCoral,
          }}
        >
          블록 불러오기
        </button>
      )}
    </div>
  );
}
