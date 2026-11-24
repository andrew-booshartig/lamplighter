"""Builds POST1930_WANTED.csv and POST1930_WANTED.md in the project root: the books the Library cannot hold because they were first published after 1930 (the United States
public domain starts, in 2026, with works first published in 1930) or are otherwise unavailable to it, with the most useful legitimate way to read each one.

Sources: the Atlas's text records that the Library does not hold (TEXT_GAPS.csv, written by tools/audit_texts.py), their traditions (COVERAGE_BY_TRADITION.csv, written by
tools/assess_coverage.py), and EXTRA below (books about the traditions with restricted rites and the new movements; later translations of the ancient and sacred texts the Library holds
only in older translations; critical and investigative books about the movements the Library holds the founders' own books of). Written 17 November 2026 on the maker's words
"build a list of all the post 1930 books we cant get" and "the people need all the information available to decide for themselves".

Nothing in copyright is fetched or copied. Publishers and years are given as known; a blank publisher means it was not checked. The status 'candidate for public domain by non-renewal' means
only that the book was (as far as is known) first published in the United States between 1931 and 1963 and that nobody has yet looked for a renewal in the Copyright Office's records;
looking is a fetch (the Copyright Office's catalogue of renewals, or the Stanford Copyright Renewal Database), and is asked about first.

Run: python3 -I tools/post1930_wanted.py   (from lamplighter/). Re-run after TEXT_GAPS.csv or COVERAGE_BY_TRADITION.csv changes.
"""
import csv, re, sys, unicodedata, pathlib, collections

ROOT = pathlib.Path(__file__).resolve().parents[2]
CATS = {'scr': 'scripture', 'hym': 'liturgy', 'rit': 'liturgy', 'law': 'catechism', 'myth': 'scripture', 'wis': 'scripture', 'com': 'scholarly study', 'his': 'history',
        'eth': 'ethnography', 'phi': 'scholarly study', 'mys': 'scripture', 'dev': 'scripture', 'ora': 'scripture', 'div': 'liturgy'}
IC, CAND, OPEN, RESTR = 'in copyright', 'candidate for public domain by non-renewal', 'openly licensed', 'restricted by the community'

