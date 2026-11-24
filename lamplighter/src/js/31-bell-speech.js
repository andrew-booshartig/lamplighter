/* ═══════════════════════════ 31 · meditation bell (synthesised) + spoken guidance (browser voices) ═══════════════════════════ */
const Bell = (() => {
  /* bowl/bell partials: [frequency ratio, relative amplitude, seconds to −60 dB] — slightly detuned pairs give the slow shimmer */
  const PARTIALS = [[1, 1.0, 12], [2.71, 0.5, 8], [5.15, 0.24, 5], [8.12, 0.11, 3]];
  const NORM = 1.68; // measured: the summed partials peak ≈ 1.68 × the nominal amplitude, so `peak` is the true peak

  /* one strike. `when` is on the AudioContext clock; returns the time the sound has fully died away */
  function ring(ctx, dest, when, { f0 = 220, peak = 0.1, decay = 1, shimmer = 0.55 } = {}) {
    let end = when;
    PARTIALS.forEach(([ratio, amp, dec], i) => {
      [0, 1].forEach((k) => {
        const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f0 * ratio + (k ? shimmer * (1 + i * 0.4) : 0);
        const g = ctx.createGain(); const a = (peak * amp) / (2 * NORM); const d = dec * decay;
        g.gain.setValueAtTime(0, when); g.gain.linearRampToValueAtTime(a, when + 0.012); g.gain.exponentialRampToValueAtTime(Math.max(1e-6, a * 0.001), when + d);
        o.connect(g); g.connect(dest); o.start(when); o.stop(when + d + 0.05); end = Math.max(end, when + d + 0.05);
      });
    });
    return end;
  }
  const level = (volume) => Math.min(0.35, AudioCore.volToGain(volume) * 1.8);
  const buses = new WeakMap();
  function bus(ctx) { if (!buses.has(ctx)) { const g = ctx.createGain(); g.gain.value = 1; g.connect(ctx.destination); buses.set(ctx, g); } return buses.get(ctx); }

  /* named bells */
  const start = (ctx, when, volume, dest = bus(ctx)) => ring(ctx, dest, when, { f0: 220, peak: level(volume), decay: 1 });
  const interval = (ctx, when, volume, dest = bus(ctx)) => ring(ctx, dest, when, { f0: 294, peak: level(volume) * 0.7, decay: 0.55 });
  const finish = (ctx, when, volume, dest = bus(ctx)) => { let e = when; [[0, 1], [3.4, 0.8], [6.8, 0.65]].forEach(([dt, k]) => { e = ring(ctx, dest, when + dt, { f0: 220, peak: level(volume) * k, decay: 1 }); }); return e; };
  return { ring, start, interval, finish, level, bus };
})();

/* ═══════════════ the voice: one engine for the guided practices and for reading aloud ═══════════════
   Browser speech synthesis with the voices the device already has (nothing is sent anywhere by the app). What the maker heard as "chopped" had three causes, and this is the fix for each:
     · the best voice was chosen badly (a plain voice with a good name beat the Premium and Enhanced voices that were installed): the ranking is in 2z-listen-core.js (lsVoiceTier);
     · a whole cue or paragraph was handed over as one long utterance with no pause in it, and browsers cut a long one off after about fifteen seconds: it is now said sentence by sentence,
       each short enough, with a real silence between them (longer after a paragraph or a breath marked "…", more spacious in a guided practice than in a reading);
     · pausing used the browser's own pause, which on several systems never resumes (and can leave the voice stuck for the next time): a pause now stops the sentence and says it again from
       its start on resume, a watchdog gives up on a voice that never says it has finished, and cancel() always leaves the engine clean.
   One queue of "jobs" (a cue, a paragraph), each a list of pieces spoken one after the other. Callbacks: onPiece(i, piece) as a piece begins (the reader marks the sentence), onEnd(i, piece)
   when it has been said (before the silence after it), onDone() after the last piece and its silence, onFail(why) if the voice does not respond. The voice, speed and loudness are asked for
   again at every piece (settings(): {rate, volume, pitch, voiceURI}), so a change made while it speaks is heard from the next sentence, or at once with restart(). */
