// Run: node tests/passage.test.js — the random-passage picker returns clean English from every readable book (skipped if ../../texts is absent)
const fs = require('fs'); const path = require('path'); const vm = require('vm');
const { psgAreasFrom, englishScore, psgUsable, pickPassage, psgWindow, psgStarts, psgApparatus, psgBlocks, psgNumberedAreNotes, psgGlossaryLike, psgListLike, psgGarbled, psgTidy, psgMatterSections, psgPassageOk, psgContents, PSG_LEN } = require('../src/js/6d-passage.js');
const dir = path.join(__dirname, '../../texts');
let pass = 0, fail = 0; const ok = (n, c, x = '') => { if (c) pass++; else { fail++; console.log('FAIL', n, typeof x === 'string' ? x : JSON.stringify(x).slice(0, 300)); } };
const mulberry = (a) => () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

/* ── the areas named in an address ── */
ok('areas: an empty or missing address names none (it must not mean area 0)', psgAreasFrom('', 14).length === 0 && psgAreasFrom(undefined, 14).length === 0 && psgAreasFrom(null, 14).length === 0 && psgAreasFrom('.', 14).length === 0);
ok('areas: dot-separated numbers are read, in range, once each', psgAreasFrom('0.3.5', 14).join() === '0,3,5' && psgAreasFrom('0.0.3', 14).join() === '0,3' && psgAreasFrom('13.14.99', 14).join() === '13');
ok('areas: junk is dropped', psgAreasFrom('x.1.-2.1e3.0x5. 4 .7', 14).join() === '1,7' && psgAreasFrom('__proto__', 14).length === 0 && psgAreasFrom('<script>', 14).length === 0 && psgAreasFrom({}, 14).length === 0);

/* ── the English filter ── */
ok('English prose scores high', englishScore('In the beginning God created the heavens and the earth. And the earth was without form, and void; and darkness was upon the face of the deep.') > 0.4);
ok('Scottish Gaelic scores low', englishScore('Beannaich, a Dhia, mo shuil, beannaich, a Dhia, mo chluas, beannaich, a Dhia, mo bhial, beannaich, a Dhia, mo chridhe.') < 0.15);
ok('Nahuatl scores low', englishScore('Nitlatoa ayac oquiyocox ayac oquipic tlalticpac nican ye nemohua ixquich quimati tlalticpac nican, ohuaya, xochitl cuicatl moyollo.') < 0.15);
ok('Latin scores low', englishScore('Gallia est omnis divisa in partes tres, quarum unam incolunt Belgae, aliam Aquitani, tertiam qui ipsorum lingua Celtae.') < 0.15);
ok('headings are not usable', !psgUsable('## Chapter 1\n\nIn the beginning God created the heavens and the earth and all the things that are in them.'));
ok('footnote-like blocks are not usable', !psgUsable('Footnote 463: Phys. p. 25, 15, the Greek says that Parmenides in the verses about opinion made fire and earth the elements of the world.'));
ok('number-heavy lines are not usable', !psgUsable('1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30 31 32 33 34 35 36 37 38 39 40 41 42 43 44'));
const sample = 'He said to them, Go. [[2]]They went away and did what they were told. [[3]]And when the evening came, the man who had sent them out was glad of it, and he told his servants to prepare a feast for all of them and for the others who had come in from the fields.';
ok('sentence and verse starts are found', psgStarts(sample).length >= 3, psgStarts(sample));
ok('a long text is cut to a window at a boundary', (() => { const w = psgWindow(sample.repeat(12), 300, mulberry(1)); return w.length >= 150 && w.length < 900 && /[.!?]$/.test(w.replace(/\[\[\d+\]\]$/, '').trim()); })());

/* ── an editor's notes are not the text ── */
ok('a scholarly note is apparatus', psgApparatus('16. Sum. glosses ; a) they stood forth for battle. This was taken over bodily by the translator of ASKT 125, without regard to his text, a sure sign that this hymn was the model, b) they grew weak.'));
ok('a note with sigla is not usable', !psgUsable('7. aim = subatu SBH 131, 50, where Enlil covers his head with a subatu, probably in sign of sorrow. Cf. Br. 7781 and CT XV 8 rev. 9.'));
ok('numbered verses are still the text', !psgApparatus("112. 'Yea, Mahabrahman, the highest of Sages, and in the end he shall even become a Buddha, he, possessing a thoroughly pure intelligence, shall obtain these eight sublime rewards of merit."));
ok('a line marker alone is not apparatus', !psgApparatus('(ll. 167-169) So she said; but fear seized them all, and none of them uttered a word. But great Cronos the wily took courage and answered his dear mother:'));
ok('plain scripture is not apparatus', !psgApparatus('In the beginning God created the heavens and the earth. The earth was formless and empty. Darkness was on the surface of the deep and God’s Spirit was hovering over the surface of the waters.'));
const psalm = 'PSALM TO ENLIL\n\n19 The bolt of heaven thou didst pull away.\n\n20 The disobedient land with desolation thou didst scatter.\n\n21 The disobedient foe thou didst not dread.\n\n22 The wrath of thy heart, can anyone appease it?\n\n7. Cf. Br. 7781 and CT XV 8 rev. 9; the Sumerian line is read differently in K 4618 obv. 13, see note above.';
const pb = psgBlocks(psalm, true);
ok('a psalm printed line by line becomes one stanza', pb.length === 2 && pb[0].split('\n').length === 5, pb);
ok('scan line numbers are taken off verse lines', /^The bolt of heaven/m.test(pb[0]) && !/^19 /m.test(pb[0]), pb[0]);
ok('the stanza is usable and the note is not', psgUsable(pb[0]) && !psgUsable(pb[1]));
ok('a stanza is drawn whole, without the note', (() => { const p = pickPassage([['Part 1', psalm]], { license: 'scan' }, mulberry(3), { target: 560 }); return p && /bolt of heaven/.test(p.text) && !/Cf\./.test(p.text); })());
const poem = 'Now the Lord Yahweh has sent me\n  with his Spirit.\n\nHear me, you islands!\n  Listen, you peoples, from afar!\n\nA long paragraph of prose follows here, long enough that it is not taken for a line of verse at all, and so it stands alone.';
const tb = psgBlocks(poem, false);
ok('a typed poem’s short stanzas keep their own line and stanza breaks', tb.length === 2 && tb[0] === 'Now the Lord Yahweh has sent me\n  with his Spirit.\n\nHear me, you islands!\n  Listen, you peoples, from afar!', tb);
ok('verse line starts are boundaries', psgStarts('The word of the lord.\nThe word of Enlil the earth endures not.').includes(22));

