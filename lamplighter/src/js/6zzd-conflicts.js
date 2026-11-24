/* ═══════════════════════════ 6zzd · Conflicts and peacemaking: the page (BACKLOG D8, 18 November 2026) ═══════════════════════════
   Traditions → More → Conflicts and peace (#/conflicts; one entry is #/conflicts/<id>). It opens on one plain sentence that says what the page is and is not, then the entries, oldest first and in bands of
   the era they begin in; a quiet row of choices (kind, and under “Filter”: region, era, tradition, kind of cause, and a word search) narrows them, each option with the count it would give, so no choice leads to an
   empty page. A choice changes the address without leaving the page (history.pushState, so Back steps through the choices); the entry links carry the choices, so “← All” returns to the same list.
   One entry is one layout for every war, quarrel and settlement: what it was, who was on each side and what each said the matter was (in its own words where a source gives them), the causes with how well
   each is documented, the dead as a sourced range or “Not recorded”, how it ended and what followed, the traditions and events it touches, and the sources with their grades and the day each was opened.
   Every statement carries its own label (documented, reported or claimed, disputed) and the numbers of the sources it rests on. The rules are 2z-conflicts-core.js; the data is atlas/world.js
   (tools/atlas_src/json/world_conflicts.json); nothing is sent anywhere. The pure drawing functions take the data, so the tests can draw them. */
const cnfMeta = (world) => (world && world.meta && world.meta.conflicts) || {};
const cnfStatusTag = (m, k) => { const s = (m.statuses && m.statuses[k]) || [k, '']; return `<span class="tag hx-status st-${esc(k)}" title="${esc(s[0] + (s[1] ? ': ' + s[1] : ''))}">${esc(s[0])}</span>`; };
const cnfCauseTag = (world, k) => `<span class="tag" title="${esc(((world && world.meta && world.meta.causes) || {})[k] || '')}">${esc(k)}</span>`;
const cnfKindName = (m, k) => ((m.kinds && m.kinds[k]) || [k])[0];
/* the numbers of the sources a statement rests on: a small button that takes you to the source in the list at the foot of the entry */
const cnfCiteHTML = (en, src) => { const c = cnfCites(en, src); return c.length ? `<span class="cnf-cites" role="group" aria-label="Sources">${c.map(({ n, s }) => `<button type="button" class="cnf-cite" data-cite="${n}" title="${esc(s.title)}">${n}</button>`).join('')}</span>` : ''; };
const cnfNoteHTML = (s) => esc(s).replace('Setup, then Tell the maker what to change', '<a href="#/setup?fb=1">Setup, then Tell the maker what to change</a>');

/* one row of the list */
function cnfRowHTML(en, st, world) {
  const m = cnfMeta(world); const c = en.conflict; const cs = c.casualties; const dead = c.kind === 'peace' ? '' : cs ? `Dead: ${esc(cnfRange(cs, true))} · ${esc(((m.statuses || {})[cs.status] || [cs.status])[0].toLowerCase())}` : 'Dead: not recorded';
  const causes = [...new Set((c.causes || []).map((x) => x.kind))].map((k) => cnfCauseTag(world, k)).join(' ');
  return `<li><a class="cnf-row" href="${esc(cnfHref(st, en.id))}" data-id="${esc(en.id)}"><span class="cnf-r1"><b>${esc(en.label)}</b><span class="cnf-when">${esc(en.date_label)}</span></span><span class="cnf-r2"><span>${esc(cnfKindName(m, c.kind))} · ${esc((c.regions || []).join(', '))}</span><span class="cnf-causes">${causes}</span></span>${dead || cnfLiving(en) ? `<span class="cnf-r3 small">${dead}${cnfLiving(en) ? `${dead ? ' · ' : ''}<span class="tag cnf-live" title="${esc(m.living || '')}">Within living memory</span>` : ''}</span>` : ''}</a></li>`;
}
/* the plain sentence at the top, how far the page has been checked in plain sight (read by the author only, nothing read by a specialist, in plain words: SA-15 left “first reading” to Methods and standards; it used to be
   inside the closed “How to read this page”, AA-18 of the alpha audit), and the quiet “How to read this page” under it */
