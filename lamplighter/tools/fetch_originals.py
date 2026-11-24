#!/usr/bin/env python3
"""The sources' own files for every library text, kept in a plain folder you can copy: originals/.

Each text in the Library was made from a scan, an e-book or a web page that its source (the Internet Archive, Project Gutenberg, eBible.org, SuttaCentral, Wikisource) still publishes, and
texts/originals.js lists them: the PDF of the scan (every picture and page as printed), the source's own EPUB, the plain full text, a DjVu or Kindle file, the web page. The app only links to them.
This tool downloads them, so that copying one folder gets a person every original file with no connection:

    originals/<shelf>/<Title> [<id>]/<Part> - <kind>.<ext>
    originals/index.html     a page listing everything on this computer, with a link to each file (open it in any browser)
    originals/index.json     the same for programs
    originals/index.js       what the app reads, so the reader's "Where this text comes from" card can offer the copy on this computer (BEATLAB_LOCAL)
    originals/READ ME.txt

The shelves and names are the same as in downloads/ (tools/make_downloads.js), so a text's e-book and its original sit side by side in the two folders.

THE SIZE IS LARGE, so nothing is fetched unless you say so. Without --go this only prints a plan: how many files and how many GiB each kind comes to (about 100 GiB for everything on 17 Nov 2026:
EPUB 53, PDF 42, DjVu 4.5, plain text 1.7, Kindle 0.4, web pages 0.2). Choose the kinds with --formats, a part of the library with --shelf or --only, and a ceiling with --max-gib.

  python3 -I tools/fetch_originals.py                                   the plan, for every kind
  python3 -I tools/fetch_originals.py --formats=text --go               the plain full text of every text (about 1.7 GiB)
  python3 -I tools/fetch_originals.py --formats=text,epub --shelf=05 --go   text and EPUB for the texts on shelf 05 (India)
  python3 -I tools/fetch_originals.py --only=a-ada,a-asht --formats=pdf --go
  python3 -I tools/fetch_originals.py --index                           make the lists again from the files that are in originals/ (after copying files in by hand)

Manners (the sources are free libraries; be gentle): one file at a time, --delay seconds apart (default 6), a file already there with the size the source gave is skipped, a half-finished file is
resumed, and the run stops at the first "too many requests" or "unavailable" answer instead of trying again. Run it again later and it carries on. Only the public-domain or openly licensed
files the library's own sources offer are fetched, from the addresses in texts/originals.js; nothing is sent about you (the request names a plain program, no account, no cookie).
"""
import argparse, json, os, re, subprocess, sys, time, urllib.error, urllib.parse, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__)); SRC = os.path.dirname(HERE); TOP = os.path.dirname(SRC)
UA = 'LamplighterProject-originals/1 (a personal offline copy; polite: one file at a time)'
KINDS = ['text', 'epub', 'pdf', 'djvu', 'kindle', 'web']


def kind_of(label):
    l = label.lower()
    if 'pdf' in l: return 'pdf'
    if 'epub' in l: return 'epub'
    if 'kindle' in l or 'mobi' in l or 'azw' in l: return 'kindle'
    if 'djvu' in l: return 'djvu'
    if 'full text' in l or 'plain' in l or 'text' in l: return 'text'
    return 'web'


def safe(s, n=100):
    s = re.sub(r'[\\/:*?"<>|\x00-\x1f]', ' ', str(s)); s = re.sub(r'\s+', ' ', s).strip()[:n].strip()
    return re.sub(r'[ .]+$', '', s)


def ext_of(url, kind):
    p = urllib.parse.urlparse(url).path; m = re.search(r'\.([A-Za-z0-9]{1,5})$', p)
    if m and m.group(1).lower() not in ('php', 'aspx', 'cgi'): return m.group(1).lower()
    return {'text': 'txt', 'epub': 'epub', 'pdf': 'pdf', 'djvu': 'djvu', 'kindle': 'mobi', 'web': 'html'}[kind]


def load_originals(top):
    s = open(os.path.join(top, 'texts', 'originals.js'), encoding='utf-8').read()
    k = s.index('||{},') + 5
    return json.loads(s[k:s.rindex('}') + 1])


def load_layout():
    r = subprocess.run(['node', '--no-warnings', os.path.join(HERE, 'make_downloads.js'), '--layout', '--top=' + TOP], capture_output=True, text=True)
    if r.returncode != 0: sys.exit('could not read the library layout (is Node installed?): ' + r.stderr[:300])
    return json.loads(r.stdout)


