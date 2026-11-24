#!/usr/bin/env python3
"""The Hermetic Museum (h-museum): a typed copy of the 1893 edition, cut into its tracts, with the printed pages of that edition found from two scans of it.

Why this module exists (18 November 2026, the first book of the quality pass; the numbers are in WHICH_TRANSLATION_PILOT.md at the top of the project): the Library's first copy of this book was
the machine-read text of a Digital Library of India scan (texts_shelf.py). That scan lacks four pages of volume 2 (printed pages 179 to 182) and reads italic type badly ("z¢s earth" for "its earth",
"ove thing" for "one thing", "ze" for "i.e."). The other scan of the same edition that was found (University of Glasgow, Wellcome Library) has other holes (printed pages 195 to 197 of volume 2)
and reads italics no better. A typed transcription of the same printed edition (a volunteer's) has both sets of pages, reads the italics and sits about ten times cleaner against the two scans.
So the text now comes from the typed copy (the Library's usual route for a typed copy: texts_gg.py reads its page; no name and no link of the site that serves it is kept anywhere in the Library:
tests/gg-name.test.js), and the printed pages come from the scans.

  python3 -I tools/texts_hmuseum.py build   writes texts/h-museum.js and its entry in texts/index.js (and LICENSES.txt and README.txt, as build_texts.py does)
  python3 -I tools/texts_hmuseum.py marks   finds the printed pages (volume:page) by matching the text to the scans and writes texts/pg-h-museum.js and its line in texts/pgs.js
  python3 -I tools/texts_hmuseum.py check   reads both back and reports (nothing is written)

build_texts.py calls build(lib, fetch, CACHE) of this module after the other typed texts, so a full rebuild of the Library gives the same text (the scan spec 'h-museum' in texts_shelf.py is overridden).
That spec stays: texts_pages.py and texts_originals.py read the scans' addresses from it, so the page finder and the "Original files" card keep pointing at the printed edition.
texts_pages.py build would find the pages from the first scan alone and leave holes where that scan lacks pages (and would call this text a scan), so run `marks` here instead, after any rebuild of the text.
Nothing is guessed: a page gets a mark only where its first words are found, once, in the place the pages before and after it allow. The entry's note and licence must not contain the words
"scan" or "OCR" (6d-passage.js and 2z-source-core.js take a text for machine-read when they do): tests/hmuseum.test.js checks it.
"""
import json, os, re, sys, collections, pathlib

HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
CACHE = pathlib.Path(HERE) / 'cache'
ROOT = pathlib.Path(HERE).parent.parent; TEXTS = ROOT / 'texts'
TID = 'h-museum'
SLUG = 'hermetic-museum'                       # the typed copy's page, as texts_gg.py caches it: cache/globalgrey/<slug>.online.html
SCANS = ['india.history.resource.84871', 'india.history.resource.84873']          # the Digital Library of India scan, volumes 1 and 2: the printed pages come from these first
OTHER = ['b24927363_0001', 'b24927363_0002']   # the University of Glasgow scan (Wellcome Library), the same edition: fills the pages the first scan has no mark for
SRC = 'https://archive.org/details/' + SCANS[0]
LICENSE = 'Public domain (edition first published before 1929); a typed copy of the printed edition'
BY = 'A. E. Waite (editor and reviser; the translator is not named), The Hermetic Museum, Restored and Enlarged, 2 vols. (London: James Elliott, 1893)'
NOTE = ('Twenty-two alchemical tracts first collected in Latin in 1678, in the English version of 1893 (volume 1: the Golden Tract, the Sophic Hydrolith, the Glory of the World, the Book of Lambspring and others; '
        'volume 2: Thomas Norton’s Ordinal, the New Chemical Light of Sendivogius, the Open Entrance of Philalethes, Helvetius’s Golden Calf and the rest), with the prefaces. Waite’s preface says the translation is the work of an unnamed '
        'translator, revised by him. This is a typed copy of that edition, laid against two digitised copies of the printed volumes: it has the pages each of them lacks (volume 2, printed pages 179 to 182 and 195 to 197) '
        'and it reads the italic type that machine reading gets wrong (“ze” for “i.e.”, “oze” for “one”). A few typing slips remain (for example “he” for “be”). The engraved frontispieces and plates are not here, nor are the printed list of the '
        'Open Entrance’s chapters and the explanation of the frontispiece emblems that the digitised copies carry. The printed page numbers (volume and page) were found from those copies, not typed.')

