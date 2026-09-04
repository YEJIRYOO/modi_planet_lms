import type { HybridKeyword } from './hybridCurriculum';

export interface SoftwareCurriculum {
  courseId: string;
  promptTitle: string;
  examples: string[];
  keywords: [HybridKeyword, HybridKeyword, HybridKeyword];
  unlockReply: string;
  notes: { title: string; what: string; why: string; where: string }[];
}

const HAND_WRITING_MAGIC: SoftwareCurriculum = {
  courseId: '9',
  promptTitle: '손가락 마법 그림판의 동작을 설명해 주세요',
  examples: [
    '웹카메라와 MediaPipe를 이용해 손가락으로 공중에 그림을 그리는 마법 그림판을 만들고 싶습니다. 카메라에서 엄지와 검지 끝의 거리를 계산해 두 손가락을 핀치하면 선을 그리고 손가락을 떼면 커서만 이동하게 해주세요. 좌표가 흔들리지 않도록 이전 위치와 새 위치를 부드럽게 보간하고, 무지개를 포함한 여섯 가지 색과 S·M·L 세 가지 굵기를 선택할 수 있게 해주세요. 마지막 선 되돌리기, 전체 지우기, 좌우 반전, PNG 저장 기능을 제공하고 별·무지개·고양이·로켓 등 여덟 가지 그림 미션을 완료하면 별 스티커와 축하 효과가 나타나도록 구성하고 싶습니다.',
  ],
  keywords: [
    {
      label: '손 인식과 핀치',
      synonyms: ['손', '손가락', '엄지', '검지', '핀치', '카메라', 'mediapipe', '인식', '제스처'],
      reply: '**손 인식과 핀치**가 마법 펜의 입력입니다. 카메라에서 엄지와 검지 끝의 거리를 계산하고 두 점이 가까워졌을 때만 선을 그립니다.',
      hint: '카메라가 어떤 손가락 동작을 그리기 신호로 판단해야 할까요?',
    },
    {
      label: '그리기 도구',
      synonyms: ['그리', '선', '색', '무지개', '굵기', '브러시', '펜', 'undo', 'clear', '지우', '되돌리'],
      reply: '**그리기 도구**에는 무지개를 포함한 색상, 세 가지 굵기, 되돌리기와 전체 지우기가 있습니다. 손가락 좌표를 부드럽게 보간해 선이 떨리지 않게 만듭니다.',
      hint: '선의 색과 굵기, 잘못 그렸을 때 사용할 도구를 설명해 보세요.',
    },
    {
      label: '미션과 저장',
      synonyms: ['미션', '별', '스티커', '완료', '저장', 'png', '다운로드', '작품', '사진'],
      reply: '**미션과 저장**으로 활동을 마무리합니다. 여덟 가지 그림 미션을 완료하면 별 스티커와 축하 효과를 받고, 완성한 작품은 PNG로 내려받습니다.',
      hint: '그림을 완성했을 때 어떤 보상을 주고 결과를 어떻게 남길까요?',
    },
  ],
  unlockReply: '**손 인식과 핀치 · 그리기 도구 · 미션과 저장**이 모두 정해졌습니다. 미리보기에서 카메라 권한을 허용하고 마법 그림판을 체험해 보세요.',
  notes: [
    { title: '랜드마크 기반 손 인식', what: '엄지와 검지 끝 좌표 사이의 거리를 계산한다.', why: '별도 장치 없이 손동작을 그리기 버튼으로 사용할 수 있다.', where: 'MediaPipe Hand Landmarker 결과 처리' },
    { title: '좌표 보간', what: '새 손가락 좌표를 이전 위치에 조금씩 섞어 이동시킨다.', why: '카메라 좌표의 작은 흔들림을 줄여 자연스러운 선을 만든다.', where: '검지 좌표의 sx·sy 갱신' },
    { title: '브라우저 내부 처리', what: '카메라 영상과 손 인식 결과를 브라우저 안에서만 사용한다.', why: '영상 전송 없이 실시간 반응과 개인정보 보호를 함께 만족한다.', where: 'getUserMedia와 로컬 canvas' },
  ],
};

