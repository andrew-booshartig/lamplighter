/* The Atlas-side time pages of the structure audit (STRUCTURE_AUDIT.md, 21 November 2026; SA-06, SA-11, SA-15 (the Conflicts part), SA-19): the Related strip at the end of an event's panel (6pw-history.js), a conflict's entry
   (6zzd-conflicts.js), a calendar's card (6r-calendars.js) and a movement card (6zy-movements.js), the plain words of the Conflicts page's “how far checked” line, the chosen calendar's “Traditions” (the strip shows the people the card's own
   “Used by” row showed), and the loader of the strip, which now serves a page that calls it many times at once (the 13 cards of High-control groups). The pure parts of History's religion filter (t) and of its late-conflict address are
   in tests/history.test.js. Reads the built atlas/ and texts/ folders beside the project for the data checks. Run: node tests/structure-atlas-time.test.js */
const fs = require('fs'); const path = require('path'); const vm = require('vm');
const ROOT = path.join(__dirname, '..'); const PROJ = path.join(ROOT, '..'); const SRC = path.join(ROOT, 'src/js');
let pass = 0; let fail = 0; const ok = (n, c, x) => { if (c) pass++; else { fail++; console.log('FAIL', n, x === undefined ? '' : (typeof x === 'string' ? x : JSON.stringify(x)).slice(0, 700)); } };
const strip = (s) => s.replace(/\nif \(typeof module !== 'undefined' && module\.exports\)[^\n]*/g, ''); const raw = (f) => fs.readFileSync(path.join(SRC, f), 'utf8'); const src = (f) => strip(raw(f));
const ESC = `const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));\n`;

/* ── 1. the four call sites: one call each, guarded, with the arguments the strip's design gives them ── */
const SITES = [
  ['6pw-history.js', /\$\{typeof relatedBox === 'function' \? relatedBox\('event', e\.id, isRel \? \{ skip: \['traditions'\], has: \['#\/atlas\?y=' \+ ysnap\], trad: trads\[0\], year: e\.year_start \} : \{ skip: \['traditions', 'read', 'conflicts'\], has: \['#\/atlas\?y=' \+ ysnap\] \}\) : ''\}/],      /* FA-05: and not the map address the panel's own button already links */
  ['6zzd-conflicts.js', /\$\{typeof relatedBox === 'function' \? relatedBox\('conflict', en\.id, \{ skip: \['traditions', 'time'\] \}\) : ''\}/],
  ['6r-calendars.js', /\$\{which === c\.id && typeof relatedBox === 'function' \? relatedBox\('calendar', c\.id, \{\}\) : ''\}/],
  ['6zy-movements.js', /\$\{typeof relatedBox === 'function' \? relatedBox\('movement', m\.id, (?:\{\}|\{ skip: \['traditions', 'read'\] \})\) : ''\}/]];      /* a card draws its own religion and texts, so the final audit (FA-06) has it skip both: the call may carry that list or none */
for (const [f, re] of SITES) {
  const s = raw(f); const calls = s.split('\n').filter((l) => /\brelatedBox\(/.test(l));
  ok(`${f}: one call of relatedBox(, guarded (a copy without the strip still opens the page), with its own kind, id and options`, calls.length === 1 && /typeof relatedBox === 'function'/.test(calls[0]) && re.test(s), calls);
}
{ const t = fs.readFileSync(path.join(__dirname, 'related.test.js'), 'utf8'); const req = /const REQUIRED = \[([^\]]*)\]/.exec(t); const pend = /const PENDING = \[([^\]]*)\]/.exec(t);
  ok('the four pages are among those the strip’s own test requires to call it, and none of them is still listed as pending', !!req && SITES.every(([f]) => req[1].includes("'" + f + "'") && !(pend && pend[1].includes("'" + f + "'")))); }
{ const s = raw('6zy-movements.js'); const i = s.indexOf("relatedBox('movement'");
  ok('the movement card ends with its strip, inside the card’s body after its sources, and the file has no other change of its own to the strip (the cards’ data and wording are another session’s)', i > s.indexOf('<h4>Sources, and where to look further</h4>') && s.slice(i).indexOf('</div></details>`;') > 0 && s.slice(i).indexOf('</div></details>`;') < 120); }

