/* ═══════════════════════════ 2z · Sections: how the whole app is organised ══════════════════════════
   Six places in the menu (Timeline, Traditions, Library, Random, Notebook, Practice) and Setup as a small gear (Random became a place of its own on 19 November 2026; it was a tab of the Library). A place has at most four tabs; a tab that holds several views has a second row of small chips;
   and the pages that are kept but not first choices sit under that place's “More” (a tab marked `more`): Bibles side by side, the text catalogue and the Glossary under Library, the sound overview under
   Practice, the old Start page under Timeline. A tab marked `hidden` is in no menu at all (Worship together, from 18 November 2026, at the maker's request): its pages keep their addresses, the `/` palette
   finds them, and a line on Practice → Ways to worship links to them. Every page the app has sits under exactly one tab (tests/sections.test.js checks that nothing is missing and nothing is twice), so a
   person always knows where they are and what is next to it; the `/` palette finds every one of them by what a person would type.
   One name for one thing (UX-12, 18 November 2026): Highlights and notes (never “My marks”), Journey and “the Journey” (never “the Path”; each stop is a station), Pictures, Random, Jewish mysticism (the page
   says it was once called Hidden currents), Glossary (“word help” is only the pop-up card), Passage sets (the saved sets of passages; the stored data and the pack file are still called threads).
   A "key" names one page: 'path/library', 'atlas' (the map), 'atlas/traditions', 'gather/services', 'gateway', 'meditate', 'setup', 'start', 'traditions/tree'. The addresses themselves
   (#/path/library, #/atlas/calendars, #/meditate, #/start …) did not change when the app was reorganised (16 November 2026, then again 18 November 2026), so every saved link and bookmark still opens.
   Where the places of the 16 November table went: Start → Timeline (Journey; the Start page itself is under Timeline → More), Texts → Library (and the glossary, Bibles side by side, text catalogue and
   Your own texts under its More; My marks and My threads to Notebook), Sound → Practice, Visual → Timeline (map, timelines, calendars) and Library (pictures), Worship → Practice (Worship together
   under its More), Setup → Setup (the gear). The Timeline opens on History, with religion woven in (#/history, added 18 November 2026); the master timeline, the world chart and the traditions’
   timelines are its Religion timeline, under the Timeline’s More.
   This file is data and string builders only: no page, no network. */
