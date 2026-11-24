"""Specs for a nineteenth batch of open (pre-1931) English texts (17 November 2026), continuing the maker's "get as close as we can to covering all the religions": the movements
the assessment still found without an example. The Jews of Russia and Poland (Dubnow: Hasidism and its Chabad and Breslov courts, the Sabbatean and Frankist movements), the Millerites
(Miller and Bliss), the Holiness, Restoration and Universalist movements (Palmer, Campbell, Ballou), the Old Catholic Church of Utrecht (Neale), the Syrian Church of Malabar (Rae), the
Hidden Christians of Japan and Christianity in Japan (Cary), the Philippine churches (Laubach), St Francis (Sabatier), prehistoric Japan (Munro) and the megaliths (Fergusson), the Penitentes
and Pueblos of New Mexico (Lummis), the Rosicrucians and the Golden Dawn (Waite), Sufism in the West (Inayat Khan), the Arcane School (Bailey), Mazdaznan (Hanish), the Ahmadiyya
(the 1910 translation of The Teachings of Islam and Kamal-ud-Din), the Mohists (Motse), the Huichol (Lumholtz), the Sun Dance (Spier), the Taoist Ch'ang Ch'un (Bretschneider) and the
Maori wars of Te Kooti and Te Whiti (Cowan, volume II). Merged into texts_archive.SPECS; built with python3 build_texts.py --only=ids.

Left out: Crowley's Book of the Law and Equinox (the scans found are modern typeset reprints with later commentary), the one scan of Roerich's Agni Yoga and of Alice Bailey's later books
(not found), Best's Tuhoe and Maori Religion and Mythology (no scan found), the Vailala Madness report (no scan found), and the Roman Catholic volume of Cary (lending-only).
"""
from texts_round9 import S, SCH, REF
from texts_round10 import G, T, FIELD
from texts_round8 import MOV

SPECS = {}
NEW = 'Bahá’í, Theosophy'
fix = lambda i, **kw: SPECS[i].update(kw)


def sch(i, idents, by, note, title, when, **kw):
    if kw.get('split', 'auto') == 'auto': kw.setdefault('min_chars', 250)
    SPECS[i] = G(idents, by, note + ' ' + SCH, lib=S(title, when), **{'split': 'auto', **kw})


def fld(i, idents, by, note, title, when, **kw):
    if kw.get('split', 'auto') == 'auto': kw.setdefault('min_chars', 250)
    SPECS[i] = G(idents, by, note + ' ' + FIELD, lib=T(title, when), **{'split': 'auto', **kw})


def mov(i, idents, by, note, title, when, station=NEW, **kw):
    if kw.get('split', 'auto') == 'auto': kw.setdefault('min_chars', 250)
    SPECS[i] = G(idents, by, note + ' ' + MOV, lib=(title, 'mo', when, 'mod', station), **{'split': 'auto', **kw})


# ── The Jews of eastern Europe; Christian movements ──
sch('x-dbn', ['historyofjewsinr01dubnuoft', 'histjewsrusspola02dubnuoft', 'historyofjewsinr03dubn_0'], 'Simon Dubnow, History of the Jews in Russia and Poland from the Earliest Times until the Present Day, translated by I. Friedlaender, three volumes (Philadelphia: Jewish Publication Society of America, 1916–20)',
    'The standard history of the Jews of eastern Europe, by its historian: the Khazars and the first settlements, the kahal and the Council of Four Lands, the Sabbatean movement and the Frankists in Poland, the rise of Hasidism under the Baal Shem Tov and its courts (the Chabad of Rabbi Shneur Zalman and the Bratslav of Rabbi Nachman), the Hasidic and Rabbinic opposition, the Enlightenment (Haskalah), the pogroms and Zionism and the Bund (volumes I–III). Volume III carries the bibliography and index.',
    'History of the Jews in Russia and Poland (Simon Dubnow, 1916–20), three volumes', '1916–20 CE')
mov('x-wmi', 'evidencefromscri00millrich', 'William Miller, Evidence from Scripture and History of the Second Coming of Christ, about the Year 1843: Exhibited in a Course of Lectures (Boston: B. B. Mussey, 1840)',
    'The lectures that began the Millerite movement (later Adventism): Miller’s reading of Daniel and Revelation, the prophetic days and years, and his reckoning that Christ would return about 1843. Miller’s date failed in 1844; the movement divided and its parts became the Seventh-day Adventists and other Adventist churches.',
    'Evidence from Scripture and History of the Second Coming of Christ (William Miller, 1840)', '1831–40 CE')
