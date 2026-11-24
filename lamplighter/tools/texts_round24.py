"""Specs for a twenty-fourth batch of open (pre-1931) English texts (19 November 2026): the canons and the catalogue's promises, as the maker approved them on 19 November 2026 ("alright approved", after COLLECTION_PLAN.md,
section 4, round 24): the Mishnah in part, the one complete hadith book (Mishcat-ul-Masabih), the Hedaya, the Harivamsha, thirty minor Upanishads, the Senkessar, Ibn Arabi's Fusus (a synopsis), Foerstemann on the Dresden
Codex, Iqbal's Secrets of the Self, Averroes, Saleeby on the Moros and Sulu, the Spanda Karikas, the Siva and Gheranda Samhitas, the Kularnava Tantra, Avalon's Hymns to the Goddess and Principles of Tantra, Woodroffe's Shakti and
Shakta, Schrader on the Pancaratra, the Culavamsa and the Path of Purity part 2, Albo's Ikkarim, the Bustan, the Satyarth Prakash, Rammohun Roy, the Targums on Genesis and Exodus, Pseudo-Philo, the History of the Patriarchs of
Alexandria, the Jain Antagada, Anuttarovavaiya and Uvasagadasao, Hadfield on the Loyalty Islands, Legge's She King and Ch'un Ts'ew with the Tso Chuen, Budge's Coptic Apocrypha, Muir's Life of Mahomet, Rockhill's Udanavarga and
Life of the Buddha, and Tawney's Katha Sarit Sagara (id t-ksg, not the plan's x-ksg: a book on the folk-tale shelf takes a t- id, as tests/path.test.js requires). Merged into texts_archive.SPECS (see the end of that file); built with python3 build_texts.py --only=ids. An ident 'PG123' is Project Gutenberg #123 (taken through the
gutenberg.pglaf.org mirror); the rest are Internet Archive items (the OCR text only: nothing else was fetched).

Each spec may carry lib=(title, group, when, tr, station title prefix): the Library line and the Path station of an id (the lines are in src/js/24-data-path-lib.js and the station lists, put there by hand).
Where a title page had to be read before building, the note says what the copy is.
"""
import re
from texts_round9 import S, SCH, REF
from texts_round10 import G, T, FIELD
from texts_asia import OLD, SKT

SPECS = {}
fix = lambda i, **kw: SPECS[i].update(kw)

PG_LIC = 'Public domain (typed text from Project Gutenberg, first published %s)'
IA_LIC = 'Public domain (first published %s; text read by machine from a scan at the Internet Archive, so OCR errors remain)'


# ── helpers: a sectioner cuts a text at headings found in order (title, regex), and names each part by hand ──
def marks(*pairs, lead=None, notes=False):
    """A `sectioner` for texts_archive: the text is cut at each heading regex in turn (searched after the previous one); the text before the first heading is `lead`, if given. The heading line itself is the start of its section.
    notes=True turns Project Gutenberg's [Footnote 12: ...] blocks into [12] ... paragraphs first, so the translator's notes are kept (the clean-up of finish() would drop a [Footnote ...] block)."""
    def sectioner(t):
        if notes: t = re.sub(r'\[Footnote\s+(\d+):\s*(.*?)\]', lambda m: '[%s] %s' % (m.group(1), m.group(2)), t, flags=re.S)
        at = 0; pos = []
        for title, rx in pairs:
            m = re.compile(rx, re.M).search(t, at)
            if not m: print('  heading not found:', title, '|', rx[:50]); continue
            pos.append((m.start(), title)); at = m.end()
        out = [[lead, t[:pos[0][0]]]] if lead and pos and t[:pos[0][0]].strip() else []
        for k, (s, title) in enumerate(pos): out.append([title, t[s: pos[k + 1][0] if k + 1 < len(pos) else len(t)]])
        return out
    return sectioner


def english_lines(t, minratio=0.5):
    """For a scan whose facing pages are in Arabic or another script that the OCR read as Latin letters and symbols: drop each line in which fewer than `minratio` of the words (three or more letters) are words the typed texts know. Skipped when the vocabulary is not loaded."""
    import build_texts_util as U
    if not U.VOCAB: return t
    out = []
    for ln in t.split('\n'):
        toks = re.findall(r"[A-Za-z]{2,}", ln)
        if len(toks) >= 3 and sum(1 for w in toks if w.lower() in U.VOCAB) < minratio * len(toks): continue
        if len(toks) < 3 and len(re.findall(r'[^A-Za-z0-9\s.,;:\'’“”"()\-—–?!\[\]/]', ln)) >= 2: continue
        out.append(ln)
    return '\n'.join(out)


def roman(s):
    v = {'I': 1, 'V': 5, 'X': 10, 'L': 50, 'C': 100}; n = 0
    for i, c in enumerate(s):
        n += -v[c] if i + 1 < len(s) and v[c] < v[s[i + 1]] else v[c]
    return n


# ═══════════════════════ Batch 1 (rows 1 to 10 of the plan) ═══════════════════════

# ── The Harivamsha (Dutt, 1897): typed, from Project Gutenberg ──
_HVM_RX = r"^(?:CHAPTER\.?[ \t]+[IVXLC]+\.?[^\n]*|THE PRELUDE\.)(?:\n[A-Z][A-Z’' ,.:;—-]*\.)?[ \t]*$"


def _hvm_sections(t):
    """the chapters, with the last book's chapters (numbered afresh by Dutt) named after it"""
    import build_texts_util as U
    m = re.search(r'^BHAVISHYA PARVA OR THE BOOK OF FUTURE\.[ \t]*$', t, re.M)
    first, last = (t[:m.start()], t[m.end():]) if m else (t, '')
    out = [[h, b] for h, b in U.split_headings(first, _HVM_RX)]
    if last.strip(): out += [['Bhavishya Parva · ' + h, b] for h, b in U.split_headings(last, _HVM_RX)]
    return out

SPECS['x-hvm'] = G('PG61937', 'Manmatha Nath Dutt (editor and translator), A Prose English Translation of Harivamsha, “translated literally into English prose” (Calcutta: H. C. Dass, Elysium Press, 1897)',
    'The Harivamsha (“the family of Hari”, that is of Krishna) is the long poem that follows the Mahabharata: an account of the creation, the patriarchs and the royal dynasties, of the family and deeds of Krishna, and a last “book of the future” (Bhavishya Parva). Dutt, rector of the Keshub Academy in Calcutta, who also put the Ramayana, the Mahabharata and several Puranas into English prose, writes in his introduction that it is a sequel to the Mahabharata and asks whether it should be called a Purana or an epic poem. This is his whole translation with the introduction and his footnotes, typed by Project Gutenberg’s volunteers from a scan of the 1897 printing; the chapters of the last book are numbered afresh in it, so their titles begin “Bhavishya Parva”. ' + OLD,
    lib=('Harivamsha (Manmatha Nath Dutt, 1897)', 'in', 'c. 1st–4th c. CE (a supplement to the Mahabharata; dating debated)', 'gita', 'India’s epics'),
    license=PG_LIC % '1897', clean_scan=False, cut_head=r'^\s*INTRODUCTION\.\s*$', cut_tail=r'^\s*THE END\.\s*$', trim_index=False, trim_front=False, trim_back=False,
    split=None, sectioner=_hvm_sections)

# ── Foerstemann on the Dresden Codex (1906): typed, from Project Gutenberg ──
def _dre_title(h):
    h = h.strip().rstrip('.')
    if h == 'Introduction': return 'The Museum’s note and the author’s preface'
    if h == 'Pages 1-45': return 'First part (codex pages 1–45)'
    if h == 'Pages 46--74': return 'Second part (codex pages 46–74): the form and contents of the second part'
    return 'Codex ' + h.replace('--', '–').replace('Pages', 'pages').replace('Page', 'page')

SPECS['x-dre'] = G('PG43519', 'Ernst Förstemann, Commentary on the Maya Manuscript in the Royal Public Library of Dresden, translated by Selma Wesselhoeft and A. M. Parker, the translation revised by the author (Papers of the Peabody Museum of American Archaeology and Ethnology, Harvard University, vol. 4, no. 2; Cambridge, Mass., October 1906)',
    'This is a commentary on the Dresden Codex, not the codex itself: the Codex is a folded book of 74 pages of Maya picture-writing (glyphs, numbers and figures of the gods) kept at Dresden, and its “text” is the pictures, which this file cannot show. Förstemann, the Dresden librarian whose work on the Maya calendar and number signs this book sums up, goes through the codex page by page: in the first part the day-tables (Tonalamatl) that fill most of its pages, in the second the long series of numbers. He wrote it for readers who have an edition of the manuscript beside them, and expected that it would “soon be far outstripped”. Includes the Museum’s note, his preface and his notes; the index of page references is left out. Typed by Project Gutenberg’s volunteers from the 1906 printing; the drawings of glyphs are not reproduced.',
    lib=('Dresden Codex (Förstemann’s Commentary on the Maya Manuscript, 1906)', 'am', 'c. 11th–12th c. CE (the codex); commentary 1906', 'maya', 'The Dresden Codex'),
    license=PG_LIC % '1906', clean_scan=False, cut_head=r'^\s*NOTE\s*$', trim_index=False, trim_front=False, trim_back=False,
    drop=r'(?ms)^INDEX\.\s*\n.*?(?=^Notes\s*$)|^[ \t]*(?:FIRST PART|PART II)\.[ \t]*\n?|^[ \t]*\*(?:[ \t]+\*){3,}[ \t]*\n?',
    split=r'^Pages?[ \t]+[0-9]+[a-c]?(?:-{1,2}[0-9]+[a-c]?)?\.[ \t]*$', retitle=_dre_title)

# ── Iqbal's Secrets of the Self (Nicholson, 1920): typed, from Project Gutenberg ──
_ASR = [('I', 'Showing that the system of the universe originates in the Self'), ('II', 'Showing that the life of the Self comes from forming desires'), ('III', 'Showing that the Self is strengthened by Love'),
        ('IV', 'Showing that the Self is weakened by asking'), ('V', 'When the Self is strengthened by Love it gains dominion over the forces of the universe'), ('VI', 'A tale: negation of the Self'),
        ('VII', 'Plato and the sheep’s doctrine'), ('VIII', 'The true nature of poetry and the reform of Islamic literature'), ('IX', 'The education of the Self: Obedience, Self-control and Divine Vicegerency'),
        ('X', 'The inner meanings of the names of Ali'), ('XI', 'Story of a young man of Merv who came to the saint Ali Hujwíri'), ('XII', 'Story of the bird that was faint with thirst'), ('XIII', 'Story of the diamond and the coal'),
        ('XIV', 'Story of the Sheikh and the Brahmin'), ('XV', 'The purpose of the Moslem’s life is to exalt the Word of Allah'), ('XVI', 'Precepts for the Moslems of India by Mír Naját Nakshband'), ('XVII', 'Time is a sword'), ('XVIII', 'An invocation')]
