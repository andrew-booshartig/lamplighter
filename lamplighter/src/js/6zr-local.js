/* ═══════════════════════════ 6zr · The sources' own files on this computer, offered in the reader ═══════════════════════════
   If the originals/ folder beside this page holds a text's source files (tools/fetch_originals.py, 2z-local-core.js), "Where this text comes from" gets a second card under it: the files, which open
   with no connection. The list (originals/index.js) is read once, at the start, through the same loader as the texts. No folder, no list, no card: nothing changes. Nothing is fetched from anywhere else. */
/* the originals/ folder belongs to a copy kept on a computer (a file, or a server on this machine): a copy on a website has none, so it never asks for the list, which used to be a 404 on every load (AA-24) */
const localIsLocalCopy = (loc) => { try { const l = loc || {}; if (l.protocol === 'file:') return true; const h = String(l.hostname || '').toLowerCase(); return h === 'localhost' || h === '127.0.0.1' || h === '[::1]' || h === '::1' || h.endsWith('.localhost'); } catch (e) { return false; } };
const LOCAL = {
  map: Object.create(null), _p: null,
  load() { if (!LOCAL._p) LOCAL._p = localIsLocalCopy(typeof location !== 'undefined' ? location : null) ? TXT.script('../originals/index').then(() => { LOCAL.map = localClean(globalThis.BEATLAB_LOCAL); }, () => { /* no originals folder: that is how it starts */ }) : Promise.resolve(); return LOCAL._p; },
  has: (id) => Object.prototype.hasOwnProperty.call(LOCAL.map, id),
};
if (typeof document !== 'undefined' && document.head && document.createElement) LOCAL.load();
function localCardHTML(id) {
  if (!LOCAL.has(id)) return '';
  const links = localLinks(LOCAL.map[id]); if (!links.length) return '';
  return `<div class="srccard" role="group" aria-label="The original files on this computer" style="margin-top:10px"><div class="src-head"><span class="tag src-kind">On this computer</span><b>The original files, kept in the originals folder</b></div>
    <p class="small t2" style="margin:6px 0">The files the source publishes, copied beside this page. They open with no connection.</p>
    <div class="row tight">${links.map((l) => `<a class="btn sm" href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">${esc(l.kind)} · ${esc(l.label)}${l.size ? ' · ' + esc(l.size) : ''} ↗</a>`).join('')}</div></div>`;
}
const provCardLocalOrig = provCardHTML;
provCardHTML = function (id, meta, entry, printedGrade) { return provCardLocalOrig(id, meta, entry, printedGrade) + localCardHTML(id); };