def jobs(orig, layout, args):
    only = set(x for x in (args.only or '').split(',') if x); want = set(x for x in (args.formats or '').split(',') if x)
    out = []
    for id_ in sorted(orig):
        if only and id_ not in only: continue
        lay = layout.get(id_)
        if not lay: continue
        if args.shelf and not lay['shelf'].lower().startswith(args.shelf.lower()) and args.shelf.lower() not in lay['shelf'].lower(): continue
        src, parts = orig[id_]
        for pl, page, fmts in parts:
            for fl, url, size in fmts:
                k = kind_of(fl)
                if want and k not in want: continue
                name = safe((pl + ' - ' if pl else '') + fl, 110) + '.' + ext_of(url, k)
                out.append({'id': id_, 'kind': k, 'url': url, 'bytes': size, 'rel': '/'.join([lay['shelf'], lay['name'], name]), 'label': (pl + ' - ' if pl else '') + fl})
    return out


def plan(js, args):
    by = {}
    for j in js:
        c = by.setdefault(j['kind'], [0, 0, 0, 0, 0]); c[0] += 1; c[1] += j['bytes']; c[2] += (j['bytes'] == 0)
        have = os.path.join(args.out, *j['rel'].split('/'))
        if os.path.exists(have) and (j['bytes'] == 0 or os.path.getsize(have) == j['bytes']): c[3] += 1; c[4] += os.path.getsize(have)
    print('%-8s %7s %10s %10s   %s' % ('kind', 'files', 'size', 'already', 'sizes unknown'))
    tf = ts = 0
    for k in KINDS:
        if k not in by: continue
        c = by[k]; tf += c[0]; ts += c[1]
        print('%-8s %7d %8.2f GiB %6d files   %d' % (k, c[0], c[1] / 2 ** 30, c[3], c[2]))
    print('%-8s %7d %8.2f GiB   (into %s)' % ('all', tf, ts / 2 ** 30, args.out))


def fetch(js, args):
    done = skipped = failed = 0; got = 0; t_last = 0.0
    for n, j in enumerate(js, 1):
        dest = os.path.join(args.out, *j['rel'].split('/'))
        if os.path.exists(dest) and (j['bytes'] == 0 or os.path.getsize(dest) == j['bytes']): skipped += 1; continue
        if args.max_gib and got / 2 ** 30 >= args.max_gib: print('stopped at the ceiling of %.1f GiB; run again to carry on' % args.max_gib); break
        os.makedirs(os.path.dirname(dest), exist_ok=True); part = dest + '.part'
        wait = args.delay - (time.time() - t_last)
        if wait > 0 and t_last: time.sleep(wait)
        have = os.path.getsize(part) if os.path.exists(part) else 0
        req = urllib.request.Request(j['url'], headers={'User-Agent': UA, **({'Range': 'bytes=%d-' % have} if have else {})})
        print('[%d/%d] %s  %s  %s' % (n, len(js), j['id'], j['label'][:60], ('%.1f MB' % (j['bytes'] / 1e6)) if j['bytes'] else ''), flush=True)
        t_last = time.time()
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                mode = 'ab' if (have and r.status == 206) else 'wb'
                with open(part, mode) as f:
                    while True:
                        b = r.read(1 << 20)
                        if not b: break
                        f.write(b); got += len(b)
            os.replace(part, dest); done += 1
            if j['bytes'] and os.path.getsize(dest) != j['bytes']: print('   note: %d bytes, the source said %d' % (os.path.getsize(dest), j['bytes']))
        except urllib.error.HTTPError as e:
            if e.code in (429, 503): print('STOP: the source answered %d (too busy or too many requests). Nothing more is asked; run again later.' % e.code); failed += 1; break
            print('   not fetched (%d %s): %s' % (e.code, e.reason, j['url'])); failed += 1
        except Exception as e:
            print('   not fetched (%s): %s' % (e, j['url'])); failed += 1
    print('fetched %d, already there %d, not fetched %d, %.2f GiB downloaded this run' % (done, skipped, failed, got / 2 ** 30))


def esc(s): return str(s).replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('"', '&quot;')
def mb(b): return '%.1f MB' % (b / 1048576) if b >= 1048576 else '%d KB' % max(1, round(b / 1024))


