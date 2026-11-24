"""Specs for further open (pre-1931) English texts from the peoples of the Americas, the Pacific and Australia: Brinton's translations of Aztec, Maya and Lenape
sources, Markham's Inca narratives, David Malo's Hawaiian antiquities, and the field records of Howitt, Spencer and Gillen, Langloh Parker and Barton. Merged
into texts_archive.SPECS (see the end of that file); built with python3 build_texts.py --only=ids. Sources were found on 16 November 2026 and fetched on the
maker's instruction ("keep going and find more texts").

Each spec may carry lib=(title, group, when, tr, station title prefix): the Library line and the Path station for an id that is not in the Library yet. A
field record (group tb) has no station.
"""
OCR = 'Text from a scan of the printed edition, so occasional OCR errors remain.'
OLD = 'An older translation, so its wording and its scholarship are dated; set a recent translation beside it where there is one.'
FIELD = ('A record made by an outside observer in the colonial or missionary period: it reports what he saw or was told, in his period’s terms and with its '
         'prejudices. Read it critically, and where a tradition’s own people have published their own account, read that as well.')


def G(idents, by, note='', lib=None, **kw):
    d = dict(idents=idents if isinstance(idents, list) else [idents], by=by, note=note, trim_index=True, trim_front=True, trim_back=True, split='auto')
    if lib: d['lib'] = lib
    d.update(kw)
    return d


