/* ═══════════════════════════ 6h · Gather: worship and study without a centre ═══════════════════════════
   Services (an order of worship you build or borrow), study circles (one Journey station a week, kept in step by the calendar),
   an observance calendar, and the sharing tools that make it all work with no server: packs, links, files, signatures.
   Everything is stored in this browser. Nothing is sent anywhere unless you copy it out yourself. */
const GATHER_TABS = [['home', 'Home'], ['services', 'Services'], ['circles', 'Circles'], ['calendar', 'Calendar'], ['share', 'Share and keys']];
const GStore = {
  services: () => store.get('gather.services', []), setServices(a) { store.set('gather.services', a); },
  circles: () => store.get('gather.circles', []), setCircles(a) { store.set('gather.circles', a); },
  board: () => store.get('gather.board', {}), setBoard(b) { store.set('gather.board', b); },
  me: () => store.get('gather.me', { name: '', pub: null, priv: null }), setMe(m) { store.set('gather.me', m); },
  known: () => store.get('gather.known', {}), setKnown(k) { store.set('gather.known', k); },
};
const gcopy = async (text, okMsg = 'Copied.') => { try { await navigator.clipboard.writeText(text); toast(okMsg, 'good'); return true; } catch (e) { toast('Could not copy here. Select the text and copy it yourself.', 'warn'); return false; } };
const gmins = (sec) => Math.round(sec / 6) / 10;
const gdate = (d, o = { weekday: 'long', month: 'long', day: 'numeric' }) => d.toLocaleDateString(undefined, o);
async function myIdentity(create) {
  const me = GStore.me(); if (me.pub && me.priv) return me;
  if (!create) return null; const id = await newIdentity(); const m = Object.assign(me, id); GStore.setMe(m); return m;
}
async function buildPack(kind, body, sign) {
  let identity = null; const me = GStore.me(); if (sign) identity = await myIdentity(true);
  return makePack(kind, body, { identity, by: sign ? (GStore.me().name || '') : '' });
}
const clipText = (t, max = 2400) => { if (t.length <= max) return t; const cut = t.slice(0, max); const p = cut.lastIndexOf('\n\n'); const s = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('? '), cut.lastIndexOf('! ')); const at = p > max * 0.5 ? p : s > max * 0.5 ? s + 1 : max; return t.slice(0, at).trim() + ' …'; };

/* choose a reading from the Library: a named book, a collection, or anything */
async function pickReadingFor(pick = {}, target = 700) {
  const meta = await TXT.index(); if (!meta) return { text: 'Choose a reading from the Library. ' + loadFailText('The texts folder was not found next to Lamplighter.html.'), title: 'A reading', source: '' };
  if (pick.parallel) { // a fixed passage from a curated parallel (the same words every time)
    const P = PARALLELS.find((x) => x.id === pick.parallel); const it = P && P.items[pick.item || 0];
    if (it && meta[it[0]]) { const r = await TXT.scan(it[0], (t) => { const s = resolveSpot(t.secs, it[1], it[3]); return s ? { q: srchOwnStr(s.q), heading: srchOwnStr(s.heading), si: s.s, by: srchOwnStr((t.meta && t.meta.by) || '') } : null; }); if (r) return { text: clipText(r.q), title: it[2], source: `${titleOf(it[0])}, ${r.heading}. ${r.by}`.trim(), ref: { id: it[0], si: r.si } }; }
  }
  let pool = LIB.filter((l) => meta[l.id]);
  if (pick.id) pool = pool.filter((l) => l.id === pick.id);
  else if (pick.collection) { const c = LIB_COLLECTIONS.find((x) => x[0] === pick.collection); if (c) pool = pool.filter((l) => c[2].includes(l.group)); }
  if (!pool.length) pool = LIB.filter((l) => meta[l.id]);
  for (let tries = 0; tries < 8; tries++) {
    const groups = [...new Set(pool.map((l) => l.group))]; const g = groups[Math.floor(psgRand() * groups.length)]; const bs = pool.filter((l) => l.group === g); const l = pick.id ? pool[0] : bs[Math.floor(psgRand() * bs.length)];
    const got = await TXT.scan(l.id, (t) => {      // the text is looked at and let go (TXT.scan, 6c-texts.js); what is kept is a copy of the passage's own words
      let si = 0; let text = '';
      if (pick.id === 'b-psa') { const ok = t.secs.map((s, i) => [i, s[1].length]).filter(([, n]) => n > 250 && n < 2300); si = ok[Math.floor(psgRand() * ok.length)][0]; text = t.secs[si][1]; }
      else if (pick.id && t.secs[0][1].length < 3500) text = t.secs[0][1];
      else { const p = pickPassage(t.secs, t.meta, psgRand, { target }); if (!p) return null; si = p.si; text = p.text; }
      return { text: srchOwnStr(clipText(text)), heading: srchOwnStr(t.secs[si][0]), by: srchOwnStr((t.meta && t.meta.by) || ''), si };
    });
    if (!got) continue;
    return { text: got.text, title: l.title, source: `${l.title}, ${got.heading}. ${got.by}`.trim(), ref: { id: l.id, si: got.si } };
  }
  return { text: 'Choose a reading from the Library.', title: 'A reading', source: '' };
}
async function serviceFromTemplate(tid) {
  const tpl = SERVICE_TEMPLATES.find((t) => t.id === tid); const steps = [];
  for (const s of tpl.steps) { const o = Object.assign({}, s); if (s.pick) { delete o.pick; const r = await pickReadingFor(s.pick); o.text = r.text; o.source = r.source; if (r.ref) o.ref = r.ref; if (!o.title) o.title = r.title; } steps.push(o); }
  return sanitizeService({ title: tpl.name, note: tpl.form, steps, tpl: tpl.id });
}
const gUpsert = (list, item) => { const i = list.findIndex((x) => x.id === item.id); if (i >= 0) list[i] = item; else list.unshift(item); return list; };
const gService = (id) => GStore.services().find((s) => s.id === id);
const gCircle = (id) => GStore.circles().find((c) => c.id === id);
const trustLine = (r) => {
  if (r.verified) { const k = GStore.known()[r.fp]; return `<span class="badge good" title="Signed with the key ${esc(r.fp)}">✓ signed ${esc(r.fp)}</span> <span class="small muted">${k ? `you have seen this key before as “${esc(k)}”` : 'a key you have not seen before'}</span>`; }
  return `<span class="badge warn">${r.reason === 'altered' ? 'changed after signing' : 'not signed'}</span> <span class="small muted">${r.reason === 'altered' ? 'do not trust this' : 'anyone could have written this; trust it as much as the person who sent it'}</span>`;
};

