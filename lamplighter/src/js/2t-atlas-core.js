/* ═══════════════════════════ 2t · The Atlas: data layer and map maths ═══════════════════════════
   Pure functions, no page. They implement the rules in the World Religion Atlas handoff exactly: signed years with no year 0, the presence rule
   (a row is on the map at year Y if year_start <= Y and (year_end is null or year_end >= Y)), the piecewise slider scale, lineage, event
   thinning, and the label format. Missing fields mean null (the data files drop nulls). Nothing is invented, rounded or "fixed" here. */
globalThis.BEATLAB_ATLAS = globalThis.BEATLAB_ATLAS || { data: {}, add(name, d) { this.data[name] = d; } };
const ATLAS_LAT = { max: 82, min: -58 }; /* the band of the world the map shows: it holds every place in the data */

/* ── years ── */
const atlSnap = (y, dir = 1) => { y = Math.round(y); return y === 0 ? (dir >= 0 ? 1 : -1) : y; };
const atlNum = (n) => (n >= 10000 ? n.toLocaleString('en-US') : String(n));
/* "c. 2,000 BCE", "800 CE", "1500", per the handoff's label rules (1–999 CE take the suffix, 1000 onward are plain) */
function atlFmtYear(y, circa) {
  if (y == null) return '';
  const body = y < 0 ? atlNum(-y) + ' BCE' : y < 1000 ? y + ' CE' : String(y);
  return (circa ? 'c. ' : '') + body;
}
/* slider position <-> year, linear between the stops */
function atlYearPos(y, stops) {
  if (y <= stops[0].year) return stops[0].pos; if (y >= stops[stops.length - 1].year) return stops[stops.length - 1].pos;
  for (let i = 1; i < stops.length; i++) if (y <= stops[i].year) { const a = stops[i - 1]; const b = stops[i]; return a.pos + (b.pos - a.pos) * (y - a.year) / (b.year - a.year); }
  return 1;
}
function atlPosYear(p, stops) {
  p = Math.min(1, Math.max(0, p));
  for (let i = 1; i < stops.length; i++) if (p <= stops[i].pos) { const a = stops[i - 1]; const b = stops[i]; return a.year + (b.year - a.year) * (p - a.pos) / (b.pos - a.pos); }
  return stops[stops.length - 1].year;
}
/* a year reached by moving the slider by `dPos`; it never lands on year 0 and never skips a real year at the end of the track */
function atlNudge(y, dPos, stops) {
  const p = atlYearPos(y, stops) + dPos; const lo = stops[0].year; const hi = stops[stops.length - 1].year;
  let n = atlSnap(atlPosYear(p, stops), dPos); if (n === y) n = atlSnap(y + (dPos >= 0 ? 1 : -1), dPos);
  return Math.min(hi, Math.max(lo, n));
}
function atlEraOf(y, bands) { return bands.find((b) => y >= b.start && y < b.end) || bands[bands.length - 1]; }
/* which timeline events to show for a window of this many years */
function atlMinImportance(span, rules) { for (const r of rules) if (span >= r.span_at_least) return r.min_importance; return 1; }

/* ── the loaded data, indexed ── */
function atlIndex(core) {
  const ix = { core, trad: {}, kids: {}, byTrad: {}, fam: {}, famGroup: {}, groups: [], countries: core.countries, practiceBy: {}, tpOf: {}, tpBy: {}, interOf: {} };
  core.traditions.forEach((t) => { ix.trad[t.id] = t; (ix.kids[t.parent_id || ''] = ix.kids[t.parent_id || ''] || []).push(t.id); });
  core.presence.forEach((r) => { (ix.byTrad[r.tradition_id] = ix.byTrad[r.tradition_id] || []).push(r); });
  core.families.forEach((f) => { ix.fam[f.id] = f; });
  core.practices.forEach((p) => { ix.practiceBy[p.id] = p; });
  core.tp.forEach(([t, p]) => { (ix.tpOf[t] = ix.tpOf[t] || []).push(p); (ix.tpBy[p] = ix.tpBy[p] || []).push(t); });
  core.interactions.forEach((r) => { (ix.interOf[r.source_id] = ix.interOf[r.source_id] || []).push(r); (ix.interOf[r.target_id] = ix.interOf[r.target_id] || []).push(r); });
  return ix;
}
function atlSetGroups(ix, groups) { ix.groups = groups; ix.famGroup = {}; groups.forEach((g) => g.families.forEach((f) => { ix.famGroup[f] = g.id; })); }
const atlGroupOf = (ix, tid) => { const t = ix.trad[tid]; return t ? ix.famGroup[t.family_id] || '' : ''; };

