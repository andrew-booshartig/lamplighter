/* ═══════════════════════════ 6l · Highlights and notes, passage sets and parallel passages ═══════════════════════════
   Highlights and notes: every highlight, note and bookmark across the library, and how far through each text you are.
   Passage sets (kept as threads: the address, the stored data and the pack file say so): passages from different texts set side by side with how you think they relate (borrowing, shared ancestry, contact,
   independent parallel, contested), shareable as a signed pack. Parallel passages: curated threads to start from. */
const tradName = (tid) => { const l = LIB_BY_ID[tid]; return l ? ((LIB_GROUPS.find((g) => g[0] === l.group) || [0, ''])[1]) : ''; };
const titleOf = (tid) => (LIB_BY_ID[tid] ? LIB_BY_ID[tid].title : tid);
const mkDate = (t) => (t ? new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '');
const readLink = (tid, o = {}) => '#/path/read/' + tid + '?' + new URLSearchParams(Object.assign({ s: o.s || 0 }, o.p != null ? { p: o.p } : {}, o.h ? { h: o.h } : {}));
const kindChip = (k) => { const e = ECHO_KINDS[k]; return e ? `<span class="kind sm" style="--k:${e.color}" title="${esc(e.desc)}">${esc(e.name)}</span>` : ''; };

/* ───────── library hooks: continue reading, per-row progress ───────── */
function libContinueHTML() {
  const all = MARKS.all(); const ids = Object.keys(all).filter((id) => LIB_BY_ID[id] && all[id] && all[id].last).sort((a, b) => (all[b].last.t || 0) - (all[a].last.t || 0)).slice(0, 4);
  if (!ids.length) return '';
  return `<section class="lib-cont"><div class="card-title"><h3>Continue reading</h3><a class="small" href="#/path/marks?k=prog">All your reading →</a></div><div class="cont-row">${ids.map((id) => {
    const m = marksClean(all[id]); const p = progressOf(m); const f = m.last.f > 0 ? Math.round(m.last.f * 100) : p.pct;      // how far through the text the place is (older saves only know the sections read)
    const cv = typeof lcCover === 'function' ? lcCover(id, Math.max(0, typeof libCollOf === 'function' ? libCollOf(LIB_BY_ID[id].group) : 0), titleOf(id)) : null;
    return `<a class="contcard" href="#/path/read/${id}" data-cont="${id}">${cv ? `<span class="bk-mini big" style="${lcCoverStyle(cv)}" aria-hidden="true"><span>${esc(cv.glyph)}</span></span>` : ''}<span class="cc-t"><b>${esc(titleOf(id))}</b><span class="small muted">${esc(tradName(id))}</span><span class="small muted">${f}% through${p.done ? ` · ${p.done} of ${p.total} sections read` : ''} · ${esc(mkDate(m.last.t))}<span class="cl"></span></span><div class="bar" aria-hidden="true"><i style="width:${f}%"></i></div></span></a>`;
  }).join('')}</div></section>`;
}
/* once the texts' index is known, say how long the rest of each will take at this reader's own pace */
function libContinueLeft(id, chars) {
  const all = MARKS.all(); const m = all[id] ? marksClean(all[id]) : null; if (!chars || !m || !m.last || !(m.last.f > 0)) return '';
  return rdFmtLeft(rdMinutes(chars * (1 - m.last.f), rdCpm(store.get('reader.cpm', RD_CPM.def))));
}
function libContinueFill(root, meta) {
  $$('[data-cont]', root).forEach((a) => { const mm = meta && meta[a.dataset.cont]; const left = mm ? libContinueLeft(a.dataset.cont, mm.chars) : ''; const el = a.querySelector('.cl'); if (el && left) el.textContent = ' · ' + left; });
}
/* how far through a text a reader is, 0 to 1: the saved place if there is one, else the sections read */
const libFraction = (id, n) => { const mm = MARKS.get(id); const f = mm && mm.last && mm.last.f > 0 ? mm.last.f : 0; if (f) return Math.min(1, f); const p = progressOf(mm, n); return p && p.done ? p.pct / 100 : 0; };
const libRowProgress = (id, n) => { const p = progressOf(MARKS.get(id), n); return p.done ? `<span class="tag good" title="${p.done} of ${p.total} sections read">${p.pct}% read</span>` : ''; };

