"""Specs for the Library's six shelves (Hermetic and alchemical, ceremonial magic, Spiritualism and Theosophy, Freemasonry, Siberia and the Arctic, tribal field
records): scans from the Internet Archive and books from Project Gutenberg. Merged into texts_archive.SPECS (see the end of that file), built with
python3 build_texts.py --only=ids. An ident 'PG123' is Project Gutenberg #123. These are the generic builds: a printed index is cut from the back, the title
pages from the front, and the book is split at its own BOOK / CHAPTER / PART headings if it has four or more; where a book has no such headings it is
chunked. Sources and sizes were listed to the maker on 16 November 2026 and the fetch was approved ("find everything you can and get them all").
"""

FIELD = ('A record made by an outside observer in the colonial or missionary period: it reports what he saw or was told, in his period’s terms and with its '
         'prejudices. Read it critically, and where a tradition’s own people have published their own account, read that as well.')
GRIMOIRE = 'A historical grimoire, kept here as a document in the history of magic, not as an endorsement.'
OCR = 'Text from a scan of the printed edition, so occasional OCR errors remain.'
LONG_S = ('Seventeenth-century type (with the long s) read by OCR: a repair pass mends the commonest misreadings (“faid” for “said”), but this text is rougher '
          'than the others and some words are still wrong.')


def G(idents, by, note='', **kw):
    d = dict(idents=idents if isinstance(idents, list) else [idents], by=by, note=note, trim_index=True, trim_front=True, split='auto')
    d.update(kw)
    return d


