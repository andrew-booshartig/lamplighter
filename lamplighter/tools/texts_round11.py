"""Specs for an eleventh batch of open (pre-1931) English texts, begun on the maker's words "feel free to keep collecting. dont leave out the canaanites either": the sources for the
religion of Canaan, Phoenicia and Carthage (Cooke's collection of the Phoenician, Moabite and Aramaic inscriptions with English translations, Petrie's translations of the Canaanite kings'
letters to Pharaoh, Rawlinson's History of Phoenicia, Macalister's Gezer and Philistines, Stanley Cook's Religion of Ancient Palestine, Barton on Semitic origins and archaeology, the
Marseilles and Carthage sacrifice tablets, Luckenbill's Assyrian royal inscriptions, Jeremias, Garstang on the Hittites), and, for the Path's empty station "Arabia before Muhammad", the
pre-Islamic poetry and the books on the religion of early Arabia (Lyall's translations, Clouston, Nicholson's Literary History of the Arabs, Robertson Smith's Kinship and Marriage, Zwemer,
Doughty). Merged into texts_archive.SPECS; built with python3 build_texts.py --only=ids. Sources were found on 16 November 2026.

NOT here, and why: the Ugaritic tablets themselves (the Baal Cycle, Kirta, Aqhat, the Rapi'uma texts). They were found at Ras Shamra in 1929 and first published in French in 1929–31; every
English translation of them is later than 1930 and in copyright, so the Library's x-bal entry stays a catalogue entry until a public-domain translation exists. The Library says so.
"""
from texts_round9 import S, SCH, REF
from texts_round10 import G, T, FIELD

SPECS = {}


def me(title, when, station):
    return (title, 'me', when, 'mes', station)


SPECS['x-cns'] = G('textbookofnorths00cookuoft', 'George A. Cooke, A Text-Book of North-Semitic Inscriptions: Moabite, Hebrew, Phoenician, Aramaic, Nabataean, Palmyrene, Jewish (Oxford: Clarendon Press, 1903)',
                   'The standard collection of the ancient inscriptions of Canaan and its neighbours, with English translations and notes (the Hebrew and Phoenician letters of the scan are left out): the Moabite Stone of King Mesha, the Siloam tunnel, the Phoenician royal inscriptions of Tyre, Sidon and Byblos (Eshmunazar, Tabnit, Yehawmilk), the Marseilles sacrificial tariff, the Carthaginian dedications to Baal Hammon and Tanit, Aramaic texts, and the Nabataean and Palmyrene inscriptions to Dushara, Allat and Bel. Most of what is known of the religion of the Phoenicians and Carthaginians in their own words is here. ' + SCH,
                   lib=me('A Text-Book of North-Semitic Inscriptions (G. A. Cooke, 1903): the Moabite Stone, the Phoenician and Punic inscriptions, Aramaic, Nabataean and Palmyrene', 'c. 840 BCE – 3rd c. CE', 'Ugarit: the Baal Cycle'), strip_hebrew=True, split='auto')
SPECS['x-syg'] = G('syriaandegyptfr00petrgoog', 'W. M. Flinders Petrie, Syria and Egypt from the Tell el Amarna Letters (London: Methuen, 1898)',
                   'Petrie’s English versions of the clay-tablet letters that the kings of the Canaanite cities (Jerusalem, Byblos, Tyre, Sidon, Gezer, Lachish, Megiddo) sent to the Pharaohs Amenhotep III and Akhenaten in the 14th century BCE, with his commentary: the gods the kings swear by, the “Habiru”, the quarrels of the cities. An older translation; the Library has no later one. ' + SCH,
                   lib=me('Syria and Egypt from the Tell el Amarna Letters (W. M. F. Petrie, 1898): the Canaanite kings’ letters to Pharaoh', 'c. 1360–1335 BCE', 'Akhenaten and the Aten'), split='auto')
SPECS['x-lar'] = G(['in.ernet.dli.2015.532619', 'in.ernet.dli.2015.532630'], 'Daniel David Luckenbill, Ancient Records of Assyria and Babylonia, two volumes (Chicago: University of Chicago Press, 1926–27)',
                   'The English translation of the royal inscriptions of Assyria, volume I from the earliest kings to Sargon, volume II from Sargon to the end of the empire: the campaigns against Damascus, Israel, Judah, Tyre, Sidon, Arvad and the Philistine cities, the tribute of Phoenician kings, the carrying off of gods, and the kings’ own account of their devotion to Ashur. ' + SCH,
                   lib=me('Ancient Records of Assyria and Babylonia (D. D. Luckenbill, 1926–27), two volumes', 'c. 1100–627 BCE', 'The prophets of the 8th century'), split=None)
