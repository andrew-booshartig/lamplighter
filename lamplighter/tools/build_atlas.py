#!/usr/bin/env python3
"""Build the Atlas data files that Lamplighter.html loads on demand.

Input  (tools/atlas_src/):  json/*.json (the World Religion Atlas database, exported by its own build),
                            land/ne_110m_land.geojson and ne_50m_land.geojson (Natural Earth, public domain).
Output (../../atlas/, next to Lamplighter.html):  index.js, core.js, places.js, texts.js, sites.js, events.js, world.js, causes.js, land.js  (world.js: the events of human history beside the religious ones, from json/world_*.json; causes.js: what caused each researched connection, from json/interaction_causes*.json)
Each file calls BEATLAB_ATLAS.add(name, data), the same pattern as the texts folder, so it works from file:// with no network.
Nothing is altered: null and empty fields are dropped (a missing field means null) and long keys are kept as they are, except in events.

Run:  python3 -I tools/build_atlas.py
"""
import json, math, os, pathlib, re, sys

HERE = pathlib.Path(__file__).resolve().parent
SRC = HERE / 'atlas_src'
OUT = HERE.parent.parent / 'atlas'
LIBJS = HERE.parent / 'src/js/24-data-path-lib.js'


def load(name):
    return json.load(open(SRC / 'json' / (name + '.json'), encoding='utf-8'))


def lean(row, keep_zero=()):
    """drop null, empty-string and zero-flag values so the files stay small; a missing key means null / 0 / ''"""
    return {k: v for k, v in row.items() if not (v is None or v == '' or (v == 0 and k in ('auto', 'circa', 'start_circa', 'end_circa', 'lineage_depth') and k not in keep_zero))}


def js(name, data):
    OUT.mkdir(parents=True, exist_ok=True)
    body = 'BEATLAB_ATLAS.add(%s,%s);\n' % (json.dumps(name), json.dumps(data, ensure_ascii=False, separators=(',', ':')))
    (OUT / (name + '.js')).write_text(body, encoding='utf-8')
    return len(body.encode('utf-8'))


# ───────────────── library matching: which atlas text records are also readable (or listed) in the Lamplighter Project's own Library
def norm(s):
    s = s.lower().replace("'", '').replace('\u2019', '')
    s = re.sub(r'\(.*?\)', ' ', s)
    s = re.sub(r'[^a-z0-9 ]+', ' ', s)
    s = re.sub(r'\b(the|of|and|a|an|in|on|to|selected|book|books)\b', ' ', s)
    return ' '.join(s.split())


def library_titles():
    src = LIBJS.read_text(encoding='utf-8')
    pat = r"'([a-z]-[a-z0-9-]+)\|((?:[^|'\\]|\\.)+)\|[a-z]+\|(?:[^|'\\]|\\.)+\|[a-z]+'"
    return [(m.group(1), re.sub(r"\\(.)", r"\1", m.group(2))) for m in re.finditer(pat, src)]


def library_map(name, trad_ids):
    """tradition id -> the Library ids that tools/<name> maps to it, turned round from Library id -> traditions: library_about.json (the books ABOUT a tradition: a field record, a study, a history)
    and library_lore.json (the OLD SOURCE texts a revived or reconstructed religion draws on, such as the Eddas for Heathenry).
    Library order, so the list is the same every build. A book or tradition that no longer exists is skipped and reported, so the Atlas file never points at nothing."""
    p = HERE / name
    if not p.exists(): return {}, []
    order = {i: n for n, (i, _) in enumerate(library_titles())}; raw = json.loads(p.read_text(encoding='utf-8')); out = {}; skipped = []
    for lid, tids in raw.items():
        if lid.startswith('_'): continue
        if lid not in order: skipped.append(lid); continue
        for tid in ([tids] if isinstance(tids, str) else tids):
            if tid not in trad_ids: skipped.append(lid + ' -> ' + tid); continue
            out.setdefault(tid, []).append(lid)
    return {k: sorted(set(v), key=lambda i: order[i]) for k, v in sorted(out.items())}, skipped


