"""Specs for a fifteenth batch of open (pre-1931) English texts, on the maker's "yes, round 15" (and "don't be afraid to continue on your own. lets get as close as we can to covering all
the religions"), aimed at the holes the assessment of 16 November 2026 left: the Andes and the Inca (Cieza de Leon, Squier, Bingham, Bandelier, Joyce), the Mapuche and the peoples of
the Chaco (Smith, Molina, Dobrizhoffer, Grubb), the Amazon and the Guianas (Wallace, Spruce, Whiffen, Im Thurn, Brett), Mexico and the Pacific coast (Bancroft, Starr, Joyce), and the
African peoples with no field record yet: the Dinka and the pygmies (Schweinfurth, Lloyd), the Fang (Du Chaillu), Benin and the Cross River peoples (Roth, Talbot), the Banyoro and Banyankole
(Roscoe), the Kuba (Torday), the Chewa (Rattray), the Luo of Uganda (Hobley), the Oromo (Harris), the Berbers and Libyans (Westermarck, Bates) and the Mande (Park, Caillie). Merged into
texts_archive.SPECS; built with python3 build_texts.py --only=ids. Found 16 November 2026.

Left out: Macdonald's Africana (the scan found is only volume II), Westermarck's Ritual and Belief in Morocco volume I (both scans found are volume II: only that volume is here), Bates's
Naturalist on the River Amazons and Humboldt's Personal Narrative (little on religion for their length).
"""
from texts_round9 import S, SCH, REF
from texts_round10 import G, T, FIELD

SPECS = {}


def fld(i, idents, by, note, title, when, group='tb', **kw):
    if kw.get('split', 'auto') == 'auto': kw.setdefault('min_chars', 250)
    SPECS[i] = G(idents, by, note + ' ' + FIELD, lib=(title, group, when, 'fld', None), **{'split': 'auto', **kw})


fix = lambda i, **kw: SPECS[i].update(kw)

# ── The Andes and the Inca ──
fld('a-cie', ['travelsofpedrode33ciez', 'partofchronicleperu00ciez'], 'Pedro de Cieza de León, The Travels of Pedro de Cieza de León, A.D. 1532–50, from the first part of his Chronicle of Peru (translated by Clements R. Markham, London: Hakluyt Society, 1864), and The Second Part of the Chronicle of Peru (the Incas; Hakluyt Society, 1883)',
    'The soldier-chronicler’s account of Peru in the 1540s, from the peoples’ own mouths: the Andean provinces and their huacas (sacred places and shrines), the temples of the Sun, the oracles, the burial customs and the mummies, and, in the second part, the Inca kings and their religion and rule (two Hakluyt volumes, in Markham’s English).',
    'The Travels of Pedro de Cieza de León, 1532–50, and the Second Part of the Chronicle of Peru (Hakluyt Society, 1864 and 1883)', 'recorded 1540s CE', split=None)
fld('a-sqr', 'peruincidentsoft00squi', 'E. G. Squier, Peru: Incidents of Travel and Exploration in the Land of the Incas (New York: Harper, 1877)',
    'The American archaeologist’s journey through Peru and Bolivia in 1863–65: the ruins of Cuzco and Lake Titicaca, the temple of the Sun, Tiahuanaco, the huacas and the Indian customs and feasts that he saw alive in the 1860s.',
    'Peru: Incidents of Travel and Exploration in the Land of the Incas (E. G. Squier, 1877)', 'recorded 1863–65 CE')
fld('a-bin', 'incalandexplorat00bing', 'Hiram Bingham, Inca Land: Explorations in the Highlands of Peru (Boston: Houghton Mifflin, 1922)',
    'The Yale explorer’s account of his expeditions of 1909–15 to the Urubamba valley and the discovery of Machu Picchu: the Inca roads and the sacred valley, the ruins and the temples, the Indians’ present beliefs, and what the Spanish said of Inca religion.',
    'Inca Land: Explorations in the Highlands of Peru (Hiram Bingham, 1922)', 'recorded 1909–15 CE')
