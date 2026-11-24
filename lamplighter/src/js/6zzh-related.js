/* ═══════════════════════════ 6zzh · Related: the strip, and the shared foot of an entity page ═══════════════════════════
   relatedBox(kind, id, opts) draws what 2z-related-core.js finds (STRUCTURE_AUDIT.md, section D): one <section class="rel"> with one “Related” heading, the group headings in their fixed order, five items to a group and then
   “N more” (the address of the page that lists them), at most five groups open and the rest under one closed “More related”. It returns '' when there is nothing to show, and never throws. Plain links, no scripts.
   A strip with exactly one item is one quiet line without the heading (FA-05). At 560 px or less (REL_COMPACT) a group shows three items and three groups are open; the rest of those groups and the other groups sit under the one closed “More related” (FA-08).
   A page that calls it before the data is loaded gets a hidden placeholder, and the strip fills itself in when the files have arrived (so a call site is one line, and needs no await).
   pgFoot({ label, how, related, next }) is the shared end of an entity page: a quiet label line, one closed “How to read this page”, the Related strip, and one way on (the .onward line Practice already uses).
   `label`, `how` and `related` are HTML the caller has escaped (as the page's own template strings are); `next` is { href, label } (escaped here) or an HTML string. Tests: tests/related.test.js. */
