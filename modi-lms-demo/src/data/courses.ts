import type { CourseType } from '../types';
import type { DesignDoc } from './designDoc';

export interface Course {
  id: string;
  title: string;
  description: string;
  type: CourseType;
  goal: string;      // 완성물 한 줄 설명
  modules?: string[]; // 카드 썸네일용 대표 MODI 모듈 키(lib/modules.ts). 표시 전용 — 학습 데이터와 무관.
  plan?: DesignDoc;  // 설계문서(강의안). 아직 미수령 → optional. 강의안 오면 이 필드만 채우면 뷰어 자동 렌더.
}

// 실제 API 오기 전 임시 데이터. 나중에 이 배열만 교체.
// HW_SW 3종은 data/hybridCurriculum.ts 의 courseId 와 id 가 반드시 일치해야 한다.
export const COURSES: Course[] = [
  { id: '1', title: '장애물 회피 자동차', description: '조이스틱으로 조종하고 장애물을 피하는 MODI 자동차', type: 'HW', goal: '자율주행 자동차 완성', modules: ['joystick', 'tof', 'motor_a'] },
  { id: '2', title: '세포 생물학 탐험', description: 'DNA 구조를 인터랙티브하게 학습', type: 'SW', goal: 'DNA 구조 시뮬레이션' },
  { id: '3', title: '1942', description: '자이로로 조종하고 버튼으로 발사하는 비행 슈팅', type: 'HW_SW', goal: 'IMU·버튼으로 조종하는 슈팅 게임', modules: ['imu', 'button', 'motor_a'] },
  { id: '4', title: 'Tilt Match', description: 'MODI LED 색과 같은 쪽으로 기울여 점수를 얻는 반응 게임', type: 'HW_SW', goal: 'LED 색 판별 + 기울기 반응 게임', modules: ['imu', 'led'] },
  { id: '5', title: 'Loop Studio', description: '다이얼과 버튼으로 조작하는 8칸 음악 시퀀서', type: 'HW_SW', goal: 'MODI 스피커로 연주하는 시퀀서', modules: ['dial', 'button', 'speaker'] },
  { id: '6', title: 'Tilt & Click 연결 점검', description: '자이로를 기울이고 버튼을 눌러 HW+SW 연결을 한 번에 확인', type: 'HW_SW', goal: '자이로·버튼 실시간 입력 점검', modules: ['imu', 'button'] },
];

export const findCourse = (id?: string) => COURSES.find((c) => c.id === id);
