/* ═══════════════════════════ 27 · The Journey: stations, part A (deep time → Iron Age) ═══════════════════════════
   One station = one week. ST(era, title, when, readIds, blurb, rhyme, themes, [q1,q2,q3], practice, {w:words, r:rite, sh:shelf, ag:alsoSee})
   `read` ids must be unique across ALL stations (tests enforce full coverage of the library).
   `practice` is an id from PRACTICES (meditation) or PATH_PRACTICES. Apostrophes use ’ so strings stay simple. */

const PATH_STATIONS = [];
const ST = (era, title, when, read, blurb, rhyme, themes, q, practice, x = {}) => PATH_STATIONS.push({
  era, title, when, read: read ? read.split(' ') : [], blurb, rhyme, themes: themes.trim().split(/\s+/), q, practice,
  words: x.w || [], rite: x.r || '', shelf: x.sh ? x.sh.split(' ') : [], again: x.ag ? x.ag.split(' ') : [],
});

/* ── e1 · deep time ── */
ST('e1', 'The first dead', 'c. 100,000 – 40,000 BCE', '',
  'Burials at Skhul and Qafzeh (Israel) with red ochre and shell beads, about 100,000 years old, are among the earliest signs of ritual. Whether they show belief in an afterlife or simply grief and care, we cannot know. Honest history starts by saying so.',
  'Every culture studied marks death with ritual, and red ochre keeps appearing for blood and life on several continents.',
  'death rite',
  ['If you found a grave with ochre and shell beads but no writing, what would you conclude, and what would you refuse to conclude?', 'Death rituals look alike across the world. What do you think they are for: the dead, the living, or both?', 'Who do you want to remember you, and for what? Write the three lines you hope someone says.'],
  'fire', { r: 'Light a candle for someone who has died and say their name aloud.', sh: 'z-lew z-eli z-dur x-tyl x-fbi x-mao x-mtr x-lmr x-ftt x-jhr x-tsr x-mis x-mnr x-mpr x-mth' });

ST('e1', 'Cave minds', 'c. 40,000 – 12,000 BCE', '',
  'Chauvet (painted about 37,000 to 28,000 years ago), Lascaux (about 17,000) and the Lion-man carving (about 40,000) are the first art that looks like a spiritual world. David Lewis-Williams proposed that some imagery records trance experiences. It is a serious but contested idea.',
  'Dark, resonant caves, repeated hand-prints and animal images appear on every inhabited continent. Chavín in Peru and the Egyptian tombs used dark architecture for similar effects thousands of years later.',
  'ecstasy place',
  ['Why would someone paint in a cave’s deepest, darkest, most echoing chamber instead of near the entrance?', 'People in many cultures describe going "somewhere else" in dark, drumming or silence. What do these reports have in common?', 'Where is the darkest quiet place in your own home or workshop? What would it feel like to spend ten minutes there on purpose?'],
  'hum', { r: 'Sit in a dim room for ten minutes with no screen. Notice how the room sounds.', sh: 'z-lew z-her' });

ST('e1', 'The Dreaming', 'at least 50,000 – 65,000 years; oral', 'x-dre2',
  'Aboriginal Australians have the longest continuous cultural traditions we know. "The Dreaming" is a single English word standing for many different concepts in many different languages. Stories fixed to landforms, some of them likely remembering sea-level rises about 7,000 years ago (Nunn and Reid, 2016), act as a living map, law and library.',
  'Place and story are bound together elsewhere too: the Psalms, the Thanksgiving Address, Andean huacas. Sacred land is a worldwide idea.',
  'creation nature place ancestors time flood',
  ['A story that is also a map and also a law: what does a culture need to remember so that all three work together?', 'Many peoples bind their stories to a landscape (Aboriginal songlines, the Andean huacas, Hebrew "holy mountains"). What does that do that a book cannot?', 'What are the stories of the place where you live? Who first walked it, and what was their name for it?'],
  'listen', { r: 'Find out whose land you live on and what its first names were. Walk it once, slowly, with that in mind.', sh: 'z-sta z-nun x-fte x-bpr', w: [['dadirri', 'Ngan’gikurunggurr (N. Territory)', 'deep, quiet listening; a name for the contemplative practice Miriam-Rose Ungunmerr taught widely']] });

