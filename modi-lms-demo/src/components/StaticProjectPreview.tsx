import { t } from '../styles/tokens';
import { Icon } from './icons';

export default function StaticProjectPreview({ title, previewUrl, downloadUrl, note }: {
  title: string;
  previewUrl: string;
  downloadUrl?: string;
  note?: string;
}) {
  return (
    <div style={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 11px', borderRadius: 999, background: t.greenSoft, color: t.green, fontSize: 12, fontWeight: 750 }}>
          <Icon name="preview" size={13} /> 브라우저에서 바로 실행
        </span>
        {note && <span style={{ color: t.muted, fontSize: 12 }}>{note}</span>}
        <span style={{ marginLeft: 'auto', display: 'inline-flex', gap: 6 }}>
          {downloadUrl && <a href={downloadUrl} download style={buttonStyle}>프로젝트 ZIP</a>}
          <a href={previewUrl} target="_blank" rel="noreferrer" style={buttonStyle}>새 창</a>
        </span>
      </div>
      <iframe
        src={previewUrl}
        title={`${title} 미리보기`}
        allow="camera; fullscreen; autoplay; gamepad; clipboard-write"
        style={{ flex: 1, minHeight: 340, width: '100%', border: `1px solid ${t.line}`, borderRadius: t.rMd, background: '#111827' }}
      />
    </div>
  );
}

const buttonStyle = {
  display: 'inline-flex', alignItems: 'center', padding: '6px 11px',
  border: `1px solid ${t.lineStrong}`, borderRadius: 9, background: t.surface,
  color: t.inkSoft, textDecoration: 'none', fontFamily: t.font, fontSize: 12, fontWeight: 700,
} as const;
