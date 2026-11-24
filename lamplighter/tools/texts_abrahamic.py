"""Specs for further open (pre-1931) English translations from the Jewish, Islamic and Bahá’í traditions: the Legends of the Jews, the medieval Jewish philosophers and the
prayer books, the Shia traditions and the Muharram play, al-Ghazali's Confessions, a manual of Shafi'i law, al-Biruni's calendars, and Bahá’í writings first
published in English before 1931. Merged into texts_archive.SPECS (see the end of that file); built with python3 build_texts.py --only=ids. An ident 'PG123'
is Project Gutenberg #123; the rest are Internet Archive items. Sources were found on 16 November 2026 and fetched on the maker's instruction ("keep going and
find more texts").

Each spec may carry lib=(title, group, when, tr, station title prefix): the Library line and the Path station for an id that is not in the Library yet.
"""
OCR = 'Text from a scan of the printed edition, so occasional OCR errors remain.'
OLD = 'An older translation, so its wording and its scholarship are dated; set a recent translation beside it where there is one.'


def G(idents, by, note='', lib=None, **kw):
    d = dict(idents=idents if isinstance(idents, list) else [idents], by=by, note=note, trim_index=True, trim_front=True, trim_back=True, split='auto')
    if lib: d['lib'] = lib
    d.update(kw)
    return d


