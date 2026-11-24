/* ═══════════════════════════ 6ka · The paged view: a text as pages that turn ═══════════════════════════
   One section at a time is laid out in columns as tall as the screen (CSS multi-column), and a page turn slides the columns along. So the text reflows to any screen, type size or
   theme, a section's last line never splits across pages, and highlights, notes and selection work exactly as they do when scrolling. Where the arithmetic lives: 2z-pager-core.js
   (how wide a page is and how many fit, where a tap or swipe or key leads, how long the rest takes). This file is the screen: it measures, slides, listens and keeps the footer.
   Turning: tap the sides, swipe, arrow keys, Page Up and Down, Space, the mouse wheel, or the arrows that appear at the edges on a computer.
   rdPaged(cx) is given what it needs from the reader (cx) and returns the controls the reader uses. */
function rdPaged(cx) {
  const { art, secs, n, pages } = cx;
  const view = $('#pgView', art); const clip = $('#pgClip', art); const cols = $('#pgCols', art); const live = $('#pgLive', art);
  const footL = $('#pgFootL', art); const footR = $('#pgFootR', art); const runT = $('#pgRunT', art); const rib = $('#pgRib', art); const endBox = $('#pgEnd', art);
  let k = clamp(cx.k, 0, n - 1); let page = 0; let npages = 1; let geo = null; let map = []; let shownAt = Date.now(); let lastWheel = 0; let dead = false; let probe = null;
  let cpm = rdCpm(store.get('reader.cpm', RD_CPM.def)); let readTimer = null; let liveT = null; let drag = null; let noClick = 0; let resizeT = null; let tapT = null; let ptr = 'mouse'; let rememberT = null; let ref = null; let refT = null; let loaded = false;
  const pref = () => rlGet();
  const still = () => (typeof prefersReducedMotion === 'function' && prefersReducedMotion());
  const secLen = () => String(secs[k][1]).length;

  /* ── measuring ── */
  const colMax = () => {                         // the widest a line should be, in pixels: the reader's Width setting is in characters
    const ch = parseFloat(RT_WIDTH[rtGet().width][1]) || 74;
    if (!probe) { probe = document.createElement('span'); probe.setAttribute('aria-hidden', 'true'); probe.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap;width:100ch;height:0;overflow:hidden;left:0;top:0;pointer-events:none'; clip.appendChild(probe); }
    const w = probe.getBoundingClientRect().width / 100; return w > 2 ? w * ch : ch * 9;
  };
  const buildMap = () => {                       // for every paragraph, the first and last screen it is on
    map = []; const base = cols.getBoundingClientRect().left;
    $$('.pw', cols).forEach((el) => { const r = el.getClientRects(); if (!r.length) return; map.push({ p: +el.dataset.p, a: pgPageOfX(r[0].left - base, geo), b: pgPageOfX(r[r.length - 1].left - base, geo) }); });
  };
  const firstP = (pg) => { const m = map.find((x) => x.b >= pg); return m ? m.p : (map.length ? map[map.length - 1].p : 0); };      // the paragraph at the top of a screen (it may have begun on the one before)
  const pageOfP = (p) => { if (p == null || p < 0 || !map.length) return 0; const m = map.find((x) => x.p >= p); return m ? m.a : npages - 1; };
  const parasOn = (pg) => map.filter((x) => x.a <= pg && x.b >= pg).map((x) => x.p);
  const layout = () => {
    const vr = view.getBoundingClientRect(); const vw = Math.floor(vr.width); const vh = Math.floor(vr.height); if (!vw || !vh) return false;
    const pf = pref(); const c = pgSpread(pf.spread, window.innerWidth, window.innerHeight);
    geo = pgGeometry(vw, c, colMax(), RL_MARGIN[pf.margin][1], c === 2 ? 56 : 40);
    clip.style.left = geo.left + 'px'; clip.style.width = geo.clipW + 'px';
    cols.style.transition = 'none'; cols.style.width = geo.clipW + 'px'; cols.style.columnWidth = geo.colW + 'px'; cols.style.columnGap = geo.gap + 'px'; cols.style.height = vh + 'px';
    art.style.setProperty('--pgl', geo.left + 'px'); art.style.setProperty('--pgw', geo.clipW + 'px');      // the running head and the footer line up with the text
    npages = pgPageCount(cols.scrollWidth, geo); buildMap(); art.dataset.spread = String(geo.cols); return true;
  };
  const put = (kk) => { k = kk; loaded = true; cols.innerHTML = `<div class="rdsec on" data-s="${kk}" id="rds-${kk}">${cx.secHTML(kk)}</div>`; };

  /* ── showing a screen ── */
  const announce = (txt) => { if (!live) return; clearTimeout(liveT); liveT = setTimeout(() => { live.textContent = txt; }, 500); };
  const moved = (o) => {
    if (!o || o.cause !== 'layout') { ref = null; clearTimeout(refT); refT = setTimeout(() => { if (!dead && !ref && geo) ref = anchor(); }, 380); }      // the place is noted once the page is at rest, so a change of type or width reflows around it
    const pg = page; const p = firstP(pg); const len = secLen(); const left = rdMinutes(len * Math.max(0, npages - pg - 0.5) / npages, cpm);
    if (footL) footL.textContent = `Page ${pg + 1} of ${npages}`; if (footR) footR.textContent = rdFmtLeft(left, ' in section');
    if (runT) runT.textContent = expTitle(secs[k][0], k);
    const onP = parasOn(pg); const bm = onP.some((x) => cx.isBm(k, x)); if (rib) rib.hidden = !bm;
    announce(pgFootText(pg, npages, left) + (bm ? ' · bookmarked' : ''));
    clearTimeout(readTimer); readTimer = null;
    if (pg === npages - 1 && !cx.isRead(k)) { const kAt = k; readTimer = setTimeout(() => { readTimer = null; if (!dead && k === kAt && page === npages - 1) cx.markRead(kAt); }, Math.min(RD_DWELL, Math.max(1500, len / 40))); }      // a section counts as read when you stay on its last page a little while
    clearTimeout(rememberT); rememberT = setTimeout(() => { if (!dead) cx.remember(k, firstP(page)); }, 700);
    cx.onMove({ k, p, page: pg, npages, minLeft: left, onP, bm, cause: (o && o.cause) || '' });
  };
  const slideFor = (o) => (o && o.instant) || still() ? 'none' : pref().anim;
  const flash = () => { clip.classList.remove('pgfade'); void clip.offsetWidth; clip.classList.add('pgfade'); };
  const show = (pg, o) => {
    const mode = slideFor(o); page = clamp(pg, 0, npages - 1);
    cols.style.transition = mode === 'slide' ? 'transform .3s cubic-bezier(.2,.7,.2,1)' : 'none'; cols.style.transform = `translate3d(${-pgShift(page, geo)}px,0,0)`;
    if (mode === 'fade') flash(); shownAt = Date.now(); moved(o);
  };
  const load = (kk, to, o) => {                  // draw another section; `to` is a screen number, 'last', or a paragraph number as {p}
    put(clamp(kk, 0, n - 1)); layout();
    const pg = to === 'last' ? npages - 1 : (to && typeof to === 'object') ? pageOfP(to.p) : (+to || 0);
    const mode = slideFor(o); cols.style.transform = `translate3d(${-pgShift(clamp(pg, 0, npages - 1), geo)}px,0,0)`; page = clamp(pg, 0, npages - 1); if (mode !== 'none') flash();
    shownAt = Date.now(); moved(o);
  };
  const where = () => ({ k, p: firstP(page), page, npages });
  const goto = (kk, p, o) => { kk = clamp(kk, 0, n - 1); if (kk !== k || !loaded || !geo) load(kk, p != null && p >= 0 ? { p } : 0, Object.assign({ instant: true }, o)); else show(p != null && p >= 0 ? pageOfP(p) : 0, Object.assign({ instant: true }, o)); };
  const pageOfEl = (el) => { const r = el.getClientRects(); return r.length ? clamp(pgPageOfX(r[0].left - cols.getBoundingClientRect().left, geo), 0, npages - 1) : page; };
  const reveal = (el, o) => { if (el && el.getClientRects && cols.contains(el)) show(pageOfEl(el), Object.assign({ instant: true }, o)); };
  const revealRange = (rg) => { try { const r = rg.getClientRects()[0]; if (!r) return; const at = clamp(pgPageOfX(r.left - cols.getBoundingClientRect().left, geo), 0, npages - 1); if (at !== page) show(at, { cause: 'listen' }); } catch (e) { /* stay */ } };
  const bounce = (dir) => { cols.style.transition = 'transform .14s ease-out'; cols.style.transform = `translate3d(${-pgShift(page, geo) - dir * 26}px,0,0)`; setTimeout(() => { if (!dead) { cols.style.transition = 'transform .22s ease-out'; cols.style.transform = `translate3d(${-pgShift(page, geo)}px,0,0)`; } }, 140); };
  const theEnd = () => { if (endBox) { endBox.hidden = false; const b = $('button,a', endBox); if (b && b.focus) b.focus(); } cx.markRead(k); };
  const turn = (dir, o) => {
    if (endBox && !endBox.hidden) { if (dir < 0) endBox.hidden = true; return; }
    const t = pgTurn(k, page, npages, n, dir); cx.hideMenu();
    if (!t) { if (dir > 0) theEnd(); else { bounce(-1); cx.toast('This is the start.'); } return; }
    const fwd = dir > 0; const ms = Date.now() - shownAt; const o2 = Object.assign({ cause: 'turn' }, o);
    if (fwd && t.k === k) cpm = rdSpeed(cpm, pgCharsPerPage(secLen(), npages), ms); if (fwd) { if (cpm !== rdCpm(store.get('reader.cpm', RD_CPM.def))) store.set('reader.cpm', Math.round(cpm)); }
    if (t.k === k) show(t.page, o2); else { if (fwd) cx.markRead(k); load(t.k, t.page === 'last' ? 'last' : 0, Object.assign({ fade: true }, o2)); }
  };
  const act = (a) => {
    if (a === 'next') turn(1); else if (a === 'prev') turn(-1); else if (a === 'first') show(0, { cause: 'turn' }); else if (a === 'last') show(npages - 1, { cause: 'turn' });
    else if (a === 'nextSec') { if (k < n - 1) load(k + 1, 0, { fade: true, cause: 'turn' }); } else if (a === 'prevSec') { if (k > 0) load(k - 1, 0, { fade: true, cause: 'turn' }); }
    else if (a === 'start') load(0, 0, { fade: true, cause: 'turn' }); else if (a === 'finish') load(n - 1, 'last', { fade: true, cause: 'turn' });
  };
  /* where the reader is, in a way that survives a new layout: the words at the top left of the screen (the same text nodes stay on the page when only the type or the width changes) */
  const anchor = () => {
    try {
      cols.style.transition = 'none'; cols.style.transform = `translate3d(${-pgShift(page, geo)}px,0,0)`;       // the screen as it will be, not part-way through a slide
      const r = clip.getBoundingClientRect(); const v = view.getBoundingClientRect(); const x = r.left + 8; const y = v.top + 10; let node = null; let off = 0;
      if (document.caretPositionFromPoint) { const c = document.caretPositionFromPoint(x, y); if (c) { node = c.offsetNode; off = c.offset; } }
      else if (document.caretRangeFromPoint) { const c = document.caretRangeFromPoint(x, y); if (c) { node = c.startContainer; off = c.startOffset; } }
      if (node && cols.contains(node)) return { node, off };
    } catch (e) { /* fall back to the paragraph */ }
    return { p: firstP(page) };
  };
  /* measured on one letter, so a line that starts at the anchor is placed where it starts and not where the line before it ends */
  const pageOfAnchor = (a) => {
    if (a.node && a.node.isConnected) { try { const rg = document.createRange(); rg.setStart(a.node, a.off); const len = a.node.nodeType === 3 ? a.node.length : 0; if (a.off < len) rg.setEnd(a.node, a.off + 1); else rg.collapse(true); const rc = rg.getClientRects()[0] || rg.getBoundingClientRect(); if (rc && (rc.width || rc.height || rc.left)) return clamp(pgPageOfX(rc.left - cols.getBoundingClientRect().left, geo), 0, npages - 1); } catch (e) { /* fall back */ } }
    return clamp(pageOfP(a.p != null ? a.p : 0), 0, npages - 1);
  };
  const relayout = () => { if (dead || !geo) return; if (!ref) ref = anchor(); const a = ref; if (layout()) { page = pageOfAnchor(a); cols.style.transform = `translate3d(${-pgShift(page, geo)}px,0,0)`; moved({ cause: 'layout' }); } };
  /* after the marks change the section is drawn again; the layout is the same, so stay on the same screen */
  const refresh = () => { const keep = page; ref = null; put(k); if (layout()) { page = clamp(keep, 0, npages - 1); cols.style.transform = `translate3d(${-pgShift(page, geo)}px,0,0)`; moved({ cause: 'marks' }); } };

  /* ── input ── */
  const onKey = (e) => {
    if (dead || e.defaultPrevented || palTyping(e.target) || document.querySelector('.modal-back,.overlay,.pal-back') || !cx.menuIdle()) return;
    if (e.target && e.target.closest && (e.target.closest('.rtpanel,.rdsheet,.pgend,.tcard') || ((e.key === ' ' || e.key === 'Enter') && e.target.closest('button,a,summary,select,.gt')))) return;
    const a = pgKey(e); if (!a) return; e.preventDefault(); act(a);
  };
  const onWheel = (e) => { if (e.ctrlKey || !pref().wheel || !cx.menuIdle()) return; e.preventDefault(); const d = pgWheel(e.deltaY, e.deltaX, lastWheel, Date.now()); if (d) { lastWheel = Date.now(); turn(d); } };
  const onClick = (e) => {
    if (Date.now() - noClick < 400) return;
    const tb = e.target.closest('[data-pgturn]'); if (tb) { turn(+tb.dataset.pgturn); return; }
    if (e.target.closest('a,button,input,textarea,select,.hl,.gt,.selbar,.pgend')) return;
    const s = window.getSelection ? window.getSelection() : null; if (s && !s.isCollapsed) return;
    const r = art.getBoundingClientRect(); const z = pgZone(e.clientX - r.left, e.clientY - r.top, r.width, r.height, pref().tap);
    const go = () => { tapT = null; if (z === 'next') turn(1); else if (z === 'prev') turn(-1); else cx.menu(); };
    clearTimeout(tapT); if (e.detail > 1) { tapT = null; return; }
    if (ptr === 'mouse') tapT = setTimeout(go, 230); else go();      // a mouse waits a moment so that a double-click can select a word without turning the page
  };
  const onDown = (e) => {
    ptr = e.pointerType || 'mouse'; if (ptr === 'mouse' || e.button) return; if (e.target.closest('a,button,input,textarea,select')) return;
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY, t: Date.now(), on: false, base: -pgShift(page, geo) };
  };
  const onMove = (e) => {
    if (!drag || e.pointerId !== drag.id) return; const dx = e.clientX - drag.x; const dy = e.clientY - drag.y;
    if (!drag.on) { if (Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy) * 1.3) { drag.on = true; cols.style.transition = 'none'; try { view.setPointerCapture(e.pointerId); } catch (x) { /* fine */ } } else return; }
    const edge = (dx < 0 && !pgTurn(k, page, npages, n, 1)) || (dx > 0 && !pgTurn(k, page, npages, n, -1)); const across = (dx < 0 && page === npages - 1) || (dx > 0 && page === 0);
    cols.style.transform = `translate3d(${drag.base + dx * (edge ? 0.18 : across ? 0.3 : 1)}px,0,0)`;
  };
  const onUp = (e, cancelled) => {
    if (!drag || (e.pointerId !== drag.id)) return; const d = drag; drag = null; if (!d.on) return; noClick = Date.now();
    const dx = e.clientX - d.x; const dy = e.clientY - d.y; const v = cancelled ? 'snap' : pgSwipe(dx, dy, Date.now() - d.t, view.clientWidth);
    if (v === 'next') turn(1); else if (v === 'prev') turn(-1); else { cols.style.transition = 'transform .22s ease-out'; cols.style.transform = `translate3d(${d.base}px,0,0)`; }
  };
  const unscroll = () => { if (clip.scrollLeft) clip.scrollLeft = 0; if (view.scrollLeft) view.scrollLeft = 0; if (clip.scrollTop) clip.scrollTop = 0; if (view.scrollTop) view.scrollTop = 0; if (art.scrollTop) art.scrollTop = 0; };      // focus or find must not scroll the clipped columns
  const onResize = () => { clearTimeout(resizeT); resizeT = setTimeout(relayout, 140); };
  art.addEventListener('click', onClick); art.addEventListener('wheel', onWheel, { passive: false });
  view.addEventListener('pointerdown', onDown); view.addEventListener('pointermove', onMove); view.addEventListener('pointerup', (e) => onUp(e, false)); view.addEventListener('pointercancel', (e) => onUp(e, true));
  [clip, view, art].forEach((el) => el.addEventListener('scroll', unscroll));
  document.addEventListener('keydown', onKey); window.addEventListener('resize', onResize); window.addEventListener('rt:change', onResize); window.addEventListener('rl:change', onResize);
  const destroy = () => { dead = true; clearTimeout(readTimer); clearTimeout(liveT); clearTimeout(resizeT); clearTimeout(tapT); clearTimeout(rememberT); clearTimeout(refT); document.removeEventListener('keydown', onKey); window.removeEventListener('resize', onResize); window.removeEventListener('rt:change', onResize); window.removeEventListener('rl:change', onResize); };
  if (endBox) endBox.addEventListener('click', (e) => { if (e.target.closest('[data-pgclose]')) endBox.hidden = true; });
  return { goto, turn, act, reveal, revealRange, refresh, relayout, destroy, where, parasOn, pageOfP, firstP, touch: () => moved({ cause: 'marks' }), kNow: () => k, topPw: () => { const p = firstP(page); return $(`.pw[data-p="${p}"]`, cols) || $('.pw', cols); }, cpm: () => cpm, secEl: () => cols.firstElementChild, ready: () => !!geo };
}
