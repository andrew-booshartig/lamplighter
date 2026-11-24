/* ═══════════════════════════ 64 · Perception & intuition lab ═══════════════════════════
   • ABX: can you actually hear the beat?  • Sealed-target guessing: digits, symbols, pictures.
   Targets come from the browser's cryptographic RNG and are committed (SHA-256) before you guess, so
   the target cannot change after the fact. Series length is fixed in advance and only the final
   series result counts (no peeking, no optional stopping). */

const LAB = {
  series: () => store.get('guess.series', []),
  saveSeries: (l) => store.set('guess.series', l),
  abx: () => store.get('abx', []),
};
const seal = (target) => { const salt = randHex(6); return { salt, commit: sha256(salt + ':' + target) }; };
const KIND_INFO = {
  digits: { name: 'Sealed number', p0: 0.1, unit: 'digits', icon: 'lock' },
  zener: { name: 'Symbol forced-choice', p0: 0.2, unit: 'trials', icon: 'target' },
  scene: { name: 'Picture ranking', p0: 0.25, unit: 'trials', icon: 'eye' },
};
function seriesStats(s) {
  const info = KIND_INFO[s.kind]; let k = 0, n = 0;
  if (s.kind === 'digits') s.trials.forEach((t) => { k += t.hits; n += t.target.length; }); else s.trials.forEach((t) => { k += t.hit ? 1 : 0; n += 1; });
  const p = n ? Stats.binomTwoSided(k, n, info.p0) : NaN; const ci = n ? Stats.wilson(k, n) : [NaN, NaN];
  return { k, n, p0: info.p0, expected: n * info.p0, p, pUp: n ? Stats.binomUpper(k, n, info.p0) : NaN, ci, rate: n ? k / n : NaN };
}

/* ───────────── lab section on the hub ───────────── */
function renderLab(container) {
  const abx = LAB.abx(); const lastAbx = abx[abx.length - 1]; const series = LAB.series();
  container.innerHTML = `<div class="eyebrow" style="margin-bottom:10px">Perception &amp; intuition lab</div>
    <div class="grid auto-lg fade-in">
      <article class="card excard" data-lab="abx" tabindex="0" role="button"><div class="ico">${icon('ear')}</div><h3>Can I hear the beat?</h3><div class="small t2">A blind ABX test: can you tell a beat from a plain tone? This is the honest first step — if you can’t hear it, ask what it’s doing for you.</div><div class="tiny muted">${lastAbx ? `Last: ${lastAbx.k}/${lastAbx.n} correct (${esc(lastAbx.label)})` : 'Not run yet'}</div></article>
      ${Object.entries(KIND_INFO).map(([k, v]) => `<article class="card excard" data-lab="${k}" tabindex="0" role="button"><div class="ico">${icon(v.icon)}</div><h3>${v.name}</h3><div class="small t2">${{ digits: 'Guess a hidden random number (1, 3 or 5 digits) — the “read the number” test from the Army paper. Chance: 10% per digit.', zener: 'Guess which of five classic symbols the computer picked. Chance: 20%.', scene: 'Write impressions, then rank four pictures; was your top pick the target? Chance: 25% (the Ganzfeld design).' }[k]}</div><div class="tiny muted">${series.filter((s) => s.kind === k).length} series so far</div></article>`).join('')}
    </div>
    <div class="callout" style="margin-top:14px">${icon('shield')}<div><b>How the sealed targets work.</b> Before you guess, the app draws the target with your device’s cryptographic random-number generator and shows a SHA-256 <i>fingerprint</i> of it. After you lock in, it reveals the target and a salt; you can verify they hash to the fingerprint — so the target can’t be changed after your guess. Decide the series length first; only the final series result counts. Expect chance results; the point is a fair test. (Prefer a physical target, like a number in an envelope? <a href="#" data-lab="manual">Log a manual trial</a>.)</div></div>
    ${series.length ? `<div class="card" style="margin-top:14px"><div class="card-title"><h3>Guess history</h3><button class="btn sm ghost" data-lab="clearseries">${icon('trash')}Clear</button></div><div class="table-wrap"><table class="stat-table"><tr><th>Date</th><th>Test</th><th>Hits / n</th><th>Chance</th><th>Rate (95% CI)</th><th>p</th></tr>
      ${series.slice().reverse().map((s) => { const st = seriesStats(s); return `<tr><td>${fmt.date(s.startedAt)}</td><td>${KIND_INFO[s.kind].name}${s.manual ? ' <span class="tag">manual</span>' : ''}</td><td class="mono">${st.k} / ${st.n}</td><td class="mono">${st.expected.toFixed(1)}</td><td class="mono">${fmt.pct(st.rate, 0)} (${fmt.pct(st.ci[0], 0)}–${fmt.pct(st.ci[1], 0)})</td><td class="mono ${st.p < 0.05 ? 'warn' : ''}">${fmt.p(st.p)}</td></tr>`; }).join('')}</table></div>
      <div class="hint" style="margin-top:8px">Across many series a few will look “significant” by chance alone (1 in 20 at p &lt; 0.05). Treat a lone result as a reason to repeat, not a finding.</div></div>` : ''}`;
  container.addEventListener('click', async (e) => {
    const t = e.target.closest('[data-lab]'); if (!t) return; e.preventDefault(); const k = t.dataset.lab;
    if (k === 'abx') await runABX(); else if (k === 'manual') await logManual(); else if (k === 'clearseries') { if (await confirmBox('Clear guess history?', '<p>All guess series will be deleted.</p>', 'Clear', 'danger')) { LAB.saveSeries([]); Router.render(); } } else await startSeries(k);
  });
  container.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.classList.contains('excard')) e.target.click(); });
}

