/* ═══════════════════════════ 2z · Sheets: the arithmetic of a PDF-style page view ═══════════════════════════
   The reader's fourth way of reading (6kb-sheets.js): the text laid out as page-sized sheets, one above the other, scrolled with the finger, the wheel or the scroll bar, the way a PDF
   viewer shows a book. Pure functions, no page in them, so every rule here can be tested without a screen: how big a sheet is, how many sheets a section has before it is measured,
   which sheet is where, which sections to keep drawn, where a key leads, how to zoom. */
const SH_PAPER = { a4: ['A4', 1.414], letter: ['Letter', 1.294], book: ['Book', 1.5] };       // name and height over width of a sheet
const SH_ZOOMS = [0.7, 0.85, 1, 1.2, 1.5, 1.8, 2.2];
const SH_GAP = 18;               // the gap between two sheets, in pixels
const SH_LINE = 1.62;            // the reader's line height, the one the estimate of a sheet's characters assumes
const shOwn = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
const shClamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
/* the nearest step of the zoom ladder to a value (anything else is refused) */
const shZoomClean = (z) => { const n = +z; if (!Number.isFinite(n)) return 1; return SH_ZOOMS.reduce((a, b) => (Math.abs(b - n) < Math.abs(a - n) ? b : a), 1); };
const shZoomStep = (z, dir) => { const i = SH_ZOOMS.indexOf(shZoomClean(z)); return SH_ZOOMS[shClamp(i + (dir > 0 ? 1 : -1), 0, SH_ZOOMS.length - 1)]; };
const shPaperClean = (p) => (typeof p === 'string' && shOwn(SH_PAPER, p) ? p : 'a4');

/* the size of a sheet and of the text area on it, for a view viewW pixels wide: the sheet fills the width up to maxW (more on a big screen is a waste of eye travel), less a gutter
   at each side, times the zoom; the margins are a share of the width, as on paper (narrower on a phone, where every letter of width counts). All whole pixels, so the columns of the text on a sheet never show a sliver of the next. */
function shGeometry(viewW, o) {
  const op = o || {}; const z = shZoomClean(op.zoom); const ratio = SH_PAPER[shPaperClean(op.paper)][1];
  const vw = Math.max(240, Math.floor(+viewW || 0)); const gut = vw >= 640 ? 24 : 10; const maxW = op.maxW > 0 ? Math.floor(op.maxW) : 820;
  const sheetW = Math.max(240, Math.round(Math.min(maxW, vw - 2 * gut) * z));
  const sheetH = Math.round(sheetW * ratio); const narrow = vw < 640; const padX = Math.round(sheetW * (narrow ? 0.06 : 0.095)); const padY = Math.round(sheetW * (narrow ? 0.055 : 0.075));
  const colW = sheetW - 2 * padX; const H = sheetH - 2 * padY; const colGap = 40;
  return { sheetW, sheetH, padX, padY, colW, H, colGap, stride: sheetH + SH_GAP, zoom: z, gut };
}
/* a guess at how many characters go on one sheet, from the size of the text area and of the type (before any section has been measured) */
function shCharsPerSheet(geo, fontPx) {
  const f = Math.max(10, +fontPx || 18); const lines = Math.max(4, Math.floor(geo.H / (f * SH_LINE))); const perLine = Math.max(12, Math.floor(geo.colW / (f * 0.5)));
  return Math.max(200, Math.round(lines * perLine * 0.88));
}
/* how many sheets a section has: the measured number if there is one, else the guess from its length */
const shSheets = (len, cps, measured) => (measured > 0 ? Math.round(measured) : Math.max(1, Math.ceil((+len || 0) / Math.max(1, cps))));
/* what a measured section teaches about the others: the characters one sheet really held, kept as a running blend so that one odd section does not move the guess for the rest */
function shLearn(cps, len, sheets) {
  if (!(len > 0) || !(sheets > 0)) return cps; const seen = len / sheets; if (!(seen > 80) || seen > 20000) return cps; return Math.round(cps * 0.7 + seen * 0.3);
}
/* the first sheet number of each section, and the total, from the sheet counts of all of them (counts[k] is the number of sheets, measured or guessed) */
function shCum(counts) { const cum = [0]; for (let i = 0; i < counts.length; i++) cum.push(cum[i] + Math.max(1, counts[i] | 0)); return cum; }
/* the section a (global, zero-based) sheet is in, and its place within that section */
function shAt(cum, g) {
  const total = cum[cum.length - 1]; const x = shClamp(Math.floor(+g || 0), 0, Math.max(0, total - 1)); let lo = 0; let hi = cum.length - 2;
  while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (cum[mid] <= x) lo = mid; else hi = mid - 1; }
  return { k: lo, i: x - cum[lo] };
}
/* the sections that are kept drawn when the reader is at k: span on each side, within 0..n-1 (the rest are only a block of the right height) */
function shWindow(k, n, span) {
  const s = Math.max(0, span | 0); const a = shClamp(k - s, 0, Math.max(0, n - 1)); const b = shClamp(k + s, 0, Math.max(0, n - 1)); const out = []; for (let x = a; x <= b; x++) out.push(x); return out;
}
/* the sheets of a section that need their text: those within `reach` pixels of the window of the screen, given where the first sheet starts (top) and the screen (scrollTop, viewH) */
function shVisible(top, count, geo, scrollTop, viewH, reach) {
  if (count < 1) return []; const r = Math.max(0, +reach || 0); const lo = scrollTop - r; const hi = scrollTop + viewH + r; const out = [];
  const from = Math.max(0, Math.floor((lo - top - geo.sheetH) / geo.stride) + 1); const to = Math.min(count - 1, Math.ceil((hi - top) / geo.stride) - 1);   // a sheet is seen when its bottom is below the top of the window and its top above the bottom
  for (let i = from; i <= to; i++) out.push(i); return out;
}
/* which sheet fills most of the screen: the one the middle of the top third of the screen falls on (the one being read) */
const shReading = (scrollTop, viewH, geo, firstTop) => Math.max(0, Math.floor((scrollTop + viewH * 0.33 - firstTop) / geo.stride));
/* what a key does in this view: the arrows and the wheel scroll the page as they always do, so only the keys that move by a whole sheet or a section are taken */
function shKey(e) {
  if (!e || e.altKey || e.metaKey || (e.ctrlKey && !/^(Home|End)$/.test(e.key))) return null; const k = e.key;
  if (e.ctrlKey) return k === 'Home' ? 'start' : k === 'End' ? 'finish' : null;
  if (k === ' ' || k === 'Spacebar') return e.shiftKey ? 'prev' : 'next';
  if (e.shiftKey) return null;
  if (k === 'PageDown') return 'next'; if (k === 'PageUp') return 'prev'; if (k === 'Home') return 'first'; if (k === 'End') return 'last'; if (k === ']') return 'nextSec'; if (k === '[') return 'prevSec';
  if (k === 'g') return 'goto';
  return null;
}
/* what a person typed in the "go to page" box: a number within 1..total, else null */
function shParsePage(s, total) { const m = /^\s*#?\s*(\d{1,6})\s*$/.exec(String(s == null ? '' : s)); if (!m) return null; const v = +m[1]; return v >= 1 && v <= Math.max(1, total) ? v : null; }

if (typeof module !== 'undefined' && module.exports) module.exports = { SH_PAPER, SH_ZOOMS, SH_GAP, SH_LINE, shZoomClean, shZoomStep, shPaperClean, shGeometry, shCharsPerSheet, shSheets, shLearn, shCum, shAt, shWindow, shVisible, shReading, shKey, shParsePage };
