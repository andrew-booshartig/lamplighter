/* ═══════════════════════════ 68 · Meditate ═══════════════════════════
   Short, grounded sits with the guidance as text, bells and a quiet sound bed — plus a gentle 14-step
   way back that advances by completed sits (never by calendar days), and a built-in way to stop.
   A voice is something a person adds (the "Add a voice" switch, off until turned on, and remembered): the words are always on the screen, and the voice reads them.
   Which voice, and how the sentences are paced, is the engine's business (Speech in 31-bell-speech.js, the voice chooser in 32-voice-chooser.js). */
const MED_VAS = [
  { k: 'settled', q: 'How settled do you feel?', lo: 'Unsettled', hi: 'Settled' },
  { k: 'busy', q: 'How busy is your mind?', lo: 'Quiet', hi: 'Busy' },
];
const fmtMin = (m) => (m === 2.5 ? '2½ min' : `${m} min`);
const MED_OBSTACLES = ['Busy mind', 'Sleepy', 'Restless', 'Discomfort or pain', 'Difficult feelings', 'Noise or interruptions', 'It went fine'];

const MED = {
  /* guide: 'text' or 'bells'; voiceOn: the "Add a voice" switch (what a person last chose, even while Bells only is on). The old default, 'voice' (voice and text together), reads as text with the switch off. */
  prefs: () => { const p = Object.assign({ guide: 'text', voiceOn: false, rate: 0.85, voiceVol: 0.9, sound: 'theta', bellStart: true, bellEnd: true, bellEvery: 0, showTime: true, planOn: false, planStep: 0, volume: null }, store.get('meditation.prefs', {})); return Object.assign(p, lsGuideMode(p)); },
  voice: (p) => Speech.ok && p.guide === 'text' && p.voiceOn === true,         // whether a sit with these preferences is read aloud
  setPrefs: (o) => store.set('meditation.prefs', Object.assign(MED.prefs(), o)),
  log: () => store.get('meditation.log', []),
  saveRec(rec) { const l = MED.log(); const i = l.findIndex((x) => x.id === rec.id); if (i >= 0) l[i] = rec; else l.push(rec); store.set('meditation.log', l.slice(-1000)); },
  volume() { const p = MED.prefs(); return clamp(p.volume != null ? p.volume : Studio.state.cfg.volume, 0.05, 1); },
};

function medStats(log, now = Date.now()) {
  const days = []; for (let i = 27; i >= 0; i--) days.push({ date: isoDay(new Date(now - i * 864e5)), min: 0 });
  log.forEach((l) => { const d = days.find((x) => x.date === isoDay(new Date(l.t))); if (d) d.min += l.minutesActual || 0; });
  const week = log.filter((l) => l.t >= now - 7 * 864e5);
  const dS = log.filter((l) => isNum(l.preSettled) && isNum(l.postSettled)).map((l) => l.postSettled - l.preSettled);
  const dB = log.filter((l) => isNum(l.preBusy) && isNum(l.postBusy)).map((l) => l.postBusy - l.preBusy);
  return { sessionsWeek: week.length, minutesWeek: Math.round(week.reduce((a, l) => a + (l.minutesActual || 0), 0)), days, activeDays: days.filter((d) => d.min >= 1).length, settled: { n: dS.length, mean: dS.length ? Stats.mean(dS) : NaN }, busy: { n: dB.length, mean: dB.length ? Stats.mean(dB) : NaN }, total: log.length, totalMin: Math.round(log.reduce((a, l) => a + (l.minutesActual || 0), 0)) };
}

function bedCfg(sound, vol, minutes) {
  const common = { volume: vol, duration: minutes, useTimeline: false, fadeIn: 12, fadeOut: Math.min(25, (minutes * 60) / 3) };
  if (sound === 'noise') return Object.assign(AudioCore.cfgOf({ mode: 'noise', noiseType: 'brown' }), common);
  return Object.assign(presetCfg(sound === 'alpha' ? 'calm-alpha' : 'meditate-theta'), common); // honours your noise-comfort shift
}

/* ───────────── the sit ───────────── */
function arriveScreen(ov, pr, o) {
  return ov.screen((body, done) => {
    const soundTxt = { none: 'silence', noise: 'soft noise', theta: 'a slow tone with soft noise', alpha: 'a faster tone with soft noise' }[o.sound];
    body.innerHTML = `<div class="eyebrow">${esc(pr.name)} · ${fmtMin(o.minutes)}</div><div class="task-title" style="margin-top:8px">Get comfortable</div>
      <div class="task-sub">${esc(pr.posture)}</div>
      <div class="row tight" style="justify-content:center;margin-bottom:20px"><span class="badge">${o.guide === 'bells' ? 'bells only' : o.voice ? 'voice + text' : 'text only'}</span>${o.sound !== 'none' ? `<span class="badge">${soundTxt}</span>` : ''}${o.bells.start || o.bells.end || o.bells.every ? '<span class="badge">bells</span>' : ''}</div>
      <button class="btn primary lg" id="go">Begin</button><div class="hint center" style="margin-top:14px">You can pause, end early, or stop at any time. Eyes open is always fine.</div>`;
    $('#go', body).addEventListener('click', () => { Engine.unlock(); done(true); }); $('#go', body).focus();
  });
}

