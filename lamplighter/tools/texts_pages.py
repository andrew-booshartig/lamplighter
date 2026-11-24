"""The printed page numbers of the scanned texts: fetch the Internet Archive's page data for each scan, and (build) work out which printed page each paragraph of our text begins on.

Why: the texts were made from the OCR of a scan with its running heads and page numbers dropped, so the reader could only show its own page count. A scholar cites the printed page
("p. 214") and the section. The Internet Archive keeps, for most scans, three small files that say where every page is and what its printed number is:
    <name>_page_numbers.json         for each leaf (scanned page) the printed page number the Archive read from it ('' where it found none), with a confidence
    <name>_hocr_pageindex.json.gz    for each leaf, where its text starts and ends in the file below
    <name>_hocr_searchtext.txt.gz    the OCR text of the whole book, every leaf in order (the same OCR as the text this library was cleaned from)
Nothing is invented: a paragraph gets a printed page only when its first words are found in the text of that leaf, and a page number only where the Archive read one or the numbers around it
make it certain (the reader says which). The result is a sidecar file per text, texts/pg-<id>.js, and texts/pgs.js (which texts have one), exactly as the pictures are kept.

    python3 -I tools/texts_pages.py fetch [--only=<id>] [--limit=N]   fetch the three files for each item (resumes; six requests at a time, a pause between)
    python3 -I tools/texts_pages.py build [--only=<id>]               match every paragraph to its leaf and write texts/pg-<id>.js and texts/pgs.js
    python3 -I tools/texts_pages.py report                            what was found, text by text

Only links are followed and only on this machine: the app itself sends nothing. Files are cached in tools/cache/pages/<item>/ and are not part of the app."""
import collections, json, os, re, sys, time, urllib.error, urllib.parse, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
CACHE = os.path.join(HERE, 'cache', 'pages'); ARCH = os.path.join(HERE, 'cache', 'archive')
UA = 'LamplighterPages/1.0 (offline religion library; polite, six requests at a time)'
PAUSE = 0.2
SUFFIXES = ('_page_numbers.json', '_hocr_pageindex.json.gz', '_hocr_searchtext.txt.gz')


def items():
    """every Internet Archive item behind a scanned text of the library: {item: [text ids]}"""
    sys.path.insert(0, HERE); os.chdir(HERE)
    import texts_archive as A
    have = {f[:-3] for f in os.listdir(os.path.join(ROOT, 'texts')) if f.endswith('.js')}
    out = {}
    for lid, spec in A.SPECS.items():
        if lid not in have: continue
        for ident in spec['idents']:
            if not A.IS_PG(ident): out.setdefault(ident, []).append(lid)
    return out


def files_of(ident):
    """the three page-data files of an item, from the Archive's own file list that was saved when the text was made: {suffix: (name, size)} (a file the item does not have is missing)"""
    p = os.path.join(ARCH, ident + '.meta.json')
    if not os.path.exists(p): return {}
    names = {f['name']: int(f.get('size') or 0) for f in json.load(open(p)).get('files', [])}
    out = {}
    for s in SUFFIXES:
        c = sorted([n for n in names if n.endswith(s)], key=lambda n: -names[n])
        if c: out[s] = (c[0], names[c[0]])
    return out


def http(url, tries=3, timeout=120, total=600):
    for k in range(tries):
        t0 = time.time()
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': UA}), timeout=timeout) as r:
                chunks = []
                while True:
                    b = r.read(1 << 16)
                    if not b: break
                    chunks.append(b)
                    if time.time() - t0 > total: raise TimeoutError('fetch took too long')
                time.sleep(PAUSE); return b''.join(chunks)
        except urllib.error.HTTPError as e:
            if e.code in (403, 404, 410): return None
        except Exception: pass
        time.sleep(2 * (k + 1))
    return None


XSUFFIXES = ('_djvu.xml', '_scandata.xml', '_page_numbers.json')


def files_of_x(ident):
    """for a scan the Archive has not given the three hOCR page files, the heavier files it does have: {suffix: (name, size)}"""
    p = os.path.join(ARCH, ident + '.meta.json')
    if not os.path.exists(p): return {}
    names = {f['name']: int(f.get('size') or 0) for f in json.load(open(p)).get('files', [])}
    out = {}
    for suf in XSUFFIXES:
        c = sorted([n for n in names if n.endswith(suf)], key=lambda n: -names[n])
        if c: out[suf] = (c[0], names[c[0]])
    return out


def fetch_djvu(only=None, workers=6):
    """the scans that have no hOCR page files: each one's _djvu.xml (the OCR, page by page), its _scandata.xml and _page_numbers.json where it has them, cached beside the others"""
    from concurrent.futures import ThreadPoolExecutor
    its = items(); jobs = []; skipped = []
    for ident, tids in its.items():
        if only and only not in tids: continue
        if len(files_of(ident)) == 3: continue
        f = files_of_x(ident)
        if '_djvu.xml' not in f: skipped.append(ident); continue
        d = os.path.join(CACHE, ident); os.makedirs(d, exist_ok=True)
        for suf, (name, size) in f.items():
            dest = os.path.join(d, ident + suf)
            if not (os.path.exists(dest) and os.path.getsize(dest) == size): jobs.append((ident, suf, name, size, dest))
    print('%d files to fetch (%.0f MB); %d items with no _djvu.xml: %s' % (len(jobs), sum(j[3] for j in jobs) / 1e6, len(skipped), skipped), flush=True)
    done = [0, 0]; fail = []
    def one(j):
        ident, suf, name, size, dest = j
        raw = http('https://archive.org/download/%s/%s' % (urllib.parse.quote(ident), urllib.parse.quote(name)), timeout=180, total=1500)
        if raw is None: fail.append((ident, suf)); return
        open(dest + '.part', 'wb').write(raw); os.replace(dest + '.part', dest); done[0] += 1; done[1] += len(raw)
        if done[0] % 20 == 0: print('%d files, %.0f MB' % (done[0], done[1] / 1e6), flush=True)
    with ThreadPoolExecutor(max_workers=workers) as ex: list(ex.map(one, jobs))
    print('done: %d files, %.0f MB fetched; failed: %s' % (done[0], done[1] / 1e6, fail))


