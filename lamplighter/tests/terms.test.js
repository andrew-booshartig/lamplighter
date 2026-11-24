// Run: node tests/terms.test.js — Word help: the glossary words that the reader and the passage page underline (src/js/2z-terms-core.js, 6zw-words.js, paraHTML in 2p-marks-core.js).
// The glossary data is held to its rules (no two entries claim a name, scopes name real texts, patterns match no ordinary English word); the finder is run on the passage a reader
// pasted, on spellings taken from real scans of the Pahlavi books, and on every text of the Zoroastrian group when the texts folder is built.
const fs = require('fs'); const path = require('path'); const vm = require('vm');
const L = require('../src/js/2z-lookup-core.js'); Object.assign(globalThis, L);
const T = require('../src/js/2z-terms-core.js'); Object.assign(globalThis, { trmFind: T.trmFind });
const MK = require('../src/js/2p-marks-core.js'); Object.assign(globalThis, MK);
const R = require('../src/js/2z-reading-core.js');
const { GLOSSARY, GLOSS_TRADS } = require('../src/js/2o-glossary.js');
const { M } = require('./_harness.js');
let pass = 0; let fail = 0; const ok = (n, c, x = '') => { if (c) pass++; else { fail++; console.log('FAIL', n, typeof x === 'string' ? x : JSON.stringify(x).slice(0, 400)); } };
const IR = { id: 'x-pah', group: 'ir' }; const HB = { id: 'b-gen', group: 'hb' };
const ixIR = T.trmIndex(GLOSSARY, IR); const ixHB = T.trmIndex(GLOSSARY, HB);
const found = (text, ix = ixIR, o = {}) => T.trmFind(text, ix, o).map((f) => `${text.slice(f.a, f.b)}=${GLOSSARY[f.k][0]}`);
const one = (text, ix = ixIR) => { const r = T.trmFind(text, ix, {}); return r.length === 1 ? GLOSSARY[r[0].k][0] : r.length ? 'MANY:' + found(text, ix).join('|') : ''; };

/* ── the data ── */
const KEYS = ['also', 'like', 'at', 'plain', 'in', 'see', 'mark'];
const withOpts = GLOSSARY.filter((g) => g.length > 5);
ok('an entry has five fields and, if it carries more, a sixth that is a plain object using only the known keys', GLOSSARY.every((g) => g.length === 5 || (g.length === 6 && g[5] && typeof g[5] === 'object' && !Array.isArray(g[5]) && Object.keys(g[5]).every((k) => KEYS.includes(k)))), GLOSSARY.filter((g) => g.length === 6 && !(g[5] && Object.keys(g[5]).every((k) => KEYS.includes(k)))).map((g) => [g[0], Object.keys(g[5])]));
ok('also, like, at, plain, in and see are lists of short non-empty text (at most twenty-eight names, none longer than four words)', withOpts.every((g) => ['also', 'like', 'at', 'plain', 'in', 'see'].every((k) => g[5][k] === undefined || (Array.isArray(g[5][k]) && g[5][k].length <= 30 && g[5][k].every((s) => typeof s === 'string' && s.trim() && s.length <= 70)))) && withOpts.every((g) => T.trmList(g[5].also).concat(T.trmList(g[5].plain)).every((n) => L.luWords(n).length >= 1 && L.luWords(n).length <= T.TRM_MAXW)), withOpts.map((g) => g[0]).filter((t) => { const g = GLOSSARY.find((x) => x[0] === t); return !(['also', 'plain'].every((k) => T.trmList(g[5][k]).every((n) => L.luWords(n).length <= T.TRM_MAXW))); }));
ok('mark is only ever false', withOpts.every((g) => g[5].mark === undefined || g[5].mark === false));
ok('terms are unique, ignoring case', new Set(GLOSSARY.map((g) => g[0].toLowerCase())).size === GLOSSARY.length);
{ /* no two entries claim the same name (a term, another spelling or a plain English word) in the same text */
  const clash = []; for (const ctx of [IR, HB, { id: 'x-pah', group: 'ir' }, { id: 'p-1en-w', group: 'ps' }, { id: 'n-mat', group: 'nt' }]) {
    const claim = new Map(); GLOSSARY.forEach((g, k) => { if (g[5] && g[5].mark === false) return; if (!T.trmApplies(g, ctx)) return; T.trmNamesIn(g, ctx).forEach((n) => { const key = L.luKey(n); if (!key) return; if (!claim.has(key)) claim.set(key, new Set()); claim.get(key).add(k); }); });
    claim.forEach((ks, key) => { if (ks.size > 1) clash.push(ctx.group + ': ' + key + ' → ' + [...ks].map((k) => GLOSSARY[k][0]).join(' / ')); });
  }
  ok('no two entries claim the same name in the same text', clash.length === 0, clash.slice(0, 8));
}
{ const groups = new Set(M.LIB_GROUPS.map((x) => x[0])); const bad = [];
  withOpts.forEach((g) => ['at', 'in'].forEach((k) => T.trmList(g[5][k]).forEach((s) => { if (!(groups.has(s) || M.LIB_BY_ID[s])) bad.push(g[0] + '.' + k + ': ' + s); })));
  ok('at and in name real library groups or real text ids', bad.length === 0, bad.slice(0, 8)); }
