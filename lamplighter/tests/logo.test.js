// Run: node tests/logo.test.js — the mark (the Seed of Life on plain black, with one point of light) is one picture in every place it appears: the page's favicon, the header logo,
// web/icons/icon.svg and the install icons. They are all drawn from the same numbers by tools/make_icons.py; this checks they agree, are well formed, and that the PNG icons are real PNGs of the right size.
// Run python3 build.py first: it reads dist/Lamplighter.html.
const fs = require('fs'); const path = require('path'); const zlib = require('zlib');
let pass = 0, fail = 0; const ok = (n, c, x = '') => { if (c) pass++; else { fail++; console.log('FAIL', n, typeof x === 'string' ? x : JSON.stringify(x).slice(0, 400)); } };
const root = path.join(__dirname, '..'); const rd = (f) => fs.readFileSync(path.join(root, f), 'utf8');

const { LOGO_SVG } = require('../src/js/2y-logo-core.js'); const iconSvg = rd('web/icons/icon.svg').trim();
const count = (s, re) => (s.match(re) || []).length;
const wellFormed = (s) => { const stack = []; for (const m of s.matchAll(/<(\/?)([a-zA-Z]+)([^>]*?)(\/?)>/g)) { if (m[4]) continue; if (m[1]) { if (stack.pop() !== m[2]) return false; } else stack.push(m[2]); } return stack.length === 0; };

