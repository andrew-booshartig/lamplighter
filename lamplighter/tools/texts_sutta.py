"""The Pali Canon in English: Bhikkhu Sujato’s translations from SuttaCentral (bilara-data), released under CC0 (public domain dedication).
Files are fetched individually from raw.githubusercontent.com (the repository is ~1 GB with every language, so we only take translation/en/sujato/sutta)."""
import json, re, concurrent.futures as cf, urllib.request, pathlib, time

API = 'https://api.github.com/repos/suttacentral/bilara-data/git/trees/'
RAW = 'https://raw.githubusercontent.com/suttacentral/bilara-data/published/translation/en/sujato/sutta/'
LICENSE = 'CC0 (public domain dedication): translation by Bhikkhu Sujato, from SuttaCentral'
SRC = 'https://suttacentral.net'
UA = 'text-fetch/1.0'


def _get(url, timeout=60):
    for a in range(4):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': UA}), timeout=timeout) as r: return r.read()
        except Exception:
            if a == 3: raise
            time.sleep(2 * (a + 1))


def list_files(cache):
    dest = cache / 'sutta' / 'tree.json'
    if dest.exists(): return json.loads(dest.read_text())
    sha = 'published'
    for part in ['translation', 'en', 'sujato', 'sutta']:
        d = json.loads(_get(API + sha)); sha = [x['sha'] for x in d['tree'] if x['path'] == part][0]; time.sleep(1)
    d = json.loads(_get(API + sha + '?recursive=1')); files = [x['path'] for x in d['tree'] if x['type'] == 'blob' and x['path'].endswith('_translation-en-sujato.json')]
    dest.parent.mkdir(parents=True, exist_ok=True); dest.write_text(json.dumps(files)); return files


VIN_RAW = 'https://raw.githubusercontent.com/suttacentral/bilara-data/published/translation/en/brahmali/vinaya/'
VIN_LICENSE = 'CC0 (public domain dedication): translation by Bhikkhu Brahmali, from SuttaCentral'


def list_vinaya(cache):
    """Bhikkhu Brahmali's Vinaya translation: the same SuttaCentral repository, translation/en/brahmali/vinaya."""
    dest = cache / 'sutta' / 'vinaya_tree.json'
    if dest.exists(): return json.loads(dest.read_text())
    sha = 'published'
    for part in ['translation', 'en', 'brahmali', 'vinaya']:
        d = json.loads(_get(API + sha)); sha = [x['sha'] for x in d['tree'] if x['path'] == part][0]; time.sleep(1)
    d = json.loads(_get(API + sha + '?recursive=1')); files = [x['path'] for x in d['tree'] if x['type'] == 'blob' and x['path'].endswith('_translation-en-brahmali.json')]
    dest.parent.mkdir(parents=True, exist_ok=True); dest.write_text(json.dumps(files)); return files


def fetch_files(files, cache, workers=6, raw=RAW, sub='files'):
    base = cache / 'sutta' / sub
    def one(p):
        dest = base / p.replace('/', '__')
        if dest.exists() and dest.stat().st_size: return p
        dest.parent.mkdir(parents=True, exist_ok=True); dest.write_bytes(_get(raw + p)); time.sleep(0.05); return p
    with cf.ThreadPoolExecutor(workers) as ex: list(ex.map(one, files))


def read_file(cache, p, sub='files'):
    return json.loads((cache / 'sutta' / sub / p.replace('/', '__')).read_text(encoding='utf-8'))


def render(seg):
    """segments dict → (heading, body text) with paragraph breaks where the section number changes."""
    head = []; paras = []; cur = []; last = None
    for k, v in seg.items():
        v = v.strip()
        if not v: continue
        m = re.match(r'^[^:]+:([\d.]+)$', k)
        if not m: continue
        idx = m.group(1).split('.')
        if idx[0] == '0': head.append(v); continue
        key = idx[0] + ('.' + idx[1] if len(idx) > 2 else '')
        if last is not None and key != last and cur: paras.append(' '.join(cur)); cur = []
        cur.append(v); last = key
    if cur: paras.append(' '.join(cur))
    return ' · '.join(head), '\n\n'.join(paras)


def sort_key(p):
    return [int(x) if x.isdigit() else x for x in re.split(r'(\d+)', p)]


