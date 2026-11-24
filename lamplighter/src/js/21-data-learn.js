/* ═══════════════════════════ 21 · Learn articles ═══════════════════════════
   Tokens: {{r:refId}} citation link · {{demo:name}} play button · {{calc:cents}} calculator · {{bands}} band table */

const DEMOS = {
  beat6: { label: 'Hear a 6 Hz binaural beat', cfg: { mode: 'binaural', carrier: 400, beat: 6 }, secs: 10 },
  control: { label: 'Hear the matched control tone', cfg: { mode: 'control', carrier: 400 }, secs: 8 },
  monaural: { label: 'Hear a 6 Hz monaural beat', cfg: { mode: 'monaural', carrier: 400, beat: 6 }, secs: 10 },
  iso: { label: 'Hear 6 Hz isochronic pulses', cfg: { mode: 'isochronic', carrier: 400, beat: 6, pulse: 0.5 }, secs: 10 },
  high: { label: 'Try a 6 Hz beat at a 1,500 Hz carrier (it fades)', cfg: { mode: 'binaural', carrier: 1500, beat: 6 }, secs: 8 },
  wide: { label: 'Try 40 Hz apart (two tones, no beat)', cfg: { mode: 'binaural', carrier: 400, beat: 40 }, secs: 8 },
  swapR: { label: '6 Hz · right ear higher', cfg: { mode: 'binaural', carrier: 400, beat: 6, higher: 'R' }, secs: 8 },
  swapL: { label: '6 Hz · left ear higher', cfg: { mode: 'binaural', carrier: 400, beat: 6, higher: 'L' }, secs: 8 },
};