def fetch(only=None, limit=None, workers=6):
    """fetch every missing file, a few at a time (each answer takes several seconds to start, so one at a time would take hours)"""
    from concurrent.futures import ThreadPoolExecutor
    its = items(); todo = [(i, t) for i, t in its.items() if not only or only in t]
    jobs = []; nofile = []; need = 0
    for ident, tids in todo:
        f = files_of(ident)
        if len(f) < 3: nofile.append(ident); continue
        d = os.path.join(CACHE, ident); os.makedirs(d, exist_ok=True)
        for s in SUFFIXES:
            name, size = f[s]; dest = os.path.join(d, ident + s); need += size
            if not (os.path.exists(dest) and os.path.getsize(dest) == size): jobs.append((ident, s, name, size, dest))
    if limit: jobs = jobs[:limit]
    print('%d files to fetch (%.0f MB); %d items without all three files' % (len(jobs), sum(j[3] for j in jobs) / 1e6, len(nofile)), flush=True)
    done = [0, 0]; fail = []
    def one(j):
        ident, s, name, size, dest = j
        raw = http('https://archive.org/download/%s/%s' % (urllib.parse.quote(ident), urllib.parse.quote(name)))
        if raw is None: fail.append((ident, s)); return
        open(dest + '.part', 'wb').write(raw); os.replace(dest + '.part', dest); done[0] += 1; done[1] += len(raw)
        if done[0] % 50 == 0: print('%d files, %.0f MB' % (done[0], done[1] / 1e6), flush=True)
    with ThreadPoolExecutor(max_workers=workers) as ex: list(ex.map(one, jobs))
    print('done: %d files, %.0f MB fetched; %d items without all three files; %d files that failed: %s' % (done[0], done[1] / 1e6, len(nofile), len(fail), fail[:10]))
    json.dump({'nofile': nofile, 'fail': fail}, open(os.path.join(CACHE, 'fetch-report.json'), 'w'))



# ───────────────────────────── Project Gutenberg texts: the page numbers are in the book's own web edition ─────────────────────────────
from html.parser import HTMLParser
PGCACHE = os.path.join(CACHE, 'gutenberg')


def pg_items():
    """the Project Gutenberg ebook numbers behind each typed text of the library, in volume order: {text id: [numbers]} (from the web addresses that texts/originals.js keeps, one part per volume)"""
    s = open(os.path.join(TEXTS_DIR, 'originals.js'), encoding='utf-8').read(); m = re.search(r'BEATLAB_ORIG\|\|\{\},(\{.*\})\);\s*$', s, re.S); d = json.loads(m.group(1)) if m else {}
    idx = open(os.path.join(TEXTS_DIR, 'index.js'), encoding='utf-8').read(); meta = json.JSONDecoder().raw_decode(idx, idx.index('{'))[0]
    out = {}
    for tid, mm in meta.items():
        if 'gutenberg.org' not in (mm.get('src') or ''): continue
        ent = d.get(tid)
        if not ent: continue
        nums = []
        for part in ent[1]:
            for f in part[2]:
                g = re.search(r'gutenberg\.org/ebooks/(\d+)\.html', f[1] or '')
                if g and int(g.group(1)) not in nums: nums.append(int(g.group(1))); break
        if nums: out[tid] = nums
    sys.path.insert(0, HERE); os.chdir(HERE)
    import texts_archive as A      # the specification lists every volume a text was made from, in order; the web addresses in originals.js may name only the first
    for tid, spec in A.SPECS.items():
        ids = list(dict.fromkeys(spec['idents']))
        if tid in out and ids and all(A.IS_PG(i) for i in ids): out[tid] = [int(i[2:]) for i in ids]
    return out


TEXTS_DIR = os.path.join(ROOT, 'texts')


def fetch_pg(only=None, workers=3):
    from concurrent.futures import ThreadPoolExecutor
    os.makedirs(PGCACHE, exist_ok=True); its = pg_items(); jobs = sorted({n for t, ns in its.items() if not only or t == only for n in ns if not os.path.exists(os.path.join(PGCACHE, '%d.html' % n))})
    print('%d Gutenberg web editions to fetch' % len(jobs), flush=True); done = [0, 0]; fail = []
    def one(n):
        raw = http('https://www.gutenberg.org/ebooks/%d.html.images' % n, total=300)
        if raw is None: raw = http('https://www.gutenberg.org/cache/epub/%d/pg%d-images.html' % (n, n), total=300)
        if raw is None: fail.append(n); return
        open(os.path.join(PGCACHE, '%d.html.part' % n), 'wb').write(raw); os.replace(os.path.join(PGCACHE, '%d.html.part' % n), os.path.join(PGCACHE, '%d.html' % n)); done[0] += 1; done[1] += len(raw)
        if done[0] % 20 == 0: print('%d editions, %.0f MB' % (done[0], done[1] / 1e6), flush=True)
    with ThreadPoolExecutor(max_workers=workers) as ex: list(ex.map(one, jobs))
    print('done: %d editions, %.0f MB; failed: %s' % (done[0], done[1] / 1e6, fail))


