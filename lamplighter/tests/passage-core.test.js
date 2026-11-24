// Run: node tests/passage-core.test.js — what a random passage is (src/js/2z-passage-core.js): verse units with exact references, a heading made readable, a reference never invented,
// the scoring of a candidate, and no repeats. With the texts folder beside it, every verse-marked book is drawn from as well (skipped if ../../texts is absent).
const fs = require('fs'); const path = require('path'); const vm = require('vm');
const C = require('../src/js/2z-passage-core.js'); const dir0 = path.join(__dirname, '../../texts');
let pass = 0, fail = 0; const ok = (n, c, x = '') => { if (c) pass++; else { fail++; console.log('FAIL', n, typeof x === 'string' ? x : JSON.stringify(x).slice(0, 400)); } };
const mulberry = (a) => () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

/* ── a psalm: a title line, verses with poetry lines, one paragraph ── */
const PSALM4 = `(For the Chief Musician; on stringed instruments. A Psalm by David.)
[[1]] Answer me when I call, God of my righteousness.
  Give me relief from my distress.
  Have mercy on me, and hear my prayer.
[[2]] You sons of men, how long shall my glory be turned into dishonor?
  Will you love vanity and seek after falsehood? Selah.
[[3]] But know that Yahweh has set apart for himself him who is godly;
  Yahweh will hear when I call to him.
[[4]] Stand in awe, and don’t sin.
  Search your own heart on your bed, and be still. Selah.
[[5]] Offer the sacrifices of righteousness.
  Put your trust in Yahweh.
[[6]] Many say, “Who will show us any good?”
  Yahweh, let the light of your face shine on us.
[[7]] You have put gladness in my heart,
  more than when their grain and their new wine are increased.
[[8]] In peace I will both lay myself down and sleep,
  for you alone, Yahweh, make me live in safety.`;
{
  const P = C.psuVerseParse(PSALM4);
  ok('a psalm parses into its eight verses, numbered as the text numbers them', P && P.n === 8 && P.v.map((x) => x.n).join() === '1,2,3,4,5,6,7,8', P && P.v.map((x) => x.n));
  ok('the title line belongs to verse 1 and is not part of its words', P.v[0].pre.startsWith('(For the Chief Musician') && P.v[0].t.startsWith('Answer me when I call') && !P.v[1].pre);
  ok('the verses keep their poetry lines', P.v[0].t.split('\n').length === 3 && /^  Give me relief/m.test(P.v[0].t));
  ok('the whole psalm is one paragraph (no break before any verse but the first)', P.v[0].pb && P.v.slice(1).every((x) => !x.pb) && P.v[7].pa && P.v.slice(0, 7).every((x) => !x.pa));
  ok('verses a..b are given back as the chapter has them, with the title at the start', C.psuVerseText(P, 0, 1).startsWith('(For the Chief Musician') && /\[\[1\]\] Answer me[\s\S]*\n\[\[2\]\] You sons of men/.test(C.psuVerseText(P, 0, 1)) && !C.psuVerseText(P, 1, 2).includes('Chief Musician') && C.psuVerseText(P, 1, 2).startsWith('[[2]] You sons'));
  ok('a character offset falls in the verse that holds it, every verse by its own length', C.psuVerseAt(P, 0) === 0 && C.psuVerseAt(P, P.total - 1) === 7 && C.psuVerseAt(P, P.cum[3]) === 3 && C.psuVerseAt(P, P.cum[3] - 1) === 2);
  const u = C.psuVerseUnit(P, 3, C.PSU_SIZES.passage);
  ok('a psalm that is shorter than the largest unit is given whole, title and all', u && u.a === 0 && u.b === 7 && C.psuVerseText(P, u.a, u.b).startsWith('(For the Chief Musician'), u);
  ok('and its reference is the psalm and its verses', C.psuRefVerses({ title: 'Psalms', heading: 'Psalm 4', from: P.v[u.a].n, to: P.v[u.b].n }).main === 'Psalm 4:1–8');
  const s = C.psuVerseUnit(P, 3, { min: 100, target: 200, max: 330 });
  ok('with a smaller largest size, a unit is a run of verses cut at the ends of sentences', s && s.b - s.a >= 1 && C.psuCut(P, s.a - 1) && C.psuCut(P, s.b), s);
  ok('the cut is never after a verse that stops in the middle of a sentence (a semicolon or a comma)', (() => { for (let L = 0; L < 8; L++) { const x = C.psuVerseUnit(P, L, { min: 100, target: 200, max: 330 }); if (x && x.b < 7 && !/[.!?]”?$/.test(P.v[x.b].t)) return false; } return true; })());
  ok('a unit always holds the place that was drawn', (() => { for (let L = 0; L < 8; L++) { const x = C.psuVerseUnit(P, L, { min: 100, target: 200, max: 330 }); if (!x || x.a > L || x.b < L) return false; } return true; })());
  ok('the same place gives the same unit (so a draw code replays)', JSON.stringify(C.psuVerseUnit(P, 5, { min: 100, target: 200, max: 330 })) === JSON.stringify(C.psuVerseUnit(P, 5, { min: 100, target: 200, max: 330 })));
}
ok('a section whose verse numbers do not rise is not read as verses, and nor is one with a single marker', C.psuVerseParse('[[1]] A. [[3]] B. [[2]] C.') === null && C.psuVerseParse('[[1]] Only one verse here.') === null && C.psuVerseParse('No verses at all.') === null);