/* ── pages are not glossaries, indexes, bibliographies, contents lists or lists of names ── */
const PROSE = 'The people had waited a long time for the rain, and when at last the first clouds came up over the hills the old man went out and stood in the road. He said nothing to anyone. His daughter, who had followed him, took his hand, and together they watched the dark edge of the storm move slowly across the valley toward the village where the others were already beginning to gather.';
const GLOSS_LINES = 'Abraxas — a name of power cut on gems.\nAeon — an eternal being; in Gnostic thought an emanation of the divine.\nArchon — a ruler; a power that holds the world.\nBarbelo — the first thought of the unknown Father.\nDemiurge — the maker of the visible world.\nPleroma — the fullness of the divine world.';
const GLOSS_RUN = 'Abba, n. father, a title of respect. Adonai, n. my Lord, said in place of the name. Amen, n. so be it. Anathema, n. a thing devoted to destruction. Archangel, n. a chief angel; see Michael. Asherah, n. a goddess; see also Astarte.';
const INDEX_RUN = 'Aaron, 12, 45, 67–69; Abraham, 3, 9, 14, 88; Adam, 21, 22–25, 140; Angels, 101, 102, 117–121; Antichrist, 77, 80, 81; Apocalypse, 5, 6, 190–195.';
const BIBLIO = 'Charles, R. H., The Apocrypha and Pseudepigrapha of the Old Testament, 2 vols., Oxford, 1913. Box, G. H., The Ezra-Apocalypse, London, 1912. Schürer, E., Geschichte des jüdischen Volkes, Leipzig, 1901–09. Torrey, C. C., The Apocryphal Literature, New Haven, 1945.';
const CONTENTS = 'CHAPTER I. How The Lord Appeared To Moses In The Bush. CHAPTER II. How Moses Went Down Into Egypt. CHAPTER III. Of The Plagues That Came Upon Pharaoh. CHAPTER IV. How The People Passed The Sea.';
const NAMES = 'Adam, Seth, Enosh, Kenan, Mahalalel, Jared, Enoch, Methuselah, Lamech, Noah, Shem, Ham, and Japheth. The sons of Japheth: Gomer, Magog, Madai, Javan, Tubal, Meshech, and Tiras. The sons of Gomer: Ashkenaz, Riphath, and Togarmah. The sons of Javan: Elishah, Tarshish, Kittim, and Dodanim.';
const NOTE_CF = 'The phrase is used again in the second chapter, cf. Kethuboth 112a, and the Syriac reads differently; see the note on ch. xii. 4 and Charles, op. cit., p. 214, who takes it as an interpolation. Compare Gen. xv. 2, 8 and Eth. En. lx. 20.';
ok('real prose is usable', psgUsable(PROSE));
ok('a glossary printed one entry to a line is not', psgGlossaryLike(GLOSS_LINES) && !psgUsable(GLOSS_LINES));
ok('a glossary run on in one paragraph is not', psgGlossaryLike(GLOSS_RUN) && !psgUsable(GLOSS_RUN));
ok('an index is not', !psgUsable(INDEX_RUN) && psgGlossaryLike(INDEX_RUN));
ok('a bibliography is not', !psgUsable(BIBLIO));
ok('a contents list is not', !psgUsable(CONTENTS) && psgContents(CONTENTS));
ok('a list of names is not, in either strictness', psgListLike(NAMES, true) && !psgUsable(NAMES));
ok('a note full of cross-references is not', !psgUsable(NOTE_CF));
ok('prose is not mistaken for a list', !psgListLike(PROSE, true) && !psgGlossaryLike(PROSE));
ok('scan garbage is told from prose', psgGarbled('of the Lord that like as he hath • save as k the apostle you also from death unto 0 “fc he wouldrafse wlnehnow are blotted out °f the book ofltfe. 8 y ° Ur SOuls') && !psgGarbled(PROSE));
ok('a running head is taken out of a scanned page', psgTidy('He went to the house. ACTS OF THOMAS 395 for mine unhappy daughter, which hath not seen any good.', true) === 'He went to the house. for mine unhappy daughter, which hath not seen any good.', psgTidy('He went to the house. ACTS OF THOMAS 395 for mine unhappy daughter, which hath not seen any good.', true));
ok('capitals in scripture are not taken for a running head', psgTidy('And God said, I AM THAT I AM, and he sent me to you.', true) === 'And God said, I AM THAT I AM, and he sent me to you.');
ok('a note mark in the line is removed, a verse number is not', psgTidy('the way of darkness[726] is crooked and [[4]]full of cursing', false) === 'the way of darkness is crooked and [[4]]full of cursing');
ok('sentence starts are not taken after an abbreviation or an initial', (() => { const t = 'He met Dr. Smith and J. Brown at St. Mark’s. Then they left.'; const st = psgStarts(t); return st.length === 2 && t.slice(st[1]).startsWith('Then'); })(), psgStarts('He met Dr. Smith and J. Brown at St. Mark’s. Then they left.'));
ok('a page may not begin after a colon or a semicolon', (() => { const t = 'He said: Go now; Stay there. Done.'; return !psgStarts(t).some((x) => t.slice(x).startsWith('Go') || t.slice(x).startsWith('Stay')); })());
ok('front and back matter sections are found by heading', (() => { const secs = [['Introduction', 'x'.repeat(500)], ['Chapter 1', 'y'.repeat(9000)], ['Notes', 'z'.repeat(800)], ['Index', 'w'.repeat(900)]]; const m = psgMatterSections(secs); return m.has(0) && !m.has(1) && m.has(2) && m.has(3); })());
ok('an "Introduction" that is most of the book is the book, not front matter', psgMatterSections([['Introduction', 'x'.repeat(9000)], ['Chapter 1', 'y'.repeat(900)]]).size === 0);
ok('a section titled in its parts is read by its name', psgMatterSections([['Glossary · Part 1 of 2 · first words…', 'x'.repeat(500)], ['Chapter 1', 'y'.repeat(9000)]]).has(0));
ok('the page sizes are real pages', PSG_LEN.long[1] >= 1500 && PSG_LEN.longer[1] >= 3000 && PSG_LEN.medium[1] < PSG_LEN.long[1]);

