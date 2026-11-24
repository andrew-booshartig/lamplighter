// Run: node tests/stamp.test.js — the release stamp (tools/stamp_lib.py, src/js/2y-release-core.js), zips named and made the same way every time (tools/make_release.py),
// the one-page handout (tools/kit_lib.py) and the torrent (tools/make_torrent.py), the last checked by an independent reader of the format.
const fs = require('fs'); const os = require('os'); const path = require('path'); const crypto = require('crypto'); const { execFileSync, spawnSync } = require('child_process');
const { M, render, badText } = require('./_harness');
let pass = 0, fail = 0; const ok = (n, c, x = '') => { if (c) pass++; else { fail++; console.log('FAIL', n, typeof x === 'string' ? x : JSON.stringify(x).slice(0, 400)); } };
const root = path.join(__dirname, '..'); const tools = path.join(root, 'tools');
const sha = (f, alg = 'sha256') => crypto.createHash(alg).update(fs.readFileSync(f)).digest('hex');

/* ── the words: a good stamp reads as a date and a code, and anything else (a build from the source, a hand-made object) reads as no stamp, with nothing it holds put in the page */
const good = { date: '2026-11-16', id: '3fa9c1', stamp: '2026-11-16-3fa9c1', app: 'a'.repeat(12), library: 'b'.repeat(12) };
ok('a stamp reads as "release 16 Nov 2026 · 3fa9c1"', M.releaseLabel(good) === 'release 16 Nov 2026 · 3fa9c1', M.releaseLabel(good));
ok('every month has its name', Array.from({ length: 12 }, (_, i) => M.releaseLabel({ date: `2026-${String(i + 1).padStart(2, '0')}-05`, id: 'abcdef', stamp: `2026-${String(i + 1).padStart(2, '0')}-05-abcdef` })).every((s, i) => s.startsWith('release 5 ' + ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i] + ' 2026')));
ok('a page with no stamp says so in plain words, and is not a stamp', /no release stamp/.test(M.releaseLabel(null)) && !M.releaseOk(null) && !M.releaseOk(undefined) && !M.releaseOk('2026-11-16-3fa9c1'));
const hostile = [{ date: '2026-11-16', id: '<script>', stamp: '2026-11-16-<script>' }, { date: '<img src=x>', id: '3fa9c1', stamp: '<img src=x>-3fa9c1' }, { date: '2026-11-16', id: '3FA9C1', stamp: '2026-11-16-3FA9C1' }, { date: '2026-11-16', id: '3fa9c1', stamp: 'something else' }, { date: '2026-11-16', id: '3fa9c1' }];
ok('a stamp that is not a date and six lowercase hex characters, or whose parts do not make its name, is refused and never reaches the page', hostile.every((r) => !M.releaseOk(r) && !/[<>]/.test(M.releaseLabel(r)) && !/[<>]/.test(M.releaseCopyLine(r))));
ok('the line to send someone is the stamp as it is in the zip’s name', M.releaseCopyLine(good) === 'The Lamplighter Project release 2026-11-16-3fa9c1' && /no release stamp/.test(M.releaseCopyLine(null)));

/* ── the pages: the Setup footer and the Freedom page use the stamp, not a fixed version number */
const setup = fs.readFileSync(path.join(root, 'src/js/67-setup.js'), 'utf8'); const util = fs.readFileSync(path.join(root, 'src/js/00-util.js'), 'utf8');
ok('Setup’s footer shows the release stamp, not APP.version', /\$\{APP\.name\} · \$\{releaseLabel\(APP\.release\)\} · runs entirely offline/.test(setup) && !/\$\{APP\.version\}/.test(setup));
ok('the app’s source has each stamp placeholder exactly once, so build.py cannot miss one', ["version: 'unstamped'", 'release: null'].every((p) => util.split(p).length === 2), util.slice(0, 240));
M.APP.release = good; const carry = render(['carry'], {}).body;
ok('Freedom → Take it with you says which copy this is: the stamp, a button that copies it, and what the stamp means', /Which copy is this\?/.test(carry) && carry.includes('release 16 Nov 2026 · 3fa9c1') && carry.includes('id="stampCopy"') && /Copies with the same stamp are the same release/.test(carry) && /SHA256SUMS\.txt/.test(carry), carry.slice(0, 200));
M.APP.release = null; const bare = render(['carry'], {}).body;
ok('a build from the source says it has no stamp and offers nothing to copy', /no release stamp/.test(bare) && !bare.includes('id="stampCopy"') && !badText(bare));
ok('the page that says which copy this is has no stray undefined or NaN', !badText(carry));

