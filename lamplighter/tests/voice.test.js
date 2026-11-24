// Run: node tests/voice.test.js — the voice of the guided practices and of reading aloud (src/js/2z-listen-core.js, src/js/31-bell-speech.js, src/js/32-voice-chooser.js).
// What the maker found "chopped" (18 November 2026) is kept fixed here: (1) the voice chosen automatically must be the best one on the device, not a plain voice with a liked name; (2) a cue or a
// paragraph is said sentence by sentence with a real silence between, in pieces short enough that no browser cuts them off; (3) pause and resume, and a voice that fails, can never leave the
// voice stuck. The engine is run against a fake speechSynthesis with a fake clock, so the parts that a speaker cannot show (what is spoken, in what order, with what gaps, and what happens when
// the browser misbehaves) are checked exactly. What a voice SOUNDS like cannot be tested, and is not.
const fs = require('fs'); const path = require('path'); const vm = require('vm');
global.REFS = {};
const dir = path.join(__dirname, '../src/js');
const L = require(path.join(dir, '2z-listen-core.js')); Object.assign(globalThis, L);
const MEDD = require(path.join(dir, '23-data-meditation.js'));
const PP = require(path.join(dir, '26-data-path-practices.js')); Object.assign(globalThis, { pathPracticeById: PP.pathPracticeById, buildPathCues: PP.buildPathCues, pathAsPractice: PP.pathAsPractice });
let pass = 0; let fail = 0; const ok = (n, c, x = '') => { if (c) pass++; else { fail++; console.log('FAIL', n, typeof x === 'string' ? x : JSON.stringify(x).slice(0, 500)); } };

/* ── the voices of one Mac, as a browser listed them (18 November 2026): the English ones, and a few others ── */
const V = (name, lang, local = true, def = false) => ({ name, lang, localService: local, default: def, voiceURI: name });
const MAC = [V('Matilda (Premium)', 'en-AU', true, true), V('Albert', 'en-US'), V('Alice', 'it-IT'), V('Anna', 'de-DE'), V('Bad News', 'en-US'), V('Bahh', 'en-US'), V('Bells', 'en-US'), V('Boing', 'en-US'), V('Bubbles', 'en-US'), V('Cellos', 'en-US'),
  V('Daniel', 'en-GB'), V('Eddy (English (United States))', 'en-US'), V('Eddy (English (United Kingdom))', 'en-GB'), V('Eddy (German (Germany))', 'de-DE'), V('Evan (Enhanced)', 'en-US'), V('Flo (English (United States))', 'en-US'), V('Fred', 'en-US'), V('Good News', 'en-US'),
  V('Grandma (English (United States))', 'en-US'), V('Grandpa (English (United States))', 'en-US'), V('Jester', 'en-US'), V('Junior', 'en-US'), V('Karen', 'en-AU'), V('Kathy', 'en-US'), V('Kyoko', 'ja-JP'), V('Moira', 'en-IE'), V('Organ', 'en-US'), V('Ralph', 'en-US'),
  V('Reed (English (United States))', 'en-US'), V('Rishi', 'en-IN'), V('Rocko (English (United States))', 'en-US'), V('Samantha', 'en-US'), V('Sandy (English (United States))', 'en-US'), V('Shelley (English (United States))', 'en-US'), V('Superstar', 'en-US'), V('Tessa', 'en-ZA'),
  V('Trinoids', 'en-US'), V('Whisper', 'en-US'), V('Wobble', 'en-US'), V('Zarvox', 'en-US'), V('Zoe (Premium)', 'en-US')];
const names = (l) => l.map((v) => v.name);

