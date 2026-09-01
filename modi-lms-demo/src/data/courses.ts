import type { CourseType } from '../types';

export interface Course {
  id: string;
  title: string;
  description: string;
  type: CourseType;
  goal: string; // 완성물 한 줄 설명
}

// 실제 API 오기 전 임시 데이터. 나중에 이 배열만 교체.
export const COURSES: Course[] = [
  { id: '1', title: '장애물 회피 자동차', description: '조이스틱으로 조종하고 장애물을 피하는 MODI 자동차', type: 'HW', goal: '자율주행 자동차 완성' },
  { id: '2', title: '세포 생물학 탐험', description: 'DNA 구조를 인터랙티브하게 학습', type: 'SW', goal: 'DNA 구조 시뮬레이션' },
  { id: '3', title: '스마트 화분', description: '센서로 식물 상태를 읽고 웹으로 보여주는 IoT', type: 'HW_SW', goal: '센서 + 웹 대시보드' },
];

export const findCourse = (id?: string) => COURSES.find((c) => c.id === id);
