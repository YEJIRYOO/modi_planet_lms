/**
 * main.js — 게임 화면을 띄우고, 조작값을 매 프레임 게임에 전달합니다.
 *
 * 원본(app.js)은 80ms마다 파이썬 서버에 HTTP 요청을 보내 조작값을 받아왔습니다.
 * 여기서는 run1942()를 브라우저에서 직접 호출합니다. 서버도, 설치도 필요 없고
 * 입력 지연도 사라집니다.
 */

import { Game1942 } from './game1942.js';
import { run1942 } from './modi1942.js';
import { createControlSource } from './controlSource.js';

const canvas = document.querySelector('#game1942');
const statusLine = document.querySelector('#control-status');
const readout = document.querySelector('#readout');
const pitchInput = document.querySelector('#pitch');
const rollInput = document.querySelector('#roll');
const attackButton = document.querySelector('#attack');
const overlay = document.querySelector('#calibration-overlay');
const overlayState = document.querySelector('#calibration-state');
const overlayProgress = document.querySelector('#calibration-progress');
const skipButton = document.querySelector('#skip-calibration');

const TICK_MS = 16;             // 약 60번/초
const CALIBRATION_SAMPLE_MS = 140;
const NEUTRAL_SAMPLE_COUNT = 4;
const TILT_SAMPLE_COUNT = 8;
const TILT_THRESHOLD = 6;

const game = new Game1942(canvas);
const source = createControlSource({ pitchInput, rollInput });
let calibration = null;
let tickTimer = null;

// #region step:4 title:매 프레임 조작값 전달하기
/**
 * 조작 루프. 소스에서 값을 읽고, 규칙에 따라 변환하고, 게임에 넘깁니다.
 * 이 세 줄이 하드웨어와 게임을 잇는 전부입니다.
 */
function tick() {
  let result;
  try {
    result = run1942(source.read(), source.mode === 'real' ? 'real' : 'mock');
  } catch (error) {
    statusLine.textContent = `조작 오류 · ${error.message}`;
    statusLine.dataset.mode = 'error';
    return;
  }

  if (calibration?.active) collectCalibrationSample(result);
  else game.apply(result);

  statusLine.textContent = source.label;
  statusLine.dataset.mode = source.mode === 'real' ? 'real' : 'mock';
  if (readout) {
    readout.textContent = `x ${result.movement.x.toFixed(2)}  y ${result.movement.y.toFixed(2)}  `
      + `motor ${result.outputs.motor_speed}  ${result.attack ? 'FIRE' : '·'}`;
  }
}
// #endregion

function startTicking() {
  clearInterval(tickTimer);
  tickTimer = setInterval(tick, TICK_MS);
}

/* ── IMU 보정 ─────────────────────────────────────────────────────
   실제 모듈을 쓸 때만 필요합니다. 사람마다 모듈을 쥐는 각도가 달라서,
   "지금 자세"를 중립으로 잡고 "오른쪽"이 어느 축인지 먼저 배웁니다.
   모의 조작 모드에서는 건너뛰고 바로 시작합니다.                     */

function average(samples, axis) {
  return samples.reduce((sum, sample) => sum + sample[axis], 0) / samples.length;
}

function beginCalibration() {
  calibration = {
    active: true, phase: 'neutral', neutralSamples: [], tiltSamples: [],
    neutral: null, axis: null, sign: 0, lastSampleAt: 0,
  };
  overlay.hidden = false;
  overlayState.textContent = '중립 기준을 측정하고 있어요. 잠시 수평으로 유지해 주세요.';
  overlayProgress.style.width = '0%';
  game.clearHorizontalCalibration();
}

function finishCalibration(skipped = false) {
  if (!calibration?.active) return;
  calibration.active = false;
  overlayProgress.style.width = '100%';
  overlayState.textContent = skipped ? '보정을 건너뛰었습니다.' : '보정 완료';
  setTimeout(() => {
    overlay.hidden = true;
    game.start();
    canvas.focus();
  }, skipped ? 0 : 500);
}

function collectCalibrationSample(result) {
  const sample = { pitch: Number(result.controls.pitch), roll: Number(result.controls.roll) };
  if (!Number.isFinite(sample.pitch) || !Number.isFinite(sample.roll)) return;
  const now = performance.now();
  if (now - calibration.lastSampleAt < CALIBRATION_SAMPLE_MS) return;
  calibration.lastSampleAt = now;

  if (calibration.phase === 'neutral') {
    calibration.neutralSamples.push(sample);
    const count = calibration.neutralSamples.length;
    overlayProgress.style.width = `${Math.round((count / NEUTRAL_SAMPLE_COUNT) * 20)}%`;
    if (count < NEUTRAL_SAMPLE_COUNT) return;
    calibration.neutral = {
      pitch: average(calibration.neutralSamples, 'pitch'),
      roll: average(calibration.neutralSamples, 'roll'),
    };
    calibration.phase = 'tilt';
    overlayState.textContent = '오른쪽으로 기울여보세요!';
    return;
  }

  const pitchDelta = sample.pitch - calibration.neutral.pitch;
  const rollDelta = sample.roll - calibration.neutral.roll;
  if (!calibration.axis) {
    const axis = Math.abs(rollDelta) >= Math.abs(pitchDelta) ? 'roll' : 'pitch';
    const delta = axis === 'roll' ? rollDelta : pitchDelta;
    if (Math.abs(delta) < TILT_THRESHOLD) return;
    calibration.axis = axis;
    calibration.sign = Math.sign(delta);
  }

  const axisDelta = sample[calibration.axis] - calibration.neutral[calibration.axis];
  if (axisDelta * calibration.sign < TILT_THRESHOLD / 2) return;
  calibration.tiltSamples.push(sample);
  const count = calibration.tiltSamples.length;
  overlayState.textContent = `오른쪽 감지됨 · ${count}/${TILT_SAMPLE_COUNT}`;
  overlayProgress.style.width = `${20 + Math.round((count / TILT_SAMPLE_COUNT) * 80)}%`;
  if (count < TILT_SAMPLE_COUNT) return;

  const tilted = average(calibration.tiltSamples, calibration.axis);
  game.setHorizontalCalibration({
    axis: calibration.axis,
    neutral: calibration.neutral[calibration.axis],
    sign: calibration.sign,
    range: Math.abs(tilted - calibration.neutral[calibration.axis]),
    crossNeutral: calibration.neutral[calibration.axis === 'roll' ? 'pitch' : 'roll'],
  });
  finishCalibration();
}

/* ── 시작 ───────────────────────────────────────────────────────── */

attackButton.addEventListener('click', () => {
  // 모의 조작에서는 소스에 발사를 예약합니다. 다음 tick에서 게임에 전달됩니다.
  source.queueAttack?.();
});
skipButton.addEventListener('click', () => finishCalibration(true));
window.addEventListener('pagehide', () => {
  clearInterval(tickTimer);
  game.stop();
  source.disconnect();
});

async function init() {
  await source.connect();
  const needsCalibration = source.mode !== 'mock';
  pitchInput.disabled = needsCalibration;
  rollInput.disabled = needsCalibration;

  if (needsCalibration) {
    beginCalibration();
    skipButton.focus();
  } else {
    // 모의 조작 모드: 보정 없이 즉시 플레이합니다.
    overlay.hidden = true;
    game.start();
    canvas.focus();
  }
  startTicking();
}

init();
