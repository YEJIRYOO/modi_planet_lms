let game;
let nextAt = 0;
let offset = 0;
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
  offset += ({ left: -1, right: 1, up: 10, down: -10 }[body.joystick] || 0);
  game.answer = Math.max(0, Math.min(144, Math.round(Number(body.dial) || 0) + offset));
  if (body.button && !game.finished && !nextAt) {
    if (game.answer === game.left * game.right) {
      game.correct += 1;
      game.streak += 1;
      game.score += 100 + Math.min(100, game.streak * 10);
      game.feedback = 'correct';
      nextAt = performance.now() + 850;
    } else {
      game.streak = 0;
      game.score = Math.max(0, game.score - 10);
      game.feedback = 'wrong';
    }
  }
  return json({ mode: 'mock', ...game, has_dial: false, has_led: false, has_speaker: false });
};
