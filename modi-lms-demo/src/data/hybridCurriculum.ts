/* HW+SW(하이브리드) 강좌 정적 데이터.
   AI 에이전트 호출을 걷어내고 이 표를 정답지로 쓴다. 화면에는 AI가 도는 것처럼 보이지만
   실제로는 lib/staticVibe.ts 가 이 데이터를 타이핑 효과로 흘려보낸다.

   코드 스니펫은 게임 원본(app.py / app.js)에서 발췌한 것이다.
   원본은 한 줄에 몰아 쓴 곳이 많아 학습용으로 줄바꿈·주석만 손봤고, 로직은 그대로다. */

export interface HybridKeyword {
  /** 학생에게 보여 줄 이름 */
  label: string;
  /** 매칭용 표현들. 소문자·공백제거 후 부분일치로 판정한다. */
  synonyms: string[];
  /** 이 키워드가 걸렸을 때 assistant 가 답할 내용(마크다운) */
  reply: string;
  /** 못 맞혔을 때 흘려 줄 힌트 */
  hint: string;
}

export interface HybridModule {
  key: string;      // lib/modules.ts 의 키
  role: '필수' | '선택' | '택1';
  reason: string;
  count: number;
  choiceGroup?: string;
}

export interface HybridCurriculum {
  courseId: string;
  /** 게임 실행 포트. 게임 README 기준 고정값. */
  port: number;
  /** 준비물 탭에 그대로 보여 줄 실행 명령 */
  runCommand: string;
  /** 게임 폴더 이름(실행 안내용) */
  folder: string;
  modules: HybridModule[];
  /** 실기기 없이 볼 때의 제약 안내 */
  mockNote: string;
  /** 첫 인사 — 프롬프트 입력 전에 보이는 예시 문장 */
  examples: string[];
  /** 3개 고정. 순서와 무관하게 누적 매칭한다. */
  keywords: [HybridKeyword, HybridKeyword, HybridKeyword];
  /** 3개 모두 채웠을 때 마지막 응답 */
  unlockReply: string;
  /** 코드 보기 탭에 뜨는 파일들 */
  codeFiles: Record<string, string>;
  notes: { title: string; what: string; why: string; where: string }[];
}

/* ────────────────────────────── 1942 ────────────────────────────── */

const F1942: HybridCurriculum = {
  courseId: '3',
  port: 8101,
  folder: '1942-standalone',
  runCommand: 'python app.py --mode real --port 8101',
  modules: [
    { key: 'imu', role: '필수', reason: '기체를 기울여 비행기를 좌우로 움직인다', count: 1 },
    { key: 'button', role: '필수', reason: '누르면 총알을 발사한다', count: 1 },
    { key: 'motor_a', role: '선택', reason: '기울기에 따라 회전해 손에 반응을 준다', count: 1 },
    { key: 'led', role: '선택', reason: '발사 중일 때 색이 바뀐다', count: 1 },
  ],
  mockNote: 'IMU와 버튼이 없으면 게임이 mock 모드로 떨어져 화면 아래 슬라이더로만 조작됩니다.',
  examples: [
    'IMU 자이로의 roll과 pitch 기울기 값을 이용해 비행기를 좌우와 앞뒤로 부드럽게 이동시키고 싶습니다. 시작할 때 중립 자세와 오른쪽 방향을 보정하고, 버튼을 누르는 순간에만 총알 두 발을 발사해 길게 눌러도 연속 발사되지 않게 해주세요. 총알과 적이 충돌하면 점수를 100점 올리고, 적과 비행기가 부딪히면 목숨을 하나 줄인 뒤 1.5초 동안 무적 상태를 적용해주세요. 화면에는 현재 점수와 목숨, 레벨을 표시하고, 모터와 LED가 연결되어 있다면 기울기와 발사 상태에 맞춰 함께 반응하도록 구성하고 싶습니다.',
  ],
  keywords: [
    {
      label: '기울기',
      synonyms: ['기울', '자이로', 'imu', '각도', 'roll', 'pitch', '기우'],
      reply: '**기울기**를 조작에 쓰는 게 이 게임의 핵심이에요.\n\nIMU는 `angle_x`(roll), `angle_y`(pitch) 두 각도를 알려 줍니다. 중립 위치를 먼저 재고, 거기서 얼마나 벗어났는지를 −1~1 사이 값으로 바꿔 비행기 좌우 이동에 넣습니다.',
      hint: '비행기를 **무엇으로** 움직일지 말해 보세요. (모듈을 어떻게 잡을까요?)',
    },
    {
      label: '발사',
      synonyms: ['발사', '총알', '공격', '쏘', '버튼', 'attack', '미사일'],
      reply: '**발사**는 버튼 모듈로 받습니다.\n\n`buttons[0].pressed` 는 누르고 있는 동안 계속 `True` 예요. 그래서 이전 상태와 비교해 **눌리는 순간에만** 총알을 만듭니다. 안 그러면 한 번 눌러도 총알이 수십 발 나갑니다.',
      hint: '적을 어떻게 없앨지 말해 보세요. (버튼은 어디에 쓸까요?)',
    },
    {
      label: '충돌',
      synonyms: ['충돌', '부딪', '맞', '목숨', '점수', '라이프', '피격', '죽'],
      reply: '**충돌 판정**으로 점수와 목숨이 정해집니다.\n\n두 물체의 중심 거리를 `Math.hypot` 으로 재서 반지름보다 가까우면 맞은 것으로 봅니다. 총알↔적은 점수 +100, 적↔비행기는 목숨 −1이고, 맞은 뒤 1.5초는 무적으로 둬서 연속으로 죽지 않게 합니다.',
      hint: '적과 부딪히면 어떻게 되어야 할까요?',
    },
  ],
  unlockReply: '좋아요, **기울기 · 발사 · 충돌** 세 가지가 다 정해졌습니다.\n\n코드 보기 탭에서 실제 구현을 확인하고, 미리보기 탭에서 MODI를 연결한 채로 직접 조종해 보세요.',
  codeFiles: {
    'app.py — IMU·버튼 읽기': `# 하드웨어에서 값을 읽어 브라우저로 넘기는 부분 (app.py / Hardware.read)

def read(self, mock):
    self.connect()

    if self.bundle:                                  # 실기기가 붙었을 때
        pitch  = float(self.bundle.imus[0].angle_y)  # 앞뒤 기울기
        roll   = float(self.bundle.imus[0].angle_x)  # 좌우 기울기
        button = bool(self.bundle.buttons[0].pressed)
    else:                                            # mock 모드 — 화면 슬라이더 값
        pitch  = float(mock.get('pitch', 0))
        roll   = float(mock.get('roll', 0))
        button = bool(mock.get('button', False))

    # 센서가 이상한 값을 줄 때를 대비한 방어 코드
    if not math.isfinite(pitch) or not math.isfinite(roll):
        raise RuntimeError('IMU returned invalid data')

    pitch = max(-90, min(90, pitch))   # -90 ~ 90 도로 자르기
    roll  = max(-90, min(90, roll))

    if self.bundle:
        if self.bundle.motors:                       # 선택 모듈: 기울기만큼 회전
            self.bundle.motors[0].set_speed(round(roll * 60 / 90))
            self._watchdog()                         # 0.5초 안에 갱신 없으면 정지
        if self.bundle.leds:                         # 선택 모듈: 발사 중 색 변경
            self.bundle.leds[0].set_rgb(*((255, 70, 20) if button else (20, 90, 255)))

    return {'mode': self.mode,
            'controls': {'pitch': pitch, 'roll': roll},
            'attack': button}
`,
    'app.js — 비행기 조작': `// 센서 값을 비행기 움직임으로 바꾸는 부분 (app.js / apply)

function apply(data) {
  let x = 0, y = 0;

  if (cal.axis) {
    // 보정 때 정한 축의 값을 중립 기준으로 -1 ~ 1 로 환산
    const raw = data.controls[cal.axis];
    x = (raw - cal.base) * cal.sign / cal.range;

    const other = cal.axis === 'roll' ? 'pitch' : 'roll';
    y = -(data.controls[other] - cal.cross) / 90;
  }

  // 키보드도 같은 x, y 에 더한다 → 센서와 방향키가 함께 동작
  if (keys.has('arrowleft')  || keys.has('a')) x--;
  if (keys.has('arrowright') || keys.has('d')) x++;
  if (keys.has('arrowup')    || keys.has('w')) y--;
  if (keys.has('arrowdown')  || keys.has('s')) y++;

  // 기울기를 바로 반영하지 않고 16%씩 따라가게 해서 부드럽게 기울인다
  ship.tilt += (Math.max(-1, Math.min(1, x)) - ship.tilt) * .16;
  ship.x = Math.max(30, Math.min(W - 30, ship.x + x * 8));
  ship.y = Math.max(70, Math.min(H - 35, ship.y + y * 8));

  // 버튼이 "눌리는 순간"만 발사 — 누르고 있는 동안 계속 나가지 않게
  if (data.attack && !attackLast) fire();
  attackLast = data.attack;
}

function fire() {
  if (gameOver) return;
  bullets.push({ x: ship.x - 10, y: ship.y - 24 },
               { x: ship.x + 10, y: ship.y - 24 });
}
`,
    'app.js — 충돌 판정': `// 총알·적·비행기의 충돌을 확인하는 부분 (app.js / update)

for (const e of enemies) {
  // 총알과 적: 중심 거리가 적의 크기보다 가까우면 명중
  for (const b of bullets) {
    if (!e.dead && !b.dead && Math.hypot(e.x - b.x, e.y - b.y) < e.size) {
      e.dead = b.dead = true;
      score += 100;
      burst(e.x, e.y, '#ffb24b');      // 폭발 파티클
    }
  }

  // 적과 비행기: 무적 시간이 아닐 때만 판정
  if (!e.dead && invulnerable <= 0 && Math.hypot(e.x - ship.x, e.y - ship.y) < 32) {
    e.dead = true;
    lives--;
    invulnerable = 1.5;                // 1.5초 무적 → 연속 피격 방지
    burst(ship.x, ship.y, '#8cfff2', 28);
    if (lives <= 0) gameOver = true;
  }

  if (!e.dead && e.y > H + 35) e.dead = true;   // 화면 아래로 나간 적 정리
}

// 죽은 것들을 배열에서 걸러낸다
bullets   = bullets.filter(b => b.y > -20 && !b.dead);
enemies   = enemies.filter(e => !e.dead);
particles = particles.filter(p => p.life > 0);
`,
  },
  notes: [
    { title: '센서 값 보정(calibration)', what: 'IMU의 중립 위치를 먼저 4번 측정해 평균을 기준값으로 삼는다.', why: '사람마다 기기를 잡는 자세가 달라 같은 각도라도 센서 값이 다르게 나온다.', where: 'app.js 의 sample() — 중립 4회 → 오른쪽 기울임 8회' },
    { title: '눌리는 순간만 잡기(엣지 검출)', what: '이전 상태를 저장해 두고 "이전엔 안 눌렸고 지금은 눌린" 경우만 처리한다.', why: 'pressed 는 누르는 동안 계속 참이라 그대로 쓰면 한 번 누른 것이 수십 번으로 처리된다.', where: 'app.js 의 attackLast 변수' },
    { title: '거리로 충돌 판정하기', what: '두 점의 거리를 구해 정해 둔 반지름과 비교한다.', why: '모양이 복잡해도 원으로 단순화하면 계산이 가볍고 게임에서는 충분히 자연스럽다.', where: 'app.js 의 Math.hypot 비교' },
    { title: '무적 시간', what: '맞은 뒤 1.5초 동안은 충돌을 무시한다.', why: '적이 겹쳐 있으면 한 번의 실수로 목숨이 전부 사라져 버린다.', where: 'app.js 의 invulnerable' },
  ],
};