# id -> (author, first publication year if not the record's year, publisher, status or '', kind or '', route, note)   ('' keeps the default)
LIB = 'a library copy (WorldCat, interlibrary loan) or the Internet Archive’s lending library'
BAHAI = 'free to read in the Bahá’í Reference Library (bahai.org/library); the Bahá’í International Community’s terms allow copying only without any change to the text'
INFO = {
 'kashif-al-ilbas-ibrahim-niasse': ('Ibrahim Niasse', '', '', '', '', 'the Arabic edition through the Tijani community and Arabic libraries; a published English study by Zachary Wright', 'Written 1931–33 at Kaolack, Senegal.'),
 'khmer-tripitaka': ('Buddhist Institute (Phnom Penh), eds.', '1931', 'Buddhist Institute, Phnom Penh', '', '', 'the Buddhist Institute (Phnom Penh) and the Pali Text Society for the Pali; Khmer editions through the Institute', 'The Khmer-script Pali canon, printed 1931–69; the Pali text is also in the Thai and Burmese editions the Library does not hold.'),
 'black-elk-speaks': ('John G. Neihardt, from the words of Black Elk', '', 'William Morrow & Co., New York', IC, '', LIB + '; the University of Nebraska Press edition', 'A Lakota holy man’s life as told to Neihardt in 1931; the Lakota have said that Neihardt shaped it.'),
 'church-dogmatics-karl-barth': ('Karl Barth', '1932', 'Evangelischer Verlag, Zollikon-Zürich (English: T. & T. Clark, Edinburgh, 1936–77)', IC, '', LIB + '; Hendrickson and T&T Clark editions', ''),
 'dievturu-cerokslis-dievturi-catechism': ('Ernests Brastiņš', '', '', IC, '', 'Latvian libraries and the Dievturi community (Latvijas Dievturu sadraudze)', 'Latvian pagan revival.'),
 'livets-bog-the-book-of-life-martinus': ('Martinus (Martinus Thomsen)', '1932', 'Borgens Forlag, Copenhagen (English: The Book of Life, Borgens)', IC, '', 'the Martinus Institute (martinus.dk), which publishes the Danish originals and English translations, some free online', 'Seven volumes.'),
 'sasangka-jati-pangestu': ('Pangestu (Soenarto Mertowardojo)', '', '', IC, '', 'Pangestu’s own publications and Indonesian libraries', 'Javanese; the text is held by the Pangestu community.'),
 'seimei-no-jisso-the-truth-of-life': ('Taniguchi Masaharu', '', 'Seichō-no-Ie, Tokyo', IC, '', 'Seichō-no-Ie’s own publishing house (Nippon Kyobunsha) and its English editions', ''),
 'teachings-of-johane-masowe': ('Johane Masowe (Baranzi Masedza)', '', '', IC, '', 'ethnographic recordings (Jules-Rosette, Dillon-Malone) in university libraries; the community’s own services', 'Oral teaching; no authorised text.'),
 'the-dawn-breakers-nabil-i-a-zam': ('Nabíl-i-A‘ẓam, translated by Shoghi Effendi', '', 'Bahá’í Publishing Committee, New York', IC, '', BAHAI, 'The Bahá’í Faith’s history of the Báb’s time; the Library holds Browne’s and ‘Abdu’l-Bahá’s earlier accounts.'),
 'towards-understanding-islam-mawdudi': ('Abul A‘la Mawdudi', '', 'Islamic Publications, Lahore (English: the Islamic Foundation, Leicester)', IC, '', 'free from the Jamaat-e-Islami and Mawdudi’s own sites (maududi.org) and the Islamic Foundation', ''),
 'writings-of-buddhadasa-bhikkhu': ('Buddhadasa Bhikkhu', '', 'Suan Mokkh, Surat Thani', IC, '', 'free from Suan Mokkh (suanmokkh.org) and Access to Insight, which hold many of his English books', ''),
 'afrikaans-bible': ('Bible Society of South Africa', '1933', 'Bybelgenootskap van Suid-Afrika', IC, '', 'the Bible Society (bybelgenootskap.co.za) and the 1953 translation’s online editions', 'The first complete Afrikaans Bible (1933); the 1953 revision is the one in common use.'),
 'humanist-manifesto': ('Raymond B. Bragg and 33 co-signers', '', 'The New Humanist (Chicago)', CAND, '', 'the American Humanist Association (americanhumanist.org), which publishes the text', 'Published 1933 in The New Humanist and The Humanist.'),
 'barmen-declaration': ('Karl Barth, Hans Asmussen and Thomas Breit (drafters)', '', 'Synod of the Confessing Church, Barmen', IC, '', 'the German original and several English translations on church websites (Presbyterian Church (USA)’s Book of Confessions, the ELCA)', 'Adopted 31 May 1934.'),
 'diary-of-st-faustina-divine-mercy': ('Faustina Kowalska', '1981', 'Marian Press (English, 1987)', IC, '', 'the Marian Helpers (marian.org) and the Sisters of Our Lady of Mercy; the text is under translation licence', 'Written 1934–38 and first printed in Polish in 1981.'),
 'holy-book-of-odu-and-liturgy-of-the-church-of-ifa': ('Church of Orunmila (Ijo Orunmila Adulawo)', '', '', IC, '', 'the church’s own publications', ''),
 'judaism-as-a-civilization-mordecai-kaplan': ('Mordecai M. Kaplan', '', 'Macmillan, New York', IC, '', LIB + '; the Jewish Publication Society reprint (2010)', ''),
 'unveiled-mysteries-godfre-ray-king': ('Godfré Ray King (Guy W. Ballard)', '', 'Saint Germain Press, Chicago', IC, '', 'the Saint Germain Press (saintgermainfoundation.org) and library copies', 'Founding book of the “I AM” Activity.'),
 'coral-gardens-and-their-magic-bronis-aw-malinowski': ('Bronisław Malinowski', '', 'George Allen & Unwin, London (2 vols.)', IC, '', LIB, 'Trobriand gardening magic and its spells; the Library holds Malinowski’s Argonauts (1922) in its field-records shelf.'),
 'gleanings-from-the-writings-of-baha-u-llah': ('Bahá’u’lláh, translated by Shoghi Effendi', '', 'Bahá’í Publishing Committee, New York', IC, '', BAHAI, ''),
 'kanro-no-hou-nectar-rain-sutra': ('Taniguchi Masaharu', '', 'Seichō-no-Ie, Tokyo', IC, '', 'Seichō-no-Ie’s publishing house; a recitation sutra, so it can be had at a Seichō-no-Ie centre', ''),
 'mules-and-men-zora-neale-hurston': ('Zora Neale Hurston', '', 'J. B. Lippincott, Philadelphia', IC, '', LIB + '; HarperCollins edition', 'Folklore and hoodoo in Florida and Louisiana; first published 1935.'),
 'tadhkirah-revelations-of-mirza-ghulam-ahmad': ('Mirza Ghulam Ahmad (compiled by his followers)', '1935', 'Ahmadiyya Anjuman, Qadian', IC, '', 'free from the Ahmadiyya Muslim Community (alislam.org), which publishes it in English', 'The Ahmadiyya (Qadiani) community.'),
 'teachings-of-okada-mokichi': ('Okada Mokichi (Meishu-sama)', '', '', IC, '', 'Sekai Kyūseikyō / Church of World Messianity (the movement’s own press)', ''),
 'the-promised-key-leonard-howell': ('Leonard Howell (as G. G. Maragh)', '', '', IC, '', 'archives of Jamaica (National Library of Jamaica); academic studies of the early Rastafari', 'A pamphlet, c. 1935; early Rastafari scripture.'),
 'kinh-thien-ao-va-the-ao-prayer-book': ('Cao Đài Tòa Thánh Tây Ninh', '', '', IC, '', 'the Caodai Holy See, Tây Ninh; English and French editions through caodai.net', ''),
 'prophecies-of-john-frum': ('(oral)', '', '', IC, '', 'ethnographies of Tanna (Lindstrom; Guiart), in libraries', 'An oral movement in Vanuatu.'),
 'discourses-of-kanji-swami-on-the-samayasara': ('Kanji Swami', '', 'Shri Kundkund-Kahan Digambar Jain Mumukshu Mandal, Songadh', IC, '', 'the Kanji Panth’s own publications; Jain eLibrary (jainelibrary.org)', ''),
 'kokutai-no-hongi': ('Ministry of Education, Japan', '', 'Monbushō, Tokyo (English: Cardinal Principles of the National Entity of Japan, Harvard University Press, 1949)', IC, '', LIB + '; Japanese text through the National Diet Library', 'The 1937 state ideology text; the English translation is of 1949.'),
 'the-cost-of-discipleship-dietrich-bonhoeffer': ('Dietrich Bonhoeffer', '', 'Chr. Kaiser Verlag, Munich (English: SCM Press, 1948)', IC, '', LIB, 'Nachfolge, 1937.'),
 'the-golden-dawn-israel-regardie': ('Israel Regardie', '', 'Aries Press, Chicago (4 vols., 1937–40); Llewellyn, 1969', IC, '', LIB + '; the Llewellyn edition', 'The first print of the Golden Dawn’s rituals; its original manuscripts are in the Library only through Mathers’s Kabbalah Unveiled.'),
 'discourses-meher-baba': ('Meher Baba', '', 'Sufism Reoriented, Walnut Creek (5th ed.)', IC, '', 'free to read at the Avatar Meher Baba Trust’s online library (ambppct.org)', ''),
 'facing-mount-kenya-jomo-kenyatta': ('Jomo Kenyatta', '', 'Secker & Warburg, London', IC, '', LIB, 'A Kikuyu insider’s ethnography of 1938.'),
 'tell-my-horse-zora-neale-hurston': ('Zora Neale Hurston', '', 'J. B. Lippincott, Philadelphia', IC, '', LIB + '; HarperCollins edition', 'Her fieldwork in Haiti and Jamaica.'),
 'dejiao-spirit-written-scriptures': ('Dejiao (Teaching of Virtue) spirit-writing halls', '', '', IC, '', 'the Dejiao halls in Taiwan; academic studies', ''),
 'pasugo-god-s-message': ('Iglesia ni Cristo (Felix Manalo)', '', 'Iglesia ni Cristo, Manila', IC, '', 'free at the church’s own site (iglesianicristo.net)', 'The church’s monthly, from 1939.'),
 'sam-giang-thi-van-huynh-phu-so': ('Huỳnh Phú Sổ', '', '', IC, '', 'the Hòa Hảo Buddhist Church’s own publications', ''),
 'the-life-divine-sri-aurobindo': ('Sri Aurobindo', '', 'Sri Aurobindo Ashram, Pondicherry (first in the monthly Arya, 1914–19)', IC, '', 'free from the Sri Aurobindo Ashram’s online archive (sriaurobindoashram.org)', 'The serial form of 1914–19 is a candidate for the Library as a pre-1931 text; the book form is 1939–40.'),
 'nyabinghi-chants': ('(oral)', '', '', IC, '', 'archival recordings (Smithsonian Folkways) and ethnographies of Rastafari', ''),
 'prayers-and-novenas-to-santa-muerte': ('(popular devotion)', '', '', IC, '', 'devotional pamphlets of the Santa Muerte cult; ethnographies (Chesnut, Holy Death, 2012)', ''),
 'proceedings-of-the-first-umbanda-spiritist-congress': ('Federação Espírita de Umbanda', '', '', IC, '', 'Brazilian libraries and the Umbanda federations', '1941.'),
 'tafhim-al-quran-mawdudi': ('Abul A‘la Mawdudi', '', 'Idara Tarjuman-ul-Quran, Lahore (English: The Meaning of the Qur’an, 1967–88)', IC, '', 'free from maududi.org and the Islamic Foundation', ''),
 'teachings-of-elijah-masinde': ('Elijah Masinde', '', '', IC, '', 'ethnographies (Wipper, Rivals for Power, 1977)', ''),
 'god-passes-by-shoghi-effendi': ('Shoghi Effendi', '', 'Bahá’í Publishing Committee, Wilmette', IC, '', BAHAI, ''),
 'halakhic-man-joseph-b-soloveitchik': ('Joseph B. Soloveitchik', '1944', 'Talpiot, New York (English: Jewish Publication Society, 1983)', IC, '', LIB, 'Ish ha-Halakhah.'),
 'nosso-lar-chico-xavier': ('Chico Xavier (received from the spirit André Luiz)', '', 'Federação Espírita Brasileira, Rio de Janeiro', IC, '', 'free from the Federação Espírita Brasileira (febnet.org.br)', ''),
 'the-akan-doctrine-of-god-j-b-danquah': ('J. B. Danquah', '', 'Lutterworth Press, London', IC, '', LIB, 'Rattray’s Ashanti (1923) is in the Library.'),
 'psalms-of-daniel-pereira-de-mattos': ('Daniel Pereira de Mattos', '', '', IC, '', 'the Barquinha community (Rio Branco, Acre) and ethnographies of the Santo Daime family', ''),
 'teachings-of-mai-chaza-guta-rajehovah': ('Mai Chaza (Mai Chaza’s Guta raJehovah)', '', '', IC, '', 'ethnographies of the church in Zimbabwe (Bourdillon; Mwenda), in libraries', 'An oral and written teaching of the Guta ra Jehova, founded about 1952.'),
 'teachings-of-yali': ('Yali Singina', '', '', IC, '', 'ethnographies of the Cargo movements (Lawrence, Road Belong Cargo, 1964)', ''),
 'autobiography-of-a-yogi-paramahansa-yogananda': ('Paramahansa Yogananda', '', 'Philosophical Library, New York', IC, 'autobiography', 'Self-Realization Fellowship (yogananda.org), which publishes the text and offers it in many languages', ''),
 'teachings-of-paliau-maloat': ('Paliau Maloat', '', '', IC, '', 'ethnographies (Schwartz, Paliau Movement, 1962)', ''),
 'voodoo-in-new-orleans-robert-tallant': ('Robert Tallant', '', 'Macmillan, New York', IC, '', LIB + '; the Pelican Publishing edition', 'An outsider’s account of Marie Laveau’s city; the Library holds Hearn and Puckett.'),
 '21-precepts-of-pl-kyodan': ('Perfect Liberty Kyōdan', '', '', IC, '', 'the PL Kyōdan’s own site and literature', ''),
 'celestial-church-hymnal': ('Celestial Church of Christ', '', '', IC, '', 'the church’s parishes; Yoruba and Gun hymnals', ''),
 'do-kamo-maurice-leenhardt': ('Maurice Leenhardt', '', 'Gallimard, Paris (English: University of Chicago Press, 1979)', IC, '', LIB, 'The Kanak notion of the person; a missionary-ethnologist.'),
 'conversations-with-ogotemmeli-dieu-d-eau-marcel-griaule': ('Marcel Griaule', '', 'Éditions du Chêne, Paris (English: Oxford University Press, 1965)', IC, '', LIB, 'Dogon cosmology as told by the hunter Ogotemmêli; its reading by outsiders has been challenged.'),
 'godian-doctrine-k-o-k-onyioha': ('K. O. K. Onyioha', '', '', IC, '', 'the Godian movement, Nigeria; Nigerian libraries', ''),
 'book-of-shadows': ('Gerald B. Gardner and the Bricket Wood coven (with Doreen Valiente)', '', '', RESTR, 'liturgy', 'initiation into a Gardnerian coven; published versions are in Valiente’s and the Farrars’ books and on sacred-texts.com (not authorised by the covens)', 'An oath-bound text; versions have been published since the 1960s and differ.'),
 'in-search-of-the-miraculous-p-d-ouspensky': ('P. D. Ouspensky', '', 'Harcourt, Brace & World, New York', IC, '', LIB, 'Posthumous (Ouspensky d. 1947).'),
 'beelzebub-s-tales-to-his-grandson-g-i-gurdjieff': ('G. I. Gurdjieff', '', 'Harcourt, Brace, New York (English, 1950)', IC, '', LIB, 'Written 1924–35 in Russian and Armenian.'),
 'book-of-veles': ('(forgery, ascribed to Yuri Mirolyubov)', '', '', IC, '', 'the Russian text is online; scholars treat it as a mid-twentieth-century forgery', 'Kept on the Atlas as a disputed text of the Slavic Native Faith.'),
 'dianetics-the-modern-science-of-mental-health': ('L. Ron Hubbard', '', 'Hermitage House, New York', IC, '', 'public libraries hold copies; Bridge Publications and the Church of Scientology’s bookstores sell it', 'No open or free edition exists; the church enforces its copyright.'),
 'new-world-translation': ('Watch Tower Bible and Tract Society (translation committee)', '', 'Watch Tower Bible and Tract Society, Brooklyn', IC, 'scripture', 'free to read at the Jehovah’s Witnesses’ own site (jw.org, the Watchtower Online Library)', ''),
 'savitri-sri-aurobindo': ('Sri Aurobindo', '', 'Sri Aurobindo Ashram, Pondicherry', IC, '', 'free from the Sri Aurobindo Ashram’s online archive (sriaurobindoashram.org)', ''),
 'sikh-rehat-maryada': ('Shiromani Gurdwara Parbandhak Committee', '', 'SGPC, Amritsar', IC, '', 'free at sgpc.net', 'The code of the Sikh conduct.'),
 'essai-sur-la-religion-bambara-germaine-dieterlen': ('Germaine Dieterlen', '', 'Presses Universitaires de France, Paris', IC, '', LIB, ''),
 'in-the-shade-of-the-quran-sayyid-qutb': ('Sayyid Qutb', '', 'Dar al-Shuruq, Cairo (English: The Islamic Foundation, 2000–09)', IC, '', LIB + '; the Islamic Foundation’s English edition', 'Fī Ẓilāl al-Qur’ān.'),
 'sakar-murlis': ('Brahma Kumaris', '', '', IC, '', 'free to read at the movement’s own site (brahmakumaris.org)', ''),
 'the-sabbath-abraham-joshua-heschel': ('Abraham Joshua Heschel', '', 'Farrar, Straus and Young, New York', IC, '', LIB, ''),
 'mere-christianity-c-s-lewis': ('C. S. Lewis', '1952', 'Geoffrey Bles, London (from his broadcast talks of 1942–44)', IC, '', LIB, ''),
 'susila-budhi-dharma-muhammad-subuh': ('Muhammad Subuh Sumohadiwidjojo (Bapak)', '', '', IC, '', 'Subud’s own publisher (Subud Publications International)', ''),
 'autobiography-of-xuyun': ('Xuyun (Empty Cloud)', '', '', IC, '', LIB + '; the English translation by Charles Luk (Element, 1988)', ''),
 'divine-horsemen-maya-deren': ('Maya Deren', '', 'Thames & Hudson, London and New York', IC, '', LIB, 'Her Haitian fieldwork and a film.'),
 'humbowo-hutsva-hwavapostori-new-revelation-of-the-apostles': ('Johane Maranke', '', '', IC, '', 'the Apostolic Church of Johane Maranke’s own publications', ''),
 'lumpa-hymns-of-alice-lenshina': ('Alice Lenshina', '', '', IC, '', 'ethnographies (Roberts, Lumpa Church, 1970)', ''),
 'sathya-sai-speaks-and-the-vahinis': ('Sathya Sai Baba', '', 'Sri Sathya Sai Books and Publications Trust, Prasanthi Nilayam', IC, '', 'free to read at the movement’s own site (sathyasai.org)', ''),
 'the-sacred-pipe-black-elk-and-joseph-epes-brown': ('Black Elk and Joseph Epes Brown', '', 'University of Oklahoma Press, Norman', IC, '', LIB + '; the University of Oklahoma Press edition', 'Seven Lakota rites as told in 1947–48; critics say it reflects Brown’s and Black Elk’s Catholic view.'),
 'el-monte-lydia-cabrera': ('Lydia Cabrera', '', 'Ediciones C. R., Havana', IC, '', LIB, 'The herbs and spirits of Afro-Cuban religion.'),
 'ma-arif-al-quran-mufti-muhammad-shafi': ('Mufti Muhammad Shafi', '', 'Idarat al-Ma‘arif, Karachi', IC, '', 'free from the Deobandi publishers (ilmgate.org and others)', ''),
 'sixth-council-tipitaka': ('Sixth Buddhist Council (Chaṭṭha Saṅgāyana)', '', 'Buddha Sasana Council, Yangon', IC, '', 'free at tipitaka.org (Vipassana Research Institute) and the Chaṭṭha Saṅgāyana Tipiṭaka digital edition', 'The Burmese-script Pali canon in its 1954–56 recension.'),
 'tafsir-al-mizan-tabataba-i': ('Allameh Muhammad Husayn Tabataba’i', '', 'Dar al-Kutub al-Islamiyya, Tehran', IC, '', 'partial English translation through the Islamic Seminary Publications and al-Islam.org', ''),
 'the-voice-of-venus-ernest-norman': ('Ernest L. Norman', '', 'Unarius, El Cajon', IC, '', 'Unarius Academy (unarius.org) and library copies', ''),
 'witchcraft-today-gerald-gardner': ('Gerald B. Gardner', '', 'Rider & Co., London', IC, '', LIB + '; Citadel Press reprint', 'The book that announced Wicca.'),
 'god-in-search-of-man-heschel': ('Abraham Joshua Heschel', '', 'Farrar, Straus and Cudahy, New York', IC, '', LIB, ''),
 'god-speaks-meher-baba': ('Meher Baba', '', 'Dodd, Mead & Co., New York', IC, '', 'free to read at the Avatar Meher Baba Trust’s online library (ambppct.org)', ''),
 'the-urantia-book': ('(unattributed; Urantia Foundation)', '', 'Urantia Foundation, Chicago', IC, '', 'free to read at urantia.org and urantiabook.org; the book’s US copyright has been litigated (the Foundation’s claim was held valid, then not), so its legal status is not settled here', ''),
 'chants-of-maria-sabina': ('María Sabina', '', '', IC, '', 'Álvaro Estrada, Vida de María Sabina (1977); the 1957 Wasson recordings (Smithsonian Folkways, Mushroom Ceremony of the Mazatec)', 'Her chants were recorded by outsiders from 1956; she later said that the exposure had harmed her community.'),
 'everlasting-gospel-sermons-of-olumba-olumba-obu': ('Olumba Olumba Obu', '', '', IC, '', 'the Brotherhood of the Cross and Star (its own press)', ''),
 'nuer-religion-e-e-evans-pritchard': ('E. E. Evans-Pritchard', '', 'Clarendon Press, Oxford', IC, '', LIB, 'The Library holds his master Rattray and Seligman; this is the landmark study of Nuer belief.'),
 'scientology-the-fundamentals-of-thought': ('L. Ron Hubbard', '', 'Hubbard Association of Scientologists International, London', IC, '', 'the Church of Scientology’s own site and bookstores; no open edition', ''),
 'anago-vocabulario-lucumi-lydia-cabrera': ('Lydia Cabrera', '', 'Ediciones C. R., Havana', IC, '', LIB, ''),
 'avtar-bani': ('Avtar Singh (Baba Avtar Singh)', '', '', IC, '', 'the Sant Nirankari Mission’s own site (nirankari.org)', ''),
 'notes-sur-le-culte-des-orisa-et-vodun-pierre-verger': ('Pierre Verger', '', 'Institut français d’Afrique noire, Dakar', IC, '', LIB, 'Sacred cults of the Yoruba and Fon countries, and Bahia.'),
 'the-buddha-and-his-dhamma-b-r-ambedkar': ('B. R. Ambedkar', '', 'Siddharth College Publications, Bombay', IC, '', 'free from the Government of Maharashtra’s edition of his Writings and Speeches (vol. 11) and ambedkar.org', ''),
 'the-charge-of-the-goddess-doreen-valiente': ('Doreen Valiente', '', '', IC, '', 'Valiente’s Witchcraft for Tomorrow (1978) and her other books, in libraries', 'Written c. 1957 for Gardner; the text is also quoted widely.'),
 'the-normal-christian-life-watchman-nee': ('Watchman Nee', '', '', IC, '', LIB + '; the Living Stream Ministry (ministrybooks.org) offers Nee’s works', ''),
 'la-sociedad-secreta-abakua-lydia-cabrera': ('Lydia Cabrera', '', 'Ediciones C. R., Havana', RESTR, '', 'the Abakuá do not publish their secrets; this book is the outsider’s account, in libraries', 'An all-male secret society of Cuba; its members hold the rites secret.'),
 'o-candomble-da-bahia-roger-bastide': ('Roger Bastide', '', 'Mouton, Paris (as Le Candomblé de Bahia)', IC, '', LIB + '; the Portuguese edition', ''),
 'pearls-of-wisdom': ('Summit Lighthouse (Church Universal and Triumphant)', '', 'The Summit Lighthouse', RESTR, '', 'the Summit Lighthouse’s own site (summitlighthouse.org) and student libraries', 'Weekly letters from the Ascended Masters, taken down by successive messengers since 1958.'),
 'the-twelve-blessings': ('George King (Aetherius Society)', '', '', IC, '', 'the Aetherius Society’s own site (aetherius.org)', ''),
 'goseigen-holy-words': ('Okada Kōtama', '', 'Sūkyō Mahikari, Tokyo', RESTR, '', 'the movement’s own centres; members only', ''),
 'teachings-of-tia-neiva': ('Tia Neiva', '', '', IC, '', 'the Vale do Amanhecer’s own literature; ethnographies', ''),
 'what-the-buddha-taught-walpola-rahula': ('Walpola Rahula', '', 'Gordon Fraser, Bedford (Grove Press, 1974)', IC, '', LIB, ''),
 'norigotoshu-prayer-book': ('Sūkyō Mahikari', '', '', RESTR, '', 'the movement’s own centres', ''),
 'prince-philip-prophecies': ('(oral; Yaohnanen people of Tanna)', '', '', IC, '', 'ethnographies (Baker, 1998; Kahn)', ''),
 'teachings-of-ajahn-chah': ('Ajahn Chah', '', '', IC, '', 'free from Wat Pah Nanachat and Amaravati (forestsangha.org; ajahnchah.org); translated talks are free', ''),
 'divinity-and-experience-godfrey-lienhardt': ('Godfrey Lienhardt', '', 'Clarendon Press, Oxford', IC, '', LIB, 'Dinka religion.'),
 'koumen-hampate-ba-and-dieterlen': ('Amadou Hampâté Bâ and Germaine Dieterlen', '', 'Mouton, Paris', IC, '', LIB, ''),
 'story-of-the-hoasca': ('Mestre Gabriel (José Gabriel da Costa)', '', '', IC, '', 'the União do Vegetal’s own literature; ethnographies (Labate)', ''),
 'stranger-in-a-strange-land-robert-a-heinlein': ('Robert A. Heinlein', '', 'G. P. Putnam’s Sons, New York', IC, '', LIB, 'A novel, adopted by the Church of All Worlds.'),
 'ananda-sutram-p-r-sarkar': ('Prabhat Ranjan Sarkar (Shrii Shrii Anandamurti)', '', 'Ananda Marga Publications, Calcutta', IC, '', 'Ananda Marga’s own publishing house (anandamarga.org)', ''),
 'documents-of-the-second-vatican-council': ('Second Vatican Council', '', 'Libreria Editrice Vaticana', IC, '', 'free at vatican.va; the English translations belong to translators and conferences', ''),
 'olodumare-god-in-yoruba-belief-e-bolaji-idowu': ('E. Bolaji Idowu', '', 'Longmans, London', IC, '', LIB, ''),
 'srimad-bhagavatam-with-commentary-prabhupada': ('A. C. Bhaktivedanta Swami Prabhupada', '', 'Bhaktivedanta Book Trust, New York', IC, '', 'free to read at vedabase.io (the Bhaktivedanta Book Trust’s site)', ''),
 'won-buddhist-scriptures-wonbulgyo-gyojeon': ('Sotaesan and Chongsan', '', 'Won Buddhism, Iksan', IC, '', 'free at the movement’s site (wonbuddhism.org)', ''),
 'book-of-the-hopi-frank-waters': ('Frank Waters (with Oswald White Bear Fredericks)', '', 'Viking Press, New York', IC, '', LIB, 'Hopi elders told Waters in the 1960s; some Hopi leaders have questioned what was printed.'),
 'burhan-al-haqq-nur-ali-elahi': ('Nur Ali Elahi', '', '', IC, '', 'the Ahl-e Haqq community’s own publications; academic studies (van Bruinessen, Hamzeh‘ee)', ''),
 'legio-maria-latin-mass-and-luo-hymns': ('Legio Maria of African Church Mission', '', '', IC, '', 'ethnographies (Ogot; Ndege)', ''),
 'principia-discordia': ('Malaclypse the Younger (Gregory Hill) and Omar Khayyam Ravenhurst (Kerry Thornley)', '1963', 'Pocket Press (first edition, 1963); Loompanics (1979)', OPEN, '', 'free: the book carries a copyleft notice (“All Rights Reversed. Reprint what you like”) and is online (discordia.org; principiadiscordia.com); the Library can hold it once an edition is chosen', ''),
 'science-of-being-and-art-of-living-maharishi': ('Maharishi Mahesh Yogi', '', 'International SRM Publications, London', IC, '', LIB, ''),
 'teachings-of-the-coconut-monk': ('Nguyễn Thành Nam (the Coconut Monk)', '', '', IC, '', 'ethnographies and biographies', ''),
 'indaba-my-children-credo-mutwa': ('Credo Mutwa', '', 'Blue Crane Books, Johannesburg (Kahn & Averill, London, 1964)', IC, '', LIB, 'Not accepted by all Zulu scholars as tradition.'),
 'milestones-sayyid-qutb': ('Sayyid Qutb', '', 'Dar al-Shuruq, Cairo (Ma‘ālim fī al-Ṭarīq, 1964)', IC, '', LIB + '; many online editions of unclear rights', ''),
 'supreme-mathematics-and-supreme-alphabet': ('Clarence 13X (Allah) and the Five-Percent Nation', '', '', IC, '', 'the Nation of Gods and Earths’ own publications and websites', ''),
 'teachings-of-koriam-urekit': ('Koriam Urekit', '', '', IC, '', 'ethnographies of the Pomio Kivung (Whitehouse, Inside the Cult, 1995)', ''),
 'message-to-the-blackman-in-america-elijah-muhammad': ('Elijah Muhammad', '', 'Muhammad’s Temple No. 2, Chicago', IC, '', LIB + '; the Nation of Islam’s own bookstore', ''),
 'the-autobiography-of-malcolm-x': ('Malcolm X and Alex Haley', '', 'Grove Press, New York', IC, 'autobiography', LIB, ''),
 'the-human-revolution-daisaku-ikeda': ('Daisaku Ikeda', '', 'Seikyo Press, Tokyo (English: John Weatherhill, 1972–)', IC, 'autobiography', 'free from the Soka Gakkai International (sgi.org; the SGI-USA site)', 'A novelised history of the Soka Gakkai.'),
 'the-pale-fox-le-renard-pale-griaule-and-dieterlen': ('Marcel Griaule and Germaine Dieterlen', '', 'Institut d’ethnologie, Paris', IC, '', LIB, ''),
 'exposition-of-the-divine-principle': ('Sun Myung Moon (Divine Principle)', '', 'HSA-UWC, New York', IC, '', 'free from the Family Federation (familyfed.org)', ''),
 'writings-of-sangharakshita': ('Sangharakshita', '', '', IC, '', 'the Triratna Buddhist Community’s own publisher (Windhorse) and Free Buddhist Audio', ''),
 'amazonian-cosmos-reichel-dolmatoff': ('Gerardo Reichel-Dolmatoff', '1968', 'Universidad de los Andes, Bogotá (English: University of Chicago Press, 1971)', IC, '', LIB, ''),
 'bhagavad-gita-as-it-is-prabhupada': ('A. C. Bhaktivedanta Swami Prabhupada', '', 'Macmillan, New York (full edition, 1972)', IC, '', 'free to read at vedabase.io', ''),
 'black-theology-and-black-power-james-cone': ('James H. Cone', '', 'Seabury Press, New York', IC, '', LIB + '; the Orbis Books edition', ''),
 'ifa-divination-communication-between-gods-and-men-william-ba': ('William R. Bascom', '', 'Indiana University Press, Bloomington', IC, '', LIB, ''),
 'kaidara-amadou-hampate-ba': ('Amadou Hampâté Bâ', '', 'Julliard, Paris (Classiques africains)', IC, '', LIB, ''),
 'n-kongo-ye-nza-fu-kiau-bunseki': ('K. Kia Bunseki Fu-Kiau', '', 'Office national de la recherche et du développement, Kinshasa', IC, '', LIB, ''),
 'roman-missal-of-paul-vi': ('Catholic Church (Paul VI)', '', 'Typis Polyglottis Vaticanis (Missale Romanum, 1969–70)', IC, 'liturgy', 'the Latin text and ICEL’s English translations at vatican.va and the Catholic conferences', ''),
 'the-satanic-bible': ('Anton Szandor LaVey', '', 'Avon Books, New York', IC, '', LIB + '; the Church of Satan’s own site (churchofsatan.com)', ''),
 'hoodoo-conjuration-witchcraft-rootwork-harry-middleton-hyatt': ('Harry Middleton Hyatt', '', 'Western Publishing Co., Hannibal, Missouri (5 vols., 1970–78)', IC, '', LIB + '; the Hyatt Foundation, Hannibal', 'The great collection of hoodoo practice, made from 1936 to 1940 from 1,600 informants.'),
 'mo-letters-david-berg': ('David Berg (Moses David)', '', 'Children of God / The Family International', IC, '', 'the movement’s own archives; the Library holds none of it', ''),
 'panaturan-kaharingan-scripture': ('Kaharingan (Dayak) priests', '', '', IC, '', 'Indonesian libraries and academic studies (Schiller; Hudson)', ''),
 'the-shariyat-ki-sugmad': ('Paul Twitchell (Eckankar)', '', 'Illuminated Way Press, Menlo Park', IC, '', 'Eckankar’s own site (eckankar.org)', ''),
 'zen-mind-beginner-s-mind-shunryu-suzuki': ('Shunryu Suzuki', '', 'Weatherhill, New York', IC, '', LIB, ''),
 'a-theology-of-liberation-gustavo-gutierrez': ('Gustavo Gutiérrez', '', 'CEP, Lima (English: Orbis Books, 1973)', IC, '', LIB, ''),
 'be-here-now-ram-dass': ('Ram Dass (Richard Alpert)', '', 'Lama Foundation, San Cristobal', IC, '', LIB + '; the Ram Dass Foundation’s edition', ''),
 'henshin-no-genri-kiriyama-seiyu': ('Kiriyama Seiyū', '', 'Agonshū, Tokyo', IC, '', 'Agonshū’s own publishing house', ''),
 'songs-of-central-australia-t-g-h-strehlow': ('T. G. H. Strehlow', '', 'Angus & Robertson, Sydney', RESTR, '', 'the Strehlow Research Centre (Alice Springs); the Arrernte (Aranda) custodians restrict parts of it, and the Centre does not publish the restricted songs', 'Songs of Central Australia is partly secret-sacred; an Arrernte book, not for public viewing.'),
 'discourses-of-osho-incl-the-book-of-secrets': ('Osho (Bhagwan Shree Rajneesh)', '', 'Rajneesh Foundation International; Osho International', IC, '', 'free to read at the Osho library (osho.com/library)', ''),
 'seth-speaks-jane-roberts': ('Jane Roberts', '', 'Prentice-Hall, Englewood Cliffs', IC, '', LIB, ''),
 'jeon-gyeong': ('Daesoon Jinrihoe', '', 'Daesoon Jinrihoe, Yeoju', IC, '', 'free at daesoon.org', ''),
 'lausanne-covenant': ('Lausanne Committee for World Evangelization', '', '', IC, '', 'free at lausanne.org', ''),
 'saman-suttam': ('Jinendra Varni (compiler)', '', 'Sarva Seva Sangh Prakashan, Varanasi', IC, '', 'free from Jain eLibrary (jainelibrary.org)', ''),
 'the-book-which-tells-the-truth-rael': ('Raël (Claude Vorilhon)', '', 'Éditions du Message, Paris', IC, '', 'free download from rael.org', ''),
 'gates-of-prayer': ('Central Conference of American Rabbis', '', 'CCAR, New York', IC, '', LIB + '; CCAR Press', 'The Reform prayer book of 1975.'),
 'sixteen-great-poems-of-ifa-wande-abimbola': ('Wande Abimbola', '', 'UNESCO, Paris', IC, '', LIB, ''),
 'the-book-of-coming-forth-by-night': ('Michael Aquino (Temple of Set)', '', '', IC, '', 'the Temple of Set’s site (xeper.org)', ''),
 'threefold-lotus-sutra-rissho-kosei-kai-edition': ('Bunnō Katō, Yoshirō Tamura and Kōjirō Miyasaka', '', 'Kosei Publishing, Tokyo (Weatherhill, 1975)', IC, '', 'free at the Risshō Kōsei Kai’s own site (rk-world.org)', 'The Library holds Kern’s and Soothill’s Lotus Sutras.'),
 'a-course-in-miracles': ('Helen Schucman and William Thetford', '', 'Foundation for Inner Peace, Tiburon, California', IC, '', 'free to read at acim.org; its US copyright was held invalid by a federal court in 2003, but the Foundation still claims it (this is not settled here)', ''),
 'when-god-was-a-woman-merlin-stone': ('Merlin Stone', '', 'Dial Press, New York', IC, '', LIB, ''),
 'reglas-de-congo-palo-monte-mayombe-lydia-cabrera': ('Lydia Cabrera', '', 'Ediciones C. R., Miami', RESTR, '', 'the Palo houses keep their rites secret; this book is the outsider’s account', ''),
 'the-spiral-dance-starhawk': ('Starhawk', '', 'Harper & Row, San Francisco', IC, '', LIB, ''),
 'scriptures-of-tiandi-jiao': ('Tiandi Jiao (Church of the Lord of Universe)', '', '', IC, '', 'the church’s own publications (Taiwan)', ''),
 'sixteen-cowries-william-bascom': ('William R. Bascom', '', 'Indiana University Press, Bloomington', IC, '', LIB, ''),
 'the-holy-book-of-women-s-mysteries-zsuzsanna-budapest': ('Zsuzsanna Budapest', '', 'Susan B. Anthony Coven No. 1, Los Angeles (Wingbow Press, 1989)', IC, '', LIB, ''),
 'teachings-of-osofo-okomfo-damuah': ('Osofo Okomfo Damuah', '', '', IC, '', 'the Afrikania Mission, Accra', ''),
 'konkokyo-kyoten': ('Konkōkyō', '', 'Konkōkyō Headquarters, Konko', IC, '', 'free at the Konkokyo site (konkokyo.or.jp)', ''),
 'rajneeshism-an-introduction': ('Rajneesh Foundation', '', 'Rajneesh Foundation International, Rajneeshpuram', IC, '', 'libraries; the Osho library', ''),
 'the-book-of-the-subgenius': ('Ivan Stang', '', 'McGraw-Hill, New York', IC, '', LIB, 'A parody religion that has become a real one.'),
 'judaism-beyond-god-sherwin-wine': ('Sherwin T. Wine', '', 'Society for Humanistic Judaism, Farmington Hills', IC, '', LIB, ''),
 'siddur-sim-shalom': ('Jules Harlow (ed.)', '', 'Rabbinical Assembly and United Synagogue, New York', IC, '', LIB + '; the publishers’ digital edition', ''),
 'uua-principles-and-purposes': ('Unitarian Universalist Association', '', 'UUA, Boston', IC, '', 'free at uua.org', 'The Seven Principles; revised in 2023.'),
 'letra-del-ano': ('Ifá priests (annual)', '', '', IC, '', 'published each January by the Ifá priesthood of Havana and Miami; the Library holds no copy', ''),
 'shoshinhogo': ('Okawa Ryuho (Happy Science)', '', 'Happy Science, Tokyo', IC, '', 'Happy Science’s own site (happy-science.org)', ''),
 'initiation-shoko-asahara': ('Shoko Asahara', '', 'Aum Shuppan, Tokyo', IC, '', 'libraries in Japan; the group’s successors (Aleph) restrict the older books', 'Aum Shinrikyō, the group behind the 1995 Tokyo sarin attack.'),
 'the-art-of-living-william-hart-teachings-of-s-n-goenka': ('William Hart (the teaching of S. N. Goenka)', '', 'Harper & Row, San Francisco', IC, '', 'the Vipassana Research Institute (vridhamma.org) and dhamma.org', ''),
 'the-laws-of-the-sun-okawa-ryuho': ('Okawa Ryuho', '', 'IRH Press, Tokyo', IC, '', 'Happy Science’s own site and bookstores', ''),
 'mook-maati-acharya-vidyasagar': ('Acharya Vidyasagar', '', '', IC, '', 'Jain eLibrary (jainelibrary.org)', 'A Hindi epic poem.'),
 'quran-the-final-testament-rashad-khalifa': ('Rashad Khalifa', '', 'Islamic Productions, Tucson (Universal Unity, 1989)', IC, '', 'free at masjidtucson.org', 'Rejected as heretical by most Muslims.'),
 'still-thoughts-cheng-yen': ('Cheng Yen', '', 'Tzu Chi Foundation, Hualien', IC, '', 'free at tzuchi.org', ''),
 'the-language-of-the-goddess-marija-gimbutas': ('Marija Gimbutas', '', 'Harper & Row, San Francisco', IC, '', LIB, 'Her reading of Neolithic Europe is disputed by most archaeologists.'),
 'the-book-of-druidry-ross-nichols': ('Ross Nichols (ed. Philip Carr-Gomm)', '', 'Aquarian Press, London', IC, '', LIB, ''),
 'catechism-of-the-catholic-church': ('Catholic Church', '', 'Libreria Editrice Vaticana, Vatican City (English: United States Catholic Conference, 1994)', IC, '', 'free to read at vatican.va (the Latin editio typica is in the public text)', ''),
 'dojeon': ('Daewon (Jeungsando)', '', 'Daewon Publishing, Seoul', IC, '', 'the movement’s own site', ''),
 'our-troth': ('Kveldulf Gundarsson (ed.)', '', 'The Troth', IC, '', 'The Troth (thetroth.org) publishes it; the heathen community’s own libraries', ''),
 'paradigm-shift-zalman-schachter-shalomi': ('Zalman Schachter-Shalomi', '', 'Jason Aronson, Northvale', IC, '', LIB, ''),
 'zhuan-falun-li-hongzhi': ('Li Hongzhi', '', 'Falun Dafa Association', IC, '', 'free from falundafa.org (the movement’s own site); banned in mainland China', ''),
 'the-word-appears-in-the-flesh': ('Church of Almighty God (Eastern Lightning)', '', '', IC, '', 'free from the church’s own sites; it is banned in China and described there as an “evil cult”', ''),
 'how-and-when-heaven-s-gate-may-be-entered': ('Marshall Applewhite and Bonnie Nettles', '', '', IC, '', 'the group’s website (heavensgate.com), kept up after the 1997 suicides', 'Heaven’s Gate, a UFO religion whose members died in March 1997.'),
 'hong-yin-li-hongzhi': ('Li Hongzhi', '', '', IC, '', 'free from falundafa.org', ''),
 'complete-jewish-bible-david-h-stern': ('David H. Stern', '', 'Jewish New Testament Publications, Jerusalem', IC, '', LIB, ''),
 'plum-village-chanting-and-recitation-book': ('Plum Village Community', '', 'Parallax Press, Berkeley', IC, '', 'free at plumvillage.org', ''),
 'mitologia-dos-orixas-reginaldo-prandi': ('Reginaldo Prandi', '', 'Companhia das Letras, São Paulo', IC, '', LIB, ''),
 'truths-of-terasem': ('Martine Rothblatt', '', 'Terasem Movement', IC, '', 'free at terasemfaith.net', ''),
 'cheon-seong-gyeong': ('Sun Myung Moon', '', 'Seonghwa Publishing, Seoul', IC, '', 'free to read at tparents.org', ''),
 'the-gospel-of-the-flying-spaghetti-monster': ('Bobby Henderson', '', 'Villard, New York', IC, '', LIB, 'A satire that has become a religion.'),
 'mishkan-t-filah': ('Central Conference of American Rabbis', '', 'CCAR Press, New York', IC, '', LIB + '; CCAR Press', ''),
 'pyeong-hwa-gyeong': ('Sun Myung Moon', '', 'Family Federation, Seoul', IC, '', 'free at tparents.org', ''),
 'the-creation-of-heaven-and-earth-lee-man-hee': ('Lee Man-hee', '', 'Shincheonji Church of Jesus, Gwacheon', IC, '', 'the church’s own site (shincheonji.kr; shincheonji.org)', ''),
 'kopimist-constitution': ('Kopimistsamfundet (Church of Kopimism)', '', '', OPEN, '', 'free: the Church of Kopimism’s own site; it asks that everything be copied', ''),
 'the-dude-de-ching': ('Oliver Benjamin and Dwayne Eutsey', '', '', IC, '', 'the Dudeism site (dudeism.com) and library copies', ''),
 'the-falling-sky-davi-kopenawa-and-bruce-albert': ('Davi Kopenawa and Bruce Albert', '', 'Plon, Paris (English: Harvard University Press, 2013)', IC, '', LIB, 'A Yanomami shaman’s words, as told to an anthropologist.'),
 'amritbani-guru-ravidass-ji': ('Ravidassia religion (Dera Sachkhand Ballan)', '', '', IC, '', 'the movement’s own site (dsbballan.org)', ''),
 'catechism-of-the-new-apostolic-church': ('New Apostolic Church International', '', 'Verlag Friedrich Bischoff, Frankfurt', IC, '', 'free at nak.org', ''),
 'the-seven-tenets': ('The Satanic Temple', '', '', IC, '', 'free at thesatanictemple.com', ''),
 'laudato-si': ('Pope Francis', '', 'Libreria Editrice Vaticana', IC, '', 'free at vatican.va', ''),
 'way-of-the-future-statement-of-beliefs': ('Anthony Levandowski', '', '', IC, '', 'the church’s own filings; a closed religion', 'A church of an artificial intelligence, 2017; wound up in 2021.'),
}