def fetch_pg_gently(pause=6.0, limit=None):
    """Gutenberg web editions for the typed texts whose cached EPUB has no page numbers, one request at a time, `pause` seconds apart (more after a big file), with no retries: the first refusal (429, 503 or any server error) stops the run, with the
    site's own Retry-After said, so the limiter is never pushed. A file already cached is not asked for again; run it again later and it carries on."""
    os.makedirs(PGCACHE, exist_ok=True)
    try: rep = json.load(open(os.path.join(CACHE, 'build-report.json')))
    except Exception: rep = {}
    its = pg_items(); want = []
    for tid, nums in its.items():
        if rep.get(tid, {}).get('status') == 'no page numbers':
            for n in nums:
                if n not in want and not os.path.exists(os.path.join(PGCACHE, '%d.html' % n)): want.append(n)
    print('%d Gutenberg web editions to fetch, one every %.0f seconds' % (len(want), pause), flush=True); got = 0; nbytes = 0
    for n in want[:limit] if limit else want:
        path = '/'.join(str(n)[:-1]) if n >= 10 else '0'      # the mirrors keep a book at 4/2/0/8/42084/ (all the digits but the last, one folder each)
        raw = None
        for tail in ('%d-h/%d-h.htm' % (n, n), '%d-h.htm' % n, '%d-images.html' % n):      # where a mirror keeps the web edition (the first is the usual one)
            req = urllib.request.Request('https://gutenberg.pglaf.org/%s/%d/%s' % (path, n, tail), headers={'User-Agent': UA})
            try:
                with urllib.request.urlopen(req, timeout=60) as r: raw = r.read(); break
            except urllib.error.HTTPError as e:
                if e.code in (404, 410): time.sleep(pause); continue      # not at this place: the next, after a rest
                print('STOPPED at %d: HTTP %d, Retry-After %s. %d fetched so far; run again later.' % (n, e.code, e.headers.get('Retry-After'), got), flush=True); return
            except Exception as e:
                print('STOPPED at %d: %r. %d fetched so far; run again later.' % (n, e, got), flush=True); return
        if raw is None: print('  %d: no web edition on the mirror; skipped' % n, flush=True); continue
        open(os.path.join(PGCACHE, '%d.html.part' % n), 'wb').write(raw); os.replace(os.path.join(PGCACHE, '%d.html.part' % n), os.path.join(PGCACHE, '%d.html' % n)); got += 1; nbytes += len(raw)
        if got % 10 == 0: print('%d editions, %.0f MB' % (got, nbytes / 1e6), flush=True)
        time.sleep(pause + len(raw) / 2e6)      # a larger file earns a longer rest
    print('done: %d editions, %.0f MB' % (got, nbytes / 1e6), flush=True)


PAGE_ID = re.compile(r'^(?:page|pg|p)[_\-]?([0-9]{1,5}|[ivxlcdm]{1,8})$', re.I)
PAGE_TXT = re.compile(r'\[(?:Pg|Page|p\.?)\s*([0-9]{1,5}|[ivxlcdm]{1,8})\]|\{([0-9]{1,5})\}', re.I)


class PageHTML(HTMLParser):
    """the words of a Gutenberg web edition, in order, with the printed page numbers the book's own markup gives: ('p', label) at each page's start, ('t', text) for words"""
    def __init__(self):
        super().__init__(convert_charrefs=True); self.out = []; self.skip = 0; self.pn = None; self.pn_text = ''; self.depth = []
    def handle_starttag(self, tag, attrs):
        a = dict(attrs); cls = (a.get('class') or '').lower(); ident = a.get('id') or a.get('name') or ''
        if tag in ('script', 'style'): self.skip += 1; self.depth.append((tag, 'skip')); return
        m = PAGE_ID.match(ident) if tag in ('a', 'span', 'div', 'p') else None
        if m and not self.pn: self.out.append(('p', m.group(1).lower()))
        if tag in ('span', 'a', 'div', 'p') and re.search(r'\b(pagenum|pageno|page-number|pagenumber|pgnum)\b', cls):
            self.pn = tag; self.pn_text = ''; self.depth.append((tag, 'pn')); return
        if tag not in ('br', 'img', 'hr', 'meta', 'link', 'input'): self.depth.append((tag, ''))
    def handle_endtag(self, tag):
        while self.depth:
            t, k = self.depth.pop()
            if k == 'skip': self.skip -= 1
            if k == 'pn':
                lab = clean_label(re.sub(r'[\[\]\{\}\(\)]|^(?:pg|page|p\.?)\s*', '', self.pn_text.strip(), flags=re.I)); self.pn = None
                if lab and not (self.out and self.out[-1] == ('p', lab)): self.out.append(('p', lab))
            if t == tag: break
    def handle_data(self, d):
        if self.skip: return
        if self.pn: self.pn_text += d; return
        pos = 0
        for m in PAGE_TXT.finditer(d):
            if m.start() > pos: self.out.append(('t', d[pos:m.start()]))
            self.out.append(('p', (m.group(1) or m.group(2)).lower())); pos = m.end()
        if pos < len(d): self.out.append(('t', d[pos:]))


def epub_text(num):
    """the cached EPUB of a Gutenberg book (kept by tools/texts_figures.py for the pictures), read in its spine order as one string of markup, or None"""
    import zipfile
    fp = os.path.join(CACHE, '..', 'figures', 'pg%d.epub' % num)
    if not os.path.exists(fp): return None
    try:
        z = zipfile.ZipFile(fp); names = z.namelist()
        opf = re.search(r'full-path="([^"]+)"', z.read('META-INF/container.xml').decode('utf-8', 'replace')).group(1); base = os.path.dirname(opf)
        o = z.read(opf).decode('utf-8', 'replace'); man = {m.group(2): m.group(1) for m in re.finditer(r'<item\b[^>]*?\bhref="([^"]+)"[^>]*?\bid="([^"]+)"', o)}
        man.update({m.group(1): m.group(2) for m in re.finditer(r'<item\b[^>]*?\bid="([^"]+)"[^>]*?\bhref="([^"]+)"', o)})
        order = [man[r] for r in re.findall(r'<itemref\b[^>]*?idref="([^"]+)"', o) if r in man]
        parts = []
        for h in order:
            n = os.path.normpath(os.path.join(base, urllib.parse.unquote(h))).replace(os.sep, '/')
            if n in names and re.search(r'\.(?:x?html?)$', n): parts.append(z.read(n).decode('utf-8', 'replace'))
        return '\n'.join(parts)
    except Exception:
        return None


def _read_html(p):
    """a web edition as text: UTF-8, or (older books) Latin-1"""
    b = open(p, 'rb').read()
    try: return b.decode('utf-8')
    except UnicodeDecodeError: return b.decode('latin-1')


def pg_leaves(num):
    """a Gutenberg web edition cut at its printed page numbers: [{'leaf', 'label', 'conf', 'text'}] (the words before the first number are a leaf with no label), or None if the file is not there"""
    p = os.path.join(PGCACHE, '%d.html' % num)
    src = _read_html(p) if os.path.exists(p) else epub_text(num)      # the web edition if it has been fetched, else the cached EPUB
    if src is None: return None
    h = PageHTML(); h.feed(src)
    leaves = [{'leaf': 0, 'label': '', 'conf': None, 'text': ''}]
    for kind, v in h.out:
        if kind == 'p': leaves.append({'leaf': len(leaves), 'label': clean_label(v), 'conf': 100, 'text': ''})
        else: leaves[-1]['text'] += v + ' '
    return leaves


