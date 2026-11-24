#!/usr/bin/env python3
"""Write offline-manifest.json next to Lamplighter.html: the files in each of the five data folders and their sizes, so the website copy can offer "Save for offline" with honest sizes.
`v` is a fingerprint of the data only (names and sizes), so a new version of the app does not make anyone download the libraries again; it changes only when a library file does.
Only plain file names (letters, digits, dot, dash, underscore) are listed; the app refuses anything else (src/js/2z-offline-core.js).
Run: python3 -I tools/make_offline_manifest.py [project folder]   (build.py runs it)"""
import hashlib, json, pathlib, re, sys, datetime

root = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else pathlib.Path(__file__).resolve().parent.parent.parent
OK = re.compile(r'^[A-Za-z0-9._-]{1,120}$')
files = {}
skipped = []
for kind in ('atlas', 'texts', 'bibles', 'similar', 'dictionary'):
    d = root / kind
    if not d.is_dir():
        continue
    rows = []
    for f in sorted(d.iterdir()):
        if not f.is_file() or f.name.startswith('.'):
            continue
        if not OK.match(f.name):
            skipped.append(f'{kind}/{f.name}'); continue
        rows.append([f'{kind}/{f.name}', f.stat().st_size])
    if rows:
        files[kind] = rows
h = hashlib.sha256()
for kind, rows in files.items():
    for name, size in rows:
        h.update(f'{name}:{size}\n'.encode())
out = {'v': h.hexdigest()[:12], 'built': datetime.date.today().isoformat(), 'files': files}
(root / 'offline-manifest.json').write_text(json.dumps(out, separators=(',', ':')) + '\n', encoding='utf8')
total = sum(s for rows in files.values() for _, s in rows)
print(f'offline-manifest.json: {sum(len(r) for r in files.values())} files, {total/1048576:.0f} MiB, data fingerprint {out["v"]}' + (f'; skipped {len(skipped)} with unsafe names: {skipped[:3]}' if skipped else ''))