ST('e1', 'The trance dance', 'age unknown (rock art shows it for thousands of years); living', '',
  'Among the San of southern Africa, healing dances run through the night: rhythmic clapping, singing, and healers who describe a heat in the belly (n/um) rising up the spine. Richard Katz lived with the Ju/’hoansi in the 1960s–70s and recorded the community role of the dance. Rock art shows the same imagery in rock shelters for thousands of years.',
  'Rhythmic, communal singing leading to altered states appears among the San, Pentecostals, Sufi dhikr, Haitian Vodou and Siberian drummers. Each is held by a community and a lineage.',
  'ecstasy rite',
  ['What is the difference between an altered state that is held by a community and one taken alone?', 'The same ingredients (rhythm, singing, repetition, fatigue) show up in very different traditions. What does that suggest?', 'When did you last make music, sing or dance with other people in a shared rhythm? What did it do to your mood the next day?'],
  'drum', { r: 'Clap or tap a steady slow beat with someone for five minutes. Or sing one line together.', sh: 'z-kat', w: [['n/um', 'Ju/’hoan', 'spiritual potency felt as heat; "boiling energy" in Katz’s phrase']] });

ST('e1', 'Shaman', 'tens of thousands of years; the word is 17th century', '',
  '"Shaman" comes from Evenki (Siberia) šaman, via Russian, and was exported to describe unrelated roles in many cultures. Mircea Eliade’s 1951 "archaic techniques of ecstasy" made it famous and has been criticised for lumping different practices together. Arctic, Amazonian, Korean (mudang) and Filipino (babaylan) healers all differ.',
  'Healers who travel to other realms for their community are widespread. Their training, ethics and accountability differ a great deal, and so do the dangers.',
  'ecstasy descent',
  ['Why might a community need someone whose role is to journey and return?', 'What is lost when a very particular practice is renamed with a general word like "shamanism"?', 'Who has been the healer or spiritual go-between in your own family or town? Who do you go to when you are in trouble?'],
  'drum', { r: 'Make a simple rattle (rice in a jar). Use it for five minutes as a steady pulse while you sit.', sh: 'z-eli x-mr04' });

/* ── e2 · the first settlements ── */
ST('e2', 'Göbekli Tepe and Çatalhöyük', '9500 – 5700 BCE', '',
  'At Göbekli Tepe (Türkiye), hunter-gatherers carved and raised T-shaped pillars up to 5 m high, c. 9500 BCE, before farming. Klaus Schmidt called it a temple; others suggest feasting halls. At Çatalhöyük people lived in packed houses and buried the dead under the floors, among plastered skulls and painted walls.',
  'Gathering places that are also burial places show up everywhere: Neolithic Europe, Jericho, the Andes, the Maya. The living and the dead share space.',
  'place ancestors rite',
  ['If the people who built Göbekli Tepe had no farms, what does that say about whether religion or agriculture came first?', 'Houses that doubled as tombs: what does that suggest about how these people understood the dead?', 'How close do you want the people you have lost to be in your daily life? What objects or rooms carry them?'],
  'circle', { r: 'Make a small circle of stones, shells or candles at home. Sit in it for five minutes.', sh: 'z-sch z-hod x-oih x-rss' });

ST('e2', 'Stone and sun', '4500 – 2500 BCE', '',
  'Newgrange in Ireland (c. 3200 BCE) has a passage that is lit for a few minutes at the winter-solstice sunrise. Carnac, Stonehenge, Nabta Playa (Egypt) and many others are aligned to the sun or stars. The builders left no writing.',
  'Solstice and equinox celebrations in nearly every culture: Saturnalia, Yule, Dongzhi, Inti Raymi, Christmas. The turning of the year is the world’s oldest shared calendar.',
  'time place',
  ['Why would people spend generations moving huge stones to catch one sunrise?', 'The winter solstice carries a festival of light in many cultures that never met. Which of those festivals do you celebrate without knowing its history?', 'The next winter solstice is around 21 December. What would you like to mark?'],
  'sun', { r: 'Watch one sunrise or sunset in full this week. No phone. Note where the sun is against a landmark.', sh: 'z-hu2 x-fwn x-tmd x-shr x-thr x-zam x-kdr x-mjp x-frg x-evi' });

ST('e2', 'The goddess question', '7000 – 3000 BCE', '',
  'Thousands of female figurines (the "Venuses") have been found from Europe to Asia. Marija Gimbutas read them as a peaceful Great Goddess culture; Ronald Hutton, Ian Hodder and most archaeologists consider the evidence far thinner. The figures are real; the story told about them is a modern interpretation.',
  'The divine feminine in later periods is on record: Inanna, Isis, Asherah, Sophia, Tara, Guanyin, Mary, Pachamama. Whether it descends from a single Neolithic root is disputed.',
  'feminine creation',
  ['What would it take to prove that a figurine was worshipped, and not a toy or a portrait?', 'Why are modern people so drawn to the idea of a lost peaceful goddess age? What does the story do for us?', 'Which women have been the spiritual centre of your family? What did they teach without teaching?'],
  'earth', { r: 'Press your hands into soil or sit on the ground outdoors for ten minutes. Say thanks to the earth.', sh: 'z-hut x-nmm x-pom' });

