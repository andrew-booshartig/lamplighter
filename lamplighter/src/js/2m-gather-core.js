/* ═══════════════════════════ 2m · Gather: the decentralised core ═══════════════════════════
   No server, no accounts. A gathering (a service or a study circle) is a small JSON pack you can send by any channel: a link, a text pasted into a chat,
   a file, a printout. Packs are compressed, and can be signed with a key that lives only in your browser (ECDSA P-256), so a group can tell that a reflection
   really came from the same person who wrote the last one, and that nobody changed it on the way. Everything arriving from outside is sanitised before use. */
const PACK_PREFIX = 'BEATLAB-PACK:1:';
const gClamp = (x, a, b) => Math.min(b, Math.max(a, x));
const b64u = {
  enc(bytes) { let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); },
  dec(str) { const s = String(str).replace(/-/g, '+').replace(/_/g, '/'); const bin = atob(s + '==='.slice((s.length + 3) % 4)); const out = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i); return out; },
};
const gNewId = () => Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) => b.toString(16).padStart(2, '0')).join('');
const gStr = (v, n) => String(v == null ? '' : v).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u2028\u2029]/g, '').slice(0, n);
const gSortKeys = (o) => (Array.isArray(o) ? o.map(gSortKeys) : o && typeof o === 'object' ? Object.fromEntries(Object.keys(o).sort().map((k) => [k, gSortKeys(o[k])])) : o);
const gCanonical = (o) => JSON.stringify(gSortKeys(o));

/* ── encoding: JSON → deflate (where the browser has it) → base64url ── */
async function packEncode(obj) {
  const raw = new TextEncoder().encode(JSON.stringify(obj));
  if (typeof CompressionStream !== 'undefined') {
    try { const zipped = new Uint8Array(await new Response(new Blob([raw]).stream().pipeThrough(new CompressionStream('deflate-raw'))).arrayBuffer()); if (zipped.length < raw.length) return 'z' + b64u.enc(zipped); } catch (e) { /* fall back to plain */ }
  }
  return 'j' + b64u.enc(raw);
}
async function packDecode(code) {
  const c = String(code || '').trim(); if (c.length < 2 || c.length > 400000) throw new Error('That does not look like a Lamplighter pack.');
  let bytes = b64u.dec(c.slice(1));
  if (c[0] === 'z') { if (typeof DecompressionStream === 'undefined') throw new Error('This browser cannot open compressed packs.'); bytes = new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer()); }
  else if (c[0] !== 'j') throw new Error('Unknown pack format.');
  if (bytes.length > 2e6) throw new Error('That pack is too large.');
  return JSON.parse(new TextDecoder().decode(bytes));
}
const packText = (code) => PACK_PREFIX + code;
const packFromText = (text) => { const m = /BEATLAB-PACK:1:([A-Za-z0-9_-]+)/.exec(String(text || '')); return m ? m[1] : /^[zj][A-Za-z0-9_-]{8,}$/.test(String(text || '').trim()) ? String(text).trim() : null; };
const packLink = (base, code) => `${String(base).split('#')[0]}#/gather/open?p=${code}`;

