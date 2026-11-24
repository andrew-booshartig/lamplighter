/* ═══════════════════════════ 6d · Random: a passage, or a page ═══════════════════════════
   A passage from any readable book (all English translations), with its exact reference; or a page. The picker works on the same section/paragraph text the reader shows
   and is built so that a pick reads as the text itself, whichever kind is asked for:
     · a section of front or back matter (index, glossary, bibliography, notes, a short introduction) is not drawn from;
     · every paragraph is judged on its own first: an editor's note or cross-reference, a citation or bibliography line, a glossary or
       index entry, a contents list, a list of names or numbers, a running page header, scan garbage and anything that is not English
       are all left out (the same judgement is applied again to the finished passage);
     · a passage begins at the start of a sentence (or verse) and ends where one ends, never mid-clause: a paragraph that begins or stops
       in the middle of a sentence pulls in the paragraph before or after it;
     · a "page" grows from a random paragraph in both directions, so the chosen place sits anywhere on the page, and it is held to a
       minimum fill and to a stricter test than a few lines (real sentences, few proper names, few numbers);
     · a PASSAGE (the default of the Random tab) is a unit with a reference: in a text that numbers its verses, a run of verses from the edge of a sentence to the edge of a sentence at the translators' own
       paragraph breaks ("Psalm 4:1–3", 2z-passage-core.js); in any other text, a paragraph or a few begun where a paragraph begins, cited by its section and its printed page where the book has them;
     · the paragraph a pick starts at is returned, so the reader can open the book at that place with the text above and below it. */
/* under Node (the tests and tools/audit_passages.js) the pure core sits beside this file; in the app both are part of the one script */
if (typeof module !== 'undefined' && module.exports) Object.assign(globalThis, require('./2z-passage-core.js'), require('./2z-passage-pool.js'), require('./2z-passage-filter-core.js'), require('./2z-passage-index.js'), require('./2z-passage-saved-core.js'), require('./6d2-passage-filters.js'), require('./2z-related-core.js'));
const PSG_WORDS = new Set('the and of to in that is was he for it with as his on be at by i this had not are but from or have an they which you were her all she there would their we him been has when who will more no if out so said what up its about into than them can only other new some could time these two may then do first any my now such like our over man me even most made after also did many before must through back where much your way well down should because each just those people how too little good very make still own see men work long get here between both life being under never day same another know while last might us great old year off come since against go came right used take three'.split(' '));

