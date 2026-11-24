/* ═══════════════════════════ 2z · Calendars and the sky: the pure parts ═══════════════════════════
   The maker (18 November 2026): "the calendar idea, the one that I originally had was like how the Chinese calendar is different from the American one ... all these are kind of tied to religion because it's
   religion and the stars are also kind of connected together ... and whether we're using the right method of astrology, you know, since the stars move". This file knows how to turn one day into its name in
   every calendar the app handles, and how to say where the sun stood against the three zodiacs (the tropical signs, the sidereal signs, the IAU constellations). No page, no network, nothing stored.

   WHERE EACH RULE COMES FROM (all written here in the project's own words; each is checked in tests/sky.test.js against anchors taken from a source):
   · Day numbers, the Gregorian, Julian, Hebrew, Islamic (tabular), Coptic and Ethiopian counts: Reingold and Dershowitz, Calendrical Calculations (Cambridge University Press, 3rd and 4th editions), the
     fixed-day ("R.D.") method, in which 1 January 1 CE of the Gregorian calendar is day 1. Years are astronomical in the code (1 BCE is year 0) and signed with no year 0 on the page.
   · The Sun, the equinoxes and the new Moon: Jean Meeus, Astronomical Algorithms (2nd edition, 1998), chapters 25 (the Sun's position, low accuracy, about 0.01 degree), 27 (equinoxes and solstices) and
     49 (the phases of the Moon). The difference between the dynamical time those formulas give and Universal Time (delta-T) is the polynomial set of Espenak and Meeus (NASA Five Millennium Canon, 2006).
   · The Chinese rules (a new year on the second new Moon after the winter solstice month, month 11 holding the winter solstice, a leap month where a month holds no major solar term), the Persian rule (the
     year begins on the day the March equinox falls before noon at Tehran) and the Hindu lunar months are those described in Calendrical Calculations, chapters 19, 14 and 20.
   · Precession: the IAU 2006 general precession in longitude (Capitaine, Wallace and Chapront 2003, Astronomy & Astrophysics 412, 567). Ayanamsa: the value for the year 2000 and a rate, as the Swiss
     Ephemeris documents the Lahiri and Fagan-Bradley definitions. Constellation boundaries along the ecliptic: Delporte 1930 as tabulated by Roman 1987 (see SKY_IAU below).
   Accuracy is stated with each result (SKY_METHODS): exact arithmetic, an astronomical computation that is good to the day for about 1900 to 2100, a published table, or a method that varies by place and
   school (then the result is a range, never one confident date). */
const SKY_RAD = Math.PI / 180;
const skyMod = (a, b) => ((a % b) + b) % b;
const skyFl = Math.floor;
const skySin = (d) => Math.sin(d * SKY_RAD);
const skyCos = (d) => Math.cos(d * SKY_RAD);
const skyNorm = (d) => skyMod(d, 360);
const skySigned = (d) => { const x = skyMod(d, 360); return x > 180 ? x - 360 : x; };      /* an angle in (-180, 180] */

/* ── day numbers ── */
const skyGregLeap = (y) => skyMod(y, 4) === 0 && (skyMod(y, 100) !== 0 || skyMod(y, 400) === 0);
const skyJulLeap = (y) => skyMod(y, 4) === 0;
function skyGregFixed(y, m, d) { const p = y - 1; return 365 * p + skyFl(p / 4) - skyFl(p / 100) + skyFl(p / 400) + skyFl((367 * m - 362) / 12) + (m <= 2 ? 0 : skyGregLeap(y) ? -1 : -2) + d; }
function skyGregFromFixed(rd) {
  const d0 = rd - 1; const n400 = skyFl(d0 / 146097); const d1 = skyMod(d0, 146097); const n100 = skyFl(d1 / 36524); const d2 = skyMod(d1, 36524); const n4 = skyFl(d2 / 1461); const d3 = skyMod(d2, 1461); const n1 = skyFl(d3 / 365);
  const y = 400 * n400 + 100 * n100 + 4 * n4 + n1 + (n100 === 4 || n1 === 4 ? 0 : 1); const prior = rd - skyGregFixed(y, 1, 1); const corr = rd < skyGregFixed(y, 3, 1) ? 0 : skyGregLeap(y) ? 1 : 2;
  const m = skyFl((12 * (prior + corr) + 373) / 367); return { y, m, d: rd - skyGregFixed(y, m, 1) + 1 };
}
function skyJulFixed(y, m, d) { return -2 + 365 * (y - 1) + skyFl((y - 1) / 4) + skyFl((367 * m - 362) / 12) + (m <= 2 ? 0 : skyJulLeap(y) ? -1 : -2) + d; }
function skyJulFromFixed(rd) {
  const y = skyFl((4 * (rd + 1) + 1464) / 1461); const prior = rd - skyJulFixed(y, 1, 1); const corr = rd < skyJulFixed(y, 3, 1) ? 0 : skyJulLeap(y) ? 1 : 2;
  const m = skyFl((12 * (prior + corr) + 373) / 367); return { y, m, d: rd - skyJulFixed(y, m, 1) + 1 };
}
const skyDim = (leap, m) => (m === 2 ? (leap ? 29 : 28) : [4, 6, 9, 11].includes(m) ? 30 : 31);
const skyJD = (rd) => rd + 1721424.5;                      /* the Julian Day at 0 h UT of the civil day rd */
const skyRDofJD = (jd) => jd - 1721424.5;
const skyWeekday = (rd) => skyMod(rd, 7);                  /* 0 = Sunday */
const SKY_WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SKY_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const skyYearLabel = (y) => (y <= 0 ? (1 - y) + ' BCE' : y < 1000 ? y + ' CE' : String(y));      /* an astronomical year as the page writes it */
const SKY_GREG_START = skyGregFixed(1582, 10, 15);          /* the first day of the Gregorian calendar, 15 October 1582 (the day after Julian 4 October) */
const SKY_JULIAN_START = skyJulFixed(-44, 1, 1);            /* 1 January 45 BCE, the first day of the Julian calendar (astronomical year -44) */

/* ── the Hebrew calendar: fixed rules since the fourth century; month 1 is Nisan, the year begins in Tishri (month 7) ── */
const SKY_HEB_EPOCH = skyJulFixed(-3760, 10, 7);            /* 1 Tishri of year 1: 7 October 3761 BCE (Julian) */
const skyHebLeap = (y) => skyMod(7 * y + 1, 19) < 7;
function skyHebElapsed(y) { const me = skyFl((235 * y - 234) / 19); const parts = 12084 + 13753 * me; const days = 29 * me + skyFl(parts / 25920); return skyMod(3 * (days + 1), 7) < 3 ? days + 1 : days; }
function skyHebNewYear(y) { const a = skyHebElapsed(y - 1); const b = skyHebElapsed(y); const c = skyHebElapsed(y + 1); return SKY_HEB_EPOCH + b + (c - b === 356 ? 2 : b - a === 382 ? 1 : 0); }
const skyHebYearDays = (y) => skyHebNewYear(y + 1) - skyHebNewYear(y);
function skyHebMonthDays(y, m) { const n = skyHebYearDays(y); if ([2, 4, 6, 10, 13].includes(m) || (m === 12 && !skyHebLeap(y)) || (m === 8 && n % 10 !== 5) || (m === 9 && n % 10 === 3)) return 29; return 30; }
function skyHebFixed(y, m, d) {
  const last = skyHebLeap(y) ? 13 : 12; let r = skyHebNewYear(y) + d - 1;
  if (m < 7) { for (let k = 7; k <= last; k++) r += skyHebMonthDays(y, k); for (let k = 1; k < m; k++) r += skyHebMonthDays(y, k); } else for (let k = 7; k < m; k++) r += skyHebMonthDays(y, k);
  return r;
}
function skyHebFromFixed(rd) {
  let y = skyFl((rd - SKY_HEB_EPOCH) / (35975351 / 98496)); while (skyHebNewYear(y + 1) <= rd) y++; while (skyHebNewYear(y) > rd) y--;
  let m = rd < skyHebFixed(y, 1, 1) ? 7 : 1; while (rd > skyHebFixed(y, m, skyHebMonthDays(y, m))) m++;
  return { y, m, d: rd - skyHebFixed(y, m, 1) + 1, leap: skyHebLeap(y) };
}
const SKY_HEB_MONTHS = ['Nisan', 'Iyyar', 'Sivan', 'Tammuz', 'Av', 'Elul', 'Tishri', 'Marheshvan', 'Kislev', 'Tevet', 'Shevat', 'Adar', 'Adar II'];
const skyHebMonthName = (m, leap) => (m === 12 && leap ? 'Adar I' : SKY_HEB_MONTHS[m - 1]);

/* ── the Islamic tabular calendar (the arithmetic "civil" form: months of 30 and 29 days, eleven leap years in thirty); it is a calculation, not the sighting of the crescent ── */
const SKY_ISL_EPOCH = skyJulFixed(622, 7, 16);              /* 1 Muharram AH 1: Friday 16 July 622 (Julian) */
const SKY_ISL_MONTHS = ['Muharram', 'Safar', 'Rabiʿ al-awwal', 'Rabiʿ al-thani', 'Jumada al-ula', 'Jumada al-akhira', 'Rajab', 'Shaʿban', 'Ramadan', 'Shawwal', 'Dhu al-Qaʿda', 'Dhu al-Hijja'];
const skyIslFixed = (y, m, d) => d + 29 * (m - 1) + skyFl(m / 2) + 354 * (y - 1) + skyFl((3 + 11 * y) / 30) + SKY_ISL_EPOCH - 1;
function skyIslFromFixed(rd) { const y = skyFl((30 * (rd - SKY_ISL_EPOCH) + 10646) / 10631); const prior = rd - skyIslFixed(y, 1, 1); const m = skyFl((11 * prior + 330) / 325); return { y, m, d: rd - skyIslFixed(y, m, 1) + 1 }; }

