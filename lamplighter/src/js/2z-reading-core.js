/* ═══════════════════════════ 2z · Reading settings: themes and type ═══════════════════════════
   How the reading surface looks: the colours (a theme), the type (face, size, spacing, width, alignment) and the verse numbers. Pure data and functions: the choices a person
   can make are a short fixed list each, anything else is refused, and the style sheet is built only from those lists, so no setting can carry markup or stray CSS into the page.
   Every theme is held to contrast limits (text on its background at least 4.5:1, the quiet text and links too, and text over each highlight colour), checked by tests/reading.test.js.
   The theme "Match the app" leaves colours alone; the others colour the reading surface only (the text and the cards it sits in), never the rest of the app. */
const RT_THEMES = [
  // id, name, background, text, quiet text (verse numbers, notes), links and accents, line, dark
  { id: 'auto', name: 'Match the app' },
  { id: 'paper', name: 'Paper', bg: '#fbf8f1', fg: '#231f1a', muted: '#5b5348', accent: '#2a4cc4', line: '#ddd5c3', dark: false },
  { id: 'sepia', name: 'Sepia', bg: '#f4ecd8', fg: '#3a2e1f', muted: '#66553d', accent: '#8a3f00', line: '#d9ccaa', dark: false },
  { id: 'grey', name: 'Grey', bg: '#e8e8e4', fg: '#1b1b19', muted: '#505049', accent: '#1d46b0', line: '#c9c9c1', dark: false },
  { id: 'dusk', name: 'Dusk', bg: '#262a38', fg: '#dde0ec', muted: '#a6adc4', accent: '#a3b8ff', line: '#3b4157', dark: true },
  { id: 'night', name: 'Night', bg: '#14151a', fg: '#d0d3db', muted: '#9ca1b0', accent: '#8fb0ff', line: '#2a2c35', dark: true },
  { id: 'black', name: 'Black', bg: '#000000', fg: '#c8c8c8', muted: '#999999', accent: '#8ab4ff', line: '#262626', dark: true },
  { id: 'contrast', name: 'High contrast', bg: '#ffffff', fg: '#000000', muted: '#333333', accent: '#0000c8', line: '#000000', dark: false, strong: true },
  { id: 'contrast-dark', name: 'High contrast, dark', bg: '#000000', fg: '#ffffff', muted: '#e6e6e6', accent: '#ffd84a', line: '#ffffff', dark: true, strong: true },
];
const RT_THEME_BY_ID = Object.fromEntries(RT_THEMES.map((t) => [t.id, t]));
const RT_FONTS = [
  { id: 'book', name: 'Book', css: 'Georgia, "Iowan Old Style", "Palatino Linotype", Palatino, serif' },
  { id: 'modern', name: 'Modern serif', css: 'Charter, "Bitstream Charter", "Sitka Text", Cambria, Georgia, serif' },
  { id: 'sans', name: 'Sans', css: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' },
  { id: 'clear', name: 'Clear', css: '"Atkinson Hyperlegible", Verdana, Tahoma, "Trebuchet MS", sans-serif' },
];
const RT_LINE = { tight: ['Tight', 1.5], normal: ['Normal', 1.8], airy: ['Airy', 2.1] };
const RT_WIDTH = { narrow: ['Narrow', '58ch'], medium: ['Medium', '74ch'], wide: ['Wide', '98ch'] };
const RT_ALIGN = { left: 'Left', justify: 'Justified' };
const RT_VERSES = { show: 'Show', quiet: 'Quiet', hide: 'Hide' };
const RT_SPACE = { normal: ['Normal', '0', '0'], wide: ['Wide', '0.035em', '0.12em'] };
const RT_HELP = { first: 'First mention', every: 'Every mention', off: 'Off' };      // Word help: underline the names and terms the glossary can explain, once a section or every time, or not at all (6zw-words.js)
const RT_SIZE = { min: 13, max: 40, def: 18, step: 2 };      // step: what one press of A− or A+ changes (one pixel was too little to notice; the slider still moves by one, AA-04 of ALPHA_AUDIT.md)
const RT_DEFAULT = { theme: 'auto', font: 'book', line: 'normal', width: 'medium', align: 'left', verses: 'show', space: 'normal', help: 'first' };
/* "Easy reading": the settings usually suggested for people who find reading tiring or hard (a clear sans-serif, generous line and letter spacing, left-aligned text, a soft
   background and a narrower column). It is a starting point, not a cure: what helps varies from person to person, so every setting can still be changed. */
const RT_EASY = { theme: 'paper', font: 'clear', line: 'airy', width: 'narrow', align: 'left', verses: 'quiet', space: 'wide', help: 'first' };      // Word help is not a look: Easy reading leaves the reader's own choice alone (see the panel)
const RT_SIZE_EASY = 20;
const rtOwn = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
/* anything not on the lists is dropped; the rest of the object is ignored */
function rtClean(p) {
  const o = Object.assign({}, RT_DEFAULT); if (!p || typeof p !== 'object') return o;
  if (typeof p.theme === 'string' && rtOwn(RT_THEME_BY_ID, p.theme)) o.theme = p.theme;
  if (typeof p.font === 'string' && RT_FONTS.some((f) => f.id === p.font)) o.font = p.font;
  if (typeof p.line === 'string' && rtOwn(RT_LINE, p.line)) o.line = p.line;
  if (typeof p.width === 'string' && rtOwn(RT_WIDTH, p.width)) o.width = p.width;
  if (typeof p.align === 'string' && rtOwn(RT_ALIGN, p.align)) o.align = p.align;
  if (typeof p.verses === 'string' && rtOwn(RT_VERSES, p.verses)) o.verses = p.verses;
  if (typeof p.space === 'string' && rtOwn(RT_SPACE, p.space)) o.space = p.space;
  if (typeof p.help === 'string' && rtOwn(RT_HELP, p.help)) o.help = p.help;
  return o;
}
const rtSize = (v) => { const n = Math.round(+v); return Number.isFinite(n) ? Math.min(RT_SIZE.max, Math.max(RT_SIZE.min, n)) : RT_SIZE.def; };
/* one press of A− (dir below 0) or A+: RT_SIZE.step pixels from where it is, kept inside the range */
const rtSizeStep = (cur, dir) => rtSize(rtSize(cur) + (dir < 0 ? -1 : 1) * RT_SIZE.step);
/* WCAG contrast: relative luminance of a colour and the ratio between two */
const rtRgb = (hex) => { const m = /^#([0-9a-f]{6})$/i.exec(hex); const n = m ? parseInt(m[1], 16) : 0; return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const rtLum = (rgb) => { const f = (c) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(rgb[0]) + 0.7152 * f(rgb[1]) + 0.0722 * f(rgb[2]); };
const rtContrast = (a, b) => { const x = rtLum(typeof a === 'string' ? rtRgb(a) : a); const y = rtLum(typeof b === 'string' ? rtRgb(b) : b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
/* a translucent colour [r, g, b, alpha] laid over an opaque one */
const rtOver = (c, bg) => { const b = typeof bg === 'string' ? rtRgb(bg) : bg; return [0, 1, 2].map((i) => Math.round(c[i] * c[3] + b[i] * (1 - c[3]))); };
/* colours mixed toward each other, as hex: the reader's own bar, sheets and panels are drawn from the app's colour variables, so a theme is carried over to them by giving those variables the theme's colours */
const rtHex = (rgb) => '#' + rgb.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
const rtMix = (a, b, t) => { const x = rtRgb(a); const y = rtRgb(b); return rtHex([0, 1, 2].map((i) => x[i] + (y[i] - x[i]) * t)); };
/* the app's colour variables for a reading theme (null for "match the app"): page, cards, lines, text, quiet text and the accent, and a button text that reads on the accent. A light theme gets the light app's status colours, a dark one the dark's. */
function rtChrome(th) {
  if (!th || !th.bg) return null;
  const dark = !!th.dark; const strong = !!th.strong; const rgbs = (hex, a) => `rgba(${rtRgb(hex).join(',')},${a})`;
  const surface = strong ? th.bg : dark ? rtMix(th.bg, '#ffffff', 0.055) : rtMix(th.bg, '#ffffff', 0.55);
  const surface2 = strong ? th.bg : dark ? rtMix(th.bg, '#ffffff', 0.09) : rtMix(th.bg, th.fg, 0.06);
  const t = {
    bg: th.bg, bg2: rtMix(th.bg, th.fg, 0.05), surface, surface2,
    card: rgbs(th.fg, strong ? 0 : 0.05), 'card-h': rgbs(th.fg, strong ? 0.12 : 0.09),
    line: th.line, line2: strong ? th.fg : rtMix(th.line, th.fg, 0.4),
    text: th.fg, text2: strong ? th.fg : rtMix(th.fg, th.bg, 0.2), muted: th.muted,
    accent: th.accent, accent2: th.accent, 'on-accent': rtContrast('#ffffff', th.accent) >= rtContrast('#000000', th.accent) ? '#ffffff' : '#000000',
    imag: dark ? '#c7a8ff' : '#6b3fb5', left: dark ? '#4cc3ff' : '#1496de', right: dark ? '#ffb454' : '#b86a00', both: dark ? '#b794ff' : '#7a4fdf',
    good: dark ? '#3fd9a0' : '#086a4a', warn: dark ? '#ffc65a' : '#8a5e00', bad: dark ? '#ff8da1' : '#c42a45',
    glow: rgbs(th.accent, 0.2), shadow: dark ? '0 12px 44px rgba(0,0,0,.5)' : '0 10px 34px rgba(60,44,20,.16)',
  };
  return { vars: t, scheme: dark ? 'dark' : 'light' };
}
/* the five highlight colours, as the reader draws them (the same values as .hl-* in app.css) */
const RT_HL = { gold: [255, 198, 90, 0.34], green: [63, 217, 160, 0.30], blue: [76, 195, 255, 0.30], rose: [255, 111, 134, 0.30], violet: [183, 148, 255, 0.34] };

/* the style sheet for these settings. size: the text size in pixels (kept as reader.size). Built from the lists above only. */
function rtCss(prefs, size) {
  const p = rtClean(prefs); const sz = rtSize(size); const font = RT_FONTS.find((f) => f.id === p.font); const th = RT_THEME_BY_ID[p.theme]; const sp = RT_SPACE[p.space];
  const css = [];
  css.push(`:root{--rt-size:${sz}px}`);
  css.push(`.reader,.rtsurface{font-family:${font.css};line-height:${RT_LINE[p.line][1]};letter-spacing:${sp[1]};word-spacing:${sp[2]}}`);
  css.push(`.reader{max-width:${RT_WIDTH[p.width][1]};text-align:${p.align === 'left' ? 'start' : p.align}${p.align === 'justify' ? ';hyphens:auto;-webkit-hyphens:auto' : ''}}`);
  css.push(`.reader p,.bbcell,.bbp{text-align:${p.align === 'left' ? 'start' : p.align}${p.align === 'justify' ? ';hyphens:auto;-webkit-hyphens:auto' : ''}}`);
  if (p.verses === 'hide') css.push('.reader .vn,.rtsurface .vn{display:none}');
  else if (p.verses === 'quiet') css.push('.reader .vn,.rtsurface .vn{opacity:.62;font-weight:500}');
  if (th && th.bg) {
    const strong = th.strong ? 'text-decoration:underline;' : '';
    css.push(`.reader.card,.rtsurface{background:${th.bg}!important;color:${th.fg}!important;border-color:${th.line}!important;box-shadow:none!important}`);
    css.push(`.reader,.rtsurface,.reader h2,.reader h3,.reader h4,.rtsurface h2,.rtsurface h3,.rtsurface h4,.reader .rtitle,.rtsurface b,.rtsurface .bbcell{color:${th.fg}}`);
    css.push(`.reader a,.rtsurface a{color:${th.accent};${strong}}`);
    css.push(`.reader .vn,.rtsurface .vn,.reader .rh,.rtsurface .rh,.reader .muted,.rtsurface .muted,.rtsurface .t2,.rtsurface .hint,.rtsurface .small.t2,.rtsurface .bbv,.rtsurface .bbo,.rtsurface .bbnum,.rtsurface .eyebrow{color:${th.muted}!important}`);
    css.push(`.rtsurface .bbrow,.rtsurface .bbone,.rtsurface .bbcol,.rtsurface hr{border-color:${th.line}!important}.rtsurface .bbrow.bbhead{background:${th.bg}!important}`);
    css.push(`.rtsurface .btn.ghost,.rtsurface .bbnum{color:${th.muted};border-color:${th.line}}.rtsurface .btn.ghost:hover,.rtsurface .bbnum:hover{color:${th.fg}}`);
    css.push(`.reader .pbm{color:${th.muted}}`);
    css.push(`.reader .gt,.rtsurface .gt{text-decoration-color:${th.accent}}.reader .gt:hover,.reader .gt:focus-visible,.reader .gt[aria-expanded="true"],.rtsurface .gt:hover,.rtsurface .gt:focus-visible{background:rgba(${rtRgb(th.accent).join(',')},.18)}`);
    const ch = rtChrome(th);
    css.push(`body[data-reading]{${Object.entries(ch.vars).map(([k, v]) => `--${k}:${v}`).join(';')};color-scheme:${ch.scheme}}body[data-reading]::before{display:none}`);
    css.push(`.rdpaged .pgrun,.rdpaged .pgfoot,.rdpaged .pgedge{color:${th.muted}}.rdpaged .pgrib{color:${th.accent}}.rdpaged[data-spread="2"] .pgview::after{background:${th.line}}.rdpaged .pgend{background:${th.bg}!important;color:${th.fg}!important;border-color:${th.line}!important}`);
  }
  return css.join('\n');
}
if (typeof module !== 'undefined' && module.exports) module.exports = { RT_THEMES, RT_THEME_BY_ID, RT_FONTS, RT_LINE, RT_WIDTH, RT_ALIGN, RT_VERSES, RT_SPACE, RT_HELP, RT_SIZE, RT_DEFAULT, RT_EASY, RT_SIZE_EASY, RT_HL, rtClean, rtSize, rtSizeStep, rtCss, rtContrast, rtLum, rtRgb, rtOver, rtHex, rtMix, rtChrome };
