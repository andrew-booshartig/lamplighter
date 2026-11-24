/* ═══════════════════════════ 6f · Sound: one home for the sound-and-stillness side (it was called Gateway) ═══════════════════════════
   Guided sits, the tone studio, presets and plain-English learning live under one tab. The lab tools join them when switched on in Setup. */
Pages.gateway = {
  mount(root) {
    const lab = Settings.get('showLab');
    const tiles = [
      ['meditate', 'lotus', 'Meditate', 'Short guided sits: breath, body scan, open awareness, kindness, deep rest, with optional voice and bells. A gentle 14-step way back if you have lost your touch.'],
      ['studio', 'studio', 'Studio', 'Design binaural, monaural and isochronic tones, add a noise bed, sweep the beat, and measure what your headphones really deliver.'],
      ['presets', 'presets', 'Presets', 'Fourteen starting points. Each one says honestly how strong the evidence is, what the studies found and the caveats.'],
      ['learn', 'learn', 'Learn', 'Plain-English answers about beats, carriers, safety and scams, and the 1983 Army “Gateway” paper in context.'],
    ];
    if (lab) tiles.push(['experiments', 'flask', 'Experiments', 'Blinded A/B trials, a “can I hear the beat?” test and sealed-target guessing. The way to find out whether any of this works for you.'], ['journal', 'journal', 'Journal', 'A 30-second daily check-in, with trends and correlations over the weeks.']);
    root.innerHTML = `<div class="page-head fade-in"><div><h1>Sound</h1><p>Sound and stillness: guided sits, tone design and honest tests of what helps. The tone work here comes from the “Gateway Experience” idea that a steady sound plus guided attention can shift the state you are in. Here you try it, and you check it.</p></div></div>
      <section class="card glow fade-in"><div class="card-title"><h3>${icon('sparkle')}Start here</h3><span class="tag">about 10 minutes</span></div>
        <ol class="gsteps"><li><b>Put on stereo headphones.</b> Binaural beats need a separate signal in each ear. <a href="#/headphones">Run the 30-second headphone check →</a></li>
          <li><b>Try one short sit.</b> Five minutes of breath is plenty. <a href="#/meditate">Open Meditate →</a></li>
          <li><b>Add sound if you like.</b> Pick a preset, keep it quiet, and notice what changes. <a href="#/presets">Open Presets →</a></li></ol>
        <div class="callout warn">${icon('warn')}<div>The Lamplighter Project is not a medical device. Don’t use it while driving. If you have a seizure history, talk with a clinician first.</div></div></section>
      <div class="grid c2" style="margin-top:16px">${tiles.map(([k, ic, t, s]) => `<a class="card pcard fade-in" href="#/${k}"><div class="top"><h3>${icon(ic)} ${t}</h3></div><div class="blurb">${s}</div></a>`).join('')}</div>
      ${lab ? '' : `<p class="hint" style="margin-top:12px">Experiments and Journal are tucked away. Switch them on in Setup → Preferences → Show lab tools.</p>`}
      <section class="card flat fade-in" style="margin-top:16px"><div class="card-title"><h3>${icon('globe')}Sound and rhythm through history</h3></div><p class="t2 small" style="max-width:70ch">Chant, hymn, drumming and sacred dance are among the oldest ways people have reached toward the divine and toward each other. See which traditions used them, and where.</p><div class="row tight">${[['chant_mantra', 'Chant and mantra'], ['hymn', 'Hymns and sacred song'], ['drum_dance', 'Drumming and sacred dance'], ['liturgy', 'Formal liturgy']].map(([k, n]) => `<a class="chip" href="#/atlas?p=${k}&y=2026">${n}</a>`).join('')}</div><p class="hint" style="margin-top:8px">Binaural beats are a modern technique, a way of working with sound and rhythm today. The Lamplighter Project does not present them as something ancient peoples used.</p></section>
      <section class="card flat fade-in" style="margin-top:16px"><div class="card-title"><h3>${icon('path')}How this fits with worship</h3></div>
        <p class="t2 small" style="max-width:70ch">The practices under Ways to worship (breath, stillness, chant, walking, kindness) run through the same sit runner as Meditate, so your minutes and notes land in one place. The sound side makes no claim that sound unlocks anything; the Learn tab says what the evidence does and does not show. <a href="#/path/practices">See the ways to worship →</a></p></section>`;
  },
};
