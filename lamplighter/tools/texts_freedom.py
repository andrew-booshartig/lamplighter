"""Texts on freedom of conscience: arguments, statutes and declarations (the library's "Freedom of conscience" shelf). Added 15 and 16 November 2026 with the maker's approval of each source
(Madison's Memorial on the 16th, from the second source tried: the first, Founders Online, stops automated readers and was not bypassed):
   f-blt  Roger Williams, The Bloudy Tenent of Persecution (1644), Project Gutenberg #65739 (the 1848 Hanserd Knollys Society edition)
   f-spi  Spinoza, A Theologico-Political Treatise (1670), R. H. M. Elwes's translation (1883), Project Gutenberg #989 to #992
   f-vst  The Virginia Statute for Establishing Religious Freedom (1786), as printed in the Code of Virginia, section 57-1
   f-bor  The Bill of Rights: the 1789 joint resolution and the first ten amendments (1791), the National Archives' transcriptions
   f-mil  John Stuart Mill, On Liberty (1859), Project Gutenberg #34901
   f-udh  The Universal Declaration of Human Rights (1948), the United Nations
   f-mem  James Madison, Memorial and Remonstrance against Religious Assessments (1785), The Founders' Constitution (University of Chicago Press), which prints the text of The Papers of James Madison
Each builder returns the same kind of entry as texts_manifest.py: secs=[[heading, text]], by, license, src, verse, note. What is left out of the books (editors' introductions and footnotes, marginal
side-notes, tables of contents, volunteers' sentence numbers, italic marks) is said in each entry's note. Downloads are cached in tools/cache/ and parsed only, never executed."""
import re, html
import build_texts_util as U

PG = U.PG_LICENSE
ROMAN = {'I': 1, 'V': 5, 'X': 10, 'L': 50, 'C': 100}


def roman_to_int(s):
    n = 0
    for i, c in enumerate(s):
        n += -ROMAN[c] if i + 1 < len(s) and ROMAN[c] < ROMAN[s[i + 1]] else ROMAN[c]
    return n


def italics(s):
    """Gutenberg's _italic_ marks removed (only where they open and close a run on one paragraph)."""
    return re.sub(r'(?<![A-Za-z0-9])_(?=\S)([^_]{1,600}?)(?<=\S)_(?![A-Za-z0-9])', r'\1', s)


def paragraphs(text):
    """Hard-wrapped lines joined inside paragraphs, blank lines between paragraphs kept, italic marks removed, runs of spaces made one."""
    return re.sub(r'(?<=\S)[ \t]{2,}(?=\S)', ' ', italics(U.unwrap(text)))


def strip_bracketed(s, opener):
    """Remove every "[opener ... ]" group, counting brackets so a note that holds a bracket of its own goes whole; a group on lines of its own takes its
    line end with it, so the paragraph it sat in is not cut in two."""
    out = []; i = 0
    while True:
        j = s.find(opener, i)
        if j < 0: out.append(s[i:]); break
        out.append(s[i:j]); depth = 0; k = j
        while k < len(s):
            if s[k] == '[': depth += 1
            elif s[k] == ']':
                depth -= 1
                if depth == 0: break
            k += 1
        if k >= len(s) or k - j > 4000: raise ValueError('unclosed ' + opener + ' near ' + s[j: j + 60].replace('\n', ' '))
        i = k + 1
        if (j == 0 or s[j - 1] == '\n') and s[i: i + 1] == '\n': i += 1
    return ''.join(out)


def strip_footnote_marks(s, last, skips=3):
    """Remove the editor's footnote marks [1] to [last], which run on in order through the whole book (the e-text lacks a mark here and there, so up to `skips`
    numbers may be missing). Other bracketed numbers (verse numbers the editor added, such as "Rev. iii. [20]") are the edition's own words and stay: a mark is taken
    to be a footnote mark only when it is the next number in the run."""
    nxt = 1; out = []; i = 0; missed = 0
    for m in re.finditer(r'\[(\d{1,3})\]', s):
        n = int(m.group(1))
        if n == nxt or (n == nxt + 1 and missed < skips):
            if n != nxt: missed += 1
            if n > last: continue
            out.append(s[i: m.start()]); i = m.end(); nxt = n + 1
    out.append(s[i:]); res = ''.join(out)
    if nxt != last + 1 or any(int(x) > 100 for x in re.findall(r'\[(\d{1,3})\]', res)): raise ValueError('footnote marks: reached %d of %d' % (nxt - 1, last))
    return res


def short_title(t, limit=120):
    """Elwes's chapter titles run to a paragraph; a heading keeps the first clause."""
    t = re.sub(r'\s+', ' ', t).strip().rstrip('.')
    if len(t) <= limit: return t
    m = re.search(r'\. (?=[A-Z])', t)
    if m and 25 <= m.start() <= limit: return t[:m.start()]
    cut = max(t.rfind('; ', 0, limit), t.rfind(', ', 0, limit))
    return t[:cut] if cut >= 40 else t[:t.rfind(' ', 0, limit)] + '…'


def sentence_case(t):
    """An ALL-CAPS title as a sentence, for the few places a mixed-case title is not available."""
    t = re.sub(r'\s+', ' ', t).strip().rstrip('.')
    return t[:1] + t[1:].lower()


def html_text(raw):
    """Page text with the chrome removed and block ends as blank lines."""
    s = re.sub(r'<script.*?</script>|<style.*?</style>|<nav.*?</nav>|<header.*?</header>|<footer.*?</footer>', ' ', raw, flags=re.S | re.I)
    s = re.sub(r'<(?:br)\s*/?>', '\n', s, flags=re.I); s = re.sub(r'</(?:p|div|li|h\d|tr|ol|ul)>', '\n\n', s, flags=re.I)
    s = html.unescape(re.sub(r'<[^>]+>', ' ', s)).replace('\xa0', ' ')
    s = re.sub(r'[ \t\r\f\v]+', ' ', s); s = re.sub(r' *\n *', '\n', s); return re.sub(r'\n{3,}', '\n\n', s).strip()


# ─────────────────────────────── Mill: On Liberty ───────────────────────────────
MILL_TITLES = {'I': 'Introductory', 'II': 'Of the liberty of thought and discussion', 'III': 'Of individuality, as one of the elements of well-being',
               'IV': 'Of the limits to the authority of society over the individual', 'V': 'Applications'}


