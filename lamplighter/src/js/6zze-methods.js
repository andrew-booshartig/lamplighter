/* ═══════════════════════════ 6zze · Methods and standards: the page (BACKLOG idea 5a, 18 November 2026) ═══════════════════════════
   Setup → More → Methods and standards (#/methods; a part of it is #/methods/<part>, which opens that part and scrolls to it). It tells a researcher how to read everything the app says: what it is and is not, how
   statements are labelled and how far each part has been read, the rules that are the same for every tradition and group, where the texts come from, translations, privacy, a log of the readings so far, ready
   citations, and release notes. Nine parts; each is a one-line answer that is always open and the detail behind a visible disclosure. The words and the builders are 2z-methods-core.js; what grows with the
   project is 2z-data-methods.js; the numbers (texts, traditions, events, conflicts, the kinds of text, the three examples) are read from the app’s own data when the page opens, and where a data folder is not
   beside the page the page says so and still opens. It is also linked from the footer of every page (50-core.js), from Setup, and found by the / search. Nothing is fetched except the app’s own files, and
   nothing is sent: the only thing the page does with a citation is copy it when a button is clicked. */
Pages.methods = {
  async mount(root, parts, query) {
    const loc = typeof secLocate === 'function' ? secLocate('methods') : null; const want = parts && parts[0] && METH_IDS.includes(String(parts[0])) ? String(parts[0]) : '';
    const data = methData();
    const ctx = {
      counts: Object.assign(methCounts({ lib: typeof LIB !== 'undefined' ? LIB : [] }), { readable: undefined, traditions: undefined, events: undefined, conflicts: undefined, strands: null, printed: undefined }),
      kinds: undefined, world: undefined, mov: typeof MOV_GRADES !== 'undefined' ? { grades: MOV_GRADES } : null, event: null, textId: 'h-museum', textBy: '',
      rel: typeof APP !== 'undefined' ? APP.release : null, relLabel: typeof releaseLabel === 'function' && typeof APP !== 'undefined' ? releaseLabel(APP.release) : '', today: typeof isoDay === 'function' ? isoDay() : '',
      beta: typeof betaOn === 'function' ? betaOn() : false, open: want, log: data.log, stages: data.stages, releases: data.releases, who: data.who,
    };
    const head = loc ? secHeadHTML(loc, { title: 'Methods and standards', blurb: 'How to read what this tool says, where its texts come from, and how to cite it.', compact: false }) : '<div class="page-head fade-in"><div><h1>Methods and standards</h1></div></div>';
    root.innerHTML = `${head}${loc ? secNavHTML(loc, {}) : ''}<div class="meth" id="meth">${methPageHTML(ctx)}</div>`;
    const body = root.querySelector('#meth'); let alive = true; const cleanups = [];
    const on = (t, ev, fn) => { if (!t || !t.addEventListener) return; t.addEventListener(ev, fn); cleanups.push(() => t.removeEventListener(ev, fn)); };
    const calm = () => typeof prefersReducedMotion === 'function' && prefersReducedMotion();
    const SLOTS = ['figs', 'n-traditions', 'n-conflicts', 'strands', 'kinds', 'examples', 'grades', 'printed', 'early', 'cite-text', 'cite-event'];
    const paint = () => { if (!alive || !body || !body.querySelector) return; SLOTS.forEach((nm) => { const el = body.querySelector(`[data-meth-slot="${nm}"]`); if (el) el.innerHTML = methSlotHTML(nm, ctx); }); };
    /* a part: opened, scrolled to and focused; the address follows without a new step in the history */
    const jump = (id, quiet) => {
      const sec = body && body.querySelector(`#meth-${id}`); if (!sec) return; const d = sec.querySelector('details'); if (d) d.open = true;
      if (sec.scrollIntoView) sec.scrollIntoView({ block: 'start', behavior: calm() ? 'auto' : 'smooth' }); const h = sec.querySelector('h2'); if (h && h.focus) h.focus({ preventScroll: true });
      if (!quiet) { try { history.replaceState(null, '', '#/methods/' + id); } catch (e) { /* a file in some browsers keeps its address: the page is still there */ } }
    };
    const copyText = async (text) => { if (typeof gcopy === 'function') return gcopy(text, 'Copied.'); try { await navigator.clipboard.writeText(text); return true; } catch (e) { return false; } };
    on(body, 'click', (e) => {
      const t = e.target && e.target.closest ? e.target : null; if (!t) return;
      const cp = t.closest('[data-meth-copy]'); if (cp) { const pre = body.querySelector('#' + cp.dataset.methCopy); if (pre) copyText(pre.textContent); return; }
      const all = t.closest('[data-meth-all]'); if (all) { const openIt = all.dataset.methAll === 'open'; body.querySelectorAll('details.meth-more').forEach((d) => { d.open = openIt; }); all.dataset.methAll = openIt ? 'close' : 'open'; all.textContent = openIt ? 'Close every part' : 'Open every part'; return; }
      const go = t.closest('[data-meth-go]'); if (go && !(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button)) { e.preventDefault(); jump(go.dataset.methGo); }
    });
    if (want) setTimeout(() => { if (alive) jump(want, true); }, 160);      /* the router puts a page at the top the moment its module returns: this follows it */

    /* the texts: how many, and of which kinds (the texts folder, which may not be there) */
    const loadTexts = async () => {
      let meta = null; try { meta = typeof TXT !== 'undefined' ? await TXT.index() : null; } catch (e) { meta = null; } if (!alive) return;
      if (meta && Object.keys(meta).length && typeof LIB_BY_ID !== 'undefined') {
        ctx.kinds = methKinds(meta, LIB_BY_ID, provKind); ctx.counts.readable = methCounts({ lib: LIB, readable: Object.keys(meta) }).readable;
        if (BEATLAB_TEXTS.meta['h-museum']) ctx.textBy = String(BEATLAB_TEXTS.meta['h-museum'].by || '');
      } else { ctx.kinds = null; ctx.counts.readable = null; }
      paint();
      let n = null; try { await TXT.script('pgs'); const P = globalThis.BEATLAB_PAGEN || {}; if (meta) n = Object.keys(P).filter((id) => meta[id] && LIB_BY_ID[id] && pgmFits(P[id], meta[id])).length; } catch (e) { n = null; } if (!alive) return;
      ctx.counts.printed = n; paint();
    };
    /* the Atlas and the timeline: how many traditions, events and conflicts, the examples, and how the sources are graded (the atlas folder, which may not be there) */
    const loadAtlas = async () => {
      let ix = null; let world = null; let events = null;
      try { ix = await ATLD.open(); } catch (e) { ix = null; }
      try { await ATLD.need('world'); world = ATLD.get('world') || null; } catch (e) { world = null; }
      try { await ATLD.need('events'); events = ATLD.get('events') || null; } catch (e) { events = null; }
      if (!alive) return;
      const merged = world && events && typeof histMerge === 'function' ? histMerge(world, events) : null;
      Object.assign(ctx.counts, methCounts({ lib: [], traditions: ix && ix.core ? ix.core.traditions.length : null, merged, strands: world ? world.strands : [], conflicts: world && typeof cnfEntries === 'function' ? cnfEntries(world).length : null }), { texts: ctx.counts.texts, readable: ctx.counts.readable, printed: ctx.counts.printed });
      ctx.world = world && world.events ? world : null; const ex = ctx.world ? methExamples(ctx.world.events) : []; ctx.event = ex.length ? ex[0].ev : null; paint();
    };
    loadTexts().catch(() => {}); loadAtlas().catch(() => {});      /* a failure here leaves the figures as “not available”: the page is whole without them */
    return () => { alive = false; cleanups.forEach((f) => { try { f(); } catch (e) { /* gone already */ } }); };
  },
};
if (typeof module !== 'undefined' && module.exports) module.exports = {};
