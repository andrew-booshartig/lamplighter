/* ═══════════════════════════ 69 · The Journey ═══════════════════════════
   A chronological journey through human religion, one station a week, seven short days each:
   Story · Text · Words · Shared ideas · Practice · Apply · Table & rest. It advances by what you complete, never by the calendar. */
const PATH_DAYS = [
  { n: 1, name: 'Story', min: 10, icon: 'sun' }, { n: 2, name: 'Text', min: 20, icon: 'learn' }, { n: 3, name: 'Words', min: 10, icon: 'ear' },
  { n: 4, name: 'Shared ideas', min: 10, icon: 'swap' }, { n: 5, name: 'Practice', min: 15, icon: 'lotus' }, { n: 6, name: 'Apply', min: 10, icon: 'target' }, { n: 7, name: 'Table & rest', min: 15, icon: 'heart' },
];
/* The registry of the views of this module: every view is at #/path/<view>. These eight groups are no longer the menu: where each view sits (Texts, Traditions, Visual, Worship, Start, Setup) is in 2z-sections-core.js, and tests/sections.test.js checks that every view here is in it. */
const PATH_GROUPS = [
  { id: 'journey', label: 'Journey', subs: [['today', 'This week'], ['timeline', 'All stations'], ['notebook', 'Journey notes'], ['threads', 'Passage sets']] },
  { id: 'timelines', label: 'Timelines', subs: [['chronicle', 'Master timeline'], ['world', 'World chart'], ['traditions', 'By tradition']] },
  { id: 'library', label: 'Library', subs: [['library', 'All texts'], ['shelves', 'My shelves'], ['search', 'Search texts'], ['marks', 'Highlights and notes'], ['passage', 'Random'], ['bibles', 'Bibles side by side'], ['glossary', 'Glossary'], ['imagined', 'Imagined shelf']] },
  { id: 'connections', label: 'Connections', subs: [['common', 'Common ground'], ['echoes', 'Shared ideas'], ['themes', 'Themes'], ['parallels', 'Parallel passages'], ['motifs', 'Motifs'], ['wander', 'Wander'], ['similar', 'Find similar']] },
  { id: 'practice', label: 'Practice', subs: [['practices', 'Practices'], ['rites', 'Rites and customs'], ['intentions', 'Intentions'], ['year', 'Year wheel']] },
  { id: 'beyond', label: 'Beyond text', subs: [['plants', 'Sacred plants and chemistry'], ['sound', 'Sound and rhythm'], ['gallery', 'Pictures'], ['image', 'Sacred art and image'], ['hidden', 'Jewish mysticism']] },
  { id: 'freedom', label: 'Freedom', subs: [['freedom', 'Our promises'], ['own', 'Your own texts'], ['carry', 'Take it with you']] },
  { id: 'links', label: 'Links', subs: [['links', 'Reading and reference']] },
];
const PATH_TABS = PATH_GROUPS.flatMap((g) => g.subs);
/* views that hold page-level listeners (the reader's selection bar, for one) register how to let go of them here */
const PATH_LEAVE = []; const pathOnLeave = (fn) => { PATH_LEAVE.push(fn); };
const LIB_STATION = {}; PATH_STATIONS.forEach((s) => s.read.forEach((id) => { LIB_STATION[id] = s.id; }));
const ERA_BY_ID = Object.setPrototypeOf(Object.fromEntries(ERAS.map((e) => [e.id, e])), null);
const stIndex = (id) => PATH_STATIONS.findIndex((s) => s.id === id);
const stNum = (s) => stIndex(s.id) + 1;
const pathGoto = (hash) => { if (location.hash === hash) Router.render(); else location.hash = hash; };

const PATH = {
  get() { /* whatever was saved, made safe to use: a wrong shape in the saved data (an old version, a hand-edited backup) must not stop the page from opening */
    const raw = store.get('path.state', {}); const o = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {}; const dict = (x) => (x && typeof x === 'object' && !Array.isArray(x) ? x : {});
    const days = {}; Object.entries(dict(o.days)).forEach(([k, v]) => { days[k] = Array.isArray(v) ? v.filter((n) => Number.isInteger(n) && n >= 1 && n <= 7) : []; });
    return Object.assign({}, o, { started: typeof o.started === 'string' ? o.started : null, cur: Number.isInteger(o.cur) ? Math.min(Math.max(o.cur, 0), Math.max(PATH_STATIONS.length - 1, 0)) : 0, days, notes: dict(o.notes), read: dict(o.read), rule: typeof o.rule === 'string' ? o.rule : '', prompts: o.prompts === true }); },      /* prompts: whether the Journey asks its questions for reflection; off until a person turns it on, and remembered */
  upd(fn) { const s = PATH.get(); fn(s); store.set('path.state', s); return s; },
  next(s, sid) { const d = s.days[sid] || []; for (let i = 1; i <= 7; i++) if (!d.includes(i)) return i; return 8; },
  mark(sid, n, on) { return PATH.upd((s) => { const d = new Set(s.days[sid] || []); if (on) d.add(n); else d.delete(n); s.days[sid] = [...d].sort((a, b) => a - b); }); },
  note(sid, n, text) { PATH.upd((s) => { const k = sid + '.d' + n; if (text) s.notes[k] = text; else delete s.notes[k]; }); },
  stationsDone(s) { return PATH_STATIONS.filter((x) => (s.days[x.id] || []).length === 7).length; },
  readCount(s, group) { const ids = LIB.filter((l) => l.group === group); return [ids.filter((l) => s.read[l.id]).length, ids.length]; },
  start(idx) { PATH.upd((s) => { s.started = s.started || isoDay(); s.cur = idx; }); },
};

/* “Where you left off”: what a person was last doing, as one quiet line with a link for each (the station the Journey is at, the text last read), and nothing at all when there is no saved progress.
   The page the app opens on shows it (the router adds it: uiHomeLine in 50-core.js), and so does the Start page (#/start, kept under Timeline → More) */
