#!/usr/bin/env python3
"""Pictures from the Internet Archive scans of the Library's texts: the plates and figures of the printed book.

The texts made from a scan (an OCR text) have no pictures in them, and an OCR text has no place for one. This tool finds them in the Archive's own page-layout file for each scan
(`<item>_abbyy.gz`, which marks every picture block on every page and the words around it), takes each picture out of the scan's own page image (the JPEG 2000 file of that page, fetched
from the item's `_jp2.zip`, decoded with macOS's sips and cropped with ImageMagick), places it in our text after the paragraph it followed (the same word-matching as
tools/texts_figures.py), shrinks it, and writes the same files the Project Gutenberg pictures use:
    ../texts/fig-<id>.js    globalThis.BEATLAB_FIGS[id] = [[section, paragraph, data address, width, height, description, caption], ...]
    ../texts/figs.js        globalThis.BEATLAB_FIGN = { id: [pictures, bytes, characters, sections] }
so the reader, the Library chip, the e-book export and the freshness guard need nothing new. The scan's own OCR text keeps its caption lines ("Plate IV", "Fig. 20"), so the picture carries
a description for screen readers and no caption of its own.

Which books. The page-layout software sometimes calls a page of ordinary text, or of a script it cannot read (Ge'ez, Devanagari, cuneiform copies), a picture: the Eskimo about Bering Strait,
Malay Magic, Transcendental Magic and the Omaha Tribe come back mostly as crops of text pages, and the plate pages of Ifugao Law are blank in the scan. So a book is only done after its contact
sheet (--sheet: twelve sample crops, spread through the book) has been looked at, and BOOKS lists those that were. To add one: run --only=<id> --sheet, look at tools/cache/plates/sheets/, and add
the id to BOOKS if nearly every crop is a picture of the book.

What is left out, and why:
 - the cover, the title page, colour cards and white cards (scandata page types), and the first and last leaf;
 - blocks too small to be a picture, blocks that cover a page of running text, crops that are blank, nearly uniform or nearly black (a tissue guard, a shadow), and a plate shown twice;
 - the books named in LEFT_OUT, for a reason of rights (the Goetia scan's colour plates are modern drawings of unclear rights). Plates of the ceremonies and sacred objects of living peoples (Australian
   churinga and initiation ceremonies, Navajo sand paintings, Siouan altars) are NOT left out: the Library is a collection of all human religion, and the withdrawal on 17 November 2026 of an exclusion that
   earlier notes had wrongly called the maker's rule put them back.
Nothing is downloaded that the book's own page does not already offer: the page-layout file and the page images of the same scan the text was made from. Nothing is uploaded.

Run from anywhere:  python3 -I tools/texts_plates.py [--survey | --sheet] [--only=id1,id2] [--min=10] [--max-mb=10] [--max-pics=90] [--refresh] [--list]
   (no option)  the books in BOOKS: fetch, crop, place and write their pictures (a book already written is done again, so --only=<id> for one)
   --survey     read the page-layout files of the likely-illustrated scans (cached in tools/cache/plates/) and print how many pictures each has; writes nothing
   --sheet      with --only: save a contact sheet of sample crops per book to tools/cache/plates/sheets/; writes nothing else
   --list       place the pictures but fetch and write none
   --only=...   any scans, not only those in BOOKS
Needs ImageMagick (the magick command) and macOS's sips.
"""
import gzip, hashlib, io, json, os, re, sys, time, urllib.parse, urllib.request
from xml.etree import ElementTree as ET

HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import texts_figures as F                                    # the placement, shrinking and writing code that the Gutenberg pictures use