function sitScreen(ov, o) {
  return ov.screen((body, done) => {
    const pr = practiceById(o.practice); const prefs = MED.prefs(); const T = Math.round(o.minutes * 60); const cues = buildCues(o.practice, o.minutes, o.word);
    const pat = pr.pacer ? PACERS[o.pacer || pr.pacerDefault || prefs.pacer || 'slow'] : null; const vol = MED.volume(); let speakOn = !!o.voice && o.guide !== 'bells' && Speech.ok; const showText = o.guide !== 'bells';
    body.classList.add('med-sit');
    body.innerHTML = `<div class="med-stage"><div class="orb${pat ? ' pacing' : ''}" id="orb"></div><div class="pacer-label" id="plabel">&nbsp;</div></div>
      <div class="med-cue" id="cue" aria-live="polite"></div>
      <div class="med-foot"><div class="progress thin"><i id="mbar"></i></div><div class="spread" style="margin-top:8px"><span class="mono muted small" id="mtime"></span><span class="small muted" id="mstate"></span></div>
        <div class="row" style="justify-content:center;margin-top:10px"><button class="btn ghost sm" id="mPause">${icon('pause')}Pause</button><button class="btn ghost sm" id="mEnd">End early</button><button class="btn ghost sm" id="mStop">I need to stop</button></div></div>`;
    const el = { orb: $('#orb', body), plabel: $('#plabel', body), cue: $('#cue', body), bar: $('#mbar', body), time: $('#mtime', body), state: $('#mstate', body), pause: $('#mPause', body) };
    let ctx = null, t0 = 0, iv = 0, raf = 0, clk = null, wl = null, finished = false, paused = false, ci = 0, cueShownAt = -99, toldVoice = false;
    const voiceFailed = () => { speakOn = false; if (toldVoice || finished) return; toldVoice = true; toast('The voice did not respond, so the guidance stays as text.'); };       // the words are on the screen either way
    const cleanup = () => { clearInterval(iv); cancelAnimationFrame(raf); try { if (clk) clk.stop(); } catch (e) { /* noop */ } if (wl) { try { wl.release(); } catch (e) { /* noop */ } wl = null; } if (!finished) { Engine.stop(0.5); Speech.cancel(); } };
    ov.onCleanup(cleanup);
    const finish = (res) => { if (finished) return; finished = true; const seconds = ctx ? clamp(ctx.currentTime - t0, 0, T) : 0; cleanup(); done(Object.assign({ completed: false, seconds }, res)); };
    const update = () => {
      if (finished || !ctx) return; const now = ctx.currentTime - t0;
      while (ci < cues.length && now >= cues[ci].t) { const c = cues[ci++]; if (showText) { el.cue.textContent = c.text; el.cue.classList.add('on'); cueShownAt = now; } if (speakOn) Speech.say(c.text, { style: 'guide', rate: prefs.rate, volume: prefs.voiceVol, onFail: voiceFailed }); }
      if (now - cueShownAt > 16) el.cue.classList.remove('on');
      const rem = Math.max(0, T - now); el.time.textContent = prefs.showTime ? fmt.time(rem) + ' left' : ''; el.bar.style.width = clamp(now / T, 0, 1) * 100 + '%';
    };
    const frame = () => {
      raf = requestAnimationFrame(frame); if (!ctx || finished) return; const now = ctx.currentTime - t0;
      if (pat && now >= 6) { const s = pacerAt(pat, now - 6); el.plabel.textContent = s.label; if (!prefersReducedMotion()) el.orb.style.transform = `scale(${0.5 + 0.5 * s.r})`; else el.orb.style.opacity = 0.45 + 0.55 * s.r; }
    };
    (async () => {
      try {
        ctx = await Engine.unlock(); const vo = MED.volume();
        if (o.sound !== 'none') { const voice = await Engine.play(bedCfg(o.sound, vo, o.minutes), { name: 'Meditation', meditation: true }); t0 = voice.t0; } else t0 = ctx.currentTime + 0.4;
        if (o.bells.start) Bell.start(ctx, t0, vo);
        if (o.bells.every) for (let m = o.bells.every; m * 60 < T - 45; m += o.bells.every) Bell.interval(ctx, t0 + m * 60, vo);
        if (o.bells.end) Bell.finish(ctx, t0 + T, vo);
        clk = ctx.createOscillator(); const cg = ctx.createGain(); cg.gain.value = 0; clk.connect(cg); cg.connect(ctx.destination); clk.start(t0); clk.stop(t0 + T + 0.05); clk.onended = () => finish({ completed: true, seconds: T });
        try { if (navigator.wakeLock) wl = await navigator.wakeLock.request('screen'); } catch (e) { /* not supported / denied */ }
        iv = setInterval(update, 250); update(); frame();
      } catch (e) { console.error(e); toast('Audio could not start: ' + esc(e.message), 'bad'); finish({ error: true }); }
    })();
    el.pause.addEventListener('click', async () => {
      if (!ctx || finished) return;
      if (!paused) { paused = true; await ctx.suspend(); Speech.pause(); el.pause.innerHTML = icon('play') + 'Resume'; el.state.textContent = 'Paused'; el.orb.classList.add('paused'); }
      else { paused = false; await ctx.resume(); Speech.resume(); el.pause.innerHTML = icon('pause') + 'Pause'; el.state.textContent = ''; el.orb.classList.remove('paused'); }
    });
    $('#mEnd', body).addEventListener('click', async () => {
      if (!(await confirmBox('End this sit now?', '<p>It will be saved as a shorter sit — that still counts.</p>', 'End sit'))) return;
      if (paused && ctx) { paused = false; await ctx.resume(); }
      Engine.stop(2.5); Speech.cancel(); if (o.bells.end && ctx) Bell.ring(ctx, Bell.bus(ctx), ctx.currentTime + 0.3, { f0: 220, peak: Bell.level(MED.volume()) * 0.8 });
      finish({ early: true });
    });
    $('#mStop', body).addEventListener('click', async () => { if (paused && ctx) { paused = false; await ctx.resume(); } Engine.stop(1.5); Speech.cancel(); finish({ stopped: true }); });
  });
}

