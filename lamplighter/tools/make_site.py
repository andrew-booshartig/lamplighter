#!/usr/bin/env python3
"""Assemble the website copy of the Lamplighter Project into one folder that any static host can serve (GitHub Pages, GitLab Pages, Codeberg Pages, Netlify, Cloudflare Pages, or a Raspberry Pi):
   index.html (the app), sw.js, manifest.webmanifest, icons/, offline-manifest.json, atlas/ texts/ bibles/ similar/ dictionary/, books/index.js (an empty catalogue), .nojekyll, _headers, robots.txt, 404.html, and the licence and read-me files.
It copies (using hard links where it can, so it costs no extra disk) and refuses to run if any file is over 25 MiB (Cloudflare Pages' limit) or a folder is missing.
Nothing is uploaded: this only builds the folder. Run: python3 -I tools/make_site.py [output folder] [options]   (default folder: <project>/site)
Options, for a host with a size limit (GitHub Pages: a published site up to 1 GB, and a repository best under 1 GB):
   --without=occult,imagined   leave those packs of texts out of the site (tools/release_packs.json; python3 -I tools/make_release.py --list-packs). The site's texts/index.js lists them,
                               the Library says what the site leaves out, and the same packs stay available as zips (Lamplighter-pack-<name>.zip) for anyone who wants the whole library.
   --optional                  shorthand for leaving out every optional pack (occult, freemasonry, shamanic, folklore, folk-tales, imagined)
   --top=FOLDER                take the files from another project folder (for tests)
   --limit-mib=N               stop, naming the biggest folders, if the folder comes to more than N MiB (use 1000 for GitHub Pages). It also warns when the folder is within 10% of N.
   --url=https://ADDRESS       the public address of the site. Adds to index.html (not to the app, which names no address of its own) the tags a shared link needs: og:title, og:description (the page's own
                               <meta name="description">), og:type, og:url, og:image (icons/share.png, 1200 x 630, tools/make_share_image.py) and twitter:card, so that Facebook and other apps show a picture, a
                               name and a sentence instead of a bare address. Without it the site has no share preview, and a warning says so."""
import html as htmllib, json, os, pathlib, re, shutil, subprocess, sys

here = pathlib.Path(__file__).resolve().parent
src = here.parent                      # lamplighter/
opt = lambda name: next((a[len(name) + 3:] for a in sys.argv[1:] if a.startswith('--' + name + '=')), None)
top = pathlib.Path(opt('top')) if opt('top') else src.parent      # the project folder, next to Lamplighter.html (--top=FOLDER takes the files from another folder, for tests)
plain = [a for a in sys.argv[1:] if not a.startswith('--')]
out = pathlib.Path(plain[0]) if plain else top / 'site'
without = [s for s in (opt('without') or '').split(',') if s]
limit_mib = float(opt('limit-mib')) if opt('limit-mib') else None
url = opt('url')
LIMIT = 25 * 1024 * 1024

def need(p):
    if not p.exists(): sys.exit(f'missing {p}: run python3 build.py first')
    return p

def put(a, b):
    b.parent.mkdir(parents=True, exist_ok=True)
    if b.exists(): b.unlink()
    try: os.link(a, b)
    except OSError: shutil.copy2(a, b)

if out.exists():
    shutil.rmtree(out)
out.mkdir(parents=True)
need(top / 'Lamplighter.html'); need(top / 'sw.js'); need(top / 'manifest.webmanifest'); need(top / 'offline-manifest.json'); need(top / 'icons')

def share_tags(page, address):
    """The tags a shared link needs, built from the page's own description and the stage word (FEEDBACK_STAGE in 2z-feedback-core.js). The address must be https and plain: it ends up in attributes."""
    if not re.fullmatch(r'https://[A-Za-z0-9.-]+(:[0-9]+)?(/[A-Za-z0-9._~/-]*)?', address): sys.exit('--url must be the public https address of the site, such as https://lamplighter.pages.dev (letters, digits, dots, hyphens and slashes only)')
    base = address.rstrip('/')
    d = re.search(r'<meta name="description" content="([^"]*)"', page)
    if not d: sys.exit('the page has no <meta name="description">: run python3 build.py first')
    if not (top / 'icons' / 'share.png').exists(): sys.exit('icons/share.png is missing: run python3 build.py first (web/icons/share.png, made by tools/make_share_image.py)')
    st = re.search(r"const FEEDBACK_STAGE = '([a-z]+)'", (src / 'src' / 'js' / '2z-feedback-core.js').read_text(encoding='utf8'))
    q = lambda v: htmllib.escape(v, quote=True)
    rows = [('property', 'og:site_name', 'The Lamplighter Project'), ('property', 'og:title', 'The Lamplighter Project' + (f' ({st.group(1)})' if st else '')), ('property', 'og:description', None), ('property', 'og:type', 'website'),
            ('property', 'og:url', base + '/'), ('property', 'og:image', base + '/icons/share.png'), ('property', 'og:image:width', '1200'), ('property', 'og:image:height', '630'),
            ('property', 'og:image:alt', 'The Lamplighter Project: a point of gold on black'), ('name', 'twitter:card', 'summary_large_image')]
    return ''.join(f'<meta {k}="{n}" content="{d.group(1) if v is None else q(v)}">\n' for k, n, v in rows)

if url:
    page = (top / 'Lamplighter.html').read_text(encoding='utf8')
    if '<title>' not in page: sys.exit('the page has no <title>: run python3 build.py first')
    (out / 'index.html').write_text(page.replace('<title>', share_tags(page, url) + '<title>', 1), encoding='utf8')      # a new file, not a link: the shared Lamplighter.html must stay as it is
