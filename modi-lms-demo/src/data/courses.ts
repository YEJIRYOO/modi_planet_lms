import type { CourseType } from '../types';
import type { DesignDoc } from './designDoc';

export interface Course {
  id: string;
  title: string;
  description: string;
  type: CourseType;
  goal: string;      // 완성물 한 줄 설명
  plan?: DesignDoc;  // 설계문서(강의안). 아직 미수령 → optional. 강의안 오면 이 필드만 채우면 뷰어 자동 렌더.
}

// ⚠️ 아래 plan 은 강의안 도착 전 데모용 placeholder. 실제 강의안 오면 통째로 교체.
const SAMPLE_PLAN_SMARTPOT: DesignDoc = {
  objectives: [
    '토양 수분 센서 값을 읽어 웹 대시보드에 표시할 수 있다.',
    '센서 입력(HW)과 화면 출력(SW)이 어떻게 연결되는지 설명할 수 있다.',
    '임계값을 정해 "물 주세요" 알림 조건을 스스로 설계할 수 있다.',
  ],
  standards: [
    { code: '[9정04-03]', text: '실생활 문제를 해결하기 위한 센서 기반 프로그램을 설계하고 구현한다.' },
    { code: '[9정05-02]', text: '입력·처리·출력의 흐름으로 문제 해결 과정을 표현한다.' },
  ],
  materials: ['MODI 키트(환경 센서)', '학생용 기기', '화분·물', '측정 기록 활동지'],
  successCriteria: [
    '센서 값이 실시간으로 대시보드 숫자에 반영된다.',
    '값이 기준 이하로 내려가면 화면에 알림이 나타난다.',
    '측정을 3회 이상 반복해 값의 변화를 기록한다.',
  ],
  vocabulary: [
    { term: '센서', meaning: '환경의 상태를 신호로 바꿔 주는 장치', example: '흙의 물기를 숫자로 알려 주는 수분 센서' },
    { term: '임계값', meaning: '동작을 바꾸는 기준이 되는 값', example: '수분 30% 미만이면 알림을 켠다.' },
  ],
  rubric: [
    { criterion: '센서 연결', basic: '센서를 연결하지만 값이 불안정하다.', proficient: '값이 대시보드에 안정적으로 표시된다.', advanced: '노이즈를 줄이거나 보정까지 시도한다.' },
    { criterion: '알림 설계', basic: '고정된 문구만 보여 준다.', proficient: '임계값 조건으로 알림이 켜진다.', advanced: '상황별로 다른 안내를 제공한다.' },
  ],
};

// 실제 API 오기 전 임시 데이터. 나중에 이 배열만 교체.
export const COURSES: Course[] = [
  { id: '1', title: '장애물 회피 자동차', description: '조이스틱으로 조종하고 장애물을 피하는 MODI 자동차', type: 'HW', goal: '자율주행 자동차 완성' },
  { id: '2', title: '세포 생물학 탐험', description: 'DNA 구조를 인터랙티브하게 학습', type: 'SW', goal: 'DNA 구조 시뮬레이션' },
  { id: '3', title: '스마트 화분', description: '센서로 식물 상태를 읽고 웹으로 보여주는 IoT', type: 'HW_SW', goal: '센서 + 웹 대시보드', plan: SAMPLE_PLAN_SMARTPOT },
];

export const findCourse = (id?: string) => COURSES.find((c) => c.id === id);
