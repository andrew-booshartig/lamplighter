"""Specs for a seventeenth batch of open (pre-1931) English texts, continuing the maker's "get as close as we can to covering all the religions" (17 November 2026): the sects and village
religion of India (Oman, Bhattacharya, Whitehead, Elmore, Stevenson, Heber), the history and schools of Buddhism (Pratt, Getty, Johnston, Soothill, Hackmann, Saunders, Nanjio, Copleston), the
Circassians and the Slavs (Bell, Ralston), the Iroquois (Morgan), the Cuna of Darien (Wafer) and the archaeology of Mexico and of the North American mounds (Spinden, Joyce, Thomas, Shetrone,
Thruston). Merged into texts_archive.SPECS; built with python3 build_texts.py --only=ids.

Left out because the Library already has them: Cumont's Oriental Religions in Roman Paganism (x-cmo), Mead's Fragments of a Faith Forgotten (e-ffg), Hale's Iroquois Book of Rites (a-hrit).
"""
from texts_round9 import S, SCH, REF
from texts_round10 import G, T, FIELD

SPECS = {}
fix = lambda i, **kw: SPECS[i].update(kw)


def sch(i, idents, by, note, title, when, **kw):
    if kw.get('split', 'auto') == 'auto': kw.setdefault('min_chars', 250)
    SPECS[i] = G(idents, by, note + ' ' + SCH, lib=S(title, when), **{'split': 'auto', **kw})


def fld(i, idents, by, note, title, when, **kw):
    if kw.get('split', 'auto') == 'auto': kw.setdefault('min_chars', 250)
    SPECS[i] = G(idents, by, note + ' ' + FIELD, lib=T(title, when), **{'split': 'auto', **kw})


# ── Hindu sects and village religion ──
sch('x-oma', 'mysticsasceticss00oman', 'John Campbell Oman, The Mystics, Ascetics, and Saints of India: A Study of Sadhuism, with an Account of the Yogis, Sanyasis, Bairagis, and other Strange Hindu Sectarians (London: T. Fisher Unwin, 1903)',
    'A Lahore professor’s study of India’s holy men, from his years in the Punjab and Bengal: the sadhus and the sects of Shaiva and Vaishnava ascetics (the Gosains, Bairagis, Nanak-panthis, Kabir-panthis, the Aghoris and the Nath yogis), the Udasis and Nirmalas, their lives and beliefs and their influence on the people. A European’s view, with his prejudices.',
    'The Mystics, Ascetics, and Saints of India (John Campbell Oman, 1903)', '1903 CE')
sch('x-bht', 'hinducastesands00bhatgoog', 'Jogendra Nath Bhattacharya, Hindu Castes and Sects: An Exposition of the Origin of the Hindu Caste System and the Bearing of the Sects towards each other and towards other Religious Systems (Calcutta: Thacker, Spink, 1896)',
    'A Bengali Hindu scholar’s survey of the sects: the castes, the Brahmans and the sacred thread, the Vaishnava sects (Ramanuja, Madhva, Nimbarka, Vallabha, Chaitanya and the Ramanandis), the Shaiva sects and the Shakta tantra, the Lingayats and the Sikhs and Jains, and the modern Brahmo and Arya Samaj, from within the tradition.',
    'Hindu Castes and Sects (Jogendra Nath Bhattacharya, 1896)', '1896 CE', split=None)
sch('x-omc', 'cultscustomssupe00omanuoft', 'John Campbell Oman, Cults, Customs and Superstitions of India: Being a Revised and Enlarged Edition of Indian Life, Religious and Social (London: T. Fisher Unwin, 1908)',
    'A study of popular Hinduism and Islam in India: the worship of the village goddesses and the planets and the serpent, the shrines of the Muslim saints, the festivals (Holi, Dasahra), pilgrimages, the Sati and the caste ritual, the miracles and the omens, with many pictures. A European’s account of its day.',
    'Cults, Customs and Superstitions of India (John Campbell Oman, 1908)', '1908 CE')
sch('x-whd', 'thevillagegodsof00whituoft', 'Henry Whitehead, The Village Gods of South India (Calcutta: Association Press, 1921; the Religious Life of India series)',
    'The Bishop of Madras’s study of the village goddesses (Ammans) and godlings of the Tamil and Telugu country, from his years in the villages: the goddess of smallpox, the village priests and the buffalo and goat sacrifices, the festivals and the possession by the god, and the place of the village gods beside the Hindu gods. A missionary’s view, based on close observation.',
    'The Village Gods of South India (Henry Whitehead, 1921)', '1921 CE')