/* ───────── views ───────── */
function gatherHome(body) {
  const today = isoDay(); const soon = observances(today, calAdd(today, 30), YEAR_WHEEL).slice(0, 6); const circles = GStore.circles(); const svcs = GStore.services().slice(0, 6);
  body.innerHTML = `<section class="card glow fade-in"><div class="eyebrow">No accounts · no server · nothing leaves your browser unless you send it</div><h2 style="font-size:26px;margin:6px 0">A place to worship and study without a centre</h2>
    <p class="t2" style="max-width:72ch">Build an order of worship, or borrow one: a meeting in silence, a psalm and stillness, a sit with kindness, readings from three traditions. Start a study circle that walks the Journey one station a week. Then <b>send it by any means you like</b>: a link, a message, a file, a printout. A shared start time puts everyone, wherever they are, at the same step at the same moment. A key that lives only in your browser signs what you send, so a group can tell who wrote what and that nobody changed it.</p>
    <div class="row" style="margin-top:14px"><button class="btn primary lg" data-g="quick" data-tpl="silent">${icon('lotus')}Sit in silence now (20 min)</button><button class="btn lg" data-g="quick" data-tpl="morning">A morning rhythm (10 min)</button><a class="btn lg ghost" href="#/gather/services">Make a service</a><a class="btn lg ghost" href="#/gather/circles">Start a circle</a></div></section>
    <div class="grid c2" style="margin-top:16px"><section class="card fade-in"><div class="card-title"><h3>${icon('clock')}Coming up</h3><a class="small" href="#/gather/calendar">Full calendar →</a></div><ul class="plain">${soon.map((o) => `<li><b>${esc(o.name)}</b> <span class="muted small">· ${esc(gdate(new Date(o.date + 'T12:00:00')))}${o.eve ? ' (from sunset the evening before)' : ''}</span><div class="small t2">${esc(o.trad)}</div></li>`).join('') || '<li class="t2">Nothing in the next month.</li>'}</ul></section>
      <section class="card fade-in"><div class="card-title"><h3>${icon('heart')}Your circles</h3><a class="small" href="#/gather/circles">All circles →</a></div>${circles.length ? `<ul class="plain">${circles.map((c) => { const w = circleWeekNow(c); const wk = Math.min(Math.max(w, 0), c.weeks - 1); const st = circleStation(c, wk); return `<li><a href="#/gather/circle/${c.id}"><b>${esc(c.name)}</b></a><div class="small t2">${w < 0 ? `Starts ${esc(gdate(circleMeetingDay(c, 0)))}` : w >= c.weeks ? 'Finished: all ' + c.weeks + ' weeks' : `Week ${w + 1} of ${c.weeks}: ${esc(st.title)}`}</div></li>`; }).join('')}</ul>` : '<p class="t2 small">None yet. A circle is a few people reading the same station each week, in the same order, wherever they are.</p>'}</section></div>
    <section class="card fade-in" style="margin-top:16px"><div class="card-title"><h3>${icon('learn')}Your services</h3><a class="small" href="#/gather/services">Templates and all services →</a></div>${svcs.length ? `<ul class="plain">${svcs.map((s) => `<li><a href="#/gather/service/${s.id}"><b>${esc(s.title)}</b></a> <span class="muted small">· ${Math.round(serviceSeconds(s) / 60)} min${s.startAt ? ' · ' + esc(new Date(s.startAt).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })) : ''}</span></li>`).join('')}</ul>` : '<p class="t2 small">Nothing saved yet. Start from a template.</p>'}</section>
    <section class="card flat fade-in" style="margin-top:16px"><div class="card-title"><h3>${icon('shield')}How this stays decentralised</h3></div><ul class="plain small t2"><li>Your gatherings live in this browser. There is no account to make and nobody to ask.</li><li>A pack is plain text or a file. Anyone can open one by pasting it into <a href="#/gather/share">Share and keys</a>; if you host your own copy of Lamplighter.html, a link works too.</li><li>Everything that arrives is checked and cleaned before it is shown, and only ever displayed as text.</li><li>Traditions belong to their communities. These forms are borrowed with their names attached; where a rite is closed to outsiders, the Lamplighter Project does not reproduce it.</li></ul></section>`;
}

function gatherServices(body) {
  const mine = GStore.services();
  body.innerHTML = `<p class="t2 small" style="max-width:72ch">A service is an order of worship: parts with times, run on one screen with bells. Start from a form below, change anything, and share it. These are forms, not claims to belong to a tradition: each says whose shape it borrows.</p>
    <div class="grid auto-lg">${SERVICE_TEMPLATES.map((t) => `<article class="card pcard fade-in" data-g="newtpl" data-tpl="${t.id}" tabindex="0" role="button"><div class="top"><h3>${esc(t.name)}</h3><span class="tag">${t.mins} min</span></div><div class="blurb">${esc(t.form)}</div><div class="foot"><span class="small muted">${t.steps.length} parts</span><span class="btn sm primary">Use this</span></div></article>`).join('')}
      <article class="card pcard fade-in" data-g="newtpl" data-tpl="" tabindex="0" role="button"><div class="top"><h3>Start from nothing</h3></div><div class="blurb">An empty order of worship. Add a welcome, a silence, a reading, your own words.</div><div class="foot"><span></span><span class="btn sm">Begin</span></div></article></div>
    <h2 style="margin:26px 0 10px">Your services <span class="tag">${mine.length}</span></h2>${mine.length ? `<div class="stack sm">${mine.map((s) => `<a class="card flat" href="#/gather/service/${s.id}" style="display:block"><div class="spread"><b>${esc(s.title)}</b><span class="muted small">${Math.round(serviceSeconds(s) / 60)} min · ${s.steps.length} parts${s.startAt ? ' · scheduled' : ''}</span></div>${s.note ? `<div class="small t2">${esc(s.note)}</div>` : ''}</a>`).join('')}</div>` : '<p class="t2">None yet.</p>'}`;
}

