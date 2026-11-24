/* Larger text (AA-23 of ALPHA_AUDIT.md, 21 November 2026): Setup → Larger text (Normal, Larger, Largest = 100, 125 and 150 percent of the base 15 px) kept in the existing settings object, and the style sheet's own text in rem, so one
   root size scales it. The reader's own size (Aa), SVG labels and the fixed-pitch charts keep their pixels. No browser is needed: the stylesheet and the sources are read as text, and the helper block of 67-setup.js is run against a stub.
   Run: node tests/larger-text.test.js */
const fs = require('fs'); const path = require('path');
const css = fs.readFileSync(path.join(__dirname, '../src/css/app.css'), 'utf8'); const setup = fs.readFileSync(path.join(__dirname, '../src/js/67-setup.js'), 'utf8');
let pass = 0; let fail = 0; const ok = (n, c, x) => { if (c) pass++; else { fail++; console.log('FAIL', n, x === undefined ? '' : JSON.stringify(x).slice(0, 400)); } };
const plain = css.replace(/\/\*[\s\S]*?\*\//g, '');

/* ── the helper block of 67-setup.js, run against a stand-in for Settings and the page ── */
const a = setup.indexOf('const TEXT_SIZES'); const b = setup.indexOf('applyTextSize();', a);
ok('the helper block (the sizes, the key, the apply function and its first call) is there', a > 0 && b > a);
const block = setup.slice(a, b + 'applyTextSize();'.length);
const make = (saved) => { const data = { textSize: saved }; const root = { dataset: {} }; const doc = { documentElement: root }; const Settings = { get: (k) => data[k], set: (k, v) => { data[k] = v; } }; const api = new Function('Settings', 'document', block + '\nreturn { TEXT_SIZES, textSizeKey, applyTextSize };')(Settings, doc); return { api, root, data, Settings }; };
{
  const n = make(undefined); ok('with nothing saved the page has no data-text-size (the size is Normal) and the key is normal', n.api.textSizeKey() === 'normal' && !('textSize' in n.root.dataset));
  ok('the three sizes are 100, 125 and 150 percent of the base text', JSON.stringify(n.api.TEXT_SIZES) === JSON.stringify({ normal: 100, larger: 125, largest: 150 }));
  const l = make('larger'); ok('a saved Larger is set on the page when the script loads', l.root.dataset.textSize === 'larger' && l.api.textSizeKey() === 'larger');
  const x = make('largest'); ok('a saved Largest is set on the page when the script loads', x.root.dataset.textSize === 'largest');
  x.data.textSize = 'normal'; x.api.applyTextSize(); ok('going back to Normal takes the attribute off the page (nothing is left behind)', !('textSize' in x.root.dataset));
  x.data.textSize = 'larger'; x.api.applyTextSize(); x.data.textSize = 'largest'; x.api.applyTextSize(); ok('one size replaces another', x.root.dataset.textSize === 'largest');
  for (const bad of ['huge', 'constructor', '__proto__', 150, null, {}, '']) { const y = make(bad); ok('a value that is not one of the three (' + String(typeof bad === 'object' ? JSON.stringify(bad) : bad) + ') is read as Normal and sets nothing on the page', y.api.textSizeKey() === 'normal' && !('textSize' in y.root.dataset)); }
  const noPage = new Function('Settings', 'document', block + '\nreturn 1;'); ok('a page with no element to set it on does not stop the script (the test harness and old shells)', (() => { try { noPage({ get: () => 'larger' }, {}); noPage({ get: () => 'larger' }, { documentElement: null }); return true; } catch (e) { return false; } })());
}

/* ── Setup: the control, its words, and where it is kept ── */
ok('Setup has a Larger text row in Preferences, with a slot for the control and a line saying what it does and what it leaves alone', /<label class="lbl">Larger text<\/label><div id="textSlot"><\/div><div class="hint">[^<]*125%[^<]*150%[^<]*reader keeps its own size under Aa/.test(setup));
ok('the control offers Normal, Larger and Largest, starts on the saved size, and a choice is stored in the settings object (Settings.set textSize) and applied at once', /UI\.seg\(\{ label: 'Larger text', options: \[\{ v: 'normal', label: 'Normal' \}, \{ v: 'larger', label: 'Larger' \}, \{ v: 'largest', label: 'Largest' \}\], value: textSizeKey\(\), onChange: \(v\) => \{ Settings\.set\('textSize', v\); applyTextSize\(\); \} \}\)/.test(setup));
ok('the setting uses no storage name of its own: nothing but the settings object is written for it', !/store\.set\([^)]*[Tt]ext[Ss]ize/.test(setup) && !/localStorage[^;]*[Tt]ext[Ss]ize/.test(setup));

/* ── the style sheet ── */
ok('the root takes 125% for Larger and 150% for Largest, from the attribute', /html\[data-text-size="larger"\]\{font-size:125%\}/.test(plain) && /html\[data-text-size="largest"\]\{font-size:150%\}/.test(plain));
ok('the page text is in rem: the body is 15 px at 100% (0.9375 of the 16 px root)', /body\{[^}]*font:0\.9375rem\/1\.55 var\(--font\)/.test(plain));
const rules = []; { let m; const re = /([^{}]*)\{([^{}]*)\}/g; while ((m = re.exec(plain))) rules.push({ sel: m[1].trim(), decl: m[2] }); }
const px = rules.filter((r) => /font(-size)?:[^;}]*\d(\.\d+)?px/.test(r.decl) && !/var\(--rt-size/.test(r.decl));
const allowed = (s) => /(^|[\s,>+~])\.(wlane|wtick|wera|wnum|cs-t|sf-n|sf-l|sf-m|sk-lb|sk-lb2|sk-mid|sk-mid2|sk-cn|tr-nm|tr-tg|hx-tk|hx-era|hx-rl|hx-lb|hx-gh|shnum|pvt-box|nb-letter|nav)\b/.test(s);
const left = px.filter((r) => !allowed(r.sel)).map((r) => r.sel.slice(-40));
ok('every font size left in pixels is one of the drawings’ own labels or a decoration (the World chart, SVG text, the tree’s and the history chart’s rows, the huge letters); the app’s own text has none', left.length === 0, left);
ok('the reader’s own size is untouched (it still comes from --rt-size, not from the root)', /var\(--rt-size,18px\)/.test(plain) && !/--rt-size[^;}]*rem/.test(plain));
ok('more than four hundred sizes are in rem now', (plain.match(/font-size:[0-9.]+rem/g) || []).length > 400, (plain.match(/font-size:[0-9.]+rem/g) || []).length);
ok('no size was lost on the way: no font-size is left as 0.0000 or a rem that is not a multiple of 1/32', (plain.match(/font-size:([0-9.]+)rem/g) || []).every((s) => { const v = parseFloat(s.slice(10)); return v > 0.2 && Math.abs(v * 32 - Math.round(v * 32)) < 1e-6; }));

console.log(`larger text: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
