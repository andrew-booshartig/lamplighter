/* ═══════════════════════════ 67 · Setup: your data, preferences and level; the headphone check and the engine self-test (Practice → Sound) ═══════════════════════════
   Setup (the gear) opens on what a visitor is looking for: Your data (a line of what is kept, backup and restore; the page that lists each kind and resets or deletes one at a time is Setup → Your data, #/setup/data, 6zzf-data.js), Preferences (theme, reduce motion) and, while FEEDBACK_BETA is on, the box that writes a note for the maker.
   The headphone check, the headphone tips and the engine self-test are a page of their own under Practice → Sound (#/headphones, Pages.headphones below); Setup links to it. Every control works as it did. */

/* AA-23 (alpha audit of 21 November 2026): Larger text. The app's own text and controls are sized in rem (16 px at 100%), so one setting on the page, data-text-size on <html>, scales all of them: Normal 100%, Larger 125%, Largest 150%
   of the base 15 px (the block AA-23 of app.css). It is kept in the existing settings object under textSize. The reader's own size (Aa) and the drawings' own pixels (the family tree's rows, the history chart, SVG labels) are not touched. */
const TEXT_SIZES = { normal: 100, larger: 125, largest: 150 };
const textSizeKey = () => { const v = typeof Settings !== 'undefined' ? Settings.get('textSize') : null; return Object.keys(TEXT_SIZES).includes(v) ? v : 'normal'; };
function applyTextSize() { try { const el = document.documentElement; if (!el || !el.dataset) return; const k = textSizeKey(); if (k === 'normal') delete el.dataset.textSize; else el.dataset.textSize = k; } catch (e) { /* no page to set it on */ } }
applyTextSize();

/* one-shot single-channel tone (for the stereo check) */
async function blip(channel, freq = 440, secs = 1.8) {
  const ctx = await Engine.unlock(); const t0 = ctx.currentTime + 0.05;
  const o = ctx.createOscillator(); o.frequency.value = freq; const g = ctx.createGain(); g.gain.value = 0;
  const m = ctx.createChannelMerger(2); o.connect(g); g.connect(m, 0, channel === 'L' ? 0 : 1); m.connect(ctx.destination);
  const peak = Math.min(AudioCore.volToGain(Math.min(Studio.state.cfg.volume, 0.6)) * 2.5, 0.25);
  g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(peak, t0 + 0.12); g.gain.setValueAtTime(peak, t0 + secs - 0.25); g.gain.linearRampToValueAtTime(0, t0 + secs);
  o.start(t0); o.stop(t0 + secs + 0.05);
  return new Promise((r) => { o.onended = () => { try { m.disconnect(); } catch (e) { /* noop */ } r(); }; });
}