/* ── the stamp itself (tools/stamp_lib.py), on a small made-up project */
const py = (code, ...args) => spawnSync('python3', ['-I', '-c', 'import sys, json, pathlib\nsys.path.insert(0, ' + JSON.stringify(tools) + ')\nimport stamp_lib\n' + code, ...args], { encoding: 'utf8' });
const mk = () => fs.mkdtempSync(path.join(os.tmpdir(), 'beatlab-stamp-'));
const wr = (dir, f, s) => { fs.mkdirSync(path.dirname(path.join(dir, f)), { recursive: true }); fs.writeFileSync(path.join(dir, f), s); };
const proj = mk(); wr(proj, 'texts/index.js', 'a'); wr(proj, 'texts/x-one.js', 'one'); wr(proj, 'atlas/core.js', 'atlas'); wr(proj, 'similar/c.js', 's');
const state = path.join(proj, 'state.json');
const stamp = (today, css = 'css', js = "const APP = { version: 'unstamped', release: null };") => { const r = py('top = pathlib.Path(sys.argv[1]); print(json.dumps(stamp_lib.make(pathlib.Path("."), top, sys.argv[3], sys.argv[4], today=sys.argv[2], state_file=sys.argv[5])))', proj, today, css, js, state); if (r.status !== 0) throw new Error(r.stderr); return JSON.parse(r.stdout); };
const s1 = stamp('2026-11-16'); const s2 = stamp('2027-03-03');
ok('a stamp is a date, a six-character code and the two fingerprints it comes from', /^\d{4}-\d\d-\d\d$/.test(s1.date) && /^[0-9a-f]{6}$/.test(s1.id) && s1.stamp === s1.date + '-' + s1.id && /^[0-9a-f]{12}$/.test(s1.app) && /^[0-9a-f]{12}$/.test(s1.library), s1);
ok('the same files give the same stamp on another day: the date is the day it last changed, not the day of the build', s2.stamp === s1.stamp && s2.date === '2026-11-16', s2);
wr(proj, 'texts/x-one.js', 'one!'); const s3 = stamp('2026-12-01');
ok('changing one character of one text changes the code and moves the date', s3.id !== s1.id && s3.date === '2026-12-01' && s3.library !== s1.library && s3.app === s1.app, s3);
const s4 = stamp('2026-12-09', 'css2'); const s5 = stamp('2026-12-10', 'css2', "const APP = { version: 'unstamped', release: null }; // edited");
ok('changing the app’s style or script changes the code too', s4.id !== s3.id && s4.app !== s3.app && s4.library === s3.library && s5.id !== s4.id && s5.date === '2026-12-10');
wr(proj, 'texts/.hidden', 'x'); wr(proj, 'notes/readme.txt', 'x'); wr(proj, 'texts/sub/deep.js', 'x'); const s6 = stamp('2027-01-01', 'css2', "const APP = { version: 'unstamped', release: null }; // edited");
ok('files that do not ship (names starting with a dot, folders that are not library folders, subfolders) do not count', s6.stamp === s5.stamp, s6);
fs.renameSync(path.join(proj, 'texts/x-one.js'), path.join(proj, 'texts/x-two.js')); const s7 = stamp('2027-02-02', 'css2', "const APP = { version: 'unstamped', release: null }; // edited");
ok('renaming a file changes the code', s7.id !== s6.id);
const baked = py('js = "const APP = { name: \'The Lamplighter Project\', version: \'unstamped\', release: null, ns: \'x\' };"; rel = json.loads(sys.argv[1]); out = stamp_lib.bake(js, rel); print(out); p = pathlib.Path(sys.argv[2]); p.write_text("<html><script>" + out + "</script></html>"); r = stamp_lib.read_baked(p); print(json.dumps(r == rel)); print(json.dumps(stamp_lib.read_baked(pathlib.Path(sys.argv[2] + ".missing"))))', JSON.stringify(s7), path.join(proj, 'b.html'));
const bl = baked.stdout.trim().split('\n');
ok('bake puts the stamp into the version and the release record, and read_baked reads the same stamp back from the built page', bl[0].includes("version: '" + s7.stamp + "'") && bl[0].includes('release: {"date"') && !/unstamped|release: null/.test(bl[0]) && bl[1] === 'true' && bl[2] === 'null', baked.stdout + baked.stderr);
const refuse = py('try:\n    stamp_lib.bake("const APP = {};", {"stamp": "x"})\nexcept SystemExit as e:\n    print("refused", e)\ntry:\n    stamp_lib.bake("version: \'unstamped\', release: null; version: \'unstamped\', release: null", {"stamp": "x"})\nexcept SystemExit as e:\n    print("refused", e)');
ok('bake refuses an app source that lacks a placeholder, or has it twice, so a stamp never goes missing quietly', (refuse.stdout.match(/refused/g) || []).length === 2, refuse.stdout + refuse.stderr);
const names = py('print(json.dumps([stamp_lib.split_name("Lamplighter-pack-occult-2026-11-16-3fa9c1.zip"), stamp_lib.split_name("Lamplighter-everything.zip"), stamp_lib.split_name("Lamplighter-mine.zip"), stamp_lib.stamped_name("Lamplighter-everything-but-bibles.zip", "2026-11-16-3fa9c1")]))');
ok('zip names split into short name and stamp and back', JSON.stringify(JSON.parse(names.stdout)) === JSON.stringify([['Lamplighter-pack-occult.zip', '2026-11-16-3fa9c1'], ['Lamplighter-everything.zip', null], ['Lamplighter-mine.zip', null], 'Lamplighter-everything-but-bibles-2026-11-16-3fa9c1.zip']), names.stdout + names.stderr);
fs.rmSync(proj, { recursive: true, force: true });