# rows that are not in the Atlas's text records: (title, author, year, publisher, language, atlas ids, movement, kind, why, route, status, note)
EXTRA = [
 # the holy books of ancient peoples that the Library holds only in old translations: later translations, in copyright
 ('Ancient Near Eastern Texts Relating to the Old Testament', 'James B. Pritchard (ed.)', '1950', 'Princeton University Press', 'English', 'sumerian mesopotamian egyptian canaanite', '', 'scripture',
  'In copyright; the Library holds only the older translations (Rogers, Budge, Langdon). Ugaritic, Hittite and Egyptian texts in English from 1950.', LIB, IC, 'The Library cannot hold any English translation of the Ugaritic tablets, which were found in 1929 and first translated into English in the 1930s.'),
 ('Ugaritic Literature', 'Cyrus H. Gordon', '1949', 'Pontificio Istituto Biblico, Rome', 'English; Ugaritic', 'canaanite', '', 'scripture', 'In copyright; the first English translations of the Baal Cycle and the legends of Keret and Aqhat.', LIB, IC, ''),
 ('Documents in Mycenaean Greek', 'Michael Ventris and John Chadwick', '1956', 'Cambridge University Press', 'English; Greek', 'minoan', '', 'scripture', 'In copyright; the decipherment of Linear B and the tablets that name the gods of Pylos and Knossos.', LIB, IC, 'The Library cannot hold the Linear B tablets in English.'),
 ('Testimonia Linguae Etruscae', 'Massimo Pallottino', '1954', 'La Nuova Italia, Florence', 'Italian; Etruscan', 'etruscan', '', 'scripture', 'In copyright; the standard corpus of the Etruscan inscriptions and the Liber Linteus.', LIB, IC, 'No English translation of the Etruscan texts is public domain.'),
 ('The Dead Sea Scrolls in English', 'Géza Vermes', '1962', 'Penguin Books, Harmondsworth', 'English', 'essenes', '', 'scripture', 'In copyright; the Library holds Schechter’s and Charles’s older translations of the Qumran-related texts and cannot hold a modern English version.', LIB + '; Brill’s open Dead Sea Scrolls Reader chapters', IC, ''),
 ('The Dead Sea Scrolls Translated', 'Florentino García Martínez', '1994', 'Brill, Leiden', 'English', 'essenes', '', 'scripture', 'In copyright.', LIB, IC, ''),
 ('The Nag Hammadi Library in English', 'James M. Robinson (ed.)', '1977', 'E. J. Brill, Leiden; Harper & Row, San Francisco', 'English', 'gnosticism sethianism', '', 'scripture', 'In copyright; the Library’s Gnostic books are Mead’s and older translations.', 'free to read at the Gnosis Archive (gnosis.org), which has the Nag Hammadi library’s translations with permission; a library copy', IC, ''),
 ('Guide of the Perplexed (Moreh Nevukhim)', 'Moses Maimonides, translated by Shlomo Pines', '1963', 'University of Chicago Press', 'English', 'rabbinic', '', 'scripture', 'In copyright; the Library holds Friedländer’s translation of 1904 only.', LIB, IC, ''),
 ('The Talmud (Soncino Babylonian Talmud)', 'Isidore Epstein (ed.)', '1935', 'Soncino Press, London', 'English', 'rabbinic', '', 'scripture', 'In copyright; the Library holds Rodkinson’s older translation and cannot hold the standard English version.', 'Sefaria (sefaria.org), which has licensed modern translations; the Davka CD-ROM; a library copy', IC, 'The first of 35 volumes appeared in 1935 and the series was finished in 1952.'),
 ('The Zohar (Soncino edition)', 'Harry Sperling and Maurice Simon (translators)', '1931', 'Soncino Press, London', 'English', 'kabbalah', '', 'scripture', 'In copyright; the Library holds Mathers’s Kabbalah Unveiled (1912) and selections.', LIB + '; Sefaria hosts the Zohar in Hebrew and Aramaic', IC, 'Five volumes, 1931–34.'),
 ('The Mishnah', 'Herbert Danby (translator)', '1933', 'Oxford University Press', 'English', 'rabbinic', '', 'scripture', 'In copyright (a British work of 1933 whose US term was restored in 1996).', 'Sefaria (sefaria.org) hosts the Mishnah in Joshua Kulp’s open English; a library copy for Danby', IC, ''),
 ('The Koran Interpreted', 'A. J. Arberry', '1955', 'George Allen & Unwin, London', 'English', 'sunni', '', 'scripture', 'In copyright; the Library holds Sale, Palmer, Rodwell and Pickthall only.', LIB, IC, ''),
 ('The Holy Qur-an: Text, Translation and Commentary', 'Abdullah Yusuf Ali', '1934', 'Shaikh Muhammad Ashraf, Lahore', 'English', 'sunni', '', 'scripture', 'In copyright (a British-Indian work of 1934); the most-read English Qur’an of the twentieth century.', 'many online editions of unclear rights; a library copy', IC, 'The Library holds Pickthall (1930) and the older English Qur’ans.'),
 ('The Principal Upanishads', 'S. Radhakrishnan', '1953', 'George Allen & Unwin, London', 'English; Sanskrit', 'hinduism advaita_vedanta', '', 'scripture', 'In copyright; the Library holds Müller’s Sacred Books of the East Upanishads and Hume’s Thirteen Principal Upanishads (1921).', LIB, IC, ''),
 ('The Middle Length Discourses of the Buddha', 'Bhikkhu Ñāṇamoli and Bhikkhu Bodhi', '1995', 'Wisdom Publications, Boston', 'English', 'theravada', '', 'scripture', 'In copyright; the Library holds the Pali Text Society’s older translations.', 'much of the Majjhima is free at Access to Insight (accesstoinsight.org) and SuttaCentral (suttacentral.net, with open licences)', IC, ''),
 ('The Way and Its Power (Tao Te Ching)', 'Arthur Waley', '1934', 'George Allen & Unwin, London', 'English', 'daoism', '', 'scripture', 'In copyright (Waley d. 1966; a British work whose US term was restored).', LIB, IC, 'The Library holds Legge’s Tao Te Ching.'),
 ('Kojiki', 'Donald L. Philippi', '1968', 'University of Tokyo Press', 'English; Japanese', 'shinto', '', 'scripture', 'In copyright; Chamberlain’s Kojiki (1882), which is public domain, has no open full-text scan.', LIB, IC, 'See LEFT_OUT_SORTED.md: Chamberlain’s Kojiki and Satow’s Ancient Japanese Rituals are public domain, with no scan found.'),
 # books about the traditions whose rites are restricted or secret
 ('Navaho Religion: A Study of Symbolism', 'Gladys A. Reichard', '1950', 'Pantheon Books (Bollingen Series), New York', 'English', 'navajo_religion', '', 'ethnography', 'In copyright; the standard study of Diné ritual symbolism.', LIB, IC, ''),
 ('The Navaho', 'Clyde Kluckhohn and Dorothea Leighton', '1946', 'Harvard University Press', 'English', 'navajo_religion', '', 'ethnography', 'In copyright.', LIB, IC, ''),
 ('Introduction to Zuñi Ceremonialism; Zuñi Katcinas; Zuñi Origin Myths; Zuñi Ritual Poetry', 'Ruth L. Bunzel', '1932', 'Forty-seventh Annual Report of the Bureau of American Ethnology, Government Printing Office', 'English', 'zuni_religion pueblo_religion', '', 'ethnography', 'Published by the US Government Printing Office in 1932: a government publication, so it may be in the public domain whatever the date; to check, and fetch if so.', 'the Internet Archive and the Smithsonian’s BAE reports (to check)', CAND, 'US government publications after 1930 can be added to the Library without a licence once their status is checked; this is the first to try.'),
 ('Hopi Journal of Alexander M. Stephen', 'Elsie Clews Parsons (ed.)', '1936', 'Columbia University Press', 'English', 'hopi_religion pueblo_religion', '', 'ethnography', 'In copyright; a Hopi ceremonial calendar of the 1890s from the Scottish trader’s journals.', LIB, IC, ''),
 ('Ojibwa Religion and the Midewiwin', 'Ruth Landes', '1968', 'University of Wisconsin Press', 'English', 'midewiwin anishinaabe_religion', '', 'ethnography', 'In copyright; the fullest modern account of the Midewiwin.', LIB, IC, ''),
 ('Aboriginal Men of High Degree', 'A. P. Elkin', '1945', 'Australasian Publishing Co., Sydney', 'English', 'aboriginal_australian', '', 'ethnography', 'In copyright; Aboriginal initiation and medicine-men, by an anthropologist who was also a priest.', LIB, IC, ''),
 ('Kunapipi', 'Ronald M. Berndt', '1951', 'F. W. Cheshire, Melbourne', 'English', 'aboriginal_australian', '', 'ethnography', 'In copyright; the Kunapipi ritual of Arnhem Land, much of it restricted.', LIB, RESTR, 'The Berndts’ books describe men’s and women’s ceremonies that are secret to initiates.'),
 ('Witchcraft, Oracles and Magic among the Azande', 'E. E. Evans-Pritchard', '1937', 'Clarendon Press, Oxford', 'English', '', '', 'ethnography', 'In copyright.', LIB, IC, ''),
 ('African Religions and Philosophy', 'John S. Mbiti', '1969', 'Heinemann, London', 'English', '', '', 'scholarly study', 'In copyright.', LIB, IC, ''),
 ('Bantu Prophets in South Africa', 'Bengt G. M. Sundkler', '1948', 'Lutterworth Press, London', 'English', '', '', 'scholarly study', 'In copyright; the first study of the Zionist and Ethiopian churches.', LIB, IC, ''),
 ('The Rastafari Movement in Kingston, Jamaica', 'M. G. Smith, Roy Augier and Rex Nettleford', '1960', 'University of the West Indies', 'English', 'rastafari', 'Rastafari', 'ethnography', 'In copyright; the University of the West Indies report that the Jamaican government asked for.', 'the University of the West Indies and library copies', IC, ''),
 ('The Church of the Lord (Aladura)', 'Harold W. Turner', '1967', 'Clarendon Press, Oxford', 'English', 'aladura', 'Aladura', 'ethnography', 'In copyright.', LIB, IC, ''),
 ('Santería: African Spirits in America', 'Joseph M. Murphy', '1988', 'Beacon Press, Boston', 'English', 'santeria', '', 'ethnography', 'In copyright.', LIB, IC, ''),
 ('Voodoo Gods of Haiti', 'Milo Rigaud', '1953', 'Editions Lyon, Paris (English: Secrets of Voodoo, Arco, 1969)', 'French; English', 'haitian_vodou', '', 'ethnography', 'In copyright.', LIB, IC, ''),
 # Bibles and other translations that are in copyright, kept out of the Library for that reason (FACT_CHECK.md: "the in-copyright Bibles are deliberately not included")
 ('The Holy Bible, Revised Standard Version', 'National Council of Churches of Christ in the U.S.A.', '1952', 'Thomas Nelson & Sons, New York (New Testament 1946)', 'English', 'protestantism', '', 'scripture', 'In copyright; the Library holds the World English Bible, the King James, Douay-Rheims, Revised, American Standard and other open versions.', 'read it free in the Oremus Bible Browser and Bible Gateway under their licences; a library copy', IC, ''),
 ('The Holy Bible, New International Version', 'Committee on Bible Translation', '1978', 'Zondervan, Grand Rapids (International Bible Society)', 'English', 'protestantism', '', 'scripture', 'In copyright (Biblica, Inc.).', 'Bible Gateway and the YouVersion app (read free under licence)', IC, ''),
 ('The Holy Bible, English Standard Version', 'Crossway Bibles', '2001', 'Crossway, Wheaton', 'English', 'protestantism', '', 'scripture', 'In copyright (Crossway).', 'esv.org and Bible Gateway (read free under licence)', IC, ''),
 ('New American Standard Bible', 'The Lockman Foundation', '1971', 'Creation House, Carol Stream (Lockman Foundation)', 'English', 'protestantism', '', 'scripture', 'In copyright.', 'lockman.org and Bible Gateway (read free under licence)', IC, ''),
 ('The Holy Bible, New Revised Standard Version', 'National Council of Churches of Christ in the U.S.A.', '1989', 'Oxford University Press; HarperCollins', 'English', 'protestantism', '', 'scripture', 'In copyright.', 'the Oremus Bible Browser and Bible Gateway (read free under licence)', IC, ''),
 ('Tanakh: The Holy Scriptures, the New JPS Translation', 'Jewish Publication Society', '1985', 'Jewish Publication Society, Philadelphia', 'English', 'judaism', '', 'scripture', 'In copyright; the Library holds the Jewish Publication Society’s 1917 translation.', 'Sefaria (sefaria.org), which has licensed the 1985 edition for free reading', IC, ''),
 ('The Jerusalem Bible', 'Alexander Jones (general editor)', '1966', 'Darton, Longman & Todd, London', 'English', 'catholicism', '', 'scripture', 'In copyright.', LIB, IC, ''),
 ('A Treatise on White Magic', 'Alice A. Bailey', '1934', 'Lucis Publishing Company, New York', 'English', 'theosophy', 'Arcane School (Alice Bailey)', 'scripture', 'In copyright (Lucis Trust); the Library holds only her earlier Initiation, Human and Solar (1922).', 'Lucis Trust (lucistrust.org) offers her books free to read online', IC, ''),
 ('Materials Toward a History of Witchcraft', 'Henry Charles Lea (ed. Arthur C. Howland)', '1939', 'University of Pennsylvania Press, Philadelphia (3 vols.)', 'English', '', '', 'history', 'In copyright (the 1939 edition; Lea himself died in 1909, but the edited and arranged volumes are of 1939).', LIB, IC, 'ROADMAP.md records it as left out because not public domain.'),
 ('Satanism and Witchcraft: A Study in Medieval Superstition', 'Jules Michelet, translated by A. R. Allinson', '1939', 'Citadel Press, New York (Michelet’s La Sorcière, 1862)', 'English', '', '', 'history', 'In copyright (the translation is of 1939; the French original of 1862 is public domain but is not in English).', LIB, IC, ''),
 # the critical and investigative books about the groups whose founders’ books the Library holds or lacks
 ('Going Clear: Scientology, Hollywood, and the Prison of Belief', 'Lawrence Wright', '2013', 'Alfred A. Knopf, New York', 'English', 'scientology', 'Scientology', 'critical/investigative', 'In copyright.', LIB, IC, 'A journalist’s history; the Church of Scientology disputes it.'),
 ('Bare-Faced Messiah: The True Story of L. Ron Hubbard', 'Russell Miller', '1987', 'Michael Joseph, London', 'English', 'scientology', 'Scientology', 'critical/investigative', 'In copyright.', LIB, IC, ''),
 ('A Piece of Blue Sky: Scientology, Dianetics and L. Ron Hubbard Exposed', 'Jon Atack', '1990', 'Lyle Stuart, Secaucus', 'English', 'scientology', 'Scientology', 'critical/investigative', 'In copyright.', LIB + '; Jon Atack’s own site (jonatack.com)', IC, ''),
 ('Inside Scientology: The Story of America’s Most Secretive Religion', 'Janet Reitman', '2011', 'Houghton Mifflin Harcourt, Boston', 'English', 'scientology', 'Scientology', 'critical/investigative', 'In copyright.', LIB, IC, ''),
 ('Scientology (Church’s own scriptures: the Operating Thetan levels)', 'L. Ron Hubbard', '1967', 'unpublished (members only)', 'English', 'scientology', 'Scientology', 'scripture', 'In copyright and kept confidential by the Church of Scientology; its members reach the “Advanced Technology” in stages and under a confidentiality agreement; leaked versions circulate and are the subject of litigation.', 'none that is both open and legitimate; the Church’s Advanced Organizations are the only authorised route', RESTR, 'Listed because the maker asked for an honest account of the movements that keep their teaching secret.'),
 ('Raven: The Untold Story of the Rev. Jim Jones and His People', 'Tim Reiterman with John Jacobs', '1982', 'E. P. Dutton, New York', 'English', '', 'Peoples Temple', 'critical/investigative', 'In copyright.', LIB, IC, 'The Jonestown deaths, 1978.'),
 ('Seductive Poison: A Jonestown Survivor’s Story', 'Deborah Layton', '1998', 'Doubleday, New York', 'English', '', 'Peoples Temple', 'autobiography', 'In copyright.', LIB, IC, ''),
 ('Underground: The Tokyo Gas Attack and the Japanese Psyche', 'Haruki Murakami', '1997', 'Kodansha, Tokyo (English: Harvill, 2000)', 'English; Japanese', 'aum_shinrikyo', 'Aum Shinrikyo', 'critical/investigative', 'In copyright.', LIB, IC, ''),
 ('Religious Violence in Contemporary Japan: The Case of Aum Shinrikyo', 'Ian Reader', '2000', 'University of Hawai‘i Press, Honolulu', 'English', 'aum_shinrikyo', 'Aum Shinrikyo', 'scholarly study', 'In copyright.', LIB, IC, ''),
 ('Heaven’s Gate: America’s UFO Religion', 'Benjamin E. Zeller', '2014', 'New York University Press', 'English', 'heavens_gate', 'Heaven’s Gate', 'scholarly study', 'In copyright.', LIB, IC, ''),
 ('Why Waco? Cults and the Battle for Religious Freedom in America', 'James D. Tabor and Eugene V. Gallagher', '1995', 'University of California Press, Berkeley', 'English', 'branch_davidians', 'Branch Davidians', 'scholarly study', 'In copyright.', LIB, IC, ''),
 ('The Making of a Moonie: Choice or Brainwashing?', 'Eileen Barker', '1984', 'Basil Blackwell, Oxford', 'English', 'unification_church', 'Unification Church', 'scholarly study', 'In copyright.', LIB, IC, ''),
 ('Cults in Our Midst', 'Margaret Thaler Singer with Janja Lalich', '1995', 'Jossey-Bass, San Francisco', 'English', '', '', 'critical/investigative', 'In copyright. The “brainwashing” claims in it are disputed by most scholars of new religions.', LIB, IC, ''),
 ('Combatting Cult Mind Control', 'Steven Hassan', '1988', 'Park Street Press, Rochester', 'English', '', '', 'critical/investigative', 'In copyright. Disputed by scholars of new religions.', LIB, IC, ''),
 ('Heaven’s Harlots: My Fifteen Years as a Sacred Prostitute in the Children of God Cult', 'Miriam Williams', '1998', 'William Morrow, New York', 'English', 'family_international', 'The Family International', 'autobiography', 'In copyright.', LIB, IC, ''),
 ('Falun Gong: The End of Days', 'Maria Hsia Chang', '2004', 'Yale University Press, New Haven', 'English', 'falun_gong', 'Falun Gong', 'scholarly study', 'In copyright.', LIB, IC, ''),
 # the Universalist and Unitarian churches: histories, essays and the hymnal (added 23 November 2026; rows noted “from memory” were not looked up)
 ('Universalism in America: A Documentary History', 'Ernest Cassara (ed.)', '1971', 'Beacon Press, Boston', 'English', 'unitarian_universalism', '', 'history', 'In copyright; Universalist documents arranged as a history. A later edition (Skinner House Books, 1997) carries the longer title “Universalism in America: A Documentary History of a Liberal Faith”.', LIB, IC, 'The Library holds Ballou’s Treatise on Atonement (1805); Eddy’s history and the other public-domain Universalist books are on the collection list (round 25c).'),
 ('The Larger Hope: The First Century of the Universalist Church in America, 1770–1870', 'Russell E. Miller', '1979', 'Unitarian Universalist Association, Boston', 'English', 'unitarian_universalism', '', 'history', 'In copyright; volume 1 of the two-volume history of the Universalist Church in America, commissioned by the Universalist Historical Society.', LIB, IC, ''),
 ('The Larger Hope: The Second Century of the Universalist Church in America, 1870–1970', 'Russell E. Miller', '1985', 'Unitarian Universalist Association, Boston', 'English', 'unitarian_universalism', '', 'history', 'In copyright; volume 2 of the history.', LIB, IC, ''),
 ('A History of Unitarianism: Socinianism and Its Antecedents', 'Earl Morse Wilbur', '1945', 'Harvard University Press, Cambridge, Mass.', 'English', 'unitarianism', '', 'history', 'First published in the United States in 1945: in copyright unless the copyright was not renewed. A scholarly history of the Unitarian movement, in two volumes.', LIB, IC, ''),
 ('A History of Unitarianism: In Transylvania, England, and America', 'Earl Morse Wilbur', '1952', 'Harvard University Press, Cambridge, Mass.', 'English', 'unitarianism', '', 'history', 'First published in the United States about 1952: in copyright unless the copyright was not renewed. Volume 2 of Wilbur’s history.', LIB, IC, 'The year and exact title of volume 2 are from memory and a search that did not settle them: confirm before citing.'),
 ('The Beginnings of Unitarianism in America', 'Conrad Wright', '1955', 'Starr King Press, Boston', 'English', 'unitarianism', '', 'history', 'First published in 1955 (reissued in 1976): in copyright unless the 1955 copyright was not renewed. How Unitarianism grew among the Congregational ministers of eighteenth-century New England.', LIB, IC, 'The publisher is from memory: confirm.'),
 ('The Two Treatises of Servetus on the Trinity', 'Michael Servetus, translated by Earl Morse Wilbur', '1932', 'Harvard University Press, Cambridge, Mass.', 'English; Latin', 'unitarianism', '', 'scripture', 'First published in 1932: in copyright until 1 January 2028 (95 years from publication) unless the copyright was not renewed. The English translation of On the Errors of the Trinity (1531) and the Dialogues on the Trinity (1532).', LIB, IC, 'The Internet Archive holds a lending-only copy (twotreatisesofse0000serv). The 1531 Latin original is public domain: a McGill University Library scan is open on the Archive.'),
 ('The Unitarians and the Universalists', 'David Robinson', '1985', 'Greenwood Press, Westport, Conn.', 'English', 'unitarianism unitarian_universalism', '', 'history', 'In copyright; a one-volume history of both movements.', LIB, IC, 'From memory: confirm before citing.'),
 ('The Larger Faith: A Short History of American Universalism', 'Charles A. Howe', '1993', 'Skinner House Books, Boston', 'English', 'unitarian_universalism', '', 'history', 'In copyright; a short history of American Universalism.', LIB, IC, 'From memory: confirm before citing.'),
 ('A Chosen Faith: An Introduction to Unitarian Universalism', 'John A. Buehrens and Forrest Church', '1989', 'Beacon Press, Boston', 'English', 'unitarian_universalism', '', 'scholarly study', 'In copyright; an introduction to the faith by two Unitarian Universalist ministers (revised 1998).', LIB, IC, 'From memory: confirm before citing.'),
 ('On Being Human Religiously: Selected Essays in Religion and Society', 'James Luther Adams (ed. Max L. Stackhouse)', '1976', 'Beacon Press, Boston', 'English', 'unitarian_universalism', '', 'scholarly study', 'In copyright; essays by a Unitarian theologian and ethicist.', LIB, IC, 'From memory: confirm before citing.'),
 ('Singing the Living Tradition', 'Unitarian Universalist Association', '1993', 'Beacon Press, Boston', 'English', 'unitarian_universalism', '', 'liturgy', 'In copyright; the hymnal of the Unitarian Universalist Association.', LIB, IC, 'From memory: confirm before citing.'),
]

