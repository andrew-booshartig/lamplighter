"""Specs for rounds 25, 25b and 26 of the collection (24 November 2026): the Samaritans, Isaac of Nineveh, the Irish Dindshenchas, the Maratha poet-saints, Emerson and Thoreau, the Jain volumes
of the Sacred Books of the Jainas, Sayce on Babylonia and Egypt, the Journal of Discourses, and the other rows that the look-up of 24 November resolved (COLLECTION_NEXT.csv, rounds 25, 25b and 26;
COLLECTION_PLAN.md section 13). Listed on the maker's words of 23 November ("keep moving at a rate for that amount of credits") and fetched on his button "Fetch all" the same day: one Internet Archive
scan each (the OCR text, one request at a time, six seconds apart) and Walden from Project Gutenberg. Merged into texts_archive.SPECS (see the end of that file); built with the offline driver
(python3 -I drv25.py ids) or python3 build_texts.py --only=ids.

Read at the title page before building (the plan's rule): two rows of the look-up were dropped because the scan was not what the record said: Wenzel's Suhrllekha is a German article (Journal of the Pali Text
Society, 1886) and the Digital Library of India scan of Stcherbatsky's Conception of Buddhist Nirvana is the revised and enlarged edition of Bharatiya Vidya Prakashan (a modern editor's introduction and corrections;
the 1927 original was not found open).
"""
import re
import build_texts_util as U
from texts_round9 import S, SCH
from texts_round10 import G, FIELD
from texts_round8 import MOV

SPECS = {}
NEW = 'Bahá’í, Theosophy'      # the Path station of the nineteenth-century movements (the Latter-day Saint, Universalist and Unitarian books are read there)
fix = lambda i, **kw: SPECS[i].update(kw)
GOVT = 'Public domain (a publication of the United States Government, first published %s; scan from the Internet Archive; OCR text may contain errors)'
ONE = 'Public domain (scan of an edition first published in %s, from the Internet Archive; OCR text may contain errors)'


def prim(i, idents, by, note, title, when, group, tr, station, tail='', **kw):
    """a text of a tradition or a movement (read on the Path at `station`), or a field record or a book of a shelf-only group when `station` is None"""
    if kw.get('split', 'auto') == 'auto': kw.setdefault('min_chars', 250)
    if kw.get('long_s'): note += ' Eighteenth-century type (with the long s) read by OCR: a repair pass mends the commonest misreadings, but some words are still wrong.'
    SPECS[i] = G(idents, by, (note + ' ' + tail).strip(), lib=(title, group, when, tr, station), **{'split': 'auto', **kw})


def sch(i, idents, by, note, title, when, station, **kw):
    """a study or a history (group sc), shelved at a Path station"""
    if kw.get('split', 'auto') == 'auto': kw.setdefault('min_chars', 250)
    SPECS[i] = G(idents, by, note + ' ' + SCH, lib=(title, 'sc', when, 'sec', station), **{'split': 'auto', **kw})


def fld(i, idents, by, note, title, when, **kw):
    """a field record (group tb; ids start with a-)"""
    if kw.get('split', 'auto') == 'auto': kw.setdefault('min_chars', 250)
    SPECS[i] = G(idents, by, note + ' ' + FIELD, lib=(title, 'tb', when, 'fld', None), **{'split': 'auto', **kw})


# ═══════════════════ The Samaritans ═══════════════════
prim('e-asa', 'in.ernet.dli.2015.515698', 'Moses Gaster (editor and translator), The Asatir: The Samaritan Book of the “Secrets of Moses”, together with the Pitron or Samaritan Commentary and the Samaritan Story of the Death of Moses, published for the first time with introduction, translation and notes (London: Royal Asiatic Society, 1927; printed at Leipzig by August Pries)',
     'The Asatir (“the legends”) is a Samaritan book in Aramaic that retells the history from Adam to the death of Moses, with stories that the Torah does not have; Moses Gaster published it for the first time in 1927, with a long introduction, an English translation, the Pitron (a Samaritan commentary on it) and a Samaritan story of the death of Moses. His introduction argues for a very early date and for the book’s place among the Samaritans’ oldest writings; its date and sources are debated. The Samaritan-script text printed at the end of the volume comes through the OCR as noise and is cut. It reports what the Samaritan tradition holds; the Library neither endorses nor judges it.',
     'The Asatir: The Samaritan Book of the “Secrets of Moses” (Moses Gaster, 1927)', 'date debated; first edition 1927 CE', 'ju', 'ju', 'The Talmud: argument as worship',
     license=ONE % '1927')

sch('x-gas', 'samaritanstheirh00gast', 'Moses Gaster, The Samaritans: Their History, Doctrines and Literature (the Schweich Lectures of the British Academy; London: Oxford University Press for the British Academy, 1925)',
    'Three lectures on the Samaritans by a scholar who had worked on their manuscripts: their history (he treats the Samaritans’ own tradition as reliable history, a position of his that other historians have not all shared), their doctrines and their literature, with an index. The Schweich Lectures are the British Academy’s lectures on biblical archaeology.',
    'The Samaritans: Their History, Doctrines and Literature (Moses Gaster, 1925)', '1925 CE', 'The rabbis and the Mishnah', license=ONE % '1925')

sch('x-smt', 'samaritansearlie00montuoft', 'James A. Montgomery, The Samaritans, the Earliest Jewish Sect: Their History, Theology and Literature (the Bohlen Lectures for 1906; Philadelphia: John C. Winston, 1907)',
    'The Bohlen Lectures of 1906, by a professor of Old Testament at the Philadelphia Divinity School: the European rediscovery of the Samaritans, Samaria and Shechem, the modern community, the origin of the sect, its history under the Greeks, the Romans and Islam, where Samaritans lived, what the Apocrypha, the New Testament, Josephus and the Talmuds say of them, and their theology and literature. A standard English account in its day, written from a Christian scholar’s side; later discoveries (the Dead Sea Scrolls, the excavations on Mount Gerizim) have changed some of it.',
    'The Samaritans, the Earliest Jewish Sect (James A. Montgomery, 1907)', '1907 CE', 'The rabbis and the Mishnah')

# ═══════════════════ Eastern Christians and the Slavs ═══════════════════
prim('e-ini', 'isaac_of_nineveh_mystical_treatises', 'A. J. Wensinck (translator), Mystic Treatises by Isaac of Nineveh, translated from Bedjan’s Syriac text with an introduction and registers (Verhandelingen der Koninklijke Akademie van Wetenschappen te Amsterdam, Afdeeling Letterkunde, Nieuwe Reeks; Amsterdam: Koninklijke Akademie van Wetenschappen, 1923)',
     'Isaac of Nineveh (Isaac the Syrian), a seventh-century Syriac Christian monk and writer, for a short time bishop of Nineveh, whose writings on the ascetic life, on humility, on love and on the knowledge of God have been read in the Syriac, Greek, Slavonic and Arabic churches. Wensinck’s translation, from the Syriac text that Paul Bedjan edited, opens with six treatises on the behaviour of excellence and goes on to short chapters on trust in God and other subjects, with an introduction and registers; the Syriac of the notes comes through the OCR as noise. It is a writer’s account of the ascetic way as his church holds it; the Library neither endorses nor judges it.',
     'Mystic Treatises by Isaac of Nineveh (A. J. Wensinck, 1923)', 'c. 7th c. CE (translation 1923)', 'ec', 'ec', 'Christian mystics and the Jesus Prayer',
     license=ONE % '1923 (a private upload of the Amsterdam edition: read the title page for the printing)')