def match_library(texts):
    lib = [(i, t, norm(t)) for i, t in library_titles()]
    exact = {}
    for i, t, n in lib: exact.setdefault(n, i)
    out = {}; fuzzy = []
    for x in texts:
        n = norm(x['title'])
        if n in exact: out[x['id']] = exact[n]; continue
        w = set(n.split())
        if not w: continue
        best = None
        for i, t, ln in lib:
            lw = set(ln.split())
            if not lw: continue
            j = len(w & lw) / len(w | lw)
            if j >= 0.7 and (not best or j > best[0]): best = (j, i, t)
        if best: out[x['id']] = best[1]; fuzzy.append((x['title'], best[2], round(best[0], 2)))
    # records whose titles differ from the Library's are matched by hand (tools/atlas_text_aliases.json); a list means several files cover one record
    al = json.loads((pathlib.Path(__file__).resolve().parent / 'atlas_text_aliases.json').read_text(encoding='utf-8'))
    ids = {x['id'] for x in texts}; libids = {i for i, _ in library_titles()}; partial = set(al.get('_partial', [])); multi = {}
    for k, v in al.items():
        if k.startswith('_'): continue
        vs = v if isinstance(v, list) else [v]
        assert k in ids, 'alias names no Atlas text: ' + k
        assert all(i in libids for i in vs), 'alias names no Library entry: ' + k + ' ' + str(vs)
        out[k] = vs[0]
        if len(vs) > 1: multi[k] = vs
    assert partial <= ids, 'partial names no Atlas text'
    for k in al.get('_exclude', []):
        assert k in ids, 'exclude names no Atlas text: ' + k
        out.pop(k, None)
    return out, fuzzy, multi, partial


# ───────────────── world history: the events of tools/atlas_src/json/world_*.json (the Timeline of human history, with religion drawn from the Atlas events)
WORLD_KINDS = {'reference': 'C', 'scholarly': 'B', 'dataset': 'B', 'primary': 'A'}          # what a source is → its grade (see world_meta.json, "grades")


def check_world(events, strands, meta, trad_ids, lib_ids):
    """Hard checks on the world-history events. The build stops rather than ship an entry with a missing source, a link to nothing, dates the wrong way round or a conflict without its parties:
    tests/history.test.js checks the built file again, and also the words. The model is written in the README (lamplighter/README.md, "World history") and in world_meta.json."""
    sid = {s['id'] for s in strands}; assert len(sid) == len(strands) and 'religion' in sid, 'strands'
    assert set(meta['statuses']) == {'documented', 'reported', 'disputed'} and set(meta['confidence']) == {'H', 'M', 'L', 'C'} and set(meta['grades']) == {'A', 'B', 'C', 'D'}
    ids = set(); prev = None
    for e in events:
        k = e['id']; assert re.fullmatch(r'[a-z0-9]+(-[a-z0-9]+)*', k), 'world event id: ' + k; assert k not in ids, 'duplicate world event: ' + k; ids.add(k)
        assert e['strand'] in sid and e['strand'] != 'religion', k + ': strand'                 # the religion strand is drawn from the Atlas's own events, never repeated here
        ys, ye = e['year_start'], e.get('year_end'); assert isinstance(ys, int) and ys != 0, k + ': year_start'; assert ye is None or (isinstance(ye, int) and ye != 0 and ye > ys), k + ': year_end'
        assert (ys, k) >= (prev or (-10**9, '')), k + ': the file is kept in date order'; prev = (ys, k)
        assert e['date_confidence'] in meta['confidence'] and e['status'] in meta['statuses'], k + ': confidence or status'
        assert e.get('date_label') and e.get('label') and 40 <= len(e.get('summary', '')) <= 520, k + ': label, date or summary'
        assert isinstance(e['importance'], int) and 1 <= e['importance'] <= 5, k + ': importance'
        assert e.get('places'), k + ': a place (the Atlas has none for a place that is only a region: give its middle and mark it approx)'
        for p in e['places']:
            assert p.get('name') and -90 <= p['lat'] <= 90 and -180 <= p['lon'] <= 180, k + ': place'; assert 'country_iso2' not in p or re.fullmatch(r'[A-Z]{2}', p['country_iso2']), k + ': country'
        assert e.get('sources'), k + ': a source'
        for s in e['sources']:
            assert s.get('title') and WORLD_KINDS.get(s.get('kind')) == s.get('grade'), k + ': source kind and grade'; assert 'url' not in s or s['url'].startswith('https://'), k + ': source address'
        for t in e.get('traditions', []): assert t in trad_ids, k + ': no such tradition ' + t
        for t in e.get('texts', []): assert t in lib_ids, k + ': no such Library text ' + t
        c = e.get('conflict'); assert (c is not None) == (e['strand'] == 'conflict'), k + ': only conflicts carry the conflict block, and every conflict does'
        if c:
            assert len(c['parties']) >= 2 and all(p.get('name') for p in c['parties']), k + ': parties'
            assert c['causes'] and all(x['kind'] in meta['causes'] and x['status'] in meta['statuses'] and x.get('note') for x in c['causes']), k + ': causes'
            cs = c.get('casualties'); assert cs is None or (0 <= cs['low'] <= cs['high'] and cs.get('unit') and cs.get('status') in meta['statuses']), k + ': casualties'; assert cs is not None or c.get('casualty_note'), k + ': a conflict with no range says why'
    for e in events:
        for r in e.get('related', []): assert r['id'] in ids and r['id'] != e['id'] and r['kind'] in meta['relations'], e['id'] + ': related ' + str(r)


