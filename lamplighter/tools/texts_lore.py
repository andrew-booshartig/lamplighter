"""Specs for the Library's folklore and witchcraft shelves (Britain and Ireland, Europe, witchcraft and demonology): books from Project Gutenberg (an ident 'PG123' is
Gutenberg #123) and scans from the Internet Archive. Merged into texts_archive.SPECS (see the end of that file) and built with
python3 -I tools/build_texts.py --only=ids. The rest of the shelf, from Global Grey ebooks, is in texts_gg.py. Generic builds like the other shelves: title pages
cut from the front, a printed index from the back, the book split at its own BOOK / CHAPTER / PART headings if it has four or more, chunked if it has none.
"""

import re

LORE = ('A collection made by an antiquarian or scholar of his period, who edited, retold and explained what he heard. Read it as a source on what was told and on what the collector '
        'made of it, and read living tellers’ own accounts beside it.')
WITCH = ('A document of the witch hunts or of the belief behind them. Its claims about witches are not evidence that witchcraft worked: the trials sent thousands of innocent people, '
         'most of them women, to their deaths.')
OLD = 'The spelling and wording are those of the period.'


def G(idents, by, note='', **kw):
    d = dict(idents=idents if isinstance(idents, list) else [idents], by=by, note=note, trim_index=True, trim_front=True, split='auto')
    d.update(kw)
    return d


