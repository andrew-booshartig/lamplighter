/* ═══════════════════════════ 6zp · Offline and installable, when opened from a web address ═══════════════════════════
   Opened from a file, the Lamplighter Project already works with no connection (the folders beside it are its libraries). Opened from a web address, this file registers a service worker (web/sw.js)
   so the page opens with no connection, links the web app manifest so the browser can offer to install it, and offers to save the libraries into the browser: Setup → Take it with
   you. Everything here talks only to the address the page came from (offline-manifest.json and the five data folders); nothing goes to any other site. The rules for what may be
   fetched are in 2z-offline-core.js. */
const OFF = {
  prompt: null, saving: null,
  ok: () => typeof navigator !== 'undefined' && !!navigator.serviceWorker && typeof caches !== 'undefined' && typeof location !== 'undefined' && offHostedOk(location),
  async manifest() { try { const r = await fetch('offline-manifest.json', { cache: 'no-cache' }); if (!r.ok) return null; const m = offManifestClean(await r.json()); return m.groups.length ? m : null; } catch (e) { return null; } },
  dataName: (m) => 'beatlab-data-' + (m && m.v ? m.v : 'x'),
  /* the paths already saved, as "folder/file" */
  async cached(m) { const set = new Set(); try { const c = await caches.open(OFF.dataName(m)); for (const r of await c.keys()) { const mm = /((?:atlas|texts|bibles|similar|dictionary)\/[^/?#]+)$/.exec(new URL(r.url).pathname); if (mm) set.add(mm[1]); } } catch (e) { /* none */ } return set; },
  /* save a group of files, three at a time, reporting bytes done; ctl.stop = true stops it. Throws the first failure. */
  async save(group, m, onProgress, ctl) {
    const cache = await caches.open(OFF.dataName(m)); const have = await OFF.cached(m); const todo = offMissing(group, have); let done = group.bytes - todo.reduce((n, f) => n + f[1], 0); let i = 0; let err = null;
    if (onProgress) onProgress(done, group.bytes);
    const worker = async () => { while (i < todo.length && !(ctl && ctl.stop) && !err) { const f = todo[i++]; try { const r = await fetch(f[0], { cache: 'no-cache' }); if (!r.ok) throw new Error(f[0] + ' could not be loaded (' + r.status + ')'); await cache.put(f[0], r); done += f[1]; if (onProgress) onProgress(done, group.bytes); } catch (e) { err = e; } } };
    await Promise.all([worker(), worker(), worker()]); if (err) throw err;
  },
  /* an older save, from a build whose files may differ, is dropped when a newer one is saved */
  async dropOld(m) { try { for (const k of await caches.keys()) { if (k.startsWith('beatlab-data-') && k !== OFF.dataName(m) && k !== 'beatlab-data-runtime') await caches.delete(k); } } catch (e) { /* fine */ } },
  async removeAll() { try { for (const k of await caches.keys()) { if (k.startsWith('beatlab-data-')) await caches.delete(k); } return true; } catch (e) { return false; } },
  /* every cache this site has, for Setup → Your data: its name, how many files, and how many bytes when every file in it says how long it is (null when one does not) */
  async copies() {
    const out = [];
    try {
      if (typeof caches === 'undefined') return out;
      for (const name of await caches.keys()) {
        let files = 0; let bytes = 0; let known = name.startsWith('beatlab-data-');
        try { const c = await caches.open(name); const reqs = await c.keys(); files = reqs.length; if (known) { for (const rq of reqs) { const r = await c.match(rq); const n = r && r.headers ? parseInt(r.headers.get('content-length'), 10) : NaN; if (Number.isFinite(n)) bytes += n; else { known = false; break; } } } } catch (e) { known = false; }
        out.push({ name, files, bytes: known ? bytes : null });
      }
    } catch (e) { /* no cache storage here */ }
    return out;
  },
  async drop(name) { try { return await caches.delete(name); } catch (e) { return false; } },
  async usage() { try { return navigator.storage && navigator.storage.estimate ? await navigator.storage.estimate() : null; } catch (e) { return null; } },
  async persist() { try { return navigator.storage && navigator.storage.persist ? await navigator.storage.persist() : false; } catch (e) { return false; } },
  installed: () => { try { return (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || (navigator.standalone === true); } catch (e) { return false; } },
};
if (typeof window !== 'undefined' && window.addEventListener && typeof document !== 'undefined' && document.head && document.createElement) {
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); OFF.prompt = e; });
  window.addEventListener('appinstalled', () => { OFF.prompt = null; try { toast('Installed. It will open like an app.', 'good', 3200); } catch (e) { /* no page */ } });
  if (OFF.ok()) {
    try {
      [['manifest', 'manifest.webmanifest'], ['apple-touch-icon', 'icons/apple-touch-icon.png']].forEach(([rel, href]) => { if (document.head.querySelector && document.head.querySelector(`link[rel="${rel}"]`)) return; const l = document.createElement('link'); l.rel = rel; l.href = href; document.head.appendChild(l); });
      navigator.serviceWorker.register('sw.js').catch(() => { /* a host that does not serve it: the page works as it always did */ });
    } catch (e) { /* no service worker here */ }
  }
}
