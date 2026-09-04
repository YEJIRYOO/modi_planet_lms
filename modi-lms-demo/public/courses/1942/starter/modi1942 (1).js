/**
 * modi1942.js — 센서값을 게임 조작으로 바꾸는 규칙.
 *
 * 원래 이 로직은 파이썬 서버(modi_adapter.py)에 있었고, 브라우저가 80ms마다
 * HTTP 요청을 보내 결과를 받아왔습니다. 여기서는 같은 계산을 브라우저에서
 * 바로 수행합니다. 서버가 없어도 되고, 지연도 없습니다.
 *
 * 이 파일의 함수는 전부 순수 함수입니다. 같은 입력이면 항상 같은 출력이고,
 * 하드웨어도 화면도 건드리지 않습니다. 그래서 테스트하기 쉽고, 수업에서
 * 학생이 값을 바꿔가며 실험하기에도 좋습니다.
 */

// #region step:1 title:센서 규격 정하기
// IMU가 돌려주는 각도의 허용 범위와, 손떨림을 무시할 폭(데드존).
export const MAX_ANGLE = 90;   // 기울기는 -90도 ~ +90도
export const DEADZONE = 3;     // ±3도 안쪽은 "안 움직인 것"으로 취급
// #endregion

/** 값을 lo~hi 사이로 자릅니다. 범위를 벗어난 센서값을 막는 안전장치입니다. */
function clamp(value, lo, hi) {
  return Math.max(lo, Math.min(hi, value));
}

/** 소수점 셋째 자리까지 반올림합니다. (파이썬 round(x, 3)과 같은 역할) */
function round3(value) {
  return Math.round(value * 1000) / 1000;
}

// #region step:2 title:기울기를 이동 방향으로 바꾸기
/**
 * 기울기(pitch, roll)와 버튼 상태를 게임이 이해하는 값으로 번역합니다.
 *
 * @param {number} pitch  앞뒤로 기울인 각도 (-90 ~ 90)
 * @param {number} roll   좌우로 기울인 각도 (-90 ~ 90)
 * @param {boolean} button 버튼을 누르고 있는지
 * @returns {{movement: {x: number, y: number}, attack: boolean, outputs: object}}
 *
 * movement.x, movement.y 는 -1 ~ 1 사이의 값입니다.
 * x가 1이면 오른쪽 끝까지, -1이면 왼쪽 끝까지 가라는 뜻입니다.
 */
export function map1942Controls(pitch, roll, button) {
  // 1) 센서값이 범위를 벗어나도 안전하도록 먼저 자릅니다.
  pitch = clamp(Number(pitch) || 0, -MAX_ANGLE, MAX_ANGLE);
  roll = clamp(Number(roll) || 0, -MAX_ANGLE, MAX_ANGLE);

  // 2) 데드존: 살짝 기울어진 정도는 0으로 봅니다. 없으면 비행기가 계속 떱니다.
  //    그리고 90으로 나눠서 -1 ~ 1 범위로 정규화합니다.
  const x = Math.abs(roll) < DEADZONE ? 0 : round3(roll / MAX_ANGLE);

  // 3) y축은 부호를 뒤집습니다. 화면 좌표는 아래로 갈수록 커지기 때문에,
  //    앞으로 기울였을 때(pitch 양수) 비행기가 위로 가게 하려면 -가 필요합니다.
  const y = Math.abs(pitch) < DEADZONE ? 0 : round3(-pitch / MAX_ANGLE);

  // 4) 하드웨어로 내보낼 값도 같이 계산합니다. (모터 속도, LED 색)
  const motorSpeed = clamp(Math.round((roll * 100) / MAX_ANGLE), -100, 100);

  return {
    movement: { x, y },
    attack: Boolean(button),
    outputs: {
      motor_speed: motorSpeed,
      led_rgb: button ? [255, 70, 20] : [20, 90, 255],
    },
  };
}
// #endregion

// #region step:3 title:잘못된 입력 막기
/**
 * 밖에서 들어온 조작값이 안전한지 검사합니다.
 * 센서가 고장나거나 계산이 어긋나면 NaN, Infinity 같은 값이 들어올 수 있고,
 * 그대로 모터에 보내면 위험합니다. 그래서 게임에 넘기기 전에 걸러냅니다.
 */
export function validate1942Command(value) {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new TypeError('조작값은 객체여야 합니다');
  }
  const unknown = Object.keys(value).filter((key) => !['pitch', 'roll', 'button'].includes(key));
  if (unknown.length) {
    throw new TypeError(`알 수 없는 입력: ${unknown.sort().join(', ')}`);
  }

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
// #endregion

/**
 * 검사 + 변환을 한 번에 수행하고, 원래 서버가 돌려주던 것과 똑같은 모양의
 * 객체를 만듭니다. 덕분에 game1942.js 는 한 줄도 고치지 않고 그대로 씁니다.
 */
export function run1942(inputs, mode = 'mock') {
  const controls = validate1942Command(inputs);
  return {
    mode,
    project_id: '1942',
    controls,
    ...map1942Controls(controls.pitch, controls.roll, controls.button),
  };
}
