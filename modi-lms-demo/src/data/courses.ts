import type { CourseType } from '../types';
import type { DesignDoc } from './designDoc';

export interface CourseProject {
  previewUrl?: string;
  downloadUrl?: string;
  previewNote?: string;
  modiBridge?: boolean;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  type: CourseType;
  goal: string;      // 완성물 한 줄 설명
  modules?: string[]; // 카드 썸네일용 대표 MODI 모듈 키(lib/modules.ts). 표시 전용 — 학습 데이터와 무관.
  plan?: DesignDoc;  // 설계문서(강의안). 아직 미수령 → optional. 강의안 오면 이 필드만 채우면 뷰어 자동 렌더.
  project?: CourseProject;
}

export const COMPLETED_PROJECTS_DOWNLOAD_URL = '/projects/completed.zip';

// 실제 API 오기 전 임시 데이터. 나중에 이 배열만 교체.
// HW_SW 3종은 data/hybridCurriculum.ts 의 courseId 와 id 가 반드시 일치해야 한다.
export const COURSES: Course[] = [
  { id: '1', title: '장애물 회피 자동차', description: '조이스틱으로 조종하고 장애물을 피하는 MODI 자동차', type: 'HW', goal: '자율주행 자동차 완성', modules: ['joystick', 'tof', 'motor_a'] },
  { id: '2', title: '세포 생물학 탐험', description: 'DNA 구조를 인터랙티브하게 학습', type: 'SW', goal: 'DNA 구조 시뮬레이션' },
  { id: '3', title: '1942', description: '자이로로 조종하고 버튼으로 발사하는 비행 슈팅', type: 'HW_SW', goal: 'IMU·버튼으로 조종하는 슈팅 게임', modules: ['imu', 'button', 'motor_a'], project: { previewUrl: '/projects/1942/index.html', downloadUrl: '/projects/1942-standalone.zip', previewNote: '사이트에서 바로 실행됩니다. 연결된 IMU·버튼 또는 키보드·슬라이더로 조작하세요.', modiBridge: true } },
  { id: '4', title: 'Tilt Match', description: 'MODI LED 색과 같은 쪽으로 기울여 점수를 얻는 반응 게임', type: 'HW_SW', goal: 'LED 색 판별 + 기울기 반응 게임', modules: ['imu', 'led'], project: { previewUrl: '/projects/tilt-match/index.html', downloadUrl: '/projects/tilt-match-standalone.zip', previewNote: '사이트에서 바로 실행됩니다. IMU 또는 화면 슬라이더로 색 방향을 맞추세요.', modiBridge: true } },
  { id: '5', title: 'Loop Studio', description: '다이얼 또는 조이스틱으로 볼륨을 조절하고 버튼으로 재생하는 8칸 음악 시퀀서', type: 'HW_SW', goal: 'MODI 스피커로 연주하는 시퀀서', modules: ['dial', 'button', 'speaker'], project: { previewUrl: '/projects/music-studio/index.html', downloadUrl: '/projects/music-studio-standalone.zip', previewNote: '사이트에서 패턴·템포·볼륨을 조절하고 연결한 MODI 스피커로 연주할 수 있습니다.', modiBridge: true } },
  { id: '6', title: 'Tilt & Click 연결 점검', description: '자이로를 기울이고 버튼을 눌러 HW+SW 연결을 한 번에 확인', type: 'HW_SW', goal: '자이로·버튼 실시간 입력 점검', modules: ['imu', 'button'] },
  { id: '7', title: '함수 그래프 챌린지', description: '다이얼로 계수를 바꾸고 조이스틱으로 항을 골라 목표 함수의 개형을 맞추는 수학 게임', type: 'HW_SW', goal: '일차·절댓값·이차함수 그래프 정확도 90% 달성', modules: ['dial', 'joystick', 'button'], project: { previewUrl: '/projects/function-shape/index.html', downloadUrl: '/projects/function-shape-standalone.zip', previewNote: '연결한 다이얼·조이스틱·버튼 또는 화면 조작으로 그래프를 맞추세요.', modiBridge: true } },
  { id: '8', title: '구구단 퀘스트', description: '조이스틱으로 답을 만들고 버튼으로 제출하는 10문제 구구단 게임', type: 'HW_SW', goal: '난이도별 구구단 10문제 완주', modules: ['joystick', 'button', 'dial'], project: { previewUrl: '/projects/times-table-quest/index.html', downloadUrl: '/projects/times-table-quest-standalone.zip', previewNote: '연결한 조이스틱·버튼·다이얼 또는 화면 조작으로 10문제를 푸세요.', modiBridge: true } },
  {
    id: '9',
    title: '손가락 마법 그림판',
    description: '카메라가 엄지와 검지의 핀치 동작을 인식해 공중에 그림을 그리는 인터랙티브 미술 프로젝트',
    type: 'SW',
    goal: '손동작으로 미션 그림을 완성하고 PNG로 저장',
    project: {
      previewUrl: '/projects/hand-writing-magic/hand_wirting.html',
      downloadUrl: '/projects/hand-writing-magic-standalone.zip',
      previewNote: '카메라 영상은 브라우저 안에서만 처리됩니다.',
    },
  },
  {
    id: '10',
    title: '녹턴 마법학교 3D 웹사이트',
    description: '스크롤과 드래그에 반응하는 3D 장면으로 마법학교의 수업·성·기숙사를 탐험하는 인터랙티브 웹 프로젝트',
    type: 'SW',
    goal: '3D 그래픽과 모션으로 구성된 마법학교 소개 사이트 체험',
    project: {
      previewUrl: '/projects/magic-school/index.html',
      downloadUrl: '/projects/magic-school-standalone.zip',
      previewNote: '스크롤·드래그·버튼으로 WebGL 3D 장면과 입학 안내를 체험해 보세요.',
    },
  },
  {
    id: '11',
    title: 'CARD DASH 3D 레이싱',
    description: '카드를 뽑고 합치며 순위를 뒤집는 3D 웹 카트 레이싱 게임',
    type: 'SW',
    goal: '카드 전략과 주행 조작을 결합한 3D 레이스 체험',
    project: {
      previewUrl: 'https://carddash.net/',
      previewNote: 'WASD로 이동하고 Space로 부스터를 사용하세요. 온라인 콘텐츠는 carddash.net에서 실시간으로 불러옵니다.',
    },
  },
  {
    id: '12',
    title: 'EMBER & TIDE 물불 모험',
    description: '불의 아이와 물의 아이를 번갈아 조종하며 온도·빛·방향 퍼즐을 해결하는 3스테이지 협동 어드벤처',
    type: 'HW_SW',
    goal: '두 원소 캐릭터로 세 유적의 퍼즐을 풀고 각자의 포털에 도달',
    modules: ['network', 'imu', 'joystick'],
    project: {
      previewUrl: '/projects/ember-and-tide/index.html',
      downloadUrl: '/projects/ember-and-tide-standalone.zip',
      previewNote: '연결한 MODI 모듈 또는 키보드와 화면 시뮬레이터로 플레이할 수 있습니다.',
      modiBridge: true,
    },
  },
  {
    id: '13',
    title: 'Classroom Garden',
    description: '교실의 온도·습도·빛과 물주기·쓰다듬기 활동으로 씨앗부터 꽃까지 키우는 과학·정보 프로젝트',
    type: 'HW_SW',
    goal: '환경을 균형 있게 관리해 5단계 식물 성장 완료',
    modules: ['network', 'env', 'dial'],
    project: {
      previewUrl: '/projects/classroom-garden/index.html',
      downloadUrl: '/projects/classroom-garden-standalone.zip',
      previewNote: '연결한 ENV·다이얼·버튼·ToF·LED 또는 화면 조작으로 식물을 키우세요.',
      modiBridge: true,
    },
  },
];

export const findCourse = (id?: string) => COURSES.find((c) => c.id === id);