SPECS['x-aap'] = G('in.ernet.dli.2015.50391', 'Translations of Ancient Arabian Poetry, chiefly pre-Islamic, with an introduction and notes, by Sir Charles James Lyall (London: Williams & Norgate, 1930 reprint of the 1885 edition)',
                   'The poems of the Arabs of the “days of ignorance” before Islam, in verse and prose English, with Lyall’s introduction on the poetry and the poets and his notes: the tribal world, the desert, war, love and wine, fate and the dead, and the old gods and sacred stones, by the editor of the Mufaddaliyat. ' + SCH,
                   lib=('Translations of Ancient Arabian Poetry (Sir Charles Lyall, 1885)', 'is', 'c. 500–620 CE', 'isl', 'Arabia before Muhammad'), split='auto')
SPECS['x-clo'] = G('arabianpoetryfo00clougoog', 'W. A. Clouston, Arabian Poetry for English Readers (Glasgow: privately printed, 1881)',
                   'A selection of Arabian poems of the heathen and early Muslim period, with Clouston’s introduction on the poets and their world: the desert, the tribes, the war and love poems, and the old pagan ideas. ' + SCH,
                   lib=('Arabian Poetry for English Readers (W. A. Clouston, 1881)', 'is', 'c. 500–750 CE', 'isl', 'Arabia before Muhammad'), split='auto')

# ── Books about the religion of Canaan, Phoenicia, Philistia, Hatti and early Arabia (shelf-only Scholarship) ──
SPECS['x-phr'] = G('historyofphoenic00rawl', 'George Rawlinson, History of Phoenicia (London: Longmans, Green, 1889)',
                   'The Oxford historian’s account of the Phoenicians: their cities and colonies, trade and ships, their art and writing, and the religion of Baal, Astarte, Melkart and Moloch, with the classical and Assyrian sources. ' + SCH,
                   lib=S('History of Phoenicia (George Rawlinson, 1889)', '1889 CE'), split='auto')
SPECS['x-gez'] = G(['cu31924084684038', 'cu31924084684046'], 'R. A. Stewart Macalister, The Excavation of Gezer, 1902–1905 and 1907–1909, volumes I and II (London: John Murray, for the Palestine Exploration Fund, 1912; the plates and drawings are not in the text)',
                   'The full report of the excavation of the Canaanite and Israelite city of Gezer: the High Place with its row of standing stones, the foundation deposits and the burials of infants in jars, the cave-dwellers, the temples and the cult objects (figurines of Astarte, scarabs, amulets), with the finds and inscriptions. ' + SCH,
                   lib=S('The Excavation of Gezer (R. A. S. Macalister, 1912), volumes I and II: the Canaanite High Place and its offerings', '1912 CE'), split=None)
SPECS['x-phi'] = G('philistinestheir00macauoft', 'R. A. Stewart Macalister, The Philistines: Their History and Civilization (The Schweich Lectures, 1911; London: Oxford University Press, for the British Academy, 1914)',
                   'Lectures on the Philistines: where they came from, their five cities, their language and their religion (Dagon, Ashtoreth, Baal-zebub), and what the Bible and the excavations say about them. ' + SCH,
                   lib=S('The Philistines: Their History and Civilization (R. A. S. Macalister, 1914)', '1911 CE'), split='auto')
SPECS['x-cap'] = G('religionofancien00cookuoft', 'Stanley A. Cook, The Religion of Ancient Palestine in the Second Millennium B.C., in the Light of Archaeology and the Inscriptions (London: Archibald Constable, 1908; the series Religions: Ancient and Modern)',
                   'Cook’s study of the religion of Canaan in the age before Israel, from the excavations (Gezer, Taanach, Megiddo), the Amarna letters and the Egyptian and Babylonian records: the gods of the cities, the high places and standing stones, the sacrifices of children, the dead and the temples. ' + SCH,
                   lib=S('The Religion of Ancient Palestine in the Second Millennium B.C. (Stanley A. Cook, 1908)', 'c. 2000–1200 BCE (pub. 1908)'), split='auto')
SPECS['x-aab'] = G('archaeologybible00bartuoft', 'George A. Barton, Archaeology and the Bible (Philadelphia: American Sunday-School Union, 1916)',
                   'A survey of what the excavations and inscriptions of Egypt, Babylonia, Assyria, Canaan and Asia Minor say about the Bible: the Canaanite cities, the Amarna letters, the Moabite Stone, Assyrian records of Israel and Judah. ' + SCH,
                   lib=S('Archaeology and the Bible (George A. Barton, 1916)', '1916 CE'), split='auto')
SPECS['x-sso'] = G('sketchofsemitico00bartiala', 'George A. Barton, A Sketch of Semitic Origins, Social and Religious (New York: Macmillan, 1902)',
                   'Barton’s study of the Semitic peoples’ early home, family and religion: the Semitic gods of the Arabs, Babylonians, Canaanites and Hebrews, the Great Mother (Ishtar, Ashtart, Atar), sacrifice, and the growth of Hebrew monotheism. ' + SCH,
                   lib=S('A Sketch of Semitic Origins, Social and Religious (George A. Barton, 1902)', '1902 CE'), split='auto')
