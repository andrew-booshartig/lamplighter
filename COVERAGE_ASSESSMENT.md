# Coverage assessment: what the Library holds, what it still lacks, and how the traditions are connected

16 November 2026, updated 17 November 2026 after rounds 15 to 20. Made on the maker’s words “run an assessment and see if we’re missing any religions or offshoots or examples for those religions or how they’re connected.” The figures come from `tools/assess_coverage.py` (re-run it any time: `python3 -I tools/assess_coverage.py` from `lamplighter/`), which reads the Atlas (721 traditions, 2,307 catalogued texts, 382 recorded interactions) against the Library (1,471 entries; 1,357 readable texts in `texts/`). One row per tradition is in `COVERAGE_BY_TRADITION.csv`. Suggested new Atlas links are in `SUGGESTED_ATLAS_LINKS.csv`.

*Updated 17 November 2026 (later): the Atlas now has 793 traditions and 500 recorded interactions. The figures in the rest of this file are those of before the additions; the section “After the Atlas additions” gives the new ones, and the section on the gaps says which were filled.*

## The answer in short

1. **Religions and offshoots missing from the Atlas.** About 45 named religions, offshoots and ancient peoples have no tradition of their own (the table below), and about a dozen peoples whose religion the Library can now read (the Nagas, Andamanese, Kamba, Lango, Koryak and Yukaghir, Pawnee, Omaha, Thonga and Ila, among others) have none either. Nearly all are small. The gaps with the most weight are the Russian and medieval-European dissenters, the Nagas and Andamanese, the Philistine, Edomite and Ammonite neighbours of Israel, and the Tibetan and Indian schools (Dzogchen, Kalachakra, the Aghori, Advaita Vedanta as a named school).
2. **Examples.** Of the 721 traditions, **472 (65%) now have at least one readable example in the Library**, up from 168 (23%) before rounds 12 to 20, which added 314 texts. Of that gain, 56 traditions come from books the Library already held, now mapped to the traditions they describe (a mention-scan of every text, each link read in context), and the rest from the new texts. “Example” means one of two things: a text of the tradition’s own (an Atlas catalogue record that the Library holds; 133 traditions, up from 118), or a field record or study of it that the Library holds (Kingsley on West Africa, Hutton on the Angami Nagas, Waddell on Tibet). **249 traditions still have none.** They are listed by family below. A further 8 revived or reconstructed traditions have no example of their own, but the old source texts they draw on are in the Library (`tools/library_lore.json`; they are not counted above): Rodnovery (Slavic Native Faith); Order of Bards, Ovates and Druids; Heathenry (Ásatrú); Roman polytheistic reconstructionism; Kemetism; Hellenism (Hellenic polytheism); Natib Qadish; Suomenusko.
3. **Connections.** **440 of 721 traditions (61%) have no recorded link to any other tradition.** Whole families are unconnected: the 22 indigenous religions of Southeast Asia and the 11 of South and Himalayan Asia have no link at all, and the 24 newer movements have one. Only 38 of the 190 possible pairs of different families are linked, and the Atlas records no link at all between the Indian religions and Southeast Asia (Hinduism and Buddhism in Java, Burma, Siam and Cambodia), or between Islam or Christianity and Southeast Asia. `SUGGESTED_ATLAS_LINKS.csv` has 89 links that the Library’s own texts support and the Atlas lacks.
4. **What cannot be filled from open sources** is a short list, given at the end: texts first published after 1930, the oral traditions of peoples whose own records are not open, and the undeciphered scripts. (A fourth entry, the sacred or restricted rites of living peoples, was withdrawn on 17 November 2026: see the end.)

## After rounds 21 to 23 (17 November 2026, later still)

* **56 texts, 33.8 MB** (round 21: 9 texts, 10.6 MB; round 22: 25 texts, 12.3 MB; round 23: 22 texts, 10.9 MB), taking `texts/` from 1,357 to **1,413 files**. Round 22 is the outsiders’ records of the ceremonies, societies and sacred songs of living peoples and round 23 the rituals, exposures and books of secret and initiatory orders, after the rule that had kept them out was withdrawn.
* **530 of 793 traditions (67%) now have an example in the Library** (524 before the 56 texts); 134 have a readable text of their own (133 before). Six traditions gained their first example: the Illyrian, Iberian, Celtiberian and Lusitanian, and Sarmatian and Alan religions (Strabo, Caesar, Ammianus, Evans), the Muggletonians and the Rizalista movements; Hoodoo gained a text of its own. Most of the other books are second and third examples for traditions that already had one (Hopi, Zuni, Keres and Pueblo, the Sun Dance, Lakota, Midewiwin, Navajo, Pawnee, Freemasonry, the Latter Day Saints, the Alawites, Haitian Vodou, the Eleusinian mysteries), so the headline barely moves: what these rounds change is what the Library is willing to hold, not the count.
* **No example yet: 263 traditions.** The mapping of the Ukrainian Greek Catholic Church to Fortescue’s Uniate volume is not supported (the Ruthenians are only mentioned there), so it is not made. Round 21’s Melkite mapping is.

## After the Atlas additions (17 November 2026)

