/* ═══════════════════════════ 63 · full-screen tasks (overlay runner) ═══════════════════════════
   Every task is a function (overlay, options) → Promise<result>. Leaving the overlay rejects with Abort. */
class Abort extends Error { constructor() { super('aborted'); this.aborted = true; } }

function openOverlay(title = '') {
  const el = h(`<div class="overlay" role="dialog" aria-modal="true"><div class="overlay-bar"><div class="eyebrow" data-title>${esc(title)}</div><button class="btn sm ghost" data-exit>${icon('x')}Exit</button></div><div class="overlay-body"></div></div>`);
  document.body.appendChild(el); document.body.style.overflow = 'hidden';
  const ov = {
    el, body: $('.overlay-body', el), cleanups: [], pending: null, closed: false,
    title(t) { $('[data-title]', el).textContent = t; },
    screen(render) { return new Promise((resolve, reject) => { ov.pending = { reject }; ov.body.className = 'overlay-body'; ov.body.innerHTML = ''; ov.body.scrollTop = 0; el.scrollTop = 0; render(ov.body, (v) => { ov.pending = null; ov.runCleanups(); resolve(v); }); }); },
    onCleanup(fn) { ov.cleanups.push(fn); },
    runCleanups() { ov.cleanups.splice(0).forEach((f) => { try { f(); } catch (e) { /* noop */ } }); },
    close() { if (ov.closed) return; ov.closed = true; ov.runCleanups(); el.remove(); document.body.style.overflow = ''; Mini.refresh(); },
    async tryExit() { if (await confirmBox('Leave this session?', '<p>Whatever you haven’t finished in this session won’t be saved.</p>', 'Leave', 'danger')) { ov.runCleanups(); if (ov.pending) ov.pending.reject(new Abort()); else ov.close(); } },
  };
  $('[data-exit]', el).addEventListener('click', () => ov.tryExit());
  el.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.stopPropagation(); ov.tryExit(); } });
  Mini.refresh();
  return ov;
}

/* generic message screen */
function screenInfo(ov, { title, text, button = 'Continue', icon: ic = '' }) {
  return ov.screen((body, done) => {
    body.innerHTML = `${ic ? `<div style="font-size:44px;margin-bottom:6px">${ic}</div>` : ''}<div class="task-title">${title}</div><div class="task-sub">${text}</div><button class="btn primary lg" id="go">${button}</button>`;
    $('#go', body).addEventListener('click', () => done(true)); $('#go', body).focus();
  });
}

/* ── how-do-you-feel sliders ── */
const VAS_ITEMS = [
  { k: 'calm', q: 'How calm do you feel right now?', lo: 'Tense', hi: 'Calm' },
  { k: 'energy', q: 'How energised do you feel?', lo: 'Drained', hi: 'Energised' },
  { k: 'focus', q: 'How well can you focus?', lo: 'Scattered', hi: 'Sharp' },
  { k: 'mood', q: 'How is your mood?', lo: 'Low', hi: 'Great' },
  { k: 'motivation', q: 'How motivated do you feel?', lo: 'No drive', hi: 'Driven' },
  { k: 'creativity', q: 'How creative do you feel?', lo: 'Blocked', hi: 'Flowing' },
];
function taskVAS(ov, { title = 'How do you feel right now?', sub = 'Drag each slider to where it fits. Go with your first instinct.', items = VAS_ITEMS, withHR = false, cta = 'Continue', skip = false } = {}) {
  return ov.screen((body, done) => {
    body.innerHTML = `<div class="task-title">${title}</div><div class="task-sub">${sub}</div>
      <div class="stack" style="width:100%;max-width:560px">${items.map((it) => `<div class="vas" data-k="${it.k}"><div class="q">${it.q}</div><input type="range" class="range untouched" min="0" max="100" value="50" aria-label="${esc(it.q)}"><div class="ends"><span>${it.lo}</span><span>${it.hi}</span></div></div>`).join('')}
      ${withHR ? `<div class="field"><label class="lbl" for="hr">Heart rate right now (bpm) — optional, from a watch</label><input class="input num" id="hr" inputmode="numeric" placeholder="e.g. 68"></div>` : ''}
      <div class="row" style="justify-content:center;margin-top:6px"><button class="btn primary lg" id="go" disabled>${cta}</button>${skip ? '<button class="btn ghost" id="skip">Skip</button>' : ''}</div><div class="hint center" id="hint">Move every slider at least once to continue.</div></div>`;
    if (skip) $('#skip', body).addEventListener('click', () => done(null));
    const go = $('#go', body); const touched = new Set();
    $$('.vas', body).forEach((v) => { const r = $('.range', v); r.style.setProperty('--p', '50%'); r.addEventListener('input', () => { r.classList.remove('untouched'); r.style.setProperty('--p', r.value + '%'); touched.add(v.dataset.k); if (touched.size === items.length) { go.disabled = false; $('#hint', body).textContent = ''; } }); });
    go.addEventListener('click', () => { const out = {}; $$('.vas', body).forEach((v) => { out[v.dataset.k] = +$('.range', v).value; }); if (withHR) { const hr = parseFloat($('#hr', body).value); if (hr > 20 && hr < 250) out.hr = hr; } done(out); });
  });
}

