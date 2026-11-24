/* ═══════════════════════════ 2d · The Journey: echoes — how traditions overlap, and how we know ═══════════════════════════
   Every connection is classified by the strength of the evidence, because "they look alike" can mean four different things:
   borrowing (documented), shared ancestry, contact (plausible or shown), independent parallel, or contested. Notes are deliberately conservative. */
const ECHO_KINDS = {
  borrowing: { name: 'Documented borrowing', color: '#3fd9a0', desc: 'One text or tradition clearly draws on another: quotation, retelling, translation, shared manuscripts.' },
  ancestry: { name: 'Shared ancestry', color: '#7d9bff', desc: 'Related through a common root: a language family, a shared region, or an older tradition both inherited.' },
  contact: { name: 'Contact', color: '#ffc65a', desc: 'People met and exchanged ideas (trade, conquest, scholarship, translation), so influence is shown or plausible, though the exact path may be debated.' },
  parallel: { name: 'Independent parallel', color: '#d18bff', desc: 'Similar ideas where no contact is known. This is the strongest hint of shared human minds and experiences, and the weakest evidence of a shared historical source.' },
  contested: { name: 'Contested', color: '#ff6f86', desc: 'A connection is claimed, but scholars disagree about whether it exists, or how much.' },
};

const ECHOES = [];
const EC = (a, b, kind, note) => ECHOES.push({ a, b, kind, note });

/* floods and creation */
EC('Atrahasis', 'Gilgamesh', 'borrowing', 'Tablet XI of Gilgamesh incorporates the Atrahasis flood story: the warning, the boat, the survivor made immortal. This is documented in the Babylonian texts themselves.');
EC('Atrahasis', 'The Torah takes shape', 'borrowing', 'Genesis 6–9 retells the Mesopotamian flood (the boat, the sacrifice afterward, the divine regret). Most scholars (Lambert and Millard, 1969, and many since) treat Genesis as dependent on this tradition, recast in a different moral world.');
EC('Gilgamesh', 'The Torah takes shape', 'borrowing', 'Gilgamesh XI has the hero send out a dove, a swallow and a raven, much as Noah does in Genesis 8:6–12.');
EC('Enūma Eliš', 'The Torah takes shape', 'contested', 'Genesis 1’s "deep" (tehom) and its creation by separation recall Tiamat, but the structure differs and direct dependence is debated.');
EC('Atrahasis', 'The Dreaming', 'parallel', 'Flood stories may sometimes remember real events: Nunn and Reid (2016) argue that Aboriginal stories from many coasts preserve memory of sea-level rise 7,000 to 13,000 years ago, a claim that is debated. Where it holds, it helps explain how far-apart cultures can tell of a flood without sharing a source.');
EC('Atrahasis', 'Conquest: the Popol', 'parallel', 'In the Popol Vuh the wooden people are drowned by a flood. No contact with Mesopotamia is known; flood stories are widespread.');
EC('Shabaka', 'The Torah takes shape', 'contested', 'Creation by thought and command (Ptah’s heart and tongue; "God said, let there be…") invites comparison. Some scholars see Egyptian influence on Genesis 1; others see an independent idea.');
EC('Shabaka', 'John and the Johannine', 'contested', 'Creation by Word reaches John’s Logos through Hellenistic Judaism and Philo, perhaps with Egyptian echoes in Alexandria. No direct text links them.');
EC('Shabaka', 'Conquest: the Popol', 'parallel', 'The K’iche’ gods make the world "by word and by thought". No contact with Egypt is known.');
EC('Shabaka', 'Kalevala', 'parallel', 'In the Kalevala song has power to make and unmake things: Väinämöinen sings a boat into being and a rival into a bog. A different culture reaching a similar idea of creative speech.');
EC('Sefer Yetzirah', 'Shabaka', 'parallel', 'Hebrew letters as the building blocks of creation, and Ptah’s speech as creation, share the idea that words make things. They are roughly a thousand years apart (the Shabaka Stone is of about 710 BCE, though it says it copies an older text).');
EC('The Rigveda', 'John and the Johannine', 'parallel', 'Vāc (Speech) is a creative principle in the Vedas. Raimon Panikkar and others have compared her with the Logos; no historical link is shown.');
EC('Polynesia', 'The Rigveda', 'parallel', 'The Kumulipo’s movement from darkness to light and the Nasadiya hymn’s opening before being and non-being both begin before the world.');
EC('Polynesia', 'The Torah takes shape', 'parallel', 'Hawaiian and Māori creation chants move from darkness into light and then life, as Genesis 1 does. No contact is claimed before the missionaries.');

