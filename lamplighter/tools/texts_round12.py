"""Specs for a twelfth batch of open (pre-1931) English texts, found by an assessment of the Atlas against the Library (what religions, offshoots and peoples had no readable example):
the offshoots and dissenting movements of Christianity, Judaism and Islam (Waldensians, Lollards, Hussites, Doukhobors, Plymouth Brethren, Pharisees, Druze, the Persian Bábí movement, the
Sufi orders), the new movements (Oahspe, the Aquarian Gospel, the Watch Tower, the Christadelphians, the secularists), the religions of India and Tibet and the Buddhism of Japan
(Farquhar, Bhandarkar, Waddell, Suzuki, Nichiren), Minoan and Etruscan-age Europe (Evans, Nilsson, Showerman, Tacitus, Herodotus), and a shelf of field records for the peoples of
Africa, India, Southeast Asia, the Pacific and North America that the Atlas lists and the Library did not yet read. Merged into texts_archive.SPECS; built with
python3 build_texts.py --only=ids. An ident 'PG123' is Project Gutenberg #123; the rest are Internet Archive items. Found 16 November 2026.

Left out on purpose (the sacred-material rule and the English-only rule): Lumholtz's Symbolism of the Huichol Indians and Densmore's Chippewa Music (the sacred symbols and songs of
peoples who are living today), the Nusayri (Alawite) secret books, and the Ugaritic tablets (no English before 1931).
"""
from texts_round9 import S, SCH, REF
from texts_round10 import G, T, FIELD
from texts_round8 import MOV, PER, OLD

SPECS = {}
NEW = 'Bahá’í, Theosophy'
RFM = 'The Quakers: waiting in silence'
MYST = 'Christian mystics and the Jesus Prayer'


def add(i, idents, by, note, lib, **kw):
    if kw.get('split') == 'auto': kw.setdefault('min_chars', 250)      # a contents list the splitter broke into one-line sections
    SPECS[i] = G(idents, by, note, lib=lib, **kw)


# ── Offshoots, dissent and reform in Christianity, Judaism and Islam ──
add('x-lea', ['historyofinquis01leah', 'historyofinquis02leah', 'historyofinquis03leah'], 'Henry Charles Lea, A History of the Inquisition of the Middle Ages, three volumes (New York: Harper, 1887; this printing 1906)',
    'The standard history of the medieval Inquisition: the Cathars and Albigensians, the Waldensians, the Spiritual Franciscans, the Templars, sorcery and witchcraft, the procedure and the punishments, from the church’s own records (all three volumes). ' + SCH,
    S('A History of the Inquisition of the Middle Ages (Henry Charles Lea, 1887), three volumes: the Cathars, Waldensians and the trials of heresy', '1887 CE'), split=None)
add('x-wld', 'historyofwaldens00comb', 'Emilio Comba, History of the Waldenses of Italy from their Origin to the Reformation, translated by Teofilo E. Comba (London: Truslove & Shirley, 1889)',
    'The Waldensian pastor’s history of the poor men of Lyon and their churches in the Alpine valleys: Valdes and his followers, their Scriptures in the vernacular, persecution and the Barbes, and their joining of the Reformation. ' + SCH,
    S('History of the Waldenses of Italy (Emilio Comba, 1889)', '1173–1532 CE (pub. 1889)'), split='auto')
add('x-wyc', ['in.ernet.dli.2015.191340', 'in.ernet.dli.2015.191341'], 'Herbert B. Workman, John Wyclif: A Study of the English Medieval Church, two volumes (Oxford: Clarendon Press, 1926)',
    'The standard life of the Oxford theologian whose teaching on Scripture, the Church and the sacrament lay behind the Lollards and the English Bible: his career, his writings, the rise of Lollardy and its persecution. ' + SCH,
    S('John Wyclif: A Study of the English Medieval Church (Herbert B. Workman, 1926), two volumes', '1380s CE (pub. 1926)'), split=None)
add('x-hus', 'lettersofjohnhus00husjuoft', 'The Letters of John Hus, translated by Herbert B. Workman and R. Martin Pope (London: Hodder and Stoughton, 1904)',
    'The letters of the Bohemian reformer written from Constance and from his prison before his burning in 1415: to his friends, to the people of Prague and to his judges. A primary source for the Hussite movement. ' + PER,
    ('The Letters of John Hus (trans. Workman and Pope, 1904)', 'ec', '1402–15 CE', 'ec', RFM), split=None)
add('x-rud', 'russiandissenter00conyuoft', 'Frederick C. Conybeare, Russian Dissenters (Cambridge, Mass.: Harvard University Press, 1921; Harvard Theological Studies X)',
    'An Oxford scholar’s account of the Old Believers and the sects of Russian Spiritual Christianity: the schism of 1666, the Khlysty and Skoptsy, the Doukhobors and the Molokans, with extracts from their own writings. ' + SCH,
    S('Russian Dissenters (F. C. Conybeare, 1921): the Old Believers, Doukhobors, Molokans and other sects', '1666–1920 CE'), split=None)
add('x-dkh', 'apeculiarpeoplet00mauduoft', 'Aylmer Maude, A Peculiar People: The Doukhobors (New York: Funk & Wagnalls, 1904)',
    'The translator of Tolstoy’s account of the Doukhobors, the Russian sect of non-resisters who went to Canada in 1899: their history, their “Book of Life”, their psalms, their refusal of arms and of church. ' + FIELD,
    S('A Peculiar People: The Doukhobors (Aylmer Maude, 1904)', '1740–1904 CE'), split='auto')
add('x-pbr', 'ahistoryoftheply00neatuoft', 'W. Blair Neatby, A History of the Plymouth Brethren (London: Hodder and Stoughton, 1901)',
    'The history of the movement that began in Dublin and Plymouth in the 1820s with J. N. Darby: its refusal of a settled ministry, its teaching of the Church as a body outside the denominations and of the Lord’s coming, and the Exclusive and Open divisions. ' + SCH,
    S('A History of the Plymouth Brethren (W. Blair Neatby, 1901)', '1827–1900 CE'), split='auto')