/* ── a key that lives in this browser; the fingerprint is how people recognise one another ── */
const G_ECDSA = { name: 'ECDSA', namedCurve: 'P-256' }; const G_SIGN = { name: 'ECDSA', hash: 'SHA-256' };
async function newIdentity() { const kp = await crypto.subtle.generateKey(G_ECDSA, true, ['sign', 'verify']); const pub = await crypto.subtle.exportKey('jwk', kp.publicKey); const priv = await crypto.subtle.exportKey('jwk', kp.privateKey); return { pub: { kty: pub.kty, crv: pub.crv, x: pub.x, y: pub.y }, priv }; }
async function keyFingerprint(pub) { const d = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(gCanonical({ crv: pub.crv, kty: pub.kty, x: pub.x, y: pub.y })))); return Array.from(d.slice(0, 6), (b) => b.toString(16).padStart(2, '0')).join('').match(/.{4}/g).join('-'); }
async function signPack(identity, base) {
  const key = await crypto.subtle.importKey('jwk', identity.priv, G_ECDSA, false, ['sign']);
  const sig = new Uint8Array(await crypto.subtle.sign(G_SIGN, key, new TextEncoder().encode(gCanonical(base))));
  return Object.assign({}, base, { key: identity.pub, sig: b64u.enc(sig) });
}
async function verifyPack(pack) {
  const { sig, key } = pack || {}; if (!sig || !key) return { ok: false, reason: 'unsigned' };
  try {
    const rest = Object.assign({}, pack); delete rest.sig; delete rest.key;
    const k = await crypto.subtle.importKey('jwk', { kty: key.kty, crv: key.crv, x: key.x, y: key.y, ext: true }, G_ECDSA, false, ['verify']);
    const ok = await crypto.subtle.verify(G_SIGN, k, b64u.dec(sig), new TextEncoder().encode(gCanonical(rest)));
    return ok ? { ok: true, fp: await keyFingerprint(key) } : { ok: false, reason: 'altered' };
  } catch (e) { return { ok: false, reason: 'invalid' }; }
}

/* ── services ── */
const STEP_TYPES = {
  welcome: { label: 'Welcome', sec: 60, hint: 'Words to open the gathering.' },
  silence: { label: 'Silence', sec: 300, hint: 'Shared quiet, with a bell at each end.' },
  breath: { label: 'Breath', sec: 300, hint: 'A few minutes of slow, easy breathing.' },
  reading: { label: 'Reading', sec: 180, hint: 'A passage from a text, read aloud by one person or in turn.' },
  words: { label: 'Words', sec: 120, hint: 'A prayer, poem, intention or announcement written by whoever leads.' },
  chant: { label: 'Chant or repeated phrase', sec: 180, hint: 'A line said or sung together again and again.' },
  reflect: { label: 'Reflection', sec: 300, hint: 'Questions to sit with or to answer in turn.' },
  practice: { label: 'Practice', sec: 600, hint: 'A physical practice: walking, bowing, breath, kindness phrases.' },
  bless: { label: 'Closing', sec: 60, hint: 'Words to end the gathering.' },
};
const stepSec = (s) => Math.max(10, Math.round((s && s.sec) || STEP_TYPES[s && s.t].sec));
function sanitizeService(raw) {
  if (!raw || typeof raw !== 'object') throw new Error('That is not a service.');
  const steps = (Array.isArray(raw.steps) ? raw.steps : []).slice(0, 400).map((s) => {
    if (!s || !STEP_TYPES[s.t]) return null; const o = { t: s.t, sec: gClamp(Math.round(+s.sec || STEP_TYPES[s.t].sec), 10, 7200) };
    if (s.title) o.title = gStr(s.title, 120); if (s.text) o.text = gStr(s.text, 5000); if (s.source) o.source = gStr(s.source, 200);
    if (Array.isArray(s.questions)) o.questions = s.questions.slice(0, 8).map((q) => gStr(q, 300)).filter(Boolean);
    if (s.ref && typeof s.ref === 'object' && s.ref.id) o.ref = { id: gStr(s.ref.id, 30), si: gClamp(Math.round(+s.ref.si || 0), 0, 5000) };
    return o;
  }).filter(Boolean).slice(0, 40);
  if (!steps.length) throw new Error('A service needs at least one step.');
  const startAt = Number.isFinite(+raw.startAt) && +raw.startAt > 0 && +raw.startAt < 4102444800000 ? Math.round(+raw.startAt) : null;
  return { id: gStr(raw.id, 40) || gNewId(), title: gStr(raw.title, 120) || 'Untitled gathering', note: gStr(raw.note, 600), steps, startAt, tpl: gStr(raw.tpl, 30) };
}
function serviceTimeline(svc) { let t = 0; return svc.steps.map((s, i) => { const d = stepSec(s); const o = { i, start: t, end: t + d, dur: d, step: s }; t += d; return o; }); }
const serviceSeconds = (svc) => svc.steps.reduce((a, s) => a + stepSec(s), 0);
/* where is everyone, `elapsed` seconds after the shared start? The same answer on every device with the same pack and a roughly right clock. */
function whereAt(svc, elapsed) {
  const tl = serviceTimeline(svc); const total = tl.length ? tl[tl.length - 1].end : 0;
  if (elapsed < 0) return { phase: 'before', untilStart: -elapsed, total };
  if (elapsed >= total) return { phase: 'done', total };
  const cur = tl.find((x) => elapsed < x.end); return { phase: 'live', i: cur.i, step: cur.step, into: elapsed - cur.start, left: cur.end - elapsed, elapsed, total, count: tl.length };
}
const fmtClock = (s) => { s = Math.max(0, Math.ceil(s)); const h = Math.floor(s / 3600); const m = Math.floor((s % 3600) / 60); const ss = s % 60; return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(ss).padStart(2, '0'); };