function pathResumeItems() {
  const out = []; const st = PATH.get(); const total = PATH_STATIONS.length;
  if (st.started && total) { const s = PATH_STATIONS[Math.min(st.cur, total - 1)]; out.push({ href: '#/path/today', label: s.title, note: `Journey, station ${Math.min(st.cur + 1, total)}` }); }
  try {
    const all = typeof MARKS !== 'undefined' ? MARKS.all() : {}; const last = (id) => (all[id] && typeof all[id] === 'object' && all[id].last && Number.isFinite(all[id].last.s) ? all[id].last : null); const when = (id) => { const t = last(id).t; return typeof t === 'number' && isFinite(t) ? t : 0; };
    const id = Object.keys(all).filter((k) => Object.prototype.hasOwnProperty.call(LIB_BY_ID, k) && last(k)).sort((a, b) => when(b) - when(a))[0];
    if (id) out.push({ href: '#/path/read/' + id, label: LIB_BY_ID[id].title, note: 'reading' });
  } catch (e) { /* damaged saved marks: the Journey line alone */ }
  return out;
}
function pathResumeHTML() {
  const items = pathResumeItems(); if (!items.length) return '';
  return `<p class="resume small"><span class="muted">Where you left off:</span> ${items.map((i) => `<a href="${esc(i.href)}">${esc(i.label)}</a> <span class="muted">(${esc(i.note)})</span>`).join(' <span class="muted" aria-hidden="true">·</span> ')}</p>`;
}

const pathDayPrompt = {
  1: (s) => s.q[0], 2: () => 'Which line or image stayed with you? Copy it down and say why.', 3: () => 'Pick one word. Say it aloud three times, then write your own plain-English translation of it.',
  4: (s) => s.q[1], 5: () => 'What did you notice during or after the practice? One sentence.', 6: (s) => s.q[2], 7: () => 'What do I keep from this week? What do I doubt? What would I tell my future self?',
};
const ext = (url, text) => `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${text} ↗</a>`;
const snapHTML = (era) => (era.snap ? `<div class="snap">${CONT.map(([k, n]) => `<div><b>${n}</b><span>${esc(era.snap[k])}</span></div>`).join('')}</div>` : '');
const themeChips = (s) => `<div class="row tight">${s.themes.map((t) => `<a class="chip" href="#/path/timeline?theme=${t}">${esc(THEMES[t].name)}</a>`).join('')}</div>`;
const wordsTable = (words) => (words.length ? `<div class="table-wrap"><table class="stat-table"><tr><th>Word</th><th>Language</th><th>Means</th></tr>${words.map((w) => `<tr><td><b>${esc(w[0])}</b></td><td>${esc(w[1])}</td><td>${esc(w[2])}</td></tr>`).join('')}</table></div>` : '');
function readingsHTML(s, st) {
  if (!s.read.length) return '<p class="t2">No written texts survive from this station, so the work is weighing evidence. Use the study shelf below.</p>';
  return `<ul class="rlist">${s.read.map((id) => { const l = LIB_BY_ID[id]; const tr = TR[l.tr]; return `<li><label class="chk"><input type="checkbox" data-read="${id}"${st.read[id] ? ' checked' : ''}><span><b>${esc(l.title)}</b> <span class="muted">· ${esc(l.when)}</span></span></label><details><summary>Where to read it</summary><div class="small t2">${esc(tr.n)}</div><div class="small" style="margin-top:6px">${ext(libSearchURL(l), 'Search for a translation')}</div></details></li>`; }).join('')}</ul>`;
}
/* a book on a station’s study shelf, or in “Compare with”, is a link that opens it in the reader. Every title is a link at first (so the page works before the texts’ index is known); once the index is
   known, a book that is not in the texts folder (a modern book, or one with no public-domain copy) loses the link and says so, with a way to look for an edition (pathShelfFill, run from Pages.path.mount) */
const shelfItem = (id, tail) => { const l = LIB_BY_ID[id]; return `<li data-lib="${id}"><a class="sh-t" href="#/path/read/${id}">${esc(l.title)}</a> <span class="muted">(${esc(l.when)})</span>${tail || ''}</li>`; };
function pathShelfFill(root, meta) {
  if (!meta) return;      /* no texts folder at all: the links stay, and the reader explains what is missing */
  $$('[data-lib]', root).forEach((li) => {
    const id = li.dataset.lib; const a = li.querySelector('.sh-t'); const l = LIB_BY_ID[id]; if (meta[id] || !a || !l || li.dataset.shelfDone) return; li.dataset.shelfDone = '1';
    a.outerHTML = `<span class="sh-t">${a.innerHTML}</span>`; li.insertAdjacentHTML('beforeend', ` <span class="small muted">· not in this copy · ${ext(libSearchURL(l), 'Find an edition')}</span>`);
  });
}
const shelfHTML = (s) => {
  const parts = [];
  if (s.shelf.length) parts.push(`<div class="eyebrow" style="margin-top:14px">Study shelf</div><ul class="plain">${s.shelf.map((id) => shelfItem(id)).join('')}</ul>`);
  if (s.again.length) parts.push(`<div class="eyebrow" style="margin-top:14px">Compare with</div><ul class="plain">${s.again.map((id) => shelfItem(id, LIB_STATION[id] ? ` · <a href="#/path/station/${LIB_STATION[id]}">station ${stNum(PATH_STATION_BY_ID[LIB_STATION[id]])}</a>` : '')).join('')}</ul>`);
  return parts.join('');
};
/* the Journey’s questions for reflection are off until a person turns them on (one switch, remembered with the Journey’s other saved state) */
const promptSwitch = (st) => `<button type="button" class="btn ghost sm pq-switch" data-prompts="${st.prompts ? 0 : 1}" aria-pressed="${st.prompts ? 'true' : 'false'}">Questions for reflection: ${st.prompts ? 'on' : 'off'}</button>`;
const themeBox = (t) => `<div class="theme-box"><b>${esc(THEMES[t].name)}</b><p>${esc(THEMES[t].line)}</p><p class="small t2"><b>Where they part:</b> ${esc(THEMES[t].differs)}</p><a class="small" href="#/path/timeline?theme=${t}">Follow this theme through history →</a></div>`;

