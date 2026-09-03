import {
  SandpackProvider, SandpackLayout, SandpackCodeEditor, SandpackPreview,
} from '@codesandbox/sandpack-react';

// generated_code 키를 Sandpack 경로(/App.tsx, /components/Header.tsx …)로 정규화
function normalize(files: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(files)) {
    if (k.toLowerCase() === 'package.json') continue; // 의존성은 아래서 관리
    out[k.startsWith('/') ? k : `/${k}`] = v;
  }
  return out;
}

// 파일들이 import 하는 외부 npm 패키지 추출 (상대경로·react 제외)
function detectDeps(files: Record<string, string>): Record<string, string> {
  const deps: Record<string, string> = {};
  const re = /from\s+['"]([^'"]+)['"]/g;
  for (const code of Object.values(files)) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(code)) !== null) {
      const name = m[1];
      if (name.startsWith('.') || name.startsWith('/')) continue;
      if (name === 'react' || name === 'react-dom' || name.startsWith('react/') || name.startsWith('react-dom/')) continue;
      const pkg = name.startsWith('@') ? name.split('/').slice(0, 2).join('/') : name.split('/')[0];
      deps[pkg] = 'latest';
    }
  }
  return deps;
}

// Tailwind Play CDN 을 넣은 index.html (className 기반 Tailwind 가 런타임에 동작)
const INDEX_HTML = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body><div id="root"></div></body>
</html>`;

interface Props { files: Record<string, string>; mode?: 'full' | 'preview'; }

export default function SandpackApp({ files, mode = 'full' }: Props) {
  const spFiles = normalize(files);
  spFiles['/public/index.html'] = INDEX_HTML;
  const dependencies = detectDeps(files);

  return (
    <div style={{ height: '100%' }}>
      <SandpackProvider
        template="react-ts"
        theme="dark"
        files={spFiles}
        customSetup={{ dependencies }}
        style={{ height: '100%' }}
      >
        {mode === 'full' ? (
          <SandpackLayout style={{ height: '100%', border: 'none' }}>
            <SandpackCodeEditor showTabs showLineNumbers style={{ height: '100%' }} />
            <SandpackPreview showOpenInCodeSandbox={false} style={{ height: '100%' }} />
          </SandpackLayout>
        ) : (
          <SandpackLayout style={{ height: '100%', border: 'none' }}>
            <SandpackPreview showOpenInCodeSandbox={false} showRefreshButton style={{ height: '100%' }} />
          </SandpackLayout>
        )}
      </SandpackProvider>
    </div>
  );
}
