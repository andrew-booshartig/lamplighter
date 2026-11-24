#!/usr/bin/env python3
"""Build the Lamplighter text library: full copies of public-domain / openly licensed texts for the Library tab.

Run from anywhere:  python3 -I tools/build_texts.py [--only id1,id2] [--no-fetch]
Downloads are cached in tools/cache/<source>/ (untrusted data: parsed only, never executed) and written to ../../texts/<id>.js
(next to Lamplighter.html) plus texts/index.js and texts/LICENSES.txt. Only texts whose licence permits copying are included:
public domain (published before 1929 or otherwise PD), CC0 (SuttaCentral), or explicitly free (World English Bible).
Section format: a section is [heading, text]; text uses blank lines between paragraphs, '[[12]]' for verse numbers, '## ' for headings.
"""
import io, json, os, re, sys, time, zipfile, pathlib, urllib.request

ROOT = pathlib.Path(__file__).resolve().parent
CACHE = ROOT / 'cache'
OUT = ROOT.parent.parent / 'texts'
UA = 'text-fetch/1.0'
_last = [0.0]


def fetch(url, dest, delay=1.2):
    """Polite cached download. Returns bytes."""
    dest = pathlib.Path(dest); dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists() and dest.stat().st_size > 0: return dest.read_bytes()
    wait = delay - (time.time() - _last[0])
    if wait > 0: time.sleep(wait)
    req = urllib.request.Request(url, headers={'User-Agent': UA})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=60) as r: data = r.read()
            break
        except Exception as e:
            if attempt == 2: raise
            time.sleep(3 * (attempt + 1))
    _last[0] = time.time(); dest.write_bytes(data); return data


# ───────────────────────── World English Bible (USFM) ─────────────────────────
WEB_URL = 'https://ebible.org/Scriptures/eng-web_usfm.zip'
WEB_BOOKS = {  # USFM code → library id
    'GEN': 'b-gen', 'EXO': 'b-exo', 'LEV': 'b-lev', 'NUM': 'b-num', 'DEU': 'b-deu', 'JOS': 'b-jos', 'JDG': 'b-jdg', 'RUT': 'b-rut', '1SA': 'b-1sa', '2SA': 'b-2sa', '1KI': 'b-1ki', '2KI': 'b-2ki',
    '1CH': 'b-1ch', '2CH': 'b-2ch', 'EZR': 'b-ezr', 'NEH': 'b-neh', 'EST': 'b-est', 'JOB': 'b-job', 'PSA': 'b-psa', 'PRO': 'b-pro', 'ECC': 'b-ecc', 'SNG': 'b-sos', 'ISA': 'b-isa', 'JER': 'b-jer',
    'LAM': 'b-lam', 'EZK': 'b-eze', 'DAN': 'b-dan', 'HOS': 'b-hos', 'JOL': 'b-joe', 'AMO': 'b-amo', 'OBA': 'b-oba', 'JON': 'b-jon', 'MIC': 'b-mic', 'NAM': 'b-nah', 'HAB': 'b-hab', 'ZEP': 'b-zep',
    'HAG': 'b-hag', 'ZEC': 'b-zec', 'MAL': 'b-mal',
    'MAT': 'n-mat', 'MRK': 'n-mar', 'LUK': 'n-luk', 'JHN': 'n-joh', 'ACT': 'n-act', 'ROM': 'n-rom', '1CO': 'n-1co', '2CO': 'n-2co', 'GAL': 'n-gal', 'EPH': 'n-eph', 'PHP': 'n-php', 'COL': 'n-col',
    '1TH': 'n-1th', '2TH': 'n-2th', '1TI': 'n-1ti', '2TI': 'n-2ti', 'TIT': 'n-tit', 'PHM': 'n-phm', 'HEB': 'n-heb', 'JAS': 'n-jas', '1PE': 'n-1pe', '2PE': 'n-2pe', '1JN': 'n-1jo', '2JN': 'n-2jo',
    '3JN': 'n-3jo', 'JUD': 'n-jud', 'REV': 'n-rev',
    'TOB': 'd-tob', 'JDT': 'd-jdt', 'ESG': 'd-aes', 'WIS': 'd-wis', 'SIR': 'd-sir', '1MA': 'd-1ma', '2MA': 'd-2ma',
    '1ES': 'o-1es', 'MAN': 'o-pma', 'PS2': 'o-ps151', '3MA': 'o-3ma', '2ES': 'o-2es', '4MA': 'o-4ma',
}
WEB_LICENSE = 'Public domain (World English Bible, eBible.org; footnotes and study notes omitted)'
WEB_SRC = 'https://ebible.org/web/'


