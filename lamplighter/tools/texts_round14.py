"""Specs for a fourteenth batch of open (pre-1931) English texts, on the maker's "yes, round 14", aimed at the thinnest families in the assessment of 16 November 2026
(COVERAGE_ASSESSMENT.md): the Indigenous religions of Southeast Asia (Marsden on Sumatra, Raffles on Java, Crawfurd's Indian Archipelago, the Igorot, Ifugao-neighbours and Tinguian of Luzon,
Worcester on the Philippines, St John on the Dayaks), Inner and East Asia (Huc's Travels in Tartary, Czaplicka on the Turks, Vambery, Das in Tibet, the Miao and Lolo, Korea, Chinese folk-lore and
Chinese social life), the Afro-diasporic religions (St John and Leger on Haiti, Hearn in Martinique, Beckwith on Jamaica, Bryan Edwards on Obeah), the Guiana Indians, and the sects of India and
Japan (Wilson, Westcott on the Kabir Panth, Stevenson and Jaini on Jainism, Sen on Chaitanya, Farquhar, the Radhasoami Discourses, Reischauer, Anesaki, Lloyd, Holtom, Underwood). Merged into
texts_archive.SPECS; built with python3 build_texts.py --only=ids. Found 16 November 2026.

Left out: R. C. Temple's Thirty-Seven Nats (the only scan found has 34,000 letters of a book of 300 pages) and the Royal Parchment Scroll of Black Supremacy (1925; the one scan is a library reprint
whose text is too garbled to read); the Karsandas Mulji History of the Maharajas is the DLI scan (the Google scan was a stub). Already in the Library: Edkins, Griffis, Hearn's Japan, Barton's Ifugao Law.
"""
from texts_round9 import S, SCH, REF
from texts_round10 import G, T, FIELD
from texts_round8 import MOV

SPECS = {}
NEW = 'Bahá’í, Theosophy'


def fld(i, idents, by, note, title, when, group='tb', **kw):
    if kw.get('split', 'auto') == 'auto': kw.setdefault('min_chars', 250)
    SPECS[i] = G(idents, by, note + ' ' + FIELD, lib=(title, group, when, 'fld', None), **{'split': 'auto', **kw})


def sch(i, idents, by, note, title, when, **kw):
    if kw.get('split', 'auto') == 'auto': kw.setdefault('min_chars', 250)
    SPECS[i] = G(idents, by, note + ' ' + SCH, lib=S(title, when), **{'split': 'auto', **kw})


# ── Southeast Asia ──
fld('a-msd', 'historysumatrac01marsgoog', 'William Marsden, The History of Sumatra: Containing an Account of the Government, Laws, Customs and Manners of the Native Inhabitants, third edition (London: for the author, 1811)',
    'The first English account of Sumatra, by a Company official who lived there in 1771–79: the Rejang, the Malays and the Batak, their spirits and the gods (Dewata) and the ancestors, the sacrifices, the omens and charms, the Muslim and the pagan, with his report that the Batak ate their dead criminals and enemies by law.',
    'The History of Sumatra (William Marsden, 1811)', 'recorded 1771–79 CE')
fld('a-raf', 'historyjava02raffgoog', 'Sir Thomas Stamford Raffles, The History of Java, volume II (London: John Murray, 1817; second edition 1830)',
    'Volume II of the British governor’s history of Java: the religion of the Javanese (its Hindu and Buddhist inheritance, the spirits and the gods, and the introduction of Islam), the ruling families, the chronicles and the history of Java down to 1815. Volume I, on the land, the people and their customs, is not in the scan.',
    'The History of Java (Sir T. S. Raffles, 1817), volume II', 'recorded 1811–16 CE')
fld('a-crw', ['CrawfurdArchipelago18201', 'historyofindiana02crawuoft', 'historyofindiana03craw'], 'John Crawfurd, History of the Indian Archipelago: Containing an Account of the Manners, Arts, Languages, Religions, Institutions, and Commerce of its Inhabitants, three volumes (Edinburgh: Archibald Constable, 1820)',
    'The Resident at the court of Java’s survey of the peoples of the Malay world: the Javanese, Malays, Bugis, Batak, Dayak and Filipinos, their religions (the Hindu and Buddhist inheritance of Java and Bali, Islam, and the spirits of the pagan peoples), their law and their trade (three volumes).',
    'History of the Indian Archipelago (John Crawfurd, 1820), three volumes', 'recorded 1810s CE', split=None)
