/* ═══════════════════════════ 2z · The original edition of a text ═══════════════════════════
   Every text in the Library was made from a public edition: a Project Gutenberg book, a scan on the Internet Archive, a typed reading edition, eBible.org. If the reader does not suit someone, the original
   (an EPUB for an e-reader, a Kindle file, the PDF of the scan with every picture on every page, the full text, a web page) is one click away. The data is texts/originals.js (made by tools/texts_originals.py: it
   probes each source for the formats that exist and their sizes), loaded on demand by TXT.orig(). The app never fetches any of these files: each is a plain link to the source's own website, followed only when clicked,
   and a link is only ever shown if it is an https address. Entry: id → [source name, [[part label, page, [[format label, file url, bytes], ...]], ...]] (several parts for a text made from several volumes). */
const origUrlOk = (u) => { try { return new URL(String(u)).protocol === 'https:'; } catch (e) { return false; } };
const origEsc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function origBytes(n) { n = +n || 0; if (!n) return ''; if (n < 1048576) return Math.max(1, Math.round(n / 1024)) + ' KB'; const m = n / 1048576; return (m < 10 ? m.toFixed(1) : m < 1024 ? String(Math.round(m)) : (m / 1024).toFixed(1) + ' GB') + (m < 1024 ? ' MB' : ''); }
function origHost(u) { try { return new URL(String(u)).hostname.replace(/^www\./, ''); } catch (e) { return 'the source'; } }
/* what sort of file a format label names, so a list can be filtered: epub, kindle, pdf, text, web, djvu */
function origKind(label) { const t = String(label); return /epub/i.test(t) ? 'epub' : /kindle|azw3|kf8|mobi/i.test(t) ? 'kindle' : /pdf/i.test(t) ? 'pdf' : /plain text|full text/i.test(t) ? 'text' : /web page|read online|html/i.test(t) ? 'web' : /djvu/i.test(t) ? 'djvu' : 'other'; }
const ORIG_KINDS = { epub: 'EPUB (e-readers)', kindle: 'Kindle', pdf: 'PDF', text: 'Plain text', web: 'Web page' };
/* the clean entry for one text: only https links, parts that have something to open, or (when the sidecar has nothing) a plain link made from the text's own src, or nothing */
function origEntry(all, id, meta) {
  const e = all && Object.prototype.hasOwnProperty.call(all, id) ? all[id] : null;
  if (Array.isArray(e) && typeof e[0] === 'string' && Array.isArray(e[1])) {
    const parts = e[1].filter(Array.isArray).map((p) => ({ label: String(p[0] || ''), page: origUrlOk(p[1]) ? String(p[1]) : '', files: (Array.isArray(p[2]) ? p[2] : []).filter((f) => Array.isArray(f) && origUrlOk(f[1])).map((f) => ({ label: String(f[0]), url: String(f[1]), bytes: +f[2] || 0 })) })).filter((p) => p.page || p.files.length);
    if (parts.length) return { source: e[0], parts };
  }
  const m = meta && Object.prototype.hasOwnProperty.call(meta, id) ? meta[id] : null;
  if (m && m.src && origUrlOk(m.src)) return { source: origHost(m.src), parts: [{ label: '', page: String(m.src), files: [] }] };
  return null;
}
/* the block shown in the reader's details and in the Save dialog */
function origHTML(entry, o) {
  o = o || {}; if (!entry) return '';
  const link = (u, t) => `<a class="chip" href="${origEsc(u)}" target="_blank" rel="noopener noreferrer">${t} ↗</a>`;
  const rows = entry.parts.map((p) => {
    const files = p.files.map((f) => link(f.url, origEsc(f.label) + (f.bytes ? ' · ' + origBytes(f.bytes) : ''))).join(' ');
    const page = p.page ? link(p.page, p.files.length ? 'Its page' : 'Open at ' + origEsc(entry.source)) : '';
    return `<div class="orig-part" style="margin-top:6px">${p.label ? `<b class="small">${origEsc(p.label)}</b> ` : ''}${files}${files && page ? ' ' : ''}${page}</div>`;
  }).join('');
  return `<div class="orig" role="group" aria-label="The original edition"><div class="small"><b>The original edition</b> <span class="muted">from ${origEsc(entry.source)}${o.short ? '' : '. These open the source’s own website, so they need a connection; the Lamplighter Project itself does nothing online.'}</span></div>${rows}</div>`;
}
/* every file link of the chosen kinds (null = all) for the texts in ids: [{ id, title, source, part, label, kind, url, bytes }] */
function origFiles(all, meta, ids, kinds, titleOf) {
  const out = []; const want = kinds ? new Set(kinds) : null;
  ids.forEach((id) => { const e = origEntry(all, id, meta); if (!e) return; e.parts.forEach((p) => p.files.forEach((f) => { const k = origKind(f.label); if (want && !want.has(k)) return; out.push({ id, title: titleOf ? titleOf(id) : id, source: e.source, part: p.label, label: f.label, kind: k, url: f.url, bytes: f.bytes }); })); });
  return out;
}
/* one web address per line, for a download manager (for example: wget -i lamplighter-original-links.txt) */
const origUrlList = (files) => files.map((f) => f.url).join('\n') + (files.length ? '\n' : '');
const origCsvCell = (v) => { const s = String(v == null ? '' : v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
function origCsv(files) { return ['id,title,source,part,format,bytes,url'].concat(files.map((f) => [f.id, f.title, f.source, f.part, f.label, f.bytes || '', f.url].map(origCsvCell).join(','))).join('\n') + '\n'; }
if (typeof module !== 'undefined' && module.exports) module.exports = { origUrlOk, origEsc, origBytes, origHost, origKind, ORIG_KINDS, origEntry, origHTML, origFiles, origUrlList, origCsv };
