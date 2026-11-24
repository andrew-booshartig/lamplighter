/* ═══════════════════════════ 62 · Experiments: blinded A/B trials ═══════════════════════════
   Design: randomised blocks of two sessions (one A, one B, random order) → paired analysis per block.
   The schedule is generated once, committed with a SHA-256 hash before session 1, and hidden until the end.
   Participants also guess the condition after each session (a "blinding check"). */

const MEASURES = {
  vas: { name: 'How I feel (6 sliders)', desc: '≈30 s', metrics: VAS_ITEMS.map((i) => ({ id: 'vas.' + i.k, name: i.k[0].toUpperCase() + i.k.slice(1), better: 'up', d: 1 })).concat([{ id: 'vas.hr', name: 'Heart rate (bpm, optional)', better: 'down', d: 1, optional: true }]) },
  pvt: { name: 'Reaction-time test (PVT)', desc: '≈2 min · attention', metrics: [{ id: 'pvt.invRT', name: 'Speed (1000 / RT)', better: 'up', d: 3 }, { id: 'pvt.medianRT', name: 'Median RT (ms)', better: 'down', d: 0 }, { id: 'pvt.lapses', name: 'Lapses (> 355 ms)', better: 'down', d: 1 }] },
  nback: { name: '2-back memory task', desc: '≈2 min · working memory', metrics: [{ id: 'nback.dprime', name: 'Sensitivity (d′)', better: 'up', d: 2 }, { id: 'nback.acc', name: 'Accuracy', better: 'up', d: 3 }] },
  rat: { name: 'Word puzzles (creative)', desc: '≈5 min · convergent creativity', metrics: [{ id: 'rat.correct', name: 'Puzzles solved (of 10)', better: 'up', d: 1 }] },
  aut: { name: 'Alternate uses (creative)', desc: '2 min · divergent creativity', metrics: [{ id: 'aut.fluency', name: 'Ideas listed', better: 'up', d: 1 }] },
};
const allMetrics = (measures) => measures.flatMap((m) => MEASURES[m].metrics.map((x) => Object.assign({ measure: m }, x)));
const metricValue = (part, id) => { const [m, k] = id.split('.'); const d = part && part[m]; const v = d ? d[k] : undefined; return isNum(v) ? v : NaN; };

const TEMPLATES = [
  { id: 'calm', icon: 'heart', title: 'Calm test', q: 'Does a 10 Hz alpha beat leave me calmer than the same sound without the beat?', A: { preset: 'calm-alpha', label: '10 Hz beat' }, B: { preset: 'ctl-tone', label: 'Plain tone (no beat)' }, measures: ['vas', 'pvt'], primary: 'vas.calm' },
  { id: 'focus', icon: 'target', title: 'Focus test', q: 'Does a 16 Hz beta beat speed up my reaction time or improve my memory task versus a plain tone?', A: { preset: 'focus-beta16', label: '16 Hz beat' }, B: { preset: 'ctl-tone', label: 'Plain tone (no beat)', over: { noiseDb: -12 } }, measures: ['vas', 'pvt', 'nback'], primary: 'pvt.invRT' },
  { id: 'creative', icon: 'sparkle', title: 'Creativity test', q: 'Does a 10 Hz alpha beat in brown noise change how many creative ideas I produce, or how many word puzzles I solve?', A: { preset: 'creative-alpha', label: '10 Hz beat + brown noise' }, B: { preset: 'ctl-tone', label: 'Tone + brown noise (no beat)', over: { carrier: 300, noiseType: 'brown', noiseDb: -10, fadeIn: 10, fadeOut: 10 } }, measures: ['vas', 'rat', 'aut'], primary: 'rat.correct' },
  { id: 'ears', icon: 'ear', title: 'Ear-swap test', q: 'Does it matter which ear receives the higher pitch? (Same 6 Hz beat, ears swapped.)', A: { preset: 'calm-theta', label: 'Right ear higher', over: { higher: 'R' } }, B: { preset: 'calm-theta', label: 'Left ear higher', over: { higher: 'L' } }, measures: ['vas'], primary: 'vas.calm' },
  { id: 'carrier', icon: 'wave', title: 'Carrier test', q: 'Does the carrier pitch matter? Same 10 Hz beat at 250 Hz versus 450 Hz.', A: { preset: 'calm-alpha', label: '250 Hz carrier', over: { carrier: 250 } }, B: { preset: 'calm-alpha', label: '450 Hz carrier', over: { carrier: 450 } }, measures: ['vas'], primary: 'vas.calm' },
  { id: 'hype', icon: 'shield', title: 'Hype check', q: 'Does a “528 Hz miracle tone” feel any different from an ordinary 500 Hz tone?', A: { preset: 'hype-528', label: '528 Hz tone' }, B: { preset: 'hype-500', label: '500 Hz tone' }, measures: ['vas'], primary: 'vas.mood' },
];