fld('a-jen', 'bontocigorot01jenkgoog', 'Albert Ernest Jenks, The Bontoc Igorot (Manila: Bureau of Public Printing, 1905; Department of the Interior Ethnological Survey Publications, vol. 1)',
    'The Philippine Ethnological Survey’s monograph on the Bontoc Igorot of northern Luzon, from a year in the villages: their spirits (anito), the sacrifices and the head-taking ceremonies, the priests and omen-birds, the dead and the war, and the rest of their life, with the pictures.',
    'The Bontoc Igorot (Albert E. Jenks, 1905)', 'recorded 1903 CE')
fld('a-tin', 'tinguiansocialre142cole', 'Fay-Cooper Cole, The Tinguian: Social, Religious, and Economic Life of a Philippine Tribe (Chicago: Field Museum of Natural History, 1922; Anthropological Series, vol. 14, no. 2)',
    'The Field Museum’s study of the Tinguian of Abra in northern Luzon: the spirits (anito), the ceremonies of the mediums, the offerings, the ghosts and the underworld, the rites of birth, marriage, sickness and death.',
    'The Tinguian: Social, Religious, and Economic Life (Fay-Cooper Cole, 1922)', 'recorded 1907–08 CE')
fld('a-tit', 'traditionsofting00coleuoft', 'Fay-Cooper Cole, Traditions of the Tinguian: A Study in Philippine Folk-Lore (Chicago: Field Museum of Natural History, 1915; Anthropological Series, vol. 14, no. 1)',
    'The myths and tales of the Tinguian, as taken down in their own language: the first people and the culture heroes, the sun and the moon and the origins of things, with the stories of the spirits.',
    'Traditions of the Tinguian (Fay-Cooper Cole, 1915)', 'recorded 1907–08 CE')
fld('a-kph', 'peoplesofphilipp00kroeuoft', 'A. L. Kroeber, Peoples of the Philippines (New York: American Museum of Natural History, 1919; Handbook Series no. 8)',
    'A short survey of the Philippine peoples by the anthropologist: the Negritos, the mountain peoples (Igorot, Ifugao, Bontoc, Kalinga), the Bagobo and Moro and the Christian Visayan and Tagalog, with their religions, spirits and customs.',
    'Peoples of the Philippines (A. L. Kroeber, 1919)', 'recorded 1900s–1910s CE')
fld('a-wor', 'philippineisland00worciala', 'Dean C. Worcester, The Philippine Islands and their People: A Record of Personal Observation and Experience (New York: Macmillan, 1898)',
    'An American zoologist’s account of two expeditions to the Philippines in 1887–88 and 1890–93: the Spaniards and the Filipinos, the pagan peoples of the islands, the spirits and the superstitions he saw, and the Moro. Written before he served as the American colonial official, with that prejudice of the time.',
    'The Philippine Islands and their People (Dean C. Worcester, 1898)', 'recorded 1887–93 CE')
fld('a-sjf', ['lifeinforestsfa01johngoog', 'lifeinforestsfa02johngoog'], 'Spenser St. John, Life in the Forests of the Far East; or, Travels in Northern Borneo, two volumes (London: Smith, Elder, 1862)',
    'The British consul’s travels among the Dayaks and the Muslim Malays of Sarawak and Brunei in 1848–61: the spirits and omens, the head feast and the priests and their rites, the burial of the dead and the fear of ghosts, together with Rajah Brooke’s Sarawak.',
    'Life in the Forests of the Far East (Spenser St. John, 1862), two volumes', 'recorded 1848–61 CE', split=None)

# ── Inner and East Asia ──
fld('a-hcg', ['travelsintartary00huce', 'travelsintartary02huceiala'], 'Évariste Huc and Joseph Gabet, Travels in Tartary, Thibet and China, 1844–1846, translated by W. Hazlitt, second reprint edition, two volumes (Chicago: Open Court, 1900)',
    'The journey of two French Lazarist priests through Mongolia and Tibet to Lhasa: Mongol shamans and lamas, the Buddhist monasteries (Kumbum, Lhasa), the birth of Tsongkhapa and the tree of the thousand images, the Dalai Lama and the Tibetan government. The two missionaries’ view of the religions they met, a famous book.',
    'Travels in Tartary, Thibet and China (Huc and Gabet, 1844–46; Open Court ed. 1900), two volumes', 'recorded 1844–46 CE', split=None)
