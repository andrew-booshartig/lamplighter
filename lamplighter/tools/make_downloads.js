#!/usr/bin/env node
/* Ready-made files for every library text, in a plain folder anyone can copy.

   The app builds an e-book, a text file or a Markdown file for a text when a reader presses Save (src/js/2z-export-core.js, called from the reader). This tool runs the very same code for every
   text in texts/ and writes the results as ordinary files, so a person can copy the folder to a USB stick, an e-reader or a school server and have every text as a file, with no app and no browser:

       downloads/epub/<shelf>/<Title> [<id>].epub      an e-book for any reading app or e-reader (with the printed page numbers and the pictures, where the text has them)
       downloads/txt/<shelf>/<Title> [<id>].txt        the words alone
       downloads/md/<shelf>/<Title> [<id>].md          Markdown, with headings and verse numbers
       downloads/index.html                            a page that lists everything, with a link to each file (open it in any browser)
       downloads/index.json                            the same list for programs: id, title, author, shelf, files, bytes
       downloads/READ ME.txt

   <shelf> is the Library collection the text belongs to ("01 The Bible", "05 India", ...), numbered so the folders sort the way the Library does. Nothing is fetched and nothing is uploaded: the
   files are built from texts/ alone, and a file is rebuilt only when its text (or the export code) is newer than it.

   Run:  node tools/make_downloads.js [--out=DIR] [--top=DIR] [--only=id1,id2] [--formats=epub,txt,md] [--force] [--list]
         --top=DIR   the project folder that holds texts/ (default: the folder above lamplighter/)       --out=DIR   where to write (default: <top>/downloads)
         --only=...  build just those texts                                                               --force     rebuild files that are up to date
         --list      say what would be built and how many files, and stop        --layout   print every text's shelf and file name as JSON, and stop */
'use strict';
const fs = require('fs'); const path = require('path'); const vm = require('vm');

