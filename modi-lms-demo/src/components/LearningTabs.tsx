import { useState, useMemo } from 'react';
import type { CourseType } from '../types';
import type { VibeResult } from '../lib/vibeClient';
import ModitorTab from './ModitorTab';
import VibeCodingTab from './VibeCodingTab';
import LearningNotesTab from './LearningNotesTab';
import PartsTab from './PartsTab';
import PreviewTab from './PreviewTab';
import { t } from '../styles/tokens';
import { Icon, type IconName } from './icons';

type TabKey = 'vibe' | 'preview' | 'modi' | 'parts' | 'note';

const TAB_META: Record<TabKey, { label: string; icon: IconName }> = {
  vibe: { label: '바이브 코딩', icon: 'sparkle' },
  preview: { label: '미리보기', icon: 'preview' },
  modi: { label: '모디', icon: 'blocks' },
  parts: { label: '준비물', icon: 'parts' },
  note: { label: '학습 노트', icon: 'note' },
};

const TABS_BY_TYPE: Record<CourseType, TabKey[]> = {
  HW: ['vibe', 'modi', 'parts', 'note'],
  SW: ['vibe', 'preview', 'note'],
  HW_SW: ['vibe', 'preview', 'modi', 'parts', 'note'],
};

interface LearningTabsProps {
  courseType: CourseType;
  locale?: string;
}

export default function LearningTabs({ courseType, locale = 'ko' }: LearningTabsProps) {
  const tabs = useMemo(() => TABS_BY_TYPE[courseType], [courseType]);
  const [active, setActive] = useState<TabKey>(tabs[0]);
  // 바이브 코딩 생성 결과 — 학습 노트/준비물/미리보기 탭이 공유해서 읽는다.
  const [result, setResult] = useState<VibeResult | null>(null);

  return (
    // minHeight 560 을 두면 낮은 화면에서 부모(flex:1)를 넘겨 스크롤이 이중으로 생겼다 → 제거.
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, fontFamily: t.font }}>
      <div role="tablist" aria-label="학습 단계" style={{ display: 'flex', gap: 2, borderBottom: `1px solid ${t.line}`, marginBottom: 12, flexWrap: 'wrap' }}>
        {tabs.map((key) => {
          const on = active === key;
          const meta = TAB_META[key];
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setActive(key)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '10px 14px', border: 'none', cursor: 'pointer', background: 'transparent',
                fontFamily: t.font, fontSize: 14,
                borderBottom: on ? `2px solid ${t.coral}` : '2px solid transparent',
                marginBottom: -1,
                fontWeight: on ? 750 : 550,
                color: on ? t.ink : t.muted,
                transition: 'color .16s ease, border-color .16s ease',
              }}
            >
              <Icon name={meta.icon} size={16} />
              {meta.label}
            </button>
          );
        })}
      </div>

      <div style={{ flex: 1, minHeight: 0 }}>
        {/* 바이브 코딩은 항상 마운트 유지 → 탭을 옮겨도 대화·코드가 사라지지 않음 */}
        <div style={{ display: active === 'vibe' ? 'block' : 'none', height: '100%' }}>
          <VibeCodingTab courseType={courseType} onResult={setResult} />
        </div>

        {active === 'modi' && <ModitorTab locale={locale} blocklyXml={result?.blockly_xml ?? undefined} />}
        {active === 'parts' && <PartsTab result={result} />}
        {active === 'note' && <LearningNotesTab result={result} />}
        {active === 'preview' && <PreviewTab result={result} courseType={courseType} />}
      </div>
    </div>
  );
}
