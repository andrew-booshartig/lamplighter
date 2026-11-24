#!/usr/bin/env python3
"""Make the zip files people download, with a checksum list, into <project>/release/. Each unzips to one folder called Lamplighter. Nothing is uploaded.
Every zip's name carries the release stamp (a date and a six-character code worked out from every file: tools/stamp_lib.py), such as Lamplighter-everything-2026-11-16-3fa9c1.zip, the same
stamp the app shows in Setup. The names below are the short ones. The stamp comes from Lamplighter.html, so build.py must have been run since the library last changed (this stops, and says so, if not).
The zips are made the same way every time (fixed file dates, fixed order), so the same files give the same zip, the same checksum and the same torrent. A zip of an older release is removed when
its newer one is made. Also written: SHA256SUMS.txt, and PASS IT ON.html (a one-page handout to print). tools/make_torrent.py then makes a torrent and a magnet link for the folder.
   Lamplighter-app-only.zip          the app alone (opens, but no texts, map, dictionary or similar passages)
   Lamplighter-with-map.zip          + the map and catalogue (the study half)
   Lamplighter-with-texts.zip        + every readable text and the dictionary (everything except Find similar and the Bibles pack)
   Lamplighter-everything-but-bibles.zip   + Find similar passages
   Lamplighter-bibles-pack.zip       the Bibles pack alone: unzip it next to Lamplighter.html
   Lamplighter-dictionary-pack.zip   the dictionary alone (Webster's 1913, 20 MB): unzip it next to Lamplighter.html to add it to a copy without one
   Lamplighter-downloads-pack.zip    every text as an e-book, a text file and Markdown (the downloads/ folder, tools/make_downloads.js): unzip it next to Lamplighter.html; made only if downloads/ is there
   Lamplighter-originals-pack.zip    the sources' own scans, e-books and full texts (the originals/ folder, tools/fetch_originals.py): only with --with-originals, and only what has been fetched; stored, not recompressed
   Lamplighter-everything.zip        all of it
   Lamplighter-sources-only.zip      the study library without the OPTIONAL SHELVES (occult, Freemasonry, shamanic, folklore, folk tales, the imagined shelf): map, texts, Find similar
   Lamplighter-pack-<name>.zip       one optional shelf alone (occult, freemasonry, shamanic, folklore, folk-tales, imagined): unzip it next to Lamplighter.html to add it
Leaving things out. Every Library collection is a PACK of texts (tools/release_packs.json: short name, collection, whether it is optional). A copy without some packs has a trimmed
texts/index.js that lists them (BEATLAB_TEXTS.packs), so the Library says what the copy leaves out and finds a pack the moment it is unzipped beside it (src/js/6c-texts.js).
   python3 -I tools/make_release.py --list-packs                       what each pack holds
   python3 -I tools/make_release.py --without=occult,imagined          Lamplighter-custom.zip: everything except those packs (any pack in the list; add --no-bibles, --no-similar or --no-dictionary to drop those too)
   python3 -I tools/make_release.py --pack=india,occult                a pack zip for any collection
Other options: --out=FOLDER (default <project>/release), --name=FILE.zip (for --without; a name you choose is used as it is, without a stamp), --top=FOLDER (a project folder to take the files from, for tests); zip names
on the command line (the short ones, or with the stamp) build only those of the standard zips.
Run: python3 -I tools/make_release.py [options] [zip names...]   (the standard set takes a few minutes: about 450 MB of text is compressed several times)"""
import hashlib, json, pathlib, re, subprocess, sys, zipfile

here = pathlib.Path(__file__).resolve().parent
src = here.parent


def opt(name, default=None):
    for a in sys.argv[1:]:
        if a.startswith('--' + name + '='): return a[len(name) + 3:]
    return default


flag = lambda name: ('--' + name) in sys.argv[1:]
args = [a for a in sys.argv[1:] if not a.startswith('--')]
top = pathlib.Path(opt('top')) if opt('top') else src.parent
out = pathlib.Path(opt('out')) if opt('out') else top / 'release'
rel = src / 'release'
texts_dir = top / 'texts'


# ── the packs: the Library's collections, by short name (tools/packs_lib.py, shared with make_site.py)
sys.path.insert(0, str(here))
import packs_lib, stamp_lib, kit_lib
K = packs_lib.Packs(src, top)
cat, meta, PACKS, BY_SLUG, OPTIONAL = K.cat, K.meta, K.packs, K.by_slug, K.optional
pack_ids, index_js = K.ids, packs_lib.index_js


def list_packs():
    print('\n'.join(K.listing()))