function englishScore(text) {
  const w = String(text).toLowerCase().match(/[a-z']+/g) || []; if (w.length < 8) return 0;
  let n = 0; for (const x of w) if (PSG_WORDS.has(x)) n++;
  return n / w.length;
}
const psgClean = (t) => String(t).replace(/\[\[\d+\]\]/g, ' ').replace(/\s+/g, ' ').trim();
/* the words as the page shows them (no verse numbers), for looking at how a block begins and ends */
const psgVisible = (t) => String(t).replace(/\[\[\d+\]\]/g, '').replace(/\s+/g, ' ').trim();

/* ── an editor's notes are not the text ──
   Marks of notes: cross-references, sigla with numbers (CT XV 8, SBH 23, K 4618, Br. 7781), grammatical labels, word-for-word glosses,
   and scripture or book citations written the scholar's way (Gen. xv. 2, Eth. En. lx. 20, xxiv. 2, John 3:16). A numbered paragraph alone
   is not enough: many translations number their verses. */
const PSG_APPARATUS = /\bcf\.|\d ?ff\.|\bibid\b|\bop\.? ?cit\b|\bloc\.? ?cit\b|\bvar\.|\bvariants?\b|\bSum\.|\bSem\.|\bAkk\.|\bBr\. ?\d|\bpp?\. ?\d|\bll?\. ?\d|\blines? \d|\bcol\. ?[IVX\d]|\bobv\.|\brev\. ?\d|\b[A-Z]{2,5}(?: [IVXL]{1,5})? (?:no\. )?\d|\s=\s|\b(?:read(?:s|ing)?|translat(?:es|ed|ion)) (?:as|by)\b|\bsee (?:note|above|below|p\.)|\b(?:Gen|Exod?|Lev|Num|Deut|Josh|Judg|Sam|Kgs|Chr|Ezr|Neh|Esth|Pss?|Prov|Eccl|Isa|Jer|Lam|Ezek|Dan|Hos|Matt|Mk|Lk|Jn|Rom|Cor|Gal|Eph|Col|Thess|Tim|Heb|Jas|Pet|Rev|Eth|Jub|Syr|Arm|Skt)\. ?(?:[ivxlc]{1,6}\b\.?|\d{1,3}\b)|\b(?:Enoch|Jubilees|Baruch|Ezra|Psalm|Isaiah|Genesis|Exodus|Matthew|Luke|John|Romans|Acts|Revelation|Sirach) [ivxlc]{1,6}\. \d|\b[A-Z][a-z]{2,9}\.? \d{1,3}:\d{1,3}\b|\b[ivxlc]{1,6}\. \d{1,3}(?:[-–,] ?\d{1,3})?\b|\(note\)|\b(?:vols?|eds?|trans|tr)\. |\b(?:London|Oxford|Leipzig|Berlin|Paris|Cambridge|New York|Edinburgh|Leiden|Boston|Chicago|Philadelphia),? ?\(?1[5-9]\d\d|\b(?:Press|Verlag|Revue|Zeitschrift|Journal|Proceedings|Transactions)\b[^.]{0,40}\b(?:1[5-9]\d\d|20[0-2]\d)|\bq\.v\.|\bs\.v\.|\bviz\.|_[^_]{3,70}_,? (?:Nos?|pp?|vols?|[IVX]+)\.? ?\d|\b[A-Z]{4,}, (?=_[A-Z])/g;
/* a scholar talking about the text rather than the text: critical words and scholars' names beside verbs of opinion */
const PSG_META = /\b(?:emendations?|interpolat\w+|conjectur\w+|redact\w+|pseudepigraph\w+|manuscripts?|MSS?\.|recensions?|commentators?|critics?|scholars?|textual|variant readings?|the (?:translator|editor|writer|author|compiler)|our (?:book|text|author|writer)|this (?:view|theory|hypothesis|reading)|the (?:Greek|Hebrew|Latin|Syriac|Ethiopic|Slavonic|Armenian|Coptic|Aramaic|Arabic|Sanskrit|Pali) (?:text|version|original|word|phrase|has|reads|renders|means)|thinks that|holds that|identifies|dates? (?:from|to)|composed in|probably written|was written)\b|\b[A-Z][a-z]+ (?:believes|thinks|suggests|argues|maintains|assumes|supposes|contends|refers|prefers|conjectures|renders|translates|observes|remarks|concludes|asserts|cites|quotes|adds that|states that)\b|\b(?:Dr|Mr|Prof|Rev|Mons)\. [A-Z][a-z]+|\b(?:authorities|authority for|his History of|in his Introduction|the commentators|Notices et|Transactions of)\b/g;
/* the language of an editor's introduction or note: authorship, redaction, recensions, scholars and their theories, the Greek and Syriac versions, Hellenistic Judaism.
   One of these is nothing (a translation may well say "the Greek"); three in a paragraph are a scholar writing about the text. */
const PSG_ACAD = /\b(?:authorship|redact\w+|interpolat\w+|recensions?|manuscripts?|codices|codex|commentators?|commentar(?:y|ies)|scholars?|critics?|criticisms?|hypothes[ie]s|theor(?:y|ies)|literary|pseudepigraph\w+|apocalyptic|provenance|canonical|Septuagint|Masoretic|Vulgate|Targum\w*|Hellenistic|Alexandrine|Judaism|Christology|eschatolog\w+|angelolog\w+|monotheis\w+|dualis\w+|the writer|the author|the translator|the editor|our author|this (?:view|theory|passage|reading)|it (?:appears|is clear|is probable|is possible) that|we (?:may suppose|find|meet|have seen)|we (?:may|must|shall|can) (?:also |further |here |now |thus )*(?:remark|note|observe|suppose|add|compare|conclude)|it (?:may|must|should) be (?:noted|observed|remarked)|as (?:has been|we have) (?:already )?(?:seen|noted|observed|shown)|the (?:Syriac|Ethiopic|Slavonic|Armenian|Coptic|Aramaic) (?:version|text)|the Greek (?:version|text)|the Hebrew (?:text|original))\b/g;
const psgAcademic = (c, lim) => { const w = (c.match(/\S+/g) || []).length; return (c.match(PSG_ACAD) || []).length >= (lim || (w >= 100 ? 3 : 2)); };
function psgApparatus(t) {
  const words = (t.match(/\S+/g) || []).length; const n = (t.match(PSG_APPARATUS) || []).length;
  return n >= 4 || (n >= 2 && n / Math.max(words, 1) > 0.025) || ((t.match(/\b(?:1[5-9]\d\d|20[0-2]\d)\b/g) || []).length >= 3 && n >= 1)
    || (t.match(/\(\d{1,3}\)/g) || []).length >= 3 || (t.match(/\b[A-Z][\w’'-]+\. — [A-Z]/g) || []).length >= 2 || /^(?:Lines?|Vv?\.|Pp?\.|Verses?) ?\d/.test(t) || /^[\^*†‡§] ?[A-Z]/.test(t)
    || (t.match(PSG_META) || []).length >= (words < 150 ? 2 : 4);
}
/* the plainest signs of an editor's hand: one of these anywhere in a page of text is enough to leave the page out */
const PSG_STRONG = /\bcf\.|\bibid\b|\bop\.? ?cit|\bloc\.? ?cit|\bpp?\. ?\d|\bq\.v\.|\bcols?\. ?[IVX\d]|\bObv\.|\bRev\. ?[IVX\d]|\bsee (?:Zimmern|Mal\.|note|ch\.|chap\.)|\bZeitschrift|\bJournal of\b|\bvv?\. ?\d|\bch\. ?[ivxlc\d]+\b|\b[A-Z]{2,4}\. \d{1,3}, \d{1,3}\b|\((?:cf\. )?[1-3]? ?[A-Z][a-z]{1,6}[.,]? [IVXLCivxlc]{1,6}[.,]? ?\d{1,3}/g;
/* OCR garbage and stray marks: symbols inside words, single stray letters, a capital in the middle of a word, digits glued to letters */
function psgGarbled(c) {
  const toks = String(c).match(/\S+/g) || []; if (toks.length < 6) return false; let bad = 0;
  for (const t of toks) {
    if (/[•°^~|{}<>@#©§¶\\]/.test(t) || /["'’”‘“]{2,}[A-Za-z]|[A-Za-z][.,;:?!]?["'’”]{3,}/.test(t)) bad++;
    else if (/^[^A-Za-z]*[A-Za-z][^A-Za-z]*$/.test(t) && !/^[^A-Za-z]*[aAIOo&][^A-Za-z]*$/.test(t)) bad++;
    else if (/[a-z][A-Z]/.test(t) && !/^(?:Mc|Mac|O’|O')/.test(t)) bad++;
    else if (/[A-Z]{2,}[a-z]/.test(t) && !/^[A-Z]{2,}’?s$/.test(t)) bad++;
    else if ((/[A-Za-z]\d|\d[A-Za-z]/.test(t)) && !/^\d+(?:st|nd|rd|th|s)\b/.test(t)) bad++;
  }
  return bad / toks.length > 0.045;
}
/* all-capital runs (titles, running heads, contents) */
const psgAllCaps = (c) => { const l = String(c).replace(/[^A-Za-z]/g, ''); return l.length > 12 && l.replace(/[^A-Z]/g, '').length / l.length > 0.6; };
/* a list of chapter or book titles */
const psgContents = (c) => ((c.match(/\b(?:CHAPTER|CHAP\.|BOOK|SECTION|PART|LECTURE)\s+(?:[IVXLC]+|\d+)\b/g) || []).length >= 2) || /^(?:CHAPTER|BOOK)\s+\S+\.?\s+(?:How|Of|The|Concerning|That|What|Why|Where)\b/.test(c) && (c.match(/\b[A-Z][a-z]+\b/g) || []).length / Math.max((c.match(/\b[A-Za-z]+\b/g) || []).length, 1) > 0.4;
/* a text's names, numbers and sentences: how list-like it reads. caps = capitalised words that are not the first word of a sentence. */
function psgShape(c) {
  const toks = String(c).split(/\s+/).filter(Boolean); let caps = 0; let nums = 0; let words = 0; let prevEnd = true;
  for (const t of toks) {
    const l = t.replace(/[^A-Za-z]/g, '');
    if (l.length >= 2 || /^\d/.test(t)) { words++; if (/^[“"‘'(]*[A-Z]/.test(t) && !prevEnd && l.length >= 2) caps++; if (/^\d|^(?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand)$/i.test(l || t)) nums++; }
    prevEnd = /[.!?]["”’)\]]*$/.test(t);
  }
  const sentences = (String(c).match(/[.!?]["”’)\]]*(?:\s|$)/g) || []).length; const commas = (String(c).match(/,/g) || []).length;
  return { words, caps: caps / Math.max(words, 1), nums: nums / Math.max(words, 1), sentences, perSentence: words / Math.max(sentences, 1), commas: commas / Math.max(words, 1) };
}
/* a list of names, a census, a genealogy, a roll call. page = the stricter test applied to a finished passage. */
function psgListLike(c, page) {
  const s = psgShape(c); if (s.words < 12) return false;
  const capLim = page ? 0.24 : 0.32;
  if (s.caps > capLim + 0.1) return true;
  if (s.caps > capLim && s.nums > 0.04) return true;
  if (s.nums > (page ? 0.1 : 0.14)) return true;
  if (s.commas > 0.2 && s.perSentence > 28 && s.caps > 0.15) return true;
  return page && s.caps > 0.2 && s.commas > 0.14 && s.perSentence > 20;
}
/* a glossary or index: lines or sentences of the form "term — definition", "term, n. …", "see …", and page-number runs */
function psgGlossaryLike(raw) {
  const t = String(raw); const lines = t.split('\n').map((x) => x.trim()).filter(Boolean);
  if (lines.length >= 4) { const e = lines.filter((l) => /^[A-Za-zĀ-ž’'()\[\]\- ]{1,38}?\s*(?:[:—–=]|,\s+(?:n|v|adj|adv|a|an|the|one)\b\.?)\s+\S/.test(l)).length; if (e / lines.length >= 0.7) return true; }
  const c = psgClean(t);
  if ((c.match(/(?:^|[.;]\s+)[A-Z][\w’'-]*(?: [A-Z][\w’'-]*){0,3}(?:,| —| –|:) (?:a|an|the|one|n\.|v\.|name of|title of|see|also called|meaning|means)\b/g) || []).length >= 3) return true;
  if ((c.match(/\bsee [A-Z]|\b(?:n|v|adj|adv|pl|sing|masc|fem)\.\s/g) || []).length >= 3) return true;
  if ((c.match(/\b\d{1,4}(?:\s?[-–,]\s?\d{1,4}){2,}/g) || []).length >= 2) return true;    // 12, 45, 67–69
  return false;
}
/* what the block is, for choosing it as a place to start or to grow into */
function psgUsable(p) {
  const t = psgClean(p); if (t.length < 70 || /^#{1,3} /.test(p)) return false;
  const ns = t.replace(/\s/g, ''); const letters = (ns.match(/[A-Za-z]/g) || []).length; const digits = (ns.match(/\d/g) || []).length;
  if (letters / ns.length < 0.8 || digits / ns.length > 0.05) return false;
  if (/^(footnote|notes?\b|see |cf\.|ibid|transcriber|\[?illustration|contents)/i.test(t)) return false;
  if (psgApparatus(t) || psgAcademic(t) || psgGarbled(t) || psgAllCaps(t) || psgContents(t) || psgGlossaryLike(p) || psgListLike(t, false)) return false;
  return englishScore(t) >= 0.3;
}
/* a short block that is plain text and may sit inside a page (a one-line verse, a short answer), though it is not a place to start from */
function psgBridge(p) {
  const t = psgClean(p); if (t.length < 8 || /^#{1,3} /.test(p) || /^\d+[\s.)]*$/.test(t)) return false;
  return !psgApparatus(t) && !psgAllCaps(t) && !psgGarbled(t) && /[A-Za-z]{3}/.test(t) && !/^(?:footnote|notes?\b|see |cf\.|ibid)/i.test(t);
}
/* Some editions number their notes ('16. Sum. glosses…'), others number the scripture itself ('112. Yea, Mahabrahman…'). A book whose
   numbered paragraphs often carry an editor's apparatus is the first kind: there, a numbered paragraph is a note even when it has no
   cross-reference to give it away ('2 . This heading of the next tablet…'). Langdon's Psalms are one; the Diamond Sutra is not. */
const PSG_NOTE_NO = /^\s*(?:[\[(]?\d{1,3}\s?[.)]\s|\d{1,3}\s+(?=[A-Z]))/;
const psgNoteCache = typeof WeakMap === 'function' ? new WeakMap() : null;
function psgNumberedAreNotes(secs) {
  if (psgNoteCache && psgNoteCache.has(secs)) return psgNoteCache.get(secs);
  let n = 0; let app = 0;
  for (const sec of secs) for (const p of String(sec[1]).split(/\n{2,}/)) { if (!PSG_NOTE_NO.test(p)) continue; const c = psgClean(p); if (c.length < 60) continue; n++; if (psgApparatus(c)) app++; }
  const r = n >= 20 && app / n >= 0.25; if (psgNoteCache) psgNoteCache.set(secs, r); return r;
}

/* ── scans: running heads and note marks ──
   A scanned page carries its running head into the text ("ACTS OF THOMAS 395 for mine unhappy daughter", "164 THE HYMNS OF THE
   ATHARVAVEDA. Let him"), and a numbered note mark may be left in the line ("darkness[726]"). Both are taken out of the passage, so a
   page that crosses a page break of the scan reads straight on. Only runs of capitals with at least two real words are touched. */
const psgBigWords = (s) => (s.match(/[A-Z]{3,}/g) || []).length;
function psgTidy(t, scan, notes) {
  let s = String(t).replace(/([A-Za-z.,;:!?”’"'])\[\d{1,4}\]/g, '$1').replace(/\((?:ll?|vv?|lines?|verses?)\.? ?\d+(?:\s?[-–]\s?\d+)?\)\s*/g, '');   // note marks, and a translator's line numbers '(ll. 4-18)'
  if (notes) s = s.replace(/([A-Za-z.,;:!?”’"'])\d{1,2}(?=[\s,.;:!?"”’)\]]|$)/g, '$1');      // a text that prints its footnotes after the verses leaves their numbers stuck to the words ("trumpet,2", "ENWRAPPED1")
  if (!scan) return s;
  s = s.replace(/([A-Za-z])¬\s+(?=[a-z])/g, '$1').replace(/¬\s*/g, '');      // a scan breaks a word at the end of a line with ¬ ("Abra¬ ham"): the halves are joined
  s = s.replace(/(^|\s)((?:[A-Z][A-Z’'.,:;&-]*\s+){1,9}[A-Z][A-Z’'.,:;&-]*)\s+\d{1,4}(?=\s+[A-Za-z“"‘'(\[])/g, (m, a, h) => (psgBigWords(h) >= 2 && h.replace(/[^A-Z]/g, '').length >= 8 ? a : m));
  s = s.replace(/(^|\s)\d{1,4}\s+((?:[A-Z][A-Z’'.,:;&-]*\s+){2,9}[A-Z][A-Z’'.,:;&-]*)(?=\s+[A-Za-z“"‘'(\[])/g, (m, a, h) => (psgBigWords(h) >= 2 && h.replace(/[^A-Z]/g, '').length >= 10 ? a : m));
  s = s.replace(/\b[A-Z]{3,10} \d{1,3}\.?\](?=\s)/g, '');
  s = s.replace(/\b(?:CHAPTER|BOOK|PART|SECTION|CANTO|APPENDIX|INTRODUCTION|PREFACE|NOTES|INDEX)\.?\s+(?:[IVXLC]+\.?\s+)?(?:[\d]+(?:[-–,]\s?\d+)*\.?\s*){1,3}(?=\s+[A-Za-z“"‘'(\[])/g, ' ');
  s = s.replace(/\b(?:Introduction|Appendix|Preface|Contents|Index|Notes)\.? [IVXLC]{1,7}(?=\s+[a-zA-Z])/g, ' ');
  s = s.replace(/\b(?:INTRODUCTION|APPENDIX|PREFACE|CONTENTS|INDEX|NOTES)\.?\s+[ivxlcIVXLC]{1,7}\b/g, ' ');
  s = s.replace(/(^|[.!?”"’]\s+)((?:[A-Z]{3,}\s+){1,5}[A-Z]{3,}\.)\s+(?=[A-Z][a-z])/g, (m, a, h) => (psgBigWords(h) >= 2 ? a : m));
  s = s.replace(/\s\^+\s?/g, ' ');
  return s.replace(/[ \t]{2,}/g, ' ').replace(/^ +/gm, '').trim();
}

/* a line number at the start of a verse line, including OCR misreadings of digits ("5o-5i", "/|6", "A8-/J9") */
const PSG_LINE_NO = /^\s*(?=[^\s]*\d)[0-9A-Za-z|/\\^!:;'’.,~■•-]{1,8}\s*[■•.]?\s+(?=\S)/;
/* a section's paragraphs, with runs of short ones (a poem or psalm printed one line to a paragraph, as scans often come out, or a
   poem's short stanzas) taken as one block, so verse can be drawn as a whole rather than lost piece by piece under the length floor.
   A scan's one-line paragraphs are an accident of OCR, so they are joined as lines of one stanza; a typed text keeps its own breaks.
   Each block carries p: the index of its first paragraph as the reader numbers them, so a pick can be opened at its place. */
function psgBlocksP(text, scan, skip) {
  const out = []; let run = []; let runP = 0;
  const flush = () => { if (run.length) out.push({ t: run.join(scan && run.every((x) => !x.includes('\n')) ? '\n' : '\n\n'), p: runP }); run = []; };
  String(text).split(/\n{2,}/).forEach((p, pi) => {
    const c = psgClean(p);
    if (skip && skip.has(pi)) { flush(); out.push({ t: p, p: pi, note: true }); return; }
    if (c && c.length < 90 && !/^#{1,3} /.test(p) && !/\[\[\d+\]\]/.test(p)) {
      let line = p.trim(); if (scan && !line.includes('\n')) { const s = line.replace(PSG_LINE_NO, ''); if (s.length >= 3 && /[A-Za-z]{2}/.test(s)) line = s; }
      if (!run.length) runP = pi; run.push(line);
    } else { flush(); out.push({ t: p, p: pi }); }
  });
  flush(); return out;
}
const psgBlocks = (text, scan) => psgBlocksP(text, scan).map((b) => b.t);
/* ── footnotes printed after the verses ──
   Rodwell's Qur'an gives each sura's verses one to a paragraph and then its notes as "103 A name applied to an idol…", numbered but with no full stop, in an ascending run. A run of two or more such paragraphs is a block
   of notes, and so is every paragraph of it; but where most of a book is numbered that way, the numbers are its own (a typed Bible with "1 In the beginning"), not notes. */
const PSG_NOTE_UNDOTTED = /^\s*(\d{1,3})\s+(?=[A-Z“"‘'(\[])/;
function psgNoteParas(paras) {
  const hit = new Set(); let i = 0;
  while (i < paras.length) {
    const m = PSG_NOTE_UNDOTTED.exec(paras[i]); if (!m) { i++; continue; }
    let j = i; let last = +m[1];
    while (j + 1 < paras.length) { const n = PSG_NOTE_UNDOTTED.exec(paras[j + 1]); if (!n || +n[1] <= last || +n[1] - last > 3) break; last = +n[1]; j++; }
    if (j > i) for (let k = i; k <= j; k++) hit.add(k);
    i = j + 1;
  }
  return hit;
}
function psgUndottedNotes(secs) {
  let n = 0; let all = 0; let runs = 0;
  for (const sec of secs) { const ps = String(sec[1]).split(/\n{2,}/); all += ps.length; const h = psgNoteParas(ps); n += h.size; if (h.size) runs++; }
  return runs >= 3 && n >= 6 && n / Math.max(all, 1) < 0.25;
}

/* positions where a passage may begin: the start of a sentence (not after an abbreviation or an initial), a verse that follows a finished
   sentence, a verse line that follows one, or a paragraph that opens like a sentence */
const PSG_ABBR = new Set('mr mrs ms dr st vs viz cf ibid etc sq sqq no nos vol vols ch chap ed eds tr trans pp p ff fol ver vv v ll l op cit loc esp ca c b d e i s'.split(' '));
function psgStarts(text) {
  const out = new Set(); let m;
  if (/^(?:\[\[\d+\]\]\s*)*[A-Z“"‘'(\[]/.test(text)) out.add(0);
  const a = /([\w’'-]*)([.!?])(["”’)\]]*)\s+(?=(?:\[\[\d+\]\]\s*)?[A-Z“"‘'(\[])/g;
  while ((m = a.exec(text))) { const w = m[1]; if (m[2] === '.' && (/^[A-Za-z]$/.test(w) || PSG_ABBR.has(w.toLowerCase()) || /^\d+$/.test(w))) continue; out.add(m.index + m[0].length); }
  const v = /[.!?]["”’)\]]*\s*(?=\[\[\d+\]\])/g; while ((m = v.exec(text))) out.add(m.index + m[0].length);
  const pg = /\n\n(?=(?:\[\[\d+\]\]\s*)?[A-Z“"‘'(\[])/g; while ((m = pg.exec(text))) out.add(m.index + 2);
  return [...out].filter((x) => x < text.length).sort((x, y) => x - y);
}
/* the window of about `target` characters, from a sentence start to a sentence start; returns the text and where it began */
function psgWindowAt(text, target, rng, para) {
  const lead = text.length - text.replace(/^\s+/, '').length;
  if (psgClean(text).length <= target * 1.5) return { text: text.trim(), start: lead, end: text.length };
  const b = psgStarts(text); let starts = b.filter((s) => text.length - s >= target * 0.6);
  if (para) { const ps = starts.filter((s) => s === 0 || text.slice(s - 2, s) === '\n\n'); if (ps.length) starts = ps; }      // a passage (not a page) begins where a paragraph does, when it can
  if (!starts.length) return null;
  const s = starts[psgBelow(rng, starts.length)]; let e = b.find((x) => x - s >= target);
  if (para) { const pe = b.find((x) => x - s >= target * 0.8 && x - s <= target * 1.4 && text.slice(x - 2, x) === '\n\n'); if (pe != null) e = pe; }      // and ends where one does
  return { text: text.slice(s, e == null ? text.length : e).trim(), start: s, end: e == null ? text.length : e };
}
const psgWindow = (text, target, rng) => { const w = psgWindowAt(text, target, rng); return w ? w.text : text.trim(); };

/* how a block begins and ends */
const psgStartsLower = (t) => /^[“"‘'(\[]*[a-z]/.test(psgVisible(t));
const psgEndsClean = (t) => /[.!?…]["”’)\]]*$/.test(psgVisible(t));
/* a scan's last line can end in stray marks (", . - — Tg"): a fragment after the last full stop with no real word in it is cut off */
function psgTrimJunk(t) {
  const m = /^([\s\S]*[.!?]["”’)\]]*)\s+([^\n]{1,14})$/.exec(t);
  if (m && !/[A-Za-z]{4}/.test(m[2])) return m[1].trim();
  const h = /^([\s\S]*[^\n])\n\s*[IVXLC]{1,7}(?:\s+[IVXLC]{1,3})?\.?\s+\d{1,4}\.?\s+[^\n]*$/.exec(t);      // a poem's number and the first line of the next one ("XII. 131. nis din khelat…"), left at the end of a verse page
  if (h) return h[1].trim();
  return t;
}
const psgIsStanza = (t) => /\n/.test(t) && t.split('\n').filter((l) => l.trim()).length >= 3;

/* ── front and back matter ──
   A section whose heading is an index, glossary, bibliography, list of abbreviations, notes, appendix, contents… is not drawn from. A
   front matter heading (introduction, preface, foreword, translator's note) is skipped too, but only when it is a small part of the
   book: some scans give one "Introduction" heading to everything after it, and then it is the book. */
const PSG_BACK = /^(?:index|indexes|indices|general index|glossary|glossarial|bibliography|abbreviations|list of|errata|corrigenda|addenda|addendum|appendix|appendices|notes?|footnotes?|endnotes?|contents|table of|chronolog|genealog|concordance|vocabulary|word[- ]list|select(?:ed)? (?:bibliography|references)|further reading|references|works cited|colophon|publisher|advertisement|catalogue|about the (?:author|translator|editor)|biographical note|transcriber)\b/i;
const PSG_FRONT = /^(?:introduction|general introduction|preface|foreword|editors?[’']? (?:preface|note|introduction)|translators?[’']? (?:preface|note|introduction)|prolegomena|note on the|to the reader|dedication|argument)\b/i;
function psgHeadSegs(h) { return String(h).split(' · ').map((s) => s.trim()).filter((s, i, a) => !/^part \d+ of \d+$/i.test(s) && !(/…$/.test(s) && i === a.length - 1 && a.length > 1)); }
/* a heading that says the section is the editor's or the translator's own words is skipped whatever its size, so long as the book has other sections; a plain "Introduction" is skipped only when it is a small part of the book (some scans give it to everything after it) */
const PSG_FRONT_STRONG = /^(?:editors?\b|translators?\b|preface|foreword|prolegomena|to the reader|note on the)/i;
function psgMatterParts(secs) {
  const back = new Set(); const front = new Set(); const strong = new Set(); let fc = 0; let total = 0; let bc = 0;
  secs.forEach((s, i) => { const L = String(s[1]).length; total += L; const segs = psgHeadSegs(s[0]); if (segs.some((g) => PSG_BACK.test(g))) { back.add(i); bc += L; } else if (segs.some((g) => PSG_FRONT.test(g))) { front.add(i); fc += L; if (segs.some((g) => PSG_FRONT_STRONG.test(g))) strong.add(i); } });
  const out = { back: new Set(), front: new Set() }; if (bc <= total * 0.6) back.forEach((i) => out.back.add(i));
  if (fc <= total * 0.25) front.forEach((i) => out.front.add(i)); else if (strong.size && strong.size + out.back.size < secs.length) strong.forEach((i) => out.front.add(i));
  return out;
}
/* the sections left out of a passage: front and back matter together */
function psgMatterSections(secs) { const m = psgMatterParts(secs); return new Set([...m.back, ...m.front]); }

/* an unbiased integer in [0, n) from a stream of floats: the top 32 bits of each float, with the uneven remainder of the range thrown away */
function psgBelow(rng, n) {
  if (!(n > 1)) return 0;
  if (rng && typeof rng.at === 'number') { const a = rng.at; rng.at = null; return Math.min(n - 1, Math.max(0, Math.floor(a * n))); }      // a draw by dice: its first place is where the dice say, how far through the book (every other stream has no .at, and goes on as it always did)
  const lim = Math.floor(4294967296 / n) * n; let x; do { x = Math.floor(rng() * 4294967296); } while (x >= lim); return x % n;
}
/* the stream a place is picked with: the seed's own, and for a seed that holds dice (psmDiceFromSeed) its first place is where the last two dice say */
function psgStreamOf(seed) { const s = randStream(seed); const d = psmDiceFromSeed(seed); if (d) s.at = psmPlaceOf(d.place, d.die); return s; }

/* a book's picking state, built once and kept: which sections may be drawn from, and each section's blocks as they are judged */
const psgStates = typeof WeakMap === 'function' ? new WeakMap() : null;
function psgState(secs, meta) {
  let S = psgStates && psgStates.get(secs); if (S) return S;
  const scan = /scan|OCR/i.test(`${(meta && meta.note) || ''} ${(meta && meta.license) || ''}`); const n = secs.length;
  let lo = 0; let hi = n - 1; if (scan && n >= 6) { lo = 1; hi = n - 2; } else if (scan && n >= 3) lo = 1;
  /* a long book cut into "Part n of m" is mostly a scan of an edition: its first parts hold the introduction, its last the notes, appendices and indexes, so those edges are left out */
  if (n >= 8 && secs.filter((x) => /part \d+ of \d+/i.test(x[0])).length >= n / 2) { lo = Math.max(lo, Math.ceil(n * 0.08)); hi = Math.min(hi, n - 1 - Math.ceil(n * 0.1)); }
  S = { secs, scan, lo, hi, notes: psgUndottedNotes(secs), notesNumbered: psgNumberedAreNotes(secs), matter: psgMatterSections(secs), sec: new Map(), dead: new Set(), idx: null, cum: null, total: 0 };
  if (psgStates) psgStates.set(secs, S); return S;
}
function psgSections(S) {   // the sections that may be drawn from, with cumulative lengths
  if (S.idx) return S;
  const pick = (skip) => { const idx = []; for (let i = S.lo; i <= S.hi; i++) if (!(skip && S.matter.has(i))) idx.push(i); return idx; };
  let idx = pick(true); if (!idx.length) idx = pick(false);
  S.idx = idx; S.cum = []; let t = 0; for (const i of idx) { t += String(S.secs[i][1]).length; S.cum.push(t); } S.total = t; return S;
}
function psgBuild(S, si) {  // a section's blocks, tidied, each marked: 'p' prose, 'v' stanza, 'b' short and plain, '' not to be used
  let sec = S.sec.get(si); if (sec) return sec;
  const items = psgBlocksP(S.secs[si][1], S.scan, S.notes ? psgNoteParas(String(S.secs[si][1]).split(/\n{2,}/)) : null); const blocks = []; const kind = []; const seed = []; let tot = 0;
  for (const it of items) {
    const t = psgTidy(it.t, S.scan, S.notes); blocks.push(t);
    let k = ''; const numbered = PSG_NOTE_NO.test(t);
    if (!it.note && !(S.notesNumbered && numbered)) { if (psgUsable(t)) k = psgIsStanza(t) ? 'v' : 'p'; else if (psgBridge(t)) k = 'b'; }
    kind.push(k); const L = k === 'p' || k === 'v' ? psgClean(t).length : 0; tot += L; seed.push(tot);
  }
  sec = { items, blocks, kind, seed, tot }; S.sec.set(si, sec); return sec;
}
/* random block among a section's usable ones, every character equally likely */
function psgSeed(sec, rng) { const r = psgBelow(rng, sec.tot); let lo = 0; let hi = sec.seed.length - 1; while (lo < hi) { const m = (lo + hi) >> 1; if (sec.seed[m] > r) hi = m; else lo = m + 1; } return lo; }

/* the finished passage must also read as the text: the judgement on a block is applied again to the whole */
function psgPassageOk(text, target, relax) {
  const c = psgClean(text); const verse = psgIsStanza(text) || (text.match(/\[\[\d+\]\]/g) || []).length >= 3;
  const fill = target >= 900 ? [0.78, 0.6, 0.42, 0][relax] : [0.5, 0.4, 0.28, 0][relax];
  if (c.length < Math.max(60, target * fill) || c.length > target * 2.2) return false;
  if ((c.match(PSG_STRONG) || []).length >= (target >= 900 ? 1 : 2)) return false;
  if (englishScore(c) < 0.3 || psgApparatus(c) || psgAcademic(c, 3) || psgGarbled(c) || psgAllCaps(c) || psgContents(c) || psgGlossaryLike(text) || psgListLike(c, target >= 560)) return false;
  if (psgStartsLower(text)) return false;
  if (!verse && !psgEndsClean(text)) return false;
  const sent = psgShape(c).sentences; if (!verse && sent < (target >= 1500 ? 4 : target >= 900 ? 3 : target >= 560 ? 2 : 1)) return false;
  return true;
}
/* secs = [[heading, text]]; meta = the text's index entry. Returns { si, heading, text, p } (p = the paragraph the passage starts in,
   as the reader numbers them) or null if no clean English passage turns up. */
function pickPassage(secs, meta, rng = psgRand, opts = {}) {
  const target = opts.target || 560; const S = psgState(secs, meta);
  for (let attempt = 0; attempt < 420; attempt++) {
    const relax = attempt >= 360 ? 3 : attempt >= 280 ? 2 : attempt >= 140 ? 1 : 0;      // a book too small for the length asked still gives its best clean stretch in the end
    psgSections(S); if (!S.idx.length || !S.total) return null;
    const r = psgBelow(rng, S.total); let k = 0; while (k < S.cum.length - 1 && S.cum[k] <= r) k++; const si = S.idx[k];
    const sec = psgBuild(S, si); if (!sec.tot) continue;     // a section with no usable paragraph is drawn and passed over: the table never changes, so a draw code always gives the same passage
    const j = psgSeed(sec, rng); const { blocks, kind, items } = sec; const L = (x) => psgClean(blocks[x]).length;
    const numberedSeed = PSG_NOTE_NO.test(blocks[j]); const fits = (x) => x >= 0 && x < blocks.length && kind[x] !== '' && (numberedSeed || !PSG_NOTE_NO.test(blocks[x]));
    let a = j; let b = j; let len = L(j);
    /* a block that begins in the middle of a sentence takes in what comes before it; one that stops short of the end of its sentence, what follows */
    const settle = () => {
      for (let i = 0; i < 3 && psgStartsLower(blocks[a]); i++) {
        if (fits(a - 1) && kind[a - 1] === 'b' && fits(a - 2) && kind[a - 2] !== 'v' && !psgEndsClean(blocks[a - 2])) { a--; len += L(a); a--; len += L(a); }
        else if (fits(a - 1) && kind[a - 1] !== 'b' && kind[a - 1] !== 'v' && !psgEndsClean(blocks[a - 1])) { a--; len += L(a); }
        else break;
      }
      for (let i = 0; i < 3 && kind[b] !== 'v' && !psgIsStanza(blocks[b]) && !psgEndsClean(blocks[b]) && fits(b + 1) && (psgStartsLower(blocks[b + 1]) || (kind[b + 1] === 'b' && b + 2 < blocks.length && psgStartsLower(blocks[b + 2]))); i++) { b++; len += L(b); }
    };
    settle(); if (psgStartsLower(blocks[a])) continue;
    /* grow toward the target on either side, so the place that was drawn can fall anywhere on the page */
    for (let g = 0; g < 60 && len < target * 0.95; g++) {
      const left = fits(a - 1) && len + L(a - 1) <= target * 1.7; const right = fits(b + 1) && len + L(b + 1) <= target * 1.7;
      if (!left && !right) break;
      if (left && (!right || rng() < 0.5)) { a--; len += L(a); } else { b++; len += L(b); }
    }
    settle();
    /* a short block cutting a sentence in two (a plate's caption, a running head) is not part of the text: it is left out */
    const keep = []; for (let x = a; x <= b; x++) { if (kind[x] === 'b' && x > a && x < b && !psgEndsClean(blocks[x - 1]) && psgStartsLower(blocks[x + 1]) && !/[.!?]["”’)]?$/.test(psgVisible(blocks[x]))) continue; keep.push(x); }
    const off = []; let joined = ''; keep.forEach((x, n) => { if (n) joined += '\n\n'; off.push(joined.length); joined += blocks[x]; });
    const w = psgWindowAt(joined, target, rng, opts.unit); if (!w) continue;
    let text = w.text; const trail = /\s*\[\[\d+\]\]$/; if (trail.test(text)) text = text.replace(trail, '');
    text = psgTrimJunk(text);
    if (!psgIsStanza(text) && !psgEndsClean(text)) { const cut = psgStarts(text).filter((x) => x > text.length * 0.6); if (cut.length) text = text.slice(0, cut[cut.length - 1]).trim(); }
    if (!psgPassageOk(text, target, relax)) continue;
    let bi = 0; for (let x = 0; x < off.length; x++) if (off[x] <= w.start) bi = x;
    let ei = bi; for (let x = 0; x < off.length; x++) if (off[x] < w.end) ei = x;
    return { si, heading: secs[si][0], text, p: items[keep[bi]].p, pe: Math.max(items[keep[bi]].p, items[keep[ei]].p) };
  }
  return null;
}

/* the areas named in an address (#/path/passage?a=0.3.5): collection numbers, dot-separated; blanks, junk and out-of-range numbers are dropped, and an empty address names none */
const psgAreasFrom = (s, n) => [...new Set(String(s == null ? '' : s).split('.').filter((x) => /^\d{1,3}$/.test(x)).map(Number).filter((k) => k < n))];
/* the old four lengths: a draw code made before passages still names one of them. A draw code of a passage says "passage", and "long" is a page. */
const PSG_LEN = { short: ['A few lines', 320], medium: ['A paragraph', 560], long: ['A page', 1500], longer: ['Two pages', 3000] };
const PSG_UNIT = 'passage';
/* the draw code of a passage says how long it was asked to be: Medium is the plain "passage" (every code made before the choice existed, so they replay as drawn); Short and Longer say so in the code */
const PSG_PLEN = { short: 'passage-short', medium: PSG_UNIT, longer: 'passage-longer' };
const psgPSize = (tok) => Object.keys(PSG_PLEN).find((k) => PSG_PLEN[k] === tok) || '';      // 'short' | 'medium' | 'longer', or '' for a code that is not a passage's
const PSG_SIZES = [['short', 'Short', 'A verse or two, or a few lines'], ['medium', 'Medium', 'A few verses or a paragraph: what a passage always was'], ['longer', 'Longer', 'A longer run, on to the next natural break']];
/* a passage's length from an address (?len=short, medium, longer, or s, m, l) or else from what was kept; Medium when neither says */
const psgSizeAsked = (q, kept) => (q === 's' || q === 'short' ? 'short' : q === 'l' || q === 'longer' ? 'longer' : q === 'm' || q === 'medium' ? 'medium' : psuSizeOf(kept));
const PSG_LEAF = { page: 1, pages: 2 };      // a draw code of a printed page, or of two
/* the passage view draws only from 01-random.js (the system's secure source); it never uses Math.random */
const psgRand = () => randFloat();

/* ═══ a passage: the unit around a place, with its reference ═══
   A page is cut by position (pickPassage, above). A passage is cut by structure. For a text that numbers its verses ([[n]]) the unit is a run of verses from the edge of a sentence to the edge of a sentence,
   at the translators' own paragraph edges where it can (2z-passage-core.js); for any other text it is the picker's paragraph or few, begun where a paragraph begins. Either way the place is drawn the same way
   (every character of usable text equally likely), and the unit is a fixed function of the place and the text, so a draw code replays it. */
const psgVerseOk = (c) => englishScore(c) >= 0.3 && !psgApparatus(c) && !psgGarbled(c) && !psgAllCaps(c) && !psgContents(c) && !psgListLike(c, true);
function psgVerseP(S, si) { if (!S.vp) S.vp = new Map(); if (!S.vp.has(si)) S.vp.set(si, psuVerseParse(S.secs[si][1])); return S.vp.get(si); }
/* does the text number its verses? (most of its characters sit in sections with [[n]] markers) */
function psgIsVerseText(S) {
  if (S.verse != null) return S.verse; let m = 0; let t = 0;
  for (const sec of S.secs) { const x = String(sec[1]); t += x.length; if (x.indexOf('[[') >= 0 && (x.match(/\[\[\d+\]\]/g) || []).length >= 2) m += x.length; }
  S.verse = t > 0 && m / t >= 0.6; return S.verse;
}
function psgPickVerse(S, rng, opts) {
  const mode = opts.mode === 'page' ? 'page' : 'passage'; const sizes = mode === 'page' ? PSU_SIZES.page : PSU_PASSAGE[psuSizeOf(opts.size)]; psgSections(S);
  if (!S.idx.length || !S.total) return null;
  for (let attempt = 0; attempt < 120; attempt++) {
    const r = psgBelow(rng, S.total); let k = 0; while (k < S.cum.length - 1 && S.cum[k] <= r) k++; const si = S.idx[k];
    const P = psgVerseP(S, si);
    if (!P) {      // a chapter whose verse numbers do not run in order is read as prose, and cited by its chapter
      const q = pickPassage([S.secs[si]], S.metaOf, rng, { target: mode === 'page' ? 1500 : sizes.prose, unit: mode === 'passage' });
      if (q) { q.si = si; q.heading = S.secs[si][0]; q.kind = mode === 'page' ? 'page' : 'prose'; return q; }
      continue;
    }
    const L = psuVerseAt(P, psgBelow(rng, P.total)); const u = psuVerseUnit(P, L, sizes) || psuVerseUnit(P, L, { min: Math.min(60, sizes.min), target: sizes.target, max: sizes.max });
    if (!u) continue;
    const text = psuVerseText(P, u.a, u.b); if (!psgVerseOk(psgClean(text)) || !psuGate(psgClean(text), { verse: true }).ok) continue;      // a list of names (the princes of the tribes, a genealogy) is not a passage to read
    return { si, heading: S.secs[si][0], text, p: P.v[u.a].p0, pe: Math.max(P.v[u.a].p0, P.v[u.b].p1), kind: 'verses', ia: u.a, ib: u.b, from: P.v[u.a].n, to: P.v[u.b].n, lead: P.v[0].pre };
  }
  return null;
}
/* the unit the secure draw landed on: { si, heading, text, p, pe, kind: 'verses' | 'prose' | 'page', from, to } or null */
function psgPickUnit(secs, meta, rng, opts = {}) {
  const mode = opts.mode === 'page' ? 'page' : 'passage'; const size = psuSizeOf(opts.size); const S = psgState(secs, meta); S.metaOf = meta; let u = null;      // size: how long a passage is asked to be (short | medium | longer); a page has one length
  if (psgIsVerseText(S)) u = psgPickVerse(S, rng, { mode, size });
  else {
    /* every pick is read once more (psuGate: noise, a running head, an editor's note, a list, a fragment) and a scanned book is also held to a stricter standard of clean text. A pick that does not pass is passed over and
       the stream goes on, so the same seed still gives the same passage. A book none of whose picks pass gives nothing among other books, but is still drawn when it was asked for by name (opts.lenient): then its best pick is given */
    let best = null; let bestScore = Infinity;
    for (let k = 0; k < 24 && !u; k++) {
      const p = pickPassage(secs, meta, rng, { target: mode === 'page' ? 1500 : PSU_PASSAGE[size].prose, unit: mode === 'passage' }); if (!p) break;
      p.text = psuStrip(p.text); const g = psuGate(p.text, { scan: S.scan }); const noise = S.scan ? psuNoise(p.text) : 0;
      if (g.ok && noise <= PSU_NOISE.scan) u = p; else { const sc = g.why.length + noise / PSU_NOISE.scan; if (sc < bestScore) { best = p; bestScore = sc; } }
    }
    if (!u && best && opts.lenient) u = best;
    if (u) u.kind = mode === 'page' ? 'page' : 'prose';
  }
  if (u) { u.nsec = secs.length; u.nums = psgNumbersOf(secs, meta, u); }
  return u;
}
/* the numbers a section prints before its paragraphs, where they run in order (1, 2, 3 …): then they are the text's own numbering of its verses or sayings, and a passage is cited by them ("Dhammapada, Chapter XXII, nos. 306–307").
   Any break in the run (a restart, a gap, a misread digit) and the section is cited by its name instead: a number is never taken from a section whose numbering cannot be trusted. */
const PSG_LEAD_NO = /^\s*(\d{1,4})[.)]\s+(?=[A-Za-z“"‘'(\[])/;
function psgNumbering(S, si) {
  if (!S.numbering) S.numbering = new Map(); if (S.numbering.has(si)) return S.numbering.get(si);
  const paras = String(S.secs[si][1]).split(/\n{2,}/); const nums = []; const at = new Map();
  paras.forEach((p, i) => { const m = PSG_LEAD_NO.exec(p); if (m) { nums.push(+m[1]); at.set(i, +m[1]); } });
  let ok = false;
  if (nums.length >= 6) { let adj = 0; let back = 0; for (let i = 1; i < nums.length; i++) { if (nums[i] === nums[i - 1] + 1) adj++; else if (nums[i] <= nums[i - 1]) back++; } ok = adj / (nums.length - 1) >= 0.85 && back === 0 && nums.length >= paras.length * 0.4; }
  const r = { ok, at }; S.numbering.set(si, r); return r;
}
function psgNumbersOf(secs, meta, u) {
  if (u.kind === 'verses') return ''; const S = psgState(secs, meta); const N = psgNumbering(S, u.si); if (!N.ok) return '';
  const near = (p) => { for (let k = p; k >= Math.max(0, p - 6); k--) if (N.at.has(k)) return N.at.get(k); return 0; };
  const a = near(u.p); const b = near(u.pe); return a ? psuNumbers(a, b >= a ? b : a) : '';
}
/* the verses (or paragraphs) after a passage, to read on: a longer passage, or null at the end of the chapter or section */
function psgReadOn(secs, meta, u) {
  const S = psgState(secs, meta); S.metaOf = meta;
  if (u.kind === 'verses') {
    const P = psgVerseP(S, u.si); if (!P || u.ib + 1 >= P.n) return null;
    const n = psuVerseUnit(P, u.ib + 1, Object.assign({}, PSU_SIZES.passage, { from: u.ib + 1 })) || psuVerseUnit(P, u.ib + 1, { min: 40, target: 300, max: 1100, from: u.ib + 1 });
    if (!n || n.a !== u.ib + 1) return null;
    return { ib: n.b, to: P.v[n.b].n, pe: Math.max(u.pe, P.v[n.b].p1), text: psuVerseText(P, u.ia, n.b) };
  }
  const sec = psgBuild(S, u.si); const items = sec.items; let x = 0; while (x < items.length && items[x].p <= u.pe) x++;
  while (x < items.length && sec.kind[x] !== 'p' && sec.kind[x] !== 'v') x++;
  if (x >= items.length || psgStartsLower(sec.blocks[x])) return null;
  let text = ''; let end = x; let len = 0;
  for (let y = x; y < items.length && len < 700; y++) { if (sec.kind[y] !== 'p' && sec.kind[y] !== 'v') break; const L = psgClean(sec.blocks[y]).length; if (y > x && len + L > 1300) break; text += (text ? '\n\n' : '') + sec.blocks[y]; len += L; end = y; if (len >= 350) break; }
  if (!text || !psgEndsClean(text) && !psgIsStanza(text)) return null;
  return { text: u.text + '\n\n' + psuStrip(text), pe: end + 1 < items.length ? Math.max(u.pe, items[end + 1].p - 1) : Math.max(u.pe, items[end].p) };
}
/* ═══ a page: the page of a book as it is printed ═══
   One page or two (opts.count), everything on them: an editor's note, a damaged line, a list, because that is what a page of the book holds. What may be left out is asked for: opts.front leaves out the front matter (the pages
   numbered in roman numerals, i, ii, iii, and in a text with no page numbers the sections that are a preface or an introduction), opts.back the glossaries, appendixes, indexes and the like (the sections psgMatterParts
   finds); opts.clean asks for the quality test of a passage (psuGate, without its demand to begin a sentence). A scanned text has its printed pages (opts.pgx, from 2z-pages-core.js, with opts.vols the volumes' names):
   every page that may be drawn is equally likely, and the reference is its printed number ("p. 214", "pp. 214–215"). A text with no printed pages here is cut into a window of about a page at paragraph edges, in a section
   that is not matter, and cited by its section. The pick is a fixed function of the stream, so a draw code replays it. Returns { si, heading, text, p, pe, kind: 'leaf', leaves, cite, first } or null. */
function psgPickLeaf(secs, meta, rng, opts = {}) {
  const count = opts.count === 2 ? 2 : 1; const z = count === 2 ? PSU_LEAF.two : PSU_LEAF.one; const S = psgState(secs, meta); S.metaOf = meta;
  const front = opts.front !== false; const back = opts.back !== false; const clean = !!opts.clean; const mp = S.parts || (S.parts = psgMatterParts(secs));
  const fits = (text) => { const v = psuVis(text); if (v.length < z.min || v.length > z.max) return false; if (!clean) return true; const c = psuVis(psuStrip(text)); const g = psuGate(c, { scan: S.scan, page: true }); return g.ok && (!S.scan || psuNoise(c) <= PSU_NOISE.scan); };
  const finish = (x, extra) => Object.assign({ si: x.s, heading: secs[x.s][0], text: psuStrip(x.text), p: x.p, pe: x.pe, kind: 'leaf', leaves: count, nsec: secs.length }, extra);
  const pgx = opts.pgx;
  if (pgx && pgx.flat && pgx.flat.length >= 4) {
    if (S.leafSrc !== pgx.flat) { S.leafSrc = pgx.flat; S.leaves = psuLeaves(pgx.flat); S.leafPool = new Map(); }
    const leaves = S.leaves; const key = `${front}|${back}|${count}`; let pool = S.leafPool.get(key);
    if (!pool) {
      pool = []; for (let k = 0; k < leaves.length; k++) { const L = leaves[k]; if (front && L.roman) continue; if (back && mp.back.has(L.s)) continue; if (count === 2) { const b = leaves[k + 1]; if (!b || !L.e || L.e.s !== b.s || L.e.p !== b.p || L.e.o !== b.o) continue; } pool.push(k); }
      S.leafPool.set(key, pool);
    }
    if (pool.length) for (let attempt = 0; attempt < 80; attempt++) {
      const k = pool[psgBelow(rng, pool.length)]; const x = psuLeafText(secs, leaves, k, count); if (!x || !fits(x.text)) continue;
      return finish(x, { cite: psuLeafCite(leaves[k].label, count === 2 ? leaves[k + 1].label : '', opts.vols), first: leaves[k].label });
    }
    if (!opts.lenient) return null;
  }
  for (let pass = 0; pass < 2; pass++) {
    const list = []; let tot = 0; secs.forEach((sec, i) => { if (pass === 0 && ((back && mp.back.has(i)) || (front && mp.front.has(i)))) return; const L = String(sec[1]).length; if (L < z.min) return; tot += L; list.push([i, tot]); });
    if (!list.length || (pass === 1 && !opts.lenient)) continue;
    for (let attempt = 0; attempt < 80; attempt++) {
      const r = psgBelow(rng, tot); let k = 0; while (k < list.length - 1 && list[k][1] <= r) k++; const si = list[k][0]; const paras = String(secs[si][1]).split(/\n{2,}/);
      const q = psgBelow(rng, Math.max(1, String(secs[si][1]).length)); let pi = 0; let acc = 0; for (; pi < paras.length - 1; pi++) { acc += paras[pi].length + 2; if (acc > q) break; }
      const w = psuParaWindow(paras, pi, z); if (!w || !fits(w.text)) continue;
      return finish({ s: si, text: w.text, p: w.p, pe: w.pe }, { cite: '', first: '', nopages: true });
    }
  }
  return null;
}
/* the printed pages of a text, made safe, with the volumes' names and the note on how far to trust them: null where the text has none (a typed text) or where this is not a page (a test, with no loader) */
async function psgLoadPages(id, secs) {
  try {
    const raw = await TXT.pages(id); if (!raw) return null; const pgx = pgmClean(raw.rows, secs.length); if (!pgx.flat.length) return null;
    return { pgx, vols: raw.vols > 1 ? Array.from({ length: raw.vols }, (_, v) => 'Vol. ' + (v + 1)) : [], note: pgmNote(raw.grade) };
  } catch (e) { return null; }
}
/* the Atlas catalogue's own name for a kind of text, for the books it links to a Library text and whose records agree (loaded when the Atlas data is; never waited for) */
let PSG_ATLAS = null;
function psgAtlasKinds() {
  if (PSG_ATLAS) return PSG_ATLAS;
  try {
    const A = typeof BEATLAB_ATLAS !== 'undefined' && BEATLAB_ATLAS.data; if (!A || !Array.isArray(A.texts) || !A.index) return null;
    const names = (A.index.codes || {}).text_category || {}; const by = {};
    for (const r of A.texts) { const ids = Array.isArray(r.libs) && r.libs.length ? r.libs : r.lib ? [r.lib] : []; for (const id of ids) (by[id] = by[id] || new Set()).add(r.category); }
    PSG_ATLAS = {}; for (const id of Object.keys(by)) if (by[id].size === 1) { const c = [...by[id]][0]; if (names[c]) PSG_ATLAS[id] = names[c]; }
  } catch (e) { PSG_ATLAS = null; }
  return PSG_ATLAS;
}
/* the reference of a unit, written: verses by book, chapter and verses; anything else by title, section and the printed page where there is one */
function psgRefOf(u, l, m, pages) {
  if (u.kind === 'verses') {
    const r = psuRefVerses({ title: l.title, heading: u.heading, from: u.from, to: u.to, tag: u.id === 'p-lxx' ? 'Septuagint numbering' : '' });
    r.sub = [psuShortTitle(l.title), psuShortTitle(m && m.by ? m.by : '')].filter((x, i, a) => x && a.indexOf(x) === i && x !== r.book).join(' · '); r.pages = ''; return r;
  }
  const r = psuRefProse({ title: l.title, heading: u.heading, pages, nums: u.nums || '', section: u.si + 1, sections: u.nsec || 0 }); r.pages = pages || ''; return r;
}
/* the printed page(s) of a passage, from the sidecar of a scanned text (2z-pages-core.js): "p. 214", "pp. 214–215", "Vol. 2, p. 33", or '' where the text has none (a typed text, a Bible) */
async function psgPagesOf(id, u, secs) {
  try {
    if (u.kind === 'verses' || u.kind === 'leaf') return { pages: '', note: '' };
    const raw = await TXT.pages(id); if (!raw) return { pages: '', note: '' };
    const pgx = pgmClean(raw.rows, secs.length); if (!pgx.flat.length) return { pages: '', note: '' };
    const vols = raw.vols > 1 ? Array.from({ length: raw.vols }, (_, v) => 'Vol. ' + (v + 1)) : []; const paras = String(secs[u.si][1]).split(/\n{2,}/); const vis = (t) => String(t == null ? '' : t).replace(/\[\[\d+\]\]/g, '');
    const first = psgVisible(u.text).slice(0, 40); const last = psgVisible(u.text).slice(-30);
    const i0 = vis(paras[u.p]).indexOf(first); const i1 = vis(paras[u.pe]).lastIndexOf(last);
    const a = pgmAt(pgx.flat, u.si, u.p, i0 > 0 ? i0 : 0); const b = pgmAt(pgx.flat, u.si, u.pe, i1 >= 0 ? i1 + last.length : 0);
    const pa = pgmParse(a); const pb = pgmParse(b); if (!pa) return { pages: '', note: '' };
    let pages = pgmShort(a, vols); if (pb && pb.num !== pa.num && pb.vol === pa.vol) pages = (pa.vol ? (vols[pa.vol - 1] || 'Vol. ' + pa.vol) + ', ' : '') + 'pp. ' + pa.num + '–' + pb.num;
    return { pages, note: pgmNote(raw.grade) };
  } catch (e) { return { pages: '', note: '' }; }
}
/* the line under a passage: what kind of text it is where the Library or the Atlas says so (the shelf and the date are in the line under the reference, psgFromOf) */
function psgContextOf(l, u, gname, atlasKind) {
  return psuContext({ genre: psuKind(l.id, u.lead) || atlasKind || '' });
}
/* the line under the reference, the same for every card: "From the <shelf> shelf, <date>." as the Library catalogue holds them */
const psgWhenOf = (l) => { let i = typeof LIB !== 'undefined' ? LIB.indexOf(l) : -1; if (i < 0) return l.when; while (i > 0 && /^same$/i.test(LIB[i].when)) i--; return LIB[i].when; };      // "same" in the catalogue is the date of the entry before it
const psgFromOf = (l, gname) => psuFrom({ shelf: gname[l.group] || '' });      // the shelf only: the date is in the context row under the reference (psgWhoOf), the same date, said once

/* ═══ the context row (19 November 2026) ═══
   The maker, landing on the Laws of Manu: "theres no intuitive way to see what religion and practice that is from." Directly under the reference the card now says, from what the app already holds and in the same
   template for every card: the religion the Atlas ties the book to (a chip that opens its page in the Atlas, and a small action that draws more from it), what kind of text it is, its period, the Library's edition
   credit, one plain sentence about the book (the first sentence of the catalogue's note), and the way to the Library's source card. A field the app does not know is left out; nothing is guessed.
   Where each comes from: the religion, from the Atlas (PSF_LINKS in 2z-passage-index.js, tools/passage_index.js), else the religion of the Library shelf where that shelf holds one (PSF_SHELF_TRAD), else the family
   of the shelf (PSF_SHELF_FAMILY), else none; the kind, from PSU_KIND for the Bible books, else from the Atlas category, the shelf and the title (the facts of the filters, ks); the period and the edition, from the
   catalogue's `when` and `by`; the sentence, from the catalogue's `note`. None of it is a verdict, and none says how the passage should be read. */
const PSG_KIND_ORDER = ['law', 'myth', 'hym', 'his', 'wis', 'rit', 'phi', 'mov', 'scr', 'out', 'aid'];      // the more particular kind first: "scripture or canon" is the widest word, and a movement's own book is said as that
const PSG_KIND_WORDS = { law: 'a law code', myth: 'myths, epics or folk tales', hym: 'a collection of hymns or poems', his: 'a sacred history, chronicle or life story', wis: 'a book of wisdom and sayings', rit: 'a book of prayers and rites', phi: 'philosophy, mysticism or commentary', mov: 'a book of a modern religious movement', scr: 'scripture or canon', out: 'a record by an outside observer', aid: 'a study aid: a book about religion' };      // each says what the filter of that kind holds (PSF_KINDS): the Atlas's own category, the Bible's genres, what the shelf holds
function psgKindWords(id, ks, lead) {
  const b = typeof psuKind === 'function' ? psuKind(id, lead) : ''; if (b) return b;      // the Bible books: "a gospel", "a psalm; its heading names David"
  const k = PSG_KIND_ORDER.find((x) => Array.isArray(ks) && ks.includes(x)); return k ? PSG_KIND_WORDS[k] : '';
}
/* the catalogue's date in plain words: "c. 2nd c. BCE – 3rd c. CE" → "about 2nd c. BCE to 3rd c. CE"; the words are the Library's, only "c." and the dash are said out */
const psgPeriodOf = (when) => { const s = String(when == null ? '' : when).replace(/\s+/g, ' ').trim(); if (!s || /^same$/i.test(s)) return ''; return s.replace(/^c\.\s*/i, 'about ').replace(/(\d(?:st|nd|rd|th|s)?|BCE|CE|BC|AD)\s*[–—-]\s*(?=\d)/g, '$1 to ').replace(/\s[–—]\s/g, ' to '); };
/* the Library's edition credit (its `by`, which the source card calls "Edition") as who and when: the names it opens with, and the first year in it; "Translated by" only where the credit itself says so
   ("(translator)", "translated by X"), "Edited by" for "(ed.)", otherwise the Library's own word, "Edition:" */
function psgEditionOf(by, title) {
  const s = String(by == null ? '' : by).replace(/\s+/g, ' ').trim(); if (!s) return null;
  let depth = 0; let cut = s.length; for (let i = 0; i < s.length; i++) { const c = s[i]; if (c === '(') depth++; else if (c === ')') depth = Math.max(0, depth - 1); else if ((c === ',' || c === ';') && depth === 0) { cut = i; break; } }
  let head = s.slice(0, cut).trim(); let role = 'Edition:'; const p = head.indexOf(' ('); let paren = ''; if (p > 0) { paren = head.slice(p + 2); head = head.slice(0, p).trim(); }
  const rl = /^([^()]*)\)/.exec(paren); const r = rl ? rl[1].toLowerCase().trim() : '';
  if (/^(?:translators?|trans\.?)$/.test(r)) role = 'Translated by'; else if (/^(?:eds?\.?|editors?)$/.test(r)) role = 'Edited by';
  let who = head;
  if (role === 'Edition:') { const tm = /\btranslat(?:ed|ion)(?: from [A-Za-z’' -]{3,40}?)? by ((?:[A-Z][\wÀ-ž.’'-]*\.?)(?: (?:[A-Z][\wÀ-ž.’'-]*\.?|and|de|von|van|der|bin|ibn)){0,5})(?=[,;(.]| \(|$)/.exec(s); if (tm) { role = 'Translated by'; who = tm[1].trim(); } }
  if (who.length > 64) who = who.slice(0, 64).replace(/\s+\S*$/, '') + '…';
  if (role === 'Edition:' && who && psuShortTitle(title).toLowerCase().includes(who.toLowerCase())) who = '';      // the credit opens with the book's own title (a name in the title's brackets is a name): no names to give
  const ym = /\b(1[4-9]\d\d|20[0-2]\d)\b/.exec(s); const year = ym ? ym[1] : '';
  if (!who && !year) return null;
  return { role, who, year, text: who ? `${role} ${who}${year ? ', ' + year : ''}` : `Edition: ${year}`, title: s };
}
/* one plain sentence about the book: the first sentence of the catalogue's note that is about the book (not about how its text was made), cut at a colon or a semicolon outside brackets when it is long */
const PSG_TECH = /^(?:Text from a scan|Typed text|Machine|Read by machine|This is a typed|A typed|Text typed|The text is|Scanned|From a scan)/i;
function psgAboutLine(note, max) {
  const lim = max || 170; const s = String(note == null ? '' : note).replace(/\s+/g, ' ').trim(); if (!s) return '';
  const sentences = []; let rest = s; const re = /([a-z0-9)”’\]]{2}[.!?])\s+(?=[A-Z“‘"(])/;
  while (rest) { const m = re.exec(rest); if (!m) { sentences.push(rest); break; } const cut = m.index + m[1].length; sentences.push(rest.slice(0, cut)); rest = rest.slice(cut).trim(); }
  const first = sentences.find((x) => !PSG_TECH.test(x)) || ''; if (!first) return '';
  if (first.length <= lim) return first;
  const open = (str) => { let d = 0; for (const c of str) { if (c === '(') d++; else if (c === ')') d = Math.max(0, d - 1); } return d; };      // inside a bracket?
  for (const c of [':', ';', ' — ', ' – ']) { for (let k = first.indexOf(c, 40); k > 0 && k <= lim; k = first.indexOf(c, k + 1)) if (!open(first.slice(0, k))) return first.slice(0, k).replace(/[,;:\s]+$/, '') + '.'; }
  for (let k = first.lastIndexOf(', ', lim); k >= 60; k = first.lastIndexOf(', ', k - 1)) if (!open(first.slice(0, k))) return first.slice(0, k).replace(/[,;:\s]+$/, '') + '…';
  let t = first.slice(0, lim).replace(/\s+\S*$/, ''); const k = t.lastIndexOf('('); if (open(t) && k > 20) t = t.slice(0, k).trim(); return t.replace(/[,;:\s]+$/, '') + '…';
}
/* the religions of a book, first the one it is shown under: what the Atlas ties it to (the religion of its shelf first, then the wider religions before their branches, then by name), else what its shelf holds,
   else the family of its shelf. Each as a unit { sel, kind: 'atlas' | 'shelf' | 'family', root, rootName, id, name, href } */
function psgTies(id, group) { return relTies(id, group); }      /* the rule itself is relTies in 2z-related-core.js (one copy, so this card and the related strip cannot disagree: tests/related.test.js pins that they agree on every text of the Library) */
/* a dialog that belongs to this page closes with it (FINAL_AUDIT.md L-04): when the address changes (a link, a typed address, the browser's Back), the dialog is closed, its listeners are taken off, and nothing is left on top of the next page.
   dlg: the dialog (its close(v) and isConnected); done: the promise modal() returned (settled when it closes by any route); win: the window (any object with add/removeEventListener). Returns the function that takes the listeners off. */
function psgCloseOnRoute(dlg, done, win) {
  if (!dlg || typeof dlg.close !== 'function' || !win || typeof win.addEventListener !== 'function') return () => {};
  const names = ['hashchange', 'popstate']; let onRoute = null;
  const off = () => { names.forEach((n) => { try { win.removeEventListener(n, onRoute); } catch (e) { /* a window without it */ } }); };
  onRoute = () => { off(); if (dlg.isConnected !== false) dlg.close(true); };
  names.forEach((n) => win.addEventListener(n, onRoute));
  if (done && typeof done.then === 'function') done.then(off, off);
  return off;
}
/* everything the row says about one book: o = { id, title, group, ks, lead, when, by, note } */
function psgWhoOf(o) {
  const units = psgTies(o.id, o.group); let ed = psgEditionOf(o.by, o.title); const about = psgAboutLine(o.note); const period = psgPeriodOf(o.when);
  if (ed && !ed.who && ed.year && period.includes(ed.year)) ed = null;      // a year alone that the period already says is not said twice
  else if (ed && ed.who && ed.year && period === ed.year) ed = Object.assign({}, ed, { year: '', text: `${ed.role} ${ed.who}` });      // nor a year that is the whole of the period, beside the names
  const tie = units.length ? units[0].kind : '';      /* where the religion row comes from (FINAL_AUDIT.md FA-04): 'atlas' = the records tie the book to it; 'shelf' = only the religion of its Library shelf; 'family' = only the family of its shelf. A shelf or a family is a method, not a claim about the book, so the row says which it is */
  return { units, tie, tieLabel: PSG_TIE_LABEL[tie] || '', kind: psgKindWords(o.id, o.ks, o.lead), period, edition: ed, about, religionHref: units.length && units[0].kind !== 'family' ? units[0].rootHref : '' };
}
const PSG_TIE_LABEL = { shelf: 'From its shelf:', family: 'The religions this text is filed with:' };      /* the words a religion row carries when its chip is not from the records (nothing when the records tie the book to it); the reader's row says the same (6k-reader.js, rdWhoHTML) */
const PSG_FROM_TITLE = { atlas: 'the map data ties this book to it', shelf: 'the Library shelf this book stands on holds this religion’s books (the map data ties the book to none)', family: 'the family of the Library shelf this book stands on (the map data ties the book to no one religion)' };      /* the key `atlas` is the unit's kind (an id, kept); the words are the label SA-09 asked for */
function psgWhoHTML(w) {
  const e = esc; const one = (u) => {
    if (u.kind === 'family') return `<a class="chip psgx-rc psgx-fam" href="${e(u.href)}" title="${e('The religions of this family: ' + PSG_FROM_TITLE.family)}">${e(u.name)}</a>`;
    const t = (id, name, href) => `<a class="chip psgx-rc${u.kind === 'shelf' ? ' psgx-fam' : ''}" href="${e(href)}" title="${e(name + ': its tradition page (' + PSG_FROM_TITLE[u.kind] + ')')}">${e(name)}</a>`;
    return u.branch ? `${t(u.root, u.rootName, u.rootHref)}<span class="psgx-ar" aria-hidden="true">›</span>${t(u.id, u.name, u.href)}` : t(u.id, u.name, u.href);
  };
  const chips = []; const u0 = w.units[0];
  if (u0) {
    const more = w.units.slice(1);
    chips.push(`<span class="psgx-rel">${w.tieLabel ? `<span class="small muted psgx-src">${e(w.tieLabel)}</span>` : ''}${one(u0)}<button type="button" class="chip psgx-draw" data-psg="relmore" data-sel="${e(u0.sel)}" aria-label="${e('Draw more from ' + u0.rootName)}" title="${e('Add ' + u0.rootName + ' to the filters and draw another')}">+ Draw more</button>${more.length ? `<button type="button" class="chip psgx-n" data-psg="rels" aria-expanded="false" aria-controls="psRelMore" title="${e('Also: ' + more.map((x) => x.name).join(', '))}">+${more.length}</button><span class="psgx-relmore" id="psRelMore" hidden>${more.map(one).join('')}</span>` : ''}</span>`);
  }
  const facts = [];      // what the book is, when, and whose edition: plain words after the chips, so on a phone the row is the chips and these two lines of text
  if (w.kind) facts.push(`<span class="psgx-kind">${e(w.kind)}</span>`);
  if (w.period) facts.push(`<span class="psgx-when">${e(w.period)}</span>`);
  if (w.edition) facts.push(`<span class="psgx-ed" title="${e(w.edition.title)}">${e(w.edition.text)}</span>`);
  if (facts.length) chips.push(`<span class="psgx-facts">${facts.join('<span class="psgx-dot" aria-hidden="true"> · </span>')}</span>`);
  return `<div class="psgx-who" id="psWho" role="group" aria-label="About this text">${chips.length ? `<div class="psgx-chips">${chips.join('')}</div>` : ''}<p class="psgx-ab" id="psAbout">${w.about ? e(w.about) + ' ' : ''}<button type="button" class="linkbtn" data-psg="about">About this text</button>${w.religionHref ? ` · <a href="${e(w.religionHref)}">About this religion</a>` : ''}</p></div>`;
}
/* ═══ where a draw comes from ═══
   Two pools. "Scriptures and sources" (the default) is the Library's scriptures, primary sources and the modern movements' own books. It leaves out the shelves "Scriptures and sources only" under Leave areas out
   names (study aids, field records, folklore and folk tales, the occult and Masonic shelves, the imagined shelf) and the annotated editions whose introductions and notes are mixed into the text with nothing to tell
   them apart (2z-passage-pool.js, made by tools/passage_pool.js). "Everything" is every readable text except the areas the reader has left out. A shelf, a tradition, chosen areas or one book draw from all of
   what is on them. No pool draws the app's own example book or a PDF, which has no text to draw (BOOKS.noDraw, 6zq-books.js). */
const psgNever = (id) => typeof BOOKS !== 'undefined' && !!BOOKS && typeof BOOKS.noDraw === 'function' && BOOKS.noDraw(id);
const psgScan = (m) => !!m && /scan|OCR/i.test(`${m.note || ''} ${m.license || ''}`);
const psgInSources = (l, shelfOnly, meta) => !!l && !(shelfOnly || []).includes(l.group) && !psgScan(meta && meta[l.id]) && !PSU_ANNOTATED.has(l.id) && !PSU_ABOUT.has(l.id) && !Object.prototype.hasOwnProperty.call(PSU_READ_OUT, l.id);
/* the books a scope draws from: scope 'sources' (typed books on the shelves of scriptures and sources: for clean passages), 'pages' (the same shelves with their machine-read scans, because a page is shown as it is printed) or 'all'. o.shelfOnly: the groups of the wider shelves (LIB_SHELF_ONLY); o.meta: the catalogue of the texts (a machine-read scan is not in 'sources'); o.skip(l): books to leave out (the areas left out, the books never drawn) */
function psgPoolOf(list, scope, o) { const x = o || {}; return list.filter((l) => !(x.skip && x.skip(l)) && (scope === 'sources' ? psgInSources(l, x.shelfOnly, x.meta) : scope === 'pages' ? !(x.shelfOnly || []).includes(l.group) : true)); }
/* ═══ what to draw from: the facts of every readable book, and the filters over them (2z-passage-filter-core.js, the choices of 6d2-passage-filters.js) ═══
   Made once for a catalogue and kept: which shelf and collection a book is on, whether it is in "Scriptures and sources" (for a passage, and for a page), the years its catalogue date gives, the religions the Atlas ties it to,
   and its kinds. The old Journey traditions (?t=) are the books at their stations. */
let PSG_FACTS = null;
const psgLegacyBooks = (x) => { const t = TRAD_BY_ID[x]; return t ? new Set(tradTexts(t).map((l) => l.id)) : null; };
const psgFilterOpts = (mode) => ({ mode: mode === 'page' || mode === 'pages' ? mode : 'passage', leftOut: libLeftOut(), legacy: psgLegacyBooks });
function psgFacts(meta) {
  const nm = Object.keys(meta).length; if (PSG_FACTS && PSG_FACTS.meta === meta && PSG_FACTS.n === LIB.length && PSG_FACTS.c === LIB_COLLECTIONS.length && PSG_FACTS.nm === nm) return PSG_FACTS;      // made again when a book is added to the Library or the catalogue
  const collOf = (g) => LIB_COLLECTIONS.findIndex((c) => c[2].includes(g)); const idx = { PSF_GROUPS, PSF_FAMILIES, PSF_TRADS, PSF_LINKS, PSF_CATS, PSF_YEARS };
  const list = psfFacts(LIB, { readable: (l) => !!meta[l.id] && !psgNever(l.id), coll: collOf, src: (l) => psgInSources(l, LIB_SHELF_ONLY, meta), pg: (l) => !LIB_SHELF_ONLY.includes(l.group), idx, kinds: PSU_KIND, shelfBelief: SHELF_BELIEF });
  const by = Object.fromEntries(list.map((f) => [f.id, f])); const held = psfHeld(list); const tree = psfTree(idx, held); const flat = psxFlat(tree);
  const ctx = { books: Object.fromEntries(list.map((f) => [f.id, true])), nColl: LIB_COLLECTIONS.length, collNames: LIB_COLLECTIONS.map((c) => c[0]), groups: Object.fromEntries(PSF_GROUPS.map((g) => [g[0], true])), fams: PSF_FAMILIES, trads: PSF_TRADS, legacy: Object.fromEntries(TRADITIONS.map((t) => [t.id, true])) };
  PSG_FACTS = { meta, nm, n: LIB.length, c: LIB_COLLECTIONS.length, list, by, ctx, held, tree, flat, nodeBySel: Object.fromEntries(flat.map((x) => [x.n.sel, x.n])),
    nUndated: list.filter((f) => f.y0 == null).length, nTied: list.filter((f) => ![...f.rs].some((v) => v[0] !== 'b')).length, nNoKind: list.filter((f) => !f.ks.length).length };
  return PSG_FACTS;
}
/* an address that names the passage (#/path/passage?code=…) and what it was drawn from, so Back from the reader, a reload or a friend shows it again: replaced in place, so no history entry is made for each draw. Without a code (nothing is drawn yet) it carries only the choices. */
function psgSetHash(code, more) {
  try { if (typeof history !== 'undefined' && history.replaceState && typeof location !== 'undefined' && /^#\/path\/passage/.test(location.hash || '')) { const q = ((code ? 'code=' + encodeURIComponent(code) : '') + (more || '')).replace(/^&/, ''); history.replaceState(null, '', '#/path/passage' + (q ? '?' + q : '')); } } catch (e) { /* the address stays as it is */ }
}
/* what this browsing session has shown, kept while the app stays open: the draws (for Previous and for the Recent row) and the units seen (so a draw is not a repeat) */
const PSG_SESSION = { hist: [], at: -1, seen: [] };
const psgKey = (u) => ({ id: u.id, si: u.si, from: u.kind === 'verses' ? u.from : u.p, to: u.kind === 'verses' ? u.to : u.pe });

const PSG_SRC = { secure: 'Secure random', timing: 'Secure random + my timing' };
const psgNewSeed = (src) => randSeed(src === 'timing' && RANDT.count > 0 ? RANDT.digest() : '');      // no beats yet: the secure bytes alone, so a draw never waits for anyone to press a key
/* how a draw is made. The timing draw (the times of the person's own key presses, taps and pointer moves, mixed in with 32 fresh secure bytes) is the default: the maker, 18 Nov 2026, "honestly should be the default
   method". It was a choice kept in storage, and the default was the secure source alone, so the choice is reset to the timing draw ONCE (passage.srcv says it was); after that a choice of the person's own is kept. */
const PSG_SRC_V = 1;
function psgSrcPref() {
  if ((+store.get('passage.srcv', 0) || 0) < PSG_SRC_V) { store.set('passage.src', 'timing'); store.set('passage.srcv', PSG_SRC_V); }
  return store.get('passage.src', 'timing') === 'secure' ? 'secure' : 'timing';
}
/* the shelf, then the book on it: every shelf of the Library equally likely, then every book on that shelf, so the sixty-six Bible books do not crowd out the rest */
function psgChooseBook(list, rng) {
  const groups = [...new Set(list.map((l) => l.group))]; if (!groups.length) return null;
  const gi = psgBelow(rng, groups.length); const bs = list.filter((l) => l.group === groups[gi]); const bi = psgBelow(rng, bs.length);
  return { id: bs[bi].id, g: gi + 1, gn: groups.length, b: bi + 1, bn: bs.length };
}
/* a draw code names the book, what was drawn and the seed: "b-psa.passage.9f3a1c22-…" (a passage), "b-gen.long.9f3a1c22-…" (a page); the four old lengths still replay */
const psgCode = (id, len, seed) => `${id}.${len}.${randCode(seed)}`;
function psgParseCode(str) {
  const m = /^\s*([A-Za-z0-9_-]+)\.([a-z]+(?:-[a-z]+)?)\.([0-9a-fA-F-\s]{32,48})\s*$/.exec(String(str)); const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k); if (!m || !(own(PSG_LEN, m[2]) || psgPSize(m[2]) || own(PSG_LEAF, m[2]))) return null;      // a word like "constructor" is not a length
  const seed = randCodeSeed(m[3]); return randSeedOk(seed) ? { id: m[1], len: m[2], seed } : null;
}
/* a random place for the reader: a random book (every shelf equally likely), then a printed page of it (front matter, glossaries and appendixes left out: the same page as the Random tab's One page). Returns { id, si, p, pe, seed } or null. */
async function psgRandomPlace(opts = {}) {
  const meta = await TXT.index(); if (!meta) return null;
  const readable = LIB.filter((l) => meta[l.id] && (!opts.within || opts.within.has(l.id)));
  const src = psgSrcPref(); const seed = psgNewSeed(src);
  for (let tries = 0; tries < 12; tries++) {
    const ch = opts.book && meta[opts.book] ? { id: opts.book } : psgChooseBook(readable, randStream(seed + ':book:' + tries)); if (!ch) return null;
    const t = await TXT.load(ch.id); const pg = t ? await psgLoadPages(ch.id, t.secs) : null; const p = t ? psgPickLeaf(t.secs, t.meta, randStream(seed), { count: 1, front: true, back: true, pgx: pg && pg.pgx, vols: pg && pg.vols, lenient: !!opts.book }) : null;
    if (p) return { id: ch.id, si: p.si, p: p.p, pe: p.pe, heading: p.heading, seed, book: ch };
    if (opts.book) return null;
  }
  return null;
}

/* #/path/read-random: choose a random page, then open the reader at it (replacing this address, so Back does not draw again) */
async function pathReadRandomView(root, query) {
  const body = root.querySelector('#pbody');
  body.innerHTML = '<p class="t2 small">Turning to a random page…</p>';
  try {
    const meta0 = (await TXT.index()) || {};      // the catalogue first: the default pool leaves out machine-read scans, which only it can say
    const FX = psgFacts(meta0); let fs0 = psfParse(query, FX.ctx);
    const svf = typeof query.f === 'string' && query.f ? psvFind(psvClean(store.get(PSV_KEY, null), FX.ctx), query.f) : null; if (svf) fs0 = svf.parts[psvPick(svf.parts, randStream(randSeed() + ':part'))].s;      // a saved filter of this browser: one of its parts, by weight      // the same filters as the Random tab (the address names them: pool, r, p, dated, b, k, a, t, and the old s)
    const within = new Set(psfPool(FX.list, fs0, psgFilterOpts('page')).map((f) => f.id));          // a printed page is shown as printed: the shelves of scriptures and sources with their scans, or with pool=all every area except the ones left out
    const place = await psgRandomPlace({ book: fs0.b.length === 1 ? fs0.b[0] : '', within });
    if (root.isConnected === false) return;
    if (!place) { body.innerHTML = `<section class="card"><div class="callout warn">${icon('warn')}<div>${loadFailText('No page could be drawn. The <b>texts</b> folder must sit next to Lamplighter.html.')} <a href="#/path/library">Back to the library</a></div></div></section>`; return; }
    const q = new URLSearchParams({ s: place.si, p: place.p, e: place.pe, r: '1', d: place.seed });
    location.replace('#/path/read/' + place.id + '?' + q);
  } catch (e) { body.innerHTML = `<section class="card"><p class="t2">${esc(e.message)}</p></section>`; }
}

/* ═══ Random: the page ═══
   One calm card. The switch says what is drawn (a passage with its reference, or a page of a book), one control says where from, and every click of Another shows one thing worth reading: its reference
   in large type, the words, one plain line of where it sits in the Library, and a few quiet actions. What was shown is kept for the session (Previous, Recent), and nothing is shown twice. */
/* How far the page must move so that what the person was looking at stays on the screen when the card changes (19 November 2026: the page used to go to the top; see holdView). Pure: the numbers are the rectangles of the card
   (r0 before the change, r1 after), the top of the controls (c0, c1) or of the block under the card that was on the screen (a = { before, after }), all as the browser measures them, from the top of the screen. mode is
   'controls' (the person acted in the controls: their top edge is held), 'below' (the person was below the card: that block is held) or 'card' (the card's top edge is held; a NEW card whose old top edge was above the screen,
   because the person had scrolled into it, starts at the top of the screen, `gap` below it, and never above it). same: the card is the same one, made longer or drawn again (Read on, word help): held exactly.
   Positive = scroll down. Anything that is not a number counts as no change. */
function psgHoldDelta(o) {
  const n = (x) => (typeof x === 'number' && isFinite(x) ? x : 0); const gap = o.gap == null ? 12 : n(o.gap); const r0 = o.r0 || {}; const r1 = o.r1 || {};
  if (o.mode === 'controls') return n(o.c1) - n(o.c0);
  if (o.mode === 'below') return o.a ? n(o.a.after) - n(o.a.before) : n(r1.bottom) - n(r0.bottom);
  if (n(r0.top) < 0 && !o.same) return n(r1.top) < 0 ? n(r1.top) - gap : 0;
  return n(r1.top) - n(r0.top);
}
const PSG_SCAN_NOTE = 'Machine-read from a scan: some words may be wrong.'; const PSG_SCAN_LINK = 'Check the page scan.';
const PSG_HINT = {
  passage: 'A few verses, or a paragraph under its heading: a piece that makes sense on its own, with its exact reference. Front and back matter, editors’ notes, lists and damaged text are left out.',
  page: 'A page of a book as it is printed, everything on it, with its printed number where the book has one. Tick above what a page may be.',
  pages: 'Two pages of a book, one after the other, as they are printed, with their printed numbers where the book has them. Tick above what a page may be.',
};
async function pathPassageView(root, query) {
  const body = root.querySelector('#pbody');
  body.innerHTML = '<p class="t2 small">Opening the library…</p>';
  const meta = await TXT.index();
  if (!meta) { body.innerHTML = `<section class="card"><div class="callout warn">${icon('warn')}<div>${loadFailText('The <b>texts</b> folder was not found next to Lamplighter.html, so there is nothing to draw a passage from yet. Keep the two together and reload.')}</div></div></section>`; return; }
  const SS = PSG_SESSION; const gname = Object.fromEntries(LIB_GROUPS);
  const FX = psgFacts(meta); const facts = FX.list; const fctx = FX.ctx;
  const collOf = (g) => LIB_COLLECTIONS.findIndex((c) => c[2].includes(g));
  const readable = LIB.filter((l) => meta[l.id] && !psgNever(l.id));
  const allAreas = LIB_COLLECTIONS.map((c, i) => [i, c, readable.filter((l) => collOf(l.group) === i).length]);
  const prefs = store.get('passage.prefs', {});
  const pfq = typeof query.pf === 'string' ? query.pf : null;      // what a page may be, kept in the address with the draw code (f front matter left out, b glossaries and appendixes left out, c clean text only; - none)
  const st = { mode: query.m === 'page' || query.m === 'pages' || query.m === 'passage' ? query.m : prefs.mode === 'page' || prefs.mode === 'pages' ? prefs.mode : 'passage', front: pfq != null ? pfq.includes('f') : prefs.front !== false, back: pfq != null ? pfq.includes('b') : prefs.back !== false, clean: pfq != null ? pfq.includes('c') : prefs.clean === true, src: psgSrcPref(), size: psgSizeAsked(query.len, prefs.len) };
  /* what to draw from: an address wins (the old ones too: a book, a tradition, a shelf, areas, a pool), then what was chosen last time, then what an earlier version kept, then the Scriptures and sources */
  let fst = psfBlank();
  if (psfTouched(query)) fst = psfParse(query, fctx); else { const kept = store.get('passage.filters', null); fst = kept && typeof kept === 'object' ? psfLoad(kept, fctx) : psfFromOld(store.get('passage.scope', null), store.get('passage.areas', []), fctx); }
  let mtab = 'chance'; let mdie = 6; let mlast = null;      // the Method section: the way shown (chance, text, date, dice, today), the die, the last dice (nothing about them is kept)
  let cur = null; let busy = false; let again = false; let againOpt = null; let soon = 0; let C = null; let ALT = null; let presetN = {}; let JN = [];
  /* "This book only": after Another from this book, every draw comes from that one book until the person lets go. It is not one of the filters: it is never kept with them, never added to a saved filter, and the address carries it (?only=) so Back from the reader brings it back */
  let only = typeof query.only === 'string' && LIB_BY_ID[query.only] && meta[query.only] && !psgNever(query.only) ? query.only : '';
  /* saved filters (2z-passage-saved-core.js): the person's own, kept in storage as one value; svAct is the one in use (its id), svShown the part whose choices the sections show, svName the name the form offers. While the sections still show that part a draw comes from the saved filter (all its parts, by weight); once they are changed a draw comes from the sections, and the bar says so */
  let SV = psvClean(store.get(PSV_KEY, null), fctx); let svAct = ''; let svShown = 0; let svMsg = ''; let svName = ''; let svForm = '';
  const saveSV = () => store.set(PSV_KEY, SV); const svOf = (id) => SV.items.find((g) => g.id === (id === undefined ? svAct : id)) || null;
  const asked = typeof query.f === 'string' ? psvName(query.f) : ''; const fromAddress = asked ? psvFind(SV, asked) : null;
  if (asked && !fromAddress) svMsg = `No saved filter named “${asked}” on this device. Saved filters are kept in the browser that made them.`;
  const startSV = fromAddress || (!psfTouched(query) && SV.last ? svOf(SV.last) : null);      /* an address names one (?f=), or the one used last time is still the one in use */
  if (startSV) { svAct = startSV.id; svName = startSV.name; fst = psfNorm(startSV.parts[0].s, fctx); st.mode = startSV.mode; st.front = startSV.pf.front; st.back = startSV.pf.back; st.clean = startSV.pf.clean; if (fromAddress) { SV = psvSetLast(SV, svAct); saveSV(); } }
  const fopts = () => psgFilterOpts(st.mode);
  const poolList = () => psfPool(facts, fst, fopts());
  const names = {
    rel: (sel) => { const m = /^([tfgb]):(.*)$/.exec(sel); if (!m) return sel; return m[1] === 't' ? (PSF_TRADS[m[2]] || [m[2]])[0] : m[1] === 'f' ? PSF_FAMILIES[m[2]] || m[2] : m[1] === 'g' ? (PSF_GROUPS.find((g) => g[0] === m[2]) || [0, m[2]])[1] : beliefName(m[2]); },
    book: (id) => (LIB_BY_ID[id] ? psuShortTitle(LIB_BY_ID[id].title) : id), shelf: (i) => (LIB_COLLECTIONS[i] ? LIB_COLLECTIONS[i][0] : String(i)), legacy: (x) => (TRAD_BY_ID[x] ? 'From the Journey: ' + TRAD_BY_ID[x].short : x), defaultLo: new Set(leftOutSet(null, LIB_COLLECTIONS, LIB_IMAGINED_GROUPS)),
  };
  const baseTipOf = () => (st.mode === 'passage' ? 'Scriptures and sources: the Library’s scriptures and primary sources, in the clean typed editions (study aids, field records, folklore, machine-read scans and annotated editions are left out). Press it to draw from everything.' : 'Scriptures and sources: the shelves of scriptures and primary sources, with their machine-read scans, because a page is shown as it is printed (study aids, field records, folklore and the occult and Masonic shelves are left out). Press it to draw from everything.');
  const recount = () => {
    C = psfCounts(facts, fst, fopts()); ALT = fst.base === 'sources' ? psfCounts(facts, Object.assign({}, fst, { base: 'all' }), fopts()) : null; presetN = Object.fromEntries(PSF_PRESETS.map(([id]) => [id, psfPool(facts, psfPreset(id, fctx), fopts()).length]));
    /* the Journey's own nineteen traditions, one at a time (the first release's "One tradition"): each with the books it would give with the other choices kept */
    JN = TRADITIONS.map((t) => ({ id: t.id, name: t.short || t.name, n: psfPool(facts, Object.assign({}, fst, { x: t.id }), fopts()).length, alt: fst.base === 'sources' ? psfPool(facts, Object.assign({}, fst, { x: t.id, base: 'all' }), fopts()).length : 0, on: fst.x === t.id, title: `${t.name}: the books on its stations in the Journey` }));
  };
  const svDirty = () => { const f = svOf(); return !!f && !psfEqual(fst, f.parts[Math.min(svShown, f.parts.length - 1)].s); };
  const svMixing = () => { const f = svOf(); return !!f && f.parts.length > 1 && !svDirty(); };
  const svPlan = () => { const f = svOf(); return f ? psvPlan(f, facts, Object.assign({}, fopts(), { names })) : null; };
  const svMixTotal = () => { const f = svOf(); if (!f || f.parts.length < 2) return 0; const ids = new Set(); f.parts.forEach((q) => psfPool(facts, q.s, fopts()).forEach((b) => ids.add(b.id))); return ids.size; };
  /* the Method section: the list dice count along is the books the sections leave (one book when a book is pinned or the only one named), in the fixed order of psmOrder */
  const methList = () => { const f = only || (fst.b.length === 1 ? fst.b[0] : ''); return f ? [{ id: f }] : psmOrder(poolList()); };
  const methModel = () => { const n = methList().length; return { tab: mtab, die: mdie, n, k: psmNeed(n, mdie), last: mlast, today: isoDay(), daily: SV.items.filter((g) => g.daily).map((g) => ({ id: g.id, name: g.name })) }; };
  const model = () => ({ meth: methModel(), st: fst, mode: st.mode, c: C, alt: ALT, facts, by: FX.by, held: FX.held, tree: FX.tree, flat: FX.flat, names, collections: allAreas, leftOut: libLeftOut(), presetN, nUndated: FX.nUndated, nTied: FX.nTied, nNoKind: FX.nNoKind, baseTip: baseTipOf(), saved: SV.items, act: svAct, sv: svOf(), plan: svPlan(), dirty: svDirty(), shown: svShown, mixing: svMixing(), svMsg, defaultLo: names.defaultLo, mixTotal: svMixTotal(), journey: JN, only });
  /* one book by name: the type-ahead over every readable book (a datalist), because one list of 1,400 is not a thing to scroll. A title that two books share is told apart by its shelf. */
  const bookOptions = () => { const seen = new Map(); facts.forEach((f) => seen.set(f.title, (seen.get(f.title) || 0) + 1)); return facts.map((f) => { const sh = psuShelfName(gname[f.group] || ''); return `<option value="${esc(seen.get(f.title) > 1 ? `${f.title} · ${sh}` : f.title)}" label="${esc(sh)}"></option>`; }).join(''); };
  const svQuery = () => { const f = svOf(); return f && !svDirty() ? '&f=' + encodeURIComponent(f.name) : ''; };
  const onlyQuery = () => (only ? '&only=' + encodeURIComponent(only) : '');
  /* a draw made from a text or a date says so in the address (?meth=text|date) so that Back from the reader, a reload or a friend's link keeps the receipt's words; the text and the date are never in it, only the seed in the draw code */
  const methQuery = () => { const w = cur && cur.rc ? (cur.rc.src === 'replay' ? cur.rc.meth : cur.rc.src) : ''; return w === 'text' || w === 'date' ? '&meth=' + w : ''; };
  const addrQS = () => { const f = svOf(); return (f && f.parts.length > 1 && !svDirty() ? '' : psfQueryString(fst, true)) + pfQuery() + svQuery() + onlyQuery() + methQuery(); };      // a mix has no one set of choices to write: its name does it
  const randHref = () => { if (only) return '#/path/read-random?b=' + encodeURIComponent(only); const q = ((svOf() && svOf().parts.length > 1 && !svDirty() ? '' : psfQueryString(fst)) + svQuery()).replace(/^&/, ''); return '#/path/read-random' + (q ? '?' + q : ''); };      // This book only: a page of that book
  const pfQuery = () => (st.mode === 'passage' ? '' : '&pf=' + ((st.front ? 'f' : '') + (st.back ? 'b' : '') + (st.clean ? 'c' : '') || '-'));
  const modeSwitch = () => `<div class="seg" role="group" aria-label="What to draw"><button type="button" data-mode="passage" aria-pressed="${st.mode === 'passage'}">Passage</button><button type="button" data-mode="page" aria-pressed="${st.mode === 'page'}">One page</button><button type="button" data-mode="pages" aria-pressed="${st.mode === 'pages'}">Two pages</button></div>`;
  /* how long a passage is: Short, Medium (what a passage always was) or Longer; a page has its own length, so the choice is for the Passage only */
  const lengthSwitch = () => `<div class="seg psgx-len" id="psLen" role="group" aria-label="How long a passage is"${st.mode === 'passage' ? '' : ' hidden'}>${PSG_SIZES.map(([k, label, tip]) => `<button type="button" data-len="${k}" aria-pressed="${st.size === k}" title="${esc(tip)}">${label}</button>`).join('')}</div>`;
  /* what a page may be: three choices, kept for next time (a passage is always clean, with its front and back matter left out, so they show only for a page) */
  const filterBox = () => `<div class="psgx-filters" id="psFilters" role="group" aria-label="What a page may be"${st.mode === 'passage' ? ' hidden' : ''}><label class="chk"><input type="checkbox" data-pf="front"${st.front ? ' checked' : ''}><span>Skip front matter <span class="muted small">(pages numbered i, ii, iii)</span></span></label><label class="chk"><input type="checkbox" data-pf="back"${st.back ? ' checked' : ''}><span>Skip glossaries, appendixes and indexes</span></label><label class="chk"><input type="checkbox" data-pf="clean"${st.clean ? ' checked' : ''}><span>Clean text only <span class="muted small">(no damaged scan, note or running head)</span></span></label></div>`;
  const savePrefs = () => store.set('passage.prefs', { mode: st.mode, front: st.front, back: st.back, clean: st.clean, len: st.size });
  const keptList = () => store.get('passage.kept', []);
  const drawBody = () => `<div class="small t2" style="line-height:1.6;max-width:72ch"><p><b>Passage</b> is the clean one: a few verses or a paragraph with its exact reference, from the typed editions, with editors’ notes, front and back matter left out. <b>One page</b> and <b>Two pages</b> are the page as printed, everything on it, from the same shelves with their machine-read scans; the three choices under the switch say what a page may be. <b>Short</b>, <b>Medium</b> and <b>Longer</b> say how long a passage is: a verse or two (or a few lines), a few verses or a paragraph (what a passage always was), or a longer run on to the next natural break.</p><p>The pool is what Random draws from when nothing else is chosen: <b>Scriptures and sources</b> (${psxPlural(presetN.sources == null ? 0 : presetN.sources, 'book')} at the moment: the Library’s scriptures and primary sources; study aids, field records, folklore, machine-read scans and annotated editions are in <b>Everything</b>). Any choice made in a section narrows the pool further; a book you name is always drawn from.</p></div>
      <div class="row" style="margin-top:10px"><label class="small t2" for="psS">Draw with</label><select class="select" id="psS" style="width:auto;max-width:260px">${Object.entries(PSG_SRC).map(([k, v]) => `<option value="${k}"${st.src === k ? ' selected' : ''}>${v}</option>`).join('')}</select><span class="hint" id="psT"></span></div>
      <div style="margin-top:6px"><div class="small t2" style="margin-bottom:4px">Replay a draw code</div><div class="row"><input class="input" id="psCode" placeholder="b-psa.passage.1a2b3c4d-5e6f7a8b-…" aria-label="Draw code" style="flex:1;min-width:220px" autocomplete="off" spellcheck="false"><button class="btn sm" id="psReplay" type="button">Replay</button></div><div class="hint" id="psCodeMsg" style="margin-top:4px"></div></div>
      <div class="small t2" style="line-height:1.6;margin-top:12px;max-width:72ch">
      <p><b>The source.</b> The numbers come from your browser’s secure random generator (<code>crypto.getRandomValues</code>), the system generator that makes encryption keys. The Lamplighter Project does not use <code>Math.random</code> for any draw, and if a browser has no secure source it stops rather than guess.</p>
      <p><b>No bias.</b> To choose among <i>n</i> things it throws away the few raw numbers that would make some outcomes slightly likelier (rejection sampling), the step that plain <code>random % n</code> code skips. Every shelf of the books the filters leave (or of the whole Library) has the same chance, then every book on it, so the sixty-six Bible books do not crowd out the rest; inside a book, every character of text that can be part of a passage is equally likely to be where the draw lands, and the passage is then the unit around that place. A draw is never shown twice in a session.</p>
      <p><b>What a passage is.</b> In a Bible, a run of verses from the edge of one sentence to the edge of another, at the translators’ own paragraph breaks where it can; in any other text, a paragraph or a few from the start of one to where one ends. Editors’ notes, cross-references, citations, indexes, glossaries, bibliographies, contents lists, lists of names and numbers, running heads and scan garbage are left out. The reference is never invented: verse numbers are shown only where the text has them, and a printed page only where the book’s own page numbers were found.</p>
      <p><b>Draw codes.</b> Each draw makes a fresh 128-bit seed and stretches it with SHA-256 into the numbers the pick needs. The code under a passage holds the book, what was drawn and the seed. The same code with the same texts and the same version of the app gives the same passage, so a draw can be checked, or sent to someone. The address of this page carries the code of what you are looking at and the choices made above, so Back from the reader brings it back, and a link replays it.</p>
      <p><b>Your own timing</b> (the default; the line beside Another says how many key presses and taps you have given it, and a press on it changes the choice). TempleOS, the operating system Terry A. Davis wrote, had an oracle that turned the timing of key and mouse events into words and Bible verses, and Davis believed the answers came from God. With <i>Secure random + my timing</i> the times of your own key presses, taps and pointer moves (never which key) are hashed in with 32 fresh secure bytes. A draw made before any beat has come in is the secure bytes alone, and says so. They can only add to a draw: the secure bytes are always in the mix, so your timing cannot make it weaker, and nothing is stored. The Lamplighter Project does not claim that a draw carries a message. A passage met by chance is often a good place to start thinking, and that is all this offers. <a href="#/path/rites">Read about divination by book in Rites</a>.</p>
      <p><b>What this is not.</b> It is cryptographically secure randomness, checked by the tests in this repository (<code>tests/random.test.js</code>). It is not a generator certified by a gaming laboratory.</p></div>`;
  recount();
  const S0 = model();
  /* The page is organised around the passage (19 November 2026, stage 1 of RANDOM_SUITE.md): the card, the Recent row and the parallels are the stage and come first; what to draw (the switch, the quick choices, the
     line that says what is on, the six sections) is the side, a column beside the card from 1240 px wide and under it on a narrower screen; Kept passages come last. */
  body.innerHTML = `<div class="psgx-page" id="psPage"><div class="psgx-stage" id="psStage"><div id="psOut" aria-live="polite"></div><div id="psHist"></div><div id="psSim" style="margin-top:16px"></div></div>
    <section class="psgx-side" id="psSide" aria-label="What to draw"><div class="psgx-bar" id="psBar">${modeSwitch()}${lengthSwitch()}<span class="grow"></span>${RT_BUTTON}</div>
    ${psxBlockHTML(S0, { r: psxReligionsHTML(S0), p: psxPeriodsHTML(S0), b: psxBooksHTML(S0, bookOptions()), k: psxKindsHTML(S0), a: psxShelvesHTML(S0, leftOutControl()), m: psxMethodHTML(S0), h: drawBody() })}
    ${filterBox()}
    <p class="hint psgx-hint" id="psHint"><span class="psgx-hinttx">${esc(PSG_HINT[st.mode])} </span><a id="psRand" href="${randHref()}">A page from any book, opened in the reader →</a></p></section>
    <div class="psgx-kept" id="psKept"></div></div>`;
  const out = $('#psOut', root);
  /* The page stays where it is when the card changes (the maker, 19 November 2026: "when i click for another random selection, i don't want the page to reset to the top"). The fault was here: a draw swapped the card for
     one line, "Turning to …", so the page became as short as the screen, the browser moved its scroll to 0, and the new card came in at the top of a page that was already scrolled away from it. Now the card that is on
     show stays until the new one is ready (it dims a little if that takes a moment) and the swap is one step, and what the person was looking at stays on the screen: the top edge of the card when it was in view;
     the start of the new card when the person had scrolled into the old one (never above it); the controls under the card when they were looking at those (the card's bottom edge is held). A card made longer
     (Read on) or drawn again with word help on is the same card: the page is held exactly where it was. The keyboard focus goes to the same control of the new card. No layout here (the tests' stub page): nothing happens. */
  const PSG_TOPGAP = 12; let acted = 'card';      // acted: where the person's last action was, the card (its buttons, the Recent row, the keys) or the controls (the switch, the quick choices, the sections)
  const nudge = (dy) => { if (typeof window === 'undefined' || !window || typeof window.scrollBy !== 'function') return; try { window.scrollBy({ left: 0, top: dy, behavior: 'instant' }); } catch (e) { try { window.scrollBy(0, dy); } catch (e2) { /* no scrolling here */ } } };
  /* what the person is looking at when they are below the card: the nearest block under it that is still on the screen (the Recent row grows by a chip, the parallels, the controls, the kept passages), whose top edge is held */
  const anchorBelow = () => { let best = null; for (const sel of ['#psHist', '#psSim', '#psSide', '#psKept']) { const el = $(sel, root); if (!el || typeof el.getBoundingClientRect !== 'function') continue; const r = el.getBoundingClientRect(); if (r.bottom > 1 && (!best || r.bottom < best.bottom)) best = { el, top: r.top, bottom: r.bottom }; } return best; };
  const holdView = (same) => {
    let r0 = null; try { if (out && typeof out.getBoundingClientRect === 'function') r0 = out.getBoundingClientRect(); } catch (e) { r0 = null; }
    /* a draw that the person asked for from the controls (a filter, the switch, a quick choice) is looked at from the controls: they stay exactly where they are, whatever happens to the card above or beside them */
    const vh = typeof window !== 'undefined' && window && window.innerHeight ? window.innerHeight : 800;
    let ctl = null; let c0 = 0; try { const sd = acted === 'controls' ? $('#psSide', root) : null; if (sd && typeof sd.getBoundingClientRect === 'function') { const r = sd.getBoundingClientRect(); if (r.bottom > 0 && r.top < vh) { ctl = sd; c0 = r.top; } } } catch (e) { ctl = null; }
    let a0 = null; try { if (!ctl && r0 && r0.bottom <= 0) a0 = anchorBelow(); } catch (e) { a0 = null; }
    let keep = ''; try { const act = typeof document !== 'undefined' && document ? document.activeElement : null; if (act && out && typeof out.contains === 'function' && out.contains(act)) keep = act.id ? '#' + act.id : act.dataset && act.dataset.psg ? '[data-psg="' + act.dataset.psg + '"]' : ''; } catch (e) { keep = ''; }
    return () => {
      if (r0 || ctl) { try {
        const r1 = out.getBoundingClientRect();
        const dy = psgHoldDelta(ctl ? { mode: 'controls', c0, c1: ctl.getBoundingClientRect().top }      // at the controls: they stay where they are (beside the card they do not move at all; under it they move with the card's height)
          : r0.bottom <= 0 ? { mode: 'below', r0, r1, a: a0 ? { before: a0.top, after: a0.el.getBoundingClientRect().top } : null }      // below the card: what they were looking at stays where it was
          : { mode: 'card', same, r0, r1, gap: PSG_TOPGAP });      // the card's top edge stays; a new card starts at the top of the screen when the person had scrolled into the old one
        if (Math.abs(dy) > 0.5) nudge(dy);
      } catch (e) { /* no layout here */ } }
      if (keep) { try { const el = out.querySelector(keep); if (el && typeof el.focus === 'function') el.focus({ preventScroll: true }); } catch (e) { /* the focus stays where the browser put it */ } }
    };
  };
  const put = (html) => { const held = holdView(false); out.innerHTML = html; held(); };      // a message in the card's place (nothing matches, nothing turned up): the same care
  const hasCard = () => !!(out && typeof out.querySelector === 'function' && out.querySelector('.psg'));
  /* while a book is being opened: the card on show stays; only when there is none is its place held by a line */
  const turning = (id) => { if (hasCard()) { if (out.classList) out.classList.add('psgx-busy'); return; } out.innerHTML = `<p class="t2 small psgx-wait">Turning to ${esc(LIB_BY_ID[id].title)}…</p>`; };
  const renderKept = () => {
    const k = keptList(); const box = $('#psKept', root);
    box.innerHTML = k.length ? `<h2 style="margin:26px 0 10px">Kept passages <span class="tag">${k.length}</span></h2><div class="stack sm">${k.map((x, i) => { const l = LIB_BY_ID[x.id]; return `<article class="card flat rtsurface"><div class="spread" style="gap:10px;align-items:flex-start"><div><b><a href="#/path/read/${esc(x.id)}?s=${+x.si}${x.p != null ? '&p=' + +x.p : ''}">${esc(x.ref || (l ? l.title : x.id))}</a></b> <span class="muted small">· ${esc(x.ref ? (l ? l.title : '') : x.heading)}</span></div><button class="btn sm ghost" data-unkeep="${i}" type="button" aria-label="Remove this kept passage">${icon('x')}</button></div><div class="reader psg-kept">${readerHTML(x.text, undefined, wordsFor(x.id))}</div></article>`; }).join('')}</div>` : '';
  };
  const renderHist = () => {
    const box = $('#psHist', root); if (!box) return; const h = SS.hist;
    box.innerHTML = h.length > 1 ? `<div class="psgx-hist" aria-label="Recent draws"><span class="small muted">Recent</span>${h.map((x, i) => i).reverse().slice(0, 14).map((i) => `<button class="chip${i === SS.at ? ' on' : ''}" type="button" data-hist="${i}"${i === SS.at ? ' aria-current="true"' : ''} title="${esc(h[i].ref.cite)}">${esc(h[i].ref.short)}</button>`).join('')}</div>` : '';
  };
  const meter = $('#psT', root);
  /* the beats of your own timing, said in two places: the line beside Another (always in view, one press changes the choice) and the line under "Draw with" in How to draw. Text is written only when it changes, so a stream of pointer moves costs nothing and a screen reader is not read to */
  const beats = () => `${RANDT.count} beat${RANDT.count === 1 ? '' : 's'}`;
  const soFar = () => `${RANDT.count} so far`;      /* the line beside Another says it in plain words (FINAL_AUDIT.md FA-03): a count of presses and taps, never “beats” */
  const methodTip = () => (st.src === 'timing' ? 'The times of your own key presses, taps and pointer moves are mixed into every draw, with fresh secure random bytes (never which key). Press to draw with secure random alone.' : 'Every draw uses the secure random source alone. Press to mix the times of your own key presses, taps and pointer moves into every draw.');
  const hintLow = () => (RANDT.count < 8 ? ' (press keys, tap or move)' : '');
  const tick = () => {
    const t1 = st.src === 'timing' ? `${beats()} of your own so far${RANDT.count < 8 ? ': press keys, tap or move the pointer for a moment before you draw' : ''}.` : '';
    if (meter && meter.textContent !== t1) meter.textContent = t1;
    const mn = $('#psMn', root); if (mn) { const t2 = soFar(); if (mn.textContent !== t2) mn.textContent = t2; }
    const mh = $('#psMh', root); if (mh) { const t3 = hintLow(); if (mh.textContent !== t3) mh.textContent = t3; }
  };
  /* the line beside Another. The words in .psgx-l are left off on a phone, where the bar has no room for the whole sentence; the title and How to draw say all of it. It says what is counted in plain words, "Your key presses and taps are mixed
     into the draw: 12 so far" (AA-14 of ALPHA_AUDIT.md first spelled out a beat; FINAL_AUDIT.md FA-03 dropped the word, which a friend still asked about: the count is of presses and taps). The button is the same button, with the same title. */
  const methodHTML = () => (st.src === 'timing' ? `Your key presses and taps are mixed into the draw: <span id="psMn">${soFar()}</span><span class="psgx-l" id="psMh">${hintLow()}</span>` : 'Drawn by secure random alone<span class="psgx-l"> (press to mix in your key presses and taps)</span>');
  const pinHTML = () => (only ? `<button type="button" class="chip psgx-pin" id="psPin" data-psg="free" title="${esc(`Every draw comes from ${names.book(only)} until you press this`)}">This book only<span class="psgx-l">, back to all</span> <span aria-hidden="true">×</span></button>` : '');
  const howHTML = () => `${pinHTML()}<button type="button" class="psgx-meth" id="psMeth" data-psg="src" title="${esc(methodTip())}"><span id="psMt">${methodHTML()}</span></button>`;
  const paintHow = () => { const h = $('#psHow', root); if (h) h.innerHTML = howHTML(); };
  const timing = () => { RANDT.stop(); RANDT.reset(); if (st.src === 'timing') RANDT.start(document, () => { if (root.isConnected === false) { RANDT.stop(); return; } tick(); }); tick(); };
  const receipt = (p) => {
    const r = p.rc || {}; const l = LIB_BY_ID[p.id]; const code = psgCode(p.id, r.len, r.seed);
    const how = r.src === 'text' || r.src === 'date' || r.src === 'daily' || r.src === 'dice' ? psmHow(r.src, { dice: r.dice }).replace(/\.$/, '') : r.src === 'replay' && (r.meth === 'text' || r.meth === 'date') ? psmHow('replay-' + r.meth).replace(/\.$/, '') : r.src === 'replay' && r.dice ? psmHow('replay-dice', { dice: r.dice }).replace(/\.$/, '') : r.src === 'replay' ? 'Replayed from a draw code' : r.src === 'timing' ? (r.events > 0 ? `Drawn with secure random mixed with your timing (${r.events} beat${r.events === 1 ? '' : 's'})` : 'Drawn with secure random (your timing was on, but no beat of yours had come in yet)') : 'Drawn with secure random';      // a draw made before any beat is the secure bytes alone, and the card says so
    const book = r.how && r.how.dice ? `Book: number ${r.how.i + 1} of the ${r.how.n} books the choices leave, counted shelf by shelf as the Books section lists them (every book on the list equally likely).` : r.how && r.how.gn ? `Book: shelf ${r.how.g} of ${r.how.gn} (every shelf equally likely), then book ${r.how.b} of ${r.how.bn} on it.` : r.src === 'replay' ? 'Book named by the code.' : r.pin ? 'Book: this book only, as you asked with Another from this book.' : 'Book: the one you chose.';
    const what = p.kind === 'leaf' ? (p.nopages ? `A page: about ${p.leaves === 2 ? 'two pages' : 'a page'} of text from a paragraph edge to a paragraph edge, in a section that is not ${st.front || st.back ? 'front or back matter' : 'left out'}. This book has no printed page numbers here, so it is cited by its section.` : `A page: ${p.leaves === 2 ? 'two printed pages' : 'one printed page'} (${p.cite}), from where the book’s own page marks say one begins to where they say the next begins, everything on ${p.leaves === 2 ? 'them' : 'it'}, notes and all.${st.front ? ' Front matter (pages numbered in roman numerals) is left out.' : ''}${st.back ? ' So are glossaries, appendixes and indexes.' : ''}${st.clean ? ' Only text that passes the quality check is drawn.' : ''}`) : p.kind === 'verses' ? `A passage: verses ${p.from}${p.to !== p.from ? '–' + p.to : ''} of ${esc(psuHeading(p.heading))}, from the edge of a sentence to the edge of a sentence, at the translators’ own paragraph breaks where it can.` : p.kind === 'prose' ? 'A passage: a paragraph or a few, from where a paragraph or a sentence begins to where one ends.' : 'A page: about a page of text from the place that was drawn, from where a sentence begins to where one ends.';
    const sz = PSG_SIZES.find((q) => q[0] === r.size); const lenNote = sz && sz[0] !== 'medium' && p.kind !== 'leaf' ? ` Length asked: ${sz[1].toLowerCase()} (${sz[2].toLowerCase()}).` : '';
    return `<details style="margin-top:12px"><summary>How this was drawn</summary><div class="small t2" style="line-height:1.6"><div>${what}${esc(lenNote)}</div><div>${esc(how)}. 128-bit seed; the pick reads its numbers from SHA-256 of the seed and a counter.</div><div>${esc(book)}</div><div style="margin-top:6px"><b>Draw code</b> <code style="word-break:break-all">${esc(code)}</code> <button class="btn sm ghost" data-psg="code" type="button">Copy</button></div><div class="hint">${esc(l ? l.title : '')}: the same code with the same texts gives this passage again.</div></div></details>`;
  };
  const notebookOn = () => typeof NB !== 'undefined' && NB && typeof NB.clip === 'function';
  /* a card from a machine-read scan says so, in the same words every time, with a way to the page itself where the Library has one (2z-source-core.js: the same test as the reader's own notice, and the same Internet Archive scan): the text is shown as the machine read it, never mended */
  const scanNote = (p) => {
    const mm = meta[p.id] || {}; if (typeof provKind !== 'function' || provKind(p.id, mm) !== 'scan') return '';
    let scans = []; try { const entry = typeof origEntry === 'function' ? origEntry(globalThis.BEATLAB_ORIG || {}, p.id, meta) : null; scans = provInfo(p.id, mm, entry).scans; } catch (e) { scans = []; }
    const link = (s, text) => `<a href="${esc(provFindURL(s, psgClean(p.text)) || s.page)}" target="_blank" rel="noopener noreferrer">${text}</a>`;      // a search for the passage inside that scan on the Internet Archive
    const parts = scans.length > 1 ? ` The book is in ${scans.length} parts: ${scans.map((s, i) => link(s, esc(s.label || 'Part ' + (i + 1)))).join(', ')}.` : '';      // a book scanned in several volumes: the passage may be in any
    return `<div class="psgx-scan" id="psScan">${PSG_SCAN_NOTE} ${scans.length ? link(scans[0], PSG_SCAN_LINK) : PSG_SCAN_LINK}${parts}</div>`;
  };
  const show = (p, same) => {
    cur = p; const sm = $('#psSim', root); const held = holdView(same); if (sm) { sm.innerHTML = ''; sm._sim = null; } const l = LIB_BY_ID[p.id]; const m = meta[p.id] || {};      // same: the card made longer (Read on) or drawn again, not a new one
    const verses = p.kind === 'verses'; const canBack = SS.at > 0; const canFwd = SS.at < SS.hist.length - 1;
    const wh = psgWhoOf({ id: p.id, title: l ? l.title : '', group: l ? l.group : '', ks: (FX.by[p.id] || {}).ks, lead: p.lead, when: l ? psgWhenOf(l) : '', by: m.by, note: m.note }); p.rowKind = !!wh.kind; const who = psgWhoHTML(wh);      // the context row under the reference: religion, kind, period, edition, one sentence about the book
    out.innerHTML = `<article class="card glow fade-in psg psgx rtsurface" data-kind="${p.kind}">
      <h2 class="psgx-ref" id="psRef">${esc(p.ref.main)}</h2><div class="psgx-sub" id="psSub">${esc(p.ref.sub || '')}</div>${who}<div class="psgx-from" id="psFrom">${esc(p.frame || '')}</div>${p.svLine ? `<div class="psgx-svline" id="psSvLine">${esc(p.svLine)}</div>` : ''}
      <div class="reader psg-text" style="font-size:${store.get('reader.size', 18)}px">${readerHTML(p.text, undefined, wordsFor(p.id))}</div>
      ${scanNote(p)}<div class="psgx-ctx" id="psCtx">${esc(p.rowKind ? '' : p.ctx || '')}</div>
      <div class="psgx-go" id="psGoBar" role="group" aria-label="Next"><button class="btn primary lg dice" id="psGo" data-psg="next" type="button" title="Another (Space or N)" aria-keyshortcuts="Space N">${icon('dice')}Another</button><a class="btn lg" id="psCtxLink" href="#/path/read/${p.id}?s=${p.si}&p=${p.p}" title="Open the book at this place">In context</a><button class="btn lg" id="psBook" data-psg="book" type="button" title="Another from this book (B)" aria-keyshortcuts="B">Another from this book</button>${canBack ? '<button class="btn ghost psgx-step" data-psg="back" type="button" title="Previous (←)" aria-label="Previous passage">← <span class="psgx-lbl">Previous</span></button>' : ''}${canFwd ? '<button class="btn ghost psgx-step" data-psg="fwd" type="button" title="Next (→)" aria-label="Next passage"><span class="psgx-lbl">Next</span> →</button>' : ''}<span class="psgx-keys">Space or N · B for this book</span><div class="psgx-how" id="psHow">${howHTML()}</div></div>
      <div class="psgx-tools" id="psTools" role="group" aria-label="More with this passage">${p.kind === 'leaf' ? '' : `<button class="btn" data-psg="more" type="button"${p.end ? ' disabled' : ''}>Read on</button>`}<button class="btn dice" data-psg="similar" type="button">${icon('swap')}Parallels</button><button class="btn" data-psg="copy" type="button">Copy with citation</button><button class="btn" data-psg="keep" type="button">Keep</button>${notebookOn() ? '<button class="btn" data-psg="clip" type="button">Clip to notebook</button><span class="small muted" id="psNb"></span>' : ''}${typeof askOpen === 'function' ? '<button class="btn" data-psg="ask" type="button">Ask an AI</button>' : ''}${typeof citeOpen === 'function' ? '<button class="btn" data-psg="cite" type="button" title="Cite this passage in Chicago, BibTeX or RIS form">Cite</button>' : ''}</div>
      ${receipt(p)}<div class="hint" style="margin-top:10px">${esc(m.by || '')}${m.license ? ' · ' + esc(m.license) : ''}${m.src ? ` · ${ext(m.src, 'source')}` : ''}</div></article>`;
    renderHist(); psgSetHash(psgCode(p.id, p.rc.len, p.rc.seed), addrQS()); held();
    if (notebookOn() && typeof NB.backlinks === 'function') { try { Promise.resolve(NB.backlinks(p.id, p.si, p.p)).then((r) => { const n = Array.isArray(r) ? r.length : r && typeof r.length === 'number' ? r.length : 0; const el = $('#psNb', root); if (n && cur === p && el) el.textContent = 'already in your notebook'; }, () => {}); } catch (e) { /* no notebook marks */ } }
  };
  /* the page numbers of a scan and the Atlas's name for the kind of text arrive after the card is shown, and are put in without drawing it again */
  const enrich = async (p, secs) => {
    const l = LIB_BY_ID[p.id];
    const pg = await psgPagesOf(p.id, p, secs); if (pg.pages || pg.note) { p.ref = psgRefOf(p, l, meta[p.id], pg.pages); p.pgNote = pg.note; if (cur === p) { const s = $('#psSub', root); if (s) { s.textContent = p.ref.sub || ''; if (pg.note) s.title = pg.note; } renderHist(); } }
    if (p.kind !== 'verses' && typeof ATLD !== 'undefined' && ATLD && typeof ATLD.need === 'function' && !psuKind(p.id, '')) {
      try { await ATLD.need('index', 'texts'); const k = (psgAtlasKinds() || {})[p.id]; if (k) { p.ctx = psgContextOf(l, p, gname, k); if (cur === p) { const c = $('#psCtx', root); if (c) c.textContent = p.rowKind ? '' : p.ctx; } } } catch (e) { /* the line stays as it was */ }
    }
  };
  /* nothing matches: say so plainly, and offer to take one choice off (what it would give), or all of them */
  const noneHTML = () => {
    const rx = psfRelax(facts, fst, fopts()); const lab = { r: 'Religions', p: 'Periods', b: 'Books', k: 'Type of text', a: 'Shelves', x: 'The Journey link', lo: 'The saved leave-outs' };
    const btn = (r) => `<button type="button" class="btn sm" data-off="${r.sec}">${r.sec === 'base' ? 'Draw from Everything' : 'Take off ' + esc(lab[r.sec])} <span class="muted">· ${psxPlural(r.n, 'book')}</span></button>`;
    return `<section class="card flat psgx-none" id="psEmpty"><p class="t2"><b>No book matches all of these:</b> ${rx.length ? 'take one of them off.' : 'clear them to start again.'}</p><div class="row tight">${rx.map(btn).join('')}<button type="button" class="btn sm ghost" data-psf="clear">Clear all</button></div></section>`;
  };
  const noPartHTML = (sv, pk) => { const x = psvPlan(sv, facts, Object.assign({}, fopts(), { names }))[pk]; return `<section class="card flat psgx-none" id="psEmpty"><p class="t2"><b>Part ${pk + 1} of “${esc(sv.name)}” matches no book:</b> ${esc(x.label)} (${esc(x.word)}). It is not skipped. Change it or take it off in <button type="button" class="linkbtn" data-sv="openeditor">Parts and daily</button>.</p><div class="row tight"><button type="button" class="btn primary" data-psg="next">${icon('dice')}Another</button></div></section>`; };
  const emptyMsg = (id) => id ? `<section class="card flat"><p class="t2">That book is not readable here. ${loadFailText('Keep the texts folder next to Lamplighter.html.')}</p></section>` : noneHTML();
  const draw = async (o) => {
    const opt = o || {}; if (busy) { if (!opt.replay) { again = true; againOpt = opt.method || opt.daily ? opt : null; } return; } busy = true; again = false; out.setAttribute('aria-busy', 'true');      // a draw asked for while one is being made waits its turn, with its way (a text, a date, dice, today's)
    try {
      const replay = opt.replay || null; const psz = replay ? psgPSize(replay.len) : st.size;      // how long a passage is: the code says so when it is replayed, else the choice above the card
      const meth = !replay && opt.method ? opt.method : null; const isDice = !!meth && meth.kind === 'dice';      // a way of making the seed: { kind: 'text' | 'date' | 'dice', seed, dice } (the seed is made by the caller; only how it was made differs from a draw by chance)
      const mode = replay ? (psz ? 'passage' : replay.len === 'pages' ? 'pages' : 'page') : st.mode; if (replay && (st.mode !== mode || (psz && st.size !== psz))) { st.mode = mode; if (psz) st.size = psz; syncMode(); recount(); psxPatch(root, model()); }
      const old = replay && !!PSG_LEN[replay.len] && replay.len !== 'long'; const oldPage = replay && replay.len === 'long';      // a code made before pages were printed pages (short, medium, longer, long) replays as it was drawn
      const codeLen = replay ? replay.len : mode === 'page' ? 'page' : mode === 'pages' ? 'pages' : PSG_PLEN[psuSizeOf(st.size)]; const fixed = replay ? replay.id : only || (fst.b.length === 1 ? fst.b[0] : '');
      const sv = !replay && !fixed && !isDice && svAct && !svDirty() ? svOf() : null; const daily = !!opt.daily && !!sv; let part = null;      // dice count along the list the sections leave: a saved mix's other parts and weights are not used
      const pool = replay || fixed || sv ? [] : poolList(); if (!replay && !fixed && !sv && !pool.length) { put(noneHTML()); return; }
      const list = isDice && !fixed ? psmOrder(pool) : null; if (list && list.length !== meth.dice.n) { put('<section class="card flat"><p class="t2">The books the choices leave changed while the dice were being read. Roll or type the numbers again.</p></section>'); return; }
      for (let attempt = 0; attempt < (replay || daily || meth ? 1 : 8); attempt++) {
        const seed = replay ? replay.seed : meth ? meth.seed : daily ? psvDailySeed(sv.name, isoDay(), sha256) : psgNewSeed(st.src); const events = !replay && !daily && !meth && st.src === 'timing' ? RANDT.count : 0; let got = null;
        let pk = 0; let ppool = pool; if (sv) { pk = psvPick(sv.parts, randStream(seed + ':part')); part = sv.parts[pk]; ppool = psfPool(facts, part.s, fopts()); if (!ppool.length) { put(noPartHTML(sv, pk)); return; } }
        for (let tries = 0; tries < 8 && !got; tries++) {
          let id = fixed; let how = null;
          if (!id) { if (isDice) { how = { dice: true, i: meth.dice.index, n: list.length }; id = list[meth.dice.index] && list[meth.dice.index].id; } else { how = psgChooseBook(sv ? ppool : pool, randStream(seed + ':book:' + tries)); id = how && how.id; } }      // dice name the book by its place on the list; every other way draws the shelf, then the book
          if (!id || !LIB_BY_ID[id] || !meta[id]) { put(emptyMsg(id)); return; }
          turning(id);
          const t = await TXT.load(id); let u = null; const named = !!fixed || isDice || (sv ? part.s : fst).b.includes(id);      // a book the dice name is given even when its best pick is only so-so, as a book asked for by name is
          if (t) {
            if (old) u = pickPassage(t.secs, t.meta, randStream(seed), { target: PSG_LEN[replay.len][1] });
            else if (oldPage) u = psgPickUnit(t.secs, t.meta, randStream(seed), { mode: 'page', lenient: named });
            else if (mode === 'passage') u = psgPickUnit(t.secs, t.meta, psgStreamOf(seed), { mode: 'passage', size: psz, lenient: named });
            else { const pg = await psgLoadPages(id, t.secs); u = psgPickLeaf(t.secs, t.meta, psgStreamOf(seed), { count: mode === 'pages' ? 2 : 1, front: st.front, back: st.back, clean: st.clean, pgx: pg && pg.pgx, vols: pg && pg.vols, lenient: named }); if (u && pg) u.pgNote = pg.note; }
          }
          if (u) { if (old) u.kind = 'prose'; got = { u, id, t, how }; break; }
          if (fixed || isDice) { put(`<section class="card flat"><p class="t2">${mode === 'passage' ? 'No clean English passage' : 'No page with these choices'} turned up in ${esc(LIB_BY_ID[id].title)}. It may be mostly notes or in another language. Try another book or roll again.</p></section>`); return; }
        }
        if (!got) continue;
        const u = got.u; u.id = got.id; u.mode = mode; const key = psgKey(u);
        if (!replay && !daily && !meth && attempt < 7 && psuSeenAny(SS.seen, key)) continue;      // shown already in this session: draw again with a fresh seed
        const l = LIB_BY_ID[u.id]; u.rc = { seed, len: codeLen, asked: codeLen, events, src: replay ? 'replay' : meth ? meth.kind : daily ? 'daily' : st.src, how: got.how, size: mode === 'passage' ? psz : '', pin: !replay && !!only, meth: replay && (opt.meth === 'text' || opt.meth === 'date') ? opt.meth : '', dice: isDice ? meth.dice : replay ? psmDiceFromSeed(seed) : null };
        u.ref = psgRefOf(u, l, meta[u.id], u.kind === 'leaf' ? u.cite || '' : ''); u.ctx = psgContextOf(l, u, gname, ((psgAtlasKinds() || {})[u.id]) || ''); u.frame = psgFromOf(l, gname); if (!sv && replay && svAct && !svDirty()) { const f = svOf(); const k2 = psvPick(f.parts, randStream(seed + ':part')); const pt = f.parts[k2]; if (psfPool(facts, pt.s, fopts()).some((b) => b.id === u.id)) u.svLine = psvLine({ name: f.name, today: seed === psvDailySeed(f.name, isoDay(), sha256), i: k2, n: f.parts.length, label: psvLabel(pt.s, names), word: psvWeight(pt.w)[1] }); }
        if (sv) u.svLine = psvLine({ name: sv.name, today: daily, i: pk, n: sv.parts.length, label: psvLabel(part.s, names), word: psvWeight(part.w)[1] });
        SS.hist.push(u); SS.at = SS.hist.length - 1; SS.seen.push(key); if (SS.seen.length > 600) SS.seen.shift(); if (SS.hist.length > 60) { SS.hist.shift(); SS.at--; }
        show(u); enrich(u, got.t.secs); return;
      }
      put('<section class="card flat"><p class="t2">Nothing suitable turned up. Press Another to try again.</p></section>');
    } catch (e) { put(`<section class="card flat"><p class="t2">${esc(e.message)}</p></section>`); } finally { busy = false; out.removeAttribute('aria-busy'); if (out.classList) out.classList.remove('psgx-busy'); if (again && root.isConnected !== false) { again = false; const ao = againOpt; againOpt = null; draw(ao || undefined); } }
  };
  const step = (d) => { const i = SS.at + d; if (i < 0 || i >= SS.hist.length) return; SS.at = i; show(SS.hist[i]); };
  const readOn = async () => {
    if (!cur) return; const p = cur; const t = await TXT.load(p.id); const n = t ? psgReadOn(t.secs, t.meta, p) : null;
    if (!n) { p.end = true; const b = $('[data-psg="more"]', root); if (b) b.disabled = true; toast(p.kind === 'verses' ? 'That is the end of the chapter. In context goes on from here.' : 'That is the end of this part of the book. In context goes on from here.', 'warn', 2600); return; }
    p.text = n.text; p.pe = n.pe; if (p.kind === 'verses') { p.ib = n.ib; p.to = n.to; } else p.nums = psgNumbersOf(t.secs, t.meta, p);
    p.ref = psgRefOf(p, LIB_BY_ID[p.id], meta[p.id], ''); show(p, true); enrich(p, t.secs);
  };
  const citeText = (p) => {
    const l = LIB_BY_ID[p.id]; const mm = meta[p.id] || {}; const q = psgClean(p.text); const entry = typeof origEntry === 'function' ? origEntry(globalThis.BEATLAB_ORIG || {}, p.id, meta) : null;
    return p.kind === 'verses' ? provCite(p.id, p.ref.cite, '', q, mm, { entry, page: '' }) : provCite(p.id, l.title, psuHeading(p.heading), q, mm, { entry, page: p.ref.pages || '' });
  };
  /* the filters: a change is kept for next time, shown at once (the numbers, the ticks, the line that says what is on, the address), and drawn from a moment later, so ticking several things does not draw several cards */
  const persist = () => { store.set('passage.filters', psfSave(fst)); };
  const refresh = () => { recount(); psxPatch(root, model()); const r = $('#psRand', root); if (r) r.setAttribute('href', randHref()); psgSetHash(cur && SS.hist.length ? psgCode(cur.id, cur.rc.len, cur.rc.seed) : '', addrQS()); };
  const drawSoon = () => { clearTimeout(soon); soon = setTimeout(() => { soon = 0; if (root.isConnected !== false) draw(); }, 650); };
  const leaveSV = () => { if (svAct) { svAct = ''; svShown = 0; SV = psvSetLast(SV, ''); saveSV(); } };      // a quick choice, Clear all or Stop using it: the saved filter is no longer the one in use
  const setState = (next, how, leave) => { if (leave) leaveSV(); fst = psfNorm(next, fctx); persist(); refresh(); if (how === 'now') { clearTimeout(soon); draw(); } else if (how === 'soon') drawSoon(); };
  const inList = (arr, v, on) => (on ? (arr.includes(v) ? arr : arr.concat([v])) : arr.filter((x) => x !== v));
  const periodOf = (id) => PSF_PERIODS.find((q) => q[0] === id); const sameRange = (r, p) => (r[0] == null ? p[2] == null : r[0] === p[2]) && (r[1] == null ? p[3] == null : r[1] === p[3]);
  const applyOpt = (sec, key, on) => {
    const s = Object.assign({}, fst);
    if (sec === 'r') s.r = inList(fst.r, key, on); else if (sec === 'k') s.k = inList(fst.k, key, on); else if (sec === 'b') s.b = inList(fst.b, key, on); else if (sec === 'a') s.a = inList(fst.a, +key, on);
    else if (sec === 'p') { const p = periodOf(key); if (!p) return; s.p = on ? fst.p.concat([[p[2], p[3]]]) : fst.p.filter((r) => !sameRange(r, p)); } else return;
    setState(s, 'soon');
  };
  const takeOff = (sec) => { const s = Object.assign({}, fst); if (sec === 'p') { s.p = []; s.dated = false; } else if (sec === 'base') s.base = 'all'; else if (sec === 'x') s.x = ''; else if (sec === 'lo') s.lo = null; else if (sec === 'r' || sec === 'b' || sec === 'k' || sec === 'a') s[sec] = []; else return; setState(s, 'now'); };
  const removeOne = (spec) => {
    if (spec === 'only|1') { freeBook(); return; }      // the chip "This book only" in the line that says what is on
    const i = spec.indexOf('|'); const sec = spec.slice(0, i); const key = spec.slice(i + 1); const s = Object.assign({}, fst);
    if (sec === 'r' || sec === 'k' || sec === 'b') s[sec] = fst[sec].filter((x) => x !== key); else if (sec === 'a') s.a = fst.a.filter((x) => x !== +key); else if (sec === 'p') s.p = fst.p.filter((x, j) => j !== +key); else if (sec === 'dated') s.dated = false; else if (sec === 'x') s.x = ''; else if (sec === 'lo') s.lo = null; else return;
    setState(s, 'soon');
  };
  const addYears = () => {
    const msg = $('#psYMsg', root); const val = (id) => { const el = $('#' + id, root); return el && el.value != null ? String(el.value).trim() : ''; };
    const yr = (v, era) => { if (v === '') return null; const n = Number(v); if (!Number.isInteger(n) || n < 1 || n > (era === 'BCE' ? 20000 : 2026)) return NaN; return era === 'BCE' ? -n : n; };
    const a = yr(val('psYa'), val('psEa')); const b = yr(val('psYb'), val('psEb'));
    if (Number.isNaN(a) || Number.isNaN(b)) { if (msg) msg.textContent = 'A year is a whole number, from 1 to 2026 (CE) or earlier (BCE).'; return; }
    if (a == null && b == null) { if (msg) msg.textContent = 'Type a year in one box or both.'; return; }
    if (msg) msg.textContent = ''; ['psYa', 'psYb'].forEach((id) => { const el = $('#' + id, root); if (el) el.value = ''; }); ['psEa', 'psEb'].forEach((id) => { const el = $('#' + id, root); if (el) el.value = 'CE'; });
    setState(Object.assign({}, fst, { p: fst.p.concat([[a, b]]) }), 'soon');
  };
  const syncMode = () => { $$('[data-pf]', root).forEach((b) => { if (b.dataset.pf in st) b.checked = !!st[b.dataset.pf]; }); $$('[data-mode]', root).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === st.mode))); $$('[data-len]', root).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.len === st.size))); const h = $('#psHint .psgx-hinttx', root); if (h) h.textContent = PSG_HINT[st.mode] + ' '; const f = $('#psFilters', root); if (f) f.hidden = st.mode === 'passage'; const ln = $('#psLen', root); if (ln) ln.hidden = st.mode !== 'passage'; };
  const setMode = (m) => { if (m === st.mode) return; st.mode = m; savePrefs(); syncMode(); refresh(); draw(); };
  const setSize = (k) => { const z = psuSizeOf(k); if (z === st.size && st.mode === 'passage') return; st.size = z; savePrefs(); syncMode(); draw(); };
  /* the way a draw is made: from the line beside Another or from How to draw; the choice is the person's own and is kept (and the timing is counted from nothing again, so the line is honest about what the next draw holds) */
  const setSrc = (v) => { st.src = v === 'secure' ? 'secure' : 'timing'; store.set('passage.src', st.src); store.set('passage.srcv', PSG_SRC_V); const sel = $('#psS', root); if (sel) sel.value = st.src; timing(); paintHow(); };
  /* Another from this book: draw from the book of the card in view, and keep drawing from it (the chip says so, and lets go with one press) until the person lets go; the filters and the saved filters are not touched */
  const thisBook = () => { if (!cur || !LIB_BY_ID[cur.id]) return; only = cur.id; refresh(); paintHow(); draw(); };
  const freeBook = () => { if (!only) return; only = ''; refresh(); paintHow(); toast('Drawing from your choices again.', 'good', 1800); };
  /* "Draw more from this religion" (the context row under the reference): the religion is added to the choices under Religions (they add inside a section, as ticking it there would) and another passage is drawn
     from the choices as they now stand. Asking for more of a religion lets go of "this book only" and of the books named under Books (a book named, or opened from the Library's dice, would otherwise be the
     only one the draw could come from, and the button would seem to do nothing); the toast says so. The periods, kinds, shelves and the rest are left as they are. */
  const moreFrom = (sel) => {
    if (!/^[tf]:[A-Za-z0-9_-]{1,80}$/.test(sel)) return; const let_go = !!only || fst.b.length > 0; if (only) { only = ''; paintHow(); }
    setState(Object.assign({}, fst, { r: inList(fst.r, sel, true), b: [] }), 'now'); toast(`Drawing from ${names.rel(sel)} too.${let_go ? ' The book you had chosen is no longer the only one.' : ''}`, 'good', 3000);
  };
  /* "About this text": the Library's own source card (the edition, where the text is from, its rights, the note about this copy and, for a scanned book, a finder that opens the page of the original) in a dialog,
     so the person keeps the passage and the place on the page; the finder's "Use this page" fills in the words of the passage */
  const aboutText = () => {
    if (!cur || typeof provCardHTML !== 'function' || typeof modal !== 'function') return; const p = cur; const l = LIB_BY_ID[p.id]; const m = meta[p.id] || {};
    let entry = null; try { entry = typeof origEntry === 'function' ? origEntry(globalThis.BEATLAB_ORIG || {}, p.id, meta) : null; } catch (e) { entry = null; }
    let html = ''; try { html = provCardHTML(p.id, m, entry, ''); } catch (e) { html = ''; } if (!html) return;
    /* SA-01 (STRUCTURE_AUDIT.md): the strip of related things (the religion, events of its time, conflicts, the map, pictures, your notes) lives here, inside this disclosure, and not on the card, which stays as calm as it was (relatedBox, 6zzh-related.js; nothing is drawn where the strip is not in the build or has nothing) */
    let rel = ''; try { rel = typeof relatedBox === 'function' ? relatedBox('passage', p.id, {}) : ''; } catch (e) { rel = ''; }
    const done = modal({ title: esc(l ? psuShortTitle(l.title) : p.id), html: html + (rel ? `<section class="rdrel psg-rel" aria-label="Related">${rel}</section>` : ''), actions: [{ label: 'Close', kind: 'primary', value: true }] });
    try { const all = document.querySelectorAll('.modal-back'); const dlg = all.length ? all[all.length - 1] : null; const box = dlg ? dlg.querySelector('.srccard') : null; if (box && typeof provWireCard === 'function') provWireCard(box, provInfo(p.id, m, entry), () => psgClean(p.text)); if (dlg && dlg.addEventListener) dlg.addEventListener('click', (ev) => { const a = ev.target && ev.target.closest ? ev.target.closest('a[href^="#/"]') : null; if (a && dlg.close) dlg.close(true); }); if (dlg && typeof window !== 'undefined') psgCloseOnRoute(dlg, done, window); } catch (e) { /* the card is shown without its finder wired */ }      // a link to another page of the app closes the dialog, as the picture dialog's link into a book does
  };
  const replayCode = () => {
    const msg = $('#psCodeMsg', root); const c = psgParseCode($('#psCode', root).value);
    if (!c) { if (msg) msg.textContent = 'That is not a draw code. A code looks like b-psa.passage.1a2b3c4d-5e6f7a8b-9c0d1e2f-3a4b5c6d.'; return; }
    if (!meta[c.id] || !LIB_BY_ID[c.id]) { if (msg) msg.textContent = 'That book is not readable here. ' + loadFailText('Keep the texts folder next to Lamplighter.html.'); return; }
    if (msg) msg.textContent = ''; draw({ replay: c });
  };
  /* ── Method: a text, a date or dice (2z-passage-core.js, psm*). Each makes a seed and draws with it; Another goes on drawing by chance. A typed text is read once, to make the seed: it is never stored, put in the
     address, the history or the card, and nothing is sent. The address carries the draw code, whose last part is the seed. ── */
  const methMsg = (t) => { const m = $('#psMxMsg', root); if (m) m.textContent = t || ''; };
  const methDraw = (m) => { methMsg(''); clearTimeout(soon); draw({ method: m }); };
  const drawText = () => { const seed = psmTextSeed(valueOf('psMxText'), sha256); if (!seed) { methMsg('Type a word, a name or a question first.'); return; } methDraw({ kind: 'text', seed }); };
  const drawDate = () => { const day = psmDay(valueOf('psMxDate')); if (!day) { methMsg('That is not a date. Choose one, or type it like 2026-11-19.'); return; } methDraw({ kind: 'date', seed: psmDateSeed(day, sha256) }); };
  const diceFaces = () => (mdie === 10 ? '0 to 9 (a face marked 10 counts as 0)' : '1 to ' + mdie);
  const diceError = (r) => (r.error === 'count' ? `Type ${r.need} number${r.need === 1 ? '' : 's'}: ${r.k ? `${r.k} for the book and ` : ''}2 for the place. You typed ${r.have}.` : r.error === 'face' ? `Number ${r.at + 1}, ${r.face}, is not a face of a d${mdie}: it shows ${diceFaces()}.` : r.error === 'thrown' ? `The first ${r.k === 1 ? 'die' : r.k + ' dice'} (${(r.shown || []).join(' ')}) read as ${r.value}. Numbers from ${r.limit} up are thrown out, because they would favour the first books: roll ${r.k === 1 ? 'that die' : 'those ' + r.k + ' dice'} again.` : 'Choose a d6, a d10 or a d20.');
  const rollDice = () => {
    const n = methList().length; if (!n) { methMsg('No book matches the choices, so there is nothing to roll for.'); return; }
    const r = psmRoll(mdie, n, randInt); if (!r) { methMsg('The dice could not be rolled.'); return; }
    mlast = r; psxPatch(root, model()); methDraw({ kind: 'dice', seed: r.seed, dice: r });
  };
  const typedDice = () => {
    const n = methList().length; if (!n) { methMsg('No book matches the choices, so there is nothing to draw from.'); return; }
    const faces = psmParseFaces(valueOf('psMxNums'), mdie); const r = psmTyped(faces, mdie, n); if (r.error) { methMsg(diceError(Object.assign({ shown: faces.slice(0, r.k || 0) }, r))); return; }
    mlast = r; psxPatch(root, model()); methDraw({ kind: 'dice', seed: r.seed, dice: r });
  };
  const methDo = (k, el) => {
    const d = (el && el.dataset) || {};
    if (k === 'tab') { mtab = PSX_WAYS.some((w) => w[0] === d.tab) ? d.tab : 'chance'; methMsg(''); psxPatch(root, model()); return; }
    if (k === 'die') { mdie = PSM_DICE.includes(+d.die) ? +d.die : 6; mlast = null; methMsg(''); psxPatch(root, model()); return; }
    if (k === 'text') drawText(); else if (k === 'date') drawDate(); else if (k === 'roll') rollDice(); else if (k === 'typed') typedDice();
    else if (k === 'today') { if (svOf(d.id)) { methMsg(''); applySaved(d.id); } }      // the daily draw that was always there, from a saved filter marked Daily
  };
  /* the two long lists are made when their section is first opened */
  const makeTree = () => { const t = $('#psTree', root); if (t && t.dataset && t.dataset.made !== '1') { t.innerHTML = psxTreeHTML(model()); t.dataset.made = '1'; } };
  const makeShelves = () => { const t = $('#psBlist', root); if (t && t.dataset && t.dataset.made !== '1') { t.innerHTML = psxBookShelves(model()); t.dataset.made = '1'; psxPatch(root, model()); } };
  /* ── saved filters: use one, save these choices under a name, rename, delete, its parts and daily ── */
  const showForm = (html, kind) => { svForm = html ? kind : ''; const el = $('#psSvForm', root); if (el) el.innerHTML = html || ''; if (html) { const i = $('#psSvName', root); if (i && i.focus) i.focus(); } };
  const applySaved = (id) => {
    const f = svOf(id); if (!f) return; svAct = f.id; svShown = 0; svMsg = ''; svName = f.name; showForm('');
    fst = psfNorm(f.parts[0].s, fctx); st.mode = f.mode; st.front = f.pf.front; st.back = f.pf.back; st.clean = f.pf.clean; savePrefs(); SV = psvSetLast(SV, f.id); saveSV(); persist();
    syncMode(); refresh(); clearTimeout(soon); draw({ daily: !!f.daily });
  };
  const formMsg = (t) => { const m = $('#psSvFMsg', root); if (m) m.textContent = t; };
  const valueOf = (id) => { const e = $('#' + id, root); return e && e.value != null ? String(e.value) : ''; };
  const withLo = (state) => Object.assign({}, state, { lo: state.lo || [...libLeftOut()].sort((a, b) => a - b) });      // a saved filter keeps the shelves left out when it was saved
  let svReplace = false;
  const saveGo = () => {
    const name = valueOf('psSvName'); const daily = !!($('#psSvDaily', root) && $('#psSvDaily', root).checked); const state = withLo(fst);
    const r = psvSaveAs(SV, name, state, { daily, mode: st.mode, pf: { front: st.front, back: st.back, clean: st.clean }, day: isoDay(), ctx: fctx, replace: svReplace });
    if (r.error === 'taken') { svReplace = true; formMsg(PSV_ERRORS.taken + ' Press Replace to keep these choices under it instead.'); const b = $('[data-sv="savego"]', root); if (b) b.textContent = 'Replace'; return; }
    if (r.error) { formMsg(PSV_ERRORS[r.error]); return; }
    SV = r.data; saveSV(); svAct = r.filter.id; svShown = 0; svName = r.filter.name; svMsg = ''; svReplace = false; fst = psfNorm(r.filter.parts[0].s, fctx); persist(); showForm(''); refresh(); toast(`Saved “${r.filter.name}”.`, 'good', 2200);
  };
  const renameGo = () => { const f = svOf(); if (!f) return; const nm = valueOf('psSvName'); const r = psvRename(SV, f.id, nm); if (r.error) { formMsg(PSV_ERRORS[r.error]); return; } SV = r.data; saveSV(); svName = psvName(nm); showForm(''); refresh(); };
  const dropSV = async () => {
    const f = svOf(); if (!f) return; const yes = typeof confirmBox === 'function' ? await confirmBox('Delete this saved filter?', `<p>“${esc(f.name)}” is deleted from this browser. Your choices in the sections stay as they are.</p>`, 'Delete', 'danger') : true; if (!yes) return;
    SV = psvDelete(SV, f.id).data; saveSV(); svAct = ''; svShown = 0; svName = ''; showForm(''); refresh();
  };
  const svDo = async (k, el) => {
    const f = svOf(); const i = el && el.dataset ? +el.dataset.i : -1;
    if (k === 'saveopen') { svReplace = false; showForm(psxSaveFormHTML(svName, false, ''), 'save'); return; }
    if (k === 'savego') { saveGo(); return; } if (k === 'renamego') { renameGo(); return; } if (k === 'cancel') { svReplace = false; showForm(''); return; }
    if (k === 'rename' && f) { showForm(psxRenameFormHTML(f.name, ''), 'rename'); return; } if (k === 'delete') { await dropSV(); return; }
    if (k === 'openeditor') { const d = $('#psSvEd', root); if (d) { d.open = true; if (d.scrollIntoView) d.scrollIntoView({ block: 'center' }); } return; }
    if (!f) return;
    if (k === 'today') { clearTimeout(soon); draw({ daily: true }); return; }
    if (k === 'addpart') { const st2 = psfNorm(withLo(fst), fctx); const r = psvPartAdd(SV, f.id, st2, 'little', fctx); if (r.error) { svMsg = PSV_ERRORS[r.error]; refresh(); return; } SV = r.data; saveSV(); svMsg = ''; svShown = psvFind(SV, f.id).parts.length - 1; fst = st2; persist(); refresh(); const d = $('#psSvEd', root); if (d) d.open = true; return; }
    if (k === 'partrm') { const r = psvPartRemove(SV, f.id, i); if (r.error) { svMsg = PSV_ERRORS[r.error]; refresh(); return; } SV = r.data; saveSV(); svMsg = ''; svShown = 0; fst = psfNorm(psvFind(SV, f.id).parts[0].s, fctx); refresh(); return; }
    if (k === 'partedit' && f.parts[i]) { svShown = i; svMsg = ''; fst = psfNorm(f.parts[i].s, fctx); refresh(); toast(`Part ${i + 1} is in the sections. Change them, then keep them as that part.`, 'good', 2800); return; }
    if (k === 'partupdate') { const st2 = psfNorm(withLo(fst), fctx); const r = psvPartSet(SV, f.id, svShown, st2, fctx); if (r.error) { svMsg = PSV_ERRORS[r.error]; refresh(); return; } SV = r.data; saveSV(); svMsg = ''; fst = st2; persist(); refresh(); drawSoon(); return; }
    if (k === 'back') { fst = psfNorm(f.parts[Math.min(svShown, f.parts.length - 1)].s, fctx); persist(); refresh(); drawSoon(); return; }
    if (k === 'stop') { leaveSV(); refresh(); }
  };
  const offs = []; const on = (target, ev, fn, cap) => { if (target && target.addEventListener) { target.addEventListener(ev, fn, cap); offs.push(() => target.removeEventListener && target.removeEventListener(ev, fn, cap)); } };
  /* where the person's last action was, in the controls or on the card: it decides what stays on the screen when the card changes (holdView) */
  const whereIs = (e) => { try { const t = e && e.target; acted = t && t.closest && t.closest('#psSide') ? 'controls' : 'card'; } catch (err) { acted = 'card'; } };
  on(root, 'click', whereIs, true); on(root, 'change', whereIs, true); on(root, 'keydown', whereIs, true);
  on(root, 'toggle', (e) => { const d = e.target; if (!d || !d.open || !d.id) return; if (d.id === 'psSecR') makeTree(); else if (d.id === 'psSecB') makeShelves(); }, true);
  on(root, 'change', (e) => {
    const t = e.target; const d = t && t.dataset; const id = t && t.id;
    if (d && d.svw !== undefined && svOf()) { const r = psvPartWeight(SV, svAct, +d.svw, t.value); if (r.data) { SV = r.data; saveSV(); refresh(); } return; }
    if (d && d.svdaily !== undefined && svOf()) { const r = psvSetDaily(SV, svAct, t.checked); if (r.data) { SV = r.data; saveSV(); refresh(); } return; }
    if (d && d.opt !== undefined && t.type === 'checkbox') { const v = String(d.opt); const i = v.indexOf('|'); applyOpt(v.slice(0, i), v.slice(i + 1), t.checked); return; }
    if (d && d.psf === 'dated') { setState(Object.assign({}, fst, { dated: t.checked }), 'soon'); return; }
    if (id === 'psB') {
      const typed = String(t.value || '').trim().toLowerCase(); const seen = new Map(); facts.forEach((f) => seen.set(f.title, (seen.get(f.title) || 0) + 1)); const label = (f) => (seen.get(f.title) > 1 ? `${f.title} · ${psuShelfName(gname[f.group] || '')}` : f.title);
      const hit = typed ? facts.find((f) => label(f).toLowerCase() === typed) || (facts.filter((f) => label(f).toLowerCase().startsWith(typed)).length === 1 ? facts.find((f) => label(f).toLowerCase().startsWith(typed)) : null) : null;
      const m = $('#psBMsg', root);
      if (hit) { if (m) m.textContent = ''; t.value = ''; const r = $('#psBres', root); if (r) { r.hidden = true; r.innerHTML = ''; } const bl = $('#psBlist', root); if (bl) bl.hidden = false; applyOpt('b', hit.id, true); } else if (typed && m) m.textContent = 'No book of that name. Type a few letters and choose one from the list.';
      return;
    }
    if (d && d.pf !== undefined) { if (d.pf === 'front') st.front = t.checked; else if (d.pf === 'back') st.back = t.checked; else if (d.pf === 'clean') st.clean = t.checked; savePrefs(); refresh(); draw(); return; }
    if (id === 'psS') { setSrc(t.value); return; }
  });
  on(root, 'input', (e) => {
    const t = e.target; const id = t && t.id; if (id === 'psSvName') { if (svReplace) { svReplace = false; const b = $('[data-sv="savego"]', root); if (b) b.textContent = 'Save'; formMsg(''); } return; } if (id !== 'psRq' && id !== 'psB') return;
    if (id === 'psRq') { const res = $('#psRres', root); const tr = $('#psTree', root); const q = String(t.value || ''); if (res) { res.hidden = !q.trim(); res.innerHTML = q.trim() ? psxFindHTML(model(), q) : ''; } if (tr) tr.hidden = !!q.trim(); }
    else { const res = $('#psBres', root); const bl = $('#psBlist', root); const q = String(t.value || ''); if (res) { res.hidden = !q.trim(); res.innerHTML = q.trim() ? psxBookFind(model(), q) : ''; } if (bl) bl.hidden = !!q.trim(); }
  });
  leftOutWire(root, () => { const bx = $('#psBoxes', root); recount(); if (bx) bx.innerHTML = psxAreaBoxes(model()); refresh(); drawSoon(); });
  on(root, 'keydown', (e) => {
    if (e.target && e.target.id === 'psCode' && e.key === 'Enter') { e.preventDefault(); replayCode(); }
    if (e.target && e.key === 'Enter' && (e.target.id === 'psMxText' || e.target.id === 'psMxDate' || e.target.id === 'psMxNums')) { e.preventDefault(); if (e.target.id === 'psMxText') drawText(); else if (e.target.id === 'psMxDate') drawDate(); else typedDice(); }
    if (e.target && (e.target.id === 'psYa' || e.target.id === 'psYb') && e.key === 'Enter') { e.preventDefault(); addYears(); }
    if (e.target && e.target.id === 'psSvName') { if (e.key === 'Enter') { e.preventDefault(); if (svForm === 'rename') renameGo(); else saveGo(); } else if (e.key === 'Escape') { svReplace = false; showForm(''); } }
  });
  on(root, 'click', async (e) => {
    const t = e.target; if (!t || !t.closest) return;
    const me = t.closest('[data-meth]'); if (me) { methDo(me.dataset.meth, me); return; }
    const sa = t.closest('[data-saved]'); if (sa) { applySaved(sa.dataset.saved); return; }
    const sd = t.closest('[data-sv]'); if (sd) { svDo(sd.dataset.sv, sd); return; }
    const md = t.closest('[data-mode]'); if (md) { setMode(md.dataset.mode === 'page' ? 'page' : md.dataset.mode === 'pages' ? 'pages' : 'passage'); return; }
    const pr = t.closest('[data-preset]'); if (pr) { const s = psfPreset(pr.dataset.preset, fctx); if (s) setState(s, 'now', true); return; }
    const op = t.closest('button[data-opt]'); if (op) { const v = String(op.dataset.opt); const i = v.indexOf('|'); applyOpt(v.slice(0, i), v.slice(i + 1), op.getAttribute('aria-pressed') !== 'true'); return; }
    const rm = t.closest('[data-rm]'); if (rm) { removeOne(rm.dataset.rm); return; }
    const off = t.closest('[data-off]'); if (off) { takeOff(off.dataset.off); return; }
    const pf = t.closest('[data-psf]'); if (pf) { const k = pf.dataset.psf; if (k === 'base') setState(Object.assign({}, fst, { base: fst.base === 'sources' ? 'all' : 'sources' }), 'now'); else if (k === 'clear') { only = ''; paintHow(); setState(Object.assign(psfBlank(), { base: fst.base }), 'now', true); } else if (k === 'yadd') addYears(); return; }
    const jx = t.closest('[data-x]'); if (jx) { const id = String(jx.dataset.x); setState(Object.assign({}, fst, { x: fst.x === id ? '' : id }), 'soon'); return; }      // one of the Journey's traditions, one at a time; pressed again, it comes off
    const ln = t.closest('[data-len]'); if (ln) { setSize(ln.dataset.len); return; }
    const ex = t.closest('[data-ex]'); if (ex) { const nd = ex.closest('.psgx-nd'); const kids = nd && nd.querySelector('.psgx-kids'); if (!kids) return; const open = ex.getAttribute('aria-expanded') !== 'true'; if (open && !kids.innerHTML) { const node = FX.nodeBySel[ex.dataset.ex]; if (node) kids.innerHTML = psxKidsHTML(node, model()); } ex.setAttribute('aria-expanded', String(open)); kids.hidden = !open; return; }
    const eb = t.closest('[data-exb]'); if (eb) { const nd = eb.closest('.psgx-nd'); const kids = nd && nd.querySelector('.psgx-kids'); if (!kids) return; const open = eb.getAttribute('aria-expanded') !== 'true'; if (open && !kids.innerHTML) kids.innerHTML = psxBookRows(model(), +eb.dataset.exb); eb.setAttribute('aria-expanded', String(open)); kids.hidden = !open; return; }
    if (t.closest('#psAll')) { setState(Object.assign({}, fst, { a: allAreas.filter((a) => a[2] && !libLeftOut().has(a[0])).map((a) => a[0]) }), 'soon'); return; } if (t.closest('#psNone')) { setState(Object.assign({}, fst, { a: [] }), 'soon'); return; } if (t.closest('#psReplay')) { replayCode(); return; }
    const un = t.closest('[data-unkeep]'); if (un) { const k = keptList(); k.splice(+un.dataset.unkeep, 1); store.set('passage.kept', k); renderKept(); return; }
    const hi = t.closest('[data-hist]'); if (hi) { const i = +hi.dataset.hist; if (SS.hist[i]) { SS.at = i; show(SS.hist[i]); } return; }
    const a = t.closest('[data-psg]'); if (a && a.dataset.psg === 'next') { draw(); return; } if (!a || !cur) return; const act = a.dataset.psg;
    if (act === 'next') draw(); else if (act === 'back') step(-1); else if (act === 'fwd') step(1); else if (act === 'more') readOn();
    else if (act === 'book') thisBook(); else if (act === 'free') freeBook(); else if (act === 'src') setSrc(st.src === 'timing' ? 'secure' : 'timing');
    else if (act === 'relmore') moreFrom(String(a.dataset.sel || ''));
    else if (act === 'rels') { const box = $('#psRelMore', root); if (box) { const open = a.getAttribute('aria-expanded') !== 'true'; box.hidden = !open; a.setAttribute('aria-expanded', String(open)); } }      // "+2": the other religions of the book, in the row
    else if (act === 'about') aboutText();
    else if (act === 'similar') { const sm = $('#psSim', root); const tx = await TXT.load(cur.id); simShow(sm, psgClean(simContext(tx && tx.secs[cur.si] ? tx.secs[cur.si][1] : '', cur.text, 1500)), { from: cur.id }); sm.scrollIntoView({ block: 'start', behavior: 'smooth' }); }
    else if (act === 'cite' && typeof citeOpen === 'function') { citeOpen({ id: cur.id, heading: cur.kind === 'verses' ? '' : psuHeading(cur.heading), verses: cur.kind === 'verses' ? cur.ref.cite : '', page: cur.kind === 'verses' ? '' : (cur.ref.pages || ''), printed: !!(cur.ref && cur.ref.pages) }); }      // the Cite dialog: a verse range is cited by its name, a page only where the text has its printed pages
    else if (act === 'keep') { const k = keptList(); if (!k.some((x) => x.id === cur.id && x.si === cur.si && x.text === cur.text)) { k.unshift({ id: cur.id, si: cur.si, p: cur.p, heading: cur.heading, text: cur.text, ref: cur.ref.cite, at: isoDay() }); store.set('passage.kept', k.slice(0, 60)); toast('Kept. Find it below.', 'good'); renderKept(); } }
    else if (act === 'copy') { const ok = typeof rdCopy === 'function' ? await rdCopy(citeText(cur)) : false; toast(ok ? 'Copied with a citation.' : 'Could not copy here. Select the text instead.', ok ? 'good' : 'warn'); }
    else if (act === 'clip' && notebookOn()) { const r = await NB.clip({ id: cur.id, text: psgClean(cur.text), s: cur.si, p: cur.p, heading: psuHeading(cur.heading), page: cur.ref.pages || '', title: cur.ref.cite }); const el = $('#psNb', root); if (r && r.ok && el) el.textContent = 'in your notebook'; }
    else if (act === 'ask' && typeof askOpen === 'function') { askOpen({ text: psgClean(cur.text), cite: citeText(cur).split('\n').slice(1).join('\n'), label: 'This passage, ' + cur.ref.cite }); }      // the Reader's panel: it copies a ready-made prompt and opens the AI's own site; nothing is sent from here
    else if (act === 'code') { const r = cur.rc; try { await navigator.clipboard.writeText(psgCode(cur.id, r.len, r.seed)); toast('Draw code copied.', 'good'); } catch (err) { toast('Could not copy here. Select the code instead.', 'warn'); } }
  });
  /* Space or N draws again; the arrows go through what was shown. Nothing happens while a field, a button or a link has the keys. */
  if (typeof document !== 'undefined' && document && typeof document.addEventListener === 'function') {
    const onKey = (e) => {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey || root.isConnected === false) return; const t = e.target; const typing = t && t.closest && t.closest('input,textarea,select,[contenteditable="true"],[role="dialog"],dialog'); if (typing) return;
      const onControl = t && t.closest && t.closest('button,a,summary,[role="button"]'); acted = 'card';      // a key press is about the card
      if ((e.key === ' ' || e.code === 'Space') && !onControl) { e.preventDefault(); draw(); } else if (e.key === 'n' || e.key === 'N' || e.key === 'r' || e.key === 'R') { e.preventDefault(); draw(); }
      else if (e.key === 'b' || e.key === 'B') { e.preventDefault(); thisBook(); }      // Another from this book
      else if (e.key === 'ArrowLeft' && !onControl) step(-1); else if (e.key === 'ArrowRight' && !onControl) step(1);
    };
    on(document, 'keydown', onKey);
  }
  const smBox = $('#psSim', root); if (smBox) simWire(smBox, (c) => { location.hash = '#/path/similar?b=' + c.it.id + '&q=' + encodeURIComponent(psgClean(c.ps.text).slice(0, 700)); });
  renderKept(); timing();
  let helpNow = rtGet().help; const onHelp = () => { const h2 = rtGet().help; if (h2 === helpNow) return; helpNow = h2; if (cur) show(cur, true); renderKept(); };      // Word help changed in the Aa panel: draw the passage again
  window.addEventListener('rt:change', onHelp); pathOnLeave(() => { clearTimeout(soon); window.removeEventListener('rt:change', onHelp); offs.forEach((f) => f()); RANDT.stop(); });
  if (typeof ATLD !== 'undefined' && ATLD && typeof ATLD.need === 'function') { try { ATLD.need('index', 'texts').then(() => { if (cur) enrich(cur, (BEATLAB_TEXTS.data[cur.id] || {}).secs || []); }, () => {}); } catch (e) { /* no Atlas data */ } }
  const rp = query.code ? psgParseCode(query.code) : null;
  if (rp && meta[rp.id] && LIB_BY_ID[rp.id]) { $('#psCode', root).value = psgCode(rp.id, rp.len, rp.seed); draw({ replay: rp, meth: query.meth }); } else draw({ daily: !!(startSV && startSV.daily) });
}
if (typeof module !== 'undefined' && module.exports) module.exports = { psgCloseOnRoute, psgWhoOf, psgWhoHTML, psgTies, psgKindWords, psgPeriodOf, psgEditionOf, psgAboutLine, PSG_KIND_WORDS, PSG_KIND_ORDER, psgHoldDelta, psgAreasFrom, psgCode, psgParseCode, psgBelow, psgStreamOf, psgChooseBook, englishScore, psgUsable, pickPassage, psgWindow, psgStarts, psgApparatus, psgBlocks, psgNumberedAreNotes, psgGlossaryLike, psgAcademic, psgListLike, psgGarbled, psgTidy, psgMatterSections, psgHeadSegs, psgPassageOk, psgBridge, psgContents, psgAllCaps, psgNoteParas, psgUndottedNotes, psgPickUnit, psgPickLeaf, psgMatterParts, psgReadOn, psgRefOf, psgVerseOk, psgKey, psgPoolOf, psgInSources, psgNever, psgFromOf, psgContextOf, psgFacts, psgFilterOpts, psgLegacyBooks, PSG_LEN, PSG_UNIT, PSG_PLEN, PSG_SIZES, PSG_SRC, PSG_SRC_V, psgPSize, psgSizeAsked, psgSrcPref, psgNewSeed };