sch('x-igo', 'taleofarmamentof00magnuoft', 'Leonard A. Magnus (editor and translator), The Tale of the Armament of Igor, A.D. 1185: A Russian Historical Epic, with revised Russian text, translation, notes, introduction and glossary (Publications of the Philological Society; Oxford: Oxford University Press, 1915)',
    'The Old Russian poem on Prince Igor’s raid against the Polovtsy in 1185 and its failure, by an unknown writer who is Christian in outlook but sings in the images of an older Slavic world (the winds, the sun and the old gods, among them Dazhbog and Veles). It is one of the few early written sources that name Slavic gods, which is why the Library keeps it. The one old manuscript was lost in the fire of Moscow in 1812, so the text rests on the first printing of 1800, and some scholars have doubted how old it is; the question is still debated. This is the first English edition of 1915 (the Russian text, a prose translation, notes and a glossary); the Cyrillic comes through the OCR as noise and is cut. It is kept on the Scholarship shelf because it is a scholar’s edition with an introduction and notes.',
    'The Tale of the Armament of Igor (Leonard A. Magnus, 1915)', '1185 CE (edition 1915)', 'Kalevala and the Carmina Gadelica')

# ═══════════════════ Celtic ═══════════════════
prim('x-dns', ['metricaldindsenc02royauoft', 'metricaldindsenc04royauoft'], 'Edward Gwynn (editor and translator), The Metrical Dindshenchas, parts II and IV (Todd Lecture Series; Dublin: Hodges, Figgis, and London: Williams and Norgate, for the Royal Irish Academy)',
     'The Metrical Dindshenchas is the Irish poetry of the lore of places (dindshenchas): each poem tells how a place got its name, and the legends of old Ireland’s gods, heroes and kings (the Tuatha Dé Danann, Medb, the Fianna) hang on the names. Edward Gwynn edited the poems from the medieval manuscripts (the Book of Leinster, the Book of Ballymote, the Rennes manuscript) with an English translation, in five parts from 1903 to 1935; the Archive holds two, part II and part IV, and these are what the Library has. The Irish text, the variant readings and the notes come through the OCR as noise in places; the translations are the English.',
     'The Metrical Dindshenchas, parts II and IV (Edward Gwynn)', 'poems c. 11th–12th c. CE; edition 1906 and 1924', 'ne', 'celt', 'Celtic myth and the monks who wrote it down',
     labels=['Part II', 'Part IV'], license='Public domain (scan of two volumes first published before 1931, from the Internet Archive; OCR text may contain errors)')

# ═══════════════════ the Maratha poet-saints (Abbott) ═══════════════════
prim('x-tuk', 'dli.ernet.238087', 'Justin E. Abbott (translator), Tukaram: A Translation from Mahipati’s Bhaktalilamrita, chapters 25 to 40 (The Poet-Saints of Maharashtra; Poona: Scottish Mission Industries Co., for Dr. Justin E. Abbott, Summit, N. J., 1930)',
     'The life of the Maratha poet-saint Tukaram (1608 to about 1650, by the usual dating) as the poet Mahipati told it in the eighteenth century in the Bhaktalilamrita, chapters 25 to 40, translated by an American missionary who made the series The Poet-Saints of Maharashtra. Mahipati writes devotional biography, not history: the book is full of miracle stories, and Abbott’s preface sets out the historical problems (dates, the details of Tukaram’s death or ascent into heaven) and leaves them open. First published in 1930, it was free of copyright in the United States on 1 January 2026. It reports what the tradition tells; the Library neither endorses nor judges it.',
     'Tukaram: a translation from Mahipati’s Bhaktalilamrita (Justin E. Abbott, 1930)', 'c. 1608–1650 CE (Mahipati, 1774; translation 1930)', 'in', 'bhakti', 'Kabir and the Hatha Yoga Pradīpikā',
     license=ONE % '1930 (free of copyright in the United States on 1 January 2026)')

prim('x-ekn', 'in.ernet.dli.2015.506109', 'Justin E. Abbott (translator), Eknath: A Translation from Mahipati’s Bhaktalilamrita (The Poet-Saints of Maharashtra; Poona: Scottish Mission Industries Co., 1927)',
     'The life of the Maratha poet-saint Eknath (1533 to 1599, by the usual dating) from Mahipati’s Bhaktalilamrita, translated by Justin E. Abbott for his series The Poet-Saints of Maharashtra: his childhood, how he met and served his teacher Janardan, his vision of God on Mount Sulabha, his pilgrimage and wanderings, his marriage and the stories told of his later life, in the chapters 13 to 24 of the Bhaktalilamrita. It is devotional biography written long after its subject, full of miracle stories, and reports what the tradition tells; the Library neither endorses nor judges it.',
     'Eknath: a translation from Mahipati’s Bhaktalilamrita (Justin E. Abbott, 1927)', 'c. 1533–1599 CE (Mahipati, 1774; translation 1927)', 'in', 'bhakti', 'Kabir and the Hatha Yoga Pradīpikā')


# ── helpers shared with round 25c and round 24 ──
from texts_round25c import chaptered, numfix, heading_case, titled     # noqa: E402  (a sectioner that drops a printed contents; numeral fixes; headings in title case)
from texts_round24 import marks                                      # noqa: E402  (a sectioner that cuts the text at named headings, in order)


def after_marks(start, *pairs, lead=None):
    """marks(), but only after the first line matching `start` (the title page, contents and errata before it are dropped)"""
    inner = marks(*pairs, lead=lead)

    def sectioner(t):
        m = re.search(start, t, re.M)
        return inner(t[m.end():] if m else t)
    return sectioner


# ═══════════════════ field records (shelf tb) ═══════════════════
fld('a-raf1', 'b22012382_0001', 'Sir Thomas Stamford Raffles, The History of Java, volume I (London: Black, Parbury and Allen, and John Murray, 1817; the first edition, like the Library’s volume II)',
    'The first of the two volumes of the book by the Lieutenant-Governor of Java under the British occupation of 1811 to 1816: the island and its geography, the origin and condition of its people, agriculture, manufactures and commerce, the government and the character of the Javanese, the ceremonies of the court, births, marriages and funerals, festivals, the drama and the shadow plays (the wayang), the Kawi and the Javanese languages and their literature, music, painting, sculpture, architecture, arithmetic and astronomy. The religion, the history and the antiquities are in volume II, which the Library already holds (a-raf).',
    'The History of Java (Sir T. S. Raffles, 1817), volume I', 'recorded 1811–16 CE', split=chaptered(r'^[ \t]*CHAPTER\s+[IVXL1]+\.?[ \t]*$'), cut_tail=r'^\s*OLDOUT BLANK', license=ONE % '1817')