def mill(fetch, CACHE):
    t = U.pg_text(fetch, CACHE, 34901)
    ded = re.search(r'^_To the beloved and deplored memory of her.*?_\s*$', t, re.S | re.M)
    start = re.search(r'^ON LIBERTY\.\s*$', t, re.M)
    if not ded or not start: raise ValueError('On Liberty: start not found')
    body = t[start.end():]
    heads = list(re.finditer(r'^CHAPTER ([IVX]+)\.\s*\n', body, re.M))
    if [h.group(1) for h in heads] != ['I', 'II', 'III', 'IV', 'V']: raise ValueError('On Liberty: chapters not as expected: %s' % [h.group(1) for h in heads])
    secs = [['Dedication', paragraphs(ded.group(0).strip().strip('_'))]]; notes = []
    for k, h in enumerate(heads):
        end = heads[k + 1].start() if k + 1 < len(heads) else len(body); c = body[h.end(): end]
        c = re.sub(r'\A\s*[A-Z][A-Z ,;:\'’\-\n]+\.\s*\n', '', c, count=1)                          # the chapter's title lines (in capitals)
        fm = re.search(r'^FOOTNOTES?:\s*$', c, re.M)
        if fm:
            nt = c[fm.end():]; c = c[:fm.start()]
            notes.append(paragraphs(nt))
        secs.append(['Chapter %s · %s' % (h.group(1), MILL_TITLES[h.group(1)]), paragraphs(c)])
    if notes:
        text = '\n\n'.join(notes); olds = re.findall(r'^\[(\d+)\]', text, re.M); new = {o: str(i + 1) for i, o in enumerate(olds)}           # numbered from 1 (the source went on from the introduction's notes)
        secs = [[h, re.sub(r'\[(\d+)\]', lambda m: '[%s]' % new.get(m.group(1), m.group(1)), b)] for h, b in secs + [['Footnotes by Mill', text]]]
    return dict(secs=U.finish(secs, False), by='John Stuart Mill, On Liberty (1859), from the Walter Scott edition with W. L. Courtney’s introduction (1901), which is left out', license=PG, src='https://www.gutenberg.org/ebooks/34901', verse=False,
                note='Mill’s essay on the limits of the power that society may rightly use over the individual, including the liberty of thought and discussion and of religious opinion. W. L. Courtney’s introduction and the table of contents in the source are left out; Mill’s own nine footnotes are kept, numbered from 1 and gathered at the end.')


# ─────────────────────────────── Spinoza: Theologico-Political Treatise ───────────────────────────────
def spinoza_notes(nt):
    """The author's endnotes of one part: the file's own labels made alike, each chapter's notes under a small heading."""
    nt = re.sub(r'^(?:CHAPTERS? [IVXL]+ to [IVXL]+|Part [0-9IV]+(?: of [IV]+)? - Chapters [^\n]*)\s*$', '', nt, flags=re.M | re.I)
    nt = re.sub(r'^\[Endnote (\d+)\]\.?', r'Endnote \1.', nt, flags=re.M)
    return re.sub(r'^(?:CHAPTER|Chapter) ([IVXL]+)\.?\s*$', lambda m: '\n## Chapter ' + m.group(1) + '\n', nt, flags=re.M)


def spinoza(fetch, CACHE):
    secs = []; endnotes = []; roman_parts = {989: 'I (chapters I to V)', 990: 'II (chapters VI to X)', 991: 'III (chapters XI to XV)', 992: 'IV (chapters XVI to XX)'}
    for n, part in ((989, 'I'), (990, 'II'), (991, 'III'), (992, 'IV')):
        t = U.pg_text(fetch, CACHE, n)
        t = re.sub(r'^[ \t]*\[\d+:[0-9A-Za-z]\][ \t]*', '', t, flags=re.M)                       # the volunteers' search strings at the head of a line
        t = re.sub(r'[ \t]*\[\d+:[0-9A-Za-z]\][ \t]*', ' ', t)                                    # and inside one
        t = re.sub(r'(?<![\w])\((?:\d{1,2}:)?\s*\d{1,3}\s*\)[ \t]?', '', t)                      # and their sentence numbers
        t = re.sub(r'(?<=[A-Za-z]) , ', ', ', t)                                                    # (a number in the middle of a sentence leaves a gap before the comma)
        t = re.sub(r'(?<=[A-Za-z])\(\d{1,3}\)(?=[;:,.]?\s)', '', t)                                # (one of which sits against the word before it)
        t = re.sub(r'[ \t]*\{or [^{}]{1,80}\}', '', t)                                            # a modern gloss the e-text makers put in braces ("{or United States of America}")
        t = re.sub(r'\{([^{}]{1,80})\}', r'\1', t)                                                # and the words they put in braces where the print had Greek or Hebrew letters
        if part == 'I':
            pre = list(re.finditer(r'^PREFACE\.\s*$', t, re.M))                                    # the contents list the preface first, then the text proper begins with it
            if len(pre) < 2: raise ValueError('Spinoza part I: preface not found twice')
            main0 = pre[1].start()
        else:
            starts = list(re.finditer(r"^CHAPTER ([IVXL]+)[ .]*[-–]*[ ]*([A-Z][A-Z ,;:'’\-]{6,})\.?$", t, re.M))   # chapter titles in capitals: the text, not the contents
            if not starts: raise ValueError('Spinoza part %s: no chapters' % part)
            main0 = starts[0].start()
        toc = t[:main0]; titles = {}
        for m in re.finditer(r'^CHAPTER ([IVXL]+)[ .]*[-–]*[ ]*([^\n]+)\n((?:(?!\s*\n)[^\n]+\n)*)', toc, re.M):
            ttl = re.sub(r'\s+', ' ', m.group(2) + ' ' + m.group(3)).strip().rstrip('.')
            if m.group(1) not in titles and ttl and not ttl.isupper(): titles[m.group(1)] = short_title(ttl)
        end = re.search(r'^End of Part', t[main0:], re.M); main = t[main0: main0 + end.start()] if end else t[main0:]
        hs = list(re.finditer(r'^CHAPTER ([IVXL]+)[ .]*[-–]*[ ]*[A-Z][^\n]*(?:\n(?!\s*\n)[^\n]+)*\n', main, re.M))
        if not hs: raise ValueError('Spinoza part %s: no chapter headings in the text' % part)
        if part == 'I':
            secs.append(['Preface', paragraphs(re.sub(r'\A\s*PREFACE\.\s*', '', main[:hs[0].start()]))])
        for k, h in enumerate(hs):
            stop = hs[k + 1].start() if k + 1 < len(hs) else len(main); body = main[h.end(): stop]
            r = h.group(1); name = titles.get(r) or short_title(sentence_case(re.sub(r'^CHAPTER [IVXL]+[ .]*[-–]*[ ]*', '', h.group(0).split('\n')[0])))
            secs.append(['Chapter %s · %s' % (r, name), paragraphs(body)])
        nm = re.search(r"^AUTHOR'S ENDNOTES TO THE THEOLOGICO-POLITICAL TREATISE\s*$", t, re.M)
        if nm:
            e = re.search(r'^End of ', t[nm.end():], re.M); nt = t[nm.end(): nm.end() + e.start()] if e else t[nm.end():]
            endnotes.append(['Endnotes by Spinoza · Part %s' % roman_parts[n], paragraphs(spinoza_notes(nt))])
    secs += endnotes
    return dict(secs=U.finish(secs, False), by='Benedict de Spinoza, A Theologico-Political Treatise (1670), translated by R. H. M. Elwes (1883)', license=PG, src='https://www.gutenberg.org/ebooks/989', verse=False,
                note='Spinoza’s case for freedom of thought and speech in a free state (chapter XX) and for reading Scripture as history; published anonymously in 1670 and banned in the Dutch Republic in 1674. Four Project Gutenberg files joined; the volunteers’ sentence numbers, search strings and tables of contents in those files are left out (and one modern-looking gloss in braces, “{or United States of America}”, which the file does not attribute to Elwes), and Spinoza’s own endnotes are kept, gathered at the end (the “[Endnote 12]” marks in the text point to them; the e-text has no mark for notes 3, 6 and 17).')


