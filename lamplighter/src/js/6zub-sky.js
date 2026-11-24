/* ═══════════════════════════ 6zub · Calendars and the sky: the pages ═══════════════════════════
   The tab "Calendars" of the Timeline (2z-sections-core.js; its pages are titled "Calendars and the sky"): #/sky (any day), #/sky/moon (the Sun and the Moon), #/sky/zodiac (the three zodiacs and precession, with a year slider),
   #/sky/sun (where was the Sun) and #/sky/astrology (six systems, from the data in 2z-data-astrology.js). Its first page, #/sky, turns any day into its name in the calendars the app handles and says, for every answer, how it was reached
   (exact arithmetic, an astronomical computation, or a method that varies by place and school, which gives a range and never one confident date). The year converter (#/atlas/calendars) and the year wheel
   (#/path/year) are the other pages of the tab and stay where they were. The logic is in 2z-sky-core.js; the styles are the @sky block of app.css.
   Nothing here is saved or sent: the day a person picks is not stored, not put in the address and not sent anywhere (the address may carry ?d=2024-03-20 to open the page on a day, and is only read). */
const SK_VIEWS = ['moon', 'zodiac', 'sun', 'astrology'];
const skMonthOpts = (sel) => SKY_MONTHS.map((m, i) => `<option value="${i + 1}"${i + 1 === sel ? ' selected' : ''}>${m}</option>`).join('');
const skTag = (cls, text, title) => `<span class="${cls}"${title ? ` title="${esc(title)}"` : ''}>${esc(text)}</span>`;
/* ?d=2024-03-20 (or ?d=-0043-03-15 for 44 BCE: the year there is astronomical, so 1 BCE is 0) and ?s=julian: where the page opens; anything else opens it on today */
function skParseDay(q) {
  const m = /^(-?\d{1,4})-(\d{1,2})-(\d{1,2})$/.exec(String((q && q.d) || '')); if (!m) return null;
  const r = skyResolve(+m[1], +m[2], +m[3], q.s === 'julian' ? 'julian' : 'gregorian'); return r.error ? null : { y: +m[1], m: +m[2], d: +m[3], system: r.julian ? 'julian' : 'gregorian' };
}
const skToday = () => { const n = new Date(); return { y: n.getFullYear(), m: n.getMonth() + 1, d: n.getDate(), system: 'gregorian' }; };
/* the form: a day, a month, a year and an era (there is no year 0), and which calendar the date was written in */
function skFormHTML(v, o) {
  const bce = v.y <= 0; const shown = bce ? 1 - v.y : v.y; const time = o && o.time;
  return `<form class="sk-form" id="skForm" autocomplete="off" role="group" aria-label="Pick a day">
    <label for="skD">Day<input class="input" id="skD" type="number" inputmode="numeric" min="1" max="31" value="${v.d}"></label>
    <label for="skM">Month<select class="select" id="skM">${skMonthOpts(v.m)}</select></label>
    <label for="skY">Year<input class="input" id="skY" type="number" inputmode="numeric" min="1" max="4000" value="${shown}"></label>
    <label for="skE">Era<select class="select" id="skE"><option value="CE"${bce ? '' : ' selected'}>CE</option><option value="BCE"${bce ? ' selected' : ''}>BCE</option></select></label>
    <label for="skS">Calendar<select class="select" id="skS"><option value="gregorian"${v.system === 'gregorian' ? ' selected' : ''}>Gregorian</option><option value="julian"${v.system === 'julian' ? ' selected' : ''}>Julian</option></select></label>
    ${time ? '<label for="skT">Time, UT (optional)<input class="input" id="skT" type="time"></label>' : ''}
    <button class="btn ghost" id="skNow" type="button">Today</button>
  </form>`;
}
/* one answer: the calendar and what it counts, the date, how it was reached, and the one sentence on why it differs */
function skRowHTML(r) {
  const m = r.method ? SKY_METHODS[r.method] : null; const kind = SKY_KINDS[r.kind];
  return `<li class="sk-row${r.text ? '' : ' sk-none'}" id="sk-${esc(r.id)}">
    <div class="sk-head"><span class="sk-name">${esc(r.name)}</span><span class="sk-kind">${esc(kind)}</span></div>
    <div class="sk-date">${r.text ? esc(r.text) : `<span class="muted">${esc(r.why)}</span>`}${r.retro ? ' ' + skTag('tag', 'counted back', 'This calendar did not exist or was not kept this way then: the date is what its rule would have said.') : ''}</div>
    ${r.sub ? `<div class="sk-sub">${esc(r.sub)}</div>` : ''}
    ${m ? `<div class="sk-via">${skTag('sk-m sk-m-' + r.method, m.label, m.text)}${r.range ? ` <span class="sk-range">Range: ${esc(r.range)}</span>` : ''}</div>` : ''}
    <p class="sk-what">${esc(r.what)}</p>${r.note ? `<p class="sk-note">${esc(r.note)}</p>` : ''}</li>`;
}
function skResultHTML(rd) {
  const g = skyGregFromFixed(rd); const rows = skyRows(rd); const used = [...new Set(rows.map((r) => r.method).filter(Boolean))];
  return `<h2 class="sk-day">${esc(SKY_WEEKDAYS[skyWeekday(rd)])} ${esc(skyDate(g.d, g.m, g.y))}<span class="sk-jd">Julian Day ${skyJD(rd).toFixed(1)}</span></h2>
    <ol class="sk-list">${rows.map(skRowHTML).join('')}</ol>
    <div class="sk-legend" aria-label="What the labels mean">${used.map((k) => `<p>${skTag('sk-m sk-m-' + k, SKY_METHODS[k].label)} ${esc(SKY_METHODS[k].text)}</p>`).join('')}</div>`;
}
const skErrHTML = (msg) => `<p class="sk-err" role="alert">${esc(msg)}</p>`;
/* the page: the tool on top, what to know below it */
function skDayBody(q) {
  const v = skParseDay(q) || skToday(); const r = skyResolve(v.y, v.m, v.d, v.system);
  return `<div class="sk">
    <p class="lede">Pick a day and see what it is called in each calendar, how each answer was reached, and why the calendars cannot agree.</p>
    ${skFormHTML(v)}
    <p class="hint sk-priv">The day you pick is not saved, not sent and not put in the address.</p>
    <div id="skOut" aria-live="polite">${r.error ? skErrHTML(r.error) : skResultHTML(r.rd)}</div>
    <section class="sk-below" aria-label="How to read these answers">
      <h3>How to read these answers</h3>
      <p><b>A day.</b> The answer is for the daylight of the day you picked. The Hebrew, Islamic and Bahá’í days begin at sunset, so the evening before already carries the next date, and the Chinese and Persian dates follow Beijing and Tehran. A calendar that counts days from midnight and one that counts them from sunset are both right: they name the same stretch of time differently.</p>
      <p><b>Counted back.</b> A calendar can be asked about a day before it existed. The answer is what its rule would have said, which nobody then used, and it is marked <i>counted back</i>. Our own dates before 15 October 1582 are counted back in the same way: the Gregorian calendar did not exist.</p>
      <p><b>A range, not a date.</b> Where a calendar is kept by sight of the Moon, or kept differently by place or school, the page gives a range of days and says so. It does not choose for you.</p>
      <p><b>Julian dates.</b> History books usually give dates before 1582 (before 1752 in Britain and its colonies, and later elsewhere) in the Julian calendar. If a date you have is Julian, change the box above and the page counts from that.</p>
      <p class="hint">Sources: Reingold and Dershowitz, <i>Calendrical Calculations</i> (Cambridge University Press, 4th edition, 2018), for the calendar rules <span class="tag" title="A scholarly work">B</span>; Jean Meeus, <i>Astronomical Algorithms</i> (Willmann-Bell, 2nd edition, 1998), for the Sun, the equinoxes and the new Moon <span class="tag" title="A scholarly work">B</span>. The results were checked against the Hong Kong Observatory’s lunar tables, published equinox times and the Wikipedia tables of Nowruz and Naw-Rúz (the README lists each). The year converter and the chart of when each calendar was in use are under <a href="#/atlas/calendars">Any year</a>.</p>
    </section></div>`;
}
function skWireDay(root) {
  const out = root.querySelector('#skOut'); const form = root.querySelector('#skForm'); if (!out || !form) return;
  const val = (id) => { const el = root.querySelector('#' + id); return el ? el.value : ''; };
  const draw = () => {
    const raw = +val('skY'); const era = val('skE'); if (!(raw >= 1)) { out.innerHTML = skErrHTML('There is no year 0: 1 BCE is followed by 1 CE. Write a year from 1.'); return; }
    const y = era === 'BCE' ? 1 - Math.trunc(raw) : Math.trunc(raw); const r = skyResolve(y, val('skM'), val('skD'), val('skS'));
    out.innerHTML = r.error ? skErrHTML(r.error) : skResultHTML(r.rd);
  };
  form.addEventListener('input', draw); form.addEventListener('change', draw); form.addEventListener('submit', (e) => { e.preventDefault(); draw(); });
  const now = root.querySelector('#skNow');
  if (now) now.addEventListener('click', () => { const t = skToday(); const set = (id, x) => { const el = root.querySelector('#' + id); if (el) el.value = x; }; set('skD', t.d); set('skM', t.m); set('skY', t.y); set('skE', 'CE'); set('skS', 'gregorian'); draw(); });
}

