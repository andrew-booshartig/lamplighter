#!/usr/bin/env python3
"""Build dictionary/ (next to texts/) from Webster's Unabridged Dictionary, the 1913 edition, as Project Gutenberg eBook #29765.

The maker approved fetching it on 16 November 2026: https://www.gutenberg.org/cache/epub/29765/pg29765.txt, 28,956,350 bytes, kept untouched in tools/cache/webster1913/ (that folder holds
nothing else, and nothing in it is ever run). This tool reads it and writes a compact, searchable copy:

    dictionary/index.js        the chunk list (where each run of headwords lives), the licence line and the source
    dictionary/w01.js ...      each a script that calls BEATLAB_DICT.add(id, rows), so the app loads one chunk at a time from file:// with no network, as it does the texts

What is kept of each entry: the headword and its other forms, the syllables, the part of speech, the numbered senses (the definition itself, with its subject label such as (Bot.) and its usage label
such as [Obs.]), and the first list of synonyms. What is left out, to keep it small and plain: the etymologies (the Gutenberg text lost the Greek and most of the Old English letters, so many are cut
off or wrong), the quotations that follow a sense (with the authors' names), long usage notes ("Note:"), the long discussions under "Syn.", and the pronunciation marks, which the Gutenberg text keeps
only as accents. Derived forms printed under an entry (-- Fiendfully, adv.) become pointers to it, so they can be found too, and so do the variant spellings of a headword. A form of another word
("imp. & p. p. of Begin") is written out in words ("Past tense and past participle of Begin."). A sense that speaks of peoples or faiths in the hostile words of 1913 is flagged (c), so that the app can say
so beside it.

Run:  python3 -I tools/build_dictionary.py [--stats] [--words w1,w2,…] [--out folder]
      --stats  print what was found (entries, parts of speech, sizes, what was cut) and write nothing
      --words  print the parsed entries for those headwords and write nothing (to check the parser by eye)
"""
import argparse, collections, hashlib, json, pathlib, re, sys, unicodedata

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent.parent                       # the project folder: Lamplighter/
SRC = HERE / 'cache' / 'webster1913' / 'pg29765.txt'
SRC_SIZE = 28956350                             # the size the maker approved
CHUNK_BYTES = 1_100_000                         # about this much text in a chunk file (a few thousand entries): one lookup loads one chunk
LICENCE = ('Public domain: Webster’s Revised Unabridged Dictionary (1913), from Project Gutenberg eBook #29765 (transcription credited to Graham Lawrence). '
           'Compiled for the Lamplighter Project by tools/build_dictionary.py, which keeps the headwords, parts of speech and definitions and leaves out the etymologies and the quotations.')

HW = re.compile(r"^[A-Z0-9][A-Z0-9 ;'’\-\.&,!?éèçäöüëïôâêîûñœæ]*$")
POS_WORD = r"(?:n|a|v|adv|prep|conj|interj|pron|pl|sing|p|imp|pref|suff|vb|obj|pr|fem|masc|abbrev|art)"
POS_RE = re.compile(r"(?:(?<=\s)|(?<=,)|^)((?:" + POS_WORD + r")\.(?:\s*(?:t|i|pl|sing|p|pr|pron|obj|a|n)\.)*(?:\s*(?:&|and|or)\s*(?:" + POS_WORD + r")\.(?:\s*(?:t|i|pl|sing|p|pr)\.)*)*)")
POS_NAMES = {'n': 'noun', 'a': 'adjective', 'v. t': 'transitive verb', 'v. i': 'intransitive verb', 'v': 'verb', 'adv': 'adverb', 'prep': 'preposition', 'conj': 'conjunction',
             'interj': 'interjection', 'pron': 'pronoun', 'pl': 'plural', 'p. p': 'past participle', 'imp': 'past tense', 'pref': 'prefix', 'suff': 'suffix', 'sing': 'singular', 'art': 'article'}
LABEL = re.compile(r"\[(Obs|R|Archaic|Colloq|Low|Poetic|Prov\. Eng|Scot|Eng|U\. S|Slang|Law|Obsolescent|Vulgar|Rare)\.?\]")
# words that say a sense is written in the hostile or out-of-date language of its time about a people or a faith (the maker's rule: understood, not endorsed)
CARE = re.compile(r"\b(heathen\w*|infidel\w*|idolat\w*|pagan\w*|heretic\w*|false prophet|barbarous|barbarian\w*|savage\w*|uncivili[sz]ed|blasphem\w*|unbeliev\w*|gentile\w*|sectar\w*|mohammedan\w*|mahometan\w*|mahomedan\w*|hindoo\w*|hottentot\w*|negro\w*|gypsy|gipsy|jewess|cannibal\w*|papist\w*|popish|fetich\w*|fetish\w*)\b", re.I)
CARE_HEADS = set('''mohammedan mahometan mahomedan mohammedanism mahometanism mahomedanism hindoo hindoos heathen heathenism pagan paganism gentile infidel infidelity idolater idolatry idolatrous heretic heresy
schismatic sectary papist popish jew jewess gypsy gipsy negro hottentot savage barbarian cannibal fetich fetish fetishism voodoo mormon jesuit jesuitical pharisee pharisaical guebre gheber gebir
gabar fire worshiper nigger kaffir caffre squaw redskin chinaman mongol coolie pariah brahmin brahman brahmanism'''.split())