/* a made-up book with good chapters among notes, an index, a glossary and a short introduction */
{
  const para = (n) => `${PROSE} Day ${n} brought news of a traveller on the north road. The elders met in the shade of the great tree to hear what he had to say, and each in turn asked him where he had come from and what he wanted. He answered every question plainly, and when he had finished, the oldest of them rose and told him he was welcome to stay as long as he liked.`;
  const chapter = (k) => Array.from({ length: 14 }, (_, i) => para(k * 20 + i)).join('\n\n');
  const secs = [['Introduction', `${PROSE}\n\n${PROSE}`], ['Chapter 1', chapter(1)], ['Chapter 2', chapter(2) + '\n\n' + NOTE_CF + '\n\n' + chapter(3)], ['Notes', Array.from({ length: 12 }, () => NOTE_CF).join('\n\n')], ['Glossary', Array.from({ length: 6 }, () => GLOSS_LINES).join('\n\n')], ['Index', Array.from({ length: 6 }, () => INDEX_RUN).join('\n\n')], ['Bibliography', Array.from({ length: 6 }, () => BIBLIO).join('\n\n')]];
  const seen = new Set(); let bad = null; const rng = mulberry(7);
  for (let i = 0; i < 400; i++) { const t = [320, 560, 1500, 3000][i % 4]; const p = pickPassage(secs, {}, rng, { target: t }); if (!p) { bad = bad || ['no passage', t]; continue; } seen.add(p.si); const c = p.text.replace(/\s+/g, ' ');
    if (/Kethuboth|op\. cit|Glossary|Aeon|Pleroma|Charles, R\. H\.|Aaron, 12/.test(c)) bad = bad || ['picked matter', p.si, c.slice(0, 60)];
    if (!/^[A-Z“"‘'(\[]/.test(p.text) || !/[.!?]["”’)]?$/.test(p.text)) bad = bad || ['edges', p.text.slice(0, 30), p.text.slice(-30)]; }
  ok('a book with notes, glossary, index and bibliography only ever gives its chapters', !bad && [...seen].every((x) => x === 1 || x === 2), [bad, [...seen]]);
  ok('the short introduction is left alone while there is a real text to draw from', !seen.has(0), [...seen]);
  const only = pickPassage([['Introduction', `${PROSE}\n\n${PROSE}\n\n${PROSE}`]], {}, mulberry(2), { target: 560 });
  ok('but a book that has nothing else can still give its introduction', !!only && only.si === 0);
}
/* a page grows on both sides of the place drawn, and the place can fall anywhere on it */
{
  const para = (n) => `Paragraph ${n} begins here. ${PROSE} It ends here at paragraph ${n}.`;
  const secs = [['Chapter 1', Array.from({ length: 40 }, (_, i) => para(i)).join('\n\n')]];
  const rng = mulberry(11); const firsts = new Set(); let fills = 0; let n = 0; let seeds = [];
  for (let i = 0; i < 120; i++) { const p = pickPassage(secs, {}, rng, { target: 1500 }); if (!p) continue; n++; const c = p.text.replace(/\s+/g, ' '); const m = c.match(/Paragraph (\d+) begins/); if (m) firsts.add(+m[1]); fills += c.length >= 1100 ? 1 : 0; const e = c.match(/at paragraph (\d+)\.$/); ok('a page ends where a paragraph ends', !!e && !!m, c.slice(-60)); }
  ok('a page is close to a page long', fills / n > 0.9, [fills, n]);
  ok('pages begin at many different paragraphs, not always the drawn one', firsts.size >= 25, firsts.size);
}
/* a paragraph that begins mid-sentence takes the one before it; a plate caption cutting a sentence in two is left out; scan junk at the end is cut */
{
  const a = 'It was a long road, and the travellers grew weary of the dust and the heat and of one another, and when they came at last to the well they sat down in the shade of the wall and did not speak for a long while, because there was nothing left that either of them wished to say, and the water was cool, and the evening was coming on, and in the distance they could hear the sound of the bells of the flocks being led home across the stony fields to the village';
  const b = 'and the first of the stars came out above the hills. They rested there until morning, and in the morning they went on together without a word of what had passed between them.';
  const secs = [['Chapter 1', `${a}\n\n${b}\n\n${PROSE}\n\n${PROSE}`]];
  const rng = mulberry(5); let split = true; let bare = 0;
  for (let i = 0; i < 80; i++) { const p = pickPassage(secs, {}, rng, { target: 560 }); if (!p) continue; bare++; if (/^and the first of the stars/.test(p.text)) split = false; }
  ok('a paragraph that starts in the middle of a sentence is never the start of a passage', split && bare > 40, bare);
  const cap = [['Chapter 1', `${a}\n\nThe Queen of Sheba and her Son\n\n${b}\n\n${PROSE}`]];
  let leaked = false; for (let i = 0; i < 60; i++) { const p = pickPassage(cap, {}, mulberry(i + 1), { target: 560 }); if (p && /Queen of Sheba/.test(p.text)) leaked = true; }
  ok('a caption cutting a sentence in two is left out', !leaked);
  const junk = [['Chapter 1', `${PROSE} The hymn goes on for many lines, and the singers sing it until the day is done. ${PROSE}\n\n, . - — Tg`]];
  let jk = false; for (let i = 0; i < 40; i++) { const p = pickPassage(junk, {}, mulberry(i + 3), { target: 560 }); if (p && /Tg\s*$/.test(p.text)) jk = true; }
  ok('stray marks at the end of a scan are cut off', !jk);
}
/* the paragraph returned is the one the reader numbers, so the reader can open the book at the place */
{
  const text = Array.from({ length: 30 }, (_, i) => `Paragraph ${i} of the first section, and ${PROSE}`).join('\n\n');
  let right = 0; let n = 0; const rng = mulberry(4);
  for (let i = 0; i < 60; i++) { const p = pickPassage([['Chapter 1', text]], {}, rng, { target: 560 }); if (!p) continue; n++; const para = text.split(/\n{2,}/)[p.p]; if (para && p.text.slice(0, 40) && para.includes(p.text.slice(0, 40))) right++; }
  ok('the passage starts inside the paragraph it reports', n > 40 && right === n, [right, n]);
}