# ───────────────────────────── matching our text to the pages ─────────────────────────────
import bisect, gzip, hashlib

ROMAN = {'i': 1, 'v': 5, 'x': 10, 'l': 50, 'c': 100, 'd': 500, 'm': 1000}
GRAM = 5                                   # words that must agree, in order, for a place to be an anchor


def roman_to_int(s):
    t = 0
    for i, ch in enumerate(s):
        v = ROMAN[ch]
        t += -v if i + 1 < len(s) and ROMAN[s[i + 1]] > v else v
    return t


def int_to_roman(n):
    out = ''
    for v, r in ((1000, 'm'), (900, 'cm'), (500, 'd'), (400, 'cd'), (100, 'c'), (90, 'xc'), (50, 'l'), (40, 'xl'), (10, 'x'), (9, 'ix'), (5, 'v'), (4, 'iv'), (1, 'i')):
        while n >= v: out += r; n -= v
    return out


def clean_label(x):
    """a printed page number as the Archive read it, or '' if it is not one: arabic (1 to 5 digits) or roman (lower case)"""
    x = (x or '').strip().lower().rstrip('.')
    if re.fullmatch(r'[1-9][0-9]{0,4}', x): return x
    if re.fullmatch(r'[ivxlcdm]{1,12}', x) and int_to_roman(roman_to_int(x)) == x: return x
    return ''


def words(s):
    return re.findall(r'[^\W_]+', s.lower())


def load_text(tid):
    """the sections of a text as built: [[title, body], ...]"""
    s = open(os.path.join(ROOT, 'texts', tid + '.js'), encoding='utf-8').read()
    i = s.index('{', s.index('.add(')); dec = json.JSONDecoder()
    meta, j = dec.raw_decode(s, i); j = s.index('[', j); secs, _ = dec.raw_decode(s, j)
    return meta, secs


def our_stream(secs):
    """every word of the paragraphs, with where it is: (word, section, paragraph, offset in the paragraph's visible text). A block is a paragraph or '## heading' (with the paragraph it heads on the next line)."""
    ws = []; paras = {}
    for k, (title, body) in enumerate(secs):
        for p, blk in enumerate(re.split(r'\n{2,}', str(body))):
            if blk.startswith('## '):
                nl = blk.find('\n'); blk = '' if nl < 0 else blk[nl + 1:]
            vis = re.sub(r'\[\[\d+\]\]', '', blk); paras[(k, p)] = len(vis)
            for m in re.finditer(r'[^\W_]+', vis): ws.append((m.group(0).lower(), k, p, m.start()))
    return ws, paras


def calibrated():
    """offsets worked out by calibrate(): {item: offset}"""
    p = os.path.join(CACHE, 'offsets.json')
    try: return json.load(open(p))
    except Exception: return {}



import html as _html


def djvu_pages(path):
    """the text of each page of a _djvu.xml, in order: the file holds one OBJECT per page and the words of its page in WORD elements (read as text, not parsed, so a damaged file still gives its pages)"""
    s = open(path, encoding='utf-8', errors='replace').read(); out = []
    for chunk in re.split(r'<OBJECT\b', s)[1:]:
        out.append(_html.unescape(' '.join(re.findall(r'<WORD\b[^>]*>([^<]*)</WORD>', chunk))))
    return out


def scandata_labels(path):
    """the page numbers a scanner typed in: {leaf number: label}, from _scandata.xml (only the ones that are numbers)"""
    try: s = open(path, encoding='utf-8', errors='replace').read()
    except Exception: return {}
    out = {}
    for m in re.finditer(r'<page\b[^>]*\bleafNum="(\d+)"[^>]*>(.*?)</page>', s, re.S):
        pn = re.search(r'<pageNumber>\s*([^<]*?)\s*</pageNumber>', m.group(2))
        if pn and clean_label(pn.group(1)): out[int(m.group(1))] = clean_label(pn.group(1))
    return out


def detect_labels(pages):
    """printed page numbers found in the pages' own words, for a scan the Archive has not read the numbers of: a number alone among the first or last four words of a page, kept only where the same step (number minus leaf) is seen on at least five pages that are close together, and then given to
    every page in between. Returns [(label, kind)]: 'r' where the number is on the page itself, 'i' where it follows from the pages either side (arabic numbers only: a roman numeral cannot be told from a word here)"""
    votes = collections.defaultdict(list)
    for i, t in enumerate(pages):
        w = t.split(); edge = w[:4] + w[-4:]
        for tok in set(edge):
            m = re.fullmatch(r'[\[\(\{]?(\d{1,4})[\]\)\}.,:;]?', tok)
            if m and 1 <= int(m.group(1)) <= 9999: votes[int(m.group(1)) - i].append(i)
    spans = []
    for c, leaves in votes.items():
        leaves = sorted(set(leaves)); start = 0
        for k in range(1, len(leaves) + 1):
            if k == len(leaves) or leaves[k] - leaves[k - 1] > 12:
                grp = leaves[start:k]
                if len(grp) >= 5: spans.append((len(grp), c, grp[0], grp[-1], set(grp)))
                start = k
    spans.sort(key=lambda x: -x[0]); lab = [('', '')] * len(pages); taken = [False] * len(pages)
    for n, c, a, b, seen in spans:
        for i in range(a, b + 1):
            if taken[i] or i + c < 1: continue
            lab[i] = (str(i + c), 'r' if i in seen else 'i'); taken[i] = True
    return lab


