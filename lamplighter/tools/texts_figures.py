#!/usr/bin/env python3
"""Pictures from the original editions of the library's texts.

The texts in ../texts/<id>.js are plain words (the builder drops every [Illustration] line), so a book such as Waite's *Pictorial Key to the Tarot* arrives without its cards. This tool puts the
pictures back, beside the text rather than in it: for each text made from a Project Gutenberg book it reads the book's EPUB with images, finds every illustration with its caption and the words
printed just before it, finds those words in our own text (section and paragraph), shrinks the picture, and writes
    ../texts/fig-<id>.js    globalThis.BEATLAB_FIGS[id] = [[section, paragraph, data address, width, height, description, caption], ...]    the picture shows after that paragraph (-1: before the first)
    ../texts/figs.js        globalThis.BEATLAB_FIGN = { id: [pictures, bytes, characters, sections] }    which texts have pictures (so the reader loads a picture file only when there is one) and the text they were placed in:
                            the reader and the Library show them only while the text still has that many characters and sections, because a rebuilt text can move paragraphs
(Pictures of the ceremonies and sacred objects of living peoples are not left out: the Library is a collection of all human religion; an exclusion that earlier notes had wrongly called the maker's rule was withdrawn on 17 November 2026.)
Nothing in texts/<id>.js changes, so highlights, bookmarks, search, "Find similar" and the passage picker see exactly the text they always did. Pictures are stored as data addresses inside a script
file, like the texts, so the app still opens from a file with no server and an export can include them. A file the book names as its cover is left out, as are ornaments, rules, decorated first letters (a picture described by one letter, which the text already has) and small pictures nobody described; a binding or a title page that the book names otherwise is kept, as a picture of the book.

Sources that are scans (the Internet Archive) are not done: their OCR text has no picture positions; the PDF of the scan, linked from each text's details, has every page as printed.

Run from anywhere:  python3 -I tools/texts_figures.py [--only=id1,id2] [--list] [--refresh] [--max-mb=14]
   --list     only report how many pictures each text has and how many could be placed; write nothing
Needs ImageMagick (the magick command) to shrink the pictures.
"""
import hashlib, html.parser, io, json, os, posixpath, re, subprocess, sys, tempfile, time, urllib.parse, urllib.request, zipfile, base64
from xml.etree import ElementTree as ET

HERE = os.path.dirname(os.path.abspath(__file__)); BEAT = os.path.dirname(HERE); ROOT = os.path.dirname(BEAT)
TEXTS = os.path.join(ROOT, 'texts'); CACHE = os.path.join(HERE, 'cache', 'figures')
UA = 'BeatlabFigures/1.0 (offline religion library; polite, one request at a time)'
ARGS = sys.argv[1:]; LIST = '--list' in ARGS; REFRESH = '--refresh' in ARGS; ONLY = None; MAXMB = 14.0
for a in ARGS:
    if a.startswith('--only='): ONLY = [x for x in a[7:].split(',') if x]
    if a.startswith('--max-mb='): MAXMB = float(a[9:])
MAGICK = '/opt/homebrew/bin/magick' if os.path.exists('/opt/homebrew/bin/magick') else 'magick'
os.makedirs(CACHE, exist_ok=True)

TOK = re.compile(r'[^\W_]+')
tokenize = lambda s: TOK.findall(s.lower())