# ═══════════════════ Transcendentalism ═══════════════════
prim('x-emn', 'natureaddresses01emergoog', 'Ralph Waldo Emerson, Nature; Addresses, and Lectures (Boston and Cambridge: James Munroe and Company, 1849)',
     'The first collection of the lectures and addresses that made Emerson (1803 to 1882) the voice of New England Transcendentalism: Nature (1836), The American Scholar (the Phi Beta Kappa oration of 1837), the Address to the senior class of Divinity College, Cambridge, of 16 July 1838 (the “Divinity School Address”, which criticised the preaching of his day for resting on the miracles and the person of Jesus instead of on each hearer’s own sense of the divine, drew a sharp reply from leading Unitarians, and was followed by almost thirty years in which Harvard did not invite him to speak), Literary Ethics, The Method of Nature, Man the Reformer, the Lecture on the Times, The Conservative, The Transcendentalist and The Young American. They are one writer’s argument for the primacy of each person’s own experience of the divine over inherited forms; the Library neither endorses nor judges it.',
     'Nature; Addresses, and Lectures (Ralph Waldo Emerson, 1849)', '1836–44 CE (collected 1849)', 'mo', 'mod', NEW,
     split=None, trim_index=False,
     sectioner=after_marks(r'^\s*E[BR]RATA\.?\s*$', ('Nature', r'^NATURE\.\s*$'), ('The American Scholar', r'^THE AMERICAN SCHOLAR\.[^\n]{0,6}$'),
                           ('An Address delivered before the senior class in Divinity College, Cambridge, 16 July 1838 (the Divinity School Address)', r'^AN ADDRESS\s*$'),
                           ('Literary Ethics', r'^LITERARY ETHICS\.\s*$'), ('The Method of Nature', r'^THE METHOD OF NATURE\.?\s*$'), ('Man the Reformer', r'^MAN THE REFORMER\.\s*$'),
                           ('Lecture on the Times', r'^LECTURE ON THE TIMES\.\s*$'), ('The Conservative', r'^THE CONSERVATIVE\.\s*$'), ('The Transcendentalist', r'^THE TRANSCENDENTALIST\.\s*$'),
                           ('The Young American', r'^THE YOUNG AMERICAN\.\s*$')),
     cut_tail=r'^\s*JAMES MUNROE AND COMPANY,\s*$', license=ONE % '1849')

WALDEN = (('Economy', r'^Economy$'), ('Where I Lived, and What I Lived For', r'^Where I Lived, and What I Lived For$'), ('Reading', r'^Reading$'), ('Sounds', r'^Sounds$'), ('Solitude', r'^Solitude$'),
          ('Visitors', r'^Visitors$'), ('The Bean-Field', r'^The Bean-Field$'), ('The Village', r'^The Village$'), ('The Ponds', r'^The Ponds$'), ('Baker Farm', r'^Baker Farm$'), ('Higher Laws', r'^Higher Laws$'),
          ('Brute Neighbors', r'^Brute Neighbors$'), ('House-Warming', r'^House-Warming$'), ('Former Inhabitants; and Winter Visitors', r'^Former Inhabitants;? and Winter Visitors$'), ('Winter Animals', r'^Winter Animals$'),
          ('The Pond in Winter', r'^The Pond in Winter$'), ('Spring', r'^Spring$'), ('Conclusion', r'^Conclusion$'), ('On the Duty of Civil Disobedience', r'^ON THE DUTY OF CIVIL DISOBEDIENCE$'))
prim('x-wal', 'PG205', 'Henry David Thoreau, Walden, and On the Duty of Civil Disobedience (Boston: Ticknor and Fields, 1854; the essay first printed in 1849)',
     'Thoreau’s account of the two years and two months (1845 to 1847) he lived in a cabin he built at Walden Pond near Concord, Massachusetts, as an experiment in living simply and deliberately, with the essay (first printed in 1849 as “Resistance to Civil Government”) in which he explains why he refused to pay a poll tax, in protest against slavery and the Mexican War. Thoreau, a friend of Emerson’s, was one of the writers of the Transcendentalist circle. It is a work of literature and philosophy and not a scripture: the Library holds it with the Transcendentalists’ books for its place in that circle and presents it as one writer’s account of his own experience.',
     'Walden, and On the Duty of Civil Disobedience (Henry David Thoreau, 1854)', '1845–54 CE', 'mo', 'mod', NEW,
     license='Public domain (typed text from Project Gutenberg, first published 1854)', clean_scan=False, trim_index=False, trim_front=False, trim_back=False, split=None,
     sectioner=after_marks(r'^\s*_?"I do not propose to write an ode to dejection', *WALDEN))


# ═══════════════════ Bureau of American Ethnology bulletins (United States Government publications; shelf tb) ═══════════════════
GOVT_LIC = 'Public domain (a publication of the United States Government, first published %s; the Internet Archive’s copy carries a copyright review finding it in the public domain according to the HathiTrust rights database; scan from the Internet Archive; OCR text may contain errors)'
fld('a-yum', 'yumanyaquimusic00dens', 'Frances Densmore, Yuman and Yaqui Music (Smithsonian Institution, Bureau of American Ethnology, Bulletin 110; Washington: Government Printing Office, 1932)',
    'The songs of a group of tribes of the lower Colorado River and north-western Mexico, as Frances Densmore recorded them in 1922: the Yuma and Mohave near Fort Yuma, California, the Cocopa near Somerton, Arizona, and the Yaqui at Guadalupe village near Phoenix. She witnessed a cremation among the Yuma and important dances among the other peoples, and the book gives the songs with the singers’ explanations of them, in staff notation and analysed (the notation comes through the OCR as noise; the words about the songs and the ceremonies are what the Library keeps). These are songs of living peoples, written down by a visitor for a government bureau.',
    'Yuman and Yaqui Music (Frances Densmore, 1932)', 'recorded 1922 CE; published 1932', license=GOVT_LIC % '1932')

fld('a-men', 'menomineemusic00dens', 'Frances Densmore, Menominee Music (Smithsonian Institution, Bureau of American Ethnology, Bulletin 102; Washington: Government Printing Office, 1932)',
    'The songs of the Menominee of Wisconsin, recorded by Frances Densmore in 1925, 1928 and 1929 at Keshena, Neopit and Zoar, with an account of the ceremonies and customs they belong to: adoption dances, the gift of medicine to the Menominee, hunting and war bundles, a boy’s fast and dream songs, the medicine lodge, the treatment of the sick, the legends of Manabus, the drum religion and its songs, the tobacco dance, and a list of the plants used in healing. The musical notation comes through the OCR as noise; the accounts of the ceremonies are what the Library keeps. These are songs of a living people, written down by a visitor for a government bureau.',
    'Menominee Music (Frances Densmore, 1932)', 'recorded 1925–29 CE; published 1932', license=GOVT_LIC % '1932')

