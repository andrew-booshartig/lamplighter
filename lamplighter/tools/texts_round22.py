"""Specs for a twenty-second batch of open (pre-1931) English texts (17 November 2026): the outsiders’ records of the ceremonies, societies and sacred songs of living peoples, on the maker’s
instruction that the Library is a collection of all human religion and that “the people need all the information available to decide for themselves”. Hopi, Zuñi and Sia ceremonies (Fewkes,
Stevenson, Voth and Dorsey), the Plains sun dances and societies (Dorsey on the Arapaho and Cheyenne, Wissler on the Blackfoot, Lowie on the Crow and the Shoshone), the sacred songs of the
Chippewa, Teton Sioux, Mandan and Hidatsa, Pawnee and Papago (Densmore), the Menomini medicine ceremony and bundles (Skinner), the Navajo Mountain Chant (Matthews), the secret societies of the
Kwakiutl (Boas) and the Queensland Aborigines (Roth). Merged into texts_archive.SPECS; built with python3 build_texts.py --only=ids.

Each is a government, museum or university publication of 1887–1929 in the public domain. Each is labelled as an outsider’s record and the labels say that some of what it describes is held
sacred by the peoples themselves; none is left out for that reason (the exclusion once applied to these books was never the maker’s and was withdrawn on 17 November 2026).
"""
from texts_round9 import S, SCH, REF
from texts_round10 import G, T, FIELD

SPECS = {}
fix = lambda i, **kw: SPECS[i].update(kw)
RITES = ('It records ceremonies and sacred songs of peoples who are living today, as an outsider wrote them down in the terms of his time. Some of what it describes is held sacred or restricted by those peoples, '
         'and some of their communities would not choose to have it printed; the Library keeps it so that everyone can see what has been published, and sets the peoples’ own accounts beside it where they exist. '
         'Understood, not endorsed.')


def rit(i, idents, by, note, title, when, **kw):
    if kw.get('split', 'auto') == 'auto': kw.setdefault('min_chars', 250)
    SPECS[i] = G(idents, by, note + ' ' + RITES + ' ' + FIELD, lib=T(title, when), **{'split': 'auto', **kw})


# ── The Pueblos ──
rit('a-fkt', 'hopikatcinasdraw00fewk', 'Jesse Walter Fewkes, Hopi Katcinas Drawn by Native Artists (Twenty-first Annual Report of the Bureau of American Ethnology, 1899–1900; Washington: Government Printing Office, 1903)',
    'The Smithsonian ethnologist’s account of the Hopi katcinas, the masked spirit-beings who visit the Hopi villages: each katcina described from the pictures that Hopi artists drew for him, its mask and dress and the dances in which it appears, the kivas and the katcina societies and the festivals of the year, and what the Hopi told him about them.',
    'Hopi Katcinas Drawn by Native Artists (Jesse Walter Fewkes, 1903)', 'recorded 1890s CE', split=None)
rit('a-stz', 'thezueniindians00stevrich', 'Matilda Coxe Stevenson, The Zuñi Indians: Their Mythology, Esoteric Fraternities, and Ceremonies (Twenty-third Annual Report of the Bureau of American Ethnology, 1901–1902; Washington: Government Printing Office, 1904)',
    'The fullest outside account of the Zuñi pueblo’s religion of its time, by an ethnologist who lived there for years from 1879: the myths, the esoteric fraternities (the Ne’wekwe, the Cactus fraternity and others), the priesthoods, the altars and the masked dancers, the ceremonies for rain and corn and healing, and the rites of birth, marriage and death.',
    'The Zuñi Indians: Their Mythology, Esoteric Fraternities, and Ceremonies (Matilda Coxe Stevenson, 1904)', 'recorded 1879–96 CE', split=None)
rit('a-sia', 'siasmithsonian00stevuoft', 'Matilda Coxe Stevenson, The Sia (Eleventh Annual Report of the Bureau of Ethnology, 1889–90; Washington: Government Printing Office, 1894)',
    'The ethnologist’s account of Sia (Zia) pueblo in New Mexico, from her visit of 1890: the religious societies and their altars, the snake, medicine and warrior societies, the rain-making ceremonies, the creation story and the rites of birth, marriage and death.',
    'The Sia (Matilda Coxe Stevenson, 1894)', 'recorded 1890 CE', split=None)