sch('x-elm', 'dravidiangodsinm00elmo', 'Wilber Theodore Elmore, Dravidian Gods in Modern Hinduism: A Study of the Local and Village Deities of Southern India (Lincoln: University of Nebraska, 1915)',
    'The American missionary’s study of the village gods of the Telugu and Tamil country: the village goddesses, the demon worship and the sacrifice, the Dravidian beliefs beside Hindu worship, and the ways the older gods were absorbed into Hinduism.',
    'Dravidian Gods in Modern Hinduism (Wilber T. Elmore, 1915)', '1915 CE')
sch('x-sti', 'ritesoftwiceborn00steviala', 'Mrs. Sinclair Stevenson, The Rites of the Twice-Born (London: Oxford University Press, 1920; the Religious Quest of India series)',
    'A missionary’s description of the rites of the three upper castes in Gujarat and Kathiawar: the birth rites and the sacred thread, marriage, the death ceremonies, the daily worship and the Brahmans’ ritual, with the rites of the Jain sects, from her own observation. A missionary’s view, but a careful record.',
    'The Rites of the Twice-Born (Mrs. Sinclair Stevenson, 1920)', '1920 CE', split=None)
sch('x-heb', ['narrativeofjourn01hebe', 'narrativeofjourn02hebe'], 'Reginald Heber, Narrative of a Journey through the Upper Provinces of India, from Calcutta to Bombay, 1824–1825, two volumes (London: John Murray, 1828; this printing 1829)',
    'The Bishop of Calcutta’s journal of his visitation: Benares and the Ganges, Delhi, Rajputana and Gujarat, with his accounts of the temples and the festivals, the Sikhs and the Jain, the new sect of Swaminarayan in Gujarat, which he met at Kathiawar, and the Church in India (two volumes).',
    'Narrative of a Journey through the Upper Provinces of India (Reginald Heber, 1828), two volumes', '1824–25 CE', split=None)

# ── Buddhism: its history and schools ──
sch('x-prt', 'in.ernet.dli.2015.283617', 'James Bissett Pratt, The Pilgrimage of Buddhism and a Buddhist Pilgrimage (New York: Macmillan, 1928)',
    'The Williams College philosopher’s journey through the Buddhist lands in 1923–24 and his study: Ceylon and Burma (the Theravada), Tibet and Nepal, China and Japan, with the history of Buddhism and its schools and what he saw of the temples, the monks and the lay people in each country.',
    'The Pilgrimage of Buddhism and a Buddhist Pilgrimage (James B. Pratt, 1928)', '1928 CE')
sch('x-gty', 'northernbuddhism00gettuoft', 'Alice Getty, The Gods of Northern Buddhism: Their History, Iconography and Progressive Evolution through the Northern Buddhist Countries (Oxford: Clarendon Press, 1914)',
    'The standard English account of the deities of Mahayana and Vajrayana Buddhism: the Buddhas and Bodhisattvas, Tara and the female deities, the guardian and tantric deities (the Lokapalas, Mahakala, Yamantaka), the saints and teachers (Padmasambhava, Tsongkhapa) and their images in Tibet, Nepal, China, Korea and Japan.',
    'The Gods of Northern Buddhism (Alice Getty, 1914)', '1914 CE')
sch('x-jbc', 'buddhistchina00johnuoft', 'Reginald F. Johnston, Buddhist China (London: John Murray, 1913)',
    'A Hong Kong official’s study of Chinese Buddhism as he found it on the mountains (Wutai, Putuo, Jiuhua and Emei) and in the monasteries: the monks and the Chan (Zen) and Pure Land practice, the Mahayana scriptures and the temple rites, the lay pilgrims, with the history of the schools (Tiantai, Huayan) in China.',
    'Buddhist China (Reginald F. Johnston, 1913)', '1913 CE')
sch('x-sth', 'cu31924023204062', 'William Edward Soothill, The Three Religions of China: Lectures Delivered at Oxford (London: Hodder and Stoughton, 1913)',
    'A missionary-sinologist’s lectures on Confucianism, Taoism and Buddhism in China: the ethic of Confucius and ancestor worship, the Taoist gods and priests and the Taoist immortals, Buddhism and its schools, and the three religions in the daily life of the Chinese.',
    'The Three Religions of China (William E. Soothill, 1913)', '1913 CE')
sch('x-hck', 'buddhismasreligi00hackiala', 'Heinrich Hackmann, Buddhism as a Religion: Its Historical Development and its Present Conditions (London: Probsthain, 1910)',
    'A German missionary-scholar’s survey of Buddhism as a living religion: its history and doctrine and schools, the Buddhism of Ceylon and Burma, of Tibet, China, Korea and Japan (with the Japanese sects of Amida, Zen, Nichiren and Shingon) and its present condition at the time.',
    'Buddhism as a Religion (Heinrich Hackmann, 1910)', '1910 CE')
