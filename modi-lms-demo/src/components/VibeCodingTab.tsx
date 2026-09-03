import { useRef, useState, type CSSProperties } from 'react';
import { Highlight, themes } from 'prism-react-renderer';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';
import { streamChat, type VibeMode, type CodingType, type CodeLangs, type VibeEvent, type VibeResult } from '../lib/vibeClient';
import type { CourseType } from '../types';
import { t } from '../styles/tokens';

interface Msg { role: 'user' | 'assistant'; text: string; }
interface Props { courseType?: CourseType; onResult?: (r: VibeResult) => void; }

const CODE_TABS: { key: keyof CodeLangs; label: string; lang: string }[] = [
  { key: 'python', label: 'main.py', lang: 'python' },
  { key: 'javascript', label: 'main.js', lang: 'javascript' },
  { key: 'c', label: 'main.c', lang: 'c' },
];

// 마크다운 → 실제 요소로 렌더 (children만 받아 node 등 불필요한 prop 유출 방지)
const hStyle: CSSProperties = { fontWeight: 700, fontSize: 15, margin: '10px 0 6px', color: t.ink };
const md: Components = {
  p: ({ children }) => <p style={{ margin: '0 0 8px' }}>{children}</p>,
  ul: ({ children }) => <ul style={{ margin: '4px 0 8px', paddingLeft: 18 }}>{children}</ul>,
  ol: ({ children }) => <ol style={{ margin: '4px 0 8px', paddingLeft: 18 }}>{children}</ol>,
  li: ({ children }) => <li style={{ margin: '2px 0' }}>{children}</li>,
  strong: ({ children }) => <strong style={{ fontWeight: 700 }}>{children}</strong>,
  em: ({ children }) => <em>{children}</em>,
  h1: ({ children }) => <div style={hStyle}>{children}</div>,
  h2: ({ children }) => <div style={hStyle}>{children}</div>,
  h3: ({ children }) => <div style={hStyle}>{children}</div>,
  a: ({ href, children }) => <a href={href} target="_blank" rel="noreferrer" style={{ color: t.coralStrong }}>{children}</a>,
  code: ({ children }) => (
    <code style={{ display: 'inline', background: t.soft, padding: '1px 5px', borderRadius: 4, fontFamily: 'ui-monospace, Consolas, monospace', fontSize: 13, color: t.ink }}>
      {children}
    </code>
  ),
};

