/* ═══════════════════════════ 2z · Editions left out of "Scriptures and sources" (made by tools/passage_pool.js; do not edit by hand) ═══════════════════════════
   Two lists of books that stay in "Everything", on their shelves and by name (the tool says how each is made). PSU_ANNOTATED: 18 editions whose catalogue note says an introduction, notes or a commentary are inside
   them and whose section headings do not mark where. PSU_READ_OUT: 3 read through and left out, each with its reason. PSU_ABOUT: 6 more whose picks are about the text, not the text (a mean of 0.18 or more phrases like "the passage" or "this tablet" per hundred words). */
const PSU_ANNOTATED = new Set("e-did e-lgj f-blt f-cyr f-lok f-mil x-avr x-bhp x-can x-dre x-enu x-gil x-gvp x-her x-pws x-sah x-tlh x-upa".split(' '));
const PSU_ABOUT = new Set("e-mish x-blv x-bod x-ham x-shy x-sum".split(' '));
const PSU_READ_OUT = {"x-pop":"a retelling with the author’s comparisons and study","x-lgd":"the editor’s commentary on each legend is printed with it","x-pta":"the editors’ long introduction is a third of the book, with nothing to mark it"};
if (typeof module !== 'undefined' && module.exports) module.exports = { PSU_ANNOTATED, PSU_ABOUT, PSU_READ_OUT };
