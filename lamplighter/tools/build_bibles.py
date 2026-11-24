#!/usr/bin/env python3
"""Build the Bibles pack: many public-domain English Bibles, verse by verse, for the side-by-side reader.

Run:  python3 -I tools/build_bibles.py [--fetch-only] [--only kjv,asv]
Downloads (one USFM zip per version, from eBible.org) are cached in tools/cache/bibles/<id>/ (untrusted data: parsed only, never executed)
and the pack is written to ../../bibles/ next to Lamplighter.html:
  bibles/index.js          the versions (name, basis, licence, source) and the books each one holds, with chapter and verse counts
  bibles/<ver>-<code>.js   one book of one version: BEATLAB_BIBLES.add('kjv','GEN', chapters)
A chapter is a list of verses [number, text] (a verse printed as a bridge, "1-2", carries a third member, the last number it covers);
a Psalm title that is not numbered is verse 0. Footnotes, cross-references, study notes and headings are left out; the words are not changed.
Only versions whose eBible page states Public Domain are listed here.
"""
import io, json, os, re, sys, zipfile, pathlib, importlib.util

ROOT = pathlib.Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('build_texts', ROOT / 'build_texts.py'); BT = importlib.util.module_from_spec(spec); spec.loader.exec_module(BT)
CACHE = BT.CACHE / 'bibles'
OUT = ROOT.parent.parent / 'bibles'

# key, eBible id, name, short, basis, family (how its chapters and verses are numbered)
VERSIONS = [
    ('web', 'eng-web', 'World English Bible', 'WEB', 'A modern update of the 1901 American Standard Version, 2020 stable text', 'eng'),
    ('kjv', 'eng-kjv', 'King James Version with Apocrypha', 'KJV', '1611, the 1769 Oxford text', 'eng'),
    ('asv', 'eng-asv', 'American Standard Version', 'ASV', '1901, the American form of the Revised Version', 'eng'),
    ('rv', 'eng-rv', 'Revised Version with Apocrypha', 'RV', '1885 (Old Testament) and 1895 (Apocrypha)', 'eng'),
    ('bsb', 'engbsb', 'Berean Standard Bible', 'BSB', '2020, dedicated to the public domain in 2023', 'eng'),
    ('msb', 'engmsb', 'Majority Standard Bible', 'MSB', '2020s, from the Majority Text, dedicated to the public domain in 2023', 'eng'),
    ('oeb', 'engoebus', 'Open English Bible (US spelling)', 'OEB', 'A new modern English translation, released CC0', 'eng'),
    ('bbe', 'engBBE', 'Bible in Basic English', 'BBE', '1949 and 1964, using a vocabulary of about 1,000 words', 'eng'),
    ('dby', 'engDBY', 'Darby Translation', 'Darby', 'John Nelson Darby, 1890', 'eng'),
    ('ylt', 'engylt', "Young's Literal Translation", 'YLT', 'Robert Young, 1898', 'eng'),
    ('wbt', 'engwebster', 'Noah Webster Bible', 'Webster', 'Noah Webster, 1833, a revision of the King James Version', 'eng'),
    ('gnv', 'enggnv', 'Geneva Bible', 'Geneva', '1599, the Bible of Shakespeare and the Pilgrims', 'eng'),
    ('dra', 'engDRA', 'Douay-Rheims (Challoner)', 'DRA', 'Richard Challoner’s revision, 1899 edition, from the Latin Vulgate', 'vulg'),
    ('wyc', 'engWycliffe', 'Wycliffe Bible', 'Wycliffe', 'John Wycliffe and followers, about 1382 to 1395, from the Latin Vulgate', 'vulg'),
    ('tnt', 'engtnt', 'Tyndale New Testament', 'Tyndale', 'William Tyndale, 1526 and later', 'eng'),
    ('jps', 'engjps', 'JPS Tanakh 1917', 'JPS 1917', 'Jewish Publication Society, 1917 (Hebrew Bible only)', 'heb'),
    ('lee', 'englee', 'Isaac Leeser Tanakh', 'Leeser', 'Isaac Leeser, 1853 (Hebrew Bible only)', 'heb'),
]
SRC = 'https://ebible.org/details.php?id='
LICENSE = 'Public domain (stated on its eBible.org page); footnotes, cross-references and headings omitted'


