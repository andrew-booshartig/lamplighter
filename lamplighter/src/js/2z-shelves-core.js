/* ═══════════════════════════ 2z · My shelves and my reading: what is on which shelf, and what the reading adds up to ═════════════════════════
   Pure functions (tests/shelves.test.js); the page and the stored copy are in 6gs-shelves.js.
   A book is on at most one of four shelves at a time, and the reader mostly does not have to say which:
     Finished     the book is marked read (the same tick the Library and the reader already have);
     Reading now  the reader has begun it (a place saved beyond the first screen, or a section read), or said so;
     Put down     the reader set it aside; it comes back to Reading now by itself if they read in it again;
     Want to read the reader meant to read it, and has not begun.
   Beside those, named lists of the reader's own, which a book may be on any number of (it can be Finished and on "For the seminar").
   The reading numbers come from what is already kept (the places and read sections in the marks, the size of each text), so they are right for a reader who started long before this page; the weeks
   grid comes from a small log of how far the reader moved through a text on each day. Nothing leaves the browser. Estimates are labelled as estimates: a word is counted as six characters, and a minute
   is the reader's own pace (the one the reader already measures). */
const SHF_STATUS = { reading: 'Reading now', want: 'Want to read', finished: 'Finished', aside: 'Put down' };
const SHF_ORDER = ['reading', 'want', 'finished', 'aside'];
const SHF_SET = ['want', 'reading', 'aside'];      // the statuses a reader can choose; Finished is the read tick, and Reading now also arrives by reading
const SHF_LIMITS = { lists: 24, perList: 400, name: 40, set: 4000, days: 800 };
const SHF_CHARS_PER_WORD = 6;
const SHF_JUMP = 20000;      // a move through a text of more than this many characters at once is a jump (contents, slider, search), not reading
const SHF_FAST = 6600;       // characters a minute no one reads at: a page flipped past, not read
const shfIdOk = (id) => typeof id === 'string' && /^[a-z]-[a-z0-9-]{1,60}$/.test(id);
const shfT = (t) => (Number.isFinite(+t) && +t > 0 ? Math.round(+t) : 0);
const shfDict = (x) => (x && typeof x === 'object' && !Array.isArray(x) ? x : {});
const shfBlank = () => ({ set: {}, done: {}, lists: [] });
/* whatever was saved, made safe to use (an old version, a hand-edited backup) */
function shfClean(raw) {
  const o = shfBlank(); if (!raw || typeof raw !== 'object') return o;
  Object.entries(shfDict(raw.set)).slice(0, SHF_LIMITS.set).forEach(([id, v]) => { if (shfIdOk(id) && v && SHF_SET.includes(v.s)) o.set[id] = { s: v.s, t: shfT(v.t) }; });
  Object.entries(shfDict(raw.done)).slice(0, SHF_LIMITS.set).forEach(([id, t]) => { if (shfIdOk(id) && shfT(t)) o.done[id] = shfT(t); });
  const seen = new Set();
  (Array.isArray(raw.lists) ? raw.lists : []).slice(0, SHF_LIMITS.lists).forEach((l) => {
    if (!l || typeof l.id !== 'string' || typeof l.name !== 'string' || !l.id || seen.has(l.id)) return;
    const name = l.name.replace(/\s+/g, ' ').trim().slice(0, SHF_LIMITS.name); if (!name) return; seen.add(l.id);
    o.lists.push({ id: l.id.slice(0, 24), name, ids: [...new Set((Array.isArray(l.ids) ? l.ids : []).filter(shfIdOk))].slice(0, SHF_LIMITS.perList), t: shfT(l.t) });
  });
  return o;
}
/* choosing a shelf; status '' takes the book off the shelves it was put on (a book the reader has begun is still Reading now) */
function shfSet(s, id, status, now) {
  if (!shfIdOk(id)) return false; if (!status) { delete s.set[id]; return true; } if (!SHF_SET.includes(status)) return false;
  if (!s.set[id] && Object.keys(s.set).length >= SHF_LIMITS.set) return false;
  s.set[id] = { s: status, t: now || Date.now() }; return true;
}
/* when a book was marked read (kept so the year can be counted; a book marked before this was kept has no date) */
function shfDone(s, id, on, now) { if (!shfIdOk(id)) return false; if (on) { if (!s.done[id]) s.done[id] = now || Date.now(); } else delete s.done[id]; return true; }
function shfListNew(s, name, now, id) {
  const nm = String(name == null ? '' : name).replace(/\s+/g, ' ').trim().slice(0, SHF_LIMITS.name); if (!nm || s.lists.length >= SHF_LIMITS.lists) return null;
  const lid = String(id || 'l' + (now || Date.now()).toString(36)).slice(0, 24); if (s.lists.some((l) => l.id === lid)) return null;
  const l = { id: lid, name: nm, ids: [], t: now || Date.now() }; s.lists.push(l); return l;
}
function shfListRename(s, lid, name) { const l = s.lists.find((x) => x.id === lid); const nm = String(name == null ? '' : name).replace(/\s+/g, ' ').trim().slice(0, SHF_LIMITS.name); if (!l || !nm) return false; l.name = nm; return true; }
function shfListRemove(s, lid) { const n = s.lists.length; s.lists = s.lists.filter((x) => x.id !== lid); return n !== s.lists.length; }
const shfOnList = (s, lid, id) => { const l = s.lists.find((x) => x.id === lid); return !!l && l.ids.includes(id); };
function shfListToggle(s, lid, id, on) {
  const l = s.lists.find((x) => x.id === lid); if (!l || !shfIdOk(id)) return false; const has = l.ids.includes(id);
  if (on && !has) { if (l.ids.length >= SHF_LIMITS.perList) return false; l.ids.push(id); return true; }
  if (!on && has) { l.ids = l.ids.filter((x) => x !== id); return true; }
  return false;
}
/* the lists a book is on */
const shfListsOf = (s, id) => s.lists.filter((l) => l.ids.includes(id));

