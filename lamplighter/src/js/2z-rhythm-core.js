/* ═══════════════════════════ 2z · Rhythm patterns: notated, scheduled, and described without a speaker ═══════════════════════════
   Four rhythm cycles that people have written down and that are in living use in worship music: the West African “standard” bell pattern (carried to Cuba, Haiti and Brazil), and three Indian
   cycles (tala): Teental (16 beats), Jhaptal (10) and Adi tala (8). The page plays them on the app’s own synthesised sounds as a plain stand-in; it does not imitate a tabla, a bell or a drum,
   and it plays no song, chant or sacred drum rhythm of any tradition, only the public framework a drummer counts by.
   Everything here is pure (no audio, no document), so tests can check the patterns, the timing and the description. The player in 6zt-sound.js turns these strokes into sound.
   pattern: { id, name, where, pulses, unit (what a pulse is called), ppm: [default, min, max] (pulses per minute), strokes: [ { k: kind, bol?, mark? } × pulses ], groups: [lengths], guide?: [pulses of a quiet counting beat], source }
   kinds: sam (the first beat of a cycle, where it lands) · tali (a clap beat) · khali (an “empty” beat, a wave) · beat (an ordinary beat) · bell (a bell stroke) · rest (silence) */
const RH_KINDS = { sam: 'the first beat, where the cycle lands', tali: 'a clap', khali: 'an empty beat (a wave of the hand)', beat: 'an ordinary beat', bell: 'a bell stroke', rest: 'silence' };
const rhStrokes = (spec) => spec.map((s) => (typeof s === 'string' ? { k: s } : s));
const RHYTHMS = [
  { id: 'bell', name: 'The standard bell pattern', where: 'West Africa, and the Afro-Atlantic religions of Cuba, Haiti and Brazil', unit: 'pulse', pulses: 12, ppm: [300, 120, 480], groups: [2, 2, 1, 2, 2, 2, 1], guide: [1, 4, 7, 10],
    strokes: rhStrokes(['bell', 'rest', 'bell', 'rest', 'bell', 'bell', 'rest', 'bell', 'rest', 'bell', 'rest', 'bell']),
    how: 'Seven strokes over twelve pulses: the gaps between strokes are 2, 2, 1, 2, 2, 2 and 1 pulses. A drummer plays other parts against it and counts from it. The quiet counting beat added here (on pulses 1, 4, 7 and 10) is for the listener, not part of the pattern.',
    source: 'A. M. Jones, Studies in African Music (1959), who is cited for the “standard pattern”; Godfried Toussaint’s analysis as 2-2-1-2-2-2-1; Kofi Agawu’s discussion (2006).' },
  { id: 'teental', name: 'Teental (Tintal)', where: 'North Indian music: classical, devotional and temple singing', unit: 'beat', pulses: 16, ppm: [80, 40, 200], groups: [4, 4, 4, 4], bols: 'Dha Dhin Dhin Dha | Dha Dhin Dhin Dha | Dha Tin Tin Ta | Ta Dhin Dhin Dha',
    strokes: rhStrokes([{ k: 'sam', bol: 'Dha', mark: '×' }, { k: 'beat', bol: 'Dhin' }, { k: 'beat', bol: 'Dhin' }, { k: 'beat', bol: 'Dha' }, { k: 'tali', bol: 'Dha', mark: '2' }, { k: 'beat', bol: 'Dhin' }, { k: 'beat', bol: 'Dhin' }, { k: 'beat', bol: 'Dha' },
      { k: 'khali', bol: 'Dha', mark: '0' }, { k: 'beat', bol: 'Tin' }, { k: 'beat', bol: 'Tin' }, { k: 'beat', bol: 'Ta' }, { k: 'tali', bol: 'Ta', mark: '3' }, { k: 'beat', bol: 'Dhin' }, { k: 'beat', bol: 'Dhin' }, { k: 'beat', bol: 'Dha' }]),
    how: 'Sixteen beats in four bars of four. The cycle lands on beat 1 (sam, marked ×), claps on 5 and 13, and has an empty beat, a wave of the hand, on 9. The spoken syllables (bols) are the strokes of the tabla; the empty beat is played without the deep drum, so it sounds thinner.',
    source: 'The standard theka as taught and written down in North Indian music teaching, confirmed in the reference sources used for this page (Wikipedia on Teental, tabla teaching pages).' },
  { id: 'jhaptal', name: 'Jhaptal', where: 'North Indian music: classical, devotional and temple singing', unit: 'beat', pulses: 10, ppm: [90, 40, 200], groups: [2, 3, 2, 3], bols: 'Dhi Na | Dhi Dhi Na | Ti Na | Dhi Dhi Na',
    strokes: rhStrokes([{ k: 'sam', bol: 'Dhi', mark: '×' }, { k: 'beat', bol: 'Na' }, { k: 'tali', bol: 'Dhi', mark: '2' }, { k: 'beat', bol: 'Dhi' }, { k: 'beat', bol: 'Na' }, { k: 'khali', bol: 'Ti', mark: '0' }, { k: 'beat', bol: 'Na' }, { k: 'tali', bol: 'Dhi', mark: '3' }, { k: 'beat', bol: 'Dhi' }, { k: 'beat', bol: 'Na' }]),
    how: 'Ten beats in groups of 2, 3, 2 and 3, so the feel is uneven and keeps tipping forward. Claps fall on 1, 3 and 8 and the wave on 6.',
    source: 'The standard theka in North Indian music teaching; the 2-3-2-3 grouping and the claps on 1, 3 and 8 with the wave on 6 are given in several teaching sources.' },
  { id: 'adi', name: 'Adi tala', where: 'South Indian (Carnatic) music: classical and devotional', unit: 'beat', pulses: 8, ppm: [100, 50, 200], groups: [4, 2, 2],
    strokes: rhStrokes([{ k: 'sam', mark: 'clap' }, { k: 'beat', mark: 'finger 1' }, { k: 'beat', mark: 'finger 2' }, { k: 'beat', mark: 'finger 3' }, { k: 'tali', mark: 'clap' }, { k: 'beat', mark: 'wave' }, { k: 'tali', mark: 'clap' }, { k: 'beat', mark: 'wave' }]),
    how: 'Eight beats counted with the hand: a clap and three finger counts, then a clap and a wave, then a clap and a wave. It is the most widely used cycle in Carnatic music. Here every beat is sounded, the waves softly.',
    source: 'Standard in Carnatic music teaching (one clap and three finger counts, then two clap-and-wave pairs).' },
];
const RHYTHM_BY_ID = Object.setPrototypeOf(Object.fromEntries(RHYTHMS.map((r) => [r.id, r])), null);

