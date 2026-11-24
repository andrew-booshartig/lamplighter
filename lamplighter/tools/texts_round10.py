"""Specs for a tenth batch of open (pre-1931) English texts: the great Bible and Christian dictionaries (Hastings's Dictionary of the Bible, the Encyclopaedia Biblica, the Dictionaries of
Christ and the Gospels, of the Apostolic Church, of Christian Biography, of Christian Antiquities and of Hymnology), the histories of the Church and of its doctrine (Schaff, Harnack), the
rest of Frazer, Hartland and Kuenen, Frazer's Apollodorus, and a shelf of field records of peoples' religion (Crooke, Roscoe, Hose and McDougall, Skeat and Blagden, Seligmann, Rivers,
Frobenius, Thurston, Mooney, Hollis, Bogoras, Swanton). Merged into texts_archive.SPECS (see the end of that file); built with python3 build_texts.py --only=ids. An ident 'PG123' is
Project Gutenberg #123; the rest are Internet Archive items. Sources were found on 16 November 2026 and fetched on the maker's instruction ("keep going and find more texts", "worry about a
complete product", "continue").

The dictionaries and histories are the Library's shelf-only group 'sc' (books about religion, on a Path station's shelf); the field records are group 'tb'. Left out on purpose: Mooney's Ghost-Dance Religion, which the Library already has (a-ghos); volume 2 of the Dictionary of Christian Biography, which has no readable scan; Fewkes's
Hopi Katcinas (the ceremonial pictures of a living people), Dorsey's Cheyenne Sun Dance and other accounts of the ceremonies of peoples who are living today.
"""
import re
from texts_round9 import G as _G9, S, SCH, REF, enc_sections


def G(*a, **k):
    k.setdefault('clean_scan', True)
    return _G9(*a, **k)

FIELD = ('A record made by an outside observer in the colonial or missionary period: it reports what he saw or was told, in his period’s terms and with its prejudices. Read it critically, '
         'and where a tradition’s own people have published their own account, read that as well.')


def T(title, when):
    return (title, 'tb', when, 'fld', None)


def ref(idents, by, note, lib):
    return G(idents, by, note, lib=lib, sectioner=enc_sections, trim_index=False, trim_front=False, trim_back=False, split=None)


SPECS = {}

# ── The Bible and Christian dictionaries, one text per printed volume ──
for _k, (_id, _rng) in enumerate([('dictionaryofbibl01hast', 'A–Feasts'), ('dictionaryofbibl02hast', 'Feign–Kinsman'), ('dictionaryofbibl03hast', 'Kir–Pleiades'), ('dictionaryofbibl04hast', 'Pleroma–Zuzim')], 1):
    SPECS['x-hb%d' % _k] = ref(_id, 'James Hastings (ed.), A Dictionary of the Bible, dealing with its Language, Literature, and Contents, including the Biblical Theology, volume %d: %s (Edinburgh: T. & T. Clark, and New York: Charles Scribner’s Sons, 1898–1902)' % (_k, _rng),
                               'Volume %d (%s) of the standard English Bible dictionary of its day: signed articles on every person, place, book, doctrine and word of the Bible, by British and American scholars. The volume is cut into parts at paragraph ends and each part is named by the first headword in it. ' % (_k, _rng) + REF,
                               S('A Dictionary of the Bible (ed. Hastings), volume %d: %s' % (_k, _rng), '1898–1904 CE'))
SPECS['x-hb5'] = ref('DictionaryOfTheBibleExtraVolume', 'James Hastings (ed.), A Dictionary of the Bible, Extra Volume (Edinburgh: T. & T. Clark, 1904)',
                     'The fifth volume of the dictionary: long articles on the Bible’s religion and its neighbours (the religion of Israel, Babylonian and Egyptian religion, the history of the text and the canon, the early versions and the manuscripts), with the indexes. ' + REF,
                     S('A Dictionary of the Bible (ed. Hastings), Extra Volume', '1904 CE'))
