(function () {
const NativeWebSocket = window.WebSocket;
const sockets = new Set();
const sampleMinimum = 20;
let device = null;
let ready = false;
let lastSampleAt = 0;
let calibration = createCalibration();

function createCalibration() {
  return {
    active: false,
    calibrated: false,
    phase: 'idle',
    error: '',
    samples: [],
    imuCenterX: 0,
    imuCenterY: 0,
    joystickCenterX: 0,
    joystickCenterY: 0,
    imuAxis: 'x',
    imuSign: 1,
    joystickAxis: 'x',
    joystickSign: 1,
    backup: null,
  };
}

const hasModule = (type) => device?.modules?.some((module) => module.type === type) === true;
const inputReady = () => device?.status === 'connected' && hasModule('imu') && hasModule('joystick') && hasModule('env') && hasModule('button');
const angleDelta = (value, center) => (value - center + 180) % 360 - 180;
const clamp = (value, low, high) => Math.max(low, Math.min(high, Number(value) || 0));
const average = (values) => values.reduce((sum, value) => sum + value, 0) / values.length;
const circularMean = (values) => {
  const sine = average(values.map((value) => Math.sin(value * Math.PI / 180)));
  const cosine = average(values.map((value) => Math.cos(value * Math.PI / 180)));
  return Math.atan2(sine, cosine) * 180 / Math.PI;
};

function beginCalibration() {
  calibration.backup = calibration.calibrated ? {
    imuCenterX: calibration.imuCenterX,
    imuCenterY: calibration.imuCenterY,
    joystickCenterX: calibration.joystickCenterX,
    joystickCenterY: calibration.joystickCenterY,
    imuAxis: calibration.imuAxis,
    imuSign: calibration.imuSign,
    joystickAxis: calibration.joystickAxis,
    joystickSign: calibration.joystickSign,
  } : null;
  calibration.active = true;
  calibration.calibrated = false;
  calibration.phase = 'neutral';
  calibration.error = '';
  calibration.samples = [];
  lastSampleAt = 0;
}

function cancelCalibration() {
  if (calibration.backup) {
    Object.assign(calibration, calibration.backup, { active: false, calibrated: true, phase: 'complete', error: '', samples: [], backup: null });
  } else {
    calibration = createCalibration();
  }
}

function observeCalibration() {
  if (!calibration.active || !['neutral', 'imu_right', 'joystick_right'].includes(calibration.phase) || !device?.imu || !device?.joystick) return;
  const now = performance.now();
  if (now - lastSampleAt < 45) return;
  lastSampleAt = now;
  calibration.samples.push({
    imuX: clamp(device.imu.roll, -180, 180),
    imuY: clamp(device.imu.pitch, -180, 180),
    joystickX: clamp(device.joystick.x, -100, 100),
    joystickY: clamp(device.joystick.y, -100, 100),
  });
  if (calibration.samples.length > 75) calibration.samples.splice(0, calibration.samples.length - 75);
}

function captureCalibration() {
  if (!calibration.active || !['neutral', 'imu_right', 'joystick_right'].includes(calibration.phase)) {
    calibration.error = '먼저 방향 동기화를 시작하세요.';
    return;
  }
  if (calibration.samples.length < sampleMinimum) {
    calibration.error = '잠시 그대로 유지해 주세요. 센서 값을 모으고 있습니다.';
    return;
  }
  const samples = calibration.samples.slice(-sampleMinimum);
  const imuX = circularMean(samples.map((sample) => sample.imuX));
  const imuY = circularMean(samples.map((sample) => sample.imuY));
  const joystickX = average(samples.map((sample) => sample.joystickX));
  const joystickY = average(samples.map((sample) => sample.joystickY));

  if (calibration.phase === 'neutral') {
    const imuSpread = Math.max(...samples.map((sample) => Math.max(Math.abs(angleDelta(sample.imuX, imuX)), Math.abs(angleDelta(sample.imuY, imuY)))));
    const joystickSpread = Math.max(...samples.map((sample) => Math.hypot(sample.joystickX - joystickX, sample.joystickY - joystickY)));
    if (imuSpread > 4 || joystickSpread > 15) {
      calibration.error = '센서가 움직이고 있습니다. 둘 다 중앙에 놓고 다시 시도하세요.';
      calibration.samples = [];
      return;
    }
    calibration.imuCenterX = imuX;
    calibration.imuCenterY = imuY;
    calibration.joystickCenterX = joystickX;
    calibration.joystickCenterY = joystickY;
    calibration.phase = 'imu_right';
  } else if (calibration.phase === 'imu_right') {
    const deltaX = angleDelta(imuX, calibration.imuCenterX);
    const deltaY = angleDelta(imuY, calibration.imuCenterY);
    if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < 8) {
      calibration.error = 'IMU 변화가 작습니다. 화면 오른쪽으로 더 기울여 주세요.';
      calibration.samples = [];
      return;
    }
    calibration.imuAxis = Math.abs(deltaX) >= Math.abs(deltaY) ? 'x' : 'y';
    calibration.imuSign = (calibration.imuAxis === 'x' ? deltaX : deltaY) > 0 ? 1 : -1;
    calibration.phase = 'joystick_right';
  } else {
    const deltaX = joystickX - calibration.joystickCenterX;
    const deltaY = joystickY - calibration.joystickCenterY;
    if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < 35) {
      calibration.error = '조이스틱 변화가 작습니다. 오른쪽 끝까지 밀어 주세요.';
      calibration.samples = [];
      return;
    }
    calibration.joystickAxis = Math.abs(deltaX) >= Math.abs(deltaY) ? 'x' : 'y';
    calibration.joystickSign = (calibration.joystickAxis === 'x' ? deltaX : deltaY) > 0 ? 1 : -1;
    calibration.active = false;
    calibration.calibrated = true;
    calibration.phase = 'complete';
    calibration.backup = null;
    parent.postMessage({ type: 'modi-command', action: 'led', red: 20, green: 100, blue: 72 }, location.origin);
    parent.postMessage({ type: 'modi-command', action: 'speaker', frequency: 880, volume: 45 }, location.origin);
    setTimeout(() => parent.postMessage({ type: 'modi-command', action: 'speaker', frequency: 0, volume: 0 }, location.origin), 160);
  }
  calibration.error = '';
  calibration.samples = [];
  lastSampleAt = 0;
}

