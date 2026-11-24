/* ═══════════════════════════ 2z · Your own texts ═══════════════════════════
   Pure functions, no page in them. Anyone can put a text of their own into the reader: a family prayer book, a community's order of service, a translation they made, a
   scripture the library does not have. It can be in any language. It is turned into the same shape as every library text (sections of paragraphs) so the reader, its marks, its
   pages and Save as an e-book all work on it, and it stays in the browser that added it. From a file (.txt, .md, .html, or an .epub) or pasted words.
   A text is its sections [[heading, text]]; paragraphs are separated by a blank line; a line "## heading" inside a section is a sub-heading; [[12]] is a verse number. */
const OWN_MAX_CHARS = 12000000;       // one text
const OWN_MAX_TEXTS = 200;
const OWN_PART = 40000;               // a section longer than this is cut into parts at a paragraph, so no screen of the reader has to lay out a book's worth at once
const OWN_LIMITS = { title: 120, by: 120, note: 400 };
const ownStr = (s, n) => String(s == null ? '' : s).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f\u2028\u2029]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n);
/* text made safe: one kind of line end, no control characters or stray half-surrogates, no byte-order mark, non-breaking spaces as spaces */
function ownClean(raw) {
  let s = String(raw == null ? '' : raw).replace(/\ufeff/g, '').replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f\u2028\u2029\ufffe\uffff]/g, ' ').replace(/[\u00a0\u2007\u202f]/g, ' ');
  let o = ''; for (let i = 0; i < s.length; i++) { const c = s.charCodeAt(i); if (c >= 0xd800 && c <= 0xdbff) { const d = s.charCodeAt(i + 1); if (d >= 0xdc00 && d <= 0xdfff) { o += s[i] + s[i + 1]; i++; } } else if (c < 0xdc00 || c > 0xdfff) o += s[i]; }
  return o.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}