def usfm_clean(s):
    s = re.sub(r'\\f\s.*?\\f\*', '', s); s = re.sub(r'\\x\s.*?\\x\*', '', s)
    s = re.sub(r'\\\+?w\s+([^|\\]+?)(?:\|[^\\]*)?\\\+?w\*', r'\1', s)
    s = re.sub(r'\\\+?[a-z0-9]+\*?', '', s)       # remaining inline markers (\wj, \add, \nd, \qs …)
    return re.sub(r'[ \t]+', ' ', s).strip()


def parse_usfm(text, chapter_label='Chapter'):
    """→ list of [heading, text] per chapter."""
    secs = []; out = []; cur = None; state = {'new': True, 'para': False, 'indent': ''}

    def flush():
        nonlocal out, cur
        if cur is not None:
            while out and out[-1] == '': out.pop()
            secs.append([cur, '\n'.join(out)])
        out = []

    def emit(txt, verse=None):
        if not txt and verse is None: return
        piece = (('[[%s]] ' % verse) if verse else '') + txt
        if state['para'] and out and out[-1] != '': out.append('')
        if state['new'] or not out:
            out.append(state['indent'] + piece.strip())
        else:
            out[-1] = out[-1].rstrip() + ' ' + piece.strip()
        state['new'] = False; state['para'] = False

    for raw in text.split('\n'):
        line = raw.rstrip()
        m = re.match(r'\\([a-z0-9+]+)\*?\s?(.*)$', line)
        if not m:
            if line.strip() and cur is not None: emit(usfm_clean(line))
            continue
        mk, rest = m.group(1), m.group(2)
        if mk == 'c':
            flush(); cur = '%s %s' % (chapter_label, rest.strip().split()[0]); state.update(new=True, para=False, indent=''); continue
        if cur is None: continue
        if mk in ('p', 'm', 'pi1', 'pi2', 'mi', 'nb', 'pc', 'pr', 'li1', 'li2', 'li', 'ip'):
            state.update(new=True, para=True, indent='  ' if mk.startswith('li') or mk == 'pi1' else '')
            if rest.strip(): emit(usfm_clean(rest))
        elif mk in ('q1', 'q2', 'q3', 'q'):
            lvl = {'q': 1, 'q1': 1, 'q2': 2, 'q3': 3}[mk]; state.update(new=True, indent='  ' * (lvl - 1))
            if rest.strip(): emit(usfm_clean(rest))
        elif mk == 'b': state.update(new=True, para=True, indent='')
        elif mk == 'v':
            vm = re.match(r'(\d+)[-\u2013]?\d*\s?(.*)$', rest)
            if vm: emit(usfm_clean(vm.group(2)), verse=vm.group(1))
        elif mk in ('s1', 's2', 'ms1', 'ms', 'd', 'cl', 'sp', 'is1', 'ili'):
            t = usfm_clean(rest)
            if t and mk in ('s1', 's2', 'ms1', 'ms'):
                if out and out[-1] != '': out.append('')
                out.append('## ' + t); out.append(''); state.update(new=True, para=False, indent='')
            elif t and mk == 'd':
                if out and out[-1] != '': out.append('')
                out.append('(' + t + ')'); state.update(new=True, para=False, indent='')
        # headers (\id \h \toc \mt) are ignored
    flush()
    return secs


