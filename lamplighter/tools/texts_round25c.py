"""Specs for round 25c of the collection (23 November 2026): the Universalist texts, with the Unitarian side and the doctrine of the final restoration of all as it was argued outside the
Universalist churches. Listed on the maker's words "add more universalist texts to the list" (COLLECTION_NEXT.csv, round 25c; COLLECTION_PLAN.md section 11) and fetched on the maker's
"Fetch now" the same day: one Internet Archive scan each (the OCR text, one request at a time, six seconds apart), and Cooke's history from Project Gutenberg. Merged into
texts_archive.SPECS (see the end of that file); built with the offline driver (python3 -I drv25c.py ids) or python3 build_texts.py --only=ids.

The Universalist and Unitarian books are the Library's shelf "Modern and revival traditions" (group mo, route mod) and are read on the Path at the station where the other nineteenth-century
movements of the Protestant churches are (as Ballou's Treatise on Atonement and Channing's Unitarian Christianity already are); the histories and studies are the Scholarship shelf (group sc),
kept on that station's shelf. Left out on purpose: the Unitarian pioneers whose scans sat apart from this list (Lindsey, Priestley's Early Opinions, Parker's Discourse of Matters Pertaining to Religion), and
Chauncy's Salvation for All Men (1782), which was not found open.
"""
import re
import build_texts_util as U
from texts_round9 import S
from texts_round10 import G
from texts_round8 import MOV

SPECS = {}
NEW = 'Bahá’í, Theosophy'      # the Path station of the nineteenth-century movements of the Protestant churches
fix = lambda i, **kw: SPECS[i].update(kw)


def numfix(h):
    """a heading whose Roman numeral the OCR misread (II read as IL, III as IIL, or 1, 11 and 111 for I, II and III)"""
    h = re.sub(r'\b(CHAPTER|BOOK|PART|LETTER)\s+(1{1,3})\b', lambda m: m.group(1) + ' ' + 'I' * len(m.group(2)), h)
    return re.sub(r'\bIIL\b', 'III', re.sub(r'\bIL\b', 'II', h))


ROMAN = {'I': 1, 'V': 5, 'X': 10, 'L': 50, 'C': 100}


def numeral(h):
    """the chapter number in a heading ('CHAPTER XIV.', 'II. THE QUESTION', 'PART 3'), or None"""
    m = re.search(r'(?:^|\s)([IVXLC]{1,7}|\d{1,3})(?=[.,;:\s]|$)', h.upper())
    if not m: return None
    w = m.group(1)
    if w.isdigit(): return int(w)
    n = 0
    for i, c in enumerate(w): n += -ROMAN[c] if i + 1 < len(w) and ROMAN[c] < ROMAN[w[i + 1]] else ROMAN[c]
    return n


def chaptered(rx, keep_tail=12000):
    """A sectioner for a scan whose printed contents would otherwise be cut into sections. The headings are found with rx. The contents come first and their numbers climb; when the numbers start again
    (at 1 or 2) the book proper begins: what came before is the preface (kept as the Introduction), and the contents entries are dropped, together with the text after the last entry unless it is long
    (an editor's introduction). Neighbouring pieces with the same heading (a running head the OCR read as a heading) are made one."""
    rc = re.compile(rx, re.M)

    def sec(t):
        hits = list(rc.finditer(t))
        if len(hits) < 3: return U.split_headings(t, rx)
        heads = [numfix(re.sub(r'\s+', ' ', m.group(0)).strip()) for m in hits]; nums = [numeral(h) for h in heads]; start = 0
        for i in range(1, min(len(hits), 90)):
            if nums[i] is not None and nums[i - 1] is not None and nums[i] <= 2 and nums[i] < nums[i - 1] and hits[i].start() < 0.45 * len(t): start = i; break
        intro = t[:hits[0].start()] if start else ''
        if start:
            tail = t[hits[start - 1].end(): hits[start].start()]
            pm = re.search(r'^\s*(?:PREFACE|INTRODUCTION|ADVERTISEMENT|INTRODUCTORY|TO THE READER|AUTHOR.S PREFACE)\b', tail, re.M | re.I)
            if pm: intro += '\n\n' + tail[pm.start():]      # the preface that follows the contents
            elif len(tail) > keep_tail: intro += '\n\n' + tail
        out = []
        if len(intro.strip()) > 300: out.append(['Introduction', intro, 'INTRODUCTION'])
        elif not start and t[:hits[0].start()].strip() and len(t[:hits[0].start()].strip()) > 300: out.append(['Introduction', t[:hits[0].start()], 'INTRODUCTION'])
        for k in range(start, len(hits)):
            body = t[hits[k].end(): hits[k + 1].start() if k + 1 < len(hits) else len(t)]; key = re.sub(r'[^A-Z0-9]', '', heads[k].upper())
            if out and out[-1][2] == key: out[-1][1] += '\n\n' + body
            else: out.append([heads[k], body, key])
        return [[h, b] for h, b, _ in out]
    return sec


def heading_case(name):
    """CAPITALS to a heading in title case, the small words in lower case"""
    w = re.sub(r"\b(Of|The|On|To|In|A|And|By|At|For|Before|Or)\b", lambda m: m.group(1).lower(), name.title()).replace("'S", "’s").replace("’S", "’s")
    return w[:1].upper() + w[1:]


