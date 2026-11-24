/* ═══════════════════════════ 66 · Learn ═══════════════════════════ */
function renderLearnBody(html) {
  return expandRefs(html)
    .replace(/\{\{demo:(\w+)\}\}/g, (_, k) => `<button class="btn sm" data-demo="${k}" type="button">${icon('play')}<span>${esc(DEMOS[k].label)}</span></button>`)
    .replace(/\{\{calc:cents\}\}/g, () => `<div class="demo" data-calc><span class="small t2">Carrier</span><input class="input num" data-c="carrier" value="400" inputmode="decimal" aria-label="Carrier Hz"><span class="small t2">Hz · beat</span><input class="input num" data-c="beat" value="10" inputmode="decimal" aria-label="Beat Hz"><span class="small t2">Hz →</span><span class="mono" data-c="out"></span></div>`)
    .replace(/\{\{bands\}\}/g, () => `<table><tr><th>Band</th><th>Beat</th><th>Associated with…</th></tr>${BANDS.map((b) => `<tr><td><b style="color:${b.color}">${b.name}</b></td><td class="mono">${b.lo}–${b.hi} Hz</td><td>${b.feel}</td></tr>`).join('')}</table>`);
}

/* The twelve articles, sorted into four groups so the page reads as a course rather than a pile. */
const LEARN_GROUPS = [
  ['Start here', 'What binaural beats are, and the three kinds of rhythm you can make from tones.', ['how', 'types']],
  ['Setting it up', 'Spacing, carrier tone, loudness, and which ear gets which.', ['spacing', 'carrier', 'level', 'ears']],
  ['What is actually true', 'The evidence, the hype, and the 1983 Army “Gateway” paper.', ['evidence', 'scams', 'gateway']],
  ['Using it well', 'Safety, meditation habits, and the unglamorous levers that do work.', ['safety', 'meditation', 'drive']],
];

