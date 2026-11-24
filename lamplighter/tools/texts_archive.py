"""Texts from archive.org scans of public-domain editions (OCR text). Cleaned conservatively: running heads and page numbers are dropped,
hyphenated line breaks are rejoined and paragraphs unwrapped. OCR errors can remain; each entry says it comes from a scan and, where the
edition has an introduction or notes, that they are included."""
import json, re
from collections import Counter
from urllib.parse import quote

LICENSE = 'Public domain (scan of an edition first published before 1930, from the Internet Archive; OCR text may contain errors)'

# Jataka: the heading of each of the 22 books (the scans misspell it: 'BOOK Vlll. — ATTIIA-NIPATA.', 'BOQK XTV.-PAKINNAKA-NTPATA.'), and the running heads
# ('The Jdtaka. Book I.', 'No. 12. 5') that the scans spell a hundred ways, so that clean_ocr's repeated-line test cannot see them.
JATAKA_BOOK_RX = r"^BO[OQ]K\s+[IVXLCT1l]{1,6}[.,]?[\s\-—]*[A-Za-z\-]{2,22}?-?N[IT]PAT[A-Za-z]{0,3}[.,]?\s*$"
JATAKA_DROP = (r"^[^\n]{0,14}\bJ\S{1,8}[.,]?[ \t]+Boo[hkx][.,]?[ \t]+[IVXLCT1l]{1,8}(?:[ \t]?[IVXLCT1l]{1,3})?[.,]?[^\n]{0,6}\n?"
               r"|^[ \t]*No\.[ \t]*\d{1,3}[.,]?[ \t]+\d{1,3}[ \t]*\n?|^[ \t]*No\.[ \t]*\d{1,3}[ \t]*\\[ \t]*\n?")
# Mandukya (Dvivedi): running heads 'INTRODUCTION. XI', 'xlvi INTRODUCTION.' and '12 MANDfiKYOPANlSHAD.'
MANDUKYA_DROP = (r"(?i)^(?:[IVXLU]{1,6}[ \t]+)?INTRODUCTION[.,:]*(?:[ \t]+[IVXLHU]{1,7})?[ \t]*$\n?"
                 r"|^[^\n]{0,14}KYOPAN[A-Za-z ]{2,9}[.*'’\" \t]{0,4}$\n?|^INDEX\.$\n?")
# Puggalapannatti (Law, 1924): each of the ten chapters opens 'CHAPTER IV / DIVISION OF HUMAN TYPES BY FOUR' (the scan reads one numeral as 'II' for III, so the
# chapter number is taken from the word), and the running heads are '12 Designation of Human Types', 'Dwision of Human Types by Two 29', 'The Table of Contents 13' and 'Vill Introduction'. The introduction is cut at the translator's dated signature, before a page of scan noise.
LAW_CHAPTER_RX = r"^CHAPTER\s+[IVXL]{1,5}\s*\n\s*DIVISION OF HUMAN TYPES BY [A-Z]+[ \t]*$"
LAW_DROP = (r"^[ \t]*\d{1,3}[.,]?[ \t]+Designation of Human Types[ \t]*\n?|^[ \t]*D[a-z]{2,5}ion of Human Types by [A-Za-z]+[^\n]{0,8}\n?"
            r"|^[ \t]*The Table of Contents[ \t]+[\dilI1]{1,3}[ \t]*\n?"
            r"|^[ \t]*(?:[ivxlVIl]{1,6}[ \t]+Introduction|Introduction[ \t]+[ivxl1]{1,6})[ \t]*\n?")
LAW_NUMBERS = ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN']
LAW_ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']

SINHA_ORD = {'TENTH': 'X', 'ELEVENTH': 'XI', 'TWELFTH': 'XII'}

def sinha_title(h):
    """'SKANDHA IV.' → 'Skandha IV'; 'THE TENTH SKANDHA.' → 'Skandha X'."""
    m = re.match(r'THE (TENTH|ELEVENTH|TWELFTH) SKANDHA', h)
    if m: return 'Skandha ' + SINHA_ORD[m.group(1)]
    m = re.match(r'SKANDHA ([IVX]+)', h)
    return 'Skandha ' + m.group(1) if m else h


def law_chapter_title(h):
    """'CHAPTER II DIVISION OF HUMAN TYPES BY THREE' → 'Chapter III · Division of human types by three'; the text before chapter I is the homage and the table of contents."""
    m = re.search(r'BY ([A-Z]+)$', h)
    if m and m.group(1) in LAW_NUMBERS:
        return 'Chapter %s · Division of human types by %s' % (LAW_ROMAN[LAW_NUMBERS.index(m.group(1))], m.group(1).lower())
    return 'Homage, and the Table of Contents of the work' if h == 'Introduction' else h