/* Templates are forms, not claims to belong to a tradition: they say which tradition's form they borrow from. A reading with `pick` is filled from the Library when the service is made. */
const SERVICE_TEMPLATES = [
  { id: 'silent', name: 'A meeting in silence', mins: 23, form: 'The form of an unprogrammed Quaker meeting for worship: no leader, no script, anyone may speak if moved.', steps: [
    { t: 'welcome', sec: 90, text: 'We gather to wait together in silence. Nothing is planned. If someone feels moved to speak, they may, briefly; otherwise we keep quiet together. Settle your body and let your breath be ordinary.' },
    { t: 'silence', sec: 1200 },
    { t: 'bless', sec: 60, text: 'Thank you for sitting with us. Turn to whoever is beside you and greet them. The gathering is ended.' }] },
  { id: 'psalm', name: 'A psalm and stillness', mins: 14, form: 'The shape of a short monastic office: a psalm, a long silence, a blessing.', steps: [
    { t: 'welcome', sec: 60, text: 'We gather to read a psalm and to rest in it. One person reads aloud; the rest listen.' },
    { t: 'reading', sec: 150, pick: { id: 'b-psa' }, title: 'The psalm' },
    { t: 'silence', sec: 480 },
    { t: 'words', sec: 90, title: 'A blessing', text: 'May we be kept, and may we keep one another.\nMay what we heard go with us into the day.\nMay there be peace in our houses and in our work.' },
    { t: 'bless', sec: 30, text: 'Go in peace.' }] },
  { id: 'kindness', name: 'Sitting and kindness', mins: 20, form: 'A Buddhist-style sit: settle with the breath, hear a sutta on kindness, then practise the traditional phrases.', steps: [
    { t: 'welcome', sec: 60, text: 'We sit together for a short while, then turn our attention toward kindness. Sit however is comfortable and let your eyes close or rest on the floor.' },
    { t: 'breath', sec: 300 },
    { t: 'reading', sec: 150, pick: { id: 'x-metta' }, title: 'The Discourse on Love' },
    { t: 'practice', sec: 600, title: 'Kindness phrases', text: 'Silently repeat, first for yourself, then for someone you love, then for someone neutral, then for someone difficult, and last for all beings:\n\nMay you be safe.\nMay you be well.\nMay you be at ease.\n\nIf feeling does not come, the words are enough. Stay with them.' },
    { t: 'bless', sec: 60, text: 'May all beings be happy. Thank you for sitting together.' }] },
  { id: 'across', name: 'Readings from three traditions', mins: 25, form: 'An interfaith reading: three passages from different traditions, each followed by quiet, then a conversation about what rhymes and what differs.', steps: [
    { t: 'welcome', sec: 90, text: 'We read three short passages from three traditions. After each one we keep a minute of quiet. We do not need to agree about anything. We are listening for where they rhyme and where they part.' },
    { t: 'reading', sec: 150, pick: { collection: 'The Bible' }, title: 'First reading' }, { t: 'silence', sec: 90 },
    { t: 'reading', sec: 150, pick: { collection: 'India' }, title: 'Second reading' }, { t: 'silence', sec: 90 },
    { t: 'reading', sec: 150, pick: { collection: 'China and Japan' }, title: 'Third reading' }, { t: 'silence', sec: 90 },
    { t: 'reflect', sec: 600, questions: ['Where did these three agree?', 'Where did they part, and does the difference matter to you?', 'Which line would you take with you today?'] },
    { t: 'bless', sec: 60, text: 'Thank you for listening to one another and to these old voices.' }] },
  { id: 'common', name: 'One teaching, many voices', mins: 23, form: 'An interfaith gathering around the reciprocity rule: the same teaching read from four traditions (Confucian, Hindu, Christian and Buddhist), quiet after each, and a conversation about what overlaps and what differs.', steps: [
    { t: 'welcome', sec: 90, text: 'Many traditions teach, in their own words, that we should treat others as we would want to be treated. We will hear it four times. After each reading we keep a minute of quiet. Nobody is asked to agree that these are the same, or to give up anything they hold. We are listening.' },
    { t: 'reading', sec: 100, pick: { parallel: 'golden-rule', item: 0 } }, { t: 'silence', sec: 60 },
    { t: 'reading', sec: 100, pick: { parallel: 'golden-rule', item: 3 } }, { t: 'silence', sec: 60 },
    { t: 'reading', sec: 100, pick: { parallel: 'golden-rule', item: 1 } }, { t: 'silence', sec: 60 },
    { t: 'reading', sec: 100, pick: { parallel: 'golden-rule', item: 4 } }, { t: 'silence', sec: 60 },
    { t: 'reflect', sec: 600, questions: ['What did you hear that is close to something in your own tradition?', 'Where did the readings differ in emphasis, and does that difference matter to you?', 'What is one way you could act on this today, toward someone outside your own circle?'] },
    { t: 'bless', sec: 60, text: 'Thank you for listening to one another and to these old voices. Go well.' }] },
  { id: 'morning', name: 'A short morning rhythm', mins: 10, form: 'A ten-minute start to the day: breath, one reading, quiet, an intention.', steps: [
    { t: 'welcome', sec: 30, text: 'A new day. Sit up, breathe, and arrive.' },
    { t: 'breath', sec: 120 },
    { t: 'reading', sec: 120, pick: {}, title: 'A reading for today' },
    { t: 'silence', sec: 240 },
    { t: 'words', sec: 60, title: 'Intention', text: 'What is one thing I want to do well today, and one person I want to treat well?' },
    { t: 'bless', sec: 30, text: 'Begin.' }] },
  { id: 'evening', name: 'An evening reflection', mins: 12, form: 'A review of the day in the manner of many traditions of evening prayer: gratitude, honesty, release.', steps: [
    { t: 'welcome', sec: 60, text: 'The day is done. We look back on it kindly and without hurry.' },
    { t: 'silence', sec: 120 },
    { t: 'reflect', sec: 300, questions: ['What am I thankful for today?', 'Where did I fall short, and what do I want to do about it?', 'What do I want to carry into tomorrow, and what do I want to put down?'] },
    { t: 'silence', sec: 180 },
    { t: 'bless', sec: 60, text: 'Rest well. What was left undone can wait.' }] },
];

