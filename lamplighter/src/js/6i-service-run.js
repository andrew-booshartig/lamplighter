/* ═══════════════════════════ 6i · Running a gathering ═══════════════════════════
   A full-screen order of service. Alone, you can pause and skip. With a shared start time (the pack carries one) every device follows the clock, so
   people in different places, with no connection between them, are at the same step at the same moment, and latecomers drop in where everyone is. */
function stepBodyHTML(s) {
  const lines = (t) => esc(t || '').replace(/\n/g, '<br>');
  switch (s.t) {
    case 'reading': return `${s.title ? `<div class="svc-sub">${esc(s.title)}</div>` : ''}<div class="reader svc-read">${s.text ? readerHTML(s.text) : ''}</div>${s.source ? `<div class="svc-src">${esc(s.source)}</div>` : ''}`;
    case 'reflect': return `${s.text ? `<p>${lines(s.text)}</p>` : ''}${(s.questions || []).length ? `<ol class="svc-q">${s.questions.map((q) => `<li>${esc(q)}</li>`).join('')}</ol>` : ''}`;
    case 'silence': return `<p class="svc-quiet">${s.text ? lines(s.text) : 'Be quiet together.'}</p>`;
    case 'breath': return `<div class="svc-breath" aria-hidden="true"></div><p class="svc-quiet">${s.text ? lines(s.text) : 'Breathe in slowly through the nose. Let the out-breath be longer than the in-breath.'}</p>`;
    default: return `${s.title ? `<div class="svc-sub">${esc(s.title)}</div>` : ''}<p class="svc-words">${lines(s.text)}</p>`;
  }
}
async function svcBell(kind) {
  try { const ctx = await AudioCore.unlock(); const t = ctx.currentTime + 0.05; if (kind === 'start') Bell.start(ctx, t, 0.5); else if (kind === 'step') Bell.interval(ctx, t, 0.5); else Bell.finish(ctx, t, 0.5); } catch (e) { /* silent fallback */ }
}
function runService(svc, { onClose } = {}) {
  const sync = !!svc.startAt; const tl = serviceTimeline(svc); const total = serviceSeconds(svc);
  const el = h(`<div class="svc-run" role="dialog" aria-modal="true" aria-label="${esc(svc.title)}"><div class="svc-top"><b>${esc(svc.title)}</b><span class="svc-note small"></span><button class="btn sm ghost" data-svc="close" type="button">${icon('x')}Leave</button></div>
    <div class="svc-stage"><div class="svc-kind"></div><h2 class="svc-title"></h2><div class="svc-body"></div><div class="svc-clock" aria-live="off"></div></div>
    <div class="svc-foot"><div class="svc-bar"><i></i></div><div class="svc-dots">${tl.map((x) => `<span title="${esc(STEP_TYPES[x.step.t].label)}"></span>`).join('')}</div>
      <div class="row svc-ctl"><label class="chk"><input type="checkbox" id="svcBell" checked><span class="small">Bells</span></label>${sync ? '<span class="small muted">Following the shared clock</span>' : `<button class="btn sm" data-svc="prev" type="button">← Back</button><button class="btn sm primary" data-svc="pause" type="button">Pause</button><button class="btn sm" data-svc="next" type="button">Next →</button>`}<button class="btn sm ghost" data-svc="read" type="button" hidden>Read this aloud</button></div></div></div>`);
  document.body.appendChild(el); document.body.classList.add('svc-open');
  const $q = (s) => el.querySelector(s); let elapsed = sync ? (Date.now() - svc.startAt) / 1000 : 0; let paused = false; let lastTick = Date.now(); let lastKey = ''; let timer = null; let wake = null;
  try { if (navigator.wakeLock) navigator.wakeLock.request('screen').then((w) => { wake = w; }).catch(() => {}); } catch (e) { /* optional */ }
  const bellOn = () => $q('#svcBell').checked;
  const jump = (i) => { elapsed = tl[gClamp(i, 0, tl.length - 1)].start + 0.01; lastKey = ''; render(); };
  function render() {
    const w = whereAt(svc, elapsed); const key = w.phase + (w.i == null ? '' : w.i);
    if (key !== lastKey) {
      const first = lastKey === ''; lastKey = key;
      if (w.phase === 'before') { $q('.svc-kind').textContent = 'Starting soon'; $q('.svc-title').textContent = svc.title; $q('.svc-body').innerHTML = `<p class="svc-words">${esc(svc.note || 'Find a quiet place and sit comfortably.')}</p><p class="small muted">${tl.length} parts, about ${Math.round(total / 60)} minutes. Starts ${new Date(svc.startAt).toLocaleString(undefined, { weekday: 'long', hour: 'numeric', minute: '2-digit' })}.</p>`; }
      else if (w.phase === 'done') { $q('.svc-kind').textContent = 'Finished'; $q('.svc-title').textContent = 'Thank you'; $q('.svc-body').innerHTML = '<p class="svc-words">The gathering is over. Sit a moment before you go.</p>'; if (bellOn() && !first) svcBell('end'); }
      else { const s = w.step; $q('.svc-kind').textContent = `${STEP_TYPES[s.t].label} · ${w.i + 1} of ${w.count}`; $q('.svc-title').textContent = s.t === 'reading' || !s.title ? '' : s.title; $q('.svc-body').innerHTML = stepBodyHTML(s); if (bellOn() && !first) svcBell(s.t === 'silence' || s.t === 'breath' ? 'start' : 'step'); else if (bellOn() && first && w.into < 3) svcBell('start'); Speech.cancel(); }
      const rb = $q('[data-svc=read]'); rb.hidden = !(w.phase === 'live' && w.step.t === 'reading' && w.step.text && Speech.ok);
      $$('.svc-dots span', el).forEach((d, i) => { d.className = w.phase === 'done' || (w.phase === 'live' && i < w.i) ? 'done' : w.phase === 'live' && i === w.i ? 'on' : ''; });
    }
    $q('.svc-clock').textContent = w.phase === 'before' ? 'Starts in ' + fmtClock(w.untilStart) : w.phase === 'live' ? fmtClock(w.left) : '';
    $q('.svc-bar i').style.width = (w.phase === 'before' ? 0 : w.phase === 'done' ? 100 : (w.elapsed / total) * 100) + '%';
    if (!sync) { $q('[data-svc=pause]').textContent = paused ? 'Resume' : 'Pause'; $q('.svc-note').textContent = paused ? 'Paused' : ''; }
    if (w.phase === 'done' && timer) { clearInterval(timer); timer = null; }
  }
  const tick = () => { const now = Date.now(); if (sync) elapsed = (now - svc.startAt) / 1000; else if (!paused) elapsed += (now - lastTick) / 1000; lastTick = now; render(); };
  const close = () => { if (timer) clearInterval(timer); Speech.cancel(); try { if (wake) wake.release(); } catch (e) { /* noop */ } document.removeEventListener('keydown', onKey); el.remove(); document.body.classList.remove('svc-open'); if (onClose) onClose(); };
  const onKey = (e) => { if (e.key === 'Escape') close(); else if (!sync && e.key === 'ArrowRight') $q('[data-svc=next]').click(); else if (!sync && e.key === 'ArrowLeft') $q('[data-svc=prev]').click(); else if (!sync && e.key === ' ' && !e.target.closest('button,input')) { e.preventDefault(); $q('[data-svc=pause]').click(); } };
  el.addEventListener('click', (e) => {
    const b = e.target.closest('[data-svc]'); if (!b) return; const a = b.dataset.svc; const w = whereAt(svc, elapsed);
    if (a === 'close') close(); else if (a === 'pause') { paused = !paused; lastTick = Date.now(); render(); }
    else if (a === 'next') jump(w.phase === 'live' ? w.i + 1 : 0); else if (a === 'prev') jump(w.phase === 'live' ? (w.into > 5 ? w.i : w.i - 1) : tl.length - 1);
    else if (a === 'read' && w.phase === 'live') Speech.speak(psgClean(w.step.text));
  });
  document.addEventListener('keydown', onKey); render(); timer = setInterval(tick, 250);
  return { close, el };
}