fld('a-sou', 'sourcematerialfo00swan', 'John R. Swanton, Source Material for the Social and Ceremonial Life of the Choctaw Indians (Smithsonian Institution, Bureau of American Ethnology, Bulletin 103; Washington: Government Printing Office, 1931)',
    'The Bureau’s ethnologist gathers what earlier writers (French, English and American, from the seventeenth century on) and the Choctaw themselves reported of the tribe of the Gulf region: a historical sketch and the origin legend, their material condition, social organization, government, property, crime and punishment, the rules for women and childbirth, personal names, education, marriage, the division of labour between the sexes, games, travel and greetings, war customs, burial customs, and religion and medicine.',
    'Source Material for the Social and Ceremonial Life of the Choctaw Indians (John R. Swanton, 1931)', 'accounts of the 17th–19th c. CE; published 1931', license=GOVT_LIC % '1931')

fld('a-ori', 'originmythofacom00stir', 'Matthew W. Stirling (collector), Origin Myth of Acoma and Other Records, annotated and edited by Leslie A. White (Smithsonian Institution, Bureau of American Ethnology, Bulletin 135; Washington: Government Printing Office, 1942)',
    'The origin myth of the Pueblo of Acoma in New Mexico and other records taken down for the Bureau of American Ethnology from the people of Acoma (with about seventy songs, sung chiefly by a man of Santa Ana Pueblo, recorded for the Bureau and transcribed by Frances Densmore), annotated and edited by the anthropologist Leslie A. White, who had long studied the Keres. The Library holds the text; the songs’ musical notation comes through the OCR as noise. It is a tradition of a living people, written down by outsiders for a government bureau.',
    'Origin Myth of Acoma and Other Records (Matthew W. Stirling, 1942)', 'recorded in the 20th c. CE; published 1942', license=GOVT_LIC % '1942')


# ═══════════════════ the radicals of 1649 (movements, station NEW) ═══════════════════
def _coppe(t):
    """the text of the 1649 print: the scan is a facsimile of 1973 whose publisher's bibliographical note (a modern note) comes after the first title page; both are left out and the print is taken from its second title page"""
    m = re.search(r'^\s*BIBLIOGRAPHICAL NOTE\s*$', t, re.M)
    m2 = re.compile(r'^\s*JUDGEMENT\.', re.M).search(t, m.end()) if m else None
    return [['A Fiery Flying Roll', t[m2.start():] if m2 else t]]

prim('x-cpp', 'fieryflyingroll00coppuoft', 'Abiezer Coppe (“Auxilium Patris”), A Fiery Flying Roll: A Word from the Lord to All the Great Ones of the Earth, whom this may concerne, being the last Warning Piece at the dreadfull day of Judgement, with another Flying Roll ensuing (London, 1649/50; the scan is the facsimile published by the Rota at the University of Exeter, 1973)',
     'The best-known writing of a Ranter: an ecstatic prophecy by Abiezer Coppe (1619 to 1672) that God, “that mighty Leveller”, is coming to level the great ones of the earth, and that the sectaries’ churches are no better; the second part is another “flying roll” to all the inhabitants of the earth. It was printed in January 1650; the House of Commons ordered it searched out and burned in February 1650, and an act of August 1650 against “atheistical, blasphemous and execrable opinions” was aimed chiefly at the Ranters. Coppe withdrew some of his opinions in 1651. Historians still argue how far the Ranters were a movement at all and how much of the name came from their opponents. The text is that of 1649 in its old spelling and type; the 1973 publisher’s note, which is a modern work, is left out.',
     'A Fiery Flying Roll (Abiezer Coppe, 1649)', '1649–50 CE', 'mo', 'mod', NEW, long_s=True, split=None, trim_index=False, trim_front=False, trim_back=False, sectioner=_coppe,
     license='Public domain (the text of a 1649 print; the scan is a 1973 facsimile whose modern bibliographical note is left out; from the Internet Archive; OCR text may contain errors)')

# ═══════════════════ the Church: Benedict, Cyril and Gregory ═══════════════════
prim('e-bn2', 'ruleofstbenedict0000unse_h4o5', 'D. Oswald Hunter Blair (translator), The Rule of Saint Benedict: Latin text with an English translation, third edition revised and corrected (Fort Augustus: Abbey Press, 1914)',
     'The Rule of Saint Benedict (about 530), the short book of seventy-three chapters that became the pattern of monastic life in the West: the abbot, obedience, silence, humility, the hours of prayer, work, reading, hospitality and the order of the day. The Library already holds a modern translation (e-ben, Doyle 1948, whose clearance rests on a copyright that was not renewed); this is the translation of a Benedictine of Fort Augustus, printed in 1914 with the Latin on facing pages, and its date alone puts it in the public domain. The Latin is left out; the introductory pages, including the translator’s foreword to the third edition, are kept. It is the Rule as the Benedictine monks hold it; the Library neither endorses nor judges it.',
     'The Rule of Saint Benedict (D. Oswald Hunter Blair, 1914)', 'c. 530 CE (translation 1914)', 'ec', 'ec', 'Augustine and Benedict', license=ONE % '1914')

# ═══════════════════ Buddhist meditation, a Telugu poet-sage and the fables of India ═══════════════════
prim('x-mmy', 'manualofmysticbe00wood', 'F. L. Woodward (translator), Manual of a Mystic: being a translation from the Pali and Sinhalese work entitled The Yogavachara’s Manual, edited with an introductory essay by Mrs. Rhys Davids (London: published for the Pali Text Society by Humphrey Milford, Oxford University Press, 1916)',
     'A short Pali and Sinhalese handbook of Buddhist meditation from Ceylon, known from a single manuscript found at Bambaragalla Vihara in Teldeniya in 1892 and edited in Pali by T. W. Rhys Davids; it sets out, for the “yogavachara” (the one who practises meditation), the stages of calm and insight, the subjects of meditation and the signs and states that the practice is said to bring. Frank Lee Woodward, principal of Mahinda Buddhist College at Galle, translated it for the Pali Text Society, and C. A. F. Rhys Davids wrote an introductory essay. It reports a Buddhist school’s account of its own practice; the Library neither endorses nor judges it.',
     'Manual of a Mystic: the Yogavachara’s Manual (F. L. Woodward, 1916)', 'a Ceylon manual (date uncertain); translation 1916 CE', 'bu', 'pali', 'The Buddha: the first sermon, breath and kindness',
     cut_tail=r'^\s*(?:PALI TEXT SOCIETY|Date Due|THE PALI TEXT SOCIETY)', license=ONE % '1916')

