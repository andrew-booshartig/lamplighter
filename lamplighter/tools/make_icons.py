#!/usr/bin/env python3
"""Draw the Lamplighter Project's mark, with no libraries: plain black, thin warm-white lines, one point of light.
The picture is the Seed of Life, seven equal circles, one in the middle and six round it, each through the others' centres (sacred geometry that no one tradition owns), inside a faint ring.
The six outer centres are a ring of lit lamps; the middle one is the lamp that lights them. One set of numbers (below) draws every size, so the page's header logo, its favicon and the install icons are the same picture:
   web/icons/icon-192.png, icon-512.png, icon-maskable-512.png (full bleed), apple-touch-icon.png (180)
   web/icons/icon.svg                 the mark as an SVG (build.py puts it in the page as the favicon)
   src/js/2y-logo-core.js             the same SVG as LOGO_SVG, for the header
Run: python3 tools/make_icons.py        (about ten seconds: the PNGs are drawn pixel by pixel)"""
import math, struct, zlib, pathlib, sys

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE.parent / 'web' / 'icons'
OUT.mkdir(parents=True, exist_ok=True)

# the picture, in a 32-unit box
C = 16.0                                  # the centre
SEED_R = 5.2                              # the radius of each of the seven circles; the six outer ones are centred a radius away from the middle one
RING_R = 11.6                             # the faint ring round them
LINE = (0xee, 0xe6, 0xd2)                 # warm white: softer on the eyes than pure white
LINE_W, LINE_A = 0.48, 0.86               # the circles: thin, and a little under full strength
RING_W, RING_A = 0.32, 0.36                # the ring: thinner and fainter still
DOT_R = 0.6                               # the six lamps
GOLD, GOLD_R = (0xff, 0xd0, 0x7a), 1.05   # the lamp in the middle: the only colour in the picture
BG = (0x00, 0x00, 0x00)                   # plain black
TILE_R = 9.0                              # the tile's corner radius (the maskable icon has none)
RIM_W, RIM_A = 0.6, 0.12                  # a faint rim just inside the tile, so it shows on a dark page

hx = lambda c: '#%02x%02x%02x' % c
CENTRES = [(C, C)] + [(C + SEED_R * math.cos(-math.pi / 2 + k * math.pi / 3), C + SEED_R * math.sin(-math.pi / 2 + k * math.pi / 3)) for k in range(6)]
num = lambda v: ('%.3f' % v).rstrip('0').rstrip('.')


def svg(tile=True, extra=''):
    """The mark as an SVG with single-quoted attributes (so it can sit inside a data: address). It has no ids, so it cannot clash with anything when inlined in a page."""
    parts = ["<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%s>" % extra]
    if tile:
        parts.append("<rect width='32' height='32' rx='%s' fill='%s'/>" % (num(TILE_R), hx(BG)))
        parts.append("<rect x='%s' y='%s' width='%s' height='%s' rx='%s' fill='none' stroke='#fff' stroke-opacity='%s' stroke-width='%s'/>" % (num(RIM_W / 2), num(RIM_W / 2), num(32 - RIM_W), num(32 - RIM_W), num(TILE_R - RIM_W / 2), num(RIM_A), num(RIM_W)))
    parts.append("<circle cx='%s' cy='%s' r='%s' fill='none' stroke='%s' stroke-opacity='%s' stroke-width='%s'/>" % (num(C), num(C), num(RING_R), hx(LINE), num(RING_A), num(RING_W)))
    parts.append("<g fill='none' stroke='%s' stroke-opacity='%s' stroke-width='%s'>%s</g>" % (hx(LINE), num(LINE_A), num(LINE_W), ''.join("<circle cx='%s' cy='%s' r='%s'/>" % (num(x), num(y), num(SEED_R)) for x, y in CENTRES)))
    parts.append("<g fill='%s'>%s</g>" % (hx(LINE), ''.join("<circle cx='%s' cy='%s' r='%s'/>" % (num(x), num(y), num(DOT_R)) for x, y in CENTRES[1:])))
    parts.append("<circle cx='%s' cy='%s' r='%s' fill='%s'/>" % (num(C), num(C), num(GOLD_R), hx(GOLD)))
    parts.append('</svg>')
    return ''.join(parts)


