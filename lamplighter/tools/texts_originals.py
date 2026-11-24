#!/usr/bin/env python3
"""Where each library text came from, and the original files its source offers (EPUB, Kindle, PDF of the scan, full text, web page), with sizes.

Writes ../texts/originals.js, a sidecar the reader reads when someone opens a text's details or the Save dialog. Nothing is downloaded but small probes (HEAD requests,
one JSON record per Internet Archive item); the app itself never touches the network: the links open the source's own site when clicked.

For each text in ../texts/index.js:
  - ids built from several sources (the Summa in four volumes, the Church Fathers) take every source from tools/texts_archive.SPECS (the 'idents' of the spec);
  - every other text is read from its meta 'src' link (Project Gutenberg ebook page, Internet Archive item page, eBible, ...).
Probes are cached in tools/cache/originals/ (so a rerun asks only about texts that were added); --refresh forgets the cache, --only=id1,id2 limits the run.

Run from anywhere:  python3 -I tools/texts_originals.py [--only=id1,id2] [--refresh]
Entry format in the sidecar:  id: [source name, [[part label, page url, [[format label, file url, bytes], ...]], ...]]   (bytes 0 when the source did not say)
"""
import json, os, re, subprocess, sys, time, urllib.parse, urllib.request, hashlib

HERE = os.path.dirname(os.path.abspath(__file__)); BEAT = os.path.dirname(HERE); ROOT = os.path.dirname(BEAT)
TEXTS = os.path.join(ROOT, 'texts'); CACHE = os.path.join(HERE, 'cache', 'originals'); OUT = os.path.join(TEXTS, 'originals.js')
UA = 'BeatlabOriginals/1.0 (offline religion library; polite, one request at a time)'
PAUSE = 0.15
ARGS = sys.argv[1:]; REFRESH = '--refresh' in ARGS
ONLY = None
for a in ARGS:
    if a.startswith('--only='): ONLY = set(x for x in a[7:].split(',') if x)
os.makedirs(CACHE, exist_ok=True)

def cached(key, make):
    p = os.path.join(CACHE, hashlib.sha1(key.encode()).hexdigest()[:20] + '.json')
    if not REFRESH and os.path.exists(p):
        try: return json.load(open(p, encoding='utf-8'))
        except Exception: pass
    v = make(); json.dump(v, open(p, 'w', encoding='utf-8'), ensure_ascii=False); return v

def http(url, method='GET', tries=3):
    last = None
    for k in range(tries):
        try:
            req = urllib.request.Request(url, method=method, headers={'User-Agent': UA})
            with urllib.request.urlopen(req, timeout=40) as r:
                body = r.read() if method == 'GET' else b''
                time.sleep(PAUSE); return r.status, r.headers.get('Content-Length'), r.geturl(), body
        except urllib.error.HTTPError as e:
            if e.code in (404, 403, 410): time.sleep(PAUSE); return e.code, None, url, b''
            last = e
        except Exception as e: last = e
        time.sleep(1.5 * (k + 1))
    return 0, None, url, str(last).encode()

def size(url):
    st, ln, fin, _ = http(url, 'HEAD')
    return (int(ln) if st == 200 and ln and ln.isdigit() else 0) if st == 200 else -1

# ───────────────────────── the sources ─────────────────────────
PG_FORMATS = [('EPUB, with pictures (for any e-reader or app)', 'epub3.images'), ('Kindle (KF8)', 'kf8.images'), ('Web page (HTML; the pictures load from the site)', 'html.images'), ('Plain text', 'txt.utf-8')]
def pg_part(n):
    page = 'https://www.gutenberg.org/ebooks/%d' % n
    def make():
        out = []
        for label, ext in PG_FORMATS:
            u = 'https://www.gutenberg.org/ebooks/%d.%s' % (n, ext); s = size(u)
            if s >= 0: out.append([label, u, s])
        return out
    return page, cached('pg:%d' % n, make)

IA_PICK = [('PDF of the scan (every picture and page as printed)', ('Text PDF', 'Image Container PDF')), ('EPUB', ('EPUB',)), ('Kindle', ('Kindle',)), ('Full text (OCR, plain)', ('DjVuTXT',)), ('DjVu', ('DjVu',))]
def ia_part(ident):
    page = 'https://archive.org/details/' + ident
    def make():
        st, _, _, body = http('https://archive.org/metadata/' + urllib.parse.quote(ident))
        if st != 200: return []
        try: files = json.loads(body.decode('utf-8', 'replace')).get('files') or []
        except Exception: return []
        out = []
        for label, formats in IA_PICK:
            for fmt in formats:
                hit = [f for f in files if f.get('format') == fmt and f.get('name')]
                if hit:
                    f = hit[0]; out.append([label, 'https://archive.org/download/%s/%s' % (urllib.parse.quote(ident), urllib.parse.quote(f['name'])), int(f['size']) if str(f.get('size', '')).isdigit() else 0]); break
        return out
    return page, cached('ia:' + ident, make)

