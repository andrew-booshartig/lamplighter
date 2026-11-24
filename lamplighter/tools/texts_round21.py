"""Specs for a twenty-first batch of open (pre-1931) English texts (17 November 2026), continuing the maker's "get as close as we can to covering all the religions" and aimed at the
traditions the assessment of 17 November still found without an example (279 of 789): the peoples of the ancient Mediterranean the Library had no ethnography of (Strabo, Ammianus
Marcellinus, Caesar's Gallic War, Evans on the Illyrians), the Uniate and Melkite Churches (Fortescue), the Muggletonians, the writings the Rizalista movements venerate, and a
record from Papua (Williams; Seligmann is already the Library's a-smb). Merged into texts_archive.SPECS; built with python3 build_texts.py --only=ids.

Left out: the Loeb Julian (the scans mix the Greek text in as noise), Crowley's Book of the Law (the one open scan is the 1938 edition with Crowley's later introduction), Henry's Ancient Tahiti
(no text layer), Strabo's Geography in the Loeb version (Greek facing page).
"""
from texts_round9 import S, SCH, REF
from texts_round10 import G, T, FIELD
from texts_round8 import MOV

SPECS = {}
fix = lambda i, **kw: SPECS[i].update(kw)


def sch(i, idents, by, note, title, when, **kw):
    if kw.get('split', 'auto') == 'auto': kw.setdefault('min_chars', 250)
    SPECS[i] = G(idents, by, note + ' ' + SCH, lib=S(title, when), **{'split': 'auto', **kw})


def fld(i, idents, by, note, title, when, **kw):
    if kw.get('split', 'auto') == 'auto': kw.setdefault('min_chars', 250)
    SPECS[i] = G(idents, by, note + ' ' + FIELD, lib=T(title, when), **{'split': 'auto', **kw})


def mov(i, idents, by, note, title, when, station='Bahá’í, Theosophy', **kw):
    if kw.get('split', 'auto') == 'auto': kw.setdefault('min_chars', 250)
    SPECS[i] = G(idents, by, note + ' ' + MOV, lib=(title, 'mo', when, 'mod', station), **{'split': 'auto', **kw})


# ── The ancient Mediterranean and its edges ──
sch('x-amm', 'romanhistoryof00ammiiala', 'Ammianus Marcellinus, The Roman History during the Reigns of the Emperors Constantius, Julian, Jovianus, Valentinian and Valens, translated by C. D. Yonge (London: George Bell and Sons, 1894; Bohn’s Classical Library; first published 1862)',
    'The Greek officer-historian’s history of the Roman world from 353 to 378 CE (books 14 to 31 of his thirty-one survive): the court of Constantius, Julian’s campaigns and his attempt to restore the old religion, the war with Persia, the Huns, the Alans and the Goths and the disaster of Adrianople, with his digressions on the peoples and on omens, oracles and augury. By a pagan who served in the army and wrote in Latin.',
    'The Roman History of Ammianus Marcellinus (trans. Yonge, 1862)', '353–378 CE', split=None)
sch('x-str', ['geographyofstrab01strarich', 'geographyofstrab02strarich', 'geographystrabo01falcgoog'], 'Strabo, The Geography, literally translated with notes by H. C. Hamilton and W. Falconer, three volumes (London: Henry G. Bohn, 1854–57; Bohn’s Classical Library)',
    'The Greek geographer’s description of the whole known world in seventeen books, written under Augustus and Tiberius: Spain and its peoples, Gaul and Britain and the Druids, Germany, the Illyrians, the Thracians and Dacians and the peoples of the Black Sea steppe, Greece and Asia Minor with their temples, oracles and priesthoods, Persia and the Magi, India, Egypt and Libya. A source for the peoples that left no writing of their own.',
    'The Geography of Strabo (trans. Hamilton and Falconer, 1854–57), three volumes', 'c. 20 BCE–20 CE', split=None)
sch('x-cae', 'caesarscommentar00caes', 'Julius Caesar, Commentaries on the Gallic War, literally translated with explanatory notes (New York: Hinds and Noble, Handy Literal Translations, 1910 printing; the translator is not named on the scan)',
    'Caesar’s own account of his conquest of Gaul in 58–50 BCE: the Helvetii and Ariovistus, the Belgae, the Veneti, the crossings of the Rhine and of the Channel to Britain, the rising of Vercingetorix, and in book VI his description of the Gauls’ religion, the Druids and their gods and sacrifices, and of the customs of the Germans. Books I to VII only: the eighth, by his officer Hirtius, is not in this scan.',
    'Commentaries on the Gallic War (Julius Caesar, literal translation)', '58–50 BCE', split=None, cut_head=r'^\s*COMMENTARIES OF C\. JULIUS', cut_tail=r'^\s*Idioms of C[a-z]*sar')
