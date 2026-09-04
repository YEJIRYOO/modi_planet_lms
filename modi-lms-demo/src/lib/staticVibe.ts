/* HW+SW 바이브 코딩의 정적 엔진.
   AI 에이전트(/agent/chat)를 호출하지 않는다. data/hybridCurriculum.ts 의 정답지를 읽어
   "생각하는 중 → 타이핑" 순서로 흘려보내기만 한다.

   기존 vibeClient.streamChat 과 같은 모양(콜백으로 이벤트 통지 + Promise 반환)을 유지해서
   화면 쪽 코드가 실제 스트리밍과 구분되지 않게 했다. */

import type { HybridKeyword } from '../data/hybridCurriculum';

export interface StaticVibeCurriculum {
  examples: string[];
  keywords: [HybridKeyword, HybridKeyword, HybridKeyword];
  unlockReply: string;
  promptTitle?: string;
}

export const MIN_STATIC_PROMPT_LENGTH = 80;

export type StaticVibeEvent =
  | { type: 'status'; message: string }
  | { type: 'token'; text: string }
  | { type: 'done'; matched: string[]; unlocked: boolean };

export interface StaticTurnResult {
  /** 이번 턴까지 누적으로 맞힌 키워드 label 들 */
  matched: string[];
  /** 3개 전부 맞혔는지 */
  unlocked: boolean;
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** 비교용 정규화 — 공백·문장부호를 없애고 소문자로. "자이로 센서" 와 "자이로센서" 를 같게 본다. */
function normalize(s: string): string {
  return s.toLowerCase().replace(/[\s.,!?~·\-_'"()[\]]/g, '');
}

/** 사용자가 이번에 새로 맞힌 키워드 label 목록 */
function matchKeywords(cur: StaticVibeCurriculum, text: string, already: string[]): string[] {
  const hay = normalize(text);
  return cur.keywords
    .filter((k) => !already.includes(k.label))
    .filter((k) => k.synonyms.some((s) => hay.includes(normalize(s))))
    .map((k) => k.label);
}

/* 진행 상황 문구. 실제로는 아무 일도 안 하지만 생성 과정을 보여 주는 역할. */
const STATUSES = [
  '요청을 이해하는 중',
  '필요한 MODI 모듈을 확인하는 중',
  '핵심 개념을 정리하는 중',
];
const STATUSES_UNLOCK = [
  '요청을 이해하는 중',
  '동작 흐름을 정리하는 중',
  '코드를 작성하는 중',
  '실행 준비를 확인하는 중',
];

/** 응답 본문을 조립한다. */
function composeReply(cur: StaticVibeCurriculum, newly: string[], matchedAll: string[]): string {
  const parts: string[] = [];

  for (const label of newly) {
    const k = cur.keywords.find((x) => x.label === label);
    if (k) parts.push(k.reply);
  }

  const remaining = cur.keywords.filter((k) => !matchedAll.includes(k.label));

  if (remaining.length === 0) {
    parts.push(cur.unlockReply);
  } else if (newly.length === 0) {
    // 아무것도 못 맞힌 턴 — 다음 힌트만 준다
    parts.push(`아직 정해지지 않은 것이 ${remaining.length}가지 있어요.\n\n${remaining[0].hint}`);
  } else {
    const names = remaining.map((k) => `**${k.label}**`).join(' · ');
    parts.push(`남은 것은 ${names} 예요.\n\n${remaining[0].hint}`);
  }

  return parts.join('\n\n');
}

/** 한 글자씩이 아니라 2~4자씩 흘려보낸다. 한 글자 단위면 타이머가 너무 잦아 버벅인다. */
async function streamText(text: string, onEvent: (e: StaticVibeEvent) => void, signal?: AbortSignal) {
  let i = 0;
  while (i < text.length) {
    if (signal?.aborted) return;
    const size = 2 + Math.floor(Math.random() * 3);
    onEvent({ type: 'token', text: text.slice(i, i + size) });
    i += size;
    await sleep(12 + Math.random() * 18);
  }
}

/**
 * 한 턴을 처리한다.
 * @param cur       강좌의 정적 커리큘럼
 * @param message   사용자가 입력한 문장
 * @param already   이전 턴까지 맞힌 키워드 label 들
 */
export async function runStaticTurn(
  cur: StaticVibeCurriculum,
  message: string,
  already: string[],
  onEvent: (e: StaticVibeEvent) => void,
  signal?: AbortSignal,
): Promise<StaticTurnResult> {
  const tooShort = message.trim().length < MIN_STATIC_PROMPT_LENGTH;
  const newly = tooShort ? [] : matchKeywords(cur, message, already);
  const matched = [...already, ...newly];
  const unlocked = matched.length >= cur.keywords.length;

  if (tooShort) {
    onEvent({ type: 'status', message: '요청의 내용을 확인하는 중' });
    await sleep(450);
    if (!signal?.aborted) {
      await streamText(`요청이 제대로 전달되었나요? 설명이 너무 짧아 만들고 싶은 동작을 충분히 이해하지 못했어요.\n\n입력 방식, 핵심 동작, 필요한 조건, 기대하는 결과와 확인 방법을 포함해 ${MIN_STATIC_PROMPT_LENGTH}자 이상으로 자세히 설명해 주세요.`, onEvent, signal);
    }
    onEvent({ type: 'done', matched, unlocked });
    return { matched, unlocked };
  }

  const statuses = cur.promptTitle
    ? unlocked
      ? ['요청을 이해하는 중', '핵심 기능을 연결하는 중', '미리보기를 준비하는 중']
      : ['요청을 이해하는 중', '프로젝트 기능을 확인하는 중', '핵심 개념을 정리하는 중']
    : unlocked ? STATUSES_UNLOCK : STATUSES;
  for (const s of statuses) {
    if (signal?.aborted) break;
    onEvent({ type: 'status', message: s });
    await sleep(420 + Math.random() * 380);
  }

  if (!signal?.aborted) {
    await streamText(composeReply(cur, newly, matched), onEvent, signal);
  }

  onEvent({ type: 'done', matched, unlocked });
  return { matched, unlocked };
}
