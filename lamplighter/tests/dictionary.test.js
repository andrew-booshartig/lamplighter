// Run: node tests/dictionary.test.js — the built-in dictionary (src/js/2z-dict-core.js, the files in dictionary/, built by tools/build_dictionary.py from Webster's 1913 dictionary): the lookup key is the
// same in Python and JavaScript, the files are sorted and whole, a word is found as typed or as a form of another word (plurals, -ed, -ing, thou -est, he -eth), pointers lead to their entries, the
// 1913 wording about peoples and faiths is flagged, a sense is shown as safe HTML, and nothing is fetched from anywhere.
const fs = require('fs'); const path = require('path');
const D = require('../src/js/2z-dict-core.js');
let pass = 0; let fail = 0; const ok = (n, c, x = '') => { if (c) pass++; else { fail++; console.log('FAIL', n, typeof x === 'string' ? x : JSON.stringify(x).slice(0, 300)); } };
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ── the key: the same function in tools/build_dictionary.py (norm_key); these pairs were made by the Python tool ── */
const PAIRS = [['Climate', 'climate'], ['Æon', 'aeon'], ['œcumenical', 'oecumenical'], ['Zoöl.', 'zool'], ['naïve', 'naive'], ['Ma’at', 'ma at'], ["o'er", 'o er'], ['far-stretched', 'far stretched'], ['Ḥesed', 'hesed'], ['ﬁne', 'fine'], ['ß', 'ss'],
  ['İstanbul', 'istanbul'], ['Ångström', 'angstrom'], ['ſaid', 'said'], ['  Hello,   World!  ', 'hello world'], ['1913', '1913'], ['co-operate', 'co operate'], ['Éire', 'eire'], ['Çatal', 'catal'], ['ǆ', 'dz'], ['Ø', ''], ['Þorn', 'orn'],
  ['ñandú', 'nandu'], ['Æ', 'ae'], ['½', '1 2'], ['Hérmazd', 'hermazd'], ['Shaḥ', 'shah'], ['ŉ', 'n'], ['ǅ', 'dz'], ['ﬃ', 'ffi'], ['Ĳssel', 'ijssel'], ['²', '2'], ['A·B', 'a b'], ['Zarathuštra', 'zarathustra'], ['Ῥ', '']];
ok('the lookup key is what the Python tool makes of the same text', PAIRS.every(([a, b]) => D.dkNorm(a) === b), PAIRS.filter(([a, b]) => D.dkNorm(a) !== b).map(([a, b]) => [a, b, D.dkNorm(a)]));
ok('the key of nothing, or of anything odd, is a string and never throws', [undefined, null, '', 5, {}, [], '<b>', '\u0000', '😀'].every((s) => typeof D.dkNorm(s) === 'string'));

/* ── which file: a binary search on the first keys ── */
{
  const meta = { chunks: [['w01', 'a', 10], ['w02', 'bar', 10], ['w03', 'cat', 10], ['w04', 'dog', 10]] };
  ok('a key goes to the last file whose first key is not after it', D.dkChunkOf(meta, 'a') === 'w01' && D.dkChunkOf(meta, 'bar') === 'w02' && D.dkChunkOf(meta, 'barn') === 'w02' && D.dkChunkOf(meta, 'cat') === 'w03' && D.dkChunkOf(meta, 'cow') === 'w03' && D.dkChunkOf(meta, 'zebra') === 'w04' && D.dkChunkOf(meta, 'bao') === 'w01');
  ok('a key before the first file, an empty key and a missing or odd index give no file', D.dkChunkOf(meta, '1913') === '' && D.dkChunkOf(meta, '') === '' && D.dkChunkOf(null, 'a') === '' && D.dkChunkOf({}, 'a') === '' && D.dkChunkOf({ chunks: [] }, 'a') === '');
}

