/* The phone and accessibility round of 18 November 2026 (UX-10, 11, 14, 29, 30 and 31 of UX_AUDIT.md), kept from slipping back. No browser is needed: the stylesheet and the sources are read as text.
   1. Touch targets: on a coarse pointer or under 760 px every control has a touch area of at least 40 px on its short side, by a minimum size where it sits in the flow and by an invisible ::after (or a
      transparent stroke, in a drawing) where it does not; the arithmetic is done here from the sizes in the stylesheet.
   2. A strip of tabs that scrolls says so: an arrow at the edge that has more, taking no room.
   3. Contrast in the light theme (verse numbers, the “Attested” tag, the rhythm step numbers), worked out from the tokens with the tint blended in.
   4. Reduced motion: the classes whose short animations ignored it now stop, by the system setting and by Setup's class.
   5. modal() (00-util.js): named for a screen reader, Tab kept inside, focus given back; run here against a small stand-in for the page.
   6. The voice list shows six names and a button for the rest.
   Run: node tests/tap.test.js */
const fs = require('fs'); const path = require('path');
const css = fs.readFileSync(path.join(__dirname, '../src/css/app.css'), 'utf8'); const util = fs.readFileSync(path.join(__dirname, '../src/js/00-util.js'), 'utf8'); const vc = fs.readFileSync(path.join(__dirname, '../src/js/32-voice-chooser.js'), 'utf8');
let pass = 0; let fail = 0; const ok = (n, c, x) => { if (c) pass++; else { fail++; console.log('FAIL', n, x === undefined ? '' : JSON.stringify(x).slice(0, 400)); } };