ROOT = F.ROOT; TEXTS = F.TEXTS
ARCH = os.path.join(HERE, 'cache', 'archive'); CACHE = os.path.join(HERE, 'cache', 'plates'); os.makedirs(CACHE, exist_ok=True)
UA = 'BeatlabPlates/1.0 (offline religion library; polite, one request at a time)'
PAUSE = 1.0      # seconds between requests to the Archive (spaced out on the maker's word, 17 November 2026: "space em out. dont hit the limiter again")
ARGS = sys.argv[1:]; SURVEY = '--survey' in ARGS; SHEET = '--sheet' in ARGS; LIST = '--list' in ARGS; REFRESH = '--refresh' in ARGS; ONLY = None; MIN = 10; MAXMB = 10.0; MAXPICS = 90
for a in ARGS:
    if a.startswith('--only='): ONLY = [x for x in a[7:].split(',') if x]
    elif a.startswith('--min='): MIN = int(a[6:])
    elif a.startswith('--max-mb='): MAXMB = float(a[9:])
    elif a.startswith('--max-pics='): MAXPICS = int(a[11:])

LEFT_OUT = {      # only for a reason of rights
    'm-goet': 'the Archive item is not the 1904 print: its colour plates are modern drawings whose rights are unclear (the seals in black and white may be old, but the page cannot say which)',
}
BOOKS = ('a-asht', 'a-czap', 'a-hlak', 'a-hula', 'a-nchn', 'a-nnca', 'a-sche', 'a-seab', 'a-siou', 'a-spen', 'a-tsim', 'k-sota', 'm-keysol', 'm-papus', 'w-guaz', 'x-keb', 'x-osr')      # looked at on their contact sheets: nearly every crop is a picture of the book

def http(url, tries=3, timeout=120, total=240):
    """The bytes at a URL, or None (a missing file, or still failing after the tries). No single read may stall for `timeout` seconds, and one fetch may not run past `total` seconds."""
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

def run_t(cmd, timeout=90):
    """Run a command and give up on it after `timeout` seconds (a tool that hangs on one page must not hold up the book)."""
    try: return F.subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
    except Exception:
        class Failed: returncode = 1; stdout = ''; stderr = ''
        return Failed()

# ───────────────────────── the page-layout file of one scan ─────────────────────────
local = lambda tag: tag.rsplit('}', 1)[-1]

def item_meta(ident):
    p = os.path.join(ARCH, ident + '.meta.json')
    if os.path.exists(p): return json.load(open(p, encoding='utf-8'))
    raw = http('https://archive.org/metadata/' + ident)
    if not raw: return None
    open(p, 'wb').write(raw); return json.loads(raw)

def file_named(meta, suffix):
    for f in meta.get('files', []):
        if f.get('name', '').endswith(suffix): return f['name']
    return None

def parse_abbyy(raw_gz):
    """(pages, pics, tokens): pages = [[width, height, words]], pics = [[page, [l, t, r, b], token index, caption guess]], tokens = every word of the text blocks in reading order."""
    f = gzip.GzipFile(fileobj=io.BytesIO(raw_gz)); pages = []; pics = []; tokens = []; cur = None
    for ev, el in ET.iterparse(f, events=('start', 'end')):
        t = local(el.tag)
        if ev == 'start' and t == 'page': cur = dict(w=int(el.get('width') or 0), h=int(el.get('height') or 0), blocks=[])
        elif ev == 'end' and t == 'block' and cur is not None:
            bt = el.get('blockType'); bb = [int(el.get(k) or 0) for k in ('l', 't', 'r', 'b')]
            if bt == 'Picture': cur['blocks'].append(('P', bb, None))
            elif bt == 'Text':
                words = []
                for line in el.iter():
                    if local(line.tag) != 'line': continue
                    w = ''
                    for cp in line.iter():
                        if local(cp.tag) != 'charParams': continue
                        if cp.get('wordStart') == 'true' and w: words.append(w); w = ''
                        w += cp.text or ''
                    if w: words.append(w)
                cur['blocks'].append(('T', bb, ' '.join(words)))
            el.clear()
        elif ev == 'end' and t == 'page':
            pi = len(pages); nwords = 0
            for k, (kind, bb, text) in enumerate(cur['blocks']):
                if kind == 'T':
                    tk = F.tokenize(text); tokens.extend(tk); nwords += len(tk)
                else:
                    cap = ''
                    for k2 in range(k + 1, len(cur['blocks'])):                    # a caption: a short text block after the picture that starts like one, or the next short block below it
                        if cur['blocks'][k2][0] != 'T': continue
                        tx = cur['blocks'][k2][2]
                        if len(tx) <= 260 and (re.match(r'^\W*(plate|pl\.|fig|figure)\b', tx, re.I) or cur['blocks'][k2][1][1] >= bb[3] - 10): cap = tx; break
                    pics.append([pi, bb, len(tokens), cap])
            pages.append([cur['w'], cur['h'], nwords]); cur = None; el.clear()
    return pages, pics, tokens

