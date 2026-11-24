/* Curated parallel passages: every phrase must be found in the real texts folder, and the notes must stay inside the evidence vocabulary */
const fs = require('fs'); const path = require('path'); const vm = require('vm');
const core = require('../src/js/2p-marks-core.js'); const { PARALLELS } = require('../src/js/2q-data-parallels.js');
const ECHO_KINDS = Object.fromEntries([...fs.readFileSync(path.join(__dirname, '../src/js/2d-data-path-echoes.js'), 'utf8').split('const ECHOES')[0].matchAll(/^  (\w+): \{ name:/gm)].map((m) => [m[1], true])); /* the kinds are read from the echoes file itself, which needs the whole station list to load */
let pass = 0; let fail = 0;
const ok = (name, cond, extra) => { if (cond) pass++; else { fail++; console.log('FAIL', name, extra !== undefined ? JSON.stringify(extra).slice(0, 300) : ''); } };
const dir = path.join(__dirname, '../../texts');
globalThis.BEATLAB_TEXTS = { data: {}, meta: {}, add(id, m, s) { this.data[id] = { meta: m, secs: s }; }, addIndex(i) { Object.assign(this.meta, i); } };
if (!fs.existsSync(path.join(dir, 'index.js'))) { console.log('parallels: texts folder not found, skipped'); process.exit(0); }
vm.runInThisContext(fs.readFileSync(path.join(dir, 'index.js'), 'utf8'));
const load = (id) => { if (!BEATLAB_TEXTS.data[id]) vm.runInThisContext(fs.readFileSync(path.join(dir, id + '.js'), 'utf8')); return BEATLAB_TEXTS.data[id]; };
const latinShare = (t) => { const l = (t.match(/\p{L}/gu) || []).length; return l ? (t.match(/[A-Za-z]/g) || []).length / l : 0; };

ok('there are at least 15 parallels', PARALLELS.length >= 15, PARALLELS.length);
ok('parallel ids are unique', new Set(PARALLELS.map((p) => p.id)).size === PARALLELS.length);
let items = 0; let linksN = 0; const kindsUsed = new Set(); const tradsUsed = new Set();
PARALLELS.forEach((P) => {
  ok(P.id + ': has a title, theme and blurb', P.title && P.theme && P.blurb.length > 40);
  ok(P.id + ': 2–12 passages', P.items.length >= 2 && P.items.length <= core.MARK_LIMITS.items, P.items.length);
  P.items.forEach(([tid, find, label, len], k) => {
    items++; tradsUsed.add(tid);
    ok(`${P.id}#${k + 1}: ${tid} is in the library`, !!BEATLAB_TEXTS.meta[tid], tid);
    if (!BEATLAB_TEXTS.meta[tid]) return;
    const t = load(tid); const r = core.resolveSpot(t.secs, find, len);
    ok(`${P.id}#${k + 1}: “${find.slice(0, 40)}” is found in ${tid}`, !!r);
    if (!r) return;
    ok(`${P.id}#${k + 1}: the passage has a usable length`, r.q.length >= 25 && r.q.length <= core.MARK_LIMITS.quote, r.q.length);
    ok(`${P.id}#${k + 1}: the passage is English`, latinShare(r.q) > 0.97, r.q.slice(0, 80));
    ok(`${P.id}#${k + 1}: the saved range matches the text`, core.paragraphAt(t.secs, r.s, r.p).slice(r.a, r.b) === r.q);
    ok(`${P.id}#${k + 1}: has a label`, label && label.length >= 3 && label.length <= core.MARK_LIMITS.label, label);
  });
  P.links.forEach(([a, b, kind, note]) => {
    linksN++; kindsUsed.add(kind);
    ok(`${P.id}: link ${a}↔${b} points at two different passages`, a !== b && a >= 1 && b >= 1 && a <= P.items.length && b <= P.items.length);
    ok(`${P.id}: link kind “${kind}” is one of the Echo kinds`, !!ECHO_KINDS[kind] && core.THREAD_KINDS.includes(kind));
    ok(`${P.id}: link ${a}↔${b} has a real note`, note.length > 50 && note.length <= core.MARK_LIMITS.note);
  });
});
ok('every kind of relation is used somewhere', [...kindsUsed].length >= 4, [...kindsUsed]);
ok('the parallels reach across many texts', tradsUsed.size >= 40, tradsUsed.size);
/* a parallel opens as a thread that the pack sanitizer accepts */
const g = require('../src/js/2m-gather-core.js');
PARALLELS.slice(0, 4).forEach((P) => {
  const ids = P.items.map((_, k) => 'i' + k); const th = { id: P.id, title: P.title, note: P.blurb, items: P.items.map(([tid, find, label, len], k) => { const r = core.resolveSpot(load(tid).secs, find, len); return { id: ids[k], tid, s: r.s, p: r.p, a: r.a, b: r.b, q: r.q, label, sh: r.heading }; }), links: P.links.map(([a, b, kind, note]) => ({ a: ids[a - 1], b: ids[b - 1], kind, note })) };
  let s; try { s = g.sanitizeThread(th); } catch (e) { s = null; }
  ok(P.id + ': survives the pack sanitizer whole', s && s.items.length === P.items.length && s.links.length === P.links.length);
});
console.log(`parallels: ${items} passages, ${linksN} relations; ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