/* ═══ a passage is a unit with a reference (psgPickUnit); a page is the old kind of pick ═══ */
{
  const { psgPickUnit, psgReadOn, psgRefOf, psgNoteParas, psgUndottedNotes } = require('../src/js/6d-passage.js');
  const C = require('../src/js/2z-passage-core.js');
  const sent = (c, n) => `In chapter ${c} the elders of the village gathered and spoke about the matter of verse ${n}, and they agreed that the water should be shared.`;
  const verseBook = Array.from({ length: 3 }, (_, c) => [`Chapter ${c + 1}`, Array.from({ length: 5 }, (_, pi) => Array.from({ length: 4 }, (_, vi) => `[[${pi * 4 + vi + 1}]] ${sent(c + 1, pi * 4 + vi + 1)}`).join(' ')).join('\n\n')]);
  const rngP = mulberry(21); let wholeParagraphs = 0; let n = 0; let bad = null; let nums = 0;
  for (let i = 0; i < 300; i++) {
    const u = psgPickUnit(verseBook, { title: 'Test Book' }, rngP, { mode: 'passage' }); if (!u) { bad = bad || 'none'; continue; } n++;
    const marks = (u.text.match(/\[\[(\d+)\]\]/g) || []).map((x) => +x.slice(2, -2));
    if (u.kind !== 'verses' || marks[0] !== u.from || marks[marks.length - 1] !== u.to || marks.length !== u.to - u.from + 1) bad = bad || ['reference', u.from, u.to, marks];
    else if (!/^\[\[\d+\]\]/.test(u.text) || !/[.!?]$/.test(u.text)) bad = bad || ['edges', u.text.slice(0, 20), u.text.slice(-10)];
    else if (u.p !== Math.floor((u.from - 1) / 4) || u.pe !== Math.floor((u.to - 1) / 4)) bad = bad || ['paragraphs', u.from, u.to, u.p, u.pe];
    if ((u.to - u.from + 1) === 4 && (u.from - 1) % 4 === 0) wholeParagraphs++;
    nums += marks.length;
  }
  ok('a passage from a book that numbers its verses is a run of whole verses, cited by the numbers its markers carry, from a verse to the end of a sentence, in the paragraph the reader numbers', !bad && n === 300, bad);
  ok('where the translators’ paragraph is the right size, the passage is the paragraph', wholeParagraphs / n > 0.9, wholeParagraphs / n);
  const pg = psgPickUnit(verseBook, { title: 'Test Book' }, mulberry(5), { mode: 'page' });
  ok('a page of such a book is longer, and also whole verses', pg && pg.kind === 'verses' && C.psuVis(pg.text).length >= 900 && /^\[\[\d+\]\]/.test(pg.text), pg && pg.text.length);
  ok('the same seed gives the same passage and the same page', (() => { const a = psgPickUnit(verseBook, {}, mulberry(8), { mode: 'passage' }); const b = psgPickUnit(verseBook, {}, mulberry(8), { mode: 'passage' }); return a && b && a.text === b.text && a.from === b.from; })());
  /* "Read on": the verses after, and nothing after the end of the chapter */
  const u0 = psgPickUnit(verseBook, {}, mulberry(3), { mode: 'passage' }); const more = psgReadOn(verseBook, {}, u0);
  ok('reading on gives the same passage and the verses after it', !u0 || u0.ib + 1 >= 20 ? true : (more && more.text.startsWith(u0.text) && more.to > u0.to && more.ib > u0.ib), [u0 && u0.to, more && more.to]);
  ok('and nothing at the end of a chapter', (() => { const last = { kind: 'verses', si: 0, ia: 16, ib: 19, from: 17, to: 20, p: 4, pe: 4, text: '' }; return psgReadOn(verseBook, {}, last) === null; })());
  const prose = [['Chapter 1', Array.from({ length: 12 }, (_, i) => `Paragraph ${i} begins here. ${PROSE} It ends here at paragraph ${i}.`).join('\n\n')]];
  const pu = psgPickUnit(prose, {}, mulberry(4), { mode: 'passage' }); const pm = pu && psgReadOn(prose, {}, pu);
  ok('reading on in prose adds the paragraphs after the passage, and stops at the end of the section', pu && pu.kind === 'prose' && (pu.pe >= 11 ? pm === null : pm && pm.text.startsWith(pu.text) && pm.pe > pu.pe), [pu && pu.pe, pm && pm.pe]);
  ok('a passage of prose begins where a paragraph begins when the paragraph fits a long section', (() => { let s = 0; let m = 0; const r = mulberry(9); const long = [['Chapter 1', Array.from({ length: 30 }, (_, i) => `Paragraph ${i} begins here. ${PROSE} ${PROSE} It ends here at paragraph ${i}.`).join('\n\n')]]; for (let i = 0; i < 80; i++) { const x = psgPickUnit(long, {}, r, { mode: 'passage' }); if (!x) continue; m++; if (/^Paragraph \d+ begins here/.test(x.text)) s++; } return m > 60 && s / m > 0.8; })());
  /* the references */
  const l = { title: 'Psalms' };
  ok('a unit is cited by what it is: verses by book, chapter and verses; prose by title and section', psgRefOf({ kind: 'verses', id: 'b-psa', heading: 'Psalm 4', from: 1, to: 3 }, l, { by: 'World English Bible (2020 stable text)' }, '').main === 'Psalm 4:1–3' && psgRefOf({ kind: 'prose', id: 'x-ana', heading: 'BOOK II. WEI CHANG.', si: 1, nsec: 20 }, { title: 'Analects' }, {}, '').cite === 'Analects, Book II. Wei Chang.' && psgRefOf({ kind: 'verses', id: 'p-lxx', heading: 'Psalm 22', from: 1, to: 2 }, { title: 'Septuagint' }, {}, '').main === 'Psalm 22:1–2 (Septuagint numbering)');
  /* the numbers a text prints before its sayings are its own numbering only where they run in order */
  const numbered = [['Chapter I. Twins', Array.from({ length: 14 }, (_, i) => `${i + 31}. ${PROSE.slice(0, 160)} Verse number ${i + 31} says so.`).join('\n\n')]];
  const restart = [['Chapter I. Twins', [1, 2, 3, 4, 5, 6, 1, 2, 3, 4, 5, 6].map((k) => `${k}. ${PROSE.slice(0, 160)} Saying ${k} says so.`).join('\n\n')]];
  ok('a passage in a section whose numbers run in order is cited by them', (() => { const r = mulberry(6); for (let i = 0; i < 20; i++) { const x = psgPickUnit(numbered, {}, r, { mode: 'passage' }); if (!x || !/^nos?\. \d+/.test(x.nums || '')) return false; const found = (x.text.match(/(?:^|\n\n)(\d+)\. /g) || []).map((s) => +s.replace(/\D/g, '')); if (found.length && !(x.nums.includes(String(found[0])) || +/\d+/.exec(x.nums)[0] <= found[0])) return false; } return true; })());
  ok('and in one whose numbers start over, or have gaps, it is cited by its name and no number is taken', (() => { const r = mulberry(6); for (let i = 0; i < 20; i++) { const x = psgPickUnit(restart, {}, r, { mode: 'passage' }); if (!x || x.nums) return false; } return true; })());
  /* footnotes printed after the verses, in an ascending run with no full stop (Rodwell's Qur'an) are notes */
  const note = (n) => `${n} A name applied to an idol or idols, especially the ancient ones of the people before.`;
  const verseLine = (s, i) => `And he said to them, in the day ${i} of the sura ${s}, that the Lord will judge between them in the end.`;
  const suras = Array.from({ length: 6 }, (_, s) => [`SURA ${s + 1}.-THE TEST${s}`, ['MECCA.-9 Verses', 'In the Name of God, the Compassionate, the Merciful', ...Array.from({ length: 12 }, (_, i) => verseLine(s + 1, i + 1) + (i === 3 ? ' For when there shall be a trumpet,2 on the trumpet.' : '')), note(1), note(2), note(3)].join('\n\n')]);
  ok('a run of numbered footnotes is found, and a book whose own verses are numbered that way is not mistaken for one', psgNoteParas(['x', note(14), note(15), note(16), 'y']).size === 3 && psgUndottedNotes(suras) && !psgUndottedNotes([['A', Array.from({ length: 30 }, (_, i) => `${i + 1} In the beginning there was a word, and the word was with the people.`).join('\n\n')]]));
  { const r = mulberry(12); let leaked = null; let digits = 0; for (let i = 0; i < 300; i++) { const x = psgPickUnit(suras, {}, r, { mode: i % 2 ? 'page' : 'passage' }); if (!x) continue; if (/name applied to an idol/.test(x.text)) leaked = x.text.slice(0, 50); if (/trumpet,2/.test(x.text)) digits++; }
    ok('a footnote of such a book is never drawn, and its number stuck to a word is taken off', !leaked && digits === 0, [leaked, digits]); }
  /* a scan's hyphen mark is joined; a scan with damage is held to a stricter standard than a typed book */
  ok('a scan breaks a word with a ¬ mark and the two halves are joined', psgTidy('the Abra¬ ham of old and the sub¬ stance of it', true) === 'the Abraham of old and the substance of it');
  { const dirty = `The man went down to the river k and he saw e the boat near the bank, and the men were there ${'in the afternoon '.repeat(4)}and they spoke of the days that were past and of the days to come in that land.`; const clean = `The people had waited a long time for the rain, and when at last the first clouds came up over the hills the old man went out and stood in the road. He said nothing to anyone. His daughter, who had followed him, took his hand, and together they watched the dark edge of the storm move slowly across the valley.`;
    const mixed = [['Chapter 1', Array.from({ length: 16 }, (_, i) => (i % 6 === 5 ? dirty : clean) + ' ' + i).join('\n\n')], ['Chapter 2', Array.from({ length: 16 }, (_, i) => (i % 6 === 5 ? dirty : clean) + ' ' + i).join('\n\n')], ['Chapter 3', Array.from({ length: 16 }, (_, i) => (i % 6 === 5 ? dirty : clean) + ' ' + i).join('\n\n')]];
    const r = mulberry(2); let dirtyDrawn = 0; let drawn = 0; for (let i = 0; i < 120; i++) { const x = psgPickUnit(mixed, { license: 'Public domain (scan, OCR text)' }, r, { mode: 'passage' }); if (!x) continue; drawn++; if (C.psuNoise(x.text) > C.PSU_NOISE.scan) dirtyDrawn++; }
    ok('a scanned book gives its clean passages, not the ones with scan damage', drawn > 60 && dirtyDrawn / drawn < 0.15, [dirtyDrawn, drawn]);
    const allDirty = [['Chapter 1', Array.from({ length: 30 }, (_, i) => dirty + ' ' + i).join('\n\n')]];
    ok('a book whose every pick is damaged is left out of a draw among many books, and still gives its cleanest when it is asked for by name', psgPickUnit(allDirty, { license: 'scan' }, mulberry(3), { mode: 'passage' }) === null && !!psgPickUnit(allDirty, { license: 'scan' }, mulberry(3), { mode: 'passage', lenient: true })); }
}