/* ── psychomotor vigilance (brief PVT; after Basner et al. 2011) ── */
function taskPVT(ov, o = {}) {
  const secs = o.seconds || 120; const [isiLo, isiHi] = o.isi || [1000, 4000]; const lapse = o.lapse || 355;
  return ov.screen((body, done) => {
    body.innerHTML = `<div class="task-title">Reaction test</div><div class="task-sub">When the red counter appears, press <span class="kbd">Space</span> (or tap the box) as fast as you can. Don’t press early. About ${Math.round(secs / 6) / 10} minutes.</div>
      <div class="pvt-box" id="pvt" role="button" tabindex="0" aria-label="Reaction box">+</div><div class="row" style="margin-top:22px;justify-content:center"><button class="btn primary lg" id="go">Start</button><span class="muted small" id="info"></span></div>`;
    const box = $('#pvt', body), go = $('#go', body), info = $('#info', body);
    let timer = 0, stimTimer = 0, tickT = 0, onset = 0, stimOn = false, running = false, endAt = 0, raf = 0; const rts = []; let fs = 0;
    const cleanup = () => { clearTimeout(timer); clearTimeout(stimTimer); clearInterval(tickT); cancelAnimationFrame(raf); window.removeEventListener('keydown', onKey, true); };
    ov.onCleanup(cleanup);
    const counter = () => { if (!stimOn) return; box.textContent = Math.round(performance.now() - onset); raf = requestAnimationFrame(counter); };
    const schedule = () => { if (performance.now() > endAt) return finish(); timer = setTimeout(show, isiLo + randFloat() * (isiHi - isiLo)); };
    function show() { raf = requestAnimationFrame(() => { onset = performance.now(); stimOn = true; box.classList.add('on'); counter(); stimTimer = setTimeout(() => { if (stimOn) { stimOn = false; rts.push(8000); box.classList.remove('on'); box.textContent = '—'; timer = setTimeout(() => { box.textContent = '+'; schedule(); }, 600); } }, 8000); }); }
    function respond(ts) {
      if (!running) return;
      if (!stimOn) { fs++; clearTimeout(timer); box.textContent = '✕'; timer = setTimeout(() => { box.textContent = '+'; schedule(); }, 900); return; }
      const rt = ts - onset; stimOn = false; clearTimeout(stimTimer); cancelAnimationFrame(raf); box.classList.remove('on'); box.textContent = Math.round(rt);
      if (rt < 100) fs++; else rts.push(rt);
      timer = setTimeout(() => { box.textContent = '+'; schedule(); }, 800);
    }
    function onKey(e) { if (e.code === 'Space') { e.preventDefault(); e.stopPropagation(); if (!e.repeat) respond(e.timeStamp); } }
    function finish() {
      running = false; cleanup(); const v = rts.filter((r) => r < 8000);
      done({ n: rts.length, medianRT: Stats.median(rts), meanRT: Stats.mean(rts), invRT: Stats.mean(rts.map((r) => 1000 / r)), lapses: rts.filter((r) => r > lapse).length, falseStarts: fs, lapseMs: lapse, fastest10: Stats.mean(rts.slice().sort((a, b) => a - b).slice(0, Math.max(1, Math.round(rts.length * 0.1)))), valid: v.length });
    }
    box.addEventListener('pointerdown', (e) => { e.preventDefault(); respond(e.timeStamp); });
    go.addEventListener('click', async () => {
      go.hidden = true; window.addEventListener('keydown', onKey, true);
      for (let c = 3; c >= 1; c--) { box.textContent = c; await sleep(800); if (ov.closed) return; }
      box.textContent = '+'; running = true; endAt = performance.now() + secs * 1000;
      tickT = setInterval(() => { info.textContent = Math.max(0, Math.ceil((endAt - performance.now()) / 1000)) + ' s left'; }, 500); schedule();
    });
  });
}

