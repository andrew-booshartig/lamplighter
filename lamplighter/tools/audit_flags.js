/* Soft flags over the whole database: things worth a human look, not hard failures (those are in tests/data-integrity.test.js).
   Run: node tools/audit_flags.js   -> writes ../AUDIT_FLAGS.md
   1. a place whose coordinates lie far from every other record in the country it names     (typo in a latitude or longitude, or the wrong country code)
   2. a station's dated range that the numbers in its own "when" text do not fit            (the dates disagree inside one record)
   3. a Library work whose date note and whose Atlas record give different centuries         (the two sources of dates disagree)
   4. a text dated well before the tradition it belongs to began                              (an anachronism, unless it is oral or a later attribution)
   5. a site or text whose label gives a century that its own year does not fit */
const fs = require('fs'); const path = require('path'); const vm = require('vm');
const { M } = require('../tests/_harness.js'); const root = path.join(__dirname, '../..');
const A = {}; const ctx = { BEATLAB_ATLAS: new Proxy({}, { get: () => (...a) => { if (a.length === 2) A[a[0]] = a[1]; } }) };
for (const f of ['index', 'core', 'places', 'sites', 'events', 'texts']) vm.runInNewContext(fs.readFileSync(path.join(root, 'atlas', f + '.js'), 'utf8'), ctx);
const out = []; const sec = (t, d, rows, n = 60) => { out.push(`\n## ${t} (${rows.length})\n${d}\n`); rows.slice(0, n).forEach((r) => out.push('- ' + r)); if (rows.length > n) out.push(`- … ${rows.length - n} more`); };
const rad = (d) => (d * Math.PI) / 180; const km = (a, b, c, d) => { const x = Math.sin(rad(c - a) / 2) ** 2 + Math.cos(rad(a)) * Math.cos(rad(c)) * Math.sin(rad(d - b) / 2) ** 2; return 12742 * Math.asin(Math.sqrt(x)); };

/* 1. coordinate outliers by country */
const pts = []; const add = (kind, id, name, cc, la, lo) => { if (cc && la != null && lo != null) pts.push({ kind, id, name, cc, la, lo }); };
A.places.forEach((p) => add('place', p.id, p.name, p.country_iso2, p.lat, p.lon)); A.sites.forEach((s) => add('site', s.id, s.name, s.country_iso2, s.lat, s.lon));
A.texts.forEach((t) => add('text', t.id, t.title, t.country_iso2, t.lat, t.lon)); A.core.traditions.forEach((t) => add('tradition', t.id, t.name, t.origin_country_iso2, t.origin_lat, t.origin_lon));
const by = {}; pts.forEach((p) => { (by[p.cc] = by[p.cc] || []).push(p); });
const far = []; pts.forEach((p) => { const others = by[p.cc].filter((q) => q !== p && !(q.la === p.la && q.lo === p.lo)); if (others.length < 4) return; const d = Math.min(...others.map((q) => km(p.la, p.lo, q.la, q.lo))); if (d > 1800) far.push([d, `${p.kind} ${p.id} “${p.name.slice(0, 40)}” (${p.cc}) at ${p.la}, ${p.lo}: ${Math.round(d)} km from any other ${p.cc} record`]); });
sec('Coordinates far from the rest of their country', 'Check the latitude, longitude and country code. Large or spread-out countries (Russia, the United States, China, Australia, Chile) can be genuine.', far.sort((a, b) => b[0] - a[0]).map((r) => r[1]), 80);

/* 2. a station's range against the numbers in its own "when" text */
const yrs = (txt) => { const o = []; const t = txt.replace(/,/g, ''); let m; const re = /(\d+(?:\.\d+)?)\s*(?:(million|thousand)\s+)?(?:(years?|ya)\s+ago|(BCE|BC|CE|AD)?)/gi;
  const cen = /(\d+)(?:st|nd|rd|th)(?:\s*[–-]\s*(\d+)(?:st|nd|rd|th))?\s*(?:c\.|century|centuries)\s*(BCE|CE)?/gi;
  while ((m = cen.exec(t))) { const a = Number(m[1]); const b = m[2] ? Number(m[2]) : a; const bce = m[3] === 'BCE' || (!m[3] && /BCE/.test(t.slice(m.index, m.index + 40))); const f = (c) => (bce ? [-c * 100, -(c - 1) * 100] : [(c - 1) * 100, c * 100]); o.push(f(a)[0], f(a)[1], f(b)[0], f(b)[1]); }
  const t2 = t.replace(cen, ' ');
  while ((m = re.exec(t2))) { let n = Number(m[1]); if (m[2]) n *= m[2].toLowerCase() === 'million' ? 1e6 : 1e3; if (m[3]) o.push(2026 - n); else if (m[4] === 'BCE' || m[4] === 'BC') o.push(-n); else if (m[4] === 'CE' || m[4] === 'AD') o.push(n); else if (n >= 1000 && n <= 2100 && !/BCE|BC/.test(t2.slice(m.index, m.index + m[0].length + 6))) o.push(n); }
  return o; };
