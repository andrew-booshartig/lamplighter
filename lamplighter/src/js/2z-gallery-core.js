/* ═══════════════════════════ 2z · The art gallery: the pictures printed in the library's books ═══════════════════════════
   Pure functions (tests/gallery.test.js). The library holds no loose works of art; what it holds are the pictures its books printed (photographs, engravings, plates, drawings, manuscript pages), kept beside each
   book in texts/fig-<id>.js and listed in texts/figs.js (see 2z-figures-core.js). The gallery gathers them: it opens on a strip of ten, then offers the two tags the data really has (the library's collection of the book
   and the date of its text), then the books that have pictures, shelf by shelf, and a book's pictures a page at a time.
   BEATLAB_FIGN[id] = [number of pictures, bytes, characters of the text it was made for, sections]. Where to look for the famous works the books do not hold is a list of searches on Wikimedia Commons.
   The tags are the BOOK's, never the picture's (no picture carries a tag of its own): a book's collection (the Library's own: LIB_COLLECTIONS) and the date its text gives for itself (the "when" of the Library entry, which is when
   the text is from or was recorded, not when the picture was printed: most pictures were printed between 1850 and 1930, whatever the age of the text). A picture's words are its printed caption, else its description. */
const GAL_PAGE = 40;
/* the dates of the texts, as five spans (id, label, from, before): the first date a book's "when" gives */
const GAL_ERAS = [['bce-500', 'Before 500 BCE', -Infinity, -500], ['ce-0', '500 BCE – 500 CE', -500, 500], ['ce-500', '500 – 1500', 500, 1500], ['ce-1500', '1500 – 1800', 1500, 1800], ['ce-1800', 'From 1800', 1800, Infinity]];
/* a rough year for a Library entry's "when" ("c. 2400 BCE – 400 CE", "recorded 1920s CE", "14th c. CE", "1799–1815 CE (recorded 1913)", "grimoire … from the 15th–16th c.; Mathers 1889"): the first date it gives, BCE negative; null when it gives none */
function galleryYear(when) {
  const s = String(when == null ? '' : when);
  let m = /(\d{1,2})(?:st|nd|rd|th)(?:\s*[–-]\s*\d{1,2}(?:st|nd|rd|th))?\s*c\.?(?:\s*(BCE|CE)\b)?/.exec(s);
  if (m) { const n = +m[1]; return (m[2] ? m[2] === 'BCE' : /BCE/.test(s)) ? -(n * 100 - 50) : (n - 1) * 100 + 50; }      /* a century is its middle */
  m = /(\d{1,4})s?(?:\s*[–-]\s*\d{1,4}s?)?\s*(BCE|CE)\b/.exec(s); if (m) return m[2] === 'BCE' ? -(+m[1]) : +m[1];
  m = /\b(1[0-9]{3}|20[0-2][0-9])\b/.exec(s); return m ? +m[1] : null;
}
const galleryEra = (when) => { const y = galleryYear(when); if (y == null) return ''; const e = GAL_ERAS.find((x) => y >= x[2] && y < x[3]); return e ? e[0] : ''; };
/* short names for the collections, for chips (any other collection keeps its own name) */
const GAL_TRAD_SHORT = { 'Second Temple and early Christian writings': 'Second Temple and Christian', 'The ancient Near East and Egypt': 'Near East and Egypt', 'The Americas, Africa and the Pacific': 'Americas, Africa, Pacific', 'Freemasonry and initiatory orders': 'Freemasonry',
  'Shamanic and tribal traditions': 'Shamanic and tribal', 'Folklore, witchcraft and the fairy faith': 'Folklore and witchcraft', 'Modern movements and study aids': 'Modern movements', 'The imagined shelf': 'Imagined shelf' };