function stepEditorHTML(s, i, n) {
  const T = STEP_TYPES[s.t];
  return `<div class="card flat svc-edit" data-step="${i}"><div class="spread" style="gap:10px;flex-wrap:wrap"><div class="row tight"><span class="tag">${i + 1}</span><select class="select" data-f="t" aria-label="Kind of part" style="width:auto">${Object.entries(STEP_TYPES).map(([k, v]) => `<option value="${k}"${k === s.t ? ' selected' : ''}>${v.label}</option>`).join('')}</select><label class="small t2">minutes <input class="input num" data-f="min" type="number" min="0.2" max="120" step="0.5" value="${gmins(stepSec(s))}" style="width:76px" aria-label="Minutes"></label></div>
    <div class="row tight"><button class="btn sm ghost" data-g="up" ${i === 0 ? 'disabled' : ''} aria-label="Move up">↑</button><button class="btn sm ghost" data-g="down" ${i === n - 1 ? 'disabled' : ''} aria-label="Move down">↓</button><button class="btn sm ghost" data-g="del" aria-label="Remove this part">${icon('trash')}</button></div></div>
    <div class="small muted" style="margin:6px 0">${esc(T.hint)}</div>
    ${s.t === 'silence' || s.t === 'breath' ? '' : `<input class="input" data-f="title" placeholder="Heading (optional)" value="${esc(s.title || '')}" style="margin-bottom:8px">`}
    <textarea class="textarea" data-f="text" placeholder="${s.t === 'reading' ? 'The words to read aloud' : s.t === 'reflect' ? 'An opening line (optional)' : 'The words'}" style="min-height:${s.t === 'reading' ? 150 : 84}px">${esc(s.text || '')}</textarea>
    ${s.t === 'reflect' ? `<textarea class="textarea" data-f="questions" placeholder="One question per line" style="min-height:84px;margin-top:8px">${esc((s.questions || []).join('\n'))}</textarea>` : ''}
    ${s.t === 'reading' ? `<div class="small muted" style="margin-top:6px">Numbers in double brackets, like [[3]], show as verse numbers.</div><input class="input" data-f="source" placeholder="Where it is from" value="${esc(s.source || '')}" style="margin-top:8px"><div class="row" style="margin-top:8px"><button class="btn sm" data-g="rand" type="button">${icon('dice')}Random reading</button><button class="btn sm" data-g="choose" type="button">Choose from the Library…</button>${s.ref ? `<a class="btn sm ghost" href="#/path/read/${esc(s.ref.id)}?s=${s.ref.si}">Open in the reader</a>` : ''}</div><div class="gpick" hidden></div>` : ''}</div>`;
}
const gSelectOptions = (meta) => LIB_COLLECTIONS.map(([n, , gs]) => { const books = LIB.filter((l) => gs.includes(l.group) && meta[l.id]); return books.length ? `<optgroup label="${esc(n)}">${books.map((l) => `<option value="${l.id}">${esc(l.title)}</option>`).join('')}</optgroup>` : ''; }).join('');

async function gatherNew(body, parts, query) {
  body.innerHTML = '<p class="t2">Preparing your order of worship…</p>';
  const svc = query.tpl ? await serviceFromTemplate(query.tpl) : sanitizeService({ title: 'A new gathering', steps: [{ t: 'welcome', text: 'Welcome.' }, { t: 'silence', sec: 600 }, { t: 'bless', text: 'Go well.' }] });
  svc.id = gNewId(); GStore.setServices(gUpsert(GStore.services(), svc)); location.hash = `#/gather/service/${svc.id}?edit=1`;
}

function gatherService(body, parts, query) {
  const svc = gService(parts[1]); if (!svc) { body.innerHTML = '<div class="card"><p>No such service. <a href="#/gather/services">Back to services</a></p></div>'; return; }
  const edit = query.edit === '1';
  const when = svc.startAt ? new Date(svc.startAt) : null; const live = when && Date.now() < when.getTime() + serviceSeconds(svc) * 1000;
  const toLocal = (ms) => { const d = new Date(ms); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); };
  body.innerHTML = `<div class="small" style="margin-bottom:10px"><a href="#/gather/services">← Services</a></div>
    <section class="card glow fade-in"><div class="spread" style="align-items:flex-start;gap:12px;flex-wrap:wrap"><div><div class="eyebrow">${Math.round(serviceSeconds(svc) / 60)} minutes · ${svc.steps.length} parts</div>${edit ? `<input class="input" data-f="stitle" value="${esc(svc.title)}" aria-label="Title" style="font-size:22px;margin:6px 0">` : `<h2 style="font-size:26px;margin:6px 0">${esc(svc.title)}</h2>`}${edit ? `<input class="input" data-f="snote" value="${esc(svc.note)}" placeholder="A line about this gathering" aria-label="Note">` : svc.note ? `<p class="t2">${esc(svc.note)}</p>` : ''}</div>
      <div class="row">${edit ? '<a class="btn primary" href="#/gather/service/' + svc.id + '">Done editing</a>' : `<button class="btn primary lg" data-g="run" type="button">${icon('play')}${live && when && when.getTime() > Date.now() ? 'Join at the start time' : when && live ? 'Join, in progress' : 'Begin'}</button><a class="btn" href="#/gather/service/${svc.id}?edit=1">Edit</a>`}</div></div></section>
    ${edit ? `<div id="steps" class="stack sm" style="margin-top:16px">${svc.steps.map((s, i) => stepEditorHTML(s, i, svc.steps.length)).join('')}</div><div class="row" style="margin-top:12px"><select class="select" id="addKind" style="width:auto" aria-label="Kind of part to add">${Object.entries(STEP_TYPES).map(([k, v]) => `<option value="${k}">${v.label}</option>`).join('')}</select><button class="btn" data-g="add" type="button">${icon('plus')}Add a part</button></div>`
      : `<section class="card fade-in" style="margin-top:16px"><div class="card-title"><h3>Order of service</h3><button class="btn sm ghost no-print" data-g="print" type="button">Print</button></div><ol class="svc-order">${serviceTimeline(svc).map((x) => `<li><span class="mono muted">${fmtClock(x.start)}</span><div><b>${STEP_TYPES[x.step.t].label}${x.step.title && x.step.t !== 'reading' ? ': ' + esc(x.step.title) : x.step.title ? ': ' + esc(x.step.title) : ''}</b> <span class="muted small">· ${gmins(x.dur)} min</span>${x.step.text ? `<div class="small t2 svc-pre">${esc(clipText(x.step.text.replace(/\[\[\d+\]\]/g, ''), 420))}</div>` : ''}${(x.step.questions || []).length ? `<ul class="plain small t2">${x.step.questions.map((q) => `<li>${esc(q)}</li>`).join('')}</ul>` : ''}${x.step.source ? `<div class="small muted">${esc(x.step.source)}</div>` : ''}</div></li>`).join('')}</ol></section>`}
    <section class="card fade-in no-print" style="margin-top:16px"><div class="card-title"><h3>${icon('link')}Share this gathering</h3></div>
      <p class="t2 small" style="max-width:70ch">Send it by any means you like. Whoever receives it opens it in the Lamplighter Project (Share and keys → Open a pack) and can run it, change it and pass it on. Nothing goes through us.</p>
      <div class="row"><label class="small t2">Everyone starts together at <input class="input" id="startAt" type="datetime-local" value="${svc.startAt ? toLocal(svc.startAt) : ''}" style="width:auto"></label><button class="btn sm ghost" data-g="clearstart" type="button">Clear</button><span class="small muted">Optional. With a start time, every device follows the same clock.</span></div>
      <div class="row" style="margin-top:10px"><label class="chk"><input type="checkbox" id="gSign" checked><span class="small">Sign with my key${GStore.me().pub ? '' : ' (one will be made, in this browser only)'}</span></label></div>
      <div class="row" style="margin-top:10px"><button class="btn primary" data-g="sharetext" type="button">Copy as text</button><button class="btn" data-g="sharelink" type="button">Copy a link</button><button class="btn" data-g="sharefile" type="button">${icon('download')}Save a file</button><button class="btn ghost" data-g="ics" type="button">Add to my calendar</button></div>
      <textarea class="textarea" id="packOut" readonly hidden style="margin-top:10px;min-height:90px;font-family:var(--mono);font-size:12px" aria-label="The pack, to copy"></textarea>
      <p class="hint" style="margin-top:8px">A link only works for people who can reach your copy of Lamplighter.html (for example if you host it). Otherwise send the text or the file.</p></section>
    <div class="row no-print" style="margin-top:14px"><button class="btn ghost" data-g="dup" type="button">Make a copy</button><button class="btn ghost" data-g="delete" type="button">${icon('trash')}Delete</button></div>`;
}