const lessonSection = (s, key, heading) => (s.lesson && s.lesson[key] ? `<h4>${heading}</h4><p>${esc(s.lesson[key])}</p>` : '');
function dayHTML(s, n, st) {
  const era = ERA_BY_ID[s.era]; const pr = practiceById(s.practice); const nxt = PATH_STATIONS[stIndex(s.id) + 1];
  switch (n) {
    case 1: return `<p>${esc(s.blurb)}</p>${lessonSection(s, 'setting', 'The world it came from')}<h4>Meanwhile, elsewhere · ${esc(era.span)}</h4>${snapHTML(era)}`;
    case 2: return `${lessonSection(s, 'says', 'What we have, and what it says')}<p class="t2">Choose one reading and give it 15–20 minutes. For long books, read one chapter or section. Public-domain editions are the easy start.</p>${readingsHTML(s, st)}${shelfHTML(s)}`;
    case 3: return `${s.words.length ? wordsTable(s.words) : '<p class="t2">No special vocabulary this week. Take one word from the reading instead.</p>'}${s.themes.includes('breath') ? `<details style="margin-top:12px"><summary>Breath is spirit: the same word in 24 languages</summary>${wordsTable(BREATH_WORDS.map((r) => [r[1], r[0], r[2] + ' · ' + r[3]]))}</details>` : ''}`;
    case 4: return `<p>${esc(s.rhyme)}</p><h4>How it is connected to other traditions</h4>${echoesBlock(s, true)}${contemporariesBlock(s)}${lessonSection(s, 'debate', 'What is argued about')}<h4>Themes in this station</h4>${s.themes.map(themeBox).join('')}`;
    case 5: return `<div class="callout">${icon('lotus')}<div><b>${esc(pr.name)}</b> · ${pr.mins.map(fmtMin).join(' · ')}<br>${esc(pr.blurb)}${pr.from ? `<div class="small muted" style="margin-top:6px">From: ${esc(pr.from)}</div>` : ''}${pr.safety ? `<div class="small" style="margin-top:6px">${icon('warn')} ${esc(pr.safety)}</div>` : ''}</div></div>
      <div class="row" style="margin:14px 0"><button class="btn primary lg" data-run="${s.practice}">${icon('play')}Begin</button><button class="btn" data-sheet="${s.practice}">Options…</button></div>${s.rite ? `<h4>A rite for this week</h4><p>${esc(s.rite)}</p>` : ''}`;
    case 6: return `${lessonSection(s, 'legacy', 'Why it still matters')}${st.prompts ? '<p class="t2">Today’s question is about your own life. Answer it honestly, in a sentence or a page.</p>' : ''}${s.rite ? `<h4>A deed to carry it out</h4><p>${esc(s.rite)}</p>` : '<h4>A deed to carry it out</h4><p>Choose one small, concrete act that carries this week into your day. Write it down and do it before you sleep.</p>'}`;
    case 7: return `<p>Share this week with someone at your table: one thing you learned and one thing you doubt. Ask what they think. A religion lives between people.</p><ul class="plain"><li>What do I keep from this station?</li><li>What do I question?</li><li>Where did my body feel it, in the practice or the reading?</li></ul>${nxt ? `<div class="callout">${icon('path')}<div><b>Next:</b> ${esc(nxt.title)} <span class="muted">· ${esc(nxt.when)}</span></div></div>` : ''}`;
    default: return '';
  }
}

async function pathSit(id, sid, ask) {
  const pr = practiceById(id); let rec;
  if (ask) rec = await openSheet(id, pr.def, null, { station: sid });
  else {
    const o = quickOpts(id, pr.def); o.sound = pr.soundDefault || 'none'; o.station = sid; o.bells = { start: true, end: true, every: 0 };
    if (pr.pacer) o.pacer = pr.pacerDefault || undefined; if (pr.choice) o.word = MED.prefs().pathWord || pr.choice[0];
    rec = await runSit(o);
  }
  if (rec && rec.minutesActual >= Math.min(3, pr.def * 0.5)) { PATH.mark(sid, 5, true); toast('Day 5 marked done.', 'good'); Router.render(); }
}

/* ───────────── views ───────────── */
function pathStartView(root) {
  root.querySelector('#pbody').innerHTML = `<section class="card glow fade-in"><div class="eyebrow">${PATH_STATIONS.length} stations · about ${Math.round(PATH_STATIONS.length / 52 * 10) / 10} years at one a week</div><h2 style="font-size:28px;margin:8px 0">Begin at the beginning</h2>
    <p class="t2" style="max-width:68ch">A chronological walk through human religion, from the first burials to now. Each week is one <b>station</b>: a story, a text, key words in the original languages, what was happening on other continents, a physical practice, and, if you turn them on, questions for your own life. Nothing here is skipped for being awkward: every book of the Hebrew Bible, the deuterocanon, the Orthodox and Ethiopian extras, the New Testament, all of Enoch, the Dead Sea Scrolls and the Nag Hammadi library has its place.</p>
    <p class="t2" style="max-width:68ch">The Journey moves on when <i>you</i> finish a day, not by the calendar. About 20 minutes a day, seven days a week, and gaps are fine.</p>
    <div class="row" style="margin-top:14px"><button class="btn primary lg" data-startat="0">${icon('play')}Begin at station 1</button><select class="select" id="eraPick" style="width:auto" aria-label="Start in another era"><option value="">Start in another era…</option>${ERAS.slice(0, -1).map((e) => `<option value="${PATH_STATIONS.findIndex((s) => s.era === e.id)}">${esc(e.name)} · ${esc(e.span)}</option>`).join('')}</select><a class="btn ghost" href="#/path/chronicle">Browse the master timeline</a></div></section>
    <div class="grid c2" style="margin-top:16px"><section class="card fade-in"><div class="card-title"><h3>${icon('check')}${esc(PATH_THESIS.title)} · where they rhyme</h3></div><div class="stack sm small t2">${PATH_THESIS.yes.map((x) => `<p>${esc(x)}</p>`).join('')}</div></section>
      <section class="card fade-in"><div class="card-title"><h3>${icon('swap')}Where they part</h3></div><div class="stack sm small t2">${PATH_THESIS.no.map((x) => `<p>${esc(x)}</p>`).join('')}</div></section></div>
    <section class="card fade-in" style="margin-top:16px"><div class="card-title"><h3>${icon('shield')}How this is kept honest</h3></div><ul class="plain small t2"><li>Dates are approximate scholarly ranges; contested ones say so.</li><li>Short quotations are given in familiar standard translations, so their wording can differ a little from the English in the Library. Search the Library for the sense, or for a word or two of it, rather than for the whole line.</li><li>The Library holds the texts themselves, in English, wherever a public-domain or openly licensed translation exists. For the rest it names a standard translation to look for, because many modern translations are under copyright.</li><li>Practices are gentle: no forced breathing, breath-holds, fasting or sleep loss. The ancient techniques that do those things are listed in Practices, with why they are left out.</li><li>Traditions belong to their communities. Where a practice is closed to outsiders, the Journey says so.</li></ul></section>`;
}