SPECS = {
    # ── Folklore and the fairy faith: Britain and Ireland
    'l-jaco': G('PG7439', 'Joseph Jacobs (editor), English Fairy Tales (London: David Nutt, 1890; Project Gutenberg #7439)',
                'Forty-three English tales retold for children from older collections, with Jacobs’s notes and sources at the end. ' + LORE),
    'l-jac2': G('PG7885', 'Joseph Jacobs (editor), Celtic Fairy Tales (London: David Nutt, 1891; Project Gutenberg #7885)',
                'Twenty-six Irish, Scottish and Welsh tales retold from older collections, with Jacobs’s notes and sources. ' + LORE),
    'l-squi': G('PG54616', 'Charles Squire, The Mythology of the British Islands (London: Blackie, 1905; Project Gutenberg #54616)',
                'A survey of the old Irish, Welsh and Scottish myths, from Squire’s period, when the mythology was read as the remains of a nature religion. Later scholars do not accept much of that reading. ' + LORE),
    # ── Folklore, custom and the study of folklore: Europe
    'l-grim': G('PG5314', 'Jacob and Wilhelm Grimm, Household Tales, translated by Margaret Hunt (London: George Bell, 1884; Project Gutenberg #5314)',
                'The Grimms’ collection (Kinder- und Hausmärchen): 200 tales and the ten children’s legends, in Hunt’s English, without her notes. The Grimms revised the tales over their editions, and told them in a style of their own. ' + LORE),
    'l-dase': G('PG8933', 'Peter Christen Asbjørnsen and Jørgen Moe, Popular Tales from the Norse, translated by George Webbe Dasent (Edinburgh: Edmonston and Douglas, 1859; Project Gutenberg #8933)',
                'The Norwegian folk tales (East of the Sun and West of the Moon, the Three Billy-Goats Gruff and others) in Dasent’s English, with his long introduction on the Norse and their stories. ' + LORE),
    'l-fjel': G('PG36385', 'Peter Christen Asbjørnsen and Jørgen Moe, Tales from the Fjeld, translated by George Webbe Dasent (London: Gibbings, 1874; Project Gutenberg #36385)',
                'A second series of Norwegian folk tales, in Dasent’s English. ' + LORE),
    'l-lang': G(['PG2832', 'PG36794'], 'Andrew Lang, Myth, Ritual and Religion, 2 vols. (London: Longmans, Green, 1887; revised edition 1899; Project Gutenberg #2832 and #36794)',
                'Lang’s argument that myths grew out of the beliefs and rites of early peoples, set against Max Müller’s reading of them as the fading of nature myths. His own theory of an original “high god” is not widely held now. ' + LORE, labels=['Volume 1', 'Volume 2']),
    'l-magy': G('PG42981', 'The Folk-Tales of the Magyars, collected by Kriza, Erdélyi, Pap and others, translated by W. Henry Jones and Lewis L. Kropf (London: Elliot Stock for the Folk-Lore Society, 1889; Project Gutenberg #42981)',
                'Hungarian folk tales with the translators’ notes on their sources. ' + LORE),
    'l-hart': G('PG24614', 'Edwin Sidney Hartland, The Science of Fairy Tales: An Inquiry into Fairy Mythology (London: Walter Scott, 1891; Project Gutenberg #24614)',
                'An early scholarly study of fairy tales as survivals of old custom and belief, by one of the leading British folklorists of his day. ' + LORE),
    'l-gold': G('PG3623', 'James George Frazer, The Golden Bough: A Study in Magic and Religion, abridged edition (London: Macmillan, 1922; Project Gutenberg #3623)',
                'Frazer’s comparison of magic, kingship and the dying god across the world’s customs, in the one-volume edition of 1922. His evolutionary scheme (magic, then religion, then science) is no longer accepted, but the book shaped modern thinking about myth and ritual. ' + LORE),
    # ── Witchcraft, demonology and popular belief
    'w-scot': G('PG60766', 'Reginald Scot, The Discoverie of Witchcraft (London, 1584), in the 1886 edition of Brinsley Nicholson (Project Gutenberg #60766)',
                'The first English book to argue that witch beliefs were delusion and that the accused were innocent. King James VI and I ordered it burned and wrote his own Daemonologie to answer it. Scot’s book also describes the tricks of conjurers. ' + OLD + ' ' + WITCH),
    'w-king': G('PG25929', 'King James VI and I, Daemonologie (Edinburgh, 1597; Project Gutenberg #25929)',
                'The Scottish king’s dialogue on witches, sorcery and spirits, written after the North Berwick trials in which he took part; it argues for severe punishment. ' + OLD + ' ' + WITCH),
    'w-pott': G('PG18253', 'Thomas Potts, The Wonderfull Discoverie of Witches in the Countie of Lancaster (London, 1613; Project Gutenberg #18253)',
                'The clerk of the court’s account of the Pendle witch trials of 1612, in which ten people were hanged, much of it taken from a child’s testimony. ' + OLD + ' ' + WITCH),
    'w-hopk': G('PG14015', 'Matthew Hopkins, The Discovery of Witches (London, 1647; Project Gutenberg #14015)',
                'The pamphlet in which the self-styled “Witchfinder General” answers questions about his methods during the East Anglian witch panic of 1645–47, in which some two hundred people were accused and about a hundred hanged. ' + OLD + ' ' + WITCH),
    'w-math': G('PG28513', 'Cotton Mather, The Wonders of the Invisible World (Boston, 1693), with Increase Mather’s Cases of Conscience (Project Gutenberg #28513)',
                'Cotton Mather’s account of the Salem witch trials of 1692 and his defence of them. Increase Mather’s tract argues that spectral evidence alone should not convict. The court hanged nineteen people. ' + OLD + ' ' + WITCH),
    'w-scow': G('PG14461', 'Sir Walter Scott, Letters on Demonology and Witchcraft, addressed to J. G. Lockhart (London: John Murray, 1830; Project Gutenberg #14461)',
                'The novelist’s history of ghost, fairy and witch belief, from the ancient world to his own day, written as ten letters. ' + WITCH),
    'w-uphm': G('PG17845', 'Charles Wentworth Upham, Salem Witchcraft, with an account of Salem Village, 2 vols. (Boston: Wiggin and Lunt, 1867; Project Gutenberg #17845)',
                'The standard nineteenth-century history of the 1692 trials, taken from the court papers, by a Salem minister and congressman. ' + WITCH),
    'w-note': G('PG31511', 'Wallace Notestein, A History of Witchcraft in England from 1558 to 1718 (Washington: American Historical Association, 1911; Project Gutenberg #31511)',
                'The scholarly history of the English prosecutions and of the laws behind them, which first showed how few were executed in England compared with the continent. ' + WITCH),
    'w-summ': G('PG77145', 'Montague Summers, The History of Witchcraft and Demonology (London: Kegan Paul, 1926; Project Gutenberg #77145)',
                'Summers’s survey of witchcraft belief and trials. Summers was an Anglican clergyman turned Catholic who believed in witches and defended the persecutions, so read it as his own argument, not as neutral history. ' + WITCH),
    'w-wood': G('PG43966', 'J. Maxwell Wood, Witchcraft and Superstitious Record in the South-Western District of Scotland (Dumfries, 1911; Project Gutenberg #43966)',
                'Trial records and folk belief from Galloway and Dumfriesshire. ' + WITCH),
    # (scans from the Internet Archive: the witch-hunters' own handbooks, in the translations of Montague Summers, published in London by John Rodker in 1928 and 1929)
    'w-mall': G(['b3136245x'] * 4, 'Heinrich Kramer and James Sprenger, Malleus Maleficarum (“The Hammer of Witches”, Speyer, 1486), translated with notes by the Rev. Montague Summers (London: John Rodker, 1928)',
                'The inquisitors’ handbook on finding, trying and sentencing witches, the most notorious book of the witch hunts. This copy has the Bull of Pope Innocent VIII (1484) that preceded it and the three parts of the work, but not Summers’s introduction, bibliography and notes. It is full of the contempt for women that drove the persecutions. ' + WITCH,
                slices=[(r'^THE BULL OF INNOCENT VIII\s*$', r'^The translation of this Bull'), (r'^PART I\s*$', r'^THE SECOND PART,'), (r'^THE SECOND PART,', r'^THE THIRD PART'), (r'^THE THIRD PART', None, 1)],
                labels=['The Bull of Innocent VIII', 'Part 1', 'Part 2', 'Part 3'], split=r'^\s*(?:QUESTION|CHAPTER)\s+[IVXL]+\.?\s*\n+[^\n]+', retitle=lambda h: _qc(h), trim_front=False, trim_index=False),
    'w-guaz': G(['compendium-maleficarum'] * 3, 'Francesco Maria Guazzo, Compendium Maleficarum (Milan, 1608), translated by E. A. Ashwin and edited by the Rev. Montague Summers (London: John Rodker, 1929)',
                'A Milanese friar’s summary of what the demonologists and trials had established about witches, with the “remedies” against them, one of the last of the great handbooks. This copy has the three books but not Summers’s introduction and notes. ' + WITCH,
                slices=[(r'^BOOK I\b', r'^THE SECOND BOOK, DEAL'), (r'^THE SECOND BOOK, DEAL', r'^THE THIRD BOOK, TREAT'), (r'^THE THIRD BOOK, TREAT', None)],
                labels=['Book 1', 'Book 2', 'Book 3'], split=r'^\s*(?:BOOK I\b[^\n]*CHAPTER I|CHAPTER\s+[IVXL]+)\.?\s*\n+[^\n]+', retitle=lambda h: _qc(h), trim_front=False),
}