# ─────────────────────────────── Roger Williams: The Bloudy Tenent ───────────────────────────────
def williams(fetch, CACHE):
    t = U.pg_text(fetch, CACHE, 65739)
    k = t.find('\nFOOTNOTES\n')                                                                  # the editor's footnotes are gathered near the end, numbered on through the whole book
    if k < 0: raise ValueError('Bloudy Tenent: footnotes not found')
    labels = [int(x) for x in re.findall(r'^\[(\d{1,3})\]', t[k:], re.M)]
    if not labels or labels != list(range(1, len(labels) + 1)): raise ValueError('Bloudy Tenent: footnote labels are not 1 to n')
    t = strip_footnote_marks(t[:k], len(labels)) + t[k:]
    a = re.search(r'^\s*BLOVDY TENENT\s*$', t, re.M)
    if not a: raise ValueError('Bloudy Tenent: title page not found')
    t = t[a.start():]
    fin = [m.start() for m in re.finditer(r'^FINIS\.\s*$', t, re.M)]
    if len(fin) < 2: raise ValueError('Bloudy Tenent: expected two FINIS')
    part1 = t[:fin[0]]; p2 = t[fin[0]: fin[1]]
    fn = p2.find('\nFOOTNOTES\n'); part2 = p2[:fn] if fn > 0 else p2
    def clean(s):
        s = strip_bracketed(s, '[Sidenote:')                                                       # the printed marginal notes
        return s
    part1 = clean(part1); part2 = clean(part2)
    secs = []
    # the title page's twelve propositions, then the addresses and the two earlier papers
    props = re.search(r'^First\. That the blood.*?(?=^TO THE RIGHT HONOURABLE)', part1, re.S | re.M)
    if props: secs.append(['The twelve propositions on the title page', paragraphs(props.group(0))])
    marks = [('TO THE RIGHT HONOURABLE BOTH HOUSES OF THE HIGH COURT OF PARLIAMENT.', 'To the High Court of Parliament'),
             ('TO EVERY COURTEOUS READER.', 'To every courteous reader'),
             ('SCRIPTURES AND REASONS, WRITTEN LONG SINCE BY A WITNESS OF JESUS CHRIST,', 'Scriptures and reasons against persecution, written by a close prisoner in Newgate'),
             ('THE ANSWER OF MR. JOHN COTTON, OF BOSTON, IN NEW ENGLAND, TO THE', 'The answer of Mr. John Cotton of Boston'),
             ('A REPLY TO THE AFORESAID ANSWER OF MR. COTTON, IN A CONFERENCE BETWEEN', None)]
    pos = []
    for key, name in marks:
        m = re.search('^' + re.escape(key) + r'\s*$', part1, re.M)
        if not m: raise ValueError('Bloudy Tenent: heading not found: ' + key[:40])
        pos.append((m.start(), m.end(), name))
    for k in range(len(pos) - 1):
        s0, e0, name = pos[k]; chunk = part1[e0: pos[k + 1][0]]
        chunk = re.sub(r'\A(?:\s*[A-Z][A-Z ,.;:\'’\-]{3,}\n)*', '', chunk)                          # the rest of a heading that runs on to a second or third line
        secs.append([name, paragraphs(chunk)])
    reply = part1[pos[-1][1]:]
    chaps = list(re.finditer(r'^CHAP\. ([IVXLC]+)\.\s*$', reply, re.M)); seen = {}
    for k, c in enumerate(chaps):
        stop = chaps[k + 1].start() if k + 1 < len(chaps) else len(reply); r = c.group(1); seen[r] = seen.get(r, 0) + 1
        label = 'Truth and Peace reply to Mr. Cotton · Chapter %s' % r + (' (a second chapter so numbered)' if seen[r] > 1 else '')
        secs.append([label, paragraphs(reply[c.end(): stop])])
    imp = re.search(r'^TO THE IMPARTIAL READER\.\s*$', part2, re.M)
    if not imp: raise ValueError('Bloudy Tenent: second part not found')
    chaps2 = list(re.finditer(r'^CHAP\. ([IVXLC]+)\.\s*$', part2, re.M))
    secs.append(['Mr. Cotton’s letter answered · To the impartial reader', paragraphs(part2[imp.end(): chaps2[0].start()])])
    for k, c in enumerate(chaps2):
        stop = chaps2[k + 1].start() if k + 1 < len(chaps2) else len(part2)
        secs.append(['Mr. Cotton’s letter answered · Chapter %s' % c.group(1), paragraphs(part2[c.end(): stop])])
    return dict(secs=U.finish(secs, False), by='Roger Williams, The Bloudy Tenent of Persecution for Cause of Conscience, discussed in a Conference between Truth and Peace, and Mr. Cotton’s Letter examined and answered (1644), edited for the Hanserd Knollys Society by Edward Bean Underhill (1848)',
                license=PG, src='https://www.gutenberg.org/ebooks/65739', verse=False,
                note='The first great English argument for freedom of conscience, by the founder of Providence, Rhode Island. The text is as printed in the 1848 edition, whose spelling is modern; the editor’s introduction and footnotes and the marginal side-notes are left out.')