# ───────────────── conflicts and peacemaking (BACKLOG D8): tools/atlas_src/json/world_conflicts.json = { meta, entries }; the entries join the world's events in the conflict strand
CONFLICT_REGIONS = ('Africa', 'Asia', 'Europe', 'North America', 'Oceania', 'South America')      # the Atlas's six continents (countries.json); the same words as All traditions, "Where it began"
CONFLICT_ENDS = ('treaty', 'settlement', 'victory', 'ceasefire', 'exhaustion', 'collapse', 'continuing', 'other')
CONFLICT_LIVING = 1945       # an entry that runs past this year is within living memory: the page marks it, and every statement in every entry already carries its own status


def merge_conflicts(events, cf):
    """The world's events with the conflicts file laid over them: an entry of the same id replaces the pilot's (the eight wars written first; it must be a conflict itself), the rest are added; the file stays in date order (year, then id)."""
    mine = {e['id']: e for e in cf['entries']}; assert len(mine) == len(cf['entries']), 'a conflict id is used twice in world_conflicts.json'
    for e in events:
        if e['id'] in mine: assert e['strand'] == 'conflict', 'world_conflicts.json would replace an event that is not a conflict: ' + e['id']
    return sorted([e for e in events if e['id'] not in mine] + list(mine.values()), key=lambda e: (e['year_start'], e['id']))