/* descent and death */
EC('Inanna', 'The mysteries of Eleusis', 'contested', 'Both tell of a goddess’s loss, a descent and a return that restores the earth. Walter Burkert and others argue for Near Eastern influence on Greek myth; no direct borrowing is demonstrated.');
EC('Inanna', 'Conquest: the Popol', 'parallel', 'The Hero Twins descend to Xibalba, are killed and rise. Like Inanna, they go down and return, with no possible contact.');
EC('Gilgamesh', 'Homer and Hesiod', 'contact', 'Odysseus’s trip to the dead, the hero’s grief for a friend and other motifs resemble Gilgamesh. Burkert argued for borrowing via Phoenician and Cypriot contact in the early first millennium; this is widely discussed and not settled.');
EC('Enūma Eliš', 'Homer and Hesiod', 'contact', 'Hesiod’s succession myth (Ouranos, Kronos, Zeus) resembles the Hurrian-Hittite Kumarbi cycle and Babylonian creation epics. M. L. West and Burkert argued the Greeks learned it from the East.');
EC('Egypt: the Pyramid', 'The Coffin Texts', 'borrowing', 'The Coffin Texts reuse and extend the Pyramid Texts, opening royal afterlife spells to ordinary people. The continuity is documented.');
EC('The Coffin Texts', 'The mysteries of Eleusis', 'contested', 'The Orphic gold tablets give the dead instructions for the underworld in a way that resembles the Book of the Dead. Egyptian influence has been proposed and is debated.');
EC('The Coffin Texts', 'Tibet', 'parallel', 'A manual read to the dead (the Book of the Dead and the Bardo Thödol) appears in Egypt and Tibet with no contact.');
EC('Zoroaster', 'The Coffin Texts', 'parallel', 'Judgement of the soul after death after weighing deeds appears in Egypt and in Zoroastrian thought (the Chinvat Bridge), with no known borrowing.');
EC('The exile', 'John and the Johannine', 'borrowing', 'John 20:22, where the risen Jesus breathes on the disciples, deliberately echoes God breathing life into Adam (Gen 2:7) and the breath that raises the dry bones in Ezekiel 37.');
EC('Cave minds', 'Olmec and Chavín', 'parallel', 'Deep, dark, resonant spaces built or chosen for ritual: Palaeolithic caves, and the Chavín galleries that amplify and distort sound. No contact; both exploit what the human senses do in the dark.');
EC('The Philippines', 'The ocean people', 'contact', 'Pre-Christian anito and spirit traditions survive inside Filipino folk Catholicism: Undas, the Santo Niño and the Pasyon carry older ideas of ancestors and spirits.');

/* wisdom and law */
EC('Amenemope', 'Proverbs: Wisdom', 'borrowing', 'Proverbs 22:17–24:22 closely follows the Egyptian Instruction of Amenemope (the boundary stone, the hot-tempered man). Most scholars hold that the Hebrew writer drew on the Egyptian.');
EC('Akhenaten', 'The Psalms', 'contested', 'Psalm 104 shares lions, birds, ships and the sun’s daily gift with the Great Hymn to the Aten. Direct borrowing is disputed; a shared Near Eastern hymn tradition is the alternative.');
EC('Hammurabi', 'Songs older', 'contested', 'The case laws of Exodus 21–22 (the goring ox, the borrowed tool) parallel Mesopotamian codes. David Wright argues for literary dependence on Hammurabi; others for a shared legal tradition.');
EC('Ugarit', 'The Psalms', 'ancestry', 'Psalms 29, 68 and 74 use the storm-god and sea-monster imagery of the Baal cycle for YHWH. Israel grew up inside Canaanite culture.');
EC('The Zhou', 'Hammurabi', 'parallel', 'A ruler authorised by heaven to keep justice: Hammurabi receives the laws from Shamash; Zhou kings hold the Mandate of Heaven. Similar ideas on the opposite ends of Asia.');
EC('The oracle bones', 'The Zhou', 'borrowing', 'The Zhou took over Shang divination practices and reinterpreted them as the Mandate of Heaven. Zhou oracle bones are known.');
EC('Job', 'Ludlul', 'ancestry', 'Mesopotamian "just sufferer" literature (Ludlul bēl nēmeqi and the Babylonian Theodicy) long precedes Job and shaped the genre.');
EC('Proverbs: Wisdom', 'Ben Sira', 'borrowing', 'Sirach 24 builds directly on Proverbs 8, identifying Wisdom with the Torah.');
EC('Ben Sira', 'John and the Johannine', 'ancestry', 'The personified Wisdom of Proverbs 8, Sirach 24 and Wisdom of Solomon 7 is the model for John’s Logos in language and shape.');
EC('Philo', 'John and the Johannine', 'contact', 'Philo’s Logos as God’s "first-born" and John’s Logos come from the same Hellenistic Jewish world. John’s direct dependence on Philo is not shown.');
EC('Ben Sira', 'The Stoics and Rome', 'contact', 'Wisdom of Solomon calls Wisdom a "breath of the power of God", language close to Stoic pneuma that pervades the world. Hellenistic vocabulary entered Jewish writing in Alexandria.');
EC('Qohelet', 'Gilgamesh', 'contested', 'Ecclesiastes 9:7–9 ("eat your bread with joy… live joyfully with the wife you love") resembles Siduri’s advice in the Old Babylonian Gilgamesh. Direct borrowing is proposed and debated.');