else:
    put(top / 'Lamplighter.html', out / 'index.html')
put(top / 'Lamplighter.html', out / 'Lamplighter.html')
for f in ('sw.js', 'manifest.webmanifest', 'offline-manifest.json'):
    put(top / f, out / f)
for f in (top / 'icons').iterdir():
    put(f, out / 'icons' / f.name)
n = 0; drop = set(); K = None
if '--optional' in sys.argv[1:] or without:
    sys.path.insert(0, str(here)); import packs_lib
    K = packs_lib.Packs(src, top)
    if '--optional' in sys.argv[1:]: without = sorted(set(without) | set(K.optional))
    drop = K.drop_ids(without)
for kind in ('atlas', 'texts', 'bibles', 'similar', 'dictionary'):
    for f in sorted(need(top / kind).iterdir()):
        if f.is_file() and not f.name.startswith('.'):
            if kind == 'texts' and without and (f.name == 'index.js' or K.file_dropped(f.name, drop)): continue
            put(f, out / kind / f.name); n += 1
if without:
    (out / 'texts').mkdir(parents=True, exist_ok=True); (out / 'texts' / 'index.js').write_text(K.trimmed_index(without), encoding='utf8')
    subprocess.run([sys.executable, '-I', str(here / 'make_offline_manifest.py'), str(out)], check=True, capture_output=True)      # the "Save for offline" list must name only files this site has
rel = src / 'release'
for f in ('READ ME FIRST.txt', 'LICENSE-CODE.txt', 'LICENSE-CONTENT.txt'):
    if (rel / f).exists(): put(rel / f, out / f)
(out / '.nojekyll').write_text('')
(out / 'robots.txt').write_text('User-agent: *\nAllow: /\n')
# the app looks once for a books/ folder beside the page (tools/add_books.js writes its catalogue, books/index.js). A website has none, and a missing file shows in the browser's console as a 404 and a
# refused script on every first visit. This is the catalogue of an empty folder, which the app reads exactly as it reads "no folder" (nothing on the shelf), so its one look gets a plain answer.
(out / 'books').mkdir(exist_ok=True)
(out / 'books' / 'index.js').write_text('/* an empty books/ folder: see tools/make_site.py */\nglobalThis.BEATLAB_BOOKS = { v: 1, books: [] };\n', encoding='utf8')
# a 404 page of its own. A site without one is taken by Cloudflare Pages for a single-page app: any path that is not a file is answered with index.html and a 200, so the optional lists the app
# looks for (originals/index.js; books/index.js has an empty catalogue of its own below) would each come back as the whole 3 MB page, read as a script. With this file a missing file is a plain 404, as on a host that has no such rule.
(out / '404.html').write_text('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Not found · The Lamplighter Project</title>'
                              '<body style="margin:0;padding:2rem;background:#070a11;color:#eee6d2;font:16px/1.5 system-ui,sans-serif"><h1 style="font-size:1.25rem;font-weight:600">There is nothing at this address</h1>'
                              '<p><a href="/" style="color:#ffd07a">Open the Lamplighter Project</a></p></body></html>\n', encoding='utf8')
(out / '_headers').write_text('/sw.js\n  Cache-Control: no-cache\n/index.html\n  Cache-Control: no-cache\n/offline-manifest.json\n  Cache-Control: no-cache\n/manifest.webmanifest\n  Cache-Control: public, max-age=86400\n/texts/*\n  Cache-Control: public, max-age=86400\n/bibles/*\n  Cache-Control: public, max-age=86400\n/atlas/*\n  Cache-Control: public, max-age=86400\n/similar/*\n  Cache-Control: public, max-age=86400\n/dictionary/*\n  Cache-Control: public, max-age=86400\n')
big = [(p, p.stat().st_size) for p in out.rglob('*') if p.is_file() and p.stat().st_size > LIMIT]
if big:
    sys.exit('files over 25 MiB: ' + ', '.join(f'{p.relative_to(out)} ({s/1048576:.1f} MiB)' for p, s in big))
total = sum(p.stat().st_size for p in out.rglob('*') if p.is_file())
if limit_mib is not None:
    by = sorted(((sum(p.stat().st_size for p in (out / k).rglob('*') if p.is_file()), k) for k in ('texts', 'bibles', 'similar', 'atlas', 'dictionary') if (out / k).is_dir()), reverse=True)
    if total / 1048576 > limit_mib: sys.exit(f'the site is {total/1048576:.0f} MiB, over the {limit_mib:.0f} MiB limit. Biggest folders: ' + ', '.join(f'{k} {s/1048576:.0f} MiB' for s, k in by) + '. Leave packs out with --without= or --optional.')
    if total / 1048576 > 0.9 * limit_mib: print(f'WARNING: {total/1048576:.0f} MiB is within 10% of the {limit_mib:.0f} MiB limit; the library is growing, so leave more packs out soon.')
print(f'site folder: {out}\n  {sum(1 for p in out.rglob("*") if p.is_file())} files, {total/1048576:.0f} MiB; {n} library files; largest file {max(p.stat().st_size for p in out.rglob("*") if p.is_file())/1048576:.1f} MiB (limit 25)')
print('  share preview: ' + (f'Open Graph and twitter:card tags for {url.rstrip("/")}/ are in index.html' if url else 'NONE (no --url): a link to this site shows a bare address on Facebook; run again with --url=https://<the public address>'))
if without: print('  left out: ' + ', '.join(without) + f' ({len(drop)} texts); the site lists them in texts/index.js and the Library says so')
