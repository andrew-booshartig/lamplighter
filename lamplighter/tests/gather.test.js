// Run: node tests/gather.test.js — the decentralised core: packs, signatures, hostile input, service timing, templates, circles
const fs = require('fs'); const path = require('path');
global.REFS = {};
const { PRACTICES } = require('../src/js/23-data-meditation.js'); global.PRACTICES = PRACTICES;
const dir = path.join(__dirname, '../src/js');
const files = fs.readdirSync(dir).filter((f) => /^(24|25|26|27|28|29|2[a-z])-/.test(f)).sort();
const src = files.map((f) => fs.readFileSync(path.join(dir, f), 'utf8').replace(/\nif \(typeof module !== 'undefined' && module\.exports\)[^\n]*/g, '')).join('\n');
const M = new Function(src + '\nreturn { PATH_STATIONS, LIB_BY_ID, LIB_COLLECTIONS: typeof LIB_COLLECTIONS === "undefined" ? null : LIB_COLLECTIONS, PACK_PREFIX, b64u, packEncode, packDecode, packText, packFromText, packLink, newIdentity, keyFingerprint, signPack, verifyPack, STEP_TYPES, stepSec, sanitizeService, serviceTimeline, serviceSeconds, whereAt, fmtClock, SERVICE_TEMPLATES, sanitizeCircle, circleWeekNow, circleStation, circleMeetingDay, circleMeeting, sanitizeReflection, sanitizeThread, makePack, openPack, gCanonical };')();
let pass = 0, fail = 0; const ok = (n, c, x = '') => { if (c) pass++; else { fail++; console.log('FAIL', n, typeof x === 'string' ? x : JSON.stringify(x).slice(0, 300)); } };
const rejects = async (n, p) => { try { await p; ok(n, false, 'did not throw'); } catch (e) { ok(n, true); } };