function normalizedImu() {
  const rawX = clamp(device?.imu?.roll, -180, 180);
  const rawY = clamp(device?.imu?.pitch, -180, 180);
  if (!calibration.calibrated) return { roll: rawX, pitch: rawY, yaw: clamp(device?.imu?.yaw, -180, 180) };
  const deltaX = angleDelta(rawX, calibration.imuCenterX);
  const deltaY = angleDelta(rawY, calibration.imuCenterY);
  const selected = calibration.imuAxis === 'x' ? deltaX : deltaY;
  const other = calibration.imuAxis === 'x' ? deltaY : deltaX;
  return { roll: selected * calibration.imuSign, pitch: other, yaw: clamp(device?.imu?.yaw, -180, 180) };
}

function normalizedJoystick() {
  const deltaX = clamp(device?.joystick?.x, -100, 100) - calibration.joystickCenterX;
  const deltaY = clamp(device?.joystick?.y, -100, 100) - calibration.joystickCenterY;
  let x = deltaX;
  let y = deltaY;
  if (calibration.calibrated) {
    if (calibration.joystickAxis === 'x') {
      x = deltaX * calibration.joystickSign;
      y = deltaY * calibration.joystickSign;
    } else {
      x = deltaY * calibration.joystickSign;
      y = -deltaX * calibration.joystickSign;
    }
  }
  x = clamp(x, -100, 100);
  y = clamp(y, -100, 100);
  const direction = Math.max(Math.abs(x), Math.abs(y)) < 35 ? 'origin' : Math.abs(x) >= Math.abs(y) ? x > 0 ? 'right' : 'left' : y > 0 ? 'up' : 'down';
  return { x: Math.round(x), y: Math.round(y), direction };
}

