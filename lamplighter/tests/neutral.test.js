/* The neutral voice (the maker, 18 November 2026: “stay as neutral as possible. i’m not building this to direct opinions. its only a tool for people to form their own opinions.”).
   The audit of 18 Nov (UX_AUDIT.md, UX-22 and UX-23) found the tool stating some revelations as fact (“as revealed in the Quran to the Prophet Muhammad”, “revealed through séances”) while
   describing other faiths as what they hold, and teasers that argued a thesis. This test keeps both fixed. It checks, and a failure names the file and line (or the Atlas record and field):
   1. WHAT A TRADITION HOLDS IS ATTRIBUTED. In the Atlas’s own prose (the one-line summary and the founder of each of the 793 traditions, the notes on texts, sites, practices, connections and
      presence rows, the descriptions of the families, the causes) and in the page texts of src/js, the words of RULES below (revealed, revelation, a vision, a miracle, “the Prophet”, “true
      religion”, “God spoke”, channelled, …) may stand only when the sentence says whose claim it is (“held to have been revealed”, “said to”, “in the Muslim account”, “by his own account”),
      or inside a quotation, a source title or a Library record, or in the short list of exceptions kept here with the reason for each (the test fails if an exception stops matching, so the
      list cannot go stale). A bare word is a verdict in the tool’s own voice.
   2. NO LOADED WORD in a one-line summary (the same list as the history timeline, tests/history.test.js; “cult” is allowed in its scholarly sense, the worship of a deity, and “Land without Evil”
      is a Guaraní name).
   3. THE TEASERS ARGUE NO THESIS. The “Look closer” cards (the story hooks and the “wait a minute” notes) and the Common ground page: every drawn teaser carries a grade word (documented,
      debated, disputed, independent parallel, argued…) or asks a question; no “remarkably similar”, “strikingly”, “most widely repeated”, “older cousins”, “not walled off”; no superlative
      without its source; and Common ground opens with the differences beside the likenesses.
   4. THE SAME FRAME FOR EVERY TRADITION: the belief labels that say what a tradition holds are framed as belief, and the guard itself is tested (the old wordings are caught, the
      attributed ones pass).
   Run: node tests/neutral.test.js */
const fs = require('fs'); const path = require('path');
const ROOT = path.join(__dirname, '..'); const SRC = path.join(ROOT, 'src/js'); const JDIR = path.join(ROOT, 'tools/atlas_src/json');
let pass = 0; let fail = 0;
const ok = (n, c, x) => { if (c) pass++; else { fail++; console.log('FAIL', n); if (x !== undefined) console.log('   ' + (typeof x === 'string' ? x : JSON.stringify(x, null, 1)).slice(0, 3500)); } };
const H = require('../src/js/2z-history-core.js'); const ST = require('../src/js/2y-data-stories.js'); const BL = require('../src/js/2z-belief-core.js'); const TL = require('../src/js/2z-tradlist-core.js');
const PA = require('../src/js/2q-data-parallels.js'); const CC = require('../src/js/2s-common-core.js');
const read = (f) => fs.readFileSync(path.join(SRC, f), 'utf8'); const readJ = (f) => JSON.parse(fs.readFileSync(path.join(JDIR, f + '.json'), 'utf8'));