/* ── n-back (letters) ── */
function taskNBack(ov, o = {}) {
  const n = o.n || 2; const trials = o.trials || 60; const stimMs = 500, trialMs = 2000;
  return ov.screen((body, done) => {
    body.innerHTML = `<div class="task-title">${n}-back memory task</div><div class="task-sub">Letters appear one at a time. Press <span class="kbd">Space</span> (or the button) whenever the current letter is the <b>same as the one ${n} back</b>. Otherwise do nothing. About ${Math.round((trials * trialMs) / 6000) / 10} minutes.</div>
      <div class="nb-letter" id="nb"></div><div class="row" style="margin-top:20px;justify-content:center"><button class="btn primary lg" id="go">Start</button><button class="btn lg" id="match" hidden>Match</button></div><div class="muted small" id="info" style="margin-top:10px"></div>`;
    const el = $('#nb', body), go = $('#go', body), matchBtn = $('#match', body), info = $('#info', body);
    const L = 'BCDFGHJKLMNPQRSTVWXZ'.split(''); const seq = [], isT = [];
    for (let i = 0; i < trials; i++) { if (i >= n && randFloat() < 0.3) { seq.push(seq[i - n]); isT.push(true); } else { let c; do { c = L[randInt(L.length)]; } while (i >= n && c === seq[i - n]); seq.push(c); isT.push(false); } }
    let idx = -1, onsetT = 0, responded = false, rt = 0, startT = 0, timer = 0, hideT = 0; let H = 0, M = 0, FA = 0, CR = 0; const hitRTs = [];
    const cleanup = () => { clearTimeout(timer); clearTimeout(hideT); window.removeEventListener('keydown', onKey, true); };
    ov.onCleanup(cleanup);
    const score = () => { if (idx < n) return; if (isT[idx] && responded) { H++; hitRTs.push(rt); } else if (isT[idx]) M++; else if (responded) FA++; else CR++; };
    function resp(ts) { if (idx < 0 || responded) return; responded = true; rt = ts - onsetT; el.classList.add(isT[idx] ? 'hit' : 'miss'); }
    function onKey(e) { if (e.code === 'Space') { e.preventDefault(); e.stopPropagation(); if (!e.repeat) resp(e.timeStamp); } }
    function step() {
      score(); idx++; el.classList.remove('hit', 'miss');
      if (idx >= trials) return finish();
      responded = false; onsetT = performance.now(); el.textContent = seq[idx]; hideT = setTimeout(() => { el.textContent = ''; }, stimMs);
      info.textContent = `${idx + 1} / ${trials}`; timer = setTimeout(step, Math.max(0, startT + (idx + 1) * trialMs - performance.now()));
    }
    function finish() { cleanup(); const total = H + M + FA + CR; done({ n, trials: total, hits: H, misses: M, falseAlarms: FA, correctRejections: CR, dprime: Stats.dprime(H, M, FA, CR), acc: total ? (H + CR) / total : NaN, hitRT: Stats.mean(hitRTs) }); }
    matchBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); resp(e.timeStamp); });
    go.addEventListener('click', async () => {
      go.hidden = true; matchBtn.hidden = false; window.addEventListener('keydown', onKey, true);
      for (let c = 3; c >= 1; c--) { el.textContent = c; await sleep(700); if (ov.closed) return; } el.textContent = '';
      startT = performance.now(); step();
    });
  });
}