SPECS['x-asr'] = G('PG57317', 'Muhammad Iqbal, The Secrets of the Self (Asrár-i Khudí): A Philosophical Poem, translated from the original Persian with introduction and notes by Reynold A. Nicholson (London: Macmillan, 1920; the Persian poem first appeared at Lahore in 1915)',
    'A long Persian poem on the Self (khudi), and on how it is strengthened by desire and love, by the Indian Muslim poet and philosopher Muhammad Iqbal (1877–1938), first published at Lahore in 1915. It argues, in the contents’ own words, that “negation of the Self” is a doctrine of subject peoples and that Plato’s thought is to be guarded against; Nicholson’s note on the poem records that its criticism of Hafiz brought angry protests from Sufi circles. Nicholson, who also translated Rumi, gives it in English verse with his introduction, which sets out Iqbal’s philosophy, and notes. Typed by Project Gutenberg’s volunteers from the 1920 printing, with the footnotes.',
    lib=('The Secrets of the Self (Asrar-i Khudi; Muhammad Iqbal, trans. Nicholson, 1920)', 'is', '1915 CE (Persian); translation 1920', 'isl', 'Rumi, Ibn'),
    license=PG_LIC % '1920', clean_scan=False, cut_head=r'^\s*INTRODUCTION\s*$', cut_tail=r'^\s*THE END\s*$', trim_index=False, trim_front=False, trim_back=False, split=None,
    sectioner=marks(('Introduction by the translator (Nicholson)', r'^INTRODUCTION\s*$'), ('Prologue', r'^PROLOGUE\s*$'), *[('%s · %s' % (n, t), r'^%s\s*$' % n) for n, t in _ASR]))

# ── Averroes (Baroda, 1921): typed, from Project Gutenberg ──
SPECS['x-avr'] = G('PG65708', 'Averroes (Ibn Rushd), The Philosophy and Theology of Averroes: Tractata translated from the Arabic by Mohammad Jamil-ur-Rehman, from Marcus Joseph Müller’s Arabic text of 1859 (The Gaekwad Studies in Religion and Philosophy, no. XI; Baroda: printed at the Arya Sudharak Printing Press, 1 January 1921)',
    'Two short books by the Andalusian philosopher and judge Ibn Rushd (Averroes, 1126–1198), written in the late 1170s or about 1180: the Decisive Discourse (Fasl al-Maqal) on the relation of religion and philosophy, with its appendix on God’s knowledge, and the Exposition of the Methods of Argument (Kashf ‘an Manahij al-Adilla), on the doctrines of the faith: the unity of God, the divine attributes, divine perfection, direction and the actions of God. The Decisive Discourse opens by asking, through the sacred Law, whether the study of philosophy is permitted, discouraged or commanded, and answers that the Law itself urges believers to study creation by reason. The translator, a professor in Hyderabad who made it as a fellow of the Baroda seminar on comparative religion, gives the text with his preface and footnotes (which keep the Qur’an references). Typed by Project Gutenberg’s volunteers from the 1921 printing.',
    lib=('The Philosophy and Theology of Averroes (trans. Mohammad Jamil-ur-Rehman, 1921)', 'is', '1179–80 CE (Averroes); translation 1921', 'isl', 'Al-Ghaz'),
    license=PG_LIC % '1921', clean_scan=False, cut_head=r'^\s*DEDICATION\s*$', cut_tail=r'^\s*Transcriber’s Notes\s*$', trim_index=False, trim_front=False, trim_back=False, split=None,
    sectioner=marks(('I · A decisive discourse on the delineation of the relation between religion and philosophy', r'^\s*A DECISIVE DISCOURSE ON THE DELINEATION\s*$'),
                    ('I · Appendix: on the problem of eternal knowledge', r'^\s*APPENDIX\.\s*$'),
                    ('II · An exposition of the methods of argument concerning the beliefs of the faith', r'^\s*AN EXPOSITION OF THE METHODS OF ARGUMENTS CONCERNING\s*$'),
                    ('II · Of the unity of God', r'^\s*OF THE UNITY OF GOD\s*$'), ('II · On divine attributes', r'^\s*ON DIVINE ATTRIBUTES\s*$'), ('II · Of divine perfection', r'^\s*OF DIVINE PERFECTION\s*$'),
                    ('II · Of direction', r'^\s*OF DIRECTION\s*$'), ('II · Of the actions of God', r'^\s*OF THE ACTIONS OF GOD\s*$'), lead='Dedication and preface by the translator', notes=True))


# ── the Mishnah in part: Eighteen Treatises (de Sola and Raphall, 1843) ──
SPECS['e-mis'] = G('eighteentreatis00raphgoog', 'David Aaron de Sola and Moses Jacob Raphall (translators), Eighteen Treatises from the Mishna (London: Sherwood, Gilbert and Piper, 1843)',
    'Eighteen of the sixty-three tractates of the Mishnah, the rabbis’ code of law collected about 200 CE, in English by two ministers of the Sephardi congregation in London. The translators say in their preface that the work began in a quarrel in the synagogue’s vestry over changes to the liturgy, in which those who opposed any change appealed to the Mishnah; they translated tractates that bear on worship, the Sabbath, festivals and fasts, marriage and damages and the like, and give notes from the commentators. A Harvard Divinity School copy, read by machine. Danby’s English Mishnah (1933) is still in copyright.',
    lib=('Eighteen Treatises from the Mishna (D. A. de Sola and M. J. Raphall, 1843)', 'ju', 'c. 200 CE (the Mishnah); translation 1843', 'ju', 'The rabbis and the Mishnah'),
    license=IA_LIC % '1843', cut_head=r'^\s*PREFACE\.\s*$', split=r'^[IVXL]+\.[ \t]+TREATISE[ \t]+[A-Z]{3,}[^\n]{0,12}$', trim_index=True, trim_back=True)

# ── Mishcat-ul-Masabih (Matthews, 1809–10) ──
def _books_by_head(t):
    """Book by book, from the running head 'BOOK IV.' that the scan reads on every page: a new book starts at the first head whose number is the next one (heads misread by the scan are passed over)."""
    pat = re.compile(r'^[ \t]*BOOK[ \t]+([IVXLC]+)[.,:;]*[ \t]*$', re.M); out = []; n = None
    for m in pat.finditer(t):
        v = roman(m.group(1))
        alt = roman(m.group(1)[:-1] + 'I') if m.group(1).endswith('L') and len(m.group(1)) > 1 else v        # 'VIL' is VII, 'XL' here is XI
        if n is None:
            if v in (1, 12): out.append((m.start(), v)); n = v                     # volume 1 starts at Book I, volume 2 at Book XII
        else:
            hit = next((x for x in (v, alt) if x in (n + 1, n + 2)), None)
            if hit: out.append((m.start(), hit)); n = hit
    heads = [(s, 'Book %s' % _rom(v)) for s, v in out]
    if not heads: return [['Text', t]]
    res = [['Dedication, preface and contents', t[:heads[0][0]]]] if heads[0][0] > 3000 and out[0][1] == 1 else []
    res += [[h, t[s: heads[k + 1][0] if k + 1 < len(heads) else len(t)]] for k, (s, h) in enumerate(heads)]
    return res


def _rom(n):
    out = ''
    for v, s in ((50, 'L'), (40, 'XL'), (10, 'X'), (9, 'IX'), (5, 'V'), (4, 'IV'), (1, 'I')):
        while n >= v: out += s; n -= v
    return out


SPECS['x-msb'] = G(['10219219bsb', '10219220bsb'], 'Muhammad ibn Abdallah al-Khatib al-Tabrizi, Mishkat al-Masabih, translated from the Arabic by Captain A. N. Matthews, Bengal Artillery, as Mishcat-ul-Masabih, or Collection of the Most Authentic Traditions regarding the Actions and Sayings of Muhammed, exhibiting the Origin of the Manners and Customs, the Civil, Religious and Military Policy of the Muslemans (Calcutta: T. Hubbard, at the Hindoostanee Press, 1809 and 1810), 2 volumes',
    'Mishkat al-Masabih is a large collection of hadith (reports of the sayings and actions of Muhammad and his companions), arranged by subject in books, which al-Tabrizi completed about 1337 CE from an earlier collection and from the six standard books. Matthews, an East India Company artillery officer, translated it for the English courts in India, dedicating it to the Company’s directors; in his preface he says that, as far as he could learn, no complete body of Muhammadan traditions had yet appeared in any European language. Volume 1 holds Books I to XI (faith, knowledge, purification, prayer, funerals, alms, the fast, the Qur’an, pilgrimage and more) and volume 2 the rest, with his footnotes, which the printed book also gives in the margin. The scan is from the Bavarian State Library at Munich and is rough: the print’s side-notes are read into the lines and many words are damaged. The last pages of the second volume (a list of names) are left out. ' + OLD,
    lib=('Mishcat-ul-Masabih: a collection of the traditions (hadith) of Muhammad, 2 volumes (A. N. Matthews, 1809–10)', 'is', 'c. 1337 CE (al-Tabrizi); translation 1809–10', 'isl', 'Hadith and the prophetic example'),
    license=IA_LIC % '1809 and 1810', cut_head=r'^\s*THIS attempt to facilitate', trim_index=True, trim_front=False, trim_back=True, split=None, sectioner=_books_by_head, labels=['Volume 1', 'Volume 2'])

# ── The Hedaya (Hamilton, 1791; Grady's second edition, 1870) ──
def _tc(s):
    small = {'of', 'or', 'the', 'and', 'in', 'on', 'for', 'to', 'by'}; w = s.lower().split()
    return ' '.join(x if (i and x in small) else x[:1].upper() + x[1:] for i, x in enumerate(w))


def _hedaya(t):
    marks = [('Dedication of the translation (Hamilton)', r'^DEDICATION OF THE ENGLISH TRANSLATION'), ('Advertisement to the second edition (Grady, 1870)', r'^ADVERTISEMENT TO THE SECOND EDITION'),
             ('Introductory address by the composers of the Persian version', r'^INTRODUCTORY ADDRESS'), ('Preliminary discourse by the translator', r'^PRELIMINARY DISCOURSE')]
    at = 0; pos = []
    for title, rx in marks:
        m = re.compile(rx, re.M).search(t, at)
        if m: pos.append((m.start(), title)); at = m.end()
        else: print('  heading not found:', title)
    body = re.compile(r'^COMMENTARY ON THE MUSSULMAN LAWS\.?[ \t]*$', re.M).search(t, at)
    bk = re.compile(r'^[ \t]*BOOK[ \t]+([IVXLCil1]+)[.,]?[ \t]*\n(?:[ \t]*\n)*[ \t]*((?:OF|OP|THE)\b[^\n]*(?:\n[ \t]*[A-Z][A-Z ,.’\'-]*\.)?)[ \t]*$', re.M)
    books = []; last = 0
    for m in bk.finditer(t, body.end() if body else at):
        tok = m.group(1).replace('i', 'I').replace('l', 'I').replace('1', 'I')
        cands = [x for x in (roman(tok), roman(tok[:-1] + 'I') if tok.endswith('L') and len(tok) > 1 else 0) if x > last]
        v = min(cands) if cands else last + 1
        if v != roman(tok): print('  Hedaya: heading %r read as Book %d' % (m.group(1), v))
        books.append((m.start(), 'Book %s · %s' % (_rom(v), _tc(re.sub(r'\s+', ' ', re.sub(r'\bOP\b', 'OF', m.group(2))).rstrip('.'))))); last = v
    nums = [h.split(' ')[1] for _, h in books]
    if 'XII' in nums and 'XI' not in nums and 'VI' in nums:                       # the heading of Book XI (troves) is lost in the scan: it starts at the first running head TROVES
        a, b = books[nums.index('VI')][0], books[nums.index('XII')][0]; m = re.compile(r'^[ \t]*TROVES[.,]?[ \t]*$', re.M).search(t, a, b)
        if m: books.insert(nums.index('XII'), (m.start(), 'Book XI · Of Lukata, or Troves (the heading is not read by the scan)'))
    print('  Hedaya: %d book headings found, the last is Book %d' % (len(books), last))
    allp = pos + books
    out = [[title, t[s: allp[k + 1][0] if k + 1 < len(allp) else len(t)]] for k, (s, title) in enumerate(allp)]
    return out


