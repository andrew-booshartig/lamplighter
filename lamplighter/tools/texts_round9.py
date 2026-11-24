"""Specs for a ninth batch of open (pre-1931) English texts: the classics of the scholarly study of religion, which the Library's "Scholarship and study aids" shelf had only as
modern books it could cite but not give: Tylor, Robertson Smith, Frazer, Max Müller, Harrison, Durkheim, James, Otto, Freud and Weber on religion in general; the histories of the
religions of India, China, Japan, Persia, Egypt, Babylonia, Greece, Rome, Israel and early Christianity; the thirteen-volume Mythology of All Races (the ten volumes first published
by 1930 that were not already in the folder); and the great reference works of their day (Hastings's Encyclopaedia of Religion and Ethics, the Jewish Encyclopedia, the Catholic Encyclopedia, Hughes's Dictionary of Islam).
Merged into texts_archive.SPECS (see the end of that file); built with python3 build_texts.py --only=ids. An ident 'PG123' is Project Gutenberg #123; the rest are Internet Archive
items. Sources were found on 16 November 2026 and fetched on the maker's instruction ("keep going and find more texts", then "worry about a complete product").

All of them are the Library's shelf-only group 'sc' (the Path does not schedule them: they are books about religions, not scriptures). Left out on purpose: volume V (Semitic, 1931) and
volume XIII (the index, 1932) of the Mythology of All Races, which were published after 1930; volume IX (Oceanic) is the Library's a-ocea; and Budge's Gods of the Egyptians, which
is the Library's x-goe.
"""
import re

SCH = ('A work of scholarship of its time: its writer’s methods, and much of the evidence he had, were not ours. Read it as a landmark in the study of religion and as a record of what '
       'was believed about other peoples’ faiths when it was written, not as the present view, and set a recent work beside it.')
REF = ('A reference work of its time, in the learning and the language of its time (a hundred years ago or more). Read an article as the state of knowledge when it was written and as the '
       'view of its writer, who signs it, and not as a recent or neutral statement; a recent reference work will correct much of it.')


def G(idents, by, note='', lib=None, **kw):
    d = dict(idents=idents if isinstance(idents, list) else [idents], by=by, note=note, trim_index=True, trim_front=True, trim_back=True, split='auto')
    if lib: d['lib'] = lib
    d.update(kw)
    return d


def S(title, when):
    return (title, 'sc', when, 'sec', None)


# ── an encyclopedia's articles: no heading pattern finds them, so the text is cut into parts of about 28,000 letters at a paragraph end and each part is named by the first headword in it ──
_JUNK = re.compile(r'^(?:THE |AN )?(?:ENCYCLOP\w*|JEWISH ENCYCLOPEDIA|CATHOLIC ENCYCLOPEDIA|VOLUME [IVXL]+|CONTENTS|PREFACE|ILLUSTRATIONS|LISTS? OF ABBREVIATIONS|AUTHORS?\b.*|CROSS-?REF\w*|SCHEME OF TRANSLITERATION|VOWELS|CONSONANTS|RELIGION AND ETHICS|OF RELIGION AND ETHICS|A COMPLETE LIST.*|NIHIL OBSTAT|IMPRIMATUR|SPECIAL EDITION|.*KNIGHTS OF COLUMBUS.*|T\. & T\. CLARK|CHARLES SCRIBNER.*|NEW YORK|LONDON|EDINBURGH|PRINTED .*|ALL RIGHTS RESERVED|COPYRIGHT.*|FUNK & WAGNALLS.*|THE ENCYCLOPEDIA PRESS.*|EDITED BY.*|BY THE .*|[IVXL]+\.?|[A-Z]\.?)$')


def _head(line):
    s = re.sub(r'\s+', ' ', line).strip(' .,;:—-')
    if not (4 <= len(s) <= 64) or re.search(r'[a-z]', s) or len(re.findall(r'[A-Z]', s)) < 4 or re.search(r'\d{2,}', s) or _JUNK.match(s): return None
    if re.match(r'^(?:VOL\b|FIG\b|PLATE\b|PAGE\b|[A-Z]\. ?[A-Z]|[IVXLC]+\.\s)', s) or re.search(r'\b[A-Z]\.[A-Z]|[A-Z]\.,', s): return None      # a running head with the volume and page, a figure, an author’s signature, a list of degrees
    return s


def enc_sections(t, size=28000):
    """Cut an encyclopedia volume's text into [title, body] parts of about `size` letters, each at a paragraph end; a part is named by the first headword (a line of capitals) in it."""
    paras = [p for p in re.split(r'\n\s*\n', t) if p.strip()]
    out = []; cur = []; n = 0; prev = None
    def flush():
        nonlocal cur, n, prev
        if not cur: return
        title = None
        for p in cur:
            for ln in p.split('\n')[:3]:
                h = _head(ln)
                if h: title = h; break
            if title: break
        title = (title or '').title().replace(' Of ', ' of ').replace(' And ', ' and ').replace(' The ', ' the ') if title else None
        if not title: title = (prev + ' (continued)') if prev else 'Introduction'
        elif title == prev or title == (prev or '').replace(' (continued)', ''): title = title + ' (continued)'
        prev = title.replace(' (continued)', ''); out.append([title, '\n\n'.join(cur).replace('<', '‹').replace('>', '›')]); cur = []; n = 0      # a stray angle bracket of the scan is not markup
    for p in paras:
        if n + len(p) > size and cur: flush()
        cur.append(p); n += len(p)
    flush()
    return out


def _vols(names, prefix, start=1):
    return {'%s%02d' % (prefix, k + start): v for k, v in enumerate(names)}


