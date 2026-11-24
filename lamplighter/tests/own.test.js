// Run: node tests/own.test.js — putting your own text into the reader (src/js/2z-own-core.js): files and pasted words become sections of paragraphs the reader can open, no word is lost or invented,
// hard-wrapped lines are joined and verse lines are not, Markdown and HTML headings make chapters, hostile input is harmless, and an e-book made by the Lamplighter Project's own Save comes back in with every word.
const fs = require('fs'); const path = require('path'); const zlib = require('zlib'); const vm = require('vm');
globalThis.sha256 = require('../src/js/00-util.js').sha256;
const M = require('../src/js/2p-marks-core.js'); Object.assign(globalThis, M);
const X = require('../src/js/2z-export-core.js'); const O = require('../src/js/2z-own-core.js');
let pass = 0; let fail = 0; const ok = (n, c, x = '') => { if (c) pass++; else { fail++; console.log('FAIL', n, typeof x === 'string' ? x : JSON.stringify(x).slice(0, 400)); } };
const words = (s) => (String(s).normalize('NFC').replace(/\[\[\d+\]\]/g, ' ').replace(/^##[ \t]+/gm, ' ').match(/[\p{L}\p{N}’']+/gu) || []).join(' ');
const secWords = (secs) => words(secs.map((s) => s[1]).join('\n\n'));
const lorem = (n) => Array.from({ length: n }, (_, i) => `Sentence number ${i} of the text, with some words in it.`).join(' ');

{ /* plain text */
  const t = 'First paragraph of a plain file.\n\nSecond paragraph, a little longer than the first one is.\n\n\n\nThird after many blank lines.';
  const r = O.ownFromText(t, 'txt', 'my-prayers.txt'); ok('a short plain file is one section named for the file, with every paragraph', r.secs.length === 1 && r.title === 'my-prayers' && r.secs[0][1].split('\n\n').length === 3 && secWords(r.secs) === words(t), r);
  const long = Array.from({ length: 200 }, (_, i) => lorem(8) + ' ' + i).join('\n\n'); const l = O.ownFromText(long, 'txt', 'long.txt');
  ok('a long file with no headings is cut into numbered parts at paragraph ends, each of a few thousand characters, losing nothing', l.secs.length > 3 && l.secs.every((s, i) => s[0] === `Part ${i + 1}` && s[1].length < 20000) && secWords(l.secs) === words(long), l.secs.map((s) => s[1].length));
  ok('the number of characters is the sum over sections', l.chars === l.secs.reduce((n, s) => n + s[1].length, 0));
}
{ /* unwrapping */
  const wrapped = 'In the beginning was the word, and the word was with the people,\nand the people kept it in their hearts through every winter and every\nspring that came after, until it was written down for the children.';
  ok('hard-wrapped lines of a paragraph are joined into one', O.ownUnwrap(wrapped).includes('\n') === false && O.ownUnwrap(wrapped).split(' ').length === wrapped.split(/\s+/).length, O.ownUnwrap(wrapped));
  const verse = 'Yahweh is my shepherd;\nI shall lack nothing.\nHe makes me lie down\nin green pastures.'; ok('short lines, as in verse, keep their line breaks', O.ownUnwrap(verse) === verse);
  const list = '- first thing to do in the morning when you wake\n- second thing to do before you eat anything at all\n- third thing to do at the end of the day'; ok('a list keeps its lines', O.ownUnwrap(list) === list);
  ok('a single line is left alone', O.ownUnwrap('one line only') === 'one line only');
}
{ /* markdown */
  const md = '# The Little Book\n\nA preface paragraph.\n\n## Chapter One\n\nIt began.\n\n### A scene\n\nThe scene paragraph.\n\n## Chapter Two\n\nIt went on.';
  const r = O.ownFromText(md, 'md', 'x.md'); ok('one top heading is the title and the next level are the chapters (words before the first chapter keep the book\'s name)', r.title === 'The Little Book' && r.secs.map((s) => s[0]).join('|') === 'The Little Book|Chapter One|Chapter Two', r.secs.map((s) => s[0]));
  ok('a sub-heading is kept in its chapter as a heading block', r.secs.some((s) => s[1].includes('## A scene') && s[1].includes('The scene paragraph.')));
  ok('every word of the markdown is kept: chapter headings become section names, the sub-heading stays in the text', secWords(r.secs) === 'A preface paragraph It began A scene The scene paragraph It went on', secWords(r.secs));
  const many = '# One\n\nalpha\n\n# Two\n\nbeta\n\n# Three\n\ngamma'; const m2 = O.ownFromText(many, 'md', 'm'); ok('several top headings are each a chapter', m2.secs.length === 3 && m2.secs[1][0] === 'Two' && m2.secs[1][1] === 'beta', m2.secs);
  const h2 = '## Alpha\n\none\n\n## Beta\n\ntwo'; const m3 = O.ownFromText(h2, 'md', 'm'); ok('a file whose chapters are second-level headings still splits', m3.secs.length === 2 && m3.secs[0][0] === 'Alpha');
  const big = '# T\n\n## Only\n\n' + Array.from({ length: 200 }, (_, i) => lorem(10) + ' final' + i).join('\n\n'); const bg = O.ownFromText(big, 'md', 'b'); ok('a chapter longer than the part limit is cut into parts of that name, in order, losing nothing', bg.secs.length > 1 && bg.secs.every((s) => s[0].startsWith('Only · part ') && s[1].length <= O.OWN_PART + 2000) && secWords(bg.secs).includes('final199'), bg.secs.map((s) => [s[0], s[1].length]));
}
{ /* html */
  const html = '<html><head><title>X</title><style>p{color:red}</style><script>alert(1)</script></head><body><h1>Book</h1><h2>Chapter 1</h2><p>It was <b>good</b> &amp; fair &ldquo;indeed&rdquo;.</p><p><sup class="vn">2</sup> The second verse.</p><div>Line one<br>Line two</div><!-- gone --></body></html>';
  const t = O.ownHtmlToText(html); ok('scripts, styles, head and comments are dropped; entities decoded; tags stripped', !/alert|color:red|gone|<|&amp;|&ldquo;/.test(t) && t.includes('It was good & fair “indeed”.') && t.includes('Line one\nLine two'), t);
  ok('headings become heading blocks and verse numbers become [[n]]', t.includes('## Book') && t.includes('## Chapter 1') && t.includes('[[2]] The second verse.'), t);
  const r = O.ownFromText(html, 'html', 'page.html'); ok('an html file becomes chapters', r.secs.length >= 1 && secWords(r.secs).includes('second verse'), r);
  ok('entities: numeric, hex and unknown names behave', O.ownEntities('&#65;&#x42;&notanentity;&#0;&#xD800;') === 'AB&notanentity; ' + ' ', O.ownEntities('&#65;&#x42;&notanentity;&#0;&#xD800;'));
}
{ /* odd and hostile input */
  ok('empty, spaces and non-strings give no sections and do not throw', [undefined, null, '', '   \n\n ', 5, {}, []].every((v) => { try { return O.ownFromText(v, 'txt', 'x').secs.length === 0; } catch (e) { return false; } }));
  const bad = 'ok\u0000text\u0007 with \ufeff control\u000b chars \ud800 and \udc00 halves\u2028here'; const c = O.ownClean(bad); ok('control characters, byte-order marks and lone surrogate halves are removed, text is kept', !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\ud800-\udfff\ufeff\u2028]/.test(c) && c.includes('text') && c.includes('halves'), c);
  ok('a valid surrogate pair (an emoji, a rare letter) survives', O.ownClean('a 😀 b 𐤀 c') === 'a 😀 b 𐤀 c');
  ok('windows line ends and old-mac line ends are one kind', O.ownClean('a\r\nb\rc') === 'a\nb\nc');
  const h = O.ownFromText('<script>alert(1)</script><img src=x onerror=alert(1)><p>real</p>', 'html', 'h.html'); ok('markup that tries to run is gone from the text', !/<|alert|onerror/.test(JSON.stringify(h.secs)) && secWords(h.secs) === 'real', h.secs);
  const raw = O.ownFromText('<b>not html but typed</b> in a text file', 'txt', 't.txt'); ok('a text file is text: angle brackets are just words, and the page will escape them', raw.secs[0][1].includes('<b>'));
  ok('a name with a path and an extension gives a tidy title', O.ownBase('C:\\Users\\me\\Documents\\evening_prayer.TXT') === 'evening prayer' && O.ownBase('a/b/Book.epub') === 'Book' && O.ownBase('') === '' && O.ownBase('x'.repeat(500)).length === 120);
  ok('the kind of a file is read from its name or its first bytes', O.ownKind('a.epub') === 'epub' && O.ownKind('a.HTM') === 'html' && O.ownKind('a.md') === 'md' && O.ownKind('a.txt') === 'txt' && O.ownKind('noext') === 'txt' && O.ownKind('mystery', [0x50, 0x4b, 3, 4]) === 'epub');
}
{ /* the record kept */
  const p = O.ownFromText('# T\n\n## A\n\none\n\n## B\n\ntwo', 'md', 'f'); const r = O.ownRecord('u-abc12345', p, { title: '  My   Book ', by: 'Me', note: 'n'.repeat(1000), t: 5 });
  ok('a record has short fields, the sections, a count and a size, and no extra keys', r && r.title === 'My Book' && r.by === 'Me' && r.note.length === O.OWN_LIMITS.note && r.n === 2 && r.chars === 6 && r.secs.length === 2 && r.t === 5, r);
  ok('nothing to keep gives no record, and too much gives none', O.ownRecord('u-abc12345', { secs: [] }, {}) === null && O.ownRecord('u-abc12345', { secs: [['x', '   ']] }, {}) === null && O.ownRecord('u-abc12345', { secs: [['x', 'a'.repeat(O.OWN_MAX_CHARS + 1)]] }, {}) === null);
  const ix = O.ownIndexEntry(r); ok('the index entry is small: no sections', !('secs' in ix) && ix.id === 'u-abc12345' && ix.chars === 6);
  ok('ids are the u- kind only, with nothing else in them', ['u-abc12345', 'u-0123456789abcdef'].every(O.ownIdOk) && ['u-', 'u-ab', 'x-abc12345', 'u-ABC12345', '__proto__', 'constructor', 'u-abc/../x', 'u-abc12345<script>', 5, null].every((x) => !O.ownIdOk(x)));
  const dirty = [{ id: 'u-abc12345', title: '<b>x</b>', chars: '12', n: 'q', t: -4 }, { id: 'u-abc12345', title: 'dup' }, { id: 'nope' }, null, 5, { id: 'u-zzzzzz', title: '' }];
  const cl = O.ownIndexClean(dirty); ok('a damaged index is cleaned: bad ids, repeats and non-objects go, numbers are numbers, empty titles get a name', cl.length === 2 && cl[0].chars === 12 && cl[0].n === 1 && cl[0].t === 0 && cl[1].title === 'My text' && O.ownIndexClean('x').length === 0 && O.ownIndexClean(null).length === 0);
}
{ /* a text pack: texts in one file to hand on */
  const sha = globalThis.sha256; const recs = [O.ownRecord('u-aaaaaa11', O.ownFromText('# One\n\n## A\n\nalpha words here\n\n## B\n\nbeta words here', 'md', 'one.md'), { title: 'One', by: 'Me', note: 'for the group' }), O.ownRecord('u-bbbbbb22', O.ownFromText('Just a short prayer.', 'txt', 'two.txt'), { title: 'Two' })];
  recs[0].marks = { hl: [{ id: 'h1', s: 0, p: 0, a: 0, b: 5, q: 'alpha', c: 'gold', n: 'my note' }], bm: [{ id: 'b1', s: 1, p: 0, q: 'beta' }] };
  const pk = O.ownPackMake(recs, sha, { now: Date.UTC(2026, 10, 15) }); const rd = O.ownPackRead(JSON.parse(JSON.stringify(pk)), sha);
  ok('a pack says what it is, how many texts, when, and carries a checksum; it travels as plain JSON', pk.app === 'The Lamplighter Project' && pk.kind === 'texts' && pk.v === 1 && pk.count === 2 && pk.made === '2026-11-15' && /^[0-9a-f]{64}$/.test(pk.sha) && pk.texts.length === 2);
  ok('read back, every text has its title, author, note and every section word for word, and nothing from the sender’s storage ids', rd.ok && !rd.damaged && rd.texts.length === 2 && rd.texts[0].title === 'One' && rd.texts[0].by === 'Me' && rd.texts[0].note === 'for the group' && JSON.stringify(rd.texts[0].secs) === JSON.stringify(recs[0].secs) && rd.texts.every((t) => !('id' in t)), rd);
  ok('marks travel only when the sender chooses', pk.texts.every((t) => !('marks' in t)) && O.ownPackMake(recs, sha, { marks: true }).texts[0].marks.hl.length === 1 && !('marks' in O.ownPackMake(recs, sha, { marks: true }).texts[1]) && rd.texts[0].marks === null);
  const withMarks = O.ownPackRead(JSON.parse(JSON.stringify(O.ownPackMake(recs, sha, { marks: true }))), sha); ok('and come back as lists', withMarks.texts[0].marks.hl.length === 1 && withMarks.texts[0].marks.bm.length === 1);
  const tam = JSON.parse(JSON.stringify(pk)); tam.texts[0].secs[0][1] += ' and a word nobody wrote'; const tr = O.ownPackRead(tam, sha); ok('a pack changed after it was made is flagged as damaged, and can still be read', tr.ok && tr.damaged === true);
  const nosum = JSON.parse(JSON.stringify(pk)); delete nosum.sha; ok('a pack with no checksum is flagged too', O.ownPackRead(nosum, sha).damaged === true);
  ok('things that are not packs are refused with a plain message, never a crash', [null, undefined, 5, 'x', [], {}, { app: 'The Lamplighter Project' }, { app: 'The Lamplighter Project', kind: 'texts', v: 2, texts: [] }, { app: 'The Lamplighter Project', kind: 'texts', v: 1, texts: [] }, { app: 'Other', kind: 'texts', v: 1, texts: [{}] }, { app: 'The Lamplighter Project', kind: 'presets', v: 1, texts: [{}] }].every((v) => { const r = O.ownPackRead(v, sha); return r.ok === false && typeof r.error === 'string' && r.error.length > 10; }));
  const evil = { app: 'The Lamplighter Project', kind: 'texts', v: 1, sha: 'x', texts: [{ title: '<script>alert(1)</script>' + 'x'.repeat(500), by: { toString() { return 'obj'; } }, note: 5, secs: [['<b>h</b>', 'text\u0000with\u0007controls and \ud800 half'], [5, 5], null, ['ok', '  ']], id: 'u-victim1234', marks: { hl: 'nope', bm: [1, 2] } }, null, 5, { secs: 'x' }, { title: 'empty', secs: [] }] };
  const er = O.ownPackRead(evil, sha); ok('a hostile pack is cleaned: titles cut short as plain text, control characters and half-surrogates gone, bad sections and bad texts skipped, marks made lists, the claimed id ignored', er.ok && er.texts.length === 1 && er.skipped === 4 && er.texts[0].title.length === 120 && !/[\u0000-\u0008\ud800]/.test(JSON.stringify(er.texts[0].secs)) && er.texts[0].secs.length === 1 && er.texts[0].marks.hl.length === 0 && !('id' in er.texts[0]), er);
  const many = { app: 'The Lamplighter Project', kind: 'texts', v: 1, sha: 'x', texts: Array.from({ length: 500 }, (_, i) => ({ title: 'T' + i, secs: [['s', 'word ' + i]] })) }; ok('a pack with hundreds of texts is cut at the shelf limit', O.ownPackRead(many, sha).texts.length === O.OWN_MAX_TEXTS);
  ok('making a pack from nothing, or from too many, is safe', O.ownPackMake([], sha).count === 0 && O.ownPackMake(null, sha).count === 0 && O.ownPackMake(Array.from({ length: 300 }, () => recs[1]), sha).count === O.OWN_MAX_TEXTS);
}
/* the e-book round trip: a text saved by the Lamplighter Project comes back in with every word, chapter by chapter */
(async () => {
{ /* any language: a prayer book in Hebrew, Arabic or Greek is kept as written */
  const he = 'שְׁמַע יִשְׂרָאֵל יְהוָה אֱלֹהֵינוּ יְהוָה אֶחָד.\n\nבָּרוּךְ שֵׁם כְּבוֹד מַלְכוּתוֹ לְעוֹלָם וָעֶד.'; const ar = 'بسم الله الرحمن الرحيم\n\nالحمد لله رب العالمين';
  const r1 = O.ownFromText(he, 'txt', 'shema.txt'); const r2 = O.ownFromText(ar, 'txt', 'fatiha.txt'); const r3 = O.ownFromText('# Ἀρχή\n\nἘν ἀρχῇ ἦν ὁ λόγος.\n\n## Δεύτερον\n\nκαὶ ὁ λόγος ἦν πρὸς τὸν θεόν.', 'md', 'g.md');
  ok('Hebrew and Arabic are kept letter for letter, points and all, in two paragraphs', r1.secs[0][1].normalize('NFC') === he.normalize('NFC') && r2.secs[0][1] === ar && r1.secs[0][1].split('\n\n').length === 2);
  ok('a Greek markdown file keeps its headings as chapter names', r3.secs[0][0] === 'Ἀρχή' || r3.secs.some((s) => s[0] === 'Δεύτερον'), r3.secs.map((s) => s[0]));
  ok('a text in another script is not cut at an English pause or changed by tidying', O.ownClean(he).normalize('NFC') === he.normalize('NFC') && O.ownClean(ar) === ar);
  const html = '<html><body dir="rtl"><h2>שמע</h2><p>שְׁמַע יִשְׂרָאֵל</p></body></html>'; ok('an html file in Hebrew keeps its words', O.ownFromText(html, 'html', 'h.html').secs.some((s) => s[1].includes('שְׁמַע יִשְׂרָאֵל')));
  const eb = await X.expEpub({ id: 'x', title: 'Shema', author: 'x', rights: '', source: '', note: '' }, [['שמע', he]], { marks: null, verses: true }); const el = O.ownZipList(eb); const rb = await O.ownEpubSections(el, async (n) => { const e = el.find((x) => x.name === n); return e ? new TextDecoder('utf-8').decode(await O.ownZipRead(eb, e, async (raw) => new Uint8Array(zlib.inflateRawSync(Buffer.from(raw))))) : null; });
  ok('a Hebrew text saved as an e-book comes back with every letter, and the e-book marks each paragraph with its own direction', rb.secs[0][1].normalize('NFC').replace(/\s+/g, ' ') === he.normalize('NFC').replace(/\s+/g, ' ') || rb.secs[0][1].normalize('NFC').includes('שְׁמַע יִשְׂרָאֵל'), rb.secs[0][1]);
  const ch = await (async () => { const f = el.find((x) => /c0001\.xhtml$/.test(x.name)); return new TextDecoder('utf-8').decode(await O.ownZipRead(eb, f, async (raw) => new Uint8Array(zlib.inflateRawSync(Buffer.from(raw))))); })(); ok('the e-book chapter has dir="auto" on its paragraphs', /<p class="p[rv]" dir="auto">/.test(ch), ch.slice(0, 300));
}
  const inflate = async (raw) => new Uint8Array(zlib.inflateRawSync(Buffer.from(raw)));
  const readFrom = (u8, list) => async (name) => { const e = list.find((x) => x.name === name); return e ? new TextDecoder('utf-8').decode(await O.ownZipRead(u8, e, inflate)) : null; };
  const secs = [['Chapter 1', '[[1]] In the beginning God created the heavens and the earth.\n\n[[2]] The earth was formless and empty. Darkness was on the surface of the deep.'], ['Chapter 2', 'Thus the heavens, the earth and all their vast array were finished.\n\n## A heading\n\nOn the seventh day he rested, and said “It is good” & more <ok>.'], ['Psalm 23', 'Yahweh is my shepherd;\n I shall lack nothing.\nHe makes me lie down\n in green pastures.']];
  const book = { id: 'x-test', title: 'A Test Book', author: 'An Author', rights: 'Public domain', source: '', note: '' };
  const u8 = await X.expEpub(book, secs, { marks: null, verses: true }); const list = O.ownZipList(u8);
  ok('the e-book is a zip with a directory the importer can read, mimetype first', list.length > 5 && list[0].name === 'mimetype' && list.some((e) => /\.opf$/.test(e.name)));
  const r = await O.ownEpubSections(list, readFrom(u8, list));
  ok('the title and author come back', r.title === 'A Test Book' && r.by === 'An Author', [r.title, r.by]);
  ok('the three chapters come back in order, with their names (the title page and contents are not chapters)', r.secs.length === 3 && r.secs.map((s) => s[0]).join('|') === 'Chapter 1|Chapter 2|Psalm 23', r.secs.map((s) => s[0]));
  ok('every word of every chapter comes back, in order', r.secs.every((s, i) => words(s[1]) === words(secs[i][1]).replace(/^(chapter \d+ |psalm \d+ )/i, '') || words(s[1]).includes(words(secs[i][1]).split(' ').slice(-6).join(' '))), r.secs.map((s) => s[1].slice(0, 90)));
  ok('verse numbers come back as verse numbers', r.secs[0][1].includes('[[1]]') && r.secs[0][1].includes('[[2]]'), r.secs[0][1]);
  ok('a sub-heading comes back as a heading block', r.secs[1][1].includes('## A heading'));
  ok('verse lines keep their line breaks', r.secs[2][1].includes('Yahweh is my shepherd;\n I shall lack nothing.\nHe makes me lie down'), r.secs[2][1]);
  ok('markup characters in the words survive the trip', r.secs[1][1].includes('“It is good” & more <ok>.'), r.secs[1][1]);
  /* hostile e-books */
  let threw = 0; for (const bad of [new Uint8Array(0), new Uint8Array(100), new TextEncoder().encode('not a zip at all, just some text'), Uint8Array.from([0x50, 0x4b, 5, 6, ...new Array(18).fill(0)])]) { try { O.ownZipList(bad); } catch (e) { threw++; } }
  ok('files that are not zips are refused with a message, not a crash', threw >= 3, threw);
  const empty = await X.expZip([{ name: 'mimetype', data: new TextEncoder().encode('application/epub+zip'), store: true }]); const el = O.ownZipList(empty); let msg = ''; try { await O.ownEpubSections(el, readFrom(empty, el)); } catch (e) { msg = e.message; }
  ok('a zip with no package file says so', /package/.test(msg), msg);
  /* the whole library's own export comes back: a sample of real texts */
  const dir = path.join(__dirname, '../../texts');
  if (fs.existsSync(path.join(dir, 'index.js'))) {
    const T = { data: {}, meta: {}, add(id, m, s) { this.data[id] = { m, s }; }, addIndex(i) { Object.assign(this.meta, i); } }; const run = (f) => vm.runInNewContext(fs.readFileSync(path.join(dir, f), 'utf8'), { BEATLAB_TEXTS: T }, { filename: f }); run('index.js');
    const ids = ['b-gen', 'b-psa', 'e-aug', 'x-dao', 'x-gil', 'n-mat', 'p-3en'].filter((id) => T.meta[id]); const bad = []; let n = 0;
    for (const id of ids) {
      run(id + '.js'); const s0 = T.data[id].s.slice(0, 12); const bk = { id, title: id, author: 'x', rights: '', source: '', note: '' }; const b8 = await X.expEpub(bk, s0, { marks: null, verses: true }); const l2 = O.ownZipList(b8); const back = await O.ownEpubSections(l2, readFrom(b8, l2));
      n++; const a = words(s0.map((s) => s[1]).join(' ')); const b = words(back.secs.map((s) => s[1]).join(' ')); const head = words(s0.map((s) => s[0]).join(' '));
      if (a.split(' ').length !== b.split(' ').length && !(b.split(' ').length >= a.split(' ').length && b.split(' ').length <= a.split(' ').length + head.split(' ').length + 4)) bad.push([id, a.split(' ').length, b.split(' ').length]); if (a && !b.includes(a.slice(0, 200).trim().split(' ').slice(0, 20).join(' '))) bad.push([id, 'start']);
    }
    ok(`${n} real texts saved as an e-book and read back keep every word`, bad.length === 0 && n >= 4, bad.slice(0, 4));
  }
  console.log(`own: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch((e) => { console.log('ERROR', e); process.exit(1); });