prim('x-vem', 'in.ernet.dli.2015.367308', 'Charles Philip Brown (translator), The Verses of Vemana, with an English translation (Madras: Adi Saraswati Nilayam Press, 1911; Brown’s translation was first published in 1829)',
     'A selection of the short Telugu epigrams of Vemana, a poet-sage of South India whose dates are uncertain (the seventeenth or eighteenth century), in the English prose of C. P. Brown, the East India Company servant who gathered them from manuscripts in the 1820s: the religious, moral and satirical verses (Brown left out the mystic and the miscellaneous ones). Vemana attacks idol-worship, caste, pilgrimage and priestly pretension and praises the knowledge of the self; his verses are among the best-known in Telugu. Brown’s preface describes how he collected and ordered them. The Telugu text, where the scan prints it, comes through the OCR as noise.',
     'The Verses of Vemana (C. P. Brown, 1829; 1911 edition)', 'date uncertain (c. 17th–18th c. CE); translation 1829', 'in', 'bhakti', 'Kabir and the Hatha Yoga Pradīpikā', license=ONE % '1829 (this printing 1911)')

prim('t-pan', 'Panchatantra_Arthur_W_Ryder', 'Arthur W. Ryder (translator), The Panchatantra (Chicago: The University of Chicago Press, 1925; the scan is of the printing of 1935)',
     'The best-known Indian collection of tales, the animal fables, in five books (the loss of friends, the winning of friends, crows and owls, loss of gains, ill-considered action), told in prose and verse as lessons in conduct and statecraft for three princes. It travelled from Sanskrit into Pahlavi, Arabic (as Kalila and Dimna) and then most of the languages of Asia and Europe, and many of its stories have Buddhist and Jain versions. The stories are secular in intent; the Library keeps the collection with the folk tales of Asia. Arthur W. Ryder (1877 to 1938) translated the verse into rhyme.',
     'The Panchatantra (Arthur W. Ryder, 1925)', 'compiled before c. 550 CE; translation 1925', 'ta', 'ftl', None, license=ONE % '1925')
SPECS['t-pan'].update(min_chars=250)

# ═══════════════════ the Jain volumes (Sacred Books of the Jainas, 1917 and 1920) ═══════════════════
prim('x-tat', 'in.ernet.dli.2015.287470', 'Umasvami (Umasvati), Tattvarthadhigama Sutra (A Treatise on the Essential Principles of Jainism), with introduction, translation, notes and commentary by J. L. Jaini (The Sacred Books of the Jainas, volume II; Arrah: The Central Jaina Publishing House, 1920)',
     'The Tattvartha Sutra of Umasvati (Umasvami), a Sanskrit compendium of about three hundred and fifty short aphorisms in ten chapters that sets out in order the Jain path: right faith, knowledge and conduct; the soul and what is not soul; the inflow and binding of karma, its stopping and shedding; and liberation. Jains of both great branches treat it as a standard statement of their teaching, and the date of its author is placed between the second and fifth centuries CE. This is the translation and commentary of J. L. Jaini, a barrister and former judge of the High Court at Indore, published as the second volume of the Sacred Books of the Jainas; the commentary is his own reading. It fills the Library’s catalogue entry for the Tattvartha Sutra, which had no text.',
     'Tattvartha Sutra (Umasvati), with J. L. Jaini’s translation and commentary (Sacred Books of the Jainas, vol. 2, 1920)', 'c. 2nd–5th c. CE (translation 1920)', 'ja', 'jain', 'The Gupta age: Yoga Sūtras, Purāṇas and Tamil wisdom',
     license=ONE % '1920 (to be confirmed on the title page)')

prim('x-jn1', 'in.ernet.dli.2015.91410', 'Nemichandra Siddhanta-Chakravarti, Dravya-samgraha, with the Sanskrit commentary (vritti) of Brahmadeva, edited with introduction, translation and notes by Sarat Chandra Ghoshal (The Sacred Books of the Jainas, volume I; Arrah: The Central Jaina Publishing House, 1917)',
     'The Dravya-samgraha (“compendium of substances”) of Nemichandra, a Jain teacher of the Digambara tradition (of the tenth century by the usual dating): a short Prakrit poem on the substances of which the world is made (the soul, matter, the principles of motion and rest, space and time) and on the categories of the path to liberation, with the Sanskrit commentary of Brahmadeva, translated and annotated by Sarat Chandra Ghoshal for the first volume of the Sacred Books of the Jainas. It reports what the Jain tradition teaches; the Library neither endorses nor judges it.',
     'Dravya-samgraha (Nemichandra), in the Sacred Books of the Jainas, vol. 1 (Sarat Chandra Ghoshal, 1917)', 'c. 10th c. CE (translation 1917)', 'ja', 'jain', 'Mahavira and the Jain way',
     license=ONE % '1917')

# ═══════════════════ the Hermetic shelf (he; ids h-) ═══════════════════
prim('h-her3', 'hermetica0003walt', 'Walter Scott (editor and translator), Hermetica: The Ancient Greek and Latin Writings which contain Religious or Philosophic Teachings ascribed to Hermes Trismegistus, volume III: Notes on the Latin Asclepius and the Hermetic Excerpts of Stobaeus, completed after Scott’s death by A. S. Ferguson (Oxford: Clarendon Press, 1926)',
     'The commentary volume of the standard English edition of the Hermetica: Walter Scott’s notes on the Latin Asclepius and on the excerpts from the Hermetic writings that the fifth-century anthologist Stobaeus preserved, with discussion of the text, the sources of its ideas (Greek philosophy, Egyptian religion, Judaism) and its meaning, finished by A. S. Ferguson after Scott’s death (preface dated 1 March 1926). It is a commentary: the Greek and Latin texts it discusses are in the first volume of the edition, which the Library has not found open; the Greek and Latin quotations come through the OCR as noise. Scott’s theories about the text (including his rearrangement of passages) are his own; the Library presents them as his.',
     'Hermetica, volume III: Notes on the Asclepius and the Stobaean Excerpts (Walter Scott, 1926)', 'texts of the 2nd–4th c. CE; edition 1926', 'he', 'her', None, license=ONE % '1926')

prim('h-chd', 'chaldanoraclesv00theugoog', 'G. R. S. Mead (translator and commentator), The Chaldaean Oracles, volume I (Echoes from the Gnosis, vol. VIII; London and Benares: Theosophical Publishing Society, 1908)',
     'The Chaldaean Oracles are hexameter verses, known only as fragments quoted by the Neoplatonists (Proclus, Porphyry, Iamblichus and others), who treated them as divine revelation; they are usually dated to the second century CE and tied to two teachers named Julian, “the Chaldaean” and “the Theurgist”, and their doctrine of the Fire, the Father, the triad and the soul’s ascent belongs to the late-antique world of Hermetic and Platonist theology. G. R. S. Mead, the Theosophical Society’s scholar of the Gnostics, gathers the fragments by subject (the supreme principle, the monad and dyad, the triple world, the seven firmaments, the cosmic egg and others) with his comments, in the first of the two volumes of his series Echoes from the Gnosis; the second volume (the rest of the oracles, the Hymn of the Soul and some Orphic fragments) is a separate scan that the Library has not taken. Mead wrote for readers of his society and reads the Oracles as gnostic teaching; the Library presents his reading as his.',
     'The Chaldaean Oracles, volume I (G. R. S. Mead, 1908)', 'c. 2nd c. CE (Mead, 1908)', 'he', 'her', None, license=ONE % '1908')

