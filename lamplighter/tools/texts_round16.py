"""Specs for a sixteenth batch of open (pre-1931) English texts, begun on the maker's words "don't be afraid to continue on your own. lets get as close as we can to covering all the
religions": the Abrahamic denominations and orders that the assessment of 16 November 2026 found without an example (COVERAGE_ASSESSMENT.md lists 139 of them). The Eastern Churches (Fortescue,
Adeney, Butler on the Coptic churches, Etheridge on the Syrian churches, Buchanan on the Syrian Christians of Malabar and the Cochin Jews), the Baptists, Congregationalists, Moravians,
Mennonites and Irvingites, the American communities (Harmonists, Zoar, Amana, Oneida, Shakers) and Transcendentalism, the Reform, Conservative and Orthodox movements in Judaism and the Falashas
and the Jews of Kaifeng, the sects and movements of Islam (the Wahhabis, the Indian Wahhabis, the Mahdi, the Ibadi imams of Oman, the Assassins, the Zaydi of Yemen, the Kurdish Ahl-e Haqq,
the Ahmadiyya), the Sikhs, the Chamars, the religion of Nepal and Assam, the Pacific (Melville, Handy, Thomson, Turner, Christian, Cowan), the Etruscans and Malta, Martinism, Unity and Ethical
Culture. Merged into texts_archive.SPECS; built with python3 build_texts.py --only=ids. Found 16–17 November 2026.

Left out: Burkitt's Religion of the Manichees (the one scan is a 31,000-letter JSTOR extract), Rose's Glossary of the Tribes and Castes of the Punjab (three volumes of reference, kept for a later
round), Hammer's Assassins is here but Ohrwalder, Wingate and Slatin are the Mahdi's own witnesses and are labelled so.
"""
from texts_round9 import S, SCH, REF
from texts_round10 import G, T, FIELD
from texts_round8 import MOV, OLD, PER

SPECS = {}
NEW = 'Bahá’í, Theosophy'
fix = lambda i, **kw: SPECS[i].update(kw)


def sch(i, idents, by, note, title, when, **kw):
    if kw.get('split', 'auto') == 'auto': kw.setdefault('min_chars', 250)
    SPECS[i] = G(idents, by, note + ' ' + SCH, lib=S(title, when), **{'split': 'auto', **kw})


def fld(i, idents, by, note, title, when, **kw):
    if kw.get('split', 'auto') == 'auto': kw.setdefault('min_chars', 250)
    SPECS[i] = G(idents, by, note + ' ' + FIELD, lib=T(title, when), **{'split': 'auto', **kw})


# ── The Eastern Churches ──
sch('x-ftc', 'lessereasternchu00fortuoft', 'Adrian Fortescue, The Lesser Eastern Churches (London: Catholic Truth Society, 1913)',
    'A Catholic priest-scholar’s history of the Churches that separated from Constantinople and Rome over the councils of Ephesus and Chalcedon: the Assyrian Church of the East (Nestorians) and the Chaldeans, the Jacobites (Syrian Orthodox) and the Maronites, the Copts and the Abyssinians (Ethiopian Church), the Armenians, the Georgians and the Syrian Christians of Malabar, with their rites and their history. A Roman Catholic’s account, by a scholar of the liturgies.',
    'The Lesser Eastern Churches (Adrian Fortescue, 1913)', '1913 CE')
sch('x-ftd', 'orthodoxeasternc00fortuoft', 'Adrian Fortescue, The Orthodox Eastern Church (London: Catholic Truth Society, 1908)',
    'The Catholic scholar’s account of the Greek and Slav Churches: the Patriarchates of Constantinople, Alexandria, Antioch and Jerusalem, the Church of Russia and the Churches of Serbia, Bulgaria and Romania, the Holy Synod, the rite and the liturgy, and the history of the separation from Rome.',
    'The Orthodox Eastern Church (Adrian Fortescue, 1908)', '1908 CE')
sch('x-adn', 'greekeasternchu00aden', 'Walter F. Adeney, The Greek and Eastern Churches (Edinburgh: T. & T. Clark, 1908; the International Theological Library)',
    'A Congregationalist scholar’s history of Eastern Christianity: the early Church in the East and the Councils, the Greek Church and its doctrine and worship, the Russian Church and its sects (the Old Believers), the Armenian, Coptic, Abyssinian, Syrian and Nestorian Churches.',
    'The Greek and Eastern Churches (Walter F. Adeney, 1908)', '1908 CE')