/* ── presence ── */
const atlIsPresent = (r, Y) => r.year_start <= Y && (r.year_end == null || r.year_end >= Y);
const atlPresent = (core, Y) => core.presence.filter((r) => atlIsPresent(r, Y));
/* rows to draw at year Y with a strength 0–1: a row fades in across its uncertain start window and fades out over `fadeSpan` years after it ends,
   so growth and decline read as change and not as dots blinking on and off. Rows that fail the strict rule appear only while fading out. */
function atlVisible(core, Y, fadeSpan, allow) {
  const out = [];
  for (const r of core.presence) {
    if (allow && !allow(r)) continue;
    if (r.year_start > Y) continue;
    let a = 1;
    if (r.year_end != null && r.year_end < Y) { const d = Y - r.year_end; if (d > fadeSpan) continue; a = 1 - d / fadeSpan; }
    const lat = r.year_start_latest; if (lat != null && lat > r.year_start && Y < lat) a *= 0.3 + 0.7 * (Y - r.year_start) / (lat - r.year_start);
    out.push({ r, a });
  }
  return out;
}
/* growth that never shows as a pop: strength of a tradition's origin row for a short pulse after it begins */
const atlPulse = (r, Y, span) => (r.event === 'origin' && Y >= r.year_start && Y - r.year_start <= span ? 1 - (Y - r.year_start) / span : 0);

/* ── lineage ── */
function atlLineage(ix, id) { const out = []; let cur = id; while (cur && ix.trad[cur]) { out.push(cur); cur = ix.trad[cur].parent_id; if (out.length > 60) break; } return out; }
function atlDescendants(ix, id) { const out = []; const st = [id]; while (st.length) { const x = st.pop(); (ix.kids[x] || []).forEach((c) => { out.push(c); st.push(c); }); } return out; }

/* ── filters ── allow set of tradition ids, or null for everything. f: { group, family, tradition, practice, q } */
function atlFilterSet(ix, f) {
  if (!f || (!f.group && !f.family && !f.tradition && !f.practice && !f.q)) return null;
  let set = null; const meet = (s) => { set = set ? new Set([...set].filter((x) => s.has(x))) : s; };
  const all = () => new Set(Object.keys(ix.trad));
  if (f.group) { const g = ix.groups.find((x) => x.id === f.group); meet(new Set(Object.values(ix.trad).filter((t) => g && g.families.includes(t.family_id)).map((t) => t.id))); }
  if (f.family) meet(new Set(Object.values(ix.trad).filter((t) => t.family_id === f.family).map((t) => t.id)));
  if (f.tradition && ix.trad[f.tradition]) meet(new Set([f.tradition, ...atlDescendants(ix, f.tradition)]));
  if (f.practice) meet(new Set(ix.tpBy[f.practice] || []));
  if (f.q) meet(new Set(atlSearch(ix, f.q, 9999).map((t) => t.id)));
  return set || all();
}
const atlKey = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
/* traditions by name, original name or founder, best matches first */
function atlSearch(ix, q, max = 12) {
  const k = atlKey(q); if (!k) return []; const words = k.split(' ');
  const sc = [];
  for (const t of Object.values(ix.trad)) {
    const n = atlKey(t.name); const o = atlKey(t.name_original); const f = atlKey(t.founder); let s = 0;
    if (n === k) s = 100; else if (n.startsWith(k)) s = 70; else if (n.split(' ').some((w) => w.startsWith(k))) s = 55; else if (words.every((w) => n.includes(w))) s = 40; else if (o && words.every((w) => o.includes(w))) s = 30; else if (f && words.every((w) => f.includes(w))) s = 15;
    if (s) sc.push([s - Math.min(20, n.length / 8), t]);
  }
  sc.sort((a, b) => b[0] - a[0]); return sc.slice(0, max).map((x) => x[1]);
}

