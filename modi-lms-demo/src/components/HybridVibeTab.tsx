import { useEffect, useRef, useState, type CSSProperties } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';
import { MIN_STATIC_PROMPT_LENGTH, runStaticTurn, type StaticVibeCurriculum } from '../lib/staticVibe';
import { t } from '../styles/tokens';
import { Icon } from './icons';
import { DevelopmentProgress } from './DevelopmentProgress';
import type { DevelopmentProgressState } from '../lib/developmentTimeline';

/* HW+SW 바이브 코딩 탭.
   화면은 기존 VibeCodingTab 과 같은 모양이지만 백엔드를 호출하지 않는다.
   lib/staticVibe.ts 가 커리큘럼 정답지를 타이핑 효과로 흘려보낸다.

   SW(Sandpack) 경로는 VibeCodingTab 이 그대로 담당한다 — 이 파일은 HW_SW 전용. */

interface Msg { role: 'user' | 'assistant'; text: string }

interface Props {
  cur: StaticVibeCurriculum;
  matched: string[];
  onProgress: (matched: string[], unlocked: boolean) => void;
  hasCode?: boolean;
}

const hStyle: CSSProperties = { fontWeight: 750, fontSize: 15, margin: '10px 0 6px', color: t.ink };
const md: Components = {
  p: ({ children }) => <p style={{ margin: '0 0 8px' }}>{children}</p>,
  ul: ({ children }) => <ul style={{ margin: '4px 0 8px', paddingLeft: 18 }}>{children}</ul>,
  ol: ({ children }) => <ol style={{ margin: '4px 0 8px', paddingLeft: 18 }}>{children}</ol>,
  li: ({ children }) => <li style={{ margin: '2px 0' }}>{children}</li>,
  strong: ({ children }) => <strong style={{ fontWeight: 750 }}>{children}</strong>,
  h1: ({ children }) => <div style={hStyle}>{children}</div>,
  h2: ({ children }) => <div style={hStyle}>{children}</div>,
  h3: ({ children }) => <div style={hStyle}>{children}</div>,
  code: ({ children }) => (
    <code style={{ display: 'inline', background: t.soft, padding: '1px 5px', borderRadius: 4, fontFamily: t.mono, fontSize: 13, color: t.ink }}>{children}</code>
  ),
};