# ── the same picture drawn pixel by pixel ──
def over(c, col, a): return (c[0] + (col[0] - c[0]) * a, c[1] + (col[1] - c[1]) * a, c[2] + (col[2] - c[2]) * a)


def shade(x, y, maskable=False):
    """the colour at a point of the 32-unit box, or None outside the tile"""
    if not maskable:
        cx = min(max(x, TILE_R), 32 - TILE_R); cy = min(max(y, TILE_R), 32 - TILE_R)
        if math.hypot(x - cx, y - cy) > TILE_R + 1e-9: return None
    c = BG
    if not maskable:                                              # the rim: how far inside the tile's edge this point is
        qx = abs(x - C) - (16 - TILE_R); qy = abs(y - C) - (16 - TILE_R)
        if -(math.hypot(max(qx, 0), max(qy, 0)) + min(max(qx, qy), 0) - TILE_R) <= RIM_W: c = over(c, (255, 255, 255), RIM_A)
    if abs(math.hypot(x - C, y - C) - RING_R) <= RING_W / 2: c = over(c, LINE, RING_A)
    for px, py in CENTRES:
        if abs(math.hypot(x - px, y - py) - SEED_R) <= LINE_W / 2: c = over(c, LINE, LINE_A)
    for px, py in CENTRES[1:]:
        if math.hypot(x - px, y - py) <= DOT_R: c = LINE
    if math.hypot(x - C, y - C) <= GOLD_R: c = GOLD
    return c


def render(size, maskable=False, ss=3):
    scale = size / 32.0
    rows = []
    for j in range(size):
        row = bytearray()
        for i in range(size):
            r = g = b = hit = 0
            for sj in range(ss):
                for si in range(ss):
                    x = (i + (si + .5) / ss) / scale; y = (j + (sj + .5) / ss) / scale
                    c = shade(x, y, maskable)
                    if c is None: continue
                    r += c[0]; g += c[1]; b += c[2]; hit += 1
            row += bytes((int(r / hit), int(g / hit), int(b / hit), int(255 * hit / (ss * ss)))) if hit else b'\x00\x00\x00\x00'
        rows.append(bytes(row))
    return rows


def png(path, size, maskable=False):
    rows = render(size, maskable, 3 if size < 400 else 4)
    raw = b''.join(b'\x00' + r for r in rows)
    def chunk(t, d): c = struct.pack('>I', len(d)) + t + d; return c + struct.pack('>I', zlib.crc32(t + d) & 0xffffffff)
    data = b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', size, size, 8, 6, 0, 0, 0)) + chunk(b'IDAT', zlib.compress(raw, 9)) + chunk(b'IEND', b'')
    path.write_bytes(data); print('wrote', path.name, len(data), 'bytes', flush=True)


if __name__ == '__main__':
    (OUT / 'icon.svg').write_text(svg() + '\n', encoding='utf8'); print('wrote icon.svg')
    (HERE.parent / 'src' / 'js' / '2y-logo-core.js').write_text(
        "/* ═══════════════════════════ The mark ═══════════════════════════\n"
        "   The Seed of Life, plain black with thin warm-white lines and one point of light: a ring of lamps round a lamp. Written by tools/make_icons.py (do not edit by hand):\n"
        "   it draws the install icons and the favicon from the same numbers. Used by the header (50-core.js). It has no ids, so it cannot clash with anything in the page. ── */\n"
        "const LOGO_SVG = `" + svg(True, " aria-hidden='true' focusable='false'") + "`;\n"
        "if (typeof module !== 'undefined' && module.exports) module.exports = { LOGO_SVG };\n", encoding='utf8'); print('wrote src/js/2y-logo-core.js')
    if '--svg-only' in sys.argv: sys.exit(0)
    png(OUT / 'icon-192.png', 192); png(OUT / 'icon-512.png', 512); png(OUT / 'icon-maskable-512.png', 512, True); png(OUT / 'apple-touch-icon.png', 180)
