import { useState, useMemo } from 'react';
import type { CourseType } from '../types';
import type { VibeResult } from '../lib/vibeClient';
import ModitorTab from './ModitorTab';
import CodeEditorTab from './CodeEditorTab';
import VibeCodingTab from './VibeCodingTab';
import FlowchartTab from './FlowchartTab';
import LearningNotesTab from './LearningNotesTab';
import PartsTab from './PartsTab';
import DesignDocTab from './DesignDocTab';
import { t } from '../styles/tokens';

type TabKey = 'vibe' | 'preview' | 'code' | 'modi' | 'flow' | 'parts' | 'design' | 'note';

const TAB_LABEL: Record<TabKey, string> = {
  vibe: '바이브 코딩',
  preview: '미리보기',
  code: '코드 에디터',
  modi: '모디',
  flow: '흐름도',
  parts: '준비물',
  design: '설계 문서',
  note: '학습 노트',
};

const TABS_BY_TYPE: Record<CourseType, TabKey[]> = {
  HW: ['vibe', 'code', 'modi', 'flow', 'parts', 'design', 'note'],
  SW: ['vibe', 'preview', 'design', 'note'],
  HW_SW: ['vibe', 'preview', 'code', 'modi', 'flow', 'parts', 'design', 'note'],
};

function Placeholder({ label }: { label: string }) {
  return (
    <div style={{
      width: '100%', height: '100%', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      border: `1px dashed ${t.lineStrong}`, borderRadius: t.rMd, color: t.muted, fontFamily: t.font,
    }}>
      {label} (자리표시)
    </div>
  );
}

interface LearningTabsProps {
  courseType: CourseType;
  codeEditorMode?: string;
  locale?: string;
}

export default function LearningTabs({ courseType, codeEditorMode = '', locale = 'ko' }: LearningTabsProps) {
  const tabs = useMemo(() => TABS_BY_TYPE[courseType], [courseType]);
  const [active, setActive] = useState<TabKey>(tabs[0]);
  // 바이브 코딩 생성 결과 — 흐름도/학습노트/준비물/설계문서 탭이 공유해서 읽는다.
  const [result, setResult] = useState<VibeResult | null>(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 560, textAlign: 'left', fontFamily: t.font }}>
      <div style={{ display: 'flex', gap: 4, borderBottom: `1px solid ${t.line}`, marginBottom: 12, flexWrap: 'wrap' }}>
        {tabs.map((key) => {
          const on = active === key;
          return (
            <button
              key={key}
              onClick={() => setActive(key)}
              style={{
                padding: '10px 16px', border: 'none', cursor: 'pointer', background: 'transparent',
                fontFamily: t.font, fontSize: 14,
                borderBottom: on ? `2px solid ${t.coral}` : '2px solid transparent',
                fontWeight: on ? 700 : 500,
                color: on ? t.ink : t.muted,
              }}
            >
              {TAB_LABEL[key]}
            </button>
          );
        })}
      </div>

      <div style={{ flex: 1, minHeight: 0 }}>
        {/* 바이브 코딩은 항상 마운트 유지 → 탭을 옮겨도 대화·코드가 사라지지 않음 */}
        <div style={{ display: active === 'vibe' ? 'block' : 'none', height: '100%' }}>
          <VibeCodingTab courseType={courseType} onResult={setResult} />
        </div>

        {active === 'code' && <CodeEditorTab mode={codeEditorMode} locale={locale} />}
        {active === 'modi' && <ModitorTab locale={locale} />}
        {active === 'flow' && <FlowchartTab result={result} />}
        {active === 'parts' && <PartsTab result={result} />}
        {active === 'design' && <DesignDocTab result={result} />}
        {active === 'note' && <LearningNotesTab result={result} />}
        {active === 'preview' && <Placeholder label={TAB_LABEL.preview} />}
      </div>
    </div>
  );
}
