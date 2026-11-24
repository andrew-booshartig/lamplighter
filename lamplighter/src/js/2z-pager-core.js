/* ═══════════════════════════ 2z · The pager: pages that turn, reading layout and reading time ═══════════════════════════
   Pure functions, no page in them, so every rule here can be tested without a screen. A text can be read three ways: one section at a time, as one long scroll, or in pages
   that turn (like a printed book or an e-reader). This file holds what the paged view needs to decide: how wide a page is and how many fit on the screen, where a tap, a swipe,
   a key or a wheel turn leads, how many screens a section has, and how long the rest of a text will take at the reader's own pace.
   The settings a person can change are a short fixed list each, anything else is refused (the same rule as the reading themes in 2z-reading-core.js). */
const RL_MODES = { section: 'One section at a time', scroll: 'Scroll', page: 'Book pages', sheet: 'PDF sheets' };      // the four ways the reader can lay a text out (the choices kept in reader.layout), in plain words
/* What a reader is asked is shorter than the four: three styles, and for the first a switch (RL_STOP). "One section at a time" and "Scroll" are the same page, read the same way, and differ only in whether the
   text stops at the end of a section (with Previous and Next) or runs on into the next, so they are one choice with one switch. Each style has a plain name and one line that says what it is like. */
const RL_STYLES = [
  ['scroll', 'Scroll', 'Read straight down, as on a web page.'],
  ['page', 'Book pages', 'Turn pages like a book or an e-reader: tap the sides or swipe.'],
  ['sheet', 'PDF sheets', 'Pages one above the other, like a PDF, with zoom.'],
];
const RL_STOP = ['Stop at the end of each section', 'On: one section at a time, with Previous and Next buttons.', 'Off: the next section follows on as you read.'];      // the switch's name, and a line for each of its two states, so what the line says is what happens (UX-15 of UX_AUDIT.md: Scroll's own line used to promise that the next section follows on while the switch, on by default, stopped it)
const rlStyleOf = (mode) => (mode === 'page' || mode === 'sheet' ? mode : 'scroll');      // the style a mode belongs to
const rlModeFor = (style, stop) => (style === 'page' || style === 'sheet' ? style : stop ? 'section' : 'scroll');      // the mode for a style and whether the scroll stops at each section
const RL_SPREAD = { auto: 'Automatic', single: 'One page', double: 'Two pages' };
const RL_ANIM = { slide: 'Slide', fade: 'Fade', none: 'None' };
const RL_TAP = { sides: 'Sides turn', wide: 'Most turns forward', off: 'Menu only' };
const RL_MARGIN = { narrow: ['Narrow', 14], normal: ['Normal', 28], wide: ['Wide', 56] };   // the least space at each side of the page, in pixels
const RL_DIV = { num: 'Numbered', line: 'Line', off: 'None' };      // where the text scrolls (by section, scroll): a break at each page, with the page number, with just a line, or none
const RL_BAR = { show: 'Always shown', auto: 'Hide as I read', hide: 'Hidden' };      // the bars at the top and foot: kept on the screen; slide away as you read down and return as you scroll up or tap; or put away until asked for (a small tab brings them back)
const RL_LIGHT_MAX = 60;
const RL_DEFAULT = { mode: 'section', spread: 'auto', anim: 'slide', tap: 'sides', margin: 'normal', div: 'num', bar: 'show', dim: 0, warm: 0, awake: false, wheel: true };
const rlOwn = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
const rlInt = (v, lo, hi) => { const n = Math.round(+v); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : lo; };
/* anything not on the lists is dropped, the rest of the object is ignored */
function rlClean(p) {
  const o = Object.assign({}, RL_DEFAULT); if (!p || typeof p !== 'object') return o;
  const pick = (key, list) => { if (typeof p[key] === 'string' && rlOwn(list, p[key])) o[key] = p[key]; };
  pick('mode', RL_MODES); pick('spread', RL_SPREAD); pick('anim', RL_ANIM); pick('tap', RL_TAP); pick('margin', RL_MARGIN); pick('div', RL_DIV); pick('bar', RL_BAR);
  if (p.dim != null) o.dim = rlInt(p.dim, 0, RL_LIGHT_MAX);
  if (p.warm != null) o.warm = rlInt(p.warm, 0, RL_LIGHT_MAX);
  if (p.awake === true || p.awake === false) o.awake = p.awake;
  if (p.wheel === true || p.wheel === false) o.wheel = p.wheel;
  return o;
}
/* the two screen filters, as colours: dimming (black) and a warm light for the evening (amber, laid over the page so it only takes the blue out) */
function rlLight(dim, warm) {
  const d = rlInt(dim, 0, RL_LIGHT_MAX); const w = rlInt(warm, 0, RL_LIGHT_MAX);
  return { dim: d ? `rgba(0,0,0,${(d / 100).toFixed(2)})` : '', warm: w ? `rgba(255,147,41,${(w / 100 * 0.55).toFixed(2)})` : '' };
}

