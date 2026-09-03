import { useRef, useState, type CSSProperties } from 'react';
import { streamChat, type VibeMode, type CodingType, type CodeLangs, type VibeEvent } from '../lib/vibeClient';
import type { CourseType } from '../types';

interface Msg { role: 'user' | 'assistant'; text: string; }
interface Props { courseType?: CourseType; }

const CODE_TABS: { key: keyof CodeLangs; label: string }[] = [
  { key: 'python', label: 'main.py' },
  { key: 'javascript', label: 'main.js' },
  { key: 'c', label: 'main.c' },
];

export default function VibeCodingTab({ courseType = 'HW' }: Props) {
  // 소프트웨어면 react, 그 외(HW/HW_SW)는 blockly
  const codingType: CodingType = courseType === 'SW' ? 'react' : 'blockly';

  const [messages, setMessages] = useState<Msg[]>([]);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState<CodeLangs>({});
  const [mode, setMode] = useState<VibeMode>('quick'); // 기본: 바로 만들기
  const [input, setInput] = useState('');
  const [codeTab, setCodeTab] = useState<keyof CodeLangs>('python');

  const sessionId = useRef(crypto.randomUUID?.() ?? `demo-${Date.now()}`);
  const resetBuf = useRef(false); // 재시도 중간 토큰을 최종 요약이 덮어쓰게 하는 플래그

  const send = async () => {
    const msg = input.trim();
    if (!msg || busy) return;
    setInput('');
    setBusy(true);
    setStatus('');
    resetBuf.current = false;
    setMessages((m) => [...m, { role: 'user', text: msg }, { role: 'assistant', text: '' }]);

    const onEvent = (ev: VibeEvent) => {
      if (ev.type === 'status') {
        setStatus(ev.message ?? '');
        return;
      }
      if (ev.type === 'agent_step' || ev.type === 'agent_step_update' || ev.type === 'blockly_ready') {
        resetBuf.current = true; // 다음 토큰은 새 세그먼트(최종 요약) 시작
        return;
      }
      if (ev.type === 'token') {
        const reset = resetBuf.current;
        resetBuf.current = false;
        const t = ev.text ?? '';
        setMessages((m) => {
          const c = m.slice();
          const last = c[c.length - 1];
          if (last?.role === 'assistant') c[c.length - 1] = { ...last, text: (reset ? '' : last.text) + t };
          return c;
        });
        return;
      }
      if (ev.type === 'done') {
        if (ev.blockly_code_langs) setCode(ev.blockly_code_langs); // ★ 코드 보기 반영
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

  return (
    <div style={{ display: 'flex', height: '100%', gap: 12, minHeight: 0 }}>
      {/* 왼쪽: 채팅 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', border: '1px solid #e2e8f0', borderRadius: 12, minWidth: 0 }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {messages.length === 0 && (
            <div style={{ color: '#94a3b8' }}>
              만들고 싶은 동작을 설명해보세요. 예: "조이스틱으로 조종하고 앞에 장애물 있으면 피하는 자동차"
            </div>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              style={{
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%', padding: '10px 14px', borderRadius: 12, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                background: m.role === 'user' ? '#f04452' : '#f1f5f9',
                color: m.role === 'user' ? '#fff' : '#1e293b',
              }}
            >
              {m.text || (busy && i === messages.length - 1 ? '…' : '')}
            </div>
          ))}
          {status && <div style={{ color: '#94a3b8', fontSize: 13 }}>… {status}</div>}
        </div>

        <div style={{ borderTop: '1px solid #e2e8f0', padding: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <button type="button" onClick={() => setMode('quick')} style={modeBtn(mode === 'quick')}>바로 만들기</button>
            <button type="button" onClick={() => setMode('design')} style={modeBtn(mode === 'design')}>설계부터</button>
            <span style={{ fontSize: 12, color: '#cbd5e1' }}>
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
              style={{ flex: 1, resize: 'none', padding: 10, border: '1px solid #e2e8f0', borderRadius: 10, fontFamily: 'inherit', fontSize: 14 }}
            />
            <button type="button" onClick={() => void send()} disabled={busy || !input.trim()}
              style={{ width: 44, borderRadius: 10, border: 'none', background: '#f04452', color: '#fff', cursor: 'pointer', fontSize: 18 }}>
              ↑
            </button>
          </div>
        </div>
      </div>

      {/* 오른쪽: 코드 보기 (py / js / c) */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRadius: 12, overflow: 'hidden', background: '#0d1117', minWidth: 0 }}>
        <div style={{ display: 'flex', gap: 2, padding: '8px 8px 0', background: '#161b22' }}>
          {CODE_TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setCodeTab(t.key)}
              style={{
                padding: '8px 14px', border: 'none', cursor: 'pointer', borderRadius: '6px 6px 0 0',
                background: codeTab === t.key ? '#0d1117' : 'transparent',
                color: codeTab === t.key ? '#fff' : '#8b949e', fontWeight: codeTab === t.key ? 600 : 400,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
        <pre style={{ flex: 1, margin: 0, padding: 16, overflow: 'auto', color: '#c9d1d9', fontFamily: 'SFMono-Regular, Consolas, monospace', fontSize: 13, lineHeight: 1.6 }}>
          <code>{code[codeTab] || '// 왼쪽에서 코드를 생성하면 여기에 표시됩니다.'}</code>
        </pre>
      </div>
    </div>
  );
}

function modeBtn(active: boolean): CSSProperties {
  return {
    padding: '6px 12px', borderRadius: 8, cursor: 'pointer', background: '#fff',
    border: active ? '1px solid #f04452' : '1px solid #e2e8f0',
    color: active ? '#f04452' : '#64748b',
    fontWeight: active ? 600 : 400,
  };
}