ok('plain words come with the texts they apply to (in), and in is never without plain', withOpts.every((g) => (g[5].plain === undefined) === (g[5].in === undefined)), withOpts.filter((g) => (g[5].plain === undefined) !== (g[5].in === undefined)).map((g) => g[0]));
ok('see names entries that exist', withOpts.every((g) => T.trmList(g[5].see).every((s) => GLOSSARY.some((x) => x[0] === s))), withOpts.flatMap((g) => T.trmList(g[5].see).filter((s) => !GLOSSARY.some((x) => x[0] === s)).map((s) => g[0] + ' → ' + s)));
ok('every entry names traditions that exist', GLOSSARY.every((g) => g[4].every((id) => M.TRAD_BY_ID[id])) && GLOSS_TRADS.every((id) => M.TRAD_BY_ID[id]));
ok('meanings are plain text that ends with a full stop, a bracket or a quotation mark', GLOSSARY.every((g) => !/[<>{}]/.test(g[3]) && /[.)”]$/.test(g[3])), GLOSSARY.filter((g) => /[<>{}]/.test(g[3]) || !/[.)”]$/.test(g[3])).map((g) => g[0]));
ok('the Zoroastrian group has well over a hundred entries and they carry their spellings', GLOSSARY.filter((g) => g[4].includes('persia')).length >= 140 && withOpts.length >= 140);
{ /* the patterns for garbled spellings: plain character classes only, and none of them fits an ordinary English word */
  const pats = withOpts.flatMap((g) => T.trmList(g[5].like).map((src) => [g[0], src]));
  ok('every pattern compiles, is made of letters, classes, counts and "?" (and at most one look-ahead), and holds at least three fixed letters', pats.every(([, src]) => { try { new RegExp('^(?:' + src + ')$'); } catch (e) { return false; } return src.length <= 60 && /^[a-z0-9\[\]\{\},?*+\-^$!()=:|]*$/.test(src) && (src.match(/\(/g) || []).length <= 1 && src.replace(/\[[^\]]*\]\{?[0-9,]*\}?\??|\(\?[!=][^)]*\)/g, '').replace(/[?{}0-9,$]/g, '').length >= 3; }), pats.filter(([, s]) => s.length > 60));
  let dict = null; try { dict = fs.readFileSync('/usr/share/dict/words', 'utf8').split('\n'); } catch (e) { /* no system word list on this machine */ }
  if (dict) {
    const words = [...new Set(dict.map((w) => L.luNorm(w)).filter((w) => w.length >= 5 && !w.includes(' ')))]; const hits = [];
    const own = { Zarathustra: ['zarathustrian', 'zarathustrism', 'zardushti'] };      // real words for Zoroastrians and their religion, which the pattern is meant to find
    for (const [term, src] of pats) { const re = new RegExp('^(?:' + src + ')$'); const mine = new Set(L.luNames(GLOSSARY.find((x) => x[0] === term)).map((n) => L.luNorm(n)).concat(own[term] || [])); for (const w of words) if (re.test(w) && !mine.has(w)) hits.push(term + ' /' + src + '/ ~ ' + w); }
    ok('no pattern fits a word of the system word list (' + words.length + ' words): a garbled spelling is never confused with a real English word', hits.length === 0, hits.slice(0, 12));
  }
}