# US-first English books of 1931–1963 that nobody has yet checked for a renewal (so they are candidates, not known to be free); not listed here: books whose renewal is known or whose owner enforces its copyright
CAND_IDS = {'unveiled-mysteries-godfre-ray-king', 'judaism-as-a-civilization-mordecai-kaplan', 'mules-and-men-zora-neale-hurston', 'tell-my-horse-zora-neale-hurston', 'voodoo-in-new-orleans-robert-tallant',
            'the-sabbath-abraham-joshua-heschel', 'god-in-search-of-man-heschel', 'god-speaks-meher-baba', 'the-voice-of-venus-ernest-norman', 'the-sacred-pipe-black-elk-and-joseph-epes-brown',
            'divine-horsemen-maya-deren', 'humanist-manifesto', 'in-search-of-the-miraculous-p-d-ouspensky', 'beelzebub-s-tales-to-his-grandson-g-i-gurdjieff'}
CAND_TITLES = {'Navaho Religion: A Study of Symbolism', 'The Navaho', 'Hopi Journal of Alexander M. Stephen',
               'A History of Unitarianism: Socinianism and Its Antecedents', 'A History of Unitarianism: In Transylvania, England, and America', 'The Beginnings of Unitarianism in America', 'The Two Treatises of Servetus on the Trinity'}