const Exps = {
  all() { return store.get('experiments', []); },
  get(id) { return Exps.all().find((e) => e.id === id); },
  put(exp) { const l = Exps.all(); const i = l.findIndex((e) => e.id === exp.id); if (i >= 0) l[i] = exp; else l.push(exp); store.set('experiments', l); },
  del(id) { store.set('experiments', Exps.all().filter((e) => e.id !== id)); },
};
const presetCfg = (id, over) => { const merged = Object.assign({}, JSON.parse(JSON.stringify((presetById(id) || PRESETS[0]).cfg)), over || {}); return PRESETS.some((p) => p.id === id) ? shiftNoise(merged) : merged; }; // same shift for A and B

/* audio config for a condition (timelines are rescaled to the session length) */
function condAudio(exp, key) {
  const cfg = AudioCore.cfgOf(JSON.parse(JSON.stringify(exp[key].cfg))); cfg.volume = exp.volume; cfg.fadeIn = 10; cfg.fadeOut = 10;
  if (cfg.useTimeline && cfg.timeline && cfg.timeline.length) { const tot = cfg.timeline.reduce((a, s) => a + s.dur, 0); const f = exp.minutes / tot; cfg.timeline = cfg.timeline.map((s) => Object.assign({}, s, { dur: s.dur * f })); }
  else cfg.useTimeline = false;
  cfg.duration = exp.minutes; return cfg;
}

function createExperiment(W) {
  const schedule = []; for (let b = 0; b < W.blocks; b++) schedule.push(...(randInt(2) ? ['A', 'B'] : ['B', 'A']));
  const created = Date.now(); const salt = randHex(8);
  return { id: uid(), name: W.name, q: W.q, created, A: W.A, B: W.B, minutes: W.minutes, blocks: W.blocks, volume: W.volume, measures: Array.from(W.measures), primary: W.primary, pre: W.pre, schedule, salt, commit: sha256(JSON.stringify({ schedule, salt, created })), sessions: [], status: 'active', unsealed: false };
}

/* ───────────── analysis ───────────── */
function analyze(exp) {
  const done = exp.sessions.filter((s) => s.complete); const blocks = [];
  for (let b = 0; b < exp.blocks; b++) { const s1 = done.find((s) => s.i === 2 * b), s2 = done.find((s) => s.i === 2 * b + 1); if (!s1 || !s2) continue; blocks.push({ b, A: s1.cond === 'A' ? s1 : s2, B: s1.cond === 'A' ? s2 : s1 }); }
  const rows = allMetrics(exp.measures).map((met) => {
    const val = (s) => (exp.pre ? metricValue(s.post, met.id) - metricValue(s.pre, met.id) : metricValue(s.post, met.id));
    const pairs = blocks.map((bl) => ({ a: val(bl.A), b: val(bl.B) })).filter((p) => isNum(p.a) && isNum(p.b));
    const diffs = pairs.map((p) => p.a - p.b); const n = diffs.length;
    const t = n >= 3 ? Stats.oneSampleT(diffs) : null; const w = n >= 3 ? Stats.wilcoxon(diffs) : null;
    return { met, pairs, n, meanA: Stats.mean(pairs.map((p) => p.a)), meanB: Stats.mean(pairs.map((p) => p.b)), diff: t ? t.mean : Stats.mean(diffs), ci: t ? t.ci : [NaN, NaN], dz: t ? t.dz : NaN, pT: t ? t.p : NaN, pW: w ? w.p : NaN, favorsA: diffs.length ? ((Stats.mean(diffs) > 0) === (met.better === 'up')) : null };
  }).filter((r) => !(r.met.optional && r.n < 3));
  const nonPrimary = rows.filter((r) => r.met.id !== exp.primary && isNum(r.pT)); const adj = Stats.holm(nonPrimary.map((r) => r.pT)); nonPrimary.forEach((r, i) => { r.pAdj = adj[i]; });
  const g = done.filter((s) => s.guess && s.guess !== '?'); const gc = g.filter((s) => s.guess === s.cond).length;
  return { blocks, rows, nBlocks: blocks.length, blinding: { n: g.length, correct: gc, p: g.length ? Stats.binomTwoSided(gc, g.length, 0.5) : NaN, unsure: done.filter((s) => s.guess === '?').length }, minDz: Stats.minDetectableDz(blocks.length) };
}