fld('a-bnd', 'islandsoftiticac00banduoft', 'Adolph F. Bandelier, The Islands of Titicaca and Koati (New York: Hispanic Society of America, 1910)',
    'The Swiss-American archaeologist’s study of the sacred islands of Lake Titicaca (the Sun and the Moon), in 1894–97: the Inca legends of the origin of the Sun on the island, the temples and the pilgrimages, the ruins and what the Spanish chroniclers recorded of the cult.',
    'The Islands of Titicaca and Koati (Adolph F. Bandelier, 1910)', 'recorded 1894–97 CE')
fld('a-jyc', 'southamericanarc00joycuoft', 'T. A. Joyce, South American Archaeology: An Introduction to the Archaeology of the South American Continent, with Special Reference to the Early History of Peru (London: Macmillan, 1912; the scan is the Medici Society printing)',
    'The British Museum keeper’s survey of the ancient peoples of South America: the Chavín, Nazca, Moche, Tiahuanaco and Inca civilizations of Peru, the Chibcha (Muisca) of Colombia and the peoples of the Amazon, Chile and Argentina, with their gods and burials as the objects and the chroniclers show them.',
    'South American Archaeology (T. A. Joyce, 1912)', 'recorded 1900s–1910s CE')
fld('a-smt', 'araucaniansnote00smitrich', 'Edmond Reuel Smith, The Araucanians; or, Notes of a Tour among the Indian Tribes of Southern Chili (New York: Harper, 1855)',
    'An American naval astronomer’s tour of Araucanía in the 1850s, one of the first English accounts of the Mapuche: their spirits, the machi (shamans), the war and the feasts, and the rites of burial.',
    'The Araucanians; or, Notes of a Tour among the Indian Tribes of Southern Chili (Edmond R. Smith, 1855)', 'recorded 1850s CE')
fld('a-mol', ['geographicalnatu01moliiala', 'geographicalnatu02moliiala'], 'Giovanni Ignazio Molina, The Geographical, Natural, and Civil History of Chili, translated from the Italian, two volumes (London: Longman, Hurst, Rees, and Orme, 1809)',
    'A Chilean Jesuit’s history of Chile (1782), the main early source for the Mapuche: their gods and spirits, the priests and machi, the sacrifices, funerals and ancestors, and the language and customs of the Araucanians, with an appendix on Chiloé.',
    'The Geographical, Natural, and Civil History of Chili (Giovanni I. Molina, 1809), two volumes', 'recorded 1760s–70s CE', split=None, long_s=True)

# ── The Chaco, the Amazon and the Guianas ──
fld('a-grb', 'unknownpeopleinu00grubuoft', 'W. Barbrooke Grubb, An Unknown People in an Unknown Land: An Account of the Life and Customs of the Lengua Indians of the Paraguayan Chaco (London: Seeley, 1911)',
    'A missionary’s record of the Lengua (Enxet) of the Chaco in 1889–1910: their spirits and the great spirit, the dead and the ghosts, the shamans (the “sorcerers”) and the feasts and dances, the rites of birth and death, with their stories.',
    'An Unknown People in an Unknown Land (W. Barbrooke Grubb, 1911)', 'recorded 1889–1910 CE')
fld('a-dob', ['accountofabipone18221dobr', 'accountofabipone18222dobr', 'accountofabipone03dobr'], 'Martin Dobrizhoffer, An Account of the Abipones, an Equestrian People of Paraguay, from the Latin, three volumes (London: John Murray, 1822)',
    'A Jesuit’s account (written in Latin in 1784) of his eighteen years among the Abipones of the Gran Chaco: their warriors and the shamans (the “jugglers”), their spirits and the Grandfather of the Abipones (the Pleiades), the funerals and the mourning, and the Jesuit missions (three volumes).',
    'An Account of the Abipones (Martin Dobrizhoffer, 1822), three volumes', 'recorded 1749–67 CE', split=None, long_s=True)
fld('a-whf', 'northwestamazon00whifgoog', 'Thomas Whiffen, The North-West Amazons: Notes of Some Months Spent among Cannibal Tribes (London: Constable, 1915)',
    'A British officer’s journey of 1908–09 to the Putumayo and Caquetá rivers, with the Boras, Witotos, Miranhas and other peoples: their spirits and dances, the shamans, the funerals and the cannibal tales, and the atrocities of the rubber trade.',
    'The North-West Amazons (Thomas Whiffen, 1915)', 'recorded 1908–09 CE')
