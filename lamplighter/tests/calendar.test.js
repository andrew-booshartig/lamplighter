// Run: node tests/calendar.test.js — the observance calendar against dates published elsewhere
const C = require('../src/js/2n-calendar.js');
let pass = 0, fail = 0; const ok = (n, c, x = '') => { if (c) pass++; else { fail++; console.log('FAIL', n, typeof x === 'string' ? x : JSON.stringify(x).slice(0, 300)); } };
const eq = (n, got, want) => ok(`${n} = ${want}`, got === want, got);
// Western Easter
[[2024, '2024-03-31'], [2025, '2025-04-20'], [2026, '2026-04-05'], [2027, '2027-03-28'], [2028, '2028-04-16'], [2029, '2029-04-01'], [2030, '2030-04-21'], [1999, '1999-04-04'], [2038, '2038-04-25']].forEach(([y, d]) => eq('Easter ' + y, C.westernEaster(y), d));
// Orthodox Easter
[[2024, '2024-05-05'], [2025, '2025-04-20'], [2026, '2026-04-12'], [2027, '2027-05-02'], [2028, '2028-04-16'], [2029, '2029-04-08'], [2030, '2030-04-28']].forEach(([y, d]) => eq('Orthodox Easter ' + y, C.orthodoxEaster(y), d));
// Rosh Hashanah (1 Tishri), from the Hebrew-year arithmetic
[[5785, '2024-10-03'], [5786, '2025-09-23'], [5787, '2026-09-12'], [5788, '2027-10-02'], [5789, '2028-09-21'], [5790, '2029-09-10'], [5791, '2030-09-28']].forEach(([h, d]) => eq('Rosh Hashanah ' + h, C.calFromRD(C.hebNewYearRD(h)), d));
const heb = (y, name) => (C.hebrewHolidaysOfGregorian(y).find((h) => h.name.startsWith(name)) || {}).date;
eq('Passover 2024', heb(2024, 'Passover'), '2024-04-23'); eq('Passover 2025', heb(2025, 'Passover'), '2025-04-13'); eq('Passover 2026', heb(2026, 'Passover'), '2026-04-02'); eq('Passover 2027', heb(2027, 'Passover'), '2027-04-22');
eq('Yom Kippur 2026', heb(2026, 'Yom Kippur'), '2026-09-21'); eq('Sukkot 2026', heb(2026, 'Sukkot'), '2026-09-26'); eq('Purim 2026', heb(2026, 'Purim'), '2026-03-03'); eq('Shavuot 2026', heb(2026, 'Shavuot'), '2026-05-22');
eq('Hanukkah 2024', heb(2024, 'Hanukkah'), '2024-12-26'); eq('Hanukkah 2025', heb(2025, 'Hanukkah'), '2025-12-15'); eq('Hanukkah 2026', heb(2026, 'Hanukkah'), '2026-12-05');
ok('Hanukkah falls between 28 November and 27 December in every year', Array.from({ length: 60 }, (_, i) => 2000 + i).every((y) => { const d = heb(y, 'Hanukkah'); return d >= `${y}-11-28` && d <= `${y}-12-27`; }));
ok('Passover falls between 26 March and 25 April in every year', Array.from({ length: 80 }, (_, i) => 2000 + i).every((y) => { const d = heb(y, 'Passover'); return d >= `${y}-03-26` && d <= `${y}-04-25`; }));
ok('every Gregorian year has eight Jewish days', Array.from({ length: 40 }, (_, i) => 2000 + i).every((y) => C.hebrewHolidaysOfGregorian(y).length === 8), 'count');
// Islamic tabular (within a day of the moon-sighted dates)
const near = (n, got, want) => ok(n, Math.abs(Date.parse(got) - Date.parse(want)) <= 864e5, [got, want]);
near('1 Ramadan 1446 ≈ 1 March 2025', C.islamicISO(1446, 9, 1), '2025-03-01'); near('Eid al-Fitr 1446 ≈ 30 March 2025', C.islamicISO(1446, 10, 1), '2025-03-30');
near('1 Ramadan 1447 ≈ 18 February 2026', C.islamicISO(1447, 9, 1), '2026-02-18'); near('Eid al-Fitr 1447 ≈ 20 March 2026', C.islamicISO(1447, 10, 1), '2026-03-20'); near('Eid al-Adha 1447 ≈ 27 May 2026', C.islamicISO(1447, 12, 10), '2026-05-27'); near('1 Muharram 1448 ≈ 16 June 2026', C.islamicISO(1448, 1, 1), '2026-06-16');
ok('Islamic observances are marked approximate and begin at sunset', C.islamicObservances(1447).every((o) => o.approx && o.eve));
// the window function
const wheel = [[12, 25, 'Christmas', 'Christian', 'x'], [3, 20, 'Spring equinox · Nowruz', 'Many', 'x']];
const y26 = C.observances('2026-01-01', '2026-12-31', wheel); const names = (a) => a.map((o) => o.name);
ok('2026 includes Easter, Pentecost, Ramadan, Passover, Rosh Hashanah, Lunar New Year and Christmas', ['Easter', 'Pentecost', 'Ramadan begins', 'Passover begins', 'Rosh Hashanah', 'Lunar New Year', 'Christmas', 'Advent begins', 'Orthodox Easter (Pascha)'].every((n) => names(y26).includes(n)), names(y26).length);
ok('observances are sorted by date', y26.every((o, i) => i === 0 || y26[i - 1].date <= o.date));
ok('Advent begins on a Sunday between 27 November and 3 December', Array.from({ length: 30 }, (_, i) => 2020 + i).every((y) => { const a = C.observances(`${y}-11-20`, `${y}-12-05`, []).find((o) => o.name === 'Advent begins'); return a && C.calWeekday(a.date) === 0 && a.date >= `${y}-11-27` && a.date <= `${y}-12-03`; }));
ok('Easter is always a Sunday, and Ash Wednesday a Wednesday', Array.from({ length: 60 }, (_, i) => 2000 + i).every((y) => C.calWeekday(C.westernEaster(y)) === 0 && C.calWeekday(C.calAdd(C.westernEaster(y), -46)) === 3));
ok('a window across New Year picks up both years', C.observances('2026-12-20', '2027-01-10', wheel).some((o) => o.date.startsWith('2026')) && C.observances('2026-12-20', '2027-01-10', wheel).some((o) => o.date === '2027-01-07'));
ok('Chinese New Year table covers 2024 to 2040 with valid dates', Object.keys(C.CHINESE_NEW_YEAR).length === 17 && Object.entries(C.CHINESE_NEW_YEAR).every(([y, d]) => d >= '01-21' && d <= '02-20' && !isNaN(Date.parse(`${y}-${d}`))));
const ics = C.icsEvent({ title: 'Evening sit, with a comma', date: '2026-04-05', note: 'Line one\nLine two' }); ok('ics: a valid all-day event with escaped text', /BEGIN:VCALENDAR/.test(ics) && /DTSTART;VALUE=DATE:20260405/.test(ics) && /DTEND;VALUE=DATE:20260406/.test(ics) && /SUMMARY:Evening sit\\, with a comma/.test(ics) && /DESCRIPTION:Line one\\nLine two/.test(ics) && /\r\n$/.test(ics));
const ics2 = C.icsEvent({ title: 'Sit', start: Date.UTC(2026, 3, 5, 9, 0), minutes: 45 }); ok('ics: a timed event in UTC', /DTSTART:20260405T090000Z/.test(ics2) && /DTEND:20260405T094500Z/.test(ics2));
console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
