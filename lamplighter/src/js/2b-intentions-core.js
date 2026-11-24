/* ═══════════════════════════ 2b · Intention log: pure logic (unit-tested in tests/intentions.test.js) ═══════════════════════════
   A fair way to find out whether focused intention is followed by outcomes beyond chance:
   · every goal is SEALED before the fact (SHA-256 of its text, deadline, baseline chance, kind and a random salt);
   · goals come in matched PAIRS, and a coin flip (not you) decides which one gets your focus and which is the control;
   · effort is logged as separate numbers: minutes (objective, from the timer) and intensity (self-rated, weak);
   · outcomes are judged by a named person where possible, and late hits count as misses;
   · the scorecard reports misses, withdrawn goals and contaminated controls too — nothing is hidden. */

const intentionCanon = (g) => JSON.stringify([g.text, g.deadline, g.baseline, g.difficulty, g.kind, g.pair || '', g.created, g.salt]);
const sealIntention = (g, sha) => sha(intentionCanon(g));
const verifyIntention = (g, sha) => !!g.commit && sealIntention(g, sha) === g.commit;

/* which of a new pair gets the focus: decided by a fair coin, never by the user */
const pairAssign = (randInt) => (randInt(2) === 0 ? ['focus', 'control'] : ['control', 'focus']);

/* 1 = it happened by the deadline, 0 = it did not (or happened late), null = not scored (open, "partly", withdrawn) */
function intentionScore(g) {
  const o = g.outcome; if (!o) return null;
  if (o.result === 'no') return 0;
  if (o.result !== 'yes') return null;
  return o.date && g.deadline && o.date > g.deadline ? 0 : 1;
}
const controlTouched = (g, minutesOf = () => 0) => g.kind === 'control' && ((g.efforts && g.efforts.length > 0) || minutesOf(g.id) > 0);

/* exact two-sided sign test on discordant pairs (fair-coin null) */
function signTestP(b, c) {
  const n = b + c; if (!n) return 1; const k = Math.min(b, c); let s = 0, comb = 1;
  for (let i = 0; i <= k; i++) { s += comb; comb = (comb * (n - i)) / (i + 1); }
  return Math.min(1, (2 * s) / Math.pow(2, n));
}
/* P(X ≥ k) where X is a sum of independent Bernoulli(p_i): "how often would this many hits happen if every goal just had its baseline chance?" */
function pbTail(ps, k) {
  let d = [1]; ps.forEach((p) => { const nx = new Array(d.length + 1).fill(0); d.forEach((v, i) => { nx[i] += v * (1 - p); nx[i + 1] += v * p; }); d = nx; });
  return d.slice(Math.max(0, k)).reduce((a, b) => a + b, 0);
}
const MIN_DISCORDANT = 6; // with fewer than 6 discordant pairs even a perfect split cannot reach p < 0.05 (2/2^5 = 0.0625)

function intentionStats(goals, minutesOf = () => 0) {
  const byId = Object.fromEntries(goals.map((g) => [g.id, g])); const sc = intentionScore;
  const pairs = []; const seen = new Set();
  goals.forEach((g) => { if (g.kind !== 'focus' || !g.pair || seen.has(g.id)) return; const c = byId[g.pair]; if (!c || c.kind !== 'control') return; seen.add(g.id); pairs.push({ focus: g, control: c }); });
  const resolved = pairs.filter((p) => sc(p.focus) !== null && sc(p.control) !== null);
  const clean = resolved.filter((p) => !controlTouched(p.control, minutesOf));
  let both = 0, fOnly = 0, cOnly = 0, neither = 0;
  clean.forEach((p) => { const f = sc(p.focus), c = sc(p.control); if (f && c) both++; else if (f) fOnly++; else if (c) cOnly++; else neither++; });
  const n = clean.length;
  const tested = goals.filter((g) => (g.kind === 'focus' || g.kind === 'solo') && sc(g) !== null);
  const ctrls = goals.filter((g) => g.kind === 'control' && sc(g) !== null && !controlTouched(g, minutesOf));
  const exp = (arr) => arr.reduce((a, g) => a + g.baseline / 100, 0); const hits = (arr) => arr.reduce((a, g) => a + sc(g), 0);
  const ps = tested.map((g) => g.baseline / 100); const obs = hits(tested);
  const hitMin = tested.filter((g) => sc(g) === 1).map((g) => minutesOf(g.id)); const missMin = tested.filter((g) => sc(g) === 0).map((g) => minutesOf(g.id));
  const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN);
  const scored = goals.filter((g) => sc(g) !== null);
  return {
    goals: goals.length, open: goals.filter((g) => !g.outcome).length, withdrawn: goals.filter((g) => g.outcome && g.outcome.result === 'withdrawn').length, partly: goals.filter((g) => g.outcome && g.outcome.result === 'partly').length,
    selfJudged: scored.filter((g) => !g.outcome.by || g.outcome.by === 'self').length, otherJudged: scored.filter((g) => g.outcome.by && g.outcome.by !== 'self').length,
    pairs: pairs.length, resolvedPairs: resolved.length, usablePairs: n, contaminated: resolved.length - n, both, fOnly, cOnly, neither, discordant: fOnly + cOnly,
    signP: signTestP(fOnly, cOnly), minDiscordant: MIN_DISCORDANT,
    focusRate: n ? (both + fOnly) / n : NaN, controlRate: n ? (both + cOnly) / n : NaN,
    tested: tested.length, testedHits: obs, expectedHits: exp(tested), pAtLeast: tested.length ? pbTail(ps, obs) : NaN, pAtMost: tested.length ? 1 - pbTail(ps, obs + 1) : NaN,
    controls: ctrls.length, controlHits: hits(ctrls), controlExpected: exp(ctrls),
    minutesHit: mean(hitMin), minutesMiss: mean(missMin),
  };
}

/* a plain-language reading that is as willing to say "nothing here" as "something here" */
function intentionVerdict(st) {
  if (st.usablePairs < 5) return { level: 'early', text: `Too early to say anything: ${st.usablePairs} usable matched pair${st.usablePairs === 1 ? '' : 's'} so far. Keep going; ten or more pairs is where a pattern starts to mean something, and thirty is better.` };
  if (st.discordant < st.minDiscordant) return { level: 'early', text: `Only ${st.discordant} pair${st.discordant === 1 ? '' : 's'} came out different (one hit, one miss). With fewer than ${st.minDiscordant}, even a perfect split cannot reach p < 0.05, so this cannot yet separate focus from chance.` };
  if (st.signP < 0.05) return st.fOnly > st.cOnly
    ? { level: 'signal', text: `Focus goals beat their matched controls (${st.fOnly} vs ${st.cOnly} in the pairs that differed, p = ${st.signP.toFixed(3)}). That is worth taking seriously. Before concluding anything, check the calibration line below, how many were judged by someone else, and whether you could repeat it.` }
    : { level: 'signal', text: `The controls did better than the focus goals (${st.cOnly} vs ${st.fOnly} in the pairs that differed, p = ${st.signP.toFixed(3)}). Whatever this means, it is not support for focus helping.` };
  return { level: 'none', text: `No difference detected between focus and control goals (${st.fOnly} vs ${st.cOnly} in the pairs that differed, p = ${st.signP.toFixed(2)}). That does not prove there is no effect, only that this test did not see one. More pairs make it more sensitive.` };
}

if (typeof module !== 'undefined' && module.exports) module.exports = { intentionCanon, sealIntention, verifyIntention, pairAssign, intentionScore, controlTouched, signTestP, pbTail, intentionStats, intentionVerdict, MIN_DISCORDANT };
