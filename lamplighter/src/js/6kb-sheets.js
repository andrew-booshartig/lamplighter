/* ═══════════════════════════ 6kb · Sheets: a text as pages that scroll, like a PDF ═══════════════════════════
   The reader's fourth view. Each section is laid out in columns as tall as a sheet (CSS multi-column, exactly as the pages that turn are, 6ka-paged.js), and the sheets are stacked one above
   the other in a single vertical scroll, with a paper look, a number on each and a zoom. Only the sheets near the screen are filled with text, and only three sections are drawn at a time (a
   block of the right height stands for the rest), so a text of millions of letters scrolls as lightly as a short one. The arithmetic is in 2z-sheets-core.js.
   A sheet holds its section's whole text laid out in columns and shows one column of it, so the text is the same text that the other views show: highlights, notes, find and selection are
   the reader's own, and a section's last line never splits across sheets. rdSheets(cx) takes what it needs from the reader (cx) and returns the same controls as rdPaged. */
function rdSheets(cx) {
  const { art, secs, n, pages } = cx;
  const view = $('#pgView', art); const clip = $('#pgClip', art); const stack = $('#pgCols', art); const live = $('#pgLive', art);
  const footL = $('#pgFootL', art); const footR = $('#pgFootR', art); const runT = $('#pgRunT', art); const endBox = $('#pgEnd', art);
  art.dataset.sheets = '1'; if (endBox) endBox.hidden = true;
  const PAD = 16;                                            // the space above the first sheet and below the last, in pixels
  const cfg = () => { const s = store.get('reader.sheet', null) || {}; return { zoom: shZoomClean(s.zoom), paper: shPaperClean(s.paper) }; };
  let k = clamp(cx.k, 0, n - 1); let geo = null; let cps = 0; let dead = false; let win = []; let spT = 0; let spB = 0; let loaded = false; let rd = { k: -1, i: -1 };
  const counts = new Array(n).fill(0); const maps = new Array(n).fill(null); const html = new Map(); const secEls = new Map();
  let curSig = null; let readTimer = null; let rememberT = null; let raf = 0; let resizeT = null; let liveT = null; let silent = 0; let want = null; let cpm = rdCpm(store.get('reader.cpm', RD_CPM.def));
  const secLen = (kk) => String(secs[kk][1]).length;
  const fontPx = () => store.get('reader.size', 18) * (geo ? geo.zoom : 1);          // the type grows with the sheet, as a PDF's does: a zoom shows the same words on each sheet, larger
  const est = (kk) => shSheets(secLen(kk), cps, counts[kk]);

  /* ── the text of a section, as drawn on a sheet (no ids: the same section is drawn on several sheets) ── */
  const htmlOf = (kk) => { let h = html.get(kk); if (h == null) { h = cx.secHTML(kk).replace(/\sid="[^"]*"/g, ''); html.set(kk, h); } return h; };

  /* ── measuring a section in the same columns the sheets use: how many sheets, and which paragraph is on which ── */
  let mz = null;
  const g1 = () => ({ colW: geo.colW, gap: geo.colGap, cols: 1, clipW: geo.colW });
  const measure = (kk) => {
    if (!mz) { mz = document.createElement('div'); mz.className = 'pgcols shcols shmeasure'; mz.setAttribute('aria-hidden', 'true'); clip.appendChild(mz); }
    mz.style.cssText = `position:absolute;left:-99999px;top:0;visibility:hidden;pointer-events:none;width:${geo.colW}px;height:${geo.H}px;column-width:${geo.colW}px;column-gap:${geo.colGap}px`;
    mz.innerHTML = `<div class="rdsec on">${htmlOf(kk)}</div>`;
    const geo1 = g1(); const cnt = pgPageCount(mz.scrollWidth, geo1); const base = mz.getBoundingClientRect().left; const map = [];
    $$('.pw', mz).forEach((el) => { const r = el.getClientRects(); if (!r.length) return; map.push({ p: +el.dataset.p, a: clamp(pgPageOfX(r[0].left - base, geo1), 0, cnt - 1), b: clamp(pgPageOfX(r[r.length - 1].left - base, geo1), 0, cnt - 1) }); });
    mz.innerHTML = ''; counts[kk] = cnt; maps[kk] = map; cps = shLearn(cps, secLen(kk), cnt); return cnt;
  };
  const ensure = (kk) => { if (!counts[kk]) measure(kk); return counts[kk]; };
  const mapOf = (kk) => { ensure(kk); return maps[kk] || []; };
  const firstOn = (kk, i) => { const m = mapOf(kk); const x = m.find((e) => e.b >= i); return x ? x.p : (m.length ? m[m.length - 1].p : 0); };
  const parasOnS = (kk, i) => mapOf(kk).filter((e) => e.a <= i && e.b >= i).map((e) => e.p);
  const sheetOfP = (kk, p) => { if (p == null || p < 0) return 0; const m = mapOf(kk); const x = m.find((e) => e.p >= p); return x ? x.a : Math.max(0, counts[kk] - 1); };

  /* ── geometry, and where everything is ── */
  const setGeo = () => {
    const w = Math.floor(view.getBoundingClientRect().width) || window.innerWidth; const c = cfg(); const g = shGeometry(w, { zoom: c.zoom, paper: c.paper });
    const same = geo && geo.sheetW === g.sheetW && geo.sheetH === g.sheetH && geo.colW === g.colW && geo.H === g.H; geo = g; if (!cps) cps = shCharsPerSheet(geo, fontPx());
    art.style.setProperty('--shw', geo.sheetW + 'px'); art.style.setProperty('--shh', geo.sheetH + 'px'); art.style.setProperty('--shz', String(geo.zoom)); art.style.setProperty('--shc', geo.H + 'px'); return !same;
  };
  const topOfLoaded = () => PAD + spT;
  const topOfSec = (kk) => { let t = topOfLoaded(); for (const x of win) { if (x === kk) return t; t += counts[x] * geo.stride; } return t; };
  const topOfSheet = (kk, i) => topOfSec(kk) + i * geo.stride;
  const spacer = (from, to) => { let s = 0; for (let x = from; x < to; x++) s += (counts[x] || est(x)) * geo.stride; return s; };
  const shell = (kk) => {
    const c = counts[kk]; let h = '';
    for (let i = 0; i < c; i++) h += `<div class="sheet" data-k="${kk}" data-i="${i}" style="width:${geo.sheetW}px;height:${geo.sheetH}px"><span class="shnum" aria-hidden="true">${i + 1} / ${c}</span></div>`;
    return `<section class="shsec" data-k="${kk}" aria-label="${esc(expTitle(secs[kk][0], kk)).replace(/"/g, '&quot;')}">${h}</section>`;
  };

  /* ── filling and emptying sheets ── */
  const mirror = (el) => {                       // the current find match is marked on whichever sheet it is drawn
    if (!curSig || curSig.k !== +el.dataset.k) return; const pw = el.querySelector(`.pw[data-p="${curSig.p}"]`); const mk = pw ? pw.querySelectorAll(curSig.sel)[curSig.n] : null; if (mk) mk.classList.add('cur');
  };
  const fill = (el) => {
    if (el.dataset.on === '1') return; el.dataset.on = '1'; const kk = +el.dataset.k; const i = +el.dataset.i;
    el.insertAdjacentHTML('afterbegin', `<div class="shpad" style="left:${geo.padX}px;top:${geo.padY}px;width:${geo.colW}px;height:${geo.H}px"><div class="pgcols shcols" style="width:${geo.colW}px;height:${geo.H}px;column-width:${geo.colW}px;column-gap:${geo.colGap}px;transform:translate3d(${-i * (geo.colW + geo.colGap)}px,0,0)"><div class="rdsec on" data-s="${kk}">${htmlOf(kk)}</div></div></div>`);
    mirror(el);
  };
  const empty = (el) => { if (el.dataset.on !== '1') return; const p = el.querySelector('.shpad'); if (p) p.remove(); el.dataset.on = '0'; };
  const mountVisible = () => {
    if (!geo || !win.length) return; const st = view.scrollTop; const vh = view.clientHeight; let top = topOfLoaded();
    for (const kk of win) {
      const c = counts[kk]; const vis = new Set(shVisible(top, c, geo, st, vh, vh * 0.8)); const el = secEls.get(kk); if (el) { for (let i = 0; i < c; i++) { const sh = el.children[i]; if (!sh) continue; if (vis.has(i)) fill(sh); else empty(sh); } } top += c * geo.stride;
    }
    canon();
  };
  const sheetAt = (kk, i) => { const el = secEls.get(kk); return el ? el.children[i] || null : null; };
  const canon = () => {                          // the reader looks a paragraph up by #rds-k: one drawn copy of the section answers to it, the one being read
    const old = $$('[id^="rds-"]', art).filter((e) => e.classList && e.classList.contains('rdsec')); old.forEach((e) => e.removeAttribute('id'));
    const sh = sheetAt(rd.k, rd.i); const w = sh ? sh.querySelector('.rdsec') : null; if (w) w.id = 'rds-' + rd.k;
  };

  /* ── drawing the window of sections around kk, keeping a sheet where it is on the screen ── */
  const rebuild = (center, anchor) => {
    silent++; win = shWindow(clamp(center, 0, n - 1), n, 1); win.forEach(ensure);
    spT = spacer(0, win[0]); spB = spacer(win[win.length - 1] + 1, n);
    stack.innerHTML = `<div class="shsp" style="height:${spT}px"></div>${win.map(shell).join('')}<div class="shsp" style="height:${spB}px"></div>`;
    secEls.clear(); $$('.shsec', stack).forEach((e) => secEls.set(+e.dataset.k, e));
    if (anchor) { const kk = clamp(anchor.k, win[0], win[win.length - 1]); const i = clamp(anchor.i, 0, counts[kk] - 1); view.scrollTop = Math.max(0, Math.round(topOfSheet(kk, i) - (anchor.off != null ? anchor.off : 8))); }
    rd = readingAt(); mountVisible(); setTimeout(() => { silent = Math.max(0, silent - 1); }, 0);
  };
  const readingAt = () => {
    const st = view.scrollTop; const vh = view.clientHeight; const y = st + vh * 0.33; let top = topOfLoaded();
    if (!win.length) return { k, i: 0 }; if (y < top) return win[0] === 0 ? { k: 0, i: 0 } : { k: win[0], i: 0, out: -1 };
    for (const kk of win) { const h = counts[kk] * geo.stride; if (y < top + h) return { k: kk, i: clamp(Math.floor((y - top) / geo.stride), 0, counts[kk] - 1) }; top += h; }
    const last = win[win.length - 1]; return last === n - 1 ? { k: last, i: Math.max(0, counts[last] - 1) } : { k: last, i: Math.max(0, counts[last] - 1), out: 1 };
  };
  const estCum = () => { const c = []; for (let x = 0; x < n; x++) c.push(counts[x] || est(x)); return shCum(c); };

  /* ── showing where the reader is ── */
  const announce = (txt) => { if (!live) return; clearTimeout(liveT); liveT = setTimeout(() => { live.textContent = txt; }, 600); };
  const moved = (o) => {
    const r = rd; k = r.k; const c = counts[k]; const p = firstOn(k, r.i); const len = secLen(k); const left = rdMinutes(len * Math.max(0, c - r.i - 0.5) / Math.max(1, c), cpm);
    const pgv = pages.pageAt(k, p); const total = pages.total; const lt = rdFmtLeft(left, ' in section');
    if (footL) footL.textContent = `Page ${pgv.toLocaleString()} of ${total.toLocaleString()}`; if (footR) footR.textContent = `Sheet ${r.i + 1} of ${c}${lt ? ' · ' + lt : ''}`;
    if (runT) runT.textContent = expTitle(secs[k][0], k);
    const onP = parasOnS(k, r.i); const bm = onP.some((x) => cx.isBm(k, x)); const rib = $('#pgRib', art); if (rib) rib.hidden = !bm;
    announce(`Page ${pgv} of ${total}` + (bm ? ' · bookmarked' : ''));
    clearTimeout(readTimer); readTimer = null;
    if (r.i === c - 1 && !cx.isRead(k)) { const kAt = k; readTimer = setTimeout(() => { readTimer = null; if (!dead && k === kAt && rd.i === counts[kAt] - 1) cx.markRead(kAt); }, Math.min(RD_DWELL, Math.max(1500, len / 40))); }
    clearTimeout(rememberT); rememberT = setTimeout(() => { if (!dead) cx.remember(rd.k, firstOn(rd.k, rd.i)); }, 700);
    cx.onMove({ k, p, page: r.i, npages: c, minLeft: left, onP, bm, cause: (o && o.cause) || '' });
  };
  const settle = (o) => {
    if (dead || !geo || !loaded || silent) return; const r = readingAt();
    if (r.out) {                                   // in the block that stands for the sections that are not drawn (the scroll bar was dragged): go where it points
      const y = view.scrollTop + view.clientHeight * 0.33; const cum = estCum(); const t = shAt(cum, Math.floor((y - PAD) / geo.stride)); rebuild(t.k, { k: t.k, i: Math.min(t.i, Math.max(0, est(t.k) - 1)), off: view.clientHeight * 0.33 }); moved({ cause: 'scroll' }); return;
    }
    const was = rd; rd = r;
    const want1 = shWindow(r.k, n, 1); if (want1[0] !== win[0] || want1.length !== win.length) {          // the reading has gone on into another section: slide the window
      const off = topOfSheet(r.k, r.i) - view.scrollTop; rebuild(r.k, { k: r.k, i: r.i, off }); }
    else mountVisible();
    if (was.k !== rd.k || was.i !== rd.i || (o && o.force)) moved(o);
  };
  const onScroll = () => { if (raf || dead) return; raf = requestAnimationFrame(() => { raf = 0; settle(); }); };
  view.addEventListener('scroll', onScroll, { passive: true });

  /* ── going places ── */
  const scrollToSheet = (kk, i, o) => {
    kk = clamp(kk, 0, n - 1);
    if (!win.includes(kk) || !loaded) { rebuild(kk, { k: kk, i: clamp(i, 0, Math.max(0, ensure(kk) - 1)), off: 8 }); }
    else { const t = Math.max(0, Math.round(topOfSheet(kk, clamp(i, 0, counts[kk] - 1)) - 8)); if (o && o.smooth && view.scrollTo && !still()) view.scrollTo({ top: t, behavior: 'smooth' }); else { silent++; view.scrollTop = t; setTimeout(() => { silent = Math.max(0, silent - 1); onScroll(); }, 0); } }
    rd = readingAt(); if (o && o.exact) rd = { k: kk, i: clamp(i, 0, counts[kk] - 1) }; mountVisible(); moved(o);
  };
  const still = () => (typeof prefersReducedMotion === 'function' && prefersReducedMotion());
  const goto = (kk, p, o) => { kk = clamp(kk, 0, n - 1); loaded = true; const i = p != null && p >= 0 ? sheetOfP(kk, p) : 0; scrollToSheet(kk, i, Object.assign({ cause: (o && o.cause) || 'goto', exact: true }, o)); };
  const pageNow = () => { const r = readingAt(); return { k: r.k, i: r.i }; };
  const stepSheet = (dir) => {
    const r = pageNow(); let kk = r.k; let i = r.i + dir; const top = view.scrollTop;
    if (i < 0) { if (kk === 0) { if (top > 0) { view.scrollTo ? view.scrollTo({ top: 0, behavior: still() ? 'auto' : 'smooth' }) : (view.scrollTop = 0); } else cx.toast('This is the start.'); return; } kk -= 1; i = Math.max(0, ensure(kk) - 1); }
    else if (i >= counts[kk]) { if (kk >= n - 1) { cx.markRead(kk); cx.toast('This is the end of the text.'); return; } cx.markRead(kk); kk += 1; i = 0; }
    scrollToSheet(kk, i, { smooth: true, cause: 'turn' });
  };
  const turn = (dir) => { cx.hideMenu(); stepSheet(dir > 0 ? 1 : -1); };
  const act = (a) => {
    const r = pageNow();
    if (a === 'next') turn(1); else if (a === 'prev') turn(-1);
    else if (a === 'first') scrollToSheet(r.k, 0, { smooth: true, cause: 'turn' }); else if (a === 'last') scrollToSheet(r.k, ensure(r.k) - 1, { smooth: true, cause: 'turn' });
    else if (a === 'nextSec') { if (r.k < n - 1) scrollToSheet(r.k + 1, 0, { cause: 'turn' }); } else if (a === 'prevSec') { if (r.k > 0) scrollToSheet(r.k - 1, 0, { cause: 'turn' }); }
    else if (a === 'start') scrollToSheet(0, 0, { cause: 'turn' }); else if (a === 'finish') scrollToSheet(n - 1, ensure(n - 1) - 1, { cause: 'turn' });
    else if (a === 'goto') goPrompt();
  };
  /* a number in the box: the reader's own pages (a page is about 1,800 letters whatever the screen), as in the bar at the foot of the reader */
  const goPrompt = () => {
    let box = $('#shGo', art); if (!box) {
      box = document.createElement('form'); box.id = 'shGo'; box.className = 'shgo card'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', 'Go to a page');
      box.innerHTML = `<label class="small" for="shGoN">Go to page</label><input class="input" id="shGoN" type="text" inputmode="numeric" autocomplete="off" style="width:6em"><span class="small t2">of ${pages.total.toLocaleString()}</span><button class="btn primary sm" type="submit">Go</button><button class="btn ghost sm" type="button" data-shgoclose>Close</button>`;
      art.appendChild(box); box.addEventListener('submit', (e) => { e.preventDefault(); const v = shParsePage($('#shGoN', box).value, pages.total); if (v == null) { cx.toast(`Type a page from 1 to ${pages.total.toLocaleString()}.`); return; } box.hidden = true; const t = pages.locate(v); goto(t.k, t.p, { cause: 'goto' }); });
      box.addEventListener('click', (e) => { if (e.target.closest('[data-shgoclose]')) { box.hidden = true; } });
    }
    box.hidden = false; const inp = $('#shGoN', box); inp.value = ''; setTimeout(() => inp.focus(), 0);
  };
  const reveal = (el, o) => {
    if (!el || !el.closest) return; const wrap = el.closest('.rdsec[data-s]'); if (!wrap || !art.contains(el)) return; const kk = +wrap.dataset.s; const gc = el.closest('.shcols'); if (!gc) return;
    const r = el.getClientRects(); if (!r.length) return; const i = clamp(pgPageOfX(r[0].left - gc.getBoundingClientRect().left, g1()), 0, Math.max(0, ensure(kk) - 1));
    if (el.classList && el.classList.contains('cur')) { const pw = el.closest('.pw'); if (pw) { const sel = el.tagName === 'MARK' ? 'mark' : '.hl'; curSig = { k: kk, p: +pw.dataset.p, sel, n: Array.from(pw.querySelectorAll(sel)).indexOf(el) }; } }
    scrollToSheet(kk, i, Object.assign({ cause: 'reveal', exact: true }, o)); const sh = sheetAt(kk, i); if (sh) { $$('mark.cur', art).forEach((m) => m.classList.remove('cur')); mirror(sh); }
  };
  const revealRange = (rg) => { try { const nd = rg.startContainer; const el = nd.nodeType === 3 ? nd.parentElement : nd; const sh = el && el.closest ? el.closest('.sheet') : null; if (!sh) return; const r = sh.getBoundingClientRect(); const v = view.getBoundingClientRect(); if (r.bottom < v.top + 40 || r.top > v.bottom - 40) { const i = +sh.dataset.i; scrollToSheet(+sh.dataset.k, i, { cause: 'listen' }); } const rr = rg.getBoundingClientRect(); if (rr && (rr.top < v.top + 30 || rr.bottom > v.bottom - 90)) { silent++; view.scrollTop += rr.top - v.top - view.clientHeight * 0.3; setTimeout(() => { silent = Math.max(0, silent - 1); onScroll(); }, 50); } } catch (e) { /* stay */ } };

  /* ── layout changes: a new width, type size or zoom re-measures everything and returns to the same words ── */
  const relayoutNow = (keep) => {
    if (dead) return; const r = readingAt(); const kk = r.k; const p = firstOn(kk, r.i); const off = win.length ? topOfSheet(r.k, r.i) - view.scrollTop : 8;
    const changed = setGeo(); if (!changed && !keep) return;
    counts.fill(0); maps.fill(null); html.clear(); cps = shCharsPerSheet(geo, fontPx()); win = []; loaded = true;
    ensure(kk); const i = sheetOfP(kk, p); rebuild(kk, { k: kk, i, off: 8 }); moved({ cause: 'layout' }); void off;
  };
  const relayout = () => relayoutNow(false);
  const refresh = () => {                        // the marks changed: the text is drawn again on the sheets that show it
    html.clear(); const r = rd; $$('.sheet[data-on="1"]', stack).forEach((el) => { empty(el); }); mountVisible(); moved({ cause: 'marks' }); void r;
  };
  const onResize = () => { clearTimeout(resizeT); resizeT = setTimeout(relayout, 160); };
  const onType = () => { clearTimeout(resizeT); resizeT = setTimeout(() => relayoutNow(true), 160); };
  window.addEventListener('resize', onResize); window.addEventListener('rt:change', onType); window.addEventListener('rl:change', onType);

  /* ── the zoom and the paper ── */
  const tools = document.createElement('div'); tools.className = 'shtools'; tools.setAttribute('role', 'group'); tools.setAttribute('aria-label', 'Sheet size');
  tools.innerHTML = `<button type="button" class="shtb" data-shz="-1" aria-label="Zoom out" title="Zoom out">−</button><span class="shzv small" id="shZv" aria-live="polite"></span><button type="button" class="shtb" data-shz="1" aria-label="Zoom in" title="Zoom in">+</button><button type="button" class="shtb sm" data-shfit aria-label="Fit the sheet to the width" title="Fit to width">Fit</button><button type="button" class="shtb sm" data-shpaper aria-label="Change the paper size" title="Paper size"></button><button type="button" class="shtb sm" data-shgo aria-label="Go to a page" title="Go to page (g)">Go to…</button>`;
  art.appendChild(tools);
  /* the tools stand out of the way while the text is read: they fade when the page is scrolled and return at a touch or a move of the pointer */
  let idleT = null;
  const wake = () => { tools.classList.remove('idle'); clearTimeout(idleT); idleT = setTimeout(() => { if (!tools.matches(':hover') && !tools.contains(document.activeElement)) tools.classList.add('idle'); }, 3200); };
  const sleep = () => { clearTimeout(idleT); if (!tools.matches(':hover') && !tools.contains(document.activeElement)) tools.classList.add('idle'); };
  art.addEventListener('pointermove', wake, { passive: true }); art.addEventListener('pointerdown', wake, { passive: true }); tools.addEventListener('focusin', wake); view.addEventListener('scroll', sleep, { passive: true }); wake();
  const paintTools = () => { const c = cfg(); const z = $('#shZv', tools); if (z) z.textContent = Math.round(c.zoom * 100) + '%'; const pb = $('[data-shpaper]', tools); if (pb) pb.textContent = SH_PAPER[c.paper][0]; };
  paintTools();
  tools.addEventListener('click', (e) => {
    const z = e.target.closest('[data-shz]'); const f = e.target.closest('[data-shfit]'); const pp = e.target.closest('[data-shpaper]'); const gg = e.target.closest('[data-shgo]');
    if (z) { const c = cfg(); store.set('reader.sheet', { zoom: shZoomStep(c.zoom, +z.dataset.shz), paper: c.paper }); paintTools(); relayoutNow(true); }
    else if (f) { const c = cfg(); store.set('reader.sheet', { zoom: 1, paper: c.paper }); paintTools(); relayoutNow(true); }
    else if (pp) { const c = cfg(); const ks = Object.keys(SH_PAPER); store.set('reader.sheet', { zoom: c.zoom, paper: ks[(ks.indexOf(c.paper) + 1) % ks.length] }); paintTools(); relayoutNow(true); }
    else if (gg) goPrompt();
  });

  /* ── input: the wheel, the finger and the scroll bar are the browser's own; keys that move by a whole sheet, and a tap on the text for the menu ── */
  const onKey = (e) => {
    if (dead || e.defaultPrevented || palTyping(e.target) || document.querySelector('.modal-back,.overlay,.pal-back') || !cx.menuIdle()) return;
    if (e.target && e.target.closest && (e.target.closest('.rtpanel,.rdsheet,.shgo,.tcard,.shtools') || ((e.key === ' ' || e.key === 'Enter') && e.target.closest('button,a,summary,select,.gt')))) return;
    const a = shKey(e); if (!a) return; e.preventDefault(); act(a);
  };
  let tapT = null;
  const onClick = (e) => {
    if (e.target.closest('a,button,input,textarea,select,.hl,.gt,.selbar,.shgo,.shtools')) return;
    const s = window.getSelection ? window.getSelection() : null; if (s && !s.isCollapsed) return; if (e.detail > 1) { clearTimeout(tapT); return; }
    clearTimeout(tapT); tapT = setTimeout(() => cx.menu(), 230);        // a moment's wait, so that a double click can select a word without the menu appearing
  };
  art.addEventListener('click', onClick); document.addEventListener('keydown', onKey);
  view.tabIndex = -1;
  const destroy = () => { dead = true; clearTimeout(readTimer); clearTimeout(rememberT); clearTimeout(resizeT); clearTimeout(liveT); clearTimeout(tapT); clearTimeout(idleT); if (raf) cancelAnimationFrame(raf); document.removeEventListener('keydown', onKey); window.removeEventListener('resize', onResize); window.removeEventListener('rt:change', onType); window.removeEventListener('rl:change', onType); tools.remove(); };

  /* the first drawing waits for the view to have a size (the reader mounts it a moment after it is built) */
  const start = (tries) => {
    if (dead) return; const r = view.getBoundingClientRect(); if ((!r.width || !r.height) && tries < 40) { setTimeout(() => start(tries + 1), 50); return; }
    setGeo(); cps = shCharsPerSheet(geo, fontPx()); loaded = true; want = want || { k, p: null };
    const kk = want.k; rebuild(kk, { k: kk, i: want.p != null && want.p >= 0 ? sheetOfP(kk, want.p) : 0, off: 8 }); moved({ cause: 'start' });
  };
  setTimeout(() => start(0), 0);
  const gotoEarly = (kk, p, o) => { if (!geo || !loaded) { want = { k: clamp(kk, 0, n - 1), p }; return; } goto(kk, p, o); };

  const where = () => { const r = geo && loaded ? readingAt() : { k, i: 0 }; return { k: r.k, p: geo && loaded ? firstOn(r.k, r.i) : 0, page: r.i, npages: counts[r.k] || 1 }; };
  const parasOn = (pg) => { const w = where(); return geo && loaded ? parasOnS(w.k, pg != null ? pg : w.page) : []; };
  return {
    goto: gotoEarly, turn, act, reveal, revealRange, refresh, relayout, destroy, where, parasOn, touch: () => moved({ cause: 'marks' }), kNow: () => k, cpm: () => cpm, ready: () => !!geo,
    pageOfP: (p) => sheetOfP(k, p), firstP: (pg) => firstOn(k, pg), secEl: () => secEls.get(k) || null,
    topPw: () => { if (!geo || !loaded) return null; const r = readingAt(); const sh = sheetAt(r.k, r.i); const p = firstOn(r.k, r.i); return (sh && sh.querySelector(`.pw[data-p="${p}"]`)) || (sh && sh.querySelector('.pw')) || null; },
  };
}