/* ── how many traditions are active in each family group across the track, for the density strip ── */
function atlDensity(ix, stops, bins, allow) {
  const groups = ix.groups.map((g) => g.id); const data = groups.map(() => new Array(bins).fill(0)); const gi = Object.fromEntries(groups.map((g, i) => [g, i]));
  for (let b = 0; b < bins; b++) {
    const Y = atlSnap(atlPosYear((b + 0.5) / bins, stops)); const seen = new Set();
    for (const r of ix.core.presence) { if (!atlIsPresent(r, Y) || seen.has(r.tradition_id)) continue; if (allow && !allow(r)) continue; seen.add(r.tradition_id); const g = atlGroupOf(ix, r.tradition_id); if (g in gi) data[gi[g]][b]++; }
  }
  let max = 0; for (let b = 0; b < bins; b++) { let s = 0; for (let g = 0; g < groups.length; g++) s += data[g][b]; if (s > max) max = s; }
  return { groups, data, max };
}

/* ── events and interactions ── */
function atlEventsIn(events, y0, y1, minImp, max = 400) {
  const out = []; for (const e of events) { if (e.i < minImp) continue; const end = e.ye == null ? e.ys : e.ye; if (e.ys <= y1 && end >= y0) out.push(e); }
  out.sort((a, b) => b.i - a.i || a.ys - b.ys); return out.slice(0, max);
}
/* "moments around this time": events that START in the window (a long-lived presence row that merely overlaps the year is not a moment), biggest first, then nearest */
function atlMoments(events, y0, y1, minImp, Y, max = 8) {
  const out = []; for (const e of events) { if (e.i < minImp) continue; if ((e.ys >= y0 && e.ys <= y1) || (e.k === 'tradition_end' && e.ys >= y0 && e.ys <= y1)) out.push(e); }
  out.sort((a, b) => b.i - a.i || Math.abs(a.ys - Y) - Math.abs(b.ys - Y)); return out.slice(0, max);
}
/* the moments the story mode stops at: importance 5, in time order, one per tradition and year */
function atlStory(events) { const seen = new Set(); return events.filter((e) => e.i === 5 && (e.k === 'tradition_start' || e.k === 'interaction' || e.k === 'presence' || e.k === 'site' || e.k === 'text' || e.k === 'tradition_end')).filter((e) => { const k = e.t + '|' + e.ys; if (seen.has(k)) return false; seen.add(k); return true; }).sort((a, b) => a.ys - b.ys); }
/* an interaction is "active" at Y if Y falls in its window; a single moment (end = start) stays visible for `span` years either side so it can be seen */
function atlInteractionsAt(core, Y, span) {
  return core.interactions.filter((r) => { const e = r.year_end == null ? Infinity : r.year_end; const s = r.year_start; return e === s ? Math.abs(Y - s) <= span : s <= Y && Y <= e; });
}
/* Interactions are written as sentences. Direction is stated only where the data states it the same way throughout; conversions, absorption and revival are
   recorded in both directions in the source, so they are worded neutrally. */
const ATL_SENTENCE = {
  derive: (s, t) => `${t} grew out of ${s}`, influence: (s, t) => `${s} influenced ${t}`, schism: (s, t) => `${t} split from ${s}`, reform: (s, t) => `${t} arose as a reform of ${s}`,
  suppress: (s, t) => `${s} suppressed ${t}`, persecution: (s, t) => `${s} persecuted ${t}`, transmission: (s, t) => `${s} was carried into ${t}`,
  conflict: (s, t) => `${s} and ${t} came into conflict`, syncretism: (s, t) => `${s} and ${t} blended`, coexist: (s, t) => `${s} and ${t} coexisted`, dialogue: (s, t) => `${s} and ${t} entered dialogue`,
  convert: (s, t) => `Conversions between ${s} and ${t}`, absorb: (s, t) => `${s} and ${t}: one absorbed the other`, revive: (s, t) => `A revival linking ${s} and ${t}`,
};
function atlSentence(ix, r) { const s = ix.trad[r.source_id]; const t = ix.trad[r.target_id]; const f = ATL_SENTENCE[r.type] || ((a, b) => `${a} and ${b}`); return f(s ? s.name : r.source_id, t ? t.name : r.target_id); }

