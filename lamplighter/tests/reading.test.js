// Run: node tests/reading.test.js — reading themes and type (src/js/2z-reading-core.js): every theme is readable (text, quiet text, links and the text over each highlight
// colour meet contrast limits), every setting is a short fixed list so nothing else can get into the style sheet, and the style sheet is well-formed for every combination.
const fs = require('fs'); const path = require('path');
const R = require('../src/js/2z-reading-core.js');
let pass = 0; let fail = 0; const ok = (n, c, x = '') => { if (c) pass++; else { fail++; console.log('FAIL', n, typeof x === 'string' ? x : JSON.stringify(x).slice(0, 300)); } };
const colored = R.RT_THEMES.filter((t) => t.bg);

ok('there is a "match the app" choice and at least seven themes, with unique ids, a name and (for the coloured ones) every colour', R.RT_THEMES[0].id === 'auto' && colored.length >= 7 && new Set(R.RT_THEMES.map((t) => t.id)).size === R.RT_THEMES.length && colored.every((t) => t.name && /^#[0-9a-f]{6}$/i.test(t.bg + '') && ['bg', 'fg', 'muted', 'accent', 'line'].every((k) => /^#[0-9a-f]{6}$/i.test(t[k])) && typeof t.dark === 'boolean'));
ok('there are both light and dark themes, and two high-contrast ones', colored.some((t) => !t.dark) && colored.some((t) => t.dark) && colored.filter((t) => t.strong).length === 2);
ok('the contrast arithmetic is the standard one (black on white 21:1, a grey 4.5:1 point, identical colours 1:1)', Math.abs(R.rtContrast('#000000', '#ffffff') - 21) < 1e-9 && Math.abs(R.rtContrast('#767676', '#ffffff') - 4.54) < 0.02 && R.rtContrast('#123456', '#123456') === 1);
for (const t of colored) {
  const lim = t.strong ? 7 : 4.5;
  ok(`${t.id}: text on the background is at least ${lim}:1 (${R.rtContrast(t.fg, t.bg).toFixed(1)})`, R.rtContrast(t.fg, t.bg) >= (t.strong ? 12 : 7), R.rtContrast(t.fg, t.bg));
  ok(`${t.id}: quiet text (verse numbers, notes) is at least ${lim}:1 (${R.rtContrast(t.muted, t.bg).toFixed(1)})`, R.rtContrast(t.muted, t.bg) >= lim, R.rtContrast(t.muted, t.bg));
  ok(`${t.id}: links are at least ${lim}:1 (${R.rtContrast(t.accent, t.bg).toFixed(1)})`, R.rtContrast(t.accent, t.bg) >= lim, R.rtContrast(t.accent, t.bg));
  ok(`${t.id}: quiet text is quieter than the text, so there is a hierarchy`, R.rtContrast(t.muted, t.bg) < R.rtContrast(t.fg, t.bg));
  for (const [name, c] of Object.entries(R.RT_HL)) { const over = R.rtOver(c, t.bg); const cr = R.rtContrast(t.fg, over); const bgc = R.rtRgb(t.bg); const dist = Math.hypot(over[0] - bgc[0], over[1] - bgc[1], over[2] - bgc[2]); ok(`${t.id}: text over a ${name} highlight is at least 4.5:1 (${cr.toFixed(1)}), and the highlight shows against the page (colour distance ${dist.toFixed(0)})`, cr >= 4.5 && dist >= 30, [cr, dist]); }
}
/* the highlight colours here are the ones the reader draws */
{ const css = fs.readFileSync(path.join(__dirname, '../src/css/app.css'), 'utf8'); const all = Object.entries(R.RT_HL).every(([k, c]) => { const m = new RegExp(`\\.hl-${k}\\{--hl:rgba\\((\\d+),(\\d+),(\\d+),([.\\d]+)\\)`).exec(css); return m && +m[1] === c[0] && +m[2] === c[1] && +m[3] === c[2] && Math.abs(+m[4] - c[3]) < 1e-9; }); ok('the five highlight colours are the same as the ones in app.css', all); }

/* settings are lists, nothing else gets in */
ok('defaults are what the reader has always looked like (the app’s own colours, a book face, normal spacing)', R.RT_DEFAULT.theme === 'auto' && R.RT_DEFAULT.font === 'book' && R.RT_DEFAULT.line === 'normal' && R.RT_DEFAULT.width === 'medium' && R.RT_LINE.normal[1] === 1.8 && R.RT_WIDTH.medium[1] === '74ch' && R.RT_SIZE.def === 18);
ok('an empty or wrong-shaped setting becomes the defaults', [undefined, null, 5, 'x', [], {}, { theme: 3 }].every((v) => JSON.stringify(R.rtClean(v)) === JSON.stringify(R.RT_DEFAULT)));
ok('a valid choice is kept, an invalid one is dropped, other keys are ignored', (() => { const c = R.rtClean({ theme: 'sepia', font: 'clear', line: 'airy', width: 'narrow', align: 'justify', verses: 'hide', space: 'wide', junk: '<script>' }); return c.theme === 'sepia' && c.font === 'clear' && c.line === 'airy' && c.width === 'narrow' && c.align === 'justify' && c.verses === 'hide' && c.space === 'wide' && !('junk' in c); })() && R.rtClean({ theme: 'nope' }).theme === 'auto');
ok('names from the object prototype are not themes', ['__proto__', 'constructor', 'toString', 'hasOwnProperty', 'valueOf'].every((k) => R.rtClean({ theme: k, line: k, width: k, align: k, verses: k, space: k }).theme === 'auto' && R.rtClean({ line: k }).line === 'normal' && R.rtClean({ width: k }).width === 'medium' && R.rtClean({ align: k }).align === 'left'));
ok('size is clamped to the range, and a non-number is the default', R.rtSize(5) === 13 && R.rtSize(99) === 40 && R.rtSize('22') === 22 && R.rtSize('x') === 18 && R.rtSize(NaN) === 18 && R.rtSize(17.6) === 18 && R.RT_SIZE.max >= 40);
ok('Easy reading is a sans face, airy lines, wide spacing, left-aligned and a narrow column', R.RT_EASY.font === 'clear' && R.RT_EASY.line === 'airy' && R.RT_EASY.space === 'wide' && R.RT_EASY.align === 'left' && R.RT_EASY.width === 'narrow' && JSON.stringify(R.rtClean(R.RT_EASY)) === JSON.stringify(R.RT_EASY) && R.RT_SIZE_EASY > R.RT_SIZE.def);
ok('every face has a fallback to a generic family, so a missing font never breaks the page', R.RT_FONTS.every((f) => /(serif|sans-serif)$/.test(f.css)) && R.RT_FONTS.length >= 4);

/* the style sheet */
const balanced = (css) => { let d = 0; for (const c of css) { if (c === '{') d++; else if (c === '}') { d--; if (d < 0) return false; } } return d === 0; };
{
  const base = R.rtCss(R.RT_DEFAULT, 18);
  ok('the default style sheet sets the size, the face, the spacing and the width, and does not recolour anything', base.includes(':root{--rt-size:18px}') && base.includes('Georgia') && base.includes('line-height:1.8') && base.includes('max-width:74ch') && !/background|!important/.test(base), base);
  let all = 0; let bad = null;
  for (const t of R.RT_THEMES) for (const f of R.RT_FONTS) for (const line of Object.keys(R.RT_LINE)) for (const w of Object.keys(R.RT_WIDTH)) for (const a of Object.keys(R.RT_ALIGN)) for (const v of Object.keys(R.RT_VERSES)) for (const s of Object.keys(R.RT_SPACE)) {
    const css = R.rtCss({ theme: t.id, font: f.id, line, width: w, align: a, verses: v, space: s }, 22); all++;
    if (!balanced(css) || /[<>]|javascript:|expression\(|@import|url\(/i.test(css) || css.length > 4000 || (a === 'justify') !== /hyphens:auto/.test(css) || (v === 'hide') !== css.includes('.rtsurface .vn{display:none}') || (t.bg ? !css.includes(t.bg) || !css.includes(t.fg) : /background/.test(css))) { bad = bad || [t.id, f.id, line, w, a, v, s]; }
  }
  ok(`all ${all} combinations give a balanced style sheet with no markup, no outside resource and only the colours of the chosen theme`, !bad, bad);
  ok('hostile settings give the default style sheet, never their own text', R.rtCss({ theme: '}</style><script>alert(1)</script>', font: 'x;color:red', line: 'url(x)', width: '1000ch;', align: '}' }, '"><img src=x>') === R.rtCss(R.RT_DEFAULT, 18));
  ok('a dark theme recolours the reading surface and its links, quiet text and lines, and a high-contrast one underlines links', R.rtCss({ theme: 'night' }, 18).includes('#14151a') && R.rtCss({ theme: 'night' }, 18).includes('.reader.card,.rtsurface{background:#14151a!important') && /\.reader a,\.rtsurface a\{color:#8fb0ff;\}/.test(R.rtCss({ theme: 'night' }, 18)) && /\.reader a,\.rtsurface a\{color:#0000c8;text-decoration:underline;\}/.test(R.rtCss({ theme: 'contrast' }, 18)));
  ok('a coloured theme also colours the paged view’s footer, running head, edge arrows, bookmark ribbon, centre rule and end card, so a light theme in a dark app leaves no pale text on a pale page', R.RT_THEMES.filter((t) => t.bg).every((t) => { const c = R.rtCss({ theme: t.id }, 18); return c.includes(`.rdpaged .pgfoot,.rdpaged .pgedge{color:${t.muted}}`) && c.includes(`.rdpaged .pgrib{color:${t.accent}}`) && c.includes(`.pgend{background:${t.bg}!important;color:${t.fg}!important`) && c.includes(`.pgview::after{background:${t.line}}`); }) && !R.rtCss({ theme: 'auto' }, 18).includes('.rdpaged'));
  ok('left alignment means the start of the line, so a right-to-left paragraph is not pushed to the wrong edge; justified is justified', R.rtCss({ align: 'left' }, 18).includes('text-align:start') && !/text-align:left/.test(R.rtCss({ align: 'left' }, 18)) && R.rtCss({ align: 'justify' }, 18).includes('text-align:justify'));
  ok('the text size reaches the style sheet, clamped', R.rtCss(R.RT_DEFAULT, 30).includes('--rt-size:30px') && R.rtCss(R.RT_DEFAULT, 400).includes('--rt-size:40px') && R.rtCss(R.RT_DEFAULT, -4).includes('--rt-size:13px'));
}
/* the reader's own bar, sheets and panels follow the theme (rtChrome): every pair of colours in them reads, in every theme */
{
  const pairs = [['text', 'bg'], ['text', 'surface'], ['text', 'surface2'], ['text2', 'surface'], ['text2', 'surface2'], ['muted', 'bg'], ['muted', 'surface'], ['muted', 'surface2'], ['accent', 'bg'], ['accent', 'surface'], ['good', 'surface'], ['warn', 'surface'], ['bad', 'surface'], ['good', 'bg'], ['warn', 'bg'], ['bad', 'bg'], ['imag', 'bg'], ['imag', 'surface']];
  ok('"match the app" has no chrome of its own (the app’s colours stay)', R.rtChrome(R.RT_THEME_BY_ID.auto) === null && R.rtChrome(undefined) === null);
  for (const t of colored) {
    const c = R.rtChrome(t); const v = c.vars; const low = pairs.filter(([a, b]) => R.rtContrast(v[a], v[b]) < 4.5).map(([a, b]) => `${a}/${b} ${R.rtContrast(v[a], v[b]).toFixed(2)}`);
    ok(`${t.id}: the bar, sheets and panels carry the theme: page, cards, text, quiet text, accent and status colours each read at 4.5:1 or more`, low.length === 0 && v.bg === t.bg && v.text === t.fg && v.accent === t.accent && c.scheme === (t.dark ? 'dark' : 'light'), low);
    ok(`${t.id}: button text reads on the accent`, R.rtContrast(v['on-accent'], v.accent) >= 4.5, R.rtContrast(v['on-accent'], v.accent));
    const css = R.rtCss(Object.assign({}, R.RT_DEFAULT, { theme: t.id }), 18);
    ok(`${t.id}: the style sheet gives the app’s colour variables to the reading screen only (body[data-reading]), and turns off the app’s tinted glow behind it`, css.includes('body[data-reading]{--bg:' + t.bg) && css.includes('--text:' + t.fg) && css.includes('body[data-reading]::before{display:none}'));
  }
  ok('the app’s own style sheet is not touched when the theme is "match the app"', !R.rtCss(R.RT_DEFAULT, 18).includes('body[data-reading]'));
}
console.log(`reading: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