/* ── paragraphs are the natural unit; a short one joins its neighbour; a long one is cut at a sentence ── */
const para = (from, to, w) => Array.from({ length: to - from + 1 }, (_, i) => `[[${from + i}]] ${w} verse ${from + i} says one thing, and then another thing that is a little longer, so that it fills a line.`).join(' ');
{
  const text = [para(1, 4, 'First'), para(5, 8, 'Second'), para(9, 12, 'Third'), para(13, 14, 'Fourth')].join('\n\n');
  const P = C.psuVerseParse(text);
  ok('blank lines are the paragraph breaks', P.n === 14 && P.v[4].pb && P.v[8].pb && P.v[12].pb && !P.v[5].pb && P.v[3].pa && !P.v[2].pa);
  ok('a place inside a paragraph gives that whole paragraph', (() => { const u = C.psuVerseUnit(P, 6, { min: 100, target: 330, max: 700 }); return u && u.a === 4 && u.b === 7; })(), C.psuVerseUnit(P, 6, { min: 100, target: 330, max: 700 }));
  ok('the same paragraph is given from any place in it', [4, 5, 6, 7].every((L) => { const u = C.psuVerseUnit(P, L, { min: 100, target: 330, max: 700 }); return u && u.a === 4 && u.b === 7; }));
  ok('a paragraph too short to stand alone joins its neighbour at a paragraph edge', (() => { const u = C.psuVerseUnit(P, 13, { min: 500, target: 700, max: 1200 }); return u && u.b === 13 && u.a <= 12 && P.v[u.a].pb; })(), C.psuVerseUnit(P, 13, { min: 500, target: 700, max: 1200 }));
  ok('a unit never goes beyond the largest size', [0, 3, 6, 9, 12].every((L) => { const u = C.psuVerseUnit(P, L, { min: 100, target: 330, max: 700 }); return !u || u.len <= 700; }));
  const big = C.psuVerseParse(para(1, 40, 'Long'));
  ok('one long paragraph is cut to a few verses around the place, never under the smallest size', [3, 17, 33].every((L) => { const u = C.psuVerseUnit(big, L, C.PSU_SIZES.passage); return u && u.a <= L && u.b >= L && u.len >= 140 && u.len <= 1100; }));
  { /* the three lengths of a passage (Short, Medium, Longer) */
    const ks = ['short', 'medium', 'longer']; const at = [2, 7, 12, 17, 22, 27, 33, 37]; const U = Object.fromEntries(ks.map((k) => [k, at.map((L) => C.psuVerseUnit(big, L, C.PSU_PASSAGE[k]))]));
    const mean = (k) => U[k].reduce((s, u) => s + u.len, 0) / U[k].length;
    ok('the three sizes: Medium is exactly the size every earlier passage had (so every earlier code replays), and a word that is none of them is Medium', ['min', 'target', 'max'].every((f) => C.PSU_PASSAGE.medium[f] === C.PSU_SIZES.passage[f]) && C.psuSizeOf('short') === 'short' && C.psuSizeOf('longer') === 'longer' && C.psuSizeOf('medium') === 'medium' && ['nope', undefined, null, 5, '__proto__'].every((x) => C.psuSizeOf(x) === 'medium'));
    ok('every unit of every length is a run of whole verses between that length’s smallest and largest size', ks.every((k) => U[k].every((u, i) => u && u.a <= at[i] && u.b >= at[i] && u.len >= C.PSU_PASSAGE[k].min && u.len <= C.PSU_PASSAGE[k].max)), ks.map((k) => U[k].map((u) => u && u.len)));
    ok('Short is a verse or two, Medium a few verses, Longer a longer run: the mean length rises with the choice and the ranges do not run together', mean('short') < mean('medium') && mean('medium') < mean('longer') && Math.max(...U.short.map((u) => u.len)) <= 420 && Math.min(...U.longer.map((u) => u.len)) >= 500, ks.map(mean));
    ok('the same place and size always give the same unit (a draw code replays it)', ks.every((k) => at.every((L) => JSON.stringify(C.psuVerseUnit(big, L, C.PSU_PASSAGE[k])) === JSON.stringify(C.psuVerseUnit(big, L, C.PSU_PASSAGE[k])))));
  }
  ok('"Read on" begins after the verse it follows', (() => { const u = C.psuVerseUnit(big, 12, C.PSU_SIZES.passage); const n = C.psuVerseUnit(big, u.b + 1, Object.assign({}, C.PSU_SIZES.passage, { from: u.b + 1 })); return n && n.a === u.b + 1 && n.b > n.a - 1; })());
  ok('the end of a chapter is a place where "Read on" finds nothing more', C.psuVerseUnit(P, 13, { min: 100, target: 330, max: 700, from: 14 }) === null);
}
/* a verse that does not start a sentence is not a place to begin; a verse that begins with a lower-case word carries on the one before */
{
  const text = '[[1]] He went up the hill with his sons, and they carried the wood for the fire and the knife for the offering, [[2]] and when they came to the place he built an altar and laid the wood in order. [[3]] Then he said to the young men, Stay here with the donkey, and I and the boy will go over there and worship, and come again to you.';
  const P = C.psuVerseParse(text);
  ok('a verse that stops with a comma is not an edge, and one that begins in lower case belongs to the verse before', !C.psuCut(P, 0) && C.psuCut(P, 1) && C.psuLower(P.v[1].t) && !C.psuCut(P, 2) === false);
  const u = C.psuVerseUnit(P, 1, { min: 100, target: 300, max: 900 });
  ok('so a unit from that text begins at verse 1, not at verse 2', u && u.a === 0, u);
}
/* speeches */
{
  const text = [`[[1]] Jesus said to them, “Go and tell John what you hear and see. [[2]] The blind receive their sight, and the lame walk. [[3]] The poor have good news preached to them.”`, `[[4]] When they had gone, he began to speak to the crowds about John, “What did you go out into the wilderness to see? A reed shaken by the wind? [[5]] But what did you go out to see? A man in soft clothing?`, `[[6]] “Behold, those who wear soft clothing are in kings’ houses. [[7]] This is he of whom it is written, ‘Behold, I send my messenger before your face.’ [[8]] I tell you, among those born of women there has not arisen anyone greater than John the Baptist.”`].join('\n\n');
  const P = C.psuVerseParse(text);
  ok('quotation marks are counted for each verse', P.v.map((x) => x.qd).join() === '1,0,-1,1,0,1,0,-1', P.v.map((x) => x.qd));
  ok('a unit that begins inside a speech opened earlier in its paragraph is allowed only at a cost, and a whole speech is preferred', (() => { const u = C.psuVerseUnit(P, 1, { min: 100, target: 250, max: 500 }); return u && u.a === 0 && !u.torn; })(), C.psuVerseUnit(P, 1, { min: 100, target: 250, max: 500 }));
  ok('a speech that goes on in the next paragraph may stop at the end of its paragraph', (() => { const u = C.psuVerseUnit(P, 3, { min: 100, target: 330, max: 600 }); return u && u.b === 4; })(), C.psuVerseUnit(P, 3, { min: 100, target: 330, max: 600 }));
}
/* a title between two verses belongs to the verse after it */
{
  const text = `## BOOK 1\n\n[[1]] Blessed are those whose ways are blameless,\n  who walk according to Yahweh’s law.\n[[2]] Blessed are those who keep his statutes.\n\n(BETH)\n[[3]] How can a young man keep his way pure?\n  By living according to your word.\n[[4]] With my whole heart I have sought you.`;
  const P = C.psuVerseParse(text);
  ok('a heading in markdown is not text, and a bracketed title belongs to the verse that follows it', P.n === 4 && !P.v[0].pre && P.v[2].pre === '(BETH)' && !P.v[1].t.includes('BETH') && C.psuVerseText(P, 2, 3).startsWith('(BETH)\n[[3]] How can'), P.v.map((x) => [x.n, x.pre]));
  ok('and the paragraph break before the title is kept', P.v[2].pb && C.psuVerseText(P, 1, 2).includes('statutes.\n\n(BETH)\n[[3]]'));
}