/* ───────── passage cards and the compare layout ───────── */
function passageCard(it, o = {}) {
  const l = LIB_BY_ID[it.tid]; const head = it.label || (l ? l.title : it.tid);
  return `<article class="pcard2" data-item="${esc(it.id)}"><div class="pc-head"><div><div class="eyebrow">${esc(tradName(it.tid))}</div><h4>${esc(head)}</h4><div class="small muted">${esc(l ? l.title : it.tid)}${it.sh ? ' · ' + esc(it.sh.length > 44 ? it.sh.slice(0, 43) + '…' : it.sh) : ''}</div></div></div>${o.edit ? `<div class="pc-tools row tight"><button class="btn sm ghost" type="button" data-t="left" aria-label="Move earlier"${o.i === 0 ? ' disabled' : ''}>←</button><button class="btn sm ghost" type="button" data-t="right" aria-label="Move later"${o.i === o.n - 1 ? ' disabled' : ''}>→</button><button class="btn sm ghost" type="button" data-t="edit" aria-label="Edit label and note">${icon('pen')}</button><button class="btn sm ghost" type="button" data-t="del" aria-label="Remove this passage">${icon('x')}</button></div>` : ''}
    <blockquote class="pc-quote">${quoteHTML(it.q)}</blockquote>${it.note ? `<p class="pc-note">${esc(it.note)}</p>` : ''}
    <div class="small"><a href="${readLink(it.tid, { s: it.s, p: it.p })}">Read in context →</a></div></article>`;
}
function relationsHTML(t, o = {}) {
  if (!t.links.length) return '';
  const nm = (id) => { const it = t.items.find((x) => x.id === id); return it ? (it.label || titleOf(it.tid)) : '?'; };
  return `<section class="card flat" style="margin-top:14px"><div class="card-title"><h3>How they relate</h3></div><ul class="plain rels">${t.links.map((k, i) => `<li>${kindChip(k.kind)} <b>${esc(nm(k.a))}</b> ↔ <b>${esc(nm(k.b))}</b>${k.note ? `<div class="small t2">${esc(k.note)}</div>` : ''}${o.edit ? `<button class="btn sm ghost" type="button" data-unlink="${i}" aria-label="Remove this relation">${icon('x')}</button>` : ''}</li>`).join('')}</ul></section>`;
}
function compareHTML(t, o = {}) {
  const cols = clamp(parseInt(o.cols, 10) || 0, 0, 4);
  return `<div class="cmp${cols ? ' cols' + cols : ''}">${t.items.map((it, i) => passageCard(it, { edit: o.edit, i, n: t.items.length })).join('') || '<p class="t2">No passages yet.</p>'}</div>${relationsHTML(t, o)}`;
}
const colsPicker = (cur, base) => `<span class="row tight small"><span class="muted">Columns</span>${[['', 'Auto'], ['1', '1'], ['2', '2'], ['3', '3']].map(([v, n]) => `<a class="chip" href="${base}${v ? (base.includes('?') ? '&' : '?') + 'cols=' + v : ''}" aria-pressed="${(cur || '') === v}">${n}</a>`).join('')}</span>`;
function threadMD(t) {
  const nm = (id) => { const it = t.items.find((x) => x.id === id); return it ? (it.label || titleOf(it.tid)) : '?'; };
  return `# ${t.title}\n\n${t.note ? t.note + '\n\n' : ''}${t.items.map((it) => `## ${it.label || titleOf(it.tid)}\n*${titleOf(it.tid)}${it.sh ? ', ' + it.sh : ''}${((BEATLAB_TEXTS.meta || {})[it.tid] || {}).by ? ' (' + BEATLAB_TEXTS.meta[it.tid].by + ')' : ''}*\n\n${it.q.split('\n').map((x) => '> ' + x).join('\n')}\n${it.note ? '\n' + it.note + '\n' : ''}`).join('\n')}${t.links.length ? '\n## How they relate\n\n' + t.links.map((k) => `- **${nm(k.a)}** ↔ **${nm(k.b)}** (${(ECHO_KINDS[k.kind] || { name: k.kind }).name})${k.note ? ': ' + k.note : ''}`).join('\n') + '\n' : ''}\n— Made in the Lamplighter Project\n`;
}
const threadForPack = (t) => ({ id: t.id, title: t.title, note: t.note, items: t.items.map((x) => ({ id: x.id, tid: x.tid, s: x.s, p: x.p, a: x.a, b: x.b, q: x.q, label: x.label, note: x.note, sh: x.sh })), links: t.links, t: t.t, u: t.u });

/* ───────── adding a passage to a thread (from the reader, a random passage or a parallel) ───────── */
async function addToThread(item) {
  const list = THREADS.all(); const last = store.get('reader.lastThread', '');
  const pm = modal({
    title: 'Add to a passage set',
    html: `<blockquote class="pc-quote" style="max-height:140px;overflow:auto">${quoteHTML(String(item.q).slice(0, 600))}${String(item.q).length > 600 ? '…' : ''}</blockquote>
      <label class="small t2" for="atSel">Passage set</label><select class="select" id="atSel" style="width:100%"><option value="">New passage set…</option>${list.map((t) => `<option value="${esc(t.id)}"${t.id === last ? ' selected' : ''}>${esc(t.title)} (${t.items.length})</option>`).join('')}</select>
      <input class="input" id="atNew" maxlength="${MARK_LIMITS.title}" placeholder="Name for a new passage set, e.g. “Floods”" style="width:100%;margin-top:8px"${last && list.some((t) => t.id === last) ? ' hidden' : ''}>
      <label class="small t2" for="atLabel" style="display:block;margin-top:10px">Label for this passage (optional)</label><input class="input" id="atLabel" maxlength="${MARK_LIMITS.label}" placeholder="e.g. “The warning”" style="width:100%">`,
    actions: [{ label: 'Cancel', kind: 'ghost', value: null }, { label: 'Add', kind: 'primary', collect: (back) => ({ id: $('#atSel', back).value, title: $('#atNew', back).value.trim(), label: $('#atLabel', back).value.trim() }) }],
  });
  const sel = document.getElementById('atSel'); if (sel) sel.addEventListener('change', () => { const n = document.getElementById('atNew'); if (n) n.hidden = !!sel.value; });
  const res = await pm;
  if (!res) return null;
  let t = res.id ? THREADS.get(res.id) : null; const fresh = !t;
  if (!t) { t = threadNew(res.title || 'Untitled passage set'); }
  const added = threadAddItem(t, { tid: item.tid, s: item.s, p: item.p, a: item.a, b: item.b, q: item.q, label: res.label, sh: item.sh });
  if (!added) { toast(`A passage set holds up to ${MARK_LIMITS.items} passages.`, 'warn'); return null; }
  if (fresh) THREADS.add(t); else THREADS.upd(t.id, (x) => { x.items = t.items; });
  store.set('reader.lastThread', t.id);
  toast(`Added to “${esc(t.title)}”. <a href="#/path/thread/${t.id}">Open the passage set →</a>`, 'good', 5200);
  return t.id;
}

