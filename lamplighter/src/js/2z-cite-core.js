/* ═══════════════════════════ 2z · Citing a text: Chicago, BibTeX and RIS ═══════════════════════════
   Pure functions (tests/cite.test.js). One normalised record per source (citeRecord), and three writers from it: citeChicago (a note and a bibliography entry), citeBibTeX and citeRIS, so a person who studies a text
   can cite it in the form a paper, Zotero, EndNote or LaTeX takes. The record is built from what the Library holds for the text (the edition statement `by`, the title, the licence line and the source address in
   BEATLAB_TEXTS.meta, and the section and printed page the reader is at) and from nothing else: a field that is not known is left out, never guessed.
   What the Library records. It has no separate author, translator or year fields: the edition is one line of free text, mostly in the shape  Name, Title (Place: Publisher, Year).  citeParseBy reads that shape where it is
   plain, and where one reading is certain; whatever it does not read stays whole in the record's `note`, so nothing is lost and nothing is made up. The year is the year of the edition the Library hosts (the first year of
   the imprint, unless the statement names more than one edition), never a date of composition: those are disputed and the tool does not rule (the neutral stance). A name is turned round (Family, Given) only when every
   word of it is a plain capitalised name or an initial; any other is kept as the Library writes it.
   A scan is machine-read, so a citation names the printed edition and gives a page only where the text has its printed page marks (2z-pages-core.js). That the text was read in the app is a separate line, "Accessed
   through The Lamplighter Project, release …", with the day taken from the device's clock when the person exports (never stored). A Bible is cited by chapter and verse. Nothing is fetched, and no address is made up: a
   record's address is the text's own source address (https only, as provHttps says), and the app's own is left out while APP.url is empty. */
const CITE_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const CITE_APP_TITLE = 'The Lamplighter Project';
const CITE_FORMATS = [['chicago', 'Chicago'], ['bibtex', 'BibTeX'], ['ris', 'RIS']];
const citeSp = (s) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
const citeEsc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const citeSrc = () => (typeof provInfo === 'function' ? { provInfo, provHttps } : require('./2z-source-core.js'));      // in the page the source rules are in scope; in a test they are required
const CITE_Y = '(?:1[0-9]{3}|20[0-2][0-9])';
const CITE_YSPEC = CITE_Y + '(?:\\s*[–-]\\s*(?:' + CITE_Y + '|\\d{2}))?';      // 1901, 1896–1903, 1907–12
const citeYearsIn = (s) => (String(s).match(new RegExp('\\b' + CITE_Y + '\\b', 'g')) || []);

/* ── names ── */
const CITE_HONOR = /^(Sir|Dr\.?|Rev\.?|Mr\.?|Mrs\.?|Prof\.?|Saint|St\.?|Brother|Father|Lady|Lord|Swami|Sri|Shri|Mahatma|Pandit|Maulana|Sheikh|Shaykh|Imam|Rabbi|Mother|Sister|Bishop|Archbishop|Cardinal|Pope|King|Queen|Emperor|Jr\.?|Sr\.?|II|III|IV)$/;
const CITE_PARTICLE = /^(?:al-|el-|ibn$|bin$|ben$|bar$|van$|von$|de$|del$|della$|di$|da$|du$|des$|der$|den$|ter$|ten$|la$|le$|ap$|à$|y$|e$|d'|l')/i;
const CITE_TITLEWORD = /^(?:the|a|an|in|to|on|for|with|from|into|or|by|at|as|is|are|was|upon|concerning|being|his|her|their|its|our|your|about|against|between|through)$/i;
const CITE_UC = /^[ʿʾ'‘’]?\p{Lu}[\p{L}\p{M}.'’ʿʾ-]*$/u;
/* a name written the way it is cited: family and given are set only for the plain case (two to five words, each a capitalised name or an initial), so a name with a title, a particle, or one name only is never turned
   round by a guess: it is kept as the Library writes it */
function citeName(full) {
  const f = citeSp(full); if (!f) return null; const t = f.split(' ');
  const plain = t.length >= 2 && t.length <= 5 && t.every((w) => CITE_UC.test(w) && !CITE_HONOR.test(w)) && !/[,;:()]/.test(f);
  return plain ? { full: f, family: t[t.length - 1], given: t.slice(0, -1).join(' ') } : { full: f };
}
const citeInParens = (s) => (String(s || '').match(/\(([^()]*)\)/g) || []).join(' ');
/* whether a stretch of the edition statement is a person's name: plain, or (with particles, one "of", an honorific, one name only) when its last word is also named in the brackets of the Library's own title for the
   text, which is where the Library puts the author and the translator ("(Teresa of Ávila, trans. Lewis, 1913)") */