# ═══════════════════ the one volume of the second Nicene series the Library lacked ═══════════════════
prim('e-m07', 'niceneandpostnic07unknuoft', 'S. Cyril of Jerusalem: Catechetical Lectures, translated by Edwin Hamilton Gifford; S. Gregory Nazianzen: Select Orations, translated by Charles Gordon Browne and James Edward Swallow (A Select Library of Nicene and Post-Nicene Fathers of the Christian Church, second series, vol. 7, ed. Philip Schaff and Henry Wace; Oxford: Parker, and New York: Christian Literature Company, 1890–1900; this volume: in the second series)',
     'The one volume of the second series that the Library did not have. Cyril of Jerusalem’s Catechetical Lectures (about 350) were given to the candidates for baptism at Jerusalem and then to the newly baptised: on the creed, article by article, and on baptism, anointing and the Eucharist as the church of Jerusalem celebrated them; Edwin Hamilton Gifford revised an earlier translation (the Oxford “Library of the Fathers” of 1838, with Newman’s preface) and wrote a long introduction on the rites. Gregory of Nazianzus (about 329 to 390), bishop of Constantinople, called “the Theologian”, is represented by a selection of his orations, translated by C. G. Browne and J. E. Swallow, with introductions and notes. They are the writings of two bishops of the fourth century as their church holds them; the Library neither endorses nor judges them.',
     'Cyril of Jerusalem and Gregory Nazianzen: select writings (NPNF II, vol. 7)', 'c. 350–390 CE', 'ec', 'ec', 'The desert fathers and mothers')

# ═══════════════════ Italic religion ═══════════════════
sch('x-osc', 'grammarofoscanum00buckuoft', 'Carl Darling Buck, A Grammar of Oscan and Umbrian, with a Collection of Inscriptions and a Glossary (Boston: Ginn and Company, 1904)',
    'The standard English grammar of two ancient languages of Italy that were closely related to Latin, with the inscriptions that survive. The Library keeps it for the Iguvine Tables of Gubbio (Iguvium): seven bronze tablets of about the third to the first centuries BCE that record the rituals, sacrifices, processions and prayers of a priestly brotherhood (the Atiedian brethren) and are the longest surviving text of Italic religion. Buck prints the text of the tables with notes. It is a grammar: the Oscan and Umbrian words come through the OCR as ordinary letters, and the explanations are in English.',
    'A Grammar of Oscan and Umbrian (Carl Darling Buck, 1904)', '1904 CE (inscriptions of c. 300–1 BCE)', 'Isis and the Neoplatonists', license=ONE % '1904')

# ═══════════════════ Babylonia, Egypt, the Hittites (Sayce) and the cuneiform inscriptions and the Old Testament (Schrader) ═══════════════════
sch('x-sbr', 'lecturesontheori00saycuoft', 'A. H. Sayce, Lectures on the Origin and Growth of Religion as Illustrated by the Religion of the Ancient Babylonians (the Hibbert Lectures, 1887; London: Williams and Norgate, 1887–88)',
    'The Hibbert Lectures of 1887, by the Oxford Assyriologist Archibald Henry Sayce (1845 to 1933), an early English account of the religion of Babylonia drawn from the cuneiform tablets then newly read: an introduction (the age and character of the materials, the connection between Babylonian and Hebrew religion), Bel-Merodach of Babylon, the gods of Babylonia, the sacred books of Chaldaea, and cosmogonies and astro-theology, with appendices. Much has been revised since (the dates he gives, such as 3700 BCE for Sargon of Accad, and his views of the borrowing between Babylonian and Hebrew religion); the Library presents it as the state of knowledge in 1887.',
    'The Religion of the Ancient Babylonians: the Hibbert Lectures of 1887 (A. H. Sayce)', '1887 CE', 'Sumer: the first gods in writing', license=ONE % '1887–88')

sch('x-syh', 'hittitesstoryoff00saycuoft', 'A. H. Sayce, The Hittites: The Story of a Forgotten Empire (By-Paths of Bible Knowledge; London: The Religious Tract Society, 1890)',
    'A short book of eight chapters in the Religious Tract Society’s series “By-Paths of Bible Knowledge”: the Hittites of the Bible, the Hittites on the monuments of Egypt and Assyria, the Hittite monuments, their migration, their cities and race, Hittite religion and art, the inscriptions, and trade and industry. It was written before the clay-tablet archives of Boghazköy were found (1906) and before the Hittite language was read (1915), so its picture of the Hittites and its reading of the hieroglyphic inscriptions have since been replaced; the Library holds it as an early English account of what the monuments seemed to show. The Library also has Garstang’s The Hittite Empire (1929).',
    'The Hittites: The Story of a Forgotten Empire (A. H. Sayce, 1890)', '1890 CE', 'Ugarit: the Baal Cycle', license=ONE % '1890')

prim('h-pym', 'b2487839x', 'John Everard (translator), The Divine Pymander of Hermes Mercurius Trismegistus, in seventeen books (London, 1650); reprinted London: George Redway, 1884, with an introduction and preliminary essay by Hargrave Jennings (a private edition of 200 copies printed at Bath for subscribers)',
     'The first English translation of the main Hermetic writings (the Pymander, that is Poimandres, and other treatises of the Corpus Hermeticum), made by the clergyman John Everard, chiefly from the Latin of Marsilio Ficino, and published in 1650; it is the version through which the Hermetic tradition reached English readers before the twentieth-century editions, and it lies behind much later occult writing. The Library already holds a modern translation of the Corpus Hermeticum (x-herm). The title page repeats the claim of 1650 that the work was first put from the Arabic into Greek; scholars take the Greek writings of Roman Egypt (about the first to the third century CE) to be the oldest form, and the Arabic story to be a later tradition. The reprint opens with an introduction and preliminary essay by Hargrave Jennings, a writer on the Rosicrucians; they are Jennings’s views, not scholarship, and the Library presents them as his.',
     'The Divine Pymander of Hermes Trismegistus (John Everard, 1650; 1884 reprint)', 'texts of c. 1st–3rd c. CE; English 1650', 'he', 'her', None, license=ONE % '1650 (this reprint 1884)')

