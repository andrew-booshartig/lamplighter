"""Texts from Global Grey ebooks (globalgreyebooks.com), taken from each book's "read online" page: clean typed text in chapters, with footnotes, from public-domain
editions. Used where the Internet Archive scan is only OCR, or where the book is not on Project Gutenberg. Global Grey's terms allow personal use and allow the files to be
hosted elsewhere only when all its branding, the logo and the website name, has been removed from them. So the page chrome (logo, menu, donation text) is dropped here, and
nothing built from this module names Global Grey or links its pages: each text's credit names the original edition, its licence line says 'a typed copy of the printed edition' and
its src is the address of the same printed edition on Project Gutenberg or the Internet Archive (gg_editions.json), or empty where none was found. The address each book is fetched from stays in this module (GG and the slug in SPECS) and in the cache, which is not shipped.

Run through build_texts.py (see the hook there): python3 -I tools/build_texts.py --only=v-voice,...
"""
import html, json, pathlib, re

GG = 'https://www.globalgreyebooks.com/'
# where the same printed edition can be found (Project Gutenberg, the Internet Archive): chosen by comparing each text with the candidate editions, kept in gg_editions.json
_ed = pathlib.Path(__file__).with_name('gg_editions.json'); EDITIONS = json.loads(_ed.read_text(encoding='utf-8')) if _ed.exists() else {}
LICENSE = 'Public domain (edition first published before 1929); a typed copy of the printed edition'
GRIMOIRE = 'A historical grimoire, kept here as a document in the history of magic, not as an endorsement.'
FIELD = ('A record made by an outside observer in the colonial or missionary period: it reports what he saw or was told, in his period’s terms and with its '
         'prejudices. Read it critically, and where a tradition’s own people have published their own account, read that as well.')
FOLK = ('Tales and beliefs written down by an outsider in the colonial or missionary period, often retold in his own style. Read it critically, and where a '
        'people’s own storytellers have published their own versions, read those as well.')
LORE = ('A collection made by an antiquarian or scholar of his period, who edited, retold and explained what he heard. Read it as a source on what was told and on what the collector '
        'made of it, and read living tellers’ own accounts beside it.')
WITCH = ('A book about the witch hunts and popular belief in magic, written for readers of its own period. Its claims about witches are not evidence that witchcraft worked: the trials sent '
         'thousands of innocent people, most of them women, to their deaths.')
FOLKT = ('A collection of tales made by a missionary, official, scholar or writer of his period, who chose, translated and often retold them in his own style. Read it as a source on what '
         'was told and on what the collector made of it, and read the community’s own published versions beside it.')
THEO = 'A primary source of the Theosophical movement, kept here as a document in the history of modern esotericism: its claims about ancient history are not accepted by scholars.'


def G(slug, by, note='', **kw):
    d = dict(slug=slug, by=by, note=note); d.update(kw); return d


