/* ═══════════════════════════ 2z · The Library as a shelf: covers, short titles, sorting, and what kind of text each shelf holds ═══════════════════════════
   Pure functions (tests/library.test.js). A book in the Library has no picture, so its cover is made from what the Library knows: the colour of its collection (shifted a little by its own id so a shelf is not one
   block), the title in a book face, and the author or translator when the title names one. The covers are plain CSS, so nothing is fetched and the same book always has the same cover.
   LIB_STATUS says, for every shelf, what kind of text it holds: scripture, a canon some traditions keep and others do not, a historical source, a book about religion, fiction. Nothing is left out for being
   unverified or not canon; it is kept, labelled, and explained, here and at the top of each text. */
const LC_HUES = Array.from({ length: 17 }, (_, i) => Math.round((226 + ((i * 7) % 17) * (360 / 17)) % 360));      // one per collection (LIB_COLLECTIONS order), spread evenly round the wheel and stepped by 7 so neighbouring shelves are far apart
const LC_GLYPHS = ['◆', '✦', '◈', '❖', '✺', '❂', '✧', '⬡', '❋', '◇', '✶', '⬢', '❈', '✿', '✱', '◉', '✧'];
const lcHash = (s) => { let h = 2166136261; for (let i = 0; i < String(s).length; i++) { h ^= String(s).charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h >>> 0; };
const lcHsl = (h, s, l) => { s /= 100; l /= 100; const k = (n) => (n + h / 30) % 12; const a = s * Math.min(l, 1 - l); const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))); return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)]; };
const lcLum = (rgb) => { const f = (c) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(rgb[0]) + 0.7152 * f(rgb[1]) + 0.0722 * f(rgb[2]); };
const lcContrast = (a, b) => { const x = lcLum(a); const y = lcLum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const LC_INK = [251, 246, 234];      // the title colour on every cover (ivory)
/* a title that names its author in brackets ("The Call of Cthulhu (H. P. Lovecraft)") is the name and the byline */
function lcShortTitle(title) {
  const t = String(title == null ? '' : title).replace(/\s+/g, ' ').trim(); const m = /^(.*?)\s*\(([^()]{2,90})\)\s*$/.exec(t);
  if (m && m[1].length >= 3) return { name: m[1], by: m[2] };
  return { name: t, by: '' };
}
/* the cover for one book: two colours of a gradient, the glyph, the name and the byline. ci: the book's collection (an index), id: the book */
function lcCover(id, ci, title) {
  const c = Math.max(0, Math.min(LC_HUES.length - 1, ci | 0)); const hs = lcHash(id); const h1 = (LC_HUES[c] + (hs % 25) - 12 + 360) % 360; const h2 = (h1 + 22) % 360; let l1 = 27 + (hs >> 5) % 6; let a = lcHsl(h1, 46, l1); let b = lcHsl(h2, 52, l1 - 9);
  while (l1 > 12 && Math.min(lcContrast(LC_INK, a), lcContrast(LC_INK, b)) < 7.5) { l1--; a = lcHsl(h1, 46, l1); b = lcHsl(h2, 52, l1 - 9); }      // a yellow or a green is darker before ivory reads on it
  const l2 = l1 - 9; const t = lcShortTitle(title);
  return { c1: `hsl(${h1} 46% ${l1}%)`, c2: `hsl(${h2} 52% ${l2}%)`, rgb: [a, b], glyph: LC_GLYPHS[c % LC_GLYPHS.length], name: t.name, by: t.by, ink: `rgb(${LC_INK.join(',')})` };
}
/* the cover as one style attribute value */
const lcCoverStyle = (cv) => `--c1:${cv.c1};--c2:${cv.c2}`;
/* sorting a list of library entries: chronological (the Library's own order), A to Z by name, most recently read first, longest first */
const LC_SORTS = { time: 'Oldest first', az: 'A to Z', recent: 'Recently read', long: 'Longest first' };
function lcSort(rows, mode, ctx) {
  const c = ctx || {}; const idx = new Map(rows.map((l, i) => [l.id, i])); const key = (l) => lcShortTitle(l.title).name.replace(/^(the|a|an)\s+/i, '').toLowerCase();
  const out = rows.slice();
  if (mode === 'az') out.sort((a, b) => key(a).localeCompare(key(b)) || idx.get(a.id) - idx.get(b.id));
  else if (mode === 'recent') out.sort((a, b) => ((c.last && c.last[b.id]) || 0) - ((c.last && c.last[a.id]) || 0) || idx.get(a.id) - idx.get(b.id));
  else if (mode === 'long') out.sort((a, b) => ((c.chars && c.chars[b.id]) || 0) - ((c.chars && c.chars[a.id]) || 0) || idx.get(a.id) - idx.get(b.id));
  return out;
}
/* what kind of text a shelf (a group) holds. label: a short name for the kind; text: what to know before reading. */
const LIB_STATUS = {
  hb: ['Scripture', 'The 39 books of the Jewish Tanakh and the Christian Old Testament, in the Protestant count and order, in the World English Bible. Scripture for Jews and Christians; Muslims honour the Torah and the Psalms as earlier revelation.'],
  dc: ['A canon some keep', 'The deuterocanon: books in the Catholic and Orthodox Old Testaments that the Jewish canon and most Protestant Bibles leave out. Scripture to many Christians, valued history and devotion to others.'],
  or: ['A canon some keep', 'Books that some Orthodox and Ethiopian churches read as scripture and other Christians do not. They are here so no one has to guess what is in them.'],
  nt: ['Scripture', 'The 27 books of the Christian New Testament. Scripture for Christians; read by others as a historical source for the life and teaching of Jesus and the first churches.'],
  ps: ['Outside every large canon', 'Jewish and early Christian writings from about 300 BCE to 200 CE that are not in the Jewish canon or in most Christian ones (a few, such as 1 Enoch and Jubilees, are scripture in the Ethiopian Orthodox church). Not canon, but they show what people were reading and believing while the canons were forming.'],
  ds: ['A community’s library', 'The library of a Jewish community near Qumran and the nearby caves, from the 3rd century BCE to the 1st century CE: copies of biblical books, rules and hymns of the community, and commentaries. Scripture for no religion today; it shows Judaism before the Bible was fixed.'],
  ec: ['Outside the New Testament', 'Christian writing outside the New Testament, from the Apostolic Fathers and the Nag Hammadi library to the mystics and the Reformation. Some were widely read, some were condemned by their opponents, and many survive only because their opponents quoted them. Read the early ones as history, and read the notes.'],
  ju: ['Jewish tradition after the Bible', 'The Talmud and the rabbis’ writings, Kabbalah, medieval Jewish philosophy and the prayer books, with a Samaritan chronicle. Living texts of Judaism, still studied and argued over. The English here is from 1840 to 1930, so read it beside a modern guide.'],
  me: ['Ancient sources', 'Myths, hymns, laws and rituals of Sumer, Babylon, Assyria and Ugarit: among the oldest religious writing there is. No living scripture; useful for the world the Bible was written in. The English is old, and the field has moved on.'],
  eg: ['Ancient sources', 'Funerary texts, hymns and wisdom writings of ancient Egypt. A religion no longer practised as it was (with modern revivals). The translations are old and often free; read them beside a modern one if you can.'],
  in: ['Scripture, in old translations', 'Vedic and Hindu texts, living scripture for Hindus. The English here is from about 1850 to 1930 and often by outsiders, so it carries their views; read it beside a modern guide.'],
  bu: ['Scripture, in several canons', 'Buddhist texts. There is no single canon: the Pāli, Mahāyāna and Tibetan collections differ, and each school has its own. The English is a mix of older translations and modern open ones.'],
  ja: ['Scripture and commentary', 'Jain texts. The Jain scriptures were fixed in different forms by the Śvetāmbara and Digambara traditions, who disagree about which texts are authentic. The English is an older translation.'],
  sk: ['Scripture, in part', 'Selections from the Sikh scripture, the Guru Granth Sahib, and early studies of it. Sikhs treat the Granth as the living Guru, and a translation is never the scripture itself.'],
  ir: ['Scripture and later books', 'The Avesta, the surviving scripture of the Zoroastrians, with later Pahlavi books and Manichaean texts. The Avesta is a fragment of a larger lost collection; the Pahlavi books are later commentary, not scripture.'],
  ch: ['Classics and sources', 'The Confucian classics, Daoist books and Shinto sources. These traditions have no single scripture in the Western sense; the Library holds the books their followers have most honoured, in older translations.'],
  gr: ['Not scripture', 'Greek and Roman poets, philosophers, mystery cults and Stoics. Not scripture for any living religion, but they shaped how early Jews and Christians wrote and thought, and the old religions have modern followers.'],
  is: ['Scripture and its tradition', 'The Qur’an (in four old English translations: Muslims hold only the Arabic to be the Qur’an), the hadith (not scripture, but a second source of Muslim teaching) and Sufi writings.'],
  ne: ['Written down late', 'Norse, Celtic and Germanic sources, written down by Christians centuries after the pagan period. They are the best sources we have and unreliable as a record of what the pagans themselves believed.'],
  am: ['Colonial-era records', 'Texts from Mesoamerica and the Andes written during or after the Spanish conquest, often by or with Indigenous authors, sometimes under pressure. Read them with that in mind.'],
  na: ['Outsiders’ records', 'Records of North American Native traditions, most written down by outsiders (travellers, missionaries, ethnologists), some of ceremonies and societies that the peoples keep closed to outsiders today. Each says so in its note. Read them beside the peoples’ own accounts, and with respect.'],
  af: ['Observers’ records', 'Records of African religions, mostly by early outside observers or collected as folk tradition. Read them beside the living communities’ own accounts.'],
  pa: ['Observers’ records', 'Records of religion in the Pacific, Australia and the Philippines, mostly by early outside observers. Read them beside the living communities’ own accounts.'],
  mo: ['Modern movements', 'Writings of movements founded in the last two centuries, such as the Quakers and the Bahá’í Faith. How authoritative each text is depends on the movement.'],
  sc: ['About religion, not a source', 'Books scholars use to read all of the above: handbooks, histories, dictionaries. Not scripture and not primary sources; they are older scholarship and may be out of date.'],
  fr: ['Arguments and laws', 'Arguments and laws on who may decide what a person believes: edicts, treatises, declarations. Not scripture; they are the record of how people came to defend freedom of conscience.'],
  he: ['Not canon', 'Hermetic, alchemical and Rosicrucian writings. Not scripture for any large religion, and often not as old as they claim (the Hermetic books are from about 100 to 300 CE, not ancient Egypt). Historically important for how people have thought about God, matter and the self.'],
  oc: ['Not canon', 'Ceremonial magic, grimoires and divination. Texts of practitioners, often compilations with false claims to antiquity. They are here as sources on what people did and believed, not as accounts of what works.'],
  sp: ['Modern movements', 'Spiritualism, Theosophy and New Thought: nineteenth-century movements and their founders’ writings. Their claims are the movements’ own; how authoritative each book is varies within each movement.'],
  ms: ['A fraternity, not a religion', 'Freemasonry’s Old Charges, constitutions and histories. By its own account Freemasonry is not a religion, though it uses religious language. The printed exposures of its rituals, by former members and outsiders, are here too, labelled as exposures of unequal accuracy; members hold the working of the degrees private.'],
  si: ['Observers’ records', 'Field records of shamanic and animist religion in Siberia and the Arctic by early observers. Read them beside living communities’ own accounts.'],
  tb: ['Observers’ records', 'Field records of tribal and animist religion by early observers, in several continents. Read them beside living communities’ own accounts.'],
  fi: ['Folk belief, collected', 'Folk belief and folk tale from Britain and Ireland, written down by collectors, often in their own style. A record of belief, not scripture.'],
  fu: ['Folk belief, collected', 'European folklore and the study of folklore and custom. Collectors’ and scholars’ books about popular belief, not scripture.'],
  wi: ['Accusations, not confessions', 'Witch-trial records, demonology and histories of the witch hunts. Mostly written by accusers and inquisitors, so they record what the persecutors believed and what was forced out of the accused, not what the accused practised.'],
  ta: ['Folk tales, collected', 'Folk tales of Asia and the Middle East, collected between 1868 and 1924, mostly by outsiders and retold in their style. Not scripture.'],
  tf: ['Folk tales, collected', 'Folk tales of Africa and the African diaspora, collected mostly by outsiders and retold in their style. Not scripture.'],
  tm: ['Folk tales, collected', 'Folk tales of the Americas, collected mostly by outsiders and retold in their style. Not scripture.'],
  tp: ['Folk tales, collected', 'Folk tales of the Pacific and Australia, collected mostly by outsiders and retold in their style. Not scripture.'],
  im: ['Imagined, not evidence', 'Works of the imagination by known authors, written as literature and never meant as scripture. Kept apart and labelled so no one meets a passage out of context.'],
};
const lcStatus = (g) => { const s = LIB_STATUS[g]; return s ? { label: s[0], text: s[1] } : null; };
if (typeof module !== 'undefined' && module.exports) module.exports = { LC_HUES, LC_GLYPHS, LC_INK, lcHash, lcHsl, lcLum, lcContrast, lcShortTitle, lcCover, lcCoverStyle, LC_SORTS, lcSort, LIB_STATUS, lcStatus };
