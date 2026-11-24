/* ═══════════════════════════ 6a · Intention log (a tab inside the Journey) ═══════════════════════════
   Goals are sealed before the fact, come in coin-flipped matched pairs, log minutes and intensity separately,
   are judged by a named person where possible, and the scorecard reports misses, withdrawals and contaminated controls. */
const INT = {
  get() { return Object.assign({ goals: [], rule: null }, store.get('intentions', {})); },
  upd(fn) { const s = INT.get(); fn(s); store.set('intentions', s); return s; },
  minutesFn(goals) { // objective minutes: timed sits tagged with the goal + effort you logged by hand
    const med = {}; MED.log().forEach((l) => { if (l.intention) med[l.intention] = (med[l.intention] || 0) + (l.minutesActual || 0); });
    const by = Object.fromEntries(goals.map((g) => [g.id, (g.efforts || []).reduce((a, e) => a + (e.minutes || 0), 0)]));
    return (id) => Math.round(((med[id] || 0) + (by[id] || 0)) * 10) / 10;
  },
};
const intDaysLeft = (g) => Math.ceil((new Date(g.deadline + 'T23:59:59') - Date.now()) / 864e5);
const intShort = (h) => (h || '').slice(0, 12);
const copyText = async (t, msg) => { try { await navigator.clipboard.writeText(t); toast(msg, 'good'); } catch (e) { toast('Could not copy. Select the text instead.', 'warn'); } };
const INT_RESULT = { yes: 'It happened', partly: 'Partly', no: 'It did not', withdrawn: 'Withdrawn' };
const INT_SIT = [['silence', 'Waiting silence'], ['names', 'Sacred word on the breath'], ['breath', 'Breath anchor'], ['open', 'Open awareness'], ['metta', 'Loving-kindness'], ['rest', 'Deep rest']];

function intGoalCard(g, minsOf) {
  const left = intDaysLeft(g); const overdue = !g.outcome && left < 0; const ok = verifyIntention(g, sha256); const mins = minsOf(g.id);
  const eff = (g.efforts || []).filter((e) => isNum(e.intensity)); const inten = eff.length ? eff.reduce((a, e) => a + e.intensity, 0) / eff.length : NaN;
  const kindBadge = { focus: '<span class="badge good">focus</span>', control: '<span class="badge warn">control: leave alone</span>', solo: '<span class="badge">untested</span>' }[g.kind];
  const touched = controlTouched(g, minsOf);
  return `<article class="card flat igoal" data-id="${g.id}"><div class="spread" style="align-items:flex-start;gap:10px"><div><div class="row tight">${kindBadge}<span class="tag">difficulty ${g.difficulty}/5</span><span class="tag">baseline ${g.baseline}%</span>${g.judge ? `<span class="tag">judge: ${esc(g.judge)}</span>` : ''}</div><h3 style="margin:8px 0 2px;font-size:17px">${esc(g.text)}</h3>
      <div class="small ${overdue ? 'warn' : 'muted'}">${g.outcome ? '' : overdue ? `Deadline ${g.deadline} has passed. Judge it now.` : `By ${g.deadline} · ${left} day${left === 1 ? '' : 's'} left`}</div></div>
      <span class="mono small ${ok ? 'good' : 'bad'}" title="SHA-256 of the sealed fields">${ok ? '✓ sealed' : '✗ seal broken'} ${intShort(g.commit)}…</span></div>
    ${g.kind === 'control' ? `<div class="callout${touched ? ' bad' : ''}" style="margin-top:10px">${icon(touched ? 'warn' : 'info')}<div>${touched ? 'Effort was logged on this control, so the pair is thrown out of the analysis (and shown as contaminated).' : 'Do not pray, meditate or plan around this one. Its job is to show what happens without your focus.'}</div></div>` : `<div class="small t2" style="margin-top:8px"><b>${mins}</b> min logged (timer and manual)${isNum(inten) ? ` · intensity ${inten.toFixed(1)}/5 <span class="muted">(self-rated: the weakest number here)</span>` : ''}</div>`}
    <div class="row tight" style="margin-top:12px">${g.kind !== 'control' ? `<button class="btn sm" data-act="sit">${icon('lotus')}Sit for this…</button><button class="btn sm" data-act="effort">${icon('plus')}Log effort</button>` : ''}<button class="btn sm primary" data-act="judge">${icon('check')}Judge outcome</button><button class="btn sm ghost" data-act="seal">Copy seal</button><button class="btn sm ghost" data-act="reveal">Copy reveal</button><button class="btn sm ghost danger" data-act="withdraw">Withdraw</button></div></article>`;
}