add('x-bdk', 'a548464700bootuoft', 'William Booth, In Darkest England and the Way Out (London: Salvation Army, 1890)',
    'The founder of the Salvation Army’s book of 1890: the “submerged tenth” of the English poor and his plan of shelters, farm colonies and emigration, which set out the Army’s social work beside its preaching. ' + MOV,
    ('In Darkest England and the Way Out (William Booth, 1890)', 'mo', '1890 CE', 'mod', NEW), split='auto')
add('x-wcf', 'westminsterconf00unknuoft', 'The Westminster Confession of Faith, with the Larger and Shorter Catechisms (the Westminster Assembly, 1646–47; Edinburgh printing of 1882)',
    'The doctrinal standard of the Presbyterian churches, drawn up by the Westminster Assembly of divines: Scripture, God and the decrees, creation, the fall, Christ the Mediator, justification, the sacraments and the last things, with the Larger and Shorter Catechisms. ' + MOV,
    ('The Westminster Confession of Faith (1646)', 'ec', '1646–47 CE', 'ec', RFM), split=None)
add('x-rcc', 'racoviancatechis00reesuoft', 'The Racovian Catechism, with notes and illustrations, translated from the Latin by Thomas Rees (London: Longman, 1818)',
    'The catechism of the Polish Brethren, the Socinians (1605), which denies the Trinity and the pre-existence of Christ and teaches the use of reason in reading Scripture, an ancestor of Unitarian belief; in Rees’s English of 1818 with his notes. ' + OLD,
    ('The Racovian Catechism (the Polish Brethren, 1605; trans. Rees, 1818)', 'ec', '1605 CE', 'ec', RFM), split='auto')
add('x-art', 'truechristianit00arnd', 'Johann Arndt, True Christianity: a Treatise on Sincere Repentance, True Faith, the Holy Walk of the True Christian (the English of Anthony William Boehm, 1712; printed Philadelphia, 1868)',
    'The Lutheran pastor’s devotional classic (1605–10), which led German Protestants from doctrine to the inward life of repentance, faith and love and was a foundation of Pietism: the new birth, the imitation of Christ, and the book of nature. ' + OLD,
    ('True Christianity (Johann Arndt, 1605–10; English edition of 1868)', 'ec', '1605–10 CE', 'ec', RFM), split='auto')
add('x-hph', 'whatworldowestop00herf', 'R. Travers Herford, What the World Owes to the Pharisees (London: Watts, 1919)',
    'A Unitarian rabbinic scholar’s defence of the Pharisees against the Gospel picture: their teaching of the oral Torah, their piety and their part in making rabbinic Judaism and the synagogue. ' + SCH,
    S('What the World Owes to the Pharisees (R. Travers Herford, 1919)', '1919 CE'), split='auto')
add('x-gtz', ['historyofjews01grae', 'historyofjews02grae', 'historyofjews03grae', 'historyofjews04grae', 'historyofjews05grae', 'historyofjews06grae'], 'Heinrich Graetz, History of the Jews, six volumes (Philadelphia: Jewish Publication Society of America, 1891–98)',
    'The great nineteenth-century history of the Jewish people from the earliest times to the 1870s in English: the age of the Bible, the Second Temple, the Talmud, the Spanish Jews, the Kabbalah, Sabbatai Zevi, Frank and the beginnings of Hasidism, and the modern world. ' + SCH,
    S('History of the Jews (Heinrich Graetz, 1891–98), six volumes', '1853–75 CE (pub. 1891–98)'), split=None)
add('x-dzt', 'zoroastriantheol00dhaluoft', 'Maneckji Nusservanji Dhalla, Zoroastrian Theology from the Earliest Times to the Present Day (New York: Columbia University Press, 1914)',
    'A Parsi priest’s account of his own religion’s thought, the first in English by a Zoroastrian: the Avesta and the Gathas, Ahura Mazda and the spirits, the Pahlavi books, the doctrine of the soul and the last things, and the modern Parsi movements. ' + SCH,
    S('Zoroastrian Theology from the Earliest Times to the Present Day (M. N. Dhalla, 1914)', '1914 CE'), split='auto')
add('x-blp', ['cu31924026106215', 'in.gov.ignca.14759', 'dli.bengal.10689.10092'], 'Edward G. Browne, A Literary History of Persia, volumes I–III (London: T. Fisher Unwin, 1902–20)',
    'The standard English history of Persian literature and thought: volume I from the earliest times to Firdawsi (Zoroastrianism, Manichaeism, Mazdak, the Arab conquest), volume II from Firdawsi to Sa’di (Sufism, the Ismailis, Nasir-i Khusraw), volume III the Tartar dominion (Rumi, Hafiz, the Hurufis). ' + SCH,
    S('A Literary History of Persia (E. G. Browne, 1902–20), volumes I–III', '1902–20 CE'), split=None)
add('x-bbr', 'materialsforstud00browuoft', 'Edward G. Browne (ed.), Materials for the Study of the Bábí Religion (Cambridge: University Press, 1918)',
    'Browne’s collection of the primary sources of the Báb’s movement in English translation: the history of the Bábís, the writings of the Báb and Baha’u’llah’s early tablets, and the accounts of the martyrdoms, which he collected over twenty years in Persia. ' + MOV,
    ('Materials for the Study of the Babi Religion (E. G. Browne, 1918)', 'mo', '1844–1892 CE (pub. 1918)', 'mod', NEW), split='auto')
add('x-hdr', 'originsofdruzepe00hitt', 'Philip K. Hitti, The Origins of the Druze People and Religion, with Extracts from their Sacred Writings (New York: Columbia University Press, 1928)',
    'A Lebanese-American historian’s account of the Druze: their origin in the Ismaili movement and the caliph al-Hakim, the preaching of Hamza, the doctrine of the One God and of reincarnation, and their history in the mountains of Lebanon, with extracts from the writings that have been made public. ' + SCH,
    S('The Origins of the Druze People and Religion (Philip K. Hitti, 1928)', '1017–1928 CE'), split='auto')
add('x-bdv', 'dervishesororien00brow', 'John P. Brown, The Dervishes; or, Oriental Spiritualism (London: Trübner, 1868)',
    'An American dragoman’s survey of the dervish orders of the Ottoman world, from his own acquaintance with them: the Mevlevi, Bektashi, Rifai, Qadiri, Naqshbandi and other orders, their rules, their initiations and their ceremonies, with the Sufi doctrine behind them. ' + FIELD,
    S('The Dervishes; or, Oriental Spiritualism (John P. Brown, 1868)', '1868 CE'), split='auto')