def norm_key(s):
    """The key a word is looked up by: lower case, no accents, æ as ae, œ as oe, anything but letters and digits as one space. app code (2z-dict-core.js dkNorm) does exactly the same."""
    s = s.replace('Æ', 'ae').replace('æ', 'ae').replace('Œ', 'oe').replace('œ', 'oe').replace('ß', 'ss')
    s = unicodedata.normalize('NFKD', s)
    s = ''.join(c for c in s if not unicodedata.combining(c)).lower()
    return re.sub(r'[^a-z0-9]+', ' ', s).strip()


def read_body(path):
    raw = path.read_bytes()
    if len(raw) != SRC_SIZE:
        print(f'warning: {path} is {len(raw):,} bytes, not the {SRC_SIZE:,} that were approved', file=sys.stderr)
    text = raw.decode('utf-8').replace('\r\n', '\n').replace('\r', '\n')
    a = text.index('*** START OF'); b = text.index('*** END OF')
    return text[text.index('\n', a) + 1:b], hashlib.sha256(raw).hexdigest()


def letters(s):
    return norm_key(re.sub(r'[`"*]', '', s)).replace(' ', '')


def split_entries(body):
    """(headword line, the lines of its entry) for every entry. A headword line is capitals alone on a line after a blank line and before a head line that begins with the same letters."""
    lines = body.split('\n'); starts = []
    for i, ln in enumerate(lines):
        if not HW.match(ln) or len(ln) > 90 or (i and lines[i - 1] != '') or i + 1 >= len(lines) or not lines[i + 1].strip():
            continue
        if not re.search(r'[A-Z]', ln) or ln[0].isdigit() or re.fullmatch(r'[IVXLCDM]+\.?', ln.strip()):
            continue
        first = letters(re.split(r'[;,]', ln)[0]); head = letters(lines[i + 1])
        if first and head and (head.startswith(first[:3]) or first.startswith(head[:3])):
            starts.append(i)
    out = []
    for k, i in enumerate(starts):
        j = starts[k + 1] if k + 1 < len(starts) else len(lines)
        out.append((lines[i], lines[i + 1:j]))
    return out


def etym_of(text):
    """The first Etym: [ … ] with its brackets balanced, or '' (the Gutenberg text lost the Greek, so some are cut off)."""
    m = re.search(r'Etym:\s*\[', text)
    if not m:
        return '', text
    depth = 0
    for k in range(m.end() - 1, len(text)):
        depth += (text[k] == '[') - (text[k] == ']')
        if depth == 0:
            e = text[m.end():k].strip()
            return e, text[:m.start()] + text[k + 1:]
    return '', text[:m.start()]


def clean(s):
    s = re.sub(r'\s+', ' ', s).strip()
    s = s.replace(' -- ', ' — ').replace('--', '—').replace('`', '').replace(' ,', ',')
    return s


SKIP_FORM = {'Obs', 'Compar', 'Superl', 'Imp', 'Pl', 'Sing', 'Archaic', 'Colloq', 'Poetic', 'Prov', 'Eng', 'Scot', 'Written', 'Also', 'See', 'Cf', 'Prop', 'Rare', 'Etym'}


def head_of(headline, block):
    """(display forms, syllables, part of speech) from the head line of an entry, the first lines up to a blank line."""
    text = ' '.join(l.strip() for l in block)
    et, text = etym_of(text)
    text = text.replace('{', ' ').replace('}', ' ')
    brackets = re.findall(r'\[([^\]]*)\]?', text)
    text = re.sub(r'\[[^\]]*\]?', ' ', text)                     # [Compar. Tardier; superl. Tardiest.] and the like
    m = POS_RE.search(text)
    if m:
        forms_text = text[:m.start()]; pos = m.group(1).strip(); tail = text[m.end():]
    else:
        forms_text = re.split(r'\(|\s\.\s|\.\s', text)[0]; pos = ''; tail = text[len(forms_text):]
    forms = [re.sub(r'[`"*]', '', f).strip(' ,.;') for f in forms_text.split(',')]
    forms = [f for f in forms if f and len(f) <= 60]
    first_syl = re.sub(r'[*"`]+', '·', forms_text.split(',')[0]).strip(' ,.;·') if forms_text.strip() else ''
    first_syl = re.sub(r'\s*\([^)]*\)?', '', first_syl).strip(' ·')
    first_syl = re.sub(r'·?-·?', '-', first_syl).replace('· ', ' ').replace(' ·', ' ')
    if first_syl and '·' not in first_syl:
        first_syl = ''
    infl = []
    for b in brackets:                                                                # the forms the head line lists: [imp. Begot (Begat, Obs.); p. p. Begotten; p. pr. & vb. n. Begetting.]
        if re.match(r'\s*(?:imp|p\. ?p|pret|pl|n\. ?pl|compar|superl)\b', b, re.I):
            infl += [w for w in re.findall(r"[A-Z][a-z’'\-]+", b) if w not in SKIP_FORM]
    lm = re.search(r'\(([A-Z][A-Za-zëöäü\.&, ]{1,38})\)', tail)                 # a subject label on the head line itself: "Dil"do, n. (Bot.)"
    return forms, first_syl, pos, et, ('(' + lm.group(1).strip() + ')' if lm else ''), infl


