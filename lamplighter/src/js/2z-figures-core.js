/* ═══════════════════════════ 2z · Pictures from the original editions ═══════════════════════════
   A text in the Library is plain words; where the printed book had pictures (the cards of a tarot, the vignettes of the Book of the Dead, tablets and plates) they sit beside it in texts/fig-<id>.js (flat, like the texts, so the offline and release tools list them), made by
   tools/texts_figures.py from the book's own EPUB. texts/figs.js says which texts have pictures. The reader draws each after the paragraph it followed in the book, and a saved e-book or web page carries them.
   An entry: [section, paragraph, data address, width, height, description, caption]; paragraph is the reader's block number in that section (the blocks between blank lines), -1 for before the first.
   Nothing in the text itself changes, so highlights, bookmarks, search, "Find similar" and the passage picker are as they were. Only data addresses of PNG, JPEG or GIF are accepted. */
const FIG_DATA = /^data:image\/(jpeg|png|gif);base64,[A-Za-z0-9+/]+=*$/;
const figEsc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
/* the usable entries of a texts/fig-<id>.js list, in book order: whole numbers in range, a real picture address, a size */
function figClean(list, nSecs) {
  if (!Array.isArray(list)) return [];
  const ok = list.filter((f) => Array.isArray(f) && Number.isInteger(f[0]) && f[0] >= 0 && (nSecs == null || f[0] < nSecs) && Number.isInteger(f[1]) && f[1] >= -1 && typeof f[2] === 'string' && FIG_DATA.test(f[2]) && f[3] > 0 && f[4] > 0)
    .map((f) => [f[0], f[1], f[2], f[3] | 0, f[4] | 0, String(f[5] == null ? '' : f[5]).slice(0, 400), String(f[6] == null ? '' : f[6]).slice(0, 800)]);
  return ok.map((f, k) => [f, k]).sort((a, b) => a[0][0] - b[0][0] || a[0][1] - b[0][1] || a[1] - b[1]).map((x) => x[0]);
}
const figsOf = (figs, s) => (figs || []).filter((f) => f[0] === s);
const figMime = (f) => (/^data:image\/(\w+);/.exec(f[2]) || [0, 'jpeg'])[1];
const figExt = (f) => ({ jpeg: 'jpg', png: 'png', gif: 'gif' }[figMime(f)] || 'jpg');
/* the picture's bytes, for an e-book (the browser's atob, or Node's Buffer in the tests) */
function figBytes(f) { const b64 = f[2].slice(f[2].indexOf(',') + 1); if (typeof atob === 'function') { const s = atob(b64); const u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; } return new Uint8Array(Buffer.from(b64, 'base64')); }
const figAlt = (f) => f[5] || f[6] || 'Picture from the original edition';
/* the markup of one picture. o.src: an address to use in place of the data address (an e-book keeps the file apart); o.xml: close the tag the way XHTML wants it */
function figHTML(f, o) {
  o = o || {}; const src = o.src || f[2]; const cap = f[6];
  return `<figure class="${o.xml ? 'fg' : 'rfig'}"><img src="${figEsc(src)}" width="${f[3]}" height="${f[4]}" alt="${figEsc(figAlt(f))}"${o.xml ? '/' : ' loading="lazy" decoding="async"'}>${cap ? `<figcaption dir="auto">${figEsc(cap)}</figcaption>` : ''}</figure>`;
}
if (typeof module !== 'undefined' && module.exports) module.exports = { FIG_DATA, figEsc, figClean, figsOf, figMime, figExt, figBytes, figAlt, figHTML };
