"""Specs for a thirteenth batch of open (pre-1931) English texts: more field records for the peoples the Atlas lists and the Library did not yet read, chosen from the assessment of
16 November 2026 (tools/assess_coverage.py): the Yoruba, Hausa, Kongo, Kamba, Lango and Nigerian peoples; the Xhosa and Zulu "Kafirs" and the Khoisan; Polynesia (Ellis, Easter Island, the
Fijian hill tribes), Melanesia (Rivers), Southeast Asia (the Burmans and the nat, the Thai, the Dayaks of Sarawak, the Andaman Islanders), the Nagas, Oraons and Veddas of South Asia, the Inuit,
the native races of the Pacific coast of North America and the Handbook of American Indians. Merged into texts_archive.SPECS; built with python3 build_texts.py --only=ids. Found 16 November 2026.

Left out because the Library already has them: Malo's Hawaiian Antiquities (x-haw), Czaplicka's Aboriginal Siberia (a-czap), Bleek and Lloyd's Bushman Folklore (a-blee), Nelson's Eskimo about
Bering Strait (a-nels), Bompas's Folklore of the Santal Parganas (t-bomp), Boas's Central Eskimo (a-boas) and Garcilaso and Molina (x-gar, x-nrl).
"""
from texts_round9 import S, SCH, REF
from texts_round10 import G, T, FIELD

SPECS = {}


def fld(i, idents, by, note, title, when, group='tb', **kw):
    if kw.get('split', 'auto') == 'auto': kw.setdefault('min_chars', 250)
    SPECS[i] = G(idents, by, note + ' ' + FIELD, lib=(title, group, when, 'fld', None), **{'split': 'auto', **kw})


# ── Africa ──
fld('a-kin', 'westafricanstudi00king', 'Mary H. Kingsley, West African Studies (London: Macmillan, 1899)',
    'The Victorian traveller’s book on the religion and law of the West African peoples she met in Gabon and the Niger: the fetish and the “bush soul”, the Fang and their ancestors, the witch doctors and secret societies, and her argument that African religion was a system of belief and not a heap of superstitions.',
    'West African Studies (Mary H. Kingsley, 1899)', 'recorded 1893–95 CE')
fld('a-joh', 'historyofyorubas00john', 'Samuel Johnson, The History of the Yorubas, from the Earliest Times to the Beginning of the British Protectorate, edited by O. Johnson (Lagos: C.M.S. Bookshops, 1921)',
    'A Yoruba pastor’s history (written by 1897, published after his death), the first by a Yoruba: the origin at Ile-Ife, Oduduwa and the first kings, the orishas Shango, Ogun and Obatala, the Ifa oracle and the Ogboni society, the wars of the 19th century and the coming of Christianity.',
    'The History of the Yorubas (Samuel Johnson, c. 1897; ed. 1921)', 'written 1890s CE')
fld('a-dns', 'nigerianstudieso00dennuoft', 'R. E. Dennett, Nigerian Studies; or, The Religious and Political System of the Yoruba (London: Macmillan, 1910)',
    'A trader’s study of the Yoruba religion and state: the high god Olorun and the orishas, the king and the earth cult, Ifa divination and the secret societies, the “Yoruba Rites” and sacrifice, and what the Yoruba system shared with the Bini and the Igbo.',
    'Nigerian Studies: The Religious and Political System of the Yoruba (R. E. Dennett, 1910)', 'recorded 1900s CE')
fld('a-tre', 'banofboridemonsd00trem', 'A. J. N. Tremearne, The Ban of the Bori: Demons and Demon-Dancing in West and North Africa (London: Heath, Cranton & Ouseley, 1914)',
    'The anthropologist’s study of the Bori, the spirit-possession religion of the Hausa, with its spirits (iskoki), its mediums and drummers, its songs and ceremonies, and its parallels across North Africa: the main early English source for the religion that Islam pushed to the edge.',
    'The Ban of the Bori (A. J. N. Tremearne, 1914)', 'recorded 1900s–1910s CE')
