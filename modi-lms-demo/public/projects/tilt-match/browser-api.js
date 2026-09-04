let hardware = null;
let score = 0;
let round = 1;
let latched = false;
let left = 'blue';
let right = 'orange';
let target = Math.random() < .5 ? 'blue' : 'orange';
addEventListener('message', (event) => {
  if (event.origin === location.origin && event.data?.type === 'modi-hardware-state') hardware = event.data.device;
});
const nativeFetch = fetch.bind(window);
const json = (value) => Promise.resolve(new Response(JSON.stringify(value), { headers: { 'Content-Type': 'application/json' } }));
window.fetch = (input, options) => {
  const path = new URL(typeof input === 'string' ? input : input.url, location.href).pathname;
  if (path !== '/api/state') return path === '/api/stop' ? json({ stopped: true }) : nativeFetch(input, options);
  const body = JSON.parse(options?.body || '{}');
  const live = hardware?.status === 'connected' && hardware.imu;
  const controls = live ? hardware.imu : { pitch: Number(body.pitch) || 0, roll: Number(body.roll) || 0 };
  const raw = controls[body.axis === 'pitch' ? 'pitch' : 'roll'];
  const delta = (raw - (Number(body.neutral) || 0)) * (Number(body.sign) || 1);
  let direction = Math.abs(delta) < 10 ? 'center' : delta > 0 ? 'right' : 'left';
  let feedback = 'center';
  if (body.calibrating) {
    latched = false;
    direction = 'center';
  } else if (direction === 'center') {
    if (latched) {
      latched = false;
      round += 1;
      if (Math.random() < .5) [left, right] = [right, left];
      target = Math.random() < .5 ? 'blue' : 'orange';
    }
  } else if (!latched) {
    latched = true;
    const targetSide = left === target ? 'left' : 'right';
    feedback = direction === targetSide ? 'correct' : 'wrong';
    score = Math.max(0, score + (feedback === 'correct' ? 1 : -1));
  } else {
    feedback = direction === (left === target ? 'left' : 'right') ? 'correct' : 'wrong';
  }
  return json({ mode: live ? 'real' : 'mock', controls, pitch: controls.pitch, roll: controls.roll, direction, left, right, target_color: target, score, round, feedback });
};
navigator.sendBeacon = () => true;