/* ───────────── ABX ───────────── */
async function runABX() {
  const cfgIn = await modal({ title: 'Can I hear the beat?', html: `<p class="t2 small">You’ll hear <b>A</b> (with a beat), <b>B</b> (a plain tone, same loudness), then <b>X</b> — secretly A or B. Say which X was. Put headphones on and keep the volume low.</p>
    <div class="grid c2" style="gap:10px"><div class="field"><label class="lbl">Type</label><select class="select" id="ax_m"><option value="binaural">Binaural</option><option value="monaural">Monaural</option><option value="isochronic">Isochronic</option></select></div>
    <div class="field"><label class="lbl">Beat (Hz)</label><input class="input num" style="width:100%" id="ax_b" value="4" inputmode="decimal"></div>
    <div class="field"><label class="lbl">Carrier (Hz)</label><input class="input num" style="width:100%" id="ax_c" value="400" inputmode="decimal"></div>
    <div class="field"><label class="lbl">Trials</label><select class="select" id="ax_n"><option>12</option><option selected>16</option><option>20</option></select></div></div>`,
    actions: [{ label: 'Cancel', kind: 'ghost', value: null }, { label: 'Start', kind: 'primary', collect: (b) => ({ mode: $('#ax_m', b).value, beat: clamp(parseFloat($('#ax_b', b).value) || 4, 0.5, 40), carrier: clamp(parseFloat($('#ax_c', b).value) || 400, 100, 1500), n: +$('#ax_n', b).value }) }] });
  if (!cfgIn) return;
  const vol = Math.min(Studio.state.cfg.volume, 0.6); const secs = 2.6;
  const beatCfg = { mode: cfgIn.mode, carrier: cfgIn.carrier, beat: cfgIn.beat, higher: 'R', centering: 'sym', pulse: 0.55 }; const ctlCfg = { mode: 'control', carrier: cfgIn.carrier };
  const play = (c) => Engine.demo(Object.assign({}, c, { volume: vol, noiseType: 'none', fadeIn: 0.15, fadeOut: 0.2 }), secs, { name: 'ABX' });
  const ov = openOverlay('Can I hear the beat?'); let k = 0; let ok = false;
  try {
    await screenInfo(ov, { title: 'Ready?', text: `${cfgIn.n} trials. In each one you’ll hear A (with beat), B (no beat), then X. Listen to all three, then choose.`, button: 'Start' });
    for (let t = 1; t <= cfgIn.n; t++) {
      const x = randInt(2) ? 'A' : 'B'; let heard = false;
      const ans = await ov.screen(async (body, done) => {
        body.innerHTML = `<div class="eyebrow">Trial ${t} of ${cfgIn.n}</div><div class="row" style="gap:18px;margin:26px 0" id="abxr">${['A', 'B', 'X'].map((l) => `<div class="card center" id="L${l}" style="width:92px;padding:22px 0;transition:all .2s"><div class="task-title" style="margin:0">${l}</div><div class="tiny muted">${l === 'A' ? 'with beat' : l === 'B' ? 'no beat' : '?'}</div></div>`).join('')}</div>
          <div id="abxq" class="stack sm hide" style="width:min(380px,92vw)"><div class="task-sub" style="margin:0">Was X the same as A or B?</div><button class="btn lg" data-v="A">X was A (with beat)</button><button class="btn lg" data-v="B">X was B (no beat)</button></div><div class="muted small" id="abxs">Listen…</div>`;
        const hl = (l, on) => { const el = $('#L' + l, body); if (el) { el.style.borderColor = on ? 'var(--accent2)' : ''; el.style.boxShadow = on ? '0 0 30px var(--glow)' : ''; } };
        let cancelled = false; ov.onCleanup(() => { cancelled = true; Engine.stop(0.1); });
        await sleep(500); for (const [l, c] of [['A', beatCfg], ['B', ctlCfg], ['X', x === 'A' ? beatCfg : ctlCfg]]) { if (cancelled) return; hl(l, true); await play(c); hl(l, false); await sleep(450); }
        if (cancelled) return; heard = true; $('#abxq', body).classList.remove('hide'); $('#abxs', body).textContent = '';
        body.addEventListener('click', (e) => { const b = e.target.closest('[data-v]'); if (b && heard) done(b.dataset.v); });
      });
      if (ans === x) k++;
    }
    ok = true;
    const p = Stats.binomUpper(k, cfgIn.n, 0.5);
    const lst = LAB.abx(); lst.push({ t: Date.now(), n: cfgIn.n, k, p, label: `${cfgIn.mode} ${cfgIn.beat} Hz @ ${cfgIn.carrier} Hz` }); store.set('abx', lst);
    await screenInfo(ov, { title: `${k} of ${cfgIn.n} correct`, text: `Chance is ${cfgIn.n / 2}. One-sided p = ${fmt.p(p)}. ${p < 0.05 ? '<b>You can reliably hear the difference.</b> That doesn’t prove the beat does anything beyond being audible — but it does mean blinded self-tests need care, because you can tell which condition you’re in.' : '<b>You can’t reliably tell the beat from a plain tone here.</b> Try a slower beat (2–6 Hz), a carrier near 400 Hz, a quieter room, or Monaural/Isochronic mode, which are easier to hear. If you can’t hear it at all, it’s worth asking what it could be doing for you.'}`, button: 'Done' });
  } catch (e) { if (!e.aborted) { console.error(e); toast('Test error: ' + esc(e.message), 'bad'); } }
  finally { ov.close(); Engine.stop(0.1); }
  if (ok) Router.render();
}