/* ── word-association puzzles (creative convergent thinking) ── */
const normWord = (s) => String(s || '').toLowerCase().replace(/[^a-z]/g, '');
function taskRAT(ov, o = {}) {
  const count = o.count || 10, secPer = o.secPerItem || 30; const used = new Set(o.used || []);
  let pool = RAT_ITEMS.filter((it) => !used.has(it.id)); if (pool.length < count) pool = RAT_ITEMS.slice();
  const items = shuffle(pool).slice(0, count);
  return ov.screen(async (body, done) => {
    body.innerHTML = `<div class="task-title">Word puzzles</div><div class="task-sub">Each puzzle shows three words. Find <b>one</b> word that goes with all three (for example <i>cream · skate · water</i> → <b>ice</b>). ${count} puzzles, ${secPer} seconds each. Press <span class="kbd">Enter</span> to submit.</div><button class="btn primary lg" id="go">Start</button>`;
    $('#go', body).addEventListener('click', async () => {
      const res = []; let aborted = false; ov.onCleanup(() => { aborted = true; });
      for (let i = 0; i < items.length && !aborted; i++) {
        const it = items[i];
        const r = await new Promise((resolve) => {
          body.innerHTML = `<div class="eyebrow">Puzzle ${i + 1} of ${items.length}</div><div class="task-title" style="font-size:clamp(28px,6vw,44px);margin:18px 0 22px">${it.words.map(esc).join(' · ')}</div>
            <input class="input" id="ans" autocomplete="off" autocapitalize="off" spellcheck="false" style="max-width:340px;text-align:center;font-size:22px" aria-label="Your answer"><div class="progress" style="width:min(340px,80vw);margin-top:18px"><i id="bar"></i></div>
            <div class="row" style="margin-top:18px"><button class="btn primary" id="ok">Submit</button><button class="btn ghost" id="skip">Skip</button></div>`;
          const inp = $('#ans', body); inp.focus(); const t0 = performance.now(); let fin = false;
          const end = (given) => { if (fin) return; fin = true; clearInterval(iv); resolve({ given, rt: performance.now() - t0 }); };
          const iv = setInterval(() => { const f = (performance.now() - t0) / (secPer * 1000); const b = $('#bar', body); if (b) b.style.width = clamp(f, 0, 1) * 100 + '%'; if (f >= 1) end(inp.value); }, 100);
          ov.onCleanup(() => { clearInterval(iv); });
          $('#ok', body).addEventListener('click', () => end(inp.value)); $('#skip', body).addEventListener('click', () => end(''));
          inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') end(inp.value); });
        });
        res.push({ id: it.id, answer: it.answer, given: r.given.trim(), rt: r.rt, correct: normWord(r.given) === it.answer });
      }
      if (aborted) return; ov.pending = null; ov.runCleanups(); done({ correct: res.filter((x) => x.correct).length, total: res.length, items: res, ids: res.map((x) => x.id), meanRT: Stats.mean(res.filter((x) => x.correct).map((x) => x.rt)) });
    });
  });
}

/* ── alternate uses (divergent thinking) ── */
function taskAUT(ov, o = {}) {
  const obj = o.object || pick(AUT_OBJECTS); const secs = o.seconds || 120;
  return ov.screen((body, done) => {
    body.innerHTML = `<div class="task-title">Alternate uses</div><div class="task-sub">List as many <b>unusual, creative uses</b> as you can for a <b style="color:var(--accent2)">${esc(obj)}</b> — one per line. Quantity and originality both count. ${Math.round(secs / 60)} minutes.</div><button class="btn primary lg" id="go">Start</button>`;
    $('#go', body).addEventListener('click', () => {
      body.innerHTML = `<div class="eyebrow">Uses for a ${esc(obj)}</div><textarea class="textarea" id="ta" style="width:min(620px,92vw);min-height:240px;margin-top:12px" placeholder="One idea per line…" aria-label="Ideas"></textarea><div class="progress" style="width:min(620px,92vw);margin-top:14px"><i id="bar"></i></div><div class="row spread" style="width:min(620px,92vw);margin-top:12px"><span class="muted small" id="cnt">0 ideas</span><button class="btn primary" id="fin">Done</button></div>`;
      const ta = $('#ta', body); ta.focus(); const t0 = performance.now(); let fin = false;
      const ideas = () => Array.from(new Set(ta.value.split('\n').map((s) => s.trim().toLowerCase()).filter((s) => s.length > 1)));
      const end = () => {
        if (fin) return; fin = true; clearInterval(iv); const list = ideas();
        body.innerHTML = `<div class="task-title">${list.length} ideas</div><div class="task-sub">Quick self-rating: how original were your ideas overall?</div><div class="seg" id="orig">${[1, 2, 3, 4, 5].map((i) => `<button data-v="${i}" aria-pressed="false">${i}</button>`).join('')}</div><div class="ctl-ends" style="width:240px"><span>ordinary</span><span>very original</span></div><button class="btn primary lg" id="go2" style="margin-top:22px" disabled>Continue</button>`;
        let sel = null; $('#orig', body).addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; sel = +b.dataset.v; $$('#orig button', body).forEach((x) => x.setAttribute('aria-pressed', x === b)); $('#go2', body).disabled = false; });
        $('#go2', body).addEventListener('click', () => done({ object: obj, ideas: list, fluency: list.length, originalitySelf: sel }));
      };
      const iv = setInterval(() => { const f = (performance.now() - t0) / (secs * 1000); const b = $('#bar', body); if (b) b.style.width = clamp(f, 0, 1) * 100 + '%'; const c = $('#cnt', body); if (c && !fin) c.textContent = ideas().length + ' ideas'; if (f >= 1) end(); }, 200);
      ov.onCleanup(() => clearInterval(iv)); $('#fin', body).addEventListener('click', end);
    });
  });
}