def scandata_types(ident, meta):
    name = file_named(meta, '_scandata.xml')
    if not name: return {}
    raw = http('https://archive.org/download/%s/%s' % (ident, urllib.parse.quote(name)))
    if not raw: return {}
    out = {}
    try:
        for pg in ET.fromstring(raw).iter():
            if local(pg.tag) != 'page': continue
            leaf = pg.get('leafNum'); pt = next((c.text for c in pg if local(c.tag) == 'pageType'), None)
            if leaf is not None and pt: out[int(leaf)] = pt
    except Exception: pass
    return out

def scan_item(ident):
    """The cached summary of one scan: pages, picture blocks, words, page types. None if the Archive offers no page-layout file for it."""
    p = os.path.join(CACHE, ident + '.scan.json.gz')
    if not REFRESH and os.path.exists(p):
        with gzip.open(p, 'rt', encoding='utf-8') as f: return json.load(f)
    meta = item_meta(ident)
    if not meta: return None
    name = file_named(meta, '_abbyy.gz')
    if not name: return None
    raw = http('https://archive.org/download/%s/%s' % (ident, urllib.parse.quote(name)), timeout=300, total=2400)
    if not raw: return None
    pages, pics, tokens = parse_abbyy(raw); types = scandata_types(ident, meta)
    d = dict(ident=ident, pages=pages, pics=pics, tok=' '.join(tokens), types={str(k): v for k, v in types.items()}, jp2=file_named(meta, '_jp2.zip') is not None)
    with gzip.open(p, 'wt', encoding='utf-8') as f: json.dump(d, f)
    return d

# ───────────────────────── which blocks are pictures of the book ─────────────────────────
def merge_boxes(boxes, gap):
    boxes = [list(b) for b in boxes]; changed = True
    while changed:
        changed = False
        for i in range(len(boxes)):
            for j in range(i + 1, len(boxes)):
                a = boxes[i]; b = boxes[j]
                if a[0] - gap <= b[2] and b[0] - gap <= a[2] and a[1] - gap <= b[3] and b[1] - gap <= a[3]:
                    boxes[i] = [min(a[0], b[0]), min(a[1], b[1]), max(a[2], b[2]), max(a[3], b[3])]; del boxes[j]; changed = True; break
            if changed: break
    return boxes

def regions(sd):
    """[(page, [l, t, r, b], token index, caption)] for the picture blocks worth fetching, merged where they overlap."""
    pages = sd['pages']; types = sd['types']; n = len(pages); byp = {}
    for pi, bb, at, cap in sd['pics']: byp.setdefault(pi, []).append((bb, at, cap))
    out = []
    for pi, items in sorted(byp.items()):
        w, h, words = pages[pi]
        if w <= 0 or h <= 0 or pi == 0 or pi >= n - 1: continue
        if types.get(str(pi), 'Normal') in ('Cover', 'Title', 'Color Card', 'White Card', 'Delete', 'Copyright'): continue
        good = []
        for bb, at, cap in items:
            fw = (bb[2] - bb[0]) / w; fh = (bb[3] - bb[1]) / h
            if fw < 0.12 or fh < 0.07 or fw * fh < 0.02: continue
            if fw / max(fh, 1e-6) > 8 or fh / max(fw, 1e-6) > 8: continue
            if words >= 100 and fw * fh > 0.6: continue                      # a block over a page of running text is a misread, not a picture
            good.append((bb, at, cap))
        if not good: continue
        merged = merge_boxes([g[0] for g in good], int(0.02 * max(w, h)))
        for m in merged:
            inside = [g for g in good if g[0][0] >= m[0] - 2 and g[0][1] >= m[1] - 2 and g[0][2] <= m[2] + 2 and g[0][3] <= m[3] + 2]
            at = min(g[1] for g in inside); cap = next((g[2] for g in inside if g[2]), '')
            out.append((pi, m, at, cap, w, h))
    return out