/* offline (silent) verification of the audio engine on this device */
async function runSelfTest() {
  const sr = 48000; const base = { fadeIn: 0.2, fadeOut: 0.2, volume: 0.8, noiseType: 'none', useTimeline: false, duration: 8 / 60 };
  const render = (c) => AudioCore.renderOffline(Object.assign({}, base, c), 8, sr);
  const zc = (x) => AudioCore.zeroCrossFreq(x, sr, sr * 2, sr * 7); const res = []; const add = (name, ok, detail) => res.push({ name, ok, detail });
  let a = await render({ mode: 'binaural', carrier: 400, beat: 6, higher: 'R', centering: 'sym' }); let fl = zc(a.L), fr = zc(a.R);
  add('Binaural pair: 400 Hz carrier, 6 Hz beat, right higher', Math.abs(fl - 397) < 0.01 && Math.abs(fr - 403) < 0.01, `left ${fl.toFixed(3)} Hz · right ${fr.toFixed(3)} Hz (expected 397 / 403)`);
  a = await render({ mode: 'binaural', carrier: 300, beat: 7.83, higher: 'L', centering: 'sym' }); fl = zc(a.L); fr = zc(a.R);
  add('Fractional beat with left higher (7.83 Hz)', Math.abs(fl - fr - 7.83) < 0.01, `difference ${(fl - fr).toFixed(3)} Hz (expected 7.830)`);
  a = await render({ mode: 'binaural', carrier: 400, beat: 6, higher: 'R', centering: 'low' }); fl = zc(a.L); fr = zc(a.R);
  add('“Lower ear = carrier” placement', Math.abs(fl - 400) < 0.01 && Math.abs(fr - 406) < 0.01, `left ${fl.toFixed(3)} · right ${fr.toFixed(3)} Hz`);
  const rmsOf = async (c) => { const x = await render(c); return AudioCore.rms(x.L, sr * 3, sr * 7); };
  const levels = { binaural: await rmsOf({ mode: 'binaural', carrier: 400, beat: 6 }), control: await rmsOf({ mode: 'control', carrier: 400 }), monaural: await rmsOf({ mode: 'monaural', carrier: 400, beat: 6 }), isochronic: await rmsOf({ mode: 'isochronic', carrier: 400, beat: 6, pulse: 0.55 }) };
  const lv = Object.values(levels); const spread = (Math.max(...lv) / Math.min(...lv) - 1) * 100;
  add('Equal loudness across all modes (fair blinded comparisons)', spread < 1, `max difference ${spread.toFixed(4)} %`);
  a = await render({ mode: 'binaural', carrier: 400, beat: 6 }); let jmax = 0; for (let i = 1; i < a.L.length; i++) jmax = Math.max(jmax, Math.abs(a.L[i] - a.L[i - 1]));
  const expectStep = ((2 * Math.PI * 403) / sr) * AudioCore.volToGain(0.8);
  add('Smooth waveform — no clicks or pops', jmax <= expectStep * 1.02, `largest sample-to-sample step ${(jmax / expectStep * 100).toFixed(1)} % of a pure sine’s`);
  a = await render({ mode: 'isochronic', carrier: 400, beat: 10, pulse: 1 });
  const win = Math.floor(sr * 0.01); const env = []; for (let i = sr * 2; i + win < sr * 7; i += win) { let q = 0; for (let j = 0; j < win; j++) q += a.L[i + j] ** 2; env.push(Math.sqrt(q / win)); }
  const m = Stats.mean(env); let best = [0, 0]; for (let f = 1; f <= 30; f += 0.5) { let re = 0, im = 0; env.forEach((v, i) => { const ph = (2 * Math.PI * f * i * win) / sr; re += (v - m) * Math.cos(ph); im += (v - m) * Math.sin(ph); }); const mag = Math.hypot(re, im); if (mag > best[1]) best = [f, mag]; }
  add('Isochronic pulse rate (10 Hz)', Math.abs(best[0] - 10) <= 0.5, `strongest rhythm at ${best[0].toFixed(1)} Hz`);
  a = await AudioCore.renderOffline(Object.assign({}, base, { mode: 'binaural', carrier: 400, beat: 6, useTimeline: true, timeline: [{ dur: 0.25, from: 10, to: 4, curve: 'linear' }], duration: 0.25 }), 16, sr);
  const win2 = (t0, t1) => zcRange(a.R, t0, t1) - zcRange(a.L, t0, t1); function zcRange(x, t0, t1) { return AudioCore.zeroCrossFreq(x, sr, Math.floor(sr * t0), Math.floor(sr * t1)); }
  const b1 = win2(1, 2), b2 = win2(12, 13);
  add('Timeline ramp 10 → 4 Hz over 15 s', Math.abs(b1 - 9.4) < 0.1 && Math.abs(b2 - 5.0) < 0.1, `beat at 1.5 s: ${b1.toFixed(2)} Hz (expect 9.40) · at 12.5 s: ${b2.toFixed(2)} Hz (expect 5.00)`);
  add('SHA-256 (used to seal targets)', sha256('abc') === 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad', 'matches the FIPS test vector');
  return res;
}

/* Practice → Sound → Headphone check: the stereo check, the silent self-test of the engine, and tips for the usual headphone settings. It is where the sound features start, so it carries the full safety note. */
Pages.headphones = {
  mount(root) {
    const res = { L: null, R: null, beat: null }; const loc = secLocate('headphones');
    root.innerHTML = `${secHeadHTML(loc, { title: 'Headphone check', compact: false, blurb: 'Binaural beats only work if your headphones deliver a genuinely separate signal to each ear. Two minutes here saves a lot of confusion later.' })}${secNavHTML(loc, { lab: !!Settings.get('showLab') })}
    <div class="callout warn fade-in">${icon('warn')}<div>The Lamplighter Project is not a medical device. The sound and light features are for relaxation and study: stop if anything feels uncomfortable, don’t use them while driving, and if you have a seizure history talk with a clinician first.</div></div>
    <div class="grid c2" style="margin-top:16px">
      <div class="stack">
        <section class="card fade-in"><div class="card-title"><h3>${icon('headphones')}Headphone check</h3><span class="badge" id="hpBadge">not run</span></div>
          <div class="stack sm">
            <p class="t2">Put your headphones on (wired or Bluetooth), set a <b>low</b> volume, then run each test.</p>
            <div class="spread card tight flat"><div><b>1 · Left ear only</b><div class="small muted">A short tone plays in the left channel.</div></div><div class="row"><button class="btn sm" data-t="L">${icon('play')}Play</button><div class="seg sm" data-ans="L"><button data-a="y">Only left</button><button data-a="n">Both / right</button></div></div></div>
            <div class="spread card tight flat"><div><b>2 · Right ear only</b><div class="small muted">Now the right channel.</div></div><div class="row"><button class="btn sm" data-t="R">${icon('play')}Play</button><div class="seg sm" data-ans="R"><button data-a="y">Only right</button><button data-a="n">Both / left</button></div></div></div>
            <div class="spread card tight flat"><div><b>3 · Can you hear a beat?</b><div class="small muted">400 Hz vs 406 Hz for 8 seconds — listen for a slow wobble.</div></div><div class="row"><button class="btn sm" data-t="beat">${icon('play')}Play</button><div class="seg sm" data-ans="beat"><button data-a="y">Yes</button><button data-a="m">Faintly</button><button data-a="n">No</button></div></div></div>
            <div id="hpResult"></div>
          </div></section>

        <section class="card fade-in"><div class="card-title"><h3>${icon('shield')}Engine self-test</h3><span class="badge" id="stBadge">not run</span></div><div class="stack sm">
          <p class="t2 small">Most tone apps ask you to trust them. The Lamplighter Project can check itself: this renders each mode <b>silently in memory</b> and measures the actual frequencies, loudness matching and click-freedom on <i>your</i> browser.</p>
          <div class="row"><button class="btn sm" id="stRun">${icon('check')}Run self-test</button></div><div id="stOut" class="stack sm"></div></div></section>
      </div>

      <div class="stack">
        <section class="card fade-in"><div class="card-title"><h3>${icon('headphones')}Headphone tips (Sony &amp; others)</h3></div>
          <div class="stack sm small t2">
            <div><b>Sony “Headphones Connect” app</b><ul><li>Turn <b>360 Reality Audio</b> / spatial or “virtual surround” effects <b>off</b> — they blend the channels.</li><li>Set the <b>Equalizer</b> to Off/flat, Clear Bass at 0.</li><li>Turn <b>Speak-to-Chat</b> off so audio doesn’t pause when you cough.</li><li>Noise cancelling is fine, and can help.</li></ul></div>
            <div><b>Mac:</b> System Settings → Accessibility → Audio → turn <b>“Play stereo audio as mono”</b> off. If sound turns muffled or mono, the headset mic may be active (Bluetooth “call mode”) — pick the built-in mic as input.</div>
            <div><b>Windows:</b> Sound → Spatial sound: Off; Accessibility → Audio → Mono audio: Off. <b>iPhone/Android:</b> Accessibility → Mono audio: Off (and on iPhone, switch the side switch to “ring” — silent mode mutes web audio).</div>
            <div><b>Wired vs Bluetooth:</b> both work — low-frequency tones survive Bluetooth compression fine; wired just avoids dropouts. Get a good seal: bass-heavy 200–400 Hz tones leak with a poor fit.</div>
          </div></section>
      </div>
    </div>`;

    /* headphone tests */
    const hpUpdate = () => {
      const ok = res.L === 'y' && res.R === 'y'; const fail = res.L === 'n' || res.R === 'n'; const done = res.L && res.R;
      const badge = $('#hpBadge', root); const out = $('#hpResult', root);
      if (ok) { badge.textContent = 'stereo OK'; badge.className = 'badge good'; Settings.set('hpChecked', true); out.innerHTML = UI.callout('good', `<b>Stereo confirmed.</b> Your headphones deliver separate left and right channels.${res.beat === 'n' ? ' You didn’t hear a beat — that’s common at first. Try a different carrier (300–450 Hz), a slightly lower volume, and a quiet room; or use Monaural/Isochronic, which are easier to hear.' : res.beat === 'm' ? ' A faint beat is normal — binaural beats are subtle by design.' : res.beat === 'y' ? ' And you hear the beat — you’re all set.' : ''}`, 'check'); }
      else if (fail) { badge.textContent = 'problem'; badge.className = 'badge bad'; Settings.set('hpChecked', false); out.innerHTML = UI.callout('bad', `<b>The channels are leaking.</b> A tone meant for one ear was audible in both, so binaural beats won’t work properly. Check the tips on the right: mono audio, spatial/360 audio, or EQ/virtualisation features are the usual culprits.`, 'warn'); }
      else { badge.textContent = done ? 'checked' : 'in progress'; badge.className = 'badge warn'; out.innerHTML = ''; }
    };
    if (Settings.get('hpChecked')) { $('#hpBadge', root).textContent = 'stereo OK'; $('#hpBadge', root).className = 'badge good'; }
    root.addEventListener('click', async (e) => {
      const t = e.target.closest('[data-t]'); if (t) {
        t.disabled = true; try {
          if (t.dataset.t === 'beat') { await Engine.play({ mode: 'binaural', carrier: 400, beat: 6, higher: 'R', centering: 'low', duration: 8 / 60, fadeIn: 0.5, fadeOut: 0.8, volume: Math.min(Studio.state.cfg.volume, 0.6), noiseType: 'none' }, { name: 'Beat check', demo: true }); await new Promise((r) => { const off = Engine.on('state', (s) => { if (s === 'idle') { off(); r(); } }); }); }
          else await blip(t.dataset.t);
        } catch (err) { toast('Audio could not start: ' + esc(err.message), 'bad'); } t.disabled = false; return;
      }
      const a = e.target.closest('[data-ans] button'); if (a) { const grp = a.closest('[data-ans]'); res[grp.dataset.ans] = a.dataset.a; $$('button', grp).forEach((b) => b.setAttribute('aria-pressed', b === a)); hpUpdate(); }
    });

    $('#stRun', root).addEventListener('click', async () => {
      const b = $('#stRun', root); b.disabled = true; $('#stBadge', root).textContent = 'running…'; $('#stBadge', root).className = 'badge warn';
      try { const res = await runSelfTest(); const ok = res.every((r) => r.ok);
        $('#stOut', root).innerHTML = res.map((r) => `<div class="spread card tight flat" style="align-items:flex-start;gap:10px"><div><b>${r.ok ? '<span class="good">✓</span>' : '<span class="bad">✗</span>'} ${r.name}</b><div class="small muted mono">${esc(r.detail)}</div></div></div>`).join('');
        $('#stBadge', root).textContent = ok ? `all ${res.length} passed` : 'failures'; $('#stBadge', root).className = 'badge ' + (ok ? 'good' : 'bad'); }
      catch (e) { $('#stOut', root).innerHTML = UI.callout('bad', 'Self-test could not run: ' + esc(e.message), 'warn'); $('#stBadge', root).textContent = 'error'; $('#stBadge', root).className = 'badge bad'; }
      b.disabled = false;
    });
    return () => { if (Engine.meta && Engine.meta.demo) Engine.stop(0.2); };
  },
};

Pages.setup = {
  mount(root, parts, query) {
    if (typeof navSeenSetup === 'function') navSeenSetup();      /* the dot on the gear (the box for the maker is in here) goes once Setup has been opened (AA-15) */
    if (parts && parts[0] === 'data' && typeof dataPageMount === 'function') return dataPageMount(root, parts.slice(1), query);      /* Setup → Your data (#/setup/data): 6zzf-data.js */
    root.innerHTML = `<div class="page-head fade-in"><div><h1>Setup</h1><p>Your data and your preferences. <a href="#/headphones">The headphone check is under Practice → Sound.</a></p>${FEEDBACK_BETA ? `<p class="small beta-line">Further down: <button type="button" class="fb-jump" id="fbJump">Tell the maker what to change</button></p>` : ''}</div></div>
    <div class="grid c2">
      <div class="stack">
        <section class="card fade-in"><div class="card-title"><h3>${icon('download')}Your data</h3></div><div class="stack sm">
          <p class="t2 small">Everything is stored in this browser only — nothing is uploaded. Export a backup now and then (clearing browser data deletes it); PDFs are left out of it because they can be large.</p>
          <p class="small" id="dHead" style="margin:0"></p>
          <div class="row"><a class="btn sm primary" href="#/setup/data">See and reset your data</a><button class="btn sm" id="dExport">${icon('download')}Export all</button><label class="btn sm" style="cursor:pointer">${icon('upload')}Import<input type="file" id="dImport" accept="application/json" hidden></label></div>
          <div class="hint" id="storeNote"></div><p class="small t2" style="margin:0">To keep a copy of the app itself, to use offline, see <a href="#/path/carry">Take it with you</a>.</p></div></section>
      </div>

      <div class="stack">
        <section class="card fade-in"><div class="card-title"><h3>${icon('gear')}Preferences</h3></div><div class="stack sm">
          <div class="field"><label class="lbl">Theme</label><div id="themeSlot"></div></div><div class="field"><label class="lbl">Larger text</label><div id="textSlot"></div><div class="hint">Makes the app’s own text and buttons bigger: Larger is 125%, Largest 150%. The reader keeps its own size under Aa, and your browser’s text size still counts.</div></div><div id="rmSlot"></div><div id="labSlot"></div><div class="hint">Experiments (blinded tone trials) and Journal (daily check-ins) are hidden from the menu by default. They still work if you switch them on.</div>
          <div class="hint">Reduce motion also freezes the head-view animation. The Lamplighter Project’s visuals never flash at the beat rate either way.</div>
        </div></section>
      </div>
    </div>
    <details class="toc lv-fold" id="lvFold" style="margin-top:16px"><summary>Sound level</summary>
    <div class="grid c2" style="margin-top:10px"><div class="stack">
        <section class="card fade-in"><div class="card-title"><h3>${icon('ear')}Level</h3></div><div class="stack sm">
          <p class="t2">Find a comfortable level with pink noise: <b>soft rain or a distant fan</b> — clearly there, but you could listen for an hour and still hear your own breathing. Quiet is right; beat tones should sit just above “clearly audible”. <a href="#/learn/level">How loud should the noise be? →</a></p>
          <div id="lvSlot"></div>
          <div class="row"><button class="btn sm" id="lvPlay">${icon('play')}Play reference noise</button><button class="btn sm primary" id="lvSave">Save as my default volume</button></div>
          <div id="capSlot"></div><div id="nshiftSlot"></div><div class="hint" id="nshiftHint"></div></div></section>
    </div></div></details>
        ${FEEDBACK_BETA ? `<section class="card fade-in" id="fbCard" style="margin-top:16px"><div class="card-title"><h3>${icon('pen')}${feedbackStageCap()}: tell the maker what to change</h3></div><div class="stack sm">
          <p class="t2 small">This is ${feedbackStageA()}. ${FEEDBACK_TO ? 'Write what was broken, confusing, missing, wrong or good, then email it with the button below, or copy it or save it. Nothing is sent from here: the box below shows exactly what will be copied, and the email button opens your own mail app with the note in it.' : FEEDBACK_ISSUES ? 'Write what was broken, confusing, missing, wrong or good, then copy it and paste it into a new issue on GitHub (the button below opens the page; a free GitHub account is needed), or save it as a file. Nothing is sent from here: the box below shows exactly what will be copied, and the issue page opens only when you click.' : 'Write what was broken, confusing, missing, wrong or good, then copy it or save it and send it to the person who gave you this copy. Nothing is sent from here: the box below shows exactly what will be copied.'}</p>
          <div class="field"><label for="fbKind">What kind of thing is it?</label><select class="select" id="fbKind">${FB_KINDS.map(([v, n]) => `<option value="${v}">${esc(n)}</option>`).join('')}</select></div>
          <div class="field"><label for="fbNote">Your note</label><textarea class="textarea" id="fbNote" rows="5" maxlength="${FB_NOTE_MAX}" placeholder="What you saw, what you expected, what you would change…"></textarea></div>
          <label class="chk"><input type="checkbox" id="fbPage" checked><span class="small">Include the page I was on</span></label>
          <label class="chk"><input type="checkbox" id="fbEnv" checked><span class="small">Include my browser, screen size and settings (so it can be reproduced)</span></label>
          <pre class="fb-preview" id="fbPreview" aria-label="Exactly what will be copied"></pre>
          <div class="row"><button class="btn primary sm" id="fbCopy" type="button">${icon('copy')}Copy</button><button class="btn sm" id="fbSave" type="button">${icon('download')}Save as a file</button><a class="btn sm" id="fbMail" hidden>Email it</a>${FEEDBACK_ISSUES && !FEEDBACK_TO ? `<a class="btn sm" id="fbIssue" href="${esc(FEEDBACK_ISSUES)}" target="_blank" rel="noopener noreferrer">Open a GitHub issue ↗</a>` : ''}</div></div></section>` : ''}
        <div class="tiny muted center" style="margin-top:14px">${APP.name} · ${releaseLabel(APP.release)} · runs entirely offline · <a href="#/methods">Methods and standards</a> · <button type="button" class="cite-link" data-citeapp>Cite this app</button></div>
    `;

    /* level */
    const lv = UI.slider({ id: 'lv', label: 'Reference volume', min: 0, max: 1, step: 0.01, value: Studio.state.cfg.volume, dec: 2, fmtFn: (v) => Math.round(v * 100) + '%', onInput: (v) => { Engine.setVolume(v); } }); $('#lvSlot', root).replaceWith(lv.el);
    $('#lvPlay', root).addEventListener('click', async () => { if (Engine.state !== 'idle') { Engine.stop(0.4); return; } await Engine.play({ mode: 'noise', noiseType: 'pink', volume: lv.get(), duration: 0, fadeIn: 1.5, fadeOut: 1 }, { name: 'Reference noise', demo: true }); });
    $('#lvSave', root).addEventListener('click', () => { Studio.state.cfg.volume = lv.get(); Studio.persist(); toast('Default volume saved', 'good'); });
    const cap = UI.slider({ id: 'cap', label: 'Maximum volume ceiling', min: 0.2, max: 1, step: 0.01, value: Settings.get('volumeCap'), dec: 2, fmtFn: (v) => Math.round(v * 100) + '%', info: 'A hard ceiling on the in-app volume slider — a safeguard against accidentally playing too loud. Your device volume still applies.', onInput: (v) => Settings.set('volumeCap', v) }); $('#capSlot', root).replaceWith(cap.el);
    const nsHint = (v) => { $('#nshiftHint', root).textContent = `Calm — Alpha now opens at ${clamp(-14 + v, -40, -3).toFixed(0)} dB noise · Focus — Beta at ${clamp(-12 + v, -40, -3).toFixed(0)} dB. Applies the next time you load a built-in preset; your saved presets and existing experiments keep their own levels.`; };
    const ns = UI.slider({ id: 'nshift', label: 'Noise comfort shift', min: -20, max: 6, step: 1, value: Settings.get('noiseShift'), unit: 'dB', dec: 0, fmtFn: (v) => (v > 0 ? '+' : '') + v.toFixed(0), ends: ['quieter noise', 'louder noise'], info: 'Each built-in preset has its own noise level (mostly −8 to −14 dB relative to the tones). This moves them all together so they open where <i>you’re</i> comfortable. The Lamplighter Project ships at −5 dB because the −14 dB default got irritating within minutes for the person it was tuned with. Set it to 0 to restore the original levels. In an experiment, both conditions get the same shift.', onInput: (v) => { Settings.set('noiseShift', v); nsHint(v); } });
    $('#nshiftSlot', root).replaceWith(ns.el); nsHint(ns.get());

    /* prefs */
    const th = UI.seg({ label: 'Theme', options: [{ v: 'auto', label: 'Auto' }, { v: 'dark', label: 'Dark' }, { v: 'light', label: 'Light' }], value: Settings.get('theme'), onChange: (v) => Settings.set('theme', v) }); $('#themeSlot', root).replaceWith(th.el);
    const tsz = UI.seg({ label: 'Larger text', options: [{ v: 'normal', label: 'Normal' }, { v: 'larger', label: 'Larger' }, { v: 'largest', label: 'Largest' }], value: textSizeKey(), onChange: (v) => { Settings.set('textSize', v); applyTextSize(); } }); $('#textSlot', root).replaceWith(tsz.el);
    const rm = UI.switchEl({ label: 'Reduce motion', checked: Settings.get('reduceMotion'), onChange: (v) => Settings.set('reduceMotion', v) }); $('#rmSlot', root).replaceWith(rm.el); const lab = UI.switchEl({ label: 'Show lab tools (Experiments, Journal)', checked: !!Settings.get('showLab'), onChange: (v) => { Settings.set('showLab', v); refreshNav(); } }); $('#labSlot', root).replaceWith(lab.el);

    /* data */
    $('#storeNote', root).textContent = store.persistent ? 'Browser storage is available.' : 'Browser storage is unavailable here (private window?) — your data will be lost when you close this tab. Use Export.';
    $('#dExport', root).addEventListener('click', async () => { try { await dataExportAll(); } catch (err) { toast('The export failed: ' + esc(err.message), 'bad'); } });
    $('#dImport', root).addEventListener('change', async (e) => { const f = e.target.files[0]; if (!f) return; try { await dataImportFile(f); } catch (err) { toast('Import failed: ' + esc(err.message), 'bad'); } e.target.value = ''; });
    dataSnapshot(dataRealStorage()).then((sn) => { const el = $('#dHead', root); if (el && root.isConnected) el.textContent = dataHeadline(sn); }).catch(() => { /* no count to show */ });
    /* beta feedback: a report the tester copies or saves; nothing is sent from here (the card is there only while FEEDBACK_BETA is true) */
    if ($('#fbCard', root)) {
    const fbEnv =() => ({ release: releaseLabel(APP.release), version: APP.version, ua: navigator.userAgent, screen: `${window.screen.width}×${window.screen.height} at ${window.devicePixelRatio || 1}×`, window: `${innerWidth}×${innerHeight}`, theme: Settings.get('theme'), systemTheme: window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light', reducedMotion: !!Settings.get('reduceMotion'), language: navigator.language, origin: location.protocol === 'file:' ? 'a file on this computer' : 'a web address (' + location.protocol.replace(':', '') + ')', storage: !!store.persistent });
    const fbText = () => feedbackReport({ kind: $('#fbKind', root).value, note: $('#fbNote', root).value, page: $('#fbPage', root).checked ? UI_LAST.hash : '', env: $('#fbEnv', root).checked ? fbEnv() : null });
    const fbPaint = () => { const t = fbText(); $('#fbPreview', root).textContent = t; const a = $('#fbMail', root); const href = feedbackMailHref(FEEDBACK_TO, t); a.hidden = !href; if (href) a.setAttribute('href', href); };
    ['fbKind', 'fbNote', 'fbPage', 'fbEnv'].forEach((id) => { $('#' + id, root).addEventListener('input', fbPaint); $('#' + id, root).addEventListener('change', fbPaint); }); fbPaint();
    $('#fbCopy', root).addEventListener('click', async () => { const ok = await rdCopy(fbText()); toast(ok ? (FEEDBACK_TO ? 'Copied. Paste it into a message to ' + FEEDBACK_TO + '.' : FEEDBACK_ISSUES ? 'Copied. Paste it into a new issue on GitHub.' : 'Copied. Paste it into a message to the person who gave you this copy.') : 'Copying is not available here: use Save as a file.', ok ? 'good' : 'warn', 3200); });
    $('#fbSave', root).addEventListener('click', () => { download(feedbackFileName(isoDay()), fbText(), 'text/plain;charset=utf-8'); toast('Saved. Look in your downloads.', 'good', 2600); });
    const fbShow = () => { const c = $('#fbCard', root); if (c && c.scrollIntoView) c.scrollIntoView({ block: 'start' }); const n = $('#fbNote', root); if (n) n.focus({ preventScroll: true }); };
    const fbJump = $('#fbJump', root); if (fbJump) fbJump.addEventListener('click', fbShow);      /* the quiet line under the title of this page (SA-12: the box itself is the last block of the page, under the settings; this line is only the way to it, for a phone, where the gear's dot leads here) */
    if (query && query.fb) setTimeout(fbShow, 250);
    }
    UI.wireInfo(root);
    return () => { if (Engine.meta && Engine.meta.demo) Engine.stop(0.2); };
  },
};
