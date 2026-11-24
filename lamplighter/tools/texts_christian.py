"""Specs for further open (pre-1931) English translations from the Christian traditions after the early Church: the medieval Latin and Greek classics, the
liturgies and prayer books, the Reformation confessions, and the devotional classics of Catholic, Orthodox, Lutheran, Reformed, Anglican and Methodist life,
and a few Syriac, Ethiopic and East Asian Christian texts. Merged into texts_archive.SPECS (see the end of that file); built with python3 build_texts.py
--only=ids. An ident 'PG123' is Project Gutenberg #123; the rest are Internet Archive items. Sources were found on 16 November 2026 and fetched on the
maker's instruction ("keep going and find more texts").

Each spec may carry lib=(title, group, when, tr, station title prefix): the Library line and the Path station for an id that is not in the Library yet.
"""
OLD = 'An older translation, so its wording and its scholarship are dated; set a recent translation beside it where there is one.'
CAT = 'Printed with the Church’s approval (Nihil obstat and Imprimatur), as a Catholic book of its time.'


def G(idents, by, note='', lib=None, **kw):
    d = dict(idents=idents if isinstance(idents, list) else [idents], by=by, note=note, trim_index=True, trim_front=True, trim_back=True, split='auto')
    if lib: d['lib'] = lib
    d.update(kw)
    return d


MYST = 'Christian mystics and the Jesus Prayer'
REF = 'The Quakers: waiting in silence'