for _k, _rng in enumerate(['A–D', 'E–K', 'L–P', 'Q–Z'], 1):
    SPECS['x-eb%d' % _k] = ref('encyclopaediabib%02dcheyuoft' % _k, 'T. K. Cheyne and J. Sutherland Black (eds.), Encyclopaedia Biblica: A Critical Dictionary of the Literary, Political and Religious History, the Archaeology, Geography and Natural History of the Bible, volume %d: %s (London: Adam and Charles Black, and New York: Macmillan, 1899–1903)' % (_k, _rng),
                               'Volume %d (%s) of the encyclopedia that put the critical study of the Bible before English readers: articles by Cheyne, Driver, Robertson Smith, Wellhausen and other scholars, many of them radical for their day, on the text, sources, history and archaeology of the Bible. The volume is cut into parts at paragraph ends and each part is named by the first headword in it. ' % (_k, _rng) + REF,
                               S('Encyclopaedia Biblica (ed. Cheyne and Black), volume %d: %s' % (_k, _rng), '1899–1903 CE'))
for _k, _id in enumerate(['dictionaryofchri01hastuoft', 'dictionaryofchri02hastuoft'], 1):
    SPECS['x-dg%d' % _k] = ref(_id, 'James Hastings (ed.), A Dictionary of Christ and the Gospels, volume %d (Edinburgh: T. & T. Clark, and New York: Charles Scribner’s Sons, 1906–08)' % _k,
                               'Volume %d of the two-volume dictionary of the life, teaching and times of Jesus, with its articles on the Gospels, their sources, the miracles and parables, the Jewish and Roman background, and the main ideas of the New Testament. The volume is cut into parts at paragraph ends and each part is named by the first headword in it. ' % _k + REF,
                               S('A Dictionary of Christ and the Gospels (ed. Hastings), volume %d' % _k, '1906–08 CE'))
for _k, _id in enumerate(['dictionaryofapos01hast', 'dictionaryofapos02hast'], 1):
    SPECS['x-da%d' % _k] = ref(_id, 'James Hastings (ed.), A Dictionary of the Apostolic Church, volume %d (Edinburgh: T. & T. Clark, and New York: Charles Scribner’s Sons, 1915–18)' % _k,
                               'Volume %d of the two-volume dictionary of the Church of the first century: Paul and the other apostles, the churches and their officers, worship and the sacraments, the Epistles and Acts, and the ideas of the early Christians. The volume is cut into parts at paragraph ends and each part is named by the first headword in it. ' % _k + REF,
                               S('A Dictionary of the Apostolic Church (ed. Hastings), volume %d' % _k, '1915–18 CE'))
for _k, _id in [(1, 'dictionaryofchwace01smituoft'), (3, 'dictionaryofchri0003will'), (4, 'dictionaryofchri0004will')]:      # volume 2 (Eutychius to Hermocrates) has no readable scan among the Archive’s items
    SPECS['x-db%d' % _k] = ref(_id, 'William Smith and Henry Wace (eds.), A Dictionary of Christian Biography, Literature, Sects and Doctrines, volume %d (London: John Murray, 1877–87)' % _k,
                               'Volume %d of the four-volume dictionary of the first eight centuries of the Church: the lives of the Fathers, popes, bishops, heretics and martyrs, the writings that survive, and the sects and doctrines, by the English patristic scholars of the 1870s and 1880s. The volume is cut into parts at paragraph ends and each part is named by the first headword in it. ' % _k + REF,
                               S('A Dictionary of Christian Biography (ed. Smith and Wace), volume %d' % _k, '1877–87 CE'))
for _k, _id in enumerate(['dictionaryofchri01smituoft', 'dictionaryofchri02smituoft'], 1):
    SPECS['x-dc%d' % _k] = ref(_id, 'William Smith and Samuel Cheetham (eds.), A Dictionary of Christian Antiquities: being a continuation of the Dictionary of the Bible, volume %d (London: John Murray, 1875–80)' % _k,
                               'Volume %d of the two-volume dictionary of the institutions of the early Church to the time of Charlemagne: ritual and ceremony, church buildings, vestments and symbols, the calendar, the orders of the ministry and church law. The volume is cut into parts at paragraph ends and each part is named by the first headword in it. ' % _k + REF,
                               S('A Dictionary of Christian Antiquities (ed. Smith and Cheetham), volume %d' % _k, '1875–80 CE'))
for _k, _id in enumerate(['dictionaryofhymn01lond', 'dictionaryofhymn02lond'], 1):
    SPECS['x-dh%d' % _k] = ref(_id, 'John Julian (ed.), A Dictionary of Hymnology, setting forth the Origin and History of Christian Hymns of all Ages and Nations, volume %d (London: John Murray, 1907 edition)' % _k,
                               'Volume %d of the great reference work on the hymns of the Church in every language: where each hymn came from, who wrote it, how it changed, and the writers and the hymn-books of the churches, in the 1907 edition. The volume is cut into parts at paragraph ends and each part is named by the first headword in it. ' % _k + REF,
                               S('A Dictionary of Hymnology (ed. John Julian), volume %d' % _k, '1892; 1907 ed.'))