def titled(titles, after=None):
    """A sectioner for a collected volume whose printed contents name its pieces in capitals: each title is looked for, in the order of the contents, as a line of its own (a page number after it is allowed)
    after the end of the contents; a piece whose title is not found stays inside the one before it, and the text is never cut, only divided. Running heads repeat a title: the first line is the start."""
    def sec(t):
        pos = []; cur = 0; last = None
        m0 = re.search(re.escape(after).replace(r'\ ', r'\s+'), t) if after else None
        cur = m0.end() if m0 else 0
        for name in titles:
            words = [re.escape(w) for w in name.split()[:6]]
            rx = re.compile(r'^\s*' + r'\s+'.join(words) + r'\b[^\n]{0,40}$', re.M)      # in capitals, as the contents give them: an ordinary line that begins the same way is not a title
            m = rx.search(t, cur)
            if m and (last is None or name != last):
                pos.append((m.start(), name)); cur = m.end(); last = name
        out = []
        if not pos: return [['Text', t]]
        if t[:pos[0][0]].strip() and len(t[:pos[0][0]].strip()) > 300: out.append(['Introduction', t[:pos[0][0]]])
        for i, (a, name) in enumerate(pos):
            b = pos[i + 1][0] if i + 1 < len(pos) else len(t)
            out.append([heading_case(name), t[a:b]])
        return out
    return sec


OWN = MOV
ARG = ('It is one writer’s argument on a question the churches have long disagreed about (whether all souls will in the end be restored to God), written on his own account and not as the statement of a church: '
       'the Library neither endorses nor judges it, and the churches’ own statements are the place to see what each teaches.')
INSIDE = ('A history written from inside the church it describes, for its members: it keeps that church’s own memory of its founders and its disputes, and a historian outside it would weigh some of it differently. '
          'The Library neither endorses nor judges it.')
LONG_S = 'Eighteenth-century type (with the long s) read by OCR: a repair pass mends the commonest misreadings, but the text is rougher than most and some words are still wrong.'
SIDE = ('A history written by a believer in one side of the question, for readers who are weighing it: the choice of writers and the reading of each are his, and the Library neither endorses nor judges them.')


def mov(i, idents, by, note, title, when, tail=OWN, station=NEW, **kw):
    """a book of the movement itself (group mo): the Universalists' and Unitarians' own books, and the books on the doctrine"""
    if kw.get('split', 'auto') == 'auto': kw.setdefault('min_chars', 250)
    if kw.get('long_s'): note += ' ' + LONG_S
    SPECS[i] = G(idents, by, note + ' ' + tail, lib=(title, 'mo', when, 'mod', station), **{'split': 'auto', **kw})


def hist(i, idents, by, note, title, when, tail=INSIDE, **kw):
    """a history or a study (group sc): shelved with the Scholarship books"""
    if kw.get('split', 'auto') == 'auto': kw.setdefault('min_chars', 250)
    if kw.get('long_s'): note += ' ' + LONG_S
    SPECS[i] = G(idents, by, note + ' ' + tail, lib=S(title, when), **{'split': 'auto', **kw})


# ── Round 25c, value 1: the founders' books and the denomination's own history ──
mov('x-wur', 'univstora00winc', 'Elhanan Winchester, The Universal Restoration, Exhibited in Four Dialogues between a Minister and His Friend (Philadelphia: T. Dobson, 1792; first published London, 1788), with the author’s account of how he came to his view',
    'The restorationist book of the 1780s. Winchester, a Baptist minister who had come to teach that all souls will in the end be restored to God, sets out his view as four dialogues between a minister and a friend, which he says gather the substance of real conversations in America and Europe, and answers the objections drawn from the Scriptures. Its doctrine is a limited punishment after death followed by restoration; Hosea Ballou and many later Universalists held that all punishment belongs to this life. This printing prefixes his brief account of the means and manner of his embracing these sentiments, with sketches of four years of his life.',
    'The Universal Restoration (Elhanan Winchester, 1788; 1792 edition)', '1788 CE (ed. 1792)', long_s=True, split=r'^\s*DIALOGUE\s+[IVXL]+\.?\s*$', skip=r'^DIALOGUE\s+[IVXL]+\.?$', trim_index=False)
mov('x-mls', ['letterssketcheso01murr', 'letterssketcheso02murr', 'letterssketcheso03murr'], 'John Murray, Letters and Sketches of Sermons, three volumes (Boston: Joshua Belcher, 1812)',
    'The preacher whom Universalists often call the founder of their church in America (John Murray, 1741–1815, who came from England to New Jersey in 1770 and formed the society at Gloucester, Massachusetts) gathers here his letters and the sketches of his sermons: scriptural investigations and dialogues on the salvation of all, which the editors say were written in the form of letters, journal-wise, to various correspondents. Three volumes, with the editor’s advertisement and a contents list to each.',
    'Letters and Sketches of Sermons (John Murray, 1812), three volumes', '1812 CE', split=None)