const SECTIONS = [
  { id: 'timeline', label: 'Timeline', icon: 'clock', blurb: 'The world’s history with religion woven in, in time and place: the timeline of history, the map, the calendars, and a guided Journey through the whole story.', tabs: [
    { label: 'History', find: 'history timeline world events empires trade ideas plagues wars strands religion woven human history chronology when dates', keys: ['history'] },      /* the landing page of the app (SEC_HOME) */
    { label: 'Map', find: 'atlas map world spread where when cosmology cosmos centre of the world', keys: ['atlas', 'atlas/cosmos'], subs: [['atlas', 'Traditions map', 'atlas map religions sites texts where they spread'], ['atlas/cosmos', 'World maps']] },      /* SA-09 (structure audit, 21 November 2026): the chip was “Atlas map”, a word nobody outside the project knows; “Atlas” stays only as a find word */
    { label: 'Calendars', find: 'calendars and the sky calendar converter day date holy days festivals dates lunar solar moon sun hebrew islamic hindu chinese persian coptic year wheel zodiac horoscope astrology sign signs sidereal tropical precession constellations equinox stars sky', keys: ['sky', 'atlas/calendars', 'sky/moon', 'sky/zodiac', 'sky/sun', 'sky/astrology', 'path/year'], subs: [['sky', 'Any day'], ['atlas/calendars', 'Any year'], ['sky/moon', 'Sun and moon'], ['sky/zodiac', 'The zodiac'], ['sky/sun', 'Where was the sun?'], ['sky/astrology', 'Astrology'], ['path/year', 'Year wheel']] },
    { label: 'Journey', find: 'stations weekly path course learn history guided story week day', keys: ['path/today', 'path/timeline'], subs: [['path/today', 'This week'], ['path/timeline', 'All stations']] },
    { label: 'Religion timeline', more: true, find: 'religion timeline master timeline chronology when dates stations milestones eras world chart by tradition', keys: ['path/chronicle', 'path/world', 'path/traditions'], subs: [['path/chronicle', 'Master timeline'], ['path/world', 'World chart'], ['path/traditions', 'By tradition']] },
    { label: 'Find your way', more: true, find: 'begin new start where to begin help doors home welcome', keys: ['start'] },
  ] },
  { id: 'traditions', label: 'Traditions', icon: 'tree', blurb: 'Study a religion as a whole: where it began, what came before it and what grew from it, its texts, its map, its calendar and how it is practised.', tabs: [
    { label: 'Browse', find: 'religions choose find faith belief monotheism polytheism animism spirituality list denominations sects schools all traditions filter families region continent era century practised ended jewish mysticism kabbalah', keys: ['traditions', 'traditions/belief', 'atlas/traditions', 'path/hidden'], subs: [['traditions', 'By belief'], ['atlas/traditions', 'All traditions'], ['path/hidden', 'Jewish mysticism', 'hidden currents kabbalah zohar esoteric secret gematria amulets sefirot mystical']] },
    { label: 'Family tree', find: 'roots branches lineage ancestry origins descended', keys: ['traditions/tree'] },
    { label: 'Compare', find: 'compare traditions similarities differences common ground themes echoes shared ideas stories that travel', keys: ['path/common', 'steps', 'path/themes', 'path/echoes', 'atlas/stories'], subs: [['path/common', 'Common ground'], ['steps', 'Step by step'], ['path/themes', 'Themes'], ['path/echoes', 'Shared ideas', 'echoes ideas that traditions share and how we know'], ['atlas/stories', 'Stories that travel', 'stories myths tales versions flood creation']] },
    { label: 'Movements', find: 'new religious movements high control groups cult cults sect scientology jonestown waco coercive controlling abusive contested questions to ask any group', keys: ['traditions/movements'] },
    { label: 'Conflicts and peace', more: true, find: 'conflicts and peacemaking war wars battle crusade jihad persecution schism sect sectarian disagreement between sects settlement treaty edict toleration peace agreement reconciliation interfaith ceasefire armistice religious wars wars of religion', keys: ['conflicts'] },      /* D8, 18 November 2026: Traditions already has four tabs, so it sits under More; the History timeline’s conflict strand links to it */
  ] },
  { id: 'library', label: 'Library', icon: 'book', blurb: 'The texts, in English: read them, take a passage at random, search every text, and look at the pictures.', tabs: [
    { label: 'Library', find: 'books scripture read bible quran shelves texts collections', keys: ['path/library', 'path/shelves', 'path/imagined'], subs: [['path/library', 'All texts'], ['path/shelves', 'My shelves'], ['path/imagined', 'Imagined shelf']] },
    { label: 'Search', find: 'find words passages phrase search texts', keys: ['path/search'] },
    { label: 'Pictures', find: 'pictures images religious art gallery photographs plates engravings paintings icons temples masks sacred art symbols geometry mandala', keys: ['path/gallery', 'path/image'], subs: [['path/gallery', 'Pictures', 'art gallery illustrations plates engravings'], ['path/image', 'Sacred art and image']] },
    { label: 'Parallels and patterns', more: true, find: 'compare passages parallel passages side by side motifs recurring stories images find similar wander', keys: ['path/parallels', 'path/motifs', 'path/similar', 'path/wander'], subs: [['path/parallels', 'Parallel passages'], ['path/motifs', 'Motifs'], ['path/similar', 'Find similar'], ['path/wander', 'Wander']] },      /* SA-10: was “Compare passages”, a second “Compare” beside Traditions → Compare; the pages and their addresses did not change, and the old name stays as a find word */
    { label: 'Bibles side by side', more: true, find: 'bible versions translations verse by verse compare', keys: ['path/bibles'] },
    { label: 'Text catalogue', more: true, find: 'records catalogue list of texts every known text', keys: ['atlas/texts'] },
    { label: 'Glossary', more: true, find: 'glossary words and glossary terms meanings define dictionary word help', keys: ['path/glossary'] },
    { label: 'Your own texts', more: true, find: 'add own texts files paste import my books pdf', keys: ['path/own'] },
  ] },
  { id: 'random', label: 'Random', icon: 'dice', compact: true, blurb: 'One passage from any text, with its exact reference, at the press of a key. Aim it at a religion, a period or a book, or just keep pressing and see where you land.', tabs: [
    { label: 'Draw', find: 'random surprise passage verse dice draw any text anywhere another', keys: ['path/passage'] },      /* Random is a place of its own (19 November 2026, the maker: its importance deserves it). One tab now: a strip of one tab is not drawn (secNavHTML), and the later stages of RANDOM_SUITE.md add a tab only when it has content */
  ] },
  { id: 'notebook', label: 'Notebook', icon: 'journal', blurb: 'What you have marked and written: your notebook, the highlights and notes from your reading, and sets of passages side by side.', tabs: [
    { label: 'My notebook', page: 'notebook', find: 'notebook pages notes write clip clips tags tag markdown links back journal prompts', keys: ['notebook'] },      /* shown once a module is registered as Pages.notebook; until then #/notebook opens Highlights and notes (SEC_STANDIN) */
    { label: 'Highlights and notes', find: 'bookmarks notes highlights marks my marks progress reading history', keys: ['path/marks'] },
    { label: 'Passage sets', find: 'passage sets threads thread sets of passages compare side by side saved', keys: ['path/threads'] },      /* the address and the stored data keep the old word: #/path/threads, THREADS, the pack file */
    { label: 'Journey notes', more: true, find: 'journey notes rule of life journal station notes written', keys: ['path/notebook'] },
  ] },
  { id: 'practice', label: 'Practice', icon: 'lotus', blurb: 'How people worship: practices and rites to try, guided sits, and the sound and rhythm of the world’s traditions.', tabs: [
    { label: 'Ways to worship', find: 'prayer pray practise fasting how to worship ritual rites customs intentions plants psychedelic entheogen incense', keys: ['path/practices', 'path/rites', 'path/intentions', 'path/plants'], subs: [['path/practices', 'Practices'], ['path/rites', 'Rites and customs'], ['path/intentions', 'Intentions'], ['path/plants', 'Sacred plants']] },
    { label: 'Meditate', find: 'meditation guided sit breathe mindfulness relax stillness voice firelight', keys: ['meditate'] },
    { label: 'Sound', find: 'sound rhythm chant music drum hymn song binaural beats isochronic brainwave headphones frequencies studio presets learn', keys: ['path/sound', 'presets', 'studio', 'learn', 'headphones'], subs: [['path/sound', 'Sound and rhythm'], ['presets', 'Presets'], ['studio', 'Studio'], ['learn', 'Learn'], ['headphones', 'Headphone check']] },
    { label: 'Worship together', hidden: true, find: 'gather church service congregation circle study group worship together how groups meet and keep time calendar share', keys: ['gather', 'gather/services', 'gather/circles', 'gather/calendar', 'gather/share'], subs: [['gather', 'Home'], ['gather/services', 'Services'], ['gather/circles', 'Circles'], ['gather/calendar', 'Calendar'], ['gather/share', 'Share and keys']] },
    { label: 'Sound overview', more: true, find: 'sound stillness gateway overview ten minute start', keys: ['gateway'] },
    { label: 'Experiments', more: true, find: 'blinded trial test tones experiment lab', keys: ['experiments'], lab: true },
    { label: 'Journal', more: true, find: 'daily check in diary mood lab', keys: ['journal'], lab: true },
  ] },
  { id: 'setup', label: 'Setup', icon: 'gear', gear: true, blurb: 'Your data, your preferences, and what the Lamplighter Project promises.', tabs: [
    { label: 'Setup', find: 'settings preferences backup export import delete data theme volume level reduce motion feedback reset your data clear storage', keys: ['setup', 'setup/data'], subs: [['setup', 'Preferences'], ['setup/data', 'Your data', 'your data reset delete clear remove forget bookmarks highlights notes notebooks pdfs own texts offline copies storage size export backup import']] },      /* Setup → Your data (#/setup/data, 19 November 2026): each kind of data with a count and a button of its own */
    { label: 'Our promises', find: 'privacy freedom promises', keys: ['path/freedom'] },
    { label: 'Take it with you', find: 'offline install download copy keep', keys: ['path/carry'] },
    { label: 'Links and sources', find: 'reference websites further reading sources credits data notes', keys: ['path/links', 'atlas/about'], subs: [['path/links', 'Links'], ['atlas/about', 'About the map data', 'atlas database sources conventions how to read the map']] },
    { label: 'Methods and standards', more: true, find: 'methods and standards how to read labels documented reported disputed source grades date confidence unchecked first reading second reading corrections log cite citation chicago bibtex release notes what changed privacy typed machine-read scans translations', keys: ['methods'] },      /* BACKLOG 5a, 18 November 2026: under Setup’s More (a fifth tab would break the four-tab rule); linked from the footer, Setup and the / search */
  ] },
];
const SEC_BY_ID = Object.fromEntries(SECTIONS.map((s) => [s.id, s]));
const secAllKeys = () => SECTIONS.flatMap((s) => s.tabs.flatMap((t) => t.keys));
/* the address of a page: 'path/library' → #/path/library, 'atlas' → #/atlas, 'gateway' → #/gateway */
const secHref = (key) => '#/' + key;
SECTIONS.forEach((s) => { s.tabs.forEach((t) => { t.href = t.href || secHref(t.keys[0]); }); s.href = s.href || s.tabs[0].href; });      /* a tab opens its first page, and the menu opens the first tab of a place */
/* the page that opens with an empty address or one nobody knows: History, with religion woven in, the first tab of the Timeline (18 November 2026; it was the master timeline, which is still under Timeline →
   More as the Religion timeline and opens instead if the module of SEC_HOME is not there). Another page can take its place by changing this key and the first tab above. */
