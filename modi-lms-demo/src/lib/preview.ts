// generated_code(App.tsx 등)를 브라우저에서 바로 실행할 iframe srcDoc 을 만든다.
// 런타임엔 번들러가 없으므로 import 제거 + export default 정리 후 App 컴포넌트만 남긴다.

function toRenderable(code: string): string {
  return code
    .replace(/^\s*import\s.*$/gm, '')
    .replace(/export\s+default\s+function\s+App/, 'function App')
    .replace(/export\s+default\s+class\s+App/, 'class App')
    .replace(/export\s+default\s+App\s*;?/, '')
    .replace(/<\/script>/gi, '<\\/script>');
}

function harness(appCode: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<style>html,body{margin:0;height:100%;font-family:system-ui,'Noto Sans KR',sans-serif}#root{height:100%}
#err{color:#db2d2f;padding:16px;white-space:pre-wrap;font-family:ui-monospace,Consolas,monospace;font-size:13px}</style>
<script src="https://unpkg.com/react@18/umd/react.development.js"></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
</head><body><div id="root"></div><div id="err"></div>
<script type="text/babel" data-presets="typescript,react">
const { useState, useEffect, useRef, useMemo, useCallback, useReducer } = React;
try {
${appCode}
  ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App));
} catch (e) {
  document.getElementById('err').innerText = '미리보기 오류: ' + (e && e.message ? e.message : e);
}
</script></body></html>`;
}

/** files → 미리보기 iframe srcDoc. 렌더 불가 시 null. */
export function buildPreviewSrcDoc(files: Record<string, string> | null | undefined): string | null {
  if (!files) return null;
  const names = Object.keys(files);
  if (names.length === 0) return null;
  const html = names.find((n) => n.toLowerCase().endsWith('.html'));
  if (html) return files[html];
  const entry =
    names.find((n) => /app\.(t|j)sx?$/i.test(n)) ??
    names.find((n) => /\.(t|j)sx?$/i.test(n));
  if (entry) return harness(toRenderable(files[entry]));
  return null;
}

/** react 산출물의 대표 코드(App.tsx 우선)와 파일명 */
export function primaryFile(files: Record<string, string> | null | undefined): { name: string; code: string } | null {
  if (!files) return null;
  const names = Object.keys(files);
  if (names.length === 0) return null;
  const name = names.find((n) => /app\.(t|j)sx?$/i.test(n)) ?? names[0];
  return { name, code: files[name] };
}