fld('a-trk', 'turksofcentralas00czapuoft', 'M. A. Czaplicka, The Turks of Central Asia in History and at the Present Day: An Ethnological Inquiry into the Pan-Turanian Problem, and Bibliographical Material relating to the Early Turks (Oxford: Clarendon Press, 1918)',
    'The Oxford anthropologist’s survey of the Turkic peoples (Kirghiz, Kazak, Uzbek, Tatar, Yakut, Chuvash and others): their history, their old religion (the Sky God and the shamans) and their Islam, with a bibliography of the early Turks.',
    'The Turks of Central Asia in History and at the Present Day (M. A. Czaplicka, 1918)', 'recorded 1900s–1910s CE')
fld('a-vam', 'sketchesofcentra00vm', 'Arminius Vámbéry, Sketches of Central Asia: Additional Chapters on my Travels, Adventures, and on the Ethnology of Central Asia (London: W. H. Allen, 1868)',
    'The Hungarian orientalist’s journey in 1863 through Persia and Turkestan disguised as a dervish: the dervishes and their orders, the Muslim of Khiva and Bukhara and the nomad Turkomans, the customs of birth and death, and the old beliefs underneath their Islam.',
    'Sketches of Central Asia (Arminius Vámbéry, 1868)', 'recorded 1863 CE')
fld('a-das', 'journeytolhasace00dass', 'Sarat Chandra Das, Journey to Lhasa and Central Tibet, edited by W. W. Rockhill (London: John Murray, 1902)',
    'The Bengali explorer’s account of his two journeys to Tibet (1879–82): the monasteries of Tashilhunpo and Lhasa, the Panchen Lama, the Tibetan festivals and temples, and the religion of the common people as he saw it.',
    'Journey to Lhasa and Central Tibet (Sarat Chandra Das, 1902)', 'recorded 1879–82 CE')
fld('a-clk', 'amongtribesinsou00clarrich', 'Samuel R. Clarke, Among the Tribes in South-West China (London: China Inland Mission, 1911)',
    'A missionary’s record of the Miao (Hmong), Lolo (Yi), Chung-chia and other peoples of Guizhou and Yunnan in 1890s–1900s: their spirits and priests, the sacrifices and festivals, the stories of the flood and the first people, and the rites of birth, marriage and death.',
    'Among the Tribes in South-West China (Samuel R. Clarke, 1911)', 'recorded 1890s–1900s CE')
fld('a-hul', 'passingofkorea00hulbuoft', 'Homer B. Hulbert, The Passing of Korea (New York: Doubleday, Page, 1906)',
    'The American educator’s survey of Korea at the end of its independence: its government and people, the religion of Korea (the shamans, the mudang and spirit worship, Buddhism, Confucianism and the ancestor rites), the festivals and customs, and its history to 1905.',
    'The Passing of Korea (Homer B. Hulbert, 1906)', 'recorded 1886–1905 CE')
fld('a-gal', 'koreaintransitio00gale', 'James Scarth Gale, Korea in Transition (New York: Young People’s Missionary Movement, 1909)',
    'A Canadian missionary’s study of Korea in 1888–1909: the old religion (the spirits of the household and the mountain, the shaman and the sorceress, Confucian and Buddhist practice), the family and the position of women, and the coming of the churches.',
    'Korea in Transition (James S. Gale, 1909)', 'recorded 1888–1909 CE')
fld('a-dny', 'folkloreofchinai00dennuoft', 'N. B. Dennys, The Folk-Lore of China, and its Affinities with that of the Aryan and Semitic Races (London: Trübner, and Hong Kong: China Mail, 1876)',
    'A colonial official’s collection of Chinese popular belief: the gods and spirits (Heaven, the kitchen god, the city-god), fox and ghost stories, geomancy and divination, the festivals, charms and magic, set beside parallels in other peoples’ folk-lore.',
    'The Folk-Lore of China (N. B. Dennys, 1876)', 'recorded 1860s–70s CE')