/* ─────────────────────── Tilt & Click 연결 점검 ─────────────────────── */

const TILT_CLICK_TEST: HybridCurriculum = {
  courseId: '6',
  // 별도 앱을 만들지 않고 자이로·버튼 입력이 모두 구현된 1942 실행 환경을 재사용한다.
  port: 8101,
  folder: '1942',
  runCommand: 'python3 app.py --mode real --port 8101',
  modules: [
    { key: 'imu', role: '필수', reason: '좌우·앞뒤 기울기 값이 실시간으로 전달되는지 확인한다', count: 1 },
    { key: 'button', role: '필수', reason: '누름과 뗌 상태가 정확히 전달되는지 확인한다', count: 1 },
  ],
  mockNote: '자이로와 버튼이 모두 연결되어야 real 모드로 점검할 수 있습니다. 실행 전 준비물 탭의 브라우저 연결을 해제해야 Python이 USB 포트를 사용할 수 있습니다.',
  examples: [
    '자이로와 버튼이 둘 다 연결됐는지 확인하고 싶어',
    '기울기 값이 움직이고 버튼을 한 번 누르면 한 번만 반응하는 테스트를 만들고 싶어',
  ],
  keywords: [
    {
      label: '모듈 연결',
      synonyms: ['연결', '인식', '모듈', '네트워크', 'usb', 'real', '장치'],
      reply: '**모듈 연결**부터 확인합니다.\n\n준비물 탭에서 네트워크 모듈을 USB로 연결했을 때 자이로와 버튼이 각각 목록에 나타나야 합니다. 둘 중 하나라도 빠지면 케이블과 모듈 결합 상태를 다시 확인합니다.',
      hint: '먼저 두 모듈이 컴퓨터에 무엇으로 표시되어야 하는지 말해 보세요.',
    },
    {
      label: '자이로 입력',
      synonyms: ['자이로', 'imu', '기울', '각도', 'roll', 'pitch', '좌우', '앞뒤'],
      reply: '**자이로 입력**은 연속값으로 확인합니다.\n\n모듈을 평평하게 두었을 때의 값을 기준으로 잡고 좌우·앞뒤로 천천히 기울입니다. 화면의 비행기가 방향에 맞게 부드럽게 움직이면 센서값이 HW에서 SW까지 전달된 것입니다.',
      hint: '자이로를 어느 방향으로 움직여 무엇이 변하는지 확인할까요?',
    },
    {
      label: '버튼 입력',
      synonyms: ['버튼', '누름', '눌러', '클릭', '발사', 'pressed', '뗌'],
      reply: '**버튼 입력**은 누름과 뗌을 함께 확인합니다.\n\n버튼을 짧게 한 번 눌렀을 때 총알이 한 번 발사되고, 길게 눌러도 연속 발사되지 않아야 합니다. 다시 뗐다 눌렀을 때 한 번 더 발사되면 상태 변화가 정상입니다.',
      hint: '버튼을 짧게 누를 때와 길게 누를 때 각각 어떻게 반응해야 할까요?',
    },
  ],
  unlockReply: '**모듈 연결 · 자이로 입력 · 버튼 입력** 점검 항목이 모두 정해졌습니다.\n\n미리보기에서 상태가 `MODI 연결 · real 모드`인지 확인한 뒤, 기울이기와 짧게 누르기·길게 누르기를 차례로 시험해 보세요.',
  codeFiles: {
    'app.py — 두 모듈 입력 읽기': `# 한 번의 상태 조회에서 자이로와 버튼을 함께 읽는다.

def read(self, mock):
    self.connect()

    if self.bundle:
        pitch = float(self.bundle.imus[0].angle_y)
        roll = float(self.bundle.imus[0].angle_x)
        button = bool(self.bundle.buttons[0].pressed)
    else:
        pitch = float(mock.get('pitch', 0))
        roll = float(mock.get('roll', 0))
        button = bool(mock.get('button', False))

    if not math.isfinite(pitch) or not math.isfinite(roll):
        raise RuntimeError('IMU returned invalid data')

    return {
        'mode': self.mode,
        'controls': {'pitch': pitch, 'roll': roll},
        'attack': button,
    }
`,
    'app.js — 입력 반응 확인': `// 자이로 연속값은 이동에, 버튼 상태 변화는 1회 발사에 사용한다.

function apply(data) {
  const roll = Math.max(-90, Math.min(90, data.controls.roll));
  const pitch = Math.max(-90, Math.min(90, data.controls.pitch));

  ship.x = Math.max(30, Math.min(W - 30, ship.x + roll / 12));
  ship.y = Math.max(70, Math.min(H - 35, ship.y - pitch / 12));

  // 안 눌림(false)에서 눌림(true)으로 바뀐 순간만 한 번 처리한다.
  if (data.attack && !attackLast) fire();
  attackLast = data.attack;
}
`,
    '점검표 — 통과 기준': `1. 준비물 탭의 연결 목록에 자이로와 버튼이 모두 보인다.
2. 미리보기에 "MODI 연결 · real 모드"가 표시된다.
3. 자이로를 좌우로 기울이면 비행기가 같은 방향으로 움직인다.
4. 자이로를 앞뒤로 기울이면 비행기가 위아래로 움직인다.
5. 버튼을 짧게 한 번 누르면 총알이 한 번 발사된다.
6. 버튼을 길게 눌러도 총알이 계속 생성되지 않는다.
7. 버튼을 뗐다가 다시 누르면 총알이 한 번 더 발사된다.
`,
  },
  notes: [
    { title: '연결 성공 기준', what: '자이로와 버튼이 모두 탐색되고 게임이 real 모드로 실행되어야 한다.', why: '브라우저 목록만으로는 실제 게임 프로세스가 모듈 값을 읽는지까지 알 수 없다.', where: '준비물 탭의 모듈 목록 + 미리보기 상단 상태 배지' },
    { title: '연속값 점검', what: '자이로를 천천히 네 방향으로 기울여 화면 이동의 방향과 연속성을 본다.', why: '모듈 인식에 성공해도 값이 멈추거나 축 방향이 뒤집힐 수 있다.', where: '미리보기의 비행기 이동' },
    { title: '버튼 엣지 검출', what: '누르는 순간에만 한 번 반응하고, 뗀 뒤 다시 눌러야 다음 반응이 생긴다.', why: '버튼의 pressed 값은 누르는 동안 계속 참이므로 그대로 처리하면 중복 입력이 발생한다.', where: 'app.js 의 attackLast 비교' },
  ],
};

/* ─────────────────────────── Tilt Match ─────────────────────────── */