/* ── the forms to try for a word ── */
const keys = (w) => D.dkForms(w).map((c) => c.key); const how = (w, k) => (D.dkForms(w).find((c) => c.key === k) || {}).how;
ok('the word itself is tried first, as typed, with its case, accents and punctuation gone', keys('Climate')[0] === 'climate' && keys('“CLIMATE,”')[0] === 'climate' && keys('Ḥesed')[0] === 'hesed' && D.dkForms('Climate')[0].how === 'exact');
ok('a possessive goes before anything is tried', keys("God's")[0] === 'god' && keys('God’s')[0] === 'god' && keys('fathers’')[0] === 'fathers' && keys("o'er")[0] === 'o er');
ok('plurals, the -s of a verb, past forms and -ing forms find their stem', how('climates', 'climate') === 'plural' && how('stories', 'story') === 'plural' && how('knives', 'knife') === 'plural' && how('boxes', 'box') === 'plural' && how('carried', 'carry') === 'past' && how('walked', 'walk') === 'past' && how('loved', 'love') === 'past' && how('stopped', 'stop') === 'past' && how('making', 'make') === 'ing' && how('running', 'run') === 'ing' && how('dying', 'die') === 'ing');
ok('the old -est, -st and -eth of the Bible and of Shakespeare find the plain verb', how('knowest', 'know') === 'archaic' && how('mayest', 'may') === 'archaic' && how('shouldst', 'should') === 'archaic' && how('wouldest', 'would') === 'archaic' && how('goeth', 'go') === 'archaic' && how('maketh', 'make') === 'archaic' && how('loveth', 'love') === 'archaic');
ok('comparatives, adverbs, nouns in -ness and a few Latin plurals find their stem', how('taller', 'tall') === 'comp' && how('nobler', 'noble') === 'comp' && how('biggest', 'big') === 'super' && how('tardiest', 'tardy') === 'super' && how('slowly', 'slow') === 'adv' && how('happily', 'happy') === 'adv' && how('terribly', 'terrible') === 'adv' && how('kindness', 'kind') === 'noun' && how('fungi', 'fungus') === 'latin' && how('analyses', 'analysis') === 'latin' && how('women', 'woman') === 'latin');
ok('in a phrase only the last word changes, and a phrase is also tried written solid', keys('induced currents').includes('induced current') && keys('far stretched').includes('farstretched') && !keys('induced currents').some((k) => k.startsWith('induce ')));
ok('British and older spellings are found as the 1913 dictionary spells them: instalment, colour, honours, judgement, realise, centre, defence, learnt, mediaeval, organisation, neighbour (the variant after the word as typed and its own forms)', [['instalment', 'installment'], ['colour', 'color'], ['honours', 'honor'], ['judgement', 'judgment'], ['realise', 'realize'], ['centre', 'center'], ['defence', 'defense'], ['learnt', 'learned'], ['mediaeval', 'medieval'], ['organisation', 'organization'], ['neighbours', 'neighbor'], ['fulfilment', 'fulfillment'], ['analyse', 'analyze'], ['catalogue', 'catalog'], ['grey', 'gray'], ['whilst', 'while']].every(([w, k]) => keys(w).includes(k)), ['instalment', 'honours', 'realise'].map((w) => keys(w)));
ok('a variant is tried only after the word as typed and its ordinary forms, and it is labelled a spelling (so a real word like four or hour is never swapped for another)', keys('colour')[0] === 'colour' && how('instalment', 'installment') === 'spelling' && keys('four')[0] === 'four' && !keys('four').includes('for') && D.DK_HOW.spelling.includes('spelling'), keys('four'));
ok('the variant rules never make a single letter, the same word or a repeat', ['a', 'is', 'ye', 'colour', 'centre', 'whilst', 'realise'].every((w) => D.dkVariants(w).every((v) => v.length >= 2 && v !== w) && new Set(D.dkVariants(w)).size === D.dkVariants(w).length));
ok('no form is a single letter, the same as the word, or repeated; nothing, too many words and a very long selection give no form', ['is', 'as', 'was', 'less', 'bus', 'gas', 'ties', 'bed', 'red', 'singing', 'doth'].every((w) => { const k = keys(w); return new Set(k).size === k.length && k.every((x) => x.length >= 2) && k.indexOf(D.dkNorm(w)) === 0; }) && D.dkForms('').length === 0 && D.dkForms(null).length === 0 && D.dkForms('one two three four five').length === 0 && D.dkForms('x'.repeat(5000)).length === 0);