SPECS['x-bnh'] = ref('dictionaryofreli00benhuoft', 'William Benham (ed.), The Dictionary of Religion: An Encyclopaedia of Christian and other Religious Doctrines, Denominations, Sects, Heresies, Ecclesiastical Terms, History, Biography, etc. (London: Cassell and Company, 1887)',
                     'A single-volume dictionary of religions and churches by an Anglican editor: the Christian denominations and their doctrines, the sects and heresies, the terms of the liturgy and church law, and short accounts of the other religions of the world. The volume is cut into parts at paragraph ends and each part is named by the first headword in it. ' + REF,
                     S('The Dictionary of Religion (ed. William Benham, 1887)', '1887 CE'))

# ── The histories of the Church and of its doctrine ──
_SCH = [('historyofchrist01scha', 'volume I: Apostolic Christianity, A.D. 1–100', '1882'), ('historyofchris02scha', 'volume II: Ante-Nicene Christianity, A.D. 100–325', '1884'), ('historyofchris03scha', 'volume III: Nicene and Post-Nicene Christianity, A.D. 311–600', '1884'),
        ('historyofchrist04scha', 'volume IV: Mediaeval Christianity, A.D. 590–1073', '1887'), ('historyofchristi51scha', 'volume V, part I: The Middle Ages, from Gregory VII to Boniface VIII, 1049–1294 (by David S. Schaff)', '1907'), ('historyofchristi52scha', 'volume V, part II: The Middle Ages, from Boniface VIII to the Protestant Reformation, 1294–1517 (by David S. Schaff)', '1907'),
        ('historyofchristi06scha', 'volume VI: Modern Christianity, the German Reformation', '1888'), ('historyofchris07scha', 'volume VII: Modern Christianity, the Swiss Reformation', '1892')]
for _k, (_id, _what, _yr) in enumerate(_SCH, 1):
    SPECS['x-sch%d' % _k] = G(_id, 'Philip Schaff, History of the Christian Church, %s (New York: Charles Scribner’s Sons, %s; this printing from a later revision)' % (_what, _yr),
                              'The standard English history of the Church by the Swiss-American Church historian, a narrative of its organisation, doctrine, worship, discipline and life, with long extracts from the sources and a full bibliography. This is %s. ' % _what + SCH,
                              lib=S('History of the Christian Church (Philip Schaff), %s' % _what.replace(' (by David S. Schaff)', ''), _yr + ' CE'), split=None)

SPECS['x-hdg'] = G(['cu31924092343882', 'historyofdogma02harn', 'historyofdogma03harn', 'historyofdogma04harn', 'historyofdogma05harn', 'historyofdogma06harn', 'historyofdogma07harn'], 'Adolf Harnack, History of Dogma, translated from the third German edition by Neil Buchanan and others, seven volumes (Boston: Little, Brown, and London: Williams & Norgate, 1894–99)',
                   'The great history of the development of Christian doctrine: the Greek Fathers and the making of the Trinity and the Person of Christ (volumes I to IV), the Latin Church and Augustine (V), the Middle Ages (VI), the Reformation and the end of dogma (VII), by the Berlin scholar who held that dogma was the work of the Greek spirit on the soil of the Gospel. ' + SCH,
                   lib=S('History of Dogma (Adolf Harnack, trans. Buchanan, 1894–99), seven volumes', '1886–89 CE (trans. 1894–99)'), split=None)

# ── Frazer, Hartland, Kuenen, Apollodorus ──
SPECS['x-fte'] = G(['totemismexogamyt01fraz', 'totemismexogamyt02fraz', 'totemismexogamy03frazuoft', 'totemismexogamyt04fraz'], 'Sir James George Frazer, Totemism and Exogamy: A Treatise on Certain Early Forms of Superstition and Society, four volumes (London: Macmillan, 1910)',
                   'Frazer’s survey of totemism among the peoples of Australia, North America, Africa, India and elsewhere: what a totem is, how it is inherited, the rules of marriage that go with it, and a great store of travellers’ reports, set out clan by clan. ' + SCH,
                   lib=S('Totemism and Exogamy (J. G. Frazer, 1910), four volumes', '1910 CE'), split=None)