def djvu_leaves(ident):
    """the leaves of a scan from its _djvu.xml: [{'leaf', 'label', 'conf', 'text', 'offset': 0, 'verified': True}], or None. The page order is the file's own, so there is no offset to find; the printed numbers are those the scanner typed
    in _scandata.xml where that file lines up with the pages (the numbers are in the first or last words of the pages they are given to), else those found in the pages' own words (detect_labels)"""
    d = os.path.join(CACHE, ident); px = os.path.join(d, ident + '_djvu.xml')
    if not os.path.exists(px): return None
    pages = djvu_pages(px)
    if len(pages) < 5: return None
    lab = detect_labels(pages); found = sum(1 for x, _ in lab if x)
    sd = scandata_labels(os.path.join(d, ident + '_scandata.xml'))
    if sd and found < 0.3 * len(pages):
        best = None
        for off in range(-3, 4):
            hit = n = 0
            for L, x in list(sd.items())[:300]:
                k = L + off
                if 0 <= k < len(pages):
                    n += 1; w = pages[k].split(); edge = [t.strip('[](){}.,:;').lower() for t in w[:6] + w[-6:]]
                    if x in edge: hit += 1
            if n >= 15 and (best is None or hit / n > best[0]): best = (hit / n, off)
        if best and best[0] >= 0.35:
            lab2 = [('', '')] * len(pages)
            for L, x in sd.items():
                k = L + best[1]
                if 0 <= k < len(pages): lab2[k] = (x, 'r')
            if sum(1 for x, _ in lab2 if x) > found: lab = lab2
    out = []
    for i, t in enumerate(pages): out.append({'leaf': i, 'label': lab[i][0], 'kind': lab[i][1], 'conf': None, 'text': t, 'offset': 0, 'verified': True, 'score': 1.0, 'calibrated': False})
    return out


def item_leaves(ident):
    """the leaves of one scan: [{'leaf': n, 'label': '12', 'conf': 100, 'text': '...', 'offset': d, 'verified': bool}], or None if the files are not all there.
    The Archive's list of page numbers and its index into the text are counted from different places in different scans (leaf n is entry n in some, entry n-1 in others), so the offset is chosen
    for each scan by the one at which the printed numbers are really in the first or last words of their page (the right one scores about 0.7 to 0.9, a wrong one nearly 0); where no offset stands
    out (a book with few printed numbers) the offset is asked of the Archive's own search (calibrate); if that cannot settle it either, the scan is not counted as verified and build keeps no marks for it (a wrong page number is worse than none)."""
    d = os.path.join(CACHE, ident)
    try:
        pn = json.load(open(os.path.join(d, ident + '_page_numbers.json')))['pages']
        idx = json.loads(gzip.open(os.path.join(d, ident + '_hocr_pageindex.json.gz')).read())
        txt = gzip.open(os.path.join(d, ident + '_hocr_searchtext.txt.gz')).read().decode('utf-8', 'replace')
    except Exception:
        return djvu_leaves(ident)      # a scan the Archive has not given the hOCR page files: the _djvu.xml route
    def make(off, limit=None):
        out = []
        for e in pn:
            L = e.get('leafNum'); k = L + off if isinstance(L, int) else -1
            if not isinstance(L, int) or L < 0 or k < 0 or k >= len(idx): continue
            lab = clean_label(e.get('pageNumber'))
            if limit and not lab: continue
            a, b = idx[k][0], idx[k][1]
            out.append({'leaf': L, 'label': lab, 'conf': e.get('confidence') if isinstance(e.get('confidence'), (int, float)) else None, 'text': txt[a:b]})
            if limit and len(out) >= limit: break
        return out
    scores = {off: header_check(make(off, 250))[0] for off in range(-3, 4)}
    best = max(scores, key=lambda o: scores[o]); second = max((v for o, v in scores.items() if o != best), default=0.0)
    verified = scores[best] >= 0.35 and scores[best] >= second * 2 + 0.05
    if not verified: best = 0
    cal = calibrated().get(ident)      # an offset worked out from the Archive's own search (calibrate), for a scan whose printed numbers could not be found in its pages
    if not verified and cal is not None: best = cal; verified = True
    out = make(best)
    for l in out: l['offset'] = best; l['verified'] = verified; l['score'] = round(scores.get(best, 0), 2); l['calibrated'] = cal is not None and best == cal
    found = sum(1 for l in out if l['label'])
    if not verified or found < 0.3 * max(1, len(out)):
        # the Archive's numbers could not be placed on the pages, or it read few: read the numbers from the pages' own words (as for a _djvu.xml), which needs no offset
        pages = [txt[e[0]:e[1]] for e in idx]; lab = detect_labels(pages)
        nd = sum(1 for x, _ in lab if x)
        if nd >= 10 and (not verified or nd > found):      # numbers whose place cannot be trusted are replaced by those read on the pages, however many there were
            return [{'leaf': i, 'label': lab[i][0], 'kind': lab[i][1], 'conf': None, 'text': t, 'offset': 0, 'verified': True, 'score': 1.0, 'calibrated': False} for i, t in enumerate(pages)]
    return out


def fill_labels(leaves):
    """leaves with no printed number get one only where the numbers on either side prove it (the same step per leaf), and are marked as inferred: [(label, kind)] with kind 'r' (read by the Archive), 'i' (inferred) or '' (none)"""
    lab = [(l['label'], 'r' if l['label'] else '') for l in leaves]
    def val(x):
        return (int(x), 'n') if x.isdigit() else (roman_to_int(x), 'r')
    known = [i for i, (x, k) in enumerate(lab) if x]
    for a, b in zip(known, known[1:]):
        if b - a < 2: continue
        (va, ta), (vb, tb) = val(lab[a][0]), val(lab[b][0])
        if ta == tb and vb - va == leaves[b]['leaf'] - leaves[a]['leaf'] and all(not lab[i][0] for i in range(a + 1, b)):
            for i in range(a + 1, b):
                v = va + leaves[i]['leaf'] - leaves[a]['leaf']
                lab[i] = ((str(v) if ta == 'n' else int_to_roman(v)), 'i')
    return lab


def header_check(leaves):
    """how many of the printed numbers the Archive read are really in the first or last words of that leaf's text: tells a real reading from a guess by counting"""
    n = hit = 0
    for l in leaves:
        if not l['label']: continue
        ws = words(l['text']); n += 1
        if l['label'] in ws[:10] or l['label'] in ws[-10:]: hit += 1
    return (hit / n) if n else 0.0, n