SPECS['x-hid'] = G('hedayaorguide029357mbp', 'Charles Hamilton (translator), The Hedaya, or Guide: A Commentary on the Mussulman Laws, translated by order of the Governor-General and Council of Bengal (London, 1791); the second edition, with a preface and index by Standish Grove Grady (London: W. H. Allen and Co., 1870), in the exact reproduction published by the Premier Book House, Lahore (second edition 1957, reprint 1963)',
    'The Hidaya (“the Guide”) is the Hanafi school’s standard book of law, composed in the twelfth century by al-Marghinani; Hamilton’s English (1791), made from a Persian version, was ordered by Warren Hastings’s government so that the courts of India could judge Muslims by their own law. This is not Hamilton’s original four-volume book but Grady’s one-volume second edition of 1870, in double columns: Grady cut the books made obsolete by the abolition of slavery (the fifth, on manumission, and the twelfth, on runaway slaves, among them, each with a note saying why) and kept the translators’ summary of them in the Preliminary Discourse; he added an index (left out here). The scan is of the 1957 Lahore reproduction, page for page, whose only new matter is the publisher’s note (left out). The OCR is of a small double-column print and has many errors. ' + OLD,
    lib=('The Hedaya, or Guide: a Commentary on the Mussulman Laws (Charles Hamilton, 1791; second edition by S. G. Grady, 1870)', 'is', '12th c. CE (al-Marghinani, d. 1197); translation 1791', 'isl', 'Hadith and the prophetic example'),
    license=IA_LIC % '1791 (this edition 1870)', cut_head=r'^\s*DEDICATION OF THE ENGLISH TRANSLATION', cut_tail=r'^\s*INDEX[,.*]?\s*$', drop=r'(?ms)^Contents\s*$.*?(?=^INTRODUCTORY ADDRESS)', trim_index=False, trim_front=False, trim_back=False, split=None, sectioner=_hedaya)

# ── Thirty Minor Upanishads (Narayanasvami Aiyar, 1914) ──
_MNU = ['Muktika', 'Sarvasara', 'Niralamba', 'Maitreya', 'Kaivalya', 'Amrtabindu', 'Atmabodha', 'Skanda', 'Paingala', 'Adhyatma', 'Subala', 'Tejobindu', 'Brahma', 'Vajrasuchi', 'Sariraka', 'Garbha', 'Tarasara', 'Narayana', 'Kalisantarana',
        'Bhikshuka', 'Naradaparivrajaka', 'Sandilya', 'Yogatattva', 'Dhyanabindu', 'Hamsa', 'Amrtanada', 'Varaha', 'Mandalabrahmana', 'Nadabindu', 'Yogakundali']
_MNU_RX = {'Muktika': r'MUKTIK', 'Sarvasara': r'SARVASARA', 'Niralamba': r'NIRALAMBA', 'Maitreya': r'MAITREYA', 'Kaivalya': r'KAIVALYA', 'Amrtabindu': r'AMRTA[A-Z]{0,2}BINDU', 'Atmabodha': r'ATMABODHA', 'Skanda': r'SKANDA',
           'Paingala': r'PAINGALA', 'Adhyatma': r'ADHYATMA', 'Subala': r'SUBALA', 'Tejobindu': r'TEJOBINDU', 'Brahma': r'BRAHMOPANISHAD|BRAHMA-UPANISHAD', 'Vajrasuchi': r'VAJRASUCHI|VAJRASUCI|VAJRAS[A-Z]{0,2}CHI', 'Sariraka': r'SARIRAKA',
           'Garbha': r'GARBHA', 'Tarasara': r'TARASARA', 'Narayana': r'NARAYANA', 'Kalisantarana': r'KALISANTARANA', 'Bhikshuka': r'BHIKSHUKA', 'Naradaparivrajaka': r'NARADAPARIVRAJAKA', 'Sandilya': r'[SY]ANDILYA|SANDILYA',
           'Yogatattva': r'YOGATATTVA', 'Dhyanabindu': r'DHYANABINDU', 'Hamsa': r'HAMSA', 'Amrtanada': r'AMRTANADA', 'Varaha': r'VARAHA', 'Mandalabrahmana': r'MANDALABRAHMANA', 'Nadabindu': r'NADABINDU', 'Yogakundali': r'YOGAKUNDAL'}
SPECS['x-mnu'] = G('thirtyminorupani00xxxxuoft', 'K. Narayanasvami Aiyar (translator), Thirty Minor Upanishads, including the Yoga Upanishads (Madras, 1914)',
    'Thirty of the later Upanishads, which the translator groups by their subject: fourteen of Vedanta (among them Muktika, Maitreya, Kaivalya, Atmabodha and Subala), two on the body (Sariraka and Garbha), three of mantra, two of renunciation (Bhikshuka and Naradaparivrajaka) and nine of yoga (Sandilya, Yogatattva, Dhyanabindu, Hamsa, Varaha, Nadabindu, Yogakundali and others), each assigned to its Veda. He writes in his foreword that this was the first time so many had been put into English in one collection; they are later than the principal Upanishads (the Library’s Müller volumes) and dates for them are uncertain. With his foreword and notes. A Madras print, read by machine: the Sanskrit lines in the margin and the Devanagari type come through as noise in places. ' + OLD + ' ' + SKT,
    lib=('Thirty Minor Upanishads (K. Narayanasvami Aiyar, 1914), including the Yoga Upanishads', 'in', 'c. 1st–15th c. CE (later than the principal Upanishads; dates uncertain)', 'upan', 'The Upanishads'),
    license=IA_LIC % '1914', cut_head=r'^\s*FOREWORD\s*$', cut_tail=r'^\s*INDEX OF PROPER NAMES', trim_index=False, trim_front=False, trim_back=False, split=None,
    sectioner=marks(*[('%s Upanishad' % n, (r'^[^\n]{0,6}(?:%s)[^\n]{0,24}$' if n == 'Brahma' else r'^[^\n]{0,6}(?:%s)[^\n]{0,24}PAN[A-Z]{3,7}[^\n]{0,6}$') % _MNU_RX[n]) for n in _MNU], lead='Foreword by the translator'))

# ── The Senkessar, volumes 1 and 2 (Budge, 1928) ──
def _syn_day(h):
    m = re.match(r'^([IVXL]+)[.,]?\s+([A-Z]+)$', h.strip())
    return '%s %d' % (m.group(2).title(), roman(m.group(1))) if m else h


SPECS['e-syn'] = G(['bookofsaintsofet0001unse', 'bookofsaintsofet0002unse'], 'E. A. Wallis Budge (translator), The Book of the Saints of the Ethiopian Church: A Translation of the Ethiopic Synaxarium (Mashafa Senkesar) made from the Manuscripts Oriental 660 and 661 in the British Museum, 4 volumes (Cambridge: at the University Press, 1928); volumes 1 and 2',
    'The Senkessar (the Ethiopic Synaxarium) is the Ethiopian Orthodox Church’s book of the saints and the feasts, with a reading for each day of the year: lives of martyrs, monks and bishops, the commemorations of the angels, the apostles and the prophets, in the order of the Ethiopian months. Budge’s preface says that the lack of a translation into any European language had long been felt by students of the literatures of Eastern Christianity; his introduction describes the manuscripts and the book’s history. This file holds volumes 1 and 2 of the four (the months of Maskaram, Tekemt and Khedar, then Tahsas, Ter and Yekatit, from September to March); volumes 3 and 4 are not in the Library. Each section is one day’s commemorations; the scan misreads some day headings, and those days run on under the one before. Only three hundred copies were printed. The scan is a theological school’s copy, read by machine, and the lines of Ethiopic (Ge‘ez) type in the introduction come through as noise.',
    lib=('Senkessar (the Book of the Saints of the Ethiopian Church; Budge, 1928), volumes 1 and 2', 'af', 'c. 14th c. CE (the Ethiopic version; older sources)', 'afr', 'Mali, Aksum'),
    license=IA_LIC % '1928', trim_index=True, trim_front=True, trim_back=True, labels=['Volume 1', 'Volume 2'],
    drop=r'^(?=[^\n]*(?:[A-Za-z0-9"’]{1,9}:[ \t]+){3,})[^\n]*$\n?',      # lines of Ethiopic (Ge‘ez) type that the scan read as Latin letters and colons
    split=r'^[IVXL]+[.,]?[ \t]+(?:MASKARAM|TEKEMT|TEQEMT|KHEDAR|HEDAR|TAHSAS|TAKHSAS|TER|TIR|YEKATIT|YAKATIT)[ \t]*$', retitle=_syn_day)

# ── Ibn Arabi, Wisdom of the Prophets (Khaja Khan, 1928): a synopsis ──
def _ibn_sections(t):
    rx = re.compile(r'^[ \t]*CHAPTER\b[^\n]{0,12}\n+[ \t]*(THE WISDOM OF[^\n]{3,90})$', re.M); hits = list(rx.finditer(t)); out = []
    if hits and t[:hits[0].start()].strip(): out.append(['Foreword, preface, life of the Shaykh and introduction', t[:hits[0].start()]])
    for k, m in enumerate(hits):
        w = re.sub(r'\s+', ' ', m.group(1)).strip(); head, par = (w.split('(', 1) + [''])[:2]
        out.append(['Chapter %d · %s%s' % (k + 1, _tc(head.strip()), (' (' + par) if par else ''), t[m.end(): hits[k + 1].start() if k + 1 < len(hits) else len(t)]])
    return out