sch('x-bls', 'memoirsofwilliam00blis', 'Sylvester Bliss, Memoirs of William Miller, Generally Known as a Lecturer on the Prophecies, and the Second Coming of Christ (Boston: Joshua V. Himes, 1853)',
    'The Millerite editor’s life of the movement’s founder: Miller’s conversion from deism, his study of the prophecies, the lectures and the Advent papers, the date of the end of the world and its passing (the Great Disappointment of 22 October 1844), and the last years of Miller’s life. Written by a participant for the movement’s members.',
    'Memoirs of William Miller (Sylvester Bliss, 1853)', '1782–1849 CE (pub. 1853)')
mov('x-phh', 'wayofholinesswit01palm', 'Phoebe Palmer, The Way of Holiness, with Notes by the Way: Being a Narrative of Religious Experience Resulting from a Determination to Be a Bible Christian (New York: Lane and Tippett, 1845)',
    'The book of the New York Methodist who led the Holiness movement: the “shorter way” to entire sanctification by consecrating oneself and trusting God’s promise, her own experience, and the Tuesday Meeting for the Promotion of Holiness. The Holiness movement spread from American Methodism to the Wesleyan, Nazarene, Salvation Army and Pentecostal churches.',
    'The Way of Holiness (Phoebe Palmer, 1845)', '1832–45 CE')
mov('x-cmw', 'christiansystem00camp', 'Alexander Campbell, The Christian System, in Reference to the Union of Christians, and a Restoration of Primitive Christianity, as Plead in the Current Reformation (Cincinnati: Bosworth, Chase and Hall, 1871 edition)',
    'The chief book of the Restoration (Stone–Campbell) movement, which gave rise to the Churches of Christ, the Christian Church (Disciples of Christ) and the independent Christian Churches: the unity of Christians on the New Testament alone, the sufficiency of scripture, believers’ baptism by immersion and the weekly Lord’s Supper, with Campbell’s plea for the restoration of the ancient order.',
    'The Christian System (Alexander Campbell, 1835; 1871 edition)', '1835 CE (ed. 1871)')
mov('x-blu', 'treatiseonatonem00ball_1', 'Hosea Ballou, A Treatise on Atonement, with an introduction by A. A. Miner (Boston: Universalist Publishing House, 1882, fourth edition; first published 1805)',
    'The founding book of American Universalism (which joined the Unitarians in 1961): the finite nature of sin and the universal reconciliation of all souls to God, with Ballou’s argument against the satisfaction theories of the atonement.',
    'A Treatise on Atonement (Hosea Ballou, 1805; 1882 edition)', '1805 CE (ed. 1882)')
sch('x-nel', 'ahistorysocalle00nealgoog', 'John Mason Neale, A History of the So-Called Jansenist Church of Holland; with a Sketch of Its Earlier Annals, and Some Account of the Brothers of the Common Life (Oxford and London: J. H. Parker, 1858)',
    'The Anglican scholar’s history of the Church of Utrecht, the Catholic Church in the Netherlands that has kept its own bishops since the schism of 1723 (it is the see of the Old Catholic Churches of the Union of Utrecht): its early annals and the Brothers of the Common Life, the Jansenist quarrel with Rome, the election of the archbishops of Utrecht and the Holland Church’s life and worship. By a High Anglican who was sympathetic to it.',
    'A History of the So-Called Jansenist Church of Holland (John Mason Neale, 1858)', '1723–1858 CE')
sch('x-rae', 'syrianchurchinin00raegrich', 'George Milne Rae, The Syrian Church in India (Edinburgh and London: William Blackwood and Sons, 1892)',
    'A Scottish missionary-scholar’s history of the Syrian Christians of Malabar, the Thomas Christians: the tradition of St Thomas, the Persian and Syrian bishops, the Portuguese and the Synod of Diamper, the Coonan Cross oath of 1653, the Jacobite connection, and the reform movement led by Abraham Malpan of Maramon in the 1830s that led to the Reformed Syrian (Mar Thoma) Church.',
    'The Syrian Church in India (George Milne Rae, 1892)', '1892 CE')