def norm(s):
    s = unicodedata.normalize('NFKD', s)
    s = ''.join(c for c in s if not unicodedata.combining(c))
    return re.sub(r'[^a-z0-9]+', ' ', s.lower().replace('’', "'")).strip()


def write_md(rows):
    st = collections.Counter(r['status'] for r in rows); kd = collections.Counter(r['kind'] for r in rows)
    mv = collections.Counter(r['movement'] for r in rows if r['movement'])
    free = sum(1 for r in rows if re.search(r'\bfree\b', r['most_useful_legitimate_route']))
    fam = collections.Counter(r['family'] for r in rows)
    atlas = sum(1 for r in rows if r['atlas_tradition_ids'])
    t = []
    t.append('# Books the Library cannot hold: first published after 1930, or otherwise unavailable\n')
    t.append('Written 17 November 2026 on the maker\'s words: "build a list of all the post 1930 books we cant get" and "the people need all the information available to decide for themselves". '
             'The list is `POST1930_WANTED.csv` (%d rows), built by `tools/post1930_wanted.py`; run it again after `TEXT_GAPS.csv` or `COVERAGE_BY_TRADITION.csv` changes. Nothing in copyright has been fetched or copied.\n' % len(rows))
    t.append('**Why the line is 1930.** The Library holds a book when it is in the public domain or openly licensed. In the United States a work first published in 1930 became public domain on 1 January 2026, so 1930 books are in; books first published from 1931 on are protected for 95 years from publication (so the first of them are free on 1 January 2027), unless they were never renewed (for books published 1931–63) or the author or publisher has licensed them openly. Books by authors who died long ago can still be protected in the United States by the 1996 restoration of foreign works, so a long-dead author is not enough.\n')
    t.append('## What is in it\n')
    t.append('- **%d rows**: %d Atlas text records after 1930 that the Library does not hold (the Atlas catalogues the book, the Library lacks it), and %d added here: later English translations of the ancient and sacred texts the Library holds only in older translations (the Ugaritic tablets, Linear B, the Etruscan inscriptions, the Dead Sea Scrolls, Nag Hammadi, Pines\'s Guide, the Soncino Talmud and Zohar, the Mishnah, the Qur\'an in Arberry and Yusuf Ali), the field and scholarly books on traditions whose rites are restricted (Navajo, Zuñi, Hopi, Ojibwa, Aboriginal Australian, Palo, Abakuá), the critical and investigative books about the movements the Library holds the founders\' books of, and the histories, essays and hymnal of the Unitarian and Universalist churches.' % (len(rows), len(rows) - len(EXTRA), len(EXTRA)))
    t.append('- Columns: title, author, first publication year, publisher (blank where not checked), language, Atlas tradition ids and family (%d rows are tied to an Atlas tradition), movement (its own column: %d movements), kind, why we cannot have it, the most useful legitimate route, status, note, id.' % (atlas, len(mv)))
    t.append('- **Kinds:** ' + ', '.join('%s %d' % (k, v) for k, v in kd.most_common()) + '.')
    t.append('- **Status:** ' + ', '.join('%s %d' % (k, v) for k, v in st.most_common()) + '.\n')
    t.append('**Status words.** *in copyright* is the default for a book first published after 1930. *candidate for public domain by non-renewal* means only that it was (as far as known) first published in the United States between 1931 and 1963 and nobody has yet looked for a renewal; it is not a claim that it is free. *openly licensed* means the book itself carries an open licence or copyleft notice (the Principia Discordia, the Kopimist constitution). *restricted by the community* means the people whose rite or teaching it is ask that it not be copied (Gardnerian witches\' Book of Shadows, Strehlow\'s Songs of Central Australia, the Abakuá and Palo books, the Scientology upper levels): the Library lists it, says why it cannot hold it, and points to the community\'s own route; it is not hidden.\n')
    t.append('## The routes (what the list is for)\n')
    t.append('For %d rows the movement or the author\'s own body publishes the text free to read (the Bahá\'í Reference Library, the Watchtower Online Library, Vedabase, the Meher Baba and Sathya Sai libraries, Osho, falundafa.org, rael.org, familyfed.org and others); the Library cannot copy them, but a reader can be sent there. For the rest the route is a library copy (WorldCat, interlibrary loan) or the Internet Archive\'s lending library. A book that is only in print behind a community\'s own door (Hubbard\'s upper levels, the Mo Letters, much of Aum Shinrikyō) is listed and marked, so a reader knows it exists and where its text is kept.\n' % free)
    t.append('## The movements and the High-control groups tab\n')
    t.append('%d movements are named in the *movement* column, among them Scientology, the Unification Church, Aum Shinrikyō, Heaven\'s Gate, Falun Gong, the Church of Almighty God, Raëlism, Shincheonji and the Rajneesh movement. The maker asked for a section and a database for the ones that are clearly cults; another session built the tab **High-control groups** under Traditions (`#/traditions/movements`, 13 groups, every claim marked "Under review") and its cards point at this list for the books they cannot hold. This list is the source list for it: for each movement, the movement\'s own books (free where the movement publishes them, in the *route* column), the scholarly studies and the critical and investigative books, each labelled by what it is and who wrote it. Six of the seven groups the tab names as not yet written up have rows here, mostly as the movement\'s own books (Shincheonji, the Church of Almighty God, Falun Gong, Jehovah\'s Witnesses, ISKCON, Church Universal and Triumphant); Synanon has none yet. The word "cult" is contested (scholars use "new religious movement"; courts and governments, anti-cult groups and some ex-members use "cult"), so the page says who calls it what and never decides for the reader.\n' % len(mv))
    t.append('## What has not been checked, and what needs a question first\n')
    t.append('- Publishers and years are given as known and left blank otherwise; nobody has checked each against a catalogue.')
    t.append('- The %d *candidate* rows are the ones worth a renewal check. That is a fetch from the Stanford Copyright Renewal Database (a free search page and a result of a few kilobytes per book) or the Copyright Office\'s own records; the maker is asked first, with the source and size, before it is done.' % st.get('candidate for public domain by non-renewal', 0))
    t.append('- Books published by the United States government after 1930 (the Bureau of American Ethnology\'s later reports, Bunzel\'s *Zuñi* volume of 1932 among them) are public domain whatever their date and can be added to the Library; one is listed in the CSV as a first to check.')
    t.append('- Nothing here is legal advice; the status words are the best reading of the dates, and a lawyer or the Copyright Office\'s record decides.\n')
    open(ROOT / 'POST1930_WANTED.md', 'w', encoding='utf-8').write('\n'.join(t) + '\n')