function citeIsPerson(s, libTitle) {
  const f = citeSp(s); if (!f) return false;
  const al = /^(.+?)\s+\(([\p{Lu}][\p{L}\p{M}.'’ʿʾ -]{0,50})\)$/u.exec(f); if (al) return citeIsPerson(al[1], libTitle);      // Shway Yoe (Sir James George Scott)
  if (/[\d:;()?!]/.test(f) || f.length > 60) return false; let t = f.split(' ');
  if (/^(The|A|An|Le|La|Les|Der|Die|Das|Il|El)$/.test(t[0])) return false;
  while (t.length > 2 && CITE_HONOR.test(t[0])) t = t.slice(1);      // Sir Edwin Arnold → Edwin Arnold
  if (t.length >= 2 && citeName(t.join(' ')).family) return true;
  if (t.length > 7 || !CITE_UC.test(t[0]) || !CITE_UC.test(t[t.length - 1])) return false;
  let of = 0; const ok = t.every((w, i) => { if (w === 'of') { of++; return of === 1 && i > 0 && i < t.length - 1; } if (CITE_TITLEWORD.test(w)) return false; return CITE_UC.test(w) || CITE_PARTICLE.test(w) || CITE_HONOR.test(w); });
  if (!ok) return false; const last = t[t.length - 1].replace(/^.*-/, '').replace(/[.,]$/, '');
  return last.length > 2 && new RegExp('(^|[^\\p{L}])' + last.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '($|[^\\p{L}])', 'u').test(citeInParens(libTitle));
}
/* "A and B", "A, B and C", "A & B" → names (null when any piece is not a person) */
function citeNames(s, libTitle) {
  const t = citeSp(s); const others = /,?\s+and others$/.test(t);
  const parts = t.replace(/,?\s+and others$/, '').split(/\s*(?:,\s+and\s+|\s+and\s+|\s+&\s+)\s*/).filter(Boolean); if (!parts.length || parts.length > 4) return null;
  const out = []; for (const p of parts) { if (!citeIsPerson(p, libTitle)) return null; out.push(citeName(p)); } if (others) out.push({ full: 'others', others: true }); return out;      // "and others": kept as a last name that says so, never dropped
}

/* ── the edition statement ── */
const citeTop = (s) => { const out = []; let d = 0; let cur = ''; for (const c of s) { if (c === '(') d++; if (c === ')') d--; if (c === ',' && d === 0) { out.push(cur); cur = ''; } else cur += c; } out.push(cur); return out.map((x) => x.trim()); };
const citeRange = (s) => citeSp(s).replace(/\s*[–-]\s*/, '–');
/* the imprint (the bracket with the place, the publisher and the year): { place, publisher, year, rest }. It is read only when it begins with a place that has no comma in it (or with the year), and the year is
   taken only when the bracket does not name another edition; else nothing is taken and the statement is kept whole */
const CITE_SMALL = new Set(['and', 'upon', 'on', 'in', 'de', 'du', 'la', 'le', 'am', 'an', 'der', 'the', 'at', 'of', 'al', 'el', 'des', 'sur']);
/* a place: one to six capitalised words (a few small words allowed between them), at most one comma ("Cambridge, Mass."); a name like "Grace Warrack" is also two capitalised words, so the form with no publisher
   (Place, Year) is taken only for a place that the Library gives elsewhere with a publisher (places: a Set made by citePlaces): "(Loeb, 1914)" is a series, "(Grace Warrack, 1901)" a person */
const citePlaceOk = (x) => { const t = citeSp(x).split(' '); return t.length >= 1 && t.length <= 6 && (x.match(/,/g) || []).length <= 1 && /^\p{Lu}/u.test(t[0]) && t.every((w) => /^\p{Lu}[\p{L}\p{M}.'’-]*,?$/u.test(w) || CITE_SMALL.has(w)) && !/\b(?:translated|edited|printed|published|about|first|by)\b/i.test(x); };
function citeImprint(p, places) {
  const s = citeSp(p); const out = { place: '', publisher: '', year: '', edition: '', rest: '' };
  const PFX = '((?:[^()]*?(?:vols?\\.|volumes?|parts?|series|no\\.|bulletin)\\s*[0-9IVXLC][0-9IVXLC ,and–&-]*[,;]\\s*)?)';      // a series and volume in front (Sacred Books of the East, vol. 25, Oxford: …): not read, so the statement stays whole
  let m = new RegExp('^' + PFX + '([^:;()]+?):\\s*([^:;()]+?),\\s*(' + CITE_YSPEC + ')(.*)$', 'i').exec(s); let pub = true;
  if (!m) { m = new RegExp('^' + PFX + '([^:;(),]+?)()(?:,\\s*|\\s+)(' + CITE_YSPEC + ')(.*)$', 'i').exec(s); pub = false; }
  if (!m) { m = new RegExp('^()()()(' + CITE_YSPEC + ')(.*)$').exec(s); pub = false; if (m) { m[2] = ''; } }
  if (!m) return out;
  if (m[2] && !citePlaceOk(m[2])) { const tr = /^translated by (.+)$/i.exec(m[2]); if (tr) out.translated = tr[1]; return out; }
  if (m[2] && !pub && !(places && places.has(citeSp(m[2]).toLowerCase()))) return out;
  const front = citeSp(m[1]); const rest = citeSp(front + ' ' + m[5]); out.rest = rest; const more = citeYearsIn(m[5]);
  const same = !more.length || /^(?:edition|printing)?\s*;\s*(?:this printing|first published(?: in)?|first edition|originally published(?: in)?)\s/.test(citeSp(m[5])) || /^(?:edition of the|reprint of the)\s/.test(citeSp(m[5])) || /^(?:edition|printing)\s*(?:;|$)/.test(citeSp(m[5]));
  if (!same) return out;
  out.year = citeRange(m[4]); out.place = citeSp(m[2]); out.publisher = citeSp(m[3]); out.edition = '';
  const em = /,\s*((?:first|second|third|fourth|fifth|sixth|seventh|eighth|new|revised|enlarged|popular|cheap)(?:\s+and\s+\w+)?\s+edition)$/i.exec(out.publisher); if (em) { out.edition = em[1]; out.publisher = citeSp(out.publisher.slice(0, em.index)); }      // "(London: Macmillan, second edition, 1907)": the edition is not the publisher
  if (/:/.test(rest) || /\b(?:and|&)\s+\p{Lu}[^,]*$/u.test(out.publisher) && /,\s*(?:and|&)\s/.test(out.publisher)) out.publisher = '';
  return out;
}
/* the places the Library itself gives with a publisher (Place: Publisher, Year) over a set of texts: the one list of places the form with no publisher is checked against */
function citePlaces(metaMap) {
  const set = new Set(); const rx = new RegExp('\\(([^:;()]+?):\\s*[^:;()]+?,\\s*' + CITE_YSPEC + '[^()]*\\)', 'g'); const m = metaMap || {};
  Object.keys(m).forEach((id) => { const by = citeSp(m[id] && m[id].by); let x; rx.lastIndex = 0; while ((x = rx.exec(by))) { const pl = citeSp(x[1]); if (citePlaceOk(pl)) set.add(pl.toLowerCase()); } });
  return set;
}
const CITE_ROLE = /\s*\((editors?|eds?\.|translators?|trans\.)(?:\s+and\s+(editors?|translators?))?([^()]*)\)$/;
/* the whole statement → { authors, editors, translators, title, place, publisher, year, edition, complete, parsed }. complete: everything in the statement is in a field; parsed: the fields that were read from it.
   places: what citePlaces gives (optional) */
function citeParseBy(by, libTitle, places) {
  const out = { authors: [], editors: [], translators: [], title: '', place: '', publisher: '', year: '', edition: '', volumes: '', complete: false, parsed: [] };
  const s = citeSp(by).replace(/\s*;\s*Project Gutenberg #\d+(?:(?:,\s*|\s+and\s+)#?\d+)*/g, '').replace(/\s*\(Project Gutenberg #[^)]*\)/g, ''); if (!s) return out;      // the Project Gutenberg numbers belong to the address: they are not years
  const wb = /^World English Bible \((\d{4}) stable text\)$/.exec(s);
  if (wb) { out.title = 'World English Bible'; out.edition = wb[1] + ' stable text'; out.year = wb[1]; out.complete = true; out.parsed = ['title', 'edition', 'year']; return out; }
  /* the imprint: the last bracket at the top level that reads as one (or, in "(translated by X, 1924)", the translator and the year of the translation) */
  let at = -1; let end = -1; let inner = ''; let tby = ''; let impEd = '';
  { let d = 0; let st = -1; const groups = [];
    for (let i = 0; i < s.length; i++) { if (s[i] === '(') { if (d === 0) st = i; d++; } else if (s[i] === ')' && d > 0) { d--; if (d === 0) groups.push([st, i]); } }
    for (let k = groups.length - 1; k >= 0; k--) {
      const body = s.slice(groups[k][0] + 1, groups[k][1]); const im = citeImprint(body, places); const tm = new RegExp('^translated by ([^;:()]+?),\\s*(' + CITE_YSPEC + ')$', 'i').exec(body);
      if (im.year) { at = groups[k][0]; end = groups[k][1]; inner = body; out.year = im.year; out.place = im.place; out.publisher = im.publisher; impEd = im.edition; break; }
      if (tm) { at = groups[k][0]; end = groups[k][1]; inner = body; out.year = citeRange(tm[2]); tby = tm[1]; break; } } }
  let pre = s; let post = ''; let clean = false;
  if (at >= 0) { pre = s.slice(0, at).replace(/[\s,:]+$/, ''); post = s.slice(end + 1).trim(); clean = !post && !(tby ? '' : citeImprint(inner, places).rest); ['year', 'place', 'publisher'].forEach((k) => { if (out[k]) out.parsed.push(k); }); }
  const segs = citeTop(pre); const first = segs[0] || ''; const rest = segs.slice(1).join(', ');
  const role = CITE_ROLE.exec(first); const nameText = role ? first.slice(0, role.index) : first;
  let people = segs.length > 1 ? citeNames(nameText, libTitle) : null; let title = pre; let all = clean;
  if (!people && role && segs.length > 1 && nameText.split(' ').length <= 8 && !/[\d:;()]/.test(nameText)) people = [{ full: citeSp(nameText) }];      // the Library itself says it is an editor or a translator
  const maybeName = segs.length > 1 && !people && /^[‘']?\p{Lu}/u.test(first) && first.split(' ').length <= 5 && !/^(The|A|An|Le|La|Les|Der|Die|Das|Il|El|On|De|Of)\b/.test(first) && !/[:;]/.test(first);      // a first word or two that may be a name the rules could not confirm: the title is then not taken from the statement
  if (people) {
    if (role) { const a = /^ed/.test(role[1]); const b = role[2] ? /^ed/.test(role[2]) : null; if (a || b) { out.editors = people; out.parsed.push('editors'); } if (!a || b === false) { out.translators = people.slice(); out.parsed.push('translators'); } if (citeSp(role[3])) all = false; } else { out.authors = people; out.parsed.push('authors'); }
    title = rest;
  }
  if (tby) { const names = citeNames(tby, libTitle); if (names) { out.translators = out.translators.concat(names); out.parsed.push('translators'); } else all = false; }
  title = citeSp(title);
  const tr = /,\s*translated\s+(?:[^,()]*?\s+)?by\s+([^,()]+?)(?=,|$)/i.exec(title);
  if (tr) { const names = citeNames(tr[1], libTitle); if (names) { out.translators = out.translators.concat(names); title = citeSp(title.slice(0, tr.index) + title.slice(tr.index + tr[0].length)); if (!out.parsed.includes('translators')) out.parsed.push('translators'); } else all = false; }
  const ed = /,\s*(?:edited\s+by|eds?\.)\s+([^,()]+?)(?=,|$)/i.exec(title);
  if (ed) { const names = citeNames(ed[1], libTitle); if (names) { out.editors = out.editors.concat(names); title = citeSp(title.slice(0, ed.index) + title.slice(ed.index + ed[0].length)); if (!out.parsed.includes('editors')) out.parsed.push('editors'); } else all = false; }
  const postOk = !post || /^[;:]/.test(post) || /^,?\s*(?:vols?\.|volumes?|parts?|pp?\.|books?|tracts?|chap)/i.test(post);      // text after the imprint that goes on with the title (", The Confessions …") means the title is not before it
  const bad = /\((?:trans|translator|translators|editor|editors|ed\.|eds\.|introduction)/i.test(title) || /^\p{Ll}/u.test(title) || /;\s*this (?:edition|copy|printing|volume)/.test(title);
  if (at < 0 && segs.length > 1 && /\s\([^()]*\)$/.test(title) && !/[;]|\(.*\(/.test(title.replace(/\s\([^()]*\)$/, ''))) { title = citeSp(title.replace(/\s\([^()]*\)$/, '')); all = false; }      // a last bracket that is not an imprint (a magazine and a month, a series) stays in the note only
  const ev = /,\s*((?:two|three|four|five|six|seven|eight|nine|ten|\d+)\s+(?:volumes?|vols?\.))$/i.exec(title); if (ev) { out.volumes = ev[1]; title = citeSp(title.slice(0, ev.index)); }
  const ee = /,\s*((?:first|second|third|fourth|fifth|sixth|seventh|eighth|new|revised|enlarged|abridged|popular|American|English)(?:\s+and\s+\w+)?\s+edition(?:,\s*(?:revised|enlarged|corrected)(?:\s+throughout)?)?)$/i.exec(title); if (ee) { out.edition = ee[1]; title = citeSp(title.slice(0, ee.index)); }
  if (title && title.length <= 260 && !/^\(/.test(title) && !maybeName && !bad && postOk && (at >= 0 || (segs.length > 1 && !/[();]/.test(title)))) { out.title = title; out.parsed.push('title'); if (out.volumes) out.parsed.push('volumes'); if (out.edition) out.parsed.push('edition'); } else { all = false; out.volumes = ''; out.edition = ''; }
  if (post) all = false;
  if (impEd && !out.edition) { out.edition = impEd; out.parsed.push('edition'); }
  out.complete = all && !!out.title; return out;
}
/* when the statement cannot give the title, the Library's own title with the bracket that holds the author and the year taken out of it */
const citeLibTitle = (t, names, by) => {
  let x = citeSp(t).replace(/\s*\([^()]*\b(?:1[0-9]{3}|20[0-2][0-9])\b[^()]*\)/, ''); (names || []).forEach((n) => { if (n && n.full) x = x.replace('(' + n.full + ')', ''); });
  const b = citeSp(by).toLowerCase(); x = x.replace(/\s*\(([^()]+)\)(?=[^()]*$)/, (m, c) => { const w = citeSp(c).toLowerCase(); return w && b.startsWith(w) && /^(?:,| \(|$)/.test(b.slice(w.length)) ? '' : m; });      // the last bracket of the title is the author when the statement begins with the same words
  return citeSp(x).replace(/\s+([,:;])/g, '$1');
};

/* ── the record ── */
const citeIso = (d) => { const x = d instanceof Date && !isNaN(d) ? d : new Date(); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); };
const citeDay = (iso) => { const m = /^(\d{4})-(\d\d)-(\d\d)$/.exec(iso || ''); return m ? CITE_MONTHS[+m[2] - 1] + ' ' + (+m[3]) + ', ' + m[1] : ''; };
const citeStamp = (rel) => (rel && typeof rel === 'object' && /^\d{4}-\d\d-\d\d-[0-9a-f]{6}$/.test(String(rel.stamp || '')) ? rel.stamp : '');
/* the printed page of a label as the reader makes it ("p. 214", "Vol. 2, p. 14", "pp. 214–215") → { volume, pages } */
function citePages(label) {
  const s = citeSp(label).slice(0, 60); const m = /^(?:(.+?),\s*)?pp?\.\s*([0-9ivxlcdm]+(?:\s*[–-]\s*[0-9ivxlcdm]+)?)$/i.exec(s); if (!m) return { volume: '', pages: '' };
  return { volume: m[1] ? citeSp(m[1]) : '', pages: m[2].replace(/\s*[–-]\s*/, '–') };
}
/* a Bible book and the reader's chapter heading ("Chapter 3") → "Jonah 3": chapter and verse, as a Bible is cited. Any other heading is kept as the Library gives it, with the book before it.
   With the verse numbers the text carries for the words (v1, and v2 for a range) a chapter becomes "Jonah 3:4" or "Jonah 3:4–6" (AA-11 of ALPHA_AUDIT.md); numbers that are not whole numbers from 1, or a range that runs backwards, are left out, never guessed. */
function citeBibleRef(book, heading, v1, v2) {
  const b = citeSp(book); const h = citeSp(heading); const m = /^(?:Chapter|Psalm)\s+(\d+)$/i.exec(h);
  if (m) { const ok1 = Number.isInteger(v1) && v1 >= 1; const ok2 = ok1 && Number.isInteger(v2) && v2 > v1; return (b === 'Psalms' ? 'Psalm' : b) + ' ' + m[1] + (ok1 ? ':' + v1 + (ok2 ? '–' + v2 : '') : ''); }
  return !h ? b : h.toLowerCase().includes(b.toLowerCase()) ? h : b + ', ' + h;
}
/* o: { title: the Library's title, heading: the section the words are in, page: the printed page label, verses: a Bible reference, entry: the originals entry, release: APP.release, now: a Date, link: the address to give }.
   Without heading, page and verses the record is the whole text */
function citeRecord(id, meta, o) {
  o = o || {}; const m = meta || {}; const S = citeSrc(); const info = S.provInfo(id, m, o.entry); const libTitle = citeSp(o.title || m.title || id);
  const p = info.kind === 'own' ? { authors: [], editors: [], translators: [], title: '', place: '', publisher: '', year: '', edition: '', complete: false, parsed: [] } : citeParseBy(m.by, m.title || o.title, o.places);
  const heading = citeSp(o.verses || o.heading); const pg = citePages(o.page);
  const rec = {
    id, kind: info.kind, type: info.kind === 'own' ? 'text' : 'book', title: p.title || citeLibTitle(libTitle, p.authors.concat(p.translators, p.editors), m.by) || id, titleFrom: p.title ? 'statement' : 'library',
    authors: p.authors, editors: p.editors, translators: p.translators, year: p.year, publisher: p.publisher, place: p.place, edition: p.edition, volumes: p.volumes,
    section: info.kind === 'bible' && !heading ? libTitle : heading, volume: info.kind === 'bible' ? '' : pg.volume, pages: info.kind === 'bible' ? '' : pg.pages,      // a Bible is cited by chapter and verse, never by a page
    url: S.provHttps(o.link) || info.src || (info.scans[0] ? info.scans[0].page : ''), host: info.host,
    accessed: citeIso(o.now), through: CITE_APP_TITLE, release: citeStamp(o.release), note: p.complete ? '' : citeSp(m.by), parsed: p.parsed.slice(),
  };
  return rec;
}
/* the app itself: a corporate author, the release stamp and its year; the address only if the app has one (APP.url, https) */
function citeAppRecord(app, now) {
  const a = app || {}; const stamp = citeStamp(a.release); const S = citeSrc();
  return { id: 'app', kind: 'app', type: 'software', title: CITE_APP_TITLE, titleFrom: 'app', authors: [{ full: CITE_APP_TITLE, corporate: true }], editors: [], translators: [], year: stamp ? stamp.slice(0, 4) : '', publisher: '', place: '', edition: stamp ? 'Release ' + stamp : '', volumes: '',
    section: '', volume: '', pages: '', url: S.provHttps(a.url) || '', host: '', accessed: citeIso(now), through: '', release: stamp, note: 'An offline research application; it runs in the reader’s own browser.', parsed: [] };
}
const citeThrough = (r) => (r.through ? 'Accessed through ' + r.through + (r.release ? ', release ' + r.release : '') + (r.accessed ? ', ' + citeDay(r.accessed) : '') + '.' : (r.accessed ? 'Accessed ' + citeDay(r.accessed) + '.' : ''));

/* ── Chicago ── */
const CIT_I = '\u0001';
const citeDir = (n) => n.full;
const citeInv = (n) => (n.family ? n.family + ', ' + n.given : n.full);
const citeSplit = (ns) => ({ list: ns.filter((n) => !n.others), etal: ns.some((n) => n.others) });      // "and others" is kept as a last name that says so
function citeListBib(ns) { const { list, etal } = citeSplit(ns); if (!list.length) return ''; if (list.length === 1 && !etal) return citeInv(list[0]); const shown = list.length > 10 ? list.slice(0, 7) : list; const head = citeInv(shown[0]); const rest = shown.slice(1).map(citeDir); if (etal || list.length > 10) return [head].concat(rest).join(', ') + ', et al.'; return rest.length === 1 ? head + ', and ' + rest[0] : head + ', ' + rest.slice(0, -1).join(', ') + ', and ' + rest[rest.length - 1]; }
function citeListNote(ns) { const { list, etal } = citeSplit(ns); const d = list.map(citeDir); if (!d.length) return ''; if (etal || d.length >= 4) return d[0] + ' et al.'; if (d.length === 1) return d[0]; if (d.length === 2) return d[0] + ' and ' + d[1]; return d[0] + ', ' + d[1] + ', and ' + d[2]; }
const citeEnd = (s) => (/[.!?”’"]$/.test(s) ? s : s + '.');
const citeCap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const citeItal = (t) => CIT_I + String(t).replace(/\u0001/g, '') + CIT_I;
const citeImprintText = (r) => { const pp = r.place && r.publisher ? r.place + ': ' + r.publisher : r.place || r.publisher; return pp && r.year ? pp + ', ' + r.year : pp || r.year || ''; };
/* the note (form 'note') and the bibliography entry (form 'bib'). The note carries the section and the printed page; the bibliography entry is the whole text. text uses *asterisks* for italics (as Markdown does); html has <i> */
function citeChicago(rec, form) {
  const r = rec; const bib = form === 'bib'; const parts = []; const bible = r.kind === 'bible'; const app = r.kind === 'app';
  const sameAsTitle = r.authors.length === 1 && r.authors[0].corporate && r.authors[0].full === r.title;      // a body that is named only by its title: the entry begins with the title
  const lead = r.authors.length ? (sameAsTitle ? [] : r.authors) : r.editors; const leadEd = !r.authors.length && r.editors.length > 0;
  const edLabel = (ns) => (ns.length > 1 || ns.some((n) => n.others) ? 'eds.' : 'ed.');
  const mid = []; if (r.translators.length) mid.push(bib ? 'Translated by ' + citeListNote(r.translators) : 'trans. ' + citeListNote(r.translators));
  if (r.authors.length && r.editors.length) mid.push(bib ? 'Edited by ' + citeListNote(r.editors) : 'ed. ' + citeListNote(r.editors));
  const title = citeItal(r.title); const imp = bible ? '' : app ? r.year : citeImprintText(r);
  const loc = [r.volume ? r.volume.replace(/^Vol\./, 'vol.') : '', r.pages].filter(Boolean).join(', ');
  if (bib) {
    if (lead.length) parts.push(citeEnd(citeListBib(lead) + (leadEd ? ', ' + edLabel(lead) : '')));
    parts.push(citeEnd(title)); mid.forEach((t) => parts.push(citeEnd(t))); if (r.edition) parts.push(citeEnd(citeCap(r.edition))); if (r.volumes) parts.push(citeEnd(citeCap(r.volumes)));
    if (imp) parts.push(citeEnd(imp)); if (r.url) parts.push(r.url + '.');
  } else {
    let s = bible ? (r.section ? r.section + ', ' : '') + title : (lead.length ? citeListNote(lead) + (leadEd ? ', ' + edLabel(lead) : '') + ', ' : '') + title;
    mid.forEach((t) => { s += ', ' + t; }); if (r.edition && !bible && !app) s += ', ' + r.edition;
    const paren = bible ? r.edition : app ? [r.edition, r.year].filter(Boolean).join(', ') : imp; if (paren) s += ' (' + paren + ')';
    if (!bible && r.section) { const after = [loc, r.url].filter(Boolean); s += ', “' + r.section.replace(/[.,;:\s]+$/, '') + (after.length ? ',” ' + after.join(', ') : '.”'); }
    else { const after = [bible ? '' : loc, r.url].filter(Boolean); if (after.length) s += ', ' + after.join(', '); }
    parts.push(citeEnd(s));
  }
  const th = citeThrough(r); if (th) parts.push(th);
  const body = bib && app && r.edition ? parts.map((x) => x) : parts;
  return { text: body.join(' ').replace(/\u0001/g, '*'), html: citeEsc(body.join(' ')).replace(/\u0001([^\u0001]*)\u0001/g, '<i>$1</i>') };
}

/* ── BibTeX ── */
const citeBibEsc = (s) => String(s == null ? '' : s).replace(/\\/g, '\u0002').replace(/[{}&%$#_]/g, '\\$&').replace(/\^/g, '\\^{}').replace(/~/g, '\\~{}').replace(/\u0002/g, '\\textbackslash{}');
const citeBibName = (n) => (n.corporate ? '{' + citeBibEsc(n.full) + '}' : n.family ? citeBibEsc(n.family) + ', ' + citeBibEsc(n.given) : '{' + citeBibEsc(n.full) + '}');
const citeBibNames = (ns) => { const { list, etal } = citeSplit(ns); return list.map(citeBibName).join(' and ') + (etal ? ' and others' : ''); };      // BibTeX's own word for it
const citeFold = (s) => String(s || '').normalize('NFD').replace(/\p{M}/gu, '').replace(/[^A-Za-z0-9]+/g, '').toLowerCase();
const CITE_STOP = new Set(['the', 'a', 'an', 'of', 'on', 'in', 'and', 'or', 'to', 'for', 'from', 'with', 'by', 'at', 'as', 'its', 'his', 'her']);
const citeWord = (t, skip) => { const w = String(t || '').split(/[^\p{L}\p{N}]+/u).filter((x) => x && !CITE_STOP.has(x.toLowerCase())); return citeFold(w[skip || 0] || ''); };
/* a key from the first author's family name (or the first word of the title), the year and a word of the title; the same record always gives the same key */
function citeKey(rec) {
  const a = [].concat(rec.authors, rec.editors, rec.translators).filter((n) => !n.others)[0]; const fam = a && !a.corporate ? citeFold(a.family || a.full.split(' ').pop()) : '';
  const w1 = citeWord(rec.title, 0); const head = fam || w1 || 'item'; const w = rec.kind === 'bible' ? citeWord(rec.section, 0) : citeWord(rec.title, fam ? 0 : 1);      // a Bible's own word is its book
  return (head + (rec.year ? rec.year.slice(0, 4) : '') + (w && w !== head ? w : '')).slice(0, 48) || 'item';
}
/* the keys a bibliography gets: the first of a key keeps it plain, the later ones get a, b, c … */
const citeLetters = (n) => { let t = ''; while (n > 0) { n--; t = String.fromCharCode(97 + (n % 26)) + t; n = Math.floor(n / 26); } return t; };      // 1 → a, 26 → z, 27 → aa
function citeKeys(recs) { const seen = new Map(); return (Array.isArray(recs) ? recs : [recs]).map((r) => { const base = citeKey(r); const k = seen.get(base) || 0; seen.set(base, k + 1); return k ? base + citeLetters(k) : base; }); }
const citeUrlOk = (u) => (/^https:\/\/[^\s{}\\"<>]+$/.test(u) ? u : '');
const citeNote = (r) => [citeThrough(r), r.volumes ? citeCap(r.volumes) + '.' : '', r.kind === 'app' ? r.note : r.note ? 'Edition as the Library records it: ' + r.note : ''].filter(Boolean).join(' ');
function citeBibTeX(recs) {
  const list = Array.isArray(recs) ? recs : [recs]; const keys = citeKeys(list);
  return list.map((r, i) => {
    const part = !!r.section && r.kind !== 'app'; const type = r.kind === 'app' || r.kind === 'own' ? 'misc' : part ? 'incollection' : 'book';
    const f = []; const add = (k, v) => { if (v) f.push('  ' + k + ' = {' + v + '},'); };
    add('author', citeBibNames(r.authors)); add('editor', citeBibNames(r.editors)); add('translator', citeBibNames(r.translators));
    if (part) { add('title', '{' + citeBibEsc(r.section) + '}'); add('booktitle', '{' + citeBibEsc(r.title) + '}'); } else add('title', '{' + citeBibEsc(r.title) + '}');
    add('publisher', citeBibEsc(r.publisher)); add('address', citeBibEsc(r.place)); add(r.kind === 'app' ? 'version' : 'edition', citeBibEsc(r.edition)); add('year', citeBibEsc(r.year.replace('–', '--')));
    add('volume', citeBibEsc(r.volume.replace(/^vol\.?\s*/i, ''))); add('pages', citeBibEsc(r.pages.replace('–', '--')));
    add('url', citeUrlOk(r.url)); if (citeUrlOk(r.url) && r.accessed) add('urldate', r.accessed);
    add('note', citeBibEsc(citeNote(r)));
    return '@' + type + '{' + keys[i] + ',\n' + f.join('\n') + '\n}\n';
  }).join('\n');
}

/* ── RIS ── */
function citeRIS(recs) {
  const list = Array.isArray(recs) ? recs : [recs]; const L = '\r\n';
  return list.map((r) => {
    const part = !!r.section && r.kind !== 'app'; const ty = r.kind === 'app' ? 'COMP' : part ? 'CHAP' : r.kind === 'own' ? 'GEN' : 'BOOK'; const f = [['TY', ty]];
    const add = (k, v) => { const x = citeSp(v); if (x) f.push([k, x]); }; const nm = (n) => (n.family ? n.family + ', ' + n.given : n.full);
    r.authors.filter((n) => !n.others).forEach((n) => add('AU', nm(n))); r.editors.filter((n) => !n.others).forEach((n) => add('A2', nm(n))); r.translators.filter((n) => !n.others).forEach((n) => add('A4', nm(n)));
    if (part) { add('TI', r.section); add('T2', r.title); } else add('TI', r.title);
    add('PY', r.year); add('PB', r.publisher); add('CY', r.place); add('ET', r.edition); add('VL', r.volume.replace(/^vol\.?\s*/i, ''));
    if (r.pages) { const pp = r.pages.split('–'); add('SP', pp[0]); if (pp[1]) add('EP', pp[1]); }
    if (citeUrlOk(r.url)) { add('UR', r.url); if (r.accessed) add('Y2', r.accessed.replace(/-/g, '/') + '/'); }
    add('N1', citeNote(r));
    f.push(['ER', '']); return f.map(([k, v]) => k + '  - ' + v).join(L) + L;
  }).join(L);
}

/* ── one place for the dialog and the notebook ── */
/* the file a format is saved as: lamplighter-cite-<key>.bib, .ris or .txt */
function citeFile(fmt, key) { return { name: 'lamplighter-cite-' + (String(key || 'citation').replace(/[^A-Za-z0-9_-]/g, '') || 'citation') + (fmt === 'bibtex' ? '.bib' : fmt === 'ris' ? '.ris' : '.txt'), mime: fmt === 'ris' ? 'application/x-research-info-systems' : fmt === 'bibtex' ? 'application/x-bibtex' : 'text/plain' }; }
/* the texts a Markdown body cites: the ids of the places its links point to (#/path/read/<id>?…), once each, in the order they first appear */
function citeIdsIn(body) { const out = []; String(body == null ? '' : body).replace(/#\/path\/read\/([a-z]-[a-z0-9-]{1,60})(?=[?)\s\]"']|$)/g, (m, id) => { if (!out.includes(id)) out.push(id); return m; }); return out; }
/* a bibliography: one record per text, sorted by author or title so the keys do not depend on the order texts were cited in */
function citeSortKey(r) { const a = r.authors[0] || r.editors[0] || r.translators[0]; return citeFold((a ? (a.family || a.full) : r.title) + '|' + r.title + '|' + (r.year || '') + '|' + r.id); }
const citeSorted = (recs) => recs.slice().sort((a, b) => { const x = citeSortKey(a); const y = citeSortKey(b); return x < y ? -1 : x > y ? 1 : 0; });
/* a work cited through several of its texts is listed once: texts of the Library that are parts of one printed edition (the Upanishads of one volume) give records that are the same in every field but the id */
function citeUnique(recs) { const seen = new Set(); return recs.filter((r) => { const k = JSON.stringify(Object.assign({}, r, { id: '' })); if (seen.has(k)) return false; seen.add(k); return true; }); }
/* the Chicago entries of a bibliography, each once: the books of one Bible version are one work */
function citeChicagoList(recs) { const seen = new Set(); const out = []; citeSorted(recs).forEach((r) => { const c = citeChicago(r, 'bib'); if (!seen.has(c.text)) { seen.add(c.text); out.push(c); } }); return out; }
function citeBibliography(recs, fmt) {
  const list = citeSorted(citeUnique(recs));
  if (fmt === 'bibtex') return citeBibTeX(list); if (fmt === 'ris') return citeRIS(list);
  return citeChicagoList(list).map((c) => c.text).join('\n\n');
}
/* every text field of a record, for the test that none was made up */
const citeFields = (r) => [].concat(r.authors.filter((n) => !n.others).map((n) => n.full), r.editors.filter((n) => !n.others).map((n) => n.full), r.translators.filter((n) => !n.others).map((n) => n.full), [r.title, r.publisher, r.place, r.edition, r.volumes, r.year]).filter(Boolean);
if (typeof module !== 'undefined' && module.exports) module.exports = { CITE_FORMATS, CITE_APP_TITLE, citeBibleRef, citePlaces, citeListNote, citeListBib, citeName, citeIsPerson, citeNames, citeImprint, citeParseBy, citeLibTitle, citeRecord, citeAppRecord, citeThrough, citeChicago, citeBibTeX, citeRIS, citeKey, citeKeys, citePages, citeFile, citeIdsIn, citeBibliography, citeChicagoList, citeUnique, citeSorted, citeFields, citeDay, citeIso, citeStamp, citeBibEsc };
