// Run: node tests/rename.test.js — the app is called The Lamplighter Project (short form Lamplighter); it used to be called Beatlab.
// Checks: the name and where it shows (title, header, manifest, built page), that nothing stored or shared under the old name stops working (the storage key, old backups,
// old text packs), and that no new mention of the old name sneaks into the source or the built page except the few identifiers that must keep it.
// Run python3 build.py first: it reads dist/Lamplighter.html.
const fs = require('fs'); const path = require('path');
globalThis.sha256 = require('../src/js/00-util.js').sha256;
const MK = require('../src/js/2p-marks-core.js'); Object.assign(globalThis, MK);
const O = require('../src/js/2z-own-core.js'); const N = require('../src/js/2y-name-core.js');
let pass = 0, fail = 0; const ok = (n, c, x = '') => { if (c) pass++; else { fail++; console.log('FAIL', n, typeof x === 'string' ? x : JSON.stringify(x).slice(0, 600)); } };
const root = path.join(__dirname, '..'); const top = path.join(root, '..');
const rd = (f) => fs.readFileSync(path.join(root, f), 'utf8');

/* ── the name, and the name it had */
const util = rd('src/js/00-util.js');
const app = { name: (util.match(/const APP = \{ name: '([^']*)'/) || [])[1], short: (util.match(/short: '([^']*)'/) || [])[1], legacy: (util.match(/legacy: \[([^\]]*)\]/) || [])[1], ns: (util.match(/ns: '([^']*)'/) || [])[1] };
ok('the app is called The Lamplighter Project, short form Lamplighter', app.name === 'The Lamplighter Project' && app.short === 'Lamplighter', app);
ok('the old name is kept as a legacy name, so things made under it can still be read', /'Beatlab'/.test(app.legacy || ''), app);
ok('the browser-storage key is unchanged: renaming must not make anyone’s notes disappear', app.ns === 'beatlab.v1.', app);
ok('the page name, the file people double-click, is Lamplighter.html', /Lamplighter\.html/.test(rd('build.py')) && !/Beatlab\.html/.test(rd('build.py')));

/* ── a backup made under the old name still imports; one made now says the new name */
const A = { name: 'The Lamplighter Project', legacy: ['Beatlab'] };
ok('a backup that says Beatlab (made before the rename) is accepted', N.backupOk({ app: 'Beatlab', data: { x: 1 } }, A));
ok('a backup that says The Lamplighter Project is accepted', N.backupOk({ app: 'The Lamplighter Project', data: {} }, A));
ok('anything else is refused: another app, no data, not an object, nothing', ![{ app: 'Other', data: {} }, { app: 'Beatlab' }, { app: 'Beatlab', data: 'x' }, { app: 'Beatlab', data: null }, 'Beatlab', 5, null, undefined, []].some((d) => N.backupOk(d, A)));
ok('with no legacy list only the current name is accepted', !N.backupOk({ app: 'Beatlab', data: {} }, { name: 'The Lamplighter Project' }) && N.backupOk({ app: 'The Lamplighter Project', data: {} }, { name: 'The Lamplighter Project' }));
const setup = rd('src/js/6zzf-data.js');      /* Export all and Import live with the Your data page (they were in 67-setup.js) */
ok('Export all writes the current name and Import asks the helper', /name: APP\.name/.test(setup) && /backupOk\(d, APP\)/.test(setup));

/* ── a text pack made under the old name still opens; a new one says the new name */
const sha = (s) => 'h' + String(s).length + ':' + require('crypto').createHash('sha256').update(String(s)).digest('hex').slice(0, 16);
const recs = [{ title: 'A small text', by: 'Someone', note: '', secs: [['One', 'Some words in a paragraph.\n\nAnd a second paragraph.']] }];
const made = O.ownPackMake(recs, sha, { now: Date.UTC(2026, 10, 16) });
ok('a new text pack says The Lamplighter Project', made.app === 'The Lamplighter Project' && made.kind === 'texts', made.app);
ok('and reads back', O.ownPackRead(JSON.parse(JSON.stringify(made)), sha).ok);
const old = JSON.parse(JSON.stringify(made)); old.app = 'Beatlab';
ok('a pack made under the old name still reads back', O.ownPackRead(old, sha).ok, O.ownPackRead(old, sha).error);
const other = JSON.parse(JSON.stringify(made)); other.app = 'Something else';
ok('a pack from another app is refused, and the message uses the new name', !O.ownPackRead(other, sha).ok && /Lamplighter/.test(O.ownPackRead(other, sha).error), O.ownPackRead(other, sha).error);

/* ── where the name shows */
const manifest = JSON.parse(rd('web/manifest.webmanifest'));
ok('the web manifest: full name for the install page, short form for the home-screen label', /^The Lamplighter Project/.test(manifest.name) && manifest.short_name === 'Lamplighter', manifest);
const core = rd('src/js/50-core.js');
ok('the narrow places use the short form: the side header and the tab title', /<div>Lamplighter\$\{/.test(core) && /concat\('Lamplighter'\)/.test(core));
ok('the service worker lists the new page name', /Lamplighter\.html/.test(rd('web/sw.js')) && !/Beatlab\.html/.test(rd('web/sw.js')));
const built = path.join(root, 'dist', 'Lamplighter.html');
ok('the built page exists as dist/Lamplighter.html (run python3 build.py first)', fs.existsSync(built));
const page = fs.existsSync(built) ? fs.readFileSync(built, 'utf8') : '';
ok('its tab title is the full name', /<title>The Lamplighter Project<\/title>/.test(page));
ok('and it carries the name for the footer', /const APP = \{ name: 'The Lamplighter Project'/.test(page));
ok('the old page name is not built any more', !fs.existsSync(path.join(root, 'dist', 'Beatlab.html')));

/* ── the old name is only where it must be. Each pattern is an identifier that stored data or a file in someone’s hands depends on, or the old name kept on purpose. */
const KEEP = [
  /BEATLAB[_\-][A-Za-z_\-]*/g,                        // data-file globals (BEATLAB_TEXTS…) and the pack format marker BEATLAB-PACK
  /beatlab\\?\.v1[\w.\\]*/g,                          // the browser-storage key
  /beatlab-(?:own|data-|shell-|seed|packs-|merge-|stamp-)/g,   // IndexedDB name, cache prefixes, seed salt, temp-folder names
  /(?<![\w])beatlab:/g, /@beatlab\b/g, /\.beatlab\b/g,         // calendar uid seed and suffix, the pack file extension
  /Beatlab(?:Plates|Originals|Figures)\//g,           // the fetch tools’ user-agent names
  /window\.Beatlab\b/g,                               // the page’s own namespace
  /app: 'beatlab'/g,                                  // the presets file marker
  /legacy: \['Beatlab'\]/g, /pack\.app !== 'Beatlab'/g,   // the old name, kept so old backups and packs still open
  /The app was called Beatlab before it became The Lamplighter Project\./g,   // the one sentence that explains the legacy name (src/js/2y-name-core.js)
];
const stray = (text) => { let t = text; KEEP.forEach((r) => { t = t.replace(r, ''); }); return t; };
const lines = [];
const walk = (d, pick) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) { if (!/^(__pycache__|node_modules|cache)$/.test(e.name)) walk(p, pick); } else if (pick(p)) lines.push(p); } };
['src', 'tools', 'web', 'release'].forEach((d) => walk(path.join(root, d), (p) => /\.(js|css|py|txt|yml|json|webmanifest|md)$/.test(p) && fs.statSync(p).size < 8e6));
lines.push(path.join(root, 'build.py'));
const left = [];
for (const f of lines) { fs.readFileSync(f, 'utf8').split('\n').forEach((l, i) => {
  if (/LEGACY_PREFIX/.test(l)) return;          // the old zip prefix (tools/stamp_lib.py)
  if (/beatlab/i.test(stray(l))) left.push(path.relative(root, f) + ':' + (i + 1) + ': ' + l.trim().slice(0, 120)); }); }