add('x-aia', ['in.ernet.dli.2015.32526', 'in.ernet.dli.2015.46757'], 'Abu’l-Fazl ʿAllami, The Ā’īn-i Akbarī, translated by H. Blochmann (volume I, Calcutta, 1873) and H. S. Jarrett (volume III, Calcutta, 1894; volume II, on the provinces, is not among the readable scans)',
    'The administrative handbook of the Emperor Akbar’s empire: the court, the army and the arts of government in volume I, and in volume III the account of the religions of India (Hindus, Jains, Buddhists, Parsis) and of Akbar’s own “divine religion” and his debates with the learned of every faith. ' + SCH,
    S('The Ain-i Akbari (Abu’l-Fazl, 1590s; trans. Blochmann and Jarrett, 1873–94), volumes I and III', '1590s CE (trans. 1873–94)'), split=None)
add('x-awf', 'awarifulmaarif00suhr', 'Shihab al-Din ʿUmar al-Suhrawardi, The ʿAwārifu-l-Maʿārif, translated by H. Wilberforce Clarke (Calcutta: Government of India, 1891)',
    'The handbook of the Suhrawardi Sufi order, written in Baghdad in the 13th century: the Sufi’s way, the master and disciple, the rules of the lodge, the stations and states of the soul, and the practice of remembrance, as the standard teaching manual for the Sufi orders. ' + OLD,
    ('The Awarifu-l-Ma‘arif (al-Suhrawardi, 13th c.; trans. Clarke, 1891)', 'is', 'c. 1220 CE', 'isl', 'Al-Ghazālī and ʿAṭṭār'), split='auto')

# ── The religions of India, Tibet and Japan ──
add('x-fmr', 'modernreligiousm00farquoft', 'J. N. Farquhar, Modern Religious Movements in India (New York: Macmillan, 1915)',
    'The survey of the reform and revival movements of 19th-century India: the Brahmo Samaj, the Arya Samaj, the Theosophical Society, the Ramakrishna Mission, the Prarthana Samaj, the Muslim and Sikh movements and the new Hinduisms, by a missionary scholar. ' + SCH,
    S('Modern Religious Movements in India (J. N. Farquhar, 1915)', '1828–1915 CE'), split='auto')
add('x-bvs', 'in.ernet.dli.2015.282470', 'Ramkrishna Gopal Bhandarkar, Vaisnavism, Saivism and Minor Religious Systems (Strassburg: Karl J. Trübner, 1913; Grundriss der indo-arischen Philologie III, 6)',
    'The Indian Sanskritist’s history of the two great currents of Hinduism: Vasudeva and Krishna worship, the Pancharatra and the Bhagavata, the Alvars, Ramanuja, Madhva, Nimbarka and Vallabha; Shaivism, the Pashupatas and the Shaiva Siddhanta; and the lesser sects (Shakta, Ganapatya). ' + SCH,
    S('Vaisnavism, Saivism and Minor Religious Systems (R. G. Bhandarkar, 1913)', '1913 CE'), split='auto')
add('x-wad', 'buddhismoftibeto00wadd', 'L. Austine Waddell, The Buddhism of Tibet, or Lamaism, with its Mystic Cults, Symbolism and Mythology, and in its Relation to Indian Buddhism (London: W. H. Allen, 1895)',
    'The first full English account of Tibetan Buddhism: its history from Padmasambhava, the sects (Nyingma, Kadampa, Sakya, Kagyu, Gelug), the monasteries, the deities and the rites, the priesthood and the Dalai Lama, and the pre-Buddhist Bon. A Western view of its day, and often hostile. ' + SCH,
    S('The Buddhism of Tibet, or Lamaism (L. A. Waddell, 1895)', '1895 CE'), split='auto')
add('x-fai', 'in.ernet.dli.2015.96793', 'A. H. Francke, Antiquities of Indian Tibet, volume I: Personal Narrative; volume II: The Chronicles of Ladakh and Minor Chronicles (Calcutta: Archaeological Survey of India, 1914–26)',
    'The Moravian missionary’s record of the western Tibetan land of Ladakh: the monasteries and their Buddhism, the rock inscriptions, the Bon and older religion of the region, and the chronicles of the kings (La-dvags-rgyal-rabs). ' + SCH,
    S('Antiquities of Indian Tibet (A. H. Francke, 1914–26)', '1914 CE'), split=None)
add('x-bpl', 'in.ernet.dli.2015.150798', 'Sir Charles Bell, The People of Tibet (Oxford: Clarendon Press, 1928)',
    'The British Political Officer’s account of Tibetan life: the land, the family and the village, the government and the Dalai Lama, the monks and monasteries, the oracles, charms and spirits and the festivals, from his years in Lhasa. ' + FIELD,
    S('The People of Tibet (Sir Charles Bell, 1928)', '1928 CE'), split='auto')
add('x-smo', 'outlinesofmahay00suzurich', 'Daisetz Teitaro Suzuki, Outlines of Mahayana Buddhism (London: Luzac, 1907)',
    'The Zen scholar’s first book in English: the Mahayana against the Hinayana, the Buddha and his three bodies, the Bodhisattva, emptiness and suchness, the Avatamsaka, and the practice of the Mahayana. ' + SCH,
    S('Outlines of Mahayana Buddhism (D. T. Suzuki, 1907)', '1907 CE'), split='auto')
add('x-slk', 'in.ernet.dli.2015.115371', 'Daisetz Teitaro Suzuki, Studies in the Lankavatara Sutra (London: Routledge, 1930)',
    'Studies of the Mahayana scripture on the mind-only (Yogacara) teaching: the storehouse consciousness, the Tathagata-garbha, and the Lankavatara’s place in the history of Zen. ' + SCH,
    S('Studies in the Lankavatara Sutra (D. T. Suzuki, 1930)', '1930 CE'), split='auto')
add('x-sze', 'dt-suzuki-essays-in-zen-buddhism-1', 'Daisetz Teitaro Suzuki, Essays in Zen Buddhism, first series (London: Luzac, 1927)',
    'Suzuki’s essays which made Zen known to the West: what Zen is, the Zen sect of Buddhism, the meaning of satori, the Zen masters’ sayings and the Koan, Bodhidharma and the Ch’an tradition, and the Zen monk’s life. ' + SCH,
    S('Essays in Zen Buddhism, first series (D. T. Suzuki, 1927)', '1927 CE'), split='auto')
