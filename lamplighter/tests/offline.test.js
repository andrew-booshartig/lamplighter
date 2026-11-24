// Run: node tests/offline.test.js — keeping the Lamplighter Project offline (src/js/2z-offline-core.js and web/sw.js): the manifest is made safe so only files of the site's own five data folders can ever be
// fetched, sizes read in plain words, a page from a file is told it needs no service worker, and the service worker file follows the rules it promises (same origin only, nothing but GET, a
// cache that is cleaned up, no web address of any other site in it).
const fs = require('fs'); const path = require('path');
const O = require('../src/js/2z-offline-core.js');
let pass = 0; let fail = 0; const ok = (n, c, x = '') => { if (c) pass++; else { fail++; console.log('FAIL', n, typeof x === 'string' ? x : JSON.stringify(x).slice(0, 300)); } };
const good = { v: '2026-11-15.abc', files: { atlas: [['atlas/a.js', 1000], ['atlas/b.js', 2000]], texts: [['texts/index.js', 50000], ['texts/b-gen.js', 200000]], bibles: [['bibles/kjv-gen.js', 5000]], similar: [['similar/chunks.js', 5000000]], dictionary: [['dictionary/index.js', 1000], ['dictionary/w01.js', 1100000]] } };
{
  const m = O.offManifestClean(good);
  ok('a good manifest keeps the five folders, in the order offered, with counts and sizes', m.groups.map((g) => g.id).join() === 'atlas,texts,bibles,similar,dictionary' && m.groups[4].count === 2 && m.groups[4].bytes === 1101000 && m.groups[1].count === 2 && m.groups[1].bytes === 250000 && m.v === '2026-11-15.abc', m);
  ok('every kind has a name and a line saying what it is', O.OFF_KINDS.length === 5 && O.OFF_KINDS.some((k) => k.id === 'dictionary') && O.OFF_KINDS.every((k) => k.name && k.what.length > 20));
  const evil = { v: '<x>../..', files: { texts: [['https://evil.example/x.js', 5], ['//evil.example/x.js', 5], ['texts/../../etc/passwd', 5], ['/texts/a.js', 5], ['texts/a b.js', 5], ['atlas/x.js', 5], ['texts/ok.js', 12.6], ['texts/ok.js', 7], ['texts/', 1], ['texts/' + 'x'.repeat(200), 1], [5, 5], null, 'x', ['javascript:alert(1)', 1], ['texts\\a.js', 1], ['texts/a.js?x=1', 1], ['texts/a.js#h', 1]], __proto__: [['texts/p.js', 1]], constructor: [['texts/c.js', 1]] } };
  const e = O.offManifestClean(evil); const files = e.groups.flatMap((g) => g.files);
  ok('only plain file names directly inside the folder can pass: no web addresses, no ..., no query strings, no other folder, no repeats', files.length === 1 && files[0][0] === 'texts/ok.js' && files[0][1] === 13, files);
  ok('the build id has only safe characters', e.v === '..' || /^[A-Za-z0-9._-]*$/.test(e.v), e.v);
  ok('names from the object prototype are not folders', !e.groups.some((g) => ['__proto__', 'constructor'].includes(g.id)));
  ok('a wrong-shaped manifest is an empty one', [null, undefined, 5, 'x', [], {}, { files: 5 }, { files: [] }, { files: { texts: 'x' } }, { files: { texts: {} } }].every((v) => O.offManifestClean(v).groups.length === 0));
  ok('a huge file list is cut, so a hostile manifest cannot make the page try for ever', O.offManifestClean({ files: { texts: Array.from({ length: 9000 }, (_, i) => ['texts/f' + i + '.js', 1]) } }).groups[0].count === 5000);
}
{
  ok('sizes read in plain words', O.offFmt(0) === '1 KB' && O.offFmt(400) === '1 KB' && O.offFmt(12345) === '12 KB' && O.offFmt(1500000) === '1.5 MB' && O.offFmt(65800000) === '66 MB' && O.offFmt(1.4e8) === '140 MB' && O.offFmt(2.5e9) === '2.50 GB' && O.offFmt(-5) === '1 KB' && O.offFmt('x') === '1 KB');
  const g = O.offManifestClean(good).groups[1]; const have = new Set(['texts/index.js']);
  ok('what is missing is the files not in the cache, and what is saved is their size', O.offMissing(g, have).length === 1 && O.offMissing(g, have)[0][0] === 'texts/b-gen.js' && O.offSavedBytes(g, have) === 50000 && O.offSavedBytes(g, new Set()) === 0);
  ok('a group is saved, partly saved or not saved', O.offState(g, new Set(g.files.map((f) => f[0]))) === 'saved' && O.offState(g, have) === 'part' && O.offState(g, new Set()) === 'none');
  ok('progress is a whole percent between 0 and 100, and safe with nothing to do', O.offPct(50, 200) === 25 && O.offPct(300, 200) === 100 && O.offPct(-5, 200) === 0 && O.offPct(5, 0) === 0 && O.offPct(NaN, NaN) === 0);
}
{
  ok('a page opened from a file or an ordinary web address that is not secure is not offered a service worker; https and this computer are', !O.offHostedOk({ protocol: 'file:' }) && !O.offHostedOk({ protocol: 'http:', hostname: 'example.com' }) && !O.offHostedOk(null) && !O.offHostedOk({}) && O.offHostedOk({ protocol: 'https:', hostname: 'example.com' }) && O.offHostedOk({ protocol: 'http:', hostname: 'localhost' }) && O.offHostedOk({ protocol: 'http:', hostname: '127.0.0.1' }) && !O.offHostedOk({ protocol: 'http:', hostname: 'localhost.evil.com' }));
}
/* the service worker file itself */
const swPath = path.join(__dirname, '../web/sw.js');
if (fs.existsSync(swPath)) {
  const sw = fs.readFileSync(swPath, 'utf8'); const code = sw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  ok('the service worker never names a web address of any site (it works only with the address it was served from)', !/https?:\/\//i.test(code), code.match(/https?:\/\/[^\s'"]*/));
  ok('it answers only GET requests, and only for its own origin', /(req|request)\.method\s*!==\s*'GET'/.test(code) && /\.origin\s*!==\s*(self\.)?location\.origin/.test(code));
  ok('it has an install step, an activate step that removes old caches, and a fetch step', /addEventListener\('install'/.test(code) && /addEventListener\('activate'/.test(code) && /caches\.delete/.test(code) && /addEventListener\('fetch'/.test(code));
  ok('it sends nothing anywhere but the site it came from: no beacons, sockets or form posts', !/sendBeacon|WebSocket|EventSource|method:\s*'POST'/i.test(code));
  ok('it keeps the pages it opens and the small files it fetches, and leaves the big libraries to be saved on purpose', /MAX_RUNTIME/.test(code) && /content-length/i.test(code));
  ok('a new version of the app replaces the old one the next time it is online (pages are fetched from the network first)', /fetch\(req/.test(code) && /navigate/.test(code));
} else { ok('web/sw.js exists', false, swPath); }
const mf = path.join(__dirname, '../web/manifest.webmanifest');
if (fs.existsSync(mf)) {
  const m = JSON.parse(fs.readFileSync(mf, 'utf8'));
  ok('the web app manifest names the app, starts at its own page, opens like an app, and has icons of the sizes browsers ask for', m.name && m.short_name && m.start_url === './' && m.display === 'standalone' && ['192x192', '512x512'].every((s) => (m.icons || []).some((i) => i.sizes === s && /png$/.test(i.src))) && (m.icons || []).some((i) => i.purpose === 'maskable'), m);
  ok('every icon it names is a file that exists, and none is a web address', (m.icons || []).every((i) => !/^[a-z]+:/i.test(i.src) && fs.existsSync(path.join(__dirname, '../web', i.src))), (m.icons || []).map((i) => i.src));
} else { ok('web/manifest.webmanifest exists', false); }
console.log(`offline: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
