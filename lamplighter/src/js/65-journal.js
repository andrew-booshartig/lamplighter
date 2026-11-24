/* ═══════════════════════════ 65 · Journal: a 30-second daily record that shows what really moves with what ═══════════════════════════ */
const J = {
  entries: () => store.get('journal', {}),
  save: (o) => store.set('journal', o),
  sliders: [['motivation', 'Motivation'], ['creativity', 'Creativity'], ['energy', 'Energy'], ['mood', 'Mood'], ['focus', 'Focus'], ['anxiety', 'Tension / anxiety'], ['heavy', 'Drained / heavy feeling']],
  numbers: [['sleepH', 'Sleep last night (hours)', 0, 14, 0.25], ['caffeine', 'Caffeine (cups)', 0, 12, 1], ['alcohol', 'Alcohol (drinks)', 0, 15, 1], ['exerciseMin', 'Exercise (minutes)', 0, 300, 5], ['outdoorMin', 'Time outdoors (minutes)', 0, 600, 10], ['screenH', 'Screens / scrolling (hours)', 0, 16, 0.5], ['co2', 'Room CO₂ (ppm, if you have a monitor)', 300, 5000, 50]],
  factorLabels: { sleepH: 'Sleep hours', sleepQ: 'Sleep quality', caffeine: 'Caffeine', alcohol: 'Alcohol', exerciseMin: 'Exercise minutes', outdoorMin: 'Time outdoors', screenH: 'Screen hours', co2: 'Room CO₂', social: 'Time with people' },
  colors: { motivation: 'var(--accent)', creativity: 'var(--accent2)', energy: 'var(--warn)', mood: 'var(--right)', focus: 'var(--left)', anxiety: 'var(--bad)', heavy: 'var(--muted)' },
};
const sessionLog = () => store.get('sessionlog', []);
Engine.on('started', (m) => { if (m && !m.demo && !m.experiment && !m.meditation) { const l = sessionLog(); l.push({ t: Date.now(), name: m.name || 'Session' }); store.set('sessionlog', l.slice(-500)); } });