# id → spec: idents (list of archive.org identifiers, concatenated), by, slice=(start_regex, end_regex), note
SPECS = {
    'p-jub': dict(idents=['bookofjubileesor00char'], by='R. H. Charles, The Book of Jubilees, or the Little Genesis (1902)', note='Includes Charles’s introduction and notes.'),
    'p-2en': dict(idents=['bookofsecretsofe00morf'], by='W. R. Morfill and R. H. Charles, The Book of the Secrets of Enoch (2 Enoch, 1896)', note='Includes the editors’ introduction and notes.'),
    'p-t12': dict(idents=['testamentsoftwel00char'], slice=(r'THE TESTAMENTS OF THE TWELVE PATRIARCHS', None), by='R. H. Charles, The Testaments of the Twelve Patriarchs (SPCK, Translations of Early Documents, 1917), with an introduction by W. O. E. Oesterley', note='The English translation with the introduction.'),
    'p-2ba': dict(idents=['theapocalypseofb00charuoft'], by='R. H. Charles, The Apocalypse of Baruch (2 Baruch, 1896)', note='Includes Charles’s introduction and notes.'),
    'p-tmo': dict(idents=['assumptionofmose00unknuoft'], by='R. H. Charles, The Assumption of Moses (1897)', note='Includes Charles’s introduction and notes.'),
    'p-asi': dict(idents=['cu31924014590529'], by='R. H. Charles, The Ascension of Isaiah (1900)', note='Includes Charles’s introduction and notes.'),
    'p-abr': dict(idents=['apocalypseofabra00boxg'], by='G. H. Box, The Apocalypse of Abraham (1918)', note='Includes Box’s introduction and notes.'),
    'p-ode': dict(idents=['odespsalmsofsolo02harruoft'], slice=(r'^INTRODUCTION$', r'^THE PSALMS OF SOLOMON'), by='J. Rendel Harris and Alphonse Mingana, The Odes and Psalms of Solomon, vol. 2: the translation with introduction and notes (Manchester University Press, 1920)', note='The long critical introduction and the forty-two Odes of Solomon in translation, each with notes. The Psalms of Solomon are the next entry.'),
    'p-pss': dict(idents=['odespsalmsofsolo02harruoft'], slice=(r'^THE PSALMS OF SOLOMON', r'^CONCORDANCE TO THE ODES', 1), by='J. Rendel Harris and Alphonse Mingana, The Odes and Psalms of Solomon, vol. 2: the translation with introduction and notes (Manchester University Press, 1920)', note='The eighteen Psalms of Solomon (numbered XLIII–LX in this edition, which counts them after the forty-two Odes) in translation, with notes.'),
    'x-herm': dict(idents=['thricegreatesthe01hermuoft', 'thricegreatesthe02hermuoft', 'thricegreatesthe03hermuoft'], by='G. R. S. Mead, Thrice-Greatest Hermes (1906)', note='Three volumes: Mead’s studies and his translation of the Hermetic treatises, including the Poimandres.'),
    'e-sy': dict(idents=['sepheryetzirahb00rittgoog'], by='W. Wynn Westcott, Sepher Yetzirah: The Book of Formation (1893)'),
    'x-rig': dict(idents=['in.ernet.dli.2015.237767', 'in.ernet.dli.2015.47262'], by='Ralph T. H. Griffith, The Hymns of the Rigveda (1889–1892)'),
    'x-nih': dict(idents=['nihongi1asto', 'nihongi2asto'], by='W. G. Aston, Nihongi: Chronicles of Japan from the Earliest Times to A.D. 697 (1896)'),
    'x-tkr': dict(idents=['tirukkural-tiruvalluvar'], by='G. U. Pope, The Sacred Kurral of Tiruvalluva-Nayanar (1886)'),
    'x-jap': dict(slice=(r'^THE SIKH RELIGION$', None), idents=['thesikhreligion01macauoft'], by='Max Arthur Macauliffe, The Sikh Religion, vol. 1 (1909)', note='Guru Nanak’s life and hymns, including the Japji, in Macauliffe’s translation.'),
    'x-anand': dict(idents=['TheSikhReligionVolII'], by='Max Arthur Macauliffe, The Sikh Religion, vol. 2 (1909)', note='Guru Angad and Guru Amar Das, including the Anand, in Macauliffe’s translation.'),
    'x-bhagat': dict(slice=(r'^ITS GURUS, SACRED WRITINGS AND AUTHORS$', None), idents=['thesikhreligioni06macauoft'], by='Max Arthur Macauliffe, The Sikh Religion, vol. 6 (1909)', note='Includes the hymns of Kabir, Ravidas, Farid and Namdev in Macauliffe’s translation.'),
    'x-ghaz': dict(slice=(r'^WISDOM OF THE EAST THE ALCHEMY OF HAPPINESS', r'^THE WISDOM OF THE EAST$'), idents=['in.ernet.dli.2015.536237'], by='Claud Field, The Alchemy of Happiness by al-Ghazzali (Wisdom of the East series, 1910)'),
    'x-ran': dict(idents=['polynesianmythol00greyuoft'], by='Sir George Grey, Polynesian Mythology and Ancient Traditional History of the New Zealand Race (1855)'),
    'x-glp': dict(slice=(r'^THE CONSTITUTION OF THE FIVE NATIONS$', r'^INDEX$'), idents=['constitutionoffi00parkuoft'], by='Arthur C. Parker, The Constitution of the Five Nations (Iroquois Book of the Great Law, 1916)'),
    'x-hyp': dict(idents=['HathaYogaPradipika-SanskritTextWithEnglishTranslatlionAndNotes'], by='Pancham Sinh, The Hatha Yoga Pradipika (1914)', note='Sanskrit text with English translation and notes.'),
    'x-yi': dict(idents=['mlbd.sacredbooksofeas0000fmax.vol.16'], by='James Legge, The Yi King (Sacred Books of the East, vol. 16, 1882)'),
    'x-ave': dict(idents=['TheZendAvestaPart1TheVendidad', 'zendavesta02darm', 'zendavesta03darm'], by='James Darmesteter and L. H. Mills, The Zend-Avesta (Sacred Books of the East, vols. 4, 23 and 31, 1880–1887)', note='The Vendidad, the Yashts and minor texts, and the Yasna including the Gathas.'),
    'x-bar': dict(idents=['the-tibetan-book-of-the-dead_202401'], by='W. Y. Evans-Wentz (ed.), The Tibetan Book of the Dead (first edition, 1927)'),
    'x-keb': dict(slice=(r'^PREFACE$', r'^INDEX$'), idents=['kebranagast'], by='E. A. Wallis Budge, The Queen of Sheba and her Only Son Menyelek (Kebra Nagast, 1922)'),
    'x-upc': dict(idents=['upanishads01mluoft'], slice=(r'^FIRST PRAPA\S+\.$', r'^talavakAra$', 0, True), by='F. Max Müller, The Upanishads, part 1 (Sacred Books of the East, vol. 1, Oxford: Clarendon Press, 1879)', note='The Chandogya Upanishad, with the “tat tvam asi” teaching of Uddalaka and Shvetaketu. Müller’s translation from the Sanskrit with his footnotes; he cites the commentary of Shankara throughout. A nineteenth-century translation: later translators (Olivelle, for one) read some passages differently.'),
    'x-ukn': dict(idents=['upanishads01mluoft'], slice=(r'^i\. The Pupil asks', r'^AITAREYAARA\S+\.$', 0, True), by='F. Max Müller, The Upanishads, part 1 (Sacred Books of the East, vol. 1, Oxford: Clarendon Press, 1879)', note='The Kena (Talavakara) Upanishad. Müller’s translation from the Sanskrit with his footnotes; he cites the commentary of Shankara throughout. A nineteenth-century translation: later translators (Olivelle, for one) read some passages differently.'),
    'x-uai': dict(idents=['upanishads01mluoft'], slice=(r'^FIRST ARA\S+KA\.$', r'^kaushItaki-\S+\.$', 0, True), by='F. Max Müller, The Upanishads, part 1 (Sacred Books of the East, vol. 1, Oxford: Clarendon Press, 1879)', note='The Aitareya Aranyaka entire, which includes the Aitareya Upanishad (Aranyaka II, 4–6). Müller’s translation from the Sanskrit with his footnotes; he cites the commentary of Shankara throughout. A nineteenth-century translation: later translators (Olivelle, for one) read some passages differently.'),
    'x-uka': dict(idents=['upanishads01mluoft'], slice=(r'^First Adhyaya\. i\. A.itra', r'^VAGASANEYI-SA\S{1,4}HITA$', 0, True), by='F. Max Müller, The Upanishads, part 1 (Sacred Books of the East, vol. 1, Oxford: Clarendon Press, 1879)', note='The Kaushitaki Upanishad. Müller’s translation from the Sanskrit with his footnotes; he cites the commentary of Shankara throughout. A nineteenth-century translation: later translators (Olivelle, for one) read some passages differently.'),
    'x-uis': dict(idents=['upanishads01mluoft'], slice=(r'^i\. All this, whatsoever moves on earth', r'^Sacred Books of the East$', 0, True), by='F. Max Müller, The Upanishads, part 1 (Sacred Books of the East, vol. 1, Oxford: Clarendon Press, 1879)', note='The Isha (Vajasaneyi Samhita) Upanishad, with the appended note. Müller’s translation from the Sanskrit with his footnotes; he cites the commentary of Shankara throughout. A nineteenth-century translation: later translators (Olivelle, for one) read some passages differently.'),
    'x-ukt': dict(idents=['p2upanishads00mluoft'], slice=(r'^FIRST ADHYAYA\. First Valli\.', r'^FIRST MU\S+AKA\.', 0, True), by='F. Max Müller, The Upanishads, part 2 (Sacred Books of the East, vol. 15, Oxford: Clarendon Press, 1884)', note='The Katha Upanishad (Nachiketas and Yama). Müller’s translation from the Sanskrit with his footnotes; he cites the commentary of Shankara throughout. A nineteenth-century translation: later translators (Olivelle, for one) read some passages differently.'),
    'x-umu': dict(idents=['p2upanishads00mluoft'], slice=(r'^FIRST MU\S+AKA\.', r'^TAITTIRIYAKAUPANISHAD\.$', 0, True), by='F. Max Müller, The Upanishads, part 2 (Sacred Books of the East, vol. 15, Oxford: Clarendon Press, 1884)', note='The Mundaka Upanishad. Müller’s translation from the Sanskrit with his footnotes; he cites the commentary of Shankara throughout. A nineteenth-century translation: later translators (Olivelle, for one) read some passages differently.'),
    'x-uta': dict(idents=['p2upanishads00mluoft'], slice=(r'^FIRST VALL\S?,', r'^FIRST ADHYAYAi\.$', 0, True), by='F. Max Müller, The Upanishads, part 2 (Sacred Books of the East, vol. 15, Oxford: Clarendon Press, 1884)', note='The Taittiriya Upanishad. Müller’s translation from the Sanskrit with his footnotes; he cites the commentary of Shankara throughout. A nineteenth-century translation: later translators (Olivelle, for one) read some passages differently.'),
    'x-ubr': dict(idents=['p2upanishads00mluoft'], slice=(r'^FIRST ADHYAYAi\.$', r'^5VETA5VATARA-$', 0, True), by='F. Max Müller, The Upanishads, part 2 (Sacred Books of the East, vol. 15, Oxford: Clarendon Press, 1884)', note='The Brihadaranyaka Upanishad, with the teachings of Yajnavalkya. Müller’s translation from the Sanskrit with his footnotes; he cites the commentary of Shankara throughout. A nineteenth-century translation: later translators (Olivelle, for one) read some passages differently.'),
    'x-usv': dict(idents=['p2upanishads00mluoft'], slice=(r'^FIRST ADHYAYA\. I\. The Brahma-students', r'^PRA\S{1,8}-UPANISHAD$', 0, True), by='F. Max Müller, The Upanishads, part 2 (Sacred Books of the East, vol. 15, Oxford: Clarendon Press, 1884)', note='The Shvetashvatara Upanishad. Müller’s translation from the Sanskrit with his footnotes; he cites the commentary of Shankara throughout. A nineteenth-century translation: later translators (Olivelle, for one) read some passages differently.'),
    'x-upr': dict(idents=['p2upanishads00mluoft'], slice=(r'^First Question\.', r'^MAITR\s*AYA\S*-BRAH\s*MA\S*UPANISHAD\.$', 0, True), by='F. Max Müller, The Upanishads, part 2 (Sacred Books of the East, vol. 15, Oxford: Clarendon Press, 1884)', note='The Prashna Upanishad. Müller’s translation from the Sanskrit with his footnotes; he cites the commentary of Shankara throughout. A nineteenth-century translation: later translators (Olivelle, for one) read some passages differently.'),
    'x-uma': dict(idents=['p2upanishads00mluoft'], slice=(r'^First PRAPA\S+\.$', r'^TRANSLITERATION OF ORIENTAL ALPHABETS\.', 0, True), by='F. Max Müller, The Upanishads, part 2 (Sacred Books of the East, vol. 15, Oxford: Clarendon Press, 1884)', note='The Maitrayana-Brahmana (Maitri) Upanishad. Müller’s translation from the Sanskrit with his footnotes; he cites the commentary of Shankara throughout. A nineteenth-century translation: later translators (Olivelle, for one) read some passages differently.'),
    'x-jat': dict(idents=['jatakaorstorieso01cowe', 'jatakaorstorieso01cowe', 'jatakaorstorieso02cowe', 'jatakaorstorieso02cowe', 'jatakaorstorieso03cowe', 'jatakaorstorieso03cowe', 'in.ernet.dli.2015.553497',
                          'cup-jataka-vol-5-francis-cowell-1905', 'cup-jataka-vol-5-francis-cowell-1905', 'jatakaorstorieso06cowe', 'jatakaorstorieso06cowe'],
                  slices=[(r'^PREFACE\.$', r'^CONTENTS\.$'), (JATAKA_BOOK_RX, r'^INDEX OF P[A-Z]+ NAMES\.$'),
                          (r'^PREFACE\.$', r'^CONTENTS\.$'), (JATAKA_BOOK_RX, r'^INDEX OF NAMES AND PALI WORDS\.$'),
                          (r'^PREFACE\.$', r'^CONTENTS\.$'), (JATAKA_BOOK_RX, r'^INDEX\.$'),
                          (JATAKA_BOOK_RX, r'^INDEX OF MATTERS\.$'),
                          (r'^PREFACE\.$', r'^CONTENTS\.$'), (JATAKA_BOOK_RX, r'^INDEX OF SUBJECT MATTERS\.$'),
                          (r'^PREFACE\.$', r'^ERRATA\.$'), (JATAKA_BOOK_RX, r'^INDEX\.$')],
                  labels=['Vol. I · Preface', 'Vol. I (Nos. 1–150)', 'Vol. II · Preface', 'Vol. II (Nos. 151–300)', 'Vol. III · Preface', 'Vol. III (Nos. 301–438)',
                          'Vol. IV (Nos. 439–510)', 'Vol. V · Preface', 'Vol. V (Nos. 511–537)', 'Vol. VI · Preface', 'Vol. VI (Nos. 538–547)'],
                  split=JATAKA_BOOK_RX, retitle=lambda h: jataka_book_title(h), drop=JATAKA_DROP,
                  by='E. B. Cowell (ed.), The Jātaka or Stories of the Buddha’s Former Births, translated from the Pāli by various hands (Cambridge University Press, 6 vols., 1895–1907)',
                  note='All 547 tales, in the six volumes of the Cambridge translation of the Jātaka commentary, grouped as the Pāli books are (by the number of verses in a tale). Each tale gives the story of the present, the story of the past, and the Buddha’s naming of who was who. Includes each volume’s preface (volume IV has none) and the translators’ footnotes, which the scan runs into the text where the page broke; the contents lists and indexes are left out.'),
    'x-mdk': dict(idents=['mandukyopanisha00agoog'] * 3,
                  slices=[(r'^P[BR]EFACE\.$', r"^THE COMMENTATOR'S BENEDICTION\.$"), (r"^THE COMMENTATOR'S BENEDICTION\.$", r'^INDEX OF SANSKRIT TERMS NOT'), (r'^INDEX OF SANSKRIT TERMS NOT', r'^(?i:university ot ca)')],
                  labels=['Translator’s preface and introduction', 'The Upanishad, with Gaudapada’s Karikas and Shankara’s commentary', 'Glossary of Sanskrit terms left untranslated'],
                  drop=MANDUKYA_DROP,
                  by='Manilal Nabhubhai Dvivedi, The Mandukyopanishad with Gaudapada’s Karikas and the Bhashya of Sankara, translated into English (Bombay: Theosophical Publication Fund, 1894)',
                  note='The twelve verses of the Mandukya Upanishad with Gaudapada’s Karikas (the four chapters of verse commentary) and Shankara’s prose commentary, all in Dvivedi’s English; his preface and long introduction on the Advaita philosophy come first. The index is left out.'),
    'x-pug': dict(idents=['designationofhum00unse'] * 2,
                  slices=[(r'^INTRODUCTION\s*$', r'^a\. F\s*$'), (r'^I bend in homage to the Blessed One', r'^INDEX\s*$')],
                  labels=['Translator’s introduction', 'The Designation of Human Types'],
                  split=LAW_CHAPTER_RX, retitle=law_chapter_title, drop=LAW_DROP,
                  by='Bimala Charan Law, Designation of Human Types (Puggala-paññatti), translated into English for the first time (Pali Text Society Translation Series no. 12; London: Oxford University Press, 1924)',
                  note='The fourth book of the Abhidhamma Pitaka: the classification of kinds of persons, from the ones to the tens, answering “what sort of person is…?” for each. Law’s introduction, his translation of all ten chapters with the opening table of contents, and his footnotes (which the scan runs into the text where the page broke). The page-number index is left out. Public domain in the United States (published 1924); the translator died in 1969, so it may still be protected in other countries.'),
    'x-bhp': dict(idents=['PG39442'] * 2, slices=[(r'^PREFACE\.$', r'^Table of Contents\s*$'), (r'^SKANDHA I\.[ \t]*$', None)],
                  labels=['Sinha’s preface', 'The twelve skandhas'],
                  split=r'^(?:SKANDHA\s+[IVX]+\.|THE (?:TENTH|ELEVENTH|TWELFTH) SKANDHA\.?)[ \t]*$', retitle=sinha_title,
                  by='Purnendu Narayana Sinha (editor), A Study of the Bhagavata Purana, or Esoteric Hinduism (Benares: Freeman & Co., Tara Printing Works, 1901; Project Gutenberg #39442)',
                  note='Not a translation of the Bhagavata Purana. It is a summary of all twelve skandhas, with long passages quoted in English and Sinha’s own commentary (“Thoughts on the above”), written from a Theosophical standpoint and dedicated to Annie Besant. It is here because no complete English translation of the Bhagavata is in the public domain in what we could find; read it as a guide to the Purana, not as the Purana. The genealogical tables are drawn as plain-text trees. Public domain in the United States (1901).'),
    'x-aca': dict(idents=['in.ernet.dli.2015.37732'] * 2, slices=[(r'^The origin and development of the', r'^HERMANN JACOBI\.$'), (r'^FIRST BOOK\S\.$', r'^THE KALPA S\S+TRA$', 0, True)], labels=['Jacobi’s introduction (to both sūtras in this volume)', 'The Ācārāṅga Sūtra'], by='Hermann Jacobi, Jaina Sutras, part 1 (Sacred Books of the East, vol. 22, 1884)', note='Jacobi’s introduction to the two sūtras in the volume and his translation of the Ācārāṅga Sūtra (the Śvetāmbara Jain rules of monastic conduct), both books, with his footnotes. The Kalpa Sūtra is its own entry.'),
    'x-kalp': dict(idents=['in.ernet.dli.2015.37732'], slice=(r'^THE KALPA S\S+TRA$', r'^INDEX$', 1, True), by='Hermann Jacobi, Jaina Sutras, part 1 (Sacred Books of the East, vol. 22, 1884)', note='The Kalpa Sūtra of Bhadrabāhu: the lives of the Jinas (Mahāvīra, Pārśva, Ariṣṭanemi, Ṛṣabha), the lists of elders and the rules for monks, with Jacobi’s footnotes. His introduction is with the Ācārāṅga Sūtra entry.'),
    'x-sut': dict(idents=['mlbd.gainasutraspart20000vol-45.unse'], by='Hermann Jacobi, Jaina Sutras, part 2 (Sacred Books of the East, vol. 45, 1895)', note='Contains the Uttarādhyayana Sūtra and the Sūtrakṛtāṅga.'),
    'x-hs': dict(idents=['buddhistmahy02cowe'] * 3, slices=[(r'^\(THE LARGER AND THE SMALLER TEXT\.\)', r'^THE amitAyur-dhyAna-sOtra\.$'), (r'^Adoration to the Omniscient !', r'^INDEX OF NAMES AND SUBJECTS IN THE', 2), (r'^Adoration to the Omniscient !', r'^THE SMALLER P R A G', 1)], labels=['Max Müller’s note', 'The shorter text (the usual “Heart Sutra”)', 'The longer text'], by='F. Max Müller, The Larger and the Smaller Pragñā-pāramitā-hṛdaya-sūtra, in Buddhist Mahāyāna Texts, part 2 (Sacred Books of the East, vol. 49, Oxford: Clarendon Press, 1894)', note='The Heart Sūtra in both versions, the short text most people mean and the longer one, with Müller’s note and footnotes. A nineteenth-century translation from the Sanskrit: later translators render several terms differently.'),
    'x-ds': dict(idents=['buddhistmahy02cowe'] * 2, slices=[(r'^In order to make this collection of Mahayana works more', r"^-'■ b 2$"), (r'^Adoration to the blessed Arya', r'^THE LARGER PRAG')], labels=['Translator’s introduction', 'The Diamond-cutter (Vajracchedikā)'], by='F. Max Müller, The Vagrakkhedikā (the Diamond-cutter), in Buddhist Mahāyāna Texts, part 2 (Sacred Books of the East, vol. 49, Oxford: Clarendon Press, 1894)', note='Müller’s introduction and his translation of the Diamond Sūtra from the Sanskrit, with his footnotes. A nineteenth-century translation; he reads “dharma” as “thing” where later translators differ.'),
    'x-bud': dict(idents=['buddhistmahy01cowe'], slice=(r'^INTRODUCTION$', r'^INDEX OF PROPER NAMES'), by='E. B. Cowell, The Buddha-karita of Asvaghosha, in Buddhist Mahāyāna Texts, part 1 (Sacred Books of the East, vol. 49, Oxford: Clarendon Press, 1894)', note='Cowell’s introduction and his translation of the poem, Books I–XVII, with his footnotes. This volume was filed under the Heart and Diamond Sūtras until the audit found it was not those.'),
    'x-slv': dict(idents=['buddhistmahy02cowe'] * 2, slices=[(r'^INTRODUCTION\.$', r'^THE SMALLER SUKHAVAT\S+VY\S+\.$'), (r'^DESCRIPTION OF SUKHAVATI,', r'^INDEX OF WORDS\.')], labels=['Translator’s introduction (the two Sukhāvatī-vyūhas and the Amitāyur-dhyāna)', 'The Larger Sukhāvatī-vyūha: the Land of Bliss'], by='F. Max Müller, The Larger Sukhāvatī-vyūha, in Buddhist Mahāyāna Texts, part 2 (Sacred Books of the East, vol. 49, Oxford: Clarendon Press, 1894)', note='Müller’s introduction and his translation of the longer Pure Land sūtra from the Sanskrit, with his footnotes. The two lists of words and subjects are left out.'),
    'x-sms': dict(idents=['buddhistmahy02cowe'] * 2, slices=[(r'^THE SMALLER SUKHAVAT\S+VY\S+\.$', r'^THE VAC\S+A-A\S+HvA\.$'), (r'^Adoration to the Omniscient !', r'^INDEX OF NAMES AND SUBJECTS IN THE SMALLER')], labels=['Translator’s introduction', 'The Smaller Sukhāvatī-vyūha (the Amitābha Sūtra)'], by='F. Max Müller, The Smaller Sukhāvatī-vyūha, in Buddhist Mahāyāna Texts, part 2 (Sacred Books of the East, vol. 49, Oxford: Clarendon Press, 1894)', note='Müller’s note and his translation of the shorter Pure Land sūtra from the Sanskrit, with his footnotes. The indexes are left out.'),
    'x-amd': dict(idents=['buddhistmahy02cowe'] * 2, slices=[(r'^THE amitAyur-dhyAna-sOtra\.$', r'^F\. MAX MULLER\.$'), (r'^MEDITATION ON BUDDHA AMITAYUS', r'^INDEX OF NAMES AND SUBJECTS')], labels=['Max Müller’s note', 'The Amitāyur-dhyāna-sūtra (Sūtra of the Meditation on Amitāyus)'], by='J. Takakusu, The Amitāyur-dhyāna-sūtra, in Buddhist Mahāyāna Texts, part 2 (Sacred Books of the East, vol. 49, Oxford: Clarendon Press, 1894)', note='Takakusu’s translation from the Chinese of Kālayaśas, the only form in which this sūtra survives, with Müller’s note and the translator’s footnotes. The index is left out.'),
    'x-men': dict(idents=['fourbooksconfuci00leggiala'], slice=(r'^THE WORKS OF MEN[CG]IUS$', r'^University of California$'), by='James Legge, The Four Books (1900): the Analects, the Great Learning, the Doctrine of the Mean and the Works of Mencius', note='The Works of Mencius with Legge’s notes and Chu Hsi’s commentary. The scan carries the Chinese characters as noise.'),
    'x-gl': dict(idents=['fourbooksconfuci00leggiala'], slice=(r'^\.?My master, the philosopher Ch.ang, says : "The Great Learning', r'^THE WORKS OF MEN[CG]IUS$'), by='James Legge, The Four Books (1900): the Analects, the Great Learning, the Doctrine of the Mean and the Works of Mencius', note='The Great Learning and the Doctrine of the Mean with Legge’s notes and the commentary of Chu Hsi (the Analects are a separate entry, from Project Gutenberg). The scan carries the Chinese characters as noise.'),
    # ── second batch: pseudepigrapha, early Christian, Indic, Chinese, American ──
    'p-tab': dict(idents=['the-testament-of-abraham'], slice=(r'THE TESTAMENT OF ABRAHAM', None), by='G. H. Box, The Testament of Abraham (SPCK, Translations of Early Documents, 1927)', split=r'^\s*PART I{1,2} ?:[^\n]*$', note='Both the longer and the shorter recension, with Box’s introduction and notes.'),
    'p-jas': dict(idents=['josephasenathcon00broo'], slice=(r'THE CONFESSION AND PRAYER OF ASENATH', None), by='E. W. Brooks, Joseph and Asenath: The Confession and Prayer of Asenath, Daughter of Pentephres the Priest (SPCK, Translations of Early Documents, 1918)', note='Includes Brooks’s introduction.'),
    'p-sib': dict(idents=['sibyllineoracles00terruoft'], slice=(r'^PREFACE', None), by='Milton S. Terry, The Sibylline Oracles, translated from the Greek into English blank verse (1890)', note='Terry’s blank-verse translation with his preface and introduction.'),
    'p-ari': dict(idents=['theletterofarist00unknuoft'], slice=(r'TRANSLATIONS OF EARLY DOCUMENTS', None), by='H. St. J. Thackeray, The Letter of Aristeas (SPCK, Translations of Early Documents, 1917)', note='Includes the introduction and an appendix of ancient evidence about the Septuagint legend.'),
    's-cd': dict(idents=['gtu_32400003956590_1'], slice=(r'Tue\s+two\s+texts', r'^\s*TEXT A, Heb\.'), by='Solomon Schechter, Documents of Jewish Sectaries, vol. 1: Fragments of a Zadokite Work (Cambridge University Press, 1910)', note='The Damascus Document as first published from the two medieval Cairo Genizah manuscripts (Texts A and B); the Qumran fragments (4Q266–273) found later are not included. Schechter’s introduction, English translation and notes; Hebrew words in the scan may be garbled.'),
    'p-phi': dict(idents=['worksphilojudaeu01philuoft', 'theworksofphiloj04yonguoft'], slices=[(r'THE\s+CREATION\s+OF\s+THE\s+WORLD,\s+AS\s+GIVEN\s+BY\s+MOSES', r'AFTER THE WORK OF THE SIX DAYS OF CREATION'), (r'^\s*A\s+TEEATISE\s+ON\s+A\s+CONTEMPLATIVE', r'^\s*A\s+TREATISE\s+ON\s+THB\s+INCORRUPTIBILITY')], labels=['On the Creation of the World', 'On the Contemplative Life'], by='C. D. Yonge, The Works of Philo Judaeus (Bohn, 1854–55)', note='Two treatises from Yonge’s translation: On the Creation of the World (vol. 1) and On the Contemplative Life, or On the Virtues of Suppliants (vol. 4). The rest of Philo is not included.'),
    'e-pro': dict(idents=['JAMESApocryphalNewTestament1924'], slice=(r'^\s*BOOK OF JAMES, OR PROTEVANGELIUM\s*$', r'^\s*GREEK TEXT A\s*$'), by='M. R. James, The Apocryphal New Testament (Oxford: Clarendon Press, 1924)', note='The Protevangelium of James, from James’s collection (his introduction to the text is included).'),
    'e-pet': dict(idents=['JAMESApocryphalNewTestament1924'], slice=(r'^\s*GOSPEL OF PETER\s*$', r'^\s*THE GOSPEL OF NICODEMUS, OR ACTS OF', 1), by='M. R. James, The Apocryphal New Testament (Oxford: Clarendon Press, 1924)', note='The surviving fragment of the Gospel of Peter (the Akhmim fragment), with James’s introduction.'),
    'e-ptc': dict(idents=['JAMESApocryphalNewTestament1924'], slice=(r'^\s*ACTS OF PAUL \(See Appendix II\)', r'^\s*UNPLACED AND UNCERTAIN FRAGMENTS'), by='M. R. James, The Apocryphal New Testament (Oxford: Clarendon Press, 1924)', note='The Acts of Paul in James’s rendering: the Acts of Paul and Thecla, the Correspondence with the Corinthians, and the Martyrdom, with his introduction.'),
    'e-ath': dict(idents=['JAMESApocryphalNewTestament1924'], slice=(r'^\s*ACTS OF THE HOLY APOSTLE THOMAS\s*$', r'^\s*ACTS OF ANDREW AND MATTHIAS'), by='M. R. James, The Apocryphal New Testament (Oxford: Clarendon Press, 1924)', note='The Acts of Thomas, including the Hymn of the Pearl (the Hymn of the Soul), with James’s introduction.'),
    'e-sayings': dict(idents=['paradiseorgarden02ann'], slice=(r'THE PARADISE OF THE HOLY FATHERS', r'^INDEX$'), by='E. A. Wallis Budge, The Paradise, or Garden of the Holy Fathers, vol. 2 (1907)', note='Volume 2 of Budge’s translation of the Syriac collection: the Sayings of the Fathers of Egypt and related sayings, with his notes. Volume 1 (Palladius, Lausiac History) is not included.'),
    'e-eck': dict(idents=['in.ernet.dli.2015.31707'], slice=(r'BY FRANZ PFEIFFER', None), by='Franz Pfeiffer (ed.), Meister Eckhart, translated by C. de B. Evans, vol. 1 (1924)', note='Pfeiffer’s collection of sermons and collations in Evans’s translation; volume 2 (1931) is not included.'),
    'e-cld': dict(idents=['bookofcontemplat00unde'], slice=(r'A BOOK OF CONTEMPLATION', None), by='Evelyn Underhill (ed.), A Book of Contemplation the which is called The Cloud of Unknowing (1912; this printing 1922)', note='Underhill’s edition with her introduction.'),
    'x-sam': dict(idents=['hymnsofsmaveda00grifiala'], slice=(r'HYMNS OF THE SAMAVEDA', r'^INDEX OF HYMNS'), by='Ralph T. H. Griffith, The Hymns of the Sāmaveda (1893; 2nd ed. 1907)', note='With Griffith’s introduction and notes.'),
    'x-yaj': dict(idents=['in.ernet.dli.2015.196045'], slice=(r'THE WHITE YAJURVEDA', None), by='Ralph T. H. Griffith, The Texts of the White Yajurveda (1899)', note='With Griffith’s introduction and notes.'),
    'x-ath': dict(idents=['in.ernet.dli.2015.213366'], slice=(r'(?i)^THE hymns of the', r'^INDEX OF HYMNS'), by='Ralph T. H. Griffith, The Hymns of the Atharvaveda (1895–96)', note='With Griffith’s introduction and notes.'),
    'x-brah': dict(idents=['in.ernet.dli.2015.238711', 'in.ernet.dli.2015.238722', 'in.ernet.dli.2015.37911', 'in.ernet.dli.2015.48505', 'in.ernet.dli.2015.21584'], labels=['Books I–II', 'Books III–IV', 'Books V–VII', 'Books VIII–X', 'Books XI–XIV'], by='Julius Eggeling, The Śatapatha-Brāhmaṇa according to the text of the Mādhyandina school (Sacred Books of the East, vols. 12, 26, 41, 43, 44; 1882–1900)', note='The great Brāhmaṇa of the White Yajurveda, in five volumes (it ends with the Bṛhadāraṇyaka Upaniṣad). Other Brāhmaṇas and the Āraṇyakas are not included.'),
    'x-abh': dict(idents=['buddhistmanualof00davirich', 'PointsOfControversyKathavatthu'], labels=['Dhammasaṅgaṇī', 'Kathāvatthu'], by='Caroline A. F. Rhys Davids, A Buddhist Manual of Psychological Ethics, being a translation of the Dhammasaṅgaṇī (1900); Shwe Zan Aung and Mrs. Rhys Davids, Points of Controversy, being a translation of the Kathāvatthu (Pali Text Society, 1915)', note='Two of the seven books of the Abhidhamma Piṭaka, each with the translators’ introduction: the Dhammasaṅgaṇī (the first book) and the Kathāvatthu. The other five books are not included.'),
    'x-bdc': dict(idents=['pathoflight00santiala'], slice=(r'THE PATH OF LIGHT', None), by='L. D. Barnett, The Path of Light, rendered from the Bodhi-charyâvatâra of Çânti-Deva (Wisdom of the East, 1909)', note='With Barnett’s introduction.'),
    'x-gg': dict(idents=['thesikhreligion01macauoft', 'TheSikhReligionVolII', 'TheSikhReligionItsGurusSacredWritingsAndAuthorsVolIII', 'in.ernet.dli.2015.69685', 'thesikhreligioni05macauoft', 'thesikhreligioni06macauoft'], slice=(r'ITS GURUS, SACRED WRITINGS', None), by='Max Arthur Macauliffe, The Sikh Religion: Its Gurus, Sacred Writings and Authors (Oxford, 6 vols., 1909)', note='Macauliffe’s six volumes: the lives of the Gurus together with his translations of their hymns from the Guru Granth Sahib. This is a partial and interpretive rendering of the scripture, not a full translation.'),
    'x-bun': dict(idents=['pahlavitexts01westuoft'], by='E. W. West, Pahlavi Texts, part 1 (Sacred Books of the East, vol. 5, 1880)', note='Contains the Bundahishn, the Bahman Yasht and the Shāyast lā-shāyast, with West’s long introduction.'),
    'x-lie': dict(idents=['taoistteachingsf00liezrich'], slice=(r'TAOIST TEACHINGS', None), by='Lionel Giles, Taoist Teachings from the Book of Lieh Tzŭ (Wisdom of the East, 1912)', note='With Giles’s introduction.'),
    'x-xun': dict(idents=['in.ernet.dli.2015.103953'], slice=(r'ORIENTAL SERIES\s+VOL', None), by='Homer H. Dubs, The Works of Hsüntze (Probsthain, 1928)', note='Dubs’s translation of Xunzi with his introduction and notes; Chinese characters in the scan may be garbled.'),
    'x-moz': dict(idents=['in.ernet.dli.2015.283868'], slice=(r'THE ETHICAL AND POLITICAL', None), by='Yi-Pao Mei, The Ethical and Political Works of Motse (Probsthain, 1929)', note='Mei’s translation of Mozi with his introduction; Chinese characters in the scan may be garbled.'),
    'x-doc': dict(idents=['sacredbooksofch03conf'], slice=(r'THE SACRED BOOKS OF THE EAST', None), by='James Legge, The Sacred Books of China: The Texts of Confucianism, part 1 (Sacred Books of the East, vol. 3, 1879)', note='The Shû King (Book of Documents), the religious portions of the Shih King (Book of Songs) and the Hsiâo King. The whole Book of Songs is not included.'),
    'x-orp': dict(idents=['mysticalhymnsofo00unse'], slice=(r'MYSTICAL HYMNS OF ORPHEUS', None), by='Thomas Taylor, The Mystical Hymns of Orpheus (1824; reprinted 1896)', note='Taylor’s translation of the Orphic Hymns with his introduction. The Orphic gold tablets are not included.'),
    'x-gar': dict(idents=['firstpartofroyal01vega', 'firstpartofroyal02vega'], slices=[(r'ROYAL COMMENTARIES', r'^INDEX\.$'), (r'ROYAL COMMENTARIES', r'^INDEX TO THE FIRST PART')], by='Clements R. Markham (trans.), Garcilaso de la Vega, First Part of the Royal Commentaries of the Yncas (Hakluyt Society, 1869–71)', note='Two volumes. Written by a Spanish-Inca author in 1609; it records Inca tradition as one man remembered it, in Spanish colonial context.'),
    'x-gad': dict(idents=['carminagadelicah02carm', 'carminagadelicah01carm'], slice=(r'Carmina Gadelica', None), by='Alexander Carmichael, Carmina Gadelica: Hymns and Incantations, vols. 1–2 (2nd ed., 1928; first published 1900)', note='Gaelic originals with Carmichael’s English translations and notes. Volumes 3–6 (1940–71) are not included.'),
    'e-ant': dict(idents=['the-life-of-antony-by-saint-athanasius-of-alexandria'], by='Athanasius, The Life of Antony, in the Nicene and Post-Nicene Fathers, series 2, vol. 4 (edited by Philip Schaff and Henry Wace, 1892)', note='With the translator’s introduction.', license='Public domain (text of an 1892 translation, from an Internet Archive ebook edition)'),
    'x-mil': dict(idents=['dli.ministry.06735'], slice=(r'TIBET.S GREAT YOG\w MILAREPA', None), by='W. Y. Evans-Wentz (ed.), Tibet’s Great Yogī Milarepa: A Biography from the Tibetan, translated by Lama Kazi Dawa-Samdup (Oxford University Press, 1928)', note='The life (the Jetsün-Kahbum); his songs, the Hundred Thousand Songs, are not included. Includes Evans-Wentz’s introduction and notes.'),
    'e-heb': dict(idents=['JAMESApocryphalNewTestament1924'], slice=(r'^\s*THE GOSPEL ACCORDING TO THE HEBREWS\s*$', r'^\s*THE GOSPEL OF THE EBIONITES\s*$'), by='M. R. James, The Apocryphal New Testament (Oxford: Clarendon Press, 1924)', note='The quotations and traces of the lost Jewish-Christian Gospel according to the Hebrews, with James’s introduction.'),
    'e-ebi': dict(idents=['JAMESApocryphalNewTestament1924'], slice=(r'^\s*THE GOSPEL OF THE EBIONITES\s*$', r'^\s*THE GOSPEL ACCORDING TO THE EGYPTIANS\s*$'), by='M. R. James, The Apocryphal New Testament (Oxford: Clarendon Press, 1924)', note='The fragments quoted by Epiphanius, with James’s introduction.'),
    'e-egy': dict(idents=['JAMESApocryphalNewTestament1924'], slice=(r'^\s*THE GOSPEL ACCORDING TO THE EGYPTIANS\s*$', r'^\s*GOSPEL OF PHILIP\s*$'), by='M. R. James, The Apocryphal New Testament (Oxford: Clarendon Press, 1924)', note='The surviving fragments, with James’s introduction.'),
    'e-oxy': dict(idents=['JAMESApocryphalNewTestament1924'], slice=(r'THE\s+OXYRHYNCHUS\s+SAYINGS\s+OF\s+JESUS', r'^\s*FRAGMENT OF A GOSPEL\s*$'), by='M. R. James, The Apocryphal New Testament (Oxford: Clarendon Press, 1924)', note='The sayings of Jesus on the Oxyrhynchus papyri (found 1897–1904), which turned out to be Greek parts of the Gospel of Thomas, with James’s introduction. The full Coptic Gospel of Thomas, found in 1945, has no public-domain English translation.'),
    'e-prp': dict(idents=['JAMESApocryphalNewTestament1924'], slice=(r'^\s*THE PREACHING OF PETER\s*$', r'^\s*LOST HERETICAL BOOKS\s*$'), by='M. R. James, The Apocryphal New Testament (Oxford: Clarendon Press, 1924)', note='The fragments quoted by Clement of Alexandria and others, with James’s introduction.'),
    'e-inf': dict(idents=['JAMESApocryphalNewTestament1924'], slice=(r'^\s*GREEK TEXT A\s*$', r'^\s*COPTIC LIVES, ETC\.'), by='M. R. James, The Apocryphal New Testament (Oxford: Clarendon Press, 1924)', note='The Infancy Gospel of Thomas (Greek A and B, Latin), Pseudo-Matthew, the Gospel of the Birth of Mary, the Arabic and Armenian Infancy Gospels and the History of Joseph the Carpenter, with James’s notes.'),
    'e-nic': dict(idents=['JAMESApocryphalNewTestament1924'], slice=(r'^\s*THE GOSPEL OF NICODEMUS, OR ACTS OF', r'^\s*COPTIC NARRATIVES OF THE MINISTRY AND'), by='M. R. James, The Apocryphal New Testament (Oxford: Clarendon Press, 1924)', note='The Acts of Pilate and the Descent of Christ into Hell, with the later Pilate cycle, with James’s introduction.'),
    'e-apo': dict(idents=['JAMESApocryphalNewTestament1924'], slice=(r'^\s*THE AKHMIM FRAGMENT\s*$', r'^\s*THE APOCALYPSE OF THE VIRGIN\. A\. GREEK'), by='M. R. James, The Apocryphal New Testament (Oxford: Clarendon Press, 1924)', note='The Apocalypse of Peter (Greek and Ethiopic) and the other early Christian apocalypses in James’s collection, including the Apocalypse of Paul, with his introductions.'),
    'e-acj': dict(idents=['JAMESApocryphalNewTestament1924'], slice=(r'But it is now agreed that Leucius', r'^\s*ACTS OF PAUL \(See Appendix II\)'), by='M. R. James, The Apocryphal New Testament (Oxford: Clarendon Press, 1924)', note='Begins part-way through James’s introduction; the Acts themselves follow.'),
    'e-acp': dict(idents=['JAMESApocryphalNewTestament1924'], slice=(r'^\s*THE COPTIC FRAGMENT\s*$', r'^\s*ACTS OP ANDREW\s*$'), by='M. R. James, The Apocryphal New Testament (Oxford: Clarendon Press, 1924)', note='The Coptic fragment, the Gardener’s Daughter story, the Vercelli Acts and the martyrdom of Peter, with James’s introductions.'),
    'e-aca': dict(idents=['JAMESApocryphalNewTestament1924'], slice=(r'^\s*ACTS OP ANDREW\s*$', r'^\s*ACTS OF THE HOLY APOSTLE THOMAS\s*$'), by='M. R. James, The Apocryphal New Testament (Oxford: Clarendon Press, 1924)', note='The Acts of Andrew, with James’s introduction.'),
    'e-lao': dict(idents=['JAMESApocryphalNewTestament1924'], slice=(r'^\s*EPISTLE TO THE LAODICEANS', r'^\s*APOCALYPSES\s*$'), by='M. R. James, The Apocryphal New Testament (Oxford: Clarendon Press, 1924)', note='The Latin Epistle to the Laodiceans, the Letters of Christ and Abgarus and the Letter of Lentulus, and the correspondence between Paul and Seneca, with James’s introductions.'),
    'e-jus': dict(idents=['antenicenefather01robe'], slice=(r'TO\s+TH[BE]\s+FIRST\s+APOLOGY\s+OF\s+JUSTIN', r'IREN\.EUS\.\s+TO\b'), by='The Ante-Nicene Fathers, ed. Alexander Roberts and James Donaldson (Edinburgh 1867–73; American edition, Buffalo 1885–96), vol. 1', note='The First and Second Apologies, the Dialogue with Trypho, the Discourse to the Greeks and fragments, with the translators’ introductions.'),
    'e-ire': dict(idents=['antenicenefather01robe'], slice=(r'IREN\.EUS\.\s+TO\b', r'INDEX\s+OF\s+SUBJECTS'), by='The Ante-Nicene Fathers, ed. Alexander Roberts and James Donaldson (Edinburgh 1867–73; American edition, Buffalo 1885–96), vol. 1', note='Against Heresies, in five books, with the introduction and fragments. A main source on the Gnostic teachers.'),
    'e-ter': dict(idents=['antenicenefather03robe'], slice=(r'THE\s+APOLOGY\.\S*\s+CHAP\.\s+I\.\s+Rulers', None), by='The Ante-Nicene Fathers, ed. Alexander Roberts and James Donaldson (Edinburgh 1867–73; American edition, Buffalo 1885–96), vol. 3', note='Tertullian: the Apology, On the Soul, the Prescription against Heretics, Against Marcion, On Baptism and others, in one volume.'),
    'e-apc': dict(idents=['antenicenefather007robe'], slice=(r'CONSTITUTIONS\s+OF\s+THE\s+HOLY\s+APOSTLES\W{0,3}\s+BOOK\s+I\.\s+CONCERNING\s+THE\s+LAITY', None), by='The Ante-Nicene Fathers, ed. Alexander Roberts and James Donaldson (Edinburgh 1867–73; American edition, Buffalo 1885–96), vol. 7', note='The eight books of the Apostolic Constitutions (church order, with a list of the books of scripture in Book VIII), and the liturgies that follow in the same volume.'),
    'e-eus': dict(idents=['ecclesiasticalhi00euse'], slice=(r'BOOK\s+I\.\s+CHAPTER\s+L', None), by='Eusebius Pamphilus, The Ecclesiastical History, translated by C. F. Cruse (1856)', note='Ten books of the first history of the church, including Eusebius’s own lists of which books were accepted and disputed.'),
    'x-sps': dict(idents=['cu31924026807028'], slice=(r'INTRODUCTION\s+The\s+material\s+collected', None), by='Stephen Langdon, Sumerian and Babylonian Psalms (Paris, 1909)', note='Sumerian and Akkadian psalms and liturgies with Langdon’s English translations and introduction. The transliterated originals are hidden by the reader’s “English only” setting.'),
    'x-par': dict(idents=['sumerianepicpar00langgoog'], slice=(r'(?i)the\s+sumerian\s+epic\s+of\s+paradise', None), by='Stephen Langdon, Sumerian Epic of Paradise, the Flood and the Fall of Man (University of Pennsylvania Museum, 1915)', note='The Nippur tablet that preserves a Sumerian flood story, with transliteration and Langdon’s translation. Some of Langdon’s readings, including his “fall of man”, have since been revised.'),
    'x-bli': dict(idents=['babylonianliturg00langrich'], slice=(r'(?i)babylonian\s+liturgies', None), by='Stephen Langdon, Babylonian Liturgies: Sumerian texts from the early period (Paris, 1913)', note='Sumerian liturgies with Langdon’s translations. The transliterated originals are hidden by the reader’s “English only” setting.'),
    'x-gud': dict(idents=['greatcylinderins02pricuoft'], slice=(r'(?i)the\s+great\s+cylinder\s+inscriptions', None), by='Ira Maurice Price, The Great Cylinder Inscriptions A and B of Gudea (Leipzig, 1899)', note='Gudea of Lagash’s temple-building hymn, with Price’s introduction and English translation. Our understanding of the Sumerian text has advanced since 1899.'),
    'x-tam': dict(idents=['cu31924029165914'], slice=(r'PREFACE\s+now\s+in\s+the\s+hands', None), by='Stephen Langdon, Tammuz and Ishtar: a monograph upon Babylonian religion and theology (Oxford, 1914)', note='Translations of Sumerian and Akkadian liturgies of Tammuz and Ishtar, with Langdon’s study.'),
    'e-jamesnt': dict(idents=['JAMESApocryphalNewTestament1924'], by='M. R. James, The Apocryphal New Testament (1924)'),
    # ── third batch: the Jewish mystical strand (fetched with the owner's approval, 14 Nov 2026) ──
    'p-3en': dict(idents=['ksigaxiienochorthehebrewbookofenoch_202012'], slice=(r'^PART I\s+INTRODUCTION$', r'^PART III\s*$', 1), split=r'^(?:PART II|CHAPTER\s+[IVXL]+)\s*$', strip_hebrew=True, by='Hugo Odeberg, 3 Enoch or The Hebrew Book of Enoch (Cambridge University Press, 1928)', note='Odeberg’s long introduction and his English translation with notes. The Hebrew text, the critical notes and the indexes of his edition are left out, and so are the Hebrew-script quotations in his notes, which the scan reads unreliably (the transliterations beside them stay). Public domain in the United States (published 1928); the translator died in 1973, so it may still be protected in other countries.'),
    'e-kab': dict(idents=['kabbaladenudata00rosegoog'], slice=(r'^INTRODUCTION\.\s*$', r'^INDEX\.\s*$'), split=r'^(?:INTRODUCTION\.|THE BOOK OF CONCEALED MYSTERY\.|THE GREATER HOLY ASSEMBLY\.?|THE LESSER HOLY ASSEMBLY\.?)\s*$', by='S. L. MacGregor Mathers (translator), The Kabbalah Unveiled: the Book of Concealed Mystery and the Greater and Lesser Holy Assembly of the Zohar, from the Latin of Knorr von Rosenroth (first published 1887; this scan a later printing)', note='Mathers’s introduction and his translation of three tractates of the Zohar. It is a translation of a Latin version of 1677–84, not of the Aramaic. Hebrew quotations in the scan come through as scattered marks.'),
    'z-gin': dict(idents=['cu31924075115380'], slice=(r'^THE KABBALAH\.\s*$', None), by='Christian D. Ginsburg, The Kabbalah: Its Doctrines, Development, and Literature (first published 1865; this scan the 1920 Routledge printing)', note='A classic 19th-century study of the Kabbalah, with Ginsburg’s own view of its history, which later scholarship has revised. Hebrew quotations in his footnotes come through as garbled letters.'),
    'p-tso': dict(idents=['Cony1899JQRTestamentOfSolomon'], slice=(r'^THE TESTAMENT OF SOLOMON\.\s*$', None), by='F. C. Conybeare, The Testament of Solomon (Jewish Quarterly Review, vol. 11, October 1898)', note='Conybeare’s introductory remarks and his English translation of the Greek text, with his footnotes.'),
}


