/* ═══════════════════════════ 2z · Belief: four ways to browse the traditions and the library ══════════════════════════
   People who ask “how should I worship?” usually ask first what kind of belief they are drawn to: one God, many gods, spirit in everything, or a path without a god at its centre.
   This file sorts every tradition of the Atlas (793) and every shelf of the Library (40) under those four ideas (the deep past and books about religion have their own small places).
   It is a way to FIND things, not a verdict: many traditions belong under two ideas, so each has a first label and the others it is also described by, and every page that shows a label says so.
   How a tradition is sorted: its own entry below if it has one; otherwise a new religious movement out of a tradition of many gods or of spirits is an inner path, otherwise it takes the label of the
   tradition it grew from (its parent in the Atlas data), otherwise the label of its family. Pure functions, no page, no network. */
const BELIEFS = [
  { id: 'one', label: 'One God', term: 'monotheism', icon: 'sun', short: 'Belief in one God, creator and judge, worshipped alone.', ex: 'Judaism, Christianity, Islam, Sikhism, the Bahá’í Faith',
    line: 'Traditions that hold there is one God, creator and judge, who is to be worshipped alone: Judaism, Christianity, Islam, Sikhism, the Bahá’í Faith, Zoroastrianism and the traditions that grew from them. Worship is usually prayer, scripture, a community that gathers on set days, and a way of life.',
    care: 'Where a tradition also honours saints, angels or spirits, people disagree about whether it is still one God. The Lamplighter Project lists it here and says so.' },
  { id: 'many', label: 'Many gods', term: 'polytheism', icon: 'sparkle', short: 'Belief in many gods and goddesses, each with a story, a place and a feast.', ex: 'Egypt, Greece and Rome, the Norse, Hinduism, Shinto',
    line: 'Traditions that honour many gods and goddesses, each with a character, a story, a place and a feast: Egypt, Mesopotamia, Greece and Rome, the Norse, Celtic and Slavic worlds, the many deities of Hindu worship, Shinto’s kami, and the Pagan and Hellenic revivals of today. Worship is usually offering, festival, temple or shrine, and story.',
    care: 'Many of these also teach that the gods are aspects of something larger (Hindu schools differ on this), so most carry a second label.' },
  { id: 'spirit', label: 'Spirit in all things', term: 'animism', icon: 'wave', short: 'Belief that spirit is in everything: ancestors, animals, rivers, mountains and the dead.', ex: 'the Lakota, Aboriginal Australians, the Yoruba and Akan, the Sámi',
    line: 'Traditions in which spirit is in all things: ancestors, animals, rivers, mountains and the dead are regarded as persons to be known and honoured. These are mostly the Indigenous and local religions of the Americas, Africa, Oceania, Siberia and Southeast Asia, usually with no founder and no single book. Worship is ceremony, offering, song, dance and keeping right relation with people, place and the dead.',
    care: '“Animism” is a scholars’ word and many peoples do not use it; here it is only a way to find these traditions. Some records here are outsiders’ accounts of what a people keep restricted; each is labelled, and the peoples’ own accounts stand first.' },
  { id: 'inner', label: 'Inner paths and philosophy', term: 'spirituality', icon: 'lotus', short: 'Practice, insight and wisdom rather than the worship of a god.', ex: 'Buddhism, Jainism, Daoism, Confucian ethics, Hermetic and mystical currents, humanism',
    line: 'Paths of practice, insight and wisdom rather than worship of a god: Buddhism, Jainism, Daoism and Confucian ethics, the mystery schools and Hermetic currents, Theosophy and New Thought, humanism. They ask how to live, what the self is, and how to see clearly.',
    care: 'Some of these also include gods, devotion and prayer (Daoist temple religion, Pure Land Buddhism, many mystical orders), so most carry a second label.' },
  { id: 'deep', label: 'The deep past', term: 'archaeology', icon: 'clock', short: 'Burials, figurines, cave art and monuments from before writing.', ex: 'Palaeolithic ritual, Neolithic Europe, the Jōmon',
    line: 'Before writing, people left burials, figurines, cave art and monuments. What they believed is inferred from these traces; none of these groupings is a self-named religion.',
    care: 'These are archaeological horizons. The Lamplighter Project says what is evidence and what is inference.' },
];
/* the Library has two more places that are not beliefs: books about religion, and the imagined shelf */
const LIB_BELIEF_EXTRA = [
  { id: 'about', label: 'About religion', term: '', line: 'Scholarship, comparison and the history of ideas on one side, and the arguments and laws for freedom of conscience on the other. These are not scriptures: they are the books people use to read them, and to decide for themselves.' },
  { id: 'imag', label: 'The imagined shelf', term: '', line: 'Works of the imagination by known authors, never meant as scripture. They are kept apart from every tradition’s texts.' },
];
const BELIEF_BY_ID_LABEL = Object.fromEntries([...BELIEFS, ...LIB_BELIEF_EXTRA].map((b) => [b.id, b]));
const beliefName = (id) => (BELIEF_BY_ID_LABEL[id] ? BELIEF_BY_ID_LABEL[id].label : '');
const beliefFull = (id) => { const b = BELIEF_BY_ID_LABEL[id]; return b ? (b.term ? `${b.label} (${b.term})` : b.label) : ''; };

