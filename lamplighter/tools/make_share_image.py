#!/usr/bin/env python3
"""Draw the picture that a link to the website shows when it is shared (Facebook, Messenger, WhatsApp, iMessage, X): the mark on plain black, 1200 x 630 pixels
(the size Facebook recommends: a wider-than-tall card, 1.91 to 1), with no libraries, from the same numbers as tools/make_icons.py, so the card, the icons and the
page's header logo are one picture. There is no text in it: the title and the description sit beside it in the preview (tools/make_site.py --url=... writes them).
Writes web/icons/share.png (build.py puts icons/ beside Lamplighter.html and make_site.py puts it in the website; the app itself never loads it).
Run: python3 -I tools/make_share_image.py        (about half a minute: the picture is drawn pixel by pixel)"""
import pathlib, struct, sys, zlib

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import make_icons as MI                       # the numbers and the shading of the mark; importing it writes nothing

W, H = 1200, 630                              # the card
BOX = 640.0                                   # the mark's 32-unit box in pixels (20 pixels to a unit): the ring just clears the top and the bottom of the card
OX, OY = (W - BOX) / 2, (H - BOX) / 2         # the box is centred, so the mark is centred; a feed that crops the card to a square still shows all of it
SS = 3                                        # 3 x 3 samples a pixel, as the smaller icons
REACH = 12.5                                  # the mark reaches 11.8 units from its centre: outside this the card is plain black


def render():
    scale = BOX / 32.0
    rows = []
    for j in range(H):
        row = bytearray()
        for i in range(W):
            u = (i + .5 - OX) / scale; v = (j + .5 - OY) / scale
            if abs(u - MI.C) > REACH or abs(v - MI.C) > REACH:
                row += b'\x00\x00\x00'; continue
            r = g = b = 0
            for sj in range(SS):
                for si in range(SS):
                    x = (i + (si + .5) / SS - OX) / scale; y = (j + (sj + .5) / SS - OY) / scale
                    c = MI.shade(x, y, True)          # maskable: no tile and no rim, so the mark sits straight on the black
                    r += c[0]; g += c[1]; b += c[2]
            n = SS * SS
            row += bytes((int(r / n + .5), int(g / n + .5), int(b / n + .5)))
        rows.append(bytes(row))
    return rows


def png(path):
    raw = b''.join(b'\x00' + r for r in render())
    def chunk(t, d): c = struct.pack('>I', len(d)) + t + d; return c + struct.pack('>I', zlib.crc32(t + d) & 0xffffffff)
    data = b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', W, H, 8, 2, 0, 0, 0)) + chunk(b'IDAT', zlib.compress(raw, 9)) + chunk(b'IEND', b'')
    path.write_bytes(data); print('wrote', path.name, W, 'x', H, len(data), 'bytes', flush=True)


if __name__ == '__main__':
    png(HERE.parent / 'web' / 'icons' / 'share.png')
