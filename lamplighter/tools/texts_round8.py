"""Specs for an eighth batch of open (pre-1931) English texts: American revival and New Thought writings, Quietist and mystical works of the later Middle Ages and the
17th century, Anglican, Puritan and Catholic classics, the humanists' books on religion and conscience (Erasmus, More, Channing, Tolstoy) and one Indian work of statecraft.
Merged into texts_archive.SPECS (see the end of that file); built with python3 build_texts.py --only=ids. An ident 'PG123' is Project Gutenberg #123; the rest are Internet
Archive items. Sources were found on 16 November 2026 and fetched on the maker's instruction ("keep going and find more texts").

Each spec may carry lib=(title, group, when, tr, station title prefix): the Library line and the Path station for an id that is not in the Library yet.
Left out on purpose: Donne's Devotions (the Project Gutenberg copy is a 1959 edition), Jung's Psychology of the Unconscious (a psychology book, not a religious text),
and Cosmic Consciousness's 1901 printing (a lending-only item; the 1905 printing is used).
"""
OLD = 'An older translation, so its wording and its scholarship are dated; set a recent translation beside it where there is one.'
MOV = 'Read as the movement’s own book: it states what its members hold, and the Library neither endorses nor judges it.'
PER = 'Written in the English of its time, with its period’s assumptions; read it as a witness to what its author and readers believed.'


import re


def _sets(names, high=5, intro=None):
    """A book whose chapters count from I more than once (Madame Guyon's three Parts, the two sets of Butler's chapters and of his summary, Tolstoy's four works in one volume):
    put the set's name in front of the chapter, starting the next set when a low number follows a high one. A OCR'd number that cannot be read keeps its title."""
    st = {'set': 0, 'prev': 0}
    rom = {'I': 1, 'V': 5, 'X': 10, 'L': 50, 'C': 100}

    def f(h):
        h = re.sub(r'\[\d+\]|\s+\d+\s*$', '', re.sub(r'\s+', ' ', h)).strip()
        m = re.match(r'CHAPTER\s+([IVXLC]+)\b', h, re.I)
        if not m: return intro if (intro and h == 'Introduction') else h
        w = m.group(1).upper(); n = 0
        for k, c in enumerate(w): n += -rom[c] if k + 1 < len(w) and rom[c] < rom[w[k + 1]] else rom[c]
        if n <= 2 and st['prev'] >= high and st['set'] + 1 < len(names): st['set'] += 1
        st['prev'] = n
        return '%s · %s' % (names[st['set']], h)
    return f


def _edwards_title(h):
    for k, v in (('GOD GLORIFIED', 'God Glorified in Man’s Dependence (1731)'), ('A DIVINE', 'A Divine and Supernatural Light (1733)'), ('RUTH', 'Ruth’s Resolution (1735)'), ('THE MANY', 'The Many Mansions (1737)'),
                 ('SINNERS', 'Sinners in the Hands of an Angry God (1741)'), ('GOD’S AWFUL', 'A Strong Rod Broken and Withered (1748)'), ("GOD'S AWFUL", 'A Strong Rod Broken and Withered (1748)'), ('A FAREWELL', 'Farewell Sermon (1750)')):
        if h.upper().startswith(k): return v
    return h


def G(idents, by, note='', lib=None, **kw):
    d = dict(idents=idents if isinstance(idents, list) else [idents], by=by, note=note, trim_index=True, trim_front=True, trim_back=True, split='auto')
    if lib: d['lib'] = lib
    d.update(kw)
    return d


NEW = 'Bahá’í, Theosophy'
MYST = 'Christian mystics and the Jesus Prayer'
REF = 'The Quakers: waiting in silence'
GUPTA = 'The Gupta age'