/* ── e3 · first cities, first writing ── */
ST('e3', 'Sumer: the first gods in writing', 'c. 3500 – 2000 BCE', 'x-sum x-shy x-gud x-bmi',
  'The Sumerians (southern Iraq) wrote the oldest religious texts we can read: hymns, myths and temple records on clay. Each city had a patron god and a temple that was also the economic centre. The idea of the me (divine powers that run civilization) is the first "operating system" for a religion.',
  'City, temple, priesthood and writing arrive together in Egypt, India, China and the Andes. Religion becomes institutional.',
  'creation law canon',
  ['A god who "owns" a city and a temple that runs its granaries: how does this change what religion is?', 'Writing makes a god’s name permanent. Does it also make belief more rigid?', 'What is the "me" of your own household or work: the small powers (cooking, building, listening) that keep it going?'],
  'read', { sh: 'z-ass x-jrb x-sbr x-scu', w: [['dingir (𒀭)', 'Sumerian', 'god, sky; the cuneiform sign placed before divine names'], ['me', 'Sumerian', 'the divine powers or decrees that make culture function: kingship, justice, craft, music']] });

ST('e3', 'Enheduanna: the first named author', 'c. 2300 BCE', 'x-enh',
  'Enheduanna, daughter of Sargon of Akkad and high priestess of the moon-god at Ur, wrote hymns to Inanna that are the first works we can attribute to a named person. She writes in the first person ("I, Enheduanna"), pleads for help after being driven out, and praises Inanna as mistress of all the me, the divine powers that order the world (the poem is called Nin-me-šara).',
  'The first named author is a woman, a priestess, and a mystic poet. Mystical poetry in the first person recurs in Rumi, Mirabai, Julian, the Psalms.',
  'feminine mystic canon',
  ['What changes when a sacred text is signed by a person, not given to a prophet?', 'Compare Enheduanna’s hymn with a Psalm of lament. What do both ask of the divine?', 'What would you write if you had to address your own deepest need as a hymn? Try three lines.'],
  'read', { w: [['nin-me-šara', 'Sumerian', '"Lady of all the me", Enheduanna’s title for Inanna']] });

ST('e3', 'Inanna’s descent', 'copies c. 1900 BCE; myth older', 'x-inn x-tam',
  'The goddess Inanna goes to the underworld. At each of seven gates she has to give up a piece of her regalia until she stands naked and is killed. She is revived and returns, but someone must take her place. It is the oldest descent-and-return story we have.',
  'Descent myths: Orpheus, Persephone, Osiris, the Maya Hero Twins, Odin on the tree, Jesus’s "harrowing of hell", initiation caves. Each asks what is stripped away on the way down.',
  'descent death feminine',
  ['Why do you think each gate requires her to give something up?', 'Compare Inanna’s stripping with the Hero Twins at Xibalba and Persephone’s return. Which survives, and what do they bring back?', 'What have you set down at a hard time in your life that you later realized you did not need?'],
  'gates', { r: 'Write seven things you carry (role, worry, identity, grudge, habit…). Burn or tear one a night for seven nights.', w: [['kur-nu-gi₄', 'Sumerian', '"land of no return": the underworld']], sh: 'x-fao' });

ST('e3', 'Egypt: the Pyramid Texts', 'c. 2350 BCE', 'x-pyr x-goe',
  'One of the oldest bodies of religious writing in the world, and the oldest carved in stone, is inside the pyramids at Saqqara. These spells help the dead king rise to the sky, join the stars and become Osiris. Egyptians described the person as several parts: the ka (life-force), the ba (personality, shown as a bird) and the akh (transfigured spirit).',
  'Afterlife by ascent to the stars, in Egypt, parallels shamanic sky journeys, Zoroastrian ascent and Revelation’s heavenly city. "Breath of life" is ancient Egyptian too.',
  'death breath creation',
  ['A text inscribed for the dead alone, not for the living: what does it say about what the Egyptians thought mattered most?', 'The ka-ba-akh division finds echoes in Greek psyche/pneuma/nous and Hebrew nefesh/ruach/neshamah. Why do so many cultures split the self?', 'If you had to explain what part of you outlasts your body, would you use one word or several?'],
  'dawn', { r: 'Stand facing the morning light and raise both arms in the ka posture for three slow breaths.', w: [['ka, ba, akh', 'Egyptian', 'life-force or double; personality-soul; transfigured spirit'], ['ankh (ꜥnḫ)', 'Egyptian', 'life']], sh: 'x-ehr x-bdr x-mr12 x-sae' });

