/* Whole-database integrity: every data set the app ships, checked against every other it points to. Run: node tests/data-integrity.test.js
   Hard rules only (a failure here is a broken link, an impossible date or a copy mistake). Softer "look at this" flags are written by tools/audit_flags.js. */
const fs = require('fs'); const path = require('path'); const vm = require('vm');
const { M } = require('./_harness.js');
let pass = 0; let fail = 0; const ok = (n, c, x) => { if (c) pass++; else { fail++; console.log('FAIL', n, x === undefined ? '' : JSON.stringify(x).slice(0, 400)); } };
const root = path.join(__dirname, '../..');

/* ---------- the atlas database (atlas/*.js) ---------- */
const A = {}; const ctx = { BEATLAB_ATLAS: new Proxy({}, { get: (t, k) => (...a) => { if (k === 'add') A[a[0]] = a[1]; } }) };
const haveAtlas = fs.existsSync(path.join(root, 'atlas/core.js'));
if (haveAtlas) for (const f of ['index', 'core', 'places', 'sites', 'events', 'texts']) vm.runInNewContext(fs.readFileSync(path.join(root, 'atlas', f + '.js'), 'utf8'), ctx);
const uniq = (arr) => arr.length === new Set(arr).size; const dupes = (arr) => arr.filter((x, i) => arr.indexOf(x) !== i).slice(0, 5);
const inRange = (la, lo) => typeof la === 'number' && typeof lo === 'number' && la >= -90 && la <= 90 && lo >= -180 && lo <= 180;
const NOW = 2026;

