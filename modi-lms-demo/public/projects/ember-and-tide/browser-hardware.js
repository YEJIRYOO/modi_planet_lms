(function () {
const NativeWebSocket = window.WebSocket;
const sockets = new Set();
let device = null;
let ready = false;

const hasModule = (type) => device?.modules?.some((module) => module.type === type) === true;
const inputReady = () => device?.status === 'connected' && hasModule('imu') && hasModule('joystick') && hasModule('env') && hasModule('button');
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
  calibration: {
    available: hasModule('imu') && hasModule('joystick'),
    required: false,
    active: false,
    calibrated: true,
    phase: 'complete',
    sampleCount: 20,
    sampleReady: true,
    error: '',
    imuAxis: 'x',
    imuSign: 1,
    joystickAxis: 'x',
    joystickSign: 1,
  },
  imu: device?.imu ?? { roll: 0, pitch: 0, yaw: 0 },
  joystick: device?.joystick ?? { x: 0, y: 0, direction: 'origin' },
  env: device?.env ?? { temperature: 24, illuminance: 72, humidity: 46, volume: 0 },
  button: device?.button ?? { pressed: false, clicked: false, doubleClicked: false, toggled: false },
  timestamp: Date.now(),
});

const emit = (socket) => {
  if (socket.readyState === BridgeWebSocket.OPEN && inputReady()) {
    socket.dispatchEvent(new MessageEvent('message', { data: JSON.stringify(telemetry()) }));
  }
};

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
  ready = nextReady;
  if (ready) sockets.forEach(emit);
});
})();