# more specs live in texts_shelf.py (the Hermetic, occult, Masonic, Spiritualist and field-record shelves) and texts_more.py (further series volumes)
IS_PG = lambda ident: bool(re.fullmatch(r'PG\d+', ident))      # 'PG39442' = Project Gutenberg #39442 (typed text; the scan cleaners are skipped)


def ia_text(fetch, CACHE, ident):
    if IS_PG(ident):
        import build_texts_util as _U
        return _U.pg_text(fetch, CACHE, int(ident[2:]))
    meta_path = CACHE / 'archive' / (ident + '.meta.json')
    d = json.loads(meta_path.read_text()) if meta_path.exists() else json.loads(fetch('https://archive.org/metadata/' + ident, meta_path, delay=1.0))
    names = sorted([f for f in d.get('files', []) if f['name'].endswith('_djvu.txt')], key=lambda f: -int(f.get('size', 0) or 0))
    if not names: raise RuntimeError('no OCR text for ' + ident)
    raw = fetch('https://archive.org/download/%s/%s' % (ident, quote(names[0]['name'])), CACHE / 'archive' / (ident + '.txt'))
    return raw.decode('utf-8', errors='replace').replace('\r\n', '\n').replace('\x0c', '\n')


LINE_BOILER = re.compile(r'^\s*Google\s*$|^[\s•■♦□►]+$|Digitized by|Generated on|Public Domain, Google-digitized|https?://www\.hathitrust|archive\.org|Original from|google\s*\.\s*com')
PARA_BOILER = re.compile(r'Hosted by Google|scanned by Google|discoverable online|Google is proud to partner|This is a digital copy of a book|A public domain book is one|Public domain books are our gateways|marginalia present in the original volume|We also ask that you:|Keep it legal|Whatever your use, remember|Do not assume that just because we believe|Google Book Search|books\.google|Maintain attribution|Make non-commercial use|Refrain from automated querying|Usage guidelines')