/* has the reader begun this book? m: its marks, already cleaned ({ rs: [sections read], last: { s, f, t } | null }). A book only opened, and not moved in, is not begun. */
const shfStarted = (m) => !!m && (((m.rs && m.rs.length) || 0) > 0 || !!(m.last && (m.last.f >= 0.01 || m.last.s > 0)));
/* the one shelf a book is on: 'finished' | 'reading' | 'aside' | 'want' | 'none'. read: the Library's read ticks ({ id: true }); m: the book's cleaned marks (or null). */
function shfStatus(id, s, read, m) {
  if (read && read[id]) return 'finished';
  const ex = s.set[id]; const lastT = m && m.last ? +m.last.t || 0 : 0; const begun = shfStarted(m);
  if (ex) {
    if (ex.s === 'aside') return lastT > ex.t ? 'reading' : 'aside';      // read in it again, and it is back on Reading now
    if (ex.s === 'reading') return 'reading';
    if (ex.s === 'want') return begun ? 'reading' : 'want';               // wanted, then begun: it moves by itself
  }
  return begun ? 'reading' : 'none';
}
/* the books on each shelf, in the order a reader wants them: reading by the latest place, want and put down by when they were put there, finished by the date it was finished (undated last, in the Library's order) */
function shfGroups(ids, s, read, marksOf) {
  const out = { reading: [], want: [], finished: [], aside: [], none: [] }; const pos = new Map(ids.map((id, i) => [id, i]));
  ids.forEach((id) => { out[shfStatus(id, s, read, marksOf(id))].push(id); });
  const lastOf = (id) => { const m = marksOf(id); return m && m.last ? +m.last.t || 0 : 0; };
  out.reading.sort((a, b) => lastOf(b) - lastOf(a) || pos.get(a) - pos.get(b));
  out.want.sort((a, b) => ((s.set[b] || {}).t || 0) - ((s.set[a] || {}).t || 0) || pos.get(a) - pos.get(b));
  out.aside.sort((a, b) => ((s.set[b] || {}).t || 0) - ((s.set[a] || {}).t || 0) || pos.get(a) - pos.get(b));
  out.finished.sort((a, b) => (s.done[b] || 0) - (s.done[a] || 0) || pos.get(a) - pos.get(b));
  return out;
}
/* how far through a book, 0 to 1: the saved place, else the sections read; 1 for a finished book */
function shfFraction(id, read, m, n) {
  if (read && read[id]) return 1; if (!m) return 0; if (m.last && m.last.f > 0) return Math.min(1, m.last.f);
  const total = n || m.n || 0; return total ? Math.min(1, (m.rs || []).filter((x) => x < total).length / total) : 0;
}