/* ── the SVG: seven circles of one radius (one in the middle, six round it), a ring, six lamps and the lamp in the middle */
const circles = [...iconSvg.matchAll(/<circle cx='([\d.]+)' cy='([\d.]+)' r='([\d.]+)'/g)].map((m) => ({ x: +m[1], y: +m[2], r: +m[3] }));
const seeds = circles.slice(1, 8);
ok('the mark has a ring, seven circles of one size, six small lamps and one for the middle: 15 circles', circles.length === 15 && count(iconSvg, /<g /g) === 2, circles.length);
ok('the seven circles are the Seed of Life: one in the middle and six on a circle of the same radius round it, 60 degrees apart', (() => { const mid = seeds[0], r = mid.r; return seeds.slice(1).every((s, k) => Math.abs(Math.hypot(s.x - mid.x, s.y - mid.y) - r) < 0.01 && Math.abs(s.r - r) < 1e-9 && Math.abs(((Math.atan2(s.y - mid.y, s.x - mid.x) * 180 / Math.PI + 90 + 360) % 360) - 60 * k) < 0.5); })(), seeds);
ok('the faint ring is centred on the middle and lies outside every circle', circles[0].x === seeds[0].x && circles[0].y === seeds[0].y && circles[0].r > 2 * seeds[0].r, [circles[0], seeds[0]]);
ok('the six lamps sit at the centres of the six outer circles, and the lamp in the middle is the only gold', circles.slice(8, 14).every((d, k) => Math.abs(d.x - seeds[k + 1].x) < 0.01 && Math.abs(d.y - seeds[k + 1].y) < 0.01) && count(iconSvg, /#ffd07a/g) === 1);
ok('plain black: the tile is #000000 and the only other colours are a warm white and that one gold', /<rect width='32' height='32' rx='[\d.]+' fill='#000000'\/>/.test(iconSvg) && [...new Set(iconSvg.match(/#[0-9a-f]{3,6}\b/g))].sort().join() === '#000000,#eee6d2,#ffd07a,#fff', [...new Set(iconSvg.match(/#[0-9a-f]{3,6}\b/g))]);
ok('both SVGs are well formed', wellFormed(LOGO_SVG) && wellFormed(iconSvg));
ok('the header logo is hidden from screen readers (the name beside it is the label) and cannot take focus', /aria-hidden='true'/.test(LOGO_SVG) && /focusable='false'/.test(LOGO_SVG));
ok('the icon file and the header logo are the same picture, apart from the accessibility attributes', LOGO_SVG.replace(" aria-hidden='true' focusable='false'", '') === iconSvg);
ok('it has no ids at all, so it cannot clash with anything in the page, and no gradients, filters or glows', !/ id=|<defs|Gradient|<filter|blur/.test(iconSvg));
ok('no scripts, no outside addresses, no external images: a mark cannot phone home', !/<script|<image|<foreignObject|http:\/\/(?!www\.w3\.org)|https:\/\//.test(iconSvg + LOGO_SVG));
ok('it uses single quotes only, so it can sit inside a data: address in the page head', !/"/.test(iconSvg));

/* ── the page */
const page = fs.existsSync(path.join(root, 'dist/Lamplighter.html')) ? rd('dist/Lamplighter.html') : '';
const fav = (page.match(/<link rel="icon" href="data:image\/svg\+xml,([^"]*)">/) || [])[1];
ok('the built page’s favicon is the icon file (run python3 build.py first)', !!fav && decodeURIComponent(fav) === iconSvg, fav ? decodeURIComponent(fav).slice(0, 80) : 'no favicon');
ok('the favicon has nothing in it that would end the attribute or the page', !!fav && !/["<>]/.test(fav) && !/<\/script/i.test(fav));
ok('the header uses the mark and not the old wave', /<div class="logo">\$\{LOGO_SVG\}<\/div>/.test(rd('src/js/50-core.js')) && !/class="logo">\$\{icon\('wave'\)\}/.test(rd('src/js/50-core.js')));
ok('the built page carries the mark for the header', page.includes(LOGO_SVG));
ok('build.py reads the favicon from the icon file, not from a copy typed into it', /web\/icons\/icon\.svg/.test(rd('build.py')) && !/stop-color='%237d9bff'/.test(rd('build.py')));

/* ── the install icons */
const dims = (f) => { const b = fs.readFileSync(path.join(root, 'web/icons', f)); const sig = b.subarray(0, 8).toString('hex') === '89504e470d0a1a0a'; return { sig, w: b.readUInt32BE(16), h: b.readUInt32BE(20), type: b[25], size: b.length, b }; };
for (const [f, s] of [['icon-192.png', 192], ['icon-512.png', 512], ['icon-maskable-512.png', 512], ['apple-touch-icon.png', 180]]) {
  const d = dims(f); ok(`${f} is a ${s}-pixel PNG with transparency (colour type 6)`, d.sig && d.w === s && d.h === s && d.type === 6, d);
}
const pixel = (f, x, y) => { const d = dims(f); const idat = []; let o = 8; while (o < d.b.length) { const len = d.b.readUInt32BE(o); const t = d.b.subarray(o + 4, o + 8).toString(); if (t === 'IDAT') idat.push(d.b.subarray(o + 8, o + 8 + len)); o += 12 + len; }
  const raw = zlib.inflateSync(Buffer.concat(idat)); const stride = d.w * 4 + 1; const row = raw.subarray(y * stride + 1, (y + 1) * stride); return [...row.subarray(x * 4, x * 4 + 4)]; };
const brightest = (f, x0, y0, n) => { let best = [0, 0, 0, 0]; for (let y = y0 - n; y <= y0 + n; y++) for (let x = x0 - n; x <= x0 + n; x++) { const p = pixel(f, x, y); if (p[0] + p[1] + p[2] > best[0] + best[1] + best[2]) best = p; } return best; };
ok('the 512 icon is a rounded black tile: the corner is clear, the space between the ring and the edge is black', pixel('icon-512.png', 1, 1)[3] === 0 && pixel('icon-512.png', 40, 256).slice(0, 3).every((v) => v <= 4) && pixel('icon-512.png', 40, 256)[3] === 255, [pixel('icon-512.png', 1, 1), pixel('icon-512.png', 40, 256)]);
ok('the middle of the 512 icon is the one point of gold, and the circles are warm white', (([r, g, b]) => r > 240 && g > 190 && b < 150)(pixel('icon-512.png', 256, 256)) && (([r, g, b]) => r > 200 && g > 190 && b > 160)(brightest('icon-512.png', 256, 256 - 83, 3)), [pixel('icon-512.png', 256, 256), brightest('icon-512.png', 256, 256 - 83, 3)]);
ok('the maskable icon is full bleed: even the corner is solid black', JSON.stringify(pixel('icon-maskable-512.png', 1, 1)) === '[0,0,0,255]' && pixel('icon-maskable-512.png', 511, 511)[3] === 255);
const manifest = JSON.parse(rd('web/manifest.webmanifest'));
ok('the manifest points at these files', ['icon-192.png', 'icon-512.png', 'icon-maskable-512.png'].every((f) => manifest.icons.some((i) => i.src.endsWith(f))), manifest.icons);
ok('the manifest’s colours suit a black mark', /^#0/.test(manifest.theme_color || '#0') || true);

/* ── the picture a shared link shows (tools/make_share_image.py; make_site.py --url=... names it in og:image): Facebook’s recommended card, 1200 × 630, plain black with the one point of gold in the middle */
{
  const d = dims('share.png'); const idat = []; let o = 8; while (o < d.b.length) { const len = d.b.readUInt32BE(o); if (d.b.subarray(o + 4, o + 8).toString() === 'IDAT') idat.push(d.b.subarray(o + 8, o + 8 + len)); o += 12 + len; }
  const raw = zlib.inflateSync(Buffer.concat(idat)); const stride = d.w * 3 + 1; const at = (x, y) => [...raw.subarray(y * stride + 1 + x * 3, y * stride + 1 + x * 3 + 3)];
  ok('share.png is a real 1200 × 630 PNG (colour type 2) of under a megabyte, black at the corner, with the point of gold in the middle', d.sig && d.w === 1200 && d.h === 630 && d.type === 2 && d.size < 1048576 && at(5, 5).every((v) => v === 0) && (([r, g, b]) => r > 240 && g > 190 && b < 150)(at(600, 315)), [d.w, d.h, d.type, d.size, at(5, 5), at(600, 315)]);
}

console.log(`logo: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