sch('x-cry', 'ahistorychristi00carygoog', 'Otis Cary, A History of Christianity in Japan: Protestant Missions (New York: Fleming H. Revell, 1909; the second of two volumes)',
    'An American missionary’s history of the Protestant missions in Japan from 1859 to 1908: the opening of the country, the notice-boards against “the evil sect” and the persecution of the Urakami Christians, the first churches and the Union Church of Christ in Japan, the Imperial Rescript on Education, and the Japanese Christians. Volume I (Roman Catholic and Orthodox missions, with the hidden Christians) is not among the open scans.',
    'A History of Christianity in Japan: Protestant Missions (Otis Cary, 1909)', '1859–1908 CE')
sch('x-lbc', 'peopleofphilippi0000laub', 'Frank Charles Laubach, The People of the Philippines: Their Religious Progress and Preparation for Spiritual Leadership in the Far East (New York: George H. Doran, 1925)',
    'An American missionary’s survey of the religions of the Philippines: the animist beliefs of the hill peoples and the Moros, Spanish Catholicism and the friars’ rule, the revolution of 1896 and the Philippine Independent Church (the Aglipayan church founded in 1902), Protestant missions, and the churches that followed.',
    'The People of the Philippines (Frank C. Laubach, 1925)', '1925 CE')
sch('x-sbt', 'stfrancisassisi00sabauoft', 'Paul Sabatier, Life of St. Francis of Assisi, translated by Louise Seymour Houghton (London: Hodder and Stoughton, 1919; first published 1894)',
    'The French Protestant pastor’s critical life of Francis, the founder of the Franciscan Order: his youth in Assisi, the conversion and the call of poverty, the Rule of 1209 and 1223, the Portiuncula and the Poor Clares, the stigmata, and the struggle after his death between the Spirituals and the Conventuals. A classic of the critical study of the sources.',
    'Life of St. Francis of Assisi (Paul Sabatier, 1894; 1919 edition)', '1181–1226 CE (pub. 1894)')

# ── The deep past; the Americas ──
sch('x-mjp', 'prehistoricjapan00munr', 'Neil Gordon Munro, Prehistoric Japan (Yokohama: the author, 1908)',
    'A Scottish physician’s excavations and survey of prehistoric Japan: the shell-mounds (kaizuka) and the Jōmon (cord-marked) pottery, the clay figurines (dogu), the stone circles and standing stones, the burial customs, the pit-dwellings and the Yayoi and dolmen periods, with his conjectures about the early peoples of the islands. Written before the dating of the Jōmon by radiocarbon; its dates are guesses.',
    'Prehistoric Japan (Neil Gordon Munro, 1908)', '1908 CE')
sch('x-frg', 'rudestonemonumen00ferg', 'James Fergusson, Rude Stone Monuments in All Countries: Their Age and Uses (London: John Murray, 1872)',
    'The Victorian architectural historian’s survey of the great stones of Europe, Asia, Africa and America: Stonehenge and Avebury, Carnac, the dolmens, cromlechs and menhirs of Britain, France, Scandinavia, India and the Near East, with his theory (since disproved by radiocarbon dating) that they are post-Roman monuments of the dead. The facts and the drawings remain useful; the theory is not accepted.',
    'Rude Stone Monuments in All Countries (James Fergusson, 1872)', '1872 CE')
fld('a-lms', 'landofpocotiempo00lummrich', 'Charles F. Lummis, The Land of Poco Tiempo (New York: Charles Scribner’s Sons, 1893)',
    'A journalist’s sketches of New Mexico in the 1880s and 1890s: the Pueblo towns (Acoma, Zuni, Laguna) and their dances and ceremonies, the kivas, the Hispano villages and their Holy Week, the penitential brotherhood of the Penitentes (Hermanos Penitentes) and their flagellant rites, the folk-songs and the festival of the saints. A tourist-era account by a sympathetic but outside observer.',
    'The Land of Poco Tiempo (Charles F. Lummis, 1893)', 'recorded 1880s–90s CE')

# ── Esoteric currents, Sufism in the West and the Ahmadiyya ──
sch('x-rsx', 'RosyCross', 'Arthur Edward Waite, The Brotherhood of the Rosy Cross: Being Records of the House of the Holy Spirit in Its Inward and Outward History (London: William Rider and Son, 1924)',
    'The Golden Dawn’s best-known scholar on the Rosicrucians: the Fama Fraternitatis and the Confessio of 1614–15, Johann Valentin Andreae, Robert Fludd and Michael Maier, the Rosicrucian alchemists and the German Gold- und Rosenkreuz of the eighteenth century, the Masonic degrees, and the modern societies, with Waite’s own view of the inward Rosicrucian mystery. Waite was a member of the Hermetic Order of the Golden Dawn and writes of its Rosicrucian degrees.',
    'The Brotherhood of the Rosy Cross (A. E. Waite, 1924)', '1614–1924 CE (pub. 1924)')
