/* 코스 팩 — public/courses/<id>/course.json 을 읽어 온다.
 *
 * 바이브 코딩 백엔드가 hybrid 에서 generated_code 를 null 로 주는 문제와 별개로,
 * HW+SW 수업은 "준비물 → 바이브 → 모디 → 미리보기" 순서라 준비물 탭이 맨 앞에 온다.
 * 그런데 준비물 내용은 원래 바이브 결과에서 나오므로, 그대로 두면 첫 탭이 빈 화면이다.
 * 그래서 미리 만들어 둔 preset 을 result 자리에 먼저 채워 넣는다.
 * 바이브가 실제 결과를 주면 그쪽이 preset 을 덮어쓴다. */

import type { VibeResult, ModiModules, LearningNote } from './vibeClient';

export type StageKey = 'vibe' | 'preview' | 'modi' | 'parts' | 'note';

export interface KeywordGroup {
  id: string;
  label: string;
  /** 하나라도 걸리면 통과. 어간만 적어 활용형을 함께 잡는다. */
  patterns: string[];
  hint: string;
}

export interface ChecklistItem { id: string; label: string; required: boolean; }

export interface CourseFlow {
  order: StageKey[];
  parts?: {
    gate: 'checklist' | 'none';
    allowSkip?: boolean;
    skipLabel?: string;
    items: ChecklistItem[];
  };
  vibe?: {
    gate: 'keywords' | 'none';
    hintAfterAttempts: number;
    groups: KeywordGroup[];
    onSatisfied?: { unlock?: StageKey[]; jumpTo?: StageKey; successMessage?: string };
  };
}

export interface CoursePack {
  id: string;
  title: string;
  description?: string;
  preview?: { entry: string; query?: string; note?: string };
  blocklyXmlFile?: string;
  preset?: { modi_modules?: ModiModules; learning_notes?: LearningNote[] };
  flow?: CourseFlow;
}

export const packBase = (packId: string) => `/courses/${packId}`;

/** 미리보기 iframe 이 열 주소. 같은 오리진이라 CORS 도 SDK 주입도 필요 없다. */
export function packPreviewUrl(pack: CoursePack): string {
  const entry = pack.preview?.entry ?? 'index.html';
  return `${packBase(pack.id)}/${entry}${pack.preview?.query ?? ''}`;
}

export async function loadCoursePack(packId: string): Promise<CoursePack> {
  const res = await fetch(`${packBase(packId)}/course.json`);
  if (!res.ok) throw new Error(`코스 팩을 불러오지 못했습니다 (${res.status})`);
  return (await res.json()) as CoursePack;
}

/** 모디 블록 탭에 미리 넣어 둘 XML. 파일이 없으면 조용히 넘어간다. */
export async function loadPackBlocklyXml(pack: CoursePack): Promise<string | null> {
  if (!pack.blocklyXmlFile) return null;
  try {
    const res = await fetch(`${packBase(pack.id)}/${pack.blocklyXmlFile}`);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

/** preset 을 VibeResult 모양으로 바꿔 준비물·학습노트 탭이 그대로 읽게 한다. */
export function packToResult(pack: CoursePack, blocklyXml?: string | null): VibeResult {
  return {
    modi_modules: pack.preset?.modi_modules ?? null,
    learning_notes: pack.preset?.learning_notes ?? null,
    blockly_xml: blocklyXml ?? null,
  };
}

/* ── 바이브 코딩 관문 ────────────────────────────────────────────
   정답 문장을 맞히는 게 아니라, 아직 말하지 않은 개념을 알려 주는 것이 목적이다.
   그래서 통과/실패가 아니라 그룹별 진행률로 계산한다. */

export interface GateResult {
  matched: string[];
  missing: KeywordGroup[];
  satisfied: boolean;
  progress: number;
}

const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();

export function evaluateKeywordGate(groups: KeywordGroup[], userTurns: string[]): GateResult {
  const hay = normalize(userTurns.join(' '));
  const matched: string[] = [];
  const missing: KeywordGroup[] = [];
  for (const g of groups) {
    if (g.patterns.some((p) => hay.includes(normalize(p)))) matched.push(g.id);
    else missing.push(g);
  }
  return {
    matched,
    missing,
    satisfied: groups.length > 0 && missing.length === 0,
    progress: groups.length === 0 ? 1 : matched.length / groups.length,
  };
}