# the typed copy's own headings, in order, and what each becomes here (the 1893 table of contents, with the volume it is in)
TITLES = [
    ('Preface To The English Edition', 'Volume 1 · Preface to the English edition'),
    ('The Preface Of The Original Edition', 'Volume 1 · Preface to the original edition (1678)'),
    ('The Golden Tract Concerning The Stone Of The Philosophers', 'Volume 1 · I. The Golden Tract concerning the Stone of the Philosophers'),
    ('The Golden Age Restored', 'Volume 1 · II. The Golden Age Restored'),
    ('The Sophic Hydrolith', 'Volume 1 · III. The Sophic Hydrolith, or Water Stone of the Wise'),
    ('A Demonstration Of Nature', 'Volume 1 · IV. A Demonstration of Nature'),
    ('A Short Tract, Or Philosophical Summary', 'Volume 1 · V. A Short Tract, or Philosophical Summary'),
    ('The Only True Way', 'Volume 1 · VI. The Only True Way'),
    ('The Glory Of The World; Or, Table Of Paradise', 'Volume 1 · VII. The Glory of the World; or, Table of Paradise'),
    ('A Tract Of Great Price', 'Volume 1 · VIII. A Tract of Great Price'),
    ('The Book Of Alze', 'Volume 1 · IX. The Book of Alze'),
    ('The Book Of Lambspring', 'Volume 1 · X. The Book of Lambspring'),
    ('The Golden Tripod', 'Volume 1 · XI. The Golden Tripod: Basil Valentine’s Practica, with the Twelve Keys'),
    ('Believe-Me, Or The Ordinal Of Alchemy', 'Volume 2 · I. The Golden Tripod: Thomas Norton’s Ordinal of Alchemy (Believe-Me)'),
    ('The Testament Of Cremer', 'Volume 2 · II. The Golden Tripod: The Testament of Cremer'),
    ('The New Chemical Light', 'Volume 2 · III. The New Chemical Light'),
    ('New Chemical Light', 'Volume 2 · IV. The New Chemical Light, second part: concerning Sulphur'),
    ('An Open Entrance To The Closed Palace Of The King', 'Volume 2 · V. An Open Entrance to the Closed Palace of the King'),
    ('A Subtle Allegory Concerning The Secrets Of Alchemy', 'Volume 2 · VI. A Subtle Allegory concerning the Secrets of Alchemy'),
    ('The Three Treatises Of Philalethes', None),                                   # cut in three below
    ('Helvetius’ Golden Calf', 'Volume 2 · X. Helvetius’ Golden Calf'),
    ('The All-Wise Doorkeeper, Or A Fourfold Figure', 'Volume 2 · XI. The All-Wise Doorkeeper, or A Fourfold Figure'),
    ('Footnotes', 'Footnote to the closing epigram of The Sophic Hydrolith (volume 1)'),
]
THREE = [('I. The Metamorphosis Of Metals', 'Volume 2 · VII. The Three Treatises of Philalethes: I. The Metamorphosis of Metals'),
         ('II. A Short Vade Mecum To The Celestial Ruby', 'Volume 2 · VIII. The Three Treatises of Philalethes: II. A Short Vade Mecum, or Guide to the Celestial Ruby'),
         ('III. The Fount Of Chemical Truth', 'Volume 2 · IX. The Three Treatises of Philalethes: III. The Fount of Chemical Truth')]


# ───────────────────────────── the text ─────────────────────────────
def typed_html(fetch=None, cache=CACHE):
    """the typed copy's page: from the cache where texts_gg.py keeps its pages, or (the Library's usual two requests) fetched by texts_gg.online_html"""
    p = pathlib.Path(cache) / 'globalgrey' / (SLUG + '.online.html')
    if p.exists() and p.stat().st_size > 0: return p.read_text(encoding='utf-8', errors='replace')
    import texts_gg
    return texts_gg.online_html(fetch, pathlib.Path(cache), SLUG)


def cut_three(body):
    """the section that holds the three treatises of Philalethes, cut at the three lines that title them"""
    pos = []
    for rx, _ in THREE:
        m = re.search(r'(?m)^' + re.escape(rx) + r'[ \t]*$', body)
        if not m: raise RuntimeError('treatise heading not found: ' + rx)
        pos.append(m.start())
    if pos != sorted(pos) or pos[0] != 0: raise RuntimeError('treatise headings out of order: %r' % pos)
    ends = pos[1:] + [len(body)]
    return [[THREE[i][1], body[pos[i]:ends[i]].split('\n', 1)[1].strip()] for i in range(3)]


def sections(html):
    import texts_gg
    parts = texts_gg.sections(html); got = [h for h, _ in parts]; want = [h for h, _ in TITLES]
    if got != want: raise RuntimeError('the typed copy’s headings are not what this module was written for: %r' % ([g for g in got if g not in want] + [w for w in want if w not in got])[:6])
    out = []
    for (h, body), (_, title) in zip(parts, TITLES):
        if title is None: out += cut_three(body)
        else: out.append([title, body])
    return out