function gatherCircles(body) {
  const circles = GStore.circles(); const day = isoDay(); const stationOpts = ERAS.slice(0, -1).map((e) => `<optgroup label="${esc(e.name)} · ${esc(e.span)}">${PATH_STATIONS.filter((s) => s.era === e.id).map((s) => `<option value="${s.id}">${stNum(s)}. ${esc(s.title)}</option>`).join('')}</optgroup>`).join('');
  body.innerHTML = `<p class="t2 small" style="max-width:72ch">A circle is a few people reading the same station each week, in the same order, wherever they are. The calendar keeps everyone in step: week 1 starts on the date you choose, and each week brings the next station with a meeting guide you can run or print. No one needs an account. Reflections are shared as signed notes people send each other.</p>
    ${circles.length ? `<div class="stack sm" style="margin-bottom:18px">${circles.map((c) => { const w = circleWeekNow(c); return `<a class="card flat" href="#/gather/circle/${c.id}" style="display:block"><div class="spread"><b>${esc(c.name)}</b><span class="muted small">${w < 0 ? 'starts ' + esc(gdate(circleMeetingDay(c, 0), { month: 'short', day: 'numeric' })) : w >= c.weeks ? 'finished' : `week ${w + 1} of ${c.weeks}`}</span></div><div class="small t2">${esc(c.purpose || '')}</div></a>`; }).join('')}</div>` : ''}
    <section class="card fade-in"><div class="card-title"><h3>${icon('plus')}Start a circle</h3></div>
      <div class="grid c2"><label class="small t2">Name<input class="input" id="cName" placeholder="Thursday evening group" maxlength="80"></label><label class="small t2">Week 1 begins<input class="input" id="cDay" type="date" value="${day}"></label>
        <label class="small t2">First station<select class="select" id="cFrom">${stationOpts}</select></label><label class="small t2">Weeks<input class="input" id="cWeeks" type="number" min="1" max="${PATH_STATIONS.length}" value="12"></label>
        <label class="small t2">Meeting length (minutes)<input class="input" id="cMins" type="number" min="20" max="180" step="5" value="60"></label><label class="small t2">Why you meet (shown to everyone)<input class="input" id="cPurpose" maxlength="500" placeholder="To read slowly and honestly, together."></label></div>
      <label class="small t2" style="display:block;margin-top:10px">Your own questions for every week (one per line, optional)<textarea class="textarea" id="cExtra" style="min-height:70px"></textarea></label>
      <div class="row" style="margin-top:12px"><button class="btn primary" data-g="mkcircle" type="button">Create the circle</button><a class="btn ghost" href="#/gather/share">I was sent a circle</a></div></section>`;
}

function gatherCircle(body, parts, query) {
  const c = gCircle(parts[1]); if (!c) { body.innerHTML = '<div class="card"><p>No such circle. <a href="#/gather/circles">Back to circles</a></p></div>'; return; }
  const now = circleWeekNow(c); const week = Math.min(c.weeks - 1, Math.max(0, query.week != null ? +query.week || 0 : now)); const st = circleStation(c, week); const day = circleMeetingDay(c, week);
  const board = (GStore.board()[c.id] || []).filter((r) => r.week === week).sort((a, b) => a.t - b.t); const me = GStore.me();
  body.innerHTML = `<div class="small" style="margin-bottom:10px"><a href="#/gather/circles">← Circles</a></div>
    <section class="card glow fade-in"><div class="eyebrow">${now < 0 ? 'Starts ' + esc(gdate(circleMeetingDay(c, 0))) : now >= c.weeks ? 'Finished: ' + c.weeks + ' weeks' : `Week ${now + 1} of ${c.weeks}`} · ${c.mins} minute meetings${c.host ? ' · hosted by ' + esc(c.host) : ''}</div><h2 style="font-size:26px;margin:6px 0">${esc(c.name)}</h2>${c.purpose ? `<p class="t2">${esc(c.purpose)}</p>` : ''}
      <div class="row" style="margin-top:10px"><button class="btn" data-g="sharecircle" type="button">Invite someone: copy the circle</button><button class="btn ghost" data-g="delcircle" type="button">${icon('trash')}Delete</button></div><textarea class="textarea" id="packOut" readonly hidden style="margin-top:10px;min-height:80px;font-family:var(--mono);font-size:12px" aria-label="The pack, to copy"></textarea></section>
    <section class="card fade-in" style="margin-top:16px"><div class="card-title"><h3>${icon('path')}Week ${week + 1}: ${esc(st.title)}</h3><span class="tag">${esc(gdate(day, { month: 'short', day: 'numeric' }))}</span></div>
      <p>${esc(st.blurb)}</p><div class="small muted">${esc(st.when)}</div>
      <div class="row" style="margin-top:12px"><button class="btn primary lg" data-g="runweek" data-week="${week}" type="button">${icon('play')}Run this week’s meeting</button><button class="btn" data-g="saveweek" data-week="${week}" type="button">Save the guide as a service</button><a class="btn ghost" href="#/path/station/${st.id}">The station</a>${st.read[0] ? `<a class="btn ghost" href="#/path/read/${st.read[0]}">Read</a>` : ''}</div>
      <div class="row tight" style="margin-top:12px">${week > 0 ? `<a class="btn sm ghost" href="#/gather/circle/${c.id}?week=${week - 1}">← Week ${week}</a>` : ''}${week < c.weeks - 1 ? `<a class="btn sm ghost" href="#/gather/circle/${c.id}?week=${week + 1}">Week ${week + 2} →</a>` : ''}</div></section>
    <section class="card fade-in" style="margin-top:16px"><div class="card-title"><h3>${icon('journal')}Reflections for week ${week + 1}</h3></div>
      <p class="t2 small" style="max-width:70ch">Write what stayed with you. Keep it to yourself, or make a signed note to send the group by any channel. Others’ notes come back the same way and appear here, each marked with who signed it.</p>
      <textarea class="textarea" id="rText" placeholder="What stayed with you this week?" style="min-height:110px"></textarea>
      <div class="row" style="margin-top:8px"><label class="small t2">Your name<input class="input" id="rWho" value="${esc(me.name || '')}" maxlength="40" style="width:200px;margin-left:6px"></label><button class="btn primary" data-g="reflect" data-week="${week}" type="button">Save and make a note to share</button></div>
      <textarea class="textarea" id="packOut2" readonly hidden style="margin-top:10px;min-height:80px;font-family:var(--mono);font-size:12px" aria-label="The signed note, to copy"></textarea>
      <div class="eyebrow" style="margin:18px 0 6px">Add a note someone sent you</div><div class="row"><input class="input" id="rPaste" placeholder="Paste the code of a note someone sent you" style="flex:1;min-width:220px"><button class="btn" data-g="addreflection" type="button">Add</button></div>
      <div class="stack sm" style="margin-top:14px">${board.length ? board.map((r) => `<article class="card flat"><div class="spread" style="gap:8px;flex-wrap:wrap"><b>${esc(r.who)}</b><span>${r.mine ? '<span class="badge">yours</span>' : r.fp ? `<span class="badge good">✓ ${esc(r.fp)}</span>` : '<span class="badge warn">not signed</span>'} <button class="btn sm ghost" data-g="delrefl" data-rid="${esc(r.id)}" aria-label="Remove this note" type="button">${icon('x')}</button></span></div><div class="svc-pre">${esc(r.text)}</div></article>`).join('') : '<p class="t2 small">No notes for this week yet.</p>'}</div></section>
    <section class="card flat fade-in" style="margin-top:16px"><div class="card-title"><h3>All ${c.weeks} weeks</h3></div><ol class="svc-order">${Array.from({ length: c.weeks }, (_, i) => { const s = circleStation(c, i); return `<li><span class="mono muted">${esc(gdate(circleMeetingDay(c, i), { month: 'short', day: 'numeric' }))}</span><div><a href="#/gather/circle/${c.id}?week=${i}">${i === now ? '<b>' : ''}${i + 1}. ${esc(s.title)}${i === now ? '</b>' : ''}</a> <span class="muted small">· ${esc(s.when)}</span></div></li>`; }).join('')}</ol></section>`;
}