function cnfTopHTML(world) {
  const m = cnfMeta(world);
  return `<p class="cnf-lede">${esc(m.lede || '')}</p>${m.review === 'unchecked' ? `<p class="small t2 cnf-checked"><b>How far this has been checked:</b> read by the author only; no specialist has checked it yet. ${cnfNoteHTML(m.review_note || '')}</p>` : ''}<details class="cnf-how"><summary class="small">How to read this page</summary><ul class="plain cnf-rules">${(m.rules || []).map((r) => `<li>${esc(r)}</li>`).join('')}</ul><p class="hint">${esc(m.scope_note || '')}</p></details>`;
}
/* the list with its choices. o = { ctx, choices (the traditions offered), bare (the page keeps the sentence and the search box outside the part that is drawn again) } */
function cnfListHTML(world, entries, st, o) {
  const m = cnfMeta(world); const ctx = o.ctx; const list = cnfFilter(entries, st, ctx); const c = cnfCounts(entries, st, ctx); const groups = cnfGroup(list); if (st.o === 'new') groups.reverse();
  const opt = (v, label, n, on) => `<option value="${esc(v)}"${on ? ' selected' : ''}${n === 0 && !on ? ' disabled' : ''}>${esc(label)} · ${n}</option>`;
  const sel = (key, label, opts, on) => `<div class="cnf-f"><label for="cnf-${key}">${esc(label)}</label><select class="select${on ? ' on' : ''}" id="cnf-${key}" data-cnf="${key}">${opts}</select></div>`;
  const kinds = CNF_KINDS.map((k) => { const n = c.k[k] || 0; const on = st.k === k; return `<button type="button" class="chip" aria-pressed="${on}" data-cnf="k" data-v="${k}" title="${esc(((m.kinds || {})[k] || ['', ''])[1])}"${n === 0 && !on ? ' disabled' : ''}>${esc(cnfKindName(m, k))} <span class="cnf-n">${n}</span></button>`; }).join('');
  const regions = '<option value="">Anywhere</option>' + CNF_REGIONS.map((r) => opt(r, r, c.r[r] || 0, st.r === r)).join('');
  const eras = '<option value="">Any time</option>' + CNF_ERAS.map((e) => opt(e.id, e.label, c.e[e.id] || 0, st.e === e.id)).join('');
  const trads = '<option value="">Any tradition</option>' + o.choices.map((t) => opt(t.id, t.name, c.t[t.id] || 0, st.t === t.id)).join('');
  const causes = '<option value="">Any kind of cause</option>' + CNF_CAUSES.map((k) => opt(k, k.charAt(0).toUpperCase() + k.slice(1), c.c[k] || 0, st.c === k)).join('');
  const order = `<option value=""${st.o ? '' : ' selected'}>Oldest first</option><option value="new"${st.o ? ' selected' : ''}>Newest first</option>`;
  const more = !!(st.r || st.e || st.t || st.c || st.q || st.o);
  const rows = groups.map((g) => `<section class="cnf-band" aria-label="${esc(g.label)}"><h2 class="cnf-era">${esc(g.label)}</h2><ul class="cnf-list">${g.items.map((en) => cnfRowHTML(en, st, world)).join('')}</ul></section>`).join('');
  return `${o.bare ? '' : cnfTopHTML(world)}<div class="cnf-bar"><div class="cnf-kinds" role="group" aria-label="Kind of entry">${kinds}</div>
      <details class="cnf-filter"${more ? ' open' : ''}><summary class="small">Filter by place, time, tradition or cause</summary><div class="cnf-sels" role="group" aria-label="Filters">${sel('r', 'Where', regions, !!st.r)}${sel('e', 'When', eras, !!st.e)}${sel('t', 'Tradition', trads, !!st.t)}${sel('c', 'Kind of cause', causes, !!st.c)}${sel('o', 'Order', order, !!st.o)}</div></details></div>
    <p class="cnf-count" role="status">${list.length === entries.length ? `${entries.length} entries` : `${list.length} of ${entries.length} entries`}${cnfHasFilter(st) ? ' · <a href="#/conflicts" data-cnf="clear">Clear the choices</a>' : ''}</p>
    ${list.length ? rows : `<div class="cnf-empty"><p class="t2">Nothing matches these choices${st.q ? ` and “${esc(st.q)}”` : ''}. <a href="#/conflicts" data-cnf="clear">Clear the choices</a>.</p></div>`}
    <p class="hint cnf-foot">${esc(m.grades_note || '')}</p>`;
}

