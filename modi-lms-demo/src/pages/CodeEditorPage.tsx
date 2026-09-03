import CodeEditorTab from '../components/CodeEditorTab';
import { t } from '../styles/tokens';

export default function CodeEditorPage() {
  return (
    <main style={{ height: 'calc(100dvh - 65px)', minHeight: 560, padding: 20, display: 'flex', flexDirection: 'column', textAlign: 'left', background: t.warm, boxSizing: 'border-box' }}>
      <header style={{ marginBottom: 14 }}>
        <div style={{ color: t.coralStrong, fontSize: 12, fontWeight: 800, marginBottom: 4 }}>TOOLS</div>
        <h1 style={{ margin: 0, color: t.ink, fontSize: 25, lineHeight: 1.3 }}>코드 에디터</h1>
      </header>
      <section style={{ flex: 1, minHeight: 0, overflow: 'hidden', padding: 10, border: `1px solid ${t.line}`, borderRadius: t.rLg, background: t.surface, boxShadow: t.shSm }}>
        <CodeEditorTab locale="ko" />
      </section>
    </main>
  );
}