/* ── the rules: a short list of words that, bare, state a claim as fact. `scopes` says where each applies: atlas (the Atlas prose), founder (the founder field), code (page texts in src/js), teaser */
const RULES = [
  { id: 'revealed', rx: /\b(?:revealed|revelations?)\b/gi, scopes: ['atlas', 'code', 'teaser'], skip: (m, s) => m[0] === 'Revelation' || /^revealed\s+(?:themselves|itself)/i.test(s.slice(m.index, m.index + 20)) },
  { id: 'the Prophet', rx: /\bthe Prophet\b|\bProphet [A-ZĀ-Ž][a-zā-ž’]+/g, attrib: false, scopes: ['atlas', 'code', 'teaser'], skip: (m, s) => /known as\s+$/i.test(s.slice(Math.max(0, m.index - 12), m.index)) },
  { id: 'a miracle', rx: /\bmiracles?\b|\bmiraculous(?:ly)?\b/g, scopes: ['atlas', 'code', 'teaser'] },
  { id: 'the only true', rx: /\b(?:true (?:religion|faith|church)|only true|one true|the only (?:way|God|religion))\b/gi, scopes: ['atlas', 'code', 'teaser'] },
  { id: 'recited to a person', rx: /\b(?:recited|dictated) to [A-Z]\w+/g, scopes: ['atlas', 'code', 'teaser'] },
  { id: 'God acted', rx: /\bGod (?:spoke|said|told|commanded|chose|revealed|sent)\b/g, scopes: ['atlas', 'code', 'teaser'] },
  { id: 'channelled', rx: /\bchannel{1,2}ed\b/gi, scopes: ['atlas', 'code', 'teaser'] },
  { id: 'resurrected', rx: /\b(?:resurrected|incarnate|incarnated)\b/gi, scopes: ['atlas', 'code'] },
  { id: 'from the divine', rx: /\b(?:received|given|come|comes|dictated|sent|inspired|revealed)\s+(?:to \w+ )?(?:from|by) (?:the divine|God|the gods?|the Spirit)\b|\bmessages? from (?:the divine|God|the gods?)\b/gi, scopes: ['atlas'] },
  { id: 'a vision', rx: /\bvisions?\b/gi, scopes: ['atlas'] },
  { id: 'a title as status', rx: /\(the (?:[A-Z]\w+ )?(?:Buddha|Mahdi|Báb|Prophet|Messiah|Christ|Avatar|Lord)\)/g, attrib: false, scopes: ['founder'] },
  { id: 'the thesis voice', rx: /\b(?:remarkably (?:similar|close|alike)|strikingly (?:similar|alike)|most widely (?:repeated|held)|older cousins|walled off|far less to fight|plainly older|did not need each other|arriv(?:e|ed|ing) at the same)\b/gi, attrib: false, scopes: ['teaser'] },
  { id: 'a first or an earliest', rx: /\bthe (?:earliest|first) (?:large|recorded)\b/gi, scopes: ['teaser'], skip: (m, s) => /(?:one|some) of $/i.test(s.slice(Math.max(0, m.index - 8), m.index)) },
  { id: 'a superlative', rx: /\bthe (?:most|oldest|greatest|best|largest) [^.;:]{0,40}\b(?:on earth|in the world|of all time)\b/gi, attrib: false, scopes: ['teaser'] },
];
/* a claim is attributed when the words around it say whose it is, or that it is asked, argued, denied or only described */
const ATTRIB = /\b(?:held|holds?|said|says?|claims?|claimed|believed?|believes|beliefs?|reported|reports?|records?|regard(?:ed|s)|taught|teach(?:es|ing)|teachings?|according to|attributed|ascribed|presents?|presented|purports?|alleged|supposed(?:ly)?|tells?|told|narrates?|describes?|describing|whether|argued?|debated?|disputed|known as|called|so-called|treated as|seen as|taken as|considered|seeking|seeks?|speaks? of|read as|stories|story|myths?|legends?|accounts?|by tradition|(?:in|to|of) (?:the|its|their|[A-Z]\w+) tradition|tradition (?:holds|says|ties|tells|dates|puts|has it)|traditionally|traditional (?:account|dating|chronology)|Muslims?|Protestants?|Catholics?|Jews|Jewish|Christians?|Sikhs?|Hindus?|Buddhists?|Zoroastrians?|Bahá’ís|believers|followers|adherents)\b|\?/i;
/* a denial counts only right beside the word: “never offered as scripture or revelation”, “not as a new revelation” */
const NEG = /\b(?:not|never|nor|none|without|neither|no)\b/i;
/* source titles and names that carry a rule’s word (a title is the author’s, not the tool’s voice) */
const TITLES = /Revelations of Divine Love|Meccan Revelations|Course in Miracles|Miracles of (?:the Blessed Virgin )?Mary|Miracle Play|Search of the Miraculous|new revelation of the apostles|Revealed writings/g;
const LIBREC = /'[a-z]{1,2}-[a-z0-9-]+\|[^']*'/g;       /* a Library record: 'id|title|group|date|shelf' */
const spans = (s, rx) => { const out = []; const g = new RegExp(rx.source, rx.flags.includes('g') ? rx.flags : rx.flags + 'g'); let m; while ((m = g.exec(s))) out.push([m.index, m.index + m[0].length]); return out; };
const inside = (sp, i) => sp.some(([a, b]) => i >= a && i < b);
const quoted = (s, i) => { const L = s.slice(0, i); if ((L.match(/“/g) || []).length > (L.match(/”/g) || []).length) return true; const nx = s.indexOf('"', i); return (L.match(/"/g) || []).length % 2 === 1 && nx > -1 && nx - i < 160 && !/="[^"]*$/.test(L); };
const hasScope = (r, scope) => r.scopes.includes(scope);
function scanText(s, scope) {
  const hits = []; if (typeof s !== 'string' || !s) return hits; const titles = spans(s, TITLES); const recs = scope === 'code' ? spans(s, LIBREC) : [];
  for (const r of RULES) {
    if (!hasScope(r, scope)) continue;
    const g = new RegExp(r.rx.source, r.rx.flags); let m;
    while ((m = g.exec(s))) {
      const i = m.index; if (r.skip && r.skip(m, s)) continue;
      if (inside(titles, i) || inside(recs, i) || quoted(s, i)) continue;
      const win = s.slice(Math.max(0, i - 150), i) + ' ' + s.slice(i + m[0].length, i + m[0].length + 50);
      if (r.attrib !== false && (ATTRIB.test(win) || NEG.test(s.slice(Math.max(0, i - 60), i)))) continue;
      hits.push({ rule: r.id, word: m[0], snippet: s.slice(Math.max(0, i - 50), i + m[0].length + 40).replace(/\s+/g, ' ') });
    }
  }
  return hits;
}
/* the exceptions, each with its reason; one that matches nothing any more fails the test below */
const EXCEPT = [
  { rule: 'a miracle', where: '2x-motifs.js', has: 'virgin conceived miraculous annunciation', why: 'search words used to find passages, never shown as text' },
  { rule: 'a miracle', where: '2z-data-rites.js', has: "motif: 'miraculous-birth'", why: 'the id of a motif (the folklorists’ term), never shown as a claim' },
  { rule: 'revealed', where: '2z-bibles-core.js', has: "REV: 'revelation rev re revelations apocalypse apoc'", why: 'the names a person may type for the Book of Revelation, never shown as text' },
  { rule: 'revealed', where: '28-data-path-stations-b.js', has: 'Translation as revelation: the Septuagint', why: 'a question for study about translation (the idea that a translation is a revelation), not a claim that one occurred' },
];
const SKIP_FILES = { '64-lab.js': 'the guessing experiments show a target as “Revealed” after the guess; nothing about religion', '2z-history-core.js': 'holds the list of loaded words itself' };
const usedExc = new Set();
const excused = (h, where, line) => { const k = EXCEPT.findIndex((e) => e.rule === h.rule && where.startsWith(e.where + ':') && line.includes(e.has)); if (k >= 0) { usedExc.add(k); return true; } return false; };

/* ── 1. the Atlas’s own prose ── */
const FIELDS = { traditions: [['summary', 'atlas'], ['founder', 'founder']], texts: [['note', 'atlas'], ['language', 'atlas']], sites: [['note', 'atlas']], practices: [['description', 'atlas']], interactions: [['note', 'atlas']], presence: [['note', 'atlas']], families: [['description', 'atlas']] };
const atlasHits = []; let atlasStrings = 0;
for (const [file, fields] of Object.entries(FIELDS)) for (const r of readJ(file)) for (const [f, scope] of fields) { atlasStrings++; scanText(r[f], scope).forEach((h) => atlasHits.push(`${file}.json ${r.id} ${f} [${h.rule}] …${h.snippet}…`)); }
for (const r of readJ('interaction_causes')) { [['summary', r.summary], ...(r.causes || []).map((c, i) => ['causes.' + i + '.note', c.note])].forEach(([f, v]) => { atlasStrings++; scanText(v, 'atlas').forEach((h) => atlasHits.push(`interaction_causes.json ${r.link_id} ${f} [${h.rule}] …${h.snippet}…`)); }); }
ok('the Atlas’s own prose (every summary, founder and note: ' + atlasStrings + ' strings) states no revelation, vision, miracle, title or voice of God as a fact: each is attributed (“held to be”, “said to”, “reported”) or absent', atlasHits.length === 0, atlasHits);
const sums = readJ('traditions'); const loadedIn = (s) => { const g = new RegExp(H.HIST_LOADED.source, 'gi'); const out = []; let m; while ((m = g.exec(s))) { if (/^cults?$/i.test(m[0]) || (/^evil$/i.test(m[0]) && /Land without Evil/.test(s))) continue; out.push(m[0]); } return out; };
ok('no one-line summary of the 793 traditions uses a word of accusation or praise (the history timeline’s list; “cult” stays in its scholarly sense)', sums.length >= 793 && sums.every((t) => loadedIn(t.summary).length === 0), sums.filter((t) => loadedIn(t.summary).length).map((t) => t.id + ': ' + loadedIn(t.summary).join(',')));
ok('the one-line summaries are one-line summaries still: none is empty and none is over 700 characters', sums.every((t) => typeof t.summary === 'string' && t.summary.length >= 5 && t.summary.length <= 700), sums.filter((t) => !(t.summary && t.summary.length >= 5 && t.summary.length <= 700)).map((t) => t.id));

/* ── 1b. the page texts in src/js ── */
const files = fs.readdirSync(SRC).filter((f) => /\.js$/.test(f)).sort(); const codeHits = []; let codeLines = 0;
for (const f of files) {
  if (SKIP_FILES[f]) continue;
  read(f).split('\n').forEach((line, n) => {
    const t = line.trim(); if (!t || t.startsWith('/*') || t.startsWith('//') || t.startsWith('*')) return; codeLines++;
    scanText(line, 'code').forEach((h) => { const where = `${f}:${n + 1}`; if (!excused(h, where, line)) codeHits.push(`${where} [${h.rule}] …${h.snippet}…`); });
  });
}
ok('the page texts of src/js (' + files.length + ' files, ' + codeLines + ' lines of code) state no revelation, miracle, title or voice of God as a fact outside a quotation, a source title or a Library record', codeHits.length === 0, codeHits);
ok('every exception in the list still matches a line (no stale exception, none left over from an old wording)', EXCEPT.every((e, k) => usedExc.has(k)), EXCEPT.filter((e, k) => !usedExc.has(k)).map((e) => e.where + ' ' + e.has));
ok('every exception gives its reason and names its file', EXCEPT.every((e) => e.why && e.why.length > 20 && files.includes(e.where)) && Object.values(SKIP_FILES).every((w) => w.length > 20));

/* ── 2. the family sentences and the belief labels ── */
const groupHits = Object.entries(TL.TRL_GROUP_LINE).flatMap(([k, s]) => scanText(s, 'code').map((h) => `TRL_GROUP_LINE.${k} [${h.rule}] …${h.snippet}…`).concat(loadedIn(s).map((w) => `TRL_GROUP_LINE.${k} loaded word ${w}`)));
ok('the nine family sentences of All traditions state no claim as fact and use no loaded word', Object.keys(TL.TRL_GROUP_LINE).length === 9 && groupHits.length === 0, groupHits);
const belHits = BL.BELIEFS.flatMap((b) => ['short', 'line', 'care'].flatMap((k) => scanText(b[k], 'code').map((h) => `BELIEFS.${b.id}.${k} [${h.rule}] …${h.snippet}…`).concat(loadedIn(b[k]).map((w) => `BELIEFS.${b.id}.${k} loaded word ${w}`))));
ok('the belief labels (One God, Many gods, Spirit in all things, Inner paths, The deep past) state no claim as fact and use no loaded word', BL.BELIEFS.length === 5 && belHits.length === 0, belHits);
const BEL = Object.fromEntries(BL.BELIEFS.map((b) => [b.id, b]));
ok('the same frame for every belief: the three labels that say what a tradition holds are written as belief (“Belief in…”, “Belief that…”, “Traditions that…”, “Traditions in which…”), not as the tool’s own statement that it is so',
  ['one', 'many', 'spirit'].every((id) => /^Belief (?:in|that) /.test(BEL[id].short) && /^Traditions (?:that|in which) /.test(BEL[id].line)), ['one', 'many', 'spirit'].map((id) => BEL[id].short + ' | ' + BEL[id].line.slice(0, 50)));

/* ── 3. the teasers ── */
const stories = ST.STORIES; const sixW = read('6w-stories.js');
const ordinary = JSON.parse(/ordinary = STORIES\.filter\(\(s\) => (\[[^\]]+\])\.includes/.exec(sixW)[1].replace(/'/g, '"'));
const teaserHits = []; const teaserStrings = [];
stories.forEach((s) => { ['hook', 'blurb', 'note'].forEach((k) => teaserStrings.push([`2y-data-stories.js story ${s.id} ${k}`, s[k]])); s.entries.forEach((a) => { [[8, 'yNote'], [9, 'line'], [12, 'surprise']].forEach(([i, k]) => { if (a[i]) teaserStrings.push([`2y-data-stories.js story ${s.id} entry ${a[0]} ${k}`, a[i]]); }); }); });
const TR = (() => { const src = read('2l-data-path-traditions.js').replace(/\nif \(typeof module[^\n]*/g, ''); return new Function(src + '\nreturn TRADITIONS;')(); })();
TR.forEach((t) => teaserStrings.push([`2l-data-path-traditions.js tradition page ${t.id} blurb`, t.blurb]));
PA.PARALLELS.filter((p) => p.theme === 'Common ground').forEach((p) => { teaserStrings.push([`2q-data-parallels.js passage set ${p.id} title`, p.title], [`2q-data-parallels.js passage set ${p.id} blurb`, p.blurb]); (p.links || []).forEach((l, i) => teaserStrings.push([`2q-data-parallels.js passage set ${p.id} link ${i}`, l[3]])); });
CC.COMMON_GROUPS.forEach((g) => teaserStrings.push([`2s-common-core.js COMMON_GROUPS ${g.id}`, g.text])); CC.COMMON_DIFFERENCES.forEach(([h, t]) => teaserStrings.push([`2s-common-core.js COMMON_DIFFERENCES ${h}`, t]));
teaserStrings.forEach(([where, s]) => scanText(s, 'teaser').forEach((h) => teaserHits.push(`${where} [${h.rule}] …${h.snippet}…`)));
read('6o-common.js').split('\n').forEach((line, n) => { const t = line.trim(); if (!t || t.startsWith('/*') || t.startsWith('//') || t.startsWith('*')) return; scanText(line, 'teaser').forEach((h) => teaserHits.push(`6o-common.js:${n + 1} [${h.rule}] …${h.snippet}…`)); });
ok('the story texts behind the Look closer cards and the Common ground page (' + teaserStrings.length + ' strings) argue no thesis: no “remarkably similar”, “most widely repeated”, “older cousins”, “not walled off”, no unsourced superlative, no claim as fact', teaserHits.length === 0, teaserHits);
const GRADE = /\b(?:documented|reported|disputed|debated?|contested|argued?|independent|parallels?|scholars|most scholars|some scholars|coincidence|no (?:known )?(?:contact|link)|not (?:settled|shown)|graded)\b/i;
ok('the eight stories the Look closer cards draw from (' + ordinary.join(', ') + ') each have a hook that carries a grade word or asks a question', ordinary.length === 8 && ordinary.every((id) => { const h = ST.STORY_BY_ID[id].hook; return GRADE.test(h) || /\?\s*$/.test(h); }), ordinary.filter((id) => { const h = ST.STORY_BY_ID[id].hook; return !(GRADE.test(h) || /\?\s*$/.test(h)); }));
const KINSHIP = ['flood', 'beginning', 'giant', 'birth', 'rising', 'golden', 'teacher', 'meal', 'end', 'garden'];   /* the stories that set one tradition’s tale beside another’s; the other four (conscience, plants, sound, image) set out evidence and make no claim of kinship */
ok('and so does every other story that sets one tradition’s tale beside another’s (' + KINSHIP.length + ' of the 14), not only the eight that are drawn', KINSHIP.every((id) => ST.STORY_BY_ID[id] && (GRADE.test(ST.STORY_BY_ID[id].hook) || /\?\s*$/.test(ST.STORY_BY_ID[id].hook))), KINSHIP.filter((id) => !(GRADE.test(ST.STORY_BY_ID[id].hook) || /\?\s*$/.test(ST.STORY_BY_ID[id].hook))));
const common = read('6o-common.js'); const lead = /<h2 style="font-size:26px;margin:4px 0 8px">([^<]+)<\/h2>\s*<p class="t2" style="max-width:74ch;font-size:16px">([^<]+)<\/p>/.exec(common);
ok('Common ground opens with the differences beside the likenesses: its heading and its lead say both', !!lead && /differ/i.test(lead[1]) && /differ/i.test(lead[2]) && /similar|alike|likeness/i.test(lead[2]), lead && lead.slice(1));
ok('and the differences come before the ring of connections, not after the case for them', common.indexOf('Where they really differ') > 0 && common.indexOf('Where they really differ') < common.indexOf('Who is connected to whom'));
ok('the lead says only what the page computes: no “almost any religion”, no “not walled off”, no sentence that all traditions are alike', !!lead && !/almost any|not walled|are all (?:the )?same|all religions/i.test(lead[1] + ' ' + lead[2]));

/* ── 4. the guard itself: the old wordings are caught, the attributed ones pass ── */
const caught = (s, scope) => scanText(s, scope || 'atlas').length > 0;
const OLD = [
  'Submission to the one God as revealed in the Quran to the Prophet Muhammad.', 'Universal religion revealed through séances.', 'Delaware Prophet’s revelation.', 'Revelations of the Seneca prophet Handsome Lake.',
  'Revealed to Muhammad in Mecca and Medina, 610–632.', 'Study groups of the channeled Course.', 'Hymns received in vision.', 'Church based on Swedenborg’s visions.', 'Messages from the divine received in dreams.',
  'Speaking messages received from the divine.', 'The Qur’an, recited to Muhammad from 610 CE, became the centre of a religion.', 'The Qur’an was revealed to Muhammad over about 23 years.', '12 Rabiʿ al-awwal: the Prophet’s birthday.', 'Johane Marange’s visions from 1932.',
];
ok('the guard catches the old wordings of the audit (UX-22): ' + OLD.length + ' lines that stated a revelation, a vision or a title as fact', OLD.every((s) => caught(s, 'atlas')), OLD.filter((s) => !caught(s, 'atlas')));
ok('and it catches a title written as the founder’s status', caught('Muhammad Ahmad (the Mahdi)', 'founder') && caught('Siddhartha Gautama (the Buddha)', 'founder') && !caught('Siddhartha Gautama (known as the Buddha)', 'founder') && !caught('Muhammad Ahmad (who proclaimed himself the Mahdi)', 'founder'));
const TEASE = ['Jesus said it. So did Hillel, Confucius and the Buddha, who lived in worlds that never met. It is the most widely repeated moral sentence on earth.', 'Revelation’s last battle, fire and new heaven has older cousins: in Iran, in Scandinavia, in India and in Mexico.', 'The traditions are not walled off from each other', 'and arrived at remarkably similar answers.', 'the story is older than Genesis. The Mesopotamian stories are plainly older than Genesis.', 'Africa holds some of the oldest and the most varied religious life on earth', 'with the earliest large body of religious texts', 'and with it the first recorded gods, hymns and laws.'];
ok('and the teaser wordings of the audit (UX-23) and of the tradition blurbs: ' + TEASE.length + ' lines that argued a thesis or claimed a first', TEASE.every((s) => caught(s, 'teaser')), TEASE.filter((s) => !caught(s, 'teaser')));
const GOOD = [
  'Submission to the one God; held to have been revealed in the Quran to Muhammad.', 'Religion that presents itself as universal; its teachings are said to have been revealed through séances.', 'Teaching of Neolin, known as the Delaware Prophet, who reported a revelation.',
  'Hymns said to have been received in vision.', 'Study groups of A Course in Miracles, said by its scribe to have been dictated by an inner voice.', 'Hidden Christians revealed themselves here in 1865.', 'Julian of Norwich, Revelations of Divine Love',
  'Church from the mass revival led by William Wadé Harris, known as Prophet Harris.', 'Messages held to come from the divine, received in dreams.', 'Seeking a vision through solitude and fasting.', 'Some traditions say theirs is the only way; others say there are many ways.',
  'It says “God said, let there be light”.', 'The Bahá’í teaching of progressive revelation says that each founder revealed God’s will for their age.',
];
ok('and it lets the attributed, quoted, titled and secular uses pass: ' + GOOD.length + ' lines', GOOD.every((s) => !caught(s, 'atlas') && !caught(s, 'code')), GOOD.filter((s) => caught(s, 'atlas') || caught(s, 'code')).map((s) => s + ' → ' + JSON.stringify(scanText(s, 'atlas').concat(scanText(s, 'code')).map((h) => h.rule))));
ok('every rule has an id, a pattern with the global flag and at least one scope, and every rule is exercised by the lines above', RULES.length >= 10 && RULES.every((r) => r.id && r.rx.flags.includes('g') && r.scopes.length >= 1));

console.log(`neutral: ${pass} passed, ${fail} failed (${atlasStrings} Atlas strings, ${files.length} source files, ${codeLines} code lines, ${teaserStrings.length} story strings, ${RULES.length} rules, ${EXCEPT.length} exceptions)`);
process.exit(fail ? 1 : 0);