/* one entry, on one layout */
function cnfEntryHTML(world, en, o) {
  const m = cnfMeta(world); const c = en.conflict; const ix = o.ix; const st = o.st; const peace = c.kind === 'peace'; const grades = (world.meta && world.meta.grades) || {}; const cs = c.casualties;
  const where = (en.places || []).map((p) => p.name).join(' · '); const conf = ((world.meta && world.meta.confidence) || {})[en.date_confidence] || ''; const trads = (en.traditions || []).filter((t) => ix && ix.trad && ix.trad[t]);
  const sec = (h, body, note) => `<section class="cnf-sec"><h3>${h}</h3>${note ? `<p class="hint">${esc(note)}</p>` : ''}${body}</section>`;
  const stmt = (status, text, src) => `<p class="cnf-st">${esc(text)} ${cnfStatusTag(m, status)} ${cnfCiteHTML(en, src)}</p>`;
  const parties = `<ul class="plain cnf-parties">${c.parties.map((p) => `<li><b>${esc(p.name)}</b>${p.also ? ` <span class="small muted">${esc(p.also)}</span>` : ''}${stmt(p.said_status, p.said, p.src)}</li>`).join('')}</ul>`;
  const causes = `<ul class="plain cnf-cl">${c.causes.map((x) => `<li>${cnfCauseTag(world, x.kind)} ${cnfStatusTag(m, x.status)} ${cnfCiteHTML(en, x.src)}<div>${esc(x.note)}</div></li>`).join('')}</ul>`;
  const dead = peace ? `<p class="t2">${esc(c.casualty_note)}</p>` : cs ? `<p class="cnf-dead"><b>${esc(cnfRange(cs))}</b> ${esc(cs.unit)} ${cnfStatusTag(m, cs.status)}</p><p class="small t2"><b>What is counted:</b> ${esc(cs.basis)}</p><p class="small t2"><b>Low end:</b> ${cnfCiteHTML(en, cs.low_src)} <b>High end:</b> ${cnfCiteHTML(en, cs.high_src)}</p><p class="small t2">${esc(cs.note)}</p>` : `<p class="t2">${esc(c.casualty_note)}</p>`;
  const how = (m.ended && m.ended[c.outcome.how]) || [c.outcome.how, ''];
  const rel = cnfRelated(en, world).filter((r) => r.ev); const rk = (world.meta && world.meta.relations) || {};
  const tl = cnfTimelineHref(en);
  return `<div class="cnf-entry">
    <p class="small cnf-back"><a href="${esc(cnfHref(st))}" data-cnf="list">← All conflicts and settlements</a></p>
    <div class="cnf-tags"><span class="tag">${esc(cnfKindName(m, c.kind))}</span>${(c.regions || []).map((r) => `<span class="tag">${esc(r)}</span>`).join('')}${cnfLiving(en) ? `<span class="tag cnf-live" title="${esc(m.living || '')}">Within living memory</span>` : ''}</div>
    <h2 class="cnf-h" id="cnfTitle" tabindex="-1">${esc(en.label)}</h2>
    <div class="hx-when"><b>${esc(en.date_label)}</b>${conf ? ` <span class="muted small">${esc(conf)}</span>` : ''}</div>${where ? `<div class="small t2">${esc(where)}</div>` : ''}
    <p class="cnf-sum">${esc(en.summary)}</p>${cnfLiving(en) ? `<p class="hint cnf-livenote">${esc(m.living || '')}</p>` : ''}
    ${sec(peace ? 'Who was party to it, and what each said it sought' : 'Who was on each side, and what each said it was about', parties, 'Each side is called by the name it uses for itself. What it said is given in its own words where a source records them; otherwise the entry says what the sources record.')}
    ${sec(peace ? 'What was at issue' : 'Why it happened, and how well each cause is documented', causes, (world.meta && world.meta.cause_note) || '')}
    ${sec(peace ? 'The dead' : 'The dead, as a sourced range', dead)}
    ${sec(peace ? 'What it provided' : 'How it ended', `<p class="cnf-st"><span class="tag" title="${esc(how[1])}">${esc(how[0])}</span> ${esc(c.outcome.note)} ${cnfStatusTag(m, c.outcome.status)} ${cnfCiteHTML(en, c.outcome.src)}</p>`)}
    ${sec('What followed', stmt(c.after.status, c.after.note, c.after.src))}
    <div class="cnf-sec cnf-go row tight">${trads.map((t) => `<a class="btn sm" href="#/atlas/tradition/${esc(t)}">${esc(ix.trad[t].name)}</a>`).join('')}${tl ? `<a class="btn sm ghost" href="${esc(tl)}">On the timeline</a>` : `<span class="small muted">After 1900, beyond the span of the timeline.</span>`}</div>
    ${rel.length ? sec('Connected', `<ul class="plain cnf-rel">${rel.map((r) => `<li><span class="muted">${esc((rk[r.kind] || [r.kind, r.kind])[r.dir === 'out' ? 0 : 1])}</span> <a href="${r.here ? '#/conflicts/' + encodeURIComponent(r.ev.id) : '#/history?s=' + encodeURIComponent(r.ev.id)}">${esc(r.ev.label)}</a> <span class="small muted">${esc(r.ev.date_label)}${r.here ? '' : ' · on the timeline'}</span>${r.note ? `<div class="small t2">${esc(r.note)}</div>` : ''}</li>`).join('')}</ul>`) : ''}
    ${sec('Sources', `<ol class="plain cnf-src">${en.sources.map((s, i) => `<li id="cnfSrc${i + 1}" tabindex="-1"><span class="cnf-sn">${i + 1}</span> <span class="tag hx-grade" title="${esc((grades[s.grade] || [''])[0] + (grades[s.grade] ? ': ' + grades[s.grade][1] : ''))}">${esc(s.grade)}</span> ${s.url ? ext(s.url, esc(s.title)) : esc(s.title)}${s.note ? ` <span class="small muted">${esc(s.note)}</span>` : ''}${s.partisan ? ` <span class="small cnf-part">Partisan: ${esc(s.partisan)}.</span>` : ''}<div class="small muted">${esc(((typeof histSrcKind !== 'undefined' ? histSrcKind : {})[s.kind]) || s.kind)} · opened ${esc(s.read || '')}</div></li>`).join('')}</ol><p class="hint">${esc(m.grades_note || '')}</p>${m.review === 'unchecked' ? `<p class="hint">${cnfNoteHTML(m.review_note || '')}</p>` : ''}`)}
    ${typeof relatedBox === 'function' ? relatedBox('conflict', en.id, { skip: ['traditions', 'time'] }) : ''}
  </div>`;      /* the Related strip ends the entry; it leaves out the buttons to the religions and the “On the timeline” button or the line about 1900 that the entry draws itself, so what it adds is the texts and the places on the map */
}

