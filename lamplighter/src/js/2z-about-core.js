/* ═══════════════════════════ 2z · books about a tradition ═══════════════════════════
   The Atlas catalogue lists a tradition's OWN texts: its scriptures, hymns and laws. It does not list the books written ABOUT it: an observer's field record, a scholar's study, a history.
   The Library holds many of those, and for a small tradition they are nearly all there is to read. tools/library_about.json says which Library book is about which tradition;
   tools/build_atlas.py turns it round into `about: { tradition id: [Library ids] }` in the Atlas core file, and the tradition page lists them under Texts.
   `lore` has the same shape: the OLD SOURCE texts a revived religion draws on (the Eddas for Heathenry), from tools/library_lore.json, listed above the books about it.
   Pure functions (tests/about.test.js). `libById` is LIB_BY_ID. */
const ABOUT_KIND = { fld: 'Field record', sec: 'Study or history' };
/* the Library ids about one tradition that the Library really has, in the Atlas file's order; an id the Library does not know is left out rather than shown broken */
function aboutIds(about, id, libById) {
  const a = about && Object.prototype.hasOwnProperty.call(about, id) ? about[id] : null; if (!Array.isArray(a) || !libById) return [];
  return a.filter((x) => typeof x === 'string' && libById[x]);
}
/* the small line under a book's title: what kind of book it is, and when it was made or recorded */
function aboutLine(l) { return [ABOUT_KIND[l && l.tr], l && l.when].filter(Boolean).join(' · '); }
if (typeof module !== 'undefined' && module.exports) module.exports = { ABOUT_KIND, aboutIds, aboutLine };
