/* ═══════════════════════════ 32 · the voice chooser ═══════════════════════════
   One small piece of page shared by the three places a voice can be chosen: the sheet that sets up a guided practice, the Meditate page's defaults, and the reader's read-aloud panel. They all
   save the same choice (Speech.choose, key speech.voice), so the voice picked for one is the voice of the others. It lists the voices on the device, best first and in groups (lsVoiceGroups),
   has a preview button, and, only when the best voice found is a plain one, a short and kind note on how to add a better voice (lsAdvice, lsHowTo). It draws nothing if the browser has no speech. */
function voiceChooser(host, opt) {
  const o = opt || {}; if (!host || !Speech.ok) return { destroy() {}, fill() {} };
  host.innerHTML = `<div class="vchoose"><div class="vc-pick"><span class="lbl">${esc(o.label || 'Voice')}</span><select class="select" data-vc="select" aria-label="${esc(o.label || 'Voice')}"></select>${o.preview === false ? '' : `<button type="button" class="btn sm" data-vc="preview">${icon('play')}<span>Preview</span></button>`}<button type="button" class="btn sm ghost" data-vc="more" hidden>Show all voices</button></div>
    <div class="small muted" data-vc="status" aria-live="polite" hidden></div><details class="vc-help" data-vc="help" hidden></details></div>`;
  const q = (k) => host.querySelector(`[data-vc="${k}"]`); let off = null; let dead = false; let showAll = false;
  const VC_FIRST = 6;      /* a device can list about forty names (a dozen older styles, "Bad News", "Boing"): the first six, best first, and a button for the rest (UX-31 of UX_AUDIT.md) */
  const real = q('preview'); const btn = real || { dataset: {}, addEventListener() {} }; const setBtn = (playing) => { if (!real) return; btn.innerHTML = `${icon(playing ? 'stop' : 'play')}<span>${playing ? 'Stop' : 'Preview'}</span>`; btn.dataset.playing = playing ? '1' : ''; };
  const fill = () => {
    if (dead) return; if (host.isConnected === false) { destroy(); return; }
    const sel = q('select'); const all = Speech.all(); const eng = all.filter(lsIsEnglish); const groups = lsVoiceGroups(eng.length ? eng : all); const pref = Speech.pref(); const best = Speech.best();       // the texts and the guidance are English: other languages only when the device has no English voice at all
    const total = groups.reduce((n, g) => n + g.voices.length, 0); let room = VC_FIRST;
    const first = groups.map((g) => { const take = g.voices.slice(0, Math.max(0, room)); room -= take.length; return { key: g.key, label: g.label, voices: take }; }).filter((g) => g.voices.length);
    const has = (list, uri) => !!uri && list.some((g) => g.voices.some((v) => v.voiceURI === uri));
    if (!showAll && has(groups, pref.uri) && !has(first, pref.uri)) showAll = true;      /* the voice already chosen is always in the list: if it is not among the first six, the whole list opens */
    const shown = showAll || total <= VC_FIRST ? groups : first; const more = q('more'); if (more) more.hidden = showAll || total <= VC_FIRST;
    sel.innerHTML = `<option value="">${esc(best ? `Automatic · ${best.name}` : 'Automatic')}</option>${shown.map((g) => `<optgroup label="${esc(g.label)}">${g.voices.map((v) => `<option value="${esc(v.voiceURI)}">${esc(lsVoiceLabel(v))}</option>`).join('')}</optgroup>`).join('')}`;
    sel.value = has(shown, pref.uri) ? pref.uri : '';
    const adv = Speech.advice(); const help = q('help');
    q('status').textContent = all.length ? '' : 'No voices were found on this device.'; q('status').hidden = !q('status').textContent;
    help.hidden = !adv.show || !all.length;
    if (!help.hidden && !help.dataset.set) { help.dataset.set = '1'; help.innerHTML = `<summary>Want a smoother voice?</summary><p>The voices come from your device, and the best ones are not installed by default. Adding one is free.</p><ul>${lsHowTo(typeof navigator !== 'undefined' ? navigator.userAgent : '').map((x) => `<li><b>${esc(x.os)}:</b> ${esc(x.text)}</li>`).join('')}</ul>`; }
  };
  const destroy = () => { dead = true; if (off) { off(); off = null; } if (btn.dataset.playing) Speech.cancel(); };       // only a preview it started is stopped: it may be drawn again while something else is being said
  q('select').addEventListener('change', (e) => { Speech.choose(e.target.value); fill(); if (Speech.busy()) Speech.restart(); if (o.onChange) o.onChange(e.target.value); });
  const moreBtn = q('more'); if (moreBtn) moreBtn.addEventListener('click', () => { showAll = true; fill(); q('select').focus(); });
  btn.addEventListener('click', () => {
    if (btn.dataset.playing) { Speech.cancel(); setBtn(false); return; }
    setBtn(true); const done = () => { if (!dead) setBtn(false); };
    Speech.preview({ text: o.sample, style: o.style || 'guide', settings: o.settings, onDone: done, onFail: (why) => { done(); q('status').hidden = false; q('status').textContent = why === 'blocked' ? 'The browser blocked the voice: click on the page, then try again.' : 'This voice did not respond. Try another.'; } });
  });
  off = Speech.onVoices(fill); fill();
  return { destroy, fill };
}