/* ── listening screen: plays the (hidden) condition ── */
function screenAudio(ov, { cfg, minutes, blurb = 'Headphones on, volume comfortable. Sit or lie back, eyes closed or soft-focused, and let the sound play. No phone.' }) {
  return ov.screen((body, done) => {
    body.innerHTML = `<div class="task-title">Listening session</div><div class="task-sub">${blurb}</div>
      <div class="ring" id="ring"><div><div class="big" id="rt">${fmt.time(minutes * 60)}</div><div class="muted small">remaining</div></div></div>
      <div class="row" style="margin-top:26px;justify-content:center"><button class="btn primary lg" id="go">${icon('play')}Start audio</button><button class="btn ghost" id="stop" hidden>Stop early</button></div><div class="hint center" style="margin-top:12px">Your condition stays hidden until the experiment is complete.</div>`;
    let iv = 0; let finished = false; let off = null;
    const finish = (early) => { if (finished) return; finished = true; clearInterval(iv); if (off) off(); done({ early: !!early, seconds: Math.round(Engine.position()) || minutes * 60 }); };
    ov.onCleanup(() => { clearInterval(iv); if (off) off(); if (!finished) Engine.stop(0.3); });
    $('#go', body).addEventListener('click', async () => {
      $('#go', body).hidden = true; $('#stop', body).hidden = false;
      try { await Engine.play(Object.assign({}, cfg, { duration: minutes, useTimeline: cfg.useTimeline }), { name: 'Experiment session', experiment: true }); } catch (e) { toast('Audio could not start: ' + esc(e.message), 'bad'); $('#go', body).hidden = false; return; }
      const total = Engine.duration();
      iv = setInterval(() => { const p = Engine.position(); $('#ring', body).style.setProperty('--p', clamp(p / total, 0, 1) * 100); $('#rt', body).textContent = fmt.time(Math.max(0, total - p)); }, 250);
      off = Engine.on('state', (s) => { if (s === 'idle') finish(false); });
    });
    $('#stop', body).addEventListener('click', async () => { if (await confirmBox('Stop the audio early?', '<p>The session will be recorded as shortened. You can still do the after-measures.</p>', 'Stop early')) { Engine.stop(1); finish(true); } });
  });
}

/* ── blinding check ── */
function screenGuess(ov, labels) {
  return ov.screen((body, done) => {
    body.innerHTML = `<div class="task-title">Quick question</div><div class="task-sub">Which do you think you just heard? A guess is fine — this checks how well the blinding worked.</div>
      <div class="stack" style="width:min(420px,92vw)"><button class="opt" data-v="A"><b>${esc(labels.A)}</b></button><button class="opt" data-v="B"><b>${esc(labels.B)}</b></button><button class="opt" data-v="?"><b>No idea</b></button></div>`;
    body.addEventListener('click', (e) => { const b = e.target.closest('.opt'); if (b) done(b.dataset.v); });
  });
}