def ebible_part(page):
    return 'https://ebible.org/find/details.php?id=eng-web', [['All formats (EPUB, PDF, Word, Kindle, plain text and more)', 'https://ebible.org/find/details.php?id=eng-web', 0]]

def wikisource_part(page):
    m = re.match(r'https://en\.wikisource\.org/wiki/([^?#]+)$', page)
    if not m: return page, []
    t = m.group(1)
    return page, [['EPUB', 'https://ws-export.wmcloud.org/?format=epub&lang=en&page=' + t, 0], ['PDF', 'https://ws-export.wmcloud.org/?format=pdf&lang=en&page=' + t, 0]]

def part_for_url(src):
    if re.match(r'https?://(www\.)?gutenberg\.org/ebooks/(\d+)', src): n = int(re.match(r'https?://(www\.)?gutenberg\.org/ebooks/(\d+)', src).group(2)); return 'Project Gutenberg', pg_part(n)
    m = re.match(r'https?://archive\.org/details/([^/?#]+)', src)
    if m: return 'Internet Archive', ia_part(m.group(1))
    if 'ebible.org' in src: return 'eBible.org', ebible_part(src)
    if 'en.wikisource.org' in src: return 'Wikisource', wikisource_part(src)
    if 'suttacentral.net' in src: return 'SuttaCentral', (src, [])
    host = urllib.parse.urlparse(src).netloc.replace('www.', ''); return host or 'the source', (src, [])

def part_for_ident(ident):
    if re.match(r'^PG\d+$', ident): return 'Project Gutenberg', pg_part(int(ident[2:]))
    return 'Internet Archive', ia_part(ident)

# ───────────────────────── the texts ─────────────────────────
def load_meta():
    js = "const vm=require('vm'),fs=require('fs');globalThis.BEATLAB_TEXTS={meta:{},data:{},add(){},addIndex(o){Object.assign(this.meta,o)}};vm.runInThisContext(fs.readFileSync(%r,'utf8'));console.log(JSON.stringify(BEATLAB_TEXTS.meta))" % os.path.join(TEXTS, 'index.js')
    return json.loads(subprocess.run(['node', '-e', js], capture_output=True, text=True, check=True).stdout)

def load_specs():
    sys.path.insert(0, HERE)
    try:
        import texts_archive as T
        return T.SPECS
    except Exception as e:
        print('note: could not read texts_archive.SPECS (%s); using each text\'s src only' % e, file=sys.stderr); return {}

PREFIX = 'globalThis.BEATLAB_ORIG=Object.assign(globalThis.BEATLAB_ORIG||{},'
def write_sidecar(obj):
    open(OUT, 'w', encoding='utf-8').write(PREFIX + json.dumps(obj, ensure_ascii=False, separators=(',', ':'), sort_keys=True) + ');\n')
def read_sidecar():
    if not os.path.exists(OUT): return {}
    s = open(OUT, encoding='utf-8').read(); return json.loads(s[len(PREFIX):s.rindex(');')])

def main():
    meta = load_meta(); specs = load_specs(); out = {}; stats = {}; short = []
    ids = [i for i in sorted(meta) if (ONLY is None or i in ONLY)]
    for k, tid in enumerate(ids):
        spec = specs.get(tid); src = meta[tid].get('src', ''); parts = []; name = None
        idents = (spec or {}).get('idents') if spec else None
        if idents and len(idents) > 1:
            labels = (spec or {}).get('labels') or []
            for j, idn in enumerate(idents):
                nm, (page, files) = part_for_ident(idn); name = name or nm
                label = labels[j].split(' · ')[0] if j < len(labels) else 'Part %d' % (j + 1)
                parts.append([label, page, files])
        else:
            name, (page, files) = part_for_url(src) if src else ('the source', ('', []))
            parts.append(['', page, files])
        out[tid] = [name, parts]
        stats[name] = stats.get(name, 0) + 1
        if not any(p[2] for p in parts): short.append(tid)
        if (k + 1) % 50 == 0: print('  %d of %d' % (k + 1, len(ids)), flush=True)
    if ONLY is not None:
        old = read_sidecar(); old.update(out); out = old
    write_sidecar(out)
    print('wrote %s: %d texts %s' % (OUT, len(out), json.dumps(stats)))
    print('texts with a page link but no file formats (%d): %s' % (len(short), ' '.join(short[:60])))

if __name__ == '__main__': main()