Pages.journal = {
  mount(root) {
    let date = isoDay(); let target = 'motivation'; let range = 30; const showSeries = new Set(['motivation', 'creativity']);
    const phq = () => store.get('phq2', []);
    root.innerHTML = `<div class="page-head fade-in"><div><h1>Journal</h1><p>Thirty seconds a day. Over a few weeks it shows what your motivation and creativity <i>actually</i> track with — sleep, light, movement, screens, place — instead of guessing. It’s also something concrete to show a doctor.</p></div></div>
      <div class="grid c2"><section class="card fade-in" id="ci"></section>
      <div class="stack"><section class="card fade-in" id="phqCard"></section><section class="card fade-in"><div class="card-title"><h3>${icon('info')}Why track this?</h3></div><div class="small t2 stack sm"><p>A flat patch with no drive and no ideas feels like it must have <b>one cause</b>, but it’s usually several small ones that stack: poor sleep, little daylight, too much scrolling, stress, a health issue, or low mood. They’re findable and mostly fixable.</p><p>Treat the patterns below as clues, not proof — correlation isn’t causation, and the numbers are only as good as the days you log.</p></div></section></div></div>
      <section class="card fade-in" style="margin-top:16px" id="trendCard"></section>
      <section class="card fade-in" style="margin-top:16px" id="patCard"></section>
      <section class="card fade-in" style="margin-top:16px" id="histCard"></section>`;

    /* ── check-in form ── */
    function paintCheckin() {
      const all = J.entries(); const e = all[date] || {}; const has = !!all[date];
      $('#ci', root).innerHTML = `<div class="card-title"><h3>${icon('journal')}Check-in</h3><input type="date" class="input" id="jd" value="${date}" max="${isoDay()}" style="width:auto" aria-label="Date"></div>
        <div class="stack sm"><div class="mood-grid">${J.sliders.map(([k, l]) => `<div class="vas" data-k="${k}"><div class="spread"><span class="q" style="margin:0">${l}</span><span class="mono small" data-v>${e[k] != null ? e[k] : ''}</span></div><input type="range" class="range ${e[k] != null ? '' : 'untouched'}" min="0" max="10" step="1" value="${e[k] != null ? e[k] : 5}" style="--p:${(e[k] != null ? e[k] : 5) * 10}%" aria-label="${l}"></div>`).join('')}</div>
        <div class="grid c2" style="gap:10px">${J.numbers.map(([k, l, mn, mx, st]) => `<div class="field"><label class="lbl" for="n_${k}">${l}</label><input class="input num" style="width:100%" id="n_${k}" type="number" min="${mn}" max="${mx}" step="${st}" value="${e[k] != null ? e[k] : ''}"></div>`).join('')}
          <div class="field"><label class="lbl">Sleep quality</label><div class="seg sm" id="sq">${[1, 2, 3, 4, 5].map((i) => `<button data-v="${i}" aria-pressed="${e.sleepQ === i}">${i}</button>`).join('')}</div></div>
          <div class="field"><label class="lbl">Where were you mostly?</label><select class="select" id="loc">${['', 'Home', 'Work / school', 'Out and about', 'Somewhere else'].map((o) => `<option value="${o}"${e.location === o ? ' selected' : ''}>${o || '—'}</option>`).join('')}</select></div>
          <div class="field"><label class="lbl">Time with people</label><select class="select" id="soc">${[['', '—'], ['0', 'None'], ['1', 'Some'], ['2', 'A lot']].map(([v, l]) => `<option value="${v}"${e.social != null && String(e.social) === v ? ' selected' : ''}>${l}</option>`).join('')}</select></div></div>
        <div class="field"><label class="lbl" for="nt">Notes (anything that stood out)</label><textarea class="textarea" id="nt" style="min-height:70px">${esc(e.notes || '')}</textarea></div>
        <div class="row"><button class="btn primary" id="saveJ">${icon('check')}${has ? 'Update entry' : 'Save entry'}</button>${has ? `<button class="btn ghost danger" id="delJ">Delete this day</button>` : ''}<span class="small muted" id="jmsg"></span></div></div>`;
      $$('.vas .range', root).forEach((r) => r.addEventListener('input', () => { r.classList.remove('untouched'); r.style.setProperty('--p', r.value * 10 + '%'); $('[data-v]', r.closest('.vas')).textContent = r.value; }));
      $('#sq', root).addEventListener('click', (ev) => { const b = ev.target.closest('button'); if (b) $$('#sq button', root).forEach((x) => x.setAttribute('aria-pressed', x === b)); });
      $('#jd', root).addEventListener('change', (ev) => { if (ev.target.value) { date = ev.target.value; paintCheckin(); } });
      $('#saveJ', root).addEventListener('click', () => {
        const o = { date, ts: Date.now() }; $$('.vas', root).forEach((v) => { const r = $('.range', v); if (!r.classList.contains('untouched')) o[v.dataset.k] = +r.value; });
        J.numbers.forEach(([k]) => { const v = parseFloat($('#n_' + k, root).value); if (isFinite(v)) o[k] = v; });
        const sq = $('#sq [aria-pressed=true]', root); if (sq) o.sleepQ = +sq.dataset.v; const loc = $('#loc', root).value; if (loc) o.location = loc; const soc = $('#soc', root).value; if (soc !== '') o.social = +soc; const nt = $('#nt', root).value.trim(); if (nt) o.notes = nt;
        if (Object.keys(o).length <= 2) return toast('Move at least one slider or fill one field first', 'warn');
        const all = J.entries(); all[date] = o; J.save(all); toast('Saved', 'good'); paintAll();
      });
      const d = $('#delJ', root); if (d) d.addEventListener('click', async () => { if (await confirmBox('Delete this day?', '<p>This entry will be removed.</p>', 'Delete', 'danger')) { const all = J.entries(); delete all[date]; J.save(all); paintAll(); } });
    }

    /* ── PHQ-2 ── */
    function paintPHQ() {
      const list = phq(); const last = list[list.length - 1]; const opts = ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'];
      $('#phqCard', root).innerHTML = `<div class="card-title"><h3>${icon('heart')}Two-question mood check</h3><span class="badge">optional</span></div><div class="stack sm">
        <p class="small t2">A short screener doctors use (PHQ-2). <b>It isn’t a diagnosis</b> — it just flags whether a longer conversation might be worth having.</p>
        <div class="field"><label class="lbl">Over the last 2 weeks, how often have you had <b>little interest or pleasure in doing things</b>?</label><select class="select" id="q1">${opts.map((o, i) => `<option value="${i}">${o}</option>`).join('')}</select></div>
        <div class="field"><label class="lbl">…<b>feeling down, depressed, or hopeless</b>?</label><select class="select" id="q2">${opts.map((o, i) => `<option value="${i}">${o}</option>`).join('')}</select></div>
        <div class="row"><button class="btn" id="phqGo">Score it</button>${last ? `<span class="small muted">Last: ${last.score}/6 on ${fmt.date(last.t)}</span>` : ''}</div><div id="phqOut"></div></div>`;
      $('#phqGo', root).addEventListener('click', () => {
        const a = +$('#q1', root).value, b = +$('#q2', root).value; const score = a + b; const l = phq(); l.push({ t: Date.now(), a, b, score }); store.set('phq2', l);
        $('#phqOut', root).innerHTML = score >= 3 ? UI.callout('warn', `<b>Score ${score} of 6.</b> A score of 3 or more is the usual cut-off for a follow-up. That doesn’t mean you’re depressed — but it’s a good reason to mention how you’ve been feeling to a doctor or someone you trust. Low mood is common, treatable, and nothing to be embarrassed about. (Cut-off ≥3: roughly 83% sensitivity and 92% specificity in the original validation; {{r:kroenke2003}}.)`.replace('{{r:kroenke2003}}', 'Kroenke 2003'), 'warn') : UI.callout('good', `<b>Score ${score} of 6</b> — below the usual cut-off. Worth re-checking every couple of weeks, or sooner if things change.`, 'check');
      });
    }

    /* ── trends ── */
    const dates = () => Object.keys(J.entries()).sort();
    function paintTrends() {
      const all = J.entries(); const ds = dates(); const win = ds.slice(-range);
      const sessDays = new Set(sessionLog().map((s) => isoDay(new Date(s.t))));
      $('#trendCard', root).innerHTML = `<div class="card-title"><h3>${icon('chart')}Trends</h3><div class="row"><div class="seg sm" id="rg">${[14, 30, 90].map((r) => `<button data-v="${r}" aria-pressed="${r === range}">${r} days</button>`).join('')}</div></div></div>
        <div class="row tight" id="chips" style="margin-bottom:10px">${J.sliders.map(([k, l]) => `<button class="chip" data-k="${k}" aria-pressed="${showSeries.has(k)}" style="${showSeries.has(k) ? `border-color:${J.colors[k]}` : ''}"><span style="width:8px;height:8px;border-radius:50%;background:${J.colors[k]};display:inline-block"></span>${l}</button>`).join('')}</div>
        ${win.length < 2 ? `<div class="muted center" style="padding:34px 0">Log a few days to see trends here. ${ds.length} entr${ds.length === 1 ? 'y' : 'ies'} so far.</div>` : Viz.lineChart({ series: Array.from(showSeries).map((k) => ({ color: J.colors[k], values: win.map((d) => (all[d][k] != null ? all[d][k] : NaN)) })).concat(Array.from(showSeries).slice(0, 1).map((k) => ({ color: J.colors[k], dim: true, values: Stats.movingAvg(win.map((d) => (all[d][k] != null ? all[d][k] : NaN)), 3) }))), yMin: 0, yMax: 10, yTicks: 5, xLabels: [{ i: 0, text: win[0].slice(5) }, { i: win.length - 1, text: win[win.length - 1].slice(5) }], markers: win.map((d, i) => (sessDays.has(d) ? { i } : null)).filter(Boolean) })}
        <div class="hint">${win.length >= 2 ? 'Dots = daily ratings (0–10). Faint line = 3-day average of the first selected series. Dashed vertical lines = days you played a Lamplighter session.' : ''}</div>`;
      $('#rg', root).addEventListener('click', (ev) => { const b = ev.target.closest('button'); if (b) { range = +b.dataset.v; paintTrends(); } });
      $('#chips', root).addEventListener('click', (ev) => { const b = ev.target.closest('[data-k]'); if (!b) return; const k = b.dataset.k; if (showSeries.has(k)) { if (showSeries.size > 1) showSeries.delete(k); } else showSeries.add(k); paintTrends(); });
    }

    /* ── patterns ── */
    function paintPatterns() {
      const all = J.entries(); const ds = dates().map((d) => all[d]); const tl = J.sliders.find((s) => s[0] === target)[1];
      const sel = `<select class="select" id="tg" style="width:auto" aria-label="Outcome">${J.sliders.map(([k, l]) => `<option value="${k}"${k === target ? ' selected' : ''}>${l}</option>`).join('')}</select>`;
      let body = '';
      if (ds.filter((e) => e[target] != null).length < 8) body = `<div class="muted" style="padding:20px 0">Patterns need at least <b>8 days</b> with ${tl.toLowerCase()} logged (${ds.filter((e) => e[target] != null).length} so far). Keep going — a few weeks makes this far more useful.</div>`;
      else {
        const rows = Object.keys(J.factorLabels).map((f) => { const pr = ds.filter((e) => e[target] != null && e[f] != null); if (pr.length < 8) return null; const r = Stats.spearman(pr.map((e) => e[f]), pr.map((e) => e[target])); return isFinite(r.r) ? { f, r: r.r, p: r.p, n: pr.length } : null; }).filter(Boolean).sort((a, b) => Math.abs(b.r) - Math.abs(a.r));
        const mean = (arr, k) => Stats.mean(arr.map((e) => e[k]));
        const stmts = [];
        const lo = ds.filter((e) => e.sleepH != null && e.sleepH < 6.5 && e[target] != null), hi = ds.filter((e) => e.sleepH != null && e.sleepH >= 7 && e[target] != null);
        if (lo.length >= 3 && hi.length >= 3) stmts.push(`On days after <b>7+ hours</b> of sleep your ${tl.toLowerCase()} averaged <b>${mean(hi, target).toFixed(1)}</b> (${hi.length} days) versus <b>${mean(lo, target).toFixed(1)}</b> after under 6.5 hours (${lo.length} days).`);
        const locs = {}; ds.filter((e) => e.location && e[target] != null).forEach((e) => { (locs[e.location] = locs[e.location] || []).push(e[target]); });
        const lk = Object.keys(locs).filter((k) => locs[k].length >= 3); if (lk.length >= 2) stmts.push(`By place: ${lk.map((k) => `${k} <b>${Stats.mean(locs[k]).toFixed(1)}</b> (n=${locs[k].length})`).join(' · ')}.`);
        const sd = new Set(sessionLog().map((s) => isoDay(new Date(s.t)))); const withS = ds.filter((e) => sd.has(e.date) && e[target] != null), without = ds.filter((e) => !sd.has(e.date) && e[target] != null);
        if (withS.length >= 3 && without.length >= 3) stmts.push(`On days you played a Lamplighter session: <b>${mean(withS, target).toFixed(1)}</b> (${withS.length} days) vs <b>${mean(without, target).toFixed(1)}</b> on other days (${without.length}). Days you choose to listen aren’t random, so this can’t show cause.`);
        body = `${stmts.length ? `<div class="stack sm" style="margin-bottom:14px">${stmts.map((s) => `<div class="callout">${icon('sparkle')}<div>${s}</div></div>`).join('')}</div>` : ''}
          ${rows.length ? `<div class="corr">${rows.map((r) => { const w = Math.abs(r.r) * 50; return `<div class="corr-row"><span>${J.factorLabels[r.f]} <span class="tiny muted">n=${r.n}</span></span><div class="corr-bar"><i style="${r.r >= 0 ? `left:50%;width:${w}%;background:var(--accent2)` : `right:50%;width:${w}%;background:var(--right)`}"></i></div><span class="mono small ${r.p < 0.05 ? '' : 'muted'}">ρ ${r.r >= 0 ? '+' : ''}${r.r.toFixed(2)}${r.p < 0.05 ? ' ●' : ''}</span></div>`; }).join('')}</div><div class="hint" style="margin-top:10px">Spearman rank correlation with ${tl.toLowerCase()}. ● = p &lt; 0.05 (uncorrected; with this many comparisons, expect a spurious one now and then). Right of centre = higher together, left = opposite.</div>` : '<div class="muted">Not enough overlapping data on the other fields yet.</div>'}`;
      }
      $('#patCard', root).innerHTML = `<div class="card-title"><h3>${icon('sparkle')}What moves with…</h3>${sel}</div>${body}`;
      $('#tg', root).addEventListener('change', (ev) => { target = ev.target.value; paintPatterns(); });
    }

    /* ── history ── */
    function paintHistory() {
      const all = J.entries(); const ds = dates().reverse();
      $('#histCard', root).innerHTML = `<div class="card-title"><h3>History</h3><div class="row"><button class="btn sm" id="jcsv">${icon('download')}Export CSV</button></div></div>${ds.length ? `<div class="table-wrap"><table class="stat-table"><tr><th>Date</th>${J.sliders.map(([, l]) => `<th>${l.split(' ')[0]}</th>`).join('')}<th>Sleep</th><th>Place</th></tr>${ds.slice(0, 40).map((d) => { const e = all[d]; return `<tr data-d="${d}" style="cursor:pointer"><td>${d}</td>${J.sliders.map(([k]) => `<td class="mono">${e[k] != null ? e[k] : '·'}</td>`).join('')}<td class="mono">${e.sleepH != null ? e.sleepH + 'h' : '·'}</td><td>${esc(e.location || '·')}</td></tr>`; }).join('')}</table></div><div class="hint">Click a row to edit that day.</div>` : '<div class="muted">Nothing logged yet.</div>'}`;
      const c = $('#jcsv', root); if (c) c.addEventListener('click', () => { const keys = J.sliders.map((s) => s[0]).concat(J.numbers.map((n) => n[0]), ['sleepQ', 'location', 'social', 'notes']); const csv = [['date'].concat(keys)].concat(dates().map((d) => [d].concat(keys.map((k) => (all[d][k] != null ? all[d][k] : ''))))).map((r) => r.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(',')).join('\n'); download(`lamplighter-journal-${isoDay()}.csv`, csv, 'text/csv'); });
      $$('tr[data-d]', root).forEach((tr) => tr.addEventListener('click', () => { date = tr.dataset.d; paintCheckin(); window.scrollTo({ top: 0, behavior: 'smooth' }); }));
    }
    function paintAll() { paintCheckin(); paintTrends(); paintPatterns(); paintHistory(); }
    paintAll(); paintPHQ();
  },
};