/* ── one tradition's own timeline: its beginning, places, texts, contacts, branches and endings, in order ──
   Built from the catalogue's event list (every record already has a date), plus the contacts and branches that touch it. With a limit, the most important
   stay, always including the beginning and any ending, and the result is put back in date order. Nothing here is invented. */
const ATL_TL_KIND = { tradition_start: 'Begins', tradition_end: 'Ends', presence: 'On the map', site: 'Place', text: 'Text', interaction: 'Contact', branch: 'Branch' };
function atlTraditionTimeline(ix, events, id, max) {
  const t = ix.trad[id]; if (!t) return { items: [], total: 0, kinds: {} };
  const all = []; const seen = new Set(); const put = (it) => { const key = it.kind + '|' + it.y + '|' + String(it.label).toLowerCase(); if (seen.has(key)) return; seen.add(key); all.push(it); };
  const haveInter = new Set();
  for (const e of events || []) { if (e.t !== id || e.ys == null) continue; if (e.k === 'interaction') haveInter.add(e.r); put({ y: e.ys, ye: e.ye == null ? null : e.ye, kind: e.k, label: e.l, date: e.d || '', imp: e.i || 2, lat: e.la == null ? null : e.la, lon: e.lo == null ? null : e.lo, ref: e.r || '' }); }
  for (const r of ix.interOf[id] || []) { if (haveInter.has(r.id) || r.year_start == null) continue; put({ y: r.year_start, ye: r.year_end == null ? null : r.year_end, kind: 'interaction', label: atlSentence(ix, r) + (r.note ? ' (' + r.note.replace(/\.$/, '') + ')' : ''), date: r.date_label || '', imp: 3, lat: r.lat == null ? null : r.lat, lon: r.lon == null ? null : r.lon, ref: r.id }); }
  for (const k of ix.kids[id] || []) { const c = ix.trad[k]; if (!c || c.start_year == null) continue; put({ y: c.start_year, ye: null, kind: 'branch', label: c.name + ' grows out of it', date: c.date_label || '', imp: 3, lat: c.origin_lat == null ? null : c.origin_lat, lon: c.origin_lon == null ? null : c.origin_lon, ref: k, to: k }); }
  const rank = (i) => (i.kind === 'tradition_start' ? 0 : i.kind === 'tradition_end' ? 2 : 1); const order = (a, b) => a.y - b.y || rank(a) - rank(b) || b.imp - a.imp || String(a.label).localeCompare(String(b.label));
  const kinds = {}; all.forEach((i) => { kinds[i.kind] = (kinds[i.kind] || 0) + 1; });
  let items = all.slice().sort(order);
  if (max && items.length > max) {
    const must = new Set(items.filter((i) => i.kind === 'tradition_start' || i.kind === 'tradition_end'));
    const rest = items.filter((i) => !must.has(i)).sort((a, b) => b.imp - a.imp || a.y - b.y).slice(0, Math.max(0, max - must.size));
    items = [...must, ...rest].sort(order);
  }
  return { items, total: all.length, kinds };
}

/* ── can an Atlas text record be opened? ──
   A catalogue record (a scripture, hymn, law, inscription, oral corpus) is not the text itself. The Library may hold it as one file, as part of the work, as several files that together are
   the work, as an entry it lists without a copy to read here, or not at all. tools/build_atlas.py works out which Library ids a record has (`lib`, `libs`, `libp`); `have(id)` says whether the
   Library holds a readable copy in this folder. The answer is always one of five states, so no row is ever left without either a way to open it or a plain sentence saying why not.
     read   one readable file       parts  several files that are the work together (the first is opened, the rest are listed)
     part   a readable file that holds only part of the work       listed  the Library names it but holds no copy to read here       none  the Library has nothing of it */
