import type { CourseType } from '../types';
import { t } from '../styles/tokens';

// 설계문서(강의안) 스키마 — 실제 커리큘럼 데이터 필드에 1:1 대응.
export interface DesignDoc {
  objectives: string[];                                   // 학습 목표
  standards: { code: string; text: string }[];            // 성취기준
  materials: string[];                                    // 준비물
  successCriteria: string[];                              // 성공 기준
  vocabulary?: { term: string; meaning: string; example: string }[];
  rubric?: { criterion: string; basic: string; proficient: string; advanced: string }[];
}

// 유형 메타: 키는 CourseType(HW_SW 언더바), 표시 라벨은 "HW+SW".
export const TYPE_META: Record<CourseType, { label: string; fg: string; bg: string; full: string; icon: string }> = {
  HW:    { label: 'HW',    fg: t.blue,   bg: t.blueSoft,   full: '하드웨어',   icon: '🔌' },
  SW:    { label: 'SW',    fg: t.purple, bg: t.purpleSoft, full: '소프트웨어', icon: '🖥️' },
  HW_SW: { label: 'HW+SW', fg: t.green,  bg: t.greenSoft,  full: '융합',       icon: '🧩' },
};

// 유형별 학습 화면 탭 구성 (컨벤션 노트 §4).
export const TABS: Record<CourseType, string[]> = {
  HW:    ['바이브 코딩', '코드 에디터', '모디', '설계문서', '학습 노트'],
  SW:    ['바이브 코딩', '미리보기', '설계문서', '학습 노트'],
  HW_SW: ['바이브 코딩', '미리보기', '코드 에디터', '모디', '설계문서', '학습 노트'],
};