{ /* the ranking */
  const r = lsVoices(MAC); const en = r.filter(lsIsEnglish);
  ok('on this Mac the three best voices are the ones installed as Premium and Enhanced, the one the computer is set to speak with first', names(r).slice(0, 3).join() === 'Matilda (Premium),Zoe (Premium),Evan (Enhanced)', names(r).slice(0, 4));
  /* the cause of the maker's robotic voice: the old picker added 50−index for a liked name and only 40 for Premium, so plain Samantha (56) beat Zoe (Premium) (48) */
  const oldScore = (v) => { const PREF = ['Ava', 'Allison', 'Samantha', 'Susan', 'Serena', 'Karen', 'Moira', 'Tessa', 'Fiona', 'Daniel', 'Oliver']; let s = 0; const i = PREF.findIndex((n) => v.name.includes(n)); if (i >= 0) s += 50 - i; if (/premium|enhanced|natural/i.test(v.name)) s += 40; if (v.localService) s += 5; if (/en[-_](US|GB|AU|IE)/i.test(v.lang)) s += 3; return s; };
  const oldBest = en.slice().sort((a, b) => oldScore(b) - oldScore(a))[0];
  ok('the old rule would have chosen plain Samantha over a Premium voice; the new ranking does not', oldBest.name === 'Samantha' && lsPickVoice(MAC, '').name === 'Matilda (Premium)', [oldBest.name, lsPickVoice(MAC, '').name]);
  ok('a plain voice people like comes after every best one and before every other', ['Samantha', 'Karen', 'Moira', 'Daniel', 'Tessa'].every((n) => names(r).indexOf(n) > 2) && names(r).indexOf('Rishi') > names(r).indexOf('Tessa'), names(r).slice(0, 9));
  const robo = ['Albert', 'Bad News', 'Bahh', 'Bells', 'Boing', 'Bubbles', 'Cellos', 'Good News', 'Jester', 'Organ', 'Superstar', 'Trinoids', 'Whisper', 'Wobble', 'Zarvox', 'Fred', 'Junior', 'Kathy', 'Ralph', 'Eddy (English (United States))', 'Flo (English (United States))', 'Grandma (English (United States))', 'Grandpa (English (United States))', 'Reed (English (United States))', 'Rocko (English (United States))', 'Sandy (English (United States))', 'Shelley (English (United States))'];
  ok('novelty voices and the oldest mechanical ones come after every ordinary English voice, and before the other languages', robo.every((n) => lsVoiceTier(MAC.find((v) => v.name === n)) === 'robotic') && names(r).slice(0, 9).every((n) => !robo.includes(n)) && names(r).indexOf('Zarvox') < names(r).indexOf('Anna'), names(r));
  ok('voices in other languages come after all the English ones', names(r).slice(-4).every((n) => !lsIsEnglish(MAC.find((v) => v.name === n))) && en.length === names(r).filter((n) => lsIsEnglish(MAC.find((v) => v.name === n))).length);
  ok('the voice the person chose is used while it is on the device, and one that has gone falls back to the best, by name if the address changed', lsPickVoice(MAC, 'Daniel').name === 'Daniel' && lsPickVoice(MAC, 'Gone').name === 'Matilda (Premium)' && lsPickVoice(MAC, 'new-address', 'Karen').name === 'Karen');
  ok('the automatic pick is never a novelty voice, even when it is the only English voice that is not online', lsPickVoice([V('Zarvox', 'en-US'), V('Anna', 'de-DE')], '').name === 'Zarvox' && lsPickVoice([V('Samantha', 'en-US'), V('Zarvox', 'en-US')], '').name === 'Samantha');
  ok('broken entries are dropped and no list gives an error', lsVoices([null, undefined, {}, { name: 'x' }, V('A', 'en-US')]).length === 1 && lsVoices(null).length === 0 && lsPickVoice([], '') === null && lsPickVoice(undefined, 'x') === null);
  ok('a voice on this device always ranks above one that is online, whatever its name: the app never sends words away on its own', lsVoiceScore(V('Plain', 'en-US', true)) > lsVoiceScore(V('Microsoft Aria Online (Natural) - English (United States)', 'en-US', false)) && lsVoiceScore(V('Google US English', 'en-US', false)) < lsVoiceScore(V('Fiona', 'en-GB', true)));
  const WIN = [V('Microsoft David - English (United States)', 'en-US'), V('Microsoft Zira - English (United States)', 'en-US'), V('Microsoft Aria Online (Natural) - English (United States)', 'en-US', false), V('Microsoft Jenny Online (Natural) - English (United States)', 'en-US', false), V('Microsoft Hedda - German (Germany)', 'de-DE')];
  ok('on Windows in Edge the online “Natural” voices are in the online group, not picked by themselves, and the plain local voice is the automatic one', lsPickVoice(WIN, '').name.startsWith('Microsoft David') || lsPickVoice(WIN, '').name.startsWith('Microsoft Zira'), lsPickVoice(WIN, '').name);
  ok('a name with Natural, Neural, Siri, Premium or Enhanced is a best voice (and “Siri” alone in another word is not)', ['Aria Online (Natural)', 'Jane (Neural)', 'Siri Voice 2', 'Ava (Premium)', 'Tom (Enhanced)'].every((n) => lsVoiceTier(V(n, 'en-US')) === 'best') && lsVoiceTier(V('Sirius', 'en-US')) !== 'best');
  const g = lsVoiceGroups(MAC);
  ok('the chooser groups come in order: best, good, other, online (none here), older and novelty, other languages; each voice once', g.map((x) => x.key).join() === 'best,good,basic,robotic,other' && g.reduce((a, x) => a + x.voices.length, 0) === MAC.length, g.map((x) => x.key));
  ok('an online voice goes into its own group with a plain label saying the words are sent to its service', lsVoiceGroups([V('Samantha', 'en-US'), V('Google UK English Female', 'en-GB', false)]).map((x) => x.key).join() === 'good,online' && /sent to the voice/.test(LS_GROUPS.find((x) => x[0] === 'online')[1]));
  ok('labels give the language only when the name does not, and say what a voice is when it is a joke, an old one, or the computer’s own', lsVoiceLabel(MAC[0]) === 'Matilda (Premium) · en-AU · the computer’s voice' && lsVoiceLabel(V('Eddy (English (United States))', 'en-US')) === 'Eddy (English (United States)) · older style' && lsVoiceLabel(V('Zarvox', 'en-US')) === 'Zarvox · en-US · novelty' && lsVoiceLabel(V('Samantha', 'en_US')) === 'Samantha · en-US');
}
{ /* the note on adding a better voice */
  ok('with a Premium voice on the device there is no note', lsAdvice(MAC).show === false && lsAdvice(MAC).best.name === 'Matilda (Premium)');
  const plain = MAC.filter((v) => !/Premium|Enhanced/.test(v.name)); const a = lsAdvice(plain);
  ok('when the best voice found is a plain one, the note is offered', a.show === true && a.best.name === 'Samantha' && a.tier === 'good', a);
  ok('when only novelty voices are English, the note is offered; with no voices at all, nothing is said but that none were found', lsAdvice([V('Zarvox', 'en-US'), V('Whisper', 'en-US')]).show === true && lsAdvice([]).show === false && lsAdvice([]).none === true && lsAdvice(null).none === true && lsAdvice([V('Anna', 'de-DE')]).show === false);
  const how = lsHowTo('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/156');
  ok('the lines say Mac, Windows and Android, the person’s own system first, and each is short', how.map((x) => x.os).join() === 'Mac,Windows,Android' && how[0].mine && how.every((x) => x.text.length < 190), how.map((x) => x.text.length));
  ok('the Mac line gives the whole way: System Settings, Accessibility, Spoken Content, System Voice, Manage Voices, Premium or Enhanced', ['System Settings', 'Accessibility', 'Spoken Content', 'System Voice', 'Manage Voices', 'Premium', 'Enhanced'].every((w) => how[0].text.includes(w)), how[0].text);
  ok('on Windows the Windows line comes first and mentions that Natural voices are online; on Android the Android line; on an iPhone the iPhone line is added', lsHowTo('Mozilla/5.0 (Windows NT 10.0; Win64; x64)')[0].key === 'win' && /online/.test(lsHowTo('Windows')[0].text) && lsHowTo('Mozilla/5.0 (Linux; Android 14)')[0].key === 'android' && lsHowTo('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)').map((x) => x.key).join() === 'ios,mac,win,android');
}
{ /* the choices that live with the voice */
  ok('the guidance choice: text is the default, bells only is kept, and the old default “voice” reads as text with the voice switch off', JSON.stringify(lsGuideMode(undefined)) === '{"guide":"text","voiceOn":false}' && lsGuideMode({ guide: 'voice' }).guide === 'text' && lsGuideMode({ guide: 'voice' }).voiceOn === false && lsGuideMode({ guide: 'bells' }).guide === 'bells' && lsGuideMode({ guide: '__proto__' }).guide === 'text');
  ok('the voice switch is its own choice, on only when it was turned on (and kept while bells only is chosen)', lsGuideMode({ guide: 'text', voiceOn: true }).voiceOn === true && lsGuideMode({ guide: 'bells', voiceOn: true }).voiceOn === true && lsGuideMode({ voiceOn: 'yes' }).voiceOn === false && lsGuideMode({ voiceOn: 1 }).voiceOn === false && lsGuideMode(5).voiceOn === false);
  ok('the saved voice is two short strings and nothing else', JSON.stringify(lsVoicePref({ uri: 'Zoe (Premium)', name: 'Zoe (Premium)', x: 1 })) === '{"uri":"Zoe (Premium)","name":"Zoe (Premium)"}' && lsVoicePref(null).uri === '' && lsVoicePref({ uri: 5 }).uri === '' && lsVoicePref({ uri: 'x'.repeat(999) }).uri.length === 200);
  ok('reading aloud now defaults to 0.85×, a little slower than speech, and 0.85 is one of the speeds on offer', LS_DEFAULT.rate === 0.85 && LS_RATES.includes(0.85) && lsClean(null).rate === 0.85 && lsClean({ rate: 1 }).rate === 1);
}
{ /* pieces and pauses */
  const cue = 'Take one slow breath in… and let it go. Let your shoulders soften. Rest.';
  const gp = lsPieces(cue, { style: 'guide' }); const rp = lsPieces(cue, { style: 'read' });
  ok('a cue is cut at every sentence, and at a breath marked “…”, and a short phrase of its own is not joined to the next in a guided practice', gp.map((p) => p.text).join('|') === 'Take one slow breath in…|and let it go.|Let your shoulders soften.|Rest.', gp.map((p) => p.text));
  ok('a reading joins a very short sentence to the next, as before', rp.map((p) => p.text).join('|') === 'Take one slow breath in…|and let it go. Let your shoulders soften.|Rest.', rp.map((p) => p.text));
  ok('each piece says what it ends with, so the engine knows how long to wait: a breath, a sentence, the end', gp.map((p) => p.kind).join() === 'ellipsis,sentence,sentence,end', gp.map((p) => p.kind));
  ok('every piece carries its place in the paragraph, and the pieces cover every word once, in order', (() => { const t = 'The earth was formless and empty. Darkness was on the surface of the deep, and the Spirit of God was hovering over the waters.'; const ps = lsPieces(t, { style: 'read' }); return ps.every((p, i) => t.slice(p.a, p.b) === p.text && (i === 0 || p.a >= ps[i - 1].b)) && ps.map((p) => p.text).join(' ') === t; })());
  ok('the pauses: more room in a guided practice, longer after a paragraph or a breath than after a sentence, shorter between the halves of a long sentence', LS_PAUSE.guide.sentence > LS_PAUSE.read.sentence && LS_PAUSE.read.end > LS_PAUSE.read.sentence && LS_PAUSE.guide.ellipsis > LS_PAUSE.guide.sentence && LS_PAUSE.read.clause < LS_PAUSE.read.sentence && LS_PAUSE.guide.end >= LS_PAUSE.guide.ellipsis);
  ok('a sentence pause is real: at least a third of a second in a reading and three quarters of a second in a guided practice, at the default speed', lsPauseMs('sentence', 'read', 0.85) >= 350 && lsPauseMs('sentence', 'guide', 0.85) >= 750, [lsPauseMs('sentence', 'read', 0.85), lsPauseMs('sentence', 'guide', 0.85)]);
  ok('a slower voice is given longer pauses and a faster one shorter, within limits, and nonsense gives the usual', lsPauseMs('sentence', 'read', 0.7) > lsPauseMs('sentence', 'read', 1) && lsPauseMs('sentence', 'read', 2) < lsPauseMs('sentence', 'read', 1) && lsPauseMs('sentence', 'read', 99) === lsPauseMs('sentence', 'read', 2.5) && lsPauseMs('nonsense', 'read', 1) === LS_PAUSE.read.sentence && lsPauseMs('sentence', 'read', 'x') === LS_PAUSE.read.sentence);
  const long = ('and so it went on and on, ' .repeat(30)).trim() + ' The end.'; const lc = lsPieces(long, { style: 'read', max: 150 });
  ok('a voice that is not on the device is given pieces of at most 150 characters (browsers cut an utterance off after about fifteen seconds), cut at commas, with every word kept', lc.length > 4 && lc.every((p) => p.text.length <= 150) && lc.slice(0, -1).every((p) => /,$/.test(p.text) || p.kind === 'sentence') && lc.map((p) => p.text).join(' ').replace(/\s+/g, ' ') === long, lc.map((p) => p.text.length));
  ok('the piece after a cut in the middle of a sentence waits only a moment, so the sentence does not sound chopped', lc.filter((p) => p.kind === 'clause').length > 0 && lsPauseMs('clause', 'read', 1) <= 200 && lsPauseMs('cut', 'read', 1) <= 60);
  ok('odd input gives no pieces and no error', [lsPieces(''), lsPieces('   '), lsPieces(null), lsPieces(undefined), lsPieces(5)].every((x) => Array.isArray(x)) && lsPieces('').length === 0 && lsPieces(' \n ').length === 0);
}
{ /* every guidance cue fits before the next one, at the default pace: no cue runs over the next, none is cut off by the end of the sit */
  const ids = [...MEDD.PRACTICES.map((p) => ({ id: p.id, mins: p.mins })), ...PP.PATH_PRACTICES.map((p) => ({ id: p.id, mins: p.mins }))]; let n = 0; const bad = [];
  for (const p of ids) for (const m of p.mins) { const cues = MEDD.buildCues(p.id, m, 'Peace'); const T = Math.round(m * 60); cues.forEach((c, i) => { n++; const next = i < cues.length - 1 ? cues[i + 1].t : T; if (lsCueMs(c.text, 0.85, 'guide') > (next - c.t) * 1000 - 500) bad.push([p.id, m, c.t, Math.round(lsCueMs(c.text, 0.85, 'guide') / 100) / 10, next - c.t]); }); }
  ok(`all ${n} guidance cues of every practice and length (breath, body, Firelight, the lot) are said, with their pauses, half a second before the next cue or the end of the sit, at 0.85×`, n > 800 && bad.length === 0, bad.slice(0, 5));
  ok('and the pauses are included in that count: a cue of three sentences takes longer than the same words said straight on', lsCueMs('One two three four five. Six seven eight nine ten. Eleven twelve thirteen fourteen fifteen.', 0.85, 'guide') > lsSpeakMs('One two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen', 0.85) + 1500);
}

