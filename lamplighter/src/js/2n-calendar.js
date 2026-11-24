/* ═══════════════════════════ 2n · The observance calendar ═══════════════════════════
   Moveable and fixed days from many traditions, computed in the browser: no network, no tables to go stale.
   Western and Orthodox Easter (Meeus), the Hebrew calendar (Dershowitz–Reingold arithmetic), the Islamic calendar (the tabular
   arithmetic calendar, which can differ from the moon-sighted date by a day or two), plus fixed dates and a table of Chinese New Year.
   Every date is a plain ISO day (YYYY-MM-DD) so time zones never shift it. Jewish and Islamic days begin at sunset: `eve` marks that. */
const CAL_MS = 864e5;
const calISO = (d) => d.toISOString().slice(0, 10);
const calUTC = (y, m, d) => new Date(Date.UTC(y, m - 1, d));
const calAdd = (iso, n) => calISO(new Date(Date.parse(iso + 'T00:00:00Z') + n * CAL_MS));
const calRD = (iso) => Math.floor(Date.parse(iso + 'T00:00:00Z') / CAL_MS) + 719163;
const calFromRD = (rd) => calISO(new Date((rd - 719163) * CAL_MS));
const calWeekday = (iso) => new Date(Date.parse(iso + 'T00:00:00Z')).getUTCDay(); // 0 = Sunday

function westernEaster(y) {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
  return calISO(calUTC(y, month, day));
}
function orthodoxEaster(y) { // Julian-calendar Easter, shown on the Gregorian calendar (13 days later in 1900–2099)
  const a = y % 4, b = y % 7, c = y % 19, d = (19 * c + 15) % 30, e = (2 * a + 4 * b - d + 34) % 7;
  const month = Math.floor((d + e + 114) / 31), day = ((d + e + 114) % 31) + 1;
  return calAdd(calISO(calUTC(y, month, day)), 13);
}

/* Hebrew calendar: day numbers are R.D. (1 = 1 January, 1 CE) */
const HEB_EPOCH = -1373427;
function hebElapsed(year) { const me = Math.floor((235 * year - 234) / 19); const pe = 12084 + 13753 * me; let day = 29 * me + Math.floor(pe / 25920); if ((3 * (day + 1)) % 7 < 3) day += 1; return day; }
function hebCorrection(year) { const a = hebElapsed(year - 1), b = hebElapsed(year), c = hebElapsed(year + 1); return c - b === 356 ? 2 : (b - a === 382 ? 1 : 0); }
const hebNewYearRD = (year) => HEB_EPOCH + hebElapsed(year) + hebCorrection(year);
function hebrewHolidays(hYear) {
  const rh = hebNewYearRD(hYear); const len = hebNewYearRD(hYear + 1) - rh; const leap = len >= 383; const hk = len % 10 === 5 ? 60 : len % 10 === 3 ? 58 : 59; const heshvan = hk === 60 ? 30 : 29;
  const pesach = rh + 30 + hk + 29 + 30 + (leap ? 59 : 29) + 14; // 15 Nisan
  return [
    { rd: rh, name: 'Rosh Hashanah', note: 'The Jewish New Year (1 Tishri): the shofar, apples and honey, a ten-day season of turning back that ends at Yom Kippur.' },
    { rd: rh + 9, name: 'Yom Kippur', note: 'The Day of Atonement (10 Tishri): fasting, prayer and asking forgiveness.' },
    { rd: rh + 14, name: 'Sukkot begins', note: 'The Feast of Booths (15 Tishri): a week of eating and sitting in a temporary hut, remembering the wilderness and the harvest.' },
    { rd: rh + 22, name: 'Shemini Atzeret · Simchat Torah', note: '22–23 Tishri: the yearly Torah reading ends and starts again, with dancing.' },
    { rd: rh + 30 + heshvan + 24, name: 'Hanukkah begins', note: 'The Festival of Lights (25 Kislev): eight nights of candles, remembering the rededication of the Temple after the Maccabean revolt.' },
    { rd: pesach - 30, name: 'Purim', note: '14 Adar: the story of Esther is read aloud, with gifts of food and to the poor.' },
    { rd: pesach, name: 'Passover begins', note: '15 Nisan: the Exodus remembered at the seder, a week without leavened bread.' },
    { rd: pesach + 50, name: 'Shavuot', note: '6 Sivan: the giving of the Torah, traditionally with all-night study.' },
  ].map((x) => ({ date: calFromRD(x.rd), name: x.name, trad: 'Jewish', note: x.note, eve: true }));
}
/* the Hebrew year that begins in autumn of Gregorian year y is y + 3761 */
const hebrewHolidaysOfGregorian = (y) => hebrewHolidays(y + 3760).concat(hebrewHolidays(y + 3761)).filter((h) => h.date.startsWith(String(y)));