SPECS = {
    # ── Medieval theology and philosophy ──
    'e-sth': G(['PG17611', 'PG17897', 'PG18755', 'PG19950'], 'Thomas Aquinas, The Summa Theologica, translated by the Fathers of the English Dominican Province (London: Burns, Oates & Washbourne, 1920–25), Parts I, I–II, II–II and III (Project Gutenberg #17611, #17897, #18755, #19950)',
               'The summit of medieval Catholic theology, in the standard English: God and creation (Part I), human life, law and grace and the virtues (Parts I–II and II–II, which include faith, hope, charity, prayer and religion) and Christ and the sacraments (Part III). Each “article” sets out the objections, the answer on the other side and the reply. The Supplement to Part III is not included.',
               labels=['Part I (Prima Pars)', 'Part I–II (Prima Secundae)', 'Part II–II (Secunda Secundae)', 'Part III (Tertia Pars)'],
               lib=('Summa Theologica (Aquinas, trans. English Dominican Fathers, 1920–25): Parts I, I–II, II–II and III', 'ec', 'c. 1265–74 CE', 'ec', MYST)),
    'e-scg': G(['summacontragenti01thomuoft', 'summacontragenti02thomuoft', 'summacontragenti0000unse', 'summacontragenti0001unse', 'summacontragenti0002unse'], 'Thomas Aquinas, The Summa contra Gentiles, literally translated by the English Dominican Fathers (London: Burns, Oates & Washbourne, 1923–29), volumes 1–5 of the set (Book One, Book Two, Book Three in three parts)',
               'Aquinas’s reasoned account of the Catholic faith for readers who did not already accept it (Muslims and Jews among them): the existence and nature of God, creation, providence and the last end. Book Four (the Trinity, the Incarnation and the sacraments) is not in this copy. ' + CAT,
               lib=('Summa contra Gentiles (Aquinas, trans. English Dominican Fathers, 1923–28): Books One to Three', 'ec', 'c. 1259–65 CE', 'ec', MYST)),
    'e-cdh': G('curdeushomo00anse', 'Anselm of Canterbury, Cur Deus Homo, to which is added a selection from his letters (The Ancient and Modern Library of Theological Literature; London: Griffith Farran Okeden & Welsh, about 1890)',
               'Anselm’s dialogue with his pupil Boso on why the Incarnation was needed, the satisfaction theory of the Atonement, with a short life of Anselm and a selection from his letters. The book that set the question for much Western Christian reflection on the cross. ' + OLD,
               lib=('Cur Deus Homo (Anselm, about 1890 edition): why God became man', 'ec', 'c. 1098 CE', 'ec', MYST)),
    'e-prs': G('stanselmeproslog00anseuoft', 'Anselm of Canterbury, St. Anselm: Proslogium, Monologium, an Appendix in Behalf of the Fool by Gaunilo, and Cur Deus Homo, translated by Sidney Norton Deane (Chicago: Open Court, 1903)',
               'The Proslogium (the “ontological argument”: God is that than which nothing greater can be thought), the Monologium and Gaunilo’s reply on behalf of the fool. The same volume also holds James Gardiner Vose’s translation of Cur Deus Homo; the Library has another translation of it as its own entry.',
               lib=('Proslogium and Monologium (Anselm, trans. Deane, 1903): the ontological argument, with Gaunilo’s reply', 'ec', 'c. 1077–78 CE', 'ec', MYST)),
    'e-boe': G('PG14328', 'Boethius, The Consolation of Philosophy, translated by H. R. James (London: Elliot Stock, 1897; Project Gutenberg #14328)',
               'Written in prison in 524 CE while awaiting execution, a dialogue between Boethius and Lady Philosophy on fortune, happiness, evil and providence, in prose and verse. The most read book of the Middle Ages after the Bible, and not a Christian book by name: it never mentions Christ.',
               lib=('The Consolation of Philosophy (Boethius, trans. James, 1897)', 'ec', 'c. 524 CE', 'ec', 'Augustine and Benedict')),
    'e-pdy': G('dionysiusareopag00pseu', 'Pseudo-Dionysius the Areopagite, On the Divine Names and The Mystical Theology, translated by C. E. Rolt (London: SPCK, 1920)',
               'The two short books that taught the West to speak of God by unknowing: the divine names, and the “darkness above the light” of The Mystical Theology, by a Syrian monk who wrote under the name of Paul’s convert (about 500 CE). ' + OLD,
               lib=('Divine Names and Mystical Theology (Pseudo-Dionysius, trans. Rolt, 1920)', 'ec', 'c. 500 CE', 'ec', 'Augustine and Benedict')),
    'e-tgm': G('theologiagermani01fran', 'Susanna Winkworth (translator), Theologia Germanica: which setteth forth many fair lineaments of Divine truth and saith very lofty and lovely things touching a perfect life (London: Macmillan, 1874 edition of the 1854 translation)',
               'The anonymous German treatise of about 1350 on the true and free life in God: giving up the self-will, union with the divine, the “Christ within.” Luther published it twice and called it the book he liked best after the Bible and Augustine. ' + OLD,
               lib=('Theologia Germanica (anonymous, trans. Winkworth)', 'ec', 'c. 1350 CE', 'ec', MYST)),
    'e-lfl': G('littleflowersofs00franrich', 'The Little Flowers of Saint Francis of Assisi, translated by W. Heywood (London: Methuen, 1905)',
               'The Fioretti: the stories of Francis and his first companions told in the 14th century, among them the wolf of Gubbio, the sermon to the birds, perfect joy and the stigmata. The warm face of medieval Catholic piety.',
               lib=('The Little Flowers of Saint Francis (trans. Heywood, 1905)', 'ec', 'c. 1330 CE (Francis d. 1226)', 'ec', MYST)),
    'e-cas': G('seraphicvirginca00cathuoft', 'Algar Thorold (translator), The Dialogue of the Seraphic Virgin Catherine of Siena, dictated by her while in a state of ecstasy to her secretaries (London: Kegan Paul, 1896)',
               'Catherine’s conversation with God the Father on the soul’s way to him, on discretion, prayer, obedience and the “bridge” that is Christ; the book of a Dominican tertiary of Siena who advised popes (d. 1380). ' + OLD,
               lib=('The Dialogue of Catherine of Siena (trans. Thorold, 1896)', 'ec', 'c. 1377–78 CE', 'ec', MYST)),
    'e-anf': G('divineconsolatio00angeuoft', 'Mary G. Steegmann (translator), The Book of Divine Consolation of the Blessed Angela of Foligno (New Medieval Library, London: Chatto & Windus, 1909)',
               'The visions and teaching of a Franciscan tertiary of Foligno (d. 1309): the “Memorial” she dictated to her confessor and her instructions, with the steps of her conversion. ' + OLD,
               lib=('The Book of Divine Consolation of Angela of Foligno (trans. Steegmann, 1909)', 'ec', 'c. 1296–1309 CE', 'ec', MYST)),
    'e-imi': G('PG1653', 'Thomas à Kempis, The Imitation of Christ, translated by William Benham (Project Gutenberg #1653)',
               'The best-loved Christian devotional book after the Bible: four short books on the spiritual life, on the inner life, on inward consolation and on the sacrament of Holy Communion, by a monk of the Brethren of the Common Life.',
               lib=('The Imitation of Christ (Thomas à Kempis, trans. Benham)', 'ec', 'c. 1418–27 CE', 'ec', MYST)),

    # ── Teresa, John of the Cross, Ignatius, de Sales ──
    'e-tlf': G('PG8120', 'Teresa of Ávila, The Life of St. Teresa of Jesus, of the Order of Our Lady of Carmel, written by herself, translated by David Lewis (London: Thomas Baker, 1904; Project Gutenberg #8120)',
               'Teresa’s account of her own life and of her prayer, written under obedience: her illness, her years of lukewarm prayer, her visions and raptures, and the foundation of the first reformed Carmel. Includes her famous “four waters” of prayer.',
               lib=('The Life of St. Teresa of Jesus (trans. Lewis)', 'ec', 'c. 1565 CE', 'ec', MYST)),
    'e-tic': G('interiorcastleor00tere', 'Teresa of Ávila, The Interior Castle, or The Mansions, translated by the Benedictines of Stanbrook, edited by Fr. Benedict Zimmerman, O.D.C. (London: Thomas Baker, 1921)',
               'The soul as a crystal castle of seven dwelling places, with God in the centre: the journey from the first mansion of self-knowledge to the spiritual marriage. Her last and greatest book.',
               lib=('The Interior Castle (Teresa of Ávila, trans. Stanbrook Benedictines, 1921)', 'ec', 'c. 1577 CE', 'ec', MYST)),
    'e-tfd': G('bookoffoundation00tereuoft', 'Teresa of Ávila, The Book of the Foundations of S. Teresa of Jesus, of the Order of Our Lady of Carmel, translated by David Lewis (London: Thomas Baker, 1913)',
               'Teresa’s account of the seventeen convents she founded, and of the people, hardships and graces that went with each foundation. A woman reformer’s practical book, with her advice on prayer and community life.',
               lib=('The Book of the Foundations (Teresa of Ávila, trans. Lewis, 1913)', 'ec', 'c. 1573–82 CE', 'ec', MYST)),
    'e-jdn': G('darknightofsoul00sain', 'John of the Cross, The Dark Night of the Soul, in The Works of Saint John of the Cross, translated by David Lewis (London: Thomas Baker, 1908)',
               'John’s commentary on his own poem of the night: the “dark night” of the senses and of the spirit, in which God strips the soul of every consolation to draw it to himself. ' + CAT,
               lib=('The Dark Night of the Soul (John of the Cross, trans. Lewis, 1908)', 'ec', 'c. 1578–85 CE', 'ec', MYST)),
    'e-jam': G('ascentofmountcar00johnuoft', 'John of the Cross, The Ascent of Mount Carmel, translated by David Lewis, with an introduction by Benedict Zimmerman (London: Thomas Baker, 1922)',
               'John’s great treatise on the way of detachment: the Active Night of the senses and of the spirit, with his diagram of the mountain. Ascent and the Dark Night are two halves of one work. ' + CAT,
               lib=('The Ascent of Mount Carmel (John of the Cross, trans. Lewis, 1922)', 'ec', 'c. 1578–85 CE', 'ec', MYST)),
    'e-sex': G('spiritualexercis00ignauoft', 'Ignatius of Loyola, The Spiritual Exercises of St. Ignatius, translated from the autograph by Elder Mullan, S.J. (New York: P. J. Kenedy, 1914)',
               'The thirty-day retreat that forms Jesuits and many lay people: the Principle and Foundation, the examination of conscience, meditations on sin, on the life of Christ and the Passion, the rules for the discernment of spirits, and the “Contemplation to Attain Love.” A book to be practised, not just read.',
               lib=('The Spiritual Exercises (Ignatius of Loyola, trans. Mullan, 1914)', 'ec', 'c. 1522–48 CE', 'ec', MYST)),
    'e-ddl': G('IntroductionToTheDevoutLife', 'Francis de Sales, Introduction to the Devout Life, translated by Thomas Barns (London: Rivingtons, 1891)',
               'The first Catholic guide for lay people in the world: how a married person, a soldier or a merchant can live a holy life at home. Francis was bishop of Geneva and a gentle writer. ' + OLD,
               lib=('Introduction to the Devout Life (Francis de Sales, trans. Barns, 1891)', 'ec', 'c. 1609 CE', 'ec', REF)),
    'e-lwr': G('PG5657', 'Brother Lawrence of the Resurrection, The Practice of the Presence of God (Project Gutenberg #5657)',
               'The letters and conversations of a Carmelite lay brother who worked in the monastery kitchen and found God among the pots and pans. Perhaps the best-known short guide to praying without ceasing in ordinary work.',
               lib=('The Practice of the Presence of God (Brother Lawrence)', 'ec', 'c. 1666–91 CE', 'ec', REF)),
    'e-pas': G('pascalspenseesor00pasc', 'Blaise Pascal, Pensées, or Thoughts on Religion (London: Kegan Paul, 1900)',
               'Pascal’s notes for a defence of Christianity, left unfinished at his death in 1662: the wager, the two infinities, the heart’s reasons that reason does not know, and the “night of fire” memorial. ' + OLD,
               lib=('Pensées (Blaise Pascal, 1670; trans. 1900)', 'ec', 'c. 1657–62 CE', 'ec', REF)),

    # ── Liturgy and prayer ──
    'e-brv': G(['TheRomanBreviaryV1', 'TheRomanBreviaryV2', 'romanbreviary03unknuoft', 'romanbreviary04unknuoft'], 'The Marquess of Bute (translator), The Roman Breviary, reformed by order of the Holy Œcumenical Council of Trent, 4 vols.: Winter, Spring, Summer, Autumn (Edinburgh: William Blackwood, 1908; first published 1879)',
               'The Divine Office: the psalms, hymns, readings and prayers the clergy and many religious pray at the hours of the day, with the saints’ lessons for each day, the whole Church year in four volumes. The Breviary is the Church’s daily prayer. ' + CAT,
               labels=['Volume 1 · Winter', 'Volume 2 · Spring', 'Volume 3 · Summer', 'Volume 4 · Autumn'],
               lib=('The Roman Breviary (trans. Marquess of Bute, 1879): the Divine Office, 4 volumes', 'ec', 'liturgy of the 4th–16th c. CE (this ed. 1908)', 'ec', 'Augustine and Benedict')),
    'e-msl': G('romanmissaladapt00unknuoft', 'The Roman Missal, adapted to the use of the laity, from the Missale Romanum (about 1900)',
               'The Mass in English as the Catholic laity followed it before 1962: the ordinary of the Mass, the prayers for each Sunday and feast of the year, the Proper of the Saints and the common of the saints, with devotions. ' + CAT,
               lib=('The Roman Missal for the laity (about 1900): the Mass in English', 'ec', 'liturgy of the 4th–16th c. CE (this ed. c. 1900)', 'ec', 'Augustine and Benedict')),
    'e-sar': G('cu31924092460033', 'Frederick E. Warren (translator), The Sarum Missal in English (London: Alexander Moring, 1911)',
               'The English medieval form of the Mass, the Sarum Use of Salisbury, which the first Book of Common Prayer (1549) grew out of. The prayers, collects and rites for the Church year as they were used in the English cathedrals before the Reformation.',
               lib=('The Sarum Missal in English (trans. Warren, 1911): the medieval English Mass', 'ec', 'c. 11th–16th c. CE', 'ec', 'Augustine and Benedict')),
    'e-hap': G('cu31924029363128', 'Isabel Florence Hapgood (translator), Service Book of the Holy Orthodox-Catholic Apostolic (Greco-Russian) Church (New York: Houghton Mifflin, 1906)',
               'The Orthodox services in English as used in Russian parishes: Vespers and Matins, the Divine Liturgies of St John Chrysostom, St Basil the Great and the Presanctified Gifts, and the sacraments (Baptism, Chrismation, Confession, Matrimony, Unction of the Sick and the services for the dead). The most complete Orthodox service book in English before 1930.',
               lib=('Service Book of the Orthodox Church (Hapgood, 1906): Vespers, Matins, the Divine Liturgy, sacraments', 'ec', 'liturgy of the 4th–16th c. CE (this ed. 1906)', 'ec', MYST)),

    # ── The Reformation and after ──
    'e-cal': G(['instituteschrist01calvuoft', 'institutesofreli02calvuoft', 'institutesofthec03calvuoft'], 'John Calvin, Institutes of the Christian Religion, translated by Henry Beveridge, 3 vols. (Edinburgh: Calvin Translation Society, 1845)',
               'The foundation of Reformed theology: knowledge of God and of ourselves (Book 1), Christ the Redeemer (Book 2), faith, repentance, election and prayer (Book 3), and the Church, the sacraments and the state (Book 4), with Beveridge’s introduction. ' + OLD,
               labels=['Volume 1', 'Volume 2', 'Volume 3'],
               lib=('Institutes of the Christian Religion (Calvin, trans. Beveridge, 1845), 3 volumes', 'ec', '1536; final form 1559 CE', 'ec', REF)),
    'e-cch': G(['TheCreedsOfChristendomV1', 'TheCreedsOfChristendomV2', 'TheCreedsOfChristendomV3'], 'Philip Schaff, The Creeds of Christendom, with a History and Critical Notes, 3 vols. (New York: Harper, 1919 edition of the 1877 work)',
               'The great creeds and confessions of the Church in the original languages and in English, with Schaff’s history: the Apostles’, Nicene and Athanasian Creeds and the Chalcedonian definition (volume 2 holds the Greek and Latin Creeds); the Catholic Tridentine profession; the Orthodox confessions of Peter Mogila and Dositheus; and the Lutheran, Reformed, Anglican (the Thirty-Nine Articles), Presbyterian (Westminster) and Baptist confessions (volume 3). Volume 1 is history; the English of volume 3 is the one to read first.',
               labels=['Volume 1 · history of the creeds', 'Volume 2 · the Greek and Latin creeds', 'Volume 3 · the Protestant creeds'],
               lib=('The Creeds of Christendom (Schaff, 1877): the Apostles’, Nicene and Athanasian Creeds and the Catholic, Orthodox and Protestant confessions', 'ec', '2nd–19th c. CE', 'ec', 'How the Bible got its shape')),
    'e-bco': G('thebookofconcord00unknuoft', 'The Book of Concord, or The Symbolical Books of the Evangelical Lutheran Church (Philadelphia: Lutheran Publication Society, 1911 edition; translation of Henkel and Jacobs)',
               'The confessional writings of the Lutheran Church: the Apostles’, Nicene and Athanasian Creeds, the Augsburg Confession and its Apology, the Schmalkald Articles, Luther’s Small and Large Catechisms and the Formula of Concord, with historical notes. ' + OLD,
               lib=('The Book of Concord: the Lutheran confessions, incl. the Augsburg Confession and Luther’s Small and Large Catechisms', 'ec', '1530–80 CE (ed. 1911)', 'ec', REF)),
    'e-trd': G('cu31924029369760', 'J. Waterworth (translator), The Canons and Decrees of the Sacred and Œcumenical Council of Trent (London: Dolman, 1848)',
               'The Catholic Church’s answer to the Reformation: the decrees on scripture and tradition, original sin, justification, the sacraments, the Mass, purgatory and the veneration of saints, with the canons that condemn error. ' + CAT,
               lib=('Canons and Decrees of the Council of Trent (trans. Waterworth, 1848)', 'ec', '1545–63 CE', 'ec', REF)),
    'e-ctr': G('thecatechismofth00donouoft', 'J. Donovan (translator), The Catechism of the Council of Trent, published by command of Pope Pius V (Baltimore: Murphy, 1829)',
               'The Roman Catechism for parish priests: the Creed, the sacraments, the Ten Commandments and the Lord’s Prayer explained in turn, as the Council of Trent asked in 1566. ' + CAT,
               lib=('The Catechism of the Council of Trent (trans. Donovan, 1829)', 'ec', '1566 CE', 'ec', REF)),
    'e-ltt': G('cu31924029255184', 'William Hazlitt (translator), The Table Talk of Martin Luther (London: George Bell, 1872)',
               'Luther’s talk at his own table, written down by students and friends: on God, faith, the devil, marriage, music, the Pope, the Turks, doctors and children, in blunt and often earthy words. Some of it is harsh; read it in its time.',
               lib=('The Table Talk of Martin Luther (trans. Hazlitt, 1872)', 'ec', '1531–46 CE', 'ec', REF)),
    'e-lbw': G('martinlutheronth00luthuoft', 'Henry Cole (translator), Martin Luther on the Bondage of the Will: written in answer to the Diatribe of Erasmus on Free Will (London: T. Bensley, 1823)',
               'Luther’s reply to Erasmus on whether the human will is free in matters of salvation, the book he said was the best he had written. ' + OLD,
               lib=('On the Bondage of the Will (Luther, trans. Cole, 1823)', 'ec', '1525 CE', 'ec', REF)),
    'e-fox': G('PG22400', 'John Foxe, Fox’s Book of Martyrs (Project Gutenberg #22400)',
               'The Protestant martyrology: the story of Christians put to death from the early Church to the burnings under Mary I, with woodcuts. It shaped English-speaking Protestant memory, and is partisan in its treatment of Catholics.',
               lib=('Fox’s Book of Martyrs (John Foxe, 1563)', 'ec', '1563 CE', 'ec', REF)),
    'e-scl': G('seriouscalltode00laww', 'William Law, A Serious Call to a Devout and Holy Life, adapted to the state and condition of all orders of Christians (London, 1729)',
               'A practical guide to a holy life for the ordinary Christian, by an Anglican non-juror who taught that all of life, including work and spending, belongs to the praise of God. It shaped John Wesley.',
               lib=('A Serious Call to a Devout and Holy Life (William Law, 1729)', 'ec', '1729 CE', 'ec', REF)),
    'e-hlv': G('ruleandexercises00tayl', 'Jeremy Taylor, The Rule and Exercises of Holy Living (London: Rivingtons, 1890; first published 1650)',
               'The Anglican bishop’s handbook for the hours of the day and the virtues: sobriety, justice, religion and the exercises that fill each hour, with the prayers. The twin of his Holy Dying.',
               lib=('The Rule and Exercises of Holy Living (Jeremy Taylor, 1650)', 'ec', '1650 CE', 'ec', REF)),
    'e-and': G('lancelotandrewes00andruoft', 'Lancelot Andrewes, Private Devotions, with a biography, a transcript of the original Greek, Latin and Hebrew manuscript, and translation by Alexander Whyte (Edinburgh: Oliphant, Anderson & Ferrier, 1896)',
               'The private prayer book of the bishop who helped to make the King James Bible: the daily prayers for each day of the week, of repentance, of thanksgiving and for the dead, in Greek, Latin and Hebrew, with his English. The Library keeps the English; some Greek and Hebrew come through as noise.',
               lib=('The Private Devotions of Lancelot Andrewes (1896 edition)', 'ec', 'c. 1600–26 CE', 'ec', REF)),
    'e-wss': G('10305045.76.emory.edu', 'John Wesley, Wesley’s Standard Sermons, edited by Edward H. Sugden, 2 vols. (London: Epworth Press, 1920)',
               'The forty-four sermons that make up the doctrinal standard of Methodism, with Sugden’s notes: on salvation by faith, assurance, Christian perfection, the Sermon on the Mount, and the use of money. Wesley preached in the open air to the poor of England.',
               lib=('Wesley’s Standard Sermons (ed. Sugden, 1920)', 'ec', '1738–91 CE', 'ec', REF)),

    # ── Syriac, Ethiopic and East Asian Christian writings ──
    'e-bee': G('bookofbee00solo', 'E. A. Wallis Budge (translator), The Book of the Bee, by Solomon of Basra, in Anecdota Oxoniensia, Semitic Series vol. 1 part 2 (Oxford: Clarendon Press, 1886)',
               'A thirteenth-century Syriac book of Christian lore from the Church of the East: the story of the world from Creation to the Resurrection as that church told it, with Adam, Noah, Abraham, the prophets and Christ, and many legends. ' + OLD,
               lib=('The Book of the Bee (Solomon of Basra, trans. Budge, 1886): a Church of the East chronicle of the world', 'ec', 'c. 1222 CE', 'ec', 'Augustine and Benedict')),
    'e-mbv': G('gri_33125008690600', 'E. A. Wallis Budge (translator), The Miracles of the Blessed Virgin Mary, and the Life of Hannâ (Saint Anne) and the Magical Prayers of ‘Aheta Mikâêl (London: Lee Warner, 1900)',
               'The Ethiopian Christian book of Mary: the Miracles of the Virgin (Ta’ammera Maryam, in 200 stories), the life of Hanna, and the magical prayers of Aheta Mikael, in Budge’s English from the Ethiopic. An Ethiopian Orthodox devotional favourite. ' + OLD,
               lib=('The Miracles of the Blessed Virgin Mary (trans. Budge, 1900): the Ethiopian book of Mary', 'ec', 'c. 1400 CE', 'ec', MYST)),
    'e-mss': G('b28037650', 'E. A. Wallis Budge (translator), The Lives of Mabâ’ Seyôn and Gabra Krestôs: the Ethiopic texts edited with English translations (London: Lee Warner, 1898)',
               'Lives of two Ethiopian Orthodox saints (14th and 15th centuries) from Ethiopic manuscripts, with their miracles and their austerities. The only Ethiopian saints’ lives in the Library. ' + OLD,
               lib=('Lives of Mabâ’ Seyôn and Gabra Krestôs (trans. Budge, 1898): Ethiopian saints', 'ec', 'c. 14th–15th c. CE', 'eth', MYST)),
    'e-eph': G('selectworksofsep41ephr', 'J. B. Morris (translator), Select Works of S. Ephrem the Syrian, translated out of the original Syriac, with notes and indices (Oxford: John Henry Parker, 1847)',
               'Hymns and homilies of Ephrem the Syrian (d. 373), the “harp of the Holy Spirit”: the hymns on the Nativity, the Epiphany, the Passion, Paradise and the Faith, in the English of the Library of the Fathers. The Library’s other Ephrem is in NPNF series 2, vol. 13. ' + OLD,
               lib=('Select Works of Ephrem the Syrian (trans. Morris, 1847): hymns and homilies', 'ec', 'c. 363–373 CE', 'ec', 'The desert fathers and mothers')),
    'e-nes': G('nestorianmove00saekuoft', 'P. Y. Saeki, The “Nestorian” Monument in China (London: SPCK, 1916)',
               'The Xi’an stele of 781 CE, set up by the Church of the East in Chang’an, in Chinese and Syriac, with Saeki’s English and his history of Nestorian Christianity in China in the Tang age. The stele is the oldest monument of Christianity in East Asia. Saeki died in 1965, so his English may still be protected in some countries.',
               lib=('The “Nestorian” Monument in China (Saeki, 1916): the Xi’an stele of 781', 'ec', '781 CE', 'ec', 'Tang Buddhism, Chan and the Japanese myths')),
}