SPECS['x-ibn'] = G('wisdomofprophets0000ibna', 'Khan Sahib Khaja Khan, B.A., Wisdom of the Prophets (in the light of Tasawwuf): Analytical Notes on each Fas of the Fusus al-Hikam of Ibn al-‘Arabi, with a foreword by Louis Massignon (Hyderabad-Deccan, 1928)',
    'This is a study of the Fusus al-Hikam (“the Bezels of Wisdom”, c. 1230), the book by which the Andalusian Sufi Ibn al-‘Arabi (1165–1240) is best known: in each of its chapters a prophet (Adam, Seth, Noah, Abraham and the rest) stands for one aspect of divine wisdom. Khaja Khan, a Hyderabad scholar, does not translate the Fusus whole: he gives a synopsis and analytical notes on each chapter (fas), with a preface, a life of the Shaykh al-Akbar (“the greatest master”), a glossary and Louis Massignon’s foreword. Read it as one scholar’s account of the Fusus, and set a translation of the whole beside it. The Library’s catalogue promised the Fusus; this is the nearest open English text, and the scan is read by machine.',
    lib=('Ibn Arabi, Fusus al-Hikam (a synopsis: Wisdom of the Prophets, Khaja Khan, 1928)', 'is', 'c. 1230 CE', 'isl', 'Rumi, Ibn'),
    license=IA_LIC % '1928', cut_head=r'^\s*FOREWORD\s*$', trim_index=True, trim_front=False, trim_back=True, split=None, sectioner=_ibn_sections)


# ═══════════════════════ Batch 2 (rows 11 to 20 of the plan) ═══════════════════════
# Row 13 (x-spk, the Spanda Karikas) and row 16 (x-kul, the Kularnava Tantra) are NOT built. The Archive's scan of the Spanda Karikas is the Kashmir Series' Sanskrit edition (vol. VI, 1913, edited by
# J. C. Chatterji, whose name the catalogue record gave as translator): Devanagari only, no English, and the OCR is Latin-letter noise. The Archive's "Arthur Avalon Kularnava Tantra Eng" is the English translation of
# M. P. Pandit, with his introduction and readings (Ganesh, 1965; this is the Motilal Banarsidass reprint, with its ISBN): a modern translation in copyright, though Avalon edited the Sanskrit text (1917).

# ── Saleeby on the Moros and Sulu (Manila, 1905 and 1908): typed, from Project Gutenberg; a United States government publication of the Philippine Insular Government ──
SPECS['a-mor'] = G('PG41770', 'Najeeb M. Saleeby, Studies in Moro History, Law, and Religion (Department of the Interior, Ethnological Survey Publications, vol. IV, part I; Manila: Bureau of Public Printing, 1905)',
    'Original studies and translations from Moro texts, made for the Philippine Ethnological Survey: the tarsilas (genealogies and histories) of Maguindanao, in eight manuscripts, with the mythology that the Moros tell, the Luwaran (the Maguindanao code of laws) with its Arabic marginal quotations, the two Sulu law codes, and two Sulu orations (for the feast of Ramadan and for Friday). The Moros are the Muslim peoples of the southern Philippines. The texts are given in the English of a physician-scholar in the service of the American colonial government, who says which manuscripts he used, and his notes and introductions are those of an outside observer of his time. ' + FIELD,
    lib=('Studies in Moro History, Law, and Religion (Najeeb M. Saleeby, 1905)', 'tb', 'recorded 1900–05 CE', 'fld', None),
    license=PG_LIC % '1905 by the Philippine Ethnological Survey', clean_scan=False, cut_head=r'^\s*Letter of Transmittal', cut_tail=r'^\s*End of the Project Gutenberg', trim_index=False, trim_front=False, trim_back=False,
    drop=r'(?ms)^CONTENTS\s*$.*?(?=^CHAPTER I\s*$)', split=r'^CHAPTER[ \t]+[IVXL]+[ \t]*$')
# HELD, not in the Library (19 November 2026): the maker said “keep any non religious history separate”, and Saleeby’s History of Sulu is mostly the political and geographical history of a sultanate (the religion in it
# is the coming of Islam and the Mohammedan church, in two chapters of eight). Its catalogue line was taken out again and nothing was built; the file is cached (tools/cache/gutenberg/41771.txt). It waits for a shelf of its own
# for general history, which is the project manager's to decide. To build it, add 'a-sul|The History of Sulu (Najeeb M. Saleeby, 1908)|<group>|recorded 1900s CE (the sultanate from the 15th c.)|fld' to the Library block.
SPECS['a-sul'] = G('PG41771', 'Najeeb M. Saleeby, The History of Sulu (Department of the Interior, Ethnological Survey Publications, vol. IV, part II; Manila: Bureau of Public Printing, 1908)',
    'The Sulu archipelago and its sultanate, by the same Philippine Ethnological Survey scholar: the islands and the town of Jolo, the Sulu genealogy (tarsila) from the Sulu writer’s own account, Sulu before Islam, the coming of Islam and of the first sultans, the Spanish expeditions, the Spanish and American period, with translated documents and treaties. Parts are Saleeby’s own history from the Sulu manuscripts and from Spanish records, in the voice of an outside observer in the American colonial service. ' + FIELD,
    lib=('The History of Sulu (Najeeb M. Saleeby, 1908)', 'tb', 'recorded 1900s CE (the sultanate from the 15th c.)', 'fld', None),
    license=PG_LIC % '1908 by the Philippine Ethnological Survey', clean_scan=False, cut_head=r'^\s*Department of the Interior', cut_tail=r'^\s*End of Project Gutenberg', trim_index=False, trim_front=False, trim_back=False,
    drop=r'(?ms)^CONTENTS\s*$.*?(?=^PREFACE\s*$)', split=r'^CHAPTER[ \t]+[IVXL]+[ \t]*$')

# ── The Siva Samhita (Vasu): a 2019 upload of the Sacred Books of the Hindus edition, Sanskrit and English ──
SPECS['x-ssm'] = G('YogaShivaSamhita_201903', 'Rai Bahadur Srisa Chandra Vasu (translator), The Siva Samhita, Sanskrit text with English translation and notes (Allahabad: the Panini Office, Bhuvaneswari Asrama, Bahadurganj; printed at the Indian Press; Sacred Books of the Hindus)',
    'A Sanskrit manual of yoga in five chapters, in Vasu’s English with the Sanskrit verses and his notes: the doctrine that knowledge alone is real, the body as a small universe, the postures and the breath, the mudras and the practice of the yogi, with the obstacles and the means. Its dating is uncertain (the Atlas gives about 1300–1500). The scan carries no year on its title page: Vasu’s translation appeared in the Panini Office series in the 1910s, and the printing is the original and not a modern reprint with new matter. The Sanskrit lines come through as noise in places, and so do some of the running heads. ' + OLD + ' ' + SKT,
    lib=('Shiva Samhita (trans. Srisa Chandra Vasu, Sacred Books of the Hindus)', 'in', 'c. 1300–1500 CE (dating uncertain)', 'yoga', 'Kabir and the Hatha'),
    license=IA_LIC % 'the 1910s (Panini Office; the scan has no year)', cut_head=r'^\s*SIVA SAM\s*HIT\s*A\.?\s*$', trim_index=True, trim_front=False, trim_back=True, split=None,
    sectioner=marks(('Chapter I · Existence one only', r'^\s*Chapter I\.\s*$'), ('Chapter II · The microcosm', r'^\s*Chapter II\.\s*$'), ('Chapter III', r'^\s*CHAPTER\s+(?:III|Til|HI|Ill|1II)\b'),
                    ('Chapter IV · Yoni-mudra: the sacred drink of the Kaulas', r'^\s*CHAPTER IV\.\s*$'), ('Chapter V', r'^\s*CHAPTER V\.\s*$')))

# ── The Gheranda Samhita (Vasu): a Delhi reprint of 1979 of the translation first published 1914–15 ──
_GSM = [('Lesson 1 · The training of the physical body: the six purifications', r'^\s*LESS[OR]N\s+FIRST\b'), ('Lesson 2 · The asanas, or postures', r'^\s*LESS[OR]N\s+SECOND\b'), ('Lesson 3 · On the mudras', r'^\s*LESS[OR]N\s+THIRD\b'),
        ('Lesson 4 · Pratyahara, or restraining the mind', r'^\s*(?:LESS[OR]N\s+F[O0]U[RB]TH|Fourth\s+Lesson)\b'), ('Lesson 5 · Pranayama, or restraint of breath', r'^\s*LESS[OR]N\s+FIFTH\b'), ('Lesson 6 · Dhyana-yoga', r'^\s*LESS[OR]N\s+SIXTH\b'), ('Lesson 7 · Samadhi', r'^\s*LESS[OR]N\s+SEVENTH\b')]
SPECS['x-gsm'] = G('Gheranda_Samhita', 'Rai Bahadur Srisa Chandra Vasu (translator), The Gheranda Samhita, translated into English (first published 1914–15; this scan is the reprint of 1979, Delhi: Sri Satguru Publications and Indian Books Centre, whose imprint pages and contents list are left out)',
    'A Sanskrit teaching of hatha yoga in seven lessons, put as the answers of the sage Gheranda to the questions of Chanda Kapali: the six purifications, the postures, the mudras, withdrawal of the mind, the breath, meditation and trance (samadhi). The Atlas gives its date as about 1650–1700. Vasu’s English is given with his notes; the Sanskrit verses, printed in Devanagari in the scan’s book, come through as noise in places. The reprint adds nothing to the translation. ' + OLD + ' ' + SKT,
    lib=('Gheranda Samhita (trans. Srisa Chandra Vasu, 1914–15)', 'in', 'c. 1650–1700 CE', 'yoga', 'Kabir and the Hatha'),
    license=IA_LIC % '1914–15 (reprinted 1979)', cut_head=r'^\s*THE GHERANDA SAMHITA\s*$', trim_index=True, trim_front=False, trim_back=True, split=None,
    sectioner=marks(*_GSM, lead='Salutation, and the question put to Gheranda'))

# ── Hymns to the Goddess (Arthur and Ellen Avalon, 1913) ──
_HTG_NAMES = ['Kalabhairava', 'Bhairavi', 'Tripurasundari', 'Bhubaneshvari', 'Ganga', 'Ambika', 'Adyakali', 'Waves of Bliss', 'Lakshmi', 'Tara', 'Yamuna', 'Mahishamardini', 'Chandika', 'Annapurna', 'Manikarnika', 'Sarasvati', 'Mahadevi', 'Narmmada', 'Jagadambika', 'Mahalakshmi', 'Triputa']


def _htg_sections(t):
    """a new section each time the running head changes to another goddess's name (the hymns' own heads, in capitals, on every page)"""
    import difflib
    names = {n.upper(): n for n in _HTG_NAMES}; cur = None; marks_ = []
    for m in re.finditer(r'^[ \t]*([A-Z’\' ]{4,26})[ \t]*$', t, re.M):
        w = re.sub(r'[’\' ]+$', '', m.group(1)).strip()
        if w.startswith('I') and w[1:] in names: w = w[1:]                                   # 'ICALABHAIRAVA'
        hit = difflib.get_close_matches(w, list(names), n=1, cutoff=0.82)
        if hit and hit[0] != cur: marks_.append((m.start(), names[hit[0]])); cur = hit[0]
    out = [['Preface and contents', t[:marks_[0][0]]]] if marks_ and t[:marks_[0][0]].strip() else []
    for k, (s, n) in enumerate(marks_): out.append(['Hymn to ' + n if n != 'Waves of Bliss' else 'Waves of Bliss (Anandalahari)', t[s: marks_[k + 1][0] if k + 1 < len(marks_) else len(t)]])
    return out