ST('e3', 'Cities without words', 'c. 3000 – 1800 BCE', '',
  'The Indus cities (Harappa, Mohenjo-daro) and Caral–Supe in Peru were planned, large and apparently peaceful. The Indus script is undeciphered and Caral had no writing. We have a Great Bath, seals and public plazas, but no texts. Claims about "proto-Shiva" seals are guesses.',
  'Ritual washing and plazas for gathering recur in religion: mikveh, wudu, baptism, Hindu snana, Shinto misogi, Andean sunken courts.',
  'place rite',
  ['What can we say about the religion of a people who left no words? What must we refuse to say?', 'Ritual water appears in almost every tradition. What might it be doing in the body and mind, apart from meaning?', 'What do you do each day with water (wash, drink, shower) that you could do on purpose as a ritual?'],
  'wash', { r: 'Wash your hands and face slowly with warm water. Take three breaths. Say what you are washing away.', sh: 'z-pos' });

ST('e3', 'Ptahhotep: the first wisdom book', 'Old Kingdom setting; copies c. 2000 BCE', 'x-pta',
  'The "Instruction of Ptahhotep" is a vizier’s advice to his son: be humble, speak less, listen well, treat wives, servants and subordinates with kindness. The book prizes listening: hearing benefits the one who hears. It is one of the oldest books of advice in the world.',
  'Practical wisdom for ordinary life appears in every literate culture: Proverbs, Sirach, the Analects, the Hávamál, the Tirukkural.',
  'wisdom law',
  ['What does Ptahhotep think a good listener gains?', 'Compare his advice with a proverb from your own family. Which feels older?', 'Whose advice would you listen to this week if you really tried? Who would be the hardest person to listen to?'],
  'listen', { w: [['maat (mꜣꜥt)', 'Egyptian', 'truth, justice, cosmic order; also the goddess who personifies them']] });

ST('e3', 'The ocean people', 'from c. 3000 BCE; epics recorded in the 20th century', 'x-hin x-lam x-hud',
  'Speakers of Austronesian languages left Taiwan about 3000 BCE and reached the Philippines by about 2000 BCE. Their descendants include Filipinos, Polynesians, Māori and Malagasy. Before Spain, Filipino communities honoured ancestral spirits (anito), nature spirits (diwata) and ritual specialists (the babaylan, usually women). The great oral epics (Hinilawod, Biag ni Lam-ang, Hudhud) were written down only recently but are orally much older.',
  'Ancestor-honouring, spirit-filled landscapes and women ritual specialists appear across Africa, the Americas and Asia. In the Philippines they survive inside folk Catholicism.',
  'ancestors kinship nature feminine',
  ['What do the epics treat as most worth singing about: war, journeys, marriage, ancestors?', 'Where do you see the pre-Christian world still showing in Filipino Catholicism (Undas, Santo Niño, the Pasyon)?', 'What does kapwa ("the shared self") ask of you toward the families around you?'],
  'ancestors', { r: 'Ask a friend, neighbor or relative about a custom their family keeps and why. Listen without correcting.', sh: 'z-enr', w: [['anito', 'Tagalog', 'ancestral spirit, nature spirit'], ['babaylan', 'Visayan', 'priestess, healer, mediator with the spirit world'], ['kapwa', 'Filipino', '"shared self": the other as part of oneself'], ['loob', 'Filipino', 'inner self, will and heart'], ['hininga / ginhawa', 'Tagalog', 'breath; breath, also ease and well-being']] });

/* ── e4 · bronze age ── */
ST('e4', 'Hammurabi and the written law', 'c. 1754 BCE', 'x-ham',
  'Hammurabi of Babylon had 282 laws carved on a stele, headed by an image of him receiving authority from the sun-god Shamash. The prologue says the king set it up so that justice would prevail in the land. The penalties depend on class, and "an eye for an eye" applies only among equals.',
  'The king as the one who guards divine order: Egypt’s ma’at, India’s dharma, China’s Mandate of Heaven, Moses at Sinai. Law and the sacred start out together.',
  'law',
  ['Why would a king want his laws shown as handed down by a god?', 'Hammurabi, Moses and the Chinese Mandate of Heaven each tie law to the sacred. What happens when the two separate?', 'Which of your own household rules do you treat as "sacred", and which are only convenient?'],
  'read', { w: [['mīšarum', 'Akkadian', 'justice, equity; the royal act of "making justice appear"']] });