# ─────────────────────────────── James Madison: Memorial and Remonstrance ───────────────────────────────
def madison(fetch, CACHE):
    raw = fetch('https://press-pubs.uchicago.edu/founders/documents/amendI_religions43.html', CACHE / 'freedom' / 'madison-founders-constitution.html').decode('utf-8', errors='replace')
    paras = [re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', p))).replace('\xa0', ' ').strip() for p in re.findall(r'<p[^>]*>(.*?)</p>', raw, re.S | re.I)]
    i = next((k for k, p in enumerate(paras) if p.startswith('To the Honorable the General Assembly')), -1)
    j = next((k for k, p in enumerate(paras) if p.startswith('The Founders')), -1)                  # the page's own footer: where the text ends
    if i < 0 or j <= i: raise ValueError('Memorial and Remonstrance: text not found')
    m = re.match(r'(To the Honorable the General Assembly of the Commonwealth of Virginia) (A Memorial and Remonstrance)$', paras[i])
    if not m: raise ValueError('Memorial and Remonstrance: address not as expected: ' + paras[i][:100])
    body = paras[i + 1: j]
    nums = [int(x.group(1)) for x in (re.match(r'(\d{1,2})\. Because ', p) for p in body) if x]
    if len(body) != 16 or nums != list(range(1, 16)): raise ValueError('Memorial and Remonstrance: expected an opening paragraph and fifteen numbered ones; found %d paragraphs, numbered %s' % (len(body), nums))
    if sum(p.count('[Virginia Declaration') for p in body) != 4: raise ValueError('Memorial and Remonstrance: expected four editorial pointers to the Virginia Declaration of Rights')
    body = [re.sub(r' {2,}', ' ', strip_bracketed(p, '[Virginia Declaration')) for p in body]     # the editors' pointers to articles 1 and 16, which are not Madison's words
    text = '\n\n'.join([m.group(1), m.group(2)] + body)
    if re.search(r'[\[\]<>]|&(?:#\d+|[a-z]+);', text): raise ValueError('Memorial and Remonstrance: stray mark left in the text')       # (the one “&” in paragraph 8 is Madison’s own)
    return dict(secs=[['A Memorial and Remonstrance (to the General Assembly of Virginia, June 1785)', text]],
                by='James Madison, A Memorial and Remonstrance against Religious Assessments, dated 20 June 1785, to the General Assembly of Virginia (The Papers of James Madison, vol. 8, pp. 298–304, as printed in The Founders’ Constitution)',
                license='Public domain (James Madison, 1785); transcription from The Founders’ Constitution, University of Chicago Press (the page is marked © 1987 University of Chicago)',
                src='https://press-pubs.uchicago.edu/founders/documents/amendI_religions43.html', verse=False,
                note='Madison’s case against a Virginia bill “establishing a provision for Teachers of the Christian Religion”, in fifteen numbered reasons that each begin “Because”; it is often read beside the Virginia Statute and the First Amendment. The text keeps the source’s spelling and capitals. The editors’ four bracketed pointers to Virginia’s Declaration of Rights (its articles 1 and 16), which are not Madison’s words, are left out.')


# ─────────────────────────────── Wikisource pages: John Locke and the Cyrus Cylinder ───────────────────────────────
def wiki_plain(s):
    """Wikitext to plain text for the few marks these pages use: a link becomes its label, bold and italic marks go."""
    s = re.sub(r'\[\[(?:[^\]|]*\|)?([^\]]*)\]\]', r'\1', s)
    return re.sub(r"'{2,}", '', s)


def wiki_body(raw, what):
    """A Wikisource page's own text: the {{header}} block at its top taken off."""
    m = re.match(r'\s*\{\{header\b.*?\n\}\}\s*', raw, re.S | re.I)
    if not m: raise ValueError(what + ': the {{header}} block was not found')
    return raw[m.end():]


WIKI_MARKUP = re.compile(r"\{\{|\}\}|\[\[|\]\]|''|<|&[a-z#0-9]+;|^==", re.M)


def locke(fetch, CACHE):
    raw = fetch('https://en.wikisource.org/w/index.php?title=A_Letter_Concerning_Toleration&action=raw', CACHE / 'freedom' / 'locke-wikisource.txt').decode('utf-8')
    body = wiki_body(raw, 'Letter Concerning Toleration').split('\n{{PD-old}}')[0]
    marks = re.findall(r'\[(\d{1,2})\]', body)
    if marks != [str(i) for i in range(1, 10)]: raise ValueError('Letter Concerning Toleration: the footnote marks are not 1 to 9: %s' % marks)
    body = re.sub(r'(?<=\S)\[\d{1,2}\]', '', body)                                           # the page keeps nine footnote marks and none of the notes they point to
    paras = [re.sub(r'\s+', ' ', p).strip() for p in re.split(r'\n\s*\n', body) if p.strip()]
    text = '\n\n'.join(paras)
    if WIKI_MARKUP.search(text): raise ValueError('Letter Concerning Toleration: wiki markup left in the text')
    if not text.startswith('Since you are pleased to inquire') or not text.endswith('to a person of your parts.'): raise ValueError('Letter Concerning Toleration: start or end not as expected')
    return dict(secs=U.finish([['A Letter Concerning Toleration (William Popple’s translation of 1689)', text]], False),
                by='John Locke, A Letter Concerning Toleration (written in Latin in 1685–86, printed in 1689), in William Popple’s English translation of 1689, as given on Wikisource',
                license='Public domain (Locke, 1689, in Popple’s translation of the same year); transcription from Wikisource, where the page is marked public domain (the wiki’s own contributions are CC BY-SA)',
                src='https://en.wikisource.org/wiki/A_Letter_Concerning_Toleration', verse=False,
                note='Locke’s argument that the state’s business is the civil interests of its subjects and not the saving of their souls, and that belief cannot be forced. It also says whom he would not tolerate: those who deny that there is a God, and a church whose members owe obedience to another prince. The page does not say which printing it follows, and its spelling is lightly modernised. The nine footnote marks in its text are left out, because the page does not include the notes they point to.')


def cyrus(fetch, CACHE):
    raw = fetch('https://en.wikisource.org/w/index.php?title=Cyrus_cylinder&oldid=4591785&action=raw', CACHE / 'freedom' / 'cyrus-wikisource-oldid-4591785.txt').decode('utf-8')
    body = wiki_body(raw, 'Cyrus Cylinder').split('\n==Annotations==')[0]
    body = re.sub(r'^\s*\[\[Image:[^\n]*\n', '', body)
    notes = re.findall(r'<ref>(.*?)</ref>', body, re.S)
    if len(notes) != 1: raise ValueError('Cyrus Cylinder: expected one footnote, found %d' % len(notes))
    body = wiki_plain(re.sub(r'<ref>.*?</ref>', '[1]', body, flags=re.S))
    paras = [re.sub(r'\s*\n\s*', ' ', p).strip() for p in re.split(r'\n\s*\n', body) if p.strip()]
    if not 30 <= len(paras) <= 40 or paras[0] != '(...) his troops' or not paras[-1].endswith('I permitted all to dwell in peace [ . . . ]'): raise ValueError('Cyrus Cylinder: %d paragraphs, start or end not as expected' % len(paras))
    text = '\n\n'.join(paras)
    if WIKI_MARKUP.search(text): raise ValueError('Cyrus Cylinder: wiki markup left in the text')
    return dict(secs=[['The Cyrus Cylinder (translation by Robert William Rogers, 1912)', text + '\n\n[1] ' + wiki_plain(notes[0]).strip() + '.']],
                by='The Cyrus Cylinder (a clay cylinder from Babylon, about 539–530 BCE), in Robert William Rogers’s translation in Cuneiform Parallels to the Old Testament (1912), as on the Wikisource page “Cyrus cylinder” in its revision of 21 September 2013',
                license='Public domain (Rogers’s translation of 1912; the cylinder is of the 6th century BCE); transcription from an older revision of Wikisource’s page, which is marked public domain (the wiki’s own contributions are CC BY-SA)',
                src='https://en.wikisource.org/w/index.php?title=Cyrus_cylinder&oldid=4591785', verse=False,
                note='Rogers’s 1912 translation of the clay cylinder in which Cyrus tells of taking Babylon in 539 BCE; the gaps in the clay are marked as in the source, and the page’s one footnote is the last line. It is an old and partial rendering, since the cylinder has been read more fully. The page’s current text is a different, later translation, which is not used here; this is the text of the page before it was replaced. Not compared with Rogers’s book.')


# ─────────────────────────────── Asoka: Vincent A. Smith, The Edicts of Asoka (1909) ───────────────────────────────
OCR_PREFIXES = {'self', 'well', 'ill', 'half', 'non', 'anti', 'semi', 'all', 'ever', 'vice', 'ex', 'co', 'so', 'north', 'south', 'east', 'west', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
                'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety', 'hundred'}
RE_TITLES = ['The sacredness of life', 'Provision of comforts for men and animals', 'The quinquennial circuit', 'The practice of piety', 'Censors of the Law of Piety', 'The prompt dispatch of business', 'Imperfect fulfilment of the Law',
             'Pious tours', 'True ceremonial', 'True glory', 'True almsgiving', 'Toleration', 'True conquest', 'Epilogue']
PE_TITLES = ['The principles of government', 'The royal example', 'Self-examination', 'The powers and duties of commissioners', 'Regulations restricting slaughter and mutilation of animals', 'The necessity for a definite creed',
             'Review of the king’s measures for propagation of the Law of Piety']
ROMAN7 = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII']
ROMAN14 = ROMAN7 + ['VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV']
# (heading as the scan spells it, name of the section; None marks the heading of a group, which ends the section before it and starts none)
ASOKA_MARKS = ([(r'^THE MINOR ROCK EDICTS\.$', 'Minor Rock Edict I · The fruit of exertion (Rupnath text)'), (r'^THE MINOR ROCK EDICTS\.$', 'Minor Rock Edict I · The same edict (Brahmagiri text)'),
                (r'^MINOR ROCK EDICTS\.$', 'Minor Rock Edict II · Summary of the law of piety'), (r'^THE .?BHABRA EDICT\.$', 'The Bhabra Edict · Asoka’s favourite passages of scripture')]
               + [(r'^.?ROCK.? EDICT\b', 'Rock Edict %s · %s' % (r, t)) for r, t in zip(ROMAN14, RE_TITLES)]
               + [(r'^THE KALINGA EDICTS\.$', None), (r'^I\. THE BORDERERS.? EDICT', 'Kalinga Edict I · The Borderers’ edict: the duties of officials to the border tribes'),
                  (r'^KALINGA EDICT II\.', 'Kalinga Edict II · The Provincials’ edict: the duties of officials to the provincials'), (r'^THE SEVEN PILLAR EDICTS\.$', None)]
               + [(r'^PILLAR EDICT\b', 'Pillar Edict %s · %s' % (r, t)) for r, t in zip(ROMAN7, PE_TITLES)]
               + [(r'^THE MINOR PILLAR EDICTS\.$', None), (r'^I\. THE SARNATH PILLAR EDICT', 'Minor Pillar Edict I · The Sarnath edict: the penalty of schism'), (r'^MINOR PILLAR EDICT II\.', 'Minor Pillar Edict II · The Kausambi edict'),
                  (r'^MINOR PILLAR EDICT III\.', 'Minor Pillar Edict III · The Sanchi edict'), (r'^MINOR PILLAR EDICT IV\.', 'Minor Pillar Edict IV · The Queen’s edict: the donations of the second queen'),
                  (r'^MISCELLANEOUS INSCRIPTIONS\.$', None), (r'^THE COMMEMORATIVE TARAI PILLAR IN', None),
                  (r'^I\. THE ROUMMINDEI INSCRIPTION', 'Tarai Pillar Inscription I · The Rummindei pillar: Asoka’s visit to the birthplace of the Buddha'),
                  (r'^TARAI PILLAR II\.', 'Tarai Pillar Inscription II · The Nigliva pillar: Asoka’s visit to the stupa of the Buddha Konakamana'),
                  (r'^THE BARABAR CAVE DEDICATIONS', 'The Barabar cave dedications of Asoka: cave-dwellings for the Ajivikas'), (r'^THE NAGARJUNI CAVE DEDICATIONS', 'The Nagarjuni cave dedications of Dasaratha: cave-dwellings for the Ajivikas')])
# readings of the scan that are plainly wrong and are the same wherever they occur (found by listing every word the other texts do not use, and reading each in its line)
ASOKA_WORDS = {w.split('>')[0].strip(): w.split('>')[1].strip() for w in (
    'aad>and', 'accordingto>according to', 'alarge>a large', 'alittle>a little', 'aman>a man', 'andsucharethe>and such are the', 'andthe>and the', 'ane>and', 'arethe>are the', 'astwo>as two', 'balf>half', 'bas>has', 'bearkening>hearkening',
    'bis>his', 'bolidayfeasts>holiday-feasts', 'bour>hour', 'bowever>however', 'bundred>hundred', 'bundreds>hundreds', 'butone>but one', 'causethe>cause the', 'conseerated>consecrated', 'datethat>date that', 'doubtfil>doubtful',
    'enbancement>enhancement', 'enormots>enormous', 'eruclty>cruelty', 'etiabled>enabled', 'eycle>cycle', 'famale>female', 'fimale>female', 'filfilment>fulfilment', 'firther>further', 'fiture>future', 'focling>feeling', 'forall>for all',
    'forthe>for the', 'formulz>formulae', 'fostival>festival', 'ftarlessness>fearlessness', 'ftill>full', 'greotings>greetings', 'grandfathet>grandfather', 'graspthe>grasp the', 'hasa>has a', 'hearand>hear and', 'hegoats>he-goats',
    'hisage>his age', 'honoursand>honours and', 'hopethatthe>hope that the', 'ig>is', 'imen>men', 'ina>in a', 'incharge>in charge', 'init>in it', 'inthe>in the', 'isan>is an', 'leagueswhere>leagues where', 'mhust>must', 'modeof>mode of',
    'mustbe>must be', 'myselfstrenuously>myself strenuously', 'needfil>needful', 'nota>not a', 'ofa>of a', 'ofaday>of a day', 'ofdate>of date', 'ofthemonth>of the month', 'oficials>officials', 'onthe>on the', 'officersin>officers in',
    'peoplemay>people may', 'peopleof>people of', 'planied>planted', 'progressin>progress in', 'recotded>recorded', 'regardftl>regardful', 'rfot>not', 'rolatives>relatives', 'skilfiil>skilful', 'skilfil>skilful', 'snoere>were',
    'sucha>such a', 'thecountry>the country', 'thisdocument>this document', 'tothe>to the', 'toand>to and', 'tothem>to them', 'upto>up to', 'welfareand>welfare and', 'whereasthe>whereas the', 'whereever>wherever', 'withauta>without a',
    'youand>you and', 'traismission>transmission', 'athrms>affirms', 'emiissaries>emissaries', 'Fatberand>Father and', 'Orderand>Order and', 'orChurch>or Church', 'Picty>Piety', 'soalsoI>so also I', 'Ting>King', 'ader>Under',
    'anjab>Punjab', 'rjthat>that', 'ithe>the', 'stiipa>stupa', 'stapa>stupa', 'Biihler>Bühler', '2oth>20th', '1go1>1901', 'lam>I am', 'Iam>I am', 'Thad>I had', 'picty>piety', 'vist>visit', 'ef>of', 'illar>pillar',
    'affraid>afraid', 'Howhe>How he', 'foyousness>Joyousness', 'fost>post', 'f61d>fold', 'féasts>feasts', 'Brabmans>Brahmans', 'Atall>At all', 'fora>for a', 'isa>is a', 'Thereforeoughta>Therefore ought a', 'chiefést>chiefest',
    'Awells>dwells', 'Andbrasand>Andhras and', 'atopic>a topic', 'Antioehus>Antiochus', 'Brabmani>Brahmani', 'Tbus>Thus', 'toa>to a', 'fa11>fall', 'Fourie>fourteenth', 'Ihave>I have', 'HisSacred>His Sacred', 'Chavebh>Church',
    'Cherch>Church', 'Chuseb>Church')}
# plain misreadings of more than one word (the scan's noise, a word split across a gap, a hyphen the scan replaced by a tilde and a stray mark)
ASOKA_FIXES = [(r'athe yatta HE SEIT temdias atten SEY 8 ae TN a ieee\s*\|?\s*', ''), (r'\bthe ing:', 'the King:'), (r'\ba tag saith\b', 'Thus saith'), (r'\bbad been\b', 'had been'), (r'\bcrea~ : tures\b', 'creatures'),
               (r'\bBrah~ mans\b', 'Brahmans'), (r'\bcon~ Sist\b', 'consist'), (r'\blazi~ : mess\b', 'laziness'), (r'\bas~ \. cetics\b', 'ascetics'), (r'conquest—~Compare', 'conquest—Compare'), (r'perfect\.~ The', 'perfect. The'),
               (r'\bmamnifdl1d,\.', 'manifold,'), (r'\bcomix modities\b', 'commodities'), (r'\bob/iqua\b', 'obliqua'), (r'\binscri ption\b', 'inscription'), (r'\bcon- trol\b', 'control'), (r'\bpro- ‘vided\b', 'provided'),
               (r'\bex-hort\b', 'exhort'), (r'\bmy ny dominions\b', 'my dominions'), (r'\bsoféras\b', 'so far as'), (r'\bKénigsberg\b', 'Königsberg'), (r'\beffécted\b', 'effected'), (r'\béxistence\b', 'existence'),
               (r'\bfi11\b', 'full'), (r'\bv0l\.', 'vol.'), (r'upon” x a?large', 'upon a large'), (r'\bof the” the\b', 'of the'), (r'\[times\?\]\.’ 7\b', '[times?].’'), (r'\bthe\(7\) Inspectors', 'the Inspectors'), (r'the \(7\) Inspectors', 'the Inspectors'),
               (r'(Thus saith) his\b\.?', r'\1 His'), (r'\bthis very a a of Piety', 'this very Law of Piety'), (r'\s+- \| u 2(?=\s)', ''), (r'\s+\|[:.]?(?=\s)', ''), (r'\[\| put\b', 'I put'), (r'Piyadasi, \\\., 316', 'Piyadasi, I., 316'),
               (r'\.\s+,$', '.'), (r'\bhearkening: to\b', 'hearkening to'), (r'/ittle\b', 'little'), (r'attractive form\.: ', 'attractive form. '), (r'\ball: over\b', 'all over'), (r'” es$', '”'), (r'\s;$', ''), (r'\. \.$', '.'),
               (r'similarly,; ', 'similarly, '), (r'should be\. shown', 'should be shown'), (r'^_ ', ''), (r'(?<=[a-z]) te$', ''), (r'\bthe’ (?=[A-Z])', 'the '), (r'point out\(a', 'point out (a'), (r'spectacles\. of', 'spectacles of'),
               (r'consecrated\. twelve', 'consecrated twelve'), (r'\bdo il,', 'do ill,'), (r'\bal—i together', 'all together'), (r'\bbunting and other', 'hunting and other'), (r'\bex-change\b', 'exchange'), (r',(?=[A-Za-z])', ', '),
               (r'the’same', 'the same'), (r'neighbour\.to say', 'neighbour, to say'), (r'For that\. ‘purpose', 'For that purpose'), (r'\band Sparing\b', 'and sparing'), (r'\bjoyous- Ness\.:', 'joyousness.'), (r'\bfill of delight', 'full of delight'),
               (r'\bLetallj joy; be\b', 'Let all joy be'), (r'\bThat\. avails', 'That avails'), (r'(?<!\.)\.\.(?!\.)', '.'), (r"such and such ' a topic", 'such and such a topic'), (r"again and again ' by", 'again and again by'), (r'chroniclés"of', 'chronicles of'), (r'\bréndered\b', 'rendered'), (r'\bpowerful vil military\b', 'powerful military'), (r'\(4afe\)', '(kafe)'), (r'(?<=[.’]) oy$', ''),
               (r'the INgi—On', 'the King:—On'), (r'\bhalf—kos', 'half-kos'), (r'had f wells', 'had wells'), (r':<-', ':—'), (r'follows\. oe The Way', 'follows. The Way'), (r'\bbere and there', 'here and there'),
               (r'^\. (?=‘)', ''), (r'\s*©\s*', ' '), (r'\bfor _attaining', 'for attaining'), (r'\bo6(?=“)', ''), (r'affection\.of', 'affection of'), (r'\bits fall extent', 'its full extent'), (r'individual i incurs', 'individual incurs'), (r'and\.\(\?\)', 'and (?)'),
               (r'go on\.:', 'go on.'), (r'\bnon—fulfilment', 'non-fulfilment'), (r'King :—7 When', 'King:—When'), (r'\s+:(?=—)', ':'), (r'\btwo—footed', 'two-footed'), (r'follow i its', 'follow its'), (r'\s+:$', ''), (r'^deed saith His Sacred and Gracious Majesty the INgi—Man', 'Thus saith His Sacred and Gracious Majesty the King:—Man'),
               (r'’”’ \.$', '’”’'), (r'Majesty\. the King', 'Majesty the King'), (r'of’ thousands', 'of thousands'), (r'zealous to\. win', 'zealous to win'), (r'to a skilful nurse &els secure', 'to a skilful nurse feels secure'), (r'toa skilful nurse &els secure', 'to a skilful nurse feels secure'),
               (r'hoping to\. save', 'hoping to save'), (r'^oy$', ''), (r'His\. Sacred', 'His Sacred'), (r'Brab- “mani bulls', '“Brahmani bulls'), (r'or So as to destroy 1ifé', 'or so as to destroy life'), (r'\bfill(?=[ -]moon)', 'full'),
               (r'\bIl\. Then', 'II. Then'), (r'\bIll\. Then', 'III. Then'), (r'\bIV\. Tous saith', 'IV. Thus saith'), (r'\bLS Thus saith', 'V. Thus saith'), (r'\ba VII\. Thus', 'VII. Thus'), (r'expound\. my teaching', 'expound my teaching'),
               (r'of the Law of Pie IV\. Thus saith', 'of the Law of Piety.” IV. Thus saith'), (r'Brah—mans', 'Brahmans'), (r'\bex-empt\b', 'exempt'), (r'\bcon- form\b', 'conform'), (r'\bBy\. what', 'By what'), (r'that, -So long', 'that, so long'),
               (r'\bI-had\b', 'I had'), (r'tables of Stone', 'tables of stone'), (r' ey: &$', ''), (r'\bdwell i in\b', 'dwell in'), (r'\bto > dwell\b', 'to dwell'), (r'^oe (?=The Way)', ''), (r'Church must not be quitted\.:', 'Church must not be quitted.'),
               (r'(?<=[a-z.’”]) [x=&]$', ''), (r'^&$', ''), (r'\bthe Chute Chase\b', 'the Church'), (r' ‘oe$', ''), (r'erected le stone', 'erected a stone'), (r'This“banyan', 'This “banyan'), (r'\bIl\. THE VISVA', 'II. THE VISVA'),
               (r'(?:Se )?Ill\. THE KARNA', 'III. THE KARNA'), (r'\bIl\. THE GOPIKA', 'II. THE GOPIKA'), (r'Identical with L\.', 'Identical with I.'), (r'\bIl\]\. THE VADATHIKA', 'III. THE VADATHIKA'), (r'with I\. and IL\.', 'with I. and II.'),
               (r'‘\s+', '‘'), (r'\s+’', '’'), (r'\s+([,;:])(?=\s)', r'\1'), (r'(?<=[A-Za-z])\s+\.(?=\s)', '.')]


def ocr_join(lines, whole):
    """The lines of one paragraph of OCR text as one string. A word split at a line end is rejoined; the hyphen stays only after a prefix or a number word, in an -ly adverb, or where the
    compound is written whole elsewhere in the book."""
    out = ''
    for l in lines:
        if not out: out = l; continue
        m = re.search(r'([A-Za-z]+)([-~]{1,2})$', out)
        if m and re.match(r'[a-z]', l):
            a = m.group(1); b = re.match(r'[a-z]+', l).group(0)
            keep = a.lower() in OCR_PREFIXES or (a.lower().endswith('ly') and len(a) >= 6) or re.search(r'\b%s[-~]%s\b' % (a, b), whole, re.I)
            out = out[:m.end(1)] + ('-' if keep else '') + l
        else: out += ' ' + l
    return out


def ocr_tidy(p):
    """The scan's tilde for a hyphen and for a dash, and its B.C., made what they are."""
    p = re.sub(r'(?<=[A-Za-z])~(?=[A-Za-z])', '-', p)
    p = re.sub(r'\s*[-~]{2,}\s*', '—', p)
    p = re.sub(r':\s*:', ':', p)
    p = re.sub(r'\b[B3]\.[cC]\b\.?', 'B.C.', p)
    p = re.sub(r'\s*_+\s*', ' ', p)                                                            # (stray underscores, which the scan made of spaces and marks)
    p = re.sub(r'[A-Za-z0-9]+', lambda m: ASOKA_WORDS.get(m.group(0), m.group(0)), p)
    for _ in range(2):                                                                         # (twice, so a fix that waits on another, such as a space before a colon, is not missed)
        for rx, rep in ASOKA_FIXES: p = re.sub(rx, rep, p)
    return re.sub(r' {2,}', ' ', p).strip()


def ocr_paragraphs(lines, whole):
    """OCR lines of one part of the book → its paragraphs: page numbers and page furniture dropped, words rejoined, a paragraph the page break split in mid-sentence made one."""
    n = len(lines); kept = []
    for i, l in enumerate(lines):
        s = re.sub(r'^\|+\s*|\s*\|+$', '', l.strip()).strip()                                      # (the scan's vertical strokes at the edge of a line)
        if not s: kept.append(''); continue
        toks = re.findall(r'[A-Za-z]+', s)
        alone = (i == 0 or not lines[i - 1].strip()) and (i + 1 >= n or not lines[i + 1].strip())
        if re.fullmatch(r'[\d\s.,\-—–~|:;]*', s) or re.match(r'THE EDICTS OF ASOKA', s): continue      # a page number or a rule, or the running head
        if alone and (not toks or max(len(t) for t in toks) <= 2 or re.fullmatch(r'[ivxlcIVXLC]{1,6}', s.strip('.,|; '))): continue      # page furniture ("ce SS", "Ms"), a roman page number
        kept.append(s)
    paras = []; cur = []
    for s in kept + ['']:
        if s: cur.append(s)
        elif cur: paras.append(ocr_join(cur, whole)); cur = []
    merged = []
    for p in paras:
        if merged and not re.search(r'[.!?:;”’"\')\]]\s*$', merged[-1]) and (re.match(r'[a-z]', p) or len(merged[-1]) >= 30): merged[-1] += ' ' + p        # (a page break can split a sentence before a capital too: “does His / Sacred Majesty”)
        else: merged.append(p)
    return [p for p in (ocr_tidy(p) for p in merged) if p]                                       # (tidied last, so a phrase the page break split is whole again)


def ashoka(fetch, CACHE):
    raw = fetch('https://archive.org/download/india.history.resource.94247/94247_djvu.txt', CACHE / 'freedom' / 'ashoka-smith-1909-djvu.txt').decode('utf-8', errors='replace')
    L = raw.split('\n')

    def at(rx, start=0, what=''):
        for i in range(start, len(L)):
            if re.match(rx, L[i].strip()): return i
        raise ValueError('Edicts of Asoka: not found: ' + (what or rx))
    i_pref = at(r'^PREFACE', 0, 'preface'); i_cont = at(r'^CONTENTS\.', i_pref, 'contents'); i_intro = at(r'^INTRODUCTION\.', i_cont, 'introduction'); i_edicts = at(r'^EDICTS AND INSCRIPTIONS\.', i_intro, 'edicts')
    i_comm = at(r'^COMMENTARY\.', i_edicts, 'commentary')
    i_stamp = max(i for i, l in enumerate(L) if re.match(r'^Digitized with financial assistance', l.strip()))
    i_end = at(r'^Printed at the Essex House Press', i_comm + 1000, 'printer’s colophon')                  # (the colophon and the scan's stamps after it are left out)
    if not i_pref < i_cont < i_intro < i_edicts < i_comm < i_end <= i_stamp: raise ValueError('Edicts of Asoka: parts out of order')
    whole = '\n'.join(L[i_pref:i_end])
    secs = []
    pref = ocr_paragraphs(L[i_pref + 1:i_cont], whole)
    if pref and re.search(r'Ananda K\.$', pref[0]) and len(pref) > 1: pref[0:2] = [pref[0] + ' ' + pref[1]]       # (its first line, the scan's drop capital, is cut off from the rest by blank lines)
    pref[0] = re.sub(r'^["\[]*Tve\b', 'The', pref[0])
    secs.append(['Preface by Vincent A. Smith', '\n\n'.join(pref)])
    intro = ocr_paragraphs(L[i_intro + 1:i_edicts], whole); intro[0] = re.sub(r'^\\ BOUT\b', 'ABOUT', intro[0])
    secs.append(['Introduction by Vincent A. Smith', '\n\n'.join(intro)])
    # the edicts and inscriptions: every heading in the order of the book, found one after another
    region = L[i_edicts:i_comm]; marks = []; k = 0
    for i, l in enumerate(region):
        if k < len(ASOKA_MARKS) and re.match(ASOKA_MARKS[k][0], l.strip()): marks.append((i, ASOKA_MARKS[k][1])); k += 1
    if k != len(ASOKA_MARKS): raise ValueError('Edicts of Asoka: heading not found: ' + ASOKA_MARKS[k][0])
    heading = re.compile(r'^(?:EDICT [IVX]+\.|The same (?:Edict|Subject|subject)\b|See (?:next|preceding))')
    for j, (i, name) in enumerate(marks):
        if name is None: continue
        end = marks[j + 1][0] if j + 1 < len(marks) else len(region)
        seg = region[i + 1:end]
        while seg and (not seg[0].strip() or heading.match(seg[0].strip()) or (lambda s: s and sum(c.isupper() for c in s) >= 0.6 * len(s))(re.findall(r'[A-Za-z]', seg[0]))): seg = seg[1:]    # the subtitle lines
        paras = ocr_paragraphs(seg, whole)
        if name.startswith('Pillar Edict VII'):                                                    # (its ten numbered sections ran together in the scan)
            paras = [q for p in paras for q in re.split(r'(?<=[.:?”’])\s+(?=(?:II|III|IV|V|VI|VII|VIII|IX|X)\. (?:Then|Thus|Concerning))', p)]
        if not paras: raise ValueError('Edicts of Asoka: nothing under ' + name)
        secs.append([name, '\n\n'.join(paras)])
    secs.append(['Commentary by Vincent A. Smith', '\n\n'.join(ocr_paragraphs(L[i_comm + 1:i_end], whole))])
    return dict(secs=U.finish(secs, False), by='Vincent A. Smith, The Edicts of Asoka, edited in English with an introduction and commentary (London: Essex House Press, 1909)',
                license='Public domain (Vincent A. Smith, 1909; the edicts are of the 3rd century BCE); text from the Internet Archive’s OCR of the Asiatic Society of Bombay’s scan, cleaned by machine',
                src='https://archive.org/details/india.history.resource.94247', verse=False,
                note='Smith’s 1909 translation of every edict and inscription of the Mauryan emperor Asoka then known (the Fourteen Rock Edicts, among them Rock Edict XII on honouring the sects of others; the Minor Rock, Kalinga, Pillar and Minor Pillar edicts; the Tarai and cave inscriptions), with his preface, introduction and commentary. It is OCR text of a scan: page numbers and furniture are removed, words split at line ends are rejoined and some plain misreadings are mended, but other OCR errors remain. The introduction and commentary are 1909 scholarship (Smith held that all the edicts are Buddhist, which later scholars dispute). The scan’s title page and contents list are left out.')


# ─────────────────────────────── Statutes and declarations ───────────────────────────────
def virginia(fetch, CACHE):
    raw = fetch('https://law.lis.virginia.gov/vacode/title57/chapter1/section57-1/', CACHE / 'freedom' / 'va-statute-code.html').decode('utf-8', errors='replace')
    t = html_text(raw); i = t.find('passed an act in the following words:'); j = t.find('Code 1919, § 34', i)
    if i < 0 or j < 0: raise ValueError('Virginia statute: text not found')
    body = t[i + len('passed an act in the following words:'): j].strip()
    paras = [re.sub(r'^[“"]|[”"]$', '', p.strip()).strip() for p in re.split(r'\n\s*\n|\n(?=\s*[“"])', body) if p.strip()]
    paras = [p.replace('\n', ' ') for p in paras if len(p) > 40]
    if len(paras) != 3: raise ValueError('Virginia statute: expected three paragraphs, found %d' % len(paras))
    return dict(secs=[['An Act for Establishing Religious Freedom (passed by the General Assembly of Virginia, 16 January 1786)', '\n\n'.join(paras)]], by='The General Assembly of Virginia (drafted by Thomas Jefferson in 1777; passed 16 January 1786, after James Madison revived it)',
                license='Public domain (an act of 1786; the text as printed in the Code of Virginia, § 57-1)', src='https://law.lis.virginia.gov/vacode/title57/chapter1/section57-1/', verse=False,
                note='The Virginia Statute for Establishing Religious Freedom, the model for the First Amendment’s religion clauses. Jefferson counted it among the three achievements he wished remembered on his gravestone.')


def bill_of_rights(fetch, CACHE):
    raw = fetch('https://www.archives.gov/founding-docs/bill-of-rights-transcript', CACHE / 'freedom' / 'bor-archives.html').decode('utf-8', errors='replace')
    t = html_text(raw)
    a = t.find('THE Conventions of a number of the States'); b = t.find('Article the first...'); c = t.find('ATTEST'); d = t.find('Amendment I\n')
    e = t.find('Amendments 11-27', d)
    if min(a, b, c, d, e) < 0: raise ValueError('Bill of Rights: parts not found')
    pre = re.sub(r'\s+', ' ', t[a:b]).strip()
    pre = re.sub(r'\s*ARTICLES in addition', '\n\nARTICLES in addition', pre)
    secs = [['The 1789 joint resolution of Congress proposing twelve amendments (preamble)', pre]]
    am = re.findall(r'Amendment ([IVX]+)\n+(.+?)(?=\n+Amendment [IVX]+\n|\n+Amendments 11-27)', t[d:e + 40], re.S)
    if [x[0] for x in am] != ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']: raise ValueError('Bill of Rights: amendments not as expected: %s' % [x[0] for x in am])
    names = {'I': 'Amendment I (religion, speech, press, assembly and petition)'}
    for r, body in am: secs.append([names.get(r, 'Amendment %s' % r), re.sub(r'\s+', ' ', body).strip()])
    others = re.sub(r'\s+', ' ', t[b:t.find('Article the third...')]).strip() + '\n\n' + re.sub(r'\s+', ' ', t[t.find('Article the second...'):t.find('Article the third...')]).strip()
    first = re.sub(r'\s+', ' ', t[b:t.find('Article the second...')]).strip(); second = re.sub(r'\s+', ' ', t[t.find('Article the second...'):t.find('Article the third...')]).strip()
    secs.append(['The two other articles proposed in 1789 (Article the first was never ratified; Article the second became the 27th Amendment in 1992)', first + '\n\n' + second])
    return dict(secs=secs, by='The First Congress of the United States, 25 September 1789 (ten of the twelve proposed amendments were ratified on 15 December 1791); transcriptions by the National Archives', license='Public domain (a US government document; transcription by the National Archives)',
                src='https://www.archives.gov/founding-docs/bill-of-rights-transcript', verse=False,
                note='The 1789 joint resolution and the ten amendments as ratified, with the spelling and punctuation of the enrolled original. In the resolution the religion clause is “Article the third”; as ratified it is the First Amendment.')


def udhr(fetch, CACHE):
    raw = fetch('https://www.un.org/en/about-us/universal-declaration-of-human-rights', CACHE / 'freedom' / 'udhr-un.html').decode('utf-8', errors='replace')
    m = re.search(r'<div class="article-body">(.*?)</div>\s*</div>', raw, re.S)
    body = m.group(1) if m else raw
    parts = re.split(r'<h2[^>]*>(.*?)</h2>', body, flags=re.S)
    secs = []

    def numbered(m):                                                                           # an article's clauses, numbered as in the official text: (1), (2), (3)
        items = re.findall(r'<li[^>]*>(.*?)</li>', m.group(0), re.S)
        return ''.join('<p>(%d) %s</p>' % (i + 1, it) for i, it in enumerate(items))
    for k in range(1, len(parts) - 1, 2):
        head = re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', parts[k]))).strip(); txt = html_text(re.sub(r'<ol[^>]*>.*?</ol>', numbered, parts[k + 1], flags=re.S))
        txt = re.sub(r'\n{3,}', '\n\n', txt).strip()
        if head and txt and (head == 'Preamble' or re.match(r'Article \d+', head)): secs.append([head, txt])
    heads = [s[0] for s in secs]
    if heads != ['Preamble'] + ['Article %d' % i for i in range(1, 31)]: raise ValueError('UDHR: sections not as expected: %s' % heads[:5])
    secs[0][0] = 'Preamble (proclaimed by the General Assembly of the United Nations, Paris, 10 December 1948: resolution 217 A)'
    secs[18][0] = 'Article 18 (freedom of thought, conscience and religion)'
    return dict(secs=secs, by='The United Nations General Assembly, resolution 217 A (III), 10 December 1948', license='A United Nations document, reproduced as published on un.org (the UN’s own terms of use apply: un.org/en/about-us/terms-of-use)', src='https://www.un.org/en/about-us/universal-declaration-of-human-rights', verse=False,
                note='Article 18 is the right to freedom of thought, conscience and religion, including the freedom to change one’s religion or belief. The Declaration is not a treaty; the International Covenant on Civil and Political Rights (1966) put similar words into one.')


BUILDERS = {'f-cyr': cyrus, 'f-ash': ashoka, 'f-blt': williams, 'f-spi': spinoza, 'f-lok': locke, 'f-mem': madison, 'f-vst': virginia, 'f-bor': bill_of_rights, 'f-mil': mill, 'f-udh': udhr}


def build(lib, fetch, CACHE):
    res = {}
    for lid, fn in BUILDERS.items():
        if lid not in lib: continue
        try: res[lid] = fn(fetch, CACHE)
        except Exception as ex: print('  FAILED', lid, ex)
    return res