SPECS['x-htg'] = G('in.ernet.dli.2015.281515', 'Arthur and Ellen Avalon (translators), Hymns to the Goddess, translated from the Sanskrit (London: Luzac and Co., 1913), with Avalon’s preface; a Delhi library’s copy of the first edition',
    'Hymns of praise to the Goddess (Devi) in her forms (Kali, Bhairavi, Bhubaneshvari, Tripurasundari, Lakshmi, Tara, Durga, Chandika, Annapurna, Sarasvati and others), from the Tantras, the Puranas, the Mahabharata and the poems attributed to Shankaracharya (the Waves of Bliss), in the English of John Woodroffe (writing as Arthur Avalon) and his wife Ellen, with his preface on the Mother aspect of God and with notes. The scan’s Sanskrit lines come through as noise in places, and the hymns’ own running heads, in capitals, are what the sections follow. ' + OLD + ' ' + SKT,
    lib=('Hymns to the Goddess (Arthur and Ellen Avalon, 1913)', 'in', 'hymns of many centuries; translation 1913', 'yoga', 'Kabir and the Hatha'),
    license=IA_LIC % '1913', cut_head=r'^\s*PREFACE\s*$', trim_index=True, trim_front=False, trim_back=True, split=None, sectioner=_htg_sections)

# ── Principles of Tantra (Avalon, 1914 and 1916), in the third edition of 1960 ──
SPECS['x-pot'] = G('dli.bengal.10689.636', 'Arthur Avalon (Sir John Woodroffe), editor, Principles of Tantra: The Tantratattva of Sriyukta Siva Candra Vidyarnava Bhattacarya Mahodaya, with introductions by Arthur Avalon and by Barada Kanta Majumdar, parts I and II translated with the help of Jnanendralal Majumdar (London: Luzac and Co., 1914 and 1916); this scan is the third edition, the two parts in one volume (Madras: Ganesh and Co., 1960), whose publishers’ notes are left out',
    'A defence of the Tantra by an Indian pandit of his own time, Siva Candra Vidyarnava (the Tantratattva, first printed in Bengali, an exposition of the Tantra Shastra as the scripture of the Kali age, with its answers to those who attack it), in English with Avalon’s long preface and introduction: the worship, the Mantra, the images, the Gayatri, the body and the purifications, ritual and the passage of the soul. Avalon, a British judge in Calcutta, wrote it to give “an accurate statement of the facts” of a tradition that earlier English accounts had mostly condemned; the Tantratattva is an Indian apologist’s own presentation, and not a neutral account. The scan is the later Madras printing: its publishers’ notes of the 1950s and the pages of contents and imprint printed at the back are cut. ' + OLD,
    lib=('Principles of Tantra (Tantratattva; Arthur Avalon, 1914–16)', 'in', 'a Bengali work of the 1890s; translation 1914–16', 'yoga', 'Kabir and the Hatha'),
    license=IA_LIC % '1914 and 1916 (this printing 1960)', cut_tail=r'^\s*THE TANTRATATTVA OF\b', cut_tail_from=0.9,
    drop=r'^[ \t]*[1•*]?[ \t]*Publishers[’\']? Note:[^\n]*(?:\n(?![ \t]*\n)[^\n]*)*\n?|[ \t]*\(Publishers[’\']? Note:[^)]*\)', trim_index=False, trim_front=False, trim_back=False,
    split=r"^(?:CHAPTER[ \t]+[IVXL]+[ \t]*\n(?:[ \t]*\n)*(?:[A-Z][A-Z0-9 ,.’'()\-?:;*]*\n){1,3}|TANTRA TATTVA\n+[ \t]*PART[ \t]+I+[ \t]*)", retitle=lambda h: re.sub(r'[\s0-9*¹]+$', '', h).replace('(Contd.)', '(continued)').replace('( Conid .)', '(continued)'))

# ── Woodroffe's Shakti and Shakta (Luzac, 1918): essays and addresses ──
SPECS['x-skt'] = G('in.ernet.dli.2015.213495', 'Sir John Woodroffe (Arthur Avalon), Shakti and Shakta: Essays and Addresses on the Shakta Tantrashastra (London: Luzac and Co., 1918)',
    'Essays and lectures, most of them given before the Vivekananda Society at Calcutta, by the British judge and Sanskritist who edited and translated many Tantras: what the Tantras are, Shakti and the Shakta, Shiva-tattva and Chit-shakti, the origin of mantra, Kundalini Shakti. In his preface he says they are a first attempt to give “in a popular form an unbiassed, authenticated and intelligible account” of the Shakta Tantra Shastra, and that he writes from the Shakta’s point of view. It is an advocate’s account of his time and a source on how the Tantra was presented to English readers in 1918, and not a record of the whole tradition. ' + SCH,
    lib=('Shakti and Shakta (John Woodroffe, 1918)', 'sc', '1918 CE', 'sec', 'Kabir and the Hatha'),
    license=IA_LIC % '1918', cut_head=r'^\s*PSEFAOE\.\s*$|^\s*PREFACE\.\s*$', cut_tail=r'^\s*WORKS ON TANTBA SHASTRA', trim_index=True, trim_front=False, trim_back=True, split=None,
    sectioner=marks(('What are the Tantras and their significance? (with Tantra Shastra and Veda)', r'^\s*WHAT ARE THE TANTRAS\b'), ('Shakti and Shakta', r'^\s*SHAKTI AND SH.{1,3}KTA\b'), ('Chit-Shakti', r'^\s*CHIT-?SHAKTI'), ('Shivatattva', r'^\s*SHIVATATTVA\b'),
                    ('The origin of mantra', r'^\s*THE ORIGIN OF MANTRA'), ('Kundalini Shakti', r'^\s*KUNDALINI SHAKT'), ('Some conclusions', r'^\s*SOME CONCLUSIONS'), lead='Preface and contents'))

# ── Schrader on the Pancaratra and the Ahirbudhnya Samhita (Adyar, 1916) ──
SPECS['x-pcr'] = G('introtothepancar00shcruoft', 'F. Otto Schrader, Introduction to the Pancaratra and the Ahirbudhnya Samhita (Adyar Library series, Madras: the Adyar Library, 1916)',
    'A study of the Pancaratra, the Vaishnava system of worship and doctrine that has its own scriptures (the Samhitas), and of the Ahirbudhnya Samhita, one of them, with a survey of the literature of the Pancaratras and a synopsis of the Adyar Library’s Samhita manuscripts. Its writer, the Director of the Adyar Library, wrote it as a prisoner of war at Ahmednagar from materials he had gathered before the War, and the editor says so in the prefatory note. ' + SCH,
    lib=('Introduction to the Pancaratra and the Ahirbudhnya Samhita (F. Otto Schrader, 1916)', 'sc', '1916 CE', 'sec', 'The Gupta age'),
    license=IA_LIC % '1916', cut_head=r'^\s*PREFATORY NOTE\s*$', cut_tail=r'^\s*INDEXES\s*$', cut_tail_from=0.8, drop=r'(?ms)^LIST OF CONTENTS\s*$.*?(?=^\s*INTRODUCTION\s*$)', trim_index=False, trim_front=False, trim_back=False, split=None,
    sectioner=marks(('Introduction', r'^\s*INTRODUCTION\s*$'), ('I · The literature of the Pancaratras', r'^\s*I\.\s+THE LITERATURE OF THE P\S+\s*$'), ('II · The philosophy of the Pancaratras', r'^\s*II\.\s+THE PHILOSOPHY OF THE PANCARATRAS\s*$'),
                    ('III · The Ahirbudhnya Samhita', r'^\s*III\.\s+THE AHIRBUDHNYA SAMHITA\s*$'), ('Appendix I · The divine twenty-four-fold machinery', r'^\s*I\.\s+THE DIVINE TWENTY-FOUR-FOLD MACHINERY'), ('Appendix II · Four kinds of worship', r'^\s*II\.\s+FOUR KINDS OF WORSHIP'),
                    ('Appendix III · Description of the four Vyuhas', r'^\s*III\.\s+DESCRIPTION OF THE FO\S+ VYUHAS'), lead='Prefatory note'))


# ═══════════════════════ Batch 3 (rows 21 to 30 of the plan) ═══════════════════════
# Row 28 (e-tgn, the Targums on Genesis and Exodus) is NOT built: the plan's Archive item cu31924074296975 is the Cornell scan of Etheridge's second volume (Leviticus, Numbers and Deuteronomy, 1865), which is
# the Library's e-tgo already (texts_abrahamic.py uses the same item). The first volume (Genesis and Exodus, 1862) needs its own Archive item, to be found.

# ── The Culavamsa, parts I and II (Geiger, translated into English by Mrs. Rickmers; Pali Text Society, 1929 and 1930) ──
_CV_RX = r"^[ \t]*CHAPT[A-Z]{2,3}[ \t]+[IVXLCl1|]{1,9}[A-Za-z]{0,2}[ \t]*\n(?:[ \t]*\n)?[ \t]*[A-Z][^\n]{3,80}$"
SPECS['x-cv1'] = G('in.ernet.dli.2015.277108', 'Wilhelm Geiger (translator), Cūlavaṃsa, being the more recent part of the Mahāvaṃsa, part I, translated from the German into English by Mrs. C. Mabel Rickmers (née Duff) (Pali Text Society Translation Series no. 18; London: Humphrey Milford, Oxford University Press, 1929)',
    'The Cūlavaṃsa (“the lesser chronicle”) carries the Mahāvaṃsa, the chronicle of Ceylon that Buddhist monks wrote in Pali, from the fourth century CE down the line of the island’s kings: their wars, their buildings and gifts to the Sangha, the Tooth Relic and the monasteries of Anuradhapura and Polonnaruwa. Geiger’s own translation (from the German, Mrs. Rickmers’s English) has a foreword in which he thanks the Government of Ceylon for the journey that took him through the island before he began, an introduction on the sources and on dates, the chapters, and his notes. It is a monastic chronicle, written to record and praise the kings who served the religion: read it beside the island’s inscriptions and the other histories of Ceylon. The Library keeps it with the Mahāvaṃsa and the Dīpavaṃsa. Part II is the next entry. ' + OLD,
    lib=('Culavamsa, part 1: the more recent part of the Mahavamsa (Wilhelm Geiger, 1929)', 'bu', 'c. 4th–18th c. CE (a chronicle of Ceylon; translation 1929)', 'pali', 'The Pali Canon'),
    license=IA_LIC % '1929', cut_head=r'^\s*(?:FOREWORD|FOUEWOI\S+|FORE[A-Z]{3,6})\s*$', cut_tail=r'^\s*Additions and Corrections\s*$', trim_index=False, trim_front=False, trim_back=False, split=_CV_RX)