SPECS = {
    # ── Jewish ──
    'e-lgj': G(['PG1493', 'PG1494', 'PG2881', 'PG2882'], 'Louis Ginzberg, The Legends of the Jews, volumes 1–4, translated from the German manuscript by Henrietta Szold (Philadelphia: Jewish Publication Society, 1909–1913; Project Gutenberg #1493, #1494, #2881, #2882)',
               'The stories the rabbis told about the Bible, gathered from the Talmud, the Midrash, the Targums and the later Jewish books and told as one continuous story from the Creation to the book of Esther. Ginzberg retells rather than translates, and the sources for each legend are given in volumes 5 and 6 (notes) and 7 (index), which are not in this copy. The Library’s richest single book on how Jewish tradition reads its own scripture.',
               labels=['Volume 1 · from the Creation to Jacob', 'Volume 2 · from Joseph to Moses in the wilderness', 'Volume 3 · from the wilderness to the Judges', 'Volume 4 · from Samuel to Esther'],
               lib=('The Legends of the Jews, volumes 1–4 (Ginzberg, 1909–13): the rabbis’ stories of the Bible from Creation to Esther', 'ju', 'c. 200 BCE – 1000 CE (retold 1909–13)', 'ju', 'The Talmud: argument as worship')),
    'e-pre': G('pirkderabbieli00frieuoft', 'Gerald Friedlander (translator), Pirkê de Rabbi Eliezer (the Chapters of Rabbi Eliezer the Great), according to the text of the manuscript belonging to Abraham Epstein of Vienna (London: Kegan Paul, 1916)',
               'An early medieval Jewish retelling of Genesis and Exodus (probably 8th–9th century), with the creation, the calendar and the order of the year, the covenant of circumcision, the story of the flood, Abraham, Jacob, Joseph and the Exodus, with Friedlander’s long notes. ' + OLD,
               lib=('Pirke de-Rabbi Eliezer (Friedlander, 1916): the medieval Jewish retelling of Genesis and Exodus', 'ju', 'c. 8th–9th c. CE', 'ju', 'The Talmud: argument as worship')),
    'e-kuz': G('judahhalleviskit00judauoft', 'Hartwig Hirschfeld (translator), Judah Hallevi’s Kitab al Khazari, translated from the Arabic (London: Routledge, 1905)',
               'A dialogue in which the king of the Khazars, seeking the true religion, questions a philosopher, a Christian, a Muslim and a rabbi, and chooses Judaism. Halevi’s defence of Israel’s election and of revelation against philosophy, with Hirschfeld’s introduction. ' + OLD,
               lib=('The Kuzari (Judah Halevi, trans. Hirschfeld, 1905): a king seeks the true religion', 'ju', 'c. 1140 CE', 'ju', 'Kabbalah and the Zohar')),
    'e-dth': G('dutiesheart00collgoog', 'Edwin Collins (translator), The Duties of the Heart by Rabbi Bachye ben Joseph ibn Paquda (Wisdom of the East series, London: John Murray, 1909)',
               'A short selection from Bahya’s Duties of the Heart, the Jewish guide to the inner life: trust in God, humility, repentance, self-examination and the love of God, in a short English version from the Arabic. Not the whole book. ' + OLD,
               lib=('Duties of the Heart (Bahya ibn Paquda, trans. Collins, 1909): selected chapters', 'ju', 'c. 1080 CE', 'ju', 'Kabbalah and the Zohar')),
    'e-sdp': G('authoriseddailyp00sing', 'Simeon Singer (editor and translator), The Authorised Daily Prayer Book of the United Hebrew Congregations of the British Empire (London: Eyre and Spottiswoode, 1904 reprint of the 1890 edition)',
               'The standard English-speaking Orthodox prayer book of the twentieth century: the weekday, Sabbath and festival services (morning, afternoon and evening), the Kaddish, the Hymn of Glory and the prayers for special occasions, with the Hebrew and Singer’s English. The Hebrew is left out of this copy; only the English is read.',
               strip_hebrew=True,
               lib=('The Authorised Daily Prayer Book (Singer, 1890): weekday, Sabbath and festival services in English', 'ju', 'liturgy of the 2nd–19th c. CE (edition of 1890)', 'ju', 'The Talmud: argument as worship')),
    'e-ssy': G(['serviceofsynagog01heid', 'serviceofsynagog02heid', 'serviceofsynagog03heid', 'serviceofsynagog04heid', 'serviceofsynagog05heid', 'serviceofsynagog06heid'],
               'Arthur Davis and Michael Adler (translators), Service of the Synagogue: a new edition of the Festival Prayers with an English translation in prose and verse, on Heidenheim’s Hebrew text, 6 volumes (London: George Routledge, second edition, about 1909)',
               'The six volumes of the festival prayer-book (the machzor) in English: the New Year (volume 1), the Day of Atonement (volumes 2 and 3), Tabernacles (volume 4), Passover (volume 5) and Pentecost (volume 6), with the piyyutim (liturgical poems) in English verse and the Hebrew set beside them. The Hebrew is left out of this copy; only the English is read.',
               strip_hebrew=True,
               labels=['Volume 1 · New Year', 'Volume 2 · Day of Atonement, part 1', 'Volume 3 · Day of Atonement, part 2', 'Volume 4 · Tabernacles', 'Volume 5 · Passover', 'Volume 6 · Pentecost'],
               lib=('Service of the Synagogue: the festival prayers (Davis and Adler, 1904–09), 6 volumes', 'ju', 'liturgy of the 2nd–19th c. CE (translation 1904–09)', 'ju', 'The Talmud: argument as worship')),
    'e-tgo': G('cu31924074296975', 'John Wesley Etheridge (translator), The Targums of Onkelos and Jonathan ben Uzziel on the Pentateuch, with the fragments of the Jerusalem Targum, from the Chaldee (London: Longman, 1862–65)',
               'The Aramaic paraphrases of the Torah that were read aloud in the synagogue beside the Hebrew: Onkelos (the plain, official one) and Jonathan ben Uzziel (which adds midrash), with Etheridge’s English. This scan is the second volume only: Leviticus, Numbers and Deuteronomy; Genesis and Exodus are not in it. Shows how the Torah was heard and explained in the first Christian centuries and after. ' + OLD,
               lib=('Targums of Onkelos and Jonathan on Leviticus, Numbers and Deuteronomy (Etheridge, 1865)', 'ju', 'c. 1st–7th c. CE', 'ju', 'The rabbis and the Mishnah')),
    'e-saj': G('sayingsofjewish00tayl', 'Charles Taylor (editor and translator), Sayings of the Jewish Fathers, comprising Pirqe Aboth in Hebrew and English, with notes and excursuses (Cambridge: Cambridge University Press, 1897)',
               'The Mishnah tractate Aboth, the best-known collection of the sayings of the early rabbis (Hillel, Shammai, Rabbi Akiba and others), with a full commentary by a Cambridge scholar who compared them with the Gospels. The Hebrew is left out of this copy; the commentary is long and detailed. ' + OLD,
               strip_hebrew=True,
               lib=('Sayings of the Jewish Fathers (Taylor, 1897): Pirke Avot with commentary', 'ju', 'c. 200 CE (Pirke Avot); commentary 1897', 'ju', 'The rabbis and the Mishnah')),
    'e-jsh': G('bookofjasherrefe00sefe', 'Mordecai Manuel Noah (translator), Sefer ha-Yashar, or the Book of Jasher (New York: Noah and Gould, 1840)',
               'A medieval Hebrew retelling of the story from Adam to the Judges, first printed at Venice in 1625: the creation, Noah, Nimrod, Abraham’s youth in the furnace, Joseph, Moses and the Exodus, with many legends the Bible does not give. It is not the lost “Book of Jasher” that the book of Joshua names (and not the English forgery of 1751). ' + OLD,
               lib=('Sefer ha-Yashar, the “Book of Jasher” (Noah, 1840): a medieval Hebrew retelling from Adam to the Judges', 'ju', 'c. 11th–13th c. CE (printed 1625)', 'ju', 'The Talmud: argument as worship')),

    # ── Islam ──
    'x-hkq': G('lifereligionofmo00majl', 'James L. Merrick (translator), The Life and Religion of Mohammed, as contained in the Sheeah traditions of the Hyat-ul-Kuloob (Boston: Phillips, Sampson, 1850)',
               'A Shia life of the Prophet: the long book (about 1650) by Muhammad Baqir al-Majlisi on his life and the miracles, birth, ascension, battles and family, with the Shia account of Ali, Fatima and the Imams, translated for English readers in 1850. The only Twelver Shia source in English in the Library. ' + OLD,
               lib=('The Life and Religion of Mohammed, from the Shia Hayat al-Qulub (Majlisi, trans. Merrick, 1850)', 'is', 'c. 1650 CE (traditions of the 7th–8th c.)', 'isl', 'Hadith and the prophetic example')),
    'x-hhp': G('TheMiraclePlayOfHasanAndHusain', 'Lewis Pelly (collector and translator), The Miracle Play of Hasan and Husain, collected from oral tradition, 2 vols. (London: W. H. Allen, 1879)',
               'The Shia passion play (the ta’ziya) for Muharram: the story of the martyrdom of Husayn at Karbala, as performed in Persia and written down in 1879, with Pelly’s notes. The sorrow at the heart of Shia devotion. ' + OLD,
               lib=('The Miracle Play of Hasan and Husain (Pelly, 1879): the Shia Muharram passion play', 'is', '19th c. CE (the story of 680 CE)', 'isl', 'Hadith and the prophetic example')),
    'x-cgz': G('PG58977', 'Claud Field (translator), The Confessions of Al Ghazzali (Wisdom of the East series, London: John Murray, 1909; Project Gutenberg #58977)',
               'Al-Ghazali’s own story of how he left his post as the greatest teacher in Baghdad to search for certain knowledge, tried theology, philosophy and the Ismailis and found it in Sufism: the Munqidh min al-dalal (“Deliverance from Error”) in a short English version. Field’s translation is free in places. The Alchemy of Happiness is its own entry.',
               lib=('The Confessions of al-Ghazzali (Field, 1909): the Deliverance from Error', 'is', 'c. 1108 CE', 'isl', 'Al-Ghazālī and')),
    'x-mnj': G('cu31924023205390', 'E. C. Howard (translator), Minhaj et Talibin: a manual of Muhammadan law according to the school of Shafii, by Nawawi, from the French edition of L. W. C. van den Berg (London: W. Thacker, 1914)',
               'The Shafi’i handbook of Islamic law, by al-Nawawi: purity, prayer, fasting, the poor-tax, the pilgrimage, trade, marriage, inheritance and the penal law, in a clear article-by-article English with notes. Shows what the law asks of a Muslim’s worship and daily life. ' + OLD,
               lib=('Minhaj et Talibin (Nawawi, trans. Howard, 1914): a manual of Shafi’i law, with purity, prayer, fasting, pilgrimage', 'is', 'c. 1270 CE', 'isl', 'Hadith and the prophetic example')),
    'x-bch': G('chronologyofanci00biru', 'C. Edward Sachau (translator), The Chronology of Ancient Nations: an English version of the Arabic text of the Athâr-ul-Bâkiya of Albîrûnî, or “Vestiges of the Past” (London: Oriental Translation Fund, 1879)',
               'Al-Biruni’s book of about 1000 CE on the calendars and feast days of the peoples he knew: the Persians, Sogdians, Khwarizmians, Jews, Christians (including the Melkites and Nestorians), the Sabians of Harran, the Arabs before and after Islam, with their eras, months and holy days. The one place in the Library that lines up many religious calendars side by side. ' + OLD,
               lib=('The Chronology of Ancient Nations (al-Biruni, trans. Sachau, 1879): the calendars and feasts of the Persians, Jews, Christians and Arabs', 'is', 'c. 1000 CE', 'isl', 'Persia in late antiquity')),

    # ── Bahá’í (first printed in English before 1931; the later Bahá’í World Centre editions are not used) ──
    'x-bsq': G('someansweredques00abdurich', '‘Abdu’l-Bahá, Some Answered Questions, collected and translated from the Persian by Laura Clifford Barney (London: Kegan Paul, 1908)',
               'Table talks of ‘Abdu’l-Bahá at Acre in 1904–06, written down by Laura Barney: the unity of the prophets and of the religions, the Trinity, the soul, the life after death, the stations of the Manifestations of God, the creation and evolution, with his answers to questions on the Bible, Muhammad and the Bahá’í teachings. ' + OLD,
               lib=('Some Answered Questions (‘Abdu’l-Bahá, trans. Barney, 1908)', 'mo', 'talks of 1904–06 CE', 'mod', 'Bahá’í, Theosophy')),
    'x-bsv': G('sevenvalleysreve00bah', 'Bahá’u’lláh, The Seven Valleys, revealed at Baghdad in answer to questions, translated from the Persian (1906 edition)',
               'The mystical treatise of Bahá’u’lláh (about 1860) on the soul’s seven stages on the way to God: the valleys of search, love, knowledge, unity, contentment, wonderment, and true poverty and absolute nothingness. Written in answer to a Sufi judge. An early English version of 1906. ' + OLD,
               lib=('The Seven Valleys (Bahá’u’lláh, 1860; English of 1906)', 'mo', 'c. 1860 CE', 'mod', 'Bahá’í, Theosophy')),
    'x-bpt': G('talksbyabdulbaha029093mbp', '‘Abdu’l-Bahá, Talks by ‘Abdu’l-Bahá given in Paris, third edition (London: Bahá’í Publishing Society, 1916)',
               'The addresses ‘Abdu’l-Bahá gave in Paris in 1911, on the unity of the religions, the soul, prayer, love and peace, in the English of the first printing. ' + OLD,
               lib=('Talks by ‘Abdu’l-Bahá given in Paris (1911; ed. 1916)', 'mo', 'talks of 1911 CE', 'mod', 'Bahá’í, Theosophy')),
    'x-bpu': G(['promulgationofun01abdu', 'promulgationofun0002abdu'], '‘Abdu’l-Bahá, The Promulgation of Universal Peace: Discourses by ‘Abdu’l-Bahá during his visit to the United States in 1912, 2 vols. (Chicago: Bahá’í Publishing Society, 1921–25)',
               'The public talks of ‘Abdu’l-Bahá on his tour of the United States and Canada in 1912: the oneness of humankind, the harmony of science and religion, equality of women and men, the unity of the prophets. Transcribed by stenographers in 1912, so the English is not always his exact wording. ' + OLD,
               labels=['Volume 1', 'Volume 2'],
               lib=('The Promulgation of Universal Peace (‘Abdu’l-Bahá, talks of 1912; ed. 1921–25), 2 volumes', 'mo', 'talks of 1912 CE', 'mod', 'Bahá’í, Theosophy')),
    'x-bta': G('TabletsOfAbdulBahaAbbas', '‘Abdu’l-Bahá, Tablets of Abdul-Baha Abbas (Chicago: Bahá’í Publishing Society, 1909–16)',
               'Letters (tablets) of ‘Abdu’l-Bahá to Bahá’ís and inquirers in the West, in the translations of the Bahá’í Publishing Society, in three volumes: on prayer, the teachings, the Covenant and the work of the first Western Bahá’ís. ' + OLD,
               lib=('Tablets of ‘Abdu’l-Bahá Abbas (1909–16)', 'mo', 'tablets of 1900–16 CE', 'mod', 'Bahá’í, Theosophy')),
    'x-btn': G('TravellersNarrativeVol.2', '‘Abdu’l-Bahá, A Traveller’s Narrative Written to Illustrate the Episode of the Báb, edited, translated and annotated by Edward G. Browne, vol. 2: English translation and notes (Cambridge: Cambridge University Press, 1891)',
               'The first Bahá’í account of the life and martyrdom of the Báb, the forerunner of Bahá’u’lláh, and of the early Bábí movement, in Browne’s translation with his long notes. Written in 1886 from within the community; the main early source in English. ' + OLD,
               lib=('A Traveller’s Narrative: the episode of the Báb (‘Abdu’l-Bahá, trans. Browne, 1891)', 'mo', 'written 1886 CE', 'mod', 'Bahá’í, Theosophy')),

    'e-gpm': G('guideforperplexe00maimiala', 'Moses Maimonides, The Guide for the Perplexed, translated from the original Arabic text by M. Friedländer, second edition, revised throughout (London: Routledge, 1919; first edition 1904)',
               'The greatest book of medieval Jewish philosophy, written about 1190 in Arabic for a student troubled by the clash of Torah and reason: the meaning of the divine names, the proofs of God’s existence and unity, why God cannot be described except by what he is not, creation, prophecy, providence and the reasons for the commandments. ' + OLD,
               lib=('The Guide for the Perplexed (Maimonides, trans. Friedländer, 1904)', 'ju', 'c. 1190 CE', 'ju', 'Kabbalah and the Zohar')),
}