The gaps in the table below were filled: **72 traditions** and **118 links** were added (721 → 793 traditions, 382 → 500 recorded interactions, with 43 new places; `tools/library_about.json` now maps Library books to traditions in 912 links, 59 of them for the new traditions). The first pass added 68 traditions and 116 links; the exclusion of the sacred religion of living peoples was then withdrawn (17 November 2026), and a second pass added the four Pueblo rows and two links and put the ceremonial back on 13 rows. `python3 -I tools/assess_coverage.py` was re-run on the new Atlas (it rewrote `COVERAGE_BY_TRADITION.csv`; the script prints its tables and this file is edited by hand from them).

* **793 traditions; 524 (66%) have at least one readable example in the Library** (472 of 721, 65%, before the additions). 133 (17%) have a text of their own, 184 more have an example only through the parent, and 139 have no Atlas text record at all.
* **408 of 793 (51%) have no recorded link to any other tradition** (440 of 721, 61%, before). Of the 190 possible pairs of different families, **43 are now linked** (38 before): the Abrahamic religions with the indigenous religions of South Asia (the Christian missions and the Nagas) and with those of Southeast Asia (the Karen), the Indian religions with Southeast Asia (Theravāda and the Shan), the Ancient Near East with the Western esoteric family (Babylonian omens and astrology) and with the mystery and philosophical religions (the Phrygian Mother and Cybele). Sixteen of the 20 families link their own members (15 before). By type the 500 links are derivations (136), influences (115), syncretisms (52), schisms (34), conversions (33), persecutions (29), suppressions (22), conflicts (19), reforms (18), transmissions (15), revivals (13), absorptions (6), dialogues (4) and coexistences (4).
* **The new rows with no example** are the ones the Library holds nothing on (the Ammonite, Kassite, Luwian, Illyrian, Iberian and Magyar religions, the Ranters, Diggers and Muggletonians, the serpent-handling churches, the Three-in-One teaching, Curanderismo and Traditionalism) and seven read only through the parent (the Celtiberian and Lusitanian and the Sarmatian and Alan religions, the Ni‘matullāhī order, Ayyavazhi, Siddha Yoga, Rimé and Shambhala Buddhism). They are listed in `COVERAGE_BY_TRADITION.csv` and in the family lists the script prints.

| family | traditions | with an example of either kind | % | of them, their own text | via the parent tradition | Atlas text records | readable here | % of records | with no link |
|---|---|---|---|---|---|---|---|---|---|
| Abrahamic religions | 223 | 149 | 67% | 52 | 43 | 885 | 253 | 29% | 96 |
| Indian religions | 119 | 78 | 66% | 24 | 85 | 518 | 116 | 22% | 64 |
| African traditional religions | 62 | 45 | 73% | 3 | 2 | 79 | 3 | 4% | 46 |
| Indigenous religions of the Americas | 56 | 51 | 91% | 9 | 0 | 79 | 10 | 13% | 34 |
| East Asian religions | 49 | 18 | 37% | 6 | 13 | 136 | 20 | 15% | 28 |
| Indigenous religions of Australia and the Pacific | 31 | 18 | 58% | 2 | 0 | 37 | 2 | 5% | 17 |
| Western esoteric and metaphysical currents | 30 | 18 | 60% | 8 | 11 | 42 | 10 | 24% | 8 |
| Pre-Christian Europe | 29 | 20 | 69% | 8 | 6 | 83 | 21 | 25% | 8 |
| Indigenous religions of Southeast Asia | 26 | 20 | 77% | 0 | 0 | 33 | 0 | 0% | 20 |
| Other new religious movements | 24 | 0 | 0% | 0 | 0 | 26 | 0 | 0% | 23 |
| Ancient Near East | 22 | 16 | 73% | 6 | 1 | 110 | 16 | 15% | 8 |
| Afro-diasporic religions | 21 | 8 | 38% | 0 | 7 | 38 | 0 | 0% | 7 |
| Inner Asian and Arctic religions | 18 | 17 | 94% | 0 | 0 | 27 | 0 | 0% | 14 |
| Contemporary Paganism | 18 | 2 | 11% | 2 | 3 | 15 | 3 | 20% | 6 |
| Late antique mystery, gnostic and philosophical religion | 15 | 15 | 100% | 8 | 5 | 65 | 9 | 14% | 4 |
| Indigenous religions of South and Himalayan Asia | 13 | 12 | 92% | 0 | 0 | 11 | 0 | 0% | 12 |
| Iranian religions | 12 | 10 | 83% | 2 | 5 | 64 | 18 | 28% | 3 |
| Prehistoric evidence | 10 | 3 | 30% | 0 | 0 | 0 | 0 | 0% | 4 |
| Humanist and rationalist traditions | 8 | 7 | 88% | 2 | 2 | 10 | 2 | 20% | 5 |
| Ancient Egypt and the Nile Valley | 3 | 3 | 100% | 1 | 1 | 49 | 17 | 35% | 0 |

## How the figures were made, and what they leave out