ST('e4', 'Atrahasis: the noisy humans', 'c. 1700 BCE', 'x-atr x-par x-cag x-har',
  'In this Babylonian epic the gods make humans from clay and divine blood to do their work, but the humans multiply and their noise keeps Enlil awake. He sends plague, famine and finally a flood. The god Enki warns Atra-hasis, "exceedingly wise", who builds a boat. Afterwards the gods add births, miscarriage and celibate priestesses to keep the population in check.',
  'A flood that nearly ends humanity appears in Genesis, the Epic of Gilgamesh, the Hindu story of Manu, Greek Deucalion and several Mesoamerican and Andean stories. The reason for the flood differs: noise, wickedness or unexplained anger.',
  'flood creation suffering',
  ['Why is humanity’s noise the crime here? What does that say about how these gods see us?', 'Compare this with Genesis 6–9. Who is saved, and why?', 'When in your life has a "flood" (job loss, a death, a crisis) cleared the ground? What did you build afterwards?'],
  'rain', { w: [['Atra-ḫasīs', 'Akkadian', '"exceedingly wise"']], ag: 'x-gil' });

ST('e4', 'Gilgamesh: fear of death', 'c. 1800 – 1200 BCE', 'x-gil x-rcp',
  'Gilgamesh, king of Uruk, loses his friend Enkidu and sets out to find eternal life. He crosses the waters of death to meet Utnapishtim, the flood survivor, and fails the test of staying awake. The wise tavern-keeper Siduri tells him to enjoy the bath, the meal, the child holding his hand. He returns to Uruk, and the poem ends where it began, on the city’s great wall; its prologue says that he set his story down on a stone.',
  'The first great grief-poem. Compare Qohelet ("eat your bread with joy", 9:7), the Buddha’s deathless-quest and the Stoics’ memento mori.',
  'death suffering wisdom flood descent',
  ['Gilgamesh fails and still returns changed. What changed?', 'Siduri’s advice is the same as Ecclesiastes 9:7–9. How could two cultures a thousand years apart land on the same advice?', 'What are you afraid of losing before you can finish? What would "enough" look like?'],
  'mortal', { w: [['Ūta-napišti', 'Akkadian', '"he found life": the flood survivor']] });

ST('e4', 'Enūma Eliš: creation from chaos', 'c. 1100 BCE (older roots)', 'x-enu',
  'The Babylonian creation epic tells how Marduk kills the sea-goddess Tiamat, splits her body to make sky and earth, and creates humans from the blood of a defeated god to do the gods’ labour. It ends with the fifty names of Marduk, recited at the New Year festival.',
  'Creation by victory over chaos (compare Psalm 74, Isaiah 51:9) and by speech (Genesis 1, Ptah, Popol Vuh) are two competing models. The Hebrew tehom ("deep", Gen 1:2) resembles Tiamat; scholars debate the link.',
  'creation repetition',
  ['The epic ends by reciting 50 names. What does naming do for the one who recites it?', 'Compare Enūma Elish with Genesis 1. What does the biblical writer keep, change and leave out?', 'What is a name you use for the sacred or for your highest hope? How does saying it change you?'],
  'names', { w: [['Tiamat', 'Akkadian', 'the primeval salt sea; Hebrew tehom ("the deep", Gen 1:2) is a possible, debated cousin']], ag: 'b-gen' });

ST('e4', 'Ugarit: the Baal Cycle', 'c. 1400 – 1200 BCE', 'x-bal x-cns',
  'Clay tablets from Ugarit (Syria) show the Canaanite world that Israel grew up in: El the aged creator, his consort Asherah, and the storm-god Baal who fights Yam (Sea) and Mot (Death) and returns with the autumn rains. Reading it explains much in the Psalms and prophets about "riding the clouds" and fighting the sea.',
  'A storm god who dies and returns with the rains: compare Osiris, Dumuzi, Tammuz, Persephone. Scholars (J. Z. Smith) warn that a general "dying-and-rising god" pattern is overstated.',
  'creation death feminine',
  ['Why would a farming people tell a story where death swallows the god of rain and then loses?', 'Compare Psalm 29 (the voice of the LORD in the storm) with a Baal hymn. What do you notice about who gets the credit?', 'What seasons does your own year follow, apart from the calendar? When does your energy return?'],
  'fire', { w: [['El, Asherah, Baal', 'Ugaritic', 'the aged creator, his consort ("Athirat"), the storm god ("Lord")']], sh: 'z-smi x-phr x-gez x-phi x-cap x-aab x-sso x-mst x-jot x-hte x-syh' });

ST('e4', 'Amenemope and Proverbs', 'c. 1200 BCE', 'x-ame x-erm x-etp x-msp',
  'The Egyptian "Instruction of Amenemope" is 30 short chapters of advice, and Proverbs 22:17–24:22 closely follows many of them (22:28, "Don’t move the ancient boundary stone"; 22:24, "Don’t befriend a hot-tempered man"). It describes the "heated man" and the "truly silent man" as two kinds of tree.',
  'Most scholars think Israel’s wisdom writers adapted Egyptian advice, though some argue for a shared source. Religious traditions share more than they usually admit.',
  'wisdom golden',
  ['If Proverbs borrowed from Egypt, what does that do to the idea of a revelation that stands apart?', 'The "truly silent man" is the one who is well-rooted. Where else do the ancient traditions praise silence?', 'Where in your own life are you the "heated man"? What would a "silent man" do differently there?'],
  'silence', { ag: 'b-pro' });