sch('x-evi', 'antiquarianresea00evan', 'Arthur John Evans, Antiquarian Researches in Illyricum, parts I and II, communicated to the Society of Antiquaries (Westminster: Nichols and Sons, 1883)',
    'The young archaeologist’s report of his journeys through Dalmatia, Bosnia and Herzegovina in the 1870s and early 1880s: the Roman towns and roads, the inscriptions, the tombs and the older remains of the Illyrian peoples, with notes on the gods and cults the stones name. Evans later excavated Knossos.',
    'Antiquarian Researches in Illyricum (Arthur J. Evans, 1883)', 'recorded 1870s–80s CE', split=None)
sch('x-ust', 'uniateeasternchu0000adri', 'Adrian Fortescue, The Uniate Eastern Churches: The Byzantine Rite in Italy, Sicily, Syria and Egypt, edited by George D. Smith (London: Burns, Oates and Washbourne, 1923)',
    'The Catholic scholar’s history of the Eastern Christians who are in communion with Rome and keep the Byzantine rite, published after his death: what a Uniate Church is, the Italo-Greeks of southern Italy and Sicily, the Albanians of Italy, and the Melkites of Syria and Egypt (the Greek Catholic patriarchate of Antioch), with the liturgy and the history of each. Written from the Roman Catholic side. The Ruthenian (Ukrainian Greek Catholic) Church is mentioned but has no chapter of its own in this volume.',
    'The Uniate Eastern Churches (Adrian Fortescue, 1923)', '1923 CE', split=None)

# ── Movements and writings venerated by them ──
mov('x-mug', 'worksjohnreevea00powegoog', 'John Reeve and Lodowicke Muggleton, The Works of John Reeve and Lodowicke Muggleton, three volumes (London: printed for the editors, 1832; reprinting the writings of 1652–99)',
    'The writings of the two London tailors who announced in 1651–52 that they were the Two Last Witnesses of the Spirit foretold in the book of Revelation, and of the Muggletonians who kept their faith for three centuries: Reeve’s and Muggleton’s letters, the Divine Looking-Glass, the Acts of the Witnesses of the Spirit and the other treatises, with their teaching on God, the soul and the end of the world.',
    'The Works of John Reeve and Lodowicke Muggleton (1832), three volumes', '1651–99 CE (ed. 1832)', split=None)
sch('x-rz1', 'socialcancer00rizaiala', 'José Rizal, The Social Cancer: A Complete English Version of Noli Me Tangere, translated by Charles Derbyshire (Manila: Philippine Education Company, 1912)',
    'The Filipino doctor-novelist’s novel of 1887 about the Philippines under Spanish rule, the friars and the Church. Rizal was shot by the Spanish in 1896, and some Filipino movements (the Rizalistas) honour him as a messiah and read his writings as scripture; he did not claim it himself. The novel is here as the text that the Rizalistas venerate, and as a record of the Catholic Philippines of its time.',
    'The Social Cancer: Noli Me Tangere (José Rizal, 1887; trans. 1912)', '1887 CE (trans. 1912)')
sch('x-rz2', 'reignofgreedcomp0000riza', 'José Rizal, The Reign of Greed: A Complete English Version of El Filibusterismo, translated by Charles Derbyshire (Manila: Philippine Education Company, 1912)',
    'Rizal’s second novel (1891), the sequel to the Noli, about the failed revenge of Simoun in the Philippines under Spanish rule: the friars, the Church and the colonial state. Honoured as scripture by the Rizalista movements, which hold that Rizal was a messiah; he did not claim it himself.',
    'The Reign of Greed: El Filibusterismo (José Rizal, 1891; trans. 1912)', '1891 CE (trans. 1912)')

# ── Papua ──
fld('a-ork', 'orokaivasociety0000fewi', 'F. E. Williams, Orokaiva Society (London: Oxford University Press, 1930)',
    'The Papuan government anthropologist’s study of the Orokaiva of north-east Papua: their villages and clans, the feasts and the taro, the initiation ceremonies with the bull-roarer, magic and sorcery, and their beliefs about spirits and the dead.',
    'Orokaiva Society (F. E. Williams, 1930)', 'recorded 1920s CE')

# repairs after the test build: the indexes (the scan's cleaning removes their headings, so each cut starts at the index's first entry) and the advertisements at the end of the Caesar
fix('x-amm', cut_tail=r'^ABANNI, a people of Africa')
fix('x-str', cut_tail=r'^Aarassus, t\. of Pisidia', cut_tail_from=0.3)      # volume III: the index to the whole work
fix('x-ust', cut_tail=r'^\s*ABBREVIATIONS\s*$', cut_tail_from=0.9)