A tradition counts as having an example when (a) one of its Atlas text records is held by the Library (through the title matcher and `tools/atlas_text_aliases.json`), or (b) the Library holds a book that is *about* it: a field record, a history, a study (`tools/library_about.json`, 436 books mapped to the traditions they describe). The test is strict, so the figures are a floor. A tradition may be read in the Library under a parent’s name (Soka Gakkai under Nichiren, a Zen school under Chan): the table counts those separately as “via the parent”, and marks them † below. Some “no example” rows are false negatives that the Atlas and Library have not yet been joined for: where I found them, I mapped them; the rest need a person who knows the tradition to say which Library book belongs to it. The Atlas catalogues a tradition’s *scriptures and writings*, so an observer’s record of a people (the kind of book that is nearly all there is for the African, Pacific and Siberian religions) is outside what the Atlas lists, and that is why the second kind of example is counted.

## Coverage by family

| Family | Traditions | With an example, before rounds 12–20 | With an example, now | Of those now, their own text | Atlas text records readable here | With no connection to any other tradition |
|---|---|---|---|---|---|---|
| Abrahamic religions | 207 | 45 (22%) | **142 (69%)** | 52 | 253 of 885 (29%) | 109 |
| Indian religions | 109 | 25 (23%) | **73 (67%)** | 24 | 116 of 518 (22%) | 69 |
| African traditional religions | 56 | 12 (21%) | **40 (71%)** | 3 | 3 of 79 (4%) | 40 |
| Indigenous religions of the Americas | 52 | 17 (33%) | **48 (92%)** | 9 | 11 of 79 (14%) | 39 |
| East Asian religions | 48 | 6 (12%) | **18 (38%)** | 6 | 20 of 136 (15%) | 36 |
| Indigenous religions of Australia and the Pacific | 30 | 9 (30%) | **17 (57%)** | 2 | 2 of 37 (5%) | 20 |
| Western esoteric and metaphysical currents | 25 | 7 (28%) | **16 (64%)** | 8 | 10 of 42 (24%) | 10 |
| Other new religious movements | 24 | 0 (0%) | **0 (0%)** | 0 | 0 of 26 (0%) | 23 |
| Indigenous religions of Southeast Asia | 22 | 3 (14%) | **16 (73%)** | 0 | 0 of 33 (0%) | 22 |
| Pre-Christian Europe | 21 | 9 (43%) | **17 (81%)** | 8 | 21 of 83 (25%) | 5 |
| Afro-diasporic religions | 21 | 2 (10%) | **8 (38%)** | 0 | 0 of 38 (0%) | 10 |
| Contemporary Paganism | 18 | 2 (11%) | **2 (11%)** | 2 | 3 of 15 (20%) | 6 |
| Inner Asian and Arctic religions | 16 | 6 (38%) | **15 (94%)** | 0 | 0 of 27 (0%) | 12 |
| Late antique mystery, gnostic and philosophical religion | 15 | 8 (53%) | **15 (100%)** | 8 | 9 of 65 (14%) | 5 |
| Ancient Near East | 14 | 9 (64%) | **12 (86%)** | 6 | 16 of 110 (15%) | 6 |
| Iranian religions | 11 | 3 (27%) | **10 (91%)** | 2 | 18 of 64 (28%) | 8 |
| Indigenous religions of South and Himalayan Asia | 11 | 2 (18%) | **10 (91%)** | 0 | 0 of 11 (0%) | 11 |
| Prehistoric evidence | 10 | 0 (0%) | **3 (30%)** | 0 | 0 of 0 (0%) | 4 |
| Humanist and rationalist traditions | 8 | 2 (25%) | **7 (88%)** | 2 | 2 of 10 (20%) | 5 |
| Ancient Egypt and the Nile Valley | 3 | 1 (33%) | **3 (100%)** | 1 | 17 of 49 (35%) | 0 |

Reading the table: the strongest families are the ones whose own texts are open and old (the Near East, the mystery religions, the European and Indian traditions, Christianity, Judaism and Islam). The African, Pacific, American and Southeast Asian religions have their examples almost entirely as outsiders’ field records (the colonial and missionary period, nearly all of it written by people who were not members), and that is marked on each record as the book’s own view, to be read beside the peoples’ own published accounts where they exist. The weakest rows are structural: the newer movements are nearly all after 1930; much of the East Asian family is the 20th-century new religions of Japan, Korea, China and Vietnam (Tenrikyō, Caodaism, Falun Gong); the Afro-diasporic religions were secret and oral, and the open records are from outsiders (Seabrook and Puckett; the planters, officials and travellers St John, Hearn, Edwards and Stedman; Beckwith’s Jamaica), and most are hostile or romantic.

## Traditions with no example yet

† marks a tradition whose parent in the Atlas has a readable example, so a reader can start there. 249 traditions are listed; the fuller table, with the number of Atlas text records for each, is `COVERAGE_BY_TRADITION.csv`.

