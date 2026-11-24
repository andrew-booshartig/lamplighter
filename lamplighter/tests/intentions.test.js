// Run: node tests/intentions.test.js — sealing, fair assignment and the scorecard maths
const crypto = require('crypto');
const { intentionCanon, sealIntention, verifyIntention, pairAssign, intentionScore, controlTouched, signTestP, pbTail, intentionStats, intentionVerdict, MIN_DISCORDANT } = require('../src/js/2b-intentions-core.js');
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => { if (cond) pass++; else { fail++; console.log('FAIL', name, extra); } };
const near = (a, b, e = 1e-9) => Math.abs(a - b) < e;

/* sealing */
const g = { id: 'a', text: 'Get the permit approved', deadline: '2027-03-01', baseline: 30, difficulty: 3, kind: 'focus', pair: 'b', created: 1700000000000, salt: 'deadbeef0102', efforts: [], outcome: null };
g.commit = sealIntention(g, sha);
ok('commit is a 64-hex SHA-256', /^[0-9a-f]{64}$/.test(g.commit));
ok('a sealed goal verifies', verifyIntention(g, sha));
for (const [k, v] of [['text', 'Get the permit approved quickly'], ['deadline', '2027-03-02'], ['baseline', 31], ['difficulty', 4], ['kind', 'control'], ['pair', 'c'], ['created', 1700000000001], ['salt', 'deadbeef0103']]) ok(`changing ${k} breaks the seal`, !verifyIntention(Object.assign({}, g, { [k]: v }), sha));
ok('efforts and outcome are not sealed (they accrue later)', verifyIntention(Object.assign({}, g, { efforts: [{ minutes: 5 }], outcome: { result: 'yes' } }), sha));
ok('same salt, different text → different hash', sealIntention(Object.assign({}, g, { text: 'x' }), sha) !== g.commit);
ok('canonical form is stable', intentionCanon(g) === JSON.stringify(['Get the permit approved', '2027-03-01', 30, 3, 'focus', 'b', 1700000000000, 'deadbeef0102']));

/* fair assignment */
{ let f = 0, N = 20000; for (let i = 0; i < N; i++) if (pairAssign((n) => crypto.randomInt(n))[0] === 'focus') f++;
  ok('assignment is a fair coin (about 50% focus first)', Math.abs(f / N - 0.5) < 0.02, f / N);
  ok('every pair has exactly one focus and one control', [0, 1].every((v) => { const a = pairAssign(() => v); return a.includes('focus') && a.includes('control') && a.length === 2; })); }

/* scoring rules */
const mk = (id, kind, o = {}) => Object.assign({ id, text: id, deadline: '2027-01-31', baseline: 20, difficulty: 3, kind, pair: null, created: 1, salt: 's', efforts: [], outcome: null }, o);
const out = (result, date = '2027-01-15', by = 'Sam') => ({ result, date, by, t: 1 });
ok('open goals are not scored', intentionScore(mk('x', 'focus')) === null);
ok('yes by the deadline = hit', intentionScore(mk('x', 'focus', { outcome: out('yes') })) === 1);
ok('yes ON the deadline = hit', intentionScore(mk('x', 'focus', { outcome: out('yes', '2027-01-31') })) === 1);
ok('yes AFTER the deadline = miss', intentionScore(mk('x', 'focus', { outcome: out('yes', '2027-02-01') })) === 0);
ok('no = miss', intentionScore(mk('x', 'focus', { outcome: out('no') })) === 0);
ok('"partly" and withdrawn are not scored', intentionScore(mk('x', 'focus', { outcome: out('partly') })) === null && intentionScore(mk('x', 'focus', { outcome: out('withdrawn') })) === null);
ok('a control with logged effort is contaminated', controlTouched(mk('c', 'control', { efforts: [{ minutes: 5 }] })) && controlTouched(mk('c', 'control'), () => 3) && !controlTouched(mk('c', 'control')) && !controlTouched(mk('f', 'focus', { efforts: [{ minutes: 5 }] })));

/* statistics */
ok('sign test: 7 vs 1 → p = 2·(1+8)/256', near(signTestP(7, 1), 18 / 256), signTestP(7, 1));
ok('sign test: 5 vs 0 → p = 0.0625; 6 vs 0 → 0.03125', near(signTestP(5, 0), 0.0625) && near(signTestP(6, 0), 0.03125));
ok('sign test: even split → p = 1; nothing → p = 1', near(signTestP(4, 4), 1) && signTestP(0, 0) === 1);
ok('MIN_DISCORDANT is the smallest n with p < 0.05', signTestP(MIN_DISCORDANT, 0) < 0.05 && signTestP(MIN_DISCORDANT - 1, 0) >= 0.05);
ok('Poisson-binomial with equal p matches the binomial', near(pbTail([0.3, 0.3, 0.3, 0.3], 2), 1 - 0.7 ** 4 - 4 * 0.3 * 0.7 ** 3), pbTail([0.3, 0.3, 0.3, 0.3], 2));
ok('Poisson-binomial edge cases', near(pbTail([0.5, 0.2], 0), 1) && near(pbTail([0.5, 0.2], 3), 0) && near(pbTail([0.5, 0.2], 2), 0.1));
ok('Poisson-binomial with unequal p (hand-computed)', near(pbTail([0.9, 0.1], 1), 1 - 0.1 * 0.9), pbTail([0.9, 0.1], 1));

