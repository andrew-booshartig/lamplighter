/* How much main-thread time the Atlas map spends on each frame while it zooms, pans and glides. Paste the whole file into the browser console on the Atlas page (#/atlas) and read the table it returns.
   It makes no network requests and changes nothing on disk. What it measures, and what it cannot:
   - it times the work the page's own script does per frame (recording the drawing commands), with the page's requestAnimationFrame replaced by a 16 ms timer so it runs in a hidden or unfocused tab
   - it does not time the graphics card or the compositor, which run in other processes and are not visible to the page; a map that is cheap here is cheaper there, but this is not a frame-rate counter
   - it pretends the screen has 2x pixel density, as a laptop display does, so the numbers are the harder case
   To compare two builds, run it in each in a freshly loaded page and compare the rows. A frame over 8 ms leaves too little of a 120 Hz frame, over 16 ms of a 60 Hz one. */
(async () => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const st0 = window.setTimeout.bind(window); let rec = null;
  window.requestAnimationFrame = (cb) => st0(() => { const t0 = performance.now(); cb(t0); const d = performance.now() - t0; if (rec && d > 0.25) rec.push(d); }, 16);
  Object.defineProperty(window, 'devicePixelRatio', { value: 2, configurable: true });
  document.getElementById('atlLens').dispatchEvent(new Event('change', { bubbles: true })); await sleep(900);   /* the map reads the pixel density when it is resized */
  const wrap = document.getElementById('atlWrap'); const cv = document.getElementById('atlMap'); wrap.scrollIntoView({ block: 'center' });
  document.getElementById('atlReset').click(); await sleep(1500);
  const r = wrap.getBoundingClientRect(); const cx = r.left + r.width * 0.55; const cy = r.top + r.height * 0.4;
  const wheel = (dy) => wrap.dispatchEvent(new WheelEvent('wheel', { deltaY: dy, clientX: cx, clientY: cy, bubbles: true, cancelable: true }));
  const ptr = (type, x, y) => cv.dispatchEvent(new PointerEvent(type, { pointerId: 1, clientX: x, clientY: y, bubbles: true, isPrimary: true, buttons: 1 }));
  const out = { canvas: cv.width + ' x ' + cv.height };
  const phase = async (name, fn) => { await sleep(300); rec = []; await fn(); await sleep(700); const a = rec.slice().sort((x, y) => x - y); rec = null; const q = (p) => a[Math.min(a.length - 1, Math.floor(a.length * p))]; out[name] = a.length ? { frames: a.length, median_ms: +q(0.5).toFixed(1), p95_ms: +q(0.95).toFixed(1), worst_ms: +a[a.length - 1].toFixed(1), total_ms: Math.round(a.reduce((s, x) => s + x, 0)), over_8ms: a.filter((x) => x > 8).length } : 'no frames'; };
  await phase('zoom in 14 mouse-wheel notches', async () => { for (let i = 0; i < 14; i++) { wheel(-100); await sleep(60); } await sleep(900); });
  await phase('drag the map at 40x, then let it glide', async () => { ptr('pointerdown', cx, cy); for (let i = 1; i <= 40; i++) { ptr('pointermove', cx - i * 6, cy + i * 2); await sleep(16); } ptr('pointerup', cx - 240, cy + 80); await sleep(1200); });
  await phase('zoom out 14 mouse-wheel notches', async () => { for (let i = 0; i < 14; i++) { wheel(100); await sleep(60); } await sleep(900); });
  await phase('zoom in 7 notches, then drag at about 3x', async () => { for (let i = 0; i < 7; i++) { wheel(-100); await sleep(60); } await sleep(900); rec = []; ptr('pointerdown', cx, cy); for (let i = 1; i <= 40; i++) { ptr('pointermove', cx - i * 6, cy + i * 2); await sleep(16); } ptr('pointerup', cx - 240, cy + 80); await sleep(1200); });
  await phase('the + button three times, then Reset view', async () => { for (let i = 0; i < 3; i++) { document.getElementById('atlZoomIn').click(); await sleep(250); } await sleep(600); document.getElementById('atlReset').click(); await sleep(1200); });
  console.table(out); return out;
})();