**Abrahamic religions** (65 of 207): Barghawata religion †; Musta'li Ismailism †; Yasawiyya †; Shadhiliyya †; Mahdavia †; Dawoodi Bohra †; Ukrainian Greek Catholic Church; Kakure Kirishitan (Hidden Christians); Dönmeh; Tijaniyya †; Cofradía de San José; Musar movement; Strangite Latter Day Saints; Barelvi movement †; Layène †; Mouride Brotherhood (Muridiyya) †; Black Hebrew Israelites; Mormon fundamentalism; Quranism †; Mariavite Church; Rizalista movements; Pentecostalism; Kitawala (African Watchtower); Antoinism; Nazareth Baptist Church (amaNazaretha); Harrist Church; Oneness Pentecostalism; Iglesia ni Cristo; True Jesus Church; Aladura movement; Kimbanguist Church; Local Churches (Watchman Nee); Musama Disco Christo Church; Reconstructionist Judaism; Zion Christian Church; Cherubim and Seraphim; Rātana Church; Akurinu (Arata a Roho); La Luz del Mundo; Tablighi Jamaat †; Davidians and Branch Davidians; Tijaniyya Fayda (Niassene) †; Church of the Lord (Aladura); Nation of Islam †; African Apostolic Church of Johane Marange; Gospel of God Church (Johane Masowe); Santa Muerte devotion; Christ Apostolic Church; Celestial Church of Christ; Guta ra Jehova; Lumpa Church; Unification Church (Family Federation); Brotherhood of the Cross and Star; Christian Fellowship Church; Messianic Judaism; Jewish Renewal; Humanistic Judaism; Legio Maria; Nation of Gods and Earths (Five-Percenters) †; The Family International; United Submitters International †; Members Church of God International (Ang Dating Daan); Shincheonji Church of Jesus; Church of Almighty God; Eritrean Orthodox Tewahedo Church.

**Indian religions** (36 of 109): Harappan (Indus Valley) religion; Vietnamese Buddhism †; Korean Seon †; Mahanubhava Panth †; Jonang †; Trúc Lâm Zen †; Pranami Sampradaya †; Śvetāmbara Terāpanthī †; Bửu Sơn Kỳ Hương †; Nirankari (Sikh reform) †; Namdhari †; Mahima Dharma †; Matua Mahasangha †; Thai Forest Tradition †; Vipassanā movement †; Won Buddhism †; Reiyūkai †; Self-Realization Fellowship †; Sant Nirankari Mission †; Sōka Gakkai †; Kanji Panth †; Brahma Kumaris †; Shinnyo-en †; Risshō Kōsei Kai †; Hòa Hảo †; Sathya Sai Baba movement †; Dera Sacha Sauda; Ananda Marga †; Transcendental Meditation movement †; Navayana (Ambedkarite Buddhism) †; ISKCON (Hare Krishna movement) †; Plum Village Tradition †; Triratna Buddhist Community †; Dhammakaya Movement †; Sahaja Yoga †; Agonshū †.

**East Asian religions** (30 of 48): Vietnamese folk religion; Way of Great Peace; Shangqing (Highest Clarity); Lingbao (Numinous Treasure); Moism (Zhuang); Dongba religion (Naxi); Shugendō †; Onmyōdō; Mazu worship; Ryukyuan religion; Đạo Mẫu (Mother Goddess worship); Kurozumikyō †; Tenrikyō †; Konkōkyō †; Yiguandao †; Ōmoto †; Jeungsanism; Daejonggyo; Perfect Liberty Kyōdan †; Caodaism; Seichō-no-Ie †; Sekai Kyūseikyō †; Dejiao (Teaching of Virtue); Sūkyō Mahikari †; Đạo Dừa (Coconut Religion); Daesoon Jinrihoe; Jeungsando; Tiandi Jiao (Lord of Universe Church); Happy Science; Falun Gong.

**Other new religious movements** (24 of 24): Meher Baba movement; Santo Daime; Barquinha; Scientology; Unarius Academy of Science; Aetherius Society; Vale do Amanhecer; União do Vegetal; Discordianism; Eckankar; Church of Satan; Rajneesh movement (Osho); Heaven's Gate; Raëlism; Temple of Set; Church of the SubGenius; Aum Shinrikyo (Aleph); Jediism; Terasem Movement; Dudeism; Pastafarianism; Kopimism; The Satanic Temple; Way of the Future.

**African traditional religions** (16 of 56): Serer religion (A ƭat Roog); Jola religion (Awasena); Nuer religion; Rwandan and Burundian religion (Imana); Senufo religion (Poro); Venda religion; Dogon religion; Lovedu religion; Xhosa cattle-killing movement; Maji Maji movement; Mumboism; Njoya's religion (Nwet Kwete); Ìjọ Ọ̀rúnmìlà Adúláwọ̀ (Church of Orunmila) †; Dini ya Msambwa; Godianism; Afrikania Mission.

**Contemporary Paganism** (16 of 18): Dievturība; Taaraism; Rodnovery (Slavic Native Faith); Church of All Worlds; Order of Bards, Ovates and Druids †; Romuva; Heathenry (Ásatrú); Goddess movement; Dianic Wicca †; Reclaiming †; Roman polytheistic reconstructionism; Kemetism; Hellenism (Hellenic polytheism); Natib Qadish; Suomenusko; Zuism.

**Indigenous religions of Australia and the Pacific** (13 of 30): Chamorro religion; Kanak religion; Koreri movement; Parihaka movement; Ringatū; Iharaira (Rua Kenana); Modekngei; Vailala Madness; John Frum movement; Yali movement; Paliau movement; Prince Philip Movement; Pomio Kivung.