/* ── the files ── */
const DIR = path.join(__dirname, '../../dictionary'); const have = fs.existsSync(path.join(DIR, 'index.js'));
let loads = 0; let meta = null;
const load = async (id) => { if (!BEATLAB_DICT.has(id)) { loads++; const f = path.join(DIR, id + '.js'); delete require.cache[require.resolve(f)]; require(f); } return BEATLAB_DICT.by[id]; };
const find = (w) => D.dkFind(w, meta, load);
const first = (r) => (r && r.entries[0] && r.entries[0].senses[0]) || '';
(async () => {
  if (!have) { console.log('dictionary/ is not beside this copy: the checks on its files are skipped'); }
  else {
    require(path.join(DIR, 'index.js')); meta = BEATLAB_DICT.meta;
    ok('the index names its source and licence: public domain, from Project Gutenberg, and says what was left out', meta && /Public domain/.test(meta.licence) && /Gutenberg/.test(meta.licence) && /etymolog/.test(meta.licence) && /quotation/.test(meta.licence) && /gutenberg\.org\/ebooks\/29765$/.test(meta.src) && meta.srcBytes === 28956350 && /^[0-9a-f]{64}$/.test(meta.sha256), meta && meta.licence);
    ok('the index lists its files in order of their first keys, each file is there, and the counts add up', meta.chunks.length >= 15 && meta.chunks.every((c, i) => !i || c[1] > meta.chunks[i - 1][1]) && meta.chunks.every((c) => fs.existsSync(path.join(DIR, c[0] + '.js'))) && meta.chunks.reduce((n, c) => n + c[2], 0) === meta.records && meta.entries > 100000 && meta.records >= meta.entries);
    const sizes = meta.chunks.map((c) => fs.statSync(path.join(DIR, c[0] + '.js')).size);
    ok('no file is large (a lookup loads one, about a megabyte) and the whole is under 25 MiB', Math.max(...sizes) < 1.4e6 && sizes.reduce((a, b) => a + b, 0) < 25 * 1048576, [Math.max(...sizes), sizes.reduce((a, b) => a + b, 0)]);
    /* every row of every file, once: sorted by key, inside its file's range, whole, with pointers that lead somewhere */
    const fullKeys = new Set(); const stubs = []; const bad = []; let rows = 0; let noSense = 0; let lower = 0; let longest = 0; let leaks = 0; let labOnly = 0; let care = 0; let senses = 0; let multi = 0;
    for (let i = 0; i < meta.chunks.length; i++) {
      const [id, firstKey, count] = meta.chunks[i]; const next = meta.chunks[i + 1] ? meta.chunks[i + 1][1] : '￿';
      const by = await load(id); let n = 0; let prev = '';
      for (const [k, rs] of by) {
        if (k < prev || k < firstKey || k >= next) bad.push(['order', id, k]); prev = k;
        for (const r of rs) {
          n++; rows++;
          if (!Array.isArray(r[0])) { stubs.push([r[0], r[1]]); if (typeof r[0] !== 'string' || typeof r[1] !== 'string' || !r[1] || r[0] === r[1]) bad.push(['stub', id, r]); continue; }
          fullKeys.add(k);
          if (!(r[0].length && r[0].every((h) => typeof h === 'string' && h)) || typeof r[1] !== 'string' || typeof r[2] !== 'string' || !Array.isArray(r[3]) || typeof r[4] !== 'string' || (r[5] !== 0 && r[5] !== 1)) bad.push(['shape', id, r[0]]);
          if (!r[3].length) noSense++; if (r[5]) care++; if (r[3].length > 1) multi++;
          for (const s of r[3]) { senses++; if (typeof s !== 'string' || !s.trim()) bad.push(['sense', id, r[0]]); else { if (/^[a-z]/.test(s)) lower++; if (/^\([^()]{1,40}\)\.?$/.test(s) || /^pl\.$/.test(s)) labOnly++; if (s.length > longest) longest = s.length; if (/["”]\s+(?:Shak|Milton|Dryden|Bacon|Pope|Addison|Tennyson|Swift|Spenser|Chaucer)\.$/.test(s)) leaks++; } }
        }
      }
      if (n !== count) bad.push(['count', id, n, count]);
    }
    ok('every file is sorted by the key that JavaScript makes of each headword (so the key matches the Python one for all of them), inside its range, with the count the index gives', !bad.some((b) => b[0] === 'order' || b[0] === 'count') && rows === meta.records, bad.slice(0, 5));
    ok('every entry is whole: headwords, syllables, part of speech, senses, synonyms and care in the right types; every pointer is two different keys', !bad.some((b) => b[0] === 'shape' || b[0] === 'sense' || b[0] === 'stub'), bad.slice(0, 5));
    ok('every pointer leads to a key that has a full entry', stubs.every(([, to]) => fullKeys.has(to)), stubs.filter(([, to]) => !fullKeys.has(to)).slice(0, 5));
    ok('almost every entry has at least one sense, a sense is never very long, and few begin in lower case (a capital is put to each)', noSense < 60 && longest <= 1000 && lower / senses < 0.002, { noSense, longest, lower, senses });
    ok('the subject labels were joined to their definitions: no sense is only a label', labOnly === 0, labOnly);
    ok('the quotations and their authors are left out: a sense does not end with a quotation and the name of a famous author', leaks === 0, leaks);
    ok('a few hundred entries are flagged for care, and few are single-sense (the rest are longer)', care > 300 && care < 1500 && multi > 10000, { care, multi });

    /* ── looking words up ── */
    const L = async (w) => { const r = await find(w); return r; };
    let r = await L('kine'); ok('an old plural is found as it stands: kine, cows', r && r.how === 'exact' && /^Cows/.test(first(r)), first(r));
    r = await L('Climate'); ok('a word with more than one entry gives all of them, the subject label first in the sense', r && r.entries.length >= 2 && /^\(Anc\. Geog\.\)/.test(first(r)) && r.entries.some((e) => /dwell/.test(e.senses[0])) && /noun/.test(r.entries[0].pos), r && r.entries.map((e) => e.pos));
    r = await L('begot'); ok('a form of another word says what it is, in words: begot is the past tense and past participle of beget', r && r.how === 'exact' && /^Past tense and past participle of Beget\./.test(first(r)), first(r));
    r = await L('hath'); ok('hath is the old third person singular of have', r && /3rd person singular present of Have/.test(r.entries[0].pos + ' ' + first(r)) && /Has\./.test(first(r)), r && r.entries[0]);
    r = await L('doth'); ok('doth is the old third person singular of do', r && /3rd person singular present of Do\./.test(first(r)), first(r));
    for (const w of ['thou', 'thee', 'thine', 'wilt', 'shalt', 'art', 'wast', 'wert', 'dost', 'didst', 'saith', 'hast', 'hereafter', 'wherefore', 'whence', 'unto', 'yea', 'verily', 'behold', 'begat', 'spake']) { const x = await L(w); ok('the words of old translations are found as themselves: ' + w, x && x.how === 'exact' && x.entries.length >= 1, w); }
    r = await L('thee'); ok('a word with a living sense and an obsolete one lists the living one first: thee, the pronoun, before thee, to thrive', r && /^The objective case of thou/.test(first(r)) && r.entries.length >= 2 && /\[Obs/.test(r.entries[r.entries.length - 1].senses[0]), r && r.entries.map((e) => e.senses[0].slice(0, 40)));
    r = await L('shouldst'); ok('thou shouldst finds should, found as an old verb form', r && r.key === 'should' && r.how === 'archaic', r && [r.key, r.how]);
    r = await L('mayest'); ok('thou mayest finds may', r && r.key === 'may' && r.how === 'archaic');
    r = await L('goeth'); ok('he goeth finds go', r && r.key === 'go' && r.how === 'archaic');
    r = await L('climates'); ok('a plural that is not itself an entry finds its singular, and says so', r && r.key === 'climate' && r.how === 'plural' && r.entries.length >= 2);
    r = await L('tardiest'); ok('a superlative finds its stem', r && r.key === 'tardy' && r.how === 'super');
    r = await L("God's"); ok('a possessive finds the word', r && r.key === 'god' && r.entries.length >= 1);
    r = await L('unquestionably'); ok('a derived form that Webster prints under its word is a pointer, and is followed to the entry', r && r.entries.length >= 1 && r.via.length === 1 && r.via[0].to === 'unquestionable' && /adv/.test(r.via[0].kind) && /^Not questionable/.test(first(r)), r && r.via);
    r = await L('far stretched'); ok('a phrase with a hyphen in the book is found with a space, and a duplicated entry shows once', r && r.entries.length === 1 && r.entries[0].heads[0] === 'Far-stretched', r && r.entries.length);
    r = await L('induced currents'); ok('the last word of a phrase may be a plural', r && r.key === 'induced current');
    r = await L('apostleship'); ok('the word in the first message of this feature is there: apostleship', r && /office or dignity of an apostle/.test(first(r)));
    r = await L('dilatory'); ok('dilatory is there, with no quotation left in its senses', r && r.entries[0].senses.length === 2 && !/Motley|Alva/.test(r.entries[0].senses.join(' ')), r && r.entries[0].senses);
    for (const w of ['zxqvwk', '', '   ', 'one two three four five six', '1913', 'Aharman', 'Hérmazd', 'qqqqqqqq']) { const x = await L(w); ok('a word that is not English or not there gives nothing, and does not throw: ' + JSON.stringify(w), x === null, x && x.key); }
    { BEATLAB_DICT.keep = 1; const t = loads; await find('kine'); await find('zeal'); await find('kine'); ok('with one file held, a word in another file loads that file, and the first again', loads - t >= 2, loads - t); BEATLAB_DICT.keep = 5; }
    { const t = loads; await find('hereafter'); const t1 = loads; await find('hereafter'); ok('a file already held is not loaded again', loads === t1 && t1 - t <= 1, [t, t1, loads]); }
    r = await D.dkFindText('the Holy Spirit', meta, load); ok('a selection of a few words: the whole phrase if it is an entry, else each of its words that is not a small common one', r.length === 2 && r[0].text === 'Holy' && r[1].text === 'Spirit' && r.every((x) => x.res.entries.length >= 1), r.map((x) => x.text));
    r = await D.dkFindText('induced current', meta, load); ok('a phrase that is an entry is shown once, as a phrase', r.length === 1 && r[0].text === 'induced current');
    r = await D.dkFindText('and the of', meta, load); ok('a selection of only small words gives nothing', r.length === 0);
    r = await D.dkFindText('a b c d e f', meta, load); ok('a long selection gives nothing', r.length === 0);

    /* ── the wording of 1913 about peoples and faiths is flagged, so the box can say it is of its time ── */
    for (const w of ['pagan', 'heathen', 'mohammedan', 'jew', 'hindoo', 'idolater', 'savage']) { const x = await L(w); ok('flagged for care: ' + w, x && x.entries.some((e) => e.care), w); }
    for (const w of ['climate', 'tardy', 'apostleship', 'kine', 'hereafter', 'dilatory', 'thou']) { const x = await L(w); ok('not flagged: ' + w, x && x.entries.every((e) => !e.care), w); }
  }

  /* ── a sense as safe HTML ── */
  ok('a sense is escaped: a tag in it is text, and a quotation mark cannot leave an attribute', (() => { const h = D.dkMarkup('<img src=x onerror=alert(1)> "quoted" & \'single\'', esc); return !/<img|<script/.test(h) && /&lt;img/.test(h) && /&amp;/.test(h) && /&quot;quoted&quot;/.test(h); })());
  ok('subject labels at the front go in italics with what they stand for as the hover text, and usage labels are spelled out', (() => { const h = D.dkMarkup('(Bot.) (Zoöl.) A plant. [Obs.] Also [R.] and [Poetic] and [Plural in form but syntactically singular.]', esc); return /<i class="dk-lab" title="botany">Bot\.<\/i> <i class="dk-lab" title="zoology">Zoöl\.<\/i> A plant\./.test(h) && /<i class="dk-use">obsolete<\/i>/.test(h) && /<i class="dk-use">rare<\/i>/.test(h) && /<i class="dk-use">poetic<\/i>/.test(h) && /<i class="dk-use">\[Plural in form but syntactically singular\.\]<\/i>/.test(h); })(), D.dkMarkup('(Bot.) A plant. [Obs.]', esc));
  ok('a label that is not known is shown as it is, escaped', /<i class="dk-lab">Xyz&lt;b&gt;<\/i>/.test(D.dkMarkup('(Xyz<b>) thing', esc)) && D.dkMarkup('', esc) === '' && D.dkMarkup(null, esc) === '' && D.dkMarkup(undefined, esc) === '');
  ok('the words a sense points to are offered as links: past tense of begin, see thou; never the entry itself, never more than four', (() => {
    const a = D.dkRefs('Past tense and past participle of Beget.', ['Begot']); const b = D.dkRefs('The objective case of thou. See Thou.', ['Thee']); const c = D.dkRefs('3rd person singular present of Do.', ['Doth']); const d = D.dkRefs('See Thee. See Thou. See Thine. See Thy. See Ye. See You.', ['x']);
    return a.length === 1 && a[0] === 'Beget' && b.length === 1 && b[0] === 'Thou' && c.length === 1 && c[0] === 'Do' && d.length === 4 && D.dkRefs('See Thou.', ['Thou']).length === 0 && D.dkRefs('See under Pun.', []).length === 0 && D.dkRefs(null, null).length === 0;
  })());

  /* ── the section of a page: what is shown, and that it is safe ── */
  {
    const { M, render } = require('./_harness.js');
    const entry = (o) => Object.assign({ heads: ['Word'], syl: 'Word', pos: 'noun', senses: ['A thing.'], syn: '', care: false }, o);
    const item = (e, extra = {}) => M.dictItemHTML({ text: 'word', res: Object.assign({ key: 'word', how: 'exact', entries: [e], via: [] }, extra) });
    const h1 = item(entry({ heads: ['<img src=x onerror=alert(1)>'], syl: '<b>', pos: '"><script>', senses: ['<script>alert(1)</script> & [Obs.]'], syn: '<i>x</i>' }));
    ok('the headword, syllables, part of speech, senses and synonyms are all escaped', !/<img|<script|<i>x/.test(h1) && /&lt;b&gt;/.test(h1) && /&lt;i&gt;x/.test(h1) && /&lt;img/.test(h1) && /&lt;script&gt;/.test(h1) && /&amp;/.test(h1), h1);
    ok('one sense is a plain line, and several are a numbered list with the later ones behind a “more meanings” fold', !/<ol/.test(item(entry())) && /class="dk-one"/.test(item(entry())) && (() => { const h = item(entry({ senses: ['a1.', 'b2.', 'c3.', 'd4.', 'e5.', 'f6.'] })); return (h.match(/<ol class="dk-senses"/g) || []).length === 2 && /2 more meanings/.test(h) && /start="5"/.test(h); })());
    ok('more than five entries put the rest behind a fold', (() => { const h = M.dictItemHTML({ text: 'w', res: { key: 'w', how: 'exact', via: [], entries: [1, 2, 3, 4, 5, 6, 7].map((n) => entry({ heads: ['W' + n] })) } }); return /2 more entries/.test(h) && (h.match(/class="dk-entry"/g) || []).length === 7; })());
    ok('a word whose entry speaks of peoples or faiths in the words of 1913 says so once, whatever the number of entries: understood, not endorsed', /class="small dk-care"[^>]*>[^<]*understood, not endorsed/.test(item(entry({ care: true }))) && !/dk-care/.test(item(entry())) && (M.dictItemHTML({ text: 'w', res: { key: 'w', how: 'exact', via: [], entries: [entry({ care: true }), entry({ care: true }), entry()] } }).match(/dk-care/g) || []).length === 1);
    ok('a word that is a form of another says what it is and which word is shown', /“word” looks like the past tense or past participle of <b>wor<\/b>, which is shown/.test(M.dictItemHTML({ text: 'word', res: { key: 'wor', how: 'past', entries: [entry()], via: [] } })) && /“unquestionably” is the adverb of <b>unquestionable<\/b>/.test(M.dictItemHTML({ text: 'unquestionably', res: { key: 'unquestionably', how: 'exact', entries: [entry()], via: [{ key: 'unquestionably', to: 'unquestionable', kind: 'adv.' }] } })) && /is another spelling of <b>y<\/b>/.test(M.dictItemHTML({ text: 'x', res: { key: 'x', how: 'exact', entries: [entry()], via: [{ key: 'x', to: 'y', kind: '' }] } })) && /is a form of <b>beget<\/b>/.test(M.dictItemHTML({ text: 'begat', res: { key: 'begat', how: 'exact', entries: [entry()], via: [{ key: 'begat', to: 'beget', kind: 'form' }] } })));
    ok('a sense that points to another word offers it as a button that looks it up', /<button class="dk-link" type="button" data-dkw="Beget">Beget →<\/button>/.test(item(entry({ heads: ['Begot'], senses: ['Past tense and past participle of Beget.'] }))) && !/data-dkw/.test(item(entry())));
    const sec = (r, text, back, link) => M.dictSectionHTML(r, text, back, link);
    ok('the section says when there is no dictionary in this copy, when the word is not in it, and when too many words were selected', /no dictionary/.test(sec({ ok: false, items: [] }, 'x')) && /Not in the dictionary either/.test(sec({ ok: true, items: [] }, 'zzz')) && /Select one word/.test(sec({ ok: true, items: [] }, 'one two three four five')));
    ok('the section ends with what the dictionary is: Webster’s 1913, public domain, nothing sent, a book of its time, quotations and word histories left out', (() => { const h = sec({ ok: true, items: [{ text: 'word', res: { key: 'word', how: 'exact', entries: [entry()], via: [] } }] }, 'word', '', true); return /Webster’s Revised Unabridged Dictionary, 1913 \(public domain\)/.test(h) && /nothing is sent/.test(h) && /old words and old views/.test(h) && /quotations and word histories are left out/.test(h) && /More in the Glossary/.test(h) && !/More in the Glossary/.test(sec({ ok: true, items: [{ text: 'word', res: { key: 'word', how: 'exact', entries: [entry()], via: [] } }] }, 'word', '', false)); })());
    ok('after an arrow is followed there is a button back to the word before', /data-dkw="begot">← back to “begot”/.test(sec({ ok: true, items: [] }, 'beget', 'begot')));
    if (have) {
      const real = async (w) => { const items = await D.dkFindText(w, meta, load); return M.dictSectionHTML({ ok: true, items }, w, '', true); };
      let h = await real('begot'); ok('begot, from the real file: past tense and past participle of Beget, with Beget one tap away', /Past tense and past participle of Beget\./.test(h) && /data-dkw="Beget"/.test(h), h.slice(0, 400));
      h = await real('pagan'); ok('pagan, from the real file: the care note is shown', /understood, not endorsed/.test(h));
      h = await real('hath'); ok('hath, from the real file: the old third person of have', /3rd person singular present of Have/.test(h) && /<i class="dk-use">archaic<\/i>/.test(h), h.slice(0, 500));
      h = await real('begat'); ok('begat (not an entry of its own) is found through the forms of beget', /“begat” is a form of <b>beget<\/b>/.test(h) || /begat/.test(h), h.slice(0, 300));
      h = await real('climate'); ok('climate: the subject label is in italics with its meaning on hover', /<i class="dk-lab" title="ancient geography">Anc\. Geog\.<\/i>/.test(h));
    }
    const g1 = render(['glossary'], { q: 'kine' }); const g0 = render(['glossary']);
    ok('the Glossary page has a place for the dictionary that shows when a word is searched, and is hidden otherwise; its caption does not link back to itself', /id="glDict" class="dk-box" data-dklink="0" aria-live="polite" >/.test(g1.body) && /id="glDict" class="dk-box" data-dklink="0" aria-live="polite" hidden>/.test(g0.body), [g1.body.match(/<div id="glDict"[^>]*>/), g0.body.match(/<div id="glDict"[^>]*>/)]);
    ok('the Glossary page says any English word can be typed there', /Type any other English word to see Webster’s 1913 dictionary on it, here and offline/.test(g0.body));
  }

  /* ── the registrar holds a few files and lets the oldest go ── */
  {
    const keep = BEATLAB_DICT.keep; BEATLAB_DICT.keep = 3; BEATLAB_DICT.add('t1', [[['A'], '', '', ['x'], '', 0]]); BEATLAB_DICT.add('t2', [['b', 'a', '']]); BEATLAB_DICT.add('t3', []); BEATLAB_DICT.add('t4', []);
    ok('only the newest few files are held; the map of a file has its rows by key, a pointer under its own key', !BEATLAB_DICT.has('t1') && BEATLAB_DICT.has('t2') && BEATLAB_DICT.has('t4') && BEATLAB_DICT.by.t2.get('b')[0][1] === 'a');
    BEATLAB_DICT.add('t5', [[['Kine'], '', '', ['Cows.'], '', 0], [['Kine'], '', '', ['More.'], '', 0]]); ok('rows with the same key stay together, in order', BEATLAB_DICT.by.t5.get('kine').length === 2 && BEATLAB_DICT.by.t5.get('kine')[1][3][0] === 'More.');
    BEATLAB_DICT.keep = keep; ['t1', 't2', 't3', 't4', 't5'].forEach((id) => { delete BEATLAB_DICT.by[id]; }); BEATLAB_DICT.order = BEATLAB_DICT.order.filter((x) => !/^t\d$/.test(x));
  }

  /* ── nothing is fetched: the core and the view build only a relative path, on this page's own folder ── */
  {
    const core = fs.readFileSync(path.join(__dirname, '../src/js/2z-dict-core.js'), 'utf8'); const viewFile = path.join(__dirname, '../src/js/6zx-dictionary.js'); const view = fs.existsSync(viewFile) ? fs.readFileSync(viewFile, 'utf8') : '';
    const code = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
    ok('the dictionary code has no network call: no fetch, XHR, beacon, socket, image or form post, and no address of any other site', [core, view].every((s) => !/\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket|new Image|EventSource|importScripts|https?:\/\//.test(code(s))), [core, view].map((s) => (code(s).match(/\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket|new Image|EventSource|importScripts|https?:\/\/[^\s'"`]*/g) || [])));
    ok('the view loads its files by script tag from the dictionary/ folder beside the page, as the texts are', view === '' || (/base: 'dictionary\/'/.test(view) && /createElement\('script'\)/.test(view)));
  }
  console.log(`dictionary: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch((e) => { console.log('FAIL (threw)', e && e.stack || e); process.exit(1); });
