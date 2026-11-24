/* ═══════════════════════════ 6d2 · Random: the filters, as a page ═══════════════════════════
   What the person sees of the filters (the arithmetic is in 2z-passage-filter-core.js): the quick choices (presets), six sections that close to one line each and say how many choices are on in them
   (Religions, Periods, Books, Kinds, Shelves, How to draw), and one line that says what is on, with a chip for each choice and the number of books that match.
   Every choice carries the number of books it would give with the other sections kept; a choice that would give none is dimmed and cannot be ticked, so nobody is led to an empty draw. The two long lists
   (the tree of religions, the books by shelf) are made when their section is first opened. The page (6d-passage.js) holds the state and the drawing; these are string builders and one patch function.
   The model they are given, S: { st (the filters), mode, c (the counts), alt (the counts with everything, when the pool is the clean one), facts, by (book id → fact), held, tree, names, collections, leftOut, presetN, nUndated, nTied } */

const PSX_SECTIONS = [['r', 'Religions', 'Religions and traditions'], ['p', 'Periods', 'Periods of history'], ['b', 'Books', 'Specific books'], ['k', 'Type of text', 'Type of text'], ['a', 'Shelves', 'Shelves of the Library'], ['m', 'Method', 'How the seed of a draw is made: chance, a text, a date, dice, today'], ['h', 'How to draw', 'How to draw']];
const psxKey = (s) => String(s == null ? '' : s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const psxCount = (n) => `<span class="psgx-c">${n}</span>`;
const psxPlural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
/* how many choices are on in a section (a period chip, a typed range and "dated only" each count as one) */
const psxNOf = (st, k) => (k === 'r' ? st.r.length + (st.x ? 1 : 0) : k === 'p' ? st.p.length + (st.dated ? 1 : 0) : k === 'b' ? st.b.length : k === 'k' ? st.k.length : k === 'a' ? st.a.length : 0);
const psxPeriodOn = (st, id) => { const p = PSF_PERIODS.find((q) => q[0] === id); return !!p && st.p.some((r) => (r[0] == null ? p[2] == null : r[0] === p[2]) && (r[1] == null ? p[3] == null : r[1] === p[3])); };

/* the choices of a section that the clean pool leaves empty (and Everything would not): what to say, and the way to see them */
function psxDimmedByBase(S, sec) {
  if (S.st.base !== 'sources' || !S.alt) return false; const a = S.alt[sec]; const c = S.c[sec]; if (!a) return false;
  return Object.keys(a).some((k) => a[k] > 0 && !(c[k] > 0)) || (sec === 'r' && (S.journey || []).some((j) => j.alt > 0 && !(j.n > 0) && !j.on));
}
const psxBaseHint = (S, sec) => `<p class="hint psgx-note psgx-basehint" data-basehint="${sec}"${psxDimmedByBase(S, sec) ? '' : ' hidden'}>Dimmed choices have no book in Scriptures and sources (the clean typed editions). <button type="button" class="linkbtn" data-psf="base">Draw from everything</button> to see what they hold.</p>`;
/* one tick box with its count; a choice that gives nothing is dimmed and cannot be ticked (unless it is already on, so it can always be taken off) */
function psxOpt(sec, key, label, n, on, x) {
  const o = x || {}; const zero = !on && !n; const alt = zero && o.alt ? ` Nothing here in Scriptures and sources (${psxPlural(o.alt, 'book')} with scans and study aids).` : zero ? ' Nothing here with the other choices.' : '';
  const tip = (o.title || '') + (zero ? alt : '');
  return `<label class="chk psgx-o${zero ? ' off' : ''}"${tip ? ` title="${esc(tip.trim())}"` : ''}><input type="checkbox" data-opt="${sec}|${esc(key)}"${o.extra || ''}${on ? ' checked' : ''}${zero ? ' disabled' : ''}><span class="psgx-t">${esc(label)}${o.sub ? ` <span class="muted small">${esc(o.sub)}</span>` : ''}</span>${o.noCount ? '' : psxCount(n)}</label>`;
}
/* one chip that is on or off (a belief label, a ready-made period) */
function psxChip(sec, key, label, n, on, x) {
  const o = x || {}; const zero = !on && !n;
  return `<button type="button" class="chip psgx-o${zero ? ' off' : ''}" data-opt="${sec}|${esc(key)}" aria-pressed="${on}"${zero ? ' disabled' : ''}${o.title || zero ? ` title="${esc(zero && o.alt ? `${o.title || label}: nothing here in Scriptures and sources (${psxPlural(o.alt, 'book')} with scans and study aids)` : zero ? `${o.title || label}: nothing here with the other choices` : o.title)}"` : ''}>${esc(label)} ${psxCount(n)}</button>`;
}

/* ── the quick choices ── */
function psxPresetsHTML(S) {
  const which = S.act ? '' : psfPresetOf(S.st);
  const saved = (S.saved || []).map((g) => `<button type="button" class="chip psgx-svc${S.act === g.id ? ' on' : ''}" data-saved="${esc(g.id)}" aria-pressed="${S.act === g.id}" title="${esc(g.name)}${g.parts.length > 1 ? ` (a mix of ${g.parts.length})` : ''}${g.daily ? ' (daily)' : ''}">${esc(g.name)}${g.daily ? ' <span class="psgx-dly">daily</span>' : ''}</button>`).join('');
  return PSF_PRESETS.map(([id, label]) => `<button type="button" class="chip${which === id ? ' on' : ''}" data-preset="${id}" aria-pressed="${which === id}"${S.presetN && S.presetN[id] != null ? ` title="${psxPlural(S.presetN[id], 'book')}"` : ''}>${esc(label)}</button>`).join('') + saved
    + `<button type="button" class="chip psgx-svnew" data-sv="saveopen" title="Keep these choices under a name of your own">+ Save this filter</button>`
    + `<button type="button" class="chip on" data-preset="custom" aria-pressed="${which === 'custom'}" disabled${which === 'custom' ? '' : ' hidden'} title="What you have chosen below">Custom</button>`;
}
/* ── a saved filter in use: its name, rename and delete, today's passage, and the editor of its parts (closed to begin with; one part is the normal case) ── */
function psxSavedBarHTML(S) {
  const sv = S.sv; const msg = S.svMsg ? `<p class="hint psgx-svmsg" role="status">${esc(S.svMsg)}</p>` : ''; if (!sv) return msg;
  const plan = S.plan || []; const many = sv.parts.length > 1; const bad = plan.filter((x) => !x.n).length;
  const wsel = (x) => `<select class="select psgx-pw" data-svw="${x.i}" aria-label="How often part ${x.i + 1} comes up">${PSV_WEIGHTS.map(([w, word]) => `<option value="${w}"${x.w === w ? ' selected' : ''}>${esc(word)}</option>`).join('')}</select>`;
  const rows = plan.map((x) => `<li class="psgx-part${x.n ? '' : ' bad'}"><span class="psgx-pl">${esc(x.label)}${S.shown === x.i ? ' <span class="muted small">(in the sections)</span>' : ''}</span>${many ? `${wsel(x)}<span class="psgx-pc">${x.pct}%</span>` : ''}<span class="psgx-pm">${x.n ? psxPlural(x.n, 'book') : '<b>Matches no book.</b> Change it, or take it off.'}</span><button type="button" class="btn sm ghost" data-sv="partedit" data-i="${x.i}">Show in the sections</button>${many ? `<button type="button" class="btn sm ghost" data-sv="partrm" data-i="${x.i}">Take off</button>` : ''}</li>`).join('');
  const editing = S.dirty ? `<div class="psgx-editing" role="status">You have changed the choices, so draws use them now and not “${esc(sv.name)}”. <button type="button" class="btn sm primary" data-sv="partupdate">Keep them as part ${S.shown + 1}</button> <button type="button" class="btn sm" data-sv="addpart"${sv.parts.length >= PSV_MAX.parts ? ' disabled' : ''}>Add them as a part</button> <button type="button" class="btn sm ghost" data-sv="back">Back to the saved filter</button> <button type="button" class="btn sm ghost" data-sv="stop">Stop using it</button></div>` : '';
  return `<div class="psgx-svline-bar"><span class="psgx-svname">Saved filter <b>“${esc(sv.name)}”</b>${many ? ` <span class="muted small">a mix of ${sv.parts.length}</span>` : ''}${sv.daily ? ' <span class="psgx-dly">daily</span>' : ''}</span>${sv.daily ? '<button type="button" class="btn sm ghost" data-sv="today">Show today’s</button>' : ''}<button type="button" class="btn sm ghost" data-sv="rename">Rename</button><button type="button" class="btn sm ghost" data-sv="delete">Delete</button></div>${editing}
    <details class="psgx-sved" id="psSvEd"><summary>Parts and daily${bad ? ` <span class="psgx-badn">${bad} matches no book</span>` : ''}</summary><div class="psgx-svbody">
      <label class="chk psgx-dated"><input type="checkbox" data-svdaily="1"${sv.daily ? ' checked' : ''}><span>Daily <span class="muted small">(opening it shows today’s passage, the same all day and a new one tomorrow; Another still draws another; nothing is sent)</span></span></label>
      <ol class="psgx-parts">${rows}</ol><div class="row tight"><button type="button" class="btn sm" data-sv="addpart"${sv.parts.length >= PSV_MAX.parts ? ' disabled' : ''}>Add a part from the current choices</button></div>
      <p class="hint psgx-note">Each draw picks a part by how often it comes up (a little, some, mostly: 1, 3 and 9 parts in the mix), then a passage from that part’s books, and the card says which. A part that matches no book is not skipped: it is flagged here and said when it is drawn. To change a part, press Show in the sections, change them, and keep them as that part; to add one, set the sections as you want it and press Add a part.</p></div></details>${msg}`;
}
function psxSaveFormHTML(name, daily, msg) {
  return `<div class="psgx-svform" role="group" aria-label="Save this filter"><label class="psgx-find"><span class="small t2">Name</span><input class="input" id="psSvName" type="text" maxlength="60" value="${esc(name)}" placeholder="for example, Morning verses" autocomplete="off" spellcheck="false" aria-label="A name for this filter"></label><label class="chk"><input type="checkbox" id="psSvDaily"${daily ? ' checked' : ''}><span>Daily</span></label><button type="button" class="btn sm primary" data-sv="savego">Save</button><button type="button" class="btn sm ghost" data-sv="cancel">Cancel</button><span class="hint" id="psSvFMsg" role="status">${esc(msg || '')}</span></div>`;
}
function psxRenameFormHTML(name, msg) {
  return `<div class="psgx-svform" role="group" aria-label="Rename this filter"><label class="psgx-find"><span class="small t2">New name</span><input class="input" id="psSvName" type="text" maxlength="60" value="${esc(name)}" autocomplete="off" spellcheck="false" aria-label="A new name for this filter"></label><button type="button" class="btn sm primary" data-sv="renamego">Rename</button><button type="button" class="btn sm ghost" data-sv="cancel">Cancel</button><span class="hint" id="psSvFMsg" role="status">${esc(msg || '')}</span></div>`;
}

/* ── the line that says what is on: the pool, a chip for every choice, how many books match ── */
function psxPicks(S) {
  const st = S.st; const n = S.names; const out = [];
  if (S.only) out.push(['only|1', 'This book only: ' + n.book(S.only)]);      // not one of the filters: every draw comes from this one book until the chip is taken off
  st.r.forEach((v) => out.push(['r|' + v, n.rel(v)])); st.p.forEach((v, i) => out.push(['p|' + i, psfRangeLabel(v[0], v[1])])); if (st.dated) out.push(['dated|1', 'dated texts only']);
  st.b.forEach((v) => out.push(['b|' + v, n.book(v)])); st.k.forEach((v) => out.push(['k|' + v, (PSF_KINDS.find((q) => q[0] === v) || [0, v])[1]])); st.a.forEach((v) => out.push(['a|' + v, n.shelf(v)]));
  if (st.x) out.push(['x|' + st.x, n.legacy(st.x)]);
  if (st.lo && !(S.defaultLo && st.lo.join() === [...S.defaultLo].sort((u, v) => u - v).join())) out.push(['lo|1', st.lo.length ? `leaves out ${st.lo.length === 1 ? n.shelf(st.lo[0]) : psxPlural(st.lo.length, 'area')}` : 'leaves nothing out']);
  return out;
}
function psxSummaryHTML(S) {
  if (S.mixing) {      /* a mix: its parts, how often each comes up, and a part that holds nothing is said */
    const chips = (S.plan || []).map((x) => `<span class="chip psgx-partchip${x.n ? '' : ' bad'}" title="${esc(x.label)}">${esc(x.label)} <span class="muted">· ${esc(x.word)} · ${x.pct}%${x.n ? '' : ' · matches no book'}</span></span>`).join(''); const tot = S.mixTotal || 0;
    return `<span class="chip psgx-base on" title="A saved filter with several parts">Mix “${esc(S.sv.name)}”</span>${chips}<span class="psgx-match"><b>${tot}</b> ${tot === 1 ? 'book matches' : 'books match'} in all</span><button type="button" class="linkbtn" data-psf="clear">Clear all</button>`;
  }
  const picks = psxPicks(S); const shown = picks.slice(0, 10); const more = picks.length - shown.length; const total = S.c.total; const sources = S.st.base === 'sources';
  const chips = shown.map(([k, label]) => `<button type="button" class="chip psgx-pick" data-rm="${esc(k)}" title="Take this off" aria-label="Take off ${esc(label)}">${esc(label)} <span aria-hidden="true">×</span></button>`).join('') + (more > 0 ? `<span class="small muted">and ${more} more</span>` : '');
  return `<button type="button" class="chip tog psgx-base${sources ? ' on' : ''}" data-psf="base" aria-pressed="${sources}" title="${esc(S.baseTip || '')}">${sources ? 'Scriptures and sources only' : 'Everything'}</button>${chips}<span class="psgx-match"><b>${total}</b> ${total === 1 ? 'book matches' : 'books match'}</span>${picks.length ? '<button type="button" class="linkbtn" data-psf="clear">Clear all</button>' : ''}`;
}

/* ── the sections ── */
function psxSecHTML(S, k, body) {
  const s = PSX_SECTIONS.find((q) => q[0] === k); const n = psxNOf(S.st, k);
  return `<details class="psgx-sec${n ? ' on' : ''}" data-sec="${k}" id="psSec${k.toUpperCase()}"><summary title="${esc(s[2])}"><span>${esc(s[1])}</span><span class="psgx-n" data-n="${k}">${n ? ` (${n})` : ''}</span></summary><div class="psgx-body" id="psBody${k.toUpperCase()}">${body}</div></details>`;
}
/* Religions: four quick choices by belief, a search by name, and the tree of the Atlas's groups and families (made when the section is opened) */
function psxBeliefRow(S) {
  return `<div class="psgx-quick" role="group" aria-label="By belief">${PSF_BELIEFS.map((b) => { const sel = 'b:' + b; return psxChip('r', sel, S.names.rel(sel), S.c.r[sel] || 0, S.st.r.includes(sel), { alt: S.alt ? S.alt.r[sel] || 0 : 0 }); }).join('')}</div>`;
}
/* the Journey's own nineteen traditions, one at a time (the "One tradition" the first release's Draw from offered): each is the books on its stations, with the number the other choices leave */
const psxJourneyTip = (j) => { const zero = !j.on && !j.n; return zero && j.alt ? `${j.title || j.name}: nothing here in Scriptures and sources (${psxPlural(j.alt, 'book')} with scans and study aids)` : zero ? `${j.title || j.name}: nothing here with the other choices` : j.title || ''; };
function psxJourneyRow(S) {
  const J = S.journey || []; if (!J.length) return '';
  return `<div class="psgx-quick psgx-journey" role="group" aria-label="From the Journey"><span class="small t2 psgx-jl">From the Journey</span>${J.map((j) => { const zero = !j.on && !j.n; const tip = psxJourneyTip(j); return `<button type="button" class="chip psgx-o${zero ? ' off' : ''}" data-x="${esc(j.id)}" aria-pressed="${j.on}"${zero ? ' disabled' : ''}${tip ? ` title="${esc(tip)}"` : ''}>${esc(j.name)} ${psxCount(j.n)}</button>`; }).join('')}</div>`;
}
function psxReligionsHTML(S) {
  return `${psxBeliefRow(S)}${psxJourneyRow(S)}${psxBaseHint(S, 'r')}<p class="hint psgx-note">A belief is a way to find a tradition, not a verdict: many belong under two ideas, and a book can carry both. Which religion a book belongs to is as the map data ties it (a text of its own, a book about the tradition, or an old source it draws on), or by the Library shelf it stands on; ${psxPlural(S.nTied, 'book')} ${S.nTied === 1 ? 'is' : 'are'} tied to none (study aids and collections of folk tales, mostly) and left out when a religion is chosen. “From the Journey” is the nineteen traditions the Journey walks through, one at a time, each the books on its stations.</p>
    <label class="psgx-find"><span class="small t2">Find a religion</span><input class="input" id="psRq" type="search" placeholder="Type a name" aria-label="Find a religion: type a name" autocomplete="off" spellcheck="false"></label>
    <div class="psgx-res" id="psRres" hidden></div><div class="psgx-tree" id="psTree" data-made="0"><p class="small muted">Opening the tree…</p></div>`;
}
const psxExpander = (n, hasKids) => (hasKids ? `<button type="button" class="psgx-ex" data-ex="${esc(n.sel)}" aria-expanded="false" aria-label="Show what is under ${esc(n.label)}"></button>` : '<span class="psgx-exsp"></span>');
function psxNodeHTML(n, S, hasKids) {
  return `<div class="psgx-nd" data-nd="${esc(n.sel)}"><div class="psgx-row">${psxExpander(n, hasKids)}${psxOpt('r', n.sel, n.label, S.c.r[n.sel] || 0, S.st.r.includes(n.sel), { alt: S.alt ? S.alt.r[n.sel] || 0 : 0 })}</div>${hasKids ? '<div class="psgx-kids" hidden></div>' : ''}</div>`;
}
/* the rows under a node: a group → its families (or, with one family, its religions); a family → its religions; a religion → its branches */
function psxKidsHTML(n, S) {
  if (n.families) return n.families.length === 1 ? n.families[0].roots.map((r) => psxNodeHTML(r, S, r.kids.length > 0)).join('') : n.families.map((f) => psxNodeHTML(f, S, f.roots.length > 0)).join('');
  if (n.roots) return n.roots.map((r) => psxNodeHTML(r, S, r.kids.length > 0)).join('');
  return n.kids.map((r) => psxNodeHTML(r, S, r.kids.length > 0)).join('');
}
const psxTreeHTML = (S) => S.tree.map((g) => psxNodeHTML(g, S, true)).join('');
/* the flat list the search finds in: every religion, family and group with the way down to it */
function psxFlat(tree) {
  const out = []; const walk = (n, path) => { out.push({ n, path, key: psxKey(n.label) }); (n.families || n.roots || n.kids || []).forEach((k) => walk(k, path.concat(n.label))); };
  tree.forEach((g) => walk(g, [])); return out;
}
function psxFindHTML(S, q) {
  const k = psxKey(q).trim(); if (!k) return '';
  const hit = S.flat.filter((x) => x.key.includes(k)).sort((a, b) => (b.key.startsWith(k) ? 1 : 0) - (a.key.startsWith(k) ? 1 : 0) || b.n.held - a.n.held).slice(0, 40);
  if (!hit.length) return '<p class="small muted">No religion of that name has a book in the Library. Try fewer letters.</p>';
  return hit.map((x) => psxOpt('r', x.n.sel, x.n.label, S.c.r[x.n.sel] || 0, S.st.r.includes(x.n.sel), { sub: x.path.length ? 'in ' + x.path[x.path.length - 1] : '', alt: S.alt ? S.alt.r[x.n.sel] || 0 : 0 })).join('');
}
/* Periods: six ready-made ranges, a range of your own, and "dated texts only" */
function psxYearChips(S) {
  const chip = (v) => PSF_PERIODS.some((p) => p[2] === v[0] && p[3] === v[1]);
  return S.st.p.map((v, i) => (chip(v) ? '' : `<button type="button" class="chip psgx-pick" data-rm="p|${i}" aria-label="Take off ${esc(psfRangeLabel(v[0], v[1]))}">${esc(psfRangeLabel(v[0], v[1]))} <span aria-hidden="true">×</span></button>`)).join('');
}
function psxPeriodsHTML(S) {
  const eraSel = (id, v) => `<select class="select psgx-era" id="${id}" aria-label="Era"><option value="CE"${v === 'CE' ? ' selected' : ''}>CE</option><option value="BCE"${v === 'BCE' ? ' selected' : ''}>BCE</option></select>`;
  return `<div class="psgx-quick" role="group" aria-label="Ready-made periods">${PSF_PERIODS.map((p) => psxChip('p', p[0], p[1], S.c.p[p[0]] || 0, psxPeriodOn(S.st, p[0]), { alt: S.alt ? S.alt.p[p[0]] || 0 : 0 })).join('')}</div>
    <div class="psgx-years" role="group" aria-label="A range of your own"><span class="small t2">Your own range</span><label class="psgx-yr"><span class="small">from</span><input class="input" id="psYa" type="number" inputmode="numeric" min="1" max="2026" placeholder="year" aria-label="From year"></label>${eraSel('psEa', 'CE')}<label class="psgx-yr"><span class="small">to</span><input class="input" id="psYb" type="number" inputmode="numeric" min="1" max="2026" placeholder="year" aria-label="To year"></label>${eraSel('psEb', 'CE')}<button type="button" class="btn sm" data-psf="yadd">Add</button></div>
    <div class="row tight psgx-mine" id="psMine">${psxYearChips(S)}</div><span class="hint" id="psYMsg" aria-live="polite"></span>
    <label class="chk psgx-dated"><input type="checkbox" data-psf="dated"${S.st.dated ? ' checked' : ''}><span>Dated texts only <span class="muted small">(${S.nUndated === 0 ? 'every text has a date' : psxPlural(S.nUndated, 'text') + ' ' + (S.nUndated === 1 ? 'has' : 'have') + ' none'})</span></span></label>
    <p class="hint psgx-note">A text is in a period if any of the years its date gives fall in it, so a text dated 200 BCE – 200 CE is in two. The dates are the Library’s own, taken from each text’s record (the text’s own date, not its translation’s). A text with no date stays in every period unless “Dated texts only” is ticked. The ranges are in whole years (BCE counts back), and the two ends are part of the range.</p>`;
}
/* Books: the ones chosen, a search by name, and every book by shelf (made when the section is opened) */
function psxPickedHTML(S) { return S.st.b.map((id) => `<button type="button" class="chip psgx-pick" data-rm="b|${esc(id)}" aria-label="Take off ${esc(S.names.book(id))}">${esc(S.names.book(id))} <span aria-hidden="true">×</span></button>`).join(''); }
function psxBookRow(f, S) {
  const on = S.st.b.includes(f.id); const dim = !on && !S.c.b.has(f.id); const w = (LIB_BY_ID[f.id] || {}).when || '';
  return `<label class="chk psgx-o psgx-bk${dim ? ' off' : ''}"${w ? ` title="${esc(w)}${dim ? ' · not in the other choices' : ''}"` : dim ? ' title="Not in the other choices"' : ''}><input type="checkbox" data-opt="b|${esc(f.id)}"${on ? ' checked' : ''}${dim ? ' disabled' : ''}><span class="psgx-t">${esc(S.names.book(f.id))}</span></label>`;
}
function psxBooksHTML(S, options) {
  return `<div class="row tight psgx-picked" id="psPicked">${psxPickedHTML(S)}</div>
    <div class="row"><label class="psgx-find"><span class="small t2">Find a book</span><input class="input" id="psB" type="text" list="psBL" placeholder="Type a book’s name" aria-label="Find a book: type a name" autocomplete="off" spellcheck="false"><datalist id="psBL">${options}</datalist></label><span class="hint" id="psBMsg" aria-live="polite"></span></div>
    <div class="psgx-res" id="psBres" hidden></div><div class="psgx-blist" id="psBlist" data-made="0"><p class="small muted">Opening the shelves…</p></div>
    <p class="hint psgx-note">Tick any number of books. A book you name is always drawn from, whatever else is on. Books on the shelves you have left out, and scans, are here too.</p>`;
}
function psxBookShelves(S) {
  return S.collections.map(([i, c, n]) => n ? `<div class="psgx-nd" data-nd="c:${i}"><div class="psgx-row"><button type="button" class="psgx-ex" data-exb="${i}" aria-expanded="false" aria-label="Show the books of ${esc(c[0])}"></button><span class="psgx-t psgx-bkh">${esc(c[0])} <span class="muted small">${psxPlural(n, 'book')}</span><span class="psgx-bkn muted small" data-bn="${i}"></span></span></div><div class="psgx-kids" hidden></div></div>` : '').join('');
}
function psxBookRows(S, ci) { return S.facts.filter((f) => f.c === ci).map((f) => psxBookRow(f, S)).join(''); }
function psxBookFind(S, q) {
  const k = psxKey(q).trim(); if (!k) return '';
  const hit = S.facts.filter((f) => psxKey(f.title).includes(k)); const rows = hit.slice(0, 60).map((f) => psxBookRow(f, S)).join('');
  return hit.length ? rows + (hit.length > 60 ? `<p class="small muted">and ${hit.length - 60} more: type a few more letters.</p>` : '') : '<p class="small muted">No book of that name. Try fewer letters.</p>';
}
/* Kinds */
function psxKindsHTML(S) {
  return `<div class="psgx-grid">${PSF_KINDS.map(([id, label, why]) => psxOpt('k', id, label, S.c.k[id] || 0, S.st.k.includes(id), { title: why, alt: S.alt ? S.alt.k[id] || 0 : 0 })).join('')}</div>${psxBaseHint(S, 'k')}
    <p class="hint psgx-note">The types are a way to find things, not a verdict on any text. They come from the text records’ own categories for the books they list, the type of each Bible book, what a shelf says it holds, and, where none of these says, a word in the title (tales, hymns, laws, prayers, sayings, chronicles). ${psxPlural(S.nNoKind, 'book')} ${S.nNoKind === 1 ? 'has' : 'have'} no type and ${S.nNoKind === 1 ? 'is' : 'are'} left out when a type is chosen. A book can have several.</p>`;
}
/* Shelves: the Library's collections (with their old hooks), and the control that leaves some out */
function psxAreaBoxes(S) {
  const lo = S.leftOut; return S.collections.map(([i, c, n]) => { const on = S.st.a.includes(i); const k = S.c.a[i] || 0; const zero = !on && !k; const off = !n;
    return `<label class="chk area psgx-o${zero || off ? ' off' : ''}" title="${esc(c[1])}${off ? ' No readable text yet.' : zero ? ' Nothing here with the other choices.' : ''}"><input type="checkbox" data-area="${i}"${on ? ' checked' : ''}${zero || off ? ' disabled' : ''} data-opt="a|${i}"><span class="psgx-t">${esc(c[0])}${lo.has(i) ? ' <span class="muted small">· left out</span>' : ''}${off ? ' <span class="muted small">no readable text yet</span>' : ''}</span>${off ? '' : psxCount(k)}</label>`; }).join('');
}
function psxShelvesHTML(S, leftOut) {
  return `<fieldset class="areas" id="psAreas"><legend class="small t2">Areas to draw from <span class="muted">(tick any; none ticked means every area except the ones you have left out, below: to begin with, the imagined shelf, which you have to tick on purpose)</span></legend><div class="psgx-grid" id="psBoxes">${psxAreaBoxes(S)}</div>${psxBaseHint(S, 'a')}<div class="row tight" style="margin-top:6px"><button class="btn sm ghost" id="psAll" type="button">Tick all</button><button class="btn sm ghost" id="psNone" type="button">Clear</button></div></fieldset>${leftOut}`;
}

/* ── Method (stage 2 of RANDOM_SUITE.md): how the seed of a draw is made ──
   Another draws by chance and goes on doing so. Here the seed can be made from a text, a date or dice instead; each way makes the same kind of seed, so the card, its receipt and its draw code are the same.
   All five ways are in the markup, one shown at a time; the numbers and the list of daily filters are brought up to date by psxMethodPatch. S.meth: { tab, die, n (the books on the list), k (the dice that name one),
   last (the last dice), today (a day), daily: [{ id, name }] }. What is said of any way is the same for every draw of it, and none of it says what a draw means. */
const PSX_WAYS = [['chance', 'Chance'], ['text', 'A text'], ['date', 'A date'], ['dice', 'Dice'], ['today', 'Today']];
function psxDiceNeed(M) {
  const n = M.n; if (!n) return 'No book matches the choices, so there is nothing to roll for.';
  const faces = M.die === 10 ? '0 to 9' : '1 to ' + M.die;
  if (n === 1) return `The choices leave one book, so only the 2 dice that say how far through it are needed. A d${M.die} shows ${faces}.`;
  return `The list the choices leave has ${n} books. With a d${M.die} (it shows ${faces}), ${M.k} ${M.k === 1 ? 'die names' : 'dice name'} the book and 2 more say how far through it: ${M.k + 2} numbers.`;
}
const psxTodayHTML = (M) => (M.daily && M.daily.length ? M.daily.map((g) => `<button type="button" class="btn" data-meth="today" data-id="${esc(g.id)}">${esc(g.name)}</button>`).join('') : '<span class="hint">No saved filter is marked Daily yet.</span>');
const psxLastHTML = (M) => { const r = M.last; if (!r) return ''; const f = (a) => a.map((d) => psmFace(d, r.die)).join(' '); return `Last numbers: d${r.die} · ${r.book.length ? f(r.book) + ' · ' : ''}${f(r.place)}${r.thrown && r.thrown.length ? ` (${r.thrown.length} thrown out)` : ''}`; };
function psxMethodHTML(S) {
  const M = S.meth || { tab: 'chance', die: 6, n: 0, k: 0, last: null, today: '', daily: [] };
  const tab = (id, label) => `<button type="button" class="chip" data-meth="tab" data-tab="${id}" aria-pressed="${M.tab === id}">${label}</button>`;
  const dieBtn = (d) => `<button type="button" class="chip" data-meth="die" data-die="${d}" aria-pressed="${M.die === d}">d${d}</button>`;
  const panel = (id, body) => `<div class="psgx-mxp" data-mxp="${id}"${M.tab === id ? '' : ' hidden'}>${body}</div>`;
  return `<div class="psgx-mx" id="psMx"><p class="small t2 psgx-mxintro">Another and the Space key draw by chance. Here the seed can be made another way, from a text, a date or dice, and the draw code holds it whichever way it was made. None of these says what a passage means: a passage met this way is a place to start reading, and that is all.</p>
    <div class="psgx-quick" id="psMxTabs" role="group" aria-label="Way to draw">${PSX_WAYS.map(([id, label]) => tab(id, label)).join('')}</div>
    ${panel('chance', `<p class="small t2">Your browser’s secure random source, with the times of your own key presses, taps and pointer moves mixed in. The line beside Another says how many, and a press on it changes that. Nothing about this changes.</p><div class="row tight"><button type="button" class="btn" data-psg="next">Draw by chance</button></div>`)}
    ${panel('text', `<label class="psgx-find"><span class="small t2">A word, a name or a question</span><input class="input" id="psMxText" type="text" maxlength="300" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Type anything" aria-label="A word, a name or a question, used as a seed"></label><div class="row tight"><button type="button" class="btn primary" data-meth="text">Draw from this text</button></div><p class="hint psgx-note">The text is turned into a seed by arithmetic (SHA-256), so the same text with the same choices gives the same passage on any device. What the words mean plays no part: any other string would do the same. The text is not kept, sent or put in the address, and the card never repeats it; the draw code holds only the seed.</p>`)}
    ${panel('date', `<label class="psgx-find"><span class="small t2">Any date</span><input class="input" id="psMxDate" type="date" value="${esc(M.today || '')}" aria-label="A date, used as a seed"></label><div class="row tight"><button type="button" class="btn primary" data-meth="date">Draw from this date</button></div><p class="hint psgx-note">The date is turned into a seed in the same way, so the same date with the same choices gives the same passage on any device. Nothing but its digits plays a part. The date is not kept or put in the address; the draw code holds only the seed.</p>`)}
    ${panel('dice', `<div class="psgx-quick" role="group" aria-label="Which die">${[6, 10, 20].map(dieBtn).join('')}</div><p class="small t2" id="psMxNeed">${esc(psxDiceNeed(M))}</p>
      <div class="row tight"><button type="button" class="btn primary" data-meth="roll">Roll for me</button><span class="hint">The secure generator’s numbers.</span></div>
      <label class="psgx-find"><span class="small t2">Or the numbers of your own dice, in order</span><input class="input" id="psMxNums" type="text" inputmode="numeric" autocomplete="off" spellcheck="false" placeholder="${M.k + 2} numbers" aria-label="The numbers of your own dice, in order"></label><div class="row tight"><button type="button" class="btn" data-meth="typed">Draw from these numbers</button></div>
      <p class="small t2 psgx-mxlast" id="psMxLast" aria-live="polite">${esc(psxLastHTML(M))}</p>
      <ol class="psgx-mxmap small t2"><li>The books the choices leave are put in a fixed list, shelf by shelf, as the Books section shows them. The first dice are read as one number in base 6, 10 or 20 (a d6, d10 or d20), as many as it takes to pass the end of the list.</li><li>That number is divided by the length of the list and the remainder is the book’s place on it. The few numbers at the very top, which would make the first books likelier, are thrown out and the dice are rolled again, so no book is likelier than another.</li><li>Two more dice say how far through the book the place is (two d10 are a percentile, 00 to 99), and the passage is the one found there; a stretch that cannot be used, such as a note or a list, is passed over and the numbers go on to the next try. The same numbers always give the same passage, and the draw code holds them.</li></ol>
      <p class="hint psgx-note">With dice every book on the list has the same chance, so a shelf with many books comes up more often than it does by chance, where every shelf has the same chance first and then every book on it.</p>`)}
    ${panel('today', `<p class="small t2">Today’s passage is made from today’s date and the name of a saved filter: the same all day and a new one tomorrow. It was always there, as “Show today’s” on a saved filter marked Daily; they are listed here too. To make one, press + Save this filter above and tick Daily.</p><div class="row tight" id="psMxToday">${psxTodayHTML(M)}</div>`)}
    <p class="hint psgx-mxmsg" id="psMxMsg" role="status" aria-live="polite"></p></div>`;
}
/* after every change: the pressed way and die, the one panel shown, the count of dice, the last numbers, the daily filters */
function psxMethodPatch(root, S) {
  const M = S.meth; if (!M) return;
  $$('[data-meth="tab"]', root).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.tab === M.tab))); $$('[data-mxp]', root).forEach((p) => { p.hidden = p.dataset.mxp !== M.tab; });
  $$('[data-meth="die"]', root).forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.die === M.die)));
  const set = (id, t) => { const el = $('#' + id, root); if (el && el.textContent !== t) el.textContent = t; };
  set('psMxNeed', psxDiceNeed(M)); set('psMxLast', psxLastHTML(M)); const nums = $('#psMxNums', root); if (nums && nums.placeholder !== undefined) nums.placeholder = `${M.k + 2} numbers`;
  const td = $('#psMxToday', root); if (td) { const h = psxTodayHTML(M); if (td.dataset && td.dataset.h !== h) { td.dataset.h = h; td.innerHTML = h; } }
}

/* the whole block above the card: the quick choices, the six sections, the line that says what is on */
function psxBlockHTML(S, bodies) {
  return `<div class="psgx-filt" id="psFilt"><div class="psgx-presets" id="psPresets" role="group" aria-label="Quick choices">${psxPresetsHTML(S)}</div>
    <div class="psgx-svbar" id="psSvBar">${psxSavedBarHTML(S)}</div><div id="psSvForm"></div>
    <p class="psgx-sum" id="psSum" role="status" aria-live="polite">${psxSummaryHTML(S)}</p>
    <div class="psgx-secs" id="psSecs">${psxSecHTML(S, 'r', bodies.r)}${psxSecHTML(S, 'p', bodies.p)}${psxSecHTML(S, 'b', bodies.b)}${psxSecHTML(S, 'k', bodies.k)}${psxSecHTML(S, 'a', bodies.a)}${psxSecHTML(S, 'm', bodies.m)}${psxSecHTML(S, 'h', bodies.h)}</div></div>`;
}

/* ── after every change: the same page, with the numbers and ticks brought up to date (nothing is drawn again, so an open section stays open) ── */
function psxCountOf(S, sec, key) { return sec === 'r' ? S.c.r[key] || 0 : sec === 'k' ? S.c.k[key] || 0 : sec === 'a' ? S.c.a[key] || 0 : sec === 'p' ? S.c.p[key] || 0 : sec === 'b' ? (S.c.b.has(key) ? 1 : 0) : 0; }
function psxOnOf(S, sec, key) { const st = S.st; return sec === 'r' ? st.r.includes(key) : sec === 'k' ? st.k.includes(key) : sec === 'a' ? st.a.includes(+key) : sec === 'p' ? psxPeriodOn(st, key) : sec === 'b' ? st.b.includes(key) : false; }
function psxPatch(root, S) {
  /* the quick choices and the line that says what is on are made again: the control that has the keyboard is found again, or the first one left, so the keys keep working */
  const act = typeof document !== 'undefined' && document && document.activeElement && document.activeElement.closest ? document.activeElement : null;
  const again = act && act.closest('#psPresets,#psSum') ? (act.dataset.preset ? `[data-preset="${act.dataset.preset}"]` : act.dataset.psf ? `[data-psf="${act.dataset.psf}"]` : '[data-psf="base"]') : null;
  const pr = $('#psPresets', root); if (pr) pr.innerHTML = psxPresetsHTML(S);
  const sm = $('#psSum', root); if (sm) sm.innerHTML = psxSummaryHTML(S);
  const sb = $('#psSvBar', root); if (sb) { const ed = $('#psSvEd', root); const was = !!(ed && ed.open); sb.innerHTML = psxSavedBarHTML(S); const ed2 = $('#psSvEd', root); if (was && ed2) ed2.open = true; }
  if (again) { const el = $(again, root); if (el && !el.disabled && el.focus) el.focus(); }
  PSX_SECTIONS.forEach(([k]) => { const n = psxNOf(S.st, k); const d = $(`[data-n="${k}"]`, root); if (d) d.textContent = n ? ` (${n})` : ''; const sec = $('#psSec' + k.toUpperCase(), root); if (sec && sec.classList) sec.classList.toggle('on', n > 0); });
  $$('[data-opt]', root).forEach((el) => {
    const v = String(el.dataset.opt); const i = v.indexOf('|'); const sec = v.slice(0, i); const key = v.slice(i + 1); const on = psxOnOf(S, sec, key); const n = psxCountOf(S, sec, key); const zero = !on && !n;
    if (el.tagName === 'INPUT') { el.checked = on; el.disabled = zero; const lab = el.closest('label'); if (lab) { lab.classList.toggle('off', zero); const c = lab.querySelector('.psgx-c'); if (c) c.textContent = String(n); } } else { el.setAttribute('aria-pressed', String(on)); el.disabled = zero; el.classList.toggle('off', zero); const c = el.querySelector('.psgx-c'); if (c) c.textContent = String(n); }
  });
  $$('[data-x]', root).forEach((el) => { const j = (S.journey || []).find((q) => q.id === el.dataset.x); if (!j) return; const zero = !j.on && !j.n; el.setAttribute('aria-pressed', String(!!j.on)); el.disabled = zero; el.classList.toggle('off', zero); el.title = psxJourneyTip(j); const c = el.querySelector('.psgx-c'); if (c) c.textContent = String(j.n); });
  $$('[data-basehint]', root).forEach((el) => { el.hidden = !psxDimmedByBase(S, el.dataset.basehint); });
  psxMethodPatch(root, S);
  const dated = $('[data-psf="dated"]', root); if (dated) dated.checked = !!S.st.dated;
  const mine = $('#psMine', root); if (mine) mine.innerHTML = psxYearChips(S);
  const pk = $('#psPicked', root); if (pk) pk.innerHTML = psxPickedHTML(S);
  $$('[data-bn]', root).forEach((el) => { const n = S.st.b.filter((id) => (S.by[id] || {}).c === +el.dataset.bn).length; el.textContent = n ? ` · ${n} chosen` : ''; });
}
if (typeof module !== 'undefined' && module.exports) module.exports = { PSX_SECTIONS, psxKey, psxNOf, psxPeriodOn, psxOpt, psxChip, psxPresetsHTML, psxSavedBarHTML, psxSaveFormHTML, psxRenameFormHTML, psxPicks, psxSummaryHTML, psxSecHTML, psxReligionsHTML, psxJourneyRow, psxTreeHTML, psxKidsHTML, psxFlat, psxFindHTML, psxPeriodsHTML, psxBooksHTML, psxBookShelves, psxBookRows, psxBookFind, psxKindsHTML, psxShelvesHTML, psxAreaBoxes, psxDimmedByBase, psxBlockHTML, psxPatch, PSX_WAYS, psxDiceNeed, psxTodayHTML, psxLastHTML, psxMethodHTML, psxMethodPatch };