**Afro-diasporic religions** (13 of 21): Garifuna religion (Dügü); Candomblé †; Palo (Regla de Congo); Santería (Regla de Ocha / Lucumí) †; Spiritual Baptists (Shouters); Batuque †; Abakuá; Tambor de Mina; Orisha religion of Trinidad †; Xangô do Recife †; Cult of María Lionza; Umbanda †; Quimbanda †.

**Western esoteric and metaphysical currents** (9 of 25): Hermetic Order of the Golden Dawn †; Thelema †; Fourth Way; Agni Yoga (Living Ethics) †; Martinus Cosmology; 'I AM' Activity †; Urantia movement; Summit Lighthouse (Church Universal and Triumphant) †; A Course in Miracles movement.

**Prehistoric evidence** (7 of 10): Middle Palaeolithic burial and ochre ritual; Upper Palaeolithic art and ritual; Natufian ritual and burial; Neolithic cults of Anatolia and the Levant; Neolithic figurine cults of Old Europe; Saharan Neolithic cattle cult; Neolithic ritual cultures of China.

**Indigenous religions of Southeast Asia** (6 of 22): Marapu (Sumba); Aluk To Dolo (Toraja); Sulod (Panay Bukidnon) religion; Sunda Wiwitan; Parmalim; Subud.

**Pre-Christian Europe** (4 of 21): Nuragic religion; Umbrian and Oscan religion; Roman imperial cult †; Cult of Sol Invictus †.

**Indigenous religions of the Americas** (4 of 52): Archaic mound-builder religion; Norte Chico (Caral) religion; Yanomami religion; Kogi and Arhuaco religion.

**Ancient Near East** (2 of 14): Elamite religion; Urartian religion.

**Iranian religions** (1 of 11): Ossetian traditional religion (Uatsdin) †.

**Inner Asian and Arctic religions** (1 of 16): Modern Tengrism (Tengrichilik).

**Indigenous religions of South and Himalayan Asia** (1 of 11): Donyi-Polo.

**Humanist and rationalist traditions** (1 of 8): Sunday Assembly.


## Religions, offshoots and peoples the Atlas does not have

**Done 17 November 2026:** every row of this table was added to the Atlas as a tradition (72 in all, the Pueblo peoples among them) except the Itelmen (too thinly attested to describe without guessing). The Zuni and the other Pueblo peoples were left out of the first pass under an exclusion of the sacred religion of living peoples; that exclusion was withdrawn on 17 November 2026 and a second pass added them (the Zuni, Hopi, Keresan and Tanoan Pueblo rows) and put the ceremonial back on 13 rows. What each rests on is in `FACT_CHECK.md`.

The Atlas listed 721 traditions when this table was made. These I could not find by name (checked against names and ids on 16 November 2026), grouped by the kind of gap. **Nearly every one has open sources that the Library could hold**; where it already holds one, that is noted. They are suggestions for the Atlas; the data belongs to the sessions that maintain it, so I have changed nothing in `atlas/`.