async function runSit(o) {
  const pr = practiceById(o.practice); const ov = openOverlay(pr.name); ov.el.classList.add('med');
  const rec = { id: uid(), t: Date.now(), practice: o.practice, minutesPlanned: o.minutes, minutesActual: 0, completed: false, sound: o.sound, guide: o.voice && o.guide !== 'bells' ? 'voice' : o.guide, planStep: o.planStep != null ? o.planStep : null, station: o.station || null, word: o.word || null, intention: o.intention || null };
  let summary = null;
  try {
    if (o.practice !== 'ground') { const pre = await taskVAS(ov, { title: 'Before you sit', sub: 'A quick check-in, so you can see what sitting does for you. Skip it if you’d rather just begin.', items: MED_VAS, skip: true }); if (pre) { rec.preSettled = pre.settled; rec.preBusy = pre.busy; } }
    await arriveScreen(ov, pr, o);
    let res = await sitScreen(ov, o);
    if (res.error) throw new Error('The sit could not start');
    if (res.stopped && o.practice !== 'ground') {
      const choice = await ov.screen((body, done) => {
        body.innerHTML = `<div class="task-title">That’s okay</div><div class="task-sub">Stopping is part of practice. If you’re feeling anxious, spacey or unsettled, a minute of grounding can help. If it keeps happening, please talk with a doctor or therapist who knows meditation.</div>
          <div class="stack" style="width:min(380px,92vw)"><button class="btn primary lg" data-c="ground">Ground me · 2½ min</button><button class="btn lg" data-c="fine">I’m fine — finish up</button></div>`;
        body.addEventListener('click', (e) => { const b = e.target.closest('[data-c]'); if (b) done(b.dataset.c); });
      });
      rec.stoppedEarly = true;
      if (choice === 'ground') { const g = await sitScreen(ov, { practice: 'ground', minutes: 2.5, guide: o.guide === 'bells' ? 'text' : o.guide, voice: o.voice, sound: 'none', bells: { start: false, every: 0, end: true } }); rec.groundedAfter = true; res = { completed: false, seconds: res.seconds, stopped: true, g }; }
    }
    rec.minutesActual = Math.round((res.seconds / 60) * 10) / 10; rec.completed = !!res.completed;
    if (rec.minutesActual >= 0.5) MED.saveRec(rec);
    let post = null; if (o.practice !== 'ground') post = await taskVAS(ov, { title: 'And now?', sub: 'Same two sliders. Answer for how you feel right now.', items: MED_VAS, skip: true });
    if (post) { rec.postSettled = post.settled; rec.postBusy = post.busy; }
    // plan progress: a sit counts when it reaches 80 % of the step's length
    const prefs = MED.prefs(); let planMsg = '';
    if (o.planStep != null && prefs.planOn && o.planStep === prefs.planStep && rec.minutesActual >= 0.8 * PLAN[o.planStep].min) {
      MED.setPrefs({ planStep: o.planStep + 1 }); const nxt = PLAN[o.planStep + 1];
      planMsg = nxt ? `Step ${o.planStep + 1} of ${PLAN.length} done. Next: ${fmtMin(nxt.min)} ${practiceById(nxt.practice).name.toLowerCase()}.` : 'That was the last step — you’re back. From here, keep it small and regular.';
    }
    if (rec.minutesActual >= 0.5) MED.saveRec(rec);
    summary = await ov.screen((body, done) => {
      const st = medStats(MED.log());
      const dS = isNum(rec.preSettled) && isNum(rec.postSettled) ? rec.postSettled - rec.preSettled : null;
      body.innerHTML = `<div class="task-title">${rec.completed ? `You sat for ${fmtMin(rec.minutesActual)}.` : `You sat for ${rec.minutesActual} min — that counts.`}</div>
        <div class="task-sub">${dS != null ? `Settled ${rec.preSettled} → ${rec.postSettled}${isNum(rec.preBusy) && isNum(rec.postBusy) ? ` · busy mind ${rec.preBusy} → ${rec.postBusy}.` : '.'} ` : ''}A wandering mind is the practice, not a failure — the noticing and coming back is the skill. ${planMsg}</div>
        <div class="card flat" style="width:min(520px,94vw)"><div class="lbl" style="margin-bottom:8px">Anything get in the way? (optional)</div><div class="row tight" id="obs">${MED_OBSTACLES.map((x) => `<button class="chip" data-o="${esc(x)}" aria-pressed="false">${x}</button>`).join('')}</div>
          <textarea class="textarea" id="mnote" style="margin-top:10px;min-height:60px" placeholder="A note to yourself (optional)"></textarea></div>
        <div class="muted small" style="margin:12px 0">${st.sessionsWeek} sit${st.sessionsWeek === 1 ? '' : 's'} in the last 7 days · ${st.activeDays} of the last 28 days.</div><button class="btn primary lg" id="go">Done</button>`;
      const sel = new Set(); $('#obs', body).addEventListener('click', (e) => { const b = e.target.closest('[data-o]'); if (!b) return; const k = b.dataset.o; if (sel.has(k)) sel.delete(k); else sel.add(k); b.setAttribute('aria-pressed', sel.has(k)); });
      $('#go', body).addEventListener('click', () => { rec.obstacles = Array.from(sel); const n = $('#mnote', body).value.trim(); if (n) rec.note = n; if (rec.minutesActual >= 0.5) MED.saveRec(rec); done(true); });
    });
  } catch (e) { if (!e.aborted) { console.error(e); toast('Something interrupted the sit: ' + esc(e.message), 'bad'); } }
  finally { Engine.stop(0.3); Speech.cancel(); ov.close(); }
  Router.render(); return summary ? rec : null;
}