fld('a-wal', 'narrativeoftrave00walluoft', 'Alfred Russel Wallace, A Narrative of Travels on the Amazon and Rio Negro, with an Account of the Native Tribes, and Observations on the Climate, Geology, and Natural History of the Amazon Valley (London: Ward, Lock, 1889; first edition 1853)',
    'The naturalist’s journey of 1848–52 on the Amazon, the Rio Negro and the Uaupés: the Indians’ dances and masked feasts, their medicine-men and spirits, their burial customs, and a chapter on the tribes with their languages and habits.',
    'A Narrative of Travels on the Amazon and Rio Negro (Alfred R. Wallace, 1853; 1889 edition)', 'recorded 1848–52 CE')
fld('a-spr', ['notesofbotanisto11908spru', 'notesofbotanisto00spruuoft'], 'Richard Spruce, Notes of a Botanist on the Amazon and Andes, being Records of Travel on the Amazon and its Tributaries, the Trombetas, Rio Negro, Uaupés, Casiquiari, Pacimoni, Huallaga and Pastasa, edited by Alfred Russel Wallace, two volumes (London: Macmillan, 1908)',
    'The botanist’s notes from fifteen years in South America (1849–64): the Uaupés and Rio Negro Indians’ feasts, the drink made from the caapi vine (ayahuasca) and the masked dances, the Jurupari rite, and the Andean Quichua and the coca, with plant lore throughout (two volumes).',
    'Notes of a Botanist on the Amazon and Andes (Richard Spruce, 1908), two volumes', 'recorded 1849–64 CE', split=None)
fld('a-imt', 'amongindiansgui00thurgoog', 'Everard F. im Thurn, Among the Indians of Guiana: Being Sketches, Chiefly Anthropologic, from the Interior of British Guiana (London: Kegan Paul, Trench, 1883)',
    'The British Guiana colonial official’s sketches of the Arawak, Carib, Warrau and Macusi: the spirits (the Kenaima, the demons of the forest) and the piai-man, the dances and the dead, charms and omens, and the rites of birth and puberty.',
    'Among the Indians of Guiana (Everard F. im Thurn, 1883)', 'recorded 1877–83 CE')
fld('a-brt', 'indiantribesofgu00bret', 'W. H. Brett, The Indian Tribes of Guiana: Their Condition and Habits, with Researches into their Past History, Superstitions, Legends, Antiquities, Languages, etc. (London: Bell and Daldy, 1868)',
    'An Anglican missionary’s record of the Indians of Guiana in 1840–60: the Arawak, Warrau, Carib and Akawai, their spirits and the piai (sorcerer-priest), the legends of the flood and the first people, and the old burial and the mission.',
    'The Indian Tribes of Guiana (W. H. Brett, 1868)', 'recorded 1840–60 CE')

# ── Mexico, Central America and the Pacific coast ──
fld('a-bn1', 'nativeraces01bancrich', 'Hubert Howe Bancroft, The Native Races of the Pacific States of North America, volume I: Wild Tribes (New York: D. Appleton, 1874)',
    'Volume I of Bancroft’s survey: the peoples of Alaska and the north-west coast, the Californians, the New Mexicans (the Pueblo, Apache and Navajo) and the tribes of northern Mexico, with chapters on the religion, the shamans and the ceremonies of each, from the earlier writers.',
    'The Native Races of the Pacific States, volume I: Wild Tribes (H. H. Bancroft, 1874)', 'recorded 1500s–1870s CE', split=None)
fld('a-bn2', 'nativeracespaci02bancgoog', 'Hubert Howe Bancroft, The Native Races of the Pacific States of North America, volume II: Civilized Nations (New York: D. Appleton, 1875)',
    'Volume II of Bancroft’s survey: the Nahua peoples (the Aztec, Toltec and the Tlaxcalans) and the Maya, Mixtec, Zapotec and other civilized nations of Mexico and Central America, with the gods, the priesthoods, the temples and the sacrifices, the calendar and the festivals.',
    'The Native Races of the Pacific States, volume II: Civilized Nations (H. H. Bancroft, 1875)', 'recorded 1500s–1870s CE', split=None)