function gatherCalendar(body, parts, query) {
  const from = isoDay(); const to = calAdd(from, 460); const f = query.t || '';
  const all = observances(from, to, YEAR_WHEEL); const list = all.filter((o) => !f || o.trad.includes(f) || o.trad === 'Many');
  let lastMonth = ''; const rows = list.map((o) => { const d = new Date(o.date + 'T12:00:00'); const m = d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }); const head = m !== lastMonth ? `<h3 class="tl-era" style="margin-top:22px">${esc(m)}</h3>` : ''; lastMonth = m;
    return `${head}<div class="card tight flat yrow"><div class="when"><b>${esc(d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' }))}</b>${o.eve ? '<span class="muted small">from sunset before</span>' : ''}</div><div><b>${esc(o.name)}</b> <span class="tag">${esc(o.trad)}</span>${o.approx ? ' <span class="tag" title="Calculated; the moon-sighted date can differ by a day or two">approx.</span>' : ''}<div class="small t2">${esc(o.note)}</div><div class="row tight" style="margin-top:6px"><button class="btn sm" data-g="calgather" data-name="${esc(o.name)}" data-note="${esc(o.note)}" type="button">Hold a gathering</button><button class="btn sm ghost" data-g="calics" data-date="${o.date}" data-name="${esc(o.name)}" data-note="${esc(o.note)}" type="button">Add to my calendar</button></div></div></div>`; }).join('');
  const filters = [['', 'All'], ['Christian', 'Christian'], ['Jewish', 'Jewish'], ['Muslim', 'Muslim'], ['Buddhist', 'Buddhist'], ['Hindu', 'Hindu'], ['Sikh', 'Sikh'], ['Chinese', 'Chinese'], ['Celtic', 'Celtic and pagan'], ['Persian', 'Persian']];
  body.innerHTML = `<p class="t2 small" style="max-width:74ch">The next fifteen months of holy days from many traditions, worked out in your browser. Jewish and Islamic days begin at sunset the evening before. The Islamic dates are calculated and can differ from the moon-sighted date by a day or two, so confirm with your community. Orthodox Easter follows the Julian calculation. Lunar New Year is listed to 2040. Other lunar festivals (Vesak, Diwali, Guru Nanak’s birthday) are not listed because they depend on local moon-based calendars; ask your community.</p>
    <div class="row tight" style="margin:12px 0">${filters.map(([k, n]) => `<a class="chip" href="#/gather/calendar${k ? '?t=' + k : ''}" aria-pressed="${f === k}">${n}</a>`).join('')}</div>${rows || '<p class="t2">Nothing matches.</p>'}
    <p class="onward"><a href="#/atlas/calendars">Calendars: how each tradition counts the year, for any year →</a></p>`;      /* SA-16: the list of the next fifteen months ends with one way on, to the calendars of any year (Timeline → Calendars) */
}

function gatherShare(body) {
  const me = GStore.me();
  body.innerHTML = `<section class="card glow fade-in"><div class="card-title"><h3>${icon('download')}Open a pack</h3></div><p class="t2 small" style="max-width:70ch">Someone sent you a service, a circle or a note? Paste what they sent (a block of code, which can sit inside a message, or a link) or choose the file.</p>
      <textarea class="textarea" id="openText" placeholder="Paste here…" style="min-height:90px"></textarea><div class="row" style="margin-top:8px"><button class="btn primary" data-g="openpaste" type="button">Open</button><label class="btn" style="cursor:pointer">Choose a file…<input id="openFile" type="file" accept=".beatlab,.txt,.json,text/plain" hidden></label></div></section>
    <section class="card fade-in" style="margin-top:16px"><div class="card-title"><h3>${icon('lock')}Your key</h3></div><p class="t2 small" style="max-width:70ch">A key made and kept in this browser lets you sign what you send. Others see your <b>fingerprint</b>, a short code, beside your name. The first time you meet in person or on a call, read your fingerprint aloud; after that, a note with the same fingerprint is the same person, and a changed note will not verify. Nobody else holds your key. If you clear this browser’s data without a backup, you will need a new one.</p>
      <div class="row"><label class="small t2">Name shown on what you send<input class="input" id="meName" value="${esc(me.name || '')}" maxlength="40" style="width:220px;margin-left:6px"></label><button class="btn" data-g="savename" type="button">Save</button></div>
      <div style="margin:12px 0" id="fpBox">${me.pub ? 'Fingerprint: <span class="mono" id="myFp">…</span>' : '<span class="t2 small">No key yet. One is made the first time you sign something, or here:</span>'}</div>
      <div class="row">${me.pub ? '<button class="btn" data-g="copyfp" type="button">Copy fingerprint</button><button class="btn ghost" data-g="newkey" type="button">Replace my key</button>' : '<button class="btn primary" data-g="makekey" type="button">Make a key</button>'}</div></section>
    <section class="card fade-in" style="margin-top:16px"><div class="card-title"><h3>${icon('shield')}Back up your gatherings</h3></div><p class="t2 small" style="max-width:70ch">Services, circles and notes, as one file. Include your key only if you will keep the file private: anyone with it can sign as you.</p>
      <div class="row"><label class="chk"><input type="checkbox" id="bkKey"><span class="small">Include my key</span></label><button class="btn" data-g="backup" type="button">${icon('download')}Save a backup</button><label class="btn" style="cursor:pointer">Restore from a backup…<input id="restoreFile" type="file" accept=".json,application/json" hidden></label></div></section>`;
  if (me.pub) keyFingerprint(me.pub).then((fp) => { const e = body.querySelector('#myFp'); if (e) e.textContent = fp; });
}

