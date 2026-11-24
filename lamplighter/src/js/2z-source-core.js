/* ═══════════════════════════ 2z · Where a text comes from, and where its original pages are ═══════════════════════════
   Pure functions (tests/source.test.js). A text in the Library is one of a few kinds, and the reader says which, plainly, because it changes how far the words can be trusted and where the printed pages are:
     scan    machine-read (OCR) from a scan of the printed book on the Internet Archive: some words are wrong, and the printed page numbers are not kept. The scan itself has every page, and the Internet Archive
             can search inside it, so a passage can be sent there to be found on its page (provFindURL).
     typed   typed or proofread from the printed book (Project Gutenberg, Wikisource, a typed reading edition): the words are reliable, and the printed page numbers are in the source's own web edition.
     bible   a Bible version from eBible.org, with chapters and verses.
     web     a document published on a site of its own (a university press, an archive, the UN).
     own     a text the reader added, kept only in this browser.
   Nothing here fetches anything: the links are for the reader to follow, and only https links are ever made. The quotation a reader copies is built here too (provCite), with the title, the section, the edition
   (the translator and year as the Library gives them) and where it came from, so a passage can be traced back to its page. */
const PROV_HOSTS = { 'archive.org': 'Internet Archive', 'gutenberg.org': 'Project Gutenberg', 'ebible.org': 'eBible.org', 'suttacentral.net': 'SuttaCentral', 'wikisource.org': 'Wikisource', 'sacred-texts.com': 'Sacred Texts', 'archives.gov': 'U.S. National Archives', 'un.org': 'United Nations' };
const PROV_COPY = /; a typed copy of the printed edition$/;
const provHttps = (u) => { try { return new URL(String(u)).protocol === 'https:' ? String(u) : ''; } catch (e) { return ''; } };
function provHostName(u) {
  try { const h = new URL(String(u)).hostname.replace(/^www\./, ''); const k = Object.keys(PROV_HOSTS).find((x) => h === x || h.endsWith('.' + x)); return k ? PROV_HOSTS[k] : h; } catch (e) { return ''; }
}
/* the Internet Archive identifier in a details or download address (https://archive.org/details/<id>, /download/<id>/…) */
function provArchiveId(u) { const m = /^https:\/\/(?:www\.)?archive\.org\/(?:details|download|stream)\/([A-Za-z0-9._-]+)/.exec(String(u || '')); return m ? m[1] : ''; }
/* what kind of source a text has, from its meta (the licence line and the address) and the id */
function provKind(id, meta) {
  const m = meta || {}; const lic = String(m.license || ''); const src = String(m.src || '');
  if (/^u-/.test(String(id))) return 'own';
  if (/ebible\.org/i.test(src) || /^[bndo]-/.test(String(id)) && /ebible/i.test(src)) return 'bible';
  if (/OCR/.test(lic) || /Internet Archive’s OCR|scan of an edition/i.test(lic)) return 'scan';
  if (/archive\.org\/(details|download)/.test(src) && !/typed|Gutenberg/i.test(lic)) return 'scan';
  if (/gutenberg\.org|wikisource\.org|suttacentral\.net/i.test(src) || /typed copy|Gutenberg|Wikisource/i.test(lic)) return 'typed';
  return 'web';
}
/* the whole picture for one text: its kind, where it is from, and the scans (one for a book, several for a text made from several volumes) */
function provInfo(id, meta, entry) {
  const m = meta || {}; const kind = provKind(id, m); const src = provHttps(m.src); const host = provHostName(src) || (entry && entry.source) || '';
  const scans = [];
  if (kind === 'scan') {
    const parts = entry && Array.isArray(entry.parts) ? entry.parts : [];
    parts.forEach((p) => { const sid = provArchiveId(p.page) || provArchiveId((p.files && p.files[0] && p.files[0].url) || ''); if (sid && !scans.some((s) => s.id === sid)) scans.push({ id: sid, label: p.label || '', page: 'https://archive.org/details/' + sid }); });
    if (!scans.length) { const sid = provArchiveId(src); if (sid) scans.push({ id: sid, label: '', page: 'https://archive.org/details/' + sid }); }
  }
  const copy = kind === 'typed' && PROV_COPY.test(String(m.license || ''));      // a typed copy that names its printed edition: the source, if it has one, is where the same edition can be found
  return { id, kind, host, src, by: String(m.by || ''), licence: String(m.license || ''), scans, ocr: kind === 'scan', copy, pageNumbers: kind === 'scan' ? 'scan' : kind === 'typed' ? (copy ? 'none' : 'web') : kind === 'bible' ? 'verses' : 'none' };
}
const PROV_KIND_NAME = { scan: 'Scan of the printed book', typed: 'Typed from the printed book', bible: 'Bible version', web: 'Published document', own: 'Your own text' };
/* one plain sentence for the strip at the top of a text, and a shorter label for a badge */
function provNotice(info, printed) {      // printed: the text has its printed page numbers marked (2z-pages-core.js)
  if (!info) return '';
  const where = info.host ? ` (${info.host})` : '';
  if (info.kind === 'scan' && printed) return `Machine-read from a scan of the printed book${where}, so some words are wrong. The printed page numbers are marked in the text (as p. 214), found from the scan. Every original page is in the scan.`;
  if (info.kind === 'scan') return `Machine-read from a scan of the printed book${where}, so some words are wrong, and the printed page numbers are not kept here. Every original page is in the scan.`;
  if (info.kind === 'typed' && info.copy) return `Typed from the printed book. The words are checked, though spelling and punctuation may be tidied.${info.host ? ` The same edition is at ${info.host}.` : ''}${printed ? ' The printed page numbers are marked in the text (as p. 214).' : ''}`;
  if (info.kind === 'typed' && printed) return `Typed from the printed book${where}. The words are checked, though spelling and punctuation may be tidied. The printed page numbers are marked in the text (as p. 214)${info.host ? ', from the source’s web edition' : ''}.`;
  if (info.kind === 'typed') return `Typed from the printed book${where}. The words are checked, though spelling and punctuation may be tidied${info.host ? '; the source’s web edition keeps the printed page numbers' : ''}.`;
  if (info.kind === 'bible') return `A Bible version${where}, with its chapters and verses.`;
  if (info.kind === 'own') return 'A text you added. It stays in this browser.';
  return info.host ? `A document published by ${info.host}.` : '';
}
const provBadge = (info) => (info ? { scan: 'Machine-read scan', typed: 'Typed', bible: 'Verses', web: 'Document', own: 'Yours' }[info.kind] || '' : '');
/* the first words of a passage as a search phrase: markers, headings and punctuation gone; long enough to be found, short enough that OCR errors further on do not matter */
function provPhrase(text, words) {
  const n = Math.max(3, Math.min(12, words || 8)); const t = String(text == null ? '' : text).replace(/\[\[\d+\]\]/g, ' ').replace(/^#+\s*/gm, '').replace(/[“”"]/g, ' ').replace(/[‘’']/g, (q, at, s) => (provLetterAt(s, at - 1, true) && provLetterAt(s, at + 1, false) ? q : ' ')).replace(/’/g, "'").replace(/[^\p{L}\p{N}'\- ]+/gu, ' ').replace(/\s+/g, ' ').trim();      // an apostrophe inside a word stays (straight, as the scans print it); one that is not between two letters is a quotation mark and goes. (Looked at by hand, not with a look-behind in the pattern: Safari before 16.4 cannot parse one, and the whole page stopped, AA-03 of ALPHA_AUDIT.md.)
  return t.split(' ').filter(Boolean).slice(0, n).join(' ');
}
/* is the whole character just before (back) or just after (not back) position i of s a letter? A letter outside the basic plane counts. */
function provLetterAt(s, i, back) {
  if (back) { if (i < 0) return false; if (i > 0 && s.charCodeAt(i) >= 0xDC00 && s.charCodeAt(i) <= 0xDFFF) i--; } else if (i >= s.length) return false;
  const cp = s.codePointAt(i); return cp != null && /\p{L}/u.test(String.fromCodePoint(cp));
}
/* the Internet Archive page that searches inside a scan for the phrase (a link only; the reader opens it): '' when there is no scan or no phrase */
function provFindURL(scan, phrase) { const id = scan && scan.id; const q = provPhrase(phrase, 8); if (!id || !q || !/^[A-Za-z0-9._-]+$/.test(id)) return ''; return 'https://archive.org/details/' + id + '?q=' + encodeURIComponent(q); }
/* the quotation a reader copies: the words, then the title, the section, the edition as the Library gives it, and where the text is from */
function provCite(id, title, heading, quote, meta, o) {
  const m = meta || {}; const q = String(quote == null ? '' : quote).replace(/\s+/g, ' ').trim(); const info = provInfo(id, m, o && o.entry);
  const head = String(heading || '').replace(/\s+/g, ' ').trim();
  const pg = String((o && o.page) || '').replace(/\s+/g, ' ').trim().slice(0, 40);
  let line = '— ' + (title || id) + (head ? ', ' + head : '') + (pg ? ', ' + pg : '');
  const ed = []; if (info.by) ed.push(info.by.replace(/\.$/, ''));
  const kindBit = info.kind === 'scan' ? 'machine-read from a scan' : info.kind === 'typed' ? 'typed from the printed book' : info.kind === 'bible' ? 'Bible version' : '';
  const from = [kindBit, info.host].filter(Boolean).join(', ');
  let out = `“${q}”\n${line}`; if (ed.length) out += '\n' + ed.join('. ') + '.';
  const where = (o && o.link) || (info.scans[0] && info.scans[0].page) || info.src;
  if (from || where) out += '\n' + (from ? from.charAt(0).toUpperCase() + from.slice(1) : 'Source') + (where ? ': ' + where : '') + '.';
  return out;
}
/* ── How the page was reached, and what follows from it (ALPHA_AUDIT.md AA-01, AA-07, AA-21) ── */
/* where this copy of the app is: 'file' (a page opened from a folder on this computer), 'local' (a server on this computer) or 'web' (a website). `loc` is the page's location; a test passes its own. */
function copyWhere(loc) {
  const l = loc || (typeof location !== 'undefined' ? location : null) || {};
  if (l.protocol !== 'http:' && l.protocol !== 'https:') return 'file';
  const h = String(l.hostname || '').toLowerCase().replace(/^\[|\]$/g, '');
  return h === 'localhost' || h === '127.0.0.1' || h === '::1' || /\.localhost$/.test(h) ? 'local' : 'web';
}
/* what to say when files that should be next to the page could not be loaded. On a web address there is no folder for a visitor to keep, and the likely cause is the connection, so that is what is said;
   from a file the wording about the folder stays. `folder` is HTML (the wording for a file), and so is the answer. */
const LOAD_FAIL_WEB = 'This could not be loaded. Are you offline? Try again when you are connected.';
const loadFailText = (folder, loc) => (copyWhere(loc) === 'file' ? folder : LOAD_FAIL_WEB);
/* a text file is `BEATLAB_TEXTS.add("id",{meta},[[heading, text], …]);` written in JSON's own syntax (tools/build_texts.py uses json.dumps), so it can be read as data with JSON.parse and no script:
   { meta, secs }, or null when the file is not of that shape (the caller then loads it as a script). */
function txtParse(src, id) {
  const head = 'BEATLAB_TEXTS.add('; const s = String(src).trim();
  if (s.slice(0, head.length) !== head || s.slice(-2) !== ');') return null;
  const body = s.slice(head.length, -2); const lead = JSON.stringify(id) + ',{'; let a = null;
  try {      // the usual shape: the meta, then the sections; each is read on its own, so the sections (nearly all of the file) are not copied into one string first
    const cut = body.startsWith(lead) ? body.indexOf('},[[') : -1;
    if (cut > 0) a = [id, JSON.parse(body.slice(lead.length - 1, cut + 1)), JSON.parse(body.slice(cut + 2))];
  } catch (e) { a = null; }
  if (!a) { try { a = JSON.parse('[' + body + ']'); } catch (e) { return null; } }
  return a.length === 3 && a[0] === id && a[1] && typeof a[1] === 'object' && Array.isArray(a[2]) ? { meta: a[1], secs: a[2] } : null;
}
/* the size of some texts as a person reads it ("about 1.5 GB", "about 66 MB"); characters stand for bytes (the files are a little bigger) */
function txtSizeLabel(chars) { const mb = (+chars || 0) / 1e6; return 'about ' + (mb >= 950 ? (mb / 1000).toFixed(1) + ' GB' : Math.max(1, Math.round(mb)) + ' MB'); }
/* a text of more than this many characters is a long download on a website: the reader says so before it opens it (AA-21) */
const TXT_BIG = 5e6;
const txtIsBig = (meta, loc) => !!meta && (+meta.chars || 0) > TXT_BIG && copyWhere(loc) === 'web';
/* the search of every text asks first (AA-01): on a website it downloads the whole library, and from a file it can use several GB of memory (see memStop). Only that scope asks, never on a server of this computer
   (there each text is read as data and let go), and only until the person has said yes in this visit. */
const srchAskFirst = (scope, okAll, loc) => scope === '' && !okAll && copyWhere(loc) !== 'local';
/* ── the memory guard: what a page opened from a file could not fix (ALPHA_AUDIT.md AA-01, second round) ──
   A text that is loaded as a script is kept by the engine for as long as the page stays open. Measured on a page opened from a file (headless Brave 158, 21 Nov 2026): taking the script out of the page, or running it in a throw-away
   frame and removing the frame, then fifteen more full collections and a call for memory, all left the same 653 MB of 30 texts in place (about 2.8 bytes for each character; 4.4 GB for the whole library); a worker cannot read
   the file at all. A page opened from a folder cannot fetch its neighbours, so there a scan of every text cannot let its texts go: it has to stop before the tab runs out. Two signals say when:
   - what the browser says (performance.memory, in Chrome, Edge and Brave). Measured the same day: a normal Chrome-family browser freezes that reading (10 MB while 800 MB were allocated; only a browser started with
     --enable-precise-memory-info, or the one in this app's preview pane, reports it live), so it cannot be the only signal;
   - what this page has loaded as scripts: each text counts once (the engine does not keep a second copy of a script it has already seen), at 2.8 bytes for each character of the text. That works in every browser.
   A scan stops when either says about 2.5 GB, or 60% of the engine's own limit when that is lower. `mem` is performance.memory (or a stand-in in a test), `heldChars` the characters of the texts loaded as scripts. */
const MEM_STOP = 2.5e9; const MEM_PER_CHAR = 2.8;
function memStop(mem) { if (!mem || !(+mem.usedJSHeapSize >= 0)) return 0; const lim = +mem.jsHeapSizeLimit; return lim > 0 ? Math.min(MEM_STOP, Math.round(lim * 0.6)) : MEM_STOP; }
const memEstimate = (heldChars) => Math.round((+heldChars || 0) * MEM_PER_CHAR);
function memOver(mem, heldChars) { const stop = memStop(mem); if (stop > 0 && +mem.usedJSHeapSize >= stop) return true; return memEstimate(heldChars) >= (stop || MEM_STOP); }
if (typeof module !== 'undefined' && module.exports) module.exports = { PROV_HOSTS, PROV_KIND_NAME, provHttps, provHostName, provArchiveId, provKind, provInfo, provNotice, provBadge, provPhrase, provFindURL, provCite, provLetterAt, copyWhere, LOAD_FAIL_WEB, loadFailText, txtParse, txtSizeLabel, TXT_BIG, txtIsBig, srchAskFirst, MEM_STOP, MEM_PER_CHAR, memStop, memEstimate, memOver };
