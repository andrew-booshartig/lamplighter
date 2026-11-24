/* ═══════════════════════════ 60 · Studio ═══════════════════════════ */
const Studio = (() => {
  const defaultPreset = () => PRESETS.find((p) => p.id === 'calm-alpha');
  const saved = store.get('studio', null);
  const S = { cfg: AudioCore.cfgOf(saved ? saved.cfg : shiftNoise(defaultPreset().cfg)), name: saved ? saved.name : defaultPreset().name, presetId: saved ? saved.presetId : 'calm-alpha' };
  const persist = debounce(() => store.set('studio', { cfg: S.cfg, name: S.name, presetId: S.presetId }), 300);
  let ui = null;

  const api = {
    state: S,
    load(cfg, name, presetId = null) {
      let c = JSON.parse(JSON.stringify(cfg)); if (presetId && PRESETS.some((p) => p.id === presetId)) c = shiftNoise(c); // built-in presets honour your noise-comfort shift
      S.cfg = AudioCore.cfgOf(c); S.name = name || 'Custom tone'; S.presetId = presetId; persist();
      if (ui) ui.syncAll();
    },
    async playNow() { await Engine.play(S.cfg, { name: S.name, presetId: S.presetId }); },
    toggle() { if (Engine.state === 'idle') api.playNow().catch((e) => toast('Audio could not start: ' + esc(e.message), 'bad')); else Engine.stop(); },
    setUI(u) { ui = u; },
  };
  api.persist = persist;
  return api;
})();

function hearText(cfg, beat) {
  if (cfg.mode === 'noise') return 'Steady noise with no tones. Useful as a control or for masking sound.';
  if (cfg.mode === 'control') return `One steady ${cfg.carrier} Hz tone in both ears — no beat. This is the "no-beat" control.`;
  if (cfg.mode === 'isochronic') return `A ${cfg.carrier} Hz tone switched on and off ${fmt.hz(beat, 1)} times per second — a clearly audible pulsing, in both ears.`;
  const rate = beat < 1 ? 'a very slow drift' : beat < 4 ? 'a slow, wave-like throbbing' : beat < 8 ? 'a gentle wobble' : beat < 13 ? 'a quick shimmer' : beat <= 30 ? 'a fast flutter, rougher and harder to catch' : 'two faint tones with little or no beat';
  if (cfg.mode === 'monaural') return `One tone that physically swells and fades ${fmt.hz(beat, 1)} times per second — ${rate}. You can hear this even on speakers.`;
  return `Most people hear ${rate} ${beat <= 30 ? 'seeming to move around inside the head, ' + fmt.hz(beat, 1) + ' times a second' : ''}. It is faint by design — it is built by your brain, not played by the headphones.`;
}
function warnings(cfg, beat) {
  const w = [];
  if (cfg.mode === 'binaural' && cfg.carrier > 1000) w.push('Above ~1,000 Hz the brainstem can’t compare the ears’ timing well — binaural beats fade or vanish. Try 200–500 Hz.');
  if (cfg.mode === 'binaural' && beat > 30) w.push('Binaural beats above ~30 Hz usually aren’t perceived as a beat. For 40 Hz, try Monaural or Isochronic.');
  if (cfg.mode === 'binaural' && cfg.carrier < 150) w.push('Many headphones reproduce tones below ~150 Hz weakly, making the beat hard to hear.');
  if (cfg.mode === 'binaural' && !Settings.get('hpChecked')) w.push('Binaural beats need true stereo. Run Practice → Sound → Headphone check once so you know your headphones aren’t mixing the channels.');
  if (cfg.volume > 0.85) w.push('That’s loud. Stronger volume doesn’t mean a stronger effect — turn it down.');
  return w;
}