SPECS = {
    'v-voice': G('voice-of-the-silence', 'H. P. Blavatsky, The Voice of the Silence (1889)', 'Selected “Golden Precepts” from the Book of the Golden Precepts, in Blavatsky’s English with her preface and notes. ' + THEO),
    # ── Hermetic, alchemical and Rosicrucian
    'h-virg': G('virgin-of-the-world-of-hermes-mercurius-trismagistus', 'Anna Kingsford and Edward Maitland (translators), The Virgin of the World of Hermes Mercurius Trismegistus (London: George Redway, 1885)',
                'A Hermetic dialogue (the Kore Kosmou) in Kingsford and Maitland’s English, with their introduction. Their version is loose by later standards: Mead’s (in Thrice-Greatest Hermes, also in this Library) is closer to the Greek.'),
    'h-atwo': G('suggestive-inquiry-into-the-hermetic-mystery', 'Mary Anne Atwood, A Suggestive Inquiry into the Hermetic Mystery (London: Trelawney Saunders, 1850)',
                'A Victorian reading of alchemy as a spiritual process rather than a chemical one. Historians of chemistry do not accept her thesis, but the book shaped the later occult reading of alchemy.'),
    'h-arca': G('hermetic-arcanum', 'The Hermetic Arcanum: the secret work of the Hermetic philosophy', 'A short seventeenth-century alchemical treatise in English.'),
    'h-lives': G('lives-of-alchemystical-philosophers', 'Arthur Edward Waite, Lives of Alchemystical Philosophers (London: George Redway, 1888)', 'Waite’s biographical sketches of the alchemists, with a critical account of the literature of alchemy.'),
    'h-coll': G('collectanea-chemica', 'Arthur Edward Waite (editor), Collectanea Chemica: Being Certain Select Treatises on Alchemy and Hermetic Medicine (London: James Elliott, 1893)', 'Short alchemical treatises in English, with Waite’s preface.'),
    'h-casket': G('golden-and-blessed-casket-of-natures-marvels', 'Benedictus Figulus, A Golden and Blessed Casket of Nature’s Marvels (Pandora magnalium naturalium aurea et benedicta, 1608), translated by Arthur Edward Waite (London: James Elliott, 1893)',
                  'A collection of Paracelsian and alchemical writings of the early seventeenth century.'),
    'h-open': G('open-entrance-to-the-closed-palace-of-the-king', 'Eirenaeus Philalethes, An Open Entrance to the Closed Palace of the King (Introitus apertus ad occlusum regis palatium, 1667)',
                'A seventeenth-century alchemical treatise in the allegorical style of its time. “Philalethes” is a pseudonym, often identified with the English alchemist George Starkey.'),
    'h-rosi': G('real-history-of-the-rosicrucians', 'Arthur Edward Waite, The Real History of the Rosicrucians (London: George Redway, 1887)', 'Waite’s history of the Rosicrucian manifestos and of the later movements that took the name.'),
    'h-gaba': G('comte-de-gabalis', 'Henri de Montfaucon de Villars, Comte de Gabalis (Paris, 1670), in an English translation of 1913',
                'A witty French dialogue in which a “Rosicrucian” explains the elemental spirits (sylphs, gnomes, undines and salamanders) to the narrator. It is partly satire, and it gave later literature its elementals.'),
    # ── Ceremonial magic, grimoires and divination
    'm-magus': G(['magus-a-complete-system-of-occult-philosophy-book-1', 'magus-a-complete-system-of-occult-philosophy-book-2'], 'Francis Barrett, The Magus, or Celestial Intelligencer (London, 1801)',
                 'Barrett’s compendium, mostly adapted from Agrippa and other earlier writers, that brought ceremonial magic back into English print. ' + GRIMOIRE, labels=['Book 1', 'Book 2']),
    'm-cerem': G('book-of-ceremonial-magic', 'Arthur Edward Waite, The Book of Ceremonial Magic (London: William Rider & Son, 1911)',
                 'Waite’s survey of the grimoires (with extracts) and of the pacts and rites they describe, with his own sceptical commentary; a revision of his Book of Black Magic and of Pacts (1898). ' + GRIMOIRE),
    'm-arbat': G('arbatel-of-magick', 'Robert Turner (translator), Arbatel of Magick (London, 1655), from the Latin Arbatel de magia veterum (Basel, 1575)',
                 'A Renaissance book of magical aphorisms that is largely about prayer, the Spirit of God and the seven “Olympic” spirits; unlike most grimoires it forbids harm. ' + GRIMOIRE),
    'm-pull': G('black-pullet', 'The Black Pullet (La Poule Noire), an eighteenth-century French grimoire', 'Its claimed origin (a talisman-book from Egypt) is not credible. ' + GRIMOIRE),
    'm-grand': G('grand-grimoire', 'The Grand Grimoire, with the Great Clavicle of Solomon, an eighteenth-century French grimoire', 'Its subject is the making of pacts with devils. ' + GRIMOIRE),
    'm-murr': G('witch-cult-in-western-europe', 'Margaret Alice Murray, The Witch-Cult in Western Europe (Oxford: Clarendon Press, 1921)',
                'Murray’s argument that the witch-trial records preserve a surviving pre-Christian religion. Historians no longer accept her thesis; the book is kept for the trial evidence it quotes and as a landmark in the history of the idea.'),
    'm-arad': G('aradia-or-the-gospel-of-the-witches', 'Charles Godfrey Leland, Aradia, or the Gospel of the Witches (London: David Nutt, 1899)',
                'Leland’s account of Tuscan folk-witchcraft, from one informant whom he called Maddalena. Scholars doubt how old or how widespread what she gave him was.'),
    # ── Spiritualism, Theosophy and New Thought
    'v-key': G('key-to-theosophy', 'H. P. Blavatsky, The Key to Theosophy (London, 1889)', 'Theosophy explained in questions and answers, in her own words. ' + THEO),
    'v-ocean': G('ocean-of-theosophy', 'William Q. Judge, The Ocean of Theosophy (New York: The Path, 1893)', 'A short summary of Theosophical teaching by the movement’s American leader.'),
    'v-anci': G('ancient-wisdom', 'Annie Besant, The Ancient Wisdom: An Outline of Theosophical Teachings (London: Theosophical Publishing Society, 1897)', 'A systematic outline of Theosophical doctrine by its second president.'),
    'v-doyle': G(['history-of-spiritualism-vol-i', 'history-of-spiritualism-vol-ii'], 'Arthur Conan Doyle, The History of Spiritualism, 2 vols. (London: Cassell, 1926)',
                 'A believer’s history of Spiritualism from the Fox sisters to the 1920s, by the creator of Sherlock Holmes. It repeats as fact some claims (including about mediums since shown to be frauds): read it as the movement’s own account.', labels=['Volume 1', 'Volume 2']),
    # ── Freemasonry and the Old Charges
    'k-arca': G('arcane-schools', 'John Yarker, The Arcane Schools: A Review of Their Origin and Antiquity, with a General History of Freemasonry (Belfast: William Tait, 1909)',
                'Yarker’s long history of the craft and its “higher degrees”, tracing them to the ancient mysteries; historians of Freemasonry find that lineage unproven.'),
    'k-vail': G('ancient-mysteries-and-modern-masonry', 'Charles H. Vail, Ancient Mysteries and Modern Masonry (New York: Macoy Publishing, 1909)', 'Lectures on the ancient mysteries and the likeness the author finds in Masonic teaching.'),
    'k-glim': G('glimpses-of-masonic-history', 'C. W. Leadbeater, Glimpses of Masonic History (Adyar: Theosophical Publishing House, 1926)',
                'A Theosophist’s account of the craft from the ancient mysteries onward, part of it from claimed clairvoyant investigation; scholars do not accept it as history.'),
    'k-armi': G('short-masonic-history', 'Frederick Armitage, A Short Masonic History (1909)', 'A short history of the craft.'),
    'k-apoc': G('apocalypse-of-freemasonry', 'F. de P. Castells, The Apocalypse of Freemasonry (London, 1924)', 'A Masonic reading of the craft’s symbols.'),
    'k-buil': G('builders', 'Joseph Fort Newton, The Builders: A Story and Study of Masonry (Cedar Rapids: The Torch Press, 1914)', 'A popular, devotional history of the craft by a Masonic author and clergyman, widely read in the lodges of the early twentieth century.'),
    # ── Tribal and animist traditions: field records
    'a-nass': G('fetichism-in-west-africa', 'Robert Hamill Nassau, Fetichism in West Africa: Forty Years’ Observation of Native Customs and Superstitions (New York: Charles Scribner’s Sons, 1904)', 'A missionary’s record of beliefs in Gabon and the Congo coast. ' + FIELD),
    'a-yoru': G('yoruba-speaking-peoples-of-the-slave-coast-of-west-africa', 'A. B. Ellis, The Yoruba-Speaking Peoples of the Slave Coast of West Africa: Their Religion, Manners, Customs, Laws, Language, etc. (London: Chapman and Hall, 1894)', 'A colonial officer’s survey of Yoruba religion and the orisha. ' + FIELD),
    'a-dent': G('at-the-back-of-the-black-mans-mind', 'R. E. Dennett, At the Back of the Black Man’s Mind, or Notes on the Kingly Office in West Africa (London: Macmillan, 1906)', 'A trader’s record of Kongo beliefs about kingship, the dead and the spirit-world. ' + FIELD),
    'a-balo': G('baloma-the-spirits-of-the-dead-in-the-trobriand-islands', 'Bronisław Malinowski, Baloma: The Spirits of the Dead in the Trobriand Islands (Journal of the Royal Anthropological Institute, 1916)',
                'The Trobriand beliefs about death and the spirit-world: one of the first reports from a fieldworker who lived among the people and learned their language. ' + FIELD),
    'a-wins': G('shaman-saiva-and-sufi', 'Richard Olaf Winstedt, Shaman, Saiva and Sufi: A Study of the Evolution of Malay Magic (London: Constable, 1925)', 'How a colonial scholar reads Malay folk religion as layers of animist, Hindu and Muslim belief. ' + FIELD),
    'a-algo': G('algonquin-legends-of-new-england', 'Charles G. Leland, The Algonquin Legends of New England, or Myths and Folk Lore of the Micmac, Passamaquoddy and Penobscot Tribes (Boston: Houghton Mifflin, 1884)', FOLK),
    'a-zuni': G('zuni-folk-tales', 'Frank Hamilton Cushing, Zuñi Folk Tales (New York: G. P. Putnam’s Sons, 1901)', FOLK),
    'a-aust': G('australian-legendary-tales', 'K. Langloh Parker, Australian Legendary Tales: Folk-Lore of the Noongahburrahs as Told to the Piccaninnies (London: David Nutt, 1896)', FOLK),
    'a-ocea': G('oceanic-mythology', 'Roland B. Dixon, Oceanic Mythology (The Mythology of All Races, volume 9; Boston: Marshall Jones, 1916)', 'A survey of the myths of Polynesia, Melanesia, Micronesia and Indonesia, region by region. ' + FIELD),
    'a-newm': G('myths-of-the-new-world', 'Daniel G. Brinton, The Myths of the New World: A Treatise on the Symbolism and Mythology of the Red Race of America (New York: Leypoldt & Holt, 1868)',
                'A nineteenth-century comparative study of American Indian religion; its method and its theories are dated. ' + FIELD),
    'a-aino': G('aino-folk-tales', 'Basil Hall Chamberlain, Aino Folk-Tales (London: Folk-Lore Society, 1888)', FOLK),
    'a-kaff': G('kaffir-xhosa-folk-lore', 'George McCall Theal, Kaffir Folk-Lore, or a Selection from the Traditional Tales Current Among the People Living on the Eastern Border of the Cape Colony (London: Swan Sonnenschein, 1882)',
                'The title uses a word now regarded as a slur; the tales are Xhosa. ' + FOLK),
    'a-talb': G('womans-mysteries-of-a-primitive-people', 'D. Amaury Talbot, Woman’s Mysteries of a Primitive People: The Ibibios of Southern Nigeria (London: Cassell, 1915)', 'A district officer’s wife’s record of Ibibio women’s rites and beliefs. ' + FIELD),
    'a-kroe': G('indian-myths-of-south-central-california', 'A. L. Kroeber, Indian Myths of South Central California (University of California Publications in American Archaeology and Ethnology, vol. 4, no. 4, 1907)', FOLK),
    # ── Folklore and the fairy faith: Britain and Ireland
    'l-kirk': G('secret-commonwealth-of-elves-fauns', 'Robert Kirk, The Secret Commonwealth of Elves, Fauns and Fairies (written 1691; first printed 1815), with Andrew Lang’s introduction and comment (London: David Nutt, 1893)',
                'A short account, written in 1691 by a Gaelic-speaking Scottish minister, of the “subterranean people” as his parishioners described them, with Lang’s long introduction on the book and its author, and his comment. ' + LORE),
    'l-crok': G('fairy-legends-and-traditions-of-the-south-of-ireland', 'Thomas Crofton Croker, Fairy Legends and Traditions of the South of Ireland (London: John Murray, 1825–28)',
                'The first large collection of Irish fairy tales, with Croker’s notes and (in this edition) Thomas Keightley’s. Croker polished what his informants told him. ' + LORE),
    'l-robi': G('traditions-of-lancashire', 'John Roby, Traditions of Lancashire, first and second series (London, 1829–31; this is the fourth edition, 1872)', 'Legends of Lancashire houses, fairies and ghosts, retold by a local banker in a literary style. ' + LORE),
    'l-camp': G('popular-tales-of-the-west-highlands-vols-1-4', 'John Francis Campbell, Popular Tales of the West Highlands, orally collected, with a translation, 4 vols. (Edinburgh: Edmonston and Douglas, 1860–62; revised edition, Paisley: Alexander Gardner, 1890–93)',
                'The Gaelic storytellers’ tales as Campbell and his collectors took them down, with his translations and notes: a landmark of folklore collecting. ' + LORE),
    'l-hunt': G('popular-romances-of-the-west-of-england', 'Robert Hunt, Popular Romances of the West of England, or the Drolls, Traditions and Superstitions of Old Cornwall (first published London: John Camden Hotten, 1865; this is the third edition, London: Chatto and Windus, 1881)',
                'Cornish giants, piskies, saints and mermaids, drawn from the “drolls” told at firesides. ' + LORE),
    'l-kenn': G('legendary-fictions-of-the-irish-celts', 'Patrick Kennedy, Legendary Fictions of the Irish Celts (London: Macmillan, 1866)', 'Tales and beliefs from Wexford, gathered by a Dublin bookseller. ' + LORE),
    'l-bott': G(['traditions-and-hearthside-stories-of-west-cornwall-vol-1', 'traditions-and-hearthside-stories-of-west-cornwall-vol-2'],
                'William Bottrell, Traditions and Hearthside Stories of West Cornwall, first series (Penzance, 1870) and second series (Penzance, 1873)',
                'Tales told in West Cornwall by the fireside, with the author’s notes on the customs behind them. The third series (1880) is not in this entry. ' + LORE, labels=['First series', 'Second series']),
    'l-sike': G('british-goblins', 'Wirt Sikes, British Goblins: Welsh Folk-Lore, Fairy Mythology, Legends and Traditions (London: Sampson Low, 1880)', 'Welsh fairies, ghosts and customs, by an American consul in Cardiff. ' + LORE),
    'l-greo': G('folk-lore-of-the-north-east-of-scotland', 'Walter Gregor, Folk-Lore of the North-East of Scotland (London: Folk-Lore Society, 1881)', 'Customs and beliefs of Aberdeenshire and Banffshire, by a parish minister and dialect scholar. ' + LORE),
    'l-wild': G('ancient-legends-mystic-charms-and-superstitions-of-ireland', 'Lady Wilde, Ancient Legends, Mystic Charms, and Superstitions of Ireland (London: Ward and Downey, 1887)', 'Irish tales and beliefs written down by the poet and nationalist Jane Francesca Wilde (“Speranza”), the mother of Oscar Wilde. ' + LORE),
    'l-yeat': G('fairy-and-folk-tales-of-the-irish-peasantry', 'W. B. Yeats (editor), Fairy and Folk Tales of the Irish Peasantry (London: Walter Scott, 1888)', 'Yeats’s selection from Croker, Carleton, Kennedy and others, with his introduction and notes. ' + LORE),
    'l-cour': G('cornish-feasts-and-folk-lore', 'Margaret Ann Courtney, Cornish Feasts and Folk-Lore (Penzance, 1890)', 'The Cornish year in feasts, customs, charms and sayings. ' + LORE),
    'l-crss': G('tales-of-the-dartmoor-pixies', 'William Crossing, Tales of the Dartmoor Pixies (1890)', 'Tales and traditions of the Dartmoor pixies from the moor’s own people. ' + LORE),
    'l-curt': G('myths-and-folk-lore-of-ireland', 'Jeremiah Curtin, Myths and Folk-Lore of Ireland (Boston: Little, Brown, 1890)', 'Tales Curtin took down in Irish and in English from storytellers in Kerry, Cork and Donegal. ' + LORE),
    'l-moor': G('folk-lore-of-the-isle-of-man', 'A. W. Moore, The Folk-Lore of the Isle of Man (Douglas: Brown and Son, 1891)', 'Manx customs, fairy belief, charms and legends, with their sources. ' + LORE),
    'l-twil': G('celtic-twilight', 'W. B. Yeats, The Celtic Twilight: Men and Women, Dhouls and Faeries (London: Lawrence and Bullen, 1893; this is the enlarged edition of 1902)', 'Short sketches by the poet of the fairy and ghost belief he met in Sligo, half reportage and half literature. ' + LORE),
    'l-larm': G('west-irish-folk-tales-and-romances', 'William Larminie, West Irish Folk-Tales and Romances (London: Elliot Stock, 1893)', 'Tales taken down in Irish from storytellers in Connacht, with Larminie’s translation. ' + LORE),
    'l-doug': G('scottish-fairy-and-folk-tales', 'Sir George Douglas, Scottish Fairy and Folk Tales (London: Walter Scott, 1893)', 'Douglas’s selection of Scottish fairy and folk tales from earlier collectors, retold. ' + LORE),
    'l-cur2': G('tales-of-the-fairies-and-of-the-ghost-world', 'Jeremiah Curtin, Tales of the Fairies and of the Ghost World, collected from oral tradition in South-West Munster (London: David Nutt, 1895)', 'Fairy and ghost tales from Irish-speaking storytellers in Munster, with Curtin’s account of the belief behind them. ' + LORE),
    'l-rhys': G('celtic-folklore-welsh-and-manx', 'John Rhys, Celtic Folklore, Welsh and Manx, 2 vols. (Oxford: Clarendon Press, 1901)', 'The Oxford professor of Celtic’s survey of Welsh and Manx fairy belief and legend, with his theories about the origins of the fairies, which later scholars do not accept. ' + LORE, drop='^Note On Transcription'),
    'l-fair': G('fairy-faith-in-celtic-countries', 'W. Y. Evans-Wentz, The Fairy-Faith in Celtic Countries (Oxford: Henry Frowde, 1911)',
                'Evans-Wentz’s survey of fairy belief in Ireland, Scotland, Wales, the Isle of Man, Cornwall and Brittany, built on interviews he made in the field and on older sources. His own theory that the fairies are real beings of another order is his, and the interviews are evidence of what people told him. ' + LORE),
    'l-greg': G('visions-and-beliefs-in-the-west-of-ireland', 'Lady Gregory, Visions and Beliefs in the West of Ireland (London and New York: G. P. Putnam’s Sons, 1920)', 'Lady Gregory’s record of what her neighbours around Coole told her about fairies, ghosts and second sight, with Yeats’s notes. ' + LORE),
    # ── Folklore, custom and the study of folklore: Europe
    'l-keig': G('fairy-mythology', 'Thomas Keightley, The Fairy Mythology, illustrative of the romance and superstition of various countries (London, 1828; revised edition 1850)', 'The first comparative survey of fairy belief in Europe and beyond, with Keightley’s retellings. ' + LORE),
    'l-curi': G('curious-myths-of-the-middle-ages', 'Sabine Baring-Gould, Curious Myths of the Middle Ages (London: Rivingtons, 1866)', 'The Wandering Jew, Prester John, the Pied Piper, William Tell, the Man in the Moon and other medieval legends, traced to their sources. ' + LORE),
    'l-webs': G('basque-legends', 'Wentworth Webster, Basque Legends (London: Griffith, Farran, 1877)', 'Tales and beliefs collected in the French Basque country, with Webster’s notes. ' + LORE),
    'l-this': G('folk-lore-of-shakespeare', 'T. F. Thiselton-Dyer, The Folk-Lore of Shakespeare (London: Griffith and Farran, 1883)', 'The superstitions, customs and country sayings in Shakespeare’s plays, set beside what folklorists had recorded. ' + LORE),
    'l-cran': G('italian-popular-tales', 'Thomas Frederick Crane, Italian Popular Tales (Boston: Houghton Mifflin, 1885)', 'Tales from the Italian collectors, with Crane’s introduction on how folk tales travel. ' + LORE),
    'l-moon': G('moon-lore', 'Timothy Harley, Moon Lore (London: Swan Sonnenschein, Lowrey, 1885)', 'Beliefs, customs and stories about the moon from many peoples, with its place in weather and planting lore. ' + LORE),
    'l-mont': G('legends-and-popular-tales-of-the-basque-people', 'Mariana Monteiro, Legends and Popular Tales of the Basque People (London: Sampson Low, 1887)', 'Basque tales retold in English by a Portuguese writer. ' + LORE),
    'l-wrat': G('sixty-folk-tales-from-exclusively-slavonic-sources', 'A. H. Wratislaw, Sixty Folk-Tales from Exclusively Slavonic Sources (London: Elliot Stock, 1889)', 'Tales translated from Czech, Serbian, Russian and other Slavic collections, with the translator’s notes. ' + LORE),
    'l-ward': G('georgian-folk-tales', 'Marjory Wardrop, Georgian Folk Tales (London: David Nutt, 1894)', 'Tales from the Caucasus, translated by the English scholar who learned Georgian. ' + LORE),
    'l-groo': G('gypsy-folk-tales', 'Francis Hindes Groome, Gypsy Folk-Tales (London: Hurst and Blackett, 1899)', 'Tales told by Romani people in England, Hungary, Romania and elsewhere, written down by a leading gypsiologist of his day. ' + LORE),
    'l-xmas': G('christmas-in-ritual-and-tradition', 'Clement A. Miles, Christmas in Ritual and Tradition, Christian and Pagan (London: T. Fisher Unwin, 1912)', 'The history of the Christmas season and its customs, from the Roman Saturnalia to carols and the Yule log, by a folklorist. ' + LORE),
    'l-bret': G('legends-and-romances-of-brittany', 'Lewis Spence, Legends and Romances of Brittany (London: George G. Harrap, 1917)', 'Breton folk belief, saints’ legends and Arthurian tales, retold by a popular Scottish mythologist. ' + LORE),
    'l-hall': G('book-of-halloween', 'Ruth Edna Kelley, The Book of Hallowe’en (Boston: Lothrop, Lee and Shepard, 1919)', 'The history and customs of Hallowe’en in Britain and America. ' + LORE),
    'l-fune': G('funeral-customs', 'Bertram S. Puckle, Funeral Customs: Their Origin and Development (London: T. Werner Laurie, 1926)', 'Burial customs from antiquity to the early twentieth century and what lay behind them. ' + LORE),
    # ── Witchcraft, demonology and popular belief
    'w-were': G('book-of-were-wolves', 'Sabine Baring-Gould, The Book of Were-Wolves (London: Smith, Elder, 1865)', 'Werewolf belief and trials in Europe, with the best-known cases. ' + WITCH),
    'w-conw': G(['demonology-and-devil-lore-volume-1', 'demonology-and-devil-lore-volume-2'], 'Moncure Daniel Conway, Demonology and Devil-Lore, 2 vols. (London: Chatto and Windus, 1879)',
                'A comparative history of devils and demons across religions, by a freethinking American minister. ' + WITCH, labels=['Volume 1', 'Volume 2']),
    'w-adam': G('witch-warlock-and-magician', 'W. H. Davenport Adams, Witch, Warlock, and Magician: Historical Sketches of Magic and Witchcraft in England and Scotland (London: Chatto and Windus, 1889)', 'Cases of witchcraft and magic in Britain, from the early Middle Ages to the eighteenth century. ' + WITCH),
    'w-gyps': G('gypsy-sorcery-and-fortune-telling', 'Charles G. Leland, Gypsy Sorcery and Fortune Telling (London: T. Fisher Unwin, 1891)', 'Romani charms, spells and fortune-telling practices as Leland collected them. ' + WITCH),
    'w-hors': G('magic-of-the-horse-shoe', 'Robert Means Lawrence, The Magic of the Horse-Shoe, with other folk-lore notes (Boston: Houghton Mifflin, 1898)', 'The horseshoe as a luck charm, with other folk beliefs and superstitions. ' + WITCH),
    'w-camp': G('witchcraft-and-second-sight-in-the-highlands-and-islands-of-scotland', 'John Gregorson Campbell, Witchcraft and Second Sight in the Highlands and Islands of Scotland (Glasgow: James MacLehose, 1902)', 'Highland belief in witches, charms and the second sight, from a minister who knew Gaelic well. ' + WITCH),
    'w-know': G('origins-of-popular-superstitions-and-customs', 'T. Sharper Knowlson, The Origins of Popular Superstitions and Customs (London: T. Werner Laurie, 1910)', 'Common English superstitions (luck, omens, charms, days and numbers) traced to their sources. ' + WITCH),
    'w-vamp': G('vampire-his-kith-and-kin', 'Montague Summers, The Vampire: His Kith and Kin (London: Kegan Paul, 1928)', 'Summers’s survey of vampire belief across Europe and beyond. Summers himself believed in the creatures he wrote about, so read his argument as his own. ' + WITCH),
    # ── Folk tales beyond Europe
    't-smit': G('ancient-tales-and-folk-lore-of-japan', 'Richard Gordon Smith, Ancient Tales and Folk-Lore of Japan (London: A. and C. Black, 1908)', 'Tales and beliefs of the Japanese countryside, gathered by an English traveller in Japan and retold by him. ' + FOLKT),
    't-hear': G('kwaidan', 'Lafcadio Hearn, Kwaidan: Stories and Studies of Strange Things (Boston: Houghton Mifflin, 1904)', 'Hearn’s retellings of Japanese ghost stories, with his short essays on insects. He wrote them in his own literary English from Japanese books and from his wife’s telling. ' + FOLKT),
    't-gale': G('korean-folk-tales-imps-ghosts-and-fairies', 'Im Bang and Yi Ryuk, Korean Folk Tales: Imps, Ghosts and Fairies, translated by James S. Gale (London: J. M. Dent, 1913)', 'Tales of imps, ghosts and fairies from two Korean writers, in the English of a Canadian missionary. ' + FOLKT),
    't-cole': G('philippine-folk-tales', 'Mabel Cook Cole, Philippine Folk Tales (Chicago: A. C. McClurg, 1916)', 'Tales collected among peoples of the Philippines (the Tinguian, Bagobo and others) and retold by an American anthropologist. ' + FOLKT),
    't-wafr': G('west-african-folk-tales', 'W. H. Barker and Cecilia Sinclair, West African Folk-Tales (London: George G. Harrap, 1917)', 'Tales from peoples of the Gold Coast and Nigeria, collected by W. H. Barker and retold by Cecilia Sinclair. ' + FOLKT),
    't-honey': G('south-african-folk-tales', 'James A. Honey, South-African Folk-Tales (New York: Baker and Taylor, 1910)', 'Tales of the peoples of southern Africa, retold in English by James Honey. ' + FOLKT),
    't-kaw': G('legends-of-the-kaw', 'Carrie de Voe, Legends of the Kaw (Topeka, Kansas, 1904)', 'Legends of the Kaw (Kansa) people of Kansas as set down by a Kansas writer. ' + FOLKT),
    't-davi': G('myths-and-legends-of-japan', 'F. Hadland Davis, Myths and Legends of Japan (London: George G. Harrap, 1912)', 'A popular survey of Japanese myth, folk tale and legend, retold. ' + FOLKT),
    't-wern': G('myths-and-legends-of-china', 'E. T. C. Werner, Myths and Legends of China (London: George G. Harrap, 1922)', 'A survey of Chinese myth and legend by a British consular official, drawn from Chinese books. ' + FOLKT),
}


