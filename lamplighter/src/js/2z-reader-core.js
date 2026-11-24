/* ═══════════════════════════ 2z · The reader: where you are in a whole text ═══════════════════════════
   Pure arithmetic for the whole-text view. A "page" is a fixed amount of text (about 300 words), so a page number means the same on every screen and in every browser,
   and a reading place is a section and a paragraph, which is how marks and bookmarks are kept. rdPages turns one into the other.
   A page here is the reader's own and is not a printed page: the texts do not keep the printed page numbers (the builder drops them), so the reader says so wherever it shows
   a page, and points to where the printed pages are (rdPageNote). rdRef writes a place down in words a scholar can use: the text and edition, the section, the reader's page. */
const RD_PAGE = 1800;
function rdPages(secs, page = RD_PAGE) {
  const n = secs.length; const cum = []; let t = 0; for (const s of secs) { cum.push(t); t += String(s[1]).length; } cum.push(t);
  const total = Math.max(1, Math.ceil(t / page)); const blocks = (k) => String(secs[k][1]).split(/\n{2,}/);
  /* the character offset where paragraph p of section k begins, counting the blank line between paragraphs */
  const paraOff = (k, p) => { const bl = blocks(k); let o = 0; for (let x = 0; x < p && x < bl.length; x++) o += bl[x].length + 2; return cum[k] + o; };
  const pageAt = (k, p) => Math.min(total, Math.floor(paraOff(Math.max(0, Math.min(n - 1, k)), Math.max(0, p)) / page) + 1);
  /* the section and paragraph where a page begins (the paragraph that holds its first character) */
  const locate = (pg) => {
    if (!n) return { k: 0, p: 0 }; const off = (Math.max(1, Math.min(total, Math.round(+pg) || 1)) - 1) * page; let k = 0; while (k < n - 1 && cum[k + 1] <= off) k++;
    const bl = blocks(k); let o = cum[k]; let p = 0; for (; p < bl.length - 1; p++) { if (o + bl[p].length + 2 > off) break; o += bl[p].length + 2; } return { k, p };
  };
  /* the page of every paragraph of section k, worked out in one pass (pageAt would walk the section again for each): a break is drawn where the number goes up */
  const maps = new Map();
  const pageMap = (k) => {
    k = Math.max(0, Math.min(n - 1, k | 0)); let m = maps.get(k); if (m) return m; const bl = blocks(k); m = new Array(bl.length); let o = cum[k];
    for (let x = 0; x < bl.length; x++) { m[x] = Math.min(total, Math.floor(o / page) + 1); o += bl[x].length + 2; }
    maps.set(k, m); return m;
  };
  /* the page the last paragraph of the section before k is on (0 before the first section): a section that starts on a later page begins with a break */
  const lastPage = (k) => { if (!(k > 0) || !n) return 0; const m = pageMap(k - 1); return m.length ? m[m.length - 1] : 0; };
  return { n, cum, total, page, paraOff, pageAt, locate, pageMap, lastPage };
}
/* what a page number is, in a sentence, for each kind of text (from provInfo(...).pageNumbers in 2z-source-core.js): the reader's page is a guide, never the printed page */
const RD_PAGE_NOTE = {
  scan: 'The printed page numbers of this scan are not kept in the text. The scan has every page with its printed number: open it at this passage to see the page as printed.',
  web: 'The printed page numbers are in the source’s web edition, not in this copy of the text.',
  verses: 'A Bible is cited by chapter and verse, not by page.',
  none: 'The printed page numbers of this edition are not kept in the text.',
};
const rdPageNote = (kind) => RD_PAGE_NOTE[Object.prototype.hasOwnProperty.call(RD_PAGE_NOTE, kind) ? kind : 'none'];
/* a place, written down: the text and its edition, the section (number and name), the reader's page (and what that is), and where the text comes from.
   o: { title, by, section (1-based), sections, heading, page, pages, kind ('scan' | 'typed' | 'bible' | ...), src }. Nothing is invented: a part that is not known is left out. */