/* ── what the reading adds up to ──
   o: { lib: [{ id, group }], collections: [[name, blurb, [group ids]]], imagined: [group ids], groupName: { id: name }, meta: { id: { chars, n } } | null, marksOf: (id) => cleaned marks, read, shelves, cpm, now } */
function shfStats(o) {
  const s = o.shelves; const imag = new Set(o.imagined || []); const meta = o.meta || {}; const ids = o.lib.map((l) => l.id); const g = shfGroups(ids, s, o.read, o.marksOf);
  const groupOf = {}; o.lib.forEach((l) => { groupOf[l.id] = l.group; });
  let chars = 0; let sections = 0; const touched = new Set(); const byGroup = {};
  o.lib.forEach((l) => {
    const m = o.marksOf(l.id); const st = shfStatus(l.id, s, o.read, m); const mm = meta[l.id]; const frac = shfFraction(l.id, o.read, m, mm && mm.n);
    const b = byGroup[l.group] || (byGroup[l.group] = { total: 0, readable: 0, finished: 0, started: 0 }); b.total++; if (mm) b.readable++;
    if (st === 'finished') b.finished++; else if (st === 'reading' || shfStarted(m)) b.started++;      // begun: on Reading now, or read in before it was put down (a book put down unopened is not begun)
    if (mm && mm.chars && frac > 0) chars += mm.chars * frac;
    if (m) sections += (m.rs || []).length;
    if (st === 'finished' || st === 'reading' || shfStarted(m)) touched.add(l.group);
  });
  const byColl = o.collections.map(([name, , gs], ci) => {
    const t = { ci, name, imagined: gs.length > 0 && gs.every((x) => imag.has(x)), total: 0, readable: 0, finished: 0, started: 0 };
    gs.forEach((x) => { const b = byGroup[x]; if (b) { t.total += b.total; t.readable += b.readable; t.finished += b.finished; t.started += b.started; } });
    return t;
  });
  const real = Object.keys(byGroup).filter((x) => !imag.has(x)); const realTouched = [...touched].filter((x) => !imag.has(x));
  const years = {}; ids.forEach((id) => { if (g.finished.includes(id) && s.done[id]) { const y = new Date(s.done[id]).getFullYear(); years[y] = (years[y] || 0) + 1; } });
  const dated = g.finished.filter((id) => s.done[id]).length;
  const words = Math.round(chars / SHF_CHARS_PER_WORD); const minutes = chars / Math.min(6000, Math.max(400, +o.cpm || 1350));
  return { counts: { finished: g.finished.length, reading: g.reading.length, want: g.want.length, aside: g.aside.length, lists: s.lists.length }, chars: Math.round(chars), words, minutes, sections, byColl, years, undated: g.finished.length - dated,
    traditions: { touched: realTouched.length, of: real.length }, groups: g };
}
/* "about 42,000 words" / "about 38 hours": a number that is an estimate reads like one */
function shfRound(n) { const v = Math.max(0, +n || 0); if (v < 100) return Math.round(v); if (v < 1000) return Math.round(v / 10) * 10; if (v < 10000) return Math.round(v / 100) * 100; return Math.round(v / 1000) * 1000; }
function shfHours(min) { const m = Math.max(0, +min || 0); if (m < 1) return 'under a minute'; if (m < 90) return Math.round(m) + ' minutes'; const h = m / 60; return (h < 10 ? Math.round(h * 10) / 10 : Math.round(h)) + ' hours'; }