SPECS = {
    'x-rva': G('rigvedaamerican00bringoog', 'Daniel G. Brinton, Rig Veda Americanus: Sacred Songs of the Ancient Mexicans, with a Gloss in Nahuatl (Philadelphia: D. G. Brinton, 1890)',
               'Nineteen hymns to the gods of the Aztecs (Tlaloc, Xipe Totec, Centeotl, Huitzilopochtli, Tezcatlipoca and others) in Nahuatl with Brinton’s English, from the Sahagún manuscript of the 1550s. Brinton’s readings of the Nahuatl have been improved by later scholars. The Nahuatl comes through as noise in places. ' + OLD,
               lib=('Rig Veda Americanus (Brinton, 1890): the sacred songs of the ancient Mexicans', 'am', 'c. 1558–61 CE', 'nahua', 'The Nahua world')),
    'x-cak': G('annalsofcakchiqu00darich', 'Daniel G. Brinton (translator), The Annals of the Cakchiquels: the original text, with a translation, notes and introduction (Philadelphia: Brinton’s Library of Aboriginal American Literature, 1885)',
               'The history of the Kaqchikel Maya of Guatemala, written by Francisco Hernández Arana Xajilá and Francisco Díaz Gebuta Quej from about 1571: their origins in Tulan, their gods and their wars, the coming of the Spaniards and the later decades. A companion to the Popol Vuh. ' + OLD,
               lib=('The Annals of the Cakchiquels (Brinton, 1885): the Kaqchikel Maya history and myths', 'am', 'c. 1571–1604 CE', 'maya', 'Conquest: the Popol Vuh')),
    'x-mch': G('mayachronicles00briniala', 'Daniel G. Brinton (editor), The Maya Chronicles (Philadelphia: Brinton’s Library of Aboriginal American Literature, 1882)',
               'The Yucatec Maya books of the katuns (the Series of the Katuns from the Books of Chilan Balam, the Record of the Count of the Katuns, and others) and the Chronicle of Chac Xulub Chen (the Pech chronicle of the conquest), in Maya text with Brinton’s English, with his introduction on the Maya calendar, numbers and hieroglyphic books. ' + OLD,
               lib=('The Maya Chronicles (Brinton, 1882): the Series of the Katuns and the Chronicle of Chac Xulub Chen', 'am', 'c. 1562–1700 CE', 'maya', 'Conquest: the Popol Vuh')),
    'x-nrl': G('narrativesofrite00moli', 'Clements R. Markham (translator), Narratives of the Rites and Laws of the Yncas (London: Hakluyt Society, 1873)',
               'Four Spanish and Peruvian reports on Inca religion and law translated from the manuscripts: Cristóbal de Molina’s account of the fables and rites of the Incas (about 1575), Juan de Santa Cruz Pachacuti Yamqui’s account of the antiquities of Peru, Francisco de Ávila’s narrative of the errors, false gods and superstitions of the province of Huarochirí (1608) and the report of Polo de Ondegardo, with Markham’s notes. These are the Spanish and Spanish-period reports of Inca belief, not the Quechua Huarochirí manuscript itself. ' + OLD,
               lib=('Narratives of the Rites and Laws of the Yncas (Markham, 1873): Molina and other Spanish accounts', 'am', 'c. 1550–1575 CE', 'andes', 'The Andes: Huarochirí')),
    'x-wol': G('lencapbelegeds00brinrich', 'Daniel G. Brinton, The Lenâpé and their Legends, with the Complete Text and Symbols of the Walam Olum, a New Translation, and an Inquiry into its Authenticity (Philadelphia: D. G. Brinton, 1885)',
               'The Walam Olum, the “Red Score” of the Lenape (Delaware) with its pictographs and Brinton’s English, and Brinton’s account of Lenape myths and religion. The Walam Olum’s authenticity is doubted: most scholars today think its Lenape text and symbols were made by the naturalist Constantine Rafinesque in the 1820s and not an old Lenape record. Read it as a document of its author’s time.',
               lib=('The Lenapé and their Legends (Brinton, 1885): the Walam Olum and Lenape myths', 'na', '1820s CE (as printed 1836; doubtful as an old record)', 'na', 'Native voices and Native books')),
    'x-haw': G('hawaiianantiquit00malorich', 'David Malo, Hawaiian Antiquities (Moolelo Hawaii), translated from the Hawaiian by Nathaniel B. Emerson (Honolulu: Hawaiian Gazette, 1903)',
               'A Hawaiian scholar of the 1830s and 1840s on his own people’s life: the gods, the priests and the kapu, the temples (heiau), the festivals and the makahiki, sacrifice, healing and sorcery, and the chief’s rule. Malo was a convert to Christianity, writing for the missionaries. One of the few Hawaiian voices on ancient Hawaiian religion.',
               lib=('Hawaiian Antiquities (Moolelo Hawaii; David Malo, trans. Emerson, 1903)', 'pa', 'c. 1840 CE (written down)', 'pac', 'Polynesia: the Kumulipo')),
    'x-ifu': G('ifugaolawroy00bartrich', 'R. F. Barton, Ifugao Law (University of California Publications in American Archaeology and Ethnology, vol. 15 no. 1; Berkeley, 1919)',
               'The customary law of the Ifugao of northern Luzon, the people of the Hudhud epics and the rice terraces, set down by an American teacher who lived among them: kinship, property, marriage, debt, the courts of the go-between (monkalun) and the part the gods and spirits played in disputes. ' + FIELD,
               lib=('Ifugao Law (R. F. Barton, 1919): the customary law and spirit belief of the Ifugao', 'pa', 'recorded 1910s CE', 'phil', 'The Philippines: the Pasyon')),
    'a-howi': G('nativetribesofso00howiuoft', 'A. W. Howitt, The Native Tribes of South-East Australia (London: Macmillan, 1904)',
                'A great collection of what the Kurnai, Yuin, Kamilaroi, Wiradjuri and other peoples of south-east Australia told and showed him: the initiation and the bullroarer, the Great Beings (Bunjil, Daramulun, Baiame), the dead, totems and marriage law. ' + FIELD + ' Some of the secret rites described are restricted in the communities concerned; the public record is read here as a document of 1904.',
                lib=('The Native Tribes of South-East Australia (A. W. Howitt, 1904)', 'tb', 'recorded 1860s–1900s CE', 'fld', None)),
    'a-nnca': G('northerntribesc00gillgoog', 'Baldwin Spencer and F. J. Gillen, The Northern Tribes of Central Australia (London: Macmillan, 1904)',
                'The fieldwork of two observers among the Warramunga, Binbinga, Mara, Anula and other peoples north of the Aranda: totems, the churinga (sacred objects), the Wollunqua snake, initiation and the dead. ' + FIELD + ' Some of the secret rites described are restricted in the communities concerned; the public record is read here as a document of 1904.',
                lib=('The Northern Tribes of Central Australia (Spencer and Gillen, 1904)', 'tb', 'recorded 1901–02 CE', 'fld', None)),
    'a-euah': G('euahlayitribewi00langgoog', 'K. Langloh Parker, The Euahlayi Tribe: A Study of Aboriginal Life in Australia, with an introduction by Andrew Lang (London: Constable, 1905)',
                'A woman who lived on a station among the Euahlayi (Yuwaalaraay) people on the Narran River writes of their beliefs: Baiame the Sky-God, the spirits and the dead, totems, magic and medicine, and the stories her friends told her. ' + FIELD,
                lib=('The Euahlayi Tribe (K. Langloh Parker, 1905)', 'tb', 'recorded 1880s–1900s CE', 'fld', None)),
    'a-maus': G('moreaustralianl00parkgoog', 'K. Langloh Parker, More Australian Legendary Tales (London: David Nutt, 1898)',
                'More stories collected on the Narran River, with an introduction by Andrew Lang: the Sky-God Baiame, the origin of the Milky Way, the Seven Sisters, the Rainbow Snake and the animal tales told to children. A sequel to the Library’s Australian Legendary Tales. ' + FIELD,
                lib=('More Australian Legendary Tales (K. Langloh Parker, 1898)', 'tb', 'recorded 1880s–1890s CE', 'fld', None)),
}