const Speech = (() => {
  const synth = typeof window !== 'undefined' && window.speechSynthesis ? window.speechSynthesis : null;
  const ok = !!(synth && typeof SpeechSynthesisUtterance !== 'undefined');
  const KEY = 'speech.voice'; const PITCH = 0.95; const PREVIEW = 'Let yourself arrive. Settle into a position you can hold at ease.';
  let all = []; const subs = [];                                     // every voice, best first (lsVoices); who wants to know when the list changes
  let gen = 0;                                                       // every stop, pause or new piece moves this on, so a late event from an earlier utterance is ignored
  let jobs = []; let phase = 'idle'; let paused = false;             // phase: idle | wait (about to speak) | speak | gap (the silence after a piece)
  let timer = null; let guard = null; let utt = null; let lastCancel = 0; let fails = 0;
  const english = () => all.filter(lsIsEnglish);
  const refresh = () => { try { all = lsVoices(synth.getVoices()); } catch (e) { all = []; } subs.slice().forEach((f) => { try { f(); } catch (e) { console.error(e); } }); };
  if (ok) {
    refresh(); try { synth.addEventListener('voiceschanged', refresh); } catch (e) { synth.onvoiceschanged = refresh; }
    [350, 1200, 3500].forEach((ms) => setTimeout(() => { if (!all.length) refresh(); }, ms));       // some browsers never announce that the list is ready
  }

  /* the voice that was chosen, kept for both the guided practices and the reader: the first time, whatever either of them had saved before */
  const prefNow = () => {
    let p = store.get(KEY, null);
    if (p === null) { const rd = store.get('reader.listen', null); const md = store.get('meditation.prefs', null); p = { uri: (rd && typeof rd.voice === 'string' && rd.voice) || (md && typeof md.voiceURI === 'string' && md.voiceURI) || '', name: '' }; }
    return lsVoicePref(p);
  };
  const choose = (uri) => { const v = all.find((x) => x.voiceURI === uri); store.set(KEY, lsVoicePref({ uri: uri || '', name: v ? v.name : '' })); };
  const voiceFor = (uri) => { const p = prefNow(); return lsPickVoice(all, uri !== undefined ? uri : p.uri, uri !== undefined ? '' : p.name); };
  const maxChars = (v) => { const c = v === undefined ? voiceFor() : v; return c && c.localService === false ? 150 : 240; };   // an online voice is cut off sooner, so it gets shorter pieces

  const clear = () => { clearTimeout(timer); clearTimeout(guard); timer = null; guard = null; };
  const hardStop = () => {                                           // stop the browser's speaking whatever state it is in, and leave it ready for the next utterance
    try { synth.cancel(); } catch (e) { /* none */ }
    try { if (synth.paused) synth.resume(); } catch (e) { /* none */ }   // a browser left paused would swallow whatever is said next
    lastCancel = Date.now();
  };
  function cancel() { gen++; clear(); jobs = []; phase = 'idle'; paused = false; utt = null; fails = 0; if (ok) hardStop(); }
  const give = (job, why) => { cancel(); try { if (job && job.opt.onFail) job.opt.onFail(why); } catch (e) { console.error(e); } };

  function pump() {
    if (paused) return; const job = jobs[0];
    if (!job) { phase = 'idle'; return; }
    if (job.i >= job.pieces.length) { jobs.shift(); phase = 'idle'; try { if (job.opt.onDone) job.opt.onDone(); } catch (e) { console.error(e); } if (phase === 'idle' && !paused) pump(); return; }     // onDone may have said something new, which has started by now
    speakPiece(job);
  }
  function speakPiece(job) {
    const piece = job.pieces[job.i]; const my = ++gen; phase = 'wait'; clear();
    const dyn = (typeof job.opt.settings === 'function' ? job.opt.settings() : null) || {};
    const rate = Math.min(2.5, Math.max(0.5, +(dyn.rate != null ? dyn.rate : job.opt.rate != null ? job.opt.rate : 0.85))); const volume = Math.min(1, Math.max(0, +(dyn.volume != null ? dyn.volume : job.opt.volume != null ? job.opt.volume : 1)));
    const pitch = +(dyn.pitch != null ? dyn.pitch : job.opt.pitch != null ? job.opt.pitch : PITCH); const voice = voiceFor(dyn.voiceURI !== undefined ? dyn.voiceURI : job.opt.voiceURI);
    const go = () => {
      if (my !== gen) return; timer = null;
      let ended = false; const t0 = Date.now(); const u = new SpeechSynthesisUtterance(piece.text);
      if (voice) { try { u.voice = voice; u.lang = voice.lang; } catch (e) { /* the device's own voice */ } } else u.lang = 'en';
      u.rate = rate; u.pitch = pitch; u.volume = volume;
      const finish = (why, err) => {
        if (ended || my !== gen) return; ended = true; clearTimeout(guard); utt = null;
        const outside = why === 'error' && (err === 'interrupted' || err === 'canceled') && job.retried !== job.i;       // stopped from outside (another program took the speech channel, say; seen in a real browser): the sentence is said again, once
        if (outside) job.retried = job.i; else if (why === 'end') fails = 0; else fails++;
        if (why === 'lost' || why === 'stuck') hardStop();            // never leave a voice that has not finished in the queue ahead of the next one
        try { if (job.opt.onEnd) job.opt.onEnd(job.i, piece, why); } catch (e) { console.error(e); }
        if (my !== gen) return;                                       // onEnd may have stopped it
        if (err === 'not-allowed') { give(job, 'blocked'); return; }
        if (fails >= 3) { give(job, 'silent'); return; }
        job.hold = outside; phase = 'gap';
        timer = setTimeout(() => { if (my !== gen) return; timer = null; if (!job.hold) job.i++; job.hold = false; phase = 'idle'; pump(); }, why === 'end' ? lsPauseMs(piece.kind, job.opt.style, rate) : outside ? 350 : 200);
      };
      u.onend = () => finish('end');
      u.onerror = (e) => finish('error', e && e.error);
      utt = u; phase = 'speak';
      try { if (job.opt.onPiece) job.opt.onPiece(job.i, piece); } catch (e) { console.error(e); }
      if (my !== gen) return;
      try { synth.speak(u); } catch (e) { finish('error', 'synthesis-failed'); return; }
      const est = lsSpeakMs(piece.text, rate, true) + (voice && voice.localService === false ? 4000 : 1500);
      const check = () => {                                           // the watchdog: a voice that goes quiet without saying so, or never ends, must not hold everything up
        if (my !== gen || ended) return; let busy = true; try { busy = !!(synth.speaking || synth.pending); } catch (e) { /* assume so */ }
        const age = Date.now() - t0; if (!busy) { finish('lost'); return; } if (age > est * 2 + 6000) { finish('stuck'); return; }
        guard = setTimeout(check, 1500);
      };
      guard = setTimeout(check, est);
    };
    const wait = lastCancel + 70 - Date.now();                        // a new utterance straight after a cancel is dropped by some browsers
    if (wait > 0) timer = setTimeout(go, wait); else go();
  }
  /* say a cue or a paragraph: a string (cut into sentences here) or a list of pieces [{text, kind}] already cut. opt: { style: 'guide' | 'read', settings, rate, volume, pitch, voiceURI, onPiece, onEnd, onDone, onFail } */
  function say(input, opt) {
    if (!ok) return false; const o = Object.assign({}, opt || {}); o.style = o.style === 'guide' ? 'guide' : 'read';
    const pieces = Array.isArray(input) ? input.filter((q) => q && String(q.text || '').trim()) : lsPieces(String(input == null ? '' : input), { style: o.style, max: maxChars() });
    if (!pieces.length) { if (o.onDone) setTimeout(o.onDone, 0); return true; }
    jobs.push({ pieces, i: 0, opt: o }); while (jobs.length > 5) jobs.splice(1, 1);        // never let a pile of late cues build up behind the one being said
    if (phase === 'idle' && !paused) pump(); return true;
  }
  function pause() {                                                   // stop at once; the sentence being said is said again from its start on resume
    if (!ok || paused) return; paused = true;
    if (phase === 'speak' || phase === 'wait') { gen++; clear(); hardStop(); phase = 'idle'; } else if (phase === 'gap') { gen++; clear(); const j = jobs[0]; if (j) { if (!j.hold) j.i++; j.hold = false; } phase = 'idle'; }
  }
  function resume() {
    if (!ok || !paused) return; paused = false;
    if (phase === 'idle' && jobs.length) { const my = gen; timer = setTimeout(() => { if (my === gen && !paused) { timer = null; pump(); } }, 90); }
  }
  function restart() {                                                 // use the voice, speed and loudness asked for now: say the current sentence again from its start
    if (!ok || paused) return; if (phase === 'speak' || phase === 'wait') { gen++; clear(); hardStop(); phase = 'idle'; if (jobs.length) { const my = gen; timer = setTimeout(() => { if (my === gen && !paused) { timer = null; pump(); } }, 90); } }
  }
  /* what the guided practices used before this engine: say(text) with the same options, a reading's style unless told otherwise */
  const speak = (text, o) => say(text, o);
  return {
    ok, say, speak, cancel, pause, resume, restart, choose, maxChars,
    voices: english, all: () => all.slice(), best: () => (english().find((v) => lsVoiceScore(v) >= 3000) || null), chosen: () => voiceFor(), pref: prefNow,
    advice: () => lsAdvice(all), onVoices(f) { subs.push(f); return () => { const i = subs.indexOf(f); if (i >= 0) subs.splice(i, 1); }; },
    preview(o) { const q = Object.assign({ style: 'guide' }, o); cancel(); return say(q.text || PREVIEW, q); },
    busy: () => phase !== 'idle' || jobs.length > 0, state: () => ({ phase, paused, jobs: jobs.length, gen, fails }),
  };
})();