/* several passages at once (from search results): into an existing passage set or a new one */
async function addManyToThread(items) {
  const list = THREADS.all(); const last = store.get('reader.lastThread', ''); const first = list.some((t) => t.id === last) ? last : '';
  const pm = modal({
    title: `Add ${items.length} passage${items.length === 1 ? '' : 's'} to a passage set`,
    html: `<ul class="plain small" style="max-height:150px;overflow:auto">${items.map((x) => `<li><b>${esc(titleOf(x.tid))}</b> <span class="muted">· ${esc(x.sh || '')}</span></li>`).join('')}</ul>
      <label class="small t2" for="amSel" style="display:block;margin-top:10px">Passage set</label><select class="select" id="amSel" style="width:100%"><option value="">New passage set…</option>${list.map((t) => `<option value="${esc(t.id)}"${t.id === first ? ' selected' : ''}>${esc(t.title)} (${t.items.length})</option>`).join('')}</select>
      <input class="input" id="amNew" maxlength="${MARK_LIMITS.title}" placeholder="Name for a new passage set" style="width:100%;margin-top:8px"${first ? ' hidden' : ''}>`,
    actions: [{ label: 'Cancel', kind: 'ghost', value: null }, { label: 'Add', kind: 'primary', collect: (back) => ({ id: $('#amSel', back).value, title: $('#amNew', back).value.trim() }) }],
  });
  const sel = document.getElementById('amSel'); if (sel) sel.addEventListener('change', () => { const n = document.getElementById('amNew'); if (n) n.hidden = !!sel.value; });
  const res = await pm; if (!res) return null;
  let t = res.id ? THREADS.get(res.id) : null; const fresh = !t; if (!t) t = threadNew(res.title || 'Untitled passage set'); let n = 0;
  items.forEach((x) => { if (threadAddItem(t, { tid: x.tid, s: x.s, p: x.p, a: x.a, b: x.b, q: x.q, sh: x.sh, label: titleOf(x.tid) })) n++; });
  if (!n) { toast(`A passage set holds up to ${MARK_LIMITS.items} passages.`, 'warn'); return null; }
  if (fresh) THREADS.add(t); else THREADS.upd(t.id, (x) => { x.items = t.items; });
  store.set('reader.lastThread', t.id);
  toast(`${n} passage${n === 1 ? '' : 's'} added to “${esc(t.title)}”${n < items.length ? ` (the passage set is full; ${items.length - n} left out)` : ''}. <a href="#/path/thread/${t.id}">Open the passage set →</a>`, 'good', 6000);
  return t.id;
}