/* ── references ── */
ok('Psalm 4:1–3: a psalm cited by its psalm number and its verses', C.psuRefVerses({ title: 'Psalms', heading: 'Psalm 4', from: 1, to: 3 }).main === 'Psalm 4:1–3');
ok('Genesis 6:5–8: a book cited by its title, the chapter from the heading and the verses', C.psuRefVerses({ title: 'Genesis', heading: 'Chapter 6', from: 5, to: 8 }).main === 'Genesis 6:5–8');
ok('one verse is cited by its number alone, and an edition with other numbers says so', C.psuRefVerses({ title: 'John', heading: 'Chapter 3', from: 16, to: 16 }).main === 'John 3:16' && C.psuRefVerses({ title: 'Septuagint', heading: 'Psalm 22', from: 1, to: 2, tag: 'Septuagint numbering' }).main === 'Psalm 22:1–2 (Septuagint numbering)');
ok('a book whose headings name the book (the Septuagint) is cited by that name', C.psuRefVerses({ title: 'Septuagint: the Greek Old Testament in English (Brenton)', heading: 'Genesis 1', from: 1, to: 3 }).main === 'Genesis 1:1–3');
ok('a short book with no chapters is cited by its verses; a title with a note in brackets loses the note', C.psuRefVerses({ title: 'Susanna (Daniel addition)', heading: 'Susanna (Daniel 13, Greek)', from: 5, to: 9 }).main === 'Susanna 5–9' && C.psuBookName('Ecclesiastes (Qohelet)') === 'Ecclesiastes' && C.psuBookName('2 Esdras (= 4 Ezra, with Christian frames)') === '2 Esdras');
ok('numbered books and a heading with a number in its name are read right', C.psuRefVerses({ title: '1 Corinthians', heading: 'Chapter 13', from: 4, to: 7 }).main === '1 Corinthians 13:4–7' && C.psuHeadNum('Psalm 119').num === 119 && C.psuHeadNum('Chapter 6').name === 'Chapter' && C.psuHeadNum('The Prayer of Azariah (Daniel 3:24–90, Greek)').num === 0);
ok('a verse range is written with an en dash, and one number when they are equal', C.psuDash(4, 4) === '4' && C.psuDash(1, 3) === '1–3');

