import type { VibeResult } from '../lib/vibeClient';
import { t } from '../styles/tokens';

function Empty({ label }: { label: string }) {
  return (
    <div style={{
      width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
      border: `1px dashed ${t.lineStrong}`, borderRadius: t.rMd, color: t.muted, fontFamily: t.font,
    }}>
      바이브 코딩에서 생성하면 {label}가 여기 표시됩니다.
    </div>
  );
}

export default function LearningNotesTab({ result }: { result: VibeResult | null }) {
  const notes = result?.learning_notes ?? [];
  if (notes.length === 0) return <Empty label="학습 노트" />;

  return (
    <div style={{ height: '100%', overflow: 'auto', textAlign: 'left', fontFamily: t.font, color: t.ink, padding: 4, display: 'grid', gap: 12 }}>
      {notes.map((n, i) => (
        <div key={i} style={{ border: `1px solid ${t.line}`, borderRadius: t.rMd, padding: 16, background: t.surface, boxShadow: t.shSm }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ width: 24, height: 24, borderRadius: 8, background: t.coral, color: '#fff', fontSize: 13, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</span>
            <strong style={{ fontSize: 16 }}>{n.title}</strong>
          </div>
          <Row label="무엇을" text={n.what} />
          <Row label="왜" text={n.why} />
          <Row label="어디서" text={n.where} />
        </div>
      ))}
    </div>
  );
}

function Row({ label, text }: { label: string; text: string }) {
  if (!text) return null;
  return (
    <div style={{ display: 'flex', gap: 10, margin: '6px 0', lineHeight: 1.6 }}>
      <span style={{ flexShrink: 0, width: 44, color: t.coralStrong, fontWeight: 700, fontSize: 13 }}>{label}</span>
      <span style={{ color: t.inkSoft }}>{text}</span>
    </div>
  );
}
