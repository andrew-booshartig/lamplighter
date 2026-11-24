"""Specs for further open (pre-1931) English translations from the ancient world: Egypt, Mesopotamia, Persia, the Gnostics and Mandaeans, Greece and Rome.
Merged into texts_archive.SPECS (see the end of that file) and built with python3 build_texts.py --only=ids. An ident 'PG123' is Project Gutenberg #123; the
rest are Internet Archive items. Sources were found by searching the Internet Archive and Project Gutenberg on 16 November 2026 and fetched on the maker's
instruction to "keep going and find more texts" (after "find everything you can and get them all").

Each spec may carry lib=(title, group, when, tr, station title prefix): the Library line and the Path station for an id that is not in the Library yet. The
builder ignores it. An id with no lib already has its Library entry.
"""
import re

OLD = 'An older translation: its readings of the grammar and the names of the gods are a century or more out of date, and later scholars have corrected many of them. Read it as a document of its time and set a recent translation beside it.'


def G(idents, by, note='', lib=None, **kw):
    d = dict(idents=idents if isinstance(idents, list) else [idents], by=by, note=note, trim_index=True, trim_front=True, trim_back=True, split='auto')
    if lib: d['lib'] = lib
    d.update(kw)
    return d


SPECS = {
    # ── Egypt ──
    'x-are': G('BreastedJ.H.AncientRecordsEgyptAll5Vols1906',
               'James Henry Breasted, Ancient Records of Egypt: Historical Documents from the Earliest Times to the Persian Conquest, 5 vols. (Chicago: University of Chicago Press, 1906–07)',
               'All five volumes in one scan: the inscriptions the Egyptians cut in stone, in order of dynasty (volumes 1–4), with Breasted’s introductions and footnotes, and the index (volume 5). Royal annals, temple endowments, tomb biographies, hymns and the king’s dealings with the gods. ' + OLD,
               lib=('Ancient Records of Egypt (Breasted, 1906–07): the royal, temple and tomb inscriptions, with the Merneptah stele', 'eg', 'c. 3000–525 BCE', 'egy', 'Merneptah and the first'), trim_index=False, trim_front=False, slice=(r'\A', r'^VOLUME V\s*$')),
    'x-erm': G('in.ernet.dli.2015.532519', 'Adolf Erman, The Literature of the Ancient Egyptians: Poems, Narratives, and Manuals of Instruction from the Third and Second Millennia B.C., translated by Aylward M. Blackman (London: Methuen, 1927)',
               'The tales (Sinuhe, the Shipwrecked Sailor, the Herdsman, the magicians at Cheops’s court), the books of wisdom (Ptahhotep, Kagemni, Amenemhet’s teaching, Merikere, Any and others), the laments and prophecies, the hymns to the gods and the king, and the Aten hymn, in Blackman’s English with Erman’s introductions. The Library already has Ptahhotep and Amenemope on their own.',
               lib=('The Literature of the Ancient Egyptians (Erman, trans. Blackman, 1927): tales, wisdom books, laments, hymns', 'eg', 'c. 2500–1000 BCE', 'egy', 'Amenemope and Proverbs')),
    'x-ehh': G(['theegyptianheave01budgiala', 'egyptianheavenhe0002budg', 'egyptianheavenhe0003budg'], 'E. A. Wallis Budge, The Egyptian Heaven and Hell, 3 vols. (London: Kegan Paul, 1905–06)',
               'The Egyptian guides to the other world carved in the royal tombs: the Book of Am-Tuat (Amduat; volume 1), the Book of Gates (volume 2) and the shorter forms and the tomb scenes (volume 3), each with Budge’s translation of the hieroglyphs and his comments. ' + OLD,
               labels=['Volume 1 · the Book of Am-Tuat', 'Volume 2 · the Book of Gates', 'Volume 3 · short forms and the later books'],
               lib=('The Egyptian Heaven and Hell (Budge, 1905–06): the Book of Am-Tuat and the Book of Gates', 'eg', 'c. 1500–1000 BCE', 'egy', 'The Coffin Texts and the weighing')),
    'x-lgd': G('PG9411', 'E. A. Wallis Budge, Legends of the Gods: The Egyptian Texts, edited with translations (London: Kegan Paul, 1912; Project Gutenberg #9411)',
               'Hieroglyphic texts with Budge’s English: the myths of Ra and Isis (the secret name), the destruction of mankind, the creation, the war of Horus and Set, the birth of Horus and others. The hieroglyph transcriptions are not in this typed copy. ' + OLD,
               lib=('Legends of the Gods (Budge, 1912): Isis and the secret name of Ra, the destruction of mankind, creation, Horus and Set', 'eg', 'c. 1300–300 BCE', 'egy', 'The Coffin Texts and the weighing')),
    'x-osr': G(['osirisegyptianre00budg', 'OsirisTheEgyptianResurrectionVol.2ErnestAlfredThompsonWallisBudge1911'], 'E. A. Wallis Budge, Osiris and the Egyptian Resurrection, 2 vols. (London: Philip Lee Warner, 1911)',
               'Budge’s account of the god who dies and lives again, from the Pyramid Texts to the Greek and Roman age, with many passages translated: the hymns to Osiris, the festivals, the mysteries at Abydos, and what the dead hoped for. Largely a retelling and commentary, with translated sources throughout. ' + OLD,
               labels=['Volume 1', 'Volume 2'],
               lib=('Osiris and the Egyptian Resurrection (Budge, 1911): hymns, rites and beliefs, with the sources translated', 'eg', 'c. 2400 BCE – 400 CE', 'egy', 'Isis and the Neoplatonists')),
    'x-goe': G(['godsofegyptianso00budg', 'godsofegyptianso02budg'], 'E. A. Wallis Budge, The Gods of the Egyptians, or Studies in Egyptian Mythology, 2 vols. (London: Methuen, 1904)',
               'An encyclopaedic account of the gods god by god (Amen-Ra, Osiris, Isis, Horus, Thoth, Hathor and the rest), with a great many hymns and spells translated from the monuments and papyri. A survey, but a rich one. ' + OLD,
               labels=['Volume 1', 'Volume 2'],
               lib=('The Gods of the Egyptians (Budge, 1904): the gods one by one, with the hymns and spells', 'eg', 'c. 3000 BCE – 400 CE', 'egy', 'Egypt: the Pyramid Texts')),
    'x-etp': G('egyptiantalestra00petruoft', 'W. M. Flinders Petrie (editor), Egyptian Tales Translated from the Papyri, first series: IVth to XIIth Dynasty (London: Methuen, 1895; this reprint 1913)',
               'The Westcar papyrus (the magicians at the court of Cheops), the Shipwrecked Sailor, the Peasant and the Workman, the Adventures of Sanehat (Sinuhe) and other tales, translated by Griffith and others. The second series (the New Kingdom tales) is not in this scan. ' + OLD,
               lib=('Egyptian Tales (Petrie, first series, 1895): Westcar papyrus, Shipwrecked Sailor, Sanehat', 'eg', 'c. 2000–1700 BCE', 'egy', 'Amenemope and Proverbs')),
    'x-msp': G('cu31924091207393', 'Gaston Maspero, Popular Stories of Ancient Egypt, translated by A. S. Johns (London: Grevel, 1915)',
               'Egyptian tales retold from the papyri, among them the Two Brothers, the Doomed Prince, Satni-Khamois (Setne) and the book of Thoth, Sinuhe and the Shipwrecked Sailor, with Maspero’s notes. A literary retelling in places rather than a literal translation. ' + OLD,
               lib=('Popular Stories of Ancient Egypt (Maspero, 1915): the Two Brothers, Khufu and the magicians, Sanehat, Satni-Khamois (Setne)', 'eg', 'c. 2000–300 BCE', 'egy', 'Amenemope and Proverbs')),
    'x-hpm': G('storiesofhighpri00grifuoft', 'F. Ll. Griffith, Stories of the High Priests of Memphis: The Sethon of Herodotus and the Demotic Tales of Khamuas (Oxford: Clarendon Press, 1900)',
               'The Demotic tales of Setne Khaemwese (Khamuas): the book of Thoth, the dead who speak and the journey to the underworld, with the first translations from the Demotic papyri and Griffith’s introduction. Greek-age Egyptian storytelling about magic and the dead. ' + OLD,
               lib=('Stories of the High Priests of Memphis (Griffith, 1900): Satni-Khamois (Setne) and the book of Thoth', 'eg', 'c. 300 BCE – 100 CE', 'egy', 'Isis and the Neoplatonists')),
    'x-cor': G('corysancientfrag00coryuoft', 'Isaac Preston Cory, Ancient Fragments of the Phoenician, Chaldæan, Egyptian, Tyrian, Carthaginian, Indian, Persian and other writers (London: Pickering, 1832; this edition 1876)',
               'What the Greek writers kept of lost native histories: Berossus on Babylon (the creation and the flood), Manetho on Egypt, Sanchoniathon on Phoenicia, Hermes, the Chaldean oracles and others, with Cory’s notes. These are later Greek reports of the originals, and some are doubtful; modern scholars read them with care. ' + OLD,
               lib=('Cory’s Ancient Fragments (1832): Berossus, Manetho, Sanchoniathon and other Hellenistic reports of lost histories', 'gr', 'c. 300 BCE – 300 CE (the originals older)', 'grk', 'Alexandria and the Septuagint')),

    # ── Mesopotamia ──
    'x-har': G('cu31924083983944', 'Robert Francis Harper (editor), Assyrian and Babylonian Literature: Selected Translations (New York: Appleton, 1901)',
               'A general anthology by many hands: the Babylonian accounts of creation and the flood, the Gilgamesh (Nimrod) epic, Adapa and Etana, hymns and prayers, penitential psalms, incantations and royal inscriptions, with introductions. ' + OLD,
               lib=('Assyrian and Babylonian Literature (Harper, 1901): creation, flood, Adapa and Etana, hymns, penitential psalms and incantations', 'me', 'c. 2400–500 BCE', 'mes', 'Atrahasis: the noisy humans')),
    'x-rcp': G('cuneiformparalle00rogerich', 'Robert William Rogers, Cuneiform Parallels to the Old Testament (New York: Eaton & Mains, 1912)',
               'Translations of the Babylonian and Assyrian texts that touch the Bible: the creation epic, the flood story, the myth of Adapa, the Laws of Hammurabi, “The so-called Babylonian Job” and other texts, with Rogers’ introductions. ' + OLD,
               lib=('Cuneiform Parallels to the Old Testament (Rogers, 1912): creation, flood, Adapa, the Babylonian Job and more', 'me', 'c. 2400–500 BCE', 'mes', 'Gilgamesh: fear of death'), slice=(r'^PREFACE\s*$', None), trim_front=False),
    'x-bms': G('babylonianmagics00kinguoft', 'L. W. King, Babylonian Magic and Sorcery, being “The Prayers of the Lifting of the Hand” (London: Luzac, 1896)',
               'Babylonian and Assyrian incantations and magical formulas, the “Prayers of the Lifting of the Hand,” in cuneiform with transliteration, translation, notes and vocabulary. The cuneiform and the transliterations come through as noise. ' + OLD,
               lib=('Babylonian Magic and Sorcery (King, 1896): the “Lifting of the Hand” prayers and incantations', 'me', 'c. 1500–500 BCE', 'mes', 'Ludlul: the just sufferer')),
    'x-dev': G(['devilsevilspirit01thomuoft', 'devilsevilspirit02thomuoft'], 'R. Campbell Thompson, The Devils and Evil Spirits of Babylonia, 2 vols. (London: Luzac, 1903–04)',
               'The Babylonian and Assyrian incantations against evil spirits: the series of the evil spirits (Utukki Limnuti and Asakki Marsuti) in volume 1, and the “Fever Sickness” and “Headache” series and others in volume 2, against the ghouls, vampires, hobgoblins and ghosts that attack mankind, with transliteration, translation and notes. ' + OLD,
               labels=['Volume 1 · the evil spirits', 'Volume 2 · fever sickness, headache and others'],
               lib=('The Devils and Evil Spirits of Babylonia (Thompson, 1903–04): the evil-spirit series, fever, headache, ghosts', 'me', 'c. 2000–500 BCE', 'mes', 'Ludlul: the just sufferer')),
    'x-rma': G('reportsofmagicia00thomuoft', 'R. Campbell Thompson, The Reports of the Magicians and Astrologers of Nineveh and Babylon in the British Museum (London: Luzac, 1900)',
               'The omen reports sent to the Assyrian kings (omens from the moon, the stars, the weather and other signs), in English with the Semitic text beside them; the cuneiform and transliteration come through as noise. ' + OLD,
               lib=('Reports of the Magicians and Astrologers of Nineveh and Babylon (Thompson, 1900): omen letters to the Assyrian kings', 'me', 'c. 700–650 BCE', 'mes', 'Ludlul: the just sufferer')),
    'x-bpp': G('babylonianpenite0000lang', 'Stephen Langdon, Babylonian Penitential Psalms, to which are added fragments of the epic of Creation from Kish (Paris: Geuthner, 1927; Oxford Editions of Cuneiform Texts, vol. 6)',
               'Sumerian and Akkadian psalms of repentance in transliteration and translation, with the fragments of the Creation epic from Kish. The tablets are dense with Sumerian and Akkadian transliteration. ' + OLD,
               lib=('Babylonian Penitential Psalms (Langdon, 1927): psalms of repentance and the Kish creation fragments', 'me', 'c. 1800–500 BCE', 'mes', 'Ludlul: the just sufferer')),
    'x-bmi': G('barton_misc_1918', 'George A. Barton, Miscellaneous Babylonian Inscriptions (New Haven: Yale University Press, 1918)',
               'Early Sumerian texts with translations, including the Barton Cylinder, the oldest known Sumerian account of creation and of the first temple at Nippur, with Barton’s notes. Tablet transliteration comes through as noise in places. ' + OLD,
               lib=('Miscellaneous Babylonian Inscriptions (Barton, 1918): the Barton Cylinder and other Sumerian texts', 'me', 'c. 2400–2000 BCE', 'mes', 'Sumer: the first gods in writing')),
    'x-lud': G('jstor-3260156', 'Morris Jastrow, “A Babylonian Parallel to the Story of Job,” Journal of Biblical Literature 25 (1906), 135–191',
               'The first English study and translation of the Babylonian poem of the righteous sufferer (Ludlul bel nemeqi), who is struck down, loses everything and is restored, with Jastrow’s comparison with Job. Only the poem’s tablets known in 1906 are translated, and Jastrow’s readings have been much improved since; the Babylonian Theodicy is not in this article.',
               trim_index=False, trim_front=False, split=None,
               lib=None),

    # ── Persia ──
    'x-ard': G('bookofardaviraf00haug', 'Martin Haug and E. W. West, The Book of Arda Viraf, the Pahlavi text prepared by Destur Hoshangji Jamaspji Asa, with an English translation and introduction (Bombay and London, 1872)',
               'The Zoroastrian journey through heaven and hell: the righteous Viraf takes a drugged sleep and sees the souls of the good and wicked, with the Pahlavi text, the English translation, the Gujarati version and the editors’ introductions and appendix. The Pahlavi and Gujarati text comes through as noise. ' + OLD,
               lib=('Book of Arda Viraf (Haug and West, 1872): a Zoroastrian journey through heaven and hell', 'ir', 'c. 9th c. CE (older tradition)', 'zor', 'Persia in late antiquity')),
    'x-dab': G('TheDabistan', 'David Shea and Anthony Troyer (translators), The Dabistan, or School of Manners (Paris: Oriental Translation Fund, 1843)',
               'A Persian book of about 1645 on the religions of its age (the Parsis, Hindus, Tibetans, Jews, Christians, Muslims, Sikhs and others), by an unknown author: an early comparative study written by a believer who chose to listen to each faith in its own words. Contains passages from the Dasatir, a work of doubtful origin. Reliable on what its informants told him, not on the early history of each religion. ' + OLD,
               lib=('The Dabistan (Shea and Troyer, 1843): the religions of Persia and India as seen by a 17th-century Persian author', 'ir', 'c. 1645 CE', 'zor', 'Persia in late antiquity')),

    # ── Gnostics and Mandaeans ──
    'e-ffg': G('fragmentsoffaith00meaduoft', 'G. R. S. Mead, Fragments of a Faith Forgotten: Some Short Sketches among the Gnostics, mainly of the First Two Centuries (London: Theosophical Publishing Society, 1906)',
               'A survey of the Gnostic schools (Basilides, Valentinus, Marcion, the Ophites and others) built around translations of what survives and of what the Church fathers reported, with a long section on the Pistis Sophia. Mead was a Theosophist and writes as an admirer; the Nag Hammadi library, found in 1945, has since changed the picture.',
               lib=('Fragments of a Faith Forgotten (Mead, 1906): the Gnostic schools and what survives of their writings', 'ec', 'c. 100–300 CE', 'ec', 'Gnostic and Hermetic worlds')),
    'e-gjb': G('gnosticjohnbapti00mead', 'G. R. S. Mead, The Gnostic John the Baptizer: Selections from the Mandæan John-Book (London: John M. Watkins, 1924)',
               'Selected chapters of the Mandaean “Book of John” (Drashe d-Yahya) in Mead’s English from Lidzbarski’s German, with his introduction: the Mandaean John, who baptizes in running water and is no friend of Jesus, among the Mandaean prophets. The only Mandaean book in English in the Library; Lady Drower’s later translations are still under copyright.',
               lib=('The Gnostic John the Baptizer (Mead, 1924): selections from the Mandaean John-Book', 'ec', 'c. 3rd c. CE (Mandaean tradition older)', 'ec', 'Mani and the religion of light')),
    # ── Egypt: the fuller Book of the Dead ──
    'x-bdt': G(['bookofdeadenglis0001unse', 'bookofdeadenglis0002unse'], 'E. A. Wallis Budge, The Book of the Dead: An English Translation of the Chapters, Hymns, etc., of the Theban Recension, with Introduction, Notes, etc., 2 vols. (London: Kegan Paul, Trench, Trübner, 1901)',
               'Budge’s English of the whole Theban Book of the Dead (the Chapters of Coming Forth by Day), with the hymns, spells and the judgment of the heart, from the papyrus of Ani and others, and his long introduction and notes. Fuller than the papyrus of Ani alone, which is a separate entry. ' + OLD,
               labels=['Volume 1', 'Volume 2'],
               lib=('The Book of the Dead, the Theban recension in English (Budge, 1901), 2 volumes', 'eg', 'c. 1550–50 BCE', 'egy', 'The Coffin Texts and the weighing')),

    # ── Greece and Rome ──
    'x-plm': G(['plutarchsmoralst01plutuoft', 'plutarchsmoralst02plutuoft', 'plutarchsmoralst03plutuoft', 'plutarchsmoralst04plutuoft', 'plutarchsmorals05plut'], 'Plutarch, Plutarch’s Morals, translated from the Greek by several hands, corrected and revised by William W. Goodwin, 5 vols. (Boston: Little, Brown, 1874)',
               'Plutarch’s essays: “On Isis and Osiris,” “Why the Oracles Cease to Give Answers,” “Of the Pythian Oracles,” “On Superstition,” the Roman and Greek questions, the Banquet of the Seven Wise Men and the rest, written in the first and second centuries by a priest of Delphi. A main source for the Greek and Roman view of the gods, and for Egyptian religion as a Greek priest saw it. The essays are in the English of several hands from the 1680s, thoroughly revised by Goodwin.',
               labels=['Volume 1', 'Volume 2', 'Volume 3', 'Volume 4', 'Volume 5'],
               lib=('Plutarch’s Morals (trans. Goodwin, 1874): Isis and Osiris, the oracles at Delphi and the rest, 5 volumes', 'gr', 'c. 90–120 CE', 'grk', 'Isis and the Neoplatonists')),
    'x-cic': G('treatisesofcicer00ciceuoft', 'C. D. Yonge (translator), The Treatises of M. T. Cicero: On the Nature of the Gods; On Divination; On Fate; On the Republic; On the Laws; and On Standing for the Consulship (London: Bohn, 1878)',
               'Cicero’s three dialogues on religion (the Stoic, Epicurean and Academic views of the gods in On the Nature of the Gods; the case for and against divination in On Divination; and On Fate), with his On the Republic and On the Laws, which include his account of the religious law of Rome. ' + OLD,
               lib=('Cicero: On the Nature of the Gods, On Divination, On Fate, On the Laws (trans. Yonge, 1878)', 'gr', '45–44 BCE', 'grk', 'The Stoics and Rome')),
    'x-ovf': G('fastitristiapont00oviduoft', 'Henry T. Riley (translator), The Fasti of Ovid, in The Fasti, Tristia, Pontic Epistles, Ibis and Halieuticon of Ovid, literally translated into English prose (London: Bohn, 1851; this printing 1876)',
               'Ovid’s poem on the Roman religious calendar, month by month from January to June: the feasts, the gods and the stories told about each (Janus, Lupercalia, Terminalia, Vesta, the Parilia and others), with Riley’s notes. The Library’s only Roman calendar. The Tristia and the other poems in the same volume are left out. ' + OLD,
               slice=(r'^THE FASTI;\s*$', r'^THE TRISTIA;\s*$'), trim_index=False, trim_front=False,
               lib=('The Fasti of Ovid (trans. Riley, 1851): the Roman religious calendar, January to June', 'gr', '8 CE', 'grk', 'The Stoics and Rome')),
    'x-pau': G(['PG68946', 'PG68680'], 'Pausanias, Pausanias’ Description of Greece, translated by Arthur Richard Shilleto, 2 vols. (London: Bell, 1886; Project Gutenberg #68946 and #68680)',
               'A travel guide to the Greek world about 170 CE, region by region (Attica, Corinth, Laconia, Messenia, Elis, Achaea, Arcadia, Boeotia, Phocis): every temple, altar, statue and cult, with the myths and the festivals the local priests told him, including a long account of Eleusis and of Delphi. The best single source for what Greek worship looked like on the ground.',
               labels=['Volume 1', 'Volume 2'],
               lib=('Description of Greece (Pausanias, trans. Shilleto, 1886): the temples, cults and festivals of Greece, 2 volumes', 'gr', 'c. 150–175 CE', 'grk', 'The mysteries of Eleusis')),
    'x-hhy': G('PG16338', 'Andrew Lang (translator), The Homeric Hymns: A New Prose Translation, and Essays Literary and Mythological (London: George Allen, 1899; Project Gutenberg #16338)',
               'The thirty-three Homeric Hymns (to Apollo, Hermes, Aphrodite, Demeter, Dionysus and the others, about 700–500 BCE) in prose, with Lang’s essays on their myths. Demeter’s hymn, which tells the story behind the Eleusinian Mysteries, is also in the Library on its own.',
               lib=('The Homeric Hymns (trans. Lang, 1899): the hymns to Apollo, Hermes, Aphrodite, Demeter and others', 'gr', 'c. 700–500 BCE', 'grk', 'Homer and Hesiod')),
}
