"""Helpers for turning Project Gutenberg plain text into reader sections."""
import re

PG_LICENSE = 'Public domain (text from Project Gutenberg)'


def pg_text(fetch, CACHE, n):
    raw = fetch('https://www.gutenberg.org/cache/epub/%d/pg%d.txt' % (n, n), CACHE / 'gutenberg' / ('%d.txt' % n)).decode('utf-8-sig', errors='replace').replace('\r\n', '\n').replace('\r', '\n')
    m = re.search(r'\*\*\* ?START OF (?:THE|THIS) PROJECT GUTENBERG EBOOK[^\n]*\n', raw); e = re.search(r'\*\*\* ?END OF (?:THE|THIS) PROJECT GUTENBERG EBOOK', raw)
    return raw[m.end(): e.start()] if m and e else raw


def unwrap(text):
    """Join hard-wrapped lines inside paragraphs; keep paragraph breaks."""
    out = []
    for p in re.split(r'\n[ \t]*\n', text.strip()):
        lines = [l.strip() for l in p.split('\n') if l.strip()]
        if lines: out.append(' '.join(lines))
    return '\n\n'.join(out)


def keep_lines(text):
    """For verse: keep line breaks, trim trailing space, collapse blank runs, indent lines that were indented."""
    lines = [l.rstrip() for l in text.strip().split('\n')]
    out = []; blank = 0
    for l in lines:
        if not l.strip(): blank += 1; out.append('') if blank == 1 else None; continue
        blank = 0; ind = len(l) - len(l.lstrip()); out.append(('  ' if ind >= 2 else '') + l.strip())
    return '\n'.join(out).strip()


def tidy(text, verse):
    # bounded, so a stray '<b' or '[Footnote' in OCR (with no closing mark) cannot swallow the rest of a book: an unbounded [^>]* once
    # deleted 60% of The Cloud of Unknowing, up to the next '>' tens of pages on
    text = re.sub(r'</?(?:a|b|i|em|strong|span|br|p|div|sup|sub|u|font|j)\b[^>]{0,300}>', '', text)
    text = re.sub(r'\[Illustration[^\]]{0,1000}\]', '', text); text = re.sub(r'\[(?:Footnote|Transcriber)[^\]]{0,20000}\]', '', text)
    return keep_lines(text) if verse else unwrap(text)


def split_headings(text, rx):
    """Split on heading lines matching rx → [[heading, body]] (text before the first heading becomes 'Introduction')."""
    pat = re.compile(rx, re.M); hits = list(pat.finditer(text)); secs = []
    if not hits: return [['Text', text]]
    if text[:hits[0].start()].strip() and len(text[:hits[0].start()].strip()) > 300: secs.append(['Introduction', text[:hits[0].start()]])
    for i, m in enumerate(hits):
        end = hits[i + 1].start() if i + 1 < len(hits) else len(text)
        hd = re.sub(r'\s+', ' ', m.group(0)).strip(); hd = ('Part ' + hd) if re.fullmatch(r'[IVXL]+', hd) else hd
        secs.append([hd, text[m.end():end]])
    return secs


AUTO_RX = [
    r'^(?:BOOK|BOOKS)\s+[IVXLC0-9]+\b.*$', r'^CHAPTER\s+[IVXLC0-9]+\b.*$', r'^(?:PART|SECTION|CANTO|RUNE|SURA|LETTER)\s+[IVXLC0-9]+\b.*$', r'^[IVXLC]+\.\s+[A-Z][^\n]{2,60}$',
    r'^(?:First|Second|Third|Fourth|Fifth|Sixth|Seventh|Eighth|Ninth|Tenth|Eleventh|Twelfth)\s+(?:Book|Day|Part|Chapter)\b.*$',
]


# word counts from the clean (typed, not scanned) texts, filled by build_texts.py before the scans are built; used to choose readable
# section previews and to fix OCR misreadings. Empty when a module is run on its own, and then every check that needs it is skipped.
VOCAB = {}