POS_TOKENS = [('n. sing', 'singular noun'), ('n.sing', 'singular noun'), ('n. pl', 'plural noun'), ('n.pl', 'plural noun'), ('p. pr', 'present participle'), ('p. p', 'past participle'), ('p.p', 'past participle'),
              ('p. a', 'participial adjective'), ('vb. n', 'verbal noun'), ('v. t', 'transitive verb'), ('v.t', 'transitive verb'), ('n. t', 'transitive verb'), ('v. i', 'intransitive verb'), ('v.i', 'intransitive verb'),
              ('n. i', 'intransitive verb'), ('imp', 'past tense'), ('pret', 'past tense'), ('obj', 'objective case'), ('pres', 'present'), ('adv', 'adverb'), ('prep', 'preposition'), ('conj', 'conjunction'), ('interj', 'interjection'), ('pron', 'pronoun'), ('pref', 'prefix'), ('suff', 'suffix'),
              ('sing', 'singular'), ('pl', 'plural'), ('vb', 'verbal noun'), ('art', 'article'), ('n', 'noun'), ('a', 'adjective'), ('v', 'verb'), ('p', 'participle')]


def pos_name(pos):
    """'v. t. & i.' -> 'transitive verb and intransitive verb': the abbreviations of 1913, in words."""
    p = pos.replace('&', ' and ').replace(' or ', ' and ')
    parts = [x.strip() for x in re.split(r'\s+and\s+', p) if x.strip()]
    names = []
    for part in parts:
        key = part.rstrip('. ').strip()
        for abbr, name in POS_TOKENS:
            if key == abbr or key == abbr.replace('. ', '.'):
                names.append(name); break
        else:
            names.append(key)
    out = ' and '.join(dict.fromkeys(names))
    return out.replace('singular noun and plural', 'singular and plural noun').replace('singular noun and plural noun', 'singular and plural noun')


REF = re.compile(r'\b(?:[ivxlc]+|\d+)\.\s+\d+(?:[:,\-–]\d+)*\.?$')                         # "Isa. xxxviii. 14.": a chapter and verse


def tag_of(seg):
    toks = seg.rstrip().split()
    return toks[-1] if toks else ''


AMBIG = {'Pope.', 'Story.'}                                                   # an author's name that is also a plain word: only a tag after a full stop or a closing quotation mark ("… the Pope." is not one)
SOURCES = re.compile(r'(?:\b(?:Westm|Edin|Ed|Quart|Lond|Brit|Eclec|Sat|Am|Fraser\'s|Chambers\'s)\.? (?:Rev|Mag)\.|\bOxf\. Gloss\.|\bHam\. Nav\.|\bGov\. of (?:the )?Tongue\.|\bFamily of Love\.|\bPop\. Sci\. Monthly\.)$')


def is_tag(seg, authors):
    """Does this run end with an author's name or the name of a periodical? The Gutenberg text sometimes lost the end of the line before the name and left a few letters stuck to it ("hiMotley."), so those count too."""
    seg = seg.rstrip()
    t = tag_of(seg)
    if SOURCES.search(seg):
        return True
    if re.search(r'[a-z.,;!?]["”]\s+[A-Z][a-z]{2,}\.$', seg):                 # a quotation closed, then one capitalised word and a full stop: its author, known or not ("…of intellect." Lingard.)
        return True
    if t in AMBIG:
        return bool(re.search(r'[.!?"”)\]]\s+' + re.escape(t) + r'$', seg))
    if t in authors:
        return True
    m = re.search(r'(?<=[a-z])([A-Z][a-z]{3,}\.)$', t)
    return bool(m and m.group(1) in authors)