SPECS['x-flt'] = G(['folkloreintheol01frazuoft', 'folkloreintheold02frazuoft', 'folkloreintheol03frazuoft'], 'Sir James George Frazer, Folk-Lore in the Old Testament: Studies in Comparative Religion, Legend and Law, three volumes (London: Macmillan, 1918)',
                   'Frazer sets the stories of Genesis (the Creation, the Fall, the Flood, Babel, the Patriarchs) and customs of Israel (the first-born, the Nazirite, the levirate, the scapegoat) beside the stories and customs of other peoples, to ask what lies under them. ' + SCH,
                   lib=S('Folk-Lore in the Old Testament (J. G. Frazer, 1918), three volumes', '1918 CE'), split=None)
SPECS['x-fwn'] = G('in.ernet.dli.2015.173582', 'Sir James George Frazer, The Worship of Nature, volume I (London: Macmillan, 1926; the Gifford Lectures delivered at Edinburgh in 1923–25)',
                   'Frazer’s Gifford Lectures on the worship of the sky, the earth and the sun among the peoples of the world: sky-gods, rain-making, the worship of the earth, the sun and the moon. Only this first volume was published. ' + SCH,
                   lib=S('The Worship of Nature, volume I (J. G. Frazer, 1926)', '1926 CE'), split=None)
SPECS['x-fao'] = G('adonisattisosiri00frazuoft', 'Sir James George Frazer, Adonis, Attis, Osiris: Studies in the History of Oriental Religion (London: Macmillan, second edition, 1907)',
                   'Frazer’s book on the dying and rising gods of western Asia and Egypt: the cults of Adonis in Syria, Attis in Phrygia and Osiris in Egypt as rites of the corn and the year, and the tales of Isis, Cybele and Astarte. It became part IV of the third edition of The Golden Bough. ' + SCH,
                   lib=S('Adonis, Attis, Osiris (J. G. Frazer, 1906; 2nd ed. 1907)', '1906 CE'), split=None)
SPECS['x-kri'] = G(['religionofisrael01kuenuoft', 'religionofisrael02kuenuoft', 'religionofisrael03kuenuoft'], 'Abraham Kuenen, The Religion of Israel to the Fall of the Jewish State, translated by Alfred Heath May, three volumes (London: Williams and Norgate, 1874–75)',
                   'The Leiden scholar’s history of Israelite religion: the early religion of Israel and its neighbours, the prophets and the law, the Exile and the Return, to the fall of the Jewish state; one of the books that gave the critical study of the Old Testament its form. ' + SCH,
                   lib=S('The Religion of Israel to the Fall of the Jewish State (Abraham Kuenen, 1869–70; trans. 1874–75), three volumes', '1869–70 CE'), split=None)
SPECS['x-hlp'] = G(['legendofperseuss01hart', 'legendofperseuss02hart', 'legendofperseuss03hart'], 'Edwin Sidney Hartland, The Legend of Perseus: A Study of Tradition in Story, Custom and Belief, three volumes (London: David Nutt, 1894–96)',
                   'Hartland follows the story of the hero’s miraculous birth, the exposure of the child, the quest and the slaying of the monster through the folk-tales and customs of the world, in a study that helped to found the comparative method in folklore. ' + SCH,
                   lib=S('The Legend of Perseus (E. S. Hartland, 1894–96), three volumes', '1894–96 CE'), split=None)
SPECS['x-hpp'] = G(['primitivepaterni01hartuoft', 'primitivepaterni02hartuoft'], 'Edwin Sidney Hartland, Primitive Paternity: The Myth of Supernatural Birth in Relation to the History of the Family, two volumes (London: David Nutt, 1909–10)',
                   'A study of the belief in a child born without a human father, in the myths and customs of the world and in the Christian story of the birth of Jesus, and of what the belief shows about early ideas of kinship and conception. ' + SCH,
                   lib=S('Primitive Paternity (E. S. Hartland, 1909–10), two volumes', '1909–10 CE'), split=None)
SPECS['x-apo'] = G(['apollodoruslibra01apol', 'apollodoruslibra02apol'], 'Apollodorus, The Library, translated by Sir James George Frazer, two volumes (London: William Heinemann, and New York: G. P. Putnam’s Sons; The Loeb Classical Library, 1921)',
                   'The handbook of Greek myths (c. 1st–2nd c. CE), the most complete ancient survey of the gods, the heroes and the great families: the birth of the gods, Prometheus and Pandora, Heracles, Theseus, the Argonauts and the Trojan cycle. This is Frazer’s English translation of 1921, with his notes.',
                   lib=('The Library of Apollodorus (trans. Frazer, 1921), two volumes', 'gr', 'c. 1st–2nd c. CE', 'grk', 'Homer and Hesiod'), split=None)