const SEC_HOME = 'history';
const SEC_HOME_FALLBACK = 'path/chronicle';
/* a place whose own page is not built yet opens the page that stands in for it, under the same address (the Notebook place opens My marks until its notebook page exists: a module that registers
   Pages.notebook takes over with no change here) */
const SEC_STANDIN = { notebook: ['path', 'marks'] };
const secParts = (key) => (key === 'atlas' ? ['atlas'] : String(key).split('/'));
/* what the router should draw for an address: the address itself when the app has a module for it, else its stand-in, else the page the app opens on (the master timeline if that page has no module).
   has(name) says whether a module is registered under a name */
function secRoute(parts, has) {
  const p = Array.isArray(parts) ? parts.filter((x) => typeof x === 'string' && x) : []; const a = p[0];
  if (a && has(a)) return p;
  if (a && Object.prototype.hasOwnProperty.call(SEC_STANDIN, a)) return SEC_STANDIN[a].concat(p.slice(1));
  const home = secParts(SEC_HOME); return has(home[0]) ? home : secParts(SEC_HOME_FALLBACK);
}

/* an address that is only a stem, with nothing to show of its own, opens the page it belongs to instead (AA-27 of the alpha audit: “#/traditions/belief” with no belief named said “There is no such belief”; it now opens
   Browse by belief, #/traditions). Returns the address to go to, or '' when the address is fine. A belief that does not exist (#/traditions/belief/nothing) still says so. */