function pathTodayView(root, query) {
  const st = PATH.get(); if (!st.started) return pathStartView(root);
  const s = PATH_STATIONS[Math.min(st.cur, PATH_STATIONS.length - 1)]; const era = ERA_BY_ID[s.era]; const nd = PATH.next(st, s.id); const day = clamp(+query.day || (nd > 7 ? 7 : nd), 1, 7);
  const dd = PATH_DAYS[day - 1]; const done = (st.days[s.id] || []).includes(day); const complete = nd > 7; const last = stIndex(s.id) >= PATH_STATIONS.length - 1; const nxt = PATH_STATIONS[stIndex(s.id) + 1];
  root.querySelector('#pbody').innerHTML = `<section class="card glow fade-in"><div class="spread" style="align-items:flex-start;flex-wrap:wrap;gap:10px"><div><div class="eyebrow">Station ${stNum(s)} of ${PATH_STATIONS.length} · ${esc(era.name)}</div><h2 style="font-size:28px;margin:6px 0 2px">${esc(s.title)}</h2><div class="muted">${esc(s.when)}</div></div><div class="small muted">${PATH.stationsDone(st)} station${PATH.stationsDone(st) === 1 ? '' : 's'} completed</div></div>
      <div class="daystrip" role="tablist" aria-label="Days of this station">${PATH_DAYS.map((d) => { const dn = (st.days[s.id] || []).includes(d.n); return `<a role="tab" aria-selected="${d.n === day}" class="${dn ? 'done' : ''}${d.n === day ? ' on' : ''}" href="#/path/today?day=${d.n}"><span class="num">${dn ? '✓' : d.n}</span><span class="nm">${d.name}</span></a>`; }).join('')}</div></section>
    <section class="card fade-in" style="margin-top:16px"><div class="card-title"><h3>${icon(dd.icon)}Day ${day} · ${dd.name}</h3><span class="tag">about ${dd.min} min</span></div><div class="pday">${dayHTML(s, day, st)}</div>
      ${st.prompts ? `<div class="pq"><div class="eyebrow">Today’s question</div><p>${esc(pathDayPrompt[day](s))}</p><textarea class="textarea" data-note="${s.id}.${day}" placeholder="Your notes (saved on this device)" aria-label="Your notes on today’s question (saved on this device)">${esc(st.notes[s.id + '.d' + day] || '')}</textarea></div>` : ''}
      <div class="row" style="margin-top:14px"><button class="btn ${done ? '' : 'primary'}" data-done="${day}" data-sid="${s.id}">${icon('check')}${done ? 'Marked done · undo' : 'Mark day done'}</button>${day < 7 ? `<a class="btn ghost" href="#/path/today?day=${day + 1}">Day ${day + 1} →</a>` : ''}<a class="btn ghost" href="#/path/station/${s.id}">Whole station</a>${promptSwitch(st)}</div></section>
    ${complete ? `<section class="card flat fade-in" style="margin-top:16px"><div class="callout good">${icon('check')}<div><b>Station complete.</b> ${last ? 'You have finished the first pass of the Journey. The second pass is slower: one primary text a month, read in full, with a partner.' : `Next: <b>${esc(nxt.title)}</b> <span class="muted">· ${esc(nxt.when)}</span>`}</div></div>${last ? '' : `<div class="row" style="margin-top:12px"><button class="btn primary lg" data-next="${stIndex(s.id) + 1}">Begin station ${stIndex(s.id) + 2}</button></div>`}</section>` : ''}`;
}

/* "Go deeper": the traditions this station belongs to, their reading links, and topic searches that always resolve */
function goDeeperHTML(s) {
  const tr = (TRAD_OF_STATION[s.id] || []).map((id) => TRAD_BY_ID[id]).filter(Boolean);
  const links = []; tr.forEach((t) => t.links.slice(0, 3).forEach((l) => { if (!links.some((x) => x[1] === l[1])) links.push(l); }));
  return `<section class="card fade-in" style="margin-top:16px"><div class="card-title"><h3>${icon('link')}Go deeper</h3></div>
    ${tr.length ? `<div class="eyebrow">Journey for</div><div class="row tight" style="margin:6px 0 12px">${tr.map((t) => `<a class="chip" href="#/path/tradition/${t.id}">${esc(t.name)}</a>`).join('')}</div>` : ''}
    ${links.length ? `<div class="eyebrow">Read further</div>${linkList(links.slice(0, 6))}` : ''}
    <div class="eyebrow" style="margin-top:12px">Look up “${esc(s.title)}”</div><div class="row tight" style="margin-top:6px">${searchLinks(s.title).map(([n, u]) => `<a class="btn sm ghost" href="${esc(u)}" target="_blank" rel="noopener noreferrer">${n} ↗</a>`).join('')}</div></section>`;
}