def slice_verses(sec_text, a, b):
    """Return the part of a chapter text from verse a up to (not including) verse b."""
    i = sec_text.find('[[%d]]' % a); j = sec_text.find('[[%d]]' % b) if b else -1
    return sec_text[i: j if j > 0 else None].strip() if i >= 0 else ''


def web_entries(lib):
    zpath = CACHE / 'web' / 'eng-web_usfm.zip'; fetch(WEB_URL, zpath)
    z = zipfile.ZipFile(zpath); files = {re.match(r'\d+-([0-9A-Z]{3})eng-web\.usfm', n).group(1): n for n in z.namelist() if re.match(r'\d+-[0-9A-Z]{3}eng-web\.usfm', n)}
    res = {}
    for code, lid in WEB_BOOKS.items():
        if code not in files: continue
        label = 'Psalm' if code == 'PSA' else 'Chapter'
        res[lid] = dict(secs=parse_usfm(z.read(files[code]).decode('utf-8'), label), by='World English Bible (2020 stable text)', license=WEB_LICENSE, src=WEB_SRC)
    # Greek Daniel supplies three Daniel additions; Baruch carries the Letter of Jeremiah as chapter 6
    if 'DAG' in files:
        dag = parse_usfm(z.read(files['DAG']).decode('utf-8'))
        byname = {h: t for h, t in dag}
        res['d-pat'] = dict(secs=[['The Prayer of Azariah and the Song of the Three Young Men (Daniel 3:24–90, Greek)', slice_verses(byname['Chapter 3'], 24, 91)]], by='World English Bible (2020 stable text)', license=WEB_LICENSE, src=WEB_SRC, note='Taken from the Greek portions of Daniel in the World English Bible.')
        res['d-sus'] = dict(secs=[['Susanna (Daniel 13, Greek)', byname['Chapter 13']]], by='World English Bible (2020 stable text)', license=WEB_LICENSE, src=WEB_SRC)
        res['d-bel'] = dict(secs=[['Bel and the Dragon (Daniel 14, Greek)', byname['Chapter 14']]], by='World English Bible (2020 stable text)', license=WEB_LICENSE, src=WEB_SRC)
    if 'BAR' in files:
        bar = parse_usfm(z.read(files['BAR']).decode('utf-8'))
        res['d-bar'] = dict(secs=[s for s in bar if s[0] != 'Chapter 6'], by='World English Bible (2020 stable text)', license=WEB_LICENSE, src=WEB_SRC)
        res['d-lje'] = dict(secs=[['The Letter of Jeremiah (Baruch 6)', [s for s in bar if s[0] == 'Chapter 6'][0][1]]], by='World English Bible (2020 stable text)', license=WEB_LICENSE, src=WEB_SRC)
    if '2ES' in files:
        es = parse_usfm(z.read(files['2ES']).decode('utf-8'))
        keep = [s for s in es if s[0].split()[-1].isdigit() and 3 <= int(s[0].split()[-1]) <= 14]
        res['p-4ez'] = dict(secs=keep, by='World English Bible (2020 stable text)', license=WEB_LICENSE, src=WEB_SRC, note='2 Esdras chapters 3–14, the Jewish apocalypse known as 4 Ezra (chapters 1–2 and 15–16 are later Christian additions).')
    if 'd-aes' in res:
        res['d-aes']['note'] = 'This is Greek Esther, the full text of the book including the Additions to Esther.'
    return res