GIB_MARK = re.compile(r'[\^$#%{}<>|\\~@£®©§¶«»■►♦□]')
GIB_ENGLISH = {'the', 'and', 'of', 'to', 'in', 'that', 'is', 'was', 'he', 'for', 'it', 'with', 'as', 'his', 'on', 'be', 'at', 'by', 'this', 'not', 'are', 'but',
               'from', 'or', 'have', 'they', 'which', 'you', 'were', 'all', 'she', 'there', 'their', 'him', 'has', 'when', 'who', 'will', 'thou', 'thy', 'thee', 'used'}


def gibberish(s):
    """A line of OCR noise: non-Latin script (Devanagari, say) read as Latin letters, or a barcode or library stamp. Such lines are full of
    ^ $ | \\ marks, case flips inside words and digits glued to letters; romanized originals ('Padmasanam tu samsthapya') are not. A line that
    still reads as English (a grammar's 'STATE, i|£ is used for…') is kept: losing the sentence would be worse than its stray marks."""
    toks = s.split()
    # a barcode read as text ('IJJJil i 111! IJ 1 i 1 li 1 1 1 III'): bare strokes, no dots, so citations ('I. iii. ii. 1. 4') and elided text ('. . . joy') stay
    if len(toks) >= 8 and sum(1 for w in toks if re.fullmatch(r'[Il1ij|!]+', w)) >= 0.6 * len(toks): return True
    if not toks or not GIB_MARK.search(s): return False
    if sum(1 for w in toks if w.lower().strip('.,;:!?"“”‘’()') in GIB_ENGLISH) >= 2: return False
    shaped = [bool(re.fullmatch(r'[(“"‘]?[A-Z]?[a-z]{2,}[.,;:!?”"’)]*', w)) for w in toks]
    if any(a and b for a, b in zip(shaped, shaped[1:])): return False   # 'The Basti 3W ^fer:' is a heading: strip_noise keeps 'The Basti'
    share = clean_share(toks)
    if share >= 0.3: return False                                      # 'HYMN XXV. # # Indra.', 'Hakira (^ ►*$&?), kind of plant;'
    bad = sum(1 for w in toks if bad_token(w))
    return bad / len(toks) >= 0.4 or len(GIB_MARK.findall(s)) >= max(3, len(s) / 12)