# a producer's or transcriber's credit at the head of an e-text, which is not part of the book
CREDIT = re.compile(r'^\s*(?:Produced by|This (?:e-?)?book was produced|E-?text (?:prepared|scanned) by|Transcribed (?:by|from)|Scanned (?:and proofed )?by)\b', re.I)


SHORT_WORDS = set('a i o ah am an as at ay be by do dr go ha he ho if in is it lo me mr my no of oh on or ox so st to up us we ye'.split())


def preview(c, n=7):
    """The first run of n ordinary words in a chunk, for its section title (OCR line numbers and stray marks skipped)."""
    toks = re.sub(r'\[\[\d+\]\]|[#_*]', '', c).split()
    def good(w):
        core = re.sub(r'^[“"‘\'(\[]+|[”"’\')\],.;:!?]+$', '', w)
        if not re.fullmatch(r"[A-Za-z][a-z’']*(?:-[a-z]+)?", core or '-'): return False
        if len(core) <= 2 and core.lower() not in SHORT_WORDS: return False      # 'li"]' is OCR debris, 'of' is a word
        return not VOCAB or core.lower() in VOCAB or (core[0].isupper() and len(core) > 2)
    run = 0
    for i, w in enumerate(toks):
        run = run + 1 if good(w) else 0
        if run == n: return ' '.join(toks[i - n + 1: i + 1])
    return ''


def chunk(text, size=26000, label='Part'):
    """Split long text at paragraph boundaries."""
    paras = re.split(r'\n\n', text); out = []; cur = []; n = 0
    for p in paras:
        if n + len(p) > size and cur: out.append('\n\n'.join(cur)); cur = []; n = 0
        cur.append(p); n += len(p) + 2
    if cur: out.append('\n\n'.join(cur))
    if len(out) > 1 and len(out[-1].strip()) < 200:                                   # no sliver of a last part
        last = out.pop(); out[-1] += '\n\n' + last                                      # (pop first: out[-2] += out.pop() would write one slot too far)
    return out


def finish(secs, verse, max_len=60000):
    res = []
    for h, body in secs:
        paras, pos = re.split(r'\n[ \t]*\n', body), 0; keep = []
        for p in paras:                                          # a credit only counts at the head of a text, not in an index deep inside
            if not (pos < 1500 and CREDIT.match(p) and len(p) < 700): keep.append(p)
            pos += len(p) + 2
        body = '\n\n'.join(keep)
        body = tidy(body, verse)
        if len(body) < 30: continue
        # table-of-contents lines split off as if they were a chapter ("Gefjun’s Plowing ........ 49"): one line ending in a page number,
        # or a short run of at least three lines where three in four do
        lines = [ln.strip() for ln in body.strip().split('\n') if ln.strip()]; paged = sum(1 for ln in lines if re.search(r'(?:\s|\.)\d{1,4}$', ln))
        if len(body) < 3000 and ((len(lines) == 1 and paged == 1) or (paged >= 3 and paged >= 0.75 * len(lines))): continue
        if len(body) > max_len:
            parts = chunk(body)
            for i, c in enumerate(parts):
                words = preview(c)
                res.append(['%s · part %d of %d' % (h, i + 1, len(parts)) if h != 'Text' else 'Part %d of %d' % (i + 1, len(parts)), c])
                if words: res[-1][0] += ' · ' + words + '…'
        else: res.append([h, body])
    return res