function pathStationView(root, sid) {
  const s = PATH_STATION_BY_ID[sid]; if (!s) { root.querySelector('#pbody').innerHTML = '<div class="card"><p>No such station. <a href="#/path/timeline">Back to all stations</a></p></div>'; return; }
  const st = PATH.get(); const era = ERA_BY_ID[s.era]; const pr = practiceById(s.practice); const i = stIndex(s.id); const prev = PATH_STATIONS[i - 1]; const nxt = PATH_STATIONS[i + 1];
  const cur = st.started && st.cur === i;
  root.querySelector('#pbody').innerHTML = `<div class="small" style="margin-bottom:10px"><a href="#/path/timeline">← All stations</a> · ${esc(era.name)} · ${esc(era.span)}</div>
    <section class="card glow fade-in"><div class="eyebrow">Station ${i + 1} of ${PATH_STATIONS.length}</div><h2 style="font-size:28px;margin:6px 0 2px">${esc(s.title)}</h2><div class="muted">${esc(s.when)} · ${esc(REGION_NAME[s.region])}</div><div style="margin-top:10px">${themeChips(s)}</div>
      <div class="row" style="margin-top:14px">${cur ? `<a class="btn primary" href="#/path/today">Continue this station</a>` : `<button class="btn primary" data-startat="${i}">${icon('path')}${st.started ? 'Move the Journey here' : 'Start the Journey here'}</button>`}${prev ? `<a class="btn ghost" href="#/path/station/${prev.id}">← ${esc(prev.title)}</a>` : ''}${nxt ? `<a class="btn ghost" href="#/path/station/${nxt.id}">${esc(nxt.title)} →</a>` : ''}</div></section>
    <div class="grid c2" style="margin-top:16px"><section class="card fade-in"><div class="card-title"><h3>${icon('sun')}The story</h3></div><p>${esc(s.blurb)}</p><div class="eyebrow" style="margin-top:12px">Where it rhymes</div><p class="small t2">${esc(s.rhyme)}</p></section>
      <section class="card fade-in"><div class="card-title"><h3>${icon('learn')}Texts</h3></div>${readingsHTML(s, st)}${shelfHTML(s)}</section></div>
    ${s.lesson ? `<section class="card fade-in" style="margin-top:16px"><div class="card-title"><h3>${icon('learn')}The lesson</h3></div><div class="pday">${lessonSection(s, 'setting', 'The world it came from')}${lessonSection(s, 'says', 'What we have, and what it says')}${lessonSection(s, 'debate', 'What is argued about')}${lessonSection(s, 'legacy', 'Why it still matters')}</div></section>` : ''}
    ${s.words.length ? `<section class="card fade-in" style="margin-top:16px"><div class="card-title"><h3>${icon('ear')}Words</h3></div>${wordsTable(s.words)}</section>` : ''}
    <section class="card fade-in" style="margin-top:16px"><div class="card-title"><h3>${icon('globe')}Meanwhile, elsewhere · ${esc(era.span)}</h3><a class="btn sm ghost" href="#/path/world?era=${era.id}">On the world chart</a></div>${snapHTML(era)}${contemporariesBlock(s)}</section>
    <section class="card fade-in" style="margin-top:16px"><div class="card-title"><h3>${icon('swap')}Shared ideas: how it connects</h3><a class="btn sm ghost" href="#/path/echoes">All shared ideas</a></div>${echoesBlock(s, false)}</section>
    ${goDeeperHTML(s)}
    <div class="grid c2" style="margin-top:16px"><section class="card fade-in"><div class="card-title"><h3>${icon('swap')}Themes</h3></div>${s.themes.map(themeBox).join('')}</section>
      <section class="card fade-in"><div class="card-title"><h3>${icon('lotus')}${st.prompts ? 'Practice and questions' : 'Practice'}</h3></div><p><b>${esc(pr.name)}</b> · ${pr.mins.map(fmtMin).join(' · ')}<br><span class="t2 small">${esc(pr.blurb)}</span></p><div class="row" style="margin-bottom:10px"><button class="btn" data-sheet="${s.practice}">${icon('play')}Try it now</button></div>${s.rite ? `<div class="eyebrow">Rite</div><p class="small t2">${esc(s.rite)}</p>` : ''}${st.prompts ? `<div class="eyebrow" style="margin-top:10px">Questions</div><ol class="small t2">${s.q.map((q) => `<li>${esc(q)}</li>`).join('')}</ol>` : ''}<div style="margin-top:10px">${promptSwitch(st)}</div></section></div>
    ${typeof relatedBox === 'function' ? relatedBox('station', s.id, { skip: ['time', 'read'] }) : ''}`;      /* SA-02/03, FA-06: the religions this station's texts are tied to (the other half of the Journey view's link) and your marks; “In its time” is left out while “Meanwhile, elsewhere” stays, and “Read” because the station's own Texts card lists the same books */
}