def _qc(h):
    """'CHAPTER III Of the Way whereby a Formal Pact' -> 'Chapter III · Of the Way whereby a Formal Pact…' (the heading line and the first line of the chapter's title)."""
    h = re.sub(r'\s+', ' ', h).strip(); m = re.search(r'(QUESTION|CHAPTER) ([IVXL]+)\.? ?(.*)$', h)
    if not m: return h
    kind, num, rest = m.groups(); rest = rest.strip(' *†')
    return kind.title() + ' ' + num + ((' · ' + rest.rstrip('.') + ('' if rest.endswith('.') else '…')) if rest else '')


# ── structure the generic splitter does not find: the headings of these books, by hand
CAPS = r"^[A-Z][A-Z0-9 ,'’\-\.!?;:“”&]{5,72}$"
_SMALL = {'of', 'the', 'and', 'a', 'an', 'in', 'on', 'to', 'for', 'with', 'at', 'by', 'from', 'or', 'o’', 'o'}


def _tc(h):
    """'XLIII. THE MASTER-SMITH' -> 'XLIII. The Master-Smith' (a leading roman number is kept; small words lower case after the first)."""
    ws = re.sub(r'\s+', ' ', h).strip().rstrip('.').split(' '); out = []; first = True
    for w in ws:
        if first and re.fullmatch(r'[IVXLC]+\.?', w): out.append(w); continue
        out.append('-'.join(p.capitalize() for p in w.split('-')) if (first or w.lower() not in _SMALL) else w.lower()); first = False
    return ' '.join(out)