# ── Field records of peoples' religion ──
SPECS['a-crk'] = G('introductiontopo00croorich', 'William Crooke, An Introduction to the Popular Religion and Folklore of Northern India (Allahabad: Government Press, 1894)',
                   'The Indian Civil Service ethnographer’s account of the religion of the villages of the North-West Provinces: the village gods and sacred places, the worship of the powers of nature and of disease, ghosts and demons, the spirit of the dead, magic and omens, from his own survey of the countryside. ' + FIELD,
                   lib=T('An Introduction to the Popular Religion and Folklore of Northern India (William Crooke, 1894)', 'recorded 1880s–90s CE'), split='auto')
SPECS['a-bag'] = G('bagandaaccountof00roscuoft', 'John Roscoe, The Baganda: An Account of their Native Customs and Beliefs (London: Macmillan, 1911)',
                   'A missionary’s account of the kingdom of Buganda before the changes of the 20th century: the king and the court, the gods and priests, the beliefs about the dead and the spirits, magic, birth, marriage and death. ' + FIELD,
                   lib=T('The Baganda: An Account of their Native Customs and Beliefs (John Roscoe, 1911)', 'recorded 1890s–1900s CE'), split='auto')
SPECS['a-nbn'] = G('northernbantuacc00roscuoft', 'John Roscoe, The Northern Bantu: An Account of some Central African Tribes of the Uganda Protectorate (Cambridge: University Press, 1915)',
                   'A second volume of the same missionary’s field work, on the Banyoro, Banyankole, Basoga, Bakene and other peoples of Uganda: kings, ghosts, the worship of the gods and the dead, magic and the customs of birth and death. ' + FIELD,
                   lib=T('The Northern Bantu (John Roscoe, 1915)', 'recorded 1890s–1910s CE'), split='auto')
SPECS['a-hmd'] = G(['pagantribesofbor01hose', 'pagantribesofbor02hoseuoft'], 'Charles Hose and William McDougall, The Pagan Tribes of Borneo: A Description of their Physical, Moral and Intellectual Condition, with some Discussion of their Ethnic Relations, two volumes (London: Macmillan, 1912)',
                   'A colonial official’s and an Oxford psychologist’s survey of the peoples of Sarawak: social order, headhunting, the spirits and omens, the priests and the festivals, the beliefs about the soul and the dead, and the tribes’ myths. ' + FIELD,
                   lib=T('The Pagan Tribes of Borneo (Hose and McDougall, 1912), two volumes', 'recorded 1890s–1900s CE'), split=None)
SPECS['a-pmp'] = G(['paganracesmalay01blaggoog', 'paganracesofmala02skea'], 'Walter William Skeat and Charles Otto Blagden, Pagan Races of the Malay Peninsula, two volumes (London: Macmillan, 1906)',
                   'A study of the Semang, Sakai and Jakun peoples of the Malay Peninsula from the authors’ own expeditions: their lands and customs, magic, birth and death, religion, myths and folk-tales, with the vocabularies. ' + FIELD,
                   lib=T('Pagan Races of the Malay Peninsula (Skeat and Blagden, 1906), two volumes', 'recorded 1890s–1900s CE'), split=None)
SPECS['a-smb'] = G('melanesiansofbri00seli', 'C. G. Seligman, The Melanesians of British New Guinea (Cambridge: University Press, 1910)',
                   'The report of the Cambridge ethnologist, a member of the 1898 Torres Straits expedition, on the Motu, Koita, Massim and other peoples: social organisation, magic, sorcery, the spirits of the dead, mortuary rites and religion. ' + FIELD,
                   lib=T('The Melanesians of British New Guinea (C. G. Seligman, 1910)', 'recorded 1898–1904 CE'), split='auto')
SPECS['a-tod'] = G('todasrivers00rive', 'W. H. R. Rivers, The Todas (London: Macmillan, 1906)',
                   'The monograph on the buffalo-keeping Todas of the Nilgiri hills: their dairies and the sacred dairy-man, their ceremonies, funerals, the beliefs about the dead and the land beyond, and the clans and the marriage rules. ' + FIELD,
                   lib=T('The Todas (W. H. R. Rivers, 1906)', 'recorded 1901–02 CE'), split='auto')