TITLES = ('Sir', 'Lord', 'Lady', 'Prof.', 'Gen.', 'Mrs.', 'Dr.', 'Abp.', 'Bp.', 'Fitzed.', 'Ld.', 'Rev.', 'St.', 'Mr.', 'Col.', 'Capt.', 'Hon.', 'Gov.', 'Lieut.', 'Pres.', 'Maj.', 'Adm.', 'Sen.', 'Bart.')
TAGRE = re.compile(r"\s+(?:(?:Sir\.?|Lord|Lady|Prof\.|Gen\.|Mrs\.|Mr\.|Dr\.|Abp\.|Bp\.|Fitzed\.|Ld\.|Rev\.|St\.|Col\.|Capt\.|Hon\.|Gov\.|Lieut\.|Pres\.|Maj\.|Adm\.|Sen\.|&|[A-Z][a-z]?\.)\s+){0,3}[A-Z][\w’'\-]*\.$")


def strip_tail(out, authors):
    """A quotation that sits on the same run as the definition, with its author: 'Cows. "A herd of fifty or sixty kine." Milton.' -> 'Cows.' Repeats for a run of several quotations."""
    cut = False
    for _ in range(20):
        if is_tag(out, authors):
            n = SOURCES.sub('', out).rstrip() if SOURCES.search(out) else TAGRE.sub('', out)
            if n == out:
                n = re.sub(r'(?<=[a-z])[A-Z][a-z]{3,}\.$', '', out)          # a name with letters stuck to it
            if n == out or not n.strip():
                break
            out = n; cut = True
        elif cut and re.search(r'["”]\.?$', out):                      # the quotation that name belonged to
            n = re.sub(r'(?<=[.;:!?\]"”])\s+["“][^"”]{3,}["”]\.?$', '', out)
            if n == out:
                n = re.sub(r'(?<=[.;:!?\]"”])\s+["“][^"”]{3,}$', '', out)
            if n == out:
                break
            out = n
        else:
            break
    return out


def segments(lines):
    """Split the lines of one sense into runs that each end at a line ending in a full stop (or a closing bracket or quotation mark after one)."""
    segs = []; cur = []
    for ln in lines:
        cur.append(ln.strip())
        last = ln.rstrip().split()[-1] if ln.strip() else ''
        if re.search(r'[.!?][\]"”\')]*$', ln.rstrip()) and last.rstrip('.') + '.' not in TITLES and not re.fullmatch(r'[A-Z]\.', last):      # not after "Abp." or "W." at the end of a line: the name goes on in the next
            segs.append(' '.join(cur)); cur = []
    if cur:
        segs.append(' '.join(cur))
    return segs


def sense_text(lines, authors):
    """The definition from the lines of a sense paragraph: its first run, then further runs until one ends with an author's name (a quotation)."""
    segs = segments(lines)
    if not segs:
        return ''
    keep = [segs[0]]
    for sg in segs[1:]:
        if (is_tag(sg, authors) or REF.search(sg)) and len(sg.split()) >= 3:
            break
        keep.append(sg)
    out = ' '.join(keep)
    out = strip_tail(out, authors)                       # a quotation on the same run as the definition, and its author
    for m in re.finditer(r'\s*\[\s*([A-Z][\w’\'\-]*\.?)\s*\]', out):          # "[Shak.]": the quotation that follows is not the definition
        nm = m.group(1) if m.group(1).endswith('.') else m.group(1) + '.'
        if nm in authors and m.start() > 8:
            out = out[:m.start()]; break
    # an author's name left after a usage label: "Unwary; unready. [Obs.] Hudibras."
    out = re.sub(r'(\[[A-Za-z\. ]+\])\s+(?:(?:[A-Z][\w\.’\']*|&)\s?){1,4}\.?$', r'\1', out)
    if out.startswith('See ') and len(out) < 80:
        out = re.sub(r'^(See [^.]+\.)\s+(?:[A-Z][\w’\']*\.?\s?){1,2}$', r'\1', out)
    return clean(out)


def derived_of(lines):
    out = []
    for ln in lines:
        for m in re.finditer(r'(?:^|\s)--\s+([A-Z][A-Za-z`"*\'’\-]*(?:\s[a-z]+)?),\s+(adv|n|a|v\. t|v\. i|v|pl|pron|prep)\.', ' ' + ln):
            f = re.sub(r'[`"*]', '', m.group(1)).strip()
            if f and ' ' not in f:
                out.append((f, m.group(2)))
    return out


MARK = re.compile(r'^\s*(?:Defn:\s*|\d+\.\s+|\([a-z]\)\s+)')                       # the line where a sense starts: "Defn: …", "1. …" or "(a) …"
DERIV = re.compile(r"^\s*--\s+[A-Z][A-Za-z`\"*'’\-]*(?:\s[a-z]+)?,\s+(?:adv|n|a|v\. t|v\. i|v|pl|pron|prep)\.")
INLINE = re.compile(r'(?<=[\s\.\]\)])\(([a-z])\)\s')                               # a sense that begins on the head line itself: "(Aëronautics) (a) A shed for …"