mov('x-ink', 'Pir-o-murshidInayatKhan.ASufiMessageOfSpiritualLiberty', 'Inayat Khan, A Sufi Message of Spiritual Liberty (London: Theosophical Publishing Society, 1914)',
    'The first book in English by the founder of the Sufi Order in the West (later the Sufi Movement and the Universal Sufism of the Inayati order): a short introduction to Sufism as a “religious philosophy of love, harmony and beauty”, the Sufi’s search for the oneness of all names and forms, the Sufi orders and the path, with a note on the author’s life.',
    'A Sufi Message of Spiritual Liberty (Inayat Khan, 1914)', '1914 CE', station='Rumi', split=None)
mov('x-ahq', 'in.ernet.dli.2015.33658', 'Mirza Ghulam Ahmad of Qadian, The Teachings of Islam: A Solution of Five Fundamental Religious Problems from the Muslim Point of View (Qadian: the Review of Religions, 1910; the scan is the 1987 Cosmo Publications reprint of the 1910 English text)',
    'The founder of the Ahmadiyya movement’s paper for the Conference of Great Religions held at Lahore in December 1896, in the English translation that first appeared in instalments in the Review of Religions in 1902–03 and as a book in 1910: the physical, moral and spiritual states of man, the state of man after death, the object of human life and the means of attaining it, the working of the law in this life and the next, and the sources of divine knowledge, drawn from the Qur’an. The Ahmadiyya hold Mirza Ghulam Ahmad to be the Promised Messiah and Mahdi; most Muslims do not. (A modern translation, by Sir Muhammad Zafrulla Khan, is in copyright and is not here.)',
    'The Teachings of Islam (Mirza Ghulam Ahmad, 1896; English 1910)', '1896 CE (trans. 1910)', split=None)
mov('x-kam', 'in.ernet.dli.2015.217676', 'Khwaja Kamal-ud-Din, The Ideal Prophet, incorporating a portion of “Glimpses from the Life of the Prophet” (Woking: the Islamic Review Office, the Basheer Muslim Library, 1925)',
    'A life of the Prophet Muhammad by the Imam of the Woking mosque, a preacher of the Lahore Ahmadiyya in England, written for Western readers and supported by references to Western authorities: Muhammad’s character, his teaching, his treatment of slaves and women, and the charges brought against him by Christian writers.',
    'The Ideal Prophet (Khwaja Kamal-ud-Din, 1925)', '1925 CE')
mov('x-maz', 'inner_studies', 'Otoman Zar-Adusht Ha’nish, Inner Studies: A Course of Twelve Lessons (Chicago: Mazdaznan Publishing Company, 1904, second edition; first published 1902 by the Sun-Worshiper Publishing Company)',
    'The teacher of the Mazdaznan movement’s course of twelve lessons: his teaching of “Zarathustrian” breath, diet, the body and the inner life, set out as the movement’s own course. It is a new religion of the 1890s that draws on the name of Zoroaster; it is not the Zoroastrianism of the Avesta, and its claims about Zoroaster are the movement’s own. The scan’s title page is damaged and some pages are noisy.',
    'Inner Studies (Otoman Zar-Adusht Ha’nish, 1904)', '1902–04 CE', split=None)
mov('x-bai', 'initiationhumans1922bail', 'Alice A. Bailey, Initiation, Human and Solar (New York: Lucifer Publishing Company, 1922)',
    'The first of the books of the founder of the Arcane School (later the Lucis Trust), who said that her books were dictated to her by a Master of the Wisdom: the path of initiation and its stages, the Masters and the Hierarchy, the planetary and solar initiations, the seven rays, with a glossary drawn from Theosophical books. Not Theosophy’s own doctrine in every point; Bailey’s teaching later separated from the Theosophical Society.',
    'Initiation, Human and Solar (Alice A. Bailey, 1922)', '1922 CE')