const LEARN = [
  {
    id: 'how', title: 'How binaural beats work', sub: 'An illusion your brainstem builds — and what is (and isn\'t) known about it',
    html: `
<p>Play a pure tone of one pitch in your left ear and a very slightly different pitch in your right. Neither ear hears anything that wobbles — yet many people report a slow pulsing "inside the head" at a rate equal to the <i>difference</i> between the two pitches: 400 Hz in one ear and 406 Hz in the other gives 6 pulses per second. That pulsing is a <b>binaural beat</b>. It was first described by Heinrich Wilhelm Dove in 1839 and brought to wide attention by Gerald Oster in 1973 ({{r:oster1973}}).</p>
<h4>Where the beat comes from</h4>
<p>Nerve cells in the lower brainstem compare the <i>timing</i> of signals arriving from the two ears — that is how you tell whether a sound is to your left or right. When the two tones drift in and out of phase, that timing difference sweeps through a full cycle once per beat, and the sound image seems to move or pulse at that rate. Because the beat only exists after the ears' signals are combined in the brain, you need <b>headphones</b>. On speakers the tones mix in the air and you get a physical (monaural) beat instead.</p>
<div class="demo">{{demo:beat6}}{{demo:control}}</div>
<h4>The open question: does it "entrain" the brain?</h4>
<p>The popular claim is that the brain's electrical rhythms lock on to the beat ("brainwave entrainment"), nudging you toward calm (alpha/theta) or alertness (beta/gamma). The brainstem clearly follows the beat. Whether the <i>cortex</i> does is contested: a 2023 systematic review of 14 EEG studies found 5 supportive, 8 contradictory and 1 mixed ({{r:ingendoh2023}}), and one careful study found binaural beats entrained the cortex only weakly compared with monaural beats ({{r:orozco2020}}).</p>
<p>So when binaural beats help people relax or concentrate, the cause may be relaxation, expectation, or the accompanying noise — not "syncing the brain". That does not make the effect fake; it means the mechanism is unproven.</p>`,
  },
  {
    id: 'spacing', title: 'How far apart should the tones be?', sub: 'The gap in hertz is the beat — pick it by band, and keep it under ~30 Hz',
    html: `
<p>The beat rate is simply the difference between the two frequencies, |R − L| in hertz. It is the single most important number you choose.</p>
{{bands}}
<p class="hint">These labels come from what EEG shows during such states — correlations. Playing a beat in a band does not guarantee the matching state.</p>
<h4>Limits</h4>
<ul>
<li><b>Upper limit ≈ 30 Hz.</b> Reviews cite roughly 1–30 Hz as the range over which binaural beats are perceived (Perrott &amp; Nelson 1969, via {{r:ingendoh2023}}). Beyond that you hear two tones or roughness. {{demo:wide}} For 40 Hz, use <b>monaural</b> or <b>isochronic</b> tones.</li>
<li><b>Lower limit.</b> Under about 1 Hz the beat is a slow drift that is easy to miss.</li>
</ul>
<h4>It's a tiny musical interval</h4>
<p>At a 400 Hz carrier a 10 Hz difference is only about 43 cents — less than half a semitone. That is why it sounds like one wavering note instead of two. {{calc:cents}}</p>
<h4>What do studies actually use?</h4>
<p>No study has established an "optimal" beat for a goal; effects depend on frequency band, exposure time and timing ({{r:garcia2019}}). Examples: 16 and 24 Hz in a vigilance task ({{r:lane1998}}); 15 Hz during a working-memory task ({{r:beauchene2016}}); 40 Hz in attention and flexibility studies ({{r:hommel2016}}, {{r:colzato2017}}); 2–8 Hz and 3 Hz around sleep ({{r:abeln2014}}, {{r:jirak2018}}).</p>`,
  },
  {
    id: 'carrier', title: 'Why some carrier tones work better', sub: 'Low, pure and quiet beats loud, high and fancy',
    html: `
<p>The <b>carrier</b> is the pitch both ears hear — the middle of the pair. It matters more than most apps admit.</p>
<ul>
<li><b>Keep it low (≲ 1000 Hz).</b> The brainstem compares timing by locking on to the waveform, which only works at lower frequencies. Reviews state that binaural beats are found only with carriers below roughly 1000 Hz (Licklider 1950; Oster 1973) and are perceived best around 400 Hz ({{r:ingendoh2023}}). {{demo:high}}</li>
<li><b>200–500 Hz is the practical sweet spot.</b> The beat is clear, the tone isn't piercing, and small headphone drivers reproduce it cleanly. Below ~150 Hz earbuds roll off; above ~600 Hz it gets harsher and fades.</li>
<li><b>Pure sine waves only.</b> If a tone has harmonics (square or saw waves), each harmonic makes its own beat at 2×, 3×… the rate — a 6 Hz beat would also produce 12 and 18 Hz — muddying what you intended. The Lamplighter Project uses sines only.</li>
<li><b>Quiet.</b> Louder is not stronger. Studies use comfortable levels.</li>
<li><b>Masking noise.</b> Pink or brown noise hides the drone and is more comfortable, but it is not shown to make beats work better: a meta-analysis found masking made no difference ({{r:garcia2019}}).</li>
</ul>
<p class="hint">Honest caveat: there is no evidence that one carrier within 200–500 Hz produces better outcomes than another — only that the beat is easier to perceive there. Test your own preference with Experiments → Carrier test.</p>`,
  },
  {
    id: 'level', title: 'How loud should the tones and the noise be?', sub: 'As quiet as you can still clearly hear — nothing suggests louder works better',
    html: `
<p><b>Short answer:</b> set it by ear to a comfortable, quiet level, and then leave it alone. No study I found identifies a best loudness, and a meta-analysis found masking noise made no difference to the effects ({{r:garcia2019}}) — so comfort is the right criterion.</p>
<h4>1 · Set the overall level (30 seconds)</h4>
<ol>
<li>Headphones on, system volume around the middle. If yours has noise cancelling, keep it on — it lets you use a lower volume.</li>
<li>Setup → Level → <i>Play reference noise</i>. Slide until it sounds like <b>soft rain or a distant fan</b>: clearly there, but you could listen for an hour without wanting to turn it down, and you can still hear your own breathing.</li>
<li>Press <i>Save as my default volume</i>.</li>
</ol>
<h4>2 · Set the noise against the tones</h4>
<ul>
<li>The <b>Noise level</b> slider is in decibels <i>relative to the tones</i>. <b>−14 dB</b> puts the noise well behind the tones; <b>−8 dB</b> is a fuller wash; <b>−20 dB</b> is barely there. Presets open at −8 to −14 dB, moved by <i>Setup → Level → Noise comfort shift</i> (The Lamplighter Project ships at −5 dB, so Calm opens at −19 dB). If the hiss gets irritating after a few minutes, go quieter — −19 dB is a perfectly good setting.</li>
<li>At these settings the noise <b>softens the drone but never hides the tones</b> — measured on the Lamplighter Project’s own output, in the narrow band around a 400 Hz carrier the pink noise at −14 dB is about 30 dB quieter than the tone (about 25 dB at −8 dB), so the beat stays audible.</li>
<li>Play a beat, close your eyes and listen for the wobble. If you can’t find it, make the noise quieter (more negative). If the steady tone is irritating, raise the noise a little.</li>
<li>Brown noise has less treble than pink, so at the same level it often feels smoother for long sessions or sleep — worth trying if the hiss is what bothers you; white noise is the hissiest.</li>
<li><b>Pick one setting and keep it</b> — especially in Experiments, where both conditions must use the same noise and volume.</li>
</ul>
<h4>Safety anchors</h4>
<ul>
<li>If your ears feel “pushed”, ring, or sound muffled afterwards, it was too loud.</li>
<li>For scale: WHO–ITU safe-listening guidance is about 80 dBA for up to 40 hours a week ({{r:whoitu}}). Relaxation levels should sit far below that. Don’t fall asleep with the volume up.</li>
<li>The level meters in Studio show <i>digital</i> level (dBFS), not loudness at your ears — headphones differ a lot, so trust your ears, not the number.</li>
</ul>`,
  },
  {
    id: 'ears', title: 'Left ear or right ear higher?', sub: 'It flips the direction of the illusion, not the rate — and there\'s no evidence it matters',
    html: `
<p><b>Short answer:</b> it doesn't change the beat rate, and I found no study showing one arrangement works better.</p>
<p>The beat depends only on the <i>difference</i> in frequency, so L = 400 / R = 406 and L = 406 / R = 400 both give a 6 Hz beat. What flips is the direction the sound image drifts: the ear with the higher frequency gains phase on the other, and the sound appears to move toward it ({{r:auditoryNeuro}}). Published trials rarely say which ear received the higher tone, or counterbalance it — so there is no evidence on whether it matters for mood or cognition.</p>
<div class="demo">{{demo:swapR}}{{demo:swapL}}</div>
<p>The Lamplighter Project defaults to the right ear higher (a convention, not a scientific finding) and lets you swap it in one click. To find out whether it matters <i>to you</i>, run Experiments → Ear-swap test: a blinded A/B comparison with your own ratings.</p>`,
  },
  {
    id: 'types', title: 'Binaural vs monaural vs isochronic', sub: 'Three ways to make a rhythm out of tones',
    html: `
<table>
<tr><th>Type</th><th>How it works</th><th>Notes</th></tr>
<tr><td><b>Binaural</b></td><td>A different tone in each ear; the beat is built in the brain.</td><td>Gentle. Headphones required. Brainstem follows it; cortical entrainment is mixed.</td></tr>
<tr><td><b>Monaural</b></td><td>Both tones mixed into both ears, so the sound itself physically beats.</td><td>Works on speakers. Audible over a wider range. Evoked more cortical response than binaural in one EEG study ({{r:orozco2020}}). Slightly harsher.</td></tr>
<tr><td><b>Isochronic</b></td><td>A single tone switched on and off at the beat rate.</td><td>The strongest physical rhythm and the most intrusive. Fewer studies.</td></tr>
</table>
<div class="demo">{{demo:beat6}}{{demo:monaural}}{{demo:iso}}</div>
<p>For 40 Hz, the cortex's <b>auditory steady-state response</b> is well established ({{r:galambos1981}}), which is why monaural or isochronic stimulation is the natural way to deliver it. A stronger brain response is not the same as a benefit, though.</p>`,
  },
  {
    id: 'evidence', title: 'What the evidence actually says', sub: 'Small, inconsistent effects — and a lot of room for expectation',
    html: `
<table>
<tr><th>Study</th><th>What it found</th></tr>
<tr><td>{{r:garcia2019}}</td><td>Meta-analysis of 22 studies (35 effect sizes): overall medium effect (g ≈ 0.45) across memory, attention, anxiety and pain; depended on frequency, exposure time and timing; masking noise made no difference. Quality is limited by the small studies it pools.</td></tr>
<tr><td>{{r:ingendoh2023}}</td><td>14 EEG studies: 5 supported entrainment, 8 contradicted it, 1 mixed. Methods vary widely.</td></tr>
<tr><td>{{r:orozco2020}}</td><td>Binaural beats weakly entrained the cortex compared with monaural beats; neither changed mood.</td></tr>
<tr><td>{{r:lane1998}}</td><td>n = 29: beta beats (16/24 Hz) gave better vigilance and less negative mood than theta/delta. No EEG.</td></tr>
<tr><td>{{r:sustained2022}}</td><td>Two experiments pooled: strong evidence <i>against</i> beta beats improving sustained attention.</td></tr>
<tr><td>{{r:beauchene2016}}</td><td>15 Hz improved visuospatial working-memory accuracy; 5 and 10 Hz and the control sounds did not.</td></tr>
<tr><td>{{r:hommel2016}}, {{r:colzato2017}}, {{r:reedijk2015}}</td><td>40 Hz beats (vs a 340 Hz tone): more cognitive flexibility, narrower attentional focus; the attentional-blink benefit appeared only in people with low eye-blink rates.</td></tr>
<tr><td>{{r:padmanabhan2005}}</td><td>Pre-surgery anxiety fell ~26% with beat audio, ~11% with the same audio without beats, ~4% with nothing.</td></tr>
<tr><td>{{r:abeln2014}}, {{r:jirak2018}}</td><td>Small sleep studies: better self-reported sleep (pilot); more deep sleep with a 3 Hz beat (24 people).</td></tr>
</table>
<h4>Putting it together</h4>
<ul>
<li>Effects, when found, are <b>small to moderate and inconsistent</b>.</li>
<li>Part of any benefit is probably relaxation, expectation and the accompanying sound — note the ~11% drop from the beat-free audio in the surgery trial.</li>
<li>People differ: one result held only for people with low eye-blink rates.</li>
<li>The best way to know whether it works for <b>you</b> is a blinded self-test — that's what the Experiments tab is for. Expect modest results either way.</li>
</ul>`,
  },
  {
    id: 'scams', title: 'Scam radar', sub: 'Claims that sound scientific but aren\'t',
    html: `
<table>
<tr><th>Claim</th><th>Verdict</th><th>Why</th></tr>
<tr><td>"Solfeggio" frequencies (396, 417, <b>528 Hz</b>…) heal tissue or repair DNA</td><td><span class="verdict no">No evidence</span></td><td>The medieval syllables are real; the specific Hz list and healing claims are a modern invention. No credible trials.</td></tr>
<tr><td>432 Hz is the "natural" tuning and beats 440 Hz</td><td><span class="verdict maybe">Tiny pilots only</span></td><td>A few small double-blind pilots ({{r:calamassi2019}}; {{r:sci432}} with 12 patients) report small benefits, with no independent replication. "Frequency of the universe" claims are numerology.</td></tr>
<tr><td>Schumann 7.83 Hz "reconnects you to the Earth"</td><td><span class="verdict no">No evidence</span></td><td>The resonance is real physics, but the signal is extremely weak and there is no good evidence that brains entrain to it or that products help.</td></tr>
<tr><td>"Digital drugs" that mimic cocaine, MDMA or cannabis</td><td><span class="verdict no">No evidence</span></td><td>Nothing beyond expectation and suggestion.</td></tr>
<tr><td>Delta beats raise growth hormone, unlock DNA, add IQ points or help you "manifest" money</td><td><span class="verdict no">No evidence</span></td><td>No credible trials.</td></tr>
<tr><td>Binaural beats treat ADHD, PTSD or clinical insomnia</td><td><span class="verdict maybe">Not established</span></td><td>Some small studies exist; none establish a treatment. See a clinician.</td></tr>
<tr><td>Hemi-Sync / Gateway tapes produce out-of-body travel, time travel, remote viewing</td><td><span class="verdict no">No independent evidence</span></td><td>Peer-reviewed work is limited to small pilots; no large independent controlled trials. See the Gateway article.</td></tr>
</table>
<h4>Red flags</h4>
<ul><li>Cures for diseases, or "secret ancient frequencies".</li><li>"Scientifically proven" without a citation you can open.</li><li>Dramatic instant results — and no mention of placebo or expectation.</li><li>Expensive "activation" files or subscriptions.</li><li>Studies of 10–30 people described as settled science.</li></ul>`,
  },
  {
    id: 'gateway', title: 'The CIA "Gateway" document, in context', sub: 'What the 1983 Army paper claimed — and what it can and can\'t show',
    html: `
<p>The "CIA Gateway Experience" document is an internal US Army INSCOM staff paper by LTC Wayne McDonnell, dated 9 June 1983 and declassified in 2003 ({{r:mcdonnell1983}}). It assesses the Monroe Institute's Gateway/Hemi-Sync training. It is not a CIA study; it sits in the CIA's declassified "Stargate" archive.</p>
<ul>
<li><b>Claim:</b> Hemi-Sync audio synchronises the brain's hemispheres, producing a coherent high-energy state in which consciousness can "click out" of time and space and perceive past and future.</li>
<li><b>Basis:</b> mostly one author's popular-science model (Bentov, Pribram, Bohm), summaries from course trainers, and the author's own experience. There are no controlled data.</li>
<li><b>Notable admissions:</b> the paper calls itself "not the last word"; its out-of-body conclusion is "tentative"; and trainers reported that out-of-body subjects who tried to read ten computer-generated digits never got all ten right.</li>
<li><b>Several physics statements are wrong or misapplied</b> (for example, treating the Planck length as a speed, and comparing an audio carrier with EEG beta frequencies).</li>
<li><b>Outcome:</b> its conclusion is that the approach is "plausible" and should be tested — it proposed experiments, not a validation. The broader remote-viewing program was later reviewed and found to have no demonstrated intelligence value ({{r:air1995}}).</li>
</ul>
<p>The Experiments tab lets you run the paper's suggested tests on yourself, blinded: a sealed-target number guess, forced-choice symbols, and free-response picture ranking. Expect chance results — but the point is a fair test, with the target fixed (and cryptographically committed) before you guess.</p>`,
  },
  {
    id: 'safety', title: 'Safety & good practice', sub: 'Mostly common sense — with two cautions',
    html: `
<ul>
<li><b>Volume:</b> keep it comfortable and quiet. Louder does not make the effect stronger, and prolonged loud listening damages hearing. Start with your system volume low; the Lamplighter Project fades in on every start.</li>
<li><b>Don't use while driving,</b> operating machinery, or anywhere you need full alertness — especially delta/theta presets.</li>
<li><b>Seizure history:</b> audio-only beats are not flashing light and I found no reports linking them to seizures, but if you have epilepsy talk to your clinician first. The Lamplighter Project's visuals deliberately never flash at the beat rate.</li>
<li><b>Hearing conditions:</b> if you have tinnitus or hyperacusis, stop if symptoms worsen.</li>
<li><b>Altered-state practices</b> (out-of-body, "Focus 15/21", deep-trance protocols): if you have a history of psychosis, mania or dissociation, or you feel unsettled afterwards, skip them and talk with a clinician or someone you trust.</li>
<li><b>Not medical treatment.</b> Beat audio is an optional relaxation aid. Don't use it to replace care for anxiety, insomnia, ADHD, depression or pain.</li>
<li><b>Self-experiments:</b> n = 1 results are fragile. Use blinding and enough sessions, and don't read much into a single good or bad day.</li>
</ul>`,
  },
  {
    id: 'drive', title: 'When motivation or creativity drops', sub: 'The boring levers that actually have evidence',
    html: `
<p>A sudden flat patch — no drive, no ideas — is common and usually has findable causes. Tone generators are not one of them. The things with real evidence behind them:</p>
<ul>
<li><b>Sleep.</b> Regular timing and 7–9 hours move mood, motivation and creative output more than anything an app can play.</li>
<li><b>Daylight and movement.</b> Morning light helps body-clock regularity and mood. A walk boosted creative idea generation by about 60% in one study ({{r:oppezzo2014}}).</li>
<li><b>Small, scheduled actions (behavioural activation).</b> Motivation often follows action, not the other way round. Pick one 10-minute task and start it.</li>
<li><b>Less doom-scrolling and news.</b> Heavy negative media is a reasonable thing to cut when your mood is low.</li>
<li><b>People.</b> Time with someone you trust is a mood lever for almost everyone.</li>
<li><b>Air quality.</b> In office-style studies, thinking scores fell as indoor CO₂ rose ({{r:allen2016}}, {{r:satish2012}}). A cheap CO₂ monitor and a carbon-monoxide alarm are worth having; open a window if CO₂ is above ~1000 ppm.</li>
<li><b>Get the basics checked.</b> Thyroid, anaemia, vitamin D or B12, sleep apnoea, medication side-effects, alcohol or cannabis use, and depression or anxiety are common, treatable causes of low drive.</li>
</ul>
<div class="callout good">Use the <b>Journal</b> tab for 30 seconds a day. It tracks motivation, creativity, sleep and context, and shows what really moves with what — useful for you and for a doctor. It includes an optional two-question mood screener ({{r:kroenke3}}).</div>
<p><b>If it lasts more than about two weeks, keeps getting worse, or comes with hopelessness, panic, or experiences that feel frightening or outside your control, talk to a doctor or mental-health professional.</b> These things are common and treatable, and an app can't tell the difference.</p>`,
  },
  {
    id: 'meditation', title: 'Meditation: getting back, what “deep” means, and going gently', sub: 'Small, regular sits beat heroic ones — plus some honest cautions',
    html: `
<p><b>If you’ve lost your touch,</b> you almost certainly haven’t. Skills built by repetition feel rusty after a gap, and the first sits back are messy. Treat yourself as a beginner for two weeks, keep sits short (3–5 minutes), and judge success by <i>sitting</i>, not by how it felt. The Meditate page’s 14-step way back does exactly that — and moves on when you finish a sit, not by the calendar.</p>
<h4>What the evidence says</h4>
<ul>
<li>Meditation programs give <b>small-to-moderate</b> benefits for anxiety, depression and pain; the evidence for attention, sleep and positive mood is weak ({{r:goyal2014}}).</li>
<li>In one trial of beginners, <b>13 minutes a day</b> improved attention, memory and mood after 8 weeks, but not after 4 ({{r:basso2019}}). Regular, modest practice over weeks is the realistic target.</li>
<li>Five minutes a day of <b>exhale-focused breathing</b> improved mood more than mindfulness over a month in a single trial ({{r:balban2023}}) — promising, not settled.</li>
<li>The core trainable skill is <b>noticing</b> that attention has wandered and <b>returning</b> ({{r:lutz2008}}). A busy mind is the material, not a failure.</li>
</ul>
<h4>What “deep” actually means</h4>
<p>In practice, depth is <i>steadier and kinder</i>: you catch wandering sooner, settle faster, and feel a little calmer afterwards. Trance-like or dramatic experiences aren’t the goal and aren’t a sign of progress, and no tone, frequency or app can produce “deep states” on demand. Longer sits help once short ones feel easy.</p>
<h4>Where binaural beats fit</h4>
<p>Nowhere essential. Meditation’s benefits come from attention practice, and I found no trial showing that beats deepen it. A quiet theta or alpha beat under soft noise is an optional backdrop some people like; the Lamplighter Project offers it, with silence just as good.</p>
<h4>Going gently</h4>
<p>Difficult experiences happen to some meditators: in reviews, roughly 8% in trials and more in surveys, mostly anxiety, low mood and feeling detached or unreal ({{r:farias2020}}, {{r:lindahl2017}}). Keep sits short, open your eyes if it gets uncomfortable, use the Ground practice or the “I need to stop” button, and don’t push through. If you have a history of psychosis, mania or severe trauma — or you’re feeling unwell — stay with short breath sits and talk to a clinician before trying longer or open-awareness practice.</p>`,
  },
];
// citation alias used above
REFS.kroenke3 = REFS.kroenke2003;
REFS.whoitu = { short: 'WHO–ITU 2019', full: 'WHO–ITU. Safe listening devices and systems: a WHO–ITU standard (H.870), 2019 — adults: about 80 dB(A) for up to 40 hours per week.', url: '' };