ST('e4', 'The Coffin Texts and the weighing of the heart', 'c. 2000 – 1070 BCE', 'x-cof x-bod x-ehh x-lgd x-bdt x-egm',
  'The Coffin Texts (Middle Kingdom) give ordinary Egyptians the afterlife once reserved for kings. The Book of Coming Forth by Day (Spell 125) shows the heart weighed against the feather of Ma’at. The dead declare 42 "I have not…" statements before judges. A heavy heart is eaten by the monster Ammit.',
  'Judgement after death by deeds: Zoroaster’s Bridge, the Hebrew Bible’s later judgement, Plato’s Myth of Er, Islam’s scales, Aztec Mictlan’s trials. The earliest is Egypt.',
  'death law golden',
  ['What would be on your own list of "I have not…"? What would you hesitate over?', 'Judgement by weighing deeds appears in Egypt, Zoroastrianism and Islam. What does it assume about the nature of the heart?', 'If your heart were weighed tonight, what would you want lighter?'],
  'weigh', { w: [['ib (jb)', 'Egyptian', 'heart: seat of thought, will and memory']], ag: 'x-pyr' });

ST('e4', 'Akhenaten and the Aten', 'c. 1350 BCE', 'x-aten x-syg',
  'Pharaoh Akhenaten elevated the sun-disk Aten above all other gods, moved the capital to Amarna and closed temples. The "Great Hymn to the Aten" praises one sun giving life to all lands. After his death the old gods were restored and his name was scratched out. Whether this was monotheism, henotheism or a royal cult is debated.',
  'The first documented attempt at a single supreme deity, a century before Moses (if there was a Moses) and long before Zoroaster. Psalm 104 closely parallels the hymn.',
  'one nature',
  ['What was Akhenaten trying to do by sweeping away the gods? Why might it have failed?', 'Psalm 104 and the Aten hymn share lines about lions, birds and ships. How would you decide who borrowed from whom?', 'Where do you feel the sun is a gift to you? Spend your next sunrise or sunset with that in mind.'],
  'sun', { w: [['Aten (ꜥtn)', 'Egyptian', 'the sun’s disk']] });

ST('e4', 'The Rigveda', 'c. 1500 – 1200 BCE', 'x-rig x-sam x-yaj x-ath x-vhy x-abv',
  'The Vedas are the oldest scriptures of India, composed in Sanskrit and memorised orally with extreme precision. The Rigveda has 1,028 hymns, many to fire (Agni), the storm god (Indra) and the ritual drink soma. Its late hymn 10.129 (Nasadiya) asks how the world began, and ends on the seer in the highest heaven: "he verily knows it, or perhaps he knows not" (in the Library’s Griffith translation).',
  'Fire rituals appear in Vedic, Zoroastrian and Roman religion, all from a common Indo-European background. A creation hymn that ends in an open question is almost unique.',
  'creation one repetition gift sacrifice ecstasy',
  ['A creation hymn that ends "maybe even He does not know": what kind of honesty is that?', 'The Vedas were memorised, not written. What is gained and lost when scripture is held in the body?', 'What question about the origin of things have you learned to hold without an answer?'],
  'om', { w: [['ṛta', 'Sanskrit', 'cosmic order, truth'], ['soma', 'Sanskrit', 'a ritual drink and its god; the plant has never been identified (Wasson’s mushroom theory is a hypothesis most scholars reject)'], ['Om (ॐ)', 'Sanskrit', 'the sacred syllable; "the sound of all sound" in later texts']], sh: 'z-arm x-vmd x-kvu x-mr06 x-scd' });

ST('e4', 'The oracle bones', 'c. 1250 BCE', '',
  'The Shang kings of China wrote questions on turtle shells and ox bones (questions such as whether it will rain, or whether the king’s toothache will pass), heated them until they cracked, and read the cracks. They are the earliest Chinese writing and show a world governed by ancestors whom the living needed to consult.',
  'Consulting ancestors for decisions: Roman lares, Yoruba egungun, Andean mummies, Philippine anito, Day of the Dead. Divination as a conversation with the unseen.',
  'ancestors time prophecy',
  ['What does it say about a culture that asks its dead to approve its decisions?', 'Divination (I Ching, runes, Tarot, bibliomancy) is a way of slowing down a decision. When is it useful and when is it a trap?', 'If you could ask one ancestor one question, whom and what? Write it down and sit with it.'],
  'ancestors', { r: 'Set a photo or object for an ancestor on a shelf. Light a candle. Ask them one question and listen for ten minutes.', w: [['bǔ (卜)', 'Chinese', 'divination by cracking heated bone or shell']], sh: 'x-hrh' });