function resultsHTML(exp) {
  const an = analyze(exp); const prim = an.rows.find((r) => r.met.id === exp.primary); const unit = exp.pre ? 'change (after − before)' : 'after-session value';
  const f = (v, d = 2) => (isNum(v) ? v.toFixed(d) : '—');
  let verdict = '';
  if (!prim || an.nBlocks < 4) verdict = UI.callout('', `<b>Too early to say.</b> Only ${an.nBlocks} complete block${an.nBlocks === 1 ? '' : 's'} so far; at least 4 are needed for a rough picture, and 8–12 for something you can lean on.`, 'info');
  else {
    const sig = prim.pT < 0.05 && prim.pW < 0.05; const dirTxt = prim.favorsA ? `<b>${esc(exp.A.label)}</b> was better than <b>${esc(exp.B.label)}</b>` : `<b>${esc(exp.B.label)}</b> was better than <b>${esc(exp.A.label)}</b>`;
    verdict = sig ? UI.callout('good', `<b>A difference showed up on your primary outcome</b> (${esc(prim.met.name)}): ${dirTxt}, by ${f(Math.abs(prim.diff), prim.met.d)} on average (95% CI ${f(prim.ci[0], prim.met.d)} to ${f(prim.ci[1], prim.met.d)}), paired p = ${fmt.p(prim.pT)}. That’s worth repeating — it’s one result from ${an.nBlocks} blocks. ${an.blinding.n >= 6 && an.blinding.p < 0.05 && an.blinding.correct / an.blinding.n > 0.5 ? '<b>But you could tell the conditions apart</b> (see blinding check), so expectation may explain it.' : ''}`, 'check')
      : UI.callout('', `<b>No reliable difference detected</b> on your primary outcome (${esc(prim.met.name)}): paired p = ${fmt.p(prim.pT)}, mean difference ${f(prim.diff, prim.met.d)} (95% CI ${f(prim.ci[0], prim.met.d)} to ${f(prim.ci[1], prim.met.d)}). With ${an.nBlocks} blocks you could only have detected a fairly large effect (≈ ${f(an.minDz, 2)} standard deviations or more). “No difference found” is not “no difference exists”.`, 'info');
  }
  const bl = an.blinding;
  const blindTxt = !bl.n ? 'No guesses recorded yet.' : `You guessed correctly in ${bl.correct} of ${bl.n} sessions where you made a guess (${fmt.pct(bl.correct / bl.n)}; chance = 50%, p = ${fmt.p(bl.p)})${bl.unsure ? `, plus ${bl.unsure} “no idea”` : ''}. ${bl.n >= 6 && bl.p < 0.05 && bl.correct / bl.n > 0.5 ? 'You could tell them apart, so the blinding was imperfect — expectation could contribute to any difference.' : 'No evidence that you could tell the conditions apart — good.'}`;
  return `<div class="stack">${verdict}
    ${prim ? `<div class="grid c2"><div class="card"><div class="card-title"><h3>${esc(prim.met.name)} · each block</h3><span class="badge">primary</span></div><div class="center">${Viz.slopeChart({ pairs: prim.pairs, labelA: exp.A.label, labelB: exp.B.label })}</div><div class="hint center">Each line is one block (A vs B in random order), measured as ${unit}. Thick line = average.</div></div>
      <div class="card"><div class="card-title"><h3>Blinding check</h3></div><p class="t2">${blindTxt}</p><hr><h4>How to read this</h4><ul class="small t2"><li>Only the <b>primary outcome</b> (chosen before you started) is a real test; the other rows are exploratory and corrected for multiple comparisons.</li><li>Paired design: each block compares A and B close in time, which removes slow drift in your mood or sleep.</li><li>Small samples are fragile. A single “significant” row among many is expected by chance.</li></ul></div></div>` : ''}
    <div class="card"><div class="card-title"><h3>All outcomes</h3><span class="muted small">A − B, ${unit}</span></div><div class="table-wrap"><table class="stat-table"><tr><th>Outcome</th><th>${esc(exp.A.label)}</th><th>${esc(exp.B.label)}</th><th>Difference</th><th>95% CI</th><th>dz</th><th>p (t)</th><th>p (Wilcoxon)</th><th>Holm p</th></tr>
      ${an.rows.map((r) => `<tr class="${r.met.id === exp.primary ? 'prim' : ''}"><td>${esc(r.met.name)} ${r.met.id === exp.primary ? '<span class="badge">primary</span>' : ''}<div class="tiny muted">${r.met.better === 'up' ? 'higher is better' : 'lower is better'} · n = ${r.n} blocks</div></td><td class="mono">${f(r.meanA, r.met.d)}</td><td class="mono">${f(r.meanB, r.met.d)}</td><td class="mono ${isNum(r.pT) && r.pT < 0.05 ? (r.favorsA ? 'good' : 'warn') : ''}">${fmt.signed(r.diff, r.met.d)}</td><td class="mono">${f(r.ci[0], r.met.d)} … ${f(r.ci[1], r.met.d)}</td><td class="mono">${f(r.dz, 2)}</td><td class="mono">${fmt.p(r.pT)}</td><td class="mono">${fmt.p(r.pW)}</td><td class="mono">${r.met.id === exp.primary ? '—' : fmt.p(r.pAdj)}</td></tr>`).join('')}</table></div></div></div>`;
}

function csvOf(exp, unsealed) {
  const mets = allMetrics(exp.measures); const head = ['session', 'block', 'date', unsealed ? 'condition' : null, 'minutes_listened', 'guess'].filter(Boolean).concat(mets.flatMap((m) => [m.id + '_pre', m.id + '_post']));
  const rows = exp.sessions.map((s) => [s.i + 1, Math.floor(s.i / 2) + 1, new Date(s.startedAt).toISOString(), unsealed ? (s.cond === 'A' ? exp.A.label : exp.B.label) : null, s.audio ? (s.audio.seconds / 60).toFixed(1) : '', s.guess || ''].filter((x, i) => !(i === 3 && !unsealed)).concat(mets.flatMap((m) => [metricValue(s.pre, m.id), metricValue(s.post, m.id)].map((v) => (isNum(v) ? v : '')))));
  return [head].concat(rows).map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
}