def bad_token(w):
    if '-' in w and sum(c.isalpha() for c in w) >= 0.6 * len(w): return False      # transliterated syllables ('\\a-ma-ri', '[^nin-kiir-ra'): damaged, not noise
    return bool(GIB_MARK.search(w) or re.search(r'[a-z][A-Z]', w) or (re.search(r'\d', w) and re.search(r'[A-Za-z]', w)))


def clean_share(toks):
    """The share of tokens that are real words: in the typed texts' vocabulary when it is known (so the 'II' and 'WWW' that Devanagari
    becomes do not count), else anything shaped like a word."""
    import build_texts_util as U
    def word(w):
        core = w.strip('.,;:!?"“”‘’()[]')
        if U.VOCAB: return len(core) >= 3 and core.isalpha() and U.VOCAB.get(core.lower(), 0) >= 20
        return bool(re.fullmatch(r'[A-Z][a-z]{2,}|[a-z]{3,}|[A-Z]{3,}|[IVXLC]+', core))
    return sum(1 for w in toks if word(w)) / len(toks)


def strip_noise(s):
    """In a line that is mostly text, drop runs of two or more noise tokens ('again ^^TW *^#| ^f^Sf ^f f^g£ I (Among men, one' keeps
    'again I (Among men, one'). A lone marked token stays: it is often an OCR'd line number ('/|6 My city')."""
    toks = s.split(' '); out = []; run = []
    for w in toks:
        if w and bad_token(w): run.append(w); continue
        if len(run) == 1: out += run
        run = []; out.append(w)
    if len(run) == 1: out += run
    return re.sub(r' {2,}', ' ', ' '.join(out)).strip()