mov('x-cmh', 'mysteryhidfromag00chau', 'Charles Chauncy, The Mystery Hid from Ages and Generations, Made Manifest by the Gospel-Revelation: or, The Salvation of All Men the Grand Thing Aimed at in the Scheme of God, as Opened in the New-Testament Writings, and Entrusted with Jesus Christ to Bring into Effect, in Three Chapters (London: Charles Dilly, 1784); the title page does not name the author',
    'The title page gives no author’s name; the book is the work of Charles Chauncy (1705–1787), for many years minister of the First Church in Boston and a leading critic of the revivals of the 1740s. In three chapters (a preliminary chapter, the proof of the main point, and the answers to objections) he argues from the New Testament that God’s purpose is the salvation of all men, and that the punishment of the wicked after death is a means to that end.',
    'The Mystery Hid from Ages and Generations (Charles Chauncy, 1784)', '1784 CE', tail=ARG, long_s=True, split=r'^\s*CHAP(?:TER|\.)\s+[IVXL]+\.?\s*$', retitle=numfix, cut_tail=r'^\s*BOOKS\s+printed', trim_index=False)
mov('x-bfr', 'examinationofdoc00ball_0', 'Hosea Ballou, An Examination of the Doctrine of Future Retribution, on the Principles of Morals, Analogy and the Scriptures (Boston: Trumpet Office, 1834)',
    'Ballou’s longest argument that sin is punished in this life and not in a world to come: from the principles of morals, from analogy and from the Scriptures, with his replies to a friend and to “Reason” and short pieces on the spirits in prison and on the doctrine. The church argued the question for a generation: the Restorationists, who held with Winchester to a limited punishment after death, stood on the other side.',
    'An Examination of the Doctrine of Future Retribution (Hosea Ballou, 1834)', '1834 CE', cut_head=r'^\s*DEDICATION', cut_tail=r'^\s*Date\s+Due')
hist('x-edd', ['universalisminam01eddy', 'universalisminam02eddy'], 'Richard Eddy, Universalism in America: A History, two volumes (Boston: Universalist Publishing House, 1884–86; volume I is the second edition)',
    'The standard history of the denomination by its own historian (the title page names him President of the Universalist Historical Society): volume I runs from 1636 to 1800, the first believers in the restoration of all in England and America, John Murray, Winchester and the conventions of the 1790s; volume II continues the history and prints the sermons, minutes and papers of the denomination’s ministers and conventions as documents.',
    'Universalism in America: A History (Richard Eddy, 1884–86), two volumes', '1884–86 CE')
# ── Round 25c, value 2: the founders, the arguments and the books outside the churches ──
mov('x-mrl', 'recordsoflifeofr00murrrich', 'John Murray, Records of the Life of the Rev. John Murray, Late Minister of the Reconciliation, Senior Pastor of the Universalists, Congregated in Boston, Written by Himself, with a brief continuation to the closing scene (Boston: Munroe and Francis, 1816)',
    'The autobiography of the Universalist preacher (1741–1815), as its title page describes it: anecdotes of the writer’s infancy, extended to some years after the commencement of his public labours in America. A brief continuation to his death is added; the title page says it is by a friend, and the copyright entry of 1816 was made by Judith Sargent Murray, his widow.',
    'Records of the Life of the Rev. John Murray (1816)', '1816 CE')
mov('x-bnp', 'notesonparables01ballgoog', 'Hosea Ballou, Notes on the Parables of the New Testament, Scripturally Illustrated and Argumentatively Defended (Boston: A. Tompkins, 1852; sixth edition, stereotyped, revised by the author)',
    'Ballou’s book on the parables of Jesus, each parable followed by an “illustration” in which he reads it in the light of his Universalism. The preface says the Notes were written in 1804 and that the third edition appeared in 1822; this is the sixth, revised by the author.',
    'Notes on the Parables of the New Testament (Hosea Ballou, 1804; 1852 edition)', '1804 CE (ed. 1852)')
hist('x-ahu', 'ancienthistoryu01ballgoog', 'Hosea Ballou 2nd, Ancient History of Universalism, from the Time of the Apostles to Its Condemnation in the Fifth General Council; with an Appendix, Tracing the Doctrine Down to the Reformation (Boston, 1829)',
    'The Universalist minister’s argument (he was the nephew of Hosea Ballou, and later the first president of Tufts) that the doctrine of the final restoration of all was held by many of the early Christian teachers until the Council of 553, which in his reading condemned it. Historians of the church dispute how many of the early writers held it and what the council condemned.',
    'Ancient History of Universalism (Hosea Ballou 2nd, 1829)', '1829 CE')
hist('x-wmh', 'modernhistoryofu01whit', 'Thomas Whittemore, The Modern History of Universalism, Extending from the Epoch of the Reformation to the Present Time, Consisting of Accounts of Individuals and Sects Who Have Believed That Doctrine; Sketches, Biographical and Literary, of Authors Who Have Written Both in Favor of and against It; with Selections from Their Writings, and Notes (Boston, 1860; volume I of the second edition, enlarged; first published 1830)',
    'A Universalist pastor and editor’s history of the doctrine, as its title page sets it out: the people and sects who held it from the Reformation to his own day, sketches of the writers who argued for and against it, and selections from their writings. The introduction says that the publication of Ballou 2nd’s Ancient History spurred Whittemore to finish it between February 1829 and January 1830. This scan is volume I of the second edition of 1860; its preface promises the rest, which the Library has not found. The first edition of 1830, in one volume, is a different scan.',
    'The Modern History of Universalism (Thomas Whittemore, 1830; 1860 edition, volume I)', '1830 CE (ed. 1860)')