/* ───────── Highlights and notes ───────── */
function marksMD() {
  const all = MARKS.all(); const out = ['# Highlights and notes\n'];
  Object.keys(all).filter((id) => LIB_BY_ID[id]).sort((a, b) => titleOf(a).localeCompare(titleOf(b))).forEach((id) => {
    const m = marksClean(all[id]); if (!m.hl.length && !m.bm.length) return;
    out.push(`\n## ${titleOf(id)}\n`);
    m.hl.slice().sort((a, b) => a.s - b.s || a.p - b.p || a.a - b.a).forEach((h) => { out.push(`- ${h.sh ? '*' + h.sh + '* — ' : ''}“${h.q.replace(/\s+/g, ' ').trim()}”${h.n ? '\n  - Note: ' + h.n.replace(/\n/g, ' ') : ''}`); });
    m.bm.slice().sort((a, b) => a.s - b.s || a.p - b.p).forEach((b) => { out.push(`- Bookmark: ${b.sh || 'section ' + (b.s + 1)}${b.q && b.p >= 0 ? ' — ' + b.q : ''}${b.n ? '\n  - Note: ' + b.n.replace(/\n/g, ' ') : ''}`); });
  });
  return out.join('\n') + '\n';
}
function pathMarksView(root, query) {
  const body = root.querySelector('#pbody'); const all = MARKS.all(); const tot = MARKS.totals();
  const ids = Object.keys(all).filter((id) => LIB_BY_ID[id]); const texts = ids.filter((id) => { const m = marksClean(all[id]); return m.hl.length || m.bm.length; });
  const started = ids.filter((id) => { const m = marksClean(all[id]); return m.rs.length || m.last; }).sort((a, b) => ((all[b].last || {}).t || 0) - ((all[a].last || {}).t || 0));
  const tab = ['hl', 'bm', 'prog'].includes(query.k) ? query.k : (tot.hl ? 'hl' : tot.bm ? 'bm' : 'prog'); const tf = LIB_BY_ID[query.t] ? query.t : ''; const cf = HL_IDS.includes(query.c) ? query.c : ''; const q = (query.q || '').trim().toLowerCase();
  const href = (o) => '#/path/marks?' + new URLSearchParams(Object.assign({ k: tab, t: tf, c: cf, q: query.q || '' }, o));
  const hlItems = []; const bmItems = [];
  texts.forEach((id) => { if (tf && id !== tf) return; const m = marksClean(all[id]); m.hl.forEach((h) => { if ((!cf || h.c === cf) && (!q || (h.q + ' ' + h.n + ' ' + titleOf(id)).toLowerCase().includes(q))) hlItems.push({ id, h }); }); m.bm.forEach((b) => { if (!q || (b.q + ' ' + b.n + ' ' + b.sh + ' ' + titleOf(id)).toLowerCase().includes(q)) bmItems.push({ id, b }); }); });
  hlItems.sort((x, y) => (y.h.t || 0) - (x.h.t || 0)); bmItems.sort((x, y) => (y.b.t || 0) - (x.b.t || 0));
  const hlCard = ({ id, h }) => `<article class="card flat mk" data-tid="${id}" data-hid="${esc(h.id)}"><div class="spread" style="gap:8px;align-items:flex-start;flex-wrap:wrap"><div><b><a href="${readLink(id, { s: h.s, p: h.p, h: h.id })}">${esc(titleOf(id))}</a></b> <span class="muted small">· ${esc(h.sh || 'section ' + (h.s + 1))} · ${esc(mkDate(h.t))}</span></div><span class="hlsw hl-${esc(h.c)}" title="${esc(h.c)}"></span></div><blockquote class="mk-q"><span class="hl hl-${esc(h.c)}">${esc(h.q.length > 700 ? h.q.slice(0, 700) + '…' : h.q)}</span></blockquote>${h.n ? `<p class="mk-note">${esc(h.n)}</p>` : ''}<div class="row tight"><a class="btn sm ghost" href="${readLink(id, { s: h.s, p: h.p, h: h.id })}">Open</a><button class="btn sm ghost" type="button" data-act="note">${icon('pen')}${h.n ? 'Edit note' : 'Add note'}</button><button class="btn sm ghost" type="button" data-act="thread">${icon('threads')}Passage set</button>${typeof NB !== 'undefined' ? `<button class="btn sm ghost" type="button" data-act="clip" title="Clip to notebook">${icon('journal')}Clip</button>` : ''}<button class="btn sm ghost" type="button" data-act="copy">${icon('copy')}Copy</button><button class="btn sm ghost" type="button" data-act="del" aria-label="Remove highlight">${icon('trash')}</button></div></article>`;
  const bmCard = ({ id, b }) => `<article class="card flat mk" data-tid="${id}" data-bid="${esc(b.id)}"><div class="spread" style="gap:8px;flex-wrap:wrap"><div><b><a href="${readLink(id, { s: b.s, p: b.p >= 0 ? b.p : undefined })}">${esc(titleOf(id))}</a></b> <span class="muted small">· ${esc(b.sh || 'section ' + (b.s + 1))} · ${esc(mkDate(b.t))}</span></div>${icon('bookmark')}</div>${b.q && b.p >= 0 ? `<blockquote class="mk-q">${esc(b.q)}${b.q.length >= 140 ? '…' : ''}</blockquote>` : '<p class="small muted">The start of the section.</p>'}${b.n ? `<p class="mk-note">${esc(b.n)}</p>` : ''}<div class="row tight"><a class="btn sm ghost" href="${readLink(id, { s: b.s, p: b.p >= 0 ? b.p : undefined })}">Open</a><button class="btn sm ghost" type="button" data-act="note">${icon('pen')}${b.n ? 'Edit note' : 'Add note'}</button><button class="btn sm ghost" type="button" data-act="del" aria-label="Remove bookmark">${icon('trash')}</button></div></article>`;
  const progRow = (id) => { const m = marksClean(all[id]); const p = progressOf(m); return `<tr data-tid="${id}"><td><b><a href="#/path/read/${id}">${esc(titleOf(id))}</a></b><div class="small muted">${esc(tradName(id))}</div></td><td style="min-width:150px"><div class="bar" aria-hidden="true"><i style="width:${p.pct}%"></i></div><span class="small t2">${p.done}${p.total ? ` of ${p.total}` : ''} section${(p.total || p.done) === 1 ? '' : 's'}${p.total ? ` · ${p.pct}%` : ''}</span></td><td class="small">${m.last ? esc(mkDate(m.last.t)) : ''}</td><td><a class="btn sm" href="#/path/read/${id}">Continue</a> <button class="btn sm ghost" type="button" data-act="reset" title="Clear the sections you have marked read in this text">Reset</button></td></tr>`; };
  body.innerHTML = `<p class="t2 small" style="max-width:72ch">Everything you highlight, bookmark or note in the reader, and how far through each text you are. It lives in this browser only; the Setup backup includes it.</p>
    <div class="grid c4" style="margin:12px 0"><div class="card flat stat-tile"><b>${tot.hl}</b><span class="small t2">highlights</span></div><div class="card flat stat-tile"><b>${tot.bm}</b><span class="small t2">bookmarks</span></div><div class="card flat stat-tile"><b>${tot.notes}</b><span class="small t2">notes</span></div><div class="card flat stat-tile"><b>${tot.rs}</b><span class="small t2">sections read in ${started.length} text${started.length === 1 ? '' : 's'}</span></div></div>
    <div class="row tight" style="margin-bottom:10px"><a class="chip" href="${href({ k: 'hl' })}" aria-pressed="${tab === 'hl'}">Highlights ${hlItems.length}</a><a class="chip" href="${href({ k: 'bm' })}" aria-pressed="${tab === 'bm'}">Bookmarks ${bmItems.length}</a><a class="chip" href="${href({ k: 'prog' })}" aria-pressed="${tab === 'prog'}">Reading ${started.length}</a>
      ${tot.hl || tot.bm ? `<button class="btn sm" id="mkExport" type="button" style="margin-left:auto">${icon('download')}Export notes (Markdown)</button>` : ''}</div>
    ${tab !== 'prog' ? `<div class="row" style="margin-bottom:12px"><input class="input" id="mkQ" type="search" placeholder="Search your highlights and notes…" value="${esc(query.q || '')}" style="max-width:240px" aria-label="Search your highlights and notes"><select class="select" id="mkT" style="width:auto;max-width:260px" aria-label="Filter by text"><option value="">All texts</option>${texts.map((id) => `<option value="${id}"${id === tf ? ' selected' : ''}>${esc(titleOf(id))}</option>`).join('')}</select>${tab === 'hl' ? `<span class="row tight">${HL_COLORS.map(([k, n]) => `<a class="hlsw hl-${k}${cf === k ? ' on' : ''}" href="${href({ c: cf === k ? '' : k })}" aria-label="Only ${n}" aria-pressed="${cf === k}" title="${n}"></a>`).join('')}</span>` : ''}</div>` : ''}
    ${tab === 'hl' ? `<div class="stack sm">${hlItems.map(hlCard).join('') || `<div class="card flat"><p class="t2">${tot.hl ? 'No highlights match.' : 'No highlights yet. Open a text, select some words and choose a colour.'} <a href="#/path/library">Open the library</a></p></div>`}</div>` : ''}
    ${tab === 'bm' ? `<div class="stack sm">${bmItems.map(bmCard).join('') || `<div class="card flat"><p class="t2">${tot.bm ? 'No bookmarks match.' : 'No bookmarks yet. In the reader, tap the bookmark mark beside a paragraph, or bookmark a whole section.'}</p></div>`}</div>` : ''}
    ${tab === 'prog' ? (started.length ? `<div class="table-wrap"><table class="stat-table libtable"><tr><th>Text</th><th>Progress</th><th>Last read</th><th></th></tr>${started.map(progRow).join('')}</table></div><p class="small muted" style="margin-top:8px">A section counts as read when you reach its end in the reader, or when you tick it. A book counts as read when every section is.</p>` : '<div class="card flat"><p class="t2">Nothing started yet. Open any text from the <a href="#/path/library">library</a>.</p></div>') : ''}`;
  const go = debounce(() => { location.hash = href({ q: $('#mkQ', body).value, t: $('#mkT', body).value }); }, 300);
  const qi = $('#mkQ', body); if (qi) qi.addEventListener('input', go); const ti = $('#mkT', body); if (ti) ti.addEventListener('change', go);
  const ex = $('#mkExport', body); if (ex) ex.addEventListener('click', () => download('lamplighter-highlights-and-notes.md', marksMD(), 'text/markdown'));
  if (body._mk) return; body._mk = true;
  body.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-act]'); if (!b) return; const card = b.closest('[data-tid]'); if (!card) return; const id = card.dataset.tid; const act = b.dataset.act; const hid = card.dataset.hid; const bid = card.dataset.bid;
    const redo = () => pathMarksView(root, Router.parse().query);
    if (act === 'reset') { if (await confirmBox('Clear your reading progress?', `<p>This clears the sections marked read in <b>${esc(titleOf(id))}</b>. Your highlights and bookmarks are kept.</p>`, 'Clear', 'danger')) { MARKS.upd(id, (m) => { m.rs = []; m.last = null; }); redo(); } return; }
    const m = MARKS.get(id);
    if (hid) {
      const h = m.hl.find((x) => x.id === hid); if (!h) return;
      if (act === 'note') { const v = await rdNoteBox('Note on this highlight', h.n); if (v != null) { MARKS.upd(id, (mm) => { hlUpdate(mm, hid, { n: v }); }); redo(); } }
      else if (act === 'copy') { const ok = await rdCopy(rdCitation(id, h.sh, h.q)); toast(ok ? 'Copied with a citation.' : 'Copying is not available here.', ok ? 'good' : 'bad', 2000); }
      else if (act === 'thread') await addToThread({ tid: id, s: h.s, p: h.p, a: h.a, b: h.b, q: h.q, sh: h.sh });
      else if (act === 'clip') { if (typeof NB !== 'undefined') await NB.clip({ id, text: h.q, s: h.s, p: h.p, heading: h.sh, note: h.n }); }
      else if (act === 'del') { if (!h.n || await confirmBox('Remove this highlight?', '<p>Its note will be deleted too.</p>', 'Remove', 'danger')) { MARKS.upd(id, (mm) => { hlRemove(mm, hid); }); redo(); } }
    } else if (bid) {
      const bk = m.bm.find((x) => x.id === bid); if (!bk) return;
      if (act === 'note') { const v = await rdNoteBox('Note on this bookmark', bk.n); if (v != null) { MARKS.upd(id, (mm) => { const x = mm.bm.find((y) => y.id === bid); if (x) x.n = v.slice(0, MARK_LIMITS.note); }); redo(); } }
      else if (act === 'del') { MARKS.upd(id, (mm) => { mm.bm = mm.bm.filter((y) => y.id !== bid); }); redo(); }
    }
  });
}