ok('no mention of Beatlab is left in src/, tools/, web/, release/ or build.py except the identifiers that must keep it (write "The Lamplighter Project" or "Lamplighter")', left.length === 0, left.slice(0, 8).join('\n'));
ok('the built page has none either', !/beatlab/i.test(stray(page)), (stray(page).match(/.{40}beatlab.{40}/i) || [''])[0]);

/* ── old zips are older releases of the new ones, so the next release replaces them */
const { spawnSync } = require('child_process');
const sl = spawnSync('python3', ['-I', '-c', 'import sys\nsys.path.insert(0, ' + JSON.stringify(path.join(root, 'tools')) + ')\nimport stamp_lib\nfor n in ["Beatlab-everything-2026-11-16-00e6b9.zip", "Lamplighter-everything-2026-11-17-aaaaaa.zip", "Beatlab-pack-occult.zip"]: print(*stamp_lib.split_name(n))'], { encoding: 'utf8' });
const sp = sl.stdout.trim().split('\n').map((l) => l.split(' '));
ok('Beatlab-everything-<stamp>.zip counts as an older release of Lamplighter-everything-<stamp>.zip, so a new release removes it', sp[0] && sp[0][0] === 'Lamplighter-everything.zip' && sp[1][0] === 'Lamplighter-everything.zip' && sp[2][0] === 'Lamplighter-pack-occult.zip', sl.stdout + sl.stderr);

console.log(`rename: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
