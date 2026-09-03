// 하이브리드(HW+SW) App.tsx 미리보기 harness.
// srcdoc iframe 은 origin 이 null 이라 외부 script(module/src)를 못 불러온다.
// → modi-sdk.js 를 fetch 해서 export 를 떼고 harness 안에 인라인으로 심는다.

let _sdkCache: string | null = null;

// public/hybrid/modi-sdk.js 를 한 번 받아서 캐시 (export 구문 제거 → 일반 script 로 실행 가능)
export async function loadSdkSource(): Promise<string> {
  if (_sdkCache != null) return _sdkCache;
  const res = await fetch('/hybrid/modi-sdk.js');
  let src = await res.text();
  // ESM export 제거 (일반 script 로 돌리기 위함). window.MODI 등은 파일 내부에서 이미 할당함.
  src = src
    .replace(/^\s*export\s+default\s+[^;]+;?\s*$/gm, '')
    .replace(/^\s*export\s*\{[\s\S]*?\}\s*;?\s*$/gm, '');
  _sdkCache = src;
  return src;
}

function toRenderable(code: string): string {
  return code
    .replace(/^\s*import\s.*$/gm, '')
    .replace(/export\s+default\s+function\s+App/, 'function App')
    .replace(/export\s+default\s+class\s+App/, 'class App')
    .replace(/export\s+default\s+App\s*;?/, '')
    .replace(/<\/script>/gi, '<\\/script>');
}

// sdkSource: loadSdkSource() 로 받은 문자열. files: generated_code.
export function buildHybridSrcDoc(
  files: Record<string, string> | null | undefined,
  sdkSource: string,
): string | null {
  if (!files) return null;
  const names = Object.keys(files);
  const entry = names.find((n) => /app\.(t|j)sx?$/i.test(n)) ?? names.find((n) => /\.(t|j)sx?$/i.test(n));
  if (!entry) return null;
  const app = toRenderable(files[entry]);

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<script src="https://cdn.tailwindcss.com"></script>
<script src="https://unpkg.com/react@18/umd/react.development.js"></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
<style>html,body{margin:0;height:100%;font-family:system-ui,'Noto Sans KR',sans-serif}#root{height:100%}
#err{color:#db2d2f;padding:16px;white-space:pre-wrap;font-family:ui-monospace,Consolas,monospace;font-size:13px}</style>
</head><body>
<div id="root"></div><div id="err"></div>

<!-- modi-sdk.js 를 인라인으로 실행 (window.React 가 이미 있으므로 훅 자동 부착) -->
<script>
try {
${sdkSource}
  if (window.MODI && window.MODI._bridge && window.MODI._bridge.useMock) window.MODI._bridge.useMock();
} catch (e) { window.__MODI_ERR = String(e); }
</script>

<script type="text/babel" data-presets="typescript,react">
const { useState, useEffect, useRef, useMemo, useCallback, useReducer } = React;
function __mount() {
  if (window.__MODI_ERR) {
    document.getElementById('err').innerText = 'MODI SDK 오류: ' + window.__MODI_ERR;
    return;
  }
  if (!window.MODI || typeof window.useButton !== 'function') {
    document.getElementById('err').innerText = 'MODI SDK 준비 실패 (전역 훅 없음)';
    return;
  }
  try {
${app}
    ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App));
  } catch (e) {
    document.getElementById('err').innerText = '미리보기 오류: ' + (e && e.message ? e.message : e);
  }
}
__mount();
</script>
</body></html>`;
}