function calibrationStatus() {
  return {
    available: hasModule('imu') && hasModule('joystick'),
    required: inputReady() && !calibration.calibrated,
    active: calibration.active,
    calibrated: calibration.calibrated,
    phase: calibration.phase,
    sampleCount: calibration.samples.length,
    sampleReady: calibration.samples.length >= sampleMinimum,
    error: calibration.error,
    imuAxis: calibration.imuAxis,
    imuSign: calibration.imuSign,
    joystickAxis: calibration.joystickAxis,
    joystickSign: calibration.joystickSign,
  };
}

const telemetry = () => ({
  type: 'telemetry',
  connected: true,
  source: 'hardware',
  modules: {
    imu: hasModule('imu'),
    joystick: hasModule('joystick'),
    env: hasModule('env'),
    button: hasModule('button'),
    led: hasModule('led'),
    speaker: hasModule('speaker'),
  },
  calibration: calibrationStatus(),
  imu: normalizedImu(),
  joystick: normalizedJoystick(),
  env: device?.env ?? { temperature: 24, illuminance: 72, humidity: 46, volume: 0 },
  button: device?.button ?? { pressed: false, clicked: false, doubleClicked: false, toggled: false },
  timestamp: Date.now(),
});

const emit = (socket) => {
  if (socket.readyState === BridgeWebSocket.OPEN && inputReady()) socket.dispatchEvent(new MessageEvent('message', { data: JSON.stringify(telemetry()) }));
};

const emitAll = () => sockets.forEach(emit);

class BridgeWebSocket extends EventTarget {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;
  readyState = BridgeWebSocket.CONNECTING;
  url;

  constructor(url, protocols) {
    super();
    if (!String(url).startsWith('ws://127.0.0.1:8765')) return new NativeWebSocket(url, protocols);
    this.url = String(url);
    sockets.add(this);
    setTimeout(() => {
      this.readyState = BridgeWebSocket.OPEN;
      this.dispatchEvent(new Event('open'));
      emit(this);
    });
  }

  send(raw) {
    let command;
    try { command = JSON.parse(raw); } catch { return; }
    if (command.action === 'calibrate') {
      if (command.operation === 'begin' || command.operation === 'reset') beginCalibration();
      if (command.operation === 'capture') captureCalibration();
      if (command.operation === 'cancel') cancelCalibration();
      emitAll();
      return;
    }
    if (command.action === 'led' && Array.isArray(command.color)) {
      parent.postMessage({ type: 'modi-command', action: 'led', red: command.color[0], green: command.color[1], blue: command.color[2] }, location.origin);
    }
    if (command.action === 'tone') {
      parent.postMessage({ type: 'modi-command', action: 'speaker', frequency: command.frequency, volume: command.volume }, location.origin);
      setTimeout(() => parent.postMessage({ type: 'modi-command', action: 'speaker', frequency: 0, volume: 0 }, location.origin), Number(command.duration) || 120);
    }
    if (command.action === 'music') parent.postMessage({ type: 'modi-command', action: 'speaker', frequency: 1046, volume: command.volume ?? 70 }, location.origin);
    if (command.action === 'stop') parent.postMessage({ type: 'modi-command', action: 'speaker', frequency: 0, volume: 0 }, location.origin);
  }

  close() {
    this.readyState = BridgeWebSocket.CLOSED;
    sockets.delete(this);
    this.dispatchEvent(new CloseEvent('close'));
  }
}

window.WebSocket = BridgeWebSocket;
addEventListener('message', (event) => {
  if (event.origin !== location.origin || event.data?.type !== 'modi-hardware-state') return;
  device = event.data.device;
  const nextReady = inputReady();
  if (ready && !nextReady) sockets.forEach((socket) => socket.close());
  if (!ready && nextReady) calibration = createCalibration();
  ready = nextReady;
  if (ready) {
    observeCalibration();
    emitAll();
  }
});
})();