| Gap | What it is | In the Library already |
|---|---|---|
| **Ancient peoples** | | |
| Philistine religion | Dagon and the gods of the five coastal cities, neighbours and enemies of Israel; part of the Sea Peoples | Macalister, *The Philistines* (x-phi); *Gezer* |
| Edomite and Ammonite religion | Qos of Edom and Milkom of Ammon; Israel’s other neighbours beside Moab | the Moabite Stone, in Cooke’s inscriptions (x-cns) |
| Kassite religion | Babylon under the Kassites, about 1531–1155 BCE | |
| Phrygian, Lydian, Lycian and Luwian religion | The cults of Anatolia beyond the Hittites | Showerman, *The Great Mother of the Gods* (x-gmg); Herodotus |
| Dacian and Getic religion (Zalmoxis) | The Thracian-speaking peoples of the lower Danube | Herodotus, Book IV (x-hrd) |
| Illyrian; Iberian, Celtiberian and Lusitanian; Pictish; Gaulish (Gallo-Roman) | Pre-Roman Europe west and south of the Celtic and Germanic worlds | Tacitus (x-ger) for the Germans; none for these |
| Basque (pre-Christian) and Magyar paganism | Two survivals of the old European religions | |
| Sarmatian and Alan | The steppe peoples between the Scythians and the Ossetians (who are in the Atlas) | |
| **Christian dissent and sects** | | |
| Free Spirit, Beguines and Beghards | Lay movements of the 13th and 14th centuries, condemned in 1311–12 | Lea, *History of the Inquisition* (x-lea) |
| Fraticelli (Spiritual Franciscans) | The Franciscans who held to the rule of poverty; burned from 1318 | Lea (x-lea) |
| Priscillianism and Pelagianism | Two fourth- and fifth-century heresies, beside Arianism, Donatism and Marcionism, which are in the Atlas | Augustine’s anti-Pelagian writings (NPNF vol. 5) |
| Khlysty and Skoptsy | The Russian “flagellant” and castrating sects of the 17th–19th centuries | Conybeare, *Russian Dissenters* (x-rud) |
| Ranters, Diggers and Muggletonians | The English radicals of the 1640s and 50s, beside the Quakers | |
| Maronite and Melkite Churches | Two Eastern Churches of Syria and Lebanon in union with Rome | |
| Nubian Christianity (Makuria) | The Christian kingdoms of the Nile, 6th–15th centuries | |
| Snake-handling churches | The Appalachian Pentecostal sign-following churches, from about 1910 | |
| **Islam** | | |
| Ni‘matullāhī order | The great Persian Sufi order | Brown, *The Dervishes* (x-bdv) on the Ottoman orders |
| Qalandar and Malamati currents | The wandering and the “blame-seeking” Sufis | |
| **India and Tibet** | | |
| Advaita Vedanta, as a named school | Śaṅkara’s non-dualism, now only inside Hinduism and Shaivism | Shankara’s commentaries and the Upanishads |
| Aghori and Kapalika | The skull-bearing Shaiva ascetics | |
| Shrauta (Vedic) ritual | The solemn fire sacrifices | The Brahmanas |
| Ayyavazhi | The Tamil faith that began in 1833 | |
| Siddha Yoga | The Muktananda lineage | |
| Kalachakra tradition and the Rimé movement; Dzogchen; Shambhala | Strands of Tibetan Buddhism | Waddell, Francke and Bell (x-wad, x-fai, x-bpl) |
| **China and the Americas** | | |
| Three-in-One teaching (Sanyi jiao) | Late-Ming Confucian, Daoist and Buddhist union | |
| Curanderismo | Mexican and Andean folk healing | |
| Toltec religion | The Quetzalcoatl tradition as the Aztecs told it | Bancroft, vol. III (a-bnc); the Florentine Codex |
| **Esoteric and general** | | |
| Astrology; Alchemy; Mesmerism; the Illuminati; Perennialism and Traditionalism | The currents beside the Atlas’s Western esoteric family | the occult shelf |
| Cargo cults, as a whole | The Atlas has the individual cults (John Frum, Yali, Paliau, Vailala Madness), not the pattern | |
| **Peoples the Library can read, with no tradition** | | |
| Bontoc Igorot and Tinguian religion | Two northern Luzon peoples the Atlas lacks (it has the Ifugao and the Kalinga) | Jenks (a-jen); Cole (a-tin, a-tit) |
| Karen and Shan religion | Two peoples of Burma: the lost book, the *la* (soul) and the nats; the Shan *phi* | Marshall (a-kar), Milne (a-shn) |
| Naga religions (Angami, Sema, Lhota, the Manipur Nagas) | The hill peoples between Assam and Burma: spirits, *genna* days, feasts of merit | Hutton (a-hut, a-hus), Mills (a-mil), Hodson (a-hod) |
| Andamanese religion | The Andaman Islanders: Biliku, Tarai, the spirits of the dead | Radcliffe-Brown (a-and) |
| Kamba (Akamba) and Lango religion | East African peoples: Mulungu and the *aimu*; Jok | Lindblom (a-lin), Driberg (a-dri), Hobley (a-hob) |
| Ibibio and Ekoi religion | The Cross River peoples (the Atlas has the Efik Ekpe society) | Talbot (a-tal, a-talb) |
| Koryak, Yukaghir and Itelmen religion | The peoples of the far north-east of Siberia | Jochelson (a-joch), Bogoras (a-ykt) |
| Pawnee, Omaha, Zuni and other Plains and Pueblo peoples | Peoples whose ceremonies are described in the field records | a-hako, a-omah (the Zuni, Hopi and the other Pueblo peoples were left out of the first pass and added in the second, on 17 November 2026) |
| Thonga and Ila religion | Southern and Central African peoples | Junod (a-junod), Smith and Dale (a-ila) |

## How the traditions are connected

The Atlas has **382 recorded interactions** between traditions: derivations (105), influences (75), syncretisms (37), schisms (29), persecutions (26), conversions (26), suppressions (20), reforms (16), revivals (13), conflicts (12), transmissions (12), absorptions (5), dialogues (4) and coexistences (2). That is a good set of the big events, but it leaves most of the map unconnected.

**Traditions with no recorded link:** 440 of 721 (61%). The family table above gives the number for each family. The worst: all 22 Southeast Asian indigenous religions, all 11 of South and Himalayan Asia, 23 of the 24 newer movements, 40 of 56 African, 39 of 52 American, 36 of 48 East Asian and 20 of 30 of the Pacific.

**Families linked to each other.** The Atlas links 38 of the 190 possible pairs of different families, and 15 of the 20 families link their own members to each other. The best-linked: Abrahamic with itself (113 links), Indian with itself (39), Abrahamic with European (20), Abrahamic with Indian (16), with the Americas (13), with the Pacific (10), African with Afro-diasporic (10). The pairs with **no** link at all, though history gives plenty: **Indian religions and Southeast Asia** (Hinduism and Buddhism in Cambodia, Java, Burma, Siam; the Library now holds Shway Yoe on the Burmese *nat* beside Buddhism and Young on the Thai *phi* beside it), **Abrahamic religions and Southeast Asia** (Islam in Java and Sumatra, Christianity in the Philippines), **the Indian religions and the indigenous religions of South Asia** (Hinduism and the hill peoples: the Library has Hutton on the Nagas, Roy on the Oraons, Russell on the tribes of the Central Provinces), the other new religious movements and the Indian religions or the Western esoteric family (Osho, Meher Baba, Eckankar and the currents they came from), and the Ancient Near East and Egypt (Canaan under Egyptian rule, the Amarna letters in x-syg). Weakly linked: the Abrahamic religions and Egypt (1 link), the Indian and Iranian religions (1), the Abrahamic religions and Inner Asia (1).

