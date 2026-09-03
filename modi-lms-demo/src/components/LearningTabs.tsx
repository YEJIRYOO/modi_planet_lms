import { useState, useMemo } from 'react';
import type { CourseType } from '../types';
import type { VibeResult } from '../lib/vibeClient';
import ModitorTab from './ModitorTab';
import CodeEditorTab from './CodeEditorTab';
import VibeCodingTab from './VibeCodingTab';
import LearningNotesTab from './LearningNotesTab';
import PartsTab from './PartsTab';
import PreviewTab from './PreviewTab';
import { t } from '../styles/tokens';

type TabKey = 'vibe' | 'preview' | 'code' | 'modi' | 'parts' | 'note';

const TAB_LABEL: Record<TabKey, string> = {
  vibe: '바이브 코딩',
  preview: '미리보기',
  code: '코드 에디터',
  modi: '모디',
  parts: '준비물',
  note: '학습 노트',
};

const TABS_BY_TYPE: Record<CourseType, TabKey[]> = {
  HW: ['vibe', 'code', 'modi', 'parts', 'note'],
  SW: ['vibe', 'preview', 'note'],
  HW_SW: ['vibe', 'preview', 'code', 'modi', 'parts', 'note'],
};

interface LearningTabsProps {
  courseType: CourseType;
  codeEditorMode?: string;
  locale?: string;
}

export default function LearningTabs({ courseType, codeEditorMode = '', locale = 'ko' }: LearningTabsProps) {
  const tabs = useMemo(() => TABS_BY_TYPE[courseType], [courseType]);
  const [active, setActive] = useState<TabKey>(tabs[0]);
  // 바이브 코딩 생성 결과 — 학습 노트/준비물/미리보기 탭이 공유해서 읽는다.
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
        {active === 'modi' && <ModitorTab locale={locale} blocklyXml={result?.blockly_xml ?? undefined} />}
        {active === 'parts' && <PartsTab result={result} />}
        {active === 'note' && <LearningNotesTab result={result} />}
        {active === 'preview' && <PreviewTab result={result} />}
      </div>
    </div>
  );
}