function atlTextAccess(x, have) {
  const raw = x && Array.isArray(x.libs) && x.libs.length ? x.libs : x && x.lib ? [x.lib] : []; const ids = raw.filter((id) => typeof id === 'string' && id); const held = ids.filter((id) => have(id));
  if (held.length) return { state: x.libp ? 'part' : held.length > 1 ? 'parts' : 'read', ids: held, first: held[0], listed: ids };
  if (ids.length) return { state: 'listed', ids: [], first: ids[0], listed: ids };
  return { state: 'none', ids: [], first: '', listed: [] };
}
/* the plain sentence for a record with nothing to open. It never says a text does not exist when it only is not held: an oral tradition was not written down, a lost work is lost,
   a work not yet deciphered cannot be read by anyone, and the rest are simply not in the Library (no public-domain or openly licensed copy is held). `labels` is the Atlas's status_labels. */
function atlTextNone(x, labels) {
  const st = x && x.status; const L = labels || {};
  if (st === 'oral') return 'Oral tradition: no written text to read';
  if (st === 'lost') return 'Lost: no text survives';
  if (st === 'und') return 'Not yet deciphered: no text to read';
  if (st === 'frag') return 'Fragments only: not in the Library';
  if (st === 'rec' || st === 'dis') return (L[st] || (st === 'rec' ? 'Reconstructed' : 'Authenticity disputed')) + ': not in the Library';
  return 'Not in the Library';
}

/* ── place names ── */
function atlPlaceName(places, countries, row) {
  if (row.place_id && places[row.place_id]) return places[row.place_id].name;
  const c = countries[row.country_iso2 || row.origin_country_iso2]; return c ? c[0] : '';
}

/* ── the flat map ──
   Plate carrée over the band ATLAS_LAT, optionally re-centred on any longitude and turned by 0, 90 or 180 degrees (north up; east up, as on medieval
   Christian maps; south up, as on many medieval Muslim and Chinese maps). Plane units are degrees; the view applies rotation, zoom and pan. */