const TILT_MATCH: HybridCurriculum = {
  courseId: '4',
  port: 8102,
  folder: 'tilt-match-standalone',
  runCommand: 'python app.py --mode real --port 8102',
  modules: [
    { key: 'imu', role: '필수', reason: '좌우로 기울여 방향을 고른다', count: 1 },
    { key: 'led', role: '필수', reason: '이번 라운드의 정답 색을 보여 준다', count: 1 },
  ],
  mockNote: 'IMU와 LED가 모두 있어야 real 모드로 들어갑니다. 하나라도 없으면 mock 모드로 떨어집니다.',
  examples: [
    'LED에 켜진 색과 같은 쪽으로 기울이면 점수가 오르는 게임',
    '반응 속도를 재는 색 맞추기 게임 만들고 싶어',
  ],
  keywords: [
    {
      label: 'LED 색',
      synonyms: ['led', '색', '컬러', 'color', '불빛', '파랑', '주황', '조명'],
      reply: '**LED 색**이 문제를 내는 역할입니다.\n\n라운드마다 파랑/주황 중 하나를 뽑아 `leds[0].set_rgb(...)` 로 실제 모듈에 띄우고, 같은 색을 화면 좌우 중 한쪽에 배치합니다. 학생은 화면이 아니라 **손에 있는 모듈**을 보고 판단하게 됩니다.',
      hint: '무엇을 보고 어느 쪽인지 판단할지 말해 보세요.',
    },
    {
      label: '기울기 방향',
      synonyms: ['기울', '방향', '왼쪽', '오른쪽', 'imu', '자이로', '좌우'],
      reply: '**기울기 방향**을 좌/우/중앙 셋으로 나눕니다.\n\n보정에서 정한 중립값과의 차이가 10도 미만이면 `center`, 그보다 크면 부호에 따라 `left` 또는 `right` 입니다. 10도라는 여유(데드존)가 없으면 손이 조금만 떨려도 판정이 튑니다.',
      hint: '어느 쪽으로 기울였는지를 어떻게 구분할까요?',
    },
    {
      label: '정답 판정',
      synonyms: ['정답', '판정', '점수', '맞', '틀', '채점', 'score', '라운드'],
      reply: '**정답 판정**은 한 번 기울일 때 딱 한 번만 일어나야 합니다.\n\n`latched` 플래그로 이미 채점했는지 기억해 두고, 중앙으로 돌아왔을 때 플래그를 풀면서 다음 라운드를 냅니다. 맞으면 +1, 틀리면 −1(0 아래로는 안 내려감)입니다.',
      hint: '맞았는지 틀렸는지를 언제 한 번만 세어야 할까요?',
    },
  ],
  unlockReply: '**LED 색 · 기울기 방향 · 정답 판정** 세 가지가 모두 정해졌어요.\n\n코드 보기에서 판정 로직을 확인하고, 미리보기에서 MODI LED를 보면서 직접 기울여 보세요.',
  codeFiles: {
    'app.py — 방향·정답 판정': `# 기울기를 방향으로 바꾸고 점수를 세는 부분 (app.py / Game.read)

def read(self, body):
    self.connect()

    if self.bundle:
        pitch = float(self.bundle.imus[0].angle_y)
        roll  = float(self.bundle.imus[0].angle_x)
    else:
        pitch = float(body.get('pitch', 0))
        roll  = float(body.get('roll', 0))

    # 보정 결과는 브라우저가 계산해서 매 요청에 실어 보낸다
    neutral     = float(body.get('neutral', 0))
    axis        = body.get('axis', 'roll')
    sign        = float(body.get('sign', 1))
    calibrating = bool(body.get('calibrating', False))

    raw   = pitch if axis == 'pitch' else roll
    delta = (raw - neutral) * (1 if sign > 0 else -1)

    # 10도 미만은 '중앙' — 데드존이 없으면 손떨림에 판정이 튄다
    direction = 'center' if abs(delta) < 10 else 'right' if delta > 0 else 'left'

    if self.bundle:
        self.bundle.leds[0].set_rgb(*COLORS[self.target])   # 정답 색을 LED로

    if calibrating:
        self.latched = False
        self.feedback = 'center'
        direction = 'center'
    elif direction == 'center':
        if self.latched:            # 중앙으로 돌아오면 잠금 해제 + 다음 라운드
            self.latched = False
            self.new_round()
        self.feedback = 'center'
    elif not self.latched:          # 기울인 순간 한 번만 채점
        self.latched = True
        correct = direction == self.target_side
        self.score = max(0, self.score + (1 if correct else -1))
        self.feedback = 'correct' if correct else 'wrong'
`,
    'app.py — 라운드 만들기': `# 라운드마다 색 배치와 정답을 새로 뽑는다 (app.py / Game.new_round)

COLORS = {'blue': (20, 105, 255), 'orange': (255, 95, 25)}

def new_round(self):
    self.round += 1

    # 좌우 색을 반반 확률로 뒤집는다 → 위치를 외울 수 없게
    self.left, self.right = (('blue', 'orange') if self.rng.random() < .5
                             else ('orange', 'blue'))

    # 정답 색을 뽑고, 그 색이 놓인 쪽을 정답 방향으로 기록
    self.target = self.rng.choice(('blue', 'orange'))
    self.target_side = 'left' if self.left == self.target else 'right'
`,
    'app.js — 화면에 반영': `// 서버가 준 상태를 화면에 그리는 부분 (app.js / paint)

function paint(data) {
  lastControls = data.controls;

  // real 모드면 mock 슬라이더를 잠근다 — 두 입력이 섞이면 원인 파악이 어렵다
  pitch.disabled = roll.disabled = data.mode === 'real';

  left.className   = \`light \${data.left}\`;      // 좌우 조명 색
  right.className  = \`light \${data.right}\`;
  target.className = \`target \${data.target_color}\`;  // 화면 속 MODI LED 표시
  score.textContent = String(data.score).padStart(2, '0');
  round.textContent = String(data.round).padStart(2, '0');

  // 기울기 바늘 위치 — 중립을 50%로 두고 좌우로 움직인다
  const raw   = cal.axis ? data.controls[cal.axis] : data.roll;
  const delta = (raw - (cal.neutral || 0)) * (cal.sign || 1);
  needle.parentElement.style.setProperty('--tilt',
    \`\${Math.max(4, Math.min(96, 50 + delta / 1.2))}%\`);

  if (data.feedback === 'correct') {
    (data.direction === 'left' ? left : right).classList.add('active');
    message.textContent = '정답!\\n중앙으로 돌아오세요';
  } else if (data.feedback === 'wrong') {
    (data.direction === 'left' ? left : right).classList.add('wrong');
    message.textContent = '다른 쪽이에요\\n중앙으로 돌아오세요';
  } else {
    message.textContent = 'LED 색과 같은 쪽으로\\n기울이세요';
  }
}
`,
  },
  notes: [
    { title: '데드존(dead zone)', what: '중립에서 10도 안쪽은 아무 방향도 아닌 것으로 본다.', why: '기준선을 딱 하나로 두면 손이 미세하게 떨릴 때 좌/우 판정이 계속 뒤집힌다.', where: "app.py 의 abs(delta) < 10" },
    { title: '한 번만 세기(latch)', what: '채점했는지를 플래그에 기억하고, 중앙으로 돌아올 때 푼다.', why: '서버는 0.1초마다 상태를 받는다. 잠금이 없으면 한 번 기울인 것이 수십 번 채점된다.', where: 'app.py 의 self.latched' },
    { title: '정답을 예측하지 못하게', what: '좌우 색 배치와 정답 색을 매 라운드 무작위로 뽑는다.', why: '한쪽만 고정하면 색을 안 보고 위치만 외워도 만점이 나온다.', where: 'app.py 의 new_round()' },
    { title: '역할을 나눈 통신', what: '보정은 브라우저가, 채점은 서버가 한다.', why: '화면 반응은 즉시 필요하고, 점수는 한 곳에서만 관리해야 어긋나지 않는다.', where: 'app.js 의 poll() 요청 본문' },
  ],
};

/* ─────────────────────────── Loop Studio ────────────────────────── */