hist('x-aeh', 'historyofunitari0010alle', 'Joseph Henry Allen and Richard Eddy, A History of the Unitarians and the Universalists in the United States (New York: Christian Literature Co., 1894; American Church History series, volume X)',
    'The one-volume history of the two denominations that were to join in 1961, in a series of denominational histories published under the auspices of the American Society of Church History: Allen’s part, The Unitarians, and Eddy’s, The Universalists, each by the historian of his own church.',
    'A History of the Unitarians and the Universalists in the United States (Allen and Eddy, 1894)', '1894 CE')
mov('x-ski', 'socialimplicati00skingoog', 'Clarence R. Skinner, The Social Implications of Universalism (Boston: Universalist Publishing House, 1915); the author was then professor of applied Christianity at the Crane Theological School, Tufts College',
    'A Universalist teacher’s argument, in the years of the Progressive movement, that the belief in the final salvation of all carries duties to society. His foreword sets it among the other answers that men have given to the sorrow and misery of humanity (the individualist revival of religion, and the programs of social reform), and weighs each.',
    'The Social Implications of Universalism (Clarence R. Skinner, 1915)', '1915 CE')
mov('x-bsh', 'aninquiryintosc01balfgoog', 'Walter Balfour, An Inquiry into the Scriptural Import of the Words Sheol, Hades, Tartarus, and Gehenna, All Translated Hell, in the Common Version (Charlestown: Geo. Davidson, 1824)',
    'The Universalist minister’s study of the four Hebrew and Greek words that the common English version renders “hell”: where each occurs, and what, he argues, each meant to the writer and his first readers. This is the first edition of 1824. Scholars of every church have studied the same words since, and many disagree with parts of it.',
    'An Inquiry into the Scriptural Import of the Words Sheol, Hades, Tartarus and Gehenna (Walter Balfour, 1824)', '1824 CE')
mov('x-hci', 'calvinismimprove00hunt', 'Joseph Huntington, Calvinism Improved; or, The Gospel Illustrated as a System of Real Grace, Issuing in the Salvation of All Men: a posthumous work of the late Rev. Joseph Huntington, D.D., minister of the First Church in Coventry, Connecticut (New London: Samuel Green, 1796)',
    'A Connecticut minister’s argument, published after his death, that the Calvinist doctrines of God’s sovereignty and free grace, followed to their end, lead to the salvation of all men and not of some. It is one of the books by which the doctrine of universal salvation was argued from inside the Calvinist churches of New England.',
    'Calvinism Improved (Joseph Huntington, 1796)', '1796 CE', tail=ARG, long_s=True)
mov('x-gdb', 'someremarkablepa00debe', 'Some Remarkable Passages in the Life of Dr. George de Benneville, Late of Germantown, Pennsylvania, Who Departed This Life in March, 1793, in the Ninetieth Year of His Age, Including What He Saw and Heard in a Trance of Forty-Two Hours Duration, Both in the Regions of Happiness and Misery; Together with a Brief Account of His Cruel Persecution in France for Preaching the Gospel; translated from the French of his own manuscript, with a preface by the translator, Elhanan Winchester (Germantown, Pa.: Converse Cleaves, 1890; a reprint of the American edition of 1800, revised, with notes and addenda)',
    'The life of a physician and preacher of Germantown as the title page describes it: a trance of forty-two hours, in which he says he saw and heard the regions of happiness and misery, and his persecution in France for preaching. It was translated by Elhanan Winchester, who adds a recommendatory preface, and it is among the earliest records of the belief in the final salvation of all in America. He reports what he saw; the Library neither endorses nor judges it.',
    'Some Remarkable Passages in the Life of Dr. George de Benneville (1800; 1890 edition)', '1800 CE (ed. 1890)')
mov('x-sie', 'everlastinggospe00sieg', 'Paul Siegvolck, The Everlasting Gospel, Commanded to Be Preached by Jesus Christ, Judge of the Living and Dead, unto All Creatures, concerning the Eternal Redemption Found Out by Him, whereby Devil, Sin, Hell and Death Shall at Last Be Abolished, and the Whole Creation Restored in Its Primitive Purity; written in German by Paul Siegvolck and translated into English (Germantown: Christopher Sower, 1753)',
    'A German work of the radical Pietists on the restoration of all things, translated into English and printed by Christopher Sower at Germantown for the German communities of Pennsylvania. “Paul Siegvolck” is a pen name; the book is usually attributed to Georg Klein-Nicolai. Elhanan Winchester says in his own account that this was the book that first showed him the doctrine of restoration, in South Carolina in 1778, and he later published a new edition.',
    'The Everlasting Gospel (Paul Siegvolck, 1753 edition)', '1753 CE', tail=ARG, long_s=True)