def build(lib, fetch, CACHE_):
    """the entry for build_texts.py (and write_all): {'h-museum': {secs, by, license, src, verse, note}}"""
    import build_texts_util as U
    secs = sections(typed_html(fetch, CACHE_))
    saved = dict(U.VOCAB)
    try:                                         # the part titles of a long tract quote its first words, chosen against a vocabulary: use this book's own words, so a run on its own and a full rebuild agree
        U.VOCAB.clear(); U.VOCAB.update(collections.Counter(w.lower() for _, b in secs for w in re.findall(r'[A-Za-z]+', b)))
        secs = U.finish(secs, False)
    finally:
        U.VOCAB.clear(); U.VOCAB.update(saved)
    return {TID: dict(secs=secs, by=BY, license=LICENSE, src=SRC, verse=False, note=NOTE)}


# ───────────────────────────── the printed pages ─────────────────────────────
def _tp():
    import texts_pages as P
    return P


def _heads_skipped(toks):
    """index of the first word of a page's own text: the running head (a page number, capitals such as THE HERMETIC MUSEUM) is not in the typed copy. toks are the page's words with their case."""
    i = 0
    while i < len(toks) and i < 12 and (re.fullmatch(r'\d{1,3}', toks[i]) or (toks[i].isupper() and len(toks[i]) > 1)): i += 1
    return i


def place(ours, index_by_word, toks, lo, hi, n=4, tries=14):
    """where a page begins in the text: the first n words of the page (after its running head) found exactly once between positions lo and hi of the text's word stream; else None.
    A page whose first words are not found (a word broken at the page end, a misread word) is tried again from its next word, up to `tries` words in."""
    words = [t.lower() for t in toks]; start = _heads_skipped(toks)
    for h in range(start, min(len(words), start + tries)):
        key = words[h:h + n]
        if len(key) < n: break
        hits = [t for t in index_by_word.get(key[0], ()) if lo <= t < hi - n + 1 and all(ours[t + i][0] == key[i] for i in range(1, n))]
        if len(hits) == 1: return hits[0]
        if len(hits) > 1: return None
    return None


def glasgow_pages(vol, cache=CACHE):
    """the pages of volume 2 of the second scan as {printed page: the page's words}, cut at the printed running heads in its machine-read text ('180 THE HERMETIC MUSEUM.' on even pages,
    'AN OPEN ENTRANCE. 181' on odd ones); only used for printed pages the first scan has no mark for (the four it does not have: 179 to 182)"""
    p = pathlib.Path(cache) / 'archive' / (OTHER[vol - 1] + '.txt')
    if not p.exists(): return {}
    raw = p.read_text(encoding='utf-8', errors='replace').replace('\x0c', '\n')
    heads = [(m.start(), m.end(), int(m.group(1) or m.group(2))) for m in re.finditer(r'(?m)^[^\n\w]{0,3}(?:(\d{1,3})[ .]{1,3}THE HERMETIC MUSEUM[.,]?|[A-Z][A-Z ]{6,40}[.,]?[ .]{0,3}(\d{1,3}))\s*$', raw)]
    out = {}
    for (a, b, n), nxt in zip(heads, heads[1:] + [(len(raw), len(raw), 0)]):
        if n in out or not (1 <= n <= 400): continue
        out[n] = re.findall(r'[^\W_]+', raw[b:nxt[0]])
    return {n: w for n, w in out.items() if (n - 1 in out or n + 1 in out)}      # a head misread as another number stands alone, and is dropped