add('x-nic', 'nichirenbuddhist00anesrich', 'Masaharu Anesaki, Nichiren, the Buddhist Prophet (Cambridge, Mass.: Harvard University Press, 1916)',
    'The life and teaching of the 13th-century Japanese Buddhist reformer who taught devotion to the Lotus Sutra, wrote the Rissho Ankoku Ron and prophesied for Japan: the source of the Nichiren schools and of Soka Gakkai, Reiyukai and Rissho Kosei Kai. ' + SCH,
    S('Nichiren, the Buddhist Prophet (Masaharu Anesaki, 1916)', '1222–82 CE (pub. 1916)'), split='auto')

# ── New movements and the secular movements ──
add('x-oah', 'oahspe0001john', 'John Ballou Newbrough, Oahspe: A New Bible (New York and London: Oahspe Publishing Association, 1882)',
    'The scripture of Faithism, given by its author as written automatically in 1881–82 under the guidance of angels: a cosmogony of the universe and the earth, a history of the “Kosmon era” of the world’s peoples and their gods, and the Book of Jehovih with a communal rule of life. ' + MOV,
    ('Oahspe: A New Bible (John Ballou Newbrough, 1882)', 'mo', '1882 CE', 'mod', NEW), split=None)
add('x-aqg', 'aquariangospelof00levirich', 'Levi H. Dowling, The Aquarian Gospel of Jesus the Christ (Los Angeles: E. S. Dowling, 1908; this printing 1911)',
    'The book that gave the Aquarian age its name: a life of Jesus, presented as taken from the Akashic records, which sends him to India, Tibet, Persia, Egypt and Greece in his “lost years” and puts reincarnation and the Christ within into the Gospel. ' + MOV,
    ('The Aquarian Gospel of Jesus the Christ (Levi H. Dowling, 1908)', 'mo', '1908 CE', 'mod', NEW), split='auto')
add('x-hgo', 'harpofgodproofco00ruth', 'Joseph F. Rutherford, The Harp of God: Proof Conclusive that Millions Now Living Will Never Die (Brooklyn: International Bible Students Association, 1921)',
    'The Watch Tower Society’s book of 1921 which set out the Bible Students’ teaching: God and Jehovah, the ransom, the end of the old world in 1914, the Kingdom, the resurrection and the “other sheep”, in questions and answers for study. ' + MOV,
    ('The Harp of God (Joseph F. Rutherford, 1921)', 'mo', '1921 CE', 'mod', NEW), split='auto')
add('x-elp', 'elpisisraelexpos00thomiala', 'John Thomas, Elpis Israel: An Exposition of the Kingdom of God, with Reference to the Time of the End and the Age to Come (the seventh edition, 1910; first published 1849)',
    'The founding book of the Christadelphians, written by a physician-turned-preacher: the nature of man and death, the Abrahamic covenant, the restoration of Israel and the return of Christ to reign over the world, and the way of baptism. ' + MOV,
    ('Elpis Israel (John Thomas, 1849)', 'mo', '1849 CE', 'mod', NEW), split='auto')
add('x-ing', 'godsotherlectu00inge', 'Robert G. Ingersoll, The Gods, and Other Lectures (Washington: C. P. Farrell, 1879)',
    'The great American freethinker’s lectures against orthodox Christianity: “The Gods”, “Humboldt”, “Thomas Paine”, “Individuality”, “Heretics and Heresies”, “The Ghosts”, with his case for reason, liberty and a humane religion without a creed. ' + MOV,
    ('The Gods, and Other Lectures (Robert G. Ingersoll, 1879)', 'mo', '1872–79 CE', 'mod', NEW), split='auto')
add('x-hly', 'principlesofsecu00holy', 'George Jacob Holyoake, The Principles of Secularism Illustrated (London: Austin & Co., 1871)',
    'The coiner of the word “secularism” sets out the movement’s case: that morality and public life should be founded on the present world and on reason, without a stand on belief, with answers to the objections of the churches. ' + MOV,
    ('The Principles of Secularism (G. J. Holyoake, 1859; 1871 edition)', 'mo', '1859 CE', 'mod', NEW), split='auto')
add('x-hae', 'riddleofuniverse00haecuoft', 'Ernst Haeckel, The Riddle of the Universe at the Close of the Nineteenth Century, translated by Joseph McCabe (London: Watts, 1900)',
    'The German biologist’s “monism”: that matter and spirit, God and the world, are one; his criticism of the personal God, of immortality and of free will, and his proposal of a religion of nature and a “cult of the true, the good and the beautiful”. ' + MOV,
    ('The Riddle of the Universe (Ernst Haeckel, 1899; trans. McCabe, 1900)', 'mo', '1899 CE', 'mod', NEW), split='auto')

# ── The ancient world: Greece, Rome, Minos ──
add('x-gmg', 'greatmotherofgo00show', 'Grant Showerman, The Great Mother of the Gods (Madison: University of Wisconsin, 1901; Bulletin of the University of Wisconsin, Philology and Literature Series, vol. 1)',
    'A study of the Phrygian goddess Cybele and her young lover Attis in Asia Minor, Greece and Rome: her cult, her priests the Galli, the festival of March, the taurobolium and the introduction of the Magna Mater to Rome in 204 BCE. ' + SCH,
    S('The Great Mother of the Gods (Grant Showerman, 1901)', '1901 CE'), split='auto')
add('x-nmm', 'in.ernet.dli.2015.529266', 'Martin P. Nilsson, The Minoan-Mycenaean Religion and its Survival in Greek Religion (Lund: C. W. K. Gleerup, and London: Oxford University Press, 1927)',
    'The Swedish scholar’s study of the religion of Bronze Age Crete and Mycenae from the images, cult places and seals: the goddess with snakes and doves, the tree and pillar cult, the sacral horns and the double axe, and what passed from it into the religion of the Greeks. ' + SCH,
    S('The Minoan-Mycenaean Religion and its Survival in Greek Religion (Martin P. Nilsson, 1927)', '1927 CE'), split='auto')