/* ── e5 · iron age kingdoms ── */
ST('e5', 'Ludlul: the just sufferer', 'c. 1200 – 1000 BCE', 'x-lud x-sps x-bli x-bms x-dev x-rma x-bpp',
  '"I will praise the lord of wisdom" is a Babylonian poem in which a righteous man is struck by illness and disgrace and cannot tell what he did wrong. He concludes that human ideas of good and evil are not the gods’. Marduk finally restores him. It and the "Babylonian Theodicy" are older cousins of Job.',
  'The innocent sufferer is the oldest question, asked in Egypt, Israel, India, Greece. Different answers: punishment, test, karma, ignorance, mystery.',
  'suffering',
  ['What does the sufferer conclude about the gods’ standards? Does he find that satisfying?', 'Compare it with Job. One restores and the other leaves Job with an answer that does not explain. Which is truer to experience?', 'You raised this question yourself (why would a loving God allow cancer, trafficking?). Where did the ancient answers help you or fail you?'],
  'bow', { w: [['Ludlul bēl nēmeqi', 'Akkadian', '"I will praise the lord of wisdom"']], ag: 'b-job' });

ST('e5', 'Merneptah and the first "Israel"', 'c. 1208 BCE', 'x-mer x-are',
  'The Merneptah Stele, a victory hymn from Egypt, contains the earliest mention of "Israel" outside the Bible: "Israel is laid waste, his seed is not". It lists Israel as a people, not a city, in Canaan. Everything the Bible says about an earlier Exodus, Moses or patriarchs is not confirmed by outside records. Scholars range from "a small kernel" to "later invention".',
  'The first mention of a people in the written record is often an enemy’s boast. History is told by the victors until the defeated write back.',
  'canon place',
  ['What would it take to confirm the Exodus story? What would you accept?', 'Does the historical question change your reading of the text as a story of liberation?', 'Whose story in your own family has only been recorded by someone who did not love them?'],
  'read', { w: [['Yisra’el (ישראל)', 'Hebrew', '"God strives" or "may God rule" (debated)']] });

ST('e5', 'Songs older than the books', 'poems c. 12th – 10th c. BCE; books later', 'b-exo b-jdg b-rut',
  'Exodus 15 (the Song of the Sea) and Judges 5 (the Song of Deborah) are some of the oldest Hebrew poetry, probably older than the prose around them. Exodus gives the tradition of liberation and the Passover meal. Judges is a rough book of local heroes. Ruth, a short story set in the same age, is about a foreign woman’s loyal love (hesed) and ends in the line of David.',
  'Liberation stories shape other traditions: Moses, Spartacus, Harriet Tubman, Mexican and Filipino revolts that read the Passion as their own liberation (Ileto). Ruth is also a rare Bible book centred on two women and a foreigner.',
  'law kinship time rite',
  ['Why are the oldest parts of these books poems? What does poetry preserve that prose does not?', 'Passover is remembered as a meal. What other traditions keep their foundational memory in food?', 'Who are the "foreigners" whose loyalty you have been given? How have you answered it?'],
  'read', { r: 'A study meal: unleavened bread, a bitter herb and one story of leaving a hard place. Tell it to someone who is with you.', w: [['hesed (חסד)', 'Hebrew', 'loyal love, steadfast kindness'], ['shalom (שלום)', 'Hebrew', 'wholeness, peace, well-being'], ['YHWH', 'Hebrew', 'the divine name; traditionally not spoken ("Adonai" is read instead); tied to the verb "to be" in Exodus 3:14']] });

ST('e5', 'David, Solomon and the first Temple', 'set c. 1000 – 930 BCE; written c. 7th – 6th c. BCE', 'b-1sa b-2sa b-1ki',
  'Samuel, Saul, David and Solomon: the Bible’s foundation stories of the monarchy. Archaeologists disagree about how large the real kingdom was. The books were shaped centuries later (the "Deuteronomistic history"), probably in the 7th–6th centuries BCE. They include the story of David’s sin with Bathsheba and his repentance.',
  'The king who is also a poet and a sinner: the Psalms (attributed to David), Gilgamesh, Ashoka’s remorse after Kalinga, Marcus Aurelius. Power and repentance recur.',
  'law prophecy wisdom',
  ['David is shown with his faults, which is unusual for a founding king. Why might the writers have done that?', 'Compare David’s confession (2 Sam 12) with Ashoka’s edicts of remorse. What does repentance do for a king?', 'When have you had to say "I have sinned" to someone? What changed afterwards?'],
  'weigh', { w: [['māšîaḥ (משיח)', 'Hebrew', '"anointed": originally any king or priest']] });

