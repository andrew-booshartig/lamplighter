/* ═══════════════════════════ 61 · Presets library ═══════════════════════════ */
function expandRefs(html) { return html.replace(/\{\{r:([a-zA-Z0-9]+)\}\}/g, (_, id) => refLink(id) || ''); }

function presetSummary(p) {
  const c = AudioCore.cfgOf(p.cfg); const modeName = { binaural: 'Binaural', monaural: 'Monaural', isochronic: 'Isochronic', control: 'Single tone', noise: 'Noise' }[c.mode];
  let beat = '—';
  if (c.mode === 'binaural' || c.mode === 'monaural' || c.mode === 'isochronic') beat = c.useTimeline && c.timeline.length ? `${fmt.num(c.timeline[0].from, 1)} → ${fmt.num(c.timeline[c.timeline.length - 1].to, 1)} Hz` : `${fmt.num(c.beat, 2)} Hz`;
  const dur = c.useTimeline ? c.timeline.reduce((a, s) => a + s.dur, 0) : c.duration; const swHz = c.useTimeline && c.timeline.length ? c.timeline[0].from : c.beat;
  return { modeName, beat, dur: dur ? Math.round(dur) + ' min' : '∞', swatchText: c.mode === 'control' ? c.carrier : c.mode === 'noise' ? '≈' : c.useTimeline ? '↘' : fmt.num(c.beat, c.beat < 10 ? 1 : 0), color: c.mode === 'control' || c.mode === 'noise' ? '#6b7689' : bandOf(swHz).color };
}

function openPresetDrawer(p) {
  const s = presetSummary(p); const c = AudioCore.cfgOf(p.mine ? p.cfg : shiftNoise(p.cfg));
  const back = h(`<div class="drawer-back" role="dialog" aria-modal="true" aria-label="${esc(p.name)}"><div class="drawer">
    <div class="spread"><span class="eyebrow">${esc((GOALS.find((g) => g.id === p.goal) || {}).label || 'Preset')}</span><button class="btn icon ghost sm" id="dClose" aria-label="Close">${icon('x')}</button></div>
    <h2 style="margin:8px 0 10px">${esc(p.name)}</h2>
    <div class="row" style="margin-bottom:14px">${UI.evidence(p.evidence)}${p.flag ? `<span class="badge ${p.flag === 'Folklore' ? 'bad' : 'warn'}">${esc(p.flag)}</span>` : ''}<span class="badge">${s.modeName}</span><span class="badge mono">${s.beat}</span><span class="badge">${s.dur}</span></div>
    <p class="t2">${esc(p.blurb)}</p>
    <div class="row" style="margin:16px 0"><button class="btn primary lg" id="dPlay">${icon('play')}Play now</button><button class="btn" id="dOpen">Open in Studio</button></div>
    <div class="grid c2" style="gap:8px;margin-bottom:18px">${[['Carrier', c.mode === 'noise' ? '—' : c.carrier + ' Hz'], ['Higher ear', c.mode === 'binaural' ? (c.higher === 'R' ? 'Right' : 'Left') : '—'], ['Noise', c.noiseType === 'none' ? 'none' : c.noiseType + ' ' + c.noiseDb + ' dB'], ['Fades', c.fadeIn + 's in · ' + c.fadeOut + 's out']].map(([k, v]) => `<div class="card tight flat"><div class="eyebrow">${k}</div><div class="mono">${v}</div></div>`).join('')}</div>
    <h4>What the research says</h4><div class="t2">${expandRefs(p.science || '')}</div>
    ${p.caveats ? `<div class="callout warn" style="margin-top:12px">${icon('warn')}<div><b>Caveats.</b> ${esc(p.caveats)}</div></div>` : ''}
    ${p.refs && p.refs.length ? `<h4 style="margin-top:18px">References</h4><ol class="refs">${p.refs.map((id) => `<li>${esc(REFS[id].full)}${REFS[id].url ? ` <a href="${REFS[id].url}" target="_blank" rel="noopener noreferrer">open ↗</a>` : ''}</li>`).join('')}</ol>` : ''}
    ${p.mine ? `<hr><button class="btn danger sm" id="dDel">${icon('trash')}Delete this preset</button>` : ''}
  </div></div>`);
  const close = () => { back.remove(); document.removeEventListener('keydown', onKey); };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', onKey);
  back.addEventListener('click', (e) => { if (e.target === back) close(); });
  $('#dClose', back).addEventListener('click', close);
  $('#dPlay', back).addEventListener('click', async () => { Studio.load(p.cfg, p.name, p.id); await Studio.playNow(); close(); toast(`Playing “${esc(p.name)}” — fades in gently`, 'good'); });
  $('#dOpen', back).addEventListener('click', () => { Studio.load(p.cfg, p.name, p.id); close(); Router.go('studio'); });
  const del = $('#dDel', back); if (del) del.addEventListener('click', async () => { if (await confirmBox('Delete preset?', `<p>“${esc(p.name)}” will be removed.</p>`, 'Delete', 'danger')) { store.set('presets', store.get('presets', []).filter((x) => x.id !== p.id)); close(); Router.render(); toast('Preset deleted'); } });
  document.body.appendChild(back); $('#dClose', back).focus();
}