add('x-pom', 'palaceofminoscom01evanuoft', 'Sir Arthur Evans, The Palace of Minos: A Comparative Account of the Successive Stages of the Early Cretan Civilization as Illustrated by the Discoveries at Knossos, volume I (London: Macmillan, 1921)',
    'The excavator’s account of Knossos and the Minoan world, volume I (the Neolithic and Early and Middle Minoan ages): the cult objects, the shrines and the sacred symbols, the horns of consecration, the dove goddess and the bull. ' + SCH,
    S('The Palace of Minos at Knossos (Sir Arthur Evans, 1921), volume I', '1921 CE'), split=None)
add('x-ger', 'tacitusagricolag00taciiala', 'Tacitus, The Agricola and Germania, translated by A. J. Church and W. J. Brodribb (London: Macmillan, 1894)',
    'Two short works of c. 98 CE: the life of the governor of Britain, and the Roman account of the peoples of Germany, their gods (Mercury, Hercules, Mars, Isis among the Suebi), the sacred groves, the casting of lots, the goddess Nerthus and the horses of the gods. A Roman’s view of the religion of the Germans. ' + OLD,
    ('Tacitus, Agricola and Germania (trans. Church and Brodribb, 1894)', 'ne', 'c. 98 CE', 'norse', 'The Viking Age'), split='auto')
add('x-hrd', 'historiesofherod00hero', 'Herodotus, The Histories, translated by Henry Cary, with a critical and biographical introduction by Basil L. Gildersleeve (New York: D. Appleton, 1904)',
    'The “Father of History” (c. 430 BCE): the Persian Wars, with the long passages on the customs and religion of the Egyptians, Babylonians, Scythians, Persians and Greeks, the oracles of Delphi and Dodona, and the Greek names of the gods. An early work of comparative religion, in Cary’s English of 1847 with Gildersleeve’s introduction. ' + OLD,
    ('The Histories (Herodotus, c. 430 BCE; trans. Cary, 1847; ed. 1904)', 'gr', 'c. 430 BCE', 'grk', 'Heraclitus, Parmenides and Plato'), split='auto')

# ── Field records: Africa, India, Southeast Asia, the Pacific and North America (tribal shelf) ──
def fld(i, ident, by, note, title, when, **kw):
    add(i, ident, by, note + ' ' + FIELD, T(title, when), **kw)


fld('a-ain', 'ainutheirfolklor00batcrich', 'John Batchelor, The Ainu and their Folk-Lore (London: The Religious Tract Society, 1901)',
    'The missionary’s account of the Ainu of Hokkaido: their gods (the kamui of the mountain, the sea and the house), the bear festival, the shamans, the stories of the Ainu, their funerals and their ideas of the other world.', 'The Ainu and their Folk-Lore (John Batchelor, 1901)', 'recorded 1880s–1900 CE', split='auto')
fld('a-hob', 'bantubeliefsmagi00hobl', 'C. W. Hobley, Bantu Beliefs and Magic, with particular reference to the Kikuyu and Kamba tribes of Kenya Colony (London: H. F. & G. Witherby, 1922)',
    'A colonial administrator’s account of the religion of the Kikuyu, Kamba and other Bantu peoples of Kenya: Ngai the high god, the sacred fig trees and the ancestors, magic and the medicine men, the oath and the ordeal, and rites of birth, circumcision and death.', 'Bantu Beliefs and Magic (C. W. Hobley, 1922)', 'recorded 1890s–1910s CE', split='auto')
fld('a-rou', 'withprehistoricp00rout', 'W. Scoresby Routledge and Katherine Routledge, With a Prehistoric People: The Akikuyu of British East Africa (London: Edward Arnold, 1910)',
    'The first full English account of the Kikuyu: their land and families, their god Ngai, their spirits and sacred trees, their sacrifices and ceremonies of birth, initiation and death, as the authors saw and were told them.', 'With a Prehistoric People: The Akikuyu of British East Africa (the Routledges, 1910)', 'recorded 1900s CE', split='auto')
fld('a-tal', 'lifeinsouthernni00talb', 'P. Amaury Talbot, Life in Southern Nigeria: The Magic, Beliefs and Customs of the Ibibio Tribe (London: Macmillan, 1923)',
    'A colonial officer’s record of the Ibibio of the Cross River country: their high god and the earth, the spirits of the bush and rivers, the secret society Ekpo, divination and witchcraft, the “leopard people”, and rites of birth and death.', 'Life in Southern Nigeria: The Magic, Beliefs and Customs of the Ibibio Tribe (P. A. Talbot, 1923)', 'recorded 1910s–1920s CE', split='auto')
fld('a-bas', 'amongibosofniger00basd', 'George T. Basden, Among the Ibos of Nigeria: An Account of the Curious and Interesting Habits, Customs and Beliefs of a Little Known African People (London: Seeley, Service, 1921)',
    'A missionary’s account of the Igbo of Onitsha: their chi and Chukwu, the earth goddess Ala, the spirits and the oracle of Aro, the ozo title society and the festivals, with the rites of birth, marriage and death.', 'Among the Ibos of Nigeria (G. T. Basden, 1921)', 'recorded 1900s–1910s CE', split='auto')
fld('a-cas', 'basutosortwentyt00casa', 'Eugène Casalis, The Basutos; or, Twenty-Three Years in South Africa (London: James Nisbet, 1861)',
    'A French missionary’s account of the Sotho of Moshoeshoe’s kingdom: their ancestors and the Modimo, the rainmakers and diviners, initiation and the ritual of the chief, and the coming of the mission.', 'The Basutos; or, Twenty-Three Years in South Africa (Eugène Casalis, 1861)', 'recorded 1833–55 CE', split='auto')
fld('a-hah', 'tsuniiigoamsupr00hahngoog', 'Theophilus Hahn, Tsuni-ǁGoam, the Supreme Being of the Khoi-Khoi (London: Trübner, 1881)',
    'The study of the religion of the Khoikhoi (“Hottentots”) of southern Africa: their high god Tsui-Goab, the hero Heitsi-Eibib and his graves, the moon and the sun, the stories of the gods and the cairns, and the rites of the people.', 'Tsuni-Goam, the Supreme Being of the Khoi-Khoi (Theophilus Hahn, 1881)', 'recorded 1860s–1880 CE', split='auto')
