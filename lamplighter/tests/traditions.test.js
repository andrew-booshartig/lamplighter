// Run: node tests/traditions.test.js — integrity of the traditions data (stations, dated milestones, reading links)
const fs = require('fs'); const path = require('path');
global.REFS = {};
const { PRACTICES } = require('../src/js/23-data-meditation.js'); global.PRACTICES = PRACTICES;
const dir = path.join(__dirname, '../src/js');
const files = fs.readdirSync(dir).filter((f) => /^(24|25|26|27|28|29|2[a-z])-/.test(f)).sort();
const src = files.map((f) => fs.readFileSync(path.join(dir, f), 'utf8').replace(/\nif \(typeof module !== 'undefined' && module\.exports\)[^\n]*/g, '')).join('\n');
const M = new Function(src + '\nreturn { TRADITIONS, TRAD_BY_ID, TRAD_OF_STATION, LINKS_GENERAL, searchLinks, stationIdOf, PATH_STATIONS, LIB_GROUPS, fmtYear, GLOSSARY, GLOSS_TRADS };')();
const { TRADITIONS, TRAD_BY_ID, TRAD_OF_STATION, LINKS_GENERAL, searchLinks, PATH_STATIONS, LIB_GROUPS } = M;
let pass = 0, fail = 0; const ok = (n, c, x = '') => { if (c) pass++; else { fail++; console.log('FAIL', n, typeof x === 'string' ? x : JSON.stringify(x).slice(0, 300)); } };

ok('19 traditions with unique ids and names', TRADITIONS.length === 19 && new Set(TRADITIONS.map((t) => t.id)).size === 19 && new Set(TRADITIONS.map((t) => t.name)).size === 19);
ok('every tradition has a blurb of a sensible length and a short name', TRADITIONS.every((t) => t.blurb.length > 120 && t.blurb.length < 520 && t.short && t.short.length < 28), TRADITIONS.filter((t) => !(t.blurb.length > 120 && t.blurb.length < 520)).map((t) => t.id));
ok('station numbers are real and listed once per tradition', TRADITIONS.every((t) => t.stations.length && t.stations.every((n) => Number.isInteger(n) && n >= 1 && n <= PATH_STATIONS.length) && new Set(t.stations).size === t.stations.length));
const uncovered = PATH_STATIONS.filter((s) => s.region !== 'all' && !TRAD_OF_STATION[s.id]).map((s) => s.id + ' ' + s.title);
ok('every dated station belongs to at least one tradition', uncovered.length === 0, uncovered);
ok('stations are listed in order inside each tradition', TRADITIONS.every((t) => t.stations.every((n, i) => i === 0 || t.stations[i - 1] < n)), TRADITIONS.filter((t) => !t.stations.every((n, i) => i === 0 || t.stations[i - 1] < n)).map((t) => t.id));
ok('library groups named by a tradition exist', TRADITIONS.every((t) => t.groups.every((g) => LIB_GROUPS.some((x) => x[0] === g))));

const events = TRADITIONS.flatMap((t) => t.events.map((e) => [t.id, e]));
ok('every tradition has at least four dated milestones', TRADITIONS.every((t) => t.events.length >= 4), TRADITIONS.filter((t) => t.events.length < 4).map((t) => t.id));
ok('milestones are [integer year, text, 0|1] and the years are plausible', events.every(([, e]) => Number.isInteger(e[0]) && e[0] >= -110000 && e[0] <= 2026 && typeof e[1] === 'string' && e[1].length > 10 && e[1].length < 170 && (e[2] === 0 || e[2] === 1)), events.filter(([, e]) => !(Number.isInteger(e[0]) && typeof e[1] === 'string' && e[1].length > 10)).slice(0, 3));
ok('milestones inside a tradition are in date order', TRADITIONS.every((t) => t.events.every((e, i) => i === 0 || t.events[i - 1][0] <= e[0])), TRADITIONS.filter((t) => !t.events.every((e, i) => i === 0 || t.events[i - 1][0] <= e[0])).map((t) => t.id));
ok('no milestone text has stray markup or placeholder words', events.every(([, e]) => !/[<>{}]|undefined|TODO|XXX/.test(e[1])));
ok('milestone years format cleanly', events.every(([, e]) => /^(c\. )?[\d,]+ (BCE|CE)$/.test((e[2] ? 'c. ' : '') + M.fmtYear(e[0]))));