/* ── the Coptic and Ethiopian calendars: twelve months of 30 days and a short month of 5 or 6, a leap day every fourth year; the two differ in the epoch ── */
const SKY_COPTIC_EPOCH = skyJulFixed(284, 8, 29);           /* 1 Thout AM 1, the Era of the Martyrs */
const SKY_ETHIOPIC_EPOCH = skyJulFixed(8, 8, 29);           /* 1 Meskerem 1 of the Ethiopian count */
const skyCopFixed = (e, y, m, d) => e - 1 + 365 * (y - 1) + skyFl(y / 4) + 30 * (m - 1) + d;
function skyCopFromFixed(e, rd) { const y = skyFl((4 * (rd - e) + 1463) / 1461); const m = 1 + skyFl((rd - skyCopFixed(e, y, 1, 1)) / 30); return { y, m, d: rd + 1 - skyCopFixed(e, y, m, 1) }; }
const SKY_COPTIC_MONTHS = ['Thout', 'Paopi', 'Hathor', 'Koiak', 'Tobi', 'Meshir', 'Paremhat', 'Paremoude', 'Pashons', 'Paoni', 'Epip', 'Mesori', 'Pi Kogi Enavot'];
const SKY_ETHIOPIC_MONTHS = ['Meskerem', 'Tikimt', 'Hidar', 'Tahsas', 'Tir', 'Yekatit', 'Megabit', 'Miazia', 'Genbot', 'Sene', 'Hamle', 'Nehase', 'Pagume'];

/* ── India's national calendar (the Shaka era, 1957) and the Thai civil count of the Buddhist Era ── */
const SKY_SAKA_MONTHS = ['Chaitra', 'Vaisakha', 'Jyaistha', 'Asadha', 'Sravana', 'Bhadra', 'Asvina', 'Kartika', 'Agrahayana', 'Pausa', 'Magha', 'Phalguna'];
const skySakaStart = (g) => skyGregFixed(g, 3, skyGregLeap(g) ? 21 : 22);                         /* Chaitra 1 of the year that begins in Gregorian year g */
const skySakaMonthDays = (g, m) => (m === 1 ? (skyGregLeap(g) ? 31 : 30) : m <= 6 ? 31 : 30);
function skySakaFromFixed(rd) {
  let g = skyGregFromFixed(rd).y; if (rd < skySakaStart(g)) g--; let off = rd - skySakaStart(g); let m = 1; while (off >= skySakaMonthDays(g, m)) { off -= skySakaMonthDays(g, m); m++; }
  return { y: g - 78, m, d: off + 1, g };
}
/* the Thai count: the year number is the Gregorian year plus 543, changing on 1 January since 1941 (before that on 1 April, from 1912, and by the lunar new year earlier) */
function skyThaiBE(rd) { const g = skyGregFromFixed(rd); if (rd >= skyGregFixed(1941, 1, 1)) return { y: g.y + 543, rule: 'january' }; if (rd >= skyGregFixed(1912, 4, 1)) return { y: g.m >= 4 ? g.y + 543 : g.y + 542, rule: 'april' }; return { y: g.y + 543, rule: 'earlier', alt: g.y + 542 }; }

/* ── the Nanakshahi (Sikh) calendar as adopted in 2003: the year begins on 14 March; five months of 31 days, then seven of 30; the leap day is the last day of Phagun ── */
const SKY_NS_MONTHS = ['Chet', 'Vaisakh', 'Jeth', 'Harh', 'Sawan', 'Bhadon', 'Assu', 'Katak', 'Maghar', 'Poh', 'Magh', 'Phagun'];
function skyNanakshahi(rd) {
  let g = skyGregFromFixed(rd).y; if (rd < skyGregFixed(g, 3, 14)) g--; let off = rd - skyGregFixed(g, 3, 14); let m = 1;
  const len = (k) => (k <= 5 ? 31 : k < 12 ? 30 : skyGregLeap(g + 1) ? 31 : 30); while (off >= len(m)) { off -= len(m); m++; }
  return { y: g - 1468, m, d: off + 1 };
}

/* ── the Maya count: Long Count, the 260-day Tzolk'in and the 365-day Haab' (the Goodman–Martinez–Thompson correlation, Julian Day Number 584283 for 0.0.0.0.0) ── */
const SKY_MAYA_CORR = 584283;
const SKY_TZOLKIN = ['Imix', 'Ik’', 'Ak’bal', 'K’an', 'Chikchan', 'Kimi', 'Manik’', 'Lamat', 'Muluk', 'Ok', 'Chuwen', 'Eb', 'Ben', 'Ix', 'Men', 'Kib’', 'Kaban', 'Etz’nab’', 'Kawak', 'Ajaw'];
const SKY_HAAB = ['Pop', 'Wo’', 'Sip', 'Sotz’', 'Sek', 'Xul', 'Yaxk’in', 'Mol', 'Ch’en', 'Yax', 'Sak’', 'Keh', 'Mak', 'K’ank’in', 'Muwan', 'Pax', 'K’ayab', 'Kumk’u', 'Wayeb’'];
function skyMaya(rd) {
  const n = rd + 1721425 - SKY_MAYA_CORR; if (n < 0) return null;
  const lc = [skyFl(n / 144000), skyFl(skyMod(n, 144000) / 7200), skyFl(skyMod(n, 7200) / 360), skyFl(skyMod(n, 360) / 20), skyMod(n, 20)]; const hp = skyMod(n + 348, 365); const hm = skyFl(hp / 20);
  return { n, longCount: lc.join('.'), tzNumber: skyMod(n + 3, 13) + 1, tzName: SKY_TZOLKIN[skyMod(n + 19, 20)], haabDay: hm === 18 ? hp - 360 : hp % 20, haabMonth: SKY_HAAB[hm] };
}

/* ── the Roman way of naming a day (after the Julian reform): by counting back to the Kalends (the 1st), the Nones and the Ides of the month ── */
const SKY_ROMAN_ACC = ['Ianuarias', 'Februarias', 'Martias', 'Apriles', 'Maias', 'Iunias', 'Iulias', 'Augustas', 'Septembres', 'Octobres', 'Novembres', 'Decembres'];
const SKY_ROMAN_NOM = ['Ianuariae', 'Februariae', 'Martiae', 'Apriles', 'Maiae', 'Iuniae', 'Iuliae', 'Augustae', 'Septembres', 'Octobres', 'Novembres', 'Decembres'];
const skyRomanNum = (n) => ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX'][n];
function skyRomanDay(jy, jm, jd) {
  const long = [3, 5, 7, 10].includes(jm); const nones = long ? 7 : 5; const ides = long ? 15 : 13; const leap = skyJulLeap(jy); const nextm = (jm % 12) + 1; const cur = SKY_ROMAN_ACC[jm - 1];
  if (jd === 1) return { text: `Kalendae ${SKY_ROMAN_NOM[jm - 1]}`, kind: 'kalends' };
  if (jd < nones) return { text: jd === nones - 1 ? `pridie Nonas ${cur}` : `ante diem ${skyRomanNum(nones - jd + 1)} Nonas ${cur}`, kind: 'before nones' };
  if (jd === nones) return { text: `Nonae ${SKY_ROMAN_NOM[jm - 1]}`, kind: 'nones' };
  if (jd < ides) return { text: jd === ides - 1 ? `pridie Idus ${cur}` : `ante diem ${skyRomanNum(ides - jd + 1)} Idus ${cur}`, kind: 'before ides' };
  if (jd === ides) return { text: `Idus ${SKY_ROMAN_NOM[jm - 1]}`, kind: 'ides' };
  let n = skyDim(leap, jm) - jd + 2; let bis = false;
  if (jm === 2 && leap) { if (jd === 25) { n = 6; bis = true; } else n = skyDim(false, 2) - (jd >= 26 ? jd - 1 : jd) + 2; }
  return { text: n === 2 ? `pridie Kalendas ${SKY_ROMAN_ACC[nextm - 1]}` : `ante diem ${bis ? 'bis ' : ''}${skyRomanNum(n)} Kalendas ${SKY_ROMAN_ACC[nextm - 1]}`, kind: 'before kalends' };
}

/* ── time: the difference between dynamical time (what the formulas give) and Universal Time (the clock), as a polynomial in the year (Espenak and Meeus 2006); the long-term parabola is Morrison and Stephenson's ── */
function skyDeltaT(y) {
  const poly = (t, c) => c.reduceRight((a, k) => a * t + k, 0);
  if (y < -500 || y >= 2150) { const u = (y - 1820) / 100; return -20 + 32 * u * u; }
  if (y < 500) return poly(y / 100, [10583.6, -1014.41, 33.78311, -5.952053, -0.1798452, 0.022174192, 0.0090316521]);
  if (y < 1600) return poly((y - 1000) / 100, [1574.2, -556.01, 71.23472, 0.319781, -0.8503463, -0.005050998, 0.0083572073]);
  if (y < 1700) { const t = y - 1600; return 120 - 0.9808 * t - 0.01532 * t * t + t * t * t / 7129; }
  if (y < 1800) { const t = y - 1700; return 8.83 + 0.1603 * t - 0.0059285 * t * t + 0.00013336 * t * t * t - t * t * t * t / 1174000; }
  if (y < 1860) return poly(y - 1800, [13.72, -0.332447, 0.0068612, 0.0041116, -0.00037436, 0.0000121272, -0.0000001699, 0.000000000875]);
  if (y < 1900) { const t = y - 1860; return 7.62 + 0.5737 * t - 0.251754 * t * t + 0.01680668 * t * t * t - 0.0004473624 * t * t * t * t + Math.pow(t, 5) / 233174; }
  if (y < 1920) return poly(y - 1900, [-2.79, 1.494119, -0.0598939, 0.0061966, -0.000197]);
  if (y < 1941) return poly(y - 1920, [21.20, 0.84493, -0.076100, 0.0020936]);
  if (y < 1961) { const t = y - 1950; return 29.07 + 0.407 * t - t * t / 233 + t * t * t / 2547; }
  if (y < 1986) { const t = y - 1975; return 45.45 + 1.067 * t - t * t / 260 - t * t * t / 718; }
  if (y < 2005) return poly(y - 2000, [63.86, 0.3345, -0.060374, 0.0017275, 0.000651814, 0.00002373599]);
  if (y < 2050) { const t = y - 2000; return 62.92 + 0.32217 * t + 0.005589 * t * t; }
  return -20 + 32 * Math.pow((y - 1820) / 100, 2) - 0.5628 * (2150 - y);
}
const skyYearOfJD = (jd) => 2000 + (jd - 2451545) / 365.2425;
/* a "moment" below is Universal Time as a fractional day number (R.D., so the civil day rd begins at moment rd); the dynamical time is that plus delta-T */
const skyJDE = (tee) => { const jd = skyJD(tee); return jd + skyDeltaT(skyYearOfJD(jd)) / 86400; };
const skyUTfromJDE = (jde) => { const jd = jde - skyDeltaT(skyYearOfJD(jde)) / 86400; return skyRDofJD(jd); };