**Suggested links.** `SUGGESTED_ATLAS_LINKS.csv` has 89 rows (source, type, target, and why) that the texts in the Library support and the Atlas lacks. Sixty-six came from the first reading (among them Mandaeism → Manichaeism, Zurvanism → Zoroastrianism, Sethian Gnosticism → Manichaeism); fifteen came from the books added in rounds 12 and 13: the Lollards and the Hussites (Wyclif and Hus), the Reformed faith and the Waldensians, Sufism and Akbar’s Din-i Ilahi, Tendai and Nichiren, the *nat* and Theravada in Burma, the *phi* and Theravada in Siam, the conversion of Tahiti, Hawaii and Fiji (Ellis, Brewster), the Hausa Bori and Islam, Anglicanism and the Plymouth Brethren, and Kabbalah and Hasidism. Eight more came from the books of round 14: the Sant Mat and Radhasoami, the shaman and the Buddhist and Confucian in Korea, Islam and the old religion of Java, the Khmer *neak ta* and Buddhism, the Turks’ sky-god beneath Islam, and Shingon and Tendai with Shinto in Japan. Each row’s source and target are Atlas ids that exist and are not already linked; the reasons name the Library texts that show the link.

## What cannot be filled from open sources

These are the real limits, not a lack of effort. Each is a rule of the project (open texts only) or a fact of what was ever written down. (The rule “nothing restricted reproduced” that stood here was withdrawn on 17 November 2026; see the bullet on sacred and restricted rites.)

* **Texts first published after 1930.** US public domain in 2026 means first published before 1931. So: every English translation of the **Ugaritic** tablets (the Baal Cycle, Kirta, Aqhat), found at Ras Shamra in 1929 and first printed in French in 1929–31; the **Pyrgi tablets** (1964); **Linear B** (deciphered 1952); the **Dead Sea Scrolls** in English (from 1947: the Library holds only the Qumran translations that are open); the later scholarship on nearly every tradition. This is why the **Canaanites, the Etruscans, the Urartians and the Hurrians** have only the older inscriptions and the archaeologists’ books, not the translations that a reader would want.
* **The newer religious movements** (Scientology, Eckankar, Raëlism, Aum Shinrikyo, Heaven’s Gate, ISKCON, the Urantia Book, A Course in Miracles and most of the 24-tradition family): written after 1930, in copyright, and owned by the movements.
* **Sacred and restricted rites of living peoples.** *Withdrawn on 17 November 2026: the project holds all human religion, and copyright is the only limit on what is included; the exclusion described here is kept as it was written, so that the books it names can be found and added.* Left out of the first rounds, by a rule since withdrawn: Lumholtz’s *Symbolism of the Huichol Indians*, Densmore’s *Chippewa Music*, the Hopi Katcina cult, Dorsey’s Cheyenne Sun Dance and other accounts of the ceremonies of living peoples, the Nusayri (Alawite) secret books. Where a record is old and general (Matthews’s Night Chant, Mooney’s Ghost Dance, Fletcher’s Hako), it is in the Library, marked as an outsider’s record. **Now in (rounds 22 and 23, 17 November 2026):** Lumholtz’s *Symbolism of the Huichol Indians* was already in; Densmore’s *Chippewa Music* I and II and her Teton Sioux, Mandan and Hidatsa, Pawnee and Papago volumes, Fewkes on the Hopi katcinas, Hano altars and Flute and Snake ceremonies, Stevenson’s *Zuñi Indians* and *Sia*, Voth’s Oraibi ceremonies, Dorsey’s *Arapaho Sun Dance* and *Cheyenne*, Wissler, Lowie and Skinner on the Blackfoot, Crow, Shoshone and Menomini, Matthews’s *Mountain Chant*, Boas on the Kwakiutl secret societies and Roth’s Queensland records (round 22); the Nusayri secret book in Salisbury’s notice of 1866, the Masonic exposures (Prichard, *Jachin and Boaz*, the *Three Distinct Knocks*, Morgan, Bernard, Allyn, Duncan), the Nauvoo endowment as two who left reported it, the *Sixth and Seventh Books of Moses*, Mead’s *Mithriac Ritual*, Taylor on Eleusis, and the rest of round 23. The full sorting is in `LEFT_OUT_SORTED.md`.
* **Oral traditions without an open written record.** Most of the African, Amerindian, Pacific and Siberian religions were written down only after 1930, or by outsiders; their own tellers’ texts are in copyright or not open. The Library gives the observers’ records of the colonial period, labelled as such, beside the few open collections by members of the communities.
* **The Afro-diasporic religions** (Vodou, Candomblé, Santería, Obeah, Winti, Palo, Abakuá): initiated, oral and secret; the open record is from outsiders, and almost all of the English-language record is later than 1930 (Herskovits’s *Life in a Haitian Valley* is 1937; Bastide’s *African Religions of Brazil* is 1958).
* **Undeciphered scripts**: the Indus seals, Linear A, Proto-Elamite, *rongorongo* (Easter Island).
* **The Neolithic and the Palaeolithic** (the 10 traditions of the “Prehistoric evidence” family) have no texts at all, by definition; the Library’s books on cave art and the Dreaming stand in for them.