/* the golden rule family */
EC('Tales of the Diaspora', 'The Talmud', 'ancestry', 'Tobit 4:15 ("what you hate, do not do to anyone") and Hillel’s "what is hateful to you, do not do to another" belong to one Jewish ethical stream.');
EC('Matthew and Luke', 'The Talmud', 'contact', 'Jesus’s "do to others as you would have them do to you" (Matt 7:12) and Hillel’s negative form come from the same first-century Jewish world.');
EC('Confucius', 'Matthew and Luke', 'parallel', 'Confucius’s shù ("what you do not wish for yourself, do not impose on others", Analects 15.24) and the golden rule in the Gospels have no known link, and arise ~500 years apart on different continents.');
EC('India’s epics', 'Confucius', 'parallel', 'The Mahābhārata (13.113.8) says not to do to others what you would regard as injury to yourself. Another independent statement of reciprocity.');
EC('Rumi, Ibn', 'Matthew and Luke', 'parallel', 'Nawawi’s Hadith 13, "none of you believes until he loves for his brother what he loves for himself", is the Islamic form of reciprocity. Muslim tradition sees a shared prophetic source.');

/* India and Persia and the Axial Age */
EC('The Rigveda', 'Zoroaster', 'ancestry', 'Vedic and Avestan are sister languages, and share ṛta/asha, Mitra/Mithra, soma/haoma, Agni/Atar. The word for gods (deva/daeva) has reversed value: gods in India, demons in Iran.');
EC('The Rigveda', 'Homer and Hesiod', 'ancestry', 'Dyaus Pitar, Zeus Pater and Jupiter share a name: the sky-father inherited from the Proto-Indo-European religion.');
EC('The Rigveda', 'The Viking Age', 'ancestry', 'The storm-god who slays the serpent (Indra–Vritra, Thor–Jörmungandr, Zeus–Typhon) is a widely accepted Indo-European pattern; details are debated.');
EC('The Brahmanas', 'The Upanishads', 'borrowing', 'The Upanishads reinterpret Vedic ritual as inner practice: the sacrifice becomes breath and mind. The continuity is documented.');
EC('The Buddha', 'Mahavira', 'contact', 'Contemporaries in the same Magadhan ascetic world, both reject Vedic sacrifice and teach karma, rebirth and non-violence.');
EC('The Upanishads', 'The Buddha', 'contact', 'The Buddha speaks in the same debates (self, karma, release) and rejects the Upanishadic ātman with a doctrine of no-self.');
EC('The Upanishads', 'Heraclitus', 'contested', 'The One behind many forms, rebirth and the soul’s ascent appear in both India and Greece. Contact (via Persia or Pythagoras) is not demonstrated.');
EC('Mahayana', 'Heraclitus', 'contact', 'Greek rulers in Bactria and Ashoka’s edicts naming Hellenistic kings are documented; Gandhāran Buddha images use Greek forms. How far Greek ideas shaped doctrine is debated.');
EC('Zoroaster', 'The Maccabees', 'contested', 'Angels and demons, a final judgement and bodily resurrection arrive in Judaism after the Persian period. How much owes to Zoroastrianism is argued (Boyce, Collins).');
EC('Zoroaster', 'The Yahad', 'contested', 'The Two Spirits of the Community Rule are close to the Gathic spirits of truth and lie. Persian influence is plausible and debated.');
EC('Second Isaiah', 'Zoroaster', 'contact', 'Cyrus of Persia is called the LORD’s "anointed", and Isaiah 45:7 ("I form light and create darkness") has been read as an answer to Persian dualism. The connection is debated.');
EC('Zoroaster', 'Mani and', 'borrowing', 'Mani documented his debts: he draws on Zoroastrian, Christian and Buddhist material and names their founders as his predecessors.');
EC('Persia in late', 'The Talmud', 'contact', 'The Babylonian Talmud was composed in Sasanian Persia, and Persian loanwords and legal ideas appear in it.');
EC('Confucius', 'The Daoists', 'contact', 'Both belong to one Chinese intellectual world, and the Daoist classics often answer Confucian ethics.');
EC('Heraclitus', 'The Daoists', 'parallel', 'Heraclitus’s flux and Logos and the Daodejing’s Way share an ordering principle in change. No contact is known.');
EC('The Daoists', 'Buddhism takes root', 'borrowing', 'Chinese translators rendered Buddhist terms with Daoist words ("matching concepts", geyi): dao for dharma, wu for emptiness. This is documented.');
EC('Mani and', 'Tang Buddhism', 'contact', 'Manichaeism reached Tang China in 694 CE and borrowed Buddhist and Daoist vocabulary. Documented in Chinese Manichaean texts.');
EC('Mahayana', 'Tibet', 'borrowing', 'Tibetan Buddhism inherits the Indian Nalanda tradition, translating Nāgārjuna, Śāntideva and the sutras. The transmission is well documented.');
EC('The Buddha', 'Christian mystics', 'parallel', 'Breath-linked repeated prayer in hesychasm (the Jesus Prayer) and in Buddhist breath practice developed separately; both use the breath to steady attention.');