# ───────────────────────── the EPUB's text and pictures, in reading order ─────────────────────────
class Flow(html.parser.HTMLParser):
    """The words of one XHTML page, and each picture with the number of words before it, its alt text, its caption and the classes around it."""
    def __init__(self, tokens):
        super().__init__(convert_charrefs=True); self.tokens = tokens; self.items = []; self.skip = 0; self.stack = []; self.cap_depth = 0; self.last = None
    def _img(self, a):
        src = a.get('src') or a.get('xlink:href') or a.get('href')
        if not src: return
        self.last = dict(at=len(self.tokens), src=src, alt=(a.get('alt') or '').strip(), cap='', cls=' '.join(c for _, c in self.stack), w=a.get('width'), h=a.get('height')); self.items.append(self.last)
    def handle_starttag(self, tag, attrs):
        a = dict(attrs); cls = (a.get('class') or '').lower()
        if tag in ('img', 'image'): self._img(a); return
        if tag in ('br', 'hr', 'meta', 'link', 'input'): return
        self.stack.append((tag, cls))
        if tag in ('script', 'style', 'head', 'title'): self.skip += 1
        if tag == 'figcaption' or 'caption' in cls: self.cap_depth = len(self.stack)
    def handle_startendtag(self, tag, attrs): self.handle_starttag(tag, attrs); self.handle_endtag(tag)
    def handle_endtag(self, tag):
        if tag in ('img', 'image', 'br', 'hr', 'meta', 'link', 'input'): return
        for k in range(len(self.stack) - 1, -1, -1):
            if self.stack[k][0] == tag:
                if self.cap_depth and k + 1 <= self.cap_depth: self.cap_depth = 0
                if tag in ('script', 'style', 'head', 'title'): self.skip = max(0, self.skip - 1)
                del self.stack[k:]; break
    def handle_data(self, d):
        if self.skip: return
        if self.cap_depth and self.last is not None: self.last['cap'] += d; return
        self.tokens.extend(tokenize(d))

def epub_flow(path):
    z = zipfile.ZipFile(path); root = ET.fromstring(z.read('META-INF/container.xml')); opf = root.find('.//{*}rootfile').get('full-path'); base = posixpath.dirname(opf)
    o = ET.fromstring(z.read(opf)); man = {i.get('id'): i.get('href') for i in o.findall('.//{*}manifest/{*}item')}
    spine = [man[r.get('idref')] for r in o.findall('.//{*}spine/{*}itemref') if r.get('idref') in man]
    tokens = []; pics = []
    for href in spine:
        if not re.search(r'\.x?html?$', href, re.I): continue
        name = posixpath.normpath(posixpath.join(base, href.split('#')[0]))
        try: raw = z.read(name).decode('utf-8', 'replace')
        except KeyError: continue
        f = Flow(tokens); f.feed(raw); f.close()
        for it in f.items:
            src = urllib.parse.unquote(it['src'].split('#')[0])
            if re.match(r'^(https?:|data:)', src): continue
            full = posixpath.normpath(posixpath.join(posixpath.dirname(name), src))
            try: data = z.read(full)
            except KeyError: continue
            it['name'] = full; it['data'] = data; it['page'] = name; pics.append(it)
    return tokens, pics

def fetch_epub(n):
    p = os.path.join(CACHE, 'pg%d.epub' % n)
    if REFRESH or not os.path.exists(p):
        req = urllib.request.Request('https://www.gutenberg.org/ebooks/%d.epub.images' % n, headers={'User-Agent': UA})
        with urllib.request.urlopen(req, timeout=120) as r: data = r.read()
        open(p, 'wb').write(data); time.sleep(0.4)
    return p

# ───────────────────────── our own text ─────────────────────────
def load_text(tid):
    s = open(os.path.join(TEXTS, tid + '.js'), encoding='utf-8').read(); dec = json.JSONDecoder(); i = len('BEATLAB_TEXTS.add(')
    def skip(i):
        while s[i] in ' \n,': i += 1
        return i
    _, i = dec.raw_decode(s, i); i = skip(i); meta, i = dec.raw_decode(s, i); i = skip(i); secs, i = dec.raw_decode(s, i); return meta, secs

def our_tokens(secs):
    """Every word of the text with its section and paragraph (the reader's paragraphs are the blocks between blank lines)."""
    T = []; S = []; B = []
    for si, (_, body) in enumerate(secs):
        for bi, blk in enumerate(re.split(r'\n{2,}', body)):
            for t in tokenize(blk): T.append(t); S.append(si); B.append(bi)
    return T, S, B

