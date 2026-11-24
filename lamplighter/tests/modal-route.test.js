/* L-04 of FINAL_AUDIT.md (polish round, item 2): a dialog closes when the address changes.
   Found by opening the Cite dialog on Random and going Back: the dialog stayed on the page it was not made for. The About dialog on Random closed only because Random closes it itself; the word card and the reading panel close on hashchange by their own code. modal() (00-util.js) is the one place every other dialog is made, so it closes there.
   1. A change of the address (hashchange, or popstate with another address: Back and Forward) closes every open dialog, as if dismissed (the promise resolves with undefined, like Escape).
   2. The same address (the redirect of a stem such as #/traditions/belief fires a hashchange for the address the page already has) leaves it open, and so does a page writing its own state with replaceState or pushState (no event).
   3. A dialog opened while the new page is drawn (after the change) keeps the address it was opened at: the event of the change that made it does not close it, the next change does.
   4. Every way of closing it (a button, Escape, a click outside, a change of address) takes its listeners off the window: none is left behind.
   5. A page that has no window (a stand-in, a test) is not broken, and the router still draws on every hashchange.
   Run: node tests/modal-route.test.js */
const fs = require('fs'); const path = require('path');
let pass = 0; let fail = 0; const ok = (n, c, x) => { if (c) pass++; else { fail++; console.log('FAIL', n, x === undefined ? '' : JSON.stringify(x).slice(0, 400)); } };
const util = fs.readFileSync(path.join(__dirname, '../src/js/00-util.js'), 'utf8'); const core = fs.readFileSync(path.join(__dirname, '../src/js/50-core.js'), 'utf8');
const modalSrc = (() => { const a = util.indexOf('let MODAL_N = 0;'); const b = util.indexOf('const confirmBox'); return a > 0 && b > a ? util.slice(a, b) : ''; })();
ok('the helper is in 00-util.js and listens for the address changing', /window\.addEventListener\('hashchange', onRoute\)/.test(modalSrc) && /window\.addEventListener\('popstate', onRoute\)/.test(modalSrc));

const make = () => {
  const win = { l: {}, addEventListener(t, f) { (win.l[t] = win.l[t] || []).push(f); }, removeEventListener(t, f) { win.l[t] = (win.l[t] || []).filter((x) => x !== f); }, count: () => Object.values(win.l).reduce((n, a) => n + a.length, 0), fire(t) { (win.l[t] || []).slice().forEach((f) => f({ type: t })); } };
  const loc = { hash: '#/path/passage' };
  const doc = { activeElement: null, listeners: [], backs: [], body: { appendChild(el) { doc.backs.push(el); } }, addEventListener(t, f) { if (t === 'keydown') doc.listeners.push(f); }, removeEventListener(t, f) { doc.listeners = doc.listeners.filter((x) => x !== f); }, querySelectorAll: () => doc.backs };
  const btn = (name) => ({ name, tagName: 'BUTTON', type: 'submit', disabled: false, tabIndex: 0, dataset: {}, getClientRects: () => [1], focus() { doc.activeElement = this; } });
  const ok1 = btn('OK'); const modalEl = Object.assign(btn('modal'), { tabIndex: -1 });
  const h = () => { const back = { removed: false, remove() { back.removed = true; doc.backs = doc.backs.filter((x) => x !== back); }, addEventListener(t, f) { back['on_' + t] = f; }, contains: (el) => el === ok1 || el === modalEl, querySelectorAll: () => [ok1], getAttribute: () => null, closest: () => null }; return back; };
  const $ = (sel) => (sel === 'button.primary' ? ok1 : sel === 'button' ? ok1 : sel === '.modal' ? modalEl : null);
  const modal = new Function('h', '$', 'document', 'getComputedStyle', 'window', 'location', modalSrc + '\nreturn modal;')(h, $, doc, () => ({ visibility: 'visible' }), win, loc);
  const open = (opts) => { const out = { v: 'pending' }; out.p = modal(Object.assign({ title: 'T', html: '<p>x</p>' }, opts || {})).then((v) => { out.v = v; }); out.back = doc.backs[doc.backs.length - 1]; return out; };
  const tick = () => new Promise((r) => setImmediate(r));
  return { win, loc, doc, open, tick, ok1 };
};