/* ── the log of days: characters the reader moved through on each day (local dates) ── */
const shfDayKey = (d) => { const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000); return z.toISOString().slice(0, 10); };
/* the characters that moving from one place in a text to another counts as reading, 0 if it was a jump or a page flipped past. prevF, f: 0 to 1; prevT, now: milliseconds; total: characters in the text */
function shfAdvance(prevF, prevT, f, now, total) {
  if (!(total > 0) || !(f > prevF)) return 0;
  const chars = (f - prevF) * total; if (chars > SHF_JUMP) return 0;
  if (prevT && now > prevT && chars * 60000 / (now - prevT) > SHF_FAST) return 0;
  if (prevT && now <= prevT && chars > 400) return 0;
  return Math.round(chars);
}
/* add characters to a day, and keep the log to the last SHF_LIMITS.days days */
function shfDayAdd(days, add, now) {
  const n = Math.round(+add || 0); if (n <= 0) return days; const k = shfDayKey(new Date(now || Date.now())); days[k] = Math.min(10000000, (days[k] || 0) + n);
  const keys = Object.keys(days); if (keys.length > SHF_LIMITS.days) keys.sort().slice(0, keys.length - SHF_LIMITS.days).forEach((x) => { delete days[x]; });
  return days;
}
const shfDaysClean = (raw) => { const o = {}; Object.entries(shfDict(raw)).forEach(([k, v]) => { if (/^\d{4}-\d{2}-\d{2}$/.test(k) && Number.isFinite(+v) && +v > 0) o[k] = Math.round(+v); }); return o; };
const shfLevel = (c) => (c <= 0 ? 0 : c <= 3000 ? 1 : c <= 9000 ? 2 : c <= 27000 ? 3 : 4);      // up to about two, seven and twenty minutes at an easy pace
/* the last `weeks` weeks as a grid, Monday first, the last column the current week; and the runs of days */
function shfWeeks(days, now, weeks) {
  const w = Math.max(1, weeks || 12); const today = new Date(now || Date.now()); today.setHours(12, 0, 0, 0);
  const dow = (today.getDay() + 6) % 7;      // Monday = 0
  const start = new Date(today.getTime() - ((w - 1) * 7 + dow) * 86400000); const cells = [];
  for (let i = 0; i < w * 7; i++) { const d = new Date(start.getTime() + i * 86400000); const k = shfDayKey(d); const future = d.getTime() > today.getTime() + 3600000; const c = future ? 0 : days[k] || 0; cells.push({ d: k, c, lvl: shfLevel(c), future }); }
  const past = cells.filter((x) => !x.future); const last = (n) => past.slice(-n); const act = (arr) => arr.filter((x) => x.c > 0).length;
  let run = 0; let i = past.length - 1; if (i >= 0 && !(past[i].c > 0)) i--;      // today does not break a run: there is still time to read
  while (i >= 0 && past[i].c > 0) { run++; i--; }
  const sum = (arr) => arr.reduce((a, x) => a + x.c, 0);
  return { cells, weeks: w, active7: act(last(7)), active30: act(last(30)), activeAll: act(past), run, chars7: sum(last(7)), chars30: sum(last(30)) };
}
/* the lists as plain text a reader can keep (Markdown) */
function shfMarkdown(s, groups, titleOf, whenOf) {
  const out = ['# My shelves\n']; const sec = (name, ids, extra) => { if (!ids.length) return; out.push(`\n## ${name} (${ids.length})\n`); ids.forEach((id) => { out.push(`- ${titleOf(id)}${extra ? extra(id) : ''}`); }); };
  sec('Reading now', groups.reading); sec('Want to read', groups.want);
  sec('Finished', groups.finished, (id) => (s.done[id] && whenOf ? ` (${whenOf(s.done[id])})` : '')); sec('Put down', groups.aside);
  s.lists.forEach((l) => { sec(l.name, l.ids.filter((id) => titleOf(id))); });
  return out.join('\n') + '\n\n— Made in the Lamplighter Project\n';
}
if (typeof module !== 'undefined' && module.exports) module.exports = { SHF_STATUS, SHF_ORDER, SHF_SET, SHF_LIMITS, SHF_JUMP, shfIdOk, shfBlank, shfClean, shfSet, shfDone, shfListNew, shfListRename, shfListRemove, shfOnList, shfListToggle, shfListsOf, shfStarted, shfStatus, shfGroups, shfFraction, shfStats, shfRound, shfHours, shfDayKey, shfAdvance, shfDayAdd, shfDaysClean, shfLevel, shfWeeks, shfMarkdown };