/* Islamic tabular calendar (civil epoch 16 July 622 CE) */
const islamicJD = (y, m, d) => d + Math.ceil(29.5 * (m - 1)) + (y - 1) * 354 + Math.floor((3 + 11 * y) / 30) + 1948439.5 - 1;
const islamicISO = (y, m, d) => calISO(new Date((islamicJD(y, m, d) - 2440587.5) * CAL_MS));
function islamicObservances(hYear) {
  const row = (m, d, name, note) => ({ date: islamicISO(hYear, m, d), name, trad: 'Muslim', note, eve: true, approx: true });
  return [
    row(1, 1, 'Islamic New Year', '1 Muharram: the first day of the Hijri year, which counts from the Hijra to Medina in 622 CE.'),
    row(1, 10, 'Ashura', '10 Muharram: a day of fasting for many Muslims; for Shia a day of mourning for Husayn at Karbala.'),
    row(3, 12, 'Mawlid', '12 Rabiʿ al-awwal: Muhammad’s birthday, marked by many Sunni and Shia communities with recitation and gatherings; some Muslims do not observe it.'),
    row(9, 1, 'Ramadan begins', 'The month of fasting from dawn to sunset, prayer and recitation of the Qur’an.'),
    row(9, 27, 'Laylat al-Qadr (traditional night)', 'The Night of Power, when Muslims remember the first revelation of the Qur’an; sought in the last ten nights, often counted as the 27th.'),
    row(10, 1, 'Eid al-Fitr', 'The feast ending Ramadan: prayer, charity and meals together.'),
    row(12, 9, 'Day of ʿArafah', 'Pilgrims stand at Mount ʿArafah; many other Muslims fast.'),
    row(12, 10, 'Eid al-Adha', 'The feast of sacrifice at the end of the Hajj, remembering Abraham’s obedience; meat is shared with the poor.'),
  ];
}
const islamicObservancesOfGregorian = (y) => Array.from({ length: 9 }, (_, i) => y - 583 + i).flatMap(islamicObservances).filter((o) => o.date.startsWith(String(y)));

/* Chinese New Year (first day of the lunar year), checked against published calendars */
const CHINESE_NEW_YEAR = { 2024: '02-10', 2025: '01-29', 2026: '02-17', 2027: '02-06', 2028: '01-26', 2029: '02-13', 2030: '02-03', 2031: '01-23', 2032: '02-11', 2033: '01-31', 2034: '02-19', 2035: '02-08', 2036: '01-28', 2037: '02-15', 2038: '02-04', 2039: '01-24', 2040: '02-12' };

/* extra fixed-date days, beyond the Year wheel */
const CAL_FIXED = [
  [1, 7, 'Orthodox Christmas', 'Orthodox (Julian calendar)', 'Christmas as kept by churches that follow the Julian calendar: the Divine Liturgy at midnight, a meatless supper the evening before.'],
  [1, 14, 'Makar Sankranti', 'Hindu', 'The sun’s turn northward (14 or 15 January): kite flying, sesame sweets and bathing in rivers; Pongal in Tamil Nadu.'],
  [2, 2, 'Candlemas', 'Christian', 'The presentation of Jesus in the Temple, forty days after Christmas: candles are blessed.'],
  [2, 15, 'Nirvana Day', 'Mahayana Buddhist (Japan)', 'The Buddha’s passing, remembered in many Japanese and Chinese temples.'],
  [4, 14, 'Vaisakhi', 'Sikh and Hindu', 'The spring harvest and, for Sikhs, the founding of the Khalsa in 1699 (13 or 14 April): processions and langar.'],
  [8, 13, 'Obon begins', 'Japanese Buddhist', 'Three days (13–16 August in most of Japan) when the ancestors are welcomed home: lanterns and dancing.'],
  [8, 15, 'Assumption of Mary', 'Catholic', 'Mary’s being taken up into heaven; the Dormition on the same day for many Orthodox churches that keep the Julian calendar (28 August).'],
  [12, 8, 'Bodhi Day', 'Mahayana Buddhist (Japan)', 'The Buddha’s awakening, remembered with a day of sitting in many Zen temples.'],
];