def check_conflicts(cf, events, meta, trad_ids, continent_of):
    """Hard checks on world_conflicts.json (tests/conflicts.test.js checks the built file again, and the words). Every entry, a war, a quarrel between communities or a settlement, has the same fields:
    its parties, each with the name it uses for itself and what it said the matter was (and how well that is documented); the causes, each of one kind (religious, political, economic, mixed) with a status and the
    sources that say so; the dead as a range with a unit, a basis and the source of each end, or the plain words "Not recorded" (a settlement has none of its own); how it ended and what followed; the continents it touched;
    and sources each graded and dated by the day they were opened. A number in a statement points at a source of the entry (1 is the first). The build stops rather than ship an entry that leaves one of these out."""
    m = cf['meta']; ST = set(meta['statuses'])
    assert set(m['kinds']) == {'war', 'sect', 'peace'} and set(m['ended']) == set(CONFLICT_ENDS) and set(m['statuses']) == ST, 'conflicts meta: kinds, ended, statuses'
    assert len(m.get('lede', '')) >= 80 and len(m.get('rules', [])) >= 4, 'conflicts meta: lede and rules'
    ids = {e['id'] for e in events}
    def sref(k, what, v, n):
        assert isinstance(v, list) and v and all(isinstance(i, int) and 1 <= i <= n for i in v) and len(set(v)) == len(v), k + ': ' + what + ' points at a source of the entry (1 to %d)' % n
    for e in cf['entries']:
        k = e['id']; c = e.get('conflict'); assert e['strand'] == 'conflict' and c, k + ': a conflict entry'
        assert c['kind'] in m['kinds'], k + ': kind'; assert c.get('living', 0) == (1 if (e.get('year_end') or e['year_start']) > CONFLICT_LIVING else 0), k + ': living (an entry that runs past %d is marked, and no other)' % CONFLICT_LIVING
        n = len(e['sources']); assert 2 <= n <= 9, k + ': two to nine sources'; used = set()
        for s in e['sources']:
            assert re.fullmatch(r'20\d\d-\d\d-\d\d', s.get('read', '')), k + ': a source says the day it was opened (read)'; assert 'partisan' not in s or len(s['partisan']) >= 3, k + ': a partisan source says whose it is'
        assert c.get('regions') and set(c['regions']) <= set(CONFLICT_REGIONS) and len(set(c['regions'])) == len(c['regions']), k + ': regions'
        for p in e['places']:
            if p.get('country_iso2') and continent_of.get(p['country_iso2']): assert continent_of[p['country_iso2']] in c['regions'], k + ': the regions leave out the continent of ' + p['name']
        assert 2 <= len(c['parties']) <= 6, k + ': two to six parties'
        for p in c['parties']:
            assert p.get('name') and 40 <= len(p.get('said', '')) <= 700 and p.get('said_status') in ST, k + ': a party gives its name, what it said the matter was, and how well that is documented'; sref(k, 'what a party said', p.get('src'), n); used.update(p['src'])
            assert 'also' not in p or len(p['also']) >= 3, k + ': other names'
        assert 1 <= len(c['causes']) <= 5 and len({x['kind'] for x in c['causes']}) == len(c['causes']), k + ': one to five causes, each kind once'
        for x in c['causes']:
            assert x['kind'] in meta['causes'] and x['status'] in ST and 20 <= len(x.get('note', '')) <= 600, k + ': cause ' + str(x.get('kind')); sref(k, 'a cause', x.get('src'), n); used.update(x['src'])
        cs = c.get('casualties')
        if c['kind'] == 'peace': assert cs is None and c.get('casualty_note', '').startswith('A settlement'), k + ': a settlement has no dead of its own: it points to the conflict it ended'
        elif cs is None: assert c.get('casualty_note', '').startswith('Not recorded') and len(c['casualty_note']) >= 30, k + ': no range says "Not recorded" and why'
        else:
            assert 0 < cs['low'] < cs['high'] and cs.get('unit') and cs['status'] in ST and len(cs.get('basis', '')) >= 20 and len(cs.get('note', '')) >= 20, k + ': a range: low, high, unit, basis, status, note'
            sref(k, 'the low end', cs.get('low_src'), n); sref(k, 'the high end', cs.get('high_src'), n); used.update(cs['low_src']); used.update(cs['high_src'])
        for part in ('outcome', 'after'):
            o = c[part]; assert o['status'] in ST and 30 <= len(o.get('note', '')) <= 700, k + ': ' + part; sref(k, part, o.get('src'), n); used.update(o['src'])
        assert c['outcome']['how'] in CONFLICT_ENDS, k + ': how it ended'
        assert used == set(range(1, n + 1)), k + ': every source is used by a statement, and none is missing (unused: %s)' % sorted(set(range(1, n + 1)) - used)
        for r in e.get('related', []): assert r['id'] in ids, k + ': related ' + r['id']
        # a settlement that follows a war in this list is linked to it by its `related` (the page shows the link); one with no war here (the Great Law of Peace, an act of a colony) stands alone, and its casualty_note says so


LINEAGE = ('derive', 'schism', 'reform', 'revive')           # a connection of these kinds already says "this grew from that" (src/js/2z-chain-core.js, CHAIN_LINEAGE: keep the two lists the same)


def link_ids(traditions, interactions):
    """The things a cause row can be about: every connection by its id, and every parent-to-child link the Atlas records where no connection of the kinds above already says so, as "lineage:<child id>"."""
    ids = {r['id'] for r in interactions}; tids = {t['id'] for t in traditions}; said = {(r['source_id'], r['target_id']) for r in interactions if r['type'] in LINEAGE}
    return ids | {'lineage:' + t['id'] for t in traditions if t.get('parent_id') in tids and t['parent_id'] != t['id'] and (t['parent_id'], t['id']) not in said}