const SRC = path.resolve(__dirname, '..');
const argv = process.argv.slice(2);
const opt = (n) => { const a = argv.find((x) => x.startsWith('--' + n + '=')); return a ? a.slice(n.length + 3) : null; };
const flag = (n) => argv.includes('--' + n);
if (flag('help') || flag('h')) { console.log(fs.readFileSync(__filename, 'utf8').match(/\/\*([\s\S]*?)\*\//)[1].replace(/^ {3}/gm, '')); process.exit(0); }
const TOP = path.resolve(opt('top') || path.join(SRC, '..'));
const OUT = path.resolve(opt('out') || path.join(TOP, 'downloads'));
const ONLY = (opt('only') || '').split(',').filter(Boolean);
const FORMATS = (opt('formats') || 'epub,txt,md').split(',').filter(Boolean);
for (const f of FORMATS) if (!['epub', 'txt', 'md'].includes(f)) { console.error('unknown format: ' + f + ' (epub, txt, md)'); process.exit(2); }
const TEXTS = path.join(TOP, 'texts');
if (!fs.existsSync(path.join(TEXTS, 'index.js'))) { console.error('no texts/index.js in ' + TOP + ': run python3 build.py and the text builders first'); process.exit(2); }

/* the app's own code, so the files are the ones the Save dialog makes */
const J = (f) => path.join(SRC, 'src/js', f);
globalThis.sha256 = require(J('00-util.js')).sha256;
Object.assign(globalThis, require(J('2p-marks-core.js')), require(J('2z-figures-core.js')), require(J('2z-pages-core.js')));
const X = require(J('2z-export-core.js'));
const { LIB } = require(J('24-data-path-lib.js'));
const g6 = fs.readFileSync(J('6g-library.js'), 'utf8'); const a6 = g6.indexOf('const LIB_COLLECTIONS ='); const b6 = g6.indexOf('\n];', a6);
const COLL = vm.runInNewContext('(' + g6.slice(a6 + 'const LIB_COLLECTIONS ='.length, b6 + 2) + ')', {});
const collOf = {}; COLL.forEach((c, i) => c[2].forEach((g) => { collOf[g] = i; }));
const LIB_BY = Object.fromEntries(LIB.map((l) => [l.id, l]));

const safe = (s, n) => String(s).replace(/[\\/:*?"<>|\u0000-\u001f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n).replace(/[ .]+$/, '');
const shelfName = (g) => { const i = collOf[g]; return i == null ? '99 More' : String(i + 1).padStart(2, '0') + ' ' + safe(COLL[i][0], 60); };
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const mib = (b) => (b >= 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB');

/* the library's data files, read the way the page reads them */
const T = { data: {}, meta: {}, add(id, m, s) { this.data[id] = { meta: m, secs: s }; this.meta[id] = Object.assign(this.meta[id] || {}, m); }, addIndex(i) { Object.assign(this.meta, i); } };
const ctx = vm.createContext({ BEATLAB_TEXTS: T });
const run = (f) => vm.runInContext(fs.readFileSync(path.join(TEXTS, f), 'utf8'), ctx, { filename: f });
run('index.js');
for (const slug of Object.keys(T.packs || {})) { try { run('pack-' + slug + '.js'); } catch (e) { /* a pack that is not here */ } }
try { run('figs.js'); } catch (e) { /* no pictures listed */ }
try { run('pgs.js'); } catch (e) { /* no printed pages listed */ }
if (flag('layout')) {      /* where each text sits in the folders (used by tools/fetch_originals.py, so the two folders have the same shelves and names) */
  const lay = {}; for (const id of Object.keys(T.meta)) { const l = LIB_BY[id]; lay[id] = { title: l ? l.title : (T.meta[id].title || id), shelf: shelfName(l ? l.group : ''), name: safe(l ? l.title : (T.meta[id].title || id), 110) + ' [' + id + ']' }; }
  fs.writeSync(1, JSON.stringify(lay)); process.exit(0);
}
const FIGN = ctx.BEATLAB_FIGN || {}; const PAGEN = ctx.BEATLAB_PAGEN || {};

const ids = Object.keys(T.meta).filter((id) => fs.existsSync(path.join(TEXTS, id + '.js'))).filter((id) => !ONLY.length || ONLY.includes(id)).sort();
const missing = ONLY.filter((id) => !ids.includes(id));
if (missing.length) console.error('not found in texts/: ' + missing.join(', '));
if (flag('list')) { console.log(ids.length + ' texts × ' + FORMATS.length + ' formats = ' + ids.length * FORMATS.length + ' files, into ' + OUT); process.exit(0); }

const exportMtime = Math.max(...['2z-export-core.js', '2z-figures-core.js', '2z-pages-core.js'].map((f) => fs.statSync(J(f)).mtimeMs));
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const index = {}; let built = 0; let kept = 0; let failed = 0; const t0 = Date.now();
  for (let k = 0; k < ids.length; k++) {
    const id = ids[k];
    try {
      const l = LIB_BY[id]; const title = l ? l.title : (T.meta[id].title || id); const shelf = shelfName(l ? l.group : '');
      const srcFile = path.join(TEXTS, id + '.js'); const srcTime = Math.max(fs.statSync(srcFile).mtimeMs, exportMtime);
      const rel = {}; const todo = [];
      for (const f of FORMATS) {
        const r = path.join(f, shelf, safe(title, 110) + ' [' + id + '].' + f); rel[f] = r.split(path.sep).join('/');
        const full = path.join(OUT, r); fs.mkdirSync(path.dirname(full), { recursive: true });
        if (!flag('force') && fs.existsSync(full) && fs.statSync(full).mtimeMs >= srcTime) kept++; else todo.push(f);
      }
      if (todo.length) {
        run(id + '.js'); const t = T.data[id]; if (!t) throw new Error('the file did not define the text'); const secs = t.secs; const n = secs.length; const m = t.meta;
        const fz = FIGN[id]; let figs = [];
        if (fz && !(fz[2] && (fz[2] !== m.chars || (fz[3] && fz[3] !== n)))) { try { run('fig-' + id + '.js'); figs = figClean((ctx.BEATLAB_FIGS || {})[id] || [], n); } catch (e) { figs = []; } }
        let pages = null; const e = PAGEN[id];
        if (e && pgmFits(e, T.meta[id])) { try { run('pg-' + id + '.js'); const rows = (ctx.BEATLAB_PAGES || {})[id]; const pgx = rows ? pgmClean(rows, n) : null; if (pgx && pgx.flat.length) pages = { map: pgx.map, vols: e[4] > 1 ? Array.from({ length: e[4] }, (_, v) => 'Vol. ' + (v + 1)) : [] }; } catch (e2) { pages = null; } }
        const book = { id, title, author: m.by || '', rights: m.license || '', source: m.src || '', note: m.note || '' };
        const o = { marks: null, verses: true }; if (pages) o.pages = pages;
        for (const f of todo) {
          const full = path.join(OUT, rel[f]);
          if (f === 'epub') fs.writeFileSync(full, Buffer.from(await X.expEpub(book, secs, figs.length ? Object.assign({}, o, { figs }) : o)));
          else if (f === 'txt') fs.writeFileSync(full, X.expPlain(book, secs, o), 'utf8');
          else fs.writeFileSync(full, X.expMarkdown(book, secs, o), 'utf8');
          built++;
        }
        delete T.data[id]; if (ctx.BEATLAB_FIGS) delete ctx.BEATLAB_FIGS[id]; if (ctx.BEATLAB_PAGES) delete ctx.BEATLAB_PAGES[id];
      }
      const bytes = {}; for (const f of FORMATS) bytes[f] = fs.statSync(path.join(OUT, rel[f])).size;
      index[id] = { title, by: T.meta[id].by || '', shelf, when: l ? l.when : '', files: rel, bytes };
    } catch (err) { failed++; console.error('FAILED ' + id + ': ' + err.message); }
    if ((k + 1) % 50 === 0 || k + 1 === ids.length) console.log((k + 1) + ' / ' + ids.length + ' texts · ' + built + ' files built, ' + kept + ' already up to date' + (failed ? ', ' + failed + ' failed' : '') + ' · ' + Math.round((Date.now() - t0) / 1000) + ' s');
  }

  /* the list: a page for people, a file for programs, a note for the folder */
  const byShelf = {}; for (const id of Object.keys(index)) (byShelf[index[id].shelf] = byShelf[index[id].shelf] || []).push(id);
  const shelves = Object.keys(byShelf).sort(); let total = 0; for (const id of Object.keys(index)) for (const f of FORMATS) total += index[id].bytes[f];
  const row = (id) => { const e = index[id]; return `<li><b>${esc(e.title)}</b>${e.when ? ` <span class="w">${esc(e.when)}</span>` : ''}<br>${FORMATS.map((f) => `<a href="${esc(e.files[f].split('/').map(encodeURIComponent).join('/'))}">${f.toUpperCase()}</a> <span class="w">${mib(e.bytes[f])}</span>`).join(' · ')}</li>`; };
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>The Lamplighter Project: every text as a file</title>
<style>body{font:16px/1.5 system-ui,sans-serif;max-width:60rem;margin:2rem auto;padding:0 1rem;color:#1d1d1f;background:#fff}@media(prefers-color-scheme:dark){body{color:#e8e8ea;background:#16161a}a{color:#8ab4ff}}h1{font-size:1.5rem}h2{margin-top:2rem;border-bottom:1px solid #8884}ul{list-style:none;padding:0}li{margin:.6rem 0}.w{color:#888;font-size:.85em}</style></head><body>
<h1>The Lamplighter Project: every text as a file</h1><p>${Object.keys(index).length} texts, each as an e-book (EPUB), a plain text file (TXT) and Markdown (MD). Copy this whole folder to keep them. The files are the same ones the app makes when you press Save on a text; where a text has printed page numbers or pictures, the e-book keeps them. ${FORMATS.length} formats, ${mib(total)} in all.</p>
${shelves.map((s) => `<h2>${esc(s.replace(/^\d+ /, ''))} <span class="w">(${byShelf[s].length})</span></h2><ul>${byShelf[s].sort((x, y) => index[x].title.localeCompare(index[y].title)).map(row).join('')}</ul>`).join('\n')}
</body></html>
`;
  fs.writeFileSync(path.join(OUT, 'index.html'), html, 'utf8');
  fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify({ app: 'The Lamplighter Project', formats: FORMATS, texts: index }), 'utf8');
  fs.writeFileSync(path.join(OUT, 'READ ME.txt'), `The Lamplighter Project: every text as a file
==============================================

This folder holds every text of the library as ordinary files, so you can copy it to a USB stick, an e-reader, a phone or a school server and read the texts with no app and no browser.

  epub/   an e-book for any reading app or e-reader (chapters, contents, the printed page numbers and the pictures where the text has them)
  txt/    the words alone
  md/     Markdown, with headings and verse numbers
  index.html   open this in any web browser for a list of everything with a link to each file

Inside each folder the texts sit on shelves named like the Library's collections. A file is called "<Title> [<id>]"; the id is the text's name inside the app.

Every text here is public domain or openly licensed; the licence and source of each are written at the front of its file and in texts/LICENSES.txt. Made by tools/make_downloads.js from the texts/ folder; nothing was fetched.
`, 'utf8');
  console.log('done: ' + Object.keys(index).length + ' texts, ' + built + ' files built, ' + kept + ' already up to date, ' + failed + ' failed, ' + mib(total) + ' in ' + FORMATS.join('/') + ' · ' + OUT);
  process.exit(failed ? 1 : 0);
})();