fld('a-dlt', ['sociallifeofchin01dool', 'sociallifeofchin02dool'], 'Justus Doolittle, Social Life of the Chinese: With Some Account of their Religious, Governmental, Educational, and Business Customs and Opinions, two volumes (New York: Harper, 1865)',
    'A missionary’s record of Fuzhou in 1850–64: the household gods and the ancestor tablets, the temples and the gods of the city, Buddhist and Daoist priests, the festivals and the New Year, geomancy and the rites of birth, marriage and death.',
    'Social Life of the Chinese (Justus Doolittle, 1865), two volumes', 'recorded 1850–64 CE', split=None)

# ── The Caribbean, Guiana and the Afro-diasporic religions ──
fld('a-sjh', 'cu31924021174564', 'Sir Spenser St. John, Hayti; or, The Black Republic (London: Smith, Elder, 1884; second edition 1889)',
    'The British diplomat’s book of 1884, from his years in Port-au-Prince, the first to bring Haitian Vodou before English readers: the vaudoux snake worship and the sacrifice, the spirits and the Haitian Catholicism, and the charge of ritual cannibalism that Haitians have always denied (see Léger). It is a hostile view and was used for racist ends; read it with Léger and with the practitioners’ own account.',
    'Hayti; or, The Black Republic (Sir Spenser St. John, 1884)', 'recorded 1863–84 CE')
fld('a-leg', 'haitiherhistoryh00lguoft', 'J. N. Léger, Haiti, her History and her Detractors (New York and Washington: Neale, 1907)',
    'The Haitian Minister to the United States’s answer to St John and other European writers: the history of Haiti from 1791, the character of Vodou and the Haitian Catholic Church, and a defence of the people against the charges of barbarism.',
    'Haiti, her History and her Detractors (J. N. Léger, 1907)', 'recorded 1900s CE')
fld('a-hrn', 'twoyearsinfrench00hearrich', 'Lafcadio Hearn, Two Years in the French West Indies (New York: Harper, 1890)',
    'The Japan-writer’s book on Martinique and the lesser Antilles (1887–89): the people and their Creole, the zombi and the quimbois (sorcery), the beliefs about the dead and the sea, the festivals and the Catholic Church beside the old spirit beliefs.',
    'Two Years in the French West Indies (Lafcadio Hearn, 1890)', 'recorded 1887–89 CE')
fld('a-bkr', 'blackroadwaysstu03beck', 'Martha Warren Beckwith, Black Roadways: A Study of Jamaican Folk Life (Chapel Hill: University of North Carolina Press, 1929)',
    'The folklorist’s study of Jamaican folk belief (1919–23): the duppy (ghost) and obeah, myal and the revival cults, the Anancy and other stories, songs, riddles and proverbs, the rites of the wake and the Christian church beside the African inheritance.',
    'Black Roadways: A Study of Jamaican Folk Life (Martha Warren Beckwith, 1929)', 'recorded 1919–23 CE')
fld('a-edw', 'historycivilcomm02edwa', 'Bryan Edwards, The History, Civil and Commercial, of the British Colonies in the West Indies, volume II (London: J. Stockdale, 1801; third edition)',
    'Volume II of the planter-historian’s history of the West Indies, which describes the Jamaican slaves of the “Coromantee” (Akan) country and their religion, and the practice of Obeah, the first English description of it, as it was heard from the planters after the Jamaican rising of 1760. The record of a slave-owner, who defends the system; read it critically.',
    'The History, Civil and Commercial, of the British West Indies (Bryan Edwards, 1801), volume II', 'recorded 1760s–1790s CE')
fld('a-rgi', 'gri_33125013314659', 'Walter E. Roth, An Inquiry into the Animism and Folk-Lore of the Guiana Indians (Washington: Government Printing Office, 1915; Bureau of American Ethnology, Thirtieth Annual Report)',
    'The British Guiana magistrate’s study of the Arawak, Carib, Warrau and other peoples: the spirits (kenaima, the demons) and the shaman (piai), the stories of the culture hero and the first people, charms, taboo and the rites of birth and death. The Library’s best record of the lowland peoples of the north of South America.',
    'An Inquiry into the Animism and Folk-Lore of the Guiana Indians (Walter E. Roth, 1915)', 'recorded 1890s–1910s CE')