/* ── 2. the Conflicts page: the “how far checked” line in plain words, and the strip at the end of an entry ── */
const prefixC = ESC + "const ext = (u, t) => `<a href=\"${esc(u)}\" target=\"_blank\" rel=\"noopener noreferrer\">${t} ↗</a>`; const icon = () => ''; const debounce = (f) => f; const Pages = {}; const histSrcKind = {};\nlet relatedBox; const setRel = (f) => { relatedBox = f; };\n";
const C = new Function(prefixC + src('2z-conflicts-core.js') + '\n' + src('6zzd-conflicts.js') + '\nreturn { cnfTopHTML, cnfEntryHTML, cnfListHTML, setRel };')();
const cf = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/atlas_src/json/world_conflicts.json'), 'utf8')); const E = cf.entries; const wm = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/atlas_src/json/world_meta.json'), 'utf8'));
const world = { meta: Object.assign({}, wm, { conflicts: cf.meta }), strands: [], events: E }; const tix = { trad: new Proxy({}, { get: (o, k) => (typeof k === 'string' ? { id: k, name: 'T-' + k } : undefined), has: () => true }) };
{ const top = C.cnfTopHTML(world); const at = top.indexOf('<details'); const head = top.slice(0, at);
  ok('SA-15: the Conflicts page says how far it has been checked in plain words (read by the author only, no specialist has checked it yet), with the page’s own note after it, and never “first reading” or “second reading”', /<b>How far this has been checked:<\/b> read by the author only; no specialist has checked it yet\. /.test(head) && /Found a mistake\? <a href="#\/setup\?fb=1">/.test(head) && !/first reading|second reading/i.test(top) && !/first reading|second reading/i.test(C.cnfEntryHTML(world, E[0], { ix: tix, st: { k: '', r: '', e: '', t: '', c: '', q: '', o: '' } })) && !/first reading|second reading/i.test(C.cnfListHTML(world, E, { k: '', r: '', e: '', t: '', c: '', q: '', o: '' }, { ctx: { anc: () => [], name: (t) => t }, choices: [], bare: false }))); }
{ const seen = []; C.setRel((kind, id, o) => { seen.push([kind, id, o]); return '<section class="rel">STRIP</section>'; }); const e = E.find((x) => x.id === 'thirty-years-war'); const h = C.cnfEntryHTML(world, e, { ix: tix, st: { k: '', r: '', e: '', t: '', c: '', q: '', o: '' } });
  const late = E.find((x) => x.year_start > 1900); const hl = C.cnfEntryHTML(world, late, { ix: tix, st: {} });
  ok('SA-15 / strip: an entry ends with the strip (the last block of the entry, after its sources), asked for by the entry’s own id and leaving out the religion buttons and the timeline button it draws itself', h.endsWith('<section class="rel">STRIP</section>\n  </div>') && h.indexOf('<h3>Sources</h3>') < h.indexOf('class="rel"') && seen.length === 2 && seen[0][0] === 'conflict' && seen[0][1] === 'thirty-years-war' && JSON.stringify(seen[0][2]) === '{"skip":["traditions","time"]}' && /class="btn sm ghost" href="#\/history\?s=thirty-years-war">On the timeline</.test(h) && /class="btn sm" href="#\/atlas\/tradition\//.test(h), h.slice(-200));
  ok('SA-06: a conflict after 1900 shows one line and no dead link: the entry’s own sentence about the timeline, no “On the timeline” button', /After 1900, beyond the span of the timeline\./.test(hl) && !/On the timeline/.test(hl) && !/href="#\/history\?s=/.test(hl.replace(/<section class="rel">STRIP<\/section>/, '')), late.id);
  C.setRel(undefined); const h0 = C.cnfEntryHTML(world, E[0], { ix: tix, st: {} }); ok('without the strip in the page an entry is drawn as before and nothing breaks', !/class="rel"/.test(h0) && /<h3>Sources<\/h3>/.test(h0) && !/undefined|NaN|\[object/.test(h0)); }

/* ── 3. the calendar page: the chosen calendar's card ends with the strip, and its own “Used by” row is not repeated beside it ── */
const calFiles = ['2n-calendar.js', '2u-calendar-systems.js', '2t-atlas-core.js', '6r-calendars.js'];
const prefixK = ESC + `const icon = (n) => '<svg data-i="' + n + '"></svg>'; const mem = {}; const store = { get: (k, d) => (k in mem ? JSON.parse(mem[k]) : d), set: (k, v) => { mem[k] = JSON.stringify(v); } };
const el = () => ({ value: '1', addEventListener() {}, scrollIntoView() {} }); const holder = { body: null }; const $ = (sel) => (sel === '#abody' ? holder.body : el()); const $$ = () => [];
const stops = [{ year: -340000 }, { year: -3000 }, { year: 1 }, { year: 1500 }, { year: 2026 }]; const ATLD = { ix: { trad: new Proxy({}, { get: (o, k) => (typeof k === 'string' ? { id: k, name: 'T-' + k } : undefined) }) }, need: async () => null, get: (n) => (n === 'index' ? { config: { slider_scale: { stops } } } : null) };
let relatedBox; const setRel = (f) => { relatedBox = f; };\n`;
const K = new Function(prefixK + calFiles.map(src).join('\n') + '\nreturn { atlasCalendarsView, holder, setRel, CALENDARS };')();
const drawCal = async (which, rel) => { K.setRel(rel); K.holder.body = { innerHTML: '', querySelector() { return null; } }; await K.atlasCalendarsView({ querySelector: () => ({ textContent: 'x' }) }, which, { y: '2026' }); return K.holder.body.innerHTML; };
const cardOf = (h, id) => { const i = h.indexOf(`<article class="card flat cal-card`); const m = new RegExp(`<article class="card flat cal-card[^"]*" id="cal-${id}">`).exec(h); if (!m) return ''; const a = m.index; return h.slice(a, h.indexOf('</article>', a) + 10); };
async function calendarChecks() {
  const calls = []; const strip2 = (kind, id, o) => { calls.push([kind, id, o]); return '<section class="rel">STRIP</section>'; };
  const withStrip = await drawCal('hebrew', strip2); const without = await drawCal('hebrew', undefined); const none = await drawCal('', strip2); const hostile = await Promise.all(['__proto__', 'constructor', 'nope', 'hebrew<b>'].map((w) => drawCal(w, strip2)));
  const ids = K.CALENDARS.map((c) => c.id); const used = (h, id) => /Used by/.test(cardOf(h, id));
  ok('SA-19: the chosen calendar’s card ends with the strip (after its slider checkbox, inside the card), asked for by the calendar’s id with no options, and leaves out its own “Used by” row (the strip lists the same people first)', calls.length === 1 && calls[0][0] === 'calendar' && calls[0][1] === 'hebrew' && JSON.stringify(calls[0][2]) === '{}' && /Show on the map’s time slider<\/span><\/label><section class="rel">STRIP<\/section><\/article>$/.test(cardOf(withStrip, 'hebrew')) && !used(withStrip, 'hebrew') && (cardOf(withStrip, 'hebrew').match(/class="rel"/g) || []).length === 1, cardOf(withStrip, 'hebrew').slice(-260));
  ok('every other card keeps its row and has no strip (one calendar at a time), and the drawn cards are the same as without the strip', ids.filter((id) => id !== 'hebrew').every((id) => used(withStrip, id) === used(without, id) && cardOf(withStrip, id) === cardOf(without, id)) && (withStrip.match(/class="rel"/g) || []).length === 1);
  ok('with no calendar chosen, or a name that is no calendar (hostile or not), no card has the strip and every row stays; without the strip in the page every card keeps its row, the chosen one too', !/class="rel"/.test(none) && hostile.every((h) => !/class="rel"/.test(h) && ids.every((id) => used(h, id) === used(without, id))) && used(without, 'hebrew') && ids.filter((id) => K.CALENDARS.find((c) => c.id === id).used && K.CALENDARS.find((c) => c.id === id).used.length).every((id) => used(without, id)));
  ok('the other parts of the page are the same with the strip as without it (the converter, the table, the explanations): only the chosen card differs', (() => { const cut = (h) => h.replace(cardOf(h, 'hebrew'), ''); return cut(withStrip) === cut(without); })());
}

/* ── 4. the data: the strip lists the people the card listed, then those descended from them (SA-19), and says when the events begin ── */
async function dataChecks() {
  const need = ['atlas/index.js', 'atlas/core.js', 'atlas/world.js', 'atlas/sites.js', 'atlas/texts.js', 'texts/index.js', 'texts/figs.js']; const missing = need.filter((f) => !fs.existsSync(path.join(PROJ, f)));
  ok('the built atlas/ and texts/ folders are beside the project (the data checks read them)', missing.length === 0, missing);
  if (!missing.length) {
    const G = { data: {} }; const sandbox = { BEATLAB_ATLAS: { data: G.data, add(n, d) { G.data[n] = d; } }, BEATLAB_TEXTS: { meta: {}, addIndex(m) { Object.assign(this.meta, m); } } }; sandbox.globalThis = sandbox; vm.createContext(sandbox); need.forEach((f) => vm.runInContext(fs.readFileSync(path.join(PROJ, f), 'utf8'), sandbox)); globalThis.BEATLAB_FIGN = sandbox.BEATLAB_FIGN;
    const order = ['24-data-path-lib.js', '25-data-path-world.js', '27-data-path-stations-a.js', '28-data-path-stations-b.js', '29-data-path-stations-c.js', '2a-data-path-stations-d.js', '2c-data-path-time.js', '2t-atlas-core.js', '2u-calendar-systems.js', '2y-data-stories.js', '2z-data-movements.js', '2z-history-core.js', '2z-conflicts-core.js', '2z-passage-filter-core.js', '2z-passage-index.js', '2z-related-core.js', '6zzh-related.js'];
    const pre = ESC + `const MARKS = { all: () => ({}) }; const TXT = { has: () => false }; const ATLD = { ix: null, get: (n) => G.data[n] || null };\n`;
    const R = new Function('G', pre + order.map(src).join('\n') + `\nATLD.ix = (function () { const core = G.data.core; const ix = atlIndex(core); atlSetGroups(ix, G.data.index.config.family_groups.groups); ix.cfg = G.data.index.config; ix.codes = G.data.index.codes; return ix; })();\nreturn { relatedFor, REL_MAX, CALENDARS, ATLD, atlDescendants };`)(G);
    const bad = []; let withTail = 0; for (const c of R.CALENDARS) {
      const used = (c.used || []).filter((u) => R.ATLD.ix.trad[u]); const g = R.relatedFor('calendar', c.id).find((x) => x.key === 'traditions'); if (!g) { bad.push(c.id + ' none'); continue; }
      const names = g.items.map((i) => i.href.replace('#/atlas/tradition/', '')); const seen = new Set(used); const kin = []; used.forEach((u) => R.atlDescendants(R.ATLD.ix, u).forEach((k) => { if (!seen.has(k)) { seen.add(k); kin.push(k); } }));
      const sorted = [...used].sort((a, b) => R.ATLD.ix.trad[a].name.localeCompare(R.ATLD.ix.trad[b].name)).join();
      if (used.length > R.REL_MAX || names.join() !== sorted || !g.items.every((i) => i.sub === 'names it') || g.more || (kin.length ? !g.tail || !g.tail.text.startsWith('and ' + kin.length + ' ') || !/branch/.test(g.tail.text) || !/^#\/traditions\/tree\?open=/.test(g.tail.href) || g.tail.link !== 'see the list' : !!g.tail) || /descend|came from|deriv/i.test(JSON.stringify(g))) bad.push(c.id); if (g.tail) withTail++;
    }
    ok('FA-07: for every one of the 22 calendars the strip’s “Traditions” lists only the traditions that name it (every one the card’s own “Used by” row lists, none more than the five the strip shows, each marked “names it”), and the ones below them in the family tree are one line that counts them and links the family tree, never items of the list', R.CALENDARS.length === 22 && bad.length === 0 && withTail >= 8, [bad, withTail]);
    ok('FA-07: a calendar of a religion with branches (the Hebrew, the Common Era, the Islamic) says in that one line how many traditions are branches of the ones that name it, with “see the list” to the family tree, and the line says no more than the tree’s own relation (“branches of”, never “descended from” or “came from”)', ['hebrew', 'gregorian', 'islamic'].every((id) => { const g = R.relatedFor('calendar', id).find((x) => x.key === 'traditions'); return g && g.tail && /^and \d+ traditions that are branches of (?:it|these):$/.test(g.tail.text) && +/^and (\d+)/.exec(g.tail.text)[1] > 10 && /^#\/traditions\/tree\?open=/.test(g.tail.href); }));
    ok('FA-07: the “In its time” of a calendar says in plain words what the list is (events dated after the calendar came into use, nearest first, listed for context, not as connected), and every event in it is dated at or after the year the data gives for when the count came into use, not the epoch it counts from (800 CE for the Hebrew count, not the Creation)', (() => { const W = G.data.world.events; const byId = Object.fromEntries(W.map((e) => [e.id, e])); const byLabel = Object.fromEntries(W.map((e) => [e.label, e])); let n = 0;
      const all = R.CALENDARS.every((c) => { const g = R.relatedFor('calendar', c.id).find((x) => x.key === 'time'); if (!g) return true; n++; return g.note === 'Events dated after this calendar came into use, nearest first. Listed for context, not as connected.' && g.items.every((i) => { const m = /[?&]s=([^&]+)/.exec(i.href || ''); const e = m ? byId[decodeURIComponent(m[1])] : byLabel[i.label]; return !!e && e.year_start >= c.since; }); });
      return all && n >= 20 && !!R.relatedFor('calendar', 'hebrew').find((x) => x.key === 'time'); })());
  }
}

/* ── 5. the loader of the strip: a page that calls it many times in one pass (the 13 movement cards) asks for each file once, every call waits for that one answer, and every strip is completed ── */
async function loaderChecks() {
  const make = (failIx) => {
    const pre = ESC + `const log = { open: 0, need: [], index: 0, script: 0 }; const waits = []; const pend = () => new Promise((res) => waits.push(res));
const els = {}; const document = { querySelector(sel) { const m = /data-rel-wait="(r\\d+)"/.exec(sel); if (!m) return null; return els[m[1]] || (els[m[1]] = { done: '', outerHTML: null, removed: false, remove() { this.removed = true; } }); } };
const TXT = { has: () => false, index() { log.index++; return pend().then(() => { BEATLAB_TEXTS = { meta: { x: 1 } }; }); }, script() { log.script++; return pend().then(() => { BEATLAB_FIGN = {}; }); } }; let BEATLAB_TEXTS = null; var BEATLAB_FIGN;
const ATLD = { ix: null, data: {}, get(n) { return this.data[n] || null; }, open() { log.open++; return pend().then(() => { if (${failIx ? 'true' : 'false'}) throw new Error('no'); ATLD.ix = { trad: { x: { id: 'x', name: 'X', date_label: '1900' } }, kids: {} }; }); }, need(n) { log.need.push(n); return pend().then(() => { ATLD.data[n] = n === 'world' ? { events: [] } : []; }); } };
const MOVEMENTS = [{ id: 'a', name: 'A', atlas: 'x', books: [], review: 'x' }, { id: 'b', name: 'B', atlas: 'x', books: [], review: 'x' }, { id: 'c', name: 'C', atlas: 'x', books: [], review: 'x' }]; const LIB_BY_ID = {}; const CALENDARS = [];\n`;
    return new Function(pre + ['2z-related-core.js', '6zzh-related.js'].map(src).join('\n') + '\nreturn { relatedBox, log, waits, els, ATLD };')();
  };
  const run = async (failIx) => {
    const L = make(failIx); const first = ['a', 'b', 'c'].map((id) => L.relatedBox('movement', id, {})); const isHold = (h) => /^<section class="rel" data-rel-wait="r\d+" aria-busy="true" hidden><\/section>$/.test(h);
    const holdsAtOnce = first.every(isHold); const asked = JSON.stringify({ open: L.log.open, need: L.log.need.slice().sort(), index: L.log.index, script: L.log.script });
    let guard = 0; while (guard++ < 50) { const w = L.waits.splice(0); if (!w.length) break; w.forEach((r) => r()); await new Promise((r) => setTimeout(r, 0)); }
    const toks = first.map((h) => /data-rel-wait="(r\d+)"/.exec(h)[1]); const done = toks.map((t) => L.els[t]);
    return { holdsAtOnce, asked, done, again: L.relatedBox('movement', 'a', {}) };
  };
  {
    const a = await run(false); const f = await run(true);
    ok('a page that calls the strip three times at once gets three hidden places, not three strips made from half the data, and the files are asked for once each (the atlas index, the world, the readable texts)', a.holdsAtOnce && a.asked === JSON.stringify({ open: 1, need: ['world'], index: 1, script: 0 }), a.asked);
    ok('when the files arrive every place is completed, each with the same strip (the movement’s own religion), and a call made afterwards draws at once', a.done.every((d) => d && typeof d.outerHTML === 'string' && /Traditions/.test(d.outerHTML) && /<a href="#\/atlas\/tradition\/x">X<\/a>/.test(d.outerHTML)) && /^<section class="rel(?: rel-one)?" aria-label="Related">/.test(a.again), a.done.map((d) => d && d.outerHTML && d.outerHTML.slice(0, 60)));
    ok('a file that fails to load does not leave a place waiting for ever: every place is answered (a strip from what there is, or removed), and the failure is not asked for again', f.done.every((d) => d && (d.removed || typeof d.outerHTML === 'string')) && f.holdsAtOnce && /"open":1/.test(f.asked));
  }
}

/* ── 6. the stylesheet: one block at the end of app.css for these pages, in rem, written so tests/tap-second.test.js still finds its own block ── */
function css() {
  const sheet = fs.readFileSync(path.join(ROOT, 'src/css/app.css'), 'utf8'); const i = sheet.indexOf('/* ═══ Structure audit of 21 November 2026, the Atlas side, the time pages'); const j = i < 0 ? -1 : sheet.indexOf('/* ═══', i + 10); const blk = i < 0 ? '' : sheet.slice(i, j < 0 ? sheet.length : j);
  ok('the stylesheet has the block for these pages once: the religion chip, the line about 1900 and the strip’s places in a panel, an entry and a card; sizes in rem, none in pixels, and no media rule of the exact text that tests/tap-second.test.js looks for last', i >= 0 && sheet.indexOf('/* ═══ Structure audit of 21 November 2026, the Atlas side, the time pages', i + 10) < 0 && ['.hx-filt{', '.hx-tchip{', '.hx-stop{', '.hx-panel .rel{', '.cnf-entry .rel{', '.cal-card .rel{', '.mov-body .rel{'].every((s) => blk.includes(s)) && !/font-size:\s*[\d.]+px/.test(blk) && /width:0\.75rem/.test(blk) && !blk.includes('@media (pointer:coarse),(max-width:760px){'), blk.slice(0, 80));
}

(async () => { await calendarChecks(); await dataChecks(); await loaderChecks(); css(); console.log(`structure-atlas-time: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0); })().catch((e) => { ok('the checks run without an error', false, String(e && e.stack).split('\n').slice(0, 4).join(' | ')); console.log(`structure-atlas-time: ${pass} passed, ${fail} failed`); process.exit(1); });