const MAGIC_SCHOOL: SoftwareCurriculum = {
  courseId: '10',
  promptTitle: '녹턴 마법학교의 화면 흐름을 설명해 주세요',
  examples: [
    'Nocturne Academy라는 녹턴 마법학교를 소개하는 긴 스크롤형 3D 웹사이트를 만들고 싶습니다. 첫 화면에는 WebGL로 렌더링한 마법학교 성과 유리 렌즈 효과를 보여주고, 사용자가 스크롤하면 3D 입장 카드가 나타나 직접 드래그할 수 있게 해주세요. 다음에는 천문대·연금술관·달빛 정원·기록 보관소 수업 이미지를 날아가는 포스터와 돔 갤러리로 탐색하게 하고, 이후 ASTER·BRAM·ROWAN·VESPER 네 기숙사를 회전형 인터랙티브 메뉴로 비교할 수 있게 해주세요. 마지막에는 APPLY 버튼을 누르면 지원 일정과 인터뷰·결과 발표 날짜가 적힌 입학 편지 모달이 열리며, 모든 장면은 지연 로딩과 반응형 레이아웃을 적용해 자연스럽게 이어지도록 구성하고 싶습니다.',
  ],
  keywords: [
    {
      label: '스크롤과 3D',
      synonyms: ['스크롤', '3d', 'webgl', 'three', '모션', '애니메이션', '입장 카드', '카드', '드래그'],
      reply: '**스크롤과 3D**가 페이지의 진행 방식입니다. 스크롤 위치에 맞춰 장면과 카메라를 전환하고, 3D 입장 카드는 직접 드래그할 수 있습니다.',
      hint: '사용자가 스크롤하거나 드래그할 때 3D 장면이 어떻게 반응해야 할까요?',
    },
    {
      label: '학교 공간과 수업',
      synonyms: ['학교', '마법학교', '성', '수업', '커리큘럼', '갤러리', '포스터', '천문대', '연금술', '정원', '도서관'],
      reply: '**학교 공간과 수업**은 포스터와 돔 갤러리로 탐색합니다. 천문대·연금술관·달빛 정원·기록 보관소 이미지를 서로 다른 3D 장면에서 보여 줍니다.',
      hint: '마법학교에서 어떤 수업과 공간을 탐험하게 할지 설명해 보세요.',
    },
    {
      label: '기숙사와 입학',
      synonyms: ['기숙사', '하우스', 'aster', 'bram', 'rowan', 'vesper', '입학', '지원', 'apply', '모달', '안내'],
      reply: '**기숙사와 입학**이 마지막 흐름입니다. 네 기숙사를 인터랙티브 메뉴로 살펴보고 APPLY 버튼으로 입학 일정과 안내가 담긴 편지를 엽니다.',
      hint: '몇 개의 기숙사를 보여주고 입학 안내를 어떤 방식으로 열까요?',
    },
  ],
  unlockReply: '**스크롤과 3D · 학교 공간과 수업 · 기숙사와 입학**이 모두 정해졌습니다. 미리보기에서 페이지를 끝까지 스크롤하며 각 장면을 확인해 보세요.',
  notes: [
    { title: '지연 로딩', what: '화면 가까이에 온 3D 장면만 불러온다.', why: '무거운 WebGL 코드와 모델을 첫 화면에서 모두 받지 않기 위해서다.', where: 'IntersectionObserver와 lazy 컴포넌트' },
    { title: '스크롤 시퀀스', what: '섹션 위치를 0~1 진행도로 바꿔 장면 속성에 전달한다.', why: '사용자의 스크롤과 시각 효과가 하나의 이야기처럼 이어진다.', where: 'v2-scroll-sequence 진행도 계산' },
    { title: '3D 자산 경로', what: 'GLB와 이미지 파일을 프로젝트 전용 경로에서 불러온다.', why: 'LMS 자산과 충돌하지 않고 독립적으로 배포하기 위해서다.', where: '/projects/magic-school/assets' },
  ],
};