def index(out, orig):
    """Lists made from the files that are really in originals/ (whoever put them there)."""
    found = {}; total = 0
    for shelf in sorted(os.listdir(out)) if os.path.isdir(out) else []:
        sp = os.path.join(out, shelf)
        if not os.path.isdir(sp): continue
        for book in sorted(os.listdir(sp)):
            bp = os.path.join(sp, book); m = re.search(r'\[([a-z0-9-]+)\]$', book)
            if not m or not os.path.isdir(bp): continue
            for f in sorted(os.listdir(bp)):
                fp = os.path.join(bp, f)
                if f.startswith('.') or f.endswith('.part') or not os.path.isfile(fp): continue
                size = os.path.getsize(fp); total += size
                found.setdefault(m.group(1), {'title': re.sub(r'\s*\[[a-z0-9-]+\]$', '', book), 'shelf': shelf, 'files': []})['files'].append([os.path.splitext(f)[0], '/'.join([shelf, book, f]), size])
    local = {i: v['files'] for i, v in found.items()}
    open(os.path.join(out, 'index.js'), 'w', encoding='utf-8').write('globalThis.BEATLAB_LOCAL=Object.assign(globalThis.BEATLAB_LOCAL||{},' + json.dumps(local, ensure_ascii=False, separators=(',', ':')) + ');\n')
    open(os.path.join(out, 'index.json'), 'w', encoding='utf-8').write(json.dumps({'app': 'The Lamplighter Project', 'texts': found}, ensure_ascii=False))
    by_shelf = {}
    for i, v in found.items(): by_shelf.setdefault(v['shelf'], []).append(i)
    rows = []
    for s in sorted(by_shelf):
        rows.append('<h2>%s <span class="w">(%d)</span></h2><ul>' % (esc(re.sub(r'^\d+ ', '', s)), len(by_shelf[s])))
        for i in sorted(by_shelf[s], key=lambda x: found[x]['title'].lower()):
            v = found[i]; rows.append('<li><b>%s</b><br>%s</li>' % (esc(v['title']), ' · '.join('<a href="%s">%s</a> <span class="w">%s</span>' % (esc('/'.join(urllib.parse.quote(p) for p in f[1].split('/'))), esc(f[0].split(' - ')[-1]) if ' - ' in f[0] else esc(f[0]), mb(f[2])) for f in v['files'])))
        rows.append('</ul>')
    open(os.path.join(out, 'index.html'), 'w', encoding='utf-8').write('''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>The Lamplighter Project: the original files</title>
<style>body{font:16px/1.5 system-ui,sans-serif;max-width:60rem;margin:2rem auto;padding:0 1rem;color:#1d1d1f;background:#fff}@media(prefers-color-scheme:dark){body{color:#e8e8ea;background:#16161a}a{color:#8ab4ff}}h1{font-size:1.5rem}h2{margin-top:2rem;border-bottom:1px solid #8884}ul{list-style:none;padding:0}li{margin:.6rem 0}.w{color:#888;font-size:.85em}</style></head><body>
<h1>The Lamplighter Project: the original files</h1><p>%d texts, %d files, %.2f GiB. Each is the file its source publishes (the scan as a PDF, the source's own e-book, the plain full text), kept exactly as published. Copy this whole folder to keep them.</p>
%s</body></html>
''' % (len(found), sum(len(v['files']) for v in found.values()), total / 2 ** 30, '\n'.join(rows)))
    open(os.path.join(out, 'READ ME.txt'), 'w', encoding='utf-8').write('''The Lamplighter Project: the original files
===========================================

Each library text was made from a scan, an e-book or a web page that its source still publishes. This folder keeps those files as the sources published them, so that copying this folder
gets you every original with no connection: the PDF of the scan (every picture and page as printed), the source's own EPUB, the plain full text.

  <shelf>/<Title> [<id>]/<file>     the shelves and names match the downloads/ folder, where the same text is an e-book made by the app
  index.html                        open it in any browser for a list of everything here, with a link to each file

Every text is public domain or openly licensed; each one's source and licence are in texts/LICENSES.txt. Made by tools/fetch_originals.py from the addresses in texts/originals.js.
''')
    return len(found), sum(len(v['files']) for v in found.values()), total


def main():
    ap = argparse.ArgumentParser(description='the sources\' own files for every library text (see the top of this file)')
    ap.add_argument('--top', default=TOP); ap.add_argument('--out', default=None); ap.add_argument('--formats', default=''); ap.add_argument('--only', default=''); ap.add_argument('--shelf', default='')
    ap.add_argument('--go', action='store_true'); ap.add_argument('--index', action='store_true'); ap.add_argument('--delay', type=float, default=6.0); ap.add_argument('--max-gib', type=float, default=0)
    args = ap.parse_args(); args.out = os.path.abspath(args.out or os.path.join(args.top, 'originals'))
    if args.index:
        os.makedirs(args.out, exist_ok=True); t, f, b = index(args.out, None); print('listed %d texts, %d files, %.2f GiB in %s' % (t, f, b / 2 ** 30, args.out)); return
    orig = load_originals(args.top); layout = load_layout(); js = jobs(orig, layout, args)
    bad = [x for x in args.formats.split(',') if x and x not in KINDS]
    if bad: sys.exit('unknown format(s): %s (use %s)' % (', '.join(bad), ', '.join(KINDS)))
    if not args.go: plan(js, args); print('\nNothing was fetched. Choose with --formats=%s, then add --go.' % '|'.join(KINDS)); return
    if not args.formats: sys.exit('say which kinds to fetch, for example --formats=text (this plan is about 100 GiB for everything); run without --go to see the sizes')
    plan(js, args); print(); fetch(js, args); t, f, b = index(args.out, orig); print('listed %d texts, %d files, %.2f GiB' % (t, f, b / 2 ** 30))


if __name__ == '__main__':
    main()