sch('x-but', ['ancientcopticchu01butliala', 'theancientcoptic02butluoft'], 'Alfred J. Butler, The Ancient Coptic Churches of Egypt, two volumes (Oxford: Clarendon Press, 1884)',
    'The Oxford scholar’s survey of the churches and monasteries of Egypt, with an account of the Coptic liturgy: the churches of Old Cairo and the Wadi Natrun and the monasteries of the desert, the Coptic rite and the Mass, and the history of the Church of Egypt (two volumes).',
    'The Ancient Coptic Churches of Egypt (Alfred J. Butler, 1884), two volumes', '1884 CE', split=None)
sch('x-eth', 'syrianchurchesth00ethe', 'John Wesley Etheridge, The Syrian Churches: Their Early History, Liturgies, and Literature, with a Literal Translation of the Four Gospels from the Peshito (London: Longman, 1846)',
    'A Wesleyan scholar’s history of the Syrian Churches (Jacobite, Nestorian, Maronite and Malabar): their history, their liturgies and their literature, with a translation from the Syriac Peshitta Gospels.',
    'The Syrian Churches: Their Early History, Liturgies, and Literature (J. W. Etheridge, 1846)', '1846 CE')
sch('x-bcr', 'christianresearc00buchrich', 'Claudius Buchanan, Christian Researches in Asia, with Notices of the Translation of the Scriptures into the Oriental Languages (Cambridge: Cadell and Davies, 1811; this printing 1812)',
    'The East India Company chaplain’s account of his journey in 1806–08: the Syrian Christians of Malabar and their churches and manuscripts, the Jews of Cochin (the White and Black Jews) and their synagogue and records, the Inquisition at Goa and the Church in India, with the translations of the Bible. A missionary’s view, by an Anglican.',
    'Christian Researches in Asia (Claudius Buchanan, 1811)', '1806–08 CE')

# ── The Protestant churches and the American communities ──
sch('x-arm', 'ahistorybaptist00armigoog', 'Thomas Armitage, A History of the Baptists: Traced by their Vital Principles and Practices, from the Time of our Lord Jesus Christ to the Year 1886 (New York: Bryan, Taylor, 1887)',
    'The standard Baptist history of the 19th century: the Baptist view that their principles go back to the apostles, the Waldenses and the Anabaptists, the General and Particular Baptists of England, Roger Williams and the Baptists of America, the missions and the Baptist confessions.',
    'A History of the Baptists (Thomas Armitage, 1887)', '1887 CE', split=None)
sch('x-wlk', 'creedsplatformso00walk', 'Williston Walker, The Creeds and Platforms of Congregationalism (New York: Charles Scribner’s Sons, 1893)',
    'The standard collection of the Congregational churches’ own documents with Walker’s history: the Brownists and the Puritans, the Cambridge Platform of 1648 and the Savoy Declaration, the Saybrook and Boston Platforms and the later creeds, down to the Creed of 1883.',
    'The Creeds and Platforms of Congregationalism (Williston Walker, 1893)', '1893 CE')
sch('x-smm', 'themennonitesofa00smituoft', 'C. Henry Smith, The Mennonites of America (Scottdale, Pa.: Mennonite Publishing House, 1909)',
    'The Mennonite historian’s history of the Mennonites, Amish and Hutterites in America: the Swiss and Dutch background of the Anabaptists, the settlements in Pennsylvania and the West, the Amish division of 1693 and the Hutterite colonies, and their faith and discipline.',
    'The Mennonites of America (C. Henry Smith, 1909)', '1909 CE')
sch('x-hm1', 'historyofmission00hami', 'J. Taylor Hamilton, A History of the Missions of the Moravian Church during the Eighteenth and Nineteenth Centuries (Bethlehem, Pa.: Times Publishing Company, 1901)',
    'The Moravian historian’s account of the missions of the Unitas Fratrum: from Zinzendorf’s Herrnhut to the West Indies, Greenland, Surinam and South Africa, and the work among the Native Americans, with the Church’s teaching and the Moravian character of devotion.',
    'A History of the Missions of the Moravian Church (J. Taylor Hamilton, 1901)', '1732–1900 CE', split='auto')
sch('x-hm2', 'jstor-41179615', 'J. Taylor Hamilton, A History of the Church Known as the Moravian Church, or the Unitas Fratrum, or the Unity of the Brethren, during the Eighteenth and Nineteenth Centuries (Transactions of the Moravian Historical Society, vol. 3; Bethlehem, Pa., 1900)',
    'The companion history of the Moravian Church itself: the old Bohemian Unity of the Brethren after Hus, its renewal at Herrnhut under Zinzendorf, the Moravian settlements in America and the Church’s organisation and its doctrine.',
    'A History of the Church Known as the Moravian Church (J. Taylor Hamilton, 1900)', '1722–1900 CE', split=None)