/* the stand-in sounds: plain recipes for the app’s own synth, never a copy of a real instrument. type: 'drum' (a falling sine), 'wood' (a short triangle tick that drops a little in pitch), 'bell' (two inharmonic sine partials) */
const RH_VOICES = {
  sam: { type: 'drum', f0: 150, f1: 62, dur: 0.34, level: 1.0 },
  tali: { type: 'drum', f0: 210, f1: 100, dur: 0.2, level: 0.78 },
  khali: { type: 'wood', f: 1800, dur: 0.07, level: 0.5 },
  beat: { type: 'wood', f: 1000, dur: 0.06, level: 0.45 },
  bell: { type: 'bell', f: 880, ratio: 1.504, dur: 0.22, level: 0.7 },
  guide: { type: 'wood', f: 600, dur: 0.045, level: 0.22 },
};

/* the stroke that sounds on pulse number n (0, 1, 2 … counted from the first pulse of the first cycle), or null for a rest */
function rhythmStrokeAt(r, n, guide) {
  const p = ((n % r.pulses) + r.pulses) % r.pulses; const s = r.strokes[p]; const out = [];
  if (s.k !== 'rest') out.push({ kind: s.k, bol: s.bol || '', mark: s.mark || '' });
  if (guide && r.guide && r.guide.includes(p + 1)) out.push({ kind: 'guide', bol: '', mark: '' });
  return out.map((o) => Object.assign({ pulse: p + 1, n, cycle: Math.floor(n / r.pulses) }, o));
}
/* every stroke that falls in [t0, t1) seconds when the first pulse is at time 0 and the speed is ppm pulses a minute */
function rhythmEvents(r, ppm, t0, t1, guide) {
  const dt = 60 / ppm; const out = []; const n0 = Math.max(0, Math.ceil(t0 / dt - 1e-9)); const n1 = Math.ceil(t1 / dt - 1e-9);
  for (let n = n0; n < n1; n++) rhythmStrokeAt(r, n, guide).forEach((e) => out.push(Object.assign({ t: n * dt }, e)));
  return out;
}
const rhythmClamp = (r, ppm) => Math.min(r.ppm[2], Math.max(r.ppm[1], Math.round(+ppm || r.ppm[0])));
/* the pattern in words, for a reader who cannot see the grid */
function rhythmDescribe(r) {
  const sounded = r.strokes.map((s, i) => [s, i + 1]).filter(([s]) => s.k !== 'rest').map(([, i]) => i);
  const rests = r.strokes.map((s, i) => [s, i + 1]).filter(([s]) => s.k === 'rest').map(([, i]) => i);
  const list = (a) => (a.length > 1 ? a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1] : String(a[0]));
  const marks = r.strokes.map((s, i) => [s, i + 1]).filter(([s]) => s.k === 'sam' || s.k === 'tali' || s.k === 'khali');
  let t = `${r.pulses} ${r.unit}s in a cycle, in groups of ${r.groups.join(', ')}. Sounded on ${r.unit}s ${list(sounded)}${rests.length ? `; silent on ${list(rests)}` : ''}.`;
  if (marks.length) t += ' ' + marks.map(([s, i]) => `${i}: ${{ sam: 'sam (the cycle lands here)', tali: 'clap', khali: 'wave' }[s.k]}`).join('; ') + '.';
  return t;
}
/* the gaps, in pulses, between the strokes of a pattern, wrapping round: for the bell pattern this is 2, 2, 1, 2, 2, 2, 1 */
function rhythmGaps(r) {
  const at = r.strokes.map((s, i) => [s, i]).filter(([s]) => s.k !== 'rest').map(([, i]) => i);
  return at.map((p, i) => ((at[(i + 1) % at.length] - p) + r.pulses) % r.pulses || r.pulses);
}
if (typeof module !== 'undefined' && module.exports) module.exports = { RH_KINDS, RHYTHMS, RHYTHM_BY_ID, RH_VOICES, rhythmStrokeAt, rhythmEvents, rhythmClamp, rhythmDescribe, rhythmGaps };