SPECS = {
    # ── New Thought, Theosophy and the new movements ──
    'x-ccb': G('cosmicconsciousn01buck', 'Richard Maurice Bucke, Cosmic Consciousness: A Study in the Evolution of the Human Mind (Philadelphia: Innes & Sons, 1905 edition; first published 1901)',
               'A physician’s study of what he called cosmic consciousness, a rare sense of the order and life of the universe that he took to mark a higher stage of the human mind, with his accounts of Buddha, Jesus, Paul, Plotinus, Muhammad, Dante, Behmen, Blake, Whitman and others, and of people who were not famous. ' + PER + ' The scheme of the evolution of mind that holds it together is of its time and is not shared by later scholars of mysticism.',
               lib=('Cosmic Consciousness (Richard Maurice Bucke, 1901; 1905 edition)', 'mo', '1901 CE', 'mod', NEW)),
    'x-lop': G('lightonpath00coll_0', 'Mabel Collins, Light on the Path: a treatise written for the personal use of those who are ignorant of the Eastern wisdom and who desire to enter within its influence, with notes and comments (Boston: Occult Publishing Company; first published 1885)',
               'A short book of rules and aphorisms for the seeker, “written down” by the author from what she said was a higher source, with the notes and comments printed with it. It was much read in the Theosophical movement and beyond. The Library reports the claim about its source as the book’s own. ' + MOV,
               lib=('Light on the Path (Mabel Collins, 1885), with notes and comments', 'mo', '1885 CE', 'mod', NEW),
               slice=(r'^These rules are written for all disciples', None)),
    'x-itw': G('intunewithinfini00trin', 'Ralph Waldo Trine, In Tune with the Infinite; or, Fullness of Peace, Power, and Plenty (New York: Thomas Y. Crowell, 1897)',
               'A best-selling book of the New Thought movement: that one divine life runs through all things and that a person who turns to it in thought finds peace, health and plenty, with chapters on fear, on the power of love, on the “Christ spirit” and on the wise use of thought. ' + MOV,
               lib=('In Tune with the Infinite (Ralph Waldo Trine, 1897)', 'mo', '1897 CE', 'mod', NEW)),
    'x-tto': G('tertiumorganumth00uspe', 'P. D. Ouspensky, Tertium Organum (The Third Organ of Thought): A Key to the Enigmas of the World, translated from the Russian by Nicholas Bessaraboff and Claude Bragdon (Rochester: Manas Press, 1920)',
               'A Russian esoteric philosopher’s book (first published in 1912) arguing that the logic of Aristotle and the logic of science should be joined by a third instrument of thought, which looks beyond three-dimensional space, and drawing on mathematics, the mystics, Theosophy and the idea of cosmic consciousness. ' + PER,
               lib=('Tertium Organum (P. D. Ouspensky, trans. 1920)', 'mo', '1912 CE (trans. 1920)', 'mod', NEW),
               min_chars=1500),
    'x-tlh': G('PG7176', 'Leo Tolstoy, A Letter to a Hindu: The Subjection of India, Its Cause and Cure, with an introduction by M. K. Gandhi (1908; Project Gutenberg #7176)',
               'Tolstoy’s letter of 1908 to an Indian editor, which Gandhi translated and printed: that India is held less by the British than by Indians’ own acceptance of violence, and that the law of love taught by every religion is the way out. Gandhi’s introduction says how he came to it; the two men wrote to each other in 1909–10.',
               lib=('A Letter to a Hindu (Leo Tolstoy, 1908, with Gandhi’s introduction)', 'mo', '1908 CE', 'mod', NEW)),

    # ── Revivals ──
    'x-fcr': G('lecturesonreviva00finn', 'Charles G. Finney, Lectures on Revivals of Religion (New York: Fleming H. Revell; the lectures were given in New York in 1834–35)',
               'The lectures that shaped American revivalism: what a revival is, how it is brought about by prayer, preaching and the use of “new measures”, how to pray and preach and deal with the anxious, with Finney’s accounts of the revivals of the 1820s. ' + MOV,
               lib=('Lectures on Revivals of Religion (Charles G. Finney, 1835)', 'mo', '1834–35 CE', 'mod', NEW),
               split=r'^\s*LECTURE\s+[A-Za-z]{1,8}[.,]?\s*$', min_chars=1500),
    'x-ejs': G('PG34632', 'Jonathan Edwards, Selected Sermons, edited with an introduction and notes by H. Norman Gardiner (New York: Macmillan, 1904; Project Gutenberg #34632)',
               'Seven sermons of the New England preacher of the Great Awakening: God Glorified in Man’s Dependence (1731), A Divine and Supernatural Light (1733), Ruth’s Resolution (1735), The Many Mansions (1737), Sinners in the Hands of an Angry God (1741), A Strong Rod Broken and Withered (1748) and the Farewell Sermon (1750), with the editor’s introduction (his notes at the back of the volume are left out). ' + PER,
               lib=('Selected Sermons of Jonathan Edwards (ed. Gardiner, 1904), including Sinners in the Hands of an Angry God', 'mo', '1731–50 CE', 'mod', NEW),
               slice=(r'^SELECTED SERMONS OF JONATHAN EDWARDS', r'^NOTES\s*$'), retitle=_edwards_title,
               split=r"^(?:GOD GLORIFIED IN MAN'S DEPENDENCE|A DIVINE AND SUPERNATURAL LIGHT|RUTH'S RESOLUTION|THE MANY MANSIONS|SINNERS IN THE HANDS OF AN ANGRY GOD|GOD'S AWFUL JUDGMENT IN THE BREAKING|A FAREWELL SERMON)\b[^\n]*$"),
    'x-era': G('treatiseconcerni1821edwa', 'Jonathan Edwards, A Treatise Concerning Religious Affections, in three parts, with a sketch of the author’s life (Philadelphia: James Crissy, 1831 printing)',
               'Edwards’s 1746 study of what is genuine in religious feeling: the nature and importance of the “affections”, the signs that are no sure proof of grace, and the twelve signs that are, written after the revivals of the Great Awakening had shown how much false feeling could pass for the real. ' + PER,
               lib=('A Treatise Concerning Religious Affections (Jonathan Edwards, 1746)', 'mo', '1746 CE', 'mod', NEW),
               split=None),
    'x-bra': G('PG65066', 'The Life of Rev. David Brainerd, chiefly extracted from his diary, by Jonathan Edwards (1749; Project Gutenberg #65066)',
               'The diary of a young missionary to the Native Americans of New England, New York and New Jersey (1718–47), who died of tuberculosis at 29, as Edwards edited it; its record of fasting, doubt and devotion was one of the most read devotional books of the next century. It is also a missionary’s account of the people he came to teach, in his own terms and with his own assumptions.',
               lib=('The Life of David Brainerd, from his diary (ed. Jonathan Edwards, 1749)', 'mo', '1740s CE', 'mod', NEW)),

    # ── Anglican, Puritan and Catholic classics ──
    'x-bga': G('PG654', 'John Bunyan, Grace Abounding to the Chief of Sinners (1666; Religious Tract Society edition of 1905; Project Gutenberg #654)',
               'The tinker-preacher’s own account of his life: the years of doubt and terror, the temptation to despair, the long way to a settled faith, and the arrest that took him to Bedford jail, written there. A classic of the Puritan spiritual autobiography. ' + PER,
               lib=('Grace Abounding to the Chief of Sinners (John Bunyan, 1666)', 'ec', '1666 CE', 'ec', REF)),
    'x-nap': G('PG22088', 'John Henry Newman, Apologia pro Vita Sua, being a history of his religious opinions (London: Longmans, Green, 1890 edition; first published 1864; Project Gutenberg #22088)',
               'The Anglican priest who became a Catholic cardinal answers the charge of insincerity: the story of his religious opinions from boyhood, through the Oxford Movement, to his reception into the Catholic Church in 1845. Written in 1864; this is the later form of the book, with the pamphlet controversy that began it left out.',
               lib=('Apologia pro Vita Sua (John Henry Newman, 1864; 1890 edition)', 'ec', '1864 CE', 'ec', REF)),
    'x-bty': G('PG53346', 'Joseph Butler, The Analogy of Religion, Natural and Revealed, to the Constitution and Course of Nature, ed. Howard Malcolm (Philadelphia: J. B. Lippincott, 1873 edition; first published 1736; Project Gutenberg #53346)',
               'The Bishop of Durham’s answer to the deists: that if the world’s order raises the same difficulties as revealed religion does, the objections to revelation cannot weigh more against it than against nature itself. With his two dissertations, On Personal Identity and On the Nature of Virtue. ' + PER,
               lib=('The Analogy of Religion (Joseph Butler, 1736)', 'ec', '1736 CE', 'ec', REF),
               retitle=_sets(['Summary of Part I', 'Summary of Part II', 'Part I: Of Natural Religion', 'Part II: Of Revealed Religion'], 5)),

    # ── Mystics ──
    'x-cvg': G('visionofgod00nich', 'Nicholas of Cusa, The Vision of God (De visione Dei, 1453), translated by Emma Gurney Salter (London: J. M. Dent, and New York: E. P. Dutton, 1928)',
               'The cardinal’s treatise for the monks of Tegernsee, who had asked him about mystical theology: God’s face looks at each person from every side, as a painted face seems to follow the viewer; God is “beyond the wall of the coincidence of opposites”, and Jesus is the one way in. A classic of the mystical theology of the late Middle Ages.',
               lib=('The Vision of God (Nicholas of Cusa, 1453; trans. Salter, 1928)', 'ec', '1453 CE', 'ec', MYST)),
    'x-llb': G('bookofloverbelov00lluluoft', 'Ramon Lull, The Book of the Lover and the Beloved, translated from the Catalan with an introductory essay by E. Allison Peers (London: S.P.C.K., and New York: Macmillan, 1923)',
               'A set of 365 short sayings, one for each day of the year, in which the Lover (the soul) seeks the Beloved (God): love’s pains, its joys, its absurdities, in a manner often compared with the Sufi poets. It is part of Lull’s novel Blanquerna (c. 1283); its translator says it had never been put into English before.',
               lib=('The Book of the Lover and the Beloved (Ramon Lull, c. 1283; trans. Peers, 1923)', 'ec', 'c. 1283 CE', 'ec', MYST)),
    'x-mos': G('spiritualguideof00moli', 'Miguel de Molinos, The Spiritual Guide, which disentangles the soul and brings it by the inward way to the getting of perfect contemplation (the English of 1699; reprinted at Philadelphia, 1885)',
               'The book that made Quietism a European scandal: the soul reaches God by surrendering will and thought and resting in silence, not by effort or methods. It was condemned by Rome in 1687 and its author was imprisoned for life. This is the English translation of 1699, in the spelling of its time, with the letters about the Quietists that went with it. ' + OLD,
               lib=('The Spiritual Guide (Miguel de Molinos, 1675; English of 1699)', 'ec', '1675 CE', 'ec', MYST),
               retitle=_sets(['Part 1', 'Part 2'], 8)),
    'x-gam': G(['autobiographyofm01guyo', 'autobiographyofm02guyo'], 'Autobiography of Madame Guyon, translated in full by Thomas Taylor Allen, in two volumes (London: Kegan Paul, Trench, Trübner, 1898)',
               'The life of the French Quietist (1648–1717), written by her at the request of her director: her early years, her unhappy marriage, the “prayer of silence” she came to teach, her friendship with Fénelon, and her years in prison. The translator says in his preface that he gives the whole of it, because the earlier English life of her was defective. ' + OLD,
               lib=('Autobiography of Madame Guyon (trans. Allen, 1898)', 'ec', 'written c. 1688–1709 CE', 'ec', MYST),
               slices=[(r'^\s*PART\s+I\.\s*$', None, 1), (r'^\s*CHAPTER\s+XI\.\s*$', None, 1)], retitle=_sets(['Part I', 'Part II', 'Part III'], 8, 'Part I · CHAPTER I.'), split=r'^\s*CHAPTER\s+[IVXLC]+[.,]?\s*$'),

    'x-fsl': G('spiritualletters00fn', 'Spiritual Letters of Archbishop Fénelon: Letters to Women, translated by the author of “Fénelon, Archbishop of Cambrai” (Oxford and Cambridge: Rivingtons, 1877)',
               'More than a hundred letters of spiritual direction from the Archbishop of Cambrai to ladies of the court of Louis XIV and others, on meditation and prayer, the difficulties of a worldly life, silence and the presence of God, temper, scandal and illness: a plain, practical Catholic mysticism of the Quietist years, from the man who stood by Madame Guyon. ' + OLD,
               lib=('Spiritual Letters of Archbishop Fénelon: Letters to Women (1877 translation)', 'ec', 'c. 1690–1715 CE', 'ec', MYST),
               slice=(r'^\s*ON\s+MEDITATION\s+AND\s+PRAYER', None), split=r"^[A-Z][A-Z ,'’;:\-\.]{9,90}$", skip=r'LETTERS|SPIRITUAL|MUIR AND PATERSON'),

    # ── Humanists: religion, conscience and tolerance ──
    'x-epf': G('PG30201', 'Desiderius Erasmus, In Praise of Folly, with portrait, life of Erasmus and his epistle to Sir Thomas More, illustrated by Hans Holbein (London: Reeves & Turner, 1876; Project Gutenberg #30201)',
               'Erasmus’s satire of 1511, spoken by Folly herself: she praises the fools of every rank, then turns on the theologians, monks, popes and pilgrims of his day, and ends by praising the folly of the Cross. A book of the humanist reform that the Reformation later outran. ' + OLD,
               lib=('In Praise of Folly (Erasmus, 1511; ed. 1876)', 'ec', '1511 CE', 'ec', REF)),
    'x-ehc': G('bookcalledinlati00erasuoft', 'Desiderius Erasmus, A Book Called in Latin Enchiridion Militis Christiani, and in English The Manual of the Christian Knight (London: Methuen, 1905; the English of 1533)',
               'Erasmus’s handbook of 1503 for the lay Christian: that the Christian life is a war within, fought with prayer and knowledge of the Scriptures, and that its virtues are inward and not in ceremonies. It is printed in the English of 1533, the translation that has been attributed to William Tyndale. ' + OLD,
               lib=('Enchiridion Militis Christiani: The Manual of the Christian Knight (Erasmus, 1503; English of 1533)', 'ec', '1503 CE', 'ec', REF),
               slice=(r'^\s*THE BOOK SPEAKETH', None), drop=r'^\s*CHAPTER\s+[IVXLCl]+\s+[0-9Iil]+\s*$', split=None),
    'x-utp': G('PG2130', 'Sir Thomas More, Utopia, in Ralph Robinson’s translation of 1551, edited by Henry Morley (Project Gutenberg #2130)',
               'More’s account (1516) of an island commonwealth, whose people hold many religions side by side. The chapter “Of the Religions of the Utopians” describes them, the rule that no one may be punished for his belief, and the limit set to it: a man who denies that the soul lives on and that providence rules the world is shut out from office. A founding text in the history of religious toleration, written by a man who later died for his own faith. ' + OLD,
               lib=('Utopia (Thomas More, 1516; Robinson’s translation of 1551)', 'ec', '1516 CE', 'ec', REF)),
    'x-chu': G('cu31924029478397', 'William Ellery Channing, Unitarian Christianity: A Discourse on Some of the Distinguishing Opinions of Unitarians, delivered at Baltimore, May 5, 1819 (Boston: American Unitarian Association, Centenary Edition, 1919)',
               'The “Baltimore Sermon”, the most important statement of early American Unitarianism: Scripture is to be read by reason, God is one, Jesus is the Son but not equal to the Father, and the aim of faith is the growth of moral character. ' + MOV,
               lib=('Unitarian Christianity (William Ellery Channing, 1819)', 'mo', '1819 CE', 'mod', NEW)),
    'x-tkg': G('PG43302', 'Leo Tolstoy, “The Kingdom of God Is Within You”: Christianity Not as a Mystic Religion but as a New Theory of Life, translated by Constance Garnett (1894; Project Gutenberg #43302)',
               'Tolstoy’s book on non-resistance: that the Sermon on the Mount forbids violence, oaths and war, and that churches and states have hidden this. It was banned in Russia and was read by Gandhi, who said it overwhelmed him. A Christian anarchist’s reading of the Gospels. ' + PER,
               lib=('The Kingdom of God Is Within You (Leo Tolstoy, 1894; trans. Garnett)', 'mo', '1894 CE', 'mod', REF)),
    'x-tcm': G('myconfessionmyre00tols', 'Leo Tolstoy, My Confession, My Religion, The Gospel in Brief (New York: Thomas Y. Crowell, 1899; The Complete Works of Lyof N. Tolstoi)',
               'Three books in which Tolstoy tells of his loss of faith, his despair and his turn to the Gospels: My Confession (1879–82), My Religion (1884, on the five commandments of the Sermon on the Mount he came to hold) and a short harmony of the Gospels with the miracles and the Church’s doctrine left out. The Orthodox Church excommunicated him in 1901. ' + PER,
               lib=('My Confession, My Religion, The Gospel in Brief (Leo Tolstoy, 1879–85)', 'mo', '1879–85 CE', 'mod', REF),
               retitle=_sets(['My Confession', 'My Religion', 'The Gospel in Brief', 'The Gospel in Brief: a summary'], 8)),
}