fld('a-str', 'notesuponethnog01sciegoog', 'Frederick Starr, Notes upon the Ethnography of Southern Mexico (Davenport, Iowa: Davenport Academy of Natural Sciences, 1900; Proceedings, vol. 8)',
    'A University of Chicago anthropologist’s notes from his journeys among the Indians of Oaxaca and Chiapas in 1895–98: the Zapotec, Mixe, Mixtec and others, their village customs and beliefs, the survival of the old gods under the Catholic saints, and the rites of birth, marriage and death.',
    'Notes upon the Ethnography of Southern Mexico (Frederick Starr, 1900)', 'recorded 1895–98 CE')
fld('a-jy2', 'cu31924097644037', 'T. A. Joyce, Central American and West Indian Archaeology: Being an Introduction to the Archaeology of the States of Nicaragua, Costa Rica, Panama and Southern Mexico (London: Philip Lee Warner, 1916)',
    'The British Museum keeper’s survey of the ancient peoples of Central America and the Caribbean, including the Taíno of Hispaniola, Cuba and Puerto Rico: their zemis (spirit images), the ball game and the cohoba rite, the Costa Rican, Panamanian and Nicaraguan goldwork and stone, with Columbus and Pané’s record of the Taíno gods.',
    'Central American and West Indian Archaeology (T. A. Joyce, 1916)', 'recorded 1900s–1910s CE')

# ── Africa ──
fld('a-swf', ['heartofafricathr01schw', 'heartofafricathr02schw'], 'Georg Schweinfurth, The Heart of Africa: Three Years’ Travels and Adventures in the Unexplored Regions of Central Africa from 1868 to 1871, translated by Ellen E. Frewer, two volumes (London: Sampson Low, 1873)',
    'The Baltic-German botanist’s journey through the Dinka, Bongo, Niam-niam (Azande) and Monbuttu countries and to the Akka pygmies, a pioneering ethnography: the Dinka’s cattle and their spirits and the diviners, the Bongo, the burials and the sacrifices, the king and the war of the Monbuttu, and his meeting with the Akka (two volumes).',
    'The Heart of Africa (Georg Schweinfurth, 1873), two volumes', 'recorded 1868–71 CE', split=None)
fld('a-duc', 'explorationsadv00duch', 'Paul B. Du Chaillu, Explorations and Adventures in Equatorial Africa, with Accounts of the Manners and Customs of the People, and of the Chase of the Gorilla, the Crocodile, Leopard, Elephant, Hippopotamus, and other Animals (New York: Harper, 1861)',
    'The first European’s record of the Fang (Pahouin), Bakalai, Apingi and other peoples of Gabon in 1856–59: the spirits and the charm-doctors and the witch ordeals, the ancestor skulls and the sacrifice, the idols and the burial of chiefs, and the stories of the gorilla and the forest.',
    'Explorations and Adventures in Equatorial Africa (Paul B. Du Chaillu, 1861)', 'recorded 1856–59 CE')
fld('a-gbn', 'greatbeninitscus00roth', 'Henry Ling Roth, Great Benin: Its Customs, Art and Horrors (Halifax: F. King, 1903)',
    'The first English account of the kingdom of Benin after the British expedition of 1897: the Oba (king) and his court, the human sacrifices and the rites at the royal altars, the priests and the ancestor worship, the bronze plaques and the early European visitors, from the officers’ and merchants’ records.',
    'Great Benin: Its Customs, Art and Horrors (Henry Ling Roth, 1903)', 'recorded 1890s CE')
fld('a-tsb', 'inshadowofbush00perc', 'P. Amaury Talbot, In the Shadow of the Bush (London: William Heinemann, 1912)',
    'A district officer’s account of the Ekoi and Ibibio of south-eastern Nigeria in 1905–10: the spirits and the juju, the Egbo (Ekpe) society, twin birth, the Nsibidi writing, ordeals and the tale of the leopard-people, the rites of birth and death, and many Ekoi stories.',
    'In the Shadow of the Bush (P. Amaury Talbot, 1912)', 'recorded 1905–10 CE')