def groups(lines):
    """The parts of an entry after its head line, in order: ('sense', lines), ('syn', lines), ('skip', lines) for a usage note, ('derived', lines). A blank line ends a part; a line that starts a sense
    starts a new one, and the quotations under a sense are simply the lines that follow it."""
    out = []; cur = None; mode = None

    def close():
        nonlocal cur, mode
        if cur is not None:
            out.append((mode, cur))
        cur = None; mode = None
    for ln in lines:
        st = ln.strip()
        if not st:
            close(); continue
        if mode in ('syn', 'skip'):
            cur.append(st); continue
        if st.startswith(('Note:', 'Note.')):
            close(); cur = [st]; mode = 'skip'; continue
        if st.startswith(('Syn.', 'Syn:')):
            close(); cur = [st]; mode = 'syn'; continue
        if DERIV.match(ln):
            close(); cur = [st]; mode = 'derived'; continue
        m = MARK.match(ln)
        if m:
            close(); cur = [ln[m.end():].rstrip()]; mode = 'defn' if m.group(0).lstrip().startswith('Defn:') else 'sense'; continue
        if cur is not None:
            cur.append(st)
    close()
    return out


PERSON = re.compile(r'([123])(?:st|d|nd|rd)\.?\s*(?:pers\.?\s*)?(sing|pl)\.?\s*(pres|pr|imp|pret)?\.?')           # "3d pers. sing. pres."
FORM_LEAD = re.compile(r'^((?:(?:imp|pret|pres|pl|sing|obj|p\.\s?pr|p\.\s?p|vb\.\s?n|[123](?:st|d|nd|rd)(?:\s+pers)?)\.?\s*(?:&|and|or)?\s*)+)(of|for|from)\s+(.*)$', re.S)
FORM_POS = {'', 'past tense', 'past participle', 'past tense and past participle', 'plural', 'singular', 'participle', 'present participle', 'verbal noun', 'objective case', 'present'}
LABEL_ONLY = re.compile(r'^(?:\([^()]{1,60}\)|pl\.|sing\.)(?:\s*(?:\([^()]{1,60}\)|pl\.|sing\.))*\.?$')           # a sense that is only a subject label: "(Anat.)"


def form_words(raw):
    """What an entry that is only a form of another word says it is, in words: 'imp. & p. p.' -> 'past tense and past participle'; '3d pers. sing. pres.' -> '3rd person singular present'."""
    s = raw.strip(' ,;')
    m = PERSON.fullmatch(s)
    if m:
        return '{}{} person {}{}'.format(m.group(1), {'1': 'st', '2': 'nd', '3': 'rd'}[m.group(1)], {'sing': 'singular', 'pl': 'plural'}[m.group(2)],
                                         {'pres': ' present', 'pr': ' present', 'imp': ' past', 'pret': ' past'}.get(m.group(3) or '', ''))
    return pos_name(s)


def cap_first(s):
    m = re.match(r'^((?:\([^()]{1,60}\)\s*)*)(\W*)(\w)(.*)$', s, re.S)
    return (m.group(1) + m.group(2) + m.group(3).upper() + m.group(4)) if m else s


def trim_sense(t, limit=900):
    """A very long definition is cut at the end of a sentence or clause before the limit, else at a word, with a mark."""
    if len(t) <= limit:
        return t
    cut = t[:limit]; i = max(cut.rfind('. '), cut.rfind('; '))
    return cut[:i + 1] if i > limit // 2 else cut[:cut.rfind(' ')].rstrip(' ,;:') + '…'