/* ── the engine, against a fake speechSynthesis and a fake clock ── */
function makeEngine(o = {}) {
  const clock = { t: 1000000 }; let seq = 0; let timers = [];
  const setT = (fn, ms) => { const id = ++seq; timers.push({ id, at: clock.t + Math.max(0, +ms || 0), fn }); return id; };
  const clearT = (id) => { timers = timers.filter((x) => x.id !== id); };
  const advance = (ms) => { const end = clock.t + ms; for (let g = 0; g < 100000; g++) { timers.sort((a, b) => a.at - b.at || a.id - b.id); const nx = timers[0]; if (!nx || nx.at > end) break; timers.shift(); clock.t = nx.at; nx.fn(); } clock.t = end; };
  const log = []; const note = (k, extra) => log.push(Object.assign({ k, t: clock.t }, extra));
  let cur = null; let queue = []; let active = 0; let maxActive = 0; const mode = Object.assign({ wps: 3, how: 'ok', fail: null, staleEnd: false }, o.mode);
  const synth = {
    speaking: false, pending: false, paused: false, voices: o.voices || MAC.slice(), getVoices() { return this.voices; }, addEventListener(ev, fn) { if (ev === 'voiceschanged') this.vc = fn; }, removeEventListener() {},
    speak(u) { note('speak', { text: u.text, rate: u.rate, pitch: u.pitch, volume: u.volume, lang: u.lang, voice: u.voice && u.voice.name }); queue.push(u); this.pending = true; pump(); },
    cancel() { note('cancel'); queue = []; this.pending = false; if (cur) { const u = cur; cur = null; this.speaking = false; active--; (u._t || []).forEach(clearT); const ev = mode.staleEnd ? 'onend' : 'onerror'; setT(() => { if (u[ev]) u[ev](ev === 'onerror' ? { error: 'interrupted' } : {}); }, 30); } },
    pause() { note('pause'); this.paused = true; }, resume() { note('resume'); this.paused = false; pump(); },
  };
  function pump() {
    if (cur || synth.paused || !queue.length) return; const u = queue.shift(); cur = u; synth.speaking = true; synth.pending = queue.length > 0; active++; maxActive = Math.max(maxActive, active); u._t = [];
    if (mode.interrupt && mode.interrupt(u)) { u._t.push(setT(() => { note('start'); if (u.onstart) u.onstart({}); }, 15)); u._t.push(setT(() => { note('error', { error: 'interrupted' }); if (cur === u) { cur = null; synth.speaking = false; active--; } if (u.onerror) u.onerror({ error: 'interrupted' }); pump(); }, 800)); return; }       // stopped from outside, as a real browser did once
    const f = mode.fail && mode.fail(u);
    if (f) { u._t.push(setT(() => { note('error', { error: f }); if (cur === u) { cur = null; synth.speaking = false; active--; } if (u.onerror) u.onerror({ error: f }); pump(); }, 10)); return; }
    u._t.push(setT(() => { note('start'); if (u.onstart) u.onstart({}); }, 15));
    if (mode.how === 'hang') return;                                                                 // says something, then nothing more, and never ends, yet reports that it is speaking
    if (mode.how === 'die') { u._t.push(setT(() => { if (cur === u) { cur = null; synth.speaking = false; active--; } }, 100)); return; }       // goes quiet without an end event
    u._t.push(setT(() => { if (cur !== u) return; cur = null; synth.speaking = false; active--; note('end'); if (u.onend) u.onend({}); pump(); }, Math.max(50, (lsWords(u.text) / (mode.wps * (u.rate || 1))) * 1000)));
  }
  const data = {}; const store = { get: (k, d) => (k in data ? JSON.parse(JSON.stringify(data[k])) : d), set: (k, v) => { data[k] = JSON.parse(JSON.stringify(v)); } };
  class Utt { constructor(text) { this.text = text; this.rate = 1; this.pitch = 1; this.volume = 1; this.voice = null; this.lang = ''; } }
  const ctx = { console, window: { speechSynthesis: synth }, SpeechSynthesisUtterance: Utt, setTimeout: setT, clearTimeout: clearT, Date: { now: () => clock.t }, store, AudioCore: {} };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(dir, '2z-listen-core.js'), 'utf8') + '\n' + fs.readFileSync(path.join(dir, '31-bell-speech.js'), 'utf8') + '\nthis.Speech = Speech;', ctx, { filename: 'speech-engine' });
  return { Speech: ctx.Speech, synth, log, advance, clock, store, data, mode, maxActive: () => maxActive, speaks: () => log.filter((x) => x.k === 'speak'), ends: () => log.filter((x) => x.k === 'end') };
}
{ /* order and silence */
  const E = makeEngine(); const done = []; ok('the engine finds speech in this (fake) browser', E.Speech.ok === true);
  E.Speech.say('First sentence here. Second sentence here. Third sentence here.', { style: 'guide', rate: 1, onDone: () => done.push(E.clock.t) }); E.advance(60000);
  const sp = E.speaks(); const en = E.ends();
  ok('three sentences are three utterances, in order', sp.map((x) => x.text).join('|') === 'First sentence here.|Second sentence here.|Third sentence here.', sp.map((x) => x.text));
  const gaps = [sp[1].t - en[0].t, sp[2].t - en[1].t];
  ok('a guided practice leaves 800 ms of silence after each sentence (at normal speed), which the voices themselves do not leave', gaps.every((g) => g === 800), gaps);
  ok('it says it is done once, after the last piece and the silence that closes a cue', done.length === 1 && done[0] - en[2].t === 1500, [done, en.map((x) => x.t)]);
  ok('nothing is ever said on top of something else, and the browser’s own pause is never used', E.maxActive() === 1 && !E.log.some((x) => x.k === 'pause'));
  const R = makeEngine(); const rdone = []; R.Speech.say('The first sentence is long enough to stand alone. The second sentence is long enough as well.', { style: 'read', rate: 1, onDone: () => rdone.push(R.clock.t) }); R.advance(60000);
  ok('a reading leaves 420 ms after a sentence and a full second after the paragraph', R.speaks()[1].t - R.ends()[0].t === 420 && rdone[0] - R.ends()[1].t === 1000, [R.speaks()[1].t - R.ends()[0].t, rdone[0] - R.ends()[1].t]);
  const S = makeEngine(); S.Speech.say('The first sentence is long enough to stand alone. The second sentence is long enough as well.', { style: 'read', rate: 0.7 }); S.advance(60000);
  ok('at 0.7× the same pauses are a little longer', S.speaks()[1].t - S.ends()[0].t === 600, S.speaks()[1].t - S.ends()[0].t);
  const P = makeEngine(); const seen = []; P.Speech.say('Alpha one two. Beta three four. Gamma five six.', { style: 'guide', rate: 1, onPiece: (i, p) => seen.push([i, p.text]) }); P.advance(60000);
  ok('onPiece is called as each piece begins, with its place, so the reader can mark the sentence being said', seen.map((x) => x[0]).join() === '0,1,2' && seen[1][1] === 'Beta three four.', seen);
  const Q = makeEngine(); const order = []; Q.Speech.say('One cue here now.', { style: 'guide', rate: 1, onDone: () => order.push('a') }); Q.Speech.say('Another cue follows.', { style: 'guide', rate: 1, onDone: () => order.push('b') }); Q.advance(60000);
  ok('a second cue given while the first is being said waits for it and is said after', order.join() === 'a,b' && Q.speaks().map((x) => x.text).join('|') === 'One cue here now.|Another cue follows.' && Q.maxActive() === 1);
  const F = makeEngine(); const d2 = []; for (let i = 0; i < 9; i++) F.Speech.say(`Cue number ${i} here.`, { style: 'guide', rate: 1, onDone: () => d2.push(i) }); F.advance(120000);
  ok('a pile of late cues does not build up: the one being said and the newest are kept', d2.length === 5 && d2[0] === 0 && d2[d2.length - 1] === 8, d2);
}
{ /* pause and resume */
  const E = makeEngine(); E.Speech.say('Alpha beta gamma delta epsilon zeta eta theta. Second one follows it.', { style: 'read', rate: 1 }); E.advance(500); E.Speech.pause(); const before = E.speaks().length; E.advance(30000);
  ok('pausing in the middle of a sentence stops the voice at once and nothing is said while paused', before === 1 && E.speaks().length === 1 && !E.synth.speaking && E.Speech.state().paused === true, E.Speech.state());
  E.Speech.resume(); E.advance(60000);
  ok('on resume the sentence is said again from its start, then the rest follows, and the voice ends clean', E.speaks().map((x) => x.text).join('|') === 'Alpha beta gamma delta epsilon zeta eta theta.|Alpha beta gamma delta epsilon zeta eta theta.|Second one follows it.' && !E.Speech.busy(), E.speaks().map((x) => x.text));
  ok('the browser’s own pause is never called', !E.log.some((x) => x.k === 'pause'));
  const G = makeEngine(); G.Speech.say('Alpha beta gamma. Second one follows it.', { style: 'guide', rate: 1 }); G.advance(1200);
  ok('(set-up) the first sentence has been said and the engine is in the silence after it', G.ends().length === 1 && G.speaks().length === 1 && G.Speech.state().phase === 'gap', G.Speech.state());
  G.Speech.pause(); G.advance(5000); G.Speech.resume(); G.advance(30000);
  ok('pausing in the silence after a sentence does not repeat that sentence: resume goes on with the next', G.speaks().map((x) => x.text).join('|') === 'Alpha beta gamma.|Second one follows it.', G.speaks().map((x) => x.text));
  const H = makeEngine(); H.Speech.pause(); H.Speech.say('Said after the pause.', { style: 'read', rate: 1 }); H.advance(10000); const waiting = H.speaks().length; H.Speech.resume(); H.advance(10000);
  ok('something to say that arrives while paused waits, and is said on resume', waiting === 0 && H.speaks().length === 1);
  const I = makeEngine(); I.Speech.pause(); I.Speech.cancel(); I.Speech.say('Fresh start.', { style: 'read', rate: 1 }); I.advance(10000);
  ok('cancelling while paused leaves nothing paused: the next thing is said straight away', I.speaks().length === 1 && I.Speech.state().paused === false);
  const J = makeEngine(); J.Speech.resume(); J.Speech.pause(); J.Speech.pause(); J.Speech.resume(); J.Speech.resume(); J.Speech.say('Still works.', { style: 'read', rate: 1 }); J.advance(10000);
  ok('pause and resume in any order, any number of times, with nothing playing, leave it working', J.speaks().length === 1 && !J.Speech.busy());
}
{ /* cancel, and a browser left in a bad state */
  const E = makeEngine(); E.Speech.say('One two three four five six. Seven eight nine ten.', { style: 'read', rate: 1 }); E.advance(400); E.Speech.cancel(); E.advance(20000);
  ok('cancel stops at once and clears everything that was waiting', E.speaks().length === 1 && !E.Speech.busy() && E.Speech.state().jobs === 0);
  const F = makeEngine(); F.synth.paused = true; F.Speech.cancel();
  ok('a browser left paused by something else is set going again by cancel, so the next thing is not swallowed', F.synth.paused === false && F.log.some((x) => x.k === 'resume'));
  const G = makeEngine(); G.Speech.say('Before the stop here.', { style: 'read', rate: 1 }); G.advance(200); G.Speech.cancel(); G.Speech.say('After the stop here.', { style: 'read', rate: 1 }); G.advance(20000);
  ok('something said straight after a cancel is still said (the engine waits a moment, as browsers need)', G.speaks().map((x) => x.text).join('|') === 'Before the stop here.|After the stop here.' && G.speaks()[1].t - G.log.find((x) => x.k === 'cancel').t >= 70);
  const H = makeEngine({ mode: { staleEnd: true } }); H.Speech.say('Alpha beta gamma delta epsilon zeta eta theta. Second one follows it.', { style: 'read', rate: 1 }); H.advance(500); H.Speech.restart(); H.advance(60000);
  ok('a late “ended” from a stopped utterance, which some browsers send after the next has begun, is ignored: nothing is skipped or said twice', H.speaks().map((x) => x.text).join('|') === 'Alpha beta gamma delta epsilon zeta eta theta.|Alpha beta gamma delta epsilon zeta eta theta.|Second one follows it.' && H.maxActive() === 1, H.speaks().map((x) => x.text));
  const K = makeEngine(); let again = 0; K.Speech.say('First paragraph here.', { style: 'read', rate: 1, onDone: () => { again++; K.Speech.say('Second paragraph here.', { style: 'read', rate: 1, onDone: () => again++ }); } }); K.advance(60000);
  ok('saying the next paragraph from onDone, as the reader does, starts it once, after the silence', K.speaks().map((x) => x.text).join('|') === 'First paragraph here.|Second paragraph here.' && again === 2 && K.maxActive() === 1, K.speaks().map((x) => x.text));
}
{ /* a voice that misbehaves */
  const E = makeEngine({ mode: { how: 'die' } }); const done = []; E.Speech.say('One two three. Four five six.', { style: 'guide', rate: 1, onDone: () => done.push(1) }); E.advance(120000);
  ok('a voice that goes quiet without saying it has finished is given up on, after a few seconds, and the next piece is tried', E.speaks().length === 2 && done.length === 1 && !E.Speech.busy(), [E.speaks().length, done.length, E.Speech.state()]);
  const F = makeEngine({ mode: { how: 'hang' } }); const fails = []; F.Speech.say('One two three. Four five six. Seven eight nine. Ten eleven twelve.', { style: 'guide', rate: 1, onFail: (w) => fails.push(w) }); F.advance(600000);
  ok('a voice that never ends is cancelled after a limit; after three pieces in a row that fail the engine says so, stops, and is clean', fails.join() === 'silent' && !F.Speech.busy() && F.Speech.state().jobs === 0 && F.speaks().length === 3, [fails, F.speaks().length, F.Speech.state()]);
  F.mode.how = 'ok'; const again = []; F.Speech.say('It works again.', { style: 'read', rate: 1, onDone: () => again.push(1) }); F.advance(600000);
  ok('and after giving up it can be used again once the voice is back: the faults are counted afresh', again.length === 1 && F.speaks().length === 4 && F.Speech.state().fails === 0, [again, F.speaks().length, F.Speech.state()]);
  const G = makeEngine({ mode: { fail: () => 'synthesis-failed' } }); const gf = []; G.Speech.say('One two three. Four five six. Seven eight nine. Ten eleven twelve.', { style: 'guide', rate: 1, onFail: (w) => gf.push(w) }); G.advance(60000);
  ok('three errors in a row end it with “silent”, and the cues behind it are dropped rather than tried one by one', gf.join() === 'silent' && G.speaks().length === 3 && !G.Speech.busy(), [gf, G.speaks().length]);
  const H = makeEngine({ mode: { fail: () => 'not-allowed' } }); const hf = []; H.Speech.say('One two three. Four five six.', { style: 'guide', rate: 1, onFail: (w) => hf.push(w) }); H.advance(60000);
  ok('a browser that blocks speech until the page has been clicked is told apart at once (“blocked”), without trying again', hf.join() === 'blocked' && H.speaks().length === 1 && !H.Speech.busy(), [hf, H.speaks().length]);
  { let first = true; const J = makeEngine({ mode: { interrupt: () => { const x = first; first = false; return x; } } }); const jd = []; J.Speech.say('A first sentence of several words. Second one here.', { style: 'guide', rate: 1, onDone: () => jd.push(1) }); J.advance(120000);
    ok('a sentence stopped from outside by the system (seen once in a real browser) is said again from its start, and then the rest follows', J.speaks().map((x) => x.text).join('|') === 'A first sentence of several words.|A first sentence of several words.|Second one here.' && jd.length === 1 && J.Speech.state().fails === 0, J.speaks().map((x) => x.text)); }
  { const J = makeEngine({ mode: { interrupt: () => true } }); const jf = []; J.Speech.say('One two three. Four five six. Seven eight nine. Ten eleven twelve.', { style: 'guide', rate: 1, onFail: (w) => jf.push(w) }); J.advance(120000);
    ok('but a voice that is stopped every time is not retried for ever: each sentence is tried twice, and after three it says so and stops', jf.join() === 'silent' && J.speaks().length === 6 && !J.Speech.busy(), [jf, J.speaks().length]); }
  { let first = true; const J = makeEngine({ mode: { interrupt: () => { const x = first; first = false; return x; } } }); J.Speech.say('A first sentence of several words. Second one here.', { style: 'guide', rate: 1 }); J.advance(1000); const inGap = J.Speech.state().phase === 'gap'; J.Speech.pause(); J.advance(5000); J.Speech.resume(); J.advance(5000);
    ok('pausing in the silence before an interrupted sentence is said again does not lose it: resume says that sentence, not the next', inGap && J.speaks().map((x) => x.text).slice(0, 2).join('|') === 'A first sentence of several words.|A first sentence of several words.', [inGap, J.speaks().map((x) => x.text)]); }
  let n = 0; const I = makeEngine({ mode: { fail: () => (++n === 2 ? 'synthesis-failed' : null) } }); const idone = []; I.Speech.say('One two three. Four five six. Seven eight nine.', { style: 'guide', rate: 1, onDone: () => idone.push(1) }); I.advance(60000);
  ok('one piece that fails is skipped and the rest are said', I.speaks().length === 3 && idone.length === 1, I.speaks().length);
}
{ /* which voice, and how */
  const E = makeEngine(); E.data['reader.listen'] = { voice: 'Evan (Enhanced)', rate: 1, sleep: 'off' }; E.Speech.say('Say this here.', { style: 'read', rate: 1 }); E.advance(5000);
  ok('the first time, the voice picked in the reader before is the one used (nothing a person chose is lost)', E.speaks()[0].voice === 'Evan (Enhanced)' && E.Speech.chosen().name === 'Evan (Enhanced)', E.speaks()[0]);
  const F = makeEngine(); F.data['meditation.prefs'] = { voiceURI: 'Karen' }; ok('or the voice picked for the guided practices', F.Speech.chosen().name === 'Karen');
  const G = makeEngine(); ok('with nothing picked, the best on the device is used, and no joke voice', G.Speech.chosen().name === 'Matilda (Premium)' && G.Speech.best().name === 'Matilda (Premium)');
  G.Speech.choose('Daniel'); G.Speech.say('Said in a chosen voice.', { style: 'guide', rate: 0.85, volume: 0.9 }); G.advance(5000); const u = G.speaks()[0];
  ok('a voice chosen is remembered (key speech.voice) and used, with its language, the speed and loudness asked for, and a gentler pitch', JSON.stringify(G.data['speech.voice']) === '{"uri":"Daniel","name":"Daniel"}' && u.voice === 'Daniel' && u.lang === 'en-GB' && u.rate === 0.85 && u.volume === 0.9 && u.pitch === 0.95, u);
  G.synth.voices = MAC.filter((v) => v.name !== 'Daniel'); G.synth.vc(); G.Speech.say('Voice has gone.', { style: 'guide', rate: 1 }); G.advance(5000);
  ok('when the chosen voice is no longer on the device the best one is used, and the choice is kept for when it is back', G.speaks()[1].voice === 'Matilda (Premium)' && G.data['speech.voice'].uri === 'Daniel');
  const H = makeEngine({ voices: [V('Samantha', 'en-US'), V('Google UK English Female', 'en-GB', false)] }); const longText = ('and so it went on and on, ' .repeat(30)).trim() + ' The end.';
  H.Speech.say(longText, { style: 'read', rate: 1 }); H.advance(600000); const lens = H.speaks().map((x) => x.text.length);
  ok('with a voice on the device the pieces are at most 240 characters', Math.max(...lens) <= 240 && lens.length >= 2, lens);
  H.Speech.choose('Google UK English Female'); H.Speech.cancel(); H.Speech.say(longText, { style: 'read', rate: 1 }); H.advance(600000); const lens2 = H.speaks().slice(lens.length).map((x) => x.text.length);
  ok('with an online voice the pieces are at most 150, so browsers do not cut them off', Math.max(...lens2) <= 150 && lens2.length > lens.length, [lens, lens2]);
  const I = makeEngine(); let rate = 0.85; I.Speech.say('Alpha beta gamma delta epsilon zeta eta theta. Second one follows it.', { style: 'read', settings: () => ({ rate }) }); I.advance(500); rate = 1.3; I.Speech.restart(); I.advance(60000);
  ok('changing the speed while it speaks is heard at once: the sentence is said again at the new speed, and the rest follows', I.speaks().map((x) => x.rate).join() === '0.85,1.3,1.3', I.speaks().map((x) => x.rate));
  const J = makeEngine(); const pdone = []; J.Speech.say('Something else is being said, and goes on for a while.', { style: 'read', rate: 1 }); J.advance(300); J.Speech.preview({ onDone: () => pdone.push(1) }); J.advance(60000);
  ok('a preview stops what was being said and speaks the sample, then says it is done', J.speaks().length === 3 && /Let yourself arrive/.test(J.speaks()[1].text) && /Settle into a position/.test(J.speaks()[2].text) && pdone.length === 1);
  const K = makeEngine({ voices: [] }); K.Speech.say('No voices at all here.', { style: 'read', rate: 1 }); K.advance(5000);
  ok('with no voices listed the device’s own is used (no voice set), in English', K.speaks().length === 1 && K.speaks()[0].voice === null && K.speaks()[0].lang === 'en' && K.Speech.advice().show === false && K.Speech.voices().length === 0);
}
{ /* the older calls still work: Worship together's “Read this aloud” says a reading with speak(text), and the voice lists are what the pages draw */
  const E = makeEngine(); const r = E.Speech.speak('In the beginning was the word, and the word was spoken aloud to all who would listen. And it was heard far and wide among them.'); E.advance(120000);
  ok('speak(text) with no options says a reading sentence by sentence in the voice chosen, and says it has started', r === true && E.speaks().length === 2 && E.speaks().every((x) => x.voice === 'Matilda (Premium)' && x.rate === 0.85 && x.volume === 1) && E.speaks()[1].t - E.ends()[0].t === 494, [r, E.speaks().length, E.speaks()[1] && E.speaks()[1].t - E.ends()[0].t]);
  ok('voices() lists the English voices only, best first; best() is never a novelty voice; all() has every language', E.Speech.voices().length === MAC.filter(lsIsEnglish).length && E.Speech.voices()[0].name === 'Matilda (Premium)' && E.Speech.all().length === MAC.length && E.Speech.best().name === 'Matilda (Premium)');
  const F = makeEngine({ voices: [V('Samantha', 'en-US'), V('Daniel', 'en-GB')] }); ok('with only plain voices the note on better voices is offered, and the best is Samantha', F.Speech.advice().show === true && F.Speech.best().name === 'Samantha' && F.Speech.advice().tier === 'good');
  const G = makeEngine({ voices: [V('Anna', 'de-DE')] }); ok('with no English voice the best is none, and the chosen voice is still the first there is, so something can be said', G.Speech.best() === null && G.Speech.chosen().name === 'Anna');
}
{ /* nothing else speaks, and nothing pauses the browser */
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.js')); const users = files.filter((f) => /SpeechSynthesisUtterance|speechSynthesis\.(speak|pause)|synth\.(speak|pause)\(/.test(fs.readFileSync(path.join(dir, f), 'utf8')));
  ok('only the engine (31-bell-speech.js) makes an utterance or calls the browser’s speak; nobody else, so every voice goes through the same pacing and the same clean-up', users.join() === '31-bell-speech.js', users);
  const eng = fs.readFileSync(path.join(dir, '31-bell-speech.js'), 'utf8');
  ok('the engine never calls the browser’s own pause, which on several systems does not resume', !/synth\.pause\(|speechSynthesis\.pause\(/.test(eng));
  const med = fs.readFileSync(path.join(dir, '68-meditate.js'), 'utf8');
  ok('the guided practices are text by default and the voice is a switch that is off until turned on', /guide: 'text', voiceOn: false/.test(med) && !/guide: Speech\.ok \? 'voice'/.test(med) && /label: 'Add a voice'/.test(med));
  ok('the sit setup sheet and the Meditate page both carry the switch and the shared voice chooser', (med.match(/label: 'Add a voice'/g) || []).length === 2 && (med.match(/voiceChooser\(/g) || []).length === 2);
  const rl = fs.readFileSync(path.join(dir, '6kl-listen.js'), 'utf8');
  ok('the reader’s read-aloud uses the same engine and the same chooser, and keeps no voice list of its own', /Speech\.say\(/.test(rl) && /voiceChooser\(/.test(rl) && !/getVoices/.test(rl) && !/SpeechSynthesisUtterance/.test(rl));
}
console.log(`voice: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