const LOOP_STUDIO: HybridCurriculum = {
  courseId: '5',
  port: 8103,
  folder: 'music-studio-standalone',
  runCommand: 'python app.py --mode real --port 8103',
  modules: [
    { key: 'dial', role: '택1', reason: '연결하면 돌린 각도 0~100이 그대로 볼륨이 된다', count: 1, choiceGroup: 'volume-control' },
    { key: 'button', role: '필수', reason: '누르면 재생과 정지를 번갈아 한다', count: 1 },
    { key: 'speaker', role: '필수', reason: '만든 패턴을 실제 소리로 낸다', count: 1 },
    { key: 'joystick', role: '택1', reason: '다이얼 대신 위/아래 입력으로 볼륨을 5씩 조절한다', count: 1, choiceGroup: 'volume-control' },
  ],
  mockNote: '다이얼(또는 조이스틱) · 버튼 · 스피커가 모두 있어야 real 모드입니다. mock 모드에서는 컴퓨터 스피커로 소리가 납니다.',
  examples: [
    'MODI 스피커로 F5, A5, C6, E6 네 가지 음 높이를 연주하는 8칸 음악 시퀀서를 만들고 싶습니다. 각 행에서 원하는 스텝을 켜고 끌 수 있게 하고, 1번부터 8번 칸까지 순서대로 재생한 뒤 처음으로 돌아가 계속 반복되게 해주세요. 다이얼의 0~100 값을 볼륨으로 사용하되 다이얼이 없으면 조이스틱 위아래로 음량을 5씩 조절하고, 버튼을 누르는 순간마다 재생과 정지가 전환되게 해주세요. BPM 슬라이더로 템포를 바꾸고 현재 재생 칸과 소리의 주파수, 볼륨 상태를 화면에 분명하게 표시하고 싶습니다.',
  ],
  keywords: [
    {
      label: '음 높이',
      synonyms: ['음', '소리', '주파수', '높이', 'hz', '헤르츠', '음계', '멜로디', '스피커', '노트'],
      reply: '**음 높이**는 주파수(Hz)로 정합니다.\n\n이 프로젝트는 F5(698) · A5(880) · C6(1046) · E6(1318) 네 음만 씁니다. MODI+ 스피커가 문서상 F5부터 소리를 내기 때문이고, 서버도 80~2000Hz 범위를 벗어나면 거부합니다.',
      hint: '어떤 소리를 낼지 말해 보세요. (스피커는 무엇으로 음을 구분할까요?)',
    },
    {
      label: '볼륨',
      synonyms: ['볼륨', '소리크기', '크기', '다이얼', 'dial', '음량', '조절', '조이스틱'],
      reply: '**볼륨**은 다이얼의 회전값을 그대로 씁니다.\n\n`dials[0].turn` 이 0~100으로 들어오니 그게 바로 볼륨이에요. 이런 걸 절대값 입력이라고 합니다. 다이얼이 없으면 조이스틱 위/아래로 5씩 올리고 내리는데, 이건 상대값 입력이라 눌린 시간에 따라 결과가 달라집니다.',
      hint: '소리 크기를 무엇으로 조절할지 말해 보세요.',
    },
    {
      label: '반복',
      synonyms: ['반복', '루프', 'loop', '시퀀스', '패턴', '박자', '8칸', '스텝', 'bpm', '템포'],
      reply: '**반복**이 이 프로젝트의 이름이 된 이유예요.\n\n8칸을 순서대로 돌면서 켜진 칸의 음을 냅니다. 다음 칸으로 넘어가는 간격은 `60000 / BPM / 2` 밀리초로, 템포를 올리면 그만큼 짧아집니다. 끝에 닿으면 `% steps` 로 처음으로 되돌아갑니다.',
      hint: '패턴이 한 번만 나올지, 계속 돌지 정해 보세요.',
    },
  ],
  unlockReply: '**음 높이 · 볼륨 · 반복** 세 가지가 정해졌습니다.\n\n코드 보기에서 시퀀서가 도는 방식을 확인하고, 미리보기에서 다이얼과 버튼으로 직접 연주해 보세요.',
  codeFiles: {
    'app.js — 시퀀서 반복': `// 8칸을 순서대로 돌면서 소리를 내는 부분 (app.js)

// MODI+ 스피커가 문서상 낼 수 있는 음역이 F5(698Hz)부터라 이 네 음만 쓴다
const NOTES = [['E6', 1318, '#ff5478'],
               ['C6', 1046, '#ffab45'],
               ['A5',  880, '#55d8ff'],
               ['F5',  698, '#a783ff']];
const steps = 8;

function tick() {
  // 이전 칸의 강조 표시를 지운다
  document.querySelectorAll('.step.current')
          .forEach(el => el.classList.remove('current'));

  current = (current + 1) % steps;      // 끝에 닿으면 0으로 되돌아간다 = 반복

  document.querySelectorAll(\`.step[data-col="\${current}"]\`)
          .forEach(el => el.classList.add('current'));

  // 이 칸에 켜진 음을 모두 소리 낸다
  let activeCount = 0;
  pattern.forEach((row, index) => {
    if (row[current]) { activeCount++; sound(NOTES[index][1]); }
  });

  animateLevels(activeCount);

  // 한 칸의 길이 = 60000 / BPM / 2 밀리초 (8분음표 기준)
  if (playing) timer = setTimeout(tick, 60000 / +tempo.value / 2);
}
`,
    'app.py — 다이얼·버튼 읽기': `# 다이얼로 볼륨, 버튼으로 재생을 조절하는 부분 (app.py / Studio.state)

if self.bundle.dials:
    # 다이얼: 돌린 각도(0~100)가 그대로 볼륨 — 절대값 입력
    self.volume = max(0, min(100, int(self.bundle.dials[0].turn)))
else:
    # 조이스틱: 위/아래로 5씩 조절 — 상대값 입력
    direction = self.bundle.joysticks[0].direction
    now = time.monotonic()
    if direction in ('up', 'down') and now - self.last_joystick_adjust >= .15:
        self.volume = max(0, min(100, self.volume + (5 if direction == 'up' else -5)))
        self.last_joystick_adjust = now   # 0.15초 간격 → 너무 빠르게 변하는 것 방지

# 버튼이 눌리는 순간에만 재생/정지를 뒤집는다
pressed = bool(self.bundle.buttons[0].pressed)
if pressed and not self.last_button:
    self.playing = not self.playing
self.last_button = pressed
`,
    'app.py — 스피커로 소리내기': `# 주파수를 받아 실제 스피커를 울리는 부분 (app.py / Studio.note)

def note(self, value, duration=.28, volume_override=None):
    frequency = float(value)

    # 스피커가 낼 수 있는 범위를 벗어난 값은 아예 거부한다
    if not math.isfinite(frequency) or not 80 <= frequency <= 2000:
        raise ValueError('frequency must be 80..2000 Hz')

    duration = float(duration)
    if not math.isfinite(duration) or not .08 <= duration <= 2:
        raise ValueError('duration must be 0.08..2 seconds')

    output_volume = self.volume if volume_override is None else int(volume_override)

    # 세대 번호 — 새 음이 나오면 이전 음의 정지 예약을 무효로 만든다
    self.note_generation += 1
    generation = self.note_generation
    self.last_note = round(frequency)
    self.note_count += 1

    if self.bundle:
        self.bundle.speakers[0].set_tune(round(frequency), output_volume)

        # 스피커는 스스로 멈추지 않으므로 duration 뒤에 끌 예약을 걸어 둔다
        if self.note_timer:
            self.note_timer.cancel()
        self.note_timer = threading.Timer(duration, self.silence, args=(generation,))
        self.note_timer.daemon = True
        self.note_timer.start()
`,
  },
  notes: [
    { title: '음 높이 = 주파수', what: '도·레·미 대신 698Hz, 880Hz 같은 숫자로 음을 지정한다.', why: '스피커는 이름이 아니라 진동 횟수로 소리를 만든다. 숫자가 커지면 높은 음이 된다.', where: 'app.js 의 NOTES 배열' },
    { title: '절대값 입력과 상대값 입력', what: '다이얼은 위치가 곧 값이고, 조이스틱은 누른 만큼 더하거나 뺀다.', why: '다이얼은 손을 떼도 값이 유지되지만, 조이스틱은 얼마나 오래 눌렀는지에 따라 결과가 달라진다.', where: 'app.py 의 dials / joysticks 분기' },
    { title: '나머지 연산으로 만드는 반복', what: '칸 번호를 1씩 올리고 전체 개수로 나눈 나머지를 쓴다.', why: '따로 조건문을 두지 않아도 마지막 칸 다음이 자동으로 첫 칸이 된다.', where: 'app.js 의 (current + 1) % steps' },
    { title: '켜 두면 계속 울린다', what: '스피커는 끄는 명령을 보내야 멈추므로 정해진 시간 뒤에 끌 예약을 걸어 둔다.', why: '예약을 안 걸면 한 음이 계속 울리고, 새 음이 겹쳐 소음이 된다.', where: 'app.py 의 threading.Timer + silence()' },
  ],
};