mov('x-wst', ['ldpd_6420628_000', 'bim_early-english-books-1475-1640_the-law-of-freedom-in-a-_winstanley-gerrard_1652'], 'Gerrard Winstanley, The Mysterie of God, concerning the Whole Creation, Mankinde, to Be Made Known to Every Man and Woman after Seaven Dispensations and Seasons of Time Are Passed Over (London: Printed by I. C. for Giles Calvert, 1649; sometimes dated 1648) and The Law of Freedom in a Platform, or True Magistracy Restored (London, 1652)',
    'Two books of the leader of the Diggers (True Levellers; c. 1609–1676). The Mysterie of God is an early tract that looks to the time when, as its title says, the mystery concerning the whole creation, mankind, is made known to every man and woman after seven dispensations; The Law of Freedom in a Platform (1652), addressed to Oliver Cromwell, is his plan for a commonwealth without private property, with its laws, its officers and its schools.',
    'The Mysterie of God (1648) and The Law of Freedom (1652) (Gerrard Winstanley)', '1648 and 1652 CE', tail=ARG, labels=['The Mysterie of God (1648)', 'The Law of Freedom in a Platform (1652)'], long_s=True, split=None, trim_index=False)
mov('x-far', 'eternalhope0000fred', 'Frederic W. Farrar, Eternal Hope: Five Sermons Preached in Westminster Abbey, November and December 1877 (London: Macmillan, 1878; twelfth thousand)',
    'Five sermons that began a controversy in the Church of England over everlasting punishment: a canon of Westminster asks what the words “eternal”, “damnation” and “hell” meant to the first readers of the New Testament, and what the early Fathers and the creeds teach. The long prefaces to the later thousands answer his critics.',
    'Eternal Hope: Five Sermons in Westminster Abbey (Frederic W. Farrar, 1878)', '1878 CE', tail=ARG)
mov('x-jkd', 'seconddeathandr03jukegoog', 'Andrew Jukes, The Second Death and the Restitution of All Things: with Some Preliminary Remarks on the Nature and Inspiration of Holy Scripture, a Letter to a Friend (London: Longmans, Green, 1867)',
    'An English writer’s letter to a friend setting out why he holds that the Scriptures teach the restitution of all things: that “the second death” belongs to God’s judgement of the dead, and is part of how they are restored and not an end to them. It has preliminary remarks on the nature and inspiration of Holy Scripture, and its preface says how long the thought had been growing in the writer’s heart.',
    'The Second Death and the Restitution of All Things (Andrew Jukes, 1867)', '1867 CE', tail=ARG)
mov('x-prc', 'bub_gb_E5IPAAAAIAAJ', 'Joseph Priestley, An History of the Corruptions of Christianity (London: British and Foreign Unitarian Association, 1871 edition; first published Birmingham, 1782)',
    'The founding book of English Unitarian historical argument: Priestley, a Dissenting minister and chemist, maintains that the doctrines of the Trinity, the atonement and the pre-existence of Christ were later additions to the simple teaching of the first Christians, and traces each through the Fathers, the councils and the schoolmen. The book was burned at Dudley in 1785 and made him notorious; the Unitarians took it as a charter.',
    'An History of the Corruptions of Christianity (Joseph Priestley, 1782; 1871 edition)', '1782 CE (ed. 1871)', long_s=False)
mov('x-pdt', 'transientpermane1907park', 'Theodore Parker, A Discourse of the Transient and Permanent in Christianity (Boston, 1841; American Unitarian Association reprint)',
    'The sermon preached at the ordination of Charles C. Shackford in South Boston on 19 May 1841, which divided the Unitarians: Parker holds that the forms of Christianity change while its religious truth does not, and that the truth does not rest on the miracles or the authority of Christ. The Unitarian ministers who heard it quarrelled over whether he should be allowed to preach in their pulpits.',
    'A Discourse of the Transient and Permanent in Christianity (Theodore Parker, 1841)', '1841 CE', min_chars=100)
mov('x-chw', 'worksofwilliamec00chaniala', 'The Works of William E. Channing, D.D. (Boston: American Unitarian Association, 1877; one-volume edition with an introduction)',
    'The collected writings of the minister of the Federal Street Church in Boston (1780–1842), whom Unitarians count the founder of their American church, in one volume: Self-Culture and the addresses on the laboring classes, temperance and education; the discourses on Christianity, the ministry, the character of Christ and worship; Unitarian Christianity (the Baltimore sermon of 1819) and the moral argument against Calvinism; the remarks on Milton, Napoleon and Fénelon; the writings on war and on slavery; and, last, the address at Lenox on the anniversary of West Indian emancipation (1842). The sections follow the printed contents; a few short pieces whose headings the scan’s OCR garbled stay inside the piece before them.',
    'The Works of William E. Channing (one-volume edition, 1877)', '1819–42 CE (ed. 1877)')
hist('x-cuk', 'PG8605', 'George Willis Cooke, Unitarianism in America: A History of Its Origin and Development (Boston: American Unitarian Association, 1902)',
    'A denominational history in one volume by a Unitarian minister, in twenty chapters: the English sources of American Unitarianism, the liberal side of Puritanism, the growth of democracy in the churches, the silent advance of liberalism, the period of controversy, the denominational awakening and the growth of denominational consciousness, then Unitarian men and women, education and literature, and the future of Unitarianism.',
    'Unitarianism in America: A History of Its Origin and Development (George Willis Cooke, 1902)', '1902 CE')
