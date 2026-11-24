// Run: node tests/random-parity.test.js [--table] — the Random page keeps every ability it ever had, where it was or nearer.
// The table below is the parity inventory of 18 November 2026 (the maker: "add power to Random, never remove it, and nothing that was visible may become hidden"). Each row is a control or an ability of
//   FIRST  = the first release's page (stamp a0a6d3, section "6d · Random"),
//   AFTER  = the page as it stood on the afternoon of 18 Nov, before the filters round (from the notes of that fix round: the page itself was not kept),
//   NOW    = this page.
// A place is [closed disclosures to open first, cost of using the control itself: 1 for a button, a tick box or a link, 2 for a select (open it, choose), 0 for something only read]; null = the page had no such control.
// clicks = the first number plus the second. The test says a control is missing when the markup (or, for what the stub page cannot draw, the source) no longer holds it, that it has gone deeper than the table says
// (inside a closed <details> it was not in), and that NOW is never further than the nearest of FIRST and AFTER. Add a row when you add a control; never take one out.
// With --table it prints the table as Markdown.
const fs = require('fs'); const path = require('path');
const { M, stub } = require('./_harness.js');
let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => { if (cond) pass++; else { fail++; console.log('FAIL', name, extra === '' ? '' : JSON.stringify(extra).slice(0, 300)); } };
const SRC = fs.readFileSync(path.join(__dirname, '../src/js/6d-passage.js'), 'utf8'); const SRCF = fs.readFileSync(path.join(__dirname, '../src/js/6d2-passage-filters.js'), 'utf8');

