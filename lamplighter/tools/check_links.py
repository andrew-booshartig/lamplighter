"""Checks that every link in src/js/2l-data-path-traditions.js answers. Run: python3 -I tools/check_links.py
Sites that refuse automated requests (403/429) are listed but are usually fine in a browser; 404s and DNS failures are real."""
import re, sys, json, urllib.request, urllib.error, concurrent.futures as cf, ssl
import pathlib
src = (pathlib.Path(__file__).resolve().parent.parent / 'src/js/2l-data-path-traditions.js').read_text(encoding='utf-8')
urls = sorted(set(re.findall(r"'(https?://[^']+)'", src)))
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15'
ctx = ssl.create_default_context()
def check(u):
    for method in ('HEAD', 'GET'):
        try:
            req = urllib.request.Request(u, method=method, headers={'User-Agent': UA, 'Accept': 'text/html,*/*'})
            with urllib.request.urlopen(req, timeout=20, context=ctx) as r: return u, r.status, r.geturl()
        except urllib.error.HTTPError as e:
            if method == 'HEAD' and e.code in (403, 405, 400, 501): continue
            return u, e.code, ''
        except Exception as e:
            if method == 'HEAD': continue
            return u, 'ERR ' + type(e).__name__ + ' ' + str(e)[:60], ''
    return u, '?', ''
with cf.ThreadPoolExecutor(8) as ex: res = list(ex.map(check, urls))
bad = [(u, s) for u, s, _ in res if not (isinstance(s, int) and s < 400)]
print(len(urls), 'urls;', len(bad), 'not clean')
for u, s in bad: print('  ', s, u)
