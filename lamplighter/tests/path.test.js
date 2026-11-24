// Run: node tests/path.test.js — integrity of the Path data (library coverage, stations, practices, scripts)
const fs = require('fs'); const path = require('path');
global.REFS = {};
const { PRACTICES } = require('../src/js/23-data-meditation.js');
const dir = path.join(__dirname, '../src/js');
const files = fs.readdirSync(dir).filter((f) => /^(24|25|26|27|28|29|2[a-z])-/.test(f)).sort();
const src = files.map((f) => fs.readFileSync(path.join(dir, f), 'utf8').replace(/\nif \(typeof module !== 'undefined' && module\.exports\)[^\n]*/g, '')).join('\n');
const M = new Function(src + '\nreturn { TR, LIB_GROUPS, MUST_GROUPS, LIB_SHELF_ONLY, LIB, LIB_BY_ID, THEMES, BREATH_WORDS, ERAS, CONT, PATH_THESIS, PATH_PRACTICES, pathPracticeById, buildPathCues, BREATH_LIBRARY, PATH_STATIONS, PATH_STATION_BY_ID, YEAR_WHEEL, STATION_TIME, ERA_BOUNDS, axisX, TIME_AXIS_W, contemporaries, ECHO_KINDS, ECHOES, ECHO_LINKS, echoesOf, stationByKey, PATH_LESSONS, lessonKeysUnmatched };')();
const { PATH_LESSONS, lessonKeysUnmatched } = M;
const { STATION_TIME, axisX, TIME_AXIS_W, contemporaries, ECHO_KINDS, ECHOES, ECHO_LINKS, echoesOf, stationByKey } = M;
const { TR, LIB_GROUPS, MUST_GROUPS, LIB_SHELF_ONLY, LIB, LIB_BY_ID, THEMES, ERAS, CONT, PATH_PRACTICES, buildPathCues, BREATH_LIBRARY, PATH_STATIONS, YEAR_WHEEL, BREATH_WORDS } = M;
let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => { if (cond) pass++; else { fail++; console.log('FAIL', name, extra === '' ? '' : JSON.stringify(extra).slice(0, 400)); } };
const words = (s) => s.split(/\s+/).length;

/* ── library ── */
const ids = LIB.map((l) => l.id);
ok('library ids unique', new Set(ids).size === ids.length, ids.filter((x, i) => ids.indexOf(x) !== i));
ok('every library entry has a known group and translation route', LIB.every((l) => LIB_GROUPS.some((g) => g[0] === l.group) && TR[l.tr] && l.title && l.when), LIB.filter((l) => !LIB_GROUPS.some((g) => g[0] === l.group) || !TR[l.tr]).map((l) => l.id));
const count = (g) => LIB.filter((l) => l.group === g).length;
ok('Hebrew Bible has all 39 books', count('hb') === 39, count('hb'));
ok('New Testament has all 27 books', count('nt') === 27, count('nt'));
ok('deuterocanon has 12 entries', count('dc') === 12, count('dc'));
ok('Orthodox/Ethiopian extras present', count('or') === 8, count('or'));
ok('Enoch: all five parts of 1 Enoch, 2 Enoch and 3 Enoch', ['p-1en-w', 'p-1en-a', 'p-1en-d', 'p-1en-e', 'p-1en-s', 'p-2en', 'p-3en'].every((x) => LIB_BY_ID[x]));
ok('Dead Sea Scrolls group has the major scrolls', ['s-1qs', 's-cd', 's-1qm', 's-1qh', 's-11qt', 's-1qap', 's-isa', 's-3q15', 's-4q400', 's-pesh', 's-mmt', 's-all'].every((x) => LIB_BY_ID[x]));
ok('Nag Hammadi and apocryphal gospels present', ['e-nhl', 'e-tho', 'e-mar', 'e-jud', 'e-phi'].every((x) => LIB_BY_ID[x]));