SPECS['x-cv2'] = G('in.ernet.dli.2015.277099', 'Wilhelm Geiger (translator), Cūlavaṃsa, being the more recent part of the Mahāvaṃsa, part II, translated from the German into English by Mrs. C. Mabel Rickmers (née Duff) (Pali Text Society Translation Series no. 20; London: Humphrey Milford, Oxford University Press, 1930)',
    'The second part of Geiger’s translation of the Cūlavaṃsa, the monks’ chronicle of the kings of Ceylon from the twelfth century, with his introduction on the chronology of Ceylon (he sets out the two earlier studies of it and the dates that follow from the chronicle), the chapters, his notes, a supplement and the additions and corrections that follow. It tells of the kings and the Sangha in their own record of events; the foreword to part I says what Geiger did and saw. Part I is the previous entry. ' + OLD,
    lib=('Culavamsa, part 2: the more recent part of the Mahavamsa (Wilhelm Geiger, 1930)', 'bu', 'c. 12th–18th c. CE (a chronicle of Ceylon; translation 1930)', 'pali', 'The Pali Canon'),
    license=IA_LIC % '1930', cut_head=r'^\s*INTRODUCTION\s*$', cut_tail=r'^\s*Additions and Corrections\s*$', trim_index=False, trim_front=False, trim_back=False, split=_CV_RX)

# ── The Path of Purity, part II: of concentration (Pe Maung Tin; Pali Text Society Translation Series no. 17) ──
SPECS['x-pp2'] = G('in.gov.ignca.9221', 'Pe Maung Tin (translator), The Path of Purity, being a translation of Buddhaghosa’s Visuddhimagga, part II: of concentration (Pali Text Society Translation Series no. 17; London: Humphrey Milford, Oxford University Press; printed by Billing and Sons, Guildford)',
    'The second part of the translation of the Visuddhimagga (the Path of Purification, c. 430 CE), Buddhaghosa’s great manual of the Theravada path: concentration (samadhi), the ten impediments, conduct, the forty subjects of meditation, the earth device and the other devices. Part I (virtue) is the Library’s `x-vsm`. The scan’s title page carries no year, and the Archive’s record gives 1931, which is the year of part III: this is number 17 of the Series, which comes before the Cūlavaṃsa part I (number 18, dated 1929 on its own title page), so it is not later than 1929. The scan is from a library of the Archaeological Survey of India and has its stamps at the front. ' + OLD + ' ' + SKT,
    lib=('The Path of Purity: Visuddhimagga, part 2 (Pe Maung Tin, 1929)', 'bu', 'c. 430 CE (translation 1929 or earlier)', 'pali', 'The Pali Canon'),
    license=IA_LIC % '1929 or earlier (the scan shows no year)', cut_head=r'^\s*III\.\s+Exposition of the Acceptance', trim_index=True, trim_front=False, trim_back=True, split='auto',
    retitle=lambda h: 'Chapter III · Exposition of the acceptance of the subjects of meditation' if h == 'Introduction' else h)

# ── Albo's Sefer ha-Ikkarim, Book Two (Husik, Jewish Publication Society, 1929) ──
SPECS['e-ikk'] = G('seferhaikkarimbo0000jose', 'Isaac Husik (editor and translator), Sefer ha-‘Ikkarim: Book of Principles by Joseph Albo, critically edited on the basis of manuscripts and old editions and provided with a translation and notes, volume 2: Book Two (The Schiff Library of Jewish Classics; Philadelphia: The Jewish Publication Society of America, 1929)',
    'Joseph Albo (about 1380–1444), a Spanish rabbi who took part in the disputation of Tortosa, wrote the Book of Principles (Sefer ha-Ikkarim, finished in 1425) to ask which beliefs are the roots of the Law of Moses, as against Maimonides’s thirteen. This file holds only volume 2 of Husik’s four, Book Two, in his English with his notes; the Hebrew that faced it on the printed page comes through the scan as noise, and the other three volumes are not in the Library. A library copy of a Jewish Publication Society classic, read by machine. ' + OLD,
    lib=('Sefer ha-Ikkarim (Joseph Albo, trans. Husik, Book Two, 1929)', 'ju', '1425 CE (translation 1929)', 'ju', 'Kabbalah and the Zohar'),
    license=IA_LIC % '1929', cut_head=r'^\s*BOOK TWO\s*$', trim_index=True, trim_front=False, trim_back=True, split=r'^[ \t]*CHAPTER[ \t]+[0-9]{1,2}[ \t]*$')

# ── The Bustan of Sa'di (Clarke, 1879) ──
SPECS['x-bos'] = G('bstnbyshaikh00sadiuoft', 'Shaikh Muslihu-d-din Sa‘di of Shiraz, The Bustan, translated for the first time into prose, with explanatory notes and index, by Captain H. Wilberforce Clarke, R.E. (London: Wm. H. Allen and Co., 1879)',
    'The Bustan (“the orchard”, 1257 CE), Sa‘di’s book of ethical verse in ten chapters: justice and the ruler, beneficence, love, humility, resignation, contentment, education, thanks, repentance and prayer, each lit by short tales. Clarke, an officer of the Royal Engineers who also translated Hafiz, gives it in prose with the couplets numbered, so that, as his preface says, each line of the translation answers to a line of the Persian, and adds notes. His index is left out. Sa‘di’s Gulistan is `x-gul`. ' + OLD,
    lib=('The Bustan of Sa’di (H. Wilberforce Clarke, 1879)', 'is', '1257 CE', 'isl', 'Rumi, Ibn'),
    license=IA_LIC % '1879', cut_head=r'^\s*PREFACE BY THE TRANSLATOR\.', cut_tail=r'^\s*INDEX\.?\s*$', drop=r'(?ms)^CONTENTS\.\s*$.*?(?=^\s*CHAPTER\s+[I1l]\.?\s*$)', trim_index=False, trim_front=False, trim_back=True, split='auto',
    retitle=lambda h: 'Preface by the translator' if h == 'Introduction' else h)

# ── The Satyarth Prakash (Durga Prasad's English, Lahore, 1908) ──
SPECS['x-sat'] = G('satyarthprakashl00dayauoft', 'Swami Dayananda Sarasvati, Satyarth Prakash (“the Light of Truth”), English translation, being a guide to Vedic hermeneutics, by Durga Prasad, preacher of Vedic religion and editor of the Harbinger, with an autobiography of the Swami (Lahore: Virjanand Press, first edition, 1908)',
    'The founding book of the Arya Samaj, first written in Hindi in 1875 (revised 1884), in fourteen chapters: the teaching of the Vedas as the one revealed truth, education, marriage, the duties of rulers, and in its last chapters the Swami’s argument against idol-worship, the Puranas and the other religions of India (Jain, Buddhist, Christian and Muslim); the Arya Samaj holds it as a guide to what the Vedas teach, and the communities it criticises have their own replies. It is the author’s argument, not a neutral survey: read it beside their accounts. This 1908 edition (the Library’s catalogue gave its translator as Chiranjiva Bharadwaja; the title page names Durga Prasad) begins with the Swami’s autobiography and the translator’s introduction. The scan is rough, and the Sanskrit and Hindi quotations (in Devanagari type, which the scan reads very badly) are left out of this text; the English stays. ' + OLD,
    lib=('Satyarth Prakash (Dayananda Sarasvati, trans. Durga Prasad, 1908)', 'in', '1875 CE (revised 1884; translation 1908)', 'ved', 'Kabir and the Hatha'),
    license=IA_LIC % '1908', cut_head=r'^\s*AUTOBIOGRAPHY\s*$|^\s*INTRODUCTION\s*$', drop=r'[\u0900-\u097F]+', trim_index=True, trim_front=False, trim_back=True, split=r'^[ \t]*CHAPTER[ \t]+[IVXL]+\.?[ \t]*$', skip=r'^Introduction$')

# ── Rammohun Roy's English Works (Ghose, 1901): volume 1 and the sati debates of volume 2 ──
def _rmr_sections(t):
    if not re.search(r'THE RESOLUTION OF ALL THE VEDS', t): return [['The debates on the burning of widows: two Conferences and the Abstract of the arguments', t]]
    return marks(('Translation of an abridgment of the Vedant', r'^\s*THE RESOLUTION OF ALL THE VEDS'), ('Translation of the Moonduk Upanishad (Atharva Veda)', r'^\s*MOONDUK-OPUNISHUD'), ('Translation of the Cena Upanishad (Sama Veda)', r'^\s*CENA UPANISHAD'),
                 ('Translation of the Kuth Upanishad (Yajur Veda)', r'^\s*KUTH-OPUNISHUD'), ('Translation of the Ishopanishad (Yajur Veda)', r'^\s*ISHOPANISHAD'), ('A Sanskrit tract on the worship of the Supreme Being (the Gayutree)', r'^\s*TRANSLATION INTO ENGLISH'),
                 ('A defence of Hindoo theism', r'^\s*A DEFENCE\s*$'), ('A second defence of the monotheistical system of the Veds', r'^\s*SECOND DEFENCE\b'), ('An apology for the pursuit of final beatitude, independently of Brahmunical observances', r'^\s*AN APOLOGY\s*$'),
                 ('The universal religion', r'^\s*THE UNIVERSAL RELIGION'), ('The Brahmunical Magazine, or the Missionary and the Brahmun', r'^\s*BRAHMUNICAL MAGAZINE\s*$'), ('Answer of a Hindoo to the question why he frequents a Unitarian place of worship', r'^\s*ANSWER OF A HINDOO'),
                 lead='Introduction by the editor, and the contents')(t)


SPECS['x-rmr'] = G(['theenglishworks01rammuoft', 'theenglishworks02rammuoft'], 'Jogendra Chunder Ghose (editor), The English Works of Raja Rammohun Roy, volumes 1 and 2 (Calcutta: Srikanta Roy, at the Bengal Press, 1901): the whole of volume 1 and, from volume 2, the debates on the burning of widows',
    'Rammohun Roy (1772–1833), the Bengali reformer who is counted as a founder of the Brahmo Samaj, wrote his English works to argue for the one God of the Vedas and against idol-worship, to answer Christian missionaries (“the Missionary and the Brahmun”) and to argue against the burning of widows. Volume 1, in full: his translations of the Vedanta abridgment and of the Mundaka, Kena, Katha and Isha Upanishads, the defences of Hindu theism, the Universal Religion and the Brahmunical Magazine, with Ghose’s long introduction. From volume 2, only the two Conferences between an advocate for and an opponent of the burning of widows and the Abstract of the arguments, “considered as a religious rite”: the rest of that volume (the judicial and revenue systems of India, the press regulation, English education, the law of inheritance and his speeches) is not about religion and is left out. ' + OLD,
    lib=('The English Works of Raja Rammohun Roy: Vedanta, Upanishads, defences of Hindu theism and the debates on sati (J. C. Ghose, 1901)', 'in', '1815–33 CE (edition 1901)', 'bhakti', 'Kabir and the Hatha'),
    license=IA_LIC % '1901', trim_index=True, trim_front=False, trim_back=True, split=None, sectioner=_rmr_sections, labels=['Volume 1', 'Volume 2'],
    slices=[None, (r'^\s*TRANSLATION OF A CONFERENCE\s+BETWEEN AN ADVOCATE', r'^\s*BRIEF REMARKS\s+REGARDING\s+MODERN\s+ENCROACHMENT')])

