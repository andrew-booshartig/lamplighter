/* ═══════════════════════════ 6kq · Ask an AI about this: the panel ═══════════════════════════
   Opened from the reader's selection bar ("Ask an AI") and from the Word help card. It shows the passage and its citation, four preset questions and a box for the reader's own, and one button that copies a
   ready-made prompt (2z-ask-core.js) and opens the chosen AI's own site in a new tab to paste it into. The button is a plain link (target _blank, rel noopener noreferrer) that only a click follows; the
   copying happens on the same click. The app sends nothing and holds no key. The reader can see the exact text before it is copied, and choose another AI (kept in this browser as ask.ai).
   askOpen({ text, cite, focus, label }): text is what was selected (or the sentence a word is in); cite is the citation lines, if known; focus is the word the card was opened on; label says what the text is. */
function askOpen(o) {
  const x = o || {}; const passage = String(x.text == null ? '' : x.text).replace(/\s+/g, ' ').trim(); if (!passage) return Promise.resolve(null);
  const cite = askTidy(x.cite, ASK_LIMITS.cite); const focus = askTidy(x.focus, 120); const label = x.label || 'The words you selected';
  let preset = ASK_QUESTIONS[0][0]; let aiId = askAiOf(store.get('ask.ai', 'gemini'))[0];
  const shown = passage.length > 420 ? passage.slice(0, 417) + '…' : passage;
  const pre = ASK_QUESTIONS.map(([id, q]) => `<button type="button" class="rdvw" role="radio" aria-checked="${id === preset}" data-askq="${esc(id)}"><span class="rdvt"><b>${esc(q)}</b></span></button>`).join('');
  const opts = ASK_AIS.map(([id, nm]) => `<option value="${esc(id)}"${id === aiId ? ' selected' : ''}>${esc(nm)}</option>`).join('');
  const html = `<div class="ask">
    <p class="small t2" style="margin:0 0 6px">${esc(label)}</p>
    <blockquote class="ask-quote" dir="auto">${esc(shown)}</blockquote>${cite ? `<p class="small t2 ask-cite">${esc(cite.split('\n')[0])}</p>` : ''}
    <div class="rtgroup">Your question</div>
    <div class="rdvws" role="radiogroup" aria-label="Question" id="askPre">${pre}</div>
    <label class="small t2" for="askOwn" style="display:block;margin:8px 0 4px">Or ask your own</label>
    <textarea class="input" id="askOwn" rows="2" maxlength="${ASK_LIMITS.question}" placeholder="Write a question about this passage…" style="width:100%"></textarea>
    <div class="row ask-row"><label class="small t2" for="askAi">Open in</label><select class="select" id="askAi" style="width:auto">${opts}</select></div>
    <div class="row ask-go"><a class="btn primary" id="askGo" href="${esc(askAiUrl(aiId))}" target="_blank" rel="noopener noreferrer">${esc(askGoLabel(aiId))} ↗</a><button class="btn" type="button" id="askCopy">Copy only</button></div>
    <details class="ask-prev"><summary class="small">Show exactly what will be copied</summary><textarea class="input" id="askText" readonly rows="9" style="width:100%;margin-top:6px" aria-label="The text that will be copied"></textarea></details>
    <p class="hint" style="margin-top:8px">${esc(ASK_SENDS_NOTHING)}</p></div>`;
  const done = modal({ title: 'Ask an AI about this', html, actions: [{ label: 'Close', kind: 'ghost', value: true }] });
  const back = document.querySelector('.modal-back'); if (!back) return done;
  const own = back.querySelector('#askOwn'); const go = back.querySelector('#askGo'); const text = back.querySelector('#askText'); const sel = back.querySelector('#askAi');
  const current = () => askPrompt({ passage, cite, focus, preset, question: own.value });
  const paint = () => {
    back.querySelectorAll('[data-askq]').forEach((b) => b.setAttribute('aria-checked', String(!own.value.trim() && b.dataset.askq === preset)));
    go.setAttribute('href', askAiUrl(aiId)); go.textContent = askGoLabel(aiId) + ' ↗'; text.value = current();
  };
  const copy = () => rdCopy(text.value).then((ok) => { toast(ok ? `Copied. Paste it into ${askAiOf(aiId)[1]}.` : 'Copying is not available here. Open “Show exactly what will be copied”, select the text and copy it.', ok ? 'good' : 'warn', 4200); return ok; });
  back.addEventListener('click', (e) => {
    const q = e.target.closest ? e.target.closest('[data-askq]') : null; if (q) { preset = q.dataset.askq; own.value = ''; paint(); return; }
    if (e.target.closest && e.target.closest('#askCopy')) { copy(); return; }
    if (e.target.closest && e.target.closest('#askGo')) { copy().then((ok) => { if (ok && back.close) setTimeout(() => { if (back.isConnected) back.close(true); }, 500); }); }      // the link opens the AI's site by itself; the panel is put away once the text is copied
  });
  own.addEventListener('input', paint);
  sel.addEventListener('change', () => { aiId = askAiOf(sel.value)[0]; store.set('ask.ai', aiId); paint(); });
  paint(); return done;
}