def page_url(ident, leaf):
    """The address of leaf N's JPEG 2000 page image inside the item's `_jp2.zip` (the Archive serves one member of a zip by its path), or None if the item has no such zip."""
    meta = item_meta(ident); zn = file_named(meta or {}, '_jp2.zip')
    if not zn: return None
    base = zn[:-len('_jp2.zip')]
    return 'https://archive.org/download/%s/%s/%s' % (urllib.parse.quote(ident), urllib.parse.quote(zn), urllib.parse.quote('%s_jp2/%s_%04d.jp2' % (base, base, leaf), safe=''))

def decode_page(jp2_bytes, d):
    """The page as a JPEG file in folder d (macOS's own sips reads JPEG 2000; ImageMagick here does not), or None."""
    src = os.path.join(d, 'page.jp2'); out = os.path.join(d, 'page.jpg'); open(src, 'wb').write(jp2_bytes)
    if os.path.exists(out): os.remove(out)
    r = run_t(['sips', '-s', 'format', 'jpeg', '-s', 'formatOptions', '88', src, '--out', out])
    return out if r.returncode == 0 and os.path.exists(out) else None

def crop_region(page_jpg, bb, w, h, d):
    """The region bb of an ABBYY page of w x h pixels, cut from the decoded page (scaled if the page image has other pixel dimensions), with a thin margin; JPEG bytes."""
    ri = run_t([F.MAGICK, 'identify', '-format', '%w %h', page_jpg])
    try: W, H = (int(x) for x in ri.stdout.split()[:2])
    except Exception: return None
    sx = W / w; sy = H / h; mx = int(0.012 * w); my = int(0.012 * h)
    l = max(0, int((bb[0] - mx) * sx)); t = max(0, int((bb[1] - my) * sy)); r = min(W, int((bb[2] + mx) * sx)); b = min(H, int((bb[3] + my) * sy))
    if r - l < 60 or b - t < 60: return None
    out = os.path.join(d, 'crop.jpg')
    if os.path.exists(out): os.remove(out)
    rr = run_t([F.MAGICK, page_jpg, '-crop', '%dx%d+%d+%d' % (r - l, b - t, l, t), '+repage', '-resize', '1200x1200>', '-quality', '82', '-strip', out])
    return open(out, 'rb').read() if rr.returncode == 0 and os.path.exists(out) else None

def ahash(data):
    """A 64-bit average hash of the picture, to catch the same plate twice (a tissue guard that shows it through, a plate repeated at the end of a volume)."""
    import tempfile
    with tempfile.TemporaryDirectory() as d:
        src = os.path.join(d, 'c.jpg'); out = os.path.join(d, 'o.pgm'); open(src, 'wb').write(data)
        if run_t([F.MAGICK, src + '[0]', '-colorspace', 'Gray', '-resize', '8x8!', '-depth', '8', out]).returncode != 0 or not os.path.exists(out): return None
        raw = open(out, 'rb').read()
    m = re.match(rb'P5\s+8\s+8\s+255\s', raw)
    if not m or len(raw) < m.end() + 64: return None
    px = raw[m.end():m.end() + 64]; avg = sum(px) / 64.0
    return sum(1 << i for i, v in enumerate(px) if v > avg)

def looks_like_a_picture(data):
    """False for a crop that is blank, almost one tone, or almost black (a shadow, a tissue guard, a stamp)."""
    import tempfile
    with tempfile.TemporaryDirectory() as d:
        src = os.path.join(d, 'c.jpg'); open(src, 'wb').write(data)
        r = run_t([F.MAGICK, src + '[0]', '-resize', '96x96', '-colorspace', 'Gray', '-format', '%[fx:mean] %[fx:standard_deviation]', 'info:'])
        try: mean, sd = (float(x) for x in r.stdout.split()[:2])
        except Exception: return False
    return 0.07 < mean < 0.985 and sd > 0.05