function atlView(o) {
  const lon0 = o.lon0 || 0; const rot = [0, 90, 180].includes(o.rot) ? o.rot : 0; const zoom = Math.max(1, o.zoom || 1); const w = o.w; const h = o.h;
  const ex = rot === 90 ? ATLAS_LAT.max - ATLAS_LAT.min : 360; const ey = rot === 90 ? 360 : ATLAS_LAT.max - ATLAS_LAT.min;
  const fit = Math.min(w / ex, h / ey); const k = fit * zoom; const cv = -(ATLAS_LAT.max + ATLAS_LAT.min) / 2; const px = o.px || 0; const py = o.py || 0; /* pan in rotated plane degrees */
  const wrap = (l) => ((((l - lon0) + 180) % 360) + 360) % 360 - 180;
  const rotate = (x, y) => (rot === 0 ? [x, y] : rot === 90 ? [y, -x] : [-x, -y]);
  const unrotate = (x, y) => (rot === 0 ? [x, y] : rot === 90 ? [-y, x] : [-x, -y]);
  const v = {
    w, h, lon0, rot, zoom, k, fit, px, py,
    plane(lon, lat, copy = 0) { return [wrap(lon) + 360 * copy, -lat]; },
    toScreen(lon, lat, copy = 0) { const [u, vv] = this.plane(lon, lat, copy); const [x, y] = rotate(u, vv - cv); return [w / 2 + (x - px) * k, h / 2 + (y - py) * k]; },
    /* like toScreen, but u is already an unwrapped longitude relative to the centre: rings that cross the seam keep their shape. copy shifts by whole worlds */
    toScreenU(u, lat, copy = 0) { const [x, y] = rotate(u + 360 * copy, -lat - cv); return [w / 2 + (x - px) * k, h / 2 + (y - py) * k]; },
    /* the same two answers without making arrays, for the loops that run for every row or every coastline point on every frame: the pair is written into out and returned */
    toXY(lon, lat, copy, out) { return this.uToXY(wrap(lon), lat, copy, out); },
    uToXY(u, lat, copy, out) { const a = u + 360 * copy; const s = -lat - cv; if (rot === 0) { out[0] = w / 2 + (a - px) * k; out[1] = h / 2 + (s - py) * k; } else if (rot === 90) { out[0] = w / 2 + (s - px) * k; out[1] = h / 2 + (-a - py) * k; } else { out[0] = w / 2 + (-a - px) * k; out[1] = h / 2 + (-s - py) * k; } return out; },
    /* for one copy of the world the screen position is a straight formula in the two inputs: x = x0 + xu·u + xl·lat and y = y0 + yu·u + yl·lat, so a whole coastline costs two multiplies per point */
    affine(copy = 0) { const a1 = rot === 0 ? 1 : rot === 180 ? -1 : 0; const a2 = rot === 90 ? 1 : 0; const b1 = rot === 90 ? -1 : 0; const b2 = rot === 0 ? 1 : rot === 180 ? -1 : 0; return { x0: w / 2 + k * (a1 * 360 * copy - a2 * cv - px), xu: k * a1, xl: -k * a2, y0: h / 2 + k * (b1 * 360 * copy - b2 * cv - py), yu: k * b1, yl: -k * b2 }; },
    fromScreen(sx, sy) { const x = (sx - w / 2) / k + px; const y = (sy - h / 2) / k + py; const [u, vv] = unrotate(x, y); const lat = -(vv + cv); let lon = u + lon0; lon = ((lon + 180) % 360 + 360) % 360 - 180; return [lon, lat]; },
    /* the world rectangle in screen coordinates (for clipping) */
    outline() { const c = [[-180, ATLAS_LAT.max], [180, ATLAS_LAT.max], [180, ATLAS_LAT.min], [-180, ATLAS_LAT.min]]; return c.map(([u, la]) => { const [x, y] = rotate(u, -la - cv); return [w / 2 + (x - px) * k, h / 2 + (y - py) * k]; }); },
    wrapLon: wrap,
    /* keep the map from being dragged out of sight */
    clamp() { const ex2 = (rot === 90 ? ATLAS_LAT.max - ATLAS_LAT.min : 360) / 2; const ey2 = (rot === 90 ? 360 : ATLAS_LAT.max - ATLAS_LAT.min) / 2; const mx = Math.max(0, ex2 - w / 2 / k); const my = Math.max(0, ey2 - h / 2 / k); return { px: Math.min(mx, Math.max(-mx, px)), py: Math.min(my, Math.max(-my, py)) }; },
  };
  return v;
}
/* ── motion: easing, a zoom that keeps the point under the pointer still, and a glide after a drag. Pure maths, so it can be tested without a screen. ──
   A view is { zoom, px, py } (pan is in degrees of the turned plane, as in atlView). One frame of motion moves the live view toward its targets. */
const ATL_ZOOM = { min: 1, max: 40 };
/* zoomOmega and panOmega are the stiffness of the two springs, per millisecond (a spring is about 95% of the way after 4.7 / omega ms: 310 and 430 ms); glideTau is in milliseconds; minSpeed in screen pixels per millisecond */
const ATL_MOTION = { zoomOmega: 0.015, panOmega: 0.011, glideTau: 360, minSpeed: 0.02 };
/* the share of the remaining distance covered in dtMs; two steps of 8 ms cover exactly what one step of 16 ms does, so the speed does not depend on the frame rate */
const atlShare = (dtMs, tauMs) => 1 - Math.exp(-Math.max(0, dtMs) / Math.max(1, tauMs));
/* a critically damped spring toward a target, solved exactly, so it is the same at any frame rate and never overshoots from rest. x is the position, v the velocity (per millisecond). Unlike easing by a fixed share of
   the distance left, the speed is continuous: it builds up and dies away, and a new target in mid-flight (the next notch of a mouse wheel) bends the path instead of kinking it. */