SPECS['a-vaf'] = G(['voiceofafricabei01frobuoft', 'voiceofafricabei02frobuoft'], 'Leo Frobenius, The Voice of Africa: Being an Account of the Travels of the German Inner-African Exploration Expedition in the Years 1910–1912, translated by Rudolf Blind, two volumes (London: Hutchinson, 1913)',
                   'The German ethnologist’s account of an expedition across West and Central Africa: the cities and kingdoms (Ife among them), the cults, masks, myths and legends, the secret societies and the stories he was told, with his own theories of African civilisation. ' + FIELD,
                   lib=T('The Voice of Africa (Leo Frobenius, 1913), two volumes', 'recorded 1910–12 CE'), split=None)
SPECS['a-osi'] = G('omenssuperstitio00thur', 'Edgar Thurston, Omens and Superstitions of Southern India (London: T. Fisher Unwin, 1912)',
                   'A Madras Museum superintendent’s collection of the omens, charms, evil eye and village superstitions of southern India: the good and bad signs, the worship of trees, serpents and stones, caste rites and village gods. ' + FIELD,
                   lib=T('Omens and Superstitions of Southern India (Edgar Thurston, 1912)', 'recorded 1900s CE'), split='auto')
SPECS['a-mas'] = G('masaitheirlangua00holluoft', 'A. C. Hollis, The Masai: Their Language and Folklore (Oxford: Clarendon Press, 1905)',
                   'A colonial official’s collection of the Masai’s own stories, with an account of their customs: the beliefs about God, the spirits and the dead, the age-sets and the circumcision rites (described, not the secrets), proverbs and songs. ' + FIELD,
                   lib=T('The Masai: Their Language and Folklore (A. C. Hollis, 1905)', 'recorded 1890s–1900s CE'), split='auto')
SPECS['a-hnd'] = G('nanditheirlangua00holl', 'A. C. Hollis, The Nandi: Their Language and Folk-Lore (Oxford: Clarendon Press, 1909)',
                   'A companion volume on the Nandi of Kenya: their customs, their beliefs in Asis (the sun-god) and the spirits of the dead, the orders of age and the festivals, with their stories and songs. ' + FIELD,
                   lib=T('The Nandi: Their Language and Folk-Lore (A. C. Hollis, 1909)', 'recorded 1900s CE'), split='auto')
SPECS['a-ykt'] = G('talesyukaghirla00bogogoog', 'Waldemar Bogoras, Tales of Yukaghir, Lamut, and Russianized Natives of Eastern Siberia (New York: American Museum of Natural History, 1918; Anthropological Papers, vol. 20, part 1)',
                   'Folk-tales and myths collected in the Kolyma country: the tricksters and the spirits, the people of the other world and the shaman’s adventures, as the narrators told them. ' + FIELD,
                   lib=T('Tales of Yukaghir, Lamut, and Russianized Natives of Eastern Siberia (Waldemar Bogoras, 1918)', 'recorded 1890s–1900s CE'), split='auto')
SPECS['a-hdt'] = G('haidatextsmythss00swan', 'John R. Swanton, Haida Texts and Myths: Skidegate Dialect (Washington: Government Printing Office, 1905; Bureau of American Ethnology Bulletin 29)',
                   'Myths and tales dictated to Swanton at Skidegate in the Queen Charlotte Islands in 1900–01: the Raven cycle, the origin of the world and of the clans, stories of the supernatural beings and the ancestors, given in English translation. ' + FIELD,
                   lib=T('Haida Texts and Myths: Skidegate Dialect (John R. Swanton, 1905)', 'recorded 1900–01 CE'), split='auto')
SPECS['a-tlm'] = G('tlingitmythstexts00swanrich', 'John R. Swanton, Tlingit Myths and Texts (Washington: Government Printing Office, 1909; Bureau of American Ethnology Bulletin 39)',
                   'Myths and tales recorded among the Tlingit of Alaska in 1904: the Raven and Yetl stories, tales of the clans and the supernatural, and the stories told about the beginning of the world and the origin of things. ' + FIELD,
                   lib=T('Tlingit Myths and Texts (John R. Swanton, 1909)', 'recorded 1904 CE'), split='auto')

# books whose chapter headings the generic splitter cannot tell from contents lines and running heads are cut into parts of about 26,000 letters
for _id in ('a-smb', 'a-osi', 'a-ykt'):
    SPECS[_id]['split'] = None