# ───────────────────────── one text ─────────────────────────
def restricted(tid, meta):
    if tid in LEFT_OUT: return LEFT_OUT[tid]
    return None

def idents_of(tid):
    import texts_archive as A
    sp = A.SPECS.get(tid) or {}; ids = sp.get('idents') or []
    return [i for i in ids if not re.match(r'^PG\d+$', i)] if ids and not any(re.match(r'^PG\d+$', i) for i in ids) else []

CAPTION_LINE = re.compile(r'^\s*(?:FIG\.?|Fig\.?|FIGURE|Figure|PLATE|Plate|PL\.)\s*[0-9IVXLC]+', re.M)
EXTRA = ('k-sota', 'm-keysol', 'm-goet', 'm-levi', 'm-papus', 'x-dev', 'x-tam', 'x-keb', 'e-mss', 'e-mbv', 'x-osr', 'x-mmt', 'e-kab', 'x-spw', 'x-bdt', 'a-malm', 'a-hula', 'a-czap')

def candidate_ids(ids, min_captions=10):
    """The scans worth reading a page-layout file for: those whose OCR has at least min_captions lines that start like a caption (Fig. 12, Plate IV), and the books listed in EXTRA
    (illustrated, but not by captions of that kind). Counted from the OCR text already in tools/cache/archive, so nothing is fetched to decide."""
    out = []
    for tid in ids:
        n = 0
        for ident in idents_of(tid):
            tp = os.path.join(ARCH, ident + '.txt')
            if os.path.exists(tp): n += len(CAPTION_LINE.findall(open(tp, encoding='utf-8', errors='replace').read()))
        if n >= min_captions or tid in EXTRA: out.append(tid)
    return out

def plan(tid):
    """(meta, secs, placed regions) for one scan text without fetching any picture: [(section, paragraph, token position, region, caption, ident, leaf, page dims)]."""
    meta, secs = F.load_text(tid); idents = idents_of(tid)
    if not idents: return meta, secs, None, 'not made from a scan'
    T, S, B = F.our_tokens(secs); ix = F.make_index(T)
    allt = []; regs = []
    for ident in idents:
        sd = scan_item(ident)
        if sd is None: return meta, secs, None, 'no page-layout file for %s' % ident
        if not sd.get('jp2'): return meta, secs, None, 'no page images (JP2 zip) for %s' % ident
        off = len(allt); allt.extend(sd['tok'].split())
        for pi, bb, at, cap, w, h in regions(sd): regs.append(dict(ident=ident, leaf=pi, bb=bb, at=at + off, cap=cap, w=w, h=h))
    if not regs: return meta, secs, [], 'no picture blocks that pass the filters'
    cands = []
    for k, r in enumerate(regs):
        at = r['at']; expected = at * len(T) / max(1, len(allt)); c = F.candidate(T, ix, allt[max(0, at - 420):at], allt[at:at + 14], expected)
        if c: cands.append((at, c[1], c[0], k))
    ok = F.keep_in_order([(a, pos, ev) for a, pos, ev, _ in cands]); anchors = sorted((cands[i][0], cands[i][1]) for i in ok); placed = []; used = set()
    for i in ok:
        a, pos, ev, k = cands[i]; pos = max(0, min(pos, len(T) - 1)); r = regs[k]; r['where'] = (S[pos], B[pos], pos); r['exact'] = True; placed.append(r); used.add(k)
    for k, r in enumerate(regs):
        if k in used: continue
        pos = F.interpolate(r['at'], anchors)
        if pos is None: continue
        pos = max(0, min(pos, len(T) - 1)); r['where'] = (S[pos], B[pos], pos); r['exact'] = False; placed.append(r)
    placed.sort(key=lambda r: (r['where'][0], r['where'][1], r['at']))
    return meta, secs, (placed, len(regs)), None