def _chap(h):
    """'CHAPTER IV\n\nTHE GAELIC GODS' -> 'Chapter IV · The Gaelic Gods'."""
    h = re.sub(r'\s+', ' ', h).strip(); m = re.match(r'CHAPTER ([IVXL]+)\.?\s*(.*)$', h)
    return ('Chapter ' + m.group(1) + (' · ' + _tc(m.group(2)) if m.group(2) else '')) if m else _tc(h)


_BOOKE = {'first': 1, 'second': 2, 'third': 3, 'fourth': 4, 'fift': 5, 'sixt': 6, 'seventh': 7, 'eight': 8, 'ninth': 9, 'tenth': 10, 'eleventh': 11, 'twelfe': 12, 'xiii': 13, 'xiiii': 14, 'xv': 15, 'xvi': 16}


def _booke(h):
    m = re.search(r'The ([a-z]+)\.? [Bb]ooke', h)
    return 'Book %d' % _BOOKE[m.group(1)] if m and m.group(1) in _BOOKE else re.sub(r'[¶_\s]+', ' ', h).strip()


SPECS['l-grim'].update(split=r'^(?:\d{1,3} [A-Z][^\n]{2,80}|Legend \d{1,2} [A-Z][^\n]{2,80})$', retitle=lambda h: re.sub(r'\s+', ' ', h).strip(), trim_front=False,
                       drop=r'(?s)\A.*?(?=^1 The Frog-King, or Iron Henry\s*$)')
SPECS['l-dase'].update(split=CAPS, retitle=_tc, slices=[(r'^INTRODUCTION\s*$', None)], trim_front=False)
SPECS['l-fjel'].update(split=CAPS, retitle=_tc, drop=r"^THE END\.\s*$|^\[Transcriber's note:[^\]]*\]")
SPECS['l-jaco'].update(split=CAPS, retitle=_tc)
SPECS['l-jac2'].update(split=CAPS, retitle=_tc)
SPECS['l-squi'].update(split=r'^[ \t]*CHAPTER [IVXL]+\.?[ \t]*\n+[ \t]*[^\n]+$', retitle=_chap)
SPECS['w-king'].update(split=r'^(?:THE PREFACE\. TO THE READER\.|FIRST BOOKE\.|SECONDE BOOKE\.|THIRDE BOOKE\.|NEWES FROM SCOTLAND\.)\s*$', retitle=_tc,
                       drop=r'(?s)\A.*?(?=^THE PREFACE\. TO THE READER\.\s*$)')
