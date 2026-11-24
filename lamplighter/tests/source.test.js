/* Where a text comes from and where its original pages are (src/js/2z-source-core.js): every text in the Library has a kind (scan, typed, Bible version, document, your own), the scans have an Internet Archive
   identifier the reader can search inside for a passage, nothing but https is ever linked, and the quotation a reader copies carries the title, the section, the edition and the source.
   Run: node tests/source.test.js */
const fs = require('fs'); const path = require('path'); const vm = require('vm');
const P = require('../src/js/2z-source-core.js'); const O = require('../src/js/2z-originals-core.js');
let pass = 0; let fail = 0; const ok = (n, c, x) => { if (c) pass++; else { fail++; console.log('FAIL', n, x === undefined ? '' : JSON.stringify(x).slice(0, 400)); } };
const root = path.join(__dirname, '../..');

ok('an Internet Archive address gives its identifier, whether it is a details, download or stream link, and anything else gives none', P.provArchiveId('https://archive.org/details/sepheryetzirahb00rittgoog') === 'sepheryetzirahb00rittgoog' && P.provArchiveId('https://archive.org/download/ashanti0000ratt/ashanti0000ratt.pdf') === 'ashanti0000ratt' && P.provArchiveId('https://www.archive.org/stream/x.y-z_1/x') === 'x.y-z_1' && P.provArchiveId('https://example.org/details/abc') === '' && P.provArchiveId('http://archive.org/details/abc') === '' && P.provArchiveId('') === '');
ok('only https is ever linked', P.provHttps('https://archive.org/') === 'https://archive.org/' && P.provHttps('http://archive.org/') === '' && P.provHttps('javascript:alert(1)') === '' && P.provHttps('') === '' && P.provHttps(null) === '');
ok('the host is named plainly', P.provHostName('https://www.gutenberg.org/ebooks/17150') === 'Project Gutenberg' && P.provHostName('https://archive.org/details/x') === 'Internet Archive' && P.provHostName('https://en.wikisource.org/wiki/X') === 'Wikisource' && P.provHostName('https://press-pubs.uchicago.edu/founders/') === 'press-pubs.uchicago.edu' && P.provHostName('nonsense') === '');

/* the kinds, on the real index */
globalThis.BEATLAB_TEXTS = { meta: {}, addIndex(o) { Object.assign(this.meta, o); } }; vm.runInThisContext(fs.readFileSync(path.join(root, 'texts/index.js'), 'utf8')); const META = BEATLAB_TEXTS.meta; const ids = Object.keys(META);
globalThis.BEATLAB_ORIG = {}; vm.runInThisContext(fs.readFileSync(path.join(root, 'texts/originals.js'), 'utf8')); const ALL = globalThis.BEATLAB_ORIG;
const kinds = {}; ids.forEach((id) => { const k = P.provKind(id, META[id]); kinds[k] = (kinds[k] || 0) + 1; });
ok('every text has one of the five kinds, and the five names exist', ids.length > 800 && Object.keys(kinds).every((k) => P.PROV_KIND_NAME[k]), kinds);
ok('the scans are the OCR texts (every text whose licence line says OCR is a scan), and most of the Library is scans or typed', ids.filter((id) => /OCR/.test(META[id].license || '')).every((id) => P.provKind(id, META[id]) === 'scan') && kinds.scan > 400 && kinds.typed > 200 && kinds.bible >= 80, kinds);
ok('Eckhart’s sermons are a scan, with the Internet Archive scan to search; Cthulhu is typed; Genesis is a Bible version; a text of your own is your own', P.provKind('e-eck', META['e-eck']) === 'scan' && P.provKind('i-cth', META['i-cth']) === 'typed' && P.provKind('b-gen', META['b-gen']) === 'bible' && P.provKind('u-abc', {}) === 'own');
const scanIds = ids.filter((id) => P.provKind(id, META[id]) === 'scan');
const noScan = scanIds.filter((id) => P.provInfo(id, META[id], O.origEntry(ALL, id, META)).scans.length === 0);
ok('nearly every scan text has an Internet Archive scan the reader can search inside (the few that do not are named below)', noScan.length <= Math.ceil(scanIds.length * 0.03), noScan.slice(0, 20));
ok('every scan link is made from a plain identifier, and every one is https', scanIds.every((id) => P.provInfo(id, META[id], O.origEntry(ALL, id, META)).scans.every((s) => /^[A-Za-z0-9._-]+$/.test(s.id) && s.page === 'https://archive.org/details/' + s.id)));
const multi = scanIds.filter((id) => P.provInfo(id, META[id], O.origEntry(ALL, id, META)).scans.length > 1);
ok('a text made from several volumes lists each volume’s scan with its label', multi.length > 0 && multi.every((id) => P.provInfo(id, META[id], O.origEntry(ALL, id, META)).scans.every((s) => s.label)), multi.slice(0, 5));
ok('a text that is not a scan has no scan to search', ids.filter((id) => P.provKind(id, META[id]) !== 'scan').every((id) => P.provInfo(id, META[id], O.origEntry(ALL, id, META)).scans.length === 0));
ok('each kind has a sentence for the strip, naming where it is from, and a badge', ids.slice(0, 900).every((id) => { const i = P.provInfo(id, META[id], null); return P.provNotice(i).length > 10 && P.provBadge(i).length > 1; }));
ok('the scan sentence says the words are machine-read, that some are wrong and that the printed page numbers are not kept; the typed sentence says the words are checked', /Machine-read/.test(P.provNotice(P.provInfo('e-eck', META['e-eck'], null))) && /some words are wrong/.test(P.provNotice(P.provInfo('e-eck', META['e-eck'], null))) && /page numbers are not kept/.test(P.provNotice(P.provInfo('e-eck', META['e-eck'], null))) && /words are checked/.test(P.provNotice(P.provInfo('i-cth', META['i-cth'], null))));