# ── The study of religion: India, Japan and the Americas (shelf-only Scholarship) ──
sch('x-wil', ['essayslectureson01wils', 'essayslectureson02wils'], 'H. H. Wilson, Essays and Lectures chiefly on the Religion of the Hindus, collected and edited by Reinhold Rost, two volumes (London: Trübner, 1861–62)',
    'The Oxford Sanskritist’s survey of the sects of India, first printed in 1828–32: the Vaishnavas (Ramanujas, Ramanandis, the followers of Kabir and Vallabha, Chaitanya), the Shaivas, the Dadupanthis, the Sikhs and the other reforming sects, with the worship of Kali and the Puranas (two volumes).',
    'Essays and Lectures on the Religion of the Hindus (H. H. Wilson, 1861–62), two volumes', '1828–62 CE', split=None)
sch('x-wkb', 'kabirkabirpanth00westuoft', 'G. H. Westcott, Kabir and the Kabir Panth (Cawnpore: Christ Church Mission Press, 1907)',
    'A missionary’s study of the poet-saint Kabir and the sect that bears his name: his life and legend, his teaching on God and the soul and his attack on caste and idols, the Dohas and Sakhis, the Kabir Panth’s monasteries (at Benares, Dharamdas, Chhattisgarh) and its later divisions.',
    'Kabir and the Kabir Panth (G. H. Westcott, 1907)', '1907 CE', split='auto')
sch('x-kmm', 'dli.ministry.02903', 'Karsandas Mulji, History of the Sect of Maharajas, or Vallabhacharyas, in Western India (London: Trübner, 1865)',
    'A Bombay reformer’s history of the Pushtimarg, the sect of Vallabha, and its hereditary Maharajas, whose conduct he attacked in his journal and had judged in the Maharaj Libel Case of 1862: the doctrines and worship of the sect, the claims of the Maharajas to the devotion of their followers, and the trial. A hostile and a famous record.',
    'History of the Sect of Maharajas, or Vallabhacharyas (Karsandas Mulji, 1865)', '1862–65 CE', split=None)
sch('x-hjn', 'theheartofjainis00stevuoft', 'Mrs. Sinclair Stevenson, The Heart of Jainism (London: Oxford University Press, 1915; the Religious Quest of India series)',
    'A Scottish missionary’s account of the Jains of Gujarat and Rajasthan as she knew them: the tirthankaras and the doctrine of karma and the soul, the monks and nuns, the Shvetambara, Digambara and Sthanakvasi sects, the temples and festivals, and the Jain way of life. A missionary’s view; read it with Jaini and with the Jain texts themselves.',
    'The Heart of Jainism (Mrs. Sinclair Stevenson, 1915)', '1915 CE', split='auto')
sch('x-ojn', 'outlinesofjainis00jain', 'Jagmanderlal Jaini, Outlines of Jainism, edited by F. W. Thomas (Cambridge: University Press, 1916)',
    'A Jain judge’s statement of his own religion, for English readers: the nature of the soul and the world, karma and the path of liberation, the five vows and the three jewels, the tirthankaras, and the two sects (the Digambara and Shvetambara).',
    'Outlines of Jainism (Jagmanderlal Jaini, 1916)', '1916 CE', split='auto')
sch('x-cai', 'chaitanyahisage00senduoft', 'Dinesh Chandra Sen, Chaitanya and his Age (Calcutta: University of Calcutta, 1922; the Ramtanu Lahiri Fellowship lectures)',
    'A Bengali scholar’s history of the saint of Nabadwip (1486–1534) and the devotional movement of Bengal: the Vaishnava background in Bengal, the life of Chaitanya and his dancing and singing in the name of Krishna, and the writers (Jayadeva, Vidyapati, Chandidas) and the Gaudiya Vaishnavism that came from him.',
    'Chaitanya and his Age (Dinesh Chandra Sen, 1922)', '1486–1534 CE (pub. 1922)', split='auto')
sch('x-orl', 'outlineofreligio00farqrich', 'J. N. Farquhar, An Outline of the Religious Literature of India (London: Oxford University Press, 1920; the Religious Quest of India series)',
    'A survey of the writings of India’s religions from the Rig Veda to the 19th century: the Vedas, Brahmanas and Upanishads, the epics, the Puranas and Tantras, the Buddhist and Jain canons, and the later Hindu sects and their poets (Tulsidas, Kabir, Nanak and the Maratha saints), with a bibliography.',
    'An Outline of the Religious Literature of India (J. N. Farquhar, 1920)', '1920 CE', split='auto')