def make_index(T):
    ix = {}
    for k, t in enumerate(T): ix.setdefault(t, []).append(k)
    return ix

def img_dims(d):
    """(width, height) of a PNG, JPEG or GIF from its header, or None."""
    try:
        if d[:8] == b'\x89PNG\r\n\x1a\n': return int.from_bytes(d[16:20], 'big'), int.from_bytes(d[20:24], 'big')
        if d[:6] in (b'GIF87a', b'GIF89a'): return int.from_bytes(d[6:8], 'little'), int.from_bytes(d[8:10], 'little')
        if d[:2] == b'\xff\xd8':
            i = 2
            while i < len(d) - 9:
                if d[i] != 0xFF: i += 1; continue
                m = d[i + 1]
                if m in (0xC0, 0xC1, 0xC2, 0xC3, 0xC5, 0xC6, 0xC7, 0xC9, 0xCA, 0xCB, 0xCD, 0xCE, 0xCF): return int.from_bytes(d[i + 7:i + 9], 'big'), int.from_bytes(d[i + 5:i + 7], 'big')
                if m in (0xD8, 0x01) or 0xD0 <= m <= 0xD7: i += 2; continue
                i += 2 + int.from_bytes(d[i + 2:i + 4], 'big')
    except Exception: pass
    return None

def find_all(T, ix, seq):
    """Every position where the words seq occur in T (the rarest word is looked up in the index rather than scanning the text)."""
    rare = min(range(len(seq)), key=lambda j: len(ix.get(seq[j], ())))
    out = []
    for pos in ix.get(seq[rare], ()):
        s0 = pos - rare
        if s0 >= 0 and s0 + len(seq) <= len(T) and T[s0:s0 + len(seq)] == seq: out.append(s0)
    return out

def candidate(T, ix, before, after, expected):
    """(evidence, position) of the word in our text after which a picture goes, from the words printed just before it (or, failing that, just after it);
    where the words occur more than once the occurrence nearest the expected place wins. Evidence is how many words matched (more is better); None when nothing matches."""
    nearest = lambda ps, off: min(ps, key=lambda q: abs(q + off - expected)) + off
    for k in (12, 9, 7, 5):
        if len(before) >= k:
            ps = find_all(T, ix, before[-k:])
            if ps: return k, nearest(ps, k - 1)
    for j in range(len(before) - 1, 4, -1):                  # the nearest stretch of words before the picture that our text does have (the page may differ here)
        ps = find_all(T, ix, before[j - 5:j])
        if ps: return 4, nearest(ps, 4)
    for k in (12, 8, 5):
        if len(after) >= k:
            ps = find_all(T, ix, after[:k])
            if ps: return 3, nearest(ps, 0) - 1
    return None

def keep_in_order(cands):
    """The largest-evidence set of (epub position, our position, evidence) that never goes backwards in our text: a coincidental match far from the others is dropped."""
    n = len(cands); best = [c[2] for c in cands]; prev = [-1] * n
    for i in range(n):
        for j in range(i):
            if cands[j][1] <= cands[i][1] and best[j] + cands[i][2] > best[i]: best[i] = best[j] + cands[i][2]; prev[i] = j
    if not n: return set()
    i = max(range(n), key=lambda k: best[k]); keep = set()
    while i >= 0: keep.add(i); i = prev[i]
    return keep

def interpolate(at, anchors, gap=2500):
    """Our position for a picture that matched nothing: between the kept pictures before and after it (by how far through the book's words it is), if they are near enough; None otherwise."""
    prv = [a for a in anchors if a[0] <= at]; nxt = [a for a in anchors if a[0] >= at]
    if not prv or not nxt: return None
    a0 = prv[-1]; a1 = nxt[0]
    if a1[0] - a0[0] > gap: return None
    if a1[0] == a0[0]: return a0[1]
    return int(a0[1] + (at - a0[0]) * (a1[1] - a0[1]) / (a1[0] - a0[0]))