/* ── the Sun (Meeus ch. 25, low accuracy: about 0.01 degree, which is a quarter of an hour of the Sun's motion) ── */
function skySunLongitudeJDE(jde) {
  const T = (jde - 2451545) / 36525; const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T; const M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
  const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * skySin(M) + (0.019993 - 0.000101 * T) * skySin(2 * M) + 0.000289 * skySin(3 * M);
  const om = 125.04 - 1934.136 * T; return skyNorm(L0 + C - 0.00569 - 0.00478 * skySin(om));       /* apparent longitude, from the equinox of the date */
}
const skySunLongitude = (tee) => skySunLongitudeJDE(skyJDE(tee));
function skyEquationOfTime(jde) {       /* minutes: apparent minus mean solar time (Meeus ch. 28) */
  const T = (jde - 2451545) / 36525; const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T; const M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T; const e = 0.016708634 - 0.000042037 * T - 0.0000001267 * T * T;
  const eps = 23.439291 - 0.0130042 * T; const y = Math.pow(Math.tan(eps * SKY_RAD / 2), 2);
  const E = y * skySin(2 * L0) - 2 * e * skySin(M) + 4 * e * y * skySin(M) * skyCos(2 * L0) - 0.5 * y * y * skySin(4 * L0) - 1.25 * e * e * skySin(2 * M);
  return E / SKY_RAD * 4;
}
/* the moment (Universal Time) at or after tee when the Sun's longitude reaches lambda: a first guess from the mean rate, then bisection */
function skySunReach(lambda, tee) {
  const g = (t) => skySigned(skySunLongitude(t) - lambda); let t0 = tee + skyMod(lambda - skySunLongitude(tee), 360) / 360 * 365.242189; let a = t0 - 6; let b = t0 + 6;
  for (let i = 0; i < 60; i++) { const mid = (a + b) / 2; if (g(mid) < 0) a = mid; else b = mid; }
  return (a + b) / 2;
}
/* the moment when the Sun's longitude was lambda, the latest one at or before tee */
function skySunReachBefore(lambda, tee) { const t = skySunReach(lambda, tee - 366); let r = t; while (true) { const n = skySunReach(lambda, r + 300); if (n > tee) return r; r = n; } }

/* ── the equinoxes and solstices (Meeus ch. 27): which = 0 March equinox, 1 June solstice, 2 September equinox, 3 December solstice; the moment is in Universal Time ── */
const SKY_SEASON_A = [[1721139.29189, 365242.13740, 0.06134, 0.00111, -0.00071], [1721233.25401, 365241.72562, -0.05323, 0.00907, 0.00025], [1721325.70455, 365242.49558, -0.11677, -0.00297, 0.00074], [1721414.39987, 365242.88257, -0.00769, -0.00933, -0.00006]];
const SKY_SEASON_C = [[2451623.80984, 365242.37404, 0.05169, -0.00411, -0.00057], [2451716.56767, 365241.62603, 0.00325, 0.00888, -0.00030], [2451810.21715, 365242.01767, -0.11575, 0.00337, 0.00078], [2451900.05952, 365242.74049, -0.06223, -0.00823, 0.00032]];
const SKY_SEASON_TERMS = [[485, 324.96, 1934.136], [203, 337.23, 32964.467], [199, 342.08, 20.186], [182, 27.85, 445267.112], [156, 73.14, 45036.886], [136, 171.52, 22518.443], [77, 222.54, 65928.934], [74, 296.72, 3034.906], [70, 243.58, 9037.513], [58, 119.81, 33718.147], [52, 297.17, 150.678], [50, 21.02, 2281.226], [45, 247.54, 29929.562], [44, 325.15, 31555.956], [29, 60.93, 4443.417], [18, 155.12, 67555.328], [17, 288.79, 4562.452], [16, 198.04, 62894.029], [14, 199.76, 31436.921], [12, 95.39, 14577.848], [12, 287.11, 31931.756], [12, 320.81, 34777.259], [9, 227.73, 1222.114], [8, 15.45, 16859.074]];
function skySeasonUT(year, which) {
  const early = year < 1000; const Y = early ? year / 1000 : (year - 2000) / 1000; const c = (early ? SKY_SEASON_A : SKY_SEASON_C)[which]; const jde0 = c[0] + Y * (c[1] + Y * (c[2] + Y * (c[3] + Y * c[4])));
  const T = (jde0 - 2451545) / 36525; const W = 35999.373 * T - 2.47; const dl = 1 + 0.0334 * skyCos(W) + 0.0007 * skyCos(2 * W); let S = 0; for (const [A, B, Cc] of SKY_SEASON_TERMS) S += A * skyCos(B + Cc * T);
  return skyUTfromJDE(jde0 + 0.00001 * S / dl);
}

/* ── the Moon: the new Moon (Meeus ch. 49): the instant, in dynamical time, of new Moon number k (k = 0 is the new Moon of 6 January 2000) ── */
function skyNewMoonJDE(k) {
  const T = k / 1236.85; const T2 = T * T; const T3 = T2 * T; const T4 = T3 * T; const E = 1 - 0.002516 * T - 0.0000074 * T2;
  const jde = 2451550.09766 + 29.530588861 * k + 0.00015437 * T2 - 0.000000150 * T3 + 0.00000000073 * T4;
  const M = 2.5534 + 29.10535670 * k - 0.0000014 * T2 - 0.00000011 * T3; const Mp = 201.5643 + 385.81693528 * k + 0.0107582 * T2 + 0.00001238 * T3 - 0.000000058 * T4;
  const F = 160.7108 + 390.67050284 * k - 0.0016118 * T2 - 0.00000227 * T3 + 0.000000011 * T4; const Om = 124.7746 - 1.56375588 * k + 0.0020672 * T2 + 0.00000215 * T3;
  const s = skySin;
  const c = -0.40720 * s(Mp) + 0.17241 * E * s(M) + 0.01608 * s(2 * Mp) + 0.01039 * s(2 * F) + 0.00739 * E * s(Mp - M) - 0.00514 * E * s(Mp + M) + 0.00208 * E * E * s(2 * M) - 0.00111 * s(Mp - 2 * F) - 0.00057 * s(Mp + 2 * F) + 0.00056 * E * s(2 * Mp + M) - 0.00042 * s(3 * Mp) + 0.00042 * E * s(M + 2 * F) + 0.00038 * E * s(M - 2 * F) - 0.00024 * E * s(2 * Mp - M) - 0.00017 * s(Om) - 0.00007 * s(Mp + 2 * M) + 0.00004 * s(2 * Mp - 2 * F) + 0.00004 * s(3 * M) + 0.00003 * s(Mp + M - 2 * F) + 0.00003 * s(2 * Mp + 2 * F) - 0.00003 * s(Mp + M + 2 * F) + 0.00003 * s(Mp - M + 2 * F) - 0.00002 * s(Mp - M - 2 * F) - 0.00002 * s(3 * Mp + M) + 0.00002 * s(4 * Mp);
  const A = [299.77 + 0.107408 * k - 0.009173 * T2, 251.88 + 0.016321 * k, 251.83 + 26.651886 * k, 349.42 + 36.412478 * k, 84.66 + 18.206239 * k, 141.74 + 53.303771 * k, 207.14 + 2.453732 * k, 154.84 + 7.306860 * k, 34.52 + 27.261239 * k, 207.19 + 0.121824 * k, 291.34 + 1.844379 * k, 161.72 + 24.198154 * k, 239.56 + 25.513099 * k, 331.55 + 3.592518 * k];
  const W = [0.000325, 0.000165, 0.000164, 0.000126, 0.000110, 0.000062, 0.000060, 0.000056, 0.000047, 0.000042, 0.000040, 0.000037, 0.000035, 0.000023]; let p = 0; for (let i = 0; i < 14; i++) p += W[i] * s(A[i]);
  return jde + c + p;
}
const skyNewMoonUT = (k) => skyUTfromJDE(skyNewMoonJDE(k));
const SKY_SYNODIC = 29.530588861;
/* the first new Moon at or after the moment tee, and the last one before it: [k, moment] */
function skyNewMoonAtOrAfter(tee) { let k = skyFl((skyJD(tee) - 2451550.09766) / SKY_SYNODIC) - 1; while (skyNewMoonUT(k) < tee) k++; return [k, skyNewMoonUT(k)]; }
function skyNewMoonBefore(tee) { const [k] = skyNewMoonAtOrAfter(tee); return [k - 1, skyNewMoonUT(k - 1)]; }
/* ── the Persian (Solar Hijri) calendar: the year begins on the day the March equinox falls before apparent noon at Tehran (Calendrical Calculations, ch. 14); months of 31, 30 and 29 or 30 days ── */
const SKY_PERSIAN_MONTHS = ['Farvardin', 'Ordibehesht', 'Khordad', 'Tir', 'Mordad', 'Shahrivar', 'Mehr', 'Aban', 'Azar', 'Dey', 'Bahman', 'Esfand'];
const SKY_TEHRAN = { lon: 51.42, zone: 3.5 };
/* the civil day (R.D.) of Nowruz in Gregorian year g, and the number of minutes between the equinox and the noon that decided it (positive: the equinox came before noon of that day) */
function skyPersianNewYear(g) {
  const eq = skySeasonUT(g, 0); const eot = skyEquationOfTime(skyJDE(eq)); const D = Math.ceil(eq - 0.5 + eot / 1440 + SKY_TEHRAN.lon / 360);
  return { rd: D, margin: ((D + 0.5 - eot / 1440 - SKY_TEHRAN.lon / 360) - eq) * 1440 };
}
function skyPersianFromFixed(rd) {
  const g = skyGregFromFixed(rd).y; let gy = g; if (rd < skyPersianNewYear(gy).rd) gy--; const start = skyPersianNewYear(gy).rd; const next = skyPersianNewYear(gy + 1).rd; let off = rd - start; let m; let d;
  if (off < 186) { m = skyFl(off / 31) + 1; d = off % 31 + 1; } else { const o2 = off - 186; m = 7 + skyFl(o2 / 30); d = o2 % 30 + 1; if (m > 12) { m = 12; d = off - 336 + 1; } }
  return { y: gy - 621, m, d, yearDays: next - start, margin: skyPersianNewYear(gy).margin };
}

