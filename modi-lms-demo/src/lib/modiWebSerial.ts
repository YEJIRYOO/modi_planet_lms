/* MODI+ 브라우저 연결.
   MODI+ Network Module은 USB CDC/serial 장치(VID 0x2FDE, PID 0x0003)이며
   pymodi-plus와 같은 921600 baud + JSON packet 프로토콜을 사용한다. */

export type ModiModuleType =
  | 'network' | 'battery' | 'env' | 'imu' | 'button' | 'dial'
  | 'joystick' | 'tof' | 'display' | 'motor' | 'led' | 'speaker';

export interface ConnectedModiModule {
  id: number;
  uuid: string;
  type: ModiModuleType;
  lastSeenAt: number;
}

export type ModiSerialStatus = 'unsupported' | 'idle' | 'connecting' | 'connected' | 'error';

export interface ModiSerialSnapshot {
  status: ModiSerialStatus;
  modules: ConnectedModiModule[];
  imu: { roll: number; pitch: number } | null;
  buttonPressed: boolean | null;
  error: string | null;
}

interface SerialReader { read(): Promise<{ value?: Uint8Array; done: boolean }>; cancel(): Promise<void>; releaseLock(): void }
interface SerialWriter { write(data: Uint8Array): Promise<void>; close(): Promise<void>; releaseLock(): void }
interface SerialPortLike {
  readable: { getReader(): SerialReader } | null;
  writable: { getWriter(): SerialWriter } | null;
  open(options: { baudRate: number; bufferSize?: number }): Promise<void>;
  close(): Promise<void>;
}
interface SerialApi {
  requestPort(options?: { filters?: Array<{ usbVendorId?: number; usbProductId?: number }> }): Promise<SerialPortLike>;
  getPorts(): Promise<SerialPortLike[]>;
  addEventListener(type: 'disconnect', listener: (event: Event) => void): void;
}

const MODI_FILTER = { usbVendorId: 0x2fde, usbProductId: 0x0003 };
const BROADCAST_ID = 0xfff;
const encoder = new TextEncoder();

function serialApi(): SerialApi | undefined {
  return (navigator as Navigator & { serial?: SerialApi }).serial;
}

function bytesToBase64(bytes: number[]): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte & 0xff);
  return btoa(binary);
}

function packet(c: number, s: number, d: number, bytes: number[]): string {
  return JSON.stringify({ c, s, d, b: bytesToBase64(bytes), l: bytes.length });
}

function moduleType(uuid: bigint): ModiModuleType {
  const type = Number(uuid >> 32n);
  return ({
    0x10: 'battery', 0x2000: 'env', 0x2010: 'imu', 0x2030: 'button',
    0x2040: 'dial', 0x2070: 'joystick', 0x2080: 'tof', 0x4000: 'display',
    0x4010: 'motor', 0x4011: 'motor', 0x4020: 'led', 0x4030: 'speaker',
  } as Record<number, ModiModuleType>)[type] ?? 'network';
}

function decodeUuid(base64: string): bigint {
  const raw = atob(base64);
  let value = 0n;
  for (let i = Math.min(6, raw.length) - 1; i >= 0; i -= 1) value = (value << 8n) | BigInt(raw.charCodeAt(i));
  return value;
}

class ModiWebSerial {
  private port: SerialPortLike | null = null;
  private reader: SerialReader | null = null;
  private writer: SerialWriter | null = null;
  private readTask: Promise<void> | null = null;
  private sensorTimer: number | null = null;
  private buffer = '';
  private listeners = new Set<() => void>();
  private snapshot: ModiSerialSnapshot = {
    status: typeof navigator !== 'undefined' && serialApi() ? 'idle' : 'unsupported',
    modules: [], imu: null, buttonPressed: null, error: null,
  };

  constructor() {
    serialApi()?.addEventListener('disconnect', () => { void this.disconnect(); });
  }