Pages.conflicts = {
  async mount(root, parts, query) {
    const loc = typeof secLocate === 'function' ? secLocate('conflicts') : null; const id = parts && parts[0] ? decodeURIComponent(parts[0]) : '';
    root.innerHTML = `${loc ? secHeadHTML(loc, { compact: true }) : '<div class="page-head fade-in"><div><h1>Conflicts and peacemaking</h1></div></div>'}${loc ? secNavHTML(loc, {}) : ''}<div id="cnfbody"><div class="card"><p class="t2 small">Opening the entries…</p></div></div>`;
    const body = root.querySelector('#cnfbody'); let ix; let world = null;
    try { await ATLD.need('world').catch(() => null); world = ATLD.get('world') || null; ix = await ATLD.open(); } catch (e) { body.innerHTML = `<div class="card"><div class="callout warn">${icon('warn')}<div>The entries were not found. They live in the <b>atlas</b> folder next to <b>Lamplighter.html</b> (the same place as the map).</div></div></div>`; return; }
    if (!root.isConnected) return;
    const entries = cnfEntries(world);
    if (!world || !cnfMeta(world).lede || !entries.length) { body.innerHTML = `<div class="card"><div class="callout warn">${icon('warn')}<div>This copy of the atlas folder has no conflicts yet (the file <b>atlas/world.js</b> is older than this page). The <a href="#/history">History timeline</a> still shows the wars it has.</div></div></div>`; return; }
    const anc = (t) => (typeof atlLineage === 'function' ? atlLineage(ix, t).slice(1) : []); const name = (t) => (ix.trad[t] || {}).name || t; const probe = { anc, name };
    const ctx = { anc, name, traditions: new Set(cnfTraditionChoices(entries, probe).map((t) => t.id)) }; const choices = cnfTraditionChoices(entries, probe); const byId = cnfById(entries);
    let st = cnfParse(query, ctx); let alive = true; const cleanups = []; const on = (t, ev, fn, o) => { t.addEventListener(ev, fn, o); cleanups.push(() => t.removeEventListener(ev, fn, o)); };
    body.innerHTML = `<div class="cnf" id="cnf"><div id="cnfTop" hidden>${cnfTopHTML(world)}<form class="cnf-find" id="cnfFind" role="search"><input class="input" type="search" id="cnfQ" placeholder="Find an entry by name, place or side…" aria-label="Find an entry by name, place or side" autocomplete="off"></form></div><div id="cnfView"></div></div>`;
    const view = body.querySelector('#cnfView'); const find = body.querySelector('#cnfFind'); const top = body.querySelector('#cnfTop'); const input = body.querySelector('#cnfQ'); const calm = () => typeof prefersReducedMotion === 'function' && prefersReducedMotion();
    let cur = id && byId[id] ? id : '';
    const draw = (focus) => {
      if (cur) { top.hidden = true; view.innerHTML = cnfEntryHTML(world, byId[cur], { ix, st }); const h = view.querySelector('#cnfTitle'); if (h && focus !== false) h.focus({ preventScroll: true }); document.title = byId[cur].label + ' · Conflicts and peacemaking · The Lamplighter Project'; return; }
      top.hidden = false; input.value = st.q; view.innerHTML = cnfListHTML(world, entries, st, { ctx, choices, bare: true }); if (focus && typeof focus === 'string') { const el = view.querySelector(focus); if (el && el.focus) el.focus(); }
    };
    const put = (replace, hash) => { try { if (replace) history.replaceState(null, '', hash); else history.pushState(null, '', hash); return true; } catch (e) { return false; } };      /* file:// in some browsers: then the address itself changes and the page is drawn again */
    const set = (next, o) => { o = o || {}; st = next; cur = ''; if (!put(o.replace, cnfHref(st))) { location.hash = cnfHref(st); return; } draw(o.focus); };
    draw(cur ? true : false);
    if (id && !cur) { st = cnfParse(query, ctx); }
    on(view, 'click', (e) => {
      const el = e.target && e.target.closest ? e.target.closest('[data-cnf],[data-cite]') : null; if (!el || el.disabled) return; const plain = !(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button);
      if (el.dataset.cite) { const s = view.querySelector('#cnfSrc' + el.dataset.cite); if (s) { s.scrollIntoView({ block: 'center', behavior: calm() ? 'auto' : 'smooth' }); s.classList.add('on'); s.focus({ preventScroll: true }); setTimeout(() => { if (alive) s.classList.remove('on'); }, 1600); } return; }
      const k = el.dataset.cnf;
      if (k === 'k') set(cnfNext(st, { k: st.k === el.dataset.v ? '' : el.dataset.v }, ctx), { focus: `[data-cnf="k"][data-v="${el.dataset.v}"]` });
      else if (!plain) return;
      else if (k === 'clear') { e.preventDefault(); set(cnfParse({}, ctx), { focus: false }); }
      else if (k === 'list') { e.preventDefault(); cur = ''; put(false, cnfHref(st)); draw(false); window.scrollTo(0, 0); }
    });
    on(view, 'change', (e) => { const el = e.target; const k = el && el.dataset ? el.dataset.cnf : ''; if (!k || k === 'k') return; set(cnfNext(st, { [k]: String(el.value) }, ctx), { focus: `#cnf-${k}` }); });
    on(view, 'click', (e) => { const a = e.target && e.target.closest ? e.target.closest('a.cnf-row') : null; if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button) return; e.preventDefault(); const eid = a.dataset.id; if (!byId[eid]) return; cur = eid; put(false, cnfHref(st, eid)); draw(true); window.scrollTo(0, 0); });
    const typed = () => { const q = input.value.trim().slice(0, 80); if (q !== st.q) { st = cnfNext(st, { q }, ctx); put(!!st.q && !!q, cnfHref(st)); const keep = input.value; view.innerHTML = cnfListHTML(world, entries, st, { ctx, choices, bare: true }); input.value = keep; } };
    on(input, 'input', debounce(typed, 220)); on(find, 'submit', (e) => { e.preventDefault(); typed(); });
    return () => { alive = false; cleanups.forEach((f) => { try { f(); } catch (e) { /* gone already */ } }); };
  },
};
if (typeof module !== 'undefined' && module.exports) module.exports = {};
