"""The release stamp: what lets two people with a copy of the Lamplighter Project tell whether they have the same thing.
A stamp is a date and a six-character code, such as 2026-11-16-3fa9c1. The code is worked out from every file of the app (the source that build.py joins into Lamplighter.html) and
every file of the library beside it (atlas, texts, bibles, similar, dictionary): change a letter in any of them and the code changes. The date is the day the code last changed, so
building again on another day without changing anything gives the same stamp, and the same stamp means the same release (a copy may still leave optional packs out). It is baked into Lamplighter.html (APP.version and APP.release,
shown in Setup and under Freedom → Take it with you), named in every release zip, and listed in SHA256SUMS.txt.
Nothing here goes online. Run it alone to see the stamp the files would get now:   python3 -I tools/stamp_lib.py [--top=PROJECT FOLDER]"""
import datetime, hashlib, json, pathlib, re, sys

DATA_DIRS = ('atlas', 'texts', 'bibles', 'similar', 'dictionary')      # the folders that ship beside Lamplighter.html (the same list make_release.py and make_site.py use)
PLACEHOLDERS = ("version: 'unstamped'", 'release: null')                 # in src/js/00-util.js; build.py replaces both


def file_sha256(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for block in iter(lambda: f.read(1 << 20), b''): h.update(block)
    return h.hexdigest()


def data_hash(top):
    """one fingerprint for every library file (its folder, name, size and contents); files whose names start with a dot do not ship and do not count"""
    h = hashlib.sha256()
    for d in DATA_DIRS:
        base = pathlib.Path(top) / d
        if not base.is_dir(): continue
        for p in sorted(base.iterdir()):
            if p.is_file() and not p.name.startswith('.'):
                h.update(f'{d}/{p.name}\t{p.stat().st_size}\t{file_sha256(p)}\n'.encode('utf8'))
    return h.hexdigest()


def code_hash(css, js):
    """a fingerprint of the app: the style sheet and every script, as build.py reads them (before the stamp itself is put in)"""
    h = hashlib.sha256(); h.update(css.encode('utf8')); h.update(b'\0'); h.update(js.encode('utf8'))
    return h.hexdigest()


def make(root, top, css, js, today=None, state_file=None, write=True):
    """the stamp for these files now. The date comes from tools/release_stamp.json when the code is the one it records, and is today (and recorded) when it is not."""
    data, code = data_hash(top), code_hash(css, js)
    rid = hashlib.sha256((code + data).encode('utf8')).hexdigest()[:6]
    sf = pathlib.Path(state_file) if state_file else pathlib.Path(root) / 'tools' / 'release_stamp.json'
    state = {}
    try: state = json.loads(sf.read_text(encoding='utf8'))
    except (OSError, ValueError): pass
    if state.get('id') == rid and re.fullmatch(r'\d{4}-\d\d-\d\d', str(state.get('date', ''))): date = state['date']
    else:
        date = today or datetime.date.today().isoformat()
        if write: sf.write_text(json.dumps({'id': rid, 'date': date}, indent=1) + '\n', encoding='utf8')
    return {'date': date, 'id': rid, 'stamp': f'{date}-{rid}', 'app': code[:12], 'library': data[:12]}


def bake(js, rel):
    """put the stamp into the app's source: its version string and its release record. Both placeholders must be there exactly once, so a stamp can never go missing without notice."""
    for p in PLACEHOLDERS:
        if js.count(p) != 1: raise SystemExit(f'stamp_lib: expected {p!r} exactly once in the app source (src/js/00-util.js), found {js.count(p)}')
    return js.replace(PLACEHOLDERS[0], f"version: '{rel['stamp']}'").replace(PLACEHOLDERS[1], 'release: ' + json.dumps(rel, separators=(',', ':')))


def read_baked(html_path):
    """the stamp a built Lamplighter.html carries, or None for a page that has none (a page built before stamps, or not built at all)"""
    try: t = pathlib.Path(html_path).read_text(encoding='utf8')
    except OSError: return None
    m = re.search(r"version: '([^']*)', release: (\{[^{}]*\})", t)
    if not m: return None
    try: rel = json.loads(m.group(2))
    except ValueError: return None
    return rel if rel.get('stamp') == m.group(1) else None


LEGACY_PREFIX = 'Beatlab-'      # zips made before the rename: an old Beatlab-everything-<stamp>.zip is an older release of Lamplighter-everything-<stamp>.zip


def split_name(name):
    """Lamplighter-pack-occult-2026-11-16-3fa9c1.zip  →  ('Lamplighter-pack-occult.zip', '2026-11-16-3fa9c1'); a name without a stamp comes back as (name, None)"""
    if name.startswith(LEGACY_PREFIX): name = 'Lamplighter-' + name[len(LEGACY_PREFIX):]
    m = re.fullmatch(r'(.+)-(\d{4}-\d\d-\d\d-[0-9a-f]{6})\.zip', name)
    return (m.group(1) + '.zip', m.group(2)) if m else (name, None)


def stamped_name(base, stamp):
    return re.sub(r'\.zip$', '', base) + '-' + stamp + '.zip'


if __name__ == '__main__':
    here = pathlib.Path(__file__).resolve().parent; root = here.parent
    top = next((pathlib.Path(a[6:]) for a in sys.argv[1:] if a.startswith('--top=')), root.parent)
    baked = read_baked(top / 'Lamplighter.html')
    d = data_hash(top)
    print('library fingerprint now:', d[:12])
    print('stamp baked into Lamplighter.html:', baked['stamp'] if baked else '(none: run python3 build.py)')
    if baked: print('library changed since it was built:' , 'no' if baked['library'] == d[:12] else 'YES: run python3 build.py before making zips')