fld('a-mee', ['the-northern-tribes-of-nigeria', 'the-northern-tribes-of-nigeria_202208'], 'C. K. Meek, The Northern Tribes of Nigeria: An Ethnographical Account of the Northern Provinces of Nigeria, together with a Report on the 1921 Decennial Census, two volumes (London: Oxford University Press, 1925)',
    'The government anthropologist’s survey of the Hausa, Fulani, Kanuri, Tiv and the many “pagan” peoples of northern Nigeria: their gods, the earth and the ancestors, rain-making and divination, the ordeals and the rites of birth, marriage and death, with the Fulani and Hausa Islam beside them (two volumes).',
    'The Northern Tribes of Nigeria (C. K. Meek, 1925), two volumes', 'recorded 1910s–1920s CE', split=None)
fld('a-lin', 'akambainbritishe00linduoft', 'Gerhard Lindblom, The Akamba in British East Africa: An Ethnological Monograph (Uppsala: Appelbergs, 1920)',
    'The Swedish ethnologist’s monograph on the Kamba of Kenya: the high god Mulungu and the spirits of the dead (aimu), sacrifices, the medicine men and diviners, magic and ordeals, rain-making and the rites of birth, circumcision, marriage and death.',
    'The Akamba in British East Africa (Gerhard Lindblom, 1920)', 'recorded 1910–11 CE')
fld('a-dri', 'in.ernet.dli.2015.218025', 'J. H. Driberg, The Lango: A Nilotic Tribe of Uganda (London: T. Fisher Unwin, 1923)',
    'The district officer’s monograph on the Lango of northern Uganda: Jok, the spirit and the ancestors, the diviners and rain-makers, the clans and the chiefs, and the rites of birth, marriage, war and death.',
    'The Lango: A Nilotic Tribe of Uganda (J. H. Driberg, 1923)', 'recorded 1910s–1920s CE')
fld('a-ben', ['pioneeringoncon00britgoog', 'pioneeringoncong02bent_0'], 'W. Holman Bentley, Pioneering on the Congo, two volumes (London: Religious Tract Society, 1900)',
    'A Baptist missionary’s record of the Kongo peoples of the lower Congo in 1879–1900: their ancestors and nkisi (charms), the witch doctors and the poison ordeal, their stories, proverbs and the rites of birth and death, alongside his own mission.',
    'Pioneering on the Congo (W. Holman Bentley, 1900), two volumes', 'recorded 1879–1900 CE', split=None)
fld('a-kid', 'essentialkafir00kidduoft', 'Dudley Kidd, The Essential Kafir (London: A. & C. Black, 1904)',
    'A South African writer’s account of the Xhosa, Zulu and other Nguni peoples: their ancestor spirits, the “Great-Great-One”, the witch-doctors and doctors, the rain-makers and the rites of birth, circumcision, marriage and death, as one outside observer saw them. The words “Kafir” in the title is that period’s term for the peoples, now an insult.',
    'The Essential Kafir (Dudley Kidd, 1904)', 'recorded 1890s–1900s CE')
fld('a-sto', 'cu31924029888587', 'George W. Stow, The Native Races of South Africa: A History of the Intrusion of the Hottentots and Bantu into the Hunting Grounds of the Bushmen, the Aborigines of the Country, edited by George McCall Theal (London: Swan Sonnenschein, 1905)',
    'A geologist’s history of the peoples of South Africa, published after his death: the San (Bushmen) and their rock paintings, the Khoikhoi, the Bantu migrations, with the beliefs and customs of each as he gathered them from the 1860s.',
    'The Native Races of South Africa (George W. Stow, 1905)', 'recorded 1860s–1880s CE')