def gutenberg_entry(fetch, CACHE, spec):
    verse = spec.get('verse', False); texts = []
    for n in spec['pg']:
        t = pg_text(fetch, CACHE, n)
        if 'slice' in spec:
            a, b = spec['slice'][0], spec['slice'][1]; nth = spec['slice'][2] if len(spec['slice']) > 2 else 0
            ms = list(re.finditer(a, t, re.M)); ma = ms[nth] if len(ms) > nth else None
            if ma:
                mb = re.search(b, t[ma.end():], re.M) if b else None; t = t[ma.start(): ma.end() + mb.start()] if mb else t[ma.start():]
            else:
                print('  slice start not found:', spec['by'][:40], a)
        texts.append(t)
    secs = []
    for i, t in enumerate(texts):
        label = None
        rx = spec.get('split')
        parts = split_headings(t, rx) if rx else None
        if not parts or len(parts) < 3:
            parts = None
            for r in AUTO_RX:
                p = split_headings(t, r)
                if 4 <= len(p) <= 600: parts = p; break
        if not parts: parts = [['Text', t]]
        if len(spec['pg']) > 1:
            parts = [['%s · %s' % ('Volume %d' % (i + 1), h) if h not in ('Text',) else 'Volume %d' % (i + 1), b] for h, b in parts]
        secs += parts
    secs = finish(secs, verse)
    return dict(secs=secs, by=spec['by'], license=spec.get('license', PG_LICENSE), src='https://www.gutenberg.org/ebooks/%d' % spec['pg'][0], verse=verse, note=spec.get('note', ''))


def roman(s):
    v = {'I': 1, 'V': 5, 'X': 10, 'L': 50, 'C': 100}; n = 0
    for i, c in enumerate(s):
        n += -v[c] if i + 1 < len(s) and v[c] < v[s[i + 1]] else v[c]
    return n


def enoch_entries(fetch, CACHE):
    """1 Enoch (R. H. Charles, 1917) → the five parts the library lists, one section per chapter."""
    t = pg_text(fetch, CACHE, 77935)
    marks = [('p-1en-w', 'The Book of the Watchers (chapters 1–36)', r'THE BOOK OF ENOCH\s*\n\s*I-XXXVI\.'), ('p-1en-s', 'The Parables or Similitudes (chapters 37–71)', r'THE PARABLES\.'),
             ('p-1en-a', 'The Astronomical Book (chapters 72–82)', r'THE BOOK OF THE COURSES OF THE HEAVENLY LUMINARIES'), ('p-1en-d', 'The Dream Visions (chapters 83–90)', r'THE DREAM-VISIONS\.'),
             ('p-1en-e', 'The Epistle and concluding sections (chapters 91–108)', r'THE CONCLUDING SECTION OF THE BOOK')]
    pos = [re.search(m[2], t).start() for m in marks]; end = t.index('PRINTED IN GREAT BRITAIN'); pos.append(end); res = {}
    intro = t[t.index('EDITORS’ PREFACE'): pos[0]]
    for k, (lid, label, _) in enumerate(marks):
        body = t[pos[k]:pos[k + 1]]; seen = {}; starts = []
        for m in re.finditer(r'(?m)^[ \t]*([IVXLC]+)\.\s+(?:1\.|1-|_|\d+-\d+\.)', body):
            n = roman(m.group(1))
            if n not in seen: seen[n] = m.start(); starts.append((m.start(), n))
        secs = []
        if lid == 'p-1en-w': secs.append(['Editors’ preface and introduction (Charles, 1917)', intro])
        for q, (st, n) in enumerate(starts):
            c = body[st: starts[q + 1][0] if q + 1 < len(starts) else len(body)]
            c = re.sub(r'^[ \t]*[IVXLC]+\.[ \t]*', '', c, count=1).replace('_', '')
            secs.append(['Chapter %d' % n, c])
        secs = [[h, tidy(b, False)] for h, b in secs if len(b.strip()) > 20]
        res[lid] = dict(secs=secs, by='R. H. Charles, The Book of Enoch or 1 Enoch (SPCK, 1917)', license=PG_LICENSE, src='https://www.gutenberg.org/ebooks/77935', verse=False,
                        note=label + '. Brackets 〚 〛 and ⌜ ⌝ in Charles’s text mark his editorial judgements about interpolations and corrections.')
    return res