sch('x-irv', ['historydoctrines01mill', 'historyanddoctri02milluoft'], 'Edward Miller, The History and Doctrines of Irvingism, or of the So-called Catholic and Apostolic Church, two volumes (London: C. Kegan Paul, 1878)',
    'A critical Anglican history of the Catholic Apostolic Church that grew up round Edward Irving: the revival of tongues and prophecy in 1830–31, the Apostles and the angels, the liturgy and the doctrine of the Lord’s coming, and the Church’s later history (two volumes), by a critical outsider.',
    'The History and Doctrines of Irvingism (Edward Miller, 1878), two volumes', '1830–78 CE', split=None)
sch('x-fro', 'transcendentalis00frotuoft', 'Octavius Brooks Frothingham, Transcendentalism in New England: A History (New York: G. P. Putnam’s Sons, 1876)',
    'The Unitarian minister’s history of the movement of Emerson, Parker, Alcott and Margaret Fuller: its roots in German idealism, the Unitarian controversy and the Dial, Brook Farm, Parker’s “Discourse on the Transient and Permanent in Christianity” and the movement’s religion of the soul and of nature.',
    'Transcendentalism in New England (O. B. Frothingham, 1876)', '1836–76 CE')
sch('x-nor', 'communistsocieties00nordrich', 'Charles Nordhoff, The Communistic Societies of the United States, from Personal Visit and Observation, including Detailed Accounts of the Economists, Zoarites, Shakers, the Amana, Oneida, Bethel, Aurora, Icarian and other Existing Societies (New York: Harper, 1875)',
    'A journalist’s account of the religious communities he visited in 1874: the Harmony Society (Economy), Zoar, the Shakers and the Community of True Inspiration at Amana, the Oneida Community, Bethel and Aurora, and the Icarians, with their beliefs, worship and discipline, and their ways of life.',
    'The Communistic Societies of the United States (Charles Nordhoff, 1875)', '1874–75 CE')
sch('x-shm', 'amanacommunityof00sham_0', 'Bertha M. H. Shambaugh, Amana: The Community of True Inspiration (Iowa City: State Historical Society of Iowa, 1908)',
    'The Iowa historian’s history of the Amana colonies: the German Inspirationists, the prophetic gift (Werkzeuge) and Christian Metz, the migration of 1842–43 and the villages, the communal life and the Church’s worship and discipline.',
    'Amana: The Community of True Inspiration (Bertha M. H. Shambaugh, 1908)', '1714–1908 CE')
sch('x-noy', 'historyofamerica00noyeuoft', 'John Humphrey Noyes, History of American Socialisms (Philadelphia: J. B. Lippincott, 1870)',
    'The founder of the Oneida Community’s history of the American communities from 1825 to 1870: the Owenite and Fourierist experiments, Brook Farm, and, in the religious communities, the Shakers, the Rappists (Harmony), the Zoarites, the Ebenezers (Amana) and Oneida’s own beginnings, with Noyes’s views of what made some last and most fail.',
    'History of American Socialisms (John Humphrey Noyes, 1870)', '1825–70 CE')
fld('a-pnt', ['conspiracyofpont01park', 'conspiracyofpont02park'], 'Francis Parkman, The Conspiracy of Pontiac and the Indian War after the Conquest of Canada, sixth edition, two volumes (Boston: Little, Brown, 1870)',
    'The great American historian’s account of the war of 1763: the Ottawa leader Pontiac and the Delaware Prophet (Neolin), whose vision of the Master of Life and call to return to the old ways lay behind the rising, the tribes of the Great Lakes and the Ohio, the old French missions, and the war (two volumes).',
    'The Conspiracy of Pontiac (Francis Parkman, 1870), two volumes', 'recorded 1763 CE', split=None)

# ── Judaism ──
sch('x-phl', 'reformmovementin00philrich', 'David Philipson, The Reform Movement in Judaism (New York: Macmillan, 1907)',
    'The Cincinnati rabbi’s history of the Reform movement from Mendelssohn: the Jacobson temple and the Hamburg Temple, Geiger, Holdheim and the Reform rabbinical conferences of 1844–46 and the Pittsburgh Platform of 1885, with the reaction of Orthodoxy and the American movement.',
    'The Reform Movement in Judaism (David Philipson, 1907)', '1807–1907 CE')