def marks(write=True, cache=CACHE, texts=TEXTS):
    P = _tp(); meta, secs = P.load_text(TID); ours, paras = P.our_stream(secs)
    index_by_word = collections.defaultdict(list)
    for t, (w, k, p, off) in enumerate(ours): index_by_word[w].append(t)
    at = {(k, p, off): t for t, (w, k, p, off) in enumerate(ours)}
    res = P.match_text(TID, SCANS)                       # the Library's own matcher, against the first scan's pages
    if res is None: raise RuntimeError('the first scan’s page data is missing (texts_pages.py fetch)')
    placed = {}                                          # (volume, page number as int) -> (word index, label as written)
    for (k, p), v in res['marks'].items():
        for off, lab in v:
            m = re.fullmatch(r'(~?)(\d):(\d+)', lab)
            if not m: raise RuntimeError('a page label this module does not know how to order: ' + lab)
            placed[(int(m.group(2)), int(m.group(3)))] = (at[(k, p, off)], lab)
    n0 = len(placed)

    def window(v, n):
        """the part of the text a page of volume v, number n may begin in: after the nearest placed page before it, before the nearest placed page after it"""
        lo = max([t for (vv, nn), (t, _) in placed.items() if (vv, nn) < (v, n)], default=-1) + 1
        hi = min([t for (vv, nn), (t, _) in placed.items() if (vv, nn) > (v, n)], default=len(ours))
        return lo, hi

    added = collections.Counter()
    # 1. the pages of the first scan that have text but were not placed (a page starting inside a heading, a word cut at the page end): by their first words
    for it, ident in enumerate(SCANS):
        leaves = P.item_leaves(ident); lab = P.fill_labels(leaves)
        if 'kind' in leaves[0]: lab = [(l['label'], l['kind'] if l['label'] else '') for l in leaves]
        for l, (lb, kd) in zip(leaves, lab):
            if not lb or not lb.isdigit() or (it + 1, int(lb)) in placed: continue
            w = re.findall(r'[^\W_]+', l['text'])
            if len(w) < 40: continue                                             # a plate, a title page or a blank leaf: nothing to match
            lo, hi = window(it + 1, int(lb)); t = place(ours, index_by_word, w, lo, hi)
            if t is not None: placed[(it + 1, int(lb))] = (t, ('~' if kd == 'i' else '') + '%d:%s' % (it + 1, lb)); added['first scan, by first words'] += 1
    # 2. the second scan, in volume 1, by the same matcher
    try: r1 = P.match_text(TID, [OTHER[0]])
    except Exception: r1 = None
    if r1:
        for (k, p), v in r1['marks'].items():
            for off, lab in v:
                m = re.fullmatch(r'(~?)(\d+)', lab)
                if not m or (1, int(m.group(2))) in placed: continue
                t = at.get((k, p, off)); lo, hi = window(1, int(m.group(2)))
                if t is not None and lo <= t < hi: placed[(1, int(m.group(2)))] = (t, m.group(1) + '1:' + m.group(2)); added['second scan, volume 1'] += 1
    # 3. volume 2 pages that the first scan's page data did not give: the second scan's own text, cut at its printed running heads
    for n, w in sorted(glasgow_pages(2, cache).items()):
        if (2, n) in placed or len(w) < 40: continue
        if n < min([nn for (vv, nn) in placed if vv == 2], default=0): continue
        lo, hi = window(2, n); t = place(ours, index_by_word, w, lo, hi)
        if t is not None: placed[(2, n)] = (t, '2:%d' % n); added['second scan, by running head'] += 1
    order = sorted(placed.items(), key=lambda x: x[1][0])                        # the order must hold: pages count upward through the text
    for (a, (ta, la)), (b, (tb, lb)) in zip(order, order[1:]):
        if not (a < b): raise RuntimeError('page order broken between %s and %s' % (la, lb))
    rows = collections.defaultdict(list)
    for (v, n), (t, lab) in placed.items():
        w, k, p, off = ours[t]; rows[(k, p)].append((off, lab))
    out = dict(res); out['marks'] = rows; n = sum(len(v) for v in rows.values())
    print('page marks: %d from the first scan, %d added (%s); grade %s, cover %.4f' % (n0, n - n0, ', '.join('%s %d' % kv for kv in added.items()) or 'none', P.grade_of(res), res['cover']))
    if write:
        P.TEXTS = str(texts)
        P.write_sidecar(TID, out, 2)
        idx = P.read_index(); idx[TID] = [n, meta.get('chars', 0), meta.get('n', 0), P.grade_of(res), 2]; P.write_index(idx)
    return out, ours, placed


def check():
    P = _tp(); meta, secs = P.load_text(TID)
    sc = (TEXTS / ('pg-%s.js' % TID)).read_text(encoding='utf-8'); rows = json.loads(sc[sc.index('{"h-museum":') + len('{"h-museum":'):sc.rindex('});')])
    labs = [l for _, _, m in rows for _, l in m]
    print('%d sections, %d characters; %d page marks (%d volume 1, %d volume 2)' % (len(secs), sum(len(b) for _, b in secs), len(labs), sum(1 for l in labs if l.lstrip('~').startswith('1:')), sum(1 for l in labs if l.lstrip('~').startswith('2:'))))
    print('pgs.js:', P.read_index().get(TID), '| the text says n=%d chars=%d' % (meta.get('n'), meta.get('chars')))
    bad = re.search(r'scan|ocr', meta.get('note', '') + ' ' + meta.get('license', ''), re.I)
    print('note and licence free of the words that mark a text as machine-read:', not bad)


if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else ''
    if cmd == 'build':
        import build_texts as B
        lib = B.load_lib(); B.write_all(build(lib, None, CACHE), lib, merge=True)
    elif cmd == 'marks': marks()
    elif cmd == 'check': check()
    else: print(__doc__)