def parse_entry(headline, lines, authors):
    block = []
    for ln in lines:
        if not ln.strip():
            break
        block.append(ln)
    cut = next((i for i, ln in enumerate(block) if i and MARK.match(ln)), None)     # senses that start inside the head block, with no blank line between
    head_lines = block if cut is None else block[:cut]
    htext = ' '.join(l.strip() for l in head_lines); inline = ''
    m = INLINE.search(htext)
    if m:
        inline = htext[m.start():]; htext = htext[:m.start()]
    forms, syl, pos, et, hlabel, infl = head_of(headline, [htext])
    caps = [h.strip() for h in headline.split(';') if h.strip()]
    heads = []
    for f in forms:
        if letters(f) and any(letters(f) == letters(c) for c in caps) and f not in heads:
            heads.append(f)
    for c in caps:                                        # a headword the head line did not repeat
        if not any(letters(c) == letters(h) for h in heads):
            heads.append(c.title() if len(c) > 1 else c)
    heads = [h for h in heads if letters(h)] or [caps[0].title()]
    body = ([inline] if inline else []) + (block[cut:] if cut is not None else []) + lines[len(block):]
    if inline:                                            # the rest of the head line may carry (b), (c)… too: they are separate senses
        body = re.split(r'(?<=\s)(?=\([a-z]\)\s)', inline) + body[1:]
    senses = []; syn = ''; derived = []; pend = ''
    for mode, g in groups(body):
        if mode == 'derived':
            derived += derived_of(g)
        elif mode == 'syn':
            if not syn:
                t = re.sub(r'^Syn[.:]\s*', '', ' '.join(x.strip() for x in g)).strip()
                t = re.split(r'\s--\s', re.sub(r'^--\s*', '', t))[0]                # a second dash begins the discussion of how the words differ: not kept
                t = re.sub(r'\s*See\s+[A-Z][\w\- ,]*\.\s*$', '', t).strip()          # "See Upright."
                if len(t) > 240:
                    cut = t[:240]; i = cut.rfind('; ')
                    t = (cut[:i] if i > 100 else cut[:cut.rfind(' ')]).rstrip(' ;,') + '…'
                syn = clean(t)
        elif mode in ('sense', 'defn'):
            if g and re.match(r'^Etym:', g[0].strip()):
                g = [re.sub(r'^Etym:\s*\[.*?\]\s*', '', g[0].strip())] + g[1:]     # "1. Etym: […]" is an etymology of its own, and the definition follows in the next part
                if not g[0].strip() or g[0].strip().startswith('Etym:'):
                    continue
            txt = sense_text([x for x in g if x.strip()], authors)
            txt = re.sub(r'^Defn:\s*', '', txt).strip()
            if not txt or len(txt) <= 1:
                continue
            if LABEL_ONLY.match(txt):                         # "1. (Anat.)" and then "Defn: …": the label belongs to the definition that follows it
                pend = (pend + ' ' + re.sub(r'\bsing\.', '(singular)', re.sub(r'\bpl\.', '(plural)', txt))).strip()
                continue
            if pend:
                txt = pend + ' ' + txt; pend = ''
            senses.append(trim_sense(txt))
    pos_n = pos_name(pos) if pos else ''
    pm = re.search(r'(?<![\w])' + PERSON.pattern, htext)
    if senses:                                                # an entry that is only a form of another word: "imp. & p. p. of Begin." -> "Past tense and past participle of Begin."
        first = senses[0]; fm = FORM_LEAD.match(first)
        if fm:
            senses[0] = form_words(fm.group(1)) + ' ' + fm.group(2) + ' ' + fm.group(3)
            if pos_n in FORM_POS:
                pos_n = ''
        elif re.match(r'^(?:of|for|from)\s', first):
            desc = form_words(pm.group(0)) if pm else (form_words(pos) if pos else '')
            if desc and (pm or pos_n in FORM_POS):
                senses[0] = desc + ' ' + first; pos_n = ''
        elif pm and pos_n in FORM_POS:                       # "Hath, 3d pers. sing. pres. of Have": the head says what it is and the definition is the plain meaning
            om = re.match(r'\s*(of|for|from)\s+([A-Z][\w\-]*)', htext[pm.end():])
            pos_n = form_words(pm.group(0)) + (' ' + om.group(1) + ' ' + om.group(2) if om else '')
        if hlabel and not senses[0].startswith('('):          # the subject label printed on the head line belongs to the first sense
            senses[0] = hlabel + ' ' + senses[0]
        senses = [cap_first(re.sub(r'^[,;:.\s]+', '', s)) for s in senses if re.sub(r'^[,;:.\s]+', '', s)]
    if re.search(r'\.|\d(?!st|nd|rd)', pos_n):                # an abbreviation of 1913 that was not worth a name ("sing. pr")
        pos_n = ''
    return {'caps': caps, 'heads': heads, 'syl': syl, 'pos': pos_n, 'senses': senses, 'syn': syn, 'derived': derived, 'infl': infl}