# ── The Pacific ──
fld('a-ell', ['polynesianresear11831elli', 'in.ernet.dli.2015.181927'], 'William Ellis, Polynesian Researches, during a Residence of Nearly Eight Years in the Society and Sandwich Islands, second edition, two volumes (London: Fisher, Son & Jackson, 1831)',
    'The London Missionary Society missionary’s account of Tahiti and Hawaii in 1816–24: the gods Oro, Tane and Tu and the maraes (temples), the human sacrifices and the arioi society, the priests and the tabu, the creation chants, and the burning of the idols of Hawaii in 1819.',
    'Polynesian Researches (William Ellis, 1831), two volumes', 'recorded 1816–24 CE', split=None)
fld('a-riv', ['historyofmelanes01rive', 'historyofmelanes02riveuoft'], 'W. H. R. Rivers, The History of Melanesian Society, two volumes (Cambridge: University Press, 1914)',
    'The Cambridge anthropologist’s account of the peoples of the Solomons, New Hebrides and Banks Islands: the dual organisation of their societies, the secret societies and the “Suque”, the spirits and the dead, the totems and the kava, and his theory of the mixing of peoples.',
    'The History of Melanesian Society (W. H. R. Rivers, 1914), two volumes', 'recorded 1908 CE', split=None)
fld('a-esi', 'mysteryofeaste00rout', 'Katherine Routledge, The Mystery of Easter Island: The Story of an Expedition (London: Sifton, Praed, 1919)',
    'The account of the Mana expedition of 1913–15 to Rapa Nui: the statues (moai) and the platforms (ahu), the bird-man cult of Orongo, the tablets (rongorongo) and the memory of the last islanders, with the old stories recorded from the survivors.',
    'The Mystery of Easter Island (Katherine Routledge, 1919)', 'recorded 1914–15 CE')
fld('a-brw', 'hilltribesoffiji00brew', 'A. B. Brewster, The Hill Tribes of Fiji: A Record of Forty Years’ Intimate Connection with the Tribes of the Mountainous Interior of Fiji (London: Seeley, Service, 1922)',
    'A colonial official’s record of the hill peoples of Viti Levu in 1870–1910: their gods and ancestor spirits, the priests and the temples, the cannibal feasts, the Luveniwai and other cults, the old war and the fighting against the missionaries and the government.',
    'The Hill Tribes of Fiji (A. B. Brewster, 1922)', 'recorded 1870–1910 CE')

# ── Southeast Asia and the Andaman Islands ──
fld('a-shy', ['in.gov.ignca.13915', 'in.ernet.dli.2015.282044'], 'Shway Yoe (Sir James George Scott), The Burman: His Life and Notions, two volumes (London: Macmillan, 1882)',
    'The classic English account of Burma before the British annexation, by an official who lived among the people: Buddhism and the monks and monasteries, the festivals, the nat spirits and their feasts, the astrologers and the rites of birth, marriage and death.',
    'The Burman: His Life and Notions (Shway Yoe, 1882), two volumes', 'recorded 1880s CE', split=None)
fld('a-yel', 'kingdomofyellowr00younrich', 'Ernest Young, The Kingdom of the Yellow Robe: Being Sketches of the Domestic and Religious Rites and Ceremonies of the Siamese (London: Constable, 1898)',
    'A missionary-teacher’s sketches of Siamese religion as lived: the monks and the temples, the festivals, the spirits (phi) and their shrines, the astrologers and charms, the rites of birth, the tonsure, ordination, marriage and death.',
    'The Kingdom of the Yellow Robe (Ernest Young, 1898)', 'recorded 1890s CE')
fld('a-lrb', ['nativessarawaka00lowgoog', 'nativessarawaka01lowgoog'], 'Henry Ling Roth, The Natives of Sarawak and British North Borneo, based chiefly on the mss. of the late Hugh Brooke Low, two volumes (London: Truslove & Hanson, 1896)',
    'The record of the Dayak (Iban, Land Dayak, Kayan, Kenyah and other) peoples compiled from the manuscripts of a Sarawak official: their spirits and omens, the rice rites, the head-hunting and its ceremonies, the bird augury, the priests and the rites of birth, marriage and death.',
    'The Natives of Sarawak and British North Borneo (Ling Roth, 1896), two volumes', 'recorded 1860s–1890s CE', split=None)
