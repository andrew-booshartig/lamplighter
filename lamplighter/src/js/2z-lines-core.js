/* ═══════════════════════════ 2z · Contents pages and indexes: one entry to a line ═══════════════════════════
   Pure functions (tests/lines.test.js). The texts of scanned books were made from OCR with the lines of each page joined into paragraphs, which is right for prose and wrong for a table of
   contents or an index, where every printed line is an entry: "Reign of Pepi I ......... 295-315 Hammamat Inscriptions ......... 295-301" ran on as one wrapped paragraph, with the dots of the leaders
   broken across lines, two page numbers on one line, and nothing in a column. The reader cannot change the text (the paragraphs are numbered, and every highlight, bookmark, note and printed-page marker
   is kept by paragraph and character offset), so it finds the entries here and draws each on a line of its own: lnRows says where each entry begins and ends in a paragraph's visible text, and lnPm
   turns that into the empty elements and the opening and closing tags that paraHTML puts at those offsets (its pm option, the same way the printed-page markers go in). No character is added, removed or
   moved, so no offset changes; the dots of a leader stay in the text and are drawn as a dotted rule that fills the line, which puts the page numbers in a column at the right.
   Two kinds of paragraph are recognised, both only when the shape is plain, because a wrong line break in prose is worse than none:
     toc    two or more entries each made of a title, a leader (a run of dots) and a page number; or one entry that is the whole paragraph (a title, a leader, a page number)
     index  a run of entries that each end in page numbers and begin with a capitalised word ("Albania, ii. 505 Albertus Magnus, i. 20, 30 ..."), dense in numbers */
