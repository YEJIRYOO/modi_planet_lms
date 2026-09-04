/* 어느 탭까지 열렸는지 관리하는 훅.
 *
 * 원칙 둘.
 *  1. 한 번 열린 탭은 다시 잠기지 않는다. 미리보기에서 조작이 안 될 때
 *     준비물로 돌아가 배치도를 다시 볼 수 있어야 한다.
 *  2. 모든 관문에 빠져나갈 길이 있다. 한 학생 때문에 수업이 멈추면 안 된다. */

import { useCallback, useMemo, useState } from 'react';
import { evaluateKeywordGate, type CourseFlow, type GateResult, type StageKey } from './coursePack';

export interface CourseProgress {
  active: StageKey;
  setActive: (s: StageKey) => void;
  isUnlocked: (s: StageKey) => boolean;

  checked: string[];
  toggleCheck: (id: string) => void;
  partsSatisfied: boolean;

  gate: GateResult;
  attempts: number;
  showHints: boolean;
  recordUserTurn: (text: string) => void;

  /** 교사용 · 관문을 건너뛰고 전부 연다. */
  unlockAll: () => void;
  unlocked: boolean;
}

const EMPTY_GATE: GateResult = { matched: [], missing: [], satisfied: true, progress: 1 };

export function useCourseProgress(
  order: StageKey[],
  flow: CourseFlow | undefined,
  isTeacher = false,
): CourseProgress {
  const [active, setActive] = useState<StageKey>(order[0]);
  const [reached, setReached] = useState(0);
  const [checked, setChecked] = useState<string[]>([]);
  const [turns, setTurns] = useState<string[]>([]);
  const [forced, setForced] = useState(isTeacher);

  const groups = flow?.vibe?.groups;
  const gate = useMemo(
    () => (groups && groups.length > 0 ? evaluateKeywordGate(groups, turns) : EMPTY_GATE),
    [groups, turns],
  );

  const partsSatisfied = useMemo(() => {
    const items = flow?.parts?.items;
    if (!items || items.length === 0) return true;
    return items.filter((i) => i.required).every((i) => checked.includes(i.id));
  }, [flow, checked]);

  // 관문을 통과하면 그 다음 단계까지 열어 준다. reached 는 내려가지 않는다.
  const unlockedIndex = useMemo(() => {
    if (forced) return order.length - 1;
    let index = 0;
    if (partsSatisfied) index = Math.max(index, order.indexOf('vibe'));
    if (gate.satisfied) index = order.length - 1;
    return Math.max(index, reached);
  }, [forced, order, partsSatisfied, gate.satisfied, reached]);

  const isUnlocked = useCallback(
    (s: StageKey) => order.indexOf(s) <= unlockedIndex,
    [order, unlockedIndex],
  );

  const guardedSetActive = useCallback(
    (s: StageKey) => {
      if (!isUnlocked(s)) return;
      setReached((prev) => Math.max(prev, order.indexOf(s)));
      setActive(s);
    },
    [isUnlocked, order],
  );

  const toggleCheck = useCallback((id: string) => {
    setChecked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  const recordUserTurn = useCallback((text: string) => {
    setTurns((prev) => [...prev, text]);
  }, []);

  const unlockAll = useCallback(() => setForced(true), []);

  return {
    active,
    setActive: guardedSetActive,
    isUnlocked,
    checked,
    toggleCheck,
    partsSatisfied,
    gate,
    attempts: turns.length,
    showHints: forced || turns.length >= (flow?.vibe?.hintAfterAttempts ?? 3),
    recordUserTurn,
    unlockAll,
    unlocked: forced,
  };
}
