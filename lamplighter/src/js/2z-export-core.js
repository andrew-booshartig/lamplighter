/* ═══════════════════════════ 2z · Saving a whole text: e-book, plain text, Markdown, print page ═══════════════════════════
   Pure functions, no page in them. A text is its sections [[heading, text], …] (blank-line paragraphs, [[12]] verse numbers, "## " headings); the reader's
   marks for it (highlights with notes, bookmarks) can travel with it. Out come:
     · an EPUB 3 e-book (a zip of XHTML chapters with a contents page, readable on any e-reader or reading app), built here with a small zip writer;
     · plain text and Markdown;
     · one self-contained HTML page with print styles (a page break at each section, a title page and contents), which the browser can print or save as a PDF.
   Highlights become <mark> colours, and a highlight's note becomes a numbered note at the end of its chapter. Everything is built in the browser; nothing is uploaded.
   They rely on the marks helpers (textBlocks, blockParts, visibleText, resolveAnchor, paraHTML) from 2p-marks-core.js. */
/* text made safe for XML: control characters and half a surrogate pair (which a file cannot hold) are dropped */
function expClean(v) {
  const s = String(v == null ? '' : v); let o = ''; let changed = false;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c >= 0xd800 && c <= 0xdbff) { const d = s.charCodeAt(i + 1); if (d >= 0xdc00 && d <= 0xdfff) { o += s[i] + s[i + 1]; i++; } else changed = true; }
    else if (c >= 0xdc00 && c <= 0xdfff) changed = true;
    else if (c < 9 || c === 11 || c === 12 || (c >= 14 && c <= 31) || c === 0xfffe || c === 0xffff) changed = true;
    else o += s[i];
  }
  return changed ? o : s;
}
const expX = (s) => expClean(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const expFilename = (title, ext) => (String(title).normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60).toLowerCase() || 'text') + '.' + ext;
/* a section's heading as a contents entry: the first words of a section cut from a long scan ("Part 3 of 7 · And as he went…") are dropped */
function expTitle(h, i) {
  const segs = String(h == null ? '' : h).split(' · ').map((s) => s.trim()).filter(Boolean); if (segs.length > 1 && /…$/.test(segs[segs.length - 1])) segs.pop();
  const t = segs.join(' · ').replace(/\s+/g, ' ').trim() || `Part ${i + 1}`; return t.length > 120 ? t.slice(0, 117) + '…' : t;
}
/* a stable book identifier, the same every time the same text is saved, so a reading app keeps its place and notes */
function expUuid(key) { const h = sha256('beatlab:' + key); return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-${'89ab'[parseInt(h[16], 16) & 3]}${h.slice(17, 20)}-${h.slice(20, 32)}`; }

/* ── a zip file ── */
const EXP_CRC_T = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function expCrc32(b) { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = EXP_CRC_T[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
async function expDeflateRaw(bytes) {
  if (typeof CompressionStream === 'undefined' || typeof Response === 'undefined') return null;
  try { const cs = new CompressionStream('deflate-raw'); const w = cs.writable.getWriter(); w.write(bytes); w.close(); return new Uint8Array(await new Response(cs.readable).arrayBuffer()); } catch (e) { return null; }
}
/* files: [{ name, data: string | Uint8Array, store?: true }] → Uint8Array. Entries are compressed (deflate) where the browser can; the order is kept, which EPUB needs (mimetype first, stored). */
async function expZip(files, opts = {}) {
  if (files.length > 60000) throw new Error('Too many files for a zip');
  const enc = new TextEncoder(); const parts = []; const central = []; let offset = 0; const now = opts.date || new Date();
  const dt = (((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate()) & 0xFFFF; const tm = ((now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1)) & 0xFFFF;
  for (const f of files) {
    const name = enc.encode(f.name); const raw = typeof f.data === 'string' ? enc.encode(f.data) : f.data; if (raw.length > 4e9) throw new Error('A file is too large for a zip');
    const crc = expCrc32(raw); let data = raw; let method = 0;
    if (!f.store && opts.compress !== false && raw.length > 64) { const d = await expDeflateRaw(raw); if (d && d.length < raw.length) { data = d; method = 8; } }
    const lh = new Uint8Array(30 + name.length); const dv = new DataView(lh.buffer);
    dv.setUint32(0, 0x04034b50, true); dv.setUint16(4, 20, true); dv.setUint16(6, 0x0800, true); dv.setUint16(8, method, true); dv.setUint16(10, tm, true); dv.setUint16(12, dt, true); dv.setUint32(14, crc, true); dv.setUint32(18, data.length, true); dv.setUint32(22, raw.length, true); dv.setUint16(26, name.length, true); lh.set(name, 30);
    parts.push(lh, data);
    const ch = new Uint8Array(46 + name.length); const cv = new DataView(ch.buffer);
    cv.setUint32(0, 0x02014b50, true); cv.setUint16(4, 20, true); cv.setUint16(6, 20, true); cv.setUint16(8, 0x0800, true); cv.setUint16(10, method, true); cv.setUint16(12, tm, true); cv.setUint16(14, dt, true); cv.setUint32(16, crc, true); cv.setUint32(20, data.length, true); cv.setUint32(24, raw.length, true); cv.setUint16(28, name.length, true); cv.setUint32(42, offset, true); ch.set(name, 46); central.push(ch);
    offset += lh.length + data.length;
  }
  const cdSize = central.reduce((a, c) => a + c.length, 0); const end = new Uint8Array(22); const ev = new DataView(end.buffer);
  ev.setUint32(0, 0x06054b50, true); ev.setUint16(8, files.length, true); ev.setUint16(10, files.length, true); ev.setUint32(12, cdSize, true); ev.setUint32(16, offset, true);
  const all = [...parts, ...central, end]; const out = new Uint8Array(all.reduce((a, p) => a + p.length, 0)); let o = 0; for (const p of all) { out.set(p, o); o += p.length; }
  return out;
}

/* ── one section as XHTML ── */
/* o: { marks: the reader's marks for this text or null, verses: keep verse numbers (default true), epub: add epub:type attributes }. Returns { html, notes: [{ n, q, text }] }. */
function expSectionBody(secs, i, marks, o = {}) {
  const blocks = textBlocks(expClean(secs[i][1])); const out = []; const notes = []; const useMarks = o.marks !== false && marks && Array.isArray(marks.hl);
  /* the printed book's pictures (o.figs, see 2z-figures-core.js): in an e-book each is a file beside the chapters (o.figFiles collects them), in a web page the picture is inside the page */
  const figs = o.figs && o.figs.length ? o.figs.filter((f) => f[0] === i) : [];
  const pushFig = (p) => figs.forEach((f) => { if (f[1] !== p) return; if (o.figFiles) { const name = 'images/f' + (o.figFiles.length + 1) + '.' + figExt(f); o.figFiles.push({ name: 'OEBPS/' + name, mime: 'image/' + figMime(f), data: figBytes(f), store: true }); out.push(figHTML(f, { src: name, xml: true })); } else out.push(figHTML(f, { xml: true })); });
  pushFig(-1);
  /* the printed pages (o.pages: { map, vols }, see 2z-pages-core.js): a small "[p. 214]" where each begins; in an e-book it is also a page break for the reading app */
  const pgMark = (lab) => `<span class="pgn"${o.epub ? ' epub:type="pagebreak" role="doc-pagebreak"' : ''} title="${expX(pgmShort(lab, o.pages.vols))}">[${expX(pgmShort(lab, o.pages.vols))}]</span>`;
  const pgOf = (p) => (o.pages && o.pages.map ? pgmIn(o.pages.map, i, p) : []);
  blocks.forEach((blk, p) => {
    const { head, body } = blockParts(blk);
    if (head != null) out.push(`<h3 class="rh">${expX(visibleText(head))}</h3>`);
    if (!body.trim()) { pgOf(p).forEach(([, lab]) => out.push(`<p class="pgr">${pgMark(lab)}</p>`)); pushFig(p); return; }
    const vis = visibleText(body); const hls = []; const noted = [];
    if (useMarks) for (const h of marks.hl) { if (h.s !== i || h.p !== p) continue; const r = resolveAnchor(vis, h); if (r) { hls.push({ id: 'h' + hls.length, a: r[0], b: r[1], c: h.c, n: '' }); if (h.n && String(h.n).trim()) noted.push({ at: r[1], h }); } }
    let html = paraHTML(o.verses === false ? body.replace(/\[\[\d+\]\]/g, '') : body, { hls, pm: pgOf(p).map(([off, lab]) => [off, pgMark(lab)]) });
    html = html.replace(/ data-h="[^"]*"/g, '').replace(/\n/g, '<br/>').replace(/(<br\/>|^)( +)/g, (m, a, sp) => a + '&#160;'.repeat(sp.length));
    noted.sort((a, b) => a.at - b.at).forEach(({ h }) => { const k = notes.length + 1; notes.push({ n: k, q: String(h.q || ''), text: String(h.n) }); html += `<sup class="nr"><a${o.epub ? ' epub:type="noteref"' : ''} id="r${i}-${k}" href="#n${i}-${k}">${k}</a></sup>`; });
    out.push(`<p class="${/<br\/>/.test(html) ? 'pv' : 'pr'}" dir="auto">${html}</p>`); pushFig(p);
  });
  if (notes.length) out.push(`<section class="notes"${o.epub ? ' epub:type="endnotes"' : ''}><h3 class="nh">Notes</h3>${notes.map((n) => `<aside${o.epub ? ' epub:type="footnote"' : ''} id="n${i}-${n.n}"><p><a href="#r${i}-${n.n}">${n.n}.</a> <em>${expX(n.q.replace(/\s+/g, ' ').slice(0, 200))}</em> — ${expX(n.text).replace(/\n/g, '<br/>')}</p></aside>`).join('')}</section>`);
  return { html: out.join('\n'), notes };
}
const EXP_CSS = `body{font-family:Georgia,"Iowan Old Style","Palatino Linotype",Palatino,serif;line-height:1.55;margin:0 5%;color:#111}
h1.bt{font-size:1.9em;margin:2.2em 0 .2em;text-align:center;line-height:1.2}h2.st{font-size:1.35em;margin:1.6em 0 .8em;line-height:1.25;page-break-before:always;break-before:page}h3.rh{font-size:1.05em;margin:1.3em 0 .4em;font-style:italic;font-weight:600}
span.pgn{font:600 .72em system-ui,sans-serif;color:#666;border:1px solid #bbb;border-radius:99px;padding:0 .45em;margin:0 .25em;white-space:nowrap;vertical-align:.18em}p.pgr{margin:0 0 .6em;text-align:left}
p.by,p.lic,p.srcl{text-align:center;margin:.3em 0}p.lic,p.srcl{font-size:.85em;color:#444}p.pr{margin:0 0 .9em;text-align:left}p.pv{margin:0 0 1em}
sup.vn{font-size:.62em;font-weight:700;color:#666;margin:0 .15em 0 .25em;vertical-align:super;line-height:0}
mark,span.hl{background:#ffe3a0;color:inherit;padding:0 .05em}span.hl-green{background:#bdeed9}span.hl-blue{background:#bfe6fb}span.hl-rose{background:#ffc9d2}span.hl-violet{background:#e0d0ff}span.hl-gold{background:#ffe3a0}
sup.nr a{text-decoration:none;font-size:.8em;font-weight:700;color:#7a4b00}section.notes{margin:1.6em 0 0;border-top:1px solid #bbb;padding-top:.5em;font-size:.9em}h3.nh{font-size:.95em;margin:.2em 0 .5em}aside p{margin:.35em 0}
nav ol{list-style:none;padding-left:0}nav li{margin:.3em 0}a{color:inherit}
figure.fg{margin:1.2em 0;text-align:center;page-break-inside:avoid;break-inside:avoid}figure.fg img{max-width:100%;height:auto}figure.fg figcaption{font-size:.85em;color:#444;margin-top:.4em}`;
const expDoc = (title, body, css, lang = 'en', epub = false) => `<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE html>\n<html xmlns="http://www.w3.org/1999/xhtml"${epub ? ' xmlns:epub="http://www.idpf.org/2007/ops"' : ''} lang="${lang}" xml:lang="${lang}"><head><meta charset="utf-8"/><title>${expX(title)}</title>${css ? `<link rel="stylesheet" type="text/css" href="${css}"/>` : ''}</head><body>${body}</body></html>\n`;

/* ── the e-book ── */
/* book: { id, title, author, rights, source, lang?, note?, modified?: ISO string }, secs: the sections, o: { marks, verses }. Returns the files for expZip. */
function expEpubFiles(book, secs, o = {}) {
  const lang = book.lang || 'en'; const modified = (book.modified || new Date().toISOString()).replace(/\.\d+Z$/, 'Z'); const uuid = expUuid(book.id || book.title); const n = secs.length;
  const figFiles = []; const chaps = secs.map((s, i) => ({ href: 'c' + String(i + 1).padStart(4, '0') + '.xhtml', title: expTitle(s[0], i), body: expSectionBody(secs, i, o.marks, Object.assign({}, o, { epub: true, figFiles })).html }));
  const title = expClean(book.title || 'Untitled'); const author = expClean(book.author || '');
  const titlePage = `<h1 class="bt">${expX(title)}</h1>${author ? `<p class="by">${expX(author)}</p>` : ''}${book.note ? `<p class="lic">${expX(book.note)}</p>` : ''}<p class="lic">${expX(book.rights || '')}</p>${book.source ? `<p class="srcl">${expX(book.source)}</p>` : ''}<p class="srcl">Saved from the Lamplighter Project. The words are as the source prints them.</p>`;
  const files = [
    { name: 'mimetype', data: 'application/epub+zip', store: true },
    { name: 'META-INF/container.xml', data: `<?xml version="1.0" encoding="UTF-8"?>\n<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>\n` },
    { name: 'OEBPS/style.css', data: EXP_CSS },
    { name: 'OEBPS/title.xhtml', data: expDoc(title, titlePage, 'style.css', lang, true) },
    { name: 'OEBPS/nav.xhtml', data: expDoc('Contents', `<nav epub:type="toc" id="toc"><h1 class="bt" style="font-size:1.4em;margin-top:1em">Contents</h1><ol>${chaps.map((c) => `<li><a href="${c.href}">${expX(c.title)}</a></li>`).join('')}</ol></nav><nav epub:type="landmarks" hidden="hidden"><ol><li><a epub:type="titlepage" href="title.xhtml">Title page</a></li><li><a epub:type="bodymatter" href="${chaps.length ? chaps[0].href : 'title.xhtml'}">Start of the text</a></li></ol></nav>`, 'style.css', lang, true) },
    { name: 'OEBPS/toc.ncx', data: `<?xml version="1.0" encoding="UTF-8"?>\n<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1"><head><meta name="dtb:uid" content="urn:uuid:${uuid}"/><meta name="dtb:depth" content="1"/><meta name="dtb:totalPageCount" content="0"/><meta name="dtb:maxPageNumber" content="0"/></head><docTitle><text>${expX(title)}</text></docTitle><navMap>${chaps.map((c, k) => `<navPoint id="np${k + 1}" playOrder="${k + 1}"><navLabel><text>${expX(c.title)}</text></navLabel><content src="${c.href}"/></navPoint>`).join('')}</navMap></ncx>\n` },
  ];
  chaps.forEach((c, i) => files.push({ name: 'OEBPS/' + c.href, data: expDoc(c.title, `<h2 class="st">${expX(c.title)}</h2>\n${c.body}`, 'style.css', lang, true) }));
  figFiles.forEach((f) => files.push(f));                                   // the pictures of the printed book, stored as they are (already compressed)
  files.splice(2, 0, { name: 'OEBPS/content.opf', data: `<?xml version="1.0" encoding="UTF-8"?>\n<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="bookid" xml:lang="${lang}"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:identifier id="bookid">urn:uuid:${uuid}</dc:identifier><dc:title>${expX(title)}</dc:title>${author ? `<dc:creator>${expX(author)}</dc:creator>` : ''}<dc:language>${lang}</dc:language>${book.rights ? `<dc:rights>${expX(book.rights)}</dc:rights>` : ''}${book.source ? `<dc:source>${expX(book.source)}</dc:source>` : ''}<dc:publisher>The Lamplighter Project</dc:publisher><meta property="dcterms:modified">${modified}</meta></metadata><manifest><item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/><item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/><item id="css" href="style.css" media-type="text/css"/><item id="title" href="title.xhtml" media-type="application/xhtml+xml"/>${chaps.map((c, k) => `<item id="c${k + 1}" href="${c.href}" media-type="application/xhtml+xml"/>`).join('')}${figFiles.map((f, k) => `<item id="img${k + 1}" href="${f.name.slice(6)}" media-type="${f.mime}"/>`).join('')}</manifest><spine toc="ncx"><itemref idref="title"/>${chaps.map((c, k) => `<itemref idref="c${k + 1}"/>`).join('')}</spine></package>\n` });
  return files;
}
const expEpub = (book, secs, o) => expZip(expEpubFiles(book, secs, o));

/* ── plain text and Markdown ── */
function expPlain(book, secs, o = {}) {
  const useMarks = o.marks !== false && o.marks && Array.isArray(o.marks.hl); const out = [expClean(book.title || ''), book.author ? 'by ' + expClean(book.author) : '', book.rights ? expClean(book.rights) : '', book.source ? expClean(book.source) : '', '', 'Saved from the Lamplighter Project. The words are as the source prints them.', '', ''];
  out.push('CONTENTS', ...secs.map((s, i) => `  ${i + 1}. ${expTitle(s[0], i)}`), '');
  const figLine = (i, p) => (o.figs || []).filter((f) => f[0] === i && f[1] === p).forEach((f) => out.push('[Picture: ' + expClean(figAlt(f)).replace(/\s+/g, ' ').trim() + ']', ''));      // the book's pictures are not in a plain text; each leaves its caption where it was
  secs.forEach((s, i) => {
    out.push('', '='.repeat(60), `${i + 1}. ${expTitle(s[0], i)}`, '='.repeat(60), ''); const notes = []; figLine(i, -1);
    textBlocks(expClean(s[1])).forEach((blk, p) => {
      const { head, body } = blockParts(blk); if (head != null) out.push('— ' + visibleText(head).trim() + ' —', ''); if (!body.trim()) { if (o.pages && o.pages.map) pgmIn(o.pages.map, i, p).forEach(([, lab]) => out.push(`[${pgmShort(lab, o.pages.vols)}]`, '')); figLine(i, p); return; }
      const pgs = o.pages && o.pages.map ? pgmIn(o.pages.map, i, p) : [];
      let line = pgs.length ? pgmWeave(body, pgs, (lab) => `[${pgmShort(lab, o.pages.vols)}] `, (n) => (o.verses === false ? '' : `[${n}]`)) : o.verses === false ? visibleText(body) : body.replace(/\[\[(\d+)\]\]\s?/g, '[$1] ');
      if (useMarks) { const vis = visibleText(body); for (const h of o.marks.hl) { if (h.s !== i || h.p !== p || !h.n || !String(h.n).trim()) continue; const r = resolveAnchor(vis, h); if (r) notes.push(`  Note on “${String(h.q).replace(/\s+/g, ' ').slice(0, 80)}”: ${String(h.n).replace(/\s+/g, ' ')}`); } }
      out.push(expClean(line.replace(/[ \t]+\n/g, '\n').trim()), ''); if (notes.length) { out.push(...notes, ''); notes.length = 0; } figLine(i, p);
    });
  });
  return out.join('\n').replace(/\n{4,}/g, '\n\n\n') + '\n';
}
function expMarkdown(book, secs, o = {}) {
  const useMarks = o.marks !== false && o.marks && Array.isArray(o.marks.hl); const esc = (t) => expClean(t).replace(/([\\`*_{}\[\]<>#])/g, '\\$1');
  const out = [`# ${esc(book.title || '')}`, '', book.author ? `*${esc(book.author)}*` : '', book.rights ? esc(book.rights) : '', book.source ? `<${expClean(book.source)}>` : '', '', '*Saved from the Lamplighter Project. The words are as the source prints them.*', '', '## Contents', '', ...secs.map((s, i) => `${i + 1}. ${esc(expTitle(s[0], i))}`), ''];
  const figLine = (i, p) => (o.figs || []).filter((f) => f[0] === i && f[1] === p).forEach((f) => out.push(`*[Picture: ${esc(String(figAlt(f)).replace(/\s+/g, ' ').trim())}]*`, ''));
  secs.forEach((s, i) => {
    out.push('', `## ${esc(expTitle(s[0], i))}`, ''); figLine(i, -1);
    textBlocks(expClean(s[1])).forEach((blk, p) => {
      const { head, body } = blockParts(blk); if (head != null) out.push(`### ${esc(visibleText(head).trim())}`, ''); if (!body.trim()) { if (o.pages && o.pages.map) pgmIn(o.pages.map, i, p).forEach(([, lab]) => out.push(`*[${esc(pgmShort(lab, o.pages.vols))}]*`, '')); figLine(i, p); return; }
      const pgs = o.pages && o.pages.map ? pgmIn(o.pages.map, i, p) : []; const pgUsed = new Set(); const pgAt = (at) => pgs.map(([off, lab], q) => (off === at && !pgUsed.has(q) ? (pgUsed.add(q), `*[${esc(pgmShort(lab, o.pages.vols))}]* `) : '')).join('');
      const vis = visibleText(body); const hls = []; const noted = [];
      if (useMarks) for (const h of o.marks.hl) { if (h.s !== i || h.p !== p) continue; const r = resolveAnchor(vis, h); if (r) { hls.push(r); if (h.n && String(h.n).trim()) noted.push(h); } }
      const m = body.split(/(\[\[\d+\]\])/); let pos = 0; let line = '';
      for (const part of m) { const vm = /^\[\[(\d+)\]\]$/.exec(part); if (vm) { if (o.verses !== false) line += `<sup>${vm[1]}</sup>`; continue; } let seg = ''; for (let k = 0; k < part.length; k++) { const at = pos + k; const c = part[k]; const inHl = hls.some((r) => r[0] <= at && at < r[1]); const prev = hls.some((r) => r[0] <= at - 1 && at - 1 < r[1]); const next = hls.some((r) => r[0] <= at + 1 && at + 1 < r[1]); if (pgs.length) seg += pgAt(at); if (inHl && !prev) seg += '<mark>'; seg += c === '\n' ? '  \n' : esc(c); if (inHl && !next) seg += '</mark>'; } pos += part.length; line += seg; }
      if (pgs.length) line += pgs.map(([, lab], q) => (pgUsed.has(q) ? '' : ` *[${esc(pgmShort(lab, o.pages.vols))}]*`)).join('');
      out.push(line.trim(), ''); noted.forEach((h) => out.push(`> Note on “${esc(String(h.q).replace(/\s+/g, ' ').slice(0, 80))}”: ${esc(String(h.n).replace(/\s+/g, ' '))}`, '')); figLine(i, p);
    });
  });
  return out.join('\n').replace(/\n{4,}/g, '\n\n\n') + '\n';
}

/* ── one HTML page, for the screen, for printing and for Save as PDF ── */
function expHtmlPage(book, secs, o = {}) {
  const lang = book.lang || 'en'; const title = expClean(book.title || 'Untitled'); const size = o.size || 'medium';
  const body = secs.map((s, i) => { const t = expTitle(s[0], i); return `<section class="chap" id="s${i + 1}"><h2 class="st">${expX(t)}</h2>\n${expSectionBody(secs, i, o.marks, o).html}</section>`; }).join('\n');
  const toc = `<nav class="toc"><h2 class="ct">Contents</h2><ol>${secs.map((s, i) => `<li><a href="#s${i + 1}">${expX(expTitle(s[0], i))}</a></li>`).join('')}</ol></nav>`;
  const css = `${EXP_CSS.replace(/h2\.st\{[^}]*\}/, 'h2.st{font-size:1.35em;margin:1.6em 0 .8em;line-height:1.25}')}
body{max-width:40em;margin:0 auto;padding:1.5em 1.2em 4em;font-size:${size === 'large' ? '1.2' : size === 'small' ? '.95' : '1.08'}rem}.toc{page-break-after:always;break-after:page}h2.ct{text-align:center;font-size:1.3em}.toc ol{columns:2;column-gap:2em;padding-left:1.4em;font-size:.92em}.toc li{break-inside:avoid;margin:.15em 0}
.tp{min-height:70vh;display:flex;flex-direction:column;justify-content:center;page-break-after:always;break-after:page}section.chap{${o.breaks === false ? '' : 'page-break-before:always;break-before:page;'}}section.chap:first-of-type{page-break-before:auto;break-before:auto}
@page{margin:18mm 17mm 20mm}@media print{body{max-width:none;padding:0;font-size:11pt}a{text-decoration:none}.noprint{display:none}.toc ol{columns:2}p{orphans:3;widows:3}h2.st,h3.rh{break-after:avoid;page-break-after:avoid}mark,span.hl{-webkit-print-color-adjust:exact;print-color-adjust:exact}}`;
  const tp = `<div class="tp"><h1 class="bt">${expX(title)}</h1>${book.author ? `<p class="by">${expX(book.author)}</p>` : ''}${book.note ? `<p class="lic">${expX(book.note)}</p>` : ''}<p class="lic">${expX(book.rights || '')}</p>${book.source ? `<p class="srcl">${expX(book.source)}</p>` : ''}<p class="srcl">Saved from the Lamplighter Project. The words are as the source prints them.</p></div>`;
  return `<!DOCTYPE html>\n<html lang="${lang}"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>${expX(title)}</title><style>${css}</style></head><body>${tp}${toc}${body}</body></html>\n`;
}
if (typeof module !== 'undefined' && module.exports) module.exports = { expClean, expX, expFilename, expTitle, expUuid, expCrc32, expZip, expDeflateRaw, expSectionBody, expEpubFiles, expEpub, expPlain, expMarkdown, expHtmlPage, EXP_CSS };