/* ───────── threads ───────── */
function pathThreadsView(root, query) {
  const body = root.querySelector('#pbody'); const list = THREADS.all();
  body.innerHTML = `<p class="t2 small" style="max-width:74ch">A passage set puts passages from different texts side by side, so you can compare how traditions say a similar thing, or how one text changes another. Make your own from anything you highlight in the reader (select words, then <b>Add to a passage set</b>), or begin from a <a href="#/path/parallels">curated parallel</a>. Say how each pair relates using the same five kinds as Shared ideas, and share the set as a signed pack: no server, no account.</p>
    <div class="row" style="margin:14px 0"><input class="input" id="thName" maxlength="${MARK_LIMITS.title}" placeholder="Name a new passage set, e.g. “Creation from water”" style="max-width:340px" aria-label="Name for a new passage set"><button class="btn primary" id="thNew" type="button">${icon('plus')}New passage set</button><a class="btn ghost" href="#/path/parallels">Start from a parallel</a></div>
    <div class="stack sm">${list.map((t) => `<a class="card flat thcard" href="#/path/thread/${esc(t.id)}"><div class="spread" style="gap:10px;flex-wrap:wrap"><b>${esc(t.title)}</b><span class="muted small">${t.items.length} passage${t.items.length === 1 ? '' : 's'} · ${t.links.length} relation${t.links.length === 1 ? '' : 's'} · ${esc(mkDate(t.u))}</span></div><div class="small t2">${[...new Set(t.items.map((x) => titleOf(x.tid)))].slice(0, 5).map(esc).join(' · ')}${t.src ? ` · from ${esc(t.src)}` : ''}</div></a>`).join('') || '<div class="card flat"><p class="t2">No passage sets yet.</p></div>'}</div>
    <section class="card flat" style="margin-top:18px"><div class="card-title"><h3>${icon('download')}Open a shared passage set</h3></div><p class="small t2">Paste the block of code a friend sent you. It may be a long line of letters and numbers; it can sit inside a message.</p><textarea class="input" id="thPaste" rows="3" style="width:100%" placeholder="Paste the code here" aria-label="The code of a shared passage set"></textarea><div class="row" style="margin-top:8px"><button class="btn" id="thOpen" type="button">Open</button></div></section>`;
  $('#thNew', body).addEventListener('click', () => { const nm = $('#thName', body).value.trim(); const t = threadNew(nm || 'Untitled passage set'); THREADS.add(t); location.hash = '#/path/thread/' + t.id; });
  $('#thName', body).addEventListener('keydown', (e) => { if (e.key === 'Enter') $('#thNew', body).click(); });
  $('#thOpen', body).addEventListener('click', () => { const raw = $('#thPaste', body).value.trim(); if (!raw) return; let code = ''; try { code = packFromText(raw); } catch (e) { code = ''; } if (!code) { toast('That does not look like a Lamplighter pack.', 'bad'); return; } location.hash = '#/gather/open?' + new URLSearchParams({ p: code }); });
}

