import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Highlight, themes } from 'prism-react-renderer';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';
import { streamChat, type VibeMode, type CodingType, type CodeLangs, type VibeEvent, type VibeResult } from '../lib/vibeClient';
import type { CourseType } from '../types';
import SandpackApp from './SandpackApp';
import HybridPreview from './HybridPreview';
import { t } from '../styles/tokens';
import { Segmented, EmptyState } from './ui';
import { Icon } from './icons';

interface Msg { role: 'user' | 'assistant'; text: string; }
interface CourseContext {
  title: string;
  goal: string;
  brief: string;
  examples: string[];
  referenceUrl?: string;
}
interface Props { courseType?: CourseType; courseContext?: CourseContext; onResult?: (r: VibeResult) => void; }

const CODE_TABS: { key: keyof CodeLangs; label: string; lang: string }[] = [
  { key: 'python', label: 'main.py', lang: 'python' },
  { key: 'javascript', label: 'main.js', lang: 'javascript' },
  { key: 'c', label: 'main.c', lang: 'c' },
];

const MODE_OPTIONS = [
  { value: 'quick' as VibeMode, label: '바로 만들기' },
  { value: 'design' as VibeMode, label: '설계부터' },
];

// 대화가 비었을 때 보여 줄 예시. 누르면 입력창에 채워진다(전송은 사용자가 직접).
const EXAMPLES: Record<'hw' | 'sw', string[]> = {
  hw: [
    '조이스틱으로 조종하고 앞에 장애물 있으면 피하는 자동차',
    '버튼을 누르면 LED 색이 바뀌는 무드등',
  ],
  sw: [
    'DNA 이중나선을 돌려 볼 수 있는 학습 페이지',
    '오늘의 할 일을 적고 지울 수 있는 웹앱',
  ],
};

const hStyle: CSSProperties = { fontWeight: 750, fontSize: 15, margin: '10px 0 6px', color: t.ink };
const md: Components = {
  p: ({ children }) => <p style={{ margin: '0 0 8px' }}>{children}</p>,
  ul: ({ children }) => <ul style={{ margin: '4px 0 8px', paddingLeft: 18 }}>{children}</ul>,
  ol: ({ children }) => <ol style={{ margin: '4px 0 8px', paddingLeft: 18 }}>{children}</ol>,
  li: ({ children }) => <li style={{ margin: '2px 0' }}>{children}</li>,
  strong: ({ children }) => <strong style={{ fontWeight: 750 }}>{children}</strong>,
  em: ({ children }) => <em>{children}</em>,
  h1: ({ children }) => <div style={hStyle}>{children}</div>,
  h2: ({ children }) => <div style={hStyle}>{children}</div>,
  h3: ({ children }) => <div style={hStyle}>{children}</div>,
  a: ({ href, children }) => <a href={href} target="_blank" rel="noreferrer" style={{ color: t.coralStrong }}>{children}</a>,
  code: ({ children }) => (
    <code style={{ display: 'inline', background: t.soft, padding: '1px 5px', borderRadius: 4, fontFamily: t.mono, fontSize: 13, color: t.ink }}>{children}</code>
  ),
};