SPECS = {
    # ── Religion in general: the founders of the study of religion ──
    'x-tyl': G(['PG70458', 'PG70484'], 'Edward B. Tylor, Primitive Culture: Researches into the Development of Mythology, Philosophy, Religion, Language, Art and Custom, two volumes (London: John Murray; Project Gutenberg #70458 and #70484)',
               'The book (1871) that founded the anthropology of religion: Tylor’s “minimum definition” of religion as belief in spiritual beings (animism), the idea of the soul, the doctrine of survivals, myth and rites among peoples of every age. ' + SCH,
               lib=S('Primitive Culture (E. B. Tylor, 1871), two volumes', '1871 CE')),
    'x-rss': G('lecturesonreli00smit', 'W. Robertson Smith, Lectures on the Religion of the Semites: The Fundamental Institutions (London: Adam and Charles Black, second edition, 1894; first series of the Burnett Lectures, 1888–89)',
               'The lectures that made the comparative study of ancient religion a study of ritual: the sacrificial meal as communion with the god, sacred places and things, holiness and uncleanness (taboo), the early Hebrews and Arabs. A source for Frazer, Durkheim and Freud. ' + SCH,
               lib=S('Lectures on the Religion of the Semites (W. Robertson Smith, 1889; 2nd ed. 1894)', '1889 CE')),
    'x-hpg': G('prolegomenatostu00harr', 'Jane Ellen Harrison, Prolegomena to the Study of Greek Religion (Cambridge: University Press, second edition, 1908; the illustrations are not in the text)',
               'The book that showed how much of Greek religion lies under the Olympians: the rites of the earth, the dead and the Underworld, the Dionysiac and Orphic mysteries, ritual before myth. It was read by a generation of poets and scholars. ' + SCH,
               lib=S('Prolegomena to the Study of Greek Religion (Jane Ellen Harrison, 1903; 2nd ed. 1908)', '1903 CE')),
    'x-hth': G('themisstudyofsoc00harr', 'Jane Ellen Harrison, Themis: A Study of the Social Origins of Greek Religion, with an excursus on the ritual forms preserved in Greek tragedy by Gilbert Murray (Cambridge: University Press, 1912)',
               'Harrison’s study of the Greek year-spirit and its ritual (the Kouretes, the Hymn of the Kouretes, the Olympic games, Zeus and Dionysos), taking Durkheim’s idea that a god is the projection of the group’s own life. ' + SCH,
               lib=S('Themis: A Study of the Social Origins of Greek Religion (Jane Ellen Harrison, 1912)', '1912 CE')),
    'x-fbi': G(['beliefinimmortal00frazuoft', 'bwb_C0-AYK-195_2', 'bwb_C0-AYK-204_3'], 'Sir James George Frazer, The Belief in Immortality and the Worship of the Dead, three volumes (London: Macmillan, 1913, 1922, 1924)',
               'Frazer’s survey of what peoples believed about the soul and the dead: volume I the Aborigines of Australia, the Torres Straits islanders, New Guinea and Melanesia; volume II the Polynesians; volume III the Micronesians. A record of the reports of travellers and missionaries, in their terms. ' + SCH,
               lib=S('The Belief in Immortality and the Worship of the Dead (J. G. Frazer, 1913–24), three volumes', '1913–24 CE')),
    'x-mis': G('introductiontosc00ml', 'F. Max Müller, Introduction to the Science of Religion: Four Lectures delivered at the Royal Institution, in February and March 1870 (London: Longmans, Green, 1873)',
               'The lectures in which Müller named and defended a comparative “science of religion”: the case for studying every religion by the same method, the value of the sacred books, the classification of religions and “he who knows one, knows none”. ' + SCH,
               lib=S('Introduction to the Science of Religion (F. Max Müller, 1873)', '1870 CE')),
    'x-mnr': G('naturalreligiong00ml', 'F. Max Müller, Natural Religion: The Gifford Lectures delivered before the University of Glasgow in 1888 (London: Longmans, Green, 1889)',
               'The first of Müller’s four Gifford series: on the idea of the infinite and its beginnings in language, and on the natural, physical, anthropological and psychological roads to religion that the next three series follow. ' + SCH,
               lib=S('Natural Religion (F. Max Müller, Gifford Lectures, 1889)', '1888 CE')),
    'x-mpr': G('physicalreligion00ml', 'F. Max Müller, Physical Religion: The Gifford Lectures delivered before the University of Glasgow in 1890 (London: Longmans, Green, 1891)',
               'Müller’s second Gifford series, on the religion that begins in the sight of nature: the sun, the dawn, fire, the storm and the heavens in the Vedas and in other peoples’ worship. ' + SCH,
               lib=S('Physical Religion (F. Max Müller, Gifford Lectures, 1891)', '1890 CE')),
    'x-mao': G('anthropologicalr00ml', 'F. Max Müller, Anthropological Religion: The Gifford Lectures delivered before the University of Glasgow in 1891 (London: Longmans, Green, 1892)',
               'Müller’s third Gifford series: the worship of the dead, ancestors and the soul, the forms of burial and of belief in life after death among the ancient Egyptians, Indians, Greeks and other peoples, and his reply to Tylor and Spencer on origins. ' + SCH,
               lib=S('Anthropological Religion (F. Max Müller, Gifford Lectures, 1892)', '1891 CE')),
    'x-mth': G('theosophyorpsych00mulliala', 'F. Max Müller, Theosophy, or Psychological Religion: The Gifford Lectures delivered before the University of Glasgow in 1892 (London: Longmans, Green, 1893)',
               'The last of the four Gifford series: the soul’s own knowledge of God, taken through the Upanishads, the Vedanta, the Logos of the Greek Fathers and the teaching of Eckhart, Tauler and the German mystics. ' + SCH,
               lib=S('Theosophy, or Psychological Religion (F. Max Müller, Gifford Lectures, 1893)', '1892 CE')),
    'x-lmr': G('makingofreligion00languoft', 'Andrew Lang, The Making of Religion (London: Longmans, Green, 1898)',
               'Lang’s argument against Tylor’s animism: that belief in a high god is found among peoples he called “low savages” and so is not simply an outgrowth of ghost-belief; with his chapters on psychical research. ' + SCH,
               lib=S('The Making of Religion (Andrew Lang, 1898)', '1898 CE')),
    'x-mtr': G('thresholdofrelig00mareuoft', 'R. R. Marett, The Threshold of Religion (London: Methuen, 1909)',
               'Essays by the Oxford anthropologist on the “pre-animistic” origins of religion in awe before mana, the power in things, on tabu, magic and the savage’s “supernatural”, which opened a way beyond Tylor. ' + SCH,
               lib=S('The Threshold of Religion (R. R. Marett, 1909)', '1909 CE')),
    'x-jhr': G('introductiontohi00jevo', 'F. B. Jevons, An Introduction to the History of Religion (London: Methuen, 1896)',
               'A textbook of the comparative history of religion: totemism, ancestor-worship, fetishism, polytheism, the idea of God and the question of an original monotheism, from a Christian scholar’s standpoint. ' + SCH,
               lib=S('An Introduction to the History of Religion (F. B. Jevons, 1896)', '1896 CE')),
    'x-tsr': G(['elementsofthesci01tieluoft', 'elementsofthesci02tieluoft'], 'C. P. Tiele, Elements of the Science of Religion: Gifford Lectures delivered before the University of Edinburgh in 1896 and 1898, two parts (Edinburgh and London: William Blackwood, 1897–99)',
               'The Leiden scholar’s account of religion as a whole: part I (Morphological) classes the religions and traces their growth; part II (Ontological) asks what religion is and where it comes from. ' + SCH,
               lib=S('Elements of the Science of Religion (C. P. Tiele, Gifford Lectures, 1897–99), two parts', '1897–99 CE')),
    'x-oih': G('in.ernet.dli.2015.22259', 'Rudolf Otto, The Idea of the Holy: An Inquiry into the Non-Rational Factor in the Idea of the Divine and its Relation to the Rational, translated by John W. Harvey (Oxford: University Press, 1923)',
               'Otto’s account of the “numinous”: the experience of a mystery that is at once terrifying and fascinating (mysterium tremendum et fascinans), which he held to be the root of all religion and not to be reduced to morals or reason. ' + SCH,
               lib=S('The Idea of the Holy (Rudolf Otto, 1917; trans. Harvey, 1923)', '1917 CE (trans. 1923)')),
    'x-ftt': G('totemtabooresemb00freu', 'Sigmund Freud, Totem and Taboo: Resemblances between the Psychic Lives of Savages and Neurotics, translated by A. A. Brill (New York: Moffat, Yard, 1918)',
               'Freud’s essays (1912–13) on the horror of incest, taboo, animism and the totem meal, ending in his theory of the murder of the primal father as the origin of religion and morals. Anthropologists have not accepted it. ' + SCH,
               lib=S('Totem and Taboo (Sigmund Freud, 1913; trans. Brill, 1918)', '1913 CE (trans. 1918)')),
    'x-fil': G('futureofillusion0000freu_z3s3', 'Sigmund Freud, The Future of an Illusion, translated by W. D. Robson-Scott (London: Hogarth Press and the Institute of Psycho-Analysis, 1928)',
               'Freud’s short book (1927) on religion as a wish-fulfilment that the growth of science should let us outgrow: a dialogue with an imagined believer about what religious ideas are and why people hold them. ' + SCH,
               lib=S('The Future of an Illusion (Sigmund Freud, 1927; trans. 1928)', '1927 CE (trans. 1928)')),
    'x-wpe': G('protestantethics00webe', 'Max Weber, The Protestant Ethic and the Spirit of Capitalism, translated by Talcott Parsons (London: George Allen & Unwin, 1930)',
               'Weber’s essay (1904–05) on how the Calvinist idea of the calling and of worldly asceticism helped to form the spirit of modern capitalism. The founding book of the sociology of religion. ' + SCH,
               lib=S('The Protestant Ethic and the Spirit of Capitalism (Max Weber, 1904–05; trans. Parsons, 1930)', '1904–05 CE (trans. 1930)')),
    'x-wph': G('prolegomenatohi00wellgoog', 'Julius Wellhausen, Prolegomena to the History of Israel, with a reprint of the article “Israel” from the Encyclopaedia Britannica, translated by J. Sutherland Black and Allan Menzies (Edinburgh: Adam & Charles Black, 1885)',
               'The book that gave the documentary hypothesis its classic form: that the Pentateuch is woven from four sources, the law is later than the prophets, and Israel’s worship was gradually centralised. It changed how the Bible is read. ' + SCH,
               lib=S('Prolegomena to the History of Israel (Julius Wellhausen, 1878; trans. 1885)', '1878 CE (trans. 1885)')),
    'x-sqj': G('questofhistorica00schwrich', 'Albert Schweitzer, The Quest of the Historical Jesus: A Critical Study of its Progress from Reimarus to Wrede, translated by W. Montgomery (London: Adam & Charles Black, 1910)',
               'Schweitzer’s history of two centuries of lives of Jesus, and his own conclusion that Jesus was an apocalyptic preacher of the coming Kingdom, whom each age had made in its own image. ' + SCH,
               lib=S('The Quest of the Historical Jesus (Albert Schweitzer, 1906; trans. Montgomery, 1910)', '1906 CE (trans. 1910)')),
    'x-hwc': G('whatischristiani00harn', 'Adolf Harnack, What is Christianity? Sixteen Lectures delivered in the University of Berlin during the Winter Term, 1899–1900, translated by Thomas Bailey Saunders (London: Williams & Norgate, 1901)',
               'The best known statement of liberal Protestant theology: that the Gospel is the fatherhood of God, the infinite value of the human soul and the higher righteousness, and that the Church’s dogmas grew round that core. ' + SCH,
               lib=S('What is Christianity? (Adolf von Harnack, 1900; trans. Saunders, 1901)', '1899–1900 CE')),
    'x-rlj': G('thelifeofjesus00renauoft', 'Ernest Renan, The Life of Jesus (1863), English translation (London: Watts, 1891 printing)',
               'The French scholar’s “life of Jesus” as a man: a gentle Galilean teacher whose preaching grew into a claim that his followers made divine. It was banned by the Church and sold in hundreds of thousands. ' + SCH,
               lib=S('The Life of Jesus (Ernest Renan, 1863; English translation)', '1863 CE')),

    # ── The religions of India and Buddhism ──
    'x-kmb': G('in.ernet.dli.2015.174771', 'H. Kern, Manual of Indian Buddhism (Strassburg: Karl J. Trübner, 1896; Grundriss der indo-arischen Philologie und Altertumskunde III, 8)',
               'A short, dense account of the Buddha’s life and teaching, the councils and sects, the canon and its languages, the monastic order and Buddhism’s later forms in India, by the Leiden Sanskritist. ' + SCH,
               lib=S('Manual of Indian Buddhism (H. Kern, 1896)', '1896 CE')),
    'x-bri': G('religionsofindia00bart', 'A. Barth, The Religions of India, translated by J. Wood (London: Trübner, 1882)',
               'The French Indologist’s survey of the Indian religions from the Vedas to the Hinduism of his day, Buddhism, Jainism and the sects, noted for its fairness to the religions of India. ' + SCH,
               lib=S('The Religions of India (A. Barth, 1879; trans. Wood, 1882)', '1879 CE (trans. 1882)')),
    'x-mwb': G('brahmanismhindui00moni', 'Sir Monier Monier-Williams, Brahmanism and Hinduism; or, Religious Thought and Life in India, as based on the Veda and other Sacred Books of the Hindus (London: John Murray, fourth edition, 1891)',
               'The Oxford Sanskritist’s Gifford-style survey: the Veda, the Brahmanas, the Upanishads, the epics and Puranas, the sects, the philosophies and the religion of the people, with his own Christian judgments. ' + SCH,
               lib=S('Brahmanism and Hinduism (Sir Monier Monier-Williams, 1891 edition)', '1878–91 CE')),
    'x-mwu': G('buddhisminitscon00moni', 'Sir Monier Monier-Williams, Buddhism, in its Connexion with Brahmanism and Hinduism, and in its Contrast with Christianity (London: John Murray, 1889)',
               'The Boden Professor’s lectures on Buddhism: its origin in Brahmanism, the Buddha’s teaching and the later schools, set beside Christianity. ' + SCH,
               lib=S('Buddhism (Sir Monier Monier-Williams, 1889)', '1889 CE')),
    'x-hri': G('religionsofindia00hopk', 'Edward Washburn Hopkins, The Religions of India (Boston: Ginn & Company, 1895; Handbooks on the History of Religions)',
               'The Yale Sanskritist’s history of Indian religion from the Veda and the epics to Buddhism, Jainism and Hinduism, with long chapters on the Brahmanical systems. ' + SCH,
               lib=S('The Religions of India (E. W. Hopkins, 1895)', '1895 CE')),
    'x-vmd': G('vedicmythology00macduoft', 'Arthur A. Macdonell, Vedic Mythology (Strassburg: Karl J. Trübner, 1897; Grundriss der indo-arischen Philologie und Altertumskunde III, 1 A)',
               'The standard account of the gods of the Rigveda and the Atharvaveda, one by one (Indra, Agni, Soma, Varuna, the Maruts, the Ashvins and the rest), with the demons, the ancestors and the Vedic ideas of the soul. ' + SCH,
               lib=S('Vedic Mythology (A. A. Macdonell, 1897)', '1897 CE')),
    'x-kvu': G(['religionandphilo030957mbp', 'religionandphilo030958mbp'], 'A. Berriedale Keith, The Religion and Philosophy of the Veda and Upanishads, two volumes (Cambridge, Mass.: Harvard University Press, 1925; Harvard Oriental Series 31 and 32)',
               'Keith’s full survey: volume I the Vedic gods, the sacrifice and the ritual literature; volume II the Upanishads and the beginnings of Indian philosophy, with sceptical judgments on much that earlier writers had claimed. ' + SCH,
               lib=S('The Religion and Philosophy of the Veda and Upanishads (A. B. Keith, 1925), two volumes', '1925 CE')),
    'x-ehb': G(['hinduismandbuddh00eliouoft', 'hinduismandbuddh02eliouoft', 'hinduismandbuddh03eliouoft'], 'Sir Charles Eliot, Hinduism and Buddhism: An Historical Sketch, three volumes (London: Edward Arnold, 1921; this copy is the Routledge & Kegan Paul reprint)',
               'A diplomat-scholar’s history of Indian religion and its spread: volume I the Vedas to the sects, volume II Buddhism in India and beyond, volume III Mahayana and Buddhism in China, Tibet and Japan. Still read for its clarity. ' + SCH,
               lib=S('Hinduism and Buddhism: An Historical Sketch (Sir Charles Eliot, 1921), three volumes', '1921 CE')),

    # ── China, Japan, Persia, the Islamic world ──
    'x-dgc': G(['religioussystemo01groo', 'religioussystemo02groo', 'religioussystemo03groo', 'religioussystem04groo', 'religioussystem05groo', 'religioussystemo06groo'], 'J. J. M. de Groot, The Religious System of China: Its Ancient Forms, Evolution, History and Present Aspect, Manners, Customs and Social Institutions connected therewith, six volumes (Leiden: E. J. Brill, 1892–1910)',
               'The monumental account of Chinese popular religion as the Amoy region practised it: burial and the dead, the soul and ancestor worship, funerals and tombs, demonology and sorcery, the priests of the Taoist and Buddhist temples. Based on what de Groot saw and on Chinese books. ' + SCH,
               lib=S('The Religious System of China (J. J. M. de Groot, 1892–1910), six volumes', '1892–1910 CE')),
    'x-gcr': G('confucianismitsr00gileuoft', 'Herbert A. Giles, Confucianism and its Rivals: The Hibbert Lectures for 1914 (London: Williams & Norgate, 1915)',
               'Cambridge’s Chinese professor on Confucianism, Taoism, Buddhism and the popular beliefs and on how each fared: sharp-edged and often sceptical. ' + SCH,
               lib=S('Confucianism and its Rivals (H. A. Giles, Hibbert Lectures, 1915)', '1914 CE')),
    'x-lrc': G('thereligionsofch00legguoft', 'James Legge, The Religions of China: Confucianism and Tâoism described and compared with Christianity (London: Hodder and Stoughton, 1880)',
               'Legge’s lectures at Oxford, by the translator of the Chinese classics: the ancient Chinese belief in Shang Ti, the state worship, Confucius, Lao Tzu and the Tâo, set against the Christian faith he served as a missionary. ' + SCH,
               lib=S('The Religions of China (James Legge, 1880)', '1880 CE')),
    'x-edr': G('religioninchina00edkiuoft', 'Joseph Edkins, Religion in China: containing a brief account of the three religions of the Chinese (London: Kegan Paul, Trench, Trübner, 1884)',
               'A missionary’s short, learned account of Confucianism, Buddhism and Taoism and of popular religion in China, with his own account of how the Chinese religions had changed. ' + SCH,
               lib=S('Religion in China (Joseph Edkins, 1884)', '1884 CE')),
    'x-grj': G('religionsofjapan00grif', 'William Elliot Griffis, The Religions of Japan from the Dawn of History to the Era of Meiji (New York: Charles Scribner’s Sons, 1895)',
               'A history of Japanese religion by an American teacher in Japan: the Shinto of the Kojiki, Buddhism and its sects, Confucian ethics and the Christian missions to his own day. ' + SCH,
               lib=S('The Religions of Japan (W. E. Griffis, 1895)', '1895 CE')),
    'x-ast': G('shintothewayofgo00asto_0', 'W. G. Aston, Shinto (The Way of the Gods) (London: Longmans, Green, 1905)',
               'The British consular scholar’s account of Shinto: the myths of the Kojiki and Nihongi, the gods and the shrines, ritual and purification, and the ethics and the state, by the translator of the Nihongi. ' + SCH,
               lib=S('Shinto: The Way of the Gods (W. G. Aston, 1905)', '1905 CE')),
    'x-hjp': G('japanattemptatin00heariala', 'Lafcadio Hearn, Japan: An Attempt at Interpretation (New York: Macmillan, 1904)',
               'Hearn’s last book, on what he took to be the key to Japanese life: the religion of the family and of the dead, ancestor-worship, the household and the community cults, and how they shaped the nation. ' + SCH,
               lib=S('Japan: An Attempt at Interpretation (Lafcadio Hearn, 1904)', '1904 CE')),
    'x-jzr': G('zoroasterprophet00jack', 'A. V. Williams Jackson, Zoroaster, the Prophet of Ancient Iran (New York: Macmillan, 1899)',
               'The Columbia Iranist’s life of Zoroaster and account of his teaching, with the Gathas’ background, the Avesta’s lands and the legends that grew around him. ' + SCH,
               lib=S('Zoroaster, the Prophet of Ancient Iran (A. V. W. Jackson, 1899)', '1899 CE')),
    'x-mez': G('earlyzoroastrian00mouluoft', 'James Hope Moulton, Early Zoroastrianism: Lectures delivered at Oxford and in London, February to June 1912 (The Hibbert Lectures, London: Williams & Norgate, 1913)',
               'A Methodist scholar’s study of the Zoroastrianism of the Gathas and the Magi: the “old Aryan” background, the prophet, the Avesta and its dating, Persia’s Magi and the Western tradition. ' + SCH,
               lib=S('Early Zoroastrianism (J. H. Moulton, Hibbert Lectures, 1913)', '1912 CE')),
    'x-mdt': G('developmentofmux00macduoft', 'Duncan B. Macdonald, Development of Muslim Theology, Jurisprudence and Constitutional Theory (New York: Charles Scribner’s Sons, 1903; The International Theological Library)',
               'A history of Islamic thought: the Prophet and the first community, the law schools, the speculative theology of the Mutazilites and Ashari, the Sufis and the orders, and the modern state of Muslim belief. ' + SCH,
               lib=S('Development of Muslim Theology, Jurisprudence and Constitutional Theory (D. B. Macdonald, 1903)', '1903 CE')),
    'x-nmi': G('cu31924074296231', 'Reynold A. Nicholson, The Mystics of Islam (London: G. Bell and Sons, 1914)',
               'A short, classic introduction to Sufism: its beginnings, the Sufi doctrine of God, the Path and its stages, the saints, and the great Persian and Arab mystics from Rabia to Ibn al-Arabi and Rumi, by the Cambridge translator of the Masnavi. ' + SCH,
               lib=S('The Mystics of Islam (R. A. Nicholson, 1914)', '1914 CE')),

    # ── Egypt, Babylon, Greece, Rome ──
    'x-ehr': G('handbookofegypti00erma', 'Adolf Erman, A Handbook of Egyptian Religion, translated by A. S. Griffith (London: Archibald Constable, 1907)',
               'A short survey by the Berlin Egyptologist: the gods and their cults, the myths of the creation and of Osiris, the dead and the Underworld, magic and the temple, and the changes of the religion over three thousand years. ' + SCH,
               lib=S('A Handbook of Egyptian Religion (Adolf Erman, 1905; trans. 1907)', '1905 CE (trans. 1907)')),
    'x-jrb': G('religionofbabylo00jastuoft', 'Morris Jastrow, The Religion of Babylonia and Assyria (Boston: Ginn & Company, 1898; Handbooks on the History of Religions)',
               'The standard English account of its day: the gods and the temples, the creation and the flood epics, the priesthood and the omens, the astrology, the hymns and psalms, the beliefs about death. ' + SCH,
               lib=S('The Religion of Babylonia and Assyria (Morris Jastrow, 1898)', '1898 CE')),
    'x-fcg': G(['thecultsofthegre01farnuoft', 'thecultsofthegre02farnuoft', 'in.ernet.dli.2015.56574', 'in.ernet.dli.2015.56575', 'cultsofthegreek05farnuoft'], 'Lewis Richard Farnell, The Cults of the Greek States, five volumes (Oxford: Clarendon Press, 1896–1909)',
               'The reference history of the worship of every Greek god in turn: Zeus, Hera, Athena, Demeter and Kore, Poseidon, Apollo, Artemis, Aphrodite, Hermes, Dionysos and others, with their cults, festivals and the evidence of inscriptions and monuments. ' + SCH,
               lib=S('The Cults of the Greek States (L. R. Farnell, 1896–1909), five volumes', '1896–1909 CE')),
    'x-mfs': G('fivestagesofgree00murr_0', 'Gilbert Murray, Five Stages of Greek Religion (Oxford: Clarendon Press, 1925)',
               'Four lectures and an essay on Greek religion from its primitive beginnings, through the Olympians and the philosophers’ “failure of nerve”, to the Hellenistic and late pagan religion that fought the rise of Christianity. ' + SCH,
               lib=S('Five Stages of Greek Religion (Gilbert Murray, 1925)', '1925 CE')),
    'x-rps': G('in.ernet.dli.2015.218435', 'Erwin Rohde, Psyche: The Cult of Souls and Belief in Immortality among the Greeks, translated from the eighth edition by W. B. Hillis (London: Kegan Paul, Trench, Trubner, 1925)',
               'Rohde’s great study (1890–94) of the Greek soul: the cult of the dead and of heroes, the Homeric view of the psyche, the Eleusinian and Orphic mysteries, Dionysos and the idea that the soul is immortal. ' + SCH,
               lib=S('Psyche: The Cult of Souls and Belief in Immortality among the Greeks (Erwin Rohde, 1890–94; trans. 1925)', '1890–94 CE (trans. 1925)')),
    'x-frr': G('religiousexperi00fowl', 'W. Warde Fowler, The Religious Experience of the Roman People from the Earliest Times to the Age of Augustus (London: Macmillan, 1911; Gifford Lectures, 1909–10)',
               'A history of Roman religion: the religion of the household and of the farm, the state cults and the calendar, the old gods and the foreign cults, the failure of the old religion and Augustus’s revival, with an account of what the Romans felt. ' + SCH,
               lib=S('The Religious Experience of the Roman People (W. Warde Fowler, 1911)', '1909–10 CE')),
    'x-gcl': G('conflictofreligi00glovuoft', 'T. R. Glover, The Conflict of Religions in the Early Roman Empire (London: Methuen, 1909)',
               'Essays on the religious world in which Christianity began: the Greek and Roman gods, Stoicism, the mystery religions and the philosophers, and why a new religion won its place in it. ' + SCH,
               lib=S('The Conflict of Religions in the Early Roman Empire (T. R. Glover, 1909)', '1909 CE')),
    'x-cmo': G('orientalreligion00cumo', 'Franz Cumont, The Oriental Religions in Roman Paganism, translated from the second French edition (Chicago: Open Court, 1911)',
               'Cumont’s lectures on the cults that came into Rome from the East: the Great Mother and Attis, Isis and Serapis, the Syrian gods, Mithra, the Persian and Chaldean astrology, and what they gave the Roman world. ' + SCH,
               lib=S('The Oriental Religions in Roman Paganism (Franz Cumont, 1906; trans. 1911)', '1906 CE (trans. 1911)')),
    'x-bdr': G('developmentofrel00brea', 'James Henry Breasted, Development of Religion and Thought in Ancient Egypt: Lectures delivered on the Morse Foundation at Union Theological Seminary (New York: Charles Scribner’s Sons, 1912)',
               'The Chicago Egyptologist’s account of Egyptian religion as it grew: sun-worship, the Osirian faith, the Pyramid Texts, the moral awakening and Ikhnaton’s reform, and the way the old magic and the new ethics were joined. ' + SCH,
               lib=S('Development of Religion and Thought in Ancient Egypt (J. H. Breasted, 1912)', '1912 CE')),
    'x-lfr': G(['forerunnersrival01legguoft', 'forerunnersrival02legguoft'], 'F. Legge, Forerunners and Rivals of Christianity: Being Studies in Religious History from 330 B.C. to 330 A.D., two volumes (Cambridge: University Press, 1915)',
               'A survey of the religions of the Hellenistic and Roman world before and beside the Church: the Greek mysteries, Orphism, Egyptian and Eastern cults, Mithraism, Gnosticism, Manichaeism and Neoplatonism. ' + SCH,
               lib=S('Forerunners and Rivals of Christianity (F. Legge, 1915), two volumes', '1915 CE')),
    'x-amr': G('mysteryreligions00angu_0', 'S. Angus, The Mystery-Religions and Christianity: A Study in the Religious Background of Early Christianity (London: John Murray, 1925)',
               'A detailed comparison of the Greek, Egyptian and Asian mystery cults with the Church of the first centuries: the rites, the ideas of rebirth and of the sacred meal, and what they do and do not explain about Christianity. ' + SCH,
               lib=S('The Mystery-Religions and Christianity (S. Angus, 1925)', '1925 CE')),

    # ── Judaism and the Jewish world ──
    'x-shj': G(['historyofjewishp01sch', 'historyofjewishp02sch', 'historyofjewishp03sch', 'historyofjewishp04sch', 'historyofjewishp05sch'], 'Emil Schürer, A History of the Jewish People in the Time of Jesus Christ, five volumes (Edinburgh: T. & T. Clark, 1885–91; translated from the second German edition)',
               'The standard history of the Jews from the Maccabees to Bar Kokhba: politics, the Temple and priesthood, the law, the scribes and Pharisees, the sects, the Septuagint and the literature of the time, with a bibliography of the sources. ' + SCH,
               lib=S('A History of the Jewish People in the Time of Jesus Christ (Emil Schürer, trans. 1885–91), five volumes', '1885–91 CE')),
    'x-sar': G('cu31924012538918', 'Solomon Schechter, Some Aspects of Rabbinic Theology (London: Adam & Charles Black, 1909)',
               'Schechter’s answer to those who had called rabbinic Judaism legalistic: God and the world, the Law and its joy, repentance and forgiveness, the Kingdom of God, the Messiah, written from the rabbinic sources themselves by a Cambridge reader of the Genizah. ' + SCH,
               lib=S('Some Aspects of Rabbinic Theology (Solomon Schechter, 1909)', '1909 CE')),
    'x-mjd': G(['judaisminfirstce01moor_0', 'judaisminfirstce02moor_0'], 'George Foot Moore, Judaism in the First Centuries of the Christian Era: The Age of the Tannaim, volumes I and II (Cambridge, Mass.: Harvard University Press, 1927)',
               'A landmark corrective to Christian misreadings of Judaism: the rabbinic sources themselves, on revelation, God, sin and atonement, the Law, the Messiah, the world to come and the duty of the Jew. ' + SCH,
               lib=S('Judaism in the First Centuries of the Christian Era (G. F. Moore, 1927), volumes I and II', '1927 CE')),
    'x-elj': G(['lifetimesofjesus01eder', 'lifetimesofjesus02eder'], 'Alfred Edersheim, The Life and Times of Jesus the Messiah, two volumes (London: Longmans, Green, 1886)',
               'A life of Jesus written by a Jewish-born Christian scholar and set in the Jewish world of the time: Palestine, the Temple, the synagogue and the rabbinic writings, with long notes from the Talmud and Midrash. ' + SCH,
               lib=S('The Life and Times of Jesus the Messiah (Alfred Edersheim, 1883), two volumes', '1883 CE')),
    # ── The Mythology of All Races (the volumes published by 1930) ──
    'x-mr01': G('mythologyofallra01gray', 'The Mythology of All Races, volume I: Greek and Roman, by William Sherwood Fox (Boston: Marshall Jones Company, 1916)',
                'The first volume of a thirteen-volume survey edited by Louis Herbert Gray and George Foot Moore: the myths and religion of the Greeks and Romans, from the Aegean and Homeric gods to the Roman cults. ' + SCH,
                lib=S('The Mythology of All Races, volume I: Greek and Roman (W. S. Fox, 1916)', '1916 CE')),
    'x-mr02': G('mythologyofallra21gray', 'The Mythology of All Races, volume II: Eddic, by John Arnott MacCulloch (Boston: Marshall Jones Company, for the Archaeological Institute of America, 1930)',
                'The gods, the world and the end of things in the Poetic Edda and the Norse tradition: Odin, Thor, Loki, the giants, Ragnarök. ' + SCH,
                lib=S('The Mythology of All Races, volume II: Eddic (J. A. MacCulloch, 1930)', '1930 CE')),
    'x-mr03': G('mythologyofallra31gray', 'The Mythology of All Races, volume III: Celtic, by John Arnott MacCulloch, and Slavic, by Jan Máchal (Boston: Marshall Jones Company, 1918)',
                'The gods, heroes and festivals of the Celts (Irish, Welsh and Gaulish) and of the Slavs, from the earliest records. ' + SCH,
                lib=S('The Mythology of All Races, volume III: Celtic and Slavic (MacCulloch and Máchal, 1918)', '1918 CE')),
    'x-mr04': G('mythologyofallra41gray', 'The Mythology of All Races, volume IV: Finno-Ugric, by Uno Holmberg, and Siberian, by Uno Holmberg (Boston: Marshall Jones Company, for the Archaeological Institute of America, 1927)',
                'The mythology of the Finns, Estonians, Lapps and other Finno-Ugric peoples and of the shamanic peoples of Siberia: the creation, the spirits, the bear ceremonies and the shaman’s journey. ' + SCH,
                lib=S('The Mythology of All Races, volume IV: Finno-Ugric and Siberian (Uno Holmberg, 1927)', '1927 CE')),
    'x-mr06': G('mythologyofallra61gray', 'The Mythology of All Races, volume VI: Indian, by A. Berriedale Keith, and Iranian, by Albert J. Carnoy (Boston: Marshall Jones Company, 1917)',
                'The gods and myths of the Veda, the epics and the Puranas, and of ancient Persia from the Avesta to the Shahnama. ' + SCH,
                lib=S('The Mythology of All Races, volume VI: Indian and Iranian (Keith and Carnoy, 1917)', '1917 CE')),
    'x-mr07': G('mythologyofallra71gray', 'The Mythology of All Races, volume VII: Armenian, by M. H. Ananikian, and African, by Alice Werner (Boston: Marshall Jones Company, for the Archaeological Institute of America, 1925)',
                'The myths of Armenia (with the Hurrian and Persian background) and of the Bantu, Hamitic, Sudanese and other peoples of Africa, from the missionaries’ and administrators’ records. ' + SCH,
                lib=S('The Mythology of All Races, volume VII: Armenian and African (Ananikian and Werner, 1925)', '1925 CE')),
    'x-mr08': G('mythologyofallra81gray', 'The Mythology of All Races, volume VIII: Chinese, by John Calvin Ferguson, and Japanese, by Masaharu Anesaki (Boston: Marshall Jones Company, for the Archaeological Institute of America, 1928)',
                'The myths, gods and beliefs of China (from the Shang to the popular religion) and of Japan (the Kojiki and Nihongi gods, the Shinto and Buddhist traditions). ' + SCH,
                lib=S('The Mythology of All Races, volume VIII: Chinese and Japanese (Ferguson and Anesaki, 1928)', '1928 CE')),
    'x-mr10': G('mythologyofallra10gray', 'The Mythology of All Races, volume X: North American, by Hartley Burr Alexander (Boston: Marshall Jones Company, 1916)',
                'The myths and religions of the native peoples of North America, region by region: the Eskimo, the Northwest Coast, the Plains, the Southwest, the Eastern woodlands, with the mythic themes common to them. ' + SCH,
                lib=S('The Mythology of All Races, volume X: North American (Hartley Burr Alexander, 1916)', '1916 CE')),
    'x-mr11': G('mythologyofallra111gray', 'The Mythology of All Races, volume XI: Latin-American, by Hartley Burr Alexander (Boston: Marshall Jones Company, 1920)',
                'The myths and religions of Mexico, Central and South America: the Aztecs, the Maya, the Incas, the peoples of the Amazon and the Caribbean, as the Spanish chroniclers and later observers recorded them. ' + SCH,
                lib=S('The Mythology of All Races, volume XI: Latin-American (Hartley Burr Alexander, 1920)', '1920 CE')),
    'x-mr12': G('mythologyofallra121gray', 'The Mythology of All Races, volume XII: Egyptian, by W. Max Müller, and Indo-Chinese, by Sir James George Scott (Boston: Marshall Jones Company, 1918)',
                'The gods and myths of ancient Egypt, and of the peoples of Burma, Siam, Cambodia, Annam and the Malay lands (their spirits, Buddhism and the older cults). ' + SCH,
                lib=S('The Mythology of All Races, volume XII: Egyptian and Indo-Chinese (Müller and Scott, 1918)', '1918 CE')),
}