function pathThreadView(root, id, query) {
  const body = root.querySelector('#pbody'); let t = THREADS.get(id);
  if (!t) { body.innerHTML = '<div class="card"><p>No such passage set. <a href="#/path/threads">Back to your passage sets</a></p></div>'; return; }
  const cols = query.cols || '';
  const names = () => t.items.map((x) => [x.id, x.label || titleOf(x.tid)]);
  const draw = () => {
    t = THREADS.get(id) || t;
    body.innerHTML = `<div class="small" style="margin-bottom:10px"><a href="#/path/threads">← Passage sets</a></div>
      <section class="card glow fade-in"><input class="input th-title" id="thTitle" maxlength="${MARK_LIMITS.title}" value="${esc(t.title)}" aria-label="Passage set name"><textarea class="input" id="thNote" rows="2" maxlength="${MARK_LIMITS.note}" placeholder="What is this passage set about? (optional)" style="width:100%;margin-top:8px" aria-label="About this passage set">${esc(t.note)}</textarea>
        <div class="row" style="margin-top:10px"><span class="muted small">${t.items.length} of ${MARK_LIMITS.items} passages${t.src ? ` · from ${esc(t.src)}` : ''}</span>${t.items.length > 1 ? `<span style="margin-left:auto">${colsPicker(cols, '#/path/thread/' + id)}</span>` : ''}</div></section>
      <div style="margin-top:14px">${compareHTML(t, { edit: true, cols })}</div>
      ${t.items.length < 2 ? `<p class="small t2" style="margin-top:12px">Add at least two passages to compare them. In the reader, select words and choose <b>Add to a passage set</b>; or start from a <a href="#/path/parallels">curated parallel</a>.</p>` : `<section class="card flat" style="margin-top:14px"><div class="card-title"><h3>Say how two passages relate</h3></div>
        <div class="row"><select class="select" id="lkA" aria-label="First passage" style="width:auto;max-width:220px">${names().map(([i, n]) => `<option value="${esc(i)}">${esc(n)}</option>`).join('')}</select><span>↔</span><select class="select" id="lkB" aria-label="Second passage" style="width:auto;max-width:220px">${names().map(([i, n], k) => `<option value="${esc(i)}"${k === 1 ? ' selected' : ''}>${esc(n)}</option>`).join('')}</select>
          <select class="select" id="lkK" aria-label="Kind of relation" style="width:auto">${Object.entries(ECHO_KINDS).map(([k, v]) => `<option value="${k}">${esc(v.name)}</option>`).join('')}</select></div>
        <div class="small t2" id="lkDesc" style="margin:6px 0"></div><div class="row"><input class="input" id="lkN" maxlength="${MARK_LIMITS.note}" placeholder="Why? (optional)" style="flex:1;min-width:200px" aria-label="Note on the relation"><button class="btn" id="lkGo" type="button">Link them</button></div>
        <p class="hint" style="margin-top:8px">“Similar” is not “borrowed”. Choose the kind the evidence supports; <a href="#/path/echoes">the Shared ideas page</a> explains each kind.</p></section>`}
      <section class="card flat" style="margin-top:14px"><div class="card-title"><h3>${icon('heart')}Share or keep</h3></div>
        <div class="row"><label class="chk"><input type="checkbox" id="thSign" checked><span class="small">Sign it with my key</span></label><button class="btn" data-sh="text" type="button">Copy as text</button><button class="btn" data-sh="link" type="button">Copy a link</button><button class="btn ghost" data-sh="file" type="button">${icon('download')}Save a file</button>${typeof NB !== 'undefined' ? `<button class="btn ghost" data-sh="nb" type="button" title="Make a notebook page of this passage set: each passage a clip that links back to its place">${icon('journal')}Send to notebook</button>` : ''}<button class="btn ghost" data-sh="md" type="button">${icon('download')}Export (Markdown)</button><button class="btn ghost danger" data-sh="del" type="button" style="margin-left:auto">${icon('trash')}Delete passage set</button></div>
        <textarea class="input mono" id="thOut" rows="3" hidden readonly style="width:100%;margin-top:8px" aria-label="Pack code"></textarea>
        <p class="hint" style="margin-top:8px">The quotes travel with the passage set, so whoever opens it can read them even without the same texts. A signature shows the passage set was not changed on the way and, once you have met in person, who it came from.</p></section>`;
    wire();
  };
  const save = (fn) => { THREADS.upd(id, fn); t = THREADS.get(id); };
  function wire() {
    const ti = $('#thTitle', body); ti.addEventListener('input', debounce(() => { const v = ti.value.trim(); save((x) => { x.title = v || 'Untitled thread'; }); }, 400));
    const no = $('#thNote', body); no.addEventListener('input', debounce(() => { save((x) => { x.note = no.value.slice(0, MARK_LIMITS.note); }); }, 400));
    const desc = () => { const d = $('#lkDesc', body); if (d) d.textContent = (ECHO_KINDS[$('#lkK', body).value] || {}).desc || ''; };
    const lk = $('#lkK', body); if (lk) { lk.addEventListener('change', desc); desc(); $('#lkGo', body).addEventListener('click', () => { const a = $('#lkA', body).value; const b = $('#lkB', body).value; if (a === b) { toast('Pick two different passages.', 'warn'); return; } save((x) => { threadLink(x, a, b, lk.value, $('#lkN', body).value); }); draw(); }); }
    $$('[data-unlink]', body).forEach((b) => b.addEventListener('click', () => { const l = t.links[+b.dataset.unlink]; if (l) { save((x) => { threadUnlink(x, l.a, l.b); }); draw(); } }));
    $$('.pcard2 [data-t]', body).forEach((b) => b.addEventListener('click', async () => {
      const iid = b.closest('.pcard2').dataset.item; const act = b.dataset.t;
      if (act === 'left' || act === 'right') { save((x) => { threadMove(x, iid, act === 'left' ? -1 : 1); }); draw(); }
      else if (act === 'del') { save((x) => { threadRemoveItem(x, iid); }); draw(); }
      else if (act === 'edit') {
        const it = t.items.find((x) => x.id === iid); if (!it) return;
        const r = await modal({ title: 'Edit this passage', html: `<label class="small t2" for="epL">Label</label><input class="input" id="epL" maxlength="${MARK_LIMITS.label}" value="${esc(it.label)}" style="width:100%"><label class="small t2" for="epN" style="display:block;margin-top:10px">Your note</label><textarea class="input" id="epN" rows="4" maxlength="${MARK_LIMITS.note}" style="width:100%">${esc(it.note)}</textarea>`, actions: [{ label: 'Cancel', kind: 'ghost', value: null }, { label: 'Save', kind: 'primary', collect: (back) => ({ label: $('#epL', back).value.trim(), note: $('#epN', back).value.trim() }) }] });
        if (r) { save((x) => { const y = x.items.find((z) => z.id === iid); if (y) { y.label = mkStr(r.label, MARK_LIMITS.label); y.note = mkStr(r.note, MARK_LIMITS.note); } }); draw(); }
      }
    }));
    $$('[data-sh]', body).forEach((b) => b.addEventListener('click', async () => {
      const a = b.dataset.sh; const out = $('#thOut', body);
      if (a === 'md') { download(t.title.replace(/[^\w]+/g, '-').toLowerCase() + '.md', threadMD(t), 'text/markdown'); return; }
      if (a === 'nb') { if (typeof NB !== 'undefined') { if (t.items.length < 1) toast('Add a passage first.', 'warn'); else await NB.addThread(t); } return; }
      if (a === 'del') { if (await confirmBox('Delete this passage set?', `<p>“${esc(t.title)}” and its relations will be deleted from this browser. Your highlights are not affected.</p>`, 'Delete', 'danger')) { THREADS.remove(id); location.hash = '#/path/threads'; } return; }
      if (t.items.length < 1) { toast('Add a passage first.', 'warn'); return; }
      try {
        const code = await buildPack('thread', sanitizeThread(threadForPack(t)), $('#thSign', body).checked); out.hidden = false;
        if (a === 'text') { out.value = packText(code); out.select(); await gcopy(out.value, 'Copied. Paste it into any message.'); }
        else if (a === 'link') { out.value = packLink(location.href, code); out.select(); await gcopy(out.value, 'Link copied. It opens in any copy of the Lamplighter Project.'); }
        else download(t.title.replace(/[^\w]+/g, '-').toLowerCase() + '.beatlab', packText(code), 'text/plain');
      } catch (e) { toast('Could not make the pack: ' + esc(e.message), 'bad'); }
    }));
  }
  draw();
}