const atlSpring = (x, v, target, dtMs, omega) => { const dt = Math.max(0, dtMs); const y = x - target; const e = Math.exp(-omega * dt); const c = v + omega * y; return { x: target + (y + c * dt) * e, v: (v - omega * c * dt) * e }; };
/* the view after zooming by a factor about the screen point (ax, ay): the place under that point stays under it. o is { w, h, lon0, rot, zoom, px, py } */
function atlZoomAbout(o, f, ax, ay) {
  const v = atlView(o); const z2 = Math.min(ATL_ZOOM.max, Math.max(ATL_ZOOM.min, v.zoom * f)); const s = 1 / v.k - 1 / (v.fit * z2);
  return { zoom: z2, px: v.px + (ax - o.w / 2) * s, py: v.py + (ay - o.h / 2) * s };
}
/* A picture of the land is drawn once and then moved, not drawn again for every frame of a pan or a zoom. It was drawn when the view was c = { k, px, py } (k in pixels per degree), on a canvas that reaches mx and my
   past the window on every side. This says how to show it for the view v = { k, px, py, w, h }: scaled by s about the middle of the window and shifted by (dx, dy) pixels. ok is true while the moved picture still
   covers the whole window and is not stretched or shrunk past what looks fine; when it is false the land must be drawn again. */
function atlLayerPlan(c, v, mx, my) {
  const s = v.k / c.k; const dx = (c.px - v.px) * v.k; const dy = (c.py - v.py) * v.k; const hw = v.w / 2; const hh = v.h / 2;
  const x0 = hw + (-hw - dx) / s; const x1 = hw + (hw - dx) / s; const y0 = hh + (-hh - dy) / s; const y1 = hh + (hh - dy) / s;   /* the window's corners, back in the picture's own coordinates */
  return { s, dx, dy, ok: s >= 0.62 && s <= 1.6 && x0 >= -mx - 1e-6 && x1 <= v.w + mx + 1e-6 && y0 >= -my - 1e-6 && y1 <= v.h + my + 1e-6, still: Math.abs(s - 1) < 1e-9 && Math.abs(dx) < 1e-6 && Math.abs(dy) < 1e-6 };
}
/* the pan that puts a place in the middle of the screen (it does not depend on the zoom) */
function atlCentreOn(o, lon, lat) { const v = atlView(Object.assign({}, o, { px: 0, py: 0 })); const [sx, sy] = v.toScreen(lon, lat); return { px: (sx - o.w / 2) / v.k, py: (sy - o.h / 2) / v.k }; }
/* after a drag is let go the map keeps moving and slows: the velocity decays exponentially, and the step is the distance covered meanwhile */
function atlGlide(v, dtMs, tauMs) { const e = Math.exp(-dtMs / tauMs); return { v: v * e, d: v * tauMs * (1 - e) }; }
/* One frame. m is the live view { zoom, px, py }; t the targets { zoom, ax, ay (the point the zoom is anchored on), px, py (null when there is no pan target) } with the speeds of the two springs
   (vz in log-zoom per millisecond, vpx and vpy in plane degrees per millisecond; they start at nothing and are kept here between frames); g the glide { vx, vy } in plane degrees per millisecond;
   geo is { w, h, lon0, rot }. Changes m, t and g in place and says whether anything is still moving. */