/* ── the words for a section ── */
ok('a split section loses "part 2 of 5" and the first-words tail the splitter adds', C.psuHeading('Introduction · part 2 of 3 · The Suras, viewed as a whole, strike…') === 'Introduction' && C.psuHeading('The Rites · part 3 of 9 · and the Lord said…') === 'The Rites');
ok('a heading printed in capitals is read as a title, with its Roman numerals kept and the note mark stuck to a word taken off', C.psuHeading('SURA LXXIV.-THE ENWRAPPED1 [II.]') === 'Sura LXXIV.-The Enwrapped [II.]' && C.psuHeading('SURA XCIII.1-THE BRIGHTNESS [IV.]') === 'Sura XCIII.1-The Brightness [IV.]' && C.psuHeading('CHAPTER IV · part 3 of 9 · and the Lord said…') === 'Chapter IV' && C.psuHeading('CIVIL WAR') === 'Civil War' && C.psuHeading('Chapter IV. Flowers') === 'Chapter IV. Flowers' && C.psuHeading('THE I AM SAYINGS') === 'The I Am Sayings');
ok('a very long heading is cut at a word, with an ellipsis', (() => { const h = C.psuHeading('Part 1 · ' + 'A very long section title that goes on and on '.repeat(5), 80); return h.length <= 81 && h.endsWith('…') && !/\s…$/.test(h); })());
ok('a title is shortened at its first bracket, only if what is left is a name', C.psuShortTitle('Travels in Arabia Deserta (Charles M. Doughty, 1888), two volumes') === 'Travels in Arabia Deserta' && C.psuShortTitle('Qur’an') === 'Qur’an' && C.psuShortTitle('A (b)') === 'A (b)');
{
  const r = C.psuRefProse({ title: 'Travels in Arabia Deserta (Charles M. Doughty, 1888)', heading: 'Volume 1 · CHAPTER IV · part 3 of 9 · The next…', pages: 'p. 214' });
  ok('prose is cited by title, section and the printed page when there is one', r.main === 'Travels in Arabia Deserta' && r.sub === 'Volume 1 · Chapter IV · part 3 of 9, p. 214' && r.cite === 'Travels in Arabia Deserta, Volume 1 · Chapter IV · part 3 of 9, p. 214' && r.kind === 'page', r);
  const r2 = C.psuRefProse({ title: 'Analects', heading: 'BOOK VI. YUNG YEY.', pages: '' });
  ok('and by title and section where the text has no printed page, never with a page made up', r2.cite === 'Analects, Book VI. Yung Yey.' && r2.kind === 'section' && !/p\. /.test(r2.cite + r2.sub));
  ok('a later part of a long section says which part it is (the name is the name of where the section begins), the first part and a section with no name of its own do not', C.psuRefProse({ title: 'Qur’an (E. H. Palmer)', heading: 'Part 2 · Sūras 17–114 (SBE 9) · CXIV. The Chapter of Men · part 10 of 20 · Have they not looked…', pages: 'Vol. 2, p. 274' }).sub === 'Part 2 · Sūras 17–114 (SBE 9) · CXIV. The Chapter of Men · part 10 of 20, Vol. 2, p. 274' &&C.psuRefProse({ title: 'T', heading: 'Chapter IV · part 1 of 9 · It was…' }).sub === 'Chapter IV' && C.psuRefProse({ title: 'T', heading: 'Part 3 of 5 · It was…', section: 3, sections: 5 }).sub === 'section 3 of 5');
  ok('a section with no name of its own is cited by its place in the book',C.psuRefProse({ title: 'A Ritual of Freemasonry', heading: 'Part 3 of 9 · Furthermore, do I…', section: 3, sections: 9, pages: '' }).sub === 'section 3 of 9' && C.psuRefProse({ title: 'A Ritual of Freemasonry', heading: '', section: 1, sections: 1, pages: '' }).kind === 'book');
  ok('a volume is not named twice (the heading already says it)', C.psuRefProse({ title: 'Carmina Gadelica', heading: 'Volume 1', pages: 'Vol. 1, p. 67' }).sub === 'Volume 1, p. 67' && C.psuRefProse({ title: 'X', heading: 'Chapter 4', pages: 'Vol. 2, p. 67' }).sub === 'Chapter 4, Vol. 2, p. 67');
  ok('a psalm whose heading names several people says so', C.psuKind('b-psa', '(A Song. A Psalm by the sons of Korah. For the Chief Musician. A contemplation by Heman, the Ezrahite.)') === 'a psalm; its heading names the sons of Korah and Heman' && C.psuKind('b-psa', '(A Psalm by David.)') === 'a psalm; its heading names David' && C.psuKind('b-psa', '(For the Chief Musician.)') === 'a psalm' && C.psuKind('b-gen', '') === 'law and narrative (Torah)' && C.psuKind('x-dhp', '') === '' && C.psuKind('__proto__', '') === '');
  ok('a chip is short', C.psuRefProse({ title: 'The Religion and Philosophy of the Veda and Upanishads, two volumes', heading: 'Volume 1 · CHAPTER 1', pages: 'p. 12' }).short.length < 50);
}
ok('the line of context is the shelf, the kind of text and the date, whichever are known', C.psuContext({ shelf: 'Hebrew Bible', when: 'c. 10th–2nd c. BCE (collected)' }) === 'Hebrew Bible · c. 10th–2nd c. BCE (collected)' && C.psuContext({ shelf: 'Iran and Islam', genre: 'scripture or canon', when: '610–632 CE' }) === 'Iran and Islam · scripture or canon · 610–632 CE' && C.psuContext({}) === '');
ok('a shelf is named briefly', C.psuShelfName('Hebrew Bible · Old Testament (39 books)') === 'Hebrew Bible' && C.psuShelfName('New Testament (27 books)') === 'New Testament' && C.psuShelfName('Jewish tradition after the Bible: Talmud, Kabbalah, philosophy and prayer') === 'Jewish tradition after the Bible');

/* ── scoring ── */
const GOOD = 'The people had waited a long time for the rain, and when at last the first clouds came up over the hills the old man went out and stood in the road. He said nothing to anyone. His daughter, who had followed him, took his hand, and together they watched the dark edge of the storm move slowly across the valley.';
ok('a whole thought is clean', C.psuAssess(GOOD, { min: 100 }).ok && C.psuAssess(GOOD, { min: 100 }).score === 1, C.psuAssess(GOOD, { min: 100 }));
ok('a fragment that begins in lower case or stops short is named', C.psuAssess('and the first of the stars came out above the hills. They rested there until morning, and in the morning they went on together', { min: 60 }).flags.join() === 'starts-lower,ends-open');
ok('a speech left open is named', C.psuAssess('He said, “We will go on to the river and there we will wait for them until the morning comes.', { min: 60 }).flags.includes('quote-open'));
ok('a text too short is named', C.psuAssess('He went.', { min: 60 }).flags.includes('short'));
ok('a list of names is named', C.psuAssess('Adam, Seth, Enosh, Kenan, Mahalalel, Jared, Enoch, Methuselah, Lamech, Noah, Shem, Ham, and Japheth and Gomer, Magog, Madai, Javan, Tubal, Meshech, and Tiras and Ashkenaz Riphath Togarmah.', { min: 60 }).flags.includes('lists'));
ok('scan garbage is named, and a scan is held to a stricter standard than a typed text', (() => { const g = 'of the Lord that like as he hath • save as k the apostle you also from death unto 0 “fc he wouldrafse wlnehnow are blotted out °f the book ofltfe. 8 y ° Ur SOuls and the rest of it was not read.'; return C.psuAssess(g, { min: 60 }).flags.includes('noisy'); })() && C.psuNoise(GOOD) === 0 && C.psuAssess(GOOD.replace('rain,', 'r4in,').replace('hills', 'h1lls'), { min: 60, scan: true }).flags.includes('noisy') && !C.psuAssess(GOOD.replace('rain,', 'r4in,').replace('hills', 'h1lls'), { min: 60 }).flags.includes('noisy'));
ok('a verse passage that ends the chapter may end without a full stop', !C.psuAssess('[[1]] Praise Yah! Praise Yahweh, my soul. I will praise Yahweh while I live and sing to my God while I have any being, for ever and ever amen', { min: 60, chapterEnd: true }).flags.includes('ends-open'));

/* ── no repeats ── */
{
  const a = { id: 'b-psa', si: 3, from: 1, to: 4 };
  ok('two units in one place overlap, and units in other places do not', C.psuOverlap(a, { id: 'b-psa', si: 3, from: 4, to: 8 }) && !C.psuOverlap(a, { id: 'b-psa', si: 3, from: 5, to: 8 }) && !C.psuOverlap(a, { id: 'b-psa', si: 4, from: 1, to: 4 }) && !C.psuOverlap(a, { id: 'b-gen', si: 3, from: 1, to: 4 }) && !C.psuOverlap(a, null));
  ok('a session remembers what it has shown', C.psuSeenAny([{ id: 'b-gen', si: 0, from: 1, to: 3 }, a], { id: 'b-psa', si: 3, from: 2, to: 3 }) && !C.psuSeenAny([a], { id: 'b-psa', si: 5, from: 2, to: 3 }) && !C.psuSeenAny([], a));
}