function Hi({ code, lang }: { code: string; lang: string }) {
  return (
    <Highlight theme={themes.vsDark} code={code} language={lang}>
      {({ tokens, getLineProps, getTokenProps }) => (
        <pre style={{ margin: 0, padding: '14px 0', background: 'transparent', color: '#c9d1d9', fontFamily: t.mono, fontSize: 13, lineHeight: 1.65 }}>
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
  );
}

export default function VibeCodingTab({ courseType = 'HW', courseContext, onResult }: Props) {
  const codingType: CodingType = courseType === 'SW' ? 'react' : courseType === 'HW_SW' ? 'hybrid' : 'blockly';
  const isReact = codingType === 'react';
  const isHybrid = codingType === 'hybrid';

  const [messages, setMessages] = useState<Msg[]>([]);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState<CodeLangs>({});
  const [webFiles, setWebFiles] = useState<Record<string, string> | null>(null);
  const [mode, setMode] = useState<VibeMode>('quick');
  const [input, setInput] = useState('');
  const [codeTab, setCodeTab] = useState<keyof CodeLangs>('python');

  const sessionId = useRef(crypto.randomUUID?.() ?? `demo-${Date.now()}`);
  const resetBuf = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  /* 예전에는 자동 스크롤이 없어 응답이 길어지면 화면 밖으로 밀려났다.
     사용자가 위로 올려 읽는 중이면 방해하지 않도록, 바닥 근처일 때만 따라간다. */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    if (nearBottom) el.scrollTop = el.scrollHeight;
  }, [messages, status]);

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
        if (ev.generated_code) setWebFiles(ev.generated_code);
        onResult?.(ev);
        setStatus('');
      }
    };

    try {
      const message = courseContext
        ? `현재 강좌: ${courseContext.title}\n학습 목표: ${courseContext.goal}\n프로젝트 설명: ${courseContext.brief}${courseContext.referenceUrl ? `\n참고 미리보기: ${courseContext.referenceUrl}` : ''}\n\n사용자 요청: ${msg}\n\n이 강좌와 직접 관련된 설명과 실행 가능한 React 결과물을 만들어 주세요.`
        : msg;
      await streamChat({ sessionId: sessionId.current, message, mode, codingType }, onEvent);
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
  const hasWeb = !!webFiles && Object.keys(webFiles).length > 0;
  const examples = courseContext?.examples ?? (isReact ? EXAMPLES.sw : EXAMPLES.hw);
  const canSend = !busy && input.trim().length > 0;

  return (
    <div style={{ display: 'flex', height: '100%', gap: 12, minHeight: 0, fontFamily: t.font, color: t.ink }}>
      {/* 왼쪽: 채팅 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', border: `1px solid ${t.line}`, borderRadius: t.rMd, minWidth: 0, background: t.surface, overflow: 'hidden' }}>
        <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {messages.length === 0 && (
            <div style={{ margin: 'auto 0', display: 'grid', gap: 12, justifyItems: 'start' }}>
              <span style={{ width: 42, height: 42, display: 'grid', placeItems: 'center', borderRadius: 13, background: t.coralPale, color: t.coralStrong }}>
                <Icon name="sparkle" size={21} />
              </span>
              <div>
                <strong style={{ display: 'block', fontSize: 16, fontWeight: 750, color: t.ink, marginBottom: 4 }}>{courseContext ? `${courseContext.title}에서 만들 것을 설명해 주세요` : '만들고 싶은 것을 설명해 주세요'}</strong>
                <span style={{ fontSize: 13, color: t.muted, lineHeight: 1.6 }}>{courseContext ? '현재 강좌의 기능과 목표를 바탕으로 결과를 만듭니다.' : '아래 예시를 눌러 시작해도 좋아요.'}</span>
              </div>
              <div style={{ display: 'grid', gap: 6, width: '100%' }}>
                {examples.map((ex) => (
                  <button key={ex} type="button" onClick={() => setInput(ex)}
                    style={{ textAlign: 'left', padding: '10px 13px', border: `1px solid ${t.line}`, borderRadius: 11, background: t.soft, color: t.inkSoft, fontFamily: t.font, fontSize: 13, lineHeight: 1.5, cursor: 'pointer', transition: 'border-color .16s ease, background .16s ease' }}>
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
                  /* 예전엔 '…' 문자 하나여서 멈춘 것처럼 보였다 → 실제로 움직이는 인디케이터 */
                  : (busy && isLast ? <span className="typing" aria-label="생성 중"><span /><span /><span /></span> : null)}
              </div>
            );
          })}
          {status && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: t.muted, fontSize: 13 }}>
              <span className="typing" aria-hidden="true"><span /><span /><span /></span>
              {status}
            </div>
          )}
        </div>

        <div style={{ borderTop: `1px solid ${t.line}`, padding: 12, background: t.surface }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
            <Segmented label="생성 모드" value={mode} options={MODE_OPTIONS} onChange={setMode} />
            <span style={{ fontSize: 12, color: t.muted }}>
              {mode === 'quick' ? '설명하면 바로 MODI 코드를 만들어요' : '설계부터 함께 잡아가요'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
            <textarea
              value={input} rows={2} disabled={busy}
              placeholder={courseContext ? `${courseContext.title}에서 추가하거나 바꿀 내용을 설명해주세요` : '만들고 싶은 동작을 설명해주세요'}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(); } }}
              /* outline:'none' 을 두면 키보드 포커스가 보이지 않는다 → 전역 :focus-visible 에 맡긴다 */
              style={{ flex: 1, resize: 'none', padding: 10, border: `1px solid ${t.line}`, borderRadius: t.rSm, fontFamily: t.font, fontSize: 14, lineHeight: 1.5, color: t.ink, background: t.surface }}
            />
            <button type="button" onClick={() => void send()} disabled={!canSend} aria-label="보내기"
              style={{ width: 46, flex: '0 0 46px', display: 'grid', placeItems: 'center', borderRadius: t.rSm, border: 'none', background: canSend ? t.coralInk : t.lineStrong, color: '#fff', cursor: canSend ? 'pointer' : 'default', transition: 'background .16s ease' }}>
              <Icon name="send" size={19} />
            </button>
          </div>
        </div>
      </div>

      {/* 오른쪽: SW=Sandpack 미리보기, HW=py/js/c */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRadius: t.rMd, overflow: 'hidden', minWidth: 0, background: isReact || isHybrid ? t.surface : '#0d1117', border: isReact || isHybrid ? `1px solid ${t.line}` : '1px solid #1f2430' }}>
        {isReact || isHybrid ? (
          hasWeb ? (
            isReact ? <SandpackApp files={webFiles!} mode="preview" /> : <HybridPreview files={webFiles} />
          ) : (
            <EmptyState icon="preview" title="아직 미리볼 결과가 없어요" hint="왼쪽에서 만들고 싶은 것을 설명하면 결과가 여기에 실행됩니다." />
          )
        ) : (
          <>
            <div style={{ display: 'flex', gap: 2, padding: '8px 8px 0', background: '#161b22' }}>
              {CODE_TABS.map((x) => (
                <button key={x.key} type="button" onClick={() => setCodeTab(x.key)} style={rightTab(codeTab === x.key)}>{x.label}</button>
              ))}
            </div>
            <div style={{ flex: 1, overflow: 'auto' }}>
              {activeCode ? <Hi code={activeCode} lang={activeLang} /> : (
                <div style={{ height: '100%', display: 'grid', placeItems: 'center', padding: 24, textAlign: 'center' }}>
                  <div>
                    <span style={{ display: 'grid', placeItems: 'center', width: 46, height: 46, margin: '0 auto 12px', borderRadius: 14, background: '#161b22', border: '1px solid #1f2430', color: '#8b949e' }}>
                      <Icon name="terminal" size={22} />
                    </span>
                    <strong style={{ display: 'block', fontSize: 15, fontWeight: 700, color: '#c9d1d9' }}>생성된 코드가 여기에 표시됩니다</strong>
                    <span style={{ display: 'block', marginTop: 4, fontSize: 13, lineHeight: 1.6, color: '#7d8590' }}>왼쪽에서 만들고 싶은 동작을 설명해 보세요.</span>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const lineNoStyle: CSSProperties = {
  width: 44, flexShrink: 0, textAlign: 'right', paddingRight: 14, color: '#4b5563', userSelect: 'none',
};

function rightTab(active: boolean): CSSProperties {
  return {
    padding: '8px 16px', border: 'none', cursor: 'pointer', borderRadius: '8px 8px 0 0', fontFamily: t.font, fontSize: 13,
    background: active ? '#0d1117' : 'transparent', color: active ? '#fff' : '#8b949e', fontWeight: active ? 700 : 500,
    transition: 'background .16s ease, color .16s ease',
  };
}