sch('x-und', 'religionsofeaste00unde', 'Horace Grant Underwood, The Religions of Eastern Asia (New York: Macmillan, 1910; the Cole Lectures)',
    'An American missionary’s lectures on the religions of Korea, China and Japan: the Confucian ethic, Buddhism in each land, Daoism and the spirit worship of the people, and Shinto, and his argument for the claims of Christianity beside them.',
    'The Religions of Eastern Asia (Horace Grant Underwood, 1910)', '1910 CE', split='auto')
sch('x-rjb', 'studiesinjapanes00reis', 'A. K. Reischauer, Studies in Japanese Buddhism (New York: Macmillan, 1917)',
    'The missionary-scholar’s account of the Japanese schools: the Tendai and Shingon of the Heian court, the Jodo and Shin (Pure Land) schools, Zen (Soto and Rinzai) and Nichiren, with the lives of their founders (Saicho, Kukai, Honen, Shinran, Dogen, Nichiren) and the extracts from their writings.',
    'Studies in Japanese Buddhism (A. K. Reischauer, 1917)', '1917 CE', split='auto')
sch('x-ajr', 'in.ernet.dli.2015.125609', 'Masaharu Anesaki, History of Japanese Religion, with Special Reference to the Social and Moral Life of the Nation (London: Kegan Paul, 1930; the scan is the Tuttle reprint)',
    'The Tokyo professor’s history of the whole of Japanese religion: the age of the myths and the Shinto of the clans, the coming of Buddhism and the Tendai and Shingon, Pure Land, Zen and Nichiren, Confucianism, the Christian century and the 19th-century state Shinto and the new sects (the book was first published in 1930).',
    'History of Japanese Religion (Masaharu Anesaki, 1930)', '1930 CE', split='auto')
sch('x-ldj', 'developmentsofja00lloyuoft', 'Arthur Lloyd, Developments of Japanese Buddhism (Tokyo, 1894)',
    'A Tokyo missionary-professor’s account of how Buddhism changed in Japan: Shingon and Tendai, the Pure Land and Shin teachings of Amida, Zen and Nichiren and what he argued these showed of the religion’s growth.',
    'Developments of Japanese Buddhism (Arthur Lloyd, 1894)', '1894 CE', split='auto')
sch('x-hol', 'JapaneseEnthronementCeremonies', 'D. C. Holtom, The Japanese Enthronement Ceremonies, with an Account of the Imperial Regalia (Tokyo: Kyo Bun Kwan, for the Asiatic Society of Japan, 1928)',
    'The Shinto scholar’s account of the ceremonies by which the Japanese emperor takes the throne, from the 1915 enthronement of Taisho: the sacred regalia (mirror, sword and jewel), the Daijosai or great thanksgiving rite, and what they meant in the old religion of Japan.',
    'The Japanese Enthronement Ceremonies (D. C. Holtom, 1928)', '1928 CE', split='auto')
sch('x-bpr', 'religionsofprimi00brinuoft', 'Daniel G. Brinton, The Religions of Primitive Peoples (New York: G. P. Putnam’s Sons, 1897; the American Lectures on the History of Religions)',
    'The American Americanist’s lectures: the sources of religion in the nature of man, the idea of the supernatural and the soul, the worship of nature, the rites and the sacred symbols of the peoples of the Americas and other “primitive” peoples. A product of 1890s anthropology.',
    'The Religions of Primitive Peoples (Daniel G. Brinton, 1897)', '1897 CE', split='auto')
sch('x-bhm', 'americanheromyth00brin', 'Daniel G. Brinton, American Hero-Myths: A Study in the Native Religions of the Western Continent (Philadelphia: H. C. Watts, 1882)',
    'A study of the culture heroes of the Americas: the Algonquin Michabo and the Hare, the Iroquois twins, the Aztec Quetzalcoatl, the Maya Itzamna and the Muisca Bochica, and the shared legend of the white hero who comes out of the east.',
    'American Hero-Myths (Daniel G. Brinton, 1882)', '1882 CE', split='auto')
