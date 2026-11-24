/* ═══════════════════════════ 30 · audio engine ═══════════════════════════
   Web Audio graph builder shared by live playback and offline (test) rendering.

   Signal path per voice:
     tone sources ─► toneBus ─┐
     noise source ─► noiseBus ┴► fadeNode ─► levelNode ─► limiter ─► (analysers) ─► destination

   Loudness rule: every mode is RMS-matched to a plain sine of amplitude 1 per ear (RMS 0.7071),
   so a "control" tone and an "active" beat are equally loud — essential for fair blinded trials. */
const AudioCore = (() => {
  const SQ = Math.SQRT1_2; // 0.7071…
  const LIM_THRESH = -3, LIM_RATIO = 20; // safety limiter: transparent below −3 dBFS
  const LIM_TRIM = Math.pow(Math.pow(10, (LIM_THRESH + (0 - LIM_THRESH) / LIM_RATIO) / 20), 0.6); // inverse of the compressor's make-up gain

  /* defaults for a config object */
  const DEFAULT_CFG = {
    mode: 'binaural',        // binaural | monaural | isochronic | control | noise
    carrier: 400,            // Hz (centre of the pair; the tone for isochronic/control)
    beat: 6,                 // Hz difference (binaural/monaural) or pulse rate (isochronic)
    higher: 'R',             // which ear receives the higher pitch: 'L' | 'R'
    centering: 'sym',        // 'sym' = carrier ± beat/2 · 'low' = lower ear fixed at carrier
    pulse: 0.55,             // isochronic sharpness 0 (soft sine) … 1 (near gate)
    noiseType: 'none',       // none | pink | brown | white
    noiseDb: -14,            // noise level relative to tone RMS (dB)
    volume: 0.6,             // 0…1 (mapped to −54 … −6 dBFS peak per ear)
    fadeIn: 8, fadeOut: 8,   // seconds
    duration: 20,            // minutes (0 = until stopped)
    useTimeline: false,
    timeline: [],            // [{dur (min), from (Hz), to (Hz), curve: 'linear'|'smooth'}]
  };
  const cfgOf = (c) => Object.assign({}, DEFAULT_CFG, c || {});

  let cap = 1; // user-set loudness ceiling (0…1), applied to every voice
  const setCap = (c) => { cap = clamp(+c || 1, 0.1, 1); };
  const volToGain = (v) => { v = Math.min(v, cap); return v <= 0.001 ? 0 : Math.pow(10, (-54 + 48 * clamp(v, 0, 1)) / 20); };
  const dbToGain = (db) => Math.pow(10, db / 20);

  /* the two tone frequencies for a given instantaneous beat value */
  function earFreqs(cfg, beat) {
    const c = cfg.carrier;
    const lo = cfg.centering === 'low' ? c : c - beat / 2;
    const hi = cfg.centering === 'low' ? c + beat : c + beat / 2;
    return cfg.higher === 'L' ? { L: hi, R: lo, lo, hi } : { L: lo, R: hi, lo, hi };
  }

  /* beat trajectory: array of {t0,t1,from,to,curve} in seconds */
  function segments(cfg) {
    if (cfg.useTimeline && cfg.timeline && cfg.timeline.length) {
      let t = 0; const out = [];
      for (const s of cfg.timeline) {
        const d = Math.max(0.5, (+s.dur || 0) * 60);
        out.push({ t0: t, t1: t + d, from: +s.from, to: +s.to, curve: s.curve || 'linear' });
        t += d;
      }
      return out;
    }
    const total = cfg.duration > 0 ? cfg.duration * 60 : Infinity;
    return [{ t0: 0, t1: total, from: cfg.beat, to: cfg.beat, curve: 'linear' }];
  }
  function totalSeconds(cfg) { const s = segments(cfg); return s[s.length - 1].t1; }
  const smooth = (x) => x * x * (3 - 2 * x);
  function beatAt(cfg, t) {
    const segs = segments(cfg);
    for (const s of segs) {
      if (t <= s.t1 || s === segs[segs.length - 1]) {
        const u = clamp((t - s.t0) / Math.max(1e-9, s.t1 - s.t0), 0, 1);
        return lerp(s.from, s.to, s.curve === 'smooth' ? smooth(u) : u);
      }
    }
    return cfg.beat;
  }
  /* accumulated interaural phase (cycles) up to time t — used for the visualisation */
  function cyclesAt(cfg, t, steps = 400) {
    let acc = 0; const dt = t / steps; for (let i = 0; i < steps; i++) acc += beatAt(cfg, (i + 0.5) * dt) * dt; return acc;
  }

  /* ── noise ── */
  const noiseCache = new Map();
  function noiseBuffer(ctx, type, seconds = 24) {
    const key = type + '|' + ctx.sampleRate;
    if (noiseCache.has(key) && noiseCache.get(key).ctx === ctx) return noiseCache.get(key).buf;
    const sr = ctx.sampleRate; const N = Math.floor(seconds * sr); const F = Math.floor(0.6 * sr); // crossfade length
    const buf = ctx.createBuffer(2, N, sr);
    for (let ch = 0; ch < 2; ch++) {
      const gen = new Float32Array(N + F);
      if (type === 'white') { for (let i = 0; i < gen.length; i++) gen[i] = Math.random() * 2 - 1; }
      else if (type === 'pink') { // Paul Kellet's refined filter
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < gen.length; i++) {
          const w = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852;
          b3 = 0.8665 * b3 + w * 0.3104856; b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898;
          gen[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362; b6 = w * 0.115926;
        }
      } else { // brown (leaky integrated white)
        let last = 0; for (let i = 0; i < gen.length; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; gen[i] = last * 3.5; }
      }
      const out = buf.getChannelData(ch);
      for (let i = 0; i < N; i++) out[i] = gen[i];
      for (let i = 0; i < F; i++) { const w = i / F; out[i] = gen[i] * Math.sqrt(w) + gen[N + i] * Math.sqrt(1 - w); } // equal-power seam
      // normalise to RMS = 0.7071 so "0 dB" noise equals tone RMS
      let ss = 0; for (let i = 0; i < N; i++) ss += out[i] * out[i];
      const k = SQ / Math.sqrt(ss / N); for (let i = 0; i < N; i++) out[i] *= k;
    }
    noiseCache.set(key, { ctx, buf });
    return buf;
  }

  /* isochronic pulse shape: maps LFO value x ∈ [-1,1] to gain 0…1 */
  function pulseCurve(sharp, n = 2049) {
    const c = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const x = (i / (n - 1)) * 2 - 1;
      const soft = (1 + x) / 2;                                   // sine amplitude modulation, 100 % depth
      const e0 = -0.12, w = 0.3;                                  // gate: smooth-step around the zero crossing
      const gate = smooth(clamp((x - e0 + w / 2) / w, 0, 1));
      c[i] = lerp(soft, gate, sharp);
    }
    return c;
  }
  /* RMS of the (squared) envelope, so isochronic loudness can be matched */
  function pulseRmsFactor(sharp) {
    const c = pulseCurve(sharp, 4097); let ss = 0; const M = 4000;
    for (let i = 0; i < M; i++) { const x = Math.sin((2 * Math.PI * i) / M); const idx = ((x + 1) / 2) * (c.length - 1); const lo = Math.floor(idx); const f = idx - lo; const y = c[lo] * (1 - f) + (c[Math.min(lo + 1, c.length - 1)] * f); ss += y * y; }
    return Math.sqrt(ss / M);
  }

  /* ── voice: builds the whole graph; returns controller ── */
  function createVoice(ctx, cfgIn, dest, opts = {}) {
    const cfg = cfgOf(cfgIn);
    const t0 = opts.t0 != null ? opts.t0 : ctx.currentTime + 0.06;
    const segs = segments(cfg);
    const total = segs[segs.length - 1].t1;
    const fadeIn = opts.fadeIn != null ? opts.fadeIn : cfg.fadeIn;
    const fadeOut = Math.min(opts.fadeOut != null ? opts.fadeOut : cfg.fadeOut, isFinite(total) ? total / 2 : 1e9);
    const stopNodes = []; const params = []; // params: {param, map(beat)->value}

    const fadeNode = ctx.createGain(); fadeNode.gain.value = 0;
    const levelNode = ctx.createGain(); levelNode.gain.value = volToGain(cfg.volume);
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = LIM_THRESH; limiter.knee.value = 0; limiter.ratio.value = LIM_RATIO; limiter.attack.value = 0.003; limiter.release.value = 0.25;
    // Web Audio compressors add automatic make-up gain (≈ +1.7 dB here); cancel it so volume maps to the documented dBFS values
    const trim = ctx.createGain(); trim.gain.value = LIM_TRIM;
    fadeNode.connect(levelNode); levelNode.connect(limiter); limiter.connect(trim); trim.connect(dest);
    const toneBus = ctx.createGain(); toneBus.connect(fadeNode);
    const noiseBus = ctx.createGain(); noiseBus.connect(fadeNode);

    const first = beatAt(cfg, 0);
    const merger = ctx.createChannelMerger(2); merger.connect(toneBus);
    const sine = (f) => { const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f; stopNodes.push(o); return o; };
    const mono2stereo = (node, gain = 1) => { const g = ctx.createGain(); g.gain.value = gain; node.connect(g); g.connect(merger, 0, 0); g.connect(merger, 0, 1); return g; };

    if (cfg.mode === 'binaural') {
      const f = earFreqs(cfg, first);
      const oL = sine(f.L), oR = sine(f.R);
      oL.connect(merger, 0, 0); oR.connect(merger, 0, 1);
      const lo = (b) => (cfg.centering === 'low' ? cfg.carrier : cfg.carrier - b / 2);
      const hi = (b) => (cfg.centering === 'low' ? cfg.carrier + b : cfg.carrier + b / 2);
      // mappings read cfg at call time so carrier / ear-order / centering changes apply live
      params.push({ param: oL.frequency, map: (b) => (cfg.higher === 'L' ? hi(b) : lo(b)) });
      params.push({ param: oR.frequency, map: (b) => (cfg.higher === 'L' ? lo(b) : hi(b)) });
    } else if (cfg.mode === 'monaural') {
      const f = earFreqs(cfg, first);
      const oA = sine(f.lo), oB = sine(f.hi);
      mono2stereo(oA, SQ); mono2stereo(oB, SQ);
      params.push({ param: oA.frequency, map: (b) => (cfg.centering === 'low' ? cfg.carrier : cfg.carrier - b / 2) });
      params.push({ param: oB.frequency, map: (b) => (cfg.centering === 'low' ? cfg.carrier + b : cfg.carrier + b / 2) });
    } else if (cfg.mode === 'isochronic') {
      const car = sine(cfg.carrier);
      const am = ctx.createGain(); am.gain.value = 0;
      car.connect(am);
      const lfo = ctx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = first; stopNodes.push(lfo);
      const sh = ctx.createWaveShaper(); sh.curve = pulseCurve(cfg.pulse); sh.oversample = 'none';
      lfo.connect(sh); sh.connect(am.gain);
      mono2stereo(am, 1 / pulseRmsFactor(cfg.pulse)); // RMS-match to a plain sine
      params.push({ param: lfo.frequency, map: (b) => Math.max(0.01, b) });
      params.push({ param: car.frequency, map: () => cfg.carrier });
    } else if (cfg.mode === 'control') {
      const o = sine(cfg.carrier); mono2stereo(o, 1);
      params.push({ param: o.frequency, map: () => cfg.carrier });
    } // 'noise' → no tones

    // noise bed
    let noiseSrc = null; const noiseGain = ctx.createGain();
    const noiseOn = cfg.mode === 'noise' ? (cfg.noiseType !== 'none' ? cfg.noiseType : 'pink') : cfg.noiseType;
    if (noiseOn && noiseOn !== 'none') {
      noiseSrc = ctx.createBufferSource(); noiseSrc.buffer = noiseBuffer(ctx, noiseOn); noiseSrc.loop = true;
      noiseGain.gain.value = cfg.mode === 'noise' ? 1 : dbToGain(cfg.noiseDb);
      noiseSrc.connect(noiseGain); noiseGain.connect(noiseBus); stopNodes.push(noiseSrc);
    }

    // schedule beat automation
    for (const { param, map } of params) {
      param.cancelScheduledValues(0);
      for (const s of segs) {
        const st = t0 + s.t0; const en = t0 + s.t1;
        param.setValueAtTime(map(s.from), st);
        if (s.from !== s.to && isFinite(en)) {
          if (s.curve === 'smooth') { const N = 24; for (let i = 1; i <= N; i++) param.linearRampToValueAtTime(map(lerp(s.from, s.to, smooth(i / N))), st + (en - st) * (i / N)); }
          else param.linearRampToValueAtTime(map(s.to), en);
        }
      }
    }
    // fades
    fadeNode.gain.setValueAtTime(0, t0);
    fadeNode.gain.linearRampToValueAtTime(1, t0 + Math.max(0.02, fadeIn));
    const endT = t0 + total;
    if (isFinite(total)) {
      fadeNode.gain.setValueAtTime(1, Math.max(t0 + fadeIn, endT - fadeOut));
      fadeNode.gain.linearRampToValueAtTime(0, endT);
    }
    stopNodes.forEach((n) => n.start(t0));
    if (isFinite(total)) stopNodes.forEach((n) => n.stop(endT + 0.05));

    const voice = {
      ctx, cfg, t0, total, endT, levelNode, fadeNode, limiter, params, out: trim, ended: false,
      onended: null,
      setBeat(b, tc = 0.04) { for (const { param, map } of params) { param.cancelScheduledValues(ctx.currentTime); param.setTargetAtTime(map(b), ctx.currentTime, tc); } },
      setCarrierAndBeat(c, b, higher, centering) { cfg.carrier = c; cfg.higher = higher; cfg.centering = centering; if (!cfg.useTimeline) cfg.beat = b; this.setBeat(b, 0.03); },
      setVolume(v) { cfg.volume = v; levelNode.gain.setTargetAtTime(volToGain(v), ctx.currentTime, 0.05); },
      setNoiseDb(db) { cfg.noiseDb = db; if (cfg.mode !== 'noise') noiseGain.gain.setTargetAtTime(dbToGain(db), ctx.currentTime, 0.05); },
      fadeOutAndStop(sec = 1.2) {
        const now = ctx.currentTime;
        fadeNode.gain.cancelScheduledValues(now); fadeNode.gain.setValueAtTime(fadeNode.gain.value, now); fadeNode.gain.linearRampToValueAtTime(0, now + sec);
        stopNodes.forEach((n) => { try { n.stop(now + sec + 0.05); } catch (e) { /* already stopped */ } });
      },
      dispose() { try { trim.disconnect(); limiter.disconnect(); } catch (e) { /* noop */ } },
    };
    if (stopNodes.length) stopNodes[0].onended = () => { voice.ended = true; if (voice.onended) voice.onended(); };
    return voice;
  }

  /* ── offline rendering (tests + verification) ── */
  async function renderOffline(cfgIn, seconds, sampleRate = 48000, extra = {}) {
    const Off = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    const ctx = new Off(2, Math.floor(seconds * sampleRate), sampleRate);
    createVoice(ctx, cfgIn, ctx.destination, Object.assign({ t0: 0 }, extra));
    const buf = await ctx.startRendering();
    return { L: buf.getChannelData(0), R: buf.getChannelData(1), sampleRate };
  }

  /* ── analysis helpers ── */
  /* frequency of a clean sine by positive-going zero-crossings with linear interpolation */
  function zeroCrossFreq(x, sr, from = 0, to = x.length) {
    let first = -1, last = -1, n = 0;
    for (let i = Math.max(1, from); i < to; i++) {
      if (x[i - 1] < 0 && x[i] >= 0) { const t = i - 1 + (0 - x[i - 1]) / (x[i] - x[i - 1]); if (first < 0) first = t; last = t; n++; }
    }
    return n > 1 ? ((n - 1) * sr) / (last - first) : NaN;
  }
  const rms = (x, from = 0, to = x.length) => { let s = 0; for (let i = from; i < to; i++) s += x[i] * x[i]; return Math.sqrt(s / Math.max(1, to - from)); };

  /* peak of an AnalyserNode spectrum near an expected frequency, parabolic interpolation (dB domain) */
  function peakNear(db, sr, fftSize, f0, halfWidth) {
    const bin = sr / fftSize; const lo = Math.max(2, Math.floor((f0 - halfWidth) / bin)); const hi = Math.min(db.length - 2, Math.ceil((f0 + halfWidth) / bin));
    let k = lo; for (let i = lo; i <= hi; i++) if (db[i] > db[k]) k = i;
    const a = db[k - 1], b = db[k], c = db[k + 1]; const den = a - 2 * b + c;
    const d = den !== 0 ? (0.5 * (a - c)) / den : 0;
    return { f: (k + clamp(d, -1, 1)) * bin, db: b };
  }

  return { setCap, DEFAULT_CFG, cfgOf, volToGain, dbToGain, earFreqs, segments, totalSeconds, beatAt, cyclesAt, createVoice, renderOffline, noiseBuffer, zeroCrossFreq, rms, peakNear, pulseRmsFactor };
})();