/* ── every verse-marked book of the Library ── */
const dir = path.join(__dirname, '../../texts');
if (!fs.existsSync(path.join(dir, 'index.js'))) { console.log(`${pass} passed, ${fail} failed (texts folder not built; skipped the per-book checks)`); process.exit(fail ? 1 : 0); }
const T = { data: {}, meta: {}, add(id, m, s) { this.data[id] = { m, s }; }, addIndex(i) { Object.assign(this.meta, i); } };
const run = (f) => vm.runInNewContext(fs.readFileSync(path.join(dir, f), 'utf8'), { BEATLAB_TEXTS: T }, { filename: f });
run('index.js'); let books = 0; let places = 0; let nulls = 0; let paragraphEdge = 0; let sections = 0; let unread = 0; const lens = []; const problems = [];
for (const id of Object.keys(T.meta).filter((x) => /^[bndop]-/.test(x))) {
  run(id + '.js'); const d = T.data[id]; const parsed = d.s.map(([, t]) => { const marks = (String(t).match(/\[\[\d+\]\]/g) || []).length; const P = C.psuVerseParse(t); if (marks >= 2) { sections++; if (!P) unread++; } return P; });
  const total = parsed.reduce((a, p) => a + (p ? p.total : 0), 0); if (!total) continue; books++; const rng = mulberry(id.length * 7919 + id.charCodeAt(id.length - 1));
  for (let i = 0; i < 30; i++) {
    let r = Math.floor(rng() * total); let si = 0; for (; si < parsed.length; si++) { const w = parsed[si] ? parsed[si].total : 0; if (r < w) break; r -= w; }
    const P = parsed[si]; if (!P) continue; const L = C.psuVerseAt(P, r); const u = C.psuVerseUnit(P, L, C.PSU_SIZES.passage); places++;
    if (!u) { nulls++; continue; }
    const text = C.psuVerseText(P, u.a, u.b); const nums = (text.match(/\[\[(\d+)\]\]/g) || []).map((x) => +x.slice(2, -2)); const vis = C.psuVis(text);
    if (u.a > L || u.b < L) problems.push([id, si, 'does not hold the place', L, u]);
    else if (nums[0] !== P.v[u.a].n || nums[nums.length - 1] !== P.v[u.b].n || nums.some((x, k) => k && x <= nums[k - 1]) || nums.length !== u.b - u.a + 1) problems.push([id, si, 'verse numbers', nums.slice(0, 5)]);
    else if (u.len < 140 || u.len > 1100 || Math.abs(vis.length - u.len) > 12) problems.push([id, si, 'length', u.len, vis.length]);
    else if (u.a > 0 && !C.psuCut(P, u.a - 1)) problems.push([id, si, 'starts mid-sentence', vis.slice(0, 50)]);
    else if (u.b < P.n - 1 && !C.psuCut(P, u.b)) problems.push([id, si, 'ends mid-sentence', vis.slice(-50)]);
    else if (/<\/?[a-z]/.test(text) || /^#{1,3} |\n#{1,3} /.test(text)) problems.push([id, si, 'markup', text.slice(0, 50)]);
    lens.push(u.len); if (P.v[u.a].pb) paragraphEdge++;
  }
}
ok(`every verse unit from ${books} books holds its place, has the verse numbers of its markers, a sensible length and edges at sentences (${places} drawn)`, !problems.length, problems.slice(0, 4));
ok('almost every place gives a unit', nulls / places < 0.03, [nulls, places]);
ok('most units begin at the translators’ own paragraph edge', paragraphEdge / lens.length > 0.7, paragraphEdge / lens.length);
ok('a verse-marked chapter whose numbers do not rise is rare (and then the picker reads it as prose)', unread / sections < 0.03, [unread, sections]);

/* ── the quality gate: a pick is read once more before it is shown ── */
{
  const GOOD = 'The people had waited a long time for the rain, and when at last the first clouds came up over the hills the old man went out and stood in the road. He said nothing to anyone. His daughter, who had followed him, took his hand, and together they watched the dark edge of the storm move slowly across the valley toward the village where the others were already beginning to gather.';
  const gate = (t, o) => C.psuGate(t, o || {});
  ok('plain prose passes the gate', gate(GOOD).ok && gate(GOOD, { scan: true }).ok, gate(GOOD));
  const LONGS = 'And the fame fhould be told how the confefled finnes of the people were bleffed, for he himfelf did fay that fome of them fhould come, and fo they went to fee the houfe of the Lord and fuch as were there were glad of it.';
  ok('the long s read as an f (fhould, bleffed, himfelf) is damage: ocr', gate(LONGS).why.includes('ocr') && !gate(LONGS).ok, gate(LONGS));
  ok('a word is known if the Library’s own texts use it, with a common ending, and a long s is told from a spelling', C.psuKnown('blessed') && C.psuKnown('walking') && C.psuKnown('hills') && !C.psuKnown('fhould') && C.psuLongS('fhould') && C.psuLongS('himfelf') && !C.psuLongS('qzxv'));
  ok('names, capitals and short words are not judged as damage (a book of names is not a damaged scan)', gate('Then Gilgamesh and Enkidu came to the cedar forest of Humbaba, and the gods of Uruk watched from the high walls above the river while the people of Kish sang of the two heroes. They told how the heroes had slain the guardian of the forest.').ok);
  ok('a running head in the middle of a sentence is a fault: head', gate('The first requisite is to find the peat; or failing this, ACROSS ARCTIC AMERICA lichen or moss. The mass should in any case be entirely free from sand or grit, and it has then to be thawed and crumbled in the hands.').why.includes('head'));
  ok('and so is a page number and a title before the first word', gate('INTRODUCTION. 215 — a 2 ee were the people branded as of the dark quality by the Anugita in the passage in question, and we have therefore at least two bodies of thinkers.').why.includes('head') && gate('I QUESTION, 15. 273 (future) world, and return again. Therefore the seers who desire offspring go to the south, and that path of the Fathers is matter.').why.includes('head'));
  ok('“the LORD GOD said” is not a running head', !gate('And it came to pass that the LORD GOD said unto the man, thou shalt not eat of it, for in the day that thou eatest thereof thou shalt surely die, and the man heard the voice of the LORD GOD in the garden.').why.includes('head'));
  ok('stray marks, a capital inside a word and a lower-case start after a full stop are marks', gate('He went down to the river and said CuHapter that is as it was before and the men were there in the afternoon and they spoke of the days.').why.includes('marks') && gate('The Guru went on his way from the village that evening and came to the river. at the ford the people were waiting for him with gifts of fruit and of cloth.').why.includes('marks') && gate('Then he said {38a} to them all that the king had come and that the people should make ready for the day of his return from the war.').why.includes('marks'));
  ok('a pick that begins in the middle of a sentence is a fault: starts-lower', gate('and then the men went on across the plain until they came to the foot of the hill where the old road turned to the east and was lost in the grass.').why.includes('starts-lower'));
  ok('a footnote letter stuck to the first word is a fault: foot', gate('aImsu’s great-grandfather was therefore a contemporary of King Intef, and the king’s name is not inclosed in a cartouche here, so the matter stays in doubt for the reader.').why.includes('foot'));
  ok('names or things in a row, with none of the small words of sentences, is a list', gate('Ants, beetles, crickets, fleas, lice, moths, butterflies, dragonflies, grasshoppers, cicadas, wasps, bees, flies, mosquitoes, gnats, weevils, ladybirds, earwigs, termites, aphids, midges, hornets, locusts, mantises, spiders, scorpions, centipedes.').why.includes('list'));
  ok('mostly capitalised names, or names with figures, is a list: names', gate('He gave the cities to Reuben and Gad and Manasseh and Ephraim, and Judah and Simeon and Benjamin took Hebron and Debir and Libnah and Lachish and Eglon and Gezer, with Hormah and Arad and Adullam and Makkedah and Bethel.').why.includes('names'));
  ok('the number a saying begins with is its numbering, not a figure: numbered sayings pass', gate('335. Whosoever is overcome by this fierce thirst, his sorrows increase like grass after rain, and he who overcomes it, his sorrows fall away from him like water from a lotus leaf.\n\n336. This I say to you: good luck to you all who are assembled here, dig up the root of thirst as one digs up the usira root.').ok);
  const NOTE = 'The Greek reads here “the former”, as we have seen above (see note 4, p. 117), but the Syriac MS. omits it; cf. Eth. En. lx. 20 and Gen. xv. 2, and Dr. Charles, who thinks that the translator probably followed the second recension, would read it so, vol. ii. p. 31.';
  ok('an editor’s voice and a scholar’s citations are a note', gate(NOTE).why.includes('note'), gate(NOTE));
  ok('a verse passage is judged only as a list of names: a psalm passes, the princes of the tribes do not', gate('[[1]] Answer me when I call, God of my righteousness. Give me relief from my distress. Have mercy on me, and hear my prayer.', { verse: true }).ok && !gate('[[16]] These are the names of the men who shall divide the land: Eleazar the priest, and Joshua the son of Nun, Caleb the son of Jephunneh, Shemuel the son of Ammihud, Elidad the son of Chislon, Bukki the son of Jogli, Hanniel the son of Ephod, Kemuel the son of Shiphtan, Elizaphan the son of Parnach, Paltiel the son of Azzan, Pedahel the son of Ammihud.', { verse: true }).ok);
  ok('every reason is one of the listed words', ['ocr', 'marks', 'head', 'foot', 'starts-lower', 'thin', 'list', 'names', 'places', 'note'].length === 10 && [LONGS, NOTE].every((t) => gate(t).why.every((w) => ['ocr', 'marks', 'head', 'foot', 'starts-lower', 'thin', 'list', 'names', 'places', 'note'].includes(w))));
}
/* ── what is shown is the text without its italics marks ── */
ok('italics marks (_who_) are taken off, whole phrases too, and the verse markers stay', C.psuStrip('“_Who_ put him to death?” and _the Heptameron of Marguerite_ says so [[3]] and snake_case') === '“Who put him to death?” and the Heptameron of Marguerite says so [[3]] and snakecase' && C.psuStrip(null) === '' && C.psuStrip('no marks here') === 'no marks here');
ok('a heading loses its marks and its note numbers', C.psuHeading('XXI. The Story Of _K_U_Dd_Abodhi.[151]') === 'XXI. The Story Of KUDdAbodhi.');
/* ── the line under the reference: the shelf and the date from the catalogue, the same for every text ── */
ok('the line says "From the <shelf> shelf, <date>." and nothing else', C.psuFrom({ shelf: 'Hebrew Bible · Old Testament (39 books)', when: 'c. 10th–2nd c. BCE (collected)' }) === 'From the Hebrew Bible shelf, c. 10th–2nd c. BCE (collected).' && C.psuFrom({ shelf: 'Modern & revival traditions', when: '1920s CE' }) === 'From the Modern & revival traditions shelf, 1920s CE.' && C.psuFrom({ shelf: 'Egypt', when: '1923–1925' }) === 'From the Egypt shelf, 1923 to 1925.' && C.psuFrom({ shelf: 'Egypt', when: '' }) === 'From the Egypt shelf.' && C.psuFrom({ shelf: '', when: '1900' }) === '' && C.psuFrom(null) === '');
ok('the line holds no verdict: it is the same template for a scripture and for a polemic', /^From the [^,]+ shelf(?:, [^,]*)?\.$/.test(C.psuFrom({ shelf: 'Modern & revival traditions', when: '1920s CE' })) && C.psuFrom({ shelf: 'Hebrew Bible', when: 'c. 6th c. BCE' }).replace(/Hebrew Bible/, 'X').replace(/c\. 6th c\. BCE/, 'Y') === C.psuFrom({ shelf: 'Modern & revival traditions', when: '1920s CE' }).replace(/Modern & revival traditions/, 'X').replace(/1920s CE/, 'Y'));
ok('the catalogue note that says an introduction, notes or a commentary are inside is read', C.psuNotesSay('Schechter’s introduction, English translation and notes; Hebrew words may be garbled.') && C.psuNotesSay('with Fabre d’Olivet’s 1813 French commentary') && C.psuNotesSay('with Jacobi’s footnotes') && !C.psuNotesSay('The classic account of a journey among the Bedouin of Arabia.') && !C.psuNotesSay(null));
/* ── the two data files the gate and the default pool are made from (tools/passage_words.js, tools/passage_pool.js) ── */
{
  const W = require('../src/js/2z-passage-words.js').PSU_WORDS; const L = require('../src/js/2z-passage-pool.js'); const D = require('../src/js/24-data-path-lib.js');
  ok('the word list is a set of lower-case words from the Library’s own typed texts', W instanceof Set && W.size > 9000 && W.size < 30000 && ['the', 'and', 'sacrifice', 'mercy', 'covenant', 'heavens'].every((w) => W.has(w)) && [...W].every((w) => /^[a-z]{3,}$/.test(w)), W.size);
  ok('the lists of editions left out hold only books of the Library, each once', L.PSU_ANNOTATED instanceof Set && L.PSU_ABOUT instanceof Set && [...L.PSU_ANNOTATED, ...L.PSU_ABOUT, ...Object.keys(L.PSU_READ_OUT)].every((id) => D.LIB_BY_ID[id]) && ![...L.PSU_ANNOTATED].some((id) => L.PSU_ABOUT.has(id) || L.PSU_READ_OUT[id]));
  ok('each book read through and left out has its plain reason', Object.keys(L.PSU_READ_OUT).length >= 3 && Object.values(L.PSU_READ_OUT).every((r) => typeof r === 'string' && r.length > 20 && !/\bbad\b|\bworst\b|\bjunk\b|\bgarbage\b/i.test(r)));
}

/* ── a page of a book as it is printed: from one mark to the next, everything on it ── */
{
  const secs = [['Chapter 1', 'First paragraph of page one. It goes on here.\n\nSecond paragraph starts [[3]]a verse and then the page turns here and the next page begins with this part.\n\nThird paragraph is wholly on page two.\n\nFourth begins page three here.'], ['Chapter 2', 'Another section starts here.']];
  const flat = [[0, 0, 0, 'xii'], [0, 1, 52, '1'], [0, 3, 0, '2'], [1, 0, 0, '3']]; const L = C.psuLeaves(flat);
  ok('roman numerals are told from arabic ones, with a volume or an inferred mark in front', ['i', 'xii', 'MMM'.toLowerCase(), '2:xiv', '~iv'].every((x) => C.psuRoman(x)) && ['12', '1:12', '', '~215', 'a12', 'xiiiiiiiiiiiii', null].every((x) => !C.psuRoman(x)));
  ok('a page runs from its mark to the next one in its section, and the last of a section runs to the end of it', L.length === 4 && L[0].roman && !L[1].roman && L[0].e && L[0].e.s === 0 && L[0].e.p === 1 && L[0].e.o === 52 && L[1].e.p === 3 && L[2].e === null && L[3].e === null && C.psuLeaves(null).length === 0 && C.psuLeaves([[1, 2]]).length === 0);
  ok('a paragraph is cut by its visible characters, and a verse marker goes with the page it falls on', C.psuSliceVisible('a [[1]]bc [[2]]def', 2, 5) === '[[1]]bc ' && C.psuSliceVisible('abc', 0, Infinity) === 'abc' && C.psuSliceVisible('abc [[7]]', 0, 4) === 'abc ' && C.psuSliceVisible('', 0, 3) === '' && C.psuSliceVisible(null, 0, 3) === '');
  const one = C.psuLeafText(secs, L, 0, 1); const two = C.psuLeafText(secs, L, 1, 2);
  ok('the text of a page is the paragraphs on it, whole, with the part of the first and of the last that is on it', one.p === 0 && one.pe === 1 && /^First paragraph of page one\./.test(one.text) && /Second paragraph starts \[\[3\]\]a verse and then the page tu$/.test(one.text) && !/Third/.test(one.text), one);
  ok('a page that begins where a paragraph begins leaves out the one before, and two pages are one after the other', C.psuLeafText(secs, L, 1, 1).text.startsWith('rns here') && !C.psuLeafText(secs, L, 1, 1).text.includes('Fourth') && two.p === 1 && two.pe === 3 && /Fourth begins page three here\.$/.test(two.text) && two.text.includes('Third paragraph is wholly on page two.'), two);
  ok('two pages that are not one after the other in one section are not a page', C.psuLeafText(secs, L, 2, 2) === null && C.psuLeafText(secs, L, 3, 2) === null && C.psuLeafText(secs, L, 9, 1) === null && C.psuLeafText([], L, 0, 1) === null);
  ok('a page is cited by its printed number: p. 214, pp. 214–215, Vol. 2, p. 33, with the volume’s own name and with an inferred ~ not shown', C.psuLeafCite('214', '') === 'p. 214' && C.psuLeafCite('214', '215') === 'pp. 214–215' && C.psuLeafCite('2:33', '2:34', ['Part One', 'Part Two']) === 'Part Two, pp. 33–34' && C.psuLeafCite('2:33', '') === 'Vol. 2, p. 33' && C.psuLeafCite('~215', '') === 'p. 215' && C.psuLeafCite('xii', '') === 'p. xii' && C.psuLeafCite('junk', '') === '' && C.psuLeafCite(null, null) === '');
  const paras = Array.from({ length: 12 }, (_, i) => `Paragraph ${i} of the section says that the people had waited a long time for the rain, and when at last the first clouds came up over the hills the old man went out and stood in the road. He said nothing to anyone. His daughter, who had followed him, took his hand, and together they watched the dark edge of the storm move slowly across the valley toward the village where the others were already beginning to gather.`);
  const w = C.psuParaWindow(paras, 5, C.PSU_LEAF.one); const e = C.psuParaWindow(paras, 11, C.PSU_LEAF.one);
  ok('a window of about a page is whole paragraphs, grown forward and then back at the end of a section, and a window that is too short or too long is none', w && w.p === 5 && w.pe >= 6 && C.psuVis(w.text).length >= 2200 && e && e.pe === 11 && e.p < 11 && C.psuParaWindow(['short'], 0, C.PSU_LEAF.one) === null && C.psuParaWindow(['x'.repeat(9000)], 0, C.PSU_LEAF.one) === null, [w && [w.p, w.pe], e && [e.p, e.pe]]);
  ok('a page may begin in the middle of a sentence (the print does), a passage may not', C.psuGate('the men went on across the plain until they came to the foot of the hill where the old road turned to the east and was lost in the grass. The people of the village were waiting there with bread and water for all of them.', { page: true }).ok && !C.psuGate('the men went on across the plain until they came to the foot of the hill where the old road turned to the east and was lost in the grass. The people of the village were waiting there with bread and water for all of them.', {}).ok);
  ok('a page still fails the clean test for damage, a running head and an editor’s voice', C.psuGate('And the fame fhould be told how the confefled finnes of the people were bleffed, for he himfelf did fay that fome of them fhould come, and fo they went to fee the houfe of the Lord.', { page: true }).why.includes('ocr') && C.psuGate('The first requisite is to find the peat; or failing this, ACROSS ARCTIC AMERICA lichen or moss. The mass should in any case be entirely free from sand or grit, and thawed.', { page: true }).why.includes('head'));
}
/* ── a machine-read scan: a stray symbol and a misread word (the maker's Hermetic Museum card: "z¢s earth … out of ove thing") ── */
{
  const HM = 'The seed must be cast into z¢s earth, and it must be kept warm, and fed with its own water, until the time comes when the work is finished. For the wise say that the whole of the art is hid in out of ove thing, and that nothing else is wanted by him who knows it.';
  const CLEAN = 'The seed must be cast into the earth, and it must be kept warm, and fed with its own water, until the time comes when the work is finished. For the wise say that the whole of the art is hid in the one thing, and that nothing else is wanted by him who knows it.';
  ok('a stray symbol in a word is a reason to pass a passage over (¢ £ § | ~ ^ and the like), typed or scanned', C.psuGate(HM, {}).why.includes('symbol') && C.psuGate(HM, { scan: true }).why.includes('symbol') && ['wor£d of the ancient peoples', 'the gl§ry of the lord', 'the soul|of the man', 'the ¢hurch of the east'].every((t) => C.psuGate(t + ' went on across the plain until they came to the foot of the hill where the old road turned to the east and was lost in the long grass of the valley', {}).why.some((w) => w === 'symbol' || w === 'marks')));
  ok('the same passage with the word read right passes, and a pound sign before a figure, a section sign before a number and a translator’s square brackets are not strays', C.psuGate(CLEAN, { scan: true }).ok && !C.PSU_STRAY.test('it cost £5 and the fine was £12 10s. See § 12 and § 3 of the law') && !C.PSU_STRAY.test('the [a] spirit and the [being] essence of the work') && C.psuGate('And the work is of the [a] spirit, and the [being] essence of the whole is the thing which the wise have called the stone. For it is made of the one thing, and nothing else is wanted by him who knows it, and he who has it is rich.', { scan: true }).ok && C.psuGate('And the work is of the [a] spirit, and the [being] essence of the whole is the thing which the wise have called the stone. For it is made of the one thing, and nothing else is wanted by him who knows it, and he who has it is rich.', {}).ok);
  ok('a word that is no word, and is one machine confusion from a very common word, is an OCR error ("ove" is "one", "tbe" and "thc" and "tlie" are "the", "aud" is "and")', [['ove', 'one'], ['tbe', 'the'], ['thc', 'the'], ['tlie', 'the'], ['aud', 'and'], ['yoii', 'you'], ['hirn', 'him'], ['wbich', 'which'], ['witli', 'with'], ['bave', 'have'], ['oue', 'one'], ['whcn', 'when']].every(([w, as]) => C.psuNear(w) === as && C.psuOcrNear('and so it was that the ' + w + ' came to the house').map((x) => x.w + '>' + x.as).join() === w + '>' + as));
  ok('a rare real word is not an error (it has no reading among the common words), and neither is a capitalised name, a real word of another language, a word of the list or a word with two readings', ['ziggurat', 'stela', 'sutta', 'vihara', 'kayak', 'ishtar'].every((w) => C.psuNear(w) === '') && C.psuOcrNear('Ove came with Tbe and the one stela, and mau and ber and vor were said').length === 0 && C.psuNear('one') === '' && C.psuNear('bis') === 'his');
  ok('a scanned passage with one misread word is passed over ("ocr-word"), a typed one is not asked (a typed book has its rare words), and the best pick of a book asked for by name still shows it', C.psuGate(HM.replace('z¢s', 'the'), { scan: true }).why.join() === 'ocr-word' && C.psuGate(HM.replace('z¢s', 'the'), {}).ok && C.psuGate(HM.replace('z¢s', 'the'), { scan: true, page: true }).why.includes('ocr-word') && C.psuGate(CLEAN, { scan: true }).ok);
  /* the rule is quiet on a whole typed book: a handful of misreadings in 3.8 million words of typed text is the "mau" and "ber" of other languages, which are left alone */
  if (fs.existsSync(path.join(dir0, 'index.js'))) {
    const vm2 = require('vm'); let META2 = {}; vm2.runInNewContext(fs.readFileSync(path.join(dir0, 'index.js'), 'utf8'), { BEATLAB_TEXTS: { addIndex(o) { META2 = o; }, meta: {}, data: {} } });
    const typed = Object.keys(META2).filter((i) => !/^[bndo]-/.test(i) && !/scan|OCR/i.test((META2[i].note || '') + (META2[i].license || ''))).filter((_, k) => k % 6 === 0).slice(0, 40); let w = 0; let f = 0; let sym = 0;
    for (const id of typed) { let secs = null; vm2.runInNewContext(fs.readFileSync(path.join(dir0, id + '.js'), 'utf8'), { BEATLAB_TEXTS: { add(i, m, s2) { secs = s2; }, addIndex() {} } }); const txt = (secs || []).map((x) => x[1]).join(' ').slice(0, 300000); w += (txt.match(/[A-Za-z]+/g) || []).length; f += C.psuOcrNear(txt).length; sym += (txt.match(new RegExp(C.PSU_STRAY.source, 'gu')) || []).length; }
    ok(`typed books are not troubled by the rules: ${f} misread words and ${sym} stray symbols in ${w} words of ${typed.length} typed books (under 0.05 per 1,000 words)`, f / w * 1000 < 0.05 && sym / w * 1000 < 0.05, [f, sym, w]);
  }
}
console.log(`${books} verse-marked books, ${places} places, ${lens.length} units; ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
