/* ═══════════════════════════ 2p · Reader marks: bookmarks, highlights, reading progress and threads ═══════════════════════════
   Everything here is plain data and pure functions, so it can be tested without a page. Where a mark lives is described by
   (section s, paragraph p, character range a–b in the paragraph's visible text) plus the quoted words q, so a highlight can find itself
   again if a text is ever rebuilt. Nothing is uploaded; marks live in this browser and travel only if the person exports or shares them. */
const HL_COLORS = [['gold', 'Gold'], ['green', 'Green'], ['blue', 'Blue'], ['rose', 'Rose'], ['violet', 'Violet']];
const HL_IDS = HL_COLORS.map((c) => c[0]);
const MARK_LIMITS = { quote: 2000, note: 1500, label: 80, title: 100, items: 12, links: 40, hl: 4000, bm: 1000 };
const mkId = () => (typeof uid === 'function' ? uid() : Date.now().toString(36) + Math.random().toString(36).slice(2, 7));
const mkStr = (s, n) => String(s == null ? '' : s).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u2028\u2029]/g, ' ').slice(0, n);
const mkInt = (v, lo, hi) => { const n = Math.round(+v); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : lo; };
const mkEscRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const MARK_ESC = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* ── paragraphs ── */
const textBlocks = (text) => String(text).split(/\n{2,}/);
/* a block is either a paragraph or "## heading" (optionally followed by the paragraph it heads) */
function blockParts(blk) {
  if (/^## /.test(blk)) { const i = blk.indexOf('\n'); return i < 0 ? { head: blk.slice(3), body: '' } : { head: blk.slice(3, i), body: blk.slice(i + 1) }; }
  return { head: null, body: blk };
}
const visibleText = (raw) => String(raw).replace(/\[\[\d+\]\]/g, '');
/* the paragraph a mark points at, as visible text (verse numbers removed), or null */
function paragraphAt(secs, s, p) {
  const sec = secs && secs[s]; if (!sec) return null;
  const blk = textBlocks(sec[1])[p]; if (blk == null) return null;
  return visibleText(blockParts(blk).body);
}
/* find where a highlight's words now sit: its saved range if it still matches, else the nearest copy of the quote, else null */
function resolveAnchor(vis, h) {
  const q = h && h.q; if (!q) return null;
  if (vis.slice(h.a, h.b) === q) return [h.a, h.b];
  let best = null; let i = -1;
  while ((i = vis.indexOf(q, i + 1)) >= 0) { if (best == null || Math.abs(i - h.a) < Math.abs(best - h.a)) best = i; }
  return best == null ? null : [best, best + q.length];
}
/* After a text is rebuilt (an OCR clean-up, say) paragraphs can move and a few words can change. Find each highlight and paragraph
   bookmark that no longer sits where it was: first its exact words anywhere in the book (the copy nearest the old place), else the
   longest run of its words inside one paragraph, if that is at least four words and half the quote. Moves the marks in m; returns how
   many moved. Marks that cannot be found are left as they were, so nothing is ever thrown away. */
function marksRelocate(secs, m) {
  if (!secs || !secs.length || !m) return 0;
  let index = null; let moved = 0; const blocks = {};
  const at = (s, p) => { const sec = secs[s]; if (!sec) return null; const b = (blocks[s] = blocks[s] || textBlocks(sec[1]))[p]; return b == null ? null : visibleText(blockParts(b).body); };   // paragraphAt, splitting each section once
  const paras = () => {
    if (index) return index; index = [];
    secs.forEach((sec, s) => textBlocks(sec[1]).forEach((blk, p) => { const vis = visibleText(blockParts(blk).body); if (vis.trim()) index.push({ s, p, vis, low: null }); }));
    return index;
  };
  const dist = (x, o) => Math.abs(x.s - o.s) * 100000 + Math.abs(x.p - o.p);
  const words = (t) => { const out = []; const re = /[A-Za-z0-9]+/g; let w; while ((w = re.exec(t))) out.push([w[0].toLowerCase(), w.index, w.index + w[0].length]); return out; };
  const locate = (o, q, exact) => {
    let best = null;
    for (const x of paras()) { let i = -1; while ((i = x.vis.indexOf(q, i + 1)) >= 0) if (!best || dist(x, o) < dist(best.x, o)) best = { x, a: i, b: i + q.length }; }
    if (best || exact) return best;
    const qw = words(q).map((w) => w[0]); if (qw.length < 4) return null;
    const grams = new Map(); for (let i = 0; i + 4 <= qw.length; i++) { const g = qw.slice(i, i + 4).join(' '); if (!grams.has(g)) grams.set(g, i); }
    const keys = [...new Set(qw)].sort((a, b) => b.length - a.length).slice(0, 6);
    for (const x of paras()) {
      if (x.low == null) x.low = x.vis.toLowerCase();
      if (!keys.some((k) => x.low.includes(k))) continue;                // cheap filter before the word-by-word look
      const ws = words(x.vis);
      for (let j = 0; j + 4 <= ws.length; j++) {
        const qi = grams.get(ws[j][0] + ' ' + ws[j + 1][0] + ' ' + ws[j + 2][0] + ' ' + ws[j + 3][0]); if (qi == null) continue;
        let k = 4; while (j + k < ws.length && qi + k < qw.length && ws[j + k][0] === qw[qi + k]) k++;
        if (best && (k < best.k || (k === best.k && dist(x, o) >= dist(best.x, o)))) continue;
        const j0 = Math.max(0, j - qi); const j1 = Math.min(ws.length - 1, j + k - 1 + (qw.length - qi - k));   // widen to the whole quote
        best = { x, k, a: ws[j0][1], b: ws[j1][2] };
      }
    }
    return best && best.k >= Math.max(4, Math.ceil(qw.length / 2)) ? best : null;
  };
  for (const h of m.hl || []) {
    const vis = at(h.s, h.p); if (vis != null && resolveAnchor(vis, h)) continue;
    const f = locate(h, h.q, false); if (!f) continue;
    h.s = f.x.s; h.p = f.x.p; h.a = f.a; h.b = f.b; h.q = f.x.vis.slice(f.a, f.b); moved++;
  }
  const flat = (t) => String(t).replace(/\s+/g, ' ').trim();
  for (const b of m.bm || []) {
    if (b.p < 0 || !b.q) continue;                                        // a section bookmark keeps its section
    const vis = at(b.s, b.p); if (vis != null && flat(vis).startsWith(b.q.slice(0, 60))) continue;
    const f = locate(b, b.q.slice(0, 60), true) || locate(b, b.q, false); if (!f) continue;
    b.s = f.x.s; b.p = f.x.p; b.q = flat(f.x.vis).slice(0, 140); moved++;
  }
  return moved;
}
/* one paragraph → HTML: verse numbers as superscripts, search hits as <mark>, highlights as coloured spans (later ones sit on top), and, when opts.terms is given ({ ix, seen }, see
   2z-terms-core.js), the names and terms the glossary can explain as dotted-underline spans that open the word card (never inside a highlight, which keeps its own click), and, when opts.pm is given
   ([[offset, html], ...] in the order of the text, offsets in the visible text), the marks of the printed pages: each is an element with no text of its own, so no offset of a highlight, a search hit or a
   selection moves (2z-pages-core.js) */
function paraHTML(raw, opts) {
  const find = opts && opts.find; const hls = (opts && opts.hls) || []; const pms = (opts && Array.isArray(opts.pm)) ? opts.pm : []; const pmUsed = new Set();
  const pmAt = (x) => { let o = ''; pms.forEach((m, i) => { if (m[0] === x && !pmUsed.has(i)) { pmUsed.add(i); o += m[1]; } }); return o; };
  const vis = visibleText(raw); const fr = [];
  if (find) { const re = new RegExp(mkEscRe(find), 'gi'); let m; while ((m = re.exec(vis))) { if (!m[0].length) { re.lastIndex++; continue; } fr.push([m.index, m.index + m[0].length]); } }
  const gts = opts && opts.terms && typeof trmFind === 'function' ? trmFind(vis, opts.terms.ix, { seen: opts.terms.seen, skip: hls.map((x) => [x.a, x.b]) }) : [];
  let pos = 0;
  return String(raw).split(/(\[\[\d+\]\])/).map((part) => {
    const vm = part.match(/^\[\[(\d+)\]\]$/); if (vm) return `<sup class="vn">${vm[1]}</sup>`;
    if (!part) return '';
    const start = pos; const end = pos + part.length; pos = end;
    const cuts = new Set([start, end]);
    const clip = (r) => { if (r[0] > start && r[0] < end) cuts.add(r[0]); if (r[1] > start && r[1] < end) cuts.add(r[1]); };
    fr.forEach(clip); hls.forEach((x) => clip([x.a, x.b])); gts.forEach((x) => clip([x.a, x.b])); pms.forEach((m) => clip([m[0], m[0]]));
    const xs = [...cuts].sort((a, b) => a - b); let out = '';
    for (let k = 0; k < xs.length - 1; k++) {
      const x = xs[k]; const y = xs[k + 1]; let seg = MARK_ESC(part.slice(x - start, y - start));
      if (pms.length) out += pmAt(x);
      const gt = gts.find((r) => r.a <= x && y <= r.b); if (gt) seg = `<span class="gt" data-k="${gt.k}" role="button" tabindex="0" aria-haspopup="dialog">${seg}</span>`;
      if (fr.some((r) => r[0] <= x && y <= r[1])) seg = `<mark>${seg}</mark>`;
      let top = null; hls.forEach((hl) => { if (hl.a <= x && y <= hl.b) top = hl; });
      if (top) seg = `<span class="hl hl-${HL_IDS.includes(top.c) ? top.c : 'gold'}${top.n ? ' has-note' : ''}" data-h="${MARK_ESC(top.id)}"${top.n ? ` title="${MARK_ESC(top.n.slice(0, 160))}"` : ''}>${seg}</span>`;
      out += seg;
    }
    return out;
  }).join('') + (pms.length ? pms.map((m, i) => (pmUsed.has(i) ? '' : m[1])).join('') : '');
}

/* ── per-text marks ── */
const marksBlank = () => ({ hl: [], bm: [], rs: [], n: 0, last: null, v: '' });   // v: the version of the text the marks were last checked against
function marksClean(m) {
  const o = marksBlank(); if (!m || typeof m !== 'object') return o;
  o.hl = (Array.isArray(m.hl) ? m.hl : []).filter((h) => h && typeof h.id === 'string' && Number.isFinite(h.s) && Number.isFinite(h.p) && Number.isFinite(h.a) && Number.isFinite(h.b) && h.b > h.a && typeof h.q === 'string').slice(0, MARK_LIMITS.hl);
  o.bm = (Array.isArray(m.bm) ? m.bm : []).filter((b) => b && typeof b.id === 'string' && Number.isFinite(b.s)).slice(0, MARK_LIMITS.bm);
  o.rs = [...new Set((Array.isArray(m.rs) ? m.rs : []).map((x) => Math.round(+x)).filter((x) => Number.isFinite(x) && x >= 0))].sort((a, b) => a - b);
  o.n = mkInt(m.n, 0, 100000); o.last = m.last && Number.isFinite(m.last.s) ? { s: mkInt(m.last.s, 0, 100000), p: mkInt(m.last.p || 0, 0, 100000), t: +m.last.t || 0, f: Math.round(Math.min(1, Math.max(0, +m.last.f || 0)) * 10000) / 10000 } : null;   // f: how far through the whole text the place is (0 to 1)
  o.v = typeof m.v === 'string' ? m.v.slice(0, 40) : '';
  return o;
}
function hlAdd(m, h, now) {
  const q = mkStr(h.q, MARK_LIMITS.quote); const a = mkInt(h.a, 0, 1e7); const b = mkInt(h.b, 0, 1e7);
  if (!q.trim() || b <= a) return null;
  const it = { id: h.id || mkId(), s: mkInt(h.s, 0, 1e5), p: mkInt(h.p, 0, 1e5), a, b, q, c: HL_IDS.includes(h.c) ? h.c : 'gold', n: mkStr(h.n, MARK_LIMITS.note), sh: mkStr(h.sh, 80), t: now || Date.now() };
  if (h.g) it.g = mkStr(h.g, 24);
  m.hl.push(it); return it;
}
/* a highlight that crossed paragraphs is stored as one piece per paragraph, tied by g; removing or recolouring one affects them all */
const hlGroup = (m, id) => { const h = m.hl.find((x) => x.id === id); if (!h) return []; return h.g ? m.hl.filter((x) => x.g === h.g) : [h]; };
function hlRemove(m, id) { const ids = new Set(hlGroup(m, id).map((x) => x.id)); const n = m.hl.length; m.hl = m.hl.filter((x) => !ids.has(x.id)); return n - m.hl.length; }
function hlUpdate(m, id, patch) {
  const h = m.hl.find((x) => x.id === id); if (!h) return false;
  if (patch.c && HL_IDS.includes(patch.c)) hlGroup(m, id).forEach((x) => { x.c = patch.c; });
  if (patch.n != null) h.n = mkStr(patch.n, MARK_LIMITS.note);
  return true;
}
function bmToggle(m, s, p, snip, now, heading) {
  if (p == null) p = -1;
  const i = m.bm.findIndex((b) => b.s === s && b.p === p);
  if (i >= 0) { m.bm.splice(i, 1); return false; }
  m.bm.push({ id: mkId(), s: mkInt(s, 0, 1e5), p: mkInt(p, -1, 1e5), q: mkStr(snip, 140).replace(/\s+/g, ' ').trim(), sh: mkStr(heading, 80), n: '', t: now || Date.now() }); return true;
}
function rsSet(m, s, on) { const set = new Set(m.rs); if (on) set.add(s); else set.delete(s); m.rs = [...set].sort((a, b) => a - b); }
/* how far through a text a reader is, by sections marked read */
function progressOf(m, n) { const total = n || m.n || 0; const done = total ? m.rs.filter((x) => x < total).length : m.rs.length; return { done, total, pct: total ? Math.min(100, Math.round(100 * done / total)) : 0 }; }
const firstUnread = (m, n) => { for (let i = 0; i < n; i++) if (!m.rs.includes(i)) return i; return Math.max(0, n - 1); };

/* ── the stored copy (a single object keyed by library id) ── */
const MARKS = {
  key: 'reader.marks',
  all() { const a = store.get(MARKS.key, {}); return a && typeof a === 'object' ? a : {}; },
  get(id) { return marksClean(MARKS.all()[id]); },
  upd(id, fn) { const all = MARKS.all(); const m = marksClean(all[id]); const r = fn(m); all[id] = m; store.set(MARKS.key, all); return r; },
  ids() { const a = MARKS.all(); return Object.keys(a).filter((k) => { const m = a[k]; return m && ((m.hl && m.hl.length) || (m.bm && m.bm.length) || (m.rs && m.rs.length) || m.last); }); },
  totals() { let hl = 0; let bm = 0; let rs = 0; let notes = 0; const a = MARKS.all(); Object.keys(a).forEach((k) => { const m = marksClean(a[k]); hl += m.hl.length; bm += m.bm.length; rs += m.rs.length; notes += m.hl.filter((h) => h.n).length + m.bm.filter((b) => b.n).length; }); return { hl, bm, rs, notes }; },
};

/* ── threads: a handful of passages from different texts laid side by side, with how they relate ── */
const THREAD_KINDS = ['borrowing', 'ancestry', 'contact', 'parallel', 'contested'];
const threadNew = (title, now) => ({ id: mkId(), title: mkStr(title, MARK_LIMITS.title) || 'Untitled thread', note: '', items: [], links: [], t: now || Date.now(), u: now || Date.now() });
function threadAddItem(t, it, now) {
  if (t.items.length >= MARK_LIMITS.items) return null;
  const q = mkStr(it.q, MARK_LIMITS.quote).trim(); if (!q || !/^[a-z]-[a-z0-9-]+$/.test(it.tid || '')) return null;
  const item = { id: it.id || mkId(), tid: it.tid, s: mkInt(it.s, 0, 1e5), p: mkInt(it.p, 0, 1e5), a: mkInt(it.a, 0, 1e7), b: mkInt(it.b, 0, 1e7), q, label: mkStr(it.label, MARK_LIMITS.label), note: mkStr(it.note, MARK_LIMITS.note), sh: mkStr(it.sh, 80) };
  t.items.push(item); t.u = now || Date.now(); return item;
}
function threadRemoveItem(t, id) { t.items = t.items.filter((x) => x.id !== id); t.links = t.links.filter((l) => l.a !== id && l.b !== id); t.u = Date.now(); }
function threadMove(t, id, dir) { const i = t.items.findIndex((x) => x.id === id); const j = i + dir; if (i < 0 || j < 0 || j >= t.items.length) return false; const x = t.items[i]; t.items[i] = t.items[j]; t.items[j] = x; t.u = Date.now(); return true; }
function threadLink(t, a, b, kind, note) {
  if (a === b || !t.items.some((x) => x.id === a) || !t.items.some((x) => x.id === b) || !THREAD_KINDS.includes(kind) || t.links.length >= MARK_LIMITS.links) return null;
  const i = t.links.findIndex((l) => (l.a === a && l.b === b) || (l.a === b && l.b === a)); const l = { a, b, kind, note: mkStr(note, MARK_LIMITS.note) };
  if (i >= 0) t.links[i] = l; else t.links.push(l); t.u = Date.now(); return l;
}
function threadUnlink(t, a, b) { t.links = t.links.filter((l) => !((l.a === a && l.b === b) || (l.a === b && l.b === a))); t.u = Date.now(); }
/* the quote as it should read in a card: a gap is shown with an ellipsis, not silently joined */
const quoteHTML = (q) => MARK_ESC(q).replace(/\n+/g, '<br>');
const THREADS = {
  key: 'reader.threads',
  all() { const a = store.get(THREADS.key, []); return Array.isArray(a) ? a : []; },
  save(list) { store.set(THREADS.key, list.slice(0, 200)); },
  get(id) { return THREADS.all().find((t) => t.id === id) || null; },
  upd(id, fn) { const list = THREADS.all(); const t = list.find((x) => x.id === id); if (!t) return null; const r = fn(t); t.u = Date.now(); THREADS.save(list); return r; },
  add(t) { const list = THREADS.all(); list.unshift(t); THREADS.save(list); return t; },
  remove(id) { THREADS.save(THREADS.all().filter((t) => t.id !== id)); },
};
/* whitespace runs collapsed to one space, with a map from each kept character back to its place in the original */
function flattenText(vis) {
  let flat = ''; const map = []; let sp = false;
  for (let i = 0; i < vis.length; i++) { const ch = vis[i]; if (/\s/.test(ch)) { if (sp) continue; sp = true; flat += ' '; } else { sp = false; flat += ch; } map.push(i); }
  return { flat, map };
}
/* where a quoted passage sits in a text, so it can be found again: `find` is a phrase at the start of the wanted passage; the passage runs on to the end of a sentence near `len` characters */
function resolveSpot(secs, find, len) {
  const want = String(find).replace(/\s+/g, ' ').trim(); if (!want) return null;
  for (let s = 0; s < secs.length; s++) {
    const blocks = textBlocks(secs[s][1]);
    for (let p = 0; p < blocks.length; p++) {
      const vis = visibleText(blockParts(blocks[p]).body); if (vis.length < want.length) continue;
      const { flat, map } = flattenText(vis); const lo = flat.toLowerCase(); const same = lo.length === flat.length;
      const at = (same ? lo : flat).indexOf(same ? want.toLowerCase() : want); if (at < 0) continue;
      let a = map[at];
      if (/^[a-z]/.test(vis[a])) { // the phrase starts mid-sentence: begin at the sentence's start when it is close
        const from = Math.max(0, a - 320); const back = vis.slice(from, a); const k = back.search(/[.!?]["”’')]*\s+[^.!?]*$/);
        if (k >= 0) { const m = back.slice(k).match(/^[.!?]["”’')]*\s+/); a = from + k + m[0].length; } else if (from === 0 && !/[.!?]/.test(back)) a = Math.max(0, vis.search(/\S/));
      }
      const lim = len || 600; let b = Math.min(vis.length, a + lim);
      if (b < vis.length) { const m = vis.slice(b, b + 220).match(/^[^.!?]*[.!?]["”’')]*/); if (m) b += m[0].length; }
      const q = vis.slice(a, b).trim(); return { s, p, a, b: a + q.length, q, heading: secs[s][0] };
    }
  }
  return null;
}
if (typeof module !== 'undefined' && module.exports) module.exports = { mkEscRe, HL_COLORS, HL_IDS, MARK_LIMITS, textBlocks, blockParts, visibleText, paragraphAt, resolveAnchor, marksRelocate, paraHTML, marksBlank, marksClean, hlAdd, hlGroup, hlRemove, hlUpdate, bmToggle, rsSet, progressOf, firstUnread, THREAD_KINDS, threadNew, threadAddItem, threadRemoveItem, threadMove, threadLink, threadUnlink, quoteHTML, flattenText, resolveSpot };