/* ── study circles: one Journey station a week, kept in step by the calendar, not by anyone's progress ── */
const circleDayOk = (d) => /^\d{4}-\d{2}-\d{2}$/.test(d) && !isNaN(Date.parse(d + 'T00:00:00Z'));
function sanitizeCircle(raw, stations) {
  if (!raw || typeof raw !== 'object') throw new Error('That is not a circle.');
  const list = stations || (typeof PATH_STATIONS !== 'undefined' ? PATH_STATIONS : []); const from = gStr(raw.from, 10);
  if (list.length && !list.some((s) => s.id === from)) throw new Error('That circle starts at a station this version does not have.');
  const startDay = circleDayOk(String(raw.startDay)) ? String(raw.startDay) : null; if (!startDay) throw new Error('That circle has no valid start date.');
  return { id: gStr(raw.id, 40) || gNewId(), name: gStr(raw.name, 80) || 'A study circle', purpose: gStr(raw.purpose, 500), startDay, from, weeks: gClamp(Math.round(+raw.weeks || 12), 1, typeof PATH_STATIONS !== 'undefined' ? PATH_STATIONS.length : 137), mins: gClamp(Math.round(+raw.mins || 60), 20, 180),
    extra: (Array.isArray(raw.extra) ? raw.extra : []).slice(0, 5).map((q) => gStr(q, 300)).filter(Boolean), host: gStr(raw.host, 40) };
}
function circleWeekNow(c, now = new Date()) { const [y, m, d] = c.startDay.split('-').map(Number); const start = new Date(y, m - 1, d); const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); return Math.floor(Math.round((today - start) / 864e5) / 7); }
const circleStation = (c, week, stations = PATH_STATIONS) => stations[Math.min(stations.length - 1, Math.max(0, stations.findIndex((s) => s.id === c.from) + week))];
const circleMeetingDay = (c, week) => { const [y, m, d] = c.startDay.split('-').map(Number); return new Date(y, m - 1, d + week * 7); };
/* the meeting guide for one week, as a service the circle can run (and share) */
function circleMeeting(c, week, { passage, stations, practice } = {}) {
  const st = circleStation(c, week, stations); const T = c.mins * 60; const fixed = { welcome: 90, silence: 180, story: 300, bless: 90, practice: c.mins >= 45 ? 600 : 300 };
  const read = Math.max(300, Math.round(T * 0.15)); const reflect = Math.max(300, T - fixed.welcome - fixed.silence - fixed.story - read - fixed.practice - fixed.bless);
  const questions = (st.q || []).concat(c.extra || []);
  const steps = [
    { t: 'welcome', sec: fixed.welcome, text: `Welcome to ${c.name}, week ${week + 1}: ${st.title}. ${c.purpose ? c.purpose + ' ' : ''}We begin by arriving.` },
    { t: 'silence', sec: fixed.silence, title: 'Arrive' },
    { t: 'words', sec: fixed.story, title: `The story: ${st.title} (${st.when})`, text: `${st.blurb}\n\nWhere it rhymes: ${st.rhyme}` },
    passage ? { t: 'reading', sec: read, title: 'Reading', text: passage.text, source: passage.source, ref: { id: passage.id, si: passage.si } }
      : { t: 'reading', sec: read, title: 'Read together', text: st.read.length ? `Read aloud, in turn, from ${st.read.map((id) => (typeof LIB_BY_ID !== 'undefined' && LIB_BY_ID[id] ? LIB_BY_ID[id].title : id)).join(', ')}. The Library opens these in English.` : 'No written text survives for this station, so look together at what the evidence says.', ref: st.read[0] ? { id: st.read[0], si: 0 } : undefined },
    { t: 'reflect', sec: reflect, title: 'Conversation', questions },
    { t: 'practice', sec: fixed.practice, title: practice ? practice.name : 'Practice', text: practice ? `${practice.blurb}${st.rite ? '\n\nA rite for the week: ' + st.rite : ''}` : (st.rite || 'Sit together in silence.') },
    { t: 'bless', sec: fixed.bless, text: 'Thank you for this hour. Same time next week.' },
  ].filter(Boolean);
  return sanitizeService({ id: `${c.id}-w${week}`, title: `${c.name} · week ${week + 1}: ${st.title}`, note: `A meeting guide for ${st.title}.`, steps, tpl: 'circle' });
}