const galleryTradLabel = (name) => GAL_TRAD_SHORT[name] || String(name || '');
/* the illustrated books, by the Library's collections: [{ id, name, blurb, books: [{ id, title, count, bytes, group, when, era }] }]; id is the first shelf of the collection (a stable word for an address); have: the ids this copy holds (or null for all) */
function galleryShelves(figN, libById, collections, have) {
  const out = []; const ids = figN && typeof figN === 'object' ? Object.keys(figN) : [];
  (collections || []).forEach((c) => {
    const groups = c[2] || [];
    const books = ids.filter((id) => libById && libById[id] && groups.includes(libById[id].group) && (!have || have[id]) && Array.isArray(figN[id]) && figN[id][0] > 0)
      .map((id) => ({ id, title: libById[id].title, count: figN[id][0] | 0, bytes: +figN[id][1] || 0, group: libById[id].group, when: libById[id].when || '', era: galleryEra(libById[id].when) })).sort((a, b) => a.title.localeCompare(b.title));
    if (books.length) out.push({ id: groups[0] || '', name: c[0], blurb: c[1] || '', books });
  });
  return out;
}
const galleryTotals = (shelves) => (shelves || []).reduce((a, s) => { s.books.forEach((b) => { a.books++; a.pictures += b.count; a.bytes += b.bytes; }); return a; }, { books: 0, pictures: 0, bytes: 0 });
/* the two tags the data has, with what each covers: the collections (in the Library's order) and the five spans of dates, each with its books and pictures; undated: books whose text gives no date */
function galleryTags(shelves) {
  const trad = (shelves || []).map((s) => ({ id: s.id, name: s.name, label: galleryTradLabel(s.name), books: s.books.length, pictures: s.books.reduce((a, b) => a + b.count, 0) }));
  const era = GAL_ERAS.map((e) => ({ id: e[0], label: e[1], books: 0, pictures: 0 })); let undated = 0;
  (shelves || []).forEach((s) => s.books.forEach((b) => { const e = era.find((x) => x.id === b.era); if (e) { e.books++; e.pictures += b.count; } else undated += b.count; }));
  return { trad, era: era.filter((e) => e.books > 0), undated };
}
/* the shelves left when a tradition (a collection id) and a span of dates (an era id) are chosen; an empty or unknown choice means all */
function gallerySelect(shelves, sel) {
  const t = sel && sel.t || ''; const e = sel && sel.e || '';
  const out = (shelves || []).filter((s) => !t || s.id === t).map((s) => ({ id: s.id, name: s.name, blurb: s.blurb, books: s.books.filter((b) => !e || b.era === e) })).filter((s) => s.books.length);
  return { shelves: out, totals: galleryTotals(out) };
}
const galleryPages = (n) => Math.max(1, Math.ceil((n | 0) / GAL_PAGE));
const galleryPage = (q, pages) => Math.min(Math.max(Math.floor(+q) || 1, 1), pages);
/* a picture's words for under its thumbnail: its caption, else its description, kept short */
function galleryLabel(f) {
  const t = String((f && (f[6] || f[5])) || '').replace(/\s+/g, ' ').trim();
  return t.length > 90 ? t.slice(0, 87).replace(/\s+\S*$/, '') + '…' : t;
}
/* the title of a book without its author, date or other brackets, for a line under a picture */
const galleryShortTitle = (title) => { const t = String(title == null ? '' : title).replace(/\s*\([^()]*\)/g, '').replace(/:.*$/, '').replace(/\s+/g, ' ').trim(); return t.length > 64 ? t.slice(0, 63).replace(/\s+\S*$/, '') + '…' : t; };
/* a description that reads as words (OCR of a caption can come out as noise: stray symbols, most pieces not words) */
function galleryReadable(s) {
  const t = String(s || '').trim(); if (t.length < 4 || /[*<>|\\^~«»•]/.test(t)) return false;
  const w = t.split(/\s+/); return w.filter((x) => /^[A-Za-z’'À-ɏ-]{3,}[.,;:!?]?$|^[0-9]+[.,]?$|^[A-Za-z]{1,2}[.,;:!?]?$/.test(x)).length >= Math.max(1, Math.ceil(w.length * 0.6));
}
/* the words for a picture, and what they are: its printed caption; else, where the description is only "Picture in the section “…”", the nearest heading (with the book's title when it is given); else the description when it reads as words;
   else a plain line, never a guess. kind: caption, heading, description or none */
const GAL_SECTION = /^Picture in the section\s+[“"](.+?)[”"]\.?$/;
function galleryCaption(f, title) {
  const clean = (x) => String(x == null ? '' : x).replace(/\s+/g, ' ').trim(); const cap = clean(f && f[6]); const desc = clean(f && f[5]); const t = title ? galleryShortTitle(title) : '';
  if (cap) return { text: cap, kind: 'caption' };
  const m = GAL_SECTION.exec(desc); if (m) { const h = m[1].trim(); return { text: t ? `${t} – ${h}` : h, kind: 'heading', heading: h }; }
  if (desc && galleryReadable(desc)) return { text: desc, kind: 'description' };
  return { text: t ? `A picture in ${t}` : 'A picture from the original edition', kind: 'none' };
}
/* the ten pictures the gallery opens on: one from each of ten books, found by the start of their words (so a rebuilt picture file still finds them), chosen to span ten different shelves of the Library (seven collections): Egypt, Mesopotamia, Greece, Buddhism, India, the Norse,
   Tibetan tales, Christian writing, the esoteric and Pueblo tales. A copy without a book leaves its tile out. */
const GAL_STRIP = [['x-bod', 'Scenes and texts from the Sixth Section'], ['x-gil', 'Specimens of Tablets from Nineveh'], ['x-hhy', 'Hermes with the boy Dionysos'], ['x-ls', 'The return of the Chinese envoys'], ['x-bhp', 'A diagram of Jambu-Dvipa'],
  ['x-poe', 'A feast in Valhalla'], ['t-wadd', 'The hare and the tiger'], ['x-bga', 'Bunyan hears a Voice from Heaven'], ['m-levh', 'The pentagram of the Absolute'], ['t-lumm', 'The coyote carries the baby']];
/* the picture of a book (the cleaned list of figClean) whose words start with `want`; else the first with a real caption that is big enough to see; else null */
function galleryStripPick(list, want) {
  const norm = (s) => String(s || '').replace(/\s+/g, ' ').trim().toLowerCase(); const w = norm(want); const l = Array.isArray(list) ? list : [];
  const hit = w && l.find((f) => norm(f[6]).startsWith(w) || norm(f[5]).startsWith(w)); if (hit) return hit;
  return l.find((f) => f[6] && f[3] >= 200 && f[4] >= 150) || null;
}
const galleryMB = (n) => (n >= 1048576 ? (n / 1048576).toFixed(n >= 10485760 ? 0 : 1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB');
/* searches on Wikimedia Commons for the art the books do not hold (label, words); the page only follows one when it is clicked */
const GALLERY_LOOK = [
  ['Buddhist art', 'Buddhist art'], ['Hindu art', 'Hindu temple sculpture painting'], ['Islamic art', 'Islamic art calligraphy architecture'], ['Christian art', 'Christian religious painting icon'],
  ['Jewish art', 'Jewish ceremonial art illuminated manuscript'], ['Sikh art', 'Sikh art Golden Temple'], ['China, Japan and Korea', 'Daoist Shinto Buddhist painting temple'], ['African religions', 'African religious art masks sculpture'],
  ['Indigenous Americas', 'Native American Mesoamerican Andean religious art'], ['Egypt and the ancient Near East', 'Egyptian Mesopotamian religious art relief'], ['Greece and Rome', 'Greek Roman religious sculpture temple'],
];
const galleryCommons = (q) => 'https://commons.wikimedia.org/w/index.php?search=' + encodeURIComponent(q) + '&ns6=1&ns14=1';
if (typeof module !== 'undefined' && module.exports) module.exports = { GAL_PAGE, GAL_ERAS, GAL_STRIP, galleryYear, galleryEra, galleryTradLabel, galleryShelves, galleryTotals, galleryTags, gallerySelect, galleryPages, galleryPage, galleryLabel, galleryShortTitle, galleryReadable, galleryCaption, galleryStripPick, galleryMB, GALLERY_LOOK, galleryCommons };
