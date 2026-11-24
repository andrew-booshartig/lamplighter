"""Specs for further open (pre-1931) English translations from India, Buddhist Asia, China and Japan: the Yoga Vasistha, Vedanta and Tantra texts, Vedic
Brahmanas and the Nirukta, Buddhist travellers and compendia, Jain scriptures and the Chinese ethical and Confucian classics. Merged into texts_archive.SPECS
(see the end of that file); built with python3 build_texts.py --only=ids. An ident 'PG123' is Project Gutenberg #123; the rest are Internet Archive items.
Sources were found on 16 November 2026 and fetched on the maker's instruction ("keep going and find more texts").

Each spec may carry lib=(title, group, when, tr, station title prefix): the Library line and the Path station for an id that is not in the Library yet.
"""
OLD = 'An older translation, so its wording and its scholarship are dated; set a recent translation beside it where there is one.'
SKT = 'Sanskrit and other non-English words and diacritics come through as noise in places.'


def G(idents, by, note='', lib=None, **kw):
    d = dict(idents=idents if isinstance(idents, list) else [idents], by=by, note=note, trim_index=True, trim_front=True, trim_back=True, split='auto')
    if lib: d['lib'] = lib
    d.update(kw)
    return d


SPECS = {
    # ── Hindu: Vedanta, Tantra, Brahmanas, devotion ──
    'x-yvs': G(['in.ernet.dli.2015.62046', 'dli.bengal.10689.7196', 'yoga-vasishtha-maharamayana-vol-3', 'in.ernet.dli.2015.96046'], 'Vihari Lala Mitra (translator), The Yoga-Vásishtha-Maharamayana of Válmíki, translated from the original Sanskrit, 4 vols. (Calcutta: Bonnerjee, 1891–99)',
               'The long Advaita Vedanta dialogue in which the sage Vasishtha teaches the young Rama, in six books (dispassion, the seeker, creation, existence, quiescence and liberation), with its many stories: the world as a dream of mind, and the stories (Lila and others) that illustrate it. Mitra’s four volumes are the only complete English version in the public domain. ' + OLD,
               labels=['Volume 1', 'Volume 2', 'Volume 3', 'Volume 4'],
               lib=('Yoga Vasishtha (Mitra, 1891–99): Vasishtha’s teaching to Rama, 4 volumes', 'in', 'c. 10th–14th c. CE', 'upan', 'Kabir and the Hatha')),
    'x-nys': G('TheNyayaSutrasOfGotama', 'Satis Chandra Vidyabhusana (translator), The Nyaya Sutras of Gotama (Sacred Books of the Hindus, vol. 8; Allahabad: Pāṇini Office, 1913)',
               'The aphorisms of the school of Indian logic and epistemology (Nyaya): the sources of right knowledge, doubt, debate, fallacies, the soul, the body and release, with the commentary of Vatsyayana and the sub-commentaries in Vidyabhusana’s English. ' + OLD + ' ' + SKT,
               lib=('The Nyaya Sutras of Gotama (Vidyabhusana, 1913): the Indian logic of knowledge and release', 'in', 'c. 2nd c. CE', 'ved', 'The Gupta age')),
    'x-vcd': G('vivekachudamanio00sankrich', 'Swami Madhavananda (translator), Vivekachudamani of Sri Sankaracharya, text with English translation (Almora: Advaita Ashrama, 1921)',
               'The “Crest-Jewel of Discrimination,” attributed to Shankara: a teacher’s dialogue with a disciple on the way to liberation, with the Sanskrit and a word-for-word English. Madhavananda died in 1965, so his English may still be protected in some countries. ' + SKT,
               lib=('Vivekachudamani (Shankara, trans. Madhavananda, 1921): the Crest-Jewel of Discrimination', 'in', 'c. 8th c. CE (attributed)', 'upan', 'The Gupta age')),
    'x-pnd': G('PanchadasiOfVidyaranya', 'M. Srinivasa Rau and K. A. Krishnaswami Aiyar (translators), Panchadasi of Sri Vidyaranya Swami, with an English translation, explanatory notes and a summary of each chapter (Madras: Theosophical Publishing House, 1912)',
               'The standard primer of Advaita Vedanta, in fifteen chapters: discrimination of the self from the seen, the five sheaths, the identity of self and Brahman, and the bliss of knowing. ' + OLD + ' ' + SKT,
               lib=('Panchadasi (Vidyaranya, trans. Srinivasa Rau, 1912): a primer of Advaita Vedanta', 'in', 'c. 14th c. CE', 'upan', 'Kabir and the Hatha')),
    'x-mnt': G('dli.csl.5754', 'Arthur Avalon (Sir John Woodroffe), Tantra of the Great Liberation (Mahanirvana Tantra), translated from the Sanskrit, with introduction and commentary (London: Luzac, 1913)',
               'The best-known Hindu Tantra in English: Shiva’s teaching to Parvati on the worship of the One Reality in this age, with the rules for the householder: the rites of worship, caste, marriage and law. Woodroffe’s long introduction is a defence of the Tantra against the charge of license. ' + OLD,
               lib=('Tantra of the Great Liberation (Mahanirvana Tantra; Avalon, 1913)', 'in', 'c. 1700–1800 CE', 'yoga', 'Kabir and the Hatha')),
    'x-spw': G('in.ernet.dli.2015.283748', 'Arthur Avalon (Sir John Woodroffe), The Serpent Power, being the Sat-Cakra-Nirupana and Paduka-Pancaka, two works on Laya-Yoga translated from the Sanskrit with introduction and commentary (London: Luzac, 1919; 3rd ed. 1924)',
               'The best-known English book on kundalini yoga: the six centres of the body (the chakras) and the rousing of the serpent power, with the Sanskrit text of Purnananda’s Sat-cakra-nirupana (1577) and a long explanation. ' + OLD + ' ' + SKT,
               lib=('The Serpent Power (Avalon, 1919): the six chakras and kundalini yoga', 'in', 'c. 1577 CE (translation 1919)', 'yoga', 'Kabir and the Hatha')),
    'x-aib': G(['in.ernet.dli.2015.104263', 'in.ernet.dli.2015.104262'], 'Martin Haug (translator), The Aitareya Brahmanam of the Rigveda, containing the earliest speculations of the Brahmans on the meaning of the sacrificial prayers, 2 vols. (Sacred Books of the Hindus; Allahabad: Pāṇini Office, 1922 reprint of the 1863 work)',
               'The priests’ own explanation of the great sacrifices of the Rigveda school (the soma sacrifice, the king’s anointing, the horse sacrifice and others), with its myths. ' + OLD,
               labels=['Volume 1', 'Volume 2'],
               lib=('Aitareya Brahmana (Haug, 1863; 1922 ed.): the priests’ account of the Rigveda sacrifices', 'in', 'c. 900–700 BCE', 'ved', 'The Brahmanas')),
    'x-rvb': G('rigvedabrahmana00keitgoog', 'Arthur Berriedale Keith (translator), Rigveda Brahmanas: the Aitareya and Kauṣītaki Brāhmaṇas of the Rigveda (Harvard Oriental Series vol. 25; Cambridge, Mass.: Harvard University Press, 1920)',
               'The two Brahmanas of the Rigveda school in Keith’s full English with introduction and notes: the Aitareya and the Kaushitaki, on the soma sacrifice, the fire rites and the “highest” offerings.',
               lib=('Rigveda Brahmanas: Aitareya and Kaushitaki (Keith, 1920)', 'in', 'c. 900–700 BCE', 'ved', 'The Brahmanas')),
    'x-nrk': G('nighantuniruktao01saru', 'Lakshman Sarup (translator), The Nighantu and the Nirukta, the oldest Indian treatise on etymology, philology and semantics (Oxford: Oxford University Press, 1920–27)',
               'Yaska’s ancient commentary on the list of rare Vedic words (the Nighantu): how the Vedic gods were understood, with his explanations of the names of Agni, Indra and the rest, and the old schools of interpretation. ' + OLD + ' ' + SKT,
               lib=('The Nighantu and the Nirukta (Yaska, trans. Sarup, 1920)', 'in', 'c. 500 BCE', 'ved', 'The Brahmanas')),
    'x-ggv': G('indiansongofsong00jayarich', 'Edwin Arnold (translator), The Indian Song of Songs, from the Sanskrit of the Gita Govinda of Jayadeva (London: Trübner, 1875)',
               'The love of Krishna and Radha in twelve cantos, with the god’s passion, Radha’s jealousy and the lovers’ reunion; the Vaishnava poem where God and the soul are the beloved and lover. Arnold turns it into English verse and takes liberties.',
               lib=('The Indian Song of Songs (Gita Govinda of Jayadeva, trans. Arnold, 1875)', 'in', 'c. 1170 CE', 'bhakti', 'Kabir and the Hatha')),
    'x-sgb': G('SivaGnanaBothamEng', 'J. M. Nallaswami Pillai (translator), Siva-Gnana-Botham of Meikanda Deva, with an English translation (Madras: Meykandan Press, 1895)',
               'The founding text of Shaiva Siddhanta, the Tamil philosophy of Shiva: twelve sutras on God (pati), the soul (pasu) and the bonds (pasa), with commentary. ' + OLD,
               lib=('Siva-Gnana-Botham (Meikanda Deva, trans. Nallaswami Pillai, 1895)', 'in', 'c. 1220 CE', 'tamil', 'The Gupta age')),

    # ── Buddhist: travellers, compendia, edicts ──
    'x-afm': G('avaghoshasdisc00asva', 'Teitaro Suzuki (translator), Açvaghosha’s Discourse on the Awakening of Faith in the Mahâyâna (Chicago: Open Court, 1900)',
               'The short treatise (traditionally Ashvaghosha’s, probably 6th-century Chinese) that sums up Mahayana teaching: suchness, the one mind, the “womb of the Tathagata,” and the practice of faith, with Suzuki’s introduction. Suzuki died in 1966, so his English may still be protected in some countries. ' + OLD,
               lib=('Awakening of Faith in the Mahayana (trans. D. T. Suzuki, 1900)', 'bu', 'c. 6th c. CE', 'maha', 'Buddhism takes root in China')),
    'x-syk': G(['siyukibuddhistre01hsuoft', 'siyukibuddhistre02hsuoft'], 'Samuel Beal (translator), Si-Yu-Ki: Buddhist Records of the Western World, translated from the Chinese of Hiuen Tsiang (A.D. 629), 2 vols. (London: Trübner, 1884)',
               'Xuanzang’s record of his sixteen years of pilgrimage to India, with the Buddhist places, the stupas, the monasteries and the sects as he saw them in the 7th century, and the stories he heard at each holy site. A main source for Indian Buddhism at its end. ' + OLD,
               labels=['Volume 1', 'Volume 2'],
               lib=('Si-yu-ki: Buddhist Records of the Western World (Xuanzang, trans. Beal, 1884)', 'bu', 'c. 646 CE', 'maha', 'Buddhism takes root in China')),
    'x-fhn': G('recordofbuddhist00fahsuoft', 'James Legge (translator), A Record of Buddhistic Kingdoms, being an account by the Chinese monk Fâ-hsien of his travels in India and Ceylon (A.D. 399–414) in search of the Buddhist books of discipline (Oxford: Clarendon Press, 1886)',
               'The first Chinese pilgrim to India: Faxian crosses the desert and the Pamirs, visits the Buddhist holy sites and lives in Pataliputra and Ceylon, and tells what Buddhism looked like in the age of the Guptas.',
               lib=('A Record of Buddhistic Kingdoms (Faxian, trans. Legge, 1886)', 'bu', 'c. 414 CE', 'maha', 'Buddhism takes root in China')),
    'x-its': G('india.history.resource.88902', 'J. Takakusu (translator), A Record of the Buddhist Religion as Practised in India and the Malay Archipelago (A.D. 671–695) by I-Tsing (Oxford: Clarendon Press, 1896)',
               'A Chinese monk’s account of how the Buddhist monastic rules were kept in India and Sumatra at the end of the 7th century: dress, food, bathing, rites, the order of the day, and what the sick and dying were told. ' + OLD,
               lib=('A Record of the Buddhist Religion as Practised in India and the Malay Archipelago (I-Tsing, trans. Takakusu, 1896)', 'bu', 'c. 691 CE', 'maha', 'Buddhism takes root in China')),
    'x-sks': G('sikshasamuccayac00santuoft', 'Cecil Bendall and W. H. D. Rouse (translators), Śikshāsamuccaya: a compendium of Buddhist doctrine, compiled by Śāntideva chiefly from earlier Mahāyāna sūtras (London: John Murray, 1922)',
               'Shantideva’s anthology of Mahayana sutra passages on the bodhisattva path: giving, guarding oneself, patience, vigour and wisdom, with many quotations from sutras that are now lost in their original Sanskrit. The companion to his Bodhicaryavatara. ' + SKT,
               lib=('Shikshasamuccaya (Shantideva, trans. Bendall and Rouse, 1922): a compendium of Mahayana doctrine', 'bu', 'c. 700 CE', 'maha', 'Tibet: the bardo')),
    'x-lvs': G('in.ernet.dli.2015.196141', 'Rajendralala Mitra (translator), The Lalita Vistara, or Memoirs of the Early Life of Sakya Sinha (Calcutta: Asiatic Society of Bengal, 1881)',
               'The Mahayana life of the Buddha from his descent from Tushita heaven to the first sermon in the Deer Park, in a rich Sanskrit narrative that the Borobudur reliefs illustrate. ' + OLD,
               lib=('The Lalita Vistara (Mitra, 1881): the Mahayana life of the Buddha', 'bu', 'c. 3rd c. CE', 'maha', 'The Buddha: the first sermon')),
    'x-asa': G('InscriptionsOfAsoka.NewEditionByE.Hultzsch', 'E. Hultzsch (editor and translator), Inscriptions of Asoka (Corpus Inscriptionum Indicarum, vol. 1; Oxford: Clarendon Press, 1925)',
               'The rock and pillar edicts of King Ashoka (about 268–232 BCE), the oldest Buddhist texts in writing: his remorse after Kalinga, his appeal for tolerance of all sects, and his instructions to his officials, with the scholar’s English. Ashoka’s Edict 12 is the first known royal text in favour of religious toleration. The Prakrit and Greek text come through as noise.',
               lib=('Inscriptions of Asoka (Hultzsch, 1925): the Buddhist king’s rock and pillar edicts', 'bu', 'c. 268–232 BCE', 'pali', 'The Buddha: the first sermon')),
    'x-cat': G('buddhistscriptur00bealuoft', 'Samuel Beal (translator), A Catena of Buddhist Scriptures from the Chinese (London: Trübner, 1871)',
               'Extracts from the Chinese Buddhist canon: the Sutra of Forty-two Sections, the Dhammapada in its Chinese form, the “Buddhist Bible” excerpts on the ten stages of the bodhisattva, and other short sutras and hymns, with Beal’s introductions. ' + OLD,
               lib=('A Catena of Buddhist Scriptures from the Chinese (Beal, 1871)', 'bu', 'c. 1st–7th c. CE', 'maha', 'Buddhism takes root in China')),

    # ── Jain ──
    'x-gms': G('sacredbooksofthe029558mbp', 'J. L. Jaini (translator), Gommatsara Jiva-Kanda (the Soul Section) by Nemichandra (Sacred Books of the Jainas, vol. 5; Lucknow: Central Jaina Publishing House, 1927)',
               'The Digambara textbook of the soul and its states: the stages of spiritual progress, the kinds of beings, the senses and the paths to liberation, as Nemichandra summed them up for the school (about 980 CE), with the commentary. ' + OLD,
               lib=('Gommatsara Jiva-Kanda (Nemichandra, trans. Jaini, 1927)', 'ja', 'c. 980 CE', 'jain', 'Mahavira and the Jain way')),
    'x-kdk': G('sacredbooksofthe029556mbp', 'Rai Bahadur J. L. Jaini and Pandit Ajit Prasada (translators), The Samayasara by Kundakundacharya (Sacred Books of the Jainas, vol. 8; Lucknow: Central Jaina Publishing House, 1930)',
               'The Digambara classic by Kundakunda on the self and the bonds of karma: the pure soul, the causes of bondage, and how right view loosens them. One of the most studied Jain books. ' + OLD,
               lib=('Samayasara (Kundakunda, trans. Jaini, 1930)', 'ja', 'c. 2nd c. CE', 'jain', 'Mahavira and the Jain way'),
               license='Public domain in the United States (published in 1930; scan from the Internet Archive; OCR text may contain errors)'),

    # ── China and Japan ──
    'x-kgy': G('taishangkanying00compgoog', 'Teitaro Suzuki and Paul Carus (translators), T’ai-shang Kan-ying P’ien: Treatise of the Exalted One on Response and Retribution (Chicago: Open Court, 1906)',
               'The most widely printed Daoist book of morals (about 1150 CE): the gods watch each person’s deeds and add or take away years of life, with its list of good and evil deeds, its long commentary and its folk stories. The “ledger” tradition of keeping moral accounts begins here. Suzuki died in 1966, so his English may still be protected in some countries.',
               lib=('T’ai-shang Kan-ying P’ien: Treatise on Response and Retribution (Suzuki and Carus, 1906)', 'ch', 'c. 1150 CE', 'chin', 'The Daoists')),
    'x-wym': G('thephilosophyofw00henkuoft', 'Frederick Goodrich Henke (translator), The Philosophy of Wang Yang-ming (Chicago: Open Court, 1916)',
               'The Neo-Confucian teacher’s “Instructions for Practical Life,” his recorded discourses, the “Inquiry regarding the Great Learning” and his letters, with a biography: the unity of knowing and doing, and the conscience that tells right from wrong, as the heart of his school. ' + OLD,
               lib=('The Philosophy of Wang Yang-ming (Henke, 1916): Instructions for Practical Life and the Inquiry regarding the Great Learning', 'ch', 'c. 1518 CE', 'chin', 'Confucius')),
    'x-chx': G('thephilosophyofh00chuhuoft', 'J. Percy Bruce (translator), The Philosophy of Human Nature by Chu Hsi (London: Probsthain, 1922)',
               'Zhu Xi’s treatise on human nature, mind, heaven and the way, translated from the Chinese with Bruce’s introduction: the Neo-Confucian synthesis that was the Chinese state teaching for six hundred years. ' + OLD,
               lib=('The Philosophy of Human Nature (Chu Hsi, trans. Bruce, 1922)', 'ch', 'c. 1170–1200 CE', 'chin', 'Confucius')),
    'x-ili': G('iliorbookofetiqu01stee', 'John Steele (translator), The I-li, or Book of Etiquette and Ceremonial, 2 vols. (London: Probsthain, 1917)',
               'The Confucian ritual classic on the ceremonial life of the officer class: the capping of an officer’s son, marriage, the district archery meeting and the other rites of the year, in Steele’s English with the commentary. Complements the Library’s Li Ki (Book of Rites). ' + OLD,
               lib=('The I-li, or Book of Etiquette and Ceremonial (Steele, 1917): capping, marriage, archery and the other rites', 'ch', 'c. 400–200 BCE', 'chin', 'Confucius')),
    'x-jtw': G('cu31924074502034', 'Timothy Richard (translator), A Mission to Heaven: A Great Chinese Epic and Allegory (Shanghai: Christian Literature Society, 1913)',
               'A short English version of the Chinese novel Journey to the West, in which the monk Tripitaka travels to India for the scriptures with the Monkey King, Pigsy and Sandy, told as a Buddhist-Daoist allegory of the soul’s journey. Richard, a Baptist missionary, reads it as a Christian parable and shortens it freely; the full novel is not here. ' + OLD,
               lib=('A Mission to Heaven (Timothy Richard, 1913): an abridged Journey to the West', 'ch', 'c. 1592 CE (translation 1913)', 'chin', 'Tang Buddhism, Chan')),

    'x-abi': G(['alberunisindiaac01biru', 'alberunisindiaac02albi'], 'Edward C. Sachau (translator), Alberuni’s India: An Account of the Religion, Philosophy, Literature, Geography, Chronology, Astronomy, Customs, Laws and Astrology of India about A.D. 1030, 2 vols. (London: Trübner, 1888)',
               'A Muslim scholar’s book on the Hindus, written about 1030 after years in India: their beliefs about God, the soul and release, the Vedas, the Puranas, the Gita and the Patanjali Yoga, caste, festivals and fasts, idols, calendars and the creation of the world. The first book of comparative religion that tries to describe a faith as its own followers see it; Biruni quotes the Sanskrit texts at length. ' + OLD,
               labels=['Volume 1', 'Volume 2'],
               lib=('Alberuni’s India (al-Biruni, trans. Sachau, 1888): an eleventh-century Muslim’s account of Hindu religion and customs', 'in', 'c. 1030 CE', 'ved', 'Kabir and the Hatha')),
}