## What rounds 12 to 20 added

Nine rounds, 314 texts in all, were built from this assessment (items 17 to 25 of `TEXT_AUDIT.md`). **Round 12** (76 texts, 78 MB) went after the missing offshoots and dissenters (Lea’s *Inquisition*, the Waldenses, Wyclif, Hus, the Doukhobors, the Plymouth Brethren, Graetz’s six-volume *History of the Jews*, the Babi and Druze sources, the Sufi orders, the Ain-i Akbari), the religions of India, Tibet and Japan (Farquhar, Bhandarkar, Waddell, Suzuki, Anesaki), the new and secular movements (Oahspe, the Aquarian Gospel, the Watch Tower’s Harp of God, the Christadelphians, Ingersoll, Holyoake, Haeckel), Minoan and early Rome and Greece (Nilsson, Evans, Showerman, Tacitus, Herodotus) and 40 field records. **Round 13** (28 texts, 42 MB) added mostly Africa, the Pacific, Southeast and South Asia, the Arctic and North America. **Round 14** (49 texts, 36 MB) went after the thinnest families: Southeast Asia (Marsden, Raffles, Crawfurd, the Igorot and Tinguian, Mouhot, the Burmese, Karen and Shan), Inner and East Asia (Huc and Gabet, Rockhill, Ossendowski and Carruthers, Czaplicka and Vámbéry, Korea, Chinese folk-lore), the Afro-diasporic religions (Haiti, Martinique, Jamaica, Surinam, Guiana), the sects of India and the schools of Japan.

On the maker’s “don’t be afraid to continue on your own, let’s get as close as we can to covering all the religions”: **round 15** (34 texts, 35 MB) the Andes, the Mapuche and Chaco, the Amazon and Guianas, Mexico and the African peoples with no field record yet (the Dinka and pygmies, the Fang, Benin, the Banyoro and Banyankole, the Kuba, the Chewa, the Luo, the Oromo, the Berbers and Mande); **round 16** (51 texts, 48 MB) the Eastern Churches, the Protestant denominations and American communities, the Reform, Conservative and Orthodox movements in Judaism, the Wahhabis, the Mahdi, the Ibadi and Zaydi Muslims and the Assassins, the Sikhs, the Chamars, the Pacific and the Etruscans; **round 17** (24 texts, 20 MB) the sects and village religion of India, Buddhism’s history and schools, the Circassians and Slavs, the Iroquois and the archaeology of Mexico and of the mounds; **round 18** (20 texts, 18 MB) the Taiping, de Groot’s Chinese sects, Korea, Malinowski’s Trobrianders, the Solomons, southern, central and eastern Africa from Livingstone to Krapf, Religious Science and the American Southwest; **round 19** (29 texts, 23 MB) Hasidism and the Sabbatean and Frankist movements, the Millerites, the Holiness, Restoration and Universalist movements, the Old Catholics, the Thomas Christians, the French Revolution’s cults, the Rosicrucians, Sufism in the West, the Ahmadiyya and the Moorish Science Temple, prehistoric Japan and the megaliths, early China, the Huichol and the Sun Dance; **round 20** (3 texts) the Bektashi, Kizilbash and Nusairis and the Chishti dargah at Ajmer.

One text was removed again: the Ahmadiyya book first used in round 16 turned out to be the 2010 reprint of a 1979 translation, which is in copyright; it was replaced by the 1910 translation. Every text added since round 12 was then checked for modern editions (ISBNs, copyright lines, reprint dates in the first and last pages).

**Still to harvest, from sources found but not fetched or not readable:** Northcote Thomas’s *Anthropological Report on the Ibo-speaking Peoples* (1913), Jochelson’s *Mythology of the Koryak* (1904), Hobley’s *Ethnology of A-Kamba* (1910), Teuira Henry’s *Ancient Tahiti*, Rose’s *Glossary of the Tribes and Castes of the Punjab*, Cowan’s *New Zealand Wars* volume II (Te Kooti and Parihaka: the scan has no text layer), Cary’s Roman Catholic volume on Japan (the hidden Christians), the Ain-i Akbari volume II and Oahspe volumes 2 to 7. **The biggest remaining holes**, which open sources cannot fill: the movements founded after 1930 and their scriptures (the 24 “other new religious movements” and most of Contemporary Paganism, the Japanese and Korean new religions, the Brazilian and Cuban Afro-diasporic religions, the African Independent Churches, Scientology and the rest), the Neolithic and Palaeolithic (no texts), and the African peoples whose standard accounts are of 1931 or later (the Nuer, Dogon, Venda, Lovedu, Serer and Jola).

## To re-run

```
python3 -I tools/build_atlas.py              # Atlas text records matched to the Library
python3 -I tools/assess_coverage.py          # this report's figures; writes COVERAGE_BY_TRADITION.csv
python3 -I tools/assess_coverage.py --without=ids.txt   # the same with some texts left out (before and after)
```

`tools/library_about.json` is the list of books mapped to the traditions they describe: add a line when a book is added, and the next run counts it.