# ── China ──
sch('x-wsw', ['middlekingdomsur01will', 'middlekingdomsur02will'], 'S. Wells Williams, The Middle Kingdom: A Survey of the Geography, Government, Literature, Social Life, Arts, and History of the Chinese Empire and Its Inhabitants, revised edition, two volumes (New York: Charles Scribner’s Sons, 1913; first published 1848)',
    'The American missionary-sinologist’s survey of China, for sixty years the standard English book on the country: the land and the people, the government and the examinations, the Chinese language, literature and the classics, and, in volume II, the religions of China (Confucianism, Taoism and Buddhism, the Muslims, the Jews of Kaifeng, the Nestorian monument and the Roman Catholic and Protestant missions), manners, festivals and the Taiping rebellion. Revised in 1883 and 1913; the religion chapters are the 1848–83 view of a missionary.',
    'The Middle Kingdom (S. Wells Williams, 1848; revised edition 1913), two volumes', '1848–1913 CE', split=None)

# ── Mexico and the Plains ──
fld('a-lum', ['unknownmexicorec01lumh', 'unknownmexicorec02lumh'], 'Carl Lumholtz, Unknown Mexico: A Record of Five Years’ Exploration among the Tribes of the Western Sierra Madre; in the Tierra Caliente of Tepic and Jalisco; and among the Tarascos of Michoacan, two volumes (New York: Charles Scribner’s Sons, 1902)',
    'The Norwegian explorer’s record of his expeditions of 1890–98 for the American Museum of Natural History: the Tarahumara (their feasts, the dances and the sacred drink, the yumari ceremonies and healing), the Tepehuane and the Cora, and, in volume II, the Huichol (Wixárika): their gods, the hikuli (peyote) pilgrimage to the desert, their temples and the ceremonies of the year, with the Tarascos of Michoacan. An outsider’s record from the 1890s.',
    'Unknown Mexico (Carl Lumholtz, 1902), two volumes', 'recorded 1890–98 CE', split=None)
fld('a-hsy', 'symbolismofhuich00lumh', 'Carl Lumholtz, Symbolism of the Huichol Indians (New York: American Museum of Natural History, Memoirs, vol. III, Anthropology II, 1900)',
    'Lumholtz’s memoir on the Huichol (Wixárika) of the Sierra Madre: a sketch of the country and the people, the gods and their paraphernalia, the front-shields and back-shields and the votive bowls (the “eyes” of the gods), the symbols of the serpent, the deer and the sun, and the meaning of the designs, as the Huichol explained them to him. An outsider’s record from the 1890s of a religion that the Huichol still practise.',
    'Symbolism of the Huichol Indians (Carl Lumholtz, 1900)', 'recorded 1890s CE', split=None)
fld('a-spd', 'sundanceplainsi00lowigoog', 'Leslie Spier, The Sun Dance of the Plains Indians: Its Development and Diffusion (New York: American Museum of Natural History, Anthropological Papers, vol. XVI, part VII, 1921)',
    'The comparative study of the Sun Dance across the Plains: the ceremony among the Blackfoot, Arapaho, Cheyenne, Sioux, Crow, Shoshone, Ute, Kiowa and other tribes, the rites of the lodge, the vows and the tortures, and Spier’s reconstruction of how it arose and spread. A scholar’s comparison from tribal descriptions of 1900–20; the Sun Dance is still held by many Plains peoples.',
    'The Sun Dance of the Plains Indians (Leslie Spier, 1921)', 'recorded 1900–20 CE', split=None)

# ── Taoists at the Mongol court ──
sch('x-bre', 'mediaevalresearc01bret', 'E. Bretschneider, Mediaeval Researches from Eastern Asiatic Sources: Fragments towards the Knowledge of the Geography and History of Central and Western Asia from the Thirteenth to the Seventeenth Century, volume I (London: Trübner, 1888)',
    'Translations from Chinese sources of the Mongol age, with the Russian sinologist’s notes. The first volume carries the Si-yu-ki, the account of the journey (1221–24) of the Taoist master Ch’ang Ch’un (Qiu Chuji, 1148–1227), summoned by Chinggis Khan, from China to the Hindu Kush and back, with his conversations on Taoist matters and the note that he belonged to the Northern school, the Quanzhen (“Complete Perfection”) sect; and the embassy of Ch’ang Te to Hulagu (1259) and other Chinese accounts of the Mongol world. Volume II is not included here.',
    'Mediaeval Researches from Eastern Asiatic Sources, volume I (E. Bretschneider, 1888)', '1221–59 CE (pub. 1888)', cut_head=r'^\s*PREFACE\.\s*$')