def fetch_all(only=None):
    got = {}
    for key, eid, *_ in VERSIONS:
        if only and key not in only: continue
        # the WEB zip was already fetched for the Library, with a different name: reuse it rather than download it again
        if key == 'web' and (BT.CACHE / 'web' / 'eng-web_usfm.zip').exists(): got[key] = BT.CACHE / 'web' / 'eng-web_usfm.zip'; continue
        dest = CACHE / eid / f'{eid}_usfm.zip'; BT.fetch(f'https://ebible.org/Scriptures/{eid}_usfm.zip', dest); got[key] = dest
        print('have', key, eid, dest.stat().st_size, 'bytes')
    return got


def clean_inline(s):
    s = re.sub(r'\\f\s.*?\\f\*', '', s, flags=re.S); s = re.sub(r'\\fe\s.*?\\fe\*', '', s, flags=re.S); s = re.sub(r'\\x\s.*?\\x\*', '', s, flags=re.S)
    s = re.sub(r'\\\+?w\s+([^|\\]+?)(?:\|[^\\]*)?\\\+?w\*', r'\1', s)
    s = re.sub(r'\\\+?(?:add|nd|qt|wj|pn|k|ord|sc|tl|bk|dc|sig|em|bd|it|bdit|no|sup|ndx|png|rq|qs|qac|lit|ior|iqt|ca|va|cp|cl)\*?', '', s)
    s = re.sub(r'\\\+?[a-z0-9]+\*', '', s)
    s = re.sub(r'\\\+?[a-z]+[0-9]?\s', ' ', s)
    s = s.replace('|', ' ')
    return re.sub(r'\s+', ' ', s).strip()


SKIP = {'id', 'ide', 'sts', 'rem', 'h', 'toc1', 'toc2', 'toc3', 'mt', 'mt1', 'mt2', 'mt3', 'imt', 'imt1', 'is1', 'ip', 'ili', 'ie', 'mte', 'mte1', 'cd',
        's', 's1', 's2', 's3', 'ms', 'ms1', 'ms2', 'mr', 'r', 'sr', 'rq', 'sp', 'periph', 'cl', 'ca', 'cp', 'va', 'vp', 'restore', 'lit', 'ib', 'iot', 'io1', 'io2', 'imi', 'ipi', 'im', ' imq', 'imq', 'ili1', 'ili2'}
BREAK = {'p', 'm', 'pi', 'pi1', 'pi2', 'mi', 'nb', 'pc', 'pr', 'q', 'q1', 'q2', 'q3', 'q4', 'qr', 'qc', 'qa', 'qm', 'qm1', 'qm2', 'li', 'li1', 'li2', 'li3', 'lh', 'lf', 'lim', 'lim1', 'lim2', 'b', 'tr', 'th', 'tc', 'tcr', 'thr', 'qd'}


def parse_verses(text):
    """USFM → {chapter: [[verse, text, end?], ...]}. Headings, notes and references are dropped; a Psalm title (\\d) is verse 0."""
    chapters = {}; ch = None; cur = None; title_open = False

    def add(ch, num, end, txt):
        chapters.setdefault(ch, []).append([num, txt, end] if end and end > num else [num, txt])

    def push(piece):
        nonlocal cur
        piece = clean_inline(piece)
        if not piece: return
        if cur is None: return
        cur[2] = (cur[2] + ' ' + piece).strip()

    lines = text.split('\n'); i = 0
    for raw in lines:
        line = raw.rstrip()
        m = re.match(r'\\([a-z]+[0-9]?)\*?(?:\s+(.*))?$', line)
        if not m:
            if line.strip(): push(line)
            continue
        mk, rest = m.group(1), (m.group(2) or '')
        if mk == 'c':
            if cur is not None: add(cur[0], cur[1], cur[3], cur[2]); cur = None
            try: ch = int(rest.strip().split()[0])
            except Exception: ch = None
            continue
        if ch is None: continue
        if mk == 'v':
            if cur is not None: add(cur[0], cur[1], cur[3], cur[2]); cur = None
            vm = re.match(r'(\d+)[a-z]?(?:\s?[-\u2013]\s?(\d+))?[a-z]?\s*(.*)$', rest, re.S)
            if vm:
                cur = [ch, int(vm.group(1)), '', int(vm.group(2)) if vm.group(2) else 0]; push(vm.group(3))
            continue
        if mk == 'd':
            if cur is not None and cur[1] == 0: push(rest); continue                   # a title that runs over two lines
            if cur is not None or chapters.get(ch):                                    # after the verses began: an acrostic letter (Psalm 119) or a closing line (Habakkuk 3)
                if cur is not None and len(clean_inline(rest)) > 20: push(rest)
                continue
            cur = [ch, 0, '', 0]; push(rest); continue
        if mk in SKIP:
            # a heading ends the verse it follows; its words are not part of it
            continue
        if mk in BREAK or mk.startswith(('q', 'li', 'p', 'm')):
            if cur is not None and cur[1] == 0 and cur[2]: add(cur[0], cur[1], cur[3], cur[2]); cur = None
            if rest.strip(): push(rest)
            continue
        if rest.strip() and cur is not None: push(rest)
    if cur is not None: add(cur[0], cur[1], cur[3], cur[2])
    return {k: [v for v in vs if v[1]] for k, vs in chapters.items()}