/* ───────────── session runner ───────────── */
async function runBattery(ov, exp, phase, sessionIdx) {
  const out = {}; const done = Exps.get(exp.id).sessions;
  if (exp.measures.includes('vas')) out.vas = await taskVAS(ov, { title: phase === 'before' ? 'Before we start' : 'How do you feel now?', sub: phase === 'before' ? 'How do you feel right now? Drag each slider to where it fits.' : 'Same sliders again — answer for how you feel <i>right now</i>, not how you felt before.', withHR: true });
  if (exp.measures.includes('pvt')) out.pvt = await taskPVT(ov, { seconds: 120 });
  if (exp.measures.includes('nback')) out.nback = await taskNBack(ov, { n: 2, trials: 50 });
  if (exp.measures.includes('rat')) { const used = done.flatMap((s) => [s.pre && s.pre.rat && s.pre.rat.ids, s.post && s.post.rat && s.post.rat.ids]).flat().filter((x) => x != null); out.rat = await taskRAT(ov, { count: 10, secPerItem: 30, used }); }
  if (exp.measures.includes('aut')) { const usedObj = done.flatMap((s) => [s.pre && s.pre.aut && s.pre.aut.object, s.post && s.post.aut && s.post.aut.object]); const avail = AUT_OBJECTS.filter((o) => !usedObj.includes(o)); out.aut = await taskAUT(ov, { object: pick(avail.length ? avail : AUT_OBJECTS), seconds: 120 }); }
  return out;
}
function estimateMinutes(W) {
  const per = (W.measures.has('vas') ? 0.7 : 0) + (W.measures.has('pvt') ? 2.5 : 0) + (W.measures.has('nback') ? 2.5 : 0) + (W.measures.has('rat') ? 5.5 : 0) + (W.measures.has('aut') ? 3 : 0);
  return Math.round(W.minutes + per * (W.pre ? 2 : 1) + 1);
}
async function runExperimentSession(exp) {
  const idx = exp.sessions.length; const cond = exp.schedule[idx]; const total = exp.schedule.length;
  const ov = openOverlay(`${exp.name} · session ${idx + 1} of ${total}`);
  const rec = { i: idx, cond, startedAt: Date.now(), pre: null, post: null, complete: false };
  let saved = false;
  try {
    await screenInfo(ov, { title: `Session ${idx + 1} of ${total}`, text: `About ${estimateMinutes({ minutes: exp.minutes, measures: new Set(exp.measures), pre: exp.pre })} minutes: ${exp.pre ? 'quick measures, ' : ''}${exp.minutes} min of listening, then quick measures again. Headphones on, a quiet place, phone away. <b>Your condition is hidden</b> — don’t try to work out which it is; just listen.${Settings.get('hpChecked') ? '' : '<br><br><span class="warn">You haven’t run the headphone check yet (Setup). Binaural conditions need true stereo.</span>'}`, button: 'Begin' });
    if (exp.pre) rec.pre = await runBattery(ov, exp, 'before', idx);
    rec.audio = await screenAudio(ov, { cfg: condAudio(exp, cond), minutes: exp.minutes });
    if (exp.pre) await screenInfo(ov, { title: 'Nice', text: 'Now the same quick measures again.', button: 'Continue' });
    rec.post = await runBattery(ov, exp, 'after', idx);
    rec.guess = await screenGuess(ov, { A: exp.A.label, B: exp.B.label });
    rec.endedAt = Date.now(); rec.complete = true;
    const fresh = Exps.get(exp.id); fresh.sessions.push(rec); if (fresh.sessions.length >= fresh.schedule.length) { fresh.status = 'done'; fresh.unsealed = true; } Exps.put(fresh); saved = true;
    await screenInfo(ov, { title: fresh.status === 'done' ? 'Experiment complete' : 'Session saved', text: fresh.status === 'done' ? 'All sessions are done — your results are unsealed. Time to see what happened.' : `Session ${idx + 1} of ${total} is saved. Your condition stays sealed until all sessions are finished. ${total - idx - 1} to go.`, button: fresh.status === 'done' ? 'See results' : 'Done' });
  } catch (e) { if (!e.aborted) { console.error(e); toast('Session error: ' + esc(e.message), 'bad'); } }
  finally { ov.close(); if (Engine.state !== 'idle') Engine.stop(0.1); }
  Router.render(); return saved;
}

/* ───────────── pages ───────────── */
Pages.experiments = {
  mount(root, parts, query) {
    const sub = parts[0];
    if (sub === 'new') return mountWizard(root, query);
    if (sub) return mountExperiment(root, sub);
    return mountHub(root);
  },
};

function expStatus(e) { return e.status === 'done' ? ['Complete', 'good'] : e.sessions.length ? [`${e.sessions.length} / ${e.schedule.length} sessions`, 'warn'] : ['Not started', '']; }