sch('x-bng', 'cu31924020427542', 'Daniel G. Brinton, Nagualism: A Study in Native American Folk-Lore and History (Philadelphia: MacCalla, 1894; Proceedings of the American Philosophical Society)',
    'A short study of the nagual (the animal soul or “double”) among the peoples of Mexico and Central America: the secret society of the nagualists, its supposed part in the Tzeltal rising of 1712 in Chiapas and the old Mexican priesthood.',
    'Nagualism (Daniel G. Brinton, 1894)', '1894 CE', split=None)
SPECS['x-rsd'] = G('discoursesonradh00misruoft', 'Brahm Sankar Misra (Maharaj Saheb), Discourses on Radhasoami Faith (Agra, 1909)',
                   'The teaching of the Radhasoami movement, as given by its head at Agra: the “Sant Mat” (the way of the saints), the Supreme Being Radhasoami and the sound current (shabd), the necessity of a living Guru, the inner practice and the planes of the soul, and the faith’s view of other religions. ' + MOV,
                   lib=('Discourses on Radhasoami Faith (Brahm Sankar Misra, 1909)', 'mo', '1909 CE', 'mod', NEW), split='auto', min_chars=250)
fix = lambda i, **kw: SPECS[i].update(kw)


# ── repairs found by reading the test builds (16 November 2026) ──
for _i in ('a-msd', 'a-raf', 'a-edw'): fix(_i, long_s=True)                       # 18th- and early 19th-century type prints the long s, which the scan reads as f
for _i in ('a-raf', 'a-jen', 'a-tin', 'a-tit', 'a-dny', 'a-hrn', 'a-leg', 'a-edw', 'x-und', 'x-wkb', 'x-bpr', 'x-rsd'): fix(_i, split=None)      # headings, running heads or dated entries the splitter took for chapters
fix('a-sjf', cut_tail=r'^[^\n]*UNIVERSITY OF C')
fix('a-wor', cut_tail=r'^THE MACMILLAN COMPANY')
fix('x-cai', cut_tail=r'^[^\n]*University of Tor')
fix('x-rjb', cut_tail=r'^THE MACMILLAN COMPANY')
fix('x-kmm', idents=['dli.bengal.10689.9043'])


# ── a second wave found the same day: Indo-China, the Karen and the Shan, Mongolia and Tibet, Siberia, and Surinam ──
fld('a-mou', ['travelsincentral01mouh', 'travelsincentral02mouh'], 'Henri Mouhot, Travels in the Central Parts of Indo-China (Siam), Cambodia, and Laos, during the Years 1858, 1859, and 1860, two volumes (London: John Murray, 1864)',
    'The French naturalist’s travels (published after his death) through Siam, Cambodia and Laos, the first Westerner’s account of Angkor: the Buddhist monks and temples, the spirits and omens of the Siamese, Cambodians and Lao, the festivals, the hill peoples and the ruins of the Khmer temples.',
    'Travels in the Central Parts of Indo-China (Henri Mouhot, 1864), two volumes', 'recorded 1858–60 CE', split=None)
fld('a-fhs', 'soulofpeopl00fiel', 'H. Fielding-Hall, The Soul of a People (London: Richard Bentley, 1898)',
    'A Burma official’s portrait of Burmese Buddhism as the people live it: the monk and the monastery, karma and rebirth, the village festivals, the nats and the spirits beside the Buddha, the end of life. It is a much-quoted, sympathetic and sometimes romantic book.',
    'The Soul of a People (H. Fielding-Hall, 1898)', 'recorded 1890s CE')
fld('a-kar', 'karenpeopleburm00marsgoog', 'Harry Ignatius Marshall, The Karen People of Burma: A Study in Anthropology and Ethnology (Columbus: Ohio State University, 1922; Bulletin, vol. 26, no. 13)',
    'A missionary-anthropologist’s study of the Karen of Burma: their history and the legend of the lost book, their spirits (the nats and the “la”, the soul), the rites of birth, marriage and death, and the Karen Christians and Buddhists.',
    'The Karen People of Burma (Harry I. Marshall, 1922)', 'recorded 1900s–1910s CE')