/* ── the Bahá'í (Badi') calendar: nineteen months of nineteen days, four or five Intercalary Days before the last month; the year begins at Naw-Ruz (21 March until 2014; since 172 BE the day of the March equinox if it falls before sunset at Tehran, else the next day) ── */
const SKY_BAHAI_MONTHS = ['Bahá', 'Jalál', 'Jamál', 'ʻAẓamat', 'Núr', 'Raḥmat', 'Kalimát', 'Kamál', 'Asmá’', 'ʻIzzat', 'Mashíyyat', 'ʻIlm', 'Qudrat', 'Qawl', 'Masá’il', 'Sharaf', 'Sulṭán', 'Mulk', 'Ayyám-i-Há', 'ʻAlá’'];
/* the moment (Universal Time) of sunset at a place on the civil day D of its standard time (the Sun's upper edge at the horizon, with refraction): Meeus ch. 15 and 28 in outline */
function skySunsetUT(D, lat, lon, zone) {
  const noonGuess = D + 0.5 - zone / 24; const eot = skyEquationOfTime(skyJDE(noonGuess)); const noon = D + 0.5 - lon / 360 - eot / 1440; const lam = skySunLongitude(noon); const dec = Math.asin(skySin(23.4393) * skySin(lam)) / SKY_RAD;
  const cosH = (skySin(-0.8333) - skySin(lat) * skySin(dec)) / (skyCos(lat) * skyCos(dec)); return noon + Math.acos(cosH) / (2 * Math.PI);
}
const SKY_TEHRAN_LAT = 35.6892;
function skyBahaiNawRuz(g) {
  if (g < 2015) return { rd: skyGregFixed(g, 3, 21), rule: 'fixed' };
  const eq = skySeasonUT(g, 0); const day = skyFl(eq + SKY_TEHRAN.zone / 24); const sunset = skySunsetUT(day, SKY_TEHRAN_LAT, SKY_TEHRAN.lon, SKY_TEHRAN.zone);
  return { rd: eq < sunset ? day : day + 1, rule: 'equinox', margin: (sunset - eq) * 1440 };      /* margin: minutes by which the equinox came before the sunset of its day (negative: after it) */
}
function skyBahaiFromFixed(rd) {
  const g = skyGregFromFixed(rd).y; let gy = g; if (rd < skyBahaiNawRuz(gy).rd) gy--; const start = skyBahaiNawRuz(gy).rd; const off = rd - start; const nextStart = skyBahaiNawRuz(gy + 1).rd; const len = nextStart - start; const ayyam = len - 361;
  let m; let d; if (off < 342) { m = skyFl(off / 19) + 1; d = off % 19 + 1; } else if (off < 342 + ayyam) { m = 19; d = off - 342 + 1; } else { m = 20; d = off - 342 - ayyam + 1; }
  return { y: gy - 1843, m, d, ayyam, rule: skyBahaiNawRuz(gy).rule };
}

/* ── the Chinese calendar (Calendrical Calculations ch. 19): months begin on the day of the new Moon in Beijing time; month 11 holds the winter solstice; a year of thirteen months has a leap month, the first without a
   major solar term (a time the Sun's longitude is a multiple of 30 degrees); the new year is the start of month 1 ── */
const SKY_TROPICAL_YEAR = 365.242189;
const skyAmod = (x, y) => y + skyMod(x, -y);                              /* 1..y instead of 0..y-1 */
const skyChinaZone = (rd) => (skyGregFromFixed(skyFl(rd)).y < 1929 ? 1397 / 180 : 8);           /* hours east of Greenwich: Beijing local mean time before 1929, UTC+8 after */
const skyChinaMidnight = (rd) => rd - skyChinaZone(rd) / 24;
const skyChinaDay = (tee) => skyFl(tee + skyChinaZone(tee) / 24);
const skyChinaTerm = (rd) => skyMod(1 + skyFl(skySunLongitude(skyChinaMidnight(rd)) / 30), 12) + 1;     /* the number, 1 to 12, of the major solar term the Sun is in at the start of day rd */
const skyChinaNewMoonAfter = (rd) => skyChinaDay(skyNewMoonAtOrAfter(skyChinaMidnight(rd))[1]);
const skyChinaNewMoonBefore = (rd) => skyChinaDay(skyNewMoonBefore(skyChinaMidnight(rd))[1]);
function skyChinaSolstice(rd) { const g = skyGregFromFixed(rd).y; const day = (y) => skyChinaDay(skySeasonUT(y, 3)); const s = day(g); return s > rd ? day(g - 1) : s; }
const skyChinaNoTerm = (rd) => skyChinaTerm(rd) === skyChinaTerm(skyChinaNewMoonAfter(rd + 1));
const skyChinaPriorLeap = (mp, m) => m >= mp && (skyChinaNoTerm(m) || skyChinaPriorLeap(mp, skyChinaNewMoonBefore(m)));
function skyChinaNewYearInSui(rd) {
  const s1 = skyChinaSolstice(rd); const s2 = skyChinaSolstice(s1 + 370); const nextM11 = skyChinaNewMoonBefore(s2 + 1); const m12 = skyChinaNewMoonAfter(s1 + 1); const m13 = skyChinaNewMoonAfter(m12 + 1);
  return Math.round((nextM11 - m12) / SKY_SYNODIC) === 12 && (skyChinaNoTerm(m12) || skyChinaNoTerm(m13)) ? skyChinaNewMoonAfter(m13 + 1) : m13;
}
function skyChinaNewYearOnOrBefore(rd) { const ny = skyChinaNewYearInSui(rd); return ny <= rd ? ny : skyChinaNewYearInSui(rd - 180); }
const SKY_CN_STEMS = ['Jia', 'Yi', 'Bing', 'Ding', 'Wu', 'Ji', 'Geng', 'Xin', 'Ren', 'Gui'];
const SKY_CN_BRANCHES = ['Zi', 'Chou', 'Yin', 'Mao', 'Chen', 'Si', 'Wu', 'Wei', 'Shen', 'You', 'Xu', 'Hai'];
const SKY_CN_ANIMALS = ['Rat', 'Ox', 'Tiger', 'Rabbit', 'Dragon', 'Snake', 'Horse', 'Goat', 'Monkey', 'Rooster', 'Dog', 'Pig'];
const SKY_CN_ELEMENTS = ['Wood', 'Wood', 'Fire', 'Fire', 'Earth', 'Earth', 'Metal', 'Metal', 'Water', 'Water'];
/* the name of the Chinese year that begins in Gregorian year g: the pairing of one of ten stems with one of twelve branches (so a name returns after sixty years) */
function skyChinaYearName(g) { const s = skyMod(g - 4, 10); const b = skyMod(g - 4, 12); return { stem: SKY_CN_STEMS[s], branch: SKY_CN_BRANCHES[b], animal: SKY_CN_ANIMALS[b], element: SKY_CN_ELEMENTS[s], name: SKY_CN_STEMS[s] + SKY_CN_BRANCHES[b].toLowerCase(), cycleYear: skyMod(g - 4, 60) + 1 }; }
function skyChineseFromFixed(rd) {
  const s1 = skyChinaSolstice(rd); const s2 = skyChinaSolstice(s1 + 370); const nextM11 = skyChinaNewMoonBefore(s2 + 1); const m12 = skyChinaNewMoonAfter(s1 + 1);
  const leapYear = Math.round((nextM11 - m12) / SKY_SYNODIC) === 12; const m = skyChinaNewMoonBefore(rd + 1);
  const month = skyAmod(Math.round((m - m12) / SKY_SYNODIC) - (leapYear && skyChinaPriorLeap(m12, m) ? 1 : 0), 12);
  const leap = leapYear && skyChinaNoTerm(m) && !skyChinaPriorLeap(m12, skyChinaNewMoonBefore(m)); const ny = skyChinaNewYearOnOrBefore(rd); const gy = skyGregFromFixed(ny).y;
  return Object.assign({ gy, month, leap, day: rd - m + 1, newYear: ny, monthStart: m, leapYear }, skyChinaYearName(gy));
}
/* ── precession and the three zodiacs ──
   The March equinox slides backwards along the ecliptic against the stars: the general precession in longitude, IAU 2006 (Capitaine, Wallace and Chapront 2003), about 50.29 arcseconds a year,
   so one degree in about 72 years and a full turn in about 25,770 years. T is in Julian centuries from J2000.0; the answer is in degrees. */
