/* ═══════════════════════════ 20 · science data: bands, references, presets ═══════════════════════════
   Every evidence grade below is deliberately conservative. Sources were checked against the primary
   abstracts/full texts where available; items marked "secondary" in comments were read via reviews. */

const BANDS = [
  { id: 'delta', name: 'Delta', lo: 0.5, hi: 4, color: '#6f7dff', feel: 'Deep sleep, very slow rhythms' },
  { id: 'theta', name: 'Theta', lo: 4, hi: 8, color: '#a07bff', feel: 'Drowsy, meditative, reverie' },
  { id: 'alpha', name: 'Alpha', lo: 8, hi: 13, color: '#3fd9b0', feel: 'Relaxed wakefulness' },
  { id: 'beta', name: 'Beta', lo: 13, hi: 30, color: '#ffc65a', feel: 'Alert, active thinking' },
  { id: 'gamma', name: 'Gamma', lo: 30, hi: 50, color: '#ff7b8f', feel: 'Fast cortical synchrony (≈40 Hz in studies)' },
];
function bandOf(f) { return BANDS.find((b) => f >= b.lo && f < b.hi) || (f < 0.5 ? BANDS[0] : BANDS[BANDS.length - 1]); }

const REFS = {
  garcia2019: { short: 'Garcia-Argibay 2019', full: 'Garcia-Argibay M, Santed MA, Reales JM. Efficacy of binaural auditory beats in cognition, anxiety, and pain perception: a meta-analysis. Psychological Research 2019;83:357–372.', url: 'https://pubmed.ncbi.nlm.nih.gov/30073406/' },
  ingendoh2023: { short: 'Ingendoh 2023', full: 'Ingendoh RM, Posny ES, Heine A. Binaural beats to entrain the brain? A systematic review of the effects of binaural beat stimulation on brain oscillatory activity, and the implications for psychological research and intervention. PLOS ONE 2023;18(5):e0286023.', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10198548' },
  orozco2020: { short: 'Orozco Perez 2020', full: 'Orozco Perez HD, Dumas G, Lehmann A. Binaural beats through the auditory pathway: from brainstem to connectivity patterns. eNeuro 2020;7(2).', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7082494' },
  lane1998: { short: 'Lane 1998', full: 'Lane JD, Kasian SJ, Owens JE, Marsh GR. Binaural auditory beats affect vigilance performance and mood. Physiology & Behavior 1998;63(2):249–252.', url: 'https://pubmed.ncbi.nlm.nih.gov/9423966/' },
  sustained2022: { short: 'Sustained-attention study 2022', full: 'Robison M, Obulasetty M, Blais C, Wingert K, Brewer G. The effect of binaural beat stimulation on sustained attention. Psychological Research 2022;86(3):808–822 (PMID 33978805). Pooled data from two experiments gave strong evidence against a beta-beat benefit.', url: 'https://pubmed.ncbi.nlm.nih.gov/33978805/' },
  beauchene2016: { short: 'Beauchene 2016', full: 'Beauchene C, Abaid N, Moran R, Diana RA, Leonessa A. The effect of binaural beats on visuospatial working memory and cortical connectivity. PLOS ONE 2016.', url: 'https://research-information.bris.ac.uk/en/publications/the-effect-of-binaural-beats-on-visuospatial-working-memory-and-c/' },
  hommel2016: { short: 'Hommel 2016', full: 'Hommel B, Sellaro R, Fischer R, Borg S, Colzato LS. High-frequency binaural beats increase cognitive flexibility: evidence from dual-task crosstalk. Frontiers in Psychology 2016;7:1287.', url: 'https://www.frontiersin.org/articles/10.3389/fpsyg.2016.01287/text' },
  colzato2017: { short: 'Colzato 2017', full: 'Colzato LS, Barone H, Sellaro R, Hommel B. More attentional focusing through binaural beats: evidence from the global–local task. Psychological Research 2017;81:271–277.', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5233742/' },
  reedijk2015: { short: 'Reedijk 2015', full: 'Reedijk SA, Bolders A, Colzato LS, Hommel B. Eliminating the attentional blink through binaural beats: a case for tailored cognitive enhancement. Frontiers in Psychiatry 2015;6:82.', url: 'https://www.frontiersin.org/articles/10.3389/fpsyt.2015.00082/full' },
  padmanabhan2005: { short: 'Padmanabhan 2005', full: 'Padmanabhan R, Hildreth AJ, Laws D. A prospective, randomised, controlled study examining binaural beat audio and pre-operative anxiety in patients undergoing general anaesthesia for day case surgery. Anaesthesia 2005;60(9):874–877.', url: 'https://pubmed.ncbi.nlm.nih.gov/16115248/' },
  abeln2014: { short: 'Abeln 2014', full: 'Abeln V, Kleinert J, Strüder HK, Schneider S. Brainwave entrainment for better sleep and post-sleep state of young elite soccer players — a pilot study. European Journal of Sport Science 2014.', url: 'https://pubmed.ncbi.nlm.nih.gov/23862643/' },
  jirak2018: { short: 'Jirakittayakorn 2018', full: 'Jirakittayakorn N, Wongsawat Y. A novel insight of effects of a 3-Hz binaural beat on sleep stages during sleep. Frontiers in Human Neuroscience 2018;12:387.', url: 'https://www.frontiersin.org/articles/10.3389/fnhum.2018.00387/text' },
  sci432: { short: '432 Hz pilot 2020', full: 'Calamassi D, Lucicesare A, Pomponi GP, Bambi S. Music tuned to 432 Hz versus music tuned to 440 Hz for improving sleep in patients with spinal cord injuries: a double-blind cross-over pilot study. Acta Biomedica 2020;91(12-S):e2020008. Twelve patients; sleep scores rose after 432 Hz music and not after 440 Hz; stress fell with both, not significantly.', url: 'https://mattioli1885journals.com/index.php/actabiomedica/article/view/10755' },
  calamassi2019: { short: 'Calamassi & Pomponi 2019', full: 'Calamassi D, Pomponi GP. Music tuned to 440 Hz versus 432 Hz and the health effects: a double-blind cross-over pilot study. Explore 2019.', url: '' },
  basner2011: { short: 'Basner 2011', full: 'Basner M, Mollicone D, Dinges DF. Validity and sensitivity of a brief psychomotor vigilance test (PVT-B) to total and partial sleep deprivation. Acta Astronautica 2011;69:949–959.', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3197786' },
  kroenke2003: { short: 'Kroenke 2003', full: 'Kroenke K, Spitzer RL, Williams JBW. The Patient Health Questionnaire-2: validity of a two-item depression screener. Medical Care 2003;41:1284–1292. (Cut-off ≥3: sensitivity 83%, specificity 92% in the original validation; a later meta-analysis found pooled sensitivity 0.76, specificity 0.87.)', url: 'https://pubmed.ncbi.nlm.nih.gov/14583691/' },
  allen2016: { short: 'Allen 2016', full: 'Allen JG, MacNaughton P, Satish U, et al. Associations of cognitive function scores with carbon dioxide, ventilation, and volatile organic compound exposures in office workers. Environmental Health Perspectives 2016;124:805–812.', url: 'https://doi.org/10.1289/ehp.1510037' },
  satish2012: { short: 'Satish 2012', full: 'Satish U, Mendell MJ, Shekhar K, et al. Is CO₂ an indoor pollutant? Direct effects of low-to-moderate CO₂ concentrations on human decision-making performance. Environmental Health Perspectives 2012;120:1671–1677.', url: '' },
  oppezzo2014: { short: 'Oppezzo & Schwartz 2014', full: 'Oppezzo M, Schwartz DL. Give your ideas some legs: the positive effect of walking on creative thinking. Journal of Experimental Psychology: Learning, Memory, and Cognition 2014;40:1142–1152.', url: 'https://doi.org/10.1037/a0036577' },
  oster1973: { short: 'Oster 1973', full: 'Oster G. Auditory beats in the brain. Scientific American 1973;229(4):94–102.', url: '' },
  galambos1981: { short: 'Galambos 1981', full: 'Galambos R, Makeig S, Talmachoff PJ. A 40-Hz auditory potential recorded from the human scalp. PNAS 1981;78:2643–2647.', url: '' },
  fink2014: { short: 'Fink & Benedek 2014', full: 'Fink A, Benedek M. EEG alpha power and creative ideation. Neuroscience & Biobehavioral Reviews 2014;44:111–123.', url: '' },
  perrott1969: { short: 'Perrott & Nelson 1969', full: 'Perrott DR, Nelson MA. Limits for the detection of binaural beats. Journal of the Acoustical Society of America 1969;46:1477–1481 (read via secondary citations).', url: '' },
  licklider1950: { short: 'Licklider 1950', full: 'Licklider JCR, Webster JC, Hedlun JM. On the frequency limits of binaural beats. Journal of the Acoustical Society of America 1950;22:468–473 (read via secondary citations).', url: '' },
  auditoryNeuro: { short: 'auditoryneuroscience.com demo', full: 'Binaural beats — sound example and explanation. auditoryneuroscience.com (the image drifts toward the ear whose tone has the higher frequency).', url: 'https://auditoryneuroscience.com/node/63' },
  mcdonnell1983: { short: 'McDonnell 1983', full: 'McDonnell WM. Analysis and Assessment of Gateway Process. US Army INSCOM, 9 June 1983 (declassified 2003; CIA-RDP96-00788R001700210016-5).', url: 'https://www.theblackvault.com/documentarchive/stargate-collection-analysis-and-assessment-of-gateway-process-9-june-1983/' },
  air1995: { short: 'AIR 1995', full: 'Mumford MD, Rose AM, Goslin DA. An evaluation of remote viewing: research and applications. American Institutes for Research, 1995 (the review that preceded the end of the Stargate program).', url: '' },
};
function refLink(id) { const r = REFS[id]; if (!r) return ''; return r.url ? `<a href="${r.url}" target="_blank" rel="noopener noreferrer">${esc(r.short)}</a>` : `<span title="${esc(r.full)}">${esc(r.short)}</span>`; }

/* ───────────── presets ───────────── */
const GOALS = [
  { id: 'all', label: 'All' }, { id: 'calm', label: 'Calm' }, { id: 'focus', label: 'Focus' }, { id: 'creative', label: 'Creative' },
  { id: 'sleep', label: 'Sleep' }, { id: 'meditate', label: 'Meditate' }, { id: 'explore', label: 'Explore & folklore' }, { id: 'control', label: 'Controls' }, { id: 'mine', label: 'Mine' },
];

const PRESETS = [
  {
    id: 'calm-alpha', name: 'Calm — Alpha 10 Hz', goal: 'calm', evidence: 3, tags: ['relaxation', 'anxiety'],
    blurb: 'A soft 10 Hz beat for unwinding. Clean 400 Hz carrier under gentle pink noise.',
    cfg: { mode: 'binaural', carrier: 400, beat: 10, higher: 'R', centering: 'sym', noiseType: 'pink', noiseDb: -14, duration: 20, fadeIn: 12, fadeOut: 12, volume: 0.55 },
    science: `<p>Acute relaxation and anxiety is where binaural-beat audio has its most consistent (still modest) signal. In a randomised trial of day-surgery patients, pre-operative anxiety fell about 26% with binaural-beat audio, versus about 11% with the same audio without the beats and about 4% with nothing ({{r:padmanabhan2005}}). A 2019 meta-analysis of 22 studies found a medium overall effect (g ≈ 0.45) across cognition, anxiety and pain, depending on frequency band, exposure time and timing ({{r:garcia2019}}).</p>
      <p><b>Why 10 Hz?</b> It is the centre of the alpha band (relaxed wakefulness) — a convention, not a result: no trial shows 10 Hz beats a 6 Hz or 8 Hz beat for calm.</p>`,
    caveats: 'Most studies are small, and the soothing audio itself relaxes people. EEG evidence that the cortex locks to the beat is mixed (5 of 14 studies supportive). Treat this as a relaxation aid, not a treatment for anxiety.',
    refs: ['padmanabhan2005', 'garcia2019', 'ingendoh2023'],
  },
  {
    id: 'calm-theta', name: 'Calm — Theta 6 Hz', goal: 'calm', evidence: 2, tags: ['drowsy', 'wind-down'],
    blurb: 'Slower, drowsier relaxation. Good for the evening — not for demanding work.',
    cfg: { mode: 'binaural', carrier: 300, beat: 6, higher: 'R', centering: 'sym', noiseType: 'pink', noiseDb: -12, duration: 20, fadeIn: 12, fadeOut: 12, volume: 0.55 },
    science: `<p>Theta-range beats appear in several relaxation and anxiety studies, but results are inconsistent ({{r:garcia2019}}). They do not seem to help performance: in one working-memory study the slower beats (5 and 10 Hz) did not improve accuracy and slightly lowered it, while 15 Hz improved it ({{r:beauchene2016}}); in a vigilance study theta/delta beats gave worse detection than beta beats ({{r:lane1998}}).</p>`,
    caveats: 'Expect relaxation, not alertness. Avoid during driving or tasks that need attention.',
    refs: ['garcia2019', 'beauchene2016', 'lane1998'],
  },
  {
    id: 'focus-beta16', name: 'Focus — Beta 16 Hz', goal: 'focus', evidence: 2, tags: ['attention', 'vigilance'],
    blurb: 'A 16 Hz beat under pink noise — the frequency range linked to better vigilance in lab studies.',
    cfg: { mode: 'binaural', carrier: 400, beat: 16, higher: 'R', centering: 'sym', noiseType: 'pink', noiseDb: -12, duration: 30, fadeIn: 10, fadeOut: 10, volume: 0.5 },
    science: `<p>In a 30-minute visual vigilance task (n = 29), beta-range beats (16 and 24 Hz) in pink noise gave more correct detections, fewer false alarms and a less negative mood than theta/delta beats (1.5 and 4 Hz) ({{r:lane1998}}). Another study found 15 Hz beats improved visuospatial working-memory accuracy, whereas 5 and 10 Hz did not ({{r:beauchene2016}}).</p>
      <p>But a later sustained-attention study pooling two experiments found rather strong evidence <i>against</i> a beta-beat benefit ({{r:sustained2022}}).</p>`,
    caveats: 'Net picture: a possible small, context-dependent effect — or none. Neither Lane 1998 nor most behavioural studies measured whether the brain actually followed the beat. Best treated as something to test on yourself (Experiments → Focus test).',
    refs: ['lane1998', 'beauchene2016', 'sustained2022'],
  },
  {
    id: 'gamma40-bin', name: 'Gamma 40 Hz — study-style binaural', goal: 'focus', evidence: 2, tags: ['attention', 'flexibility'],
    blurb: 'Replicates the 40 Hz binaural beats used in attention/flexibility experiments (≈340 Hz carrier).',
    cfg: { mode: 'binaural', carrier: 340, beat: 40, higher: 'R', centering: 'sym', noiseType: 'none', noiseDb: -14, duration: 10, fadeIn: 6, fadeOut: 6, volume: 0.5 },
    science: `<p>Short exposure to 40 Hz binaural beats (compared with a constant 340 Hz tone) increased cognitive flexibility in a dual-task experiment ({{r:hommel2016}}) and narrowed attentional focus in a global–local task ({{r:colzato2017}}). Another study found high-frequency beats eliminated the attentional blink only in people with a low spontaneous eye-blink rate, a rough marker of low dopamine — suggesting effects differ between individuals ({{r:reedijk2015}}).</p>`,
    caveats: 'These are small lab-task effects, not "genius mode". A 40 Hz beat sits at the edge of what binaural beats can convey (≈30 Hz limit), so many people hear two faint tones or roughness. A different Colzato 2017 paper on binaural beats was retracted, so check claims carefully.',
    refs: ['hommel2016', 'colzato2017', 'reedijk2015'],
  },
  {
    id: 'gamma40-iso', name: 'Gamma 40 Hz — isochronic pulses', goal: 'focus', evidence: 1, tags: ['40 Hz', 'pulses'],
    blurb: 'A single tone pulsed 40 times a second — a stronger physical 40 Hz stimulus than binaural.',
    cfg: { mode: 'isochronic', carrier: 340, beat: 40, pulse: 0.55, higher: 'R', centering: 'sym', noiseType: 'none', noiseDb: -14, duration: 10, fadeIn: 6, fadeOut: 6, volume: 0.45 },
    science: `<p>The cortex's 40 Hz auditory steady-state response is robust, long-established physiology ({{r:galambos1981}}): brain activity strongly follows pulses at about 40 Hz. That shows the brain <i>responds</i>; it does not show that a response improves attention or memory.</p>`,
    caveats: 'No trial I found shows cognitive benefit from isochronic 40 Hz. Pulsed tones can be unpleasant — start quiet.',
    refs: ['galambos1981'],
  },
  {
    id: 'creative-alpha', name: 'Creative drift — Alpha 10 Hz + brown noise', goal: 'creative', evidence: 1, tags: ['ideas', 'hypothesis'],
    blurb: 'A hypothesis, not a promise: alpha activity accompanies creative ideation. Test it with the Alternate Uses task.',
    cfg: { mode: 'binaural', carrier: 300, beat: 10, higher: 'R', centering: 'sym', noiseType: 'brown', noiseDb: -10, duration: 25, fadeIn: 10, fadeOut: 10, volume: 0.5 },
    science: `<p>EEG studies repeatedly find more alpha power during creative ideation ({{r:fink2014}}) — a correlation. I found no trial showing that binaural beats improve divergent thinking. The closest direct evidence is 40 Hz beats increasing cognitive flexibility ({{r:hommel2016}}).</p>
      <p>What <i>does</i> have evidence for creativity: a walk (about 60% more creative output in one study, {{r:oppezzo2014}}), sleep, and time away from screens.</p>`,
    caveats: 'Untested for creativity. Use Experiments → Creativity test (word-association + Alternate Uses) to find out whether it does anything for you.',
    refs: ['fink2014', 'hommel2016', 'oppezzo2014'],
  },
  {
    id: 'sleep-descent', name: 'Sleep descent — 10 → 3 Hz (30 min)', goal: 'sleep', evidence: 1, tags: ['sleep onset', 'ramp'],
    blurb: 'Starts relaxed-awake, glides through theta into delta, then fades. Low carrier, brown noise, quiet.',
    cfg: { mode: 'binaural', carrier: 200, beat: 10, higher: 'R', centering: 'sym', noiseType: 'brown', noiseDb: -8, volume: 0.42, fadeIn: 20, fadeOut: 45, duration: 30, useTimeline: true,
      timeline: [{ dur: 8, from: 10, to: 6, curve: 'smooth' }, { dur: 12, from: 6, to: 3, curve: 'smooth' }, { dur: 10, from: 3, to: 3, curve: 'linear' }] },
    blurb2: '',
    science: `<p>Small studies suggest slow beats around sleep may help: a pilot in 15 elite young soccer players using 2–8 Hz beats during sleep for eight weeks reported better sleep and morning alertness versus an unstimulated group ({{r:abeln2014}}); a blinded study of 24 people found a 3 Hz beat started at the onset of light sleep increased deep (N3) sleep and brought it earlier ({{r:jirak2018}}). A small trial in students with insomnia also reported improved scores with combined alpha/theta/delta beats.</p>`,
    caveats: 'Samples are small, mostly unreplicated, and some outcomes are self-reported. Headphones in bed can be uncomfortable — keep volume low. The ramp shape here is a sensible design, not a proven recipe.',
    refs: ['abeln2014', 'jirak2018'],
  },
  {
    id: 'wake-ramp', name: 'Gentle wake — 4 → 14 Hz (8 min)', goal: 'sleep', evidence: 0, tags: ['design idea'],
    blurb: 'A rising ramp meant for easing out of a nap. A design idea — untested.',
    cfg: { mode: 'binaural', carrier: 300, beat: 4, higher: 'R', centering: 'sym', noiseType: 'pink', noiseDb: -14, volume: 0.45, fadeIn: 20, fadeOut: 20, duration: 8, useTimeline: true,
      timeline: [{ dur: 2, from: 4, to: 4, curve: 'linear' }, { dur: 6, from: 4, to: 14, curve: 'smooth' }] },
    science: `<p>Beta-range beats were associated with better vigilance than theta/delta beats in one study ({{r:lane1998}}), which motivates a rising ramp. But no trial tests a wake-up ramp, so this is a design hypothesis.</p>`,
    caveats: 'Unproven. A normal alarm will always be more reliable.',
    refs: ['lane1998'],
  },
  {
    id: 'meditate-theta', name: 'Meditation — Theta 6 Hz', goal: 'meditate', evidence: 1, tags: ['open focus', 'breath'],
    blurb: 'A calm theta beat with soft noise as a backdrop for breath or open-monitoring meditation.',
    cfg: { mode: 'binaural', carrier: 250, beat: 6, higher: 'R', centering: 'sym', noiseType: 'pink', noiseDb: -12, duration: 20, fadeIn: 15, fadeOut: 15, volume: 0.5 },
    science: `<p>Meditation is commonly accompanied by increased frontal-midline theta in EEG studies — a correlation. Binaural theta beats are widely marketed as meditation aids; I found no trial showing they deepen meditation beyond the effect of quiet sound and expectation.</p>`,
    caveats: 'It may still be pleasant and useful as a cue to sit down and breathe — that alone has real benefits.',
    refs: [],
  },
  {
    id: 'monroe-focus10', name: 'Gateway-style "Focus 10" (approximation)', goal: 'explore', evidence: 0, flag: 'Unverified', tags: ['Hemi-Sync', 'Army paper'],
    blurb: 'A rough stand-in for the Gateway tapes discussed in the 1983 Army paper. The real signals are proprietary.',
    cfg: { mode: 'binaural', carrier: 200, beat: 10, higher: 'R', centering: 'sym', noiseType: 'pink', noiseDb: -8, volume: 0.45, fadeIn: 20, fadeOut: 20, duration: 30, useTimeline: true,
      timeline: [{ dur: 8, from: 10, to: 4, curve: 'smooth' }, { dur: 22, from: 4, to: 4, curve: 'linear' }] },
    science: `<p>Hemi-Sync recordings are proprietary, so this preset is only an approximation (theta beat, pink noise, gradual descent). It exists so you can run the experiments suggested in the 1983 Army paper on yourself, blinded ({{r:mcdonnell1983}}).</p>
      <p>Peer-reviewed work on Hemi-Sync is limited to small pilots; I found no large, independent, controlled trials. Claims about leaving the body, time travel or "remote viewing" have no independent supporting evidence; the 1995 review that preceded the end of the US remote-viewing program found no demonstrated intelligence value ({{r:air1995}}).</p>`,
    caveats: 'Altered-state practices can be unsettling. If you notice worsening anxiety, strange experiences or disrupted sleep, stop and talk with a clinician.',
    refs: ['mcdonnell1983', 'air1995'],
  },
  {
    id: 'schumann-783', name: 'Schumann 7.83 Hz (folklore)', goal: 'explore', evidence: 0, flag: 'Folklore', tags: ['test it blind'],
    blurb: 'The "Earth\'s heartbeat" beat. Included so you can test the claim blind — not because it\'s supported.',
    cfg: { mode: 'binaural', carrier: 300, beat: 7.83, higher: 'R', centering: 'sym', noiseType: 'none', noiseDb: -14, duration: 15, fadeIn: 8, fadeOut: 8, volume: 0.5 },
    science: `<p>The Schumann resonance is real physics: lightning excites standing electromagnetic waves in the Earth–ionosphere cavity, with a fundamental near 7.83 Hz. But the signal is extremely weak by the time it reaches you, and I found no solid evidence that human brains entrain to it or that "Schumann generators" help health or cognition. A 7.83 Hz <i>audio</i> beat has nothing to do with the electromagnetic one.</p>`,
    caveats: 'Marketing claims here borrow real physics to sell unproven benefits.',
    refs: [],
  },
  {
    id: 'hype-528', name: '"528 Hz miracle tone" (folklore)', goal: 'explore', evidence: 0, flag: 'Folklore', tags: ['solfeggio', 'test it blind'],
    blurb: 'A plain 528 Hz tone — the "DNA repair" note. Pair it with a 500 Hz tone in a blinded test.',
    cfg: { mode: 'control', carrier: 528, beat: 0, noiseType: 'none', duration: 10, fadeIn: 6, fadeOut: 6, volume: 0.5 },
    science: `<p>"Solfeggio frequencies" (396, 417, 528 Hz…) are claimed to heal tissue or repair DNA. The medieval syllables ut–re–mi–fa–sol–la are real; the specific frequency list and the healing claims are a modern invention, and I found no credible trials supporting them.</p>`,
    caveats: 'There is nothing special about 528 Hz compared with 500 Hz — you can verify that yourself with the "Hype check" experiment.',
    refs: [],
  },
  {
    id: 'hype-500', name: 'Plain 500 Hz tone', goal: 'control', evidence: 0, hidden: true, tags: ['control'],
    blurb: 'Comparison tone for the 528 Hz hype check.',
    cfg: { mode: 'control', carrier: 500, beat: 0, noiseType: 'none', duration: 10, fadeIn: 6, fadeOut: 6, volume: 0.5 },
    science: '<p>A neutral reference tone.</p>', caveats: '', refs: [],
  },
  {
    id: 'ctl-tone', name: 'Control — matched tone (no beat)', goal: 'control', evidence: 0, tags: ['control'],
    blurb: 'Same carrier and loudness as the beat presets, but no beat. The standard control used in studies.',
    cfg: { mode: 'control', carrier: 400, beat: 0, noiseType: 'pink', noiseDb: -14, duration: 20, fadeIn: 12, fadeOut: 12, volume: 0.55 },
    science: `<p>Good experiments compare a beat with the <i>same</i> sound minus the beat, e.g. a constant 340 Hz tone as a control in the 40 Hz studies ({{r:hommel2016}}). This preset is RMS-matched to the Lamplighter Project's beat presets so loudness can't explain a difference.</p>`,
    caveats: 'You may be able to hear that there is no wobble, which can unblind you. The "Can I hear it?" test measures how well.',
    refs: ['hommel2016'],
  },
  {
    id: 'ctl-noise', name: 'Control — noise only', goal: 'control', evidence: 0, tags: ['control'],
    blurb: 'Pink noise with no tones. A comparison for "is it the beat or just the soothing sound?"',
    cfg: { mode: 'noise', carrier: 400, beat: 0, noiseType: 'pink', noiseDb: 0, duration: 20, fadeIn: 12, fadeOut: 12, volume: 0.5 },
    science: `<p>In the surgery trial, the same soundtrack without beats still reduced anxiety by about 11% — a reminder that the sound itself matters ({{r:padmanabhan2005}}).</p>`,
    caveats: 'Clearly different from a tone, so participants will know which condition they are in.', refs: ['padmanabhan2005'],
  },
];
const presetById = (id) => PRESETS.find((p) => p.id === id) || (store.get('presets', []).find((p) => p.id === id));
const allPresets = () => PRESETS.filter((p) => !p.hidden).concat(store.get('presets', []).map((p) => Object.assign({ goal: 'mine', evidence: 0, mine: true, science: '<p>Your own preset.</p>', caveats: '', refs: [] }, p)));