fld('a-she', 'shillukpeopleth01westgoog', 'Diedrich Westermann, The Shilluk People: Their Language and Folklore (Philadelphia: Board of Foreign Missions of the United Presbyterian Church, 1912)',
    'The German linguist’s collection of the Shilluk of the White Nile: their stories of Nyikang the first king and the creator Juok, their proverbs, songs and riddles, and an account of their customs.', 'The Shilluk People: Their Language and Folklore (Diedrich Westermann, 1912)', 'recorded 1910s CE', split='auto')
fld('a-sbr', 'sherbroitshinter00alld', 'T. J. Alldridge, The Sherbro and its Hinterland (London: Macmillan, 1901)',
    'A colonial official’s account of Sierra Leone and the Mende, Sherbro and Temne: the secret societies Poro and Bundu, the spirits and fetishes, the doctors and the ordeals, with the customs of birth, marriage and death.', 'The Sherbro and its Hinterland (T. J. Alldridge, 1901)', 'recorded 1870s–1900 CE', split='auto')
fld('a-ske', 'dahomeyasitis00sker', 'J. A. Skertchly, Dahomey as it is: being a Narrative of Eight Months’ Residence in that Country (London: Chapman and Hall, 1874)',
    'An English traveller’s narrative of the court of Dahomey in 1871–72: the king and the Amazons, the Annual Customs and the sacrifices, the gods and the priests of the Fon, the serpent temple and the royal ancestors.', 'Dahomey as it is (J. A. Skertchly, 1874)', 'recorded 1871–72 CE', split='auto')
fld('a-wee', 'amongprimitiveba00weekuoft', 'John H. Weeks, Among the Primitive Bakongo: A Record of Thirty Years’ Close Intercourse with the Bakongo and Other Tribes of Equatorial Africa (London: Seeley, 1914)',
    'A Baptist missionary’s account of the Kongo of the lower Congo: the high god Nzambi and the spirits of the dead, the nkisi charms, the witch doctors and the ordeals, the proverbs and stories, and the rites of birth, marriage and death.', 'Among the Primitive Bakongo (John H. Weeks, 1914)', 'recorded 1880s–1910s CE', split='auto')
fld('a-sib', 'greatafricanisla00sibr', 'James Sibree, The Great African Island: Chapters on Madagascar, a Popular Account of Recent Researches in the Physical Geography, Geology, and Exploration of the Country, and its Natural History and Botany, and in the Origin and Divisions, Customs and Language, Superstitions, Folklore, and Religious Beliefs and Practices of the Different Tribes (London: Trübner, 1880)',
    'A missionary’s account of the Malagasy: the ancestors and the god Zanahary, sacred places and the sampy charms, the oracles and the sikidy divination, the customs of the tribes, and the stories of the island.', 'The Great African Island: Madagascar (James Sibree, 1880)', 'recorded 1860s–1880 CE', split='auto')
fld('a-gua', 'guanchesofteneri00espirich', 'Alonso de Espinosa, The Guanches of Tenerife, the Holy Image of Our Lady of Candelaria, and the Spanish Conquest and Settlement, translated by Clements Markham (London: Hakluyt Society, 1907)',
    'The Dominican friar’s history (1594) of the Guanches, the Berber-speaking people of Tenerife: their god Achguayaxerax and the mummies of their dead, their kings and customs, and the finding of the image of the Virgin by the shore, with Markham’s notes.', 'The Guanches of Tenerife (Alonso de Espinosa, 1594; trans. Markham, 1907)', 'recorded 1590s CE', split='auto')
fld('a-cdv', 'wildtribesofdava122cole', 'Fay-Cooper Cole, The Wild Tribes of Davao District, Mindanao (Chicago: Field Museum of Natural History, 1913; Anthropological Series, vol. 12, no. 2)',
    'The Field Museum’s account of the Bagobo, Bilaan, Mandaya, Tagakaolo and other peoples of Mindanao: their spirits and the great spirit, the sacrifices and the priests, the festivals and the rites of birth and death.', 'The Wild Tribes of Davao District, Mindanao (Fay-Cooper Cole, 1913)', 'recorded 1908–10 CE', split='auto')
fld('a-bgb', 'studyofbagobocer00beneuoft', 'Laura Watson Benedict, A Study of Bagobo Ceremonial, Magic and Myth (New York: New York Academy of Sciences, 1916; Annals, vol. 25)',
    'The Bagobo of Mindanao’s ceremonies, the spirit world (the Tigbanua spirits and the Diwata), the sacrificial feasts, the magic and the myths, as Benedict recorded them in 1907–09.', 'A Study of Bagobo Ceremonial, Magic and Myth (Laura Benedict, 1916)', 'recorded 1907–09 CE', split='auto')
fld('a-evb', 'studiesinreligio00evanuoft', 'Ivor H. N. Evans, Studies in Religion, Folk-Lore, and Custom in British North Borneo and the Malay Peninsula (Cambridge: University Press, 1923)',
    'A Borneo official’s record of the Dusun and other peoples of North Borneo and the Orang Asli of Malaya: their spirits and priestesses, the rice rites and head-hunting, charms and taboos, and their stories.', 'Studies in Religion, Folk-Lore, and Custom in British North Borneo and the Malay Peninsula (Ivor H. N. Evans, 1923)', 'recorded 1910s–1920s CE', split='auto')
fld('a-had', 'reportsofcambrid05hadd', 'Alfred C. Haddon (ed.), Reports of the Cambridge Anthropological Expedition to Torres Straits, volume V: Sociology, Magic and Religion of the Western Islanders (Cambridge: University Press, 1904)',
    'The Cambridge expedition’s report on the Western Torres Strait islanders: the Malu-Bomai and Kwoiam cults, the hero tales, the totems and the dead, and the magic of the rain and the harvest.', 'Reports of the Cambridge Anthropological Expedition to Torres Straits, volume V (A. C. Haddon, 1904)', 'recorded 1898 CE', split='auto')
fld('a-mar', 'anaccountnative01martgoog', 'John Martin, An Account of the Natives of the Tonga Islands, in the South Pacific Ocean, from the Communications of Mr. William Mariner (London: John Murray, 1817; this printing 1827)',
    'The record of an English sailor who lived in Tonga in 1806–10: the gods and the priests, the divine king, the taboo and sacrifice, funerals and the mourning, as told by Mariner and written down by Dr. Martin.', 'An Account of the Natives of the Tonga Islands (William Mariner and John Martin, 1817)', 'recorded 1806–10 CE', split='auto')