const skyPrecession = (T) => (5028.796195 * T + 1.1054348 * T * T + 0.00007964 * T * T * T - 0.000023857 * Math.pow(T, 4) - 0.0000000383 * Math.pow(T, 5)) / 3600;
const skyT = (year) => (year - 2000) / 100;                       /* centuries from J2000 for a year (decimal) */
/* The sidereal zodiac needs a zero point: the ayanamsa, the angle between the tropical zero (the equinox of the date) and the sidereal zero. It is a convention and the conventions differ; these two are the commonest.
   Lahiri (Chitrapaksha, the zero point of India's Calendar Reform Committee of 1955) and Fagan-Bradley (the "synetic vernal point" of Cyril Fagan and Donald Bradley, 1950s). Values at J2000.0 as the Swiss Ephemeris
   defines them (Lahiri 23.2455 degrees at 21 March 1956, Fagan-Bradley 24.0420 degrees at 1 January 1950, each carried forward by the precession); software differs by about 0.01 degree. */
const SKY_AYANAMSA = { lahiri: { name: 'Lahiri (Chitrapaksha)', short: 'Lahiri', at2000: 23.8571 }, fagan: { name: 'Fagan–Bradley', short: 'Fagan–Bradley', at2000: 24.7405 } };
const skyAyanamsa = (kind, T) => SKY_AYANAMSA[kind].at2000 + skyPrecession(T);
const SKY_SIGNS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
const SKY_SIGNS_GLYPH = ['♈︎', '♉︎', '♊︎', '♋︎', '♌︎', '♍︎', '♎︎', '♏︎', '♐︎', '♑︎', '♒︎', '♓︎'];
const SKY_SIGNS_MEANING = ['the Ram', 'the Bull', 'the Twins', 'the Crab', 'the Lion', 'the Maiden', 'the Scales', 'the Scorpion', 'the Archer', 'the Sea-goat', 'the Water-bearer', 'the Fishes'];
const SKY_SANSKRIT_SIGNS = ['Mesha', 'Vrishabha', 'Mithuna', 'Karka', 'Simha', 'Kanya', 'Tula', 'Vrishchika', 'Dhanu', 'Makara', 'Kumbha', 'Mina'];
/* The thirteen constellations the ecliptic crosses, on the boundaries the International Astronomical Union adopted in 1930 (drawn by Eugène Delporte, equinox 1875.0). Each number is the ecliptic longitude, measured from
   the J2000.0 equinox, at which the Sun's path enters that constellation. They were worked out for this project by taking points along the J2000 ecliptic, carrying each back to the 1875.0 equator and looking it up in
   Nancy Roman's 1987 table of the boundaries (Centre de Données astronomiques de Strasbourg, catalogue VI/42, in the copy distributed with astropy): good to about 0.01 degree. */
const SKY_IAU = [['Aries', 28.69], ['Taurus', 53.42], ['Gemini', 90.14], ['Cancer', 117.99], ['Leo', 138.04], ['Virgo', 173.85], ['Libra', 217.81], ['Scorpius', 241.05], ['Ophiuchus', 247.64], ['Sagittarius', 266.24], ['Capricornus', 299.66], ['Aquarius', 327.49], ['Pisces', 351.65]];
const SKY_IAU_MEANING = { Aries: 'the Ram', Taurus: 'the Bull', Gemini: 'the Twins', Cancer: 'the Crab', Leo: 'the Lion', Virgo: 'the Maiden', Libra: 'the Scales', Scorpius: 'the Scorpion', Ophiuchus: 'the Serpent-bearer', Sagittarius: 'the Archer', Capricornus: 'the Sea-goat', Aquarius: 'the Water-bearer', Pisces: 'the Fishes' };
/* the constellation (an index into SKY_IAU) that holds a point of the J2000 ecliptic at longitude lam (degrees) */
function skyIauAt(lam) { const x = skyNorm(lam); if (x >= SKY_IAU[12][1] || x < SKY_IAU[0][1]) return 12; let i = 0; while (i < 11 && x >= SKY_IAU[i + 1][1]) i++; return i; }
const skyIauSpan = (i) => { const a = SKY_IAU[i][1]; const b = SKY_IAU[(i + 1) % 13][1]; return skyMod(b - a, 360); };
/* where the March equinox point stands against the stars in a given year: its longitude measured from the J2000 equinox (so it is 0 at the year 2000 and moves backwards) and the constellation it is in */
function skyEquinoxAmongStars(year) { const lam = skyNorm(-skyPrecession(skyT(year))); return { lon: lam, con: skyIauAt(lam), conName: SKY_IAU[skyIauAt(lam)][0] }; }
/* the years in which the March equinox point crosses into each constellation, found from the precession polynomial: [{ name, from, to }] from the earliest year asked to the latest */
function skyEquinoxPassages(y0, y1) {
  const out = []; let prev = skyEquinoxAmongStars(y0).con; let start = y0;
  for (let y = y0 + 1; y <= y1; y++) { const c = skyEquinoxAmongStars(y).con; if (c !== prev) { out.push({ name: SKY_IAU[prev][0], from: start, to: y }); start = y; prev = c; } }
  out.push({ name: SKY_IAU[prev][0], from: start, to: y1 }); return out;
}

/* ── where the Sun was: on the tropical signs (twelve of 30 degrees from the March equinox of the date), the sidereal signs (the same twelve counted from a fixed star-based zero, by an ayanamsa) and the IAU constellations ── */
function skySunSigns(tee) {
  const jde = skyJDE(tee); const T = (jde - 2451545) / 36525; const lon = skySunLongitudeJDE(jde); const lah = skyAyanamsa('lahiri', T); const fb = skyAyanamsa('fagan', T); const lon2000 = skyNorm(lon - skyPrecession(T));
  const sid = (a) => skyNorm(lon - a);
  return { lon, trop: skyFl(lon / 30), tropDeg: lon % 30, lahiri: skyFl(sid(lah) / 30), lahiriDeg: sid(lah) % 30, lahiriLon: sid(lah), fagan: skyFl(sid(fb) / 30), faganDeg: sid(fb) % 30, faganLon: sid(fb), iau: skyIauAt(lon2000), iauLon: lon2000, ayLahiri: lah, ayFagan: fb };
}
/* the same for a civil day (UT): the position at the start and at the end of the day, and for each of the four rules the moment (hours UT) at which the Sun changed sign during the day, if it did */
function skySunDay(rd, hourUT) {
  const t0 = rd; const t1 = rd + 1; const a = skySunSigns(t0); const b = skySunSigns(t1); const at = hourUT == null ? null : skySunSigns(rd + hourUT / 24);
  const rules = [['trop', 'tropical'], ['lahiri', 'Lahiri'], ['fagan', 'Fagan–Bradley'], ['iau', 'IAU']]; const changes = [];
  for (const [k, name] of rules) if (a[k] !== b[k]) { let lo = t0; let hi = t1; for (let i = 0; i < 40; i++) { const mid = (lo + hi) / 2; if (skySunSigns(mid)[k] === a[k]) lo = mid; else hi = mid; } changes.push({ rule: k, name, from: a[k], to: b[k], hour: (lo - rd) * 24 }); }
  return { start: a, end: b, at, changes };
}
/* the moment (Universal Time) at which the Sun's tropical longitude reaches a multiple of 30 degrees in a year: the dates the tropical signs begin */
const skySignStart = (year, sign) => (sign === 0 ? skySeasonUT(year, 0) : skySunReach(sign * 30, skySeasonUT(year, 0) - 1));
/* ── the Hindu lunar new years, in outline (Calendrical Calculations ch. 20): a lunar month takes its name from the sidereal sign the Sun is in at the new Moon that opens it. The Chaitra year begins on the
   first day after the new Moon with the Sun in Pisces (Mina), which is how the year begins in most of India; the Kartika year (Gujarat) begins the day after the new Moon with the Sun in Libra (Tula), after Diwali.
   Which civil day that is depends on when the sunrise falls after the new Moon at the place, so the answer is two days, never one. IST is Indian Standard Time, UTC+5:30. ── */
const skyIstDay = (tee) => skyFl(tee + 5.5 / 24);
function skyHinduNewYear(g, kind) {
  const lo = kind === 'chaitra' ? skyGregFixed(g, 2, 15) : skyGregFixed(g, 9, 20); const hi = kind === 'chaitra' ? skyGregFixed(g, 5, 5) : skyGregFixed(g, 12, 1); let best = null;
  let [k, t] = skyNewMoonAtOrAfter(lo);
  while (t < hi) { const T = (skyJDE(t) - 2451545) / 36525; const sid = skyNorm(skySunLongitude(t) - skyAyanamsa('lahiri', T)); if (kind === 'chaitra' ? sid >= 330 : sid >= 180 && sid < 210) best = t; k++; t = skyNewMoonUT(k); }
  return best == null ? null : { rd: skyIstDay(best), moment: best };
}
/* the Vikram Samvat year number(s) for a day: [] never, one number when every custom agrees, otherwise the numbers in dispute */
function skyVikram(rd) {
  const g = skyGregFromFixed(rd).y; const ch = skyHinduNewYear(g, 'chaitra'); const ka = skyHinduNewYear(g, 'kartika');
  const pick = (ny) => (!ny ? [g + 56] : rd < ny.rd ? [g + 56] : rd > ny.rd + 1 ? [g + 57] : [g + 56, g + 57]);
  return { chaitra: pick(ch), kartika: pick(ka), chaitraDays: ch ? [ch.rd, ch.rd + 1] : null, kartikaDays: ka ? [ka.rd, ka.rd + 1] : null };
}

