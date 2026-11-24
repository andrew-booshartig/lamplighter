"""Manifest of public-domain texts (mostly Project Gutenberg) mapped to library entries. build() returns {library_id: entry}.
Each entry: secs=[[heading, text]], by, license, src, verse, note. Everything here was published before 1929 (public domain in the US) or
is explicitly cleared by Project Gutenberg. Translators are credited so each edition can be found."""
import re

PG_LICENSE = 'Public domain (text from Project Gutenberg)'

# id → spec. Keys: pg (list of Gutenberg numbers, concatenated), by, slice=(start_regex, end_regex), split=regex for headings, verse, note, title_prefix
GUTENBERG = {
    # Second Temple / Jewish / Christian
    'p-jos': dict(pg=[2848, 2850], by='William Whiston’s translation of Josephus (1737; Antiquities of the Jews and The Wars of the Jews)'),
    'e-aug': dict(pg=[3296], by='E. B. Pusey (1838), The Confessions of St. Augustine', split=r'^BOOK\s+[IVXLC]+\b.*$'),
    'e-ben': dict(pg=[50040], by='St. Benedict’s Rule for Monasteries (translated by Leonard J. Doyle, 1948)'),
    'e-jul': dict(pg=[52958], by='Revelations of Divine Love by Julian of Norwich (Grace Warrack, 1901)'),
    'e-pis': dict(pg=[76266], by='Pistis Sophia (translated by George Horner, 1924)'),
    'e-mish': dict(pg=[8547], by='Joseph I. Gorfinkle, Pirke Avot: The Sayings of the Jewish Fathers (1913)', note='Only the tractate Avot (Ethics of the Fathers) of the Mishnah, not the whole Mishnah.'),
    # Mesopotamia / Egypt
    'x-gil': dict(pg=[7096], by='E. A. Wallis Budge, The Babylonian Story of the Deluge and the Epic of Gilgamish (1920)', note='An older English prose translation of the Assyrian epic with commentary; modern translations differ in many places.'),
    'x-enu': dict(pg=[9914], by='E. A. Wallis Budge, The Babylonian Legends of the Creation (1921)', note='Includes the Enūma Eliš (creation epic) in an older translation with commentary.'),
    'x-ham': dict(pg=[17150], by='C. H. W. Johns, The Oldest Code of Laws in the World (1903)'),
    'x-bod': dict(pg=[7145], by='E. A. Wallis Budge, The Book of the Dead (1895; the papyrus of Ani)'),
    'x-pta': dict(pg=[30508], by='Battiscombe G. Gunn, The Instruction of Ptah-Hotep and the Instruction of Ke’Gemni (1906)'),
    'x-kyb': dict(pg=[14209], by='Three Initiates, The Kybalion (1908)', note='A modern (1908) text that claims Hermetic origins; it is not an ancient source.'),
    # India
    'x-gita': dict(pg=[2388], by='Sir Edwin Arnold, The Song Celestial (1885)', verse=True),
    'x-upa': dict(pg=[3283], by='Swami Paramananda, The Upanishads (1919–1920)', note='The Isha, Katha and Kena Upanishads, with Paramananda’s commentary, in a devotional translation (volume 1 of his two). The other principal Upanishads are in Max Müller’s translation, each as its own Library entry.'),
    'x-yog': dict(pg=[2526], by='Charles Johnston, The Yoga Sutras of Patanjali: The Book of the Spiritual Man (1912)'),
    'x-kab': dict(pg=[6519], by='Rabindranath Tagore (translator), with an introduction by Evelyn Underhill, Songs of Kabir (1915)', verse=True),
    'x-mbh': dict(pg=[15474, 15475, 15476, 15477], by='Kisari Mohan Ganguli, The Mahabharata (1883–1896)', note='The complete Mahabharata in prose, including the Bhagavad Gita (Bhishma Parva) and the Anushasana Parva (Book 13).'),
    # Buddhist
    'x-dhp': dict(split=r'^Chapter [IVX]+\.[^\n]*$', pg=[2017], by='F. Max Müller, The Dhammapada (Sacred Books of the East, vol. 10, 1881)'),
    'x-ls': dict(pg=[79267], slice=(r'\A', r'^\s*INDEX\s+Abundant'), by='W. E. Soothill, The Lotus of the Wonderful Law (1930)', note='A translation of the Lotus Sutra with introduction.'),
    # China
    'x-dao': dict(split=r'^Ch\. \d+\.', pg=[216], by='James Legge, The Tao Teh King (Sacred Books of the East, vol. 39, 1891)'),
    'x-zhu': dict(pg=[59709], by='Herbert A. Giles, Chuang Tzŭ: Mystic, Moralist, and Social Reformer (1889)'),
    'x-ana': dict(pg=[3330], slice=(r'^THE CHINESE CLASSICS', None), by='James Legge, The Analects of Confucius (The Chinese Classics, 1861)'),
    # Greece and Rome
    'x-hom': dict(pg=[1727, 2199], by='Samuel Butler (prose translations): The Odyssey (1900) and The Iliad (1898)'),
    'x-hes': dict(pg=[348], by='Hugh G. Evelyn-White, Hesiod, the Homeric Hymns and Homerica (Loeb, 1914)', slice=(r'^THE THEOGONY$', r'^THE HOMERIC HYMNS$'), note='Theogony, Works and Days, the Shield of Heracles and the other Hesiodic fragments in Evelyn-White’s Loeb translation.'),
    'x-hhd': dict(pg=[348], by='Hugh G. Evelyn-White, Hesiod, the Homeric Hymns and Homerica (Loeb, 1914)', slice=(r'^II\. TO DEMETER$', r'^III\. TO DELIAN APOLLO'), note='The Homeric Hymn to Demeter.'),
    'x-pla': dict(pg=[1658, 1600, 1497, 1572], by='Benjamin Jowett (Phaedo, Symposium, Republic, Timaeus)', note='Selected dialogues: Phaedo, Symposium, Republic (with the Myth of Er in Book X) and Timaeus.'),
    'x-vir': dict(pg=[228], by='John Dryden, The Aeneid (1697)', verse=True, split=r'^BOOK\s+[IVXLC]+\b.*$'),
    'x-ovi': dict(pg=[21765, 26073], by='Henry T. Riley, The Metamorphoses of Ovid (1851)', split=r'^BOOK\s+THE\s+[A-Z]+\b.*$|^BOOK\s+[IVXLC]+\b.*$'),
    'x-epi': dict(pg=[10661], by='George Long, A Selection from the Discourses of Epictetus with the Encheiridion (1877)'),
    'x-cle': dict(pg=[871], by='Hastings Crossley, The Golden Sayings of Epictetus, with the Hymn of Cleanthes (1903)'),
    'x-mar': dict(pg=[2680], by='George Long, The Meditations of Marcus Aurelius (1862)', split=r'^(?:BOOK|THE)\s+[IVXLC]+\b.*$'),
    'x-apu': dict(pg=[1666], by='William Adlington (1566), The Golden Ass of Apuleius'),
    'x-plo': dict(pg=[42930, 42931, 42932, 42933], by='Kenneth S. Guthrie, Plotinos: Complete Works (1918)'),
    # Islam / Persia
    'x-qur': dict(pg=[2800], by='J. M. Rodwell, The Koran (1861; in chronological order)', note='Rodwell’s 19th-century translation arranges the suras in an approximate chronological order, not the traditional order.'),
    'x-rum': dict(pg=[61724], by='James W. Redhouse, The Mesnevi of Mevlana Jelalu-’d-Din Muhammed er-Rumi, Book the First (1881)'),
    'x-haf': dict(pg=[74883], by='Gertrude Lowthian Bell, Poems from the Divan of Hafiz (1897)', verse=True),
    # Norse, Celtic, Finnish
    'x-poe': dict(pg=[14726], by='Benjamin Thorpe and I. A. Blackwell (Norroena Society, 1906), The Elder Eddas of Saemund Sigfusson', slice=(r'^VÖLUSPÂ\. THE VALA', r'^THE YOUNGER EDDAS OF STURLESON\.'), split=r"^(?:VÖLUSPÂ\.[^\n]*|THE (?:FIRST |SECOND |THIRD |GROENLAND )?LAY OF[^\n]*|THE JOURNEY OR LAY[^\n]*|FRAGMENTS OF[^\n]*)$", verse=True, note='The Poetic (Elder) Edda in a Victorian translation, from the Völuspá to the Lay of Hamdir.'),
    # each part (Foreword, The Fooling of Gylfe, Brage’s Talk, …) restarts at CHAPTER I, so a chapter is named with the title line under it
    'x-pre': dict(pg=[18947], by='Rasmus B. Anderson, The Younger Edda, also called Snorre’s Edda, or the Prose Edda (1880)',
                  split=r'^(?:(?:CHAPTER [IVXLC]+\.|AFTERWORD|EXTRACTS FROM)[ \t]*\n\s*\n[ \t]*)?[A-ZÆÖ][A-ZÆÖÂ’\'\-, ().]{2,60}\.\)?(?:\[\d+\])?$'),
    'x-bew': dict(split=r'^[IVXL]{1,6}\s*$', pg=[981], by='Francis B. Gummere, Beowulf (1910)', verse=True),
    'x-kal': dict(split=r'^RUNE [IVXL]+\.$', pg=[5186], by='John Martin Crawford, The Kalevala: The Epic Poem of Finland (1888)', verse=True),
    'x-mab': dict(pg=[5160], by='Lady Charlotte Guest, The Mabinogion (1849)'),
    'x-tain': dict(pg=[14391], by='Lucy Winifred Faraday, The Cattle-Raid of Cualnge (Táin Bó Cúalnge) (1904)'),
    # Apostolic Fathers (Roberts–Donaldson, 1870)
    'e-1cl': dict(pg=[77576], by='Ante-Nicene Christian Library, vol. 1: The Apostolic Fathers (translated by Alexander Roberts, James Donaldson and F. Crombie, 1870)', slice=(r'^\s*THE FIRST EPISTLE OF CLEMENT TO THE CORINTHIANS\.\[1\]', r'^\s*THE SECOND EPISTLE OF CLEMENT\.\s*$')),
    'e-2cl': dict(pg=[77576], by='Ante-Nicene Christian Library, vol. 1: The Apostolic Fathers (translated by Alexander Roberts, James Donaldson and F. Crombie, 1870)', slice=(r'^\s*THE SECOND EPISTLE OF CLEMENT\.\[259\]', r'^\s*THE EPISTLE OF POLYCARP\.\s*$')),
    'e-pol': dict(pg=[77576], by='Ante-Nicene Christian Library, vol. 1: The Apostolic Fathers (translated by Alexander Roberts, James Donaldson and F. Crombie, 1870)', slice=(r'^\s*THE EPISTLE OF POLYCARP TO THE PHILIPPIANS\.\[316\]', r'^\s*THE MARTYRDOM OF POLYCARP\.\s*$')),
    'e-bar': dict(pg=[77576], by='Ante-Nicene Christian Library, vol. 1: The Apostolic Fathers (translated by Alexander Roberts, James Donaldson and F. Crombie, 1870)', slice=(r'^\s*THE EPISTLE OF BARNABAS\.\[457\]', r'^\s*THE EPISTLES OF IGNATIUS\.\s*$')),
    'e-ign': dict(pg=[77576], by='Ante-Nicene Christian Library, vol. 1: The Apostolic Fathers (translated by Alexander Roberts, James Donaldson and F. Crombie, 1870)', slice=(r'^\s*THE EPISTLE OF IGNATIUS TO THE EPHESIANS\.\s*$', r'^\s*THE EPISTLE TO DIOGNETUS\.\s*$'), note='All seven letters in the shorter (Greek) and longer recensions, with the Martyrdom of Ignatius.'),
    'e-dio': dict(pg=[77576], by='Ante-Nicene Christian Library, vol. 1: The Apostolic Fathers (translated by Alexander Roberts, James Donaldson and F. Crombie, 1870)', slice=(r'^\s*THE EPISTLE TO DIOGNETUS\.\s*$', r'^\s*THE PASTOR OF HERMAS\.\s*$')),
    'e-her': dict(pg=[77576], by='Ante-Nicene Christian Library, vol. 1: The Apostolic Fathers (translated by Alexander Roberts, James Donaldson and F. Crombie, 1870)', slice=(r'^\s*THE PASTOR OF HERMAS\.\s*$', r'^FRAGMENTS OF PAPIAS\.\s*$')),
    # Added in the second batch
    'e-did': dict(pg=[42053], by='Roswell D. Hitchcock and Francis Brown, Teaching of the Twelve Apostles (Scribner, 1884)', note='The Didache in English translation, with the editors’ introduction and notes.'),
    'e-tal': dict(pg=[14368], slice=(r'^THE TALMUD\b', r'^THE KABBALA\b'), by='Maurice H. Harris, Hebraic Literature: Translations from the Talmud, Midrashim and Kabbala (1901)', note='An anthology: selections from the Talmud and the Midrashim in English. It is not the whole Talmud, which has no public-domain English translation to include.'),
    'e-zoh': dict(pg=[14368], slice=(r'^THE KABBALA\b', r'^THE DAY OF ATONEMENT'), by='Maurice H. Harris, Hebraic Literature: Translations from the Talmud, Midrashim and Kabbala (1901)', note='Only the Kabbala section of an anthology: selections from the mystical literature in English. It is not the whole Zohar, which has no public-domain English translation to include.'),
    'x-pur': dict(pg=[66208], by='Manmatha Nath Dutt, A Prose English Translation of Vishnupuranam (1896), based on H. H. Wilson’s translation', split=r'^PART [IVX]+\.(?= SECTION I\.)', note='The Vishnu Purana, one of the eighteen major Puranas, in six parts. The Bhāgavata Purana is not included.'),
    'x-ram': dict(pg=[24869], verse=True, slice=(r'^BOOK I\.\(6\)', r'\Znever'), split=r'^BOOK [IVX]+\.(?:\(\d+\))?', by='Ralph T. H. Griffith, The Rámáyan of Válmíki translated into English verse (1870–74)', note='All six books in Griffith’s verse translation; the numbers in brackets are his note markers.'),
    'x-can': dict(pg=[12219], by='Daniel G. Brinton, Ancient Nahuatl Poetry (Brinton’s Library of Aboriginal American Literature, no. 7, 1887)', note='Twenty-seven Nahuatl songs from the Cantares Mexicanos with Brinton’s English translations, introduction and notes. Read it knowing it is a nineteenth-century scholar’s rendering.'),
    'x-her': dict(pg=[67097], slice=(r'^\s*CHAPTER III\s*$', r'^\s*CHAPTER V\s*$', 1), by='John Burnet, Early Greek Philosophy (chapters III and IV: Herakleitos of Ephesos and Parmenides of Elea)', note='Burnet’s translations of the fragments with his commentary; the other early Greek philosophers in his book are not included.'),
    'z-jam': dict(pg=[621], by='William James, The Varieties of Religious Experience: A Study in Human Nature (the Gifford Lectures, 1901–02)', split=r'^(?:LECTURES? [IVXL]+(?:, [IVXL]+, AND [IVXL]+| AND [IVXL]+)?\.[^\n]*|POSTSCRIPT\.)\s*$', note='A study aid in the Library: a classic of the psychology of religion.'),
    'z-dur': dict(pg=[41360], by='Émile Durkheim, The Elementary Forms of the Religious Life (translated by Joseph Ward Swain, 1915)', split=r'^(?:BOOK [IVX]+|INTRODUCTION|CONCLUSION)\s*$', note='A study aid in the Library: the foundational sociological account of religion, built on Aboriginal Australian ethnography of its day.'),
    'e-clx': dict(pg=[71937, 73020], by='William Wilson, The Writings of Clement of Alexandria (Ante-Nicene Christian Library, 1867–1869)', note='Exhortation to the Heathen, The Instructor, the Miscellanies (Stromata) and more: a window on how educated Christians read scripture and philosophy together c. 200 CE.'),
    'e-ori': dict(pg=[70561, 70693], by='Frederick Crombie and W. H. Cairns, The Writings of Origen (Ante-Nicene Christian Library, 1869–1872)', note='On First Principles and Against Celsus: the earliest systematic Christian theology and its reply to a pagan critic.'),
    'e-hip': dict(pg=[65478, 67116], by='Francis Legge, Philosophumena, or The Refutation of All Heresies (1921)', note='Hippolytus of Rome (attributed): a hostile but detailed account of Greek philosophy, mystery cults and Gnostic schools, quoting many texts now lost.'),
    'x-sum': dict(pg=[31935], by='Stephen Langdon, Sumerian Liturgies and Psalms (University of Pennsylvania Museum, 1917)', note='Sumerian and Akkadian texts in transliteration with Langdon’s English translations. The reader’s “English only” setting hides the transliterations.'),
    'x-shy': dict(pg=[48094], by='Frederick Augustus Vanderburgh, Sumerian Hymns from Cuneiform Texts in the British Museum (1908)', note='Hymns to Sumerian gods in transliteration with English translations. The reader’s “English only” setting hides the transliterations.'),
    # Modern
    'x-fox': dict(pg=[75559, 75590], by='The Journal of George Fox (edited by Daniel Pickard; first published 1694)', note='The Quaker founder’s journal, in two volumes.'),
    'x-blv': dict(pg=[54824, 54488, 56880, 61626], by='H. P. Blavatsky, The Secret Doctrine (1888)', note='Read critically: a Theosophical work of 1888 that claims ancient sources whose existence scholars question.'),
    # Americas
    'x-pop': dict(pg=[56550], by='Lewis Spence, The Popol Vuh: The Mythic and Heroic Sagas of the Kichés of Central America (1908)', note='A retelling and study of the Popol Vuh rather than a line-by-line translation; modern translations are closer to the K’iche’ text.'),
}


def build(lib, fetch, CACHE):
    import build_texts_util as U
    res = {}
    try: res.update(U.enoch_entries(fetch, CACHE))
    except Exception as ex: print('  FAILED enoch', ex)
    for lid, spec in GUTENBERG.items():
        if lid not in lib: continue
        try: res[lid] = U.gutenberg_entry(fetch, CACHE, spec)
        except Exception as ex: print('  FAILED', lid, ex)
    return res