# ── Pseudo-Philo, The Biblical Antiquities (M. R. James, SPCK, 1917) ──
SPECS['p-psp'] = G('cu31924063410827', 'M. R. James (translator), The Biblical Antiquities of Philo, now first translated from the old Latin version (Translations of Early Documents, series I: Palestinian Jewish Texts (pre-Rabbinic); London: Society for Promoting Christian Knowledge, and New York: Macmillan, 1917)',
    'A retelling of the Bible from Adam to the death of Saul, in the style of the Jewish writing of the first century CE, which survives only in Latin and was long copied with the works of Philo of Alexandria, though it is not his (hence “Pseudo-Philo”). It adds much to the biblical story: songs and prayers, speeches, and tales not found in Scripture. James’s version, the first English one, has an introduction (the history of the book, its date, language and contents) and notes. A Cornell scan. ' + OLD,
    lib=('Pseudo-Philo, Biblical Antiquities (M. R. James, 1917)', 'ps', 'c. 70–100 CE', 'pseud', 'After the Temple'),
    license=IA_LIC % '1917', cut_head=r'^\s*CONTENTS\s*$', cut_tail=r'^\s*INDEX\s*$', cut_tail_from=0.9, trim_index=False, trim_front=False, trim_back=False, split=None,
    sectioner=marks(('The Biblical Antiquities, or the History of Philo from the beginning of the world to King David: the translation, with James’s notes', r'^\s*THE BIBLICAL\s*\n\s*ANTIQUITIES OF PHILO\s*\n\s*OR THE HISTORY OF PHILO'),
                    ('Appendix I', r'^\s*APPENDIX I\s*$'), ('Appendix II', r'^\s*APPENDIX II\s*$'), lead='Introduction by the translator, with the list of contents'))

# ── The History of the Patriarchs of Alexandria, part III: Agathon to Michael I (Evetts, 1910) ──
def _pat_sections(t):
    import build_texts_util as U
    return U.split_headings(english_lines(t), r'^[ \t]*CHAPTER[ \t]+[IVXL1]+[ \t]*\n+(?:[ \t]*[A-Z][^\n]{3,70}\n){1,2}')


SPECS['e-pat'] = G('historyofpatriar0000beve', 'B. Evetts (editor and translator), History of the Patriarchs of the Coptic Church of Alexandria, III: Agathon to Michael I (766), Arabic text edited, translated and annotated (Patrologia Orientalis, vol. V, fasc. 1; Paris: Firmin-Didot, 1910)',
    'The Arabic History of the Patriarchs of Alexandria, attributed to Severus ibn al-Muqaffa‘ and his continuators, is the Coptic Church’s own record of its bishops of Alexandria from Saint Mark, with the lives of the patriarchs, their quarrels and persecutions, and the life of the monasteries under Byzantine and then Arab rule. This is part III only (the patriarchs from Agathon, in the seventh century, to Michael I, who died in 766): the Library does not hold parts I, II and IV. Evetts prints the Arabic and gives the English with notes; the Arabic pages come through the scan as noise, so the lines that are not English words are left out, and what is kept is the English translation and notes (the variant readings of the Arabic manuscripts go with the Arabic). The scan is from a Syriac collection’s library, read by machine. ' + OLD,
    lib=('History of the Patriarchs of the Coptic Church of Alexandria, III: Agathon to Michael I (B. Evetts, 1910)', 'ec', 'compiled c. 1080–1100 CE; part III covers 661–766 CE', 'ec', 'The desert fathers'),
    license=IA_LIC % '1910', cut_head=r'^\s*CHAPTER\s+XV\s*$', trim_index=True, trim_front=False, trim_back=True, split=None, sectioner=_pat_sections)


# ═══════════════════════ Batch 4 (rows 31 to 40 of the plan) ═══════════════════════
# Row 32 (x-uva, the Uvasagadasao) is NOT built: the Archive's scan is P. L. Vaidya’s student edition of the Prakrit text (Poona, Fergusson College), with an English introduction and notes but no English translation, and
# its introduction says it was prepared for the university course of 1931 and 1932, so it is not before 1930; the plan’s alternative, Hoernle’s edition of 1885 (Prakrit with an English translation, Bibliotheca Indica), needs its own Archive item.

# ── The Antagada-dasao and the Anuttarovavaiya-dasao (Barnett, Royal Asiatic Society, 1907) ──
SPECS['x-ant'] = G('antagadadasaoanu00royauoft', 'L. D. Barnett (translator), The Antagada-dasao and Anuttarovavaiya-dasao, translated from the Prakrit (Oriental Translation Fund, New Series, vol. XVII; London: the Royal Asiatic Society, 1907)',
    'Two short books of the Jain canon of the Svetambaras, the eighth and the ninth of the twelve Angas: the Antagada-dasao (“the ten of those who made an end”), the lives of the monks and nuns who ended the cycle of rebirth, among them the disciples of Krishna’s time and of Mahavira’s, and the Anuttarovavaiya-dasao (“the ten born in the highest heavens”), with Barnett’s introduction on the history of the Jain church (which he says Mahavira created or reconstructed in the fifth century BCE) and his notes. ' + OLD,
    lib=('The Antagada-dasao and Anuttarovavaiya-dasao (L. D. Barnett, 1907)', 'ja', 'c. 3rd c. BCE – 5th c. CE (the Jain Anga canon; translation 1907)', 'jain', 'Mahavira and the Jain way'),
    license=IA_LIC % '1907', cut_head=r'^\s*INTRODUCTION\.', trim_index=True, trim_front=False, trim_back=True, split=r'^(?:ANTAGADA-DASAO\.|ANUTTAROVAVAIYA-DASAO\.|THE[ \t]+[A-Z]+[ \t]+(?:CHAPTER|VARGA|BOOK|LESSON)\.?)[ \t]*$')

# ── Among the Natives of the Loyalty Group (Emma Hadfield, 1920) ──
SPECS['a-loy'] = G('amongnativesoflo00hadfuoft', 'Emma Hadfield, Among the Natives of the Loyalty Group (London: Macmillan and Co., 1920)',
    'A missionary’s wife’s account of Lifu, Uvea and Mare, the Loyalty Islands off New Caledonia, where her husband worked for the London Missionary Society: the people and their customs, their beliefs before and after the missions (the spirits, the dead, the sorcerers and the chiefs), the coming of Christianity and the French, and everyday life on the islands. The Loyalty Islanders are today Kanak peoples. It is an outsider’s record from the mission house, of its time, and people of the islands have their own accounts. ' + FIELD,
    lib=('Among the Natives of the Loyalty Group (Emma Hadfield, 1920)', 'tb', 'recorded 1900s–1910s CE', 'fld', None),
    license=IA_LIC % '1920', cut_head=r'^\s*PREFACE\s*$', drop=r'(?ms)^CONTENTS\s*$.*?(?=^\s*CHAPTER\s+I\s*\n\s*\n\s*INT[KR]ODUCTION)', trim_index=True, trim_front=False, trim_back=True, split='auto')

# ── Legge's verse version of the She King (Trübner, 1876) ──
def _she_sections(t):
    rx = re.compile(r'^[ \t]*(PROLEGOMENA,|PART[ \t]+[IVXL]+[.,]?[ \t]*[—–-]+[^\n]{3,60}|BOOK[ \t]+[IVXL]+[.,]?[^\n]{0,30}|CHAPTER[ \t]+[IVX]+[.,]?[ \t]*\*?)$', re.M)
    hits = list(rx.finditer(t)); out = []; part = None; prol = False
    if hits and t[:hits[0].start()].strip(): out.append(['Preface by the translator', t[:hits[0].start()]])
    for k, m in enumerate(hits):
        h = re.sub(r'\s+', ' ', m.group(1)).strip(' .,*'); body = t[m.end(): hits[k + 1].start() if k + 1 < len(hits) else len(t)]
        if h.startswith('PROLEGOMENA'): prol = True; part = None; title = 'Prolegomena'
        elif h.startswith('PART'):
            prol = False; sub = re.split(r'[—–-]+', h, 1)[-1].strip().capitalize(); part = sub; title = 'Part: ' + sub
        elif h.startswith('CHAPTER'): title = 'Prolegomena · ' + h.title() if prol else h.title()
        else: title = ((part + ' · ') if part else '') + h.title()
        out.append([title, body])
    return out


SPECS['x-she'] = G('shekingorbookofa0000unse', 'James Legge, The She King; or, The Book of Ancient Poetry, translated in English verse, with essays and notes (London: Trübner and Co., 1876)',
    'The Shi Jing (She King, the Classic of Poetry), the Chinese collection of 305 songs and hymns of about 1000 to 600 BCE that is one of the Five Classics of the Confucian canon: songs of the states (courtship, work, war, lament), the minor and greater odes of the royal court, and the temple and altar odes that were sung in the worship of ancestors and of Heaven. This is Legge’s metrical version of 1876, a verse rendering of the whole book made with the help of his nephews and friends, with his preface and the essays (Prolegomena) and notes; his prose translation of 1871 (the Chinese Classics, volume 4) is a different book. The Library’s `x-doc` holds the religious odes in prose. The scan, from a university library’s gift, is read by machine, and the Chinese characters are left out. ' + OLD,
    lib=('The She King, or Book of Ancient Poetry, in English verse (James Legge, 1876)', 'ch', 'c. 1000–600 BCE (translation 1876)', 'chin', 'The Zhou'),
    license=IA_LIC % '1876', cut_head=r'^\s*PREFA[OC]E[,.]', drop=r'(?ms)^CONTENTS\.\s*$.*?(?=^PROLEGOMENA,\s*$)', trim_index=True, trim_front=False, trim_back=True, split=None, sectioner=_she_sections)