/* ── one day, in every calendar the app handles ── */
const SKY_METHODS = {
  exact: { label: 'Exact arithmetic', text: 'A fixed rule gives one answer, the same on every computer.' },
  astro: { label: 'Astronomical computation', text: 'Worked out here from the positions of the Sun and Moon; good to the day for about 1900 to 2100.' },
  table: { label: 'A published table', text: 'Read from a table that a calendar office or scholar published.' },
  varies: { label: 'Varies by place and school', text: 'Communities reckon it differently, so a range is given and not one date.' },
};
const SKY_INFO = {
  gregorian: { name: 'Gregorian', kind: 'solar', what: 'A solar calendar: it counts the Sun’s year of 365.2425 days, dropping three leap days every 400 years so the seasons stay in place; years are counted from the Incarnation as Dionysius Exiguus placed it in 525, and the day begins at midnight.' },
  julian: { name: 'Julian', kind: 'solar', what: 'A solar calendar with a leap day every fourth year (a year of 365.25 days) that Julius Caesar began in 45 BCE; it runs a little long, so it has fallen behind the seasons and the Gregorian calendar by a day in about 128 years, and the day begins at midnight.' },
  hebrew: { name: 'Hebrew', kind: 'lunisolar', what: 'Months follow the Moon, and a thirteenth month is added seven times in nineteen years so the festivals stay in their seasons; years are counted from a creation placed in 3761 BCE, by fixed rules in place since about the fourth century, and the day begins at nightfall.' },
  islamic: { name: 'Islamic (Hijri)', kind: 'lunar', what: 'Twelve lunar months of 29 or 30 days counted from the Hijra of 622 CE, with no month ever added, so the year is about 354 days and the calendar moves through the seasons in about 33 years; a month begins with the new crescent, so places can differ by a day, and the day begins at sunset.' },
  chinese: { name: 'Chinese', kind: 'lunisolar', what: 'Months follow the Moon, and a leap month is added about every third year to keep them with the Sun, by the rule that the month holding the winter solstice is the eleventh; years are named in a cycle of sixty, and the day begins at midnight.' },
  persian: { name: 'Persian (Solar Hijri)', kind: 'solar', what: 'A solar calendar counted from the Hijra of 622 CE whose year begins at the March equinox as seen from Tehran (on the day the equinox falls before noon), with six months of 31 days, five of 30 and a last of 29 or 30; the day begins at midnight.' },
  coptic: { name: 'Coptic', kind: 'solar', what: 'A solar calendar descended from the ancient Egyptian civil year: twelve months of 30 days and a short month of five or six, with a leap day every fourth year, counted from the Era of the Martyrs in 284 CE; the day begins at midnight.' },
  ethiopian: { name: 'Ethiopian', kind: 'solar', what: 'The same shape as the Coptic calendar (twelve months of 30 days and a short thirteenth month) but its years run seven to eight years behind the Western count, because its date for the Incarnation is set differently; the day begins at midnight.' },
  buddhist: { name: 'Buddhist Era (Thai civil count)', kind: 'count', what: 'A count of years from the Buddha’s death, taken as 543 BCE in the Theravada reckoning; Thailand’s civil year follows the Gregorian months and has changed its number on 1 January since 1941, while Sri Lanka and others change it at Vesak, so the number can differ by one.' },
  saka: { name: 'Shaka (India’s national calendar)', kind: 'solar', what: 'India’s official calendar since 1957: solar, with fixed months of 30 or 31 days, counted from the Shaka era of 78 CE and beginning on 22 March (21 in a leap year); traditional Hindu calendars instead follow the Moon with leap months and count each day from sunrise.' },
  vikram: { name: 'Vikram Samvat', kind: 'lunisolar', what: 'A count of years from 57 BCE kept with Moon-following months, whose year begins at different times: at the Chaitra new moon (March or April) in much of India, after Diwali in Gujarat, and about 14 April by the Sun in Nepal, so one day can fall in two different years.' },
  baha: { name: 'Bahá’í (Badíʻ)', kind: 'solar', what: 'A solar calendar of nineteen months of nineteen days with four or five extra days before the last month, counted from 1844 CE and beginning at the March equinox (since 2015, the day of the equinox at Tehran); each day begins at sunset.' },
  sikh: { name: 'Nanakshahi (Sikh)', kind: 'solar', what: 'The calendar as adopted in 2003: a solar year counted from Guru Nanak’s birth year (1469 CE) with fixed months of 30 or 31 days beginning on 14 March; many Sikhs still fix festivals by the older Moon-following Bikrami calendar, and the 2010 revision is contested.' },
  maya: { name: 'Maya (Long Count, Tzolk’in, Haab’)', kind: 'count', what: 'Three counts running together and not one calendar: a Long Count of days in units of 20 and 360, a 260-day sacred round of 13 numbers and 20 day names, and a 365-day year; none is tied to the Sun’s year, and the link to our dates is a scholars’ choice.' },
  roman: { name: 'Roman', kind: 'solar', what: 'After 45 BCE the Romans used the Julian calendar but named each day by counting back to three fixed days of the month, the Kalends (the 1st), the Nones and the Ides, and numbered years from the founding of the city in 753 BCE as Varro reckoned it; the civil day began at midnight.' },
};
const SKY_ORDER = ['gregorian', 'julian', 'hebrew', 'islamic', 'chinese', 'persian', 'coptic', 'ethiopian', 'buddhist', 'saka', 'vikram', 'baha', 'sikh', 'maya', 'roman'];
const SKY_ASTRO = [1900, 2100];           /* the years for which the astronomical rows are called good to the day */
const SKY_KINDS = { solar: 'the Sun', lunar: 'the Moon', lunisolar: 'the Sun and Moon', count: 'a count of days or years' };
const skyDate = (d, m, y) => `${d} ${SKY_MONTHS[m - 1]} ${skyYearLabel(y)}`;
const skyRange = (a, b) => (a === b ? a : `${a} to ${b}`);
function skyRows(rd) {
  const g = skyGregFromFixed(rd); const j = skyJulFromFixed(rd); const gy = g.y; const rows = []; const put = (id, o) => rows.push(Object.assign({ id, name: SKY_INFO[id].name, kind: SKY_INFO[id].kind, what: SKY_INFO[id].what, text: null, sub: '', method: null, note: '', why: '', retro: false }, o));
  const inAstro = gy >= SKY_ASTRO[0] && gy <= SKY_ASTRO[1];
  /* Gregorian and Julian */
  { const skipped = rd >= skyGregFixed(1582, 10, 5) && rd <= skyGregFixed(1582, 10, 14); const back = rd < SKY_GREG_START;
    put('gregorian', { text: skyDate(g.d, g.m, g.y), sub: SKY_WEEKDAYS[skyWeekday(rd)], method: 'exact', retro: back, note: skipped ? 'Nobody used this name then: in the places that changed first, Thursday 4 October 1582 (Julian) was followed by Friday 15 October (Gregorian). The Gregorian date here is the calendar counted backwards.' : back ? 'Counted back: the Gregorian calendar began on 15 October 1582, and this is the same count carried backwards.' : '' }); }
  { const lag = rd - skyGregFixed(j.y, j.m, j.d); const early = rd >= SKY_JULIAN_START && rd < skyJulFixed(5, 1, 1); const back = rd < SKY_JULIAN_START;
    put('julian', { text: skyDate(j.d, j.m, j.y), sub: lag === 0 ? 'The same day as the Gregorian date' : `${Math.abs(lag)} day${Math.abs(lag) === 1 ? '' : 's'} ${lag > 0 ? 'behind' : 'ahead of'} the Gregorian date`, method: early ? 'varies' : 'exact', retro: back, range: early ? 'up to three days either side' : '', note: back ? 'Counted back: the Julian calendar began on 1 January 45 BCE.' : early ? 'From 45 BCE until about 4 CE ancient writers report that the priests added leap days too often (every third year) and that Augustus put it right; scholars disagree about exactly when, so a date then can differ from this count by up to three days.' : '' }); }
  /* Hebrew */
  if (rd < SKY_HEB_EPOCH) put('hebrew', { why: 'before its starting point (the Creation, 7 October 3761 BCE Julian)' });
  else { const h = skyHebFromFixed(rd); const early = rd < skyGregFixed(359, 1, 1);
    put('hebrew', { text: `${h.d} ${skyHebMonthName(h.m, h.leap)} ${h.y}`, sub: 'The day began at nightfall on the evening before', method: early ? 'varies' : 'exact', retro: early, range: early ? 'one or two days either side, or a month in a leap year' : '', note: early ? 'The fixed rules are traditionally ascribed to the fourth century; before that the months were announced by observation and the leap months decided by the court, so this is the date the rules would give, not what anyone then reckoned.' : '' }); }
  /* Islamic */
  if (rd < SKY_ISL_EPOCH) put('islamic', { why: 'before the Hijra (16 July 622 CE, Julian)' });
  else { const f = (r) => { const x = skyIslFromFixed(r); return `${x.d} ${SKY_ISL_MONTHS[x.m - 1]} ${x.y}`; }; const x = skyIslFromFixed(rd);
    put('islamic', { text: `${x.d} ${SKY_ISL_MONTHS[x.m - 1]} ${x.y} AH`, sub: 'The day begins at sunset on the evening before. This is the tabular date.', method: 'varies', range: skyRange(f(rd - 1), f(rd + 1)), note: 'Months begin with the sighting of the new crescent, or by a country’s own calculation (Saudi Arabia’s Umm al-Qura table, Turkey’s, and others), so the same day can carry the tabular date or the one before or after it.' }); }
  /* Chinese */
  { const lo = 1645; const hi = 2200;
    if (gy < lo || gy > hi) put('chinese', { why: gy < lo ? 'not computed before 1645: the Chinese calendars of earlier dynasties were made by other rules, and the project holds no table of them' : 'not computed after 2200: the Moon’s motion cannot be taken that far' });
    else { const c = skyChineseFromFixed(rd); const ny = skyGregFromFixed(c.newYear);
      put('chinese', { text: `Year of the ${c.element} ${c.animal} (${c.name}), month ${c.month}${c.leap ? ' (a leap month)' : ''}, day ${c.day}`, sub: `This lunar year began on ${skyDate(ny.d, ny.m, ny.y)}. The day begins at midnight in Beijing.`, method: inAstro ? 'astro' : 'varies', range: inAstro ? '' : 'a day either side, in some months', note: inAstro ? '' : 'Outside about 1900 to 2100 the modern astronomy used here can differ from the tables that the calendar-makers of the time used, by a day in some months.' }); } }
  /* Persian */
  if (rd < skyPersianNewYear(622).rd) put('persian', { why: 'before its starting point (the Hijra, 622 CE)' });
  else if (gy > 3000) put('persian', { why: 'not computed after 3000' });
  else { const p = skyPersianFromFixed(rd); const near = Math.min(Math.abs(p.margin), Math.abs(p.margin - 1440)); const yearStartNear = near < 15;
    put('persian', { text: `${p.d} ${SKY_PERSIAN_MONTHS[p.m - 1]} ${p.y} SH`, sub: 'The year began at the March equinox; the day begins at midnight.', method: inAstro && gy >= 1925 ? 'astro' : 'varies', range: inAstro && gy >= 1925 ? '' : 'a day either side', note: yearStartNear ? 'This year’s equinox falls within a quarter of an hour of the noon that decides the new year, so the official calendar could have placed it a day earlier or later.' : gy < 1925 ? 'Iran made this rule official in 1925; before then the new year was found by other tables.' : '' }); }
  /* Coptic and Ethiopian */
  { const rdEp = (e) => rd < e;
    if (rdEp(SKY_COPTIC_EPOCH)) put('coptic', { why: 'before its starting point (29 August 284 CE, Julian)' }); else { const c = skyCopFromFixed(SKY_COPTIC_EPOCH, rd); put('coptic', { text: `${c.d} ${SKY_COPTIC_MONTHS[c.m - 1]} ${c.y} AM`, sub: 'The day begins at midnight.', method: 'exact' }); }
    if (rdEp(SKY_ETHIOPIC_EPOCH)) put('ethiopian', { why: 'before its starting point (29 August 8 CE, Julian)' }); else { const c = skyCopFromFixed(SKY_ETHIOPIC_EPOCH, rd); put('ethiopian', { text: `${c.d} ${SKY_ETHIOPIC_MONTHS[c.m - 1]} ${c.y}`, sub: 'The day begins at midnight.', method: 'exact' }); } }
  /* Buddhist Era (Thai civil count) */
  { const b = skyThaiBE(rd); const early = b.rule === 'earlier';
    if (b.alt < 1) put('buddhist', { why: 'before its starting point (the Buddha’s death, 543 BCE in this count)' }); else
    put('buddhist', { text: early ? `${g.d} ${SKY_MONTHS[g.m - 1]} ${b.alt} or ${b.y} BE` : `${g.d} ${SKY_MONTHS[g.m - 1]} ${b.y} BE`, sub: b.rule === 'january' ? 'Thai civil count: the number changes on 1 January.' : b.rule === 'april' ? 'In Thailand from 1912 to 1940 the number changed on 1 April.' : '', method: early ? 'varies' : 'exact', range: early ? 'one year either side' : '', retro: early, note: early ? 'The Buddhist Era became Thailand’s official count on 1 April 1912; before that this is a count carried backwards, and other Theravada countries change the number at Vesak or in April, so it can differ by one.' : 'Counts that change the number at Vesak or at the Sinhalese or Burmese new year in April give a number one lower from January until then.' }); }
  /* Hindu: the national Shaka calendar, and the Vikram years */
  { const s = skySakaFromFixed(rd); const back = rd < skyGregFixed(1957, 3, 22);
    if (s.y < 1) put('saka', { why: 'before its starting point (the Shaka era, 78 CE)' }); else
    put('saka', { text: `${s.d} ${SKY_SAKA_MONTHS[s.m - 1]} ${s.y}`, sub: 'The national calendar; the day is the civil day.', method: 'exact', retro: back, note: back ? 'Counted back: the national calendar was fixed by the Calendar Reform Committee and adopted in 1957. The Shaka year numbers themselves have been used in inscriptions since about the second century.' : 'This is not the traditional Hindu date. That follows the Moon (a tithi at sunrise, in a lunar month with leap months) and differs by region, so it is not given here.' });
    const v = skyVikram(rd); const one = (a) => a.join(' or '); const same = one(v.chaitra) === one(v.kartika);
    const text = same ? one(v.chaitra) : `${one(v.chaitra)} (Chaitra year) · ${one(v.kartika)} (Kartika year, Gujarat)`; const unsure = v.chaitra.length > 1 || v.kartika.length > 1; const settled = same && !unsure && inAstro;
    if (Math.min(...v.chaitra, ...v.kartika) < 1) put('vikram', { why: 'before its starting point (57 BCE)' }); else
    put('vikram', { text: `Vikram Samvat ${text}`, sub: settled ? 'Every custom gives this number on this day.' : 'The number depends on where the new year is taken to begin.', method: settled ? 'astro' : 'varies', range: settled ? '' : unsure ? 'on a new-year day itself' : same ? 'a day either side of the new years' : 'two numbers, by custom', note: 'The Chaitra and Kartika new years are worked out here from the new Moon with the Sun in Pisces or Libra by the Lahiri zodiac; the civil day is the one on which the first lunar day is present at sunrise, which depends on the place. Nepal’s Bikram Sambat turns over about 14 April by the Sun.' }); }
  /* Bahá'í */
  { const n1844 = skyGregFixed(1844, 3, 21);
    if (rd < n1844) put('baha', { why: 'before its starting point (21 March 1844)' });
    else if (gy > 3000) put('baha', { why: 'not computed after 3000' });
    else { const b = skyBahaiFromFixed(rd); const nr = skyBahaiNawRuz(skyGregFromFixed(rd).y); const near = nr.rule === 'equinox' && Math.abs(nr.margin) < 20; const name = b.m === 19 ? 'Ayyám-i-Há' : SKY_BAHAI_MONTHS[b.m - 1];
      put('baha', { text: `${b.d} ${b.m === 20 ? SKY_BAHAI_MONTHS[19] : name} ${b.y} BE`, sub: 'The day began at sunset on the evening before.', method: gy < 2015 ? 'exact' : gy <= SKY_ASTRO[1] ? 'astro' : 'varies', range: gy > SKY_ASTRO[1] ? 'a day either side' : '', note: gy < 2015 ? 'Until 2014 Naw-Rúz was kept on 21 March whatever the equinox did; the rule that follows the equinox at Tehran began in 2015.' : near ? 'This year’s equinox falls within minutes of the sunset at Tehran that decides Naw-Rúz, so the published date could be a day earlier or later.' : '' }); } }
  /* Sikh */
  { const n = skyNanakshahi(rd); if (n.y < 1) put('sikh', { why: 'before its starting point (1469 CE, Guru Nanak’s birth year)' }); else put('sikh', { text: `${n.d} ${SKY_NS_MONTHS[n.m - 1]} ${n.y} NS`, sub: 'The day begins at midnight.', method: 'exact', retro: rd < skyGregFixed(2003, 3, 14), note: rd < skyGregFixed(2003, 3, 14) ? 'Counted back: this form of the calendar was adopted in 2003.' : '' }); }
  /* Maya */
  { const m = skyMaya(rd); if (!m) put('maya', { why: 'before the start of the Long Count (11 August 3114 BCE)' }); else put('maya', { text: `${m.longCount} · ${m.tzNumber} ${m.tzName} · ${m.haabDay} ${m.haabMonth}`, sub: 'Long Count, then the 260-day sacred round, then the 365-day year.', method: 'exact', retro: rd < skyGregFixed(-35, 1, 1), note: 'Exact once the link to our calendar is chosen. The common choice (Goodman–Martínez–Thompson, day 584,283) is the one used here; a few scholars prefer a number two days later.' }); }
  /* Roman */
  if (rd < SKY_JULIAN_START) put('roman', { why: 'before 45 BCE: the Roman calendar was then set by the priests and often stood out of step with the seasons, so it is not computed' });
  else { const r = skyRomanDay(j.y, j.m, j.d); const auc = j.y + 753; const early = rd < skyJulFixed(5, 1, 1);
    put('roman', { text: `${r.text} · ${auc} AUC`, sub: 'The civil day began at midnight.', method: early ? 'varies' : 'exact', range: early ? 'up to three days either side' : '', note: early ? 'Counted on the Julian calendar. See the Julian entry for the irregular leap days of the first decades.' : j.m === 2 && skyJulLeap(j.y) && j.d >= 24 && j.d <= 25 ? 'In a leap year the Romans doubled the sixth day before the Kalends of March, so 24 and 25 February carry the same name.' : '' }); }
  return rows;
}
/* the input of the day converter: a day written as year (astronomical, so 1 BCE is 0), month and day in the Gregorian or the Julian calendar; the answer is a day number or a reason */
function skyResolve(y, m, d, system) {
  const Y = Math.trunc(+y); const M = Math.trunc(+m); const D = Math.trunc(+d); const julian = system === 'julian';
  if (![Y, M, D].every(Number.isFinite)) return { error: 'Write the day, the month and the year as numbers.' };
  if (Y < -3999 || Y > 3999) return { error: 'The converter covers 4000 BCE to 3999 CE.' };
  if (M < 1 || M > 12) return { error: 'The month is a number from 1 to 12.' };
  const len = skyDim(julian ? skyJulLeap(Y) : skyGregLeap(Y), M); if (D < 1 || D > len) return { error: `${SKY_MONTHS[M - 1]} ${skyYearLabel(Y)} has ${len} days in the ${julian ? 'Julian' : 'Gregorian'} calendar.` };
  return { rd: julian ? skyJulFixed(Y, M, D) : skyGregFixed(Y, M, D), julian };
}
/* ── the Sun's year and the Moon's months: the numbers behind the "Sun and moon" page ── */
function skyGap() {
  const y = SKY_TROPICAL_YEAR; const m = SKY_SYNODIC;
  return { year: y, month: m, twelve: 12 * m, thirteen: 13 * m, short: y - 12 * m, long: 13 * m - y, metonicMonths: 235 * m, metonicYears: 19 * y, metonicHours: (235 * m - 19 * y) * 24, circuit: y / (y - 12 * m) };
}
/* the mean year of some counts, and how it sits against the seasons (the tropical year is 365.2422 days): days a year it runs ahead (+) or behind (-), years for one day to build up, and years for it to go round every season */
const SKY_MEAN_YEARS = [
  { id: 'egypt', name: 'The old Egyptian civil year (365 days, no leap day)', days: 365, note: 'used for centuries beside other counts' },
  { id: 'julian', name: 'Julian, Coptic and Ethiopian (a leap day every fourth year)', days: 365.25, note: '' },
  { id: 'hebrew', name: 'Hebrew (the mean year of its fixed rules)', days: 35975351 / 98496, note: 'twelve or thirteen lunar months' },
  { id: 'gregorian', name: 'Gregorian (three leap days left out in 400 years)', days: 365.2425, note: '' },
  { id: 'persian', name: 'Persian (each year begins at the equinox, found by astronomy)', days: SKY_TROPICAL_YEAR, note: 'a day is added or not as the equinox falls' },
  { id: 'islamic', name: 'Islamic (twelve lunar months, none ever added)', days: 10631 / 30, note: 'about 354 days' },
];
function skyDriftRow(r) { const d = r.days - SKY_TROPICAL_YEAR; const abs = Math.abs(d); return Object.assign({}, r, { perYear: d, yearsPerDay: abs < 1e-9 ? null : 1 / abs, circuit: abs < 1e-9 ? null : SKY_TROPICAL_YEAR / abs }); }
/* the first day of the Islamic year, in each of n successive years, as a day of the Gregorian year (for the drawing of the year going round) */
function skyIslamicNewYears(h0, n) { const out = []; for (let i = 0; i < n; i++) { const rd = skyIslFixed(h0 + i, 1, 1); const g = skyGregFromFixed(rd); out.push({ h: h0 + i, rd, y: g.y, doy: rd - skyGregFixed(g.y, 1, 1) + 1 }); } return out; }
/* the years of a nineteen-year cycle that have a thirteenth month in the Hebrew calendar (3, 6, 8, 11, 14, 17 and 19) */
const skyMetonicLeaps = () => { const out = []; for (let k = 1; k <= 19; k++) if (skyHebLeap(k)) out.push(k); return out; };