def online_html(fetch, CACHE, slug):
    page = fetch(GG + slug + '-ebook.html', CACHE / 'globalgrey' / (slug + '.page.html')).decode('utf-8', errors='replace')
    m = re.search(r'href="(https://www\.globalgreyebooks\.com/online-ebooks/[^"]+)"', page)
    if not m: raise RuntimeError('no online edition for ' + slug)
    return fetch(m.group(1), CACHE / 'globalgrey' / (slug + '.online.html')).decode('utf-8', errors='replace')


def inline(s):
    s = re.sub(r'<br\s*/?>', '\n', s)
    s = re.sub(r'<a\s+name="[^"]*"\s*>\s*</a>', '', s)
    s = re.sub(r'<[^>]+>', '', s)
    s = html.unescape(s).replace('\xa0', ' ')
    s = re.sub(r'[ \t]*\n[ \t]*', '\n', s)
    return re.sub(r'[ \t]{2,}', ' ', s).strip()


def sections(h):
    """The book's own text from a 'read online' page, as [heading, text] sections: each <h2> opens a section, <h3> and <h4> become '## ' lines."""
    art = re.search(r'<article\b[^>]*>', h)                 # the reading text; the menu, the chapter list and the footer sit outside it
    if art:
        e = h.find('</article>', art.end()); body = h[art.end(): e if e > 0 else len(h)]
    else:
        m = re.search(r'</h1>', h); body = h[m.end() if m else 0:]
    secs = []; cur = None; buf = []
    def flush():
        if cur is not None and any(b.strip() for b in buf): secs.append([cur, '\n\n'.join(b for b in buf if b.strip())])
    for m in re.finditer(r'<(h[234]|p|blockquote|li|pre)\b[^>]*>(.*?)</\1>', body, re.S):
        tag, inner = m.group(1), inline(m.group(2))
        if not inner or inner.startswith('↑') or inner == 'THE END': continue      # the page's own 'Back to top' link and end mark
        if tag == 'h2': flush(); cur = re.sub(r'\s+', ' ', inner); buf = []
        elif tag == 'h3' and inner.lower() == 'footnotes': flush(); cur = 'Footnotes'; buf = []
        elif tag in ('h3', 'h4'):
            if cur is None: cur = 'Text'
            buf.append('## ' + re.sub(r'\s+', ' ', inner))
        else:
            if cur is None: cur = 'Text'
            buf.append(inner)
    flush()
    return secs


def build(lib, fetch, CACHE):
    import build_texts_util as U
    res = {}
    for lid, spec in SPECS.items():
        if lid not in lib: continue
        try:
            slugs = spec['slug'] if isinstance(spec['slug'], list) else [spec['slug']]; labels = spec.get('labels')
            secs = []
            for k, sg in enumerate(slugs):
                part = sections(online_html(fetch, CACHE, sg))
                secs += [[('%s · %s' % (labels[k], h)) if labels else h, b] for h, b in part]
            if spec.get('drop'): secs = [s for s in secs if not re.search(spec['drop'], s[0])]
            secs = U.finish(secs, bool(spec.get('verse')))
            if not secs: print('  (no text)', lid); continue
            note = (spec['note'] + ' ' if spec.get('note') else '') + 'Typed text from a modern reading edition, so the spelling and punctuation of the original may have been tidied.'
            res[lid] = dict(secs=secs, by=spec['by'], license=LICENSE, src=EDITIONS.get(lid, ''), verse=bool(spec.get('verse')), note=note)
        except Exception as ex:
            print('  FAILED', lid, ex)
    return res
