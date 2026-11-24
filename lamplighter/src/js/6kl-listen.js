/* ═══════════════════════════ 6kl · Reading aloud ═══════════════════════════
   The reader can read the text it is showing out loud, with the voices the device already has (the browser's speech synthesis: the app sends nothing anywhere, and how it sounds depends on
   the voices installed). It speaks the same way the guided practices do, through one engine (`Speech`, 31-bell-speech.js): a paragraph at a time, sentence by sentence (2z-listen-core.js, so no
   utterance runs long enough for a browser to cut it off), with a real silence after each sentence and a longer one after the paragraph. The voice is the one chosen in the voice chooser
   (32-voice-chooser.js), which the guided practices share. It marks the sentence being spoken, keeps it on screen (turning the page in the paged view, scrolling in the others), goes on into
   the next section, and stops at a sleep timer, the end of the text, or when the reader says so. Pausing stops the voice and says the sentence again from its start on resume, which works the
   same on every device and cannot leave the voice stuck. rdListen(cx) is handed what it needs from the reader. */
function rdListen(cx) {
  const ok = Speech.ok;
  const KEY = 'reader.listen'; const prefs = () => lsClean(store.get(KEY, null)); const setPref = (patch) => store.set(KEY, lsClean(Object.assign(prefs(), patch)));
  let on = false; let paused = false; let q = []; let qi = 0; let chunks = []; let paraText = ''; let sleepAt = null; let ui = null; let vc = null; let begun = 0;
  const hlOK = typeof CSS !== 'undefined' && CSS.highlights && typeof Highlight !== 'undefined';
  const paras = () => $$('p[data-p]', cx.art);

  /* the words of a paragraph (without verse numbers) and where a stretch of them is in the page, as a range */
  const rangeOf = (el, a, b) => {
    try {
      const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, { acceptNode: (nd) => (nd.parentElement && nd.parentElement.closest('.vn') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT) });
      let pos = 0; let sn = null; let so = 0; let en = null; let eo = 0; let nd;
      while ((nd = w.nextNode())) { const L = nd.nodeValue.length; if (!sn && a < pos + L) { sn = nd; so = a - pos; } if (sn && b <= pos + L) { en = nd; eo = b - pos; break; } pos += L; }
      if (!sn || !en) return null; const rg = document.createRange(); rg.setStart(sn, Math.max(0, so)); rg.setEnd(en, Math.max(0, eo)); return rg;
    } catch (e) { return null; }
  };
  const clearMarks = () => { $$('.speaking', cx.art).forEach((el) => el.classList.remove('speaking')); if (hlOK) { try { CSS.highlights.delete('rdspeak'); } catch (e) { /* none */ } } };
  const info = () => { const e1 = $('#lsInfo', ui); if (e1) e1.textContent = paused ? 'Paused' : q.length ? `Paragraph ${qi + 1} of ${q.length}` : ''; const pb = $('[data-ls="play"]', ui); if (pb) { pb.textContent = paused ? '▶' : '❚❚'; pb.setAttribute('aria-label', paused ? 'Resume' : 'Pause'); pb.title = paused ? 'Resume' : 'Pause'; } };

  /* ── the voice ── */
  const sleepOver = () => { const key = prefs().sleep; if (key === 'off') return false; if (key === 'section') return false; return sleepAt != null && Date.now() >= sleepAt; };
  const markChunk = (i) => {                      // the sentence being said now: marked in the page and kept on screen
    const el = q[qi]; const c = chunks[i]; if (!el || !c) return; const rg = rangeOf(el, c.a, c.b);
    if (rg) { if (hlOK) { try { CSS.highlights.set('rdspeak', new Highlight(rg)); } catch (e) { /* the paragraph mark will do */ } } cx.reveal(rg, el); }
  };
  const beginPara = () => {
    if (!on) return; if (qi >= q.length) return finishQueue(); const el = q[qi]; if (!el || !el.isConnected) { qi++; return beginPara(); }
    paraText = (typeof rdDomText === 'function' ? rdDomText(el) : el.textContent); chunks = lsPieces(paraText, { style: 'read', max: Speech.maxChars() }); if (!chunks.length) { qi++; return beginPara(); }
    clearMarks(); const pw = el.closest ? el.closest('.pw') : null; if (pw) pw.classList.add('speaking'); info();
    Speech.say(chunks, {
      style: 'read', settings: () => ({ rate: prefs().rate, volume: 1 }),
      onPiece: (i, piece) => { if (on) markChunk(chunks.indexOf(piece)); },
      onEnd: () => { if (on && sleepOver()) stop('Sleep timer: stopped.'); },
      onDone: () => { if (!on) return; qi++; beginPara(); },
      onFail: (why) => { if (on) stop(why === 'blocked' ? 'The browser blocked the voice. Click on the page and try again.' : 'Reading aloud stopped: the voice did not respond. Try another voice under the ⋯ button.'); },
    });
  };
  const later = () => { const t = ++begun; setTimeout(() => { if (t === begun) beginPara(); }, 60); };       // only the last of several quick taps on next or previous starts anything
  const finishQueue = () => {
    if (prefs().sleep === 'section') { stop('Sleep timer: stopped at the end of the section.'); return; }
    const nx = cx.advance(q[q.length - 1]); if (nx === 'route') return;       // the reader is moving to the next section by address; the new view carries on
    if (!nx) { stop('That is the end of the text.'); return; }
    const all = paras(); const i0 = all.indexOf(nx); q = all.slice(i0 >= 0 ? i0 : 0); qi = 0; beginPara();
  };
  const jump = (dir) => { if (!on) return; qi = Math.max(0, Math.min(q.length, qi + dir)); Speech.cancel(); paused = false; later(); };

  /* ── the player ── */
  const build = () => {
    if (ui) { ui.hidden = false; return; }
    const p = prefs(); ui = document.createElement('div'); ui.className = 'rdlisten'; ui.id = 'rdListen'; ui.setAttribute('role', 'region'); ui.setAttribute('aria-label', 'Read aloud');
    ui.innerHTML = `<div class="lsrow"><button type="button" class="rdb" data-ls="prev" aria-label="Previous paragraph" title="Previous paragraph">⏮</button><button type="button" class="rdb lsplay" data-ls="play" aria-label="Pause" title="Pause">❚❚</button><button type="button" class="rdb" data-ls="next" aria-label="Next paragraph" title="Next paragraph">⏭</button><span class="lsinfo small" id="lsInfo"></span><select class="select lsrate" id="lsRate" aria-label="Speed">${LS_RATES.map((r) => `<option value="${r}"${r === p.rate ? ' selected' : ''}>${r}×</option>`).join('')}</select><button type="button" class="rdb" data-ls="more" aria-expanded="false" aria-label="Voice and sleep timer" title="Voice and sleep timer">${icon('more')}</button><button type="button" class="rdb" data-ls="close" aria-label="Stop reading aloud" title="Stop reading aloud">${icon('x')}</button></div>
      <div class="lsmore" id="lsMore" hidden><div id="lsVoiceHost"></div><label class="small">Sleep timer <select class="select" id="lsSleep" aria-label="Sleep timer">${Object.entries(LS_SLEEP).map(([k, v]) => `<option value="${k}"${k === p.sleep ? ' selected' : ''}>${esc(v[0])}</option>`).join('')}</select></label><p class="hint" style="margin:6px 0 0">The voices come from this device. The app sends nothing anywhere; a voice marked online sends the words to its own service to be spoken. The guided practices use the same voice.</p></div>`;
    cx.body.appendChild(ui);
    vc = voiceChooser($('#lsVoiceHost', ui), { style: 'read', preview: false, settings: () => ({ rate: prefs().rate, volume: 1 }) });       // no Preview here: choosing a voice says the sentence again in it, and a preview would stop the reading
    ui.addEventListener('click', (e) => {
      const b = e.target.closest('[data-ls]'); if (!b) return; const a = b.dataset.ls;
      if (a === 'close') stop(); else if (a === 'prev') jump(-1); else if (a === 'next') jump(1);
      else if (a === 'play') { if (paused) { paused = false; info(); Speech.resume(); } else { paused = true; Speech.pause(); info(); } }
      else if (a === 'more') { const m = $('#lsMore', ui); m.hidden = !m.hidden; b.setAttribute('aria-expanded', String(!m.hidden)); }
    });
    ui.addEventListener('change', (e) => {
      if (e.target.id === 'lsRate') { setPref({ rate: +e.target.value }); Speech.restart(); }
      else if (e.target.id === 'lsSleep') { setPref({ sleep: e.target.value }); sleepAt = lsSleepAt(e.target.value, Date.now()); if (e.target.value !== 'off') cx.toast(e.target.value === 'section' ? 'It will stop at the end of this section.' : `It will stop in ${LS_SLEEP[e.target.value][0].toLowerCase()}.`, '', 2400); }
    });
  };

  /* ── start and stop ── */
  function start(fromEl) {
    if (!ok) { cx.toast('Reading aloud is not available in this browser.', 'warn', 3600); return false; }
    const all = paras(); if (!all.length) return false; let i0 = fromEl ? all.indexOf(fromEl) : -1; if (i0 < 0) i0 = 0;
    Speech.cancel(); q = all.slice(i0); qi = 0; on = true; paused = false; sleepAt = lsSleepAt(prefs().sleep, Date.now());
    try { document.body.dataset.listening = '1'; } catch (e) { /* no page */ } build(); cx.layoutChanged(); beginPara(); return true;
  }
  function stop(msg) {
    on = false; paused = false; begun++; Speech.cancel();
    clearMarks(); if (ui) ui.hidden = true; try { delete document.body.dataset.listening; } catch (e) { /* no page */ } cx.layoutChanged(); if (msg) cx.toast(msg, '', 3600);
  }
  const destroy = () => { if (on) stop(); if (vc) { vc.destroy(); vc = null; } if (ui) { ui.remove(); ui = null; } };
  return { ok, start, stop, destroy, toggle: (el) => { if (on) stop(); else start(el); }, on: () => on, paused: () => paused };
}