fld('a-tur', 'samoaahundredye00turngoog', 'George Turner, Samoa, a Hundred Years Ago and Long Before, together with Notes on the Cults and Customs of Twenty-Three Other Islands in the Pacific (London: Macmillan, 1884)',
    'A London Missionary Society missionary’s account of old Samoa: the gods and the war gods, the priests and the oracles, the ancestors, the tabu, the myths, with notes on twenty-three other Pacific islands.', 'Samoa, a Hundred Years Ago and Long Before (George Turner, 1884)', 'recorded 1840s–1880 CE', split='auto')
fld('a-hnh', 'bwb_S0-CHH-309', 'C. B. Humphreys, The Southern New Hebrides: An Ethnological Record (Cambridge: University Press, 1926)',
    'The Anglican missionary’s record of Tanna, Eromanga and the Southern New Hebrides: the spirits and the stones, the kava ceremony, the secret-society dances, and the rites of the dead.', 'The Southern New Hebrides (C. B. Humphreys, 1926)', 'recorded 1920s CE', split='auto')
fld('a-squ', 'ancientmonuments00squi', 'E. G. Squier and E. H. Davis, Ancient Monuments of the Mississippi Valley (Washington: Smithsonian Institution, 1848; Smithsonian Contributions to Knowledge, vol. 1)',
    'The first great survey of the mounds of the Ohio and Mississippi valleys (Hopewell and other earthworks): the enclosures, the sacrificial and burial mounds and the altars, with what the authors reasoned of the builders’ religion from them.', 'Ancient Monuments of the Mississippi Valley (Squier and Davis, 1848)', 'surveyed 1845–47 CE', split='auto')
fld('a-tec', 'lifetecumseh00drakrich', 'Benjamin Drake, Life of Tecumseh and of his Brother the Prophet, with a Historical Sketch of the Shawanoe Indians (Cincinnati: Morgan, 1856)',
    'The 1841 life of the Shawnee leader and of Tenskwatawa the Prophet, who taught from 1805 a return to the old ways, the rejection of whisky and white customs, and his visions; it records the movement as it was heard from those who knew it.', 'Life of Tecumseh and of his Brother the Prophet (Benjamin Drake, 1841; 1856 ed.)', 'recorded 1805–13 CE', split='auto')
fld('a-kro', 'handbookofindian00kroe_0', 'A. L. Kroeber, Handbook of the Indians of California (Washington: Government Printing Office, 1925; Bureau of American Ethnology Bulletin 78)',
    'The standard survey of the native peoples of California before the Spanish: the Yurok and Karok world-renewal ceremonies, the Pomo and Maidu religion, the Kuksu secret societies, the Chumash and the Mohave dreams, from the anthropologist’s years of fieldwork.', 'Handbook of the Indians of California (A. L. Kroeber, 1925)', 'recorded 1900s–1920s CE', split='auto')
fld('a-pow', 'tribescaliforni00powegoog', 'Stephen Powers, Tribes of California (Washington: Government Printing Office, 1877; Contributions to North American Ethnology, vol. 3)',
    'A journalist’s survey of the Californian peoples of the 1870s: the Yurok, Karok, Pomo, Maidu, Miwok and others, their religion, creation stories, dances, shamans and burial customs, as he gathered them in the field.', 'Tribes of California (Stephen Powers, 1877)', 'recorded 1871–75 CE', split='auto')
fld('a-ccr', 'earlyhistorycre01swangoog', 'John R. Swanton, Early History of the Creek Indians and their Neighbors (Washington: Government Printing Office, 1922; Bureau of American Ethnology Bulletin 73)',
    'The history of the Creek (Muscogee) confederacy and its neighbours from the sources of the Spanish and English: the towns, the leaders and the beliefs of the peoples of the south-east before and after contact.', 'Early History of the Creek Indians and their Neighbors (John R. Swanton, 1922)', 'recorded 1540s–1800 CE (pub. 1922)', split='auto')
fld('a-god', 'mythstalesfromwh00godd', 'Pliny Earle Goddard, Myths and Tales from the White Mountain Apache (New York: American Museum of Natural History, 1919; Anthropological Papers, vol. 24, part 2)',
    'Myths and tales taken down from White Mountain Apache narrators in Arizona in 1910–19 and given in English: the beginning of the world, Coyote and the other animals, the culture heroes and the people of the underworld.', 'Myths and Tales from the White Mountain Apache (P. E. Goddard, 1919)', 'recorded 1910–19 CE', split='auto')
fld('a-puk', 'folkbeliefsofsou00puck', 'Newbell Niles Puckett, Folk Beliefs of the Southern Negro (Chapel Hill: University of North Carolina Press, 1926)',
    'The collection of the belief and practice of the African Americans of the South: conjure and hoodoo, charms and the root-doctor, signs and omens, ghosts and haunts, the devil and the crossroads, with notes on their African sources.', 'Folk Beliefs of the Southern Negro (N. N. Puckett, 1926)', 'recorded 1920s CE', split='auto')
fld('a-mun', 'in.ernet.dli.2015.215493', 'Sarat Chandra Roy, The Mundas and their Country (Calcutta: Kuntaline Press, 1912)',
    'A lawyer-ethnographer’s study of the Mundas of Chota Nagpur: the god Sing-Bonga and the village spirits, the sacred grove, the festivals and sacrifices, the ghosts and witchcraft and the rites of birth, marriage and death.', 'The Mundas and their Country (Sarat Chandra Roy, 1912)', 'recorded 1900s CE', split='auto')
fld('a-kac', 'kacharis00endliala', 'Sidney Endle, The Kacháris (London: Macmillan, 1911)',
    'An Assam missionary-official’s account of the Kacharis (Bodo): their gods Bathou and the spirits of the hills and rivers, the kharia priest and the sacrifices, their festivals and the rites of the dead.', 'The Kacháris (Sidney Endle, 1911)', 'recorded 1880s–1900s CE', split='auto')
