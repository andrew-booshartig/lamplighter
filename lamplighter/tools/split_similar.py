#!/usr/bin/env python3
"""Split similar/chunks.js (about 60 MB, one object) into four files, each well under 25 MiB, so the whole folder fits every free static host (Cloudflare Pages allows 25 MiB per file):
   chunks.js    the small fields (counts, tables, motif columns) and the term weights (sw)
   chunks-2.js  the passage vectors, first half (q1): rows 0 to M-1 of the passages
   chunks-3.js  the sparse term columns (sc)
   chunks-4.js  the passage vectors, second half (q2): rows M to N-1
The app merges them: BEATLAB_SIM.add("chunks", {...}) adds to what is there, and simPrepare (src/js/2w-similar-core.js) joins q1 and q2 end to end and refuses a half-loaded index. The halves are not called q on
purpose: a page built before 24 November 2026 looks for q, finds it missing and says the index is incomplete, instead of searching vectors that stop halfway.
Why four: the vectors are 64 numbers a passage, 85 bytes in base64, so one file of them passes 25 MiB at about 307,000 passages (until 24 November 2026 they were one file, chunks-2.js, and the
sparse columns sc and sw together were chunks-3.js). Cut at a row that is a multiple of 3 so that each half is whole base64 (no padding in the middle), and nothing is decoded here.
Safe to run again (it does nothing if already split). It fails, and says which file, if any file is 25 MiB or more. Run: python3 -I tools/split_similar.py [folder]"""
import json, pathlib, sys

LIMIT = 25 * 1048576
folder = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else pathlib.Path(__file__).resolve().parent.parent.parent / 'similar'
src = folder / 'chunks.js'
PREFIX = 'BEATLAB_SIM.add("chunks",'
text = src.read_text(encoding='utf8')
if not text.startswith(PREFIX):
    sys.exit('unexpected start of ' + str(src))
body = text[len(PREFIX):].rstrip()
if not body.endswith(');'):
    sys.exit('unexpected end of ' + str(src))
obj = json.loads(body[:-2])
if 'q' not in obj:
    print('already split: nothing to do'); sys.exit(0)
n = obj['n']
q = obj['q']
if len(q) % 4:
    sys.exit('the passage vectors are not whole base64')
size = len(q) // 4 * 3 - q[-2:].count('=')                  # bytes once decoded
k = size // n
if k * n != size:
    sys.exit('the passage vectors do not make %d whole rows (%d bytes)' % (n, size))
rows = (n // 2) // 3 * 3                                     # a multiple of 3 rows, so rows * k bytes is a multiple of 3 and the first half ends on a base64 boundary
cut = rows * k // 3 * 4
obj['q1'], obj['q2'] = q[:cut], q[cut:]
del obj['q']
parts = {'chunks-2.js': ['q1'], 'chunks-3.js': ['sc'], 'chunks-4.js': ['q2']}
moved = set(k2 for ks in parts.values() for k2 in ks)
for name, keys in parts.items():
    (folder / name).write_text(PREFIX + json.dumps({k2: obj[k2] for k2 in keys}, separators=(',', ':')) + ');\n', encoding='utf8')
src.write_text(PREFIX + json.dumps({k2: v for k2, v in obj.items() if k2 not in moved}, separators=(',', ':')) + ');\n', encoding='utf8')
over = []
for f in ['chunks.js'] + list(parts):
    s = (folder / f).stat().st_size
    print(f, round(s / 1048576, 1), 'MiB')
    if s >= LIMIT: over.append(f)
if over:
    sys.exit('over 25 MiB: ' + ', '.join(over) + ' (free static hosts refuse a file that size: split further)')