def fetch_pictures(tid, placed, secs):
    """Fetch, check and shrink each placed picture; returns the dicts that F.build wants."""
    found = []; seen = set()
    area = lambda r: (r['bb'][2] - r['bb'][0]) * (r['bb'][3] - r['bb'][1]) / max(1, r['w'] * r['h'])
    pool = placed if len(placed) <= MAXPICS * 1.3 else sorted(sorted(placed, key=area, reverse=True)[:int(MAXPICS * 1.3)], key=lambda r: (r['where'][0], r['where'][1], r['at']))      # too many: the larger pictures, kept in book order
    import tempfile
    with tempfile.TemporaryDirectory() as d:
        cur = None; cur_jpg = None; failed = 0; hashes = []; tried = 0
        for r in sorted(pool, key=lambda r: (r['ident'], r['leaf'])):                # one download and one decode per page, however many pictures it has
            if len(found) >= MAXPICS * 2: break
            if (r['ident'], r['leaf']) != cur:
                cur = (r['ident'], r['leaf']); cur_jpg = None; url = page_url(r['ident'], r['leaf'])
                raw = http(url, tries=2, timeout=60, total=150) if url else None
                if raw and len(raw) > 5000: cur_jpg = decode_page(raw, d)
                if cur_jpg is None: failed += 1
                tried += 1
                if tried % 10 == 0: print('          … %d of %d pages looked at, %d pictures kept, %d pages failed' % (tried, len(set((q['ident'], q['leaf']) for q in pool)), len(found), failed), flush=True)
            if cur_jpg is None: continue
            data = crop_region(cur_jpg, r['bb'], r['w'], r['h'], d)
            if not data or len(data) < 4000: continue
            h = hashlib.sha1(data).hexdigest()
            if h in seen or not looks_like_a_picture(data): continue
            ah = ahash(data)
            if ah is not None and any(bin(ah ^ o).count('1') <= 4 for o in hashes): continue
            if ah is not None: hashes.append(ah)
            seen.add(h); cap = re.sub(r'\s+', ' ', r['cap']).strip()
            if sum(ch.isalpha() for ch in cap) < 8: cap = ''                  # a bare page number or a few stray marks is not a caption
            found.append(dict(data=data, name='plate.jpg', where=r['where'], cap='', alt=cap[:160], exact=r['exact'], at=r['at']))
        if failed: print('          %d page images could not be fetched or decoded' % failed, flush=True)
    found.sort(key=lambda it: (it['where'][0], it['where'][1], it['at']))
    return found[:MAXPICS]

def read_index():
    p = os.path.join(TEXTS, 'figs.js')
    if not os.path.exists(p): return {}
    s = open(p, encoding='utf-8').read(); return json.loads(s[s.index('(', s.index('assign')) + 1:s.rindex(');')].split(',', 1)[1])

def merge_index(tid, entry):
    """Set (or, with None, remove) one text's entry in figs.js, starting from the file as it is now: texts_figures.py may have written to it while this tool was working."""
    cur = read_index()
    if entry is None: cur.pop(tid, None)
    else: cur[tid] = entry
    open(os.path.join(TEXTS, 'figs.js'), 'w', encoding='utf-8').write('globalThis.BEATLAB_FIGN=Object.assign(globalThis.BEATLAB_FIGN||{},' + json.dumps(cur, separators=(',', ':'), sort_keys=True) + ');\n')
    return cur

