import { useState, type CSSProperties } from 'react';
import { Highlight, themes } from 'prism-react-renderer';
import { t } from '../styles/tokens';
import { Icon } from './icons';

/* 코드 보기 탭.
   바이브 코딩 우측 패널에 박혀 있던 하이라이트 뷰어를 독립 탭으로 분리한 것.
   파일 이름 → 언어 추론만 하고, 내용은 전달받은 files 를 그대로 보여 준다(읽기 전용). */

const LANG_BY_EXT: Record<string, string> = {
  py: 'python', js: 'javascript', jsx: 'jsx', ts: 'typescript', tsx: 'tsx',
  c: 'c', h: 'c', cpp: 'cpp', json: 'json', css: 'css', html: 'markup', md: 'markdown',
};

function langOf(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  return LANG_BY_EXT[ext] ?? 'javascript';
}

const lineNoStyle: CSSProperties = {
  width: 44, flexShrink: 0, textAlign: 'right', paddingRight: 14, color: '#4b5563', userSelect: 'none',
};

function fileTab(active: boolean): CSSProperties {
  return {
    padding: '8px 16px', border: 'none', cursor: 'pointer', borderRadius: '8px 8px 0 0',
    fontFamily: t.mono, fontSize: 13, whiteSpace: 'nowrap',
    background: active ? '#0d1117' : 'transparent', color: active ? '#fff' : '#8b949e',
    fontWeight: active ? 700 : 500, transition: 'background .16s ease, color .16s ease',
  };
}

export default function CodeViewTab({ files }: { files: Record<string, string> | null | undefined }) {
  const names = files ? Object.keys(files) : [];
  const [picked, setPicked] = useState<string | null>(null);

  /* 선택 파일은 파생값으로 둔다. useEffect + setState 로 되돌리면
     불필요한 재렌더가 생기고 eslint(react-hooks/set-state-in-effect)에도 걸린다.
     결과가 바뀌어 이전 파일명이 없어지면 자동으로 첫 파일로 떨어진다. */
  const active = picked && names.includes(picked) ? picked : (names[0] ?? '');

  const shell: CSSProperties = {
    height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0,
    borderRadius: t.rMd, overflow: 'hidden', background: '#0d1117', border: '1px solid #1f2430',
    textAlign: 'left', // #root { text-align:center } 전역 충돌 방어
  };

  if (names.length === 0) {
    return (
      <div style={{ ...shell, display: 'grid', placeItems: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center' }}>
          <span style={{ display: 'grid', placeItems: 'center', width: 46, height: 46, margin: '0 auto 12px', borderRadius: 14, background: '#161b22', border: '1px solid #1f2430', color: '#8b949e' }}>
            <Icon name="terminal" size={22} />
          </span>
          <strong style={{ display: 'block', fontSize: 15, fontWeight: 700, color: '#c9d1d9' }}>아직 볼 코드가 없어요</strong>
          <span style={{ display: 'block', marginTop: 4, fontSize: 13, lineHeight: 1.6, color: '#7d8590' }}>
            바이브 코딩에서 만들고 싶은 동작을 설명하면 코드가 여기에 표시됩니다.
          </span>
        </div>
      </div>
    );
  }

  const code = files?.[active] ?? '';

  return (
    <div style={shell}>
      <div style={{ display: 'flex', gap: 2, padding: '8px 8px 0', background: '#161b22', overflowX: 'auto' }}>
        {names.map((n) => (
          <button key={n} type="button" onClick={() => setPicked(n)} style={fileTab(active === n)}>{n}</button>
        ))}
      </div>
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        <Highlight theme={themes.vsDark} code={code} language={langOf(active)}>
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
      </div>
    </div>
  );
}