const relEsc = (s) => (typeof esc === 'function' ? esc(s) : String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])));
function relItemInner(it) {
  const name = it.href ? `<a href="${relEsc(it.href)}">${relEsc(it.label)}</a>` : `<span>${relEsc(it.label)}</span>`;
  return `${name}${it.tag ? ` <span class="tag">${relEsc(it.tag)}</span>` : ''}${it.sub ? ` <span class="small muted">${relEsc(it.sub)}</span>` : ''}`;
}
const relItemHTML = (it) => `<li>${relItemInner(it)}</li>`;
function relGroupHTML(g) {
  return `<div class="rel-g" data-rel-g="${relEsc(g.key)}"${g.cont ? ' data-rel-cont="1"' : ''}><h4 class="rel-gh">${relEsc(g.label)}</h4>${g.note ? `<p class="small muted rel-note">${relEsc(g.note)}</p>` : ''}<ul class="rel-list">${g.items.map(relItemHTML).join('')}</ul>${g.more ? `<p class="small rel-more"><a href="${relEsc(g.more.href)}">${g.more.n} more</a></p>` : ''}${g.tail ? `<p class="small rel-more rel-tail">${relEsc(g.tail.text)} <a href="${relEsc(g.tail.href)}">${relEsc(g.tail.link)}</a></p>` : ''}</div>`;
}
/* FA-05: a strip with exactly one item is one quiet line, “On the map: Pasargadae”, with the group's own label and no “Related” heading (a heading over one link is clutter) */
function relOneHTML(g) {
  const it = g.items[0]; const name = it.href ? `<a href="${relEsc(it.href)}">${relEsc(it.label)}</a>` : `<span>${relEsc(it.label)}</span>`;
  return `<section class="rel rel-one" aria-label="Related"><p class="small rel-line"><span class="rel-lab">${relEsc(g.label)}:</span> ${name}${it.tag ? ` <span class="tag">${relEsc(it.tag)}</span>` : ''}${it.sub ? ` <span class="small muted">· ${relEsc(it.sub)}</span>` : ''}${g.note ? ` <span class="small muted rel-note">· ${relEsc(g.note)}</span>` : ''}</p></section>`;
}
/* FA-08, on a phone (compact): the first `per` items of a group stay where they are and the others go, under the group's own heading, to the closed “More related” */
function relSplit(g, per) {
  if (g.items.length <= per) return [g, null];
  return [Object.assign({}, g, { items: g.items.slice(0, per), more: null, tail: null }), { key: g.key, label: g.label, items: g.items.slice(per), more: g.more, tail: g.tail, cont: true }];
}
function relStripHTML(groups, o) {
  if (!Array.isArray(groups) || !groups.length) return '';
  if (groups.length === 1 && groups[0].items.length === 1 && !groups[0].more && !groups[0].tail) return relOneHTML(groups[0]);
  const compact = !!(o && o.compact); const head = groups.slice(0, compact ? REL_COMPACT.open : REL_OPEN).map((g) => relSplit(g, compact ? REL_COMPACT.items : Infinity));
  const open = head.map((p) => p[0]); const rest = head.map((p) => p[1]).filter(Boolean).concat(groups.slice(head.length));
  return `<section class="rel${compact ? ' rel-c' : ''}" aria-label="Related"><h3 class="rel-h">Related</h3>${open.map(relGroupHTML).join('')}${rest.length ? `<details class="rel-rest"><summary class="small">More related</summary>${rest.map(relGroupHTML).join('')}</details>` : ''}</section>`;
}
/* the phone layout is chosen when the strip is drawn (a page is drawn again when it is opened) */
const relCompactNow = () => { try { return typeof matchMedia === 'function' && !!matchMedia('(max-width:' + REL_COMPACT.width + 'px)').matches; } catch (e) { return false; } };
/* what each kind reads, so a page that needs little is not made to wait for much: ix the Atlas index, world the world's events, sites, texts the Atlas's catalogue of texts, index the list of readable texts, figs the list of books with pictures */
const REL_NEEDS = { text: ['world', 'texts', 'figs'], passage: ['world', 'texts', 'figs'], tradition: ['ix', 'world', 'sites', 'texts', 'figs', 'index'], event: ['ix', 'world', 'index'], conflict: ['ix', 'world', 'index'], movement: ['ix', 'world', 'index'], calendar: ['ix', 'world'], station: ['world', 'index'], picture: ['figs', 'index'], story: ['index'], motif: ['index'], site: ['ix', 'sites', 'texts', 'index'], note: ['index'] };
/* what is not loaded yet, as [name, function that loads it]; a file that fails is not asked for again */
const REL_TRIED = {}; const REL_WAIT = {}; let REL_SEQ = 0;      /* REL_WAIT: a file that was asked for and is not here yet; a page that calls the strip many times in one pass (the 13 cards of High-control groups) asks once and every strip waits for that one answer, so none is computed from half the data */
function relMissing(kind, o) {
  let want = Object.prototype.hasOwnProperty.call(REL_NEEDS, kind) ? REL_NEEDS[kind] : null; if (want && kind === 'event' && o && o.trad) want = want.concat(['texts']);      /* the History line's own religion events read the texts the records tie to their religion (L-05) */
  const p = []; const A = typeof ATLD !== 'undefined' && ATLD && typeof ATLD.need === 'function' ? ATLD : null; const T = typeof TXT !== 'undefined' && TXT && typeof TXT.index === 'function' ? TXT : null; const ask = (n) => !REL_TRIED[n] || !!REL_WAIT[n];
  if (A) { if (!A.ix && ask('ix')) p.push(['ix', () => A.open()]); ['world', 'sites', 'texts'].forEach((n) => { if (!A.get(n) && ask(n)) p.push([n, () => A.need(n)]); }); }
  if (T) { if (!(typeof BEATLAB_TEXTS !== 'undefined' && BEATLAB_TEXTS && BEATLAB_TEXTS.meta) && ask('index')) p.push(['index', () => T.index()]); if (typeof BEATLAB_FIGN === 'undefined' && ask('figs') && typeof T.script === 'function') p.push(['figs', () => T.script('figs')]); }
  return want ? p.filter(([n]) => want.includes(n)) : [];
}
const relLoad = (kind, o) => Promise.all(relMissing(kind, o).map(([n, f]) => { if (REL_WAIT[n]) return REL_WAIT[n]; REL_TRIED[n] = true; let pr; try { pr = Promise.resolve(f()).catch(() => null); } catch (e) { pr = Promise.resolve(null); } REL_WAIT[n] = pr; pr.then(() => { delete REL_WAIT[n]; }); return pr; }));
function relatedBox(kind, id, opts) {
  try {
    const o = opts && typeof opts === 'object' ? opts : {};
    if (!o.loaded && typeof document !== 'undefined' && relMissing(kind, o).length) {      /* the data is on its way: leave a hidden mark, and fill it when the files are here */
      const tok = 'r' + (++REL_SEQ);
      relLoad(kind, o).then(() => { try { const el = document.querySelector('[data-rel-wait="' + tok + '"]'); if (!el) return; const html = relatedBox(kind, id, Object.assign({}, o, { loaded: true })); if (html) el.outerHTML = html; else el.remove(); } catch (e) { /* the page has moved on */ } });
      return `<section class="rel" data-rel-wait="${tok}" aria-busy="true" hidden></section>`;
    }
    return relStripHTML(relatedFor(kind, id, o), { compact: o.compact != null ? !!o.compact : relCompactNow() });
  } catch (e) { return ''; }
}
function pgFoot(o) {
  const x = o && typeof o === 'object' ? o : {}; const n = x.next;
  const next = n && typeof n === 'object' ? (n.href && n.label ? `<a href="${relEsc(n.href)}">${relEsc(n.label)} →</a>` : '') : relStr(n);
  return `${x.label ? `<p class="small muted pg-label">${x.label}</p>` : ''}${x.how ? `<details class="pg-how"><summary class="small">How to read this page</summary><div class="small t2">${x.how}</div></details>` : ''}${relStr(x.related)}${next ? `<p class="onward">${next}</p>` : ''}`;
}
if (typeof module !== 'undefined' && module.exports) module.exports = { REL_NEEDS, relEsc, relItemHTML, relGroupHTML, relOneHTML, relSplit, relStripHTML, relCompactNow, relMissing, relLoad, relatedBox, pgFoot };
