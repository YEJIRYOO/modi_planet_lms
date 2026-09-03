export interface ModuleInfo { name: string; img?: string; }

export const MODULE_IMG_BASE = '/modules/';

export const MODULE_INFO: Record<string, ModuleInfo> = {
  network: { name: '네트워크', img: 'Network.png' },
  button: { name: '버튼', img: 'Button.png' },
  dial: { name: '다이얼', img: 'Dial.png' },
  joystick: { name: '조이스틱', img: 'Joystick.png' },
  env: { name: '환경 센서', img: 'ENV.png' },
  imu: { name: '자이로(IMU)', img: 'IMU.png' },
  tof: { name: '거리 센서(ToF)', img: 'ToF.png' },
  motor_a: { name: '모터 A', img: 'Motor_A.png' },
  motor_b: { name: '모터 B', img: 'Motor_B.png' },
  led: { name: 'LED', img: 'LED.png' },
  speaker: { name: '스피커', img: 'Speaker.png' },
  display: { name: '디스플레이', img: 'Display.png' },
  wheel: { name: '바퀴' },
  i_horn: { name: 'I-혼' },
  basic_brick: { name: '기본 브릭' },
  extra_wheel_brick: { name: '보조 바퀴' },
};

export function moduleName(key: string): string {
  return MODULE_INFO[key]?.name ?? key;
}

export function moduleImg(key: string): string | undefined {
  const f = MODULE_INFO[key]?.img;
  return f ? MODULE_IMG_BASE + f : undefined;
}