sch('x-koh', 'jewishtheologysy00kohlrich', 'Kaufmann Kohler, Jewish Theology, Systematically and Historically Considered (New York: Macmillan, 1918; this printing 1923)',
    'The leading Reform theologian’s statement of Jewish belief: God and His attributes, the Torah and revelation, the soul and immortality, Israel’s mission, the Messiah and the commandments, with the history of each doctrine, as Reform Judaism taught it.',
    'Jewish Theology, Systematically and Historically Considered (Kaufmann Kohler, 1918)', '1918 CE')
sch('x-scs', 'studiesinjuda00sche', 'Solomon Schechter, Studies in Judaism, second series (Philadelphia: Jewish Publication Society of America, 1908)',
    'The Cambridge Talmudist’s essays, who became the founder of Conservative Judaism in America (the Jewish Theological Seminary): the Chassidim (Hasidism), Safed and its mystics and Nachmanides.',
    'Studies in Judaism, second series (Solomon Schechter, 1908)', '1908 CE')
sch('x-hir', 'nineteenletters00hirs', 'Samson Raphael Hirsch, The Nineteen Letters of Ben Uziel: Being a Spiritual Presentation of the Principles of Judaism, translated by Bernard Drachman (New York: Funk & Wagnalls, 1899)',
    'The founder of modern Orthodox Judaism’s answer to Reform (first published in 1836): a young rabbi’s nineteen letters on the nature of Israel, the meaning of the Torah and the commandments, the Land and exile, with his programme of “Torah with Derekh Eretz”, the Torah together with modern culture.',
    'The Nineteen Letters of Ben Uziel (Samson Raphael Hirsch, 1836; trans. 1899)', '1836 CE (trans. 1899)')
sch('x-fld', 'india.history.resource.71141', 'J. M. Flad, The Falashas (Jews) of Abyssinia, translated from the German (London, 1869)',
    'A Basel missionary’s account of the Beta Israel (Falasha), the Jews of Ethiopia, from his twenty years among them: their history and legends, their Scriptures in Ge’ez and their synagogue and priests, their feasts and fasts and their dispersion, written to win them to Christ.',
    'The Falashas (Jews) of Abyssinia (J. M. Flad, 1869)', '1869 CE')
sch('x-fin', 'jewsinchinathei00finngoog', 'James Finn, The Jews in China: Their Synagogue, their Scriptures, their History, &c. (London, 1843)',
    'The first English account of the Jews of Kaifeng, from the letters of the Jesuits and a Chinese Christian’s visit: their synagogue and its inscriptions, their Torah scrolls, their rites and their history since the Song dynasty, written when little was yet known of them.',
    'The Jews in China (James Finn, 1843)', '1843 CE', split=None)

# ── Islam: sects, orders and movements ──
sch('x-hun', 'indianmusalmans00hunt', 'W. W. Hunter, The Indian Musalmans: Are they Bound in Conscience to Rebel against the Queen? (London: Trübner, 1871)',
    'The Indian Civil Servant’s study of the Wahhabi movement of Sayyid Ahmad Barelvi and its “Hindustani fanatics” on the north-west frontier, written for the British government in 1871: the doctrine of the Indian Wahhabis, their organisation and their jihad, and the Muslim answer on the question of loyalty. A colonial official’s view.',
    'The Indian Musalmans (W. W. Hunter, 1871)', '1820s–1871 CE')
sch('x-bur', ['notesonbedouins00burcgoog', 'notesonbedouins01burcgoog'], 'John Lewis Burckhardt, Notes on the Bedouins and Wahábys, collected during his Travels in the East, two volumes (London: Henry Colburn and Richard Bentley, 1831)',
    'The Swiss traveller’s notes on the desert Arabs and on the Wahhabis, whom he saw in 1814–16: the Bedouin tribes, their religion and customs and law, the rise of Muhammad ibn Abd al-Wahhab’s reform, its creed, the conquest of Mecca and Medina and its defeat by Muhammad Ali, the first full description of the Wahhabi movement in English (two volumes).',
    'Notes on the Bedouins and Wahábys (John Lewis Burckhardt, 1831), two volumes', '1810s CE', split=None)
sch('x-pal', 'personalnarrativ00palguoft', 'William Gifford Palgrave, Personal Narrative of a Year’s Journey through Central and Eastern Arabia, 1862–63 (London: Macmillan, 1865; this printing 1868)',
    'The Jesuit-trained traveller’s journey to the Wahhabi capital of Riyadh and the Gulf, in disguise as a Syrian doctor: the Wahhabi state and the Emir Faisal, the religion of the Wahhabis and its enforcement, the Bedouin tribes and the Gulf towns, a classic with a contested account of its author’s motive.',
    'Personal Narrative of a Year’s Journey through Central and Eastern Arabia (W. G. Palgrave, 1865)', '1862–63 CE')