/* ── the traditions of the Atlas ── */
const BELIEF_BY_FAMILY = { prehistoric: ['deep'], ane: ['many'], egypt: ['many'], iranian: ['one'], abrahamic: ['one'], hellenistic: ['inner'], european: ['many'], dharmic: ['inner'], south_asian_indigenous: ['spirit'], east_asian: ['many', 'spirit'], inner_asian: ['spirit'], southeast_asian: ['spirit'],
  african: ['spirit'], afro_diasporic: ['many', 'spirit'], americas: ['spirit'], oceania: ['spirit'], esoteric: ['inner'], modern_pagan: ['many', 'spirit'], nrm: ['inner'], secular: ['inner'] };
const BELIEF_BY_KIND = { arch: ['deep'] };      /* archaeological or reconstructed horizons: beliefs inferred from material remains */
const BELIEF_BY_ID = {
  /* one God */
  judaism: ['one'], christianity: ['one'], islam: ['one'], sikhism: ['one'], bahai: ['one'], zoroastrianism: ['one'], yazidism: ['one'], yarsanism: ['one', 'inner'], mandaeism: ['one'], druze: ['one', 'inner'], samaritanism: ['one'], israelite: ['one', 'many'],
  donghak: ['one'], tenrikyo: ['one'], konkokyo: ['one'], brahmo_samaj: ['one'], arya_samaj: ['one', 'inner'], nirankari: ['one'], sant_mat: ['one', 'inner'], rastafari: ['one', 'spirit'], spiritual_baptists: ['one', 'spirit'], revival_zion: ['one', 'spirit'], deism: ['one', 'inner'],
  sufism: ['one', 'inner'], kabbalah: ['one', 'inner'], christian_kabbalah: ['inner', 'one'], manichaeism: ['inner', 'one'], mazdaznan: ['inner'], santo_daime: ['inner', 'one'], armenian_pagan: ['many'], universal_sufism: ['inner', 'one'], eckankar: ['inner'],
  pai_marire: ['one', 'spirit'], ringatu: ['one', 'spirit'], iharaira: ['one', 'spirit'], parihaka_movement: ['one', 'spirit'],
  /* many gods */
  canaanite: ['many'], vedic: ['many'], hinduism: ['many', 'inner'], vaishnavism: ['many', 'one'], shaivism: ['many', 'one'], shaktism: ['many'], smartism: ['many', 'inner'],
  shinto: ['many', 'spirit'], shang_religion: ['many', 'spirit'], vietnamese_folk: ['many', 'spirit'], jeungsanism: ['many', 'inner'], scythian: ['many', 'spirit'], kalash: ['many', 'spirit'],
  yoruba_religion: ['many', 'spirit'], fon_vodun: ['many', 'spirit'], lapita_polynesian: ['many', 'spirit'], maya_religion: ['many', 'spirit'], aztec_religion: ['many', 'spirit'], inca_religion: ['many', 'spirit'], andean_religion: ['many', 'spirit'], mixtec_religion: ['many', 'spirit'],
  cybele: ['many'], isis_cult: ['many', 'inner'], serapis: ['many', 'inner'], mithraism: ['many', 'inner'], dionysian: ['many', 'inner'], eleusinian: ['many', 'inner'], samothracian: ['many', 'inner'], orphism: ['many', 'inner'],
  wicca: ['many', 'spirit'], goddess_movement: ['many', 'spirit'],
  /* spirit in all things */
  korean_shamanism: ['spirit'], hmong_religion: ['spirit'], yi_bimo: ['spirit'], zhuang_mo: ['spirit'], dongba: ['spirit'], ryukyuan: ['spirit'], ainu_religion: ['spirit'], sami: ['spirit', 'many'], finnic: ['spirit', 'many'], hoodoo: ['spirit', 'inner'], obeah: ['spirit'], garifuna: ['spirit'],
  bon: ['inner', 'spirit'], kejawen: ['inner', 'spirit'], druidry_modern: ['spirit', 'inner'],
  /* inner paths and philosophy */
  buddhism: ['inner'], tibetan_buddhism: ['inner', 'many'], vajrayana: ['inner', 'many'], jainism: ['inner'], charvaka: ['inner'], ajivika: ['inner'], baul: ['inner'],
  confucianism: ['inner'], daoism: ['inner', 'many'], mohism: ['inner'], falun_gong: ['inner'], happy_science: ['inner'], caodaism: ['inner', 'one'],
  gnosticism: ['inner', 'one'], hermeticism: ['inner'], pythagoreanism: ['inner'], neoplatonism: ['inner'],
  /* added 17 November 2026 with the coverage additions: rows whose inherited label would be wrong */
  magyar_pagan: ['many', 'spirit'], free_spirit: ['one', 'inner'], advaita_vedanta: ['inner'], ayyavazhi: ['one', 'many'],
  dzogchen: ['inner'], sanyi_jiao: ['inner', 'many'], curanderismo: ['spirit', 'one'], toltec: ['many', 'spirit'],
};
/* the first label and the others a tradition is also described by: beliefOf(trad, id) → ['many', 'spirit']; trad is the Atlas's tradition table keyed by id ({ parent_id, family_id, kind }) */
function beliefOf(trad, id, memo) {
  memo = memo || {}; if (memo[id]) return memo[id];
  const t = trad[id]; if (!t) return (memo[id] = ['inner']);
  memo[id] = ['inner'];      /* a loop in the data cannot run for ever */
  let r = BELIEF_BY_ID[id] || BELIEF_BY_KIND[t.kind];
  if (!r && t.parent_id && trad[t.parent_id]) { const p = beliefOf(trad, t.parent_id, memo); r = (t.kind === 'nrm' && p[0] !== 'one' && t.family_id !== 'modern_pagan') ? ['inner'] : p; }
  if (!r) r = BELIEF_BY_FAMILY[t.family_id] || ['inner'];
  return (memo[id] = r);
}
/* a short list of the best known traditions under each belief, for the page that browses them (every id is checked against the Atlas by tests/belief.test.js) */
const BELIEF_FEATURED = {
  one: ['judaism', 'christianity', 'islam', 'sikhism', 'bahai', 'zoroastrianism', 'catholicism', 'eastern_orthodox', 'protestantism', 'sunni', 'shia', 'sufism', 'quakers', 'druze', 'yazidism', 'lds_church'],
  many: ['hinduism', 'egyptian', 'mesopotamian', 'canaanite', 'greek', 'roman', 'norse', 'celtic', 'slavic', 'shinto', 'chinese_folk', 'aztec_religion', 'maya_religion', 'yoruba_religion', 'haitian_vodou', 'santeria', 'heathenry', 'hellenismos'],
  spirit: ['aboriginal_australian', 'lakota_religion', 'navajo_religion', 'inuit_religion', 'haudenosaunee_religion', 'san_religion', 'akan_religion', 'zulu_religion', 'igbo_odinani', 'maori_religion', 'hawaiian_religion', 'tengrism', 'sami', 'korean_shamanism', 'ainu_religion', 'amazonian_shamanism', 'andean_religion'],
  inner: ['buddhism', 'theravada', 'mahayana', 'tibetan_buddhism', 'chan', 'jainism', 'daoism', 'confucianism', 'hermeticism', 'gnosticism', 'neoplatonism', 'theosophy', 'freemasonry', 'new_thought', 'humanism', 'spiritualism'],
  deep: ['middle_palaeolithic_ritual', 'upper_palaeolithic_ritual', 'old_europe_neolithic', 'megalithic_europe', 'jomon_ritual', 'natufian_ritual'],
};