# ── The Ch'un Ts'ew with the Tso Chuen (Legge, 1872), in the Hong Kong University Press reissue of 1960 ──
_CTS = [('Book I · Duke Yin', r'^\s*BOOK\s+\S+\s+DUKE\s+YIN\.?\s*$'), ('Book II · Duke Hwan', r'^\s*BOOK\s+\S+\s+DUKE\s+HWAN\.?\s*$'), ('Book III · Duke Chwang', r'^\s*BOOK\s+\S+\s+DUKE\s+CHWANG\.?\s*$'), ('Book IV · Duke Min', r'^\s*BOOK\s+\S+\s+DUKE\s+MIN\.?\s*$'),
        ('Book V · Duke He', r'^\s*BOOK\s+\S+\s+DUKE\s+HE\.?\s*$'), ('Book VI · Duke Wan', r'^\s*BOOK\s+\S+\s+DUKE\s+WAN\.?\s*$'), ('Book VII · Duke Seuen', r'^\s*BOOK\s+\S+\s+DUKE\s+SEU\S+\.?\s*$'), ('Book VIII · Duke Ch‘ing', r'^\s*BOOK\s+\S+\s+DUKE\s+CH\S{1,3}ING\.?\s*$'),
        ('Book IX · Duke Seang', r'^\s*BOOK\s+\S+\s+DUKE\s+SEANG\.?\s*$'), ('Book X · Duke Ch‘aou', r'^\s*BOOK\s+\S+\s+DUKE\s+CH\S{1,3}AOU\.?\s*$'), ('Book XI · Duke Ting', r'^\s*BOOK\s+\S+\s+DUKE\s+TING\.?\s*$'), ('Book XII · Duke Gae', r'^\s*BOOK\s+\S+\s+DUKE\s+GAE\.?\s*$')]
SPECS['x-cts'] = G('james-legge-the-chinese-classics-the-chun-tsew-with-the-tso-chuen-.-vol.-5-hong-', 'James Legge, The Chinese Classics, with a translation, critical and exegetical notes, prolegomena and copious indexes, vol. V: The Ch‘un Ts‘ew, with the Tso Chuen (Hong Kong: printed at the Lane, Crawford; London: Trübner, 1872); this scan is the Hong Kong University Press reissue of 1960, whose front matter (a bibliographical note and a concordance table, new in 1960) is left out',
    'The Ch‘un Ts‘ew (“Spring and Autumn”), the terse annals of the state of Lu from 722 to 481 BCE that Chinese tradition ascribes to Confucius, with the Tso Chuen (Zuo zhuan), the long narrative commentary that tells the stories behind each entry: the wars and covenants of the states, their ceremonies, divinations, sacrifices and omens. It is one of the Five Classics of the Confucian canon, and a main record of the religion of the Spring and Autumn period. Legge’s volume has his preface, the Prolegomena (the nature and value of the Annals and of the commentary, the chronology, the Chinese text’s history) and the translation by reign of each duke, book by book. The Chinese text printed above the translation in the original is not in this file. The 1960 reissue is a reprint with the author’s own list of corrections made in the text; only Legge’s own matter is kept. ' + OLD,
    lib=('The Ch’un Ts’ew with the Tso Chuen (James Legge, 1872)', 'ch', '722–481 BCE (the Annals); the Tso Chuen c. 4th c. BCE; translation 1872', 'chin', 'Confucius'),
    license=IA_LIC % '1872 (this scan is the 1960 Hong Kong University Press reissue)', cut_head=r'^\s*PREFACE\.\s*$', trim_index=True, trim_front=False, trim_back=True, split=None,
    sectioner=marks(('Prolegomena', r'^\s*PROLEGOMENA\.\s*$'), *_CTS, lead='Preface by the translator'))

# ── Budge's Coptic Apocrypha (British Museum, 1913) ──
SPECS['e-cap'] = G('copticapocryphai00budguoft', 'E. A. Wallis Budge (editor and translator), Coptic Apocrypha in the Dialect of Upper Egypt (London: printed by order of the Trustees of the British Museum, 1913)',
    'Texts of the Coptic church from manuscripts in the British Museum, edited in Coptic (the dialect of Upper Egypt) with Budge’s English: the Book of the Resurrection of Jesus Christ, the Repose of Saint John the Evangelist, the Mysteries of Saint John the Apostle, the Life and Conversation of Pisentios, an encomium on Saint John the Baptist and the Instructions of Apa Pachomius, with his preface and introduction and descriptions of the manuscripts. “Apocryphal” here means outside the canon: they were read in the Coptic church, and are not its doctrine. The Coptic type and the 58 plates are not in this file. ' + OLD,
    lib=('Coptic Apocrypha in the Dialect of Upper Egypt (E. A. Wallis Budge, 1913)', 'ec', 'Coptic texts of late antiquity and after; translation 1913', 'ec', 'The desert fathers'),
    license=IA_LIC % '1913', cut_head=r'^\s*PREFACE\s*$', trim_index=True, trim_front=False, trim_back=True, split='auto')

# ── Muir's Life of Mahomet, the abridged edition ──
SPECS['x-lmh'] = G('lifemahometfrom00muirgoog', 'Sir William Muir, The Life of Mahomet from Original Sources, new edition abridged from the first edition in four volumes (1861), with an index (London: Smith, Elder and Co.; the Archive’s record dates this printing 1887)',
    'A Scottish administrator and orientalist’s life of the Prophet Muhammad, drawn from the early Arabic sources (the biographies and the traditions) and read critically: the birth and youth, the call and the first revelations, the years at Mecca, the flight to Medina (the Hijra), the wars and the treaties and the death. This is Muir’s own abridgment: the chapters on pre-Islamic Arabia and most of the notes and references are cut, and the chapter on the Qur’an and tradition is kept as an appendix. Muir was a Christian missionary society’s supporter and an Indian official, and the book carries his judgments of the Prophet and of Islam, which Muslim and other scholars have disputed; the Library holds it as a landmark of the nineteenth-century study of Muhammad’s life and not as the Muslim account. ' + SCH,
    lib=('The Life of Mahomet from Original Sources (Sir William Muir, abridged edition)', 'sc', 'recorded 1858–61 CE; abridged edition 1887', 'sec', 'The Qur'),
    license=IA_LIC % '1861 (this abridged edition 1887)', cut_head=r'^\s*PREFACE\.\s*$', trim_index=True, trim_front=False, trim_back=True, split='auto')

# ── Rockhill's Udanavarga and Life of the Buddha (Trübner's Oriental Series, 1883 and 1884) ──
SPECS['x-udv'] = G('udnavargacolle00bkah', 'W. Woodville Rockhill (translator), Udânavarga: A Collection of Verses from the Buddhist Canon, compiled by Dharmatrâta, being the Northern Buddhist version of Dhammapada, translated from the Tibetan of the Bkah-hgyur, with notes and extracts from the Commentary (Trübner’s Oriental Series; London: Trübner and Co., 1883)',
    'The Udanavarga, a collection of verses of the Buddha arranged by subject in thirty-three chapters (impermanence, desire, anger, the monk, the Brahmin and others), compiled in Sanskrit, probably in the first centuries CE, and known in Tibetan; the Pali Dhammapada is its nearest parallel, and many verses are the same. Rockhill, an American diplomat and Tibetologist, translated the Tibetan version (the Bkah-hgyur), with notes from the Tibetan commentary and a preface. The scan has the Princeton Theological Seminary stamp, and the publisher’s advertisements and blurbs at its front are left out. ' + OLD,
    lib=('Udanavarga (W. W. Rockhill, 1883)', 'bu', 'c. 3rd c. BCE – 1st c. CE (the Sanskrit); Tibetan version 9th c.; translation 1883', 'maha', 'The Buddha: the first'),
    license=IA_LIC % '1883', cut_head=r'^\s*UDANAVARGA:\s*$', cut_tail=r'^\s*INDEX\.?\s*$', cut_tail_from=0.95, trim_index=False, trim_front=False, trim_back=False, split=r'^[ \t]*(?:INTRODUCTION|CHAPTER[ \t]+[IVXLC]+\.?|APPENDIX\.?)[ \t]*$')
SPECS['x-rlb'] = G('thelifeofbuddha00rockuoft', 'W. Woodville Rockhill (translator), The Life of the Buddha and the Early History of his Order, derived from Tibetan works in the Bkah-hgyur and Bstan-hgyur, followed by notices on the Early History of Tibet and Khoten (Trübner’s Oriental Series; London: Trübner and Co., 1884)',
    'The Tibetan life of the Buddha, from his birth to his death and the councils that followed, put together from the Dulva (the Tibetan Vinaya, the monastic code) and other works in the Tibetan canon (the Bkah-hgyur and the Bstan-hgyur), with Rockhill’s notes and, in the second part, his notices on the early history of Tibet and of Khoten (the Buddhist kingdom of the Tarim basin). It is the Tibetan tradition’s own account of the Buddha’s life, to be set beside the Pali, Sanskrit and Chinese lives. ' + OLD,
    lib=('The Life of the Buddha and the Early History of his Order (W. W. Rockhill, 1884)', 'bu', 'c. 5th c. BCE (the life); Tibetan compilation; translation 1884', 'maha', 'The Buddha: the first'),
    license=IA_LIC % '1884', cut_head=r'^\s*THE LIFE OF THE BUDDHA AND THE EARLY', drop=r'(?ms)^CONTENTS OF VOL\. I\.\s*$.*?(?=^\s*INTRODUCTION\.\s*$)', cut_tail=r'^\s*INDEX\.?\s*$', cut_tail_from=0.95, trim_index=False, trim_front=False, trim_back=False, split=None)

# ── The Katha Sarit Sagara, volumes 1 and 2 (Tawney, Calcutta, 1880 and 1884) ──
SPECS['t-ksg'] = G(['kathsaritsga01somauoft', 'kathsaritsga02somauoft'], 'C. H. Tawney (translator), The Katha Sarit Sagara, or Ocean of the Streams of Story, translated from the original Sanskrit, volumes 1 and 2 (Calcutta: printed by J. W. Thomas at the Baptist Mission Press, 1880 and 1884)',
    'The Kathasaritsagara (“the ocean of the streams of story”) of Somadeva, a Sanskrit collection of tales written in Kashmir in the eleventh century, framed by the story of Naravahanadatta and the Vidyadharas, with stories within stories of kings, ascetics, merchants, gods and demons, and the tales of the Vetala (the vampire). It is a collection of tales of Hindu and Buddhist and Jain flavour and not a scripture; the Library keeps it on its folk-tale shelf as a source of story and belief that the tradition drew on, and reads the tales as what a court poet in medieval India set down. Tawney’s two volumes (1880 and 1884) hold the whole work, eighteen books, with his notes. ' + OLD + ' Read it as a source on what was told.',
    lib=('The Katha Sarit Sagara, or Ocean of the Streams of Story, volumes 1–2 (C. H. Tawney, 1880–84)', 'ta', 'c. 1063–81 CE (Somadeva); translation 1880–84', 'ftl', None),
    license=IA_LIC % '1880 and 1884', cut_head=r'^\s*TRANSLATION\s*$', cut_tail=r'^\s*CORRIGENDA AND ADDENDA\s*$', cut_tail_from=0.5, trim_index=False, trim_front=False, trim_back=False, split=r'^[ \t]*BOOK[ \t]+[IVXLC]+[.,]?[ \t]*$|^[ \t]*CHAPTER[ \t]+[IVXLC]+[.,]?[ \t]*$', labels=['Volume 1', 'Volume 2'])