/* ── reflections: short notes shared with a circle, signed so they cannot be forged or changed in transit ── */
function sanitizeReflection(raw) {
  if (!raw || typeof raw !== 'object') throw new Error('That is not a reflection.');
  const text = gStr(raw.text, 3000).trim(); if (!text) throw new Error('That reflection is empty.');
  return { circle: gStr(raw.circle, 40), week: gClamp(Math.round(+raw.week || 0), 0, 200), who: gStr(raw.who, 40) || 'Someone', text, t: Number.isFinite(+raw.t) ? Math.round(+raw.t) : Date.now() };
}
/* ── threads: passages from different texts set side by side, with how the sharer thinks they relate ── */
const THREAD_REL_KINDS = ['borrowing', 'ancestry', 'contact', 'parallel', 'contested'];
function sanitizeThread(raw) {
  if (!raw || typeof raw !== 'object') throw new Error('That is not a thread.');
  const seen = new Set();
  const items = (Array.isArray(raw.items) ? raw.items : []).slice(0, 24).map((it, k) => {
    if (!it || typeof it !== 'object') return null;
    let id = gStr(it.id, 24).replace(/[^A-Za-z0-9_-]/g, ''); if (!id || seen.has(id)) id = 'i' + k + Math.random().toString(36).slice(2, 5); seen.add(id);
    const tid = /^[a-z]-[a-z0-9-]{1,20}$/.test(String(it.tid)) ? String(it.tid) : ''; const q = gStr(it.q, 2000).trim();
    return tid && q ? { id, tid, s: gClamp(Math.round(+it.s) || 0, 0, 100000), p: gClamp(Math.round(+it.p) || 0, 0, 100000), a: gClamp(Math.round(+it.a) || 0, 0, 1e7), b: gClamp(Math.round(+it.b) || 0, 0, 1e7), q, label: gStr(it.label, 80), note: gStr(it.note, 1500), sh: gStr(it.sh, 80) } : null;
  }).filter(Boolean).slice(0, 12);
  if (!items.length) throw new Error('That thread has no passages in it.');
  const ids = new Set(items.map((x) => x.id)); const pair = new Set();
  const links = (Array.isArray(raw.links) ? raw.links : []).filter((l) => l && ids.has(l.a) && ids.has(l.b) && l.a !== l.b && THREAD_REL_KINDS.includes(l.kind)).filter((l) => { const k = [l.a, l.b].sort().join('|'); if (pair.has(k)) return false; pair.add(k); return true; }).slice(0, 40).map((l) => ({ a: l.a, b: l.b, kind: l.kind, note: gStr(l.note, 1500) }));
  return { id: gStr(raw.id, 24).replace(/[^A-Za-z0-9_-]/g, ''), title: gStr(raw.title, 100).trim() || 'A shared thread', note: gStr(raw.note, 1500), items, links, t: Number.isFinite(+raw.t) ? Math.round(+raw.t) : Date.now(), u: Number.isFinite(+raw.u) ? Math.round(+raw.u) : Date.now() };
}
async function makePack(kind, body, { identity, by } = {}) {
  const base = { v: 1, kind, body, t: Date.now() }; if (by) base.by = gStr(by, 40);
  return packEncode(identity ? await signPack(identity, base) : base);
}
async function openPack(code, stations) {
  const obj = await packDecode(code);
  if (!obj || obj.v !== 1 || !['service', 'circle', 'reflection', 'thread'].includes(obj.kind) || !obj.body || typeof obj.body !== 'object') throw new Error('That is not a Lamplighter pack.');
  const ver = obj.sig ? await verifyPack(obj) : { ok: false, reason: 'unsigned' };
  const body = obj.kind === 'service' ? sanitizeService(obj.body) : obj.kind === 'circle' ? sanitizeCircle(obj.body, stations) : obj.kind === 'thread' ? sanitizeThread(obj.body) : sanitizeReflection(obj.body);
  return { kind: obj.kind, body, by: gStr(obj.by, 40), t: Number.isFinite(+obj.t) ? +obj.t : 0, verified: !!ver.ok, fp: ver.fp || null, reason: ver.reason || null };
}
if (typeof module !== 'undefined' && module.exports) module.exports = { PACK_PREFIX, b64u, packEncode, packDecode, packText, packFromText, packLink, newIdentity, keyFingerprint, signPack, verifyPack, STEP_TYPES, stepSec, sanitizeService, serviceTimeline, serviceSeconds, whereAt, fmtClock, SERVICE_TEMPLATES, sanitizeCircle, circleWeekNow, circleStation, circleMeetingDay, circleMeeting, sanitizeReflection, sanitizeThread, makePack, openPack, gCanonical };