# ── Round 25c, value 3: the rest ──
mov('x-bsl', 'aserieslectures03ballgoog', 'Hosea Ballou, A Series of Lecture Sermons Delivered at the Second Universalist Meeting, in Boston, by Hosea Ballou, Pastor (Boston, 1818), with a sermon delivered at Schenectady on 8 November 1818',
    'A series of lecture sermons by Ballou as pastor of the Second Universalist Meeting in Boston, headed by the texts “Search the Scriptures, for in them ye think ye have eternal life” and “Let us go on to perfection”, and followed by a sermon he gave at Schenectady, New York, in the same year. They show how he preached, from the Scriptures and in plain speech, the doctrine of the final reconciliation of all.',
    'Lecture Sermons (Hosea Ballou, 1818)', '1818 CE')
hist('x-wlb', ['lifeofrevhoseaba01whit', 'lifeofrevhoseaba02whit', 'liferevhoseabal01whitgoog', 'liferevhoseabal00whitgoog'], 'Thomas Whittemore, Life of Rev. Hosea Ballou, with Accounts of His Writings, and Biographical Sketches of Cotemporary Universalists, four volumes (Boston: J. M. Usher, 1854–55)',
    'The life of Hosea Ballou (1771–1852) by his friend and fellow minister, who calls him in his preface his “spiritual father”: the life itself, the accounts of his writings, and, as the title says, biographical sketches of the Universalists of his time. In four volumes, each with its contents and its index.',
    'Life of Rev. Hosea Ballou (Thomas Whittemore, 1854–55), four volumes', '1854–55 CE')
mov('x-gle', ['gleanermiscellan01murr', 'bim_eighteenth-century_the-gleaner-a-miscellan_murray-judith-sargent_1798_2', 'bim_eighteenth-century_the-gleaner-a-miscellan_murray-judith-sargent_1798_3'], 'Judith Sargent Murray (“Constantia”), The Gleaner: A Miscellaneous Production, three volumes (Boston: I. Thomas and E. T. Andrews, 1798)',
    'The collected essays, poems and plays of a writer who published under the name “Constantia” and was the wife of the Universalist preacher John Murray (they married in 1788): essays on manners, education, politics and religion, a story of Margaretta that runs through the volumes, and a list of subscribers at the end. The Gleaner’s essays are in the voice of an invented man, “Mr. Vigil”.',
    'The Gleaner (Judith Sargent Murray, 1798), three volumes', '1798 CE', labels=['Volume 1', 'Volume 2', 'Volume 3'], long_s=True)
mov('x-obr', 'acquaintancesol00browgoog', 'Olympia Brown, Acquaintances, Old and New, among Reformers (Milwaukee: S. E. Tate Printing Co., 1911), dedicated to the woman’s suffrage cause',
    'The memoir of a Universalist minister and suffrage worker (1835–1926), often described as the first woman ordained by a recognised denomination in the United States: her early impressions, school and college, her first petition, women in the ministry, the American Equal Rights Association, a tour in New York with Susan B. Anthony, some New England pioneers, the Kansas campaign and the founding of the New England Woman’s Suffrage Association.',
    'Acquaintances, Old and New, among Reformers (Olympia Brown, 1911)', '1911 CE')
mov('x-jld', ['bim_early-english-books-1641-1700_the-revelation-of-revela_lead-jane_1683', 'bim_early-english-books-1641-1700_the-enochian-walks-with-_lead-jane_1694'], 'Jane Leade, The Revelation of Revelations, Particularly as an Additional Testimony to the Opening of the Seven Seals, the Seven Thunders, and the New-Jerusalem State (London, 1683), and The Enochian Walks with God, Found Out by a Spiritual Traveller, Whose Face towards Mount Sion above Was Set (London, 1694)',
    'Two works of the English visionary (1624–1704) who became the leader of the Philadelphian Society: The Revelation of Revelations (1683), on the unsealing of the seven seals, the seven thunders and the New-Jerusalem state, as they were shown to her, and The Enochian Walks with God (1694), an experimental account of what she says she knew, saw and met in the way of Enoch. She reports her visions, and the Library neither endorses nor judges them; the Philadelphians’ hope of the restitution of all things is one source of the later English belief.',
    'The Revelation of Revelations (1683) and The Enochian Walks with God (1694) (Jane Leade)', '1683 and 1694 CE', tail=ARG, labels=['The Revelation of Revelations (1683)', 'The Enochian Walks with God (1694)'], long_s=True, split=None, trim_index=False)
mov('x-cox', 'salvatormundiori00coxsrich', 'Samuel Cox, Salvator Mundi; or, Is Christ the Saviour of All Men? (London: C. Kegan Paul, 1878 printing; first published 1877)',
    'A book whose preface states its aim: to encourage those who “faintly trust the larger hope” to commit themselves to it wholly, by showing them that they have ample warrant for it in the Scriptures of the New Testament. It takes up the questions the doctrine raises (the question as it is put, the words “damnation” and “hell”, the Christian doctrine of the ages, the test of principles, the universality of Christ’s redemption and what we shall be).',
    'Salvator Mundi; or, Is Christ the Saviour of All Men? (Samuel Cox, 1877)', '1877 CE (ed. 1878)', tail=ARG)
mov('x-all', 'universalismass08alligoog', 'Thomas Allin, Universalism Asserted as the Hope of the Gospel on the Authority of Reason, the Fathers, and Holy Scripture (London: E. Stock, 1887 printing; first published 1885)',
    'An argument for the final restoration of all, taking the same three roads as its title: reason, the Fathers of the Church, and the Scriptures. Its preface puts the question as “can Evil triumph finally over Good?”, and the book is in ten chapters.',
    'Universalism Asserted (Thomas Allin, 1885)', '1885 CE (ed. 1887)', tail=ARG, retitle=numfix)