/* ───────── curated parallels ───────── */
async function resolveParallel(P) {
  const spots = []; const ids = [...new Set(P.items.map((x) => x[0]))];      // each text is looked at and let go (TXT.scan, 6c-texts.js); what is kept of a passage is a copy of its own words, not a slice of the whole section
  await Promise.all(ids.map(async (tid) => { try { await TXT.scan(tid, (t) => { P.items.forEach(([id, find, , len], k) => { const r = id === tid ? resolveSpot(t.secs, find, len) : null; if (r) spots[k] = Object.assign({}, r, { q: srchOwnStr(r.q), heading: srchOwnStr(r.heading) }); }); }); } catch (e) { /* a text that cannot be read: its passages are left out */ } }));
  const items = []; const map = [];
  P.items.forEach(([tid, find, label], k) => {
    const r = spots[k]; if (!r) { map[k] = null; return; }
    const id = 'i' + items.length; map[k] = id; items.push({ id, tid, s: r.s, p: r.p, a: r.a, b: r.b, q: r.q, label, note: '', sh: r.heading });
  });
  const links = P.links.map(([a, b, kind, note]) => (map[a - 1] && map[b - 1] ? { a: map[a - 1], b: map[b - 1], kind, note } : null)).filter(Boolean);
  return { thread: { id: P.id, title: P.title, note: P.blurb, items, links, t: Date.now(), u: Date.now() }, missing: P.items.length - items.length };
}
function pathParallelsView(root, query) {
  const body = root.querySelector('#pbody'); const P = PARALLELS.find((x) => x.id === query.p);
  if (!P) {
    const themes = [...new Set(PARALLELS.map((x) => x.theme))];
    body.innerHTML = `<p class="t2 small" style="max-width:74ch">${PARALLELS.length} sets of passages that people have long read side by side, from the flood stories to the Lord’s Prayer. Each opens the passages together, in English, with a note on how the evidence says they relate. They are starting points: save one as a passage set and add your own.</p>
      ${themes.map((th) => `<h2 style="margin:20px 0 8px;font-size:18px">${esc(th)}</h2><div class="grid c2">${PARALLELS.filter((x) => x.theme === th).map((x) => `<a class="card flat thcard" href="#/path/parallels?p=${x.id}"><b>${esc(x.title)}</b><div class="small t2">${esc(x.blurb)}</div><div class="small muted" style="margin-top:6px">${x.items.length} passages · ${[...new Set(x.items.map((i) => tradName(i[0])))].slice(0, 3).map(esc).join(' · ')}</div></a>`).join('')}</div>`).join('')}`;
    return;
  }
  body.innerHTML = `<div class="small" style="margin-bottom:10px"><a href="#/path/parallels">← Parallel passages</a> · ${esc(P.theme)}</div><section class="card glow"><h2 style="font-size:24px;margin:0 0 6px">${esc(P.title)}</h2><p class="t2" style="max-width:72ch">${esc(P.blurb)}</p><p class="small t2" id="paState">Finding the passages…</p></section><div id="paBody"></div>`;
  resolveParallel(P).then(({ thread, missing }) => {
    if (root.isConnected === false) return; const cols = query.cols || '';
    if (!thread.items.length) { $('#paState', body).textContent = loadFailText('These texts were not found. Full texts live in a texts folder next to Lamplighter.html.'); return; }
    $('#paState', body).innerHTML = `<span class="row" style="gap:14px"><span>${thread.items.length} passage${thread.items.length === 1 ? '' : 's'}${missing ? ` (${missing} could not be found in your copy of the texts)` : ''}</span>${colsPicker(cols, '#/path/parallels?p=' + P.id)}<button class="btn sm primary" id="paSave" type="button">${icon('threads')}Save as my passage set</button></span>`;
    $('#paBody', body).innerHTML = `<div style="margin-top:14px">${compareHTML(thread, { cols })}</div><p class="hint" style="margin-top:12px">The notes on each relation summarise common scholarly views and are kept deliberately cautious. They are not a substitute for the scholarship itself: follow “Read in context” and the Shared ideas page.</p>`;
    $('#paSave', body).addEventListener('click', () => { const t = Object.assign({}, thread, { id: uid(), t: Date.now(), u: Date.now() }); THREADS.add(t); toast(`Saved as “${esc(t.title)}”. <a href="#/path/thread/${t.id}">Open it →</a>`, 'good', 5200); });
  });
}