/* ── the release: a small made-up project with a real catalogue, built with a stamp */
const first = (g) => M.LIB.find((l) => l.group === g).id;
const bible = first('hb'), occult = first('he'), tale = first('ta'), imag = first('im');
const tmp = mk(); const w = (f, s) => wr(tmp, f, s); const tmpState = path.join(tmp, 'state.json');
const ids = [bible, occult, tale, imag]; const meta = Object.fromEntries(ids.map((i) => [i, { title: 'T ' + i, by: 'x', license: 'Public domain', src: 'https://x', verse: false, note: '', n: 1, chars: 1000 }]));
w('atlas/core.js', '1'); w('similar/chunks.js', '2'); w('bibles/web-gen.js', '3'); w('dictionary/index.js', '5'); w('dictionary/w01.js', '6');
w('texts/index.js', 'BEATLAB_TEXTS.addIndex(' + JSON.stringify(meta) + ');\n'); ids.forEach((i) => w('texts/' + i + '.js', 'BEATLAB_TEXTS.add("' + i + '",{},[["s","body body body body body body body body"]]);'));
const bake = (today) => { const r = py('top = pathlib.Path(sys.argv[1]); js = "const APP = { name: \'The Lamplighter Project\', version: \'unstamped\', release: null, ns: \'x\' };"; rel = stamp_lib.make(pathlib.Path("."), top, "css", js, today=sys.argv[2], state_file=sys.argv[3]); (top / "Lamplighter.html").write_text("<html><script>" + stamp_lib.bake(js, rel) + "</script></html>"); print(rel["stamp"])', tmp, today, tmpState); if (r.status !== 0) throw new Error(r.stderr); return r.stdout.trim(); };
const stampA = bake('2026-11-16');
const outA = path.join(tmp, 'out'); const run = (out, ...a) => spawnSync('python3', ['-I', path.join(tools, 'make_release.py'), '--top=' + tmp, '--out=' + out, ...a], { encoding: 'utf8' });
const lsZ = (out) => fs.readdirSync(out).filter((f) => f.endsWith('.zip')).sort();
const rA = run(outA); const zA = lsZ(outA);
ok('every standard zip is named with the stamp', rA.status === 0 && zA.length === 14 && zA.every((z) => z.endsWith('-' + stampA + '.zip')) && zA.includes('Lamplighter-everything-' + stampA + '.zip') && zA.includes('Lamplighter-pack-occult-' + stampA + '.zip'), rA.stderr + zA.join());
const sums = fs.readFileSync(path.join(outA, 'SHA256SUMS.txt'), 'utf8').split('\n').filter(Boolean); const entries = sums.filter((l) => !l.startsWith('#')).map((l) => l.split('  '));
ok('the checksum list opens with a line saying what it is, names every zip with its stamp, and each checksum is right', sums[0].startsWith('# The Lamplighter Project') && entries.length === zA.length && entries.every(([h, n]) => zA.includes(n) && sha(path.join(outA, n)) === h), sums.slice(0, 3).join('|'));
const sc = spawnSync('shasum', ['-a', '256', '-c', 'SHA256SUMS.txt'], { cwd: outA, encoding: 'utf8' });
ok('shasum accepts the list as it is (the comment line does no harm)', sc.status === 0 && !/FAILED|improperly/.test(sc.stdout + sc.stderr), sc.stdout + sc.stderr);
const outB = path.join(tmp, 'outB'); const rB = run(outB);
ok('the same files make the same zips, byte for byte, every time', rB.status === 0 && lsZ(outB).join() === zA.join() && zA.every((z) => sha(path.join(outA, z)) === sha(path.join(outB, z))));
const list = (out, z) => execFileSync('unzip', ['-Z1', path.join(out, z)], { encoding: 'utf8' }).split('\n').filter(Boolean);
const zl = execFileSync('unzip', ['-Z', '-T', path.join(outA, 'Lamplighter-everything-' + stampA + '.zip')], { encoding: 'utf8' });
ok('every file in a zip is dated the release date, so unzipping does not stamp today’s date on them', zl.split('\n').filter((l) => /^-/.test(l)).every((l) => /20261116\.000000/.test(l)), zl.slice(0, 300));
const rd = (z, f) => execFileSync('unzip', ['-p', path.join(outA, z), 'Lamplighter/' + f], { encoding: 'utf8' });
const rm = rd('Lamplighter-everything-' + stampA + '.zip', 'READ ME FIRST.txt');
ok('the read-me inside says which release it is and how many texts, with no placeholder left', rm.includes('This is release ' + stampA) && rm.includes('Lamplighter-everything-' + stampA + '.zip') && /there are 4 texts/.test(rm) && /on disk: the app alone is about\s+[\d.]+ MB, with the map about\s+[\d.]+ MB, with the texts and the dictionary about\s+[\d.]+ MB, and everything/i.test(rm) && !/\{\{/.test(rm), rm.slice(0, 300));
ok('the Bibles pack’s read-me and the add-on packs say which release they were made for', /release 2026-11-16-/.test(rd('Lamplighter-pack-occult-' + stampA + '.zip', 'READ ME FIRST (' + JSON.parse(fs.readFileSync(path.join(tools, 'release_packs.json'), 'utf8')).packs.find((p) => p.slug === 'occult').collection + ' pack).txt')) && /release 2026-11-16-/.test(rd('Lamplighter-dictionary-pack-' + stampA + '.zip', 'READ ME FIRST (dictionary pack).txt')) && rd('Lamplighter-bibles-pack-' + stampA + '.zip', 'READ ME FIRST (Bibles pack).txt').includes(stampA));
const html = fs.readFileSync(path.join(outA, 'PASS IT ON.html'), 'utf8').replace(/<wbr>/g, '');      // (a long zip name may break before its stamp)
ok('the handout is one self-contained page: the stamp, the sizes of the zips that exist, the check commands, no web address, no leftover placeholder', html.includes('Release ' + stampA) && html.includes('Lamplighter-everything-' + stampA + '.zip') && html.includes('Lamplighter-sources-only-' + stampA + '.zip') && /shasum -a 256 -c SHA256SUMS\.txt/.test(html) && /certutil/.test(html) && !/https?:\/\//.test(html) && !/\{[a-z_]+\}|\{\{/.test(html.replace(/<style>[\s\S]*?<\/style>/, '')) && (html.match(/<h1>/g) || []).length === 1 && html.includes(sha(path.join(outA, 'Lamplighter-everything-' + stampA + '.zip'))), html.slice(0, 200));
ok('the handout says it needs nobody’s permission and where the licences are, and asks for nothing', /do not need anyone’s permission/.test(html) && /LICENSES\.txt/.test(html) && /no account, no payment, no advertising, no tracking/.test(html));

/* a changed library, a stale stamp, a new stamp */
w('texts/' + occult + '.js', 'BEATLAB_TEXTS.add("' + occult + '",{},[["s","a different body"]]);');
const outS = path.join(tmp, 'outS'); const rS = run(outS);
ok('zips are refused when the library has changed since Lamplighter.html was built, and the message says what to run', rS.status !== 0 && /python3 build\.py/.test(rS.stderr + rS.stdout) && /changed since/.test(rS.stderr + rS.stdout) && !fs.existsSync(outS));
const stampB = bake('2026-11-20'); const rC = run(outA);
ok('a new stamp for changed files, and the date is the day it changed', stampB !== stampA && /^2026-11-20-/.test(stampB) && rC.status === 0);
const zC = lsZ(outA);
ok('building the new release replaces the older zips of the same names, and the checksum list lists only what is there', zC.length === 14 && zC.every((z) => z.endsWith('-' + stampB + '.zip')) && /removed older releases/.test(rC.stdout) && fs.readFileSync(path.join(outA, 'SHA256SUMS.txt'), 'utf8').split('\n').filter((l) => l && !l.startsWith('#')).every((l) => zC.includes(l.split('  ')[1])));
const rD = run(outA, '--without=imagined', '--name=Lamplighter-mine.zip', '--no-bibles'); const rE = run(outA, '--pack=occult');
ok('a name you choose is kept as it is; a pack zip made by --pack is stamped like the rest', rD.status === 0 && fs.existsSync(path.join(outA, 'Lamplighter-mine.zip')) && rE.status === 0 && fs.existsSync(path.join(outA, 'Lamplighter-pack-occult-' + stampB + '.zip')));
const rF = run(outA, 'Lamplighter-with-map.zip');
ok('asking for a zip by its short name builds just that one', rF.status === 0 && /Lamplighter-with-map-/.test(rF.stdout) && !/Lamplighter-everything/.test(rF.stdout));
fs.writeFileSync(path.join(tmp, 'Lamplighter.html'), '<html></html>'); const rU = run(path.join(tmp, 'outU'));
ok('a page with no stamp is refused, and the message says to build first', rU.status !== 0 && /no release stamp/.test(rU.stderr + rU.stdout) && /build\.py/.test(rU.stderr + rU.stdout));
ok('--list-packs works without a stamp', run(path.join(tmp, 'outU'), '--list-packs').status === 0);
bake('2026-11-20');

/* ── the torrent, read back by a separate reader of the format */
function bdecode(buf) {
  let i = 0; const num = (end) => { const s = buf.indexOf(end, i); const n = Number(buf.slice(i, s).toString()); i = s + 1; return n; };
  const val = () => {
    const c = String.fromCharCode(buf[i]);
    if (c === 'i') { i++; return num(0x65); }
    if (c === 'l') { i++; const a = []; while (buf[i] !== 0x65) a.push(val()); i++; return a; }
    if (c === 'd') { i++; const o = {}; while (buf[i] !== 0x65) { const k = val().toString(); const start = i; o[k] = val(); if (k === 'info') o.__info = buf.slice(start, i); } i++; return o; }
    const n = num(0x3a); const b = buf.slice(i, i + n); i += n; return b;
  };
  return val();
}
const torrent = (out, ...a) => spawnSync('python3', ['-I', path.join(tools, 'make_torrent.py'), '--top=' + tmp, '--out=' + out, ...a], { encoding: 'utf8' });
const tA = torrent(outA, '--piece-kib=2'); const tfile = path.join(outA, 'Lamplighter-' + stampB + '.torrent'); const mfile = path.join(outA, 'Lamplighter-' + stampB + '.magnet.txt');
ok('make_torrent writes a .torrent and a magnet file named for the release', tA.status === 0 && fs.existsSync(tfile) && fs.existsSync(mfile), tA.stderr + tA.stdout);
const T = bdecode(fs.readFileSync(tfile)); const info = T.info; const flist = info.files.map((f) => f.path.map((p) => p.toString()).join('/'));
const expected = lsZ(outA).filter((z) => z.endsWith('-' + stampB + '.zip')).concat(['PASS IT ON.html', 'SHA256SUMS.txt']).sort();
ok('the torrent is named for the release and lists the release’s zips, the checksum list and the handout, and not the other zip nor itself', info.name.toString() === 'Lamplighter-' + stampB && JSON.stringify(flist) === JSON.stringify(expected) && !flist.includes('Lamplighter-mine.zip') && !flist.some((f) => /torrent|magnet/.test(f)), flist.join());
const pl = info['piece length']; const body = Buffer.concat(flist.map((f) => fs.readFileSync(path.join(outA, f)))); const pieces = []; for (let o = 0; o < body.length; o += pl) pieces.push(crypto.createHash('sha1').update(body.slice(o, o + pl)).digest());
ok('every piece hash is right (the pieces run across the files in the order listed) and the lengths add up', Buffer.compare(Buffer.concat(pieces), info.pieces) === 0 && info.files.reduce((n, f) => n + f.length, 0) === body.length && info.files.every((f, k) => f.length === fs.statSync(path.join(outA, flist[k])).size), `${pieces.length} pieces`);
const magnet = fs.readFileSync(mfile, 'utf8').trim(); const ih = crypto.createHash('sha1').update(T.__info).digest('hex');
ok('the magnet link names the info-hash of the exact bytes of the torrent’s info, and the torrent’s name', magnet.startsWith('magnet:?xt=urn:btih:' + ih) && magnet.includes('&dn=Lamplighter-' + stampB), magnet + ' ' + ih);
ok('a torrent made with no tracker and no web seed has neither, and says nothing it should not', T.announce === undefined && T['url-list'] === undefined && !/&tr=|&ws=/.test(magnet) && T['creation date'] === Date.UTC(2026, 10, 20) / 1000 && /The Lamplighter Project release/.test(T.comment.toString()));
const tB = torrent(outA, '--tracker=https://tracker.example/announce', '--tracker=udp://t2.example:80', '--webseed=https://mirror.example/beatlab'); const T2 = bdecode(fs.readFileSync(tfile)); const mg2 = fs.readFileSync(mfile, 'utf8');
ok('a tracker and a web seed given on the command line are in the torrent and the magnet link, the web seed as a folder address', tB.status === 0 && T2.announce.toString() === 'https://tracker.example/announce' && T2['announce-list'].length === 2 && T2['url-list'].map(String).join() === 'https://mirror.example/beatlab/' && /&tr=https%3A%2F%2Ftracker\.example%2Fannounce/.test(mg2) && /&ws=https%3A%2F%2Fmirror\.example%2Fbeatlab%2F/.test(mg2));
const keepA = fs.readFileSync(tfile); torrent(outA, '--tracker=https://tracker.example/announce', '--tracker=udp://t2.example:80', '--webseed=https://mirror.example/beatlab');
ok('the same files and options make the same torrent, byte for byte', Buffer.compare(keepA, fs.readFileSync(tfile)) === 0);
const outT = path.join(tmp, 'outT'); fs.mkdirSync(outT); for (const f of fs.readdirSync(outA)) if (!/torrent|magnet/.test(f)) fs.copyFileSync(path.join(outA, f), path.join(outT, f));
const victim = fs.readdirSync(outT).find((f) => f.startsWith('Lamplighter-with-map-')); fs.appendFileSync(path.join(outT, victim), 'x'); const tBad = torrent(outT);
ok('a zip that is not what the checksum list says stops the torrent, and the message names the zip', tBad.status === 1 && tBad.stderr.includes(victim) && !fs.existsSync(path.join(outT, 'Lamplighter-' + stampB + '.torrent')), tBad.stderr);
const outN = path.join(tmp, 'outN'); fs.mkdirSync(outN); const tNone = torrent(outN);
ok('with no zips of this release it stops and says to run make_release', tNone.status === 2 && /make_release/.test(tNone.stderr));
ok('--help explains the options', /--tracker/.test(torrent(outA, '--help').stdout) && /--webseed/.test(torrent(outA, '--help').stdout));
fs.rmSync(tmp, { recursive: true, force: true });
console.log(`stamp: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