const sbad = []; M.PATH_STATIONS.forEach((s, i) => { const r = M.STATION_TIME[i]; const ys = yrs(s.when || ''); if (!ys.length) return; const lo = Math.min(...ys); const hi = Math.max(...ys); const tol = (x) => Math.max(120, Math.abs(x) * 0.12); if (lo > r[2] + tol(r[2]) || hi < r[1] - tol(r[1])) sbad.push(`station ${i + 1} “${s.title}”: when “${s.when}” reads as ${lo}..${hi}, but the stored range is ${r[1]}..${r[2]}`); });
sec('Station date text disagrees with its stored range', 'The “when” text and the numbers used to place the station on the maps should describe the same period.', sbad, 80);

/* 3. Library date note against the Atlas record for the same work */
const alias = JSON.parse(fs.readFileSync(path.join(__dirname, 'atlas_text_aliases.json'), 'utf8')); const lib = M.LIB_BY_ID; const tb = {}; A.texts.forEach((t) => { tb[t.id] = t; });
const cmp = []; const seen = new Set(); Object.entries(alias).forEach(([aid, lid]) => { if (aid.startsWith('_') || !tb[aid]) return; (Array.isArray(lid) ? lid : [lid]).forEach((id) => { const L = lib[id]; if (!L || seen.has(id + aid)) return; seen.add(id + aid); const ys = yrs(L.when || ''); if (!ys.length) return; const lo = Math.min(...ys); const hi = Math.max(...ys); const t = tb[aid]; const e = t.year_end == null ? t.year_start : t.year_end; if (t.status === 'oral') return; if (hi < t.year_start - 250 || lo > e + 250) cmp.push(`${id} “${L.title}”: Library says “${L.when}” (${lo}..${hi}); Atlas record “${t.title}” says ${t.date_label} (${t.year_start}..${e})`); }); });
sec('Library date note and Atlas record disagree', 'Same work, two sources of dates. One of them may be wrong, or the Atlas record may be a different edition or layer of the work.', cmp, 80);

/* 4. a text older than its tradition */
const tr = Object.fromEntries(A.core.traditions.map((t) => [t.id, t])); const old = A.texts.filter((t) => t.status !== 'oral' && tr[t.tradition_id] && t.year_start < tr[t.tradition_id].start_year - 400).map((t) => `${t.id} “${t.title.slice(0, 50)}” ${t.date_label.slice(0, 40)} belongs to ${t.tradition_id}, which starts ${tr[t.tradition_id].start_year}`);
sec('A written text dated long before its tradition begins', 'Often right (a tradition inherits older writings), sometimes a wrong tradition id or a wrong year.', old, 80);

/* 5. a century in the label against the year */
const cent = []; [...A.sites, ...A.texts].forEach((o) => { const l = o.date_label || ''; const m = /^c?\.?\s*(\d+)(?:st|nd|rd|th)(?:\s*[–-]\s*(\d+)(?:st|nd|rd|th))?\s*century\s*(BCE|CE)?/i.exec(l); if (!m) return; const a = Number(m[1]); const b = m[2] ? Number(m[2]) : a; const bce = /BCE/.test(m[3] || l); const lo = bce ? -Math.max(a, b) * 100 : (Math.min(a, b) - 1) * 100; const hi = bce ? -(Math.min(a, b) - 1) * 100 : Math.max(a, b) * 100; const y = o.year_start; if (y < lo - 120 || y > hi + 120) cent.push(`${o.id}: “${l.slice(0, 50)}” vs year_start ${y}`); });
sec('A century in the date label that the year does not fit', '', cent, 60);

fs.writeFileSync(path.join(root, 'AUDIT_FLAGS.md'), '# Soft flags from tools/audit_flags.js\n\nThings that deserve a human look. Not all are errors.\n' + out.join('\n') + '\n');
console.log(out.filter((l) => l.startsWith('\n## ')).map((l) => l.trim()).join('\n'));