/* ── the shelves of the Library: the first label and the others (a shelf is shown once, under its first label, with a line saying where else it belongs) ── */
const SHELF_BELIEF = {
  hb: ['one'], dc: ['one'], or: ['one'], nt: ['one'], ps: ['one'], ds: ['one'], ec: ['one', 'inner'], ju: ['one', 'inner'], is: ['one', 'inner'], sk: ['one'], ir: ['one'], mo: ['one', 'inner'],
  me: ['many'], eg: ['many'], in: ['many', 'inner'], gr: ['many', 'inner'], ne: ['many', 'spirit'], am: ['many', 'spirit'],
  na: ['spirit'], af: ['spirit'], pa: ['spirit'], si: ['spirit'], tb: ['spirit'], fi: ['spirit'], fu: ['spirit', 'many'], wi: ['spirit'], ta: ['spirit', 'many'], tf: ['spirit'], tm: ['spirit'], tp: ['spirit'],
  bu: ['inner'], ja: ['inner'], ch: ['inner', 'many'], he: ['inner'], oc: ['inner'], sp: ['inner'], ms: ['inner'],
  sc: ['about'], fr: ['about'], im: ['imag'],
};
const shelfBelief = (g) => (SHELF_BELIEF[g] || ['about'])[0];
const shelfAlso = (g) => (SHELF_BELIEF[g] || []).slice(1);
const LIB_BELIEF_ORDER = ['one', 'many', 'spirit', 'inner', 'about', 'imag'];
/* the shelves of one place in the Library, in the order of LIB_GROUPS: shelvesOfBelief(LIB_GROUPS, 'one') → ['hb', 'dc', …] */
const shelvesOfBelief = (groups, b) => groups.map((g) => g[0]).filter((g) => shelfBelief(g) === b);