def lxx_entries(lib):
    """The Septuagint in Brenton's English translation (1851), from eBible.org's USFM: every book, a section per chapter."""
    if 'p-lxx' not in lib: return {}
    z = zipfile.ZipFile(io.BytesIO(fetch('https://ebible.org/Scriptures/eng-Brenton_usfm.zip', CACHE / 'web' / 'brenton.zip')))
    secs = []
    for n in sorted(z.namelist()):
        m = re.match(r'\d+-([0-9A-Z]{3})eng-Brenton\.usfm$', n)
        if not m or m.group(1) in ('FRT', 'INT', 'XXA', 'OTH', 'BAK'): continue
        raw = z.read(n).decode('utf-8'); h = re.search(r'\\h\s+(.+)', raw); book = (h.group(1).strip() if h else m.group(1)).title().replace(' Of ', ' of ')
        secs += parse_usfm(raw, 'Psalm' if m.group(1) == 'PSA' else book)
    secs = [x for x in secs if len(re.sub(r'\[\[\d+\]\]', '', x[1]).strip()) > 20]  # a few chapters are only a verse marker (Brenton places them elsewhere)
    return {'p-lxx': dict(secs=secs, by='Sir Lancelot C. L. Brenton, The Septuagint with Apocrypha: Greek and English (1851)', license='Public domain (Brenton’s translation, from eBible.org; footnotes omitted)', src='https://ebible.org/eng-Brenton/',
                          note='The Greek Old Testament that most New Testament writers quoted, in English, with the books it includes beyond the Hebrew Bible. Chapter and verse numbers sometimes differ from Bibles translated from the Hebrew, notably in the Psalms and Jeremiah.')}


# ───────────────────────── writing ─────────────────────────
def existing_index():
    """The index already in texts/ (so a --only rebuild keeps every other text listed)."""
    p = OUT / 'index.js'
    if not p.exists(): return {}
    m = re.search(r'addIndex\((.*)\);\s*$', p.read_text(encoding='utf-8'), re.S)
    return json.loads(m.group(1)) if m else {}


