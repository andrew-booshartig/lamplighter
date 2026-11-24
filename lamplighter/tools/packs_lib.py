"""Packs of texts: the Library's collections by short name (tools/release_packs.json), shared by make_release.py (zips) and make_site.py (the website folder).
A copy of the Lamplighter Project can leave packs out. Its texts/index.js is then rewritten without their texts and lists them (BEATLAB_TEXTS.packs = { slug: collection name }), so the app says what the
copy leaves out and finds a pack the moment it is put back beside it (src/js/6c-texts.js). Nothing here writes to the project: it only reads the catalogue (through node) and the texts index."""
import json, pathlib, re, subprocess


def index_js(meta, packs=None):
    s = 'BEATLAB_TEXTS.addIndex(' + json.dumps(meta, ensure_ascii=False, separators=(',', ':')) + ');\n'
    if packs: s += 'BEATLAB_TEXTS.packs = ' + json.dumps(packs, ensure_ascii=False, separators=(',', ':')) + ';\n'
    return s


class Packs:
    def __init__(self, src, top):
        self.src = pathlib.Path(src); self.top = pathlib.Path(top); self.texts_dir = self.top / 'texts'
        self.cat = self._catalogue()
        self.meta = self._load_index() if (self.texts_dir / 'index.js').exists() else {}
        self.packs = json.loads((self.src / 'tools' / 'release_packs.json').read_text(encoding='utf8'))['packs']
        self.by_slug = {p['slug']: p for p in self.packs}
        names = [c['name'] for c in self.cat['collections']]
        if sorted(p['collection'] for p in self.packs) != sorted(names):
            raise SystemExit('tools/release_packs.json does not list every Library collection exactly once: ' + str(sorted(set(names) ^ set(p['collection'] for p in self.packs))))
        self.groups = {c['name']: set(c['groups']) for c in self.cat['collections']}
        self.optional = [p['slug'] for p in self.packs if p.get('optional')]

    def _catalogue(self):
        js = r"""const fs=require('fs'),path=require('path');const dir=path.join(process.argv[1],'src','js');
const lib=require(path.join(dir,'24-data-path-lib.js'));const t=fs.readFileSync(path.join(dir,'6g-library.js'),'utf8');
const m=t.match(/const LIB_COLLECTIONS = \[[\s\S]*?\n\];/);const colls=new Function(m[0]+'; return LIB_COLLECTIONS')();
console.log(JSON.stringify({collections:colls.map(c=>({name:c[0],groups:c[2]})),groups:Object.fromEntries(lib.LIB.map(l=>[l.id,l.group]))}));"""
        return json.loads(subprocess.run(['node', '-e', js, str(self.src)], capture_output=True, text=True, check=True).stdout)

    def _load_index(self):
        t = (self.texts_dir / 'index.js').read_text(encoding='utf8')
        m = re.search(r'BEATLAB_TEXTS\.addIndex\((\{.*\})\);\s*$', t, re.S)
        if not m: raise SystemExit('texts/index.js is not in the form BEATLAB_TEXTS.addIndex({...});')
        return json.loads(m.group(1))

    def ids(self, slug):
        """the ids of the readable texts in one pack"""
        if slug not in self.by_slug: raise SystemExit(f'no pack called "{slug}" (see --list-packs)')
        gs = self.groups[self.by_slug[slug]['collection']]
        return [i for i, g in self.cat['groups'].items() if g in gs and i in self.meta]

    def drop_ids(self, slugs):
        return {i for s in slugs for i in self.ids(s)}

    def file_dropped(self, filename, drop):
        """is this file in texts/ one that belongs to a left-out text (its text file, its picture file or its printed-page file)?"""
        m = re.fullmatch(r'(?:fig-|pg-)?(.+)\.js', filename)
        return bool(m and m.group(1) in drop)

    def trimmed_index(self, slugs):
        """texts/index.js for a copy without these packs: only the texts that are there, and the list of packs that may be added later"""
        drop = self.drop_ids(slugs)
        return index_js({k: v for k, v in self.meta.items() if k not in drop}, {s: self.by_slug[s]['collection'] for s in slugs})

    def size_mb(self, ids):
        return sum(self.meta[i].get('chars', 0) for i in ids) / 1e6

    def listing(self):
        rows = []
        for p in self.packs:
            ids = self.ids(p['slug'])
            rows.append(f"{p['slug']:24s} {len(ids):4d} texts {self.size_mb(ids):7.1f} MB  {p['collection']}{'  (optional: has a zip of its own)' if p.get('optional') else ''}")
        return rows