def clean_ocr(t):
    lines = [re.sub(r'[ \t]{2,}', ' ', l).rstrip() for l in t.split('\n')]
    short = Counter(l.strip() for l in lines if 3 < len(l.strip()) < 70)
    heads = {k for k, n in short.items() if n >= 8 and not re.search(r'[a-z]{4,}\s+[a-z]{4,}', k)}      # repeated running heads (no running prose)
    out = []
    for l in lines:
        s = l.strip()
        if re.fullmatch(r'[\dIVXLCivxlc\.\s\-—–]{1,8}', s) or s in heads or LINE_BOILER.search(s): out.append(''); continue
        out.append(s)
    t = '\n'.join(out)
    # Google Books front/back matter: drop the paragraphs that carry it (short ones only, so real text is never lost)
    paras = re.split(r'\n[ \t]*\n', t)
    t = '\n\n'.join(p for p in paras if not (PARA_BOILER.search(p) and len(p) < 2500))
    t = re.sub(r'(\w)-\n(\w)', r'\1\2', t)
    return t


def denoise(t):
    """Drop lines of OCR noise and strip runs of noise from the rest (see gibberish and strip_noise). Run on a book after it is sliced
    out of its volume, so the slice patterns see the text as scanned: once 'Heb.~p.' was stripped from the very line a slice ended on."""
    out = []
    for s in t.split('\n'):
        if s.strip() and gibberish(s.strip()): out.append(''); continue
        out.append(strip_noise(s) if GIB_MARK.search(s) else s)
    return '\n'.join(out)


# letters OCR commonly misreads: h as li or b, w as Av, e as c, a leading t as i, n as ii. A word is changed only when it is not a word
# in the clean texts and the change makes a common one, so names and transliterations are left alone.
OCR_SWAPS = [('li', 'h'), ('tb', 'th'), ('wb', 'wh'), ('ii', 'h'), ('ii', 'n')]
OCR_FIXED = {'aud': 'and', 'nnd': 'and', 'thc': 'the'}
NOT_WORDS = {'hasn', 'doesn', 'isn', 'wasn', 'don', 'didn', 'couldn', 'wouldn', 'shouldn', 'aren', 'weren', 'haven', 'hadn', 'won', 'ain'}   # halves of contractions
FIXLOG = []