def build(lib, cache):
    files = list_files(cache); wanted = [p for p in files if re.match(r'(dn|mn|sn|an|kn)/', p)]
    print('  suttas: %d files' % len(wanted)); fetch_files(wanted, cache)
    byfam = {}
    for p in sorted(wanted, key=sort_key): byfam.setdefault(p.split('/')[0], []).append(p)
    res = {}
    import build_texts_util as U
    def entry(secs, note=''): return dict(secs=U.finish(secs, False), by='Bhikkhu Sujato (SuttaCentral)', license=LICENSE, src=SRC, verse=False, note=note)
    KN = {'kp': 'Khuddakapāṭha', 'dhp': 'Dhammapada', 'ud': 'Udāna', 'iti': 'Itivuttaka', 'snp': 'Sutta Nipāta', 'thag': 'Theragāthā', 'thig': 'Therīgāthā', 'cp': 'Cariyāpiṭaka', 'ja': 'Jātaka (selected tales)'}
    # DN and MN: one section per sutta
    for fam, lid, label in (('dn', 'x-dn', 'Dīgha Nikāya'), ('mn', 'x-mn', 'Majjhima Nikāya')):
        secs = []
        for p in byfam.get(fam, []):
            h, b = render(read_file(cache, p))
            if b: secs.append([h or p, b])
        if secs: res[lid] = entry(secs, label + ': the Long / Middle Discourses of the Buddha.')
    # SN: one section per saṁyutta (groups of suttas); AN: per nipāta; KN: per work (chunked later if long)
    def grouped(fam, depth_rx):
        groups = {}
        for p in byfam.get(fam, []):
            g = re.match(depth_rx, p).group(1); h, b = render(read_file(cache, p))
            if b: groups.setdefault(g, []).append('## ' + (h or p) + '\n\n' + b)
        return groups
    for fam, lid, rx, lab, note in (('sn', 'x-sn', r'sn/(sn\d+)/', 'Saṁyutta', 'Saṁyutta Nikāya: the Linked Discourses, grouped by saṁyutta.'), ('an', 'x-an', r'an/(an\d+)/', 'Nipāta', 'Aṅguttara Nikāya: the Numerical Discourses, grouped by book (nipāta).'), ('kn', 'x-kn', r'kn/([a-z]+)/', 'Work', 'Khuddaka Nikāya: the Minor Collection (Khuddakapāṭha, Dhammapada, Udāna, Itivuttaka, Sutta Nipāta, Theragāthā, Therīgāthā, Cariyāpiṭaka and others in this translation).')):
        g = grouped(fam, rx)
        if g: res[lid] = entry([[(KN.get(k, k.upper()) if fam == 'kn' else '%s %s' % (lab, k.upper())), '\n\n'.join(v)] for k, v in sorted(g.items(), key=lambda kv: sort_key(kv[0]))], note)
    # single suttas the library lists on their own
    def single(path_prefix, lid, note):
        ps = [p for p in files if p.startswith(path_prefix)]
        secs = []
        for p in sorted(ps, key=sort_key):
            h, b = render(read_file(cache, p))
            if b: secs.append([h, b])
        if secs: res[lid] = entry(secs, note)
    single('mn/mn118_', 'x-anap', 'Majjhima Nikāya 118 (Ānāpānasati Sutta).')
    single('kn/snp/vagga1/snp1.8_', 'x-metta', 'Sutta Nipāta 1.8 (Karaṇīya Mettā Sutta).')
    single('sn/sn56/sn56.11_', 'x-dhc', 'Saṁyutta Nikāya 56.11 (Dhammacakkappavattana Sutta).')
    try: res.update(build_vinaya(cache))
    except Exception as ex: print('  FAILED vinaya', ex)
    return res


VIN_GROUPS = {'pj': 'Pārājika (defeat)', 'ss': 'Saṅghādisesa (formal meeting of the Saṅgha)', 'ay': 'Aniyata (undetermined)', 'np': 'Nissaggiya Pācittiya (forfeiture and confession)', 'pc': 'Pācittiya (confession)',
              'pd': 'Pāṭidesanīya (acknowledgement)', 'sk': 'Sekhiya (training rules)', 'as': 'Adhikaraṇasamatha (settling disputes)'}


def build_vinaya(cache):
    """The Pali Vinaya Piṭaka in Bhikkhu Brahmali's CC0 translation: Pātimokkhas, the two Vibhaṅgas, the Khandhakas and the Parivāra."""
    import build_texts_util as U
    files = list_vinaya(cache); print('  vinaya: %d files' % len(files)); fetch_files(files, cache, raw=VIN_RAW, sub='vfiles')
    rd = lambda p: render(read_file(cache, p, 'vfiles'))
    def block(paths):
        out = []
        for p in sorted(paths, key=sort_key):
            h, b = rd(p)
            if b: out.append('## ' + (h or p.split('/')[-1].split('_')[0]) + '\n\n' + b)
        return '\n\n'.join(out)
    secs = []
    for p, label in (('pli-tv-bu-pm_', 'Bhikkhu Pātimokkha (the 227 rules for monks)'), ('pli-tv-bi-pm_', 'Bhikkhunī Pātimokkha (the rules for nuns)')):
        for f in files:
            if f.startswith(p):
                h, b = rd(f)
                if b: secs.append([label, b])
    for fam, label in (('pli-tv-bu-vb', 'Bhikkhu Vibhaṅga'), ('pli-tv-bi-vb', 'Bhikkhunī Vibhaṅga')):
        groups = {}
        for f in files:
            parts = f.split('/')
            if parts[0] != fam or len(parts) < 2: continue
            m = re.match(re.escape(fam) + r'-([a-z]+)', parts[1]); groups.setdefault(m.group(1) if m else parts[1], []).append(f)
        for g in ('pj', 'ss', 'ay', 'np', 'pc', 'pd', 'sk', 'as'):
            if g in groups:
                body = block(groups.pop(g))
                if body: secs.append(['%s · %s' % (label, VIN_GROUPS[g]), body])
        for g, fs in sorted(groups.items()):
            body = block(fs)
            if body: secs.append(['%s · %s' % (label, g), body])
    kd = [f for f in files if f.startswith('pli-tv-kd/')]
    for f in sorted(kd, key=sort_key):
        h, b = rd(f)
        if b: secs.append([h or f.split('/')[-1].split('_')[0], b])
    pv = [f for f in files if f.startswith('pli-tv-pvr/')]
    if pv: secs.append(['Parivāra (the Compendium)', block(pv)])
    return {'x-vin': dict(secs=U.finish(secs, False), by='Bhikkhu Brahmali (SuttaCentral)', license=VIN_LICENSE, src=SRC, verse=False,
                          note='The Vinaya Piṭaka (monastic discipline): the Pātimokkhas, the Vibhaṅgas (the rules with their origin stories and analysis), the Khandhakas and the Parivāra.')}
