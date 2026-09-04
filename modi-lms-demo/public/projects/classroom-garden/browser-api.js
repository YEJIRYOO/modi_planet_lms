(function () {
let garden;
let hardware = null;
let lastButton = false;
let lastLed = '';
addEventListener('message', (event) => {
  if (event.origin === location.origin && event.data?.type === 'modi-hardware-state') hardware = event.data.device;
});
const band = (value, low, high, margin) => low <= value && value <= high ? 1 : Math.max(0, 1 - (value < low ? low - value : value - high) / margin);
const reset = (pace = 'lesson') => {
  const now = performance.now();
  garden = { pace: pace === 'demo' ? 'demo' : 'lesson', started: now, lastUpdate: now, growth: 0, soil: 52, happiness: 62, score: 0, waters: 0, pets: 0, lastNear: false, event: 'welcome', eventUntil: now + 2000 };
};
reset();
const nativeFetch = fetch.bind(window);
const json = (data) => Promise.resolve(new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } }));
window.fetch = (input, options) => {
  const path = new URL(typeof input === 'string' ? input : input.url, location.href).pathname;
  if (path !== '/api/state') return nativeFetch(input, options);
  const body = JSON.parse(options?.body || '{}');
  if (body.reset) reset(body.pace);
  const now = performance.now();
  const dt = Math.min(1, Math.max(0, (now - garden.lastUpdate) / 1000));
  garden.lastUpdate = now;
  const has = (type) => hardware?.modules?.some((module) => module.type === type);
  const live = hardware?.status === 'connected' && has('env') && has('dial') && has('button') && has('tof') && has('led');
  const temperature = live ? hardware.env?.temperature ?? 23 : Number(body.temperature) || 23;
  const humidity = live ? hardware.env?.humidity ?? 55 : Number(body.humidity) || 55;
  const light = live ? hardware.env?.illuminance ?? 65 : Number(body.light) || 65;
  const dial = live ? hardware.dial?.turn ?? 0 : Number(body.dial) || 0;
  const distance = live ? hardware.tofDistance ?? 100 : Number(body.distance) || 100;
  const tempQuality = band(temperature, 20, 26, 10);
  const humidityQuality = band(humidity, 40, 70, 30);
  const lightQuality = band(light, 40, 82, 35);
  const environmentQuality = (tempQuality + humidityQuality + lightQuality) / 3;
  garden.soil = Math.max(0, garden.soil - dt * (.025 + .02 * lightQuality));
  const waterAmount = Math.round((5 + dial * .22) * 10) / 10;
  const pressed = live ? hardware.button?.pressed === true : body.button;
  const watered = pressed && !lastButton;
  lastButton = pressed;
  if (watered) {
    const before = garden.soil;
    garden.soil = Math.min(100, garden.soil + waterAmount);
    garden.waters += 1;
    garden.happiness = Math.max(0, Math.min(100, garden.happiness + (before > 78 ? -7 : 3)));
    garden.score = Math.max(0, garden.score + (before > 78 ? -15 : 8));
    garden.event = 'water';
    garden.eventUntil = now + 1400;
  }
  const near = distance < 12;
  if (near && !garden.lastNear) {
    garden.pets += 1;
    garden.happiness = Math.min(100, garden.happiness + 8);
    garden.score += 6;
    garden.event = 'pet';
    garden.eventUntil = now + 1500;
  }
  garden.lastNear = distance < 18;
  const soilQuality = band(garden.soil, 35, 78, 28);
  const careQuality = environmentQuality * .7 + soilQuality * .3;
  garden.happiness = Math.max(0, Math.min(100, garden.happiness + dt * ((careQuality - .55) * .075)));
  const duration = garden.pace === 'lesson' ? 2100 : 240;
  if (environmentQuality >= .55 && soilQuality >= .45 && garden.happiness >= 35) {
    garden.growth = Math.min(100, garden.growth + dt * (100 / duration) * (.55 + careQuality * .65));
    garden.score += dt * careQuality * .28;
  }
  const stage = [0, 18, 38, 62, 84].reduce((result, threshold, index) => garden.growth >= threshold ? index : result, 0);
  const status = garden.soil < 25 ? 'thirsty' : garden.soil > 86 ? 'overwatered' : light < 28 ? 'dark' : temperature < 17 ? 'cold' : temperature > 30 ? 'hot' : humidity < 30 ? 'dry_air' : environmentQuality > .82 && garden.happiness > 65 ? 'happy' : 'growing';
  if (live) {
    const color = status === 'happy' || status === 'growing' ? [60, 255, 105] : status === 'thirsty' ? [40, 120, 255] : status === 'dark' || status === 'cold' || status === 'dry_air' ? [255, 190, 35] : [255, 70, 35];
    const key = color.join(',');
    if (key !== lastLed) {
      lastLed = key;
      parent.postMessage({ type: 'modi-command', action: 'led', red: color[0], green: color[1], blue: color[2] }, location.origin);
    }
  }
  const event = now < garden.eventUntil ? garden.event : null;
  const pose = event === 'water' || event === 'pet' ? 3 : ['thirsty', 'overwatered', 'dark', 'cold', 'hot', 'dry_air'].includes(status) ? 2 : status === 'happy' ? 1 : 0;
  const elapsed = (now - garden.started) / 1000;
  return json({ mode: live ? 'real' : 'mock', pace: garden.pace, elapsed, remaining: Math.max(0, duration - elapsed), temperature, humidity, light, dial, distance, water_amount: waterAmount, soil: Math.round(garden.soil * 10) / 10, happiness: Math.round(garden.happiness * 10) / 10, environment_quality: Math.round(environmentQuality * 100), growth: Math.round(garden.growth * 100) / 100, stage, pose, status, event, score: Math.round(garden.score), waters: garden.waters, pets: garden.pets, complete: garden.growth >= 100 });
};
})();
