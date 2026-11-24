/* ═══════════════════════════ 2z · Reading aloud and guided voices: the parts that need no speaker ═══════════════════════════
   Pure functions. The reader can read a text aloud, and a guided practice can be given a voice, with the voices the device already has (the browser's speech synthesis: nothing is sent
   anywhere by the app, and the quality depends on the voices installed). Speech works best in short pieces, and the page marks the sentence being spoken, so a paragraph is cut into
   chunks that are WHERE they are in the paragraph (offsets into its text), never rewritten: the words spoken are exactly the words on the page. The choices a person can make are short
   fixed lists. Which voice sounds best is a guess made from the voice's name and where it comes from (lsVoiceTier): the list puts the likely best first and says so.
   The engine that speaks (the queue, the pauses, pause and resume that can never leave the voice stuck) is `Speech` in 31-bell-speech.js; everything it needs to decide is here. */
const LS_RATES = [0.7, 0.85, 1, 1.15, 1.3, 1.5, 1.75, 2];
const LS_SLEEP = { off: ['Off', 0], '10': ['10 minutes', 10], '20': ['20 minutes', 20], '30': ['30 minutes', 30], '45': ['45 minutes', 45], '60': ['An hour', 60], section: ['End of this section', -1] };
const LS_DEFAULT = { rate: 0.85, voice: '', sleep: 'off' };            /* a little slower than talking: 0.85 is also the guided practices' pace */
const lsOwn = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
function lsClean(p) {
  const o = Object.assign({}, LS_DEFAULT); if (!p || typeof p !== 'object') return o;
  const r = +p.rate; if (Number.isFinite(r)) o.rate = LS_RATES.reduce((best, x) => (Math.abs(x - r) < Math.abs(best - r) ? x : best), LS_RATES[2]);
  if (typeof p.voice === 'string') o.voice = p.voice.slice(0, 200);
  if (typeof p.sleep === 'string' && lsOwn(LS_SLEEP, p.sleep)) o.sleep = p.sleep;
  return o;
}
/* the places in a paragraph where speech pauses: the end of a sentence (. ! ? … and a closing quote or bracket after it), but not after a short abbreviation or a lone capital */
const LS_ABBR = /(?:^|[\s(“"'‘])(?:Mr|Mrs|Ms|Dr|St|Sr|Jr|vs|cf|ca|No|Nos|Vol|Ch|Chap|Ps|Gen|Ex|Lev|Num|Dt|Deut|Is|Isa|Jer|Ezek|Dan|Mt|Matt|Mk|Lk|Jn|Rom|Cor|Gal|Eph|Phil|Col|Thess|Tim|Heb|Rev|Fig|Pl|pp|p|v|vv|e\.g|i\.e|etc|viz|Sec|Art|Pt|Bk|Bks|ed|eds|trans|ff|esp)$/i;
function lsSentenceEnds(t) {
  const ends = []; const re = /[.!?…]+["'”’)\]]*(?=\s|$)/g; let m;
  while ((m = re.exec(t))) {
    const end = m.index + m[0].length; const before = t.slice(Math.max(0, m.index - 12), m.index + 1); const lone = /(?:^|[\s(])[A-Z]\.$/.test(before) && m[0] === '.';
    if (m[0] === '.' && (LS_ABBR.test(t.slice(Math.max(0, m.index - 10), m.index)) || lone)) continue;
    ends.push(end);
  }
  if (!ends.length || ends[ends.length - 1] < t.length) ends.push(t.length); return ends;
}
/* cut a paragraph's text into chunks of at most max characters: sentences, with very short ones (under `join` characters, 24 unless said) joined to the next, and any longer than max cut at a
   comma or semicolon or, failing that, a space. A guided practice passes join 0, so "May I be safe." stays a phrase of its own with a pause after it.
   Returns [{a, b}] (offsets into t, trimmed of space); the pieces cover every non-space character once, in order. */
function lsChunks(text, max, join) {
  const t = String(text == null ? '' : text); const M = Math.max(60, Math.round(max) || 240); const J = join === undefined ? 24 : Math.max(0, Math.round(+join) || 0); const out = [];
  const push = (a, b) => { while (a < b && /\s/.test(t[a])) a++; while (b > a && /\s/.test(t[b - 1])) b--; if (b > a) out.push({ a, b }); };
  const cut = (a, b) => {                       // a stretch longer than max: at the last comma, semicolon or colon that leaves a piece of fair size, else the last space, else hard
    while (b - a > M) {
      const seg = t.slice(a, a + M); let at = Math.max(seg.lastIndexOf(', '), seg.lastIndexOf('; '), seg.lastIndexOf(': '), seg.lastIndexOf(' — '), seg.lastIndexOf('— '));
      if (at < M * 0.35) at = seg.lastIndexOf(' '); if (at < 1) at = M - 1; push(a, a + at + 1); a += at + 1;
    }
    push(a, b);
  };
  let start = 0; let pend = -1;
  for (const e of lsSentenceEnds(t)) {
    if (e <= start) continue;
    if (pend >= 0) { if (e - pend <= M) { /* joined to the short piece before it */ push(pend, e); pend = -1; start = e; continue; } cut(pend, start); pend = -1; }
    if (J && e - start < J && e < t.length) { pend = start; start = e; continue; }       // a very short sentence ("Amen.") goes with the next
    cut(start, e); start = e;
  }
  if (pend >= 0) cut(pend, start); return out;
}
/* the words to speak for a chunk */
const lsSpeak = (t, c) => String(t).slice(c.a, c.b).replace(/\s+/g, ' ').trim();

/* ── pauses: silence between the pieces, which the voices themselves do not leave (a plain run of sentences sounds chopped and hurried) ──
   Milliseconds at normal speed, by where the piece stops: a sentence, a clause cut out of a long sentence at a comma or colon, "…" (a breath in a guided script), a cut with no mark at all,
   and the end of the paragraph or the cue. A guided practice is given more room than a reading. At a slower speed the pauses grow, at a faster one they shrink. */
const LS_PAUSE = { read: { sentence: 420, clause: 150, ellipsis: 750, cut: 40, end: 1000 }, guide: { sentence: 800, clause: 240, ellipsis: 1400, cut: 60, end: 1500 } };
const lsPauseMs = (kind, style, rate) => { const P = LS_PAUSE[style === 'guide' ? 'guide' : 'read']; const base = lsOwn(P, kind) ? P[kind] : P.sentence; const r = Number.isFinite(+rate) && +rate > 0 ? Math.min(2.5, Math.max(0.5, +rate)) : 1; return Math.round(base / r); };
/* what a piece ends with, which says how long to wait after it */
function lsPieceKind(text, last) {
  const w = String(text).trim();
  if (last) return 'end';
  if (/(?:…|\.\.\.)["'”’)\]]*$/.test(w)) return 'ellipsis';
  if (/[.!?]["'”’)\]]*$/.test(w)) return 'sentence';
  if (/[,;:—–-]$/.test(w)) return 'clause';
  return 'cut';
}
/* a paragraph (or one guidance cue) as pieces to speak: [{a, b, text, kind}], at most `max` characters each (a voice that is not on this device is given shorter ones, because browsers
   cut an utterance off after about fifteen seconds), cut at sentence ends. opts: { style: 'read' | 'guide', max } */
function lsPieces(text, opts) {
  const o = opts || {}; const t = String(text == null ? '' : text); const guide = o.style === 'guide'; const cs = lsChunks(t, o.max || 240, guide ? 0 : 24);
  return cs.map((c, i) => { const w = lsSpeak(t, c); return { a: c.a, b: c.b, text: w, kind: lsPieceKind(w, i === cs.length - 1) }; });
}
/* about how long a spoken piece takes (milliseconds), at the usual 3 words a second at normal speed, plus a moment for the voice to start: for the watchdog that notices a voice that
   never says it is finished (the slowest voice is allowed twice as long), and for checking that a guidance cue fits before the next one */
const lsWords = (t) => (String(t).match(/\S+/g) || []).length;
const lsSpeakMs = (t, rate, slow) => { const r = Number.isFinite(+rate) && +rate > 0 ? Math.min(3, Math.max(0.3, +rate)) : 1; return Math.round(((lsWords(t) / (3 * r)) * (slow ? 2 : 1)) * 1000 + 600); };
/* how long a whole cue takes to say, pauses included (the same pieces the engine will speak) */
function lsCueMs(text, rate, style) {
  const ps = lsPieces(text, { style: style || 'guide' }); let ms = 0; ps.forEach((p, i) => { ms += lsSpeakMs(p.text, rate); if (i < ps.length - 1) ms += lsPauseMs(p.kind, style || 'guide', rate); }); return ms;
}

/* ── the voices ──
   Which voices sound best is a guess from a voice's name and whether it is on this device. Names the systems give their better voices say so (macOS: Premium, Enhanced; Windows and Edge:
   Natural; others: Neural, Siri); a few plain voices are well liked; a number of older and novelty voices sound mechanical or silly and go last. A voice that is on this device is ranked
   above one that is online (an online voice sends the words to its maker's service to be spoken, which the app never does by itself), and voices in other languages after all the English ones. */
const LS_BEST_RE = /premium|enhanced|natural|neural|\bsiri\b/i;
const LS_PREF = ['Ava', 'Allison', 'Samantha', 'Susan', 'Serena', 'Karen', 'Moira', 'Tessa', 'Fiona', 'Daniel', 'Oliver', 'Alex', 'Kate', 'Google US English', 'Google UK English'];
const LS_ROBOTIC_RE = /^(Albert|Bad News|Bahh|Bells|Boing|Bubbles|Cellos|Good News|Jester|Organ|Superstar|Trinoids|Whisper|Wobble|Zarvox|Fred|Ralph|Junior|Kathy|Princess|Agnes|Bruce|Vicki|Victoria|Eddy|Flo|Grandma|Grandpa|Reed|Rocko|Sandy|Shelley)\b/i;
const LS_NOVELTY_RE = /^(Albert|Bad News|Bahh|Bells|Boing|Bubbles|Cellos|Good News|Jester|Organ|Superstar|Trinoids|Whisper|Wobble|Zarvox)\b/i;
const lsIsEnglish = (v) => !!v && /^en([-_]|$)/i.test(String(v.lang || ''));
const lsIsLocal = (v) => !!v && v.localService !== false;           /* a browser that does not say is taken to mean on this device */
/* 'best' (named premium, enhanced, natural, neural or Siri), 'good' (a plain voice people like), 'basic' (any other), 'robotic' (older or novelty), 'other' (not English) */
function lsVoiceTier(v) {
  if (!v) return 'other'; if (!lsIsEnglish(v)) return 'other'; const name = String(v.name || '');
  if (LS_BEST_RE.test(name)) return 'best';
  if (LS_ROBOTIC_RE.test(name)) return 'robotic';
  if (LS_PREF.some((n) => name.includes(n))) return 'good';
  return 'basic';
}
function lsVoiceScore(v) {
  if (!v) return -1; if (!lsIsEnglish(v)) return 0;
  const name = String(v.name || ''); const lang = String(v.lang || ''); const tier = lsVoiceTier(v); const local = lsIsLocal(v);
  let s = tier === 'robotic' ? (local ? 2000 : 1900) : ({ best: 9000, good: 8000, basic: 7000 }[tier] - (local ? 0 : 3000));
  if (tier !== 'robotic') {
    if (/premium|\bsiri\b|neural|natural/i.test(name)) s += 40; else if (/enhanced/i.test(name)) s += 25;
    const i = LS_PREF.findIndex((n) => name.includes(n)); if (i >= 0) s += 30 - i;
    if (v.default === true) s += 30;                        /* the voice the person has set as the computer's own is a good sign */
  }
  if (/en[-_](US|GB)/i.test(lang)) s += 4; else if (/en[-_](AU|IE|CA)/i.test(lang)) s += 3;
  return s;
}
const lsVoices = (list) => (Array.isArray(list) ? list.slice() : []).filter((v) => v && v.voiceURI).sort((a, b) => lsVoiceScore(b) - lsVoiceScore(a) || String(a.name).localeCompare(String(b.name)));
/* the voice to use: the one chosen (by its address, or failing that its name) if it is still on the device, else the best English one that is not a joke, else the first there is */
const lsPickVoice = (list, uri, name) => { const l = lsVoices(list); return (uri && l.find((v) => v.voiceURI === uri)) || (name && l.find((v) => v.name === name)) || l.find((v) => lsVoiceScore(v) >= 3000) || l[0] || null; };
/* the voices as a list for a chooser: groups in the order to show them, each voice with a short label. A voice not on this device says so, and so does a joke or a very old one. */
const LS_GROUPS = [['best', 'Best on this device'], ['good', 'Good'], ['basic', 'Other voices'], ['online', 'Online (the words are sent to the voice’s service)'], ['robotic', 'Older and novelty voices'], ['other', 'Other languages']];
function lsVoiceLabel(v) {
  const name = String(v.name || ''); const lang = String(v.lang || '').replace('_', '-'); const says = /\bEnglish\b/i.test(name) || (lang && name.toLowerCase().includes(lang.toLowerCase()));
  let s = name; if (lang && !says) s += ` · ${lang}`; if (v.default === true) s += ' · the computer’s voice'; if (lsVoiceTier(v) === 'robotic') s += LS_NOVELTY_RE.test(name) ? ' · novelty' : ' · older style'; return s;
}
function lsVoiceGroups(list) {
  const out = LS_GROUPS.map(([k, label]) => ({ key: k, label, voices: [] })); const by = Object.fromEntries(out.map((g) => [g.key, g]));
  lsVoices(list).forEach((v) => { const t = lsVoiceTier(v); const k = t === 'other' ? 'other' : t === 'robotic' ? 'robotic' : lsIsLocal(v) ? t : 'online'; by[k].voices.push(v); });
  return out.filter((g) => g.voices.length);
}
/* whether to offer the note on adding a better voice: only when voices were found and the best of them is a plain one */
function lsAdvice(list) {
  const l = lsVoices(list); const best = l.find((v) => lsVoiceScore(v) >= 1000) || null; if (!best) return { best: null, tier: 'none', show: false, none: l.length === 0 };
  const tier = lsVoiceTier(best); return { best, tier, show: tier !== 'best', none: false };
}
/* the how-to lines for the note, the system the person is on first: [{key, os, text}] (the words are the ones in the README) */
const LS_HOWTO = {
  mac: ['Mac', 'System Settings → Accessibility → Spoken Content → System Voice → Manage Voices…, then download one marked Premium or Enhanced. Reload this page afterwards.'],
  ios: ['iPhone or iPad', 'Settings → Accessibility → Spoken Content → Voices → English, then download one marked Enhanced or Premium.'],
  win: ['Windows', 'Settings → Time & language → Speech → Manage voices → Add voices. In Edge, the “Natural” voices sound best, but they are online.'],
  android: ['Android', 'Settings → System → Languages & input → Text-to-speech output → Google Speech Services → Install voice data (the menus differ a little by phone).'],
};
function lsHowTo(ua) {
  const u = String(ua || ''); const mine = /iPhone|iPad|iPod/i.test(u) ? 'ios' : /Android/i.test(u) ? 'android' : /Windows|Win32|Win64/i.test(u) ? 'win' : 'mac';
  const keys = ['mac', 'win', 'android']; if (mine === 'ios') keys.unshift('ios');
  return [mine, ...keys.filter((k) => k !== mine)].map((k) => ({ key: k, os: LS_HOWTO[k][0], text: LS_HOWTO[k][1], mine: k === mine }));
}

/* ── the choices that live with the voice ── */
/* the saved voice, shared by guided practices and the reader: an address and a name (the name finds it again if the address changes) */
function lsVoicePref(p) { const o = { uri: '', name: '' }; if (p && typeof p === 'object') { if (typeof p.uri === 'string') o.uri = p.uri.slice(0, 200); if (typeof p.name === 'string') o.name = p.name.slice(0, 120); } return o; }
/* guided practices: the saved guidance, made safe. The old default was "voice and text together" (saved as 'voice'); a voice is now something a person adds, so that and anything unknown reads as text,
   and the voice switch is its own saved choice, off unless it was turned on. */
function lsGuideMode(p) { const o = p && typeof p === 'object' ? p : {}; return { guide: o.guide === 'bells' ? 'bells' : 'text', voiceOn: o.voiceOn === true }; }

/* when a sleep timer ends: the time (ms) or null for none/end of section */
const lsSleepAt = (key, now) => { const m = lsOwn(LS_SLEEP, key) ? LS_SLEEP[key][1] : 0; return m > 0 ? now + m * 60000 : null; };
if (typeof module !== 'undefined' && module.exports) module.exports = { LS_RATES, LS_SLEEP, LS_DEFAULT, LS_PAUSE, LS_GROUPS, LS_HOWTO, lsClean, lsSentenceEnds, lsChunks, lsSpeak, lsPauseMs, lsPieceKind, lsPieces, lsWords, lsSpeakMs, lsCueMs, lsIsEnglish, lsIsLocal, lsVoiceTier, lsVoiceScore, lsVoices, lsPickVoice, lsVoiceLabel, lsVoiceGroups, lsAdvice, lsHowTo, lsVoicePref, lsGuideMode, lsSleepAt };
