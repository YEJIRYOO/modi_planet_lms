// 하이브리드(HW+SW) App.tsx 미리보기 harness.
// 하이브리드 앱은 전역 MODI SDK(useButton, MODI.led() 등)를 쓰는 단일 파일이라,
// 실제 modi-sdk.js 를 넣고 mock 으로 강제하면 하드웨어 없이도 렌더된다.
//
// 사전 준비: modi_edu_agent/hybrid/modi-sdk.js 를 modi-lms-demo/public/hybrid/modi-sdk.js 로 복사.

function toRenderable(code: string): string {
  return code
    .replace(/^\s*import\s.*$/gm, '')
    .replace(/export\s+default\s+function\s+App/, 'function App')
    .replace(/export\s+default\s+class\s+App/, 'class App')
    .replace(/export\s+default\s+App\s*;?/, '')
    .replace(/<\/script>/gi, '<\\/script>');
}

export function buildHybridSrcDoc(files: Record<string, string> | null | undefined): string | null {
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

<!-- 실제 SDK 로드 후 mock 강제 (하드웨어 없이 동작) -->
<script type="module">
  try {
    const m = await import('/hybrid/modi-sdk.js');
    const MODI = m.default || window.MODI;
    if (MODI && MODI._bridge && MODI._bridge.useMock) MODI._bridge.useMock();
    window.__MODI_READY = true;
  } catch (e) {
    window.__MODI_ERR = String(e);
  }
</script>

<script type="text/babel" data-presets="typescript,react">
const { useState, useEffect, useRef, useMemo, useCallback, useReducer } = React;
let __tries = 0;
function __mount() {
  if (window.__MODI_ERR) {
    document.getElementById('err').innerText =
      'modi-sdk.js 로드 실패: ' + window.__MODI_ERR + '\\npublic/hybrid/modi-sdk.js 가 있는지 확인하세요.';
    return;
  }
  if (!window.__MODI_READY || !window.MODI || typeof window.useButton !== 'function') {
    if (__tries++ > 200) {
      document.getElementById('err').innerText =
        'MODI SDK 준비 실패 — public/hybrid/modi-sdk.js 를 확인하세요.';
      return;
    }
    setTimeout(__mount, 25);
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