sch('x-win', 'mahdiismandegyp00winggoog', 'F. R. Wingate, Mahdiism and the Egyptian Sudan: Being an Account of the Rise and Progress of Mahdiism, and of Subsequent Events in the Sudan to the Present Time (London: Macmillan, 1891)',
    'The head of Egyptian military intelligence’s account of Muhammad Ahmad, the Mahdi of the Sudan: his claim and teaching, the Mahdist state and its religion, the Khalifa, the Sudan’s fall in 1883–85, the death of Gordon and the Khalifa’s rule, from the prisoners’ and the refugees’ reports and the Mahdi’s own letters. A British officer’s view.',
    'Mahdiism and the Egyptian Sudan (F. R. Wingate, 1891)', '1881–91 CE')
sch('x-sla', 'fireswordinsudan00slatiala', 'Rudolf C. Slatin Pasha, Fire and Sword in the Sudan: A Personal Narrative of Fighting and Serving the Dervishes, 1879–1895, translated by F. R. Wingate (London: Edward Arnold, 1896; this printing 1914)',
    'The Austrian governor of Darfur’s narrative of his years as the Khalifa’s prisoner and servant, after he went over to Islam to save his life: the Mahdi and his successor, the Mahdist rule and its religion, and the dervishes’ life. The captive’s own account.',
    'Fire and Sword in the Sudan (Rudolf C. Slatin, 1896)', '1879–95 CE')
sch('x-ohr', 'tenyearscaptivit00ohrwuoft', 'Joseph Ohrwalder, Ten Years’ Captivity in the Mahdi’s Camp, 1882–1892, from the original manuscripts of Father Joseph Ohrwalder, by F. R. Wingate (London: Sampson Low, 1892)',
    'A Catholic missionary priest’s account of his ten years as the Mahdi’s prisoner: the Mahdi’s religion and its teaching and discipline, the Khalifa’s rule, the siege of Khartoum and the faith of the Sudanese, a witness from the Mahdist camp.',
    'Ten Years’ Captivity in the Mahdi’s Camp (Joseph Ohrwalder, 1892)', '1882–92 CE')
sch('x-bdg', 'historyofimmss44ibnr', 'Salil-ibn-Razik, History of the Imâms and Seyyids of ʿOmân, from A.D. 661–1856, translated and edited by George Percy Badger (London: Hakluyt Society, 1871)',
    'The Ibadi chronicle of Oman, translated for the Hakluyt Society, with Badger’s notes and introduction continuing the history to 1870: the election of the imams and their rule, the Ibadi doctrine of the imamate and of the Kharijite origin, the Yaʿrubi and Al Bu Said dynasties, and Oman’s relations with Portugal and Britain.',
    'History of the Imâms and Seyyids of ʿOmân (Salil-ibn-Razik, trans. Badger, 1871)', '661–1870 CE')
# x-ahm (The Philosophy of the Teachings of Islam) was removed on 17 Nov 2026: the only scan found was the 2010/2011 reprint of a 1979 translation, which is in copyright. The 1910 translation (The Teachings of Islam) replaces it in round 19.
sch('x-hma', 'historyassassin00woodgoog', 'Joseph von Hammer-Purgstall, The History of the Assassins, derived from Oriental Sources, translated by Oswald Charles Wood (London: Smith and Elder, 1835)',
    'The Austrian orientalist’s history of the Nizari Ismailis of Alamut and their order, famous in the West as the “Assassins”: the Ismaili doctrine and the grades of the order, Hasan-i Sabbah and his successors, the Old Man of the Mountain and the Mongol destruction, from Arabic and Persian sources. A work of its time that supplied the legends it relates; read with later scholarship.',
    'The History of the Assassins (Joseph von Hammer-Purgstall, 1818; trans. 1835)', '1090–1256 CE (pub. 1818, trans. 1835)', split=None)
sch('x-ply', 'in.ernet.dli.2015.24536', 'R. L. Playfair, A History of Arabia Felix or Yemen, from the Commencement of the Christian Era to the Present Time, including an Account of the British Expedition to Aden (Bombay: Education Society’s Press, 1859)',
    'A Madras artillery officer’s history of Yemen from the Himyarite kingdom to the 1850s: the Himyarites and the Jewish and Christian kingdoms, the coming of Islam and the Zaydi imams of the Yemen highlands, the Ottoman and Portuguese conquests and the British at Aden.',
    'A History of Arabia Felix or Yemen (R. L. Playfair, 1859)', '1859 CE')