const FUNCTION_SHAPE: HybridCurriculum = {
  courseId: '7',
  port: 8501,
  folder: 'function-shape-standalone',
  runCommand: 'python app.py --mode real --port 8501',
  modules: [
    { key: 'dial', role: '필수', reason: '선택한 함수 계수를 허용 범위 안에서 연속적으로 조절한다', count: 1 },
    { key: 'joystick', role: '필수', reason: '좌우로 계수를 선택하고 위아래로 0.1씩 미세 조정한다', count: 1 },
    { key: 'button', role: '필수', reason: '현재 그래프를 제출해 목표 그래프와의 정확도를 계산한다', count: 1 },
    { key: 'led', role: '선택', reason: '대기 중에는 파랑, 성공은 초록, 재도전은 주황으로 결과를 알려 준다', count: 1 },
  ],
  mockNote: '실기기 모드에는 다이얼·조이스틱·버튼이 모두 필요합니다. LED는 없어도 학습할 수 있으며, mock 모드에서는 화면 컨트롤로 모든 조작을 시험할 수 있습니다.',
  examples: [
    '일차함수 y=ax+b, 절댓값함수 y=a|x-h|+k, 이차함수 y=a(x-h)²+k의 함수 계수를 직접 조절해 목표 그래프의 개형을 맞추는 게임을 만들고 싶습니다. 조이스틱 좌우로 수정할 계수 a, b, h, k를 선택하고 위아래로 0.1씩 미세 조정하며, 다이얼로 선택된 계수의 전체 허용 범위를 빠르게 이동하게 해주세요. 버튼을 누르면 x=-5부터 x=5까지 81개 지점의 평균 오차로 정확도를 계산하고, 90% 이상이면 통과하여 다음 함수로 넘어가며 LED는 성공과 재도전 상태를 서로 다른 색으로 표시하게 해주세요.',
  ],
  keywords: [
    {
      label: '함수 계수',
      synonyms: ['함수', '계수', '기울기', '절편', '일차함수', '절댓값', '이차함수', '그래프', 'a', 'h', 'k'],
      reply: '**함수 계수**를 움직이며 그래프의 변화를 관찰합니다.\n\n일차함수 `y=ax+b`, 절댓값함수 `y=a|x-h|+k`, 이차함수 `y=a(x-h)²+k`가 차례로 출제됩니다. `a`는 방향과 폭, `h`와 `k`는 좌우·상하 위치를 바꿉니다.',
      hint: '어떤 함수의 어떤 숫자를 바꾸어 그래프 모양을 맞출지 설명해 보세요.',
    },
    {
      label: '모듈 조작',
      synonyms: ['다이얼', 'dial', '조이스틱', 'joystick', '좌우', '위아래', '선택', '미세', '조절'],
      reply: '**모듈 조작**은 역할을 나눕니다.\n\n다이얼은 선택된 계수의 전체 범위를 빠르게 이동합니다. 조이스틱 좌우는 조절할 계수를 고르고, 위아래는 0.1 단위로 미세 조정합니다. 길게 누르면 일정 간격으로 반복되어 큰 변화와 정밀 조정을 모두 할 수 있습니다.',
      hint: '계수를 고르는 입력과 값을 바꾸는 입력을 각각 어떤 모듈에 맡길까요?',
    },
    {
      label: '정확도 판정',
      synonyms: ['정확도', '판정', '제출', '버튼', 'button', '오차', '90', '점수', '통과', '채점'],
      reply: '**정확도 판정**은 화면의 한 점만 비교하지 않습니다.\n\n`x=-5`부터 `x=5`까지 81개 지점에서 목표 함수와 현재 함수의 차이를 구하고 평균 오차를 점수로 바꿉니다. 버튼으로 제출했을 때 정확도 90% 이상이면 통과합니다.',
      hint: '완성한 그래프를 어떻게 제출하고 어떤 기준으로 성공시킬지 말해 보세요.',
    },
  ],
  unlockReply: '**함수 계수 · 모듈 조작 · 정확도 판정**이 모두 정해졌습니다.\n\n코드 보기에서 계수와 그래프의 관계를 확인하고, 미리보기에서 목표 개형을 90% 이상으로 맞춰 보세요.',
  codeFiles: {
    'app.py — 함수와 정확도': `def value(family, params, x):
    if family == 'linear':
        return params['a'] * x + params['b']
    if family == 'absolute':
        return params['a'] * abs(x - params['h']) + params['k']
    return params['a'] * (x - params['h']) ** 2 + params['k']

def grade(self):
    errors = []
    for index in range(81):
        x = -5 + index / 8
        target = self.value(self.family, self.target, x)
        current = self.value(self.family, self.params, x)
        errors.append(min(16, abs(target - current)))
    mean_error = sum(errors) / len(errors)
    return max(0, min(100, round(100 * (1 - mean_error / 8))))
`,
    'app.py — 다이얼·조이스틱·버튼': `pressed = bool(self.bundle.buttons[0].pressed)
submitted = pressed and not self.last_button
self.last_button = pressed

if action == 'left':
    self.selected = (self.selected - 1) % len(names)
elif action == 'right':
    self.selected = (self.selected + 1) % len(names)
elif action in ('up', 'down'):
    amount = .1 if action == 'up' else -.1
    self.nudges[selected_name] = round(self.nudges[selected_name] + amount, 1)

dial = max(0, min(100, float(self.bundle.dials[0].turn)))
self.params[selected_name] = round(
    max(low, min(high, low + dial / 100 * (high - low) + self.nudges[selected_name])), 1
)
`,
    '점검표.md': `1. 다이얼·조이스틱·버튼이 필수 모듈로 표시된다.
2. 조이스틱 좌우로 선택 계수가 바뀐다.
3. 조이스틱 위아래로 선택 계수가 0.1씩 변한다.
4. 다이얼을 돌리면 선택 계수가 허용 범위 안에서 연속적으로 변한다.
5. 버튼을 한 번 눌렀을 때 한 번만 채점된다.
6. 정확도 90% 이상에서 다음 함수로 넘어간다.
7. LED가 있다면 결과에 맞는 색으로 바뀐다.
`,
  },
  notes: [
    { title: '계수와 그래프 변환', what: '`a`, `b`, `h`, `k`를 직접 바꾸며 방향·폭·위치의 변화를 관찰한다.', why: '공식 암기보다 숫자 변화와 그래프 이동을 연결해 이해할 수 있다.', where: 'app.py의 FAMILIES와 value()' },
    { title: '연속값과 방향 입력의 분업', what: '다이얼은 큰 범위를 연속 조절하고 조이스틱은 선택과 미세 조정을 맡는다.', why: '서로 다른 입력 장치의 장점을 결합하면 빠르면서도 정확하게 값을 맞출 수 있다.', where: 'app.py의 dial 변환과 joystick action 처리' },
    { title: '구간 전체로 채점하기', what: '81개 x좌표에서 두 그래프의 평균 오차를 측정한다.', why: '한두 점만 우연히 겹치는 그래프를 정답으로 처리하지 않기 위해서다.', where: 'app.py의 grade()' },
    { title: '길게 누르기 반복', what: '조이스틱을 0.35초 이상 유지하면 방향에 따라 정해진 간격으로 입력을 반복한다.', why: '매번 떼었다 누르지 않고도 여러 단계 이동하면서 지나치게 빠른 중복 입력을 막는다.', where: 'app.py의 direction_since와 last_repeat' },
  ],
};

const TIMES_TABLE_QUEST: HybridCurriculum = {
  courseId: '8',
  port: 8502,
  folder: 'times-table-quest-standalone',
  runCommand: 'python app.py --mode real --port 8502',
  modules: [
    { key: 'joystick', role: '필수', reason: '좌우로 답을 1씩, 위아래로 답을 10씩 조절한다', count: 1 },
    { key: 'button', role: '필수', reason: '현재 답을 제출하고 정답 여부를 확인한다', count: 1 },
    { key: 'dial', role: '선택', reason: '연결하면 답을 0~100 범위에서 빠르게 이동한다', count: 1 },
    { key: 'led', role: '선택', reason: '대기·정답·오답 상태를 파랑·초록·빨강으로 보여 준다', count: 1 },
    { key: 'speaker', role: '선택', reason: '정답은 1046Hz, 오답은 698Hz 소리로 알려 준다', count: 1 },
  ],
  mockNote: '실기기 모드에는 조이스틱과 버튼이 필요합니다. 다이얼·LED·스피커는 선택 모듈이며 없어도 10문제를 모두 풀 수 있습니다.',
  examples: [
    '난이도를 입문 2~5단, 표준 2~9단, 도전 6~12단 중에서 선택하고 총 10문제를 푸는 구구단 퀘스트를 만들고 싶습니다. 조이스틱 좌우로 답을 1씩, 위아래로 10씩 바꾸고 길게 누르면 일정한 간격으로 반복 입력되게 하며, 선택 모듈인 다이얼이 연결되면 0~100 범위를 빠르게 이동하게 해주세요. 버튼을 누르는 순간 현재 답을 한 번만 제출하고, 정답이면 기본 100점과 연속 정답 보너스를 더하고 오답이면 10점을 줄여주세요. LED는 정답과 오답 색을 구분하고 스피커는 1046Hz와 698Hz 피드백음을 내며 마지막에는 점수와 정답 수를 보여주고 싶습니다.',
  ],
  keywords: [
    {
      label: '답 입력',
      synonyms: ['답', '정답', '숫자', '조이스틱', 'joystick', '좌우', '위아래', '다이얼', 'dial', '입력'],
      reply: '**답 입력**의 기본 장치는 조이스틱입니다.\n\n좌우는 ±1, 위아래는 ±10으로 움직여 0부터 144까지 모든 답을 만들 수 있습니다. 선택 다이얼이 있으면 0~100 범위를 빠르게 이동하고 조이스틱으로 나머지를 미세 조정합니다.',
      hint: '곱셈의 답을 어떤 모듈로 몇 단위씩 바꿀지 설명해 보세요.',
    },
    {
      label: '제출과 피드백',
      synonyms: ['제출', '버튼', 'button', '채점', '피드백', 'led', '스피커', '소리', '색', '정답', '오답'],
      reply: '**제출과 피드백**은 버튼의 상태 변화로 처리합니다.\n\n버튼을 누르는 순간 한 번만 채점합니다. LED가 있으면 정답은 초록, 오답은 빨강으로 바뀌고, 스피커가 있으면 각각 1046Hz와 698Hz로 서로 다른 소리를 냅니다.',
      hint: '만든 답을 어떻게 제출하고 정답과 오답을 어떻게 알려 줄까요?',
    },
    {
      label: '난이도와 점수',
      synonyms: ['난이도', '입문', '표준', '도전', '2단', '9단', '12단', '점수', '연속', '보너스', '10문제'],
      reply: '**난이도와 점수**를 학습 수준에 맞춥니다.\n\n입문은 2~5단, 표준은 2~9단, 도전은 6~12단입니다. 한 게임은 10문제이고 정답은 기본 100점에 연속 정답 보너스를 더하며, 오답은 10점을 차감하고 연속 기록을 초기화합니다.',
      hint: '몇 단을 몇 문제 풀고 연속 정답을 점수에 어떻게 반영할까요?',
    },
  ],
  unlockReply: '**답 입력 · 제출과 피드백 · 난이도와 점수**가 모두 정해졌습니다.\n\n프로젝트를 실행해 조이스틱과 버튼만으로 10문제를 풀고, 선택 모듈을 연결했을 때 피드백이 추가되는지도 확인해 보세요.',
  codeFiles: {
    'app.py — 조이스틱 답 입력': `if direction == 'origin':
    self.direction_since = 0
elif direction != self.last_direction:
    action = direction
    self.direction_since = now
    self.last_repeat = now
else:
    interval = .10 if direction in ('left', 'right') else .18
    if now - self.direction_since >= .35 and now - self.last_repeat >= interval:
        action = direction
        self.last_repeat = now

delta = {'left': -1, 'right': 1, 'up': 10, 'down': -10}.get(action, 0)
self.offset += delta
self.answer = max(0, min(144, base + self.offset))
`,
    'app.py — 채점과 선택 출력': `submitted = button and not self.last_button
self.last_button = button

if submitted:
    expected = self.left * self.right
    if self.answer == expected:
        self.correct += 1
        self.streak += 1
        self.score += 100 + min(100, self.streak * 10)
        if self.bundle.leds:
            self.bundle.leds[0].set_rgb(65, 255, 100)
        self.tone(1046)
    else:
        self.streak = 0
        self.score = max(0, self.score - 10)
        if self.bundle.leds:
            self.bundle.leds[0].set_rgb(255, 60, 35)
        self.tone(698)
`,
    '점검표.md': `1. 조이스틱과 버튼만 연결해도 real 모드로 시작된다.
2. 좌우 입력은 답을 1씩, 위아래 입력은 10씩 바꾼다.
3. 버튼을 길게 눌러도 한 번만 제출된다.
4. 입문·표준·도전 난이도의 출제 범위가 다르다.
5. 10문제 뒤 최종 점수와 정답 수가 표시된다.
6. 다이얼·LED·스피커가 없어도 게임을 끝낼 수 있다.
7. 선택 모듈을 연결하면 각 모듈의 추가 기능이 동작한다.
`,
  },
  notes: [
    { title: '자리값을 이용한 입력', what: '좌우는 1의 자리, 위아래는 10의 자리처럼 답을 바꾼다.', why: '버튼 수가 적은 조이스틱으로도 0~144 범위를 빠르게 탐색할 수 있다.', where: 'app.py의 delta 매핑' },
    { title: '필수 기능과 선택 피드백', what: '조이스틱과 버튼만으로 게임을 완주하고 다른 모듈은 피드백을 풍부하게 한다.', why: '선택 모듈이 없다고 핵심 학습 활동이 막히지 않게 하기 위해서다.', where: 'app.py의 has_dial, leds, speakers 분기' },
    { title: '버튼 엣지 검출', what: '이전 버튼 상태와 비교해 눌리는 순간에만 제출한다.', why: '100ms마다 상태를 읽어도 한 번 누른 답이 여러 번 채점되지 않는다.', where: 'app.py의 last_button' },
    { title: '수준별 출제 범위', what: '입문·표준·도전마다 곱하는 수의 범위를 달리한다.', why: '같은 조작법을 유지하면서 학습자의 숙련도에 맞춰 난이도를 조절할 수 있다.', where: 'app.py의 ranges' },
  ],
};

