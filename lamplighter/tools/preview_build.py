#!/usr/bin/env python3
"""A private build of the app for previewing a change: the same bundling as build.py, but it writes only the file named on the command line.
It never writes dist/, Lamplighter.html, sw.js, the manifest or the offline manifest, so it can run while another session is building or rewriting the library.

    python3 -I tools/preview_build.py /path/to/scratch/site/index.html

Then clone the data folders beside it and serve it (see WORKFLOW.md, "Previewing a change"). LAMP_ROOT=<folder> builds from another copy of the sources instead."""
import os, pathlib, sys

ROOT = pathlib.Path(os.environ.get('LAMP_ROOT') or pathlib.Path(__file__).resolve().parent.parent)
if len(sys.argv) < 2: sys.exit(__doc__)
src = (ROOT / 'build.py').read_text()
src = src.replace('root = pathlib.Path(__file__).parent', 'root = pathlib.Path(%r)' % str(ROOT))
cut = src.index('out = root / "dist/Lamplighter.html"')
out = pathlib.Path(sys.argv[1]); out.parent.mkdir(parents=True, exist_ok=True)
src = src[:cut] + 'OUT.write_text(html)\nprint("preview build", len(html) // 1024, "KB", "release stamp", release["stamp"])\n'
stamp_file = ROOT / 'tools' / 'release_stamp.json'          # the stamp code records its state here when the sources changed; a preview must leave it as it found it
before = stamp_file.read_bytes() if stamp_file.exists() else None
try:
    exec(compile(src, 'build_preview', 'exec'), {'OUT': out, '__file__': str(ROOT / 'build.py')})
finally:
    if before is None: stamp_file.unlink(missing_ok=True)
    elif not stamp_file.exists() or stamp_file.read_bytes() != before: stamp_file.write_bytes(before)