fld('a-rbk', 'bakitaraorbanyor0000rosc', 'John Roscoe, The Bakitara or Banyoro: The First Part of the Report of the Mackie Ethnological Expedition to Central Africa (Cambridge: University Press, 1923)',
    'The missionary-ethnographer’s report on the Banyoro (Bakitara) of Bunyoro: the king and the ritual of the kingship, the Cwezi gods and their mediums (the Kubandwa cult) and the sacred drum, the diviners and the rites of birth and death, from his years in Uganda.',
    'The Bakitara or Banyoro (John Roscoe, 1923)', 'recorded 1900s–1920s CE')
fld('a-rby', 'banyankolesecond0000rosc', 'John Roscoe, The Banyankole: The Second Part of the Report of the Mackie Ethnological Expedition to Central Africa (Cambridge: University Press, 1923)',
    'The companion report on the Banyankole of Ankole: the cattle clans and the herdsmen, the Cwezi gods and the mediums (Kubandwa), the ritual of the kings and their burial, the diviners and the rites of birth and death.',
    'The Banyankole (John Roscoe, 1923)', 'recorded 1900s–1920s CE')
fld('a-rsc', 'soulofcentralafr00rosc', 'John Roscoe, The Soul of Central Africa: A General Account of the Mackie Ethnological Expedition (London: Cassell, 1922)',
    'The general account of the 1919–20 Mackie Ethnological Expedition through Uganda, Kenya and the lake peoples (the Baganda, Banyoro, Basoga, Bagishu, Bakene and others): their spirits and gods and priests, the kings, taboo and sacrifices, the ritual and the crafts.',
    'The Soul of Central Africa (John Roscoe, 1922)', 'recorded 1919–20 CE')
fld('a-tbs', 'bwb_S0-CHH-308', 'Emil Torday, On the Trail of the Bushongo (London: Seeley, Service, 1925)',
    'The Hungarian ethnographer’s account of his Congo expedition of 1907–09 among the Kuba (Bushongo): the king Kot a-Mbweky and the royal ritual, the culture hero and the first ancestors, the sacred bronze and the secret societies, with his meeting with the Bakuba and their neighbours.',
    'On the Trail of the Bushongo (Emil Torday, 1925)', 'recorded 1907–09 CE')
fld('a-rch', 'somefolklorestor00ratt_0', 'R. S. Rattray, Some Folk-Lore Stories and Songs in Chinyanja, with English Translations (London: Society for Promoting Christian Knowledge, 1907)',
    'A collection of the stories and songs of the Chewa (Nyanja) of Nyasaland, in the language and in English: the tales of the hare and the hyena, the spirits (the mizimu) and the chief, and the songs of the dance, with notes on the beliefs behind them.',
    'Some Folk-Lore Stories and Songs in Chinyanja (R. S. Rattray, 1907)', 'recorded 1900s CE')
fld('a-hbe', 'easternugandaan00hoblgoog', 'C. W. Hobley, Eastern Uganda: An Ethnological Survey (London: Anthropological Institute, 1902; Occasional Papers no. 1)',
    'A British officer’s survey of the peoples of the Mount Elgon district and the east of Lake Victoria, the Bantu Kavirondo and the Nilotic Luo, Nandi and others: their gods and the ancestor spirits, the sacrifices and the medicine men, and the rites of circumcision, marriage and death.',
    'Eastern Uganda: An Ethnological Survey (C. W. Hobley, 1902)', 'recorded 1890s CE')
fld('a-lld', 'dwarflandcannibal00lloy', 'Albert B. Lloyd, In Dwarf Land and Cannibal Country: A Record of Travel and Discovery in Central Africa (London: T. Fisher Unwin, 1899)',
    'A missionary’s journey of 1895–98 from Uganda across the Ituri forest to the Congo: the Batwa and Mbuti pygmies and their forest spirits and hunts, the Lendu and the Bakonjo, and the missionary’s own account of the Baganda church.',
    'In Dwarf Land and Cannibal Country (Albert B. Lloyd, 1899)', 'recorded 1895–98 CE')
