/* ═══════════════════════════ 2x · Motifs: the stories, beliefs, rites and ways of living that turn up in many traditions ═══════════════════════════
   A short, hand-written list in the manner of a folklorist's motif index (Stith Thompson's, or the comparative religion handbooks): each entry names a theme and lists the words that
   usually mark it in English translation. A passage is tagged with a motif when it uses enough of them. This is crude on purpose and says so: it finds passages that use a theme's usual
   words, not passages that are certainly about it, so the page that shows the results calls them "found by words". The statistics in 2w-similar-core.js use the tags as one more signal
   (two passages with the same motif read closer), and the Motifs page uses them to line up how many traditions tell the same kind of story or keep the same kind of rite.
   Shape: [id, name, kind, one line, core words (3 each), supporting words (1 each), phrases (regular expressions, 4 each), minimum score]. A motif also needs at least one core word or phrase. */
if (typeof simTerms === 'undefined') globalThis.simTerms = require('./2w-similar-core.js').simTerms;   // when loaded alone by a node tool; in the page the core is already in scope
const SIM_MOTIF_KINDS = { story: 'Stories', belief: 'Beliefs', rite: 'Rites and practices', conduct: 'Ways of living' };
const SIM_MOTIF_DATA = [
  /* ── stories ── */
  ['flood', 'The great flood', 'story', 'A flood sent by the gods, a warned survivor, a boat, and the birds sent out afterwards.',
    'flood deluge ark', 'ship boat vessel dove raven swallow waters rain mountain survivor pitch cubits sacrifice rainbow olive window', ['dry land', 'the waters (?:abated|subsided|went down)', 'waters (?:were )?abated'], 5],
  ['chaos-waters', 'Before the world: water and darkness', 'story', 'The beginning as formless water, dark and silence, before anything is divided or named.',
    'chaos formless void abyss primeval nonexistence', 'waters deep darkness beginning divided separated firmament nothing silence dark waste emptiness', ['not yet (?:made|created|formed|existed)', 'there was (?:neither|no) (?:heaven|earth|sky)', 'in the beginning'], 5],
  ['world-giant', 'The world made from a giant’s body', 'story', 'A great being is killed or divided, and the sky, earth, seas and mountains are made of the pieces.',
    'giant primeval purusha ymir pangu tiamat', 'skull bones blood flesh hair sea mountains sky earth dismembered sacrificed limbs divided slain body made brain', ['from his (?:skull|blood|flesh|bones)'], 6],
  ['first-humans', 'How the first people were made', 'story', 'The first man and woman shaped from clay, dust, wood or maize, and given breath.',
    'clay mud dust molded fashioned adam eve', 'breath life image rib wood maize corn earth formed first man woman clay potter', ['first (?:man|woman|people|human)', 'out of (?:clay|dust|mud|the earth)'], 6],
  ['forbidden-fruit', 'The forbidden fruit and the serpent', 'story', 'A tree whose fruit is forbidden, a tempter, and the loss of a first innocence.',
    'serpent snake forbidden', 'fruit tree garden eden eat knowledge naked ashamed expelled paradise woman temptation apple good evil', ['(?:fruit|tree) of (?:knowledge|life)'], 6],
  ['paradise', 'A paradise or golden age', 'story', 'A time or place before toil and death, when people lived easily and in peace with gods and animals.',
    'paradise eden elysium', 'garden golden happy blessed sorrowless without toil peace first age islands fruit animals tame abode', ['golden age', 'land of the blessed'], 6],
  ['tower-babel', 'The tower and the scattering of peoples', 'story', 'People build toward heaven and are humbled, and their one speech is broken into many.',
    'tower babel', 'build brick heaven pride humbled languages scattered city speech confounded', ['one (?:language|speech|tongue)'], 5],
  ['underworld-descent', 'The descent to the underworld', 'story', 'A living person or god goes down to the land of the dead: through gates, past a guardian, and sometimes back.',
    'underworld descend descended', 'gate gates seven queen dead shades ferryman river judge naked stripped return ascend darkness dust abode path', ['land of no return', 'house of (?:darkness|dust)', 'went down (?:to|into)'], 6],
  ['dying-rising', 'The god who dies and rises', 'story', 'A slain or buried god mourned, then returned, tied to the cycle of the seasons or of the soul.',
    'resurrection resurrect risen revived reborn', 'slain dead mourning weeping lamentation spring grain returns tomb buried third raised awakened', ['third day', 'rose from the dead', 'rising again'], 6],
  ['miraculous-birth', 'The wondrous birth', 'story', 'A hero or teacher born of a virgin or by a sign: a star, an angel, a dream, a threatened infant.',
    'virgin conceived miraculous annunciation', 'mother child star angel spirit royal infant birth shepherds wise dream womb born queen', ['born of (?:a )?virgin', 'conceived (?:by|of)'], 6],
  ['dragon-slaying', 'The monster slain to make the world safe', 'story', 'A storm god or hero kills a serpent or dragon of the waters and so sets the world in order.',
    'dragon leviathan tiamat vritra python', 'monster slay slain hero sword lightning storm waters defeated chaos serpent head thunderbolt battle conquered', ['slew the (?:dragon|serpent|monster)', 'slay(?:ing)? (?:the )?(?:dragon|serpent)'], 6],
  ['hidden-child', 'The child set adrift', 'story', 'An infant hidden or cast out in a basket or boat, found and raised, who returns as a leader.',
    'basket reeds exposed cast foundling', 'river infant raised rescued princess shepherd cradle drifted hidden found boat nurse', ['placed (?:him|her|the child) in', 'drew (?:him|her) out'], 6],
  ['trickster', 'The trickster', 'story', 'A clever, shameless figure who steals, deceives and breaks the rules, and so changes the world.',
    'trickster coyote loki hermes anansi', 'deceit cunning stole theft clever disguise laughed tricked fool raven hare prank', [], 5],
  ['stolen-fire', 'Fire brought from the gods', 'story', 'Fire or a sacred gift stolen or carried from heaven to humankind, at a cost.',
    'fire stole theft prometheus', 'gift humans heaven torch hearth brought down flame stolen carried coal secret', ['brought (?:down )?fire'], 6],
  ['world-tree', 'The world tree and the cosmic mountain', 'story', 'A tree, pillar or mountain at the centre of the world joining heaven, earth and the underworld.',
    'yggdrasil axis pillar navel', 'tree mountain roots branches heaven underworld center centre ladder summit meru zion peak', ['world tree', 'centre of the (?:world|earth)', 'navel of the (?:world|earth)'], 6],
  ['immortality-quest', 'The search for deathlessness', 'story', 'A seeker travels to find the plant, water or knowledge that ends death, and loses it or learns to accept it.',
    'immortal immortality ambrosia amrita elixir', 'eternal life plant herb seek journey serpent stole lost death hero ever wander drink soma youth', ['eternal life', 'water of life', 'plant of life'], 6],
  ['end-of-world', 'The end of the world', 'story', 'A last battle, fire or judgment that ends the present age, followed by renewal.',
    'apocalypse ragnarok', 'fire trumpet beast wolf darkness stars fall resurrection renewed battle final judgment sea earthquake destroyed', ['end of the world', 'last day', 'new (?:heaven|earth)', 'day of (?:judgment|wrath)'], 6],
  ['judgment-dead', 'The judgment of the dead', 'story', 'The dead weighed or questioned for their deeds, and sent to reward or punishment.',
    'judgment weighed scales osiris', 'dead balance deeds heart feather bridge hell heaven punished rewarded soul questioned accounts record', ['weighed in the (?:balance|scales)', 'judg(?:ed|ment) of the dead'], 6],
  ['sun-hymn', 'Hymns to the sun', 'story', 'The rising and setting sun addressed as a god who sees all and gives life.',
    'sun shamash helios surya aten', 'rising setting dawn shine light rays beams eye sees brightness lord glory heaven noon', ['rising sun', 'rises? and sets?'], 6],
  ['great-mother', 'The mother goddess', 'story', 'A great goddess of earth, fertility and the underworld, mourned or honoured as giver of life.',
    'goddess inanna ishtar isis demeter cybele devi', 'mother queen heaven earth fertility grain mourning daughter lady womb nurse protector holy mistress', ['queen of heaven', 'mother of (?:the )?gods'], 6],
  /* ── beliefs ── */
  ['one-god', 'One God, or the One', 'belief', 'The divine as one: without equal, unseen, source of everything.',
    'monotheism unity', 'creator alone beginning without equal unseen eternal source supreme absolute unborn sole infinite uncreated', ['one god', 'only god', 'no god (?:but|besides|beside)', 'the one (?:who|that)', 'there is no other'], 6],
  ['inner-light', 'Divine light', 'belief', 'Light as the sign of the sacred: radiance, illumination, the inner light.',
    'radiance illumination enlightenment luminous', 'light shine lamp darkness brightness dawn glory inner eye clear pure splendour rays', ['inner light', 'light of the world', 'light of (?:god|heaven)', 'clear light'], 6],
  ['mystic-union', 'Union with the divine', 'belief', 'The self dissolving into God or the absolute, as lover and beloved or drop and ocean.',
    'union merged absorbed ecstasy beloved', 'soul god lover annihilation self oneness surrender ocean drop heart love united', ['one with', 'that art thou', 'become one', 'ground of the soul'], 6],
  ['impermanence', 'All things pass', 'belief', 'Everything arises and fades: life as breath, grass, vapour, or a dream.',
    'impermanent transient vanity vapour fleeting', 'passing decay fade withers grass dust shadow dream breath brief death dies youth', ['all things pass', 'vanity of vanities', 'like (?:grass|a dream|a shadow|a flower)', 'dust to dust'], 6],
  ['karma-reaping', 'What you sow you reap', 'belief', 'Deeds return to the doer, in this life or another.',
    'karma reap sow harvest', 'deeds fruit consequences actions rebirth returns cause effect doer ripens', ['fruit of (?:his|their|one’s|one\'s) (?:deeds|actions)', 'as you sow', 'whatever (?:a )?man sows'], 6],
  ['rebirth', 'Rebirth', 'belief', 'The self returning in another body or life, and the hope of release from the cycle.',
    'reincarnation rebirth reborn transmigration samsara', 'wheel lives former births another body released liberation cycle deeds migrates', ['wheel of (?:birth|life|becoming)', 'born again', 'many lives'], 6],
  ['mercy', 'Mercy and compassion', 'belief', 'The divine, or the awakened, as merciful and compassionate.',
    'merciful compassionate compassion mercy', 'forgive grace pity kindness tender loving gracious pardon kind gentle heart', ['full of (?:mercy|compassion)', 'most merciful'], 7],
  ['messengers', 'Angels and spirit messengers', 'belief', 'Beings between heaven and earth who carry messages, guard people or oppose them.',
    'angel angels messenger demon demons', 'spirits guardian wings heaven sent archangel genii devas jinn host watcher', ['angel of the lord', 'messenger of (?:god|heaven|the gods)'], 6],
  ['ancestors-dead', 'The ancestors and the spirits of the dead', 'belief', 'The dead as still present: honoured, fed, consulted, or feared.',
    'ancestors ancestral ghosts', 'spirits dead forefathers fathers offerings tomb household remember grave shade departed', ['spirits? of the dead', 'our fathers', 'the departed'], 6],
  ['the-way', 'The Way or Path', 'belief', 'Life as a road to follow: the narrow way, the eightfold path, the Dao.',
    'tao dao', 'path way walk journey straight narrow gate road right guide steps follow', ['the way of (?:the )?(?:lord|god|truth|heaven|righteousness|life|the wise)', 'right path', 'narrow (?:gate|way)', 'eightfold path', 'path of (?:righteousness|life|truth|virtue)', 'walk(?:s|ed)? in (?:the|his|thy) ways?'], 6],
  ['breath-spirit', 'Breath is spirit', 'belief', 'The word for breath is also the word for spirit, soul or life.',
    'breath breathed breathing pneuma prana ruach nephesh', 'spirit soul life wind inspiration vital inhale exhale', ['breath of (?:life|god)', 'breathed into'], 6],
  ['name-of-god', 'The holy name', 'belief', 'A name of the divine held too sacred to say lightly, repeated, or praised.',
    '', 'name holy sacred repeat utter praise invoke call sing remembrance lord glory bless', ['(?:holy|sacred|great) name', 'name of the lord', 'hallowed be', 'name of (?:god|allah)', 'praise (?:his|thy|the) name', 'repeat(?:ing)? (?:the )?name'], 4],
  /* ── rites and practices ── */
  ['animal-sacrifice', 'Offerings and animal sacrifice', 'rite', 'A bull, ram, lamb or goat offered at an altar: burnt, shared, or poured out.',
    'sacrifice offering altar burnt', 'bull ram lamb goat blood priest fat smoke savour libation victim slaughter flock sheep firstlings', ['burnt offering', 'sweet (?:savour|savor)', 'slaughtered the'], 8],
  ['human-sacrifice', 'The sacrifice of people', 'rite', 'People offered to the gods or demanded by them: a firstborn, a captive, a king, a child, a heart.',
    'firstborn captives victims', 'child son daughter heart altar priest knife blood offering slain war prisoners king burned moloch isaac', ['human sacrifice', 'passed? (?:his|their) (?:son|child|children) through', 'sacrifice(?:d)? (?:his|their) (?:son|daughter|child)'], 7],
  ['martyrdom', 'Persecution and martyrdom', 'rite', 'Believers killed for their faith, and killing done in the name of faith.',
    'martyr martyrdom persecution persecuted heretic heretics', 'stoned burned faith blood witness tortured executed crucified inquisition death sword infidels crusade', ['put to death', 'for the sake of (?:the )?(?:faith|gospel|name)', 'burned? at the stake'], 6],
  ['purification', 'Washing and purification', 'rite', 'Water, ashes or smoke used to wash away what is unclean, in body, house or soul.',
    'purify purification ablution baptism immerse wash', 'water clean unclean bathe river sprinkle priest defiled impurity cleanse pure sprinkled bath', ['wash(?:ed)? (?:his|their|your) (?:hands|feet|clothes|body)', 'ritually (?:clean|unclean)', 'water of purification'], 6],
  ['sacred-meal', 'The sacred meal', 'rite', 'Bread, wine or food shared as communion with the divine or with the dead.',
    'communion eucharist feast', 'bread wine cup body blood broke blessed table supper eat drink shared offering banquet', ['last supper', 'sacred meal', 'this is my (?:body|blood)', 'break(?:ing)? (?:the )?bread'], 6],
  ['fasting', 'Fasting', 'rite', 'Going without food or drink to purify, mourn, pray or prepare.',
    'fast fasting fasted abstain', 'days nights hunger food water forty penance repent dawn dusk sackcloth empty', ['forty days', 'fasted (?:and|for)'], 5],
  ['pilgrimage', 'Pilgrimage', 'rite', 'The journey to a sacred place: a city, mountain, river or shrine.',
    'pilgrimage pilgrim pilgrims hajj', 'shrine journey holy city mountain river visited sacred mecca benares jerusalem circumambulate temple route', ['holy (?:city|place|land)', 'go up to'], 5],
  ['sacred-fire', 'The sacred fire', 'rite', 'A fire kept, kindled or fed as a mouth of the gods: hearth, altar or lamp.',
    'agni hearth kindle kindled', 'fire flame altar offering ghee burnt temple vestal ashes sacred tended torch wood fuel pour', ['sacred fire', 'perpetual fire', 'fire (?:is|was) kept', 'fire-?altar', 'kindl(?:e|ed|ing) the fire'], 7],
  ['lamps-candles', 'Lamps, candles and lights', 'rite', 'Lights lit in worship, at festivals, for the dead and at beginnings.',
    'lamp lamps candle candles torch torches', 'light lit burning oil wick festival illumination flame flaming taper lantern darkness', ['lighted? (?:a )?lamps?', 'lamps? (?:burn|burning)', 'lit (?:the )?(?:lamps|candles)'], 5],
  ['food-offerings', 'Cakes and offerings of food', 'rite', 'Cakes, loaves, honey, grain and wine set out for the gods and the dead.',
    'cake cakes loaves honey', 'flour baked bread offering goddess moon grain wine oil libation sweet first-fruits', ['cakes? (?:of|for|to)', 'meal offering', 'honey cakes?', 'first-?fruits'], 5],
  ['spells', 'Spells, charms and incantations', 'rite', 'Words, objects or acts used to protect, heal, bind or curse.',
    'spell charm incantation enchantment magic sorcerer magician amulet charms spells witchcraft', 'words chant formula potion witch divination spirits curse curses protect demon remedy muttered knots bind', ['magic(?:al)? (?:words|formula|spell)', 'recite(?:d)? (?:this|the) (?:spell|charm|words)', 'by (?:the )?power of (?:the )?words'], 5],
  ['omens', 'Omens and divination', 'rite', 'Signs read in dreams, birds, entrails, stars or lots, to learn what the gods intend.',
    'omen omens divination oracle augur soothsayer astrologer', 'dream dreams signs stars lots entrails birds interpreter seer sign portent prophecy diviner', ['cast lots', 'read the (?:signs|omens|stars)', 'consult(?:ed)? the oracle'], 5],
  ['funeral-rites', 'Funeral and mourning rites', 'rite', 'The care of the body, the offerings, the grief, and the road laid out for the dead.',
    'funeral burial pyre mourning lament', 'tomb grave embalm wrap offering weeping bury burned body ashes sackcloth wailing cremated coffin', ['buried (?:him|her|them)', 'funeral (?:rites|pyre|feast)', 'mourn(?:ed|ing) for'], 6],
  ['initiation', 'Initiation and rites of passage', 'rite', 'A person is taken through an ordeal or teaching into a new state: adulthood, priesthood, a mystery.',
    'initiation initiated initiate circumcision ordeal', 'youth boys secret mysteries novice vow ordained consecrate coming-of-age ritual instructed admitted anointed', ['rites? of passage', 'rites? of (?:initiation|passage)', 'came? of age'], 6],
  ['marriage-rites', 'Marriage rites', 'rite', 'Weddings, the bride and bridegroom, and the sacred marriage of gods.',
    'wedding marriage bridegroom bride', 'feast vows sacred husband wife dowry procession union love garland bridal', ['sacred marriage', 'bride and bridegroom', 'given in marriage'], 6],
  ['libation', 'Libations and gifts to the dead', 'rite', 'Wine, water or milk poured out for the gods or the dead.',
    'libation libations', 'pour wine milk water honey offering dead altar earth drink poured cup', ['pour(?:ed)? (?:out )?(?:a )?libations?', 'drink offering'], 5],
  ['incense', 'Incense and sweet smoke', 'rite', 'Fragrant smoke offered, rising with the prayers of the worshippers.',
    'incense censer frankincense myrrh fragrance perfume', 'altar smoke rising sweet savour spice perfumed burn aroma offering cinnamon resin', ['burn(?:ed|ing)? incense', 'sweet (?:smell|savour|savor)', 'smoke (?:of|rose)'], 5],
  ['sacred-song-dance', 'Song and dance in worship', 'rite', 'Singing, drumming and dancing as prayer.',
    'dance dancing drum drums cymbals', 'song sing praises harp psalm hymn chant music rejoice circle trumpet dancer lyre', ['sing(?:ing)? praises', 'danc(?:e|ed|ing) (?:before|before the)'], 5],
  ['sacred-place', 'The sanctuary', 'rite', 'A temple, shrine or holy place built and kept: its priests, its courts, its inner room.',
    'tabernacle sanctuary', 'temple shrine holy place build priest altar court inner house god consecrate gate stones pillars threshold dedicate', ['house of (?:god|the lord)', 'holy of holies', 'inner sanctuary', 'built a (?:temple|shrine)'], 8],
  ['holy-days', 'The sabbath and holy days', 'rite', 'Days set apart: rest, feast, fast or festival.',
    'sabbath', 'festival feast-day holy day rest new-moon feasts solemn assembly observe appointed seventh month season passover', ['holy days?', 'day of rest', 'new moon', 'appointed (?:feast|time|season)'], 7],
  ['meditation', 'Stillness and meditation', 'rite', 'Sitting, watching the breath or the mind, silence as practice.',
    'meditation meditate contemplation stillness', 'silence breath seated mind attention cross-legged posture concentration quiet watching calm absorption', ['sat down', 'cross-legged', 'in silence', 'practise meditation'], 7],
  ['confession', 'Confession and repentance', 'rite', 'Naming wrongdoing, turning back, and being forgiven.',
    'confess confession repent repentance penance', 'sins forgive wrongdoing return atonement contrition turn sorrow absolution pardon sackcloth', ['confess(?:ed)? (?:his|their|our|my) sins', 'turn(?:ed)? (?:back|from)'], 7],
  ['naming-birth', 'Birth and naming', 'rite', 'The newborn named, blessed and presented, and the rites around birth.',
    'newborn naming circumcised', 'birth infant child name blessed presented eighth mother midwife cord cradle born blessing', ['gave (?:him|her) the name', 'named (?:him|her)', 'birth (?:rites|ceremony)'], 6],
  /* ── ways of living ── */
  ['golden-rule', 'The golden rule', 'conduct', 'Treat others as you would be treated: said in nearly every tradition, in the negative or the positive.',
    'reciprocity', 'neighbour neighbor others harm wish yourself', ['do (?:unto|to) others', 'what you (?:do not|don.t|would not) (?:wish|want|like)', 'neighbou?r as (?:yourself|thyself)', 'as you (?:would )?(?:wish|want|have) (?:others|men)', 'hurt not others', 'what is hateful to you', 'not (?:to )?do to (?:others|another)'], 4],
  ['answer-harm', 'Answering harm with good', 'conduct', 'Not repaying injury in kind: love your enemies, overcome hatred by love.',
    'forbearance', 'enemies enemy forgive hatred injury kindness good evil revenge wrong repay returns bless curse gentle', ['love your enemies', 'hatred (?:does|ceases|is) not', 'repay(?:ing)? (?:injury|evil|wrong) with', 'overcome evil with good', 'return(?:ing)? (?:good|kindness) for (?:evil|injury)', 'turn the other cheek'], 4],
  ['hospitality', 'The stranger and the guest', 'conduct', 'Welcoming the traveller: the guest as a possible god.',
    'stranger strangers hospitality guest sojourner', 'welcome entertain food travellers foreigner alien water feet door table shelter lodging', ['entertain(?:ed)? (?:strangers|angels)', 'welcomed? the (?:stranger|guest)'], 6],
  ['care-poor', 'Care for the poor and the widow', 'conduct', 'Giving to the poor, widows and orphans as a duty to the divine.',
    'beggar alms widow orphan', 'poor give charity hungry needy oppressed gift generosity justice clothes feed naked', ['the poor and', 'widows? and (?:the )?orphans?', 'give alms', 'alms to the poor'], 7],
  ['truthfulness', 'Truthfulness', 'conduct', 'Telling the truth and not bearing false witness.',
    'truthful truthfulness liar falsehood', 'lie lies speak false witness deceit honest word oath faithful slander', ['false witness', 'speak(?:s|ing)? (?:the )?truth', 'tell(?:ing)? lies'], 6],
  ['non-harm', 'Not killing', 'conduct', 'Not taking life: the first precept of many traditions.',
    'ahimsa nonviolence harmless', 'kill killing life creatures living beings violence injure harm compassion vow abstain', ['do not kill', 'shall not (?:kill|murder)', 'not (?:to )?(?:kill|take life)', 'abstain(?:s|ing)? from (?:taking|killing)'], 5],
  ['humility', 'Humility', 'conduct', 'The low are raised and the proud brought down.',
    'humble humility meek lowly pride proud', 'exalted haughty servant least last first lowest boast child', ['poor in spirit', 'the last (?:shall|will) be first', 'humble(?:s|d)? (?:himself|themselves)'], 6],
  ['renunciation', 'Renunciation', 'conduct', 'Giving up possessions, family and home to follow the sacred.',
    'renounce renunciation ascetic hermit monk', 'possessions riches wander begging forest sold left house family robe alone solitude cave', ['give up (?:all|everything)', 'left (?:his|their) (?:home|family)', 'went forth'], 6],
  ['forgiveness', 'Forgiveness', 'conduct', 'Letting go of the wrong done to you, as the divine lets go of yours.',
    'forgive forgiven forgiveness pardon', 'debts trespasses seventy times mercy sins wrong brother release forgave', ['seventy times', 'forgive (?:us|me|them|him)', 'as we forgive'], 6],
  ['wisdom-fool', 'The wise and the foolish', 'conduct', 'Wisdom praised and folly warned against, in proverbs and sayings.',
    'folly foolish fool', 'wisdom wise understanding learn teacher instruction prudent simple counsel knowledge sage fear speech listen', ['the wise (?:man|are|will)', 'fool (?:says|is|despises)', 'beginning of wisdom'], 7],
];

