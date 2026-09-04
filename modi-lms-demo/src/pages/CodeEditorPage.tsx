import CodeEditorTab from '../components/CodeEditorTab';
import { t, BELOW_TOPBAR } from '../styles/tokens';

export default function CodeEditorPage() {
  return (
    // 높이는 t.topbar 기준(BELOW_TOPBAR) — 예전엔 65px 하드코딩이라 상단바와 어긋났다.
    <main style={{ height: BELOW_TOPBAR, minHeight: 560, padding: 20, display: 'flex', flexDirection: 'column', background: t.warm, boxSizing: 'border-box' }}>
      <header style={{ marginBottom: 14 }}>
        <div style={{ color: t.coralStrong, fontSize: 12, fontWeight: 800, marginBottom: 4, letterSpacing: '.06em' }}>TOOLS</div>
        <h1 style={{ margin: 0, color: t.ink, fontSize: 25, fontWeight: 800, letterSpacing: '-.03em', lineHeight: 1.3 }}>코드 에디터</h1>
      </header>
      <section style={{ flex: 1, minHeight: 0, overflow: 'hidden', padding: 10, border: `1px solid ${t.line}`, borderRadius: t.rLg, background: t.surface, boxShadow: t.shSm }}>
        <CodeEditorTab locale="ko" />
      </section>
    </main>
  );
}