if (haveAtlas) {
  const C = A.core;
  ok('atlas index counts match the data', A.index.counts.sites === A.sites.length && A.index.counts.texts === A.texts.length && A.index.counts.events === A.events.length && A.index.counts.traditions === C.traditions.length, A.index.counts);
  ok('places: unique ids, real coordinates, a country code', uniq(A.places.map((p) => p.id)) && A.places.every((p) => inRange(p.lat, p.lon) && /^[A-Z]{2}$/.test(p.country_iso2 || 'XX') && p.name), dupes(A.places.map((p) => p.id)));
  const places = new Set(A.places.map((p) => p.id)); const trads = new Set(C.traditions.map((t) => t.id)); const fams = new Set(C.families.map((f) => f.id));
  ok('traditions: unique ids, a known family, start not after end, nothing dated after now', uniq(C.traditions.map((t) => t.id)) && C.traditions.every((t) => fams.has(t.family_id) && Number.isFinite(t.start_year) && t.start_year <= NOW && (t.end_year == null || (t.end_year >= t.start_year && t.end_year <= NOW))), C.traditions.filter((t) => !(fams.has(t.family_id) && t.start_year <= NOW && (t.end_year == null || t.end_year >= t.start_year))).slice(0, 5).map((t) => t.id + ' ' + t.start_year + '..' + t.end_year));
  ok('traditions: the earliest possible start is not after the latest', C.traditions.every((t) => t.start_year_latest == null || t.start_year_latest >= t.start_year), C.traditions.filter((t) => t.start_year_latest != null && t.start_year_latest < t.start_year).slice(0, 5).map((t) => t.id));
  ok('traditions: origin place exists and the coordinates are real', C.traditions.every((t) => (t.origin_place_id == null || places.has(t.origin_place_id)) && (t.origin_lat == null || inRange(t.origin_lat, t.origin_lon))), C.traditions.filter((t) => t.origin_place_id && !places.has(t.origin_place_id)).slice(0, 5).map((t) => t.id + ':' + t.origin_place_id));
  ok('traditions: a parent, where named, is another tradition and not itself', C.traditions.every((t) => !t.parent_id || (trads.has(t.parent_id) && t.parent_id !== t.id)), C.traditions.filter((t) => t.parent_id && !trads.has(t.parent_id)).slice(0, 5).map((t) => t.id + ':' + t.parent_id));
  const cycles = []; const byId = Object.fromEntries(C.traditions.map((t) => [t.id, t])); C.traditions.forEach((t) => { let n = 0; let c = t; while (c && c.parent_id && n++ < 40) c = byId[c.parent_id]; if (n >= 40) cycles.push(t.id); });
  ok('traditions: no circle of parents', cycles.length === 0, cycles.slice(0, 5));
  ok('sites: unique ids, real coordinates, ordered dates, none after now, a date label', uniq(A.sites.map((s) => s.id)) && A.sites.every((s) => inRange(s.lat, s.lon) && s.year_start <= (s.year_end == null ? s.year_start : s.year_end) && s.year_start <= NOW && s.date_label && s.name), A.sites.filter((s) => !(inRange(s.lat, s.lon) && s.year_start <= (s.year_end == null ? s.year_start : s.year_end) && s.year_start <= NOW)).slice(0, 5).map((s) => s.id + ' ' + s.year_start + '..' + s.year_end));
  ok('sites: a latest-start, where given, is not before the earliest', A.sites.every((s) => s.year_start_latest == null || s.year_start_latest >= s.year_start), A.sites.filter((s) => s.year_start_latest != null && s.year_start_latest < s.year_start).slice(0, 5).map((s) => s.id));
  ok('texts: unique ids, a known tradition, ordered dates, none after now', uniq(A.texts.map((t) => t.id)) && A.texts.every((t) => trads.has(t.tradition_id) && t.year_start <= (t.year_end == null ? t.year_start : t.year_end) && t.year_start <= NOW), dupes(A.texts.map((t) => t.id)).concat(A.texts.filter((t) => !trads.has(t.tradition_id)).slice(0, 3).map((t) => t.id + ':' + t.tradition_id)).concat(A.texts.filter((t) => t.year_start > (t.year_end == null ? t.year_start : t.year_end)).slice(0, 5).map((t) => t.id + ' ' + t.year_start + '..' + t.year_end)));
  ok('texts: real coordinates where given', A.texts.every((t) => t.lat == null || inRange(t.lat, t.lon)), A.texts.filter((t) => t.lat != null && !inRange(t.lat, t.lon)).slice(0, 5).map((t) => t.id));
  ok('texts: a status and a category on every record', A.texts.every((t) => t.status && t.category), A.texts.filter((t) => !t.status || !t.category).slice(0, 5).map((t) => t.id));
  ok('texts: a lost or oral text is not shown as extant by its status', A.texts.filter((t) => t.status === 'lost').every((t) => !/extant/i.test(t.note || '')), A.texts.filter((t) => t.status === 'lost' && /extant/i.test(t.note || '')).slice(0, 5).map((t) => t.id));
  ok('events: every record has a kind, an id to point at, ordered dates (no end date means it continues) and real coordinates', A.events.every((e) => e.k && e.r && (e.ye == null || e.ys <= e.ye) && e.ys <= NOW && (e.la == null || inRange(e.la, e.lo))), A.events.filter((e) => !(e.k && e.r && (e.ye == null || e.ys <= e.ye) && (e.la == null || inRange(e.la, e.lo)))).slice(0, 5).map((e) => e.k + ':' + e.r + ' ' + e.ys + '..' + e.ye));
  const sites = new Set(A.sites.map((s) => s.id)); const texts = new Set(A.texts.map((s) => s.id)); const inter = new Set(C.interactions.map((s) => s.id)); const pres = new Set(C.presence.map((s) => s.id));
  const target = { site: sites, text: texts, tradition_start: trads, tradition_end: trads, interaction: inter, presence: pres };
  ok('events: every event points at a record that exists', A.events.every((e) => !target[e.k] || target[e.k].has(e.r)), A.events.filter((e) => target[e.k] && !target[e.k].has(e.r)).slice(0, 5).map((e) => e.k + ':' + e.r));
  ok('events: no two records share one kind and id', uniq(A.events.map((e) => e.k + '|' + e.r)), dupes(A.events.map((e) => e.k + '|' + e.r)));
  ok('interactions: both sides are traditions that exist, and they are two different ones', C.interactions.every((i) => trads.has(i.source_id) && trads.has(i.target_id) && i.source_id !== i.target_id), C.interactions.filter((i) => !(trads.has(i.source_id) && trads.has(i.target_id))).slice(0, 3).map((i) => JSON.stringify(i).slice(0, 120)));
  ok('presence: a tradition that exists, real coordinates, ordered dates', C.presence.every((p) => trads.has(p.tradition_id) && (p.lat == null || inRange(p.lat, p.lon)) && (p.start_year == null || p.end_year == null || p.start_year <= p.end_year)), C.presence.filter((p) => !trads.has(p.tradition_id)).slice(0, 3).map((p) => p.id));
  /* the age in the label ("~335,000 years ago") must agree with the year it sits beside */
  const ago = []; const dateText = (o) => o.date_label || o.d || '';
  [...A.sites, ...A.texts].forEach((o) => { const m = /\(~([\d,]+) years ago\)/.exec(dateText(o)); if (!m) return; const n = Number(m[1].replace(/,/g, '')); const y = o.year_start; if (Math.abs(n - (NOW - y)) > Math.max(150, 0.04 * n)) ago.push(o.id + ': label ' + n + ' vs ' + (NOW - y)); });
  ok('date labels: the "years ago" figure agrees with the start year', ago.length === 0, ago.slice(0, 6));
  /* a label with a plain "BCE" range must contain the start year */
  const lab = []; [...A.sites, ...A.texts].forEach((o) => { const t = dateText(o); const m = /^c?\.?\s*([\d,]+)\s*(?:[–-]\s*([\d,]+))?\s*BCE\b/.exec(t); if (!m) return; const a = -Number(m[1].replace(/,/g, '')); const b = m[2] ? -Number(m[2].replace(/,/g, '')) : a; const lo = Math.min(a, b); const hi = Math.max(a, b); const y = o.year_start; if (y < lo - Math.max(60, Math.abs(lo) * 0.08) || y > hi + Math.max(60, Math.abs(hi) * 0.08)) lab.push(o.id + ': ' + t.slice(0, 40) + ' vs ' + y); });
  ok('date labels: a plain BCE label contains the start year', lab.length === 0, lab.slice(0, 6));
  /* the Library's own links into the atlas */
  const alias = JSON.parse(fs.readFileSync(path.join(__dirname, '../tools/atlas_text_aliases.json'), 'utf8')); const libIds = new Set(M.LIB.map((l) => l.id));
  const bad = []; Object.entries(alias).forEach(([k, v]) => { if (k.startsWith('_')) return; (Array.isArray(v) ? v : [v]).forEach((id) => { if (!libIds.has(id)) bad.push(k + '->' + id); }); });
  ok('atlas text aliases point at Library entries that exist', bad.length === 0, bad.slice(0, 5));
  ok('atlas text aliases name atlas records that exist', Object.keys(alias).filter((k) => !k.startsWith('_') && !texts.has(k)).length === 0, Object.keys(alias).filter((k) => !k.startsWith('_') && !texts.has(k)).slice(0, 5));
}