const LN_MAX = 30000;
const LN_LEAD = /(?:\.[  ]?){3,}|…{2,}/g;                                  // a leader: dots, spaced or not
const LN_JUNK = /^[\s\-—–_~=.,:;·•+*]{0,16}/;                                    // what OCR leaves between a leader and the number
const LN_NUM = '[0-9][0-9IlOo]*';                                               // OCR reads a 1 as I or l and a 0 as O
const LN_RNG = LN_NUM + '(?:\\s?[-–—“”"\']{1,2}\\s?' + LN_NUM + ')?';                                      // 295 or 295-315
const LN_REF = new RegExp('^(?:' + LN_RNG + '(?:(?:\\s?,\\s?|\\s\\.\\s?)' + LN_RNG + ')*[.,;]?|[ivxlc]{1,7}(?![A-Za-z0-9]))');      // 295-315, 12, 14, xii, and "316-318 . 319-324" (a space inside a number is not read: it is more often the next entry's own number)
const LN_STRAY = /\s\.\s?(\d{1,4}\s?[-–—]\s?\d{1,4})(?=\s+[A-Z“‘"(])/;                                    // " . 300-301 " inside a title: the page range of an entry whose leader the OCR lost
const LN_NO_SPLIT = /^(?:See|Cf|Ibid|Id|Vol|Vols|Chap|Chaps|Ch|Book|Bk|Part|Pl|Plate|Plates|Fig|Figs|No|Nos|Sec|Sect|Ver|Page|Pp|Note|Notes|Cap)\b/;      // what follows a number inside an entry, not a new entry
const LN_ENDS_REF = /(?:\d[a-z]{0,2}|\b(?:ff?|seq|sqq?|nn?))\.?[.,;]?$/;      // the words before a break end in a page number (or "f.", "ff.", "seq.")

/* the entries of a paragraph of a contents page, or null: [{ a, b, t: [a, titleEnd], l: [titleEnd, leaderEnd] | null, n: [numberStart, b] | null }] in visible-text offsets */
function lnToc(t) {
  const rows = []; let start = 0; let m; LN_LEAD.lastIndex = 0; let leaders = 0;
  const skip = (i) => { while (i < t.length && /\s/.test(t[i])) i++; return i; };
  while ((m = LN_LEAD.exec(t))) {
    const ls = m.index; if (ls < start) continue; let a = skip(start); let te = ls; while (te > a && /\s/.test(t[te - 1])) te--;      // the title: from the start of the entry to the leader
    const words = /[A-Za-z0-9]{2}/.test(t.slice(a, te)) && /[A-Za-z\u00c0-\u024f]/.test(t.slice(a, te));
    let le = ls + m[0].length; const junk = LN_JUNK.exec(t.slice(le, le + 24))[0]; const after = le + junk.length;
    const rm = LN_REF.exec(t.slice(after, after + 40)); let end = le; let ns = -1;
    if (rm && rm[0]) { ns = after; end = after + rm[0].length; } else end = le + junk.replace(/\s+$/, '').length;
    const bare = !words && !rows.length && a === ls && ns >= 0;                                                              // the paragraph begins with a leader and a number: the end of an entry the OCR began in the line before
    if (!words && !bare) continue;                                                                                           // no words before it: part of the last leader
    if (te - a > 260) return null;                                                                                           // a title this long is prose with an ellipsis in it
    if (bare) te = a;
    rows.push({ a, b: end, t: [a, te], l: [te, ns >= 0 ? ns : end], n: ns >= 0 ? [ns, end] : null, d: (m[0].match(/[.…]/g) || []).length }); leaders++; start = end; LN_LEAD.lastIndex = end;
  }
  if (!rows.length) return null;
  for (let i = 0; i < rows.length; i++) {                                                                                    // an entry whose leader was lost: "Ikhi . 300-301 Sinai Inscription ..... 302-303" is two entries
    const r = rows[i]; const sm = LN_STRAY.exec(t.slice(r.a, r.t[1])); if (!sm) continue; const ns = r.a + sm.index + sm[0].indexOf(sm[1]); const ne = ns + sm[1].length; const rest = skip(ne);
    if (!/[A-Za-z0-9]{2}/.test(t.slice(r.a, r.a + sm.index)) || rest >= r.t[1]) continue; let te = r.a + sm.index; while (te > r.a && /\s/.test(t[te - 1])) te--;
    const head = { a: r.a, b: ne, t: [r.a, te], l: [te, ns], n: [ns, ne], d: 1 }; const next = { a: rest, b: r.b, t: [rest, r.t[1]], l: r.l, n: r.n, d: r.d }; rows.splice(i, 1, head, next); i--;
  }
  const tail = skip(start); if (tail < t.length) { let e = t.length; while (e > tail && /\s/.test(t[e - 1])) e--; if (e > tail && /[A-Za-z\u00c0-\u024f]{2}/.test(t.slice(tail, e))) rows.push({ a: tail, b: e, t: [tail, e], l: null, n: null }); }      // what follows the last number is a line of its own, if it has words in it
  const withNum = rows.filter((r) => r.n).length;
  if (rows.length === 1) {                                                                                                    // one entry only if it is all of the paragraph: a short title, a leader and a page number
    const r = rows[0]; const whole = r.a <= skip(0) && skip(r.b) >= t.length && /^[A-Z0-9“‘"'(\[§_.*]/.test(t[r.a]); if (!whole || r.t[1] - r.a > (r.n ? 140 : 100) || (r.n ? r.d < 4 : r.d < 12)) return null; return rows;      // with a number a leader of four dots will do; without one it must be a long leader, not an ellipsis
  }
  const real = rows.filter((r) => r.l && r.d >= 8 && r.n).length;                                                            // a long leader and a number is no ellipsis: one such entry, with the title of the next left bare, is enough
  if (!(leaders >= 2 && withNum >= 2) && !(real >= 1 && rows.length >= 2)) return null;                                      // otherwise several entries need numbers on at least two of them
  if (rows.filter((r) => /^[A-Z0-9“‘"'(\[§_.*]/.test(t.slice(r.a, r.a + 1))).length < 0.6 * rows.length) return null;      // and begin as titles do: "She waited ... 5 minutes and then left ... 3 more" is a sentence
  return rows;
}

/* the entries of a paragraph of an index: runs of entries that end in page numbers, each beginning with a capitalised word. Entries are cut at a number followed by a capitalised word. */
function lnIndex(t) {
  if (t.length < 120) return null;
  const digits = (t.match(/\d/g) || []).length; if (digits / t.length < 0.06) return null;
  const lists = t.match(/\b\d{1,4}[a-z]?(?:\s?[-–]\s?\d{1,4})?\s?[,;]\s+\d{1,4}/g); if (!lists || lists.length < 3) return null;     // number lists: 20, 30 (a thousands separator has no space)
  const cand = [0]; const rx = /\S\s+(?=['‘’“"]?[A-Z][a-z\u00e0-\u024f’'-])/g; let m;      // starts at the last letter before the space, so a long run of spaces is not tried from every one of them
  while ((m = rx.exec(t))) {
    const at = m.index + m[0].length; if (at - cand[cand.length - 1] < 6) continue; const ws = m.index + 1;
    const before = t.slice(Math.max(0, ws - 12), ws); if (!LN_ENDS_REF.test(before)) continue;
    if (LN_NO_SPLIT.test(t.slice(at, at + 12))) continue; if (/(?:^|\s)[1-3]$/.test(before) && /^['‘’“"]?[A-Z][A-Za-z]{0,4}\b/.test(t.slice(at, at + 8))) continue;      // "1 Co", "2 Tim": a book of the Bible, not a new entry
    cand.push(at);
  }
  const starts = [0]; cand.forEach((at, i) => { if (!i) return; const nx = i + 1 < cand.length ? cand[i + 1] : t.length; const d = t.slice(at, nx).search(/\d/); if (d >= 0 && d <= 64) starts.push(at); });      // an entry has a number soon after its headword; the words after "1813." in a life of a scholar do not
  if (starts.length < 4) return null;
  const avg = t.length / starts.length; if (avg > 170) return null;
  const lens = starts.map((a, i) => (i + 1 < starts.length ? starts[i + 1] : t.length) - a); const lead = t.slice(0, starts[1]);
  if (lens[0] > 200 || (/^[a-z]/.test(lead) && lens[0] > 60) || Math.max(...lens.slice(1)) > 500) return null;      // an index does not begin with a run of prose, and no entry is a paragraph long
  const rows = starts.map((a, i) => { let b = i + 1 < starts.length ? starts[i + 1] : t.length; while (b > a && /\s/.test(t[b - 1])) b--; return { a, b, t: [a, b], l: null, n: null }; });
  return rows;
}

/* where the entries of a paragraph are, or null when it is not a contents page or an index: { kind: 'toc' | 'index', rows } */
function lnRows(text, ctx) {
  const t = String(text == null ? '' : text); const inIndex = !!(ctx && ctx.index); if (t.length < (inIndex ? 4 : 12) || t.length > LN_MAX) return null;
  const toc = lnToc(t); if (toc) return { kind: 'toc', rows: toc };
  const ln = inIndex ? lnIndexLine(t) : null; if (ln) return { kind: 'index', rows: ln };      // in a section that is an index every line is read with the looser rules first
  const ix = lnIndex(t); return ix ? { kind: 'index', rows: ix } : null;
}

/* ── the lines of an index (UX-21 and A1 of UX_AUDIT.md) ──
   In the index of a scanned book each printed line of a column is a paragraph of its own, so most are short: "Abhakta, in. 426"; "— vyakhya, 11. 89 Abhimukhi, n. 11 Abhinava Gupta, n. 223, 224 Abhinna, i. 317"; a line that is only the end of
   the entry above ("185, 224, 343, 382 Absolute Godhead. See Brahman Abu (Mount), i. 115, 120; n. 203"). One such line cannot be told from prose, but a section whose paragraphs are mostly lines of that kind can: lnSection says whether a section is
   an index, and in one lnRows reads every line with looser rules (lnIndexLine): cut where a page number is followed by the next headword (capitalised, or a lowercase word with a comma after it), after "See Brahman" before the headword that follows,
   and a line that begins with page numbers is the end of the entry above it and is drawn indented under it (a row with c set). Prose is never read this way: it needs the section to be an index first. */
const LN_REFLINE = /(?:\d|\b[ivxlcIVXLC]{1,5}\.?|[,;]|\b(?:sq|sqq|seq|ff?)\.)$/;      // a line that ends in a page number, a roman number, a comma or semicolon (the entry goes on in the next line) or "sq."
function lnRefLine(p) { const t = String(p == null ? '' : p).trim(); if (t.length < 4 || t.length > 700) return false; const d = (t.match(/\d/g) || []).length; return d >= 1 && d / t.length >= 0.06 && LN_REFLINE.test(t); }
function lnSection(blocks) {
  const lines = (blocks || []).filter((b) => String(b == null ? '' : b).trim().length >= 4); if (lines.length < 25) return null;
  let hit = 0; for (const b of lines) if (lnRefLine(b)) hit++; if (hit < 0.55 * lines.length) return null;
  let strict = 0; for (const b of lines) if (lnIndex(String(b).replace(/\[\[\d+\]\]/g, ''))) strict++;      // and some of its lines must already be recognised as an index by the strict rules: a table of figures, numbered sayings or a list of dates end in numbers too
  return strict >= Math.max(5, 0.03 * lines.length) ? { index: true } : null;
}
const LN_NOT_HEAD = /^(?:and|the|see|also|sq|sqq|seq|ff?|note|notes|ibid|vol|vols|pl|pp?|plate|fig|ch|chap|art|sect?|cap|pt|part|ed|trans|in|of|on|at|to|n|m|u|ra|ii?|iii)\b/i;      // after a number these are the rest of the entry (or a volume mark), not a new headword
const LN_HASREF = /\d|(?:^|[\s,.;])[ivxlcIVXLC]{2,7}(?=[,.;\s]|$)/;      // a page number, or a roman one (the pages of a preface): "Burma, i. xii, xix"
const LN_CONT = /^(?:[•\u2022]?\s*\d|[ivxlcIVXLCmnu]{1,3}\.\s*[\dIil]|[ivxlcIVXLC]{2,6}[,;]\s*[\dIivxlc])/;      // a line that begins with a page number or a volume mark and a number is the end of an entry begun above
function lnIndexLine(t) {
  if (!lnRefLine(t)) return null;
  const cand = [0]; const rx = /\S\s+(?=[—–-]?\s?['‘’“"]?[A-Za-z\u00c0-\u024f])/g; let m;
  while ((m = rx.exec(t))) {
    const at = m.index + m[0].length; const ws = m.index + 1; const before = t.slice(Math.max(0, ws - 14), ws); const word = t.slice(at).replace(/^[—–-]\s?['‘’“"]?|^['‘’“"]/, '');
    const seeEnd = /\bSee(?: also)? [A-Z][A-Za-z'’-]*$/.test(before);                                      // "See Brahman" | "Abu (Mount), i. 115": the target of a cross-reference ends its entry
    if (!seeEnd && !LN_ENDS_REF.test(before)) continue; if (/^\d|^See\b/.test(word)) continue;
    if (/^[IVXLCH]{1,5}\s+[\dIl]/.test(word)) continue;                                                      // "II 1196": a volume and a page, the rest of the entry
    const upper = /^[A-Z\u00c0-\u00de]/.test(word); if (!upper && (!/^[a-z\u00e0-\u024f][a-z\u00e0-\u024f'’-]{2,}(?:\s[a-z\u00e0-\u024f'’-]+)?,/.test(word) || LN_NOT_HEAD.test(word))) continue;      // a lowercase headword has a comma after it ("anariyam, i. 241"); "sq.", "and" and the like are not headwords
    if (upper && LN_NO_SPLIT.test(word.slice(0, 12))) continue; if (at - cand[cand.length - 1] < 4) continue;
    cand.push(at);
  }
  const starts = [0]; cand.forEach((at, i) => { if (!i) return; const nx = i + 1 < cand.length ? cand[i + 1] : t.length; const seg = t.slice(at, nx); const d = seg.search(LN_HASREF); if ((d >= 0 && d <= 64) || /\bSee\b/.test(seg)) starts.push(at); });      // an entry has a page number (or a roman one) soon after its headword, or is a cross-reference ("Absolute Godhead. See Brahman")
  const rows = starts.map((a, i) => { let b = i + 1 < starts.length ? starts[i + 1] : t.length; while (b > a && /\s/.test(t[b - 1])) b--; return { a, b, t: [a, b], l: null, n: null }; });
  if (LN_CONT.test(t.slice(rows[0].a, rows[0].b))) rows[0].c = true;                                                           // the end of the entry above: drawn under it, indented
  return rows.every((r) => r.b > r.a) ? rows : null;
}

/* the elements to put into the paragraph, as paraHTML's pm option wants them: [[offset, html], ...]. info: what lnRows gave; markers: the printed-page markers already bound for this paragraph
   ([[offset, html], ...], or nothing): one that falls inside an entry moves to the entry's start, so it never sits in the middle of a title or beside a page number. */
function lnPm(info, markers) {
  if (!info || !info.rows || !info.rows.length) return markers && markers.length ? markers : null;
  const out = []; const rows = info.rows; let seq = 0; const add = (off, html, pr) => out.push({ off, html, pr, seq: seq++ });
  const first = rows[0].a; const lastEnd = rows[rows.length - 1].b;
  rows.forEach((r) => {
    const lead = !!r.l && r.l[1] > r.l[0];
    if (lead) { add(r.a, `<span class="lnr lnl"><span class="lnt">`, 2); add(r.l[0], '</span><span class="lnd">', 3); if (r.n) add(r.n[0], '</span><span class="lnn">', 3); add(r.b, '</span></span>', 0); }
    else { add(r.a, `<span class="lnr${info.kind === 'index' ? ' lnx' : ''}${r.c ? ' lnc' : ''}">`, 2); add(r.b, '</span>', 0); }
  });
  (markers || []).forEach((mk) => { const off = mk[0]; let at = off; if (off > first && off < lastEnd) { for (const r of rows) { if (off >= r.a && off < r.b) { at = r.a; break; } if (off < r.a) { at = off; break; } } } add(at, mk[1], 1); });
  out.sort((x, y) => x.off - y.off || x.pr - y.pr || x.seq - y.seq);
  return out.map((o) => [o.off, o.html]);
}

/* a heading that is really a line of a table of contents ("Conclusion......... Feasts and Offerings...") for display: a run of dots becomes one ellipsis, so it does not wrap across the screen */
function lnTitle(t) {
  const s = String(t == null ? '' : t); if (!/\.{4,}|(?:\.[  ]){3,}\./.test(s)) return s;
  return s.replace(/\s*(?:\.[  ]?){4,}\s*/g, ' … ').replace(/\s{2,}/g, ' ').trim();
}
if (typeof module !== 'undefined' && module.exports) module.exports = { LN_MAX, lnToc, lnIndex, lnRows, lnPm, lnTitle, lnSection, lnRefLine, lnIndexLine };