Pages.presets = {
  mount(root) {
    let filter = store.get('presetFilter', 'all'); let q = '';
    root.innerHTML = `<div class="page-head fade-in"><div><h1>Presets</h1><p>Every preset says honestly <b>how strong the evidence is</b> — from <i>Unproven</i> to <i>Modest support</i> — and gives the research behind it. Nothing here is rated “strong”, because nothing about binaural beats is.</p></div>
      <div class="row"><input class="input" id="pq" placeholder="Search presets…" style="width:200px" aria-label="Search presets"><button class="btn sm ghost" id="pExp">${icon('download')}Export mine</button><label class="btn sm ghost" style="cursor:pointer">${icon('upload')}Import<input type="file" id="pImp" accept="application/json" hidden></label></div></div>
      <div class="filters fade-in" id="pf" role="tablist" aria-label="Filter by goal"></div>
      <div class="callout" style="margin:16px 0">${icon('info')}<div>Evidence ratings: ${[0, 1, 2, 3].map((l) => UI.evidence(l)).join(' &nbsp;·&nbsp; ')}. <span class="muted">Based on controlled studies where they exist; folklore presets are included only so you can test the claims blind.</span></div></div>
      <div class="grid auto-lg" id="pg"></div>`;
    const list = () => allPresets().filter((p) => (filter === 'all' || p.goal === filter) && (!q || (p.name + ' ' + p.blurb + ' ' + (p.tags || []).join(' ')).toLowerCase().includes(q)));
    const paintFilters = () => { $('#pf', root).innerHTML = GOALS.filter((g) => g.id !== 'mine' || store.get('presets', []).length).map((g) => `<button class="chip" role="tab" aria-pressed="${g.id === filter}" data-g="${g.id}">${g.label}</button>`).join(''); };
    const paint = () => {
      const ps = list(); $('#pg', root).innerHTML = ps.length ? ps.map((p) => { const s = presetSummary(p);
        return `<article class="card pcard fade-in" data-id="${p.id}" tabindex="0" role="button" aria-label="${esc(p.name)} details">
          <div class="top"><div class="row top" style="flex-wrap:nowrap"><div class="swatch" style="background:linear-gradient(135deg,${s.color},${Viz.mix(s.color, '#000000', 0.35)})">${s.swatchText}</div><div><h3>${esc(p.name)}</h3><div class="meta" style="margin-top:4px"><span class="tag">${s.modeName}</span><span class="tag mono">${s.beat}</span><span class="tag">${s.dur}</span></div></div></div></div>
          <div class="blurb">${esc(p.blurb)}</div>
          <div class="foot">${UI.evidence(p.evidence)}${p.flag ? `<span class="badge ${p.flag === 'Folklore' ? 'bad' : 'warn'}">${esc(p.flag)}</span>` : ''}<button class="btn sm primary" data-play="${p.id}" aria-label="Play ${esc(p.name)}">${icon('play')}Play</button></div></article>`; }).join('')
        : `<div class="card center muted" style="grid-column:1/-1">No presets match.</div>`;
    };
    paintFilters(); paint();
    root.addEventListener('click', async (e) => {
      const chip = e.target.closest('[data-g]'); if (chip) { filter = chip.dataset.g; store.set('presetFilter', filter); paintFilters(); paint(); return; }
      const pl = e.target.closest('[data-play]'); if (pl) { e.stopPropagation(); const p = allPresets().concat(PRESETS).find((x) => x.id === pl.dataset.play); Studio.load(p.cfg, p.name, p.id); await Studio.playNow(); toast(`Playing “${esc(p.name)}” — fades in gently`, 'good'); return; }
      const card = e.target.closest('.pcard'); if (card) { const p = allPresets().find((x) => x.id === card.dataset.id); if (p) openPresetDrawer(p); }
    });
    root.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.classList.contains('pcard')) e.target.click(); });
    $('#pq', root).addEventListener('input', (e) => { q = e.target.value.trim().toLowerCase(); paint(); });
    $('#pExp', root).addEventListener('click', () => { const mine = store.get('presets', []); if (!mine.length) return toast('You have no saved presets yet', 'warn'); download('lamplighter-presets.json', JSON.stringify({ app: 'beatlab', kind: 'presets', presets: mine }, null, 2)); });
    $('#pImp', root).addEventListener('change', async (e) => {
      const f = e.target.files[0]; if (!f) return; try { const d = JSON.parse(await f.text()); if (d.kind !== 'presets' || !Array.isArray(d.presets)) throw new Error('Not a Lamplighter presets file'); const cur = store.get('presets', []); d.presets.forEach((p) => { if (p && p.name && p.cfg) cur.push({ id: 'u-' + uid(), name: String(p.name).slice(0, 60), blurb: String(p.blurb || 'Imported').slice(0, 120), cfg: AudioCore.cfgOf(p.cfg), goal: 'mine' }); }); store.set('presets', cur); toast(`Imported ${d.presets.length} preset(s)`, 'good'); Router.render(); } catch (err) { toast('Import failed: ' + esc(err.message), 'bad'); }
    });
  },
};