ST('e5', 'Homer and Hesiod', 'c. 750 – 700 BCE', 'x-hom x-hes x-hhy x-apo',
  'The Iliad and Odyssey (oral epics fixed in writing around 750–700 BCE) and Hesiod’s Theogony (the birth of the gods from Chaos) shaped Greek religion. The Odyssey’s book 11 is a descent to the underworld. Hospitality (xenia) to the stranger is a sacred duty because Zeus watches over guests.',
  'Hospitality as a divine command: Abraham’s guests (Gen 18), "I was a stranger" (Matt 25), Bedouin law, Filipino pakikisama, Andean ayni. The stranger may be a god in disguise.',
  'kinship descent creation',
  ['In the Odyssey the hospitable are rewarded and the inhospitable punished. What does a culture protect by calling hospitality sacred?', 'Compare Abraham’s visitors with Zeus Xenios. What do they share?', 'Whom could you welcome at your table this month who would not expect it?'],
  'read', { w: [['xenia (ξενία)', 'Greek', 'guest-friendship: the sacred duty of hospitality'], ['kleos (κλέος)', 'Greek', 'glory; literally "what is heard"']], sh: 'x-hlp x-den x-lel x-str' });

ST('e5', 'The Zhou: the Mandate of Heaven', '1046 – 771 BCE', 'x-doc x-yi x-she',
  'The Zhou overthrew the Shang and justified it with a new idea: Heaven (tian) gives a ruler the "mandate" to rule only so long as he is just. The earliest layers of the Book of Songs and Book of Documents come from this age, as do the hexagram texts of the I Ching, a book of change used for divination and later read as philosophy.',
  'A moral universe in which injustice has cosmic consequences: ma’at, rta, dharma, prophetic Israel, Greek dike. The universal question is whether the universe is on the side of justice.',
  'law time prophecy',
  ['Tian does not speak; rulers lose the mandate by what happens. Is that a better or a worse arrangement than a god who speaks?', 'The I Ching (change) and Heraclitus’s flux both say the only constant is change. Where else do you find this?', 'What are the signs, in your own life, that you are losing or keeping the "mandate" to do what you are doing?'],
  'listen', { r: 'Throw three coins six times (or use a free web version) and read the hexagram as a mirror for a question, not a prediction.', w: [['tiān (天)', 'Chinese', 'heaven, the moral order of the sky'], ['dé (德)', 'Chinese', 'virtue; the power of character'], ['yì (易)', 'Chinese', 'change']] });

ST('e5', 'The Brahmanas: sacrifice turns inward', 'c. 900 – 500 BCE', 'x-brah x-sac x-ghs x-aib x-rvb x-nrk',
  'The Brahmanas explain Vedic rituals in detail, claiming that the sacrifice sustains the cosmos. The Aranyakas ("forest books") then move the ritual inside: the breath, the body and the mind become the sacrifice. This inward turn leads directly to the Upanishads. The Shatapatha Brahmana also tells India’s first flood story, of Manu and the fish.',
  'Ritual to inner practice: Temple sacrifice to prayer (Judaism after 70 CE), Mass as inner offering, Jain non-violence replacing animal sacrifice, the Buddha rejecting Vedic sacrifice. The same move happens in several places.',
  'sacrifice breath flood',
  ['Why would a tradition that depends on elaborate ritual start to say the real sacrifice is inside?', 'The Hebrew prophets said "I desire mercy, not sacrifice". How close is that to the Aranyakas?', 'What outer ritual in your own life could become an inward one?'],
  'wash', { w: [['yajña', 'Sanskrit', 'sacrifice, offering'], ['prāṇa', 'Sanskrit', 'breath, life-force']], sh: 'x-bri x-hri x-mwb x-ehb' });

ST('e5', 'Olmec and Chavín', 'c. 1200 – 200 BCE', '',
  'The Olmec (Gulf Coast of Mexico) built colossal stone heads and are called the "mother culture" of Mesoamerica. At Chavín de Huántar (Peru), underground stone galleries with water channels amplify and distort sound, and carvings show the San Pedro cactus, consistent with the use of a mescaline plant. The Journey does not use such substances; it asks what a community built to hold such experiences.',
  'A temple designed to shape perception through dark, sound and water, echoing the caves and later rites like Eleusis. Ritual use of plants occurs in many cultures but is embedded in a community, a lineage and a purpose.',
  'ecstasy place',
  ['If a building can be designed to change how you feel, what does that say about the relation between place and mind?', 'What differs between a ritual held inside a tradition and a substance taken for its own sake?', 'What place in your life changes how you feel when you enter? Why do you think it does?'],
  'hum', { w: [['pututu', 'Quechua', 'conch-shell trumpet; the Chavín galleries amplify its sound']] });