def anchors(ours, raw):
    """monotone (our index, raw index) pairs: 5-word runs that occur once in each stream, kept in order (the longest increasing run of them)"""
    def grams(ws):
        d = {}
        for i in range(len(ws) - GRAM + 1):
            h = hash(tuple(w[0] if isinstance(w, tuple) else w for w in ws[i:i + GRAM]))
            d[h] = i if h not in d else -1
        return d
    go = grams(ours); gr = grams(raw)
    pairs = sorted((go[h], gr[h]) for h in go if go[h] >= 0 and gr.get(h, -1) >= 0)
    tails = []; where = []; prev = [-1] * len(pairs)
    for n, (_, r) in enumerate(pairs):
        k = bisect.bisect_left(tails, r)
        if k == len(tails): tails.append(r); where.append(n)
        else: tails[k] = r; where[k] = n
        prev[n] = where[k - 1] if k else -1
    seq = []; n = where[-1] if where else -1
    while n >= 0: seq.append(pairs[n]); n = prev[n]
    return seq[::-1]



def refine(ours, raw, r0, r1, t):
    """the interpolated place t is near where the page begins; the leaf's first words after its running head (a few words the text no longer has) are looked for within 25 words of it, and the place is moved onto them"""
    for h in range(0, 12):
        key = [w[0] for w in raw[r0 + h:min(r1, r0 + h + 3)]]
        if len(key) < 3: break
        for d in sorted(range(-25, 26), key=abs):
            j = t + d
            if j >= 0 and j + 3 <= len(ours) and ours[j][0] == key[0] and ours[j + 1][0] == key[1] and ours[j + 2][0] == key[2]: return j
    return t


def match_text(tid, idents, labels=None):
    """where, in the text tid, each printed page of its scan(s) begins. Returns a dict: marks {(section, paragraph): [(offset, 'label')]}, and how well the text matched (cover, anchors, ...), or None if the page data is missing."""
    meta, secs = load_text(tid); ours, paras = our_stream(secs)
    raw = []; leafinfo = []; checks = []
    for it, ident in enumerate(idents):
        leaves = item_leaves(ident) if isinstance(ident, str) else pg_leaves(ident)      # a scan (Internet Archive item) or a Gutenberg ebook number
        if not leaves: return None
        lab = fill_labels(leaves)
        if 'kind' in leaves[0]: lab = [(l['label'], l['kind'] if l['label'] else '') for l in leaves]      # a scan read from its _djvu.xml: each number says whether it is on the page or follows from the pages either side
        hc, nn = header_check(leaves) if isinstance(ident, str) else (1.0, len([x for x in leaves if x['label']]))
        if isinstance(ident, str) and not leaves[0].get('verified', True): lab = [(x, 'i' if x else '') for x, _ in lab]      # the numbers could not be checked against the pages: every one is shown as inferred
        checks.append((ident, round(hc, 2), nn, leaves[0].get('offset', 0) if isinstance(ident, str) else 0, bool(leaves[0].get('verified', True)), isinstance(ident, str) and 'kind' in leaves[0]))      # the last: the numbers were read from the pages' own words, not taken from the Archive's page list
        for l, (lb, kd) in zip(leaves, lab):
            start = len(raw); raw.extend((w, it, l['leaf']) for w in words(l['text']))
            leafinfo.append({'item': it, 'leaf': l['leaf'], 'label': lb, 'kind': kd, 'start': start, 'end': len(raw), 'conf': l['conf']})
    if len(ours) < GRAM + 5 or len(raw) < GRAM + 5: return {'marks': {}, 'cover': 0.0, 'anchors': 0, 'checks': checks, 'words': len(ours)}
    anc = anchors(ours, raw); ar = [r for _, r in anc]
    covered = 0
    for (o1, r1), (o2, r2) in zip(anc, anc[1:]):
        if 0 < o2 - o1 <= 400 and 0 < r2 - r1 <= 800 and 0.35 <= (o2 - o1) / (r2 - r1) <= 2.5: covered += o2 - o1
    cover = covered / max(1, len(ours)); marks = {}; placed = 0; last_t = -1; vols = len(idents) > 1; at = {}
    for L in leafinfo:
        if not L['label'] or L['end'] <= L['start']: continue
        r0 = L['start']; j = bisect.bisect_left(ar, r0)
        if j < len(ar) and ar[j] == r0: t = anc[j][0]
        elif 0 < j < len(ar):
            (o1, r1), (o2, r2) = anc[j - 1], anc[j]
            if not (0 < o2 - o1 <= 600 and 0 < r2 - r1 <= 1200 and 0.35 <= (o2 - o1) / (r2 - r1) <= 2.5): continue
            t = o1 + int((r0 - r1) * (o2 - o1) / max(1, r2 - r1))
        else: continue
        t = refine(ours, raw, r0, L['end'], t)
        if t <= last_t or t >= len(ours): continue
        _, k, p, off = ours[t]; last_t = t; placed += 1; at[(k, p, off)] = (L['item'], L['leaf'])
        marks.setdefault((k, p), []).append((off, ('~' if L['kind'] == 'i' else '') + (('%d:' % (L['item'] + 1)) if vols else '') + L['label']))
    return {'marks': marks, 'cover': cover, 'anchors': len(anc), 'checks': checks, 'words': len(ours), 'leaves': len([x for x in leafinfo if x['label']]), 'placed': placed, 'secs': secs, 'meta': meta, 'at': at}



TEXTS = os.path.join(ROOT, 'texts')
GRADES = (('a', 0.97), ('b', 0.85), ('c', 0.6))      # how much of the text lies between anchors close together (see match_text): a, b or c; below c the markers are not kept


def grade_of(res):
    for g, lo in GRADES:
        if res['cover'] >= lo: return g
    return ''


def write_sidecar(tid, res, nvols):
    marks = sorted(res['marks'].items())
    rows = [[k, p, [[o, lab] for o, lab in sorted(v)]] for (k, p), v in marks]
    open(os.path.join(TEXTS, 'pg-' + tid + '.js'), 'w', encoding='utf-8').write('globalThis.BEATLAB_PAGES=Object.assign(globalThis.BEATLAB_PAGES||{},{%s:%s});\n' % (json.dumps(tid), json.dumps(rows, ensure_ascii=False, separators=(',', ':'))))