# ── The reference works: one text per printed volume, cut into articles' parts by enc_sections ──
_ERE = [('A–Art', 'encyclopaediaofr01hastuoft'), ('Arthur–Bunyan', 'encyclopaediaofr02hastuoft'), ('Burial–Confessions', 'encyclopaediaofr03hastuoft'), ('Confirmation–Dyaks', 'encyclopaediaofr04hastuoft'),
        ('Dravidians–Fichte', 'encyclopaediaofr05hastuoft'), ('Fiction–Hyksos', 'encyclopaediaofr06hast'), ('Hymns–Liberty', 'encyclopaediaofr07hastuoft'), ('Life and Death–Mulla', 'encyclopaediaofr08hastuoft'),
        ('Mundas–Phrygians', 'encyclopaediaofr09hastuoft'), ('Picts–Sacraments', 'encyclopaediaofr10hastuoft'), ('Sacrifice–Sudra', 'encyclopaediaofr11hast'), ('Suffering–Zwingli', 'encyclopaediaofr12hastuoft')]
for _k, (_rng, _id) in enumerate(_ERE, 1):
    SPECS['x-er%02d' % _k] = G(_id, 'James Hastings (ed.), Encyclopaedia of Religion and Ethics, volume %d: %s (Edinburgh: T. & T. Clark, and New York: Charles Scribner’s Sons, 1908–21)' % (_k, _rng),
                               'Volume %d (%s) of the thirteen-volume reference work on every religion, ethic and belief, with signed articles by some five hundred scholars of the time on gods, rites, peoples, doctrines, sacred books, customs and ideas. The volume is cut into parts at paragraph ends and each part is named by the first headword in it. ' % (_k, _rng) + REF,
                               lib=S('Encyclopaedia of Religion and Ethics (ed. Hastings), volume %d: %s' % (_k, _rng), '1908–21 CE'), sectioner=enc_sections, trim_index=False, trim_front=False, trim_back=False, split=None)