sch('x-ric', ['narrativeofresid01richuoft', 'narrativearesid03richgoog'], 'Claudius James Rich, Narrative of a Residence in Koordistan, and on the Site of Ancient Nineveh, with Journal of a Voyage down the Tigris to Bagdad and an Account of a Visit to Shirauz and Persepolis, two volumes (London: James Duncan, 1836)',
    'The East India Company’s Resident at Baghdad’s journey of 1820 through Kurdistan: the Kurdish tribes and their chiefs and religion, the Yezidis and the Ali-Ilahis (Ahl-e Haqq) and the dervishes, the Nestorian Christians, Sulaimaniya and the ruins of Nineveh (two volumes).',
    'Narrative of a Residence in Koordistan (Claudius J. Rich, 1836), two volumes', '1820 CE (pub. 1836)', split=None)
sch('x-bnt', 'southernarabia00bentuoft', 'J. Theodore Bent and Mrs. Theodore Bent, Southern Arabia (London: Smith, Elder, 1900)',
    'The explorers’ journeys of 1893–97 in the Hadhramaut, Dhofar and the Yemen coast and to Socotra: the ruins of the old South Arabian kingdoms of Sheba and Hadramaut and their inscriptions, the incense land, the tombs of the saints, the religion of the Mahra and Socotri and the Arab sultans.',
    'Southern Arabia (J. Theodore Bent, 1900)', '1893–97 CE')

# ── The Sikhs, the Chamars, Nepal and Assam ──
sch('x-cnn', 'cunninghamshisto00cunnuoft', 'Joseph Davey Cunningham, A History of the Sikhs, from the Origin of the Nation to the Battles of the Sutlej (London: John Murray, 1849; the 1918 Oxford edition)',
    'The first major history of the Sikhs, by an officer who served in the Punjab: Nanak and the Gurus, Gobind Singh’s Khalsa, the Sikh confederacies (misls) and the Akalis, Ranjit Singh’s kingdom and the Anglo-Sikh wars, with chapters on Sikh doctrine and the sects (Udasis, Nirmalas, Nihangs) and the first English account of their religion’s history.',
    'A History of the Sikhs (Joseph Davey Cunningham, 1849)', '1469–1849 CE')
sch('x-brg', 'chamarscalcutta00briguoft', 'George W. Briggs, The Chamars (Calcutta: Association Press, 1920; the Religious Life of India series)',
    'A missionary-scholar’s study of the leather-working caste of North India that produced the Ravidasi sect: their origins and customs, their religion (the village gods and spirits, the worship of Ravidas and the sants and the Satnamis of Chhattisgarh), and the Chamars’ social position and conversions. A missionary’s view.',
    'The Chamars (George W. Briggs, 1920)', '1920 CE')
sch('x-hbn', 'essaysonlanguage00hodg', 'Brian H. Hodgson, Essays on the Languages, Literature, and Religion of Nepál and Tibet (London: Trübner, 1874; the second edition)',
    'The British Resident at Kathmandu’s pioneering essays (1828–74), which first made the Sanskrit Buddhist literature known: the Buddhism of Nepal (the Newar Buddhists, the Mahayana sutras, the Adi-Buddha and the Vajracharya priesthood), the Tibetan and Himalayan languages and peoples, and the religion of Nepal and Tibet.',
    'Essays on the Languages, Literature, and Religion of Nepál and Tibet (Brian H. Hodgson, 1874)', '1828–74 CE')
sch('x-old', ['sketchesfromnipa01oldf', 'b2935304x_0002'], 'Henry Ambrose Oldfield, Sketches from Nipal, Historical and Descriptive, with Anecdotes of the Court Life and Wild Sports of the Country in the Time of Maharaja Jang Bahadur, to which is added an Essay on Nipalese Buddhism, two volumes (London: W. H. Allen, 1880)',
    'The Residency surgeon’s sketches of Nepal: the Hindu and Buddhist temples of the Valley, the festivals and the living goddess Kumari, the Newar people, the court of Jang Bahadur, and, in volume II, an essay on Nepalese Buddhism with extracts (two volumes).',
    'Sketches from Nipal (Henry Ambrose Oldfield, 1880), two volumes', '1850–80 CE', split=None)