# ── the release stamp: from Lamplighter.html (put there by build.py), and only if the library has not changed since
STAMP = DATE = None
if not flag('list-packs'):
    stamp_rec = stamp_lib.read_baked(top / 'Lamplighter.html')
    if stamp_rec is None: sys.exit('Lamplighter.html carries no release stamp (it was built before stamps, or not built). Run python3 build.py first, then this again.')
    if stamp_lib.data_hash(top)[:12] != stamp_rec['library']:
        sys.exit(f"the library files have changed since Lamplighter.html was built (it says release {stamp_rec['stamp']}). Run python3 build.py first, so the stamp in the app is the one in the zips' names; then this again.")
    STAMP, DATE = stamp_rec['stamp'], stamp_rec['date']


def rough(n):
    """a size in plain words: 2.7 MB, 780 MB (to the nearest 10 above 10 MB)"""
    mb = n / 1e6
    return f'{mb:.1f} MB' if mb < 10 else f'{round(mb / 10) * 10:.0f} MB'


def disk_size(*kinds):
    return sum(p.stat().st_size for k in kinds for p, _, _ in files_of(k))


def readme_bytes(path):
    """a read-me from release/, with this release's numbers put in where it has {{STAMP}}, {{TEXTS}} and the sizes on disk ({{DISK_APP}}, {{DISK_MAP}}, {{DISK_TEXTS}}, {{DISK_ALL}}), so none has to be kept by hand"""
    app = (top / 'Lamplighter.html').stat().st_size if (top / 'Lamplighter.html').exists() else 0
    nums = {'STAMP': STAMP or '', 'TEXTS': str(len(meta)), 'DISK_APP': rough(app), 'DISK_MAP': rough(app + disk_size('atlas')), 'DISK_TEXTS': rough(app + disk_size('atlas', 'texts', 'dictionary')),
            'DISK_ALL': rough(app + disk_size('atlas', 'texts', 'dictionary', 'similar', 'bibles'))}
    t = path.read_text(encoding='utf8')
    for k, v in nums.items(): t = t.replace('{{' + k + '}}', v)
    return t.encode('utf8')


# ── what goes in a zip: (path on disk, name in the zip, bytes instead of a file)
def files_of(kind):
    d = top / kind
    return [(p, f'Lamplighter/{kind}/{p.name}', None) for p in sorted(d.iterdir()) if p.is_file() and not p.name.startswith('.')] if d.is_dir() else []


def tree_of(kind):
    """a folder with folders inside it (downloads/, originals/): every file, in a fixed order, under Lamplighter/<kind>/ (hidden files and half-fetched .part files stay out)"""
    d = top / kind
    return [(p, f'Lamplighter/{kind}/' + p.relative_to(d).as_posix(), None) for p in sorted(d.rglob('*')) if p.is_file() and not any(x.startswith('.') for x in p.relative_to(d).parts) and not p.name.endswith('.part')] if d.is_dir() else []


def texts_without(slugs):
    """the texts folder minus the packs named: their text files and picture files go, and index.js is rewritten without them (and says which packs may be added later)"""
    if not slugs: return files_of('texts')
    drop = K.drop_ids(slugs); items = []
    for p in sorted(texts_dir.iterdir()):
        if not p.is_file() or p.name.startswith('.') or p.name == 'index.js' or K.file_dropped(p.name, drop): continue
        items.append((p, f'Lamplighter/texts/{p.name}', None))
    items.append((None, 'Lamplighter/texts/index.js', K.trimmed_index(slugs).encode('utf8')))
    return items


def pack_zip_items(slug):
    ids = pack_ids(slug); name = BY_SLUG[slug]['collection']; mb = sum(meta[i].get('chars', 0) for i in ids) / 1e6; items = []
    for i in ids:
        for fn in (f'{i}.js', f'fig-{i}.js', f'pg-{i}.js'):
            if (texts_dir / fn).exists(): items.append((texts_dir / fn, f'Lamplighter/texts/{fn}', None))
    items.append((None, f'Lamplighter/texts/pack-{slug}.js', index_js({i: meta[i] for i in ids}).encode('utf8')))
    note = (f'THE LAMPLIGHTER PROJECT: the "{name}" pack\n{"=" * (len(name) + 36)}\n\n{len(ids)} texts, about {mb:.0f} MB of text.\n\n'
            'This is an optional pack of texts for the Lamplighter Project. Unzip it next to Lamplighter.html: it holds one folder, Lamplighter, with a texts folder inside; let it merge with the texts folder you have.\n'
            'The Lamplighter Project finds it the next time it opens. It works with a copy that was made without this pack (for example Lamplighter-sources-only.zip); a full copy already has these texts.\n'
            'To leave something out of what you read and search without deleting it, use "Leave areas out" in the Library, the passage picker and the search box.\n'
            f'\nThis pack was made for release {STAMP}: use it with a copy of the same release (Setup shows the stamp at the bottom).\n')
    items.append((None, f'Lamplighter/READ ME FIRST ({name} pack).txt', note.encode('utf8')))
    return items


