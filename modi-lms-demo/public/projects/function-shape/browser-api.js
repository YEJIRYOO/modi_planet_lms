const specs = {
  linear: { names: ['a', 'b'], ranges: { a: [-3, 3], b: [-4, 4] } },
  absolute: { names: ['a', 'h', 'k'], ranges: { a: [-3, 3], h: [-4, 4], k: [-4, 4] } },
  quadratic: { names: ['a', 'h', 'k'], ranges: { a: [-2, 2], h: [-4, 4], k: [-4, 4] } },
};
let state;
let nextAt = 0;
let totalScore = 0;
let round = 0;
const pick = ([low, high], nonzero = false) => {
  let value;
  do value = Math.round((low + Math.random() * (high - low)) * 2) / 2; while (nonzero && value === 0);
  return value;
};
const reset = () => {
  round += 1;
  const family = ['linear', 'absolute', 'quadratic'][(round - 1) % 3];
  const spec = specs[family];
  state = { family, target: {}, params: {}, nudges: {}, selectedIndex: 0, accuracy: 0, feedback: 'shape_the_graph' };
  spec.names.forEach((name) => {
    state.target[name] = pick(spec.ranges[name], name === 'a');
    state.params[name] = name === 'a' ? 1 : 0;
    state.nudges[name] = 0;
  });
};
const value = (family, params, x) => family === 'linear' ? params.a * x + params.b : family === 'absolute' ? params.a * Math.abs(x - params.h) + params.k : params.a * (x - params.h) ** 2 + params.k;
const grade = () => {
  let error = 0;
  for (let index = 0; index < 81; index += 1) {
    const x = -5 + index / 8;
    error += Math.min(16, Math.abs(value(state.family, state.target, x) - value(state.family, state.params, x)));
  }
  return Math.max(0, Math.min(100, Math.round(100 * (1 - error / 81 / 8))));
};
reset();
const nativeFetch = fetch.bind(window);
const json = (data) => Promise.resolve(new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } }));
window.fetch = (input, options) => {
  const path = new URL(typeof input === 'string' ? input : input.url, location.href).pathname;
  if (path !== '/api/state') return nativeFetch(input, options);
  if (nextAt && performance.now() >= nextAt) {
    nextAt = 0;
    reset();
  }
  const body = JSON.parse(options?.body || '{}');
  const spec = specs[state.family];
  if (body.joystick === 'left') state.selectedIndex = (state.selectedIndex - 1 + spec.names.length) % spec.names.length;
  if (body.joystick === 'right') state.selectedIndex = (state.selectedIndex + 1) % spec.names.length;
  const selected = spec.names[state.selectedIndex];
  if (body.joystick === 'up' || body.joystick === 'down') state.nudges[selected] = Math.round((state.nudges[selected] + (body.joystick === 'up' ? .1 : -.1)) * 10) / 10;
  const [low, high] = spec.ranges[selected];
  const dial = Math.max(0, Math.min(100, Number(body.dial) || 0));
  state.params[selected] = Math.round(Math.max(low, Math.min(high, low + dial / 100 * (high - low) + state.nudges[selected])) * 10) / 10;
  if (body.button && !nextAt) {
    state.accuracy = grade();
    state.feedback = state.accuracy >= 90 ? 'matched' : state.accuracy >= 70 ? 'close' : 'try_again';
    if (state.accuracy >= 90) {
      totalScore += state.accuracy;
      nextAt = performance.now() + 1800;
    }
  }
  return json({ mode: 'mock', family: state.family, round, params: state.params, target: state.target, selected, dial, accuracy: state.accuracy, feedback: state.feedback, total_score: totalScore });
};