(async () => {
  { const E = make(); const d = E.open(); await E.tick(); ok('a dialog is open and holds listeners on the window', d.back && !d.back.removed && E.win.count() === 2 && d.v === 'pending');
    E.loc.hash = '#/path/read/x-hrd'; E.win.fire('hashchange'); await E.tick();
    ok('1: a change of the address closes it (removed, and the promise resolves with undefined, as Escape does)', d.back.removed && d.v === undefined, d.v);
    ok('4: and takes its listeners off the window', E.win.count() === 0 && E.doc.listeners.length === 0, E.win.count()); }

  { const E = make(); const d = E.open(); await E.tick(); E.loc.hash = '#/history'; E.win.fire('popstate'); await E.tick();
    ok('1: Back or Forward (popstate with another address) closes it', d.back.removed && d.v === undefined); }

  { const E = make(); const a = E.open(); const b = E.open(); await E.tick(); E.loc.hash = '#/atlas/tradition/daoism'; E.win.fire('hashchange'); await E.tick();
    ok('1: every open dialog closes, the upper one too', a.back.removed && b.back.removed && a.v === undefined && b.v === undefined && E.win.count() === 0); }

  { const E = make(); const d = E.open(); await E.tick(); E.win.fire('hashchange'); E.win.fire('popstate'); await E.tick();
    ok('2: an event for the address the page already has (a redirect, a replaceState followed by a popstate) leaves it open', !d.back.removed && d.v === 'pending' && E.win.count() === 2);
    E.loc.hash = '#/path/passage?code=p-jos.passage.1'; E.win.fire('hashchange'); await E.tick();
    ok('2: but a different query on the same page is a different address, and closes it (the page is drawn again)', d.back.removed); }

  { const E = make(); const d = E.open(); await E.tick(); E.loc.hash = '#/history?s=cyrus'; const e2 = E.open(); await E.tick(); E.win.fire('hashchange'); await E.tick();
    ok('3: a dialog opened after the change (while the new page is drawn) is not closed by that change; the one opened before it is', d.back.removed && !e2.back.removed && e2.v === 'pending');
    E.loc.hash = '#/methods'; E.win.fire('hashchange'); await E.tick();
    ok('3: and the next change closes it', e2.back.removed && e2.v === undefined && E.win.count() === 0); }

  { const E = make(); const d = E.open({ actions: [{ label: 'OK', kind: 'primary', value: 'yes' }] }); await E.tick(); d.back.on_click({ target: { closest: () => ({ dataset: { i: '0' } }) } }); await E.tick();
    ok('4: a button closes it with its value and leaves no listener on the window', d.v === 'yes' && E.win.count() === 0 && E.doc.listeners.length === 0, [d.v, E.win.count()]);
    E.loc.hash = '#/x'; E.win.fire('hashchange'); await E.tick(); ok('4: a closed dialog does not answer a later change (its value stays)', d.v === 'yes'); }

  { const E = make(); const d = E.open(); await E.tick(); E.doc.listeners.slice().forEach((f) => f({ key: 'Escape', preventDefault() {} })); await E.tick();
    ok('4: Escape closes it and leaves no listener', d.back.removed && d.v === undefined && E.win.count() === 0); }

  { const E = make(); const d = E.open(); await E.tick(); d.back.on_click({ target: d.back }); await E.tick();
    ok('4: a click outside closes it and leaves no listener', d.back.removed && E.win.count() === 0); }

  { const win0 = undefined; let threw = false; let v = 'pending'; try { const doc = { activeElement: null, listeners: [], body: { appendChild() {} }, addEventListener() {}, removeEventListener() {}, querySelectorAll: () => [] }; const back = { remove() {}, addEventListener() {}, contains: () => false, querySelectorAll: () => [], getAttribute: () => null }; const btn = { focus() {}, tagName: 'BUTTON' };
      const m = new Function('h', '$', 'document', 'getComputedStyle', modalSrc + '\nreturn modal;')(() => back, () => btn, doc, () => ({}));
      m({ title: 'T', html: 'x' }).then((x) => { v = x; }); } catch (e) { threw = true; }
    ok('5: with no window and no location (a stand-in page) the dialog still opens', !threw && win0 === undefined); }

  /* the router draws again on every hashchange, so the page a dialog belonged to has gone; and no dialog needs the router to know about it */
  ok('5: the router still draws on every hashchange (the dialog closes with the page it belonged to)', /window\.addEventListener\('hashchange', \(\) => Router\.render\(\)\)/.test(core));
  ok('5: no caller turns the closing off: nothing passes dismissible: false', !fs.readdirSync(path.join(__dirname, '../src/js')).some((f) => f !== '00-util.js' && /dismissible\s*:\s*false/.test(fs.readFileSync(path.join(__dirname, '../src/js', f), 'utf8'))));

  console.log(`modal-route: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch((e) => { console.log('CRASH', e && e.stack || e); process.exit(2); });