def read_index():
    p = os.path.join(TEXTS, 'pgs.js')
    if not os.path.exists(p): return {}
    s = open(p, encoding='utf-8').read()
    m = re.search(r'BEATLAB_PAGEN\|\|\{\},(\{.*\})\);\s*$', s, re.S)
    return json.loads(m.group(1)) if m else {}


def write_index(idx):
    open(os.path.join(TEXTS, 'pgs.js'), 'w', encoding='utf-8').write('globalThis.BEATLAB_PAGEN=Object.assign(globalThis.BEATLAB_PAGEN||{},' + json.dumps(idx, ensure_ascii=False, sort_keys=True, separators=(',', ':')) + ');\n')


def build(only=None):
    """for every scanned text whose page data has been fetched: match it, write texts/pg-<id>.js (if the match is good enough) and the index texts/pgs.js, and report"""
    sys.path.insert(0, HERE); os.chdir(HERE)
    import texts_archive as A
    have = {f[:-3] for f in os.listdir(TEXTS) if f.endswith('.js')}; idx = read_index(); report = {}
    for tid, spec in A.SPECS.items():
        if tid not in have or (only and tid not in only): continue
        idents = list(dict.fromkeys(spec['idents']))      # a book that several texts are cut from, or one text cut in several slices, is one scan once
        if any(A.IS_PG(i) for i in idents): continue      # a typed text: below
        t0 = time.time()
        try: res = match_text(tid, idents)
        except Exception as e: report[tid] = {'status': 'error: %s' % e}; continue
        if res is None: report[tid] = {'status': 'no page data'}; continue
        meta = res.get('meta') or load_text(tid)[0]; g = grade_of(res); n = sum(len(v) for v in res['marks'].values())
        if g and n and any(c[2] > 0 and not c[4] for c in res['checks']): g = ''; unconfirmed = True      # the numbers could not be checked against the pages (nor calibrated by the Archive's search): wrong numbers are worse than none
        else: unconfirmed = False
        report[tid] = {'status': 'unconfirmed' if unconfirmed else 'ok' if g else 'weak', 'grade': g, 'cover': round(res['cover'], 4), 'words': res['words'], 'leaves': res.get('leaves', 0), 'placed': res.get('placed', 0), 'checks': res['checks'], 'secs': round(time.time() - t0, 1)}
        f = os.path.join(TEXTS, 'pg-' + tid + '.js')
        if g and n:
            write_sidecar(tid, res, len(idents)); idx[tid] = [n, meta.get('chars', 0), meta.get('n', 0), g, len(idents) if len(idents) > 1 else 0]
        else:
            idx.pop(tid, None)
            if os.path.exists(f): os.remove(f)
        print('%-10s %-6s grade %-2s cover %.3f  words %8d  leaves %5d placed %5d  %.1fs' % (tid, report[tid]['status'], g or '-', res['cover'], res['words'], res.get('leaves', 0), res.get('placed', 0), time.time() - t0), flush=True)
    for tid, nums in pg_items().items():      # Project Gutenberg texts, by the page numbers of their web editions
        if tid not in have or (only and tid not in only): continue
        t0 = time.time()
        try: res = match_text(tid, nums)
        except Exception as e: report[tid] = {'status': 'error: %s' % e}; continue
        if res is None: report[tid] = {'status': 'no web edition fetched'}; continue
        meta = res.get('meta') or load_text(tid)[0]; g = grade_of(res); n = sum(len(v) for v in res['marks'].values()); nl = res.get('leaves', 0)
        st = 'ok' if g and n else ('no page numbers' if nl < 5 else 'weak')
        report[tid] = {'status': st, 'grade': g, 'cover': round(res['cover'], 4), 'words': res['words'], 'leaves': nl, 'placed': res.get('placed', 0), 'checks': res['checks'], 'secs': round(time.time() - t0, 1)}
        f = os.path.join(TEXTS, 'pg-' + tid + '.js')
        if st == 'ok': write_sidecar(tid, res, len(nums)); idx[tid] = [n, meta.get('chars', 0), meta.get('n', 0), g, len(nums) if len(nums) > 1 else 0]
        else:
            idx.pop(tid, None)
            if os.path.exists(f): os.remove(f)
        print('%-10s %-16s grade %-2s cover %.3f  words %8d  leaves %5d placed %5d  %.1fs' % (tid, st, g or '-', res['cover'], res['words'], nl, res.get('placed', 0), time.time() - t0), flush=True)
    write_index(idx)
    rp = os.path.join(CACHE, 'build-report.json')
    try: old = json.load(open(rp))
    except Exception: old = {}
    old.update(report); json.dump(old, open(rp, 'w'), indent=0)      # a run for a few texts adds to the report of the earlier runs