function rdRef(o) {
  const x = o || {}; const clean = (s) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim(); const lines = [];
  const title = clean(x.title); const by = clean(x.by).replace(/\.$/, ''); lines.push(title ? (by ? `${title} — ${by}` : title) : by);
  const heading = clean(x.heading); const sec = Math.floor(+x.section); const of = Math.floor(+x.sections);
  if (sec >= 1 && of >= 1 && sec <= of) lines.push(`Section ${sec} of ${of}${heading ? `, “${heading}”` : ''}`); else if (heading) lines.push(`Section “${heading}”`);
  const printed = clean(x.printed); if (printed) lines.push(`Printed edition: ${printed}`);
  const pg = Math.floor(+x.page); const pgs = Math.floor(+x.pages);
  if (x.kind !== 'bible' && pg >= 1) lines.push(`Reader page ${pg}${pgs >= pg ? ` of ${pgs}` : ''} (about 300 words a page, the same on every screen; not the printed page)`);
  const src = clean(x.src); if (/^https:\/\//.test(src)) lines.push(`Source: ${src}`);
  return lines.filter(Boolean).join('\n');
}

/* ── the contents list (UX-04 and UX-35 of UX_AUDIT.md, 18 November 2026) ──
   A section's title is what the builder made of the book's own heading, and in a scan it keeps what the OCR left in it: a leader and a page number ("Pali Words Discussed ..... 273"), a stray full stop after
   a space ("The Queen Offers the Gifts to Amon ."), a bracket that was never closed ("Career under Teti (1. 1"). rdTocLabel takes such things away and puts nothing in: it only deletes (at the end of the
   title, or a long run of dots in the middle turned into one ellipsis), and where nothing sensible would be left it gives the title as it was. The text, and the heading above each section, are not touched. */
const RD_NUM = '(?:[0-9][0-9IlOo]*(?:\\s?[-–—]\\s?[0-9][0-9IlOo]*)?|[ivxlc]{1,7})';
const RD_LEAD_END = new RegExp('\\s*(?:\\.[ \\xa0]?){4,}\\s*' + RD_NUM + '?$');                  // "... ..... 273" at the end: a leader of four dots or more, and the page after it
const RD_LEAD_NUM = new RegExp('\\s*(?:\\.[ \\xa0]?){3,}\\s*' + RD_NUM + '$');                    // or a leader of three with a page after it
function rdTocLabel(title) {
  const orig = String(title == null ? '' : title).replace(/\s+/g, ' ').trim(); if (!orig) return '';
  let s = orig.replace(/\xad/g, ''); s = s.replace(RD_LEAD_END, '').replace(RD_LEAD_NUM, '').replace(/\s*(?:\.[ \xa0]?){4,}\s*/g, ' … ');
  const dangling = (x) => { const st = []; for (let i = 0; i < x.length; i++) { if (x[i] === '(') st.push(i); else if (x[i] === ')') st.pop(); } if (!st.length) return x; const at = st[st.length - 1]; return at > 0 && x.length - at <= 30 ? x.slice(0, at) : x; };      // a bracket never closed, with only a stub after it
  for (let g = 0; g < 6; g++) { const before = s; s = dangling(s.replace(/[\s,;:_~\-—–]+$/, '').replace(/\s+\.+$/, '')); if (s === before) break; }
  s = s.replace(/\s{2,}/g, ' ').trim();
  return /[A-Za-zÀ-ɏ]{2}/.test(s) ? s : orig;
}
/* the rows of the contents list: one per section, in order. A long section of a scan is cut into parts by the builder and titled "<heading> · part 37 of 38 · <its first words>…" (or "Part 37 of 38 · …" with no
   heading): such rows are grouped under their heading, shown once, and each says "Part 37 of 38" with its first words as a quiet hint. { k, label, hint, group, part, title }: group is the heading on the first part of
   each run (a row with no group follows another part of the same run), title is the section's own title for a tooltip. */
const RD_PART = /^(?:(.*?) · part (\d+) of (\d+)|Part (\d+) of (\d+))(?: · (.+))?$/;
function rdTocRows(titles) {
  const rows = []; let run = null;
  (titles || []).forEach((t, k) => {
    const raw = String(t == null ? '' : t).replace(/\s+/g, ' ').trim(); const m = RD_PART.exec(raw);
    if (!m) { run = null; rows.push({ k, label: rdTocLabel(raw) || raw, hint: '', group: null, part: null, title: raw }); return; }
    const head = rdTocLabel(m[1] != null ? m[1] : ''); const i = +(m[2] || m[4]); const n = +(m[3] || m[5]); const key = head + '\u0001' + n; const first = key !== run; run = key;
    rows.push({ k, label: `Part ${i} of ${n}`, hint: (m[6] || '').trim(), group: first ? head : null, part: [i, n], title: raw });
  });
  return rows;
}
/* The front of a scanned text (UX-35): the pages before the text itself (title page, imprint, dedication, a table of contents) come out of the OCR as a run of short lines, some of them noise ("W ILLIAM R A IN EY
   H A R P E R", "MXvbX"), at the top of the first section, so a book opened on them. rdFront finds where the text begins, from the paragraphs alone: the first long paragraph that reads as prose (lowercase words, few
   single letters), and counts what is before it as front matter only when it is four lines or more and looks like a title page (mostly capitals or short, with a publisher's words or a line of noise in it), so verse (short
   lines in sentence case) and a text that begins with a heading are left as they are. Nothing is removed or moved: the reader opens at this paragraph when there is no place of the reader's own, and the front matter
   is the first row of the contents. Returns { s: 0, p } (the paragraph the text begins at; a heading standing over it is taken with it) or null. */
const RD_IMPRINT = /\b(?:copyright|published|printed|publishers?|press|edition|reprinted|library of|university|london|new york|chicago|boston|leipzig|philadelphia|volume|vol\.|dedicated|by the same author|all rights reserved|digitized|digitised|google|internet archive|microsoft|wellcome)\b/i;
function rdIsProse(p) {
  const s = String(p == null ? '' : p).trim(); if (s.length < 160) return false; const toks = s.split(/\s+/); const words = toks.filter((w) => /^[“"‘'(]?[a-z][a-z’'-]{2,}[.,;:!?)”"’']*$/.test(w)).length; const single = toks.filter((w) => /^[A-Za-z]$/.test(w)).length;
  return words >= 0.5 * toks.length && single <= 0.15 * toks.length;
}
function rdFrontLine(s) {
  const t = String(s == null ? '' : s).trim(); if (!t) return { like: true, noisy: false }; const letters = t.replace(/[^A-Za-z]/g, ''); const upper = letters.replace(/[^A-Z]/g, '');
  const noisy = /(?:^|\s)[A-Za-z](?:\s+[A-Za-z]){3,}(?:\s|$)/.test(t) || /\b[A-Z]{2,}[a-z]{1,3}[A-Z]+\b/.test(t) || (t.length > 3 && letters.length < 0.5 * t.replace(/\s/g, '').length);
  const caps = letters.length >= 3 && upper.length >= 0.8 * letters.length; const imprint = RD_IMPRINT.test(t);
  return { like: noisy || caps || imprint || t.length <= 24, noisy: noisy || imprint };
}
function rdFront(secs) {
  if (!secs || !secs.length || !secs[0]) return null; const blocks = String(secs[0][1]).split(/\n{2,}/); const lim = Math.min(blocks.length, 70); let p = -1;
  for (let i = 0; i < lim; i++) { if (rdIsProse(blocks[i])) { p = i; break; } if (blocks[i].length > 400) return null; }      // a long paragraph that is not prose is not part of a title page
  if (p < 4) return null;
  const lines = blocks.slice(0, p).map(rdFrontLine); if (lines.filter((x) => x.like).length < 0.6 * p || !lines.some((x) => x.noisy)) return null;
  const head = rdIsHeading(blocks[p - 1]) ? p - 1 : p;      // "PREFACE", "INTRODUCTION." stand with the text they head
  return head >= 3 ? { s: 0, p: head } : null;
}
/* a line that heads what follows: a few words, each capitalised (or a small joining word), a roman numeral at most for a single letter ("CHAPTER I."), at least one word of four letters ("M A R Y H . W I L M A R T H" is a name in letter-spaced type, not a heading) */
function rdIsHeading(s) {
  const t = String(s == null ? '' : s).trim(); if (t.length < 3 || t.length > 60) return false; const toks = t.split(/\s+/); if (toks.length > 8) return false;
  const ok = toks.every((w) => /^[A-Z][A-Za-z'’.,:;-]*$/.test(w) || /^(?:of|the|and|to|in|on|a|an|by|for)$/.test(w)); if (!ok) return false;
  if (toks.some((w) => w.replace(/[^A-Za-z]/g, '').length === 1 && !/^(?:[IVXLC]+[.,:]?|A)$/.test(w))) return false;
  return toks.some((w) => w.replace(/[^A-Za-z]/g, '').length >= 4) && !/[a-z]{3,}[^A-Za-z]*\s+[a-z]{3,}.*[.!?]$/.test(t);
}
if (typeof module !== 'undefined' && module.exports) module.exports = { RD_PAGE, rdPages, RD_PAGE_NOTE, rdPageNote, rdRef, rdTocLabel, rdTocRows, rdFront, rdIsProse, rdIsHeading };
