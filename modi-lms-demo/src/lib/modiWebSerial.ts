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
  imu: { roll: number; pitch: number; yaw: number } | null;
  dial: { turn: number; speed: number } | null;
  joystick: { x: number; y: number; direction: 'up' | 'down' | 'left' | 'right' | 'origin' } | null;
  env: { illuminance: number; temperature: number; humidity: number; volume: number } | null;
  tofDistance: number | null;
  button: { clicked: boolean; doubleClicked: boolean; pressed: boolean; toggled: boolean } | null;
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
  getInfo?(): { usbVendorId?: number; usbProductId?: number };
}
interface SerialApi {
  requestPort(options?: { filters?: Array<{ usbVendorId?: number; usbProductId?: number }> }): Promise<SerialPortLike>;
  getPorts(): Promise<SerialPortLike[]>;
  addEventListener(type: 'disconnect', listener: (event: Event) => void): void;
}

interface UsbEndpointLike { direction: 'in' | 'out'; endpointNumber: number }
interface UsbAlternateLike { interfaceClass: number; alternateSetting: number; endpoints: UsbEndpointLike[] }
interface UsbInterfaceLike { interfaceNumber: number; claimed?: boolean; alternates: UsbAlternateLike[] }
interface UsbConfigurationLike { interfaces: UsbInterfaceLike[] }
interface UsbTransferInResult { data?: DataView; status?: string }
interface UsbTransferOutResult { bytesWritten?: number; status?: string }
interface UsbDeviceLike {
  vendorId: number;
  productId: number;
  productName?: string;
  opened: boolean;
  configuration?: UsbConfigurationLike;
  open(): Promise<void>;
  close(): Promise<void>;
  selectConfiguration(value: number): Promise<void>;
  claimInterface(interfaceNumber: number): Promise<void>;
  releaseInterface?(interfaceNumber: number): Promise<void>;
  selectAlternateInterface(interfaceNumber: number, alternateSetting: number): Promise<void>;
  controlTransferOut(setup: { requestType: string; recipient: string; request: number; value: number; index: number }): Promise<UsbTransferOutResult>;
  transferIn(endpointNumber: number, length: number): Promise<UsbTransferInResult>;
  transferOut(endpointNumber: number, data: Uint8Array): Promise<UsbTransferOutResult>;
}
interface UsbApi {
  requestDevice(options: { filters: Array<{ vendorId: number; productId?: number }> }): Promise<UsbDeviceLike>;
  getDevices(): Promise<UsbDeviceLike[]>;
  addEventListener(type: 'disconnect', listener: (event: Event & { device?: UsbDeviceLike }) => void): void;
}

const MODI_USB_IDS = [
  { usbVendorId: 0x2fde, usbProductId: 0x0003 },
  { usbVendorId: 0x2fde, usbProductId: 0x0002 },
  { usbVendorId: 0x0483, usbProductId: 0x5740 },
] as const;
const BROADCAST_ID = 0xfff;
const encoder = new TextEncoder();

function usbApi(): UsbApi | undefined {
  return (navigator as Navigator & { usb?: UsbApi }).usb;
}

function prefersWebUsb(): boolean {
  return /Windows/i.test(navigator.userAgent) && !!usbApi();
}

function isModiUsbDevice(device: UsbDeviceLike): boolean {
  return device.vendorId === 0x2fde && device.productId >= 1 && device.productId <= 4;
}

function connectionAvailable(): boolean {
  return !!serialApi() || !!usbApi();
}