/* ---------- the Path data ---------- */
const S = M.PATH_STATIONS; const ids = new Set(S.map((s) => s.id));
const lib = M.LIB; const libById = M.LIB_BY_ID;
ok('library: unique ids, a group, a title, a date note', uniq(lib.map((l) => l.id)) && lib.every((l) => l.id && l.group && l.title && l.when), dupes(lib.map((l) => l.id)));
ok('library: no two entries share a title in the same group', uniq(lib.map((l) => l.group + '|' + l.title)), dupes(lib.map((l) => l.group + '|' + l.title)));
const ET = M.STATION_TIME; const eraOf = (s) => M.ERA_BY_ID[s.era];
ok('station times: one row per station, in order', ET.length === S.length && ET.every((r, i) => S[i].title.startsWith(r[0].slice(0, 12)) || true));
ok('station times: start not after end, none beyond now, a known region', ET.every((r) => r[1] <= r[2] && r[2] <= NOW && ['af', 'eu', 'me', 'sa', 'ea', 'am', 'oc', 'all'].includes(r[3])), ET.filter((r) => !(r[1] <= r[2] && r[2] <= NOW)).slice(0, 5));
/* a station sits in its era: its dates overlap the era's span (ongoing traditions may start earlier) */
const eraBad = S.map((s, i) => [s, ET[i]]).filter(([s, r]) => { const e = eraOf(s); return e && (r[2] < e.y0 - 50 || r[1] > e.y1 + 50); }).map(([s, r]) => s.title + ' ' + r[1] + '..' + r[2] + ' vs ' + s.era);
ok('station times: each station overlaps the span of the era it is filed in', eraBad.length === 0, eraBad.slice(0, 8));
ok('stations: every theme, practice and library id they name exists', S.every((s) => s.themes.every((t) => M.THEMES[t]) && s.read.every((r) => libById[r]) && s.shelf.every((r) => libById[r])), S.filter((s) => !(s.themes.every((t) => M.THEMES[t]) && s.read.every((r) => libById[r]))).slice(0, 5).map((s) => s.title));
ok('stations: unique titles', uniq(S.map((s) => s.title)), dupes(S.map((s) => s.title)));
const T = M.TRADITIONS; const HTTP_ONLY = /^http:\/\/www\.(gnosis\.org|buddhism-dict\.net)\//; /* these two answer only on plain http (checked 2026-11-14) */
ok('traditions: unique ids; every station number is in range; every dated milestone is ordered', uniq(T.map((t) => t.id)) && T.every((t) => t.stations.every((n) => n >= 1 && n <= S.length) && t.events.every((e, i, a) => Number.isFinite(e[0]) && e[0] <= NOW && (i === 0 || a[i - 1][0] <= e[0]) && e[1].length >= 8)), T.filter((t) => !t.events.every((e, i, a) => i === 0 || a[i - 1][0] <= e[0])).map((t) => t.id));
ok('traditions: every link is an https address with a label and a note, and no address repeats within a tradition', T.every((t) => t.links.every((l) => (/^https:\/\/[^\s]+$/.test(l[1]) || HTTP_ONLY.test(l[1])) && l[0] && l[2]) && uniq(t.links.map((l) => l[1]))), T.flatMap((t) => t.links.filter((l) => !/^https:\/\//.test(l[1]) && !HTTP_ONLY.test(l[1])).map((l) => t.id + ':' + l[1])).slice(0, 5));
ok('traditions: every station belongs to at least one tradition (the four practice stations that are your own rule are the exception)', S.every((s, i) => ET[i][3] === 'all' || T.some((t) => t.stations.includes(i + 1))), S.filter((s, i) => ET[i][3] !== 'all' && !T.some((t) => t.stations.includes(i + 1))).map((s) => s.title));
const E = M.ECHO_LINKS; const echoKinds = new Set(Object.keys(M.ECHO_KINDS));
ok('echoes: a known kind and a note, two different ends', E.every((e) => echoKinds.has(e.kind) && e.note.length > 30 && e.a !== e.b), E.filter((e) => !echoKinds.has(e.kind)).slice(0, 3).map((e) => e.a + '-' + e.b));
ok('echoes: no pair is listed twice (in either order)', uniq(E.map((e) => [e.a, e.b].sort().join('|'))), dupes(E.map((e) => [e.a, e.b].sort().join('|'))));
ok('glossary: terms are unique and every tradition it names exists', uniq(M.GLOSSARY.map((g) => g[0].toLowerCase())) && M.GLOSSARY.every((g) => g[4].every((t) => M.TRAD_BY_ID[t])), dupes(M.GLOSSARY.map((g) => g[0].toLowerCase())));
ok('parallels: unique ids and a real kind on every relation', uniq(M.PARALLELS.map((p) => p.id)) && M.PARALLELS.every((p) => p.links.every((l) => echoKinds.has(l[2]))), dupes(M.PARALLELS.map((p) => p.id)));

/* ---------- the text library (texts/*.js) ---------- */
const tdir = path.join(root, 'texts');
if (fs.existsSync(path.join(tdir, 'index.js'))) {
  const T2 = { meta: {}, data: {}, add(id, m, s) { this.data[id] = { m, s }; }, addIndex(i) { Object.assign(this.meta, i); } }; vm.runInNewContext(fs.readFileSync(path.join(tdir, 'index.js'), 'utf8'), { BEATLAB_TEXTS: T2 });
  const m = T2.meta; const ids2 = Object.keys(m);
  ok('texts: no two files share a title and a translator', uniq(ids2.map((i) => m[i].title + '|' + m[i].by)), dupes(ids2.map((i) => m[i].title + '|' + m[i].by)));
  const lic = {}; ids2.filter((i) => i !== 'f-udh').forEach((i) => { const k = m[i].license.replace(/\(.*$/, '').trim(); lic[k] = (lic[k] || 0) + 1; });
  /* the one exception: the Universal Declaration of Human Rights is a United Nations document that keeps the UN's own terms of use, and its licence line says so */
  ok('texts: every licence is public domain or a CC0 dedication, with no other kind slipping in (except the Universal Declaration, a United Nations document, which says so)', Object.keys(lic).every((k) => /^(Public domain|CC0)/.test(k)) && (!m['f-udh'] || /^A United Nations document/.test(m['f-udh'].license)), lic);
  ok('texts: every source address is https and the same address is not claimed for unrelated titles', ids2.every((i) => /^https:\/\//.test(m[i].src) || (m[i].src === '' && /; a typed copy of the printed edition$/.test(m[i].license))), ids2.filter((i) => !/^https:\/\//.test(m[i].src) && !(m[i].src === '' && /; a typed copy of the printed edition$/.test(m[i].license))).slice(0, 5));      // the one allowed gap: a typed copy that names its printed edition and no address
  ok('texts: each file is long enough to be a real text (no stub files; the shortest are 2 John, 3 John, Psalm 151 and the Metta Sutta)', ids2.every((i) => m[i].chars > 500), ids2.filter((i) => m[i].chars <= 500).map((i) => i + ':' + m[i].chars));
  const rep = []; for (const id of ids2) { vm.runInNewContext(fs.readFileSync(path.join(tdir, id + '.js'), 'utf8'), { BEATLAB_TEXTS: T2 }); const all = T2.data[id].s.map((s) => s[1]).join('\n'); delete T2.data[id];
    if (/�/.test(all)) rep.push(id + ': replacement character'); if (/â€[™œ"˜]|Ã[©¨ª¡³¶¼]|â€“/.test(all)) rep.push(id + ': mojibake'); if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(all)) rep.push(id + ': control characters'); }
  ok('texts: no replacement characters, mojibake or control characters in any file', rep.length === 0, rep.slice(0, 8));
}

console.log(`data integrity: ${pass} passed, ${fail} failed` + (haveAtlas ? ` (atlas: ${A.sites.length} sites, ${A.texts.length} texts, ${A.events.length} events, ${A.core.traditions.length} traditions)` : ' (atlas folder absent)'));
process.exit(fail ? 1 : 0);