/* ───────────── sit setup sheet ───────────── */
async function openSheet(practiceId, minutes, planStep = null, extra = {}) {
  const pr = practiceById(practiceId); const prefs = MED.prefs(); let mins = minutes || pr.def; let wordEl = null;
  const p = modal({ title: pr.name, html: `<p class="t2 small">${esc(pr.blurb)}</p>${pr.from ? `<div class="hint" style="margin-bottom:8px">From: ${esc(pr.from)}</div>` : ''}<div class="callout">${icon('info')}<div>${esc(pr.posture)}</div></div><div class="stack sm" id="sh" style="margin-top:14px"></div>`,
    actions: [{ label: 'Cancel', kind: 'ghost', value: null }, { label: 'Begin', kind: 'primary', collect: () => ({ minutes: mins, guide: guide.get(), voice: !!(vox && guide.get() === 'text' && vox.get()), voiceSwitch: vox ? vox.get() : prefs.voiceOn, pacer: pr.pacer ? pacerSeg.get() : undefined, word: wordEl ? (wordEl.value.trim() || pr.choice[0]) : undefined, sound: pr.fixed ? 'none' : sound.get(), bells: pr.fixed ? { start: false, every: 0, end: true } : { start: bS.get(), end: bE.get(), every: +$('#bEvery').value }, planStep }) }] });
  const host = $('.modal-back:last-of-type #sh') || $('#sh');
  host.innerHTML = `${pr.fixed ? '' : `<div class="field"><label class="lbl">Length</label><div class="row tight" id="durs">${pr.mins.map((m) => `<button class="chip" type="button" data-m="${m}" aria-pressed="${m === mins}">${fmtMin(m)}</button>`).join('')}</div></div>`}
    <div class="field"><label class="lbl">Guidance</label><div id="gSlot"></div><div id="vSlot" class="stack sm" style="margin-top:8px"></div></div>${pr.fixed ? '' : '<div class="field"><label class="lbl">Sound <span class="muted">— optional</span></label><div id="sSlot"></div><div class="hint">No evidence that beats deepen meditation; some people simply like the backdrop. Volume and noise level come from Setup.</div></div><div class="field"><label class="lbl">Bells</label><div class="row" id="bSlot"></div></div>'}`;
  const guide = UI.seg({ label: 'Guidance', options: [{ v: 'text', label: 'Text' }, { v: 'bells', label: 'Bells only' }], value: prefs.guide, onChange: () => syncVox() }); $('#gSlot', host).replaceWith(guide.el);
  /* "Add a voice": off until a person turns it on, and remembered; the voice chooser (shared with the Meditate page and the reader) appears under it */
  let vox = null; let vc = null; let sound = null, bS = null, bE = null, pacerSeg = null;
  function syncVox() { const row = $('#vSlot', host); if (row) row.hidden = guide.get() === 'bells'; const slot = $('#vcSlot', host); if (slot) slot.hidden = !(vox && vox.get()); }
  if (Speech.ok) {
    vox = UI.switchEl({ label: 'Add a voice', checked: prefs.voiceOn, onChange: () => { syncVox(); if (!vox.get()) Speech.cancel(); } });
    const slot = h('<div id="vcSlot"></div>'); $('#vSlot', host).append(vox.el, slot);
    vc = voiceChooser(slot, { style: 'guide', settings: () => { const q = MED.prefs(); return { rate: q.rate, volume: q.voiceVol }; } }); syncVox();
  }
  if (pr.choice) { const f = h(`<div class="field"><label class="lbl" for="wordIn">Your word or phrase</label><input class="input" id="wordIn" list="wordList" value="${esc(prefs.pathWord || pr.choice[0])}" maxlength="80"><datalist id="wordList">${pr.choice.map((w) => `<option value="${esc(w)}"></option>`).join('')}</datalist><div class="hint">Pick one, or type your own. Use whatever word is yours.</div></div>`); host.insertBefore(f, host.firstChild); wordEl = $('#wordIn', f); }
  if (pr.pacer) { pacerSeg = UI.seg({ label: 'Breathing pattern', options: [{ v: 'slow', label: 'Slow 5.5 / 5.5' }, { v: 'calm', label: 'Calming 4 / 6' }, { v: 'sigh', label: 'Cyclic sigh' }], value: pr.pacerDefault || prefs.pacer || 'slow' }); const f = h('<div class="field"><label class="lbl">Breathing pattern</label></div>'); f.append(pacerSeg.el); host.insertBefore(f, host.firstChild); }
  if (!pr.fixed) {
    sound = UI.seg({ label: 'Sound', options: [{ v: 'none', label: 'Silence' }, { v: 'noise', label: 'Soft noise' }, { v: 'theta', label: 'A slow tone with soft noise' }, { v: 'alpha', label: 'A faster tone with soft noise' }], value: pr.soundDefault || prefs.sound }); $('#sSlot', host).replaceWith(sound.el);
    bS = UI.switchEl({ label: 'Opening bell', checked: prefs.bellStart }); bE = UI.switchEl({ label: 'Closing bell', checked: prefs.bellEnd });
    const sel = h(`<select class="select" id="bEvery" style="width:auto"><option value="0">No interval bells</option><option value="5">Every 5 min</option><option value="10">Every 10 min</option></select>`); sel.value = String(prefs.bellEvery);
    $('#bSlot', host).append(bS.el, bE.el, sel);
    host.addEventListener('click', (e) => { const b = e.target.closest('[data-m]'); if (!b) return; mins = +b.dataset.m; $$('#durs [data-m]', host).forEach((x) => x.setAttribute('aria-pressed', x === b)); });
  }
  const r = await p; if (vc) vc.destroy(); if (!r) return null;                                  // a preview that is still playing stops with the sheet
  const voiceSwitch = r.voiceSwitch; delete r.voiceSwitch;
  if (pr.path) MED.setPrefs(Object.assign({ guide: r.guide, voiceOn: voiceSwitch }, r.word ? { pathWord: r.word } : {})); // Path sits don't overwrite your Meditate defaults
  else if (!pr.fixed) MED.setPrefs({ guide: r.guide, voiceOn: voiceSwitch, sound: r.sound, bellStart: r.bells.start, bellEnd: r.bells.end, bellEvery: r.bells.every, pacer: r.pacer || MED.prefs().pacer }); else MED.setPrefs({ guide: r.guide, voiceOn: voiceSwitch });
  return runSit(Object.assign({ practice: practiceId }, extra, r));
}

