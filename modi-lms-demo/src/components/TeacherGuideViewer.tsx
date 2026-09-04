import { useId, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import type { Course } from '../data/courses';
import { streamChat, type CodeLangs, type VibeEvent, type VibeMode } from '../lib/vibeClient';
import { t } from '../styles/tokens';
import { Btn, TypeBadge, Segmented } from './ui';
import { Icon } from './icons';

const MODE_OPTIONS = [
  { value: 'quick' as VibeMode, label: '바로 만들기' },
  { value: 'design' as VibeMode, label: '설계부터' },
];

const HW_FILES: { key: keyof CodeLangs; label: string }[] = [
  { key: 'python', label: 'main.py' },
  { key: 'javascript', label: 'main.js' },
  { key: 'c', label: 'main.c' },
];

export function TeacherGuideViewer({ course, onClose, onStart }: {
  course: Course; onClose: () => void; onStart?: () => void;
}) {
  const splitRef = useRef<HTMLDivElement>(null);
  const sessionId = useRef(`guide-${useId()}`);
  const [leftPercent, setLeftPercent] = useState(54);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<VibeMode>('quick');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [reply, setReply] = useState('');
  const [code, setCode] = useState<CodeLangs>({});
  const [webFiles, setWebFiles] = useState<Record<string, string> | null>(null);
  const [codeTab, setCodeTab] = useState<keyof CodeLangs>('python');
  const [webTab, setWebTab] = useState('App.tsx');

  const isSoftware = course.type === 'SW';
  const generatedFiles = useMemo(() => Object.keys(webFiles ?? {}), [webFiles]);
  const shownCode = isSoftware ? (webFiles?.[webTab] ?? '') : (code[codeTab] ?? '');

  const resize = (clientX: number) => {
    const box = splitRef.current?.getBoundingClientRect();
    if (!box) return;
    const next = ((clientX - box.left) / box.width) * 100;
    setLeftPercent(Math.min(75, Math.max(25, next)));
  };

  const beginResize = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    resize(event.clientX);
  };

  const send = async () => {
    const message = input.trim();
    if (!message || busy) return;
    setInput('');
    setBusy(true);
    setStatus('');
    setReply('');

    try {
      await streamChat({
        sessionId: sessionId.current,
        message,
        mode,
        codingType: isSoftware ? 'react' : 'blockly',
      }, (event: VibeEvent) => {
        if (event.type === 'status') setStatus(event.message ?? '');
        if (event.type === 'token') setReply((current) => current + (event.text ?? ''));
        if (event.type === 'done') {
          if (event.blockly_code_langs) setCode(event.blockly_code_langs);
          if (event.generated_code) {
            setWebFiles(event.generated_code);
            const first = Object.keys(event.generated_code)[0];
            if (first) setWebTab(first);
          }
          setStatus('');
        }
      });
    } catch (error) {
      setReply(`요청을 처리하지 못했습니다: ${(error as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div onClick={onClose} role="dialog" aria-modal="true" aria-label={`${course.title} 교안`}
      style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(31,29,29,.58)', backdropFilter: 'blur(5px)', display: 'grid', placeItems: 'center', padding: 12 }}>
      <div onClick={(event) => event.stopPropagation()} style={{ width: 'min(1500px, 98vw)', height: 'min(930px, calc(100dvh - 24px))', display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRadius: 22, background: t.surface, boxShadow: '0 28px 90px rgba(22,21,21,.28)', fontFamily: t.font, color: t.ink }}>
        <header style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderBottom: `1px solid ${t.line}`, flex: '0 0 auto' }}>
          <TypeBadge type={course.type} />
          <div style={{ minWidth: 0 }}>
            <div style={{ color: t.coralStrong, fontSize: 12, fontWeight: 800 }}>교안 보기</div>
            <h2 style={{ margin: 0, fontSize: 20, lineHeight: 1.35, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{course.title}</h2>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            {onStart && <Btn onClick={onStart}>이 차시 수업 시작</Btn>}
            <button type="button" onClick={onClose} aria-label="닫기" className="lift lift--sm" style={{ width: 38, height: 38, display: 'grid', placeItems: 'center', border: 0, borderRadius: '50%', background: t.soft, color: t.muted, cursor: 'pointer' }}><Icon name="close" size={18} /></button>
          </div>
        </header>

        <div ref={splitRef} style={{ flex: 1, minHeight: 0, display: 'flex' }}>
          <section aria-label="강의안" style={{ width: `${leftPercent}%`, minWidth: 0, overflow: 'auto', padding: 24, boxSizing: 'border-box', background: '#fff' }}>
            <GuideContent course={course} />
          </section>

          <div role="separator" aria-label="강의안과 코드 영역 너비 조절" aria-orientation="vertical" tabIndex={0}
            onPointerDown={beginResize} onPointerMove={(event) => { if (event.currentTarget.hasPointerCapture(event.pointerId)) resize(event.clientX); }}
            onKeyDown={(event) => {
              if (event.key === 'ArrowLeft') setLeftPercent((value) => Math.max(25, value - 3));
              if (event.key === 'ArrowRight') setLeftPercent((value) => Math.min(75, value + 3));
            }}
            style={{ width: 12, flex: '0 0 12px', cursor: 'col-resize', background: t.soft, borderLeft: `1px solid ${t.line}`, borderRight: `1px solid ${t.line}`, display: 'grid', placeItems: 'center', touchAction: 'none' }}>
            <span aria-hidden="true" style={{ width: 3, height: 38, borderRadius: 99, background: t.lineStrong }} />
          </div>

          <section aria-label="코드 보기" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', background: '#0d1117', color: '#c9d1d9' }}>
            <div style={{ display: 'flex', gap: 2, minHeight: 44, padding: '7px 8px 0', background: '#161b22', overflowX: 'auto' }}>
              {(isSoftware ? generatedFiles : HW_FILES.map((file) => file.key)).map((key) => {
                const label = isSoftware ? key : HW_FILES.find((file) => file.key === key)?.label;
                const active = isSoftware ? webTab === key : codeTab === key;
                return <button key={key} type="button" onClick={() => isSoftware ? setWebTab(key) : setCodeTab(key as keyof CodeLangs)} style={codeTabStyle(active)}>{label}</button>;
              })}
              {isSoftware && generatedFiles.length === 0 && <span style={{ padding: '9px 10px', color: '#8b949e', fontSize: 13 }}>App.tsx</span>}
            </div>
            <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
              {shownCode ? <CodeView code={shownCode} /> : <div style={{ padding: 20, color: '#7d8590', font: `13px/1.7 ${t.mono}` }}>아래 프롬프트에 요청하면 생성된 코드가 여기에 표시됩니다.</div>}
            </div>
          </section>
        </div>

        <footer style={{ flex: '0 0 auto', borderTop: `1px solid ${t.line}`, padding: '10px 16px 14px', background: t.surface }}>
          {(reply || status) && <div aria-live="polite" style={{ maxHeight: 54, overflow: 'auto', marginBottom: 8, padding: '8px 11px', borderRadius: 10, background: t.soft, color: t.inkSoft, fontSize: 13, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{reply || status}</div>}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 7 }}>
            <Segmented label="생성 모드" value={mode} options={MODE_OPTIONS} onChange={setMode} />
            <span style={{ color: t.muted, fontSize: 12 }}>{mode === 'quick' ? '설명하면 바로 코드를 만들어요' : '설계부터 함께 잡아가요'}</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <textarea value={input} rows={2} disabled={busy} placeholder="수업에서 만들 코드나 수정할 내용을 입력해주세요"
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void send(); } }}
              style={{ flex: 1, resize: 'none', padding: '10px 12px', border: `1px solid ${t.lineStrong}`, borderRadius: t.rSm, fontFamily: 'inherit', fontSize: 14, outlineColor: t.coral }} />
            <button type="button" onClick={() => void send()} disabled={busy || !input.trim()} aria-label="프롬프트 보내기"
              style={{ width: 48, flex: '0 0 48px', display: 'grid', placeItems: 'center', border: 0, borderRadius: t.rSm, background: busy || !input.trim() ? t.lineStrong : t.coralInk, color: '#fff', cursor: busy || !input.trim() ? 'default' : 'pointer' }}><Icon name="send" size={19} /></button>
          </div>
        </footer>
      </div>
    </div>
  );
}

function GuideContent({ course }: { course: Course }) {
  const plan = course.plan;
  if (!plan) return <div style={{ minHeight: '100%', display: 'grid', placeItems: 'center', textAlign: 'center', color: t.muted, lineHeight: 1.8 }}><div><strong style={{ display: 'block', color: t.ink, fontSize: 18, marginBottom: 8 }}>강의안 준비 영역</strong>추후 PDF 강의안이 이 영역에 표시됩니다.</div></div>;
  return <div style={{ maxWidth: 760, margin: '0 auto' }}>
    <h3 style={{ margin: '0 0 8px', fontSize: 23 }}>{course.title}</h3>
    <p style={{ margin: '0 0 22px', color: t.inkSoft, lineHeight: 1.7 }}>{course.description}</p>
    <GuideSection title="학습 목표"><ul style={listStyle}>{plan.objectives.map((item, index) => <li key={index}>{item}</li>)}</ul></GuideSection>
    <GuideSection title="준비물"><ul style={listStyle}>{plan.materials.map((item, index) => <li key={index}>{item}</li>)}</ul></GuideSection>
    <GuideSection title="성취기준">{plan.standards.map((item, index) => <div key={index} style={{ marginBottom: 9, lineHeight: 1.65 }}><strong style={{ color: t.blue }}>{item.code}</strong> {item.text}</div>)}</GuideSection>
    <GuideSection title="성공 기준"><ul style={listStyle}>{plan.successCriteria.map((item, index) => <li key={index}>{item}</li>)}</ul></GuideSection>
  </div>;
}

function GuideSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section style={{ marginBottom: 14, padding: 18, border: `1px solid ${t.line}`, borderRadius: 15, background: t.soft }}><h4 style={{ margin: '0 0 11px', fontSize: 15 }}>{title}</h4>{children}</section>;
}

function CodeView({ code }: { code: string }) {
  return <pre style={{ margin: 0, padding: '16px 18px', color: '#c9d1d9', font: `13px/1.7 ${t.mono}`, whiteSpace: 'pre', tabSize: 2 }}>{code}</pre>;
}

const listStyle: CSSProperties = { margin: 0, paddingLeft: 20, display: 'grid', gap: 7, color: t.inkSoft, fontSize: 13, lineHeight: 1.65 };

function codeTabStyle(active: boolean): CSSProperties {
  return { padding: '8px 14px', border: 0, borderRadius: '8px 8px 0 0', background: active ? '#0d1117' : 'transparent', color: active ? '#fff' : '#8b949e', cursor: 'pointer', fontFamily: t.font, fontWeight: active ? 700 : 400, whiteSpace: 'nowrap' };
}