(async () => {
  /* encoding */
  const svc = { id: 'abc', title: 'A “quoted” gathering — with ünïcode and 日本語', steps: [{ t: 'welcome', text: 'Hello ' + 'world '.repeat(300) }, { t: 'silence', sec: 120 }], note: 'n' };
  const code = await M.packEncode({ v: 1, kind: 'service', body: svc });
  ok('compressed pack starts with z and is much smaller than the JSON', code[0] === 'z' && code.length < JSON.stringify(svc).length / 3, [code.length, JSON.stringify(svc).length]);
  ok('pack code is URL-safe and chat-safe', /^[zj][A-Za-z0-9_-]+$/.test(code));
  ok('pack round-trips exactly, including unicode', JSON.stringify((await M.packDecode(code)).body) === JSON.stringify(svc));
  const small = await M.packEncode({ a: 1 }); ok('a tiny pack falls back to plain encoding', small[0] === 'j' && (await M.packDecode(small)).a === 1);
  ok('text wrapper is found inside a chat message', M.packFromText(`Hi all! ${M.packText(code)} see you Sunday`) === code && M.packFromText('hello') === null && M.packFromText(code) === code);
  ok('links put the pack in the fragment, replacing any old fragment', M.packLink('https://example.org/app/Lamplighter.html#/path/today', 'zabc') === 'https://example.org/app/Lamplighter.html#/gather/open?p=zabc');
  await rejects('garbage is rejected', M.packDecode('zzzz!!!'));
  await rejects('an unknown format letter is rejected', M.packDecode('qabcdefgh'));
  await rejects('truncated compressed data is rejected', M.packDecode(code.slice(0, 20)));
  await rejects('empty input is rejected', M.packDecode(''));

  /* identity and signatures */
  const me = await M.newIdentity(); const fp = await M.keyFingerprint(me.pub);
  ok('a fingerprint is six hex pairs in three groups', /^[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}$/.test(fp), fp);
  ok('the same key always gives the same fingerprint and another key a different one', fp === await M.keyFingerprint(me.pub) && fp !== await M.keyFingerprint((await M.newIdentity()).pub));
  const base = { v: 1, kind: 'reflection', body: { circle: 'c1', week: 2, who: 'Maria', text: 'It stayed with me.', t: 5 }, t: 9, by: 'Maria' };
  const signed = await M.signPack(me, base); const v = await M.verifyPack(signed);
  ok('a signed pack verifies and names the signer', v.ok && v.fp === fp, v);
  ok('key order in the JSON does not matter', (await M.verifyPack(JSON.parse(JSON.stringify(signed, ['v', 'kind', 'body', 'circle', 'week', 'who', 'text', 't', 'by', 'key', 'kty', 'crv', 'x', 'y', 'sig'])))).ok);
  const tampered = JSON.parse(JSON.stringify(signed)); tampered.body.text = 'Something else entirely.';
  ok('changing one word breaks the signature', (await M.verifyPack(tampered)).reason === 'altered');
  const renamed = JSON.parse(JSON.stringify(signed)); renamed.by = 'Joseph'; ok('changing the author breaks the signature', !(await M.verifyPack(renamed)).ok);
  const other = await M.newIdentity(); const swapped = JSON.parse(JSON.stringify(signed)); swapped.key = other.pub; ok('swapping in another key breaks the signature', !(await M.verifyPack(swapped)).ok);
  ok('an unsigned pack is reported as unsigned, not as valid', (await M.verifyPack(base)).reason === 'unsigned');
  ok('a damaged signature does not throw', !(await M.verifyPack(Object.assign({}, signed, { sig: 'AAAA' }))).ok && !(await M.verifyPack(Object.assign({}, signed, { key: { kty: 'EC' } }))).ok);

  /* opening packs from strangers: sanitised, size-limited, and never trusted */
  const opened = await M.openPack(await M.makePack('service', { title: 'T', steps: [{ t: 'welcome', text: 'hi' }] }, { identity: me, by: 'Maria' }));
  ok('a signed service opens as verified, with the sender’s name and fingerprint', opened.kind === 'service' && opened.verified && opened.fp === fp && opened.by === 'Maria' && opened.body.steps.length === 1, opened);
  const open2 = await M.openPack(await M.makePack('service', { title: 'T', steps: [{ t: 'welcome', text: 'hi' }] })); ok('an unsigned service opens as not verified', !open2.verified && open2.reason === 'unsigned');
  const evil = await M.openPack(await M.packEncode({ v: 1, kind: 'service', body: { title: '<img src=x onerror=alert(1)>'.repeat(20), startAt: 'soon', steps: [{ t: 'welcome', text: '<script>alert(1)</script>' + 'x'.repeat(9000), sec: 99999999, extra: 'ignored' }, { t: 'rm -rf', text: 'no' }, null, 5, { t: 'silence', sec: -5 }].concat(Array.from({ length: 60 }, () => ({ t: 'bless' }))) } }));
  ok('hostile service: unknown steps dropped, text capped, seconds clamped, extras ignored, steps capped at 40', evil.body.steps.length === 40 && evil.body.steps[0].text.length === 5000 && evil.body.steps[0].sec === 7200 && !('extra' in evil.body.steps[0]) && evil.body.steps[1].sec === 10 && evil.body.startAt === null && evil.body.title.length <= 120, evil.body.steps.length);
  ok('hostile text is kept as plain text for the view to escape (never stripped into something else)', evil.body.steps[0].text.startsWith('<script>'));
  await rejects('a service with no usable steps is rejected', M.openPack(await M.packEncode({ v: 1, kind: 'service', body: { title: 'x', steps: [{ t: 'nope' }] } })));
  await rejects('a pack of an unknown kind is rejected', M.openPack(await M.packEncode({ v: 1, kind: 'script', body: {} })));
  await rejects('a pack of the wrong version is rejected', M.openPack(await M.packEncode({ v: 2, kind: 'service', body: { steps: [{ t: 'welcome' }] } })));
  await rejects('a circle that starts at an unknown station is rejected', M.openPack(await M.packEncode({ v: 1, kind: 'circle', body: { name: 'x', startDay: '2026-11-16', from: 's999' } })));
  await rejects('a circle with a bad date is rejected', M.openPack(await M.packEncode({ v: 1, kind: 'circle', body: { name: 'x', startDay: 'tomorrow', from: 's001' } })));
  await rejects('an empty reflection is rejected', M.openPack(await M.packEncode({ v: 1, kind: 'reflection', body: { circle: 'c', week: 1, who: 'A', text: '   ' } })));
  const refl = await M.openPack(await M.makePack('reflection', { circle: 'c1', week: 99999, who: 'W'.repeat(100), text: 'T'.repeat(9000) }, { identity: me })); ok('a reflection is clamped in week, name and length', refl.body.week === 200 && refl.body.who.length === 40 && refl.body.text.length === 3000);
  const startAt = M.sanitizeService({ steps: [{ t: 'silence' }], startAt: Date.UTC(2026, 11, 20, 9) }).startAt; ok('a sensible start time is kept', startAt === Date.UTC(2026, 11, 20, 9));
  ok('an absurd start time is dropped', M.sanitizeService({ steps: [{ t: 'silence' }], startAt: 9e15 }).startAt === null);

  /* timing: everyone, wherever they are, sees the same step at the same moment */
  const t3 = M.sanitizeService({ title: 'Timing', steps: [{ t: 'welcome', sec: 60 }, { t: 'silence', sec: 300 }, { t: 'bless', sec: 30 }] });
  ok('total length is the sum of the steps', M.serviceSeconds(t3) === 390);
  const at = (e) => M.whereAt(t3, e);
  ok('before the start, the countdown is exact', at(-90).phase === 'before' && at(-90).untilStart === 90);
  ok('at the very start the first step is live with the full time left', at(0).phase === 'live' && at(0).i === 0 && at(0).left === 60);
  ok('the boundary belongs to the next step', at(60).i === 1 && at(59.999).i === 0);
  ok('a late joiner lands mid-step with the right time left', at(200).i === 1 && at(200).into === 140 && at(200).left === 160);
  ok('the last second is the last step, then it is done', at(389).i === 2 && at(390).phase === 'done');
  ok('timeline is contiguous', M.serviceTimeline(t3).every((x, k, a) => k === 0 ? x.start === 0 : x.start === a[k - 1].end));
  ok('the clock formats like a clock', M.fmtClock(0) === '0:00' && M.fmtClock(59.2) === '1:00' && M.fmtClock(75) === '1:15' && M.fmtClock(3725) === '1:02:05');

  /* templates */
  ok('seven templates, each with a name, a stated form and valid steps', M.SERVICE_TEMPLATES.length === 7 && M.SERVICE_TEMPLATES.every((t) => t.name && t.form.length > 30 && M.sanitizeService({ title: t.name, steps: t.steps.map((s) => Object.assign({}, s, { pick: undefined })) }).steps.length === t.steps.length));
  ok('each template runs about as long as it says', M.SERVICE_TEMPLATES.every((t) => Math.abs(M.serviceSeconds({ steps: t.steps }) / 60 - t.mins) <= 3), M.SERVICE_TEMPLATES.map((t) => [t.id, t.mins, Math.round(M.serviceSeconds({ steps: t.steps }) / 60)]));
  ok('every template opens and closes with words', M.SERVICE_TEMPLATES.every((t) => t.steps[0].t === 'welcome' && t.steps[t.steps.length - 1].t === 'bless' && t.steps[0].text && t.steps[t.steps.length - 1].text));
  ok('every reading in a template says where to pick from', M.SERVICE_TEMPLATES.every((t) => t.steps.filter((s) => s.t === 'reading').every((s) => s.pick)));

  /* circles */
  const S = M.PATH_STATIONS; const c = M.sanitizeCircle({ name: 'Thursday group', purpose: 'Read slowly, together.', startDay: '2026-11-19', from: 's046', weeks: 10, mins: 75, extra: ['What would I change?'] });
  ok('a circle sanitises and keeps its fields', c.name === 'Thursday group' && c.weeks === 10 && c.mins === 75 && c.extra.length === 1 && c.from === 's046');
  const day = (y, m, d) => new Date(y, m - 1, d, 12);
  ok('before the start the week is negative', M.circleWeekNow(c, day(2026, 11, 12)) < 0 && M.circleWeekNow(c, day(2026, 11, 18)) === -1);
  ok('the first week runs seven days from the start date', M.circleWeekNow(c, day(2026, 11, 19)) === 0 && M.circleWeekNow(c, day(2026, 11, 25)) === 0 && M.circleWeekNow(c, day(2026, 11, 26)) === 1);
  ok('week 3 is three weeks on', M.circleWeekNow(c, day(2026, 12, 10)) === 3);
  ok('the circle walks the Path one station a week', M.circleStation(c, 0) === S[45] && M.circleStation(c, 2) === S[47] && M.circleStation(c, 500) === S[S.length - 1]);
  ok('meeting days are seven days apart', M.circleMeetingDay(c, 2).getDate() === 3 && M.circleMeetingDay(c, 2).getMonth() === 11);
  const guide = M.circleMeeting(c, 0, { practice: { name: 'Breath anchor', blurb: 'Rest attention on the breath.' } }); const st = S[45];
  ok('the meeting guide is a valid service of the stated length', guide.steps[0].t === 'welcome' && guide.steps[guide.steps.length - 1].t === 'bless' && Math.abs(M.serviceSeconds(guide) / 60 - 75) < 1, M.serviceSeconds(guide) / 60);
  ok('the guide names the station, tells its story and carries its questions plus the circle’s own', guide.title.includes(st.title) && guide.steps.some((s) => s.t === 'words' && s.text.includes(st.blurb.slice(0, 30))) && guide.steps.find((s) => s.t === 'reflect').questions.length === st.q.length + 1 && guide.steps.find((s) => s.t === 'reflect').questions.includes('What would I change?'));
  ok('the guide points to the first reading in the Library', guide.steps.find((s) => s.t === 'reading').ref.id === st.read[0], guide.steps.find((s) => s.t === 'reading'));
  const withPassage = M.circleMeeting(c, 0, { passage: { id: st.read[0], si: 1, text: 'A line to read aloud together.', source: 'Somewhere' } }); ok('a chosen passage goes straight into the guide', withPassage.steps.find((s) => s.t === 'reading').text === 'A line to read aloud together.');
  ok('every one of the stations makes a valid 60-minute meeting guide', S.every((s, i) => { const cc = M.sanitizeCircle({ name: 'x', startDay: '2026-11-19', from: S[0].id, weeks: S.length, mins: 60 }); const g = M.circleMeeting(cc, i); return M.serviceSeconds(g) >= 55 * 60 && M.serviceSeconds(g) <= 66 * 60 && g.steps.length >= 6; }));
  ok('short circles still leave time for the conversation', (() => { const g = M.circleMeeting(M.sanitizeCircle({ name: 'x', startDay: '2026-11-19', from: 's001', mins: 20 }), 0); return g.steps.find((s) => s.t === 'reflect').sec >= 300; })());
  ok('a pack with a hand-edited week still opens as a valid service', M.sanitizeService(JSON.parse(JSON.stringify(guide))).steps.length === guide.steps.length);

  /* threads: passages from different texts, shared as a pack */
  { const th = { id: 'th1', title: 'Floods', note: 'Five versions', items: [{ id: 'a', tid: 'x-gil', s: 1, p: 2, a: 0, b: 5, q: 'Utnapishtim built a boat', label: 'Gilgamesh', note: 'older', sh: 'Part 2' }, { id: 'b', tid: 'b-gen', s: 5, p: 0, a: 0, b: 9, q: 'Make a ship of gopher wood', label: 'Genesis' }], links: [{ a: 'a', b: 'b', kind: 'borrowing', note: 'Retold' }] };
    const s1 = M.sanitizeThread(th); ok('a thread keeps its passages, labels and relations', s1.items.length === 2 && s1.links.length === 1 && s1.items[0].sh === 'Part 2' && s1.title === 'Floods' && s1.links[0].kind === 'borrowing', s1);
    const dirty = M.sanitizeThread({ title: 'T'.repeat(500), note: 'N'.repeat(9000), items: [{ id: 'a', tid: 'x-gil', q: 'ok' }, { id: 'a', tid: 'b-gen', q: 'duplicate id' }, { id: 'c', tid: '../etc/passwd', q: 'bad id' }, { id: 'd', tid: 'x-gil', q: '   ' }, null, 'x', { id: 'e', tid: 'x-gil', q: 'Q'.repeat(9000), label: 'L'.repeat(500), note: 'M'.repeat(9000), s: -5, p: 1e12 }], links: [{ a: 'a', b: 'zzz', kind: 'borrowing' }, { a: 'a', b: 'a', kind: 'parallel' }, { a: 'a', b: 'e', kind: 'invented' }, { a: 'a', b: 'e', kind: 'parallel', note: 'ok' }, { a: 'e', b: 'a', kind: 'contact' }] });
    ok('hostile threads are cut down: bad ids, empty quotes and junk entries dropped', dirty.items.length === 3 && dirty.items.every((x) => /^[a-z]-[a-z0-9-]+$/.test(x.tid) && x.q.trim()), dirty.items.map((x) => x.tid));
    ok('…lengths and numbers are bounded', dirty.title.length === 100 && dirty.note.length === 1500 && dirty.items[2].q.length === 2000 && dirty.items[2].label.length === 80 && dirty.items[2].note.length === 1500 && dirty.items[2].s === 0 && dirty.items[2].p === 100000);
    ok('…ids are unique and only real, valid relations survive (one per pair)', new Set(dirty.items.map((x) => x.id)).size === 3 && dirty.links.length === 1 && dirty.links[0].kind === 'parallel');
    ok('a thread cannot hold more than 12 passages', M.sanitizeThread({ items: Array.from({ length: 40 }, (_, k) => ({ id: 'i' + k, tid: 'x-gil', q: 'q' + k })) }).items.length === 12);
    await rejects('a thread with nothing in it is rejected', M.openPack(await M.packEncode({ v: 1, kind: 'thread', body: { title: 'x', items: [] } })));
    await rejects('a thread that is not an object is rejected', M.openPack(await M.packEncode({ v: 1, kind: 'thread', body: 'nope' })));
    const idn = await M.newIdentity(); const pk = await M.makePack('thread', s1, { identity: idn, by: 'Sam' }); const op = await M.openPack(pk);
    ok('a signed thread opens, verified, with everything intact', op.kind === 'thread' && op.verified && op.by === 'Sam' && op.body.items.length === 2 && op.body.links.length === 1 && op.body.items[1].q === 'Make a ship of gopher wood', op);
    const tam = JSON.parse(JSON.stringify(await M.packDecode(pk))); tam.body.items[0].q = 'Something else entirely'; const tp = await M.openPack(await M.packEncode(tam)); ok('a thread changed in transit no longer verifies', tp.verified === false, tp);
    ok('thread packs travel as text and links like the rest', M.packFromText(M.packText(pk)) === pk && M.packLink('https://example.org/Lamplighter.html#/x', pk).includes('#/gather/open')); }

  { const c = M.SERVICE_TEMPLATES.find((t) => t.id === 'common'); const tl = M.serviceTimeline(M.sanitizeService({ title: c.name, steps: c.steps.map((x) => Object.assign({}, x, { pick: undefined, text: x.t === 'reading' ? 'A reading.' : x.text })) }));
    ok('the interfaith template names fixed readings from four traditions and its stated length is true', c.steps.filter((x) => x.pick && x.pick.parallel === 'golden-rule').length === 4 && Math.abs(M.serviceSeconds({ steps: c.steps }) / 60 - c.mins) < 1, M.serviceSeconds({ steps: c.steps }) / 60); }
  console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})();