SPECS['x-mst'] = G('massiliacarthago00macdrich', 'James Middleton MacDonald, The Massilia-Carthago Sacrifice Tablets of the Worship of Baal, reproduced in facsimile, edited, translated and commented on (1897)',
                   'The two Phoenician tablets of sacrifice, the Marseilles tariff and a related Carthaginian tablet, which list the animals, birds and cakes to be offered at the temple of Baal and the priests’ dues: the fullest Phoenician text of the ritual of sacrifice. In the English of an 1890s editor. ' + SCH,
                   lib=S('The Massilia-Carthago Sacrifice Tablets of the Worship of Baal (J. M. MacDonald, 1897)', '1897 CE'), split=None)
SPECS['x-jot'] = G(['biblicalarchaeol01jereuoft', 'oldtestamentinli2jere'], 'Alfred Jeremias, The Old Testament in the Light of the Ancient East: Manual of Biblical Archaeology, translated by C. L. Beaumont, two volumes (London: Williams & Norgate, and New York: G. P. Putnam’s Sons, 1911)',
                   'A German Assyriologist’s reading of the Old Testament against the Babylonian, Canaanite and Egyptian background: creation and the flood, the patriarchs, the Exodus, the kings and the prophets, with the “astral” theory that Babylonian star-lore underlies them. The theory has not been accepted. ' + SCH,
                   lib=S('The Old Testament in the Light of the Ancient East (Alfred Jeremias, 1911), two volumes', '1906 CE (trans. 1911)'), split=None)
SPECS['x-hte'] = G('in.ernet.dli.2015.277106', 'John Garstang, The Hittite Empire: being a Survey of the History, Geography and Monuments of Hittite Asia Minor and Syria (London: Constable, 1929)',
                   'The Liverpool archaeologist’s survey of the Hittites of Anatolia and northern Syria, neighbours and rivals of Egypt and of the Canaanite cities: their history, their gods and rock-sanctuaries (Yazilikaya), and their monuments, before the Hittite archives had been fully read. ' + SCH,
                   lib=S('The Hittite Empire (John Garstang, 1929)', '1929 CE'), split='auto')
SPECS['x-kma'] = G('kinshipandmarria00smituoft', 'W. Robertson Smith, Kinship and Marriage in Early Arabia (Cambridge: University Press, new edition by Stanley A. Cook, 1903)',
                   'Robertson Smith’s early study of the tribes of pre-Islamic Arabia: the totem clans, marriage by capture and by purchase, the rule of descent through the mother, and the sacred animals and holy places, which he used to read the religion of the Semites. ' + SCH,
                   lib=S('Kinship and Marriage in Early Arabia (W. Robertson Smith, 1885; ed. Cook, 1903)', '1885 CE'), split='auto')
SPECS['x-zca'] = G('arabiacradleofis00zwem', 'Samuel M. Zwemer, Arabia: The Cradle of Islam: Studies in the Geography, People and Politics of the Peninsula, with an Account of Islam and Mission-Work (New York: Fleming H. Revell, 1900)',
                   'A missionary’s account of Arabia: the land and its tribes, the Arabs before Islam and their idols, the rise of Islam and the Wahhabis, the religion of the Bedouin and the towns, and the missions. ' + SCH,
                   lib=S('Arabia: The Cradle of Islam (S. M. Zwemer, 1900)', '1900 CE'), split='auto')
SPECS['x-nlh'] = G('cu31924083936561', 'Reynold A. Nicholson, A Literary History of the Arabs (London: T. Fisher Unwin, 1907)',
                   'A history of Arabic literature and of the Arabs before and after Muhammad, the standard English one of its time: the “heathen Arabs” and their gods, the pre-Islamic poets and their odes, the Qur’an, the Umayyad and Abbasid courts, and the Sufis. ' + SCH,
                   lib=S('A Literary History of the Arabs (R. A. Nicholson, 1907)', '1907 CE'), split='auto')
SPECS['a-ada'] = G(['travelsinarabiad01doug', 'travelsinarabiad02douguoft'], 'Charles M. Doughty, Travels in Arabia Deserta, two volumes (Cambridge: University Press, 1921 edition; first published 1888)',
                   'The classic account of a journey among the Bedouin of Arabia in 1876–78: the tribes, the desert camp and the towns, the stones and graves of the older, pre-Islamic peoples (Mada’in Salih), and the religion and customs of the Arabs of his day, as seen by a Christian traveller who lived disguised as a Syrian doctor. ' + FIELD,
                   lib=T('Travels in Arabia Deserta (Charles M. Doughty, 1888; 1921 edition), two volumes', 'recorded 1876–78 CE'), split=None)

# books whose chapter or poem headings the generic splitter cannot tell from contents lines and footnotes are cut into parts of about 26,000 letters
for _id in ('x-aap', 'x-clo', 'x-kma'):
    SPECS[_id]['split'] = None