# ───────────────── what caused each connection: tools/atlas_src/json/interaction_causes.json (a cause, how well documented, and its sources, for the connections that have been researched)
def check_causes(rows, link_ids, meta, lib_ids):
    """Hard checks on the cause rows (the pilot of Compare traditions, step by step). The build stops on a row for a connection that does not exist, a cause outside the fixed list, a status that does not fit,
    a source without a grade or an https address, a Library text that is not there, a row with no source that claims to be documented, or a "less sure" row without the note that says what to look at.
    tests/causes.test.js checks the built file again, and the words. A connection with no row has no cause recorded, which the page says plainly."""
    assert set(meta['statuses']) == {'documented', 'reported', 'disputed'} and set(meta['grades']) == {'A', 'B', 'C', 'D'} and 'travel' in meta['causes'] and 'unknown' not in meta['causes']
    seen = set(); prev = ''
    for r in rows:
        k = r['link_id']; assert k in link_ids, 'cause row for no connection: ' + k; assert k not in seen, 'two cause rows for ' + k; seen.add(k); assert k >= prev, 'cause rows are kept in order of connection: ' + k; prev = k
        assert 60 <= len(r.get('summary', '')) <= 560, k + ': summary'; assert 1 <= len(r['causes']) <= 3, k + ': causes'; kinds = [c['cause'] for c in r['causes']]; assert len(set(kinds)) == len(kinds), k + ': a cause once'
        for c in r['causes']: assert c['cause'] in meta['causes'] and c['status'] in meta['statuses'] and len(c.get('note', '')) >= 15, k + ': cause ' + str(c)
        assert len(r.get('route', '')) <= 80, k + ': route'; assert r['confidence'] in ('sure', 'less sure'), k + ': confidence'; assert r['confidence'] == 'sure' or len(r.get('check', '')) >= 10, k + ': a less sure row says what to look at'; assert 'check' not in r or r['confidence'] == 'less sure', k + ': a note of what to look at belongs to a less sure row'
        assert len(r['sources']) <= 5, k + ': sources'
        for s in r['sources']:
            assert s.get('title') and WORLD_KINDS.get(s.get('kind')) == s.get('grade'), k + ': source kind and grade'; assert 'url' not in s or s['url'].startswith('https://'), k + ': source address'; assert 'lib' not in s or s['lib'] in lib_ids, k + ': no such Library text ' + str(s.get('lib'))
        if not r['sources']: assert len(r.get('source_note', '')) >= 20 and all(c['status'] == 'reported' for c in r['causes']), k + ': a row with no source says why and is only reported'


# ───────────────── land outlines: simplified, quantised and delta-encoded
def rdp(pts, eps):
    if len(pts) < 3: return pts
    keep = [False] * len(pts); keep[0] = keep[-1] = True; stack = [(0, len(pts) - 1)]
    while stack:
        a, b = stack.pop(); ax, ay = pts[a]; bx, by = pts[b]; dx, dy = bx - ax, by - ay; den = dx * dx + dy * dy; idx = -1; md = 0
        for i in range(a + 1, b):
            px, py = pts[i]
            d = abs((px - ax) * dy - (py - ay) * dx) / math.sqrt(den) if den else math.hypot(px - ax, py - ay)
            if d > md: md = d; idx = i
        if md > eps and idx >= 0: keep[idx] = True; stack += [(a, idx), (idx, b)]
    return [p for p, k in zip(pts, keep) if k]