base = ([(top / 'Lamplighter.html', 'Lamplighter/Lamplighter.html', None)] + ([(None, 'Lamplighter/READ ME FIRST.txt', readme_bytes(rel / 'READ ME FIRST.txt'))] if (rel / 'READ ME FIRST.txt').exists() else [])
        + [(rel / f, f'Lamplighter/{f}', None) for f in ('LICENSE-CODE.txt', 'LICENSE-CONTENT.txt') if (rel / f).exists()])
bibles_readme = [(None, 'Lamplighter/READ ME FIRST (Bibles pack).txt', readme_bytes(rel / 'READ ME FIRST.txt'))] if (rel / 'READ ME FIRST.txt').exists() else []
dict_note = ('THE LAMPLIGHTER PROJECT: the dictionary pack\n============================================\n\nWebster\'s Revised Unabridged Dictionary (1913), about 113,000 entries, 20 MB. Public domain, from Project Gutenberg eBook #29765.\n\n'
             'Unzip it next to Lamplighter.html: it holds one folder, Lamplighter, with a dictionary folder inside; let it merge with the folder you have. The Lamplighter Project finds it the next time it opens, and "Look up" in the reader, the Glossary page and the search box then define any word.\n'
             'Nothing is fetched or sent: the dictionary is a few script files that load from this folder. It leaves out the old word histories and the quotations. It is a book of its time, with old words and old views.\n'
             f'\nThis pack was made for release {STAMP}: use it with a copy of the same release (Setup shows the stamp at the bottom).\n').encode('utf8')
dict_readme = [(None, 'Lamplighter/READ ME FIRST (dictionary pack).txt', dict_note)] if (top / 'dictionary').is_dir() else []
dl_note = ('THE LAMPLIGHTER PROJECT: the downloads pack\n=========================================\n\nEvery text of the library as an e-book (epub/), a plain text file (txt/) and Markdown (md/), on shelves named like the Library\'s collections, with index.html listing them all.\n'
           'Unzip it next to Lamplighter.html: it holds one folder, Lamplighter, with a downloads folder inside. You can also open downloads/index.html in any browser, or copy the files to an e-reader. Nothing is fetched or sent.\n'
           f'\nThis pack was made for release {STAMP}: its files are the ones Save makes for the texts of that release.\n').encode('utf8')
dl_readme = [(None, 'Lamplighter/READ ME FIRST (downloads pack).txt', dl_note)] if (top / 'downloads').is_dir() else []
og_note = ('THE LAMPLIGHTER PROJECT: the originals pack\n==========================================\n\nThe sources\' own files for the library\'s texts (the PDF of the scan, the source\'s own EPUB, the plain full text), exactly as the Internet Archive, Project Gutenberg and the other sources publish them, in originals/<shelf>/<title [id]>/, with index.html listing them.\n'
           'Unzip it next to Lamplighter.html: it holds one folder, Lamplighter, with an originals folder inside. The reader\'s "Where this text comes from" card then offers the copy on this computer. Nothing is fetched or sent.\n'
           f'\nMade from what had been fetched when release {STAMP} was made; it may hold only some kinds or some shelves.\n').encode('utf8')
og_readme = [(None, 'Lamplighter/READ ME FIRST (originals pack).txt', og_note)] if (top / 'originals').is_dir() else []
STANDARD = {
    'Lamplighter-app-only.zip': lambda: base,
    'Lamplighter-with-map.zip': lambda: base + files_of('atlas'),
    'Lamplighter-with-texts.zip': lambda: base + files_of('atlas') + files_of('texts') + files_of('dictionary'),
    'Lamplighter-everything-but-bibles.zip': lambda: base + files_of('atlas') + files_of('texts') + files_of('similar') + files_of('dictionary'),
    'Lamplighter-bibles-pack.zip': lambda: files_of('bibles') + bibles_readme,
    'Lamplighter-dictionary-pack.zip': lambda: (files_of('dictionary') + dict_readme) if dict_readme else [],
    'Lamplighter-downloads-pack.zip': lambda: (tree_of('downloads') + dl_readme) if dl_readme else [],
    'Lamplighter-everything.zip': lambda: base + files_of('atlas') + files_of('texts') + files_of('similar') + files_of('bibles') + files_of('dictionary'),
    'Lamplighter-sources-only.zip': lambda: base + files_of('atlas') + texts_without(OPTIONAL) + files_of('similar') + files_of('dictionary'),
}
for s in OPTIONAL: STANDARD[f'Lamplighter-pack-{s}.zip'] = (lambda s=s: pack_zip_items(s))
if flag('with-originals'): STANDARD['Lamplighter-originals-pack.zip'] = lambda: (tree_of('originals') + og_readme) if og_readme else []      # off unless asked: the folder can be 100 GiB

