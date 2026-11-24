/* The Lamplighter Project's service worker: it lets the app open with no connection once it has been opened (or the libraries saved) from a web address. It never contacts any other site: it works only
   with the address it was served from, answers only GET requests, and keeps nothing but what the app itself asks for. Pages are fetched from the network first, so a new version of the
   app replaces the old one the next time there is a connection; the libraries (texts, Bibles, map, similar passages, dictionary) are served from the cache when saved, and a small one that
   is read is kept for next time. The big libraries are saved only when the reader chooses to, from Freedom → Take it with you. */
const BUILD = '__BUILD__';
const SHELL = 'beatlab-shell-' + BUILD;
const DATA_PREFIX = 'beatlab-data-';
const MAX_RUNTIME = 3 * 1024 * 1024;       // a data file bigger than this is kept only when the reader saves the libraries on purpose
const SHELL_FILES = ['./', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon.svg'];
const isData = (path) => /\/(texts|bibles|atlas|similar|dictionary)\/[^/]+$/.test(path);

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL);
    await Promise.all(SHELL_FILES.concat(['index.html', 'Lamplighter.html']).map(async (f) => { try { const r = await fetch(f, { cache: 'reload' }); if (r.ok) await cache.put(f, r); } catch (e) { /* a file that is not there is fine */ } }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const k of await caches.keys()) { if (k.startsWith('beatlab-shell-') && k !== SHELL) await caches.delete(k); }
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (isData(url.pathname)) {            // the libraries: from the cache if saved, else the network, and a small file is kept
    event.respondWith((async () => {
      const hit = await caches.match(req, { ignoreSearch: true }); if (hit) return hit;
      const res = await fetch(req);
      try { const len = +(res.headers.get('content-length') || 0); if (res.ok && res.status === 200 && len > 0 && len <= MAX_RUNTIME) { const c = await caches.open(DATA_PREFIX + 'runtime'); await c.put(req, res.clone()); } } catch (e) { /* the cache is full or not allowed: just carry on */ }
      return res;
    })());
    return;
  }
  if (req.mode === 'navigate') {         // the app's own page: the network first (so updates arrive), the saved copy when there is no connection
    event.respondWith((async () => {
      try { const res = await fetch(req); if (res.ok) { const c = await caches.open(SHELL); await c.put(url.pathname.endsWith('/') ? './' : url.pathname.split('/').pop() || './', res.clone()); } return res; }
      catch (e) { return (await caches.match(req, { ignoreSearch: true })) || (await caches.match('./')) || (await caches.match('index.html')) || (await caches.match('Lamplighter.html')) || Response.error(); }
    })());
    return;
  }
  event.respondWith((async () => {       // icons, the manifest and the like: the saved copy, else the network
    const hit = await caches.match(req, { ignoreSearch: true }); if (hit) return hit;
    return fetch(req);
  })());
});