/* ═══════════════════════════ live engine (singleton) ═══════════════════════════ */
const Engine = (() => {
  const ev = Emitter();
  let ctx = null; let voice = null; let state = 'idle'; let meta = {}; let split = null; let anL = null, anR = null; let autoStopTimer = null;
  const FFT = 32768;

  function ensureCtx() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) throw new Error('Web Audio is not supported in this browser');
      ctx = new AC({ latencyHint: 'playback' });
      ctx.onstatechange = () => { if (ctx.state === 'interrupted' || ctx.state === 'suspended') ev.emit('ctxstate', ctx.state); };
    }
    return ctx;
  }
  function wireAnalysers(v) {
    try { if (split) split.disconnect(); } catch (e) { /* noop */ }
    split = ctx.createChannelSplitter(2); anL = ctx.createAnalyser(); anR = ctx.createAnalyser();
    [anL, anR].forEach((a) => { a.fftSize = FFT; a.smoothingTimeConstant = 0.55; a.minDecibels = -130; a.maxDecibels = 0; });
    v.out.connect(split); split.connect(anL, 0); split.connect(anR, 1);
  }
  function setState(s) { state = s; ev.emit('state', s); }

  const api = {
    on: ev.on,
    get state() { return state; },
    get cfg() { return voice ? voice.cfg : null; },
    get meta() { return meta; },
    get ctx() { return ctx; },
    async unlock() { const c = ensureCtx(); if (c.state !== 'running') { try { await c.resume(); } catch (e) { /* noop */ } } return c; },
    async play(cfgIn, m = {}) {
      const c = await api.unlock();
      const cfg = AudioCore.cfgOf(cfgIn);
      const old = voice;
      if (old) { old.onended = null; old.fadeOutAndStop(m.crossfade ? 0.35 : 0.25); setTimeout(() => old.dispose(), 600); }
      voice = AudioCore.createVoice(c, cfg, c.destination, { fadeIn: m.crossfade ? 0.35 : undefined });
      wireAnalysers(voice); meta = Object.assign({ name: 'Custom tone' }, m);
      const v = voice;
      v.onended = () => { if (voice === v && state !== 'idle') { setState('idle'); ev.emit('ended', meta); } };
      setState('playing'); ev.emit('started', meta);
      return voice;
    },
    stop(fade = 1.2) {
      if (!voice) return; const v = voice; v.onended = null; v.fadeOutAndStop(fade);
      setTimeout(() => v.dispose(), (fade + 0.3) * 1000); voice = null; setState('idle'); ev.emit('stopped', meta);
    },
    async pause() { if (ctx && state === 'playing') { await ctx.suspend(); setState('paused'); } },
    async resume() { if (ctx && state === 'paused') { await ctx.resume(); setState('playing'); } },
    /* live parameter tweaks (smooth, click-free) */
    setBeat(b) { if (voice && !voice.cfg.useTimeline) voice.setBeat(b); },
    setPair(c, b, higher, centering) { if (voice) voice.setCarrierAndBeat(c, b, higher, centering); },
    setVolume(v) { if (voice) voice.setVolume(v); },
    setNoiseDb(db) { if (voice) voice.setNoiseDb(db); },
    position() { return voice ? Math.max(0, ctx.currentTime - voice.t0) : 0; },
    duration() { return voice ? voice.total : 0; },
    currentBeat() { return voice ? AudioCore.beatAt(voice.cfg, api.position()) : 0; },
    /* real output measurement from the analysers */
    measure() {
      if (!voice || !anL) return null; const sr = ctx.sampleRate; const out = {};
      const dL = new Float32Array(anL.frequencyBinCount), dR = new Float32Array(anR.frequencyBinCount);
      anL.getFloatFrequencyData(dL); anR.getFloatFrequencyData(dR);
      const cfg = voice.cfg; const b = api.currentBeat();
      const f = AudioCore.earFreqs(cfg, b);
      const hw = Math.max(12, cfg.carrier * 0.08 + b);
      const exp = (cfg.mode === 'binaural') ? { L: f.L, R: f.R } : { L: cfg.carrier, R: cfg.carrier };
      const pl = AudioCore.peakNear(dL, sr, FFT, exp.L, hw), pr = AudioCore.peakNear(dR, sr, FFT, exp.R, hw);
      out.L = pl; out.R = pr; out.expected = exp; out.sampleRate = sr; return out;
    },
    levels() {
      if (!anL) return { L: -120, R: -120 };
      if (!api._bl) { api._bl = new Float32Array(4096); api._br = new Float32Array(4096); }
      const bl = api._bl, br = api._br; // 4096-sample window (~85 ms) → responsive meters
      anL.getFloatTimeDomainData(bl.length === anL.fftSize ? bl : (api._bl = new Float32Array(anL.fftSize)));
      anR.getFloatTimeDomainData(br.length === anR.fftSize ? br : (api._br = new Float32Array(anR.fftSize)));
      const n = 4096; const db = (x) => 20 * Math.log10(Math.max(1e-6, AudioCore.rms(x, x.length - n, x.length)));
      return { L: db(api._bl), R: db(api._br) };
    },
    /* one-shot helper for short demos / tests: plays then returns a promise that resolves when done */
    async demo(cfg, seconds, m = {}) {
      await api.play(Object.assign({}, cfg, { duration: seconds / 60, useTimeline: false, fadeIn: 0.4, fadeOut: 0.6 }), Object.assign({ name: 'Demo', demo: true }, m));
      return new Promise((res) => { const off = ev.on('state', (s) => { if (s === 'idle') { off(); res(); } }); });
    },
  };
  return api;
})();