rit('a-fws', 'wintersolsticeal00fewkrich', 'Jesse Walter Fewkes, The Winter Solstice Altars at Hano Pueblo (American Anthropologist, 1899)',
    'The ethnologist’s description of the altars and ceremonies of the Tewa village of Hano on the Hopi mesa at the winter solstice: the altar and its objects, the priests and the ritual.',
    'The Winter Solstice Altars at Hano Pueblo (Jesse Walter Fewkes, 1899)', 'recorded 1890s CE', split=None)
rit('a-fft', 'cu31924104075399', 'Jesse Walter Fewkes, Tusayan Flute and Snake Ceremonies (extract from the Nineteenth Annual Report of the Bureau of American Ethnology, 1897–98; Washington: Government Printing Office, 1901)',
    'The ethnologist’s accounts of the Hopi (Tusayan) Flute and Snake ceremonies as he saw them at Walpi and Mishongnovi in the 1890s: the preparation of the kivas and altars, the rites of the fraternities, the snake dance and the washing of the snakes, with the traditions told to him.',
    'Tusayan Flute and Snake Ceremonies (Jesse Walter Fewkes, 1901)', 'recorded 1890s CE', split=None)
rit('a-vpw', 'oraibipowamucere32voth', 'H. R. Voth, The Oraibi Powamu Ceremony (Field Columbian Museum Publication 61, Anthropological Series vol. III no. 2; Chicago: Field Columbian Museum, 1901; the Stanley McCormick Hopi Expedition)',
    'The missionary-ethnologist’s account of the Powamu (Bean-planting) ceremony of Oraibi in February, the Hopi katcina initiation: the kiva rites, the growing of the beans, the whipping of the children and the processions of the katcinas.',
    'The Oraibi Powamu Ceremony (H. R. Voth, 1901)', 'recorded 1890s CE', split=None)
rit('a-vso', 'oraibisoyalcerem31dors', 'George A. Dorsey and H. R. Voth, The Oraibi Soyal Ceremony (Field Columbian Museum Publication 55, Anthropological Series vol. III no. 1; Chicago, 1901)',
    'The account of the Soyal, the Hopi winter-solstice ceremony at Oraibi, from the observations of the missionary Voth: the kiva, the altar and the prayer-sticks, the officiants and the dances, with the drawings and the songs.',
    'The Oraibi Soyal Ceremony (George A. Dorsey and H. R. Voth, 1901)', 'recorded 1890s CE', split=None)
rit('a-vmr', 'oraibimaraucerem111voth', 'H. R. Voth, The Oraibi Marau Ceremony (Field Museum of Natural History, Anthropological Series vol. XI no. 1; Chicago, 1912)',
    'The account of the Marau, the women’s ceremony of the Hopi village of Oraibi in the fall: the society of women, the kiva rites, the altar and the dances, from the author’s observations.',
    'The Oraibi Marau Ceremony (H. R. Voth, 1912)', 'recorded 1890s CE', split=None)

# ── The Plains ──
rit('a-dsd', 'arapahosundancec04dors', 'George A. Dorsey, The Arapaho Sun Dance: The Ceremony of the Offerings Lodge (Field Columbian Museum Publication 75, Anthropological Series vol. IV; Chicago, 1903)',
    'The curator’s account of the Offerings Lodge of the Arapaho, their Sun Dance: the vow, the preparation of the lodge and the altar, the officiants and the days of the ceremony, with the myths told about it, from his observations of 1901–02.',
    'The Arapaho Sun Dance (George A. Dorsey, 1903)', 'recorded 1901–02 CE', split=None)
rit('a-dch', ['thecheyenne01dorsrich', 'dorseyscheyenne02amosrich'], 'George A. Dorsey, The Cheyenne, two parts: I. Ceremonial Organization; II. The Sun Dance (Field Columbian Museum Publications 99 and 103, Anthropological Series vol. IX nos. 1 and 2; Chicago, 1905)',
    'The curator’s account of the Cheyenne, from his work of 1901–03: part I, the ceremonial organisation of the tribe, the sacred bundles and the societies; part II, the Cheyenne Sun Dance (the Medicine Lodge) with its vow, its lodge and its rites.',
    'The Cheyenne (George A. Dorsey, 1905), two parts', 'recorded 1901–03 CE', split=None)
rit('a-wsb', 'sundanceofblackf00wiss', 'Clark Wissler, The Sun Dance of the Blackfoot Indians (Anthropological Papers of the American Museum of Natural History vol. XVI part 3; New York, 1918)',
    'The curator’s account of the Blackfoot Sun Dance as the Blackfoot told it to him: the vow of the woman who gives it, the preparation and the lodge, the ritual of the sacred bundle and the days of the dance.',
    'The Sun Dance of the Blackfoot Indians (Clark Wissler, 1918)', 'recorded 1900s–10s CE', split=None)