def collect_authors(entries):
    """The names that end quotations, found by counting what ends the later runs of a sense: a name that does so many times is an author's."""
    cnt = collections.Counter()
    for headline, lines in entries:
        rest = lines[:]
        for mode, g in groups(rest):
            if mode not in ('sense', 'defn'):
                continue
            for sg in segments(g)[1:]:
                t = tag_of(sg)
                if re.fullmatch(r"[A-Z][A-Za-z’'\-]{2,}\.", t):
                    cnt[t] += 1
    plain = {'Bible.', 'God.', 'Testament.', 'Latin.', 'England.', 'America.', 'Europe.', 'Asia.', 'Africa.', 'Rome.', 'Greek.', 'French.', 'Christ.', 'Lord.', 'Virgin.', 'Mary.', 'Satan.', 'Heaven.',
             'Church.', 'Jews.', 'Jew.', 'Spain.', 'Italy.', 'India.', 'Egypt.', 'Britain.', 'Germany.', 'France.', 'Scripture.', 'Spirit.', 'Syn.', 'Zoöl.', 'See.', 'Mohammedan.', 'Protestant.', 'Catholic.', 'Hebrew.',
             'Arabic.', 'Persian.', 'English.', 'German.', 'Roman.', 'Romans.', 'Christian.', 'Christians.', 'Mohammedans.', 'Hindoos.', 'Turks.', 'Turk.', 'Indian.', 'Indians.', 'Saxon.', 'Celtic.', 'Gothic.', 'Norse.',
             'Scotch.', 'Irish.', 'Welsh.', 'Dutch.', 'Spanish.', 'Italian.', 'Russian.', 'Chinese.', 'Japanese.', 'Hebrews.', 'Grecian.', 'Athens.', 'Jerusalem.', 'Palestine.', 'Syria.', 'Babylon.', 'Persia.', 'Asia.',
             'London.', 'Paris.', 'Oxford.', 'Cambridge.', 'Sunday.', 'Easter.', 'Pentecost.', 'Christmas.', 'Sabbath.', 'Lent.', 'Eucharist.', 'Trinity.', 'Popes.',
             'Africa.', 'Australia.', 'China.', 'Christ.', 'Church.', 'Indians.', 'Florida.', 'Geology.', 'Hydrostatic.', 'Mineral.', 'Month.', 'Mountain.', 'Paper.', 'Parliament.', 'Southern.', 'Color.',
             'Common.', 'Cross.', 'Dock.', 'Dry.', 'Ear.', 'Field.', 'File.', 'Fish.', 'Function.', 'Gloss.', 'Golden.', 'Knot.', 'Love.', 'Play.', 'Tongue.', 'Wake.', 'Chain.', 'Monthly.',
             'Illust.', 'Gen.', 'Deut.', 'Prov.', 'Cor.', 'Com.', 'Matt.', 'Rom.', 'Ps.', 'Isa.', 'Exod.', 'Lev.', 'Num.', 'Acts.', 'Heb.', 'Rev.', 'Eph.', 'Col.', 'Tim.', 'Pet.', 'Jas.', 'Judg.'}
    # the quotations that are the only thing after the definition end the first run itself: a name that ends a run after a full stop or a closing quotation mark, four times or more, is an author's too
    cnt2 = collections.Counter()
    for headline, lines in entries:
        for mode, g in groups(lines):
            if mode not in ('sense', 'defn'):
                continue
            for sg in segments(g):
                toks = sg.rstrip().split()
                if len(toks) >= 3 and re.fullmatch(r"[A-Z][A-Za-z’'\-]{2,}\.", toks[-1]) and re.search(r'[.!?"”)\]]$', toks[-2]):
                    cnt2[toks[-1]] += 1
    words = {'West.', 'May.', 'Page.', 'Lower.', 'Child.', 'Good.', 'Humble.', 'Gross.', 'Marsh.', 'Jacob.', 'Henry.', 'Monthly.', 'Prof.', 'Abp.', 'Eng.', 'Ham.', 'Nav.', 'Beau.', 'Wake.', 'Bull.', 'Gloss.',
             'Rev.', 'Gen.', 'Matt.', 'Prov.', 'Deut.', 'Isa.', 'Lev.', 'Judg.', 'Ash.', 'Cross.', 'Love.', 'Farrar.'}
    return {t for t, n in cnt.items() if n >= 5 and t not in plain} | {t for t, n in cnt2.items() if n >= 4 and t not in plain and t not in words}


def regular_forms(h):
    """The forms an English word takes by the usual endings: what the app works out itself, so the book's list need not be kept for them."""
    out = {h + 's', h + 'es', h + 'ed', h + 'd', h + 'ing', h + 'er', h + 'est', h + 'r', h + 'st', h + 'ly', h + 'ness'}
    if h.endswith('e'):
        out |= {h[:-1] + 'ing', h[:-1] + 'ed'}
    if h.endswith('y'):
        out |= {h[:-1] + 'ies', h[:-1] + 'ied', h[:-1] + 'ier', h[:-1] + 'iest', h[:-1] + 'ily', h[:-1] + 'iness'}
    if h.endswith('ie'):
        out.add(h[:-2] + 'ying')
    if h.endswith('f') or h.endswith('fe'):
        out |= {h[:-1] + 'ves', h[:-2] + 'ves'}
    if h and h[-1] not in 'aeiou' :
        out |= {h + h[-1] + 'ed', h + h[-1] + 'ing', h + h[-1] + 'er', h + h[-1] + 'est', h + h[-1] + 'es'}
    return out