/* ── the sources of a page, each with its grade (A a record from the time, B a scholarly work or database, C a reference summary: the History timeline’s own scale) ── */
function skSrc(list) {
  return `<ul class="sk-src">${list.map((x) => `<li><span class="tag" title="${esc(SKY_GRADES[x.g])}">${esc(x.g)}</span> ${x.url && typeof ext === 'function' ? ext(x.url, x.t) : esc(x.t)}${x.n ? ` <span class="muted">${esc(x.n)}</span>` : ''}</li>`).join('')}</ul>`;
}
const skXY = (cx, cy, r, lam) => [cx - r * Math.cos(lam * SKY_RAD), cy + r * Math.sin(lam * SKY_RAD)];      /* longitude 0 at the left (nine o’clock), increasing counter-clockwise, as zodiac wheels are drawn */
const skF = (n) => (Math.round(n * 10) / 10).toString();
function skArc(cx, cy, r0, r1, a, b) {
  const p = (r, l) => skXY(cx, cy, r, l).map(skF).join(' '); const big = b - a > 180 ? 1 : 0;
  return `M${p(r1, a)}A${r1} ${r1} 0 ${big} 0 ${p(r1, b)}L${p(r0, b)}A${r0} ${r0} 0 ${big} 1 ${p(r0, a)}Z`;
}
const SK_CON_ABBR = { Aries: 'Ari', Taurus: 'Tau', Gemini: 'Gem', Cancer: 'Cnc', Leo: 'Leo', Virgo: 'Vir', Libra: 'Lib', Scorpius: 'Sco', Ophiuchus: 'Oph', Sagittarius: 'Sgr', Capricornus: 'Cap', Aquarius: 'Aqr', Pisces: 'Psc' };
const skSign3 = (n) => n.slice(0, 3);
/* the zodiac as three rings in the frame of the stars: the thirteen constellations (outer), the twelve sidereal signs by the Lahiri zero (middle) and the twelve tropical signs (inner), which turn as the year changes */
function skRingSVG(year) {
  const z = skyZodiacAt(year); const cx = 190; const cy = 190; const rings = [[146, 178], [112, 142], [78, 108]]; const lab = (r0, r1, a, b, t, cls) => { const [x, y] = skXY(cx, cy, (r0 + r1) / 2, (a + b) / 2); return `<text class="${cls}" x="${skF(x)}" y="${skF(y)}" text-anchor="middle" dominant-baseline="central">${esc(t)}</text>`; };
  let out = '';
  for (let i = 0; i < 13; i++) { const a = SKY_IAU[i][1]; const b = a + skyIauSpan(i); out += `<path class="sk-arc sk-c${SKY_IAU[i][0] === 'Ophiuchus' ? ' on' : ''}" d="${skArc(cx, cy, rings[0][0], rings[0][1], a, b)}"><title>${esc(SKY_IAU[i][0] + ', ' + skF(skyIauSpan(i)) + ' degrees of the ecliptic')}</title></path>${lab(rings[0][0], rings[0][1], a, b, SK_CON_ABBR[SKY_IAU[i][0]], 'sk-lb')}`; }
  for (let i = 0; i < 12; i++) { const a = z.lahiriStart + 30 * i; out += `<path class="sk-arc sk-s" d="${skArc(cx, cy, rings[1][0], rings[1][1], a, a + 30)}"><title>${esc('Star-based ' + SKY_SIGNS[i] + ' (Lahiri), 30 degrees')}</title></path>${lab(rings[1][0], rings[1][1], a, a + 30, skSign3(SKY_SIGNS[i]), 'sk-lb')}`; }
  for (let i = 0; i < 12; i++) { const a = z.tropicalStart + 30 * i; out += `<path class="sk-arc sk-t" d="${skArc(cx, cy, rings[2][0], rings[2][1], a, a + 30)}"><title>${esc('Sun-based ' + SKY_SIGNS[i] + ', 30 degrees')}</title></path>${lab(rings[2][0], rings[2][1], a, a + 30, skSign3(SKY_SIGNS[i]), 'sk-lb')}`; }
  const [ex0, ey0] = skXY(cx, cy, 70, z.tropicalStart); const [ex1, ey1] = skXY(cx, cy, 184, z.tropicalStart);
  out += `<line class="sk-eq" x1="${skF(ex0)}" y1="${skF(ey0)}" x2="${skF(ex1)}" y2="${skF(ey1)}"/>`;
  out += `<text class="sk-mid" x="${cx}" y="${cy - 6}" text-anchor="middle">${esc(skyYearLabel(year))}</text><text class="sk-mid2" x="${cx}" y="${cy + 12}" text-anchor="middle">equinox in ${esc(z.equinoxCon)}</text>`;
  return `<svg class="sk-svg sk-ring" viewBox="0 0 380 380" role="img" aria-label="${esc(`The zodiac in the year ${skyYearLabel(year)}: thirteen constellations outside, the twelve star-based (sidereal) signs in the middle and the twelve sun-based (tropical) signs inside; the March equinox, where the sun-based signs begin, is in ${z.equinoxCon}.`)}">${out}</svg>`;
}
function skZodiacReadout(year) {
  const z = skyZodiacAt(year); const dom = skyDominant(z.tropicalStart, 30); const gap = z.ayanamsaLahiri; const apart = Math.abs(gap) < 0.05 ? 'the two begin together' : `${skF(Math.abs(gap))}° apart`;
  return `<p><b>${esc(skyYearLabel(year))}.</b> The March equinox, where the sun-based (tropical) signs begin, lies in the constellation <b>${esc(z.equinoxCon)}</b>. The sun-based sign Aries, the first 30° from the equinox, lies mostly over <b>${esc(dom[0])}</b> (${Math.round(dom[1])}° of its 30°). The sun-based and the Lahiri star-based (sidereal) signs are <b>${esc(apart)}</b>.</p>`;
}
const SK_PRESETS = [
  { label: 'Babylon, about 400 BCE', year: -399, note: 'The twelve equal signs of 30° are first attested in Babylonian astronomy between about 409 and 398 BCE.' },
  { label: 'Hipparchus, about 130 BCE', year: -129, note: 'Hipparchus is reported to have found precession by comparing star positions with older records.' },
  { label: 'Ptolemy, about 150 CE', year: 150, note: 'Ptolemy’s Almagest reports Hipparchus’s finding and adopts a rate of one degree a century.' },
  { label: 'Zero of the Lahiri zodiac, about 286 CE', year: 286, note: 'By the Lahiri value the sun-based and star-based zodiacs began together in this year. Other ayanamsas give other years.' },
  { label: 'Today', year: new Date().getFullYear(), note: '' },
];
const skRound10 = (y) => (y <= 0 ? 1 - Math.round((1 - y) / 10) * 10 : Math.round(y / 10) * 10);      /* an astronomical year rounded to ten as the page writes it (1855 BCE is about 1860 BCE) */
const skYearOf = (y) => skyYearLabel(y);
function skZodiacBody() {
  const now = new Date().getFullYear(); const T = skyT(now); const lah = skyAyanamsa('lahiri', T); const fag = skyAyanamsa('fagan', T); const gap = skyGap();
  const pass = skyEquinoxPassages(-6000, 6000); const pn = (n) => pass.find((x) => x.name === n); const zl = skyAyanamsaZero('lahiri');
  const span = (n) => skF(skyIauSpan(SKY_IAU.findIndex((c) => c[0] === n)));
  return `<div class="sk">
    <p class="lede">The zodiac is the belt of sky that the Sun, the Moon and the planets move through. It has been cut into pieces in three different ways, and the three have drifted apart.</p>
    <section class="sk-zd" aria-label="The zodiac through the years">
      <div class="sk-zd-fig" id="skRing">${skRingSVG(now)}</div>
      <div class="sk-zd-ctl">
        <label class="sk-sl" for="skYr">Year <output id="skYrOut" for="skYr">${esc(skyYearLabel(now))}</output></label>
        <input id="skYr" type="range" min="-3000" max="3000" step="1" value="${now}" aria-valuetext="${esc(skyYearLabel(now))}">
        <div class="sk-presets" role="group" aria-label="Go to a year">${SK_PRESETS.map((p) => `<button type="button" class="hx-chip" data-year="${p.year}" data-note="${esc(p.note)}">${esc(p.label)}</button>`).join('')}</div>
        <p class="hint" id="skPreNote"></p>
        <div id="skRead" class="sk-read" aria-live="polite">${skZodiacReadout(now)}</div>
        <p class="hint">Outer ring: the thirteen constellations, fixed to the stars. Middle: the twelve star-based (sidereal) signs by the Lahiri zero, also fixed to the stars. Inner: the twelve sun-based (tropical) signs, which turn with the equinox; the line marks the March equinox. Longitudes are measured from the equinox of the year 2000.</p>
      </div>
    </section>
    <section class="sk-block"><h3>Three ways to cut the zodiac</h3>
      <div class="table-wrap"><table class="sk-tab"><tr><th></th><th>Sun-based (tropical) signs</th><th>Star-based (sidereal) signs</th><th>IAU constellations</th></tr>
        <tr><th>Tied to</th><td>The seasons: the March equinox</td><td>The stars: a zero point fixed among them</td><td>The stars: boundaries drawn on the sky</td></tr>
        <tr><th>Parts</th><td>Twelve signs, each exactly 30°</td><td>Twelve signs, each exactly 30°</td><td>Thirteen constellations of unequal width, from ${span('Scorpius')}° (Scorpius) to ${span('Virgo')}° (Virgo) along the ecliptic</td></tr>
        <tr><th>Zero point</th><td>0° Aries is the March equinox of the day</td><td>Chosen: the offset is the ayanamsa, ${skF(lah)}° (Lahiri) or ${skF(fag)}° (Fagan–Bradley) in ${now}</td><td>Boundaries adopted by the International Astronomical Union in 1928 and published by Eugène Delporte in 1930</td></tr>
        <tr><th>Moves against the stars</th><td>Yes: about one degree in 72 years</td><td>No</td><td>No</td></tr>
        <tr><th>Used by</th><td>Most Western astrologers. Twelve equal signs were first set out in Babylonian astronomy about 400 BCE.</td><td>Hindu (Jyotisha) astrologers, the Lahiri zero being the most used in India; some Western astrologers, by the Fagan–Bradley zero.</td><td>Astronomers, to name regions of the sky. Ophiuchus is the thirteenth; it is not a sign in the traditional sun-based or star-based systems.</td></tr>
      </table></div>
      <p>Those who use the sun-based signs hold that the signs belong to the seasons and not to the stars, and those who use the star-based signs hold that the signs should stay with the stars. Each says so in its own terms; the astrology page sets them side by side. To see where the Sun stood by all three rules on a day, use <a href="#/sky/sun">Where was the sun?</a></p>
    </section>
    <section class="sk-block"><h3>Why they drifted apart</h3>
      <p>The Earth’s axis slowly wheels, like the axis of a spinning top, so the point where the Sun crosses the equator in March slides backwards along the ecliptic by about 50 arcseconds a year: <b>one degree in about 72 years</b>, a full turn in about <b>${String(Math.round(gapTurn() / 100) * 100).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</b> years. The sun-based signs move with that point, so they slide against the stars by the same amount, while the star-based signs and the constellations do not. About 2,000 years ago the sun-based signs and the constellations of the same name lay roughly over each other. Today the Sun is at the March equinox, which is sun-based 0° Aries, among the stars of Pisces.</p>
      <p>By the IAU boundaries the March equinox point was in Taurus until about ${esc(skyYearLabel(skRound10(pn('Taurus').to)))}, in Aries until about ${esc(skyYearLabel(skRound10(pn('Aries').to)))} and in Pisces until about ${esc(skyYearLabel(skRound10(pn('Pisces').to)))}, and then enters Aquarius. Before 1928 the constellations had no official boundaries, so any date given for such a change, or for an “age”, depends on where the boundaries are drawn. By the Lahiri value the sun-based and star-based zodiacs began together in about ${esc(skyYearLabel(Math.round(zl)))}; other ayanamsas give other years.</p>
    </section>
    <section class="sk-block"><h3>Who found precession, and on whose word</h3>
      <p>The discovery is usually credited to <b>Hipparchus</b> (about 190 to 120 BCE), whose work on it is dated to about 130 BCE. His own writings on it are lost, so what is known comes from <b>Ptolemy’s <i>Almagest</i></b> (about 150 CE). It says that Hipparchus compared his measurements of the bright star Spica and other stars with those of Timocharis and Aristillus, made about 150 years earlier, and found that Spica had moved about two degrees relative to the equinox. Hipparchus is reported to have given a rate of not less than one degree a century; Ptolemy adopted one degree in a hundred years. The modern value is one degree in about 72 years. The cause, the pull of the Sun and the Moon on the Earth’s equatorial bulge, was worked out by Isaac Newton in the <i>Principia</i> (1687). Some writers have argued that earlier peoples knew of precession (Babylonian, Egyptian and Maya observers have been named); the reference works used here call those claims unsupported or controversial.</p>
    </section>
    <section class="sk-block"><h3>What the numbers rest on</h3>
      <p class="hint">The precession and the ayanamsas are computed here, not read from a table; the ring shows the year you choose to within a fraction of a degree between 3000 BCE and 3000 CE. The thirteen constellation boundaries along the ecliptic were worked out for this project from the official boundary table, and are good to about 0.01°.</p>
      ${skSrc([
        { g: 'C', t: 'English Wikipedia: Axial precession', url: 'https://en.wikipedia.org/wiki/Axial_precession', n: 'precession, its rate and its history' },
        { g: 'C', t: 'English Wikipedia: Hipparchus', url: 'https://en.wikipedia.org/wiki/Hipparchus', n: 'and Ptolemy’s report of him' },
        { g: 'C', t: 'English Wikipedia: Zodiac', url: 'https://en.wikipedia.org/wiki/Zodiac', n: 'the Babylonian twelve signs, about 409 to 398 BCE (after Britton 2010)' },
        { g: 'C', t: 'English Wikipedia: Sidereal and tropical astrology', url: 'https://en.wikipedia.org/wiki/Sidereal_and_tropical_astrology' },
        { g: 'C', t: 'English Wikipedia: Ayanamsa', url: 'https://en.wikipedia.org/wiki/Ayanamsa', n: 'the Lahiri value is the most used in India' },
        { g: 'C', t: 'English Wikipedia: Constellation', url: 'https://en.wikipedia.org/wiki/Constellation', n: 'the IAU list of 1922 and the boundaries of 1928 and 1930' },
        { g: 'B', t: 'Roman, N. G. (1987), “Identification of a constellation from a position”, Publications of the Astronomical Society of the Pacific 99, 695 (Centre de Données astronomiques de Strasbourg, catalogue VI/42)', n: 'the boundary table, from Delporte (1930)' },
        { g: 'B', t: 'Capitaine, N., Wallace, P. T. and Chapront, J. (2003), Astronomy & Astrophysics 412, 567', n: 'the precession value, 5028.8 arcseconds a century, as the Wikipedia article names it' },
      ])}
    </section></div>`;
}
const gapTurn = () => 360 / skyPrecession(0.01);
function skWireZodiac(root) {
  const ring = root.querySelector('#skRing'); const read = root.querySelector('#skRead'); const sl = root.querySelector('#skYr'); const out = root.querySelector('#skYrOut'); const note = root.querySelector('#skPreNote'); if (!ring || !read || !sl) return;
  const set = (y, text) => { const yr = Math.max(-3000, Math.min(3000, Math.round(+y))); if (!Number.isFinite(yr)) return; ring.innerHTML = skRingSVG(yr); read.innerHTML = skZodiacReadout(yr); if (out) out.textContent = skyYearLabel(yr); sl.value = String(yr); sl.setAttribute('aria-valuetext', skyYearLabel(yr)); if (note) note.textContent = text || ''; };
  sl.addEventListener('input', () => set(sl.value, ''));
  (root.querySelectorAll ? root.querySelectorAll('.sk-presets [data-year]') : []).forEach((b) => b.addEventListener('click', () => set(b.dataset.year, b.dataset.note)));
}