def main():
    cov = list(csv.DictReader(open(ROOT / 'COVERAGE_BY_TRADITION.csv', encoding='utf-8')))
    byname = {norm(r['name']): r for r in cov}; ids = {r['id'] for r in cov}
    gaps = list(csv.DictReader(open(ROOT / 'TEXT_GAPS.csv', encoding='utf-8')))
    rows = []; unknown = []
    for g in gaps:
        y = g['year']
        if not (y.lstrip('-').isdigit() and int(y) > 1930) or g['in_folder'] != 'no': continue
        t = byname.get(norm(g['tradition']))
        inf = INFO.get(g['id'])
        author, pub_year, pub, status, kind, route, note = inf if inf else ('', '', '', '', '', '', '')
        if not inf: unknown.append(g['id'])
        title = re.sub(r'\s*\([^()]*\)\s*$', '', g['title']) if not author else g['title']
        m = re.search(r'\(([^()]*)\)\s*$', g['title'])
        if not author and m: author = m.group(1)
        first = pub_year or re.match(r'\D*(\d{4})', g['date']).group(1) if (pub_year or re.match(r'\D*(\d{4})', g['date'])) else y
        if not pub_year and re.match(r'\D*(\d{4})', g['date']): first = re.match(r'\D*(\d{4})', g['date']).group(1)
        k = kind or CATS.get(g['category'], 'scripture')
        if t and t['kind'] in ('nrm', 'mov', 'syn') and not kind and g['category'] in ('scr', 'myth', 'mys', 'dev', 'wis'): k = 'scripture'
        why = 'First published or written in %s, so it is in copyright (US term: 95 years from publication for works published from 1931 on) or otherwise not free to copy.' % first
        if g['status'] == 'oral': why = 'An oral tradition: there is no authorised text, only what ethnographers and the community have recorded since the 1930s.'
        if not route: route = 'ask the community or its publisher; a library copy (WorldCat, interlibrary loan) or the Internet Archive’s lending library'
        if not status or (status == IC and g['id'] in CAND_IDS): status = CAND if g['id'] in CAND_IDS else IC
        rows.append(dict(
            id=g['id'], title=title, author=author, first_publication_year=first, publisher=pub, language=g['language'],
            atlas_tradition_ids=(t['id'] if t else ''), family=g['family'], movement=(g['tradition'] if t and t['kind'] in ('nrm', 'mov', 'syn') else ''),
            kind=k, why_we_cannot_have_it=why, most_useful_legitimate_route=route, status=status, note=note))
    for e in EXTRA:
        title, author, year, pub, lang, atl, mov, kind, why, route, status, note = e
        if title in CAND_TITLES: status = CAND
        tr = [i for i in atl.split() if i in ids]; fam = ''
        fam = {'Azande': 'african', 'African Religions': 'african', 'Bantu Prophets': 'african', 'Seductive Poison': 'nrm', 'Cults in Our Midst': 'nrm', 'Combatting Cult': 'nrm', 'Raven': 'nrm'}.get(next((k for k in ('Azande', 'African Religions', 'Bantu Prophets', 'Seductive Poison', 'Cults in Our Midst', 'Combatting Cult', 'Raven') if k in title), ''), '')
        if tr:
            r = next(x for x in cov if x['id'] == tr[0]); fam = r['family']
        rows.append(dict(id=re.sub(r'[^a-z0-9]+', '-', title.lower())[:60].strip('-'), title=title, author=author, first_publication_year=year, publisher=pub, language=lang,
                         atlas_tradition_ids=' '.join(tr), family=fam, movement=mov, kind=kind, why_we_cannot_have_it=why, most_useful_legitimate_route=route, status=status, note=note))
    cols = ['title', 'author', 'first_publication_year', 'publisher', 'language', 'atlas_tradition_ids', 'family', 'movement', 'kind', 'why_we_cannot_have_it', 'most_useful_legitimate_route', 'status', 'note', 'id']
    rows.sort(key=lambda r: (r['family'], r['atlas_tradition_ids'], r['first_publication_year'], r['title']))
    write_md(rows)
    with open(ROOT / 'POST1930_WANTED.csv', 'w', encoding='utf-8', newline='') as f:
        w = csv.DictWriter(f, fieldnames=cols, extrasaction='ignore'); w.writeheader(); w.writerows(rows)
    st = collections.Counter(r['status'] for r in rows); kd = collections.Counter(r['kind'] for r in rows)
    mv = sorted({r['movement'] for r in rows if r['movement']})
    print(len(rows), 'rows;', dict(st)); print(dict(kd)); print(len(mv), 'movements'); print('without INFO:', len(unknown))
    return rows, st, kd, mv

if __name__ == '__main__':
    main()