/* all observances between two ISO days, inclusive */
function observances(fromISO, toISO, wheel = []) {
  const y0 = +fromISO.slice(0, 4), y1 = +toISO.slice(0, 4); const out = [];
  for (let y = y0 - 0; y <= y1; y++) {
    wheel.forEach(([m, d, name, trad, note]) => out.push({ date: calISO(calUTC(y, m, d)), name, trad, note }));
    CAL_FIXED.forEach(([m, d, name, trad, note]) => out.push({ date: calISO(calUTC(y, m, d)), name, trad, note }));
    const E = westernEaster(y);
    [[-46, 'Ash Wednesday', 'Lent begins: ashes, fasting and a forty-day turn toward Easter.'], [-7, 'Palm Sunday', 'Holy Week begins, remembering Jesus’s entry into Jerusalem.'], [-3, 'Maundy Thursday', 'The Last Supper and the washing of feet.'], [-2, 'Good Friday', 'The crucifixion remembered: fasting, stripping of the altar, silence.'], [0, 'Easter', 'The resurrection of Jesus: the central feast of the Christian year, kept in the Western church on this date.'], [39, 'Ascension', 'Forty days after Easter: Jesus’s ascension.'], [49, 'Pentecost', 'The coming of the Holy Spirit, fifty days after Easter.']].forEach(([n, name, note]) => out.push({ date: calAdd(E, n), name, trad: 'Christian', note }));
    // First Sunday of Advent: the Sunday on or after 27 November
    const nov27 = calISO(calUTC(y, 11, 27)); out.push({ date: calAdd(nov27, (7 - calWeekday(nov27)) % 7), name: 'Advent begins', trad: 'Christian', note: 'Four Sundays of waiting before Christmas: candles, a wreath, a quieter season.' });
    const O = orthodoxEaster(y); out.push({ date: O, name: 'Orthodox Easter (Pascha)', trad: 'Orthodox Christian', note: 'The Orthodox feast of feasts, kept by the Julian calculation: midnight service, “Christ is risen!”' }); out.push({ date: calAdd(O, -48), name: 'Great Lent begins (Clean Monday)', trad: 'Orthodox Christian', note: 'Seven weeks of fasting before Pascha.' });
    hebrewHolidaysOfGregorian(y).forEach((h) => out.push(h));
    islamicObservancesOfGregorian(y).forEach((o) => out.push(o));
    if (CHINESE_NEW_YEAR[y]) out.push({ date: `${y}-${CHINESE_NEW_YEAR[y]}`, name: 'Lunar New Year', trad: 'Chinese and East Asian', note: 'The first day of the lunar year: family reunions, honoring ancestors, lanterns on the fifteenth day.' });
  }
  return out.filter((o) => o.date >= fromISO && o.date <= toISO).sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.name < b.name ? -1 : 1));
}

/* a minimal calendar file (.ics) for one observance or one gathering */
function icsEvent({ title, date, start, minutes, note, uid }) {
  const esc = (s) => String(s || '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/[,;]/g, (c) => '\\' + c);
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Lamplighter//Gather//EN', 'BEGIN:VEVENT', `UID:${uid || (date || start) + '-' + esc(title).slice(0, 20)}@beatlab`, `DTSTAMP:${stamp}`];
  if (start) { const s = new Date(start); const e = new Date(start + (minutes || 60) * 60000); const f = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d+/, ''); lines.push(`DTSTART:${f(s)}`, `DTEND:${f(e)}`); } else lines.push(`DTSTART;VALUE=DATE:${date.replace(/-/g, '')}`, `DTEND;VALUE=DATE:${calAdd(date, 1).replace(/-/g, '')}`);
  lines.push(`SUMMARY:${esc(title)}`); if (note) lines.push(`DESCRIPTION:${esc(note)}`); lines.push('END:VEVENT', 'END:VCALENDAR');
  return lines.join('\r\n') + '\r\n';
}
if (typeof module !== 'undefined' && module.exports) module.exports = { westernEaster, orthodoxEaster, hebrewHolidays, hebrewHolidaysOfGregorian, hebNewYearRD, islamicISO, islamicObservances, CHINESE_NEW_YEAR, CAL_FIXED, observances, icsEvent, calAdd, calISO, calRD, calFromRD, calWeekday };
