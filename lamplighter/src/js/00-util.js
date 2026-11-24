/* ═══════════════════════════ 00 · utilities ═══════════════════════════ */
'use strict';
const APP = { name: 'The Lamplighter Project', short: 'Lamplighter', legacy: ['Beatlab'], version: 'unstamped', release: null, ns: 'beatlab.v1.', url: '' };      // build.py replaces version and release with the release stamp (tools/stamp_lib.py; words in 2y-release-core.js). url: the app's own public address, once it has one: citations leave it out while it is empty (2z-cite-core.js)

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const isNum = (x) => typeof x === 'number' && isFinite(x);

/* tiny event emitter */
function Emitter() {
  const m = {};
  return {
    on(e, f) { (m[e] = m[e] || []).push(f); return () => { m[e] = (m[e] || []).filter((x) => x !== f); }; },
    emit(e, d) { (m[e] || []).slice().forEach((f) => { try { f(d); } catch (err) { console.error(err); } }); },
  };
}

/* persistent storage with graceful fallback */
const store = (() => {
  const mem = {};
  let ok = true;
  try { localStorage.setItem('__t', '1'); localStorage.removeItem('__t'); } catch (e) { ok = false; }
  return {
    persistent: ok,
    get(k, d) {
      try { const raw = ok ? localStorage.getItem(APP.ns + k) : mem[k]; return raw == null ? d : JSON.parse(raw); } catch (e) { return d; }
    },
    set(k, v) {
      const raw = JSON.stringify(v);
      try { if (ok) localStorage.setItem(APP.ns + k, raw); else mem[k] = raw; } catch (e) { mem[k] = raw; }
    },
    del(k) { try { if (ok) localStorage.removeItem(APP.ns + k); } catch (e) { /* ignore */ } delete mem[k]; },
    all() {
      const out = {};
      try {
        if (ok) for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k.startsWith(APP.ns)) out[k.slice(APP.ns.length)] = JSON.parse(localStorage.getItem(k)); }
        else for (const k in mem) out[k] = JSON.parse(mem[k]);
      } catch (e) { /* ignore */ }
      return out;
    },
    clear() { Object.keys(store.all()).forEach((k) => store.del(k)); },
  };
})();

/* randomness (randInt, randFloat, shuffle, pick, randHex, draw codes, your own timing) lives in 01-random.js */
function uid() { return Date.now().toString(36) + randU32().toString(36).slice(0, 5); }

/* SHA-256 (pure JS, so it works on file:// where crypto.subtle may be unavailable) */
const sha256 = (() => {
  const K = []; const H0 = [];
  const primes = []; for (let n = 2; primes.length < 64; n++) { let p = true; for (let d = 2; d * d <= n; d++) if (n % d === 0) { p = false; break; } if (p) primes.push(n); }
  const frac = (x) => x - Math.floor(x);
  for (let i = 0; i < 64; i++) K.push(Math.floor(frac(Math.cbrt(primes[i])) * 4294967296) >>> 0);
  for (let i = 0; i < 8; i++) H0.push(Math.floor(frac(Math.sqrt(primes[i])) * 4294967296) >>> 0);
  const rotr = (x, n) => (x >>> n) | (x << (32 - n));
  return function sha256(str) {
    const msg = new TextEncoder().encode(str);
    const l = msg.length; const bitLen = l * 8;
    const padLen = ((l + 9 + 63) >> 6) << 6;
    const buf = new Uint8Array(padLen); buf.set(msg); buf[l] = 0x80;
    const dv = new DataView(buf.buffer);
    dv.setUint32(padLen - 8, Math.floor(bitLen / 4294967296)); dv.setUint32(padLen - 4, bitLen >>> 0);
    const h = H0.slice(); const w = new Uint32Array(64);
    for (let off = 0; off < padLen; off += 64) {
      for (let i = 0; i < 16; i++) w[i] = dv.getUint32(off + i * 4);
      for (let i = 16; i < 64; i++) {
        const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
        const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
      }
      let [a, b, c, d, e, f, g, hh] = h;
      for (let i = 0; i < 64; i++) {
        const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
        const ch = (e & f) ^ (~e & g);
        const t1 = (hh + S1 + ch + K[i] + w[i]) >>> 0;
        const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
        const maj = (a & b) ^ (a & c) ^ (b & c);
        const t2 = (S0 + maj) >>> 0;
        hh = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
      }
      h[0] = (h[0] + a) >>> 0; h[1] = (h[1] + b) >>> 0; h[2] = (h[2] + c) >>> 0; h[3] = (h[3] + d) >>> 0;
      h[4] = (h[4] + e) >>> 0; h[5] = (h[5] + f) >>> 0; h[6] = (h[6] + g) >>> 0; h[7] = (h[7] + hh) >>> 0;
    }
    return h.map((x) => x.toString(16).padStart(8, '0')).join('');
  };
})();