function intScorecard(st, S) {
  const pc = (x) => (isNum(x) ? Math.round(x * 100) + '%' : '·'); const v = intentionVerdict(st);
  const cls = { signal: 'good', none: '', early: '' }[v.level];
  return `<section class="card glow fade-in" style="margin-top:16px"><div class="card-title"><h3>${icon('chart')}Scorecard</h3><span class="tag">${st.goals} goal${st.goals === 1 ? '' : 's'}</span></div>
    <div class="callout ${cls}">${icon(v.level === 'signal' ? 'check' : 'info')}<div>${esc(v.text)}</div></div>
    <div class="grid c2" style="margin-top:14px;align-items:start"><div><div class="eyebrow">Matched pairs (${st.usablePairs} usable of ${st.pairs} sealed)</div>
      <div class="table-wrap"><table class="stat-table"><tr><th></th><th>Control hit</th><th>Control miss</th></tr><tr><th>Focus hit</th><td class="mono">${st.both}</td><td class="mono"><b>${st.fOnly}</b></td></tr><tr><th>Focus miss</th><td class="mono"><b>${st.cOnly}</b></td><td class="mono">${st.neither}</td></tr></table></div>
      <div class="small t2" style="margin-top:8px">Focus goals came true in <b>${pc(st.focusRate)}</b> of pairs, controls in <b>${pc(st.controlRate)}</b>. Only the pairs that differ (bold) carry information: ${st.discordant} so far; at least ${st.minDiscordant} are needed before a clean split could reach p &lt; 0.05. Sign test p = ${st.discordant ? st.signP.toFixed(3) : '·'}.${st.contaminated ? ` <span class="warn">${st.contaminated} pair${st.contaminated === 1 ? '' : 's'} excluded: effort was logged on the control.</span>` : ''}</div></div>
      <div class="stack sm small t2"><div><div class="eyebrow">Against your own baselines</div>Goals you focused on (or ran untested): <b>${st.testedHits}</b> hit of ${st.tested}; your baselines predicted <b>${isNum(st.expectedHits) ? st.expectedHits.toFixed(1) : '·'}</b>.${st.tested ? ` Chance of at least this many with no effect: ${isNum(st.pAtLeast) ? (st.pAtLeast < 0.001 ? '&lt;0.001' : st.pAtLeast.toFixed(3)) : '·'}.` : ''}</div>
        <div><div class="eyebrow">Calibration check</div>Clean controls: <b>${st.controlHits}</b> hit of ${st.controls}; baselines predicted ${isNum(st.controlExpected) ? st.controlExpected.toFixed(1) : '·'}. ${st.controls >= 3 && st.controlHits > st.controlExpected + 1.5 ? '<span class="warn">Controls hit more than your baselines expected, so your baselines may be too low.</span>' : 'If controls hit about as often as you predicted, your baselines are fair.'}</div>
        <div><div class="eyebrow">Minutes (descriptive only)</div>${isNum(st.minutesHit) && isNum(st.minutesMiss) ? `Goals that came true had ${st.minutesHit.toFixed(0)} min on average; those that did not had ${st.minutesMiss.toFixed(0)} min.` : 'Needs both hits and misses among focus goals.'} Minutes show effort, not depth.</div>
        <div><div class="eyebrow">Who judged</div>${st.otherJudged} by someone else, ${st.selfJudged} by you.${st.selfJudged > st.otherJudged ? ' <span class="warn">Self-judged outcomes are weaker evidence. Ask someone to judge.</span>' : ''}</div>
        <div><div class="eyebrow">Nothing hidden</div>${st.open} open · ${st.partly} partly (not scored) · ${st.withdrawn} withdrawn.</div></div></div>
    <div class="hint" style="margin-top:12px">This can show whether goals you focus on come true more often than matched ones you do not. It cannot show effects of group focus on the world at large, and it cannot detect an effect too small for the number of pairs you have.${S.rule ? '' : ' You have not pre-registered what would count as evidence (see above); results read after the fact are easy to over-interpret.'}</div></section>`;
}