fld('a-hrs', ['highlandsthiopi01harrgoog', 'highlandsofthi02harriala', 'highlandsofthiop31844harr'], 'William Cornwallis Harris, The Highlands of Æthiopia, three volumes (London: Longman, Brown, Green, and Longmans, 1844)',
    'The British envoy’s mission to the court of Shoa in 1841–43: the Ethiopian Church (the monks and the saints’ days and fasts), the Oromo (Galla) peoples and their customs and gods, the Muslim and the pagan peoples of the south, the king’s court and the slave trade (three volumes).',
    'The Highlands of Æthiopia (William C. Harris, 1844), three volumes', 'recorded 1841–43 CE', split=None, long_s=True)
fld('a-wmk', 'RitualAndBeliefInMorocco', 'Edward Westermarck, Ritual and Belief in Morocco, volume II (London: Macmillan, 1926)',
    'Volume II of the great study of Moroccan Arab and Berber religion and magic: magical influences and omens and dreams, the dead, the evil eye, the rites of the year (the Great Feast and the fire and water rites), the saints and their tombs, the mediums and the festivals, and the Berber and Arab ritual in marriage and in the field. Volume I (baraka and the jnun) is not among the scans found.',
    'Ritual and Belief in Morocco (Edward Westermarck, 1926), volume II', 'recorded 1898–1925 CE')
fld('a-bts', 'easternlibyanses00bate', 'Oric Bates, The Eastern Libyans: An Essay (London: Macmillan, 1914)',
    'The Harvard archaeologist’s study of the ancient Libyan (Berber) peoples of Cyrenaica and Marmarica and western Egypt, from the Egyptian, Greek and Roman records and the monuments: their gods (Ammon and Neith), their burial and tattooing, their customs and religion, and the “Libyan” gods that Egypt took.',
    'The Eastern Libyans (Oric Bates, 1914)', 'recorded 1910–12 CE')
fld('a-prk', 'travelsininterio01park', 'Mungo Park, Travels in the Interior Districts of Africa, performed in the years 1795, 1796 and 1797, volume I of the 1816 edition (London: John Murray, 1816)',
    'The Scottish surgeon’s journey to the Niger in 1795–97, with the Mande, Bambara and Fula (Fulbe) peoples: the Muslim Mandingos and their charms (saphies), the pagan Bambara and their ceremonies, the masked “Mumbo Jumbo” of the villages, and the hospitality and the burial customs, a classic of the time.',
    'Travels in the Interior Districts of Africa (Mungo Park, 1795–97; 1816 edition), volume I', 'recorded 1795–97 CE', split=None)
fld('a-cll', ['travelsthroughc00cailgoog', 'travelsthroughc01cailgoog'], 'René Caillié, Travels through Central Africa to Timbuctoo, and across the Great Desert to Morocco, performed in the years 1824–1828, two volumes (London: Henry Colburn and Richard Bentley, 1830)',
    'The French explorer’s journey disguised as a Muslim from Sierra Leone through the Mande and Bambara country and Jenne to Timbuktu and across the Sahara to Morocco: the Muslim and pagan peoples, the charms and the markets, the festivals and burial customs, a witness of the Songhai and Mande lands (two volumes).',
    'Travels through Central Africa to Timbuctoo (René Caillié, 1830), two volumes', 'recorded 1824–28 CE', split=None)

# ── repairs expected from the splitter (found in earlier rounds) ──
for _i in ('a-wal', 'a-whf', 'a-str', 'a-bnd'): fix(_i, split=None)
fix('a-sqr', split=None)
fix('a-smt', cut_tail=r'^[^\n]*14 DAY USE')
fix('a-bn1', cut_tail=r'^[^\n]*RETURN TO the circulation')
for _i in ('a-hbe', 'a-rch'): fix(_i, split=None)
for _i in ('a-rby', 'a-grb'): fix(_i, min_chars=600)                       # contents lines in a chapter pattern