/* formatting */
const fmt = {
  hz: (x, d = 2) => (isNum(x) ? x.toFixed(d) : '—'),
  num: (x, d = 1) => (isNum(x) ? (Math.round(x * 10 ** d) / 10 ** d).toString() : '—'),
  pct: (x, d = 0) => (isNum(x) ? (x * 100).toFixed(d) + '%' : '—'),
  p: (p) => (!isNum(p) ? '—' : p < 0.001 ? '<0.001' : p.toFixed(3)),
  time: (s) => { s = Math.max(0, Math.round(s)); const h = Math.floor(s / 3600); const m = Math.floor((s % 3600) / 60); const ss = s % 60; return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(ss).padStart(2, '0'); },
  date: (t) => new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
  dt: (t) => new Date(t).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
  signed: (x, d = 1) => (isNum(x) ? (x > 0 ? '+' : '') + x.toFixed(d) : '—'),
};
function isoDay(d = new Date()) { const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000); return z.toISOString().slice(0, 10); }
function download(filename, text, mime = 'application/json') {
  const blob = new Blob([text], { type: mime }); const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 500);
}
function debounce(fn, ms = 200) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }

/* ───────────── icons ───────────── */
const ICONS = {
  studio: '<path d="M2 12h3l2.5-7 4 14 3-9 2 4H22"/>',
  presets: '<rect x="3.5" y="3.5" width="7" height="7" rx="2"/><rect x="13.5" y="3.5" width="7" height="7" rx="2"/><rect x="3.5" y="13.5" width="7" height="7" rx="2"/><rect x="13.5" y="13.5" width="7" height="7" rx="2"/>',
  flask: '<path d="M9 3h6M10 3v6.2L4.6 18.4A2 2 0 0 0 6.3 21.5h11.4a2 2 0 0 0 1.7-3.1L14 9.2V3"/><path d="M7.5 15h9"/>',
  journal: '<path d="M5 4.5A2.5 2.5 0 0 1 7.5 2H19v17H7.5A2.5 2.5 0 0 0 5 21.5z"/><path d="M5 4.5v17M9.5 7H15M9.5 10.5H13"/>',
  learn: '<path d="M9 18h6M10 21.5h4M12 2.5a6.2 6.2 0 0 0-3.6 11.3c.7.5 1.1 1.3 1.1 2.2h5c0-.9.4-1.7 1.1-2.2A6.2 6.2 0 0 0 12 2.5z"/>',
  headphones: '<path d="M4 15v-3a8 8 0 0 1 16 0v3"/><path d="M4 15h3.2v5.2H5.4A1.4 1.4 0 0 1 4 18.8zM20 15h-3.2v5.2h1.8a1.4 1.4 0 0 0 1.4-1.4z"/>',
  play: '<path fill="currentColor" stroke="none" d="M8 4.8v14.4a.8.8 0 0 0 1.2.7l12-7.2a.8.8 0 0 0 0-1.4l-12-7.2A.8.8 0 0 0 8 4.8z"/>',
  stop: '<rect fill="currentColor" stroke="none" x="6" y="6" width="12" height="12" rx="2.2"/>',
  pause: '<rect fill="currentColor" stroke="none" x="6" y="5" width="4" height="14" rx="1.2"/><rect fill="currentColor" stroke="none" x="14" y="5" width="4" height="14" rx="1.2"/>',
  check: '<path d="M4.5 12.5l5 5 10-11"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  trash: '<path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13M10 11v6M14 11v6"/>',
  chevron: '<path d="M6 9l6 6 6-6"/>',
  download: '<path d="M12 3v12M7 10.5l5 5 5-5M4 20h16"/>',
  upload: '<path d="M12 16V4M7 8.5l5-5 5 5M4 20h16"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.6v.1"/>',
  shield: '<path d="M12 3l7.5 3v5.5c0 4.6-3.1 8.2-7.5 9.5-4.4-1.3-7.5-4.9-7.5-9.5V6z"/><path d="M9 12l2.2 2.2L15.5 10"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/>',
  lock: '<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
  dice: '<rect x="4" y="4" width="16" height="16" rx="3.5"/><circle cx="9" cy="9" r="1" fill="currentColor"/><circle cx="15" cy="15" r="1" fill="currentColor"/><circle cx="15" cy="9" r="1" fill="currentColor"/><circle cx="9" cy="15" r="1" fill="currentColor"/>',
  target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1" fill="currentColor"/>',
  path: '<path d="M8 21.5c-2.5-3.8 8.5-4.2 8-9.5-.4-4.2-7.5-3.6-7.7-8"/><circle cx="8" cy="21.5" r="1.2"/><circle cx="8.3" cy="4" r="1.2"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3.2 3 3.2 15 0 18M12 3c-3.2 3-3.2 15 0 18"/>',
  lotus: '<path d="M12 5c2 2.2 3 4.4 3 6.8S13.7 16 12 17c-1.7-1-3-2.8-3-5.2S10 7.2 12 5z"/><path d="M12 17c-2.8.3-5.3-.8-7.5-3.4 3.3-.6 5.5.3 7.5 3.4zM12 17c2.8.3 5.3-.8 7.5-3.4-3.3-.6-5.5.3-7.5 3.4z"/><path d="M6 20h12"/>',
  ear: '<path d="M6 8.5a6.5 6.5 0 1 1 13 0c0 6-6 6-6 10a3.5 3.5 0 1 1-7 0"/><path d="M15 8.5a2.5 2.5 0 0 0-5 0v1a2 2 0 1 1 0 4"/>',
  heart: '<path d="M12 20.5S3.5 15 3.5 9A4.6 4.6 0 0 1 12 6.6 4.6 4.6 0 0 1 20.5 9c0 6-8.5 11.5-8.5 11.5z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6"/>',
  moon: '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5z"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1"/>',
  wave: '<path d="M2 12c2-6 4-6 6 0s4 6 6 0 4-6 6 0"/>',
  chart: '<path d="M4 20V4M4 20h16M8 16l3.5-4.5 3 3L20 8"/>',
  swap: '<path d="M7 7h12l-3-3M17 17H5l3 3"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.2 2"/>',
  sparkle: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM18.5 16l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z"/>',
  warn: '<path d="M12 3.5l9.5 16.5h-19z"/><path d="M12 10v4.5M12 17.2v.1"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
  more: '<circle cx="5" cy="12" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="19" cy="12" r="1.6" fill="currentColor"/>',
  book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5"/>',
  list: '<path d="M8 6h12M8 12h12M8 18h12"/><circle cx="4" cy="6" r=".9" fill="currentColor"/><circle cx="4" cy="12" r=".9" fill="currentColor"/><circle cx="4" cy="18" r=".9" fill="currentColor"/>',
  bookmark: '<path d="M7 3.5h10a1 1 0 0 1 1 1V21l-6-4.2L6 21V4.5a1 1 0 0 1 1-1z"/>',
  pen: '<path d="M4 20l1-4L16.5 4.5a2 2 0 0 1 3 3L8 19z"/><path d="M14.5 6.5l3 3"/>',
  threads: '<circle cx="6" cy="6" r="2.2"/><circle cx="18" cy="8" r="2.2"/><circle cx="8" cy="18" r="2.2"/><path d="M8 6.5l8 1M7 8l1 8M17 10l-7.5 7"/>',
  copy: '<rect x="8.5" y="8.5" width="12" height="12" rx="2.2"/><path d="M15.5 8.5V5.2a1.7 1.7 0 0 0-1.7-1.7H5.2a1.7 1.7 0 0 0-1.7 1.7v8.6a1.7 1.7 0 0 0 1.7 1.7h3.3"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="M15.9 8.1l-2.2 5.6-5.6 2.2 2.2-5.6z"/>',
  tree: '<path d="M12 21v-8M12 13c-3.5 0-6-1.8-6-4M12 13c3.5 0 6-1.8 6-4M12 13V5"/><circle cx="6" cy="7.6" r="1.6"/><circle cx="18" cy="7.6" r="1.6"/><circle cx="12" cy="3.8" r="1.6"/>',
  expand: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  layers: '<path d="M12 3.5l9 4.8-9 4.8-9-4.8z"/><path d="M3 12.6l9 4.8 9-4.8M3 16.9l9 4.8 9-4.8"/>',
  chevup: '<path d="M6 15l6-6 6 6"/>',
  pin: '<path d="M9 4h6l-.9 5.6L17 13H7l2.9-3.4z"/><path d="M12 13v7.5"/>'
};
function icon(name, cls = '') {
  return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;
}