def make_sheet(tid, placed, n=12):
    """One image of n sample crops spread through the book, saved in tools/cache/plates/sheets/ (blank ones are marked in their file names)."""
    import tempfile
    out = os.path.join(CACHE, 'sheets'); os.makedirs(out, exist_ok=True)
    pool = sorted(placed, key=lambda r: (r['where'][0], r['where'][1], r['at'])); step = max(1, len(pool) // n); files = []
    with tempfile.TemporaryDirectory() as d:
        cur = None; jpg = None
        for k, r in enumerate(pool[::step][:n]):
            if (r['ident'], r['leaf']) != cur:
                cur = (r['ident'], r['leaf']); url = page_url(r['ident'], r['leaf']); raw = http(url, tries=2, timeout=60, total=150) if url else None; jpg = decode_page(raw, d) if raw else None
            if not jpg: continue
            data = crop_region(jpg, r['bb'], r['w'], r['h'], d)
            if not data: continue
            f = os.path.join(out, '%s_%02d%s.jpg' % (tid, k, '' if looks_like_a_picture(data) else '_blank')); open(f, 'wb').write(data); files.append(f)
    if not files: return None
    sheet = os.path.join(out, 'sheet_%s.jpg' % tid)
    run_t([F.MAGICK, 'montage'] + files + ['-tile', '6x', '-geometry', '230x230+3+3', '-background', '#222', sheet])
    return sheet

def main():
    import texts_archive as A
    meta_all = json.loads(F.subprocess.run(['node', '-e', "const vm=require('vm'),fs=require('fs');globalThis.BEATLAB_TEXTS={meta:{},data:{},add(){},addIndex(o){Object.assign(this.meta,o)}};vm.runInThisContext(fs.readFileSync(%r,'utf8'));console.log(JSON.stringify(BEATLAB_TEXTS.meta))" % os.path.join(TEXTS, 'index.js')], capture_output=True, text=True, check=True).stdout)
    ids = [i for i in sorted(meta_all) if (ONLY is None or i in ONLY) and idents_of(i)]
    if ONLY is None: ids = candidate_ids(ids) if SURVEY else [i for i in ids if i in BOOKS]
    print('%d scans to look at' % len(ids), flush=True)
    total = 0; report = []
    for tid in ids:
        why = restricted(tid, meta_all[tid])
        if why:
            print('%-9s left out: %s' % (tid, why), flush=True)
            f = os.path.join(TEXTS, 'fig-' + tid + '.js')
            if not (SURVEY or SHEET or LIST) and (os.path.exists(f) or tid in read_index()):          # pictures made before the rule, or by an earlier run, go
                if os.path.exists(f): os.remove(f)
                merge_index(tid, None); print('          its picture file was removed', flush=True)
            continue
        try: meta, secs, res, note = plan(tid)
        except Exception as e: print('%-9s ERROR %s' % (tid, str(e)[:100]), flush=True); continue
        if res is None or not res[0]:
            if SURVEY or ONLY: print('%-9s %s' % (tid, note), flush=True)
            continue
        placed, n_regions = res
        line = '%-9s pictures found %3d | placed %3d (%d by their words, %d by position)  (%s)' % (tid, n_regions, len(placed), sum(1 for r in placed if r['exact']), sum(1 for r in placed if not r['exact']), meta['title'][:44]); print(line, flush=True)
        report.append((tid, n_regions, len(placed)))
        if SHEET:
            sh = make_sheet(tid, placed); print('          contact sheet: %s' % sh, flush=True); continue
        if SURVEY or LIST or len(placed) < MIN: continue
        found = fetch_pictures(tid, placed, secs)
        if len(found) < MIN: print('          only %d usable after checking the crops: not written' % len(found), flush=True); continue
        found.sort(key=lambda it: (it['where'][0], it['where'][1], it['at']))
        out, size, how = F.build(tid, found, MAXMB, secs)
        if not out: continue
        body = json.dumps(out, ensure_ascii=False, separators=(',', ':'))
        open(os.path.join(TEXTS, 'fig-' + tid + '.js'), 'w', encoding='utf-8').write('globalThis.BEATLAB_FIGS=Object.assign(globalThis.BEATLAB_FIGS||{},{%s:%s});\n' % (json.dumps(tid), body))
        merge_index(tid, [len(out), size, meta['chars'], meta['n']]); total += size
        print('          wrote %d pictures, %.1f MB (at %s px, quality %s)' % (len(out), size / 1048576, how[0], how[1]), flush=True)
    index = read_index(); print('done: %d scans with pictures in figs.js now, %.1f MB written in this run' % (sum(1 for i in index if idents_of(i)), total / 1048576))

if __name__ == '__main__': main()