const CLASSROOM_GARDEN: HybridCurriculum = {
  courseId: '13',
  port: 8701,
  folder: 'classroom-garden-standalone',
  runCommand: 'python app.py --mode real --port 8701',
  modules: [
    { key: 'network', role: '필수', reason: 'USB로 컴퓨터와 교실의 MODI PLUS 모듈을 연결한다', count: 1 },
    { key: 'env', role: '필수', reason: '교실의 온도·습도·밝기를 측정해 생장 환경을 계산한다', count: 1 },
    { key: 'dial', role: '필수', reason: '한 번에 줄 물의 양을 5~27ml 범위로 정한다', count: 1 },
    { key: 'button', role: '필수', reason: '누르는 순간 다이얼로 정한 양만큼 식물에 물을 준다', count: 1 },
    { key: 'tof', role: '필수', reason: '12cm 안에 손이 들어오면 식물을 쓰다듬어 행복도를 높인다', count: 1 },
    { key: 'led', role: '필수', reason: '건강·갈증·어두움·과습 등 식물 상태를 색으로 표시한다', count: 1 },
  ],
  mockNote: '실기기 모드에는 ENV·다이얼·버튼·ToF·LED가 모두 필요합니다. mock 모드에서는 화면 슬라이더와 버튼으로 교실 환경과 돌봄을 시험할 수 있습니다.',
  examples: [
    `실제 교실 환경을 관찰하고 돌봄 행동을 계획해 씨앗부터 꽃까지 키우는 Classroom Garden 과학·정보 융합 프로젝트를 만들고 싶습니다. 수업은 학생들이 센서값을 단순히 읽는 데서 끝나지 않고 온도, 습도, 밝기, 토양 수분과 행복도가 식물 성장에 어떤 영향을 주는지 가설을 세우고 비교할 수 있어야 합니다. 화면에는 화분과 식물, 현재 성장 단계, 성장률, 행복도, 점수, 남은 시간, 교실 환경 품질을 한눈에 볼 수 있는 대시보드를 구성해주세요.

MODI PLUS Network 모듈로 브라우저와 연결하고 ENV 센서에서 온도, 습도, 조도 값을 계속 읽어주세요. 적정 온도는 20~26°C, 적정 습도는 40~70%, 적정 밝기는 40~82%로 설정하되 범위 안과 밖을 단순한 참·거짓으로 나누지 말고 적정 범위에서 멀어질수록 품질 점수가 서서히 낮아지게 해주세요. 세 센서 품질의 평균을 환경 품질로 계산하고 각 값은 숫자, 색상 막대, 최근 변화 그래프로 동시에 표시해주세요. 센서 응답이 잠시 끊기면 마지막 값을 무한히 사용하지 말고 연결 상태와 재시도 안내를 보여주세요.

물주기는 다이얼과 버튼을 함께 사용해주세요. 다이얼의 0~100 값을 한 번에 줄 물의 양 5~27ml로 변환하고 화면에 예상 급수량을 미리 표시해주세요. 버튼이 눌려 있는 동안 계속 물을 주지 않도록 이전 버튼 상태와 비교해 눌리는 순간에만 한 번 처리해주세요. 토양 수분은 시간에 따라 조금씩 줄고 밝기가 강하면 더 빠르게 마르게 해주세요. 적정 토양 수분은 35~78%로 정하고 이미 78%를 넘은 상태에서 다시 물을 주면 과습으로 행복도와 점수가 내려가야 하며, 너무 건조한 상태에서도 성장 속도와 행복도가 낮아지게 해주세요.

ToF 거리 센서는 식물을 쓰다듬는 행동으로 사용해주세요. 손이 12cm 안으로 들어오는 순간 행복도와 점수를 올리고 물결이나 반짝임 같은 짧은 돌봄 효과를 보여주세요. 손이 경계에서 흔들릴 때 여러 번 입력되지 않도록 18cm 밖으로 나간 뒤에만 다음 쓰다듬기를 받을 수 있게 히스테리시스를 적용해주세요. 화면에는 현재 거리와 누적 물주기 횟수, 쓰다듬기 횟수를 표시하고 너무 자주 같은 행동만 반복해 점수를 얻지 못하도록 합리적인 제한을 두어주세요.

식물은 씨앗, 새싹, 튼튼한 잎, 꽃봉오리, 활짝 핀 꽃의 다섯 단계로 성장하게 해주세요. 환경 품질 70%, 토양 품질 30%를 조합한 돌봄 품질을 사용하고 환경, 토양, 행복도가 모두 최소 조건을 충족할 때만 성장률이 증가하게 해주세요. 단계가 바뀔 때는 독립된 투명 PNG 식물 이미지가 자연스럽게 전환되고 도우미 캐릭터, 축하 효과와 상태 메시지가 함께 바뀌어야 합니다. 건강한 상태는 초록, 갈증은 파랑, 어두움·추위·건조는 노랑, 과습·더위는 빨강으로 실제 LED와 화면 상태를 동일하게 표시해주세요.

35분 수업 모드는 한 차시 동안 환경을 유지하면 꽃을 피울 수 있는 속도로 진행하고, 교사가 기능을 빠르게 검증할 수 있도록 같은 규칙을 사용하는 4분 체험 모드도 제공해주세요. 새 씨앗 버튼으로 성장률, 토양, 행복도, 점수, 행동 횟수와 그래프를 모두 초기화하고 모드 전환 시에도 이전 타이머가 남지 않게 해주세요. 실물 모듈이 없으면 온도, 습도, 밝기, 다이얼, ToF 거리를 조절하는 mock 패널과 물주기 버튼으로 모든 규칙을 동일하게 시험할 수 있어야 합니다.

완료 기준은 실물 또는 mock 입력에서 센서 그래프가 갱신되고, 급수량 계산과 버튼 엣지 검출, ToF 거리 재무장, 과습·갈증 상태, LED 색상, 다섯 성장 단계, 두 가지 시간 모드와 초기화가 모두 일관되게 동작하는 것입니다. 학생들이 한 조건만 좋게 만드는 경우와 모든 조건을 균형 있게 유지하는 경우의 성장 차이를 관찰하고 이유를 설명할 수 있도록 결과 화면과 학습 노트까지 연결해주세요.`,
  ],
  keywords: [
    {
      label: '교실 환경',
      synonyms: ['교실', '환경', 'env', '온도', '습도', '밝기', '빛', '조도', '측정', '센서'],
      reply: '**교실 환경**은 ENV 모듈이 측정합니다.\n\n식물이 잘 자라는 범위는 온도 20~26°C, 습도 40~70%, 밝기 40~82%입니다. 세 값이 적정 범위에 얼마나 가까운지 각각 계산한 뒤 평균을 내 환경 품질로 사용합니다.',
      hint: '식물이 자라는 데 필요한 온도·습도·빛을 어떤 센서로 관찰할지 말해 보세요.',
    },
    {
      label: '물주기와 돌봄',
      synonyms: ['물', '물주기', '다이얼', 'dial', '버튼', 'button', 'tof', '거리', '손', '쓰다듬', '돌봄'],
      reply: '**물주기와 돌봄**에는 세 모듈을 사용합니다.\n\n다이얼은 물의 양을 5~27ml로 정하고 버튼을 누르는 순간 물을 줍니다. ToF 센서 12cm 안으로 손을 가져오면 쓰다듬기로 인식해 행복도를 높이며, 손을 18cm 밖으로 뺐다가 다시 가까이 해야 다음 돌봄으로 계산됩니다.',
      hint: '물의 양, 물 주는 순간, 식물 쓰다듬기를 각각 어떻게 입력할지 설명해 보세요.',
    },
    {
      label: '균형과 성장',
      synonyms: ['균형', '성장', '생장', '씨앗', '새싹', '잎', '봉오리', '꽃', '토양', '수분', '과습', '갈증', '행복', 'led'],
      reply: '**균형과 성장**이 프로젝트의 핵심입니다.\n\n토양 수분은 35~78%가 적정하며 너무 마르거나 젖으면 성장과 행복도가 낮아집니다. 환경·토양·행복 조건이 함께 맞아야 씨앗→새싹→잎→봉오리→꽃의 5단계로 성장하고, LED가 현재 건강 상태를 색으로 알려 줍니다.',
      hint: '한 가지 조건만 좋은 것이 아니라 어떤 값들이 균형을 이뤄야 꽃이 필지 말해 보세요.',
    },
  ],
  unlockReply: '**교실 환경 · 물주기와 돌봄 · 균형과 성장**이 모두 정해졌습니다.\n\n코드에서 센서값을 적정 범위와 비교하는 방법을 확인하고, 미리보기에서 35분 수업 모드 또는 4분 체험 모드로 식물을 키워 보세요.',
  codeFiles: {
    'app.py — 환경 품질 계산': `def band(value, low, high, margin):
    if low <= value <= high:
        return 1.0
    distance = low - value if value < low else value - high
    return max(0.0, 1 - distance / margin)

temp_quality = band(temperature, 20, 26, 10)
humidity_quality = band(humidity, 40, 70, 30)
light_quality = band(light, 40, 82, 35)
environment_quality = (temp_quality + humidity_quality + light_quality) / 3
`,
    'app.py — 물주기와 쓰다듬기': `water_amount = round(5 + dial * .22, 1)
pressed = button and not self.last_button
self.last_button = button

if pressed:
    before = self.soil
    self.soil = min(100, self.soil + water_amount)
    self.waters += 1
    if before > 78:
        self.happiness = max(0, self.happiness - 7)

near = distance < 12
if near and not self.last_near:
    self.pets += 1
    self.happiness = min(100, self.happiness + 8)
self.last_near = distance < 18
`,
    'app.py — 성장과 LED 상태': `soil_quality = band(self.soil, 35, 78, 28)
care_quality = environment_quality * .7 + soil_quality * .3

duration = 35 * 60 if self.pace == 'lesson' else 4 * 60
rate = 100 / duration
if environment_quality >= .55 and soil_quality >= .45 and self.happiness >= 35:
    self.growth = min(100, self.growth + dt * rate * (.55 + care_quality * .65))

rgb = (60, 255, 105) if status in ('happy', 'growing') else \
      (40, 120, 255) if status == 'thirsty' else \
      (255, 190, 35) if status in ('dark', 'cold', 'dry_air') else (255, 70, 35)
self.bundle.leds[0].set_rgb(*rgb)
`,
    '점검표.md': `1. 네트워크·ENV·다이얼·버튼·ToF·LED가 준비물에 모두 표시된다.
2. ENV의 온도·습도·밝기 값이 화면과 환경 품질에 반영된다.
3. 다이얼 값에 따라 물의 양이 5~27ml로 달라진다.
4. 버튼을 길게 눌러도 물주기는 한 번만 실행된다.
5. ToF 12cm 안에서 쓰다듬기가 한 번 발생하고 18cm 밖에서 재무장된다.
6. 과습·갈증·어두움·추위·더위·건조 상태에 맞게 LED가 변한다.
7. 식물이 씨앗부터 꽃까지 5단계로 성장한다.
8. 35분 수업 모드와 4분 체험 모드가 각각 동작한다.
`,
  },
  notes: [
    { title: '범위로 판단하는 센서값', what: '온도·습도·밝기를 하나의 정답값이 아니라 적정 구간과의 거리로 평가한다.', why: '실제 생장 환경은 정확한 한 값보다 허용 가능한 범위로 설명하는 것이 자연스럽다.', where: 'app.py의 band()' },
    { title: '돌봄에도 과유불급', what: '물을 줄수록 무조건 좋아지는 대신 과습이면 행복도와 점수가 내려간다.', why: '여러 환경 조건의 균형을 관찰하게 하기 위해서다.', where: 'app.py의 pressed 물주기 분기' },
    { title: '거리 입력의 히스테리시스', what: '12cm에서 입력하고 18cm 밖으로 나갔을 때 다음 입력을 준비한다.', why: '손이 경계에서 흔들릴 때 쓰다듬기가 여러 번 발생하는 것을 막는다.', where: 'app.py의 near와 last_near' },
    { title: '수업 시간과 검증 시간', what: '같은 성장 규칙에 35분과 4분의 서로 다른 시간 배율을 제공한다.', why: '실제 수업과 짧은 기능 점검을 모두 지원하기 위해서다.', where: 'app.py의 pace와 duration' },
  ],
};