/* the passage to find */
ok('a phrase is the first words, with verse markers, heading marks, quotation marks and punctuation gone', P.provPhrase('[[12]] “The eye wherein I see God,” is the same eye; wherein God sees me.') === 'The eye wherein I see God is the' &&P.provPhrase('## Heading\nOne two three four five six seven eight nine ten') === 'Heading One two three four five six seven' && P.provPhrase('') === '');
ok('a phrase is between 3 and 12 words, and a hyphenated or apostrophe word stays whole', P.provPhrase('a b c d e f g h i j k l m n', 99).split(' ').length === 12 && P.provPhrase('a b c d e f', 1).split(' ').length === 3 && P.provPhrase('God’s love-feast never ends') === "God's love-feast never ends" && P.provPhrase('‘Peace,’ he said') === 'Peace he said');
const eck = P.provInfo('e-eck', META['e-eck'], O.origEntry(ALL, 'e-eck', META));
const url = P.provFindURL(eck.scans[0], 'The eye wherein I see God is the same eye wherein God sees me');
ok('the search-inside link is the scan’s page with the first eight words as the query, and nothing else', /^https:\/\/archive\.org\/details\/[A-Za-z0-9._-]+\?q=The%20eye%20wherein%20I%20see%20God%20is%20the$/.test(url), url);
ok('no scan, no phrase, or an odd identifier gives no link (so nothing odd is ever put in an address)', P.provFindURL(null, 'abc def ghi') === '' && P.provFindURL(eck.scans[0], '') === '' && P.provFindURL({ id: 'a/b' }, 'abc def ghi') === '' && P.provFindURL({ id: 'a b' }, 'abc def ghi') === '' && P.provFindURL({ id: 'x?y=1' }, 'abc def ghi') === '');

/* the quotation */
const c = P.provCite('e-eck', 'Meister Eckhart, Sermons', 'Part 27 of 51 · Three things prevent our hearing', ' The eye wherein I see God\n is the same eye ', META['e-eck'], { entry: O.origEntry(ALL, 'e-eck', META) });
ok('a copied quotation has the words, the title and section, the edition as the Library gives it, and the source with its address', c.startsWith('“The eye wherein I see God is the same eye”\n— Meister Eckhart, Sermons, Part 27 of 51') && c.includes('Evans') && /Machine-read from a scan, Internet Archive: https:\/\/archive\.org\/details\/[A-Za-z0-9._-]+\.$/.test(c), c);
const c2 = P.provCite('i-cth', 'The Call of Cthulhu', '', 'The most merciful thing', META['i-cth'], {});
ok('a typed text says so and gives its source page; a missing section leaves no stray comma', /\n— The Call of Cthulhu\n/.test(c2) && /Typed from the printed book, Project Gutenberg: https:\/\/www\.gutenberg\.org\//.test(c2) && !/, \n|,\n/.test(c2), c2);
ok('a citation never has a blank line, an address that is not https, or a double full stop', [c, c2].every((s) => !/\n\n/.test(s) && !/http:\/\//.test(s) && !/\.\./.test(s)), [c, c2]);
ok('citing with nothing known still gives the words and the title', P.provCite('zz', '', '', 'Words', {}, {}) === '“Words”\n— zz', P.provCite('zz', '', '', 'Words', {}, {}));
/* a typed copy that names its printed edition (the texts once typed from a reading-edition site): the source, when it has one, is only where the same edition can be found */
{ const lic = 'Public domain (edition first published before 1929); a typed copy of the printed edition';
  const a = P.provInfo('x-copy', { license: lic, src: 'https://www.gutenberg.org/ebooks/3833' }, null); const b = P.provInfo('x-copy2', { license: lic, src: 'https://archive.org/details/xyz' }, null); const c = P.provInfo('x-copy3', { license: lic, src: '' }, null);
  ok('a typed copy is typed, a copy, and claims nothing about its page numbers', [a, b, c].every((i) => i.kind === 'typed' && i.copy === true && i.pageNumbers === 'none'), [a.kind, a.copy, a.pageNumbers]);
  ok('its sentence says the same edition is at the host, and says nothing about a web edition', /The same edition is at Project Gutenberg\./.test(P.provNotice(a)) && /The same edition is at Internet Archive\./.test(P.provNotice(b)) && ![a, b].some((i) => /web edition/.test(P.provNotice(i, true))), [P.provNotice(a), P.provNotice(b)]);
  ok('with no source it says no more than that the words are checked', P.provNotice(c) === 'Typed from the printed book. The words are checked, though spelling and punctuation may be tidied.' && !/web edition|same edition/.test(P.provNotice(c, true)), [P.provNotice(c), P.provNotice(c, true)]);
  const g = P.provInfo('x-gut', { license: 'Public domain (translation of 1900)', src: 'https://www.gutenberg.org/ebooks/1' }, null);
  ok('an ordinary typed text is not a copy and keeps its web-edition sentence', g.kind === 'typed' && g.copy === false && g.pageNumbers === 'web' && /web edition/.test(P.provNotice(g)), [g.kind, g.copy, P.provNotice(g)]); }
console.log(`source: ${pass} passed, ${fail} failed (${ids.length} texts: ${Object.entries(kinds).map(([k, n]) => k + ' ' + n).join(', ')}; ${scanIds.length - noScan.length} of ${scanIds.length} scans have a searchable Internet Archive scan)`);
process.exit(fail ? 1 : 0);