const CARD_DASH: SoftwareCurriculum = {
  courseId: '11',
  promptTitle: 'CARD DASH의 레이스 규칙을 설명해 주세요',
  examples: [
    '장난감 카트를 직접 운전하면서 카드 전략으로 순위를 뒤집는 CARD DASH 3D 레이싱 게임을 구성하고 싶습니다. 허브에서 WASD로 카트를 이동하고 Space로 부스터, H로 경적을 사용해 빛나는 구역까지 직접 운전하면 게임 모드가 열리게 해주세요. 공격·방어·이동 카드를 레이스 중에 뽑고 합치며 현재 순위와 상대 위치에 맞춰 콤보로 사용할 수 있게 하고, HUD에는 속도·랩·순위·보유 카드·부스터 상태를 계속 표시해주세요. 싱글 플레이에서는 AI 5대와 3랩 카드 대전, 개인 최고 고스트가 있는 타임어택, 자유 주행 연습장을 제공하고 멀티플레이에서는 한 컴퓨터 2인 모드와 온라인 룸 생성·검색·초대 코드 참가 흐름을 제공하고 싶습니다.',
  ],
  keywords: [
    {
      label: '카트 주행',
      synonyms: ['카트', '주행', '운전', 'wasd', '이동', '부스터', 'space', '경적', '속도'],
      reply: '**카트 주행**은 WASD 이동과 Space 부스터를 중심으로 구성됩니다. 허브에서도 카트를 직접 몰아 원하는 게임 구역으로 진입합니다.',
      hint: '카트를 어떤 키로 움직이고 가속 기능은 어떻게 사용할까요?',
    },
    {
      label: '카드 전략',
      synonyms: ['카드', '공격', '방어', '이동 카드', '조합', '합치', '전략', '아이템', '콤보'],
      reply: '**카드 전략**은 단순 주행과 레이스를 구분하는 핵심입니다. 공격·방어·이동 카드를 선택하고 조합해 현재 순위와 트랙 상황에 대응합니다.',
      hint: '레이스 중 어떤 종류의 카드를 어떤 목적으로 사용할까요?',
    },
    {
      label: '레이스 모드와 HUD',
      synonyms: ['레이스', '싱글', '멀티', '타임어택', '연습장', '랩', '순위', 'hud', '룸', '코스'],
      reply: '**레이스 모드와 HUD**에서 AI 대전·타임어택·연습장·멀티플레이를 선택합니다. HUD는 순위, 랩, 속도, 카드와 부스터 상태를 즉시 보여 줍니다.',
      hint: '어떤 레이스 모드를 제공하고 화면에 어떤 상태를 계속 표시할까요?',
    },
  ],
  unlockReply: '**카트 주행 · 카드 전략 · 레이스 모드와 HUD**가 모두 정해졌습니다. 미리보기에서 CARD DASH 허브와 레이스 흐름을 체험해 보세요.',
  notes: [
    { title: '주행과 전략의 결합', what: '실시간 카트 조작과 카드 선택을 같은 레이스에 배치한다.', why: '운전 실력뿐 아니라 상황 판단이 순위에 영향을 주게 한다.', where: 'CARD DASH 레이스 규칙' },
    { title: '허브 기반 선택', what: '메뉴 버튼 대신 카트를 몰아 빛나는 구역으로 들어간다.', why: '모드 선택 과정도 게임 세계의 일부로 느끼게 한다.', where: 'DRIVEABLE HUB' },
    { title: '외부 서비스 경계', what: 'LMS는 carddash.net을 읽기 전용 WebView로 표시한다.', why: '외부 사이트의 소스와 서버 상태를 LMS에서 직접 변경할 수 없기 때문이다.', where: 'CARD DASH 미리보기 iframe' },
  ],
};

export const SOFTWARE_CURRICULA: SoftwareCurriculum[] = [HAND_WRITING_MAGIC, MAGIC_SCHOOL, CARD_DASH];

export const findSoftwareCurriculum = (courseId?: string) =>
  SOFTWARE_CURRICULA.find((curriculum) => curriculum.courseId === courseId);