/* ── the finder ── */
{
  const bad = []; GLOSSARY.forEach((g, k) => {
    if (g[5] && g[5].mark === false) return; const ctx = g[5] && g[5].at ? { id: g[5].at.find((s) => M.LIB_BY_ID[s]) || '', group: g[5].at.find((s) => !M.LIB_BY_ID[s]) || '' } : IR; const ix = T.trmIndex(GLOSSARY, ctx);
    T.trmNamesIn(g, ctx).forEach((n) => { if ((L.luWords(n).join('').length <= 3 && !(g[5] && g[5].at)) || L.luWords(n).length > T.TRM_MAXW) return;      // a title of more than four words is a heading for the card, not a name in a text
      const r = T.trmFind('We read ' + n + ' there.', ix, {}); const h = r.find((x) => x.a === 8); if (!h || h.b !== 8 + n.length || h.k !== k) bad.push(g[0] + ' / ' + n + (h ? ' → ' + GLOSSARY[h.k][0] : ' not found')); });
  }); ok('every name of every entry is found whole, in a text where the entry applies (a name of three letters or fewer only where the entry says where)', bad.length === 0, bad.slice(0, 10));
}
{ /* a reader's own passage: Sad Dar, chapter 1, as it was pasted from the scan, errors and all */
  const passage = 'For it is declared in revelation, that the creator Hérmazd spoke to Zaratust thus: ‘O Zaratust! I have created no one better than thee in the world, and after thee I shal? likewise not create one. 3. And all! these people (‘ZalAiq) whom I have created, so that they should accept (qabdl kunand) the religion, and their souls should attain to the supreme heaven. 4. ‘ Nevertheless I have created ¢hee at the present time, in the middle period ; for it is three thousand years from the days of Gayémard till now, and from now till the resurrection are the three thousand years that remain. 5. In the same manner as the land of Zrdan® is more valuable than other lands. 6. And the country of ran, which is zm the fourth climate (iqlim)‘, is better than other places. 7. I have given thee the apostleship, and have sent ¢ee to a monarch. 8. I have taught zt to thee in the Avesta, and I have told thee its interpretation (zand). 14. Because Aharman, the evil wicked ove, has intrusted two fiends with this matter, the name of one is Tardy (dér) and the name of the other is Afterwards (pas). 1 Bzg omits ‘all.’ 2 B2g omits these twenty-five words.';
  const want = ['Hérmazd=Ahura Mazda', 'Zaratust=Zarathustra', 'supreme heaven=Garotman', 'Gayémard=Gayomard', 'three thousand years=Twelve thousand years', 'resurrection=Frashegird', 'Zrdan=Iran', 'climate=Climate', 'apostleship=Apostleship', 'Avesta=Avesta', 'zand=Zand', 'Aharman=Ahriman', 'fiends=Druj', 'Tardy=Tardy', 'Bzg=Manuscript letters in West’s notes'];
  const got = found(passage); ok('in the Zoroastrian group the passage’s names and terms are all found (first mention of each)', want.every((w) => got.includes(w)), want.filter((w) => !got.includes(w)));
  const gotHB = found(passage, ixHB); ok('in Genesis the same words are found only where they are not English words with another meaning here', ['Hérmazd=Ahura Mazda', 'Zaratust=Zarathustra', 'Gayémard=Gayomard', 'Avesta=Avesta', 'zand=Zand', 'Aharman=Ahriman'].every((w) => gotHB.includes(w)) && !gotHB.some((w) => /=(Climate|Apostleship|Tardy|Druj|Frashegird|Garotman|Twelve thousand years|Iran|Manuscript)/.test(w)), gotHB);
  const every = T.trmFind(passage, ixIR, {}); const first = T.trmFind(passage, ixIR, { seen: new Set() });
  ok('first mention marks each entry once, every mention marks each time', first.length < every.length && new Set(first.map((f) => f.k)).size === first.length && new Set(every.map((f) => f.k)).size === first.length, [first.length, every.length]);
  ok('the second “Zaratust” and “three thousand years” are marked in every-mention mode and not in first-mention mode', every.filter((f) => passage.slice(f.a, f.b) === 'Zaratust').length === 2 && first.filter((f) => passage.slice(f.a, f.b) === 'Zaratust').length === 1 && every.filter((f) => /thousand/.test(passage.slice(f.a, f.b))).length === 2 && first.filter((f) => /thousand/.test(passage.slice(f.a, f.b))).length === 1);
}
ok('spans never overlap, stay inside the text and are in reading order', (() => { const t = 'Hérmazd and Aharman, Gayémard and Mazda-worshippers; the Chinvat Bridge, Kai-Vistasp’s Zaratust’s Zand.'; const r = T.trmFind(t, ixIR, {}); return r.every((f, i) => f.a >= 0 && f.b <= t.length && f.b > f.a && (i === 0 || r[i - 1].b <= f.a)); })());
ok('a name made of several words is found whole, across a space or a hyphen and not across punctuation', found('the Chinvat Bridge today').join() === 'Chinvat Bridge=Chinvat Bridge' && found('the Mazda-worshippers').join() === 'Mazda-worshippers=Mazdayasnian' && found('King Kai-Vistasp came').join() === 'Kai-Vistasp=Vishtaspa' && found('Chinvat, Bridge').join() === 'Chinvat=Chinvat Bridge' && found('Ein Sof and Tikkun olam', ixHB).join('|') === 'Ein Sof=Ein Sof|Tikkun olam=Tikkun olam');
ok('a possessive marks the name and not the “’s”; a plural finds the singular', (() => { const t = 'Zaratust’s Nasks and Zaratust\'s Nask'; const r = T.trmFind(t, ixIR, {}); return r.length === 4 && t.slice(r[0].a, r[0].b) === 'Zaratust' && t.slice(r[1].a, r[1].b) === 'Nasks' && t.slice(r[2].a, r[2].b) === 'Zaratust'; })());
ok('a name of three letters or fewer is only marked where its entry says where: Om in Hindu texts, never De, Me or Li', one('We chant Om here.', T.trmIndex(GLOSSARY, { id: 'x-bgi', group: 'in' })) === 'Om' && one('We chant Om here.', ixHB) === '' && one('De Civitate Dei, Me, Li and ME.', T.trmIndex(GLOSSARY, { id: 'x-ave', group: 'ch' })) === '');
ok('words that are English or another language elsewhere are not marked outside the group where they mean this', one('grace of God', ixHB) === '' && one('Grace of God', T.trmIndex(GLOSSARY, { id: 'n-rom', group: 'nt' })) === 'Grace' && one('Yatha means as', ixHB) === '' && one('Daitya demons and Homa fire', ixHB) === '' && one('Yatha ahu vairyo', ixHB) === 'Ahuna Vairya' && one('the Yatha prayer', ixIR) === 'Ahuna Vairya' && one('Sudra and Mitra and Dev and Adar and Drug and Nasa', ixIR) === '');
ok('the Persian words of the old translations that would be English words outside them are marked only inside: Bahman, Bahram, Aban, Hom', one('King Bahman', ixHB) === '' && one('King Bahman', ixIR) === 'Vohu Manah' && one('Bahram Gur', ixHB) === '' && one('Hom', ixHB) === '' && one('the Hom juice', ixIR) === 'Haoma');
{ /* spellings from real scans of West’s Pahlavi Texts and the Avesta translation: the same name garbled in many ways */
  const real = { 'Ahura Mazda': ['Hérmazd', 'Hormazd', 'Atharmazd', 'Athaymazd', 'Atthaymazd', 'Adhaymazd', 'Afthaymazd', 'Atharymazd', 'Atharvmazd', 'Adharmazd', 'Aftharmazd', 'Attharmazd', 'Afharmazd', 'Aflharmazd', 'Afiharmazd', 'Aihaymazd', 'Adthaymazd', 'Atharmagzd', 'Aûharmazd', 'Auharmazd', 'Aühazmazd', 'Aühazmaz', 'Aühazmazz', 'Ormazd', 'Ormuzd'],
    Zarathustra: ['Zaratust', 'Zaratüst', 'Zaratûst', 'Zaratist', 'Zarattist', 'Zaratfist', 'Zaratdst', 'Zarattst', 'Zaratiist', 'Zaratast', 'Zaratu', 'Zaraturt', 'Zaratujt', 'Zaratfot', 'Zartust', 'Zarathujtra', 'Zarathiutra', 'Zarathmtra', 'Zarathurtra', 'Zarathuitra', 'Zarathu', 'Zoroaster'],
    Ahriman: ['Aharman', 'Ahriman', 'Ahereman', 'Aherman'], Gayomard: ['Gayémard', 'Gayomard', 'Gayoman', 'Gaydemard', 'GAyémard', 'Gâyômard'], 'Chinvat Bridge': ['Kinvad', 'Ainvad', 'Xinvad', 'Chinvat', 'Kinvat'],
    Dastur: ['Dastir', 'Dastfir', 'Dasttir', 'Dasttr', 'Dastfr', 'Dastair', 'Dastdir', 'Dastur', 'Dastftr', 'Dasttir'], Bareshnum: ['Bareshnum', 'Bareshnim', 'Bareshniim', 'Bareshnfim', 'Bareshntim', 'Bareshnom'],
    Saoshyant: ['Soshyans', 'Sdshans', 'Sdéshans', 'Séshans', 'Sósháns', 'Hushedar', 'HusheWar', 'Aüshédar', 'Aüshézar', 'Aüshégar', 'Saoshya'], Sraosha: ['Srosh', 'Srésh', 'Srdsh', 'Srdesh'], Rashnu: ['Rashn', 'Rashnu', 'Rashnd'],
    'Vohu Manah': ['Vohuman', 'Vohiman', 'Vohfiman', 'Vohtman', 'Vohtiman', 'Vohümanó'], Bundahishn: ['Bundahis', 'Bundahij', 'Bundahlr', 'Bundahly', 'Bundahls', 'Bundahu'], Manushchihar: ['Manuskihar', 'Mânûskîhar', 'Manoskihar', 'Manuoskihar', 'Mantsihar', 'Mantskihar', 'Manisfihar', 'Manuszihar'],
    Garotman: ['Garédman', 'Garddman', 'Garodman', 'Garothman', 'Garothmane'], Thraetaona: ['Frédin', 'Fredun', 'Frégün', 'Frédfin', 'Frédtin', 'Frewun'], Vishtaspa: ['Vistásp', 'Vistasp', 'Gustásp', 'Gushtasp', 'Vutaspa', 'Vistaspa'], Pourushaspa: ['Pórüsháspó', 'Porushaspo', 'Pourushaspa'],
    Keresaspa: ['Keresasp', 'Keresdsp', 'Keresdspa', 'Keresaspa'], Hamistagan: ['Hamistakan', 'Hamistak4n'], Dinkard: ['Dinkard', 'Dinkavd', 'Dinkarvd', 'Dinkan'], 'Spenta Armaiti': ['Spendarmad', 'Spendaymad', 'Spandarmad'], Tishtrya: ['Tistar', 'Tishtar', 'Tlstar', 'Tfotar'], Anahita: ['Ardvi', 'Aredvivsur', 'Arédvisür'], Verethragna: ['Vahrém', 'Vahrom'], 'Asha Vahishta': ['Ashavahistó', 'Ashavahist', 'Ardibahist'], Tanapuhar: ['Tanapuhar', 'Tanápühar'] };
  const bad = []; for (const [want, forms] of Object.entries(real)) for (const f of forms) { const r = one('the ' + f + ' said', ixIR); if (r !== want) bad.push(f + ' → ' + (r || 'nothing') + ' (wanted ' + want + ')'); }
  ok('a hundred and more spellings found in the scans, garbled ones included, are each marked as the right entry', bad.length === 0, bad.slice(0, 12));
}
ok('ordinary English words that look a little like a garbled name are left alone', ['Spending', 'Tartar', 'Rashness', 'Frederick', 'Dastard', 'Dastar', 'Gaylord', 'Zaratite', 'Zarate', 'Parson', 'Fargo', 'Tanager', 'Vohn', 'Freedom', 'Fredrick', 'Hushed', 'Vistas', 'Manichee', 'Ahrens', 'Gayety', 'Keresley', 'Sraddha'].every((w) => one('The ' + w + ' came.', ixIR) === '' || (console.log('  false positive:', w, one('The ' + w + ' came.', ixIR)), false)));
ok('a hostile or odd text is no trouble: empty, tiny, huge, no letters, markup, and a glossary of nothing', ['', ' ', 'a', '123 456', '<script>alert(1)</script>', '«»…—', 'x'.repeat(50000), 'Zaratust '.repeat(2000)].every((t) => Array.isArray(T.trmFind(t, ixIR, {}))) && T.trmFind('Zaratust', null, {}).length === 0 && T.trmFind(null, ixIR, {}).length === 0 && T.trmFind('Zaratust', T.trmIndex([], IR), {}).length === 0 && T.trmFind('Zaratust', T.trmIndex(null, IR), {}).length === 0);
{ /* a highlight takes the word: it is not marked and is not counted, so the next mention is */
  const t = 'Aharman first and Aharman again'; const seen = new Set(); const r = T.trmFind(t, ixIR, { seen, skip: [[0, 7]] });
  ok('a word inside a highlight is left to the highlight, and the next mention is the one that is marked', r.length === 1 && r[0].a === 18, r);
}
ok('one pass over a long text is quick (ten thousand sentences)', (() => { const t = 'In the days of Aûharmazd the fiends of Aharman and the Mazda-worshippers went to the climate of Iran. '.repeat(10000); const t0 = Date.now(); const r = T.trmFind(t, ixIR, {}); return r.length > 0 && Date.now() - t0 < 4000; })());

