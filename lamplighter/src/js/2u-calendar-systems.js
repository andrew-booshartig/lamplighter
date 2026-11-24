/* ═══════════════════════════ 2u · Calendar systems: the same year in every tradition's count ═══════════════════════════
   Each tradition has kept time its own way: by the sun, the moon or both; counted from a creation, a flight, a death, a birth, a coronation or a
   martyrdom. This file knows twenty-odd of them and answers one question: what is this year (the Atlas's year) called in each? Year numbers are for the
   whole Gregorian year and are shown as a range when the other calendar's new year falls inside it ("5786–5787"). Before a calendar's epoch it says so, and
   before it was introduced the answer is marked "counted back": nobody alive then used that count. Exact dates (new years, Easter) are computed only for the
   years the arithmetic or a table can vouch for. Pure functions. Years are signed, with no year 0; internally astronomical (1 BCE = 0). */
const calAstro = (y) => (y < 0 ? y + 1 : y);
const calMod = (a, b) => ((a % b) + b) % b;
/* Julian Day Number of a Gregorian date (proleptic, astronomical year) */
function calJDN(a, m, d) { const q = Math.floor((14 - m) / 12); const y = a + 4800 - q; const mm = m + 12 * q - 3; return d + Math.floor((153 * mm + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045; }
const calLeap = (a) => (a % 4 === 0 && a % 100 !== 0) || a % 400 === 0;

/* ── the Maya Long Count, Tzolk'in and Haab' (Goodman–Martínez–Thompson correlation, JDN 584283) ── */
const MAYA_TZOLKIN = ['Imix', 'Ik’', 'Ak’bal', 'K’an', 'Chikchan', 'Kimi', 'Manik’', 'Lamat', 'Muluk', 'Ok', 'Chuwen', 'Eb', 'Ben', 'Ix', 'Men', 'Kib’', 'Kaban', 'Etz’nab’', 'Kawak', 'Ajaw'];
const MAYA_HAAB = ['Pop', 'Wo’', 'Sip', 'Sotz’', 'Sek', 'Xul', 'Yaxk’in', 'Mol', 'Ch’en', 'Yax', 'Sak’', 'Keh', 'Mak', 'K’ank’in', 'Muwan', 'Pax', 'K’ayab', 'Kumk’u', 'Wayeb’'];
function calMaya(jdn) {
  const n = jdn - 584283; if (n < 0) return null;
  const lc = [Math.floor(n / 144000), Math.floor(n % 144000 / 7200), Math.floor(n % 7200 / 360), Math.floor(n % 360 / 20), n % 20];
  const tz = [calMod(n + 3, 13) + 1, MAYA_TZOLKIN[calMod(n + 19, 20)]]; const hp = calMod(n + 348, 365); const hm = Math.floor(hp / 20);
  return { n, longCount: lc.join('.'), tzolkin: `${tz[0]} ${tz[1]}`, haab: `${hm === 18 ? hp - 360 : hp % 20} ${MAYA_HAAB[hm]}` };
}
/* ── the Chinese sexagenary cycle (stem and branch), by astronomical year ── */
const CHN_STEMS = ['Jia', 'Yi', 'Bing', 'Ding', 'Wu', 'Ji', 'Geng', 'Xin', 'Ren', 'Gui'];
const CHN_BRANCH = ['Zi', 'Chou', 'Yin', 'Mao', 'Chen', 'Si', 'Wu', 'Wei', 'Shen', 'You', 'Xu', 'Hai'];
const CHN_ANIMAL = ['Rat', 'Ox', 'Tiger', 'Rabbit', 'Dragon', 'Snake', 'Horse', 'Goat', 'Monkey', 'Rooster', 'Dog', 'Pig'];
const CHN_ELEMENT = ['Wood', 'Wood', 'Fire', 'Fire', 'Earth', 'Earth', 'Metal', 'Metal', 'Water', 'Water'];
function calChinese(a) { const s = calMod(a - 4, 10); const b = calMod(a - 4, 12); return { stem: CHN_STEMS[s], branch: CHN_BRANCH[b], animal: CHN_ANIMAL[b], element: CHN_ELEMENT[s], name: CHN_STEMS[s] + CHN_BRANCH[b].toLowerCase(), cycleYear: calMod(a - 4, 60) + 1 }; }
/* ── the Mexica (Aztec) year bearer: number 1–13 and one of four signs; 1519 was 1 Reed (Ce Acatl) ── */
const AZTEC_SIGNS = ['Acatl (Reed)', 'Tecpatl (Flint)', 'Calli (House)', 'Tochtli (Rabbit)'];
const calAztec = (a) => ({ n: calMod(a - 1519, 13) + 1, sign: AZTEC_SIGNS[calMod(a - 1519, 4)] });
/* ── Olympiads ── */
const calOlympiad = (a) => ({ n: Math.floor((a + 775) / 4) + 1, year: calMod(a + 775, 4) + 1 });
/* ── Islamic (tabular) year at a Gregorian date ── */
const calIslamicJD = (y, m, d) => d + Math.ceil(29.5 * (m - 1)) + (y - 1) * 354 + Math.floor((3 + 11 * y) / 30) + 1948439.5 - 1;
function calIslamicAt(a, m, d) { const jd = calJDN(a, m, d) - 0.5; let y = Math.floor((a - 621.57) * 1.030684); while (calIslamicJD(y + 1, 1, 1) <= jd) y++; while (calIslamicJD(y, 1, 1) > jd) y--; return y; }
/* ── Japanese era names (nengō) since Meiji; a boundary year belongs to two ── */
const NENGO = [['Meiji', 1868], ['Taishō', 1912], ['Shōwa', 1926], ['Heisei', 1989], ['Reiwa', 2019]];
function calNengo(a) { if (a < 1868) return null; const out = []; NENGO.forEach(([n, y], i) => { const end = i + 1 < NENGO.length ? NENGO[i + 1][1] : Infinity; if (a >= y && a <= end) out.push(`${n} ${a - y + 1}`); }); return out.join(' / '); }

/* ── the calendars ──
   f(a) gives the year number(s) for astronomical Gregorian year a: [first, last] counted from Jan 1 to Dec 31, or a string for cycles.
   since: roughly when that count came into use (before that the answer is "counted back"). epoch: where year 1 starts. */
const CALENDARS = [
  { id: 'gregorian', name: 'Common Era (Gregorian and Julian)', short: 'CE/BCE', kind: 'solar', epoch: 'Year 1 of the Christian era, placed by Dionysius Exiguus in 525 CE', since: 525, used: ['christianity', 'catholicism'], f: (a) => [a, a],
    how: 'A solar year of 365 days with a leap day every fourth year. Julius Caesar fixed the Julian form in 45 BCE; by 1582 it had drifted ten days from the seasons, and Pope Gregory XIII dropped ten days and trimmed the leap rule (no leap day in century years not divisible by 400). Most Catholic lands changed within a few years; Britain and its colonies waited until 1752, Russia until 1918, Greece until 1923.', role: 'Fixes Easter and Christmas for Western Christians. Orthodox churches that kept the Julian calendar keep these feasts 13 days later on the Gregorian calendar.' },
  { id: 'hebrew', name: 'Hebrew (Anno Mundi)', short: 'AM', kind: 'lunisolar', epoch: 'The Creation, reckoned as autumn 3761 BCE', since: 800, used: ['judaism'], f: (a) => [a + 3760, a + 3761], newYear: 'Rosh Hashanah, in September or early October',
    how: 'Twelve lunar months with a thirteenth added seven times in every nineteen years, so the year stays tied to the seasons and the festivals fall in their seasons. The calendar is arithmetical and traditionally credited to Hillel II (c. 359 CE). The year number rises at Rosh Hashanah, not on 1 January.', role: 'Sets Shabbat observance, Passover in spring and the High Holy Days in autumn.' },
  { id: 'islamic', name: 'Islamic (Hijri)', short: 'AH', kind: 'lunar', epoch: 'The Hijra, Muhammad’s move to Medina: 1 Muharram AH 1 = 16 July 622 CE (Julian)', since: 638, used: ['islam'], f: null, newYear: '1 Muharram, about eleven days earlier each Gregorian year',
    how: 'Twelve purely lunar months and no intercalation, so a year is about 354 days and the calendar moves backwards through the seasons, completing the circuit in about 33 years. The Qur’an (9:36–37) forbids adding a month. The caliph Umar is traditionally said to have fixed the era in about 638 CE. Months begin with the sighting of the crescent; calculated tables can differ by a day or two.', role: 'Ramadan, the Hajj and the two Eids move through the whole solar year over a generation.' },
  { id: 'chinese', name: 'Chinese (sexagenary cycle)', short: 'Stems and branches', kind: 'lunisolar', epoch: 'A repeating cycle of 60 years (ten stems × twelve branches); no single epoch', since: 0, used: ['daoism', 'confucianism', 'chinese_folk', 'chinese_buddhism'], f: null, newYear: 'Lunar New Year, between about 21 January and 20 February',
    how: 'A lunisolar calendar: lunar months with a leap month added about every three years. Years are named by pairing one of ten heavenly stems with one of twelve earthly branches (each branch has an animal), so a name returns every 60 years. Some Chinese counts number years from the legendary Yellow Emperor, 2697 BCE.', role: 'Sets the festivals of Chinese folk religion, Daoism and Buddhism, and the ancestor rites that follow the lunar months.' },
  { id: 'buddhist', name: 'Buddhist Era', short: 'BE', kind: 'lunisolar', epoch: 'The Buddha’s death (parinirvana), traditionally 543 BCE', since: 1000, used: ['buddhism', 'theravada'], f: (a) => [a + 543, a + 544], newYear: 'Vesak or Songkran, by country',
    how: 'The Theravada tradition counts years from the Buddha’s death, reckoned as 543 BCE; scholars place it later, around 400 BCE or a little earlier. The number rises at different points in different countries: Thailand now counts it from 1 January (since 1941), while Sri Lanka and others count from Vesak, so the same year can differ by one.', role: 'Dates Vesak, the rains retreat and the monastic year.' },
  { id: 'vikram', name: 'Vikram Samvat', short: 'VS', kind: 'lunisolar', epoch: '57 BCE, traditionally the founding of King Vikramaditya’s era', since: 400, used: ['hinduism', 'vaishnavism', 'shaivism'], f: (a) => [a + 56, a + 57], newYear: 'Chaitra or Baisakh (around April); Gujarat begins at Diwali',
    how: 'A lunisolar calendar widely used in northern and western India and the official calendar of Nepal. Where the year begins varies by region, so the number differs by one depending on where and when.', role: 'Sets the dates of Hindu festivals such as Holi, Diwali and Navaratri.' },
  { id: 'shaka', name: 'Shaka era', short: 'SE', kind: 'lunisolar', epoch: '78 CE; the founder is debated', since: 150, used: ['hinduism'], f: (a) => [a - 79, a - 78], newYear: 'Chaitra 1, around 22 March',
    how: 'Used in inscriptions across India and Southeast Asia (Java and Bali still keep a Saka year) and as the basis of India’s official national calendar, adopted in 1957.', role: 'Dates temple foundations, grants and the Balinese Hindu year.' },
  { id: 'kali', name: 'Kali Yuga', short: 'KY', kind: 'count', epoch: '18 February 3102 BCE, the start of the present world age in Hindu cosmology', since: 499, used: ['hinduism'], f: (a) => [a + 3100, a + 3101],
    how: 'Hindu time is cyclical: four ages (yugas) repeat. The Kali Yuga, the last and darkest, is counted in years from a fixed epoch worked out by astronomers such as Aryabhata in the 5th century CE. It is the count used in many traditional almanacs.', role: 'Places the present moment in the cosmic cycle.' },
  { id: 'jain', name: 'Vira Nirvana Samvat (Jain)', short: 'VNS', kind: 'lunisolar', epoch: 'The nirvana of Mahavira, traditionally 527 BCE', since: 500, used: ['jainism'], f: (a) => [a + 526, a + 527], newYear: 'The day after Diwali',
    how: 'Jains count years from Mahavira’s liberation, traditionally dated 527 BCE (modern scholars often place it later, in the fifth century BCE). The Jain year begins the day after Diwali, which marks his nirvana.', role: 'Dates Mahavira Jayanti, Paryushana and Diwali.' },
  { id: 'sikh', name: 'Nanakshahi (Sikh)', short: 'NS', kind: 'solar', epoch: '1469 CE, the birth of Guru Nanak', since: 1998, used: ['sikhism'], f: (a) => [a - 1469, a - 1468], newYear: '14 March (Chet 1)',
    how: 'A solar calendar devised by Pal Singh Purewal and adopted by the SGPC in 2003 so that Sikh dates would not wander. Many Sikhs still follow the older lunisolar Bikrami calendar for festivals, and the 2010 revision remains contested.', role: 'Fixes Gurpurabs such as the birth of Guru Nanak, where the older calendar is not used.' },
  { id: 'coptic', name: 'Coptic (Era of the Martyrs)', short: 'AM', kind: 'solar', epoch: '29 August 284 CE, the accession of Diocletian, whose persecution the Coptic Church remembers', since: 300, used: ['coptic_orthodox'], f: (a) => [a - 284, a - 283], newYear: 'Nayrouz, 11 September (12 September before a Gregorian leap year)',
    how: 'A direct descendant of the ancient Egyptian civil calendar: twelve months of 30 days plus five or six extra days, with a leap day every four years. It is still the working calendar of Egyptian farmers.', role: 'Sets Coptic feasts, fasts and the agricultural year along the Nile.' },
  { id: 'ethiopian', name: 'Ethiopian', short: 'EC', kind: 'solar', epoch: 'The Incarnation, counted about seven to eight years later than the Western reckoning', since: 400, used: ['ethiopian_orthodox'], f: (a) => [a - 8, a - 7], newYear: 'Enkutatash, 11 September (12 September before a Gregorian leap year)',
    how: 'Thirteen months (twelve of 30 days and a short one of five or six). It follows the same structure as the Coptic calendar but dates the Annunciation and the Incarnation differently, so its year numbers run about 7–8 behind.', role: 'The civil and religious calendar of Ethiopia and Eritrea.' },
  { id: 'persian', name: 'Solar Hijri (Iran and Afghanistan)', short: 'SH', kind: 'solar', epoch: 'The Hijra of 622 CE, with years of the sun', since: 1079, used: ['islam', 'zoroastrianism'], f: (a) => [a - 622, a - 621], newYear: 'Nowruz, the spring equinox, 20 or 21 March',
    how: 'An astronomically exact solar calendar built in 1079 under Omar Khayyam and others, and made official in Iran in 1925. It begins each year at the equinox, a festival that long predates Islam and is shared with Zoroastrians, Bahá’ís, Kurds and others.', role: 'Nowruz is observed across Iranian, Central Asian and Caucasian peoples of several faiths.' },
  { id: 'yazdegerd', name: 'Zoroastrian (Yazdegerd era)', short: 'Y.Z.', kind: 'solar', epoch: '632 CE, the accession of the last Sasanian king, Yazdegerd III', since: 632, used: ['zoroastrianism'], f: (a) => [a - 631, a - 630], newYear: 'Navroz: spring equinox, or in August for the Shahenshahi (Parsi) reckoning',
    how: 'The Zoroastrian calendar has 12 months of 30 days with five extra Gatha days. Three communities (Fasli, Shahenshahi and Kadmi) reckon the year and its new year differently, so their dates can differ by a month or more, and by one in the year count.', role: 'Names every day of the month after a divinity and sets the seasonal Gahambar festivals.' },
  { id: 'baha', name: 'Badíʻ (Bahá’í)', short: 'BE', kind: 'solar', epoch: '1844 CE, the declaration of the Báb', since: 1850, used: ['bahai'], f: (a) => [a - 1844, a - 1843], newYear: 'Naw-Rúz, the spring equinox, 20 or 21 March',
    how: 'Nineteen months of nineteen days (361 days) plus four or five Intercalary Days before the Fast, a solar year that begins at the equinox. Each month is named for an attribute of God.', role: 'Holy days are set by it and by the lunar calendar for the twin birthdays; the Nineteen Day Feast is the community’s regular gathering.' },
  { id: 'roman', name: 'Roman (ab urbe condita)', short: 'AUC', kind: 'count', epoch: 'The founding of Rome, 753 BCE, as fixed by the scholar Varro', since: -50, used: ['roman', 'religio_romana'], f: (a) => [a + 753, a + 753],
    how: 'Roman religious life kept its own calendar of named festival days (the Fasti), set by the priests, with market days every ninth day. Years were usually named for the two consuls; counting from the foundation of the city was a scholars’ convention.', role: 'The Fasti marked which days were open for business, for the courts or for rites.' },
  { id: 'olympiad', name: 'Olympiads (Greek)', short: 'Ol.', kind: 'count', epoch: 'The first Olympic Games, 776 BCE', since: -300, used: ['greek'], f: null,
    how: 'The Greek cities each had their own lunar year and month names, which made dating across cities hard. Historians such as Timaeus (c. 300 BCE) used the four-year Olympiad as a shared count, and it was used until the Games were ended in 393 CE.', role: 'The Games honoured Zeus at Olympia; the truce that protected travellers kept a sacred peace across Greece.' },
  { id: 'seleucid', name: 'Seleucid era', short: 'SE', kind: 'count', epoch: 'October 312 BCE, when Seleucus I took Babylon', since: -311, used: ['judaism', 'syriac_orthodox'], f: (a) => [a + 311, a + 312],
    how: 'Used across the Near East after Alexander. Jews dated contracts by it for over a thousand years, as did Syriac Christians; some Eastern churches still do. It shows how a single political event can become a shared religious count.', role: 'Jews and Christians of the Near East shared one count for centuries.' },
  { id: 'japanese', name: 'Japanese (era names)', short: 'Nengō', kind: 'cycle', epoch: 'Each reign opens a new era name; the imperial count (kōki) numbers years from 660 BCE, the traditional founding by Emperor Jimmu', since: 645, used: ['shinto'], f: null,
    how: 'Years are counted from the start of each emperor’s era name (Reiwa began in 2019). From 1872 to 1945 an imperial year (kōki) was also used, which in 2026 would be 2686. Japan kept a lunisolar calendar until it adopted the Gregorian one in 1873, and many Shinto festivals still follow the old seasonal dates and local custom.', role: 'Imperial rites and many shrine festivals are tied to the reign and to the seasons.' },
  { id: 'tibetan', name: 'Tibetan (Rabjung cycle)', short: 'Rabjung', kind: 'cycle', epoch: '1027 CE, the introduction of the Kalachakra system; sixty-year cycles from then', since: 1027, used: ['tibetan_buddhism'], f: null, newYear: 'Losar, in February or March',
    how: 'A lunisolar calendar like the Chinese one, with years named by an element and an animal and counted in 60-year cycles (rabjung). The 17th cycle began in 1987.', role: 'Fixes Losar, Saga Dawa and the festivals of Tibetan Buddhism.' },
  { id: 'maya', name: 'Maya Long Count, Tzolk’in and Haab’', short: 'Long Count', kind: 'count', epoch: '11 August 3114 BCE, the start of the current great cycle', since: -36, used: ['maya_religion'], f: null,
    how: 'The Maya counted days, not years: a Long Count of days in units of 1, 20, 360, 7,200 and 144,000; a 260-day ritual calendar (Tzolk’in) of 13 numbers and 20 day names; and a 365-day year (Haab’). The Long Count reached 13.0.0.0.0 on 21 December 2012, when a great cycle ended and another began, as an odometer turns over.', role: 'The 260-day calendar is still used by some K’iche’ day-keepers to this day for divination and naming.' },
  { id: 'aztec', name: 'Mexica (Aztec) year bearers', short: 'Xiuhpohualli', kind: 'cycle', epoch: 'A 52-year Calendar Round; no single epoch', since: -500, used: ['aztec_religion'], f: null,
    how: 'A 260-day ritual count (tonalpohualli) meshed with a 365-day solar year (xiuhpohualli). Each year is named for the day on which it begins, always one of four signs, with a number from 1 to 13. After 52 years the two counts realign, and the Mexica held the New Fire ceremony.', role: '1519, the year Cortés landed, was 1 Reed (Ce Acatl), a name linked with Quetzalcoatl. The story that the Mexica took Cortés for the returning god is doubted by many historians.' },
];
/* new-year dates where a table or arithmetic can vouch for them (Gregorian years only) */
const calEnk = (a) => `${a}-09-${calLeap(a + 1) ? '12' : '11'}`;
/* ── the answer for a year ── */
function calYearIn(cal, Y, ext = {}) {
  const a = calAstro(Y);
  const out = { id: cal.id, text: '', before: false, retro: Y < cal.since, why: '' };
  if (cal.id === 'gregorian') { out.text = Y < 0 ? `${-Y} BCE` : Y < 1000 ? `${Y} CE` : String(Y); return out; }
  if (cal.id === 'islamic') { if (a < 622) { out.before = true; out.why = 'before the Hijra (622 CE)'; return out; } const lo = calIslamicAt(a, 1, 1); const hi = calIslamicAt(a, 12, 31); out.text = lo < 1 ? `${hi} (begins that year)` : lo === hi ? String(lo) : `${lo}–${hi}`; return out; }
  if (cal.id === 'chinese') { const c = calChinese(a); out.text = `${c.name} (${c.element} ${c.animal})`; return out; }
  if (cal.id === 'maya') { const m = calMaya(calJDN(a, 1, 1)); if (!m) { out.before = true; out.why = 'before the Long Count’s start (3114 BCE)'; return out; } out.text = m.longCount; out.extra = `${m.tzolkin}, ${m.haab} (1 January)`; return out; }
  if (cal.id === 'aztec') { const z = calAztec(a); out.text = `${z.n} ${z.sign}`; return out; }
  if (cal.id === 'olympiad') { const o = calOlympiad(a); if (a < -775) { out.before = true; out.why = 'before the first Games (776 BCE)'; return out; } out.text = `Ol. ${o.n}.${o.year}`; return out; }
  if (cal.id === 'japanese') { const n = calNengo(a); out.text = n || 'before the Meiji era names'; if (!n) { out.before = false; out.retro = true; } else out.retro = false; if (a >= 1872 && a <= 1945) out.extra = `kōki ${a + 660}`; return out; }
  if (cal.id === 'tibetan') { if (a < 1027) { out.before = true; out.why = 'before the first cycle (1027 CE)'; return out; } out.text = `cycle ${Math.floor((a - 1027) / 60) + 1}, year ${calMod(a - 1027, 60) + 1}`; return out; }
  const r = cal.f(a); const lo = r[0]; const hi = r[1];
  if (hi < 1) { out.before = true; out.why = `before its epoch (${cal.epoch.split(/[,:;]/)[0]})`; return out; }
  out.text = lo < 1 ? `${hi} (begins that year)` : lo === hi ? String(lo) : `${lo}–${hi}`; return out;
}
/* "5786–5787 Hebrew": a compact line for chips */
function calLine(cal, Y) { const r = calYearIn(cal, Y); return r.before ? null : { cal, text: r.text, retro: r.retro, extra: r.extra || '' }; }
/* this Gregorian year's new year in each calendar that can be dated: [{ id, iso | text }] */
function calNewYears(a, ext) {
  const out = []; const E = ext || {};
  if (E.hebNewYearRD && E.calFromRD) out.push({ id: 'hebrew', iso: E.calFromRD(E.hebNewYearRD(a + 3761)), note: 'Rosh Hashanah (the evening before is the start)' });
  if (E.islamicISO) { for (let y = Math.floor((a - 621.57) * 1.030684) - 1; y <= Math.floor((a - 621.57) * 1.030684) + 2; y++) { const iso = E.islamicISO(y, 1, 1); if (iso.startsWith(String(a))) out.push({ id: 'islamic', iso, note: `1 Muharram ${y} AH (tabular: the sighting may differ by a day or two)` }); } }
  if (E.CHINESE_NEW_YEAR && E.CHINESE_NEW_YEAR[a]) out.push({ id: 'chinese', iso: `${a}-${E.CHINESE_NEW_YEAR[a]}`, note: 'Lunar New Year' });
  out.push({ id: 'persian', text: '20 or 21 March', note: 'Nowruz, at the spring equinox' }, { id: 'baha', text: '20 or 21 March', note: 'Naw-Rúz' }, { id: 'sikh', iso: `${a}-03-14`, note: 'Nanakshahi new year (Chet 1)' });
  if (a >= 1900) { out.push({ id: 'coptic', iso: calEnk(a), note: 'Nayrouz' }, { id: 'ethiopian', iso: calEnk(a), note: 'Enkutatash' }); }
  return out;
}
/* the span of years each calendar has been in use (for the chart): [from, to or null for still in use] */
const CAL_SPAN = { gregorian: [1582, null], hebrew: [800, null], islamic: [622, null], chinese: [-100, null], buddhist: [-300, null], vikram: [400, null], shaka: [78, null], kali: [499, null], jain: [-300, null], sikh: [1998, null], coptic: [284, null], ethiopian: [400, null], persian: [1079, null], yazdegerd: [632, null], baha: [1850, null], roman: [-700, 476], olympiad: [-776, 393], seleucid: [-311, 1200], japanese: [645, null], tibetan: [1027, null], maya: [-36, 909], aztec: [-500, 1521] };
if (typeof module !== 'undefined' && module.exports) module.exports = { calAstro, calMod, calJDN, calLeap, calMaya, MAYA_TZOLKIN, MAYA_HAAB, calChinese, calAztec, calOlympiad, calIslamicJD, calIslamicAt, calNengo, CALENDARS, calYearIn, calLine, calNewYears, calEnk, CAL_SPAN };