export default function VibeCodingTab({ courseType = 'HW', onResult }: Props) {
  const codingType: CodingType = courseType === 'SW' ? 'react' : 'blockly';

  const [messages, setMessages] = useState<Msg[]>([]);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState<CodeLangs>({});
  const [mode, setMode] = useState<VibeMode>('quick');
  const [input, setInput] = useState('');
  const [codeTab, setCodeTab] = useState<keyof CodeLangs>('python');

  const sessionId = useRef(crypto.randomUUID?.() ?? `demo-${Date.now()}`);
  const resetBuf = useRef(false);

  const send = async () => {
    const msg = input.trim();
    if (!msg || busy) return;
    setInput('');
    setBusy(true);
    setStatus('');
    resetBuf.current = false;
    setMessages((m) => [...m, { role: 'user', text: msg }, { role: 'assistant', text: '' }]);

    const onEvent = (ev: VibeEvent) => {
      if (ev.type === 'status') { setStatus(ev.message ?? ''); return; }
      if (ev.type === 'agent_step' || ev.type === 'agent_step_update' || ev.type === 'blockly_ready') {
        resetBuf.current = true;
        return;
      }
      if (ev.type === 'token') {
        const reset = resetBuf.current;
        resetBuf.current = false;
        const tk = ev.text ?? '';
        setMessages((m) => {
          const c = m.slice();
          const last = c[c.length - 1];
          if (last?.role === 'assistant') c[c.length - 1] = { ...last, text: (reset ? '' : last.text) + tk };
          return c;
        });
        return;
      }
      if (ev.type === 'done') {
        if (ev.blockly_code_langs) setCode(ev.blockly_code_langs);
        onResult?.(ev); // 흐름도·학습노트·준비물·설계문서 탭이 쓰도록 결과를 위로 전달
        setStatus('');
      }
    };

    try {
      await streamChat({ sessionId: sessionId.current, message: msg, mode, codingType }, onEvent);
    } catch (e) {
      setMessages((m) => {
        const c = m.slice();
        const last = c[c.length - 1];
        if (last?.role === 'assistant') c[c.length - 1] = { ...last, text: last.text || `오류: ${(e as Error).message}` };
        return c;
      });
    } finally {
      setBusy(false);
    }
  };

  const activeLang = CODE_TABS.find((x) => x.key === codeTab)!.lang;
  const activeCode = code[codeTab] ?? '';

  return (
    <div style={{ display: 'flex', height: '100%', gap: 12, minHeight: 0, textAlign: 'left', fontFamily: t.font, color: t.ink }}>
      {/* 왼쪽: 채팅 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', border: `1px solid ${t.line}`, borderRadius: t.rMd, minWidth: 0, background: t.surface, overflow: 'hidden' }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {messages.length === 0 && (
            <div style={{ color: t.muted, lineHeight: 1.6 }}>
              만들고 싶은 동작을 설명해보세요.<br />
              예: “조이스틱으로 조종하고 앞에 장애물 있으면 피하는 자동차”
            </div>
          )}
          {messages.map((m, i) => {
            const isUser = m.role === 'user';
            return (
              <div
                key={i}
                style={{
                  alignSelf: isUser ? 'flex-end' : 'flex-start',
                  maxWidth: '85%', padding: '10px 14px', borderRadius: 14, textAlign: 'left', lineHeight: 1.55,
                  wordBreak: 'break-word', whiteSpace: isUser ? 'pre-wrap' : 'normal',
                  background: isUser ? t.coral : t.soft,
                  color: isUser ? '#fff' : t.ink,
                  boxShadow: isUser ? t.shCoral : 'none',
                }}
              >
                {isUser ? (
                  m.text
                ) : m.text ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={md}>{m.text}</ReactMarkdown>
                ) : (
                  busy && i === messages.length - 1 ? '…' : null
                )}
              </div>
            );
          })}
          {status && <div style={{ color: t.muted, fontSize: 13 }}>… {status}</div>}
        </div>

        <div style={{ borderTop: `1px solid ${t.line}`, padding: 12, background: t.surface }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <button type="button" onClick={() => setMode('quick')} style={modeBtn(mode === 'quick')}>바로 만들기</button>
            <button type="button" onClick={() => setMode('design')} style={modeBtn(mode === 'design')}>설계부터</button>
            <span style={{ fontSize: 12, color: t.muted }}>
              {mode === 'quick' ? '설명하면 바로 MODI 코드를 만들어요' : '설계부터 함께 잡아가요'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <textarea
              value={input}
              rows={2}
              disabled={busy}
              placeholder="만들고 싶은 동작을 설명해주세요"
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(); } }}
              style={{ flex: 1, resize: 'none', padding: 10, border: `1px solid ${t.line}`, borderRadius: t.rSm, fontFamily: 'inherit', fontSize: 14, color: t.ink, outline: 'none' }}
            />
            <button type="button" onClick={() => void send()} disabled={busy || !input.trim()}
              style={{ width: 44, borderRadius: t.rSm, border: 'none', background: busy || !input.trim() ? t.lineStrong : t.coral, color: '#fff', cursor: busy || !input.trim() ? 'default' : 'pointer', fontSize: 18 }}>
              ↑
            </button>
          </div>
        </div>
      </div>

      {/* 오른쪽: 코드 보기 (에디터 룩 + 하이라이팅 + 라인번호) */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRadius: t.rMd, overflow: 'hidden', background: '#0d1117', minWidth: 0, border: '1px solid #1f2430' }}>
        <div style={{ display: 'flex', gap: 2, padding: '8px 8px 0', background: '#161b22' }}>
          {CODE_TABS.map((x) => (
            <button
              key={x.key}
              type="button"
              onClick={() => setCodeTab(x.key)}
              style={{
                padding: '8px 16px', border: 'none', cursor: 'pointer', borderRadius: '8px 8px 0 0', fontFamily: t.font, fontSize: 13,
                background: codeTab === x.key ? '#0d1117' : 'transparent',
                color: codeTab === x.key ? '#fff' : '#8b949e',
                fontWeight: codeTab === x.key ? 700 : 400,
              }}
            >
              {x.label}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflow: 'auto' }}>
          {activeCode ? (
            <Highlight theme={themes.vsDark} code={activeCode} language={activeLang}>
              {({ tokens, getLineProps, getTokenProps }) => (
                <pre style={{ margin: 0, padding: '14px 0', textAlign: 'left', background: 'transparent', color: '#c9d1d9', fontFamily: 'SFMono-Regular, Menlo, Consolas, monospace', fontSize: 13, lineHeight: 1.65 }}>
                  {tokens.map((line, i) => {
                    const lp = getLineProps({ line });
                    return (
                      <div key={i} className={lp.className} style={{ ...lp.style, display: 'flex' }}>
                        <span style={lineNoStyle}>{i + 1}</span>
                        <span style={{ whiteSpace: 'pre', paddingRight: 16 }}>
                          {line.map((token, key) => {
                            const tp = getTokenProps({ token });
                            return <span key={key} className={tp.className} style={tp.style}>{tp.children}</span>;
                          })}
                        </span>
                      </div>
                    );
                  })}
                </pre>
              )}
            </Highlight>
          ) : (
            <div style={{ padding: 16, color: '#6b7280', fontFamily: 'SFMono-Regular, Menlo, Consolas, monospace', fontSize: 13 }}>
              // 왼쪽에서 코드를 생성하면 여기에 표시됩니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const lineNoStyle: CSSProperties = {
  width: 44, flexShrink: 0, textAlign: 'right', paddingRight: 14,
  color: '#4b5563', userSelect: 'none',
};

function modeBtn(active: boolean): CSSProperties {
  return {
    padding: '6px 12px', borderRadius: 10, cursor: 'pointer', background: active ? t.coralPale : t.surface,
    border: active ? `1px solid ${t.coral}` : `1px solid ${t.line}`,
    color: active ? t.coralStrong : t.muted,
    fontWeight: active ? 700 : 400, fontFamily: t.font,
  };
}