sch('x-sau', 'epochsinbudhisth035244mbp', 'Kenneth J. Saunders, Epochs in Buddhist History (Chicago: University of Chicago Press, 1924; the Haskell Lectures)',
    'The Haskell Lectures of a Berkeley scholar, who knew Ceylon and India: the Buddha’s age, Asoka and the Buddhist missions, the Mahayana and its sutras, Buddhism in China and the Tang age, in Japan under Nara and Heian, and the revival of Buddhism in the modern East.',
    'Epochs in Buddhist History (Kenneth J. Saunders, 1924)', '1924 CE')
sch('x-nnj', 'shorthistoryoftw00nanjrich', 'Bunyiu Nanjio, A Short History of the Twelve Japanese Buddhist Sects (Tokyo: Bukkyo Sho-Eiyaku Shuppan-sha, 1886)',
    'The Japanese Buddhist scholar’s account, for English readers, of the twelve schools of Japan: the Kusha, Jojitsu and Ritsu of Nara, the Hosso, Sanron, Kegon, Tendai and Shingon, the Jodo (Pure Land) and the Shin (True Pure Land), the Zen (Rinzai and Soto) and the Nichiren sect, with their founders and teachings.',
    'A Short History of the Twelve Japanese Buddhist Sects (Bunyiu Nanjio, 1886)', '1886 CE')
sch('x-cpl', 'buddhismprimitiv00copl', 'Reginald Stephen Copleston, Buddhism, Primitive and Present, in Magadha and in Ceylon (London: Longmans, Green, 1892)',
    'The Anglican Bishop of Colombo’s study of the Buddha’s teaching in the early texts and of the Buddhism he saw in Ceylon, set against each other: the Four Truths and the no-soul teaching and Nirvana, the Buddha’s legend, the monks and the Sangha, and the folk Buddhism of the island. A Christian bishop’s criticism.',
    'Buddhism, Primitive and Present, in Magadha and in Ceylon (Reginald S. Copleston, 1892)', '1892 CE')

# ── The Circassians, the Slavs, the Iroquois, the Cuna ──
fld('a-bcr', ['journalofresiden01belluoft', 'journalofresiden02belluoft'], 'James Stanislaus Bell, Journal of a Residence in Circassia during the Years 1837, 1838, and 1839, two volumes (London: Edward Moxon, 1840)',
    'The British merchant’s journal of two years among the Circassians (Adyghe) fighting Russia: the tribes’ religion before Islam (the old pagan gods and the sacred groves), their Islam and the mullahs, the princes and the vassals, the funerals and the feasts, the war (two volumes).',
    'Journal of a Residence in Circassia (James S. Bell, 1840), two volumes', 'recorded 1837–39 CE', split=None)
sch('x-ral', 'songsofrussianpe00ralsuoft', 'W. R. S. Ralston, The Songs of the Russian People, as Illustrative of Slavonic Mythology and Russian Social Life, second edition (London: Ellis and Green, 1872)',
    'The British Museum librarian’s book on the Russian folk songs and the survivals of the old Slavic religion in them: the sun and the moon and the thunder-god Perun, the domestic and water spirits (the domovoi and the rusalki), the rites of the year and of marriage and death, the carols and the funeral laments, with his translations.',
    'The Songs of the Russian People (W. R. S. Ralston, 1872)', '1872 CE')
fld('a-mrg', 'hodenosaunee00morgrich', 'Lewis H. Morgan, League of the Ho-dé-no-sau-nee or Iroquois, new edition with notes by Herbert M. Lloyd, two volumes in one (New York: Dodd, Mead, 1904; first edition 1851)',
    'The first ethnography of the Iroquois (Haudenosaunee), the Rochester lawyer’s record with the Seneca Ely Parker: the Five (later Six) Nations and the League of the Hodenosaunee, their Council and the clans, and their religion (the Great Spirit and the Evil-minded, the feasts of the Green Corn and the White Dog, the False Faces, and the Code of Handsome Lake, the Seneca prophet of 1799).',
    'League of the Ho-dé-no-sau-nee or Iroquois (Lewis H. Morgan, 1851; ed. 1904)', 'recorded 1840s CE', split=None)