fld('a-and', 'andamanislanders00radc', 'A. R. Radcliffe-Brown, The Andaman Islanders: A Study in Social Anthropology (Cambridge: University Press, 1922)',
    'The anthropologist’s study of the Andamanese, with their myths and cults: the spirit world and the medicine men, the ceremonial dances and the taboos, the meaning of their stories of Biliku and Tarai, and the rites of birth, initiation and death.',
    'The Andaman Islanders (A. R. Radcliffe-Brown, 1922)', 'recorded 1906–08 CE')

# ── South Asia ──
fld('a-orn', 'in.ernet.dli.2015.277270', 'Sarat Chandra Roy, The Oraons of Chota Nagpur: Their History, Economic Life, and Social Organization, with an introduction by A. C. Haddon (Ranchi: Brahmo Mission Press, 1915)',
    'A Ranchi lawyer’s study of the Oraon (Kurukh) of Chota Nagpur: their supreme god Dharmes, the village spirits and the sacred grove, the festivals and sacrifices, the village priest (pahan), witchcraft and the rites of birth, marriage and death.',
    'The Oraons of Chota Nagpur (Sarat Chandra Roy, 1915)', 'recorded 1900s–1910s CE')
fld('a-hod', 'nagatribesofmani00hods', 'T. C. Hodson, The Naga Tribes of Manipur (London: Macmillan, 1911)',
    'The Political Agent’s account of the Naga peoples of Manipur (Tangkhul, Maram, Kabui and others): their spirits and the village feasts of merit, the genna (taboo) days, sacrifices and head-hunting, the megaliths and the rites of birth, marriage and death.',
    'The Naga Tribes of Manipur (T. C. Hodson, 1911)', 'recorded 1900s CE')
fld('a-hut', 'angaminagaswiths00huttuoft', 'J. H. Hutton, The Angami Nagas, with Some Notes on Neighbouring Tribes (London: Macmillan, 1921)',
    'The standard account of the Angami Nagas by a Naga Hills officer: the gods and spirits (Ukepenuopfu and the terhoma), the genna days and the feasts of merit, the sacrificial rites, the dead and the village stones, and the rites of birth, marriage and death.',
    'The Angami Nagas (J. H. Hutton, 1921)', 'recorded 1910s–1920s CE')
fld('a-hus', 'semanagas00hutt', 'J. H. Hutton, The Sema Nagas (London: Macmillan, 1921)',
    'The companion monograph on the Sema Nagas: their gods and ghosts, the priests, the genna ceremonies, the sacrificial feasts, the rites for the dead and the land of the dead, and the customs of birth, marriage and the village.',
    'The Sema Nagas (J. H. Hutton, 1921)', 'recorded 1910s–1920s CE')
fld('a-mil', 'lhotanagas00mill', 'J. P. Mills, The Lhota Nagas (London: Macmillan, 1922)',
    'The monograph on the Lhota Nagas by a Naga Hills officer: the spirits and the genna ceremonies, the sacrifices, divination and charms, the dead and their afterlife, the stories and the customs of birth, marriage and the village.',
    'The Lhota Nagas (J. P. Mills, 1922)', 'recorded 1910s–1920s CE')
fld('a-sel', 'veddas__00seliuoft', 'C. G. Seligman and Brenda Z. Seligman, The Veddas (Cambridge: University Press, 1911)',
    'The standard study of the Veddas of Sri Lanka by the Seligmans: their spirits of the dead (yaku and the nae yaku), the sacrificial dances and invocations, the kiriammas, the legends of Kande Yaka and the rites of birth, marriage and death.',
    'The Veddas (C. G. and Brenda Z. Seligman, 1911)', 'recorded 1907–08 CE')