/* the compiled form: words go through the same stemming and merging as the passages' words, so a cue 'boat' also matches 'ship' and 'ark' */
let SIM_MOTIFS = null;
function simMotifInit() {
  if (SIM_MOTIFS) return SIM_MOTIFS;
  const norm = (s) => { const out = new Set(); String(s).split(/\s+/).filter(Boolean).forEach((w) => { const t = simTerms(w); if (t.length) out.add(t[0]); }); return out; };
  SIM_MOTIFS = SIM_MOTIF_DATA.map(([id, name, kind, line, core, support, phrases, min], idx) => ({ idx, id, name, kind, line, core: norm(core), support: norm(support), phrases: (phrases || []).map((p) => new RegExp(p, 'i')), min }));
  SIM_MOTIFS.forEach((m) => m.support.forEach((w) => { if (m.core.has(w)) m.support.delete(w); }));
  return SIM_MOTIFS;
}
/* a short stable fingerprint of the definitions, so an index built from older ones can be recognised */
function simMotifVersion() { const s = JSON.stringify(SIM_MOTIF_DATA); let h = 5381; for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0; return h.toString(36); }
/* a passage → its strongest motifs, as [[motif index, score 1..255], …] (at most three) */
function simMotifScores(text, stems) {
  const ms = simMotifInit(); const st = stems || new Set(simTerms(text)); const low = String(text).toLowerCase().replace(/[’‘]/g, "'").replace(/\s+/g, ' '); const out = [];
  for (const m of ms) {
    let s = 0; let core = 0; for (const w of m.core) if (st.has(w)) { s += 3; core++; } for (const w of m.support) if (st.has(w)) s++; for (const re of m.phrases) if (re.test(low)) { s += 4; core++; }
    if (core >= 1 && s >= m.min) out.push([m.idx, Math.min(255, Math.round(s * 14))]);
  }
  out.sort((a, b) => b[1] - a[1]); return out.slice(0, 3);
}
if (typeof module !== 'undefined' && module.exports) module.exports = { SIM_MOTIF_DATA, SIM_MOTIF_KINDS, simMotifInit, simMotifScores, simMotifVersion };