fld('a-wfr', 'newvoyagedescrip00wafe', 'Lionel Wafer, A New Voyage and Description of the Isthmus of America, edited by George Parker Winship (Cleveland: Burrows Brothers, 1903; first published in 1699)',
    'A buccaneer-surgeon’s record of the four months he spent among the Cuna (Kuna) of Darien in 1681: the people and their chief, the priests (the “Pawwaws”) and their healing and cures, the dances and the beliefs, with the “white” Indians he saw, a famous early account of the Cuna.',
    'A New Voyage and Description of the Isthmus of America (Lionel Wafer, 1699; ed. 1903)', 'recorded 1681 CE')

# ── Archaeology: Mexico and the mounds of North America ──
sch('x-spi', 'ancientcivilizat00spinrich', 'Herbert J. Spinden, Ancient Civilizations of Mexico and Central America (New York: American Museum of Natural History, 1917; Handbook Series no. 3)',
    'The Harvard Mayanist’s handbook for the American Museum: the Archaic or Formative peoples, the Olmec and the Zapotec and Mixtec, Teotihuacan, the Maya (their cities, calendar, gods and glyphs), the Toltec and Aztec, with their religion, art and writing.',
    'Ancient Civilizations of Mexico and Central America (Herbert J. Spinden, 1917)', '1917 CE', split=None)
sch('x-jmx', 'mexicanarchaeolo00joycuoft', 'T. A. Joyce, Mexican Archaeology: An Introduction to the Archaeology of the Mexican and Mayan Civilizations of Pre-Spanish America (London: Philip Lee Warner, 1914)',
    'The British Museum keeper’s survey of ancient Mexico: the Toltec and Teotihuacan, the Aztec and their gods and priests and sacrifices, the Mixtec and Zapotec of Oaxaca, the Maya and the Huastec, the calendar and the codices, and the religion of the Mexican civilizations.',
    'Mexican Archaeology (T. A. Joyce, 1914)', '1914 CE')
sch('x-tmd', 'bureauofethnology00thomrich', 'Cyrus Thomas, Report on the Mound Explorations of the Bureau of Ethnology (Washington: Government Printing Office, 1894; the Twelfth Annual Report of the Bureau of Ethnology)',
    'The Bureau’s great survey of the mounds of the eastern United States, by Cyrus Thomas, from a decade of excavation: the mounds of the Ohio, the Mississippi, the Tennessee and the Gulf (the burial mounds, the temple mounds and the effigy mounds), what they held (copper, shell and pottery), and the case that the builders were the ancestors of the Native peoples. It is the standard argument against the “lost race” legends.',
    'Report on the Mound Explorations of the Bureau of Ethnology (Cyrus Thomas, 1894)', '1894 CE', split=None)
sch('x-shr', 'moundbuilders0000henr', 'Henry Clyde Shetrone, The Mound-Builders: A Reconstruction of the Life of a Prehistoric American Race, through Exploration and Interpretation of their Earth Mounds, their Burials, and their Cultural Remains (New York: D. Appleton, 1930)',
    'The Ohio State Museum’s director’s account of the Adena, Hopewell and later peoples of the mound area: the burial mounds and the earthworks, the grave goods and the pipes and copper, the effigy mounds and the temple platforms of the Southeast, and what the mounds tell of the builders’ religion and life.',
    'The Mound-Builders (Henry Clyde Shetrone, 1930)', '1930 CE', split=None)
sch('x-thr', 'antiquitiestenn00thurrich', 'Gates P. Thruston, The Antiquities of Tennessee and the Adjacent States, and the State of Aboriginal Society in the Scale of Civilization Represented There, second edition (Cincinnati: Robert Clarke, 1897)',
    'A Nashville historian’s survey of the stone graves, the mounds and the village sites of Tennessee and the Mississippi valley: the shell gorgets and the pottery with their religious designs (the sun, the cross and the serpent), the stone-box graves, the stone idols and the burial customs, with the Native traditions of the region.',
    'The Antiquities of Tennessee (Gates P. Thruston, 1890; 1897 edition)', '1897 CE')

# repairs after the first build: the indexes and catalogue cards that closed the scans
fix('x-oma', cut_tail=r'^\s*INDEX\s*$')
fix('x-cpl', cut_tail=r'^\s*INDEX I\s*$')
fix('x-ral', cut_tail=r'^\s*INDEX,\s*$')
fix('x-nnj', cut_tail=r'^\s*Sanskrit-Chinese Index\.')
fix('x-shr', cut_tail=r'^\W*Aborigines of Minnesota, 288')
fix('x-tmd', cut_tail=r'^A\. Abbott, C\. C\., cited')
fix('x-heb', cut_tail=r'^[^\n]*DS412')
