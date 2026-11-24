/* ═══════════════════════════ 2z · The printed pages of a scanned text ═══════════════════════════
   Pure functions (tests/pages.test.js). The texts were made from the OCR of scans with their running heads and page numbers dropped, so a place in them had only the reader's own page count. A scholar cites
   the printed page of an edition and its section ("p. 214"), so tools/texts_pages.py asks the Internet Archive where every page of each scan begins and what number is printed on it, finds each page's
   first words in our text, and keeps the result beside the text (texts/pg-<id>.js, listed in texts/pgs.js, as the pictures are kept). A mark is a place in a paragraph where a printed page begins:
       [section, paragraph, [[offset, label], ...]]      offset: characters into the paragraph's visible text (0 = the paragraph begins on the new page), label: the printed number
   A label is an arabic or roman number, with a volume in front for a text of several volumes ("2:214"), and a ~ in front when the number is not one the Archive read from the page but one the numbers
   on either side prove ("~215"): the reader says which. A text is graded a, b or c by how much of it could be matched to its pages (below c nothing is kept).
   Nothing is drawn from a mark that is not well formed or does not lie inside the text, so a stale or damaged file can only fail to show markers, never show a wrong one. */
const PGM_RX = /^(~)?(?:([1-9]\d?):)?([1-9]\d{0,4}|[ivxlcdm]{1,12})$/;
const PGM_LIMIT = 400000;
const PGM_GRADES = { a: '', b: 'The page markers of this text are close but not exact in places: a few may sit a line or two off.', c: 'The page markers of this text are approximate: many sit a few lines off, and some pages have no marker.' };
const pgmOwn = (o, k) => Object.prototype.hasOwnProperty.call(o, k);

/* a label taken apart: { inferred, vol, num, roman }, or null if it is not one */
function pgmParse(label) {
  if (typeof label !== 'string') return null; const m = PGM_RX.exec(label); if (!m) return null;
  return { inferred: !!m[1], vol: m[2] ? +m[2] : 0, num: m[3], roman: /^[ivxlcdm]+$/.test(m[3]) };
}
/* the words for a label: "p. 214", "p. xii", "Vol. 2, p. 214" (the volume's own name, "Part 2", where the text has them) */
function pgmShort(label, vols) {
  const p = pgmParse(label); if (!p) return '';
  const v = p.vol ? (Array.isArray(vols) && typeof vols[p.vol - 1] === 'string' && vols[p.vol - 1] ? vols[p.vol - 1] : 'Vol. ' + p.vol) : '';
  return (v ? v + ', ' : '') + 'p. ' + p.num;
}
/* the sidecar's rows made safe: only whole numbers, only labels that parse, only places inside the text (nsecs sections), in reading order and without repeats. Returns { map, flat }:
   map: 'section:paragraph' → [[offset, label], ...]; flat: [[section, paragraph, offset, label], ...] in order, for finding the page at a place */
function pgmClean(rows, nsecs) {
  const flat = []; const map = new Map(); if (!Array.isArray(rows)) return { map, flat };
  for (const r of rows.slice(0, PGM_LIMIT)) {
    if (!Array.isArray(r) || r.length < 3 || !Number.isInteger(r[0]) || !Number.isInteger(r[1]) || r[0] < 0 || r[1] < 0 || (nsecs != null && r[0] >= nsecs) || !Array.isArray(r[2])) continue;
    for (const m of r[2]) { if (!Array.isArray(m) || !Number.isInteger(m[0]) || m[0] < 0 || m[0] > 5e6 || !pgmParse(m[1])) continue; flat.push([r[0], r[1], m[0], m[1]]); }
  }
  flat.sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2]);
  const out = []; for (const f of flat) { const l = out[out.length - 1]; if (l && l[0] === f[0] && l[1] === f[1] && l[2] === f[2]) continue; out.push(f); }
  for (const f of out) { const k = f[0] + ':' + f[1]; if (!map.has(k)) map.set(k, []); map.get(k).push([f[2], f[3]]); }
  return { map, flat: out };
}
/* the printed page a place in the text is on: the label of the last mark at or before it (section s, paragraph p, off characters in; off 0 is the start of the paragraph, where a mark at offset 0 counts),
   or '' before the first mark */
