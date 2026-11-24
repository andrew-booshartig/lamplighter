"""Print what built texts look like: for each id, its number of sections, characters, the longest section, its first headings and its first words. Run:  python3 -I tools/inspect_texts.py a-ada x-gil   (no ids: every text except the Bibles)."""
import json, re, sys, pathlib
T = pathlib.Path(__file__).resolve().parent.parent.parent / 'texts'
ids = sys.argv[1:] or [p.stem for p in sorted(T.glob('*.js')) if p.stem != 'index' and not re.match(r'[bn]-', p.stem)]
for i in ids:
    s = (T / (i + '.js')).read_text(encoding='utf-8'); m = re.match(r'BEATLAB_TEXTS.add\((".*?"),(\{.*?\}),(\[.*\])\);\n$', s, re.S)
    secs = json.loads(m.group(3)); sizes = [len(t) for _, t in secs]
    print('%-9s %4d secs  %8d chars  max %6d | %s | %s' % (i, len(secs), sum(sizes), max(sizes), ' / '.join(h[:34] for h, _ in secs[:3]), re.sub(r'\s+', ' ', secs[0][1][:90])))