def _ocr_word(m, vocab):
    w = m.group(0); lw = w.lower()
    if lw in OCR_FIXED: fix = OCR_FIXED[lw]
    elif len(w) < 3 or lw in vocab: return w
    else:
        cands = {}                                                   # candidate → the commonness it must reach
        def add(c, need=200): cands[c] = min(cands.get(c, need), need)
        for a, b in OCR_SWAPS:
            for k in [k for k in range(len(lw)) if lw.startswith(a, k)]: add(lw[:k] + b + lw[k + len(a):])
            if lw.count(a) > 1: add(lw.replace(a, b))
        if lw.startswith('av'): add('w' + lw[2:])
        if lw.startswith('b') and len(lw) <= 5: add('h' + lw[1:], 1000)      # longer b-words are often real rarities ('bumble-bee')
        if lw.startswith('i'): add('t' + lw[1:], 1000)
        if lw.endswith('c') and len(lw) >= 4: add(lw[:-1] + 'e')
        if re.search(r'[a-z][A-Z]', w[1:]) or lw.count('ii') > 1:               # 'KiNC', 'iiuii': too garbled to guess, unless it makes a very common word
            cands = {c: max(need, 1000) for c, need in cands.items()}
        ok = [c for c, need in cands.items() if len(c) >= 3 and c not in NOT_WORDS and vocab.get(c, 0) >= need]
        if len(ok) != 1: return w
        fix = ok[0]
    if w.isupper() and len(w) > 1:
        if fix not in ('the', 'and'): return w                         # capitals are mostly sigla and abbreviations
        out = fix.upper()
    else: out = fix[0].upper() + fix[1:] if w[0].isupper() else fix
    FIXLOG.append((w, out)); return out


def _hyphen(m, vocab, broken):
    a, b = m.group(1), m.group(2); j = (a + b).lower()
    if b in ('and', 'or', 'nor', 'to'): return m.group(0)            # 'pre- and post-': a hyphen meant to hang
    if min(len(a), len(b)) < 3 and not (broken and len(a) + len(b) >= 6): return m.group(0)   # 'ni- ta': syllables of a transliteration
    if vocab.get(j, 0) >= 5 or (re.fullmatch(r'eth|est|edst|ing|ings|ness|less|ment|ments|tion|tions|ful|ly', b) and vocab.get(a.lower(), 0) >= 5):
        FIXLOG.append((m.group(0), a + b)); return a + b
    if broken and min(len(a), len(b)) >= 4 and vocab.get(a.lower(), 0) >= 5 and vocab.get(b.lower(), 0) >= 5: FIXLOG.append((m.group(0), a + '-' + b)); return a + '-' + b
    return m.group(0)


def fix_ocr(t, vocab):
    """Rejoin words hyphenated across a page or paragraph break ('na- tion' → 'nation', 'self- existent' → 'self-existent') and mend
    common letter misreadings ('tliat' → 'that', 'Avhich' → 'Which'). Needs the clean-text vocabulary; without it the text is returned as is."""
    if not vocab: return t
    t = re.sub(r'\b([A-Za-z]{2,})-[ \t]*(?:\n[ \t]*)*\n[ \t]*([a-z]{2,})\b', lambda m: _hyphen(m, vocab, True), t)
    t = re.sub(r'\b([A-Za-z]{2,})- ([a-z]{2,})\b', lambda m: _hyphen(m, vocab, False), t)
    return re.sub(r'\b[A-Za-z]+\b', lambda m: _ocr_word(m, vocab), t)


STAMPS = re.compile(r'PLEASE DO NOT REMOVE\s+CARDS|UNIVERSITY OF TORONTO\s+LIBRARY|Return this material to the library|SOUTHERN REGIONAL LIBRARY FACILITY|BINDING SECT\.|Central Archaeological Library')


def strip_stamps(t):
    """Cut the library card, return slip or binder's stamp that the scan caught after the last page (only in the last 3,000 characters)."""
    tail = max(0, len(t) - 3000); m = STAMPS.search(t, tail)
    return t[:m.start()].rstrip() if m else t


HEBREW = re.compile(r'[\u0590-\u05FF\uFB1D-\uFB4F\u200E\u200F]+')


def drop_hebrew(t):
    """Hebrew-script quotations in a scholarly book: the scan reads them unreliably, so they are left out (the transliterations beside them stay)."""
    t = HEBREW.sub('', t); t = re.sub(r'\(\s*[,;.:]?\s*\)', '', t); return re.sub(r'[ \t]{2,}', ' ', t)


FRONT_HEAD = re.compile(r"^[ \t]*(?:PREFACE|FOREWORD|PROLOGUE|INTRODUCTION|CONTENTS|TABLE OF CONTENTS|ARGUMENT|CHAPTER[ \t]+(?:I|1|ONE)|BOOK[ \t]+(?:I|1|ONE|THE FIRST)|PART[ \t]+(?:I|1|ONE)|LECTURE[ \t]+(?:I|1))\b[^\n]{0,40}$", re.M)


def trim_front(t):
    """Drop the title pages, dedications and library stamps before a book: cut to the first preface, introduction, contents or chapter-one line, if one
    starts within the first 12% of the text."""
    m = FRONT_HEAD.search(t)
    return t[m.start():] if m and m.start() < 0.12 * len(t) else t


def fix_long_s(t, vocab):
    """17th-century type prints the long s (ſ), which the scan reads as f: 'faid' → 'said', 'moft' → 'most'. A word that is not a word, in which some f's
    can be s's to make a common word, is mended; real words ('fire', 'faith') are left alone. Needs the clean-text vocabulary."""
    if not vocab: return t
    def fix(m):
        w = m.group(0); lw = w.lower()
        if lw == 'fo': return 'So' if w[0].isupper() else 'so'
        if 'f' not in lw or lw in vocab or len(lw) < 3: return w
        idx = [i for i, c in enumerate(lw) if c == 'f']
        if len(idx) > 5: return w
        best, bc = None, 0
        for mask in range(1, 1 << len(idx)):
            c = list(lw)
            for b, i in enumerate(idx):
                if mask >> b & 1: c[i] = 's'
            c = ''.join(c); n = vocab.get(c, 0)
            if n > bc: best, bc = c, n
        if best is None or bc < 20: return w
        return best.capitalize() if w[:1].isupper() and not w.isupper() else (best.upper() if w.isupper() else best)
    return re.sub(r'\b[A-Za-z]+\b', fix, t)


INDEX_HEAD = re.compile(r"^[ \t]*(?:GENERAL[ \t]+)?(?:INDEX|INDICES)(?:[ \t]+(?:OF|TO)[ \t]+[A-Za-z ,.'’-]{2,50})?[.:]?[ \t]*$", re.I | re.M)


def trim_index(t):
    """Cut a printed index off the back of a part: the last 'INDEX' line in the final 40% that is followed by index-looking lines
    (short entries ending in page numbers). Running heads and a mid-book 'INDEX' that is not followed by entries are left alone."""
    best = None
    for m in INDEX_HEAD.finditer(t):
        if m.start() < 0.6 * len(t): continue
        tail = [l for l in t[m.end(): m.end() + 6000].split('\n') if l.strip()][:80]
        if len(tail) >= 25 and sum(1 for l in tail if len(l) < 90 and re.search(r'[\d\s,.\-–ivxlIVXL]{1,}\d[\d,. \-–ivxlf]*$', l.strip())) >= 0.45 * len(tail):
            best = m; break
    return t[:best.start()].rstrip() if best else t


BACK_HEAD = re.compile(r"^[ \t]*(?:ADVERTISEMENTS?|(?:WORKS|BOOKS) BY THE SAME AUTHOR|BY THE SAME AUTHOR|OTHER BOOKS BY[^\n]{0,40}|SOME OPINIONS OF THE PRESS|OPINIONS OF THE PRESS|A SELECTION OF|THE WISDOM OF THE EAST SERIES|PRINTED BY[^\n]{0,70}|PRINTED IN GREAT BRITAIN[^\n]{0,40})[ \t.,:]*$", re.M)
BACK_STAMP = re.compile(r"LIBRARY|DATE DUE|STAMPED BELOW|GAYLORD|DEMCO|Acme|Card Pocket|Digitized|UNIVERSITY OF CALIFORNIA|BERKELEY|Seminary|RENEWALS|PRINTED IN U|RETURNED|Photomount|Pamphlet Binder|MEDIAEVAL STUDIES|PONTIFICAL INSTITUTE|QUEEN.S PARK|XEROX|RETURN TO DESK|LOAN DEPT|CatholicSaints|LOWE-MARTIN|DO NOT REMOVE|ATHEN[AÆ]UM|Subscription price|SECT\.|Brigham Young", re.I)