function stationRow(s, st) {
  const dn = (st.days[s.id] || []).length; const cur = st.started && st.cur === stIndex(s.id);
  return `<a class="srow${dn === 7 ? ' done' : ''}${cur ? ' cur' : ''}" href="#/path/station/${s.id}"><span class="n">${stNum(s)}</span><span class="t"><b>${esc(s.title)}</b><span class="muted small">${esc(s.when)}</span></span><span class="tags">${cur ? '<span class="badge">current</span>' : ''}${dn === 7 ? '<span class="badge good">done</span>' : dn ? `<span class="tag">${dn}/7</span>` : ''}</span></a>`;
}
function pathTimelineView(root, query) {
  const st = PATH.get(); const body = root.querySelector('#pbody');
  const chips = `<details class="threads"${query.theme ? ' open' : ''}><summary>Follow a theme through every culture (${Object.keys(THEMES).length})</summary><div class="row tight" style="margin:10px 0 14px"><a class="chip" href="#/path/timeline" aria-pressed="${!query.theme}">All</a>${Object.entries(THEMES).map(([k, t]) => `<a class="chip" href="#/path/timeline?theme=${k}" aria-pressed="${query.theme === k}">${esc(t.name)}</a>`).join('')}</div></details>`;
  if (query.theme && THEMES[query.theme]) {
    const t = THEMES[query.theme]; const list = PATH_STATIONS.filter((s) => s.themes.includes(query.theme) && (!query.era || s.era === query.era)); let lastEra = '';
    body.innerHTML = `${chips}<section class="card glow fade-in"><div class="eyebrow">A theme through history · ${list.length} station${list.length === 1 ? '' : 's'}${query.era && ERA_BY_ID[query.era] ? ' in ' + esc(ERA_BY_ID[query.era].name) : ''}</div><h2 style="font-size:26px;margin:6px 0">${esc(t.name)}</h2><p>${esc(t.line)}</p><p class="small t2"><b>Where they part:</b> ${esc(t.differs)}</p></section>
      <div class="stack sm" style="margin-top:16px">${list.map((s) => { const head = s.era !== lastEra ? `<div class="eyebrow" style="margin:14px 0 4px">${esc(ERA_BY_ID[s.era].name)} · ${esc(ERA_BY_ID[s.era].span)}</div>` : ''; lastEra = s.era; return `${head}${stationRow(s, st)}<div class="small t2 srhyme">${esc(s.rhyme)}</div>`; }).join('')}</div>`;
    return;
  }
  const curEra = st.started ? PATH_STATIONS[Math.min(st.cur, PATH_STATIONS.length - 1)].era : 'e1';
  body.innerHTML = `${chips}<p class="t2 small" style="margin-bottom:12px">${PATH_STATIONS.length} stations in 14 eras. Open an era to see what was happening on every continent at the same time. Choose a theme above to follow it across all cultures in order.</p>${ERAS.map((e) => {
    const list = PATH_STATIONS.filter((s) => s.era === e.id); const dn = list.filter((s) => (st.days[s.id] || []).length === 7).length;
    return `<section class="acc${e.id === curEra ? ' open' : ''}"><button type="button" aria-expanded="${e.id === curEra}"><span class="t"><b>${esc(e.name)}</b><span>${esc(e.span)} · ${list.length} station${list.length === 1 ? '' : 's'}${dn ? ` · ${dn} done` : ''}</span></span>${icon('chevron')}</button><div class="body"><p>${esc(e.blurb)}</p>${snapHTML(e)}<div class="stack sm" style="margin-top:14px">${list.map((s) => stationRow(s, st)).join('')}</div></div></section>`;
  }).join('')}`;
}

/* pathLibraryView lives in 6g-library.js */

function pathThemesView(root) {
  root.querySelector('#pbody').innerHTML = `<section class="card glow fade-in"><div class="card-title"><h3>${esc(PATH_THESIS.title)}</h3></div><div class="grid c2"><div class="stack sm small t2"><div class="eyebrow">Where they rhyme</div>${PATH_THESIS.yes.map((x) => `<p>${esc(x)}</p>`).join('')}</div><div class="stack sm small t2"><div class="eyebrow">Where they part</div>${PATH_THESIS.no.map((x) => `<p>${esc(x)}</p>`).join('')}</div></div></section>
    <section class="card fade-in" style="margin-top:16px"><div class="card-title"><h3>${icon('wave')}Breath is spirit: one idea, ${BREATH_WORDS.length} words</h3></div><p class="t2 small">In dozens of unrelated languages the word for breath is also the word for life, spirit or soul. Whether that reflects a shared experience or shared metaphor is up to you.</p>${wordsTable(BREATH_WORDS.map((r) => [r[1], r[0], r[2] + ' · ' + r[3]]))}</section>
    <h2 style="margin:26px 0 12px">${Object.keys(THEMES).length} themes through history</h2><div class="grid auto-lg">${Object.entries(THEMES).map(([k, t]) => { const n = PATH_STATIONS.filter((s) => s.themes.includes(k)).length; return `<a class="card pcard fade-in" href="#/path/timeline?theme=${k}" style="text-decoration:none;color:inherit"><div class="top"><h3>${esc(t.name)}</h3><span class="tag">${n}</span></div><div class="blurb">${esc(t.line)}</div><div class="small muted"><b>Where they part:</b> ${esc(t.differs)}</div></a>`; }).join('')}</div>
    <p class="onward"><a href="#/path/echoes">Shared ideas: what the traditions seem to share, and how we know →</a></p>`;      /* SA-16: a reading page ends with one way on; the sibling chip under Traditions → Compare. The theme cards above already open their stations. */
}

function pathPracticesView(root) {
  const card = (p, path) => `<article class="card pcard" data-sheet="${p.id}" tabindex="0" role="button" aria-label="${esc(p.name)}"><div class="top"><h3>${esc(p.name)}</h3>${path ? '<span class="tag">traditional</span>' : UI.evidence(practiceById(p.id).evidence, false)}</div><div class="blurb">${esc(p.blurb)}</div>${path ? `<div class="small muted">${esc(p.from)}</div>` : ''}<div class="foot"><span class="tag">${p.mins.map(fmtMin).join(' · ')}</span><button class="btn sm primary" data-sheet="${p.id}">${icon('play')}Set up</button></div></article>`;
  const stat = { used: 'good', adapted: '', 'not used': 'bad' };
  root.querySelector('#pbody').innerHTML = `<p class="t2 small" style="max-width:70ch">${PATH_PRACTICES.length} practices from the Journey’s traditions, plus the breath, body and kindness sits from Meditate. They are gentle on purpose. Traditional practices have not been tested in trials as such; the evidence ratings shown are for the modern sits.</p>
    <p class="onward"><a href="#/gather">Worship together: how groups meet and keep time →</a></p>
    <div class="grid auto-lg">${PATH_PRACTICES.map((p) => card(p, true)).join('')}</div>
    <section class="card fade-in" style="margin-top:22px"><div class="card-title"><h3>${icon('wave')}Ancient breathing: what the Journey uses and what it leaves out</h3></div><p class="small t2">Many traditions developed breath practices. Some are gentle and worth keeping. Others work by changing blood chemistry (fast breathing, long holds), which can feel dramatic and has real risks: fainting, seizures in susceptible people, and drowning if done near water. None of them is needed here.</p><div class="table-wrap"><table class="stat-table"><tr><th>Practice</th><th>From</th><th>In the Journey</th><th>Notes</th></tr>${BREATH_LIBRARY.map((b) => `<tr><td><b>${esc(b.name)}</b></td><td class="small">${esc(b.tradition)}</td><td><span class="badge ${stat[b.status]}">${b.status}</span></td><td class="small t2">${esc(b.note)}</td></tr>`).join('')}</table></div></section>
    <h2 style="margin:26px 0 12px">Sits from Meditate</h2><div class="grid auto-lg">${PRACTICES.map((p) => card(p, false)).join('')}</div>`;
}

