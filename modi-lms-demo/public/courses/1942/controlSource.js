/**
 * controlSource.js — 조작값이 "어디서 오는지"를 갈아끼우는 층.
 *
 * 게임은 pitch / roll / button 세 값만 있으면 됩니다. 그 값이 화면의 슬라이더에서
 * 오든, 실제 MODI 모듈에서 오든 게임 코드는 알 필요가 없습니다. 그래서 소스를
 * 인터페이스로 분리했습니다. 수업에서는 mock으로 시작하고, 모듈이 준비되면
 * 소스만 바꿔 끼웁니다.
 *
 * 모든 소스는 read() 를 구현하고 {pitch, roll, button} 을 돌려줍니다.
 */

/** 하드웨어 없이 슬라이더 · 키보드 · 화면 버튼으로 조작합니다. */
export class MockSource {
  constructor({ pitchInput, rollInput }) {
    this.pitchInput = pitchInput;
    this.rollInput = rollInput;
    this.attackQueued = false;
  }

  get mode() {
    return 'mock';
  }

  get label() {
    return '모의 조작 · 슬라이더, 방향키, Space로 플레이하세요';
  }

  async connect() {
    return true;
  }

  queueAttack() {
    this.attackQueued = true;
  }

  read() {
    const button = this.attackQueued;
    this.attackQueued = false;
    return {
      pitch: Number(this.pitchInput.value),
      roll: Number(this.rollInput.value),
      button,
    };
  }

  disconnect() {}
}

/**
 * LMS(부모 창)가 modi-sdk.js로 하드웨어를 잡고, 센서값만 postMessage로 내려주는 방식.
 *
 * iframe 안에서는 SDK를 몰라도 되고, 연결 상태는 LMS 한 곳에서만 관리하면 됩니다.
 * 부모는 아래 형태로 보내면 됩니다:
 *   iframe.contentWindow.postMessage(
 *     { type: 'MODI_SENSOR', pitch: 12.4, roll: -3.1, button: false },
 *     '*'
 *   );
 */
export class ParentBridgeSource {
  constructor({ timeoutMs = 1500 } = {}) {
    this.latest = { pitch: 0, roll: 0, button: false };
    this.lastMessageAt = 0;
    this.timeoutMs = timeoutMs;
    this.onMessage = (event) => {
      const data = event.data;
      if (!data || data.type !== 'MODI_SENSOR') return;
      const pitch = Number(data.pitch);
      const roll = Number(data.roll);
      if (!Number.isFinite(pitch) || !Number.isFinite(roll)) return;
      this.latest = { pitch, roll, button: Boolean(data.button) };
      this.lastMessageAt = performance.now();
    };
  }

  get mode() {
    return this.isFresh() ? 'real' : 'stale';
  }

  get label() {
    return this.isFresh()
      ? `MODI 연결됨 · pitch ${this.latest.pitch.toFixed(0)}° · roll ${this.latest.roll.toFixed(0)}°`
      : 'MODI 신호를 기다리는 중입니다';
  }

  isFresh() {
    return performance.now() - this.lastMessageAt < this.timeoutMs;
  }

  async connect() {
    window.addEventListener('message', this.onMessage);
    // 부모에게 "준비됐다"고 알립니다. 부모는 이 신호를 받고 전송을 시작하면 됩니다.
    window.parent?.postMessage({ type: 'MODI_GAME_READY', project: '1942' }, '*');
    return true;
  }

  read() {
    // 신호가 끊기면 조작을 0으로 두어, 마지막 값이 계속 눌린 채로 남지 않게 합니다.
    if (!this.isFresh()) return { pitch: 0, roll: 0, button: false };
    return { ...this.latest };
  }

  disconnect() {
    window.removeEventListener('message', this.onMessage);
  }
}

/**
 * iframe 안에서 modi-sdk.js를 직접 쓰는 방식.
 *
 * SDK의 실제 메서드 이름은 버전마다 다르므로, 아래 표시된 세 곳만
 * 확인해서 맞추면 나머지는 그대로 동작합니다.
 */
export class ModiSdkSource {
  constructor(sdk = window.MODI) {
    this.sdk = sdk;
    this.bundle = null;
  }

  get mode() {
    return this.bundle ? 'real' : 'mock';
  }

  get label() {
    return this.bundle ? 'MODI 모듈 연결됨' : 'MODI 모듈을 찾지 못했습니다';
  }

  async connect() {
    if (!this.sdk) return false;
    // ── 확인 지점 1: 연결 시작 메서드 ────────────────────────────
    this.bundle = await this.sdk.connect();
    return Boolean(this.bundle);
  }

  read() {
    if (!this.bundle) return { pitch: 0, roll: 0, button: false };
    // ── 확인 지점 2: IMU 각도 읽기 ───────────────────────────────
    //    PyMODI+ 기준으로 angle_x가 roll, angle_y가 pitch입니다.
    const imu = this.bundle.imus?.[0];
    // ── 확인 지점 3: 버튼 상태 읽기 ──────────────────────────────
    const btn = this.bundle.buttons?.[0];
    return {
      pitch: Number(imu?.angle_y) || 0,
      roll: Number(imu?.angle_x) || 0,
      button: Boolean(btn?.pressed),
    };
  }

  disconnect() {
    this.bundle?.close?.();
    this.bundle = null;
  }
}

/**
 * URL 쿼리(?source=mock|bridge|sdk)를 보고 알맞은 소스를 고릅니다.
 * 수업에서는 기본값 mock으로 두면 아무 준비 없이 바로 시작할 수 있습니다.
 */
export function createControlSource(elements) {
  const requested = new URLSearchParams(location.search).get('source') || 'mock';
  if (requested === 'bridge') return new ParentBridgeSource();
  if (requested === 'sdk') return new ModiSdkSource();
  return new MockSource(elements);
}