def land(path, eps, unit):
    g = json.load(open(path, encoding='utf-8')); rings = []
    for f in g['features']:
        geo = f['geometry']; polys = geo['coordinates'] if geo['type'] == 'MultiPolygon' else [geo['coordinates']]
        for poly in polys:
            ring = poly[0]  # outer ring only; holes (lakes inside land) are left out on purpose
            pts = rdp([(p[0], p[1]) for p in ring], eps)
            if len(pts) < 4: continue
            q = [(round(x / unit), round(y / unit)) for x, y in pts]; flat = []; px = py = 0
            for x, y in q: flat += [x - px, y - py]; px, py = x, y
            rings.append(flat)
    return {'unit': unit, 'rings': rings}


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    traditions = [lean(r) for r in load('traditions')]
    presence = [lean(r) for r in load('presence')]
    interactions = [lean(r) for r in load('interactions')]
    countries = {c['iso2']: [c['name'], c['continent'], c['lat'], c['lon']] for c in load('countries')}
    tids = {t['id'] for t in traditions}; about, about_skipped = library_map('library_about.json', tids); lore, lore_skipped = library_map('library_lore.json', tids)
    core = dict(families=load('families'), countries=countries, traditions=traditions, presence=presence, interactions=interactions,
                practices=load('practices'), tp=[[r['tradition_id'], r['practice_id']] for r in load('tradition_practices')], adherents=load('adherents'), sources=load('sources'), about=about, lore=lore)
    sizes = {'core': js('core', core)}
    sizes['places'] = js('places', [lean(r) for r in load('places')])
    texts = load('texts'); lib, fuzzy, multi, partial = match_library(texts)
    tx = []
    for r in texts:
        r = lean(r)
        if r['id'] in lib: r['lib'] = lib[r['id']]
        if r['id'] in multi: r['libs'] = multi[r['id']]
        if r['id'] in partial: r['libp'] = 1
        tx.append(r)
    sizes['texts'] = js('texts', tx)
    sizes['sites'] = js('sites', [lean(r) for r in load('sites')])
    wev = load('world_events'); wstr = load('world_strands'); wmeta = load('world_meta'); wcf = load('world_conflicts'); wev = merge_conflicts(wev, wcf)      # the conflicts and settlements (D8) are laid over the events of the world
    check_world(wev, wstr, wmeta, tids, {i for i, _ in library_titles()}); check_conflicts(wcf, wev, wmeta, tids, {k: v[1] for k, v in countries.items()})
    sizes['world'] = js('world', {'meta': dict(wmeta, conflicts=wcf['meta']), 'strands': wstr, 'events': [lean(e) for e in wev]})
    cau = load('interaction_causes'); cmeta = load('interaction_causes_meta'); check_causes(cau, link_ids(traditions, interactions), cmeta, {i for i, _ in library_titles()})
    sizes['causes'] = js('causes', {'meta': cmeta, 'rows': cau})
    ev = [lean({'k': e['kind'], 'r': e['ref_id'], 't': e['tradition_id'], 'ys': e['year_start'], 'ye': e['year_end'], 'l': e['label'], 'd': e['date_label'], 'i': e['importance'], 'la': e['lat'], 'lo': e['lon'], 'c': e['country_iso2']}) for e in load('timeline_events')]
    sizes['events'] = js('events', ev)
    sizes['land'] = js('land', {'l110': land(SRC / 'land/ne_110m_land.geojson', 0.05, 0.05), 'l50': land(SRC / 'land/ne_50m_land.geojson', 0.04, 0.02),
                                'credit': 'Natural Earth (public domain), simplified'})
    meta = {'built': 'from the World Religion Atlas database', 'counts': {k: len(v) if hasattr(v, '__len__') else v for k, v in dict(traditions=traditions, presence=presence, interactions=interactions, about=about, lore=lore, texts=tx, sites=load('sites'), events=ev, practices=core['practices'], families=core['families']).items()}, 'libMatches': len(lib)}
    cm = json.load(open(SRC / 'json/_codes_meta.json', encoding='utf-8')); cfg = json.load(open(SRC / 'handoff/app_config.json', encoding='utf-8'))
    meta['codes'] = cm['codes']; meta['config'] = cfg; meta['sourceMeta'] = cm['meta']; meta['world'] = {'events': len(wev), 'strands': len(wstr)}; meta['causes'] = {'rows': len(cau)}
    sizes['index'] = js('index', meta)
    print('wrote', OUT)
    for k, v in sizes.items(): print('  %-8s %7.0f KB' % (k, v / 1024))
    print('library matches:', len(lib), 'of', len(texts), '(%d by close title, not exact)' % len(fuzzy))
    print('books about a tradition: %d links on %d traditions' % (sum(len(v) for v in about.values()), len(about)))
    print('old sources of revived religions: %d links on %d traditions' % (sum(len(v) for v in lore.values()), len(lore)))
    for s in about_skipped + lore_skipped: print('   skipped (not in the Library or the Atlas):', s)
    for f in fuzzy: print('   fuzzy:', f)


if __name__ == '__main__':
    main()