function quickOpts(practice, minutes, planStep = null) {
  const p = MED.prefs(); const voice = MED.voice(p);
  return practice === 'ground' ? { practice, minutes: 2.5, guide: 'text', voice: Speech.ok && p.voiceOn === true, sound: 'none', bells: { start: false, every: 0, end: true } }
    : { practice, minutes, guide: p.guide, voice, sound: p.sound, bells: { start: p.bellStart, end: p.bellEnd, every: p.bellEvery }, planStep };
}

/* ───────────── page ───────────── */
Pages.meditate = {
  mount(root) {
    const prefs = MED.prefs(); const log = MED.log(); const st = medStats(log);
    const planOn = prefs.planOn && prefs.planStep < PLAN.length; const planDone = prefs.planOn && prefs.planStep >= PLAN.length;
    const last = log[log.length - 1];
    const sug = planOn ? { practice: PLAN[prefs.planStep].practice, minutes: PLAN[prefs.planStep].min, planStep: prefs.planStep, label: `Step ${prefs.planStep + 1} of ${PLAN.length} of your way back`, note: PLAN[prefs.planStep].note }
      : last ? { practice: last.practice === 'ground' ? 'breath' : last.practice, minutes: clamp(Math.round(last.minutesPlanned) || 5, 3, 30), label: 'Same as last time', note: '' }
        : { practice: 'breath', minutes: 5, label: 'A good place to begin', note: 'Rest your attention on the breath. When it wanders, notice, and come back.' };
    const sp = practiceById(sug.practice);
    root.innerHTML = `<div class="page-head fade-in"><div><h1>Meditate</h1><p>Short, grounded sits — and a gentle way back if you’ve lost your touch. “Deep” comes from showing up regularly, not from tricks.</p></div></div>
    <section class="card glow med-hero fade-in"><div class="grid c2" style="align-items:center;gap:24px"><div class="stack sm">
        <div class="eyebrow">${esc(sug.label)}</div><h2 style="font-size:28px">${esc(sp.name)} · ${fmtMin(sug.minutes)}</h2>${sug.note ? `<p class="t2" style="margin:0">${esc(sug.note)}</p>` : ''}
        <div class="row" style="margin-top:6px"><button class="btn primary lg" id="medStart">${icon('play')}Start</button><button class="btn" id="medOpts">Options…</button><button class="btn ghost" id="medGround">${icon('shield')}Feeling anxious or spacey? Ground (2½ min)</button></div>
        <div class="small muted">${prefs.guide === 'bells' ? 'Bells only' : prefs.voiceOn && Speech.ok ? 'Voice + text' : 'Text guidance'} · ${{ none: 'silence', noise: 'soft noise', theta: 'a slow tone with soft noise', alpha: 'a faster tone with soft noise' }[prefs.sound]} · change below</div></div>
      <div class="center"><div class="orb static" aria-hidden="true"></div></div></div></section>

    <div class="grid c2" style="margin-top:16px">
      <section class="card fade-in" id="planCard"></section>
      <section class="card fade-in"><div class="card-title"><h3>${icon('chart')}Your practice</h3></div><div class="stack sm">
        <div class="grid c3" style="gap:10px"><div class="card tight flat"><div class="eyebrow">This week</div><div class="mono" style="font-size:22px">${st.sessionsWeek}<span class="muted small"> sits</span></div></div><div class="card tight flat"><div class="eyebrow">Minutes</div><div class="mono" style="font-size:22px">${st.minutesWeek}</div></div><div class="card tight flat"><div class="eyebrow">Last 28 days</div><div class="mono" style="font-size:22px">${st.activeDays}<span class="muted small"> days</span></div></div></div>
        <div class="strip" aria-label="Days you sat in the last 28 days">${st.days.map((d) => `<i class="${d.min >= 1 ? 'on' : ''}" title="${d.date}: ${Math.round(d.min)} min"></i>`).join('')}</div>
        <div class="small t2">${st.total ? (st.settled.n >= 3 ? `On average you felt <b>${fmt.signed(st.settled.mean, 1)}</b> more settled after sitting (${st.settled.n} sits${isNum(st.busy.mean) ? `; mind ${fmt.signed(st.busy.mean, 1)} busier` : ''}) — small samples, but it’s <i>your</i> data.` : `${st.total} sit${st.total === 1 ? '' : 's'} so far. After a few with the check-in sliders, you’ll see what sitting does for you.`) : 'Nothing logged yet. Your first sit takes three minutes.'}</div>
        <div class="hint">Gaps are normal. The only thing that matters is the next sit.</div></div></section></div>

    <h2 style="margin:26px 0 12px">Choose a practice</h2>
    <div class="grid auto-lg fade-in" id="pgrid">${PRACTICES.map((p) => `<article class="card pcard" data-p="${p.id}" tabindex="0" role="button" aria-label="${esc(p.name)}"><div class="top"><h3>${esc(p.name)}</h3>${UI.evidence(p.evidence, false)}</div><div class="blurb">${esc(p.blurb)}</div><div class="foot"><span class="tag">${p.mins.map(fmtMin).join(' · ')}</span><button class="btn sm primary" data-start="${p.id}">${icon('play')}Set up</button></div></article>`).join('')}</div>

    <div class="grid c2" style="margin-top:22px;align-items:start">
      <section class="card fade-in" id="guideCard"></section>
      <section class="card fade-in"><div class="card-title"><h3>${icon('shield')}Go gently</h3></div><div class="stack sm small t2">
        <p>${expandRefs('Mindfulness has real but modest benefits — mostly for anxiety, low mood and pain ({{r:goyal2014}}). It can also stir up difficult experiences in some people: about 8% in trials, more in surveys of meditators ({{r:farias2020}}).')}</p>
        <ul><li>Keep sits short while you rebuild. Eyes open is fine.</li><li>If it brings anxiety, a sense of unreality, or unsettling thoughts, stop — use <b>Ground</b> — and don’t push through.</li><li>If you have a history of psychosis, mania or severe trauma, or you’re feeling unwell, stay with short breath sits or Ground, avoid long open-awareness or deep-rest sits, and talk with a clinician first.</li><li>Meditation isn’t a treatment. If low mood or worry lasts more than a couple of weeks, please see a doctor.</li></ul></div></section></div>

    <section class="card fade-in" style="margin-top:16px"><div class="card-title"><h3>${icon('learn')}When it’s not working</h3></div><div id="trouble"></div></section>
    <section class="card flat fade-in" style="margin-top:16px"><div class="card-title"><h3>${icon('globe')}Who else practised this?</h3></div><p class="t2 small" style="max-width:70ch">People have sat in silence, breathed, chanted and prayed for thousands of years. The map shows which traditions used each way of reaching toward the divine, and where and when.</p><div class="row tight">${[['meditation', 'Meditation'], ['yoga', 'Yoga and breath'], ['mysticism', 'Mystical union'], ['chant_mantra', 'Chant and mantra'], ['prayer', 'Prayer']].map(([k, n]) => `<a class="chip" href="#/atlas?p=${k}&y=2026">${n}</a>`).join('')}</div></section>
    ${log.length ? `<section class="card fade-in" style="margin-top:16px"><div class="card-title"><h3>Recent sits</h3><button class="btn sm ghost danger" id="medClear">Clear</button></div><div class="table-wrap"><table class="stat-table"><tr><th>When</th><th>Practice</th><th>Length</th><th>Settled</th><th>Got in the way</th></tr>${log.slice(-8).reverse().map((l) => `<tr><td>${fmt.dt(l.t)}</td><td>${esc((practiceById(l.practice) || { name: l.practice }).name)}</td><td class="mono">${l.minutesActual} min${l.completed ? '' : ' (short)'}</td><td class="mono">${isNum(l.preSettled) && isNum(l.postSettled) ? `${l.preSettled} → ${l.postSettled}` : '·'}</td><td>${esc((l.obstacles || []).join(', ') || '·')}</td></tr>`).join('')}</table></div></section>` : ''}`;

    /* plan card */
    const planCard = $('#planCard', root);
    const planSteps = (cur) => `<div class="plan">${PLAN.map((s, i) => `<span class="pstep ${i < cur ? 'done' : i === cur ? 'next' : ''}" title="Step ${i + 1}: ${fmtMin(s.min)} ${practiceById(s.practice).name.toLowerCase()}">${i + 1}</span>`).join('')}</div>`;
    if (planOn) planCard.innerHTML = `<div class="card-title"><h3>${icon('target')}Your way back</h3><button class="btn sm ghost" id="planOff">Stop plan</button></div><div class="stack sm">${planSteps(prefs.planStep)}<div class="small t2"><b>Step ${prefs.planStep + 1}:</b> ${fmtMin(PLAN[prefs.planStep].min)} ${practiceById(PLAN[prefs.planStep].practice).name.toLowerCase()}. ${esc(PLAN[prefs.planStep].note)}</div><div class="hint">The plan moves on when you complete a sit — not on a calendar. Miss a few days and nothing is lost; you just pick up at the next step.</div></div>`;
    else if (planDone) planCard.innerHTML = `<div class="card-title"><h3>${icon('target')}Your way back</h3><button class="btn sm ghost" id="planRestart">Restart</button></div><div class="stack sm">${planSteps(PLAN.length)}<div class="callout good">${icon('check')}<div>You finished all 14 steps. Keep it small and regular — three to ten minutes, most days — and let the longer sits come when they come.</div></div></div>`;
    else planCard.innerHTML = `<div class="card-title"><h3>${icon('target')}A gentle way back</h3></div><div class="stack sm"><p class="t2">Lost your touch? Almost everyone does after a break, and the fix is boring: start tiny. Fourteen steps from <b>3 minutes</b> to <b>12</b>, moving on each time you finish a sit — no streaks, no catching up.</p>${planSteps(0)}<button class="btn primary" id="planOn">Start the way back</button></div>`;

    /* guidance card: text or bells, the "Add a voice" switch (off until turned on), and, when it is on, the voice chooser and the speaking speed */
    const gc = $('#guideCard', root); const gs = MED.prefs(); let vcPage = null;
    gc.innerHTML = `<div class="card-title"><h3>${icon('gear')}Guidance &amp; sound defaults</h3></div><div class="stack sm"><div class="field"><label class="lbl">Guidance</label><div id="g_guide"></div></div>
      ${Speech.ok ? '<div class="field" id="g_voiceF"><div id="g_vox"></div><div class="hint">Off unless you turn it on. The words always show; a voice from your device reads them aloud. The same voice reads aloud in the Library.</div><div id="g_vopts" class="stack sm" style="margin-top:10px" hidden><div id="g_vc"></div><div id="g_rate"></div></div></div>' : '<div class="hint">This browser has no built-in speech voices, so guidance appears as text.</div>'}
      <div class="field"><label class="lbl">Sound during sits</label><div id="g_sound"></div></div><div id="g_vol"></div>
      <div class="row"><div id="g_bs"></div><div id="g_be"></div></div><div id="g_time"></div></div>`;
    const syncVoice = () => { if (!Speech.ok) return; const q = MED.prefs(); $('#g_voiceF', gc).hidden = q.guide === 'bells'; $('#g_vopts', gc).hidden = !q.voiceOn; };
    const gg = UI.seg({ label: 'Guidance', options: [{ v: 'text', label: 'Text' }, { v: 'bells', label: 'Bells only' }], value: gs.guide, onChange: (v) => { MED.setPrefs({ guide: v }); syncVoice(); } }); $('#g_guide', gc).replaceWith(gg.el);
    const gsnd = UI.seg({ label: 'Sound', options: [{ v: 'none', label: 'Silence' }, { v: 'noise', label: 'Soft noise' }, { v: 'theta', label: 'A slow tone with soft noise' }, { v: 'alpha', label: 'A faster tone with soft noise' }], value: gs.sound, onChange: (v) => MED.setPrefs({ sound: v }) }); $('#g_sound', gc).replaceWith(gsnd.el);
    const gv = UI.slider({ id: 'gvol', label: 'Sound & bell volume', min: 0.05, max: 1, step: 0.01, value: MED.volume(), dec: 2, fmtFn: (v) => Math.round(v * 100) + '%', ends: ['quiet', 'louder'], info: 'Quiet is right. Calibrate once in Setup → Level (soft rain or a distant fan), and keep it low enough that the closing bell never startles you.', onInput: (v) => MED.setPrefs({ volume: v }) }); $('#g_vol', gc).replaceWith(gv.el);
    const gbs = UI.switchEl({ label: 'Opening bell', checked: gs.bellStart, onChange: (v) => MED.setPrefs({ bellStart: v }) }); const gbe = UI.switchEl({ label: 'Closing bell', checked: gs.bellEnd, onChange: (v) => MED.setPrefs({ bellEnd: v }) }); $('#g_bs', gc).replaceWith(gbs.el); $('#g_be', gc).replaceWith(gbe.el);
    const gt = UI.switchEl({ label: 'Show time remaining', checked: gs.showTime, onChange: (v) => MED.setPrefs({ showTime: v }) }); $('#g_time', gc).replaceWith(gt.el);
    if (Speech.ok) {
      const gx = UI.switchEl({ label: 'Add a voice', checked: gs.voiceOn, onChange: (v) => { MED.setPrefs({ voiceOn: v }); if (!v) Speech.cancel(); syncVoice(); } }); $('#g_vox', gc).replaceWith(gx.el);
      const gr = UI.slider({ id: 'grate', label: 'Speaking speed', min: 0.6, max: 1.1, step: 0.01, value: gs.rate, dec: 2, fmtFn: (v) => v.toFixed(2) + '×', ends: ['slower', 'faster'], onInput: (v) => MED.setPrefs({ rate: v }) }); $('#g_rate', gc).replaceWith(gr.el);
      vcPage = voiceChooser($('#g_vc', gc), { style: 'guide', settings: () => { const q = MED.prefs(); return { rate: q.rate, volume: q.voiceVol }; } }); syncVoice();
    }
    UI.wireInfo(gc);

    /* troubleshooting accordion */
    $('#trouble', root).innerHTML = MED_TROUBLE.map(([q, a], i) => `<section class="acc" data-i="${i}" style="margin-top:${i ? 10 : 0}px"><button type="button" aria-expanded="false"><span class="t"><b style="font-size:15px">${q}</b></span>${icon('chevron')}</button><div class="body">${expandRefs(a)}</div></section>`).join('');

    /* events */
    const startSug = () => runSit(quickOpts(sug.practice, sug.minutes, sug.planStep != null ? sug.planStep : null));
    $('#medStart', root).addEventListener('click', startSug);
    $('#medOpts', root).addEventListener('click', () => openSheet(sug.practice, sug.minutes, sug.planStep != null ? sug.planStep : null));
    $('#medGround', root).addEventListener('click', () => runSit(quickOpts('ground', 2.5)));
    $('#pgrid', root).addEventListener('click', (e) => { const c = e.target.closest('.pcard'); if (c) openSheet(c.dataset.p); });
    $('#pgrid', root).addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.classList.contains('pcard')) e.target.click(); });
    root.addEventListener('click', async (e) => {
      const a = e.target.closest('.acc > button'); if (a) { const s = a.parentElement; const on = s.classList.toggle('open'); a.setAttribute('aria-expanded', on); return; }
      if (e.target.closest('#planOn')) { MED.setPrefs({ planOn: true, planStep: 0 }); Router.render(); }
      else if (e.target.closest('#planRestart')) { MED.setPrefs({ planOn: true, planStep: 0 }); Router.render(); }
      else if (e.target.closest('#planOff')) { MED.setPrefs({ planOn: false }); Router.render(); }
      else if (e.target.closest('#medClear')) { if (await confirmBox('Clear your sit history?', '<p>This removes the log of sits (not your presets or journal).</p>', 'Clear', 'danger')) { store.del('meditation.log'); Router.render(); } }
    });
    return () => { Speech.cancel(); if (vcPage) vcPage.destroy(); };
  },
};
