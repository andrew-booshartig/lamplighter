// Run: node tests/privacy.test.js — the promise that nothing about a reader leaves their device, checked against the source and the built app on every run:
// no network requests except the one small module that loads the app's own files from its own address, no cookies, no tracker, no font, script, style or picture from another site,
// no sensors, and every link out to another site opens in a new tab only when clicked and without handing over the page. A failure here is a broken promise, not a style point.
const fs = require('fs'); const path = require('path');
const root = path.join(__dirname, '..'); const jsDir = path.join(root, 'src/js');
let pass = 0; let fail = 0; const ok = (n, c, x = '') => { if (c) pass++; else { fail++; console.log('FAIL', n, typeof x === 'string' ? x : JSON.stringify(x).slice(0, 500)); } };
const files = fs.readdirSync(jsDir).filter((f) => f.endsWith('.js')).map((f) => ({ name: f, text: fs.readFileSync(path.join(jsDir, f), 'utf8') }));
const css = fs.readFileSync(path.join(root, 'src/css/app.css'), 'utf8'); const sw = fs.readFileSync(path.join(root, 'web/sw.js'), 'utf8');
const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1');
const code = files.map((f) => ({ name: f.name, text: stripComments(f.text) }));
const where = (re, list = code) => list.flatMap((f) => (f.text.match(re) || []).map((m) => `${f.name}: ${m.slice(0, 80)}`));
const DATA = /^(2[a-z]-data|2z-data|2[a-z]-lessons|2[a-z]-data-)|^(2[0-9]|2[a-k])-.*(data|lessons)/;     // data files hold web addresses as text, to be shown as links

/* 1. the network */
const net = where(/\b(XMLHttpRequest|sendBeacon|WebSocket|EventSource|RTCPeerConnection|importScripts)\b/g);
ok('nothing opens a socket, a beacon, an XMLHttpRequest or a peer connection', net.length === 0, net);
const fetchers = code.filter((f) => /\bfetch\s*\(/.test(f.text)).map((f) => f.name);
ok('fetch is used by two modules only: the one that loads the app’s own files for offline use (and by the service worker), and the one that reads the app’s own text files as data so that a search of every text lets each go (AA-01 of ALPHA_AUDIT.md)', fetchers.every((n) => n === '6zp-offline.js' || n === '6c-texts.js'), fetchers);
{ const tx = code.find((f) => f.name === '6c-texts.js').text; const tcalls = tx.match(/\bfetch\s*\([^)]*\)/g) || [];
  ok('the one fetch in the texts module is for a text file of the same site: the texts/ folder beside the page plus the id, never a web address, and only on a copy that is not a file', tcalls.length === 1 && /^fetch\(\s*TXT\.base \+ id \+ '\.js'\s*\)$/.test(tcalls[0]) && /base: 'texts\/'/.test(tx) && /copyWhere\(\) === 'file'/.test(tx), tcalls); }
