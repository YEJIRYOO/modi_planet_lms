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
  role: '필수' | '선택';
  reason: string;
  count: number;
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
  folder: '1942',
  runCommand: 'python app.py --mode real --port 8101',
  modules: [
    { key: 'imu', role: '필수', reason: '기체를 기울여 비행기를 좌우로 움직인다', count: 1 },
    { key: 'button', role: '필수', reason: '누르면 총알을 발사한다', count: 1 },
    { key: 'motor_a', role: '선택', reason: '기울기에 따라 회전해 손에 반응을 준다', count: 1 },
    { key: 'led', role: '선택', reason: '발사 중일 때 색이 바뀐다', count: 1 },
  ],
  mockNote: 'IMU와 버튼이 없으면 게임이 mock 모드로 떨어져 화면 아래 슬라이더로만 조작됩니다.',
  examples: [
    '자이로를 기울이면 비행기가 움직이고 버튼을 누르면 총알이 나가게 하고 싶어',
    '적하고 부딪히면 목숨이 줄어드는 슈팅 게임',
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
  folder: 'tilt_match',
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
  folder: 'loop_studio',
  runCommand: 'python app.py --mode real --port 8103',
  modules: [
    { key: 'dial', role: '필수', reason: '돌린 각도가 그대로 볼륨이 된다', count: 1 },
    { key: 'button', role: '필수', reason: '누르면 재생과 정지를 번갈아 한다', count: 1 },
    { key: 'speaker', role: '필수', reason: '만든 패턴을 실제 소리로 낸다', count: 1 },
    { key: 'joystick', role: '선택', reason: '다이얼이 없을 때 위/아래로 볼륨을 조절한다', count: 1 },
  ],
  mockNote: '다이얼(또는 조이스틱) · 버튼 · 스피커가 모두 있어야 real 모드입니다. mock 모드에서는 컴퓨터 스피커로 소리가 납니다.',
  examples: [
    '다이얼로 볼륨을 조절하고 버튼으로 재생하는 8칸 시퀀서',
    '스피커로 반복되는 멜로디를 만드는 프로그램',
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

export const HYBRID_CURRICULA: HybridCurriculum[] = [F1942, TILT_MATCH, LOOP_STUDIO, TILT_CLICK_TEST];

export const findHybridCurriculum = (courseId?: string) =>
  HYBRID_CURRICULA.find((c) => c.courseId === courseId);