def write_all(entries, lib, merge=False):
    OUT.mkdir(parents=True, exist_ok=True); index = existing_index() if merge else {}; lic = []
    for lid, e in sorted(entries.items()):
        secs = [[h.strip(), t.strip()] for h, t in e['secs'] if t.strip()]
        if not secs: print('  (empty)', lid); continue
        meta = dict(title=lib.get(lid, {}).get('title', lid), by=e['by'], license=e['license'], src=e['src'], verse=bool(e.get('verse', False)), note=e.get('note', ''), n=len(secs), chars=sum(len(t) for _, t in secs))
        (OUT / ('%s.js' % lid)).write_text('BEATLAB_TEXTS.add(%s,%s,%s);\n' % (json.dumps(lid), json.dumps(meta, ensure_ascii=False), json.dumps(secs, ensure_ascii=False, separators=(',', ':'))), encoding='utf-8')
        index[lid] = meta
    index = dict(sorted(index.items()))
    lic = ['%-10s %s\n           %s · %s\n' % (lid, m['title'], m['by'], m['license']) + ('           %s\n' % m['src'] if m['src'] else '') for lid, m in index.items()]      # no address line for a text with no src
    (OUT / 'index.js').write_text('BEATLAB_TEXTS.addIndex(%s);\n' % json.dumps(index, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    (OUT / 'LICENSES.txt').write_text('The Lamplighter Project text library: sources and licences\n' + '=' * 44 + '\nEvery text here is public domain or openly licensed, except that the Universal Declaration of Human Rights (f-udh) is a United Nations document and keeps the UN’s own terms of use, and that the transcription of Madison’s Memorial and Remonstrance (f-mem) comes from The Founders’ Constitution (University of Chicago Press), whose page is marked © 1987 University of Chicago (Madison’s own words, of 1785, are public domain). Translations are named so you can find the original edition.\n\n' + '\n'.join(lic), encoding='utf-8')
    (OUT / 'README.txt').write_text('This folder holds the full texts used by the Library in Lamplighter.html. Keep it next to Lamplighter.html (the same folder).\n\nEach .js file is one text (named after its Library entry); index.js lists them all; LICENSES.txt names every translator, edition and licence.\nEverything here is public domain or openly licensed (CC0), except the Universal Declaration of Human Rights (f-udh), a United Nations document with the UN’s own terms of use, and the transcription of Madison’s Memorial and Remonstrance (f-mem), from a University of Chicago Press site whose page is marked © 1987 (Madison’s own words are public domain). To rebuild or extend it, run: python3 -I lamplighter/tools/build_texts.py\n', encoding='utf-8')
    tot = sum(m['chars'] for m in index.values()); print('wrote %d texts, %.1f MB of text' % (len(index), tot / 1e6)); return index


def load_lib():
    """Library entries (id → {title}) read from the app's own data file so titles stay in sync."""
    src = (ROOT.parent / 'src/js/24-data-path-lib.js').read_text(encoding='utf-8'); lib = {}
    for m in re.finditer(r"'([a-z]-[a-z0-9-]+)\|([^|]+)\|([a-z]+)\|", src): lib[m.group(1)] = dict(title=m.group(2).replace("\\'", "'"), group=m.group(3))
    return lib


if __name__ == '__main__':
    only = None; args = sys.argv[1:]
    for i, a in enumerate(args):
        if a.startswith('--only='): only = set(a.split('=', 1)[1].split(','))
        elif a == '--only' and i + 1 < len(args): only = set(args[i + 1].split(','))
    lib = load_lib(); entries = {}
    entries.update(web_entries(lib))
    try: entries.update(lxx_entries(lib))
    except Exception as ex: print('  FAILED lxx:', ex)
    try:
        sys.path.insert(0, str(ROOT)); import texts_manifest
        entries.update(texts_manifest.build(lib, fetch, CACHE))
    except ImportError:
        pass
    try:
        import texts_sutta
        entries.update(texts_sutta.build(lib, CACHE))
    except ImportError:
        pass
    except Exception as ex:
        print('  FAILED texts_sutta:', ex)
    try:
        import texts_archive, build_texts_util
        # the vocabulary of the typed texts built so far, for the scan clean-up (OCR misreadings, words split at page breaks)
        vocab = {}
        for e in entries.values():
            for _, t in e['secs']:
                for w in re.findall(r'[A-Za-z]+', t): w = w.lower(); vocab[w] = vocab.get(w, 0) + 1
        build_texts_util.VOCAB.update(vocab)
        entries.update(texts_archive.build(lib, fetch, CACHE))
    except ImportError:
        pass
    except Exception as ex:
        print('  FAILED texts_archive:', ex)
    try:
        import texts_freedom
        entries.update(texts_freedom.build(lib, fetch, CACHE))
    except ImportError:
        pass
    except Exception as ex:
        print('  FAILED texts_freedom:', ex)
    try:
        import texts_gg
        entries.update(texts_gg.build(lib, fetch, CACHE))
    except ImportError:
        pass
    except Exception as ex:
        print('  FAILED texts_gg:', ex)
    try:
        import texts_hmuseum      # the Hermetic Museum: a typed copy, cut into its tracts; it replaces the scan text of h-museum built above (its printed pages: python3 -I tools/texts_hmuseum.py marks)
        entries.update(texts_hmuseum.build(lib, fetch, CACHE))
    except ImportError:
        pass
    except Exception as ex:
        print('  FAILED texts_hmuseum:', ex)
    try:
        import texts_round25c      # one short text (the Winchester Profession) from a typed page of Schaff's Creeds of Christendom; the rest of round 25c is in texts_archive's SPECS
        entries.update(texts_round25c.build(lib, fetch, CACHE))
    except ImportError:
        pass
    except Exception as ex:
        print('  FAILED texts_round25c:', ex)
    try:
        import texts_imagined
        entries.update(texts_imagined.build(lib, fetch, CACHE))
    except ImportError:
        pass
    except Exception as ex:
        print('  FAILED texts_imagined:', ex)
    # Project Gutenberg's own footer line, and the file note that points to its other files, are not part of any text
    PG_NOISE = re.compile(r"^End of (?:the )?Project Gutenberg|other Project Gutenberg files")
    for e in entries.values():
        if any('Project Gutenberg' in t for _, t in e['secs']):
            e['secs'] = [[h, '\n\n'.join(q for q in re.split(r'\n[ \t]*\n', t) if not PG_NOISE.search(q.strip()))] for h, t in e['secs']]
    if only: entries = {k: v for k, v in entries.items() if k in only}
    write_all(entries, lib, merge=bool(only))