# ───────────────────────── the pictures ─────────────────────────
def run(cmd): return subprocess.run(cmd, capture_output=True, text=True)
def shrink(data, name, maxdim, quality):
    """(bytes, mime, width, height) of the picture made small enough to carry, or None if it is not a usable picture."""
    with tempfile.TemporaryDirectory() as d:
        src = os.path.join(d, 'in' + (os.path.splitext(name)[1] or '.img')); open(src, 'wb').write(data)
        r = run([MAGICK, 'identify', '-format', '%m %w %h %k %A\n', src + '[0]'])
        if r.returncode != 0 or not r.stdout.strip(): return None
        fmt, w, h, colors, alpha = r.stdout.strip().split('\n')[0].split()[:5]; w = int(w); h = int(h); colors = int(colors)
        if w < 64 or h < 48 or len(data) < 2500: return None
        if len(data) <= 70000 and max(w, h) <= maxdim and fmt in ('JPEG', 'PNG', 'GIF'): return data, {'JPEG': 'image/jpeg', 'PNG': 'image/png', 'GIF': 'image/gif'}[fmt], w, h
        outs = []
        jp = os.path.join(d, 'o.jpg'); r1 = run([MAGICK, src + '[0]', '-auto-orient', '-background', 'white', '-alpha', 'remove', '-strip', '-resize', '%dx%d>' % (maxdim, maxdim), '-quality', str(quality), '-interlace', 'Plane', jp])
        if r1.returncode == 0 and os.path.exists(jp): outs.append((os.path.getsize(jp), jp, 'image/jpeg'))
        if colors <= 256 or fmt in ('PNG', 'GIF'):
            pn = os.path.join(d, 'o.png'); r2 = run([MAGICK, src + '[0]', '-auto-orient', '-strip', '-resize', '%dx%d>' % (maxdim, maxdim), '-colors', '128' if colors > 128 else str(max(2, colors)), 'PNG8:' + pn])
            if r2.returncode == 0 and os.path.exists(pn): outs.append((os.path.getsize(pn), pn, 'image/png'))
        if not outs: return None
        outs.sort(key=lambda x: x[0]); size, path, mime = outs[0]
        ri = run([MAGICK, 'identify', '-format', '%w %h', path]); ow, oh = (int(x) for x in ri.stdout.split()[:2])
        return open(path, 'rb').read(), mime, ow, oh

def clean_caption(s): return re.sub(r'\s+', ' ', s).strip()