/* ── how a screen of text is laid out ── */
/* one page or two side by side: two only where the screen is wide and wider than it is tall (a tablet on its side, a computer), or when asked for and there is room */
function pgSpread(pref, vw, vh) {
  const p = rlOwn(RL_SPREAD, pref) ? pref : 'auto'; if (p === 'single') return 1;
  if (p === 'double') return vw >= 640 ? 2 : 1;
  return vw >= 1000 && vw >= vh * 1.2 ? 2 : 1;
}
/* the columns of a screen: cols pages across, each colW wide with gap between them, centred in availW with at least margin at each side. All whole pixels, so a page
   turn never leaves a sliver of the next page showing. colMax is the widest a line should be (the reader's Width setting, in pixels). */
function pgGeometry(availW, cols, colMax, margin, gap) {
  const c = cols === 2 ? 2 : 1; const g = Math.max(16, Math.round(+gap) || 40); const m = Math.max(0, Math.round(+margin) || 0);
  const room = Math.max(160, Math.floor(+availW || 0) - 2 * m); const widest = Math.max(160, Math.floor(+colMax) || 480);
  const colW = Math.max(120, Math.min(widest, Math.floor((room - (c - 1) * g) / c)));
  const clipW = c * colW + (c - 1) * g;
  return { cols: c, colW, gap: g, clipW, left: Math.max(0, Math.floor((Math.floor(+availW || 0) - clipW) / 2)) };
}
/* how many screens a section has, from the full width of its laid-out columns (scrollWidth) */
function pgPageCount(scrollW, geo) {
  const stride = geo.colW + geo.gap; const made = Math.max(1, Math.round(((+scrollW || 0) + geo.gap) / stride)); return Math.max(1, Math.ceil(made / geo.cols));
}
/* how far to slide the columns to show a page (pixels), and the page a paragraph that starts at x (pixels from the start of the columns) is on */
const pgShift = (page, geo) => Math.max(0, Math.round(page)) * (geo.clipW + geo.gap);
const pgPageOfX = (x, geo) => { const col = Math.max(0, Math.floor(((+x || 0) + geo.gap / 2) / (geo.colW + geo.gap))); return Math.floor(col / geo.cols); };      // x may be anywhere in a column, from its left edge to its right
/* the text size of a page of reading, as the number of lines that fit (a guide for the footer's estimate of the characters on a page) */
const pgCharsPerPage = (sectionChars, pages) => Math.max(1, Math.round((+sectionChars || 0) / Math.max(1, pages)));

/* ── turning ── */
/* where one turn leads from page `page` of section k (a section has `pages` screens, there are n sections); null at either end of the text. 'last' means the last
   screen of the section before, which is only known once that section is laid out. */