/* the Sun and the Moon: why a year and a month do not fit, and how each tradition lives with it */
function skBarsSVG() {
  const g = skyGap(); const x0 = 120; const px = 500 / g.year; const bar = (y, w, cls, label) => `<rect class="${cls}" x="${x0}" y="${y}" width="${skF(w)}" height="16" rx="2"/>${label ? `<text class="sk-lb2" x="${x0 - 8}" y="${y + 12}" text-anchor="end">${esc(label)}</text>` : ''}`;
  let months = ''; for (let i = 0; i < 12; i++) months += `<rect class="sk-mo" x="${skF(x0 + i * g.month * px)}" y="50" width="${skF(g.month * px - 1.5)}" height="16" rx="2"/>`;
  let thirteen = ''; for (let i = 0; i < 13; i++) thirteen += `<rect class="${i === 12 ? 'sk-mo sk-over' : 'sk-mo'}" x="${skF(x0 + i * g.month * px)}" y="82" width="${skF(g.month * px - 1.5)}" height="16" rx="2"/>`;
  const yEnd = x0 + 500;
  return `<svg class="sk-svg sk-bars" viewBox="0 0 810 124" role="img" aria-label="A solar year of ${skF(g.year)} days against twelve lunar months, which fall ${skF(g.short)} days short, and thirteen, which run ${skF(g.long)} days over.">
    ${bar(18, 500, 'sk-yr', 'A year of the Sun')}<text class="sk-lb2" x="${x0 + 540}" y="30">${skF(g.year)} days</text>
    <text class="sk-lb2" x="${x0 - 8}" y="62" text-anchor="end">Twelve months</text>${months}<text class="sk-lb2" x="${x0 + 540}" y="62">${skF(g.twelve)} days: ${skF(g.short)} short</text>
    <text class="sk-lb2" x="${x0 - 8}" y="94" text-anchor="end">Thirteen months</text>${thirteen}<text class="sk-lb2" x="${x0 + 540}" y="94">${skF(g.thirteen)} days: ${skF(g.long)} over</text>
    <line class="sk-end" x1="${yEnd}" y1="12" x2="${yEnd}" y2="104"/></svg>`;
}
function skWheelSVG() {
  const cx = 150; const cy = 150; const r = 96; const list = skyIslamicNewYears(1445, 35); const pt = (doy, rr) => { const th = (doy - 0.5) / 365.25 * 2 * Math.PI; return [cx + rr * Math.sin(th), cy - rr * Math.cos(th)].map(skF); };
  const months = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']; const mid = [16, 46, 75, 106, 136, 167, 197, 228, 259, 289, 320, 350];
  let o = `<circle class="sk-wc" cx="${cx}" cy="${cy}" r="${r}"/>`; months.forEach((m, i) => { const [x, y] = pt(mid[i], r + 16); o += `<text class="sk-lb2" x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central">${m}</text>`; });
  const dots = list.map((d) => pt(d.doy, r)); o += `<polyline class="sk-wl" points="${dots.map((p) => p.join(',')).join(' ')}"/>`;
  list.forEach((d, i) => { o += `<circle class="${i === 0 ? 'sk-wd first' : 'sk-wd'}" cx="${dots[i][0]}" cy="${dots[i][1]}" r="${i === 0 ? 4.5 : 3}"><title>${esc(`1 Muharram ${d.h} AH: day ${d.doy} of ${d.y}`)}</title></circle>`; });
  const f = list[0]; const l = list[34]; o += `<text class="sk-lb2" x="${cx}" y="${cy - 6}" text-anchor="middle">1 Muharram</text><text class="sk-lb2" x="${cx}" y="${cy + 10}" text-anchor="middle">${f.h} to ${l.h} AH</text>`;
  return `<svg class="sk-svg sk-wheel" viewBox="0 0 300 300" role="img" aria-label="The first day of the Islamic year in thirty-five successive years, marked round the circle of the solar year: each year it falls about eleven days earlier, and after about thirty-four years it is back where it began.">${o}</svg>`;
}
function skCycleSVG() {
  const leaps = skyMetonicLeaps(); let o = ''; for (let k = 1; k <= 19; k++) { const x = 20 + (k - 1) * 33; const leap = leaps.includes(k); o += `<circle class="${leap ? 'sk-cy leap' : 'sk-cy'}" cx="${x}" cy="20" r="11"/><text class="${leap ? 'sk-cn leap' : 'sk-cn'}" x="${x}" y="20" text-anchor="middle" dominant-baseline="central">${leap ? 13 : 12}</text><text class="sk-lb2" x="${x}" y="48" text-anchor="middle">${k}</text>`; }
  return `<svg class="sk-svg sk-cycle" viewBox="0 0 650 58" role="img" aria-label="The nineteen years of the Hebrew cycle: years ${leaps.slice(0, -1).join(', ')} and ${leaps[leaps.length - 1]} have thirteen months and the other twelve have twelve.">${o}</svg>`;
}
function skMoonBody() {
  const g = skyGap(); const rows = SKY_MEAN_YEARS.map(skyDriftRow);
  const cell = (r) => (r.perYear === 0 || Math.abs(r.perYear) < 1e-6 ? 'kept to the equinox each year' : r.circuit < 100 ? `${Math.abs(r.perYear).toFixed(1)} days a year ${r.perYear < 0 ? 'behind' : 'ahead'}: round the seasons in about ${Math.round(r.circuit)} years` : r.circuit < 2000 ? `${Math.abs(r.perYear).toFixed(2)} days a year ${r.perYear < 0 ? 'behind' : 'ahead'}: one day every ${Math.round(r.yearsPerDay)} years` : `one day every ${Math.round(r.yearsPerDay / 100) * 100} years`);
  return `<div class="sk">
    <p class="lede">A year of the Sun and the months of the Moon do not fit together. Every calendar in the world is a way of living with that.</p>
    <section class="sk-block"><h3>Two clocks that do not agree</h3>
      <p>The Sun’s year, from one March equinox to the next, is about <b>${skF(g.year)} days</b>. The Moon’s month, from one new moon to the next, is about <b>${(Math.round(g.month * 100) / 100).toFixed(2)} days</b>. Twelve months fall about ${skF(g.short)} days short of the year; thirteen run about ${skF(g.long)} days over it. Neither number divides the other, so a calendar that wants both has to choose what to give up.</p>
      <div class="sk-scroll">${skBarsSVG()}</div>
    </section>
    <section class="sk-block"><h3>Three ways of living with it</h3>
      <p><b>Keep the Sun and drop the Moon.</b> The old Egyptian civil year had 365 days and no leap day, so it fell about a quarter of a day behind the seasons every year and went all the way round them in about 1,500 years. The Julian calendar added a leap day every fourth year, as the Coptic and Ethiopian calendars still do; that runs a little long, by about a day in 128 years. The Gregorian calendar leaves out three leap days in every 400 years, and is off by about a day in 3,200. The Persian calendar uses no rule at all: each year begins on the day the equinox is found, by astronomy, to fall before noon at Tehran.</p>
      <p><b>Keep the Moon and drop the Sun.</b> The Islamic calendar has twelve lunar months and never adds one. Its year is about 354 days, so each month falls about eleven days earlier against the seasons every year, and Ramadan goes round the whole circle of the seasons in about 34 years.</p>
      <div class="sk-scroll sk-narrow">${skWheelSVG()}</div>
      <p><b>Keep both, and add a month when needed.</b> A lunisolar calendar has twelve months in most years and thirteen in some. The Hebrew calendar adds a month seven times in nineteen years, by a fixed rule: the 3rd, 6th, 8th, 11th, 14th, 17th and 19th years of the cycle. That works because 235 months come to within about ${Math.round(g.metonicHours)} hours of nineteen solar years. Babylonian astronomers used the same nineteen-year cycle from about the end of the sixth century BCE, and the Athenian astronomer Meton is reported to have put it forward at Athens in 432 BCE. The Chinese calendar adds a month by watching the Sun: the month that holds none of the twelve major solar terms (the times the Sun’s longitude reaches a multiple of 30°) is the leap month, which comes seven times in nineteen years on average. Hindu calendars add a month when two new moons fall within one solar month.</p>
      <div class="sk-scroll">${skCycleSVG()}</div>
      <p class="hint">The nineteen years of the Hebrew cycle: thirteen months in the years marked 13.</p>
    </section>
    <section class="sk-block"><h3>Greece and Rome</h3>
      <p>The Greek cities each kept their own lunar months, with their own names, and added a month by local decree, so one day had a different name and number in different cities; astronomers used the four-year Olympiad or the nineteen-year cycle to date events across cities. By the time of the Republic the Roman year had 355 days, to which the priests added a month from time to time; ancient writers report that this was often neglected or misused, so the calendar wandered from the seasons. In 46 BCE Julius Caesar, advised by the astronomer Sosigenes of Alexandria according to Pliny, fixed a year of 365¼ days with a leap day every fourth year, and the Julian calendar began on 1 January 45 BCE. By 1582 it ran ten days behind the equinox, and Pope Gregory XIII had ten days dropped (4 October was followed by 15 October) and changed the leap rule. Most Catholic countries changed within a few years; Britain and its colonies in 1752, Russia in 1918, Greece in 1923. Orthodox churches that kept the Julian calendar for the church year keep Christmas thirteen days later by the Gregorian count.</p>
    </section>
    <section class="sk-block"><h3>How far each count wanders from the seasons</h3>
      <div class="table-wrap"><table class="sk-tab"><tr><th>Count</th><th>Mean year</th><th>Against the seasons</th></tr>${rows.map((r) => `<tr><th>${esc(r.name)}</th><td>${r.days.toFixed(4)} days</td><td>${esc(cell(r))}</td></tr>`).join('')}</table></div>
      <p class="hint">The year of the seasons (the tropical year) is taken as ${skF(g.year)} days. A Chinese or Hebrew year is a count of whole months, so the dates of its festivals move about within a month of the same season and do not wander off.</p>
      <p>To see one day named in all of these, use <a href="#/sky">Any day</a>; to see a year in each, <a href="#/atlas/calendars">Any year</a>.</p>
    </section>
    <section class="sk-block"><h3>What the numbers rest on</h3>
      <p class="hint">The lengths of the year and the month, and the mean years of the Julian, Gregorian, Hebrew and Islamic counts, are computed here from the published rules.</p>
      ${skSrc([
        { g: 'B', t: 'Reingold, E. M. and Dershowitz, N. (2018), Calendrical Calculations, 4th edition, Cambridge University Press', n: 'the Hebrew, Islamic, Chinese and Persian rules' },
        { g: 'B', t: 'Meeus, J. (1998), Astronomical Algorithms, 2nd edition, Willmann-Bell', n: 'the year, the Moon’s month and the new Moon' },
        { g: 'C', t: 'English Wikipedia: Metonic cycle', url: 'https://en.wikipedia.org/wiki/Metonic_cycle', n: '19 years and 235 months; Meton at Athens in 432 BCE, which the article gives without a source; Babylonian use from the late sixth century BCE; the Hebrew leap years' },
      ])}
    </section></div>`;
}

