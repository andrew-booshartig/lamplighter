"""The pass-it-on kit: what someone needs to hand the Lamplighter Project to someone else with no website, no account and no one's permission.
  · handout_html(): one printable page (PASS IT ON.html): what it is, how to open it, which file to take, how to check it arrived whole, how to pass it on, the release stamp. make_release.py writes it beside the zips.
  · make_torrent(): a .torrent file and a magnet link for a release folder (tools/make_torrent.py). A torrent needs no host: people who have the files give them to people who want them.
Nothing here goes online. A torrent made without --tracker works through the clients' own peer finding (DHT); --webseed lets an ordinary web address serve as one more source."""
import datetime, hashlib, html, pathlib, re, urllib.parse

KINDS = [      # the zips the handout offers, in order: (base name, what to tell a reader)
    ('Lamplighter-everything.zip', 'Everything: all the texts, the dictionary, the map, Find similar passages and the Bibles side by side.'),
    ('Lamplighter-sources-only.zip', 'The study library without six optional shelves (occult, Freemasonry, shamanic, folklore, folk tales, the imagined shelf), each of which has a small zip of its own.'),
    ('Lamplighter-with-map.zip', 'The app, the map and the timeline, with no texts. Tiny; texts can be added later.'),
]


def mb(n):
    return f'{n / 1e6:.0f} MB' if n >= 9.5e6 else f'{n / 1e6:.1f} MB'


def pretty_date(date):
    y, m, d = (int(x) for x in date.split('-'))
    return f"{d} {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][m - 1]} {y}"


def handout_html(stamp, texts, rows, everything_sha=None):
    """rows: [(zip file name, size in bytes, what it is)] for the zips that exist; texts: how many readable texts there are; stamp: 2026-11-16-3fa9c1"""
    e = html.escape; date = stamp[:10]
    brk = lambda n: re.sub(r'-(\d{4}-\d\d-\d\d-[0-9a-f]{6}\.zip)$', r'-<wbr>\1', e(n))      # a long zip name breaks before its stamp, not in the middle of it
    table = ''.join(f'<tr><td class="f">{brk(n)}<br><span class="sz">{mb(s)}</span></td><td>{e(w)}</td></tr>' for n, s, w in rows)
    sha = f'<p class="mono">{e(everything_sha)}<br><span>the SHA-256 of {e(rows[0][0])}</span></p>' if everything_sha and rows else ''
    first = e(rows[0][0]) if rows else 'Lamplighter-everything.zip'
    return f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>The Lamplighter Project: pass it on</title>