if flag('list-packs'):
    list_packs(); sys.exit(0)

wanted = {}      # zip name (with the stamp, unless you chose the name) -> items maker
custom = False
sn = lambda base: stamp_lib.stamped_name(base, STAMP)
if opt('without'):
    slugs = [s for s in opt('without').split(',') if s]; [pack_ids(s) for s in slugs]; custom = True
    wanted[opt('name') or sn('Lamplighter-custom.zip')] = (lambda: base + files_of('atlas') + texts_without(slugs) + ([] if flag('no-similar') else files_of('similar')) + ([] if flag('no-bibles') else files_of('bibles')) + ([] if flag('no-dictionary') else files_of('dictionary')))
if opt('pack'):
    custom = True
    for s in [s for s in opt('pack').split(',') if s]:
        pack_ids(s); wanted[sn(f'Lamplighter-pack-{s}.zip')] = (lambda s=s: pack_zip_items(s))
if not custom:
    only = {stamp_lib.split_name(a)[0] for a in args}
    wanted = {sn(n): f for n, f in STANDARD.items() if not only or n in only}

def write_zip(target, items, stored=False):
    """the same files always give the same zip: entries in the order given, every one dated the release date, the same permissions. stored: the files are kept as they are (the originals are PDFs and e-books, already compressed)"""
    y, m, d = (int(x) for x in DATE.split('-')); when = (max(y, 1980), m, d, 0, 0, 0); kind = zipfile.ZIP_STORED if stored else zipfile.ZIP_DEFLATED
    with zipfile.ZipFile(target, 'w', kind, compresslevel=None if stored else 6, allowZip64=True) as z:
        for p, arc, data in items:
            zi = zipfile.ZipInfo(arc, date_time=when); zi.compress_type = kind; zi.external_attr = 0o644 << 16
            if data is None and p.stat().st_size > 64 * 1048576:
                with p.open('rb') as src_f, z.open(zi, 'w', force_zip64=True) as dst_f:
                    while True:
                        chunk = src_f.read(1 << 20)
                        if not chunk: break
                        dst_f.write(chunk)
            else:
                z.writestr(zi, p.read_bytes() if data is None else data, compresslevel=None if stored else 6)


out.mkdir(parents=True, exist_ok=True)
sums = {}; removed = []
for name, make in wanted.items():
    items = make(); target = out / name
    if not items:
        print(f'{name}: nothing to put in it (its folder is not here), skipped'); continue
    write_zip(target, items, stored='originals-pack' in name)
    sums[name] = stamp_lib.file_sha256(target); print(f'{name}: {target.stat().st_size/1048576:.1f} MiB, {len(items)} files')
    base_name, st = stamp_lib.split_name(name)
    if st:      # an older release of the same zip (or one from before there were stamps) is replaced by this one
        for f in sorted(out.glob('*.zip')):
            if f.name != name and stamp_lib.split_name(f.name)[0] == base_name:
                f.unlink(); removed.append(f.name)
if removed: print('removed older releases of the same zips: ' + ', '.join(removed))
if sums or removed:
    old = {}
    sf = out / 'SHA256SUMS.txt'
    if sf.exists():
        for line in sf.read_text().splitlines():
            if '  ' in line and not line.startswith('#'): h, n = line.split('  ', 1); old[n] = h
    old.update(sums)
    old = {n: h for n, h in old.items() if (out / n).exists()}      # nothing is listed that is not there
    sf.write_text('# The Lamplighter Project: each zip is named for the release it belongs to (date and code). Check what you have with:  shasum -a 256 -c SHA256SUMS.txt\n' + ''.join(f'{h}  {n}\n' for n, h in sorted(old.items())))
    print('wrote SHA256SUMS.txt (check with: shasum -a 256 -c SHA256SUMS.txt)')
if not custom:
    have = {n: (out / n).stat().st_size for n in (sn(b) for b, _ in kit_lib.KINDS) if (out / n).exists()}
    rows = [(sn(b), have[sn(b)], w) for b, w in kit_lib.KINDS if sn(b) in have]
    if rows:
        ev = stamp_lib.file_sha256(out / rows[0][0])
        (out / 'PASS IT ON.html').write_text(kit_lib.handout_html(STAMP, len(meta), rows, ev), encoding='utf8')
        print('wrote PASS IT ON.html (a one-page handout to print)')
    print(f'release {STAMP}. To share the folder with no website: python3 -I tools/make_torrent.py')