function pgmAt(flat, s, p, off) {
  const o = off > 0 ? off : 0; let lo = 0; let hi = flat.length - 1; let at = -1;
  while (lo <= hi) { const mid = (lo + hi) >> 1; const f = flat[mid]; if (f[0] < s || (f[0] === s && (f[1] < p || (f[1] === p && f[2] <= o)))) { at = mid; lo = mid + 1; } else hi = mid - 1; }
  return at >= 0 ? flat[at][3] : '';
}
/* every printed page that begins inside this paragraph or at its start, for its first words to be searched: the marks of the paragraph, in order */
const pgmIn = (map, s, p) => (map && map.get(s + ':' + p)) || [];
/* is the index entry for this text still for the text as it is now? entry: [marks, characters, sections, grade, volumes]; meta: the text's own meta ({ chars, n }). A rebuilt text moves paragraphs, so a stale file is not used. */
function pgmFits(entry, meta) {
  return Array.isArray(entry) && entry.length >= 4 && Number.isInteger(entry[0]) && entry[0] > 0 && pgmOwn(PGM_GRADES, entry[3]) && !!meta && entry[1] === meta.chars && entry[2] === meta.n;
}
/* the reader's note on how far to trust a text's markers: '' for the best grade */
const pgmNote = (grade) => (pgmOwn(PGM_GRADES, grade) ? PGM_GRADES[grade] : '');
/* a paragraph of plain text with the marks put in: marks are [[offset, label], ...] in visible-text offsets, mk(label) gives the text of one, vn(n) the text of a verse number (the paragraph may hold [[n]] markers,
   which are not counted in the offsets); a mark past the end comes last. Used by the saved copies (2z-export-core.js). */
function pgmWeave(raw, marks, mk, vn) {
  const ms = (marks || []).slice().sort((a, b) => a[0] - b[0]); const out = []; let pos = 0; let k = 0;
  for (const part of String(raw).split(/(\[\[\d+\]\])/)) {
    const v = /^\[\[(\d+)\]\]$/.exec(part); if (v) { out.push(vn(v[1])); continue; }
    let at = 0; while (k < ms.length && ms[k][0] < pos + part.length) { const o = Math.max(at, ms[k][0] - pos); out.push(part.slice(at, o), mk(ms[k][1])); at = o; k++; }
    out.push(part.slice(at)); pos += part.length;
  }
  while (k < ms.length) { out.push(mk(ms[k][1])); k++; }
  return out.join('');
}
/* a printed page asked for, as a person types it ("214", "p. 214", "pp 214", "xii", "vol 2 p 214", "2:214"): { num, vol } or null. A volume that is not given is 0 (any). */
function pgmAsk(text) {
  const t = String(text == null ? '' : text).toLowerCase().replace(/[.,]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 40);
  const m = /^(?:(?:vol|volume|part|v)\s*([1-9]\d?)\s*[:,]?\s*)?(?:pp?\s*)?(?:(\d{1,2}):)?\s*([1-9]\d{0,4}|[ivxlcdm]{1,12})$/.exec(t);
  if (!m) return null; const vol = +(m[1] || m[2] || 0); return { num: m[3], vol };
}
/* where a printed page begins: every mark of the text whose number (and volume, if asked) is this one, in reading order: [[section, paragraph, offset, label], ...] */
function pgmFind(flat, ask) {
  if (!ask || !Array.isArray(flat)) return [];
  return flat.filter((f) => { const p = pgmParse(f[3]); return p && p.num === ask.num && (!ask.vol || p.vol === ask.vol); });
}
/* what a number printed on a page is called when it is read or inferred */
const pgmKind = (label) => { const p = pgmParse(label); return p ? (p.inferred ? 'inferred from the numbers around it' : 'read from the page') : ''; };

if (typeof module !== 'undefined' && module.exports) module.exports = { PGM_RX, PGM_GRADES, PGM_LIMIT, pgmParse, pgmShort, pgmClean, pgmAt, pgmIn, pgmFits, pgmNote, pgmKind, pgmWeave, pgmAsk, pgmFind };