/* ── reading the stylesheet ── */
const plain = css.replace(/\/\*[\s\S]*?\*\//g, '');
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const inner = (text, openAt) => { const o = text.indexOf('{', openAt); let d = 0; for (let j = o; j < text.length; j++) { if (text[j] === '{') d++; else if (text[j] === '}') { d--; if (d === 0) return text.slice(o + 1, j); } } return ''; };
const rulesOf = (body) => { const out = []; let i = 0; while (i < body.length) { const o = body.indexOf('{', i); if (o < 0) break; const sel = body.slice(i, o).trim(); let d = 0; let j = o; for (; j < body.length; j++) { if (body[j] === '{') d++; else if (body[j] === '}') { d--; if (d === 0) break; } } out.push({ sel, decl: body.slice(o + 1, j) }); i = j + 1; } return out; };
const at = plain.indexOf('@media (pointer:coarse),(max-width:760px){'); const touch = at >= 0 ? rulesOf(inner(plain, at)) : [];
const find = (sel) => touch.filter((r) => r.sel.split(',').map((s) => s.trim()).includes(sel));
const prop = (rs, p) => { for (const r of rs.slice().reverse()) { const m = r.decl.match(new RegExp('(?:^|;)\\s*' + esc(p) + ':\\s*([^;]+)')); if (m) return m[1].trim(); } return ''; };
const px = (v) => (/^-?[\d.]+px$/.test(v || '') ? parseFloat(v) : NaN);
const base = (sel) => { const m = plain.match(new RegExp('(?:^|[\\s}])' + esc(sel) + '\\{([^}]*)\\}')); return m ? m[1] : ''; };
const baseProp = (sel, p) => { const m = base(sel).match(new RegExp('(?:^|;)\\s*' + esc(p) + ':\\s*([^;]+)')); return m ? m[1].trim() : ''; };

/* ── 1. touch targets ── */
ok('there is one block for a coarse pointer or a narrow screen, with the rules of the round', at >= 0 && touch.length > 20, touch.length);
const minH = ['.chip', '.hx-chip', '.seg button', '.btn.sm', '.smore summary', '.smore-menu a', '.gl-azb', '.input', '.select', '.nbk-find', '.hx-era-sel', '.ctl-value input', 'input[type=range]', '.switch', '.chk', '.check', '.sk-sysnav a', '.pgbrk', 'details>summary'];
ok('every one of these has a minimum height of 40 px or more (chips, segmented buttons, small buttons, inputs, sliders, switches, tick-box rows, accordions, More)', minH.every((s) => px(prop(find(s), 'min-height')) >= 40), minH.filter((s) => !(px(prop(find(s), 'min-height')) >= 40)));
ok('the list of History (a row of the list view) is 44 px high', px(prop(find('.hx-li'), 'min-height')) >= 44);
ok('small buttons, segmented buttons, the glossary letters, verse buttons and the links in the ring’s list are 40 px wide as well as high', ['.btn.sm', '.seg button', '.gl-azb', '.bbnum'].every((s) => px(prop(find(s), 'min-width')) >= 40) && px(prop(find('.cg-panel li>a'), 'min-width')) >= 40);
ok('a summary with no padding of its own gets 10 px above and below its text', prop(find('details>summary'), 'padding-block') === '10px');
ok('the Master timeline’s chips (a rule of two classes that beat the touch rule and left them 23 px high) are padded 9 px above and below, and reach 40 through the minimum', /^9px /.test(prop(find('.tl-body .chip'), 'padding')) && px(prop(find('.chip'), 'min-height')) >= 40);
ok('a link that stands alone in a list, a table cell or a timeline entry is a block of 11 px above and below its line (about 40 px), a heat-map cell is 40 px high and at least 42 wide', ['.linklist a', '.tl-body>a:first-child', 'td>b>a', '.heat th a', '.atl-list li>a', '.cg-panel li>a', '.mov-pend b>a', '.card-title h3 a'].every((s) => prop(find(s), 'display') === 'inline-block' && prop(find(s), 'padding-block') === '11px') && px(prop(find('.heat td'), 'height')) === 40 && px(prop(find('.heat td'), 'min-width')) >= 42);
/* an absolute box starts inside the border, so a bordered control gets the border added back */
const inset = (sel) => { const v = prop(find(sel), 'inset').split(/\s+/).map(px); return v.length === 1 ? [v[0], v[0], v[0], v[0]] : v.length === 2 ? [v[0], v[1], v[0], v[1]] : v.length === 4 ? v : [NaN, NaN, NaN, NaN]; };
const hit = (sel, w, h) => { const [t, r, b, l] = inset(sel); return { w: w - t * 0 + (-l) + (-r), h: h + (-t) + (-b) }; };
const trTg = hit('.tr-tg::after', 41 - 2, parseFloat(baseProp('.tr-tg', 'height')) - 2); const trNm = hit('.tr-nm::after', 100, parseFloat(baseProp('.tr-nm', 'line-height')));
const info = hit('.info-btn::after', parseFloat(baseProp('.info-btn', 'width')) - 2, parseFloat(baseProp('.info-btn', 'height')) - 2); const pbm = hit('.pbm::after', 20, 20);
ok('the family tree’s toggle (17 px high with a border) and name (18 px) get a touch area 40 px high, and the toggle is 27 px wide or more before the ring', trTg.h >= 40 && trNm.h >= 40 && trTg.w >= 27 + 14, [trTg, trNm]);
ok('the small round “i” button (20 px with a border) gets a 40 px square, and a paragraph’s bookmark (20 px) a touch area 40 px high and 30 px wide (the other 10 px would lie over the text)', info.w >= 40 && info.h >= 40 && pbm.h >= 40 && pbm.w >= 30, [info, pbm]);
ok('each of them is positioned (the ::after is absolute inside it; the pbm and the mark already are) and none of the ::after boxes draws anything', /\.info-btn,\.tr-tg,\.tr-nm\{position:relative\}/.test(plain) && ['.info-btn::after', '.pbm::after', '.tr-tg::after', '.tr-nm::after', '.hx-mk::after'].every((s) => prop(find(s), 'content') === '""' && prop(find(s), 'position') === 'absolute' && !/background|border|box-shadow/.test(find(s)[0].decl)));
ok('the marks of the History line (9 px wide on a 30 px lane) get what room the lane allows, and on a phone the page opens on its list instead', inset('.hx-mk::after').every((v) => v < 0) && /if \(phone && !\(query && \(query\.v === 'line' \|\| query\.v === 'list'\)\)\) st\.view = 'list';/.test(fs.readFileSync(path.join(__dirname, '../src/js/6pw-history.js'), 'utf8')));
ok('the points of the map of centres (5 px) are given a transparent ring of 21 px that does not scale with the map: a touch area of 40 px or more', prop(find('.cs-pt circle'), 'stroke') === 'transparent' && px(prop(find('.cs-pt circle'), 'stroke-width')) >= 40 && prop(find('.cs-pt circle'), 'vector-effect') === 'non-scaling-stroke');
ok('the reader’s icons in the bar are 40 px wide on a phone too (they were 34), and the title keeps its room: Find leaves the bar under 421 px (it is in the sheet and the menu), so six icons, the gaps and 80 px of title fit 343 px', /@media \(max-width:420px\)\{\.rdtop\{gap:1px;padding:6px 3px\}\.rdb\{min-width:40px;padding:0 4px\}/.test(plain) && /@media \(max-width:420px\)\{\.rdtop \[data-rdsheet="find"\]\{display:none\}\}/.test(plain) && 6 * 40 + 5 * 1 + 2 * 3 + 80 <= 343);
ok('FA-08: at 420 px or less the reader’s bar is two rows, the icons and then the title and the counter side by side across the whole width (the markup keeps its order), so the one counter is never cut: the app column is 343 px at 375 and 288 px at 320, and the second row, less its padding, holds the longest counter seen (139 px, “Page 1 of 110 · Chapter 1”), the gap and 72 px of title at both', /@media \(max-width:420px\)\{\s*\.rdtop\{flex-wrap:wrap;row-gap:0;padding-bottom:2px\} \.rdbtns\{order:1;margin-left:auto\}\s*\.rdtt\{order:2;flex:1 0 100%;flex-direction:row;[^}]*min-height:30px[^}]*\}\s*\.rdtt b\{flex:1 1 0;min-width:4\.5rem\} \.rdtt span\{flex:0 1 auto;min-width:0\}/.test(plain) && [343, 288].every((w) => w - 12 >= 139 + 8 + 72) && /\.reader\{scroll-margin-top:84px\} \.rdsec h3\.rtitle\{scroll-margin-top:88px\}/.test(plain));

/* ── 2. a strip of tabs that scrolls says so ── */
const strip = (() => { const i = plain.indexOf('.secbar .ptabs.more-r,.secbar .ptabs.more-l{'); const j = plain.indexOf('@media (max-width:720px){', Math.max(0, i - 40)); return i > 0 && j > 0 && j < i ? rulesOf(inner(plain, j)) : []; })();
const sp = (sel, p) => prop(strip.filter((r) => r.sel.split(',').map((s) => s.trim()).includes(sel)), p);
ok('on a phone the edge of a tab strip that has more tabs fades and carries an arrow, in place of the old mask that left a sliver of the next tab', strip.length >= 4 && sp('.secbar .ptabs.more-r', 'mask-image') === 'none' && sp('.secbar .ptabs.more-r::after', 'position') === 'sticky' && sp('.secbar .ptabs.more-r::after', 'right') === '0' && sp('.secbar .ptabs.more-l::before', 'left') === '0' && /^"›"/.test(sp('.secbar .ptabs.more-r::after', 'content')) && /^"‹"/.test(sp('.secbar .ptabs.more-l::before', 'content')), strip.map((r) => r.sel));
ok('the arrow takes no room (a negative margin as wide as the arrow and a 2 px gap), lets a tap through to the tab under it, and is empty for a screen reader', px(sp('.secbar .ptabs.more-r::after', 'margin-left')) === -(px(sp('.secbar .ptabs.more-r::after', 'width')) + 2) && px(sp('.secbar .ptabs.more-l::before', 'margin-right')) === px(sp('.secbar .ptabs.more-r::after', 'margin-left')) && sp('.secbar .ptabs.more-r::after', 'pointer-events') === 'none' && sp('.secbar .ptabs.more-l::before', 'pointer-events') === 'none' && /content:"›" \/ ""/.test(plain) && /content:"‹" \/ ""/.test(plain));
ok('“More” is its own box beside the strip (the strip ends where it begins), so a tab is never under it', /\.secbar \.ptabs\{flex:0 1 auto;min-width:0;margin:0\}/.test(plain) && /\.smore\{position:relative;flex:none/.test(plain));

/* ── 3. contrast in the light theme ── */
const tokens = (b) => Object.fromEntries([...b.matchAll(/--([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})\b/g)].map((m) => [m[1], m[2]]));
const blk = (re) => { const m = plain.match(re); return m ? m[1] : ''; }; const dark = tokens(blk(/:root\{([\s\S]*?)\n\}/)); const light = tokens(blk(/\[data-theme="light"\]\{([\s\S]*?)\n\}/));
const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)); const over = (fg, a, bg) => fg.map((c, i) => c * a + bg[i] * (1 - a));
const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; const lum = (c) => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const vn = (plain.match(/\[data-theme="light"\] \.vn\{color:(#[0-9a-fA-F]{6})\}/) || [])[1];
ok('light theme: the verse numbers of the reader (10 px) have at least 4.5:1 on the page and on a white card (they had 3.64)', !!vn && ratio(rgb(vn), rgb(light.bg)) >= 4.5 && ratio(rgb(vn), rgb(light.surface)) >= 4.5, vn && ratio(rgb(vn), rgb(light.bg)));
const att = (plain.match(/\[data-theme="light"\] \.tag\.rite-attested\{color:(#[0-9a-fA-F]{6})\}/) || [])[1]; const tint = (bg) => over([63, 217, 160], 0.16, rgb(bg));
ok('light theme: the “Attested” tag (12 px, text on its green tint) has at least 4.5:1 on the page and on a white card (it had 4.45), and the other four grades of the rites keep it too', !!att && ratio(rgb(att), tint(light.bg)) >= 4.5 && ratio(rgb(att), tint(light.surface)) >= 4.5 && [['probable', '#2a54d9', [125, 155, 255], 0.18], ['debated', '#8a5a00', [255, 198, 90], 0.18], ['popular', '#b3263f', [255, 111, 134], 0.16], ['mixed', '#7a2fb0', [209, 139, 255], 0.18]].every(([k, c, t, a]) => new RegExp('\\[data-theme="light"\\] \\.tag\\.rite-' + k + '\\{color:' + c + '\\}').test(plain) && ratio(rgb(c), over(t, a, rgb(light.bg))) >= 4.5));
const rhn = baseProp('.rh-cell .rh-n', 'color'); const cell = (t) => over([127, 140, 170], 0.14, rgb(t.bg)); const rest = (t) => over([127, 140, 170], 0.06, rgb(t.bg));
ok('the rhythm step numbers (11 px) use the secondary text colour and have at least 4.5:1 on a cell in both themes (they had 2.2 and 2.6, through opacity .55)', rhn === 'var(--text2)' && ratio(rgb(light.text2), cell(light)) >= 4.5 && ratio(rgb(dark.text2), cell(dark)) >= 4.5 && ratio(rgb(dark.text2), over([125, 155, 255], 0.22, rgb(dark.bg))) >= 4.5);
const restRule = (plain.match(/\.rh-cell\[data-k="rest"\]\{([^}]*)\}/) || [])[1] || '';
ok('a rest in the rhythm grid is shown by a lighter cell with a dotted rim, not by opacity, and its syllable keeps 4.5:1 in muted text on that lighter cell', !/opacity/.test(restRule) && /border-style:dotted/.test(restRule) && ratio(rgb(light.muted), rest(light)) >= 4.5 && ratio(rgb(dark.muted), rest(dark)) >= 4.5 && /\.rh-cell\[data-k="rest"\] \.rh-bol\{color:var\(--muted\)\}/.test(plain));

/* ── 4. reduced motion ── */
const rm = plain.indexOf('@media (prefers-reduced-motion:reduce){\n  .modal,.modal-back'); const rmBody = rm >= 0 ? inner(plain, rm) : '';
const listed = ['.modal', '.modal-back', '.drawer', '.drawer-back', '.toast', '.overlay', '.acc.open .body'];
ok('by the system setting, a dialog, its backdrop, the preset drawer, its backdrop, a toast, the full-screen overlay and an opened accordion appear at once', rm >= 0 && new RegExp('^\\s*' + listed.map(esc).join(',') + '\\{animation:none!important\\}').test(rmBody.replace(/^\s+/, '  ')) || (rm >= 0 && listed.every((s) => rmBody.includes(s)) && /animation:none!important/.test(rmBody)), rmBody.slice(0, 200));
ok('by Setup’s “Reduce motion” (the class reduce-motion on the page) the same seven stop, and the chevron of an accordion does not turn', listed.every((s) => plain.includes('html.reduce-motion ' + s)) && /html\.reduce-motion \.acc>button svg\{transition:none\}/.test(plain));
ok('the 2.4 s flash that marks where you landed keeps its cue without the fade, in both: the paragraph stays marked for the same 2.4 s, then goes', /@keyframes rdflash-still\{0%,99%\{background:var\(--glow\)\}100%\{background:transparent\}\}/.test(plain) && /\.flash,\.pw\.flash>p\{animation:rdflash-still 2\.4s step-end\}/.test(plain) && /html\.reduce-motion \.flash,html\.reduce-motion \.pw\.flash>p\{animation:rdflash-still 2\.4s step-end\}/.test(plain));

/* ── 5. the voice list (UX-31) ── */
ok('UX-31: the voice list shows the first six voices, best first, with a “Show all voices” button, and the voice already chosen is always in the list (the whole list opens if it is not among the first six)', /const VC_FIRST = 6;/.test(vc) && />Show all voices<\/button>/.test(vc) && /data-vc="more"/.test(vc) && /if \(!showAll && has\(groups, pref\.uri\) && !has\(first, pref\.uri\)\) showAll = true;/.test(vc) && /const shown = showAll \|\| total <= VC_FIRST \? groups : first;/.test(vc) && /moreBtn\.addEventListener\('click', \(\) => \{ showAll = true; fill\(\); q\('select'\)\.focus\(\); \}\)/.test(vc));

/* ── 6. modal(): a name, a Tab that stays inside, and focus given back (UX-14) ── */
const modalSrc = (() => { const a = util.indexOf('let MODAL_N = 0;'); const b = util.indexOf('const confirmBox'); return a > 0 && b > a ? util.slice(a, b) : ''; })();
ok('the helper is in 00-util.js, names its dialog (aria-labelledby points at the title), keeps Escape, handles Tab, and gives focus back', /aria-labelledby="\$\{tid\}"/.test(modalSrc) && /<h2 id="\$\{tid\}">/.test(modalSrc) && /e\.key === 'Escape' && dismissible/.test(modalSrc) && /e\.key !== 'Tab'/.test(modalSrc) && /opener\.focus\(/.test(modalSrc) && /role="dialog" aria-modal="true"/.test(modalSrc));
if (modalSrc) {
  const focusLog = []; const doc = { activeElement: null, listeners: [], body: { appendChild(el) { doc.backs.push(el); } }, backs: [], addEventListener(t, f) { if (t === 'keydown') doc.listeners.push(f); }, removeEventListener(t, f) { doc.listeners = doc.listeners.filter((x) => x !== f); }, querySelectorAll: () => doc.backs };
  const mk = (name) => ({ name, tagName: 'BUTTON', type: 'submit', disabled: false, tabIndex: 0, getClientRects: () => [1], focus() { doc.activeElement = this; focusLog.push(name); } });
  const opener = Object.assign(mk('opener'), { isConnected: true }); doc.activeElement = opener; const cancel = mk('Cancel'); const go = mk('Delete'); const buttons = [cancel, go]; const modalEl = Object.assign(mk('modal'), { tabIndex: -1 });
  let html = ''; const h = (s) => { html = s; const back = { buttons, remove() { doc.backs = doc.backs.filter((x) => x !== back); }, addEventListener() {}, contains: (el) => buttons.includes(el) || el === modalEl, querySelectorAll: () => buttons, getAttribute: () => null }; return back; };
  const $ = (sel) => (sel === 'button.primary' ? null : sel === 'button' ? cancel : sel === '.modal' ? modalEl : null);
  let modal; try { modal = new Function('h', '$', 'document', 'getComputedStyle', modalSrc + '\nreturn modal;')(h, $, doc, () => ({ visibility: 'visible' })); } catch (e) { modal = null; }
  ok('the helper can be run against a small stand-in for the page', typeof modal === 'function');
  if (typeof modal === 'function') {
    let value = 'pending'; modal({ title: 'Delete everything?', html: '<p>x</p>', actions: [{ label: 'Cancel', value: false }, { label: 'Delete', value: true }] }).then((v) => { value = v; });
    ok('the dialog carries role dialog, aria-modal and an aria-labelledby that points at an id on the h2', /role="dialog" aria-modal="true" aria-labelledby="(mdlT\d+)"/.test(html) && new RegExp('<h2 id="' + (html.match(/aria-labelledby="(mdlT\d+)"/) || [])[1] + '">Delete everything\\?</h2>').test(html));
    ok('a dialog with no title is not given a label that points nowhere', (() => { let s2 = ''; const h2 = (s) => { s2 = s; return h(s); }; try { const m2 = new Function('h', '$', 'document', 'getComputedStyle', modalSrc + '\nreturn modal;')(h2, $, doc, () => ({ visibility: 'visible' })); m2({ html: '<p>x</p>' }); } catch (e) { return false; } return !/aria-labelledby/.test(s2); })());
    ok('the first button (Cancel, the safe one) has the focus when it opens', doc.activeElement === cancel);
    const press = (shift) => { let stopped = false; doc.listeners.slice().forEach((f) => f({ key: 'Tab', shiftKey: shift, preventDefault() { stopped = true; } })); return stopped; };
    doc.activeElement = go; ok('Tab on the last button goes to the first', press(false) === true && doc.activeElement === cancel);
    doc.activeElement = cancel; ok('Shift+Tab on the first button goes to the last', press(true) === true && doc.activeElement === go);
    doc.activeElement = cancel; ok('Tab in the middle is left to the browser', press(false) === false && doc.activeElement === cancel);
    doc.activeElement = opener; ok('if the focus has got outside the dialog, Tab brings it back in', press(false) === true && doc.activeElement === cancel);
    doc.listeners.slice().forEach((f) => f({ key: 'Escape', preventDefault() {} }));
    ok('Escape closes it and the focus goes back to the control that opened it', doc.activeElement === opener && !doc.backs.length);
    setTimeout(() => { ok('the promise of the closed dialog was resolved with undefined', value === undefined); finish(); }, 0);
  } else finish();
} else finish();

function finish() { console.log(`tap: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0); }