rit('a-wcb', 'ceremonialbundl00wissgoog', 'Clark Wissler, Ceremonial Bundles of the Blackfoot Indians (Anthropological Papers of the American Museum of Natural History vol. VII part 2; New York, 1912)',
    'The account of the sacred bundles of the Blackfoot (the medicine-pipe, beaver, thunder-pipe and other bundles): their contents, their origins, the songs and the rites of opening and transferring them.',
    'Ceremonial Bundles of the Blackfoot Indians (Clark Wissler, 1912)', 'recorded 1900s–10s CE', split=None)
rit('a-lsc', 'sundancecrowind00lowigoog', 'Robert H. Lowie, The Sun Dance of the Crow Indians (Anthropological Papers of the American Museum of Natural History vol. XVI part 1; New York, 1915)',
    'The anthropologist’s account of the Crow Sun Dance from his fieldwork in 1907–14: the vow, the lodge, the dance and the part of the sacred dolls, as the Crow told it to him.',
    'The Sun Dance of the Crow Indians (Robert H. Lowie, 1915)', 'recorded 1907–14 CE', split=None)
rit('a-lsh', 'dancessocietieso00lowirich', 'Robert H. Lowie, Dances and Societies of the Plains Shoshone (Anthropological Papers of the American Museum of Natural History vol. XI part 10; New York, 1915)',
    'A short account of the dances and societies of the Plains Shoshone (the Wind River Shoshone): the dances of the societies, the Sun Dance and the Ghost Dance, as told to the author on the reservation.',
    'Dances and Societies of the Plains Shoshone (Robert H. Lowie, 1915)', 'recorded 1900s–10s CE', split=None)
rit('a-skm', 'medicineceremony00skin', 'Alanson Skinner, Medicine Ceremony of the Menomini, Iowa, and Wahpeton Dakota, with Notes on the Ceremony among the Ponca, Bungi Ojibwa, and Potawatomi (Indian Notes and Monographs vol. IV; New York: Museum of the American Indian, Heye Foundation, 1920)',
    'The account of the Medicine Ceremony (the Midewiwin or Mitawit) of the Menomini and neighbouring peoples: the lodge, the initiation, the songs and the sacred bundles, as the members described it to the author.',
    'Medicine Ceremony of the Menomini, Iowa, and Wahpeton Dakota (Alanson Skinner, 1920)', 'recorded 1910s CE', split=None)
rit('a-skb', 'sociallifeandce00skingoog', 'Alanson Skinner, Social Life and Ceremonial Bundles of the Menomini Indians (Anthropological Papers of the American Museum of Natural History vol. XIII part 1; New York, 1913)',
    'The account of the Menomini of Wisconsin: their clans and social life, the war bundles and the other sacred bundles and their rites, as recorded by the author in 1910–11.',
    'Social Life and Ceremonial Bundles of the Menomini Indians (Alanson Skinner, 1913)', 'recorded 1910–11 CE', split=None)

# ── Sacred songs ──
rit('a-dc1', 'chippewamusic00dens', 'Frances Densmore, Chippewa Music (Smithsonian Institution, Bureau of American Ethnology Bulletin 45; Washington: Government Printing Office, 1910)',
    'Songs of the Chippewa (Ojibwa) of Minnesota and Wisconsin recorded on the phonograph in 1907–09, with the words, the music in notation and the singers’ accounts: the songs of the Midewiwin (the Grand Medicine Society), songs of dreams, healing, war, love and games.',
    'Chippewa Music (Frances Densmore, 1910)', 'recorded 1907–09 CE', split=None)
rit('a-dc2', 'chippewamusic02densuoft', 'Frances Densmore, Chippewa Music II (Smithsonian Institution, Bureau of American Ethnology Bulletin 53; Washington: Government Printing Office, 1913)',
    'A second collection of Chippewa songs recorded in 1910–12, with the singers’ accounts of them: songs of dreams and visions, of the Midewiwin, of war and of healing, with the music in notation.',
    'Chippewa Music II (Frances Densmore, 1913)', 'recorded 1910–12 CE', split=None)