Pages.studio = {
  toggle() { Studio.toggle(); },
  mount(root) {
    const S = Studio.state; const slots = {}; const C = {}; let raf = 0; let lastMeasure = 0; let lastTL = '';
    root.innerHTML = `
    <div class="page-head fade-in"><div><h1>Studio</h1><p>Design a tone, see exactly what each ear receives, and verify what actually comes out of your headphones.</p></div>
      <div class="row"><span class="badge" id="stName"></span><button class="btn sm" id="stSave">${icon('plus')}Save preset</button><button class="btn sm ghost" id="stReset">Reset</button></div></div>

    <div class="row tight fade-in" id="quick" style="margin:-6px 0 8px"><span class="eyebrow" style="margin-right:6px">Quick start</span>${[['calm-alpha', 'Calm · 10 Hz'], ['focus-beta16', 'Focus · 16 Hz'], ['meditate-theta', 'Meditate · 6 Hz'], ['sleep-descent', 'Sleep descent'], ['creative-alpha', 'Creative drift'], ['ctl-tone', 'Matched control']].map(([id, l]) => `<button class="chip" type="button" data-q="${id}">${l}</button>`).join('')}<a class="small" href="#/presets" style="margin-left:6px">All presets →</a></div>
    <div class="small muted fade-in" style="margin:0 0 16px">Questions? <a href="#/learn/spacing">How far apart should the tones be?</a> · <a href="#/learn/carrier">Why some pitches work better</a> · <a href="#/learn/ears">Left or right ear higher?</a> · <a href="#/learn/evidence">What the science says</a></div>

    <section class="card hero glow fade-in" aria-label="Visualiser">
      <div class="hero-grid">
        <div class="pane"><span class="pane-label">Head · top view</span><canvas class="head-view" id="cvHead" aria-label="Schematic of the sound image"></canvas></div>
        <div class="pane"><span class="pane-label">Frequencies each ear receives</span><canvas class="tune-view" id="cvTune" style="margin-top:8px"></canvas><div id="ruler"></div></div>
      </div>
      <div class="readouts">
        <div class="readout"><span class="k cL">Left ear</span><span class="v" id="rdL">—</span><span class="s" id="rdLs"></span></div>
        <div class="readout"><span class="k cR">Right ear</span><span class="v" id="rdR">—</span><span class="s" id="rdRs"></span></div>
        <div class="readout"><span class="k">Beat</span><span class="v" id="rdB">—</span><span class="s" id="rdBs"></span></div>
        <div class="readout"><span class="k">Band</span><span class="v" id="rdBand" style="font-family:var(--font)">—</span><span class="s" id="rdBandS"></span></div>
      </div>
      <div class="pane" style="border-top:1px solid var(--line)"><div class="transport">
        <button class="play-btn" id="playBtn" aria-label="Play">${icon('play')}</button>
        <div class="grow stack sm"><div class="spread"><span id="tpState" class="t2">Ready · fades in gently</span><span class="mono muted" id="tpTime">0:00 / 20:00</span></div><div class="progress"><i id="tpBar"></i></div>
        <div class="tiny muted">Press <span class="kbd">Space</span> to start or stop. Visuals are slowed and never flash at the beat rate.</div></div></div></div>
    </section>

    <div class="grid c2" style="margin-top:16px">
      <div class="stack">
        <section class="card fade-in"><div class="card-title"><h3>${icon('wave')}Tone</h3></div><div class="stack sm">
          <div class="field" data-info-host><div class="spread"><label class="lbl">Type</label>${UI.infoBtn()}</div><div id="s_mode"></div>
            <div class="info-panel hide"><b>Binaural:</b> a different tone in each ear — the beat is built in the brain (headphones required). <b>Monaural:</b> both tones mixed into both ears, so the sound itself beats (works on speakers). <b>Isochronic:</b> one tone pulsed on/off. <b>Control:</b> one steady tone, no beat. <b>Noise:</b> noise only.</div></div>
          <div id="s_beat"></div>
          <div class="row tight" id="bandChips">${[['Delta', 2], ['Theta', 6], ['Alpha', 10], ['Beta', 16], ['Gamma', 40]].map(([n, v]) => `<button class="chip" data-beat="${v}" type="button">${n} · ${v} Hz</button>`).join('')}</div>
          <div id="s_carrier"></div>
          <div class="field hide" id="f_ear" data-info-host><div class="spread"><label class="lbl">Higher pitch in</label>${UI.infoBtn()}</div><div class="row"><div id="s_ear"></div><button class="btn sm ghost" id="swapEars" type="button">${icon('swap')}Swap</button></div>
            <div class="info-panel hide">The beat rate is the same either way; this only flips the direction the illusion drifts. No study shows one order works better — you can test it blind in Experiments → Ear-swap.</div></div>
          <div class="field hide" id="f_center" data-info-host><div class="spread"><label class="lbl">Carrier placement</label>${UI.infoBtn()}</div><div id="s_center"></div>
            <div class="info-panel hide"><b>Centered:</b> the two tones sit symmetrically either side of the carrier (e.g. 397 &amp; 403 Hz). <b>Lower = carrier:</b> one ear is exactly at the carrier, the other is higher by the beat (e.g. 400 &amp; 406 Hz).</div></div>
          <div id="s_pulse" class="hide"></div>
        </div></section>

        <section class="card fade-in"><div class="card-title"><h3>${icon('sparkle')}Atmosphere &amp; level</h3></div><div class="stack sm">
          <div class="field" data-info-host><div class="spread"><label class="lbl">Noise bed</label>${UI.infoBtn()}</div><div id="s_noise"></div>
            <div class="info-panel hide">Pink and brown noise mask the drone and are more comfortable for long sessions. They are not shown to make beats work better. Pink = equal energy per octave; brown = deeper, rumbling.</div></div>
          <div id="s_noiseDb"></div><div id="s_volume"></div>
        </div></section>
      </div>

      <div class="stack">
        <section class="card fade-in"><div class="card-title"><h3>${icon('clock')}Session</h3></div><div class="stack sm">
          <div id="s_dur"></div><div id="s_inf"></div><div id="s_fin"></div><div id="s_fout"></div><hr style="margin:6px 0">
          <div class="spread"><div id="s_tlsw"></div><span class="small muted" id="tlTotal"></span></div>
          <div class="hint" id="tlHint"></div>
        </div></section>

        <section class="card fade-in"><div class="card-title"><h3>${icon('shield')}Output check</h3><span class="badge" id="measBadge">idle</span></div><div class="stack sm">
          <div class="listen"><span class="dot"></span><div><div class="eyebrow">What you should hear</div><div id="hearText" class="t2"></div></div></div>
          <div class="grid c2" style="gap:10px"><div><div class="spread tiny muted"><span class="cL">Left level</span><span id="lvL" class="mono">—</span></div><div class="meter L"><i id="mtL"></i></div></div><div><div class="spread tiny muted"><span class="cR">Right level</span><span id="lvR" class="mono">—</span></div><div class="meter R"><i id="mtR"></i></div></div></div>
          <div class="callout">${icon('info')}<div><b>Measured from the live output:</b> <span class="mono" id="measure">start playback to measure</span><div class="hint" id="measHint">The Lamplighter Project reads its own audio output and reports the actual frequency in each ear, so you don’t have to trust the sliders.</div></div></div>
          <div id="warnBox" class="stack sm"></div>
        </div></section>
      </div>
    </div>
    <section class="card fade-in hide" id="tlBox" style="margin-top:16px"><div class="card-title"><h3>${icon('chart')}Timeline — beat frequency over the session</h3><span class="small muted" id="tlTotal2"></span></div>
      <div class="grid" style="gap:22px;align-items:start;grid-template-columns:repeat(auto-fit,minmax(min(100%,420px),1fr))"><div class="stack sm"><div class="tl-head"><span></span><span>Minutes</span><span>From Hz</span><span>To Hz</span><span class="curve">Curve</span><span></span></div><div class="timeline-rows" id="tlRows"></div>
        <div class="row"><button class="btn sm" id="tlAdd" type="button">${icon('plus')}Add segment</button><button class="btn sm ghost" id="tlEx" type="button">Example: descent</button></div>
        <div class="hint">Each segment moves the beat linearly (or on a smooth S-curve) from <b>From</b> to <b>To</b>. Equal values hold steady. The carrier and volume stay as set.</div></div>
      <div id="tlChart"></div></div></section>`;

    const view = new Viz.StudioView({ head: $('#cvHead'), tune: $('#cvTune') }); const ruler = Viz.bandRuler($('#ruler'));
    const put = (id, node) => { $('#' + id, root).replaceWith(node); };
    const touched = () => { if (S.presetId) { S.name = S.name + ' · edited'; S.presetId = null; } Studio.persist(); $('#stName', root).textContent = S.name; };
    const live = () => { if (Engine.state === 'playing' || Engine.state === 'paused') { if (!S.cfg.useTimeline) Engine.setPair(S.cfg.carrier, S.cfg.beat, S.cfg.higher, S.cfg.centering); } };
    const restart = () => { if (Engine.state === 'playing') Engine.play(S.cfg, { name: S.name, presetId: S.presetId, crossfade: true }); };

    C.mode = UI.seg({ label: 'Tone type', options: [{ v: 'binaural', label: 'Binaural' }, { v: 'monaural', label: 'Monaural' }, { v: 'isochronic', label: 'Isochronic' }, { v: 'control', label: 'Control' }, { v: 'noise', label: 'Noise' }], value: S.cfg.mode,
      onChange: (v) => { S.cfg.mode = v; if (v === 'noise' && S.cfg.noiseType === 'none') S.cfg.noiseType = 'pink'; touched(); syncAll(); restart(); } });
    put('s_mode', C.mode.el);
    C.beat = UI.slider({ id: 'beat', label: 'Beat frequency', min: 0.5, max: 50, step: 0.01, value: S.cfg.beat, unit: 'Hz', log: true, dec: 2, ends: ['0.5 Hz', '50 Hz'],
      info: 'The beat is the <b>difference</b> between the two ears’ frequencies — the main thing you choose. Binaural beats are perceived up to roughly 30 Hz. Delta ≈ sleep, theta ≈ drowsy/meditative, alpha ≈ relaxed, beta ≈ alert, gamma ≈ 40 Hz research.',
      onInput: (v) => { S.cfg.beat = v; touched(); live(); refreshReadouts(); } });
    put('s_beat', C.beat.el);
    C.carrier = UI.slider({ id: 'carrier', label: 'Carrier pitch', min: 100, max: 1500, step: 0.5, value: S.cfg.carrier, unit: 'Hz', log: true, dec: 1, ends: ['100 Hz', '1500 Hz'],
      info: 'The pitch both ears hear (the middle of the pair). Keep it <b>under ~1,000 Hz</b>; <b>200–500 Hz</b> is the practical sweet spot — clear beat, not piercing, reproduced cleanly by headphones.',
      onInput: (v) => { S.cfg.carrier = v; touched(); live(); refreshReadouts(); } });
    put('s_carrier', C.carrier.el);
    C.ear = UI.seg({ label: 'Higher pitch ear', options: [{ v: 'R', label: 'Right ear' }, { v: 'L', label: 'Left ear' }], value: S.cfg.higher, onChange: (v) => { S.cfg.higher = v; touched(); live(); refreshReadouts(); } }); put('s_ear', C.ear.el);
    C.center = UI.seg({ label: 'Carrier placement', options: [{ v: 'sym', label: 'Centered on carrier' }, { v: 'low', label: 'Lower ear = carrier' }], value: S.cfg.centering, onChange: (v) => { S.cfg.centering = v; touched(); live(); refreshReadouts(); } }); put('s_center', C.center.el);
    C.pulse = UI.slider({ id: 'pulse', label: 'Pulse sharpness', min: 0, max: 1, step: 0.01, value: S.cfg.pulse, unit: '', dec: 2, fmtFn: (v) => Math.round(v * 100) + '%', ends: ['soft swell', 'hard gate'], info: 'Soft pulses swell like a sine wave; hard pulses switch on and off. Sharper pulses give a stronger brain response but are more intrusive.', onInput: (v) => { S.cfg.pulse = v; touched(); restart(); } }); put('s_pulse', C.pulse.el);
    C.noise = UI.seg({ label: 'Noise', options: [{ v: 'none', label: 'None' }, { v: 'pink', label: 'Pink' }, { v: 'brown', label: 'Brown' }, { v: 'white', label: 'White' }], value: S.cfg.noiseType, onChange: (v) => { S.cfg.noiseType = v; touched(); syncAll(); restart(); } }); put('s_noise', C.noise.el);
    C.noiseDb = UI.slider({ id: 'noiseDb', label: 'Noise level (vs tone)', min: -40, max: -3, step: 0.5, value: S.cfg.noiseDb, unit: 'dB', dec: 1, ends: ['hidden', 'as loud as tone'], info: 'The noise sits <b>behind</b> the tones — at these settings it softens the drone but never hides the beat. Presets open at their own level, moved by your <i>Noise comfort shift</i> in Setup. If you can’t find the wobble, make it quieter (more negative); if the steady tone irritates you, raise it a few dB; if the hiss itself irritates you, go quieter or try brown noise. No study shows a best level, so choose for comfort — and keep it identical across experiment conditions. <a href="#/learn/level">More →</a>', onInput: (v) => { S.cfg.noiseDb = v; touched(); Engine.setNoiseDb(v); } }); put('s_noiseDb', C.noiseDb.el);
    C.volume = UI.slider({ id: 'volume', label: 'Volume', min: 0, max: 1, step: 0.01, value: S.cfg.volume, unit: '', dec: 2, fmtFn: (v) => Math.round(v * 100) + '%', ends: ['quiet', 'max (capped in Setup)'], info: 'Start low and raise slowly — louder is not stronger. The Lamplighter Project maps this to −54 … −6 dBFS, always fades in, and applies a safety limiter. Your system volume still matters. Set it by ear — like soft rain or a distant fan, comfortable for an hour. <a href="#/learn/level">How loud? →</a>', onInput: (v) => { S.cfg.volume = v; touched(); Engine.setVolume(v); refreshWarn(); } }); put('s_volume', C.volume.el);
    C.dur = UI.slider({ id: 'dur', label: 'Duration', min: 1, max: 120, step: 1, value: Math.max(1, S.cfg.duration || 20), unit: 'min', dec: 0, onInput: (v) => { S.cfg.duration = v; touched(); refreshTime(); } }); put('s_dur', C.dur.el);
    C.inf = UI.switchEl({ label: 'Play until I stop', checked: !S.cfg.duration, onChange: (on) => { S.cfg.duration = on ? 0 : C.dur.get(); touched(); syncAll(); } }); put('s_inf', C.inf.el);
    C.fin = UI.slider({ id: 'fin', label: 'Fade in', min: 1, max: 60, step: 1, value: S.cfg.fadeIn, unit: 's', dec: 0, onInput: (v) => { S.cfg.fadeIn = v; touched(); } }); put('s_fin', C.fin.el);
    C.fout = UI.slider({ id: 'fout', label: 'Fade out', min: 1, max: 60, step: 1, value: S.cfg.fadeOut, unit: 's', dec: 0, onInput: (v) => { S.cfg.fadeOut = v; touched(); } }); put('s_fout', C.fout.el);
    C.tlsw = UI.switchEl({ label: 'Use a timeline (sweeps &amp; ramps)', checked: S.cfg.useTimeline, onChange: (on) => {
      S.cfg.useTimeline = on; if (on && !(S.cfg.timeline && S.cfg.timeline.length)) S.cfg.timeline = [{ dur: Math.max(1, S.cfg.duration || 20), from: S.cfg.beat, to: S.cfg.beat, curve: 'linear' }];
      if (on && !S.cfg.duration) S.cfg.duration = 20; touched(); syncAll(); restart(); } }); put('s_tlsw', C.tlsw.el);

    /* timeline editor */
    function renderTimeline() {
      const rows = $('#tlRows', root); const tl = S.cfg.timeline || [];
      rows.innerHTML = tl.map((s, i) => `<div class="tl-row" data-i="${i}"><span class="idx">${i + 1}</span>
        <input class="input" data-k="dur" type="number" min="0.5" step="0.5" value="${s.dur}" aria-label="Segment ${i + 1} minutes">
        <input class="input" data-k="from" type="number" min="0.5" max="50" step="0.1" value="${s.from}" aria-label="Segment ${i + 1} start Hz">
        <input class="input" data-k="to" type="number" min="0.5" max="50" step="0.1" value="${s.to}" aria-label="Segment ${i + 1} end Hz">
        <select class="select curve" data-k="curve" aria-label="Curve"><option value="linear"${s.curve === 'linear' ? ' selected' : ''}>Linear</option><option value="smooth"${s.curve === 'smooth' ? ' selected' : ''}>Smooth</option></select>
        <button class="btn icon sm ghost" data-del type="button" aria-label="Remove segment">${icon('x')}</button></div>`).join('');
      refreshTimelineChart();
    }
    function refreshTimelineChart() {
      const tl = S.cfg.timeline || []; const total = tl.reduce((a, s) => a + (+s.dur || 0), 0);
      $('#tlTotal', root).textContent = S.cfg.useTimeline ? `Total ${fmt.num(total, 1)} min` : ''; $('#tlTotal2', root).textContent = S.cfg.useTimeline ? `Total ${fmt.num(total, 1)} min` : '';
      $('#tlChart', root).innerHTML = S.cfg.useTimeline ? Viz.timelineChart(S.cfg) : '';
    }
    $('#tlRows', root).addEventListener('input', (e) => {
      const row = e.target.closest('.tl-row'); if (!row) return; const i = +row.dataset.i; const k = e.target.dataset.k; const seg = S.cfg.timeline[i];
      seg[k] = k === 'curve' ? e.target.value : clamp(parseFloat(e.target.value) || 0, k === 'dur' ? 0.5 : 0.5, k === 'dur' ? 240 : 50);
      S.cfg.duration = S.cfg.timeline.reduce((a, s) => a + (+s.dur || 0), 0); touched(); refreshTimelineChart();
    });
    $('#tlRows', root).addEventListener('change', () => restart());
    $('#tlRows', root).addEventListener('click', (e) => { const b = e.target.closest('[data-del]'); if (!b) return; const i = +b.closest('.tl-row').dataset.i; if (S.cfg.timeline.length > 1) { S.cfg.timeline.splice(i, 1); S.cfg.duration = S.cfg.timeline.reduce((a, s) => a + (+s.dur || 0), 0); touched(); renderTimeline(); restart(); } });
    $('#tlAdd', root).addEventListener('click', () => { const last = S.cfg.timeline[S.cfg.timeline.length - 1] || { to: S.cfg.beat }; S.cfg.timeline.push({ dur: 5, from: last.to, to: last.to, curve: 'linear' }); S.cfg.duration = S.cfg.timeline.reduce((a, s) => a + (+s.dur || 0), 0); touched(); renderTimeline(); });
    $('#tlEx', root).addEventListener('click', () => { S.cfg.timeline = [{ dur: 5, from: 10, to: 10, curve: 'linear' }, { dur: 10, from: 10, to: 4, curve: 'smooth' }, { dur: 5, from: 4, to: 4, curve: 'linear' }]; S.cfg.duration = 20; touched(); renderTimeline(); restart(); });

    $('#bandChips', root).addEventListener('click', (e) => { const b = e.target.closest('[data-beat]'); if (!b) return; S.cfg.beat = +b.dataset.beat; C.beat.set(S.cfg.beat); touched(); live(); refreshReadouts(); });
    $('#swapEars', root).addEventListener('click', () => { S.cfg.higher = S.cfg.higher === 'R' ? 'L' : 'R'; C.ear.set(S.cfg.higher); touched(); live(); refreshReadouts(); });
    $('#quick', root).addEventListener('click', (e) => { const b = e.target.closest('[data-q]'); if (!b) return; const pr = presetById(b.dataset.q); Studio.load(pr.cfg, pr.name, pr.id); restart(); toast(`Loaded “${esc(pr.name)}” — press Play`, '', 2200); });
    $('#playBtn', root).addEventListener('click', () => Studio.toggle());
    $('#stReset', root).addEventListener('click', () => { Studio.load(AudioCore.DEFAULT_CFG, 'Custom tone', null); restart(); });
    $('#stSave', root).addEventListener('click', async () => {
      const r = await modal({ title: 'Save as preset', html: `<div class="stack sm"><div class="field"><label class="lbl" for="pn">Name</label><input class="input" id="pn" maxlength="60" value="${esc(S.presetId ? S.name : S.name.replace(/ · edited$/, ''))}"></div><div class="field"><label class="lbl" for="pb">Note (optional)</label><input class="input" id="pb" maxlength="120" placeholder="What is it for?"></div></div>`,
        actions: [{ label: 'Cancel', kind: 'ghost', value: null }, { label: 'Save', kind: 'primary', collect: (b) => ({ name: $('#pn', b).value.trim(), blurb: $('#pb', b).value.trim() }) }] });
      if (!r || !r.name) return; const list = store.get('presets', []); const p = { id: 'u-' + uid(), name: r.name, blurb: r.blurb || 'Your preset', cfg: JSON.parse(JSON.stringify(S.cfg)), goal: 'mine', created: Date.now() };
      list.push(p); store.set('presets', list); S.name = r.name; S.presetId = p.id; Studio.persist(); $('#stName', root).textContent = S.name; toast(`Saved “${esc(r.name)}” to Presets → Mine`, 'good');
    });

    /* syncing */
    function syncAll() {
      const c = S.cfg; const mode = c.mode;
      C.mode.set(mode); C.beat.set(c.beat); C.carrier.set(c.carrier); C.ear.set(c.higher); C.center.set(c.centering); C.pulse.set(c.pulse);
      C.noise.set(c.noiseType); C.noiseDb.set(c.noiseDb); C.volume.set(c.volume); C.dur.set(Math.max(1, c.duration || 20)); C.inf.set(!c.duration); C.fin.set(c.fadeIn); C.fout.set(c.fadeOut); C.tlsw.set(c.useTimeline);
      const tone = mode !== 'noise'; const beatOn = mode === 'binaural' || mode === 'monaural' || mode === 'isochronic';
      $('.ctl-label span', C.beat.el).textContent = mode === 'isochronic' ? 'Pulse rate' : 'Beat frequency';
      C.beat.el.classList.toggle('hide', !beatOn); $('#bandChips', root).classList.toggle('hide', !beatOn);
      C.beat.setDisabled(c.useTimeline);
      C.carrier.el.classList.toggle('hide', !tone); $('#f_ear', root).classList.toggle('hide', mode !== 'binaural'); $('#f_center', root).classList.toggle('hide', !(mode === 'binaural' || mode === 'monaural'));
      C.pulse.el.classList.toggle('hide', mode !== 'isochronic'); C.noiseDb.el.classList.toggle('hide', c.noiseType === 'none' || mode === 'noise');
      C.inf.el.classList.toggle('hide', c.useTimeline); C.dur.el.classList.toggle('hide', !!c.useTimeline || !c.duration && false);
      C.dur.setDisabled(!c.duration && !c.useTimeline); $('#tlBox', root).classList.toggle('hide', !c.useTimeline);
      if (c.useTimeline) renderTimeline(); else $('#tlTotal', root).textContent = '';
      $('#tlHint', root).textContent = c.useTimeline ? 'Timeline on — edit the segments in the card below.' : ''; $('#stName', root).textContent = S.name; refreshReadouts(); refreshWarn(); refreshTime();
    }
    function curBeat() { return Engine.state !== 'idle' && Engine.cfg ? Engine.currentBeat() : AudioCore.beatAt(S.cfg, 0); }
    function refreshReadouts(beatOverride) {
      const c = S.cfg; const beat = beatOverride != null ? beatOverride : curBeat(); const f = AudioCore.earFreqs(c, beat); const mode = c.mode; const nz = mode === 'noise';
      $('#rdL', root).innerHTML = nz ? '—' : mode === 'binaural' ? `${fmt.hz(f.L)}<small>Hz</small>` : mode === 'monaural' ? `${fmt.hz(f.lo)}<small>Hz</small>` : `${fmt.hz(c.carrier)}<small>Hz</small>`;
      $('#rdR', root).innerHTML = nz ? '—' : mode === 'binaural' ? `${fmt.hz(f.R)}<small>Hz</small>` : mode === 'monaural' ? `${fmt.hz(f.hi)}<small>Hz</small>` : `${fmt.hz(c.carrier)}<small>Hz</small>`;
      $('#rdLs', root).textContent = nz ? 'noise only' : mode === 'binaural' ? 'pure sine' : mode === 'monaural' ? 'mixed to both ears' : 'both ears identical';
      $('#rdRs', root).textContent = nz ? 'noise only' : mode === 'binaural' ? 'pure sine' : mode === 'monaural' ? 'mixed to both ears' : 'both ears identical';
      const hasBeat = mode === 'binaural' || mode === 'monaural' || mode === 'isochronic';
      $('#rdB', root).innerHTML = hasBeat ? `${fmt.hz(beat)}<small>Hz</small>` : '—';
      const cents = mode === 'binaural' || mode === 'monaural' ? Math.abs(1200 * Math.log2(f.hi / f.lo)) : 0;
      $('#rdBs', root).textContent = mode === 'isochronic' ? 'pulses per second' : hasBeat ? `${fmt.num(cents, 1)} cents apart` : 'no beat';
      const bd = bandOf(beat); $('#rdBand', root).textContent = hasBeat ? bd.name : '—'; $('#rdBand', root).style.color = hasBeat ? bd.color : ''; $('#rdBandS', root).textContent = hasBeat ? bd.feel : '';
      ruler.update(hasBeat ? beat : 6); $('.bandruler', root).style.opacity = hasBeat ? 1 : 0.3;
      $('#hearText', root).textContent = hearText(c, beat); view.set({ cfg: c, beat: hasBeat ? beat : 0, playing: Engine.state === 'playing' });
    }
    function refreshWarn() { $('#warnBox', root).innerHTML = warnings(S.cfg, curBeat()).map((w) => `<div class="callout warn">${icon('warn')}<div>${w}</div></div>`).join(''); }
    function refreshTime() {
      const tot = Engine.state !== 'idle' ? Engine.duration() : AudioCore.totalSeconds(S.cfg); const t = Engine.state !== 'idle' ? Engine.position() : 0;
      $('#tpTime', root).textContent = `${fmt.time(t)} / ${isFinite(tot) ? fmt.time(tot) : '∞'}`; $('#tpBar', root).style.width = (isFinite(tot) && tot ? clamp(t / tot, 0, 1) * 100 : 0) + '%';
    }
    function refreshTransport() {
      const st = Engine.state; const btn = $('#playBtn', root); btn.innerHTML = icon(st === 'idle' ? 'play' : 'stop'); btn.classList.toggle('on', st !== 'idle'); btn.setAttribute('aria-label', st === 'idle' ? 'Play' : 'Stop');
      $('#tpState', root).textContent = st === 'idle' ? 'Ready · fades in gently' : st === 'paused' ? 'Paused' : `Playing · ${S.name}`;
      $('#measBadge', root).textContent = st === 'idle' ? 'idle' : 'live'; $('#measBadge', root).className = 'badge ' + (st === 'idle' ? '' : 'good');
      view.set({ playing: st === 'playing' }); if (st === 'idle') { $('#measure', root).textContent = 'start playback to measure'; refreshReadouts(); }
    }
    const offs = [Engine.on('state', refreshTransport), Engine.on('ended', refreshTransport)];

    function tick(ts) {
      raf = requestAnimationFrame(tick);
      if (Engine.state === 'idle') return;
      refreshTime(); const lv = Engine.levels(); view.levels(lv.L, lv.R);
      $('#mtL', root).style.width = clamp((lv.L + 60) / 60, 0, 1) * 100 + '%'; $('#mtR', root).style.width = clamp((lv.R + 60) / 60, 0, 1) * 100 + '%';
      $('#lvL', root).textContent = isFinite(lv.L) ? fmt.num(lv.L, 1) + ' dBFS' : '—'; $('#lvR', root).textContent = isFinite(lv.R) ? fmt.num(lv.R, 1) + ' dBFS' : '—';
      if (S.cfg.useTimeline || Engine.cfg.useTimeline) { const cur = $('#tlCursor', root); if (cur) { const x = Viz.cursorX(Engine.cfg, Engine.position()); cur.setAttribute('x1', x); cur.setAttribute('x2', x); cur.setAttribute('opacity', 1); } }
      if (ts - lastMeasure > 450) {
        lastMeasure = ts; refreshReadouts();
        const m = Engine.measure();
        if (m && Engine.cfg.mode !== 'noise') {
          const okL = m.L.db > -95 && Math.abs(m.L.f - m.expected.L) < 0.35; const okR = m.R.db > -95 && Math.abs(m.R.f - m.expected.R) < 0.35;
          const show = (x) => (x.db > -95 ? x.f.toFixed(2) + ' Hz' : '—');
          $('#measure', root).innerHTML = `L ${show(m.L)} · R ${show(m.R)}${Engine.cfg.mode === 'binaural' && m.L.db > -95 && m.R.db > -95 ? ` · Δ ${(Math.abs(m.R.f - m.L.f)).toFixed(2)} Hz` : ''} ${okL && okR ? '<span class="good">✓ matches</span>' : '<span class="muted">(settling…)</span>'}`;
        } else if (m) $('#measure', root).textContent = 'noise only';
      }
    }
    Studio.setUI({ syncAll });
    view.start(); syncAll(); refreshTransport(); raf = requestAnimationFrame(tick); UI.wireInfo(root);
    return () => { cancelAnimationFrame(raf); view.stop(); offs.forEach((o) => o()); Studio.setUI(null); };
  },
};