def trim_tail_index(t):
    """Cut an unlabelled printed index off the back: page references make an index dense in digits (over 8% of its characters), prose is not (about 1%).
    Looks at 1,500-character windows from the 75% mark on, finds the earliest window after which every window is dense, and cuts there at a line
    boundary. Never more than 12% of the text, and only when the dense tail is at least 4,000 characters."""
    n = len(t); W = 1500; start = int(n * 0.8)
    dens = []
    for a in range(start, n - W + 1, W // 2):
        w = t[a:a + W]; dens.append((a, sum(c.isdigit() for c in w) / W))
    if not dens: return t
    first = None
    for a, d in reversed(dens):
        if d >= 0.08: first = a
        else: break
    if first is None or n - first < 4000 or n - first > 0.12 * n: return t
    cut_at = t.rfind('\n', 0, first)
    return t[:cut_at if cut_at > 0 else first].rstrip()


def trim_back(t):
    """Opt-in (spec trim_back): cut the publisher's advertisements, the library stamps and an unlabelled printed index off the back of a scan. The first
    advertisement heading in the final 20% starts the cut; then a trailing index; then trailing library-stamp text. Never more than 25% by the first rule."""
    n = len(t)
    m = next(BACK_HEAD.finditer(t, int(n * 0.8)), None)
    if m and m.start() > 0.75 * n: t = t[:m.start()]
    t = trim_tail_index(t.rstrip())
    # a printed "THE END" or "FINIS" in the last 8% closes the book: whatever follows (catalogue cards, imprints, advertisements) is not the text
    ends = [m for m in re.finditer(r'^[ \t]*(?:THE END|FINIS|END OF THE (?:TEXT|BOOK|WORK))\b[^\n]{0,25}$', t, re.M | re.I) if m.start() > 0.92 * len(t)]
    if ends: t = t[:ends[-1].end()].rstrip()
    for _round in range(4):      # a stamp, then junk, then another stamp: repeat until nothing more comes off
        before = len(t)
        # library stamps: cut from the first stamp token in the last 900 characters when what follows is only a few real words
        tail0 = max(0, len(t) - 900)
        for sm in BACK_STAMP.finditer(t, tail0):
            rest = t[sm.start():]
            if len(re.findall(r'\b[a-z]{5,}\b', rest)) <= 12:
                cut_at = t.rfind('\n', 0, sm.start())
                line = t[cut_at + 1: sm.start()]
                if len(line) > 160 or re.search(r'[a-z]{4,}', line): cut_at = max(t.rfind('. ', 0, sm.start()) + 1, cut_at)
                t = t[:cut_at].rstrip()
                break
        ps = re.split(r'\n[ \t]*\n', t)
        k = 0
        while ps and k < 40:
            last = ps[-1].strip()
            letters = sum(c.isalpha() for c in last) / max(1, len(last))
            toks = last.split()
            junky = len(toks) >= 8 and sum(len(re.sub(r'\W', '', w)) <= 3 for w in toks) / len(toks) >= 0.7
            if not last or (BACK_STAMP.search(last) and len(last) < 400) or (len(last) < 300 and letters < 0.55) or (len(last) < 600 and junky): ps.pop(); k += 1
            else: break
        t = '\n\n'.join(ps).rstrip()
        if len(t) == before: break
    return t


def cut(t, sl):
    """Slice t between two regexes: (start, end[, nth]) where nth picks the nth occurrence (0-based) of start."""
    a, b = sl[0].replace(' ', r'\s+'), (sl[1].replace(' ', r'\s+') if sl[1] else None); nth = sl[2] if len(sl) > 2 else 0
    ms = list(re.finditer(a, t, re.M))
    if len(ms) <= nth: print('  slice start not found', a[:50], 'nth', nth); return t
    ma = ms[nth]; mb = re.search(b, t[ma.end():], re.M) if b else None
    out = t[ma.start(): ma.end() + mb.start()] if mb else t[ma.start():]
    if len(sl) > 3 and sl[3]:      # the next book's title lines (OCR'd capitals) sit just before its first words: drop them from the end of this one
        ls = out.rstrip().split('\n')
        while ls and (not ls[-1].strip() or (len(ls[-1]) < 70 and not re.search(r'[a-z]{3,}', ls[-1]))): ls.pop()
        out = '\n'.join(ls)
    return out


# The Jataka's twenty-two books (nipatas) are grouped by the number of verses in each tale; the scans misspell the headings, so the title is
# looked up from the stem of the Pali name.
JATAKA_BOOKS = [('EKA', 'I', 'Ekanipata', 'tales on one verse'), ('DUKA', 'II', 'Dukanipata', 'two verses'), ('TIKA', 'III', 'Tikanipata', 'three verses'),
                ('CATUKKA', 'IV', 'Catukkanipata', 'four verses'), ('PANCA', 'V', 'Pancanipata', 'five verses'), ('CHA', 'VI', 'Chanipata', 'six verses'),
                ('SATTA', 'VII', 'Sattanipata', 'seven verses'), ('ATT', 'VIII', 'Atthanipata', 'eight verses'), ('NAVA', 'IX', 'Navanipata', 'nine verses'),
                ('DASA', 'X', 'Dasanipata', 'ten verses'), ('EKADASA', 'XI', 'Ekadasanipata', 'eleven verses'), ('DVADASA', 'XII', 'Dvadasanipata', 'twelve verses'),
                ('TERASA', 'XIII', 'Terasanipata', 'thirteen verses'), ('PAKINNAKA', 'XIV', 'Pakinnakanipata', 'miscellaneous'), ('VISATI', 'XV', 'Visatinipata', 'twenty verses'),
                ('TIMSA', 'XVI', 'Timsanipata', 'thirty verses'), ('CATTALISA', 'XVII', 'Cattalisanipata', 'forty verses'), ('PANNASA', 'XVIII', 'Pannasanipata', 'fifty verses'),
                ('SATTHI', 'XIX', 'Satthinipata', 'sixty verses'), ('SATTATI', 'XX', 'Sattatinipata', 'seventy verses'), ('ASITI', 'XXI', 'Asitinipata', 'eighty verses'),
                ('MAHA', 'XXII', 'Mahanipata', 'the great book')]


def jataka_book_title(h):
    """'BOOK Vlll. — ATTIIA-NIPATA.' → 'Book VIII · Atthanipata (eight verses)'; an unrecognised heading is returned as scanned."""
    m = re.search(r'([A-Z]+?)-?N[IT]PAT', h.upper().split()[-1])        # the last word of the heading is the Pali name
    if m:
        stem = m.group(1).strip('-')
        for key, num, name, gloss in JATAKA_BOOKS:
            if stem == key or (key == 'ATT' and stem.startswith('ATT')): return 'Book %s · %s (%s)' % (num, name, gloss)
    return h


def rejoin_numbered(t):
    """A scan whose OCR puts a blank line after every printed line (Boehme's Aurora): join the lines, and start a new paragraph only at a numbered
    paragraph ('21. But because…', 'III. Also…') or at a heading line in capitals."""
    out = []; cur = []
    for l in [x.strip() for x in t.split('\n')]:
        if not l: continue
        head = l.isupper() and len(l) < 70
        if re.match(r'^(?:\d{1,3}\.\s|[IVX]{1,5}\.\s)', l) or head:
            if cur: out.append(' '.join(cur)); cur = []
            if head: out.append(l); continue
        cur.append(l)
    if cur: out.append(' '.join(cur))
    return '\n\n'.join(out)


def build(lib, fetch, CACHE):
    import build_texts_util as U
    res = {}; cache_clean = {}
    for lid, spec in SPECS.items():
        if lid not in lib: continue
        try:
            parts = []; idents = spec['idents']
            sls = spec.get('slices') or [spec.get('slice')] * len(idents)
            for ident, sl in zip(idents, sls):
                if ident not in cache_clean: cache_clean[ident] = ia_text(fetch, CACHE, ident) if IS_PG(ident) else clean_ocr(ia_text(fetch, CACHE, ident))
                t = cache_clean[ident]
                parts.append(strip_stamps(cut(t, sl) if sl else t))
            if spec.get('unlong'): parts = [p.replace('ſ', 's') for p in parts]      # a scan whose OCR kept the printed long s as the letter ſ (U+017F): an s, before the clean-up reads it
            if spec.get('strip_hebrew'): parts = [drop_hebrew(p) for p in parts]
            if spec.get('trim_index'): parts = [trim_index(p) for p in parts]
            if spec.get('trim_front'): parts = [trim_front(p) for p in parts]
            if spec.get('trim_back'): parts = [trim_back(p) for p in parts]
            if spec.get('clean_scan'): parts = [re.sub(r'(?:\S*[\^$#%{}|\\~@£]\S*\s+){4,}', ' […] ', p.replace('<', '‹').replace('>', '›')) for p in parts]      # angle brackets that are not markup; a run of a foreign script the scan read as symbols
            if spec.get('drop'): dr = re.compile(spec['drop'], re.M); parts = [dr.sub('', p) for p in parts]
            if spec.get('cut_tail'):      # a regex for the first line of the advertisements, library stamp or index that closes a scan (searched for in the last 40% of each volume, or from cut_tail_from, a fraction, when the index starts earlier)
                _rx = re.compile(spec['cut_tail'].replace(' ', r'\s+'), re.M | re.I)
                parts = [(lambda p, m: p[:m.start()].rstrip() if m else p)(p, next(_rx.finditer(p, int(len(p) * spec.get('cut_tail_from', 0.6))), None)) for p in parts]
            if spec.get('cut_head'):      # a regex for the first line of the book proper, when a contents list or a reprint's front matter comes before it (searched for in the first 25%)
                _rh = re.compile(spec['cut_head'].replace(' ', r'\s+'), re.M | re.I)
                parts = [(lambda p, m: p[m.start():] if m else p)(p, _rh.search(p, 0, int(len(p) * 0.25))) for p in parts]
            if spec.get('rejoin'): parts = [rejoin_numbered(p) for p in parts]    # running heads the scan's OCR spelled a hundred ways
            # slice and split on the text as scanned, so their patterns match what they were written against; then clean each piece
            clean = (lambda x: x) if IS_PG(idents[0]) else (lambda x: fix_ocr(denoise(x), U.VOCAB))
            if spec.get('long_s'): clean = (lambda c0: (lambda x: fix_long_s(c0(x), U.VOCAB)))(clean)
            secs = []; labels = spec.get('labels')
            for k, t in enumerate(parts):
                label = labels[k] if labels else (('Volume %d' % (k + 1)) if len(parts) > 1 else 'Text')
                if spec.get('sectioner'):      # a function that cuts the text into [title, body] sections itself (an encyclopedia's articles, which no heading pattern can find)
                    for h, b in spec['sectioner'](t): secs.append([(h if len(parts) == 1 and not labels else '%s · %s' % (label, h)), clean(b)])
                    continue
                if spec.get('split'):
                    if spec['split'] == 'auto':      # the first of the generic heading patterns that finds 4 to 600 headings
                        pieces = next((p for p in (U.split_headings(t, r) for r in U.AUTO_RX) if 4 <= len(p) <= 600), [['Text', t]])
                    else: pieces = U.split_headings(t, spec['split'])
                    if len(parts) > 1 and spec.get('retitle') and len(pieces) == 1 and pieces[0][0] == 'Text':
                        secs.append([label, clean(t)])                       # a part with no headings (a preface) is one section under its own label
                        continue
                    for h, b in pieces:
                        if spec.get('retitle'): h = spec['retitle'](h)
                        secs.append([(h if len(parts) == 1 and not labels else '%s · %s' % (label, h)), clean(b)])
                else:
                    secs.append([label, U.unwrap(clean(t))])
            secs = U.finish(secs, False)
            if spec.get('skip'): secs = [s for s in secs if not re.search(spec['skip'], s[0])]      # sections by heading: a contents list or a closing word the splitter made a section of
            if spec.get('min_chars'): secs = [s for s in secs if len(s[1]) >= spec['min_chars']]      # a contents list the splitter broke into one-line sections
            note = (spec.get('note', '') + ' ' if spec.get('note') else '') + ('' if IS_PG(idents[0]) else 'Text from a scan of the printed edition, so occasional OCR errors remain.')
            res[lid] = dict(secs=secs, by=spec['by'], license=spec.get('license', U.PG_LICENSE if IS_PG(idents[0]) else LICENSE), src=('https://www.gutenberg.org/ebooks/' + idents[0][2:]) if IS_PG(idents[0]) else 'https://archive.org/details/' + idents[0], verse=False, note=note.strip())
        except Exception as ex:
            print('  FAILED', lid, ex)
    return res

# the Library's shelf texts (Hermetic, occult, Masonic, Spiritualist, field records) and further series volumes are specified in their own modules
for _mod in ('texts_shelf', 'texts_lore', 'texts_more', 'texts_fathers', 'texts_talmud', 'texts_ancient', 'texts_abrahamic', 'texts_christian', 'texts_asia', 'texts_peoples', 'texts_round6', 'texts_gaps2', 'texts_round8', 'texts_round9', 'texts_round10', 'texts_round11', 'texts_round12', 'texts_round13', 'texts_round14', 'texts_round15', 'texts_round16', 'texts_round17', 'texts_round18', 'texts_round19', 'texts_round20', 'texts_round21', 'texts_round22', 'texts_round23', 'texts_round24', 'texts_round25c', 'texts_round25'):
    try: SPECS.update(__import__(_mod).SPECS)
    except ImportError: pass