# ── The Arctic and North America ──
fld('a-rin', 'talesandtraditi00browgoog', 'Hinrich Rink, Tales and Traditions of the Eskimo, with a Sketch of their Habits, Religion, Language and Other Peculiarities (Edinburgh and London: Blackwood, 1875)',
    'A Danish official’s collection of the stories and beliefs of the Greenland Inuit: the tupilak and the angakok (shaman), the spirit of the sea (Sedna), the land of the dead, the tales of the heroes and the stories of the first people, with his notes on their religion.',
    'Tales and Traditions of the Eskimo (Hinrich Rink, 1875)', 'recorded 1850s–1870s CE', group='si')
fld('a-raa', 'acrossarcticamer006641mbp', 'Knud Rasmussen, Across Arctic America: Narrative of the Fifth Thule Expedition (New York: G. P. Putnam’s Sons, 1927)',
    'The Greenland-Inuit explorer’s narrative of his sledge journey from Greenland to the Bering Strait in 1921–24, with his records of the people he met: their shamans, charms and taboos, the myths he was told and the way of life of the Inuit of the Canadian Arctic.',
    'Across Arctic America (Knud Rasmussen, 1927)', 'recorded 1921–24 CE', group='si')
fld('a-bnc', 'nativeraces03bancrich', 'Hubert Howe Bancroft, The Native Races of the Pacific States of North America, volume III: Myths and Languages (New York: D. Appleton, 1875)',
    'The historian’s compilation of the myths and religions of the peoples of the Pacific coast of North America from the Alaska to the Mexican border, from the earlier accounts of explorers, missionaries and travellers: the creation stories, the gods, the shamans and the sacred ceremonies, as written down by outsiders.',
    'The Native Races of the Pacific States, volume III: Myths and Languages (H. H. Bancroft, 1875)', 'recorded 1500s–1870s CE')
fld('a-hbk', ['handbookamindians02hodgrich', 'handbookamindians01hodgrich'], 'Frederick Webb Hodge (ed.), Handbook of American Indians North of Mexico, two parts: part 1, A–M (Washington: Bureau of American Ethnology, Bulletin 30, 1907), and part 2, N–Z (1910)',
    'The great Smithsonian encyclopaedia of the native peoples of the United States and Canada, with signed articles on each tribe and confederacy, their religions, myths, ceremonies and customs, the treaties, the languages and the ancient sites, by the Bureau’s ethnologists (part 1, A–M, and part 2, N–Z). It describes ceremonies and sacred things of living peoples as outside observers recorded them; read it with the peoples’ own published accounts.',
    'Handbook of American Indians North of Mexico (ed. F. W. Hodge, 1907–10), two parts', 'recorded 1880s–1900s CE', split=None, labels=['Part 1 (A–M)', 'Part 2 (N–Z)'])


# ── repairs found by reading the built texts (16 November 2026) ──
def fix(i, **kw):
    SPECS[i].update(kw)


for _i in ('a-joh', 'a-lin', 'a-rin'): fix(_i, split=None)      # headings of every kind (lists of references, repeated chapter heads) were taken for chapters
fix('a-brw', skip=r'^CHAPTER XXVII jj')
fix('a-rin', cut_tail=r'^[^\n]*HOME USE FORM')
fix('a-hbk', cut_tail=r'^RETURN CIRCULATION DEPARTMENT')
fix('a-bnc', cut_tail=r'^[^\n]*RETURN TO the circulation desk')
fix('a-hut', cut_tail=r'^[^\n]*BINDING DEPT')
fix('a-mil', cut_tail=r'^[^\n]*University of Toronto\s*$')
fix('a-hod', cut_tail=r'^[^\n]*3 1158 00484')
fix('a-hod', cut_tail=r'^[^\n]*UNIVERSITY OF CALIFORNIA LIBRARY')
