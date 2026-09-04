let playing = false;
let volume = 65;
let lastNote = 0;
let noteCount = 0;
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
    return json({ frequency: lastNote, volume: Number(body.volume) || volume, duration: Number(body.duration) || .28, note_count: noteCount });
  }
  if (path === '/api/state') {
    volume = Math.max(0, Math.min(100, Math.round(Number(body.volume) || 0)));
    return json({ mode: 'mock', playing, volume, volume_control: 'screen', last_note: lastNote, note_count: noteCount });
  }
  if (path === '/api/stop') return json({ stopped: true });
  return nativeFetch(input, options);
};
navigator.sendBeacon = () => true;