sch('x-gai', 'ahistoryassam00gaitgoog', 'Edward Gait, A History of Assam (Calcutta: Thacker, Spink, 1906)',
    'The standard history of Assam: the Ahom kings and their gods (the Ahom religion and the Hindu cults of the valley), the Koch kings and the Vaishnava reformer Sankaradeva (the Ekasarana Dharma and its sattras), the Mughal invasions and the hill peoples, with the history of the religion of each people.',
    'A History of Assam (Edward Gait, 1906)', '1906 CE')

# ── The Pacific: Melville, Handy, Thomson, Turner, Christian, Cowan ──
fld('a-mel', 'typeepeep00melvrich', 'Herman Melville, Typee: A Peep at Polynesian Life, during a Four Months’ Residence in a Valley of the Marquesas (London: John Murray, 1846)',
    'The novelist’s first book, an account (told as a narrative, and partly invented) of his stay among the Taipi of Nuku Hiva in 1842: the people’s tabu, the sacred groves (the ti), the idols and the priests and the feasts of the old Marquesan religion, as one sailor saw them. A narrative of its own time and a work of literature, not a field record.',
    'Typee: A Peep at Polynesian Life (Herman Melville, 1846)', 'recorded 1842 CE')
fld('a-hdy', 'nativecultureinm00hand', 'E. S. Craighill Handy, The Native Culture in the Marquesas (Honolulu: Bernice P. Bishop Museum, 1923; Bulletin 9)',
    'The Bishop Museum’s study of the Marquesas from the old people’s own account in 1920–21: the gods (Atea, Tiki, Tane) and the priests (tau‘a), the tabu, the sacred places (the me‘ae and paepae), the myths of creation and the rites of birth, death and the feast (koika).',
    'The Native Culture in the Marquesas (E. S. Craighill Handy, 1923)', 'recorded 1920–21 CE')
fld('a-tho', 'fijiansstudyofde00thom', 'Basil Thomson, The Fijians: A Study of the Decay of Custom (London: William Heinemann, 1908)',
    'A colonial official’s study of the Fijians in the 1890s: the old religion (the gods and ancestors, the priests and the temples, the war and the cannibal rites), the movement of the Tuka (a cult of the 1880s promising the return of the dead), the chiefs and the village, and the effects of the colonial government.',
    'The Fijians: A Study of the Decay of Custom (Basil Thomson, 1908)', 'recorded 1890s CE')
fld('a-trn', 'nineteenyearsinp00turn', 'George Turner, Nineteen Years in Polynesia: Missionary Life, Travels, and Researches in the Islands of the Pacific (London: John Snow, 1861)',
    'A London Missionary Society missionary’s account of his years in Samoa (1840–59) and his visits to the New Hebrides, Niue and other islands: the old gods and the priests and the oracles, the Samoan beliefs about the dead, the tabu and the conversion of the islands.',
    'Nineteen Years in Polynesia (George Turner, 1861)', 'recorded 1840–59 CE')
fld('a-chr', 'carolineislandst00chri', 'F. W. Christian, The Caroline Islands: Travel in the Sea of the Little Lands (London: Methuen, 1899)',
    'The first English account of the Caroline Islands, from the author’s journeys of 1895–96: Ponape and its ruins of Nan Madol and the old chiefs, Kusaie, Yap and its stone money, Truk and Palau, with the spirits and the beliefs of the people.',
    'The Caroline Islands (F. W. Christian, 1899)', 'recorded 1895–96 CE')
fld('a-cow', 'newzealandwarshi01cowa', 'James Cowan, The New Zealand Wars: A History of the Maori Campaigns and the Pioneering Period, volume I: 1845–1864 (Wellington: Government Printer, 1922)',
    'Volume I of the official history of the Maori wars: the Maori and the Pakeha, the Northern war and the Taranaki and Waikato wars, and the Pai Marire (Hauhau) of Te Ua, the Maori religion of 1864, with its karakia and niu pole and its rites, as it appeared to the troops. Volume II, with Te Kooti’s Ringatu, is not among the scans found. A history by a Pakeha soldier-journalist.',
    'The New Zealand Wars, volume I: 1845–1864 (James Cowan, 1922)', 'recorded 1845–64 CE', split=None)

# ── The Etruscans, Malta, Martinism, Unity and Ethical Culture ──
sch('x-den', ['citiescemeteries01denn', 'citiescemeteries02denn'], 'George Dennis, The Cities and Cemeteries of Etruria, third edition, two volumes (London: John Murray, 1878)',
    'The English consul’s great survey of the Etruscan sites (first published in 1848), city by city and tomb by tomb: the painted tombs of Tarquinia, Cerveteri and Chiusi, the mirrors and the vases, the Etruscan gods and the rites for the dead, and the cities’ history from the Roman accounts (two volumes).',
    'The Cities and Cemeteries of Etruria (George Dennis, 1848; 1878 edition), two volumes', '1848–78 CE', split=None)