sch('x-sae', 'religionsofancie00saycuoft', 'A. H. Sayce, The Religions of Ancient Egypt and Babylonia (the Gifford Lectures delivered in the University of Aberdeen; Edinburgh: T. & T. Clark, 1902)',
    'Twenty lectures in two parts by the Oxford Assyriologist A. H. Sayce. Part I, on ancient Egypt: the imperishable part of man and the other world, the sun-god and the Ennead, animal worship, the gods, Osiris and the Osirian faith, the sacred books, the popular religion, and the place of Egyptian religion in the history of theology. Part II, on the Babylonians: primitive animism, the gods of Babylonia, the sun-god and Ishtar, Sumerian and Semitic conceptions of the divine (Assur and monotheism), cosmologies, the sacred books, the myths and epics, the ritual of the temple, and astro-theology and the moral element. He had lectured on the Babylonians fifteen years earlier (the Library holds the Hibbert Lectures of 1887); here he reads both religions as stages in the history of human thought about God, in the manner of the Gifford series, and much of the Egyptian and Babylonian evidence has been reread since.',
    'The Religions of Ancient Egypt and Babylonia: the Gifford Lectures (A. H. Sayce, 1902)', '1902 CE', 'Egypt: the Pyramid Texts', license=ONE % '1902')

fld('a-saf', 'usefulplantsofis00saffrich', 'William Edwin Safford, The Useful Plants of the Island of Guam, with an introductory account of the physical features and natural history of the island, of the character and history of its inhabitants, and of their agriculture (Contributions from the United States National Herbarium, vol. IX; Washington: Government Printing Office, 1905)',
     'A government botany that the Library keeps for its long introduction: historical notices of Guam (Magellan and the Dutch, the Jesuit missionaries and the conquest of the natives, the visits of English and French ships), the island’s climate, vegetation and animals, and “The People”: the aboriginal Chamorros (their physical characteristics, economy, arts, navigation, mental and moral characteristics, social institutions and customs, religion and superstitions, and language) and the modern inhabitants, with the island’s agriculture. The rest is the catalogue of the useful plants, with the Chamorro names and uses. Safford (1859 to 1926) was a naval officer and botanist who was lieutenant-governor of Guam in 1899 and 1900. It reports what an American official learned and read about a people who had been under Spanish rule for more than two centuries; the Library holds it as an outside record of the older Chamorro religion and customs.',
     'The Useful Plants of the Island of Guam (William Edwin Safford, 1905)', 'recorded 1899–1900 CE from earlier sources; published 1905', license=GOVT_LIC % '1905')

sch('x-scu', ['cuneiforminscrip01schruoft', 'cuneiforminscrip02schruoft'], 'Eberhard Schrader, The Cuneiform Inscriptions and the Old Testament, translated from the second enlarged German edition with additions by the author, and an introductory preface by the Rev. Owen C. Whitehouse, two volumes (Theological Translation Fund Library; London: Williams and Norgate, 1885–88)',
    'The standard nineteenth-century handbook on what the cuneiform inscriptions of Assyria and Babylonia say that bears on the Old Testament, taken book by book in the order of the Bible (Genesis, with the Babylonian accounts of the creation and the flood, and then on through the historical books and the prophets), with the inscriptions translated and Schrader’s comments; his reading of the names, the dates and the borrowings has been revised many times since. Eberhard Schrader (1836 to 1908) was professor of oriental languages at Berlin; Whitehouse, professor of Hebrew at Cheshunt College, translated it and added a preface. The Library also holds Rogers’s Cuneiform Parallels to the Old Testament (1912).',
    'The Cuneiform Inscriptions and the Old Testament (Eberhard Schrader, 1885–88), two volumes', '1885–88 CE', 'Sumer: the first gods in writing', license=ONE % '1885–88')


# ═══════════════════ fixes after the first builds (24 November 2026) ═══════════════════
from texts_round24 import english_lines                                  # noqa: E402  (drops the lines that are not English: the Irish, Russian, Latin or Samaritan facing a translation)
english_only = lambda label: (lambda t: [[label, english_lines(t)]])

fix('a-raf1', split=None, sectioner=chaptered(r'^[ \t]*CHAPTER\s+[IVXL1]+\.?[ \t]*$'))
fix('e-asa', split=None, cut_head=r'^\s*PREFACE\s*$')
fix('x-gas', split=None, sectioner=titled(['FIRST LECTURE', 'SECOND LECTURE', 'THIRD LECTURE'], after='INDEX'), cut_tail=r'^\s*INDEX\s*$')
fix('x-smt', retitle=numfix)
fix('e-ini', cut_head=r'^\s*The fear of God is the foundation of excellence')
fix('x-igo', split=None, sectioner=english_only('The Tale of the Armament of Igor'))
fix('x-dns', split=None, sectioner=english_only('The Metrical Dindshenchas'))
fix('x-tuk', cut_tail=r'^\s*L\.B\.S\. National Academy')
fix('x-ekn', cut_tail=r'^\s*(?:L\.B\.S\. National Academy|This book is to be returned)')
fix('a-yum', cut_tail=r'^\s*INDEX\s*$')
fix('a-men', cut_tail=r'^\s*INDEX\s*$')
fix('a-sou', cut_head=r'^\s*INTRODUCTION\s*$', cut_tail=r'^\s*INDEX\s*$')
fix('a-ori', cut_head=r'^\s*ORIGIN MYTH OF ACOMA AND OTHER RECORDS\s*$', cut_tail=r'^\s*Zl 3ALV1d')
fix('e-bn2', split=None, sectioner=lambda t: chaptered(r'^[ \t]*CHAPTER\s+[IVXL1]+\.?[ \t]*$')(english_lines(t)), cut_tail=r'^\s*(?:AUTHOR\b|DATE DUE|GRADUATE THEOLOGICAL)')
fix('x-mmy', split=None, sectioner=lambda t: [['Manual of a Mystic', re.sub(r'(?ms)^\s*CONTENTS\s*$.*?(?=^\s*PREAMBLE\s*$)', '', t, count=1)]], cut_tail=r'^\s*INDEXES\s*$')
fix('t-pan', split=None, sectioner=marks(('Translator’s introduction', r"^\s*TRANSLATOR'S INTRODUCTION\s*$"), ('Book I: The Loss of Friends', r'^\s*BOOK I\s*$'), ('Book II: The Winning of Friends', r'^\s*BOOK II\s*$'),
                                             ('Book III: Crows and Owls', r'^\s*BOOK III\s*$'), ('Book IV: Loss of Gains', r'^\s*BOOK IV\s*$'), ('Book V: Ill-considered Action', r'^\s*BOOK V\s*$')))
