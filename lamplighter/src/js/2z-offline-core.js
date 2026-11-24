/* ═══════════════════════════ 2z · Keeping it offline: what can be saved, and how big it is ═══════════════════════════
   Pure functions. When the Lamplighter Project is opened from a web address (not from a file), a reader can save its libraries into the browser so it works with no connection, and can install it
   like an app. What can be saved comes from offline-manifest.json, written at build time next to the app: the files in each folder and their sizes. Only files in the five
   data folders of the site itself are ever fetched (never a web address of another site), whatever the manifest says. */
const OFF_KINDS = [
  { id: 'atlas', name: 'The map and the list of recorded texts', what: 'Places, dates and a record of every text, for the map.' },
  { id: 'texts', name: 'The Library', what: 'Every readable text, in English.' },
  { id: 'bibles', name: 'The Bibles pack', what: 'Seventeen public-domain Bible versions, side by side.' },
  { id: 'similar', name: 'Find similar passages', what: 'The index behind Find similar and Motifs.' },
  { id: 'dictionary', name: 'The dictionary', what: 'Webster’s 1913 dictionary, for looking up any word in the reader.' },
];
const OFF_PATH = /^(atlas|texts|bibles|similar|dictionary)\/[A-Za-z0-9._-]{1,120}$/;
const offOwn = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
/* a manifest made safe: the build id, and for each folder the files that are really in that folder, with whole-number sizes */
function offManifestClean(m) {
  const out = { v: '', groups: [] }; if (!m || typeof m !== 'object') return out;
  out.v = String(m.v == null ? '' : m.v).replace(/[^A-Za-z0-9._-]/g, '').slice(0, 40); const src = m.files && typeof m.files === 'object' ? m.files : {};
  for (const k of OFF_KINDS) {
    if (!offOwn(src, k.id) || !Array.isArray(src[k.id])) continue; const seen = new Set();
    const files = src[k.id].filter((f) => Array.isArray(f) && typeof f[0] === 'string' && OFF_PATH.test(f[0]) && f[0].startsWith(k.id + '/') && !seen.has(f[0]) && seen.add(f[0])).map((f) => [f[0], Math.max(0, Math.round(+f[1]) || 0)]).slice(0, 5000);
    if (files.length) out.groups.push({ id: k.id, name: k.name, what: k.what, files, count: files.length, bytes: files.reduce((n, f) => n + f[1], 0) });
  }
  return out;
}
const offFmt = (n) => { n = Math.max(0, +n || 0); return n < 1e6 ? Math.max(1, Math.round(n / 1e3)) + ' KB' : n < 1e9 ? (n < 1e7 ? (n / 1e6).toFixed(1) : Math.round(n / 1e6)) + ' MB' : (n / 1e9).toFixed(2) + ' GB'; };
/* the files of a group not yet saved, given the set of paths already in the cache */
const offMissing = (group, cached) => group.files.filter((f) => !cached.has(f[0]));
const offSavedBytes = (group, cached) => group.files.reduce((n, f) => n + (cached.has(f[0]) ? f[1] : 0), 0);
/* is this page served from a web address that can hold a service worker (https, or http on this very computer)? A page opened from a file cannot, and does not need to. */
function offHostedOk(loc) {
  if (!loc || typeof loc.protocol !== 'string') return false; if (loc.protocol === 'https:') return true;
  return loc.protocol === 'http:' && /^(localhost|127\.0\.0\.1|\[::1\])$/.test(String(loc.hostname || ''));
}
/* the built-in browser of a social app, read from the user agent. Facebook and Instagram open a link in a WebView of their own: on an iPhone it keeps no service worker, so there is nowhere to save an offline copy, and what it keeps
   is its own (FBAN/FBIOS and FBAV on an iPhone, FB_IAB and FB4A on Android, "Instagram" in both). A public link shared there is opened in it by most people, so the app says what it cannot do there instead of promising it. */
function offAppBrowser(ua) {
  const u = String(ua || '');
  if (/\b(?:FBAN|FBAV|FBIOS|FB_IAB|FB4A)\b/.test(u)) return 'Facebook';
  if (/\bInstagram\b/i.test(u)) return 'Instagram';
  return '';
}
/* one quiet paragraph for the first-run welcome in such a browser; nothing in any other */
const offAppNote = (ua) => { const n = offAppBrowser(ua); return n ? `<p class="t2 small">You are in ${n}’s own browser. The app works here while you are online, but it cannot be saved for offline use, and your notes may not be kept when you close it. For the whole thing, open this page in your browser: the menu at the top right usually has “Open in browser”.</p>` : ''; };
/* Take it with you, on a web address whose browser cannot keep an offline copy (no service worker or no cache storage, a private window, an older browser, a page without https): what is true, and the way out */
const offNoCopyNote = (ua) => { const n = offAppBrowser(ua); return `<p class="small t2" style="max-width:70ch">This browser cannot save the Lamplighter Project for offline use${n ? ' (you are in ' + n + '’s own browser)' : ''}: it has no service worker or no place to keep a saved copy. That is so in the built-in browsers of Facebook and Instagram, in some private windows, in older browsers and on a page served without https. Everything works here while you are online. To keep an offline copy, open this address in your own browser (Safari, Chrome, Firefox or Edge): in Facebook or Instagram the menu at the top right usually has “Open in browser”.</p>`; };
const offPct = (done, total) => (total > 0 ? Math.max(0, Math.min(100, Math.round(100 * done / total))) : 0);
/* a plain-language state for one group */
function offState(group, cached) {
  const miss = offMissing(group, cached).length; if (miss === 0) return 'saved'; if (miss === group.count) return 'none'; return 'part';
}
if (typeof module !== 'undefined' && module.exports) module.exports = { OFF_KINDS, OFF_PATH, offManifestClean, offFmt, offMissing, offSavedBytes, offHostedOk, offAppBrowser, offAppNote, offNoCopyNote, offPct, offState };