/* ───────────── guessing series ───────────── */
async function startSeries(kind) {
  const info = KIND_INFO[kind];
  const cfg = await modal({ title: info.name, html: `<p class="t2 small">Decide the series length <b>now</b>. Only the result at the end of the series counts.</p><div class="grid c2" style="gap:10px"><div class="field"><label class="lbl">Trials</label><select class="select" id="g_n"><option>10</option><option selected>25</option><option>50</option><option>100</option></select></div>${kind === 'digits' ? `<div class="field"><label class="lbl">Digits per trial</label><select class="select" id="g_d"><option value="1">1 (chance 10%)</option><option value="3">3</option><option value="5">5</option></select></div>` : ''}</div>
    <div class="hint" style="margin-top:10px">Chance rate: ${Math.round(info.p0 * 100)}% ${kind === 'digits' ? 'per digit' : 'per trial'}. To reliably detect a true hit rate of ${Math.round((info.p0 + 0.15) * 100)}% you’d need about ${Stats.nForBinom(info.p0, info.p0 + 0.15)} ${kind === 'digits' ? 'digits' : 'trials'}.</div>`,
    actions: [{ label: 'Cancel', kind: 'ghost', value: null }, { label: 'Begin', kind: 'primary', collect: (b) => ({ n: +$('#g_n', b).value, d: kind === 'digits' ? +$('#g_d', b).value : 1 }) }] });
  if (!cfg) return;
  const ov = openOverlay(`${info.name} · ${cfg.n} trials`); const s = { id: uid(), kind, n: cfg.n, d: cfg.d, startedAt: Date.now(), trials: [] };
  try {
    await screenInfo(ov, { title: info.name, text: kind === 'digits' ? `A random ${cfg.d}-digit number is sealed before each guess. Use any method you like — quiet breathing, a Studio session beforehand, intuition. Then enter your guess.` : kind === 'zener' ? 'The computer secretly picks one of five symbols. Pick the one you think it is.' : 'The computer secretly picks a target picture. Write down any impressions, then rank four pictures from best to worst match. Your first choice should be the one that feels most like your impressions.', button: 'Start' });
    const used = new Set();
    for (let i = 0; i < cfg.n; i++) {
      const t = kind === 'digits' ? await digitsTrial(ov, s, i) : kind === 'zener' ? await zenerTrial(ov, s, i) : await sceneTrial(ov, s, i, used);
      s.trials.push(t);
    }
    const list = LAB.series(); list.push(s); LAB.saveSeries(list);
    const st = seriesStats(s);
    await ov.screen((body, done) => {
      body.innerHTML = `<div class="task-title">${st.k} of ${st.n} ${kind === 'digits' ? 'digits' : 'trials'} correct</div>
        <div class="task-sub">Chance would give about ${st.expected.toFixed(1)}. Hit rate ${fmt.pct(st.rate, 0)} (95% CI ${fmt.pct(st.ci[0], 0)}–${fmt.pct(st.ci[1], 0)}). Exact two-sided p = <b>${fmt.p(st.p)}</b>.</div>
        <div class="card" style="width:min(620px,94vw)">${Viz.cumDevChart({ hits: kind === 'digits' ? s.trials.flatMap((t) => t.target.split('').map((c, j) => (t.guess[j] === c ? 1 : 0))) : s.trials.map((t) => (t.hit ? 1 : 0)), p0: info.p0 })}</div>
        <div class="callout" style="width:min(620px,94vw);margin-top:14px">${icon('info')}<div>${st.p < 0.05 ? `A result this far from chance happens about ${(st.p * 100).toFixed(1)}% of the time by luck alone, and you may run several series — so <b>treat it as a reason to repeat with a fresh pre-declared series, not as a finding</b>.` : 'Right in the range chance produces. Nothing to see here — which is the most common outcome.'}</div></div>
        <button class="btn primary lg" id="go" style="margin-top:18px">Done</button>`;
      $('#go', body).addEventListener('click', () => done(true));
    });
  } catch (e) { if (!e.aborted) { console.error(e); toast('Error: ' + esc(e.message), 'bad'); } }
  finally { ov.close(); }
  Router.render();
}