function pathYearView(root) {
  const now = new Date(); const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const items = YEAR_WHEEL.map(([m, d, name, trad, what]) => { let dt = new Date(now.getFullYear(), m - 1, d); if (dt < today) dt = new Date(now.getFullYear() + 1, m - 1, d); return { dt, days: Math.round((dt - today) / 864e5), name, trad, what }; }).sort((a, b) => a.days - b.days);
  root.querySelector('#pbody').innerHTML = `<p class="t2 small" style="max-width:70ch">Fixed-date days from the traditions in the Journey, with what people do. Moveable ones (Easter and Holy Week, Passover, Ramadan, Diwali, Vesak, Lunar New Year, Pentecost) follow lunar calendars: look them up each year. The shared bones are the four solstices and equinoxes and the four days between them.</p>
    <p class="onward"><a class="btn sm" href="#/atlas">${icon('globe')}See the traditions on the map</a></p>
    <div class="stack sm">${items.map((x) => `<div class="card tight flat yrow"><div class="when"><b>${x.days === 0 ? 'today' : `in ${x.days} day${x.days === 1 ? '' : 's'}`}</b><span class="muted small">${x.dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span></div><div><b>${esc(x.name)}</b> <span class="tag">${esc(x.trad)}</span><div class="small t2">${esc(x.what)}</div></div></div>`).join('')}</div>`;
}

const notebookMD = (st) => {
  let md = '# Journey notes\n\n'; if (st.rule) md += '## Rule of life\n\n' + st.rule + '\n\n'; let last = '';
  Object.keys(st.notes).sort().forEach((k) => { const [sid, d] = k.split('.d'); if (sid !== last) { const s = PATH_STATION_BY_ID[sid]; md += `\n## ${s ? s.title : sid}\n\n`; last = sid; } md += `- Day ${d} (${PATH_DAYS[+d - 1].name}): ${st.notes[k].replace(/\n/g, '\n  ')}\n`; });
  return md;
};
function pathNotebookView(root) {
  const st = PATH.get(); const keys = Object.keys(st.notes).sort(); const bySt = {}; keys.forEach((k) => { const sid = k.split('.d')[0]; (bySt[sid] = bySt[sid] || []).push(k); });
  root.querySelector('#pbody').innerHTML = `<section class="card glow fade-in"><div class="card-title"><h3>${icon('journal')}My rule of life</h3></div><p class="t2 small">A short written pattern for your days, weeks and year. The last stations of the Journey help you write it; keep it somewhere you can edit.</p><textarea class="textarea" id="ruleBox" style="min-height:160px" placeholder="Daily: …&#10;Weekly: …&#10;Yearly: …&#10;Three commitments: …&#10;One thing I refuse: …">${esc(st.rule || '')}</textarea></section>
    <section class="card fade-in" style="margin-top:16px"><div class="card-title"><h3>Journey notes</h3><button class="btn sm" id="nbExport">${icon('download')}Export (Markdown)</button></div>${keys.length ? Object.entries(bySt).map(([sid, ks]) => { const s = PATH_STATION_BY_ID[sid]; return `<div style="margin-bottom:14px"><b><a href="#/path/station/${sid}">${esc(s ? s.title : sid)}</a></b>${ks.map((k) => { const d = +k.split('.d')[1]; return `<div class="small" style="margin-top:6px"><span class="tag">Day ${d} · ${PATH_DAYS[d - 1].name}</span> ${esc(st.notes[k])}</div>`; }).join('')}</div>`; }).join('') : '<p class="t2">Nothing yet. Notes you write on each day of a station appear here. <a href="#/path/today">Open this week’s station →</a></p>'}<div class="hint">Stored only in this browser. Export from here or from Setup to keep a backup.</div></section>
    <p class="onward"><a href="#/path/today">Continue the Journey</a> · <a href="#/atlas">See it on the map</a></p>`;
  $('#nbExport', root).addEventListener('click', () => download('lamplighter-journey-notes.md', notebookMD(PATH.get()), 'text/markdown'));
  $('#ruleBox', root).addEventListener('input', debounce((e) => PATH.upd((s) => { s.rule = e.target.value; }), 300));
}

Pages.path = {
  mount(root, parts, query) {
    const tab = parts[0] === 'station' ? 'timeline' : parts[0] === 'read' ? 'library' : parts[0] === 'read-random' ? 'passage' : parts[0] === 'tradition' ? 'traditions' : parts[0] === 'thread' ? 'threads' : parts[0] === 'motif' ? 'motifs' : (PATH_TABS.some((t) => t[0] === parts[0]) ? parts[0] : 'today');
    const loc = secLocate('path/' + tab);      /* which place of the app this view belongs to and which tab: the head and the tabs come from the sections table (2z-sections-core.js) */
    root.innerHTML = `${secHeadHTML(loc, { search: true })}
      ${secNavHTML(loc, {})}<div id="pbody"></div>`;
    if (parts[0] === 'station') pathStationView(root, parts[1]);
    else if (parts[0] === 'read') pathReadView(root, parts[1], query);
    else if (parts[0] === 'read-random') pathReadRandomView(root, query);
    else if (parts[0] === 'gallery') pathGalleryView(root, parts[1], query);
    else if (parts[0] === 'tradition') pathTraditionView(root, parts[1]);
    else if (parts[0] === 'thread') pathThreadView(root, parts[1], query);
    else if (parts[0] === 'motif') pathMotifView(root, parts[1], query);
    else ({ today: pathTodayView, timeline: pathTimelineView, world: pathWorldView, echoes: pathEchoesView, library: pathLibraryView, shelves: pathShelvesView, themes: pathThemesView, practices: pathPracticesView, intentions: pathIntentionsView, year: pathYearView, notebook: pathNotebookView, chronicle: pathChronicleView, traditions: pathTraditionsView, passage: pathPassageView, bibles: pathBiblesView, links: pathLinksView, glossary: pathGlossaryView, marks: pathMarksView, threads: pathThreadsView, parallels: pathParallelsView, similar: pathSimilarView, motifs: pathMotifsView, wander: pathWanderView, rites: pathRitesView, plants: pathPlantsView, sound: pathSoundView, image: pathImageView, imagined: pathImaginedView, hidden: pathHiddenView, search: pathSearchView, common: pathCommonView, freedom: pathFreedomView, own: pathOwnView, carry: pathCarryView }[tab])(root, query);
    UI.wireInfo(root);
    TXT.index().then((meta) => { if (!meta) return; $$('.rlist [data-read]', root).forEach((inp) => { const id = inp.dataset.read; const li = inp.closest('li'); if (!meta[id] || !li || li.querySelector('.rd-link')) return; li.insertAdjacentHTML('beforeend', `<div class="small" style="margin-top:6px"><a class="btn sm primary rd-link" href="#/path/read/${id}">Read it here</a> <span class="muted">full text included</span></div>`); }); pathShelfFill(root, meta); });

    const offs = []; const on = (ev, fn) => { root.addEventListener(ev, fn); offs.push(() => root.removeEventListener(ev, fn)); }; // #main persists between pages, so listeners must be removed on leave
    on('click', async (e) => {
      const sv = e.target.closest('[data-shelve]'); if (sv) { e.preventDefault(); const sid = sv.dataset.shelve; shelveBox(sid).then(() => shelfRefresh(root, sid)); return; }
      const acc = e.target.closest('.acc > button'); if (acc) { const on = acc.parentElement.classList.toggle('open'); acc.setAttribute('aria-expanded', on); return; }
      const pq = e.target.closest('[data-prompts]'); if (pq) { PATH.upd((s) => { s.prompts = pq.dataset.prompts === '1'; }); const y = window.scrollY; Promise.resolve(Router.render()).then(() => { window.scrollTo(0, y); const sw = document.querySelector('.pq-switch'); if (sw) sw.focus({ preventScroll: true }); }); return; }      /* the switch for the questions for reflection: redraw in place, at the same scroll, with the focus kept on the switch */
      const sa = e.target.closest('[data-startat]'); if (sa) { PATH.start(+sa.dataset.startat); pathGoto('#/path/today'); return; }
      const dn = e.target.closest('[data-done]'); if (dn) { const n = +dn.dataset.done; const sid = dn.dataset.sid; const was = (PATH.get().days[sid] || []).includes(n); PATH.mark(sid, n, !was); const nx = was ? n : Math.min(7, n + 1); const hh = '#/path/today?day=' + nx; if (location.hash === hh || (!was && n === 7)) Router.render(); else location.hash = hh; return; }
      const nx = e.target.closest('[data-next]'); if (nx) { PATH.start(+nx.dataset.next); if (location.hash === '#/path/today') Router.render(); else location.hash = '#/path/today'; return; }
      const run = e.target.closest('[data-run]'); if (run) { const s = PATH_STATIONS[PATH.get().cur]; pathSit(run.dataset.run, s ? s.id : null, false); return; }
      const sh = e.target.closest('[data-sheet]'); if (sh) { e.stopPropagation(); const cur = PATH.get(); const s = PATH_STATIONS[cur.cur]; pathSit(sh.dataset.sheet, parts[0] === 'station' ? parts[1] : (tab === 'today' && cur.started && s ? s.id : null), true); }
    });
    on('change', (e) => { const c = e.target.closest('[data-read]'); if (c) { shfMarkRead(c.dataset.read, c.checked); const st2 = PATH.get(); $$('[data-gcount]', root).forEach((el) => { const [a, b] = PATH.readCount(st2, el.dataset.gcount); el.textContent = `${a}/${b} read`; }); $$('[data-scount]', root).forEach((el) => { const boxes = $$('[data-read]', el.closest('.subshelf')); el.textContent = `${boxes.filter((x) => x.checked).length}/${boxes.length} read`; }); }
      const ep = e.target.closest('#eraPick'); if (ep && ep.value !== '') { PATH.start(+ep.value); pathGoto('#/path/today'); } });
    on('input', debounce((e) => { const t = e.target.closest('[data-note]'); if (t) { const [sid, d] = t.dataset.note.split('.'); PATH.note(sid, +d, t.value.trim()); } }, 400));
    on('keydown', (e) => { if (e.key === 'Enter' && e.target.classList.contains('pcard')) e.target.click(); });
    on('submit', (e) => { const f = e.target.closest && e.target.closest('#hSearch'); if (!f) return; e.preventDefault(); const q = $('#hQ', root).value.trim(); if (q) location.hash = srchHash(q, srchOpts({})); });
    return () => { offs.forEach((f) => f()); PATH_LEAVE.splice(0).forEach((f) => { try { f(); } catch (e) { console.error(e); } }); Speech.cancel(); };
  },
};