/* ── what the page prints ── */
{
  const tm = { ix: ixIR, seen: new Set() };
  const raw = '[[1]] In the beginning Hérmazd made the light; [[2]] and Hérmazd saw it; <b>fiends</b> & the climate.';
  const html = paraHTML(raw, { terms: tm });
  ok('paraHTML wraps each marked word in a span that opens the card, and keeps verse numbers and escaping', /<sup class="vn">1<\/sup>/.test(html) && /<sup class="vn">2<\/sup>/.test(html) && (html.match(/<span class="gt" data-k="\d+" role="button" tabindex="0" aria-haspopup="dialog">/g) || []).length === 3 && html.includes('&lt;b&gt;') && html.includes('&amp;') && !/<b>/.test(html), html);
  ok('the marks are first-mention: the second Hérmazd is plain text', (html.match(/>Hérmazd</g) || []).length === 1 && (html.match(/Hérmazd/g) || []).length === 2);
  const strip = (h) => h.replace(/<sup class="vn">\d+<\/sup>/g, '').replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"');
  ok('taking the marks away leaves exactly the visible text', strip(html) === visibleText(raw).replace(/^/, ''), strip(html));
  const plain = paraHTML(raw, {}); ok('without Word help the page is as it always was', !/class="gt"/.test(plain) && strip(plain) === strip(html));
  const vis = visibleText(raw); const a = vis.indexOf('Hérmazd'); const hl = [{ id: 'h1', a, b: a + 7, c: 'gold' }];
  const withHl = paraHTML(raw, { hls: hl, terms: { ix: ixIR, seen: new Set() } });
  ok('a highlighted word keeps its highlight and is not also marked; the next mention takes the mark', /<span class="hl hl-gold" data-h="h1">Hérmazd<\/span>/.test(withHl) && (withHl.match(/class="gt"/g) || []).length === 3 && />Hérmazd<\/span><\/span>/.test(withHl) === false, withHl);
  const inside = paraHTML('The fiends of Aharman.', { find: 'end', terms: { ix: ixIR, seen: new Set() } });
  ok('a search hit inside a marked word nests properly (balanced tags, the same words)', strip(inside) === 'The fiends of Aharman.' && (inside.match(/<mark>/g) || []).length === 1 && (inside.match(/<\/mark>/g) || []).length === 1 && (inside.match(/<span/g) || []).length === (inside.match(/<\/span>/g) || []).length, inside);
  const quote = paraHTML('He said "Aharman" and ’Zaratust’ in the “Avesta”.', { terms: { ix: ixIR, seen: new Set() } }); ok('quotation marks around a name stay outside it and cannot break the markup', strip(quote) === 'He said "Aharman" and ’Zaratust’ in the “Avesta”.' && (quote.match(/data-k="\d+"/g) || []).length === 3 && />Aharman</.test(quote) && />Zaratust</.test(quote), quote);
  const sections = ['Aharman', 'Hérmazd', 'Zand'].map((w) => paraHTML(w, { terms: { ix: ixIR, seen: new Set() } })); ok('each section starts again: the first mention in every section is marked', sections.every((s) => /class="gt"/.test(s)));
}
{ /* the reader and the passage page, against the stub page */
  const tm = M.wordsFor('x-pah'); ok('Word help is on by default for a text, with first mentions only', tm && tm.every === false && tm.ix.names.size > 500);
  const html = M.readerHTML('the fourth climate of Hérmazd and Hérmazd', undefined, tm); ok('the passage page marks words in a text of the Zoroastrian group', (html.match(/class="gt"/g) || []).length === 2 && !/class="gt"[^>]*>Hérmazd<\/span> and Hérmazd/.test(html) === false);
  ok('and not the words that are ordinary English in a text of another group', (M.readerHTML('the fourth climate of Hérmazd', undefined, M.wordsFor('b-gen')).match(/class="gt"/g) || []).length === 1);
  ok('without a context nothing is marked', !/class="gt"/.test(M.readerHTML('Hérmazd', undefined, null)) && !/class="gt"/.test(M.readerHTML('Hérmazd')));
  M.store.set('reading.prefs', { help: 'off' }); ok('turned off in the Aa panel, no text is marked', M.wordsFor('x-pah') === null && !/class="gt"/.test(M.readerHTML('Hérmazd', undefined, M.wordsFor('x-pah'))));
  M.store.set('reading.prefs', { help: 'every' }); const ev = M.wordsFor('x-pah'); ok('every mention marks every time', ev && ev.every === true && (M.readerHTML('Hérmazd and Hérmazd', undefined, ev).match(/class="gt"/g) || []).length === 2);
  M.store.set('reading.prefs', null);
}
ok('the Aa panel’s Word help setting is a short fixed list and anything else becomes the default', Object.keys(R.RT_HELP).join() === 'first,every,off' && R.RT_DEFAULT.help === 'first' && R.rtClean({ help: 'every' }).help === 'every' && R.rtClean({ help: 'off' }).help === 'off' && ['', 'x', '__proto__', 'constructor', 'toString', 5, null, {}, ['off']].every((v) => R.rtClean({ help: v }).help === 'first') && R.RT_EASY.help === 'first');
{ const src = (f) => fs.readFileSync(path.join(__dirname, '../src/js', f), 'utf8'); const css = fs.readFileSync(path.join(__dirname, '../src/css/app.css'), 'utf8');
  ok('the Aa panel offers the choice, the paged view lets a word be tapped without turning the page, and the style sheet draws the marks and the card', /seg\('help', 'Word help'/.test(src('6kr-reading.js')) && /\.hl,\.gt,/.test(src('6ka-paged.js')) && /\.tcard,\.gt|\.gt\b/.test(src('6ka-paged.js')) && /\.gt\{/.test(css) && /\.tcard\{/.test(css) && /@media print\{\.tcard/.test(css));
  ok('Word help sends nothing anywhere: the word card file has no network call and builds its outside links only from the fixed look-up function', !/\b(fetch|XMLHttpRequest|WebSocket|sendBeacon|navigator\.sendBeacon|importScripts)\b/.test(src('6zw-words.js')) && !/\b(fetch|XMLHttpRequest|WebSocket|sendBeacon)\b/.test(src('2z-terms-core.js')) && /luLinks\(/.test(src('6zw-words.js')));
}

/* ── the real texts ── */
const dir = path.join(__dirname, '../../texts');
if (fs.existsSync(path.join(dir, 'x-pah.js'))) {
  const secsOf = (id) => { let got = null; vm.runInNewContext(fs.readFileSync(path.join(dir, id + '.js'), 'utf8'), { BEATLAB_TEXTS: { add(i, m, s) { got = s; }, addIndex() {} } }, { filename: id }); return got; };
  const names = (g, ctx) => T.trmNamesIn(g, ctx).map(L.luKey); const rows = [];
  for (const id of ['x-pah', 'x-bun', 'x-ave']) {
    const secs = secsOf(id); const ctx = { id, group: M.LIB_BY_ID[id].group }; const ix = T.trmIndex(GLOSSARY, ctx); let spans = 0; let unjustified = 0; let bad = 0; let overlap = 0; let marksEvery = 0; let marksFirst = 0; const used = new Set(); const t0 = Date.now(); const why = [];
    for (const [, body] of secs) {
      const seen = new Set();
      for (const blk of body.split(/\n{2,}/)) {
        const vis = blk.replace(/^## /, '').replace(/\[\[\d+\]\]/g, ''); const r = T.trmFind(vis, ix, {}); marksEvery += r.length; marksFirst += T.trmFind(vis, ix, { seen }).length;
        r.forEach((f, i) => { spans++; used.add(f.k); const g = GLOSSARY[f.k]; const txt = vis.slice(f.a, f.b); if (!(f.a >= 0 && f.b <= vis.length && f.b > f.a)) bad++; if (i && r[i - 1].b > f.a) overlap++;
          const justified = names(g, ctx).includes(L.luKey(txt)) || (L.luWords(txt).length === 1 && T.trmList(g[5] && g[5].like).some((src) => new RegExp('^(?:' + src + ')$').test(L.luNorm(txt)))); if (!justified) { unjustified++; if (why.length < 5) why.push(txt + ' → ' + g[0]); } });
      }
    }
    rows.push(`${id}: ${marksEvery} marks, ${used.size} entries, ${Date.now() - t0} ms`);
    ok(`${id}: every marked span is a name of its entry or fits one of its patterns, spans are inside the text and never overlap`, spans > 1000 && unjustified === 0 && bad === 0 && overlap === 0, why.concat([spans, unjustified, bad, overlap]));
    ok(`${id}: first-mention mode marks fewer words than every-mention mode, and a good many of the entries are used`, marksFirst < marksEvery && marksFirst > 100 && used.size >= 100, [marksFirst, marksEvery, used.size]);
    ok(`${id}: the whole text is read in a few seconds`, Date.now() - t0 < 20000, Date.now() - t0);
  }
  /* a spread of texts outside the group: marked lightly, and never with the English-word entries */
  const sample = ['b-gen', 'n-mat', 'n-rom', 'x-qur', 'x-bgi', 'x-dha', 'x-tao', 'b-psa'].filter((id) => fs.existsSync(path.join(dir, id + '.js')) && M.LIB_BY_ID[id]);
  let words = 0; let marks = 0; const forms = new Map();
  for (const id of sample) { const ix = T.trmIndex(GLOSSARY, { id, group: M.LIB_BY_ID[id].group }); for (const [, body] of secsOf(id)) { const seen = new Set(); for (const blk of body.split(/\n{2,}/)) { const vis = blk.replace(/^## /, '').replace(/\[\[\d+\]\]/g, ''); words += vis.length / 6; T.trmFind(vis, ix, { seen }).forEach((f) => { marks++; const k = GLOSSARY[f.k][0]; forms.set(k, (forms.get(k) || 0) + 1); }); } } }
  ok(`outside the Zoroastrian group, ${sample.length} sample texts are marked lightly (under 4 words in a thousand, first mentions)`, sample.length >= 3 && marks / (words / 1000) < 4, [marks, Math.round(words), [...forms.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)]);
  ok('and none of the Zoroastrian group’s English-word entries (climate, fiend, apostleship, resurrection) is marked in them', !['Climate', 'Apostleship', 'Frashegird', 'Druj', 'Tardy', 'High-priest', 'Kine'].some((t) => forms.has(t)), [...forms.keys()]);
  console.log('  ' + rows.join(' | '));
}
console.log(`terms: ${pass} passed, ${fail} failed (${GLOSSARY.length} entries, ${withOpts.length} with spellings or scopes)`); process.exit(fail ? 1 : 0);