SPECS = {
    # ── Hermetic, alchemical and Rosicrucian ──
    'h-agri': G(['cu31924028928236'] * 2, 'Henry Cornelius Agrippa, Three Books of Occult Philosophy or Magic: Book One, Natural Magic, edited with essays by Willis F. Whitehead (Chicago: Hahn & Whitehead, 1898)',
                'This edition holds only the first of Agrippa’s three books (Natural Magic, 74 chapters, in the old English translation), with the editor’s preface and introduction. The editor’s essays after the book (on the Cabala, the Tarot, Rosicrucians and the like) are left out; they are his late-nineteenth-century commentary, not Agrippa.',
                slices=[(r'^PREFACE\.$', r'^BOOK ONE,? . NATURAL MAGIC\.$'), (r'^BOOK ONE,? . NATURAL MAGIC\.$', r"^HENRY MORLEY'S CRITICISM\.$")],
                labels=['Editor’s preface and introduction', 'Book One: Natural Magic'],
                split=r'(?i)^CHAPT[EF]R\s+[A-Za-z]{1,8}[.,*]?\s*$', retitle=lambda h: 'Chapter ' + h.split()[-1].rstrip('.,*').upper() if h.upper().startswith('CHAPT') else h),
    'h-para': G(['cu31924092287121', 'cu31924092287113'], 'A. E. Waite (editor and translator), The Hermetic and Alchemical Writings of Aureolus Philippus Theophrastus Bombast, of Hohenheim, called Paracelsus the Great, 2 vols. (London: James Elliott, 1894)',
                'Both volumes: the alchemical writings (volume 1: the Coelum Philosophorum, the Tincture of the Philosophers, the Gradations of Metals and others, with Waite’s preface) and the medical and philosophical writings (volume 2). Waite worked from the Latin and German of the 1658 Geneva folio; some attributions to Paracelsus are doubtful.',
                labels=['Volume 1 · Hermetic chemistry', 'Volume 2 · Hermetic medicine and philosophy']),
    # h-museum: since 18 November 2026 its text is the typed copy built by texts_hmuseum.py (build_texts.py runs that after this spec and its entry wins); this spec stays because texts_pages.py and texts_originals.py read the scans' addresses from it
    'h-museum': G(['india.history.resource.84871', 'india.history.resource.84873'], 'A. E. Waite (editor), The Hermetic Museum, Restored and Enlarged, 2 vols. (London: James Elliott, 1893)',
                  'Twenty-two alchemical tracts first collected in Latin in 1678, in the English translation of 1893 (volume 1: the Golden Calf, Sophic Hydrolith, Secret Book of Artephius and others; volume 2: Basil Valentine, the Fount of Chemical Truth and the rest), with Waite’s prefaces.'),
    'h-boeh': G('JacobBoehmesAurora-ElectronicText-edition', 'Jacob Boehme, Aurora (Morgen-Röte im Aufgang), written 1612, translated by John Sparrow (London: Giles Calvert, 1656); the 1914 edition of C. J. Barker and D. S. Hehner, as a free electronic text (2009)',
                'Boehme’s first book, left unfinished: twenty-seven chapters on God, nature, the fall of the angels and the creation, with the translator’s preface and the editors’ notes. Seventeenth-century English, so the spelling and the strange vocabulary of his “qualities” take getting used to. The electronic edition’s own introduction (2009) is left out.',
                slice=(r'^TO THE READER\s*$', None), split=r'^THE\s+[A-Z\-]+\s+CHAPTER\s*$', retitle=lambda h: h.title(), trim_front=False, trim_index=False, rejoin=True,
                drop=r'(?ms)^THE BRIEF CONTENTS OF THE TWENTY-SIX.*?(?=^THE FIRST CHAPTER\s*$)'),
    'h-supe': G('PG33742', 'Jakob Böhme, Dialogues on the Supersensual Life, edited by Bernard Holland (1901; Project Gutenberg #33742)',
                'Two dialogues between a scholar and his master on how the soul comes to God, from Boehme’s teaching, with Holland’s preface. His Aurora is its own entry.'),
    'h-fama': G('fameconfessionof00vaug', 'Thomas Vaughan (translator), The Fame and Confession of the Fraternity of R:C: (London, 1652)',
                'The two Rosicrucian manifestos, the Fama Fraternitatis (1614) and the Confessio Fraternitatis (1615), in Thomas Vaughan’s English of 1652. ' + LONG_S, long_s=True),
    'h-chym': G('hermetickromance00rose', 'The Hermetick Romance, or the Chymical Wedding, written in High Dutch by Christian Rosencreutz, translated by E. Foxcroft (London, 1690)',
                'The third Rosicrucian text (1616, probably by Johann Valentin Andreae), an allegorical tale in seven days, in the English of 1690. ' + LONG_S, long_s=True),
    'h-dee': G('truefaithfulrela00deej', 'Meric Casaubon (editor), A True & Faithful Relation of What Passed for Many Yeers between Dr. John Dee … and Some Spirits (London, 1659)',
               'John Dee’s diaries of his angel conversations with Edward Kelley, as published by Casaubon, who meant to discredit them; his long preface argues against them and is kept. ' + LONG_S, long_s=True),
    # ── Ceremonial magic, grimoires and divination ──
    'm-keysol': G('b24884431', 'S. L. MacGregor Mathers (editor and translator), The Key of Solomon the King (Clavicula Salomonis) (London: George Redway, 1889)',
                  'Mathers’s version of the Key of Solomon from manuscripts in the British Museum, with his preface and introduction. ' + GRIMOIRE),
    'm-goet': G('ac_goetia', 'S. L. MacGregor Mathers and Aleister Crowley, The Book of the Goetia of Solomon the King (Boleskine: Society for the Propagation of Religious Truth, 1904)',
                'The first book of the Lemegeton, the “Lesser Key of Solomon”, edited by Mathers and Crowley (whose own notes and verses are in this edition). ' + GRIMOIRE),
    'm-abra': G('sacred-magic-abramelin', 'S. L. MacGregor Mathers (translator), The Book of the Sacred Magic of Abramelin the Mage, Book II (London: John M. Watkins, 1900; typeset copy by Benjamin Rowe, 1998)',
                'Only the Second Book (Book II), the book of the operations themselves, from Benjamin Rowe’s typeset copy of Mathers’s 1900 translation of a French manuscript of Abraham the Jew’s instructions to his son; Books I and III are not in this scan. ' + GRIMOIRE, slice=(r'^THE SECOND BOOK OF THE SACRED MAGIC\.', None)),
    'm-agr4': G('b20458563', 'Robert Turner (translator), Henry Cornelius Agrippa His Fourth Book of Occult Philosophy (London, 1655)',
                'The pseudo-Agrippan Fourth Book (not written by Agrippa), with the Geomancy that opens the 1655 volume. The Heptameron and the other tracts in the same volume are in their own entry. ' + GRIMOIRE + ' ' + LONG_S,
                slice=(r'(?i)^of geomancy', r'(?i)^The end of the fourth ba[a-z]+ of Agrippa'), long_s=True),
    'm-hept': G('b20458563', 'Robert Turner (translator), Henry Cornelius Agrippa His Fourth Book of Occult Philosophy (London, 1655): the Heptameron, or Magical Elements, of Peter de Abano',
                'The Heptameron (the ritual of the seven days and their angels), attributed to Peter of Abano, taken from the 1655 volume. ' + GRIMOIRE + ' ' + LONG_S,
                slice=(r'^[A-Z]{1,2}[l1]?eptameron', r'^FINIS'), long_s=True),
    'm-levi': G('transcendentalma00leviuoft', 'A. E. Waite (translator), Éliphas Lévi, Transcendental Magic: Its Doctrine and Ritual (London: George Redway, 1896)',
                'Lévi’s Dogme et Rituel de la Haute Magie in Waite’s English, with Waite’s preface and notes. Lévi’s history of the occult revival of 1850s France is his own reading, not a record of old practice.'),
    'm-levh': G('PG70033', 'A. E. Waite (translator), Éliphas Lévi, The History of Magic (London: William Rider & Son, 1913; Project Gutenberg #70033)',
                'Lévi’s Histoire de la Magie (1860) in Waite’s English, with Waite’s preface. It is an occultist’s history, and its claims of an unbroken magical tradition are not accepted by historians.'),
    'm-tarot': G('PG43548', 'Arthur Edward Waite, The Pictorial Key to the Tarot (London: William Rider & Son, 1911; Project Gutenberg #43548)',
                 'Waite’s account of the Tarot (the meaning of the cards, the history he accepted, and the divination methods), with Pamela Colman Smith’s pictures not reproduced.'),
    'm-papus': G('tarotofbohemians00papu', 'Papus (Gérard Encausse), The Tarot of the Bohemians, translated by A. P. Morton (1896 edition)',
                 'The French occultist’s absolute key to occult science, on the Tarot as the book of the Gypsies: a nineteenth-century theory of its Egyptian and Kabbalistic origin, which scholars reject.'),
    # ── Spiritualism, Theosophy and New Thought ──
    'v-isis': G(['PG68705', 'PG75871'], 'Helena P. Blavatsky, Isis Unveiled: A Master-Key to the Mysteries of Ancient and Modern Science and Theology, 2 vols. (New York: J. W. Bouton, 1877; Project Gutenberg #68705 and #75871)',
                'Her first great book. Volume 1 (Science) and volume 2 (Theology). Read it critically: it quotes widely and loosely, and many of its claims about antiquity are not supported by the scholarship of her time or ours.',
                labels=['Volume 1 · Science', 'Volume 2 · Theology']),
    'v-mahat': G('mahatmalettersto00sinnuoft', 'A. T. Barker (editor), The Mahatma Letters to A. P. Sinnett from the Mahatmas M. & K. H. (London: T. Fisher Unwin, 1923)',
                 'Letters said to come from two Theosophical “Masters”, with Barker’s introduction and appendices. Whether their authors existed as claimed is disputed.'),
    'v-heav': G('PG17368', 'Emanuel Swedenborg, Heaven and Its Wonders and Hell, translated by John C. Ager (Swedenborg Foundation; Project Gutenberg #17368)',
                'Swedenborg’s account of the afterlife as he said he saw it, in numbered paragraphs.'),
    'v-divl': G('PG16627', 'Emanuel Swedenborg, Angelic Wisdom Concerning the Divine Love and the Divine Wisdom, translated by John C. Ager (Swedenborg Foundation; Project Gutenberg #16627)',
                'Swedenborg’s treatise on God as love and wisdom and on creation, in numbered paragraphs.'),
    'v-kard': G('spiritualistphil01kard', 'Allan Kardec, The Spirits’ Book (Spiritualist Philosophy), translated by Anna Blackwell (1875 edition)',
                'The founding book of Spiritism: questions put to spirits through mediums, and the answers Kardec collected (1857), with the translator’s preface.'),
    'v-davi': G('principlesofnatu00davi', 'Andrew Jackson Davis, The Principles of Nature, Her Divine Revelations, and a Voice to Mankind (New York, 1847)',
                'The “Poughkeepsie Seer’s” book, dictated in trance (as he said) to a scribe, and a founding book of American Spiritualism.'),
    'v-quim': G('quimbymanuscript00quimrich', 'Horatio W. Dresser (editor), The Quimby Manuscripts, Showing the Discovery of Spiritual Healing and the Origin of Christian Science (New York: Thomas Y. Crowell, 1921)',
                'Phineas Quimby’s writings on mind and healing, with Dresser’s introduction and his case that Mary Baker Eddy drew on them (a claim Christian Scientists dispute).'),
    'v-trow': G('PG10390', 'Thomas Troward, The Edinburgh Lectures on Mental Science (1909; Project Gutenberg #10390)',
                'Lectures on the law of thought and its power, a root text of New Thought.'),
    'v-watt': G('PG59844', 'Wallace D. Wattles, The Science of Getting Rich (1910; Project Gutenberg #59844)',
                'A short New Thought book on wealth through thought and right action. It is here as a document of New Thought; the idea that wealth is a sign of spiritual merit is one many traditions reject.'),
    # ── Freemasonry and the Old Charges ──
    'k-old': G('cu31924030299782', 'William James Hughan, The Old Charges of British Freemasons (London: Simpkin, Marshall, 1872)',
               'Hughan’s collection of the medieval manuscript “Old Charges” (the oldest Masonic constitutions), with his history of them.'),
    'k-ande': G('constitutionsoff00andeuoft', 'James Anderson, The Constitutions of the Free-Masons (London, 1723; this printing 1855)',
                'The founding constitutions of the Grand Lodge of England: a legendary history of the craft, the Charges (including the charge on God and religion), and the regulations.'),
    'k-pres': G('illustrationsma01presgoog', 'William Preston, Illustrations of Masonry (London; 1829 edition)',
                'Preston’s lectures and history of the craft, a standard Masonic book of the early nineteenth century.'),
    'k-msym': G('PG11937', 'Albert G. Mackey, The Symbolism of Freemasonry (1869; Project Gutenberg #11937)', 'Mackey’s explanation of the craft’s symbols, with his theory of their origins.'),
    'k-menc': G('encyclopaediaoff00mackrich', 'Albert G. Mackey, An Encyclopaedia of Freemasonry and Its Kindred Sciences (Philadelphia: L. H. Everts, 1874)',
                'An alphabetical reference work on Masonic terms, history and symbols, in the first edition of 1874; later editions were revised and enlarged. Mackey also writes up legends as history.'),
    'k-pike': G('PG19447', 'Albert Pike, Morals and Dogma of the Ancient and Accepted Scottish Rite of Freemasonry (Charleston, 1871; Project Gutenberg #19447)',
                'Pike’s lectures for each degree of the Scottish Rite, a long, learned, and often rambling comparative essay on religion and philosophy. The Gutenberg file ends with T. W. Hugo’s Digest-Index of 1909 (a page-by-page subject index), which is left out.',
                slice=(r'\A', r'^DIGEST--INDEX OF')),
    'k-ward': G('freemasonry-and-the-ancient-gods', 'J. S. M. Ward, Freemasonry and the Ancient Gods (London: Simpkin, Marshall, 1921)',
                'An argument that Masonic ritual descends from the ancient mysteries, which most historians of the craft do not accept.'),
    'k-wilm': G('meaningofmasonry0000wlwi_y0d8', 'W. L. Wilmshurst, The Meaning of Masonry (this scan the 1927 edition; first published 1922)',
                'A mystical reading of the three Craft degrees as a path of inner transformation.'),
    'k-keys': G('The.Lost.Keys.Of.Masonry.Manly.P.Hall.1923', 'Manly P. Hall, The Lost Keys of Freemasonry (Richmond: Macoy Publishing, 1923)',
                'A short esoteric reading of the craft as a path of self-mastery. The scan is a web copy and may carry typing slips.'),
    'k-sota': G('TheSecretTeachingsOfAllAgesManlyHall', 'Manly P. Hall, The Secret Teachings of All Ages (San Francisco: H. S. Crocker, 1928)',
                'A very wide survey of ancient mysteries, Kabbalah, alchemy, Tarot and the rest, written to show one hidden tradition behind them. Treat its claims about antiquity as the author’s belief, not established history.'),
    # ── Siberia and the Arctic ──
    'a-bogo': G('jstor-659393', 'Waldemar Bogoras, The Chukchi of Northeastern Asia, American Anthropologist (1901)', 'A journal paper, not the full memoir (the Jesup Expedition’s volume on the Chukchi is not open). ' + FIELD, trim_index=False, slice=(r'^THE CHUKCHI OF NORTHEASTERN ASIA\s*$', None)),
    'a-bogf': G('jstor-659376', 'Waldemar Bogoras, The Folklore of Northeastern Asia, as Compared with That of Northwestern America, American Anthropologist (1902)', 'A journal paper on the shared myths of the two shores of the Bering Strait. ' + FIELD, trim_index=False, slice=(r'^THE FOLKLORE OF NORTHEASTERN ASIA, AS', None)),
    'a-joch': G('jstor-659272', 'Waldemar Jochelson, The Mythology of the Koryak, American Anthropologist (1904)', 'A short journal paper, not the full Jesup memoir. ' + FIELD, trim_index=False, slice=(r'^THE MYTHOLOGY OF THE KORYAK', None)),
    'a-czap': G('aboriginalsiberi00czap', 'M. A. Czaplicka, Aboriginal Siberia: A Study in Social Anthropology (Oxford: Clarendon Press, 1914)', 'A survey of Siberian peoples, with a part on their religion and on shamanism, and a long glossary and bibliography at the back (the glossary is left out). ' + FIELD),
    'a-rasm': G('intellectualcult00rasm_1', 'Knud Rasmussen, Intellectual Culture of the Iglulik Eskimos (Report of the Fifth Thule Expedition 1921–24, vol. 7, no. 1; Copenhagen, 1929)',
                'Rasmussen’s record of Iglulik Inuit beliefs, songs, tales and the words of the angakkoq (shaman) Aua. Rasmussen was part Greenlandic Inuit himself, and Aua’s own words are quoted at length.'),
    # ── Tribal and animist traditions: field records ──
    'a-spen': G('nativetribesofce00spenuoft', 'Baldwin Spencer and F. J. Gillen, The Native Tribes of Central Australia (London: Macmillan, 1899)', 'The classic record of Arrernte and neighbouring peoples’ ceremonies and totemism. Parts of the ceremonies recorded here are restricted by the people themselves. ' + FIELD),
    'a-codr': G('melanesiansstudi00codruoft', 'R. H. Codrington, The Melanesians: Studies in Their Anthropology and Folk-Lore (Oxford: Clarendon Press, 1891)', 'The missionary’s report that gave the West the word “mana”. ' + FIELD),
    'a-call': G('relamazulu00calluoft', 'Henry Callaway, The Religious System of the Amazulu (Natal and London, 1870)', 'Zulu informants’ own accounts, written down and translated by a missionary, of Unkulunkulu, the ancestors (amatongo) and the diviners. ' + FIELD),
    'a-blee': G('specimensofbushm00bleeuoft', 'W. H. I. Bleek and L. C. Lloyd, Specimens of Bushman Folklore (London: George Allen, 1911)', 'San (Bushman) myths and tales dictated to Bleek and Lloyd in the 1870s, with the text and the English side by side in the original. ' + FIELD),
    'a-ghos': G('PG74335', 'James Mooney, The Ghost-Dance Religion and the Sioux Outbreak of 1890 (Bureau of American Ethnology, 14th Annual Report, part 2, 1896; Project Gutenberg #74335)', 'Mooney’s record of the Ghost Dance movement and its songs, with the account of Wounded Knee. ' + FIELD),
    'a-cher': G('PG45634', 'James Mooney, Myths of the Cherokee (Bureau of American Ethnology, 19th Annual Report, 1900; Project Gutenberg #45634)', 'Cherokee stories and beliefs gathered from Cherokee informants, with a glossary and notes. ' + FIELD),
    'a-navl': G('navaholegends00mattrich', 'Washington Matthews, Navaho Legends (Boston: Houghton Mifflin, for the American Folk-Lore Society, 1897)', 'Navajo creation and hero stories, with the translator’s notes. Some ceremonial material was left out by the author at the singers’ wish. ' + FIELD),
    'a-omah': G('omahatribealice00fletrich', 'Alice C. Fletcher and Francis La Flesche, The Omaha Tribe (Bureau of American Ethnology, 27th Annual Report, 1911)', 'A detailed record of Omaha life and ceremony, by an ethnologist and an Omaha scholar. ' + FIELD),
    'a-malm': G('malaymagicbeingi00skeauoft', 'Walter William Skeat, Malay Magic, Being an Introduction to the Folklore and Popular Religion of the Malay Peninsula (London: Macmillan, 1900)', 'Spirits, charms, rites and folk belief in the Malay states. ' + FIELD),
    'a-phil': G(['PG12635', 'PG16501', 'PG13120', 'PG13701', 'PG15022', 'PG15184'], 'Emma Helen Blair and James Alexander Robertson (editors), The Philippine Islands, 1493–1898, volumes 4, 5, 6, 7, 12 and 13 (Cleveland: Arthur H. Clark, 1903–1909; Project Gutenberg #12635, #16501, #13120, #13701, #15022, #15184)',
                'Six volumes of translated Spanish documents, among them the early accounts of Filipino beliefs and practice by friars such as Juan de Plasencia, Miguel de Loarca and Pedro Chirino, with the editors’ notes. ' + FIELD,
                labels=['Volume 4', 'Volume 5', 'Volume 6', 'Volume 7', 'Volume 12', 'Volume 13']),
    'a-maor': G('spiritualmentalc00bestuoft', 'Elsdon Best, Spiritual and Mental Concepts of the Maori (Wellington: Dominion Museum Monograph no. 2, 1922)', 'A short record of Maori beliefs about the spirit, the afterlife and tapu. ' + FIELD),
    'a-hula': G('unwritten00emer', 'Nathaniel B. Emerson, Unwritten Literature of Hawaii: The Sacred Songs of the Hula (Bureau of American Ethnology, Bulletin 38, 1909)', 'The hula’s chants and their meaning, by a physician born in Hawaii to missionary parents. ' + FIELD),
    'a-grey': G('polynesianmythol00greyuoft', 'Sir George Grey, Polynesian Mythology and Ancient Traditional History of the New Zealanders (London: John Murray, 1855)', 'Maori myths gathered by the colonial governor from chiefs and priests. Another part of the same book is the Rangi and Papa entry (x-ran). ' + FIELD),
}