function atlStepMotion(m, t, g, geo, dtMs) {
  let moving = false; const at = (z) => Object.assign({ zoom: z, px: m.px, py: m.py }, geo);
  if (t.zoom !== m.zoom || t.vz) {
    /* zoom is felt as a ratio, so the spring works on its logarithm */
    const lt = Math.log(t.zoom); const s = atlSpring(Math.log(m.zoom), t.vz || 0, lt, dtMs, ATL_MOTION.zoomOmega); const done = Math.abs(s.x - lt) < 0.002 && Math.abs(s.v) < 0.00002;
    const want = done ? t.zoom : Math.exp(s.x); const o = atlZoomAbout(at(m.zoom), want / m.zoom, t.ax, t.ay); m.zoom = done ? t.zoom : o.zoom; m.px = o.px; m.py = o.py;
    t.vz = done || want < ATL_ZOOM.min || want > ATL_ZOOM.max ? 0 : s.v; if (m.zoom !== t.zoom || t.vz) moving = true;
  }
  const k = atlView(at(m.zoom)).k;
  if (t.px != null) {
    const ct = atlView(Object.assign({ zoom: m.zoom, px: t.px, py: t.py }, geo)).clamp(); t.px = ct.px; t.py = ct.py;     /* a target outside the world is pulled back in */
    const sx = atlSpring(m.px, t.vpx || 0, t.px, dtMs, ATL_MOTION.panOmega); const sy = atlSpring(m.py, t.vpy || 0, t.py, dtMs, ATL_MOTION.panOmega); m.px = sx.x; m.py = sy.x; t.vpx = sx.v; t.vpy = sy.v;
    if (Math.abs(t.px - m.px) * k < 0.25 && Math.abs(t.py - m.py) * k < 0.25 && Math.hypot(t.vpx, t.vpy) * k < 0.005) { m.px = t.px; m.py = t.py; t.px = t.py = null; t.vpx = t.vpy = 0; } else moving = true;
  }
  if (g.vx || g.vy) {
    const a = atlGlide(g.vx, dtMs, ATL_MOTION.glideTau); const b = atlGlide(g.vy, dtMs, ATL_MOTION.glideTau); m.px += a.d; m.py += b.d; g.vx = a.v; g.vy = b.v;
    if (Math.hypot(g.vx, g.vy) * k < ATL_MOTION.minSpeed) g.vx = g.vy = 0; else moving = true;
  }
  const c = atlView(at(m.zoom)).clamp(); if (c.px !== m.px) g.vx = 0; if (c.py !== m.py) g.vy = 0; m.px = c.px; m.py = c.py;      /* a glide that reaches the edge stops there */
  return moving;
}
/* the named ways of looking at the world: a centre longitude and a turn, with an honest label. These are conventions, not copies of anyone's map. */
const ATL_LENSES = [
  { id: 'modern', name: 'Modern', lon0: 0, rot: 0, blurb: 'North at the top, centred on Greenwich: the usual modern convention.' },
  { id: 'jerusalem', name: 'Jerusalem at the centre, east up', lon0: 35.2, rot: 90, zoom: 2.2, blurb: 'The medieval Christian way: east (the Orient) at the top and Jerusalem at the centre, as on the Hereford Mappa Mundi and many T-O maps.' },
  { id: 'mecca', name: 'Mecca at the centre, south up', lon0: 39.8, rot: 180, blurb: 'Many medieval Muslim geographers, al-Idrisi among them, drew with south at the top. Centred here on Mecca, the direction of Muslim prayer.' },
  { id: 'china', name: 'China at the centre, south up', lon0: 105, rot: 180, blurb: 'Early Chinese maps, such as those from Mawangdui (168 BCE), put south at the top. Centred on the Middle Kingdom.' },
  { id: 'pacific', name: 'Pacific at the centre', lon0: 180, rot: 0, blurb: 'The Pacific in the middle: the view from Polynesia, Japan and Australia, and the one that keeps the Americas and Asia together.' },
  { id: 'india', name: 'India at the centre', lon0: 80, rot: 0, blurb: 'Centred on the Indian subcontinent, the middle of the Buddhist and Hindu world.' },
];
if (typeof module !== 'undefined' && module.exports) module.exports = { ATL_ZOOM, ATL_MOTION, atlShare, atlSpring, atlLayerPlan, atlZoomAbout, atlCentreOn, atlGlide, atlStepMotion, ATLAS_LAT, atlSnap, atlFmtYear, atlYearPos, atlPosYear, atlNudge, atlEraOf, atlMinImportance, atlIndex, atlSetGroups, atlGroupOf, atlIsPresent, atlPresent, atlVisible, atlPulse, atlLineage, atlDescendants, atlFilterSet, atlKey, atlSearch, atlDensity, atlEventsIn, atlMoments, atlStory, atlTraditionTimeline, ATL_TL_KIND, atlTextAccess, atlTextNone, atlInteractionsAt, atlSentence, atlPlaceName, atlView, ATL_LENSES };