const SEC_REDIRECT = { 'traditions/belief': 'traditions' };
function secRedirect(parts) {
  const k = (Array.isArray(parts) ? parts : []).filter((x) => typeof x === 'string' && x).join('/');
  return Object.prototype.hasOwnProperty.call(SEC_REDIRECT, k) ? '#/' + SEC_REDIRECT[k] : '';
}

/* which tab (and which chip under it) a page is, or null for a key nobody knows */
function secLocate(key) {
  for (const sec of SECTIONS) for (const tab of sec.tabs) if (tab.keys.includes(key)) return { sec, tab, sub: (tab.subs || []).find((x) => x[0] === key) || null, key };
  return null;
}
/* the page key for what the router parsed from the address (parts[0] is the part of the app, the rest says which view). Detail addresses belong to the tab they came from:
   a station to the stations, a text being read to the Library, a random passage from one book to Random, one tradition to All traditions, one service to Services. An unknown address opens the Timeline. */
function secKey(parts) {
  const p = parts || []; const a = p[0] || ''; const v = p[1];
  const known = (k) => secAllKeys().includes(k);
  if (!a) return SEC_HOME;
  if (a === 'path') { const m = { station: 'timeline', read: 'library', 'read-random': 'passage', tradition: 'traditions', thread: 'threads', motif: 'motifs' }; const k = 'path/' + (m[v] || v || 'today'); return known(k) ? k : 'path/today'; }
  if (a === 'atlas') { const m = { tradition: 'traditions', calendar: 'calendars' }; const k = v ? 'atlas/' + (m[v] || v) : 'atlas'; return known(k) ? k : 'atlas'; }
  if (a === 'gather') { const m = { service: 'services', new: 'services', run: 'services', circle: 'circles', open: 'share', home: '' }; const w = v === undefined ? '' : (v in m ? m[v] : v); const k = w ? 'gather/' + w : 'gather'; return known(k) ? k : 'gather'; }
  if (a === 'traditions') { const k = v ? 'traditions/' + v : 'traditions'; return known(k) ? k : 'traditions'; }
  if (a === 'sky') { const k = v ? 'sky/' + v : 'sky'; return known(k) ? k : 'sky'; }
  if (a === 'setup') { const k = v ? 'setup/' + v : 'setup'; return known(k) ? k : 'setup'; }
  return known(a) ? a : SEC_HOME;
}
const SEC_ESC = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
/* is there a module for this page yet? (a tab marked `page: 'notebook'` waits for Pages.notebook; with no registry at all, as when this file is read on its own, everything counts as there) */
const secHas = (name) => { try { return typeof Pages === 'undefined' || Object.prototype.hasOwnProperty.call(Pages, name); } catch (e) { return true; } };
/* the tabs a person sees in the strip, and the ones kept under “More” (the lab tools only when they are switched on) */
const secShown = (sec, lab) => sec.tabs.filter((t) => !t.more && !t.hidden && (!t.lab || lab) && (!t.page || secHas(t.page)));
const secMore = (sec, lab) => sec.tabs.filter((t) => t.more && !t.hidden && (!t.lab || lab) && (!t.page || secHas(t.page)));      /* a `hidden` tab is in neither: no menu lists it, but its addresses and the `/` palette still reach it */
/* the row of tabs with “More” at its end, and under it the chips of the tab that holds several views. o.lab: show the tabs that belong to the lab tools.
   On a page that sits under More, the More button carries that page's name and is marked as the current one, so it is always clear where you are. */