def process(tid, pgs):
    meta, secs = load_text(tid); T, S, B = our_tokens(secs); ix = make_index(T)
    allt = []; pics = []
    for pg in pgs:                                           # volumes follow one another: one stream of words, pictures numbered along it
        tokens, ps = epub_flow(fetch_epub(pg)); off = len(allt); allt.extend(tokens)
        for it in ps: it['at'] += off; it['pg'] = pg; pics.append(it)
    keep = []; seen = set(); n_all = len(pics)
    for it in pics:
        h = hashlib.sha1(it['data']).hexdigest(); low = (it['name'] + ' ' + it['cls'] + ' ' + it['page']).lower()
        if any(w in low for w in ('cover', 'logo', 'ornament', 'divider', 'deco', 'rule')) or h in seen: continue
        dm = img_dims(it['data'])
        if len(it['data']) < 2500 or (dm and (dm[0] < 64 or dm[1] < 48)): continue
        if re.search(r'ornament|decorat|divider|flourish|tail.?piece|head.?piece|border|\bbar\b|\brule\b|\bline\b', it['alt'].lower()) or (dm and dm[0] >= 5 * dm[1] and dm[1] <= 160): continue      # a decoration, not a picture of the book
        if not it['cap'] and re.match(r'^[A-Za-zÀ-ɏ]{1,2}\.?$', it['alt'].strip()): continue      # a drop cap: the book's decorated first letter, which the text already has as a letter
        if dm and dm[0] <= 110 and dm[1] <= 110 and not it['alt'].strip() and not it['cap']: continue      # a small picture that nobody described: an ornament or a decorated initial
        seen.add(h); keep.append(it)
    cands = []                                               # (epub position, our position, evidence, picture)
    for it in keep:
        at = it['at']; expected = at * len(T) / max(1, len(allt)); c = candidate(T, ix, allt[max(0, at - 420):at], allt[at:at + 14], expected)
        if c: cands.append((at, c[1], c[0], it))
    ok = keep_in_order([(a, pos, ev) for a, pos, ev, _ in cands]); anchors = sorted((cands[i][0], cands[i][1]) for i in ok)
    found = []; unplaced = []; used = set(ok)
    for i in sorted(ok): a, pos, ev, it = cands[i]; pos = max(0, min(pos, len(T) - 1)); it['where'] = (S[pos], B[pos], pos); it['exact'] = True; found.append(it)
    placed_ids = set(id(cands[i][3]) for i in ok)
    for it in keep:
        if id(it) in placed_ids: continue
        pos = interpolate(it['at'], anchors)
        if pos is None: unplaced.append(it); continue
        pos = max(0, min(pos, len(T) - 1)); it['where'] = (S[pos], B[pos], pos); it['exact'] = False; found.append(it)
    found.sort(key=lambda it: (it['where'][0], it['where'][1], it['at']))
    return meta, secs, found, unplaced, n_all

def build(tid, found, budget, secs):
    """Shrink each picture, tightening the size if the total would not fit; returns [[s, p, address, w, h, alt, caption], ...] and the byte total."""
    for maxdim, quality in ((1000, 72), (900, 66), (760, 62), (640, 58), (520, 54)):
        out = []; total = 0; seen = set()
        for it in found:
            r = shrink(it['data'], it['name'], maxdim, quality)
            if r is None: continue
            data, mime, w, h = r; hh = hashlib.sha1(data).hexdigest()
            if hh in seen: continue
            seen.add(hh); s, p, _ = it['where']; cap = clean_caption(it['cap']); alt = it['alt'] if it['alt'] and not re.match(r'^\[?\s*illustration\s*\]?$', it['alt'], re.I) else ''
            uri = 'data:%s;base64,%s' % (mime, base64.b64encode(data).decode('ascii')); out.append([s, p, uri, w, h, alt or cap or 'Picture in the section “%s”' % re.sub(r'\s+', ' ', secs[s][0]).strip()[:70], cap]); total += len(uri)
        if total <= budget * 1048576: return out, total, (maxdim, quality)
    return out, total, (maxdim, quality)