fld('a-khs', 'cu31924024052874', 'P. R. T. Gurdon, The Khasis (London: Macmillan, 1914)',
    'The Assam official’s account of the Khasi of the hills: the descent through the mother, the great god U Blei and the spirits of the stones, the priests and the sacrifices, the monoliths and the funerals.', 'The Khasis (P. R. T. Gurdon, 1914)', 'recorded 1900s CE', split='auto')
fld('a-mei', 'meitheis00hodsgoog', 'T. C. Hodson, The Meitheis (London: David Nutt, 1908)',
    'The study of the Meitei people of Manipur: the lais (gods) and the maibis (priestesses), the Lai Haraoba festival and the old Meitei religion before the Hindu conversion of the 18th century, with the rites of birth, marriage and death.', 'The Meitheis (T. C. Hodson, 1908)', 'recorded 1900s CE', split='auto')
fld('a-rus', ['tribescastesofce01russ', 'tribescastesofce02russ', 'tribescastesofce03russ', 'tribescastesofce04russ'], 'R. V. Russell and Hira Lal, The Tribes and Castes of the Central Provinces of India, four volumes (London: Macmillan, 1916)',
    'The great survey of the peoples of central India from the census: the Gonds and the Baiga and the other tribes, their gods and village spirits, their rites of birth and death, magic and witchcraft, with the castes and their customs in alphabetical order.', 'The Tribes and Castes of the Central Provinces of India (R. V. Russell, 1916), four volumes', 'recorded 1900s–1910s CE', split=None)
fld('a-kaf', 'kafirshindukush00robe', 'George Scott Robertson, The Káfirs of the Hindu-Kush (London: Lawrence and Bullen, 1896)',
    'A British officer’s account of his stay in Kafiristan in 1890–91 among the Kalasha and the other peoples then following their old religion: the gods Imra, Moni and Gish, the priests, the sacrifices and the ancestor effigies, and the stories.', 'The Káfirs of the Hindu-Kush (George Scott Robertson, 1896)', 'recorded 1890–91 CE', split='auto')
fld('a-dal', 'in.ernet.dli.2015.44171', 'Edward Tuite Dalton, Descriptive Ethnology of Bengal (Calcutta: Office of the Superintendent of Government Printing, 1872)',
    'The Commissioner’s survey of the peoples of eastern India: the Santal, Munda, Oraon, Ho, Kharia, the Naga, Garo, Khasi and others, with their customs and religion, their gods and village priests, the sacrifices and the festivals.', 'Descriptive Ethnology of Bengal (E. T. Dalton, 1872)', 'recorded 1860s–70s CE', split='auto')
fld('a-lus', 'lusheikukiclans00shak', 'J. Shakespear, The Lushei Kuki Clans (London: Macmillan, 1912)',
    'The Political Officer’s account of the Mizo peoples of the Lushai Hills: the god Pathian and the spirits, the sacrifices and the feasts of merit, their ideas of the other world and the rites of death.', 'The Lushei Kuki Clans (J. Shakespear, 1912)', 'recorded 1900s CE', split='auto')


# ── repairs found by reading the built texts (16 November 2026): a running head the splitter took for a chapter, advertisements, indexes and library stamps at the end of a scan ──
def fix(i, **kw):
    SPECS[i].update(kw)
    if SPECS[i].get('split') == 'auto': SPECS[i].setdefault('min_chars', 250)


for _i in ('x-bbr', 'x-bvs', 'x-wad', 'x-bpl'): fix(_i, split=None)              # the running head of every page was taken for a chapter heading
fix('x-bbr', cut_tail=r'^[^\n]*Aqa \(assassin of Amin')
fix('x-wad', cut_tail=r'^[^\n]*(?:Messrs\.? W\. H\. Allen & Co\. have done a public service|PRIC(?:E|K)S OF THE PUBLICATIONS)')
fix('x-hph', cut_tail=r'^The First Arthur Davis Memorial Lecture')
fix('x-fmr', cut_tail=r'^THE MACMILLAN COMPANY')
fix('x-sze', cut_tail=r'^Zen in its essence is the art of seeing')
fix('x-nic', cut_tail=r'^14 DAY USE')
fix('x-aqg', cut_tail=r'^[^\n]*2\s+5\s+3\s+8\s+1')
fix('x-ger', cut_tail=r'^A LIST OF NEW BOOKS')
fix('a-lus', cut_tail=r'^[^\n]*WORKS ON ANTHROPOLOGY')
fix('a-ccr', cut_tail=r'^[^\n]*Stanford University Libra')
fix('x-ing', cut_tail=r'^Address all orders')
fix('x-rud', cut_tail=r'^[^\n]*Gonybeare')
fix('x-fai', cut_tail=r'^[^\n]*Containing chiefly proper names')
fix('x-dzt', cut_tail=r'^[^\n]*Abadian, a sect')
fix('a-evb', cut_tail=r'^[^\n]*Aborigines of Malay Peninsula, dis')
fix('a-cdv', cut_tail=r'^[^\n]*FIELD\s+MUSEUM\s+OF\s+NATURAL\s+HISTORY\.?\s+ANTHROPOLOGY\.?,?\s+VOL\.?\s+XII\.?\s+PLATE')
fix('x-hrd', skip=r'^BOOK IX$')                                                    # the contents list's last line, made a section of its own
fix('x-oah', drop=r'^[^\n]*(?:ForgottenBooks\.org|Oahspe, Vol\. 1 of 7)[^\n]*\n', cut_head=r'^GLOSSARY OF STRANGE WORDS USED IN THIS BOOK\s*$', cut_tail=r'^(?:aig|Read these similar books for free)')
SPECS['x-oah']['by'] = 'John Ballou Newbrough, Oahspe: A Kosmon Bible in the Words of Jehovih and his Angel Embassadors (New York and London: Oahspe Publishing Association, 1882), volume 1 of the seven-volume Forgotten Books reprint'
SPECS['x-oah']['note'] = ('The scripture of Faithism, given by its author as written automatically in 1881–82 under the guidance of angels. Only the first of the seven volumes of the reprint is among the open scans, so this is the opening part of Oahspe (its glossary and “Hints to the reader”, and the first books of its history of the heavens and the earth), not the whole work. ' + MOV)
SPECS['x-oah']['lib'] = ('Oahspe: A New Bible (John Ballou Newbrough, 1882), the opening volume', 'mo', '1882 CE', 'mod', NEW)
