/* ═══════════════════════════ 2z · Finding words inside one text ═══════════════════════════
   Pure functions. A hit is where a phrase occurs in the text a reader has open: the section, the paragraph, which occurrence in that paragraph (so the reader can land on that
   exact one and mark it as the current hit), and a little of the words around it. Matching is the same as the reader's highlighting (paraHTML in 2p-marks-core.js): not
   case-sensitive, over the words as printed without verse numbers, so what the list says is what the page shows. It relies on textBlocks, blockParts, visibleText and
   mkEscRe from that file. */
const RDF_MIN = 2; const RDF_MAX = 200;
/* every occurrence of `query` in reading order. opts.max caps the list (default 400); opts.skip(body) leaves a paragraph out (lines in other languages that are hidden). */
function rdFindAll(secs, query, opts) {
  const o = opts || {}; const max = Math.max(1, Math.min(5000, Math.round(o.max) || 400)); const q = String(query == null ? '' : query).replace(/\s+/g, ' ').trim().slice(0, RDF_MAX);      // a phrase, not a book: a regular expression has a size limit
  const out = { q, hits: [], capped: false, paragraphs: 0, sections: 0 }; if (q.length < RDF_MIN) return out;
  const re = new RegExp(mkEscRe(q), 'gi'); const seen = new Set();
  for (let k = 0; k < secs.length && !out.capped; k++) {
    const blocks = textBlocks(secs[k][1]);
    for (let p = 0; p < blocks.length; p++) {
      const body = blockParts(blocks[p]).body; if (!body || !body.trim() || (o.skip && o.skip(body))) continue;
      const vis = visibleText(body); re.lastIndex = 0; let m; let n = 0; let any = false;
      while ((m = re.exec(vis))) {
        if (!m[0].length) { re.lastIndex++; continue; }
        if (out.hits.length >= max) { out.capped = true; break; }
        const a = m.index; const b = a + m[0].length;
        out.hits.push({ k, p, n: n++, pre: (a > 46 ? '…' : '') + vis.slice(Math.max(0, a - 46), a).replace(/\s+/g, ' '), mt: vis.slice(a, b).replace(/\s+/g, ' '), post: vis.slice(b, b + 72).replace(/\s+/g, ' ') + (b + 72 < vis.length ? '…' : '') });
        any = true;
      }
      if (any) { out.paragraphs++; seen.add(k); }
      if (out.capped) break;
    }
  }
  out.sections = seen.size; return out;
}
/* the next or previous hit, wrapping round; -1 when there are none */
function rdFindStep(count, cur, dir) { if (!(count > 0)) return -1; if (!(cur >= 0)) return dir < 0 ? count - 1 : 0; return (cur + (dir < 0 ? -1 : 1) + count) % count; }
/* the first hit at or after a place (section k, paragraph p); the first hit if none is after it */
function rdFindNear(hits, k, p) { const i = hits.findIndex((h) => h.k > k || (h.k === k && h.p >= p)); return hits.length ? (i < 0 ? 0 : i) : -1; }
if (typeof module !== 'undefined' && module.exports) module.exports = { RDF_MIN, RDF_MAX, rdFindAll, rdFindStep, rdFindNear };
