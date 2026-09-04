let game;
let nextAt = 0;
let offset = 0;
let hardware = null;
let lastButton = false;
let lastDirection = 'origin';
let lastRepeat = 0;
addEventListener('message', (event) => {
  if (event.origin === location.origin && event.data?.type === 'modi-hardware-state') hardware = event.data.device;
});
const ranges = { easy: [2, 5], standard: [2, 9], challenge: [6, 12] };
const random = (low, high) => Math.floor(low + Math.random() * (high - low + 1));
const question = () => {
  const [low, high] = ranges[game.difficulty];
  game.left = random(low, high);
  game.right = random(1, game.difficulty === 'challenge' ? 12 : 9);
  game.question += 1;
  game.answer = 0;
  game.feedback = 'ready';
  offset = 0;
};
const reset = (difficulty = 'standard') => {
  game = { difficulty: ranges[difficulty] ? difficulty : 'standard', question: 0, correct: 0, score: 0, streak: 0, answer: 0, feedback: 'ready', finished: false };
  nextAt = 0;
  question();
};
reset();
const nativeFetch = fetch.bind(window);
const json = (data) => Promise.resolve(new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } }));
window.fetch = (input, options) => {
  const path = new URL(typeof input === 'string' ? input : input.url, location.href).pathname;
  if (path !== '/api/state') return nativeFetch(input, options);
  const body = JSON.parse(options?.body || '{}');
  if (body.reset) reset(body.difficulty);
  if (nextAt && performance.now() >= nextAt) {
    nextAt = 0;
    if (game.question >= 10) game.finished = true;
    else question();
  }
  const has = (type) => hardware?.modules?.some((module) => module.type === type);
  const live = hardware?.status === 'connected' && has('joystick') && has('button');
  const rawDirection = live ? hardware.joystick?.direction ?? 'origin' : body.joystick;
  let direction = rawDirection;
  const interval = rawDirection === 'left' || rawDirection === 'right' ? 100 : 180;
  if (live && rawDirection !== 'origin' && rawDirection === lastDirection && performance.now() - lastRepeat < interval) direction = 'origin';
  if (direction !== 'origin') lastRepeat = performance.now();
  lastDirection = rawDirection;
  offset += ({ left: -1, right: 1, up: 10, down: -10 }[direction] || 0);
  const base = live && hardware.dial ? hardware.dial.turn : Number(body.dial) || 0;
  game.answer = Math.max(0, Math.min(144, Math.round(base) + offset));
  const pressed = live ? hardware.button?.pressed === true : body.button;
  const submitted = pressed && !lastButton;
  lastButton = pressed;
  if (submitted && !game.finished && !nextAt) {
    if (game.answer === game.left * game.right) {
      game.correct += 1;
      game.streak += 1;
      game.score += 100 + Math.min(100, game.streak * 10);
      game.feedback = 'correct';
      nextAt = performance.now() + 850;
      if (has('led')) parent.postMessage({ type: 'modi-command', action: 'led', red: 65, green: 255, blue: 100 }, location.origin);
      if (has('speaker')) parent.postMessage({ type: 'modi-command', action: 'speaker', frequency: 1046, volume: 75 }, location.origin);
      if (has('speaker')) setTimeout(() => parent.postMessage({ type: 'modi-command', action: 'speaker', frequency: 0, volume: 0 }, location.origin), 280);
    } else {
      game.streak = 0;
      game.score = Math.max(0, game.score - 10);
      game.feedback = 'wrong';
      if (has('led')) parent.postMessage({ type: 'modi-command', action: 'led', red: 255, green: 60, blue: 35 }, location.origin);
      if (has('speaker')) parent.postMessage({ type: 'modi-command', action: 'speaker', frequency: 698, volume: 75 }, location.origin);
      if (has('speaker')) setTimeout(() => parent.postMessage({ type: 'modi-command', action: 'speaker', frequency: 0, volume: 0 }, location.origin), 280);
    }
  }
  return json({ mode: live ? 'real' : 'mock', ...game, has_dial: has('dial'), has_led: has('led'), has_speaker: has('speaker') });
};
