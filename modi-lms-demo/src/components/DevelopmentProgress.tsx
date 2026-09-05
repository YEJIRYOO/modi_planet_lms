import type { DevelopmentProgressState } from '../lib/developmentTimeline';
import { t } from '../styles/tokens';

function time(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
}

export function DevelopmentProgress({ state }: { state: DevelopmentProgressState }) {
  return (
    <section aria-label="개발 진행 상황" style={{ width: 'min(94%, 620px)', padding: 14, border: `1px solid ${t.line}`, borderRadius: 14, background: '#17191e', color: '#f5f5f7' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
        <strong style={{ fontSize: 13.5 }}>개발 진행 중</strong>
        <span style={{ color: '#aeb4bf', fontSize: 11.5, fontVariantNumeric: 'tabular-nums' }}>약 {time(state.remainingSeconds)} 남음</span>
      </div>
      <div role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={state.progress}
        style={{ height: 5, margin: '10px 0 12px', overflow: 'hidden', borderRadius: 999, background: '#30343c' }}>
        <span style={{ width: `${state.progress}%`, height: '100%', display: 'block', borderRadius: 999, background: t.coral, transition: 'width .8s linear' }} />
      </div>
      <div aria-live="polite">
        <strong style={{ display: 'block', color: '#fff', fontSize: 13 }}>{state.label}</strong>
        <span style={{ display: 'block', marginTop: 3, color: '#aeb4bf', fontSize: 12, lineHeight: 1.55 }}>{state.detail}</span>
      </div>
      <div style={{ marginTop: 11, padding: '9px 10px', borderRadius: 9, background: '#0d0f13', font: `11px/1.65 ${t.mono}`, color: '#9da7b8' }}>
        {state.logs.slice(-4).map((log, index, shown) => (
          <div key={log} style={{ color: index === shown.length - 1 ? '#f0c674' : '#77808f' }}>
            <span style={{ color: index === shown.length - 1 ? t.coral : '#596170' }}>{index === shown.length - 1 ? '›' : '✓'}</span> {log}{index === shown.length - 1 ? '...' : ''}
          </div>
        ))}
      </div>
      <div style={{ marginTop: 8, textAlign: 'right', color: '#77808f', fontSize: 10.5, fontVariantNumeric: 'tabular-nums' }}>
        {state.progress}% · {time(state.elapsedSeconds)} / {time(state.totalSeconds)}
      </div>
    </section>
  );
}
