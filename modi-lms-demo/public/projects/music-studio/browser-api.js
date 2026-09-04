(function () {
let playing = false;
let volume = 65;
let lastNote = 0;
let noteCount = 0;
let hardware = null;
let lastButton = false;
let lastAdjust = 0;
let stopTimer;
addEventListener('message', (event) => {
  if (event.origin === location.origin && event.data?.type === 'modi-hardware-state') hardware = event.data.device;
});
const nativeFetch = fetch.bind(window);
const json = (value) => Promise.resolve(new Response(JSON.stringify(value), { headers: { 'Content-Type': 'application/json' } }));
window.fetch = (input, options) => {
  const path = new URL(typeof input === 'string' ? input : input.url, location.href).pathname;
  const body = options?.body ? JSON.parse(options.body) : {};
  if (path === '/api/toggle') {
    playing = !playing;
    return json({ playing });
  }
  if (path === '/api/note') {
    lastNote = Math.round(Number(body.frequency) || 0);
    noteCount += 1;
    if (hardware?.status === 'connected' && hardware.modules?.some((module) => module.type === 'speaker')) {
      parent.postMessage({ type: 'modi-command', action: 'speaker', frequency: lastNote, volume: Number(body.volume) || volume }, location.origin);
      clearTimeout(stopTimer);
      stopTimer = setTimeout(() => parent.postMessage({ type: 'modi-command', action: 'speaker', frequency: 0, volume: 0 }, location.origin), (Number(body.duration) || .28) * 1000);
    }
    return json({ frequency: lastNote, volume: Number(body.volume) || volume, duration: Number(body.duration) || .28, note_count: noteCount });
  }
  if (path === '/api/state') {
    const has = (type) => hardware?.modules?.some((module) => module.type === type);
    const live = hardware?.status === 'connected' && has('button') && has('speaker') && (has('dial') || has('joystick'));
    let control = 'screen';
    if (live && hardware.dial) {
      volume = Math.max(0, Math.min(100, hardware.dial.turn));
      control = 'dial';
    } else if (live && hardware.joystick) {
      control = 'joystick';
      const now = performance.now();
      if ((hardware.joystick.direction === 'up' || hardware.joystick.direction === 'down') && now - lastAdjust >= 150) {
        volume = Math.max(0, Math.min(100, volume + (hardware.joystick.direction === 'up' ? 5 : -5)));
        lastAdjust = now;
      }
    } else {
      volume = Math.max(0, Math.min(100, Math.round(Number(body.volume) || 0)));
    }
    const pressed = live && hardware.button?.pressed === true;
    if (pressed && !lastButton) playing = !playing;
    lastButton = pressed;
    return json({ mode: live ? 'real' : 'mock', playing, volume, volume_control: control, last_note: lastNote, note_count: noteCount });
  }
  if (path === '/api/stop') return json({ stopped: true });
  return nativeFetch(input, options);
};
navigator.sendBeacon = () => true;
})();