fld('a-shn', 'shansathomewitht00milnrich', 'Mrs. Leslie Milne, Shans at Home, with Two Chapters on Shan History and Literature by Rev. W. W. Cochrane (London: John Murray, 1910)',
    'A missionary doctor’s wife’s picture of the Shan of north-eastern Burma in 1890–1900s: their Buddhism and the monks, the spirits (phi) and the offerings to them, the rites of birth, marriage and death, and the Shan festivals.',
    'Shans at Home (Mrs. Leslie Milne, 1910)', 'recorded 1890s–1900s CE')
fld('a-rkh', 'landlamasnotesa00rockgoog', 'William Woodville Rockhill, The Land of the Lamas: Notes of a Journey through China, Mongolia, and Tibet (New York: Century, 1891)',
    'The American diplomat-explorer’s journey of 1888–89 through north-west China, Mongolia and Tibet: the Tibetan Buddhist monasteries (Kumbum and others), the lamas and their rule, the Tibetan faith and the old Bon beside it, and his sketch of the religion.',
    'The Land of the Lamas (William W. Rockhill, 1891)', 'recorded 1888–89 CE')
fld('a-oss', 'beastsmengods00osseiala', 'Ferdinand Ossendowski, Beasts, Men and Gods (New York: E. P. Dutton, 1922)',
    'The Polish scientist’s account of his flight across Siberia and Mongolia in 1920–21 during the Russian civil war: the Mongol lamas, the oracles and the “Living Buddha” of Urga, the shamans, and the legend of the “King of the World” and the underground kingdom. Its truth has been disputed since it came out (Sven Hedin and others questioned it); read it as the author’s own story.',
    'Beasts, Men and Gods (Ferdinand Ossendowski, 1922)', 'recorded 1920–21 CE')
fld('a-car', ['unknownmongolia00unkngoog', 'unknownmongoliar02carruoft'], 'Douglas Carruthers, Unknown Mongolia: A Record of Travel and Exploration in North-West Mongolia and Dzungaria, two volumes (London: Hutchinson, 1913)',
    'The British naturalist’s expedition of 1910–11 through the Altai, Tuva and western Mongolia: the Mongol, Oirat and Tuvan herders and their lamas and shamans, the oboo (cairns) and the sacred mountains, the monasteries and the old religion.',
    'Unknown Mongolia (Douglas Carruthers, 1913), two volumes', 'recorded 1910–11 CE', split=None)
fld('a-ken', 'tentlifeinsiberi00kenn', 'George Kennan, Tent Life in Siberia, and Adventures among the Koraks and Other Tribes in Kamtchatka and Northern Asia (New York: G. P. Putnam, 1870)',
    'The American explorer’s account of a winter among the Koryak, Kamchadal and Yakut of the Kamchatka coast in 1865–67 for the Russian-American telegraph: the shamans, the household idols, the offerings and the fear of spirits, and the Russian Orthodox church beside them.',
    'Tent Life in Siberia (George Kennan, 1870)', 'recorded 1865–67 CE', group='si')
fld('a-ste', ['narrativeoffivey01sted', 'narrativeoffivey02sted'], 'John Gabriel Stedman, Narrative of a Five Years’ Expedition against the Revolted Negroes of Surinam, 1772–1777, two volumes (London: J. Johnson, 1796; this printing 1806)',
    'A Dutch army officer’s narrative of the colony of Surinam: the slave plantations and their cruelty, the Maroons in the forest, and what he saw of the Africans’ religion (the spirits, the oracle and the sorcery called obia, the burials), written by a witness. An outsider’s view, from a man who also opposed slavery.',
    'Narrative of a Five Years’ Expedition against the Revolted Negroes of Surinam (J. G. Stedman, 1796), two volumes', 'recorded 1772–77 CE', split=None, long_s=True)


# ── repairs after the first build (16 November 2026) ──
for _i in ('a-trk', 'x-ojn'): fix(_i, split=None)           # a bibliography's entries and a book's sub-headings were taken for chapters
fix('a-clk', min_chars=600)                                  # contents lines in a mission book's chapter pattern
fix('x-rjb', cut_tail=r'^[^\n]*following pages contain advertisements')
fix('x-wil', cut_tail=r"^[^\n]*TR[UÜ]BNER\s*&\s*CO\.?'?S\s+LIST")
fix('a-wor', cut_tail=r'^[^\n]*THE MACMILLAN COMPANY 68 FIFTH')