/* ───────────── DOM helpers ───────────── */
function h(html) { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; }

/* toasts */
function toast(msg, kind = '', ms = 3600) {
  let host = $('.toasts'); if (!host) { host = h('<div class="toasts" role="status" aria-live="polite"></div>'); document.body.appendChild(host); }
  const t = h(`<div class="toast ${kind}">${msg}</div>`); host.appendChild(t);
  setTimeout(() => { t.style.transition = 'opacity .3s'; t.style.opacity = '0'; setTimeout(() => t.remove(), 320); }, ms);
}

/* modal → Promise<value>. A dialog a screen reader can name (aria-labelledby points at its title), that keeps Tab inside it while it is open, and that gives the focus back to the control that opened it
   when it closes (UX-14 of UX_AUDIT.md); Escape still closes it. The word card has its own code and is not changed. */
let MODAL_N = 0;
function modal({ title = '', html = '', actions = [{ label: 'OK', kind: 'primary', value: true }], dismissible = true }) {
  return new Promise((resolve) => {
    const opener = document.activeElement; const tid = 'mdlT' + (++MODAL_N);
    const back = h(`<div class="modal-back" role="dialog" aria-modal="true"${title ? ` aria-labelledby="${tid}"` : ''}><div class="modal" tabindex="-1">${title ? `<h2 id="${tid}">${title}</h2>` : ''}<div class="mbody">${html}</div><div class="actions">${actions.map((a, i) => `<button class="btn ${a.kind || ''}" data-i="${i}">${a.label}</button>`).join('')}</div></div></div>`);
    /* L-04 of FINAL_AUDIT.md: a dialog belongs to the page it was opened on. When the address changes (Back or Forward, a link inside the dialog, a typed address) it closes as if dismissed; the page behind it has just been drawn again. A dialog a page opens while it is drawn is opened after the change, so it keeps the address it was opened at.
       pushState and replaceState fire neither event, so a page that only writes its own state into the address does not close it. */
    const here = () => (typeof location !== 'undefined' && location ? String(location.hash || '') : ''); const at = here(); const wired = typeof window !== 'undefined' && window && typeof window.addEventListener === 'function';
    const onRoute = () => { if (here() !== at) close(undefined); };
    const close = (v) => { back.remove(); document.removeEventListener('keydown', onKey); if (wired) { window.removeEventListener('hashchange', onRoute); window.removeEventListener('popstate', onRoute); } try { if (opener && opener !== document.body && opener.isConnected && typeof opener.focus === 'function') opener.focus({ preventScroll: true }); } catch (e) { /* the control that opened it is gone */ } resolve(v); };
    const tabbable = () => Array.from(back.querySelectorAll('a[href],button,input,select,textarea,summary,[tabindex]')).filter((el) => !el.disabled && el.type !== 'hidden' && el.tabIndex >= 0 && el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden');
    const onKey = (e) => {
      if (e.key === 'Escape' && dismissible) { close(undefined); return; }
      if (e.key !== 'Tab') return;
      const open = document.querySelectorAll('.modal-back'); if (open[open.length - 1] !== back) return;      /* with two dialogs open, the upper one holds the focus */
      const list = tabbable(); if (!list.length) { e.preventDefault(); back.modalEl.focus(); return; }
      const first = list[0]; const last = list[list.length - 1]; const at = document.activeElement;
      if (!back.contains(at) || at === back.modalEl || (e.shiftKey ? at === first : at === last)) { e.preventDefault(); (e.shiftKey ? last : first).focus(); }
    };
    document.addEventListener('keydown', onKey);
    if (wired) { window.addEventListener('hashchange', onRoute); window.addEventListener('popstate', onRoute); }
    back.addEventListener('click', (e) => {
      if (e.target === back && dismissible) close(undefined);
      const b = e.target.closest('button[data-i]'); if (!b) return;
      const act = actions[+b.dataset.i]; close(act.collect ? act.collect(back) : act.value); // collect() may read form fields before the dialog is removed
    });
    document.body.appendChild(back);
    /* the cursor goes where the typing is: the first text field, when the dialog has one (AA-02 of ALPHA_AUDIT.md: it used to go to the Save button, so the first space pressed it and the note was lost). A choice (a checkbox, a radio button) is not a field.
       A dialog with no field keeps the cursor on its main button, and a question like Delete everything, whose first button is Cancel, keeps it on Cancel. */
    const mb = $('.mbody', back); const field = mb && Array.from(mb.querySelectorAll('textarea, select, input')).find((el) => !el.disabled && !el.readOnly && !/^(hidden|checkbox|radio|range|button|submit|reset|file|color|image)$/i.test(el.type || '') && (!el.getClientRects || el.getClientRects().length));
    const first = field || $('button.primary', back) || $('button', back); if (first) first.focus();
    if (field && typeof field.setSelectionRange === 'function') { try { const n = String(field.value || '').length; field.setSelectionRange(n, n); } catch (e) { /* a kind of field that has no caret */ } }      // typing adds to what is there (a note being edited) and does not replace it
    back.close = close; back.modalEl = $('.modal', back);
  });
}
const confirmBox = (title, html, yes = 'Confirm', kind = 'primary') => modal({ title, html, actions: [{ label: 'Cancel', kind: 'ghost', value: false }, { label: yes, kind, value: true }] });

/* ───────────── reusable controls ───────────── */
const UI = {
  /* info toggle button + panel */
  infoBtn(text) { return `<button type="button" class="info-btn" aria-expanded="false" aria-label="More info" data-info>i</button>`; },
  wireInfo(root) {
    $$('[data-info]', root).forEach((b) => {
      if (b._w) return; b._w = true;
      b.addEventListener('click', (e) => {
        e.preventDefault(); e.stopPropagation();
        const host = b.closest('[data-info-host]'); const p = host && $('.info-panel', host);
        if (!p) return; const open = p.classList.toggle('hide') === false; b.setAttribute('aria-expanded', open);
      });
    });
  },

  /* slider (linear or log) with typed value box */
  slider(o) {
    const { id, label, min, max, step = 1, value, unit = '', log = false, dec = 2, info = '', ends = null, onInput = () => {}, fmtFn = null, disabled = false } = o;
    const el = h(`<div class="ctl" data-info-host data-slider="${id || ''}">
      <div class="ctl-head"><div class="ctl-label"><span>${label}</span>${info ? UI.infoBtn() : ''}</div>
      <div class="ctl-value"><input class="val" inputmode="decimal" aria-label="${esc(label)} value"><span class="unit">${unit}</span></div></div>
      <input class="range" type="range" min="0" max="1000" step="1" aria-label="${esc(label)}">
      ${ends ? `<div class="ctl-ends"><span>${ends[0]}</span><span>${ends[1]}</span></div>` : ''}
      ${info ? `<div class="info-panel hide">${info}</div>` : ''}</div>`);
    const r = $('.range', el); const v = $('.val', el);
    const toPos = (x) => (log ? Math.log(x / min) / Math.log(max / min) : (x - min) / (max - min)) * 1000;
    const fromPos = (p) => { const t = p / 1000; return log ? min * Math.pow(max / min, t) : min + (max - min) * t; };
    const snap = (x) => { x = clamp(x, min, max); return step ? Math.round(x / step) * step : x; };
    let cur = snap(value);
    const show = () => { r.value = toPos(cur); r.style.setProperty('--p', (toPos(cur) / 10) + '%'); if (document.activeElement !== v) v.value = fmtFn ? fmtFn(cur) : cur.toFixed(dec); };
    r.addEventListener('input', () => { cur = snap(fromPos(+r.value)); show(); v.value = fmtFn ? fmtFn(cur) : cur.toFixed(dec); onInput(cur, true); });
    const commit = () => { const x = parseFloat(String(v.value).replace(/[^0-9.\-]/g, '')); if (isFinite(x)) { cur = snap(x); onInput(cur, true); } show(); };
    v.addEventListener('change', commit); v.addEventListener('keydown', (e) => { if (e.key === 'Enter') { v.blur(); } });
    v.addEventListener('focus', () => v.select());
    r.disabled = disabled; v.disabled = disabled;
    show(); UI.wireInfo(el);
    return { el, get: () => cur, set(x, silent = true) { cur = snap(x); show(); if (!silent) onInput(cur, false); }, setDisabled(d) { r.disabled = d; v.disabled = d; el.style.opacity = d ? 0.5 : 1; } };
  },

  /* segmented control */
  seg({ options, value, onChange = () => {}, small = false, label = '' }) {
    const el = h(`<div class="seg${small ? ' sm' : ''}" role="radiogroup" aria-label="${esc(label)}">${options.map((o) => `<button type="button" role="radio" data-v="${esc(o.v)}" aria-pressed="false" ${o.title ? `title="${esc(o.title)}"` : ''}>${o.label}</button>`).join('')}</div>`);
    let cur = value;
    const show = () => $$('button', el).forEach((b) => { const on = b.dataset.v === String(cur); b.setAttribute('aria-pressed', on); b.setAttribute('aria-checked', on); });
    el.addEventListener('click', (e) => { const b = e.target.closest('button[data-v]'); if (!b) return; cur = options.find((o) => String(o.v) === b.dataset.v).v; show(); onChange(cur, true); });
    show();
    return { el, get: () => cur, set(v) { cur = v; show(); } };
  },

  switchEl({ label, checked = false, onChange = () => {} }) {
    const el = h(`<label class="switch"><input type="checkbox"${checked ? ' checked' : ''}><span class="tr"></span><span>${label}</span></label>`);
    const i = $('input', el); i.addEventListener('change', () => onChange(i.checked));
    return { el, get: () => i.checked, set(v) { i.checked = !!v; } };
  },

  evidence(level, label = true) {
    const names = ['No credible evidence', 'Preliminary', 'Mixed', 'Modest support'];
    return `<span class="ev l${level}" title="Strength of the evidence: ${names[level]}"><span class="dots">${[1, 2, 3].map((i) => `<i class="${i <= level ? 'on' : ''}"></i>`).join('')}</span>${label ? names[level] : ''}</span>`;
  },
  callout(kind, text, ic = 'info') { return `<div class="callout ${kind}">${icon(ic)}<div>${text}</div></div>`; },
};

const prefersReducedMotion = () => document.documentElement.classList.contains('reduce-motion') || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);

if (typeof module !== 'undefined' && module.exports) module.exports = { sha256, clamp, lerp };