const EMBER_AND_TIDE: HybridCurriculum = {
  courseId: '12',
  port: 5174,
  folder: 'EMBER_AND_TIDE',
  runCommand: './game_run main.py',
  modules: [
    { key: 'network', role: '필수', reason: 'USB로 컴퓨터와 MODI PLUS 모듈의 통신을 연결한다', count: 1 },
    { key: 'imu', role: '필수', reason: '현재 캐릭터를 좌우로 이동하고 장착 방향을 보정한다', count: 1 },
    { key: 'joystick', role: '필수', reason: '룬·거울·프리즘 퍼즐의 방향 순서를 입력한다', count: 1 },
    { key: 'env', role: '필수', reason: '온도로 얼음을 녹이고 조도를 낮춰 빛의 문을 잠재운다', count: 1 },
    { key: 'button', role: '필수', reason: '한 번 누르면 점프하고 더블클릭하면 EMBER와 TIDE를 전환한다', count: 1 },
    { key: 'led', role: '필수', reason: '활성 원소·퍼즐 성공·위험 상태를 색으로 알려 준다', count: 1 },
    { key: 'speaker', role: '필수', reason: '점프·정답·스테이지 완료를 효과음과 멜로디로 알려 준다', count: 1 },
  ],
  mockNote: '웹 미리보기는 키보드와 화면 시뮬레이터만으로 세 스테이지를 플레이할 수 있습니다. 실물 MODI를 사용하려면 ZIP을 풀고 통합 실행기를 실행해 로컬 WebSocket 브리지를 연결합니다.',
  examples: [
    `불의 아이 EMBER와 물의 아이 TIDE를 한 명의 플레이어가 번갈아 조종하면서 서로 다른 원소 능력으로 세 개의 유적을 탈출하는 2D 퍼즐 플랫포머를 만들고 싶습니다. 이 프로젝트에서 MODI PLUS 센서는 단순한 컨트롤러가 아니라 게임 세계의 물리 법칙으로 작동해야 합니다. 화면은 16:9 시네마틱 캔버스와 반투명 HUD로 구성하고 불은 코랄·주황, 물은 시안·파랑, 성공은 민트, 위험은 붉은색으로 일관되게 표현해주세요.

Network, IMU, Joystick, ENV, Button, LED, Speaker 모듈을 사용해주세요. 게임 시작 시 IMU와 조이스틱을 중앙에 놓고 값을 여러 번 측정한 다음 각각 화면 오른쪽으로 움직여 실제 장착 축과 부호를 자동으로 찾는 3단계 방향 동기화를 실행해주세요. 모듈을 90도나 180도로 돌려 장착해도 게임에서는 항상 오른쪽 입력이 양수가 되게 정규화하고, 동기화 중 발생한 버튼과 방향 입력은 게임 동작으로 처리하지 말아주세요. 연결이 끊겼다가 다시 붙으면 현재 스테이지와 수집 기록은 유지하되 방향 동기화가 다시 필요하다는 안내를 보여주세요.

IMU의 좌우 기울기는 현재 선택된 캐릭터의 이동 속도로 바꾸고 중앙에서 ±6도 이내는 데드존으로 처리해주세요. 버튼을 한 번 누르면 점프하고 더블클릭하면 EMBER와 TIDE가 전환되게 하되 한 번 누름과 더블클릭이 동시에 두 동작으로 처리되지 않게 구분해주세요. 선택되지 않은 캐릭터는 현재 위치에서 멈추고, 불 캐릭터는 불 웅덩이를 안전하게 통과하지만 물에 닿으면 최근 체크포인트로 돌아가며 물 캐릭터는 반대 규칙을 사용해주세요. 각 캐릭터가 자신의 원소 포털에 도달해야 스테이지가 완료되게 해주세요.

첫 번째 스테이지 빙결 금고에서는 이동, 점프와 캐릭터 전환을 익힌 뒤 ENV 온도를 기준보다 3°C 이상 높인 상태로 일정 시간 유지하면 빙벽이 녹게 해주세요. 눈발, 얼음 결정, 랜턴, 착지 파편으로 차가운 분위기를 만들고 화면에는 현재 온도와 녹는 진행도를 표시해주세요. 두 캐릭터가 서로 다른 원소 웅덩이를 통과해 각자의 포털에 도달하면 다음 유적으로 이동하게 해주세요.

두 번째 스테이지 일식 도서관에서는 ENV 조도를 18% 이하로 유지하면 빛의 문이 잠들고 숨겨진 통로가 나타나게 해주세요. 이후 조이스틱으로 위쪽, 오른쪽, 왼쪽 순서를 정확히 입력하면 거울이 회전하고 다리가 완성되게 해주세요. 잘못된 방향을 누르면 현재 진행을 초기화하거나 첫 방향과 일치하는 경우 일부 진행을 유지해 다시 시도할 수 있게 해주세요. 떠다니는 책, 종이 파티클, 거울 광선과 일식 배경을 사용하고 퍼즐 순서와 조도 상태를 HUD에서 확인할 수 있게 해주세요.

세 번째 스테이지 공명 코어에서는 모든 입력을 종합해주세요. 먼저 조이스틱으로 왼쪽, 위쪽, 오른쪽, 아래쪽 룬 순서를 입력해 첫 번째 문을 열고, ENV 센서를 손으로 데워 코어의 열을 충전한 다음 센서를 가려 조도를 낮춰 안정화하게 해주세요. 열 충전과 암전 안정화는 순서대로 진행되어야 하며 조건을 벗어나면 진행도가 서서히 감소하게 해주세요. 회전 기어, 에너지 관로, 전기 스파크와 코어 펄스로 마지막 스테이지의 긴장감을 보여주세요.

LED는 현재 활성 캐릭터의 원소 색, 퍼즐 성공, 위험과 스테이지 완료 상태에 맞춰 바뀌게 해주세요. Speaker는 점프, 캐릭터 전환, 룬 정답과 오답, 체크포인트, 기억의 파편 획득, 스테이지 완료에 서로 다른 짧은 음을 내고 최종 완료 시 성공 멜로디를 연주해주세요. 새 음을 재생할 때 이전 정지 타이머가 늦게 실행되어 최신 음을 끄지 않도록 세대 번호나 타이머 취소 로직을 적용해주세요.

각 스테이지에는 캐릭터별 체크포인트 세 개와 선택 수집물인 기억의 파편 네 개를 배치해주세요. 잘못된 원소 액체나 낙하에 실패하면 해당 캐릭터만 최근 체크포인트로 되돌리고 다른 캐릭터의 위치와 퍼즐 진행은 가능한 범위에서 유지해주세요. HUD에는 현재 스테이지, 목표, 전체 진행률, 활성 캐릭터, 모듈 연결 상태, 센서값, LED와 스피커 상태를 표시하고 일시 정지, 다시 시작, 방향 다시 맞추기와 시뮬레이터 열기 기능을 제공해주세요.

실물 MODI가 없어도 A·D 이동, Space 점프, Tab 캐릭터 전환, 방향키 퍼즐 입력, H를 누르는 동안 가열, L을 누르는 동안 암전을 사용하는 키보드 대체 입력과 화면 시뮬레이터로 처음부터 끝까지 완주할 수 있어야 합니다. reduced-motion 환경에서는 화면 흔들림과 장식 파티클을 줄이고 모바일에서는 HUD와 시뮬레이터를 세로 화면에 맞게 재배치해주세요. 완료 기준은 방향 동기화, 세 스테이지의 센서 퍼즐, 원소 충돌 규칙, 체크포인트, 수집물, LED·스피커 피드백, 연결 해제 복구와 키보드 대체 입력이 모두 같은 게임 상태에서 안정적으로 동작하는 것입니다.`,
  ],
  keywords: [
    {
      label: '두 캐릭터 조작',
      synonyms: ['물불', '불', '물', 'ember', 'tide', '캐릭터', 'imu', '기울', '이동', '버튼', '점프', '전환', '더블클릭'],
      reply: '**두 캐릭터 조작**은 IMU와 버튼이 담당합니다.\n\nIMU를 좌우로 기울이면 현재 캐릭터가 움직입니다. 버튼을 한 번 누르면 점프하고 더블클릭하면 불의 아이 EMBER와 물의 아이 TIDE가 바뀝니다. 각 캐릭터는 같은 원소의 액체만 안전하게 통과할 수 있습니다.',
      hint: 'EMBER와 TIDE를 어떻게 이동하고 서로 전환할지 설명해 보세요.',
    },
    {
      label: '센서 퍼즐',
      synonyms: ['환경', 'env', '온도', '열', '데워', '조도', '빛', '가리', '조이스틱', '방향', '룬', '거울', '퍼즐'],
      reply: '**센서 퍼즐**은 실제 환경 변화를 게임 규칙으로 사용합니다.\n\nENV 온도를 기준보다 3°C 높게 유지하면 얼음이 녹고, 조도를 18% 이하로 낮추면 빛의 문이 잠듭니다. 조이스틱은 스테이지별 방향 순서를 입력해 거울과 공명 룬을 활성화합니다.',
      hint: '온도·빛·방향 입력으로 어떤 장애물을 해결할지 말해 보세요.',
    },
    {
      label: '출력과 스테이지',
      synonyms: ['led', '스피커', 'speaker', '색', '소리', '멜로디', '피드백', '스테이지', '빙결', '일식', '공명', '포털', '완료'],
      reply: '**출력과 스테이지**가 진행 상황을 손으로 느끼게 합니다.\n\nLED는 활성 원소와 성공·위험 상태를 색으로 표시하고 스피커는 점프, 정답, 스테이지 완료음을 냅니다. 빙결 금고·일식 도서관·공명 코어를 차례로 해결해 두 캐릭터를 각자의 포털로 보내면 완료됩니다.',
      hint: 'LED와 스피커가 무엇을 알려 주고 몇 개의 스테이지를 통과할지 설명해 보세요.',
    },
  ],
  unlockReply: '**두 캐릭터 조작 · 센서 퍼즐 · 출력과 스테이지**가 모두 정해졌습니다.\n\n코드에서 센서값이 게임의 물리 규칙으로 바뀌는 과정을 확인하고, 미리보기의 시뮬레이터 또는 실물 MODI로 세 유적을 탐험해 보세요.',
  codeFiles: {
    'input.ts — 입력 대체 규칙': `const keyboardRoll = keys.has('KeyA') ? -28 : keys.has('KeyD') ? 28 : 0;
state.imu.roll = keyboardRoll || simulationRoll;
state.env.temperature = simulationHeat || keys.has('KeyH') ? 34 : 24;
state.env.illuminance = simulationDark || keys.has('KeyL') ? 4 : 72;

if (event.code === 'Space' || event.code === 'KeyW') jumpRequested = true;
if (event.code === 'Tab') switchRequested = true;
`,
    'game.ts — 환경 센서 퍼즐': `primaryProgress = applyThresholdProgress(
  primaryProgress,
  nearIceWall && env.temperature >= 30,
  deltaTime,
  2.2,
);

primaryProgress = applyThresholdProgress(
  primaryProgress,
  nearLightGate && env.illuminance <= 18,
  deltaTime,
  1.7,
);
`,
    'main.py — 모듈 텔레메트리': `MODULE_NAMES = ('imu', 'joystick', 'env', 'button', 'led', 'speaker')

return {
    'type': 'telemetry',
    'source': 'hardware',
    'modules': self.modules.status(),
    'imu': {'roll': normalized_roll, 'pitch': normalized_pitch, 'yaw': raw_imu_z},
    'joystick': {'x': normalized_x, 'y': normalized_y, 'direction': direction},
    'env': self.read_env(),
    'button': self.read_button(),
}

if action == 'led':
    self.set_led(command.get('color'))
if action == 'tone':
    self.play_tone(command.get('frequency'), command.get('volume'), command.get('duration'))
`,
    '점검표.md': `1. 네트워크·IMU·조이스틱·ENV·버튼·LED·스피커가 준비물에 표시된다.
2. 방향 동기화 후 IMU의 오른쪽 기울임이 화면 오른쪽 이동이 된다.
3. 버튼 한 번은 점프, 더블클릭은 캐릭터 전환으로 구분된다.
4. ENV를 데우거나 가렸을 때 온도·조도 퍼즐이 진행된다.
5. 조이스틱 방향 순서를 맞히면 룬 또는 거울 퍼즐이 열린다.
6. LED와 스피커가 원소·정답·위험·완료 상태에 반응한다.
7. 실물 모듈 없이도 키보드와 화면 시뮬레이터로 완주할 수 있다.
`,
  },
  notes: [
    { title: '센서가 물리 법칙이 되는 게임', what: '온도와 조도를 단순 표시하지 않고 얼음과 빛의 문 상태에 직접 연결한다.', why: '센서값과 프로그램의 조건문 사이 관계를 플레이로 이해할 수 있다.', where: 'game.ts의 updateGimmicks()' },
    { title: '방향 동기화', what: 'IMU와 조이스틱의 중앙값·실제 축·부호를 세 단계로 측정한다.', why: '모듈을 90° 또는 180° 회전해 장착해도 화면 방향을 일정하게 유지한다.', where: 'main.py의 DirectionCalibration' },
    { title: '짧은 누름과 더블클릭', what: '같은 버튼으로 점프와 캐릭터 전환이라는 두 동작을 구분한다.', why: '제한된 하드웨어 입력으로 더 많은 게임 명령을 표현하기 위해서다.', where: 'main.py의 read_button()과 input.ts' },
    { title: '하드웨어 대체 입력', what: '모든 센서 동작에 키보드와 화면 컨트롤을 함께 제공한다.', why: '실물 모듈 연결 문제로 게임 진행과 수업 검증이 막히지 않게 한다.', where: 'input.ts의 simulator 상태' },
  ],
};

export const HYBRID_CURRICULA: HybridCurriculum[] = [
  F1942,
  TILT_MATCH,
  LOOP_STUDIO,
  TILT_CLICK_TEST,
  FUNCTION_SHAPE,
  TIMES_TABLE_QUEST,
  CLASSROOM_GARDEN,
  EMBER_AND_TIDE,
];

export const findHybridCurriculum = (courseId?: string) =>
  HYBRID_CURRICULA.find((c) => c.courseId === courseId);
