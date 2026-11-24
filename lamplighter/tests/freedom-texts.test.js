// Run: node tests/freedom-texts.test.js — the ten freedom-of-conscience texts (tools/texts_freedom.py): each is whole, in order, free of the sources' scaffolding, and says what it should.
// Skipped when the texts folder has not been built.
const fs = require('fs'); const path = require('path'); const vm = require('vm');
const dir = process.env.BEATLAB_TEXTS_DIR || path.join(__dirname, '../../texts');                    // (the variable lets the texts be checked before they are put in the folder)
if (!fs.existsSync(path.join(dir, 'f-udh.js'))) { console.log('freedom texts not built; skipping (run tools/build_texts.py --only=f-cyr,f-ash,f-blt,f-spi,f-lok,f-mem,f-vst,f-bor,f-mil,f-udh)'); process.exit(0); }
let pass = 0, fail = 0; const ok = (n, c, x = '') => { if (c) pass++; else { fail++; console.log('FAIL', n, x); } };
const T = { data: {}, meta: {}, add(id, m, s) { this.data[id] = { m, s }; }, addIndex(i) { Object.assign(this.meta, i); } };
const load = (id) => { vm.runInNewContext(fs.readFileSync(path.join(dir, id + '.js'), 'utf8'), { BEATLAB_TEXTS: T }, { filename: id + '.js' }); return T.data[id]; };
const all = (d) => d.s.map((s) => s[1]).join('\n\n'); const heads = (d) => d.s.map((s) => s[0]);
const lib = fs.readFileSync(path.join(__dirname, '../src/js/24-data-path-lib.js'), 'utf8');
const ROMAN = { I: 1, V: 5, X: 10, L: 50, C: 100 }; const toInt = (s) => [...s].reduce((n, c, i, a) => n + (ROMAN[a[i + 1]] > ROMAN[c] ? -ROMAN[c] : ROMAN[c]), 0);
const IDS = ['f-cyr', 'f-ash', 'f-blt', 'f-spi', 'f-lok', 'f-mem', 'f-vst', 'f-bor', 'f-mil', 'f-udh'];