def read_zip(path):
    z = zipfile.ZipFile(path); books = {}
    for n in z.namelist():
        m = re.match(r'(?:.*/)?\d+-([0-9A-Z]{3})[^/]*\.usfm$', n)
        if not m: continue
        code = m.group(1)
        if code in ('FRT', 'INT', 'BAK', 'OTH', 'XXA', 'XXB', 'XXC', 'XXD', 'XXE', 'XXF', 'XXG', 'GLO', 'CNC', 'TDX', 'NDX'): continue
        books[code] = z.read(n).decode('utf-8', 'replace')
    return books


BOOKS = [  # code, name, group (ot, nt, dc = the Apocrypha / deuterocanon)
    ('GEN', 'Genesis', 'ot'), ('EXO', 'Exodus', 'ot'), ('LEV', 'Leviticus', 'ot'), ('NUM', 'Numbers', 'ot'), ('DEU', 'Deuteronomy', 'ot'), ('JOS', 'Joshua', 'ot'), ('JDG', 'Judges', 'ot'), ('RUT', 'Ruth', 'ot'),
    ('1SA', '1 Samuel', 'ot'), ('2SA', '2 Samuel', 'ot'), ('1KI', '1 Kings', 'ot'), ('2KI', '2 Kings', 'ot'), ('1CH', '1 Chronicles', 'ot'), ('2CH', '2 Chronicles', 'ot'), ('EZR', 'Ezra', 'ot'), ('NEH', 'Nehemiah', 'ot'),
    ('EST', 'Esther', 'ot'), ('JOB', 'Job', 'ot'), ('PSA', 'Psalms', 'ot'), ('PRO', 'Proverbs', 'ot'), ('ECC', 'Ecclesiastes', 'ot'), ('SNG', 'Song of Solomon', 'ot'), ('ISA', 'Isaiah', 'ot'), ('JER', 'Jeremiah', 'ot'),
    ('LAM', 'Lamentations', 'ot'), ('EZK', 'Ezekiel', 'ot'), ('DAN', 'Daniel', 'ot'), ('HOS', 'Hosea', 'ot'), ('JOL', 'Joel', 'ot'), ('AMO', 'Amos', 'ot'), ('OBA', 'Obadiah', 'ot'), ('JON', 'Jonah', 'ot'), ('MIC', 'Micah', 'ot'),
    ('NAM', 'Nahum', 'ot'), ('HAB', 'Habakkuk', 'ot'), ('ZEP', 'Zephaniah', 'ot'), ('HAG', 'Haggai', 'ot'), ('ZEC', 'Zechariah', 'ot'), ('MAL', 'Malachi', 'ot'),
    ('MAT', 'Matthew', 'nt'), ('MRK', 'Mark', 'nt'), ('LUK', 'Luke', 'nt'), ('JHN', 'John', 'nt'), ('ACT', 'Acts', 'nt'), ('ROM', 'Romans', 'nt'), ('1CO', '1 Corinthians', 'nt'), ('2CO', '2 Corinthians', 'nt'),
    ('GAL', 'Galatians', 'nt'), ('EPH', 'Ephesians', 'nt'), ('PHP', 'Philippians', 'nt'), ('COL', 'Colossians', 'nt'), ('1TH', '1 Thessalonians', 'nt'), ('2TH', '2 Thessalonians', 'nt'), ('1TI', '1 Timothy', 'nt'),
    ('2TI', '2 Timothy', 'nt'), ('TIT', 'Titus', 'nt'), ('PHM', 'Philemon', 'nt'), ('HEB', 'Hebrews', 'nt'), ('JAS', 'James', 'nt'), ('1PE', '1 Peter', 'nt'), ('2PE', '2 Peter', 'nt'), ('1JN', '1 John', 'nt'),
    ('2JN', '2 John', 'nt'), ('3JN', '3 John', 'nt'), ('JUD', 'Jude', 'nt'), ('REV', 'Revelation', 'nt'),
    ('TOB', 'Tobit', 'dc'), ('JDT', 'Judith', 'dc'), ('ESG', 'Esther (Greek)', 'dc'), ('WIS', 'Wisdom of Solomon', 'dc'), ('SIR', 'Sirach (Ecclesiasticus)', 'dc'), ('BAR', 'Baruch', 'dc'), ('S3Y', 'Prayer of Azariah and the Song of the Three', 'dc'),
    ('SUS', 'Susanna', 'dc'), ('BEL', 'Bel and the Dragon', 'dc'), ('1MA', '1 Maccabees', 'dc'), ('2MA', '2 Maccabees', 'dc'), ('3MA', '3 Maccabees', 'dc'), ('4MA', '4 Maccabees', 'dc'), ('1ES', '1 Esdras', 'dc'), ('2ES', '2 Esdras', 'dc'),
    ('MAN', 'Prayer of Manasseh', 'dc'), ('PS2', 'Psalm 151', 'dc'),
]
BOOK_CODES = [b[0] for b in BOOKS]
REF_ORDER = ['kjv', 'web', 'rv', 'asv', 'dra']