SPECS['w-hopk'].update(drop=r"^Transcriber.s note:[^\n]*(?:\n[^\n]+)*")
SPECS['w-math'].update(split=None, trim_front=False, slices=[(r'^INTRODUCTION\.\s*$', None)], drop=r"(?ms)^THE CONTENTS\.\s*$.*?(?=^THE AUTHOR'S DEFENCE\.)|^Transcriber.s Note, continued\.--[^\n]*(?:\n[^\n]+)*")
SPECS['w-uphm'].update(split=None, slices=[(r'^PART FIRST\.\s*$', None, 1)], trim_front=False)
SPECS['w-scot'].update(idents=['PG60766'] * 2, labels=['Nicholson’s preface and introduction', 'The Discoverie of Witchcraft'],
                       slices=[(r'^\s*PREFACE\.\s*$', r'^\s*\[These Contents in original end the book'), (r'^\s*¶ ?_The first Booke\._', r'^\s*GLOSSARY\.', 1)],
                       split=r'(?i)^\s*¶\s*_The [a-z]+\.? booke\._\s*$', retitle=_booke, trim_front=False, trim_index=False,
                       by='Reginald Scot, The Discoverie of Witchcraft (London, 1584), in Brinsley Nicholson’s reprint of the first edition (London: Elliot Stock, 1886; Project Gutenberg #60766)')
SPECS['l-gold'].update(slices=[(r'^Preface\s*$', None, 1)], trim_front=False)      # the contents list (which carries the file's stray control characters for apostrophes) comes first


# ── Folk tales beyond Europe (the Global Grey ones are in texts_gg.py)
FOLKT = ('A collection of tales made by a missionary, official, scholar or writer of his period, who chose, translated and often retold them in his own style. Read it as a source on what '
         'was told and on what the collector made of it, and read the community’s own published versions beside it.')
OWNT = 'Written in English by a member of the community whose tales these are, for a wide readership: read it as that author’s own retelling.'

