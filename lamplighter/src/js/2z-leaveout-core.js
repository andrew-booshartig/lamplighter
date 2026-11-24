/* ═══════════════════════════ 2z · Leaving areas out ═══════════════════════════
   The Library has grown to seventeen collections, and a reader will not want all of them in every random passage or search. Whole collections can be LEFT OUT:
   they are drawn from no random passage and searched by no "All texts" search, and (once a choice has been made) folded away in the Library's list. Nothing is deleted:
   a left-out collection can still be ticked in the passage picker, chosen by name in the search box, and opened book by book.
   Saved as the collections' NAMES (like the picker's ticked areas), so adding a collection never shifts a saved choice. Nothing saved means the old rule: only the
   imagined shelf is left out. Pure functions here (tests/leaveout.test.js); the control and its wiring are in 6g-library.js. */
const LEFTOUT_KEY = 'lib.leftout';

/* the saved names, kept only if they are collections now; null when nothing (or junk) was saved */
function leftOutClean(raw, collections) {
  if (!Array.isArray(raw)) return null;
  const known = new Set(collections.map((c) => c[0]));
  return [...new Set(raw.filter((n) => typeof n === 'string' && known.has(n)))];
}
/* a collection made only of groups of the imagined shelf */
const leftOutIsImagined = (coll, imaginedGroups) => coll[2].length > 0 && coll[2].every((g) => imaginedGroups.includes(g));
/* the collections left out, as indexes: the saved choice, or, when none was ever made, only the imagined shelf */
function leftOutSet(raw, collections, imaginedGroups) {
  const clean = leftOutClean(raw, collections);
  if (clean) { const at = new Map(collections.map((c, i) => [c[0], i])); return new Set(clean.map((n) => at.get(n))); }
  return new Set(collections.map((c, i) => (leftOutIsImagined(c, imaginedGroups) ? i : -1)).filter((i) => i >= 0));
}
/* the new saved names after leaving one collection out or bringing it back */
function leftOutWith(raw, collections, imaginedGroups, index, out) {
  const cur = leftOutSet(raw, collections, imaginedGroups); if (out) cur.add(index); else cur.delete(index);
  return collections.filter((c, i) => cur.has(i)).map((c) => c[0]);
}
/* the preset "scriptures and sources only": every collection made only of the wider shelves (occult, Masonic, shamanic, folklore, folk tales) or the imagined shelf */
function leftOutWider(collections, shelfOnlyGroups, imaginedGroups) {
  return collections.filter((c) => c[2].length > 0 && c[2].every((g) => shelfOnlyGroups.includes(g) || imaginedGroups.includes(g))).map((c) => c[0]);
}
/* has a choice been saved (so the Library's list may fold the left-out collections away)? */
const leftOutChosen = (raw, collections) => leftOutClean(raw, collections) !== null;
/* a short sentence for the control and the search box */
function leftOutSummary(n, chosen) { return n ? `${n} area${n === 1 ? '' : 's'} left out of random passages and “all texts” searches${chosen ? '' : ' (the imagined shelf, until you change it)'}` : 'nothing left out'; }

if (typeof module !== 'undefined' && module.exports) module.exports = { LEFTOUT_KEY, leftOutClean, leftOutIsImagined, leftOutSet, leftOutWith, leftOutWider, leftOutChosen, leftOutSummary };