/* ── stations: full coverage of the library, exactly once ── */
const sched = {}; PATH_STATIONS.forEach((s) => s.read.forEach((id) => { (sched[id] = sched[id] || []).push(s.id); }));
const nonSc = LIB.filter((l) => !LIB_SHELF_ONLY.includes(l.group)); /* study aids and the wider shelves (occult, Masonic, shamanic and tribal, folklore and witchcraft) are not Path readings */
ok('every Path-shelf library entry is scheduled', nonSc.every((l) => sched[l.id]), nonSc.filter((l) => !sched[l.id]).map((l) => l.id));
ok('no library entry is scheduled twice', Object.values(sched).every((v) => v.length === 1), Object.entries(sched).filter(([, v]) => v.length > 1));
ok('every scheduled id exists', Object.keys(sched).every((id) => LIB_BY_ID[id]), Object.keys(sched).filter((id) => !LIB_BY_ID[id]));
ok('"nothing left out" groups are completely scheduled', MUST_GROUPS.every((g) => LIB.filter((l) => l.group === g).every((l) => sched[l.id])));
ok('also-see and shelf ids exist', PATH_STATIONS.every((s) => [...s.again, ...s.shelf].every((id) => LIB_BY_ID[id])), PATH_STATIONS.flatMap((s) => [...s.again, ...s.shelf]).filter((id) => !LIB_BY_ID[id]));
ok('every study aid appears on a shelf at least once', LIB.filter((l) => l.group === 'sc').every((l) => PATH_STATIONS.some((s) => s.shelf.includes(l.id))), LIB.filter((l) => l.group === 'sc' && !PATH_STATIONS.some((s) => s.shelf.includes(l.id))).map((l) => l.id));

/* ── the wider shelves: occult, Masonic, shamanic and tribal ── */
const WIDER = ['he', 'oc', 'sp', 'ms', 'si', 'tb', 'fi', 'fu', 'wi', 'ta', 'tf', 'tm', 'tp'];
ok('six wider shelves exist, each named, each with at least four books', WIDER.every((g) => LIB_GROUPS.some((x) => x[0] === g) && LIB.filter((l) => l.group === g).length >= 4), WIDER.map((g) => g + ':' + LIB.filter((l) => l.group === g).length));
ok('the wider shelves are shelf-only: none is scheduled as a Path reading, and all are listed as shelf-only', WIDER.every((g) => LIB_SHELF_ONLY.includes(g)) && WIDER.every((g) => LIB.filter((l) => l.group === g).every((l) => !sched[l.id])));
ok('the wider shelves use their own id prefixes, so no id collides with the Path’s', LIB.filter((l) => WIDER.includes(l.group)).every((l) => /^[hmvkalwt]-[a-z0-9]+$/.test(l.id)) && new Set(LIB.filter((l) => WIDER.includes(l.group)).map((l) => l.id)).size === LIB.filter((l) => WIDER.includes(l.group)).length);
ok('every wider-shelf entry has a real date note, and its translation route says "Public domain"', LIB.filter((l) => WIDER.includes(l.group)).every((l) => l.when.length >= 4 && /\d/.test(l.when) && /Public domain/.test(TR[l.tr].n)), LIB.filter((l) => WIDER.includes(l.group) && !/\d/.test(l.when)).map((l) => l.id));
ok('the occult shelves say plainly that they are sources, not instructions or proof; the Masonic route says the ritual is private and the exposures are labelled; the field-record route says to read beside living voices', /not instructions/.test(TR.occ.n) && /private/.test(TR.mas.n) && /living communities/.test(TR.fld.n));
ok('the wider shelves hold the books people expect (Key of Solomon, Agrippa, Abramelin, Pike, Mackey, Anderson, Bogoras, Spencer and Gillen, Callaway, Bleek)', ['m-keysol', 'h-agri', 'm-abra', 'k-pike', 'k-menc', 'k-ande', 'a-bogo', 'a-spen', 'a-call', 'a-blee'].every((id) => LIB_BY_ID[id]));
ok('no wider-shelf entry shares a title with an older entry', new Set(LIB.map((l) => l.title)).size === LIB.length, LIB.map((l) => l.title).filter((x, i, a) => a.indexOf(x) !== i));

