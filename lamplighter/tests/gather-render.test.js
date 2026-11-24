// Run: node tests/gather-render.test.js — the Gather screens against a stub DOM: every view, the editor, sharing, opening hostile packs, circles and notes
const fs = require('fs'); const path = require('path');
const dir = path.join(__dirname, '../src/js');
const rd = (f) => fs.readFileSync(path.join(dir, f), 'utf8').replace(/\nif \(typeof module !== 'undefined' && module\.exports\)[^\n]*/g, '');
const files = ['23-data-meditation.js', ...fs.readdirSync(dir).filter((f) => /^(24|25|26|27|28|29|2[a-z])-/.test(f)).sort(), '69-path.js', '6c-texts.js', '6d-passage.js', '6e-traditions.js', '6g-library.js', '6k-reader.js', '6l-threads.js', '6m-search.js', '6n-palette.js', '6o-common.js', '6p-atlas.js', '6q-atlas-pages.js', '6r-calendars.js', '6s-cosmos.js', '6t-atlas-dive.js', '6u-similar.js', '6v-motifs.js', '6x-wander.js', '6w-stories.js', '6y-rites.js', '6z-hidden.js', '6zs-plants.js','6zt-sound.js','6zu-image.js','6zv-imagined.js','6z-bibles.js', '6kr-reading.js', '6zw-words.js', '6zx-dictionary.js', '6h-gather.js', '6i-service-run.js'];
const prefix = `
const REFS = {}; const mem = {};
const store = { get: (k, d) => (k in mem ? JSON.parse(mem[k]) : d), set: (k, v) => { mem[k] = JSON.stringify(v); }, del: (k) => { delete mem[k]; } };
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const icon = (n) => '<svg data-i="' + n + '"></svg>'; const clamp = (x, a, b) => Math.min(b, Math.max(a, x)); const isNum = (x) => typeof x === 'number' && isFinite(x);
const isoDay = () => '2026-11-14'; const debounce = (f) => f; const download = (name, text) => { globalThis.__dl = { name, text }; }; const toast = (m) => { globalThis.__toast = m; }; const uid = () => 'x';
const stub = { addEventListener() {}, removeEventListener() {}, value: '', click() {}, style: {}, textContent: '' };
const $ = (sel) => (globalThis.__q && globalThis.__q[sel]) || stub; const $$ = () => [];
const UI = { evidence: () => '<ev/>', wireInfo() {} }; const Speech = { cancel() {}, ok: false, speak() {} }; const debug = 0;
const fmtMin = (m) => m + ' min'; const APP = { name: 'The Lamplighter Project' }; const confirmBox = async () => true; const modal = async () => null;
const Router = { render: async () => { globalThis.__rendered = (globalThis.__rendered || 0) + 1; } }; const Pages = {};
const document = { querySelector: (s) => (globalThis.__q && globalThis.__q[s]) || null, createElement() { return {}; }, body: {}, addEventListener() {}, removeEventListener() {} };
const navigator = { clipboard: { writeText: async (t) => { globalThis.__clip = t; } } };
const location = { hash: '', href: 'https://example.org/Lamplighter.html#/gather' }; const window = { print() { globalThis.__printed = true; } };
const AudioCore = { unlock: async () => { throw new Error('no audio here'); } }; const Bell = {}; let __lcg = 99; const randFloat = () => { __lcg = (__lcg * 1664525 + 1013904223) % 4294967296; return __lcg / 4294967296; };
`;
const M = new Function(prefix + files.map(rd).join('\n') + '\nreturn { Pages, store, mem, location, TXT, PATH_STATIONS, SERVICE_TEMPLATES, GStore, makePack, newIdentity, keyFingerprint, packText, sanitizeService, serviceSeconds, circleStation, circleMeeting, YEAR_WHEEL, esc, stepBodyHTML };')();
let pass = 0, fail = 0; const ok = (n, c, x = '') => { if (c) pass++; else { fail++; console.log('FAIL', n, typeof x === 'string' ? x : JSON.stringify(x).slice(0, 300)); } };
const badText = (s) => /undefined|\[object|NaN|>null</.test(s);
const BT = globalThis.BEATLAB_TEXTS; M.TXT._scripts.index = Promise.resolve();
const para = 'The Lord is my shepherd, and I shall not want. He makes me lie down in green pastures, and he leads me beside still waters. He restores my soul, and he guides me in paths of righteousness for his name’s sake, even though I walk through the valley of the shadow of death.';
BT.add('b-psa', { title: 'Psalms', by: 'World English Bible', license: 'Public domain', src: 'https://ebible.org/web/', chars: 900, n: 3 }, [['Psalm 1', '[[1]] ' + para], ['Psalm 2', '[[1]] ' + para + ' ' + para], ['Psalm 3', '[[1]] ' + para]]);
BT.add('x-metta', { title: 'Metta Sutta', by: 'Bhikkhu Sujato', license: 'CC0', src: 'https://suttacentral.net', chars: 300, n: 1 }, [['The Discourse on Love', 'This is what should be done by one who is skilled in goodness, and who knows that state of peace: let them be able and upright, straightforward and gentle in speech, not proud. May all beings be happy and safe.']]);
BT.add('b-gen', { title: 'Genesis', by: 'World English Bible', license: 'Public domain', src: 'https://ebible.org/web/', chars: 600, n: 1 }, [['Chapter 1', '[[1]] In the beginning, God created the heavens and the earth. ' + para + '\n\n[[2]] ' + para]]);

async function view(parts, query = {}) {
  const body = { innerHTML: '' }; const handlers = {};
  const root = { innerHTML: '', querySelector: (s) => (s === '#gbody' ? body : stub), addEventListener(t, fn) { handlers[t] = fn; }, removeEventListener() {} };
  const cleanup = await M.Pages.gather.mount(root, parts, query);
  return { head: root.innerHTML, body: body.innerHTML, handlers, cleanup, root };
}
const ev = (g, dataset = {}, extra = {}) => ({ target: Object.assign({ closest: (s) => (s === '[data-g]' || s === '[data-step]' ? Object.assign({ dataset: Object.assign({ g }, dataset), disabled: false, closest: () => null }, extra) : null), dataset: {} }, {}) });
const q = (o) => { globalThis.__q = o; };

(async () => {
  /* home and tabs */
  { const r = await view([]); ok('home: pitches the idea, offers quick sits, and says nothing leaves the browser', r.body.includes('without a centre') && r.body.includes('data-g="quick"') && r.body.includes('No accounts') && !badText(r.body));
    ok('home: tabs for Home, Services, Circles, Calendar and Share', ['/gather"', '/gather/services', '/gather/circles', '/gather/calendar', '/gather/share'].every((h) => r.head.includes(h)));
    ok('home: shows what is coming up in the next month', r.body.includes('Coming up') && /Hanukkah|Advent|Christmas|Winter solstice/.test(r.body), r.body.slice(0, 100)); r.cleanup(); }
  /* templates */
  { const r = await view(['services']); ok('services: seven templates plus a blank, each clickable', (r.body.match(/data-g="newtpl"/g) || []).length === 8 && M.SERVICE_TEMPLATES.every((t) => r.body.includes(t.name)) && !badText(r.body)); r.cleanup(); }
  for (const t of M.SERVICE_TEMPLATES) {
    M.location.hash = ''; await view(['new'], { tpl: t.id });
    const saved = M.GStore.services()[0];
    ok(`template ${t.id}: makes a saved service and opens the editor`, saved && saved.tpl === t.id && /^#\/gather\/service\/[0-9a-f]{12}\?edit=1$/.test(M.location.hash), M.location.hash);
    ok(`template ${t.id}: readings are filled in from the Library, in English, with a source`, saved.steps.filter((s) => s.t === 'reading').every((s) => s.text.length > 40 && /Psalms|Metta|Genesis/.test(s.source + s.text) && s.ref), saved.steps.filter((s) => s.t === 'reading').map((s) => [s.source, s.text.slice(0, 30)]));
  }
  { const r = await view(['new']); const s = M.GStore.services()[0]; ok('a blank service starts with welcome, silence and closing', s.steps.map((x) => x.t).join() === 'welcome,silence,bless'); }
  /* view and editor */
  { const svc = M.GStore.services()[0]; const r = await view(['service', svc.id]);
    ok('service: shows the order of service with times, and the share tools', r.body.includes('Order of service') && r.body.includes('0:00') && r.body.includes('data-g="sharetext"') && r.body.includes('data-g="sharelink"') && r.body.includes('data-g="sharefile"') && r.body.includes('data-g="ics"') && r.body.includes('id="startAt"') && r.body.includes('id="gSign"') && !badText(r.body));
    ok('service: a Begin button and an Edit link', r.body.includes('data-g="run"') && r.body.includes('?edit=1'));
    const e = await view(['service', svc.id], { edit: '1' }); ok('editor: one editable card per part, with move, remove and add', (e.body.match(/data-step="/g) || []).length === svc.steps.length && e.body.includes('data-g="up"') && e.body.includes('data-g="del"') && e.body.includes('data-g="add"') && e.body.includes('data-f="stitle"'));
    const none = await view(['service', 'nope']); ok('service: an unknown id is handled', none.body.includes('No such service')); }
  /* hostile content is shown as text */
  { const evil = M.sanitizeService({ title: '<img src=x onerror=alert(1)>', note: '"><script>alert(2)</script>', steps: [{ t: 'welcome', text: '<script>alert(3)</script>' }, { t: 'reflect', questions: ['<b>q</b>'] }] }); evil.id = 'evil1'; M.GStore.setServices([evil, ...M.GStore.services()]);
    const r = await view(['service', 'evil1']); const e = await view(['service', 'evil1'], { edit: '1' });
    ok('hostile service: title, note, text and questions are escaped in the view', !/<script>|<img |<b>q/.test(r.body) && r.body.includes('&lt;script&gt;') && r.body.includes('&lt;img'));
    ok('hostile service: and in the editor', !/<script>alert|<img src/.test(e.body) && e.body.includes('&lt;script&gt;alert(3)')); }
  /* editor actions */
  { const svc = M.GStore.services().find((s) => s.tpl === 'silent'); const r = await view(['service', svc.id], { edit: '1' }); const n0 = svc.steps.length;
    q({ '#addKind': { value: 'reflect' } }); await r.handlers.click(ev('add')); ok('editor: adding a part appends it', M.GStore.services().find((s) => s.id === svc.id).steps.length === n0 + 1);
    await r.handlers.click(ev('up', {}, { closest: (s) => (s === '[data-step]' ? { dataset: { step: '1' } } : null) }));
    const after = M.GStore.services().find((s) => s.id === svc.id); ok('editor: moving a part up swaps it with the one above', after.steps[0].t === 'silence' && after.steps[1].t === 'welcome', after.steps.map((s) => s.t));
    await r.handlers.input({ target: { dataset: { f: 'min' }, value: '2.5', closest: (s) => (s === '[data-step]' ? { dataset: { step: '0' } } : null) } }); ok('editor: minutes become seconds, clamped', M.GStore.services().find((s) => s.id === svc.id).steps[0].sec === 150);
    await r.handlers.input({ target: { dataset: { f: 'text' }, value: 'New words', closest: (s) => (s === '[data-step]' ? { dataset: { step: '0' } } : null) } }); ok('editor: typing saves the words', M.GStore.services().find((s) => s.id === svc.id).steps[0].text === 'New words');
    await r.handlers.input({ target: { dataset: { f: 'stitle' }, value: 'Renamed', closest: () => null } }); ok('editor: the title is editable', M.GStore.services().find((s) => s.id === svc.id).title === 'Renamed');
    q({ '#startAt': { value: '' } }); await r.handlers.change({ target: { id: 'startAt', value: '2026-12-20T09:00', dataset: {}, closest: () => null } }); ok('a start time is stored as a UTC moment', M.GStore.services().find((s) => s.id === svc.id).startAt === new Date('2026-12-20T09:00').getTime());
    await r.handlers.click(ev('dup')); const copies = M.GStore.services().filter((s) => s.title.includes('(copy)')); ok('a copy is made without the start time', copies.length === 1 && copies[0].startAt === null); }
  /* sharing a service */
  { const svc = M.GStore.services().find((s) => s.title === 'Renamed'); const r = await view(['service', svc.id]);
    const out = { value: '', hidden: true, select() {} }; q({ '#gSign': { checked: true }, '#packOut': out });
    await r.handlers.click(ev('sharetext')); ok('share as text: a signed BEATLAB-PACK, copied to the clipboard and shown for manual copy', /^BEATLAB-PACK:1:[zj][A-Za-z0-9_-]+$/.test(out.value) && globalThis.__clip === out.value && !out.hidden, out.value.slice(0, 40));
    const opened = await (async () => { const code = out.value.replace('BEATLAB-PACK:1:', ''); const v = await view(['open'], { p: code }); return v; })();
    ok('what was shared opens as verified, with the same title', opened.body.includes('Renamed') && opened.body.includes('✓ signed') && opened.body.includes('data-g="acceptsvc"') && opened.body.includes('data-g="runpack"'), opened.body.slice(0, 200));
    ok('the sender’s key is made once and kept', !!M.GStore.me().pub && !!M.GStore.me().priv);
    await r.handlers.click(ev('sharelink')); ok('share as link: the pack goes in the fragment of this page', out.value.startsWith('https://example.org/Lamplighter.html#/gather/open?p='));
    await r.handlers.click(ev('sharefile')); ok('share as file: a .beatlab download', /\.beatlab$/.test(globalThis.__dl.name) && globalThis.__dl.text.startsWith('BEATLAB-PACK:1:'));
    await r.handlers.click(ev('ics')); ok('add to calendar: an .ics file with the service’s start time', /\.ics$/.test(globalThis.__dl.name) && /BEGIN:VCALENDAR/.test(globalThis.__dl.text) && /DTSTART:20261220T/.test(globalThis.__dl.text.replace(/\r/g, '')), globalThis.__dl.text.slice(0, 120));
    q({ '#gSign': { checked: false }, '#packOut': out }); await r.handlers.click(ev('sharetext')); const un = await view(['open'], { p: out.value.replace('BEATLAB-PACK:1:', '') }); ok('unsigned: opens, but says it is not signed', un.body.includes('not signed') && !un.body.includes('✓ signed')); }
  /* opening packs */
  { const tpack = await M.makePack('thread', { id: 't1', title: 'Floods <b>', note: 'Two versions', items: [{ id: 'a', tid: 'x-gil', s: 1, p: 2, a: 0, b: 5, q: 'Utnapishtim built a <img onerror=alert(1)> boat', label: 'Gilgamesh' }, { id: 'b', tid: 'b-gen', s: 5, p: 0, a: 0, b: 9, q: 'Make a ship of gopher wood', label: 'Genesis' }], links: [{ a: 'a', b: 'b', kind: 'borrowing', note: 'Retold' }] }, { by: 'Sam' });
    const tv = await view(['open'], { p: tpack }); ok('a shared thread opens with its passages, sender and a save button', tv.body.includes('A passage set') && tv.body.includes('Gilgamesh') && tv.body.includes('Make a ship of gopher wood') && tv.body.includes('id="acceptThread"') && tv.body.includes('2 passages') && tv.body.includes('1 relation'), tv.body.slice(0, 300));
    ok('a shared thread cannot inject markup', !tv.body.includes('<img') && !tv.body.includes('<b>') && tv.body.includes('&lt;img onerror=alert(1)&gt;'), tv.body.slice(0, 200)); }
  { const bad = await view(['open'], { p: 'zzzzzzzz!!' }); ok('a broken pack explains itself', bad.body.includes('callout warn') && !badText(bad.body));
    const evilPack = await M.makePack('service', { title: '<script>alert(1)</script>', steps: [{ t: 'welcome', text: '<img onerror=alert(2)>' }] }); const r = await view(['open'], { p: evilPack });
    ok('a hostile pack preview is plain text', !/<script>|<img onerror/.test(r.body) && r.body.includes('&lt;script&gt;'));
    const id = await M.newIdentity(); const signed = await M.makePack('service', { title: 'Signed one', steps: [{ t: 'welcome', text: 'Hi' }] }, { identity: id, by: 'Maria' });
    const sv = await view(['open'], { p: signed }); ok('a signed pack shows who signed it and offers to remember the key', sv.body.includes('sent by Maria') && sv.body.includes('id="knownName"') && sv.body.includes('a key you have not seen before'));
    q({ '#knownName': { value: 'Maria D.' } }); await sv.handlers.click(ev('acceptsvc')); ok('accepting adds the service and remembers the key under the name given', M.GStore.services().some((s) => s.title === 'Signed one') && Object.values(M.GStore.known()).includes('Maria D.'));
    const sv2 = await view(['open'], { p: signed }); ok('the same key is recognised next time', sv2.body.includes('you have seen this key before as “Maria D.”')); }
  /* circles */
  { const r = await view(['circles']); ok('circles: explains itself and offers the form with every station', r.body.includes('Start a circle') && r.body.includes('id="cFrom"') && (r.body.match(/<option value="s\d{3}"/g) || []).length === 132 && r.body.includes('data-g="mkcircle"') && !badText(r.body));
    q({ '#cName': { value: 'Thursday group' }, '#cPurpose': { value: 'Read slowly.' }, '#cDay': { value: '2026-11-19' }, '#cFrom': { value: 's046' }, '#cWeeks': { value: '10' }, '#cMins': { value: '60' }, '#cExtra': { value: 'What would I change?\n\nWhat do I doubt?' } });
    M.location.hash = ''; await r.handlers.click(ev('mkcircle')); const c = M.GStore.circles()[0];
    ok('creating a circle saves it and opens it', c && c.name === 'Thursday group' && c.extra.length === 2 && c.from === 's046' && M.location.hash === '#/gather/circle/' + c.id, M.location.hash);
    const bad = await view(['circles']); q({ '#cName': { value: 'x' }, '#cPurpose': { value: '' }, '#cDay': { value: 'soon' }, '#cFrom': { value: 's046' }, '#cWeeks': { value: '10' }, '#cMins': { value: '60' }, '#cExtra': { value: '' } }); const n = M.GStore.circles().length; await bad.handlers.click(ev('mkcircle')); ok('a circle with no valid date is refused', M.GStore.circles().length === n); }
  { const c = M.GStore.circles()[0]; const r = await view(['circle', c.id]);
    ok('circle page: this week’s station, the meeting buttons, reflections and all ten weeks', r.body.includes('Thursday group') && r.body.includes('data-g="runweek"') && r.body.includes('data-g="saveweek"') && r.body.includes('data-g="sharecircle"') && r.body.includes('data-g="reflect"') && (r.body.match(/href="#\/gather\/circle\/[0-9a-f]+\?week=\d+"/g) || []).length >= 10 && !badText(r.body), r.body.slice(0, 160));
    const w2 = await view(['circle', c.id], { week: '2' }); ok('circle page: a chosen week shows that week’s station', w2.body.includes('Week 3: ' + M.circleStation(c, 2).title.replace(/&/g, '&amp;')));
    const clamp = await view(['circle', c.id], { week: '999' }); ok('circle page: an out-of-range week is clamped', clamp.body.includes('Week 10:'));
    const none = await view(['circle', 'nope']); ok('circle page: an unknown id is handled', none.body.includes('No such circle'));
    /* save a week as a service */
    const before = M.GStore.services().length; q({}); await r.handlers.click(ev('saveweek', { week: '0' })); const g = M.GStore.services()[0]; ok('saving a week stores a valid meeting guide as a service', M.GStore.services().length === before + 1 && g.tpl === 'circle' && g.title.includes('Thursday group') && Math.abs(M.serviceSeconds(g) / 60 - 60) < 1);
    /* reflections */
    const me = await M.newIdentity(); M.GStore.setMe(Object.assign(M.GStore.me(), me)); q({ '#rText': { value: 'It stayed with me <b>a lot</b>.' }, '#rWho': { value: 'Joseph' }, '#packOut2': { value: '', hidden: true } }); globalThis.__q['#packOut2'] = { value: '', hidden: true };
    await r.handlers.click(ev('reflect', { week: '0' })); const mine = (M.GStore.board()[c.id] || [])[0]; ok('writing a reflection keeps it on the board as yours, and copies a signed note', mine && mine.mine && mine.who === 'Joseph' && mine.fp && /^BEATLAB-PACK:1:/.test(globalThis.__clip), mine);
    const from = await M.newIdentity(); const note = await M.makePack('reflection', { circle: c.id, week: 0, who: 'Maria', text: 'I doubted it, then did not. <script>x</script>' }, { identity: from, by: 'Maria' }); const op = await view(['open'], { p: note });
    ok('opening a note shows its text, signer and an Add button', op.body.includes('A note from Maria') && op.body.includes('data-g="acceptrefl"') && op.body.includes('✓ signed') && !/<script>x/.test(op.body));
    M.location.hash = ''; await op.handlers.click(ev('acceptrefl')); const bd = M.GStore.board()[c.id]; ok('accepting a note puts it on the right week of the board', bd.length === 2 && bd.some((x) => x.who === 'Maria' && x.week === 0 && x.fp) && M.location.hash === `#/gather/circle/${c.id}?week=0`, M.location.hash);
    await op.handlers.click(ev('acceptrefl')); ok('adding the same note twice does not duplicate it', M.GStore.board()[c.id].length === 2);
    const rr = await view(['circle', c.id]); ok('the board shows both notes, escaped, with who signed each', rr.body.includes('Maria') && rr.body.includes('Joseph') && !/<script>x|<b>a lot/.test(rr.body) && rr.body.includes('&lt;b&gt;a lot') && (rr.body.match(/class="badge good"/g) || []).length >= 1);
    const stranger = await M.makePack('reflection', { circle: 'someone-elses', week: 0, who: 'Zed', text: 'Hello' }); const so = await view(['open'], { p: stranger }); await so.handlers.click(ev('acceptrefl')); ok('a note for a circle you are not in is refused', !M.GStore.board()['someone-elses'] && /not in that circle/.test(globalThis.__toast));
    /* share and join a circle */
    const out = { value: '', hidden: true, select() {} }; q({ '#packOut': out }); await r.handlers.click(ev('sharecircle')); const join = await view(['open'], { p: out.value.replace('BEATLAB-PACK:1:', '') }); ok('a shared circle opens with its dates and a Join button', join.body.includes('Thursday group') && join.body.includes('data-g="acceptcircle"') && join.body.includes('10 weeks'));
    const n0 = M.GStore.circles().length; await join.handlers.click(ev('acceptcircle')); ok('joining a circle you are already in does not duplicate it', M.GStore.circles().length === n0);
    q({}); await r.handlers.click(ev('delrefl', { rid: mine.id })); ok('a note can be removed from the board', !(M.GStore.board()[c.id] || []).some((x) => x.id === mine.id)); }
  /* calendar, share and keys, backup */
  { const r = await view(['calendar']); ok('calendar: the next fifteen months, with the moveable feasts of several traditions', ['Easter', 'Passover begins', 'Ramadan begins', 'Lunar New Year', 'Hanukkah begins', 'Christmas'].every((n) => r.body.includes(n)) && (r.body.match(/class="tl-era"/g) || []).length >= 12 && !badText(r.body));
    ok('calendar: says which dates are approximate and which begin at sunset', r.body.includes('approx.') && r.body.includes('from sunset before') && r.body.includes('moon-sighted'));
    const j = await view(['calendar'], { t: 'Jewish' }); ok('calendar: a tradition filter keeps its days (and the shared ones) only', j.body.includes('Passover begins') && !j.body.includes('Ramadan begins') && !j.body.includes('>Easter<'));
    M.location.hash = ''; await r.handlers.click(ev('calgather', { name: 'Easter', note: 'The resurrection' })); ok('"Hold a gathering" makes a service named for the day', M.GStore.services()[0].title === 'Easter' && /\?edit=1$/.test(M.location.hash));
    await r.handlers.click(ev('calics', { date: '2027-03-28', name: 'Easter', note: 'x' })); ok('"Add to my calendar" downloads an all-day event', /DTSTART;VALUE=DATE:20270328/.test(globalThis.__dl.text)); }
  { const r = await view(['share']); ok('share: open a pack, your key and backup are all there', r.body.includes('Open a pack') && r.body.includes('Your key') && r.body.includes('Back up your gatherings') && r.body.includes('id="openFile"') && r.body.includes('id="restoreFile"') && !badText(r.body));
    q({ '#openText': { value: 'hello' } }); await r.handlers.click(ev('openpaste')); ok('pasting something that is not a pack is refused kindly', /does not look like/.test(globalThis.__toast));
    q({ '#openText': { value: 'Join us! ' + 'BEATLAB-PACK:1:jeyJ2IjoxfQ' } }); M.location.hash = ''; await r.handlers.click(ev('openpaste')); ok('a pack inside a chat message is found', M.location.hash === '#/gather/open?p=jeyJ2IjoxfQ');
    q({ '#bkKey': { checked: false } }); await r.handlers.click(ev('backup')); const bk = JSON.parse(globalThis.__dl.text); ok('backup: services, circles and notes in one file, without the private key unless asked', bk.kind === 'gather-backup' && bk.gather.services.length > 3 && bk.gather.circles.length === 1 && !bk.gather.me.priv && !/"priv"/.test(globalThis.__dl.text));
    q({ '#bkKey': { checked: true } }); await r.handlers.click(ev('backup')); ok('backup: the key goes in only when asked', !!JSON.parse(globalThis.__dl.text).gather.me.priv);
    await r.handlers.change({ target: { id: 'restoreFile', files: [{ text: async () => JSON.stringify({ gather: { services: [{ title: 'Restored', steps: [{ t: 'welcome', text: 'x' }, { t: 'rm', text: 'bad' }] }, { evil: true }].slice(0, 1), circles: [] } }) }], dataset: {}, closest: () => null } });
    ok('restore: sanitises what it reads', M.GStore.services().length === 1 && M.GStore.services()[0].title === 'Restored' && M.GStore.services()[0].steps.length === 1);
    q({ '#meName': { value: 'N'.repeat(100) } }); await r.handlers.click(ev('savename')); ok('the name is saved, capped at 40 characters', M.GStore.me().name.length === 40); }
  /* what the live screen shows for each kind of part: always escaped */
  { const s = M.sanitizeService({ title: 'T', steps: [{ t: 'reading', text: '[[1]] Hello <b>x</b>', title: 'R', source: 'Some<where>' }, { t: 'reflect', text: '<i>open</i>', questions: ['One?', '<i>Two</i>?'] }, { t: 'silence', text: '<u>quiet</u>' }, { t: 'breath' }, { t: 'words', title: 'W<>', text: 'Line one\nLine <u>two</u>' }] });
    const html = s.steps.map((x) => M.stepBodyHTML(x)); const all = html.join('\n');
    ok('runner: no raw tags from any part get through', !/<b>x|<i>|<u>|<where>/.test(all) && all.includes('&lt;i&gt;Two&lt;/i&gt;') && all.includes('Line <u>') === false);
    ok('runner: readings keep verse numbers as superscripts and show their source', html[0].includes('<sup class="vn">1</sup>') && html[0].includes('Some&lt;where&gt;') && html[0].includes('class="reader svc-read"'));
    ok('runner: reflections list their questions, silence has a quiet line, breath has the pacing circle, words keep line breaks', html[1].includes('<ol class="svc-q">') && html[2].includes('svc-quiet') && html[3].includes('svc-breath') && html[4].includes('Line one<br>Line')); }
  console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})();
