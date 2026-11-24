/* Alpha fixes C: AA-01 of ALPHA_AUDIT.md, second round: a copy opened from a file, which cannot fetch its neighbours, still loads every text as a script, and the engine keeps a script's source and strings for as long as the page is open.
   Measured on a page opened from a file (headless Brave 158): a frame of its own for each text (removed afterwards) frees none of it, a worker cannot read the file, and a whole-library search keeps 4.4 GB; so the loader stays what it is
   (scripts from a file, fetch on a web address or localhost), and nothing may run the tab out of memory: a guard stops a scan at about 2.5 GB, the search of every text asks first from a file as well, and the other loops that read many texts
   use TXT.scan (look at a text and let go) and the same guard. Also: the search says "of the N readable texts" with the count Methods and standards uses.
   Run: node tests/alpha-fixes-c.test.js */
const fs = require('fs'); const path = require('path'); const vm = require('vm');
let pass = 0; let fail = 0; const ok = (n, c, x) => { if (c) pass++; else { fail++; console.log('FAIL', n, x === undefined ? '' : JSON.stringify(x).slice(0, 600)); } };
const dir = path.join(__dirname, '../src/js'); const root = path.join(__dirname, '../..');
const src = (f) => fs.readFileSync(path.join(dir, f), 'utf8');
const SRC = require('../src/js/2z-source-core.js');
const { M } = require('./_harness.js');
const N = (n) => n.toLocaleString('en-US');

