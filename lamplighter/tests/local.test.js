// Run: node tests/local.test.js — the sources' own files kept on this computer (originals/, src/js/2z-local-core.js, src/js/6zr-local.js): the list the page reads can only show files that are inside
// that folder, in the shape tools/fetch_originals.py writes; the links are encoded, kinds and sizes are named, and the page code asks for nothing but its own folder.
const fs = require('fs'); const path = require('path');
const L = require('../src/js/2z-local-core.js');
let pass = 0; let fail = 0; const ok = (n, c, x = '') => { if (c) pass++; else { fail++; console.log('FAIL', n, typeof x === 'string' ? x : JSON.stringify(x).slice(0, 300)); } };

ok('paths inside the folder pass, anything else does not', L.localPathOk('05 India/One [x-one]/Part 1 - PDF.pdf') && ['../x.pdf', '/etc/passwd', 'a/../b', 'a\\b', 'http://x/y.pdf', 'a#b', 'a?b', 'a//b', '', null, 5, 'javascript:alert(1)', 'a\u0000b'].every((p) => !L.localPathOk(p)));
ok('a link is encoded part by part', L.localUrl('05 India/A & B [x-ab]/Part 1 - PDF (100%).pdf') === 'originals/05%20India/A%20%26%20B%20%5Bx-ab%5D/Part%201%20-%20PDF%20(100%25).pdf', L.localUrl('05 India/A & B [x-ab]/Part 1 - PDF (100%).pdf'));
ok('kinds are named from the file', L.localKind('a/b.PDF') === 'PDF' && L.localKind('a/b.epub') === 'EPUB' && L.localKind('a/b.txt') === 'Full text' && L.localKind('a/b.djvu') === 'DjVu' && L.localKind('a/b.mobi') === 'Kindle' && L.localKind('a/b.html') === 'Web page' && L.localKind('a/b.xyz') === 'File' && L.localKind('noext') === 'File');
ok('sizes read plainly', L.localSize(900) === '1 KB' && L.localSize(2048) === '2 KB' && L.localSize(5 * 1048576) === '5 MB' && L.localSize(3 * 1073741824) === '3.0 GB');
const raw = { 'a-ada': [['Part 1 - PDF of the scan', '13 Shamanic/Travels [a-ada]/Part 1 - PDF of the scan.pdf', 61942796], ['Part 1 - EPUB', '13 Shamanic/Travels [a-ada]/Part 1 - EPUB.epub', 16725964], ['evil', '../../x.pdf', 1], ['evil2', 'http://evil/x', 1], null, 'x', ['', 'x/y.txt', -5]], 'constructor': [['a', 'a/b.pdf', 1]], '__proto__': [['a', 'a/b.pdf', 1]], 'UPPER': [['a', 'a/b.pdf', 1]], 'x-none': [['a', '../b', 1]], 'x-str': 'not a list', 'x-ok': [['<img src=x onerror=alert(1)>', 'a/b.pdf', 'many']] };
const c = L.localClean(raw);
ok('only safe files of safe ids remain', Object.keys(c).sort().join() === 'a-ada,x-ok' && c['a-ada'].length === 3 && c['a-ada'][0].bytes === 61942796 && c['a-ada'][2].label === 'y.txt' && c['a-ada'][2].bytes === 0 && c['x-ok'][0].bytes === 0, Object.keys(c));
ok('the cleaned list has no prototype to find "constructor" in', Object.getPrototypeOf(c) === null && !('constructor' in c) && !('__proto__' in c));
ok('damaged lists give nothing', [null, undefined, 5, 'x', [], true].every((x) => Object.keys(L.localClean(x)).length === 0));
ok('a list is capped, and so is a text\'s files', Object.keys(L.localClean(Object.fromEntries(Array.from({ length: 9000 }, (_, i) => ['x-' + i, [['a', 'a/b.pdf', 1]]])))).length === L.LOCAL_LIMITS.texts && L.localClean({ 'x-t': Array.from({ length: 100 }, (_, i) => ['f' + i, 'a/f' + i + '.pdf', 1]) })['x-t'].length === L.LOCAL_LIMITS.files);
const links = L.localLinks(c['a-ada']);
ok('the links name what each file is, with its size', links.length === 3 && links[0].kind === 'PDF' && links[0].size === '59 MB' && links[0].url.startsWith('originals/13%20Shamanic/') && links[1].kind === 'EPUB' && links[2].size === '', links);
ok('no files, no links', L.localLinks(undefined).length === 0 && L.localLinks([]).length === 0);

/* the page code */
const src = fs.readFileSync(path.join(__dirname, '..', 'src/js/6zr-local.js'), 'utf8'); const code = src.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1');
ok('the page code makes no request of its own and loads the list through the library loader', !/\bfetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon|createElement\s*\(\s*['"]script|new Image|https?:\/\//.test(code) && /TXT\.script\('\.\.\/originals\/index'\)/.test(code));
ok('it cleans the list, and every link it draws opens in a new tab saying noopener noreferrer', /localClean\(globalThis\.BEATLAB_LOCAL\)/.test(code) && /target="_blank" rel="noopener noreferrer"/.test(code) && /esc\(l\.url\)/.test(code));
ok('it adds a card under "Where this text comes from" and only for a text that has files', /provCardHTML = function/.test(code) && /LOCAL\.has\(id\)/.test(code));
console.log(`local: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