sch('x-lel', 'etruscanromanrem00lelauoft', 'Charles Godfrey Leland, Etruscan Roman Remains in Popular Tradition (London: T. Fisher Unwin, 1892)',
    'The folklorist’s collection of the beliefs of the Tuscan Romagna, which he took to be the surviving religion of the Etruscans and the Romans: the folk-gods and spirits (the lares, Faflon, Aradia and others), the witches’ rites and charms, the festivals and the stories that he gathered from a fortune-teller and her family. Leland’s claim of an unbroken pagan tradition is disputed.',
    'Etruscan Roman Remains in Popular Tradition (Charles G. Leland, 1892)', '1892 CE')
sch('x-zam', 'halsaflieniprehi00zamm', 'T. Zammit, The Hal-Saflieni Prehistoric Hypogeum at Casal Paula, Malta: First Report (Malta: Government Printing Office, 1910)',
    'The first report on the Maltese underground temple of Hal Saflieni from its excavator: the chambers and the “oracle room”, the carved and painted walls, the bones (some 7,000 burials) and the figurines, the “sleeping lady” and the objects, as they were found in 1903–09.',
    'The Hal-Saflieni Prehistoric Hypogeum, Malta (T. Zammit, 1910)', '3600–2500 BCE (pub. 1910)', split=None)
SPECS['h-wsm'] = G('lifeoflouisclaud00wait', 'Arthur Edward Waite, The Life of Louis Claude de Saint-Martin, the Unknown Philosopher, and the Substance of his Transcendental Doctrine (London: Philip Wellby, 1901)',
                   'The English occultist’s life of the French mystic whose followers founded Martinism: Saint-Martin’s youth, his master Martines de Pasqually and the Elus Coens, his meeting with Boehme’s writings, his life in the Revolution and his writings (Des Erreurs et de la Vérité and Le Ministère de l’Homme-Esprit), with an account of his doctrine. ' + SCH,
                   lib=('The Life of Louis Claude de Saint-Martin, the Unknown Philosopher (A. E. Waite, 1901)', 'he', '1743–1803 CE (pub. 1901)', 'her', None), split='auto', min_chars=250)
SPECS['v-fil'] = G('christianhealing00filliala', 'Charles Fillmore, Christian Healing: The Science of Being (Kansas City: Unity Tract Society, 1909; the 1922 printing)',
                   'The co-founder of the Unity School of Christianity’s book of the teaching of the movement: the nature of God and of man, the law of thought and speech, affirmation and denial, healing by the spirit and prayer, and the Christ in each person, in the form of twelve lessons. ' + MOV,
                   lib=('Christian Healing (Charles Fillmore, 1909)', 'sp', '1909 CE', 'spi', None), split='auto', min_chars=250)
SPECS['x-adl'] = G('ethicalphilosoph00adleuoft', 'Felix Adler, An Ethical Philosophy of Life, Presented in its Main Outlines (New York: D. Appleton, 1918)',
                   'The founder of the Ethical Culture movement’s mature statement: his ethic of the infinite worth of each person, the “ethical manifold”, the relation of ethics to religion and to the family, the state and the community, a religion of conduct without a creed. ' + MOV,
                   lib=('An Ethical Philosophy of Life (Felix Adler, 1918)', 'mo', '1918 CE', 'mod', NEW), split='auto', min_chars=250)


# ── repairs found by test builds (17 November 2026): headings, running heads or the book's own sub-headings taken for chapters ──
for _i in ('x-adn', 'x-eth', 'x-wlk', 'x-fro', 'x-nor', 'x-shm', 'x-bnt', 'x-hbn', 'a-hdy'): fix(_i, split=None)
fix('x-fin', cut_tail=r'^[^\n]*THE BORROWER WILL BE CHARGED')
fix('x-shm', cut_tail=r'^(?:[A-Z]{1,5}\s+){10,}')
for _i in ('x-koh', 'x-phl'): fix(_i, cut_tail=r'^[^\n]*(?:THE MACMILLAN COMPANY|Published by THE MACMILLAN)')
# the indexes that closed two Jewish books (the publisher's advertisements follow them); the scan's cleaning had removed the headings
fix('x-koh', cut_tail=r'^Aaronites, 344')
fix('x-phl', cut_tail=r'^Aaronic priesthood')