const offl = code.find((f) => f.name === '6zp-offline.js').text; const calls = offl.match(/\bfetch\s*\([^)]*\)/g) || [];
ok('every fetch there is for a file of the same site: a relative name, never a web address', calls.length >= 2 && calls.every((c) => !/https?:|\/\/[a-z]/i.test(c) && (/fetch\(\s*['"]offline-manifest\.json['"]/.test(c) || /fetch\(\s*f\[0\]/.test(c))), calls);
ok('the files it may fetch are the four data folders and nothing else (the manifest is cleaned by a rule that the offline tests attack)', /offManifestClean/.test(offl) && /OFF_PATH/.test(fs.readFileSync(path.join(jsDir, '2z-offline-core.js'), 'utf8')));
const swc = stripComments(sw); ok('the service worker fetches only from its own origin', /\.origin\s*!==\s*self\.location\.origin/.test(swc) && !/https?:\/\//i.test(swc));
ok('no page code reads or sends the clipboard in the background (copying is only ever on a click)', where(/clipboard\.read\w*\(/g).length === 0);

/* 2. cookies, sensors, other storage */
ok('no cookies are set or read', where(/document\.cookie/g).length === 0);
ok('no location, camera, microphone or sensors are asked for', where(/geolocation|getUserMedia|webkitGetUserMedia|requestMIDIAccess|DeviceMotionEvent\.requestPermission|navigator\.bluetooth|navigator\.usb|navigator\.hid/g).length === 0, where(/geolocation|getUserMedia/g));
const rawLS = where(/\blocalStorage\.(setItem|getItem|removeItem|clear)\b/g).filter((x) => !x.startsWith('00-util.js'));
ok('browser storage is used through the app’s one store, which is prefixed and wrapped in try/catch', rawLS.length === 0 && /beatlab\.v1\./.test(files.find((f) => f.name === '00-util.js').text), rawLS);

/* 3. nothing is loaded from another site */
const loads = where(/<(script|link|img|iframe|embed|object|video|audio|source|track)\b[^>]*\b(src|href|data)\s*=\s*["'`]?\s*(https?:)?\/\//gi, code.filter((f) => !DATA.test(f.name)));
ok('no script, style, picture, frame, font or media file is loaded from another site in the page’s code', loads.length === 0, loads);
ok('no code sets a source to a web address (scripts and pictures are only ever the app’s own files)', where(/\.(src|href)\s*=\s*['"`]https?:/g).length === 0, where(/\.(src|href)\s*=\s*['"`]https?:/g));
const scriptSrc = code.flatMap((f) => (f.text.match(/\.src\s*=(?!=)\s*[^;]+;/g) || []).map((st) => ({ f: f.name, st }))).filter((x) => /https?:|\/\/|\.(js|css|png|jpe?g|gif|svg|webp|woff2?|ttf|mp3|mp4)\b/i.test(x.st)).filter((x) => !/(TXT\.base|ATLD\.base|BIB\.base|DICT\.base|'similar\/'|'bibles\/'|'atlas\/')/.test(x.st)); ok('every script or picture the app adds to the page is one of its own data files', scriptSrc.length === 0, scriptSrc);
ok('the style sheet loads nothing from outside (no @import, no url() of a web address, no font from another site)', !/@import|url\(\s*['"]?\s*(https?:)?\/\//i.test(css), css.match(/@import[^;]*|url\(\s*['"]?\s*(https?:)?\/\/[^)]*/gi));
const TRACKERS = /google-analytics|googletagmanager|doubleclick|googlesyndication|facebook\.net|connect\.facebook|fbcdn|hotjar|mixpanel|segment\.(io|com)|sentry\.io|cloudflareinsights|amplitude\.com|clarity\.ms|matomo\.(org|cloud)|plausible\.io|fullstory|newrelic|datadoghq|intercom\.io|hubspot|tiktok|platform\.twitter|fonts\.googleapis|fonts\.gstatic|cdnjs|jsdelivr|unpkg|bootstrapcdn|ajax\.googleapis/i;
ok('no tracker, advertising, analytics, font or script host is named anywhere in the app’s code or style sheet', !TRACKERS.test(code.map((f) => f.text).join('\n')) && !TRACKERS.test(css), (code.map((f) => f.text).join('\n') + css).match(TRACKERS));

/* 4. links to other sites */
const all = files.map((f) => f.text).join('\n'); const blank = all.match(/<a\b[^>]*target\s*=\s*["']_blank["'][^>]*>/g) || [];
ok('every link that opens a new tab says rel="noopener noreferrer", so the other site learns nothing about this page', blank.length > 0 && blank.every((t) => /rel\s*=\s*["'][^"']*noopener[^"']*noreferrer|rel\s*=\s*["'][^"']*noreferrer[^"']*noopener/.test(t)), blank.filter((t) => !/noopener/.test(t)).slice(0, 3));
ok('the one helper that makes outside links does so', /const ext = \(url, text\) => `<a href="\$\{esc\(url\)\}" target="_blank" rel="noopener noreferrer">/.test(files.find((f) => f.name === '69-path.js').text));
const opens = where(/window\.open\s*\(/g); ok('no code opens another site in the background', opens.length === 0, opens);
const hosts = new Set(); (all.match(/https?:\/\/[A-Za-z0-9.-]+/g) || []).forEach((u) => hosts.add(u.replace(/^https?:\/\//, '').replace(/^www\./, '')));
console.log(`  (${hosts.size} other sites are named as links to click, in text and data; none is contacted by the app)`);
ok('no web address with a login or key in it (nothing like https://user:pass@ or ?token= or ?key=)', !/https?:\/\/[^\s"'`]*(:[^\s/@"'`]*@|[?&](token|key|apikey|api_key|secret|password)=)/i.test(all));

/* 5. the built page */
const built = path.join(root, 'dist/Lamplighter.html');
if (fs.existsSync(built)) {
  const h0 = fs.readFileSync(built, 'utf8'); const h = h0.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, (m) => m.slice(0, m.indexOf('>') + 1) + '</script>'); const head = h.slice(0, h.indexOf('<body'));      // the tags of the page, not the text of the program inside the one inline script
  ok('the built page is one file: no external script, no external style sheet, no preloads, no web fonts', !/<script[^>]*\bsrc\s*=/i.test(h) && !/<link[^>]*rel\s*=\s*["'](stylesheet|preload|prefetch|preconnect|dns-prefetch)/i.test(h) && !/<link[^>]*href\s*=\s*["']https?:/i.test(h) && !/<meta[^>]*http-equiv\s*=\s*["']refresh/i.test(h));
  ok('the only thing its head links to is its own picture, as data inside the page', (head.match(/<link\b[^>]*>/g) || []).every((l) => /rel="icon"\s+href="data:/.test(l)), head.match(/<link\b[^>]*>/g));
  ok('the built page, program included, contains no tracker or advertising host', !TRACKERS.test(h0), h0.match(TRACKERS));
} else console.log('  (dist/Lamplighter.html not built: run python3 build.py to check the built page too)');
console.log(`privacy: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
