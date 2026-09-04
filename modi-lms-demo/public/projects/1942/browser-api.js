(function () {
let hardware = null;
let lastLed = '';
let lastMotor = null;
addEventListener('message', (event) => {
  if (event.origin === location.origin && event.data?.type === 'modi-hardware-state') hardware = event.data.device;
});
const nativeFetch = fetch.bind(window);
const response = (value) => Promise.resolve(new Response(JSON.stringify(value), { headers: { 'Content-Type': 'application/json' } }));
window.fetch = (input, options) => {
  const path = new URL(typeof input === 'string' ? input : input.url, location.href).pathname;
  if (path === '/api/state') {
    const body = JSON.parse(options?.body || '{}');
    const live = hardware?.status === 'connected' && hardware.imu && hardware.buttonPressed !== null;
    if (live) {
      const led = hardware.buttonPressed ? '255,70,20' : '20,90,255';
      if (led !== lastLed) {
        lastLed = led;
        const [red, green, blue] = led.split(',').map(Number);
        parent.postMessage({ type: 'modi-command', action: 'led', red, green, blue }, location.origin);
      }
      if (hardware.modules?.some((module) => module.type === 'motor')) {
        const speed = Math.round(Math.max(-90, Math.min(90, hardware.imu.roll)) * 60 / 90);
        if (speed !== lastMotor) {
          lastMotor = speed;
          parent.postMessage({ type: 'modi-command', action: 'motor', speed }, location.origin);
        }
      }
    }
    return response({
      mode: live ? 'real' : 'mock',
      controls: live ? hardware.imu : { pitch: Number(body.pitch) || 0, roll: Number(body.roll) || 0 },
      attack: live ? hardware.buttonPressed === true : false,
    });
  }
  if (path === '/api/health') return response({ mode: 'mock', connected: true, error: null });
  if (path === '/api/stop') return response({ stopped: true });
  return nativeFetch(input, options);
};
const nativeBeacon = navigator.sendBeacon?.bind(navigator);
navigator.sendBeacon = (url, data) => new URL(String(url), location.href).pathname === '/api/stop' || nativeBeacon?.(url, data) || false;
})();