SPECS['x-er13'] = G('encyclopaediaindexhastuoft', 'James Hastings (ed.), Encyclopaedia of Religion and Ethics, volume 13: Index (Edinburgh: T. & T. Clark, and New York: Charles Scribner’s Sons, 1926)',
                    'The index to the twelve volumes: every name, subject, people and sacred book with the volume and page of its articles, for finding the place in the encyclopedia where a thing is discussed. ' + REF,
                    lib=S('Encyclopaedia of Religion and Ethics (ed. Hastings), volume 13: Index', '1926 CE'), sectioner=enc_sections, trim_index=False, trim_front=False, trim_back=False, split=None)

_JE = ['Aach–Apocalyptic Literature', 'Apocrypha–Benash', 'Bencemero–Chazanuth', 'Chazars–Dreyfus Case', 'Dreyfus-Brisac–Goat', 'God–Istria', 'Italy–Leon', 'Leon–Moravia', 'Morawczyk–Philippson', 'Philipson–Samosch', 'Samson–Talmid Hakam', 'Talmud–Zweifel']
for _k, _rng in enumerate(_JE, 1):
    SPECS['x-je%02d' % _k] = G('jewishencycloped%02dsing' % _k, 'Isidore Singer (ed.), The Jewish Encyclopedia: A Descriptive Record of the History, Religion, Literature, and Customs of the Jewish People from the Earliest Times to the Present Day, volume %d: %s (New York and London: Funk & Wagnalls, 1901–06)' % (_k, _rng),
                               'Volume %d (%s) of the twelve-volume encyclopedia by some four hundred Jewish scholars of the time, on the Bible and Talmud, the law, the liturgy, the history of the Jews in every land, their literature, mysticism and customs. The volume is cut into parts at paragraph ends and each part is named by the first headword in it. ' % (_k, _rng) + REF,
                               lib=S('The Jewish Encyclopedia, volume %d: %s' % (_k, _rng), '1901–06 CE'), sectioner=enc_sections, trim_index=False, trim_front=False, trim_back=False, split=None)