/* where was the Sun: a day, and optionally an hour of Universal Time */
const skPad = (n) => String(Math.floor(n)).padStart(2, '0');
const skHM = (h) => `${skPad(h)}:${skPad((h % 1) * 60)}`;
function skStripSVG(rep, rd) {
  const T = (skyJD(rd) - 2451545) / 36525; const W = 700; const x0 = 10; const X = (l) => x0 + (skyNorm(l) / 360) * W; const sun = rep.lon; const p = skyPrecession(T);
  const row = (y, label, segs) => { let o = `<text class="sk-lb2" x="${x0}" y="${y - 3}">${esc(label)}</text>`; for (const s of segs) { const a = s.a; const b = s.b; const parts = skyNorm(a) + (b - a) > 360 ? [[skyNorm(a), 360], [0, skyNorm(a) + (b - a) - 360]] : [[skyNorm(a), skyNorm(a) + (b - a)]]; for (const [u, v] of parts) { const w = ((v - u) / 360) * W; o += `<rect class="sk-seg${s.on ? ' on' : ''}" x="${skF(x0 + (u / 360) * W)}" y="${y}" width="${skF(Math.max(0.5, w))}" height="22"><title>${esc(s.t)}</title></rect>`; if (w > 20) o += `<text class="sk-lb" x="${skF(x0 + (u / 360) * W + w / 2)}" y="${y + 11}" text-anchor="middle" dominant-baseline="central">${esc(s.l)}</text>`; } } return o; };
  const trop = SKY_SIGNS.map((n, i) => ({ a: i * 30, b: i * 30 + 30, l: skSign3(n), t: `Sun-based ${n}` })); const lah = SKY_SIGNS.map((n, i) => ({ a: rep.ayLahiri + i * 30, b: rep.ayLahiri + i * 30 + 30, l: skSign3(n), t: `Star-based ${n} (Lahiri)` }));
  const iau = SKY_IAU.map((c, i) => ({ a: c[1] + p, b: c[1] + p + skyIauSpan(i), l: SK_CON_ABBR[c[0]], t: c[0], on: c[0] === 'Ophiuchus' }));
  const sx = X(sun);
  return `<svg class="sk-svg sk-strip" viewBox="0 0 720 150" role="img" aria-label="The ecliptic as a line from 0 to 360 degrees of sun-based (tropical) longitude, with the sun-based signs, the star-based (sidereal) signs and the IAU constellations as three rows and the Sun at ${skF(sun)} degrees.">${row(22, 'Sun-based signs', trop)}${row(62, 'Star-based signs (Lahiri)', lah)}${row(102, 'IAU constellations', iau)}<line class="sk-sun" x1="${skF(sx)}" y1="8" x2="${skF(sx)}" y2="132"/><circle class="sk-sunc" cx="${skF(sx)}" cy="8" r="5"/><text class="sk-lb2" x="${x0}" y="146">0° ← longitude of the date (from the March equinox) → 360°</text></svg>`;
}
function skSunRowHTML(r) {
  const deg = `${skF(r.deg)}°`;
  const chg = r.change ? `<p class="sk-change">On this day the Sun passes from <b>${esc(r.change.from)}</b> into <b>${esc(r.change.to)}</b> at about <b>${skHM(r.change.hour)} UT</b>: before that moment it is in ${esc(r.change.from)}, after it in ${esc(r.change.to)}. The time of day decides which one applies, and so does the time zone of the place.</p>` : r.near ? `<p class="sk-change">This is within ${skF(r.nearDeg)}° of a boundary, about ${Math.max(1, Math.round(r.nearDeg / 0.041))} hours of the Sun’s motion, which is close to the accuracy of these numbers: the day before or after may differ.</p>` : '';
  return `<li class="sk-row"><div class="sk-head"><span class="sk-name">${esc(r.name)}</span><span class="sk-kind">${esc(r.how)}</span></div><div class="sk-date">${esc(r.sign)} <span class="sk-deg">${deg}</span>${r.rashi ? ` <span class="sk-kind">(${esc(r.rashi)})</span>` : ''}</div>${chg}</li>`;
}
function skSunResultHTML(rd, hour) {
  const g = skyGregFromFixed(rd); const rep = skySunReport(rd, hour); const when = hour == null ? '12:00 UT' : `${skHM(hour)} UT`;
  return `<h2 class="sk-day">${esc(SKY_WEEKDAYS[skyWeekday(rd)])} ${esc(skyDate(g.d, g.m, g.y))}<span class="sk-jd">at ${esc(when)}: longitude ${skF(rep.lon)}°</span></h2>
    <div class="sk-scroll">${skStripSVG(rep, rd)}</div>
    <ol class="sk-list">${rep.rows.map(skSunRowHTML).join('')}</ol>
    <p class="hint">The Lahiri zero is ${skF(rep.ayLahiri)}° and the Fagan–Bradley zero ${skF(rep.ayFagan)}° on this day. Times are Universal Time (UT), the time at Greenwich; add the time zone for the clock where you are.</p>`;
}
function skSunBody(q) {
  const v = skParseDay(q) || skToday(); const r = skyResolve(v.y, v.m, v.d, v.system);
  return `<div class="sk">
    <p class="lede">Pick a day and see where the Sun stood among the signs and the stars, by three different rules. This is a reading of the sky, not a horoscope: nothing is interpreted.</p>
    ${skFormHTML(v, { time: true })}
    <p class="hint sk-priv">The day you pick is not saved, not sent and not put in the address.</p>
    <div id="skOut" aria-live="polite">${r.error ? skErrHTML(r.error) : skSunResultHTML(r.rd, null)}</div>
    <section class="sk-below" aria-label="What these readings mean">
      <h3>What these readings mean</h3>
      <p><b>Sun-based (tropical).</b> The twelve signs are counted from the March equinox of the day, so the Sun is in sun-based Aries from the March equinox to about 20 April, and the signs follow the seasons. <b>Star-based (sidereal).</b> The same twelve signs are counted from a zero fixed to the stars; the offset is the ayanamsa, here the Lahiri value and the Fagan–Bradley value, and the Sanskrit name of the sign (the rashi) is given. <b>IAU constellations.</b> The thirteen constellations the Sun’s path crosses, on the boundaries fixed by the International Astronomical Union in 1928 and published in 1930. They are of unequal width, and the Sun is in Ophiuchus for about 18 days a year. Why the three disagree is on the page <a href="#/sky/zodiac">The zodiac</a>.</p>
      <p><b>How accurate.</b> The Sun’s longitude comes from the published low-accuracy formula of Jean Meeus (<i>Astronomical Algorithms</i>, chapter 25), good to about 0.01°, which is a quarter of an hour of the Sun’s motion. The ayanamsas as different programs give them differ by about 0.01°, and the constellation boundaries are known to about 0.01°. Near a boundary the answer is therefore only as sure as that, and the time of day decides: the page gives the moment the Sun crosses, in Universal Time, when it crosses on the day you chose. For a time of day, fill in the box above.</p>
    </section></div>`;
}
function skReadTime(v) { const m = /^(\d{1,2}):(\d{2})$/.exec(String(v || '')); return m ? Math.min(24, +m[1] + +m[2] / 60) : null; }
function skWireSun(root) {
  const out = root.querySelector('#skOut'); const form = root.querySelector('#skForm'); if (!out || !form) return;
  const val = (id) => { const el = root.querySelector('#' + id); return el ? el.value : ''; };
  const draw = () => { const raw = +val('skY'); const era = val('skE'); if (!(raw >= 1)) { out.innerHTML = skErrHTML('There is no year 0: 1 BCE is followed by 1 CE. Write a year from 1.'); return; }
    const y = era === 'BCE' ? 1 - Math.trunc(raw) : Math.trunc(raw); const r = skyResolve(y, val('skM'), val('skD'), val('skS')); out.innerHTML = r.error ? skErrHTML(r.error) : skSunResultHTML(r.rd, skReadTime(val('skT'))); };
  form.addEventListener('input', draw); form.addEventListener('change', draw); form.addEventListener('submit', (e) => { e.preventDefault(); draw(); });
  const now = root.querySelector('#skNow'); if (now) now.addEventListener('click', () => { const t = skToday(); const set = (id, x) => { const el = root.querySelector('#' + id); if (el) el.value = x; }; set('skD', t.d); set('skM', t.m); set('skY', t.y); set('skE', 'CE'); set('skS', 'gregorian'); set('skT', ''); draw(); });
}

