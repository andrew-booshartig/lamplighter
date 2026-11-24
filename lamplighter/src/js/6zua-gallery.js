/* ═══════════════════════════ 6zua · The pictures from the library’s books (Library → Pictures, #/path/gallery) ═══════════════════════════
   The page opens on pictures: one sentence about what they are, then a strip of ten (one from each of ten books, with its caption and its tradition), then the two tags the data really has (the Library's collection of the book,
   and the date its text gives for itself), then the books that have pictures, shelf by shelf. Choosing a tag narrows the books (and says how many pictures that is); the strip is the page's front door and goes while a tag is chosen.
   A way on to famous art the books do not hold (searches on Wikimedia Commons, opened in a new tab only when clicked) sits under one quiet line. A book's page shows its pictures a page at a time, and a picture opens large with its
   words and a link to the place in the book where it sits. Logic is in 2z-gallery-core.js; the pictures are read one book at a time from texts/fig-<id>.js through the texts loader, so nothing is fetched until a book is needed and
   nothing leaves this computer. */
const galleryHref = (t, e) => { const p = new URLSearchParams(); if (t) p.set('t', t); if (e) p.set('e', e); const s = p.toString(); return '#/path/gallery' + (s ? '?' + s : ''); };
const galleryShelfName = (g) => String((LIB_GROUPS.find((x) => x[0] === g) || [0, ''])[1]).replace(/\s*\(.*$/, '').replace(/:.*$/, '');
/* the two rows of chips: where the book sits in the Library, and when its text is from. Each says how many pictures it covers; the one chosen is marked; “All” and “Any date” clear it. */
function galleryChipsHTML(tags, t, e) {
  const chip = (label, count, href, on) => `<a class="chip${on ? ' on' : ''}" href="${esc(href)}"${on ? ' aria-current="true"' : ''}>${esc(label)}${count != null ? ` <span class="muted">${count.toLocaleString()}</span>` : ''}</a>`;
  return `<div class="gal-facets"><div class="gal-facet"><span class="eyebrow">Tradition or region</span><nav class="gal-chips" aria-label="Tradition or region">${chip('All', null, galleryHref('', e), !t)}${tags.trad.map((x) => chip(x.label, x.pictures, galleryHref(x.id, e), t === x.id)).join('')}</nav></div>
    <div class="gal-facet"><span class="eyebrow">Date of the text</span><nav class="gal-chips" aria-label="Date of the text">${chip('Any date', null, galleryHref(t, ''), !e)}${tags.era.map((x) => chip(x.label, x.pictures, galleryHref(t, x.id), e === x.id)).join('')}</nav>
      <p class="gal-note small muted">When the text is from, or when it was recorded. The pictures were mostly printed between 1850 and 1930, whatever the age of the text.</p></div></div>`;
}
/* a picture large, with its words and the way back into the book at the place where it sits */
function galleryOpen(l, id, f) {
  const c = galleryCaption(f);
  modal({ title: esc(l.title), html: `<figure style="margin:0"><img src="${esc(f[2])}" alt="${esc(figAlt(f))}" style="max-width:100%;height:auto;border-radius:6px"><figcaption class="small t2" dir="auto" style="margin-top:8px">${esc(c.text)}</figcaption></figure><p class="small" style="margin:10px 0 0"><a href="#/path/read/${esc(id)}?s=${f[0]}&p=${Math.max(f[1], 0)}">Open the book at this picture →</a></p>`, actions: [{ label: 'Close', kind: 'primary', value: true }] });
  const backs = document.querySelectorAll ? Array.from(document.querySelectorAll('.modal-back')) : []; const back = backs[backs.length - 1];
  if (back && back.addEventListener) back.addEventListener('click', (e) => { if (e.target.closest && e.target.closest('a[href^="#/path/read/"]') && back.close) back.close(true); });      /* going into the book closes the picture */
}
function pathGalleryView(root, id, query) {
  const body = root.querySelector('#pbody'); if (!body) return; const q = query || {};
  if (id) { galleryBookView(root, body, String(id), q); return; }
  body.innerHTML = '<p class="t2 small">Gathering the pictures…</p>';
  Promise.all([TXT.index(), TXT.script('figs').then(() => globalThis.BEATLAB_FIGN || {}, () => ({}))]).then(([meta, figN]) => {
    if (root.isConnected === false) return;
    const shelves = galleryShelves(figN, LIB_BY_ID, LIB_COLLECTIONS, meta || null); const all = galleryTotals(shelves); const tags = galleryTags(shelves);
    const t = tags.trad.some((x) => x.id === q.t) ? q.t : ''; const e = tags.era.some((x) => x.id === q.e) ? q.e : ''; const picked = !!(t || e); const sel = gallerySelect(shelves, { t, e });
    const look = GALLERY_LOOK.map(([n, w]) => `<a class="chip" href="${esc(galleryCommons(w))}" target="_blank" rel="noopener noreferrer">${esc(n)} ↗</a>`).join('');
    const strip = GAL_STRIP.filter(([bid]) => figN[bid] && LIB_BY_ID[bid] && (!meta || meta[bid]));
    const tiles = strip.map(([bid], i) => { const l = LIB_BY_ID[bid]; return `<button type="button" class="gal-tile" data-i="${i}" disabled><span class="gal-img" aria-hidden="true"></span><span class="gal-cap">${esc(galleryShortTitle(l.title))}</span><span class="gal-sub small muted">${esc(galleryShelfName(l.group))}</span></button>`; }).join('');
    const names = [t ? (tags.trad.find((x) => x.id === t) || {}).label : '', e ? (tags.era.find((x) => x.id === e) || {}).label : ''].filter(Boolean).join(', ');
    const shelfHTML = sel.shelves.map((s) => `<section class="gal-shelf"><h3>${esc(s.name)} <span class="muted small">(${s.books.length} book${s.books.length === 1 ? '' : 's'})</span></h3>
        <div class="grid auto-lg">${s.books.map((b) => `<a class="card flat" href="#/path/gallery/${esc(b.id)}" style="text-decoration:none;color:inherit"><b>${esc(b.title)}</b><div class="small muted" style="margin-top:4px">${b.count.toLocaleString()} picture${b.count === 1 ? '' : 's'} · ${galleryMB(b.bytes)}</div></a>`).join('')}</div></section>`).join('');
    body.innerHTML = `<section class="gal-intro"><p class="lede">${all.pictures ? `<b>${all.pictures.toLocaleString()} pictures from ${all.books} books:</b> ` : ''}the photographs, engravings and plates their original editions printed, mostly from about 1850 to 1930. This is not a survey of the world’s religious art, only what these books happened to print.</p></section>
      ${picked || !tiles ? '' : `<section class="gal-stripbox" aria-label="Ten of the pictures"><div class="gal-strip">${tiles}</div></section>`}
      <details class="gal-look"><summary>For famous works the books do not hold</summary><div class="row tight" style="margin-top:8px;flex-wrap:wrap">${look}</div><p class="hint" style="margin:8px 0 0">Those links open searches on Wikimedia Commons in a new tab, only if you click one. Nothing is sent from here. The essays and the drawings the app makes itself are in <a href="#/path/image">Sacred art and image</a>.</p></details>
      ${all.pictures ? galleryChipsHTML(tags, t, e) : ''}
      ${picked ? `<p class="gal-result small t2" role="status">${sel.totals.pictures ? `<b>${sel.totals.pictures.toLocaleString()} picture${sel.totals.pictures === 1 ? '' : 's'}</b> in ${sel.totals.books} book${sel.totals.books === 1 ? '' : 's'}: ${esc(names)}.` : `No pictures match ${esc(names)}. Try another date or tradition.`} <a href="#/path/gallery">Show everything</a></p>` : ''}
      <h2 class="gal-h">${picked ? 'Books with these pictures' : 'The books'} <span class="muted small">Choose a book to browse its pictures.</span></h2>
      ${shelfHTML || (picked ? '' : '<section class="card" style="margin-top:14px"><p class="t2">No pictures were found next to this page: the texts folder holds them (texts/figs.js and the fig- files).</p></section>')}`;
    /* the strip fills as each book arrives: its picture, its words and its tradition. A book this copy does not hold, or a picture it cannot find, leaves its tile out. */
    const box = body.querySelector('.gal-strip'); if (!box) return; const found = {};
    strip.forEach(([bid, want], i) => {
      const tile = box.querySelector(`[data-i="${i}"]`); if (!tile) return; const l = LIB_BY_ID[bid];
      TXT.figs(bid).then((raw) => {
        const f = galleryStripPick(figClean(raw, null), want); if (!f || root.isConnected === false || !tile.isConnected) { tile.remove(); return; }
        found[i] = f; const c = galleryCaption(f); tile.querySelector('.gal-img').innerHTML = `<img src="${esc(f[2])}" width="${f[3]}" height="${f[4]}" alt="${esc(figAlt(f))}" decoding="async">`;
        tile.querySelector('.gal-cap').textContent = c.text.length > 110 ? c.text.slice(0, 107).replace(/\s+\S*$/, '') + '…' : c.text; tile.querySelector('.gal-sub').textContent = `${galleryShortTitle(l.title)} · ${galleryShelfName(l.group)}`;
        tile.disabled = false; tile.setAttribute('aria-label', `${c.text}. ${l.title}. Open it large.`);
      }, () => { tile.remove(); });
    });
    box.addEventListener('click', (ev) => { const tile = ev.target.closest && ev.target.closest('.gal-tile'); if (!tile || tile.disabled) return; const i = +tile.dataset.i; const f = found[i]; if (f) galleryOpen(LIB_BY_ID[strip[i][0]], strip[i][0], f); });
  });
}
/* SA-04 (STRUCTURE_AUDIT.md): a book's pictures were a dead end, one link back to all the pictures. The page now says what to do with them: Read this book, and which religion the book is tied to (the reader's chips, rdWhoHTML in 6k-reader.js: written here directly, so they do not wait for the strip), and under the plates the strip of what the page does not already show, more pictures from the same tradition (relatedBox, 6zzh-related.js, guarded; FA-06: Traditions and Read are the two links above, so they are skipped) */
const galleryGoHTML = (id, l) => `<div class="row tight gal-go"><a class="btn sm primary" href="#/path/read/${esc(id)}">Read this book</a>${typeof rdWhoHTML === 'function' ? rdWhoHTML(id, l) : ''}</div>`;
function galleryBookView(root, body, id, q) {
  const l = LIB_BY_ID[id]; const back = '<div class="small" style="margin-bottom:10px"><a href="#/path/gallery">← All the pictures</a></div>';
  if (!l) { body.innerHTML = `${back}<div class="card"><p>No such book. <a href="#/path/gallery">Back to the pictures</a></p></div>`; return; }
  body.innerHTML = `${back}<p class="t2 small">Opening the pictures of ${esc(l.title)}…</p>`;
  TXT.figs(id).then((raw) => {
    if (root.isConnected === false) return; const list = figClean(raw, null);
    if (!list.length) { body.innerHTML = `${back}<section class="card"><h2 style="font-size:22px">${esc(l.title)}</h2><p class="t2">This copy does not hold the pictures of this book (its fig-${esc(id)}.js file is not in the texts folder).</p>${galleryGoHTML(id, l)}</section>`; return; }
    const pages = galleryPages(list.length); const pg = galleryPage(q.pg, pages); const from = (pg - 1) * GAL_PAGE; const slice = list.slice(from, from + GAL_PAGE);
    const nav = pages > 1 ? `<div class="row tight" style="margin:10px 0;align-items:center">${pg > 1 ? `<a class="btn sm" href="#/path/gallery/${esc(id)}?pg=${pg - 1}">← Earlier</a>` : ''}<span class="small t2">Pictures ${from + 1}–${from + slice.length} of ${list.length}</span>${pg < pages ? `<a class="btn sm" href="#/path/gallery/${esc(id)}?pg=${pg + 1}">Later →</a>` : ''}</div>` : `<p class="small t2">${list.length} picture${list.length === 1 ? '' : 's'}</p>`;
    body.innerHTML = `${back}<section class="card"><h2 style="font-size:22px;margin:0 0 4px">${esc(l.title)}</h2><p class="small t2" style="margin:0 0 4px;max-width:70ch">The pictures this edition printed. Tap one to see it large; it links to the place in the book where it sits.</p>${galleryGoHTML(id, l)}${nav}
      <div class="gal-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:12px">${slice.map((f, k) => { const c = galleryCaption(f); return `<button type="button" class="gal-cell" data-k="${from + k}" style="all:unset;cursor:pointer;display:block" aria-label="${esc(c.text || 'Picture ' + (from + k + 1))}"><img src="${esc(f[2])}" width="${f[3]}" height="${f[4]}" alt="${esc(figAlt(f))}" loading="lazy" decoding="async" style="width:100%;height:170px;object-fit:cover;border-radius:8px;background:var(--line)"><span class="small muted" style="display:block;margin-top:4px;line-height:1.3">${esc(c.text.length > 90 ? c.text.slice(0, 87).replace(/\s+\S*$/, '') + '…' : c.text)}</span></button>`; }).join('')}</div>${nav}</section>${typeof relatedBox === 'function' ? (() => { const r = relatedBox('picture', id, { skip: ['traditions', 'read'] }); return r ? `<section class="rdrel gal-rel" aria-label="Related">${r}</section>` : ''; })() : ''}`;
    body.querySelector('.gal-grid').addEventListener('click', (e) => {
      const c = e.target.closest('.gal-cell'); if (!c) return; const f = list[+c.dataset.k]; if (!f) return;
      galleryOpen(l, id, f);
    });
  });
}
/* the essays page points here, so a reader who starts there finds the pictures */
const galleryImageOrig = pathImageView;
pathImageView = function (root, query) {
  galleryImageOrig(root, query); const b = root.querySelector('#pbody');
  if (b && b.insertAdjacentHTML) b.insertAdjacentHTML('afterbegin', '<div class="callout" style="margin:0 0 12px"><div>Looking for pictures? <a class="btn sm primary" href="#/path/gallery">Browse the pictures from the library’s books →</a></div></div>');
};