def strip_marks(txt, key):
    if key in ('jps', 'lee'): txt = re.sub(r'\(\d{1,3}[-:]\d{1,3}\)\s*', '', txt)       # the Hebrew chapter-verse numbers printed in brackets
    while '[[' in txt or ']]' in txt: txt = txt.replace('[[', '[').replace(']]', ']')                                   # Leeser’s glosses of a name, in double brackets, which the Library reserves for verse numbers
    txt = txt.replace('\u00b6', ' ')                                                  # the paragraph mark (¶) some editions print
    return re.sub(r'\s+', ' ', txt).strip()


def vulg_psalms(vul, ref):
    """The Vulgate numbers the Psalms differently from the Hebrew (9 and 10 are one, 114 and 115 are one, 116 and 147 are split, and the rest from 10 to 146 are one lower), and counts a
    psalm's title as a verse. Re-key a Vulgate psalter (Douay-Rheims) to the Hebrew numbering the other Bibles use: returns (chapters, notes) or None if the verse totals do not add up."""
    groups = [([k], [k]) for k in range(1, 9)] + [([9, 10], [9])] + [([k], [k - 1]) for k in range(11, 114)] + [([114, 115], [113]), ([116], [114, 115])] + [([k], [k - 1]) for k in range(117, 147)] + [([147], [146, 147])] + [([k], [k]) for k in range(148, 151)]
    out = {}; notes = {}
    for heb, vc in groups:
        src = [(c, v) for c in vc for v in vul.get(c, []) if v[0] >= 1]
        counts = [len([v for v in ref.get(h, []) if v[0] >= 1]) for h in heb]
        titles = len(src) - sum(counts)
        if titles < 0 or titles > 3: return None
        pos = 0
        for hi, h in enumerate(heb):
            vs = []
            if hi == 0 and titles:
                t = src[:titles]; vs.append([0, ' '.join(x[1][1] for x in t), 0, f'{t[0][0]}:{t[0][1][0]}' + (f'–{t[-1][1][0]}' if len(t) > 1 else '')]); pos = titles
            for n in range(1, counts[hi] + 1):
                c, v = src[pos]; pos += 1; vs.append([n, v[1], 0, f'{c}:{v[0]}'])
            out[h] = vs
            lab = ' and '.join(str(c) for c in vc)
            notes[h] = f'The Douay-Rheims follows the Vulgate and prints this as Psalm {lab}; its verse numbers are shown in grey, and the verses are set here under the Hebrew numbering used by the other Bibles.' if (len(vc) > 1 or vc[0] != h or len(heb) > 1) else 'The Douay-Rheims counts the psalm’s title as a verse; its own verse numbers are shown in grey.' if titles else ''
    return out, {k: v for k, v in notes.items() if v}