/* astrology’s systems: the same four parts for each, every statement labelled and sourced, nothing said about whether a system works */
const skStat = (st) => `<span class="sk-stat sk-stat-${st}" title="${esc(SKY_STATUS[st].text)}">${esc(SKY_STATUS[st].label)}</span>`;
const skCites = (ids) => `<span class="sk-cites">${ids.map((i) => `<span class="sk-cite"><span class="tag" title="${esc(SKY_GRADES[SKY_REFS[i].g])}">${esc(SKY_REFS[i].g)}</span> ${esc(SKY_REFS[i].k)}</span>`).join(' ')}</span>`;
const skNone = (it) => `<li class="sk-none-note"><span class="sk-stat sk-stat-none">Not found</span> ${esc(it.none)}</li>`;
const skItem = (it) => (it.none ? skNone(it) : `<li class="sk-it">${skStat(it.s)} ${esc(it.t)} ${skCites(it.src)}</li>`);
const skTested = (it) => (it.none ? skNone(it) : `<li class="sk-it sk-tested"><div class="sk-tname"><b>${esc(it.name)}</b> ${skStat(it.s)}</div><div class="sk-twho">${esc(it.who)} · ${esc(String(it.year))} · ${esc(it.venue)}</div><p><span class="sk-k">What was done.</span> ${esc(it.did)}</p><p><span class="sk-k">What was reported.</span> ${esc(it.found)}</p>${skCites(it.src)}</li>`);
function skSystemHTML(sys) {
  const used = []; const note = (a) => (a || []).forEach((it) => (it.src || []).forEach((i) => { if (!used.includes(i)) used.push(i); }));
  note(sys.says); note(sys.works); note(sys.tested); note(sys.replies.practitioners); note(sys.replies.critics);
  const part = (n, title, sub, list, fn) => `<section class="sk-part"><h3><span class="sk-n">${n}</span>${esc(title)}</h3><p class="sk-sub">${esc(sub)}</p><ul class="sk-items">${list.map(fn).join('')}</ul></section>`;
  return `<article class="sk-entry" id="sys-${esc(sys.id)}"><h2 class="sk-etitle">${esc(sys.name)}</h2><p class="sk-zod">Zodiac or cycle: <b>${esc(sys.zodiac)}</b></p><p class="sk-blurb">${esc(sys.blurb)}</p>
    ${part(1, 'What it says', 'In its own terms, as its practitioners state it.', sys.says, skItem)}
    ${part(2, 'How it is worked out from a date', 'And what depends on the zodiac chosen.', sys.works, skItem)}
    ${part(3, 'What has been tested and published', 'With authors, year and venue, and what each study reported.', sys.tested, skTested)}
    <section class="sk-part"><h3><span class="sk-n">4</span>What practitioners and critics say about those studies</h3><p class="sk-sub">Each side in its own words, with its source.</p><h4>Practitioners</h4><ul class="sk-items">${sys.replies.practitioners.map(skItem).join('')}</ul><h4>Critics</h4><ul class="sk-items">${sys.replies.critics.map(skItem).join('')}</ul></section>
    <section class="sk-part sk-srcs"><h3>Sources read for this entry</h3>${skSrc(used.map((i) => SKY_REFS[i]))}</section></article>`;
}
function skAstroBody(q) {
  const id = q && typeof q.s === 'string' && Object.prototype.hasOwnProperty.call(SKY_SYSTEM_BY_ID, q.s) ? q.s : SKY_SYSTEMS[0].id; const sys = SKY_SYSTEM_BY_ID[id];
  return `<div class="sk sk-astro">
    <p class="lede">Six systems that read a date or a birth, set out the same way: what each says, how it is worked out, what has been tested, and what each side says about the tests. This page does not say whether any of them works.</p>
    <section class="sk-how" aria-label="How to read this page"><h3>How to read this page</h3>
      <p>Every statement is labelled ${skStat('documented')} (a record or a published work fixes it), ${skStat('reported')} (someone says it, or a study reports it) or ${skStat('disputed')} (sources or scholars disagree). Every source has a letter, as on the History timeline: <span class="tag">A</span> a record from the time, <span class="tag">B</span> a scholarly work or database, <span class="tag">C</span> a reference summary. Each source was opened for this page, and the list under an entry says what was read. The amount of published testing differs a great deal between systems; an entry says what was and was not found and does not fill a gap with an opinion. Nothing here casts a chart, reads a person or predicts anything.</p></section>
    <nav class="sk-sysnav" aria-label="Choose a system">${SKY_SYSTEMS.map((x) => `<a href="#/sky/astrology?s=${esc(x.id)}"${x.id === id ? ' aria-current="page"' : ''}>${esc(x.short)}</a>`).join('')}</nav>
    ${skSystemHTML(sys)}
    <section class="sk-block"><h3>The six at a glance</h3><div class="table-wrap"><table class="sk-tab"><tr><th></th>${SKY_SYSTEMS.map((x) => `<th>${esc(x.short)}</th>`).join('')}</tr>
      ${[['looks', 'Looks at'], ['cycle', 'Zodiac or cycle'], ['needs', 'Needs from a birth'], ['sky', 'Tied to the sky']].map(([k, n]) => `<tr><th>${n}</th>${SKY_SYSTEMS.map((x) => `<td>${esc(x.glance[k])}</td>`).join('')}</tr>`).join('')}</table></div>
      <p>To see where the Sun stood on a day by the sun-based (tropical) and the star-based (sidereal) rule, use <a href="#/sky/sun">Where was the sun?</a>; for the Chinese and Maya dates of a day, <a href="#/sky">Any day</a>; for why the two zodiacs part, <a href="#/sky/zodiac">The zodiac</a>.</p></section></div>`;
}