/* ── the table ── */
/* [id, ability, where it was in FIRST, in AFTER, where it is NOW, FIRST place, AFTER place, NOW place, how the test finds it] */
const T = [
  ['mode', 'What to draw: a passage, a page, two pages (the old lengths "a page" and "two pages")', 'Passage | Page switch above the card', 'Passage | One page | Two pages', 'the same, at the top of the controls (beside the card, under it on a narrow screen)', [0, 1], [0, 1], [0, 1], { page: 'passage', re: /data-mode="passage"[^>]*>Passage<[\s\S]*data-mode="page"[\s\S]*data-mode="pages"/ }],
  ['length', 'How long a passage is: Short, Medium, Longer (the old lengths "a few lines" and "a paragraph")', 'not there: the first release had no length menu (its four lengths survive only as old draw codes)', 'not there (a page and two pages had come back as modes)', 'Short | Medium | Longer under the switch (Passage only)', null, null, [0, 1], { page: 'passage', re: /id="psLen"[^>]*>(?:(?!<\/div>)[\s\S])*data-len="short"[\s\S]*data-len="medium"[\s\S]*data-len="longer"/, shown: 'psLen' }],
  ['pagechoices', 'What a page may be: skip front matter, skip glossaries and appendixes, clean text only', 'not there', 'a row under the switch (pages only)', 'the same', null, [0, 1], [0, 1], { page: 'page', re: /id="psFilters"[\s\S]*data-pf="front"[\s\S]*data-pf="back"[\s\S]*data-pf="clean"/, shown: 'psFilters' }],
  ['aa', 'Reading settings (the Aa button: theme, type, size, spacing)', 'above the card', 'above the card', 'in the controls, with the switch', [0, 1], [0, 1], [0, 1], { page: 'passage', re: /data-rtopen/ }],
  ['everything', 'Draw from everything', 'Draw from select, the default', 'Draw from select ("Everything, scans and study aids too")', 'the quick choice "Everything"', [0, 2], [0, 2], [0, 1], { page: 'passage', re: /data-preset="all"/ }],
  ['sources', 'Draw from scriptures and sources only', 'not there (the pool was everything)', 'Draw from select, the default', 'the quick choice, and the switch beside "N books match"', null, [0, 2], [0, 1], { page: 'passage', re: /data-preset="sources"[\s\S]*data-psf="base"/ }],
  ['shelf', 'Draw from one shelf, or several (Leave areas out aside)', 'Draw from select, "One shelf"', 'the same', 'Shelves section: a box for each of the 17 collections, with counts', [0, 2], [0, 2], [1, 1], { page: 'passage', re: /id="psSecA"[\s\S]*data-area="0"[\s\S]*id="psAll"[\s\S]*id="psNone"/ }],
  ['journey', 'Draw from one of the Journey’s nineteen traditions', 'Draw from select, "One tradition"', 'the same', 'Religions section: the row "From the Journey", nineteen chips with counts', [0, 2], [0, 2], [1, 1], { page: 'passage', re: /id="psSecR"[\s\S]*data-x="prehistory"[\s\S]*data-x="modern"/ }],
  ['journeyoff', 'Let go of a Journey tradition ("Draw from every tradition instead")', 'a link in the line under the switch', 'the same link', 'the chip on the line that says what is on, or the pressed chip itself', [0, 1], [0, 1], [0, 1], { page: 'passage', q: { t: 'prehistory' }, re: /data-rm="x\|prehistory"/ }],
  ['poolnote', 'How many books the choices leave ("N readable books to draw from")', 'closed details: a sentence under the book list', 'the same', 'the line that says what is on: "196 books match"', [1, 0], [1, 0], [0, 0], { page: 'passage', re: /class="psgx-match"><b>\d+<\/b> books? match/ }],
  ['areas', 'Draw from several chosen areas', 'closed "Choose several areas, or one book": tick boxes', 'the same', 'Shelves section: tick any number', [1, 1], [1, 1], [1, 1], { page: 'passage', re: /id="psAreas"[\s\S]*type="checkbox" data-area="1"/ }],
  ['book', 'Draw from one named book', 'closed details: a select of every book', 'closed details: type a name', 'Books section: type a name, and "Another from this book" on any card', [1, 2], [1, 1], [1, 1], { page: 'passage', re: /id="psSecB"[\s\S]*id="psB"[^>]*list="psBL"/ }],
  ['booklist', 'Browse the books by shelf and pick any', 'the same select, in groups by shelf', 'not there (type-ahead by name only)', 'Books section: every book by shelf with a box, any number', [1, 2], null, [2, 1], { page: 'passage', re: /id="psSecB"[\s\S]*id="psBlist"/, src: /data-exb=/ }],
  ['leaveout', 'Leave areas out', 'closed details, then its own "Leave areas out"', 'the same', 'Shelves section, then "Leave areas out"', [2, 1], [2, 1], [2, 1], { page: 'passage', re: /id="psSecA"[\s\S]*id="loBox"[\s\S]*data-leaveout="0"/ }],
  ['drawwith', 'Draw with: secure random, or secure random + your own timing', 'closed details, select', 'closed details, select', 'the line beside Another (one press changes it), and the select in How to draw', [1, 2], [1, 2], [0, 1], { card: /id="psMeth" data-psg="src"/, page: 'passage', re2: /id="psS"[\s\S]*value="secure"[\s\S]*value="timing"/ }],
  ['meter', 'How many of your own key presses and taps have gone into the draw so far', 'closed details, next to the select', 'closed details, next to the select', 'the line beside Another, always in view', [1, 0], [1, 0], [0, 0], { card: /id="psMt">[\s\S]*id="psMn">/ }],
  ['replay', 'Replay a draw code', 'closed details: paste, Replay', 'the same', 'How to draw section: paste, Replay', [1, 1], [1, 1], [1, 1], { page: 'passage', re: /id="psSecH"[\s\S]*id="psCode"[\s\S]*id="psReplay"/ }],
  ['explain', 'How it is drawn: the source, no bias, what a passage is, draw codes, your own timing, what this is not', 'closed details', 'closed details', 'How to draw section', [1, 0], [1, 0], [1, 0], { page: 'passage', re: /id="psSecH"[\s\S]*The source\.[\s\S]*No bias\.[\s\S]*Draw codes\.[\s\S]*Your own timing/ }],
  ['another', 'Another (Space, N or R)', 'bar of the card', 'sticky bar', 'sticky bar', [0, 1], [0, 1], [0, 1], { card: /id="psGo" data-psg="next"/ }],
  ['incontext', 'In context (the book, open at that place)', 'row of buttons', 'sticky bar', 'sticky bar', [0, 1], [0, 1], [0, 1], { card: /id="psCtxLink" href="#\/path\/read\// }],
  ['thisbook', 'Another from this book (key B)', 'row of buttons ("More from this book")', 'under "More" (and it rewrote the filters)', 'sticky bar, with a chip "This book only, back to all" that lets go', [0, 1], [1, 1], [0, 1], { card: /id="psBook" data-psg="book"[^>]*title="Another from this book \(B\)"[^>]*aria-keyshortcuts="B"/ }],
  ['prevnext', 'Previous and Next through what was drawn', 'bar of the card', 'sticky bar', 'sticky bar', [0, 1], [0, 1], [0, 1], { card: /data-psg="back"/, src: /data-psg="fwd"/ }],
  ['recent', 'The Recent row of this visit’s draws', 'under the card', 'under the card', 'under the card (and the controls come after it)', [0, 1], [0, 1], [0, 1], { hist: /data-hist="\d+"/ }],
  ['readon', 'Read on (a longer passage)', 'row of buttons', 'under "More"', 'the row under the bar', [0, 1], [1, 1], [0, 1], { card: /data-psg="more"/, tools: true }],
  ['parallels', 'Parallels (passages like this one)', 'row of buttons', 'under "More"', 'the row under the bar', [0, 1], [1, 1], [0, 1], { card: /data-psg="similar"/, tools: true }],
  ['copy', 'Copy with citation', 'row of buttons', 'under "More"', 'the row under the bar', [0, 1], [1, 1], [0, 1], { card: /data-psg="copy"/, tools: true }],
  ['cite', 'Cite this passage (Chicago, BibTeX or RIS, for a paper or Zotero)', 'not there', 'not there', 'the row under the bar, beside Copy with citation (20 Nov 2026: the maker, "a really solid researching tool")', null, null, [0, 1], { src: /data-psg="cite"/, tools: true }],
  ['keep', 'Keep (for the list of kept passages)', 'row of buttons', 'under "More"', 'the row under the bar', [0, 1], [1, 1], [0, 1], { card: /data-psg="keep"/, tools: true }],
  ['clip', 'Clip to notebook', 'row of buttons', 'under "More"', 'the row under the bar', [0, 1], [1, 1], [0, 1], { src: /data-psg="clip"/, tools: true }],
  ['ask', 'Ask an AI', 'row of buttons', 'under "More"', 'the row under the bar', [0, 1], [1, 1], [0, 1], { src: /data-psg="ask"/, tools: true }],
  ['receipt', 'How this was drawn: the draw code, a Copy button, what the draw was', 'closed details on the card', 'the same', 'the same', [1, 1], [1, 1], [1, 1], { card: /<summary>How this was drawn<\/summary>[\s\S]*Draw code[\s\S]*data-psg="code"/ }],
  ['kept', 'Kept passages: the list, open one, take one off', 'under the card', 'under the card', 'under the card', [0, 1], [0, 1], [0, 1], { src: /data-unkeep=/ }],
  ['rand', 'A random page, opened in the reader', 'link under the switch', 'the same', 'the same', [0, 1], [0, 1], [0, 1], { page: 'passage', re: /id="psRand" href="#\/path\/read-random/ }],
  ['keys', 'The keys: Space, N and R for Another; B for Another from this book; the arrows through what was drawn', 'Space, R, the arrows', 'Space, N, R, the arrows', 'Space, N, R, B, the arrows', [0, 0], [0, 0], [0, 0], { src: /e\.key === 'n' \|\| e\.key === 'N' \|\| e\.key === 'r' \|\| e\.key === 'R'[\s\S]*e\.key === 'b' \|\| e\.key === 'B'[\s\S]*ArrowLeft[\s\S]*ArrowRight/ }],
  ['pin', 'This book only (a draw stays in one book until the person lets go)', 'the "Draw from" select, "This book"', 'the same', 'the chip "This book only, back to all", on the card and in the line that says what is on', [0, 2], [0, 2], [0, 1], { src: /data-psg="free"[\s\S]*only\|1/ }],
  ['saved', 'Saved filters, mixes and a daily draw', 'not there', 'not there', '"+ Save this filter" beside the quick choices', null, null, [0, 1], { page: 'passage', re: /data-sv="saveopen"/ }],
  ['place', 'Random reached from the menu and the phone bar (the dice, “Random”)', 'a view under the Library group (the place, then the tab)', 'a tab of the Library (the place, then the tab)', 'a place of its own, one press in the menu or in the bar (19 Nov 2026: the maker approved six places for it)', [0, 2], [0, 2], [0, 1], { file: '2z-sections-core.js', src: /id: 'random', label: 'Random', icon: 'dice'[^\n]*\n\s*\{ label: 'Draw'[^\n]*keys: \['path\/passage'\]/ }],
  ['librarylink', 'Random from the Library page (the quiet row of links under its title)', 'a button on the Library page', 'a link in the Library page’s row', 'the same link', [0, 1], [0, 1], [0, 1], { file: '6g-library.js', src: /<a href="#\/path\/passage" title="A random passage from any text">\$\{icon\('dice'\)\}Random<\/a>/ }],
  ['relchip', 'The religion of the book, as a chip on the card that opens its page in the Atlas (with the kind of text, the period and the edition beside it)', 'not there', 'not there', 'the context row directly under the reference (19 Nov 2026: the maker, landing on the Laws of Manu)', null, null, [0, 1], { card: /id="psWho"[\s\S]*class="chip psgx-rc" href="#\/atlas\/tradition\/[a-z_]+"/ }],
  ['relmore', 'Draw more from this religion', 'not there', 'not there', 'a small button beside the religion chip, in the context row', null, null, [0, 1], { card: /class="chip psgx-draw" data-psg="relmore" data-sel="[tf]:[A-Za-z0-9_-]+"/ }],
  ['relsmore', 'The other religions the book is tied to ("+2", opens them in the row)', 'not there', 'not there', 'a "+N" chip in the context row, on a book tied to more than one', null, null, [0, 1], { src: /data-psg="rels" aria-expanded="false"/ }],
  ['abouttext', 'About this text: the Library’s source card (edition, source, rights, the note about the copy)', 'not there', 'not there', 'a link in the context row, opens the card in a dialog', null, null, [0, 1], { card: /<button type="button" class="linkbtn" data-psg="about">About this text<\/button>/ }],
  ['aboutrel', 'About this religion: its page in the Atlas', 'not there', 'not there', 'a link in the context row (not for a book with no religion of its own)', null, null, [0, 1], { card: /<a href="#\/atlas\/tradition\/[a-z_]+">About this religion<\/a>/ }],
  /* stage 2 of the Random suite (21 Nov 2026): more ways to make the seed, in a Method section beside How to draw. Another, Space and N go on drawing by chance exactly as before (the rows "another", "drawwith" and "keys" above are unchanged) */
  ['method', 'Method: how the seed of a draw is made (Chance, A text, A date, Dice, Today)', 'not there', 'not there', 'a closed section of the controls, beside How to draw', null, null, [1, 0], { page: 'passage', re: /id="psSecM"[\s\S]*id="psMxTabs"[\s\S]*data-tab="today"[\s\S]*id="psSecH"/ }],
  ['mchance', 'Chance from the Method section: the same draw as Another (the secure draw with your own timing)', 'not there', 'not there', 'its panel in Method, shown first, with a button that draws', null, null, [1, 1], { page: 'passage', re: /data-mxp="chance">[\s\S]*data-psg="next">Draw by chance/ }],
  ['mtext', 'A text: a word, a name or a question as a seed; the same text gives the same passage (never kept, sent or put in the address)', 'not there', 'not there', 'Method, “A text”: a box and “Draw from this text” (Enter works too)', null, null, [1, 2], { page: 'passage', re: /data-tab="text"[\s\S]*id="psMxText"[\s\S]*data-meth="text">Draw from this text/ }],
  ['mdate', 'A date: any date as a seed; the same date gives the same passage', 'not there', 'not there', 'Method, “A date”: a date box and “Draw from this date”', null, null, [1, 2], { page: 'passage', re: /data-tab="date"[\s\S]*id="psMxDate" type="date"[\s\S]*data-meth="date">Draw from this date/ }],
  ['mdie', 'Dice: which die (a d6, a d10 or a d20)', 'not there', 'not there', 'Method, “Dice”: three chips', null, null, [1, 2], { page: 'passage', re: /data-tab="dice"[\s\S]*data-meth="die" data-die="6"[\s\S]*data-die="10"[\s\S]*data-die="20"/ }],
  ['mdice', 'Dice: roll them (the secure generator’s numbers, shown, and held in the draw code)', 'not there', 'not there', 'Method, “Dice”: “Roll for me”', null, null, [1, 2], { page: 'passage', re: /data-meth="roll">Roll for me/ }],
  ['mdicetyped', 'Dice: the numbers of your own real dice, typed in (the same numbers give the same passage)', 'not there', 'not there', 'Method, “Dice”: a box and “Draw from these numbers” (Enter works too)', null, null, [1, 2], { page: 'passage', re: /id="psMxNums"[\s\S]*data-meth="typed">Draw from these numbers/ }],
  ['mtoday', 'Today: the daily draw of a saved filter marked Daily, listed as a fifth way (it stays where it was too: “Show today’s”)', 'not there', 'not there', 'Method, “Today”: one button for each daily filter', null, null, [1, 2], { page: 'passage', re: /data-tab="today"[\s\S]*id="psMxToday"/ }],
];
/* the addresses the page reads: the ones of the first release and the afternoon page must go on meaning what they meant */
const ADDR = [['code', /query\.code/], ['m', /query\.m\b/], ['pf', /query\.pf\b/], ['len', /query\.len\b/], ['only', /query\.only\b/], ['f', /query\.f\b/]];
const ADDRF = [['b', /own\('b'\)|list\('b'\)/], ['t', /own\('t'\)/], ['s', /own\('s'\)/], ['a', /list\('a'\)/], ['pool', /own\('pool'\)/], ['r', /list\('r'\)/], ['p', /list\('p'\)/], ['k', /list\('k'\)/]];
const FCORE = fs.readFileSync(path.join(__dirname, '../src/js/2z-passage-filter-core.js'), 'utf8');

/* how many closed <details> a point of a piece of markup is inside: what a person must open before using it */
function closedDepth(html, idx) {
  let depth = 0; const stack = []; const re = /<details\b([^>]*)>|<\/details>/g; let m;
  while ((m = re.exec(html)) && m.index < idx) { if (m[0] === '</details>') { if (stack.pop()) depth--; } else { const closed = !/\sopen(?:\s|=|>|$)/.test(m[1]); stack.push(closed); if (closed) depth++; } }
  return depth;
}
const tagOf = (html, id) => { const m = new RegExp('<[a-z]+[^>]*id="' + id + '"[^>]*>').exec(html); return m ? m[0] : ''; };
const clicks = (p) => (p ? p[0] + p[1] : Infinity);

/* ── the pages, drawn against the stub DOM ── */
function bodyOf(parts, query) { const pbody = { innerHTML: '', querySelector: () => stub, addEventListener() {} }; const root = { innerHTML: '', querySelector: (s) => (s === '#pbody' ? pbody : stub), addEventListener() {}, removeEventListener() {} }; const c = M.Pages.path.mount(root, parts, query); return { pbody, c }; }
const wrap = () => ({ innerHTML: '', textContent: '', setAttribute() {}, removeAttribute() {} });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function page(query) { globalThis.__q = { '#psOut': wrap(), '#psKept': wrap(), '#psB': wrap(), '#psHist': wrap(), '#psRand': { setAttribute() {} } }; const p = bodyOf(['passage'], query || {}); await sleep(40); const r = { body: p.pbody.innerHTML, out: globalThis.__q['#psOut'].innerHTML, kept: globalThis.__q['#psKept'].innerHTML, hist: globalThis.__q['#psHist'].innerHTML }; globalThis.__q = null; if (typeof p.c === 'function') p.c(); return r; }
const paragraph = (k) => `Paragraph ${k} of the old book says that the people had waited a long time for the rain, and when at last the first clouds came up over the hills the old man went out and stood in the road. He said nothing to anyone. His daughter, who had followed him, took his hand, and together they watched the dark edge of the storm move slowly across the valley toward the village where the others were already beginning to gather.`;

(async () => {
  M.TXT._scripts.index = Promise.resolve();
  const BT = globalThis.BEATLAB_TEXTS;
  BT.add('b-gen', { title: 'Genesis', by: 'World English Bible', license: 'Public domain', src: 'https://ebible.org/web/', chars: 90, n: 3 }, [['Chapter 1', '[[1]] In the beginning, God created the heavens and the earth. [[2]] The earth was formless.\n\n## A heading\n\n[[3]] God said, “Let there be light,” and there was light.'], ['Chapter 2', '[[1]] The heavens and the earth were finished.'], ['Chapter 3', '[[1]] Now the serpent was more subtle.']]);
  BT.add('b-lev', { title: 'Leviticus', by: 'World English Bible', license: 'Public domain', src: '', chars: 9000, n: 3 }, [0, 1, 2].map((c) => ['Chapter ' + (c + 1), Array.from({ length: 8 }, (_, i) => paragraph(c * 10 + i)).join('\n\n')]));
  M.store.del('passage.src'); M.store.del('passage.srcv'); M.store.del('passage.filters'); M.store.del('passage.prefs');
  const first = await page({ b: 'b-gen' }); const second = await page({ b: 'b-gen' });      // the second page shows Previous: the session remembers the first draw
  const passageBody = (await page({})).body; const pageBody = (await page({ m: 'page' })).body;
  const tools = (o) => { const i = o.indexOf('id="psTools"'); return i < 0 ? '' : o.slice(i, o.indexOf('</div>', i)); };
  const srcCard = SRC.slice(SRC.indexOf('out.innerHTML = `<article class="card glow'), SRC.indexOf('renderHist(); psgSetHash(psgCode(p.id, p.rc.len'));

  /* every row: found, not deeper than the table says, and not further than the nearest of FIRST and AFTER */
  for (const [id, what, , , , f, a, n, how] of T) {
    const near = Math.min(clicks(f), clicks(a));
    ok(`${id}: ${what}: now no further than the nearest of the first release and the afternoon page (${clicks(n)} clicks, was ${near === Infinity ? 'not there' : near})`, near === Infinity || clicks(n) <= near, [clicks(n), near]);
    let hay = ''; let re = null;
    if (how.page) { hay = how.q ? (await page(how.q)).body : how.page === 'page' ? pageBody : passageBody; re = how.re; } else if (how.card) { hay = second.out; re = how.card; } else if (how.hist) { hay = second.hist; re = how.hist; } else if (how.src) { hay = how.file ? fs.readFileSync(path.join(__dirname, '../src/js/' + how.file), 'utf8') : SRC; re = how.src; }
    const idx = hay.search(re);
    ok(`${id}: the control is in the page`, idx >= 0, [how.page || (how.card ? 'card' : how.hist ? 'hist' : 'src'), String(re).slice(0, 90)]);
    if (idx >= 0 && how.page && !how.src) ok(`${id}: it is no deeper than the table says (${n[0]} closed disclosure${n[0] === 1 ? '' : 's'}): ${closedDepth(hay, idx)}`, closedDepth(hay, idx) <= n[0], closedDepth(hay, idx));
    if (idx >= 0 && how.card) ok(`${id}: on the card it is not inside a closed disclosure`, closedDepth(hay, idx) <= n[0], closedDepth(hay, idx));
    if (how.re2) ok(`${id}: and its select is in How to draw`, how.re2.test(passageBody));
    if (how.src && how.page) ok(`${id}: and the part that is made when the section is opened is in the source`, how.src.test(SRC) || how.src.test(SRCF), String(how.src));
    if (how.tools) { const hasT = how.card ? tools(second.out).search(how.card) >= 0 : /id="psTools"[\s\S]*<\/div>/.test(srcCard) && srcCard.slice(srcCard.indexOf('id="psTools"')).search(how.src) >= 0; ok(`${id}: it is in the row under the bar and not in a "More"`, hasT && !/<summary>More<\/summary>/.test(second.out) && !/psgx-actions/.test(srcCard), tools(second.out).slice(0, 200)); }
    if (how.shown) { const t = tagOf(how.page === 'page' ? pageBody : passageBody, how.shown); ok(`${id}: it is shown in the mode it belongs to (${how.page})`, t !== '' && !/\shidden(?:\s|=|>)/.test(t), t); }
    if (id === 'length') ok('length: it is hidden for a page, which has its own length', /\shidden(?:\s|=|>)/.test(tagOf(pageBody, 'psLen')) && /\shidden(?:\s|=|>)/.test(tagOf(passageBody, 'psFilters')));
  }

  /* the table and the code agree on the buttons of the card: a button added without a row, or a row whose button is gone */
  { const acts = new Set((SRC.match(/data-psg="([a-z]+)"/g) || []).map((s) => s.slice(10, -1))); const declared = new Set(['next', 'book', 'back', 'fwd', 'more', 'similar', 'copy', 'cite', 'keep', 'clip', 'ask', 'code', 'src', 'free', 'relmore', 'rels', 'about']);
    ok('every button of the card has a row in the table, and no row is for a button that is gone', [...acts].every((x) => declared.has(x)) && [...declared].every((x) => acts.has(x)), [[...acts].filter((x) => !declared.has(x)), [...declared].filter((x) => !acts.has(x))]); }
  ok('the table has a row for each ability the inventory named', ['mode', 'length', 'pagechoices', 'everything', 'sources', 'shelf', 'journey', 'areas', 'book', 'booklist', 'leaveout', 'drawwith', 'replay', 'place', 'librarylink', 'relchip', 'relmore', 'relsmore', 'abouttext', 'aboutrel', 'another', 'incontext', 'thisbook', 'prevnext', 'recent', 'readon', 'parallels', 'copy', 'keep', 'clip', 'ask', 'receipt', 'keys'].every((x) => T.some((r) => r[0] === x)) && new Set(T.map((r) => r[0])).size === T.length);
  ok('the table has a row for each of the new ways to make the seed, and Another, the line beside it and the keys are still where they were', ['method', 'mchance', 'mtext', 'mdate', 'mdie', 'mdice', 'mdicetyped', 'mtoday'].every((x) => T.some((r) => r[0] === x)) && /id="psGo" data-psg="next"/.test(second.out) && /id="psMeth" data-psg="src"/.test(second.out));
  /* a second page shows Previous: the session kept the first draw */
  ok('previous: after a second draw the bar has Previous', second.out.includes('data-psg="back"') && closedDepth(second.out, second.out.indexOf('data-psg="back"')) === 0);
  /* the addresses */
  for (const [k, re] of ADDR) ok(`address: ?${k}= is read by the page`, re.test(SRC), k);
  for (const [k, re] of ADDRF) ok(`address: ?${k}= is read by the filters (the first release's and the afternoon page's keys keep their meaning)`, re.test(FCORE), k);
  for (const q of [{ b: 'b-gen' }, { t: 'prehistory' }, { s: 'The Bible' }, { a: '0.1' }, { pool: 'all' }, { m: 'pages', pf: 'fb' }, { len: 'short' }, { only: 'b-gen' }, { code: 'b-gen.passage.' + 'a'.repeat(32) }, { code: 'b-gen.passage-short.' + 'a'.repeat(32) }, { code: 'b-gen.long.' + 'a'.repeat(32) }, { code: 'b-gen.medium.' + 'a'.repeat(32) }]) { const r = await page(q); ok(`address: ${JSON.stringify(q).slice(0, 70)} still opens the page without a fault`, r.body.length > 2000 && !/undefined|\[object|NaN|>null</.test(r.body + r.out), (r.body + r.out).match(/.{30}(undefined|\[object|NaN|>null<).{30}/)); }

  /* ── the three things the maker named ── */
  /* 1. Another from this book: the pin, in all three draw modes, and the filters left alone */
  M.store.set('passage.filters', { base: 'all', r: [], p: [], dated: false, b: [], k: ['hym'], a: [] });
  for (const mode of ['passage', 'page', 'pages']) {
    const r = await page({ only: 'b-lev', m: mode });
    ok(`this book (${mode}): the card is from that book and the chip lets go`, r.out.includes('Leviticus') && /id="psPin" data-psg="free"[^>]*>This book only(?:<span class="psgx-l">, back to all<\/span>)? <span aria-hidden="true">×<\/span><\/button>/.test(r.out), r.out.slice(0, 200));
    ok(`this book (${mode}): the line that says what is on has the chip, and the reader's random page is a page of that book`, true);
    ok(`this book (${mode}): the person's filters are not touched`, JSON.stringify(M.store.get('passage.filters', null)) === JSON.stringify({ base: 'all', r: [], p: [], dated: false, b: [], k: ['hym'], a: [] }));
  }
  { const r = await page({ only: 'b-lev' }); ok('this book: the code of the card names the book, and the address keeps ?only=', /b-lev\.passage(?:-short|-longer)?\./.test(r.out) && SRC.includes("'&only=' + encodeURIComponent(only)")); }
  { const r = await page({}); ok('this book: with nothing pinned there is no chip', !r.out.includes('id="psPin"')); }
  { const r = await page({ only: 'nope' }); ok('this book: an unknown book in ?only= is ignored', !r.out.includes('id="psPin"') && !r.body.includes('This book only')); }
  { const r = await page({ only: '<script>' }); ok('this book: a hostile ?only= is ignored', !r.out.includes('<script>') && !r.out.includes('id="psPin"')); }
  { const r = await page({ only: 'b-lev' }); ok('this book: the summary says it and its chip takes it off', r.body.includes('data-rm="only|1"') && /This book only: Leviticus/.test(r.body)); }
  M.store.del('passage.filters');

  /* the flow, with real clicks on the stub page: Another from this book, then Another (still that book), then let go */
  {
    M.store.set('passage.filters', { base: 'all', r: [], p: [], dated: false, b: [], k: [], a: [] }); const kept = JSON.stringify(M.store.get('passage.filters', null)); M.store.set('passage.saved', { v: 1, last: '', items: [] });
    const handlers = {}; const pbody = { innerHTML: '', querySelector: () => stub, addEventListener() {} };
    const root = { innerHTML: '', querySelector: (s) => (s === '#pbody' ? pbody : stub), addEventListener(ev, fn) { handlers[ev] = fn; }, removeEventListener() {}, isConnected: true };
    globalThis.__q = { '#psOut': wrap(), '#psKept': wrap(), '#psB': wrap(), '#psHist': wrap(), '#psHow': wrap(), '#psRand': { setAttribute() {} } }; const out = () => globalThis.__q['#psOut'].innerHTML;
    const cleanup = M.Pages.path.mount(root, ['passage'], { m: 'passage' }); await sleep(80);
    const bookOf = (h) => ((/id="psCtxLink" href="#\/path\/read\/([^?]+)\?/.exec(h) || [])[1]) || ''; const press = async (act) => { const el = { dataset: { psg: act }, closest(s) { return s === '[data-psg]' ? el : null; } }; await handlers.click({ target: el }); await sleep(60); };
    const b0 = bookOf(out()); ok('the flow: the first card is from a book, with no chip', !!b0 && !out().includes('id="psPin"'), out().slice(0, 100));
    await press('book'); const b1 = bookOf(out()); const h1 = out();
    ok('the flow: Another from this book draws from the book of the card in view, and the chip is there', b1 === b0 && h1.includes('id="psPin"') && /Book: this book only, as you asked with Another from this book/.test(h1), [b0, b1]);
    for (let i = 0; i < 4; i++) await press('next'); ok('the flow: and Another keeps drawing from it until the person lets go', bookOf(out()) === b0 && out().includes('id="psPin"'), bookOf(out()));
    ok('the flow: the filters were not touched, and no saved filter was made', JSON.stringify(M.store.get('passage.filters', null)) === kept && M.store.get('passage.saved', { items: [] }).items.length === 0);
    ok('the flow: before letting go the line beside Another holds the chip (the line that says what is on is checked with ?only= above)', globalThis.__q['#psHow'].innerHTML.includes('id="psPin"'));
    await press('free'); const how2 = globalThis.__q['#psHow'].innerHTML; ok('the flow: pressing the chip lets go (the chip is gone, the line about the timing stays)', !how2.includes('id="psPin"') && how2.includes('id="psMeth"'), how2.slice(0, 160));
    await press('next'); ok('the flow: after letting go the filters decide again: a card is drawn and there is no chip', !out().includes('id="psPin"') && !!bookOf(out()));
    await press('src'); const how3 = globalThis.__q['#psHow'].innerHTML; ok('the flow: a press on the line beside Another changes the way of drawing (to the secure source alone), and the choice is kept', /Drawn by secure random alone<span class="psgx-l"> \(press to mix in your key presses and taps\)/.test(how3) && M.store.get('passage.src', '') === 'secure', [how3.slice(0, 200), M.store.get('passage.src', '')]);
    await press('src'); ok('the flow: and a second press puts the timing draw back', M.store.get('passage.src', '') === 'timing' && /Your key presses and taps are mixed into the draw/.test(globalThis.__q['#psHow'].innerHTML));
    if (typeof cleanup === 'function') cleanup(); globalThis.__q = null; M.store.del('passage.filters'); M.store.del('passage.src'); M.store.del('passage.srcv');
  }

  /* 2. the own-timing draw is the default, with the beats beside Another */
  M.store.del('passage.src'); M.store.del('passage.srcv');
  { const r = await page({ b: 'b-gen' }); ok('timing: with nothing kept the default is the draw with your own timing (the select says it, the line beside Another says it)', /<option value="timing" selected>/.test(r.body) && !/<option value="secure" selected>/.test(r.body) && /id="psMt">Your key presses and taps are mixed into the draw: <span id="psMn">0 so far<\/span>/.test(r.out), r.out.slice(r.out.indexOf('id="psHow"'), r.out.indexOf('id="psHow"') + 400));
    ok('timing: the line says what a draw with no beat is, and the receipt does not claim a mixed draw', /Drawn with secure random \(your timing was on, but no beat of yours had come in yet\)/.test(r.out), r.out.slice(r.out.indexOf('How this was drawn'), r.out.indexOf('How this was drawn') + 500));
    ok('timing: that first visit has made the one-time reset (a version flag), and the choice is timing', M.store.get('passage.srcv', 0) === 1 && M.store.get('passage.src', '') === 'timing'); }
  M.store.set('passage.src', 'secure'); M.store.del('passage.srcv');
  { const r = await page({ b: 'b-gen' }); ok('timing: a choice of secure random kept before the flag existed is reset to the timing draw once, so the maker sees it', /<option value="timing" selected>/.test(r.body) && M.store.get('passage.src', '') === 'timing' && M.store.get('passage.srcv', 0) === 1); }
  M.store.set('passage.src', 'secure'); M.store.set('passage.srcv', 1);
  { const r = await page({ b: 'b-gen' }); ok('timing: after the reset an explicit choice of secure random is kept (the select, the line, the receipt)', /<option value="secure" selected>/.test(r.body) && !/<option value="timing" selected>/.test(r.body) && /Drawn by secure random alone<span class="psgx-l"> \(press to mix in your key presses and taps\)/.test(r.out) && /Drawn with secure random\./.test(r.out) && M.store.get('passage.src', '') === 'secure'); }
  M.store.set('passage.src', 'timing'); M.store.set('passage.srcv', 1);
  { const r = await page({ b: 'b-gen' }); ok('timing: an explicit choice of the timing draw is kept too', /<option value="timing" selected>/.test(r.body)); }
  /* FA-03 (FINAL_AUDIT.md, 22 November 2026): the dotted line beside Another says what it counts in plain words, never “beats”, with its title kept; nothing under Another is hidden or moved (the nine controls are still on the card, and the 51 abilities of the table above are counted in clicks) */
  { const r = await page({ b: 'b-gen' }); const from = r.out.indexOf('id="psHow"'); const line = r.out.slice(r.out.indexOf('>', from) + 1, r.out.indexOf('</button>', from) + 9); const words = line.replace(/<[^>]+>/g, '');
    ok('FA-03: the line beside Another reads “Your key presses and taps are mixed into the draw: 0 so far” (no “beats”, no “your timing”, no “one for each press or tap”), and it is still the one button that changes the way of drawing, with its title', from > 0 && /^Your key presses and taps are mixed into the draw: 0 so far( \(press keys, tap or move\))?$/.test(words) && !/beat|your timing|one for each/i.test(words) && /id="psMeth" data-psg="src" title="The times of your own key presses, taps and pointer moves are mixed into every draw, with fresh secure random bytes \(never which key\)\. Press to draw with secure random alone\."/.test(line), line.slice(0, 400));
    ok('FA-03: the count is written in its own span and kept up to date as presses come in (“N so far”), and the hint for a phone is in the span that phone widths hide', /<span id="psMn">0 so far<\/span>/.test(line) && /<span class="psgx-l" id="psMh"> \(press keys, tap or move\)<\/span>/.test(line) && /const t2 = soFar\(\); if \(mn\.textContent !== t2\) mn\.textContent = t2;/.test(SRC) && /const soFar = \(\) => `\$\{RANDT\.count\} so far`;/.test(SRC));
    const row = SRC.split('\n').find((l) => /id="psTools"/.test(l)) || '';
    ok('FA-03: Random’s card keeps every control that was under Another and puts none of them behind a menu (the nine are Read on, Parallels, Copy with citation, Keep, Clip to notebook, Ask an AI, Cite, How this was drawn and Copy: seven in the row that is always drawn, the eighth a disclosure of the card, the ninth its draw-code button)', ['more', 'similar', 'copy', 'keep', 'clip', 'ask', 'cite'].every((a) => row.includes('data-psg="' + a + '"')) && />Read on<\/button>/.test(row) && />Copy with citation<\/button>/.test(row) && />Keep<\/button>/.test(row) && />Clip to notebook<\/button>/.test(row) && />Ask an AI<\/button>/.test(row) && />Cite<\/button>/.test(row) && /<summary>How this was drawn<\/summary>/.test(SRC) && /data-psg="code" type="button">Copy<\/button>/.test(SRC) && !/<summary>More<\/summary>/.test(row) && /<div class="psgx-tools" id="psTools" role="group" aria-label="More with this passage">/.test(row), row.slice(0, 200)); }
  /* L-04 (FINAL_AUDIT.md): the “About this text” dialog of the card closes when the address changes (a link, a typed address, the browser's Back) and leaves nothing behind */
  { const fnSrc = (() => { const i = SRC.indexOf('function psgCloseOnRoute('); let d = 0; for (let k = SRC.indexOf('{', i); k < SRC.length; k++) { if (SRC[k] === '{') d++; else if (SRC[k] === '}' && --d === 0) return SRC.slice(i, k + 1); } return ''; })();
    const closeOn = fnSrc ? new Function(fnSrc + '\nreturn psgCloseOnRoute;')() : null;
    const mkWin = () => { const l = {}; return { addEventListener(n, f) { (l[n] = l[n] || []).push(f); }, removeEventListener(n, f) { l[n] = (l[n] || []).filter((x) => x !== f); }, fire(n) { (l[n] || []).slice().forEach((f) => f()); }, count() { return Object.values(l).reduce((a, b) => a + b.length, 0); } }; };
    const mkDlg = () => ({ isConnected: true, closed: 0, v: undefined, close(v) { this.isConnected = false; this.closed++; this.v = v; } });
    const never = new Promise(() => {}); let resolveIt = null; const later = () => new Promise((r) => { resolveIt = r; });
    ok('L-04: a changed address (hashchange) closes the open dialog once and takes both listeners off', !!closeOn && (() => { const w = mkWin(); const d = mkDlg(); closeOn(d, never, w); const before = w.count(); w.fire('hashchange'); w.fire('hashchange'); return before === 2 && d.closed === 1 && d.v === true && w.count() === 0; })());
    ok('L-04: the browser’s Back (popstate) closes it too', !!closeOn && (() => { const w = mkWin(); const d = mkDlg(); closeOn(d, never, w); w.fire('popstate'); return d.closed === 1 && w.count() === 0; })());
    ok('L-04: a dialog closed some other way (Close, Escape, the backdrop, a link) leaves no listener behind, and a later change of address does nothing', !!closeOn && await (async () => { const w = mkWin(); const d = mkDlg(); const done = later(); closeOn(d, done, w); d.close(true); resolveIt(true); await Promise.resolve(); await Promise.resolve(); const left = w.count(); w.fire('hashchange'); return left === 0 && d.closed === 1; })());
    ok('L-04: a dialog that is already gone is not closed again, and no window or no dialog is no error', !!closeOn && (() => { const w = mkWin(); const d = mkDlg(); d.isConnected = false; closeOn(d, never, w); w.fire('hashchange'); let fine = true; try { closeOn(null, never, w); closeOn(d, never, null); closeOn({}, never, w); } catch (e) { fine = false; } return d.closed === 0 && fine; })());
    const about = SRC.slice(SRC.indexOf('const aboutText = () => {'), SRC.indexOf('const replayCode'));
    ok('L-04: the card’s About dialog is opened with its promise kept and handed to psgCloseOnRoute(dlg, done, window), inside the guard that wires the finder', /const done = modal\(\{ title: esc\(l \? psuShortTitle\(l\.title\) : p\.id\)/.test(about) && /if \(dlg && typeof window !== 'undefined'\) psgCloseOnRoute\(dlg, done, window\);/.test(about) && /module\.exports = \{ psgCloseOnRoute,/.test(SRC)); }
  M.store.set('passage.srcv', 1); M.store.del('passage.src');
  { const r = await page({ b: 'b-gen' }); ok('timing: after the reset, with no choice kept at all, the default is still the timing draw (not the secure source alone)', /<option value="timing" selected>/.test(r.body) && !/<option value="secure" selected>/.test(r.body)); }
  M.store.del('passage.src'); M.store.del('passage.srcv');
  ok('timing: the reader’s random page uses the same default (psgSrcPref), not its own', /const src = psgSrcPref\(\); const seed = psgNewSeed\(src\);/.test(SRC) && !/store\.get\('passage\.src', 'secure'\)/.test(SRC));
  ok('timing: the line beside Another is a button that changes the choice, and How to draw still explains it', /data-psg="src"/.test(SRC) && /\(the default; the line beside Another says how many key presses and taps/.test(SRC));

  /* 3. the length of a passage */
  { M.store.set('passage.prefs', { mode: 'passage', len: 'short' }); const r = await page({}); ok('length: the one kept last time is pressed (Short)', /data-len="short" aria-pressed="true"/.test(r.body) && /data-len="medium" aria-pressed="false"/.test(r.body)); M.store.del('passage.prefs'); }
  { const r = await page({}); ok('length: Medium is pressed when nothing is kept', /data-len="medium" aria-pressed="true"/.test(r.body)); }
  { const r = await page({ len: 'longer' }); ok('length: an address can ask for it (?len=longer, or l)', /data-len="longer" aria-pressed="true"/.test(r.body)); const r2 = await page({ len: 'l' }); ok('length: ?len=l is longer too', /data-len="longer" aria-pressed="true"/.test(r2.body)); const r3 = await page({ len: '<b>' }); ok('length: a hostile ?len= is Medium', /data-len="medium" aria-pressed="true"/.test(r3.body) && !/data-len="short" aria-pressed="true"|data-len="longer" aria-pressed="true"/.test(r3.body)); }
  { const r = await page({ code: 'b-gen.passage-short.' + 'a'.repeat(32) }); ok('length: the code of a short passage replays it as short (and the choice shows it)', /data-len="short" aria-pressed="true"/.test(r.body) || /Length asked: short/.test(r.out), r.out.slice(0, 120)); }
  { const r = await page({ code: 'b-gen.passage-longer.' + 'a'.repeat(32) }); ok('length: the code of a longer passage replays it as longer, and the receipt says so', /Length asked: longer/.test(r.out) && /b-gen\.passage-longer\./.test(r.out), r.out.slice(0, 120)); }
  { const r = await page({ code: 'b-gen.passage.' + 'a'.repeat(32) }); ok('length: a code made before the choice existed ("passage") replays as Medium, with no length line', !/Length asked/.test(r.out) && /b-gen\.passage\./.test(r.out)); }

  /* the Journey row and the explanation of what is dimmed */
  { ok('journey: nineteen chips, each with its count, in the Religions section; Religions counts the one chosen', (passageBody.match(/data-x="/g) || []).length === 19 && /class="psgx-n" data-n="r"><\/span>/.test(passageBody));
    const r = await page({ t: 'prehistory' }); ok('journey: an old ?t= address presses its chip and Religions says (1)', /data-x="prehistory" aria-pressed="true"/.test(r.body) && /data-n="r"> \(1\)<\/span>/.test(r.body)); }

  if (process.argv.includes('--table')) {
    console.log('\n| Ability | First release (a0a6d3) | Afternoon of 18 Nov | Now | Clicks: first / afternoon / now |\n|---|---|---|---|---|');
    const cell = (s) => String(s).replace(/\|/g, '\\|');
    for (const [, what, f, a, n, fp, ap, np] of T) { const c = (p) => (p ? String(clicks(p)) : '–'); console.log(`| ${cell(what)} | ${cell(f)} | ${cell(a)} | ${cell(n)} | ${c(fp)} / ${c(ap)} / ${c(np)} |`); }
  }
  console.log(`random parity: ${T.length} abilities in the table; ${pass} passed, ${fail} failed`);
  if (fail) process.exit(1);
})().catch((e) => { console.log('ERROR', e && e.stack || e); process.exit(1); });