async function digitsTrial(ov, s, i) {
  const D = s.d; const target = Array.from({ length: D }, () => randInt(10)).join(''); const sl = seal(target);
  const guess = await ov.screen((body, done) => {
    let g = '';
    body.innerHTML = `<div class="eyebrow">Trial ${i + 1} of ${s.n}</div><div class="task-title" style="margin-top:10px">Sealed ${D}-digit number</div><div class="commit" style="max-width:min(520px,92vw)">fingerprint ${sl.commit}</div>
      <div class="digits" id="dg"></div><div class="digit-pad">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => `<button data-d="${d}">${d}</button>`).join('')}<button data-d="b" aria-label="Backspace">⌫</button><button data-d="0">0</button><button data-d="ok" class="primary" style="background:linear-gradient(135deg,var(--accent),var(--accent2));color:var(--on-accent);border:0" aria-label="Lock in" id="ok">${icon('check')}</button></div>
      <div class="hint" style="margin-top:12px">Take your time. Press ✓ (or Enter) to lock in your guess.</div>`;
    const paint = () => { $('#dg', body).innerHTML = Array.from({ length: D }, (_, j) => `<span>${g[j] ?? ''}</span>`).join(''); $('#ok', body).disabled = g.length !== D; $('#ok', body).style.opacity = g.length === D ? 1 : 0.4; };
    const press = (d) => { if (d === 'b') g = g.slice(0, -1); else if (d === 'ok') { if (g.length === D) { window.removeEventListener('keydown', onKey); done(g); } } else if (g.length < D) g += d; paint(); };
    const onKey = (e) => { if (/^[0-9]$/.test(e.key)) press(e.key); else if (e.key === 'Backspace') press('b'); else if (e.key === 'Enter') press('ok'); };
    window.addEventListener('keydown', onKey); ov.onCleanup(() => window.removeEventListener('keydown', onKey));
    body.addEventListener('click', (e) => { const b = e.target.closest('[data-d]'); if (b) press(b.dataset.d); }); paint();
  });
  const hits = target.split('').filter((c, j) => guess[j] === c).length;
  await ov.screen((body, done) => {
    body.innerHTML = `<div class="eyebrow">Revealed</div><div class="digits">${target.split('').map((c, j) => `<span class="${guess[j] === c ? 'hit' : 'miss'}">${c}</span>`).join('')}</div><div class="muted">Your guess</div><div class="digits">${guess.split('').map((c, j) => `<span class="${guess[j] === target[j] ? 'hit' : ''}">${c}</span>`).join('')}</div>
      <div class="task-sub">${hits} of ${D} digit${D > 1 ? 's' : ''} matched.</div><div class="tiny muted" style="max-width:520px;word-break:break-all;margin-bottom:14px">salt <span class="mono">${sl.salt}</span> · ${sha256(sl.salt + ':' + target) === sl.commit ? '<span class="good">✓ fingerprint verified</span>' : '<span class="bad">✗ mismatch</span>'}</div><button class="btn primary lg" id="go">${i + 1 === s.n ? 'Finish' : 'Next'}</button>`;
    $('#go', body).addEventListener('click', () => done(true)); $('#go', body).focus();
  });
  return { target, guess, hits, commit: sl.commit, salt: sl.salt };
}