/* Second Temple, Christianity and beyond */
EC('Gilgamesh', 'Enoch I:', 'borrowing', 'The Qumran Book of Giants names Gilgamesh and Humbaba (Hobabish) among the giants of Genesis 6, a documented borrowing of a Mesopotamian hero into a Jewish tradition.');
EC('Enoch I:', 'Hebrews, James', 'borrowing', 'Jude 14–15 quotes 1 Enoch 1:9 and calls it prophecy. 2 Peter draws on Jude. The quotation is documented.');
EC('Enoch I:', 'Jubilees', 'borrowing', 'Jubilees draws on Enoch’s astronomical and calendrical teachings and its 364-day calendar.');
EC('Jubilees', 'The Yahad', 'borrowing', 'The Qumran community kept Jubilees’ 364-day calendar: about 15 copies of Jubilees were found there.');
EC('Enoch I:', 'Maccabees', 'contact', 'Daniel and Enoch come from the same apocalyptic circles of the 3rd–2nd centuries BCE and share angels, visions and heavenly journeys.');
EC('Enoch II', 'Revelation', 'contact', 'The heavenly Son of Man and judgement in the Parables of Enoch and in Revelation share a tradition; the Parables’ date (1st c. BCE to 1st c. CE) makes the direction hard to prove.');
EC('Enoch I:', 'Heavenly palaces', 'borrowing', 'In 3 Enoch (Hekhalot), Enoch is transformed into the angel Metatron, an explicit development of the Enoch tradition.');
EC('Enoch I:', 'Mali', 'contact', 'Ethiopian Orthodox Christians preserved 1 Enoch and Jubilees in Ge’ez and still treat them as scripture. The complete Enoch survives only there.');
EC('Matthew and Luke', 'The Stoics and Rome', 'borrowing', 'In Acts 17:28, Paul quotes a Greek poet ("we are his offspring"), a line found in Aratus’s Phaenomena and Cleanthes’ Hymn to Zeus.');
EC('Heraclitus', 'John and the Johannine', 'contact', 'The Logos reaches John through Stoic thought and Hellenistic Judaism (Philo). John’s precise debts are debated.');
EC('Heraclitus', 'Isis and the Neoplatonists', 'borrowing', 'Plotinus explicitly builds on Plato; the Enneads are a commentary-in-practice on the Platonic tradition.');
EC('Heraclitus', 'Gnostic and Hermetic', 'borrowing', 'Plato’s Timaeus (the craftsman or demiurge) and Platonic ascent shape both Gnostic myths and the Corpus Hermeticum.');
EC('Jesus and the first gospel', 'The Buddha', 'contested', 'Popular claims that Jesus drew on Buddhism rest on thin evidence. Most historians see parallel moral teaching, not borrowing.');
EC('Egypt: the Pyramid', 'Jesus and the first gospel', 'contested', 'The "dying and rising god" pattern (Osiris, Dumuzi, Attis) is often applied to Jesus. J. Z. Smith and others argue the pattern is overstated, and most historians do not see Osiris as a source.');
EC('Isis and the Neoplatonists', 'The other gospels', 'contested', 'Isis nursing Horus resembles later images of Mary and the Child. Influence is possible and unproven; the images share the universal mother-and-infant motif.');
EC('Gnostic and Hermetic', 'Mani and', 'contact', 'Manichaeism shares Gnostic dualism, and Mani grew up in a Jewish-Christian baptist community, known from the Cologne Mani Codex.');
EC('Gnostic and Hermetic', 'Kabbalah', 'contested', 'Gershom Scholem argued that Gnostic motifs shaped Kabbalah. Later scholars question how direct the line is.');
EC('Sefer Yetzirah', 'Kabbalah', 'borrowing', 'The Zohar and later Kabbalah develop the sefirot and the letter-mysticism of Sefer Yetzirah. The dependence is explicit.');
EC('Heavenly palaces', 'Kabbalah', 'ancestry', 'Hekhalot and Merkavah mysticism is the older Jewish mystical stream from which medieval Kabbalah draws (Scholem).');
EC('The Yahad', 'The desert fathers', 'contested', 'Communal desert asceticism recurs in Qumran and in Christian monasticism, but a direct link is unproven. Philo’s Therapeutae are another candidate.');
EC('The other gospels', 'The Qur’an', 'contact', 'The Qur’an’s stories of Mary’s birth and of Jesus making clay birds echo the Protoevangelium of James and Infancy Gospel of Thomas, which circulated in Syriac and Arabic.');
EC('Testaments, tales', 'The Qur’an', 'contact', 'The story of Satan refusing to bow to Adam appears in the Life of Adam and Eve and in the Qur’an (7:11–18; 38:71–85).');
EC('The Torah takes shape', 'The Qur’an', 'contact', '"I breathed into him of My spirit" (Qur’an 15:29) echoes Genesis 2:7. Muslims see the same revelation reaching the same prophets; historians describe a shared Near Eastern scriptural world.');
EC('Odes, testaments', 'Rumi, Ibn', 'parallel', 'The Spirit sounding through a person as wind through a harp (Ode 6) and the reed flute’s song in Rumi are the same image, nearly a thousand years apart.');