/* every one of them: in the library, named, sourced, no scaffolding left from the sources */
for (const id of IDS) {
  const d = load(id); const text = all(d);
  ok(id + ' is a library entry on the Freedom of conscience shelf', new RegExp("'" + id + '\\|[^|]+\\|fr\\|').test(lib));
  ok(id + ' has a title, a source address, a licence line and a note saying what was left out', d.m.title && /^https:/.test(d.m.src) && d.m.license && d.m.note.length > 40, d.m);
  ok(id + ' has no web page or e-text scaffolding', !/<\/?(?:p|div|li|ol|span|a)\b|&nbsp;|&amp;|Project Gutenberg|Produced by|\[Sidenote|\[Illustration|\[Footnote|_[A-Za-z]+_/.test(text), (text.match(/<\/?(?:p|div|li|ol|span|a)\b|&nbsp;|&amp;|Project Gutenberg|Produced by|\[Sidenote|\[Illustration|\[Footnote|_[A-Za-z]+_/) || [''])[0]);
  ok(id + ' has no stray closing mark at the start of a line and no run of spaces', !/^\s*[\])}]/m.test(text) && !/\S {2,}\S/.test(text));
  ok(id + ' sections all have headings and substance', d.s.every((s) => s[0].length > 2 && s[1].trim().length > 60), d.s.filter((s) => s[1].trim().length <= 60).map((s) => s[0]));
}

/* the Universal Declaration: preamble and thirty articles, the clauses numbered as in the official text */
{
  const d = load('f-udh'); const h = heads(d);
  ok('UDHR: a preamble then Articles 1 to 30 in order', h.length === 31 && /^Preamble/.test(h[0]) && h.slice(1).every((x, i) => x.startsWith('Article ' + (i + 1))), h.slice(0, 4));
  ok('UDHR: Article 18 is the freedom of thought, conscience and religion', /^Article 18/.test(h[18]) && d.s[18][1].startsWith('Everyone has the right to freedom of thought, conscience and religion; this right includes freedom to change his religion or belief'), d.s[18][1].slice(0, 120));
  ok('UDHR: Article 16 keeps its three numbered clauses', /^\(1\) .*\n\n\(2\) .*\n\n\(3\) /s.test(d.s[16][1]), d.s[16][1].slice(0, 160));
  ok('UDHR: Article 19 is the freedom of opinion and expression', /freedom of opinion and expression/.test(d.s[19][1]));
}
/* the Bill of Rights: the 1789 resolution, ten amendments in order, the two other articles; the First Amendment word for word */
{
  const d = load('f-bor'); const h = heads(d);
  ok('Bill of Rights: the resolution, Amendments I to X, then the two articles never added', h.length === 12 && /^The 1789 joint resolution/.test(h[0]) && /^Amendment I /.test(h[1]) && h.slice(2, 11).every((x, i) => x === 'Amendment ' + ['II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'][i]) && /^The two other articles/.test(h[11]), h);
  ok('The First Amendment, word for word', d.s[1][1] === 'Congress shall make no law respecting an establishment of religion, or prohibiting the free exercise thereof; or abridging the freedom of speech, or of the press; or the right of the people peaceably to assemble, and to petition the Government for a redress of grievances.', d.s[1][1]);
  ok('Bill of Rights: the resolution proposes the amendments to the States, and Article the third is in it', /Article the first/.test(d.s[11][1]) && /Article the second/.test(d.s[11][1]) && /RESOLVED by the Senate and House of Representatives/.test(d.s[0][1]));
}
/* Madison's Memorial: the address, the title, the opening and fifteen numbered reasons in order; the editors' pointers gone; the famous sentences there */
{
  const d = load('f-mem'); const t = all(d); const ps = t.split('\n\n'); const nums = ps.filter((p) => /^\d{1,2}\. Because /.test(p)).map((p) => +p.match(/^(\d+)\./)[1]);
  ok('Madison: one section of eighteen paragraphs (the address, the title, the opening and fifteen numbered reasons in order)', d.s.length === 1 && ps.length === 18 && ps[0] === 'To the Honorable the General Assembly of the Commonwealth of Virginia' && ps[1] === 'A Memorial and Remonstrance' && /^We the subscribers, citizens of the said Commonwealth/.test(ps[2]) && /We remonstrate against the said Bill,$/.test(ps[2]) && nums.join() === Array.from({ length: 15 }, (_, i) => i + 1).join(), [ps.length, nums]);
  ok('Madison: the first reason says religion can be directed only by reason and conviction, and the fifteenth ends with the prayer', /^1\. Because we hold it for a fundamental and undeniable truth, "that Religion or the duty which we owe to our Creator and the manner of discharging it, can be directed only by reason and conviction, not by force or violence\."/.test(ps[3]) && /^15\. Because finally, "the equal right of every citizen to the free exercise of his Religion according to the dictates of conscience"/.test(ps[17]) && /the liberties, the prosperity and the happiness of the Commonwealth\.$/.test(ps[17]));
  ok('Madison: the famous sentences are there (three pence, the Inquisition, the first step, the Asylum, the wall of defence)', /contribute three pence only of his property for the support of any one establishment, may force him to conform to any other establishment in all cases whatsoever/.test(t) && /it differs from it only in degree/.test(t) && /The one is the first step, the other the last in the career of intolerance/.test(t) && /offering an Asylum to the persecuted and oppressed of every Nation and Religion/.test(t) && /circumscribe it with a wall of defence/.test(t));
  ok('Madison: the editors’ bracketed pointers to the Virginia Declaration of Rights are gone, and so is every other bracket, tag or entity', !/[\[\]<>]|&[a-z#0-9]+;|Declaration of Rights, art/.test(t) && /Whilst we assert for ourselves a freedom to embrace/.test(t) && /violence\." The Religion then/.test(t));
  ok('Madison: the spelling is the source’s own (“Governour”, “compleat”, “controul”, “Menonists”) and the one ampersand is Madison’s', /Governour of the Universe/.test(t) && /compleat/.test(t) && /controul/.test(t) && /Menonists/.test(t) && /secure & perpetuate it/.test(t) && (t.match(/&/g) || []).length === 1);
}
/* Locke's Letter: one letter in five parts (the long text is cut at paragraph ends), the famous claims and the limits he sets, none of the wiki page left */
{
  const d = load('f-lok'); const t = all(d); const h = heads(d);
  ok('Locke: five parts of one letter, from “Since you are pleased to inquire” to “a person of your parts.”, in eighty-nine paragraphs', d.s.length === 5 && h.every((x, i) => x.startsWith('A Letter Concerning Toleration (William Popple’s translation of 1689) · part ' + (i + 1) + ' of 5')) && d.s[0][1].startsWith('Since you are pleased to inquire what are my thoughts about the mutual toleration of Christians') && d.s[4][1].endsWith('to a person of your parts.') && t.split('\n\n').length === 89, [h, t.split('\n\n').length]);
  ok('Locke: the famous claims are there (the chief characteristic mark, the care of souls, civil interests)', /toleration to be the chief characteristic mark of the true Church/.test(t) && /the care of souls is not committed to the civil magistrate, any more than to other men/.test(t) && /Civil interests I call life, liberty, health, and indolency of body/.test(t));
  ok('Locke: the limits he sets are there too (atheists; a church that gives its members up to another prince, with the Mufti of Constantinople as his example)', /those are not at all to be tolerated who deny the being of a God/.test(t) && /ipso facto deliver themselves up to the protection and service of another prince/.test(t) && /Mufti of Constantinople/.test(t));
  ok('Locke: the nine footnote marks and every trace of the wiki page are gone', !/\[\d+\]/.test(t) && !/[{}<>]|\[\[|''/.test(t) && !/header|PD-old|DEFAULTSORT/.test(t.slice(0, 600) + t.slice(-600)));
}
/* The Cyrus Cylinder: Rogers's older translation (not the later one that now stands on the same Wikisource page), the gaps kept, one footnote as the last line */
{
  const d = load('f-cyr'); const t = all(d); const ps = t.split('\n\n');
  ok('Cyrus: one section, from the first fragment “(...) his troops” to the last gap, with the footnote as the last line', d.s.length === 1 && ps[0] === '(...) his troops' && /I permitted all to dwell in peace \[ \. \. \. \]$/.test(ps[ps.length - 2]) && ps[ps.length - 1] === '[1] Another name for Marduk.' && ps.length === 37, [d.s.length, ps.length]);
  ok('Cyrus: his titles, the gods brought back, and the old translation’s own words (“a weakling”, “the black-headed people”)', /I am Cyrus, king of the world, the great king, the powerful king, king of Babylon/.test(t) && /the gods, who resided in them, I brought back to their places/.test(t) && /a weakling was established as ruler over his land/.test(t) && /black-headed people/.test(t));
  ok('Cyrus: it is the older translation, not the later one now on the page (no “Shuanna”, “Tintir”, “king of the universe”)', !/Shuanna|Tintir|king of the universe/.test(t));
  ok('Cyrus: the wiki marks are gone; the gaps and the footnote mark stay', !/[{}<>]|\[\[|''|==/.test(t) && (t.match(/\[ \. \. \. ?\.? ?\]/g) || []).length >= 8 && /Bêl\[1\]/.test(t));
}
/* Smith's Edicts of Asoka (OCR of a scan): every edict in its place, the famous ones whole and readable, the scan's furniture gone */
{
  const d = load('f-ash'); const h = heads(d); const t = all(d); const sec = (re) => (d.s.find((s) => re.test(s[0])) || ['', ''])[1];
  const rock = h.filter((x) => /^Rock Edict [IVX]+ · /.test(x)).map((x) => toInt(x.match(/^Rock Edict ([IVX]+) /)[1])); const pillar = h.filter((x) => /^Pillar Edict [IVX]+ · /.test(x)).map((x) => toInt(x.match(/^Pillar Edict ([IVX]+) /)[1]));
  ok('Asoka: the preface and introduction, then the Minor Rock and Bhabra edicts, Rock Edicts I to XIV, the Kalinga edicts, Pillar Edicts I to VII, the Minor Pillar edicts, the inscriptions, and the commentary last', h[0] === 'Preface by Vincent A. Smith' && h[1] === 'Introduction by Vincent A. Smith' && h.filter((x) => /^Minor Rock Edict/.test(x)).length === 3 && h.filter((x) => /^The Bhabra Edict/.test(x)).length === 1 && rock.join() === Array.from({ length: 14 }, (_, i) => i + 1).join() && pillar.join() === '1,2,3,4,5,6,7' && h.filter((x) => /^Kalinga Edict/.test(x)).length === 2 && h.filter((x) => /^Minor Pillar Edict/.test(x)).length === 4 && h.filter((x) => /^(?:Tarai|The Barabar|The Nagarjuni)/.test(x)).length === 4 && /^Commentary by Vincent A. Smith/.test(h[h.length - 1]), h);
  ok('Asoka: Rock Edict XII (Toleration) says that men of all sects deserve reverence, and that honouring one’s own sect by running down others hurts one’s own', /Toleration$/.test(h.find((x) => /^Rock Edict XII /.test(x))) && /does reverence to men of all sects/.test(sec(/^Rock Edict XII /)) && /the sects of other people all deserve reverence for one reason or another/.test(sec(/^Rock Edict XII /)) && /inflicts the severest injury on his own sect/.test(sec(/^Rock Edict XII /)));
  ok('Asoka: Rock Edict XIII has the conquest of the Kalingas, the numbers, the remorse and “true conquest” by the Law of Piety', /conquered by His Sacred and Gracious Majesty the King when he had been consecrated eight years/.test(sec(/^Rock Edict XIII /)) && /One hundred and fifty thousand persons were thence carried away captive/.test(sec(/^Rock Edict XIII /)) && /remorse for having conquered the Kalingas/.test(sec(/^Rock Edict XIII /)) && /conquest by the Law of Piety/.test(sec(/^Rock Edict XIII /)));
  ok('Asoka: Pillar Edict VII keeps its ten numbered sections as paragraphs, and Minor Rock Edict I reads whole', sec(/^Pillar Edict VII /).split('\n\n').length === 10 && /^II\. Then thus said/m.test(sec(/^Pillar Edict VII /)) && /^X\. Concerning this/m.test(sec(/^Pillar Edict VII /)) && /exerting myself strenuously/.test(sec(/^Minor Rock Edict I · The fruit/)) && /Let small and great exert themselves/.test(sec(/^Minor Rock Edict I · The fruit/)), sec(/^Pillar Edict VII /).split('\n\n').length);
  ok('Asoka: the scan’s tildes, strokes, running heads and the printer’s colophon are gone', !/~/.test(t) && !/\s\|\s|^\s*\|/m.test(t) && !/THE EDICTS OF ASOKA|Printed at the Essex House Press|Digitized with financial assistance|UU UUAI/.test(t));
  ok('Asoka: the plain misreadings are mended (“hearkening”, “his”, “half”, “has”, “Brahmans”, “consecrated”)', !/bearkening|\bbis\b|\bbalf\b|\bbas\b|Brabmans|conseerated|fa11|Tbus/.test(t) && /hearkening to father and mother/.test(t) && /two years and a half/.test(t));
}
/* the Virginia Statute: three paragraphs, the preamble's famous claims and the enacting clause */
{
  const d = load('f-vst'); const t = d.s[0][1]; const ps = t.split('\n\n');
  ok('Virginia Statute: one section of three paragraphs', d.s.length === 1 && ps.length === 3, ps.length);
  ok('Virginia Statute: the preamble says God created the mind free and that truth will prevail if left to herself', /Almighty God hath created the mind free/.test(ps[0]) && /truth is great and will prevail, if left to herself/.test(ps[0]));
  ok('Virginia Statute: the enacting clause says no man shall be compelled', /^Be it enacted by the General Assembly, That no man shall be compelled to frequent or support any religious worship, place or ministry whatsoever/.test(ps[1]));
  ok('Virginia Statute: the last paragraph declares these rights natural', /infringement of natural right\.$/.test(ps[2]));
}
/* On Liberty: dedication, five chapters in order, nine footnotes numbered 1 to 9 whose marks all point somewhere */
{
  const d = load('f-mil'); const h = heads(d); const t = all(d);
  const chap = h.filter((x) => /^Chapter [IVX]+ /.test(x)).map((x) => x.match(/^Chapter ([IVX]+) /)[1]); const order = [...new Set(chap)].map(toInt);
  ok('On Liberty: a dedication, then Chapters I to V in order', h[0] === 'Dedication' && order.join() === '1,2,3,4,5' && chap.map(toInt).every((n, i, a) => !i || n >= a[i - 1]), h);
  ok('On Liberty: the dedication has no stray marks and the long chapter is cut at paragraph ends', !/_/.test(d.s[0][1]) && d.s.filter((s) => /Chapter II /.test(s[0])).every((s) => /[.?!”"’)]$/.test(s[1].trim())));
  const marks = [...t.slice(0, t.lastIndexOf('\n\n[1] ')).matchAll(/\[(\d+)\]/g)].map((m) => +m[1]); const labels = [...d.s[d.s.length - 1][1].matchAll(/^\[(\d+)\]/gm)].map((m) => +m[1]);
  ok('On Liberty: nine footnotes, marks 1 to 9 in the text and the same labels in the notes', labels.join() === '1,2,3,4,5,6,7,8,9' && marks.join() === labels.join(), [marks, labels]);
  ok('On Liberty: the famous sentences are there, and the introduction by someone else is not', /If all mankind minus one, were of one opinion/.test(t) && /Over himself, over his own body and mind, the individual is sovereign\./.test(t) && !/W\. L\. COURTNEY|Courtney/.test(t));
}
/* The Theologico-Political Treatise: preface, chapters I to XX once each and in order, four sets of Spinoza's endnotes; the e-text's numbering gone */
{
  const d = load('f-spi'); const h = heads(d); const t = all(d);
  const chap = h.filter((x) => /^Chapter [IVXL]+ · /.test(x)).map((x) => toInt(x.match(/^Chapter ([IVXL]+) /)[1]));
  ok('Spinoza: a preface, then Chapters I to XX once each, in order', h[0] === 'Preface' && chap.join() === Array.from({ length: 20 }, (_, i) => i + 1).join(), chap);
  ok('Spinoza: Chapter XX is the one on thinking what you like and saying what you think', /^Chapter XX · That in a Free State every man may Think what he Likes, and Say what he Thinks$/.test(h[h.findIndex((x) => /^Chapter XX /.test(x))]) && /allowing every man to think what he likes, and say what he thinks\./.test(t));
  ok('Spinoza: four sets of the author’s endnotes at the end', h.slice(-4).every((x, i) => x.startsWith('Endnotes by Spinoza · Part ' + ['I', 'II', 'III', 'IV'][i])), h.slice(-5));
  const marks = new Set([...t.matchAll(/\[Endnote (\d+)\]/g)].map((m) => +m[1])); const notes = new Set([...t.matchAll(/^Endnote (\d+)\./gm)].map((m) => +m[1]));
  ok('Spinoza: every “[Endnote n]” mark in the text has its note (the e-text has no mark for notes 3, 6 and 17, and no other note lacks one)', marks.size >= 30 && [...marks].every((n) => notes.has(n)) && [...notes].filter((n) => !marks.has(n)).join() === '3,6,17', [[...marks].filter((n) => !notes.has(n)), [...notes].filter((n) => !marks.has(n))]);
  ok('Spinoza: the volunteers’ search strings, sentence numbers and braces are gone', !/\[\d+:[0-9A-Z]\]/.test(t) && !/(^|\s)\((?:\d{1,2}:)?\d{1,3}\)\s/.test(t) && !/[{}]/.test(t) && !/[A-Za-z]\(\d{1,3}\)/.test(t));
}
/* The Bloudy Tenent: twelve propositions, the letters, Cotton's answer, the 138 chapters of the reply (one number used twice) and the 28 of the second part */
{
  const d = load('f-blt'); const h = heads(d); const t = all(d);
  const reply = h.filter((x) => /^Truth and Peace reply to Mr\. Cotton · Chapter /.test(x)); const second = h.filter((x) => /^Mr\. Cotton’s letter answered · Chapter /.test(x));
  ok('Williams: the propositions, the two addresses, the Newgate paper and Cotton’s answer come first', h.slice(0, 5).join('|') === 'The twelve propositions on the title page|To the High Court of Parliament|To every courteous reader|Scriptures and reasons against persecution, written by a close prisoner in Newgate|The answer of Mr. John Cotton of Boston', h.slice(0, 5));
  ok('Williams: the reply has chapters I to CXXXVIII in order, with CXX used twice as in the printed book', reply.length === 139 && reply.filter((x) => /CXX \(a second chapter so numbered\)/.test(x)).length === 1 && reply.map((x) => toInt(x.match(/Chapter ([IVXLC]+)/)[1])).every((n, i, a) => !i || n >= a[i - 1]) && toInt(reply[reply.length - 1].match(/Chapter ([IVXLC]+)/)[1]) === 138, reply.length);
  ok('Williams: the second part has an address to the impartial reader and chapters I to XXVIII', second.length === 28 && h.includes('Mr. Cotton’s letter answered · To the impartial reader') && second.map((x) => toInt(x.match(/Chapter ([IVXL]+)/)[1])).join() === Array.from({ length: 28 }, (_, i) => i + 1).join());
  ok('Williams: the sixth proposition and the wall of separation are there', /a permission of the most Paganish, Jewish, Turkish, or anti-christian consciences and worships be granted to all men in all nations and countries/.test(t) && /gap in the hedge, or wall of separation, between the garden of the church and the wilderness of the world/.test(t));
  const verses = [...t.matchAll(/\[(\d{1,3})\]/g)].map((m) => +m[1]);
  ok('Williams: the printed side-notes, the editor’s 280 footnote marks and the editor’s introduction are gone (the few bracketed numbers left are verse numbers the editor added, such as “1 Thes. v. [21]”)', !/\[Sidenote|FOOTNOTES|HANSERD KNOLLYS|Underhill/i.test(t) && verses.length >= 5 && verses.every((n) => n <= 40) && /1 Thes\. v\. \[21\], Try all things/.test(t), [verses, (t.match(/\[Sidenote|FOOTNOTES|HANSERD KNOLLYS|Underhill/i) || [''])[0]]);
  ok('Williams: the editor’s own bracketed words stay, as in the edition', /\[shewing\]/.test(t) && /\[is\] your task/.test(t));
}
console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