_CE = ['A–Assize', 'Assyria–Brownson', 'Brownson–Clairvaux', 'Clement–Diocesan', 'Dionysius–Fathers', 'Fathers–Gregory', 'Gregory–Infallibility', 'Infamy–Lapparent', 'Laprade–Mass', 'Mass–Newman', 'New Mexico–Philip', 'Philip–Revalidation', 'Revelation–Simon Stock', 'Simony–Tournely', 'Tournon–Zwirner']
for _k, _rng in enumerate(_CE, 1):
    SPECS['x-ce%02d' % _k] = G('catholicencyclop%02dherbuoft' % _k if _k != 9 else 'catholicencyclop0009char', 'Charles G. Herbermann and others (eds.), The Catholic Encyclopedia: An International Work of Reference on the Constitution, Doctrine, Discipline, and History of the Catholic Church, volume %d: %s (New York: Robert Appleton Company, 1907–12; this copy is the Encyclopedia Press special edition)' % (_k, _rng),
                               'Volume %d (%s) of the fifteen-volume encyclopedia (with an index) of Catholic doctrine, history, saints, orders, liturgy and law, and of the religions and churches seen from the Catholic side. Printed with the Church’s approval (Nihil obstat and Imprimatur), as a Catholic work of its time. The volume is cut into parts at paragraph ends and each part is named by the first headword in it. ' % (_k, _rng) + REF,
                               lib=S('The Catholic Encyclopedia, volume %d: %s' % (_k, _rng), '1907–12 CE'), sectioner=enc_sections, trim_index=False, trim_front=False, trim_back=False, split=None)