# repairs after the test build: indexes and appendices that closed the scans, and a splitter that found only one heading
fix('x-dbn', cut_tail=r'^Aaron \(I\.\), king of Khazars', cut_tail_from=0.3)      # volume III: the bibliography is kept, the index to all three volumes is not
fix('x-frg', cut_tail=r'^Abbeville, museum at, 16')
fix('x-wsw', cut_tail=r'^ABACUS, or Sioanpan')
fix('a-lum', cut_tail=r'^\s*APPENDIX\s*$')           # a vocabulary the scan read as symbols
fix('x-sbt', split=None)
fix('x-nel', cut_tail=r'^[^\n]*PBIHTXD')

# ── Reconstructed and early religions; a new American movement ──
sch('x-scd', 'cu31924029872532', 'Otto Schrader, Prehistoric Antiquities of the Aryan Peoples: A Manual of Comparative Philology and the Earliest Culture, being the “Sprachvergleichung und Urgeschichte”, translated by Frank Byron Jevons from the second revised and enlarged German edition (London: Charles Griffin; New York: Scribner and Welford, 1890)',
    'The German philologist’s reconstruction of the culture of the Indo-European peoples from the words they share: the home of the Aryans, cattle-keeping and farming, the house and the family, trade and the state, and, in the last section, Religion: the shared names of the gods (the sky-father and the heavens), the worship of the dead and the sacred fire, and the priest and the sacrifice. The method is the comparison of words; much of the book’s reconstruction is disputed, and it is a nineteenth-century manual.',
    'Prehistoric Antiquities of the Aryan Peoples (Otto Schrader, 1890)', 'reconstructed; pub. 1890 CE')
sch('x-hrh', 'ancienthistoryof00hirtuoft', 'Friedrich Hirth, The Ancient History of China to the End of the Chóu Dynasty (New York: Columbia University Press, 1908)',
    'A Columbia University sinologist’s history of early China from the Chinese records: the legendary emperors, the Hsia, the Shang (Yin) dynasty and its capital, the Chou conquest and the Chou dynasty to 249 BCE, with the early Chinese religion that the records show: the sacrifices to Shang-ti (the Lord on High), the ancestors and the spirits, divination with the tortoise-shell, and the rites of the kings. Written before the oracle bones of Anyang were read.',
    'The Ancient History of China (Friedrich Hirth, 1908)', 'c. 2000–249 BCE (pub. 1908)')
mov('x-msk', 'holy_koran_of_the_moorish_holy_temple_of_science', 'Noble Drew Ali, The Holy Koran of the Moorish Holy Temple of Science (Chicago: the Moorish Science Temple of America, 1927; the “Circle Seven Koran”)',
    'The scripture of the Moorish Science Temple of America, the movement founded by Noble Drew Ali (born Timothy Drew) in Newark and Chicago in 1913–29: a life of Jesus (the “Genealogy of Jesus”, with eighteen years in India, Europe and Africa), the divine instructions to Moorish Americans, the call to “Know yourself and your Father God, Allah”, and the movement’s teaching that African Americans are Moors of Asiatic descent. It is the movement’s own book and is not the Qur’an of Islam; the Library neither endorses nor judges it. The scan is noisy at the start.',
    'The Holy Koran of the Moorish Holy Temple of Science (Noble Drew Ali, 1927)', '1927 CE', split=None)
sch('x-aul', 'christianityfren0000aaul', 'Alphonse Aulard, Christianity and the French Revolution, translated by Lady Frazer (London: Ernest Benn; Boston: Little, Brown, 1924)',
    'The Sorbonne historian’s lectures on religion in the Revolution: the Church under the Old Regime, the Civil Constitution of the Clergy and the oath, the dechristianisation of 1793–94 and the “worship of Reason”, Robespierre’s cult of the Supreme Being and the festival of 20 Prairial, the separation of Church and State in 1795, the revival of the Catholic Church, and Theophilanthropy. The translator’s note explains the Republican Calendar. By a republican historian who was no friend of the Church.',
    'Christianity and the French Revolution (Alphonse Aulard, 1924)', '1789–1801 CE (pub. 1924)')
fix('x-hrh', cut_tail=r'^Agreements, state :', cut_tail_from=0.5)      # the index and the publisher’s list
fix('x-mjp', cut_tail=r'^(?:\s*REFERENCE INDEX\.|[^\n]*COINS OF JAPAN)', cut_tail_from=0.9)      # press notices of the author’s earlier book, and a table of characters the scan read as symbols
fix('x-scd', split=None)      # the splitter found the chapters of each of the book's parts and gave them the same names