/* Islam, Sufism, Sikhism */
EC('Rabia', 'Christian mystics', 'contested', 'Early Sufism shares wool-robed asceticism and night vigils with Christian monks of Syria and Egypt. The extent of Christian influence on Sufism is debated.');
EC('Al-Ghazālī', 'The desert fathers', 'parallel', 'A teacher’s breakdown at the height of success and a retreat to renew practice (Ghazali, 1095) resemble acedia and later accounts of the dark night.');
EC('Rumi, Ibn', 'Kabir', 'contact', 'Sufi and bhakti poets shared the same North Indian world, and mutual exchange is well attested.');
EC('Kabir', 'Guru Nanak', 'borrowing', 'Kabir’s verses are included in the Guru Granth Sahib alongside those of other Hindu and Muslim poets.');
EC('Rumi, Ibn', 'Guru Nanak', 'contact', 'Sufi teachers such as Baba Farid are in the Guru Granth Sahib, and Sufi practice shaped early Sikh devotion.');
EC('Rumi, Ibn', 'The Daoists', 'parallel', 'Toshihiko Izutsu’s Sufism and Taoism compares Ibn ʿArabī and Zhuangzi: a hidden unity behind forms. The comparison is philosophical, not historical.');
EC('The Upanishads', 'Christian mystics', 'parallel', 'Rudolf Otto (Mysticism East and West) compared Eckhart’s Godhead with Shankara’s Brahman. Close in structure; contested as the same experience.');
EC('Guru Nanak', 'The Quakers', 'parallel', 'Both are radical movements of inner devotion with no priesthood, equality and service at the centre, arising in different countries in the 16th–17th centuries.');
EC('The Quakers', 'Christian mystics', 'contact', 'Fox grew up in a milieu of radical Puritan mysticism; Rufus Jones documented a Quaker line from the medieval mystics.');
EC('The desert fathers', 'Milarepa', 'parallel', 'An ascetic in a cave or desert, tempted by despair and pride, and healed by patience: independent stories on opposite ends of Eurasia.');
EC('The desert fathers', 'The Quakers', 'parallel', 'The cell and the meeting both rest on silence as the means of being taught.');

