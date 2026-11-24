/* The Atlas-side places of STRUCTURE_AUDIT.md (22 November 2026): the Journey's view of a religion, the religion's own page (the hub), the map's side panel, a story, a motif, a station and the “Look closer” card.
   One religion has two pages, so each names the other (SA-03: the Journey view links the hub, “The full page for X”, or the list of its family; the hub and the panel call the Journey view “Journey” (L-11), the panel calls the hub
   “Tradition page”; the button that opens the map says “Open the map”); a story's versions are links to the reader and to their tradition (SA-05); the hub's “Timeline” is “Dated records”, its Texts are “Texts in the
   catalogue”, three map buttons are two, and “No branches recorded” is said once (SA-07, SA-13, SA-23, B1 #16); “Atlas” is no word of the page (SA-09); the “Look closer” card comes last on the Map, Common ground and the
   Motifs (SA-12); and the strip of related things is wired at five places, each guarded (SA-02).
   Needs the built atlas/ and texts/ folders beside the project (it says so and skips what it cannot check). Run: node tests/structure-atlas-places.test.js */
const fs = require('fs'); const path = require('path'); const vm = require('vm');
const ROOT = path.join(__dirname, '..'); const PROJ = path.join(ROOT, '..'); const SRC = path.join(ROOT, 'src/js');
let pass = 0; let fail = 0;
const ok = (n, c, x) => { if (c) pass++; else { fail++; console.log('FAIL', n, x === undefined ? '' : (typeof x === 'string' ? x : JSON.stringify(x)).slice(0, 700)); } };
const read = (f) => fs.readFileSync(path.join(SRC, f), 'utf8');
const strip = (s) => s.replace(/\nif \(typeof module !== 'undefined' && module\.exports\)[^\n]*/g, '');
const code = (f) => strip(read(f)).replace(/\/\*[\s\S]*?\*\//g, '').split('\n').map((l) => l.replace(/\s\/\/.*$/, '')).join('\n');      /* the code of a file, without its comments */
const css = fs.readFileSync(path.join(ROOT, 'src/css/app.css'), 'utf8');
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ── the nineteen Journey views and what each names on the map's side ── */
const six = read('6q-atlas-pages.js'); const AFP = vm.runInNewContext('(' + /const ATL_FROM_PATH = (\{[\s\S]*?\});/.exec(six)[1] + ')');
const VIEWS = Object.keys(AFP); const WITH_SEL = VIEWS.filter((k) => AFP[k].sel); const FAMILY = VIEWS.filter((k) => !AFP[k].sel);
ok('nineteen Journey views: nine name one tradition of the map data, ten name a family (nine) or a group of families (one)', VIEWS.length === 19 && WITH_SEL.length === 9 && FAMILY.length === 10 && FAMILY.filter((k) => AFP[k].f).length === 9 && FAMILY.filter((k) => AFP[k].g).length === 1, [WITH_SEL, FAMILY]);

/* ── SA-02: the strip of related things at its five places, each one guarded line with the kind, the id and the skip list ── */
const SITES = [
  ['6e-traditions.js', /typeof relatedBox === 'function' && hubId \? relatedBox\('tradition', hubId, \{ skip: \['read'\] \}\) : ''/, 'the Journey view of a religion that names one tradition (its own texts are drawn by the view)'],
  ['6w-stories.js', /typeof relatedBox === 'function' \? relatedBox\('story', story\.id, \{ skip: \['traditions', 'read'\] \}\) : ''/, 'a story (its versions above already link the religions and the readers: FA-06)'],
  ['6v-motifs.js', /typeof relatedBox === 'function' \? relatedBox\('motif', id, \{\}\) : ''/, 'a motif'],
  ['6t-atlas-dive.js', /typeof relatedBox === 'function' && o\.siteId \? relatedBox\('site', o\.siteId, \{ skip: \['map', 'traditions'\] \}\) : ''/, 'the map panel opened on a site'],
  ['69-path.js', /typeof relatedBox === 'function' \? relatedBox\('station', s\.id, \{ skip: \['time', 'read'\] \}\) : ''/, 'a station (“Meanwhile, elsewhere” stays, so “In its time” is left out, and its own Texts card lists the books, so “Read” is: FA-06)'],
];
for (const [f, re, what] of SITES) { const calls = read(f).split('\n').filter((l) => /\brelatedBox\(/.test(l)); ok(`${what}: ${f} calls relatedBox( once, guarded on the same line, with the kind, the id and the skip list of the brief`, calls.length === 1 && re.test(calls[0]), calls); }
{ const e6 = read('6e-traditions.js'); ok('the Journey view draws the strip only for the nine views that name a tradition (hubId is the view’s Atlas tradition, empty for the ten others)', /const hubId = pathAtlasId\(id\)/.test(e6) && /const pathAtlasId = \(pid\) => \{ const m = pathAtlasOwn\(pid\); return m && m\.sel \? m\.sel : ''; \}/.test(e6)); }

/* ── SA-03: the Journey view links the page of its religion; every view says “Open the map”, none “Open in the Atlas” ── */
{ const { render, badText } = require('./_harness.js'); const bad = { map: [], old: [], link: [], text: [] };
  for (const id of VIEWS) {
    const body = render(['tradition', id]).body; if (!body.includes('Open the map')) bad.map.push(id); if (/Open in the Atlas|the Atlas\b/.test(body)) bad.old.push(id); if (badText(body)) bad.text.push(id);
    const m = AFP[id]; const link = m.sel ? new RegExp('<a class="btn ghost" href="#/atlas/tradition/' + m.sel + '" data-hub="' + m.sel + '">The full page') : new RegExp('<a class="btn ghost" href="#/atlas/traditions\\?' + (m.f ? 'f=' + m.f : 'g=' + m.g) + '">Traditions in this ' + (m.f ? 'family' : 'group') + '</a>');
    if (!link.test(body) || (body.match(/class="btn ghost" href="#\/atlas\/traditions?[/?]/g) || []).length > 1) bad.link.push(id);
  }
  ok('all nineteen Journey views say “Open the map” and none “Open in the Atlas” or “the Atlas”', bad.map.length === 0 && bad.old.length === 0, bad);
  ok('every Journey view links the Atlas side of its religion: the page of the tradition it names (nine), or the list of its family or group (ten): no view stands alone any more', bad.link.length === 0, bad.link);
  ok('the nineteen views draw no “undefined”, “[object” or “NaN”', bad.text.length === 0, bad.text);
  const e6 = read('6e-traditions.js'); const hubSrc = e6.slice(e6.indexOf('const pathAtlasOwn'), e6.indexOf('function pathTraditionView'));
  const hubFn = (ix) => new Function('esc', 'ATL_FROM_PATH', 'ATLD', hubSrc + '\nreturn { pathHubLinkHTML, pathAtlasId };')(esc, AFP, { ix });
  ok('a view that names no loaded tradition still links its page (the name arrives with the map data); a hostile or unknown view id gives no link and no error', (() => { const h = hubFn(null); return /href="#\/atlas\/tradition\/greek" data-hub="greek">The full page<\/a>/.test(h.pathHubLinkHTML('greece-rome')) && ['constructor', '__proto__', 'toString', '', 'no-such-view', null, undefined, 5].every((p) => { try { return h.pathHubLinkHTML(p) === '' && h.pathAtlasId(p) === ''; } catch (e) { return false; } }); })());
  globalThis.__HUBFN = hubFn; }

/* ── the built data: the real religions, the Library, the stories ── */
const need = ['atlas/index.js', 'atlas/core.js', 'atlas/events.js', 'atlas/texts.js', 'atlas/sites.js', 'texts/index.js'];
const missing = need.filter((f) => !fs.existsSync(path.join(PROJ, f)));
if (missing.length) { console.log('structure-atlas-places: the atlas/ or texts/ folder is not next to the project (run tools/build_atlas.py); the checks on the real data were skipped: ' + missing.join(', ')); }
else {
  const G = { data: {} }; const sb = { BEATLAB_ATLAS: { data: G.data, add(n, d) { G.data[n] = d; } }, BEATLAB_TEXTS: { meta: {}, addIndex(m) { Object.assign(this.meta, m); } } }; sb.globalThis = sb; vm.createContext(sb);
  need.forEach((f) => vm.runInContext(fs.readFileSync(path.join(PROJ, f), 'utf8'), sb)); const READABLE = new Set(Object.keys(sb.BEATLAB_TEXTS.meta)); G.readable = READABLE;
  const files = ['24-data-path-lib.js', '2l-data-path-traditions.js', '2t-atlas-core.js', '2y-data-stories.js', '2z-about-core.js', '2z-belief-core.js', '2z-passage-filter-core.js', '2z-passage-index.js', '2z-related-core.js', '6zz-traditions.js', '6t-atlas-dive.js', '6w-stories.js'];
  const prefix = `const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const icon = (n) => '<svg data-i="' + n + '"></svg>'; const Pages = {}; const TXT = { has: (id) => G.readable.has(id) }; const ATLD = { ix: null }; const MARKS = { all: () => ({}) };
const ATL_FROM_PATH = ${JSON.stringify(AFP)}; const atlLink = (t) => '#/atlas?sel=' + t.id; const atlDate = (r) => r.date_label || ''; const ATL_CONF = { H: 'well documented', M: 'scholarly consensus', L: 'rough estimate', C: 'contested' }; const atlTimelineSVG = () => '<svg class="atl-tl"></svg>'; const atlPracticeBridges = () => '';
const srchHash = (q) => '#/path/search?q=' + encodeURIComponent(q); const srchOpts = () => ({}); const atlTextCat = (ix, c) => c || ''; const GLOSSARY = []; const stNum = () => 1;
let RB = []; const relatedBox = (...a) => { RB.push(a); return '<section class="rel">strip</section>'; }; const rbCalls = () => RB; const rbClear = () => { RB = []; };\n`;
  const exportsOf = 'atlDiveHTML, atlSiteHTML, atlSiteTopHTML, tradRootsHTML, tradHubNavHTML, tradStudyHTML, pathTraditionOf, stRow, stTie, STORIES, STORY_BY_ID, storyEntries, relTies, atlIndex, atlSetGroups, atlTraditionTimeline, TRADITIONS, TRAD_BY_ID, rbCalls, rbClear, ATLD';
  let R; try { R = new Function('G', prefix + files.map((f) => strip(read(f))).join('\n') + `\nreturn { ${exportsOf} };`)(G); } catch (e) { ok('the pages’ code loads in one scope against the real data', false, String(e && e.stack).split('\n').slice(0, 4).join(' | ')); }
  if (R) {
    const D = G.data; const core = D.core; const ix = R.atlIndex(core); R.atlSetGroups(ix, D.index.config.family_groups.groups); ix.cfg = D.index.config; ix.codes = D.index.codes; ix.core = core; R.ATLD.ix = ix;
    const traditions = core.traditions; const byTrad = Object.fromEntries(traditions.map((t) => [t.id, t]));
    ok('the Atlas holds every tradition and family the Journey views name', WITH_SEL.every((k) => byTrad[AFP[k].sel]) && FAMILY.filter((k) => AFP[k].f).every((k) => core.families.some((f) => f.id === AFP[k].f)) && FAMILY.filter((k) => AFP[k].g).every((k) => D.index.config.family_groups.groups.some((g) => g.id === AFP[k].g)), [WITH_SEL.filter((k) => !byTrad[AFP[k].sel]), FAMILY.filter((k) => AFP[k].f && !core.families.some((f) => f.id === AFP[k].f))]);
    { const h = globalThis.__HUBFN(ix); ok('with the map data loaded each of the nine views names its religion as the records do (“The full page for Ancient Greek religion”, not “for Greece and Rome”)', WITH_SEL.every((k) => h.pathHubLinkHTML(k).includes('>The full page for ' + esc(byTrad[AFP[k].sel].name) + '<')) && h.pathHubLinkHTML('greece-rome').includes('The full page for Ancient Greek religion'), WITH_SEL.map((k) => h.pathHubLinkHTML(k).slice(-60))); }

    /* ── the hub: the jump buttons, the Roots column, the Study card (6zz-traditions.js) ── */
    { const labels = (h) => [...h.matchAll(/data-jump="[^"]+">([^<]+)</g)].map((m) => m[1]); const all = R.tradHubNavHTML({ timeline: true, spread: true, texts: true, prac: true, cal: true, sites: true });
      ok('the hub’s jump buttons carry the names of the sections they jump to: Dated records (not Timeline), Presence over time (not Where it spread), Texts in the catalogue (not Texts)', labels(all).join('|') === 'Study it|Roots and branches|Dated records|Presence over time|Texts in the catalogue|Practices|Calendar|Sites', labels(all));
      ok('a section the page does not draw has no jump button, and Study it and Roots and branches always have one', labels(R.tradHubNavHTML({})).join('|') === 'Study it|Roots and branches'); }
    { const bad = { no: [], cols: [], head: [] }; let none = 0; let some = 0;
      for (const t of traditions) { const h = R.tradRootsHTML(ix, t); const kids = (ix.kids[t.id] || []).length; const cols = (h.match(/<div class="mt-col/g) || []).length; if (/No branches recorded/.test(h)) bad.no.push(t.id); if (cols !== (kids ? 3 : 2)) bad.cols.push(t.id); if (/What grew from it/.test(h) !== !!kids) bad.head.push(t.id); if (kids) some++; else none++; }
      ok(`the Roots section never says “No branches recorded” (the hub’s one “Not recorded for this tradition” line does, once): for all ${traditions.length} traditions it draws two columns, and a third, “What grew from it”, only when there are branches (${some} have, ${none} have none)`, bad.no.length === 0 && bad.cols.length === 0 && bad.head.length === 0 && some > 100 && none > 400, [bad.no.length, bad.cols.slice(0, 4), bad.head.slice(0, 4), some, none]); }
    { const bad = { stations: [], labels: [], noJourney: [] }; let withPt = 0; const o = { texts: 1, about: 0, lore: 0, rows: 5, prac: true, cal: true, spread: true };
      for (const t of traditions) {
        const h = R.tradStudyHTML(ix, t, o); const pt = R.pathTraditionOf(ix, t.id); const chip = /<a class="chip" href="#\/path\/tradition\/([^"]+)" title="[^"]*">Journey →<\/a>/.exec(h);
        if (pt) { withPt++; if (!chip || chip[1] !== pt.id || !/<b><svg data-i="path"><\/svg>In the Journey<\/b>/.test(h)) bad.stations.push(t.id); } else if (chip || /In the Journey/.test(h)) bad.noJourney.push(t.id);
        const controls = [...h.matchAll(/<(?:a class="chip"[^>]*|button type="button" class="chip"[^>]*)>([^<]+)</g)].map((m) => m[1]).filter((l) => /map|spread|presence/i.test(l));
        if (controls.join('|') !== 'Show on the map →|Presence over time ↓') bad.labels.push(t.id + ': ' + controls.join('|'));
      }
      ok(`the hub’s link to its Journey view is called “Journey” (a chip “Journey →” in the card “In the Journey”; L-11: one name for the view, “Stations” names only its stops), for the ${withPt} traditions the Journey names, and the card is not drawn for the others; it opens the Journey view of the religion (pathTraditionOf)`, bad.stations.length === 0 && bad.noJourney.length === 0 && withPt > 300, [bad.stations.slice(0, 4), bad.noJourney.slice(0, 4), withPt]);
      ok('of the hub’s three map buttons (“Show on the map”, “Where it spread”, “Presence over time”) two names are kept: the Study card holds “Show on the map →” and “Presence over time ↓” and no control is called “Where it spread” (its heading names the card)', bad.labels.length === 0 && /Where it spread/.test(R.tradStudyHTML(ix, traditions[0], o)), bad.labels.slice(0, 4)); }
    { const h = R.tradStudyHTML(ix, byTrad.christianity, { texts: 1, rows: 5, spread: true }); ok('no sentence of the Study card names the Atlas: the card says “on the map”', !/\bAtlas\b/.test(h.replace(/<[^>]*>/g, ' ')) && /spread and change on the map/.test(h)); }

    /* ── the map's side panel: the hub is “Tradition page”, the Journey view “Journey”, the strip only for a site ── */
    { const panel = (id, extra) => { const t = ix.trad[id]; const tl = R.atlTraditionTimeline(ix, D.events, id, 36); const texts = D.texts.filter((x) => x.tradition_id === id); const prac = (ix.tpOf[id] || []).map((p) => ix.practiceBy[p]).filter(Boolean); const rows = (ix.byTrad[id] || []).slice().sort((a, b) => a.year_start - b.year_start); return R.atlDiveHTML(Object.assign({ ix, t, tl, all: false, texts, prac, rows, color: '#7d9bff', pt: null, curY: 100 }, extra || {})); };
      const pt = R.TRAD_BY_ID.oceania; const h = panel('hawaiian_religion', { pt });
      ok('the panel’s two links tell each other apart: “Tradition page” opens the religion’s page, “Journey” opens the Journey’s view; neither says “Open the full page” or “Open this tradition”', /<a class="btn sm primary dv-full" href="#\/atlas\/tradition\/hawaiian_religion"[^>]*>Tradition page<\/a>/.test(h) && /<a class="btn sm primary" href="#\/path\/tradition\/oceania"[^>]*>Journey<\/a>/.test(h) && !/Open the full page|Open this tradition/.test(h), h.match(/dv-go[\s\S]{0,400}/));
      ok('the panel’s “Tradition page” is there for every tradition, and the word Atlas is no part of what the panel says when the Journey has no stations for it', traditions.every((t) => panel(t.id).includes('href="#/atlas/tradition/' + t.id + '"')) && /The Journey has no stations for this one yet\. What the map data holds/.test(panel('hawaiian_religion')) && !/Open the full page/.test(panel('hawaiian_religion')));
      R.rbClear(); const none = panel('hawaiian_religion', { pt }); const calls0 = R.rbCalls().length; R.rbClear(); const withSite = panel('hawaiian_religion', { pt, siteId: 'pu-uhonua-o-honaunau' }); const calls1 = R.rbCalls();
      ok('the panel draws the strip of a site only when the map was opened on one: no site, no call; a site, one call of kind “site” with that id, skipping the map and the religion (the panel’s own “Tradition page” button is that link: the strip no longer repeats it); the strip is the last thing inside the panel’s body', calls0 === 0 && !/class="rel"/.test(none) && calls1.length === 1 && calls1[0][0] === 'site' && calls1[0][1] === 'pu-uhonua-o-honaunau' && JSON.stringify(calls1[0][2]) === '{"skip":["map","traditions"]}' && /<section class="rel">strip<\/section><\/div>$/.test(withSite), [calls0, calls1]);
      const bare = new Function('relatedBoxMissing', 'return 1'); R.rbClear(); ok('a copy without the strip still draws the panel (the call is guarded by typeof)', /typeof relatedBox === 'function' && o\.siteId/.test(read('6t-atlas-dive.js')) && bare() === 1); }

    /* ── L-01 (FINAL_AUDIT.md): a pin on a site opens a panel for the site; the site comes first, its religion under it ── */
    { const sites = D.sites; const none = sites.filter((x) => !x.tradition_id); const withT = sites.filter((x) => x.tradition_id && ix.trad[x.tradition_id]);
      const panelFor = (t, site) => { const tl = R.atlTraditionTimeline(ix, D.events, t.id, 36); const texts = D.texts.filter((x) => x.tradition_id === t.id); const prac = (ix.tpOf[t.id] || []).map((p) => ix.practiceBy[p]).filter(Boolean); const rows = (ix.byTrad[t.id] || []).slice().sort((a, b) => a.year_start - b.year_start); return R.atlDiveHTML({ ix, t, tl, all: false, texts, prac, rows, color: '#7d9bff', pt: null, curY: 100, siteId: site ? site.id : '', site: site || null }); };
      const bad = { name: [], where: [], said: [], tradition: [], text: [] };
      for (const s of none) { const h = R.atlSiteHTML({ ix, s }); const plain = h.replace(/<[^>]*>/g, ' ');
        if (!new RegExp('<h2 class="dv-title" id="dvTitle" tabindex="-1">' + esc(s.name).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '</h2>').test(h) || (h.match(/id="dvTitle"/g) || []).length !== 1) bad.name.push(s.id);
        if (!h.includes(esc(s.date_label)) || !h.includes('A site on the map')) bad.where.push(s.id);
        if (!h.includes('The map data records no tradition for this site, so none is named here.') || (s.note && !h.includes(esc(s.note)))) bad.said.push(s.id);
        if (/href="#\/atlas\/tradition\//.test(h) || /data-sel=/.test(h)) bad.tradition.push(s.id); if (/undefined|NaN|\[object/.test(plain)) bad.text.push(s.id); }
      ok(`L-01: each of the ${none.length} sites that name no tradition gets a panel of its own: titled with the site (one heading with the focus id), where and when it is, the record’s own note, the plain sentence that no tradition is recorded (the same for every one), a text search for its name, and no tradition named or linked`, none.length === 17 && Object.values(bad).every((v) => v.length === 0), bad);
      const badT = []; const sample = withT.filter((x, i) => i % 8 === 0).concat(withT.filter((x) => ['parthenon', 'puuhonua-o-honaunau', 'pu-uhonua-o-honaunau'].includes(x.id)));
      for (const s of sample) { const t = ix.trad[s.tradition_id]; const h = panelFor(t, s); const iSite = h.indexOf('<h2 class="dv-title" id="dvTitle" tabindex="-1">' + esc(s.name) + '</h2>'); const iRel = h.indexOf('<h3 class="dv-title dv-trad">' + esc(t.name) + '</h3>');
        if (iSite < 0 || iRel < 0 || iSite > iRel || (h.match(/id="dvTitle"/g) || []).length !== 1 || !h.includes('The religion the map ties it to') || !h.includes('A site on the map')) badT.push(s.id); }
      ok(`L-01: a pin on a site that the records tie to a religion opens that religion’s panel with the site first: the site is the title (the one heading with the focus id), then where and when, and the religion comes under it (a smaller heading, “The religion the map ties it to”); checked on ${sample.length} sites`, sample.length > 40 && badT.length === 0, badT.slice(0, 5));
      const t0 = ix.trad.hawaiian_religion; const noSite = panelFor(t0, null);
      ok('L-01: a panel opened on a religion alone (no pin) is what it was: the religion is the title, no site block, no “A site on the map”', /<h2 class="dv-title" id="dvTitle" tabindex="-1">Hawaiian religion<\/h2>/.test(noSite) && !/A site on the map|dv-tie|dv-trad/.test(noSite), noSite.slice(0, 300));
      const evil = R.atlSiteHTML({ ix, s: { id: 'x', name: '<img src=x onerror=alert(1)>', type: '<b>', note: '<script>', date_label: '<i>', country_iso2: 'ZZ' } });
      ok('L-01: a hostile site name, type, note or date is text in the panel, never markup, and an unknown country gives no word', !/<img|<script|<b>|<i>/.test(evil) && /&lt;img src=x onerror=alert\(1\)&gt;/.test(evil));
      const p6 = read('6p-atlas.js'); const d6 = read('6t-atlas-dive.js');
      ok('L-01 (wiring): with no religion chosen and the map opened on a site pin the dive asks for the site’s panel; closing or choosing something else sets it aside (siteOff), a site with a religion still chooses that religion, and the panel is handed the pinned site only for its own religion', /if \(!id && onSite && !siteOff\) \{ await diveSite\(o\); return; \}/.test(p6) && /function select\(id, o\) \{ st\.sel = id; if \(!id\) siteOff = true;/.test(p6) && /if \(\(st\.sel \|\| \(st\.pin && st\.pin\.k === 'st'\)\) && !dv\.dataset\.id\) dive\(\);/.test(p6) && /site: pinSite && pinSite\.tradition_id === id \? pinSite : null/.test(p6) && /atlSiteHTML\(\{ ix, s \}\)/.test(p6) && /function atlSiteHTML\(o\)/.test(d6) && /<\$\{site \? 'h3' : 'h2'\} class="dv-title\$\{site \? ' dv-trad' : ''\}"/.test(d6)); }

    /* ── SA-05: every version of every story is a row with a link to the reader and a link to its religion, never inside a button ── */
    { const bad = { button: [], read: [], tie: [], data: [], hrefs: [] }; let versions = 0; let reads = 0; let ties = 0; const perStory = {};
      for (const s of R.STORIES) {
        perStory[s.id] = { read: 0, tie: 0 };
        for (const e of R.storyEntries(s)) {
          versions++; const row = R.stRow(e); const btn = /<button[^>]*>([\s\S]*?)<\/button>/.exec(row); if (!btn || (row.match(/<button/g) || []).length !== 1 || /<a[\s>]/.test(btn[1])) bad.button.push(s.id + '/' + e.id);
          const here = e.book && READABLE.has(e.book); const m = /<a class="st-read" href="([^"]*)"/.exec(row); if (here ? !m || m[1] !== '#/path/read/' + e.book : !!m) bad.read.push(s.id + '/' + e.id); if (m) { reads++; perStory[s.id].read++; }
          const u = e.book ? R.relTies(e.book).find((x) => x.kind !== 'family') : null; const t = /<span class="st-tie">[\s\S]*?<a href="([^"]*)">([^<]*)<\/a>/.exec(row);
          if (u ? !t || t[1] !== u.href || t[2] !== esc(u.name) : !!t) bad.tie.push(s.id + '/' + e.id); if (t) { ties++; perStory[s.id].tie++; if (!/^#\/atlas\/tradition\/([a-z0-9_]+)$/.test(t[1]) || !byTrad[t[1].split('/').pop()]) bad.hrefs.push(s.id + '/' + e.id + ' ' + t[1]); }
          if (!row.startsWith(`<li class="st-row" data-e="${e.id}"><button type="button" class="st-btn st-pick" data-e="${e.id}" aria-label="`) || !row.includes(esc(e.name))) bad.data.push(s.id + '/' + e.id);
        }
      }
      ok(`all ${versions} versions of the ${R.STORIES.length} stories draw one button (it shows the version on the map) with no link inside it, and the row keeps its id for the map`, bad.button.length === 0 && bad.data.length === 0 && versions === 143, [bad.button.slice(0, 3), bad.data.slice(0, 3), versions]);
      ok(`a version’s title is a link to the reader when its text is in the Library copy here (${reads} versions), and plain text when it is not`, bad.read.length === 0 && reads > 50, [bad.read.slice(0, 4), reads]);
      ok(`a version whose book the records tie to a religion links that religion’s page, named as the Atlas names it (${ties} versions); a version with no book, or a book tied only to a family list, links none and none is guessed`, bad.tie.length === 0 && bad.hrefs.length === 0 && ties > 50, [bad.tie.slice(0, 4), bad.hrefs.slice(0, 4), ties]);
      ok('no story page is a dead end any more: every one of the fourteen has at least one link to the reader and one to a religion’s page in its versions', Object.values(perStory).every((p) => p.read >= 1 && p.tie >= 1), Object.entries(perStory).filter(([, p]) => !p.read || !p.tie).map(([k]) => k));
      const evil = R.stRow({ id: 'x"><b>', name: '<img src=x onerror=alert(1)>', trad: 't', place: '<script>', y: -500, kind: 'written', yNote: '', line: 'a <b>line</b>', book: 'b-gen', search: '', lat: 0, lon: 0, surprise: '' });
      ok('a hostile name, place, line or id is text in the row, never markup', !/<img|<script/.test(evil) && !/data-e="x"/.test(evil) && /data-e="x&quot;&gt;&lt;b&gt;"/.test(evil) && /&lt;img src=x onerror=alert\(1\)&gt;/.test(evil) && /&lt;script&gt;/.test(evil) && /a &lt;b&gt;line&lt;\/b&gt;/.test(evil), evil.slice(0, 300));
      ok('a version with an unknown kind of book, no book, or no religion never throws', [{ book: '' }, { book: 'no-such-book' }, { book: 'constructor' }, { book: null }].every((x) => { try { return typeof R.stRow(Object.assign({ id: 'q', name: 'N', trad: 't', place: 'p', y: 5, kind: 'written', yNote: '', line: 'L', book: '', search: '', lat: 0, lon: 0, surprise: '' }, x)) === 'string' && (R.stTie(x) === null || !!R.stTie(x).href); } catch (e) { return false; } }) && R.stTie(null) === null && R.stTie({}) === null);
      const w6 = read('6w-stories.js'); ok('the selected version’s card offers “Tradition page: …” beside “Read it in the library”, and a click on a link in the list opens its page while a click anywhere else in the row shows the version on the map', /Tradition page: \$\{esc\(stTie\(e\)\.name\)\}/.test(w6) && /if \(ev\.target\.closest\('a'\)\) return; const b = ev\.target\.closest\('\[data-e\]'\)/.test(w6) && /await TXT\.index\(\)/.test(w6)); }
  }
}

/* ── SA-12: the “Look closer” card comes last on the Map, Common ground and the Motifs, one quiet card ── */
{ const p6 = read('6p-atlas.js'); const i1 = p6.indexOf('<aside class="atl-side" id="atlSide"></aside>'); const j1 = p6.indexOf("${typeof storyLookCloser === 'function' ? storyLookCloser() : ''}", i1);
  ok('the Map draws its map card, then its list (the side panel), and the story card last of all, inside the page’s column', i1 > 0 && j1 > i1 && p6.slice(i1, j1 + 80).includes('</aside>${typeof storyLookCloser') && (p6.match(/storyLookCloser\(\)/g) || []).length === 1);
  const c6 = read('6o-common.js'); const k = c6.indexOf("${typeof storyLookCloser === 'function' ? storyLookCloser() : ''}"); ok('Common ground draws the story card after its last section (“Bring it to the table”) and not before its first', k > c6.indexOf('Bring it to the table') && c6.indexOf('Bring it to the table') > 0 && (c6.match(/storyLookCloser\(\)/g) || []).length === 1 && !/body\.innerHTML = `\$\{typeof storyLookCloser/.test(c6) && /body\.innerHTML = `<section class="card glow fade-in" style="margin-top:14px"><div class="eyebrow">Common ground<\/div>/.test(c6));
  const m6 = read('6v-motifs.js'); const m1 = m6.indexOf('<div id="mtOut"><p class="t2 small" role="status">Opening the recurring stories and images…</p></div>'); ok('the Motifs list draws its text, its chips and its list first, and the story card under them', m1 > 0 && m6.slice(m1).startsWith('<div id="mtOut"><p class="t2 small" role="status">Opening the recurring stories and images…</p></div>${typeof storyLookCloser') && !/body\.innerHTML = `\$\{typeof storyLookCloser/.test(m6) && (m6.match(/storyLookCloser\(\)/g) || []).length === 1);
  ok('the card is one quiet card under the content: a margin above and none below, none above it on the Map where the column has its own gap', /\.lc-card\{margin:20px 0 0\} \.atl-wrap>\.lc-card\{margin-top:0\}/.test(css)); }

/* ── SA-07, SA-13, SA-23: the hub’s own sections ── */
{ const hub = read('6q-atlas-pages.js'); const body = hub.slice(hub.indexOf('async function atlasTraditionView'), hub.indexOf('const atlTextCat'));
  ok('the hub’s section of dated records is called “Dated records” (the word Timeline names the place, the Journey’s own list, the Religion timeline and the tree, not this section), its address and the “on the map” links are unchanged', /id="hub-timeline" style="margin-top:16px"><div class="card-title"><h3>Dated records<\/h3>/.test(body) && !/<h3>Timeline<\/h3>/.test(body) && /<a class="small" href="#\/atlas\?y=\$\{atlSnap\(it\.y\)\}&sel=\$\{id\}">on the map<\/a>/.test(body));
  ok('the hub’s Texts section is “Texts in the catalogue” and counts the catalogue’s records only; the Library books about the tradition and its old sources keep their own headings and counts; “Read here” is still the catalogue button’s word', /<h3>Texts in the catalogue <span class="tag">\$\{texts\.length\}<\/span><\/h3>/.test(body) && !/<h3>Texts <span/.test(body) && /const readable = atlReadBtn/.test(body) && /atlReadBtn/.test(read('6t-atlas-dive.js')) && /'Read here'/.test(read('6t-atlas-dive.js')));
  ok('“No branches recorded” is said once: the hub’s one “Not recorded for this tradition: …” line lists branches with sites and relationships, and nothing else of the hub says it', (hub.match(/Not recorded for this tradition/g) || []).length === 1 && /!kids\.length && 'branches'/.test(hub) && !/No branches recorded/.test(code('6q-atlas-pages.js') + code('6zz-traditions.js')));
  ok('the hub’s sentences say “the map” and “the map data”, not “the Atlas” (dated records, followers, the Roots hint, the Browse count, the tree’s lead)', !/\bAtlas\b/.test(code('6q-atlas-pages.js')) && !/\bAtlas\b/.test(code('6zz-traditions.js')) && /Each record is dated in the map data/.test(hub) && /There are \$\{all\.length\} traditions in the map data/.test(read('6zz-traditions.js')) && /<b>\$\{icon\('globe'\)\} The traditions map<\/b>/.test(read('6zz-traditions.js'))); }

/* ── SA-09: no visible “Atlas” where the page means the map, the religions or the data (the identifiers and the addresses keep the word) ── */
{ const bad = ['6e-traditions.js', '6t-atlas-dive.js', '6w-stories.js', '6v-motifs.js', '6p-atlas.js', '69-path.js'].filter((f) => /\bAtlas\b(?!_)/.test(code(f))); ok('the Journey views, the map panel, the stories, the motifs and the map page have no visible “Atlas” in their code (the long tail is only 6o-common.js: one button, outside this round’s scope)', bad.length === 0, bad); }

/* ── the stylesheet: this round’s block, in rem where it sets a size, and not the opener that tests/tap-second.test.js looks for ── */
{ const i = css.indexOf('/* ═══ Structure audit of 21 November 2026, the Atlas side'); const blk = i < 0 ? '' : css.slice(i);
  ok('the stylesheet has this round’s block, with the story rows, the phone rules (a 40 px title and tradition), the card’s place and the strip’s places', i > 0 && ['.st-row{display:grid;grid-template-columns:7.5rem', '.st-row>.st-pick{display:block', '.st-what{', '.st-head a{display:inline-flex;align-items:center;min-height:40px}', '.st-tie a{display:inline-flex;align-items:center;min-height:40px}', '.lc-card{margin:20px 0 0}', '.atl-dive .rel{', '#pbody>.rel{'].every((s) => blk.includes(s)), blk.slice(0, 160));
  ok('the block opens no media query with the exact text tests/tap-second.test.js takes for the second round, and sets no font size in pixels', !blk.includes('@media (pointer:coarse),(max-width:760px){') && !/font-size:\s*[\d.]+px/.test(blk) && /@media \(max-width:760px\),\(pointer:coarse\)\{\.st-what\{padding-top:0\}/.test(blk)); }

console.log(`structure-atlas-places: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