/* ── the shelves of the Library that hold a tradition’s own texts: the tradition’s own entry, or its nearest ancestor’s, or the shelf of its family ── */
const TRAD_SHELVES = {
  judaism: ['hb', 'dc', 'or', 'ps', 'ds', 'ju'], israelite: ['hb', 'ps'], christianity: ['nt', 'ec'], gnosticism: ['ec'], islam: ['is'], sikhism: ['sk'], jainism: ['ja'], buddhism: ['bu'], hinduism: ['in'], vedic: ['in'], zoroastrianism: ['ir'], manichaeism: ['ir'],
  greek: ['gr'], roman: ['gr'], egyptian: ['eg'], sumerian: ['me'], canaanite: ['me'], norse: ['ne'], celtic: ['ne'], germanic: ['ne'], finnic: ['ne'],
  daoism: ['ch'], confucianism: ['ch'], mohism: ['ch'], shinto: ['ch'], chinese_folk: ['ch'], maya_religion: ['am'], aztec_religion: ['am'], inca_religion: ['am'], andean_religion: ['am'],
  bahai: ['mo'], quakers: ['mo'], lds: ['mo'], theosophy: ['sp'], spiritualism: ['sp'], new_thought: ['sp'], hermeticism: ['he'], rosicrucianism: ['he'], freemasonry: ['ms'], thelema: ['oc'], golden_dawn: ['oc'], tengrism: ['si'], evenki_shamanism: ['si'],
};
const FAMILY_SHELVES = { african: ['af'], oceania: ['pa'], inner_asian: ['si'], americas: ['na'] };
function shelvesOfTradition(trad, id) {
  let cur = id; for (let i = 0; cur && trad[cur] && i < 60; i++) { if (TRAD_SHELVES[cur]) return TRAD_SHELVES[cur]; cur = trad[cur].parent_id; }
  cur = id; for (let i = 0; cur && trad[cur] && i < 60; i++) { if (FAMILY_SHELVES[trad[cur].family_id]) return FAMILY_SHELVES[trad[cur].family_id]; cur = trad[cur].parent_id; }      /* else the shelf of the family of the nearest ancestor that has one (Candomblé grew from the Yoruba religion, an African tradition) */
  return [];
}
if (typeof module !== 'undefined' && module.exports) module.exports = { BELIEFS, LIB_BELIEF_EXTRA, BELIEF_BY_ID_LABEL, beliefName, beliefFull, BELIEF_BY_FAMILY, BELIEF_BY_KIND, BELIEF_BY_ID, beliefOf, BELIEF_FEATURED, SHELF_BELIEF, shelfBelief, shelfAlso, LIB_BELIEF_ORDER, shelvesOfBelief, TRAD_SHELVES, FAMILY_SHELVES, shelvesOfTradition };