function pathIntentionsView(root) {
  const S = INT.get(); const goals = S.goals; const minsOf = INT.minutesFn(goals); const st = intentionStats(goals, minsOf); const body = root.querySelector('#pbody');
  const byDeadline = (a, b) => (a.deadline < b.deadline ? -1 : a.deadline > b.deadline ? 1 : a.created - b.created);
  const open = goals.filter((g) => !g.outcome).sort(byDeadline); const done = goals.filter((g) => g.outcome).sort((a, b) => b.outcome.t - a.outcome.t);
  const tomorrow = isoDay(new Date(Date.now() + 864e5));
  const anyResolved = goals.some((g) => g.outcome);
  body.innerHTML = `<section class="card glow fade-in"><div class="card-title"><h3>${icon('target')}Intentions: a fair test of your own idea</h3></div>
    <p class="t2" style="max-width:72ch">You said consciousness shapes outcomes and that this cannot be measured. It can be <i>tested</i>, even if it cannot be proved: decide what would count, in advance, and let a coin and another person keep you honest. This is how.</p>
    <ol class="small t2" style="max-width:76ch;line-height:1.7"><li><b>Seal it first.</b> Each goal gets a SHA-256 seal (text, deadline, your honest baseline chance, a random salt). It cannot be edited without breaking the seal.</li><li><b>Pairs, and a coin flip.</b> Two goals of similar difficulty. The app flips a fair coin: one gets your focus, the other is left alone as a control.</li><li><b>Effort is two separate numbers.</b> Minutes (from the timer) and intensity (self-rated, the weakest evidence here). Depth is not measured.</li><li><b>Someone else judges</b>, by the deadline. A hit after the deadline counts as a miss.</li><li><b>Everything is reported</b>: misses, withdrawn goals, contaminated controls.</li></ol></section>
    <div class="grid c2" style="margin-top:16px;align-items:start"><section class="card fade-in"><div class="card-title"><h3>${icon('lock')}What would change my mind</h3></div>${S.rule ? `<p style="white-space:pre-wrap">${esc(S.rule.text)}</p><div class="hint">Locked ${fmt.date(S.rule.t)} · seal ${intShort(S.rule.commit)}… This cannot be edited, so it cannot be bent to fit the results.</div>` : `<p class="small t2">Before you collect data, write what result would convince you that focus helps, and what would convince you it does not. For example: "At least 8 of 12 focus goals hit, with controls near baseline, judged by someone else."</p><textarea class="textarea" id="intRule" placeholder="I will count this as evidence for focus if…&#10;I will count it as evidence against if…"></textarea><div class="row" style="margin-top:10px"><button class="btn primary" id="intLock">${icon('lock')}Lock it in</button></div>${anyResolved ? '<div class="callout warn" style="margin-top:10px">' + icon('warn') + '<div>You already have resolved goals. A rule written now is no longer pre-registered.</div></div>' : ''}`}</section>
      <section class="card fade-in"><div class="card-title"><h3>${icon('plus')}Add goals</h3></div><div class="stack sm"><div class="field"><label class="lbl" for="intMode">What are you adding?</label><select class="select" id="intMode"><option value="pair">A matched pair (recommended: this is the fair test)</option><option value="solo">A single goal (tracked, but untested)</option></select></div>
        <div class="field"><label class="lbl" for="intA" id="intALbl">Goal A</label><input class="input" id="intA" maxlength="140" placeholder="Something specific and checkable"></div><div class="field" id="intBWrap"><label class="lbl" for="intB">Goal B <span class="muted">(similar difficulty to A)</span></label><input class="input" id="intB" maxlength="140" placeholder="Something comparable you would also like"></div>
        <div class="grid c3" style="gap:10px"><div class="field"><label class="lbl" for="intDate">Deadline</label><input class="input" type="date" id="intDate" min="${tomorrow}"></div><div class="field"><label class="lbl" for="intDiff">Difficulty</label><select class="select" id="intDiff">${[1, 2, 3, 4, 5].map((n) => `<option value="${n}"${n === 3 ? ' selected' : ''}>${n}/5</option>`).join('')}</select></div><div class="field"><label class="lbl" for="intJudge">Judge <span class="muted">(a person)</span></label><input class="input" id="intJudge" maxlength="40" placeholder="Name"></div></div>
        <div class="grid c2" style="gap:10px"><div class="field"><label class="lbl" for="intBaseA">A: chance it happens anyway (%)</label><input class="input" type="number" id="intBaseA" min="0" max="100" value="20"></div><div class="field" id="intBaseBWrap"><label class="lbl" for="intBaseB">B: chance it happens anyway (%)</label><input class="input" type="number" id="intBaseB" min="0" max="100" value="20"></div></div>
        <div class="hint">"Chance it happens anyway" is your honest estimate with no special focus at all. It is what makes a hit meaningful.</div><div class="row"><button class="btn primary" id="intAdd">${icon('lock')}Seal and assign</button></div></div></section></div>
    ${goals.length ? intScorecard(st, S) : ''}
    <h2 style="margin:26px 0 12px">Open goals${open.length ? ` · ${open.length}` : ''}</h2>${open.length ? `<div class="grid auto-lg fade-in">${open.map((g) => intGoalCard(g, minsOf)).join('')}</div>` : '<p class="t2">Nothing open. Add a pair above.</p>'}
    ${done.length ? `<section class="card fade-in" style="margin-top:22px"><div class="card-title"><h3>Resolved</h3><button class="btn sm" id="intExport">${icon('download')}Export (JSON)</button></div><div class="table-wrap"><table class="stat-table"><tr><th>Goal</th><th>Kind</th><th>Result</th><th>Date</th><th>Judge</th><th>Min</th><th>Base</th><th>Seal</th></tr>${done.map((g) => `<tr><td>${esc(g.text)}${g.outcome.note ? `<div class="small muted">${esc(g.outcome.note)}</div>` : ''}</td><td class="small">${g.kind}</td><td>${INT_RESULT[g.outcome.result]}${g.outcome.result === 'yes' && intentionScore(g) === 0 ? ' <span class="warn small">(late: scored as a miss)</span>' : ''}</td><td class="mono small">${esc(g.outcome.date || '·')}</td><td class="small">${esc(g.outcome.by || 'self')}</td><td class="mono">${minsOf(g.id)}</td><td class="mono">${g.baseline}%</td><td class="mono small ${verifyIntention(g, sha256) ? '' : 'bad'}">${intShort(g.commit)}</td></tr>`).join('')}</table></div></section>` : ''}
    <div class="hint" style="margin-top:14px">Stored only in this browser (included in Setup → export). Share a seal with a friend now; share the reveal after the deadline so they can check it matches.</div>
    <p class="onward"><a href="#/meditate">Meditate: a guided sit to go with a goal →</a></p>`;      /* SA-16: the page ends with one way on, to the guided sits (each goal's “Sit for this” opens the same sits) */

  const mode = $('#intMode', body); const syncMode = () => { const pair = mode.value === 'pair'; $('#intBWrap', body).style.display = pair ? '' : 'none'; $('#intBaseBWrap', body).style.display = pair ? '' : 'none'; $('#intALbl', body).textContent = pair ? 'Goal A' : 'Goal'; };
  mode.addEventListener('change', syncMode); syncMode();
  const lock = $('#intLock', body); if (lock) lock.addEventListener('click', async () => {
    const text = $('#intRule', body).value.trim(); if (text.length < 20) { toast('Write a little more: what would count as evidence, either way?', 'warn'); return; }
    if (!(await confirmBox('Lock this in?', '<p>You will not be able to edit it afterwards. That is the point.</p>', 'Lock it in'))) return;
    const salt = randHex(6); INT.upd((s) => { s.rule = { text, t: Date.now(), salt, commit: sha256(salt + ':' + text) }; }); Router.render();
  });
  $('#intAdd', body).addEventListener('click', async () => {
    const pair = mode.value === 'pair'; const A = $('#intA', body).value.trim(); const B = pair ? $('#intB', body).value.trim() : ''; const deadline = $('#intDate', body).value;
    const diff = +$('#intDiff', body).value; const judge = $('#intJudge', body).value.trim(); const bA = +$('#intBaseA', body).value; const bB = pair ? +$('#intBaseB', body).value : 0;
    if (!A || (pair && !B)) { toast('Write the goal' + (pair ? 's' : '') + ' first.', 'warn'); return; }
    if (pair && A.toLowerCase() === B.toLowerCase()) { toast('The two goals need to be different.', 'warn'); return; }
    if (!deadline || deadline < tomorrow) { toast('Choose a deadline after today.', 'warn'); return; }
    if (![bA, ...(pair ? [bB] : [])].every((x) => isNum(x) && x >= 0 && x <= 100)) { toast('Baseline chances must be between 0 and 100.', 'warn'); return; }
    const mk = (text, kind, baseline) => ({ id: uid(), text, deadline, baseline, difficulty: diff, kind, pair: null, created: Date.now(), salt: randHex(6), judge, efforts: [], outcome: null });
    const g1 = mk(A, 'solo', bA); const added = [g1]; let msg = '';
    if (pair) { const g2 = mk(B, 'solo', bB); const [k1, k2] = pairAssign(randInt); g1.kind = k1; g2.kind = k2; g1.pair = g2.id; g2.pair = g1.id; added.push(g2); const f = g1.kind === 'focus' ? g1 : g2; const c = f === g1 ? g2 : g1; msg = `<p><b>Focus on:</b> ${esc(f.text)}</p><p><b>Leave alone (the control):</b> ${esc(c.text)}</p><p class="small t2">A fair coin decided. If you pray, meditate or plan around the control, the pair is thrown out of the analysis.</p>`; }
    else msg = `<p>${esc(g1.text)}</p><p class="small t2">Tracked, but with no control it cannot show an effect.</p>`;
    added.forEach((g) => { g.commit = sealIntention(g, sha256); });
    INT.upd((s) => { s.goals.push(...added); });
    await modal({ title: pair ? 'Sealed. The coin has spoken.' : 'Sealed.', html: `${msg}<div class="hint">Seal${added.length > 1 ? 's' : ''}: <span class="mono">${added.map((g) => intShort(g.commit)).join(' · ')}…</span><br>Use "Copy seal" on a goal to give a friend the full hash today.</div>`, actions: [{ label: 'Got it', kind: 'primary', value: true }] });
    Router.render();
  });
  const exp = $('#intExport', body); if (exp) exp.addEventListener('click', () => download('lamplighter-intentions.json', JSON.stringify(INT.get(), null, 2)));

  body.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-act]'); if (!b) return; const card = b.closest('.igoal'); const id = card && card.dataset.id; const g = id && INT.get().goals.find((x) => x.id === id); if (!g) return; const act = b.dataset.act;
    if (act === 'seal') return copyText(`The Lamplighter Project intention seal\nid ${g.id}\nsealed ${new Date(g.created).toISOString()}\ndeadline ${g.deadline}\nSHA-256 ${g.commit}`, 'Seal copied. Give it to a friend now.');
    if (act === 'reveal') return copyText(`The Lamplighter Project intention reveal\ncanonical ${intentionCanon(g)}\nSHA-256 ${g.commit}\n(Hash the canonical line with SHA-256: it should equal the seal given earlier.)`, 'Reveal copied. Share it after the deadline.');
    if (act === 'effort') {
      const r = await modal({ title: 'Log effort', html: `<p class="small t2">Minutes and intensity are separate. Minutes are what you actually spent; intensity is how hard you felt you focused, which is a self-rating and the weakest number here.</p><div class="field"><label class="lbl" for="eMin">Minutes</label><input class="input" id="eMin" type="number" min="1" max="600" value="10"></div><div class="field" style="margin-top:10px"><label class="lbl" for="eInt">Intensity (self-rated)</label><select class="select" id="eInt"><option value="">Skip</option>${[1, 2, 3, 4, 5].map((n) => `<option>${n}</option>`).join('')}</select></div><div class="field" style="margin-top:10px"><label class="lbl" for="eNote">Note</label><input class="input" id="eNote" maxlength="140"></div>`, actions: [{ label: 'Cancel', kind: 'ghost', value: null }, { label: 'Save', kind: 'primary', collect: (back) => ({ minutes: +back.querySelector('#eMin').value, intensity: back.querySelector('#eInt').value ? +back.querySelector('#eInt').value : null, note: back.querySelector('#eNote').value.trim() }) }] });
      if (r && isNum(r.minutes) && r.minutes > 0) { INT.upd((s) => { s.goals.find((x) => x.id === id).efforts.push({ t: Date.now(), minutes: r.minutes, intensity: r.intensity, note: r.note }); }); Router.render(); }
      return;
    }
    if (act === 'sit') {
      const pid = await modal({ title: 'Sit for this goal', html: `<p class="small t2">Pick the kind of sit. The timer records the minutes against this goal automatically.</p><div class="field"><label class="lbl" for="sPr">Practice</label><select class="select" id="sPr">${INT_SIT.map(([k, n]) => `<option value="${k}">${esc(n)}</option>`).join('')}</select></div>`, actions: [{ label: 'Cancel', kind: 'ghost', value: null }, { label: 'Next', kind: 'primary', collect: (back) => back.querySelector('#sPr').value }] });
      if (pid) await openSheet(pid, undefined, null, { intention: id });
      return;
    }
    if (act === 'judge' || act === 'withdraw') {
      const w = act === 'withdraw';
      const r = await modal({ title: w ? 'Withdraw this goal?' : 'Judge the outcome', html: w ? `<p class="small t2">Withdrawn goals stay in the scorecard as "withdrawn" and the pair is excluded. You cannot delete a sealed goal: that would let misses disappear.</p><div class="field"><label class="lbl" for="jNote">Why?</label><input class="input" id="jNote" maxlength="140"></div>` : `<p class="small t2">Did it happen by <b>${esc(g.deadline)}</b>? If someone else is judging, let them choose and enter their name.</p><div class="field"><label class="lbl" for="jRes">Result</label><select class="select" id="jRes"><option value="yes">It happened</option><option value="no">It did not</option><option value="partly">Partly (not scored)</option></select></div><div class="field" style="margin-top:10px"><label class="lbl" for="jDate">Date it happened (or today)</label><input class="input" type="date" id="jDate" value="${isoDay()}"></div><div class="field" style="margin-top:10px"><label class="lbl" for="jBy">Judged by</label><input class="input" id="jBy" maxlength="40" value="${esc(g.judge || '')}" placeholder="A name, or leave empty for yourself"></div><div class="field" style="margin-top:10px"><label class="lbl" for="jNote">Evidence or note</label><input class="input" id="jNote" maxlength="140"></div>`,
        actions: [{ label: 'Cancel', kind: 'ghost', value: null }, { label: w ? 'Withdraw' : 'Save judgement', kind: w ? 'danger' : 'primary', collect: (back) => (w ? { result: 'withdrawn', note: back.querySelector('#jNote').value.trim() } : { result: back.querySelector('#jRes').value, date: back.querySelector('#jDate').value, by: back.querySelector('#jBy').value.trim() || 'self', note: back.querySelector('#jNote').value.trim() }) }] });
      if (r) { INT.upd((s) => { s.goals.find((x) => x.id === id).outcome = Object.assign({ t: Date.now(), date: isoDay(), by: 'self' }, r); }); Router.render(); }
    }
  });
}