async function zenerTrial(ov, s, i) {
  const ti = randInt(5); const target = ZENER[ti].id; const sl = seal(target);
  const pick = await ov.screen((body, done) => {
    body.innerHTML = `<div class="eyebrow">Trial ${i + 1} of ${s.n}</div><div class="task-title" style="margin:10px 0 6px">Which symbol was sealed?</div><div class="commit" style="max-width:min(520px,92vw);margin-bottom:22px">fingerprint ${sl.commit}</div><div class="zener">${ZENER.map((z) => `<button data-z="${z.id}" aria-label="${z.name}">${z.svg}</button>`).join('')}</div>`;
    body.addEventListener('click', (e) => { const b = e.target.closest('[data-z]'); if (b) done(b.dataset.z); });
  });
  const hit = pick === target;
  await ov.screen((body, done) => {
    body.innerHTML = `<div class="eyebrow">Revealed</div><div class="zener" style="margin:18px 0">${ZENER.map((z) => `<button class="${z.id === target ? 'target' : ''} ${z.id === pick ? 'picked' : ''}" disabled>${z.svg}</button>`).join('')}</div><div class="task-sub">${hit ? '<b class="good">Hit.</b>' : 'Miss.'} The target was <b>${ZENER[ti].name}</b>; you picked <b>${ZENER.find((z) => z.id === pick).name}</b>.</div><div class="tiny muted" style="margin-bottom:14px">salt <span class="mono">${sl.salt}</span> · ${sha256(sl.salt + ':' + target) === sl.commit ? '<span class="good">✓ fingerprint verified</span>' : '<span class="bad">✗ mismatch</span>'}</div><button class="btn primary lg" id="go">${i + 1 === s.n ? 'Finish' : 'Next'}</button>`;
    $('#go', body).addEventListener('click', () => done(true)); $('#go', body).focus();
  });
  return { target, guess: pick, hit, commit: sl.commit, salt: sl.salt };
}

