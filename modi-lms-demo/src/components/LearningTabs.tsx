import { useEffect, useMemo, useState } from 'react';
import type { CourseType } from '../types';
import type { VibeResult } from '../lib/vibeClient';
import ModitorTab from './ModitorTab';
import VibeCodingTab from './VibeCodingTab';
import LearningNotesTab from './LearningNotesTab';
import PartsTab from './PartsTab';
import PreviewTab from './PreviewTab';
import { t } from '../styles/tokens';
import { Icon, type IconName } from './icons';
import {
  loadCoursePack, loadPackBlocklyXml, packToResult,
  type CoursePack, type StageKey,
} from '../lib/coursePack';
import { useCourseProgress } from '../lib/useCourseProgress';

const TAB_META: Record<StageKey, { label: string; icon: IconName }> = {
  vibe: { label: '바이브 코딩', icon: 'sparkle' },
  preview: { label: '미리보기', icon: 'preview' },
  modi: { label: '모디', icon: 'blocks' },
  parts: { label: '준비물', icon: 'parts' },
  note: { label: '학습 노트', icon: 'note' },
};

/* HW+SW 는 준비물 → 바이브 → 모디 → 미리보기 → 학습노트 순이다.
   무엇을 왜 연결하는지 모른 채 코드부터 보는 것을 막으려고 준비물을 앞에 둔다.
   코스 팩의 flow.order 가 있으면 그쪽이 우선한다. */
const TABS_BY_TYPE: Record<CourseType, StageKey[]> = {
  HW: ['vibe', 'modi', 'parts', 'note'],
  SW: ['vibe', 'preview', 'note'],
  HW_SW: ['parts', 'vibe', 'modi', 'preview', 'note'],
};

interface LearningTabsProps {
  courseType: CourseType;
  locale?: string;
  /** 정적 코스 팩 id (data/courses.ts 의 pack) */
  pack?: string;
  role?: string;
}

function LockIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
      <rect x="5" y="10.5" width="14" height="10" rx="2.5" />
      <path d="M8.4 10.5V7.8a3.6 3.6 0 0 1 7.2 0v2.7" />
    </svg>
  );
}