function mountHub(root) {
  const exps = Exps.all().slice().reverse();
  root.innerHTML = `<div class="page-head fade-in"><div><h1>Experiments</h1><p>Test whether any of this does anything for <i>you</i>. Blinded, randomised, pre-committed — the way a real trial would do it, scaled down to one person.</p></div></div>
    <section class="stack lg">
      <div><div class="eyebrow" style="margin-bottom:10px">Blinded trials · pick a question</div>
        <div class="grid auto fade-in">${TEMPLATES.map((t) => `<article class="card excard" data-t="${t.id}" tabindex="0" role="button"><div class="ico">${icon(t.icon)}</div><h3>${t.title}</h3><div class="small t2">${esc(t.q)}</div><div class="foot muted tiny">${t.measures.map((m) => MEASURES[m].name.split(' (')[0]).join(' · ')}</div></article>`).join('')}
          <article class="card excard" data-t="custom" tabindex="0" role="button"><div class="ico">${icon('plus')}</div><h3>Custom experiment</h3><div class="small t2">Compare any two sounds you design, on any measures.</div></article></div></div>
      ${exps.length ? `<div><div class="eyebrow" style="margin-bottom:10px">Your experiments</div><div class="grid auto-lg">${exps.map((e) => { const [s, k] = expStatus(e); const pct = e.sessions.length / e.schedule.length; return `<article class="card excard" data-e="${e.id}" tabindex="0" role="button"><div class="spread"><h3>${esc(e.name)}</h3><span class="badge ${k}">${s}</span></div><div class="small t2">${esc(e.q)}</div><div class="progress"><i style="width:${pct * 100}%"></i></div><div class="tiny muted">${e.blocks} blocks · ${e.minutes} min listening · started ${fmt.date(e.created)}</div></article>`; }).join('')}</div></div>` : ''}
      <div id="guessSection"></div>
    </section>`;
  root.addEventListener('click', (e) => { const t = e.target.closest('[data-t]'); if (t) return Router.go('experiments/new?t=' + t.dataset.t); const x = e.target.closest('[data-e]'); if (x) Router.go('experiments/' + x.dataset.e); });
  root.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.classList.contains('excard')) e.target.click(); });
  renderLab($('#guessSection', root));
}