SPECS['x-ce16'] = G('catholicencyclop00herbuoft', 'Charles G. Herbermann and others (eds.), The Catholic Encyclopedia, volume 16: Index (New York: The Encyclopedia Press, 1914)',
                    'The index to the fifteen volumes, with the volume and page of every article and subject, for finding where a thing is discussed in the Catholic Encyclopedia. ' + REF,
                    lib=S('The Catholic Encyclopedia, volume 16: Index', '1914 CE'), sectioner=enc_sections, trim_index=False, trim_front=False, trim_back=False, split=None)

SPECS['x-dis'] = G('dictionaryislam00hughuoft', 'Thomas Patrick Hughes, A Dictionary of Islam, being a Cyclopaedia of the Doctrines, Rites, Ceremonies, and Customs, together with the Technical and Theological Terms, of the Muhammadan Religion (London: W. H. Allen, 1895)',
                   'A missionary’s reference book on Islam: the Qur’an, the traditions, the schools of law, the sects, the saints, the festivals, the customs and the terms of the faith, from Arabic and Persian sources and the author’s years in Peshawar, with his own Christian judgments. ' + REF,
                   lib=S('A Dictionary of Islam (Thomas Patrick Hughes, 1885; 1895 edition)', '1885 CE'), sectioner=enc_sections, trim_index=False, trim_front=False, trim_back=False, split=None)


# a book whose chapter headings the generic splitter cannot tell from footnotes, contents lines and running heads is cut into parts of about 26,000 letters, each named by its first words
for _id in ('x-mnr', 'x-mtr', 'x-sqj', 'x-vmd', 'x-kmb', 'x-bri', 'x-mfs', 'x-frr', 'x-sar', 'x-hjp', 'x-mwb', 'x-edr', 'x-jzr', 'x-shj', 'x-elj', 'x-mjd', 'x-mdt', 'x-mth', 'x-tsr', 'x-rlj', 'x-fcg',
            'x-mr01', 'x-mr02', 'x-mr03', 'x-mr04', 'x-mr06', 'x-mr07', 'x-mr08', 'x-mr10', 'x-mr11', 'x-mr12', 'x-fbi', 'x-wpe', 'x-dgc', 'x-grj'):
    SPECS[_id]['split'] = None