rit('a-dtn', 'tetonsioux00densmore', 'Frances Densmore, Teton Sioux Music (Smithsonian Institution, Bureau of American Ethnology Bulletin 61; Washington: Government Printing Office, 1918)',
    'Songs of the Teton Sioux (Lakota) of Standing Rock recorded in 1911–14, with the singers’ accounts: songs of the societies, of dreams and visions, of the buffalo, of healing and of war, with the music in notation.',
    'Teton Sioux Music (Frances Densmore, 1918)', 'recorded 1911–14 CE', split=None)
rit('a-dmn', 'mandanhidatsamus00dens', 'Frances Densmore, Mandan and Hidatsa Music (Smithsonian Institution, Bureau of American Ethnology Bulletin 80; Washington: Government Printing Office, 1923)',
    'Songs of the Mandan and Hidatsa of North Dakota recorded in 1912–15 with the singers’ accounts: songs of the societies (among them the Goose society), of the corn and the buffalo, of healing and of war.',
    'Mandan and Hidatsa Music (Frances Densmore, 1923)', 'recorded 1912–15 CE', split=None)
rit('a-dpw', 'pawneemusic00dens', 'Frances Densmore, Pawnee Music (Smithsonian Institution, Bureau of American Ethnology Bulletin 93; Washington: Government Printing Office, 1929)',
    'Songs of the Pawnee of Oklahoma recorded in 1919 with the singers’ accounts: the songs of the sacred bundles, the societies and the Ghost Dance, with the music in notation.',
    'Pawnee Music (Frances Densmore, 1929)', 'recorded 1919 CE', split=None)
rit('a-dpg', 'papagomusic00dens', 'Frances Densmore, Papago Music (Smithsonian Institution, Bureau of American Ethnology Bulletin 90; Washington: Government Printing Office, 1929)',
    'Songs of the Papago (Tohono O’odham) of Arizona recorded in 1920–23 with the singers’ accounts: songs of the rain and the corn, of healing and the medicine men, of the flute and the dance, with the music in notation.',
    'Papago Music (Frances Densmore, 1929)', 'recorded 1920–23 CE', split=None)

# ── Other peoples ──
rit('a-mch', 'mountainchantnav00matt', 'Washington Matthews, The Mountain Chant: A Navajo Ceremony (Fifth Annual Report of the Bureau of Ethnology, 1883–84; Washington: Government Printing Office, 1887)',
    'The army surgeon’s account of the Navajo nine-day Mountain Chant (Dsilyidje qacal), as he witnessed it in 1884: the myth of the ceremony, the preparation of the lodge, the sand-paintings, the prayer-sticks and the dances of the last night, with the songs and the prayers.',
    'The Mountain Chant: A Navajo Ceremony (Washington Matthews, 1887)', 'recorded 1884 CE', split=None)
rit('a-bks', 'socialorganizati00boas', 'Franz Boas, The Social Organization and the Secret Societies of the Kwakiutl Indians (Report of the United States National Museum for 1895; Washington: Government Printing Office, 1897)',
    'The anthropologist’s account of the Kwakiutl of Vancouver Island from his visits of 1886–95: the clans and the ranks, the winter ceremonial of the secret societies (the Cannibal dancer, the Fool dancers and the others), their masks, songs and initiations, and the potlatch.',
    'The Social Organization and the Secret Societies of the Kwakiutl Indians (Franz Boas, 1897)', 'recorded 1886–95 CE', split=None)
rit('a-roq', 'cu31924029890328', 'Walter E. Roth, Ethnological Studies among the North-West-Central Queensland Aborigines (Brisbane: Edmund Gregory, Government Printer, 1897)',
    'The surgeon at Boulia’s record of the Aboriginal peoples of north-west-central Queensland: their social life and customs, the initiation rites, the ceremonial and sacred objects, the beliefs about birth, death and the spirits, and the songs and corroborees.',
    'Ethnological Studies among the North-West-Central Queensland Aborigines (Walter E. Roth, 1897)', 'recorded 1890s CE', split=None)

# repairs after the test build: the indexes that close the reports, from their first entries (the scan's cleaning removes the headings)
fix('a-fkt', cut_tail=r'^Abbreviated katcina dances, description', cut_tail_from=0.5)
fix('a-stz', cut_tail=r'^Acknowledgments\s+19', cut_tail_from=0.5)
fix('a-skm', cut_tail=r'^Above and Below Powers, gods of the air')
fix('a-dc1', cut_tail=r'^Acknowledgments by author')
fix('a-bks', cut_tail=r'^\s*LIST OF ILLUSTRATIONS', cut_tail_from=0.8)