SPECS.update({
    't-fred': G('PG36696', 'Mary Frere, Old Deccan Days, or Hindoo Fairy Legends Current in Southern India, collected from oral tradition, with a preface by Sir Bartle Frere (London: John Murray, 1868; Project Gutenberg #36696)',
                'Tales Mary Frere wrote down from her Indian nurse (ayah), with her father’s preface. ' + FOLKT),
    't-sags': G('PG40402', 'Sagas from the Far East; or, Kalmouk and Mongolian Traditionary Tales, with historical preface and explanatory notes (London: Griffith and Farran, 1873; Project Gutenberg #40402)',
                'Tales from Kalmyk and Mongol tradition in a nineteenth-century translation, among them the story of Siddhi-Kür, with the translator’s preface and notes. ' + FOLKT),
    't-giles': G('PG43629', 'Pu Songling, Strange Stories from a Chinese Studio, translated and annotated by Herbert A. Giles, 2 vols. (London: Thos. de la Rue, 1880; Project Gutenberg #43629)',
                 'Giles’s selection of 164 of the stories of ghosts, fox spirits and magic in the Liaozhai zhiyi (about 1680), with his notes. They are literary tales written by a scholar, from what he heard and read, not oral folk tales as such. ' + FOLKT),
    't-ralst': G('PG66870', 'F. Anton von Schiefner, Tibetan Tales Derived from Indian Sources, translated from the German by W. R. S. Ralston (London: Kegan Paul, Trench, Trübner, 1882; Project Gutenberg #66870)',
                 'Tibetan versions of Indian tales, with Ralston’s introduction tracing them to their Indian and wider sources. ' + FOLKT),
    't-day': G('PG38488', 'Lal Behari Day, Folk-Tales of Bengal (London: Macmillan, 1883; Project Gutenberg #38488)',
               'Bengali tales written down in English by a Bengali scholar and Christian minister. ' + OWNT),
    't-sanf': G('PG35060', 'A. Campbell, Santal Folk Tales (Pokhuria: Santal Mission Press, 1891; Project Gutenberg #35060)',
                'Tales of the Santal people of eastern India, written down by a missionary. ' + FOLKT),
    't-jacb': G('PG7128', 'Joseph Jacobs, Indian Fairy Tales (London: David Nutt, 1892; Project Gutenberg #7128)',
                'Tales from the Jatakas, the Kathasaritsagara and other Indian sources, retold by Jacobs with notes on their sources. ' + FOLKT),
    't-steel': G('PG6145', 'Flora Annie Steel, Tales of the Punjab, told by the people, with notes by R. C. Temple (London: Macmillan, 1894; Project Gutenberg #6145)',
                 'Punjabi tales as the wife of a colonial official heard and retold them, with Temple’s notes. ' + FOLKT),
    't-kunos': G('PG64807', 'Ignácz Kúnos, Turkish Fairy Tales and Folk Tales, translated from the Hungarian by R. Nisbet Bain (London: Lawrence and Bullen, 1896; Project Gutenberg #64807)',
                 'Turkish tales collected by a Hungarian linguist and put into English. ' + FOLKT),
    't-lang': G('PG128', 'Andrew Lang (editor), The Arabian Nights Entertainments (London: Longmans, Green, 1898; Project Gutenberg #128)',
                'Lang’s selection of the best-known tales (Aladdin, Sindbad, Ali Baba and others), retold for young readers from Antoine Galland’s French of 1704–17 and later versions, with his introduction. It is not a literal translation of the Arabic, and it leaves out most of the book. ' + FOLKT),
    't-wadd': G('PG75000', 'Folk Tales from Tibet, with illustrations by a Tibetan artist and some verses from Tibetan love songs (London, 1906; Project Gutenberg #75000)',
                'Tibetan tales, with verses from love songs, gathered by a British officer in Tibet. ' + FOLKT),
    't-ozak': G('PG4018', 'Yei Theodora Ozaki, Japanese Fairy Tales (Chicago: Rand McNally, 1908; Project Gutenberg #4018)',
                'Japanese tales retold in English by a writer of Japanese and English parentage. ' + FOLKT),
    't-bomp': G('PG11938', 'Cecil Henry Bompas, Folklore of the Santal Parganas, translated from the Santal (London: David Nutt, 1909; Project Gutenberg #11938)',
                'Santal tales taken down from storytellers by the Norwegian missionary P. O. Bodding and translated by an Indian Civil Service officer. ' + FOLKT),
    't-remus': G('PG2306', 'Joel Chandler Harris, Uncle Remus: His Songs and His Sayings (New York: D. Appleton, 1880; Project Gutenberg #2306)',
                 'Brer Rabbit and other animal tales that Harris, a white Georgia journalist, heard from enslaved storytellers and gave to an invented old narrator in a plantation frame and a written dialect. They come from African and Native American tradition, but the voice, the frame and the sentiment are his. ' + FOLKT),
    't-zanz': G('PG37472', 'George W. Bateman (translator), Zanzibar Tales, Told by Natives of the East Coast of Africa, translated from the original Swahili (Chicago: A. C. McClurg, 1901; Project Gutenberg #37472)',
                'Swahili tales of the East African coast in an American translation. ' + FOLKT),
    't-anan': G('PG72735', 'Martha Warren Beckwith, Jamaica Anansi Stories (New York: American Folk-Lore Society, 1924; Project Gutenberg #72735)',
                'Anansi the spider tales, brought from West Africa and told in Jamaica, taken down by a folklorist from Jamaican storytellers, with tunes and notes on their African and other sources. ' + FOLKT),
    't-lumm': G('PG77804', 'Charles F. Lummis, The Man Who Married the Moon, and Other Pueblo Indian Folk-Stories (New York: The Century Co., 1894; Project Gutenberg #77804)',
                'Tales of the Pueblo peoples of New Mexico as a journalist who lived at Isleta heard and retold them. ' + FOLKT),
    't-zitk': G('PG338', 'Zitkala-Ša, Old Indian Legends, retold (Boston: Ginn and Company, 1901; Project Gutenberg #338)',
                'Dakota stories, among them the trickster Iktomi tales, as a Yankton Dakota writer heard them as a child and retold them in English. ' + OWNT),
    't-eastw': G('PG28099', 'Charles A. Eastman and Elaine Goodale Eastman, Wigwam Evenings: Sioux Folk Tales Retold (Boston: Little, Brown, 1909; Project Gutenberg #28099)',
                 'Dakota tales retold for young readers by Charles Eastman (Ohiyesa), a Santee Dakota physician and writer, and his wife Elaine Goodale Eastman. ' + OWNT),
    't-mcla': G('PG341', 'Marie L. McLaughlin, Myths and Legends of the Sioux (Bismarck: Bismarck Tribune, 1916; Project Gutenberg #341)',
                'Dakota myths and legends set down in English by a Santee Dakota woman. ' + OWNT),
    't-rass': G('PG28932', 'Knud Rasmussen, Eskimo Folk-Tales, edited and translated by W. Worster (London: Gyldendal, 1921; Project Gutenberg #28932)',
                'Inuit tales taken down by the Danish-Greenlandic explorer Knud Rasmussen from Inuit storytellers, in an English translation. ' + FOLKT),
    't-park': G('PG61477', 'Arthur C. Parker, Seneca Myths and Folk Tales (Buffalo: Buffalo Historical Society, 1923; Project Gutenberg #61477)',
                'Tales of the Seneca nation, written down by a Seneca archaeologist and museum director. ' + OWNT),
    't-kala': G('PG56597', 'Kalakaua, The Legends and Myths of Hawaii: The Fables and Folk-Lore of a Strange People, edited by R. M. Daggett (New York: Charles L. Webster, 1888; Project Gutenberg #56597)',
                'Hawaiian legends and tales written down by Kalākaua, the last king of Hawaii, with his editor’s introduction. ' + OWNT),
    't-thru': G('PG18450', 'Thomas G. Thrum (editor), Hawaiian Folk Tales: A Collection of Native Legends (Chicago: A. C. McClurg, 1907; Project Gutenberg #18450)',
                'Tales written down by several different hands and gathered by Thrum, the editor of the Hawaiian Annual. ' + FOLKT),
    't-ditt': G('PG54610', 'W. Dittmer, Te Tohunga: The Ancient Legends and Traditions of the Maoris, orally collected and pictured by W. Dittmer (London: George Routledge, 1907; Project Gutenberg #54610)',
                'Maori legends as an English-speaking collector heard them, with his own drawings. ' + FOLKT),
    't-west': G('PG66547', 'W. D. Westervelt, Legends of Old Honolulu, collected and translated from the Hawaiian (Boston: Geo. H. Ellis, 1915; Project Gutenberg #66547)',
                'Legends of Honolulu and Oahu, taken down in Hawaiian and put into English by a clergyman who lived in Hawaii. ' + FOLKT),
})

# tale titles in capitals, as the Gutenberg editions print them
for _id in ('t-day', 't-sanf', 't-steel', 't-kunos', 't-wadd', 't-ozak', 't-lumm', 't-zitk', 't-mcla', 't-rass', 't-ditt', 't-west'):
    SPECS[_id].update(split=CAPS, retitle=_tc)
SPECS['t-steel'].update(skip=r'^Contents$')
SPECS['t-zitk'].update(skip=r'^Contents$')
SPECS['t-ditt'].update(skip=r'^The End$')
SPECS['t-west'].update(skip=r'^Partial List')
SPECS['l-jac2'].update(skip=r'^Contents$')
SPECS['t-day'].update(skip=r'^Illustrations$')
SPECS['t-sanf'].update(skip=r'^Contents$')
SPECS['t-rass'].update(skip=r'^(?:Contents|Illustrations)$')
SPECS['t-west'].update(skip=r'^Partial List|^(?:Table of Contents|List of Illustrations)$')
