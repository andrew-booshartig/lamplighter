"""Specs for an eighteenth batch of open (pre-1931) English texts (17 November 2026), continuing the maker's "get as close as we can to covering all the religions": the religions of China and
Korea (Lindley and Meadows on the Taiping and their God-worshipping religion, de Groot's Sectarianism and Religious Persecution in China, McKenzie and Griffis on Korea), the Pacific
(Malinowski's Argonauts, Guppy's Solomon Islands, Christie's Subanuns), the missionaries and explorers of southern, central and eastern Africa (Livingstone, Moffat, Arbousset and Daumas,
Grout, Shooter, Galton, Andersson, Krapf, Cameron, Bent), Holmes's Creative Mind (Religious Science) and Kidder's Southwestern Archaeology. Merged into texts_archive.SPECS; built with
python3 build_texts.py --only=ids.

Left out: Crowley's Magick in Theory and Practice (the one scan is lending-only), the Equinox (the scan found is a modern typeset reprint), Hamberg's Visions of Hung-Siu-tshuen, Best's Tuhoe,
Ivens, Landtman and Woodford (no scan found).
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


# ── China and Korea ──
sch('x-tpg', ['tipingtienkwohhi01lind', 'tipingtienkwohhi02lind'], 'Augustus F. Lindley, Ti-ping Tien-kwoh: The History of the Ti-ping Revolution, including a Narrative of the Author’s Personal Adventures, two volumes (London: Day and Son, 1866)',
    'The English officer who served the Taiping in 1860–64: the origin of the movement in the visions of Hong Xiuquan and the God-Worshipping Society (Bai Shangdi Hui), the Taiping Christian creed, the Heavenly King and his claim to be Jesus’s younger brother, their worship and their ten commandments, and the war and the fall of Nanjing, from a witness on the Taiping side (two volumes). A partisan account.',
    'Ti-ping Tien-kwoh: The History of the Ti-ping Revolution (Augustus F. Lindley, 1866), two volumes', '1850–64 CE (pub. 1866)', split=None)
sch('x-mdw', 'chineseandtheir02meadgoog', 'Thomas Taylor Meadows, The Chinese and their Rebellions, viewed in Connection with their National Philosophy, Ethics, Legislation, and Administration (London: Smith, Elder, 1856)',
    'The British consular interpreter’s book on Chinese thought and the government, with the first sober English account of the Taiping: Chinese religion and the state ethic of Heaven (“the doctrine of Heaven”), the Confucian and Buddhist and Taoist background, and the early Taiping religion and its Christian elements, written in 1851–56.',
    'The Chinese and their Rebellions (Thomas Taylor Meadows, 1856)', '1851–56 CE', split=None)
sch('x-dgs', ['sectarianismreli01groo', 'sectarianismreli02groo'], 'J. J. M. de Groot, Sectarianism and Religious Persecution in China: A Page in the History of Religions, two volumes (Amsterdam: Johannes Müller, 1903–04)',
    'The Leiden sinologist’s history of the popular sects of China and their persecution by the state: the White Lotus and its offshoots, the sects of the Maitreya, the Wu-wei and Xiantian teachings and the secret societies, with the edicts that proscribed them and the sects’ own scriptures, from the Chinese official sources (two volumes).',
    'Sectarianism and Religious Persecution in China (J. J. M. de Groot, 1903–04), two volumes', '1903–04 CE', split=None)
sch('x-mck', 'tragedyofkorea00mckeuoft', 'F. A. McKenzie, The Tragedy of Korea (London: Hodder and Stoughton, 1908)',
    'The correspondent’s account of Korea under Japanese pressure in 1904–08: the Righteous Armies and the people’s resistance, the Tonghak (Eastern Learning) rising of 1894 and the sects, the old religions and the missions, and the Korean Christians. A reporter’s book of its day.',
    'The Tragedy of Korea (F. A. McKenzie, 1908)', '1894–1908 CE', split=None)
sch('x-grf', 'coreahermitnatio00grifuoft', 'William Elliot Griffis, Corea, the Hermit Nation (New York: Charles Scribner’s Sons, 1882; the fifth edition of 1894)',
    'The American scholar’s history of Korea, with the old religion and the customs of the people: the Korean spirits and the shamans, Buddhism and Confucianism and the Tangun and Kija legends, the festivals, and the history from the earliest times to the opening of the country in the 1880s.',
    'Corea, the Hermit Nation (William E. Griffis, 1882; 1894 edition)', '1882–94 CE', split=None)

# ── The Pacific ──
fld('a-mln', 'argonautsofweste00mali', 'Bronisław Malinowski, Argonauts of the Western Pacific: An Account of Native Enterprise and Adventure in the Archipelagoes of Melanesian New Guinea (London: Routledge, 1922)',
    'The classic fieldwork monograph on the Kula exchange of the Trobriand Islands, from his two years there in 1915–18: the magic of the canoe and of the Kula, the spells, the sacred and the sorcery, and the beliefs about the spirits (baloma) in the working of the voyage. A study of an anthropologist who lived in the villages; the people’s own ritual is quoted at length.',
    'Argonauts of the Western Pacific (Bronisław Malinowski, 1922)', 'recorded 1915–18 CE')
fld('a-gup', 'solomonislandsth00gupprich', 'H. B. Guppy, The Solomon Islands and their Natives (London: Swan Sonnenschein, Lowrey, 1887)',
    'The naval surgeon’s record of the islands in 1882–84, from HMS Lark: the peoples of Guadalcanal, Santa Isabel, Shortland and Faro, their villages, head-hunting and war canoes, the spirit shrines and the skulls, the priests and the ghosts, and the natural history of the group.',
    'The Solomon Islands and their Natives (H. B. Guppy, 1887)', 'recorded 1882–84 CE')
fld('a-chs', 'atf7597.0001.001.umich.edu', 'Emerson B. Christie, The Subanuns of Sindangan Bay (Manila: Bureau of Printing, 1909; Department of the Interior Ethnological Survey Publications, vol. 6, part 1)',
    'The Ethnological Survey’s monograph on the Subanon (Subanun) of the Zamboanga peninsula in Mindanao: their social life and customs, the spirits (the Diwata) and the priests (the balian) and their offerings, the rites of birth, marriage and death, the rice ritual and the stories.',
    'The Subanuns of Sindangan Bay (Emerson B. Christie, 1909)', 'recorded 1903–08 CE')

# ── Africa: southern, central and eastern ──
fld('a-liv', 'missionarytrave00unkngoog', 'David Livingstone, Missionary Travels and Researches in South Africa (London: John Murray, 1857)',
    'The great missionary-explorer’s book, from his journeys of 1841–56 from the Cape to the Zambezi and from coast to coast: the Tswana (Bechuana) and Kololo and Ila peoples, the rain-makers and the doctors and their charms, the Tswana beliefs about God and the dead, the funerals and the people’s ceremonies, and the slave trade.',
    'Missionary Travels and Researches in South Africa (David Livingstone, 1857)', 'recorded 1841–56 CE', split=None)
fld('a-mof', 'missionarylabour00moff', 'Robert Moffat, Missionary Labours and Scenes in Southern Africa (London: John Snow, 1842)',
    'The Kuruman missionary’s account of his twenty-three years among the Tswana, Griqua and Ndebele: the Tswana (Bechuana) chiefs and the rain-makers, their beliefs and sacrifices and the doctors’ charms, the ancestor and the moon, their feasts and funerals, and the work of the mission (1842).',
    'Missionary Labours and Scenes in Southern Africa (Robert Moffat, 1842)', 'recorded 1820s–40s CE', split=None)
fld('a-arb', 'narrative-of-an-exploratory-tour-to-the-north-east-colony-of-the-cape-of-good-hope-t-arbousset', 'T. Arbousset and F. Daumas, Narrative of an Exploratory Tour to the North-East of the Colony of the Cape of Good Hope, translated by John Croumbie Brown (Cape Town: A. S. Robertson, 1846)',
    'The two Paris Evangelical missionaries’ journey in 1836 from Moshoeshoe’s mission in Lesotho to the Drakensberg and the Natal border, among the Basuto (Sotho): the king Moshoeshoe, the people’s ceremonies of initiation and of the harvest, the rain-makers, their beliefs and the ancestors, and the Bushmen’s paintings.',
    'Narrative of an Exploratory Tour to the North-East of the Colony of the Cape of Good Hope (Arbousset and Daumas, 1846)', 'recorded 1836 CE', split=None)
fld('a-grt', 'zululandorlifeam00grou', 'Lewis Grout, Zulu-Land; or, Life among the Zulu-Kafirs of Natal and Zulu-Land, South Africa (Philadelphia: Presbyterian Publication Committee, 1864)',
    'An American Board missionary’s record of the Zulu in Natal in 1846–60: their customs and their beliefs (the Unkulunkulu and the ancestral spirits (the amatongo), the diviners and the doctors), the rites of birth, marriage and death, the kraal and the chief, and the work of the missions.',
    'Zulu-Land (Lewis Grout, 1864)', 'recorded 1846–60 CE')
fld('a-sht', 'kafirsofnatalzul00shoorich', 'Joseph Shooter, The Kafirs of Natal and the Zulu Country (London: Edward Stanford, 1857)',
    'An Anglican curate’s account of the Natal Africans and the Zulu kingdom in 1850–55: their creation story and their belief in the ancestors and in the Great One, the diviners and the witch-finding, the customs of birth and marriage and death, the chiefs and the war.',
    'The Kafirs of Natal and the Zulu Country (Joseph Shooter, 1857)', 'recorded 1850–55 CE')
fld('a-glt', 'narrativeofexplo53galt', 'Francis Galton, Narrative of an Explorer in Tropical South Africa: Being an Account of a Visit to Damaraland in 1851 (London: John Murray, 1853)',
    'The young Galton’s expedition of 1850–52 into Damaraland (Herero) and Ovamboland: the Damara (Herero) and Ovambo and Nama peoples, their cattle and their chiefs, the ancestral fires and the sacred tree and what he heard of their beliefs, with the earliest map of the interior.',
    'Narrative of an Explorer in Tropical South Africa (Francis Galton, 1853)', 'recorded 1850–52 CE')
fld('a-ang', 'lakengamiorexplo00ande', 'Charles John Andersson, Lake Ngami; or, Explorations and Discoveries during Four Years’ Wanderings in the Wilds of South-Western Africa (London: Hurst and Blackett, 1856)',
    'The Swedish-born hunter’s journeys of 1850–54 across Damaraland and Ovamboland to the Okavango and Lake Ngami: the Herero (Damara) and Ovambo and Nama peoples and their ceremonies, the sacred fires, the Bushmen, and the great game of the interior.',
    'Lake Ngami (Charles John Andersson, 1856)', 'recorded 1850–54 CE')
fld('a-kpf', 'travelsresearch00ravegoog', 'J. Ludwig Krapf, Travels, Researches, and Missionary Labours, during an Eighteen Years’ Residence in Eastern Africa (London: Trübner, 1860)',
    'The Church Missionary Society’s pioneer in East Africa, from his years at Mombasa and Rabai (1844–53): the Wanika (Mijikenda) and their kaya forts and their religion (the Mulungu and the spirits of the dead and the kapuka), the Galla (Oromo) and their sky-god Wak, the Swahili and the Kamba, the first sight of Kilimanjaro, with a vocabulary.',
    'Travels, Researches, and Missionary Labours in Eastern Africa (J. Ludwig Krapf, 1860)', 'recorded 1844–53 CE')
fld('a-cam', 'acrossafrica00came', 'Verney Lovett Cameron, Across Africa (New York: Harper, 1877)',
    'The British naval officer’s crossing of Africa from Zanzibar to Angola in 1873–75, the first by a European from east to west: Unyamwezi and the Ujiji and Lake Tanganyika, the Luba and Lunda kingdoms and their kings and fetish priests, the burial of chiefs, the slave trade, and the peoples of the Congo watershed.',
    'Across Africa (Verney Lovett Cameron, 1877)', 'recorded 1873–75 CE', split=None)
fld('a-bnr', 'ruinedcitiesofm00bent', 'J. Theodore Bent, The Ruined Cities of Mashonaland: Being a Record of Excavation and Exploration in 1891 (London: Longmans, Green, 1892; this printing 1893)',
    'The explorer’s account of Great Zimbabwe and the other stone ruins of the Shona country: the excavations of 1891 and the stone birds and phallic emblems, his theory of a Semitic and Arabian origin (later disproved: the ruins are African), and the Shona and Makalanga peoples’ customs and beliefs, as he found them.',
    'The Ruined Cities of Mashonaland (J. Theodore Bent, 1892)', 'recorded 1891 CE', split=None)

# ── The American Southwest; Religious Science ──
sch('x-kdr', 'introductiontost00alfr', 'Alfred Vincent Kidder, An Introduction to the Study of Southwestern Archaeology, with a Preliminary Account of the Excavations at Pecos (New Haven: Yale University Press, 1924)',
    'The Harvard archaeologist’s synthesis of the prehistory of the American Southwest: the Basket Makers and the Pueblo (Ancestral Puebloan) peoples, the kivas and cliff dwellings and the pottery, the sequence from Basket Maker to Pueblo IV and the excavation of Pecos, with what the remains show of the people’s ceremonial life.',
    'An Introduction to the Study of Southwestern Archaeology (Alfred V. Kidder, 1924)', '1924 CE', split=None)
SPECS['v-hlm'] = G('creativemind00holm', 'Ernest S. Holmes, Creative Mind (New York: Robert M. McBride, 1919; second edition)',
                   'The first book of the founder of Religious Science (the Church of Religious Science and the Science of Mind): the teaching of the New Thought, that the thought of the person creates the person’s life, the nature of the Spirit and of thought, healing and prosperity through the right use of mind, in the form of short chapters. ' + MOV,
                   lib=('Creative Mind (Ernest S. Holmes, 1919)', 'sp', '1919 CE', 'spi', None), split='auto', min_chars=250)

# repairs after the test build: the indexes (the scans' index headings were taken for running heads, so each cut is anchored on the first entry), the folded
# table and the printers' line that close a scan, and a translator's front page
fix('a-liv', cut_tail=r'^\s*Appendix\.\s*$')      # the latitude tables (OCR noise) and the index
fix('a-bnr', cut_tail=r'^ABA\s+Abantu')
fix('a-ang', cut_tail=r'^SIGNAL STATION AT')
fix('a-cam', cut_tail=r'^Abdallah ibn Habib, 218')
fix('a-mln', cut_tail=r'^Accounts, native, verbatim')
fix('x-dgs', cut_tail=r'^\s*\(The titles of Chinese works are in italics\)')
fix('x-tpg', cut_tail=r'^\s*APrENDlX')
fix('a-arb', cut_tail=r'^\s*APPENDIX\.\s*$', cut_head=r'^\s*ADVERTISEMENT\.\s*$')
fix('x-mck', cut_tail=r'^[^\n]*THE GRESHAM')