/* ── the three zodiacs for a year, as longitudes measured from the J2000 equinox: the IAU constellations and the sidereal signs are fixed to the stars, the tropical signs slide backwards as the equinox does ── */
function skyZodiacAt(year) {
  const p = skyPrecession(skyT(year)); const eq = skyEquinoxAmongStars(year);
  return { year, precession: p, tropicalStart: skyNorm(-p), lahiriStart: SKY_AYANAMSA.lahiri.at2000, faganStart: SKY_AYANAMSA.fagan.at2000, ayanamsaLahiri: skyAyanamsa('lahiri', skyT(year)), ayanamsaFagan: skyAyanamsa('fagan', skyT(year)), equinoxLon: eq.lon, equinoxCon: eq.conName };
}
/* the year in which an ayanamsa was zero, so that the tropical and sidereal zodiacs began together */
function skyAyanamsaZero(kind) { let lo = -4000; let hi = 2000; for (let i = 0; i < 60; i++) { const mid = (lo + hi) / 2; if (skyAyanamsa(kind, skyT(mid)) < 0) lo = mid; else hi = mid; } return (lo + hi) / 2; }

/* ── "Where was the Sun?": for a day (and, if given, an hour of Universal Time) the Sun's place by each of the four rules, how close it is to a boundary, and whether it changes sign during the day ── */
const skyRashi = (i) => SKY_SANSKRIT_SIGNS[i];
const SKY_RULES = [
  { id: 'trop', name: 'Sun-based (tropical) signs', how: 'twelve signs of 30 degrees counted from the March equinox of the day' },
  { id: 'lahiri', name: 'Star-based (sidereal) signs, Lahiri', how: 'the same twelve counted from a zero fixed to the stars (the Lahiri ayanamsa)' },
  { id: 'fagan', name: 'Star-based (sidereal) signs, Fagan–Bradley', how: 'the same, from the Fagan–Bradley zero' },
  { id: 'iau', name: 'IAU constellations', how: 'the thirteen constellations of unequal width on the boundaries of 1930' },
];
function skySunReport(rd, hourUT) {
  const day = skySunDay(rd, hourUT); const at = day.at || skySunSigns(rd + 0.5); const name = (id, i) => (id === 'iau' ? SKY_IAU[i][0] : SKY_SIGNS[i]);
  const place = (id) => { if (id === 'trop') return { idx: at.trop, deg: at.tropDeg }; if (id === 'lahiri') return { idx: at.lahiri, deg: at.lahiriDeg }; if (id === 'fagan') return { idx: at.fagan, deg: at.faganDeg }; const i = at.iau; return { idx: i, deg: skyMod(at.iauLon - SKY_IAU[i][1], 360) }; };
  const edge = (id, p) => (id === 'iau' ? Math.min(p.deg, skyIauSpan(p.idx) - p.deg) : Math.min(p.deg, 30 - p.deg));
  const rows = SKY_RULES.map((r) => { const p = place(r.id); const ch = day.changes.find((c) => c.rule === r.id); const near = edge(r.id, p);
    return { rule: r.id, name: r.name, how: r.how, sign: name(r.id, p.idx), rashi: r.id === 'lahiri' || r.id === 'fagan' ? skyRashi(p.idx) : '', deg: p.deg, nearDeg: near, near: near < 0.1 || !!ch, change: ch ? { from: name(r.id, ch.from), to: name(r.id, ch.to), hour: ch.hour } : null }; });
  return { lon: at.lon, atHour: hourUT == null ? 12 : hourUT, ayLahiri: at.ayLahiri, ayFagan: at.ayFagan, rows, iauLon: at.iauLon };
}
/* which constellation lies under most of a stretch of the ecliptic of a given width (J2000 longitudes): [name, degrees of overlap] */
function skyDominant(start, width) {
  let best = ['', -1]; for (let i = 0; i < 13; i++) { const a = SKY_IAU[i][1]; const len = skyIauSpan(i); let ov = 0; for (const off of [-360, 0, 360]) { const lo = Math.max(start, a + off); const hi = Math.min(start + width, a + off + len); if (hi > lo) ov += hi - lo; } if (ov > best[1]) best = [SKY_IAU[i][0], ov]; }
  return best;
}
/* the grades of a source, as the History timeline uses them: A a record from the time, B a scholarly work or database, C a reference summary */
const SKY_GRADES = { A: 'A record from the time', B: 'A scholarly work or database', C: 'A reference summary' };
/* @@SKY-PART-8@@ */
if (typeof module !== 'undefined' && module.exports) module.exports = { SKY_RAD, skyMod, skyFl, skySin, skyCos, skyNorm, skySigned, skyGregLeap, skyJulLeap, skyGregFixed, skyGregFromFixed, skyJulFixed, skyJulFromFixed, skyDim, skyJD, skyRDofJD, skyWeekday, SKY_WEEKDAYS, SKY_MONTHS, skyYearLabel, SKY_GREG_START, SKY_JULIAN_START, SKY_HEB_EPOCH, skyHebLeap, skyHebElapsed, skyHebNewYear, skyHebYearDays, skyHebMonthDays, skyHebFixed, skyHebFromFixed, SKY_HEB_MONTHS, skyHebMonthName, SKY_ISL_EPOCH, SKY_ISL_MONTHS, skyIslFixed, skyIslFromFixed, SKY_COPTIC_EPOCH, SKY_ETHIOPIC_EPOCH, skyCopFixed, skyCopFromFixed, SKY_COPTIC_MONTHS, SKY_ETHIOPIC_MONTHS, SKY_SAKA_MONTHS, skySakaStart, skySakaMonthDays, skySakaFromFixed, skyThaiBE, SKY_NS_MONTHS, skyNanakshahi, SKY_MAYA_CORR, SKY_TZOLKIN, SKY_HAAB, skyMaya, SKY_ROMAN_ACC, SKY_ROMAN_NOM, skyRomanNum, skyRomanDay, skyDeltaT, skyYearOfJD, skyJDE, skyUTfromJDE, skySunLongitudeJDE, skySunLongitude, skyEquationOfTime, skySunReach, skySunReachBefore, SKY_SEASON_A, SKY_SEASON_C, SKY_SEASON_TERMS, skySeasonUT, skyNewMoonJDE, skyNewMoonUT, SKY_SYNODIC, skyNewMoonAtOrAfter, skyNewMoonBefore, SKY_PERSIAN_MONTHS, SKY_TEHRAN, skyPersianNewYear, skyPersianFromFixed, SKY_BAHAI_MONTHS, skySunsetUT, SKY_TEHRAN_LAT, skyBahaiNawRuz, skyBahaiFromFixed, SKY_TROPICAL_YEAR, skyAmod, skyChinaZone, skyChinaMidnight, skyChinaDay, skyChinaTerm, skyChinaNewMoonAfter, skyChinaNewMoonBefore, skyChinaSolstice, skyChinaNoTerm, skyChinaPriorLeap, skyChinaNewYearInSui, skyChinaNewYearOnOrBefore, SKY_CN_STEMS, SKY_CN_BRANCHES, SKY_CN_ANIMALS, SKY_CN_ELEMENTS, skyChinaYearName, skyChineseFromFixed, skyPrecession, skyT, SKY_AYANAMSA, skyAyanamsa, SKY_SIGNS, SKY_SIGNS_GLYPH, SKY_SIGNS_MEANING, SKY_SANSKRIT_SIGNS, SKY_IAU, SKY_IAU_MEANING, skyIauAt, skyIauSpan, skyEquinoxAmongStars, skyEquinoxPassages, skySunSigns, skySunDay, skySignStart, skyIstDay, skyHinduNewYear, skyVikram, SKY_METHODS, SKY_INFO, SKY_ORDER, SKY_ASTRO, SKY_KINDS, skyDate, skyRange, skyRows, skyResolve, skyGap, SKY_MEAN_YEARS, skyDriftRow, skyIslamicNewYears, skyMetonicLeaps, skyZodiacAt, skyAyanamsaZero, skyRashi, SKY_RULES, skySunReport, skyDominant, SKY_GRADES };