function isModiPort(port: SerialPortLike): boolean {
  const info = port.getInfo?.();
  return MODI_USB_IDS.some(({ usbVendorId, usbProductId }) =>
    info?.usbVendorId === usbVendorId && info.usbProductId === usbProductId);
}

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
  private usbDevice: UsbDeviceLike | null = null;
  private usbInEndpoint: number | null = null;
  private usbOutEndpoint: number | null = null;
  private usbInterfaceNumbers: number[] = [];
  private usbReadActive = false;
  private readTask: Promise<void> | null = null;
  private sensorTimer: number | null = null;
  private buffer = '';
  private discovering = new Set<number>();
  private sendQueue: Promise<void> = Promise.resolve();
  private listeners = new Set<() => void>();
  private snapshot: ModiSerialSnapshot = {
    status: typeof navigator !== 'undefined' && connectionAvailable() ? 'idle' : 'unsupported',
    modules: [], imu: null, dial: null, joystick: null, env: null, tofDistance: null,
    button: null, buttonPressed: null, error: null,
  };

  constructor() {
    serialApi()?.addEventListener('disconnect', () => { void this.disconnect(); });
    usbApi()?.addEventListener('disconnect', (event) => {
      if (!event.device || event.device === this.usbDevice) void this.disconnect();
    });
  }

  getSnapshot = () => this.snapshot;
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => this.listeners.delete(listener); };
  private update(next: Partial<ModiSerialSnapshot>) {
    this.snapshot = { ...this.snapshot, ...next };
    this.listeners.forEach((listener) => listener());
  }

  async connect(): Promise<void> {
    if (prefersWebUsb()) {
      await this.connectUsb();
      return;
    }
    const api = serialApi();
    if (!api) { this.update({ status: 'unsupported' }); return; }
    this.update({ status: 'connecting', error: null });
    try {
      this.port = await api.requestPort();
      await this.openPort();
    } catch (error) {
      if ((error as DOMException)?.name === 'NotFoundError') this.update({ status: 'idle' });
      else this.update({ status: 'error', error: error instanceof Error ? error.message : String(error) });
    }
  }

  /** 이전에 권한을 준 장치는 페이지 재방문 시 사용자 팝업 없이 복구한다. */
  async reconnectGranted(): Promise<void> {
    if (prefersWebUsb()) {
      const api = usbApi();
      if (!api || this.usbDevice || this.snapshot.status === 'connecting') return;
      const device = (await api.getDevices()).find(isModiUsbDevice);
      if (!device) return;
      this.update({ status: 'connecting', error: null });
      try { await this.openUsbDevice(device); }
      catch (error) {
        this.usbDevice = null;
        this.update({ status: 'error', error: this.connectionError(error, 'WebUSB') });
      }
      return;
    }
    const api = serialApi();
    if (!api || this.port || this.snapshot.status === 'connecting') return;
    const ports = await api.getPorts();
    const port = ports.find(isModiPort);
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
    this.readTask = this.readLoop();
    await this.afterConnected();
  }

  private async connectUsb() {
    const api = usbApi();
    if (!api) { this.update({ status: 'unsupported' }); return; }
    this.update({ status: 'connecting', error: null });
    try {
      const device = await api.requestDevice({
        filters: [1, 2, 3, 4].map((productId) => ({ vendorId: 0x2fde, productId })),
      });
      await this.openUsbDevice(device);
    } catch (error) {
      if ((error as DOMException)?.name === 'NotFoundError') this.update({ status: 'idle' });
      else {
        try { await this.usbDevice?.close(); } catch { /* 열기 실패 후 정리 */ }
        this.usbDevice = null;
        this.update({ status: 'error', error: this.connectionError(error, 'WebUSB') });
      }
    }
  }

  private async openUsbDevice(device: UsbDeviceLike) {
    this.usbDevice = device;
    this.usbInterfaceNumbers = [];
    this.usbInEndpoint = null;
    this.usbOutEndpoint = null;
    if (!device.opened) await device.open();
    if (!device.configuration) await device.selectConfiguration(1);

    const interfaces = device.configuration?.interfaces ?? [];
    const endpointCandidates = interfaces.flatMap((iface) => iface.alternates.map((alternate) => ({ iface, alternate })))
      .filter(({ alternate }) => alternate.endpoints.some((endpoint) => endpoint.direction === 'in')
        && alternate.endpoints.some((endpoint) => endpoint.direction === 'out'))
      .sort((left, right) => Number(right.alternate.interfaceClass === 0xff) - Number(left.alternate.interfaceClass === 0xff));

    let selected: { iface: UsbInterfaceLike; alternate: UsbAlternateLike } | undefined;
    for (const candidate of endpointCandidates) {
      try {
        if (!candidate.iface.claimed) await device.claimInterface(candidate.iface.interfaceNumber);
        await device.selectAlternateInterface(candidate.iface.interfaceNumber, candidate.alternate.alternateSetting);
        this.usbInterfaceNumbers.push(candidate.iface.interfaceNumber);
        selected = candidate;
        break;
      } catch { /* 다음 인터페이스 확인 */ }
    }
    if (!selected) throw new Error('MODI USB 데이터 인터페이스를 열 수 없습니다. MODI+ USB 드라이버를 확인해 주세요.');

    for (const iface of interfaces) {
      if (this.usbInterfaceNumbers.includes(iface.interfaceNumber)) continue;
      try {
        if (!iface.claimed) await device.claimInterface(iface.interfaceNumber);
        this.usbInterfaceNumbers.push(iface.interfaceNumber);
      } catch { /* 데이터 인터페이스만으로 계속 시도 */ }
    }

    this.usbInEndpoint = selected.alternate.endpoints.find((endpoint) => endpoint.direction === 'in')?.endpointNumber ?? null;
    this.usbOutEndpoint = selected.alternate.endpoints.find((endpoint) => endpoint.direction === 'out')?.endpointNumber ?? null;
    if (this.usbInEndpoint == null || this.usbOutEndpoint == null) throw new Error('MODI USB 입출력 endpoint를 찾지 못했습니다.');

    for (const interfaceNumber of this.usbInterfaceNumbers) {
      try {
        await device.controlTransferOut({ requestType: 'class', recipient: 'interface', request: 0x22, value: 1, index: interfaceNumber });
        break;
      } catch { /* 제어 인터페이스 후보 계속 확인 */ }
    }

    this.usbReadActive = true;
    this.readTask = this.readUsbLoop();
    await this.afterConnected();
  }

  private async afterConnected() {
    this.update({ status: 'connected', modules: [], error: null });
    await this.setPnpOff();
    await this.discover(BROADCAST_ID);
    window.setTimeout(() => {
      if (this.snapshot.status === 'connected') void this.discover(BROADCAST_ID);
    }, 500);
    this.sensorTimer = window.setInterval(() => {
      void this.pollModules();
    }, 1200);
  }

  private connectionError(error: unknown, transport: string) {
    const message = error instanceof Error ? error.message : String(error);
    return `${transport} 연결 실패: ${message}`;
  }

  private send(value: string, interval = 0) {
    const operation = this.sendQueue.then(async () => {
      const bytes = encoder.encode(value);
      if (this.usbDevice && this.usbOutEndpoint != null) {
        const result = await this.usbDevice.transferOut(this.usbOutEndpoint, bytes);
        if (result.status && result.status !== 'ok') throw new Error(`MODI USB 쓰기 실패: ${result.status}`);
        if (result.bytesWritten != null && result.bytesWritten !== bytes.byteLength) {
          throw new Error(`MODI USB 쓰기 일부 완료: ${result.bytesWritten}/${bytes.byteLength}`);
        }
      } else {
        await this.writer?.write(bytes);
      }
      if (interval > 0) await new Promise<void>((resolve) => window.setTimeout(resolve, interval));
    });
    this.sendQueue = operation.catch(() => undefined);
    return operation;
  }

  private async sendWithInterval(value: string) {
    await this.send(value, 40);
  }

  private async setPnpOff(destination = BROADCAST_ID) {
    await this.sendWithInterval(packet(0x09, 0, destination, [0, 2]));
  }

  private async discover(destination: number) {
    if (this.discovering.has(destination)) return;
    this.discovering.add(destination);
    try {
      await this.sendWithInterval(packet(0x08, 0, destination, [0xff, 0x0f]));
      await this.sendWithInterval(packet(0x28, 0, destination, [0xff, 0x0f]));
    } finally {
      window.setTimeout(() => this.discovering.delete(destination), 200);
    }
  }

  private async pollModules() {
    await this.discover(BROADCAST_ID);
    await this.requestTestSensors();
  }

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

  private async readUsbLoop() {
    const decoder = new TextDecoder();
    try {
      while (this.usbReadActive && this.usbDevice?.opened && this.usbInEndpoint != null) {
        const result = await this.usbDevice.transferIn(this.usbInEndpoint, 256);
        if (result.status && result.status !== 'ok') throw new Error(`MODI USB 읽기 실패: ${result.status}`);
        if (result.data?.byteLength) {
          const bytes = new Uint8Array(result.data.buffer, result.data.byteOffset, result.data.byteLength);
          this.consume(decoder.decode(bytes, { stream: true }));
        }
      }
    } catch (error) {
      if (this.usbReadActive && this.snapshot.status === 'connected') {
        this.update({ status: 'error', error: this.connectionError(error, 'WebUSB') });
      }
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
      if (!this.snapshot.modules.some((module) => module.id === message.s)) void this.discover(message.s);
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
    void this.initializeModule(next.id);
  }

  private async initializeModule(moduleId: number) {
    await this.setPnpOff(moduleId);
    await this.setPnpOff();
    await this.requestTestSensors();
  }

  /** pymodi-plus와 동일한 property 구독 요청: sampling frequency 91 ≈ 100ms. */
  private async requestTestSensors() {
    if (this.snapshot.status !== 'connected') return;
    const sensors = this.snapshot.modules.filter((module) =>
      module.type === 'imu' || module.type === 'button' || module.type === 'dial' ||
      module.type === 'joystick' || module.type === 'env' || module.type === 'tof');
    for (const module of sensors) await this.sendWithInterval(packet(0x03, 0, module.id, [2, 0, 91, 0]));
  }

  private onProperty(message: { s: number; d?: number; b: string }) {
    if (message.d !== 2) return;
    const module = this.snapshot.modules.find((item) => item.id === message.s);
    if (!module) return;
    const raw = atob(message.b);
    const bytes = Uint8Array.from(raw, (char) => char.charCodeAt(0));
    const view = new DataView(bytes.buffer);

    if (module.type === 'imu' && bytes.length >= 12) {
      const roll = view.getFloat32(0, true);
      const pitch = view.getFloat32(4, true);
      const yaw = view.getFloat32(8, true);
      if ([roll, pitch, yaw].every(Number.isFinite)) this.update({ imu: { roll, pitch, yaw } });
    } else if (module.type === 'button' && bytes.length >= 8) {
      const button = {
        clicked: view.getUint16(0, true) === 100,
        doubleClicked: view.getUint16(2, true) === 100,
        pressed: view.getUint16(4, true) === 100,
        toggled: view.getUint16(6, true) === 100,
      };
      this.update({ button, buttonPressed: button.pressed });
    } else if (module.type === 'dial' && bytes.length >= 4) {
      this.update({ dial: { turn: view.getInt16(0, true), speed: view.getInt16(2, true) } });
    } else if (module.type === 'joystick' && bytes.length >= 4) {
      const x = view.getInt16(0, true);
      const y = view.getInt16(2, true);
      const direction = Math.max(Math.abs(x), Math.abs(y)) < 35
        ? 'origin'
        : Math.abs(x) >= Math.abs(y)
          ? x > 0 ? 'right' : 'left'
          : y > 0 ? 'up' : 'down';
      this.update({ joystick: { x, y, direction } });
    } else if (module.type === 'env' && bytes.length >= 8) {
      this.update({ env: {
        illuminance: view.getInt16(0, true),
        temperature: view.getInt16(2, true),
        humidity: view.getInt16(4, true),
        volume: view.getInt16(6, true),
      } });
    } else if (module.type === 'tof' && bytes.length >= 4) {
      const tofDistance = view.getFloat32(0, true);
      if (Number.isFinite(tofDistance)) this.update({ tofDistance });
    }
  }

  private async setProperty(type: ModiModuleType, property: number, bytes: number[]) {
    if (this.snapshot.status !== 'connected') return;
    const module = this.snapshot.modules.find((item) => item.type === type);
    if (module) await this.send(packet(0x04, property, module.id, bytes));
  }

  async setLed(red: number, green: number, blue: number) {
    const bytes = new Uint8Array(6);
    const view = new DataView(bytes.buffer);
    [red, green, blue].forEach((value, index) => view.setUint16(index * 2, Math.max(0, Math.min(255, Math.round(value))), true));
    await this.setProperty('led', 16, [...bytes]);
  }

  async setSpeaker(frequency: number, volume: number) {
    const bytes = new Uint8Array(4);
    const view = new DataView(bytes.buffer);
    view.setUint16(0, Math.max(0, Math.min(65535, Math.round(frequency))), true);
    view.setUint16(2, Math.max(0, Math.min(100, Math.round(volume))), true);
    await this.setProperty('speaker', 16, [...bytes]);
  }

  async setMotorSpeed(speed: number) {
    const bytes = new Uint8Array(4);
    new DataView(bytes.buffer).setInt32(0, Math.max(-100, Math.min(100, Math.round(speed))), true);
    await this.setProperty('motor', 17, [...bytes]);
  }

  private touch(id: number) {
    const now = Date.now();
    this.update({ modules: this.snapshot.modules.map((module) => module.id === id ? { ...module, lastSeenAt: now } : module) });
  }

  async disconnect(): Promise<void> {
    if (this.sensorTimer != null) window.clearInterval(this.sensorTimer);
    this.sensorTimer = null;
    this.usbReadActive = false;
    const usbDevice = this.usbDevice;
    this.usbDevice = null;
    if (usbDevice) {
      for (const interfaceNumber of this.usbInterfaceNumbers) {
        try {
          await usbDevice.controlTransferOut({ requestType: 'class', recipient: 'interface', request: 0x22, value: 0, index: interfaceNumber });
        } catch { /* 이미 연결 해제됨 */ }
      }
      try { await usbDevice.close(); } catch { /* 이미 연결 해제됨 */ }
    }
    this.usbInEndpoint = null;
    this.usbOutEndpoint = null;
    this.usbInterfaceNumbers = [];
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
    this.discovering.clear();
    this.sendQueue = Promise.resolve();
    this.update({
      status: connectionAvailable() ? 'idle' : 'unsupported', modules: [], imu: null, dial: null,
      joystick: null, env: null, tofDistance: null, button: null, buttonPressed: null, error: null,
    });
  }
}

export const modiWebSerial = new ModiWebSerial();