def main():
    meta_all = json.loads(subprocess.run(['node', '-e', "const vm=require('vm'),fs=require('fs');globalThis.BEATLAB_TEXTS={meta:{},data:{},add(){},addIndex(o){Object.assign(this.meta,o)}};vm.runInThisContext(fs.readFileSync(%r,'utf8'));console.log(JSON.stringify(BEATLAB_TEXTS.meta))" % os.path.join(TEXTS, 'index.js')], capture_output=True, text=True, check=True).stdout)
    sys.path.insert(0, HERE)
    try:
        import texts_archive as TA; specs = TA.SPECS
    except Exception: specs = {}
    jobs = {}
    for tid, m in sorted(meta_all.items()):
        if ONLY is not None and tid not in ONLY: continue
        idents = (specs.get(tid) or {}).get('idents') or []; pgs = [int(x[2:]) for x in idents if re.match(r'^PG\d+$', x)]
        if not pgs:
            mm = re.match(r'https?://www\.gutenberg\.org/ebooks/(\d+)$', m.get('src', ''))
            if mm: pgs = [int(mm.group(1))]
        if pgs and not (idents and any(not re.match(r'^PG\d+$', x) for x in idents)): jobs[tid] = pgs      # a text mixing Gutenberg and scans is left to the scans' PDF
    index = {}
    p = os.path.join(TEXTS, 'figs.js')
    if os.path.exists(p):
        s = open(p, encoding='utf-8').read(); index = json.loads(s[s.index('(', s.index('assign')) + 1:s.rindex(');')].split(',', 1)[1])
    if ONLY is None: index = {k: v for k, v in index.items() if k not in jobs and k in meta_all}      # a full pass redoes only its own texts (those made from a Gutenberg book); the pictures of the scans (tools/texts_plates.py) stay
    rows = []; touched = {}                                     # the texts this run has decided about: id -> its entry in figs.js, or None for no pictures
    def drop(tid):
        """A text that has no picture left (the filters changed, or the book had none worth keeping) gives up its entry and its file."""
        f = os.path.join(TEXTS, 'fig-' + tid + '.js'); touched[tid] = None
        if index.pop(tid, None) is not None or os.path.exists(f):
            if os.path.exists(f): os.remove(f)
            print('         no pictures are kept for %s any more: its picture file was removed' % tid, flush=True)
    for k, (tid, pgs) in enumerate(jobs.items()):
        try: meta, secs, found, unplaced, n_all = process(tid, pgs)
        except Exception as e: rows.append((tid, 'ERROR ' + str(e)[:80])); continue
        if not found and not unplaced:
            if not LIST: drop(tid)
            continue
        line ='%-8s PG%s  pictures in the book %d | kept %d (%d by their words, %d by position) | left out %d  (%s)' % (tid, '+'.join(map(str, pgs)), n_all, len(found), sum(1 for f in found if f['exact']), sum(1 for f in found if not f['exact']), len(unplaced), meta['title'][:40]); rows.append((tid, line)); print(line, flush=True)
        if LIST: continue
        if not found: drop(tid); continue
        out, total, how = build(tid, found, MAXMB, secs)
        if not out: drop(tid); continue
        body = json.dumps(out, ensure_ascii=False, separators=(',', ':'))
        open(os.path.join(TEXTS, 'fig-' + tid + '.js'), 'w', encoding='utf-8').write('globalThis.BEATLAB_FIGS=Object.assign(globalThis.BEATLAB_FIGS||{},{%s:%s});\n' % (json.dumps(tid), body))
        index[tid] = [len(out), total, meta['chars'], meta['n']]; touched[tid] = index[tid]; print('         wrote %d pictures, %.1f MB (at %s px, quality %s)' % (len(out), total / 1048576, how[0], how[1]), flush=True)
    if not LIST:
        cur = {}                                                 # figs.js as it is now (another tool may have added to it since this run began), changed only where this run decided
        if os.path.exists(p):
            t = open(p, encoding='utf-8').read(); cur = json.loads(t[t.index('(', t.index('assign')) + 1:t.rindex(');')].split(',', 1)[1])
        for k, v in touched.items():
            if v is None: cur.pop(k, None)
            else: cur[k] = v
        if ONLY is None: cur = {k: v for k, v in cur.items() if k in meta_all}
        index = cur
        open(p, 'w', encoding='utf-8').write('globalThis.BEATLAB_FIGN=Object.assign(globalThis.BEATLAB_FIGN||{},' + json.dumps(index, separators=(',', ':'), sort_keys=True) + ');\n')
        if ONLY is None:                                         # a full pass: a picture file whose text has none now, or has left the Library, would only add to the size of the site
            for f in sorted(os.listdir(TEXTS)):
                mm = re.match(r'^fig-(.+)\.js$', f)
                if mm and mm.group(1) not in index and (mm.group(1) in jobs or mm.group(1) not in meta_all): os.remove(os.path.join(TEXTS, f)); print('removed %s (no pictures are kept for %s any more)' % (f, mm.group(1)))
    print('done: %d texts with pictures, %.1f MB in all' % (len(index), sum(v[1] for v in index.values()) / 1048576))

if __name__ == '__main__': main()