/* ── wizard ── */
function mountWizard(root, query) {
  const tpl = TEMPLATES.find((t) => t.id === query.t) || null;
  const W = { name: '', q: '', A: { label: 'Condition A', cfg: presetCfg('calm-alpha') }, B: { label: 'Condition B', cfg: presetCfg('ctl-tone') }, minutes: 15, blocks: 8, volume: Math.min(Studio.state.cfg.volume, 0.6), measures: new Set(['vas']), primary: 'vas.calm', pre: true };
  const apply = (t) => { W.name = t.title; W.q = t.q; ['A', 'B'].forEach((k) => { W[k] = { label: t[k].label, cfg: presetCfg(t[k].preset, t[k].over) }; }); W.measures = new Set(t.measures); W.primary = t.primary; };
  if (tpl) apply(tpl); if (tpl && tpl.id === 'creative') W.blocks = 6;
  const presetOpts = allPresets().concat(PRESETS.filter((p) => p.hidden)).map((p) => `<option value="${p.id}">${esc(p.name)}</option>`).join('');
  const condCard = (k) => `<div class="card flat tight" data-cond="${k}"><div class="spread"><h4>Condition ${k}</h4><span class="badge ${k === 'A' ? 'good' : ''}">${k === 'A' ? 'active / test' : 'control / comparison'}</span></div><div class="stack sm" style="margin-top:10px">
      <div class="field"><label class="lbl">Label (what you’ll see in results)</label><input class="input" data-f="label" maxlength="40"></div>
      <div class="field"><label class="lbl">Start from preset</label><select class="select" data-f="preset"><option value="">— keep current —</option>${presetOpts}</select></div>
      <details><summary class="small t2" style="cursor:pointer">Fine-tune the sound</summary><div class="grid c2" style="gap:10px;margin-top:10px">
        <div class="field"><label class="lbl">Type</label><select class="select" data-f="mode"><option value="binaural">Binaural</option><option value="monaural">Monaural</option><option value="isochronic">Isochronic</option><option value="control">Single tone</option><option value="noise">Noise only</option></select></div>
        <div class="field"><label class="lbl">Carrier (Hz)</label><input class="input num" style="width:100%" data-f="carrier" inputmode="decimal"></div>
        <div class="field"><label class="lbl">Beat (Hz)</label><input class="input num" style="width:100%" data-f="beat" inputmode="decimal"></div>
        <div class="field"><label class="lbl">Higher pitch</label><select class="select" data-f="higher"><option value="R">Right ear</option><option value="L">Left ear</option></select></div>
        <div class="field"><label class="lbl">Noise</label><select class="select" data-f="noiseType"><option value="none">None</option><option value="pink">Pink</option><option value="brown">Brown</option><option value="white">White</option></select></div>
        <div class="field"><label class="lbl">Noise level (dB)</label><input class="input num" style="width:100%" data-f="noiseDb" inputmode="decimal"></div></div></details></div></div>`;
  root.innerHTML = `<div class="page-head fade-in"><div><h1>New experiment</h1><p>Everything you set here is locked before session 1 — you can’t quietly change the analysis after seeing results.</p></div><a class="btn ghost" href="#/experiments">← Back</a></div>
    <div class="grid c2"><div class="stack">
      <section class="card fade-in"><div class="card-title"><h3>1 · The question</h3></div><div class="stack sm">
        <div class="opt-grid">${TEMPLATES.map((t) => `<button class="opt" type="button" data-tpl="${t.id}" aria-pressed="${tpl && tpl.id === t.id}"><b>${t.title}</b><span>${esc(t.q.length > 70 ? t.q.slice(0, 68) + '…' : t.q)}</span></button>`).join('')}</div>
        <div class="field"><label class="lbl">Name</label><input class="input" id="wName" maxlength="60"></div><div class="field"><label class="lbl">What are you testing?</label><textarea class="textarea" id="wQ" style="min-height:70px"></textarea></div></div></section>
      <section class="card fade-in"><div class="card-title"><h3>2 · The two conditions</h3></div><div class="stack sm">${condCard('A')}${condCard('B')}<div class="callout">${icon('info')}<div>Keep everything except the thing you’re testing identical — carrier, noise, loudness. The preset “Control — matched tone” is RMS-matched to the beat presets for exactly this reason.</div></div><div id="wWarn"></div></div></section></div>
      <div class="stack">
      <section class="card fade-in"><div class="card-title"><h3>3 · Schedule</h3></div><div class="stack sm">
        <div class="grid c2" style="gap:10px"><div class="field"><label class="lbl">Listening per session</label><select class="select" id="wMin">${[5, 10, 15, 20, 30].map((m) => `<option value="${m}">${m} minutes</option>`).join('')}</select></div>
        <div class="field"><label class="lbl">Blocks (A+B pairs)</label><select class="select" id="wBlocks">${[4, 6, 8, 10, 12].map((m) => `<option value="${m}">${m} blocks · ${m * 2} sessions</option>`).join('')}</select></div></div>
        <div id="wVol"></div><div id="wPre"></div><div class="hint" id="wEst"></div>
        <div class="hint">Do at most 1–2 sessions a day, at roughly the same time of day. 8–12 blocks gives a usable picture; fewer can only catch big effects.</div></div></section>
      <section class="card fade-in"><div class="card-title"><h3>4 · Measures</h3></div><div class="stack sm">${Object.entries(MEASURES).map(([k, m]) => `<label class="check"><input type="checkbox" data-m="${k}"><div><b>${m.name}</b><span>${m.desc}</span></div></label>`).join('')}
        <div class="field"><label class="lbl">Primary outcome (decided now, tested later)</label><select class="select" id="wPrim"></select><div class="hint">Only this outcome counts as the real test. Everything else is exploratory.</div></div></div></section>
      <section class="card glow fade-in"><div class="card-title"><h3>5 · Lock it in</h3></div><div class="stack sm"><p class="t2 small">Creating the experiment randomises which sessions get A or B, then stores a SHA-256 fingerprint of that schedule. You’ll see it hashed now and can verify it matches at the end.</p><button class="btn primary lg" id="wGo">${icon('lock')}Create &amp; lock experiment</button></div></section></div></div>`;
  const $f = (k, f) => $(`[data-cond=${k}] [data-f=${f}]`, root);
  const fillCond = (k) => { const c = W[k].cfg; $f(k, 'label').value = W[k].label; ['mode', 'carrier', 'beat', 'higher', 'noiseType', 'noiseDb'].forEach((f) => { $f(k, f).value = c[f]; }); $f(k, 'preset').value = ''; };
  const warn = () => { const a = W.A.cfg, b = W.B.cfg; const diff = []; if (a.noiseType !== b.noiseType || (a.noiseType !== 'none' && a.noiseDb !== b.noiseDb)) diff.push('different noise'); if (a.mode !== 'control' && b.mode !== 'control' && a.carrier !== b.carrier) diff.push('different carriers'); $('#wWarn', root).innerHTML = diff.length ? UI.callout('warn', `A and B also differ in <b>${diff.join(' and ')}</b>. That’s fine if it’s what you’re testing; otherwise it muddies the comparison.`, 'warn') : ''; };
  const fillAll = () => { $('#wName', root).value = W.name; $('#wQ', root).value = W.q; fillCond('A'); fillCond('B'); $('#wMin', root).value = W.minutes; $('#wBlocks', root).value = W.blocks; $('#wPre', root).querySelector('input').checked = W.pre; $$('[data-m]', root).forEach((c) => { c.checked = W.measures.has(c.dataset.m); }); primOpts(); est(); warn(); };
  const primOpts = () => { const mets = allMetrics(Array.from(W.measures)).filter((m) => !m.optional); if (!mets.find((m) => m.id === W.primary)) W.primary = mets.length ? mets[0].id : ''; $('#wPrim', root).innerHTML = mets.map((m) => `<option value="${m.id}"${m.id === W.primary ? ' selected' : ''}>${esc(MEASURES[m.measure].name.split(' (')[0])} → ${esc(m.name)}</option>`).join(''); };
  const est = () => { const per = estimateMinutes(W); $('#wEst', root).textContent = `≈ ${per} min per session · ${W.blocks * 2} sessions · about ${Math.round((per * W.blocks * 2) / 60 * 10) / 10} hours in total`; };
  const vol = UI.slider({ id: 'wv', label: 'Volume (same for both conditions)', min: 0.05, max: 1, step: 0.01, value: W.volume, dec: 2, fmtFn: (v) => Math.round(v * 100) + '%', onInput: (v) => { W.volume = v; } }); $('#wVol', root).replaceWith(vol.el);
  const pre = UI.switchEl({ label: 'Measure before <i>and</i> after each session (recommended)', checked: W.pre, onChange: (v) => { W.pre = v; est(); } }); $('#wPre', root).replaceWith(pre.el); pre.el.id = 'wPre';
  fillAll();
  root.addEventListener('click', (e) => { const t = e.target.closest('[data-tpl]'); if (t) { apply(TEMPLATES.find((x) => x.id === t.dataset.tpl)); $$('[data-tpl]', root).forEach((b) => b.setAttribute('aria-pressed', b === t)); fillAll(); } });
  root.addEventListener('input', (e) => {
    const el = e.target; if (el.id === 'wName') W.name = el.value; else if (el.id === 'wQ') W.q = el.value;
    else if (el.dataset.f) { const k = el.closest('[data-cond]').dataset.cond; const f = el.dataset.f; if (f === 'label') W[k].label = el.value; else if (f !== 'preset') { W[k].cfg[f] = ['carrier', 'beat', 'noiseDb'].includes(f) ? parseFloat(el.value) || 0 : el.value; warn(); } }
  });
  root.addEventListener('change', (e) => {
    const el = e.target;
    if (el.dataset.f === 'preset' && el.value) { const k = el.closest('[data-cond]').dataset.cond; const p = presetById(el.value); W[k].cfg = presetCfg(el.value); W[k].label = p.name; fillCond(k); warn(); }
    else if (el.id === 'wMin') { W.minutes = +el.value; est(); } else if (el.id === 'wBlocks') { W.blocks = +el.value; est(); }
    else if (el.dataset.m) { if (el.checked) W.measures.add(el.dataset.m); else W.measures.delete(el.dataset.m); if (!W.measures.size) { W.measures.add('vas'); $('[data-m=vas]', root).checked = true; } primOpts(); est(); }
    else if (el.id === 'wPrim') W.primary = el.value;
  });
  $('#wGo', root).addEventListener('click', async () => {
    if (!W.name.trim()) return toast('Give the experiment a name', 'warn'); if (W.A.label.trim() === W.B.label.trim()) return toast('Give the two conditions different labels', 'warn');
    const exp = createExperiment(Object.assign({}, W, { name: W.name.trim() })); Exps.put(exp);
    await modal({ title: 'Locked in', html: `<p class="t2">Your schedule is randomised and sealed. Its fingerprint:</p><div class="commit">${exp.commit}</div><p class="small muted">At the end the app will reveal the schedule and the salt so you can check it hashes to this value — proof nothing was changed in between. Screenshot it if you like.</p>`, actions: [{ label: 'Go to experiment', kind: 'primary', value: true }] });
    Router.go('experiments/' + exp.id);
  });
}