async function gatherOpen(body, parts, query) {
  const code = query.p || query.code; body.innerHTML = '<p class="t2">Opening…</p>';
  let r; try { r = await openPack(code); } catch (e) { body.innerHTML = `<section class="card"><div class="callout warn">${icon('warn')}<div>${esc(e.message || 'That pack could not be opened.')} <a href="#/gather/share">Try again</a></div></div></section>`; return; }
  const b = r.body; globalThis.__pack = { r, code };
  const known = r.verified ? GStore.known()[r.fp] : null;
  let detail = '';
  if (r.kind === 'service') detail = `<h2 style="font-size:24px;margin:6px 0">${esc(b.title)}</h2><p class="t2">${esc(b.note)}</p><p class="small muted">${Math.round(serviceSeconds(b) / 60)} minutes, ${b.steps.length} parts${b.startAt ? ', with a shared start time ' + esc(new Date(b.startAt).toLocaleString()) : ''}</p><ol class="svc-order">${serviceTimeline(b).map((x) => `<li><span class="mono muted">${fmtClock(x.start)}</span><div><b>${STEP_TYPES[x.step.t].label}</b>${x.step.title ? ': ' + esc(x.step.title) : ''}<div class="small t2 svc-pre">${esc(clipText((x.step.text || '').replace(/\[\[\d+\]\]/g, ''), 220))}</div></div></li>`).join('')}</ol>`;
  else if (r.kind === 'circle') { const st = circleStation(b, 0); detail = `<h2 style="font-size:24px;margin:6px 0">${esc(b.name)}</h2><p class="t2">${esc(b.purpose)}</p><p class="small muted">${b.weeks} weeks from ${esc(gdate(circleMeetingDay(b, 0)))}, starting at “${esc(st.title)}”; ${b.mins}-minute meetings.</p>`; }
  else if (r.kind === 'thread') detail = `<h2 style="font-size:24px;margin:6px 0">${esc(b.title)}</h2>${b.note ? `<p class="t2">${esc(b.note)}</p>` : ''}<p class="small muted">${b.items.length} passage${b.items.length === 1 ? '' : 's'} from ${[...new Set(b.items.map((x) => titleOf(x.tid)))].slice(0, 4).map(esc).join(', ')}${b.links.length ? ` · ${b.links.length} relation${b.links.length === 1 ? '' : 's'}` : ''}</p><div class="cmp" style="margin-top:10px">${b.items.slice(0, 3).map((x) => passageCard(x)).join('')}</div>${b.items.length > 3 ? `<p class="small muted">…and ${b.items.length - 3} more.</p>` : ''}`;
  else detail = `<h2 style="font-size:22px;margin:6px 0">A note from ${esc(b.who)}</h2><div class="svc-pre">${esc(b.text)}</div><p class="small muted">For week ${b.week + 1} of a circle.</p>`;
  body.innerHTML = `<section class="card glow fade-in"><div class="eyebrow">${r.kind === 'service' ? 'A service' : r.kind === 'circle' ? 'A study circle' : r.kind === 'thread' ? 'A passage set' : 'A reflection'}${r.by ? ' · sent by ' + esc(r.by) : ''}</div>${detail}
    <div style="margin:12px 0">${trustLine(r)}</div>
    <div class="row">${r.kind === 'service' ? `<button class="btn primary" data-g="acceptsvc" type="button">Add to my services</button><button class="btn" data-g="runpack" type="button">${icon('play')}Run it now</button>` : r.kind === 'circle' ? '<button class="btn primary" data-g="acceptcircle" type="button">Join this circle</button>' : r.kind === 'thread' ? '<button class="btn primary" id="acceptThread" type="button">Save to my passage sets</button>' : '<button class="btn primary" data-g="acceptrefl" type="button">Add to the circle’s notes</button>'}<a class="btn ghost" href="#/gather/share">Cancel</a></div>${r.verified && !known ? `<div class="row" style="margin-top:10px"><label class="small t2">Remember this key as <input class="input" id="knownName" value="${esc(r.by)}" maxlength="40" style="width:200px;margin-left:6px"></label></div>` : ''}</section>`;
  const at = $('#acceptThread', body);
  if (at) at.addEventListener('click', () => {
    const kn = $('#knownName', body); if (r.verified && kn && kn.value.trim() && !known) { const k = GStore.known(); k[r.fp] = kn.value.trim().slice(0, 40); GStore.setKnown(k); }
    const t = Object.assign({}, b, { id: uid(), src: r.by || (r.verified ? 'a signed sender' : ''), t: Date.now(), u: Date.now() }); THREADS.add(t); toast(`Saved to your passage sets. <a href="#/path/thread/${t.id}">Open it →</a>`, 'good', 5200); at.disabled = true;
  });
}

