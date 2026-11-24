/* ═══════════════════════════ 23 · meditation data: practices, guidance scripts, pacer, re-entry plan ═══════════════════════════
   Everything here is pure data / pure functions (unit-tested in tests/meditation.test.js). */

REFS.goyal2014 = { short: 'Goyal 2014', full: 'Goyal M, Singh S, Sibinga EMS, et al. Meditation programs for psychological stress and well-being: a systematic review and meta-analysis. JAMA Internal Medicine 2014;174(3):357–372. (47 trials, 3,515 people: moderate evidence for anxiety, depression and pain, effects small-to-moderate; low or insufficient evidence for attention, sleep and positive mood.)', url: 'https://doi.org/10.1001/jamainternmed.2013.13018' };
REFS.basso2019 = { short: 'Basso 2019', full: 'Basso JC, McHale A, Ende V, Oberlin DJ, Suzuki WA. Brief, daily meditation enhances attention, memory, mood, and emotional regulation in non-experienced meditators. Behavioural Brain Research 2019;356:208–220. (13 minutes a day vs a podcast control, 42 people: benefits at 8 weeks but not at 4.)', url: 'https://pubmed.ncbi.nlm.nih.gov/30153464/' };
REFS.balban2023 = { short: 'Balban 2023', full: 'Balban MY, Neri E, Kogon MM, et al. Brief structured respiration practices enhance mood and reduce physiological arousal. Cell Reports Medicine 2023;4:100895. (5 minutes a day for a month; exhale-focused “cyclic sighing” improved mood and lowered breathing rate more than mindfulness meditation; a single trial.)', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9873947' };
REFS.farias2020 = { short: 'Farias 2020', full: 'Farias M, Maraldi E, Wallenkampf KC, Lucchetti G. Adverse events in meditation practices and meditation-based therapies: a systematic review. Acta Psychiatrica Scandinavica 2020;142:374–393. (Pooled prevalence 8.3%: 3.7% in trials, 33.2% in observational studies; anxiety and depression most common.)', url: 'https://pureportal.coventry.ac.uk/en/publications/adverse-events-in-meditation-practices-and-meditation-based-thera/' };
REFS.lindahl2017 = { short: 'Lindahl 2017', full: 'Lindahl JR, Fisher NE, Cooper DJ, Rosen RK, Britton WB. The varieties of contemplative experience: a mixed-methods study of meditation-related challenges in Western Buddhists. PLOS ONE 2017;12(5):e0176239.', url: '' };
REFS.lutz2008 = { short: 'Lutz 2008', full: 'Lutz A, Slagter HA, Dunne JD, Davidson RJ. Attention regulation and monitoring in meditation. Trends in Cognitive Sciences 2008;12:163–169.', url: '' };
REFS.nidra2026 = { short: 'Yoga nidra meta-analysis', full: 'Effects of Yoga Nidra on stress, anxiety, and depression: a systematic review and meta-analysis (73 studies, 5,201 people). Evidence for sleep is thinner; most of it concerns structured yoga nidra, not any short audio labelled “NSDR”.', url: 'https://pubmed.ncbi.nlm.nih.gov/41327816/' };

/* ───────────── practices ───────────── */
const PRACTICES = [
  { id: 'breath', name: 'Breath anchor', icon: 'wave', evidence: 3, mins: [3, 5, 10, 20, 30], def: 5,
    blurb: 'The foundation. Rest attention on the breath; each time you notice it has wandered and come back is one repetition.',
    posture: 'Sit upright but relaxed — a chair is perfect. Hands resting. Eyes closed, or softly open and resting downward.',
    science: 'Mindfulness programs show small-to-moderate benefits for anxiety, depression and pain ({{r:goyal2014}}). The core skill — noticing that attention has wandered and returning — is the trainable part ({{r:lutz2008}}).',
    refs: ['goyal2014', 'lutz2008', 'basso2019'] },
  { id: 'slow', name: 'Slow breathing', icon: 'heart', evidence: 1, mins: [3, 5, 10], def: 5, pacer: true,
    blurb: 'Follow a gentle circle that grows and shrinks. Longer exhales settle the body quickly — a good choice when your mind is too busy to sit.',
    posture: 'Sit comfortably with your eyes on the screen. Breathe through the nose if you can, and keep it easy — never strain.',
    science: 'In one trial, five minutes a day of exhale-focused “cyclic sighing” improved mood and lowered breathing rate more than mindfulness meditation over a month ({{r:balban2023}}). It is a single trial, so treat it as promising.',
    refs: ['balban2023'] },
  { id: 'body', name: 'Body scan', icon: 'ear', evidence: 3, mins: [5, 10, 20], def: 10,
    blurb: 'Move attention slowly through the body, noticing sensations without trying to change them. Good for restlessness and for coming back into the body.',
    posture: 'Sit or lie down — whichever you can stay comfortable in. You can skip any area that feels uncomfortable to attend to.',
    science: 'The body scan is a core part of mindfulness-based programs, whose benefits are summarised in {{r:goyal2014}}.',
    refs: ['goyal2014'] },
  { id: 'open', name: 'Open awareness', icon: 'sun', evidence: 2, mins: [10, 20, 30], def: 10,
    blurb: 'After settling with the breath, let attention widen to sounds, sensations and thoughts as they come and go. Best once the breath anchor feels familiar.',
    posture: 'Sit upright, eyes closed or softly open. If anything becomes overwhelming, you can return to the breath or the feeling of your feet — or stop.',
    science: '“Open monitoring” is studied less than focused attention, and it can stir up more difficult experiences in some people ({{r:farias2020}}). Keep it for when the breath anchor feels steady.',
    refs: ['lutz2008', 'farias2020'] },
  { id: 'metta', name: 'Loving-kindness', icon: 'heart', evidence: 1, mins: [5, 10], def: 5,
    blurb: 'Silently offer wishes of safety and ease — to yourself, someone you care about, then everyone. A warm practice when meditation has felt dry or hard.',
    posture: 'Sit comfortably. If the phrases feel flat, that is fine — the intention matters more than the feeling.',
    science: 'Evidence for loving-kindness is smaller and more mixed than for breath-based mindfulness; I did not find strong trials, so treat it as a gentle, optional practice.',
    refs: [] },
  { id: 'rest', name: 'Deep rest (lying down)', icon: 'moon', evidence: 1, mins: [10, 20], def: 10,
    blurb: 'A guided body journey followed by long, quiet rest — the “yoga nidra / NSDR” style. The nearest thing here to a deep, effortless state.',
    posture: 'Lie on your back with support under your head and knees. You may get sleepy — don’t drive straight afterwards.',
    science: 'A recent meta-analysis found benefits for stress, anxiety and depression, with thinner evidence for sleep ({{r:nidra2026}}). Most of it concerns structured yoga nidra rather than any short audio.',
    refs: ['nidra2026'] },
  { id: 'ground', name: 'Ground (2½ min)', icon: 'shield', evidence: 0, mins: [2.5], def: 2.5, fixed: true,
    blurb: 'For when you feel anxious, spacey or overwhelmed. Feet on the floor, five senses, back to the room.',
    posture: 'Sit with both feet on the floor. Eyes open is best.',
    science: 'Sensory grounding (the “5-4-3-2-1” exercise) is widely used by clinicians. I did not find good trials, so I class it as unproven — but it is low-risk and a sensible thing to reach for.',
    refs: [] },
];
const practiceById = (id) => PRACTICES.find((p) => p.id === id) || (typeof pathAsPractice === 'function' ? pathAsPractice(id) : undefined);

/* ───────────── guidance scripts ───────────── */
const BREATH_REMINDERS = [
  'If your mind has wandered, that’s completely normal. Notice it, and gently come back to the breath.',
  'Coming back is the practice. Each return is one repetition.',
  'You don’t have to stop thoughts. Let them pass, and return to the breath.',
  'If you’ve lost count, simply begin again at one.',
  'Soften your face, your jaw, your hands.',
  'Just this breath.',
  'Be kind to yourself. Wandering is part of it.',
];
const gapFor = (T) => (T <= 240 ? 42 : T <= 600 ? 75 : T <= 1200 ? 120 : 170);

/* returns [{t (seconds from start), text}] sorted, all inside [0, T) with ≥ 8 s between cues */
function buildCues(id, minutes, word) {
  if (!PRACTICES.some((p) => p.id === id) && typeof pathPracticeById === 'function' && pathPracticeById(id)) return buildPathCues(id, minutes, word); // Path practices have their own scripts
  const T = Math.round(minutes * 60); let c = [];
  const add = (t, text) => { t = Math.round(t); if (t >= 0 && t < T - 2) c.push({ t, text }); };
  const remind = (from, to, gap, pool, start = 0) => { let i = start; for (let t = from; t <= to; t += gap) add(t, pool[i++ % pool.length]); };
  const tail = (a, b, ta, tb) => { add(T - ta, a); add(T - tb, b); };
  switch (id) {
    case 'breath': {
      const short = T <= 240;
      add(3, 'Let yourself arrive. Settle into a position you can hold at ease. Close your eyes, or rest your gaze softly downward.');
      add(short ? 18 : 24, 'Take one slow breath in… and let it go. Let your shoulders soften.');
      if (short) add(36, 'Now let the breath find its own rhythm. Rest your attention wherever you feel it most.');
      else { add(48, 'Now let the breath find its own rhythm. You don’t need to change it. Notice where you feel it most — the nostrils, the chest, or the belly.'); add(86, 'Rest your attention there. If it helps, silently count each out-breath from one up to ten, then begin again.'); }
      remind(short ? 70 : 135, T - 75, gapFor(T), BREATH_REMINDERS);
      tail('In a moment this sit will end. Let go of the counting, and let your attention widen to the whole body, breathing.', 'When you’re ready, open your eyes. Notice how you feel — without needing it to be any particular way.', short ? 34 : 48, 12);
      break;
    }
    case 'slow': {
      add(3, 'Breathe with the circle: in as it grows, out as it shrinks. Through the nose if you can, and keep it easy — never strain.');
      add(50, 'Let each out-breath be soft and unhurried.');
      remind(110, T - 55, T <= 300 ? 70 : 110, ['If you feel light-headed, return to your natural breathing.', 'Let your shoulders drop on every exhale.', 'Stay with the circle. Nothing else to do.']);
      tail('Let the circle go, and let your breathing return to normal.', 'Notice how you feel.', 25, 8);
      break;
    }
    case 'body': {
      const regions = [
        [0.06, 'Lie or sit comfortably and let your body be supported. Take a few slow breaths, and feel the places where you touch the chair, floor or bed.'],
        [0.11, 'Bring your attention to your feet. Notice whatever is there — warmth, coolness, pressure, tingling, or nothing at all. Whatever you find is fine.'],
        [0.11, 'Move up through your ankles, calves, knees and thighs. Let each part be heavy and held.'],
        [0.09, 'Notice your hips and lower back. Let the muscles there soften, as much as they’re willing to.'],
        [0.11, 'Bring attention to your belly and chest. Feel them rise and fall with the breath. There is nothing to fix.'],
        [0.10, 'Now your hands and arms. Notice your fingers, palms, wrists, elbows and shoulders.'],
        [0.09, 'Notice your neck and the back of your head. Let your shoulders drop away from your ears a little.'],
        [0.11, 'Bring attention to your face: jaw, cheeks, eyes, forehead. Let the whole face soften.'],
        [0.15, 'Now feel your whole body at once — breathing, resting, held. If your mind wanders, gently come back to the sensations.'],
        [0.07, 'In a moment this practice will end. Take a deeper breath, move your fingers and toes, and when you’re ready, open your eyes.'],
      ];
      let acc = 0; regions.forEach(([w, text], i) => { add(i === 0 ? 3 : i === regions.length - 1 ? T - Math.min(50, 0.07 * T) : acc * T, text); acc += w; });
      add(Math.min(50, 0.14 * T), 'If any area is uncomfortable to attend to, skip it — or rest your attention on your breath, or on the places your body touches the surface.');
      add(0.5 * T + 20, 'If your mind wanders, that’s fine. Just come back to the sensations.');
      add(0.8 * T, 'Let your attention rest wherever it wants to, with nothing to fix.');
      break;
    }
    case 'open': {
      add(3, 'Let yourself arrive. Settle, and close your eyes or rest your gaze softly.');
      add(0.05 * T + 14, 'Rest your attention on the breath. Let the body settle.');
      add(0.30 * T, 'Now let your attention widen. Notice sounds — near and far, loud and soft. Let them come and go without following them.');
      add(0.50 * T, 'Include the sensations of your body — weight, warmth, small movements, the breath — all arising and passing.');
      add(0.65 * T, 'Now let thoughts and feelings be part of the field. Watch them rise and pass, like clouds crossing a sky. You’re not pushing them away, and you’re not following them.');
      add(0.76 * T, 'If you get pulled into a story, silently note “thinking”, and come back to open awareness.');
      add(0.82 * T, 'If anything feels overwhelming, return to the breath or the feeling of your feet. You can stop at any time.');
      tail('In a moment this sit will end. Come back to the breath.', 'When you’re ready, open your eyes. Notice how you feel.', 0.08 * T, 12);
      break;
    }
    case 'metta': {
      add(3, 'Settle, and let the breath be easy. If the phrases ahead feel flat or forced, that’s fine. The intention matters more than the feeling.');
      add(0.14 * T, 'Bring to mind yourself, just as you are right now. Silently offer: may I be safe. May I be well. May I be at ease.');
      remind(0.14 * T + 30, 0.40 * T, 36, ['May I be safe. May I be well. May I be at ease.', 'Let the words be gentle. Say them kindly, as you would to a friend.']);
      add(0.42 * T, 'Now bring to mind someone you care about. Silently offer: may you be safe. May you be well. May you be at ease.');
      remind(0.42 * T + 30, 0.64 * T, 36, ['May you be safe. May you be well. May you be at ease.']);
      add(0.67 * T, 'Now widen your care to everyone — all beings, near and far. May all beings be safe. May all beings be well. May all beings be at ease.');
      remind(0.67 * T + 32, 0.86 * T, 40, ['May all beings be safe. May all beings be well. May all beings be at ease.']);
      tail('Let the phrases go, and rest in whatever you feel.', 'When you’re ready, open your eyes.', 0.07 * T, 10);
      break;
    }
    case 'rest': {
      add(3, 'Lie on your back, with your head and knees supported if you like. Let your eyes close, or rest soft. Let the floor or bed hold you.');
      add(28, 'There is nothing to achieve. Take three slow breaths, letting each out-breath be longer than the in-breath.');
      ['Feet.', 'Legs.', 'Hips and lower back.', 'Belly.', 'Chest.', 'Hands.', 'Arms.', 'Shoulders and neck.', 'Face.', 'The whole body, resting.'].forEach((s, i) => add(72 + i * 11, s));
      add(0.34 * T + 40, 'Let your body be heavy. Let the breath breathe itself.');
      add(0.55 * T, 'If thoughts drift by, let them. If you drift towards sleep, that’s okay.');
      add(0.74 * T, 'Nothing to do. Just rest.');
      tail('Slowly begin to deepen your breath. Let some movement come into your fingers and toes.', 'Take your time. Roll onto your side if you like, and come up slowly. Notice how you feel.', 70, 24);
      break;
    }
    case 'ground': {
      [[3, 'You’re okay. Let’s come back to the room. Feel your feet on the floor, and press them down gently.'], [22, 'Look around you. Name five things you can see.'], [48, 'Notice four things you can feel — your clothes, the chair, the air on your skin, your feet.'], [74, 'Listen for three sounds, near or far.'], [96, 'Notice two things you can smell — or two you like the smell of.'], [114, 'And one thing you can taste.'], [128, 'Now take one slow breath in, and a longer one out.'], [140, 'You are here, in this room, right now. Take your time.']].forEach(([t, s]) => add(t, s));
      break;
    }
    default: break;
  }
  c = c.sort((a, b) => a.t - b.t);
  // leave room for each cue to be spoken (≈2 words/s + 3 s) — a later cue slides right, or is dropped if it would run past the end
  const need = (s) => Math.max(8, Math.ceil(s.split(/\s+/).length / 2.0) + 3);
  const out = []; c.forEach((q) => { const last = out[out.length - 1]; const t = last && q.t < last.t + need(last.text) ? last.t + need(last.text) : q.t; if (t < T - 2) out.push({ t, text: q.text }); });
  return out;
}

/* ───────────── breath pacer ───────────── */
const PACERS = {
  slow: { name: 'Slow · 5.5 in / 5.5 out', steps: [{ k: 'in', label: 'Breathe in', dur: 5.5, to: 1 }, { k: 'out', label: 'Breathe out', dur: 5.5, to: 0.25 }] },
  calm: { name: 'Calming · 4 in / 6 out', steps: [{ k: 'in', label: 'Breathe in', dur: 4, to: 1 }, { k: 'out', label: 'Breathe out', dur: 6, to: 0.25 }] },
  sigh: { name: 'Cyclic sigh · in, in again, long out', steps: [{ k: 'in', label: 'Breathe in', dur: 2.6, to: 0.8 }, { k: 'in2', label: 'In again', dur: 1.4, to: 1 }, { k: 'out', label: 'Long breath out', dur: 6.5, to: 0.25 }] },
};
function pacerAt(pat, t) { // → { label, r (0.25…1), phase (0…1 within step), breathsPerMin }
  const steps = pat.steps; const cyc = steps.reduce((a, s) => a + s.dur, 0); let u = ((t % cyc) + cyc) % cyc;
  for (let i = 0; i < steps.length; i++) {
    const s = steps[i];
    if (u < s.dur || i === steps.length - 1) { const from = steps[(i + steps.length - 1) % steps.length].to; const p = Math.min(1, u / s.dur); const e = 0.5 - 0.5 * Math.cos(Math.PI * p); return { label: s.label, r: from + (s.to - from) * e, phase: p, bpm: 60 / cyc }; }
    u -= s.dur;
  }
}

/* ───────────── a gentle way back: 14 steps, advanced by completed sits (not by calendar days) ───────────── */
const PLAN = [
  { min: 3, practice: 'breath', note: 'Three minutes. That is all. Just show up — showing up is the practice.' },
  { min: 3, practice: 'breath', note: 'Count breaths from one to ten. When you lose count, start again — no penalty.' },
  { min: 3, practice: 'slow', note: 'Let the circle do the work. Slow, easy breathing.' },
  { min: 5, practice: 'breath', note: 'A little longer. Expect the mind to wander. That’s the exercise.' },
  { min: 5, practice: 'body', note: 'A short body scan. Skip anything uncomfortable.' },
  { min: 5, practice: 'breath', note: 'Same anchor, a bit more settled each time.' },
  { min: 5, practice: 'metta', note: 'A warmer practice. Phrases can feel flat; that’s fine.' },
  { min: 10, practice: 'breath', note: 'Ten minutes. Eight weeks of about this much is what the brief-practice study used.' },
  { min: 10, practice: 'body', note: 'Body scan, ten minutes.' },
  { min: 10, practice: 'breath', note: 'Notice how much sooner you catch a wandering mind.' },
  { min: 10, practice: 'slow', note: 'Slow breathing again. Compare how you feel to step 3.' },
  { min: 10, practice: 'open', note: 'A first taste of open awareness. Return to the breath if it feels too much.' },
  { min: 10, practice: 'breath', note: 'Back to the anchor. Familiar now.' },
  { min: 12, practice: 'breath', note: 'Twelve minutes. You’re back. From here, choose your own — and keep it small and regular.' },
];

/* ───────────── when it’s not working ───────────── */
const MED_TROUBLE = [
  ['“I’ve lost my touch.”', 'Almost everyone who stops and restarts feels this. The first sits back are messy — that’s normal, not evidence you’ve lost anything. Treat yourself as a beginner for two weeks (use the 14-step way back), keep sits short, and measure success by <i>sitting</i>, not by how it felt. Benefits in a brief-practice trial took about 8 weeks of ~13 minutes a day to show ({{r:basso2019}}) — so patience is part of the method.'],
  ['“My mind won’t stop.”', 'That’s the material, not the failure. The skill is <b>noticing</b> that you’ve wandered and <b>returning</b> — every return is a repetition ({{r:lutz2008}}). Try counting out-breaths 1–10, or silently note “thinking” and come back. If it’s really loud, use Slow breathing or a body scan instead.'],
  ['“I keep falling asleep.”', 'Sit upright (a chair is fine), keep your eyes softly open, sit earlier in the day, cool the room, or shorten the sit. If you’re simply tired, sleeping is a fine use of the time — try again tomorrow.'],
  ['“I’m restless — I can’t sit still.”', 'Try a body scan, a longer exhale (Slow breathing), or a few minutes of mindful walking first. Shorter sits (3 minutes) are completely valid.'],
  ['“Nothing is happening.”', 'Chasing special states is the usual trap. “Deep” in practice means <i>steadier and kinder</i>: you catch wandering sooner, you settle faster, you feel a bit calmer afterwards. Dramatic experiences are not the goal and are not a sign of progress.'],
  ['“It brings up difficult feelings or strange experiences.”', 'This happens to some people: in reviews, anxiety and low mood are the most common difficulties, around 8% in trials and more in surveys ({{r:farias2020}}, {{r:lindahl2017}}). Open your eyes, feel your feet, use Ground, shorten or stop. If it keeps happening, or you feel detached from reality, panicky or unsafe, pause meditation and talk with a doctor or therapist who knows meditation.'],
  ['“How do I make it a habit?”', 'Attach it to something you already do — after your morning drink, or right after brushing your teeth — and keep the sit tiny (3–5 minutes). Same place, same time. Missing a day is fine; just do the next sit.'],
];

if (typeof module !== 'undefined' && module.exports) module.exports = { buildCues, pacerAt, PACERS, PLAN, PRACTICES };
