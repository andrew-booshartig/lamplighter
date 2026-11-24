/* ═══════════════════════════ 40 · visualisations & charts ═══════════════════════════
   Safety rule: nothing on screen flickers or pulses at the beat rate. Motion is slowed so its rate never
   exceeds ~1.5 cycles per second, and it freezes entirely when reduced-motion is on. */
const Viz = (() => {
  let C = {};
  function refreshColors() {
    const cs = getComputedStyle(document.documentElement); const g = (n) => cs.getPropertyValue(n).trim();
    C = { left: g('--left') || '#4cc3ff', right: g('--right') || '#ffb454', both: g('--both') || '#b794ff', text: g('--text'), muted: g('--muted'), line: g('--line2'), accent: g('--accent'), accent2: g('--accent2'), bg: g('--bg') };
  }
  refreshColors();
  const hex = (c) => { const m = /^#?([0-9a-f]{6})$/i.exec(c.trim()); if (!m) return [128, 160, 255]; const n = parseInt(m[1], 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const mix = (a, b, t) => { const A = hex(a), B = hex(b); return `rgb(${Math.round(lerp(A[0], B[0], t))},${Math.round(lerp(A[1], B[1], t))},${Math.round(lerp(A[2], B[2], t))})`; };
  const rgba = (c, a) => { const A = hex(c); return `rgba(${A[0]},${A[1]},${A[2]},${a})`; };

  function fit(c) {
    const dpr = Math.min(2, window.devicePixelRatio || 1); const w = c.clientWidth, h = c.clientHeight; if (!w || !h) return null;
    const W = Math.round(w * dpr), H = Math.round(h * dpr); if (c.width !== W || c.height !== H) { c.width = W; c.height = H; }
    const ctx = c.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); return { ctx, w, h };
  }

  /* what tones are present, for drawing */
  function components(cfg, beat) {
    switch (cfg.mode) {
      case 'binaural': { const f = AudioCore.earFreqs(cfg, beat); return [{ f: f.L, ear: 'L' }, { f: f.R, ear: 'R' }]; }
      case 'monaural': { const f = AudioCore.earFreqs(cfg, beat); return [{ f: f.lo, ear: 'LR' }, { f: f.hi, ear: 'LR' }]; }
      case 'isochronic': case 'control': return [{ f: cfg.carrier, ear: 'LR' }];
      default: return [];
    }
  }
  const slowFactor = (beat) => Math.min(1 / 20, 1.5 / Math.max(0.05, beat));

  class StudioView {
    constructor({ head, tune }) {
      this.head = head; this.tune = tune; this.m = { cfg: AudioCore.cfgOf({}), beat: 6, playing: false, level: 0 };
      this.phase = 0; this.trail = []; this.raf = 0; this.last = 0; this.sp = { a: null, b: null }; this.axis = { span: 40, center: 400 };
      this.lv = { L: -120, R: -120 }; this._loop = this._loop.bind(this);
    }
    set(m) {
      this.m = Object.assign(this.m, m);
      if (m.cfg && !this._inited) { this._inited = true; this.axis.center = m.cfg.carrier; } // start the frequency axis where the tone is, don't glide in from 400 Hz
      if (!this.raf) this.draw();
    }
    levels(L, R) { this.lv = { L, R }; }
    start() { if (!this.raf) { this.last = performance.now(); this.raf = requestAnimationFrame(this._loop); } }
    stop() { cancelAnimationFrame(this.raf); this.raf = 0; }
    _loop(ts) {
      const dt = Math.min(0.1, (ts - this.last) / 1000); this.last = ts;
      const still = prefersReducedMotion();
      if (this.m.playing && !still) this.phase = (this.phase + this.m.beat * slowFactor(this.m.beat) * dt) % 1000;
      this.draw(dt);
      this.raf = requestAnimationFrame(this._loop);
    }
    draw(dt = 0.016) { this.drawHead(dt); this.drawTune(dt); }

    drawHead() {
      const f = fit(this.head); if (!f) return; const { ctx, w, h } = f; const m = this.m; const cfg = m.cfg;
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2, cy = h / 2 + 8; const R = Math.min(w * 0.33, h * 0.34);
      const aura = ctx.createRadialGradient(cx, cy, R * 0.2, cx, cy, R * 2); aura.addColorStop(0, rgba(C.accent, m.playing ? 0.22 : 0.1)); aura.addColorStop(1, rgba(C.accent, 0));
      ctx.fillStyle = aura; ctx.fillRect(0, 0, w, h);
      ctx.lineWidth = 2; ctx.strokeStyle = C.line; ctx.fillStyle = 'rgba(127,140,170,0.08)';
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.2832); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx - 9, cy - R + 1); ctx.lineTo(cx, cy - R - 13); ctx.lineTo(cx + 9, cy - R + 1); ctx.stroke();
      const hasL = cfg.mode !== 'noise', hasR = cfg.mode !== 'noise';
      const ear = (x, lab, color, on) => {
        ctx.save(); if (on && m.playing) { ctx.shadowColor = color; ctx.shadowBlur = 18; }
        ctx.fillStyle = on ? rgba(color, m.playing ? 0.95 : 0.45) : 'rgba(127,140,170,0.25)'; ctx.beginPath(); ctx.ellipse(x, cy, 8, 19, 0, 0, 6.2832); ctx.fill(); ctx.restore();
        ctx.fillStyle = C.muted; ctx.font = '600 11px ui-sans-serif, system-ui'; ctx.textAlign = 'center'; ctx.fillText(lab, x, cy + 36);
      };
      const earColL = cfg.mode === 'monaural' || cfg.mode === 'isochronic' || cfg.mode === 'control' ? C.both : C.left;
      const earColR = cfg.mode === 'monaural' || cfg.mode === 'isochronic' || cfg.mode === 'control' ? C.both : C.right;
      ear(cx - R - 6, 'L', earColL, hasL); ear(cx + R + 6, 'R', earColR, hasR);
      // orbit
      const rr = R * 0.62; ctx.setLineDash([3, 6]); ctx.strokeStyle = 'rgba(127,140,170,0.35)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(cx, cy, rr, 0, 6.2832); ctx.stroke(); ctx.setLineDash([]);
      let x = cx, y = cy, col = C.accent, rad = 7;
      if (cfg.mode === 'binaural') {
        const dir = cfg.higher === 'L' ? -1 : 1; const th = -Math.PI / 2 + dir * this.phase * 6.2832;
        x = cx + rr * Math.cos(th); y = cy + rr * Math.sin(th); col = mix(C.left, C.right, (Math.cos(th) + 1) / 2);
        this.trail.push([x, y, col]); if (this.trail.length > 34) this.trail.shift();
        this.trail.forEach(([tx, ty, tc], i) => { ctx.globalAlpha = (i / this.trail.length) * 0.35; ctx.fillStyle = tc; ctx.beginPath(); ctx.arc(tx, ty, 3 + (i / this.trail.length) * 3, 0, 6.2832); ctx.fill(); });
        ctx.globalAlpha = 1;
      } else if (cfg.mode === 'monaural' || cfg.mode === 'isochronic') {
        const pulse = 0.5 + 0.5 * Math.sin(this.phase * 6.2832); rad = 7 + pulse * 9; col = C.both;
        ctx.globalAlpha = 0.25 + pulse * 0.25; ctx.fillStyle = col; ctx.beginPath(); ctx.arc(cx, cy, rr * (0.2 + pulse * 0.45), 0, 6.2832); ctx.fill(); ctx.globalAlpha = 1;
      } else if (cfg.mode === 'control') { col = C.both; rad = 8; }
      else if (cfg.mode === 'noise') { col = C.muted; rad = 0; }
      if (rad) { ctx.save(); ctx.shadowColor = col; ctx.shadowBlur = m.playing ? 22 : 6; ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, rad, 0, 6.2832); ctx.fill(); ctx.restore(); }
      ctx.fillStyle = C.muted; ctx.font = '500 11px ui-sans-serif, system-ui'; ctx.textAlign = 'center';
      const cap = cfg.mode === 'binaural' ? 'perceived sound image (schematic)' : cfg.mode === 'control' ? 'steady tone — no beat' : cfg.mode === 'noise' ? 'noise only' : 'physical pulsing (schematic)';
      ctx.fillText(cap, cx, h - 8);
      if (m.playing && cfg.mode !== 'control' && cfg.mode !== 'noise') {
        const s = slowFactor(m.beat); ctx.fillText(`shown ${Math.round(1 / s)}× slower than real time`, cx, 18);
      }
    }

    drawTune() {
      const f = fit(this.tune); if (!f) return; const { ctx, w, h } = f; const m = this.m; const cfg = m.cfg;
      ctx.clearRect(0, 0, w, h);
      const comps = components(cfg, m.beat); const padX = 26; const axY = h - 30;
      const two = comps.length === 2; const span = two ? clamp(m.beat * 3.4 + 14, 28, 170) : 44;
      const tgt = { span, center: cfg.carrier }; this.axis.span = lerp(this.axis.span, tgt.span, 0.18); this.axis.center = lerp(this.axis.center, tgt.center, 0.25);
      const lo = this.axis.center - this.axis.span / 2; const xOf = (fr) => padX + ((fr - lo) / this.axis.span) * (w - 2 * padX);
      // ticks
      const steps = [0.5, 1, 2, 5, 10, 20, 25, 50, 100]; let step = steps.find((s) => this.axis.span / s <= 9) || 100;
      ctx.strokeStyle = C.line; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(padX, axY); ctx.lineTo(w - padX, axY); ctx.stroke();
      ctx.fillStyle = C.muted; ctx.font = '500 10.5px ui-monospace, Menlo, monospace'; ctx.textAlign = 'center';
      for (let v = Math.ceil(lo / step) * step; v <= lo + this.axis.span + 1e-6; v += step) { const x = xOf(v); ctx.beginPath(); ctx.moveTo(x, axY); ctx.lineTo(x, axY + 5); ctx.stroke(); ctx.fillText(String(Math.round(v * 100) / 100), x, axY + 18); }
      ctx.textAlign = 'right'; ctx.fillText('Hz', w - 4, axY + 18);
      const lvl = (db) => clamp((db + 62) / 52, 0.12, 1);
      const spikes = comps.map((c) => ({ ...c, x: xOf(c.f), col: c.ear === 'L' ? C.left : c.ear === 'R' ? C.right : C.both, amp: m.playing ? lvl(c.ear === 'R' ? this.lv.R : this.lv.L) : 0.55 }));
      spikes.forEach((s) => {
        const top = axY - 12 - s.amp * (axY - 52); const g = ctx.createLinearGradient(0, top, 0, axY);
        g.addColorStop(0, s.col); g.addColorStop(1, rgba(s.col, 0.06));
        ctx.save(); ctx.shadowColor = s.col; ctx.shadowBlur = m.playing ? 16 : 6; ctx.fillStyle = g; ctx.fillRect(s.x - 2, top, 4, axY - top); ctx.restore();
        ctx.fillStyle = s.col; ctx.beginPath(); ctx.arc(s.x, top, 4.5, 0, 6.2832); ctx.fill();
      });
      ctx.font = '600 12px ui-monospace, Menlo, monospace';
      if (two) {
        const [a, b] = spikes[0].x <= spikes[1].x ? [spikes[0], spikes[1]] : [spikes[1], spikes[0]];
        ctx.textAlign = 'right'; ctx.fillStyle = a.col; ctx.fillText(`${a.ear === 'LR' ? '' : a.ear + ' '}${a.f.toFixed(2)}`, a.x - 10, axY - 20);
        ctx.textAlign = 'left'; ctx.fillStyle = b.col; ctx.fillText(`${b.ear === 'LR' ? '' : b.ear + ' '}${b.f.toFixed(2)}`, b.x + 10, axY - 20);
        const by = 26; ctx.strokeStyle = C.text; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(a.x, by + 6); ctx.lineTo(a.x, by); ctx.lineTo(b.x, by); ctx.lineTo(b.x, by + 6); ctx.stroke();
        ctx.fillStyle = C.text; ctx.textAlign = 'center'; ctx.font = '700 13px ui-monospace, Menlo, monospace'; ctx.fillText(`Δ ${Math.abs(b.f - a.f).toFixed(2)} Hz`, (a.x + b.x) / 2, by - 7);
      } else if (spikes[0]) {
        ctx.textAlign = 'center'; ctx.fillStyle = spikes[0].col; ctx.fillText(`${spikes[0].f.toFixed(2)} Hz`, spikes[0].x, axY - 20);
        if (cfg.mode === 'isochronic') { ctx.fillStyle = C.text; ctx.font = '700 13px ui-monospace, Menlo, monospace'; ctx.fillText(`pulsed ${m.beat.toFixed(2)}× per second`, w / 2, 26); }
        else { ctx.fillStyle = C.muted; ctx.font = '500 12px ui-sans-serif, system-ui'; ctx.fillText('one steady tone — no beat', w / 2, 26); }
      } else { ctx.fillStyle = C.muted; ctx.font = '500 12px ui-sans-serif, system-ui'; ctx.textAlign = 'center'; ctx.fillText('noise only — no tones', w / 2, 26); }
    }
  }

  /* log-scale band ruler (HTML) */
  function bandRuler(container) {
    const L = (f) => Math.log(f / 0.5) / Math.log(100);
    const widths = BANDS.map((b) => L(b.hi) - L(b.lo)); const tot = widths.reduce((a, b) => a + b, 0);
    container.classList.add('bandruler');
    container.innerHTML = `<div class="bar">${BANDS.map((b, i) => `<span data-b="${b.id}" style="flex:${widths[i] / tot};background:${b.color};color:${b.color}"></span>`).join('')}</div>
      <div class="marker"><b>6 Hz</b></div>
      <div class="labels">${BANDS.map((b, i) => `<span style="flex:${widths[i] / tot}">${b.name}</span>`).join('')}</div>`;
    const marker = $('.marker', container), lab = $('b', marker);
    return { update(beat) { const f = clamp(beat, 0.5, 50); marker.style.left = (L(f) * 100) + '%'; lab.textContent = fmt.hz(beat, beat < 10 ? 2 : 1) + ' Hz'; $$('.bar span', container).forEach((s) => s.classList.toggle('on', s.dataset.b === bandOf(beat).id)); } };
  }

  /* ── SVG chart helpers ── */
  const nice = (v, d = 1) => (Math.abs(v) >= 100 ? Math.round(v) : Math.round(v * 10 ** d) / 10 ** d);
  function frame({ w, h, pad, xMin, xMax, yMin, yMax }) {
    const X = (x) => pad.l + ((x - xMin) / (xMax - xMin || 1)) * (w - pad.l - pad.r); const Y = (y) => h - pad.b - ((y - yMin) / (yMax - yMin || 1)) * (h - pad.t - pad.b); return { X, Y };
  }
  function axisSVG({ w, h, pad, X, Y, yMin, yMax, yTicks = 4, yFmt = (v) => nice(v) }) {
    let s = ''; for (let i = 0; i <= yTicks; i++) { const v = lerp(yMin, yMax, i / yTicks); const y = Y(v); s += `<line x1="${pad.l}" x2="${w - pad.r}" y1="${y}" y2="${y}" stroke="var(--line)" stroke-width="1"/><text x="${pad.l - 6}" y="${y + 3.5}" text-anchor="end" font-size="10" fill="var(--muted)" font-family="var(--mono)">${yFmt(v)}</text>`; } return s;
  }
  function lineChart({ w = 640, h = 170, series, yMin, yMax, xLabels = [], yFmt, yTicks = 4, markers = [] }) {
    const pad = { l: 34, r: 12, t: 12, b: 24 }; const n = Math.max(...series.map((s) => s.values.length), 2);
    const all = series.flatMap((s) => s.values.filter(isFinite)); if (yMin == null) yMin = Math.min(...all, 0); if (yMax == null) yMax = Math.max(...all, 1); if (yMin === yMax) { yMin -= 1; yMax += 1; }
    const { X, Y } = frame({ w, h, pad, xMin: 0, xMax: n - 1, yMin, yMax });
    let s = `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" role="img">` + axisSVG({ w, h, pad, X, Y, yMin, yMax, yTicks, yFmt });
    markers.forEach((mk) => { s += `<line x1="${X(mk.i)}" x2="${X(mk.i)}" y1="${pad.t}" y2="${h - pad.b}" stroke="var(--accent)" stroke-dasharray="3 4" opacity=".5"/>`; });
    series.forEach((se) => {
      let d = ''; let pen = false; se.values.forEach((v, i) => { if (!isFinite(v)) { pen = false; return; } d += `${pen ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(v).toFixed(1)}`; pen = true; });
      s += `<path d="${d}" fill="none" stroke="${se.color}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round" ${se.dim ? 'opacity=".35"' : ''}/>`;
      if (!se.dim) se.values.forEach((v, i) => { if (isFinite(v)) s += `<circle cx="${X(i)}" cy="${Y(v)}" r="2.6" fill="${se.color}"/>`; });
    });
    xLabels.forEach(({ i, text }) => { s += `<text x="${X(i)}" y="${h - 6}" text-anchor="middle" font-size="10" fill="var(--muted)" font-family="var(--mono)">${esc(text)}</text>`; });
    return s + '</svg>';
  }
  /* paired slope chart: each pair {a, b} drawn from B (left) to A (right) */
  function slopeChart({ pairs, labelA = 'A', labelB = 'B', w = 420, h = 230, yFmt }) {
    const pad = { l: 42, r: 42, t: 24, b: 28 }; const vals = pairs.flatMap((p) => [p.a, p.b]).filter(isFinite); if (!vals.length) return '';
    let yMin = Math.min(...vals), yMax = Math.max(...vals); const sp = (yMax - yMin) || 1; yMin -= sp * 0.12; yMax += sp * 0.12;
    const { X, Y } = frame({ w, h, pad, xMin: 0, xMax: 1, yMin, yMax }); const xs = [pad.l + 30, w - pad.r - 30];
    let s = `<svg viewBox="0 0 ${w} ${h}" style="width:100%;max-width:${w}px;height:auto" role="img">` + axisSVG({ w, h, pad, X, Y, yMin, yMax, yFmt });
    pairs.forEach((p) => { if (!isFinite(p.a) || !isFinite(p.b)) return; s += `<line x1="${xs[0]}" y1="${Y(p.b)}" x2="${xs[1]}" y2="${Y(p.a)}" stroke="${p.a >= p.b ? 'var(--accent2)' : 'var(--right)'}" stroke-width="1.6" opacity=".55"/><circle cx="${xs[0]}" cy="${Y(p.b)}" r="3" fill="var(--muted)"/><circle cx="${xs[1]}" cy="${Y(p.a)}" r="3" fill="var(--text)"/>`; });
    const mA = Stats.mean(pairs.map((p) => p.a).filter(isFinite)), mB = Stats.mean(pairs.map((p) => p.b).filter(isFinite));
    s += `<line x1="${xs[0]}" y1="${Y(mB)}" x2="${xs[1]}" y2="${Y(mA)}" stroke="var(--text)" stroke-width="3.2" stroke-linecap="round"/>`;
    s += `<text x="${xs[0]}" y="${h - 8}" text-anchor="middle" font-size="12" font-weight="700" fill="var(--text2)">${esc(labelB)}</text><text x="${xs[1]}" y="${h - 8}" text-anchor="middle" font-size="12" font-weight="700" fill="var(--text2)">${esc(labelA)}</text>`;
    return s + '</svg>';
  }
  /* cumulative deviation from chance with 95% envelope */
  function cumDevChart({ hits, p0, w = 560, h = 210 }) {
    const n = hits.length; if (!n) return '';
    const pad = { l: 40, r: 12, t: 14, b: 26 }; const cum = []; let c = 0; hits.forEach((x, i) => { c += x - p0; cum.push(c); });
    const env = (i) => 1.96 * Math.sqrt((i + 1) * p0 * (1 - p0)); const eMax = env(n - 1);
    const yMax = Math.max(eMax, ...cum.map(Math.abs)) * 1.1 || 1; const { X, Y } = frame({ w, h, pad, xMin: 0, xMax: Math.max(1, n - 1), yMin: -yMax, yMax });
    let up = '', dn = ''; for (let i = 0; i < n; i++) { up += `${i ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(env(i)).toFixed(1)}`; dn += `${i ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(-env(i)).toFixed(1)}`; }
    let path = ''; cum.forEach((v, i) => { path += `${i ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(v).toFixed(1)}`; });
    return `<svg viewBox="0 0 ${w} ${h}" style="width:100%;height:auto" role="img">${axisSVG({ w, h, pad, X, Y, yMin: -yMax, yMax, yTicks: 4, yFmt: (v) => nice(v, 1) })}
      <line x1="${pad.l}" x2="${w - pad.r}" y1="${Y(0)}" y2="${Y(0)}" stroke="var(--line2)"/>
      <path d="${up}" fill="none" stroke="var(--muted)" stroke-dasharray="4 4"/><path d="${dn}" fill="none" stroke="var(--muted)" stroke-dasharray="4 4"/>
      <path d="${path}" fill="none" stroke="var(--accent)" stroke-width="2.4" stroke-linejoin="round"/>
      <text x="${w / 2}" y="${h - 6}" text-anchor="middle" font-size="10" fill="var(--muted)">trials → (dashed: 95% range expected from chance alone)</text></svg>`;
  }
  /* beat-vs-time chart for the session timeline */
  function timelineChart(cfg, w = 640, h = 130) {
    const segs = AudioCore.segments(cfg); const total = segs[segs.length - 1].t1; if (!isFinite(total)) return '';
    const pad = { l: 36, r: 10, t: 10, b: 22 }; const yMax = Math.max(12, ...segs.flatMap((s) => [s.from, s.to])) * 1.12;
    const { X, Y } = frame({ w, h, pad, xMin: 0, xMax: total, yMin: 0, yMax });
    let s = `<svg class="tlchart" id="tlChart" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" role="img">`;
    BANDS.forEach((b) => { if (b.lo < yMax) { const y1 = Y(Math.min(b.hi, yMax)), y2 = Y(b.lo); s += `<rect x="${pad.l}" y="${y1}" width="${w - pad.l - pad.r}" height="${y2 - y1}" fill="${b.color}" opacity=".08"/>${y2 - y1 > 13 ? `<text x="${pad.l + 4}" y="${y1 + 11}" font-size="9" fill="${b.color}" opacity=".9">${b.name}</text>` : ''}`; } });
    s += axisSVG({ w, h, pad, X, Y, yMin: 0, yMax, yTicks: 4, yFmt: (v) => Math.round(v) });
    let d = ''; const N = 160; for (let i = 0; i <= N; i++) { const t = (i / N) * total; d += `${i ? 'L' : 'M'}${X(t).toFixed(1)} ${Y(AudioCore.beatAt(cfg, t)).toFixed(1)}`; }
    s += `<path d="${d}" fill="none" stroke="var(--accent)" stroke-width="2.6" stroke-linejoin="round"/>`;
    for (let m = 0; m <= total / 60; m += total / 60 > 40 ? 10 : total / 60 > 16 ? 5 : 2) s += `<text x="${X(m * 60)}" y="${h - 6}" text-anchor="middle" font-size="10" fill="var(--muted)" font-family="var(--mono)">${m}m</text>`;
    s += `<line id="tlCursor" x1="${pad.l}" x2="${pad.l}" y1="${pad.t}" y2="${h - pad.b}" stroke="var(--accent2)" stroke-width="2" opacity="0"/></svg>`;
    return s;
  }
  const cursorX = (cfg, t, w = 640) => { const total = AudioCore.totalSeconds(cfg); return 36 + (clamp(t / total, 0, 1)) * (w - 36 - 10); };

  return { StudioView, bandRuler, lineChart, slopeChart, cumDevChart, timelineChart, cursorX, refreshColors, components, mix };
})();