async function sceneTrial(ov, s, i, used) {
  let pool = SCENES.filter((x) => !used.has(x.id)); if (pool.length < 4) { used.clear(); pool = SCENES.slice(); }
  const target = pick(pool); used.add(target.id);
  const decoys = shuffle(SCENES.filter((x) => x.id !== target.id)).slice(0, 3); const four = shuffle([target].concat(decoys)); const sl = seal(target.id);
  const notes = await ov.screen((body, done) => {
    body.innerHTML = `<div class="eyebrow">Trial ${i + 1} of ${s.n}</div><div class="task-title" style="margin:10px 0 6px">A picture is sealed</div><div class="commit" style="max-width:min(520px,92vw);margin-bottom:16px">fingerprint ${sl.commit}</div>
      <div class="task-sub">Write down any impressions — colours, shapes, places, feelings, textures. When you’re ready, you’ll rank four pictures against your notes.</div><textarea class="textarea" id="nt" style="width:min(560px,92vw);min-height:130px" placeholder="Impressions…"></textarea><button class="btn primary lg" id="go" style="margin-top:16px">Show me the four pictures</button>`;
    $('#go', body).addEventListener('click', () => done($('#nt', body).value.trim()));
  });
  const ranks = await ov.screen((body, done) => {
    let order = [];
    body.innerHTML = `<div class="eyebrow">Rank the pictures</div><div class="task-sub" style="margin:6px auto 14px">Click them from <b>best match (1)</b> to worst (4).</div><div class="scenes" style="max-width:min(620px,94vw)">${four.map((sc) => `<button class="scene" data-id="${sc.id}" aria-label="${esc(sc.name)}">${sc.svg}<span class="rk"></span></button>`).join('')}</div><div class="row" style="margin-top:16px"><button class="btn ghost" id="rs">Reset</button><button class="btn primary lg" id="sub" disabled>Submit ranking</button></div>`;
    const paint = () => { $$('.scene', body).forEach((el) => { const r = order.indexOf(el.dataset.id); el.classList.toggle('ranked', r >= 0); $('.rk', el).textContent = r >= 0 ? r + 1 : ''; }); $('#sub', body).disabled = order.length !== 4; };
    body.addEventListener('click', (e) => { const sc = e.target.closest('.scene'); if (sc && !order.includes(sc.dataset.id)) { order.push(sc.dataset.id); paint(); } });
    $('#rs', body).addEventListener('click', () => { order = []; paint(); }); $('#sub', body).addEventListener('click', () => done(order.slice()));
  });
  const rank = ranks.indexOf(target.id) + 1; const hit = rank === 1;
  await ov.screen((body, done) => {
    body.innerHTML = `<div class="eyebrow">Revealed</div><div class="scenes" style="max-width:min(620px,94vw);margin:12px 0">${four.map((sc) => `<div class="scene ${sc.id === target.id ? 'target' : ''}" style="cursor:default">${sc.svg}<span class="rk" style="display:grid">${ranks.indexOf(sc.id) + 1}</span></div>`).join('')}</div>
      <div class="task-sub">${hit ? '<b class="good">Hit</b> — you ranked the target first.' : `You ranked the target <b>#${rank}</b>.`} The target was <b>${esc(target.name)}</b> (green border).</div><div class="tiny muted" style="margin-bottom:14px">salt <span class="mono">${sl.salt}</span> · ${sha256(sl.salt + ':' + target.id) === sl.commit ? '<span class="good">✓ fingerprint verified</span>' : '<span class="bad">✗ mismatch</span>'}</div><button class="btn primary lg" id="go">${i + 1 === s.n ? 'Finish' : 'Next'}</button>`;
    $('#go', body).addEventListener('click', () => done(true)); $('#go', body).focus();
  });
  return { target: target.id, guess: ranks[0], rank, hit, notes, commit: sl.commit, salt: sl.salt };
}

/* manual (physical-target) trials accumulate into one running series */
async function logManual() {
  const r = await modal({ title: 'Log a manual trial', html: `<p class="t2 small">For a physical target (a number on paper in an envelope or another room, set by a friend). Enter your guess <i>before</i> opening the envelope, then the true number.</p><div class="grid c2" style="gap:10px"><div class="field"><label class="lbl">Your guess (digits)</label><input class="input" id="mg" inputmode="numeric" maxlength="8"></div><div class="field"><label class="lbl">Actual target (same length)</label><input class="input" id="mt" inputmode="numeric" maxlength="8"></div></div>`, actions: [{ label: 'Cancel', kind: 'ghost', value: null }, { label: 'Add trial', kind: 'primary', collect: (b) => ({ g: $('#mg', b).value.replace(/\D/g, ''), t: $('#mt', b).value.replace(/\D/g, '') }) }] });
  if (!r) return; if (!r.g || r.g.length !== r.t.length) return toast('Guess and target must be the same length', 'warn');
  const list = LAB.series(); let s = list.find((x) => x.manual); if (!s) { s = { id: uid(), kind: 'digits', manual: true, n: 0, d: 0, startedAt: Date.now(), trials: [] }; list.push(s); }
  s.trials.push({ target: r.t, guess: r.g, hits: r.t.split('').filter((c, j) => r.g[j] === c).length, manual: true }); s.n = s.trials.length; LAB.saveSeries(list); toast('Trial added to your manual series', 'good'); Router.render();
}
