import { useMemo, useState } from 'react';
import type { CourseType } from '../types';
import type { CourseProject } from '../data/courses';
import type { VibeResult } from '../lib/vibeClient';
import { findHybridCurriculum } from '../data/hybridCurriculum';
import ModitorTab from './ModitorTab';
import VibeCodingTab from './VibeCodingTab';
import HybridVibeTab from './HybridVibeTab';
import LearningNotesTab from './LearningNotesTab';
import PartsTab from './PartsTab';
import HybridPartsTab from './HybridPartsTab';
import PreviewTab from './PreviewTab';
import GamePreviewTab from './GamePreviewTab';
import BrowserHardwarePreview from './BrowserHardwarePreview';
import CodeViewTab from './CodeViewTab';
import StaticProjectPreview from './StaticProjectPreview';
import { t } from '../styles/tokens';
import { EmptyState } from './ui';
import { Icon, type IconName } from './icons';

type TabKey = 'vibe' | 'code' | 'preview' | 'modi' | 'parts' | 'note';

const TAB_META: Record<TabKey, { label: string; icon: IconName }> = {
  vibe: { label: '바이브 코딩', icon: 'sparkle' },
  code: { label: '코드 보기', icon: 'terminal' },
  preview: { label: '미리보기', icon: 'preview' },
  modi: { label: '모디', icon: 'blocks' },
  parts: { label: '준비물', icon: 'parts' },
  note: { label: '학습 노트', icon: 'note' },
};

const TABS_BY_TYPE: Record<CourseType, TabKey[]> = {
  HW: ['vibe', 'modi', 'parts', 'note'],
  SW: ['vibe', 'preview', 'note'],
  // HW+SW: 준비물(모듈 페어링) → 바이브 코딩 → 코드 보기 → 미리보기 → 학습 노트
  HW_SW: ['parts', 'vibe', 'code', 'preview', 'note'],
};

interface LearningTabsProps {
  courseType: CourseType;
  /** HW_SW 정적 커리큘럼을 찾는 키. data/hybridCurriculum.ts 의 courseId 와 맞아야 한다. */
  courseId?: string;
  courseTitle?: string;
  courseGoal?: string;
  locale?: string;
  project?: CourseProject;
}

export default function LearningTabs({ courseType, courseId, courseTitle, courseGoal, locale = 'ko', project }: LearningTabsProps) {
  const tabs = useMemo(() => TABS_BY_TYPE[courseType], [courseType]);
  const [active, setActive] = useState<TabKey>(tabs[0]);

  // 바이브 코딩 생성 결과 — HW/SW 경로에서 학습 노트·준비물·미리보기가 공유한다.
  const [result, setResult] = useState<VibeResult | null>(null);

  /* HW+SW 는 AI 를 호출하지 않는다. 정적 커리큘럼을 찾아 키워드 진행도로 탭을 연다. */
  const cur = useMemo(() => (courseType === 'HW_SW' ? findHybridCurriculum(courseId) : undefined), [courseType, courseId]);
  const [matched, setMatched] = useState<string[]>([]);
  const unlocked = !!cur && matched.length >= cur.keywords.length;
  const softwareLocked = courseType === 'SW' && !!project?.vibeBrief && !result;

  const locked = (icon: IconName, title: string, hint = '바이브 코딩에서 정해야 할 세 가지를 모두 설명하면 열립니다.') => (
    <EmptyState icon={icon} title={title} hint={hint} />
  );

  return (
    // minHeight 560 을 두면 낮은 화면에서 부모(flex:1)를 넘겨 스크롤이 이중으로 생겼다 → 제거.
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, fontFamily: t.font }}>
      <div role="tablist" aria-label="학습 단계" style={{ display: 'flex', gap: 2, borderBottom: `1px solid ${t.line}`, marginBottom: 12, flexWrap: 'wrap' }}>
        {tabs.map((key) => {
          const on = active === key;
          const meta = TAB_META[key];
          // 잠긴 탭도 보이게 둔다 — 무엇이 남았는지 알 수 있어야 한다.
          const isLocked = ((!!cur && !unlocked) || softwareLocked) && (key === 'code' || key === 'preview' || key === 'note');
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
                color: on ? t.ink : isLocked ? t.lineStrong : t.muted,
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
        {/* 바이브 코딩은 항상 마운트 유지 → 탭을 옮겨도 대화·진행도가 사라지지 않음 */}
        <div style={{ display: active === 'vibe' ? 'block' : 'none', height: '100%' }}>
          {cur
            ? <HybridVibeTab cur={cur} matched={matched} onProgress={(m) => setMatched(m)} />
            : <VibeCodingTab
                courseType={courseType}
                courseContext={project?.vibeBrief && courseTitle && courseGoal ? {
                  title: courseTitle,
                  goal: courseGoal,
                  brief: project.vibeBrief,
                  examples: project.vibeExamples ?? [],
                  referenceUrl: project.previewUrl,
                } : undefined}
                onResult={setResult}
              />}
        </div>

        {active === 'code' && (cur
          ? (unlocked ? <CodeViewTab files={cur.codeFiles} /> : locked('terminal', '아직 코드가 열리지 않았어요'))
          : <CodeViewTab files={result?.generated_code ?? null} />)}

        {active === 'parts' && (cur ? <HybridPartsTab cur={cur} /> : <PartsTab result={result} />)}

        {active === 'preview' && (cur
          ? (unlocked
              ? (courseId === '6'
                  ? <BrowserHardwarePreview />
                  : project?.previewUrl
                    ? <StaticProjectPreview title={courseTitle ?? '프로젝트'} previewUrl={project.previewUrl} downloadUrl={project.downloadUrl} note={project.previewNote} modiBridge={project.modiBridge} />
                    : <GamePreviewTab cur={cur} />)
              : locked('preview', '아직 미리볼 결과가 없어요'))
          : softwareLocked
            ? locked('preview', '아직 미리보기가 열리지 않았어요', '바이브 코딩에서 현재 강좌와 관련된 요청을 완료하면 열립니다.')
            : project?.previewUrl
              ? <StaticProjectPreview title={courseTitle ?? '프로젝트'} previewUrl={project.previewUrl} downloadUrl={project.downloadUrl} note={project.previewNote} modiBridge={project.modiBridge} />
              : <PreviewTab result={result} courseType={courseType} />)}

        {active === 'note' && (cur
          ? (unlocked ? <LearningNotesTab result={{ learning_notes: cur.notes }} /> : locked('note', '아직 학습 노트가 없어요'))
          : softwareLocked
            ? locked('note', '아직 학습 노트가 없어요', '바이브 코딩 결과가 완성되면 학습 노트가 열립니다.')
            : <LearningNotesTab result={result} />)}

        {active === 'modi' && <ModitorTab locale={locale} blocklyXml={result?.blockly_xml ?? undefined} />}
      </div>
    </div>
  );
}