if (!fs.existsSync(path.join(dir, 'index.js'))) { console.log(`${pass} passed, ${fail} failed (texts folder not built; skipped the per-book checks)`); process.exit(fail ? 1 : 0); }

/* ── every readable book ── */
const T = { data: {}, meta: {}, add(id, m, s) { this.data[id] = { m, s }; }, addIndex(i) { Object.assign(this.meta, i); } };
const run = (f) => vm.runInNewContext(fs.readFileSync(path.join(dir, f), 'utf8'), { BEATLAB_TEXTS: T }, { filename: f });
run('index.js'); const ids = Object.keys(T.meta); const noPassage = []; let total = 0;
const KEEP_TEXTS = new Set(['x-ana', 'x-are', 'x-ds', 'x-sps']);
const { psgPickUnit, psgRefOf } = require('../src/js/6d-passage.js'); const unitBad = []; const noUnit = []; let units = 0; const unitKinds = {};
for (const id of ids) {
  run(id + '.js'); const d = T.data[id]; const rng = mulberry(id.split('').reduce((a, c) => a * 31 + c.charCodeAt(0), 7));
  let got = 0; let bad = null;
  /* a passage and a page by the unit picker: clean, whole, cited, and with a place the reader can open */
  { const r2 = mulberry(id.split('').reduce((a, c) => a * 17 + c.charCodeAt(0), 5)); let g2 = 0; const secParas = (si) => String(d.s[si][1]).split(/\n{2,}/).length;
    for (let i = 0; i < 6; i++) {
      const mode = i % 3 === 2 ? 'page' : 'passage'; const u = psgPickUnit(d.s, d.m, r2, { mode, lenient: true }); if (!u) continue; g2++; units++; unitKinds[u.kind] = (unitKinds[u.kind] || 0) + 1; u.id = id;
      const c = u.text.replace(/\[\[\d+\]\]/g, ' ').replace(/\s+/g, ' ').trim(); const ref = psgRefOf(u, { title: d.m.title || id }, d.m, ''); let why = null;
      if (c.length < 60 || c.length > (mode === 'page' ? 3400 : 2300)) why = ['length', c.length];
      else if (englishScore(c) < 0.3) why = ['not English', c.slice(0, 60)];
      else if (psgApparatus(c)) why = ['editor’s notes', c.slice(0, 60)];
      else if (/^#{1,3} |\n#{1,3} /.test(u.text) || /<\/?(?:a|b|i|em|strong|span|br|p|div|sup|sub|u|font|j)\b[^>]*>/.test(u.text)) why = ['markup', u.text.slice(0, 50)];
      else if (!(u.si >= 0 && u.si < d.s.length) || u.heading !== d.s[u.si][0] || !(u.p >= 0 && u.pe >= u.p && u.pe < secParas(u.si))) why = ['place', u.si, u.p, u.pe];
      else if (!ref.main || !ref.cite || /undefined|NaN|\[object/.test(ref.main + ref.cite + (ref.sub || ''))) why = ['reference', ref];
      else if (u.kind === 'verses') { const nums = (u.text.match(/\[\[(\d+)\]\]/g) || []).map((x) => +x.slice(2, -2)); if (nums[0] !== u.from || nums[nums.length - 1] !== u.to || !new RegExp(`${u.from}${u.to !== u.from ? '–' + u.to : ''}(?: \\(|$)`).test(ref.main) || !/^(?:\([^\n]{0,300}\)\n)?\[\[\d+\]\]/.test(u.text) || !/[.!?…]["”’)\]]*$/.test(u.text.trim())) why = ['verses', ref.main, nums.slice(0, 3)]; }
      else if (/^[“"‘'(\[]*[a-z]/.test(c)) why = ['starts mid-sentence', c.slice(0, 50)];
      if (why) unitBad.push([id, mode, ...why]);
    }
    if (!g2) noUnit.push(id); }
  for (let i = 0; i < 40; i++) {
    const target = [320, 560, 1500, 3000][i % 4]; const p = pickPassage(d.s, d.m, rng, { target });
    if (!p) continue; got++; total++;
    const clean = p.text.replace(/\[\[\d+\]\]/g, ' ').replace(/\s+/g, ' ').trim();
    if (clean.length < 60 || clean.length > target * 2.2) bad = bad || ['length', clean.length];
    else if (englishScore(clean) < 0.3) bad = bad || ['not English', clean.slice(0, 80)];
    else if (psgApparatus(clean)) bad = bad || ['editor’s notes', clean.slice(0, 80)];
    else if (/^#{1,3} |\n#{1,3} /.test(p.text)) bad = bad || ['heading in passage', p.text.slice(0, 60)];
    else if (!(p.si >= 0 && p.si < d.s.length) || p.heading !== d.s[p.si][0]) bad = bad || ['section mismatch', p.si];
    else if (/<\/?(?:a|b|i|em|strong|span|br|p|div|sup|sub|u|font|j)\b[^>]*>/.test(p.text)) bad = bad || ['html in passage', p.text.slice(0, 60)];
    else if (/^[“"‘'(\[]*[a-z]/.test(clean)) bad = bad || ['starts mid-sentence', clean.slice(0, 60)];
    else if (!(p.p >= 0)) bad = bad || ['no paragraph index', p.p];
    else if (psgGlossaryLike(p.text) || psgContents(clean)) bad = bad || ['glossary or contents', clean.slice(0, 60)];
  }
  if (!got) noPassage.push(id);
  ok(id + ': every passage is clean English of a sensible length', !bad, bad);
  if (!KEEP_TEXTS.has(id)) delete T.data[id];      /* a text is let go when its checks are done (1,500 texts of 1.7 GB do not fit in node's 4 GB heap at once); the four named below are read again later */
}
ok('almost every readable book can give a passage', noPassage.length <= Math.max(2, ids.length * 0.01), noPassage);
/* an edition that numbers its notes is told apart from scripture that numbers its verses */
ok('Langdon’s numbered paragraphs are recognised as notes', psgNumberedAreNotes(T.data['x-sps'].s));
ok('the Diamond Sutra’s numbered verses are not', !psgNumberedAreNotes(T.data['x-ds'].s));
ok('Langdon never gives a numbered note as a passage', (() => { const r = mulberry(99); for (let i = 0; i < 60; i++) { const p = pickPassage(T.data['x-sps'].s, T.data['x-sps'].m, r, { target: [320, 560, 950, 1900][i % 4] }); if (p && /^\s*[\[(]?\d{1,3}\s?[.)]\s/.test(p.text)) return false; } return true; })());
if (noPassage.length) console.log('books with no usable passage:', noPassage.join(', '));
ok('the picker has been exercised', total > ids.length * 30, total);
ok(`every passage and page from the unit picker (${units}: ${Object.entries(unitKinds).map(([k, v]) => k + ' ' + v).join(', ')}) is clean, whole, cited, and has a place the reader can open`, unitBad.length <= Math.max(3, units * 0.001), unitBad.slice(0, 4));
ok('almost every readable book gives a passage and a page of its own kind', noUnit.length <= Math.max(3, ids.length * 0.01), noUnit);
ok('the verse books are drawn as verses, with their references', (unitKinds.verses || 0) > 300, unitKinds);

/* ── where a draw comes from: "Scriptures and sources" (the default) and "Everything" ── */
{
  const Q = require('../src/js/6d-passage.js'); const G = require('../src/js/2z-passage-core.js'); const D = require('../src/js/24-data-path-lib.js'); const LST = require('../src/js/2z-passage-pool.js');
  const scanM = { note: 'Text from a scan of the printed edition, so occasional OCR errors remain.', license: 'Public domain' }; const typedM = { note: '', license: 'Public domain' };
  const lib = [{ id: 'a', group: 'hb' }, { id: 'b', group: 'sc' }, { id: 'c', group: 'tb' }, { id: 'd', group: 'in' }, { id: 'e', group: 'in' }, { id: [...LST.PSU_ANNOTATED][0], group: 'in' }, { id: 'x-pop', group: 'am' }];
  const meta = { a: typedM, b: typedM, c: typedM, d: scanM, e: typedM }; meta[lib[5].id] = typedM; meta['x-pop'] = typedM;
  const src = Q.psgPoolOf(lib, 'sources', { shelfOnly: ['sc', 'tb'], meta }).map((l) => l.id);
  ok('the default pool leaves out the wider shelves, machine-read scans, the annotated editions and the books read through', src.join() === 'a,e', src);
  ok('Everything leaves out only what the reader asked to leave out', Q.psgPoolOf(lib, 'all', { shelfOnly: ['sc', 'tb'], meta, skip: (l) => l.id === 'c' }).map((l) => l.id).join() === ['a', 'b', 'd', 'e', lib[5].id, 'x-pop'].join());
  ok('a book that is never drawn (the example, a PDF) is left out of both pools when the books folder says so', (() => { globalThis.BOOKS = { noDraw: (id) => id === 'a' }; const r = Q.psgNever('a') && !Q.psgNever('e'); delete globalThis.BOOKS; return r && !Q.psgNever('a'); })());
  const readable = D.LIB.filter((l) => T.meta[l.id]); const pool = Q.psgPoolOf(readable, 'sources', { shelfOnly: D.LIB_SHELF_ONLY, meta: T.meta, skip: (l) => D.LIB_IMAGINED_GROUPS.includes(l.group) });
  const shelves = new Set(pool.map((l) => l.group));
  ok(`the default pool of this Library is typed, proofread books on many shelves (${pool.length} books on ${shelves.size} shelves)`, pool.length > 150 && pool.length < 320 && shelves.size >= 14 && ['b-gen', 'n-mat', 'x-dhp', 'x-qur'].every((id) => pool.some((l) => l.id === id)) && !pool.some((l) => /scan|OCR/i.test(`${T.meta[l.id].note || ''} ${T.meta[l.id].license || ''}`)) && !pool.some((l) => D.LIB_SHELF_ONLY.includes(l.group)), [pool.length, shelves.size]);
  ok('the annotated editions, and a scan such as Breasted’s Ancient Records of Egypt, are not in it, and are in Everything', !pool.some((l) => l.id === 'x-are' || LST.PSU_ANNOTATED.has(l.id) || LST.PSU_ABOUT.has(l.id)) && Q.psgPoolOf(readable, 'all', {}).some((l) => l.id === 'x-are'));
  /* every draw from either pool is a passage the gate lets through; a verse unit is judged only as a list of names */
  for (const [name, list, seed] of [['Scriptures and sources', pool, 31], ['Everything', Q.psgPoolOf(readable, 'all', { skip: (l) => D.LIB_IMAGINED_GROUPS.includes(l.group) }), 32]]) {
    const r = mulberry(seed); let n = 0; const bad = []; let marks = 0;
    for (let i = 0; i < 150; i++) {
      const how = Q.psgChooseBook(list, r); const t = T.data[how.id] || (run(how.id + '.js'), T.data[how.id]); const u = t && Q.psgPickUnit(t.s, t.m, r, { mode: i % 3 ? 'passage' : 'page' }); if (!u) continue; n++;
      const g = G.psuGate(G.psuVis(u.text), { scan: /scan|OCR/i.test(`${t.m.note || ''} ${t.m.license || ''}`), verse: u.kind === 'verses' }); if (!g.ok) bad.push([how.id, g.why.join(), u.text.slice(0, 60)]);
      if (/_[A-Za-z]/.test(u.text) || /\[\d{1,4}\]\s*$/.test(u.text.trim())) marks++;
    }
    ok(`${name}: 150 draws, each a passage the gate lets through, none with italics marks`, n >= 140 && bad.length <= 2 && marks === 0, [n, bad.slice(0, 3), marks]);
  }
  ok('a book asked for by name is still drawn from, even where the gate passes over most of it (the best pick is given)', (() => { const t = T.data['x-are']; const r = mulberry(5); let got = 0; for (let i = 0; i < 6; i++) if (Q.psgPickUnit(t.s, t.m, r, { mode: 'passage', lenient: true })) got++; return got === 6; })());
  ok('a draw is still a fixed function of its seed with the gate in the way (the same stream, the same passage)', (() => { const t = T.data['x-ana']; const a = Q.psgPickUnit(t.s, t.m, mulberry(77), { mode: 'passage' }); const b = Q.psgPickUnit(t.s, t.m, mulberry(77), { mode: 'passage' }); return a && b && a.text === b.text && a.p === b.p; })());
  const PROSE2 = 'The people had waited a long time for the rain, and when at last the first clouds came up over the hills the old man went out and stood in the road. He said nothing to anyone. His daughter, who had followed him, took his hand, and together they watched the dark edge of the storm move slowly across the valley toward the village where the others were already beginning to gather.';
  ok('italics marks in a text never reach the card', (() => { const r = mulberry(3); const secs = [['Chapter 1', Array.from({ length: 12 }, (_, i) => PROSE2.replace('old man', '_old man_').replace('rain', '_rain_') + ' ' + i).join('\n\n')]]; for (let i = 0; i < 12; i++) { const u = Q.psgPickUnit(secs, {}, r, { mode: 'passage' }); if (!u || /_/.test(u.text)) return false; } return true; })());
  ok('an editors’ preface is left out of a book whatever its size, so long as the book has other sections; a plain Introduction only when it is small', (() => { const big = [['Editors’ preface and introduction', 'x'.repeat(9000)], ['Chapter 1', 'y'.repeat(3000)]]; const plain = [['Introduction', 'x'.repeat(9000)], ['Chapter 1', 'y'.repeat(3000)]]; return Q.psgMatterSections(big).has(0) && !Q.psgMatterSections(plain).has(0) && !Q.psgMatterSections([['Preface', 'x'.repeat(100)]]).has(1); })());
}

/* ── a page of a book as it is printed (One page, Two pages): everything on it, except front matter in roman numerals, glossaries and appendixes ── */
{
  const Q = require('../src/js/6d-passage.js'); const G = require('../src/js/2z-passage-core.js'); const PG = require('../src/js/2z-pages-core.js');
  globalThis.sha256 = globalThis.sha256 || require('../src/js/00-util.js').sha256; const RR = require('../src/js/01-random.js'); globalThis.randCodeSeed = RR.randCodeSeed; globalThis.randSeedOk = RR.randSeedOk;      // the draw codes are read with the seed functions of 01-random.js
  const para = (k, dirty) => (dirty ? 'And the fame fhould be told how the confefled finnes of the people were bleffed, for he himfelf did fay that fome of them fhould come, and fo they went to fee the houfe of the Lord, and fuch as were there were glad of it. ' : 'The people had waited a long time for the rain, and when at last the first clouds came up over the hills the old man went out and stood in the road. ') + `Paragraph ${k} goes on with plain words, so that it is long enough to be half a page of a book printed long ago, and it ends here. He said nothing to anyone.`;
  const sec = (name, n, base, dirtyFrom) => [name, Array.from({ length: n }, (_, i) => para(base + i, dirtyFrom != null && i >= dirtyFrom && i < dirtyFrom + 4)).join('\n\n')];
  const secs = [sec('Preface', 6, 0), sec('Chapter 1', 30, 10, 8), sec('Glossary', 10, 50), sec('Appendix', 6, 70)];
  const flat = []; [['i', 0, 0], ['ii', 0, 2], ['iii', 0, 4]].forEach(([l, s, p]) => flat.push([s, p, 0, l])); for (let k = 0; k < 15; k++) flat.push([1, k * 2, 0, String(k + 1)]); for (let k = 0; k < 5; k++) flat.push([2, k * 2, 0, String(16 + k)]); for (let k = 0; k < 3; k++) flat.push([3, k * 2, 0, String(21 + k)]);
  const pgx = PG.pgmClean(flat.map((f) => [f[0], f[1], [[f[2], f[3]]]]), secs.length); const meta = { note: '', license: 'Public domain' };
  const draw = (o, n, seed) => { const r = mulberry(seed); const out = []; for (let i = 0; i < n; i++) { const u = Q.psgPickLeaf(secs, meta, r, Object.assign({ pgx }, o)); if (u) out.push(u); } return out; };
  const mp = Q.psgMatterParts(secs);
  ok('the book’s glossary and appendix are back matter and its preface front matter', mp.back.has(2) && mp.back.has(3) && mp.front.has(0) && !mp.back.has(1), [[...mp.back], [...mp.front]]);
  const on = draw({ count: 1, front: true, back: true }, 300, 1);
  ok('One page leaves out roman-numeral pages, the glossary and the appendix, and each page is cited by its printed number', on.length === 300 && on.every((u) => u.kind === 'leaf' && u.leaves === 1 && u.si === 1 && /^p\. \d{1,2}$/.test(u.cite) && !G.psuRoman(u.first)), [on.length, on.slice(0, 2).map((u) => [u.si, u.cite])]);
  const roman = draw({ count: 1, front: false, back: true }, 600, 2); const gl = draw({ count: 1, front: true, back: false }, 600, 3);
  ok('with front matter allowed its roman pages come up, with glossaries and appendixes allowed they come up', roman.some((u) => G.psuRoman(u.first) && u.si === 0) && gl.some((u) => u.si === 2 || u.si === 3), [roman.filter((u) => u.si === 0).length, gl.filter((u) => u.si >= 2).length]);
  ok('every page that may be drawn is equally likely (15 pages of the chapter, 300 draws)', (() => { const c = {}; draw({ count: 1, front: true, back: true }, 1500, 4).forEach((u) => { c[u.first] = (c[u.first] || 0) + 1; }); const k = Object.keys(c); return k.length === 15 && Math.min(...Object.values(c)) > 50 && Math.max(...Object.values(c)) < 160; })());
  const two = draw({ count: 2, front: true, back: true }, 200, 5);
  ok('Two pages are two printed pages one after the other, in one section: pp. 4–5', two.length === 200 && two.every((u) => u.leaves === 2 && /^pp\. (\d+)–(\d+)$/.test(u.cite) && +/^pp\. (\d+)–(\d+)$/.exec(u.cite)[2] === +/^pp\. (\d+)–(\d+)$/.exec(u.cite)[1] + 1 && u.si === 1) && two[0].text.length > on[0].text.length * 1.4, two[0] && two[0].cite);
  ok('a page holds everything on it, a damaged one too, unless clean text is asked for; then it never does', draw({ count: 1, front: true, back: true }, 400, 6).some((u) => /fhould/.test(u.text)) && !draw({ count: 1, front: true, back: true, clean: true }, 400, 6).some((u) => /fhould/.test(u.text)) && draw({ count: 1, front: true, back: true, clean: true }, 50, 7).length === 50);
  ok('a page is a fixed function of the stream, so a draw code replays it', (() => { const a = draw({ count: 2, front: true, back: true }, 5, 9); const b = draw({ count: 2, front: true, back: true }, 5, 9); return a.length === 5 && a.every((u, i) => u.text === b[i].text && u.cite === b[i].cite && u.p === b[i].p); })());
  const none = (o, n, seed) => { const r = mulberry(seed); const out = []; for (let i = 0; i < n; i++) { const u = Q.psgPickLeaf(secs, meta, r, o); if (u) out.push(u); } return out; };
  const win = none({ count: 1, front: true, back: true }, 200, 11);
  ok('a book with no printed page numbers gives a window of about a page, from paragraph edge to paragraph edge, outside its preface, glossary and appendix, cited by its section', win.length === 200 && win.every((u) => u.nopages && u.cite === '' && u.si === 1 && G.psuVis(u.text).length >= 400 && G.psuVis(u.text).length <= 7000 && /^Paragraph|^The people|^And the fame/.test(u.text)));
  ok('and two pages of it are a longer window; a page of a book asked for by name is still given when nothing else would be', none({ count: 2, front: true, back: true }, 30, 12).every((u) => G.psuVis(u.text).length > 2000) && (() => { const tiny = [['Chapter 1', 'y '.repeat(175)], ['Glossary', 'x '.repeat(225)]]; return Q.psgMatterParts(tiny).back.has(1) && !!Q.psgPickLeaf(tiny, meta, mulberry(1), { count: 1, lenient: true }) && !Q.psgPickLeaf(tiny, meta, mulberry(1), { count: 1 }); })());
  ok('a draw code of a page or of two is read, and the codes made before still are', Q.psgParseCode('b-gen.page.' + 'a'.repeat(32)) && Q.psgParseCode('b-gen.pages.' + 'a'.repeat(32)).len === 'pages' && Q.psgParseCode('b-gen.long.' + 'a'.repeat(32)) && Q.psgParseCode('b-gen.passage.' + 'a'.repeat(32)) && !Q.psgParseCode('b-gen.sheet.' + 'a'.repeat(32)));
  /* the real Library: every book that has printed pages gives them, and none is front matter, glossary or appendix */
  const pgsIdx = {}; vm.runInNewContext(fs.readFileSync(path.join(dir, 'pgs.js'), 'utf8'), { globalThis: pgsIdx }); const PN = pgsIdx.BEATLAB_PAGEN || {};
  const withPages = ids.filter((id) => PN[id]); const r2 = mulberry(21); let drawn = 0; const bad = []; let cited = 0; let backHit = 0; let windows = 0;
  for (let i = 0; i < 160; i++) {
    const id = withPages[Math.floor(r2() * withPages.length)]; const t = T.data[id] || (run(id + '.js'), T.data[id]); const g = {}; vm.runInNewContext(fs.readFileSync(path.join(dir, 'pg-' + id + '.js'), 'utf8'), { globalThis: g }); const px = PG.pgmClean((g.BEATLAB_PAGES || {})[id], t.s.length);
    const u = Q.psgPickLeaf(t.s, t.m, r2, { count: i % 2 ? 2 : 1, front: true, back: true, pgx: px, vols: [] }); if (!u) continue; drawn++;
    const n = G.psuVis(u.text).length; if (n < 400 || n > 12000 || G.psuRoman(u.first)) bad.push([id, u.cite, n]); if (/^(?:Vol\. \d+, )?pp?\. \d/.test(u.cite)) cited++; else if (u.nopages) windows++;      // a text with fewer than four page marks is cut into a window of about a page if (Q.psgMatterParts(t.s).back.has(u.si)) backHit++;
  }
  ok(`160 pages from books with printed pages: each cited by its number (or, for a book with almost no marks, a window), a sensible length, never roman, never in a glossary or appendix (${drawn} drawn)`, drawn >= 155 && bad.length === 0 && cited + windows === drawn && windows <= 6 && backHit === 0, [drawn, cited, windows, backHit, bad.slice(0, 3)]);
  let leafBooks = 0; let leafNone = []; const r3 = mulberry(33);
  for (const id of ids) { const t = T.data[id] || (run(id + '.js'), T.data[id]); let u = null; for (let k = 0; k < 4 && !u; k++) u = Q.psgPickLeaf(t.s, t.m, r3, { count: 1, front: true, back: true }); if (u) leafBooks++; else leafNone.push(id); }
  ok('almost every readable book gives a page of text even with no page marks at all', leafNone.length <= Math.max(5, ids.length * 0.01), leafNone.slice(0, 8));
}
/* ── how long a passage is (Short, Medium, Longer), on real books: a book of verses, one of numbered sayings, and prose ── */
{
  const Q = require('../src/js/6d-passage.js'); const G = require('../src/js/2z-passage-core.js'); const vis = (t) => G.psuVis(t);
  const books = ['b-psa', 'b-pro', 'b-gen', 'x-dhp', 'x-dao', 'e-zoh', 'x-mn'].filter((id) => ids.includes(id)); const rows = [];
  for (const id of books) {
    if (!T.data[id]) run(id + '.js'); const d = T.data[id]; const seeds = Array.from({ length: 40 }, (_, k) => 9000 + k);
    const draw = (s, size) => Q.psgPickUnit(d.s, d.m, mulberry(s), size === undefined ? { mode: 'passage', lenient: true } : { mode: 'passage', size, lenient: true });
    const L = (size) => seeds.map((s) => { const u = draw(s, size); return u ? vis(u.text).length : null; }); const ls = L('short'); const lm = L('medium'); const ll = L('longer'); const m = (a) => { const b = a.filter((x) => x != null); return b.reduce((x, y) => x + y, 0) / Math.max(b.length, 1); };
    rows.push([id, Math.round(m(ls)), Math.round(m(lm)), Math.round(m(ll))]);
    ok(`${id}: Short is shorter than Medium and Medium shorter than Longer (mean visible characters ${Math.round(m(ls))} < ${Math.round(m(lm))} < ${Math.round(m(ll))})`, m(ls) < m(lm) && m(lm) < m(ll), [ls.slice(0, 6), lm.slice(0, 6), ll.slice(0, 6)]);
    ok(`${id}: Medium is the passage of every earlier code (the same seed gives the same unit with no size and with "medium")`, seeds.slice(0, 20).every((s) => { const a = draw(s); const b = draw(s, 'medium'); return (!a && !b) || (a && b && a.text === b.text && a.si === b.si && a.p === b.p); }));
    ok(`${id}: a Short or Longer passage replays from its seed, and is cited like any passage`, seeds.slice(0, 12).every((s) => ['short', 'longer'].every((z) => { const a = draw(s, z); const b = draw(s, z); if (!a && !b) return true; if (!a || !b || a.text !== b.text) return false; const ref = Q.psgRefOf(a, { title: d.m.title || id }, d.m, ''); return ref.main && !/undefined|NaN|\[object/.test(ref.main + (ref.sub || '')); })));
    ok(`${id}: no Short, Medium or Longer draw is an editor's note, markup or a heading`, seeds.every((s) => ['short', 'medium', 'longer'].every((z) => { const u = draw(s, z); if (!u) return true; const c = vis(u.text); return !Q.psgApparatus(c) && !/^#{1,3} |\n#{1,3} /.test(u.text) && !/<\/?(?:a|b|i|em|strong|span|br|p|div|sup|sub|u|font|j)\b[^>]*>/.test(u.text) && !/^[“"‘'(\[]*[a-z]/.test(c); })));
  }
  ok('the three lengths were tried on real books (Psalms, Proverbs, Genesis, the Dhammapada, the Tao Te Ching, the Zohar, the Majjhima Nikaya, where they are in the Library)', rows.length >= 3, rows);
  console.log('  lengths (mean visible characters, short / medium / longer): ' + rows.map((r) => r.join(' ')).join('; '));
}
console.log(`${ids.length} books, ${total} passages checked; ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