<style>
@page {{ margin: 11mm 13mm; }}
:root {{ color-scheme: light; }}
* {{ box-sizing: border-box; }}
body {{ font: 9.9pt/1.36 -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; color: #111; background: #fff; max-width: 7.4in; margin: 0 auto; padding: 14px 16px 18px; }}
h1 {{ font-size: 20pt; margin: 0 0 2px; letter-spacing: -.01em; }}
.sub {{ font-size: 11pt; margin: 0 0 6px; color: #333; }}
h2 {{ font-size: 10pt; margin: 8px 0 2px; text-transform: uppercase; letter-spacing: .06em; color: #333; border-bottom: 1px solid #bbb; padding-bottom: 2px; }}
p {{ margin: 3px 0; }}
ol {{ margin: 3px 0 3px 20px; padding: 0; }} li {{ margin: 1px 0; }}
table {{ border-collapse: collapse; width: 100%; margin: 3px 0; }}
td {{ vertical-align: top; padding: 3px 8px 3px 0; border-bottom: 1px solid #ddd; }}
td.f {{ width: 34%; font-weight: 600; font-size: 9pt; overflow-wrap: anywhere; }} .sz {{ font-weight: 400; color: #444; }}
code, .mono {{ font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 8.6pt; }}
.mono {{ margin: 4px 0; word-break: break-all; }} .mono span {{ font-family: inherit; color: #555; font-size: 8pt; }}
.stamp {{ font-size: 13pt; font-weight: 700; letter-spacing: .02em; }}
.blank {{ border-bottom: 1px solid #111; height: 16px; margin-top: 4px; }}
.foot {{ margin-top: 7px; font-size: 8.4pt; color: #444; }}
@media print {{ body {{ padding: 0; max-width: none; }} }}
</style></head><body>
<h1>The Lamplighter Project</h1>
<p class="sub">A free library of the world’s religious writing, to keep and to pass on.</p>
<p>{texts} texts in English (scriptures and sources from every tradition), a map and timeline, a dictionary, and a place for your own notes and texts. It asks for nothing: no account, no payment, no advertising, no tracking, and it works with no internet. It does not tell you what to believe.</p>

<h2>To use it</h2>
<ol><li>Unzip the file. You get one folder called <b>Lamplighter</b>.</li><li>Open the folder and double-click <b>Lamplighter.html</b>. It opens in any web browser (Chrome, Edge, Firefox, Safari, Brave).</li><li>Choose <b>Religion</b>. That is all. Your notes stay in your browser, on your computer.</li></ol>

<h2>Which file to take</h2>
<table>{table}</table>
<p>Small add-on zips, such as <code>Lamplighter-pack-occult</code>, hold one shelf, the dictionary or the Bibles: unzip one next to <b>Lamplighter.html</b> to add it. In the app, “Leave areas out” keeps any shelf out of what you read and search.</p>

<h2>To check that it arrived whole</h2>
<p>Next to the zips is <code>SHA256SUMS.txt</code>. On a Mac or Linux, in that folder: <code>shasum -a 256 -c SHA256SUMS.txt</code>. On Windows: <code>certutil -hashfile {first} SHA256</code>, then compare with the line in the list.</p>
{sha}
<h2>To pass it on</h2>
<p>You do not need anyone’s permission. Copy the zip or the unzipped folder to a USB stick, a school, library or congregation computer, or a phone, and hand this page with it. A torrent of the files can be shared with no website at all. The Lamplighter Project shows its stamp in <b>Setup</b> (at the bottom) and under <b>Religion → Freedom → Take it with you</b>; copies with the same stamp are the same release.</p>

<h2>This copy</h2>
<p><span class="stamp">Release {e(stamp)}</span> &nbsp; (made {pretty_date(date)})</p>
<p>Where to get the files: <span class="blank" style="display:block"></span></p>
<p>Or from: <span class="blank" style="display:block"></span></p>
<p class="foot">The program is free to use, change and share (MIT licence); what was written for it is CC0. The texts keep their own status, named in the folder (<code>texts/LICENSES.txt</code>, <code>LICENSE-CODE.txt</code>, <code>LICENSE-CONTENT.txt</code>). Nothing is sent anywhere: the program does not use the internet.</p>
</body></html>
"""


def bencode(x):
    if isinstance(x, bool): raise TypeError('no booleans in a torrent')
    if isinstance(x, int): return b'i%de' % x
    if isinstance(x, str): x = x.encode('utf8')
    if isinstance(x, bytes): return b'%d:%s' % (len(x), x)
    if isinstance(x, (list, tuple)): return b'l' + b''.join(bencode(i) for i in x) + b'e'
    if isinstance(x, dict):
        items = sorted(((k.encode('utf8') if isinstance(k, str) else k), v) for k, v in x.items())
        return b'd' + b''.join(bencode(k) + bencode(v) for k, v in items) + b'e'
    raise TypeError(f'cannot bencode {type(x).__name__}')


def piece_length_for(total):
    """1 MiB pieces up to 2 GiB, 4 MiB beyond: a few thousand pieces, whatever the size"""
    return 1 << 20 if total < 2 ** 31 else 1 << 22


def make_torrent(folder, files, name, date, trackers=(), webseeds=(), piece_len=None, comment=''):
    """files: names inside `folder`, in any order (they go in sorted). Returns (the .torrent bytes, the info-hash in hex, the magnet link, {file: sha256 hex}).
    The torrent is the same bytes each time for the same files, tracker list and date. The pieces run across files, as the format needs."""
    folder = pathlib.Path(folder); files = sorted(files); total = sum((folder / f).stat().st_size for f in files)
    if not files or total == 0: raise ValueError('nothing to put in a torrent')
    pl = piece_len or piece_length_for(total); pieces = []; buf = bytearray(); sums = {}; entries = []
    for f in files:
        h = hashlib.sha256(); n = 0
        with open(folder / f, 'rb') as fh:
            for chunk in iter(lambda: fh.read(1 << 20), b''):
                h.update(chunk); n += len(chunk); buf += chunk
                while len(buf) >= pl:
                    pieces.append(hashlib.sha1(bytes(buf[:pl])).digest()); del buf[:pl]
        sums[f] = h.hexdigest(); entries.append({'length': n, 'path': f.split('/')})
    if buf: pieces.append(hashlib.sha1(bytes(buf)).digest())
    info = {'name': name, 'piece length': pl, 'pieces': b''.join(pieces), 'files': entries}
    y, m, d = (int(x) for x in date.split('-')); stamp_time = int(datetime.datetime(y, m, d, tzinfo=datetime.timezone.utc).timestamp())
    meta = {'info': info, 'created by': 'Lamplighter tools/make_torrent.py', 'creation date': stamp_time}
    if comment: meta['comment'] = comment
    trackers = [t for t in trackers if t]; webseeds = [w if w.endswith('/') else w + '/' for w in webseeds if w]
    if trackers: meta['announce'] = trackers[0]; meta['announce-list'] = [[t] for t in trackers]
    if webseeds: meta['url-list'] = webseeds
    ih = hashlib.sha1(bencode(info)).hexdigest()
    magnet = f'magnet:?xt=urn:btih:{ih}&dn={urllib.parse.quote(name)}' + ''.join('&tr=' + urllib.parse.quote(t, safe='') for t in trackers) + ''.join('&ws=' + urllib.parse.quote(w, safe='') for w in webseeds)
    return bencode(meta), ih, magnet, sums