/* north, west and the colonial world */
EC('The Viking Age', 'Revelation', 'contact', 'Völuspá’s world-end and renewal took its recorded shape in Christianising Iceland. Christian influence on Ragnarök is widely accepted, along with older roots.');
EC('The Viking Age', 'Zoroaster', 'contested', 'Ragnarök’s end and renewal looks like the Iranian final renovation. Christian influence is likely; a deeper Indo-European or Persian source is debated.');
EC('Celtic myth', 'Kalevala', 'ancestry', 'Carmichael’s Hebridean prayers descend from the older Gaelic tradition the monks first wrote down.');
EC('The Dreaming', 'The Andes', 'parallel', 'Sacred land with obligations on both sides: songlines and country in Australia, huacas and ayni in the Andes. No contact.');
EC('The Dreaming', 'The Haudenosaunee', 'parallel', 'Stories as law and a map, thanks to the land at the start of every gathering: Australia and the Great Lakes.');
EC('The Andes', 'The Haudenosaunee', 'parallel', 'Reciprocity with the land: ayni and the Thanksgiving Address.');
EC('Stone and sun', 'Teotihuacan', 'parallel', 'Solar alignments in Newgrange and Stonehenge, and in Maya E-groups and Teotihuacan. No contact; the sun’s turning is observable anywhere.');
EC('Jubilees', 'Teotihuacan', 'parallel', 'Sacred calendars as theology: the 364-day Qumran calendar and the 260-day Maya count.');
EC('Stone and sun', 'The Dresden', 'parallel', 'Sky-watching built into religion: from Neolithic tombs to the Venus tables of the Dresden Codex.');
EC('The ocean people', 'Polynesia', 'ancestry', 'Linguistic and archaeological evidence shows the Austronesian expansion from Taiwan through the Philippines to Hawaiʻi, Aotearoa and Rapa Nui: one family of peoples and ideas.');
EC('The Philippines', 'Conquest: the Popol', 'contact', 'Both were converted by Spanish Catholic missions, and both kept older religion inside Catholic forms. The shared cause is the colonial church.');
EC('The African diaspora', 'The Philippines', 'contact', 'The same strategy of hiding older religion behind saints: Orisha as saints, anito inside the Santo Niño. The common contact is Spanish Catholicism.');
EC('The African diaspora', 'Mali', 'ancestry', 'Ifá and the Orisha traditions were carried from Yorubaland to Cuba and Brazil and survive as Santería and Candomblé.');
EC('Bahá’í', 'Mani and', 'parallel', 'Both claim to complete earlier prophets (Mani as their "seal"; Bahá’u’lláh’s progressive revelation) and to unify existing faiths.');
EC('Bahá’í', 'Gnostic and Hermetic', 'contested', 'The Kybalion (1908) claims Hermetic origins, but its content is mostly New Thought. The modern "manifestation" movement borrows the Hermetic prestige more than its text.');
EC('Cities without words', 'Sumer', 'contact', 'Indus seals have been found in Mesopotamia and Mesopotamian texts name Meluhha: trade between the two is documented.');
EC('The trance dance', 'Shaman', 'parallel', 'Community-held trance healing in the Kalahari and Siberia: rhythm, singing and a healer who travels. Not a single practice under two names.');

/* resolve keys to stations (exact title first, then a unique substring) */
function stationByKey(key) {
  const exact = PATH_STATIONS.filter((s) => s.title === key); if (exact.length === 1) return exact[0];
  const inc = PATH_STATIONS.filter((s) => s.title.includes(key)); return inc.length === 1 ? inc[0] : null;
}
const ECHO_LINKS = ECHOES.map((e) => { const a = stationByKey(e.a), b = stationByKey(e.b); return a && b ? Object.assign({}, e, { A: a, B: b }) : null; }).filter(Boolean);
const echoesOf = (s) => ECHO_LINKS.filter((e) => e.A === s || e.B === s);

if (typeof module !== 'undefined' && module.exports) module.exports = { ECHO_KINDS, ECHOES, ECHO_LINKS, echoesOf, stationByKey };