/* ── stations: shape ── */
const eraIdx = Object.fromEntries(ERAS.map((e, i) => [e.id, i]));
ok('at least 130 stations', PATH_STATIONS.length >= 130, PATH_STATIONS.length);
ok('station ids unique and sequential', PATH_STATIONS.every((s, i) => s.id === 's' + String(i + 1).padStart(3, '0')));
ok('every station has a known era', PATH_STATIONS.every((s) => eraIdx[s.era] !== undefined), PATH_STATIONS.filter((s) => eraIdx[s.era] === undefined).map((s) => s.title));
ok('stations are in chronological era order', PATH_STATIONS.every((s, i) => i === 0 || eraIdx[s.era] >= eraIdx[PATH_STATIONS[i - 1].era]));
ok('every era has at least one station', ERAS.every((e) => PATH_STATIONS.some((s) => s.era === e.id)));
ok('titles unique', new Set(PATH_STATIONS.map((s) => s.title)).size === PATH_STATIONS.length);
ok('every station has the full text set', PATH_STATIONS.every((s) => s.title && s.when && s.blurb.length > 120 && s.rhyme.length > 40 && s.q.length === 3 && s.q.every((x) => x.length > 20)), PATH_STATIONS.filter((s) => !(s.blurb.length > 120 && s.rhyme.length > 40 && s.q.length === 3)).map((s) => s.title));
ok('themes exist', PATH_STATIONS.every((s) => s.themes.length >= 1 && s.themes.every((t) => THEMES[t])), PATH_STATIONS.flatMap((s) => s.themes.filter((t) => !THEMES[t]).map((t) => s.title + ':' + t)));
ok('every theme is used by some station', Object.keys(THEMES).every((t) => PATH_STATIONS.some((s) => s.themes.includes(t))), Object.keys(THEMES).filter((t) => !PATH_STATIONS.some((s) => s.themes.includes(t))));
ok('every theme is followed across at least three regions (overlap is visible on the world chart)', Object.keys(THEMES).every((k) => new Set(PATH_STATIONS.filter((s) => s.themes.includes(k)).map((s) => s.region).filter((r) => r !== 'all')).size >= 3), Object.keys(THEMES).filter((k) => new Set(PATH_STATIONS.filter((s) => s.themes.includes(k)).map((s) => s.region).filter((r) => r !== 'all')).size < 3));
ok('words are [term, language, meaning]', PATH_STATIONS.every((s) => s.words.every((w) => w.length === 3 && w.every((x) => typeof x === 'string' && x.length))), PATH_STATIONS.filter((s) => !s.words.every((w) => w.length === 3)).map((s) => s.title));
const allP = new Set([...PRACTICES.map((p) => p.id), ...PATH_PRACTICES.map((p) => p.id)]);
ok('every station practice exists', PATH_STATIONS.every((s) => allP.has(s.practice)), PATH_STATIONS.filter((s) => !allP.has(s.practice)).map((s) => s.title + ':' + s.practice));
ok('practice ids do not collide with meditation practices', PATH_PRACTICES.every((p) => !PRACTICES.some((q) => q.id === p.id)));
ok('no "undefined" / "[object" / double spaces in station text', PATH_STATIONS.every((s) => !/undefined|\[object|  /.test(JSON.stringify(s))), PATH_STATIONS.filter((s) => /undefined|\[object|  /.test(JSON.stringify(s))).map((s) => s.title));
ok('stations each use ≥ 1 and ≤ 6 themes', PATH_STATIONS.every((s) => s.themes.length >= 1 && s.themes.length <= 6));


/* ── dates and places ── */
ok('one time row per station, aligned by title', STATION_TIME.length === PATH_STATIONS.length && PATH_STATIONS.every((s, i) => s.title.startsWith(STATION_TIME[i][0])), PATH_STATIONS.filter((s, i) => !STATION_TIME[i] || !s.title.startsWith(STATION_TIME[i][0])).map((s) => s.title));
ok('every station has numeric dates and a known region', PATH_STATIONS.every((s) => Number.isFinite(s.y0) && Number.isFinite(s.y1) && s.y0 <= s.y1 && ['af', 'eu', 'me', 'sa', 'ea', 'am', 'oc', 'all'].includes(s.region)));
ok('every station overlaps its era', PATH_STATIONS.every((s) => { const e = ERAS.find((x) => x.id === s.era); return s.y0 <= e.y1 && s.y1 >= e.y0; }), PATH_STATIONS.filter((s) => { const e = ERAS.find((x) => x.id === s.era); return !(s.y0 <= e.y1 && s.y1 >= e.y0); }).map((s) => s.title + ' ' + s.y0 + '..' + s.y1 + ' in ' + s.era));
ok('start years never run backwards by more than an era’s width between neighbours', PATH_STATIONS.every((s, i) => i === 0 || s.y0 <= -10000 || s.y0 >= PATH_STATIONS[i - 1].y0 - 3000 || s.era !== PATH_STATIONS[i - 1].era), PATH_STATIONS.filter((s, i) => i && s.y0 > -10000 && s.y0 < PATH_STATIONS[i - 1].y0 - 3000 && s.era === PATH_STATIONS[i - 1].era).map((s) => s.title));
ok('every region has at least 4 stations (the world chart has something in every lane)', ['af', 'eu', 'me', 'sa', 'ea', 'am', 'oc'].every((r) => PATH_STATIONS.filter((s) => s.region === r).length >= 4), ['af', 'eu', 'me', 'sa', 'ea', 'am', 'oc'].map((r) => r + PATH_STATIONS.filter((s) => s.region === r).length));
ok('time axis is monotone and covers the range', axisX(-100000) === 0 && axisX(2030) === TIME_AXIS_W && axisX(-500) < axisX(0) && axisX(0) < axisX(1000) && Number.isFinite(axisX(-300000)), [axisX(-500), axisX(0), axisX(1000)]);
ok('the axis is continuous at every boundary', [-10000, -3500, -2000, -1200, -800, -400, 30, 325, 622, 1000, 1500, 1800].every((y) => Math.abs(axisX(y - 0.001) - axisX(y + 0.001)) < 0.01));
{ const jesus = PATH_STATIONS.find((s) => s.title.startsWith('Jesus and')); const c = contemporaries(jesus); ok('contemporaries of Jesus include other regions, never the same region', c.length >= 3 && c.every((o) => o.region !== 'me'), c.map((o) => o.title)); }
{ const dream = PATH_STATIONS.find((s) => s.title === 'The Dreaming'); ok('long-lived traditions have no contemporaries list', contemporaries(dream).length === 0); }
{ const ez = PATH_STATIONS.find((s) => s.title === 'Gilgamesh: fear of death'); const c = contemporaries(ez); ok('Bronze Age Gilgamesh has contemporaries in Egypt/India/China', c.some((o) => o.region === 'af') && c.some((o) => o.region === 'sa' || o.region === 'ea'), c.map((o) => o.title + ':' + o.region)); }

/* ── echoes ── */
ok('every echo resolves to two different stations', ECHO_LINKS.length === ECHOES.length && ECHO_LINKS.every((e) => e.A !== e.B), ECHOES.filter((e) => !stationByKey(e.a) || !stationByKey(e.b)).map((e) => e.a + ' / ' + e.b));
ok('every echo has a known kind and a real note', ECHOES.every((e) => ECHO_KINDS[e.kind] && e.note.length > 60), ECHOES.filter((e) => !ECHO_KINDS[e.kind] || e.note.length <= 60).map((e) => e.a));
ok('no duplicate station pairs', new Set(ECHO_LINKS.map((e) => [e.A.id, e.B.id].sort().join('-'))).size === ECHO_LINKS.length, ECHO_LINKS.map((e) => [e.A.id, e.B.id].sort().join('-')).filter((k, i, a) => a.indexOf(k) !== i));
ok('at least 90 echoes, and every kind is represented often enough to compare', ECHO_LINKS.length >= 90 && Object.keys(ECHO_KINDS).every((k) => ECHO_LINKS.filter((e) => e.kind === k).length >= 8), Object.keys(ECHO_KINDS).map((k) => k + ECHO_LINKS.filter((e) => e.kind === k).length));
ok('the echoes cover every era that has any other stations', ERAS.slice(0, 13).every((e) => ECHO_LINKS.some((l) => l.A.era === e.id || l.B.era === e.id)), ERAS.slice(0, 13).filter((e) => !ECHO_LINKS.some((l) => l.A.era === e.id || l.B.era === e.id)).map((e) => e.id));
ok('echoes link across at least five of the seven regions', new Set(ECHO_LINKS.flatMap((e) => [e.A.region, e.B.region])).size >= 7);
ok('echoesOf finds both directions', (() => { const e = ECHO_LINKS[0]; return echoesOf(e.A).includes(e) && echoesOf(e.B).includes(e); })());
ok('independent parallels really do link stations in different regions or distant eras', ECHO_LINKS.filter((e) => e.kind === 'parallel').every((e) => e.A.region !== e.B.region || Math.abs(e.A.y0 - e.B.y0) > 400), ECHO_LINKS.filter((e) => e.kind === 'parallel' && e.A.region === e.B.region && Math.abs(e.A.y0 - e.B.y0) <= 400).map((e) => e.A.title + ' / ' + e.B.title));

/* ── lessons ── */
ok('one lesson per station, none orphaned', Object.keys(PATH_LESSONS).length === PATH_STATIONS.length && lessonKeysUnmatched().length === 0 && PATH_STATIONS.every((s) => s.lesson), lessonKeysUnmatched().concat(PATH_STATIONS.filter((s) => !s.lesson).map((s) => s.title)));
ok('every lesson key is a prefix of exactly one station title', Object.keys(PATH_LESSONS).every((k) => PATH_STATIONS.filter((s) => s.title.startsWith(k)).length === 1));
ok('every lesson has four substantial fields', PATH_STATIONS.every((s) => ['setting', 'says', 'debate', 'legacy'].every((f) => typeof s.lesson[f] === 'string' && s.lesson[f].length >= 120 && s.lesson[f].length <= 900)), PATH_STATIONS.flatMap((s) => ['setting', 'says', 'debate', 'legacy'].filter((f) => !(s.lesson[f] && s.lesson[f].length >= 120 && s.lesson[f].length <= 900)).map((f) => s.title + ':' + f + ':' + (s.lesson[f] || '').length)));
ok('lesson text is clean: no double spaces, placeholders or stray markup', PATH_STATIONS.every((s) => !/  |undefined|\[object|NaN|<|>|\{|\}/.test(Object.values(s.lesson).join(' '))), PATH_STATIONS.filter((s) => /  |undefined|\[object|NaN|<|>|\{|\}/.test(Object.values(s.lesson).join(' '))).map((s) => s.title));
ok('lessons end every field with a full stop', PATH_STATIONS.every((s) => Object.values(s.lesson).every((t) => /[.)"”]$/.test(t))), PATH_STATIONS.filter((s) => !Object.values(s.lesson).every((t) => /[.)"”]$/.test(t))).map((s) => s.title));
ok('lessons are not copies of the station blurb', PATH_STATIONS.every((s) => s.lesson.setting !== s.blurb && !s.blurb.includes(s.lesson.setting.slice(0, 60))));
ok('no lesson reuses another lesson’s field text', new Set(PATH_STATIONS.flatMap((s) => Object.values(s.lesson))).size === PATH_STATIONS.length * 4);
ok('lessons average over 1,000 characters (they are real lessons)', PATH_STATIONS.reduce((a, s) => a + Object.values(s.lesson).join('').length, 0) / PATH_STATIONS.length > 1000);

/* ── eras & themes ── */
ok('every era (except the last) has a seven-continent snapshot', ERAS.slice(0, -1).every((e) => e.snap && CONT.every(([k]) => e.snap[k] && e.snap[k].length > 25)), ERAS.filter((e) => e.snap && !CONT.every(([k]) => e.snap[k])).map((e) => e.id));
ok('themes have name, line and an honest "differs"', Object.values(THEMES).every((t) => t.name && t.line.length > 30 && t.differs.length > 20));
ok('breath words table has ≥ 20 languages and no blanks', BREATH_WORDS.length >= 20 && BREATH_WORDS.every((r) => r.length === 4 && r.every(Boolean)));
ok('year wheel dates are valid', YEAR_WHEEL.every(([m, d]) => m >= 1 && m <= 12 && d >= 1 && d <= 31) && YEAR_WHEEL.every((y, i) => i === 0 || y[0] > YEAR_WHEEL[i - 1][0] || (y[0] === YEAR_WHEEL[i - 1][0] && y[1] >= YEAR_WHEEL[i - 1][1])));

/* ── practices & scripts ── */
for (const p of PATH_PRACTICES) {
  ok(p.id + ' has fields', p.name && p.from && p.blurb && p.mins.length && p.mins.includes(p.def) && p.steps.length >= 4 && ['sit', 'walk', 'stand', 'rite'].includes(p.kind));
  ok(p.id + ' pacer is known', !p.pacer || ['slow', 'calm', 'sigh'].includes(p.pacer));
  for (const m of p.mins) {
    const T = Math.round(m * 60); const cues = buildPathCues(p.id, m, 'Peace'); const tag = `${p.id}/${m}min`;
    ok(tag + ' keeps every step plus a close and a return cue', cues.length === p.steps.length + 2, cues.length + ' of ' + (p.steps.length + 2));
    ok(tag + ' sorted & inside session', cues.every((c, i) => c.t >= 0 && c.t < T - 1 && (i === 0 || c.t > cues[i - 1].t)));
    ok(tag + ' room to speak each cue', cues.every((c, i) => i === cues.length - 1 || cues[i + 1].t - c.t >= Math.ceil(words(c.text) / 2.0) + 2), cues.filter((c, i) => i < cues.length - 1 && cues[i + 1].t - c.t < Math.ceil(words(c.text) / 2.0) + 2).map((c) => c.t));
    ok(tag + ' starts early and ends near the end', cues[0].t <= 10 && cues[cues.length - 1].t >= T - 12, cues[0].t + '…' + cues[cues.length - 1].t + ' of ' + T);
    ok(tag + ' no unresolved placeholders', cues.every((c) => !/\{word\}/.test(c.text)));
  }
}
ok('"names" substitutes the chosen word', buildPathCues('names', 10, 'Shalom').some((c) => /Shalom/.test(c.text)));
ok('breath library flags the forceful techniques as not used', ['kumbhaka', 'forceful', 'Tummo', 'Wim Hof'].every((k) => BREATH_LIBRARY.some((b) => b.status === 'not used' && (b.name + b.note).includes(k))));
ok('no practice teaches breath-holds, hyperventilation or fasting', PATH_PRACTICES.every((p) => !/hold your breath|hyperventilat|breath retention|fast for|stay awake|all night/i.test(JSON.stringify(p.steps) + p.close)), PATH_PRACTICES.filter((p) => /hold your breath|hyperventilat|breath retention|fast for|stay awake|all night/i.test(JSON.stringify(p.steps))).map((p) => p.id));

console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