def verify(tids, n=8, seed=7):
    """an independent check of the marks, for a few texts: the Archive's own search inside the scan is asked which page each of n phrases (six words from just after a mark) is on, and the answer is compared with the printed page this tool gave it.
    Only phrases of at least 22 letters are used (short ones match everywhere). Prints agree / differ / no answer for each text; changes nothing."""
    import random
    from concurrent.futures import ThreadPoolExecutor
    sys.path.insert(0, HERE); os.chdir(HERE)
    import texts_archive as A
    out = {}
    for tid in tids:
        idents = list(dict.fromkeys(A.SPECS[tid]['idents'])); res = match_text(tid, idents)
        if not res or not res['marks']: out[tid] = None; continue
        secs = res['secs']; rnd = random.Random(seed); keys = sorted(res['marks']); rnd.shuffle(keys); jobs = []; textread = {c[0] for c in res['checks'] if len(c) > 5 and c[5]}
        for k in keys:
            for off, lab in res['marks'][k]:
                blk = re.split(r'\n{2,}', secs[k[0]][1])[k[1]]
                if blk.startswith('## '): blk = blk[blk.find('\n') + 1:]
                phrase = ' '.join(blk[off:].split()[:6]); vol = 0
                m2 = re.match(r'^~?(?:(\d+):)?(.+)$', lab)
                if m2.group(1): vol = int(m2.group(1)) - 1
                if len(re.sub(r'[^A-Za-z]', '', phrase)) >= 22: jobs.append((idents[vol], phrase, m2.group(2), res['at'].get((k[0], k[1], off), (0, -1))[1]))
            if len(jobs) >= n: break
        def one(j):
            ident, phrase, lab, myleaf = j
            try:
                meta = json.load(open(os.path.join(ARCH, ident + '.meta.json'))); url = 'https://%s/fulltext/inside.php?item_id=%s&doc=%s&path=%s&q=%s' % (meta['server'], ident, ident, urllib.parse.quote(meta['dir']), urllib.parse.quote('"' + phrase + '"'))
                hits = json.loads(urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': UA}), timeout=45).read().decode('utf-8', 'replace')).get('matches', [])
                leaves = [h['par'][0]['page'] for h in hits if h.get('par')]
                if not leaves: return 'none'
                if ident in textread: return ('djvu', myleaf, leaves)      # read from the _djvu.xml: compared below, as page against page
                pn = {e['leafNum']: clean_label(e.get('pageNumber')) for e in json.load(open(os.path.join(CACHE, ident, ident + '_page_numbers.json')))['pages']}
                return 'agree' if any(pn.get(L) == lab for L in leaves) else 'differ'
            except Exception: return 'none'
        with ThreadPoolExecutor(max_workers=3) as ex: r = list(ex.map(one, jobs))
        dj = [x for x in r if isinstance(x, tuple)]
        if dj:      # the Archive's leaf and the page this tool put the phrase on differ by the same number for every phrase of a scan, whatever the two are counted from: that number is the scan's offset, and a phrase off it is a mistake
            offs = collections.Counter(m - min(ls, key=lambda q: abs(q - m)) for _, m, ls in dj); mode = offs.most_common(1)[0][0]
            r = [x for x in r if not isinstance(x, tuple)] + ['agree' if (m - min(ls, key=lambda q: abs(q - m))) == mode else 'differ' for _, m, ls in dj]
        out[tid] = {x: r.count(x) for x in ('agree', 'differ', 'none')}; print(tid, out[tid], flush=True)
    return out




def calibrate(idents, n=8):
    """for a scan whose printed numbers cannot be found in its pages, the offset between the Archive's page list and its text index, worked out from the Archive's own search: for n phrases that occur once in the book's text, the
    index entry the phrase lies in (k) is found here, the leaf the Archive says it is on (L) is asked of its search, and k - L is the offset; it is kept only if at least four answers agree and they are at least 70% of those given"""
    import random, collections
    from concurrent.futures import ThreadPoolExecutor
    cur = calibrated(); res = {}
    for ident in idents:
        d = os.path.join(CACHE, ident)
        try:
            idx = json.loads(gzip.open(os.path.join(d, ident + '_hocr_pageindex.json.gz')).read()); txt = gzip.open(os.path.join(d, ident + '_hocr_searchtext.txt.gz')).read().decode('utf-8', 'replace')
            meta = json.load(open(os.path.join(ARCH, ident + '.meta.json')))
        except Exception: res[ident] = None; continue
        starts = [e[0] for e in idx]; rnd = random.Random(3); phrases = []
        for _ in range(400):
            if len(phrases) >= n: break
            pos = rnd.randrange(len(txt) // 20, len(txt) - len(txt) // 20); w = re.findall(r"[A-Za-z']+", txt[pos:pos + 120])[1:7]
            ph = ' '.join(w)
            if len(w) == 6 and len(re.sub(r"[^A-Za-z]", '', ph)) >= 26 and txt.count(ph) == 1 and re.fullmatch(r"[A-Za-z' ]+", ph): phrases.append((ph, txt.find(ph)))
        def one(ph):
            phrase, pos = ph; k = bisect.bisect_right(starts, pos) - 1
            while k > 0 and idx[k][1] <= pos: k += 1      # the entry whose text range holds the position
            while k < len(idx) - 1 and idx[k][1] <= pos: k += 1
            try:
                url = 'https://%s/fulltext/inside.php?item_id=%s&doc=%s&path=%s&q=%s' % (meta['server'], ident, ident, urllib.parse.quote(meta['dir']), urllib.parse.quote('"' + phrase + '"'))
                hits = json.loads(urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': UA}), timeout=45).read().decode('utf-8', 'replace')).get('matches', [])
                leaves = {h['par'][0]['page'] for h in hits if h.get('par')}
                return (k - leaves.pop()) if len(leaves) == 1 else None
            except Exception: return None
        with ThreadPoolExecutor(max_workers=3) as ex: got = [g for g in ex.map(one, phrases) if g is not None]
        c = collections.Counter(got); best = c.most_common(1)[0] if c else None
        if best and best[1] >= 4 and best[1] >= 0.7 * len(got): cur[ident] = best[0]; res[ident] = best[0]
        else: res[ident] = None
        print(ident, dict(c), '->', res[ident], flush=True)
    json.dump(cur, open(os.path.join(CACHE, 'offsets.json'), 'w'))
    return res



if __name__ == '__main__':
    a = sys.argv[1:]; cmd = a[0] if a else ''; kw = dict(x.lstrip('-').split('=', 1) for x in a[1:] if '=' in x)
    if cmd == 'fetch': fetch(kw.get('only'), int(kw['limit']) if 'limit' in kw else None)
    elif cmd == 'build': build(set(t for t in (kw.get('only') or '').split(',') if t) or None)
    elif cmd == 'fetchpg': fetch_pg(kw.get('only'))
    elif cmd == 'fetchxml': fetch_djvu(kw.get('only'))
    elif cmd == 'fetchpg2': fetch_pg_gently(float(kw.get('pause', 6)), int(kw['limit']) if 'limit' in kw else None)
    elif cmd == 'calibrate': calibrate([t for t in (kw.get('only') or '').split(',') if t])
    elif cmd == 'verify':
        res = verify([t for t in (kw.get('only') or '').split(',') if t], int(kw.get('n', 8))); json.dump(res, open(os.path.join(CACHE, 'verify.json'), 'w'))
        a = sum((v or {}).get('agree', 0) for v in res.values()); d = sum((v or {}).get('differ', 0) for v in res.values()); z = sum((v or {}).get('none', 0) for v in res.values())
        print('verified %d texts: %d phrases on the page this tool gave, %d on another, %d with no answer from the Archive' % (len(res), a, d, z))
    else: print(__doc__)