/* ───────── the page: tabs, routing, and every button ───────── */
Pages.gather = {
  async mount(root, parts, query) {
    const view = parts[0] || 'home'; const tab = ({ service: 'services', new: 'services', run: 'services', circle: 'circles', open: 'share' })[view] || (GATHER_TABS.some((t) => t[0] === view) ? view : 'home');
    const loc = secLocate(tab === 'home' ? 'gather' : 'gather/' + tab);      /* Gather is the “Worship together” tab of Worship; its own tabs are the chips under it */
    root.innerHTML = `${secHeadHTML(loc, Object.assign({ cls: 'no-print' }, loc.key === 'gather' ? { compact: false, blurb: 'Worship and study together, with no server and no accounts. Build a service, start a study circle, keep the calendar, and pass it all hand to hand.' } : {}))}
      ${secNavHTML(loc, { cls: 'no-print' })}<div id="gbody"></div>`;
    const body = root.querySelector('#gbody'); let runner = null; let alive = true;
    const run = (svc, back) => { if (runner) runner.close(); runner = runService(svc, { onClose: () => { runner = null; if (back && alive) location.hash = back; } }); };
    const save = (svc) => { GStore.setServices(gUpsert(GStore.services(), svc)); };
    const views = { home: gatherHome, services: gatherServices, service: gatherService, circles: gatherCircles, circle: gatherCircle, calendar: gatherCalendar, share: gatherShare, open: gatherOpen, new: gatherNew, run: gatherService };
    await (views[view] || gatherHome)(body, parts, query);
    if (view === 'run') { const svc = gService(parts[1]); if (svc) run(svc, '#/gather/service/' + svc.id); }

    const offs = []; const on = (t, fn) => { root.addEventListener(t, fn); offs.push(() => root.removeEventListener(t, fn)); };
    const stepsOf = () => { const s = gService(parts[1]); return s; };
    const field = (e) => { const el = e.target.closest('[data-step]'); if (!el) return null; return { svc: stepsOf(), i: +el.dataset.step, el }; };
    on('input', (e) => {
      const t = e.target; if (t.dataset.f === 'stitle' || t.dataset.f === 'snote') { const s = stepsOf(); if (!s) return; if (t.dataset.f === 'stitle') s.title = t.value.slice(0, 120); else s.note = t.value.slice(0, 600); save(s); return; }
      const ctx = field(e); if (!ctx || !ctx.svc || !t.dataset.f) return; const s = ctx.svc.steps[ctx.i]; const f = t.dataset.f;
      if (f === 'min') { s.sec = gClamp(Math.round((+t.value || 1) * 60), 10, 7200); } else if (f === 'questions') s.questions = t.value.split('\n').map((q) => q.trim()).filter(Boolean).slice(0, 8); else if (f === 'text' || f === 'title' || f === 'source') s[f] = t.value;
      save(ctx.svc);
    });
    on('change', async (e) => {
      const t = e.target;
      if (t.id === 'startAt') { const s = stepsOf(); if (s) { s.startAt = t.value ? new Date(t.value).getTime() : null; save(s); toast(s.startAt ? 'Start time set. Include it when you share.' : 'Start time cleared.', 'good'); } return; }
      if (t.dataset.f === 't') { const ctx = field(e); if (ctx && ctx.svc) { const s = ctx.svc.steps[ctx.i]; s.t = t.value; s.sec = STEP_TYPES[t.value].sec; save(ctx.svc); Router.render(); } return; }
      if (t.dataset.pickbook) { const ctx = field(e); const tx = await TXT.load(t.value); const sec = ctx.el.querySelector('[data-picksec]'); sec.innerHTML = tx.secs.map((s, i) => `<option value="${i}">${esc(s[0].slice(0, 80))}</option>`).join(''); sec.hidden = false; ctx.el.querySelector('[data-g=usepick]').hidden = false; return; }
      if (t.id === 'openFile' || t.id === 'restoreFile') { const f = t.files && t.files[0]; if (!f) return; const txt = await f.text();
        if (t.id === 'openFile') { const code = packFromText(txt); if (!code) { toast('That file is not a Lamplighter pack.', 'bad'); return; } location.hash = '#/gather/open?p=' + code; }
        else { try { const d = JSON.parse(txt); const g = d.gather || {}; if (g.services) GStore.setServices(g.services.map(sanitizeService)); if (g.circles) GStore.setCircles(g.circles.map((c) => sanitizeCircle(c))); if (g.board) GStore.setBoard(g.board); if (g.me && g.me.pub && g.me.priv) GStore.setMe(g.me); toast('Backup restored.', 'good'); Router.render(); } catch (err) { toast('That backup could not be read: ' + esc(err.message), 'bad'); } } }
    });
    on('click', async (e) => {
      const card = e.target.closest('[data-g]'); if (!card) return; const a = card.dataset.g; const svc = stepsOf(); const sid = parts[1];
      if (a === 'quick') { const s = await serviceFromTemplate(card.dataset.tpl); run(s, null); return; }
      if (a === 'newtpl') { location.hash = '#/gather/new' + (card.dataset.tpl ? '?tpl=' + card.dataset.tpl : ''); return; }
      if (a === 'run' && svc) { run(svc, null); return; }
      if (a === 'print') { window.print(); return; }
      if (a === 'dup' && svc) { const c = JSON.parse(JSON.stringify(svc)); c.id = gNewId(); c.title += ' (copy)'; c.startAt = null; save(c); location.hash = '#/gather/service/' + c.id + '?edit=1'; return; }
      if (a === 'delete' && svc) { if (await confirmBox('Delete this service?', 'It is only stored in this browser. A copy you shared stays with whoever has it.', 'Delete', 'danger')) { GStore.setServices(GStore.services().filter((x) => x.id !== svc.id)); location.hash = '#/gather/services'; } return; }
      if (a === 'clearstart' && svc) { svc.startAt = null; save(svc); Router.render(); return; }
      if (['up', 'down', 'del', 'add', 'rand', 'choose', 'usepick'].includes(a) && svc) {
        const el = card.closest('[data-step]'); const i = el ? +el.dataset.step : -1; const st = svc.steps;
        if (a === 'up' && i > 0) [st[i - 1], st[i]] = [st[i], st[i - 1]]; else if (a === 'down' && i < st.length - 1) [st[i + 1], st[i]] = [st[i], st[i + 1]];
        else if (a === 'del') { if (st.length > 1) st.splice(i, 1); else toast('A service needs at least one part.', 'warn'); }
        else if (a === 'add') { const k = $('#addKind', root).value; if (st.length >= 40) { toast('That is the most a service can hold.', 'warn'); return; } st.push({ t: k, sec: STEP_TYPES[k].sec }); }
        else if (a === 'rand') { card.disabled = true; const r = await pickReadingFor({}); Object.assign(st[i], { text: r.text, source: r.source, ref: r.ref, title: st[i].title || r.title }); }
        else if (a === 'choose') { const meta = await TXT.index(); const box = el.querySelector('.gpick'); if (!meta) { toast(loadFailText('The texts folder was not found.'), 'warn'); return; } box.hidden = false; box.innerHTML = `<div class="row" style="margin-top:8px"><select class="select" data-pickbook="1" style="width:auto;max-width:280px"><option value="">Choose a book…</option>${gSelectOptions(meta)}</select><select class="select" data-picksec hidden style="width:auto;max-width:280px"></select><button class="btn sm primary" data-g="usepick" hidden type="button">Use this section</button></div>`; return; }
        else if (a === 'usepick') { const bk = el.querySelector('[data-pickbook]').value; const si = +el.querySelector('[data-picksec]').value; const tx = await TXT.load(bk); st[i] = Object.assign(st[i], { text: clipText(tx.secs[si][1]), source: `${LIB_BY_ID[bk].title}, ${tx.secs[si][0]}. ${tx.meta.by || ''}`, ref: { id: bk, si }, title: st[i].title || LIB_BY_ID[bk].title }); }
        svc.steps = st.map((s) => sanitizeService({ steps: [s] }).steps[0]); save(svc); Router.render(); return;
      }
      if (['sharetext', 'sharelink', 'sharefile', 'ics'].includes(a) && svc) {
        if (a === 'ics') { download(svc.title.replace(/[^\w]+/g, '-') + '.ics', icsEvent({ title: svc.title, start: svc.startAt || Date.now() + 3600000, minutes: Math.round(serviceSeconds(svc) / 60), note: svc.note, uid: svc.id }), 'text/calendar'); return; }
        const code = await buildPack('service', svc, $('#gSign', root).checked); const out = $('#packOut', root); out.hidden = false;
        if (a === 'sharetext') { out.value = packText(code); out.select(); await gcopy(out.value, 'Copied. Paste it into any message.'); }
        else if (a === 'sharelink') { out.value = packLink(location.href, code); out.select(); await gcopy(out.value, 'Link copied. It works for people who can open your copy of the Lamplighter Project.'); }
        else download(svc.title.replace(/[^\w]+/g, '-') + '.beatlab', packText(code), 'text/plain');
        return;
      }
      if (a === 'mkcircle') {
        try { const c = sanitizeCircle({ id: gNewId(), name: $('#cName', root).value.trim() || 'A study circle', purpose: $('#cPurpose', root).value, startDay: $('#cDay', root).value, from: $('#cFrom', root).value, weeks: $('#cWeeks', root).value, mins: $('#cMins', root).value, extra: $('#cExtra', root).value.split('\n').map((x) => x.trim()).filter(Boolean), host: GStore.me().name });
          GStore.setCircles(gUpsert(GStore.circles(), c)); location.hash = '#/gather/circle/' + c.id; } catch (err) { toast(esc(err.message), 'bad'); } return;
      }
      const circ = gCircle(sid);
      if (a === 'delcircle' && circ) { if (await confirmBox('Delete this circle?', 'Its notes are removed from this browser. People you shared it with keep their copies.', 'Delete', 'danger')) { GStore.setCircles(GStore.circles().filter((x) => x.id !== circ.id)); const b = GStore.board(); delete b[circ.id]; GStore.setBoard(b); location.hash = '#/gather/circles'; } return; }
      if (a === 'sharecircle' && circ) { const code = await buildPack('circle', circ, true); const out = $('#packOut', root); out.hidden = false; out.value = packText(code); out.select(); await gcopy(out.value, 'Copied. Whoever opens it joins on the same dates.'); return; }
      if ((a === 'runweek' || a === 'saveweek') && circ) { const wk = +card.dataset.week; const st = circleStation(circ, wk); const pr = (typeof practiceById === 'function' && st.practice) ? practiceById(st.practice) : null; let passage = null;
        const meta = await TXT.index(); const rid = st.read.find((id) => meta && meta[id]); if (rid) { const t = await TXT.load(rid); const p = t && pickPassage(t.secs, t.meta, psgRand, { target: 700 }); if (p) passage = { id: rid, si: p.si, text: p.text, source: `${LIB_BY_ID[rid].title}, ${p.heading}. ${t.meta.by || ''}` }; }
        const g = circleMeeting(circ, wk, { passage, practice: pr }); if (a === 'saveweek') { save(g); toast('Saved. Find it under Services, where you can share it.', 'good'); } else run(g, null); return; }
      if (a === 'reflect' && circ) { const text = $('#rText', root).value.trim(); const who = $('#rWho', root).value.trim() || 'Someone'; if (!text) { toast('Write something first.', 'warn'); return; } const wk = +card.dataset.week;
        const me = GStore.me(); me.name = who; GStore.setMe(me); const body2 = sanitizeReflection({ circle: circ.id, week: wk, who, text, t: Date.now() }); const code = await buildPack('reflection', body2, true); const idn = await myIdentity(false); const fp = idn ? await keyFingerprint(idn.pub) : null;
        const b = GStore.board(); (b[circ.id] = b[circ.id] || []).push({ id: `${fp || 'me'}:${wk}:${body2.t}`, who, fp, week: wk, text, t: body2.t, mine: true }); GStore.setBoard(b);
        await Router.render(); const out = document.querySelector('#packOut2'); if (out) { out.hidden = false; out.value = packText(code); } await gcopy(packText(code), 'Saved. The signed note is copied; paste it into your group’s chat.'); return; }
      if (a === 'addreflection' && circ) { const code = packFromText($('#rPaste', root).value); if (!code) { toast('That does not look like a note.', 'warn'); return; } location.hash = '#/gather/open?p=' + code; return; }
      if (a === 'delrefl' && circ) { const b = GStore.board(); b[circ.id] = (b[circ.id] || []).filter((r) => r.id !== card.dataset.rid); GStore.setBoard(b); Router.render(); return; }
      if (a === 'calgather') { const s = await serviceFromTemplate('silent'); s.title = card.dataset.name; s.note = card.dataset.note; s.id = gNewId(); save(s); location.hash = '#/gather/service/' + s.id + '?edit=1'; return; }
      if (a === 'calics') { download(card.dataset.name.replace(/[^\w]+/g, '-') + '.ics', icsEvent({ title: card.dataset.name, date: card.dataset.date, note: card.dataset.note }), 'text/calendar'); return; }
      if (a === 'openpaste') { const code = packFromText($('#openText', root).value); if (!code) { toast('That does not look like a Lamplighter pack.', 'warn'); return; } location.hash = '#/gather/open?p=' + code; return; }
      if (a === 'savename') { const me = GStore.me(); me.name = $('#meName', root).value.trim().slice(0, 40); GStore.setMe(me); toast('Saved.', 'good'); return; }
      if (a === 'makekey' || a === 'newkey') { if (a === 'newkey' && !(await confirmBox('Replace your key?', 'Notes you send from now on carry a new fingerprint. Old notes stay valid, but people will see a new key and should check it is you.', 'Replace', 'danger'))) return; const id = await newIdentity(); const me = Object.assign(GStore.me(), id); GStore.setMe(me); Router.render(); return; }
      if (a === 'copyfp') { const me = GStore.me(); await gcopy(await keyFingerprint(me.pub), 'Fingerprint copied.'); return; }
      if (a === 'backup') { const inc = $('#bkKey', root).checked; const me = GStore.me(); download('lamplighter-gatherings.json', JSON.stringify({ app: APP.name, kind: 'gather-backup', exportedAt: new Date().toISOString(), gather: { services: GStore.services(), circles: GStore.circles(), board: GStore.board(), me: inc ? me : { name: me.name } } }, null, 1)); return; }
      /* the preview page */
      const pk = globalThis.__pack; if (!pk) return; const r = pk.r;
      if (r.verified) { const nameEl = $('#knownName', root); if (nameEl && nameEl.value.trim() && (a === 'acceptsvc' || a === 'acceptcircle' || a === 'acceptrefl')) { const k = GStore.known(); k[r.fp] = nameEl.value.trim().slice(0, 40); GStore.setKnown(k); } }
      if (a === 'acceptsvc') { const s = Object.assign({}, r.body, { id: gNewId() }); save(s); location.hash = '#/gather/service/' + s.id; }
      else if (a === 'runpack') { run(r.body, null); }
      else if (a === 'acceptcircle') { const c = Object.assign({}, r.body); if (gCircle(c.id)) { toast('You are already in this circle.', 'good'); } else { GStore.setCircles(gUpsert(GStore.circles(), c)); } location.hash = '#/gather/circle/' + c.id; }
      else if (a === 'acceptrefl') { const c = gCircle(r.body.circle); if (!c) { toast('You are not in that circle yet. Ask for the circle first.', 'warn'); return; } const b = GStore.board(); const id = `${r.fp || 'anon'}:${r.body.week}:${r.body.t}`; b[c.id] = b[c.id] || []; if (!b[c.id].some((x) => x.id === id)) b[c.id].push({ id, who: r.body.who, fp: r.fp, week: r.body.week, text: r.body.text, t: r.body.t }); GStore.setBoard(b); location.hash = `#/gather/circle/${c.id}?week=${r.body.week}`; }
    });
    return () => { alive = false; offs.forEach((f) => f()); if (runner) { const r = runner; runner = null; r.close(); } globalThis.__pack = null; };
  },
};
