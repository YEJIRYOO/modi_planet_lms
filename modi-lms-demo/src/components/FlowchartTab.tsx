import type { VibeResult, FlowNode } from '../lib/vibeClient';
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

const CHIP: Record<string, { bg: string; fg: string; icon: string }> = {
  start: { bg: t.greenSoft, fg: t.green, icon: '▶' },
  end: { bg: t.soft, fg: t.muted, icon: '■' },
  loop: { bg: t.blueSoft, fg: t.blue, icon: '↻' },
  condition: { bg: t.coralSoft, fg: t.coralStrong, icon: '◆' },
  action: { bg: t.surface, fg: t.ink, icon: '·' },
};

function Node({ node, depth }: { node: FlowNode; depth: number }) {
  const c = CHIP[node.type] ?? CHIP.action;
  return (
    <div style={{ marginLeft: depth * 16 }}>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', margin: '3px 0',
        borderRadius: 10, background: c.bg, color: c.fg, border: `1px solid ${t.line}`, fontSize: 14,
      }}>
        <span style={{ opacity: 0.8 }}>{c.icon}</span>
        <span style={{ fontWeight: node.type === 'condition' || node.type === 'loop' ? 700 : 500 }}>{node.label}</span>
      </div>

      {node.children && node.children.map((ch, i) => <Node key={i} node={ch} depth={depth + 1} />)}

      {node.branches && node.branches.map((b, i) => (
        <div key={i} style={{ marginLeft: (depth + 1) * 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: t.muted, margin: '4px 0 2px' }}>— {b.label}</div>
          {b.children && b.children.map((ch, j) => <Node key={j} node={ch} depth={depth + 2} />)}
        </div>
      ))}
    </div>
  );
}

export default function FlowchartTab({ result }: { result: VibeResult | null }) {
  const flow = result?.blockly_flowchart ?? [];
  if (flow.length === 0) return <Empty label="흐름도" />;

  return (
    <div style={{ height: '100%', overflow: 'auto', textAlign: 'left', fontFamily: t.font, color: t.ink, padding: 4 }}>
      {result?.blockly_detail && (
        <p style={{ color: t.inkSoft, lineHeight: 1.6, margin: '0 0 12px', background: t.warm, padding: 12, borderRadius: t.rSm }}>
          {result.blockly_detail}
        </p>
      )}
      {flow.map((n, i) => <Node key={i} node={n} depth={0} />)}
    </div>
  );
}
