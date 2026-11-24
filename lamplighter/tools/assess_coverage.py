#!/usr/bin/env python3
"""Coverage assessment: for every religion and movement in the Atlas, does the Library hold at least one readable example of its own texts, and does the Atlas link it
to any other tradition? Reads (nothing is changed): ../atlas/core.js, ../atlas/texts.js, ../atlas/index.js, ../texts/*.js (file names only).
Writes: ../COVERAGE_BY_TRADITION.csv (one row per tradition), and prints the tables that ../COVERAGE_ASSESSMENT.md quotes.
Run from lamplighter/ (after tools/build_atlas.py, so the aliases are in the Atlas):   python3 -I tools/assess_coverage.py        (needs node)

A tradition counts as COVERED when at least one of its Atlas text records (atlas/texts.js) points, through tools/atlas_text_aliases.json, to a file that is in texts/. That is a
strict test: a book about a tradition that nobody has listed against it in the Atlas does not count, so the figures are a floor and each "uncovered" row has to be looked at
(some are false negatives: the text is in the Library but its Atlas record is missing or points at a parent tradition).
"""
import csv, json, os, re, subprocess, sys, collections

HERE = os.path.dirname(os.path.abspath(__file__)); BEAT = os.path.dirname(HERE); ROOT = os.path.dirname(BEAT)
TEXTS = os.path.join(ROOT, 'texts'); ATLAS = os.path.join(ROOT, 'atlas')


def node_json(js):
    return json.loads(subprocess.run(['node', '-e', js], capture_output=True, text=True, check=True).stdout)


ATL = node_json("""const fs=require('fs'),vm=require('vm');globalThis.BEATLAB_ATLAS={data:{},add(n,d){this.data[n]=d}};
for(const n of ['index','core','texts']) vm.runInThisContext(fs.readFileSync(%r+'/'+n+'.js','utf8'));
const D=BEATLAB_ATLAS.data;console.log(JSON.stringify({texts:D.texts,fams:D.core.families,trad:D.core.traditions.map(t=>({id:t.id,name:t.name,family_id:t.family_id,kind:t.kind,root_id:t.root_id,start:t.start_year})),
 ix:D.core.interactions.map(x=>[x.source_id,x.target_id,x.type]),groups:D.index.config.family_groups.groups}))""" % ATLAS)
folder = {f[:-3] for f in os.listdir(TEXTS) if re.match(r'^[a-z]-.+\.js$', f)}
# --without=FILE (ids separated by commas or spaces): leave those texts out, to see the figures as they were before they were added; the CSV is then not written
WITHOUT = next((a[10:] for a in sys.argv if a.startswith('--without=')), '')
if WITHOUT: folder -= set(re.split(r'[,\s]+', open(WITHOUT, encoding='utf-8').read().strip()))
fam_name = {f['id']: (f.get('name') or f.get('label') or f['id']) for f in ATL['fams']}
group_of = {fid: g['label'] for g in ATL['groups'] for fid in g['families']}
trad = {t['id']: t for t in ATL['trad']}

# records per tradition, and how many of them are readable here
rec = collections.defaultdict(list)
for x in ATL['texts']:
    libs = x.get('libs') or ([x['lib']] if x.get('lib') else [])
    rec[x.get('tradition_id')].append(any(i in folder for i in libs))

edges = collections.Counter(); kinds = collections.defaultdict(set)
for a, b, ty in ATL['ix']:
    edges[a] += 1; edges[b] += 1; kinds[a].add(ty); kinds[b].add(ty)

direct = {tid for tid, r in rec.items() if any(r)}
ABOUT = json.load(open(os.path.join(HERE, 'library_about.json'), encoding='utf-8')); about = collections.defaultdict(list); unknown = []
for lid, tids in ABOUT.items():
    if lid.startswith('_'): continue
    for tid in tids:
        if tid not in trad: unknown.append((lid, tid))
        elif lid in folder: about[tid].append(lid)