/* ── single experiment ── */
function mountExperiment(root, id) {
  const exp = Exps.get(id);
  if (!exp) { root.innerHTML = `<div class="card"><h2>Experiment not found</h2><a class="btn" href="#/experiments">Back</a></div>`; return; }
  const total = exp.schedule.length; const done = exp.sessions.length; const finished = exp.status === 'done'; const open = finished || exp.unsealed;
  const [stText, stKind] = expStatus(exp);
  root.innerHTML = `<div class="page-head fade-in"><div><a href="#/experiments" class="small">← Experiments</a><h1 style="margin-top:6px">${esc(exp.name)}</h1><p>${esc(exp.q)}</p></div><span class="badge ${stKind}">${stText}</span></div>
    <div class="grid c2"><div class="stack">
      <section class="card glow fade-in"><div class="card-title"><h3>${finished ? 'Finished' : 'Next session'}</h3></div>
        ${finished ? `<p class="t2">All ${total} sessions done. Your results are below.</p>` : `<div class="spread"><div><div class="task-title" style="text-align:left;font-size:32px">${done + 1} <span class="muted" style="font-size:18px">of ${total}</span></div><div class="small muted">${exp.minutes} min listening · ≈ ${estimateMinutes({ minutes: exp.minutes, measures: new Set(exp.measures), pre: exp.pre })} min total</div></div><button class="btn primary lg" id="runS">${icon('play')}Start session</button></div>`}
        <div class="progress" style="margin-top:14px"><i style="width:${(done / total) * 100}%"></i></div></section>
      <section class="card fade-in"><div class="card-title"><h3>Protocol</h3><span class="badge">${icon('lock')} locked</span></div><div class="small t2 stack sm">
        <div><b>A:</b> ${esc(exp.A.label)} &nbsp;·&nbsp; <b>B:</b> ${esc(exp.B.label)} <span class="muted">${open ? '' : '(which session gets which is sealed)'}</span></div>
        <div><b>Design:</b> ${exp.blocks} blocks × (A + B in random order) · ${exp.minutes} min each · volume ${Math.round(exp.volume * 100)}%</div>
        <div><b>Measures:</b> ${exp.measures.map((m) => MEASURES[m].name).join(' · ')} · ${exp.pre ? 'before &amp; after' : 'after only'}</div>
        <div><b>Primary outcome:</b> ${esc((allMetrics(exp.measures).find((m) => m.id === exp.primary) || {}).name || exp.primary)}</div>
        <div><b>Schedule fingerprint (SHA-256):</b><div class="commit" style="margin-top:4px">${exp.commit}</div>${open ? `<details style="margin-top:6px"><summary class="small" style="cursor:pointer">Verify it</summary><div class="small muted" style="margin-top:6px">Schedule: <span class="mono">${exp.schedule.join('')}</span> · salt <span class="mono">${exp.salt}</span><br>Computed now: <span class="mono" id="vh"></span> <span id="vok"></span></div></details>` : ''}</div></div></section>
    </div><div class="stack">
      <section class="card fade-in"><div class="card-title"><h3>Sessions</h3></div>${exp.sessions.length ? `<div class="table-wrap"><table class="stat-table"><tr><th>#</th><th>Date</th><th>Listened</th><th>Your guess</th>${open ? '<th>Condition</th>' : ''}</tr>${exp.sessions.map((s) => `<tr><td>${s.i + 1}</td><td>${fmt.dt(s.startedAt)}</td><td class="mono">${s.audio ? fmt.time(s.audio.seconds) : '—'}${s.audio && s.audio.early ? ' (early)' : ''}</td><td>${s.guess === 'A' ? esc(exp.A.label) : s.guess === 'B' ? esc(exp.B.label) : 'no idea'}</td>${open ? `<td>${s.cond === 'A' ? esc(exp.A.label) : esc(exp.B.label)}</td>` : ''}</tr>`).join('')}</table></div>` : '<p class="muted small">No sessions yet.</p>'}</section>
      ${open ? '' : `<section class="card fade-in"><div class="card-title"><h3>Results</h3><span class="badge">sealed</span></div><p class="t2">Results unlock when all ${total} sessions are done — that’s what keeps the experiment honest. ${done >= 4 ? 'You can peek early, but that breaks the blinding for the remaining sessions.' : ''}</p>${done >= 4 ? `<button class="btn" id="peek">${icon('eye')}Peek (unblinds me)</button>` : ''}</section>`}
    </div></div>
    <div id="resFull" style="margin-top:16px"></div>
    <div class="row" style="margin-top:22px"><button class="btn sm" id="expJ">${icon('download')}Export JSON</button><button class="btn sm" id="expC">${icon('download')}Export CSV</button><button class="btn sm danger" id="expD">${icon('trash')}Delete</button></div>`;
  if (open) { $('#resFull', root).innerHTML = resultsHTML(exp); const hv = $('#vh', root); if (hv) { hv.textContent = sha256(JSON.stringify({ schedule: exp.schedule, salt: exp.salt, created: exp.created })).slice(0, 24) + '…'; $('#vok', root).innerHTML = sha256(JSON.stringify({ schedule: exp.schedule, salt: exp.salt, created: exp.created })) === exp.commit ? '<span class="good">✓ matches</span>' : '<span class="bad">✗ mismatch</span>'; } }
  const run = $('#runS', root); if (run) run.addEventListener('click', () => runExperimentSession(exp));
  const peek = $('#peek', root); if (peek) peek.addEventListener('click', async () => { if (await confirmBox('Peek at results?', '<p>Seeing results early ends the blinding for your remaining sessions, and the experiment will be marked as <b>unblinded</b>. Only do this if you’d otherwise stop.</p>', 'Peek anyway', 'danger')) { const e = Exps.get(exp.id); e.unsealed = true; e.unblindedEarly = true; Exps.put(e); Router.render(); } });
  $('#expJ', root).addEventListener('click', () => download(`lamplighter-${exp.name.replace(/\W+/g, '-')}.json`, JSON.stringify(open ? exp : Object.assign({}, exp, { schedule: '(sealed)' }), null, 2)));
  $('#expC', root).addEventListener('click', () => download(`lamplighter-${exp.name.replace(/\W+/g, '-')}.csv`, csvOf(exp, open), 'text/csv'));
  $('#expD', root).addEventListener('click', async () => { if (await confirmBox('Delete experiment?', `<p>“${esc(exp.name)}” and all its sessions will be permanently deleted.</p>`, 'Delete', 'danger')) { Exps.del(exp.id); Router.go('experiments'); } });
}