function pairSet(rows) { // rows: [focusResult, controlResult] with 'yes'/'no'
  const goals = []; rows.forEach(([f, c], i) => { goals.push(mk('f' + i, 'focus', { pair: 'c' + i, baseline: 20, outcome: out(f) })); goals.push(mk('c' + i, 'control', { pair: 'f' + i, baseline: 20, outcome: out(c) })); }); return goals;
}
{ const rows = [['yes', 'no'], ['yes', 'no'], ['yes', 'no'], ['yes', 'no'], ['yes', 'no'], ['yes', 'no'], ['yes', 'no'], ['no', 'yes'], ['yes', 'yes'], ['no', 'no']];
  const st = intentionStats(pairSet(rows));
  ok('pairs counted', st.pairs === 10 && st.resolvedPairs === 10 && st.usablePairs === 10);
  ok('2×2 table', st.both === 1 && st.fOnly === 7 && st.cOnly === 1 && st.neither === 1, JSON.stringify(st));
  ok('rates', near(st.focusRate, 0.8) && near(st.controlRate, 0.2));
  ok('sign test p carried through', near(st.signP, 18 / 256));
  ok('expected hits from baselines', near(st.expectedHits, 2.0) && st.testedHits === 8, st.expectedHits + ' ' + st.testedHits);
  ok('8 hits of 10 at 20% each is very unlikely by chance', st.pAtLeast < 0.001, st.pAtLeast);
  ok('control calibration reported', st.controls === 10 && st.controlHits === 2 && near(st.controlExpected, 2.0));
  const v = intentionVerdict(st); ok('verdict: not significant at p=0.07, says so', v.level === 'none' && /No difference detected/.test(v.text), v.text);
  const strong = intentionStats(pairSet(Array(7).fill(['yes', 'no'])).concat([])); const v2 = intentionVerdict(strong); ok('verdict: 7–0 is a signal in favour', v2.level === 'signal' && /beat their matched controls/.test(v2.text), v2.text);
  const rev = intentionVerdict(intentionStats(pairSet(Array(7).fill(['no', 'yes'])))); ok('verdict: 0–7 is reported honestly as the reverse', rev.level === 'signal' && /controls did better/.test(rev.text) && /not support/.test(rev.text)); }
{ const st = intentionStats(pairSet([['yes', 'no'], ['yes', 'no']])); const v = intentionVerdict(st); ok('verdict: 2 pairs is "too early"', v.level === 'early' && st.usablePairs === 2); }
{ const st = intentionStats(pairSet([['yes', 'no'], ['yes', 'no'], ['yes', 'no'], ['no', 'no'], ['no', 'no'], ['yes', 'yes']])); const v = intentionVerdict(st); ok('verdict: 3 discordant of 6 pairs cannot reach significance', v.level === 'early' && /Only 3 pairs/.test(v.text), v.text); }
{ const goals = pairSet([['yes', 'no'], ['yes', 'no']]); goals[1].efforts = [{ minutes: 10 }]; const st = intentionStats(goals);
  ok('a contaminated control removes the pair from the analysis but is reported', st.usablePairs === 1 && st.contaminated === 1 && st.resolvedPairs === 2); }
{ const goals = pairSet([['yes', 'no']]); goals.push(mk('w', 'solo', { outcome: out('withdrawn') }), mk('p', 'solo', { outcome: out('partly') }), mk('o', 'solo'));
  const st = intentionStats(goals, (id) => (id === 'f0' ? 40 : 0)); ok('withdrawn, partly and open are tallied and not hidden', st.withdrawn === 1 && st.partly === 1 && st.open === 1, JSON.stringify(st));
  ok('minutes feed the dose comparison', near(st.minutesHit, 40) && !isFinite(st.minutesMiss) === true || near(st.minutesHit, 40)); }
{ const goals = [mk('a', 'solo', { outcome: out('yes', '2027-01-10', 'self') }), mk('b', 'solo', { outcome: out('no', '2027-01-10', 'Maria') })]; const st = intentionStats(goals); ok('self-judged vs judged by someone else is separated', st.selfJudged === 1 && st.otherJudged === 1); }
{ const st = intentionStats([]); ok('empty log is safe', st.goals === 0 && st.usablePairs === 0 && intentionVerdict(st).level === 'early' && isNaN(st.focusRate)); }
{ const goals = pairSet([['yes', 'no'], ['no', 'yes']]).map((x) => Object.assign({}, x, { baseline: 50 })); const st = intentionStats(goals); ok('a pair is counted once, from the focus side', st.pairs === 2); }

console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