export default function LearningTabs({ courseType, locale = 'ko', pack: packId, role = 'student' }: LearningTabsProps) {
  const [pack, setPack] = useState<CoursePack | null>(null);
  const [packXml, setPackXml] = useState<string | null>(null);
  // 바이브 코딩 생성 결과 — 학습 노트/준비물/미리보기 탭이 공유해서 읽는다.
  const [result, setResult] = useState<VibeResult | null>(null);

  useEffect(() => {
    if (!packId) return;
    let alive = true;
    loadCoursePack(packId)
      .then(async (p) => {
        if (!alive) return;
        const xml = await loadPackBlocklyXml(p);
        if (!alive) return;
        setPack(p);
        setPackXml(xml);
        // 준비물이 첫 탭이라 바이브 결과를 기다릴 수 없다. preset 을 먼저 채운다.
        // 바이브가 실제 결과를 주면 onResult 가 이 값을 덮어쓴다.
        setResult((prev) => prev ?? packToResult(p, xml));
      })
      .catch(() => { /* 팩이 없으면 기존 동작 그대로 */ });
    return () => { alive = false; };
  }, [packId]);

  const tabs = useMemo<StageKey[]>(
    () => pack?.flow?.order ?? TABS_BY_TYPE[courseType],
    [pack, courseType],
  );

  const progress = useCourseProgress(tabs, pack?.flow, role === 'teacher');
  const { active, setActive, isUnlocked, gate } = progress;

  // 팩이 늦게 오면 tabs 가 바뀔 수 있다. 그때 현재 탭이 목록에 없으면 첫 탭으로.
  useEffect(() => {
    if (!tabs.includes(active)) setActive(tabs[0]);
  }, [tabs, active, setActive]);

  const partsConfig = pack?.flow?.parts;
  const vibeConfig = pack?.flow?.vibe;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, fontFamily: t.font }}>
      <div role="tablist" aria-label="학습 단계" style={{ display: 'flex', gap: 2, borderBottom: `1px solid ${t.line}`, marginBottom: 12, flexWrap: 'wrap' }}>
        {tabs.map((key) => {
          const on = active === key;
          const open = isUnlocked(key);
          const meta = TAB_META[key];
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={on}
              disabled={!open}
              title={open ? undefined : '앞 단계를 마치면 열립니다'}
              onClick={() => setActive(key)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '10px 14px', border: 'none',
                cursor: open ? 'pointer' : 'not-allowed', background: 'transparent',
                fontFamily: t.font, fontSize: 14,
                borderBottom: on ? `2px solid ${t.coral}` : '2px solid transparent',
                marginBottom: -1,
                fontWeight: on ? 750 : 550,
                color: !open ? t.lineStrong : on ? t.ink : t.muted,
                transition: 'color .16s ease, border-color .16s ease',
              }}
            >
              {open ? <Icon name={meta.icon} size={16} /> : <LockIcon size={14} />}
              {meta.label}
            </button>
          );
        })}

        {role === 'teacher' && !progress.unlocked && (
          <button
            type="button"
            onClick={progress.unlockAll}
            style={{ marginLeft: 'auto', alignSelf: 'center', background: 'none', border: `1px solid ${t.lineStrong}`, color: t.muted, borderRadius: t.rSm, padding: '5px 11px', cursor: 'pointer', fontFamily: t.font, fontSize: 12 }}
          >
            전체 열기 (교사)
          </button>
        )}
      </div>

      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        {/* 바이브 코딩 관문 — 통과/실패가 아니라 아직 말하지 않은 개념을 알려 준다. */}
        {active === 'vibe' && vibeConfig && vibeConfig.groups.length > 0 && (
          <div style={{
            border: `1px solid ${gate.satisfied ? t.green : t.line}`,
            background: gate.satisfied ? t.greenSoft : t.coralPale,
            borderRadius: t.rMd, padding: '10px 14px', marginBottom: 10,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {vibeConfig.groups.map((g) => {
                const hit = gate.matched.includes(g.id);
                return (
                  <span
                    key={g.id}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      background: hit ? t.greenSoft : t.surface,
                      color: hit ? t.green : t.muted,
                      border: `1px solid ${hit ? t.green : t.lineStrong}`,
                      padding: '3px 10px', borderRadius: 999, fontSize: 12.5, fontWeight: 700,
                    }}
                  >
                    {hit && <Icon name="check" size={12} />}
                    {g.label}
                  </span>
                );
              })}

              {gate.satisfied ? (
                <button
                  type="button"
                  className="lift lift--sm"
                  onClick={() => setActive(vibeConfig.onSatisfied?.jumpTo ?? 'preview')}
                  style={{ marginLeft: 'auto', padding: '7px 15px', background: t.coralInk, color: '#fff', border: 'none', borderRadius: t.rSm, cursor: 'pointer', fontFamily: t.font, fontSize: 13, fontWeight: 700, boxShadow: t.shCoral }}
                >
                  게임 실행하기
                </button>
              ) : (
                <span style={{ marginLeft: 'auto', color: t.muted, fontSize: 12.5 }}>
                  {gate.matched.length} / {vibeConfig.groups.length}
                </span>
              )}
            </div>

            {gate.satisfied ? (
              <div style={{ marginTop: 8, fontSize: 13, color: t.green, fontWeight: 600 }}>
                {vibeConfig.onSatisfied?.successMessage ?? '필요한 내용을 다 말했어요.'}
              </div>
            ) : progress.showHints && gate.missing.length > 0 ? (
              <div style={{ marginTop: 8, fontSize: 13, color: t.inkSoft, lineHeight: 1.6 }}>
                {gate.missing[0].hint}
              </div>
            ) : null}
          </div>
        )}

        <div style={{ flex: 1, minHeight: 0 }}>
          {/* 바이브 코딩은 항상 마운트 유지 → 탭을 옮겨도 대화·코드가 사라지지 않음 */}
          <div style={{ display: active === 'vibe' ? 'block' : 'none', height: '100%' }}>
            <VibeCodingTab courseType={courseType} onResult={setResult} onUserTurn={progress.recordUserTurn} />
          </div>

          {active === 'modi' && <ModitorTab locale={locale} blocklyXml={result?.blockly_xml ?? packXml ?? undefined} />}
          {active === 'parts' && (
            <PartsTab
              result={result}
              checklist={partsConfig && partsConfig.gate === 'checklist' ? {
                items: partsConfig.items,
                checked: progress.checked,
                onToggle: progress.toggleCheck,
                satisfied: progress.partsSatisfied,
                allowSkip: partsConfig.allowSkip,
                skipLabel: partsConfig.skipLabel,
                onSkip: progress.unlockAll,
              } : undefined}
            />
          )}
          {active === 'note' && <LearningNotesTab result={result} />}
          {active === 'preview' && <PreviewTab result={result} courseType={courseType} pack={pack} />}
        </div>
      </div>
    </div>
  );
}
