// Run: node tests/gg-name.test.js — Global Grey ebooks lets its books be hosted elsewhere only when all its branding (the logo and the website name) has been removed from the files
// (globalgreyebooks.com/terms-conditions.html, read 17 November 2026). So nothing the Lamplighter Project ships may name the site or link its pages: not a text, the text index, the licence list,
// the original-pages sidecar, the app code or the built page. The 94 texts typed from its pages carry the licence line "a typed copy of the printed edition" and, as src, the address of the same printed edition on Project Gutenberg or the Internet Archive (or none).
// Run python3 build.py first for the built page; the texts folder is skipped if absent.
const fs = require('fs'); const path = require('path'); const vm = require('vm');
let pass = 0, fail = 0; const ok = (n, c, x = '') => { if (c) pass++; else { fail++; console.log('FAIL', n, typeof x === 'string' ? x : JSON.stringify(x).slice(0, 600)); } };
const root = path.join(__dirname, '..'); const top = path.join(root, '..'); const NAME = /global ?grey/i;
const TYPED = /; a typed copy of the printed edition$/;

/* the app: its code and the page built from it */
const walk = (d, f) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => { const p = path.join(d, e.name); if (e.isDirectory()) walk(p, f); else f(p); });
const code = []; walk(path.join(root, 'src'), (p) => { if (/\.(js|css|html)$/.test(p) && NAME.test(fs.readFileSync(p, 'utf8'))) code.push(path.relative(root, p)); });
ok('no file of the app’s source names Global Grey', code.length === 0, code);
const built = path.join(root, 'dist', 'Lamplighter.html');
if (fs.existsSync(built)) ok('the built page does not name Global Grey', !NAME.test(fs.readFileSync(built, 'utf8')));
else console.log('dist/Lamplighter.html not built; skipping that check (run python3 build.py)');
ok('the build tools write no address and no name for the texts typed from its pages', (() => { const t = fs.readFileSync(path.join(root, 'tools/texts_gg.py'), 'utf8'); return /LICENSE = '[^']*; a typed copy of the printed edition'/.test(t) && /src=EDITIONS\.get\(lid, ''\), verse=/.test(t) && !/LICENSE = '[^']*Global Grey/.test(t); })());

/* the texts folder */
const dir = path.join(top, 'texts');
if (!fs.existsSync(path.join(dir, 'index.js'))) { console.log('texts folder not built; skipping the rest'); }
else {
  const hits = fs.readdirSync(dir).filter((f) => /\.(js|txt)$/.test(f) && NAME.test(fs.readFileSync(path.join(dir, f), 'utf8')));
  ok('no file in texts/ (a text, the index, the licence list, the original-pages sidecar) names Global Grey or links its pages', hits.length === 0, hits.slice(0, 8));
  const T = { meta: {}, addIndex(i) { Object.assign(this.meta, i); }, add() {} }; vm.runInNewContext(fs.readFileSync(path.join(dir, 'index.js'), 'utf8'), { BEATLAB_TEXTS: T });
  const typed = Object.entries(T.meta).filter(([, m]) => TYPED.test(m.license));
  const EDITION = /^https:\/\/(www\.gutenberg\.org\/ebooks\/\d+|archive\.org\/details\/[A-Za-z0-9._-]+)$/;
  ok('the typed copies are there, each with the address of the same edition at Project Gutenberg or the Internet Archive, or none, and no address in its licence line', typed.length > 0 && typed.every(([, m]) => (m.src === '' || EDITION.test(m.src)) && !/https?:/.test(m.license)), typed.filter(([, m]) => m.src !== '' && !EDITION.test(m.src)).map(([i]) => i).slice(0, 5));
  ok('no other text has an empty src', Object.entries(T.meta).filter(([, m]) => !m.src && !TYPED.test(m.license)).length === 0, Object.entries(T.meta).filter(([, m]) => !m.src && !TYPED.test(m.license)).map(([i]) => i).slice(0, 5));
  const lic = fs.readFileSync(path.join(dir, 'LICENSES.txt'), 'utf8');
  const blocks = lic.split(/\n\n/).filter((b) => TYPED.test(b.split('\n')[1] ? b.split('\n')[1].trim() : ''));
  ok('in the licence list a typed copy has its title line, its credit line and, if it has one, the address of its edition', blocks.length === typed.length && blocks.every((b) => { const L = b.trim().split('\n'); const id = L[0].split(/\s+/)[0]; const m = T.meta[id]; return m && L.length === (m.src ? 3 : 2) && (!m.src || L[2].trim() === m.src); }), [blocks.length, typed.length]);
}
console.log(`gg-name: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