Pages.sky = {
  mount(root, parts, query) {
    const view = SK_VIEWS.includes(parts[0]) ? parts[0] : 'day'; const loc = secLocate(view === 'day' ? 'sky' : 'sky/' + view);
    const head = loc ? secHeadHTML(loc, { compact: true, title: 'Calendars and the sky' }) : '<div class="page-head fade-in"><div><h1>Calendars and the sky</h1></div></div>';
    const body = view === 'moon' ? skMoonBody() : view === 'zodiac' ? skZodiacBody() : view === 'sun' ? skSunBody(query || {}) : view === 'astrology' ? skAstroBody(query || {}) : skDayBody(query || {});
    root.innerHTML = `${head}${loc ? secNavHTML(loc, {}) : ''}<div id="skbody">${body}</div>`;
    if (view === 'day') skWireDay(root); else if (view === 'sun') skWireSun(root); else if (view === 'zodiac') skWireZodiac(root);
    else if (view === 'astrology') { const nav = root.querySelector('.sk-sysnav'); const cur = root.querySelector('.sk-sysnav [aria-current]'); if (nav && cur && typeof cur.offsetLeft === 'number' && nav.clientWidth) nav.scrollLeft = Math.max(0, cur.offsetLeft - (nav.clientWidth - cur.offsetWidth) / 2); }      /* on a phone the row of systems scrolls, so the open one is brought into view */
  },
};