(async () => {
  /* ═══ the guard itself (pure) ═══ */
  { const lim = 4192e6;
    ok('guard: a browser that does not say how much memory the page uses is never stopped', !SRC.memOver(null) && !SRC.memOver(undefined) && !SRC.memOver({}) && !SRC.memOver({ usedJSHeapSize: 'x' }) && SRC.memStop(null) === 0 && SRC.memStop({}) === 0);
    ok('guard: on an engine with a 4 GB limit a scan stops at 2.5 GB and not before', SRC.MEM_STOP === 2.5e9 && SRC.memStop({ usedJSHeapSize: 1, jsHeapSizeLimit: lim }) === 2.5e9 && !SRC.memOver({ usedJSHeapSize: 2.49e9, jsHeapSizeLimit: lim }) && SRC.memOver({ usedJSHeapSize: 2.5e9, jsHeapSizeLimit: lim }) && SRC.memOver({ usedJSHeapSize: 4.4e9, jsHeapSizeLimit: lim }));
    ok('guard: an engine with a lower limit (a phone, a 32-bit browser) stops at 60% of it; no limit given means 2.5 GB', SRC.memStop({ usedJSHeapSize: 1, jsHeapSizeLimit: 1e9 }) === 6e8 && SRC.memOver({ usedJSHeapSize: 6e8, jsHeapSizeLimit: 1e9 }) && !SRC.memOver({ usedJSHeapSize: 5.9e8, jsHeapSizeLimit: 1e9 }) && SRC.memStop({ usedJSHeapSize: 5 }) === 2.5e9);
    ok('guard: a normal Chrome-family browser freezes performance.memory (measured: 10 MB while 800 MB were allocated), so the texts the page holds as scripts count too, at 2.8 bytes for each character: 2.5 GB at about 893 million characters, whatever the reading says', SRC.MEM_PER_CHAR === 2.8 && SRC.memEstimate(1e6) === 2800000 && SRC.memEstimate(undefined) === 0 && !SRC.memOver(null, 880e6) && SRC.memOver(null, 900e6) && !SRC.memOver({ usedJSHeapSize: 10e6, jsHeapSizeLimit: lim }, 880e6) && SRC.memOver({ usedJSHeapSize: 10e6, jsHeapSizeLimit: lim }, 900e6) && SRC.memOver({ usedJSHeapSize: 3e9, jsHeapSizeLimit: lim }, 0) && !SRC.memOver(null, 0) && !SRC.memOver(null));
    ok('guard: the loader asks the page (TXT.mem is performance.memory or null) and says false where the browser says nothing', typeof M.TXT.mem === 'function' && typeof M.TXT.heapOver === 'function' && M.TXT.mem() === null && M.TXT.heapOver() === false);
    const w = (protocol, hostname) => ({ protocol, hostname });
    ok('ask first: the search of every text asks on a website and from a file, never on a server of this computer, and never for a shelf or after a yes', SRC.srchAskFirst('', false, w('https:', 'a.org')) && SRC.srchAskFirst('', false, w('file:')) && !SRC.srchAskFirst('', false, w('http:', 'localhost')) && !SRC.srchAskFirst('', false, w('http:', '127.0.0.1')) && !SRC.srchAskFirst('3', false, w('file:')) && !SRC.srchAskFirst('mine', false, w('file:')) && !SRC.srchAskFirst('', true, w('file:'))); }

  /* ═══ the loaders, with the page's own files read from disk ═══ */
  vm.runInThisContext(fs.readFileSync(path.join(root, 'texts/index.js'), 'utf8')); const META = BEATLAB_TEXTS.meta;
  const fetchLog = []; const scriptLog = []; const frames = [];
  globalThis.fetch = async (url) => { fetchLog.push(url); const f = path.join(root, url); return fs.existsSync(f) ? { ok: true, text: async () => fs.readFileSync(f, 'utf8') } : { ok: false }; };
  M.document.createElement = ((orig) => (t) => { if (t === 'iframe') frames.push(t); return t === 'script' ? { dataset: {}, style: {}, remove() {} } : orig(t); })(M.document.createElement);
  M.document.head = { appendChild(s) { scriptLog.push(s.src); setImmediate(() => { try { vm.runInThisContext(fs.readFileSync(path.join(root, s.src), 'utf8')); s.onload(); } catch (e) { s.onerror(e); } }); } };
  M.document.querySelectorAll = () => [];
  const web = { protocol: 'https:', hostname: 'lamplighter.example' }; const file = { protocol: 'file:' }; const local = { protocol: 'http:', hostname: 'localhost' };
  const where = (loc) => { Object.keys(M.location).forEach((k) => { delete M.location[k]; }); Object.assign(M.location, { hash: '' }, loc); };
  const reset = () => { fetchLog.length = 0; scriptLog.length = 0; frames.length = 0; M.TXT.held = {}; BEATLAB_TEXTS.data = {}; Object.keys(M.TXT._scripts).forEach((k) => delete M.TXT._scripts[k]); };
  const cq = M.compileQuery('compassion', {}); const o = { e: true, c: '' };
  const run = async (ids, info) => { const tok = ++M.SRCH.token; return M.srchRun(cq, ids, o, tok, () => {}, info); };
  const few = ['b-gen', 'b-dan', 'b-psa'].filter((id) => META[id] && fs.existsSync(path.join(root, 'texts', id + '.js')));
  const twelve = []; for (let i = 0; i < 12; i++) twelve.push(few[i % few.length]);
  const realScan = M.TXT.scan; const realMem = M.TXT.mem;
  /* a heap that grows by a billion bytes for each text that is started: the guard must stop the scan long before the end */
  const growing = (per) => { let started = 0; const heap = { usedJSHeapSize: 0, jsHeapSizeLimit: 4192e6 }; M.TXT.mem = () => heap; M.TXT.scan = async function (id, fn) { started++; heap.usedJSHeapSize = started * per; return realScan.call(M.TXT, id, fn); }; return { heap, started: () => started }; };
  const plain = () => { M.TXT.scan = realScan; M.TXT.mem = realMem; };

  { /* the guard stops a scan on a simulated heap, and keeps what it found */
    reset(); where(file); const g = growing(1e9); const info = {}; const res = await run(twelve, info); plain();
    ok('guard: on a heap that grows past 2.5 GB the scan stops early, says so, and keeps the hits found so far', info.stopped === true && info.done >= 2 && info.done < twelve.length && g.started() < twelve.length && res.size > 0, { info, started: g.started(), kept: res.size });
    ok('guard: the texts that were read before the stop are let go of (a text is not left in the page)', Object.keys(BEATLAB_TEXTS.data).length === 0);
    reset(); where(file); const g2 = growing(1e5); const info2 = {}; const res2 = await run(twelve, info2); plain();
    ok('guard: on a heap that stays small the whole scan runs, and nothing is flagged', info2.stopped === false && info2.done === twelve.length && g2.started() === twelve.length && res2.size > 0, info2);
    reset(); where(file); M.TXT.mem = () => null; const info3 = {}; await run(twelve, info3); plain();
    ok('guard: on a browser that does not say how much memory is used the whole scan runs (the question before the search is its only protection)', info3.stopped === false && info3.done === twelve.length);
    { reset(); where(file); const frozen = { usedJSHeapSize: 10e6, jsHeapSizeLimit: 3586e6 }; M.TXT.mem = () => frozen; const stopAt = SRC.memStop(frozen) / SRC.MEM_PER_CHAR; M.TXT.held = { pretend: Math.floor(stopAt - few.reduce((a, id) => a + META[id].chars, 0) / 2) }; const info5 = {}; const res5 = await run(twelve, info5); plain();
      ok('guard: with the reading frozen (a normal Chrome) and room for only a few more texts, the texts held as scripts stop the scan early, and the hits so far are kept', info5.stopped === true && info5.done < twelve.length && res5.size > 0, info5);
      reset(); where(file); const info6 = {}; await run(few, info6); const sum = few.reduce((a, id) => a + META[id].chars, 0); const held1 = M.TXT.heldChars(); await run(few, {});
      ok('guard: from a file each text loaded as a script is counted once (its characters), and loading it again adds nothing', held1 === sum && M.TXT.heldChars() === sum && info6.stopped === false, { held1, sum, again: M.TXT.heldChars() });
      reset(); where(web); await run(few, {}); ok('guard: a text read as data (a website, localhost) is not counted: nothing of it is kept', M.TXT.heldChars() === 0); }
    reset(); where(web); const g4 = growing(1e9); const info4 = {}; await run(twelve, info4); plain();
    ok('guard: it applies on a website and a local server too, whatever the loader', info4.stopped === true && info4.done < twelve.length);
  }

  { /* the loader is what it was: scripts from a file, fetch on a web address or localhost; each text asked once, the heap looked at after each; no frame is made */
    reset(); where(file); const seen = []; M.TXT.mem = () => { seen.push(1); return null; }; await run(few, {}); const heapLooks = seen.length; plain();
    ok('loader: from a file each text is a script (nothing is fetched), it is let go of again, and the heap is looked at while the scan goes on', fetchLog.length === 0 && scriptLog.length === few.length && Object.keys(BEATLAB_TEXTS.data).length === 0 && heapLooks >= few.length - 1, { fetch: fetchLog.length, scripts: scriptLog.length, looks: heapLooks });
    reset(); where(web); await run(few, {});
    ok('loader: on a website each text is fetched once and read as data (no script added), as before', fetchLog.length === few.length && scriptLog.length === 0 && Object.keys(BEATLAB_TEXTS.data).length === 0);
    reset(); where(local); await run(few, {});
    ok('loader: on localhost the same: fetch, read as data, nothing kept', fetchLog.length === few.length && scriptLog.length === 0 && Object.keys(BEATLAB_TEXTS.data).length === 0);
    ok('loader: no frame is made on any path (a frame for each text was measured to free nothing, so it was not built)', frames.length === 0 && !/iframe|srcdoc/i.test(src('6c-texts.js').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, ''))); }

  /* ═══ the search page: the question from a file, the stop, and the count ═══ */
  { const mk = () => ({ innerHTML: '', textContent: '', addEventListener() {}, hidden: false, style: {}, dataset: {} });
    const state = Object.assign(mk(), { addEventListener(t, f) { if (t === 'click') state.click = f; } }); const st = mk(); const stp = mk();
    const clicks = []; const mount = (query) => { clicks.length = 0; const pbody = { innerHTML: '', querySelector: () => state, addEventListener(t, f) { if (t === 'click') clicks.push(f); } }; const rt = { innerHTML: '', querySelector: (s) => (s === '#pbody' ? pbody : state), addEventListener() {}, removeEventListener() {} }; state.innerHTML = ''; st.innerHTML = ''; stp.innerHTML = ''; globalThis.__q = { '#srState': state, '#srStatus': st, '#srStop': stp, '#srProg': { style: {}, parentElement: { hidden: false } } }; M.Pages.path.mount(rt, ['search'], query); };
    M.TXT.index = () => Promise.resolve(BEATLAB_TEXTS.meta); const pause = (ms) => new Promise((r) => setTimeout(r, ms || 30));
    const until = async (f) => { for (let i = 0; i < 300 && !f(); i++) await pause(20); return f(); };
    const btn = (k) => ({ closest: (sel) => (sel === '[data-srask]' ? { dataset: { srask: k } } : null) });
    const allIds = M.srchIds(META, { c: '' });

    reset(); where(file); M.SRCH.okAll = false; mount({ q: 'compassion' }); await pause();
    const askHtml = state.innerHTML; const text = askHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    ok('ask: from a file the search of every text first asks, in one line, and loads nothing', /id="srAsk"/.test(askHtml) && text.includes('Searching every text from a folder can use several GB of memory; search this shelf first?') && fetchLog.length === 0 && scriptLog.length === 0, text.slice(0, 260));
    ok('ask: the two buttons are "Search this shelf" (first) and "Search everything", and the line names the shelf (The Bible)', askHtml.indexOf('Search this shelf') > 0 && askHtml.indexOf('Search this shelf') < askHtml.indexOf('Search everything') && /looks only in <b>The Bible<\/b>/.test(askHtml) && !/downloads/.test(askHtml));
    state.click({ target: btn('shelf') }); ok('ask: "Search this shelf" runs the same words in The Bible', M.location.hash === M.srchHash('compassion', Object.assign({}, M.srchOpts({}), { c: String(M.LIB_COLLECTIONS.findIndex((c) => /^The Bible/.test(c[0]))) })), M.location.hash);
    where(web); mount({ q: 'compassion' }); await pause(); const webText = state.innerHTML.replace(/<[^>]+>/g, ' ');
    ok('ask: on a website the question is the one it was (the download size)', /downloads about [12]\.\d GB when you use this on the web/.test(webText) && !/several GB of memory/.test(webText), webText.slice(0, 200));
    where(local); mount({ q: 'compassion' }); await pause(); M.SRCH.token++;
    ok('ask: on localhost nothing is asked', !/id="srAsk"/.test(state.innerHTML));
    where(file); M.SRCH.okAll = false; mount({ q: 'compassion' }); await pause(); state.click({ target: btn('all') }); ok('ask: "Search everything" is remembered for the visit, as on the web', M.SRCH.okAll === true);

    /* the stop, on the page: a heap that grows by a billion bytes for each text */
    reset(); where(file); M.SRCH.okAll = true; const frozen = { usedJSHeapSize: 10e6, jsHeapSizeLimit: 3586e6 }; M.TXT.mem = () => frozen; M.TXT.held = { pretend: Math.floor(SRC.memStop(frozen) / SRC.MEM_PER_CHAR - 1) }; mount({ q: 'compassion' }); const stopped = await until(() => /Stopped after/.test(stp.innerHTML)); plain(); M.SRCH.token++;
    const line = stp.innerHTML.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(); const chips = (stp.innerHTML.match(/<a class="chip" data-srgo href="[^"]*c=\d+[^"]*"/g) || []);
    ok('stop: the page says in one plain line what happened, with the number of texts it reached and of all of them', stopped && new RegExp('^Stopped after \\d+ of ' + N(allIds.length).replace(',', ',') + ' texts to keep your browser running; search one shelf for the rest\\.').test(line), line.slice(0, 300));
    ok('stop: from a file the line adds that choosing a shelf loads the page again, which frees the memory', /Choosing a shelf loads the page again, which frees the memory this search used\./.test(line), line);
    ok('stop: a button for each shelf of the library, each running the same words in that shelf only', chips.length === M.LIB_COLLECTIONS.length && M.LIB_COLLECTIONS.every((c, i) => stp.innerHTML.includes('c=' + i)) && /q=compassion/.test(stp.innerHTML), chips.length);
    ok('stop: the status line says "stopped after", not "searched"', /stopped after \d+ of [\d,]+ texts/.test(st.innerHTML) && !/searched/.test(st.innerHTML), st.innerHTML.slice(0, 300));
    ok('stop: a text is not left in the page after the stop', Object.keys(BEATLAB_TEXTS.data).length === 0);
    reset(); where(web); M.SRCH.okAll = true; const g2 = growing(1e9); mount({ q: 'compassion' }); await until(() => /Stopped after/.test(stp.innerHTML)); plain(); M.SRCH.token++;
    ok('stop: on a website the same line, without the sentence about loading the page again', /^Stopped after/.test(stp.innerHTML.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()) && !/loads the page again/.test(stp.innerHTML) && fetchLog.length > 0 && scriptLog.length === 0);

    /* choosing a shelf after a stop: from a file the page is loaded again (the memory is only given back then); with room, or anywhere else, a plain link */
    { let reloaded = 0; let prevented = 0; const href = '#/path/search?q=compassion&c=0'; const chipEv = () => ({ target: { closest: (sel) => (sel === '[data-srgo]' ? { getAttribute: () => href } : null) }, preventDefault() { prevented++; } });
      reset(); where(file); M.location.reload = () => { reloaded++; }; M.SRCH.okAll = true; const fz = { usedJSHeapSize: 10e6, jsHeapSizeLimit: 3586e6 }; M.TXT.mem = () => fz; M.TXT.held = { pretend: Math.floor(SRC.memStop(fz) / SRC.MEM_PER_CHAR - 1) }; mount({ q: 'compassion' }); await until(() => /Stopped after/.test(stp.innerHTML)); M.SRCH.token++;
      await clicks[0](chipEv());
      ok('stop: from a file a shelf chosen on a full page sets the address and loads the page again, so the search starts on a fresh page', reloaded === 1 && prevented === 1 && M.location.hash === href, { reloaded, prevented, hash: M.location.hash });
      M.TXT.held = {}; reloaded = 0; prevented = 0; await clicks[0](chipEv());
      ok('stop: from a file a shelf chosen on a page with room is a plain link (nothing reloaded, nothing prevented)', reloaded === 0 && prevented === 0);
      where(web); M.location.reload = () => { reloaded++; }; M.TXT.held = { pretend: 9e9 }; await clicks[0](chipEv());
      ok('stop: on a website the shelf is a plain link whatever the memory (nothing reloaded)', reloaded === 0 && prevented === 0);
      /* the question before the search: "Search this shelf" loads the page again too, when the page is already full */
      reset(); where(file); M.location.reload = () => { reloaded++; }; M.SRCH.okAll = false; M.TXT.mem = () => fz; M.TXT.held = { pretend: Math.floor(SRC.memStop(fz) / SRC.MEM_PER_CHAR + 1) }; mount({ q: 'compassion' }); await pause(); reloaded = 0; state.click({ target: btn('shelf') }); M.SRCH.token++;
      ok('ask: from a file, on a page that is already full, "Search this shelf" loads the page again; with room it just goes to the shelf', reloaded === 1);
      M.TXT.held = {}; reloaded = 0; state.click({ target: btn('shelf') }); ok('ask: with room the shelf button only changes the address', reloaded === 0);
      plain(); delete M.location.reload; M.SRCH.okAll = false; }
    /* the count: "of the N readable texts", from methCounts, as Methods and standards says it */
    const small = M.LIB_COLLECTIONS.map((c, i) => ({ i, ids: M.srchIds(META, { c: String(i) }) })).filter((x) => x.ids.length > 0 && x.ids.every((id) => fs.existsSync(path.join(root, 'texts', id + '.js')))).sort((a, b) => a.ids.reduce((s, id) => s + (META[id].chars || 0), 0) - b.ids.reduce((s, id) => s + (META[id].chars || 0), 0))[0];
    reset(); where(file); M.SRCH.okAll = false; mount({ q: 'compassion', c: String(small.i) }); const done = await until(() => /searched/.test(st.innerHTML)); M.SRCH.token++;
    const readable = M.LIB.filter((l) => META[l.id] && l.group !== 'my' && !/^u-/.test(l.id)).length; const seen = small.ids.filter((id) => M.LIB.some((l) => l.id === id && l.group !== 'my')).length;
    ok('count: a search says how many of the readable texts it covered, with the count Methods uses (' + N(seen) + ' of the ' + N(readable) + ')', done && st.innerHTML.includes('searched ' + N(seen) + ' of the ' + N(readable) + ' readable texts in '), st.innerHTML.slice(0, 260));
    ok('count: the number is the one Methods and standards counts (methCounts over the Library and the texts this copy can read)', readable === require('../src/js/2z-methods-core.js').methCounts({ lib: M.LIB, readable: Object.keys(META) }).readable && readable > 1000, readable);
  }
  { const lib = [{ id: 'a', group: 'x' }, { id: 'b', group: 'x' }, { id: 'u-1', group: 'my' }, { id: 'c', group: 'my' }]; const k = require('../src/js/2z-methods-core.js').methCounts({ lib, readable: ['a', 'u-1', 'c', 'zz'] });
    ok('count: methCounts counts only the Library\'s own texts: a text of your own (u-… or the group my) is not one of them', k.readable === 1 && k.texts === 2, k); }

  /* ═══ Common ground: the count looks at each text and lets it go, stops before the page runs out of memory, and keeps nothing from half a count ═══ */
  { const smallIds = M.LIB.filter((l) => META[l.id] && fs.existsSync(path.join(root, 'texts', l.id + '.js'))).sort((a, b) => META[a.id].chars - META[b.id].chars).slice(0, 10).map((l) => l.id); const smallMeta = {}; smallIds.forEach((id) => { smallMeta[id] = META[id]; });
    let click = null; const prog = { textContent: '' }; const btn = { disabled: false, lastChild: { textContent: '' }, addEventListener(t, f) { if (t === 'click') click = f; } }; const node = () => ({ innerHTML: '', textContent: '', value: '', style: {}, addEventListener() {}, querySelector: () => ({ textContent: '' }) });
    const mountC = () => { click = null; prog.textContent = ''; btn.disabled = false; globalThis.__q = { '#cgScan': btn, '#cgProg': prog }; const pbody = Object.assign(node(), { querySelector: () => node() }); const rt = { innerHTML: '', querySelector: (s) => (s === '#pbody' ? pbody : node()), addEventListener() {}, removeEventListener() {} }; M.Pages.path.mount(rt, ['common'], {}); };
    const savedIndex = M.TXT.index; M.TXT.index = () => Promise.resolve(smallMeta);
    reset(); where(file); M.store.del('common.words'); mountC(); await click(); const counted = M.store.get('common.words', null);
    ok('common ground: from a file the count reads each of the ' + smallIds.length + ' texts once as a script, lets each go, and saves the count', counted && counted.n === smallIds.length && /^Counted just now across /.test(prog.textContent) && scriptLog.length === smallIds.length && Object.keys(BEATLAB_TEXTS.data).length === 0 && btn.disabled === false, { counted, prog: prog.textContent, scripts: scriptLog.length });
    reset(); where(web); M.store.del('common.words'); mountC(); await click(); const counted2 = M.store.get('common.words', null);
    ok('common ground: on a website the same count reads each text as data (fetch), with nothing kept, and gives the same rows', counted2 && fetchLog.length === smallIds.length && scriptLog.length === 0 && Object.keys(BEATLAB_TEXTS.data).length === 0 && JSON.stringify(counted2.rows) === JSON.stringify(counted.rows), { f: fetchLog.length, s: scriptLog.length });
    reset(); where(file); M.store.del('common.words'); mountC(); const g = growing(1e9); await click(); plain();
    ok('common ground: on a heap that grows past 2.5 GB the count stops, says so in one line, and saves nothing (half a count is another count)', /^Stopped after \d+ of \d+ texts to keep your browser running, so nothing was kept: the count needs every text\./.test(prog.textContent) && M.store.get('common.words', null) === null && btn.disabled === false && g.started() < smallIds.length, prog.textContent);
    ok('common ground: from a file the line adds why (the browser holds on to each text it reads) and that reloading frees the memory', /holds on to each text it reads/.test(prog.textContent) && /reloading the page frees the memory\.$/.test(prog.textContent));
    reset(); where(web); M.store.del('common.words'); mountC(); const g2 = growing(1e9); await click(); plain();
    ok('common ground: on a website the stop line has no sentence about folders', /^Stopped after/.test(prog.textContent) && !/folder|reloading/i.test(prog.textContent), prog.textContent);
    M.TXT.index = savedIndex; M.store.del('common.words'); globalThis.__q = {}; }

  /* ═══ parallels: the texts are looked at and let go of, and the passages come out the same either way ═══ */
  { const have = (id) => META[id] && fs.existsSync(path.join(root, 'texts', id + '.js')); const P = M.PARALLELS.slice().sort((a, b) => b.items.filter((i) => have(i[0])).length - a.items.filter((i) => have(i[0])).length)[0];
    const ids = [...new Set(P.items.map((x) => x[0]))].filter(have);
    reset(); where(file); const r1 = await M.resolveParallel(P); const open1 = ids.filter((id) => BEATLAB_TEXTS.data[id]).length; const scripts1 = scriptLog.length;
    ok('parallels: from a file each text of a set is read once as a script and let go of (' + P.id + ', ' + ids.length + ' texts, ' + r1.thread.items.length + ' passages)', r1.thread.items.length > 0 && open1 === 0 && scripts1 === ids.length, { items: r1.thread.items.length, open: open1, scripts: scripts1, want: ids.length });
    reset(); where(web); const r2 = await M.resolveParallel(P); const key = (r) => JSON.stringify(r.thread.items.map((i) => [i.tid, i.s, i.p, i.a, i.b, i.q, i.sh]));
    ok('parallels: on a website the same set is fetched as data, nothing is kept, and the passages are identical (same words, places and headings)', fetchLog.length === ids.length && scriptLog.length === 0 && ids.every((id) => !BEATLAB_TEXTS.data[id]) && key(r1) === key(r2) && r1.missing === r2.missing, { f: fetchLog.length, same: key(r1) === key(r2) });
    { const stubId = 'zz-test-open'; BEATLAB_TEXTS.add(stubId, { title: 'T', by: 'x', license: 'x', src: '', chars: 99, n: 1 }, [['One', 'Before the words. open text kept as it was, and the rest of this old prayer goes on.']]); const P2 = { id: 'x', title: 'x', blurb: 'x', theme: 'x', items: [[stubId, 'open text kept as it was', 'A', 60]], links: [] }; reset2(); const r3 = await M.resolveParallel(P2);
      ok('parallels: a text that is already open (the reader has it) is used where it is and stays open', r3.thread.items.length === 1 && !!BEATLAB_TEXTS.data[stubId] && fetchLog.length === 0 && scriptLog.length === 0); delete BEATLAB_TEXTS.data[stubId]; delete BEATLAB_TEXTS.meta[stubId]; }
    function reset2() { fetchLog.length = 0; scriptLog.length = 0; } }

  /* ═══ the other loops, read out of the sources ═══ */
  { const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[\s;,{}])\/\/[^\n]*/g, '$1');
    const between = (f, a, b) => { const s = src(f); const i = s.indexOf(a); const j = s.indexOf(b, i + 1); return i >= 0 && j > i ? s.slice(i, j) : ''; };
    const loops = { 'the search (6m-search.js)': src('6m-search.js'), 'Common ground (6o-common.js)': src('6o-common.js'), 'parallels (resolveParallel in 6l-threads.js)': between('6l-threads.js', 'async function resolveParallel', 'function pathParallelsView'), 'Gather readings (pickReadingFor in 6h-gather.js)': between('6h-gather.js', 'async function pickReadingFor', 'async function serviceFromTemplate'), 'the Wander start (wanderRandomStart in 6x-wander.js)': between('6x-wander.js', 'async function wanderRandomStart', 'async function pathWanderView') };
    const bad = Object.entries(loops).filter(([k, s]) => !s || /TXT\.load\(|TXT\.unload\(/.test(strip(s)) || !/TXT\.scan\(/.test(strip(s))).map(([k]) => k);
    ok('loops: the search, Common ground, parallels, Gather readings and the Wander start look at a text through TXT.scan, and none holds one with TXT.load or lets one go by hand', bad.length === 0, bad);
    ok('loops: the two that read many texts (the search, Common ground) ask the heap guard after each one', /TXT\.heapOver\(\)/.test(strip(loops['the search (6m-search.js)'])) && /TXT\.heapOver\(\)/.test(strip(loops['Common ground (6o-common.js)'])));
    ok('loops: what a loop keeps of a passage is a copy of its own words (not a slice that holds the whole section): parallels, Gather and Wander copy with srchOwnStr', ['parallels (resolveParallel in 6l-threads.js)', 'Gather readings (pickReadingFor in 6h-gather.js)', 'the Wander start (wanderRandomStart in 6x-wander.js)'].every((k) => /srchOwnStr\(/.test(loops[k])));
    /* the places that still load a text with TXT.load, and why: Random (one text for each draw, kept so the next draw and the reader's context open at once), the reader (the text that is open), Find similar (it records what it loaded and lets those go itself: SIMX.drop),
       and the two clicks in Gather that pick one book from a list (one text for each click). A place that is not on this list and loads texts one after another should use TXT.scan. */
    const users = {}; fs.readdirSync(dir).filter((f) => /\.js$/.test(f)).forEach((f) => { const n = (strip(src(f)).match(/TXT\.load\(/g) || []).length; if (n) users[f] = n; });
    const allowed = ['6c-texts.js', '6d-passage.js', '6h-gather.js', '6k-reader.js', '6u-similar.js'];
    ok('loops: only the known places load a text with TXT.load (a new loop over many texts should use TXT.scan, or be added here with its reason)', Object.keys(users).every((f) => allowed.includes(f)), users);
    /* a lost connection is not a missing folder (AA-07), in the two files this round touched */
    const stripCalls = (code) => { let out = ''; let i = 0; while (i < code.length) { const j = code.indexOf('loadFailText(', i); if (j < 0) { out += code.slice(i); break; } out += code.slice(i, j); let k = j + 13; let depth = 1; let q = null; while (k < code.length && depth > 0) { const c = code[k]; if (q) { if (c === '\\') k++; else if (c === q) q = null; } else if (c === "'" || c === '"') q = c; else if (c === '(') depth++; else if (c === ')') depth--; k++; } i = k; } return out; };
    const left = {}; ['6l-threads.js', '6o-common.js', '6x-wander.js'].forEach((f) => { const hits = stripCalls(strip(src(f))).split('\n').filter((l) => /\bfolder\b/i.test(l) && !/=== 'file'/.test(l)); if (hits.length) left[f] = hits.map((l) => l.trim().slice(0, 100)); });
    ok('AA-07: nothing in the parallels page, Common ground or Wander says "folder" on its own (it goes through loadFailText, or is shown only from a file)', Object.keys(left).length === 0, left); }

})().catch((e) => { console.log('CRASH', e && e.stack || e); process.exit(2); }).then(() => { console.log(`alpha-fixes-c: ${pass} passed, ${fail} failed`); if (fail) process.exit(1); });