if unknown: print('!! library_about.json names traditions the Atlas does not have:', unknown)
# library_lore.json: Library id -> the REVIVED or RECONSTRUCTED traditions whose old source texts it is (the Eddas for Heathenry, Homer and Hesiod for Hellenismos). It is not counted as an example of
# the tradition (the revival's own books are mostly in copyright); it is reported on its own, so the figures stay honest.
LORE_PATH = os.path.join(HERE, 'library_lore.json'); lore = collections.defaultdict(list)
if os.path.exists(LORE_PATH):
    for lid, tids in json.load(open(LORE_PATH, encoding='utf-8')).items():
        if lid.startswith('_'): continue
        for tid in tids:
            if tid not in trad: print('!! library_lore.json names a tradition the Atlas does not have:', lid, tid)
            elif lid in folder: lore[tid].append(lid)
rows = []
for t in ATL['trad']:
    r = rec.get(t['id'], [])
    root = t.get('root_id') or t['id']
    rows.append(dict(id=t['id'], name=t['name'], family=t['family_id'], group=group_of.get(t['family_id'], ''), kind=t.get('kind', ''), records=len(r), readable=sum(r),
                     covered='yes' if any(r) else ('no records' if not r else 'no'), about=' '.join(about.get(t['id'], [])), lore=' '.join(lore.get(t['id'], [])), any_example=('yes' if (any(r) or about.get(t['id'])) else ''), via_root=('yes' if (t['id'] not in direct and root != t['id'] and root in direct) else ''), links=edges.get(t['id'], 0)))
if not WITHOUT:
    with open(os.path.join(ROOT, 'COVERAGE_BY_TRADITION.csv'), 'w', newline='', encoding='utf-8') as fh:
        w = csv.DictWriter(fh, fieldnames=list(rows[0].keys())); w.writeheader(); w.writerows(rows)

n = len(rows); cov = sum(1 for r in rows if r['covered'] == 'yes'); anyex = sum(1 for r in rows if r['any_example']); nolink = sum(1 for r in rows if r['links'] == 0); viar = sum(1 for r in rows if r['via_root'])
print('traditions %d; with an example of either kind (own text, or a field record or study of it in the Library) %d (%.0f%%); with a readable text of their own %d (%.0f%%); no example of their own but the parent tradition (the Atlas root) has one %d; with no Atlas text record at all %d; with no interaction edge %d (%.0f%%)' % (n, anyex, 100 * anyex / n, cov, 100 * cov / n, viar, sum(1 for r in rows if r['covered'] == 'no records'), nolink, 100 * nolink / n))
print('Atlas text records %d, readable here %d; texts/ files %d' % (len(ATL['texts']), sum(sum(v) for v in rec.values()), len(folder)))
loreonly = [r for r in rows if r['lore'] and not r['any_example']]
print('revived or reconstructed traditions with no example of their own, whose old source texts the Library holds (library_lore.json): %d: %s' % (len(loreonly), '; '.join(r['name'] for r in loreonly)))
print()
by = collections.OrderedDict()
for r in rows:
    d = by.setdefault(r['family'], collections.Counter()); d['n'] += 1; d['cov'] += r['covered'] == 'yes'; d['any'] += bool(r['any_example']); d['via'] += bool(r['via_root']); d['norec'] += r['covered'] == 'no records'; d['nolink'] += r['links'] == 0
    d['rec'] += r['records']; d['read'] += r['readable']
print('| family | traditions | with an example of either kind | % | of them, their own text | via the parent tradition | Atlas text records | readable here | % of records | with no link |\n|---|---|---|---|---|---|---|---|---|---|')
for fid, d in sorted(by.items(), key=lambda kv: -kv[1]['n']):
    print('| %s | %d | %d | %.0f%% | %d | %d | %d | %d | %.0f%% | %d |' % (fam_name.get(fid, fid), d['n'], d['any'], 100 * d['any'] / d['n'], d['cov'], d['via'], d['rec'], d['read'], 100 * d['read'] / max(1, d['rec']), d['nolink']))
print()
for fid in by:
    miss = [r['name'] + (' [parent has one]' if r['via_root'] else '') for r in rows if r['family'] == fid and not r['any_example']]
    if miss: print('### %s (%d with no example of either kind)\n%s\n' % (fam_name.get(fid, fid), len(miss), '; '.join(miss)))