hist('x-bec', 'historyopinions01beecgoog', 'Edward Beecher, History of Opinions on the Scriptural Doctrine of Retribution (New York: D. Appleton, 1878)',
    'A Congregational minister’s history of what the churches and their teachers have held about the punishment of the wicked. His preface puts the question as the meaning of one word, aionios, and asks what the hearers of Christ took it to mean; the chapters follow the opinions down the centuries with long extracts. Edward Beecher (1803–1895) was the brother of Henry Ward Beecher and Harriet Beecher Stowe, and took part in the controversy himself.',
    'History of Opinions on the Scriptural Doctrine of Retribution (Edward Beecher, 1878)', '1878 CE', tail=SIDE)
# ── Rules found by building: where a book proper starts and ends in each scan, and how its chapters are named ──
fix('x-mls', slices=[(r'^\s*EDITORIAL\s+ADVERTISEMENT', None), (r'^\s*CONTENTS', None), (r'^\s*CONTENTS', None)], trim_front=False, cut_tail=r'^\s*ERRATA')
fix('x-mrl', cut_tail=r'^\s*TO\s+B[ES]\s+SOLD\s+AT')
fix('x-ahu', sectioner=chaptered(r'^\s*CHAPTER\s+[IVXL1]+\.?\s*$'))
fix('x-wmh', sectioner=chaptered(r'^\s*BOOK\s+[IVXL]+[.,]?\s*$'))
fix('x-bsh', sectioner=chaptered(r'^\s*CHAPTER\s+[IVXL]+\.?\s*$'))
fix('x-aeh', cut_tail=r'\bTORN\s+aoe|^\s*Allen,\s+Joseph\s+Henry,\s+1820')
fix('x-hci', trim_front=False, cut_head=r'^\s*The\s+Author,\s+to\s+all')
fix('x-gdb', trim_front=False, cut_head=r'^\s*SOME\s+REMARKABLE\s+PASSAGES', cut_tail=r'(?:H\s+\d+\s+\d+\s+\S+\s+)?Deacidified\s+using|Neutralizing\s+agent')
fix('x-sie', split=None)
fix('x-prc', sectioner=chaptered(r'^PART\s+[IVXLC0-9]+\b.*$'))
fix('x-pdt', trim_front=False, cut_head=r'^\s*The\s+Transient\s+and\s+Permanent', cut_tail=r'^\s*Parker,\s+Theodore')
fix('x-chw', split=None)
fix('x-cuk', split=r"^[IVXL]+\.\s+[A-Z][A-Za-z .,'\-]+\.\s*$")
fix('x-bsl', split=None)
fix('x-bnp', split=None)
fix('x-wlb', sectioner=chaptered(r'^\s*CHAPTER\s+[IVXL]+\.?\s*$'), cut_tail=r'^\s*INDEX')
fix('x-gle', split=None, unlong=True)
fix('x-jld', unlong=True, cut_tail=r'For\s+the\s+which,\s+the\s*lnc')
fix('x-wst', unlong=True, cut_tail=r'Books\s+following,\s+written')
fix('x-cox', split=None, cut_tail=r'^\s*EXPOSITORY\s+WORKS\s+BY')
fix('x-all', retitle=numfix)
fix('x-pdt', cut_tail=r'^\W*THEOLOGY\s+LIBRARY')
fix('x-bsl', trim_front=False, cut_head=r'^\s*SERIES\s*$')


# ── The Winchester Profession: two short documents from one typed page, so it has a builder of its own (registered in build_texts.py) ──
WPB_URL = 'https://ccel.org/ccel/schaff/creeds1.x.xviii.html'
WPB_LIB = ('The Winchester Profession (the Universalist Convention, 1803)', 'mo', '1803 CE', 'mod', NEW)