function pgTurn(k, page, pages, n, dir) {
  if (dir > 0) { if (page < pages - 1) return { k, page: page + 1 }; return k < n - 1 ? { k: k + 1, page: 0 } : null; }
  if (page > 0) return { k, page: page - 1 }; return k > 0 ? { k: k - 1, page: 'last' } : null;
}
/* what a tap at (x, y) in a w × h screen does: 'prev', 'next' or 'menu' */
function pgZone(x, y, w, h, mode) {
  if (mode === 'off' || !(w > 0) || !(h > 0)) return 'menu'; const fx = x / w; const fy = y / h;
  if (mode === 'wide') { if (fy < 0.14) return 'menu'; return fx < 0.22 ? 'prev' : 'next'; }
  return fx < 0.3 ? 'prev' : fx > 0.7 ? 'next' : 'menu';
}
/* what a finger drag of (dx, dy) over ms milliseconds on a w-wide screen means: 'next' (dragged left), 'prev' (dragged right), 'snap' (not far enough: spring back) or 'none' (not a sideways drag) */
function pgSwipe(dx, dy, ms, w) {
  const ax = Math.abs(dx); const ay = Math.abs(dy); if (ax < 10 || ax < ay * 1.3) return 'none';
  const v = ax / Math.max(1, ms); if (ax > (w || 320) * 0.2 || (v > 0.35 && ax > 28)) return dx < 0 ? 'next' : 'prev'; return 'snap';
}
/* what a key does in the paged view */
function pgKey(e) {
  if (!e || e.altKey || e.metaKey || (e.ctrlKey && !/^(Home|End)$/.test(e.key))) return null; const k = e.key;
  if (e.ctrlKey) return k === 'Home' ? 'start' : k === 'End' ? 'finish' : null;
  if (k === ' ' || k === 'Spacebar') return e.shiftKey ? 'prev' : 'next';
  if (e.shiftKey) return null;
  if (k === 'ArrowRight' || k === 'PageDown' || k === 'ArrowDown') return 'next';
  if (k === 'ArrowLeft' || k === 'PageUp' || k === 'ArrowUp') return 'prev';
  if (k === 'Home') return 'first'; if (k === 'End') return 'last'; if (k === ']') return 'nextSec'; if (k === '[') return 'prevSec';
  return null;
}
/* a mouse wheel or trackpad turns one page per gesture: movement under the threshold or soon after the last turn is ignored (a trackpad keeps sending events for a second after a flick). Returns the direction (1, -1 or 0) */
function pgWheel(dy, dx, lastTurn, now) {
  const d = Math.abs(dy) >= Math.abs(dx) ? dy : dx; if (Math.abs(d) < 18 || now - lastTurn < 520) return 0; return d > 0 ? 1 : -1;
}

/* ── how long reading takes ── */
const RD_CPM = { def: 1350, min: 400, max: 6000 };    // characters a minute: 1350 is about 225 words, an easy pace for unfamiliar text
const rdCpm = (v) => { const n = +v; return Number.isFinite(n) && n > 0 ? Math.min(RD_CPM.max, Math.max(RD_CPM.min, n)) : RD_CPM.def; };
/* a new estimate of the reader's pace from one stretch of reading (chars over ms), blended into the old one. Stretches too short to be reading, too long (they went away), or
   too fast or slow to be reading (skipping, or not looking) are ignored, so one odd page cannot throw the estimate. */
function rdSpeed(prev, chars, ms) {
  const base = rdCpm(prev); if (!(chars > 0) || !(ms > 0) || ms < 2500 || ms > 240000) return base;
  const cpm = chars * 60000 / ms; if (cpm > RD_CPM.max * 1.1 || cpm < 150) return base; return rdCpm(base * 0.8 + cpm * 0.2);
}
const rdMinutes = (chars, cpm) => Math.max(0, +chars || 0) / rdCpm(cpm);
function rdFmtLeft(min, suffix) {
  const s = suffix || ''; if (!Number.isFinite(min) || min < 0) return ''; if (min < 1) return 'Less than a minute left' + s;
  const m = Math.round(min); if (m < 60) return `${m} min left${s}`; const h = Math.floor(m / 60); const r = m % 60; return r ? `${h} h ${r} min left${s}` : `${h} h left${s}`;
}
/* the share of a text read: the characters before a place over all of them */
const rdShare = (before, total) => (total > 0 ? Math.min(1, Math.max(0, before / total)) : 0);
/* the footer under a page: the screen within the section, and the time the section has left */
function pgFootText(page, pages, minutesLeft) {
  const a = `Page ${Math.max(1, page + 1)} of ${Math.max(1, pages)}`; const t = rdFmtLeft(minutesLeft, ' in section'); return t ? `${a} · ${t}` : a;
}
/* the places a person jumped from, so one tap can take them back (Kindle's "Go back"): newest last, no repeats of the same place in a row, at most max kept */
function trailPush(trail, pos, max) {
  const t = (trail || []).slice(); const last = t[t.length - 1]; if (last && last.k === pos.k && last.p === pos.p) return t; t.push({ k: pos.k, p: pos.p }); return t.slice(-(max || 8));
}
if (typeof module !== 'undefined' && module.exports) module.exports = { RL_MODES, RL_STYLES, RL_STOP, rlStyleOf, rlModeFor, RL_SPREAD, RL_ANIM, RL_TAP, RL_MARGIN, RL_DIV, RL_BAR, RL_LIGHT_MAX, RL_DEFAULT, rlClean, rlLight, pgSpread, pgGeometry, pgPageCount, pgShift, pgPageOfX, pgCharsPerPage, pgTurn, pgZone, pgSwipe, pgKey, pgWheel, RD_CPM, rdCpm, rdSpeed, rdMinutes, rdFmtLeft, rdShare, pgFootText, trailPush };
