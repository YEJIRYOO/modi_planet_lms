/**
 * modi1942.js — [실습] 센서값을 게임 조작으로 바꾸는 규칙.
 *
 * 아래 map1942Controls 함수를 완성하세요.
 * 완성 전에는 비행기가 기울여도 움직이지 않습니다. 다 채우면 바로 움직입니다.
 *
 * 힌트: 파일 맨 아래 "확인해보기" 표를 보고, 그 값이 나오도록 만들면 됩니다.
 */

export const MAX_ANGLE = 90;
export const DEADZONE = 3;

function clamp(value, lo, hi) {
  return Math.max(lo, Math.min(hi, value));
}

function round3(value) {
  return Math.round(value * 1000) / 1000;
}

export function map1942Controls(pitch, roll, button) {
  // 1) 센서값을 -90 ~ 90 범위로 자르세요.
  //    clamp() 를 쓰면 됩니다.
  pitch = 0; // TODO: pitch를 안전한 범위로 자르기
  roll = 0;  // TODO: roll을 안전한 범위로 자르기

  // 2) roll을 좌우 이동값 x로 바꾸세요.
  //    - 기울기가 DEADZONE(3도)보다 작으면 0
  //    - 아니면 90으로 나눠서 -1 ~ 1 범위로 만들고 round3() 적용
  const x = 0; // TODO

  // 3) pitch를 위아래 이동값 y로 바꾸세요.
  //    x와 같은 방식인데, 부호가 반대입니다.
  //    화면 좌표는 아래로 갈수록 커지기 때문입니다.
  const y = 0; // TODO

  // 4) roll을 모터 속도(-100 ~ 100)로 바꾸세요. 소수점은 반올림합니다.
  const motorSpeed = 0; // TODO

  return {
    movement: { x, y },
    attack: Boolean(button),
    outputs: {
      motor_speed: motorSpeed,
      // 5) 버튼을 누르면 주황색 [255, 70, 20], 아니면 파란색 [20, 90, 255]
      led_rgb: [0, 0, 0], // TODO
    },
  };
}

/* ── 확인해보기 ────────────────────────────────────────────────────
 *
 *  pitch  roll  button  →  x       y       motor_speed
 *  ─────────────────────────────────────────────────────
 *      0     0   false     0       0        0
 *      2     2   false     0       0        2      ← 데드존 안쪽
 *     -3     3   false     0.033   0.033    3      ← 데드존 경계 바로 밖
 *     45   -30   true     -0.333  -0.5    -33
 *    -90    90   true      1       1      100      ← 최대치
 *
 * ────────────────────────────────────────────────────────────────── */

export function validate1942Command(value) {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new TypeError('조작값은 객체여야 합니다');
  }
  const unknown = Object.keys(value).filter((key) => !['pitch', 'roll', 'button'].includes(key));
  if (unknown.length) throw new TypeError(`알 수 없는 입력: ${unknown.sort().join(', ')}`);

  const result = { pitch: 0, roll: 0, button: false };
  for (const name of ['pitch', 'roll']) {
    const raw = value[name] ?? 0;
    if (typeof raw !== 'number' || !Number.isFinite(raw)) {
      throw new TypeError(`${name}은(는) 유한한 숫자여야 합니다`);
    }
    if (raw < -MAX_ANGLE || raw > MAX_ANGLE) {
      throw new RangeError(`${name}은(는) -${MAX_ANGLE} ~ ${MAX_ANGLE} 사이여야 합니다`);
    }
    result[name] = raw;
  }
  const button = value.button ?? false;
  if (typeof button !== 'boolean') throw new TypeError('button은 true/false여야 합니다');
  result.button = button;
  return result;
}

export function run1942(inputs, mode = 'mock') {
  const controls = validate1942Command(inputs);
  return {
    mode,
    project_id: '1942',
    controls,
    ...map1942Controls(controls.pitch, controls.roll, controls.button),
  };
}
