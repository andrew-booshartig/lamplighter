#!/usr/bin/env python3
"""Make a torrent and a magnet link for a release folder, so the Lamplighter Project can be passed from person to person with no website. Nothing is uploaded or announced: this only writes two small files.
Run it after tools/make_release.py:   python3 -I tools/make_torrent.py [options]
It takes every zip of the current release (the stamp in Lamplighter.html), SHA256SUMS.txt and PASS IT ON.html from <project>/release/ and writes
   Lamplighter-<stamp>.torrent       one torrent for the whole release; a client can choose which of the files to download
   Lamplighter-<stamp>.magnet.txt    the same torrent as one line of text, to send in a message
beside them. Each file is first checked against SHA256SUMS.txt, so a damaged or out-of-date zip is caught before anyone is told to share it.
How people get the files: anyone who opens the .torrent (or pastes the magnet link) in a torrent program (Transmission, qBittorrent, Deluge and others) and has the files, or finds someone who does, shares them.
With no tracker, a client uses the DHT (its own peer finding), which most clients have on. Options:
   --out=FOLDER          the release folder (default <project>/release)
   --stamp=2026-11-16-3fa9c1   the release to use (default: the stamp in Lamplighter.html)
   --tracker=URL         a tracker to announce to (repeat for more); none is chosen for you
   --webseed=URL         an ordinary web address that also serves the files, as one more source (repeat for more). It must be a folder whose name is the torrent's name:
                         URL/Lamplighter-<stamp>/<each file>. A host that serves the release folder's files under that name will do.
   --piece-kib=N         the size of a piece in KiB (default 1024; 4096 above 2 GiB)
Re-run it after anything in the release folder changes: the torrent describes those exact bytes."""
import pathlib, re, sys

here = pathlib.Path(__file__).resolve().parent
src = here.parent
sys.path.insert(0, str(here))
import kit_lib, stamp_lib


def opts(name):
    return [a[len(name) + 3:] for a in sys.argv[1:] if a.startswith('--' + name + '=')]


def main():
    if any(a in ('-h', '--help') for a in sys.argv[1:]): print(__doc__); return 0
    top = pathlib.Path(opts('top')[0]) if opts('top') else src.parent          # --top is for tests
    out = pathlib.Path(opts('out')[0]) if opts('out') else top / 'release'
    stamp = opts('stamp')[0] if opts('stamp') else (stamp_lib.read_baked(top / 'Lamplighter.html') or {}).get('stamp')
    if not stamp: print('Lamplighter.html carries no release stamp: run python3 build.py, then tools/make_release.py, or pass --stamp=', file=sys.stderr); return 2
    if not re.fullmatch(r'\d{4}-\d\d-\d\d-[0-9a-f]{6}', stamp): print(f'"{stamp}" is not a stamp like 2026-11-16-3fa9c1', file=sys.stderr); return 2
    zips = sorted(p.name for p in out.glob('*.zip') if stamp_lib.split_name(p.name)[1] == stamp)
    if not zips: print(f'no zips of release {stamp} in {out}: run python3 -I tools/make_release.py first', file=sys.stderr); return 2
    files = zips + [f for f in ('SHA256SUMS.txt', 'PASS IT ON.html') if (out / f).exists()]
    pl = int(opts('piece-kib')[0]) * 1024 if opts('piece-kib') else None
    name = f'Lamplighter-{stamp}'
    data, ih, magnet, sums = kit_lib.make_torrent(out, files, name, stamp[:10], opts('tracker'), opts('webseed'), pl,
                                                  f'The Lamplighter Project release {stamp}: a free offline library of the world\'s religious writing. Check the zips against SHA256SUMS.txt.')
    listed = {}
    if (out / 'SHA256SUMS.txt').exists():
        for line in (out / 'SHA256SUMS.txt').read_text().splitlines():
            if '  ' in line and not line.startswith('#'): h, n = line.split('  ', 1); listed[n] = h
    bad = [z for z in zips if listed.get(z) != sums[z]]
    if bad:
        print('not made: these zips are not what SHA256SUMS.txt says (damaged, or the list is out of date; run tools/make_release.py again): ' + ', '.join(bad), file=sys.stderr); return 1
    (out / f'{name}.torrent').write_bytes(data); (out / f'{name}.magnet.txt').write_text(magnet + '\n', encoding='utf8')
    total = sum((out / f).stat().st_size for f in files)
    print(f'{name}.torrent: {len(files)} files, {total / 1048576:.0f} MiB, info-hash {ih}')
    print(f'{name}.magnet.txt: {magnet[:100]}{"…" if len(magnet) > 100 else ""}')
    for f in files: print('  ', f)
    print('Open the .torrent in a torrent program that has these files in the folder it is told to use ("seeding"); others can then download from you. Nothing was uploaded.')
    return 0


sys.exit(main())