def build(entries, authors):
    """All parsed entries and the pointer records (variant headwords and derived forms), as (key, record) with record a list the JS side reads."""
    parsed = []
    for headline, lines in entries:
        e = parse_entry(headline, lines, authors)
        if e['senses'] or e['syn'] or e['heads']:
            parsed.append(e)
    recs = []
    allkeys = {norm_key(h) for e in parsed for h in e['heads']}
    for e in parsed:
        keys = [norm_key(h) for h in e['heads']]
        primary = keys[0]
        care = 1 if (any(k in CARE_HEADS for k in keys) or any(CARE.search(s) for s in e['senses'][:6])) else 0
        full = [e['heads'], e['syl'], e['pos'], e['senses'], e['syn'], care]
        recs.append((primary, full))
        for k, h in zip(keys[1:], e['heads'][1:]):
            if k and k != primary:
                recs.append((k, [k, primary, '']))
        if ' ' not in primary:                                       # a form the head line lists that does not follow from the headword by the usual endings, and is not an entry itself (begat → beget)
            reg = regular_forms(primary)
            for f in e['infl']:
                k = norm_key(f)
                if k and ' ' not in k and k != primary and k not in allkeys and k not in reg and k not in {r[0] for r in recs[-3:]}:
                    recs.append((k, [k, primary, 'form']))
        for f, p in e['derived']:
            k = norm_key(f)
            if k and k != primary and k not in keys:
                recs.append((k, [k, primary, {'adv': 'adv.', 'n': 'n.', 'a': 'a.', 'pl': 'pl.'}.get(p, p + '.')]))
    def rare(r):                                                     # an entry whose senses are all obsolete or rare comes after the living ones with the same spelling ("Thee", the pronoun, before "thee", to thrive)
        f = r[1]
        return 1 if isinstance(f[0], list) and f[3] and (all(re.search(r'\[(?:Obs|R)\b', s) for s in f[3][:2]) or re.match(r'(?:An? )?obs(?:olete|\.)', f[3][0], re.I)) else 0
    seen = set(); uniq = []                                          # the book prints a few entries twice
    for r in recs:
        j = json.dumps(r, ensure_ascii=False)
        if j not in seen:
            seen.add(j); uniq.append(r)
    recs = uniq
    recs.sort(key=lambda r: (r[0], rare(r)))                         # stable: entries with the same key stay in the order of the book
    return parsed, recs


def jsdump(x):
    return json.dumps(x, ensure_ascii=False, separators=(',', ':'))


def write(out, recs, sha, n_entries):
    out.mkdir(parents=True, exist_ok=True)
    for f in out.glob('*.js'):
        f.unlink()
    chunks = []; cur = []; size = 0
    for k, r in recs:
        row = jsdump(r); sz = len(row.encode('utf-8')) + 1
        if cur and size + sz > CHUNK_BYTES and k != cur[-1][0]:
            chunks.append(cur); cur = []; size = 0
        cur.append((k, row)); size += sz
    if cur:
        chunks.append(cur)
    index = []
    for i, ch in enumerate(chunks, 1):
        cid = f'w{i:02d}'
        (out / f'{cid}.js').write_text(f'BEATLAB_DICT.add({jsdump(cid)},[' + ',\n'.join(row for _, row in ch) + ']);\n', encoding='utf-8')
        index.append([cid, ch[0][0], len(ch)])
    meta = {'name': 'Webster’s Revised Unabridged Dictionary (1913)', 'licence': LICENCE, 'src': 'https://www.gutenberg.org/ebooks/29765', 'srcBytes': SRC_SIZE, 'sha256': sha, 'entries': n_entries, 'records': len(recs), 'chunks': index}
    (out / 'index.js').write_text('BEATLAB_DICT.addIndex(' + jsdump(meta) + ');\n', encoding='utf-8')
    return index


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--stats', action='store_true'); ap.add_argument('--words', default=''); ap.add_argument('--out', default=str(ROOT / 'dictionary')); ap.add_argument('--src', default=str(SRC))
    a = ap.parse_args()
    body, sha = read_body(pathlib.Path(a.src))
    entries = split_entries(body); authors = collect_authors(entries)
    parsed, recs = build(entries, authors)
    if a.words:
        want = {norm_key(w) for w in a.words.split(',')}
        for e in parsed:
            if any(norm_key(h) in want for h in e['heads']):
                print(json.dumps(e, ensure_ascii=False, indent=1)[:2400]); print()
        return
    if a.stats:
        pos = collections.Counter(e['pos'] for e in parsed)
        print(f'{len(entries):,} headword lines, {len(parsed):,} entries kept, {len(recs):,} records (with pointers), {len(authors)} author names found')
        print('no sense at all:', sum(1 for e in parsed if not e['senses']), '| care-flagged:', sum(1 for _, r in recs if isinstance(r[0], list) and r[5]))
        print('parts of speech:', pos.most_common(24))
        print('senses per entry:', collections.Counter(min(len(e['senses']), 9) for e in parsed).most_common())
        print('some authors:', sorted(authors)[:60])
        total = sum(len(jsdump(r).encode('utf-8')) + 1 for _, r in recs)
        print(f'about {total/1048576:.1f} MiB of records, about {total/CHUNK_BYTES:.0f} chunks')
        return
    index = write(pathlib.Path(a.out), recs, sha, len(parsed))
    total = sum(f.stat().st_size for f in pathlib.Path(a.out).glob('*.js'))
    print(f'wrote {len(index)} chunk files and index.js to {a.out}: {len(parsed):,} entries, {len(recs):,} records, {total/1048576:.1f} MiB')


if __name__ == '__main__':
    main()