Pages.learn = {
  mount(root, parts) {
    const open = new Set(parts[0] ? [parts[0]] : []);
    const byId = Object.fromEntries(LEARN.map((a) => [a.id, a]));
    const quick = [
      ['spacing', 'How far apart?', 'The gap in Hz is the beat. Pick it by band (delta 0.5–4 · theta 4–8 · alpha 8–13 · beta 13–30) and keep it under ~30 Hz for binaural.'],
      ['carrier', 'Which carrier tone?', 'Under ~1,000 Hz; 200–500 Hz is the sweet spot. Pure sines, kept quiet. No carrier in that range is proven better.'],
      ['ears', 'Left or right higher?', 'It flips the direction of the illusion, not the rate. No study shows an advantage; test it blind on yourself.'],
      ['evidence', 'What is the science?', 'Small, inconsistent effects. The brainstem follows the beat; whether the cortex does is contested (5 of 14 studies supportive).'],
    ];
    const acc = (a) => `<section class="acc${open.has(a.id) ? ' open' : ''}" id="a-${a.id}" data-id="${a.id}"><button type="button" aria-expanded="${open.has(a.id)}"><span class="t"><b>${a.title}</b><span>${a.sub}</span></span>${icon('chevron')}</button><div class="body">${renderLearnBody(a.html)}</div></section>`;
    const refKeys = Object.keys(REFS).filter((k) => k !== 'kroenke3');
    root.innerHTML = `<div class="page-head fade-in"><div><h1>Learn</h1><p>Plain-English answers, with sources. Every claim is either cited or flagged as an unknown.</p></div><input class="input" id="lnQ" type="search" placeholder="Search the articles…" aria-label="Search the articles" style="max-width:260px"></div>
      <section class="card flat quickbox fade-in"><div class="eyebrow">The short version</div><div class="quick">${quick.map(([id, t, s]) => `<button type="button" data-open="${id}"><b>${t}</b><span>${s}</span></button>`).join('')}</div></section>
      <nav class="ptabs lnav" aria-label="Jump to a topic">${LEARN_GROUPS.map(([t], i) => `<a href="#/learn" data-jump="lg-${i}">${t}</a>`).join('')}<a href="#/learn" data-jump="lg-refs">References</a></nav>
      <div id="lnBody">${LEARN_GROUPS.map(([title, sub, ids], i) => `<section class="lgroup" id="lg-${i}"><div class="lg-head"><h2>${title}</h2><p>${sub}</p></div>${ids.map((id) => acc(byId[id])).join('')}</section>`).join('')}
        <section class="lgroup" id="lg-refs"><div class="lg-head"><h2>References</h2><p>${refKeys.length} sources behind the articles.</p></div>
          <section class="acc" id="a-refs" data-id="refs"><button type="button" aria-expanded="false"><span class="t"><b>All references</b><span>${refKeys.length} sources</span></span>${icon('chevron')}</button>
            <div class="body"><ol class="refs">${refKeys.map((k) => `<li>${esc(REFS[k].full)}${REFS[k].url ? ` <a href="${REFS[k].url}" target="_blank" rel="noopener noreferrer">open ↗</a>` : ''}</li>`).join('')}</ol>
            <p class="hint">Sources marked “read via secondary citations” were taken from reviews that cite them, not from the original papers.</p></div></section></section></div>
      <div class="card flat" id="lnNone" hidden><p class="t2">No article matches that search. Try a shorter word such as “carrier”, “safe” or “Gateway”.</p></div>`;

    const toggle = (sec, force) => { const on = force != null ? force : !sec.classList.contains('open'); sec.classList.toggle('open', on); $('button', sec).setAttribute('aria-expanded', on); };
    let demoOff = null; let demoBtn = null;
    const stopDemo = () => { if (demoBtn) { demoBtn.querySelector('span').textContent = DEMOS[demoBtn.dataset.demo].label; demoBtn.firstElementChild.outerHTML = icon('play'); demoBtn = null; } if (demoOff) { demoOff(); demoOff = null; } };
    root.addEventListener('click', async (e) => {
      const j = e.target.closest('[data-jump]'); if (j) { e.preventDefault(); const t = $('#' + j.dataset.jump, root); if (t && t.scrollIntoView) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
      const q = e.target.closest('[data-open]'); if (q) { const sec = $('#a-' + q.dataset.open, root); toggle(sec, true); sec.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
      const hd = e.target.closest('.acc > button'); if (hd) { toggle(hd.parentElement); return; }
      const d = e.target.closest('[data-demo]');
      if (d) {
        if (demoBtn === d) { Engine.stop(0.3); stopDemo(); return; }
        stopDemo(); const def = DEMOS[d.dataset.demo]; demoBtn = d; d.querySelector('span').textContent = 'Playing… (click to stop)'; d.firstElementChild.outerHTML = icon('stop');
        const vol = Math.min(Studio.state.cfg.volume, 0.6);
        demoOff = Engine.on('state', (s) => { if (s === 'idle') stopDemo(); });
        try { await Engine.play(Object.assign({}, def.cfg, { duration: def.secs / 60, fadeIn: 0.5, fadeOut: 0.8, volume: vol, useTimeline: false, noiseType: 'none' }), { name: 'Demo', demo: true }); } catch (err) { toast('Audio could not start: ' + esc(err.message), 'bad'); stopDemo(); }
      }
    });
    root.addEventListener('input', (e) => {
      if (e.target.id === 'lnQ') {
        const q = e.target.value.trim().toLowerCase(); let any = false;
        $$('.lgroup', root).forEach((g) => {
          let shown = 0;
          $$('.acc', g).forEach((a) => { const hit = !q || a.textContent.toLowerCase().includes(q); a.hidden = !hit; if (hit) shown++; if (q && hit) toggle(a, true); });
          g.hidden = !shown; if (shown) any = true;
        });
        $('#lnNone', root).hidden = any; return;
      }
      const w = e.target.closest('[data-calc]'); if (!w) return; const c = parseFloat($('[data-c=carrier]', w).value), b = parseFloat($('[data-c=beat]', w).value); const out = $('[data-c=out]', w);
      if (!(c > 0) || !(b > 0) || b >= 2 * c) { out.textContent = '—'; return; } const lo = c - b / 2, hi = c + b / 2; const cents = 1200 * Math.log2(hi / lo);
      out.innerHTML = `L ${lo.toFixed(2)} · R ${hi.toFixed(2)} Hz = <b>${cents.toFixed(1)} cents</b> (${(cents / 100).toFixed(2)} semitones)`;
    });
    $$('[data-calc]', root).forEach((w) => w.dispatchEvent(new Event('input', { bubbles: true })));
    if (parts[0]) setTimeout(() => { const s = $('#a-' + parts[0], root); if (s) s.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 80);
    return () => { Engine.state !== 'idle' && Engine.meta && Engine.meta.demo && Engine.stop(0.2); stopDemo(); };
  },
};
