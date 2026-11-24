/* ═══════════════════════════ 6zza · All traditions: the page ═══════════════════════════
   Traditions → Browse → All traditions (#/atlas/traditions; the address did not change when the list was rebuilt, 18 November 2026, so every older link still opens). It opens on a short overview, the nine
   families of the Atlas with a count and a sentence each (and, for the families that have several, the families), and a few chips to begin from by place, by time and by today; “Show all” opens the whole list
   with its filters. The rules are 2z-tradlist-core.js (the address, the filters, the counts, the order); this file draws them. A choice changes the address without leaving the page (history.pushState, so Back
   and Forward step through the choices; the search box only replaces the address, so typing leaves no trail) and the page is drawn again in place, so the keyboard stays where it was. The last choice is kept
   on this device and shown again when the page is opened with no address (the “← All traditions” link of a tradition’s page returns to it); “Reset filters” clears it (the button sits under the filters, shown only when a choice is on). Nothing is sent anywhere.
   trlViewHTML(ix, F, st, o) is pure, so the tests can draw it; traditionsAllView(body, query) is what the Atlas page (6q-atlas-pages.js) calls for the address #/atlas/traditions. */
const trlN = (n) => `<span class="trl-n">${n}</span>`;
const trlPlural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
/* what stays on the page while the choices change: the search box (it is not drawn again, so what is being typed is never lost) */
function trlTopHTML(q) {
  return `<form class="trl-find" id="trlFind" role="search"><input class="input" type="search" id="trlQ" value="${esc(q)}" placeholder="Find a tradition by name, original name or founder…" aria-label="Find a tradition by name, original name or founder" autocomplete="off"></form><div id="trlView"></div>`;
}
/* the overview: the families with a count and a sentence, then three rows of chips to begin from */
function trlOverviewHTML(ix, F, ctx) {
  const ov = trlOverview(F, ix, TRL_GROUP_LINE); const c = trlCounts(F, TRL_BLANK, null); const link = (patch) => esc(trlHref(trlNext(TRL_BLANK, patch, ctx)));
  const chip = (patch, label, n) => `<a class="chip" href="${link(patch)}" data-trl="to">${esc(label)} ${trlN(n)}</a>`; const row = (label, chips) => `<div class="trl-look"><span class="trl-look-h">${esc(label)}</span><div class="row tight">${chips}</div></div>`;
  return `<p class="t2 small trl-lede">${F.length} religions, branches, schools and movements, from the first burials to today. Start with a family, or show them all and narrow the list down.</p>
    <div class="trl-over-h"><h2 class="trl-h">The families</h2><a class="btn primary" href="${link({ all: true })}" data-trl="to">Show all ${F.length} →</a></div>
    <ul class="trl-groups">${ov.map((g) => `<li><a class="trl-g" href="${link({ g: g.id })}" data-trl="to"><span class="trl-g-t"><b>${esc(g.label)}</b><span class="small t2">${esc(g.line)}</span></span><span class="trl-g-n">${trlN(g.n)}<span aria-hidden="true">→</span></span></a></li>`).join('')}</ul>
    <h2 class="trl-h">Or begin from</h2>
    <div class="trl-looks">${row('Where it began', TRL_REGIONS.map((r) => chip({ r }, r, c.r[r] || 0)).join(''))}${row('When it began', TRL_ERAS.map((e) => chip({ e: e.id }, e.label, c.e[e.id] || 0)).join(''))}${row('Today', TRL_STATUS_CHOICES.map(([v, l]) => chip({ s: v }, l, c.s[v] || 0)).join('') + chip({ x: true }, 'Something to read here', c.x))}</div>
    <p class="hint trl-hint">Prehistoric horizons are archaeological groupings: their beliefs are inferred from burials, art and monuments. “Where” is where the map data puts a tradition’s beginning, and “when” is its earliest recorded year, so both are approximate. Belief is a way to find a tradition, not a verdict: <a href="#/traditions">browse by belief</a>.</p>`;
}
/* one row: its name and when it began, then what it is (the belief it is found under, its family and kind) and where it stands now */
function trlRowHTML(ix, r, i) {
  const t = ix.trad[r.id] || {}; const fam = (ix.fam[r.f] || {}).name || r.f; const also = r.bel.length > 1 ? `, <span class="trl-also">also ${r.bel.slice(1).map((x) => esc(beliefName(x).toLowerCase())).join(', ')}</span>` : '';
  const texts = r.n ? ` · ${trlPlural(r.n, 'text')}${r.read ? ' · some to read here' : ''}` : '';
  return `<li><a class="trl-row" href="#/atlas/tradition/${esc(r.id)}" data-i="${i}"><span class="trl-r1"><b>${esc(r.name)}</b><span class="trl-when">${esc(trlWhen(t, atlFmtYear))}</span></span><span class="trl-r2"><span>${esc(beliefName(r.bel[0]))}${also} · ${esc(fam)} · ${esc(TRL_KIND_SHORT[r.k] || r.k)}</span><span>${esc(TRL_STATUS_NAME[r.sc] || '')}${texts}</span></span></a></li>`;
}
/* the whole list with its filters. o = { ids (the answer of the name search), remembered } */
function trlListHTML(ix, F, st, o, ctx) {
  const list = trlFilter(F, st, o); const c = trlCounts(F, st, o); const shown = list.slice(0, st.n * TRL_PER); const left = list.length - shown.length;
  const opt = (v, label, n, sel) => `<option value="${esc(v)}"${sel ? ' selected' : ''}${n === 0 && !sel ? ' disabled' : ''}>${esc(label)} · ${n}</option>`;
  const sel = (key, label, opts, on) => `<div class="trl-f"><label for="trl-${key}">${esc(label)}</label><select class="select${on ? ' on' : ''}" id="trl-${key}" data-trl="${key}">${opts}</select></div>`;
  const bel = BELIEFS.map((b) => { const n = c.b[b.id] || 0; const on = st.b === b.id; return `<button type="button" class="chip" aria-pressed="${on}" data-trl="b" data-v="${esc(b.id)}" title="${esc(b.term)}"${n === 0 && !on ? ' disabled' : ''}>${esc(b.label)} ${trlN(n)}</button>`; }).join('');
  const cur = st.g ? 'g:' + st.g : st.f ? 'f:' + st.f : '';
  const fams = '<option value="">Any family</option>' + ix.groups.map((g) => (g.families.length === 1 ? opt('g:' + g.id, g.label, c.g[g.id] || 0, cur === 'g:' + g.id || cur === 'f:' + g.families[0])
    : `<optgroup label="${esc(g.label)}">${opt('g:' + g.id, 'All of ' + g.label, c.g[g.id] || 0, cur === 'g:' + g.id)}${g.families.map((f) => opt('f:' + f, (ix.fam[f] || {}).name || f, c.f[f] || 0, cur === 'f:' + f)).join('')}</optgroup>`)).join('');
  const kinds = '<option value="">Any kind</option>' + Object.entries(ix.codes.tradition_kind).map(([k, v]) => { const s = v.replace(/ \(.*/, ''); return opt(k, s.charAt(0).toUpperCase() + s.slice(1), c.k[k] || 0, st.k === k); }).join('');
  const sorts = (st.q ? [['', 'Best match'], ['az', 'A to Z']] : [['', 'A to Z']]).concat(TRL_SORTS.filter((s) => s[0] !== 'az')).map(([v, l]) => `<option value="${v}"${st.o === v ? ' selected' : ''}>${esc(l)}</option>`).join('');
  const x = `<label class="chip tog${c.x === 0 && !st.x ? ' off' : ''}" title="A text of its own, an old source it draws on, or a book about it, that the Library holds in this copy"><input type="checkbox" data-trl="x"${st.x ? ' checked' : ''}${c.x === 0 && !st.x ? ' disabled' : ''}><span>Something to read here ${trlN(c.x)}</span></label>`;
  const rows = shown.map((r, i) => trlRowHTML(ix, r, i)).join(''); const without = !list.length && st.q && trlFilterNoQ(st) ? trlFilter(F, trlNext(st, { b: '', g: '', f: '', r: '', e: '', s: '', k: '', x: false }, ctx), o).length : 0;      /* a search that finds nothing under the choices made says how many it finds without them */
  return `<p class="small trl-back"><a href="#/atlas/traditions" data-trl="overview">← Overview</a></p>
    <div class="trl-bar"><div class="trl-bel" role="group" aria-label="Belief">${bel}</div>
      <div class="trl-sels" role="group" aria-label="Filters">${sel('fam', 'Family', fams, !!cur)}${sel('r', 'Where it began', '<option value="">Anywhere</option>' + TRL_REGIONS.map((r) => opt(r, r, c.r[r] || 0, st.r === r)).join(''), !!st.r)}${sel('e', 'When it began', '<option value="">Any time</option>' + TRL_ERAS.map((e) => opt(e.id, e.label, c.e[e.id] || 0, st.e === e.id)).join(''), !!st.e)}${sel('s', 'Still practised?', '<option value="">Any</option>' + TRL_STATUS_CHOICES.map(([v, l]) => opt(v, l, c.s[v] || 0, st.s === v)).join(''), !!st.s)}${sel('k', 'Kind', kinds, !!st.k)}</div></div>
    ${trlHasFilter(st) ? '<p class="trl-reset" style="margin:10px 0 0"><button type="button" class="btn sm ghost" data-trl="clear">Reset filters</button></p>' : ''}
    <div class="trl-head"><p class="trl-count" role="status">${list.length === F.length ? trlPlural(F.length, 'tradition') : `${list.length} of ${F.length} traditions`}</p>
      <div class="trl-tools">${x}<div class="trl-sort"><label for="trl-o">Order</label><select class="select" id="trl-o" data-trl="o">${sorts}</select></div></div></div>
    ${list.length ? `<ul class="trl-list">${rows}</ul>${left > 0 ? `<p class="trl-more"><button type="button" class="btn" data-trl="more">Show ${Math.min(TRL_PER, left)} more (${left} left)</button></p>` : ''}`
      : `<div class="trl-empty"><p class="t2">${st.q ? `No tradition matches “${esc(st.q)}”${trlFilterNoQ(st) ? ' with these choices' : ''}.` : 'No tradition matches these choices.'} ${without ? `${trlPlural(without, 'tradition')} ${without === 1 ? 'matches' : 'match'} without the other choices: <a href="#/atlas/traditions" data-trl="others">clear them</a>.` : st.q ? 'Try fewer letters.' : '<a href="#/atlas/traditions" data-trl="clear">Clear the filters</a>.'}</p></div>`}
    <p class="hint trl-hint">Belief is a way to find a tradition, not a verdict: many belong under two ideas, and each row says so. Dates are approximate; for Indigenous and oral traditions they mark when a tradition is first recorded, not when a people’s spiritual life began.</p>`;
}
const trlViewHTML = (ix, F, st, o) => { o = o || {}; const ctx = o.ctx || trlCtx(ix, BELIEFS); return st.all ? trlListHTML(ix, F, st, o, ctx) : trlOverviewHTML(ix, F, ctx); };

async function traditionsAllView(body, query) {
  body.innerHTML = '<p class="t2 small">Opening the list…</p>';
  const ix = await ATLD.open();
  let texts = null; try { await ATLD.need('texts'); texts = ATLD.get('texts') || null; } catch (e) { texts = null; }      /* without the catalogue the counts and “something to read here” are simply 0 */
  let idx = null; try { idx = await TXT.index(); } catch (e) { idx = null; }
  const F = trlFacts(ix, { beliefOf, aboutIds, texts, have: (id) => !!(idx && idx[id]), libById: LIB_BY_ID }); const ctx = trlCtx(ix, BELIEFS);
  let st = trlParse(query, ctx); let remembered = false;
  if (!trlTouched(query)) { const m = trlRecall(store, ctx); if (m) { st = m; remembered = true; } }
  body.innerHTML = trlTopHTML(st.q); const view = body.querySelector('#trlView'); const input = body.querySelector('#trlQ');
  const found = () => (st.q ? { ids: atlSearch(ix, st.q, 9999).map((t) => t.id) } : {});
  const draw = (focus, typing) => {
    if (input && !typing) input.value = st.q;      /* what is being typed is left alone; any other change puts the search words back in the box */
    view.innerHTML = trlViewHTML(ix, F, st, Object.assign(found(), { ctx, remembered }));
    if (focus) { const el = view.querySelector(focus); if (el && el.focus) el.focus(); }
  };
  const put = (replace) => { try { if (replace) history.replaceState(null, '', trlHref(st)); else history.pushState(null, '', trlHref(st)); return true; } catch (e) { return false; } };      /* file:// in some browsers: then the address itself changes and the page is drawn again */
  const set = (next, o) => { o = o || {}; st = next; remembered = false; trlRemember(store, st); if (!put(o.replace)) { location.hash = trlHref(st); return; } draw(o.focus, o.typing); };
  trlRemember(store, st); if (remembered) put(true); draw();
  view.addEventListener('click', (e) => {
    const el = e.target && e.target.closest ? e.target.closest('[data-trl]') : null; if (!el || el.disabled) return; const k = el.dataset.trl; const plain = !(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button);
    if (k === 'b') set(trlNext(st, { b: st.b === el.dataset.v ? '' : el.dataset.v }, ctx), { focus: `[data-trl="b"][data-v="${el.dataset.v}"]` });
    else if (k === 'more') { const at = st.n * TRL_PER; set(trlNext(st, { n: st.n + 1 }, ctx), { replace: true, focus: `a[data-i="${at}"]` }); }
    else if (!plain) return;
    else if (k === 'clear') { e.preventDefault(); set(trlCleared(st, ctx), {}); }
    else if (k === 'others') { e.preventDefault(); set(trlNext(st, { b: '', g: '', f: '', r: '', e: '', s: '', k: '', x: false }, ctx), {}); }
    else if (k === 'overview') { e.preventDefault(); set(trlParse({}, ctx), {}); }
    else if (k === 'to') { e.preventDefault(); set(trlParse(Object.fromEntries(new URLSearchParams(String(el.getAttribute('href') || '').split('?')[1] || '')), ctx), {}); }
  });
  view.addEventListener('change', (e) => {
    const el = e.target; const k = el && el.dataset ? el.dataset.trl : ''; if (!k) return; const v = el.type === 'checkbox' ? el.checked : el.value; const keep = `[data-trl="${k}"]`;
    if (k === 'fam') set(trlNext(st, String(v).startsWith('g:') ? { g: String(v).slice(2), f: '' } : String(v).startsWith('f:') ? { f: String(v).slice(2), g: '' } : { g: '', f: '' }, ctx), { focus: keep });
    else if (k === 'x') set(trlNext(st, { x: !!v }, ctx), { focus: keep });
    else if (['r', 'e', 's', 'k', 'o'].includes(k)) set(trlNext(st, { [k]: String(v) }, ctx), { focus: keep });
  });
  const typed = () => { const q = input.value.trim().slice(0, 80); if (q !== st.q) set(trlNext(st, { q }, ctx), { replace: !!st.q, typing: true }); };      /* the first words push one step into the history; going on typing only replaces it */
  input.addEventListener('input', debounce(typed, 220));
  body.querySelector('#trlFind').addEventListener('submit', (e) => { e.preventDefault(); typed(); });
}
if (typeof module !== 'undefined' && module.exports) module.exports = {};