def build(lib, fetch, CACHE):
    """x-wpb: the Profession of Belief adopted at Winchester, New Hampshire, in 1803 and the Conditions of Fellowship added in 1899, from the CCEL's typed copy of section 117 of Schaff's Creeds of Christendom, volume 1.
    Only the two documents are kept: the paragraphs of history around them are from a later revision of Schaff's book (it mentions 1930) and are left out."""
    if 'x-wpb' not in lib: return {}
    import html as _html
    raw = fetch(WPB_URL, CACHE / 'ccel' / 'schaff-creeds1-x-xviii.html').decode('utf-8', errors='replace')
    t = re.sub(r'(?is)<(script|style)\b.*?</\1>', ' ', raw); t = re.sub(r'(?is)<br\s*/?>|</p>|</div>|</h\d>|</li>', '\n', t)
    t = _html.unescape(re.sub(r'(?s)<[^>]+>', '', t)); t = re.sub(r'[ \t\xa0]+', ' ', t)
    a = t.index('Art. I. We believe'); b = t.index('The Conditions of Fellowship shall be as follows'); c = t.index('assent to its laws.', b) + len('assent to its laws.')
    arts = re.sub(r'\s*(Art\. I{1,3}\.)', r'\n\n\1', t[a:b]).strip()
    cond = re.sub(r'\s*\n\s*', '\n\n', t[b:c]).strip()
    cond = re.sub(r'(?<=[a-z;]) (\d\. )', r'\n\n\1', cond)
    secs = U.finish([['The Profession of Belief (1803)', arts], ['The Conditions of Fellowship (added 1899)', cond]], False)
    note = ('The three articles of faith that the Universalists of New England adopted at Winchester, New Hampshire, in 1803: the Scriptures as the revelation of God’s character and of the duty and final destination of men; one God whose nature is Love, who will finally restore the whole family of mankind to holiness and happiness; and the link between holiness and true happiness. '
            'With them, the Conditions of Fellowship that the General Convention added in 1899, which commend the Winchester Profession but say that no precise form of words is required of members. Only the two documents are kept; the history around them in Schaff’s book is left out. ' + OWN)
    by = ('The Profession of Belief adopted by the Universalist convention at Winchester, New Hampshire, in 1803, with the Conditions of Fellowship added by the General Convention in 1899, as printed in Philip Schaff, The Creeds of Christendom, volume 1, section 117 '
          '(the typed copy at ccel.org); the documents only')
    return {'x-wpb': dict(secs=secs, by=by, license='Public domain: the Profession is of 1803 and the Conditions of Fellowship of 1899; the text is that of the typed copy of Schaff’s Creeds of Christendom at the Christian Classics Ethereal Library (ccel.org), with the editor’s own paragraphs left out',
                          src=WPB_URL, verse=False, note=note)}

CHANNING_TITLES = ['INTRODUCTORY REMARKS', 'SELF-CULTURE', 'ON THE ELEVATION OF THE LABORING CLASSES', 'HONOR DUE TO ALL MEN', 'MINISTRY FOR THE POOR', 'ON PREACHING THE GOSPEL TO THE POOR', 'CHARGE FOR THE ORDINATION OF MR. ROBERT C. WATERSTON',
                   'ADDRESS ON TEMPERANCE', 'REMARKS ON EDUCATION', 'REMARKS ON NATIONAL LITERATURE', 'REMARKS ON ASSOCIATIONS', 'THE PRESENT AGE', 'SPIRITUAL FREEDOM', 'IMPORTANCE OF RELIGION TO SOCIETY', 'EVIDENCES OF CHRISTIANITY',
                   'THE EVIDENCES OF REVEALED RELIGION', 'CHRISTIANITY A RATIONAL RELIGION', 'THE GREAT PURPOSE OF CHRISTIANITY', 'MEANS OF PROMOTING CHRISTIANITY', 'THE CHRISTIAN MINISTRY', 'THE DEMANDS OF THE AGE ON THE MINISTRY',
                   'THEOLOGICAL EDUCATION', 'CHARGE AT THE ORDINATION OF THE REV. JOHN SULLIVAN DWIGHT', 'LIKENESS TO GOD', 'CHARACTER OF CHRIST', 'THE IMITABLENESS OF CHRIST’S CHARACTER', 'LOVE TO CHRIST', 'PREACHING CHRIST', 'SELF-DENIAL',
                   'THE EVIL OF SIN', 'IMMORTALITY', 'THE FUTURE LIFE', 'UNITARIAN CHRISTIANITY', 'UNITARIAN CHRISTIANITY MOST FAVORABLE TO PIETY', 'OBJECTIONS TO UNITARIAN CHRISTIANITY CONSIDERED', 'CHRISTIAN WORSHIP', 'THE CHURCH',
                   'THE SUNDAY SCHOOL', 'THE MORAL ARGUMENT AGAINST CALVINISM', 'LETTER ON CATHOLICISM', 'THE SYSTEM OF EXCLUSION AND DENUNCIATION IN RELIGION', 'EXTRACTS FROM A LETTER ON CREEDS', 'THE DUTIES OF CHILDREN', 'DAILY PRAYER',
                   'REMARKS ON THE CHARACTER AND WRITINGS OF JOHN MILTON', 'REMARKS ON THE LIFE AND CHARACTER OF NAPOLEON BONAPARTE', 'REMARKS ON THE CHARACTER AND WRITINGS OF FENELON', 'A DISCOURSE ON THE LIFE AND CHARACTER OF THE REV. JOSEPH TUCKERMAN',
                   'THE PHILANTHROPIST', 'A DISCOURSE OCCASIONED BY THE DEATH OF THE REV. DR. FOLLEN', 'MEMOIR OF JOHN GALLISON', 'NOTICE OF THE REV. S. C. THACHER', 'THE UNION', 'WAR', 'LECTURE ON WAR', 'DUTIES OF THE CITIZEN IN TIMES OF TRIAL OR DANGER',
                   'SLAVERY', 'THE ABOLITIONISTS', 'A LETTER TO THE HON. HENRY CLAY', 'REMARKS ON THE SLAVERY QUESTION', 'EMANCIPATION', 'THE DUTY OF THE FREE STATES', 'AN ADDRESS DELIVERED AT LENOX']
fix('x-chw', split=None, sectioner=titled([x.replace('’', "'") for x in CHANNING_TITLES], after='having passed through various editions'), cut_tail=r'^\s*ABOLITIONISTS,\s+characterized')
fix('x-bfr', cut_tail=r'^\s*IND\s*$')