def build(paths, only=None):
    parsed = {}
    for key, eid, name, short, basis, fam in VERSIONS:
        if only and key not in only and key not in REF_ORDER[:1]: continue
        raw = read_zip(paths[key]); books = {}
        for code, text in raw.items():
            if code not in BOOK_CODES: continue
            ch = parse_verses(text)
            ch = {c: [[v[0], strip_marks(v[1], key)] + (v[2:] if len(v) > 2 else []) for v in vs if strip_marks(v[1], key)] for c, vs in ch.items()}
            ch = {c: vs for c, vs in ch.items() if vs}
            if ch: books[code] = ch
        parsed[key] = books
    notes = {k: {} for k in parsed}
    # re-key a Vulgate psalter to the Hebrew numbering
    for key, eid, name, short, basis, fam in VERSIONS:
        if key in parsed and fam == 'vulg' and 'PSA' in parsed[key]:
            ref = parsed['kjv']['PSA'] if 'kjv' in parsed else parsed['web']['PSA']
            r = vulg_psalms(parsed[key]['PSA'], ref)
            if r: parsed[key]['PSA'] = r[0]; notes[key]['PSA'] = r[1]
            else: print('WARNING:', key, 'psalter did not fit the Vulgate scheme; left as printed')
    # a chapter whose verse numbers do not line up with the reference Bible is flagged
    diff = {k: {} for k in parsed}
    for key in parsed:
        for code, chs in parsed[key].items():
            refs = [parsed[r][code] for r in REF_ORDER if r in parsed and r != key and code in parsed[r]]
            if not refs: continue
            for c, vs in chs.items():
                keys = {v[0] for v in vs if v[0] >= 1}
                ref = next((r[c] for r in refs if c in r), None)
                if ref is None: diff[key].setdefault(code, []).append(c); continue
                rk = {v[0] for v in ref if v[0] >= 1}
                if (keys - rk) or (keys and rk and max(keys) < max(rk) - 2): diff[key].setdefault(code, []).append(c)
    return parsed, notes, diff


def write_pack(parsed, notes, diff, only=None):
    OUT.mkdir(parents=True, exist_ok=True)
    written = set()      # files are overwritten in place (not deleted first: a synced Desktop folder can restore a deleted file as a '… 2.js' copy), then any old file that is no longer part of the pack is removed
    meta = {}; nch = {}
    for key, eid, name, short, basis, fam in VERSIONS:
        if key not in parsed: continue
        books = parsed[key]; total = 0
        for code in BOOK_CODES:
            if code not in books: continue
            chs = {str(c): vs for c, vs in sorted(books[code].items())}
            total += sum(len(v) for v in chs.values())
            nch[code] = max(nch.get(code, 0), max(books[code]))
            extra = {}
            if code in notes.get(key, {}): extra['n'] = {str(c): t for c, t in notes[key][code].items()}
            if code in diff.get(key, {}): extra['d'] = sorted(set(diff[key][code]))
            written.add(f'{key}-{code.lower()}.js'); (OUT / f'{key}-{code.lower()}.js').write_text(f'BEATLAB_BIBLES.add({json.dumps(key)},{json.dumps(code)},{json.dumps(chs, ensure_ascii=False, separators=(",", ":"))},{json.dumps(extra, ensure_ascii=False, separators=(",", ":"))});\n', encoding='utf-8')
        meta[key] = dict(id=key, name=name, short=short, basis=basis, family=fam, license=LICENSE, src=SRC + eid, books=[c for c in BOOK_CODES if c in books], verses=total)
    index = dict(versions=[meta[k[0]] for k in VERSIONS if k[0] in meta], books=[[c, n, g, nch.get(c, 0)] for c, n, g in BOOKS if c in nch])
    written.add('index.js'); (OUT / 'index.js').write_text('BEATLAB_BIBLES.addIndex(' + json.dumps(index, ensure_ascii=False, separators=(',', ':')) + ');\n', encoding='utf-8')
    lic = ['The Lamplighter Project Bibles pack: sources and licences', '=' * 41, 'Each version is public domain as stated on its own eBible.org page (checked 15 November 2026); the words are not changed.', 'Footnotes, cross-references, headings and study notes are omitted, so these are the verses only. Get the complete editions from the source.', '']
    for k in VERSIONS:
        if k[0] in meta: m = meta[k[0]]; lic += [f"{m['short']:10} {m['name']}", f"           {m['basis']} · {len(m['books'])} books, {m['verses']:,} verses", f"           {m['license']}", f"           {m['src']}", '']
    (OUT / 'LICENSES.txt').write_text('\n'.join(lic), encoding='utf-8')
    if only is None:
        for f in OUT.glob('*.js'):
            if f.name not in written: f.unlink()
    return meta


if __name__ == '__main__':
    args = sys.argv[1:]
    only = set(args[args.index('--only') + 1].split(',')) if '--only' in args else None
    paths = fetch_all(only)
    if '--fetch-only' in args: sys.exit(0)
    parsed, notes, diff = build(paths, only)
    meta = write_pack(parsed, notes, diff, only)
    tot = sum(f.stat().st_size for f in OUT.glob('*.js'))
    for k, m in meta.items(): print(f"{k:4} {m['short']:9} {len(m['books']):3} books {m['verses']:6} verses; chapters flagged: {sum(len(v) for v in diff[k].values())}")
    print(f'wrote {len(list(OUT.glob("*.js")))} files, {tot/1e6:.1f} MB, to {OUT}')