const links = TRADITIONS.flatMap((t) => t.links.map((l) => [t.id, l])).concat(LINKS_GENERAL.flatMap((g) => g.links.map((l) => ['general', l])));
ok('every link is [label, https url, note]', links.every(([, l]) => l.length === 3 && l[0].length > 3 && /^https?:\/\/[^\s'"<>]+$/.test(l[1]) && l[2].length >= 8), links.filter(([, l]) => !(l.length === 3 && /^https?:\/\//.test(l[1]))).slice(0, 3));
ok('most links use https', links.filter(([, l]) => l[1].startsWith('https://')).length >= links.length - 3, links.filter(([, l]) => !l[1].startsWith('https://')).map(([, l]) => l[1]));
ok('every tradition has at least three links, none repeated within it', TRADITIONS.every((t) => t.links.length >= 3 && new Set(t.links.map((l) => l[1])).size === t.links.length), TRADITIONS.filter((t) => t.links.length < 3).map((t) => t.id));
ok('no link is sold or tracked (no affiliate, utm or cart parameters)', links.every(([, l]) => !/[?&](utm_|aff|ref=|tag=|cart)/i.test(l[1])));
const sl = searchLinks('Gilgamesh & the flood'); ok('topic search links are encoded and point at Wikipedia and Britannica', sl.length === 2 && sl[0][1].startsWith('https://en.wikipedia.org/w/index.php?search=Gilgamesh%20%26%20the%20flood') && sl[1][1].startsWith('https://www.britannica.com/search?query='), sl);
ok('station-to-tradition lookup is consistent with the tradition lists', Object.entries(TRAD_OF_STATION).every(([sid, ts]) => ts.every((id) => TRAD_BY_ID[id] && TRAD_BY_ID[id].stations.map(M.stationIdOf).includes(sid))));
const { GLOSSARY, GLOSS_TRADS } = M;
ok('the glossary has at least 100 words, each [term, tradition, language, meaning, ids]', GLOSSARY.length >= 100 && GLOSSARY.every((g) => (g.length === 5 || (g.length === 6 && g[5] && typeof g[5] === 'object')) && g[0] && g[1] && g[2] && g[3].length > 20 && g[3].length < (g.length === 6 ? 700 : 330) && Array.isArray(g[4]) && g[4].length >= 1), GLOSSARY.filter((g) => !((g.length === 5 || g.length === 6) && g[3].length > 20 && g[3].length < (g.length === 6 ? 700 : 330))).map((g) => g[0]));     // the word-help entries may carry a sixth element and say a little more
ok('glossary terms are unique', new Set(GLOSSARY.map((g) => g[0].toLowerCase())).size === GLOSSARY.length, GLOSSARY.map((g) => g[0]).filter((t, i, a) => a.indexOf(t) !== i));
ok('every glossary tradition id is a real tradition', GLOSSARY.every((g) => g[4].every((id) => TRAD_BY_ID[id])) && GLOSS_TRADS.every((id) => TRAD_BY_ID[id]));
ok('every filter chip in the glossary has at least two words behind it', GLOSS_TRADS.every((id) => GLOSSARY.filter((g) => g[4].includes(id)).length >= 2), GLOSS_TRADS.filter((id) => GLOSSARY.filter((g) => g[4].includes(id)).length < 2));
ok('glossary meanings are plain text with no markup and end with a full stop', GLOSSARY.every((g) => !/[<>{}]/.test(g[3]) && /[.)”]$/.test(g[3])), GLOSSARY.filter((g) => !/[.)”]$/.test(g[3])).map((g) => g[0]));
console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