  getSnapshot = () => this.snapshot;
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => this.listeners.delete(listener); };
  private update(next: Partial<ModiSerialSnapshot>) {
    this.snapshot = { ...this.snapshot, ...next };
    this.listeners.forEach((listener) => listener());
  }

  async connect(): Promise<void> {
    const api = serialApi();
    if (!api) { this.update({ status: 'unsupported' }); return; }
    this.update({ status: 'connecting', error: null });
    try {
      this.port = await api.requestPort({ filters: [MODI_FILTER] });
      await this.openPort();
    } catch (error) {
      if ((error as DOMException)?.name === 'NotFoundError') this.update({ status: 'idle' });
      else this.update({ status: 'error', error: error instanceof Error ? error.message : String(error) });
    }
  }

  /** 이전에 권한을 준 장치는 페이지 재방문 시 사용자 팝업 없이 복구한다. */
  async reconnectGranted(): Promise<void> {
    const api = serialApi();
    if (!api || this.port || this.snapshot.status === 'connecting') return;
    const [port] = await api.getPorts();
    if (!port) return;
    this.port = port;
    this.update({ status: 'connecting', error: null });
    try { await this.openPort(); }
    catch (error) { this.port = null; this.update({ status: 'error', error: error instanceof Error ? error.message : String(error) }); }
  }

  private async openPort() {
    if (!this.port) return;
    await this.port.open({ baudRate: 921600, bufferSize: 65536 });
    if (!this.port.readable || !this.port.writable) throw new Error('MODI 시리얼 스트림을 열 수 없습니다.');
    this.reader = this.port.readable.getReader();
    this.writer = this.port.writable.getWriter();
    this.update({ status: 'connected', modules: [], error: null });
    this.readTask = this.readLoop();
    // 공식 pymodi-plus와 동일: 들어오는 health packet을 보고 ID/UUID 정보를 요청한다.
    await this.send(packet(0x08, 0, BROADCAST_ID, [0xff, 0x0f]));
    window.setTimeout(() => { if (this.snapshot.status === 'connected') void this.send(packet(0x08, 0, BROADCAST_ID, [0xff, 0x0f])); }, 500);
    this.sensorTimer = window.setInterval(() => { void this.requestTestSensors(); }, 1200);
  }

  private async send(value: string) { await this.writer?.write(encoder.encode(value)); }

  private async readLoop() {
    const decoder = new TextDecoder();
    try {
      while (this.reader) {
        const { value, done } = await this.reader.read();
        if (done) break;
        if (value) this.consume(decoder.decode(value, { stream: true }));
      }
    } catch (error) {
      if (this.snapshot.status === 'connected') this.update({ status: 'error', error: error instanceof Error ? error.message : String(error) });
    }
  }

  private consume(chunk: string) {
    this.buffer += chunk;
    while (true) {
      const start = this.buffer.indexOf('{');
      if (start < 0) { this.buffer = ''; return; }
      const end = this.buffer.indexOf('}', start);
      if (end < 0) { this.buffer = this.buffer.slice(start); return; }
      const raw = this.buffer.slice(start, end + 1);
      this.buffer = this.buffer.slice(end + 1);
      try { this.onPacket(JSON.parse(raw) as { c: number; s: number; d?: number; b: string }); } catch { /* 다음 packet 계속 처리 */ }
    }
  }

  private onPacket(message: { c: number; s: number; d?: number; b: string }) {
    if (message.c === 0x00) { // health: 아직 UUID를 모르는 모듈의 assign 정보를 요청
      if (!this.snapshot.modules.some((module) => module.id === message.s)) void this.send(packet(0x08, 0, message.s, [0xff, 0x0f]));
      else this.touch(message.s);
      return;
    }
    if (message.c === 0x1f && message.b) { // property response
      this.onProperty(message);
      return;
    }
    if (message.c !== 0x05 || !message.b) return; // assign-id response
    const uuid = decodeUuid(message.b);
    const next: ConnectedModiModule = { id: message.s, uuid: uuid.toString(16).toUpperCase(), type: moduleType(uuid), lastSeenAt: Date.now() };
    const modules = [...this.snapshot.modules.filter((module) => module.id !== next.id), next].sort((a, b) => a.id - b.id);
    this.update({ modules });
    void this.requestTestSensors();
  }

  /** pymodi-plus와 동일한 property 구독 요청: sampling frequency 91 ≈ 100ms. */
  private async requestTestSensors() {
    if (this.snapshot.status !== 'connected') return;
    const sensors = this.snapshot.modules.filter((module) => module.type === 'imu' || module.type === 'button');
    for (const module of sensors) await this.send(packet(0x03, 0, module.id, [2, 0, 91, 0]));
  }

  private onProperty(message: { s: number; d?: number; b: string }) {
    if (message.d !== 2) return;
    const module = this.snapshot.modules.find((item) => item.id === message.s);
    if (!module) return;
    const raw = atob(message.b);
    const bytes = Uint8Array.from(raw, (char) => char.charCodeAt(0));
    const view = new DataView(bytes.buffer);

    if (module.type === 'imu' && bytes.length >= 8) {
      const roll = view.getFloat32(0, true);
      const pitch = view.getFloat32(4, true);
      if (Number.isFinite(roll) && Number.isFinite(pitch)) this.update({ imu: { roll, pitch } });
    } else if (module.type === 'button' && bytes.length >= 6) {
      this.update({ buttonPressed: view.getUint16(4, true) === 100 });
    }
  }

  private touch(id: number) {
    const now = Date.now();
    this.update({ modules: this.snapshot.modules.map((module) => module.id === id ? { ...module, lastSeenAt: now } : module) });
  }

  async disconnect(): Promise<void> {
    const reader = this.reader;
    this.reader = null;
    try { await reader?.cancel(); } catch { /* already closed */ }
    try { reader?.releaseLock(); } catch { /* already released */ }
    try { await this.writer?.close(); } catch { /* disconnected */ }
    try { this.writer?.releaseLock(); } catch { /* already released */ }
    this.writer = null;
    try { await this.readTask; } catch { /* handled in loop */ }
    this.readTask = null;
    try { await this.port?.close(); } catch { /* already disconnected */ }
    this.port = null;
    this.buffer = '';
    if (this.sensorTimer != null) window.clearInterval(this.sensorTimer);
    this.sensorTimer = null;
    this.update({ status: serialApi() ? 'idle' : 'unsupported', modules: [], imu: null, buttonPressed: null, error: null });
  }
}

export const modiWebSerial = new ModiWebSerial();