function secNavHTML(loc, o) {
  if (!loc) return ''; o = o || {};
  const cls = o.cls ? ' ' + o.cls : ''; const name = SEC_ESC(loc.sec.label);
  const link = (t) => `<a href="${t.href}"${t === loc.tab ? ' aria-current="page"' : ''}>${SEC_ESC(t.label)}</a>`;
  const strip = `<nav class="ptabs sectabs${cls}" aria-label="${name} sections">${secShown(loc.sec, o.lab).map(link).join('')}</nav>`;
  const more = secMore(loc.sec, o.lab); const here = more.includes(loc.tab);
  const moreHTML = more.length ? `<details class="smore${here ? ' on' : ''}"><summary>${here ? SEC_ESC(loc.tab.label) : 'More'}</summary><div class="smore-menu" aria-label="More in ${name}">${more.map(link).join('')}</div></details>` : '';
  const subs = loc.tab.subs && loc.tab.subs.length > 1 ? `<nav class="psubs${cls}" aria-label="${SEC_ESC(loc.tab.label)} views">${loc.tab.subs.map(([k, n]) => `<a href="${secHref(k)}"${k === loc.key ? ' aria-current="page"' : ''}>${SEC_ESC(n)}</a>`).join('')}</nav>` : '';
  const alone = secShown(loc.sec, o.lab).length < 2 && !more.length;      /* a place with one tab and nothing under More has nothing to choose between: no strip is drawn (Random, until a later stage gives it a second tab) */
  return `${alone ? '' : `<div class="secbar${cls}">${strip}${moreHTML}</div>`}${subs}`;
}
const SEC_SEARCH = '<form class="hsearch" id="hSearch" role="search"><input class="input" type="search" id="hQ" placeholder="Search every text…" aria-label="Search every text" autocomplete="off"><kbd class="hkbd" title="Press / from anywhere">/</kbd></form>';
/* the title of a page: the name of the place (o.title for a page that is not in a place’s strip; the name of its own tab for a hidden one, which no menu lists), a line about it (shown only on the first page of the place, or when the caller gives one), and optionally the search box */
function secHeadHTML(loc, o) {
  if (!loc) return ''; o = o || {};
  const compact = o.compact !== undefined ? o.compact : loc.key !== loc.sec.tabs[0].keys[0] || !!loc.sec.compact;      /* a place marked `compact` (Random) always has the short head, so its page starts under one line */
  return `<div class="page-head fade-in${compact ? ' compact' : ''}${o.cls ? ' ' + o.cls : ''}"><div><h1>${SEC_ESC(o.title != null ? o.title : loc.tab.hidden ? loc.tab.label : loc.sec.label)}</h1><p>${o.blurb != null ? o.blurb : SEC_ESC(loc.sec.blurb)}</p></div>${o.search ? SEC_SEARCH : ''}</div>`;
}
if (typeof module !== 'undefined' && module.exports) module.exports = { SECTIONS, SEC_BY_ID, SEC_HOME, SEC_HOME_FALLBACK, SEC_STANDIN, SEC_REDIRECT, secRedirect, secAllKeys, secHref, secParts, secRoute, secLocate, secKey, secHas, secShown, secMore, secNavHTML, secHeadHTML, SEC_SEARCH };