export default function HybridVibeTab({ cur, matched, onProgress, hasCode = true }: Props) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [status, setStatus] = useState('');
  const [development, setDevelopment] = useState<DevelopmentProgressState | null>(null);
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const abort = useRef<AbortController | null>(null);

  /* 사용자가 위로 올려 읽는 중이면 방해하지 않도록 바닥 근처일 때만 따라간다. */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    if (nearBottom) el.scrollTop = el.scrollHeight;
  }, [messages, status, development]);

  /* 탭을 떠나거나 강좌가 바뀌면 진행 중인 타이핑을 끊는다. */
  useEffect(() => () => abort.current?.abort(), []);

  const send = async () => {
    const msg = input.trim();
    if (!msg || busy || matched.length >= cur.keywords.length) return;
    setInput('');
    setBusy(true);
    setStatus('');
    setDevelopment(null);
    setMessages((m) => [...m, { role: 'user', text: msg }, { role: 'assistant', text: '' }]);

    const ac = new AbortController();
    abort.current = ac;

    const append = (tk: string) =>
      setMessages((m) => {
        const c = m.slice();
        const last = c[c.length - 1];
        if (last?.role === 'assistant') c[c.length - 1] = { ...last, text: last.text + tk };
        return c;
      });

    try {
      await runStaticTurn(cur, msg, matched, (ev) => {
        if (ev.type === 'status') { setStatus(ev.message); return; }
        if (ev.type === 'progress') { setDevelopment(ev.value); return; }
        if (ev.type === 'token') { setStatus(''); append(ev.text); return; }
        if (ev.type === 'done') { onProgress(ev.matched, ev.unlocked); setStatus(''); setDevelopment(null); }
      }, ac.signal, hasCode ? 'hybrid' : 'software');
    } finally {
      setBusy(false);
      setStatus('');
      setDevelopment(null);
    }
  };

  const done = cur.keywords.filter((k) => matched.includes(k.label)).length;
  const implemented = done >= cur.keywords.length;
  const canSend = !busy && !implemented && input.trim().length > 0;

  return (
    <div style={{ display: 'flex', height: '100%', gap: 12, minHeight: 0, fontFamily: t.font, color: t.ink, textAlign: 'left' }}>
      {/* 왼쪽: 채팅 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', border: `1px solid ${t.line}`, borderRadius: t.rMd, minWidth: 0, background: t.surface, overflow: 'hidden' }}>
        <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {messages.length === 0 && (
            <div style={{ margin: 'auto 0', display: 'grid', gap: 12, justifyItems: 'start' }}>
              <span style={{ width: 42, height: 42, display: 'grid', placeItems: 'center', borderRadius: 13, background: t.coralPale, color: t.coralStrong }}>
                <Icon name="sparkle" size={21} />
              </span>
              <div>
                <strong style={{ display: 'block', fontSize: 16, fontWeight: 750, color: t.ink, marginBottom: 4 }}>{cur.promptTitle ?? '만들고 싶은 것을 설명해 주세요'}</strong>
                <span style={{ fontSize: 13, color: t.muted, lineHeight: 1.6 }}>아래 예시를 눌러 시작해도 좋아요.</span>
              </div>
              <div style={{ display: 'grid', gap: 6, width: '100%' }}>
                {cur.examples.map((ex) => (
                  <button key={ex} type="button" onClick={() => setInput(ex)}
                    style={{ textAlign: 'left', padding: '10px 13px', border: `1px solid ${t.line}`, borderRadius: 11, background: t.soft, color: t.inkSoft, fontFamily: t.font, fontSize: 13, lineHeight: 1.5, cursor: 'pointer' }}>
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m, i) => {
            const isUser = m.role === 'user';
            const isLast = i === messages.length - 1;
            return (
              <div key={i} style={{
                alignSelf: isUser ? 'flex-end' : 'flex-start',
                maxWidth: '85%', padding: '10px 14px', borderRadius: 14, lineHeight: 1.55,
                wordBreak: 'break-word', whiteSpace: isUser ? 'pre-wrap' : 'normal',
                background: isUser ? t.coralInk : t.soft, color: isUser ? '#fff' : t.ink,
                boxShadow: isUser ? t.shCoral : 'none',
              }}>
                {isUser ? m.text
                  : m.text ? <ReactMarkdown remarkPlugins={[remarkGfm]} components={md}>{m.text}</ReactMarkdown>
                  : (busy && isLast ? <span className="typing" aria-label="생성 중"><span /><span /><span /></span> : null)}
              </div>
            );
          })}
          {status && !development && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: t.muted, fontSize: 13 }}>
              <span className="typing" aria-hidden="true"><span /><span /><span /></span>
              {status}
            </div>
          )}
          {development && <DevelopmentProgress state={development} />}
        </div>

        <div style={{ borderTop: `1px solid ${t.line}`, padding: 12, background: t.surface }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
            <textarea
              value={input} rows={2} disabled={busy || implemented}
              placeholder={implemented ? '구현이 완료되어 추가 입력이 잠겼습니다' : '만들고 싶은 동작을 설명해주세요'}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(); } }}
              style={{ flex: 1, resize: 'none', padding: 10, border: `1px solid ${t.line}`, borderRadius: t.rSm, fontFamily: t.font, fontSize: 14, lineHeight: 1.5, color: t.ink, background: t.surface }}
            />
            <button type="button" onClick={() => void send()} disabled={!canSend} aria-label="보내기"
              style={{ width: 46, flex: '0 0 46px', display: 'grid', placeItems: 'center', borderRadius: t.rSm, border: 'none', background: canSend ? t.coralInk : t.lineStrong, color: '#fff', cursor: canSend ? 'pointer' : 'default' }}>
              <Icon name="send" size={19} />
            </button>
          </div>
          <div style={{ marginTop: 6, textAlign: 'right', color: input.length >= MIN_STATIC_PROMPT_LENGTH ? t.green : t.muted, fontSize: 11 }}>
            {implemented ? '구현 완료 · 추가 입력 불가' : `자세한 설명 권장 · ${input.length} / ${MIN_STATIC_PROMPT_LENGTH}자 이상`}
          </div>
        </div>
      </div>

      {/* 오른쪽: 정해야 할 세 가지 */}
      <div style={{ flex: '0 0 320px', maxWidth: 320, display: 'flex', flexDirection: 'column', border: `1px solid ${t.line}`, borderRadius: t.rMd, background: t.surface, padding: 16, overflowY: 'auto' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: t.coralStrong, marginBottom: 4 }}>정해야 할 세 가지</div>
        <div style={{ fontSize: 12, color: t.muted, marginBottom: 14 }}>{done} / {cur.keywords.length} 완료</div>

        <div style={{ display: 'grid', gap: 8 }}>
          {cur.keywords.map((k) => {
            const on = matched.includes(k.label);
            return (
              <div key={k.label} style={{ display: 'flex', gap: 9, alignItems: 'center', padding: '11px 12px', border: `1px solid ${on ? t.greenSoft : t.line}`, borderRadius: t.rSm, background: on ? t.greenSoft : t.soft }}>
                <span style={{ flex: '0 0 auto', display: 'grid', placeItems: 'center', width: 22, height: 22, borderRadius: 999, background: on ? t.green : t.lineStrong, color: '#fff' }}>
                  <Icon name="check" size={13} />
                </span>
                <strong style={{ fontSize: 14, color: on ? t.green : t.muted }}>{k.label}</strong>
              </div>
            );
          })}
        </div>

        <p style={{ marginTop: 16, marginBottom: 0, fontSize: 12.5, lineHeight: 1.7, color: t.muted }}>
          {done < cur.keywords.length
            ? `세 가지가 모두 정해지면 ${hasCode ? '코드 보기·' : ''}미리보기와 학습 노트가 열립니다.`
            : `${hasCode ? '코드 보기·' : ''}미리보기와 학습 노트가 열렸어요. 위쪽 탭에서 확인해 보세요.`}
        </p>
      </div>
    </div>
  );
}