const OWN_ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', mdash: '—', ndash: '–', hellip: '…', ldquo: '“', rdquo: '”', lsquo: '‘', rsquo: '’', laquo: '«', raquo: '»', copy: '©', middot: '·', thinsp: ' ', ensp: ' ', emsp: ' ' };
const ownEntities = (s) => String(s).replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
  if (e[0] === '#') { const n = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10); return n > 0 && n < 0x110000 && !(n >= 0xd800 && n < 0xe000) ? String.fromCodePoint(n) : ' '; }
  const v = OWN_ENT[e.toLowerCase()]; return v == null ? m : v;
});
/* HTML to text in the shape the reader uses: block ends become blank lines, headings become "## " blocks, line breaks stay, verse-number superscripts become [[n]], scripts and styles go */
function ownHtmlToText(html) {
  let s = String(html == null ? '' : html);
  s = s.replace(/<!--[\s\S]*?-->/g, ' ').replace(/<(script|style|head|svg|nav)\b[\s\S]*?<\/\1\s*>/gi, ' ');
  s = s.replace(/<sup\b[^>]*class=["'][^"']*\bvn?\b[^"']*["'][^>]*>\s*(\d{1,3})\s*<\/sup>/gi, '[[$1]]');
  s = s.replace(/<br\s*\/?>/gi, '\n').replace(/<h([1-6])\b[^>]*>/gi, '\n\n## ').replace(/<\/h[1-6]\s*>/gi, '\n\n').replace(/<\/(p|div|li|blockquote|tr|section|article|pre|ul|ol|table|dd|dt)\s*>/gi, '\n\n').replace(/<(p|div|li|blockquote|tr|section|article|pre)\b[^>]*>/gi, '\n');
  s = s.replace(/<[^>]*>/g, '');
  return ownClean(ownEntities(s));
}
/* a paragraph copied from a book or e-mail is often broken into lines at 70 characters: join those lines, but keep line breaks where they mean something (verse, a poem, a list) */
function ownUnwrap(par) {
  const lines = par.split('\n'); if (lines.length < 2) return par;
  const lens = lines.map((l) => l.trim().length).sort((a, b) => a - b); const med = lens[lens.length >> 1]; const ends = lines.slice(0, -1).filter((l) => /[.!?:;,”’")\]]$/.test(l.trim())).length;
  const wrapped = med >= 45 && ends <= (lines.length - 1) * 0.6 && lines.every((l) => l.trim().length <= 120);
  const list = lines.filter((l) => /^\s*([-*•·]|\d+[.)])\s/.test(l)).length >= lines.length / 2;
  return wrapped && !list ? lines.map((l) => l.trim()).join(' ').replace(/ {2,}/g, ' ') : lines.map((l) => l.replace(/\s+$/, '')).join('\n');
}
const ownBlocks = (text) => ownClean(text).split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
/* markdown or text → {title, secs}. A "# " heading is a chapter; if there is only one, at the top, it is the book's title and "## " are the chapters; deeper headings stay inside the chapter as sub-headings. With no headings at all the text is cut into parts of about 14,000 characters at paragraph ends. */
function ownSections(text, hint) {
  const blocks = ownBlocks(text); const h = (b) => { const m = /^(#{1,6})[ \t]+(.+)$/.exec(b.split('\n')[0]); return m && !b.includes('\n') ? { lv: m[1].length, t: ownStr(m[2].replace(/#+\s*$/, ''), 120) } : null; };
  const hs = blocks.map(h); const counts = [0, 0, 0, 0, 0, 0, 0]; hs.forEach((x) => { if (x) counts[x.lv]++; });
  let title = ownStr(hint, OWN_LIMITS.title); let top = 0;
  if (counts[1] === 1 && hs[hs.findIndex((x) => x)] && hs[hs.findIndex((x) => x)].lv === 1 && hs.findIndex((x) => x) <= 1) { title = hs.find((x) => x).t || title; top = 2; } else if (counts[1] > 0) top = 1; else if (counts[2] > 0) top = 2; else if (counts[3] > 0) top = 3;
  const secs = []; let cur = null; const open = (heading) => { cur = { h: heading, b: [] }; secs.push(cur); };
  blocks.forEach((b, i) => {
    const x = hs[i];
    if (x && top && x.lv < top && secs.length === 0 && counts[1] === 1 && top === 2) return;        // the book's title line
    if (x && top && x.lv <= top) { open(x.t); return; }
    if (!cur) open(''); cur.b.push(x ? '## ' + x.t : ownUnwrap(b));
  });
  const out = [];
  for (const s of secs) {
    const parts = []; let acc = []; let n = 0; for (const b of s.b) { if (n + b.length > OWN_PART && acc.length) { parts.push(acc); acc = []; n = 0; } acc.push(b); n += b.length + 2; } if (acc.length) parts.push(acc);
    parts.forEach((p, i) => out.push([s.h ? (parts.length > 1 ? `${s.h} · part ${i + 1}` : s.h) : '', p.join('\n\n')]));
  }
  if (!out.length) return { title, secs: [] };
  if (counts.slice(1).every((c) => c === 0) || out.every((s) => !s[0])) {        // no headings: parts of about 14,000 characters, named by number
    const all = out.map((s) => s[1]).join('\n\n').split(/\n{2,}/); const chunks = []; let acc = []; let n = 0; for (const b of all) { if (n + b.length > 14000 && acc.length) { chunks.push(acc.join('\n\n')); acc = []; n = 0; } acc.push(b); n += b.length + 2; } if (acc.length) chunks.push(acc.join('\n\n'));
    return { title, secs: chunks.map((c, i) => [chunks.length > 1 ? `Part ${i + 1}` : (title || 'Text'), c]) };
  }
  return { title, secs: out.map((s, i) => [s[0] || (i === 0 ? (title || 'Beginning') : `Part ${i + 1}`), s[1]]) };
}
const ownBase = (name) => ownStr(String(name || '').replace(/^.*[\\/]/, '').replace(/\.(txt|text|md|markdown|html?|xhtml|epub)$/i, '').replace(/[_]+/g, ' '), OWN_LIMITS.title);
const ownKind = (name, head) => { const n = String(name || '').toLowerCase(); if (/\.epub$/.test(n) || (head && head[0] === 0x50 && head[1] === 0x4b)) return 'epub'; if (/\.html?$|\.xhtml$/.test(n)) return 'html'; if (/\.(md|markdown)$/.test(n)) return 'md'; return 'txt'; };
/* a file's words (already decoded as text) → {title, secs, chars}; kind is 'txt', 'md' or 'html' */
function ownFromText(raw, kind, name) {
  if (typeof raw !== 'string') return { title: ownBase(name) || 'My text', secs: [], chars: 0 };
  const text = kind === 'html' ? ownHtmlToText(raw) : ownClean(raw); const r = ownSections(text, ownBase(name));
  const chars = r.secs.reduce((n, s) => n + s[1].length, 0); return { title: r.title || ownBase(name) || 'My text', secs: r.secs, chars };
}
/* the same, for words typed or pasted */
const ownFromPaste = (raw, title) => ownFromText(raw, 'md', title || 'My text');
/* what is kept for a text: its record, with every field short and the sections as they are. null if there is nothing to keep. */
function ownRecord(id, parsed, info) {
  const i = info || {}; const secs = (parsed.secs || []).map((s) => [ownStr(s[0], 140), String(s[1])]).filter((s) => s[1].trim()); if (!secs.length) return null;
  const chars = secs.reduce((n, s) => n + s[1].length, 0); if (chars > OWN_MAX_CHARS) return null;
  return { id, title: ownStr(i.title || parsed.title || 'My text', OWN_LIMITS.title), by: ownStr(i.by, OWN_LIMITS.by), note: ownStr(i.note, OWN_LIMITS.note), chars, n: secs.length, t: Number.isFinite(+i.t) ? +i.t : 0, secs };
}
/* the small part kept in the index, for listing without opening the text */
const ownIndexEntry = (r) => ({ id: r.id, title: r.title, by: r.by, note: r.note, chars: r.chars, n: r.n, t: r.t });
const ownIdOk = (id) => typeof id === 'string' && /^u-[a-z0-9]{6,24}$/.test(id);
function ownIndexClean(list) {
  const seen = new Set(); return (Array.isArray(list) ? list : []).filter((e) => e && ownIdOk(e.id) && !seen.has(e.id) && seen.add(e.id)).slice(0, OWN_MAX_TEXTS)
    .map((e) => ({ id: e.id, title: ownStr(e.title, OWN_LIMITS.title) || 'My text', by: ownStr(e.by, OWN_LIMITS.by), note: ownStr(e.note, OWN_LIMITS.note), chars: Math.max(0, Math.round(+e.chars) || 0), n: Math.max(1, Math.round(+e.n) || 1), t: Math.max(0, Math.round(+e.t) || 0) }));
}

/* ── a text pack: texts of your own in one file to hand to someone else (a leader gives a group the readings, a translator gives a friend a draft). No server: the file travels any way a file can. It carries a
   checksum of its texts, so the receiver knows if it was damaged or changed on the way (that is all it tells them: a checksum shows change, not who made it). Every text in it is cleaned again on the way in,
   and gets its id from its own words, so a pack cannot overwrite or impersonate another text. Highlights, notes and bookmarks go only if the sender chooses. ── */
function ownPackMake(records, sha, opts) {
  const o = opts || {}; const texts = (Array.isArray(records) ? records : []).slice(0, OWN_MAX_TEXTS).map((r) => { const t = { title: r.title, by: r.by, note: r.note, secs: r.secs }; if (o.marks && r.marks && (r.marks.hl.length || r.marks.bm.length)) t.marks = { hl: r.marks.hl, bm: r.marks.bm }; return t; });
  return { app: 'The Lamplighter Project', kind: 'texts', v: 1, made: new Date(o.now == null ? Date.now() : o.now).toISOString().slice(0, 10), count: texts.length, sha: sha(JSON.stringify(texts)), texts };
}
function ownPackRead(pack, sha) {
  const out = { ok: false, error: '', texts: [], skipped: 0, damaged: false };
  if (!pack || typeof pack !== 'object' || (pack.app !== 'The Lamplighter Project' && pack.app !== 'Beatlab') || pack.kind !== 'texts') { out.error = 'This is not a Lamplighter text pack.'; return out; }
  if (pack.v !== 1) { out.error = 'This pack was made by a different version of the Lamplighter Project and cannot be read here.'; return out; }
  if (!Array.isArray(pack.texts) || !pack.texts.length) { out.error = 'The pack has no texts in it.'; return out; }
  let sum; try { sum = sha(JSON.stringify(pack.texts)); } catch (e) { sum = ''; } out.damaged = typeof pack.sha !== 'string' || pack.sha !== sum;
  let total = 0;
  for (const t of pack.texts.slice(0, OWN_MAX_TEXTS)) {
    if (!t || typeof t !== 'object' || !Array.isArray(t.secs)) { out.skipped++; continue; }
    const secs = t.secs.filter((s) => Array.isArray(s) && typeof s[1] === 'string').map((s) => [ownStr(s[0], 140), ownClean(s[1])]);
    const rec = ownRecord('u-pending00', { secs, title: t.title }, { title: t.title, by: t.by, note: t.note }); if (!rec) { out.skipped++; continue; }
    total += rec.chars; if (total > OWN_MAX_CHARS * 4) { out.skipped++; continue; }
    out.texts.push({ title: rec.title, by: rec.by, note: rec.note, secs: rec.secs, chars: rec.chars, marks: t.marks && typeof t.marks === 'object' ? { hl: Array.isArray(t.marks.hl) ? t.marks.hl.slice(0, 4000) : [], bm: Array.isArray(t.marks.bm) ? t.marks.bm.slice(0, 1000) : [] } : null });
  }
  out.ok = out.texts.length > 0; if (!out.ok) out.error = 'Nothing in the pack could be read.'; return out;
}

/* ── an e-book (EPUB) is a zip of XHTML: read the zip's directory, the package file's reading order, and the text of each chapter ── */
function ownZipList(u8) {
  const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength); let e = u8.length - 22; const lim = Math.max(0, u8.length - 65557); while (e >= lim && dv.getUint32(e, true) !== 0x06054b50) e--; if (e < lim) throw new Error('This does not look like an EPUB (no zip directory).');
  const count = dv.getUint16(e + 10, true); let p = dv.getUint32(e + 16, true); const out = [];
  for (let i = 0; i < count && p + 46 <= u8.length; i++) {
    if (dv.getUint32(p, true) !== 0x02014b50) throw new Error('The zip directory is damaged.');
    const method = dv.getUint16(p + 10, true); const csize = dv.getUint32(p + 20, true); const size = dv.getUint32(p + 24, true); const nl = dv.getUint16(p + 28, true); const el = dv.getUint16(p + 30, true); const cl = dv.getUint16(p + 32, true); const off = dv.getUint32(p + 42, true);
    out.push({ name: new TextDecoder('utf-8').decode(u8.subarray(p + 46, p + 46 + nl)), method, csize, size, off }); p += 46 + nl + el + cl;
  }
  return out;
}
async function ownZipRead(u8, ent, inflate) {
  const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength); const nl = dv.getUint16(ent.off + 26, true); const el = dv.getUint16(ent.off + 28, true); const a = ent.off + 30 + nl + el; const raw = u8.subarray(a, a + ent.csize);
  if (ent.size > 40e6) throw new Error('A file inside the e-book is too large.'); if (ent.method === 0) return raw; if (ent.method === 8) return inflate(raw); throw new Error('This e-book uses a compression the reader cannot open.');
}
const ownAttr = (tag, name) => { const m = new RegExp('\\b' + name + '\\s*=\\s*(?:"([^"]*)"|\'([^\']*)\')', 'i').exec(tag); return m ? ownEntities(m[1] != null ? m[1] : m[2]) : ''; };
const ownResolve = (base, rel) => { const parts = (base.replace(/[^/]*$/, '') + String(rel).split('#')[0]).split('/'); const out = []; for (const p of parts) { if (p === '..') out.pop(); else if (p && p !== '.') out.push(decodeURIComponent(p)); } return out.join('/'); };
/* files: {name → Uint8Array}-like reader read(name) → Promise<string|null>. Returns {title, by, secs}. */
async function ownEpubSections(list, read) {
  const dec = (u) => new TextDecoder('utf-8').decode(u);
  const names = new Set(list.map((e) => e.name)); const cont = await read('META-INF/container.xml'); const rf = cont ? /<rootfile\b[^>]*>/i.exec(cont) : null; const opfPath = rf ? ownAttr(rf[0], 'full-path') : (list.find((e) => /\.opf$/i.test(e.name)) || {}).name;
  if (!opfPath || !names.has(opfPath)) throw new Error('This e-book has no package file.'); const opf = await read(opfPath);
  const title = ownStr(ownEntities((/<dc:title\b[^>]*>([\s\S]*?)<\/dc:title>/i.exec(opf) || [0, ''])[1].replace(/<[^>]*>/g, '')), OWN_LIMITS.title); const by = ownStr(ownEntities((/<dc:creator\b[^>]*>([\s\S]*?)<\/dc:creator>/i.exec(opf) || [0, ''])[1].replace(/<[^>]*>/g, '')), OWN_LIMITS.by);
  const man = {}; (opf.match(/<item\b[^>]*>/gi) || []).forEach((t) => { man[ownAttr(t, 'id')] = { href: ownAttr(t, 'href'), type: ownAttr(t, 'media-type'), props: ownAttr(t, 'properties') }; });
  const spine = (opf.match(/<itemref\b[^>]*>/gi) || []).map((t) => ownAttr(t, 'idref')).filter((id) => man[id]);
  const secs = []; let total = 0;
  for (const id of spine) {
    const it = man[id]; if (!/x?html/.test(it.type) || /\bnav\b/.test(it.props)) continue; const path = ownResolve(opfPath, it.href); if (!names.has(path)) continue; const html = await read(path); if (html == null) continue;
    const text = ownHtmlToText(html); if (text.length < 40) continue;
    if (/(^|[\/_-])(title|titlepage|cover|toc|contents|copyright|colophon|imprint|halftitle)[^/]*$/i.test(it.href) && text.length < 1500) continue;      // a title page, a cover or a contents page is not a chapter
    total += text.length; if (total > OWN_MAX_CHARS) throw new Error('This e-book is too long to keep.');
    let blocks = ownBlocks(text); let heading = ''; const first = blocks[0] || ''; const m = /^##[ \t]+(.+)$/.exec(first); if (m && !first.includes('\n')) { heading = ownStr(m[1], 120); blocks = blocks.slice(1); }
    blocks = blocks.map((b) => (b.startsWith('## ') ? b : ownUnwrap(b))); const body = blocks.join('\n\n'); if (!body.trim()) continue;
    const parts = []; let acc = []; let n = 0; for (const b of blocks) { if (n + b.length > OWN_PART && acc.length) { parts.push(acc); acc = []; n = 0; } acc.push(b); n += b.length + 2; } if (acc.length) parts.push(acc);
    parts.forEach((p, i) => secs.push([(heading || `Part ${secs.length + 1}`) + (parts.length > 1 ? ` · part ${i + 1}` : ''), p.join('\n\n')]));
  }
  if (!secs.length) throw new Error('No readable text was found in this e-book.'); return { title, by, secs, chars: secs.reduce((n, s) => n + s[1].length, 0) };
}
if (typeof module !== 'undefined' && module.exports) module.exports = { OWN_MAX_CHARS, OWN_MAX_TEXTS, OWN_PART, OWN_LIMITS, ownStr, ownClean, ownEntities, ownHtmlToText, ownUnwrap, ownSections, ownBase, ownKind, ownFromText, ownFromPaste, ownRecord, ownIndexEntry, ownIdOk, ownIndexClean, ownPackMake, ownPackRead, ownZipList, ownZipRead, ownEpubSections };