fix('x-tat', split=None)
fix('x-jn1', split=None)
fix('h-her3', split=None, sectioner=marks(('Notes on the Latin Asclepius (with the preface)', r'^\s*PREFACE\s*$'), ('Notes on the Hermetic Excerpts of Stobaeus', r'^\s*STOBAEUS, EXCERPTS FROM HERMETICA')))
fix('h-chd', split=None, cut_head=r'^\s*INTRODUCTION\.?\s*$', cut_tail=r'^\s*P[KR]INT[BE]D\s+BY')
fix('e-m07', split=None)
fix('x-osc', split=None, cut_tail=r'^\s*PHOTOGRAPH OF')
fix('x-sbr', split=None)
fix('x-sae', min_chars=1500)
fix('a-saf', split=None)
fix('x-scu', split=None)
fix('h-pym', cut_tail=r'^\W*(?:THE\s+THEOSOPHIST|The\s+Theosophist)')

# second round of fixes: the index heading carries a page number in the raw scan, so match it loosely
_IDX = r'^\s*INDEX\b[^\n]{0,14}$'
fix('a-yum', cut_tail=_IDX)
fix('a-men', cut_tail=_IDX)
fix('a-sou', cut_tail=_IDX)
fix('a-ori', cut_tail=r'^\s*BUREAU OF AMERICAN ETHNOLOGY BULLETIN 135 PLATE')
fix('x-sbr', cut_tail=_IDX)
fix('x-scu', cut_tail=_IDX)
fix('x-mmy', trim_front=False)


def rough(i, sentence):
    """say in the note what the OCR does to this text"""
    SPECS[i]['note'] = SPECS[i]['note'].rstrip() + ' ' + sentence


rough('x-jn1', 'The OCR of the transliterated Sanskrit and Prakrit is rough (more than a quarter of the words are not in the vocabulary), and the Sanskrit text and the long index of names are kept as the scan gives them.')
rough('x-tat', 'The OCR of the transliterated Sanskrit is rough (about a fifth of the words are not in the vocabulary).')
rough('x-osc', 'About a third of the words are Oscan and Umbrian forms that no English vocabulary knows, so the share of “unknown” words is high; the plates at the end come through as noise.')
rough('x-dns', 'About a fifth of the words are Irish forms and names that no English vocabulary knows.')
rough('h-her3', 'About a fifth of the words are Greek and Latin quotations read as noise.')
rough('x-igo', 'About a sixth of the words are Russian forms in Roman letters and names.')
rough('a-saf', 'The plant list is full of Latin names and Chamorro words, so many of the words are not in the English vocabulary.')


# ═══════════════════ the Journal of Discourses (round 25b), one text for each of the 26 volumes ═══════════════════
import difflib                                                         # noqa: E402


def _jod_norm(l):
    l = re.sub(r'[^A-Za-z ,.\-]', '', l).strip()
    return re.sub(r'\s+', ' ', l).upper().rstrip('.,').strip()


def _jod_title(raw):
    s = re.sub(r'[*†‡§¶<>|=_~^]+', '', raw)
    s = re.sub(r'^[\s\-—–]+|[\s\-—–,.;:]+$', '', s)
    s = re.sub(r'\s+\d{1,3}$', '', s).strip(' ,.;:—-')
    return heading_case(s) if s else 'Discourse'


def _jod_sections(t, minlen=4000):
    """The discourses of a volume of the Journal of Discourses: each discourse carries its title as a running head on every page, so a title that appears again and again in capitals starts a section, and the running head of the journal itself
    (“Journal of Discourses”) is ignored; a section shorter than `minlen` is joined to the one before it"""
    heads = []; pos = 0
    for ln in t.split('\n'):
        s = ln.strip(); n = len(ln) + 1
        letters = sum(c.isalpha() for c in s)
        if 10 <= len(s) <= 75 and letters >= 8 and sum(c.isupper() for c in s) >= 0.75 * letters:
            nn = _jod_norm(s)
            if len(nn) >= 8 and 'JOURNAL' not in nn and 'DISCOURSES' not in nn and not re.fullmatch(r'(?:VOL(?:UME)?\.? ?[IVXL]+|[IVXL]+)\.?', nn): heads.append((pos, nn, s))
        pos += n
    secs = []; cur = None
    for i, (p, nn, raw) in enumerate(heads):
        if cur and difflib.SequenceMatcher(None, cur[1], nn).ratio() >= 0.6: continue
        recur = sum(1 for q, mm, _ in heads[i + 1:i + 8] if difflib.SequenceMatcher(None, nn, mm).ratio() >= 0.6)
        if recur >= 1 or not cur:
            cur = [p, nn, raw]; secs.append(cur)
    out = []
    for k, (p, nn, raw) in enumerate(secs):
        end = secs[k + 1][0] if k + 1 < len(secs) else len(t)
        if out and end - p < minlen: out[-1][3] = end; continue
        out.append([_jod_title(raw), '', p, end])
    for o in out: o[1] = t[o[2]:o[3]]
    if out and out[0][2] < 1500 and out[0][3] - out[0][2] < 40000: out[0][0] = 'Title page, contents and the first discourse' if re.search(r'(?i)\b(?:a discourse|discourse by|remarks by|an address|a sermon)\b', out[0][1]) else 'Title page and contents'
    return [[o[0], o[1]] for o in out if o[1].strip()]


# the volumes cover 1852 to 1886 in all; the title page and the dates printed over each discourse give a volume’s own years (the years are not listed here because the scan’s OCR of those dates is unreliable)
JOD_NOTE = ('Volume %d of the Journal of Discourses, the sermons and addresses of Brigham Young and the other leaders of the Church of Jesus Christ of Latter-day Saints, taken down in shorthand and printed in Liverpool and London for the church’s members in Britain '
            '(twenty-six volumes, 1854 to 1886, with discourses from 1852 on). They are what these leaders said in their pulpits at the time, on every subject of church life (doctrine, scripture, the gathering to Utah, plural marriage, tithing, the mission fields, public events); '
            'some of the teachings reported in it were later set aside or disavowed by the church (among them the Adam–God teaching, and plural marriage, which the church ended in 1890 and 1904). The Library holds them as the sermons of one church’s leaders and not as its scripture, '
            'reports what was said, and neither endorses nor judges it: the church’s own present statements are the place to see what it teaches. Each discourse is a section named by the title that runs at the head of its pages; the titles are as the scan gives them.%s')
for _n in range(1, 27):
    _extra = (' Volume 1 includes the address on celestial marriage given at the special conference of August 1852, at which the church first publicly acknowledged the practice of plural marriage.' if _n == 1 else '')
    prim('x-jd%02d' % _n, 'JoDV%02d' % _n, 'Journal of Discourses, volume %d, the sermons of Brigham Young and other leaders of the Church of Jesus Christ of Latter-day Saints, reported in shorthand (Liverpool and London: Latter-day Saints’ Book Depot, 1854–86)' % _n,
         JOD_NOTE % (_n, _extra), 'Journal of Discourses, volume %d of 26 (Latter-day Saint leaders’ sermons)' % _n, 'sermons of 1852–86 CE', 'mo', 'mod', NEW,
         split=None, min_chars=250, sectioner=_jod_sections, license=ONE % '1854–86')
